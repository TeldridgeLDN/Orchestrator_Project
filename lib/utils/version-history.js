/**
 * Version and History Tracking Module
 * 
 * Manages configuration versioning and change history for cloud sync.
 * Tracks all changes with timestamps, device information, and deltas.
 * 
 * @module utils/version-history
 */

import crypto from 'crypto';
import { MAX_HISTORY_ENTRIES } from '../schemas/cloud-sync-schema.js';

/**
 * History Entry Class
 */
export class HistoryEntry {
  constructor({
    version,
    previousVersion,
    timestamp,
    deviceId,
    deviceName,
    changeType,
    changeCount,
    changedPaths,
    configHash,
    delta,
    conflictInfo
  }) {
    this.version = version;
    this.previousVersion = previousVersion || version - 1;
    this.timestamp = timestamp || Date.now();
    this.deviceId = deviceId;
    this.deviceName = deviceName;
    this.changeType = changeType; // 'create' | 'update' | 'delete' | 'merge'
    this.changeCount = changeCount || changedPaths?.length || 0;
    this.changedPaths = changedPaths || [];
    this.configHash = configHash;
    this.delta = delta || { added: {}, modified: {}, deleted: [] };
    this.conflictInfo = conflictInfo || {
      hadConflict: false,
      conflictingVersion: null,
      conflictingDevice: null,
      resolutionStrategy: null,
      manualIntervention: false,
      conflictPaths: []
    };
  }
}

/**
 * Calculate hash of configuration
 */
export function calculateConfigHash(config) {
  const configString = JSON.stringify(config, Object.keys(config).sort());
  return crypto.createHash('sha256').update(configString).digest('hex');
}

/**
 * Generate delta between two configurations
 */
export function generateDelta(previousConfig, currentConfig) {
  const delta = {
    added: {},
    modified: {},
    deleted: []
  };
  
  const prevPaths = getAllPaths(previousConfig);
  const currPaths = getAllPaths(currentConfig);
  
  // Find added paths
  for (const path of currPaths) {
    if (!prevPaths.has(path)) {
      delta.added[path] = getValueAtPath(currentConfig, path);
    }
  }
  
  // Find deleted paths
  for (const path of prevPaths) {
    if (!currPaths.has(path)) {
      delta.deleted.push(path);
    }
  }
  
  // Find modified paths
  for (const path of currPaths) {
    if (prevPaths.has(path)) {
      const prevValue = getValueAtPath(previousConfig, path);
      const currValue = getValueAtPath(currentConfig, path);
      
      if (!deepEqual(prevValue, currValue)) {
        delta.modified[path] = {
          old: prevValue,
          new: currValue
        };
      }
    }
  }
  
  return delta;
}

/**
 * Apply delta to configuration
 */
export function applyDelta(config, delta) {
  const result = JSON.parse(JSON.stringify(config)); // Deep clone
  
  // Apply additions
  for (const [path, value] of Object.entries(delta.added || {})) {
    setValueAtPath(result, path, value);
  }
  
  // Apply modifications
  for (const [path, change] of Object.entries(delta.modified || {})) {
    setValueAtPath(result, path, change.new);
  }
  
  // Apply deletions
  for (const path of delta.deleted || []) {
    deleteValueAtPath(result, path);
  }
  
  return result;
}

/**
 * Create history entry from config change
 */
export function createHistoryEntry(
  currentConfig,
  previousConfig,
  version,
  deviceInfo,
  conflictInfo = null
) {
  const delta = generateDelta(previousConfig, currentConfig);
  const changedPaths = [
    ...Object.keys(delta.added),
    ...Object.keys(delta.modified),
    ...delta.deleted
  ];
  
  // Determine change type
  let changeType = 'update';
  if (Object.keys(previousConfig).length === 0) {
    changeType = 'create';
  } else if (Object.keys(currentConfig).length === 0) {
    changeType = 'delete';
  } else if (conflictInfo?.hadConflict) {
    changeType = 'merge';
  }
  
  return new HistoryEntry({
    version,
    previousVersion: version - 1,
    timestamp: Date.now(),
    deviceId: deviceInfo.deviceId,
    deviceName: deviceInfo.deviceName,
    changeType,
    changeCount: changedPaths.length,
    changedPaths,
    configHash: calculateConfigHash(currentConfig),
    delta,
    conflictInfo: conflictInfo || {
      hadConflict: false,
      conflictingVersion: null,
      conflictingDevice: null,
      resolutionStrategy: null,
      manualIntervention: false,
      conflictPaths: []
    }
  });
}

/**
 * Prune old history entries
 * Keeps most recent entries up to max limit
 */
export function pruneHistory(history, maxEntries = MAX_HISTORY_ENTRIES) {
  if (history.length <= maxEntries) {
    return history;
  }
  
  // Sort by version (descending)
  const sorted = [...history].sort((a, b) => b.version - a.version);
  
  // Keep most recent entries
  const pruned = sorted.slice(0, maxEntries);
  
  return pruned.sort((a, b) => a.version - b.version);
}

/**
 * Get history entries for a specific device
 */
export function getDeviceHistory(history, deviceId) {
  return history.filter(entry => entry.deviceId === deviceId);
}

/**
 * Get history entries within a version range
 */
