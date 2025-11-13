/**
 * Scenario Potential Improvements Command
 * 
 * View and manage potential improvements in scenario YAML files.
 * 
 * @module commands/scenario/improvements
 */

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import chalk from 'chalk';
import inquirer from 'inquirer';
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
 * Load scenario data
 * 
 * @param {string} filePath - Path to scenario file
 * @returns {Promise<object>} Scenario data
 */
async function loadScenario(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return yaml.load(content);
}

/**
 * Save scenario data
 * 
 * @param {string} filePath - Path to scenario file
 * @param {object} data - Scenario data to save
 */
async function saveScenario(filePath, data) {
  const content = yaml.dump(data, {
    indent: 2,
    lineWidth: 100,
    noRefs: true
  });
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Get priority emoji
 * 
 * @param {string} priority - Priority level
 * @returns {string} Emoji
 */
function getPriorityEmoji(priority) {
  const emojis = {
    high: '🔴',
    medium: '🟡',
    low: '🟢'
  };
  return emojis[priority] || '⚪';
}

/**
 * Get complexity badge
 * 
 * @param {string} complexity - Complexity level
 * @returns {string} Badge text
 */
function getComplexityBadge(complexity) {
  const badges = {
    low: chalk.green('●'),
    medium: chalk.yellow('●●'),
    high: chalk.red('●●●')
  };
  return badges[complexity] || chalk.gray('●');
}

/**
 * Display potential improvements
 * 
 * @param {object} scenario - Scenario data
 * @param {object} options - Display options
 */
function displayImprovements(scenario, options) {
  const improvements = scenario.scenario?.potential_improvements || [];
  
  if (improvements.length === 0) {
    console.log(chalk.yellow('\n⚠️  No potential improvements recorded for this scenario.\n'));
    console.log(chalk.dim('Add one with: diet103 scenario improvements <name> --add\n'));
    return;
  }
  
  console.log(chalk.bold.blue(`\n💡 Potential Improvements (${improvements.length})\n`));
  
  // Filter by priority if specified
  let filtered = improvements;
  if (options.priority) {
    filtered = improvements.filter(i => i.priority === options.priority);
    if (filtered.length === 0) {
      console.log(chalk.yellow(`No improvements with priority "${options.priority}"\n`));
      return;
    }
  }
  
  // Sort by priority if requested
  if (options.sortByPriority) {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    filtered = [...filtered].sort((a, b) => {
      const aPri = priorityOrder[a.priority] ?? 3;
      const bPri = priorityOrder[b.priority] ?? 3;
      return aPri - bPri;
    });
  }
  
  filtered.forEach((improvement, index) => {
    const emoji = getPriorityEmoji(improvement.priority);
    const complexity = getComplexityBadge(improvement.complexity);
    
    console.log(
      chalk.bold(`${emoji} ${index + 1}. ${improvement.suggestion}`)
    );
    
    console.log(
      chalk.dim('   Impact:'),
      chalk.bold(improvement.impact),
      chalk.dim('  Complexity:'),
      complexity,
      chalk.bold(improvement.complexity)
    );
    
    if (improvement.priority) {
      console.log(chalk.dim('   Priority:'), chalk.bold(improvement.priority));
    }
    
    console.log(); // Empty line
  });
  
  // Summary
  if (options.verbose) {
    console.log(chalk.bold('Summary:'));
    const highPriority = improvements.filter(i => i.priority === 'high').length;
    const mediumPriority = improvements.filter(i => i.priority === 'medium').length;
    const lowPriority = improvements.filter(i => i.priority === 'low').length;
    
    console.log(`  High priority: ${highPriority}`);
    console.log(`  Medium priority: ${mediumPriority}`);
    console.log(`  Low priority: ${lowPriority}\n`);
  }
}

/**
 * Add a new potential improvement
 * 
 * @param {string} scenarioPath - Path to scenario file
 * @param {object} data - Scenario data
 * @param {boolean} interactive - Use interactive prompts
 * @param {object} options - Command options
 */
async function addImprovement(scenarioPath, data, interactive, options) {
  let newImprovement;
  
  if (interactive) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'suggestion',
        message: 'Improvement suggestion:',
        validate: input => input.length >= 10 || 'Please provide a detailed suggestion (min 10 characters)'
      },
      {
        type: 'list',
        name: 'impact',
        message: 'Impact if implemented:',
        choices: ['high', 'medium', 'low'],
        default: 'medium'
      },
      {
        type: 'list',
        name: 'complexity',
        message: 'Implementation complexity:',
        choices: ['low', 'medium', 'high'],
        default: 'medium'
      },
      {
        type: 'list',
        name: 'priority',
        message: 'Priority:',
        choices: ['high', 'medium', 'low'],
        default: 'medium'
      }
    ]);
    
    newImprovement = answers;
  } else {
    // Non-interactive mode
    if (!options.suggestion) {
      console.error(chalk.red('Error: --suggestion is required in non-interactive mode'));
      process.exit(1);
    }
    
    newImprovement = {
      suggestion: options.suggestion,
      impact: options.impact || 'medium',
      complexity: options.complexity || 'medium',
      priority: options.priority || 'medium'
    };
    
    // Validate enums
    const validLevels = ['low', 'medium', 'high'];
    if (!validLevels.includes(newImprovement.impact)) {
      console.error(chalk.red(`Error: impact must be one of: ${validLevels.join(', ')}`));
      process.exit(1);
    }
    if (!validLevels.includes(newImprovement.complexity)) {
      console.error(chalk.red(`Error: complexity must be one of: ${validLevels.join(', ')}`));
      process.exit(1);
    }
    if (!validLevels.includes(newImprovement.priority)) {
      console.error(chalk.red(`Error: priority must be one of: ${validLevels.join(', ')}`));
      process.exit(1);
    }
  }
  
  // Ensure potential_improvements array exists
  if (!data.scenario.potential_improvements) {
    data.scenario.potential_improvements = [];
  }
  
  // Add new improvement
  data.scenario.potential_improvements.push(newImprovement);
  
  // Save updated scenario
  await saveScenario(scenarioPath, data);
  
  console.log(chalk.green('\n✓ Potential improvement added successfully\n'));
  displayImprovements(data, { verbose: true });
}

