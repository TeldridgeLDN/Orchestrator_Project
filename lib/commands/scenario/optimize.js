/**
 * Scenario Optimize Command
 * 
 * Analyze and optimize scenario configuration.
 * 
 * @module commands/scenario/optimize
 */

import { Command } from 'commander';
import prompts from 'prompts';
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
 * Load scenario from file
 * 
 * @param {string} filePath - Path to scenario file
 * @returns {Promise<object>} Scenario data
 */
async function loadScenario(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return yaml.load(content);
}

/**
 * Analyze scenario and generate optimization suggestions
 * 
 * @param {object} scenario - Scenario data
 * @returns {Array<object>} Optimization suggestions
 */
function analyzeScenario(scenario) {
  const suggestions = [];
  
  // Check for missing version
  if (!scenario.scenario.version) {
    suggestions.push({
      type: 'missing_field',
      priority: 'medium',
      title: 'Add version field',
      description: 'Version tracking helps manage scenario evolution',
      suggestion: 'Add version: "1.0.0" to scenario configuration',
      autoFix: true
    });
  }
  
  // Check for duplicate step types
  const stepTypes = {};
  scenario.scenario.steps.forEach(step => {
    stepTypes[step.type] = (stepTypes[step.type] || 0) + 1;
  });
  
  Object.entries(stepTypes).forEach(([type, count]) => {
    if (count > 3) {
      suggestions.push({
        type: 'performance',
        priority: 'low',
        title: `Consider batching ${type} operations`,
        description: `${count} steps use type "${type}" - could be optimized with batching`,
        suggestion: 'Group similar operations into batch steps for better performance'
      });
    }
  });
  
  // Check for missing test strategy
  if (!scenario.scenario.testStrategy) {
    suggestions.push({
      type: 'best_practice',
      priority: 'medium',
      title: 'Add test strategy',
      description: 'Define how to test this scenario',
      suggestion: 'Add testStrategy field with test plan'
    });
  }
  
  // Check for long step chains
  const maxDeps = Math.max(...scenario.scenario.steps.map(s => 
    (s.dependencies || []).length
  ));
  
  if (maxDeps > 3) {
    suggestions.push({
      type: 'architecture',
      priority: 'medium',
      title: 'Simplify dependency chain',
      description: 'Some steps have many dependencies which could increase fragility',
      suggestion: 'Consider grouping related steps or using parallel execution'
    });
  }
  
  // Check for missing design decisions
  if (!scenario.scenario.design_decisions || scenario.scenario.design_decisions.length === 0) {
    suggestions.push({
      type: 'documentation',
      priority: 'low',
      title: 'Document design decisions',
      description: 'Design decisions help future maintainers understand choices',
      suggestion: 'Add design_decisions array with rationale for key choices'
    });
  }
  
  // Check trigger configuration
  if (scenario.scenario.trigger.type === 'manual' && !scenario.scenario.trigger.command) {
    suggestions.push({
      type: 'configuration',
      priority: 'high',
      title: 'Add trigger command',
      description: 'Manual triggers should specify a command',
      suggestion: 'Add command field to trigger configuration',
      autoFix: true
    });
  }
  
  return suggestions;
}

/**
 * Display optimization suggestions
 * 
 * @param {Array<object>} suggestions - Optimization suggestions
 */
function displaySuggestions(suggestions) {
  console.log(chalk.bold('\n🔧 Optimization Suggestions\n'));
  
  if (suggestions.length === 0) {
    console.log(chalk.green('✅ No optimizations needed - scenario is well configured!\n'));
    return;
  }
  
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  const sorted = [...suggestions].sort((a, b) => 
    priorityOrder[a.priority] - priorityOrder[b.priority]
  );
  
  sorted.forEach((sug, index) => {
    const priorityColor = {
      high: chalk.red,
      medium: chalk.yellow,
      low: chalk.blue
    }[sug.priority];
    
    console.log(chalk.bold(`${index + 1}. ${sug.title}`));
    console.log(`   Priority: ${priorityColor(sug.priority.toUpperCase())}`);
    console.log(`   Type: ${sug.type}`);
    console.log(`   ${chalk.gray(sug.description)}`);
    console.log(`   ${chalk.cyan('→')} ${sug.suggestion}`);
    if (sug.autoFix) {
      console.log(`   ${chalk.green('✨ Can be auto-fixed')}`);
    }
    console.log();
  });
  
  console.log(chalk.gray(`Found ${suggestions.length} optimization${suggestions.length !== 1 ? 's' : ''}\n`));
}

