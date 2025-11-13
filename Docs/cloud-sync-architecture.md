# Cloud Sync Architecture Documentation

## Overview

This document describes the architecture and design decisions for synchronizing project registry data (`config.json`) across multiple machines using cloud storage.

## Goals

1. **Multi-device Support**: Enable users to work seamlessly across multiple machines
2. **Automatic Synchronization**: Sync config changes automatically with minimal user intervention
3. **Conflict Resolution**: Handle concurrent changes intelligently
4. **Security**: Encrypt sensitive data at rest and in transit
5. **Offline Support**: Allow offline work with eventual consistency
6. **Scalability**: Support reasonable numbers of projects, devices, and history

## Architecture

### Storage Provider

We use **Firebase Firestore** as the cloud storage provider for these reasons:

- **Real-time sync**: Native support for real-time updates across devices
- **Offline support**: Built-in offline persistence and conflict resolution
- **Security**: Robust security rules and authentication
- **Scalability**: Automatic scaling without infrastructure management
- **Cost-effective**: Generous free tier suitable for individual users
- **SDK Quality**: Excellent JavaScript/Node.js SDK with TypeScript support

### Data Model

The data is organized hierarchically:

```
users/
  {userId}/                        # Top-level user document
    ├── profile                    # User metadata
    ├── config                     # Current configuration snapshot
    ├── stats                      # Sync statistics
    ├── devices/                   # Sub-collection
    │   └── {deviceId}/           # Per-device information
    └── history/                   # Sub-collection
        └── {version}/            # Historical snapshots
```

### Key Design Decisions

#### 1. Document Structure

**Decision**: Store config as a single encrypted blob rather than flattened fields.

**Rationale**:
- **Security**: Entire config.json contains sensitive data (file paths, project names)
- **Atomicity**: Config changes should be atomic - all or nothing
- **Flexibility**: Schema can evolve without database migrations
- **Simplicity**: Easier to reason about full config state

**Trade-offs**:
- Can't query individual fields within config
- Entire config must be downloaded for any read
- Mitigated by storing metadata fields separately for queries

#### 2. Versioning Strategy

**Decision**: Use monotonically increasing version numbers with optimistic locking.

**Rationale**:
- **Conflict Detection**: Easy to detect if local version differs from remote
- **Ordering**: Clear ordering of changes for history
- **Simplicity**: Simpler than vector clocks or CRDTs
- **Sufficient**: Config changes are infrequent enough that conflicts are rare

**How it works**:
```javascript
// Client-side sync pseudo-code
localVersion = 14
remoteVersion = 15

if (remoteVersion > localVersion) {
  // Remote is ahead, download and merge
  mergeRemoteChanges()
} else if (localVersion > remoteVersion) {
  // Local is ahead, upload
  uploadLocalChanges()
} else {
  // Same version, no sync needed
}
```

#### 3. History Management

**Decision**: Store change deltas rather than full snapshots, with automatic pruning.

**Rationale**:
- **Storage Efficiency**: Deltas are much smaller than full configs
- **Conflict Resolution**: Deltas provide granular information for merging
- **Audit Trail**: Sufficient history for debugging and rollback
- **Bounded Growth**: Automatic pruning prevents unbounded storage

**Implementation**:
- Keep last 100 versions by default (configurable)
- Store changed paths and values
- Prune old entries when limit exceeded
- Critical snapshots preserved (e.g., first version, conflict resolutions)

#### 4. Device Tracking

**Decision**: Track each device as a separate document with sync status.

**Rationale**:
- **Visibility**: Users can see which devices are syncing
- **Management**: Ability to revoke/remove devices
- **Debugging**: Per-device statistics help diagnose issues
- **Security**: Can detect unauthorized devices

**Device Information**:
- Unique device ID (generated once per machine)
- Device name and platform info
- Last sync time and version
- Sync statistics

#### 5. Encryption

**Decision**: Client-side encryption using AES-256-GCM with user-derived keys.

**Rationale**:
- **Zero-knowledge**: Cloud provider cannot read user data
- **Security**: Industry-standard encryption algorithm
- **Integrity**: GCM provides authentication
- **Performance**: Fast encryption/decryption

**Key Management**:
- Encryption key derived from user credentials
- Key never transmitted or stored on server
- Key stored securely on each device (OS keychain)
- IV (Initialization Vector) generated per encryption
- Auth tag stored for integrity verification

