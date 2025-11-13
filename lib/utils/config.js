/**
 * Configuration Management Utility
 * Handles reading, writing, and validating the global config.json file
 * Integrates with the config backup hook for safety
 * 
 * @module utils/config
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import os from 'os';
import { preConfigModification } from '../hooks/configBackup.js';
import {
  wrapError,
  createError,
  JSONParseError,
  ConfigValidationError
} from './errors/index.js';

const CONFIG_PATH = path.join(os.homedir(), '.claude', 'config.json');

/**
 * Default configuration structure
 */
const DEFAULT_CONFIG = {
  version: '1.0.0',
  active_project: null,
  projects: {},
  groups: {},
  active_group: null,
  settings: {
    auto_switch_on_directory_change: false,
    cache_last_active: true,
    validate_on_switch: true
  },
  features: {
    autoReloadContext: true
  }
};

/**
 * Reads the global configuration file
 * @returns {Promise<Object>} The configuration object
 */
export async function readConfig() {
  try {
    if (!existsSync(CONFIG_PATH)) {
      return { ...DEFAULT_CONFIG };
    }
    
    const content = await fs.readFile(CONFIG_PATH, 'utf-8');
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      // Config file exists but has invalid JSON
      throw wrapError(parseError, 'UTIL-DATA-001', { path: CONFIG_PATH });
    }
  } catch (error) {
    // For file read errors or parse errors, log warning and use defaults
    if (error instanceof JSONParseError) {
      console.warn(`⚠️  ${error.userMessage} - using defaults`);
    } else {
      const wrappedError = wrapError(error, 'UTIL-CFG-003', { path: CONFIG_PATH });
      console.warn(`⚠️  ${wrappedError.userMessage}`);
    }
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Writes the configuration to disk with automatic backup
 * @param {Object} config - The configuration object to write
 * @returns {Promise<void>}
 */
export async function writeConfig(config) {
  try {
    // Trigger the backup hook before writing
    try {
      await preConfigModification();
    } catch (backupError) {
      // Log warning but continue - backup failure shouldn't block write
      const wrappedError = wrapError(backupError, 'UTIL-CFG-005', { 
        reason: backupError.message 
      });
      console.warn(`⚠️  ${wrappedError.userMessage}`);
    }
    
    // Ensure the .claude directory exists
    const claudeDir = path.dirname(CONFIG_PATH);
    try {
      await fs.mkdir(claudeDir, { recursive: true });
    } catch (mkdirError) {
      throw wrapError(mkdirError, 'UTIL-FS-005', { path: claudeDir });
    }
    
    // Write config atomically (write to temp file, then rename)
    const tempPath = `${CONFIG_PATH}.tmp`;
    try {
      await fs.writeFile(tempPath, JSON.stringify(config, null, 2), 'utf-8');
      await fs.rename(tempPath, CONFIG_PATH);
    } catch (writeError) {
      throw wrapError(writeError, 'UTIL-CFG-004', { path: CONFIG_PATH });
    }
    
    console.debug('✅ Config saved successfully');
  } catch (error) {
    // Re-throw if already wrapped
    if (error.code) {
      throw error;
    }
    // Wrap unknown errors
    throw wrapError(error, 'UTIL-CFG-004', { path: CONFIG_PATH });
  }
}

/**
 * Updates a specific field in the configuration
 * @param {string} path - Dot-notation path to the field (e.g., 'settings.cache_last_active')
 * @param {*} value - The new value
 * @returns {Promise<void>}
 */
export async function updateConfigField(fieldPath, value) {
  const config = await readConfig();
  
  // Navigate to the field using dot notation
  const parts = fieldPath.split('.');
  let current = config;
  
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  
  current[parts[parts.length - 1]] = value;
  
  await writeConfig(config);
}

/**
 * Adds a project to the configuration
 * @param {string} projectName - The name of the project
 * @param {Object} projectInfo - The project information
 * @returns {Promise<void>}
 */
export async function addProject(projectName, projectInfo) {
  const config = await readConfig();
  
  if (config.projects[projectName]) {
    throw createError('CMD-PROJ-002', { name: projectName });
  }
  
  config.projects[projectName] = {
    ...projectInfo,
    created: new Date().toISOString(),
    last_active: new Date().toISOString()
  };
  
  // Set as active if no active project
  if (!config.active_project) {
    config.active_project = projectName;
  }
  
  await writeConfig(config);
}

/**
 * Removes a project from the configuration
 * @param {string} projectName - The name of the project to remove
 * @returns {Promise<void>}
 */
export async function removeProject(projectName) {
  const config = await readConfig();
  
  if (!config.projects[projectName]) {
    throw createError('CMD-PROJ-001', { name: projectName });
  }
  
  delete config.projects[projectName];
  
  // Clear active project if it was the removed one
  if (config.active_project === projectName) {
    // Set to most recently used project or null
    const projects = Object.entries(config.projects);
    if (projects.length > 0) {
      projects.sort((a, b) => 
        new Date(b[1].last_active) - new Date(a[1].last_active)
      );
      config.active_project = projects[0][0];
    } else {
      config.active_project = null;
    }
  }
  
  await writeConfig(config);
}

/**
 * Sets the active project
 * @param {string} projectName - The name of the project to activate
 * @returns {Promise<void>}
 */
export async function setActiveProject(projectName) {
  const config = await readConfig();
  
  if (!config.projects[projectName]) {
    throw createError('CMD-PROJ-001', { name: projectName });
  }
  
  config.active_project = projectName;
  config.projects[projectName].last_active = new Date().toISOString();
  
  await writeConfig(config);
}

/**
 * Gets the currently active project
 * @returns {Promise<{name: string, info: Object} | null>}
 */
export async function getActiveProject() {
  const config = await readConfig();
  
  if (!config.active_project || !config.projects[config.active_project]) {
    return null;
  }
  
  return {
    name: config.active_project,
    info: config.projects[config.active_project]
  };
}

/**
 * Lists all projects
 * @returns {Promise<Array<{name: string, info: Object}>>}
 */
export async function listProjects() {
  const config = await readConfig();
  
  return Object.entries(config.projects).map(([name, info]) => ({
    name,
    info,
    isActive: name === config.active_project
  }));
}

/**
 * Validates the configuration structure
 * @param {Object} config - The configuration to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
export function validateConfig(config) {
  const errors = [];
  
  if (!config.version) {
    errors.push('Missing version field');
  }
  
  if (typeof config.projects !== 'object') {
    errors.push('Projects field must be an object');
  }
  
  if (config.active_project && !config.projects[config.active_project]) {
    errors.push(`Active project '${config.active_project}' not found in projects`);
  }
  
  // Validate each project
  for (const [name, project] of Object.entries(config.projects || {})) {
    if (!project.path) {
      errors.push(`Project '${name}' missing required 'path' field`);
    }
    
    if (project.path && !path.isAbsolute(project.path)) {
      errors.push(`Project '${name}' path must be absolute`);
    }
  }
  
  // Validate groups structure if present
  if (config.groups !== undefined && typeof config.groups !== 'object') {
    errors.push('Groups field must be an object');
  }
  
  // Validate each group
  for (const [name, group] of Object.entries(config.groups || {})) {
    if (!group.name) {
      errors.push(`Group '${name}' missing required 'name' field`);
    }
    
    if (!Array.isArray(group.projects)) {
      errors.push(`Group '${name}' projects field must be an array`);
    }
    
    // Validate that all projects in the group exist
    for (const projectName of (group.projects || [])) {
      if (!config.projects[projectName]) {
        errors.push(`Group '${name}' references non-existent project '${projectName}'`);
      }
    }
    
    if (group.sharedConfig !== undefined && typeof group.sharedConfig !== 'object') {
      errors.push(`Group '${name}' sharedConfig must be an object`);
    }
  }
  
  // Validate active_group if present
  if (config.active_group && (!config.groups || !config.groups[config.active_group])) {
    errors.push(`Active group '${config.active_group}' not found in groups`);
  }
  
  if (errors.length > 0) {
    throw new ConfigValidationError(errors.join('; '));
  }
  
  return true;
}

/**
 * Initializes configuration if it doesn't exist
 * @returns {Promise<void>}
 */
export async function ensureConfig() {
  if (!existsSync(CONFIG_PATH)) {
    await writeConfig(DEFAULT_CONFIG);
    console.log('✨ Initialized new configuration file');
  }
}

/**
 * Creates a new project group
 * @param {string} groupName - The name of the group
 * @param {Object} options - Group options
 * @param {string} [options.description] - Description of the group
 * @param {Object} [options.sharedConfig] - Shared configuration for the group
 * @returns {Promise<Object>} The created group
 */
export async function createGroup(groupName, options = {}) {
  const { description = '', sharedConfig = {} } = options;
  const config = await readConfig();
  
  // Initialize groups if needed
  if (!config.groups) {
    config.groups = {};
  }
  
  // Check if group already exists
  if (config.groups[groupName]) {
    throw createError('CMD-GROUP-001', { name: groupName });
  }
  
  // Create new group
  config.groups[groupName] = {
    name: groupName,
    description,
    createdAt: new Date().toISOString(),
    projects: [],
    sharedConfig: {
      skills: sharedConfig.skills || [],
      hooks: sharedConfig.hooks || {},
      ...sharedConfig
    }
  };
  
  await writeConfig(config);
  
  return config.groups[groupName];
}

/**
 * Updates an existing project group
 * @param {string} groupName - The name of the group to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} The updated group
 */
export async function updateGroup(groupName, updates) {
  const config = await readConfig();
  
  if (!config.groups || !config.groups[groupName]) {
    throw createError('CMD-GROUP-002', { name: groupName });
  }
  
  // Update group properties (excluding projects array which has its own methods)
  const { projects, name, createdAt, ...allowedUpdates } = updates;
  
  config.groups[groupName] = {
    ...config.groups[groupName],
    ...allowedUpdates,
    updatedAt: new Date().toISOString()
  };
  
  await writeConfig(config);
  
  return config.groups[groupName];
}

/**
 * Deletes a project group
 * @param {string} groupName - The name of the group to delete
 * @param {boolean} force - Force deletion even if group has projects
 * @returns {Promise<void>}
 */
export async function deleteGroup(groupName, force = false) {
  const config = await readConfig();
  
  if (!config.groups || !config.groups[groupName]) {
    throw createError('CMD-GROUP-002', { name: groupName });
  }
  
  // Check if group has projects and force is not set
  if (config.groups[groupName].projects.length > 0 && !force) {
    throw createError('CMD-GROUP-003', { 
      name: groupName, 
      count: config.groups[groupName].projects.length 
    });
  }
  
  // Delete the group
  delete config.groups[groupName];
  
  // Clear active_group if it was the deleted one
  if (config.active_group === groupName) {
    config.active_group = null;
  }
  
  await writeConfig(config);
}

/**
 * Lists all project groups
 * @returns {Promise<Array<Object>>} Array of groups with metadata
 */
export async function listGroups() {
  const config = await readConfig();
  
  return Object.entries(config.groups || {}).map(([name, group]) => ({
    name,
    ...group,
    isActive: name === config.active_group
  }));
}

/**
 * Gets a specific group
 * @param {string} groupName - The name of the group
 * @returns {Promise<Object>} The group object
 */
export async function getGroup(groupName) {
  const config = await readConfig();
  
  if (!config.groups || !config.groups[groupName]) {
    throw createError('CMD-GROUP-002', { name: groupName });
  }
  
  return config.groups[groupName];
}

/**
 * Sets the active group
 * @param {string} groupName - The name of the group to activate
 * @returns {Promise<void>}
 */
export async function setActiveGroup(groupName) {
  const config = await readConfig();
  
  if (!config.groups || !config.groups[groupName]) {
    throw createError('CMD-GROUP-002', { name: groupName });
  }
  
  config.active_group = groupName;
  
  await writeConfig(config);
}

/**
 * Gets the currently active group
 * @returns {Promise<Object | null>} The active group or null
 */
export async function getActiveGroup() {
  const config = await readConfig();
  
  if (!config.active_group || !config.groups || !config.groups[config.active_group]) {
    return null;
  }
  
  return {
    name: config.active_group,
    ...config.groups[config.active_group]
  };
}

/**
 * Adds a project to a group
 * @param {string} projectName - The name of the project to add
 * @param {string} groupName - The name of the group
 * @returns {Promise<Object>} The updated group
 */
export async function addProjectToGroup(projectName, groupName) {
  const config = await readConfig();
  
  // Validate group exists
  if (!config.groups || !config.groups[groupName]) {
    throw createError('CMD-GROUP-002', { name: groupName });
  }
  
  // Validate project exists
  if (!config.projects[projectName]) {
    throw createError('CMD-PROJ-001', { name: projectName });
  }
  
  // Check if project is already in the group
  if (config.groups[groupName].projects.includes(projectName)) {
    throw createError('CMD-GROUP-004', { project: projectName, group: groupName });
  }
  
  // Add project to group
  config.groups[groupName].projects.push(projectName);
  config.groups[groupName].updatedAt = new Date().toISOString();
  
  await writeConfig(config);
  
  return config.groups[groupName];
}

/**
 * Removes a project from a group
 * @param {string} projectName - The name of the project to remove
 * @param {string} groupName - The name of the group
 * @returns {Promise<Object>} The updated group
 */
export async function removeProjectFromGroup(projectName, groupName) {
  const config = await readConfig();
  
  // Validate group exists
  if (!config.groups || !config.groups[groupName]) {
    throw createError('CMD-GROUP-002', { name: groupName });
  }
  
  // Check if project is in the group
  const projectIndex = config.groups[groupName].projects.indexOf(projectName);
  if (projectIndex === -1) {
    throw createError('CMD-GROUP-005', { project: projectName, group: groupName });
  }
  
  // Remove project from group
  config.groups[groupName].projects.splice(projectIndex, 1);
  config.groups[groupName].updatedAt = new Date().toISOString();
  
  await writeConfig(config);
  
  return config.groups[groupName];
}

/**
 * Gets all projects in a group
 * @param {string} groupName - The name of the group
 * @returns {Promise<Array<Object>>} Array of projects with their info
 */
export async function getGroupProjects(groupName) {
  const config = await readConfig();
  
  if (!config.groups || !config.groups[groupName]) {
    throw createError('CMD-GROUP-002', { name: groupName });
  }
  
  const projectNames = config.groups[groupName].projects;
  
  return projectNames.map(name => ({
    name,
    info: config.projects[name]
  }));
}

/**
 * Updates the shared configuration for a group
 * @param {string} groupName - The name of the group
 * @param {Object} sharedConfig - The shared configuration to set
 * @param {Array<string>} [sharedConfig.skills] - Shared skills for the group
 * @param {Object} [sharedConfig.hooks] - Shared hooks for the group
 * @returns {Promise<Object>} The updated group
 */
export async function updateGroupSharedConfig(groupName, sharedConfig) {
  const config = await readConfig();
  
  if (!config.groups || !config.groups[groupName]) {
    throw createError('CMD-GROUP-002', { name: groupName });
  }
  
  // Merge new sharedConfig with existing
  config.groups[groupName].sharedConfig = {
    ...config.groups[groupName].sharedConfig,
    ...sharedConfig
  };
  
  config.groups[groupName].updatedAt = new Date().toISOString();
  
  await writeConfig(config);
  
  return config.groups[groupName];
}

/**
 * Applies a group's shared configuration to a specific project
 * This updates the project's metadata.json with group-level settings
 * @param {string} projectName - The name of the project
 * @param {string} groupName - The name of the group
 * @returns {Promise<Object>} Result of the operation
 */
export async function applyGroupConfigToProject(projectName, groupName) {
  const config = await readConfig();
  
  // Validate group exists
  if (!config.groups || !config.groups[groupName]) {
    throw createError('CMD-GROUP-002', { name: groupName });
  }
  
  // Validate project exists
  if (!config.projects[projectName]) {
    throw createError('CMD-PROJ-001', { name: projectName });
  }
  
  const group = config.groups[groupName];
  const project = config.projects[projectName];
  
  // Store group reference in project
  if (!project.group) {
    project.group = groupName;
    project.updatedAt = new Date().toISOString();
    await writeConfig(config);
  }
  
  return {
    projectName,
    groupName,
    appliedConfig: group.sharedConfig,
    message: 'Group configuration applied to project'
  };
}

/**
 * Applies a group's shared configuration to all projects in the group
 * @param {string} groupName - The name of the group
 * @returns {Promise<Array<Object>>} Results for each project
 */
export async function applyGroupConfigToAllProjects(groupName) {
  const config = await readConfig();
  
  if (!config.groups || !config.groups[groupName]) {
    throw createError('CMD-GROUP-002', { name: groupName });
  }
  
  const group = config.groups[groupName];
  const results = [];
  
  for (const projectName of group.projects) {
    try {
      const result = await applyGroupConfigToProject(projectName, groupName);
      results.push(result);
    } catch (error) {
      results.push({
        projectName,
        error: error.message,
        success: false
      });
    }
  }
  
  return results;
}

/**
 * Gets the effective configuration for a project (project config merged with group config)
 * @param {string} projectName - The name of the project
 * @returns {Promise<Object>} The effective configuration
 */
export async function getProjectEffectiveConfig(projectName) {
  const config = await readConfig();
  
  if (!config.projects[projectName]) {
    throw createError('CMD-PROJ-001', { name: projectName });
  }
  
  const project = config.projects[projectName];
  const effectiveConfig = { ...project };
  
  // If project belongs to a group, merge group shared config
  if (project.group && config.groups && config.groups[project.group]) {
    const group = config.groups[project.group];
    effectiveConfig.sharedConfig = group.sharedConfig;
    effectiveConfig.groupName = project.group;
  }
  
  return effectiveConfig;
}

export default {
  readConfig,
  writeConfig,
  updateConfigField,
  addProject,
  removeProject,
  setActiveProject,
  getActiveProject,
  listProjects,
  validateConfig,
  ensureConfig,
  createGroup,
  updateGroup,
  deleteGroup,
  listGroups,
  getGroup,
  setActiveGroup,
  getActiveGroup,
  addProjectToGroup,
  removeProjectFromGroup,
  getGroupProjects,
  updateGroupSharedConfig,
  applyGroupConfigToProject,
  applyGroupConfigToAllProjects,
  getProjectEffectiveConfig
};