/**
 * Apply optimizations interactively
 * 
 * @param {object} scenario - Scenario data
 * @param {Array<object>} suggestions - Optimization suggestions
 * @returns {Promise<object>} Updated scenario
 */
async function applyInteractive(scenario, suggestions) {
  const autoFixable = suggestions.filter(s => s.autoFix);
  
  if (autoFixable.length === 0) {
    console.log(chalk.yellow('\n⚠️  No auto-fixable optimizations available\n'));
    return scenario;
  }
  
  console.log(chalk.blue('\n🔧 Interactive Optimization\n'));
  
  for (const sug of autoFixable) {
    const answer = await prompts({
      type: 'confirm',
      name: 'apply',
      message: `Apply: ${sug.title}?`,
      initial: true
    });
    
    if (answer.apply) {
      // Apply auto-fixes
      if (sug.title.includes('version')) {
        scenario.scenario.version = '1.0.0';
      }
      if (sug.title.includes('trigger command')) {
        scenario.scenario.trigger.command = `/${scenario.scenario.name}`;
      }
      console.log(chalk.green(`  ✓ Applied: ${sug.title}`));
    }
  }
  
  return scenario;
}

/**
 * Handle the scenario optimize command
 * 
 * @param {string} name - Scenario name
 * @param {object} options - Command options
 * @param {boolean} options.apply - Apply optimizations automatically
 * @param {boolean} options.interactive - Use interactive mode
 */
async function handleOptimize(name, options) {
  try {
    // Find scenario file
    const filePath = await findScenarioFile(name);
    
    if (!filePath) {
      console.error(chalk.red(`\n❌ Scenario "${name}" not found`));
      console.log(chalk.gray('List available scenarios with:'), chalk.cyan('diet103 scenario list\n'));
      process.exit(1);
    }
    
    // Load scenario
    let scenario = await loadScenario(filePath);
    
    console.log(chalk.gray(`Analyzing scenario: ${name}`));
    
    // Analyze
    const suggestions = analyzeScenario(scenario);
    
    // Display suggestions
    displaySuggestions(suggestions);
    
    // Apply optimizations
    if (options.interactive && suggestions.some(s => s.autoFix)) {
      scenario = await applyInteractive(scenario, suggestions);
      
      // Save changes
      const yamlContent = yaml.dump(scenario, {
        indent: 2,
        lineWidth: 100,
        noRefs: true
      });
      await fs.writeFile(filePath, yamlContent, 'utf-8');
      
      console.log(chalk.green('\n✅ Optimizations applied!\n'));
    } else if (options.apply) {
      console.log(chalk.yellow('\n⚠️  Auto-apply not implemented for all optimization types\n'));
      console.log(chalk.gray('Use'), chalk.cyan(`diet103 scenario optimize ${name} -i`), chalk.gray('for interactive mode\n'));
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Error optimizing scenario:'), error.message);
    process.exit(1);
  }
}

/**
 * Create the 'scenario optimize' command
 * 
 * @returns {Command} Configured Commander.js command
 */
export function optimizeCommand() {
  return new Command('optimize')
    .description('Analyze and optimize scenario configuration')
    .argument('<name>', 'Scenario name')
    .option('-a, --apply', 'Apply optimizations automatically')
    .option('-i, --interactive', 'Use interactive mode to review suggestions')
    .addHelpText('after', `
Examples:
  $ diet103 scenario optimize my-scenario           # Show optimization suggestions
  $ diet103 scenario optimize my-scenario -a        # Apply optimizations
  $ diet103 scenario optimize my-scenario -i        # Interactive optimization
    `)
    .action(handleOptimize);
}

