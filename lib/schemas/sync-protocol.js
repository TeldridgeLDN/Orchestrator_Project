/**
 * Synchronization Protocol for Cloud Config Sync
 * 
 * Defines the protocol, message formats, and workflows for synchronizing
 * configuration data between local machines and cloud storage.
 * 
 * @module schemas/sync-protocol
 */

import { SCHEMA_VERSION } from './cloud-sync-schema.js';

/**
 * Protocol Version
 * Increment when making breaking changes to the sync protocol
 */
export const PROTOCOL_VERSION = '1.0.0';

/**
 * Sync Operation Types
 */
export const SyncOperationType = {
  UPLOAD: 'upload',           // Push local changes to cloud
  DOWNLOAD: 'download',       // Pull remote changes to local
  BIDIRECTIONAL: 'bidirectional',  // Two-way sync
  CHECK: 'check',            // Check sync status without syncing
  RESOLVE: 'resolve'         // Resolve conflicts
};

/**
 * Sync Status
 */
export const SyncStatus = {
  IDLE: 'idle',                    // No sync in progress
  CHECKING: 'checking',            // Checking remote version
  UPLOADING: 'uploading',          // Uploading changes
  DOWNLOADING: 'downloading',      // Downloading changes
  RESOLVING: 'resolving',          // Resolving conflicts
  COMPLETE: 'complete',            // Sync completed successfully
  ERROR: 'error',                  // Sync failed
  QUEUED: 'queued'                 // Sync queued (offline)
};

/**
 * Sync Result Status
 */
export const SyncResultStatus = {
  SUCCESS: 'success',              // Sync completed without issues
  NO_CHANGES: 'no-changes',        // No changes to sync
  CONFLICT: 'conflict',            // Conflicts detected
  MERGED: 'merged',                // Conflicts resolved and merged
  ERROR: 'error',                  // Sync failed with error
  PARTIAL: 'partial'               // Partially synced
};

/**
 * Conflict Resolution Strategy
 */
export const ConflictStrategy = {
  AUTO: 'auto',                    // Apply automatic resolution rules
  MANUAL: 'manual',                // Always prompt user
  REMOTE_WINS: 'remote-wins',      // Always prefer remote
  LOCAL_WINS: 'local-wins',        // Always prefer local
  MERGE: 'merge'                   // Three-way merge
};

/**
 * Sync State Machine
 * 
 * Defines valid state transitions for sync operations
 */
export const SyncStateMachine = {
  transitions: {
    [SyncStatus.IDLE]: [
      SyncStatus.CHECKING,
      SyncStatus.QUEUED
    ],
    [SyncStatus.CHECKING]: [
      SyncStatus.UPLOADING,
      SyncStatus.DOWNLOADING,
      SyncStatus.COMPLETE,
      SyncStatus.ERROR
    ],
    [SyncStatus.UPLOADING]: [
      SyncStatus.COMPLETE,
      SyncStatus.ERROR,
      SyncStatus.RESOLVING
    ],
    [SyncStatus.DOWNLOADING]: [
      SyncStatus.COMPLETE,
      SyncStatus.ERROR,
      SyncStatus.RESOLVING
    ],
    [SyncStatus.RESOLVING]: [
      SyncStatus.UPLOADING,
      SyncStatus.COMPLETE,
      SyncStatus.ERROR
    ],
    [SyncStatus.QUEUED]: [
      SyncStatus.CHECKING,
      SyncStatus.ERROR
    ],
    [SyncStatus.COMPLETE]: [
      SyncStatus.IDLE
    ],
    [SyncStatus.ERROR]: [
      SyncStatus.IDLE
    ]
  },
  
  /**
   * Check if state transition is valid
   */
  canTransition(from, to) {
    return this.transitions[from]?.includes(to) || false;
  }
};

/**
 * Sync Protocol Messages
 * 
 * Defines message structures for sync communication
 */
