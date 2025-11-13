# Synchronization Protocol Specification

## Overview

This document specifies the synchronization protocol for Diet103/Orchestrator's cloud config sync feature. The protocol defines how multiple devices communicate, detect changes, resolve conflicts, and maintain consistency.

## Protocol Version

**Current Version**: 1.0.0

The protocol version is separate from the schema version and increments when breaking changes are made to the sync communication protocol.

## Sync Operation Types

### 1. Bidirectional Sync (Default)
Synchronizes changes in both directions - uploads local changes and downloads remote changes.

**Use Cases**:
- Regular automatic syncing
- User-initiated sync
- Startup sync

**Flow**:
1. Check remote version
2. Determine sync direction based on versions
3. Handle conflicts if both sides have changes
4. Upload and/or download as needed

### 2. Upload-Only Sync
Pushes local changes to cloud without downloading remote changes.

**Use Cases**:
- Force push local state
- Initial setup/migration
- Backup current state

**Flow**:
1. Check remote version (optional)
2. Generate delta for local changes
3. Upload to cloud
4. Update device sync status

### 3. Download-Only Sync
Pulls remote changes without uploading local changes.

**Use Cases**:
- Setup new device
- Restore from backup
- Discard local changes

**Flow**:
1. Download remote config
2. Decrypt and validate
3. Apply to local storage
4. Update device sync status

### 4. Check-Only
Checks sync status without performing actual sync.

**Use Cases**:
- Status monitoring
- Pre-operation validation
- User status display

**Flow**:
1. Check remote version
2. Compare with local version
3. Return sync status
4. No changes made

## State Machine

### States

```
IDLE → CHECKING → UPLOADING → COMPLETE → IDLE
       ↓         ↘
       ERROR      DOWNLOADING → COMPLETE → IDLE
                  ↓
                  RESOLVING → UPLOADING → COMPLETE → IDLE
```

### State Descriptions

- **IDLE**: No sync operation in progress
- **CHECKING**: Querying remote for current version and status
- **UPLOADING**: Sending local changes to cloud
- **DOWNLOADING**: Retrieving remote changes from cloud
- **RESOLVING**: Resolving conflicts between local and remote
- **COMPLETE**: Sync operation completed successfully
- **ERROR**: Sync operation failed
- **QUEUED**: Sync operation queued (device offline)

### State Transitions

Valid transitions are enforced to prevent invalid states:

```javascript
IDLE → [CHECKING, QUEUED]
CHECKING → [UPLOADING, DOWNLOADING, COMPLETE, ERROR]
UPLOADING → [COMPLETE, ERROR, RESOLVING]
DOWNLOADING → [COMPLETE, ERROR, RESOLVING]
RESOLVING → [UPLOADING, COMPLETE, ERROR]
QUEUED → [CHECKING, ERROR]
COMPLETE → [IDLE]
ERROR → [IDLE]
```

## Message Protocol

### Message Format

All messages follow this structure:

```javascript
{
  type: String,        // Message type identifier
  timestamp: Number,   // Unix timestamp in milliseconds
  ...messageSpecificFields
}
```

### 1. Check Status

**Request**:
```javascript
{
  type: 'check-status-request',
  userId: String,
  deviceId: String,
  localVersion: Number,
  timestamp: Number
}
```

**Response**:
```javascript
{
  type: 'check-status-response',
  remoteVersion: Number,
  lastModified: Number,
  lastModifiedBy: String,
  needsSync: Boolean,
  syncDirection: String,  // 'upload' | 'download' | 'bidirectional' | 'none'
  timestamp: Number
}
```

### 2. Upload Config

**Request**:
```javascript
{
  type: 'upload-config-request',
  userId: String,
  deviceId: String,
  version: Number,
  previousVersion: Number,
  encryptedConfig: String,      // Base64 encoded
  configHash: String,            // SHA-256 hex
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
}
```

**Response**:
```javascript
{
  type: 'upload-config-response',
  success: Boolean,
  newVersion: Number,
  error: String || null,
  timestamp: Number
}
```

### 3. Download Config

**Request**:
```javascript
{
  type: 'download-config-request',
  userId: String,
  deviceId: String,
  localVersion: Number,
  timestamp: Number
}
```

