/**
 * Log Query Utility
 * 
 * Provides structured query capabilities for analyzing log files.
 * 
 * @module utils/log-query
 */

import fs from 'fs/promises';
import { createReadStream } from 'fs';
import readline from 'readline';
import { LogLevel } from './logger.js';

/**
 * Query log files with filters and aggregations
 */
export class LogQuery {
  constructor(logFilePath) {
    this.logFilePath = logFilePath;
  }

  /**
   * Read and parse log file line by line
   * @private
   */
  async *_readLogs() {
    const fileStream = createReadStream(this.logFilePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (!line.trim()) continue;
      
      try {
        const entry = JSON.parse(line);
        yield entry;
      } catch (error) {
        // Skip malformed lines
        continue;
      }
    }
  }

  /**
   * Filter logs by criteria
   * @param {Object} filters - Filter criteria
   * @param {string} filters.level - Log level
   * @param {string} filters.sessionId - Session ID
   * @param {Date} filters.after - After timestamp
   * @param {Date} filters.before - Before timestamp
   * @param {string} filters.messageContains - Message substring
   * @param {string} filters.errorCode - Error code
   * @returns {Promise<Array>} Filtered log entries
   */
  async filter(filters = {}) {
    const results = [];
    
    for await (const entry of this._readLogs()) {
      let matches = true;

      if (filters.level && entry.level !== filters.level) {
        matches = false;
      }

      if (filters.sessionId && entry.sessionId !== filters.sessionId) {
        matches = false;
      }

      if (filters.after) {
        const entryTime = new Date(entry.timestamp);
        if (entryTime < filters.after) {
          matches = false;
        }
      }

      if (filters.before) {
        const entryTime = new Date(entry.timestamp);
        if (entryTime > filters.before) {
          matches = false;
        }
      }

      if (filters.messageContains && !entry.message.includes(filters.messageContains)) {
        matches = false;
      }

      if (filters.errorCode && entry.errorCode !== filters.errorCode) {
        matches = false;
      }

      if (matches) {
        results.push(entry);
      }
    }

    return results;
  }

  /**
   * Find errors within a time window
   * @param {Date} start - Start time
   * @param {Date} end - End time
   * @returns {Promise<Array>} Error log entries
   */
  async findErrors(start, end) {
    return this.filter({
      level: 'ERROR',
      after: start,
      before: end
    });
  }

  /**
   * Group logs by field
   * @param {string} field - Field to group by
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Grouped results
   */
  async groupBy(field, filters = {}) {
    const groups = {};
    
    for await (const entry of this._readLogs()) {
      // Apply filters
      let matches = true;
      if (filters.level && entry.level !== filters.level) continue;
      if (filters.after && new Date(entry.timestamp) < filters.after) continue;
      if (filters.before && new Date(entry.timestamp) > filters.before) continue;

      const key = entry[field] || 'unknown';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(entry);
    }

    return groups;
  }

  /**
   * Count logs by criteria
   * @param {Object} filters - Filter criteria
   * @returns {Promise<number>} Count
   */
  async count(filters = {}) {
    let count = 0;
    
    for await (const entry of this._readLogs()) {
      let matches = true;

      if (filters.level && entry.level !== filters.level) matches = false;
      if (filters.errorCode && entry.errorCode !== filters.errorCode) matches = false;

      if (matches) count++;
    }

    return count;
  }

  /**
   * Get error rate for a time period
   * @param {Date} start - Start time
   * @param {Date} end - End time
   * @returns {Promise<Object>} Error rate statistics
   */
  async getErrorRate(start, end) {
    let totalLogs = 0;
    let errorLogs = 0;
    let warningLogs = 0;

    for await (const entry of this._readLogs()) {
      const entryTime = new Date(entry.timestamp);
      if (entryTime < start || entryTime > end) continue;

      totalLogs++;
      if (entry.level === 'ERROR' || entry.level === 'FATAL') {
        errorLogs++;
      } else if (entry.level === 'WARN') {
        warningLogs++;
      }
    }

    return {
      totalLogs,
      errorLogs,
      warningLogs,
      errorRate: totalLogs > 0 ? errorLogs / totalLogs : 0,
      warningRate: totalLogs > 0 ? warningLogs / totalLogs : 0
    };
  }

