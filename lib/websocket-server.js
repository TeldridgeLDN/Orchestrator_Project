import { WebSocketServer } from 'ws';
import { createLogger } from './utils/logger.js';

const logger = createLogger('WebSocketServer');

/**
 * WebSocket Server for real-time dashboard updates
 * Manages client connections and broadcasts updates to connected clients
 */
class DashboardWebSocketServer {
  constructor(options = {}) {
    this.port = options.port || 3001;
    this.wss = null;
    this.clients = new Set();
    this.isRunning = false;
    this.connectionCount = 0;
    this.messageCount = 0;
    this.startTime = null;
    
    // Resource limits
    this.resourceLimits = {
      maxClients: options.maxClients || 1000,
      maxMessageSize: options.maxMessageSize || 1024 * 1024, // 1MB
      maxMessagesPerSecond: options.maxMessagesPerSecond || 100,
      connectionTimeout: options.connectionTimeout || 60000, // 60 seconds
      idleTimeout: options.idleTimeout || 300000, // 5 minutes
      messageQueueSize: options.messageQueueSize || 1000
    };
    
    // Resource monitoring
    this.resourceStats = {
      peakMemoryUsage: 0,
      totalBytesReceived: 0,
      totalBytesSent: 0,
      rejectedConnections: 0,
      timeoutDisconnections: 0
    };
    
    // Server options
    this.options = {
      clientTracking: true,
      maxPayload: this.resourceLimits.maxMessageSize,
      perMessageDeflate: {
        zlibDeflateOptions: {
          chunkSize: 1024,
          memLevel: 7,
          level: 3
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024
        },
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
        serverMaxWindowBits: 10,
        concurrencyLimit: 10,
        threshold: 1024
      },
      ...options.serverOptions
    };
  }

