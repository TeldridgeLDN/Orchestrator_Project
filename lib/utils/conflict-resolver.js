/**
 * Conflict Resolution Module
 * 
 * Handles conflicts that arise during cloud config synchronization.
 * Implements various automatic and manual conflict resolution strategies.
 * 
 * @module utils/conflict-resolver
 */

import crypto from 'crypto';
import { ConflictStrategy } from '../schemas/sync-protocol.js';

/**
 * Conflict Resolution Result
 */
export class ConflictResolutionResult {
  constructor({ resolved, conflicts, strategy, manualRequired }) {
    this.resolved = resolved;           // Resolved configuration object
    this.conflicts = conflicts;         // Array of conflict objects
    this.strategy = strategy;           // Strategy used
    this.manualRequired = manualRequired;  // Whether manual resolution needed
    this.timestamp = Date.now();
    this.resolutionCount = conflicts.length;
  }
}

/**
 * Conflict Object
 */
export class Conflict {
  constructor({ path, local, remote, resolution, strategy }) {
    this.path = path;                  // Dot-notation path
    this.local = local;                // Local value
    this.remote = remote;              // Remote value
    this.resolution = resolution;      // Resolved value
    this.strategy = strategy;          // Strategy used
    this.timestamp = Date.now();
  }
}

/**
 * Deep equality check
 */
function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => deepEqual(val, b[idx]));
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => deepEqual(a[key], b[key]));
}

/**
 * Deep merge objects
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof result[key] === 'object' &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        result[key] = deepMerge(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

/**
 * Get all paths in an object (dot notation)
 */
function getAllPaths(obj, prefix = '') {
  const paths = new Set();
  
  function traverse(current, path) {
    if (current !== null && typeof current === 'object' && !Array.isArray(current)) {
      for (const key in current) {
        if (current.hasOwnProperty(key)) {
          const newPath = path ? `${path}.${key}` : key;
          paths.add(newPath);
          traverse(current[key], newPath);
        }
      }
    } else {
      if (path) paths.add(path);
    }
  }
  
  traverse(obj, prefix);
  return Array.from(paths);
}

/**
 * Get value at path (dot notation)
 */
function getValueAtPath(obj, path) {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  
  return current;
}

/**
 * Set value at path (dot notation)
 */
function setValueAtPath(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  
  current[parts[parts.length - 1]] = value;
}

/**
 * Get last modification timestamp for a path
 * Uses history to determine when a path was last modified
 */
function getLastModificationTime(path, history, source) {
  // Find most recent history entry that modified this path
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    if (entry.source === source && entry.changedPaths.includes(path)) {
      return entry.timestamp;
    }
  }
  
  return 0; // Unknown modification time
}

/**
 * Detect conflicts between local and remote configs
 */
export function detectConflicts(localConfig, remoteConfig) {
  const conflicts = [];
  const localPaths = new Set(getAllPaths(localConfig));
  const remotePaths = new Set(getAllPaths(remoteConfig));
  const allPaths = new Set([...localPaths, ...remotePaths]);
  
  for (const path of allPaths) {
    const localValue = getValueAtPath(localConfig, path);
    const remoteValue = getValueAtPath(remoteConfig, path);
    
    // Skip if values are equal
    if (deepEqual(localValue, remoteValue)) continue;
    
    // Skip if only one side has the value (addition/deletion, not conflict)
    if (localValue === undefined || remoteValue === undefined) continue;
    
    // We have a conflict
    conflicts.push(new Conflict({
      path,
      local: localValue,
      remote: remoteValue,
      resolution: null,
      strategy: null
    }));
  }
  
  return conflicts;
}

/**
 * Resolve conflicts using automatic strategies
 */
export async function resolveConflicts(
  localConfig,
  remoteConfig,
  options = {}
) {
  const {
    strategy = ConflictStrategy.AUTO,
    history = [],
    preferences = {}
  } = options;
  
  // Detect all conflicts
  const conflicts = detectConflicts(localConfig, remoteConfig);
  
  if (conflicts.length === 0) {
    return new ConflictResolutionResult({
      resolved: deepMerge(localConfig, remoteConfig),
      conflicts: [],
      strategy,
      manualRequired: false
    });
  }
  
  // Apply resolution strategy
  switch (strategy) {
    case ConflictStrategy.AUTO:
      return resolveAutomatic(localConfig, remoteConfig, conflicts, history);
      
    case ConflictStrategy.REMOTE_WINS:
      return resolveRemoteWins(localConfig, remoteConfig, conflicts);
      
    case ConflictStrategy.LOCAL_WINS:
      return resolveLocalWins(localConfig, remoteConfig, conflicts);
      
    case ConflictStrategy.MANUAL:
      return prepareManualResolution(localConfig, remoteConfig, conflicts);
      
    case ConflictStrategy.MERGE:
      return resolveThreeWayMerge(localConfig, remoteConfig, conflicts, options.baseConfig);
      
    default:
      throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
  }
}

