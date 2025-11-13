/**
 * PostToolUse Hook for Auto-Reload
 * 
 * Detects changes to critical configuration files after tool execution
 * and automatically reloads project context to ensure synchronization.
 * 
 * Monitors:
 * - .claude/metadata.json
 * - .claude/skill-rules.json
 * - .claude/scenarios/*.yaml
 * - .taskmaster/tasks/tasks.json
 * 
 * Features:
 * - Automatic context reload on file changes
 * - Configurable auto-reload behavior
 * - Skill cache clearing
 * - User notifications
 * 
 * @module hooks/postToolUse
 * @version 2.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { readConfig } from '../utils/config.js';
import { logToolUsage } from '../../.claude/lib/session-utils.js';
import { wrapError, safeExecute } from '../utils/errors/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Track file modification timestamps to avoid redundant checks
const fileTimestamps = new Map();

// Track last reload to prevent rapid successive reloads
let lastReloadTime = 0;
const MIN_RELOAD_INTERVAL = 5000; // 5 seconds between reloads

// Configuration
const CONFIG = {
  enabled: true,
  autoReload: true, // Enable automatic context reloading
  checkInterval: 1000, // Minimum time between checks (ms)
  lastCheck: 0,
  filesToMonitor: [
    '.claude/metadata.json',
    '.claude/skill-rules.json',
    '.claude/settings.local.json',
    '.taskmaster/config.json',
    '.taskmaster/tasks/tasks.json'
  ]
};

/**
 * Get the project root directory
 * @returns {string} Project root path
 */
function getProjectRoot() {
  // Start from hooks directory and go up to project root
  let currentDir = __dirname;
  
  // Go up from lib/hooks to project root
  return path.resolve(currentDir, '../..');
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>}
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file modification time
 * @param {string} filePath - Path to file
 * @returns {Promise<number|null>} Modification time in ms, or null if file doesn't exist
 */
async function getFileModTime(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.mtimeMs;
  } catch {
    return null;
  }
}

/**
 * Check if any monitored files have changed
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<{changed: boolean, files: string[]}>}
 */
async function checkForChanges(projectRoot) {
  const changedFiles = [];
  
  for (const relativePath of CONFIG.filesToMonitor) {
    const filePath = path.join(projectRoot, relativePath);
    
    // Check if file exists
    if (!(await fileExists(filePath))) {
      continue;
    }
    
    // Get current modification time
    const currentModTime = await getFileModTime(filePath);
    if (currentModTime === null) {
      continue;
    }
    
    // Get last known modification time
    const lastKnownModTime = fileTimestamps.get(filePath) || 0;
    
    // Check if file has been modified
    if (currentModTime > lastKnownModTime) {
      changedFiles.push(relativePath);
      fileTimestamps.set(filePath, currentModTime);
    }
  }
  
  return {
    changed: changedFiles.length > 0,
    files: changedFiles
  };
}

/**
 * Check for scenario file changes
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<string[]>} List of changed scenario files
 */
async function checkScenarioChanges(projectRoot) {
  const scenariosDir = path.join(projectRoot, '.claude/scenarios');
  
  // Check if scenarios directory exists
  if (!(await fileExists(scenariosDir))) {
    return [];
  }
  
  const changedScenarios = [];
  
  const { success, result, error } = await safeExecute(async () => {
    // Read all files in scenarios directory
    const files = await fs.readdir(scenariosDir);
    
    // Filter for YAML files
    const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
    
    // Check each YAML file for changes
    for (const file of yamlFiles) {
      const filePath = path.join(scenariosDir, file);
      const currentModTime = await getFileModTime(filePath);
      
      if (currentModTime === null) continue;
      
      const lastKnownModTime = fileTimestamps.get(filePath) || 0;
      
      if (currentModTime > lastKnownModTime) {
        changedScenarios.push(file);
        fileTimestamps.set(filePath, currentModTime);
      }
    }
  }, {
    operation: 'check-scenario-changes',
    displayToUser: false
  });

  if (!success) {
    // Log warning but continue - directory might not be readable
    console.debug(`⚠️  Could not check scenario changes: ${error.message}`);
  }
  
  return changedScenarios;
}

/**
 * Initialize file timestamps on first run
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<void>}
 */
