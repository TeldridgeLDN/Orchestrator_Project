#!/usr/bin/env node

/**
 * Wake-Up Summary Display
 * 
 * Displays a comprehensive summary of active systems when the project starts.
 * Helps users understand what infrastructure is running and available.
 * 
 * Philosophy:
 * - Clear, actionable information
 * - Non-intrusive (can be silenced)
 * - Shows only what's relevant
 * - Highlights issues requiring attention
 * 
 * @module init/wake_up_summary
 * @version 1.0.0
 */

import chalk from 'chalk';
import path from 'path';

/**
 * Display wake-up summary
 * 
 * @param {Object} initResults - Results from all initialization hooks
 * @param {Object} options - Display options
 */
export function displayWakeUpSummary(initResults, options = {}) {
  const { projectRoot, projectName = 'Orchestrator_Project' } = options;
  
  console.log('');
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════'));
  console.log(chalk.bold.cyan('  🚀 Orchestrator Project Initialized'));
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════'));
  console.log('');
  
  // Project Info
  displayProjectInfo(projectName, projectRoot);
  
  // Systems Status
  displaySystemsStatus(initResults);
  
  // Quick Actions
  displayQuickActions(initResults);
  
  console.log('');
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════'));
  console.log('');
}

/**
 * Display project information
 * 
 * @param {string} projectName - Project name
 * @param {string} projectRoot - Project root path
 */
function displayProjectInfo(projectName, projectRoot) {
  console.log(chalk.dim('📁 Project:'), chalk.bold(projectName));
  console.log(chalk.dim('📍 Path:'), chalk.dim(projectRoot));
  console.log('');
}

/**
 * Display systems status
 * 
 * @param {Object} initResults - Initialization results
 */
function displaySystemsStatus(initResults) {
  console.log(chalk.bold('🎯 Active Systems:'));
  console.log('');
  
  // Primacy Rules
  if (initResults.primacyRules) {
    displayPrimacyRulesStatus(initResults.primacyRules);
  }
  
  // File Lifecycle
  if (initResults.fileLifecycle) {
    displayFileLifecycleStatus(initResults.fileLifecycle);
  }
  
  // TaskMaster
  if (initResults.taskmaster) {
    displayTaskMasterStatus(initResults.taskmaster);
  }
  
  // diet103 Skills
  if (initResults.skills) {
    displaySkillsStatus(initResults.skills);
  }
}

/**
 * Display primacy rules status
 * 
 * @param {Object} result - Primacy rules verification result
 */
function displayPrimacyRulesStatus(result) {
  const { stats, success } = result;
  
  if (success) {
    console.log(chalk.green('   ✓ Primacy Rules'), chalk.dim(`(${stats.ok}/${stats.total} active)`));
  } else {
    console.log(chalk.yellow('   ⚠ Primacy Rules'), chalk.dim(`(${stats.ok}/${stats.total} active)`));
    
    if (stats.missing > 0) {
      console.log(chalk.dim(`     → ${stats.missing} missing rules`));
    }
    
    if (stats.warnings > 0) {
      console.log(chalk.dim(`     → ${stats.warnings} warnings`));
    }
  }
}

/**
 * Display file lifecycle status
 * 
 * @param {Object} result - File lifecycle initialization result
 */
function displayFileLifecycleStatus(result) {
  if (result.success) {
    const { statistics } = result;
    console.log(chalk.green('   ✓ File Lifecycle'), chalk.dim(`(${statistics.total_files} files tracked)`));
    
    if (statistics.pending_archive > 0) {
      console.log(chalk.dim(`     → ${statistics.pending_archive} files pending archive`));
    }
  } else {
    console.log(chalk.red('   ✗ File Lifecycle'), chalk.dim('(initialization failed)'));
  }
}

/**
 * Display TaskMaster status
 * 
 * @param {Object} result - TaskMaster initialization result
 */
function displayTaskMasterStatus(result) {
  if (result.success) {
    if (result.skipped && result.skipped.length > 0) {
      console.log(chalk.dim('   → TaskMaster'), chalk.dim('(already configured)'));
    } else {
      console.log(chalk.green('   ✓ TaskMaster'), chalk.dim('(ready)'));
    }
    
    if (result.warnings && result.warnings.length > 0) {
      for (const warning of result.warnings) {
        console.log(chalk.yellow(`     ⚠ ${warning}`));
      }
    }
  } else {
    console.log(chalk.red('   ✗ TaskMaster'), chalk.dim('(initialization failed)'));
  }
}

