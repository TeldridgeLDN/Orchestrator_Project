/**
 * Conflict Resolution Module
 * 
 * Handles detection and resolution of conflicts during cloud synchronization.
 * Implements various strategies for merging local and remote changes.
 * 
 * @module cloud/conflict-resolver
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('ConflictResolver');

/**
 * Conflict Resolution Strategies
 */
export const ConflictStrategy = {
  AUTO: 'auto',               // Apply automatic resolution rules
  MANUAL: 'manual',           // Return conflicts for manual resolution
  REMOTE_WINS: 'remote-wins', // Always prefer remote
  LOCAL_WINS: 'local-wins',   // Always prefer local
  MERGE: 'merge',             // Three-way merge with smart rules
  MOST_RECENT: 'most-recent'  // Use most recently modified
};

/**
 * Conflict Types
 */
export const ConflictType = {
  MODIFIED_BOTH: 'modified-both',     // Both sides modified same field
  DELETED_LOCAL: 'deleted-local',     // Deleted locally, modified remotely
  DELETED_REMOTE: 'deleted-remote',   // Deleted remotely, modified locally
  TYPE_CHANGE: 'type-change',         // Field type changed
  ARRAY_DIVERGED: 'array-diverged',   // Array contents diverged
  NESTED_CONFLICT: 'nested-conflict'  // Conflict in nested object
};

/**
 * Conflict Resolution Result
 */
export class ConflictResult {
  constructor() {
    this.resolved = {};
    this.conflicts = [];
    this.strategy = null;
    this.autoResolved = 0;
    this.manualRequired = 0;
  }

  addConflict(path, type, localValue, remoteValue, resolution = null) {
    const conflict = {
      path,
      type,
      localValue,
      remoteValue,
      resolution,
      autoResolved: resolution !== null
    };

    this.conflicts.push(conflict);

    if (resolution !== null) {
      this.autoResolved++;
    } else {
      this.manualRequired++;
    }

    return conflict;
  }

  hasConflicts() {
    return this.conflicts.length > 0;
  }

  needsManualResolution() {
    return this.manualRequired > 0;
  }
}

/**
 * Conflict Resolver
 * 
 * Main class for detecting and resolving conflicts
 */
export class ConflictResolver {
  constructor(options = {}) {
    this.options = {
      strategy: options.strategy || ConflictStrategy.AUTO,
      arrayMergeStrategy: options.arrayMergeStrategy || 'union', // 'union', 'local', 'remote'
      preserveLocal: options.preserveLocal || false,
      ...options
    };

    logger.info('Conflict resolver initialized', { strategy: this.options.strategy });
  }

  /**
   * Detect and resolve conflicts between local and remote configs
   * 
   * @param {Object} localConfig - Local configuration
   * @param {Object} remoteConfig - Remote configuration
   * @param {Object} baseConfig - Common ancestor (optional, for three-way merge)
   * @returns {ConflictResult} Resolution result
   */
  resolve(localConfig, remoteConfig, baseConfig = null) {
    logger.debug('Resolving conflicts', {
      strategy: this.options.strategy,
      hasBase: baseConfig !== null
    });

    const result = new ConflictResult();
    result.strategy = this.options.strategy;

    // Handle simple strategies first
    if (this.options.strategy === ConflictStrategy.REMOTE_WINS) {
      result.resolved = { ...remoteConfig };
      logger.info('Resolved using REMOTE_WINS strategy');
      return result;
    }

    if (this.options.strategy === ConflictStrategy.LOCAL_WINS) {
      result.resolved = { ...localConfig };
      logger.info('Resolved using LOCAL_WINS strategy');
      return result;
    }

    if (this.options.strategy === ConflictStrategy.MOST_RECENT) {
      const localModified = localConfig.lastModified || 0;
      const remoteModified = remoteConfig.lastModified || 0;
      result.resolved = localModified > remoteModified 
        ? { ...localConfig } 
        : { ...remoteConfig };
      logger.info('Resolved using MOST_RECENT strategy', {
        winner: localModified > remoteModified ? 'local' : 'remote'
      });
      return result;
    }

    // For AUTO and MERGE strategies, perform deep merge
    result.resolved = this._deepMerge(
      localConfig,
      remoteConfig,
      baseConfig,
      result,
      []
    );

    logger.info('Conflict resolution complete', {
      conflicts: result.conflicts.length,
      autoResolved: result.autoResolved,
      manualRequired: result.manualRequired
    });

    return result;
  }

