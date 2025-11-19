/**
 * Sync Skills Command
 * 
 * Synchronizes global Orchestrator skills across all registered projects.
 * Ensures skills are automatically discovered regardless of which project is active.
 * 
 * Mirrors the pattern from sync-rules.js
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { 
  ensureGlobalSkillsDir, 
  syncCoreSkillsToGlobal, 
  updateProjectSettings,
  createSkillManifest,
  getGlobalSkillsList
} from '../skills/global-skills-loader.js';

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
 * Sync skills to a single project
 */
async function syncToProject(projectPath, projectName) {
  const spinner = ora(`Syncing skills to ${chalk.cyan(projectName)}`).start();
  
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
 * Sync skills command handler
 */
async function syncSkillsCommand(options) {
  console.log(chalk.bold.blue('\n🎨 Orchestrator Skills Sync\n'));
  
  // Step 1: Setup global skills directory
  console.log(chalk.yellow('Step 1: Setting up global skills directory'));
  await ensureGlobalSkillsDir();
  console.log(chalk.green('✓ Global directory ready\n'));
  
  // Step 2: Get list of global skills
  const skillsList = await getGlobalSkillsList();
  console.log(chalk.yellow('Step 2: Syncing core skills to global location'));
  console.log(chalk.dim(`  Skills to sync: ${skillsList.join(', ')}\n`));
  
  // Step 3: Sync core skills
  const { synced, skipped } = await syncCoreSkillsToGlobal();
  
  if (synced > 0) {
    console.log(chalk.green(`✓ Synced ${synced} skills successfully`));
  }
  if (skipped.length > 0) {
    console.log(chalk.yellow(`⚠ Skipped ${skipped.length} skills:`));
    skipped.forEach(({ skill, reason }) => {
      console.log(chalk.dim(`  - ${skill}: ${reason}`));
    });
  }
  console.log();
  
  // Step 4: Create manifest
  console.log(chalk.yellow('Step 3: Creating skill manifest'));
  const manifest = await createSkillManifest();
  console.log(chalk.green(`✓ Documented ${manifest.skills.length} skills\n`));
  
  // Step 5: Update projects
  console.log(chalk.yellow('Step 4: Updating project settings\n'));
  
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
  console.log(`  ${chalk.green('✓')} Skills synced: ${chalk.bold(synced)}`);
  console.log(`  ${chalk.green('✓')} Projects updated: ${chalk.bold(succeeded)}`);
  if (skipped.length > 0) {
    console.log(`  ${chalk.yellow('⚠')} Skills skipped: ${chalk.bold(skipped.length)}`);
  }
  if (failed > 0) {
    console.log(`  ${chalk.red('✗')} Projects failed: ${chalk.bold(failed)}`);
  }
  
  // Global skills location
  const globalPath = join(homedir(), '.claude', 'skills');
  console.log(chalk.bold.blue('\n📍 Global Skills Location\n'));
  console.log(`  ${chalk.cyan(globalPath)}`);
  
  // List synced skills
  if (manifest.skills.length > 0) {
    console.log(chalk.bold.blue('\n🎯 Available Global Skills\n'));
    manifest.skills.forEach(skill => {
      console.log(`  ${chalk.green('•')} ${chalk.bold(skill.name)} ${chalk.dim(`v${skill.version}`)}`);
      console.log(`    ${chalk.dim(skill.description)}`);
    });
    console.log();
  }
  
  // Next steps
  console.log(chalk.bold.blue('\n💡 What This Means\n'));
  console.log('  • Core Orchestrator skills now available in ALL projects');
  console.log('  • Skills auto-discovered when you work in any project');
  console.log('  • Project-specific skills still work (.claude/skills)');
  console.log('  • Local skills override global skills if same name');
  console.log('  • No manual copying needed\n');
  
  // Usage tips
  console.log(chalk.bold.blue('🚀 Usage Examples\n'));
  console.log(`  ${chalk.cyan('cd ~/data-viz')}`);
  console.log(`  ${chalk.dim('# Skills automatically available!')}`);
  console.log();
  console.log(`  ${chalk.cyan('"Analyze this dashboard design"')}`);
  console.log(`  ${chalk.dim('# react-component-analyzer auto-activates')}`);
  console.log();
  
  console.log(chalk.green('✅ Skills sync complete!\n'));
}

/**
 * Create command
 */
export function createSyncSkillsCommand() {
  return new Command('sync-skills')
    .description('Sync global Orchestrator skills to all registered projects')
    .option('--force', 'Force resync even if skills already exist')
    .option('--list', 'List skills that would be synced without syncing')
    .action(async (options) => {
      if (options.list) {
        const skillsList = await getGlobalSkillsList();
        console.log(chalk.bold.blue('\n🎯 Skills Available for Global Sync\n'));
        skillsList.forEach(skill => {
          console.log(`  ${chalk.green('•')} ${skill}`);
        });
        console.log();
        console.log(chalk.dim('Run without --list to sync these skills globally\n'));
      } else {
        await syncSkillsCommand(options);
      }
    });
}

export default createSyncSkillsCommand;

