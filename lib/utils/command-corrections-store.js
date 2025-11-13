/**
 * Command Corrections Storage
 * 
 * Persistent storage for user corrections to learn from command matching failures.
 * Tracks which commands users actually select when the top match was wrong,
 * enabling the system to improve over time.
 * 
 * @module utils/command-corrections-store
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Configuration for corrections storage
 */
const CONFIG = {
  // Storage location
  storage: {
    directory: path.join(os.homedir(), '.orchestrator', 'corrections'),
    filename: 'command-corrections.json',
    backupCount: 3  // Number of backup files to keep
  },
  
  // Data management
  limits: {
    maxCorrections: 1000,        // Maximum total corrections to store
    maxPerPattern: 50,            // Maximum corrections per input pattern
    pruneThreshold: 1100,         // Start pruning when this many corrections exist
    minFrequencyToKeep: 2         // Minimum frequency to keep during pruning
  },
  
  // Metadata
  version: '1.0.0'
};

/**
 * In-memory corrections cache
 */
let correctionsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Get full path to corrections file
 * 
 * @returns {string} Full file path
 */
function getCorrectionsPath() {
  return path.join(CONFIG.storage.directory, CONFIG.storage.filename);
}

/**
 * Ensure storage directory exists
 * 
 * @returns {Promise<void>}
 */