async function initializeTimestamps(projectRoot) {
  // Initialize config file timestamps
  for (const relativePath of CONFIG.filesToMonitor) {
    const filePath = path.join(projectRoot, relativePath);
    
    if (await fileExists(filePath)) {
      const modTime = await getFileModTime(filePath);
      if (modTime !== null) {
        fileTimestamps.set(filePath, modTime);
      }
    }
  }
  
  // Initialize scenario file timestamps
  const scenariosDir = path.join(projectRoot, '.claude/scenarios');
  
  if (await fileExists(scenariosDir)) {
    const { success, error } = await safeExecute(async () => {
      const files = await fs.readdir(scenariosDir);
      const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
      
      for (const file of yamlFiles) {
        const filePath = path.join(scenariosDir, file);
        const modTime = await getFileModTime(filePath);
        if (modTime !== null) {
          fileTimestamps.set(filePath, modTime);
        }
      }
    }, {
      operation: 'initialize-scenario-timestamps',
      displayToUser: false
    });

    if (!success) {
      // Log warning but continue
      console.debug(`⚠️  Could not initialize scenario timestamps: ${error.message}`);
    }
  }
}

/**
 * Reload project context
 * Clears caches and reinitializes project state
 * 
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<void>}
 */
async function reloadProjectContext(projectRoot) {
  try {
    console.log('  🔄 Reloading project context...');
    
    // Clear any global caches
    if (global.skillCache) {
      global.skillCache = {};
    }
    
    if (global.scenarioCache) {
      global.scenarioCache = {};
    }
    
    // Re-read critical configuration files
    const metadataPath = path.join(projectRoot, '.claude/metadata.json');
    const skillRulesPath = path.join(projectRoot, '.claude/skill-rules.json');
    
    // Load metadata if it exists
    if (await fileExists(metadataPath)) {
      const { success, result, error } = await safeExecute(async () => {
        const content = await fs.readFile(metadataPath, 'utf-8');
        return JSON.parse(content);
      }, {
        operation: 'reload-metadata',
        displayToUser: false
      });

      if (success) {
        global.projectMetadata = result;
      } else {
        const wrappedError = wrapError(error, 'HOOK-FS-001', { path: metadataPath });
        console.error(`  ⚠️  ${wrappedError.userMessage}`);
      }
    }
    
    // Load skill rules if they exist
    if (await fileExists(skillRulesPath)) {
      const { success, result, error } = await safeExecute(async () => {
        const content = await fs.readFile(skillRulesPath, 'utf-8');
        return JSON.parse(content);
      }, {
        operation: 'reload-skill-rules',
        displayToUser: false
      });

      if (success) {
        global.skillRules = result;
      } else {
        const wrappedError = wrapError(error, 'HOOK-FS-001', { path: skillRulesPath });
        console.error(`  ⚠️  ${wrappedError.userMessage}`);
      }
    }
    
    console.log('  ✅ Context reloaded successfully');
    
  } catch (error) {
    console.error(`  ❌ Error reloading context: ${error.message}`);
    throw error;
  }
}

/**
 * Check if auto-reload is enabled in config
 * @returns {Promise<boolean>}
 */
async function isAutoReloadEnabled() {
  try {
    const config = await readConfig();
    
    // Check for feature flag
    if (config.features && typeof config.features.autoReloadContext === 'boolean') {
      return config.features.autoReloadContext;
    }
    
    // Check for settings flag (legacy)
    if (config.settings && typeof config.settings.auto_reload_context === 'boolean') {
      return config.settings.auto_reload_context;
    }
    
    // Default to CONFIG value
    return CONFIG.autoReload;
    
  } catch (error) {
    // If config can't be read, use default
    return CONFIG.autoReload;
  }
}

/**
 * PostToolUse hook handler
 * 
 * Monitors file changes and automatically reloads context when needed.
 * Also logs tool usage to session files for journaling.
 * 
 * @param {Object} context - Hook context
 * @param {Object} context.tool - Tool information
 * @param {string} context.tool.name - Tool name
 * @param {string} context.tool.action - Action performed
 * @param {string} [context.tool.file] - File affected
 * @param {number} [context.tool.changes] - Number of changes
 * @param {Function} next - Next middleware function
 * @returns {Promise<void>}
 */