## Synchronization Protocol

### Sync Flow

```
1. Device detects change to local config.json
   ↓
2. Generate device ID if first time
   ↓
3. Authenticate with cloud provider
   ↓
4. Fetch current remote version
   ↓
5. Compare versions and detect conflicts
   ↓
6. Apply conflict resolution if needed
   ↓
7. Encrypt and upload new version
   ↓
8. Update device sync status
   ↓
9. Add history entry
   ↓
10. Notify other devices (real-time)
```

### Sync Triggers

Synchronization can be triggered by:

1. **Manual**: User runs `diet103 sync` command
2. **Automatic**: Config file change detected (via file watcher)
3. **Periodic**: Background sync every N minutes
4. **On startup**: Sync when application starts
5. **Before critical operations**: Sync before project switch

### Sync Modes

Three synchronization modes:

1. **Bidirectional** (default): Upload and download as needed
2. **Upload-only**: Push local changes to cloud
3. **Download-only**: Pull remote changes to local

## Conflict Resolution

### Conflict Detection

A conflict occurs when:
- Local and remote versions have diverged (neither is ancestor of the other)
- Both have uncommitted changes to the same fields

### Resolution Strategies

#### 1. Automatic Resolution (Default)

Applies these rules in order:

1. **Remote Wins for Project Metadata**
   - Changes to `projects.*.metadata` prefer remote version
   - Rationale: Metadata changes (health scores, timestamps) are typically generated automatically

2. **Last-Write-Wins for Simple Values**
   - For non-object values, use most recent modification
   - Determined by checking history timestamps
   - Rationale: User likely wants their most recent change

3. **Array Union**
   - For arrays, merge by taking union of both versions
   - Removes duplicates
   - Rationale: Preserves all data, user can manually remove if needed

4. **Deep Merge for Objects**
   - Recursively merge object properties
   - Applies resolution rules to nested properties
   - Rationale: Preserves as much information as possible

5. **Manual Resolution Required**
   - If no automatic rule applies, mark for manual resolution
   - User is prompted to choose local, remote, or custom merge
   - Rationale: Better than silently losing data

#### 2. Manual Resolution

For conflicts requiring manual intervention:

```
Conflict detected in: projects.myProject.path
  Local:  /Users/john/projects/myProject
  Remote: /Users/john/work/projects/myProject

Choose resolution:
1. Keep local value
2. Use remote value
3. Enter custom value
4. Skip (mark conflict unresolved)
```

#### 3. Resolution Policies

Users can configure default policy:

- `auto`: Apply automatic resolution rules (default)
- `manual`: Always prompt for conflicts
- `remote-wins`: Always prefer remote version
- `local-wins`: Always prefer local version

### Conflict Prevention

To minimize conflicts:

1. **Sync frequently**: Reduce time window for divergence
2. **Atomic operations**: Bundle related changes together
3. **Sync before critical ops**: Ensure latest version before making changes
4. **Device coordination**: If possible, avoid concurrent edits

## Offline Support

### Offline Operation

When offline:
1. Changes are tracked locally
2. Sync operations are queued
3. User can continue working normally
4. Version numbers are not incremented (reserved)

### Reconnection

When coming back online:
1. Queued sync operations are processed
2. Remote version is fetched
3. Local changes are merged with remote
4. Conflicts are resolved
5. New version is uploaded

### Offline Conflict Handling

If device was offline for extended period:
- May have many versions to catch up with
- Download all missed history entries
- Apply changes in order
- Resolve any conflicts that arise
- Upload final merged state

## Security Considerations

### Authentication

- Firebase Authentication for user identity
- Support multiple auth providers (Google, email/password, etc.)
- JWT tokens for API authentication
- Token refresh for long-running sessions

### Authorization

