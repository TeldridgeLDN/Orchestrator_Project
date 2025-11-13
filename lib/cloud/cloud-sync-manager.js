/**
 * Cloud Sync Manager
 * 
 * Coordinates upload/download operations with encryption,
 * integrating Firebase provider, state management, and encryption.
 * 
 * @module cloud/cloud-sync-manager
 */

import { createLogger } from '../utils/logger.js';
import { FirebaseCloudProvider } from './firebase-provider.js';
import { 
  SyncStateManager, 
  SyncOperationType, 
  SyncResultStatus 
} from './sync-state-manager.js';
import { 
  encryptData, 
  decryptData, 
  generateKey,
  loadOrCreateKey,
  calculateHash
} from '../utils/sync-encryption.js';
import { 
  ConflictResolver,
  ConflictStrategy
} from './conflict-resolver.js';
import { OfflineTracker } from './offline-tracker.js';
import { readFile, writeFile } from 'fs/promises';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('CloudSyncManager');

/**
 * Cloud Sync Manager
 * High-level API for cloud synchronization with encryption
 */
export class CloudSyncManager {
  constructor(options = {}) {
    this.options = {
      userId: options.userId || null,
      deviceId: options.deviceId || this._generateDeviceId(),
      deviceName: options.deviceName || os.hostname(),
      configPath: options.configPath || null,
      encryptionEnabled: options.encryptionEnabled !== false,
      conflictStrategy: options.conflictStrategy || ConflictStrategy.AUTO,
      arrayMergeStrategy: options.arrayMergeStrategy || 'union',
      ...options
    };

    // Initialize components
    this.provider = new FirebaseCloudProvider(options.firebaseConfig || {});
    this.stateManager = new SyncStateManager(options.stateManagerConfig || {});
    this.conflictResolver = new ConflictResolver({
      strategy: this.options.conflictStrategy,
      arrayMergeStrategy: this.options.arrayMergeStrategy
    });
    this.offlineTracker = new OfflineTracker(options.offlineTrackerConfig || {});
    
    // Encryption key
    this.encryptionKey = null;
    this.keyId = null;
    
    // Local state
    this.initialized = false;
    this.lastSyncVersion = 0;
    
    // Setup event listeners
    this._setupEventListeners();
    
    logger.info('Cloud sync manager created');
  }

  /**
   * Setup event listeners for offline/online transitions
   * @private
   */
  _setupEventListeners() {
    // Listen for online/offline events from state manager
    this.stateManager.on('state-change', ({ from, to }) => {
      if (to === 'offline') {
        this.offlineTracker.setOnlineStatus(false);
      } else if (from === 'offline' && to === 'idle') {
        this.offlineTracker.setOnlineStatus(true);
      }
    });

    // Auto-sync when coming back online
    this.offlineTracker.on('online', async () => {
      const pending = this.offlineTracker.getPendingChanges();
      if (pending.length > 0) {
        logger.info(`Coming back online with ${pending.length} pending changes`);
        
        // Queue sync operation
        if (this.stateManager.autoProcessQueue) {
          try {
            await this.stateManager.processQueue();
          } catch (error) {
            logger.error('Failed to process queued sync operations:', error);
          }
        }
      }
    });
  }

