/**
 * Rollback Manager Module
 * 
 * Provides transaction-like rollback capabilities for file operations.
 * Tracks all file changes and can restore to previous state on failure.
 * 
 * @module utils/rollback-manager
 */

import fs from 'fs/promises';
import path from 'path';
import { fileExists, createBackup } from './file-generator.js';

/**
 * File operation types
 */
export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MKDIR: 'mkdir'
};

/**
 * Operation record
 * 
 * @typedef {Object} Operation
 * @property {string} type - Operation type (create, update, delete, mkdir)
 * @property {string} path - File/directory path
 * @property {string} backup - Backup file path (for updates/deletes)
 * @property {string} content - Original content (for creates)
 * @property {number} timestamp - Operation timestamp
 */

/**
 * Rollback session
 * Tracks all operations in a transaction
 */
export class RollbackSession {
  constructor(sessionId = null) {
    this.id = sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.operations = [];
    this.active = true;
    this.committed = false;
    this.rolledBack = false;
    this.startTime = Date.now();
  }

  /**
   * Record a file creation
   * 
   * @param {string} filePath - Path to created file
   */
  recordCreate(filePath) {
    if (!this.active) {
      throw new Error('Session is not active');
    }

    this.operations.push({
      type: OperationType.CREATE,
      path: filePath,
      backup: null,
      content: null,
      timestamp: Date.now()
    });
  }

  /**
   * Record a file update
   * 
   * @param {string} filePath - Path to updated file
   * @param {string} backupPath - Path to backup of original
   */
  recordUpdate(filePath, backupPath) {
    if (!this.active) {
      throw new Error('Session is not active');
    }

    this.operations.push({
      type: OperationType.UPDATE,
      path: filePath,
      backup: backupPath,
      content: null,
      timestamp: Date.now()
    });
  }

  /**
   * Record a file deletion
   * 
   * @param {string} filePath - Path to deleted file
   * @param {string} backupPath - Path to backup of deleted file
   */
  recordDelete(filePath, backupPath) {
    if (!this.active) {
      throw new Error('Session is not active');
    }

    this.operations.push({
      type: OperationType.DELETE,
      path: filePath,
      backup: backupPath,
      content: null,
      timestamp: Date.now()
    });
  }

  /**
   * Record a directory creation
   * 
   * @param {string} dirPath - Path to created directory
   */
  recordMkdir(dirPath) {
    if (!this.active) {
      throw new Error('Session is not active');
    }

    this.operations.push({
      type: OperationType.MKDIR,
      path: dirPath,
      backup: null,
      content: null,
      timestamp: Date.now()
    });
  }

  /**
   * Commit the session (mark as successful)
   */
  commit() {
    if (!this.active) {
      throw new Error('Session is not active');
    }

    this.active = false;
    this.committed = true;
  }

  /**
   * Get session summary
   * 
   * @returns {Object} Session statistics
   */
  getSummary() {
    const counts = {
      [OperationType.CREATE]: 0,
      [OperationType.UPDATE]: 0,
      [OperationType.DELETE]: 0,
      [OperationType.MKDIR]: 0
    };

    this.operations.forEach(op => {
      counts[op.type]++;
    });

    return {
      id: this.id,
      totalOperations: this.operations.length,
      counts,
      active: this.active,
      committed: this.committed,
      rolledBack: this.rolledBack,
      duration: Date.now() - this.startTime
    };
  }

  /**
   * Export session to JSON
   * 
   * @returns {string} JSON representation
   */
  toJSON() {
    return JSON.stringify({
      id: this.id,
      operations: this.operations,
      active: this.active,
      committed: this.committed,
      rolledBack: this.rolledBack,
      startTime: this.startTime
    }, null, 2);
  }

  /**
   * Load session from JSON
   * 
   * @param {string} json - JSON string
   * @returns {RollbackSession} Restored session
   */
  static fromJSON(json) {
    const data = JSON.parse(json);
    const session = new RollbackSession(data.id);
    
    session.operations = data.operations;
    session.active = data.active;
    session.committed = data.committed;
    session.rolledBack = data.rolledBack;
    session.startTime = data.startTime;
    
    return session;
  }
}

/**
 * Rollback Manager
 * Manages multiple sessions and performs rollback operations
 */
export class RollbackManager {
  constructor() {
    this.sessions = new Map();
    this.currentSession = null;
  }

  /**
   * Start a new rollback session
   * 
   * @param {string} sessionId - Optional session ID
   * @returns {RollbackSession} New session
   */
  startSession(sessionId = null) {
    const session = new RollbackSession(sessionId);
    this.sessions.set(session.id, session);
    this.currentSession = session;
    return session;
  }