export const SyncMessage = {
  /**
   * Check Remote Status Request
   */
  CheckStatusRequest: {
    type: 'check-status-request',
    userId: String,
    deviceId: String,
    localVersion: Number,
    timestamp: Number
  },
  
  /**
   * Check Remote Status Response
   */
  CheckStatusResponse: {
    type: 'check-status-response',
    remoteVersion: Number,
    lastModified: Number,
    lastModifiedBy: String,
    needsSync: Boolean,
    syncDirection: String,  // 'upload' | 'download' | 'bidirectional' | 'none'
    timestamp: Number
  },
  
  /**
   * Upload Config Request
   */
  UploadConfigRequest: {
    type: 'upload-config-request',
    userId: String,
    deviceId: String,
    version: Number,
    previousVersion: Number,
    encryptedConfig: String,
    configHash: String,
    metadata: {
      projectCount: Number,
      groupCount: Number,
      activeProject: String,
      activeGroup: String
    },
    delta: {
      added: Object,
      modified: Object,
      deleted: Array
    },
    timestamp: Number
  },
  
  /**
   * Upload Config Response
   */
  UploadConfigResponse: {
    type: 'upload-config-response',
    success: Boolean,
    newVersion: Number,
    error: String || null,
    timestamp: Number
  },
  
  /**
   * Download Config Request
   */
  DownloadConfigRequest: {
    type: 'download-config-request',
    userId: String,
    deviceId: String,
    localVersion: Number,
    timestamp: Number
  },
  
  /**
   * Download Config Response
   */
  DownloadConfigResponse: {
    type: 'download-config-response',
    version: Number,
    lastModified: Number,
    encryptedConfig: String,
    configHash: String,
    metadata: Object,
    timestamp: Number
  },
  
  /**
   * Conflict Detected Notification
   */
  ConflictNotification: {
    type: 'conflict-notification',
    localVersion: Number,
    remoteVersion: Number,
    conflictingPaths: Array,
    requiresManualResolution: Boolean,
    timestamp: Number
  },
  
  /**
   * Resolve Conflict Request
   */
  ResolveConflictRequest: {
    type: 'resolve-conflict-request',
    userId: String,
    deviceId: String,
    strategy: String,  // ConflictStrategy value
    resolvedConfig: String,  // Encrypted merged config
    resolvedVersion: Number,
    timestamp: Number
  },
  
  /**
   * Real-time Sync Event
   * Broadcast to other devices when config changes
   */
  SyncEvent: {
    type: 'sync-event',
    userId: String,
    deviceId: String,
    deviceName: String,
    version: Number,
    changeType: String,  // 'create' | 'update' | 'delete' | 'merge'
    changedPaths: Array,
    timestamp: Number
  }
};

/**
 * Synchronization Workflow
 * 
 * Defines the step-by-step process for different sync operations
 */
