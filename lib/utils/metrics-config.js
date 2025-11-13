/**
 * Metrics Configuration Utility
 * 
 * Manages user-configurable options for metrics collection, including:
 * - Enable/disable metrics collection
 * - Retention period customization
 * - Privacy controls
 * - Collection scope settings
 * 
 * @module utils/metrics-config
 */

import { readConfig, writeConfig, updateConfigField } from './config.js';

// ==================== Constants ====================

const DEFAULT_METRICS_CONFIG = {
  enabled: true,
  retentionDays: 30,
  privacy: {
    anonymizeData: false,
    excludePatterns: []
  },
  collection: {
    skills: true,
    hooks: true,
    commands: true
  },
  archiving: {
    enabled: true,
    compressionLevel: 9
  }
};

// ==================== Configuration Management ====================

/**
 * Get metrics configuration with defaults
 * 
 * @returns {Promise<Object>} Metrics configuration
 */
export async function getMetricsConfig() {
  const config = await readConfig();
  
  // Ensure metrics configuration exists
  if (!config.metrics) {
    config.metrics = { ...DEFAULT_METRICS_CONFIG };
    await writeConfig(config);
  }
  
  // Merge with defaults to handle any missing fields
  return {
    ...DEFAULT_METRICS_CONFIG,
    ...config.metrics,
    privacy: {
      ...DEFAULT_METRICS_CONFIG.privacy,
      ...(config.metrics.privacy || {})
    },
    collection: {
      ...DEFAULT_METRICS_CONFIG.collection,
      ...(config.metrics.collection || {})
    },
    archiving: {
      ...DEFAULT_METRICS_CONFIG.archiving,
      ...(config.metrics.archiving || {})
    }
  };
}

/**
 * Update metrics configuration
 * 
 * @param {Object} updates - Partial configuration updates
 * @returns {Promise<Object>} Updated configuration
 */
export async function updateMetricsConfig(updates) {
  const config = await readConfig();
  
  // Initialize metrics config if it doesn't exist
  if (!config.metrics) {
    config.metrics = { ...DEFAULT_METRICS_CONFIG };
  }
  
  // Deep merge updates
  config.metrics = {
    ...config.metrics,
    ...updates,
    privacy: {
      ...config.metrics.privacy,
      ...(updates.privacy || {})
    },
    collection: {
      ...config.metrics.collection,
      ...(updates.collection || {})
    },
    archiving: {
      ...config.metrics.archiving,
      ...(updates.archiving || {})
    }
  };
  
  await writeConfig(config);
  return config.metrics;
}

/**
 * Enable or disable metrics collection
 * 
 * @param {boolean} enabled - Whether to enable metrics
 * @returns {Promise<void>}
 */
export async function setMetricsEnabled(enabled) {
  await updateConfigField('metrics.enabled', enabled);
  
  if (enabled) {
    console.log('✅ Metrics collection enabled');
  } else {
    console.log('🔒 Metrics collection disabled');
  }
}

/**
 * Set retention period for metrics
 * 
 * @param {number} days - Number of days to retain metrics
 * @returns {Promise<void>}
 */
export async function setRetentionPeriod(days) {
  if (days < 1) {
    throw new Error('Retention period must be at least 1 day');
  }
  
  await updateConfigField('metrics.retentionDays', days);
  console.log(`✅ Metrics retention set to ${days} days`);
}

/**
 * Enable or disable data anonymization
 * 
 * @param {boolean} enabled - Whether to anonymize data
 * @returns {Promise<void>}
 */
export async function setAnonymization(enabled) {
  await updateConfigField('metrics.privacy.anonymizeData', enabled);
  
  if (enabled) {
    console.log('🔒 Data anonymization enabled');
  } else {
    console.log('✅ Data anonymization disabled');
  }
}

/**
 * Add pattern to exclude from metrics collection
 * 
 * @param {string} pattern - Pattern to exclude (regex string)
 * @returns {Promise<void>}
 */
export async function addExcludePattern(pattern) {
  const config = await getMetricsConfig();
  
  if (!config.privacy.excludePatterns.includes(pattern)) {
    config.privacy.excludePatterns.push(pattern);
    await updateMetricsConfig({ privacy: config.privacy });
    console.log(`✅ Added exclude pattern: ${pattern}`);
  } else {
    console.log(`ℹ️  Pattern already exists: ${pattern}`);
  }
}

/**
 * Remove pattern from exclude list
 * 
 * @param {string} pattern - Pattern to remove
 * @returns {Promise<void>}
 */
