#!/usr/bin/env node

/**
 * diet103 CLI - Main Entry Point
 * 
 * Command-line interface for diet103 infrastructure validation and repair.
 * 
 * @version 1.0.0
 */

import { Command } from 'commander';
import { validateCommand } from '../lib/commands/validate.js';
import { scenarioCommand } from '../lib/commands/scenario/index.js';
import { healthCommand } from '../lib/commands/health.js';
import { initCommand } from '../lib/commands/init.js';
import { currentCommand } from '../lib/commands/current.js';
import { registerCommand, listRegisteredProjects, unregisterCommand, batchRegisterProjects, scanProjectsCommand } from '../lib/commands/register.js';
import { bulkRegisterCommand } from '../lib/commands/bulk-register.js';
import { skillImportCommand, listSkillsCommand } from '../lib/commands/skill-import.js';
import { skillLockCommand, skillUnlockCommand, skillOverrideCommand, skillStatusCommand } from '../lib/commands/skill-management.js';
import { classifyCommand, organizeCommand, archiveCommand, cleanupCommand, statusCommand as fileStatusCommand, statsCommand as fileStatsCommand } from '../lib/commands/file-lifecycle.js';
import { validateProjectCommand, checkPRDCommand, fixProjectCommand, generateBadgeCommand, injectBadgeCommand } from '../lib/commands/project-validator.js';
import { syncRulesCommand, listRulesCommand, addRuleCommand, removeRuleCommand, checkRulesCommand, registerRulesCommand, rulesStatusCommand } from '../lib/commands/rules.js';
import { shellCommand, installCommand as shellInstallCommand, removeCommand as shellRemoveCommand, statusCommand as shellStatusCommand } from '../lib/commands/shell.js';
import { guideCommand } from '../lib/commands/guide.js';
import { quickstartCommand } from '../lib/commands/quickstart.js';
import chalk from 'chalk';

const program = new Command();

// Custom help configuration with categorized output
program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (cmd) => cmd.name() + ' ' + cmd.usage()
});

program
  .name('diet103')
  .description(`${chalk.bold('diet103')} - AI-assisted project infrastructure management

${chalk.bold('QUICK START')}
  ${chalk.cyan('diet103 quickstart')}        Interactive setup wizard (recommended)
  ${chalk.cyan('diet103 guide')}             Learn common workflows step-by-step
  ${chalk.cyan('diet103 init')}              Initialize a new Claude-enabled project

${chalk.bold('COMMON WORKFLOWS')}
  ${chalk.dim('Validate & Health:')}    diet103 validate --repair
  ${chalk.dim('Project Management:')}   diet103 project register
  ${chalk.dim('Rule Management:')}      diet103 rules sync
  ${chalk.dim('File Organization:')}    diet103 file-lifecycle classify
  ${chalk.dim('Scenario Testing:')}     diet103 scenario create

${chalk.bold('DOCUMENTATION')}
  • Full CLI reference:  Docs/CLI_REFERENCE.md
  • Getting started:     Docs/GETTING_STARTED.md
  • Troubleshooting:     Docs/TROUBLESHOOTING.md`)
  .version('1.3.0');

// Init command
program
  .command('init [path]')
  .description('Initialize a new Claude project in the specified directory')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --description <desc>', 'Project description')
  .option('--taskmaster', 'Include TaskMaster initialization')
  .option('--shell', 'Enable shell integration')
  .option('--no-interactive', 'Skip interactive prompts')
  .option('-f, --force', 'Force initialization even if project exists')
  .option('-v, --verbose', 'Show detailed output')
  .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.dim('# Initialize current directory')}
  $ diet103 init

  ${chalk.dim('# Initialize specific directory with name')}
  $ diet103 init ./my-project --name "My Project"
  
  ${chalk.dim('# Initialize with TaskMaster included')}
  $ diet103 init --taskmaster`)
  .action(initCommand);

// Validate command
program
  .command('validate [path]')
  .description('Validate diet103 infrastructure in a project')
  .option('-r, --repair', 'Automatically repair missing components')
  .option('-v, --verbose', 'Show detailed validation output')
  .option('-t, --threshold <score>', 'Minimum confidence score required (0-100)', '70')
  .option('--no-important', 'Do not install important directories during repair')
  .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.dim('# Validate current project')}
  $ diet103 validate

  ${chalk.dim('# Validate and auto-repair issues')}
  $ diet103 validate --repair
  
  ${chalk.dim('# Require minimum 80/100 score')}
  $ diet103 validate --threshold 80`)
  .action(validateCommand);

