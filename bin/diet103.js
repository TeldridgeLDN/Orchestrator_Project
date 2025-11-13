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

const program = new Command();

program
  .name('diet103')
  .description('diet103 infrastructure validation and repair tool')
  .version('1.0.0');

// Init command
program
  .command('init [path]')
  .description('Initialize a new Claude project in the specified directory')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --description <desc>', 'Project description')
  .option('--taskmaster', 'Include TaskMaster initialization')
  .option('--no-interactive', 'Skip interactive prompts')
  .option('-f, --force', 'Force initialization even if project exists')
  .option('-v, --verbose', 'Show detailed output')
  .action(initCommand);

// Validate command
program
  .command('validate [path]')
  .description('Validate diet103 infrastructure in a project')
  .option('-r, --repair', 'Automatically repair missing components')
  .option('-v, --verbose', 'Show detailed validation output')
  .option('-t, --threshold <score>', 'Minimum confidence score required (0-100)', '70')
  .option('--no-important', 'Do not install important directories during repair')
  .action(validateCommand);

// Health command
program
  .command('health [path]')
  .description('Calculate comprehensive project health score')
  .option('-u, --update', 'Update health score in project metadata')
  .option('-v, --verbose', 'Show detailed component information')
  .option('--json', 'Output as JSON')
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

// Parse arguments
program.parse(process.argv);