/**
 * Main handler for improvements command
 * 
 * @param {string} name - Scenario name
 * @param {object} options - Command options
 */
async function handleImprovements(name, options) {
  try {
    // Find scenario file
    const scenarioPath = await findScenarioFile(name);
    
    if (!scenarioPath) {
      console.error(chalk.red(`\n✗ Scenario "${name}" not found\n`));
      console.log(chalk.dim('List available scenarios: diet103 scenario list\n'));
      process.exit(1);
    }
    
    // Load scenario
    const data = await loadScenario(scenarioPath);
    
    if (!data.scenario) {
      console.error(chalk.red('\n✗ Invalid scenario format\n'));
      process.exit(1);
    }
    
    // Handle actions
    if (options.add) {
      await addImprovement(scenarioPath, data, !options.noInteractive, options);
    } else {
      // Default: display improvements
      displayImprovements(data, options);
    }
    
  } catch (error) {
    console.error(chalk.red('\n✗ Error:'), error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Create the improvements command
 * 
 * @returns {Command} Configured Commander.js command
 */
export function improvementsCommand() {
  return new Command('improvements')
    .description('View and manage potential improvements in scenarios')
    .argument('<name>', 'Scenario name')
    .option('-a, --add', 'Add a new potential improvement')
    .option('-v, --verbose', 'Show verbose output including summary statistics')
    .option('-p, --priority <level>', 'Filter by priority (high, medium, low)')
    .option('--sort-by-priority', 'Sort improvements by priority')
    .option('--no-interactive', 'Disable interactive prompts (requires --suggestion)')
    .option('-s, --suggestion <text>', 'Improvement suggestion (non-interactive mode)')
    .option('-i, --impact <level>', 'Impact level: low, medium, high (default: medium)')
    .option('-c, --complexity <level>', 'Complexity level: low, medium, high (default: medium)')
    .option('--priority-level <level>', 'Priority level: low, medium, high (default: medium)')
    .option('--json', 'Output in JSON format')
    .action(handleImprovements)
    .addHelpText('after', `
Examples:
  $ diet103 scenario improvements my-scenario              # View all improvements
  $ diet103 scenario improvements my-scenario -v           # View with summary
  $ diet103 scenario improvements my-scenario -p high      # View only high priority
  $ diet103 scenario improvements my-scenario --add        # Add interactively
  
  # Add non-interactively
  $ diet103 scenario improvements my-scenario --add --no-interactive \\
      --suggestion "Add caching layer for API responses" \\
      --impact high \\
      --complexity medium \\
      --priority-level high
    `);
}