// Health command
program
  .command('health [path]')
  .description('Calculate comprehensive project health score')
  .option('-u, --update', 'Update health score in project metadata')
  .option('-v, --verbose', 'Show detailed component information')
  .option('--json', 'Output as JSON')
  .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.dim('# Check project health')}
  $ diet103 health

  ${chalk.dim('# Update health score in metadata')}
  $ diet103 health --update
  
  ${chalk.dim('# Get detailed component breakdown')}
  $ diet103 health --verbose`)
  .action(healthCommand);

// Scenario command group
program.addCommand(scenarioCommand());

// Project command group
const project = program
  .command('project')
  .description('Manage Claude projects');

project
  .command('current')
  .description('Show information about the currently active project')
  .option('-v, --verbose', 'Show detailed project information')
  .option('--json', 'Output as JSON')
  .action(currentCommand);

project
  .command('register [path]')
  .description('Register a project with diet103 infrastructure validation')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --display-name <name>', 'Display name for the project')
  .option('-m, --metadata <json>', 'Custom metadata as JSON string')
  .option('--no-auto-repair', 'Disable automatic repair')
  .option('-t, --threshold <score>', 'Minimum validation score required (0-100)', '70')
  .option('-v, --verbose', 'Show detailed output')
  .action(registerCommand);

project
  .command('register-batch <directory>')
  .description('Batch register all Claude projects in a directory')
  .option('--no-auto-repair', 'Disable automatic repair')
  .option('-t, --threshold <score>', 'Minimum validation score required (0-100)', '70')
  .option('-v, --verbose', 'Show detailed output')
  .action(batchRegisterProjects);

project
  .command('list')
  .description('List all registered projects')
  .option('--json', 'Output as JSON')
  .action(listRegisteredProjects);

project
  .command('unregister <path>')
  .description('Unregister a project')
  .option('-v, --verbose', 'Show detailed output')
  .action(unregisterCommand);

project
  .command('scan <directory>')
  .description('Auto-detect and optionally register Claude projects in a directory')
  .option('--auto-register', 'Automatically register discovered projects')
  .option('--max-depth <depth>', 'Maximum directory depth to scan', '3')
  .option('-t, --threshold <score>', 'Minimum validation score required (0-100)', '70')
  .option('--no-auto-repair', 'Disable automatic repair')
  .option('-v, --verbose', 'Show detailed output including skipped projects')
  .action(scanProjectsCommand);

project
  .command('bulk-register <directory>')
  .description('Interactively register multiple projects with selection UI')
  .option('--max-depth <depth>', 'Maximum directory depth to scan', '3')
  .option('-t, --threshold <score>', 'Minimum validation score required (0-100)', '70')
  .option('--no-auto-repair', 'Disable automatic repair')
  .option('--non-interactive', 'Skip interactive selection (auto-select all above threshold)')
  .option('-v, --verbose', 'Show detailed output')
  .action(bulkRegisterCommand);

// Project identity validation commands (NEW in v1.3.0 - Phase 3)
project
  .command('validate [path]')
  .description('Validate project identity consistency across all signals')
  .option('-v, --verbose', 'Show detailed validation output')
  .option('--json', 'Output as JSON')
  .action(validateProjectCommand);

project
  .command('check-prd <file>')
  .description('Validate PRD file against project identity')
  .option('-v, --verbose', 'Show detailed output')
  .action(checkPRDCommand);

project
  .command('fix [path]')
  .description('Auto-fix project identity mismatches')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('-v, --verbose', 'Show detailed output')
  .action(fixProjectCommand);

// Badge generation commands
const badges = project
  .command('badges')
  .description('Generate and manage project identity badges');

badges
  .command('generate')
  .description('Generate a project identity badge')
  .option('--style <style>', 'Badge style (simple, html, shields)', 'simple')
  .option('--color <color>', 'Badge color')
  .option('-v, --verbose', 'Show detailed output')
  .action(generateBadgeCommand);

badges
  .command('inject <file>')
  .description('Inject project badge into a documentation file')
  .option('--style <style>', 'Badge style (simple, html, shields)', 'simple')
  .option('-v, --verbose', 'Show detailed output')
  .action(injectBadgeCommand);

// Skill command group
const skill = program
  .command('skill')
  .description('Manage skill imports and sharing');

skill
  .command('import <skillNames...>')
  .description('Import one or more skills into the current project')
  .option('-s, --source <source>', 'Source for skills (default: global)', 'global')
  .option('-v, --version <version>', 'Specific version to import')
  .option('-o, --override', 'Override existing import')
  .option('-d, --dry-run', 'Preview changes without applying')
  .option('--strategy <strategy>', 'Conflict resolution strategy (newest, oldest)', 'newest')
  .option('--no-resolve', 'Disable advanced dependency resolver')
  .option('--verbose', 'Show detailed output')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(skillImportCommand);

skill
  .command('list')
  .description('List available skills from source')
  .option('-s, --source <source>', 'Source for skills (default: global)', 'global')
  .option('--verbose', 'Show detailed skill information')
  .action(listSkillsCommand);

skill
  .command('lock [skillNames...]')
  .description('Lock skill versions (all if no names provided)')
  .option('--verbose', 'Show detailed output')
  .action(skillLockCommand);

skill
  .command('unlock <skillNames...>')
  .description('Unlock skill versions')
  .option('--verbose', 'Show detailed output')
  .action(skillUnlockCommand);

skill
  .command('override <skillNames...>')
  .description('Mark skills as locally overridden')
  .option('--disable', 'Disable override flag instead of enabling')
  .option('--verbose', 'Show detailed output')
  .action(skillOverrideCommand);

skill
  .command('status')
  .description('Show skill import status and overrides')
  .option('--json', 'Output as JSON')
  .option('--verbose', 'Show detailed information')
  .action(skillStatusCommand);

// File Lifecycle command group
const fileLifecycle = program
  .command('file-lifecycle')
  .alias('fl')
  .description('Universal File Classification (UFC) system');

fileLifecycle
  .command('classify [path]')
  .description('Classify files into CRITICAL, PERMANENT, EPHEMERAL tiers')
  .option('-d, --dry-run', 'Preview classification without making changes')
  .option('-v, --verbose', 'Show detailed classification output')
  .option('-c, --config <file>', 'Use custom configuration file')
  .action(classifyCommand);

fileLifecycle
  .command('organize [path]')
  .description('Move files into UFC-compliant directory structure')
  .option('-d, --dry-run', 'Preview moves without executing them')
  .option('-v, --verbose', 'Show detailed organization output')
  .option('-c, --config <file>', 'Use custom configuration file')
  .action(organizeCommand);

fileLifecycle
  .command('archive [path]')
  .description('Archive expired ephemeral files')
  .option('-d, --dry-run', 'Preview archival without moving files')
  .option('-v, --verbose', 'Show detailed archival output')
  .option('-c, --config <file>', 'Use custom configuration file')
  .action(archiveCommand);

fileLifecycle
  .command('cleanup [path]')
  .description('Remove archived files past retention period')
  .option('-d, --dry-run', 'Preview cleanup without deleting files')
  .option('-v, --verbose', 'Show detailed cleanup output')
  .option('-c, --config <file>', 'Use custom configuration file')
  .action(cleanupCommand);

fileLifecycle
  .command('status [path]')
  .description('Show file lifecycle system status')
  .option('--json', 'Output as JSON')
  .option('-v, --verbose', 'Show detailed status information')
  .action(fileStatusCommand);

fileLifecycle
  .command('stats [path]')
  .description('Display file lifecycle statistics and metrics')
  .option('--json', 'Output as JSON')
  .option('-v, --verbose', 'Show detailed statistics')
  .action(fileStatsCommand);

// Shell Integration commands (NEW in v1.3.0 - Phase 3 Feature 2)
const shell = program
  .command('shell')
  .description('Manage terminal prompt integration');

shell
  .command('install')
  .description('Install shell integration to show project name in prompt')
  .option('-v, --verbose', 'Show detailed output')
  .action(shellInstallCommand);

shell
  .command('remove')
  .description('Remove shell integration')
  .option('-v, --verbose', 'Show detailed output')
  .action(shellRemoveCommand);

shell
  .command('status')
  .description('Show shell integration status')
  .option('-v, --verbose', 'Show detailed output')
  .action(shellStatusCommand);

// Rules command group (NEW in v1.3.0 - Phase 3 Feature 3)
const rules = program
  .command('rules')
  .description('Manage project rule profiles and synchronization');

rules
  .command('sync')
  .description('Sync rules with central registry')
  .option('-f, --force', 'Force re-sync even if up to date')
  .option('--dry-run', 'Preview changes without applying')
  .option('--only <filter>', 'Only sync matching rules (comma-separated)')
  .option('--exclude <filter>', 'Exclude matching rules (comma-separated)')
  .option('-v, --verbose', 'Show detailed sync output')
  .action(syncRulesCommand);

rules
  .command('list')
  .description('List installed rule profiles')
  .option('-v, --verbose', 'Show detailed rule information')
  .action(listRulesCommand);

rules
  .command('add <profile>')
  .description('Add a new rule profile (cursor, windsurf, etc.)')
  .option('-v, --verbose', 'Show detailed output')
  .action(addRuleCommand);

rules
  .command('remove <profile>')
  .description('Remove a rule profile')
  .option('-f, --force', 'Force removal without confirmation')
  .option('-v, --verbose', 'Show detailed output')
  .action(removeRuleCommand);

rules
  .command('check')
  .description('Check for rule updates')
  .option('-v, --verbose', 'Show detailed check output')
  .action(checkRulesCommand);

rules
  .command('register')
  .description('Register current project with rule sync system')
  .option('-f, --force', 'Force re-registration')
  .option('-v, --verbose', 'Show detailed output')
  .action(registerRulesCommand);

rules
  .command('status')
  .description('Show rule sync status')
  .option('-v, --verbose', 'Show detailed status')
  .action(rulesStatusCommand);

// Help & Guidance commands (NEW in v1.3.0 - Phase 3 Feature 4)
program
  .command('guide')
  .description('Interactive tutorial for common diet103 workflows')
  .option('-t, --topic <topic>', 'Jump to specific topic (validation, health, skills, files, scenarios)')
  .option('--list', 'List all available topics')
  .action(guideCommand);

program
  .command('quickstart')
  .description('Interactive setup wizard with recommended settings')
  .option('--skip-validation', 'Skip project validation step')
  .option('--skip-health', 'Skip health check step')
  .option('-y, --yes', 'Accept all recommended settings')
  .action(quickstartCommand);

// Parse arguments
program.parse(process.argv);

