/**
 * Project Health Command
 * 
 * Calculate and display comprehensive health metrics for a Claude project.
 * 
 * @module commands/health
 * @version 1.0.0
 */

import chalk from 'chalk';
import ora from 'ora';
import {
  calculateProjectHealth,
  updateProjectHealthMetadata,
  getHealthStatus,
  getProjectHealthScore
} from '../utils/project-health.js';
import { detectProjectRoot } from '../utils/project-detector.js';
import { updateHealthCheckTimestamp } from '../utils/project-timestamps.js';
import {
  generateRecommendations,
  formatRecommendationsForDisplay,
  generateSummaryReport
} from '../utils/health-recommendation-generator.js';
import {
  checkHealthAlerts,
  getActiveAlerts
} from '../utils/health-alerts.js';
import { createError, createCommandErrorHandler, wrapError } from '../utils/errors/index.js';

/**
 * Health command handler
 * 
 * @param {string} projectPath - Optional path to project (defaults to current)
 * @param {Object} options - Command options
 */
export async function healthCommand(projectPath, options = {}) {
  const {
    update = false,
    verbose = false,
    json = false,
    recommendations = true
  } = options;

  const handleError = createCommandErrorHandler({
    commandName: 'health',
    verbose,
    exitCode: 1
  });

  try {
    // Detect project root
    const resolvedPath = projectPath || process.cwd();
    const projectRoot = await detectProjectRoot(resolvedPath);

    if (!projectRoot) {
      throw createError('CMD-PROJ-001', { name: resolvedPath });
    }

    // Calculate health
    const spinner = ora('Analyzing project health...').start();
    
    // Get previous score before calculating new one
    const previousScore = getProjectHealthScore(projectRoot);
    
    const health = await calculateProjectHealth(projectRoot);
    
    // Generate recommendations if requested
    let recommendationResult = null;
    if (recommendations) {
      spinner.text = 'Generating recommendations...';
      recommendationResult = await generateRecommendations(projectRoot, {
        maxRecommendations: verbose ? Infinity : 10
      });
    }
    
    // Generate health alerts based on score changes
    spinner.text = 'Checking for health alerts...';
    const newAlerts = await checkHealthAlerts(projectRoot, health.score, previousScore);
    
    // Record health check timestamp
    updateHealthCheckTimestamp(projectRoot);
    
    spinner.stop();
    
    // Display any new alerts
    if (newAlerts && newAlerts.length > 0 && !json) {
      console.log('');
      newAlerts.forEach(alert => {
        const color = alert.severity === 'critical' ? 'red' :
                     alert.severity === 'warning' ? 'yellow' :
                     alert.severity === 'success' ? 'green' : 'blue';
        console.log(chalk[color](`${alert.message}`));
      });
    }

    // JSON output mode
    if (json) {
      const output = {
        health,
        recommendations: recommendationResult
      };
      console.log(JSON.stringify(output, null, 2));
      return;
    }

    // Display results
    displayHealthReport(health, verbose, recommendationResult);

    // Update metadata if requested
    if (update) {
      const updateSpinner = ora('Updating project metadata...').start();
      const success = await updateProjectHealthMetadata(projectRoot, health);
      
      if (success) {
        updateSpinner.succeed('Health score saved to metadata.json');
      } else {
        updateSpinner.fail('Could not update metadata.json');
      }
    }

  } catch (error) {
    const wrappedError = error.code ? error : wrapError(error, 'CMD-HEALTH-001', { 
      project: projectPath || process.cwd() 
    });
    await handleError(wrappedError);
  }
}

/**
 * Display formatted health report
 * 
 * @param {Object} health - Health data
 * @param {boolean} verbose - Show detailed information
 * @param {Object} recommendationResult - Recommendation result object
 */
function displayHealthReport(health, verbose = false, recommendationResult = null) {
  const status = getHealthStatus(health.score);
  
  console.log('\n');
  console.log('═══════════════════════════════════════════════');
  console.log(chalk.bold('   PROJECT HEALTH REPORT'));
  console.log('═══════════════════════════════════════════════');
  console.log('');

  // Overall score
  const scoreColor = status.color === 'green' ? 'green' : 
                     status.color === 'yellow' ? 'yellow' : 'red';
  
  console.log(chalk[scoreColor].bold(`  ${status.indicator} Overall Health: ${health.score}/100`));
  console.log(chalk.dim(`  Status: ${status.label}`));
  console.log(chalk.dim(`  Last Check: ${new Date(health.timestamp).toLocaleString()}`));
  console.log('');

  // Component scores
  console.log(chalk.bold('  Component Breakdown:'));
  console.log('  ─────────────────────────────────────────────');
  
  displayComponentScore('Structure', health.components.structure, 35, verbose);
  displayComponentScore('Hooks', health.components.hooks, 25, verbose);
  displayComponentScore('Skills', health.components.skills, 20, verbose);
  displayComponentScore('Config', health.components.config, 10, verbose);
  displayComponentScore('Files', health.components.fileOrganization, 10, verbose); // NEW in v1.2.0
  
  console.log('');

  // Display recommendations if available
  if (recommendationResult && recommendationResult.recommendations.length > 0) {
    console.log('');
    console.log(chalk.bold.cyan('  📋 RECOMMENDATIONS'));
    console.log('  ─────────────────────────────────────────────');
    console.log('');
    
    // Display summary first
    if (verbose) {
      console.log(chalk.dim('  Summary:'));
      console.log(chalk.dim(`    Total Issues: ${recommendationResult.totalIssues}`));
      console.log(chalk.dim(`    Potential Improvement: +${recommendationResult.potentialImprovement} health points`));
      console.log(chalk.dim(`    Auto-fixable: ${recommendationResult.summary.autoFixable}/${recommendationResult.summary.total}`));
      console.log('');
    }
    
    // Display recommendations
    const formatted = formatRecommendationsForDisplay(recommendationResult.recommendations, {
      includeImpact: true,
      includeCommand: true,
      includeLearnMore: false,
      numbered: true,
      groupByCategory: false
    });
    
    // Indent the formatted output
    const indentedRecs = formatted.split('\n').map(line => `  ${line}`).join('\n');
    console.log(indentedRecs);
    console.log('');
  } else if (health.score >= 85) {
    console.log(chalk.green.bold('  ✅ Excellent! Your project is in great health!'));
    console.log('');
  }

  console.log('═══════════════════════════════════════════════');
  console.log('');
}

/**
 * Display individual component score
 * 
 * @param {string} name - Component name
 * @param {Object} component - Component data
 * @param {number} weight - Component weight percentage
 * @param {boolean} verbose - Show details
 */
function displayComponentScore(name, component, weight, verbose) {
  const scoreColor = component.score >= 85 ? 'green' :
                     component.score >= 70 ? 'yellow' : 'red';
  
  const bar = createProgressBar(component.score);
  
  console.log(`  ${chalk.bold(name.padEnd(12))} ${bar} ${chalk[scoreColor](component.score + '%')} ${chalk.dim(`(${weight}% weight)`)}`);
  
  if (verbose && component.details && component.details.length > 0) {
    component.details.forEach(detail => {
      console.log(chalk.dim(`    → ${detail}`));
    });
  }
}

/**
 * Create a visual progress bar
 * 
 * @param {number} score - Score (0-100)
 * @param {number} width - Bar width in characters
 * @returns {string} Formatted progress bar
 */
function createProgressBar(score, width = 20) {
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;
  
  const color = score >= 85 ? 'green' :
                score >= 70 ? 'yellow' : 'red';
  
  return chalk[color]('█'.repeat(filled)) + chalk.dim('░'.repeat(empty));
}

