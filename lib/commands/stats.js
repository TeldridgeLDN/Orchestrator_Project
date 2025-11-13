#!/usr/bin/env node

/**
 * Stats Command
 * 
 * Displays formatted metrics statistics for skills and hooks, including
 * performance ratings, time savings estimates, and usage patterns.
 * 
 * @module commands/stats
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  loadMetrics,
  getSkillMetrics,
  getHookMetrics
} from '../utils/metrics.js';
import {
  generateWeeklySummary,
  getHistoricalAggregation,
  getStorageStats
} from '../utils/metrics-aggregation.js';
import { createCommandErrorHandler, wrapError } from '../utils/errors/index.js';

// ==================== Constants ====================

const STAR_THRESHOLDS = {
  FIVE_STAR: { activations: 50, effectiveness: 0.8 },
  FOUR_STAR: { activations: 30, effectiveness: 0.6 },
  THREE_STAR: { activations: 15, effectiveness: 0.4 },
  TWO_STAR: { activations: 5, effectiveness: 0.2 },
  ONE_STAR: { activations: 1, effectiveness: 0.0 }
};

const TIME_SAVINGS = {
  // Estimated minutes saved per activation
  HIGH_VALUE: 15,    // Complex analysis, validation
  MEDIUM_VALUE: 5,   // Suggestions, guidance
  LOW_VALUE: 1       // Quick checks, warnings
};

// ==================== Helper Functions ====================

/**
 * Calculate star rating for a skill based on usage and effectiveness
 * 
 * @param {Object} skillData - Skill metrics data
 * @returns {number} Star rating (1-5)
 */
function calculateStarRating(skillData) {
  const activations = skillData.activations || 0;
  
  // Calculate effectiveness (lower error rate = higher effectiveness)
  const errorRate = skillData.errors_encountered / Math.max(activations, 1);
  const effectiveness = 1 - Math.min(errorRate, 1);
  
  // Determine star rating
  if (activations >= STAR_THRESHOLDS.FIVE_STAR.activations && 
      effectiveness >= STAR_THRESHOLDS.FIVE_STAR.effectiveness) {
    return 5;
  } else if (activations >= STAR_THRESHOLDS.FOUR_STAR.activations && 
             effectiveness >= STAR_THRESHOLDS.FOUR_STAR.effectiveness) {
    return 4;
  } else if (activations >= STAR_THRESHOLDS.THREE_STAR.activations && 
             effectiveness >= STAR_THRESHOLDS.THREE_STAR.effectiveness) {
    return 3;
  } else if (activations >= STAR_THRESHOLDS.TWO_STAR.activations && 
             effectiveness >= STAR_THRESHOLDS.TWO_STAR.effectiveness) {
    return 2;
  } else {
    return 1;
  }
}

/**
 * Calculate hook performance rating
 * 
 * @param {Object} hookData - Hook metrics data
 * @returns {string} Performance rating
 */
function calculateHookPerformance(hookData) {
  const executions = hookData.executions || 0;
  const avgMs = hookData.avg_execution_ms || 0;
  const errorRate = (hookData.errors_encountered || 0) / Math.max(executions, 1);
  
  if (errorRate > 0.1 || avgMs > 100) {
    return 'Poor';
  } else if (errorRate > 0.05 || avgMs > 50) {
    return 'Fair';
  } else if (avgMs > 20) {
    return 'Good';
  } else {
    return 'Excellent';
  }
}

/**
 * Estimate time savings for a skill
 * 
 * @param {string} skillName - Name of skill
 * @param {Object} skillData - Skill metrics data
 * @returns {number} Estimated minutes saved
 */
function estimateTimeSavings(skillName, skillData) {
  const activations = skillData.activations || 0;
  
  // Categorize skills by value
  let minutesPerActivation;
  
  if (skillName.includes('validate') || skillName.includes('analyze') || 
      skillName.includes('critic')) {
    minutesPerActivation = TIME_SAVINGS.HIGH_VALUE;
  } else if (skillName.includes('suggest') || skillName.includes('guide') || 
             skillName.includes('workflow')) {
    minutesPerActivation = TIME_SAVINGS.MEDIUM_VALUE;
  } else {
    minutesPerActivation = TIME_SAVINGS.LOW_VALUE;
  }
  
  return activations * minutesPerActivation;
}

/**
 * Format star rating display
 * 
 * @param {number} stars - Number of stars (1-5)
 * @returns {string} Formatted star display
 */
function formatStars(stars) {
  const filled = '★'.repeat(stars);
  const empty = '☆'.repeat(5 - stars);
  return chalk.yellow(filled) + chalk.gray(empty);
}

/**
 * Format duration display
 * 
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
function formatDuration(seconds) {
  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(0)}ms`;
  } else if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
  }
}

/**
 * Format time savings display
 * 
 * @param {number} minutes - Time in minutes
 * @returns {string} Formatted time savings
 */