**Response**:
```javascript
{
  type: 'download-config-response',
  version: Number,
  lastModified: Number,
  encryptedConfig: String,
  configHash: String,
  metadata: Object,
  timestamp: Number
}
```

### 4. Conflict Notification

Broadcast when conflicts are detected:

```javascript
{
  type: 'conflict-notification',
  localVersion: Number,
  remoteVersion: Number,
  conflictingPaths: Array,
  requiresManualResolution: Boolean,
  timestamp: Number
}
```

### 5. Resolve Conflict

**Request**:
```javascript
{
  type: 'resolve-conflict-request',
  userId: String,
  deviceId: String,
  strategy: String,          // ConflictStrategy value
  resolvedConfig: String,    // Encrypted merged config
  resolvedVersion: Number,
  timestamp: Number
}
```

### 6. Real-time Sync Event

Broadcast to other devices when config changes:

```javascript
{
  type: 'sync-event',
  userId: String,
  deviceId: String,
  deviceName: String,
  version: Number,
  changeType: String,      // 'create' | 'update' | 'delete' | 'merge'
  changedPaths: Array,
  timestamp: Number
}
```

## Synchronization Workflows

### Bidirectional Sync Workflow

#### Step 1: Initialize
- Authenticate user
- Get/generate device ID
- Check network connectivity

#### Step 2: Check Status
- Query remote for current version
- Compare with local version
- Determine sync direction

**Decision Logic**:
```javascript
if (remoteVersion > localVersion && localHasChanges) {
  syncDirection = 'bidirectional'; // Need to merge
} else if (remoteVersion > localVersion) {
  syncDirection = 'download';
} else if (localVersion > remoteVersion) {
  syncDirection = 'upload';
} else {
  syncDirection = 'none'; // Already in sync
}
```

#### Step 3: Detect Conflicts
- Compare config hashes
- Identify changed paths
- Determine if automatic resolution possible

**Conflict Detection**:
```javascript
const hasConflict = (
  localVersion !== remoteVersion &&
  localHash !== remoteHash &&
  hasUncommittedChanges(local) &&
  hasUncommittedChanges(remote)
);
```

#### Step 4: Download Remote (if needed)
- Request remote config
- Decrypt received data
- Validate integrity (hash check)

#### Step 5: Merge Changes (if conflict)
- Apply conflict resolution strategy
- Generate merged configuration
- Log conflict resolution details

#### Step 6: Apply Locally
- Backup current config
- Write merged/remote config to disk
- Validate written config

#### Step 7: Generate Delta
- Compare previous version with current
- Identify added/modified/deleted fields
- Create delta object

#### Step 8: Encrypt Config
- Load encryption key from keychain
- Encrypt config data (AES-256-GCM)
- Generate IV and auth tag
- Calculate hash of unencrypted data

#### Step 9: Upload Changes
- Prepare upload request
- Send to cloud storage
- Wait for confirmation
- Handle upload errors

#### Step 10: Update Device Status
- Update device's lastSyncAt
- Set lastSyncVersion
- Record sync direction
- Update sync statistics

#### Step 11: Add History Entry
- Create history document
- Include delta and conflict info
- Store in history sub-collection
- Prune old entries if needed

#### Step 12: Broadcast Event
- Create sync event message
- Broadcast to other connected devices
- Include changed paths
- Trigger remote device updates

#### Step 13: Complete
- Transition to COMPLETE state
- Return sync result
- Transition to IDLE state
- Schedule next periodic sync

### Error Handling

Each step includes error handling:

```javascript
try {
  await performStep();
} catch (error) {
  // Log error with context
  logSyncError(error, { step, context });
  
  // Determine if retryable
  if (isRetryableError(error) && retryCount < maxRetries) {
    // Apply exponential backoff
    await sleep(backoffMs * Math.pow(2, retryCount));
    return retryStep();
  }
  
  // Transition to ERROR state
  transitionTo(SyncStatus.ERROR);
  
  // Return error result
  return {
    status: SyncResultStatus.ERROR,
    error: error.message,
    code: error.code
  };
}
```

## Sync Triggers

### 1. Manual Trigger
User explicitly runs sync command:
```bash
diet103 sync
diet103 sync --direction=upload
diet103 sync --force
```