  /**
   * Get current session
   * 
   * @returns {RollbackSession|null} Current session or null
   */
  getCurrentSession() {
    return this.currentSession;
  }

  /**
   * Get session by ID
   * 
   * @param {string} sessionId - Session ID
   * @returns {RollbackSession|null} Session or null
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Commit current session
   */
  commit() {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.currentSession.commit();
    this.currentSession = null;
  }

  /**
   * Rollback a session
   * Reverses all operations in reverse order
   * 
   * @param {string|RollbackSession} sessionOrId - Session or session ID
   * @returns {Promise<Object>} Rollback result
   */
  async rollback(sessionOrId) {
    const session = typeof sessionOrId === 'string' 
      ? this.getSession(sessionOrId)
      : sessionOrId;

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.rolledBack) {
      return {
        success: true,
        message: 'Session already rolled back',
        operations: []
      };
    }

    const results = [];
    const errors = [];

    // Process operations in reverse order
    const operations = [...session.operations].reverse();

    for (const operation of operations) {
      try {
        const result = await this._rollbackOperation(operation);
        results.push(result);
        
        // Track failed rollback operations
        if (!result.success) {
          errors.push({
            operation,
            error: `Rollback failed: ${result.action}`
          });
        }
      } catch (error) {
        errors.push({
          operation,
          error: error.message
        });
      }
    }

    session.rolledBack = true;
    session.active = false;

    if (session === this.currentSession) {
      this.currentSession = null;
    }

    return {
      success: errors.length === 0,
      message: errors.length === 0 
        ? 'Rollback completed successfully'
        : `Rollback completed with ${errors.length} error(s)`,
      operations: results,
      errors
    };
  }

  /**
   * Rollback a single operation
   * 
   * @private
   * @param {Operation} operation - Operation to rollback
   * @returns {Promise<Object>} Rollback result
   */
  async _rollbackOperation(operation) {
    const result = {
      type: operation.type,
      path: operation.path,
      action: null,
      success: false
    };

    switch (operation.type) {
      case OperationType.CREATE:
        // Remove created file
        if (await fileExists(operation.path)) {
          await fs.unlink(operation.path);
          result.action = 'removed';
          result.success = true;
        } else {
          result.action = 'already_removed';
          result.success = true;
        }
        break;

      case OperationType.UPDATE:
        // Restore from backup
        if (operation.backup && await fileExists(operation.backup)) {
          await fs.copyFile(operation.backup, operation.path);
          result.action = 'restored';
          result.success = true;
        } else {
          result.action = 'no_backup';
          result.success = false;
        }
        break;

      case OperationType.DELETE:
        // Restore from backup
        if (operation.backup && await fileExists(operation.backup)) {
          await fs.copyFile(operation.backup, operation.path);
          result.action = 'restored';
          result.success = true;
        } else {
          result.action = 'no_backup';
          result.success = false;
        }
        break;

      case OperationType.MKDIR:
        // Remove created directory if empty
        try {
          const files = await fs.readdir(operation.path);
          if (files.length === 0) {
            await fs.rmdir(operation.path);
            result.action = 'removed';
            result.success = true;
          } else {
            result.action = 'not_empty';
            result.success = false;
          }
        } catch {
          result.action = 'already_removed';
          result.success = true;
        }
        break;

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }

    return result;
  }

  /**
   * Rollback current session
   * 
   * @returns {Promise<Object>} Rollback result
   */
  async rollbackCurrent() {
    if (!this.currentSession) {
      throw new Error('No active session to rollback');
    }

    return await this.rollback(this.currentSession);
  }

  /**
   * Clean up old backup files for a session
   * 
   * @param {string|RollbackSession} sessionOrId - Session or session ID
   * @returns {Promise<number>} Number of backups deleted
   */
  async cleanupSession(sessionOrId) {
    const session = typeof sessionOrId === 'string' 
      ? this.getSession(sessionOrId)
      : sessionOrId;

    if (!session) {
      throw new Error('Session not found');
    }

    let deletedCount = 0;

    for (const operation of session.operations) {
      if (operation.backup && await fileExists(operation.backup)) {
        try {
          await fs.unlink(operation.backup);
          deletedCount++;
        } catch {
          // Ignore cleanup errors
        }
      }
    }

    return deletedCount;
  }

  /**
   * Get all session summaries
   * 
   * @returns {Array<Object>} Array of session summaries
   */
  getAllSummaries() {
    return Array.from(this.sessions.values()).map(session => session.getSummary());
  }

  /**
   * Clear all sessions
   */
  clearSessions() {
    this.sessions.clear();
    this.currentSession = null;
  }
}

/**
 * Create a singleton instance for convenience
 */
export const defaultManager = new RollbackManager();

export default {
  RollbackSession,
  RollbackManager,
  OperationType,
  defaultManager
};

