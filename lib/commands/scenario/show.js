/**
 * Scenario Show Command
 * 
 * Display detailed information about a specific scenario.
 * 
 * @module commands/scenario/show
 */

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import chalk from 'chalk';
import { getScenariosDir, scenariosDirectoryExists } from '../../utils/scenario-directory.js';

/**
 * Find scenario file by name
 * 
 * @param {string} name - Scenario name
 * @returns {Promise<string|null>} Path to scenario file or null
 */
async function findScenarioFile(name) {
  if (!scenariosDirectoryExists()) {
    return null;
  }
  
  const scenariosDir = getScenariosDir();
  
  // Try direct match
  const yamlPath = path.join(scenariosDir, `${name}.yaml`);
  const ymlPath = path.join(scenariosDir, `${name}.yml`);
  
  try {
    await fs.access(yamlPath);
    return yamlPath;
  } catch {
    try {
      await fs.access(ymlPath);
      return ymlPath;
    } catch {
      return null;
    }
  }
}

/**
 * Load complete scenario data
 * 
 * @param {string} filePath - Path to scenario file
 * @returns {Promise<object>} Complete scenario data
 */
async function loadScenario(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const data = yaml.load(content);
  const stats = await fs.stat(filePath);
  
  return {
    ...data.scenario,
    _metadata: {
      filePath,
      created: stats.birthtime,
      modified: stats.mtime,
      size: stats.size
    }
  };
}

/**
 * Format scenario details for display
 * 
 * @param {object} scenario - Scenario data
 * @param {boolean} verbose - Show verbose output
 */
function formatDetails(scenario, verbose) {
  console.log(chalk.bold.blue(`\n📋 ${scenario.name}\n`));
  
  // Basic info
  console.log(chalk.bold('Description:'), scenario.description);
  console.log(chalk.bold('Category:'), scenario.category);
  console.log(chalk.bold('Version:'), scenario.version);
  console.log(chalk.bold('Trigger:'), scenario.trigger?.command || 'N/A');
  
  // Trigger details
  if (verbose && scenario.trigger) {
    console.log(chalk.bold('\n🎯 Trigger Configuration:'));
    console.log(`  Type: ${scenario.trigger.type}`);
    if (scenario.trigger.keywords) {
      console.log(`  Keywords: ${scenario.trigger.keywords.join(', ')}`);
    }
    if (scenario.trigger.schedule) {
      console.log(`  Schedule: ${scenario.trigger.schedule.cron}`);
    }
    if (scenario.trigger.webhook) {
      console.log(`  Webhook: ${scenario.trigger.webhook.method} ${scenario.trigger.webhook.path}`);
    }
  }
  
  // Steps
  console.log(chalk.bold('\n📝 Steps:'));
  if (scenario.steps && scenario.steps.length > 0) {
    scenario.steps.forEach((step, index) => {
      const stepNum = chalk.cyan(`${index + 1}.`);
      const stepId = chalk.gray(`[${step.id}]`);
      console.log(`  ${stepNum} ${stepId} ${step.action}`);
      if (verbose) {
        console.log(`     Type: ${step.type}`);
        if (step.dependencies && step.dependencies.length > 0) {
          console.log(`     Dependencies: ${step.dependencies.join(', ')}`);
        }
        if (step.mcp) {
          console.log(`     MCP: ${step.mcp}`);
        }
      }
    });
  } else {
    console.log(chalk.gray('  No steps defined'));
  }
  
  // Dependencies
  console.log(chalk.bold('\n🔗 Dependencies:'));
  const mcps = scenario.dependencies?.mcps || [];
  const skills = scenario.dependencies?.skills || [];
  
  if (mcps.length > 0) {
    console.log(`  MCPs: ${mcps.join(', ')}`);
  } else {
    console.log(chalk.gray('  No MCPs required'));
  }
  
  if (skills.length > 0) {
    console.log(`  Skills: ${skills.join(', ')}`);
  } else {
    console.log(chalk.gray('  No skills required'));
  }
  
  // Generates
  console.log(chalk.bold('\n⚙️  Generates:'));
  if (scenario.generates && scenario.generates.length > 0) {
    scenario.generates.forEach(item => {
      console.log(`  • ${item}`);
    });
  } else {
    console.log(chalk.gray('  Nothing specified'));
  }
  
  // Design decisions (if present and verbose)
  if (verbose && scenario.design_decisions && scenario.design_decisions.length > 0) {
    console.log(chalk.bold('\n💡 Design Decisions:'));
    scenario.design_decisions.forEach((decision, index) => {
      console.log(chalk.bold(`  ${index + 1}. ${decision.decision}`));
      console.log(`     Rationale: ${decision.rationale}`);
      if (decision.alternatives_considered) {
        console.log(`     Alternatives: ${decision.alternatives_considered.join(', ')}`);
      }
    });
  }
  
  // Potential improvements (if present and verbose)
  if (verbose && scenario.potential_improvements && scenario.potential_improvements.length > 0) {
    console.log(chalk.bold('\n🚀 Potential Improvements:'));
    scenario.potential_improvements.forEach((improvement, index) => {
      console.log(`  ${index + 1}. ${improvement}`);
    });
  }
  
  // Metadata
  if (verbose && scenario._metadata) {
    console.log(chalk.bold('\n📊 Metadata:'));
    console.log(`  File: ${scenario._metadata.filePath}`);
    console.log(`  Created: ${scenario._metadata.created?.toLocaleString()}`);
    console.log(`  Modified: ${scenario._metadata.modified?.toLocaleString()}`);
    console.log(`  Size: ${scenario._metadata.size} bytes`);
  }
  
  console.log(); // Empty line at end
}

/**
 * Handle the scenario show command
 * 
 * @param {string} name - Scenario name
 * @param {object} options - Command options
 * @param {boolean} options.json - Output as JSON
 * @param {boolean} options.verbose - Show verbose output
 */
async function handleShow(name, options) {
  try {
    const filePath = await findScenarioFile(name);
    
    if (!filePath) {
      console.error(chalk.red(`\n❌ Scenario "${name}" not found`));
      console.log(chalk.gray('List available scenarios with:'), chalk.cyan('diet103 scenario list\n'));
      process.exit(1);
    }
    
    const scenario = await loadScenario(filePath);
    
    if (options.json) {
      console.log(JSON.stringify(scenario, null, 2));
    } else {
      formatDetails(scenario, options.verbose);
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Error loading scenario:'), error.message);
    process.exit(1);
  }
}

/**
 * Create the 'scenario show' command
 * 
 * @returns {Command} Configured Commander.js command
 */
export function showCommand() {
  return new Command('show')
    .description('Show detailed information about a scenario')
    .argument('<name>', 'Scenario name')
    .option('--json', 'Output as JSON')
    .option('-v, --verbose', 'Show verbose output including all configuration')
    .addHelpText('after', `
Examples:
  $ diet103 scenario show my-scenario           # Show scenario details
  $ diet103 scenario show my-scenario --json    # Output as JSON
  $ diet103 scenario show my-scenario -v        # Show verbose details
    `)
    .action(handleShow);
}