  /**
   * Start the WebSocket server
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isRunning) {
      logger.warn('WebSocket server is already running');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({ 
          port: this.port,
          ...this.options
        });

        this.wss.on('listening', () => {
          this.isRunning = true;
          this.startTime = Date.now();
          logger.info(`WebSocket server listening on port ${this.port}`);
          resolve();
        });

        this.wss.on('connection', (ws, req) => {
          this.handleConnection(ws, req);
        });

        this.wss.on('error', (error) => {
          logger.error('WebSocket server error:', error);
          if (!this.isRunning) {
            reject(error);
          }
        });

      } catch (error) {
        logger.error('Failed to start WebSocket server:', error);
        reject(error);
      }
    });
  }

  /**
   * Handle new WebSocket connection
   * @param {WebSocket} ws - WebSocket connection
   * @param {IncomingMessage} req - HTTP request object
   */
  handleConnection(ws, req) {
    // Check connection limits
    if (this.clients.size >= this.resourceLimits.maxClients) {
      logger.warn(`Connection rejected: Max clients (${this.resourceLimits.maxClients}) reached`);
      this.resourceStats.rejectedConnections++;
      ws.close(1008, 'Server at capacity');
      return;
    }
    
    const clientId = ++this.connectionCount;
    const clientIp = req.socket.remoteAddress;
    
    logger.info(`Client ${clientId} connected from ${clientIp}`);
    
    // Add client to tracking set
    this.clients.add(ws);
    
    // Store client metadata
    ws.clientId = clientId;
    ws.connectedAt = Date.now();
    ws.lastActivity = Date.now();
    ws.isAlive = true;
    ws.messageCount = 0;
    ws.bytesReceived = 0;
    ws.bytesSent = 0;
    
    // Set connection timeout
    this.setConnectionTimeout(ws);

    // Send welcome message with client ID
    this.sendToClient(ws, {
      type: 'connection',
      data: {
        clientId,
        timestamp: Date.now(),
        message: 'Connected to dashboard WebSocket server'
      }
    });

    // Set up ping/pong heartbeat
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle incoming messages from client
    ws.on('message', (data) => {
      try {
        // Update activity tracking
        ws.lastActivity = Date.now();
        ws.bytesReceived += data.length;
        this.resourceStats.totalBytesReceived += data.length;
        
        // Reset connection timeout
        this.resetConnectionTimeout(ws);
        
        const message = JSON.parse(data.toString());
        this.handleClientMessage(ws, message);
      } catch (error) {
        logger.error(`Error parsing message from client ${clientId}:`, error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    // Handle client disconnection
    ws.on('close', (code, reason) => {
      logger.info(`Client ${clientId} disconnected (code: ${code}, reason: ${reason})`);
      this.clearConnectionTimeout(ws);
      this.clients.delete(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error(`Error with client ${clientId}:`, error);
      this.clearConnectionTimeout(ws);
      this.clients.delete(ws);
    });
  }

  /**
   * Handle message received from client
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} message - Parsed message object
   */
  handleClientMessage(ws, message) {
    this.messageCount++;
    
    logger.debug(`Received message from client ${ws.clientId}:`, message.type);

    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: Date.now() });
        break;
        
      case 'subscribe':
        // Handle subscription to specific update types
        this.handleSubscription(ws, message.data);
        break;
        
      case 'unsubscribe':
        // Handle unsubscription
        this.handleUnsubscription(ws, message.data);
        break;
        
      case 'request':
        // Handle data request - pass full message to preserve ID for correlationId
        this.handleDataRequest(ws, message);
        break;
        
      default:
        logger.warn(`Unknown message type from client ${ws.clientId}: ${message.type}`);
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle subscription request
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} data - Subscription data
   */
  handleSubscription(ws, data) {
    if (!ws.subscriptions) {
      ws.subscriptions = new Set();
    }
    
    const channel = data?.channel;
    if (channel) {
      ws.subscriptions.add(channel);
      logger.info(`Client ${ws.clientId} subscribed to ${channel}`);
      this.sendToClient(ws, {
        type: 'subscribed',
        data: { channel, timestamp: Date.now() }
      });
    } else {
      this.sendError(ws, 'Channel not specified in subscription');
    }
  }

  /**
   * Handle unsubscription request
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} data - Unsubscription data
   */
  handleUnsubscription(ws, data) {
    const channel = data?.channel;
    if (channel && ws.subscriptions) {
      ws.subscriptions.delete(channel);
      logger.debug(`Client ${ws.clientId} unsubscribed from ${channel}`);
      this.sendToClient(ws, {
        type: 'unsubscribed',
        data: { channel, timestamp: Date.now() }
      });
    }
  }

  /**
   * Handle data request from client
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} message - Full request message including ID
   */
  handleDataRequest(ws, message) {
    // Call custom request handler if set, otherwise use default
    if (this.onDataRequest) {
      this.onDataRequest(ws, message);
    } else {
      // Default handler
      logger.debug(`Data request from client ${ws.clientId}:`, message.data);
      this.sendToClient(ws, {
        type: 'response',
        data: { 
          requestId: message.data?.requestId,
          status: 'pending',
          message: 'Data request handler not yet implemented'
        }
      });
    }
  }
  
  /**
   * Set custom data request handler
   * @param {Function} handler - Handler function (ws, message) => void
   */
  setDataRequestHandler(handler) {
    this.onDataRequest = handler;
  }

  /**
   * Send message to a specific client
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} message - Message object to send
   */
  sendToClient(ws, message) {
    if (ws.readyState === 1) { // WebSocket.OPEN
      try {
        const data = JSON.stringify(message);
        ws.send(data);
        ws.bytesSent += data.length;
        this.resourceStats.totalBytesSent += data.length;
      } catch (error) {
        logger.error(`Error sending message to client ${ws.clientId}:`, error);
      }
    }
  }

  /**
   * Set connection timeout for a client
   * @param {WebSocket} ws - WebSocket connection
   */
  setConnectionTimeout(ws) {
    ws.connectionTimeout = setTimeout(() => {
      const idleTime = Date.now() - ws.lastActivity;
      if (idleTime >= this.resourceLimits.idleTimeout) {
        logger.info(`Client ${ws.clientId} idle timeout (${idleTime}ms)`);
        this.resourceStats.timeoutDisconnections++;
        ws.close(1000, 'Idle timeout');
        this.clients.delete(ws);
      } else {
        // Reset timeout if still active
        this.setConnectionTimeout(ws);
      }
    }, this.resourceLimits.connectionTimeout);
  }

  /**
   * Reset connection timeout for a client
   * @param {WebSocket} ws - WebSocket connection
   */
  resetConnectionTimeout(ws) {
    if (ws.connectionTimeout) {
      clearTimeout(ws.connectionTimeout);
    }
    this.setConnectionTimeout(ws);
  }

  /**
   * Clear connection timeout for a client
   * @param {WebSocket} ws - WebSocket connection
   */
  clearConnectionTimeout(ws) {
    if (ws.connectionTimeout) {
      clearTimeout(ws.connectionTimeout);
      ws.connectionTimeout = null;
    }
  }

  /**
   * Send error message to client
   * @param {WebSocket} ws - WebSocket connection
   * @param {string} errorMessage - Error message
   */
  sendError(ws, errorMessage) {
    this.sendToClient(ws, {
      type: 'error',
      data: {
        message: errorMessage,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Broadcast message to all connected clients
   * @param {Object} message - Message to broadcast
   * @param {string} [channel] - Optional channel filter
   */
  broadcast(message, channel = null) {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    for (const client of this.clients) {
      // Check if client is subscribed to channel (if specified)
      if (channel && client.subscriptions && !client.subscriptions.has(channel)) {
        continue;
      }

      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(messageStr);
          sentCount++;
        } catch (error) {
          logger.error(`Error broadcasting to client ${client.clientId}:`, error);
        }
      }
    }

    logger.debug(`Broadcast message to ${sentCount} clients${channel ? ` on channel ${channel}` : ''}`);
  }

  /**
   * Start heartbeat mechanism to detect dead connections
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      for (const client of this.clients) {
        if (client.isAlive === false) {
          logger.info(`Terminating inactive client ${client.clientId}`);
          client.terminate();
          this.clients.delete(client);
          continue;
        }
        
        client.isAlive = false;
        client.ping();
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop heartbeat mechanism
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Start resource monitoring
   */
  startResourceMonitoring() {
    this.resourceMonitorInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      
      // Update peak memory usage
      if (memUsage.heapUsed > this.resourceStats.peakMemoryUsage) {
        this.resourceStats.peakMemoryUsage = memUsage.heapUsed;
      }
      
      // Check for idle clients
      const now = Date.now();
      for (const client of this.clients) {
        const idleTime = now - client.lastActivity;
        if (idleTime > this.resourceLimits.idleTimeout) {
          logger.info(`Disconnecting idle client ${client.clientId} (idle: ${idleTime}ms)`);
          this.resourceStats.timeoutDisconnections++;
          client.close(1000, 'Idle timeout');
          this.clients.delete(client);
        }
      }
      
      // Log resource statistics periodically
      if (this.clients.size > 0) {
        logger.debug('Resource stats:', {
          memory: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
          clients: this.clients.size,
          messages: this.messageCount,
          bandwidth: `${(this.resourceStats.totalBytesSent / 1024 / 1024).toFixed(2)}MB sent`
        });
      }
    }, 60000); // Check every minute
    
    logger.debug('Resource monitoring started');
  }

  /**
   * Stop resource monitoring
   */
  stopResourceMonitoring() {
    if (this.resourceMonitorInterval) {
      clearInterval(this.resourceMonitorInterval);
      this.resourceMonitorInterval = null;
      logger.debug('Resource monitoring stopped');
    }
  }

  /**
   * Get server statistics
   * @returns {Object} Server statistics
   */
  getStats() {
    const memUsage = process.memoryUsage();
    
    return {
      isRunning: this.isRunning,
      port: this.port,
      connectedClients: this.clients.size,
      totalConnections: this.connectionCount,
      totalMessages: this.messageCount,
      uptime: this.isRunning ? Date.now() - this.startTime : 0,
      resources: {
        limits: this.resourceLimits,
        memory: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          peakUsage: this.resourceStats.peakMemoryUsage
        },
        bandwidth: {
          received: this.resourceStats.totalBytesReceived,
          sent: this.resourceStats.totalBytesSent
        },
        rejectedConnections: this.resourceStats.rejectedConnections,
        timeoutDisconnections: this.resourceStats.timeoutDisconnections
      }
    };
  }

  /**
   * Stop the WebSocket server
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isRunning) {
      logger.warn('WebSocket server is not running');
      return;
    }

    return new Promise((resolve) => {
      this.stopHeartbeat();
      this.stopResourceMonitoring();

      // Clear all connection timeouts
      for (const client of this.clients) {
        this.clearConnectionTimeout(client);
        client.close(1000, 'Server shutting down');
      }
      this.clients.clear();

      // Close the server
      if (this.wss) {
        this.wss.close(() => {
          this.isRunning = false;
          logger.info('WebSocket server stopped');
          
          // Log final stats
          const finalStats = this.getStats();
          logger.info('Final server statistics:', {
            totalConnections: finalStats.totalConnections,
            totalMessages: finalStats.totalMessages,
            bandwidthSent: `${(finalStats.resources.bandwidth.sent / 1024 / 1024).toFixed(2)}MB`,
            peakMemory: `${(finalStats.resources.memory.peakUsage / 1024 / 1024).toFixed(2)}MB`,
            rejections: finalStats.resources.rejectedConnections,
            timeouts: finalStats.resources.timeoutDisconnections
          });
          
          resolve();
        });
      } else {
        this.isRunning = false;
        resolve();
      }
    });
  }
}

export { DashboardWebSocketServer };