- Users can only access their own data
- Firestore security rules enforce user isolation
- Device IDs are validated against user account
- History entries are immutable (can't be modified/deleted)

### Encryption

- **At Rest**: AES-256-GCM encryption of config data
- **In Transit**: HTTPS/TLS for all network communication
- **Key Management**: Client-side encryption keys never transmitted
- **Zero-Knowledge**: Cloud provider cannot decrypt user data

### Privacy

- Metadata is minimized (only project count, no names)
- Paths and project names are encrypted
- Device names are user-configurable (can be pseudonymous)
- User can delete all cloud data at any time

## Performance Considerations

### Sync Performance

- **Typical config size**: 10-50 KB uncompressed
- **Encryption overhead**: ~5% size increase
- **Upload time**: < 1 second on typical connection
- **Download time**: < 1 second on typical connection
- **Conflict resolution**: < 100ms for typical configs

### Storage Efficiency

- **Config size**: Average 20 KB per user
- **History size**: ~500 bytes per entry × 100 entries = 50 KB
- **Device records**: ~1 KB per device × 5 devices = 5 KB
- **Total per user**: ~75 KB

With 10,000 users: ~750 MB total storage

### Scaling Limits

- **Users**: Millions (Firestore scales automatically)
- **Devices per user**: 50 (reasonable limit)
- **Projects per config**: 1,000 (practical limit)
- **History entries**: 100 per user (configurable)
- **Config size**: 5 MB max (generous limit)

## Cost Estimation

### Firebase Free Tier

- 1 GB storage
- 10 GB/month network egress
- 50,000 reads/day
- 20,000 writes/day

### Typical User Consumption

- **Storage**: 75 KB per user
- **Reads**: 10-20 per day (sync checks)
- **Writes**: 2-5 per day (config changes)
- **Network**: 1-2 MB per day (downloads)

### Free Tier Capacity

- **Users**: ~13,300 users (storage limited)
- **Daily operations**: 2,500-5,000 users (read/write limited)

For most individual users and small teams, will remain within free tier.

## Future Enhancements

### Phase 2 Features

1. **Selective Sync**
   - Choose which projects to sync
   - Exclude large projects or sensitive data
   - Per-project encryption keys

2. **Shared Projects**
   - Invite team members to projects
   - Role-based permissions
   - Activity feed for team changes

3. **Backup and Restore**
   - Manual backup to cloud
   - Restore from specific version
   - Export/import functionality

4. **Advanced Conflict Resolution**
   - Three-way merge with common ancestor
   - Diff visualization
   - Merge tool integration

5. **Sync Insights**
   - Dashboard showing sync activity
   - Device management UI
   - Conflict history and patterns

6. **Alternative Storage Providers**
   - AWS DynamoDB support
   - Azure Cosmos DB support
   - Self-hosted option (CouchDB)

## Testing Strategy

### Unit Tests

- Schema validation
- Encryption/decryption
- Conflict resolution logic
- Version comparison
- Delta generation

### Integration Tests

- End-to-end sync flow
- Multi-device scenarios
- Offline/online transitions
- Error handling and recovery
- Security rule validation

### Performance Tests

- Large config files (MB range)
- Many projects (100s)
- Extended history (1000s of versions)
- Concurrent device syncing
- Network failure scenarios

### Security Tests

- Authentication bypass attempts
- Unauthorized data access
- Encryption strength validation
- Key management security
- SQL injection (N/A for Firestore)

## Migration Strategy

### Initial Migration

Users opt-in to cloud sync:

1. Explain benefits and security model
2. Request authentication credentials
3. Initialize cloud storage with current config
4. Enable automatic syncing
5. Sync to any other registered devices

### Schema Evolution

When schema changes:

1. Increment `SCHEMA_VERSION`
2. Implement migration function
3. Run migration on first sync after update
4. Preserve old data in history
5. Log migration events

### Rollback Plan

If critical issues arise:

1. Disable cloud sync globally (server-side)
2. Users continue with local-only mode
3. Fix issues in new release
4. Re-enable sync
5. Users manually trigger sync to catch up

## Conclusion

This cloud sync architecture provides a robust, secure, and scalable solution for multi-device configuration synchronization. The design balances complexity, performance, security, and user experience while remaining extensible for future enhancements.

Key strengths:
- ✅ Secure client-side encryption
- ✅ Intelligent conflict resolution
- ✅ Offline support with eventual consistency
- ✅ Scalable and cost-effective
- ✅ User-friendly with minimal configuration

Next steps:
1. Review and approve this design
2. Implement sync protocol (Task 21.2)
3. Develop conflict resolution (Task 21.3)
4. Add encryption layer (Task 21.5)
5. Build user-facing sync commands

