/**
 * Dashboard Server Integration
 * Connects WebSocket server, file watchers, and protocol for real-time dashboard updates
 * @module lib/dashboard-server
 */

import { DashboardWebSocketServer } from './websocket-server.js';
import { FileWatcherManager } from './file-watcher.js';
import { 
  createMessage, 
  ProtocolSerializer,
  MessagePriority,
  SubscriptionChannel 
} from './websocket-protocol.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger('DashboardServer');

/**
 * Dashboard Server
 * Integrates WebSocket server with file watchers and protocol
 * Provides real-time updates to dashboard clients
 */
export class DashboardServer {
  constructor(options = {}) {
    this.port = options.port || 3001;
    this.isRunning = false;
    
    // Initialize WebSocket server
    this.wsServer = new DashboardWebSocketServer({
      port: this.port,
      ...options.wsOptions
    });

    // Initialize file watcher
    this.fileWatcher = new FileWatcherManager(options.watcherOptions);

    // Broadcast statistics
    this.stats = {
      totalBroadcasts: 0,
      totalMessages: 0,
      failedBroadcasts: 0,
      averageBroadcastTime: 0,
      lastBroadcast: null
    };

    // Broadcast queue for rate limiting
    this.broadcastQueue = [];
    this.isProcessingQueue = false;
    this.queueProcessInterval = options.queueProcessInterval || 100; // ms

    // Rate limiting
    this.rateLimitConfig = {
      maxMessagesPerSecond: options.maxMessagesPerSecond || 100,
      currentCount: 0,
      resetInterval: null
    };
  }

  /**
   * Start the dashboard server
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Dashboard server is already running');
      return;
    }

    try {
      logger.info('Starting dashboard server...');

      // Start WebSocket server
      await this.wsServer.start();
      logger.info(`WebSocket server started on port ${this.port}`);

      // Set up custom client handlers IMMEDIATELY after server start
      this.setupClientHandlers();

      // Start file watchers
      await this.fileWatcher.start();
      logger.info('File watchers started');

      // Connect file watcher events to broadcast
      this.connectFileWatcherEvents();

      // Start heartbeat for WebSocket server
      this.wsServer.startHeartbeat();

      // Start rate limit reset interval
      this.startRateLimitReset();

      // Start queue processor
      this.startQueueProcessor();

      this.isRunning = true;
      logger.info('Dashboard server is running');
    } catch (error) {
      logger.error('Failed to start dashboard server:', error);
      throw error;
    }
  }

  /**
   * Connect file watcher events to WebSocket broadcast
   */
  connectFileWatcherEvents() {
    // Config change events
    this.fileWatcher.on('config-change', async (event) => {
      const message = createMessage.configChange(event.data);
      await this.broadcast(message, SubscriptionChannel.CONFIG);
    });

    // Log change events
    this.fileWatcher.on('log-change', async (event) => {
      const message = createMessage.logChange(event.data);
      await this.broadcast(message, SubscriptionChannel.LOGS);
    });

    // Log added events
    this.fileWatcher.on('log-added', async (event) => {
      const message = createMessage.statusUpdate({
        component: 'logs',
        status: 'new-file',
        message: `New log file: ${event.data.filename}`,
        details: event.data
      });
      await this.broadcast(message, SubscriptionChannel.LOGS);
    });

    // Log removed events
    this.fileWatcher.on('log-removed', async (event) => {
      const message = createMessage.statusUpdate({
        component: 'logs',
        status: 'file-removed',
        message: `Log file removed: ${event.data.filename}`,
        details: event.data
      });
      await this.broadcast(message, SubscriptionChannel.LOGS);
    });

    // Project config change events
    this.fileWatcher.on('project-config-change', async (event) => {
      const message = createMessage.statusUpdate({
        component: 'project',
        status: 'config-changed',
        message: 'Project configuration updated',
        details: event.data
      });
      await this.broadcast(message, SubscriptionChannel.CONFIG);
    });

    logger.info('File watcher events connected to broadcast');
  }

  /**
   * Set up client message handlers
   */
  setupClientHandlers() {
    // Set custom data request handler
    // Note: 'message' here is the full request message from the client
    this.wsServer.setDataRequestHandler(async (ws, message) => {
      logger.info(`[DASHBOARD] Processing client request: ${message.data?.requestType}`);
      await this.handleClientRequest(ws, message);
    });

    // Override connection handler to send initial state
    const originalOnConnection = this.wsServer.wss.listeners('connection')[0];
    this.wsServer.wss.removeAllListeners('connection');
    
    this.wsServer.wss.on('connection', async (ws, req) => {
      // Call original connection handler
      if (originalOnConnection) {
        originalOnConnection.call(this.wsServer.wss, ws, req);
      }
      
      // Send initial state after a brief delay to ensure client is ready
      setTimeout(() => this.sendInitialState(ws), 100);
    });

    logger.debug('Client message handlers configured');
  }