/**
 * Automatic conflict resolution
 * Applies heuristics to resolve conflicts automatically
 */
function resolveAutomatic(localConfig, remoteConfig, conflicts, history) {
  const resolved = { ...localConfig };
  const unresolvedConflicts = [];
  
  for (const conflict of conflicts) {
    let resolution = null;
    let resolutionStrategy = null;
    
    // Strategy 1: Remote wins for project metadata
    if (conflict.path.match(/^projects\.[^.]+\.metadata/)) {
      resolution = conflict.remote;
      resolutionStrategy = 'remote-wins-metadata';
    }
    
    // Strategy 2: Remote wins for timestamps
    else if (
      conflict.path.endsWith('.last_active') ||
      conflict.path.endsWith('.created') ||
      conflict.path.endsWith('.updatedAt')
    ) {
      // Use most recent timestamp
      const localTime = new Date(conflict.local).getTime();
      const remoteTime = new Date(conflict.remote).getTime();
      resolution = remoteTime > localTime ? conflict.remote : conflict.local;
      resolutionStrategy = 'most-recent-timestamp';
    }
    
    // Strategy 3: Last-write-wins for simple values
    else if (typeof conflict.local !== 'object' || typeof conflict.remote !== 'object') {
      const localTime = getLastModificationTime(conflict.path, history, 'local');
      const remoteTime = getLastModificationTime(conflict.path, history, 'remote');
      
      if (remoteTime > localTime) {
        resolution = conflict.remote;
        resolutionStrategy = 'last-write-wins-remote';
      } else if (localTime > remoteTime) {
        resolution = conflict.local;
        resolutionStrategy = 'last-write-wins-local';
      } else {
        // Unknown times, prefer remote
        resolution = conflict.remote;
        resolutionStrategy = 'unknown-time-remote';
      }
    }
    
    // Strategy 4: Merge arrays by union
    else if (Array.isArray(conflict.local) && Array.isArray(conflict.remote)) {
      // Create union of arrays, removing duplicates
      const union = [...conflict.local];
      for (const item of conflict.remote) {
        if (!union.some(existing => deepEqual(existing, item))) {
          union.push(item);
        }
      }
      resolution = union;
      resolutionStrategy = 'array-union';
    }
    
    // Strategy 5: Deep merge objects
    else if (
      typeof conflict.local === 'object' &&
      conflict.local !== null &&
      typeof conflict.remote === 'object' &&
      conflict.remote !== null
    ) {
      resolution = deepMerge(conflict.local, conflict.remote);
      resolutionStrategy = 'deep-merge';
    }
    
    // Apply resolution
    if (resolution !== null) {
      setValueAtPath(resolved, conflict.path, resolution);
      conflict.resolution = resolution;
      conflict.strategy = resolutionStrategy;
    } else {
      // Could not resolve automatically
      unresolvedConflicts.push(conflict);
    }
  }
  
  return new ConflictResolutionResult({
    resolved,
    conflicts,
    strategy: ConflictStrategy.AUTO,
    manualRequired: unresolvedConflicts.length > 0
  });
}

/**
 * Remote wins strategy
 * Always prefer remote values
 */
function resolveRemoteWins(localConfig, remoteConfig, conflicts) {
  const resolved = deepMerge(localConfig, remoteConfig);
  
  for (const conflict of conflicts) {
    setValueAtPath(resolved, conflict.path, conflict.remote);
    conflict.resolution = conflict.remote;
    conflict.strategy = 'remote-wins';
  }
  
  return new ConflictResolutionResult({
    resolved,
    conflicts,
    strategy: ConflictStrategy.REMOTE_WINS,
    manualRequired: false
  });
}

/**
 * Local wins strategy
 * Always prefer local values
 */
function resolveLocalWins(localConfig, remoteConfig, conflicts) {
  const resolved = deepMerge(localConfig, remoteConfig);
  
  for (const conflict of conflicts) {
    setValueAtPath(resolved, conflict.path, conflict.local);
    conflict.resolution = conflict.local;
    conflict.strategy = 'local-wins';
  }
  
  return new ConflictResolutionResult({
    resolved,
    conflicts,
    strategy: ConflictStrategy.LOCAL_WINS,
    manualRequired: false
  });
}

/**
 * Prepare conflicts for manual resolution
 * Returns unresolved conflicts for user to resolve
 */
function prepareManualResolution(localConfig, remoteConfig, conflicts) {
  return new ConflictResolutionResult({
    resolved: null,
    conflicts,
    strategy: ConflictStrategy.MANUAL,
    manualRequired: true
  });
}

/**
 * Three-way merge with common ancestor
 * More intelligent merging using base config
 */