export async function postToolUseHook(context, next) {
  try {
    // Log tool usage to session (non-blocking)
    if (context && context.tool) {
      logToolUsage(context.tool).catch(err => {
        // Silently handle session logging errors to not disrupt workflow
        console.debug('Session logging error:', err.message);
      });
    }
    
    // Check if hook is enabled
    if (!CONFIG.enabled) {
      await next();
      return;
    }
    
    // Throttle checks to avoid excessive filesystem operations
    const now = Date.now();
    if (now - CONFIG.lastCheck < CONFIG.checkInterval) {
      await next();
      return;
    }
    
    CONFIG.lastCheck = now;
    
    // Get project root
    const projectRoot = getProjectRoot();
    
    // Initialize timestamps on first run
    if (fileTimestamps.size === 0) {
      await initializeTimestamps(projectRoot);
      await next();
      return;
    }
    
    // Check for configuration file changes
    const configChanges = await checkForChanges(projectRoot);
    
    // Check for scenario file changes
    const scenarioChanges = await checkScenarioChanges(projectRoot);
    
    // If any files changed, handle reload
    if (configChanges.changed || scenarioChanges.length > 0) {
      console.log('\n📦 Configuration changes detected:');
      
      if (configChanges.changed) {
        console.log('\n  Modified configuration files:');
        configChanges.files.forEach(file => {
          console.log(`    - ${file}`);
        });
      }
      
      if (scenarioChanges.length > 0) {
        console.log('\n  Modified scenario files:');
        scenarioChanges.forEach(file => {
          console.log(`    - .claude/scenarios/${file}`);
        });
      }
      
      // Check if auto-reload is enabled
      const autoReloadEnabled = await isAutoReloadEnabled();
      
      if (autoReloadEnabled) {
        // Check if enough time has passed since last reload
        const timeSinceLastReload = now - lastReloadTime;
        
        if (timeSinceLastReload >= MIN_RELOAD_INTERVAL) {
          // Perform automatic reload
          await reloadProjectContext(projectRoot);
          lastReloadTime = now;
        } else {
          // Too soon since last reload, just notify
          const waitTime = Math.ceil((MIN_RELOAD_INTERVAL - timeSinceLastReload) / 1000);
          console.log(`\n  ⏱️  Auto-reload throttled. Please wait ${waitTime}s or reload manually.`);
        }
      } else {
        // Auto-reload disabled, just notify
        console.log('\n  ℹ️  Auto-reload disabled. Consider reloading context or restarting Claude Code to apply changes.');
        console.log('  💡 Enable auto-reload in config: features.autoReloadContext = true\n');
      }
    }
    
    // Continue to next hook
    await next();
    
  } catch (error) {
    // Log error but don't block execution - hooks should be resilient
    const wrappedError = wrapError(error, 'HOOK-EXEC-001', { hookName: 'postToolUse' });
    console.error(`⚠️  ${wrappedError.userMessage}`);
    
    // In verbose/debug mode, show stack trace
    if (process.env.DEBUG || process.env.VERBOSE) {
      console.debug(wrappedError.stack);
    }
    
    await next();
  }
}

/**
 * Enable or disable the hook
 * @param {boolean} enabled - Whether hook should be enabled
 */
export function setEnabled(enabled) {
  CONFIG.enabled = enabled;
}

/**
 * Enable or disable auto-reload
 * @param {boolean} autoReload - Whether auto-reload should be enabled
 */
export function setAutoReload(autoReload) {
  CONFIG.autoReload = autoReload;
}

/**
 * Get current hook status
 * @returns {{enabled: boolean, autoReload: boolean, monitoredFiles: number, lastCheck: number, lastReload: number}}
 */
export function getStatus() {
  return {
    enabled: CONFIG.enabled,
    autoReload: CONFIG.autoReload,
    monitoredFiles: fileTimestamps.size,
    lastCheck: CONFIG.lastCheck,
    lastReload: lastReloadTime
  };
}

/**
 * Clear all tracked timestamps
 * Useful for testing or forcing a fresh check
 */
export function clearTimestamps() {
  fileTimestamps.clear();
  CONFIG.lastCheck = 0;
  lastReloadTime = 0;
}

/**
 * Manually trigger a context reload
 * @param {string} projectRoot - Optional project root (defaults to current)
 * @returns {Promise<void>}
 */
export async function manualReload(projectRoot) {
  const root = projectRoot || getProjectRoot();
  await reloadProjectContext(root);
  lastReloadTime = Date.now();
}

/**
 * Export for external use (like tests)
 */
export { fileTimestamps, CONFIG, lastReloadTime };

export default postToolUseHook;