  /**
   * Find most common errors
   * @param {number} limit - Number of top errors
   * @param {Date} start - Start time
   * @param {Date} end - End time
   * @returns {Promise<Array>} Top errors
   */
  async topErrors(limit = 10, start = null, end = null) {
    const errorCounts = {};

    for await (const entry of this._readLogs()) {
      if (entry.level !== 'ERROR' && entry.level !== 'FATAL') continue;

      if (start || end) {
        const entryTime = new Date(entry.timestamp);
        if (start && entryTime < start) continue;
        if (end && entryTime > end) continue;
      }

      const key = entry.errorCode || entry.message;
      if (!errorCounts[key]) {
        errorCounts[key] = {
          count: 0,
          errorCode: entry.errorCode,
          message: entry.message,
          examples: []
        };
      }

      errorCounts[key].count++;
      if (errorCounts[key].examples.length < 3) {
        errorCounts[key].examples.push({
          timestamp: entry.timestamp,
          context: entry.context
        });
      }
    }

    return Object.values(errorCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get performance statistics
   * @param {string} operation - Operation name (optional)
   * @returns {Promise<Object>} Performance stats
   */
  async getPerformanceStats(operation = null) {
    const stats = {
      count: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      durations: []
    };

    for await (const entry of this._readLogs()) {
      if (!entry.performanceMetric) continue;
      if (operation && entry.operation !== operation) continue;

      const duration = entry.durationMs;
      stats.count++;
      stats.totalDuration += duration;
      stats.minDuration = Math.min(stats.minDuration, duration);
      stats.maxDuration = Math.max(stats.maxDuration, duration);
      stats.durations.push(duration);
    }

    if (stats.count === 0) {
      return null;
    }

    // Calculate percentiles
    stats.durations.sort((a, b) => a - b);
    const p50Index = Math.floor(stats.count * 0.5);
    const p95Index = Math.floor(stats.count * 0.95);
    const p99Index = Math.floor(stats.count * 0.99);

    return {
      operation,
      count: stats.count,
      avgDuration: stats.totalDuration / stats.count,
      minDuration: stats.minDuration,
      maxDuration: stats.maxDuration,
      p50: stats.durations[p50Index],
      p95: stats.durations[p95Index],
      p99: stats.durations[p99Index]
    };
  }

  /**
   * Find sessions with errors
   * @returns {Promise<Array>} Sessions with errors
   */
  async findProblemSessions() {
    const sessions = {};

    for await (const entry of this._readLogs()) {
      const sessionId = entry.sessionId;
      if (!sessionId) continue;

      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          sessionId,
          firstSeen: entry.timestamp,
          lastSeen: entry.timestamp,
          totalLogs: 0,
          errorCount: 0,
          warningCount: 0,
          errors: []
        };
      }

      const session = sessions[sessionId];
      session.totalLogs++;
      session.lastSeen = entry.timestamp;

      if (entry.level === 'ERROR' || entry.level === 'FATAL') {
        session.errorCount++;
        if (session.errors.length < 5) {
          session.errors.push({
            timestamp: entry.timestamp,
            message: entry.message,
            errorCode: entry.errorCode
          });
        }
      } else if (entry.level === 'WARN') {
        session.warningCount++;
      }
    }

    return Object.values(sessions)
      .filter(s => s.errorCount > 0)
      .sort((a, b) => b.errorCount - a.errorCount);
  }

  /**
   * Generate summary report
   * @param {Date} start - Start time
   * @param {Date} end - End time
   * @returns {Promise<Object>} Summary report
   */
  async generateReport(start = null, end = null) {
    const report = {
      period: {
        start: start?.toISOString(),
        end: end?.toISOString()
      },
      totalLogs: 0,
      byLevel: {},
      errorRate: {},
      topErrors: [],
      problemSessions: []
    };

    // Count by level
    for await (const entry of this._readLogs()) {
      if (start || end) {
        const entryTime = new Date(entry.timestamp);
        if (start && entryTime < start) continue;
        if (end && entryTime > end) continue;
      }

      report.totalLogs++;
      report.byLevel[entry.level] = (report.byLevel[entry.level] || 0) + 1;
    }

    // Get error rate
    if (start && end) {
      report.errorRate = await this.getErrorRate(start, end);
    }

    // Get top errors
    report.topErrors = await this.topErrors(10, start, end);

    // Get problem sessions
    report.problemSessions = (await this.findProblemSessions()).slice(0, 10);

    return report;
  }
}

/**
 * Create a log query instance
 * @param {string} logFilePath - Path to log file
 * @returns {LogQuery} Query instance
 */
export function createLogQuery(logFilePath) {
  return new LogQuery(logFilePath);
}

export default { LogQuery, createLogQuery };

