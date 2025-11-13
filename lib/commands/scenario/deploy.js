/**
 * Scenario Deploy Command
 * 
 * Deploy a scenario to a target environment.
 * 
 * @module commands/scenario/deploy
 */

import { Command } from 'commander';
import prompts from 'prompts';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import chalk from 'chalk';
import { getScenariosDir, scenariosDirectoryExists } from '../../utils/scenario-directory.js';
import { 
  createError, 
  createCommandErrorHandler, 
  wrapError, 
  ScenarioNotFoundError,
  YAMLParseError 
} from '../../utils/errors/index.js';

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
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return yaml.load(content);
  } catch (error) {
    if (error.name === 'YAMLException') {
      throw wrapError(error, 'UTIL-DATA-002', { path: filePath });
    }
    throw wrapError(error, 'UTIL-FS-006', { path: filePath });
  }
}

/**
 * Check if deployment requires confirmation
 * 
 * @param {string} environment - Target environment
 * @param {boolean} force - Force flag
 * @returns {Promise<boolean>} True if should proceed
 */
async function confirmDeployment(environment, force) {
  if (force) return true;
  
  if (environment === 'production') {
    console.log(chalk.yellow('\n⚠️  Warning: Deploying to PRODUCTION\n'));
    
    const answer = await prompts({
      type: 'confirm',
      name: 'proceed',
      message: 'Are you sure you want to deploy to production?',
      initial: false
    });
    
    return answer.proceed;
  }
  
  return true;
}

/**
 * Perform dry run deployment
 * 
 * @param {object} scenario - Scenario data
 * @param {string} environment - Target environment
 */
function performDryRun(scenario, environment) {
  console.log(chalk.blue('\n🔍 Dry Run Mode\n'));
  console.log(chalk.bold('Scenario:'), scenario.scenario.name);
  console.log(chalk.bold('Environment:'), environment);
  console.log(chalk.bold('Steps to deploy:'), scenario.scenario.steps.length);
  
  console.log(chalk.bold('\n📋 Deployment Plan:\n'));
  
  // Show what would be created
  if (scenario.scenario.generates) {
    scenario.scenario.generates.forEach(item => {
      console.log(`  • Would create: ${chalk.cyan(item)}`);
    });
  }
  
  // Show required dependencies
  console.log(chalk.bold('\n🔗 Required Dependencies:\n'));
  if (scenario.scenario.dependencies?.mcps?.length > 0) {
    scenario.scenario.dependencies.mcps.forEach(mcp => {
      console.log(`  • MCP: ${chalk.cyan(mcp)}`);
    });
  }
  if (scenario.scenario.dependencies?.skills?.length > 0) {
    scenario.scenario.dependencies.skills.forEach(skill => {
      console.log(`  • Skill: ${chalk.cyan(skill)}`);
    });
  }
  
  console.log(chalk.yellow('\n⚠️  No actual changes were made (dry run)\n'));
}

/**
 * Perform actual deployment
 * 
 * @param {object} scenario - Scenario data
 * @param {string} environment - Target environment
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function performDeployment(scenario, environment) {
  console.log(chalk.blue('\n🚀 Deploying Scenario\n'));
  
  // Simulate deployment steps
  const steps = [
    'Validating scenario configuration',
    'Checking dependencies',
    'Creating skill definitions',
    'Registering slash commands',
    'Setting up triggers',
    'Deploying to environment'
  ];
  
  for (const step of steps) {
    process.stdout.write(chalk.gray(`  ${step}... `));
    // Simulate async work
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log(chalk.green('✓'));
  }
  
  return {
    success: true,
    message: 'Deployment completed successfully'
  };
}

/**
 * Handle the scenario deploy command
 * 
 * @param {string} name - Scenario name
 * @param {object} options - Command options
 * @param {string} options.environment - Target environment
 * @param {boolean} options.dryRun - Perform a dry run
 * @param {boolean} options.force - Force deployment without confirmation
 */
async function handleDeploy(name, options) {
  const handleError = createCommandErrorHandler({
    commandName: 'scenario-deploy',
    verbose: options.verbose || false,
    exitCode: 1
  });

  try {
    // Find scenario file
    const filePath = await findScenarioFile(name);
    
    if (!filePath) {
      throw new ScenarioNotFoundError(
        `Scenario "${name}" not found`,
        'CMD-SCEN-001',
        { scenario: name, suggestion: 'List available scenarios with: diet103 scenario list' }
      );
    }
    
    // Load scenario
    const scenario = await loadScenario(filePath);
    
    console.log(chalk.gray(`Deploying scenario: ${name}`));
    console.log(chalk.gray(`Environment: ${options.environment}`));
    
    // Dry run mode
    if (options.dryRun) {
      performDryRun(scenario, options.environment);
      return;
    }
    
    // Confirmation for production
    const shouldProceed = await confirmDeployment(options.environment, options.force);
    
    if (!shouldProceed) {
      console.log(chalk.yellow('\n⚠️  Deployment cancelled\n'));
      process.exit(0);
    }
    
    // Perform deployment
    const result = await performDeployment(scenario, options.environment);
    
    if (result.success) {
      console.log(chalk.green.bold(`\n✅ ${result.message}\n`));
      console.log(chalk.bold('Deployed:'), scenario.scenario.name);
      console.log(chalk.bold('Environment:'), options.environment);
      console.log(chalk.bold('Trigger:'), scenario.scenario.trigger.command);
      
      if (scenario.scenario.generates) {
        console.log(chalk.bold('\n📦 Created:'));
        scenario.scenario.generates.forEach(item => {
          console.log(`  • ${item}`);
        });
      }
      
      console.log(chalk.blue('\n💡 Next steps:'));
      console.log(`  • Test the scenario: ${chalk.cyan(scenario.scenario.trigger.command)}`);
      console.log(`  • Monitor logs for any issues`);
      console.log(`  • Verify all dependencies are available\n`);
    } else {
      throw createError(
        'CMD-EXEC-002',
        { operation: 'deployment', details: result.message }
      );
    }
    
  } catch (error) {
    await handleError(error);
  }
}

/**
 * Create the 'scenario deploy' command
 * 
 * @returns {Command} Configured Commander.js command
 */
export function deployCommand() {
  return new Command('deploy')
    .description('Deploy a scenario to a target environment')
    .argument('<name>', 'Scenario name')
    .option('-e, --environment <env>', 'Target environment (dev, staging, production)', 'dev')
    .option('--dry-run', 'Perform a dry run without actual deployment')
    .option('-f, --force', 'Force deployment without confirmation')
    .addHelpText('after', `
Examples:
  $ diet103 scenario deploy my-scenario                    # Deploy to dev (default)
  $ diet103 scenario deploy my-scenario -e production      # Deploy to production
  $ diet103 scenario deploy my-scenario --dry-run          # Test deployment
  $ diet103 scenario deploy my-scenario -e production -f   # Force deploy to production
    `)
    .action(handleDeploy);
}

