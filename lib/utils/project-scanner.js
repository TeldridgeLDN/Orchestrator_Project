/**
 * Project Scanner Utility
 * 
 * Provides recursive directory scanning to automatically discover diet103 projects
 * by detecting .claude/ directory structures.
 * 
 * @module utils/project-scanner
 * @version 1.0.0
 */

import path from 'path';
import { promises as fs } from 'fs';
import { EventEmitter } from 'events';
import chalk from 'chalk';
import { createError, wrapError } from './errors/index.js';
import { detectDiet103Infrastructure, analyzeDiet103Gaps } from './diet103-validator.js';

/**
 * Default scanning options
 */
const DEFAULT_OPTIONS = {
  maxDepth: 3,
  followSymlinks: false,
  excludeDirs: ['node_modules', '.git', '.vscode', 'dist', 'build', '.next', '__pycache__'],
  includeHidden: false, // Don't scan hidden directories except .claude
  parallel: true,
  signal: null, // AbortSignal for cancellation
  validateStructure: true, // Validate discovered projects
  minValidationScore: 0, // Minimum score to include (0-100)
  filterRegistered: false, // Filter out already registered projects
  registeredProjects: [] // Array of registered project paths
};

/**
 * Project Scanner class with event-based progress reporting
 */
export class ProjectScanner extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.stats = {
      directoriesScanned: 0,
      projectsFound: 0,
      errorsEncountered: 0,
      startTime: null,
      endTime: null
    };
    this.discoveredProjects = [];
    this.cancelled = false;
  }

  /**
   * Check if a directory should be excluded from scanning
   * 
   * @param {string} dirName - Directory name
   * @returns {boolean} True if should be excluded
   */
  shouldExclude(dirName) {
    // Always allow .claude directory
    if (dirName === '.claude') {
      return false;
    }

    // Exclude hidden directories unless includeHidden is true
    if (!this.options.includeHidden && dirName.startsWith('.')) {
      return true;
    }

    // Exclude directories in the exclusion list
    return this.options.excludeDirs.includes(dirName);
  }

  /**
   * Check if directory contains a .claude folder (is a Claude project)
   * 
   * @param {string} dirPath - Directory path to check
   * @returns {Promise<boolean>} True if contains .claude folder
   */
  async isClaudeProject(dirPath) {
    try {
      const claudePath = path.join(dirPath, '.claude');
      const stat = await fs.stat(claudePath);
      return stat.isDirectory();
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate project structure and get validation score
   * 
   * @param {string} projectPath - Project path to validate
   * @returns {Promise<Object>} Validation result with score and details
   */
  async validateProject(projectPath) {
    try {
      const checks = await detectDiet103Infrastructure(projectPath);
      const gaps = analyzeDiet103Gaps(checks);
      
      return {
        valid: gaps.score >= this.options.minValidationScore,
        score: gaps.score,
        isComplete: gaps.isComplete,
        checks,
        gaps
      };
    } catch (error) {
      return {
        valid: false,
        score: 0,
        isComplete: false,
        error: error.message
      };
    }
  }

  /**
   * Check if project is already registered
   * 
   * @param {string} projectPath - Project path to check
   * @returns {boolean} True if already registered
   */
  isRegistered(projectPath) {
    if (!this.options.filterRegistered) {
      return false;
    }
    
    return this.options.registeredProjects.some(registered => {
      // Normalize paths for comparison
      const normalizedRegistered = path.normalize(registered);
      const normalizedProject = path.normalize(projectPath);
      return normalizedRegistered === normalizedProject;
    });
  }

  /**
   * Recursively scan a directory for Claude projects
   * 
   * @param {string} dirPath - Directory to scan
   * @param {number} currentDepth - Current depth in the directory tree
   * @returns {Promise<void>}
   */
  async scanDirectory(dirPath, currentDepth = 0) {
    // Check for cancellation
    if (this.cancelled || this.options.signal?.aborted) {
      this.cancelled = true;
      return;
    }

    // Check depth limit
    if (currentDepth > this.options.maxDepth) {
      return;
    }

    try {
      // Update stats
      this.stats.directoriesScanned++;
      
      // Emit progress event (throttled)
      if (this.stats.directoriesScanned % 10 === 0) {
        this.emit('progress', {
          directoriesScanned: this.stats.directoriesScanned,
          projectsFound: this.stats.projectsFound,
          currentPath: dirPath
        });
      }

      // Check if current directory is a Claude project
      const isProject = await this.isClaudeProject(dirPath);
      
      if (isProject) {
        // Check if already registered (if filtering is enabled)
        if (this.isRegistered(dirPath)) {
          this.emit('project-skipped', {
            path: dirPath,
            reason: 'already-registered'
          });
          return; // Skip this project
        }

        // Build basic project info
        const projectInfo = {
          path: dirPath,
          name: path.basename(dirPath),
          depth: currentDepth,
          discoveredAt: new Date().toISOString()
        };

        // Validate structure if enabled
        if (this.options.validateStructure) {
          const validation = await this.validateProject(dirPath);
          projectInfo.validation = validation;
          projectInfo.valid = validation.valid;
          projectInfo.score = validation.score;

          // Skip if validation score is too low
          if (!validation.valid) {
            this.emit('project-skipped', {
              ...projectInfo,
              reason: 'validation-failed',
              score: validation.score,
              minScore: this.options.minValidationScore
            });
            return; // Skip this project
          }
        } else {
          projectInfo.valid = true;
          projectInfo.score = null;
        }

        this.discoveredProjects.push(projectInfo);
        this.stats.projectsFound++;

        this.emit('project-found', projectInfo);

        // Don't scan deeper if we found a project
        return;
      }

      // Read directory entries
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      // Filter for directories to scan
      const subdirs = entries.filter(entry => {
        if (!entry.isDirectory()) return false;
        if (this.shouldExclude(entry.name)) return false;
        return true;
      });

      // Scan subdirectories
      if (this.options.parallel && subdirs.length > 1) {
        // Parallel scanning for better performance
        await Promise.all(
          subdirs.map(subdir => 
            this.scanDirectory(path.join(dirPath, subdir.name), currentDepth + 1)
          )
        );
      } else {
        // Sequential scanning (more predictable for small sets)
        for (const subdir of subdirs) {
          if (this.cancelled) break;
          await this.scanDirectory(path.join(dirPath, subdir.name), currentDepth + 1);
        }
      }

    } catch (error) {
      // Handle permission errors and other issues gracefully
      this.stats.errorsEncountered++;
      
      const errorInfo = {
        path: dirPath,
        error: error.message,
        code: error.code
      };

      this.emit('scan-error', errorInfo);

      // Don't throw - continue scanning other directories
      if (error.code !== 'EACCES' && error.code !== 'ENOENT') {
        // Log unexpected errors
        console.error(chalk.dim(`  Warning: Error scanning ${dirPath}: ${error.message}`));
      }
    }
  }

  /**
   * Start scanning from a root directory
   * 
   * @param {string} rootPath - Root directory to start scanning
   * @returns {Promise<Object[]>} Array of discovered projects
   */
  async scan(rootPath) {
    const resolvedPath = path.resolve(rootPath);

    // Reset state
    this.stats = {
      directoriesScanned: 0,
      projectsFound: 0,
      errorsEncountered: 0,
      startTime: Date.now(),
      endTime: null
    };
    this.discoveredProjects = [];
    this.cancelled = false;

    // Verify root path exists and is a directory
    try {
      const stat = await fs.stat(resolvedPath);
      if (!stat.isDirectory()) {
        throw createError('UTIL-FS-003', { path: resolvedPath });
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw createError('UTIL-FS-001', { path: resolvedPath });
      }
      throw wrapError(error, 'UTIL-FS-004', { path: resolvedPath });
    }

    this.emit('scan-start', { path: resolvedPath, options: this.options });

    // Start recursive scan
    await this.scanDirectory(resolvedPath, 0);

    // Finalize stats
    this.stats.endTime = Date.now();
    this.stats.duration = this.stats.endTime - this.stats.startTime;

    this.emit('scan-complete', {
      projects: this.discoveredProjects,
      stats: this.stats,
      cancelled: this.cancelled
    });

    return this.discoveredProjects;
  }

  /**
   * Cancel an in-progress scan
   */
  cancel() {
    this.cancelled = true;
    this.emit('scan-cancelled', { stats: this.stats });
  }

  /**
   * Get current scanning statistics
   * 
   * @returns {Object} Current stats
   */
  getStats() {
    return { ...this.stats };
  }
}

/**
 * Load registered projects from the registry
 * 
 * @returns {Promise<string[]>} Array of registered project paths
 */
export async function loadRegisteredProjects() {
  const registryPath = path.join(process.env.HOME || '/tmp', '.claude', 'projects-registry.json');
  
  try {
    const content = await fs.readFile(registryPath, 'utf-8');
    const registry = JSON.parse(content);
    return Object.keys(registry.projects || {});
  } catch (error) {
    // Registry doesn't exist or is invalid - return empty array
    if (error.code === 'ENOENT') {
      return [];
    }
    // For other errors, log and return empty
    console.error(chalk.dim(`Warning: Could not load project registry: ${error.message}`));
    return [];
  }
}

/**
 * Simple function interface for scanning (non-event-based)
 * 
 * @param {string} rootPath - Root directory to scan
 * @param {Object} options - Scanning options
 * @returns {Promise<Object[]>} Array of discovered projects
 */
export async function scanForProjects(rootPath, options = {}) {
  const scanner = new ProjectScanner(options);
  return await scanner.scan(rootPath);
}

/**
 * Scan for projects and automatically filter registered ones
 * 
 * @param {string} rootPath - Root directory to scan
 * @param {Object} options - Scanning options (filterRegistered will be set to true)
 * @returns {Promise<Object[]>} Array of discovered unregistered projects
 */
export async function scanForUnregisteredProjects(rootPath, options = {}) {
  const registeredProjects = await loadRegisteredProjects();
  const scanner = new ProjectScanner({
    ...options,
    filterRegistered: true,
    registeredProjects
  });
  return await scanner.scan(rootPath);
}

/**
 * Scan with progress callback
 * 
 * @param {string} rootPath - Root directory to scan
 * @param {Function} progressCallback - Callback for progress updates
 * @param {Object} options - Scanning options
 * @returns {Promise<Object[]>} Array of discovered projects
 */
export async function scanWithProgress(rootPath, progressCallback, options = {}) {
  const scanner = new ProjectScanner(options);
  
  scanner.on('progress', progressCallback);
  scanner.on('project-found', (project) => {
    if (progressCallback.onProjectFound) {
      progressCallback.onProjectFound(project);
    }
  });
  scanner.on('scan-error', (errorInfo) => {
    if (progressCallback.onError) {
      progressCallback.onError(errorInfo);
    }
  });

  return await scanner.scan(rootPath);
}

