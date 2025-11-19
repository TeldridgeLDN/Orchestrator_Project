/**
 * Startup Summary Display
 * 
 * Provides formatted output for startup verification results.
 * Supports both detailed and compact views.
 * 
 * @module @diet103/startup-system/summary
 * @version 1.0.0
 */

import chalk from 'chalk';

/**
 * Display detailed wake-up summary
 * 
 * @param {Object} initResults - Initialization results from startup hooks
 * @param {Object} options - Display options
 */
export function displayWakeUpSummary(initResults, options = {}) {
  const { projectRoot, projectName } = options;
  
  console.log('');
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('   🚀 diet103 Project Startup'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════'));
  console.log('');
  
  // Project Info
  console.log(chalk.cyan('📁 Project:'), chalk.bold(projectName || 'Unknown'));
  console.log(chalk.dim(`   ${projectRoot || process.cwd()}`));
  console.log('');
  
  // Active Systems
  console.log(chalk.cyan('✨ Active Systems:'));
  
  // Primacy Rules
  if (initResults.primacyRules) {
    const { success, stats } = initResults.primacyRules;
    if (success) {
      console.log(chalk.green(`   ✓ Primacy Rules (${stats.ok}/${stats.total} verified)`));
    } else {
      console.log(chalk.yellow(`   ⚠ Primacy Rules (${stats.ok}/${stats.total} - issues detected)`));
    }
  }
  
  // File Lifecycle
  if (initResults.fileLifecycle) {
    const { success } = initResults.fileLifecycle;
    if (success) {
      console.log(chalk.green('   ✓ File Lifecycle Management'));
    } else {
      console.log(chalk.yellow('   ⚠ File Lifecycle (check config)'));
    }
  }
  
  // TaskMaster
  if (initResults.taskmaster) {
    const { configured } = initResults.taskmaster;
    if (configured) {
      console.log(chalk.green('   ✓ TaskMaster Configured'));
    } else {
      console.log(chalk.dim('   ○ TaskMaster (not initialized)'));
    }
  }
  
  // Skills
  if (initResults.skills && initResults.skills.success) {
    const activeCount = initResults.skills.activated?.length || 0;
    if (activeCount > 0) {
      console.log(chalk.green(`   ✓ diet103 Skills (${activeCount} active)`));
    }
  }
  
  console.log('');
  
  // Quick Actions
  console.log(chalk.cyan('⚡ Quick Actions:'));
  console.log(chalk.dim('   • task-master list          Show all tasks'));
  console.log(chalk.dim('   • task-master next          Get next task'));
  console.log(chalk.dim('   • npm run validate-rules    Check rule versions'));
  console.log(chalk.dim('   • npm run sync-rules-global Sync rules everywhere'));
  console.log('');
  
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════'));
  console.log(chalk.green.bold('   ✅ Ready to code!'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════'));
  console.log('');
}

/**
 * Display compact summary (minimal output)
 * 
 * @param {Object} initResults - Initialization results
 */
export function displayCompactSummary(initResults) {
  const items = [];
  
  if (initResults.primacyRules?.success) {
    items.push(chalk.green('✓ Rules'));
  } else if (initResults.primacyRules) {
    items.push(chalk.yellow('⚠ Rules'));
  }
  
  if (initResults.fileLifecycle?.success) {
    items.push(chalk.green('✓ Lifecycle'));
  }
  
  if (initResults.taskmaster?.configured) {
    items.push(chalk.green('✓ Tasks'));
  }
  
  if (initResults.skills?.success && initResults.skills.activated?.length > 0) {
    items.push(chalk.green(`✓ Skills (${initResults.skills.activated.length})`));
  }
  
  console.log('');
  console.log(chalk.blue('🚀 diet103:'), items.join(' • '));
  console.log('');
}

/**
 * Display error summary
 * 
 * @param {Error} error - The error that occurred
 * @param {string} projectRoot - Project root directory
 */
export function displayErrorSummary(error, projectRoot) {
  console.log('');
  console.log(chalk.red.bold('❌ Startup Error'));
  console.log('');
  console.log(chalk.red('   Error:'), error.message);
  console.log(chalk.dim(`   Project: ${projectRoot}`));
  console.log('');
  console.log(chalk.yellow('   Suggestion:'), 'Check project structure and configuration');
  console.log('');
}

export default { displayWakeUpSummary, displayCompactSummary, displayErrorSummary };

