/**
 * Project Detector Utility
 * 
 * Provides functions to detect project root directories based on diet103 infrastructure markers.
 * 
 * @module utils/project-detector
 * @version 1.0.0
 */

import path from 'path';
import { promises as fs } from 'fs';

/**
 * Markers that indicate a diet103 project root
 */
const PROJECT_MARKERS = [
  '.claude/',
  '.claude/config.json',
  'package.json',
  '.git/',
  '.taskmaster/',
  '.file-manifest.json'
];

/**
 * Detect the project root directory by searching for diet103 markers
 * 
 * @param {string} startPath - Starting directory path
 * @param {number} maxLevelsUp - Maximum levels to search up (default: 10)
 * @returns {Promise<string|null>} Project root path or null if not found
 */
export async function detectProjectRoot(startPath = process.cwd(), maxLevelsUp = 10) {
  let currentPath = path.resolve(startPath);
  let levelsUp = 0;

  while (levelsUp < maxLevelsUp) {
    // Check for any project markers
    for (const marker of PROJECT_MARKERS) {
      const markerPath = path.join(currentPath, marker);
      try {
        await fs.access(markerPath);
        return currentPath; // Found a marker, this is project root
      } catch {
        // Marker doesn't exist, continue
      }
    }

    // Move up one directory
    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      // Reached filesystem root
      break;
    }
    currentPath = parentPath;
    levelsUp++;
  }

  return null; // No project root found
}

/**
 * Check if a directory is a diet103 project root
 * 
 * @param {string} dirPath - Directory path to check
 * @returns {Promise<boolean>} True if directory is a project root
 */
export async function isProjectRoot(dirPath) {
  const resolvedPath = path.resolve(dirPath);
  
  // Check for .claude/ directory as primary indicator
  const claudePath = path.join(resolvedPath, '.claude');
  try {
    const stats = await fs.stat(claudePath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Get project name from directory path or package.json
 * 
 * @param {string} projectPath - Project root path
 * @returns {Promise<string>} Project name
 */
export async function getProjectName(projectPath) {
  // Try package.json first
  const packageJsonPath = path.join(projectPath, 'package.json');
  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    if (packageJson.name) {
      return packageJson.name;
    }
  } catch {
    // package.json doesn't exist or is invalid
  }

  // Fall back to directory name
  return path.basename(projectPath);
}

