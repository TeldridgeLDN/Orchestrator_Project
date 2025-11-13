/**
 * @fileoverview Skill Discovery and Loading Utilities
 * @module lib/utils/skill-loader
 * 
 * Provides utilities for discovering, loading, and validating skills
 * from various sources (global, local paths, remote URLs).
 * 
 * @see {@link https://github.com/diet103/orchestrator|Diet103 Orchestrator}
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { satisfiesConstraint, compareVersions } from './version-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the global skills directory path
 * 
 * @returns {string} Absolute path to global skills directory
 */
export function getGlobalSkillsPath() {
  // Check environment variable first
  if (process.env.DIET103_SKILLS_PATH) {
    return process.env.DIET103_SKILLS_PATH;
  }
  
  // Default to user's home directory
  return path.join(os.homedir(), '.claude', 'skills');
}

/**
 * Ensure global skills directory exists
 * 
 * @returns {Promise<string>} Path to global skills directory
 */
export async function ensureGlobalSkillsDirectory() {
  const skillsPath = getGlobalSkillsPath();
  
  try {
    await fs.promises.mkdir(skillsPath, { recursive: true });
    return skillsPath;
  } catch (error) {
    throw new Error(`Failed to create global skills directory: ${error.message}`);
  }
}

/**
 * Load skill metadata from a directory
 * 
 * @param {string} skillPath - Absolute path to skill directory
 * @returns {Promise<Object>} Skill metadata object
 * @throws {Error} If skill metadata not found or invalid
 */