async function ensureStorageDirectory() {
  try {
    await fs.mkdir(CONFIG.storage.directory, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Load corrections from file
 * 
 * @returns {Promise<Object>} Corrections data structure
 */
async function loadCorrections() {
  // Check cache first
  const now = Date.now();
  if (correctionsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return correctionsCache;
  }
  
  try {
    const filePath = getCorrectionsPath();
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Validate structure
    if (!parsed.corrections || !Array.isArray(parsed.corrections)) {
      return createEmptyStore();
    }
    
    // Update cache
    correctionsCache = parsed;
    cacheTimestamp = now;
    
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet - return empty store
      return createEmptyStore();
    }
    throw error;
  }
}

/**
 * Save corrections to file
 * 
 * @param {Object} data - Corrections data to save
 * @returns {Promise<void>}
 */
async function saveCorrections(data) {
  await ensureStorageDirectory();
  
  const filePath = getCorrectionsPath();
  
  // Create backup if file exists
  try {
    await fs.access(filePath);
    await createBackup(filePath);
  } catch (error) {
    // File doesn't exist, no backup needed
  }
  
  // Save with pretty formatting
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, json, 'utf-8');
  
  // Update cache
  correctionsCache = data;
  cacheTimestamp = Date.now();
}

/**
 * Create backup of corrections file
 * 
 * @param {string} filePath - Path to file to backup
 * @returns {Promise<void>}
 */
async function createBackup(filePath) {
  const backupPath = `${filePath}.backup`;
  
  try {
    await fs.copyFile(filePath, backupPath);
    
    // Rotate old backups
    for (let i = CONFIG.storage.backupCount - 1; i > 0; i--) {
      const oldBackup = `${filePath}.backup.${i}`;
      const newBackup = `${filePath}.backup.${i + 1}`;
      
      try {
        await fs.rename(oldBackup, newBackup);
      } catch (error) {
        // Backup might not exist
      }
    }
    
    // Move current backup to .backup.1
    try {
      await fs.rename(backupPath, `${filePath}.backup.1`);
    } catch (error) {
      // Ignore
    }
  } catch (error) {
    // Backup failed, but don't prevent save
    console.error('Backup creation failed:', error.message);
  }
}

/**
 * Create empty corrections store structure
 * 
 * @returns {Object} Empty corrections store
 */
function createEmptyStore() {
  return {
    version: CONFIG.version,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    corrections: [],
    metadata: {
      totalCorrections: 0,
      uniquePatterns: 0
    }
  };
}

/**
 * Normalize input pattern for consistent storage
 * 
 * @param {string} input - Input pattern
 * @returns {string} Normalized pattern
 */
function normalizePattern(input) {
  return input.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Record a user correction
 * 
 * @param {string} input - User's input that didn't match correctly
 * @param {string} topMatchId - ID of command that was top match
 * @param {string} selectedId - ID of command user actually selected
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<Object>} Recorded correction
 */
export async function recordCorrection(input, topMatchId, selectedId, metadata = {}) {
  const normalized = normalizePattern(input);
  
  // Load existing corrections
  const store = await loadCorrections();
  
  // Check if this correction already exists
  const existing = store.corrections.find(c => 
    c.input === normalized &&
    c.topMatchId === topMatchId &&
    c.selectedId === selectedId
  );
  
  if (existing) {
    // Update existing correction
    existing.frequency++;
    existing.lastSeen = new Date().toISOString();
    if (metadata.context) {
      existing.contexts = existing.contexts || [];
      existing.contexts.push({
        timestamp: new Date().toISOString(),
        ...metadata.context
      });
      // Keep only last 10 contexts
      existing.contexts = existing.contexts.slice(-10);
    }
  } else {
    // Add new correction
    const correction = {
      id: generateCorrectionId(),
      input: normalized,
      topMatchId,
      selectedId,
      frequency: 1,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      contexts: metadata.context ? [{
        timestamp: new Date().toISOString(),
        ...metadata.context
      }] : []
    };
    
    store.corrections.push(correction);
  }
  
  // Update metadata
  store.metadata.totalCorrections = store.corrections.reduce((sum, c) => sum + c.frequency, 0);
  store.metadata.uniquePatterns = new Set(store.corrections.map(c => c.input)).size;
  store.updated = new Date().toISOString();
  
  // Prune if needed
  if (store.corrections.length > CONFIG.limits.pruneThreshold) {
    pruneCorrections(store);
  }
  
  // Save
  await saveCorrections(store);
  
  return existing || store.corrections[store.corrections.length - 1];
}

/**
 * Get corrections for a specific input pattern
 * 
 * @param {string} input - Input pattern to look up
 * @returns {Promise<Array>} Matching corrections
 */
export async function getCorrectionsForInput(input) {
  const normalized = normalizePattern(input);
  const store = await loadCorrections();
  
  return store.corrections
    .filter(c => c.input === normalized)
    .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Get most common correction for an input pattern
 * 
 * @param {string} input - Input pattern
 * @returns {Promise<Object|null>} Most common correction or null
 */
export async function getMostCommonCorrection(input) {
  const corrections = await getCorrectionsForInput(input);
  return corrections.length > 0 ? corrections[0] : null;
}

/**
 * Get all corrections
 * 
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} All corrections
 */
export async function getAllCorrections(options = {}) {
  const {
    minFrequency = 1,
    sortBy = 'frequency',  // 'frequency' or 'lastSeen'
    limit = 100
  } = options;
  
  const store = await loadCorrections();
  
  let filtered = store.corrections.filter(c => c.frequency >= minFrequency);
  
  // Sort
  if (sortBy === 'frequency') {
    filtered.sort((a, b) => b.frequency - a.frequency);
  } else if (sortBy === 'lastSeen') {
    filtered.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
  }
  
  return filtered.slice(0, limit);
}

/**
 * Get corrections statistics
 * 
 * @returns {Promise<Object>} Statistics
 */
export async function getStatistics() {
  const store = await loadCorrections();
  
  const corrections = store.corrections;
  const totalFrequency = corrections.reduce((sum, c) => sum + c.frequency, 0);
  
  // Calculate patterns
  const patternCounts = new Map();
  corrections.forEach(c => {
    patternCounts.set(c.input, (patternCounts.get(c.input) || 0) + c.frequency);
  });
  
  // Top patterns
  const topPatterns = Array.from(patternCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pattern, count]) => ({ pattern, count }));
  
  return {
    totalCorrections: corrections.length,
    totalFrequency,
    uniquePatterns: patternCounts.size,
    averageFrequency: corrections.length > 0 ? totalFrequency / corrections.length : 0,
    topPatterns,
    oldestCorrection: corrections.length > 0 
      ? corrections.reduce((oldest, c) => 
          new Date(c.firstSeen) < new Date(oldest.firstSeen) ? c : oldest
        ).firstSeen
      : null,
    newestCorrection: corrections.length > 0
      ? corrections.reduce((newest, c) =>
          new Date(c.lastSeen) > new Date(newest.lastSeen) ? c : newest
        ).lastSeen
      : null
  };
}

