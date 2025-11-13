/**
 * Scenario List Command
 * 
 * List all available scenarios with metadata.
 * 
 * @module commands/scenario/list
 */

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import chalk from 'chalk';
import { getScenariosDir, scenariosDirectoryExists } from '../../utils/scenario-directory.js';
import { createCommandErrorHandler, wrapError } from '../../utils/errors/index.js';

/**
 * Get all scenario files
 * 
 * @returns {Promise<string[]>} Array of scenario file paths
 */
async function getScenarioFiles() {
  if (!scenariosDirectoryExists()) {
    return [];
  }
  
  const scenariosDir = getScenariosDir();
  const files = await fs.readdir(scenariosDir);
  
  // Filter for YAML files only
  return files
    .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
    .map(file => path.join(scenariosDir, file));
}

/**
 * Load scenario metadata from file
 * 
 * @param {string} filePath - Path to scenario file
 * @returns {Promise<object>} Scenario metadata
 */
async function loadScenarioMetadata(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = yaml.load(content);
    const stats = await fs.stat(filePath);
    
    return {
      name: data.scenario?.name || path.basename(filePath, path.extname(filePath)),
      description: data.scenario?.description || 'No description',
      category: data.scenario?.category || 'unknown',
      version: data.scenario?.version || '1.0.0',
      trigger: data.scenario?.trigger?.command || 'N/A',
      steps: data.scenario?.steps?.length || 0,
      dependencies: {
        mcps: data.scenario?.dependencies?.mcps?.length || 0,
        skills: data.scenario?.dependencies?.skills?.length || 0
      },
      created: stats.birthtime,
      modified: stats.mtime,
      filePath
    };
  } catch (error) {
    return {
      name: path.basename(filePath, path.extname(filePath)),
      description: `Error loading: ${error.message}`,
      category: 'error',
      version: 'N/A',
      trigger: 'N/A',
      steps: 0,
      dependencies: { mcps: 0, skills: 0 },
      created: null,
      modified: null,
      filePath,
      error: true
    };
  }
}

/**
 * Format scenario list as table
 * 
 * @param {object[]} scenarios - Array of scenario metadata
 */
function formatTable(scenarios) {
  if (scenarios.length === 0) {
    console.log(chalk.yellow('\n⚠️  No scenarios found'));
    console.log(chalk.gray('Create your first scenario with:'), chalk.cyan('diet103 scenario create\n'));
    return;
  }
  
  console.log(chalk.bold('\n📋 Available Scenarios\n'));
  
  // Header
  const nameWidth = 20;
  const descWidth = 40;
  const categoryWidth = 15;
  const stepsWidth = 8;
  
  console.log(
    chalk.bold(
      'NAME'.padEnd(nameWidth) +
      'DESCRIPTION'.padEnd(descWidth) +
      'CATEGORY'.padEnd(categoryWidth) +
      'STEPS'.padEnd(stepsWidth)
    )
  );
  console.log('─'.repeat(nameWidth + descWidth + categoryWidth + stepsWidth));
  
  // Rows
  scenarios.forEach(scenario => {
    const name = scenario.error 
      ? chalk.red(scenario.name.substring(0, nameWidth - 1))
      : chalk.cyan(scenario.name.substring(0, nameWidth - 1));
    const desc = scenario.description.substring(0, descWidth - 1);
    const category = scenario.category.substring(0, categoryWidth - 1);
    const steps = scenario.steps.toString();
    
    console.log(
      name.padEnd(nameWidth) +
      desc.padEnd(descWidth) +
      category.padEnd(categoryWidth) +
      steps.padEnd(stepsWidth)
    );
  });
  
  console.log('\n' + chalk.gray(`Total: ${scenarios.length} scenario${scenarios.length !== 1 ? 's' : ''}`));
  console.log(chalk.gray('Use'), chalk.cyan('diet103 scenario show <name>'), chalk.gray('for details\n'));
}

/**
 * Handle the scenario list command
 * 
 * @param {object} options - Command options
 * @param {string} options.status - Filter by status
 * @param {boolean} options.json - Output as JSON
 */
async function handleList(options) {
  const handleError = createCommandErrorHandler({
    commandName: 'scenario-list',
    verbose: options.verbose || false,
    exitCode: 1
  });

  try {
    const files = await getScenarioFiles();
    const scenarios = await Promise.all(files.map(loadScenarioMetadata));
    
    // Sort by name
    scenarios.sort((a, b) => a.name.localeCompare(b.name));
    
    // Output
    if (options.json) {
      console.log(JSON.stringify(scenarios, null, 2));
    } else {
      formatTable(scenarios);
    }
    
  } catch (error) {
    const wrappedError = error.code ? error : wrapError(error, 'CMD-SCEN-003', { 
      operation: 'list-scenarios' 
    });
    await handleError(wrappedError);
  }
}

/**
 * Create the 'scenario list' command
 * 
 * @returns {Command} Configured Commander.js command
 */
export function listCommand() {
  return new Command('list')
    .description('List all available scenarios')
    .option('-s, --status <status>', 'Filter by status (active, inactive, all)', 'all')
    .option('--json', 'Output as JSON')
    .addHelpText('after', `
Examples:
  $ diet103 scenario list                    # List all scenarios
  $ diet103 scenario list --status active    # List only active scenarios
  $ diet103 scenario list --json             # Output as JSON
    `)
    .action(handleList);
}

