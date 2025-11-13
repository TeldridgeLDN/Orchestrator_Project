/**
 * Firebase Firestore Cloud Provider
 * 
 * Implements cloud storage operations using Firebase Firestore
 * following the schema defined in cloud-sync-schema.js
 * 
 * @module cloud/firebase-provider
 */

import { initializeApp, getApps, cert } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { createLogger } from '../utils/logger.js';
import { 
  SCHEMA_VERSION, 
  MAX_HISTORY_ENTRIES,
  CloudStorageLimits 
} from '../schemas/cloud-sync-schema.js';

const logger = createLogger('FirebaseProvider');

/**
 * Firebase Cloud Provider
 * Handles all interactions with Firebase Firestore
 */
export class FirebaseCloudProvider {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.FIREBASE_API_KEY,
      authDomain: config.authDomain || process.env.FIREBASE_AUTH_DOMAIN,
      projectId: config.projectId || process.env.FIREBASE_PROJECT_ID,
      storageBucket: config.storageBucket || process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: config.messagingSenderId || process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: config.appId || process.env.FIREBASE_APP_ID,
      ...config
    };
    
    this.app = null;
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize Firebase app and Firestore
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      logger.debug('Firebase already initialized');
      return;
    }

    try {
      // Check if Firebase app is already initialized
      const apps = getApps();
      if (apps.length > 0) {
        this.app = apps[0];
        logger.debug('Using existing Firebase app');
      } else {
        // Initialize new Firebase app
        this.app = initializeApp(this.config);
        logger.info('Firebase app initialized');
      }

      // Get Firestore instance
      this.db = getFirestore(this.app);
      this.initialized = true;
      logger.info('Firestore initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase:', error);
      throw new Error(`Firebase initialization failed: ${error.message}`);
    }
  }

  /**
   * Ensure Firebase is initialized
   * @private
   */
  async _ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get user document reference
   * @param {string} userId - User ID
   * @returns {DocumentReference}
   * @private
   */
  _getUserRef(userId) {
    return doc(this.db, 'users', userId);
  }

  /**
   * Get device document reference
   * @param {string} userId - User ID
   * @param {string} deviceId - Device ID
   * @returns {DocumentReference}
   * @private
   */
  _getDeviceRef(userId, deviceId) {
    return doc(this.db, 'users', userId, 'devices', deviceId);
  }

  /**
   * Get history document reference
   * @param {string} userId - User ID
   * @param {number} version - Version number
   * @returns {DocumentReference}
   * @private
   */
  _getHistoryRef(userId, version) {
    return doc(this.db, 'users', userId, 'history', String(version));
  }

  /**
   * Get or create user document
   * @param {string} userId - User ID
   * @param {Object} profile - User profile data
   * @returns {Promise<Object>} User document
   */
  async getOrCreateUser(userId, profile = {}) {
    await this._ensureInitialized();

    try {
      const userRef = this._getUserRef(userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        logger.debug(`User ${userId} found`);
        return userSnap.data();
      }

      // Create new user document
      const newUser = {
        schemaVersion: SCHEMA_VERSION,
        profile: {
          email: profile.email || '',
          name: profile.name || '',
          createdAt: Date.now(),
          lastSyncAt: null,
          totalSyncCount: 0,
          preferences: {
            autoSync: true,
            syncInterval: 15,
            conflictResolution: 'auto',
            encryptionEnabled: true,
            retentionDays: 90,
            ...profile.preferences
          }
        },
        config: {
          version: 0,
          lastModified: null,
          lastModifiedBy: null,
          data: null,
          encryption: null,
          hash: null,
          size: 0,
          metadata: {
            projectCount: 0,
            groupCount: 0,
            activeProject: null,
            activeGroup: null
          }
        },
        stats: {
          totalConflicts: 0,
          autoResolvedConflicts: 0,
          manualResolvedConflicts: 0,
          failedSyncs: 0,
          successfulSyncs: 0,
          lastError: null
        }
      };

      await setDoc(userRef, newUser);
      logger.info(`Created new user document for ${userId}`);
      return newUser;
    } catch (error) {
      logger.error(`Failed to get/create user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user configuration
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User config or null if not found
   */
  async getUserConfig(userId) {
    await this._ensureInitialized();

    try {
      const userRef = this._getUserRef(userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        logger.warn(`User ${userId} not found`);
        return null;
      }

      const userData = userSnap.data();
      return userData.config;
    } catch (error) {
      logger.error(`Failed to get config for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user configuration
   * @param {string} userId - User ID
   * @param {Object} configData - Configuration data
   * @returns {Promise<Object>} Update result
   */
  async updateUserConfig(userId, configData) {
    await this._ensureInitialized();

    try {
      // Validate config size
      if (configData.size > CloudStorageLimits.maxConfigSize) {
        throw new Error(`Config size ${configData.size} exceeds limit ${CloudStorageLimits.maxConfigSize}`);
      }

      const userRef = this._getUserRef(userId);
      const updateData = {
        config: configData,
        'profile.lastSyncAt': Date.now(),
        'profile.totalSyncCount': (await this.getUserConfig(userId))?.version || 0 + 1
      };

      await updateDoc(userRef, updateData);
      
      logger.info(`Updated config for user ${userId}, version ${configData.version}`);
      
      return {
        success: true,
        version: configData.version,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`Failed to update config for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Register or update device
   * @param {string} userId - User ID
   * @param {Object} deviceData - Device data
   * @returns {Promise<Object>} Device document
   */
  async registerDevice(userId, deviceData) {
    await this._ensureInitialized();

    try {
      const deviceRef = this._getDeviceRef(userId, deviceData.deviceId);
      const deviceSnap = await getDoc(deviceRef);

      const now = Date.now();
      const isNewDevice = !deviceSnap.exists();

      const device = {
        ...deviceData,
        lastSeenAt: now,
        ...(isNewDevice && { firstSeenAt: now }),
        isActive: true,
        stats: deviceSnap.exists() 
          ? deviceSnap.data().stats 
          : {
              totalSyncs: 0,
              uploadsCount: 0,
              downloadsCount: 0,
              conflictsCount: 0,
              lastConflictAt: null
            }
      };

      await setDoc(deviceRef, device, { merge: true });
      
      logger.info(`${isNewDevice ? 'Registered' : 'Updated'} device ${deviceData.deviceId} for user ${userId}`);
      
      return device;
    } catch (error) {
      logger.error(`Failed to register device for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get device information
   * @param {string} userId - User ID
   * @param {string} deviceId - Device ID
   * @returns {Promise<Object|null>} Device data or null
   */
  async getDevice(userId, deviceId) {
    await this._ensureInitialized();

    try {
      const deviceRef = this._getDeviceRef(userId, deviceId);
      const deviceSnap = await getDoc(deviceRef);

      if (!deviceSnap.exists()) {
        return null;
      }

      return deviceSnap.data();
    } catch (error) {
      logger.error(`Failed to get device ${deviceId} for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get all devices for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of devices
   */
  async getDevices(userId, options = {}) {
    await this._ensureInitialized();

    try {
      const devicesRef = collection(this.db, 'users', userId, 'devices');
      let q = query(devicesRef);

      if (options.activeOnly) {
        q = query(q, where('isActive', '==', true));
      }

      q = query(q, orderBy('lastSeenAt', 'desc'));

      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const snapshot = await getDocs(q);
      const devices = [];
      
      snapshot.forEach(doc => {
        devices.push({ id: doc.id, ...doc.data() });
      });

      return devices;
    } catch (error) {
      logger.error(`Failed to get devices for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Add history entry
   * @param {string} userId - User ID
   * @param {Object} historyData - History entry data
   * @returns {Promise<Object>} Created history entry
   */
  async addHistoryEntry(userId, historyData) {
    await this._ensureInitialized();

    try {
      const historyRef = this._getHistoryRef(userId, historyData.version);
      
      const historyEntry = {
        ...historyData,
        timestamp: Date.now()
      };

      await setDoc(historyRef, historyEntry);
      
      // Prune old history entries if needed
      await this._pruneHistory(userId);
      
      logger.debug(`Added history entry for user ${userId}, version ${historyData.version}`);
      
      return historyEntry;
    } catch (error) {
      logger.error(`Failed to add history entry for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get history entries
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of history entries
   */
  async getHistory(userId, options = {}) {
    await this._ensureInitialized();

    try {
      const historyRef = collection(this.db, 'users', userId, 'history');
      let q = query(historyRef, orderBy('version', 'desc'));

      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      if (options.sinceVersion) {
        q = query(q, where('version', '>', options.sinceVersion));
      }

      const snapshot = await getDocs(q);
      const history = [];
      
      snapshot.forEach(doc => {
        history.push({ id: doc.id, ...doc.data() });
      });

      return history;
    } catch (error) {
      logger.error(`Failed to get history for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Prune old history entries
   * @param {string} userId - User ID
   * @private
   */
  async _pruneHistory(userId) {
    try {
      const historyRef = collection(this.db, 'users', userId, 'history');
      const q = query(historyRef, orderBy('version', 'desc'));
      const snapshot = await getDocs(q);

      if (snapshot.size <= MAX_HISTORY_ENTRIES) {
        return;
      }

      // Get entries to delete
      const toDelete = [];
      let count = 0;
      
      snapshot.forEach(doc => {
        count++;
        if (count > MAX_HISTORY_ENTRIES) {
          toDelete.push(doc.ref);
        }
      });

      if (toDelete.length > 0) {
        const batch = writeBatch(this.db);
        toDelete.forEach(ref => batch.delete(ref));
        await batch.commit();
        
        logger.info(`Pruned ${toDelete.length} old history entries for user ${userId}`);
      }
    } catch (error) {
      logger.warn(`Failed to prune history for user ${userId}:`, error);
      // Don't throw - pruning is not critical
    }
  }

  /**
   * Update sync statistics
   * @param {string} userId - User ID
   * @param {Object} stats - Statistics to update
   * @returns {Promise<void>}
   */
  async updateStats(userId, stats) {
    await this._ensureInitialized();

    try {
      const userRef = this._getUserRef(userId);
      const updateData = {};

      Object.keys(stats).forEach(key => {
        updateData[`stats.${key}`] = stats[key];
      });

      await updateDoc(userRef, updateData);
      logger.debug(`Updated stats for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to update stats for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update device sync statistics
   * @param {string} userId - User ID
   * @param {string} deviceId - Device ID
   * @param {Object} stats - Statistics to update
   * @returns {Promise<void>}
   */
  async updateDeviceStats(userId, deviceId, stats) {
    await this._ensureInitialized();

    try {
      const deviceRef = this._getDeviceRef(userId, deviceId);
      const updateData = {
        lastSyncAt: Date.now()
      };

      Object.keys(stats).forEach(key => {
        updateData[`stats.${key}`] = stats[key];
      });

      await updateDoc(deviceRef, updateData);
      logger.debug(`Updated device stats for ${deviceId}`);
    } catch (error) {
      logger.error(`Failed to update device stats:`, error);
      throw error;
    }
  }

  /**
   * Check if provider is initialized and ready
   * @returns {boolean}
   */
  isReady() {
    return this.initialized && this.db !== null;
  }

  /**
   * Close connections and cleanup
   * @returns {Promise<void>}
   */
  async close() {
    if (this.initialized) {
      // Firebase SDK doesn't require explicit cleanup for Firestore
      this.initialized = false;
      this.db = null;
      this.app = null;
      logger.info('Firebase provider closed');
    }
  }
}

export default FirebaseCloudProvider;