/**
 * Prune old/infrequent corrections
 * 
 * @param {Object} store - Corrections store
 * @returns {void}
 */
function pruneCorrections(store) {
  // Sort by frequency descending
  store.corrections.sort((a, b) => b.frequency - a.frequency);
  
  // Keep top maxCorrections with frequency >= minFrequencyToKeep
  store.corrections = store.corrections
    .filter(c => c.frequency >= CONFIG.limits.minFrequencyToKeep)
    .slice(0, CONFIG.limits.maxCorrections);
  
  console.log(`Pruned corrections to ${store.corrections.length} entries`);
}

/**
 * Clear all corrections
 * 
 * @returns {Promise<void>}
 */
export async function clearCorrections() {
  const empty = createEmptyStore();
  await saveCorrections(empty);
  correctionsCache = null;
}

/**
 * Delete specific correction
 * 
 * @param {string} correctionId - ID of correction to delete
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteCorrection(correctionId) {
  const store = await loadCorrections();
  const index = store.corrections.findIndex(c => c.id === correctionId);
  
  if (index === -1) {
    return false;
  }
  
  store.corrections.splice(index, 1);
  store.metadata.totalCorrections = store.corrections.reduce((sum, c) => sum + c.frequency, 0);
  store.metadata.uniquePatterns = new Set(store.corrections.map(c => c.input)).size;
  store.updated = new Date().toISOString();
  
  await saveCorrections(store);
  return true;
}

/**
 * Export corrections to JSON
 * 
 * @returns {Promise<Object>} Corrections data
 */
export async function exportCorrections() {
  return await loadCorrections();
}

/**
 * Import corrections from JSON
 * 
 * @param {Object} data - Corrections data to import
 * @param {boolean} merge - Merge with existing or replace
 * @returns {Promise<void>}
 */
export async function importCorrections(data, merge = false) {
  if (merge) {
    const existing = await loadCorrections();
    
    // Merge corrections
    data.corrections.forEach(newCorr => {
      const existingCorr = existing.corrections.find(c =>
        c.input === newCorr.input &&
        c.topMatchId === newCorr.topMatchId &&
        c.selectedId === newCorr.selectedId
      );
      
      if (existingCorr) {
        existingCorr.frequency += newCorr.frequency;
        existingCorr.lastSeen = newCorr.lastSeen;
      } else {
        existing.corrections.push(newCorr);
      }
    });
    
    existing.updated = new Date().toISOString();
    await saveCorrections(existing);
  } else {
    await saveCorrections(data);
  }
}

/**
 * Generate unique correction ID
 * 
 * @returns {string} Unique ID
 */
function generateCorrectionId() {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get configuration
 * 
 * @returns {Object} Current configuration
 */
export function getConfig() {
  return { ...CONFIG };
}

/**
 * Update configuration
 * 
 * @param {Object} newConfig - New configuration values
 * @returns {void}
 */
export function updateConfig(newConfig) {
  if (newConfig.storage) {
    Object.assign(CONFIG.storage, newConfig.storage);
  }
  if (newConfig.limits) {
    Object.assign(CONFIG.limits, newConfig.limits);
  }
}

/**
 * Clear cache (for testing)
 * 
 * @returns {void}
 */
export function clearCache() {
  correctionsCache = null;
  cacheTimestamp = 0;
}

/**
 * Export for testing
 */
export const __testing__ = {
  CONFIG,
  normalizePattern,
  createEmptyStore,
  pruneCorrections,
  generateCorrectionId,
  getCorrectionsPath
};

export default {
  recordCorrection,
  getCorrectionsForInput,
  getMostCommonCorrection,
  getAllCorrections,
  getStatistics,
  clearCorrections,
  deleteCorrection,
  exportCorrections,
  importCorrections,
  getConfig,
  updateConfig,
  clearCache
};

