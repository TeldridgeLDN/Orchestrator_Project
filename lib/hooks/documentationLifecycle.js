/**
 * DocumentationLifecycle Hook
 * 
 * Monitors documentation template usage and tracks documentation lifecycle.
 * Triggers on documentation file creation, logs to PAI history, and tracks
 * template compliance throughout the documentation lifecycle.
 * 
 * @module hooks/documentationLifecycle
 * @version 1.0.0
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';
import { wrapError, safeExecute } from '../utils/errors/index.js';

// File tracking
const fileTimestamps = new Map();
let lastCheck = 0;

// Configuration
const CHECK_INTERVAL = 1000; // 1 second
const MONITORED_PATTERNS = [
  'Docs/**/*.md',
  'templates/documentation/*.md',
  'templates/documentation/**/*.md'
];

const MONITORED_DIRS = [
  'Docs',
  'templates/documentation'
];

// PAI history configuration
const PAI_HISTORY_PATH = path.join(os.homedir(), '.claude', 'history.jsonl');

/**
 * DocumentationLifecycle Hook Handler
 * 
 * Triggers after tool execution to monitor file changes in documentation.
 * 
 * @param {Object} context - Hook context
 * @param {Object} [context.tool] - Tool information
 * @param {string} [context.projectRoot] - Project root directory (for testing)
 * @param {Function} next - Next middleware function
 * @returns {Promise<void>}
 */
export async function documentationLifecycle(context, next) {
  try {
    // Throttle checks
    const now = Date.now();
    if (now - lastCheck < CHECK_INTERVAL) {
      await next();
      return;
    }
    lastCheck = now;
    
    // Get project root (allow override for testing)
    const projectRoot = context.projectRoot || process.cwd();
    
    // Initialize timestamps on first run
    if (fileTimestamps.size === 0) {
      await initializeTimestamps(projectRoot);
      await next();
      return;
    }
    
    // Check for file changes
    const changes = await detectChanges(projectRoot);
    
    if (changes.length > 0) {
      console.log(`📄 DocumentationLifecycle: Detected changes in ${changes.length} file(s)`);
      
      // Handle changes
      await handleChanges(changes, context);
    }
    
  } catch (error) {
    // Log error but don't block execution - hooks should be resilient
    const wrappedError = wrapError(error, 'HOOK-EXEC-001', { hookName: 'documentationLifecycle' });
    console.error(`⚠️  ${wrappedError.userMessage}`);
    
    if (process.env.DEBUG || process.env.VERBOSE) {
      console.debug(wrappedError.stack);
    }
  }
  
  // Continue to next hook
  await next();
}

/**
 * Initialize file timestamps for monitored directories
 * @private
 * @param {string} projectRoot - Project root directory
 */
async function initializeTimestamps(projectRoot) {
  for (const dir of MONITORED_DIRS) {
    const fullPath = path.join(projectRoot, dir);
    
    if (!existsSync(fullPath)) {
      continue;
    }
    
    const { success, error } = await safeExecute(async () => {
      await scanDirectory(fullPath);
    }, {
      operation: 'scan-directory',
      displayToUser: false
    });

    if (!success) {
      const wrappedError = wrapError(error, 'HOOK-FS-001', { path: fullPath });
      console.error(`⚠️  Error scanning ${dir}: ${wrappedError.userMessage}`);
    }
  }
}

/**
 * Scan directory recursively for markdown files
 * @private
 * @param {string} dirPath - Directory to scan
 */
async function scanDirectory(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      await scanDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const stats = await fs.stat(fullPath);
      fileTimestamps.set(fullPath, stats.mtimeMs);
    }
  }
}

/**
 * Detect file changes
 * @private
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Array<Object>>} Changed files with details
 */
async function detectChanges(projectRoot) {
  const changes = [];
  
  // Check existing tracked files for modifications
  for (const [filePath, lastModified] of fileTimestamps.entries()) {
    if (!existsSync(filePath)) {
      // File was deleted
      changes.push({
        path: filePath,
        type: 'deleted',
        relativePath: path.relative(projectRoot, filePath)
      });
      fileTimestamps.delete(filePath);
      continue;
    }
    
    const stats = await fs.stat(filePath);
    if (stats.mtimeMs > lastModified) {
      // File was modified
      changes.push({
        path: filePath,
        type: 'modified',
        relativePath: path.relative(projectRoot, filePath),
        size: stats.size
      });
      fileTimestamps.set(filePath, stats.mtimeMs);
    }
  }
  
  // Check for new files
  for (const dir of MONITORED_DIRS) {
    const fullPath = path.join(projectRoot, dir);
    
    if (!existsSync(fullPath)) {
      continue;
    }
    
    const newFiles = await findNewFiles(fullPath, projectRoot);
    changes.push(...newFiles);
  }
  
  return changes;
}

/**
 * Find new files not yet tracked
 * @private
 * @param {string} dirPath - Directory to scan
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Array<Object>>} New files
 */
