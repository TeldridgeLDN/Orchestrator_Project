/**
 * Quickstart Command
 * 
 * Interactive setup wizard with recommended settings for new projects.
 * Part of Phase 3 Feature 4: Enhanced Help & Documentation
 * 
 * @version 1.3.0
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { validateCommand } from './validate.js';
import { healthCommand } from './health.js';
import { registerCommand } from './register.js';
import { classifyCommand } from './file-lifecycle.js';

/**
 * Recommended settings for different project types
 */
const projectTypeRecommendations = {
  'web-app': {
    name: 'Web Application',
    description: 'React, Next.js, Vue, or similar frontend projects',
    settings: {
      threshold: 75,
      autoRepair: true,
      includeTaskmaster: true,
      fileLifecycle: true,
      shellIntegration: true
    }
  },
  'api-backend': {
    name: 'API Backend',
    description: 'Express, Fastify, or other backend APIs',
    settings: {
      threshold: 80,
      autoRepair: true,
      includeTaskmaster: true,
      fileLifecycle: true,
      shellIntegration: true
    }
  },
  'cli-tool': {
    name: 'CLI Tool',
    description: 'Command-line applications and utilities',
    settings: {
      threshold: 70,
      autoRepair: true,
      includeTaskmaster: false,
      fileLifecycle: false,
      shellIntegration: true
    }
  },
  'library': {
    name: 'Library/Package',
    description: 'NPM packages, Python libraries, etc.',
    settings: {
      threshold: 85,
      autoRepair: true,
      includeTaskmaster: false,
      fileLifecycle: false,
      shellIntegration: false
    }
  },
  'research': {
    name: 'Research/Prototype',
    description: 'Experimental projects and prototypes',
    settings: {
      threshold: 60,
      autoRepair: true,
      includeTaskmaster: true,
      fileLifecycle: true,
      shellIntegration: false
    }
  },
  'custom': {
    name: 'Custom Configuration',
    description: 'Choose your own settings',
    settings: null // Will prompt for each setting
  }
};

/**
 * Welcome message
 */
function displayWelcome() {
  console.log(chalk.bold.cyan('\n' + '='.repeat(60)));
  console.log(chalk.bold.cyan('  🚀 diet103 Quickstart Wizard'));
  console.log(chalk.bold.cyan('='.repeat(60) + '\n'));
  console.log(chalk.dim('This wizard will help you set up your project with recommended'));
  console.log(chalk.dim('settings based on your project type and requirements.\n'));
}

/**
 * Gather user preferences
 */
async function gatherPreferences(options) {
  const questions = [
    {
      type: 'list',
      name: 'projectType',
      message: 'What type of project is this?',
      choices: Object.entries(projectTypeRecommendations).map(([key, config]) => ({
        name: `${config.name} - ${chalk.dim(config.description)}`,
        value: key,
        short: config.name
      })),
      when: () => !options.yes
    }
  ];
  
  const answers = await inquirer.prompt(questions);
  
  // If using --yes flag, use web-app as default
  const projectType = options.yes ? 'web-app' : answers.projectType;
  const recommended = projectTypeRecommendations[projectType].settings;
  
  // For custom type or if not using --yes, prompt for each setting
  let settings;
  if (projectType === 'custom' || (!options.yes && !recommended)) {
    const customQuestions = [
      {
        type: 'number',
        name: 'threshold',
        message: 'Minimum validation score required (0-100):',
        default: 75,
        validate: (val) => val >= 0 && val <= 100 || 'Must be between 0 and 100'
      },
      {
        type: 'confirm',
        name: 'autoRepair',
        message: 'Enable automatic repair of missing components?',
        default: true
      },
      {
        type: 'confirm',
        name: 'includeTaskmaster',
        message: 'Include TaskMaster for task management?',
        default: true
      },
      {
        type: 'confirm',
        name: 'fileLifecycle',
        message: 'Enable File Lifecycle Management (UFC)?',
        default: true
      },
      {
        type: 'confirm',
        name: 'shellIntegration',
        message: 'Set up terminal prompt integration?',
        default: false
      }
    ];
    
    settings = await inquirer.prompt(customQuestions);
  } else {
    settings = recommended;
    
    // Show recommended settings
    if (!options.yes) {
      console.log(chalk.bold('\n📋 Recommended Settings:\n'));
      console.log(`  ${chalk.dim('Validation threshold:')}  ${settings.threshold}/100`);
      console.log(`  ${chalk.dim('Auto-repair:')}          ${settings.autoRepair ? chalk.green('✓ Enabled') : chalk.red('✗ Disabled')}`);
      console.log(`  ${chalk.dim('TaskMaster:')}           ${settings.includeTaskmaster ? chalk.green('✓ Included') : chalk.dim('Not included')}`);
      console.log(`  ${chalk.dim('File Lifecycle:')}       ${settings.fileLifecycle ? chalk.green('✓ Enabled') : chalk.dim('Disabled')}`);
      console.log(`  ${chalk.dim('Shell Integration:')}    ${settings.shellIntegration ? chalk.green('✓ Enabled') : chalk.dim('Disabled')}`);
      
      const { confirmSettings } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmSettings',
          message: 'Use these recommended settings?',
          default: true
        }
      ]);
      
      if (!confirmSettings) {
        console.log(chalk.dim('\n💡 Run \'diet103 quickstart\' again and choose "Custom Configuration" for full control.\n'));
        return null;
      }
    }
  }
  
  return { projectType, settings };
}