  /**
   * Initialize the sync manager
   * @param {string} userId - User ID
   * @param {string} [passphrase] - Optional passphrase for encryption
   * @returns {Promise<void>}
   */
  async initialize(userId, passphrase) {
    if (this.initialized) {
      logger.debug('Already initialized');
      return;
    }

    try {
      this.options.userId = userId;
      
      // Initialize Firebase provider
      await this.provider.initialize();
      logger.info('Firebase provider initialized');

      // Initialize offline tracker
      await this.offlineTracker.initialize();
      logger.info('Offline tracker initialized');

      // Initialize or load encryption key
      if (this.options.encryptionEnabled) {
        await this._initializeEncryption(passphrase);
        logger.info('Encryption initialized');
      }

      // Get or create user document
      let user = await this.provider.getUser(userId);
      if (!user) {
        await this.provider.createUser(userId, {
          email: this.options.userEmail,
          name: this.options.userName
        });
      }

      // Register this device
      await this._registerDevice();
      logger.info('Device registered');

      this.initialized = true;
      logger.info('Cloud sync manager initialized');
    } catch (error) {
      logger.error('Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Upload configuration to cloud
   * @param {Object} config - Configuration data to upload
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async upload(config, options = {}) {
    await this._ensureInitialized();

    const skipStateUpdate = options._internalSync || false;
    let operation = null;

    try {
      // Start sync operation only if not called from within sync
      if (!skipStateUpdate) {
        operation = await this.stateManager.startSync({
          type: SyncOperationType.UPLOAD,
          config,
          options
        });
      }

      if (!skipStateUpdate) {
        this.stateManager.transitionToUploading();
      }

      // Prepare config data
      const configString = JSON.stringify(config);
      const configHash = calculateHash(configString);
      const configSize = Buffer.byteLength(configString, 'utf8');

      // Encrypt if enabled
      let encryptedData = null;
      let encryption = null;

      if (this.options.encryptionEnabled) {
        encryptedData = await encryptData(configString, this.encryptionKey);
        encryption = {
          algorithm: encryptedData.algorithm,
          iv: encryptedData.iv,
          authTag: encryptedData.authTag,
          keyId: this.keyId
        };
      }

      // Get current remote version
      const currentConfig = await this.provider.getUserConfig(this.options.userId);
      const newVersion = (currentConfig?.version || 0) + 1;

      // Prepare upload data
      const uploadData = {
        version: newVersion,
        lastModified: Date.now(),
        lastModifiedBy: this.options.deviceId,
        data: this.options.encryptionEnabled ? encryptedData.data : configString,
        encryption,
        hash: configHash,
        size: configSize,
        metadata: this._extractMetadata(config)
      };

      // Upload to Firebase
      await this.provider.updateUserConfig(this.options.userId, uploadData);

      // Add history entry
      await this.provider.addHistoryEntry(this.options.userId, {
        version: newVersion,
        previousVersion: currentConfig?.version || 0,
        deviceId: this.options.deviceId,
        deviceName: this.options.deviceName,
        changeType: currentConfig?.version ? 'update' : 'create',
        changeCount: 1,
        changedPaths: this._getChangedPaths(config, currentConfig),
        configHash,
        delta: null // Could implement delta tracking
      });

      // Update device stats
      await this.provider.updateDeviceStats(
        this.options.userId,
        this.options.deviceId,
        { uploadsCount: 1 }
      );

      // Complete sync operation if we started one
      if (!skipStateUpdate) {
        this.stateManager.completeSync(operation.id, {
          status: SyncResultStatus.SUCCESS,
          version: newVersion,
          timestamp: Date.now()
        });
      }

      logger.info(`Uploaded config version ${newVersion}`);

      return {
        success: true,
        version: newVersion,
        size: configSize,
        encrypted: this.options.encryptionEnabled
      };
    } catch (error) {
      logger.error('Upload failed:', error);
      if (!skipStateUpdate) {
        this.stateManager.transitionToError(error);
      }
      throw error;
    }
  }

  /**
   * Download configuration from cloud
   * @param {Object} options - Download options
   * @returns {Promise<Object>} Downloaded config and metadata
   */
  async download(options = {}) {
    await this._ensureInitialized();

    const skipStateUpdate = options.skipStateUpdate || false;
    let operation = null;

    try {
      // Start sync operation only if not already in a sync
      if (!skipStateUpdate) {
        operation = await this.stateManager.startSync({
          type: SyncOperationType.DOWNLOAD,
          options
        });
      }

      if (!skipStateUpdate) {
        this.stateManager.transitionToDownloading();
      }

      // Get remote config
      const remoteConfig = await this.provider.getUserConfig(this.options.userId);

      if (!remoteConfig || !remoteConfig.data) {
        if (!skipStateUpdate) {
          this.stateManager.completeSync(operation?.id, {
            status: SyncResultStatus.SUCCESS,
            message: 'No remote config found'
          });
        }

        return {
          success: true,
          config: null,
          version: 0,
          message: 'No remote configuration available'
        };
      }

      // Decrypt if needed
      let configString;
      if (this.options.encryptionEnabled && remoteConfig.encryption) {
        const encryptedData = {
          data: remoteConfig.data,
          iv: remoteConfig.encryption.iv,
          authTag: remoteConfig.encryption.authTag,
          algorithm: remoteConfig.encryption.algorithm
        };
        configString = await decryptData(encryptedData, this.encryptionKey);
      } else {
        configString = remoteConfig.data;
      }

      // Verify hash
      const computedHash = calculateHash(configString);
      if (computedHash !== remoteConfig.hash) {
        throw new Error('Config hash mismatch - data may be corrupted');
      }

      // Parse config
      const config = JSON.parse(configString);

      // Update device stats
      await this.provider.updateDeviceStats(
        this.options.userId,
        this.options.deviceId,
        { downloadsCount: 1 }
      );

      // Complete sync operation if we started one
      if (!skipStateUpdate) {
        this.stateManager.completeSync(operation?.id, {
          status: SyncResultStatus.SUCCESS,
          version: remoteConfig.version,
          timestamp: Date.now()
        });
      }

      this.lastSyncVersion = remoteConfig.version;

      logger.info(`Downloaded config version ${remoteConfig.version}`);

      return {
        success: true,
        config,
        version: remoteConfig.version,
        lastModified: remoteConfig.lastModified,
        metadata: remoteConfig.metadata
      };
    } catch (error) {
      logger.error('Download failed:', error);
      if (!skipStateUpdate) {
        this.stateManager.transitionToError(error);
      }
      throw error;
    }
  }

  /**
   * Sync configuration (bidirectional)
   * @param {Object} localConfig - Local configuration
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} Sync result
   */
  async sync(localConfig, options = {}) {
    await this._ensureInitialized();

    try {
      // Start sync operation
      const operation = await this.stateManager.startSync({
        type: SyncOperationType.BIDIRECTIONAL,
        config: localConfig,
        options
      });

      // Get remote config
      const remoteResult = await this.download({ skipStateUpdate: true });

      if (!remoteResult.config) {
        // No remote config, just upload
        const uploadResult = await this.upload(localConfig, { _internalSync: true });
        this.stateManager.completeSync(operation.id, {
          status: SyncResultStatus.SUCCESS,
          message: 'Uploaded (no remote)'
        });
        return uploadResult;
      }

      // Determine action based on force options first
      if (options.force === 'upload') {
        const uploadResult = await this.upload(localConfig, { _internalSync: true });
        this.stateManager.completeSync(operation.id, {
          status: SyncResultStatus.SUCCESS,
          message: 'Force uploaded'
        });
        return uploadResult;
      } else if (options.force === 'download') {
        this.stateManager.completeSync(operation.id, {
          status: SyncResultStatus.SUCCESS,
          message: 'Force downloaded'
        });
        return remoteResult;
      }

      // Check timestamps to determine if one side is clearly newer
      const localTimestamp = localConfig.lastModified || 0;
      const remoteTimestamp = remoteResult.config?.lastModified || 0;
      
      logger.info(`Timestamp comparison: local=${localTimestamp}, remote=${remoteTimestamp}, diff=${localTimestamp - remoteTimestamp}`);
      
      // If local is significantly newer (by more than 1 second), upload
      if (localTimestamp > remoteTimestamp + 1000) {
        logger.info('Local is newer, uploading');
        const uploadResult = await this.upload(localConfig, { _internalSync: true });
        this.stateManager.completeSync(operation.id, {
          status: SyncResultStatus.SUCCESS,
          message: 'Uploaded newer local version'
        });
        return uploadResult;
      }
      
      // If remote is significantly newer (by more than 1 second), download
      if (remoteTimestamp > localTimestamp + 1000) {
        logger.info('Remote is newer, downloading');
        this.stateManager.completeSync(operation.id, {
          status: SyncResultStatus.SUCCESS,
          message: 'Downloaded newer remote version'
        });
        return remoteResult;
      }

      // Timestamps are close, compare hashes for content changes
      const localHash = calculateHash(JSON.stringify(localConfig));
      const remoteHash = remoteResult.config 
        ? calculateHash(JSON.stringify(remoteResult.config)) 
        : null;

      logger.info(`Hash comparison: local=${localHash?.substring(0,8)}, remote=${remoteHash?.substring(0,8)}, equal=${localHash === remoteHash}`);

      if (localHash === remoteHash) {
        // No changes
        this.stateManager.completeSync(operation.id, {
          status: SyncResultStatus.SUCCESS,
          message: 'No changes to sync'
        });

        return {
          success: true,
          action: 'none',
          message: 'Local and remote are in sync'
        };
      }

      // Timestamps are close or equal, need conflict resolution
      // Detect and resolve conflicts
      logger.info('Resolving conflicts between local and remote');
      this.stateManager.transitionToResolvingConflicts();

      const conflictResult = this.conflictResolver.resolve(
        localConfig,
        remoteResult.config
      );

      logger.info('Conflict resolution complete', {
        conflicts: conflictResult.conflicts.length,
        autoResolved: conflictResult.autoResolved,
        needsManual: conflictResult.needsManualResolution()
      });

      // If manual resolution needed, return conflict info
      if (conflictResult.needsManualResolution()) {
        this.stateManager.completeSync(operation.id, {
          status: SyncResultStatus.SUCCESS,
          message: 'Manual conflict resolution required'
        });

        return {
          success: false,
          action: 'conflict',
          message: 'Manual conflict resolution required',
          conflicts: conflictResult.conflicts,
          resolved: conflictResult.resolved
        };
      }

      // Auto-resolved, upload merged config
      const mergedConfig = {
        ...conflictResult.resolved,
        lastModified: Date.now(),
        version: remoteResult.version + 1
      };

      const uploadResult = await this.upload(mergedConfig, { _internalSync: true });

      this.stateManager.completeSync(operation.id, {
        status: SyncResultStatus.SUCCESS,
        message: 'Conflicts resolved and synced'
      });

      return {
        success: true,
        action: 'merged',
        conflicts: conflictResult.conflicts.length,
        autoResolved: conflictResult.autoResolved,
        version: uploadResult.version
      };
    } catch (error) {
      logger.error('Sync failed:', error);
      this.stateManager.transitionToError(error);
      throw error;
    }
  }

  /**
   * Get sync status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      initialized: this.initialized,
      userId: this.options.userId,
      deviceId: this.options.deviceId,
      encryptionEnabled: this.options.encryptionEnabled,
      lastSyncVersion: this.lastSyncVersion,
      state: this.stateManager.getState(),
      stats: this.stateManager.getStats(),
      isOnline: this.stateManager.isOnline
    };
  }

  /**
   * Get sync history
   * @param {Object} options - Query options
   * @returns {Promise<Array>} History entries
   */
  async getHistory(options = {}) {
    await this._ensureInitialized();
    return await this.provider.getHistory(this.options.userId, options);
  }

  /**
   * Get devices
   * @param {Object} options - Query options  
   * @returns {Promise<Array>} Device list
   */
  async getDevices(options = {}) {
    await this._ensureInitialized();
    return await this.provider.getAllDevices(this.options.userId);
  }

  /**
   * Track local configuration change for offline support
   * @param {Object} config - Current configuration
   * @param {Object} previousConfig - Previous configuration (optional)
   * @returns {Promise<Array>} Tracked changes
   */
  async trackLocalChange(config, previousConfig = null) {
    await this._ensureInitialized();
    
    try {
      const changes = await this.offlineTracker.trackChange(config, previousConfig);
      
      if (changes.length > 0) {
        logger.info(`Tracked ${changes.length} local changes`);
        
        // If online, attempt auto-sync
        if (this.stateManager.getState() === 'idle' && this.offlineTracker.isOnline) {
          logger.debug('Online and idle, queuing sync operation');
          this.stateManager.queueOperation({
            type: SyncOperationType.UPLOAD,
            config,
            priority: 'normal'
          });
        }
      }

      return changes;
    } catch (error) {
      logger.error('Failed to track local change:', error);
      throw error;
    }
  }

  /**
   * Get offline tracker statistics
   * @returns {Object} Statistics about pending changes
   */
  getOfflineStats() {
    return this.offlineTracker.getStats();
  }

  /**
   * Get pending offline changes
   * @returns {Array} Pending changes
   */
  getPendingChanges() {
    return this.offlineTracker.getPendingChanges();
  }

  /**
   * Mark changes as synced
   * @param {Array} changeIds - IDs of changes to mark as synced
   * @returns {Promise<void>}
   */
  async markChangesSynced(changeIds) {
    return await this.offlineTracker.markSynced(changeIds);
  }

  /**
   * Set online/offline status
   * @param {boolean} online - Online status
   */
  setOnlineStatus(online) {
    this.stateManager.setOnlineStatus(online);
  }

  /**
   * Close and cleanup
   * @returns {Promise<void>}
   */
  async close() {
    if (this.provider) {
      await this.provider.close();
    }
    this.initialized = false;
    logger.info('Cloud sync manager closed');
  }

  /**
   * Initialize encryption
   * @param {string} [passphrase] - Optional passphrase
   * @private
   */
  async _initializeEncryption(passphrase) {
    const result = await loadOrCreateKey(passphrase);
    this.encryptionKey = result.key;
    this.keyId = result.keyId;
  }

  /**
   * Register this device with the cloud
   * @private
   */
  async _registerDevice() {
    const deviceData = {
      deviceId: this.options.deviceId,
      name: this.options.deviceName,
      hostname: os.hostname(),
      platform: os.platform(),
      osVersion: os.release(),
      appVersion: '1.0.0', // TODO: Get from package.json
      nodeVersion: process.version,
      lastSyncAt: Date.now(),
      lastSyncVersion: this.lastSyncVersion,
      lastSyncDirection: 'bidirectional'
    };

    await this.provider.registerDevice(this.options.userId, deviceData);
  }

  /**
   * Extract metadata from config
   * @param {Object} config - Configuration object
   * @returns {Object} Metadata
   * @private
   */
  _extractMetadata(config) {
    return {
      projectCount: config.projects ? Object.keys(config.projects).length : 0,
      groupCount: config.groups ? Object.keys(config.groups).length : 0,
      activeProject: config.active_project || null,
      activeGroup: config.active_group || null
    };
  }

  /**
   * Get changed paths between configs
   * @param {Object} newConfig - New configuration
   * @param {Object} oldConfig - Old configuration
   * @returns {Array} Changed paths
   * @private
   */
  _getChangedPaths(newConfig, oldConfig) {
    // Simplified - just return top-level keys that changed
    const changed = [];
    
    if (!oldConfig) {
      return Object.keys(newConfig);
    }

    const newKeys = Object.keys(newConfig);
    const oldKeys = Object.keys(oldConfig);

    // Check for new or modified keys
    for (const key of newKeys) {
      if (!oldKeys.includes(key) || 
          JSON.stringify(newConfig[key]) !== JSON.stringify(oldConfig[key])) {
        changed.push(key);
      }
    }

    // Check for deleted keys
    for (const key of oldKeys) {
      if (!newKeys.includes(key)) {
        changed.push(`-${key}`);
      }
    }

    return changed;
  }

  /**
   * Generate unique device ID
   * @returns {string} Device ID
   * @private
   */
  _generateDeviceId() {
    return `device_${uuidv4()}`;
  }

  /**
   * Ensure manager is initialized
   * @private
   */
  async _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Sync manager not initialized. Call initialize() first.');
    }
  }
}

export default CloudSyncManager;

