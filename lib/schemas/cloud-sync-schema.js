/**
 * Cloud Storage Schema for Config Synchronization
 * 
 * This schema defines the structure for storing and synchronizing project registry data
 * across multiple machines via cloud storage. Designed for Firebase Firestore, but can be
 * adapted to other NoSQL databases.
 * 
 * @module schemas/cloud-sync-schema
 */

/**
 * Cloud Storage Schema Version
 * Increment when making breaking changes to the schema
 */
export const SCHEMA_VERSION = '1.0.0';

/**
 * Maximum number of history entries to keep per user
 * Prevents unbounded growth while maintaining sufficient history for conflict resolution
 */
export const MAX_HISTORY_ENTRIES = 100;

/**
 * Maximum size of config data in bytes (5MB)
 * Protects against storage abuse and ensures reasonable sync times
 */
export const MAX_CONFIG_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Main Cloud Storage Schema
 * 
 * Top-level collection: users/{userId}
 * 
 * Each user document contains:
 * - profile: User metadata
 * - config: Current configuration snapshot
 * - devices: Sub-collection of devices
 * - history: Sub-collection of change history
 */
export const CloudStorageSchema = {
  /**
   * User Document Structure
   * Path: users/{userId}
   */
  userDocument: {
    // Schema version for migration tracking
    schemaVersion: String, // e.g., "1.0.0"
    
    // User profile information
    profile: {
      email: String,
      name: String,
      createdAt: Number, // Unix timestamp in milliseconds
      lastSyncAt: Number, // Unix timestamp of last successful sync
      totalSyncCount: Number, // Total number of syncs performed
      
      // User preferences for sync behavior
      preferences: {
        autoSync: Boolean, // Enable automatic syncing
        syncInterval: Number, // Sync interval in minutes
        conflictResolution: String, // 'auto' | 'manual' | 'remote-wins' | 'local-wins'
        encryptionEnabled: Boolean, // Whether to encrypt config data
        retentionDays: Number // How long to keep history entries
      }
    },
    
    // Current configuration snapshot
    config: {
      version: Number, // Monotonically increasing version number
      lastModified: Number, // Unix timestamp
      lastModifiedBy: String, // Device ID that made the change
      
      // Encrypted configuration data (AES-256-GCM)
      // Contains the full config.json content
      data: String, // Base64 encoded encrypted data
      
      // Encryption metadata
      encryption: {
        algorithm: String, // e.g., "AES-256-GCM"
        iv: String, // Base64 encoded initialization vector
        authTag: String, // Base64 encoded authentication tag
        keyId: String // Reference to user's encryption key
      },
      
      // Hash of unencrypted content for integrity verification
      // SHA-256 hash of the original JSON string
      hash: String, // Hex string
      
      // Size of unencrypted data in bytes
      size: Number,
      
      // Quick access fields (unencrypted) for querying/display
      metadata: {
        projectCount: Number,
        groupCount: Number,
        activeProject: String,
        activeGroup: String
      }
    },
    
    // Statistics for monitoring and debugging
    stats: {
      totalConflicts: Number,
      autoResolvedConflicts: Number,
      manualResolvedConflicts: Number,
      failedSyncs: Number,
      successfulSyncs: Number,
      lastError: {
        timestamp: Number,
        message: String,
        code: String
      }
    }
  },
  
  /**
   * Device Sub-collection
   * Path: users/{userId}/devices/{deviceId}
   * 
   * Tracks each device that syncs with this user account
   */
  deviceDocument: {
    // Device identification
    deviceId: String, // Unique identifier (UUID)
    name: String, // User-friendly name (e.g., "MacBook Pro")
    hostname: String, // OS hostname
    platform: String, // OS platform (darwin, linux, win32)
    osVersion: String, // OS version
    
    // Application information
    appVersion: String, // Orchestrator version running on this device
    nodeVersion: String, // Node.js version
    
    // Sync status
    lastSyncAt: Number, // Last successful sync timestamp
    lastSyncVersion: Number, // Config version last synced
    lastSyncDirection: String, // 'upload' | 'download' | 'bidirectional'
    
    // Device state
    isActive: Boolean, // Whether this device is currently active
    firstSeenAt: Number, // First time this device synced
    lastSeenAt: Number, // Most recent activity
    
    // Sync statistics
    stats: {
      totalSyncs: Number,
      uploadsCount: Number,
      downloadsCount: Number,
      conflictsCount: Number,
      lastConflictAt: Number
    }
  },
  
  /**
   * History Sub-collection
   * Path: users/{userId}/history/{versionNumber}
   * 
   * Maintains change history for conflict resolution and audit trail
   */
  historyDocument: {
    // Version tracking
    version: Number, // Matches config.version
    previousVersion: Number, // Previous version number
    
    // Change metadata
    timestamp: Number, // Unix timestamp
    deviceId: String, // Device that made this change
    deviceName: String, // User-friendly device name
    
    // Change details
    changeType: String, // 'create' | 'update' | 'delete' | 'merge'
    changeCount: Number, // Number of fields changed
    
    // Paths that changed (for granular conflict detection)
    // e.g., ["projects.myProject.path", "active_project"]
    changedPaths: Array, // Array of strings
    
    // Hash of full config at this version
    configHash: String, // SHA-256 hex string
    
    // Optional: Store delta/patch instead of full config
    // For space efficiency, we can store just the changes
    delta: {
      added: Object, // New fields/values
      modified: Object, // Changed fields (old -> new)
      deleted: Array // Removed field paths
    },
    
    // Conflict information if this was a merge
    conflictInfo: {
      hadConflict: Boolean,
      conflictingVersion: Number, // Version that conflicted
      conflictingDevice: String, // Device that created the conflict
      resolutionStrategy: String, // How conflict was resolved
      manualIntervention: Boolean, // Whether user intervention was required
      conflictPaths: Array // Specific paths that conflicted
    }
  }
};

