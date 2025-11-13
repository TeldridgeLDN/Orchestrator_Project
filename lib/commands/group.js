/**
 * Group Management Commands
 * @module commands/group
 * 
 * Provides CLI commands for managing project groups:
 * - create: Create new project groups
 * - list: List all groups
 * - show: Show group details
 * - update: Update group properties
 * - delete: Delete a group
 * - add-project: Add a project to a group
 * - remove-project: Remove a project from a group
 * - switch: Switch to a group context
 * - apply-config: Apply group configuration to projects
 */

import chalk from 'chalk';
import {
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
  applyGroupConfigToAllProjects
} from '../utils/config.js';
import { wrapError } from '../utils/errors/index.js';

/**
 * Create a new project group
 * @param {Object} options - Command options
 * @param {string} options.name - Name of the group
 * @param {string} [options.description] - Group description
 * @returns {Promise<void>}
 */
export async function createGroupCommand(options) {
  try {
    const { name, description = '' } = options;
    
    if (!name) {
      throw new Error('Group name is required');
    }
    
    const group = await createGroup(name, { description });
    
    console.log(chalk.green('✓ Group created successfully'));
    console.log();
    console.log(chalk.bold('Name:'), group.name);
    console.log(chalk.bold('Description:'), group.description || chalk.dim('(none)'));
    console.log(chalk.bold('Created:'), new Date(group.createdAt).toLocaleString());
    console.log(chalk.bold('Projects:'), group.projects.length);
  } catch (error) {
    const wrapped = wrapError(error, 'CMD-GROUP-001');
    console.error(chalk.red('✗'), wrapped.userMessage);
    throw wrapped;
  }
}

/**
 * List all project groups
 * @param {Object} options - Command options
 * @param {boolean} [options.verbose] - Show detailed information
 * @returns {Promise<void>}
 */
export async function listGroupsCommand(options = {}) {
  try {
    const groups = await listGroups();
    
    if (groups.length === 0) {
      console.log(chalk.yellow('No groups found'));
      console.log(chalk.dim('Create a group with: claude group create <name>'));
      return;
    }
    
    console.log(chalk.bold(`\n${groups.length} group(s) found:\n`));
    
    for (const group of groups) {
      const activeMarker = group.isActive ? chalk.green('● ') : '  ';
      console.log(`${activeMarker}${chalk.bold(group.name)}`);
      
      if (options.verbose) {
        if (group.description) {
          console.log(`  ${chalk.dim('Description:')} ${group.description}`);
        }
        console.log(`  ${chalk.dim('Projects:')} ${group.projects.length}`);
        console.log(`  ${chalk.dim('Created:')} ${new Date(group.createdAt).toLocaleDateString()}`);
        
        if (group.projects.length > 0) {
          console.log(`  ${chalk.dim('Members:')}`);
          for (const projectName of group.projects) {
            console.log(`    - ${projectName}`);
          }
        }
        console.log();
      }
    }
    
    if (!options.verbose && groups.length > 0) {
      console.log(chalk.dim('\nUse --verbose for more details'));
    }
  } catch (error) {
    const wrapped = wrapError(error, 'CMD-GROUP-002');
    console.error(chalk.red('✗'), wrapped.userMessage);
    throw wrapped;
  }
}

/**
 * Show details for a specific group
 * @param {Object} options - Command options
 * @param {string} options.name - Name of the group
 * @returns {Promise<void>}
 */
export async function showGroupCommand(options) {
  try {
    const { name } = options;
    
    if (!name) {
      throw new Error('Group name is required');
    }
    
    const group = await getGroup(name);
    const projects = await getGroupProjects(name);
    
    console.log();
    console.log(chalk.bold.underline(group.name));
    console.log();
    console.log(chalk.bold('Description:'), group.description || chalk.dim('(none)'));
    console.log(chalk.bold('Created:'), new Date(group.createdAt).toLocaleString());
    if (group.updatedAt) {
      console.log(chalk.bold('Updated:'), new Date(group.updatedAt).toLocaleString());
    }
    console.log();
    console.log(chalk.bold('Projects:'), projects.length);
    
    if (projects.length > 0) {
      console.log();
      for (const project of projects) {
        console.log(`  ${chalk.cyan('●')} ${chalk.bold(project.name)}`);
        console.log(`    ${chalk.dim(project.info.path)}`);
      }
    }
    
    console.log();
    console.log(chalk.bold('Shared Configuration:'));
    
    if (group.sharedConfig?.skills && group.sharedConfig.skills.length > 0) {
      console.log(`  ${chalk.dim('Skills:')} ${group.sharedConfig.skills.join(', ')}`);
    } else {
      console.log(`  ${chalk.dim('Skills:')} ${chalk.dim('(none)')}`);
    }
    
    if (group.sharedConfig?.hooks && Object.keys(group.sharedConfig.hooks).length > 0) {
      console.log(`  ${chalk.dim('Hooks:')} ${Object.keys(group.sharedConfig.hooks).join(', ')}`);
    } else {
      console.log(`  ${chalk.dim('Hooks:')} ${chalk.dim('(none)')}`);
    }
    console.log();
  } catch (error) {
    const wrapped = wrapError(error, 'CMD-GROUP-002');
    console.error(chalk.red('✗'), wrapped.userMessage);
    throw wrapped;
  }
}

/**
 * Update a group's properties
 * @param {Object} options - Command options
 * @param {string} options.name - Name of the group
 * @param {string} [options.description] - New description
 * @returns {Promise<void>}
 */
