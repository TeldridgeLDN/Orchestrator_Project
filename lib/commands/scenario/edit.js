/**
 * Scenario Edit Command
 * 
 * Edit an existing scenario configuration.
 * 
 * @module commands/scenario/edit
 */

import { Command } from 'commander';
import { spawn } from 'child_process';
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
 * Open file in external editor
 * 
 * @param {string} filePath - Path to file
 * @param {string} editor - Editor command
 * @returns {Promise<boolean>} True if successful
 */
async function openInEditor(filePath, editor) {
  return new Promise((resolve, reject) => {
    const editorCmd = editor || process.env.EDITOR || process.env.VISUAL || 'vi';
    
    console.log(chalk.gray(`Opening ${filePath} in ${editorCmd}...`));
    
    const child = spawn(editorCmd, [filePath], {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('exit', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`Editor exited with code ${code}`));
      }
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
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
 * Save scenario to file
 * 
 * @param {string} filePath - Path to scenario file
 * @param {object} data - Scenario data
 */
async function saveScenario(filePath, data) {
  const yamlContent = yaml.dump(data, {
    indent: 2,
    lineWidth: 100,
    noRefs: true
  });
  
  await fs.writeFile(filePath, yamlContent, 'utf-8');
}

/**
 * Interactive editing workflow
 * 
 * @param {string} filePath - Path to scenario file
 * @param {object} scenario - Current scenario data
 */
async function interactiveEdit(filePath, scenario) {
  console.log(chalk.blue('\n✏️  Edit Scenario\n'));
  
  const answers = await prompts([
    {
      type: 'text',
      name: 'description',
      message: 'Description:',
      initial: scenario.scenario.description
    },
    {
      type: 'select',
      name: 'category',
      message: 'Category:',
      initial: ['business_process', 'data_pipeline', 'automation', 'integration', 'other']
        .indexOf(scenario.scenario.category),
      choices: [
        { title: 'business_process', value: 'business_process' },
        { title: 'data_pipeline', value: 'data_pipeline' },
        { title: 'automation', value: 'automation' },
        { title: 'integration', value: 'integration' },
        { title: 'other', value: 'other' }
      ]
    },
    {
      type: 'select',
      name: 'triggerType',
      message: 'Trigger type:',
      initial: ['manual', 'scheduled', 'webhook', 'hybrid']
        .indexOf(scenario.scenario.trigger?.type),
      choices: [
        { title: 'Manual - Via slash command', value: 'manual' },
        { title: 'Scheduled - Run on a schedule', value: 'scheduled' },
        { title: 'Webhook - HTTP endpoint', value: 'webhook' },
        { title: 'Hybrid - Multiple trigger types', value: 'hybrid' }
      ]
    },
    {
      type: 'confirm',
      name: 'editSteps',
      message: 'Edit steps in external editor?',
      initial: false
    }
  ]);
  
  if (!answers.description) {
    console.log(chalk.yellow('\nEdit cancelled.'));
    return false;
  }
  
  // Update scenario
  scenario.scenario.description = answers.description;
  scenario.scenario.category = answers.category;
  scenario.scenario.trigger.type = answers.triggerType;
  
  // Save changes
  await saveScenario(filePath, scenario);
  
  console.log(chalk.green('\n✅ Scenario updated successfully!\n'));
  
  // Optionally edit steps in external editor
  if (answers.editSteps) {
    await openInEditor(filePath, process.env.EDITOR);
  }
  
  return true;
}

/**
 * Validate YAML syntax
 * 
 * @param {string} filePath - Path to file
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
async function validateYaml(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    yaml.load(content);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error.message 
    };
  }
}

/**
 * Handle the scenario edit command
 * 
 * @param {string} name - Scenario name
 * @param {object} options - Command options
 * @param {boolean} options.interactive - Use interactive mode
 * @param {string} options.editor - Editor to use
 */
async function handleEdit(name, options) {
  try {
    // Find scenario file
    const filePath = await findScenarioFile(name);
    
    if (!filePath) {
      console.error(chalk.red(`\n❌ Scenario "${name}" not found`));
      console.log(chalk.gray('List available scenarios with:'), chalk.cyan('diet103 scenario list\n'));
      process.exit(1);
    }
    
    // Load scenario
    const scenario = await loadScenario(filePath);
    
    // Interactive mode
    if (options.interactive) {
      const success = await interactiveEdit(filePath, scenario);
      if (!success) {
        process.exit(0);
      }
    } 
    // Editor mode (default)
    else {
      await openInEditor(filePath, options.editor);
      
      // Validate YAML after editing
      console.log(chalk.gray('\nValidating YAML syntax...'));
      const validation = await validateYaml(filePath);
      
      if (validation.valid) {
        console.log(chalk.green('✅ YAML syntax is valid'));
        console.log(chalk.gray('Verify changes with:'), chalk.cyan(`diet103 scenario show ${name}\n`));
      } else {
        console.log(chalk.red('❌ YAML syntax error:'), validation.error);
        console.log(chalk.yellow('Please fix the syntax errors and try again.\n'));
        process.exit(1);
      }
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Error editing scenario:'), error.message);
    process.exit(1);
  }
}

/**
 * Create the 'scenario edit' command
 * 
 * @returns {Command} Configured Commander.js command
 */
export function editCommand() {
  return new Command('edit')
    .description('Edit an existing scenario configuration')
    .argument('<name>', 'Scenario name')
    .option('-i, --interactive', 'Use interactive prompt-based editing')
    .option('-e, --editor <editor>', 'Editor to use (defaults to $EDITOR)')
    .addHelpText('after', `
Examples:
  $ diet103 scenario edit my-scenario              # Open in default editor
  $ diet103 scenario edit my-scenario -i           # Interactive editing
  $ diet103 scenario edit my-scenario --editor vim # Use specific editor
    `)
    .action(handleEdit);
}