export const SyncWorkflow = {
  /**
   * Bidirectional Sync Workflow
   */
  bidirectional: [
    {
      step: 1,
      name: 'initialize',
      description: 'Initialize sync, authenticate, and get device ID',
      requiredData: ['userId', 'deviceId', 'authToken']
    },
    {
      step: 2,
      name: 'check-status',
      description: 'Check remote version and determine sync direction',
      requiredData: ['localVersion'],
      produces: ['remoteVersion', 'syncDirection']
    },
    {
      step: 3,
      name: 'detect-conflicts',
      description: 'Compare versions and detect conflicts',
      requiredData: ['localVersion', 'remoteVersion', 'localHash', 'remoteHash'],
      produces: ['hasConflict', 'conflictPaths']
    },
    {
      step: 4,
      name: 'download-remote',
      description: 'Download remote config if remote is ahead',
      condition: 'remoteVersion > localVersion',
      requiredData: ['userId', 'deviceId'],
      produces: ['remoteConfig']
    },
    {
      step: 5,
      name: 'merge-changes',
      description: 'Merge local and remote changes if conflict exists',
      condition: 'hasConflict',
      requiredData: ['localConfig', 'remoteConfig', 'conflictStrategy'],
      produces: ['mergedConfig', 'conflictResolutions']
    },
    {
      step: 6,
      name: 'apply-local',
      description: 'Apply merged or remote config to local storage',
      condition: 'remoteVersion >= localVersion',
      requiredData: ['configToApply'],
      produces: ['localConfigUpdated']
    },
    {
      step: 7,
      name: 'generate-delta',
      description: 'Generate delta for changes since last sync',
      condition: 'localVersion >= remoteVersion',
      requiredData: ['localConfig', 'previousVersion'],
      produces: ['delta']
    },
    {
      step: 8,
      name: 'encrypt-config',
      description: 'Encrypt config for upload',
      condition: 'needsUpload',
      requiredData: ['configToUpload', 'encryptionKey'],
      produces: ['encryptedConfig', 'configHash']
    },
    {
      step: 9,
      name: 'upload-changes',
      description: 'Upload changes to cloud',
      condition: 'needsUpload',
      requiredData: ['encryptedConfig', 'newVersion', 'delta'],
      produces: ['uploadResult']
    },
    {
      step: 10,
      name: 'update-device-status',
      description: 'Update device sync status',
      requiredData: ['deviceId', 'newVersion', 'syncDirection'],
      produces: ['deviceStatusUpdated']
    },
    {
      step: 11,
      name: 'add-history',
      description: 'Add history entry for this sync',
      requiredData: ['version', 'delta', 'conflictInfo'],
      produces: ['historyEntryAdded']
    },
    {
      step: 12,
      name: 'broadcast-event',
      description: 'Broadcast sync event to other devices',
      requiredData: ['userId', 'deviceId', 'version', 'changedPaths'],
      produces: ['eventBroadcast']
    },
    {
      step: 13,
      name: 'complete',
      description: 'Mark sync as complete and transition to idle',
      requiredData: ['syncResult'],
      produces: ['syncComplete']
    }
  ],
  
  /**
   * Upload-only Sync Workflow
   */
  upload: [
    { step: 1, name: 'initialize', description: 'Initialize sync and authenticate' },
    { step: 2, name: 'check-status', description: 'Check remote version' },
    { step: 3, name: 'generate-delta', description: 'Generate delta for upload' },
    { step: 4, name: 'encrypt-config', description: 'Encrypt config' },
    { step: 5, name: 'upload-changes', description: 'Upload to cloud' },
    { step: 6, name: 'update-device-status', description: 'Update sync status' },
    { step: 7, name: 'add-history', description: 'Add history entry' },
    { step: 8, name: 'broadcast-event', description: 'Broadcast to other devices' },
    { step: 9, name: 'complete', description: 'Mark sync complete' }
  ],
  
  /**
   * Download-only Sync Workflow
   */
  download: [
    { step: 1, name: 'initialize', description: 'Initialize sync and authenticate' },
    { step: 2, name: 'check-status', description: 'Check remote version' },
    { step: 3, name: 'download-remote', description: 'Download remote config' },
    { step: 4, name: 'decrypt-config', description: 'Decrypt downloaded config' },
    { step: 5, name: 'apply-local', description: 'Apply to local storage' },
    { step: 6, name: 'update-device-status', description: 'Update sync status' },
    { step: 7, name: 'complete', description: 'Mark sync complete' }
  ],
  
  /**
   * Check-only Workflow
   */
  check: [
    { step: 1, name: 'initialize', description: 'Initialize and authenticate' },
    { step: 2, name: 'check-status', description: 'Check remote version' },
    { step: 3, name: 'compare-versions', description: 'Compare with local' },
    { step: 4, name: 'return-status', description: 'Return sync status' }
  ]
};

/**
 * Sync Triggers Configuration
 */
export const SyncTriggers = {
  /**
   * Manual trigger - user initiated
   */
  manual: {
    enabled: true,
    command: 'diet103 sync',
    description: 'User explicitly runs sync command'
  },
  
  /**
   * File watch trigger - config file changes
   */
  fileWatch: {
    enabled: true,
    debounceMs: 5000,  // Wait 5s after last change before syncing
    watchPaths: ['~/.claude/config.json'],
    description: 'Automatic sync when config file changes'
  },
  
  /**
   * Periodic trigger - background sync
   */
  periodic: {
    enabled: true,
    intervalMinutes: 15,  // Sync every 15 minutes
    onlyIfChanges: true,  // Only sync if local changes exist
    description: 'Periodic background sync'
  },
  
  /**
   * Startup trigger - on application start
   */
  startup: {
    enabled: true,
    timeoutMs: 10000,  // Max 10s wait for startup sync
    blocking: false,   // Don't block application startup
    description: 'Sync when application starts'
  },
  
  /**
   * Pre-operation trigger - before critical operations
   */
  preOperation: {
    enabled: true,
    operations: ['project-switch', 'project-create', 'project-delete'],
    timeoutMs: 5000,
    description: 'Sync before critical operations'
  },
  
  /**
   * Real-time trigger - when remote changes detected
   */
  realtime: {
    enabled: true,
    autoApply: true,   // Automatically apply remote changes
    notifyUser: true,  // Notify user of remote changes
    description: 'React to real-time sync events from other devices'
  }
};

/**
 * Sync Preferences / Configuration
 */