/**
 * Display skills status
 * 
 * @param {Object} result - Skills priming result
 */
function displaySkillsStatus(result) {
  if (result.success && result.primedSkills && result.primedSkills.length > 0) {
    console.log(chalk.green('   ✓ diet103 Skills'), chalk.dim(`(${result.primedSkills.length} primed)`));
    console.log(chalk.dim(`     → Type: ${result.projectType}`));
  } else if (result.success) {
    console.log(chalk.dim('   → diet103 Skills'), chalk.dim('(none primed)'));
  } else {
    console.log(chalk.yellow('   ⚠ diet103 Skills'), chalk.dim('(priming skipped)'));
  }
}

/**
 * Display quick actions
 * 
 * @param {Object} initResults - Initialization results
 */
function displayQuickActions(initResults) {
  console.log('');
  console.log(chalk.bold('💡 Quick Actions:'));
  console.log('');
  
  const actions = [];
  
  // TaskMaster actions
  if (initResults.taskmaster?.success) {
    actions.push({
      command: 'task-master list',
      description: 'View all tasks'
    });
    actions.push({
      command: 'task-master next',
      description: 'Get next task to work on'
    });
  }
  
  // Primacy rules actions
  if (initResults.primacyRules && !initResults.primacyRules.success) {
    actions.push({
      command: 'npm run verify-rules',
      description: 'Check primacy rules integrity',
      priority: 'high'
    });
  }
  
  // File lifecycle actions
  if (initResults.fileLifecycle?.statistics?.pending_archive > 0) {
    actions.push({
      command: 'npm run archive-files',
      description: 'Archive expired files'
    });
  }
  
  // Display actions
  if (actions.length > 0) {
    for (const action of actions) {
      const priorityMark = action.priority === 'high' ? chalk.yellow('⚠ ') : '   ';
      console.log(`${priorityMark}${chalk.cyan(action.command.padEnd(30))} ${chalk.dim(action.description)}`);
    }
  } else {
    console.log(chalk.dim('   All systems ready! Start coding.'));
  }
}

/**
 * Display compact summary (one-line)
 * 
 * @param {Object} initResults - Initialization results
 */
export function displayCompactSummary(initResults) {
  const systems = [];
  
  if (initResults.primacyRules?.success) systems.push('Rules');
  if (initResults.fileLifecycle?.success) systems.push('Lifecycle');
  if (initResults.taskmaster?.success) systems.push('TaskMaster');
  if (initResults.skills?.success) systems.push('Skills');
  
  const status = systems.length > 0 
    ? chalk.green(`✓ ${systems.join(', ')}`)
    : chalk.yellow('⚠ Limited systems active');
  
  console.log(`🚀 Orchestrator ready | ${status}`);
}

/**
 * Create summary object for programmatic use
 * 
 * @param {Object} initResults - Initialization results
 * @returns {Object} Summary object
 */
export function createSummary(initResults) {
  return {
    ready: true,
    timestamp: new Date().toISOString(),
    systems: {
      primacyRules: {
        active: initResults.primacyRules?.success || false,
        count: initResults.primacyRules?.stats?.ok || 0,
        issues: (initResults.primacyRules?.stats?.missing || 0) + 
                (initResults.primacyRules?.stats?.errors || 0)
      },
      fileLifecycle: {
        active: initResults.fileLifecycle?.success || false,
        filesTracked: initResults.fileLifecycle?.statistics?.total_files || 0,
        pendingArchive: initResults.fileLifecycle?.statistics?.pending_archive || 0
      },
      taskmaster: {
        active: initResults.taskmaster?.success || false,
        warnings: initResults.taskmaster?.warnings?.length || 0
      },
      skills: {
        active: initResults.skills?.success || false,
        primed: initResults.skills?.primedSkills?.length || 0,
        projectType: initResults.skills?.projectType || 'unknown'
      }
    }
  };
}

export default displayWakeUpSummary;

