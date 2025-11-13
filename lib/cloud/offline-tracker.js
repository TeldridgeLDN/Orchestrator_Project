/**
 * Offline Change Tracker
 * 
 * Tracks local configuration changes when offline and queues them for sync.
 * Provides change detection, persistence, and automatic sync when online.
 * 
 * @module cloud/offline-tracker
 */

import { EventEmitter } from 'events';
import { existsSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { createLogger } from '../utils/logger.js';
import { calculateHash } from '../utils/sync-encryption.js';

const logger = createLogger('OfflineTracker');

/**
 * Change types
 */
export const ChangeType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  REPLACE: 'replace'
};

/**
 * Change entry structure
 */
export class ChangeEntry {
  constructor(type, path, value, timestamp = Date.now()) {
    this.id = `change_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.path = path;
    this.value = value;
    this.timestamp = timestamp;
    this.synced = false;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      path: this.path,
      value: this.value,
      timestamp: this.timestamp,
      synced: this.synced
    };
  }

  static fromJSON(json) {
    const entry = new ChangeEntry(json.type, json.path, json.value, json.timestamp);
    entry.id = json.id;
    entry.synced = json.synced;
    return entry;
  }
}

/**
 * Offline Change Tracker
 * 
 * Monitors configuration changes and maintains a queue of pending changes
 */
export class OfflineTracker extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      storagePath: options.storagePath || './.cache/offline-changes.json',
      maxChanges: options.maxChanges || 1000,
      autoSave: options.autoSave !== false,
      trackFullSnapshot: options.trackFullSnapshot !== false,
      ...options
    };

    // Change tracking
    this.changes = [];
    this.lastSnapshot = null;
    this.lastSnapshotHash = null;

    // State
    this.initialized = false;
    this.isOnline = true;

    logger.info('Offline tracker created');
  }

  /**
   * Initialize tracker and load persisted changes
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Ensure storage directory exists
      const dir = path.dirname(this.options.storagePath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      // Load persisted changes
      await this._loadChanges();

      this.initialized = true;
      logger.info('Offline tracker initialized', {
        pendingChanges: this.changes.length
      });
    } catch (error) {
      logger.error('Failed to initialize offline tracker:', error);
      throw error;
    }
  }

  /**
   * Track a configuration change
   * @param {Object} config - Current configuration
   * @param {Object} previousConfig - Previous configuration (optional)
   * @returns {Promise<ChangeEntry[]>} Detected changes
   */
  async trackChange(config, previousConfig = null) {
    if (!this.initialized) {
      throw new Error('Tracker not initialized');
    }

    const changes = [];

    // Calculate current hash
    const configString = JSON.stringify(config);
    const currentHash = calculateHash(configString);

    // Check if config actually changed
    if (this.lastSnapshotHash === currentHash) {
      logger.debug('No changes detected (hash match)');
      return changes;
    }

    // If we're tracking full snapshots, just store the whole config
    if (this.options.trackFullSnapshot) {
      const change = new ChangeEntry(
        ChangeType.REPLACE,
        '$root',
        config
      );
      changes.push(change);
      this.changes.push(change);
      logger.info('Tracked full config snapshot', { changeId: change.id });
    } else {
      // Detect granular changes
      const detectedChanges = this._detectChanges(
        config,
        previousConfig || this.lastSnapshot,
        []
      );

      for (const change of detectedChanges) {
        this.changes.push(change);
        changes.push(change);
      }

      logger.info('Tracked granular changes', { count: changes.length });
    }

    // Update last snapshot
    this.lastSnapshot = config;
    this.lastSnapshotHash = currentHash;

    // Enforce max changes limit
    if (this.changes.length > this.options.maxChanges) {
      const removed = this.changes.length - this.options.maxChanges;
      this.changes = this.changes.slice(-this.options.maxChanges);
      logger.warn(`Removed ${removed} old changes (max limit reached)`);
    }

    // Auto-save if enabled
    if (this.options.autoSave) {
      await this._saveChanges();
    }

    // Emit event
    this.emit('changes-tracked', changes);

    return changes;
  }

  /**
   * Get all pending (unsynced) changes
   * @returns {ChangeEntry[]}
   */
  getPendingChanges() {
    return this.changes.filter(c => !c.synced);
  }

  /**
   * Mark changes as synced
   * @param {string[]} changeIds - IDs of changes to mark as synced
   * @returns {Promise<void>}
   */
  async markSynced(changeIds) {
    let marked = 0;

    for (const change of this.changes) {
      if (changeIds.includes(change.id)) {
        change.synced = true;
        marked++;
      }
    }

    logger.info(`Marked ${marked} changes as synced`);

    if (this.options.autoSave) {
      await this._saveChanges();
    }

    this.emit('changes-synced', changeIds);
  }

  /**
   * Clear all synced changes
   * @returns {Promise<number>} Number of changes cleared
   */
  async clearSynced() {
    const before = this.changes.length;
    this.changes = this.changes.filter(c => !c.synced);
    const cleared = before - this.changes.length;

    logger.info(`Cleared ${cleared} synced changes`);

    if (cleared > 0 && this.options.autoSave) {
      await this._saveChanges();
    }

    this.emit('changes-cleared', cleared);

    return cleared;
  }

  /**
   * Clear all changes
   * @returns {Promise<void>}
   */
  async clearAll() {
    const count = this.changes.length;
    this.changes = [];
    this.lastSnapshot = null;
    this.lastSnapshotHash = null;

    logger.info(`Cleared all ${count} changes`);

    if (this.options.autoSave) {
      await this._saveChanges();
    }

    this.emit('changes-cleared', count);
  }

  /**
   * Set online/offline status
   * @param {boolean} online - Online status
   */
  setOnlineStatus(online) {
    const wasOnline = this.isOnline;
    this.isOnline = online;

    if (!wasOnline && online) {
      logger.info('Network restored');
      this.emit('online');
    } else if (wasOnline && !online) {
      logger.warn('Network lost');
      this.emit('offline');
    }
  }

  /**
   * Get tracker statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const pending = this.getPendingChanges();

    return {
      totalChanges: this.changes.length,
      pendingChanges: pending.length,
      syncedChanges: this.changes.length - pending.length,
      oldestPending: pending.length > 0 ? pending[0].timestamp : null,
      newestPending: pending.length > 0 ? pending[pending.length - 1].timestamp : null,
      isOnline: this.isOnline,
      hasSnapshot: this.lastSnapshot !== null
    };
  }

  /**
   * Apply pending changes to a base config
   * @param {Object} baseConfig - Base configuration
   * @returns {Object} Config with changes applied
   */
  applyPendingChanges(baseConfig) {
    const config = JSON.parse(JSON.stringify(baseConfig)); // Deep clone
    const pending = this.getPendingChanges();

    for (const change of pending) {
      this._applyChange(config, change);
    }

    return config;
  }

  /**
   * Detect changes between two configs
   * @private
   */
  _detectChanges(current, previous, path) {
    const changes = [];

    if (!previous) {
      // Everything is new
      changes.push(new ChangeEntry(ChangeType.CREATE, '$root', current));
      return changes;
    }

    // Get all keys from both objects
    const currentKeys = new Set(Object.keys(current || {}));
    const previousKeys = new Set(Object.keys(previous || {}));

    // Check for created and updated keys
    for (const key of currentKeys) {
      const currentPath = [...path, key].join('.');
      const currentValue = current[key];
      const previousValue = previous[key];

      if (!previousKeys.has(key)) {
        // Created
        changes.push(new ChangeEntry(ChangeType.CREATE, currentPath, currentValue));
      } else if (JSON.stringify(currentValue) !== JSON.stringify(previousValue)) {
        // Updated
        if (typeof currentValue === 'object' && currentValue !== null &&
            typeof previousValue === 'object' && previousValue !== null &&
            !Array.isArray(currentValue)) {
          // Recurse for nested objects
          const nested = this._detectChanges(currentValue, previousValue, [...path, key]);
          changes.push(...nested);
        } else {
          changes.push(new ChangeEntry(ChangeType.UPDATE, currentPath, currentValue));
        }
      }
    }

    // Check for deleted keys
    for (const key of previousKeys) {
      if (!currentKeys.has(key)) {
        const currentPath = [...path, key].join('.');
        changes.push(new ChangeEntry(ChangeType.DELETE, currentPath, null));
      }
    }

    return changes;
  }

  /**
   * Apply a change to a config
   * @private
   */
  _applyChange(config, change) {
    if (change.type === ChangeType.REPLACE) {
      // Full replacement
      Object.keys(config).forEach(key => delete config[key]);
      Object.assign(config, change.value);
      return;
    }

    const pathParts = change.path.split('.');
    let target = config;

    // Navigate to parent
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!(part in target)) {
        target[part] = {};
      }
      target = target[part];
    }

    const lastPart = pathParts[pathParts.length - 1];

    // Apply change
    switch (change.type) {
      case ChangeType.CREATE:
      case ChangeType.UPDATE:
        target[lastPart] = change.value;
        break;
      case ChangeType.DELETE:
        delete target[lastPart];
        break;
    }
  }

  /**
   * Load changes from storage
   * @private
   */
  async _loadChanges() {
    try {
      if (!existsSync(this.options.storagePath)) {
        logger.debug('No persisted changes found');
        return;
      }

      const data = await readFile(this.options.storagePath, 'utf8');
      const json = JSON.parse(data);

      this.changes = json.changes.map(c => ChangeEntry.fromJSON(c));
      this.lastSnapshot = json.lastSnapshot;
      this.lastSnapshotHash = json.lastSnapshotHash;

      logger.info('Loaded persisted changes', { count: this.changes.length });
    } catch (error) {
      logger.error('Failed to load persisted changes:', error);
      // Don't throw - start fresh
    }
  }

  /**
   * Save changes to storage
   * @private
   */
  async _saveChanges() {
    try {
      const data = JSON.stringify({
        changes: this.changes.map(c => c.toJSON()),
        lastSnapshot: this.lastSnapshot,
        lastSnapshotHash: this.lastSnapshotHash,
        savedAt: Date.now()
      }, null, 2);

      await writeFile(this.options.storagePath, data, 'utf8');

      logger.debug('Saved changes to storage');
    } catch (error) {
      logger.error('Failed to save changes:', error);
    }
  }
}

export default OfflineTracker;