### 2. File Watch Trigger
Automatic sync when config.json changes:
```javascript
// Watch config file
chokidar.watch(CONFIG_PATH).on('change', debounce(() => {
  if (preferences.autoSync && preferences.triggers.fileWatch.enabled) {
    performSync({ type: SyncOperationType.BIDIRECTIONAL });
  }
}, 5000)); // 5 second debounce
```

### 3. Periodic Trigger
Background sync at regular intervals:
```javascript
setInterval(() => {
  if (preferences.autoSync && preferences.triggers.periodic.enabled) {
    if (!preferences.triggers.periodic.onlyIfChanges || hasLocalChanges()) {
      performSync({ type: SyncOperationType.BIDIRECTIONAL });
    }
  }
}, preferences.triggers.periodic.intervalMinutes * 60 * 1000);
```

### 4. Startup Trigger
Sync when application starts:
```javascript
async function onStartup() {
  if (preferences.triggers.startup.enabled) {
    const syncPromise = performSync({ 
      type: SyncOperationType.BIDIRECTIONAL,
      timeout: preferences.triggers.startup.timeoutMs
    });
    
    if (!preferences.triggers.startup.blocking) {
      // Don't wait for sync to complete
      syncPromise.catch(err => logSyncError(err));
      return;
    }
    
    await syncPromise;
  }
}
```

### 5. Pre-Operation Trigger
Sync before critical operations:
```javascript
async function switchProject(projectName) {
  if (preferences.triggers.preOperation.enabled) {
    await performSync({
      type: SyncOperationType.BIDIRECTIONAL,
      timeout: preferences.triggers.preOperation.timeoutMs
    });
  }
  
  // Proceed with project switch
  await doSwitchProject(projectName);
}
```

### 6. Real-time Trigger
React to changes from other devices:
```javascript
// Listen for sync events from Firebase
onSnapshot(syncEventsRef, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      const event = change.doc.data();
      
      // Ignore our own events
      if (event.deviceId === getDeviceId()) return;
      
      if (preferences.triggers.realtime.enabled) {
        if (preferences.triggers.realtime.autoApply) {
          performSync({ type: SyncOperationType.DOWNLOAD });
        }
        
        if (preferences.triggers.realtime.notifyUser) {
          notifyUser(`Config updated by ${event.deviceName}`);
        }
      }
    }
  });
});
```

## Offline Support

### Offline Detection

```javascript
let isOnline = navigator.onLine;

window.addEventListener('online', () => {
  isOnline = true;
  onReconnect();
});

window.addEventListener('offline', () => {
  isOnline = false;
  onDisconnect();
});
```

### Offline Queue

When offline, changes are queued:

```javascript
const offlineQueue = [];

async function queueChange(change) {
  offlineQueue.push({
    timestamp: Date.now(),
    change,
    retryCount: 0
  });
  
  // Persist queue to disk
  await saveOfflineQueue(offlineQueue);
}
```

### Reconnection Handler

When coming back online:

```javascript
async function onReconnect() {
  console.log('Connection restored, processing offline queue...');
  
  if (preferences.offline.syncOnReconnect) {
    await processOfflineQueue();
  }
}

async function processOfflineQueue() {
  const queue = await loadOfflineQueue();
  
  for (const item of queue) {
    try {
      await performSync({
        type: SyncOperationType.UPLOAD,
        data: item.change
      });
      
      // Remove from queue on success
      removeFromQueue(item);
    } catch (error) {
      // Keep in queue for retry
      item.retryCount++;
      
      if (item.retryCount >= maxRetries) {
        // Move to failed queue
        moveToFailedQueue(item);
      }
    }
  }
}
```

## Performance Optimizations

### 1. Debouncing
Prevent excessive syncs from rapid changes:
```javascript
const debouncedSync = debounce(
  performSync,
  preferences.performance.debounceMs
);
```

### 2. Throttling
Limit sync frequency:
```javascript
const throttledSync = throttle(
  performSync,
  preferences.performance.throttleMs
);
```

### 3. Compression
Compress large configs before upload:
```javascript
if (preferences.network.compression && configSize > 10240) {
  compressedData = gzip(configData);
}
```

### 4. Delta Sync
Only send changes, not full config:
```javascript
const delta = generateDelta(previousVersion, currentVersion);
// Upload only delta instead of full config
```

