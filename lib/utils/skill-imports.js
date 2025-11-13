/**
 * @fileoverview Skill Import Management Utilities
 * @module lib/utils/skill-imports
 * 
 * Provides utilities for managing skill imports in metadata.json:
 * - Adding import entries
 * - Updating import entries
 * - Removing import entries
 * - Querying imported skills
 * - Validating import structures
 * 
 * @see {@link https://github.com/diet103/orchestrator|Diet103 Orchestrator}
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load project metadata from .claude/metadata.json
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Object>} Parsed metadata object
 * @throws {Error} If metadata file not found or invalid JSON
 */
export async function loadProjectMetadata(projectPath) {
  const metadataPath = path.join(projectPath, '.claude', 'metadata.json');
  
  try {
    const content = await fs.promises.readFile(metadataPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`metadata.json not found at ${metadataPath}`);
    }
    throw new Error(`Failed to load metadata.json: ${error.message}`);
  }
}

/**
 * Save project metadata to .claude/metadata.json
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {Object} metadata - Metadata object to save
 * @returns {Promise<void>}
 * @throws {Error} If unable to write metadata file
 */
export async function saveProjectMetadata(projectPath, metadata) {
  const metadataPath = path.join(projectPath, '.claude', 'metadata.json');
  
  try {
    await fs.promises.writeFile(
      metadataPath,
      JSON.stringify(metadata, null, 2),
      'utf8'
    );
  } catch (error) {
    throw new Error(`Failed to save metadata.json: ${error.message}`);
  }
}

/**
 * Initialize imports section in metadata if not present
 * 
 * @param {Object} metadata - Metadata object
 * @returns {Object} Metadata with imports section
 */
export function ensureImportsSection(metadata) {
  if (!metadata.imports) {
    metadata.imports = { skills: [] };
  }
  if (!Array.isArray(metadata.imports.skills)) {
    metadata.imports.skills = [];
  }
  return metadata;
}

/**
 * Get all imported skills from metadata
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Array>} Array of skill import objects
 */
export async function getImportedSkills(projectPath) {
  const metadata = await loadProjectMetadata(projectPath);
  return metadata.imports?.skills || [];
}

/**
 * Get a specific imported skill by name
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {string} skillName - Name of the skill to find
 * @returns {Promise<Object|null>} Skill import object or null if not found
 */
export async function getImportedSkill(projectPath, skillName) {
  const skills = await getImportedSkills(projectPath);
  return skills.find(s => s.name === skillName) || null;
}

/**
 * Check if a skill is already imported
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {string} skillName - Name of the skill to check
 * @returns {Promise<boolean>} True if skill is imported
 */
export async function isSkillImported(projectPath, skillName) {
  const skill = await getImportedSkill(projectPath, skillName);
  return skill !== null;
}

/**
 * Add a skill import entry to metadata
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {Object} skillImport - Skill import object
 * @param {string} skillImport.name - Skill name
 * @param {string} skillImport.source - Source path or 'global'
 * @param {string} skillImport.version - Version string (semver)
 * @param {boolean} [skillImport.override=false] - Whether to override existing
 * @param {Array<string>} [skillImport.dependencies=[]] - Dependency skill names
 * @returns {Promise<Object>} Updated metadata
 * @throws {Error} If skill already imported and override is false
 */