export function getHistoryRange(history, fromVersion, toVersion) {
  return history.filter(entry =>
    entry.version >= fromVersion && entry.version <= toVersion
  );
}

/**
 * Get history entries within a time range
 */
export function getHistoryByTimeRange(history, startTime, endTime) {
  return history.filter(entry =>
    entry.timestamp >= startTime && entry.timestamp <= endTime
  );
}

/**
 * Get most recent history entry
 */
export function getLatestHistoryEntry(history) {
  if (history.length === 0) return null;
  return history.reduce((latest, entry) =>
    entry.version > latest.version ? entry : latest
  );
}

/**
 * Get history entry by version
 */
export function getHistoryByVersion(history, version) {
  return history.find(entry => entry.version === version);
}

/**
 * Get all changed paths from history
 */
export function getAllChangedPaths(history) {
  const paths = new Set();
  for (const entry of history) {
    for (const path of entry.changedPaths) {
      paths.add(path);
    }
  }
  return Array.from(paths);
}

/**
 * Get change frequency for paths
 */
export function getPathChangeFrequency(history) {
  const frequency = {};
  
  for (const entry of history) {
    for (const path of entry.changedPaths) {
      frequency[path] = (frequency[path] || 0) + 1;
    }
  }
  
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .map(([path, count]) => ({ path, count }));
}

/**
 * Get conflict history
 */
export function getConflictHistory(history) {
  return history.filter(entry => entry.conflictInfo.hadConflict);
}

/**
 * Generate history summary
 */
export function generateHistorySummary(history) {
  const conflicts = getConflictHistory(history);
  const devices = new Set(history.map(e => e.deviceId));
  const changeTypes = history.reduce((acc, entry) => {
    acc[entry.changeType] = (acc[entry.changeType] || 0) + 1;
    return acc;
  }, {});
  
  const totalChanges = history.reduce((sum, entry) => sum + entry.changeCount, 0);
  const avgChangesPerEntry = history.length > 0 ? totalChanges / history.length : 0;
  
  const timeSpan = history.length > 0
    ? history[history.length - 1].timestamp - history[0].timestamp
    : 0;
  
  return {
    totalEntries: history.length,
    totalChanges,
    avgChangesPerEntry: Math.round(avgChangesPerEntry * 100) / 100,
    conflictCount: conflicts.length,
    conflictRate: history.length > 0 ? conflicts.length / history.length : 0,
    deviceCount: devices.size,
    devices: Array.from(devices),
    changeTypes,
    timeSpanMs: timeSpan,
    oldestEntry: history[0] || null,
    newestEntry: history[history.length - 1] || null,
    mostChangedPaths: getPathChangeFrequency(history).slice(0, 10)
  };
}

/**
 * Reconstruct configuration at specific version
 */
export function reconstructConfigAtVersion(history, targetVersion, baseConfig = {}) {
  // Sort history by version
  const sorted = [...history].sort((a, b) => a.version - b.version);
  
  // Find all entries up to target version
  const relevantEntries = sorted.filter(entry => entry.version <= targetVersion);
  
  if (relevantEntries.length === 0) {
    return baseConfig;
  }
  
  // Apply deltas in order
  let config = JSON.parse(JSON.stringify(baseConfig));
  
  for (const entry of relevantEntries) {
    config = applyDelta(config, entry.delta);
  }
  
  return config;
}

/**
 * Compare two versions
 */
export function compareVersions(history, version1, version2, baseConfig = {}) {
  const config1 = reconstructConfigAtVersion(history, version1, baseConfig);
  const config2 = reconstructConfigAtVersion(history, version2, baseConfig);
  
  const delta = generateDelta(config1, config2);
  
  return {
    version1,
    version2,
    config1,
    config2,
    delta,
    changesCount: Object.keys(delta.added).length +
                  Object.keys(delta.modified).length +
                  delta.deleted.length
  };
}

/**
 * Utility: Get all paths in object
 */
function getAllPaths(obj, prefix = '') {
  const paths = new Set();
  
  function traverse(current, path) {
    if (current !== null && typeof current === 'object' && !Array.isArray(current)) {
      paths.add(path);
      for (const key in current) {
        if (current.hasOwnProperty(key)) {
          const newPath = path ? `${path}.${key}` : key;
          traverse(current[key], newPath);
        }
      }
    } else if (path) {
      paths.add(path);
    }
  }
  
  traverse(obj, prefix);
  return paths;
}

/**
 * Utility: Get value at path
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
 * Utility: Set value at path
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
 * Utility: Delete value at path
 */
function deleteValueAtPath(obj, path) {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) return;
    current = current[parts[i]];
  }
  
  delete current[parts[parts.length - 1]];
}

/**
 * Utility: Deep equal
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

export default {
  HistoryEntry,
  calculateConfigHash,
  generateDelta,
  applyDelta,
  createHistoryEntry,
  pruneHistory,
  getDeviceHistory,
  getHistoryRange,
  getHistoryByTimeRange,
  getLatestHistoryEntry,
  getHistoryByVersion,
  getAllChangedPaths,
  getPathChangeFrequency,
  getConflictHistory,
  generateHistorySummary,
  reconstructConfigAtVersion,
  compareVersions
};

