/**
 * Scenario Design Decisions Command
 * 
 * View and manage design decisions in scenario YAML files.
 * 
 * @module commands/scenario/decisions
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
 * Display design decisions
 * 
 * @param {object} scenario - Scenario data
 * @param {boolean} verbose - Show verbose output
 */
function displayDecisions(scenario, verbose) {
  const decisions = scenario.scenario?.design_decisions || [];
  
  if (decisions.length === 0) {
    console.log(chalk.yellow('\n⚠️  No design decisions recorded for this scenario.\n'));
    console.log(chalk.dim('Add one with: diet103 scenario decisions <name> --add\n'));
    return;
  }
  
  console.log(chalk.bold.blue(`\n🧠 Design Decisions (${decisions.length})\n`));
  
  decisions.forEach((decision, index) => {
    console.log(chalk.bold.cyan(`${index + 1}. ${decision.decision}`));
    console.log(chalk.dim('   Reasoning:'), decision.reasoning);
    
    if (verbose && decision.alternatives_considered && decision.alternatives_considered.length > 0) {
      console.log(chalk.dim('   Alternatives considered:'));
      decision.alternatives_considered.forEach(alt => {
        console.log(chalk.dim(`     - ${alt}`));
      });
    }
    
    if (verbose && decision.trade_offs) {
      console.log(chalk.dim('   Trade-offs:'), decision.trade_offs);
    }
    
    if (decision.date) {
      console.log(chalk.dim('   Date:'), decision.date);
    }
    
    console.log(); // Empty line between decisions
  });
}

/**
 * Add a new design decision
 * 
 * @param {string} scenarioPath - Path to scenario file
 * @param {object} data - Scenario data
 * @param {boolean} interactive - Use interactive prompts
 * @param {object} options - Command options
 */
async function addDecision(scenarioPath, data, interactive, options) {
  let newDecision;
  
  if (interactive) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'decision',
        message: 'Decision made:',
        validate: input => input.length >= 10 || 'Please provide a meaningful decision (min 10 characters)'
      },
      {
        type: 'input',
        name: 'reasoning',
        message: 'Reasoning:',
        validate: input => input.length >= 10 || 'Please explain the reasoning (min 10 characters)'
      },
      {
        type: 'input',
        name: 'alternatives',
        message: 'Alternatives considered (comma-separated, optional):',
        default: ''
      },
      {
        type: 'input',
        name: 'trade_offs',
        message: 'Trade-offs (optional):',
        default: ''
      }
    ]);
    
    newDecision = {
      decision: answers.decision,
      reasoning: answers.reasoning,
      date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
    };
    
    if (answers.alternatives.trim()) {
      newDecision.alternatives_considered = answers.alternatives
        .split(',')
        .map(a => a.trim())
        .filter(a => a);
    }
    
    if (answers.trade_offs.trim()) {
      newDecision.trade_offs = answers.trade_offs;
    }
  } else {
    // Non-interactive mode
    if (!options.decision || !options.reasoning) {
      console.error(chalk.red('Error: --decision and --reasoning are required in non-interactive mode'));
      process.exit(1);
    }
    
    newDecision = {
      decision: options.decision,
      reasoning: options.reasoning,
      date: options.date || new Date().toISOString().split('T')[0]
    };
    
    if (options.alternatives) {
      newDecision.alternatives_considered = options.alternatives
        .split(',')
        .map(a => a.trim())
        .filter(a => a);
    }
    
    if (options.tradeOffs) {
      newDecision.trade_offs = options.tradeOffs;
    }
  }
  
  // Ensure design_decisions array exists
  if (!data.scenario.design_decisions) {
    data.scenario.design_decisions = [];
  }
  
  // Add new decision
  data.scenario.design_decisions.push(newDecision);
  
  // Save updated scenario
  await saveScenario(scenarioPath, data);
  
  console.log(chalk.green('\n✓ Design decision added successfully\n'));
  displayDecisions(data, true);
}

/**
 * Main handler for decisions command
 * 
 * @param {string} name - Scenario name
 * @param {object} options - Command options
 */
async function handleDecisions(name, options) {
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
      await addDecision(scenarioPath, data, !options.noInteractive, options);
    } else {
      // Default: display decisions
      displayDecisions(data, options.verbose);
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
 * Create the decisions command
 * 
 * @returns {Command} Configured Commander.js command
 */
export function decisionsCommand() {
  return new Command('decisions')
    .description('View and manage design decisions in scenarios')
    .argument('<name>', 'Scenario name')
    .option('-a, --add', 'Add a new design decision')
    .option('-v, --verbose', 'Show verbose output including all details')
    .option('--no-interactive', 'Disable interactive prompts (requires --decision and --reasoning)')
    .option('-d, --decision <text>', 'Decision made (non-interactive mode)')
    .option('-r, --reasoning <text>', 'Reasoning for the decision (non-interactive mode)')
    .option('--alternatives <list>', 'Comma-separated list of alternatives considered')
    .option('--trade-offs <text>', 'Trade-offs of this decision')
    .option('--date <date>', 'Date of decision (YYYY-MM-DD, defaults to today)')
    .option('--json', 'Output in JSON format')
    .action(handleDecisions)
    .addHelpText('after', `
Examples:
  $ diet103 scenario decisions my-scenario               # View all design decisions
  $ diet103 scenario decisions my-scenario -v            # View with full details
  $ diet103 scenario decisions my-scenario --add         # Add interactively
  
  # Add non-interactively
  $ diet103 scenario decisions my-scenario --add --no-interactive \\
      --decision "Use REST instead of GraphQL" \\
      --reasoning "Simpler to implement and maintain" \\
      --alternatives "GraphQL,gRPC" \\
      --trade-offs "Less flexible querying"
    `);
}

