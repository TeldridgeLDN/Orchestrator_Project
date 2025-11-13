/**
 * Sync State Manager
 * 
 * Manages synchronization state and queues sync operations for offline support.
 * Implements a state machine for sync operations with proper error handling.
 * 
 * @module cloud/sync-state-manager
 */

import { EventEmitter } from 'events';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('SyncStateManager');

/**
 * Sync states
 */
export const SyncState = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  UPLOADING: 'uploading',
  DOWNLOADING: 'downloading',
  RESOLVING_CONFLICTS: 'resolving_conflicts',
  ERROR: 'error',
  OFFLINE: 'offline'
};

/**
 * Sync operation types
 */
export const SyncOperationType = {
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  BIDIRECTIONAL: 'bidirectional',
  RESOLVE_CONFLICT: 'resolve_conflict'
};

/**
 * Sync result status
 */
export const SyncResultStatus = {
  SUCCESS: 'success',
  PARTIAL: 'partial',
  FAILED: 'failed',
  QUEUED: 'queued',
  CONFLICT: 'conflict'
};

/**
 * Sync State Manager
 * Manages sync operations, state transitions, and operation queue
 */
export class SyncStateManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.currentState = SyncState.IDLE;
    this.isOnline = true;
    
    // Sync queue for offline operations
    this.queue = [];
    this.maxQueueSize = options.maxQueueSize || 100;
    
    // Current sync operation
    this.currentOperation = null;
    
    // Sync statistics
    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      queuedOperations: 0,
      conflictsResolved: 0,
      lastSyncAt: null,
      lastError: null
    };
    
    // State transition history (for debugging)
    this.stateHistory = [];
    this.maxHistorySize = options.maxHistorySize || 50;
    
    // Auto-process queue when coming online
    this.autoProcessQueue = options.autoProcessQueue !== false;
    
    logger.info('Sync state manager initialized');
  }

  /**
   * Get current sync state
   * @returns {string} Current state
   */
  getState() {
    return this.currentState;
  }

  /**
   * Check if currently syncing
   * @returns {boolean}
   */
  isSyncing() {
    return this.currentState === SyncState.SYNCING ||
           this.currentState === SyncState.UPLOADING ||
           this.currentState === SyncState.DOWNLOADING ||
           this.currentState === SyncState.RESOLVING_CONFLICTS;
  }

  /**
   * Set online/offline status
   * @param {boolean} online - Online status
   */
  setOnlineStatus(online) {
    const wasOffline = !this.isOnline;
    const wasOnline = this.isOnline;
    this.isOnline = online;
    
    if (online && wasOffline) {
      logger.info('Network connection restored');
      
      // Transition from offline state first
      if (this.currentState === SyncState.OFFLINE) {
        this._transitionTo(SyncState.IDLE);
      }
      
      this.emit('online');
      
      // Auto-process queue if enabled
      if (this.autoProcessQueue && this.queue.length > 0) {
        logger.info(`Processing ${this.queue.length} queued operations`);
        this.processQueue().catch(error => {
          logger.error('Error processing queue:', error);
        });
      }
    } else if (!online && wasOnline) {
      logger.warn('Network connection lost');
      
      // Transition to offline if not syncing
      if (!this.isSyncing()) {
        this._transitionTo(SyncState.OFFLINE);
      }
      
      this.emit('offline');
    }
  }

  /**
   * Start a sync operation
   * @param {Object} operation - Sync operation details
   * @returns {Promise<Object>} Operation result
   */
  async startSync(operation) {
    // Validate operation
    if (!operation.type) {
      throw new Error('Operation type is required');
    }

    // Check if already syncing
    if (this.isSyncing()) {
      throw new Error(`Cannot start sync while in ${this.currentState} state`);
    }

    // Check online status
    if (!this.isOnline) {
      logger.info('Offline - queueing sync operation');
      return this.queueOperation(operation);
    }

    // Start sync
    this.currentOperation = {
      ...operation,
      id: this._generateOperationId(),
      startedAt: Date.now(),
      status: 'in-progress'
    };

    this._transitionTo(SyncState.SYNCING);
    this.emit('sync-start', this.currentOperation);

    return this.currentOperation;
  }

  /**
   * Complete current sync operation
   * @param {Object} result - Sync result
   */
  completeSync(result) {
    if (!this.currentOperation) {
      logger.warn('No current operation to complete');
      return;
    }

    const operation = this.currentOperation;
    operation.completedAt = Date.now();
    operation.duration = operation.completedAt - operation.startedAt;
    operation.result = result;
    operation.status = result.status;

    // Update statistics
    this.stats.totalSyncs++;
    this.stats.lastSyncAt = operation.completedAt;

    if (result.status === SyncResultStatus.SUCCESS) {
      this.stats.successfulSyncs++;
      logger.info(`Sync operation ${operation.id} completed successfully`);
    } else if (result.status === SyncResultStatus.FAILED) {
      this.stats.failedSyncs++;
      this.stats.lastError = {
        timestamp: operation.completedAt,
        message: result.error || 'Unknown error',
        operationId: operation.id
      };
      logger.error(`Sync operation ${operation.id} failed:`, result.error);
    }

    // Emit completion event
    this.emit('sync-complete', {
      operation,
      result
    });

    // Transition back to idle
    this._transitionTo(SyncState.IDLE);
    this.currentOperation = null;
  }

  /**
   * Transition to upload state
   */
  transitionToUploading() {
    if (this.currentState !== SyncState.SYNCING) {
      throw new Error(`Cannot transition to uploading from ${this.currentState}`);
    }
    this._transitionTo(SyncState.UPLOADING);
  }

  /**
   * Transition to download state
   */
  transitionToDownloading() {
    if (this.currentState !== SyncState.SYNCING) {
      throw new Error(`Cannot transition to downloading from ${this.currentState}`);
    }
    this._transitionTo(SyncState.DOWNLOADING);
  }

  /**
   * Transition to conflict resolution state
   */
  transitionToResolvingConflicts() {
    if (this.currentState !== SyncState.SYNCING && 
        this.currentState !== SyncState.UPLOADING &&
        this.currentState !== SyncState.DOWNLOADING) {
      throw new Error(`Cannot transition to resolving conflicts from ${this.currentState}`);
    }
    this._transitionTo(SyncState.RESOLVING_CONFLICTS);
    this.stats.conflictsResolved++;
  }

  /**
   * Transition to error state
   * @param {Error} error - Error that occurred
   */
  transitionToError(error) {
    this._transitionTo(SyncState.ERROR);
    this.stats.lastError = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack
    };
    this.emit('sync-error', error);
  }

  /**
   * Queue a sync operation for later processing
   * @param {Object} operation - Operation to queue
   * @returns {Object} Queue result
   */
  queueOperation(operation) {
    if (this.queue.length >= this.maxQueueSize) {
      logger.warn(`Queue size limit reached (${this.maxQueueSize}), removing oldest operation`);
      this.queue.shift();
    }

    const queuedOp = {
      ...operation,
      id: this._generateOperationId(),
      queuedAt: Date.now(),
      status: 'queued'
    };

    this.queue.push(queuedOp);
    this.stats.queuedOperations++;

    logger.info(`Operation ${queuedOp.id} queued (${this.queue.length} in queue)`);
    this.emit('operation-queued', queuedOp);

    return {
      status: SyncResultStatus.QUEUED,
      operationId: queuedOp.id,
      queuePosition: this.queue.length,
      message: 'Operation queued for processing when online'
    };
  }

  /**
   * Process queued operations
   * @returns {Promise<Array>} Results of processed operations
   */
  async processQueue() {
    if (this.queue.length === 0) {
      logger.debug('Queue is empty');
      return [];
    }

    if (!this.isOnline) {
      logger.warn('Cannot process queue while offline');
      return [];
    }

    if (this.isSyncing()) {
      logger.warn('Cannot process queue while syncing');
      return [];
    }

    logger.info(`Processing ${this.queue.length} queued operations`);
    const results = [];

    // Process operations in order
    while (this.queue.length > 0 && this.isOnline) {
      const operation = this.queue.shift();
      
      try {
        logger.info(`Processing queued operation ${operation.id}`);
        this.emit('queue-process', operation);
        
        // The actual sync will be handled by the caller
        // We just emit the event for processing
        results.push({
          operationId: operation.id,
          status: 'ready-for-processing',
          operation
        });
      } catch (error) {
        logger.error(`Error processing queued operation ${operation.id}:`, error);
        results.push({
          operationId: operation.id,
          status: 'error',
          error: error.message
        });
      }
    }

    this.emit('queue-processed', results);
    return results;
  }

  /**
   * Get queued operations
   * @returns {Array} Queued operations
   */
  getQueue() {
    return [...this.queue];
  }

  /**
   * Clear the queue
   * @returns {number} Number of operations cleared
   */
  clearQueue() {
    const count = this.queue.length;
    this.queue = [];
    logger.info(`Cleared ${count} operations from queue`);
    this.emit('queue-cleared', count);
    return count;
  }

  /**
   * Remove specific operation from queue
   * @param {string} operationId - Operation ID to remove
   * @returns {boolean} Whether operation was found and removed
   */
  removeFromQueue(operationId) {
    const index = this.queue.findIndex(op => op.id === operationId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      logger.info(`Removed operation ${operationId} from queue`);
      this.emit('operation-removed', operationId);
      return true;
    }
    return false;
  }

  /**
   * Get sync statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentState: this.currentState,
      isOnline: this.isOnline,
      queueLength: this.queue.length,
      isSyncing: this.isSyncing(),
      currentOperation: this.currentOperation ? {
        id: this.currentOperation.id,
        type: this.currentOperation.type,
        startedAt: this.currentOperation.startedAt,
        duration: Date.now() - this.currentOperation.startedAt
      } : null
    };
  }

  /**
   * Get state transition history
   * @returns {Array} State history
   */
  getStateHistory() {
    return [...this.stateHistory];
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      queuedOperations: 0,
      conflictsResolved: 0,
      lastSyncAt: null,
      lastError: null
    };
    logger.info('Statistics reset');
    this.emit('stats-reset');
  }

  /**
   * Transition to a new state
   * @param {string} newState - New state
   * @private
   */
  _transitionTo(newState) {
    const oldState = this.currentState;
    
    if (oldState === newState) {
      return;
    }

    this.currentState = newState;

    // Record transition
    const transition = {
      from: oldState,
      to: newState,
      timestamp: Date.now()
    };

    this.stateHistory.push(transition);

    // Trim history if needed
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }

    logger.debug(`State transition: ${oldState} -> ${newState}`);
    this.emit('state-change', transition);
  }

  /**
   * Generate unique operation ID
   * @returns {string} Operation ID
   * @private
   */
  _generateOperationId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default SyncStateManager;

