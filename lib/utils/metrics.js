/**
 * Metrics Tracking Utility
 * 
 * Handles metrics collection for skills and hooks with performance-optimized,
 * non-blocking operations. Implements in-memory buffering with debounced writes
 * to minimize disk I/O overhead.
 * 
 * Design Principles:
 * - Atomic file operations to prevent corruption
 * - Non-blocking async I/O (except on process exit)
 * - In-memory buffering with configurable flush intervals
 * - <5ms overhead target for metric recording
 * - Graceful degradation on errors (never crash the application)
 * 
 * @module utils/metrics
 */

import fs from 'fs/promises';
import { existsSync, writeFileSync } from 'fs';
import path from 'path';
import os from 'os';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// ==================== Constants ====================

const METRICS_DIR = path.join(os.homedir(), '.claude');
const METRICS_PATH = path.join(METRICS_DIR, 'metrics.json');
const METRICS_SCHEMA_PATH = path.resolve(process.cwd(), 'lib/schemas/metrics-schema.json');

const FLUSH_DEBOUNCE_MS = 2000; // 2 seconds debounce for batched writes
const CURRENT_SCHEMA_VERSION = '1.0.0';

// ==================== In-Memory State ====================

let metricsBuffer = {
  skills: {},
  hooks: {}
};

let flushTimeout = null;
let isInitialized = false;
let validatorCache = null;

// ==================== Schema Validation ====================

/**
 * Load and compile JSON schema validator
 * 
 * @returns {Promise<Object>} AJV validator instance
 */
async function getValidator() {
  if (validatorCache) {
    return validatorCache;
  }

  try {
    const schemaContent = await fs.readFile(METRICS_SCHEMA_PATH, 'utf-8');
    const schema = JSON.parse(schemaContent);
    
    const ajv = new Ajv({ 
      allErrors: true,
      strict: false
    });
    addFormats(ajv);
    
    validatorCache = ajv.compile(schema);
    return validatorCache;
  } catch (error) {
    console.error(`⚠️  Failed to load metrics schema: ${error.message}`);
    return null;
  }
}

/**
 * Validate metrics data against schema
 * 
 * @param {Object} data - Metrics data to validate
 * @returns {Promise<{valid: boolean, errors: Array}>}
 */
export async function validateMetrics(data) {
  const validator = await getValidator();
  
  if (!validator) {
    return { valid: false, errors: ['Schema validator not available'] };
  }

  const valid = validator(data);
  
  return {
    valid,
    errors: valid ? [] : validator.errors
  };
}

// ==================== Default Structures ====================

/**
 * Get default metrics structure
 * 
 * @returns {Object} Default metrics object
 */
function getDefaultMetrics() {
  const now = new Date().toISOString();
  
  return {
    version: CURRENT_SCHEMA_VERSION,
    reporting_period: {
      start: now,
      end: now
    },
    metadata: {
      created: now,
      last_modified: now,
      flush_pending: false
    },
    skills: {},
    hooks: {}
  };
}

/**
 * Get default skill metrics
 * 
 * @returns {Object} Default skill metric structure
 */
function getDefaultSkillMetrics() {
  const now = new Date().toISOString();
  
  return {
    activations: 0,
    manual: 0,
    auto: 0,
    avg_duration_seconds: 0,
    total_duration_seconds: 0,
    duration_histogram: {
      '<1s': 0,
      '1-5s': 0,
      '5-10s': 0,
      '10-30s': 0,
      '>30s': 0
    },
    errors_found: 0,
    errors_encountered: 0,
    first_used: now,
    last_used: now
  };
}

/**
 * Get default hook metrics
 * 
 * @returns {Object} Default hook metric structure
 */
function getDefaultHookMetrics() {
  const now = new Date().toISOString();
  
  return {
    executions: 0,
    warnings_issued: 0,
    errors_caught: 0,
    errors_encountered: 0,
    avg_execution_ms: 0,
    total_execution_ms: 0,
    execution_histogram: {
      '<1ms': 0,
      '1-5ms': 0,
      '5-10ms': 0,
      '10-50ms': 0,
      '>50ms': 0
    },
    first_executed: now,
    last_executed: now
  };
}

