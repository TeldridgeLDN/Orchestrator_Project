/**
 * Directory Detection Hook
 * 
 * Automatically detects when the user changes directory to a registered project
 * and triggers context switching without manual intervention.
 * 
 * This hook implements zero-effort project switching by monitoring:
 * 1. Process working directory changes
 * 2. Directory change commands in user prompts
 * 
 * @module hooks/directoryDetection
 * @version 1.0.0
 */

import path from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { readConfig } from '../utils/config.js';
import { switchCommand } from '../commands/switch.js';

/**
 * Cache for tracking state
 */
const hookState = {
  lastKnownDirectory: process.cwd(),
  projectPathCache: new Map(),
  cacheBuiltAt: null,
  cacheTTL: 60000 // 1 minute TTL for cache
};

/**
 * Build or refresh the project path cache
 * This maps project paths to project names for faster lookup
 * 
 * @returns {Promise<void>}
 */
async function buildProjectPathCache() {
  try {
    const config = await readConfig();
    
    hookState.projectPathCache.clear();
    
    if (config.projects && typeof config.projects === 'object') {
      for (const [projectName, projectInfo] of Object.entries(config.projects)) {
        if (projectInfo && projectInfo.path) {
          hookState.projectPathCache.set(
            path.resolve(projectInfo.path), 
            projectName
          );
        }
      }
    }
    
    hookState.cacheBuiltAt = Date.now();
  } catch (error) {
    console.error('Error building project path cache:', error.message);
  }
}

/**
 * Get project name for a given directory path
 * Checks if the directory is within any registered project
 * 
 * @param {string} dirPath - Directory path to check
 * @returns {Promise<string|null>} Project name or null
 */
async function getProjectForDirectory(dirPath) {
  const resolvedPath = path.resolve(dirPath);
  
  // Rebuild cache if expired
  if (!hookState.cacheBuiltAt || (Date.now() - hookState.cacheBuiltAt > hookState.cacheTTL)) {
    await buildProjectPathCache();
  }
  
  // Check for exact match first
  if (hookState.projectPathCache.has(resolvedPath)) {
    return hookState.projectPathCache.get(resolvedPath);
  }
  
  // Check if current directory is within any project path
  for (const [projectPath, projectName] of hookState.projectPathCache.entries()) {
    if (resolvedPath.startsWith(projectPath + path.sep)) {
      return projectName;
    }
  }
  
  return null;
}

/**
 * Get the currently active project from context
 * 
 * @returns {Promise<string|null>} Active project name or null
 */
async function getActiveProject() {
  try {
    const contextFile = path.join(
      process.env.HOME || '/tmp', 
      '.claude', 
      'current-project.json'
    );
    
    if (!existsSync(contextFile)) {
      return null;
    }
    
    const content = await fs.readFile(contextFile, 'utf-8');
    const context = JSON.parse(content);
    return context.name || null;
  } catch (error) {
    return null;
  }
}

/**
 * Hook that detects directory changes and triggers project switching
 * Runs before user prompt is processed
 * 
 * @param {Object} context - The hook context containing prompt information
 * @param {Function} next - The next middleware function
 * @returns {Promise<void>}
 */
export async function directoryDetectionHook(context, next) {
  try {
    // Get current directory
    const currentDir = process.cwd();
    
    // Skip if directory hasn't changed
    if (currentDir === hookState.lastKnownDirectory) {
      return next();
    }
    
    // Update last known directory
    hookState.lastKnownDirectory = currentDir;
    
    // Get config to check if auto-switching is enabled
    const config = await readConfig();
    
    // Skip if auto-switching is disabled
    if (config.settings && config.settings.auto_switch_on_directory_change === false) {
      return next();
    }
    
    // Get project for current directory
    const projectName = await getProjectForDirectory(currentDir);
    
    // Skip if not in a registered project
    if (!projectName) {
      return next();
    }
    
    // Get active project
    const activeProject = await getActiveProject();
    
    // Skip if already in this project context
    if (activeProject === projectName) {
      return next();
    }
    
    // Auto-switch to the detected project
    console.log(`\n🔄 Auto-detected project switch: ${projectName}`);
    console.log(`   Directory: ${currentDir}\n`);
    
    await switchCommand(currentDir, { 
      name: projectName,
      validate: config.settings?.validate_on_switch !== false,
      verbose: false
    });
    
    return next();
  } catch (error) {
    // Log error but don't block the prompt
    console.error('Directory detection hook error:', error.message);
    return next();
  }
}

/**
 * Hook that detects directory context in prompts
 * Looks for cd commands and other directory references
 * 
 * @param {Object} context - The hook context containing prompt information
 * @param {Function} next - The next middleware function
 * @returns {Promise<void>}
 */
export async function promptDirectoryDetectionHook(context, next) {
  try {
    const prompt = context.prompt || '';
    
    // Get config to check if auto-switching is enabled
    const config = await readConfig();
    
    // Skip if auto-switching is disabled
    if (config.settings && config.settings.auto_switch_on_directory_change === false) {
      return next();
    }
    
    // Look for directory change commands in the prompt
    // Matches: cd path, cd ./path, cd ../path, cd /abs/path
    const cdMatch = prompt.match(/(?:^|\s)cd\s+([^\s;|&'"]+)/);
    if (!cdMatch) {
      return next();
    }
    
    const targetDir = cdMatch[1];
    
    // Resolve relative paths
    let resolvedPath;
    if (path.isAbsolute(targetDir)) {
      resolvedPath = targetDir;
    } else {
      resolvedPath = path.resolve(process.cwd(), targetDir);
    }
    
    // Only proceed if directory exists
    if (!existsSync(resolvedPath)) {
      return next();
    }
    
    // Get project for target directory
    const projectName = await getProjectForDirectory(resolvedPath);
    
    // Skip if not in a registered project
    if (!projectName) {
      return next();
    }
    
    // Get active project
    const activeProject = await getActiveProject();
    
    // Skip if already in this project context
    if (activeProject === projectName) {
      return next();
    }
    
    // Auto-switch to the detected project
    console.log(`\n🔄 Auto-detected project switch from prompt: ${projectName}`);
    console.log(`   Target directory: ${resolvedPath}\n`);
    
    await switchCommand(resolvedPath, { 
      name: projectName,
      validate: config.settings?.validate_on_switch !== false,
      verbose: false
    });
    
    return next();
  } catch (error) {
    // Log error but don't block the prompt
    console.error('Prompt directory detection hook error:', error.message);
    return next();
  }
}

/**
 * Manually clear the project path cache
 * Useful when projects are added/removed
 * 
 * @returns {void}
 */
export function clearProjectCache() {
  hookState.projectPathCache.clear();
  hookState.cacheBuiltAt = null;
}

/**
 * Reset the directory tracking state
 * Useful for testing
 * 
 * @returns {void}
 */
export function resetDirectoryTracking() {
  hookState.lastKnownDirectory = process.cwd();
}

