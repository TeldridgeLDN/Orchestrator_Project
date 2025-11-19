/**
 * Sync Rules Command
 * 
 * Synchronizes global Orchestrator rules across all registered projects.
 * Ensures rules are automatically loaded regardless of which project is active.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { 
  ensureGlobalRulesDir, 
  syncCoreRulesToGlobal, 
  updateProjectSettings 
} from '../rules/global-rules-loader.js';

const PROJECTS_FILE = join(homedir(), '.orchestrator', 'projects.json');

/**
 * Load registered projects
 */
function loadProjects() {
  try {
    const content = readFileSync(PROJECTS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { projects: [], currentProject: null };
  }
}

/**
 * Sync rules to a single project
 */
async function syncToProject(projectPath, projectName) {
  const spinner = ora(`Syncing rules to ${chalk.cyan(projectName)}`).start();
  
  try {
    const success = await updateProjectSettings(projectPath);
    if (success) {
      spinner.succeed(`Synced ${chalk.cyan(projectName)}`);
      return true;
    } else {
      spinner.fail(`Failed to sync ${chalk.cyan(projectName)}`);
      return false;
    }
  } catch (error) {
    spinner.fail(`Error syncing ${chalk.cyan(projectName)}: ${error.message}`);
    return false;
  }
}

/**
 * Sync rules command handler
 */
async function syncRulesCommand(options) {
  console.log(chalk.bold.blue('\n🔄 Orchestrator Rules Sync\n'));
  
  // Step 1: Setup global rules
  console.log(chalk.yellow('Step 1: Setting up global rules directory'));
  await ensureGlobalRulesDir();
  console.log(chalk.green('✓ Global directory ready\n'));
  
  // Step 2: Sync core rules
  console.log(chalk.yellow('Step 2: Syncing core rules to global location'));
  const synced = await syncCoreRulesToGlobal();
  console.log(chalk.green(`✓ Synced ${synced} core rules\n`));
  
  // Step 3: Update projects
  console.log(chalk.yellow('Step 3: Updating project settings\n'));
  
  const { projects } = loadProjects();
  
  if (projects.length === 0) {
    console.log(chalk.yellow('⚠ No projects registered yet'));
    console.log(chalk.dim('  Run: orchestrator register <project-name>\n'));
    return;
  }
  
  let succeeded = 0;
  let failed = 0;
  
  for (const project of projects) {
    const success = await syncToProject(project.path, project.name);
    if (success) {
      succeeded++;
    } else {
      failed++;
    }
  }
  
  // Summary
  console.log(chalk.bold.blue('\n📊 Sync Summary\n'));
  console.log(`  ${chalk.green('✓')} Succeeded: ${chalk.bold(succeeded)} projects`);
  if (failed > 0) {
    console.log(`  ${chalk.red('✗')} Failed: ${chalk.bold(failed)} projects`);
  }
  
  // Global rules location
  const globalPath = join(homedir(), '.orchestrator', 'rules');
  console.log(chalk.bold.blue('\n📍 Global Rules Location\n'));
  console.log(`  ${chalk.cyan(globalPath)}`);
  
  // Next steps
  console.log(chalk.bold.blue('\n💡 What This Means\n'));
  console.log('  • Core Orchestrator rules now available in ALL projects');
  console.log('  • Rules auto-load when you start Claude/Cursor');
  console.log('  • Project-specific rules still work (.cursor/rules)');
  console.log('  • No manual copying needed\n');
  
  console.log(chalk.green('✅ Rules sync complete!\n'));
}

/**
 * Create command
 */
export function createSyncRulesCommand() {
  return new Command('sync-rules')
    .description('Sync global Orchestrator rules to all registered projects')
    .option('--force', 'Force resync even if rules already exist')
    .action(syncRulesCommand);
}

export default createSyncRulesCommand;