  /**
   * Handle client request messages
   * @param {WebSocket} ws - Client WebSocket connection
   * @param {Object} message - Request message
   */
  async handleClientRequest(ws, message) {
    const { requestType, params } = message.data || {};
    const correlationId = message.id;

    try {
      let responseData = {};

      switch (requestType) {
        case 'getStats':
          responseData = this.getStats();
          break;

        case 'getConfig':
          responseData = await this.getCurrentConfig();
          break;

        case 'getLogs':
          responseData = await this.getRecentLogs(params);
          break;

        case 'getFileWatcherStatus':
          responseData = this.fileWatcher.getStats();
          break;

        case 'getConnectedClients':
          responseData = {
            count: this.wsServer.clients.size,
            clients: Array.from(this.wsServer.clients).map(c => ({
              id: c.clientId,
              connectedAt: c.connectedAt,
              subscriptions: c.subscriptions ? Array.from(c.subscriptions) : []
            }))
          };
          break;

        case 'refreshState':
          await this.sendInitialState(ws);
          responseData = { refreshed: true };
          break;

        default:
          throw new Error(`Unknown request type: ${requestType}`);
      }

      const response = createMessage.response(
        { success: true, data: responseData },
        { correlationId }
      );

      logger.info(`[DASHBOARD] Sending response for ${requestType}, correlationId: ${correlationId}`);
      logger.info(`[DASHBOARD] Response type: ${response.type}, has correlationId: ${!!response.correlationId}`);
      this.wsServer.sendToClient(ws, response);
      logger.info(`[DASHBOARD] Response sent`);
    } catch (error) {
      logger.error(`Error handling client request ${requestType}:`, error);
      
      const errorResponse = createMessage.error(
        {
          message: error.message,
          code: 'REQUEST_FAILED',
          details: { requestType }
        },
        { correlationId }
      );

      this.wsServer.sendToClient(ws, errorResponse);
    }
  }

  /**
   * Send initial state to a newly connected client
   * @param {WebSocket} ws - Client WebSocket connection
   */
  async sendInitialState(ws) {
    try {
      logger.debug(`Sending initial state to client ${ws.clientId}`);

      // Send server stats
      const statsMessage = createMessage.statusUpdate({
        component: 'server',
        status: 'ready',
        message: 'Dashboard server ready',
        details: this.getStats()
      });
      this.wsServer.sendToClient(ws, statsMessage);

      // Send file watcher status
      const watcherMessage = createMessage.statusUpdate({
        component: 'file-watcher',
        status: 'active',
        message: 'File watchers active',
        details: this.fileWatcher.getStats()
      });
      this.wsServer.sendToClient(ws, watcherMessage);

      // Send current config if available
      try {
        const config = await this.getCurrentConfig();
        if (config) {
          const configMessage = createMessage.configChange({
            path: config.path,
            filename: config.filename,
            config: config.data
          });
          this.wsServer.sendToClient(ws, configMessage);
        }
      } catch (error) {
        logger.debug('No config available for initial state:', error.message);
      }

      logger.debug(`Initial state sent to client ${ws.clientId}`);
    } catch (error) {
      logger.error(`Error sending initial state to client ${ws.clientId}:`, error);
    }
  }

  /**
   * Get current configuration
   * @returns {Promise<Object>} Current configuration
   */
  async getCurrentConfig() {
    const configPath = this.fileWatcher.watchPaths.config;
    
    if (!configPath) {
      return null;
    }

    try {
      const { readFile } = await import('fs/promises');
      const content = await readFile(configPath, 'utf-8');
      
      return {
        path: configPath,
        filename: configPath.split('/').pop(),
        data: JSON.parse(content)
      };
    } catch (error) {
      logger.warn(`Could not read config from ${configPath}:`, error.message);
      return null;
    }
  }

