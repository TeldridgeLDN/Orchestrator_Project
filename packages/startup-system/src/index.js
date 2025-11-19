/**
 * @diet103/startup-system
 * 
 * Shared startup verification system for diet103 projects.
 * Provides primacy rules verification, lifecycle management, and startup summaries.
 * 
 * @module @diet103/startup-system
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { verifyPrimacyRules, shouldSyncGlobalRules, getRemediationSuggestions } from './primacy-rules.js';
import { displayWakeUpSummary, displayCompactSummary, displayErrorSummary } from './summary.js';

/**
 * Main startup verification function
 * 
 * @param {Object} options - Startup options
 * @param {string} options.projectRoot - Project root directory
 * @param {boolean} [options.verbose=false] - Show detailed output
 * @param {boolean} [options.compact=false] - Use compact output format
 * @param {boolean} [options.silent=false] - Suppress all output
 * @returns {Promise<Object>} Startup results
 */
export async function runStartupVerification(options = {}) {
  const { 
    projectRoot = process.cwd(),
    verbose = false,
    compact = false,
    silent = false
  } = options;
  
  const results = {
    projectRoot,
    projectName: path.basename(projectRoot),
    success: true
  };
  
  try {
    // Verify primacy rules
    const primacyResult = await verifyPrimacyRules({
      projectRoot,
      verbose: !silent && !compact && verbose
    });
    results.primacyRules = primacyResult;
    
    // Check if sync is needed
    if (await shouldSyncGlobalRules(projectRoot)) {
      results.syncRecommended = true;
    }
    
    // Check for file lifecycle manifest
    const manifestPath = path.join(projectRoot, '.file-manifest.json');
    if (fs.existsSync(manifestPath)) {
      results.fileLifecycle = { success: true };
    } else {
      results.fileLifecycle = { success: false, message: 'Not initialized' };
    }
    
    // Check for TaskMaster
    const tasksPath = path.join(projectRoot, '.taskmaster/tasks/tasks.json');
    if (fs.existsSync(tasksPath)) {
      results.taskmaster = { configured: true };
    } else {
      results.taskmaster = { configured: false };
    }
    
    // Display summary
    if (!silent) {
      if (compact) {
        displayCompactSummary(results);
      } else {
        displayWakeUpSummary(results, { projectRoot, projectName: results.projectName });
      }
    }
    
    results.success = primacyResult.success;
    
  } catch (error) {
    results.success = false;
    results.error = error.message;
    
    if (!silent) {
      displayErrorSummary(error, projectRoot);
    }
  }
  
  return results;
}

/**
 * Get project root directory
 * Searches upward for indicators like package.json, .git, etc.
 * 
 * @param {string} [startDir] - Directory to start search from
 * @returns {string} Project root directory
 */
export function findProjectRoot(startDir = process.cwd()) {
  let currentDir = startDir;
  
  // Indicators of project root
  const indicators = [
    'package.json',
    '.git',
    '.taskmaster',
    '.claude'
  ];
  
  // Search upward
  while (currentDir !== path.dirname(currentDir)) {
    for (const indicator of indicators) {
      if (fs.existsSync(path.join(currentDir, indicator))) {
        return currentDir;
      }
    }
    currentDir = path.dirname(currentDir);
  }
  
  // Fallback to start directory
  return startDir;
}

/**
 * Verify project structure
 * 
 * @param {string} projectRoot - Project root directory
 * @returns {Object} Verification result
 */
export function verifyProjectStructure(projectRoot) {
  const required = [
    '.claude/rules',
    'package.json'
  ];
  
  const optional = [
    '.taskmaster',
    '.file-manifest.json',
    'lib',
    'Docs'
  ];
  
  const missing = [];
  const present = [];
  
  for (const item of required) {
    const fullPath = path.join(projectRoot, item);
    if (fs.existsSync(fullPath)) {
      present.push(item);
    } else {
      missing.push(item);
    }
  }
  
  const optionalPresent = [];
  for (const item of optional) {
    const fullPath = path.join(projectRoot, item);
    if (fs.existsSync(fullPath)) {
      optionalPresent.push(item);
    }
  }
  
  return {
    valid: missing.length === 0,
    required: { present, missing },
    optional: optionalPresent
  };
}

// Export all modules
export { 
  verifyPrimacyRules, 
  shouldSyncGlobalRules, 
  getRemediationSuggestions 
} from './primacy-rules.js';

export { 
  displayWakeUpSummary, 
  displayCompactSummary, 
  displayErrorSummary 
} from './summary.js';

// Default export
export default {
  runStartupVerification,
  findProjectRoot,
  verifyProjectStructure,
  verifyPrimacyRules,
  shouldSyncGlobalRules,
  getRemediationSuggestions,
  displayWakeUpSummary,
  displayCompactSummary,
  displayErrorSummary
};

