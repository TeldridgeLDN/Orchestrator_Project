/**
 * Scenario Scaffold Command
 * 
 * Generates orchestrator components from scenario definitions
 */

import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import path from 'path';
import { scaffoldScenario, validateBeforeScaffold, previewScaffold } from '../../utils/scaffold-workflow.js';
import { getScenariosDir, scenariosDirectoryExists } from '../../utils/scenario-directory.js';

/**
 * Handle scaffold command
 * 
 * @param {string} scenarioName - Name of scenario to scaffold
 * @param {Object} options - Command options
 */
async function handleScaffold(scenarioName, options) {
  try {
    // Validate scenarios directory exists
    if (!scenariosDirectoryExists()) {
      console.error(chalk.red('✗ Scenarios directory not found'));
      console.log(chalk.dim('Run "diet103 scenario create" to set up scenarios'));
      process.exit(1);
    }

    // Find scenario file
    const scenariosDir = getScenariosDir();
    const scenarioPath = path.join(scenariosDir, `${scenarioName}.yaml`);

    // Validate scenario file exists
    try {
      const fs = await import('fs/promises');
      await fs.access(scenarioPath);
    } catch {
      console.error(chalk.red(`✗ Scenario "${scenarioName}" not found`));
      console.log(chalk.dim(`Looking for: ${scenarioPath}`));
      process.exit(1);
    }

    console.log(chalk.cyan('🔍 Validating scenario...'));

    // Pre-flight validation
    const validation = await validateBeforeScaffold(scenarioPath);

    if (!validation.valid) {
      console.error(chalk.red('✗ Scenario validation failed'));
      validation.errors.forEach((error, index) => {
        console.log(chalk.red(`  ${index + 1}. ${error.message}`));
        if (error.path) {
          console.log(chalk.dim(`     Path: ${error.path}`));
        }
      });
      process.exit(1);
    }

    console.log(chalk.green('✓ Scenario validated'));
    console.log('');

    // Display what will be generated
    console.log(chalk.bold('Scenario Details:'));
    console.log(`  Name: ${chalk.cyan(validation.metadata.name)}`);
    console.log(`  Description: ${validation.metadata.description}`);
    console.log(`  Category: ${validation.metadata.category}`);
    console.log(`  Steps: ${validation.metadata.stepCount}`);
    console.log('');

    console.log(chalk.bold('Will Generate:'));
    if (validation.targets.skills.length > 0) {
      console.log(chalk.green(`  ✓ ${validation.targets.skills.length} skill(s)`));
      validation.targets.skills.forEach(skill => {
        console.log(chalk.dim(`    - ${skill}`));
      });
    }
    if (validation.targets.commands.length > 0) {
      console.log(chalk.green(`  ✓ ${validation.targets.commands.length} command(s)`));
      validation.targets.commands.forEach(cmd => {
        console.log(chalk.dim(`    - ${cmd}`));
      });
    }
    if (validation.targets.hooks.length > 0) {
      console.log(chalk.green(`  ✓ ${validation.targets.hooks.length} hook(s)`));
      validation.targets.hooks.forEach(hook => {
        console.log(chalk.dim(`    - ${hook}`));
      });
    }
    if (validation.metadata.mcpDependencies.length > 0) {
      console.log(chalk.yellow(`  ⚙  MCP configuration (manual merge required)`));
      validation.metadata.mcpDependencies.forEach(mcp => {
        console.log(chalk.dim(`    - ${mcp}`));
      });
    }
    console.log('');

    // Dry run mode
    if (options.dryRun) {
      console.log(chalk.yellow('🔍 Dry run mode - no files will be written'));
      const result = await previewScaffold(scenarioPath);
      console.log(chalk.green('✓ Dry run completed successfully'));
      console.log(chalk.dim(`  Session ID: ${result.sessionId}`));
      return;
    }

    // Confirm before proceeding (unless --yes flag)
    if (!options.yes) {
      const { confirmed } = await prompts({
        type: 'confirm',
        name: 'confirmed',
        message: 'Proceed with scaffolding?',
        initial: true
      });

      if (!confirmed) {
        console.log(chalk.yellow('Scaffolding cancelled'));
        process.exit(0);
      }
    }

    console.log('');
    console.log(chalk.cyan('🚀 Starting scaffold...'));
    console.log('');

    // Run scaffold
    const result = await scaffoldScenario(scenarioPath, {
      overwrite: options.force,
      backup: !options.noBackup,
      skipMcp: options.skipMcp,
      claudeHome: options.claudeHome
    });

    console.log('');
    console.log(chalk.green.bold('✓ Scaffolding completed successfully!'));
    console.log('');

    // Summary
    console.log(chalk.bold('Summary:'));
    console.log(`  ${chalk.green('Created:')} ${result.filesCreated.length} file(s)`);
    console.log(`  ${chalk.yellow('Updated:')} ${result.filesUpdated.length} file(s)`);
    console.log(`  ${chalk.dim('Skipped:')} ${result.filesSkipped.length} file(s)`);
    console.log('');

    // Show created files
    if (result.filesCreated.length > 0 && options.verbose) {
      console.log(chalk.bold('Created Files:'));
      result.filesCreated.forEach(file => {
        console.log(chalk.dim(`  ${file}`));
      });
      console.log('');
    }

    // MCP configuration instructions
    if (result.mcpConfig && Object.keys(result.mcpConfig).length > 0) {
      console.log(chalk.yellow.bold('⚙  MCP Configuration Required'));
      console.log(chalk.yellow('The following MCP servers need to be configured:'));
      Object.keys(result.mcpConfig).forEach(mcp => {
        console.log(chalk.dim(`  - ${mcp}`));
      });
      console.log('');
      console.log(chalk.dim('Add the generated configuration to your .mcp.json file.'));
      console.log(chalk.dim('Configuration details are available in the result object.'));
      console.log('');
    }

    // Next steps
    console.log(chalk.bold('Next Steps:'));
    console.log('  1. Review generated files in ~/.claude/');
    if (result.mcpConfig) {
      console.log('  2. Merge MCP configuration into .mcp.json');
      console.log('  3. Restart Claude Code to load new components');
    } else {
      console.log('  2. Restart Claude Code to load new components');
    }
    console.log('');

  } catch (error) {
    console.error('');
    console.error(chalk.red.bold('✗ Scaffolding failed'));
    console.error(chalk.red(error.message));
    
    if (options.verbose && error.stack) {
      console.error('');
      console.error(chalk.dim('Stack trace:'));
      console.error(chalk.dim(error.stack));
    }
    
    process.exit(1);
  }
}