function formatTimeSavings(minutes) {
  if (minutes < 60) {
    return `${minutes} minutes`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
}

// ==================== Display Functions ====================

/**
 * Display skills statistics
 * 
 * @param {Object} metrics - Metrics data
 * @param {Object} options - Display options
 */
function displaySkillsStats(metrics, options) {
  const skills = metrics.skills || {};
  const skillNames = Object.keys(skills).sort();
  
  if (skillNames.length === 0) {
    console.log(chalk.gray('  No skill usage data available yet.\n'));
    return;
  }
  
  console.log(chalk.bold.cyan('📊 Skills Performance\n'));
  
  let totalActivations = 0;
  let totalTimeSaved = 0;
  
  for (const skillName of skillNames) {
    const skillData = skills[skillName];
    const rating = calculateStarRating(skillData);
    const timeSaved = estimateTimeSavings(skillName, skillData);
    
    totalActivations += skillData.activations || 0;
    totalTimeSaved += timeSaved;
    
    // Skill header
    console.log(chalk.bold.white(`  ${skillName}`));
    console.log(`  ${formatStars(rating)}  ${chalk.dim('Rating')}`);
    
    // Usage stats
    console.log(chalk.dim('  Usage:'));
    console.log(`    ${chalk.cyan('●')} Activations: ${skillData.activations || 0}`);
    if (skillData.manual || skillData.auto) {
      console.log(`      ${chalk.dim('└─')} Manual: ${skillData.manual || 0} | Auto: ${skillData.auto || 0}`);
    }
    
    // Performance stats
    if (skillData.avg_duration_seconds) {
      console.log(`    ${chalk.cyan('●')} Avg Duration: ${formatDuration(skillData.avg_duration_seconds)}`);
    }
    
    // Error stats
    if (skillData.errors_found > 0) {
      console.log(`    ${chalk.green('●')} Errors Found: ${skillData.errors_found}`);
    }
    if (skillData.errors_encountered > 0) {
      console.log(`    ${chalk.red('●')} Errors Encountered: ${skillData.errors_encountered}`);
    }
    
    // Time savings
    console.log(`    ${chalk.yellow('●')} Est. Time Saved: ${formatTimeSavings(timeSaved)}`);
    
    // Last used
    if (skillData.last_used) {
      const lastUsed = new Date(skillData.last_used);
      console.log(`    ${chalk.dim('Last used:')} ${lastUsed.toLocaleDateString()} ${lastUsed.toLocaleTimeString()}`);
    }
    
    console.log(); // Blank line
  }
  
  // Summary
  console.log(chalk.bold.white('  Summary:'));
  console.log(`    ${chalk.cyan('Total Activations:')} ${totalActivations}`);
  console.log(`    ${chalk.yellow('Total Time Saved:')} ${formatTimeSavings(totalTimeSaved)}`);
  console.log();
}

/**
 * Display hooks statistics
 * 
 * @param {Object} metrics - Metrics data
 * @param {Object} options - Display options
 */
function displayHooksStats(metrics, options) {
  const hooks = metrics.hooks || {};
  const hookNames = Object.keys(hooks).sort();
  
  if (hookNames.length === 0) {
    console.log(chalk.gray('  No hook execution data available yet.\n'));
    return;
  }
  
  console.log(chalk.bold.magenta('⚡ Hooks Performance\n'));
  
  let totalExecutions = 0;
  
  for (const hookName of hookNames) {
    const hookData = hooks[hookName];
    const performance = calculateHookPerformance(hookData);
    
    totalExecutions += hookData.executions || 0;
    
    // Hook header
    console.log(chalk.bold.white(`  ${hookName}`));
    
    // Performance badge
    let performanceColor;
    switch (performance) {
      case 'Excellent': performanceColor = chalk.green; break;
      case 'Good': performanceColor = chalk.cyan; break;
      case 'Fair': performanceColor = chalk.yellow; break;
      case 'Poor': performanceColor = chalk.red; break;
      default: performanceColor = chalk.gray;
    }
    console.log(`  ${performanceColor(`[${performance}]`)}`);
    
    // Execution stats
    console.log(chalk.dim('  Performance:'));
    console.log(`    ${chalk.magenta('●')} Executions: ${hookData.executions || 0}`);
    console.log(`    ${chalk.magenta('●')} Avg Time: ${(hookData.avg_execution_ms || 0).toFixed(2)}ms`);
    
    // Warning/error stats
    if (hookData.warnings_issued > 0) {
      console.log(`    ${chalk.yellow('●')} Warnings Issued: ${hookData.warnings_issued}`);
    }
    if (hookData.errors_caught > 0) {
      console.log(`    ${chalk.green('●')} Errors Caught: ${hookData.errors_caught}`);
    }
    if (hookData.errors_encountered > 0) {
      console.log(`    ${chalk.red('●')} Errors Encountered: ${hookData.errors_encountered}`);
    }
    
    // Last executed
    if (hookData.last_executed) {
      const lastExecuted = new Date(hookData.last_executed);
      console.log(`    ${chalk.dim('Last executed:')} ${lastExecuted.toLocaleDateString()} ${lastExecuted.toLocaleTimeString()}`);
    }
    
    console.log(); // Blank line
  }
  
  // Summary
  console.log(chalk.bold.white('  Summary:'));
  console.log(`    ${chalk.magenta('Total Executions:')} ${totalExecutions}`);
  console.log();
}

/**
 * Display storage statistics
 * 
 * @param {Object} storageStats - Storage statistics
 */
function displayStorageStats(storageStats) {
  console.log(chalk.bold.blue('💾 Storage\n'));
  
  // Current metrics file
  if (storageStats.current.exists) {
    const sizeMB = (storageStats.current.size / 1024 / 1024).toFixed(2);
    console.log(`  ${chalk.blue('●')} Current Metrics: ${sizeMB} MB`);
    
    if (storageStats.current.modified) {
      const modified = new Date(storageStats.current.modified);
      console.log(`    ${chalk.dim('Last modified:')} ${modified.toLocaleDateString()} ${modified.toLocaleTimeString()}`);
    }
  } else {
    console.log(chalk.gray('  No current metrics file found.'));
  }
  
  // Archives
  if (storageStats.archives.count > 0) {
    const totalMB = (storageStats.archives.totalSize / 1024 / 1024).toFixed(2);
    console.log(`  ${chalk.blue('●')} Archives: ${storageStats.archives.count} files (${totalMB} MB)`);
    
    if (storageStats.archives.oldest) {
      const oldest = new Date(storageStats.archives.oldest);
      console.log(`    ${chalk.dim('Oldest:')} ${oldest.toLocaleDateString()}`);
    }
  } else {
    console.log(chalk.gray('  No archived metrics found.'));
  }
  
  // Total storage
  const totalMB = (storageStats.total / 1024 / 1024).toFixed(2);
  console.log(`  ${chalk.bold('Total:')} ${totalMB} MB`);
  console.log();
}

// ==================== Command Action ====================

/**
 * Stats command action
 * 
 * @param {Object} options - Command options
 */
async function statsAction(options) {
  const handleError = createCommandErrorHandler({
    commandName: 'stats',
    verbose: options.verbose || false,
    exitCode: 1
  });

  try {
    console.log(chalk.bold('\n🎯 Orchestrator Metrics Dashboard\n'));
    
    // Load metrics
    const metrics = await loadMetrics();
    
    // Display skills stats
    if (!options.hooksOnly) {
      displaySkillsStats(metrics, options);
    }
    
    // Display hooks stats
    if (!options.skillsOnly) {
      displayHooksStats(metrics, options);
    }
    
    // Display storage stats
    if (options.storage) {
      const storageStats = await getStorageStats();
      displayStorageStats(storageStats);
    }
    
    // Display weekly summary
    if (options.weekly) {
      console.log(chalk.bold.green('📅 Weekly Summary\n'));
      const summary = await generateWeeklySummary();
      console.log(JSON.stringify(summary, null, 2));
      console.log();
    }
    
    // Display historical aggregation
    if (options.history) {
      const weeks = parseInt(options.history, 10) || 4;
      console.log(chalk.bold.green(`📈 Historical Aggregation (${weeks} weeks)\n`));
      const aggregation = await getHistoricalAggregation(weeks);
      console.log(JSON.stringify(aggregation, null, 2));
      console.log();
    }
    
  } catch (error) {
    const wrappedError = error.code ? error : wrapError(error, 'CMD-STATS-001', { 
      operation: 'display-stats' 
    });
    await handleError(wrappedError);
  }
}

// ==================== Command Definition ====================

/**
 * Create the stats command
 * 
 * @returns {Command} Configured Commander.js command
 */
export function statsCommand() {
  const stats = new Command('stats')
    .description('Display metrics and performance statistics for skills and hooks')
    .option('--skills-only', 'Show only skill statistics')
    .option('--hooks-only', 'Show only hook statistics')
    .option('--storage', 'Include storage statistics')
    .option('--weekly', 'Show weekly summary')
    .option('--history <weeks>', 'Show historical aggregation for N weeks (default: 4)')
    .addHelpText('after', `
Examples:
  $ diet103 stats                    # Show all statistics
  $ diet103 stats --skills-only      # Show only skill stats
  $ diet103 stats --hooks-only       # Show only hook stats
  $ diet103 stats --storage          # Include storage information
  $ diet103 stats --weekly           # Show weekly summary
  $ diet103 stats --history 8        # Show 8-week history
  
Features:
  - ⭐ Star ratings based on usage and effectiveness
  - ⏱️  Estimated time savings per skill
  - 📊 Comprehensive performance metrics
  - 💾 Storage usage tracking
    `)
    .action(statsAction);
  
  return stats;
}

export default statsCommand;

