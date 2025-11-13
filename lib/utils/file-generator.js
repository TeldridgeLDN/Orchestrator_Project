/**
 * File Generator Module
 * 
 * Manages safe file generation with backup, idempotency, and rollback support.
 * Used by scenario scaffolding to create orchestrator components.
 * 
 * @module utils/file-generator
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

/**
 * File operation result
 * 
 * @typedef {Object} FileOperationResult
 * @property {boolean} success - Whether operation succeeded
 * @property {string} path - File path
 * @property {string} operation - Operation type (created, updated, skipped)
 * @property {string} backup - Backup file path (if created)
 * @property {Error} error - Error object if failed
 */

/**
 * Generation options
 * 
 * @typedef {Object} GenerationOptions
 * @property {boolean} overwrite - Allow overwriting existing files
 * @property {boolean} backup - Create backups before overwriting
 * @property {boolean} dryRun - Don't actually write files
 * @property {number} mode - File permissions (e.g., 0o755)
 */

/**
 * Calculate file hash for content comparison
 * 
 * @param {string} content - File content
 * @returns {string} SHA256 hash
 */
export function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Check if file exists
 * 
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} True if exists
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read file and calculate hash
 * 
 * @param {string} filePath - Path to file
 * @returns {Promise<{content: string, hash: string} | null>} File data or null
 */
export async function readFileWithHash(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const hash = calculateHash(content);
    return { content, hash };
  } catch {
    return null;
  }
}

/**
 * Create backup of existing file
 * 
 * @param {string} filePath - Path to file to backup
 * @returns {Promise<string>} Path to backup file
 */
export async function createBackup(filePath) {
  const timestamp = Date.now();
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  
  const backupPath = path.join(dir, `${base}.backup-${timestamp}${ext}`);
  
  await fs.copyFile(filePath, backupPath);
  
  return backupPath;
}

/**
 * Ensure directory exists
 * 
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
export async function ensureDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Write file with safety checks
 * 
 * @param {string} filePath - Path to write
 * @param {string} content - Content to write
 * @param {GenerationOptions} options - Generation options
 * @returns {Promise<FileOperationResult>} Operation result
 */
export async function writeFileSafe(filePath, content, options = {}) {
  const opts = {
    overwrite: false,
    backup: true,
    dryRun: false,
    mode: null,
    ...options
  };

  const result = {
    success: false,
    path: filePath,
    operation: null,
    backup: null,
    error: null
  };

  try {
    // Dry run mode
    if (opts.dryRun) {
      result.success = true;
      result.operation = 'dry_run';
      return result;
    }

    // Ensure parent directory exists
    const dir = path.dirname(filePath);
    await ensureDirectory(dir);

    // Check if file exists
    const exists = await fileExists(filePath);
    
    if (exists) {
      // Check if content is identical (idempotency)
      const existing = await readFileWithHash(filePath);
      const newHash = calculateHash(content);
      
      if (existing && existing.hash === newHash) {
        result.success = true;
        result.operation = 'skipped';
        return result;
      }
      
      // File exists and content differs
      if (!opts.overwrite) {
        result.success = false;
        result.operation = 'blocked';
        result.error = new Error(`File exists and overwrite is disabled: ${filePath}`);
        return result;
      }
      
      // Create backup if requested
      if (opts.backup) {
        result.backup = await createBackup(filePath);
      }
      
      result.operation = 'updated';
    } else {
      result.operation = 'created';
    }

    // Write file
    await fs.writeFile(filePath, content, 'utf-8');
    
    // Set permissions if specified
    if (opts.mode !== null) {
      await fs.chmod(filePath, opts.mode);
    }

    result.success = true;
    return result;

  } catch (error) {
    result.error = error;
    return result;
  }
}

/**
 * Write multiple files as a batch
 * 
 * @param {Array<{path: string, content: string}>} files - Files to write
 * @param {GenerationOptions} options - Generation options
 * @returns {Promise<Array<FileOperationResult>>} Results for each file
 */
export async function writeFilesBatch(files, options = {}) {
  const results = [];
  
  for (const file of files) {
    const result = await writeFileSafe(file.path, file.content, options);
    results.push(result);
    
    // Stop on error unless continuing is specified
    if (!result.success && !options.continueOnError) {
      break;
    }
  }
  
  return results;
}

/**
 * Delete file safely
 * 
 * @param {string} filePath - Path to delete
 * @param {Object} options - Delete options
 * @param {boolean} options.backup - Create backup before deleting
 * @returns {Promise<FileOperationResult>} Operation result
 */
export async function deleteFileSafe(filePath, options = {}) {
  const opts = {
    backup: true,
    ...options
  };

  const result = {
    success: false,
    path: filePath,
    operation: 'deleted',
    backup: null,
    error: null
  };

  try {
    const exists = await fileExists(filePath);
    
    if (!exists) {
      result.success = true;
      result.operation = 'skipped';
      return result;
    }

    // Create backup if requested
    if (opts.backup) {
      result.backup = await createBackup(filePath);
    }

    await fs.unlink(filePath);
    result.success = true;
    
    return result;

  } catch (error) {
    result.error = error;
    return result;
  }
}

/**
 * Generate directory structure for a component
 * 
 * @param {string} basePath - Base directory path
 * @param {string} componentType - Type (skill, agent, etc.)
 * @param {string} componentName - Name of component
 * @returns {Object} Directory paths
 */
export function getComponentPaths(basePath, componentType, componentName) {
  const componentDir = path.join(basePath, componentType + 's', componentName);
  
  return {
    root: componentDir,
    main: path.join(componentDir, componentType === 'skill' ? 'SKILL.md' : 
                                  componentType === 'agent' ? 'AGENT.md' : 
                                  'README.md'),
    metadata: path.join(componentDir, 'metadata.json'),
    config: path.join(componentDir, 'config.json'),
    resources: path.join(componentDir, 'resources'),
    workflows: path.join(componentDir, 'workflows'),
    agents: path.join(componentDir, 'agents')
  };
}

/**
 * Get Claude directory paths
 * 
 * @returns {Object} Claude directory structure
 */
export function getClaudePaths() {
  const claudeHome = process.env.CLAUDE_HOME || path.join(os.homedir(), '.claude');
  
  return {
    home: claudeHome,
    skills: path.join(claudeHome, 'skills'),
    agents: path.join(claudeHome, 'agents'),
    commands: path.join(claudeHome, 'commands'),
    hooks: path.join(claudeHome, 'hooks'),
    scenarios: path.join(claudeHome, 'scenarios'),
    mcpConfig: path.join(claudeHome, '.mcp.json')
  };
}

/**
 * Clean up backup files older than specified days
 * 
 * @param {string} directory - Directory to clean
 * @param {number} daysOld - Delete backups older than this many days
 * @returns {Promise<number>} Number of files deleted
 */
export async function cleanupOldBackups(directory, daysOld = 30) {
  const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
  let deletedCount = 0;

  try {
    const files = await fs.readdir(directory);
    
    for (const file of files) {
      if (file.includes('.backup-')) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtimeMs < cutoffTime) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
    }
  } catch (error) {
    // Directory might not exist, that's ok
  }

  return deletedCount;
}

export default {
  calculateHash,
  fileExists,
  readFileWithHash,
  createBackup,
  ensureDirectory,
  writeFileSafe,
  writeFilesBatch,
  deleteFileSafe,
  getComponentPaths,
  getClaudePaths,
  cleanupOldBackups
};