// ==================== File Operations ====================

/**
 * Load metrics from disk
 * 
 * @returns {Promise<Object>} Metrics object
 */
export async function loadMetrics() {
  try {
    if (!existsSync(METRICS_PATH)) {
      return getDefaultMetrics();
    }

    const content = await fs.readFile(METRICS_PATH, 'utf-8');
    const data = JSON.parse(content);

    // Validate loaded data
    const validation = await validateMetrics(data);
    if (!validation.valid) {
      console.warn('⚠️  Loaded metrics failed validation, using defaults');
      console.warn('Validation errors:', validation.errors);
      return getDefaultMetrics();
    }

    return data;
  } catch (error) {
    console.error(`⚠️  Error loading metrics: ${error.message}`);
    return getDefaultMetrics();
  }
}

/**
 * Write metrics to disk atomically
 * Uses temp file + rename pattern for atomicity
 * 
 * @param {Object} data - Metrics data to write
 * @returns {Promise<void>}
 */
async function writeMetricsAtomic(data) {
  try {
    // Ensure directory exists
    await fs.mkdir(METRICS_DIR, { recursive: true });

    // Update metadata
    data.metadata.last_modified = new Date().toISOString();
    data.metadata.flush_pending = false;

    // Validate before writing
    const validation = await validateMetrics(data);
    if (!validation.valid) {
      console.warn('⚠️  Attempted to write invalid metrics, skipping write');
      console.warn('Validation errors:', validation.errors);
      return;
    }

    // Write to temp file first
    const tempPath = `${METRICS_PATH}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    
    // Atomically rename
    await fs.rename(tempPath, METRICS_PATH);
  } catch (error) {
    console.error(`⚠️  Failed to write metrics: ${error.message}`);
    // Non-blocking: don't throw, just log
  }
}

// ==================== Buffer Management ====================

/**
 * Initialize metrics system
 * Loads existing metrics into memory
 * 
 * @returns {Promise<void>}
 */
async function initialize() {
  if (isInitialized) {
    return;
  }

  const diskMetrics = await loadMetrics();
  
  // Initialize buffer from disk
  metricsBuffer.skills = { ...diskMetrics.skills };
  metricsBuffer.hooks = { ...diskMetrics.hooks };
  
  isInitialized = true;
}

/**
 * Schedule a debounced flush to disk
 * Multiple calls within the debounce window are coalesced
 * 
 * @returns {void}
 */
function scheduleFlush() {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
  }

  flushTimeout = setTimeout(async () => {
    await flushMetrics();
    flushTimeout = null;
  }, FLUSH_DEBOUNCE_MS);
}

/**
 * Flush buffered metrics to disk
 * Merges in-memory buffer with disk state
 * 
 * @returns {Promise<void>}
 */
export async function flushMetrics() {
  try {
    const diskMetrics = await loadMetrics();

    // Merge buffer into disk metrics
    diskMetrics.skills = { ...diskMetrics.skills, ...metricsBuffer.skills };
    diskMetrics.hooks = { ...diskMetrics.hooks, ...metricsBuffer.hooks };

    // Update reporting period
    diskMetrics.reporting_period.end = new Date().toISOString();

    await writeMetricsAtomic(diskMetrics);
  } catch (error) {
    console.error(`⚠️  Error flushing metrics: ${error.message}`);
  }
}

// ==================== Histogram Helpers ====================

/**
 * Update duration histogram bucket
 * 
 * @param {Object} histogram - Histogram object
 * @param {number} durationSeconds - Duration in seconds
 * @returns {void}
 */
function updateDurationHistogram(histogram, durationSeconds) {
  if (durationSeconds < 1) {
    histogram['<1s']++;
  } else if (durationSeconds < 5) {
    histogram['1-5s']++;
  } else if (durationSeconds < 10) {
    histogram['5-10s']++;
  } else if (durationSeconds < 30) {
    histogram['10-30s']++;
  } else {
    histogram['>30s']++;
  }
}

/**
 * Update execution time histogram bucket (milliseconds)
 * 
 * @param {Object} histogram - Histogram object
 * @param {number} durationMs - Duration in milliseconds
 * @returns {void}
 */
function updateExecutionHistogram(histogram, durationMs) {
  if (durationMs < 1) {
    histogram['<1ms']++;
  } else if (durationMs < 5) {
    histogram['1-5ms']++;
  } else if (durationMs < 10) {
    histogram['5-10ms']++;
  } else if (durationMs < 50) {
    histogram['10-50ms']++;
  } else {
    histogram['>50ms']++;
  }
}

// ==================== Skill Metrics ====================

/**
 * Record a skill activation
 * 
 * @param {string} skillName - Name of the skill
 * @param {boolean} isAutomatic - Whether activation was automatic
 * @returns {Promise<void>}
 */
export async function recordSkillActivation(skillName, isAutomatic = false) {
  await initialize();

  if (!metricsBuffer.skills[skillName]) {
    metricsBuffer.skills[skillName] = getDefaultSkillMetrics();
  }

  const skill = metricsBuffer.skills[skillName];
  skill.activations++;
  
  if (isAutomatic) {
    skill.auto++;
  } else {
    skill.manual++;
  }
  
  skill.last_used = new Date().toISOString();

  scheduleFlush();
}

/**
 * Record skill execution duration
 * 
 * @param {string} skillName - Name of the skill
 * @param {number} durationSeconds - Execution duration in seconds
 * @returns {Promise<void>}
 */
export async function recordSkillDuration(skillName, durationSeconds) {
  await initialize();

  if (!metricsBuffer.skills[skillName]) {
    metricsBuffer.skills[skillName] = getDefaultSkillMetrics();
  }

  const skill = metricsBuffer.skills[skillName];
  
  // Update total duration
  skill.total_duration_seconds += durationSeconds;
  
  // Recalculate average (using current activations count)
  skill.avg_duration_seconds = skill.total_duration_seconds / skill.activations;
  
  // Update histogram
  updateDurationHistogram(skill.duration_histogram, durationSeconds);

  scheduleFlush();
}

/**
 * Record errors found by a skill
 * 
 * @param {string} skillName - Name of the skill
 * @param {number} count - Number of errors found
 * @returns {Promise<void>}
 */
export async function recordSkillErrorsFound(skillName, count = 1) {
  await initialize();

  if (!metricsBuffer.skills[skillName]) {
    metricsBuffer.skills[skillName] = getDefaultSkillMetrics();
  }

  metricsBuffer.skills[skillName].errors_found += count;

  scheduleFlush();
}

/**
 * Record a skill execution error
 * 
 * @param {string} skillName - Name of the skill
 * @returns {Promise<void>}
 */
export async function recordSkillError(skillName) {
  await initialize();

  if (!metricsBuffer.skills[skillName]) {
    metricsBuffer.skills[skillName] = getDefaultSkillMetrics();
  }

  metricsBuffer.skills[skillName].errors_encountered++;

  scheduleFlush();
}

// ==================== Hook Metrics ====================

/**
 * Record a hook execution
 * 
 * @param {string} hookName - Name of the hook
 * @param {number} durationMs - Execution duration in milliseconds
 * @returns {Promise<void>}
 */
export async function recordHookExecution(hookName, durationMs = 0) {
  await initialize();

  if (!metricsBuffer.hooks[hookName]) {
    metricsBuffer.hooks[hookName] = getDefaultHookMetrics();
  }

  const hook = metricsBuffer.hooks[hookName];
  hook.executions++;
  
  if (durationMs > 0) {
    hook.total_execution_ms += durationMs;
    hook.avg_execution_ms = hook.total_execution_ms / hook.executions;
    updateExecutionHistogram(hook.execution_histogram, durationMs);
  }
  
  hook.last_executed = new Date().toISOString();

  scheduleFlush();
}

/**
 * Record a warning issued by a hook
 * 
 * @param {string} hookName - Name of the hook
 * @param {number} count - Number of warnings
 * @returns {Promise<void>}
 */
export async function recordHookWarning(hookName, count = 1) {
  await initialize();

  if (!metricsBuffer.hooks[hookName]) {
    metricsBuffer.hooks[hookName] = getDefaultHookMetrics();
  }

  metricsBuffer.hooks[hookName].warnings_issued += count;

  scheduleFlush();
}

/**
 * Record an error caught by a hook
 * 
 * @param {string} hookName - Name of the hook
 * @param {number} count - Number of errors caught
 * @returns {Promise<void>}
 */
export async function recordHookErrorCaught(hookName, count = 1) {
  await initialize();

  if (!metricsBuffer.hooks[hookName]) {
    metricsBuffer.hooks[hookName] = getDefaultHookMetrics();
  }

  metricsBuffer.hooks[hookName].errors_caught += count;

  scheduleFlush();
}

/**
 * Record a hook execution error
 * 
 * @param {string} hookName - Name of the hook
 * @returns {Promise<void>}
 */
export async function recordHookError(hookName) {
  await initialize();

  if (!metricsBuffer.hooks[hookName]) {
    metricsBuffer.hooks[hookName] = getDefaultHookMetrics();
  }

  metricsBuffer.hooks[hookName].errors_encountered++;

  scheduleFlush();
}

// ==================== Process Lifecycle ====================

/**
 * Graceful shutdown handler
 * Synchronously flushes pending metrics on process exit
 * 
 * @returns {void}
 */
function handleProcessExit() {
  if (Object.keys(metricsBuffer.skills).length > 0 || 
      Object.keys(metricsBuffer.hooks).length > 0) {
    
    try {
      // Synchronous flush on exit
      const diskMetrics = existsSync(METRICS_PATH)
        ? JSON.parse(require('fs').readFileSync(METRICS_PATH, 'utf-8'))
        : getDefaultMetrics();

      diskMetrics.skills = { ...diskMetrics.skills, ...metricsBuffer.skills };
      diskMetrics.hooks = { ...diskMetrics.hooks, ...metricsBuffer.hooks };
      diskMetrics.reporting_period.end = new Date().toISOString();
      diskMetrics.metadata.last_modified = new Date().toISOString();

      writeFileSync(METRICS_PATH, JSON.stringify(diskMetrics, null, 2), 'utf-8');
    } catch (error) {
      // Best effort - can't do much on exit
      console.error('⚠️  Failed to flush metrics on exit:', error.message);
    }
  }
}

// Register process exit handlers
process.on('exit', handleProcessExit);
process.on('SIGINT', () => {
  handleProcessExit();
  process.exit(0);
});
process.on('SIGTERM', () => {
  handleProcessExit();
  process.exit(0);
});

// ==================== Utility Functions ====================

/**
 * Get current metrics snapshot
 * 
 * @returns {Promise<Object>} Current metrics
 */
export async function getMetrics() {
  return await loadMetrics();
}

/**
 * Clear all metrics
 * 
 * @returns {Promise<void>}
 */
export async function clearMetrics() {
  const defaultMetrics = getDefaultMetrics();
  await writeMetricsAtomic(defaultMetrics);
  
  metricsBuffer.skills = {};
  metricsBuffer.hooks = {};
}

/**
 * Get metrics for a specific skill
 * 
 * @param {string} skillName - Name of the skill
 * @returns {Promise<Object|null>} Skill metrics or null
 */
export async function getSkillMetrics(skillName) {
  const metrics = await loadMetrics();
  return metrics.skills[skillName] || null;
}

/**
 * Get metrics for a specific hook
 * 
 * @param {string} hookName - Name of the hook
 * @returns {Promise<Object|null>} Hook metrics or null
 */
export async function getHookMetrics(hookName) {
  const metrics = await loadMetrics();
  return metrics.hooks[hookName] || null;
}

// ==================== Exports ====================

export default {
  // Core functions
  loadMetrics,
  flushMetrics,
  getMetrics,
  clearMetrics,
  
  // Skill tracking
  recordSkillActivation,
  recordSkillDuration,
  recordSkillErrorsFound,
  recordSkillError,
  getSkillMetrics,
  
  // Hook tracking
  recordHookExecution,
  recordHookWarning,
  recordHookErrorCaught,
  recordHookError,
  getHookMetrics,
  
  // Schema validation
  validateMetrics
};

