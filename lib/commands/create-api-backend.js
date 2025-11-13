/**
 * Create API Backend Command
 * 
 * Creates a new API backend project using the template
 * @module lib/commands/create-api-backend
 */

import path from 'path';
import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { buildApiBackend, validateContext, DEFAULT_CONTEXT } from '../templates/api-backend-builder.js';
import { fileExists } from '../utils/file-generator.js';

/**
 * Interactive prompts for project configuration
 * 
 * @param {Object} options - Command options
 * @returns {Promise<Object>} User responses
 */
async function promptForConfiguration(options) {
  const questions = [];

  if (!options.name) {
    questions.push({
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: 'my-api',
      validate: (input) => {
        if (!/^[a-z0-9-]+$/.test(input)) {
          return 'Project name must be lowercase with hyphens only';
        }
        return true;
      }
    });
  }

  if (!options.description) {
    questions.push({
      type: 'input',
      name: 'description',
      message: 'Project description:',
      default: 'RESTful API backend'
    });
  }

  if (!options.framework) {
    questions.push({
      type: 'list',
      name: 'framework',
      message: 'Choose a framework:',
      choices: [
        { name: 'Express (recommended for beginners)', value: 'express' },
        { name: 'Fastify (high performance)', value: 'fastify' }
      ],
      default: 'express'
    });
  }

  if (options.database === undefined) {
    questions.push({
      type: 'confirm',
      name: 'includeDatabase',
      message: 'Include database configuration?',
      default: false
    });
  }

  if (!options.author) {
    questions.push({
      type: 'input',
      name: 'author',
      message: 'Author name:',
      default: ''
    });
  }

  const answers = await inquirer.prompt(questions);

  return {
    projectName: options.name || answers.projectName,
    description: options.description || answers.description,
    framework: options.framework || answers.framework,
    includeDatabase: options.database !== undefined ? options.database : answers.includeDatabase,
    author: options.author || answers.author,
    license: options.license || 'MIT'
  };
}

/**
 * Create API backend project
 * 
 * @param {string} targetDir - Target directory
 * @param {Object} options - Command options
 */
async function createApiBackend(targetDir, options) {
  console.log(chalk.blue.bold('\n🚀 Creating API Backend Project\n'));

  // Get configuration
  const context = await promptForConfiguration(options);

  // Validate context
  const validation = validateContext(context);
  if (!validation.valid) {
    console.error(chalk.red('\n❌ Invalid configuration:'));
    validation.errors.forEach(error => {
      console.error(chalk.red(`  - ${error}`));
    });
    process.exit(1);
  }

  // Resolve target directory
  const resolvedTargetDir = path.resolve(targetDir || context.projectName);

  // Check if directory exists
  const exists = await fileExists(resolvedTargetDir);
  if (exists && !options.force) {
    console.error(chalk.red(`\n❌ Directory already exists: ${resolvedTargetDir}`));
    console.log(chalk.yellow('Use --force to overwrite\n'));
    process.exit(1);
  }

  // Display configuration
  console.log(chalk.cyan('Configuration:'));
  console.log(chalk.gray(`  Name: ${context.projectName}`));
  console.log(chalk.gray(`  Framework: ${context.framework}`));
  console.log(chalk.gray(`  Database: ${context.includeDatabase ? 'Yes' : 'No'}`));
  console.log(chalk.gray(`  Target: ${resolvedTargetDir}\n`));

  // Confirm if not using --yes flag
  if (!options.yes) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Create project with this configuration?',
        default: true
      }
    ]);

    if (!confirm) {
      console.log(chalk.yellow('\n❌ Cancelled\n'));
      process.exit(0);
    }
  }

  // Build project
  const spinner = ora('Creating project structure...').start();

  try {
    const result = await buildApiBackend(resolvedTargetDir, context);

    if (!result.success) {
      spinner.fail(chalk.red('Failed to create project'));
      console.error(chalk.red(`\nError: ${result.message}\n`));
      process.exit(1);
    }

    spinner.succeed(chalk.green('Project created successfully!'));

    // Display summary
    console.log(chalk.green.bold('\n✅ API Backend Project Created!\n'));
    console.log(chalk.cyan('📁 Location:'), resolvedTargetDir);
    console.log(chalk.cyan('📦 Files created:'), result.files.length);
    console.log();

    // Next steps
    console.log(chalk.yellow.bold('Next Steps:\n'));
    console.log(chalk.gray(`  1. cd ${path.basename(resolvedTargetDir)}`));
    console.log(chalk.gray('  2. npm install'));
    console.log(chalk.gray('  3. cp .env.example .env'));
    console.log(chalk.gray('  4. Edit .env with your configuration'));
    console.log(chalk.gray('  5. npm run dev\n'));

    console.log(chalk.blue('💡 Tip:'), 'Run', chalk.cyan('npm test'), 'to verify the setup\n');

  } catch (error) {
    spinner.fail(chalk.red('Failed to create project'));
    console.error(chalk.red(`\nError: ${error.message}\n`));
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Register command with CLI
 * 
 * @param {Object} cli - Commander program instance
 */
export function register(cli) {
  cli
    .command('create-api-backend [directory]')
    .description('Create a new API backend project')
    .option('-n, --name <name>', 'Project name')
    .option('-d, --description <description>', 'Project description')
    .option('-f, --framework <framework>', 'Framework (express or fastify)')
    .option('--database', 'Include database configuration')
    .option('--no-database', 'Exclude database configuration')
    .option('-a, --author <author>', 'Author name')
    .option('-l, --license <license>', 'License (default: MIT)')
    .option('--force', 'Overwrite existing directory')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--verbose', 'Show detailed error messages')
    .action(createApiBackend);
}

/**
 * Execute command directly (for programmatic use)
 * 
 * @param {string} targetDir - Target directory
 * @param {Object} context - Template context
 * @returns {Promise<Object>} Result object
 */
export async function execute(targetDir, context = {}) {
  const mergedContext = { ...DEFAULT_CONTEXT, ...context };
  const validation = validateContext(mergedContext);

  if (!validation.valid) {
    return {
      success: false,
      message: 'Invalid context',
      errors: validation.errors
    };
  }

  return await buildApiBackend(targetDir, mergedContext);
}

export default {
  register,
  execute
};