export async function removeExcludePattern(pattern) {
  const config = await getMetricsConfig();
  const index = config.privacy.excludePatterns.indexOf(pattern);
  
  if (index !== -1) {
    config.privacy.excludePatterns.splice(index, 1);
    await updateMetricsConfig({ privacy: config.privacy });
    console.log(`✅ Removed exclude pattern: ${pattern}`);
  } else {
    console.log(`ℹ️  Pattern not found: ${pattern}`);
  }
}

/**
 * Configure collection scope
 * 
 * @param {Object} scope - Collection scope settings
 * @param {boolean} [scope.skills] - Collect skill metrics
 * @param {boolean} [scope.hooks] - Collect hook metrics
 * @param {boolean} [scope.commands] - Collect command metrics
 * @returns {Promise<void>}
 */
export async function setCollectionScope(scope) {
  const config = await getMetricsConfig();
  
  config.collection = {
    ...config.collection,
    ...scope
  };
  
  await updateMetricsConfig({ collection: config.collection });
  console.log('✅ Collection scope updated');
}

/**
 * Check if metrics collection is enabled
 * 
 * @returns {Promise<boolean>}
 */
export async function isMetricsEnabled() {
  const config = await getMetricsConfig();
  return config.enabled;
}

/**
 * Check if a specific collection type is enabled
 * 
 * @param {string} type - Collection type ('skills', 'hooks', or 'commands')
 * @returns {Promise<boolean>}
 */
export async function isCollectionEnabled(type) {
  const config = await getMetricsConfig();
  return config.enabled && config.collection[type];
}

/**
 * Check if a name should be excluded from metrics
 * 
 * @param {string} name - Name to check
 * @returns {Promise<boolean>}
 */
export async function shouldExclude(name) {
  const config = await getMetricsConfig();
  
  // Check if metrics are disabled globally
  if (!config.enabled) {
    return true;
  }
  
  // Check exclude patterns
  for (const pattern of config.privacy.excludePatterns) {
    try {
      const regex = new RegExp(pattern);
      if (regex.test(name)) {
        return true;
      }
    } catch (error) {
      console.warn(`Invalid exclude pattern: ${pattern}`);
    }
  }
  
  return false;
}

/**
 * Get retention period in days
 * 
 * @returns {Promise<number>}
 */
export async function getRetentionPeriod() {
  const config = await getMetricsConfig();
  return config.retentionDays;
}

/**
 * Display current metrics configuration
 * 
 * @returns {Promise<void>}
 */
export async function displayMetricsConfig() {
  const config = await getMetricsConfig();
  
  console.log('\n📊 Metrics Configuration\n');
  console.log(`  Enabled: ${config.enabled ? '✅ Yes' : '🔒 No'}`);
  console.log(`  Retention Period: ${config.retentionDays} days`);
  
  console.log('\n  🔒 Privacy:');
  console.log(`    Anonymize Data: ${config.privacy.anonymizeData ? 'Yes' : 'No'}`);
  console.log(`    Exclude Patterns: ${config.privacy.excludePatterns.length ? config.privacy.excludePatterns.join(', ') : 'None'}`);
  
  console.log('\n  📈 Collection Scope:');
  console.log(`    Skills: ${config.collection.skills ? '✅' : '❌'}`);
  console.log(`    Hooks: ${config.collection.hooks ? '✅' : '❌'}`);
  console.log(`    Commands: ${config.collection.commands ? '✅' : '❌'}`);
  
  console.log('\n  📦 Archiving:');
  console.log(`    Enabled: ${config.archiving.enabled ? 'Yes' : 'No'}`);
  console.log(`    Compression Level: ${config.archiving.compressionLevel}`);
  console.log();
}

/**
 * Reset metrics configuration to defaults
 * 
 * @returns {Promise<void>}
 */
export async function resetMetricsConfig() {
  await updateMetricsConfig(DEFAULT_METRICS_CONFIG);
  console.log('✅ Metrics configuration reset to defaults');
}

// ==================== Export ====================

export default {
  getMetricsConfig,
  updateMetricsConfig,
  setMetricsEnabled,
  setRetentionPeriod,
  setAnonymization,
  addExcludePattern,
  removeExcludePattern,
  setCollectionScope,
  isMetricsEnabled,
  isCollectionEnabled,
  shouldExclude,
  getRetentionPeriod,
  displayMetricsConfig,
  resetMetricsConfig,
  DEFAULT_METRICS_CONFIG
};