/**
 * Cloud Storage Indexes
 * 
 * Define indexes for efficient querying
 */
export const CloudStorageIndexes = {
  // User collection indexes
  users: [
    { field: 'profile.email', order: 'asc' },
    { field: 'profile.lastSyncAt', order: 'desc' },
    { field: 'config.version', order: 'desc' }
  ],
  
  // Device sub-collection indexes
  devices: [
    { field: 'lastSyncAt', order: 'desc' },
    { field: 'isActive', order: 'desc' },
    { 
      fields: ['isActive', 'lastSyncAt'],
      orders: ['desc', 'desc']
    }
  ],
  
  // History sub-collection indexes
  history: [
    { field: 'version', order: 'desc' },
    { field: 'timestamp', order: 'desc' },
    { field: 'deviceId', order: 'asc' },
    {
      fields: ['deviceId', 'timestamp'],
      orders: ['asc', 'desc']
    }
  ]
};

/**
 * Security Rules (Firestore format)
 * 
 * Ensures users can only access their own data
 */
export const CloudStorageSecurityRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isValidConfigSize() {
      return request.resource.data.config.size <= ${MAX_CONFIG_SIZE_BYTES};
    }
    
    function isValidVersion() {
      // Version must increment by exactly 1
      return request.resource.data.config.version == resource.data.config.version + 1;
    }
    
    // User documents
    match /users/{userId} {
      // Users can only read/write their own data
      allow read, write: if isOwner(userId) && isValidConfigSize();
      
      // Device sub-collection
      match /devices/{deviceId} {
        allow read, write: if isOwner(userId);
      }
      
      // History sub-collection
      match /history/{versionNumber} {
        // Can read history, can only create new entries (not update/delete)
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) && isValidVersion();
        allow update, delete: if false; // History is immutable
      }
    }
  }
}
`;

/**
 * Data Size Limits
 * 
 * Firestore has specific size limits that we must respect
 */
export const CloudStorageLimits = {
  // Firestore limits
  maxDocumentSize: 1048576, // 1 MB per document
  maxArraySize: 1000000, // 1 million elements
  maxFieldDepth: 20, // Maximum nesting depth
  maxFieldNameLength: 1500, // Characters
  maxStringSize: 1048487, // Bytes (~1 MB)
  
  // Our application limits
  maxConfigSize: MAX_CONFIG_SIZE_BYTES,
  maxHistoryEntries: MAX_HISTORY_ENTRIES,
  maxDevicesPerUser: 50, // Reasonable limit for devices
  maxProjectsPerConfig: 1000, // Reasonable limit for projects
  maxGroupsPerConfig: 100 // Reasonable limit for groups
};

/**
 * Example document structure (for reference)
 */
export const ExampleUserDocument = {
  schemaVersion: "1.0.0",
  profile: {
    email: "user@example.com",
    name: "John Doe",
    createdAt: 1699564800000,
    lastSyncAt: 1699651200000,
    totalSyncCount: 42,
    preferences: {
      autoSync: true,
      syncInterval: 15,
      conflictResolution: "auto",
      encryptionEnabled: true,
      retentionDays: 90
    }
  },
  config: {
    version: 15,
    lastModified: 1699651200000,
    lastModifiedBy: "device-uuid-1234",
    data: "encrypted-base64-string...",
    encryption: {
      algorithm: "AES-256-GCM",
      iv: "base64-iv...",
      authTag: "base64-auth-tag...",
      keyId: "key-uuid"
    },
    hash: "sha256-hex-string...",
    size: 12458,
    metadata: {
      projectCount: 5,
      groupCount: 2,
      activeProject: "my-project",
      activeGroup: "development"
    }
  },
  stats: {
    totalConflicts: 3,
    autoResolvedConflicts: 3,
    manualResolvedConflicts: 0,
    failedSyncs: 1,
    successfulSyncs: 41,
    lastError: {
      timestamp: 1699564800000,
      message: "Network timeout",
      code: "SYNC-001"
    }
  }
};

export const ExampleDeviceDocument = {
  deviceId: "device-uuid-1234",
  name: "MacBook Pro",
  hostname: "johns-macbook-pro.local",
  platform: "darwin",
  osVersion: "14.0",
  appVersion: "1.5.0",
  nodeVersion: "v20.9.0",
  lastSyncAt: 1699651200000,
  lastSyncVersion: 15,
  lastSyncDirection: "bidirectional",
  isActive: true,
  firstSeenAt: 1699478400000,
  lastSeenAt: 1699651200000,
  stats: {
    totalSyncs: 25,
    uploadsCount: 12,
    downloadsCount: 10,
    conflictsCount: 3,
    lastConflictAt: 1699564800000
  }
};

export const ExampleHistoryDocument = {
  version: 15,
  previousVersion: 14,
  timestamp: 1699651200000,
  deviceId: "device-uuid-1234",
  deviceName: "MacBook Pro",
  changeType: "update",
  changeCount: 2,
  changedPaths: [
    "projects.new-project",
    "config.version"
  ],
  configHash: "sha256-hex-of-full-config...",
  delta: {
    added: {
      "projects.new-project": {
        path: "/path/to/project",
        created: "2024-11-10T12:00:00.000Z"
      }
    },
    modified: {},
    deleted: []
  },
  conflictInfo: {
    hadConflict: false,
    conflictingVersion: null,
    conflictingDevice: null,
    resolutionStrategy: null,
    manualIntervention: false,
    conflictPaths: []
  }
};

export default {
  SCHEMA_VERSION,
  MAX_HISTORY_ENTRIES,
  MAX_CONFIG_SIZE_BYTES,
  CloudStorageSchema,
  CloudStorageIndexes,
  CloudStorageSecurityRules,
  CloudStorageLimits,
  ExampleUserDocument,
  ExampleDeviceDocument,
  ExampleHistoryDocument
};