export async function updateGroupCommand(options) {
  try {
    const { name, description } = options;
    
    if (!name) {
      throw new Error('Group name is required');
    }
    
    const updates = {};
    if (description !== undefined) {
      updates.description = description;
    }
    
    if (Object.keys(updates).length === 0) {
      console.log(chalk.yellow('No updates specified'));
      return;
    }
    
    const group = await updateGroup(name, updates);
    
    console.log(chalk.green('✓ Group updated successfully'));
    console.log();
    console.log(chalk.bold('Name:'), group.name);
    console.log(chalk.bold('Description:'), group.description);
  } catch (error) {
    const wrapped = wrapError(error, 'CMD-GROUP-002');
    console.error(chalk.red('✗'), wrapped.userMessage);
    throw wrapped;
  }
}

/**
 * Delete a project group
 * @param {Object} options - Command options
 * @param {string} options.name - Name of the group
 * @param {boolean} [options.force] - Force deletion even if group has projects
 * @returns {Promise<void>}
 */
export async function deleteGroupCommand(options) {
  try {
    const { name, force = false } = options;
    
    if (!name) {
      throw new Error('Group name is required');
    }
    
    await deleteGroup(name, force);
    
    console.log(chalk.green('✓ Group deleted successfully'));
  } catch (error) {
    const wrapped = wrapError(error, 'CMD-GROUP-003');
    console.error(chalk.red('✗'), wrapped.userMessage);
    throw wrapped;
  }
}

/**
 * Add a project to a group
 * @param {Object} options - Command options
 * @param {string} options.project - Name of the project
 * @param {string} options.group - Name of the group
 * @returns {Promise<void>}
 */
export async function addProjectCommand(options) {
  try {
    const { project, group } = options;
    
    if (!project) {
      throw new Error('Project name is required');
    }
    
    if (!group) {
      throw new Error('Group name is required');
    }
    
    const updatedGroup = await addProjectToGroup(project, group);
    
    console.log(chalk.green('✓ Project added to group'));
    console.log();
    console.log(chalk.bold('Project:'), project);
    console.log(chalk.bold('Group:'), group);
    console.log(chalk.bold('Total projects in group:'), updatedGroup.projects.length);
  } catch (error) {
    const wrapped = wrapError(error, 'CMD-GROUP-004');
    console.error(chalk.red('✗'), wrapped.userMessage);
    throw wrapped;
  }
}

/**
 * Remove a project from a group
 * @param {Object} options - Command options
 * @param {string} options.project - Name of the project
 * @param {string} options.group - Name of the group
 * @returns {Promise<void>}
 */
export async function removeProjectCommand(options) {
  try {
    const { project, group } = options;
    
    if (!project) {
      throw new Error('Project name is required');
    }
    
    if (!group) {
      throw new Error('Group name is required');
    }
    
    const updatedGroup = await removeProjectFromGroup(project, group);
    
    console.log(chalk.green('✓ Project removed from group'));
    console.log();
    console.log(chalk.bold('Project:'), project);
    console.log(chalk.bold('Group:'), group);
    console.log(chalk.bold('Remaining projects in group:'), updatedGroup.projects.length);
  } catch (error) {
    const wrapped = wrapError(error, 'CMD-GROUP-005');
    console.error(chalk.red('✗'), wrapped.userMessage);
    throw wrapped;
  }
}

/**
 * Switch to a group context
 * @param {Object} options - Command options
 * @param {string} options.name - Name of the group
 * @returns {Promise<void>}
 */
export async function switchGroupCommand(options) {
  try {
    const { name } = options;
    
    if (!name) {
      throw new Error('Group name is required');
    }
    
    await setActiveGroup(name);
    
    const group = await getGroup(name);
    
    console.log(chalk.green('✓ Switched to group:'), chalk.bold(group.name));
    console.log();
    console.log(chalk.dim('Projects in this group:'));
    for (const projectName of group.projects) {
      console.log(`  ${chalk.cyan('●')} ${projectName}`);
    }
  } catch (error) {
    const wrapped = wrapError(error, 'CMD-GROUP-002');
    console.error(chalk.red('✗'), wrapped.userMessage);
    throw wrapped;
  }
}

/**
 * Apply group configuration to all projects
 * @param {Object} options - Command options
 * @param {string} options.name - Name of the group
 * @returns {Promise<void>}
 */
export async function applyConfigCommand(options) {
  try {
    const { name } = options;
    
    if (!name) {
      throw new Error('Group name is required');
    }
    
    console.log(chalk.dim('Applying configuration to all projects...'));
    
    const results = await applyGroupConfigToAllProjects(name);
    
    console.log();
    console.log(chalk.green('✓ Configuration applied'));
    console.log();
    
    const successful = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);
    
    console.log(chalk.bold('Results:'));
    console.log(`  ${chalk.green('✓')} Successful: ${successful.length}`);
    if (failed.length > 0) {
      console.log(`  ${chalk.red('✗')} Failed: ${failed.length}`);
      console.log();
      console.log(chalk.bold('Failed projects:'));
      for (const result of failed) {
        console.log(`  ${chalk.red('✗')} ${result.projectName}: ${result.error}`);
      }
    }
  } catch (error) {
    const wrapped = wrapError(error, 'CMD-GROUP-002');
    console.error(chalk.red('✗'), wrapped.userMessage);
    throw wrapped;
  }
}

export default {
  createGroupCommand,
  listGroupsCommand,
  showGroupCommand,
  updateGroupCommand,
  deleteGroupCommand,
  addProjectCommand,
  removeProjectCommand,
  switchGroupCommand,
  applyConfigCommand
};