export async function loadSkillMetadata(skillPath) {
  const metadataPath = path.join(skillPath, 'metadata.json');
  
  try {
    const content = await fs.promises.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(content);
    
    // Validate required fields
    const requiredFields = ['name', 'version', 'description'];
    for (const field of requiredFields) {
      if (!metadata[field]) {
        throw new Error(`Skill metadata missing required field: ${field}`);
      }
    }
    
    return metadata;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Skill metadata.json not found at ${metadataPath}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in skill metadata: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Load skill from a source (global or custom path)
 * 
 * @param {string} source - Source identifier ('global' or absolute path)
 * @param {string} skillName - Name of the skill to load
 * @param {string} [version] - Specific version or constraint to load (optional)
 * @returns {Promise<Object|null>} Skill metadata or null if not found
 */
export async function loadSkill(source, skillName, version = null) {
  const sourcePath = source === 'global' ? getGlobalSkillsPath() : source;
  const skillPath = path.join(sourcePath, skillName);
  
  // Check if skill directory exists
  try {
    await fs.promises.access(skillPath);
  } catch (error) {
    return null; // Skill not found
  }
  
  // Load skill metadata
  try {
    const metadata = await loadSkillMetadata(skillPath);
    
    // If version specified, check if it satisfies constraint
    if (version) {
      // Check if it's a constraint (contains operators) or exact version
      const isConstraint = /^[~^><=]/.test(version);
      
      if (isConstraint) {
        // Use satisfiesConstraint for version ranges
        if (!satisfiesConstraint(metadata.version, version)) {
          return null; // Version doesn't satisfy constraint
        }
      } else {
        // Exact version match
        if (metadata.version !== version) {
          return null; // Version mismatch
        }
      }
    }
    
    // Add path information
    metadata.path = skillPath;
    metadata.source = source;
    
    return metadata;
  } catch (error) {
    throw new Error(`Failed to load skill '${skillName}': ${error.message}`);
  }
}

/**
 * Check if a skill exists in a source
 * 
 * @param {string} source - Source identifier ('global' or absolute path)
 * @param {string} skillName - Name of the skill to check
 * @returns {Promise<boolean>} True if skill exists
 */
export async function skillExists(source, skillName) {
  const sourcePath = source === 'global' ? getGlobalSkillsPath() : source;
  const skillPath = path.join(sourcePath, skillName);
  
  try {
    const stats = await fs.promises.stat(skillPath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * List all available skills in a source
 * 
 * @param {string} [source='global'] - Source identifier ('global' or absolute path)
 * @returns {Promise<Array<Object>>} Array of skill metadata objects
 */
export async function listAvailableSkills(source = 'global') {
  const sourcePath = source === 'global' ? getGlobalSkillsPath() : source;
  
  // Check if source directory exists
  try {
    await fs.promises.access(sourcePath);
  } catch (error) {
    return []; // Source doesn't exist, return empty array
  }
  
  // Read directory contents
  const entries = await fs.promises.readdir(sourcePath, { withFileTypes: true });
  
  // Filter for directories only
  const skillDirs = entries.filter(entry => entry.isDirectory());
  
  // Load metadata for each skill
  const skills = [];
  for (const dir of skillDirs) {
    try {
      const skillPath = path.join(sourcePath, dir.name);
      const metadata = await loadSkillMetadata(skillPath);
      metadata.path = skillPath;
      metadata.source = source;
      skills.push(metadata);
    } catch (error) {
      // Skip skills with invalid metadata
      console.warn(`Warning: Skipping skill '${dir.name}': ${error.message}`);
    }
  }
  
  return skills;
}

/**
 * Search for skills by name or description
 * 
 * @param {string} query - Search query
 * @param {string} [source='global'] - Source identifier ('global' or absolute path)
 * @returns {Promise<Array<Object>>} Array of matching skill metadata objects
 */
export async function searchSkills(query, source = 'global') {
  const skills = await listAvailableSkills(source);
  const queryLower = query.toLowerCase();
  
  return skills.filter(skill => {
    const nameMatch = skill.name.toLowerCase().includes(queryLower);
    const descMatch = skill.description.toLowerCase().includes(queryLower);
    const tagsMatch = skill.tags?.some(tag => tag.toLowerCase().includes(queryLower));
    
    return nameMatch || descMatch || tagsMatch;
  });
}

/**
 * Get available versions of a skill
 * 
 * @param {string} source - Source identifier ('global' or absolute path)
 * @param {string} skillName - Name of the skill
 * @returns {Promise<Array<string>>} Array of available version strings
 */
export async function getSkillVersions(source, skillName) {
  const sourcePath = source === 'global' ? getGlobalSkillsPath() : source;
  const skillPath = path.join(sourcePath, skillName);
  
  // For now, just return the current version
  // In the future, this could support multiple versions in subdirectories
  try {
    const metadata = await loadSkillMetadata(skillPath);
    return [metadata.version];
  } catch (error) {
    return [];
  }
}

/**
 * Validate skill structure and contents
 * 
 * @param {string} skillPath - Absolute path to skill directory
 * @returns {Promise<Object>} Validation result with valid flag and errors array
 */
export async function validateSkillStructure(skillPath) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };
  
  // Check if directory exists
  try {
    const stats = await fs.promises.stat(skillPath);
    if (!stats.isDirectory()) {
      result.valid = false;
      result.errors.push('Skill path is not a directory');
      return result;
    }
  } catch (error) {
    result.valid = false;
    result.errors.push(`Skill directory not found: ${skillPath}`);
    return result;
  }
  
  // Check for required files
  const requiredFiles = ['metadata.json', 'README.md'];
  for (const file of requiredFiles) {
    const filePath = path.join(skillPath, file);
    try {
      await fs.promises.access(filePath);
    } catch (error) {
      if (file === 'README.md') {
        result.warnings.push(`Missing ${file} (recommended)`);
      } else {
        result.valid = false;
        result.errors.push(`Missing required file: ${file}`);
      }
    }
  }
  
  // Validate metadata.json
  try {
    const metadata = await loadSkillMetadata(skillPath);
    
    // Check for recommended fields
    const recommendedFields = ['author', 'tags', 'dependencies'];
    for (const field of recommendedFields) {
      if (!metadata[field]) {
        result.warnings.push(`Missing recommended field in metadata: ${field}`);
      }
    }
    
    // Validate version format
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
    if (!semverRegex.test(metadata.version)) {
      result.warnings.push('Version should follow semantic versioning (X.Y.Z)');
    }
  } catch (error) {
    result.valid = false;
    result.errors.push(`Invalid metadata: ${error.message}`);
  }
  
  return result;
}

/**
 * Copy skill files to project directory
 * 
 * @param {string} sourceSkillPath - Source skill directory
 * @param {string} targetSkillPath - Target skill directory in project
 * @returns {Promise<Array<string>>} Array of copied file paths
 */
export async function copySkillFiles(sourceSkillPath, targetSkillPath) {
  const copiedFiles = [];
  
  // Create target directory
  await fs.promises.mkdir(targetSkillPath, { recursive: true });
  
  // Read source directory
  const entries = await fs.promises.readdir(sourceSkillPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const sourcePath = path.join(sourceSkillPath, entry.name);
    const targetPath = path.join(targetSkillPath, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      const subFiles = await copySkillFiles(sourcePath, targetPath);
      copiedFiles.push(...subFiles);
    } else {
      // Copy file
      await fs.promises.copyFile(sourcePath, targetPath);
      copiedFiles.push(targetPath);
    }
  }
  
  return copiedFiles;
}

/**
 * Get skill import summary for display
 * 
 * @param {Object} skill - Skill metadata object
 * @param {Object} options - Import options
 * @returns {Object} Summary object for display
 */
export function getSkillImportSummary(skill, options = {}) {
  return {
    name: skill.name,
    version: skill.version,
    description: skill.description,
    source: options.source || 'global',
    author: skill.author || 'Unknown',
    dependencies: skill.dependencies || [],
    tags: skill.tags || [],
    override: options.override || false
  };
}