export const SyncPreferences = {
  /**
   * Default sync configuration
   */
  defaults: {
    // Enable/disable sync globally
    enabled: true,
    
    // Auto-sync mode
    autoSync: true,
    
    // Sync direction
    direction: SyncOperationType.BIDIRECTIONAL,
    
    // Conflict resolution strategy
    conflictStrategy: ConflictStrategy.AUTO,
    
    // Sync triggers
    triggers: SyncTriggers,
    
    // Retry configuration
    retry: {
      maxAttempts: 3,
      backoffMs: 1000,      // Initial backoff
      backoffMultiplier: 2,  // Exponential backoff
      maxBackoffMs: 30000    // Max 30s between retries
    },
    
    // Timeout configuration
    timeouts: {
      checkStatusMs: 5000,
      uploadMs: 30000,
      downloadMs: 30000,
      resolveConflictMs: 60000
    },
    
    // Offline behavior
    offline: {
      queueChanges: true,
      maxQueueSize: 100,
      syncOnReconnect: true
    },
    
    // Network configuration
    network: {
      compression: true,
      minBatchSize: 1,
      maxBatchSize: 50
    },
    
    // Security
    security: {
      encryptionEnabled: true,
      algorithm: 'AES-256-GCM',
      verifyIntegrity: true
    },
    
    // Performance
    performance: {
      debounceMs: 5000,
      throttleMs: 1000,
      maxConcurrentSyncs: 1
    },
    
    // Logging
    logging: {
      level: 'info',  // 'debug' | 'info' | 'warn' | 'error'
      logSyncEvents: true,
      logConflicts: true,
      logPerformance: true
    }
  },
  
  /**
   * User preference schema
   */
  schema: {
    enabled: Boolean,
    autoSync: Boolean,
    direction: String,
    conflictStrategy: String,
    triggers: Object,
    retry: Object,
    timeouts: Object,
    offline: Object,
    network: Object,
    security: Object,
    performance: Object,
    logging: Object
  }
};

/**
 * Sync Error Codes
 */
export const SyncErrorCode = {
  // Network errors
  NETWORK_ERROR: 'SYNC-NET-001',
  TIMEOUT: 'SYNC-NET-002',
  CONNECTION_LOST: 'SYNC-NET-003',
  
  // Authentication errors
  AUTH_REQUIRED: 'SYNC-AUTH-001',
  AUTH_INVALID: 'SYNC-AUTH-002',
  AUTH_EXPIRED: 'SYNC-AUTH-003',
  
  // Version errors
  VERSION_CONFLICT: 'SYNC-VER-001',
  VERSION_MISMATCH: 'SYNC-VER-002',
  STALE_DATA: 'SYNC-VER-003',
  
  // Data errors
  INVALID_CONFIG: 'SYNC-DATA-001',
  ENCRYPTION_ERROR: 'SYNC-DATA-002',
  DECRYPTION_ERROR: 'SYNC-DATA-003',
  HASH_MISMATCH: 'SYNC-DATA-004',
  SIZE_EXCEEDED: 'SYNC-DATA-005',
  
  // Conflict errors
  CONFLICT_UNRESOLVED: 'SYNC-CONF-001',
  CONFLICT_MANUAL_REQUIRED: 'SYNC-CONF-002',
  
  // Storage errors
  STORAGE_FULL: 'SYNC-STOR-001',
  STORAGE_READ_ERROR: 'SYNC-STOR-002',
  STORAGE_WRITE_ERROR: 'SYNC-STOR-003',
  
  // General errors
  UNKNOWN_ERROR: 'SYNC-GEN-001',
  OPERATION_CANCELLED: 'SYNC-GEN-002',
  DEVICE_NOT_REGISTERED: 'SYNC-GEN-003'
};

/**
 * Sync Protocol API
 */
export const SyncProtocolAPI = {
  /**
   * Initialize sync session
   */
  initializeSync: async (userId, deviceId, authToken) => {
    // Implementation in sync-client.js
  },
  
  /**
   * Check sync status
   */
  checkSyncStatus: async (localVersion) => {
    // Implementation in sync-client.js
  },
  
  /**
   * Perform sync operation
   */
  performSync: async (operationType, options) => {
    // Implementation in sync-client.js
  },
  
  /**
   * Resolve conflicts
   */
  resolveConflicts: async (localConfig, remoteConfig, strategy) => {
    // Implementation in conflict-resolver.js
  },
  
  /**
   * Queue offline changes
   */
  queueOfflineChange: async (change) => {
    // Implementation in offline-queue.js
  },
  
  /**
   * Process offline queue
   */
  processOfflineQueue: async () => {
    // Implementation in offline-queue.js
  }
};

export default {
  PROTOCOL_VERSION,
  SyncOperationType,
  SyncStatus,
  SyncResultStatus,
  ConflictStrategy,
  SyncStateMachine,
  SyncMessage,
  SyncWorkflow,
  SyncTriggers,
  SyncPreferences,
  SyncErrorCode,
  SyncProtocolAPI
};