  /**
   * Get recent log entries
   * @param {Object} params - Request parameters
   * @returns {Promise<Object>} Recent logs
   */
  async getRecentLogs(params = {}) {
    const { limit = 50, filename } = params;
    const logPaths = this.fileWatcher.watchPaths.logs || [];
    
    if (logPaths.length === 0) {
      return { logs: [], message: 'No log directories configured' };
    }

    try {
      const { readdir, readFile } = await import('fs/promises');
      const logs = [];

      for (const logDir of logPaths) {
        try {
          const files = await readdir(logDir);
          const logFiles = files.filter(f => f.endsWith('.log'));

          for (const file of logFiles) {
            if (filename && file !== filename) {
              continue;
            }

            const filePath = `${logDir}/${file}`;
            const content = await readFile(filePath, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim());
            
            logs.push({
              filename: file,
              path: filePath,
              recentLines: lines.slice(-limit)
            });
          }
        } catch (error) {
          logger.debug(`Could not read logs from ${logDir}:`, error.message);
        }
      }

      return { logs, count: logs.length };
    } catch (error) {
      logger.error('Error getting recent logs:', error);
      return { logs: [], error: error.message };
    }
  }

  /**
   * Broadcast a message to connected clients
   * @param {Object|ProtocolMessage} message - Message to broadcast
   * @param {string} [channel] - Optional channel filter
   * @param {Object} [options] - Broadcast options
   * @returns {Promise<Object>} Broadcast result
   */
  async broadcast(message, channel = null, options = {}) {
    const startTime = Date.now();

    try {
      // Check rate limiting
      if (this.rateLimitConfig.currentCount >= this.rateLimitConfig.maxMessagesPerSecond) {
        logger.warn('Rate limit reached, queueing message');
        return this.queueBroadcast(message, channel, options);
      }

      // Serialize message
      const serialized = ProtocolSerializer.serialize(message);
      
      // Get broadcast statistics
      const clientCount = this.wsServer.clients.size;
      let sentCount = 0;
      let failedCount = 0;

      // Broadcast to WebSocket clients
      for (const client of this.wsServer.clients) {
        // Check subscription filter
        if (channel && client.subscriptions && !client.subscriptions.has(channel) && !client.subscriptions.has('*')) {
          continue;
        }

        // Check client state
        if (client.readyState === 1) { // WebSocket.OPEN
          try {
            client.send(serialized);
            sentCount++;
          } catch (error) {
            logger.error(`Failed to send to client ${client.clientId}:`, error);
            failedCount++;
          }
        }
      }

      // Update rate limit counter
      this.rateLimitConfig.currentCount++;

      // Update statistics
      const broadcastTime = Date.now() - startTime;
      this.updateStats(broadcastTime, sentCount, failedCount);

      logger.debug(`Broadcast completed: ${sentCount}/${clientCount} clients${channel ? ` on channel ${channel}` : ''} (${broadcastTime}ms)`);

      return {
        success: true,
        sentCount,
        failedCount,
        totalClients: clientCount,
        broadcastTime,
        channel
      };
    } catch (error) {
      logger.error('Broadcast error:', error);
      this.stats.failedBroadcasts++;
      
      return {
        success: false,
        error: error.message,
        sentCount: 0,
        failedCount: 0
      };
    }
  }

  /**
   * Queue a broadcast for later processing
   * @param {Object} message - Message to queue
   * @param {string} channel - Channel filter
   * @param {Object} options - Broadcast options
   * @returns {Promise<Object>} Queue result
   */
  async queueBroadcast(message, channel, options) {
    this.broadcastQueue.push({ message, channel, options, queuedAt: Date.now() });
    
    return {
      success: true,
      queued: true,
      queueSize: this.broadcastQueue.length
    };
  }

  /**
   * Start queue processor
   */
  startQueueProcessor() {
    if (this.queueProcessorInterval) {
      return;
    }

    this.queueProcessorInterval = setInterval(async () => {
      if (this.isProcessingQueue || this.broadcastQueue.length === 0) {
        return;
      }

      this.isProcessingQueue = true;

      try {
        const batchSize = Math.min(10, this.broadcastQueue.length);
        const batch = this.broadcastQueue.splice(0, batchSize);

        for (const item of batch) {
          await this.broadcast(item.message, item.channel, item.options);
        }
      } catch (error) {
        logger.error('Error processing broadcast queue:', error);
      } finally {
        this.isProcessingQueue = false;
      }
    }, this.queueProcessInterval);

    logger.debug('Broadcast queue processor started');
  }

  /**
   * Stop queue processor
   */
  stopQueueProcessor() {
    if (this.queueProcessorInterval) {
      clearInterval(this.queueProcessorInterval);
      this.queueProcessorInterval = null;
      logger.debug('Broadcast queue processor stopped');
    }
  }