### 5. Concurrent Sync Prevention
Ensure only one sync at a time:
```javascript
let syncInProgress = false;

async function performSync(options) {
  if (syncInProgress) {
    if (preferences.performance.maxConcurrentSyncs === 1) {
      throw new Error('Sync already in progress');
    }
  }
  
  syncInProgress = true;
  try {
    await doSync(options);
  } finally {
    syncInProgress = false;
  }
}
```

## Error Handling

### Error Categories

1. **Network Errors**: Connection issues, timeouts
2. **Authentication Errors**: Invalid credentials, expired tokens
3. **Version Errors**: Conflicts, stale data
4. **Data Errors**: Invalid config, encryption failures
5. **Storage Errors**: Cloud storage issues
6. **Conflict Errors**: Unresolvable conflicts

### Retry Strategy

```javascript
async function syncWithRetry(options) {
  let retryCount = 0;
  const maxRetries = preferences.retry.maxAttempts;
  
  while (retryCount < maxRetries) {
    try {
      return await performSync(options);
    } catch (error) {
      retryCount++;
      
      if (!isRetryableError(error) || retryCount >= maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const backoffMs = Math.min(
        preferences.retry.backoffMs * Math.pow(preferences.retry.backoffMultiplier, retryCount - 1),
        preferences.retry.maxBackoffMs
      );
      
      await sleep(backoffMs);
    }
  }
}
```

### Retryable Errors

- Network timeouts
- Temporary connection issues
- Rate limiting (429 responses)
- Server errors (5xx)

### Non-retryable Errors

- Authentication failures
- Invalid data/format
- Permission denied
- Version conflicts (require resolution)

## Security Considerations

### Authentication Flow

```javascript
// 1. User logs in with credentials
const user = await firebaseAuth.signInWithEmailAndPassword(email, password);

// 2. Get ID token for API calls
const idToken = await user.getIdToken();

// 3. Include in all requests
const response = await fetch(apiUrl, {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});

// 4. Refresh token when expired
user.getIdToken(/* forceRefresh */ true);
```

### Data Encryption

All config data is encrypted before upload:

```javascript
import crypto from 'crypto';

function encryptConfig(config, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(JSON.stringify(config), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  return {
    data: encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
}
```

### Integrity Verification

Hash verification ensures data hasn't been tampered with:

```javascript
function verifyIntegrity(config, expectedHash) {
  const actualHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(config))
    .digest('hex');
  
  if (actualHash !== expectedHash) {
    throw new Error('Config integrity check failed');
  }
  
  return true;
}
```

## Testing Strategy

### Unit Tests
- State machine transitions
- Message serialization/deserialization
- Error handling logic
- Retry mechanisms

### Integration Tests
- Full sync workflows
- Conflict resolution
- Offline queue processing
- Real-time event handling

### End-to-End Tests
- Multi-device scenarios
- Network interruption handling
- Authentication flows
- Data consistency verification

## Monitoring and Logging

### Sync Events to Log

```javascript
// Sync start
logger.info('Sync started', {
  deviceId,
  localVersion,
  syncType
});

// Sync complete
logger.info('Sync completed', {
  deviceId,
  newVersion,
  duration,
  changesApplied
});

// Conflict detected
logger.warn('Conflict detected', {
  localVersion,
  remoteVersion,
  conflictingPaths
});

// Sync error
logger.error('Sync failed', {
  error,
  errorCode,
  context
});
```

### Performance Metrics

- Sync duration
- Data transferred
- Conflict frequency
- Error rates
- Queue size

## Future Enhancements

1. **Batch Sync**: Sync multiple changes in one operation
2. **Selective Sync**: Choose which projects to sync
3. **Conflict Prevention**: Lock mechanism for concurrent edits
4. **Advanced Merge**: Three-way merge with common ancestor
5. **Compression**: Automatic compression for large configs
6. **P2P Sync**: Direct device-to-device sync on local network

## Conclusion

This synchronization protocol provides a robust foundation for multi-device config sync with strong consistency guarantees, intelligent conflict resolution, and comprehensive error handling. The protocol is designed to be extensible and can accommodate future enhancements while maintaining backward compatibility.

