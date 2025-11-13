import chokidar from 'chokidar';
import { readFile } from 'fs/promises';
import path from 'path';
import os from 'os';
import { createLogger } from './utils/logger.js';

const logger = createLogger('FileWatcher');

/**
 * File Watcher for Dashboard Real-time Updates
 * Monitors configuration files and logs, broadcasting changes via WebSocket
 */
class FileWatcherManager {
  constructor(options = {}) {
    this.watchers = new Map();
    this.isActive = false;
    this.eventHandlers = new Map();
    
    // Default paths to watch
    this.watchPaths = options.watchPaths || {
      config: path.join(os.homedir(), '.claude', 'config.json'),
      logs: [
        path.join(process.cwd(), 'outputs', 'podcast-learning', 'logs'),
        path.join(process.cwd(), 'tests')
      ],
      projectConfig: path.join(process.cwd(), 'package.json')
    };

    // Chokidar options for efficient watching
    this.chokidarOptions = {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      },
      ignored: [
        /(^|[\/\\])\../, // dot files
        /node_modules/,
        /\.git/
      ],
      ...options.chokidarOptions
    };

    // Event statistics
    this.stats = {
      configChanges: 0,
      logChanges: 0,
      totalEvents: 0,
      lastEvent: null
    };
  }

  /**
   * Start watching files
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isActive) {
      logger.warn('File watchers already active');
      return;
    }

    try {
      // Watch config file
      await this.watchConfig();

      // Watch log directories
      await this.watchLogs();

      // Watch project config
      await this.watchProjectConfig();

      this.isActive = true;
      logger.info('File watchers started successfully');
      logger.info(`Watching paths:`, {
        config: this.watchPaths.config,
        logs: this.watchPaths.logs,
        projectConfig: this.watchPaths.projectConfig
      });
    } catch (error) {
      logger.error('Failed to start file watchers:', error);
      throw error;
    }
  }

  /**
   * Watch the main configuration file
   * @returns {Promise<void>}
   */
  async watchConfig() {
    const configPath = this.watchPaths.config;
    
    const watcher = chokidar.watch(configPath, this.chokidarOptions);
    
    watcher.on('change', async (filePath) => {
      await this.handleConfigChange(filePath);
    });

    watcher.on('error', (error) => {
      logger.error(`Config watcher error for ${configPath}:`, error);
    });

    this.watchers.set('config', watcher);
    logger.debug(`Config watcher initialized for: ${configPath}`);
  }

  /**
   * Watch log directories
   * @returns {Promise<void>}
   */
  async watchLogs() {
    const logPaths = this.watchPaths.logs;
    
    const watcher = chokidar.watch(logPaths, {
      ...this.chokidarOptions,
      depth: 2, // Watch subdirectories up to 2 levels
      ignored: /(^|[\/\\])\../
    });

    watcher.on('add', async (filePath) => {
      if (filePath.endsWith('.log')) {
        await this.handleLogFileAdded(filePath);
      }
    });

    watcher.on('change', async (filePath) => {
      if (filePath.endsWith('.log')) {
        await this.handleLogFileChanged(filePath);
      }
    });

    watcher.on('unlink', async (filePath) => {
      if (filePath.endsWith('.log')) {
        await this.handleLogFileRemoved(filePath);
      }
    });

    watcher.on('error', (error) => {
      logger.error('Log watcher error:', error);
    });

    this.watchers.set('logs', watcher);
    logger.debug(`Log watcher initialized for: ${logPaths.join(', ')}`);
  }

  /**
   * Watch project configuration file
   * @returns {Promise<void>}
   */
  async watchProjectConfig() {
    const projectConfigPath = this.watchPaths.projectConfig;
    
    const watcher = chokidar.watch(projectConfigPath, this.chokidarOptions);
    
    watcher.on('change', async (filePath) => {
      await this.handleProjectConfigChange(filePath);
    });

    watcher.on('error', (error) => {
      logger.error(`Project config watcher error for ${projectConfigPath}:`, error);
    });

    this.watchers.set('projectConfig', watcher);
    logger.debug(`Project config watcher initialized for: ${projectConfigPath}`);
  }

  /**
   * Handle configuration file change
   * @param {string} filePath - Path to changed file
   */
  async handleConfigChange(filePath) {
    try {
      this.stats.configChanges++;
      this.stats.totalEvents++;
      this.stats.lastEvent = Date.now();

      logger.info(`Config file changed: ${filePath}`);

      const content = await readFile(filePath, 'utf-8');
      const config = JSON.parse(content);

      const event = {
        type: 'config-change',
        data: {
          path: filePath,
          filename: path.basename(filePath),
          config,
          timestamp: Date.now()
        }
      };

      await this.emitEvent('config-change', event);
    } catch (error) {
      logger.error(`Error handling config change for ${filePath}:`, error);
    }
  }

  /**
   * Handle log file added
   * @param {string} filePath - Path to new log file
   */
  async handleLogFileAdded(filePath) {
    try {
      logger.info(`Log file added: ${filePath}`);

      const event = {
        type: 'log-added',
        data: {
          path: filePath,
          filename: path.basename(filePath),
          directory: path.dirname(filePath),
          timestamp: Date.now()
        }
      };

      await this.emitEvent('log-added', event);
    } catch (error) {
      logger.error(`Error handling log file added ${filePath}:`, error);
    }
  }

  /**
   * Handle log file change
   * @param {string} filePath - Path to changed log file
   */
  async handleLogFileChanged(filePath) {
    try {
      this.stats.logChanges++;
      this.stats.totalEvents++;
      this.stats.lastEvent = Date.now();

      logger.debug(`Log file changed: ${filePath}`);

      // Read last N lines instead of entire file for performance
      const content = await this.readLastLines(filePath, 50);

      const event = {
        type: 'log-change',
        data: {
          path: filePath,
          filename: path.basename(filePath),
          directory: path.dirname(filePath),
          recentContent: content,
          timestamp: Date.now()
        }
      };

      await this.emitEvent('log-change', event);
    } catch (error) {
      logger.error(`Error handling log file change ${filePath}:`, error);
    }
  }

  /**
   * Handle log file removed
   * @param {string} filePath - Path to removed log file
   */
  async handleLogFileRemoved(filePath) {
    try {
      logger.info(`Log file removed: ${filePath}`);

      const event = {
        type: 'log-removed',
        data: {
          path: filePath,
          filename: path.basename(filePath),
          directory: path.dirname(filePath),
          timestamp: Date.now()
        }
      };

      await this.emitEvent('log-removed', event);
    } catch (error) {
      logger.error(`Error handling log file removed ${filePath}:`, error);
    }
  }

  /**
   * Handle project configuration change
   * @param {string} filePath - Path to changed project config file
   */
  async handleProjectConfigChange(filePath) {
    try {
      this.stats.totalEvents++;
      this.stats.lastEvent = Date.now();

      logger.info(`Project config changed: ${filePath}`);

      const content = await readFile(filePath, 'utf-8');
      const config = JSON.parse(content);

      const event = {
        type: 'project-config-change',
        data: {
          path: filePath,
          filename: path.basename(filePath),
          config,
          timestamp: Date.now()
        }
      };

      await this.emitEvent('project-config-change', event);
    } catch (error) {
      logger.error(`Error handling project config change ${filePath}:`, error);
    }
  }

  /**
   * Read last N lines from a file (optimized for large log files)
   * @param {string} filePath - Path to file
   * @param {number} numLines - Number of lines to read
   * @returns {Promise<string>} Last N lines
   */
  async readLastLines(filePath, numLines = 50) {
    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      return lines.slice(-numLines).join('\n');
    } catch (error) {
      logger.error(`Error reading last lines from ${filePath}:`, error);
      return '';
    }
  }

  /**
   * Register an event handler
   * @param {string} eventType - Type of event to listen for
   * @param {Function} handler - Handler function
   */
  on(eventType, handler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType).push(handler);
    logger.debug(`Registered handler for event type: ${eventType}`);
  }

  /**
   * Remove an event handler
   * @param {string} eventType - Type of event
   * @param {Function} handler - Handler function to remove
   */
  off(eventType, handler) {
    if (this.eventHandlers.has(eventType)) {
      const handlers = this.eventHandlers.get(eventType);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        logger.debug(`Removed handler for event type: ${eventType}`);
      }
    }
  }

  /**
   * Emit an event to all registered handlers
   * @param {string} eventType - Type of event
   * @param {Object} event - Event data
   */
  async emitEvent(eventType, event) {
    const handlers = this.eventHandlers.get(eventType) || [];
    const allHandlers = this.eventHandlers.get('*') || []; // Wildcard handlers

    const allCallbacks = [...handlers, ...allHandlers];

    for (const handler of allCallbacks) {
      try {
        await handler(event);
      } catch (error) {
        logger.error(`Error in event handler for ${eventType}:`, error);
      }
    }
  }

  /**
   * Get watcher statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      isActive: this.isActive,
      configChanges: this.stats.configChanges,
      logChanges: this.stats.logChanges,
      totalEvents: this.stats.totalEvents,
      lastEvent: this.stats.lastEvent,
      activeWatchers: this.watchers.size,
      watchedPaths: this.watchPaths
    };
  }

  /**
   * Stop all file watchers
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isActive) {
      logger.warn('File watchers not active');
      return;
    }

    try {
      const closePromises = [];
      
      for (const [name, watcher] of this.watchers) {
        logger.debug(`Closing ${name} watcher...`);
        closePromises.push(
          new Promise((resolve) => {
            watcher.close().then(() => {
              logger.debug(`${name} watcher closed`);
              resolve();
            });
          })
        );
      }

      await Promise.all(closePromises);
      
      this.watchers.clear();
      this.eventHandlers.clear();
      this.isActive = false;
      
      logger.info('All file watchers stopped');
    } catch (error) {
      logger.error('Error stopping file watchers:', error);
      throw error;
    }
  }

  /**
   * Add a custom path to watch
   * @param {string} name - Name for the watcher
   * @param {string|string[]} paths - Path(s) to watch
   * @param {Object} options - Chokidar options
   * @returns {Promise<void>}
   */
  async addCustomWatch(name, paths, options = {}) {
    if (this.watchers.has(name)) {
      logger.warn(`Watcher with name '${name}' already exists`);
      return;
    }

    const watcher = chokidar.watch(paths, {
      ...this.chokidarOptions,
      ...options
    });

    watcher.on('all', async (event, filePath) => {
      const customEvent = {
        type: `custom-${name}`,
        data: {
          event,
          path: filePath,
          filename: path.basename(filePath),
          timestamp: Date.now()
        }
      };
      await this.emitEvent(`custom-${name}`, customEvent);
    });

    watcher.on('error', (error) => {
      logger.error(`Custom watcher '${name}' error:`, error);
    });

    this.watchers.set(name, watcher);
    logger.info(`Custom watcher '${name}' added for paths:`, paths);
  }

  /**
   * Remove a custom watcher
   * @param {string} name - Name of the watcher to remove
   * @returns {Promise<void>}
   */
  async removeCustomWatch(name) {
    const watcher = this.watchers.get(name);
    if (!watcher) {
      logger.warn(`Watcher with name '${name}' not found`);
      return;
    }

    await watcher.close();
    this.watchers.delete(name);
    logger.info(`Custom watcher '${name}' removed`);
  }
}

export { FileWatcherManager };