function resolveThreeWayMerge(localConfig, remoteConfig, conflicts, baseConfig) {
  if (!baseConfig) {
    // Fall back to automatic resolution without base
    return resolveAutomatic(localConfig, remoteConfig, conflicts, []);
  }
  
  const resolved = { ...localConfig };
  
  for (const conflict of conflicts) {
    const baseValue = getValueAtPath(baseConfig, conflict.path);
    
    // If local is unchanged from base, use remote
    if (deepEqual(conflict.local, baseValue)) {
      setValueAtPath(resolved, conflict.path, conflict.remote);
      conflict.resolution = conflict.remote;
      conflict.strategy = 'three-way-remote';
    }
    // If remote is unchanged from base, use local
    else if (deepEqual(conflict.remote, baseValue)) {
      setValueAtPath(resolved, conflict.path, conflict.local);
      conflict.resolution = conflict.local;
      conflict.strategy = 'three-way-local';
    }
    // Both changed, need more complex resolution
    else if (Array.isArray(conflict.local) && Array.isArray(conflict.remote)) {
      // For arrays, compute added/removed items
      const baseArray = Array.isArray(baseValue) ? baseValue : [];
      const localAdded = conflict.local.filter(item => 
        !baseArray.some(base => deepEqual(base, item))
      );
      const remoteAdded = conflict.remote.filter(item =>
        !baseArray.some(base => deepEqual(base, item))
      );
      const localRemoved = baseArray.filter(item =>
        !conflict.local.some(local => deepEqual(local, item))
      );
      const remoteRemoved = baseArray.filter(item =>
        !conflict.remote.some(remote => deepEqual(remote, item))
      );
      
      // Start with base, apply both sets of changes
      let merged = [...baseArray];
      
      // Add items added in local but not removed in remote
      for (const item of localAdded) {
        if (!remoteRemoved.some(removed => deepEqual(removed, item))) {
          merged.push(item);
        }
      }
      
      // Add items added in remote but not removed in local
      for (const item of remoteAdded) {
        if (!localRemoved.some(removed => deepEqual(removed, item))) {
          if (!merged.some(existing => deepEqual(existing, item))) {
            merged.push(item);
          }
        }
      }
      
      // Remove items removed in both
      const bothRemoved = localRemoved.filter(item =>
        remoteRemoved.some(remote => deepEqual(remote, item))
      );
      merged = merged.filter(item =>
        !bothRemoved.some(removed => deepEqual(removed, item))
      );
      
      setValueAtPath(resolved, conflict.path, merged);
      conflict.resolution = merged;
      conflict.strategy = 'three-way-array';
    }
    else {
      // Can't resolve, mark for manual resolution
      conflict.resolution = null;
      conflict.strategy = 'three-way-unresolved';
    }
  }
  
  const unresolvedConflicts = conflicts.filter(c => c.resolution === null);
  
  return new ConflictResolutionResult({
    resolved,
    conflicts,
    strategy: ConflictStrategy.MERGE,
    manualRequired: unresolvedConflicts.length > 0
  });
}

/**
 * Apply manual resolution
 * User provides resolved values for conflicts
 */
export function applyManualResolution(localConfig, remoteConfig, resolutions) {
  const resolved = deepMerge(localConfig, remoteConfig);
  const conflicts = [];
  
  for (const [path, value] of Object.entries(resolutions)) {
    const localValue = getValueAtPath(localConfig, path);
    const remoteValue = getValueAtPath(remoteConfig, path);
    
    setValueAtPath(resolved, path, value);
    
    conflicts.push(new Conflict({
      path,
      local: localValue,
      remote: remoteValue,
      resolution: value,
      strategy: 'manual'
    }));
  }
  
  return new ConflictResolutionResult({
    resolved,
    conflicts,
    strategy: ConflictStrategy.MANUAL,
    manualRequired: false
  });
}

/**
 * Generate conflict report for user display
 */
export function generateConflictReport(conflicts) {
  return {
    totalConflicts: conflicts.length,
    byStrategy: conflicts.reduce((acc, c) => {
      acc[c.strategy] = (acc[c.strategy] || 0) + 1;
      return acc;
    }, {}),
    conflicts: conflicts.map(c => ({
      path: c.path,
      local: c.local,
      remote: c.remote,
      resolution: c.resolution,
      strategy: c.strategy
    })),
    requiresManualResolution: conflicts.some(c => c.resolution === null)
  };
}

/**
 * Validate resolved configuration
 */
export function validateResolution(resolved) {
  const errors = [];
  
  // Check for conflict markers
  function checkForConflictMarkers(obj, path = '') {
    if (obj && typeof obj === 'object') {
      if (obj.__conflict === true) {
        errors.push(`Unresolved conflict at ${path}`);
      }
      
      for (const [key, value] of Object.entries(obj)) {
        checkForConflictMarkers(value, path ? `${path}.${key}` : key);
      }
    }
  }
  
  checkForConflictMarkers(resolved);
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export default {
  detectConflicts,
  resolveConflicts,
  applyManualResolution,
  generateConflictReport,
  validateResolution,
  ConflictResolutionResult,
  Conflict
};

