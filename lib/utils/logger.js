/**
 * Centralized Logging System
 * 
 * Provides structured logging with multiple log levels, context tracking,
 * error aggregation, and sensitive data redaction.
 * 
 * @module utils/logger
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';

/**
 * Log levels in order of severity
 */
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

/**
 * Log level names
 */
const LogLevelNames = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL'
};

/**
 * Log level colors for console output
 */
const LogLevelColors = {
  [LogLevel.DEBUG]: chalk.gray,
  [LogLevel.INFO]: chalk.blue,
  [LogLevel.WARN]: chalk.yellow,
  [LogLevel.ERROR]: chalk.red,
  [LogLevel.FATAL]: chalk.bgRed.white
};

/**
 * Sensitive field patterns to redact
 */
const SENSITIVE_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /password/i,
  /token/i,
  /auth/i,
  /credential/i,
  /private[_-]?key/i
];

/**
 * Error aggregation tracking
 */
class ErrorAggregator {
  constructor(windowMs = 60000, maxCount = 10) {
    this.errors = new Map();
    this.windowMs = windowMs;
    this.maxCount = maxCount;
  }

  /**
   * Check if error should be logged or aggregated
   * @param {string} errorKey - Unique error identifier
   * @returns {boolean} - True if should log, false if aggregated
   */
  shouldLog(errorKey) {
    const now = Date.now();
    const errorData = this.errors.get(errorKey);

    if (!errorData) {
      this.errors.set(errorKey, {
        count: 1,
        firstSeen: now,
        lastSeen: now
      });
      return true;
    }

    // Reset if outside window
    if (now - errorData.firstSeen > this.windowMs) {
      this.errors.set(errorKey, {
        count: 1,
        firstSeen: now,
        lastSeen: now
      });
      return true;
    }

    // Aggregate if within window
    errorData.count++;
    errorData.lastSeen = now;

    // Log every maxCount occurrences
    return errorData.count % this.maxCount === 1;
  }

  /**
   * Get aggregation summary for an error
   * @param {string} errorKey - Unique error identifier
   * @returns {Object|null} - Aggregation data
   */
  getAggregation(errorKey) {
    const errorData = this.errors.get(errorKey);
    if (!errorData || errorData.count === 1) {
      return null;
    }

    return {
      count: errorData.count,
      duration: errorData.lastSeen - errorData.firstSeen
    };
  }