  /**
   * Deep merge two objects, detecting and resolving conflicts
   * 
   * @private
   */
  _deepMerge(local, remote, base, result, path) {
    const merged = {};

    // Get all unique keys from both objects
    const allKeys = new Set([
      ...Object.keys(local || {}),
      ...Object.keys(remote || {})
    ]);

    for (const key of allKeys) {
      const currentPath = [...path, key];
      const pathString = currentPath.join('.');

      const localValue = local?.[key];
      const remoteValue = remote?.[key];
      const baseValue = base?.[key];

      const hasLocal = key in (local || {});
      const hasRemote = key in (remote || {});
      const hasBase = base && key in base;

      // Case 1: Both missing - skip
      if (!hasLocal && !hasRemote) {
        continue;
      }

      // Case 2: Only in local
      if (hasLocal && !hasRemote) {
        if (hasBase) {
          // Deleted remotely
          const conflict = result.addConflict(
            pathString,
            ConflictType.DELETED_REMOTE,
            localValue,
            undefined,
            this.options.strategy === ConflictStrategy.AUTO ? localValue : null
          );

          merged[key] = conflict.resolution ?? localValue;
        } else {
          // New in local
          merged[key] = localValue;
        }
        continue;
      }

      // Case 3: Only in remote
      if (!hasLocal && hasRemote) {
        if (hasBase) {
          // Deleted locally
          const conflict = result.addConflict(
            pathString,
            ConflictType.DELETED_LOCAL,
            undefined,
            remoteValue,
            this.options.strategy === ConflictStrategy.AUTO ? remoteValue : null
          );

          merged[key] = conflict.resolution ?? remoteValue;
        } else {
          // New in remote
          merged[key] = remoteValue;
        }
        continue;
      }

      // Case 4: In both - check for conflicts
      // Same value - no conflict
      if (this._isEqual(localValue, remoteValue)) {
        merged[key] = localValue;
        continue;
      }

      // Different types
      const localType = this._getType(localValue);
      const remoteType = this._getType(remoteValue);

      if (localType !== remoteType) {
        const conflict = result.addConflict(
          pathString,
          ConflictType.TYPE_CHANGE,
          localValue,
          remoteValue,
          this._resolveTypeConflict(localValue, remoteValue, baseValue)
        );

        merged[key] = conflict.resolution;
        continue;
      }

      // Same type, different values
      if (localType === 'object' && remoteType === 'object') {
        // Recursive merge for objects
        merged[key] = this._deepMerge(
          localValue,
          remoteValue,
          baseValue,
          result,
          currentPath
        );
      } else if (localType === 'array' && remoteType === 'array') {
        // Array merge
        const conflict = result.addConflict(
          pathString,
          ConflictType.ARRAY_DIVERGED,
          localValue,
          remoteValue,
          this._resolveArrayConflict(localValue, remoteValue, baseValue)
        );

        merged[key] = conflict.resolution;
      } else {
        // Primitive values - conflict
        const conflict = result.addConflict(
          pathString,
          ConflictType.MODIFIED_BOTH,
          localValue,
          remoteValue,
          this._resolvePrimitiveConflict(localValue, remoteValue, baseValue)
        );

        merged[key] = conflict.resolution;
      }
    }

    return merged;
  }

  /**
   * Resolve conflict between primitive values
   * 
   * @private
   */
  _resolvePrimitiveConflict(localValue, remoteValue, baseValue) {
    if (this.options.strategy === ConflictStrategy.MANUAL) {
      return null; // Require manual resolution
    }

    // For AUTO strategy, use remote value (remote wins for primitives)
    // This matches the common pattern where the server is the authority
    return remoteValue;
  }

  /**
   * Resolve conflict between arrays
   * 
   * @private
   */
  _resolveArrayConflict(localArray, remoteArray, baseArray) {
    if (this.options.strategy === ConflictStrategy.MANUAL) {
      return null; // Require manual resolution
    }

    switch (this.options.arrayMergeStrategy) {
      case 'union':
        // Merge arrays, removing duplicates
        return this._arrayUnion(localArray, remoteArray);

      case 'local':
        return localArray;

      case 'remote':
        return remoteArray;

      default:
        // Default to remote for AUTO strategy
        return remoteArray;
    }
  }

  /**
   * Resolve type change conflicts
   * 
   * @private
   */
  _resolveTypeConflict(localValue, remoteValue, baseValue) {
    if (this.options.strategy === ConflictStrategy.MANUAL) {
      return null;
    }

    // For type changes, prefer remote (safer assumption)
    return remoteValue;
  }

  /**
   * Create union of two arrays
   * 
   * @private
   */
  _arrayUnion(arr1, arr2) {
    const seen = new Set();
    const result = [];

    for (const item of [...arr1, ...arr2]) {
      const key = typeof item === 'object' ? JSON.stringify(item) : item;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }

    return result;
  }

  /**
   * Check deep equality
   * 
   * @private
   */
  _isEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) return false;

      if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        return a.every((item, i) => this._isEqual(item, b[i]));
      }

      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) return false;

      return keysA.every(key => this._isEqual(a[key], b[key]));
    }

    return false;
  }

  /**
   * Get type of value
   * 
   * @private
   */
  _getType(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }
}

/**
 * Helper function to create and use resolver
 * 
 * @param {Object} localConfig - Local configuration
 * @param {Object} remoteConfig - Remote configuration
 * @param {Object} options - Resolution options
 * @returns {ConflictResult} Resolution result
 */
export function resolveConflicts(localConfig, remoteConfig, options = {}) {
  const resolver = new ConflictResolver(options);
  return resolver.resolve(localConfig, remoteConfig, options.baseConfig);
}

export default ConflictResolver;