/**
 * Create scaffold command
 * 
 * @returns {Command} Commander command
 */
export function scaffoldCommand() {
  const cmd = new Command('scaffold')
    .description('Generate orchestrator components from scenario definition')
    .argument('<scenario>', 'Name of scenario to scaffold (without .yaml extension)')
    .option('-f, --force', 'Overwrite existing files')
    .option('-n, --dry-run', 'Preview what would be generated without writing files')
    .option('-y, --yes', 'Skip confirmation prompt')
    .option('--no-backup', 'Do not create backups when overwriting')
    .option('--skip-mcp', 'Skip MCP configuration generation')
    .option('--claude-home <path>', 'Override Claude home directory')
    .option('-v, --verbose', 'Show detailed output')
    .action(handleScaffold);

  cmd.addHelpText('after', `
Examples:
  $ diet103 scenario scaffold my-scenario              # Scaffold scenario
  $ diet103 scenario scaffold my-scenario --dry-run    # Preview without writing
  $ diet103 scenario scaffold my-scenario --force      # Overwrite existing files
  $ diet103 scenario scaffold my-scenario --yes        # Skip confirmation

Output:
  Skills:     ~/.claude/skills/<skill-name>/
  Commands:   ~/.claude/commands/<command>.md
  Hooks:      ~/.claude/hooks/<hook>.js
  MCP Config: (manual merge required)

Notes:
  - Scenario must exist in ~/.claude/scenarios/
  - Generated files include timestamps
  - Backups are created automatically when overwriting
  - MCP configuration must be manually merged into .mcp.json
  - Restart Claude Code after scaffolding to load new components
  `);

  return cmd;
}

export default scaffoldCommand;