/**
 * Step 1: Project Validation
 */
async function runValidation(settings, options) {
  if (options.skipValidation) {
    console.log(chalk.dim('\n⏭️  Skipping validation (--skip-validation flag)\n'));
    return { skipped: true };
  }
  
  console.log(chalk.bold('\n📝 Step 1: Project Validation\n'));
  const spinner = ora('Validating project structure...').start();
  
  try {
    // Run validation command programmatically
    await validateCommand(
      process.cwd(),
      { repair: settings.autoRepair, threshold: settings.threshold.toString(), verbose: false }
    );
    
    spinner.succeed('Project validated successfully');
    return { success: true };
  } catch (error) {
    spinner.fail('Validation encountered issues');
    console.log(chalk.yellow('\n⚠️  Some validation issues were found.'));
    console.log(chalk.dim('   Run \'diet103 validate --verbose\' for details.\n'));
    return { success: false, error: error && error.message ? error.message : 'Unknown error' };
  }
}

/**
 * Step 2: Health Check
 */
async function runHealthCheck(options) {
  if (options.skipHealth) {
    console.log(chalk.dim('\n⏭️  Skipping health check (--skip-health flag)\n'));
    return { skipped: true };
  }
  
  console.log(chalk.bold('\n🏥 Step 2: Health Check\n'));
  const spinner = ora('Calculating project health...').start();
  
  try {
    await healthCommand(
      process.cwd(),
      { update: true, verbose: false }
    );
    
    spinner.succeed('Health check complete');
    return { success: true };
  } catch (error) {
    spinner.fail('Health check encountered issues');
    console.log(chalk.yellow('\n⚠️  Could not complete health check.'));
    console.log(chalk.dim(`   ${error && error.message ? error.message : 'Unknown error'}\n`));
    return { success: false, error: error && error.message ? error.message : 'Unknown error' };
  }
}

/**
 * Step 3: Register Project
 */
async function registerProject(settings) {
  console.log(chalk.bold('\n📋 Step 3: Project Registration\n'));
  const spinner = ora('Registering project...').start();
  
  try {
    const projectPath = process.cwd();
    const projectName = path.basename(projectPath);
    
    // Override process.exit temporarily to prevent register command from exiting
    const originalExit = process.exit;
    let exitPrevented = false;
    process.exit = (code) => {
      exitPrevented = true;
      // Don't actually exit, just flag it
    };
    
    try {
      await registerCommand(
        projectPath,
        { name: projectName, threshold: settings.threshold.toString(), autoRepair: settings.autoRepair, verbose: false }
      );
    } finally {
      // Restore original process.exit
      process.exit = originalExit;
    }
    
    spinner.succeed('Project registered successfully');
    return { success: true };
  } catch (error) {
    // Registration might fail if already registered - that's okay
    if (error && error.message && error.message.includes('already registered')) {
      spinner.info('Project already registered');
      return { success: true, alreadyRegistered: true };
    }
    
    spinner.fail('Registration encountered issues');
    console.log(chalk.yellow('\n⚠️  Could not register project.'));
    console.log(chalk.dim(`   ${error && error.message ? error.message : 'Unknown error'}\n`));
    return { success: false, error: error && error.message ? error.message : 'Unknown error' };
  }
}

/**
 * Step 4: File Lifecycle Classification
 */