  /**
   * Clean up old entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.errors.entries()) {
      if (now - data.lastSeen > this.windowMs) {
        this.errors.delete(key);
      }
    }
  }
}

/**
 * Logger class
 */
export class Logger {
  constructor(options = {}) {
    this.level = options.level ?? LogLevel.INFO;
    this.logFile = options.logFile || null;
    this.enableConsole = options.enableConsole ?? true;
    this.enableFile = options.enableFile ?? false;
    this.prettyPrint = options.prettyPrint ?? true;
    this.includeTimestamp = options.includeTimestamp ?? true;
    this.includeLevel = options.includeLevel ?? true;
    this.context = options.context || {};
    this.aggregator = new ErrorAggregator();
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB default
    this.maxFiles = options.maxFiles || 5; // Keep 5 rotated files
    
    // Session ID for tracking related logs
    this.sessionId = options.sessionId || this._generateSessionId();

    // Performance metrics
    this.metrics = {
      logCount: 0,
      errorCount: 0,
      warningCount: 0,
      lastReset: Date.now()
    };

    // Periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.aggregator.cleanup();
      this._checkLogRotation();
    }, 60000);
  }

  /**
   * Generate a unique session ID
   * @private
   */
  _generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Redact sensitive information from data
   * @private
   */
  _redactSensitive(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this._redactSensitive(item));
    }

    const redacted = {};
    for (const [key, value] of Object.entries(obj)) {
      const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
      
      if (isSensitive) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = this._redactSensitive(value);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  /**
   * Create log entry structure
   * @private
   */
  _createLogEntry(level, message, data = {}) {
    const entry = {
      level: LogLevelNames[level],
      message,
      sessionId: this.sessionId,
      ...this._redactSensitive(data)
    };

    if (this.includeTimestamp) {
      entry.timestamp = new Date().toISOString();
    }

    // Add context
    if (Object.keys(this.context).length > 0) {
      entry.context = this._redactSensitive(this.context);
    }

    return entry;
  }

  /**
   * Format log entry for console output
   * @private
   */
  _formatForConsole(entry) {
    const color = LogLevelColors[LogLevel[entry.level]];
    const parts = [];

    if (this.includeTimestamp) {
      parts.push(chalk.dim(entry.timestamp));
    }

    if (this.includeLevel) {
      parts.push(color(`[${entry.level}]`));
    }

    if (entry.sessionId) {
      parts.push(chalk.dim(`[${entry.sessionId.substring(0, 8)}]`));
    }

    parts.push(entry.message);

    // Add context and additional data
    const additionalData = { ...entry };
    delete additionalData.timestamp;
    delete additionalData.level;
    delete additionalData.message;
    delete additionalData.sessionId;

    if (Object.keys(additionalData).length > 0) {
      if (this.prettyPrint) {
        parts.push('\n' + chalk.dim(JSON.stringify(additionalData, null, 2)));
      } else {
        parts.push(chalk.dim(JSON.stringify(additionalData)));
      }
    }

    return parts.join(' ');
  }

  /**
   * Write log entry to console
   * @private
   */
  _writeToConsole(entry) {
    const formatted = this._formatForConsole(entry);
    const level = LogLevel[entry.level];

    if (level >= LogLevel.ERROR) {
      console.error(formatted);
    } else if (level >= LogLevel.WARN) {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  /**
   * Check if log file needs rotation
   * @private
   */
  async _checkLogRotation() {
    if (!this.logFile || !existsSync(this.logFile)) return;

    try {
      const stats = await fs.stat(this.logFile);
      if (stats.size >= this.maxFileSize) {
        await this._rotateLogFile();
      }
    } catch (error) {
      // Ignore rotation errors
    }
  }

  /**
   * Rotate log file
   * @private
   */
  async _rotateLogFile() {
    try {
      // Rename existing rotated files
      for (let i = this.maxFiles - 1; i >= 1; i--) {
        const oldFile = `${this.logFile}.${i}`;
        const newFile = `${this.logFile}.${i + 1}`;
        
        if (existsSync(oldFile)) {
          if (i === this.maxFiles - 1) {
            // Delete oldest file
            await fs.unlink(oldFile);
          } else {
            await fs.rename(oldFile, newFile);
          }
        }
      }

      // Rotate current log file
      if (existsSync(this.logFile)) {
        await fs.rename(this.logFile, `${this.logFile}.1`);
      }
    } catch (error) {
      console.error('Failed to rotate log file:', error.message);
    }
  }

  /**
   * Write log entry to file
   * @private
   */
  async _writeToFile(entry) {
    if (!this.logFile) return;

    try {
      const logDir = path.dirname(this.logFile);
      if (!existsSync(logDir)) {
        await fs.mkdir(logDir, { recursive: true });
      }

      const line = JSON.stringify(entry) + '\n';
      await fs.appendFile(this.logFile, line, 'utf-8');
    } catch (error) {
      // Fallback to console if file write fails
      console.error('Failed to write to log file:', error.message);
    }
  }

  /**
   * Log at specified level
   * @private
   */
  async _log(level, message, data = {}) {
    if (level < this.level) {
      return; // Below minimum log level
    }

    // Track metrics
    this.metrics.logCount++;
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      this.metrics.errorCount++;
    } else if (level === LogLevel.WARN) {
      this.metrics.warningCount++;
    }

    const entry = this._createLogEntry(level, message, data);

    if (this.enableConsole) {
      this._writeToConsole(entry);
    }

    if (this.enableFile) {
      await this._writeToFile(entry);
    }
  }

  /**
   * Log debug message
   */
  async debug(message, data = {}) {
    await this._log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log info message
   */
  async info(message, data = {}) {
    await this._log(LogLevel.INFO, message, data);
  }

  /**
   * Log warning message
   */
  async warn(message, data = {}) {
    await this._log(LogLevel.WARN, message, data);
  }

  /**
   * Log error message with aggregation
   */
  async error(message, error = null, data = {}) {
    const errorKey = error?.code || error?.message || message;
    const shouldLog = this.aggregator.shouldLog(errorKey);

    const logData = {
      ...data,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorStack: error?.stack
    };

    // Add aggregation info if applicable
    const aggregation = this.aggregator.getAggregation(errorKey);
    if (aggregation) {
      logData.aggregation = {
        ...aggregation,
        note: `This error has occurred ${aggregation.count} times in the last ${Math.round(aggregation.duration / 1000)}s`
      };
    }

    if (shouldLog) {
      await this._log(LogLevel.ERROR, message, logData);
    }
  }

  /**
   * Log fatal error (always logs, bypasses aggregation)
   */
  async fatal(message, error = null, data = {}) {
    const logData = {
      ...data,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorStack: error?.stack
    };

    await this._log(LogLevel.FATAL, message, logData);
  }

  /**
   * Log performance timing
   */
  async performance(operation, durationMs, data = {}) {
    await this._log(LogLevel.INFO, `Performance: ${operation}`, {
      ...data,
      duration: `${durationMs}ms`,
      durationMs,
      operation,
      performanceMetric: true
    });
  }

  /**
   * Time an operation and log performance
   */
  async time(operation, fn) {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      await this.performance(operation, duration, { status: 'success' });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      await this.performance(operation, duration, { status: 'error', error: error.message });
      throw error;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const now = Date.now();
    const duration = now - this.metrics.lastReset;
    
    return {
      ...this.metrics,
      duration,
      ratePerSecond: this.metrics.logCount / (duration / 1000),
      errorRate: this.metrics.errorCount / Math.max(this.metrics.logCount, 1)
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      logCount: 0,
      errorCount: 0,
      warningCount: 0,
      lastReset: Date.now()
    };
  }

  /**
   * Log current metrics
   */
  async logMetrics() {
    const metrics = this.getMetrics();
    await this.info('Logger metrics', metrics);
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext = {}) {
    return new Logger({
      level: this.level,
      logFile: this.logFile,
      enableConsole: this.enableConsole,
      enableFile: this.enableFile,
      prettyPrint: this.prettyPrint,
      includeTimestamp: this.includeTimestamp,
      includeLevel: this.includeLevel,
      sessionId: this.sessionId,
      context: {
        ...this.context,
        ...additionalContext
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Set log level
   */
  setLevel(level) {
    this.level = level;
  }

  /**
   * Update context
   */
  setContext(context) {
    this.context = { ...this.context, ...context };
  }
}

/**
 * Default logger instance
 */
let defaultLogger = null;

/**
 * Get or create default logger
 */
export function getLogger(options = {}) {
  if (!defaultLogger) {
    const logLevel = process.env.LOG_LEVEL || process.env.DIET103_LOG_LEVEL || 'INFO';
    const logFile = process.env.LOG_FILE || null;
    
    defaultLogger = new Logger({
      level: LogLevel[logLevel.toUpperCase()] ?? LogLevel.INFO,
      logFile,
      enableFile: !!logFile,
      ...options
    });
  }

  return defaultLogger;
}

/**
 * Create a new logger instance
 */
export function createLogger(options = {}) {
  return new Logger(options);
}

/**
 * Convenience methods using default logger
 */
export const log = {
  debug: (message, data) => getLogger().debug(message, data),
  info: (message, data) => getLogger().info(message, data),
  warn: (message, data) => getLogger().warn(message, data),
  error: (message, error, data) => getLogger().error(message, error, data),
  fatal: (message, error, data) => getLogger().fatal(message, error, data)
};

export default { Logger, getLogger, createLogger, log, LogLevel };

