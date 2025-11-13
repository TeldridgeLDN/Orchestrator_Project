/**
 * Claude Project Current Command
 * 
 * Displays information about the currently active Claude project.
 * 
 * @module commands/current
 * @version 1.0.0
 */

import path from 'path';
import { promises as fs } from 'fs';
import chalk from 'chalk';
import { getActiveProject } from '../utils/config.js';
import { createCommandErrorHandler, wrapError } from '../utils/errors/index.js';

/**
 * Read project metadata
 * 
 * @param {string} projectPath - Path to project
 * @returns {Promise<Object|null>} Metadata object or null
 */
async function readProjectMetadata(projectPath) {
  try {
    const metadataPath = path.join(projectPath, '.claude', 'metadata.json');
    const content = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Get project health score
 * 
 * @param {string} projectPath - Path to project
 * @returns {Promise<number|null>} Health score or null
 */
async function getProjectHealthScore(projectPath) {
  try {
    const metadataPath = path.join(projectPath, '.claude', 'metadata.json');
    const content = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(content);
    return metadata.health_score || null;
  } catch (error) {
    return null;
  }
}

/**
 * Count scenarios in project
 * 
 * @param {string} projectPath - Path to project
 * @returns {Promise<number>} Number of scenarios
 */
async function countScenarios(projectPath) {
  try {
    const scenariosPath = path.join(projectPath, '.claude', 'scenarios');
    const files = await fs.readdir(scenariosPath);
    return files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml')).length;
  } catch (error) {
    return 0;
  }
}

/**
 * Count skills in project
 * 
 * @param {string} projectPath - Path to project
 * @returns {Promise<number>} Number of skills
 */
async function countSkills(projectPath) {
  try {
    const skillsPath = path.join(projectPath, '.claude', 'skills');
    const entries = await fs.readdir(skillsPath, { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).length;
  } catch (error) {
    return 0;
  }
}

/**
 * Check if TaskMaster is initialized
 * 
 * @param {string} projectPath - Path to project
 * @returns {Promise<boolean>} True if TaskMaster exists
 */
async function hasTaskMaster(projectPath) {
  try {
    const tasksPath = path.join(projectPath, '.taskmaster', 'tasks', 'tasks.json');
    await fs.access(tasksPath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get TaskMaster statistics
 * 
 * @param {string} projectPath - Path to project
 * @returns {Promise<Object|null>} Task statistics or null
 */
async function getTaskMasterStats(projectPath) {
  try {
    const tasksPath = path.join(projectPath, '.taskmaster', 'tasks', 'tasks.json');
    const content = await fs.readFile(tasksPath, 'utf-8');
    const data = JSON.parse(content);
    
    // Get first tag (usually 'master')
    const tags = Object.keys(data.tags || {});
    if (tags.length === 0) return null;
    
    const firstTag = tags[0];
    const tasks = data.tags[firstTag] || [];
    
    const stats = {
      total: tasks.length,
      done: tasks.filter(t => t.status === 'done').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      pending: tasks.filter(t => t.status === 'pending').length
    };
    
    return stats;
  } catch (error) {
    return null;
  }
}

/**
 * Format project information for display
 * 
 * @param {Object} projectData - Project data
 * @param {boolean} verbose - Show detailed information
 */
function displayProjectInfo(projectData, verbose = false) {
  const { name, info, metadata, health, scenarios, skills, taskmaster, taskStats } = projectData;
  
  console.log(chalk.bold('\n📁 Current Project'));
  console.log('─'.repeat(60));
  
  // Basic info
  console.log(`${chalk.bold('Name:')} ${chalk.cyan(name)}`);
  console.log(`${chalk.bold('Path:')} ${info.path}`);
  
  if (metadata) {
    if (metadata.description) {
      console.log(`${chalk.bold('Description:')} ${metadata.description}`);
    }
    if (metadata.version) {
      console.log(`${chalk.bold('Version:')} ${metadata.version}`);
    }
    if (metadata.created) {
      const createdDate = new Date(metadata.created);
      console.log(`${chalk.bold('Created:')} ${createdDate.toLocaleDateString()}`);
    }
  }
  
  if (info.last_active) {
    const lastActive = new Date(info.last_active);
    console.log(`${chalk.bold('Last Active:')} ${lastActive.toLocaleString()}`);
  }
  
  // Health score
  if (health !== null) {
    const healthColor = health >= 80 ? chalk.green : health >= 60 ? chalk.yellow : chalk.red;
    console.log(`${chalk.bold('Health Score:')} ${healthColor(health + '%')}`);
  }
  
  console.log('─'.repeat(60));
  
  // Resources
  console.log(chalk.bold('\n📦 Resources'));
  console.log(`  Scenarios: ${scenarios}`);
  console.log(`  Skills: ${skills}`);
  
  // TaskMaster info
  if (taskmaster) {
    console.log(chalk.bold('\n✅ TaskMaster Status'));
    if (taskStats) {
      const completionPercent = taskStats.total > 0 
        ? Math.round((taskStats.done / taskStats.total) * 100) 
        : 0;
      console.log(`  Total Tasks: ${taskStats.total}`);
      console.log(`  Completed: ${chalk.green(taskStats.done)}`);
      console.log(`  In Progress: ${chalk.yellow(taskStats.inProgress)}`);
      console.log(`  Pending: ${chalk.dim(taskStats.pending)}`);
      console.log(`  Progress: ${completionPercent}%`);
    } else {
      console.log(`  ${chalk.green('Enabled')}`);
    }
  } else {
    console.log(chalk.bold('\n✅ TaskMaster Status'));
    console.log(`  ${chalk.dim('Not initialized')}`);
  }
  
  // Verbose details
  if (verbose && metadata) {
    console.log(chalk.bold('\n🔧 Configuration'));
    if (metadata.tags && metadata.tags.length > 0) {
      console.log(`  Tags: ${metadata.tags.join(', ')}`);
    }
    if (metadata.settings) {
      console.log(`  Auto-validate: ${metadata.settings.auto_validate ? 'Yes' : 'No'}`);
      console.log(`  Health tracking: ${metadata.settings.health_tracking ? 'Yes' : 'No'}`);
    }
    if (metadata.diet103_version) {
      console.log(`  diet103 version: ${metadata.diet103_version}`);
    }
  }
  
  console.log('─'.repeat(60) + '\n');
}

/**
 * Format project information as JSON
 * 
 * @param {Object} projectData - Project data
 * @returns {Object} JSON-formatted project data
 */
function formatAsJson(projectData) {
  const { name, info, metadata, health, scenarios, skills, taskmaster, taskStats } = projectData;
  
  return {
    name,
    path: info.path,
    description: metadata?.description,
    version: metadata?.version,
    created: metadata?.created,
    lastActive: info.last_active,
    healthScore: health,
    resources: {
      scenarios,
      skills
    },
    taskmaster: {
      enabled: taskmaster,
      stats: taskStats
    },
    metadata: metadata || {}
  };
}

/**
 * Current project command handler
 * 
 * @param {Object} options - Command options
 */
export async function currentCommand(options = {}) {
  const handleError = createCommandErrorHandler({
    commandName: 'current',
    verbose: options.verbose || false,
    exitCode: 1
  });

  try {
    const verbose = options.verbose || false;
    const json = options.json || false;
    
    // Get active project
    const activeProject = await getActiveProject();
    
    if (!activeProject) {
      if (json) {
        console.log(JSON.stringify({ error: 'No active project' }, null, 2));
      } else {
        console.log(chalk.yellow('\n⚠️  No active project'));
        console.log(chalk.dim('   Use '), chalk.cyan('diet103 project switch <name>'), chalk.dim(' to activate a project'));
        console.log(chalk.dim('   Or '), chalk.cyan('diet103 init'), chalk.dim(' to create a new project\n'));
      }
      process.exit(1);
    }
    
    const { name, info } = activeProject;
    const projectPath = info.path;
    
    // Gather project information
    const metadata = await readProjectMetadata(projectPath);
    const health = await getProjectHealthScore(projectPath);
    const scenarios = await countScenarios(projectPath);
    const skills = await countSkills(projectPath);
    const taskmaster = await hasTaskMaster(projectPath);
    const taskStats = taskmaster ? await getTaskMasterStats(projectPath) : null;
    
    const projectData = {
      name,
      info,
      metadata,
      health,
      scenarios,
      skills,
      taskmaster,
      taskStats
    };
    
    // Output
    if (json) {
      console.log(JSON.stringify(formatAsJson(projectData), null, 2));
    } else {
      displayProjectInfo(projectData, verbose);
    }
    
    process.exit(0);
    
  } catch (error) {
    const wrappedError = error.code ? error : wrapError(error, 'CMD-PROJ-007', { 
      operation: 'get-current-project' 
    });
    await handleError(wrappedError);
  }
}