async function classifyFiles(settings) {
  if (!settings.fileLifecycle) {
    console.log(chalk.dim('\n⏭️  Skipping file lifecycle (not enabled)\n'));
    return { skipped: true };
  }
  
  console.log(chalk.bold('\n📁 Step 4: File Classification\n'));
  const spinner = ora('Classifying files...').start();
  
  try {
    await classifyCommand(
      process.cwd(),
      { verbose: false }
    );
    
    spinner.succeed('Files classified successfully');
    return { success: true };
  } catch (error) {
    spinner.fail('Classification encountered issues');
    console.log(chalk.yellow('\n⚠️  Could not classify files.'));
    console.log(chalk.dim('   Run \'diet103 file-lifecycle classify --verbose\' for details.\n'));
    return { success: false, error: error && error.message ? error.message : 'Unknown error' };
  }
}

/**
 * Display next steps
 */
function displayNextSteps(settings, results) {
  console.log(chalk.bold.green('\n' + '='.repeat(60)));
  console.log(chalk.bold.green('  ✅ Quickstart Complete!'));
  console.log(chalk.bold.green('='.repeat(60) + '\n'));
  
  console.log(chalk.bold('📚 Next Steps:\n'));
  
  // Suggest running guide for failed steps
  const failedSteps = [];
  if (results.validation && !results.validation.success) failedSteps.push('validation');
  if (results.health && !results.health.success) failedSteps.push('health');
  if (results.files && !results.files.success) failedSteps.push('files');
  
  if (failedSteps.length > 0) {
    console.log(chalk.yellow('⚠️  Some steps encountered issues. Learn more:'));
    failedSteps.forEach(step => {
      console.log(chalk.dim(`   • diet103 guide --topic ${step}`));
    });
    console.log('');
  }
  
  // General next steps
  console.log(chalk.cyan('1. Learn common workflows:'));
  console.log(chalk.dim('   $ diet103 guide\n'));
  
  console.log(chalk.cyan('2. Check project health anytime:'));
  console.log(chalk.dim('   $ diet103 health --verbose\n'));
  
  console.log(chalk.cyan('3. Validate project structure:'));
  console.log(chalk.dim('   $ diet103 validate\n'));
  
  if (settings.fileLifecycle) {
    console.log(chalk.cyan('4. View file lifecycle statistics:'));
    console.log(chalk.dim('   $ diet103 file-lifecycle stats\n'));
  }
  
  if (settings.includeTaskmaster) {
    console.log(chalk.cyan('5. Set up TaskMaster (requires API keys):'));
    console.log(chalk.dim('   • Configure .mcp.json with your API keys'));
    console.log(chalk.dim('   • Run: task-master init'));
    console.log(chalk.dim('   • See: Docs/TASKMASTER_INTEGRATION.md\n'));
  }
  
  console.log(chalk.bold('📖 Documentation:\n'));
  console.log(chalk.dim('   • Full reference:  Docs/CLI_REFERENCE.md'));
  console.log(chalk.dim('   • Getting started: Docs/GETTING_STARTED.md'));
  console.log(chalk.dim('   • Troubleshooting: Docs/TROUBLESHOOTING.md\n'));
}

/**
 * Main quickstart command handler
 */
export async function quickstartCommand(options) {
  try {
    displayWelcome();
    
    // Gather preferences
    const preferences = await gatherPreferences(options);
    if (!preferences) {
      return; // User cancelled
    }
    
    const { projectType, settings } = preferences;
    
    // Run setup steps
    console.log(chalk.bold('\n🔧 Running Setup Steps...\n'));
    console.log(chalk.dim(`Project Type: ${projectTypeRecommendations[projectType].name}\n`));
    
    const results = {};
    
    // Step 1: Validation
    results.validation = await runValidation(settings, options);
    
    // Step 2: Health Check
    results.health = await runHealthCheck(options);
    
    // Step 3: Registration
    results.registration = await registerProject(settings);
    
    // Step 4: File Classification
    results.files = await classifyFiles(settings);
    
    // Display next steps
    displayNextSteps(settings, results);
    
  } catch (error) {
    if (error.message.includes('User force closed')) {
      console.log(chalk.dim('\n\n👋 Quickstart cancelled. Run \'diet103 quickstart\' anytime to resume.\n'));
      return;
    }
    
    console.error(chalk.red('\n❌ Error running quickstart:'), error.message);
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