async function findNewFiles(dirPath, projectRoot) {
  const newFiles = [];
  
  const { success, error } = await safeExecute(async () => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await findNewFiles(fullPath, projectRoot);
        newFiles.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        if (!fileTimestamps.has(fullPath)) {
          const stats = await fs.stat(fullPath);
          newFiles.push({
            path: fullPath,
            type: 'created',
            relativePath: path.relative(projectRoot, fullPath),
            size: stats.size
          });
          fileTimestamps.set(fullPath, stats.mtimeMs);
        }
      }
    }
  }, {
    operation: 'find-new-files',
    displayToUser: false
  });

  if (!success) {
    const wrappedError = wrapError(error, 'HOOK-FS-001', { path: dirPath });
    console.error(`⚠️  ${wrappedError.userMessage}`);
  }
  
  return newFiles;
}

/**
 * Handle detected changes
 * @private
 * @param {Array<Object>} changes - Changed files
 * @param {Object} context - Hook context
 */
async function handleChanges(changes, context) {
  for (const change of changes) {
    // Log to console
    const emoji = change.type === 'created' ? '✨' : change.type === 'modified' ? '✏️' : '🗑️';
    console.log(`   ${emoji} ${change.type}: ${change.relativePath}`);
    
    // Log to PAI history
    await logToPAI({
      event: 'documentation_file_changed',
      changeType: change.type,
      file: change.relativePath,
      timestamp: Date.now(),
      size: change.size,
      context: {
        tool: context.tool?.name || 'unknown',
        projectRoot: process.cwd()
      }
    });
    
    // Check if file uses documentation template
    if (change.type === 'created' || change.type === 'modified') {
      await checkTemplateUsage(change);
    }
  }
}

/**
 * Check if file uses documentation template
 * @private
 * @param {Object} change - File change details
 */
async function checkTemplateUsage(change) {
  const { success, result, error } = await safeExecute(async () => {
    const content = await fs.readFile(change.path, 'utf-8');
    
    // Check for template markers or structure
    const hasTemplateMarker = content.includes('<!-- Template:') || 
                              content.includes('# Template:');
    
    const hasStandardSections = [
      '## Overview',
      '## Purpose',
      '## Usage',
      '## Examples'
    ].filter(section => content.includes(section)).length >= 2;
    
    return { hasTemplateMarker, hasStandardSections };
  }, {
    operation: 'check-template-usage',
    displayToUser: false
  });

  if (!success) {
    // Log warning - file might be too large or inaccessible
    console.debug(`⚠️  Could not check template usage for ${change.relativePath}: ${error.message}`);
    return;
  }

  if (result.hasTemplateMarker || result.hasStandardSections) {
    console.log(`   📋 Template detected in: ${change.relativePath}`);
    
    await logToPAI({
      event: 'documentation_template_used',
      file: change.relativePath,
      hasMarker: result.hasTemplateMarker,
      hasSections: result.hasStandardSections,
      timestamp: Date.now()
    });
  }
}

/**
 * Log event to PAI history
 * @private
 * @param {Object} event - Event to log
 */
async function logToPAI(event) {
  const { success, error } = await safeExecute(async () => {
    // Ensure PAI directory exists
    const paiDir = path.dirname(PAI_HISTORY_PATH);
    if (!existsSync(paiDir)) {
      await fs.mkdir(paiDir, { recursive: true });
    }
    
    // Format as JSONL entry
    const entry = JSON.stringify({
      ...event,
      source: 'DocumentationLifecycle',
      timestamp: event.timestamp || Date.now()
    }) + '\n';
    
    // Append to history file
    await fs.appendFile(PAI_HISTORY_PATH, entry, 'utf-8');
  }, {
    operation: 'log-to-pai',
    displayToUser: false
  });

  if (!success) {
    const wrappedError = wrapError(error, 'HOOK-FS-001', { path: PAI_HISTORY_PATH });
    console.error(`⚠️  Failed to log to PAI history: ${wrappedError.userMessage}`);
  }
}

/**
 * Get documentation statistics
 * 
 * @returns {Object} Statistics about tracked documentation
 */
export function getDocumentationStats() {
  const projectRoot = process.cwd();
  const stats = {
    totalFiles: fileTimestamps.size,
    byDirectory: {},
    lastCheck: new Date(lastCheck).toISOString()
  };
  
  for (const filePath of fileTimestamps.keys()) {
    const relativePath = path.relative(projectRoot, filePath);
    const dir = relativePath.split(path.sep)[0];
    
    stats.byDirectory[dir] = (stats.byDirectory[dir] || 0) + 1;
  }
  
  return stats;
}

/**
 * Clear tracked timestamps
 * Useful for testing or forcing fresh check
 */
export function clearTimestamps() {
  fileTimestamps.clear();
  lastCheck = 0;
}

export default documentationLifecycle;