export async function addSkillImport(projectPath, skillImport) {
  const metadata = await loadProjectMetadata(projectPath);
  ensureImportsSection(metadata);

  // Validate required fields
  const requiredFields = ['name', 'source', 'version'];
  for (const field of requiredFields) {
    if (!skillImport[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Check if skill already imported
  const existingIndex = metadata.imports.skills.findIndex(
    s => s.name === skillImport.name
  );

  const importEntry = {
    name: skillImport.name,
    source: skillImport.source,
    version: skillImport.version,
    importedAt: skillImport.importedAt || new Date().toISOString(),
    override: skillImport.override || false,
    dependencies: skillImport.dependencies || []
  };

  if (existingIndex >= 0) {
    // Replace existing import
    metadata.imports.skills[existingIndex] = importEntry;
  } else {
    // Add new import
    metadata.imports.skills.push(importEntry);
  }

  await saveProjectMetadata(projectPath, metadata);
  return metadata;
}

/**
 * Update a skill import entry in metadata
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {string} skillName - Name of the skill to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated metadata
 * @throws {Error} If skill not found
 */
export async function updateSkillImport(projectPath, skillName, updates) {
  const metadata = await loadProjectMetadata(projectPath);
  ensureImportsSection(metadata);

  const existingIndex = metadata.imports.skills.findIndex(
    s => s.name === skillName
  );

  if (existingIndex < 0) {
    throw new Error(`Skill import not found: ${skillName}`);
  }

  // Merge updates into existing import
  metadata.imports.skills[existingIndex] = {
    ...metadata.imports.skills[existingIndex],
    ...updates
  };

  await saveProjectMetadata(projectPath, metadata);
  return metadata;
}

/**
 * Remove a skill import entry from metadata
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {string} skillName - Name of the skill to remove
 * @returns {Promise<Object>} Updated metadata
 * @throws {Error} If skill not found
 */
export async function removeSkillImport(projectPath, skillName) {
  const metadata = await loadProjectMetadata(projectPath);
  ensureImportsSection(metadata);

  const existingIndex = metadata.imports.skills.findIndex(
    s => s.name === skillName
  );

  if (existingIndex < 0) {
    throw new Error(`Skill import not found: ${skillName}`);
  }

  // Remove the import
  metadata.imports.skills.splice(existingIndex, 1);

  await saveProjectMetadata(projectPath, metadata);
  return metadata;
}

/**
 * Get all dependencies for an imported skill
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {string} skillName - Name of the skill
 * @returns {Promise<Array<string>>} Array of dependency skill names
 */
export async function getSkillDependencies(projectPath, skillName) {
  const skill = await getImportedSkill(projectPath, skillName);
  return skill?.dependencies || [];
}

/**
 * Get all skills that depend on a specific skill
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {string} skillName - Name of the skill to check
 * @returns {Promise<Array<string>>} Array of dependent skill names
 */
export async function getSkillDependents(projectPath, skillName) {
  const skills = await getImportedSkills(projectPath);
  return skills
    .filter(s => s.dependencies && s.dependencies.includes(skillName))
    .map(s => s.name);
}

/**
 * Validate skill import structure
 * 
 * @param {Object} skillImport - Skill import object to validate
 * @returns {Object} Validation result with valid flag and errors array
 */
export function validateSkillImport(skillImport) {
  const result = {
    valid: true,
    errors: []
  };

  // Required fields
  const requiredFields = ['name', 'source', 'version', 'importedAt'];
  requiredFields.forEach(field => {
    if (!skillImport[field]) {
      result.valid = false;
      result.errors.push(`Missing required field: ${field}`);
    } else if (typeof skillImport[field] !== 'string') {
      result.valid = false;
      result.errors.push(`Field ${field} must be a string`);
    }
  });

  // Validate version format (semver)
  if (skillImport.version) {
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
    if (!semverRegex.test(skillImport.version)) {
      result.valid = false;
      result.errors.push('Version must be semantic versioning format (X.Y.Z)');
    }
  }

  // Validate importedAt format (ISO 8601)
  if (skillImport.importedAt) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    if (!dateRegex.test(skillImport.importedAt)) {
      result.valid = false;
      result.errors.push('importedAt must be ISO 8601 format');
    }
  }

  // Validate override field
  if ('override' in skillImport && typeof skillImport.override !== 'boolean') {
    result.valid = false;
    result.errors.push('override must be a boolean');
  }

  // Validate dependencies field
  if ('dependencies' in skillImport) {
    if (!Array.isArray(skillImport.dependencies)) {
      result.valid = false;
      result.errors.push('dependencies must be an array');
    } else {
      skillImport.dependencies.forEach((dep, index) => {
        if (typeof dep !== 'string') {
          result.valid = false;
          result.errors.push(`dependencies[${index}] must be a string`);
        }
      });
    }
  }

  return result;
}

/**
 * Get skill import statistics
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Object>} Statistics object
 */
export async function getImportStatistics(projectPath) {
  const skills = await getImportedSkills(projectPath);
  
  const stats = {
    total: skills.length,
    bySource: {},
    withOverrides: 0,
    withDependencies: 0,
    totalDependencies: 0
  };

  skills.forEach(skill => {
    // Count by source
    stats.bySource[skill.source] = (stats.bySource[skill.source] || 0) + 1;
    
    // Count overrides
    if (skill.override) {
      stats.withOverrides++;
    }
    
    // Count dependencies
    if (skill.dependencies && skill.dependencies.length > 0) {
      stats.withDependencies++;
      stats.totalDependencies += skill.dependencies.length;
    }
  });

  return stats;
}

/**
 * Toggle override flag for a skill import
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {string} skillName - Name of the skill
 * @param {boolean} [override] - Override value (if undefined, toggles current)
 * @returns {Promise<Object>} Updated metadata
 */
export async function toggleSkillOverride(projectPath, skillName, override) {
  const metadata = await loadProjectMetadata(projectPath);
  ensureImportsSection(metadata);

  const skill = metadata.imports.skills.find(s => s.name === skillName);
  if (!skill) {
    throw new Error(`Skill import not found: ${skillName}`);
  }

  // Toggle or set override flag
  skill.override = override !== undefined ? override : !skill.override;
  skill.overriddenAt = skill.override ? new Date().toISOString() : null;

  await saveProjectMetadata(projectPath, metadata);
  return metadata;
}

/**
 * Check if a skill import is marked as overridden
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {string} skillName - Name of the skill
 * @returns {Promise<boolean>} True if skill is overridden
 */
export async function isSkillOverridden(projectPath, skillName) {
  const skill = await getImportedSkill(projectPath, skillName);
  return skill ? skill.override === true : false;
}

/**
 * Get all overridden skills
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Array<Object>>} Array of overridden skill imports
 */
export async function getOverriddenSkills(projectPath) {
  const skills = await getImportedSkills(projectPath);
  return skills.filter(s => s.override === true);
}

/**
 * Lock skill to specific version (pin version)
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {string} skillName - Name of the skill
 * @param {string} [version] - Version to lock to (defaults to current)
 * @returns {Promise<Object>} Updated metadata
 */
export async function lockSkillVersion(projectPath, skillName, version) {
  const metadata = await loadProjectMetadata(projectPath);
  ensureImportsSection(metadata);

  const skill = metadata.imports.skills.find(s => s.name === skillName);
  if (!skill) {
    throw new Error(`Skill import not found: ${skillName}`);
  }

  // Update version and add lock flag
  if (version) {
    skill.version = version;
  }
  skill.versionLocked = true;
  skill.lockedAt = new Date().toISOString();

  await saveProjectMetadata(projectPath, metadata);
  return metadata;
}

/**
 * Unlock skill version
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {string} skillName - Name of the skill
 * @returns {Promise<Object>} Updated metadata
 */
export async function unlockSkillVersion(projectPath, skillName) {
  const metadata = await loadProjectMetadata(projectPath);
  ensureImportsSection(metadata);

  const skill = metadata.imports.skills.find(s => s.name === skillName);
  if (!skill) {
    throw new Error(`Skill import not found: ${skillName}`);
  }

  // Remove lock flag
  skill.versionLocked = false;
  skill.lockedAt = null;

  await saveProjectMetadata(projectPath, metadata);
  return metadata;
}

/**
 * Check if a skill version is locked
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {string} skillName - Name of the skill
 * @returns {Promise<boolean>} True if version is locked
 */
export async function isSkillVersionLocked(projectPath, skillName) {
  const skill = await getImportedSkill(projectPath, skillName);
  return skill ? skill.versionLocked === true : false;
}

/**
 * Lock all skill versions
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Object>} Updated metadata with lock count
 */
export async function lockAllSkillVersions(projectPath) {
  const metadata = await loadProjectMetadata(projectPath);
  ensureImportsSection(metadata);

  const lockedAt = new Date().toISOString();
  let lockCount = 0;

  metadata.imports.skills.forEach(skill => {
    if (!skill.versionLocked) {
      skill.versionLocked = true;
      skill.lockedAt = lockedAt;
      lockCount++;
    }
  });

  await saveProjectMetadata(projectPath, metadata);
  
  return {
    metadata,
    lockCount,
    totalSkills: metadata.imports.skills.length
  };
}

