/**
 * Scenario Remove Command
 * 
 * Remove a scenario and its associated files.
 * 
 * @module commands/scenario/remove
 */

import { Command } from 'commander';
import prompts from 'prompts';
import fs from 'fs/promises';
import path from 'path';
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
 * Confirm removal
 * 
 * @param {string} name - Scenario name
 * @param {boolean} force - Force flag
 * @returns {Promise<boolean>} True if should proceed
 */
async function confirmRemoval(name, force) {
  if (force) return true;
  
  console.log(chalk.yellow(`\n⚠️  Warning: This will permanently delete scenario "${name}"\n`));
  
  const answer = await prompts({
    type: 'confirm',
    name: 'proceed',
    message: 'Are you sure you want to remove this scenario?',
    initial: false
  });
  
  return answer.proceed;
}

/**
 * Handle the scenario remove command
 * 
 * @param {string} name - Scenario name
 * @param {object} options - Command options
 * @param {boolean} options.force - Force removal without confirmation
 * @param {boolean} options.keepData - Keep scenario data files
 */
async function handleRemove(name, options) {
  try {
    // Find scenario file
    const filePath = await findScenarioFile(name);
    
    if (!filePath) {
      console.error(chalk.red(`\n❌ Scenario "${name}" not found`));
      console.log(chalk.gray('List available scenarios with:'), chalk.cyan('diet103 scenario list\n'));
      process.exit(1);
    }
    
    // Confirm removal
    const shouldProceed = await confirmRemoval(name, options.force);
    
    if (!shouldProceed) {
      console.log(chalk.yellow('\n⚠️  Removal cancelled\n'));
      process.exit(0);
    }
    
    // Remove scenario file
    console.log(chalk.gray(`\nRemoving scenario: ${name}`));
    await fs.unlink(filePath);
    
    console.log(chalk.green('\n✅ Scenario removed successfully!\n'));
    console.log(chalk.bold('Removed:'), name);
    console.log(chalk.bold('File:'), filePath);
    
    if (options.keepData) {
      console.log(chalk.yellow('\n💾 Data files were preserved (--keep-data flag)\n'));
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Error removing scenario:'), error.message);
    process.exit(1);
  }
}

/**
 * Create the 'scenario remove' command
 * 
 * @returns {Command} Configured Commander.js command
 */
export function removeCommand() {
  return new Command('remove')
    .alias('rm')
    .description('Remove a scenario and its associated files')
    .argument('<name>', 'Scenario name')
    .option('-f, --force', 'Force removal without confirmation')
    .option('--keep-data', 'Keep scenario data files')
    .addHelpText('after', `
Examples:
  $ diet103 scenario remove my-scenario              # Remove with confirmation
  $ diet103 scenario rm my-scenario -f               # Force remove
  $ diet103 scenario remove my-scenario --keep-data  # Remove but keep data
    `)
    .action(handleRemove);
}