  /**
   * Start rate limit reset interval
   */
  startRateLimitReset() {
    if (this.rateLimitConfig.resetInterval) {
      return;
    }

    this.rateLimitConfig.resetInterval = setInterval(() => {
      this.rateLimitConfig.currentCount = 0;
    }, 1000); // Reset every second

    logger.debug('Rate limit reset interval started');
  }

  /**
   * Stop rate limit reset interval
   */
  stopRateLimitReset() {
    if (this.rateLimitConfig.resetInterval) {
      clearInterval(this.rateLimitConfig.resetInterval);
      this.rateLimitConfig.resetInterval = null;
      logger.debug('Rate limit reset interval stopped');
    }
  }

  /**
   * Update broadcast statistics
   * @param {number} broadcastTime - Time taken for broadcast
   * @param {number} sentCount - Number of successful sends
   * @param {number} failedCount - Number of failed sends
   */
  updateStats(broadcastTime, sentCount, failedCount) {
    this.stats.totalBroadcasts++;
    this.stats.totalMessages += sentCount;
    this.stats.failedBroadcasts += failedCount;
    this.stats.lastBroadcast = Date.now();

    // Update rolling average
    const alpha = 0.1; // Smoothing factor
    this.stats.averageBroadcastTime = 
      (alpha * broadcastTime) + ((1 - alpha) * this.stats.averageBroadcastTime);
  }

  /**
   * Broadcast to specific client(s)
   * @param {string|string[]} clientIds - Client ID(s) to send to
   * @param {Object} message - Message to send
   * @returns {Promise<Object>} Broadcast result
   */
  async broadcastToClients(clientIds, message) {
    const ids = Array.isArray(clientIds) ? clientIds : [clientIds];
    const serialized = ProtocolSerializer.serialize(message);
    
    let sentCount = 0;
    let failedCount = 0;

    for (const client of this.wsServer.clients) {
      if (ids.includes(client.clientId) && client.readyState === 1) {
        try {
          client.send(serialized);
          sentCount++;
        } catch (error) {
          logger.error(`Failed to send to client ${client.clientId}:`, error);
          failedCount++;
        }
      }
    }

    return {
      success: sentCount > 0,
      sentCount,
      failedCount,
      targetClients: ids.length
    };
  }

  /**
   * Broadcast with priority
   * Messages with higher priority are sent immediately
   * @param {Object} message - Message to broadcast
   * @param {number} priority - Message priority
   * @param {string} channel - Channel filter
   * @returns {Promise<Object>} Broadcast result
   */
  async broadcastWithPriority(message, priority, channel = null) {
    if (priority >= MessagePriority.HIGH) {
      // High priority messages bypass rate limiting
      const savedCount = this.rateLimitConfig.currentCount;
      this.rateLimitConfig.currentCount = 0;
      
      const result = await this.broadcast(message, channel);
      
      this.rateLimitConfig.currentCount = savedCount;
      return result;
    }

    return this.broadcast(message, channel);
  }

  /**
   * Get server statistics
   * @returns {Object} Server statistics
   */
  getStats() {
    return {
      server: {
        isRunning: this.isRunning,
        port: this.port,
        uptime: this.isRunning ? Date.now() - this.startTime : 0
      },
      websocket: this.wsServer.getStats(),
      fileWatcher: this.fileWatcher.getStats(),
      broadcast: {
        ...this.stats,
        queueSize: this.broadcastQueue.length,
        rateLimitRemaining: this.rateLimitConfig.maxMessagesPerSecond - this.rateLimitConfig.currentCount
      }
    };
  }

  /**
   * Stop the dashboard server
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isRunning) {
      logger.warn('Dashboard server is not running');
      return;
    }

    try {
      logger.info('Stopping dashboard server...');

      // Stop queue processor
      this.stopQueueProcessor();

      // Stop rate limit reset
      this.stopRateLimitReset();

      // Stop file watchers
      await this.fileWatcher.stop();
      logger.info('File watchers stopped');

      // Stop WebSocket server
      await this.wsServer.stop();
      logger.info('WebSocket server stopped');

      // Clear queues
      this.broadcastQueue = [];

      this.isRunning = false;
      logger.info('Dashboard server stopped');
    } catch (error) {
      logger.error('Error stopping dashboard server:', error);
      throw error;
    }
  }

  /**
   * Send a custom message to all clients
   * @param {string} type - Message type
   * @param {Object} data - Message data
   * @param {string} channel - Optional channel
   * @returns {Promise<Object>} Broadcast result
   */
  async sendCustomMessage(type, data, channel = null) {
    const message = {
      type,
      data,
      timestamp: Date.now(),
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    return this.broadcast(message, channel);
  }
}

export default DashboardServer;

