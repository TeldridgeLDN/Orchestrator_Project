/**
 * @fileoverview Skill Management Commands
 * @module lib/commands/skill-management
 * 
 * CLI commands for managing skill overrides, version locking, and status.
 * 
 * @see {@link https://github.com/diet103/orchestrator|Diet103 Orchestrator}
 */

import chalk from 'chalk';
import ora from 'ora';
import {
  getImportedSkills,
  toggleSkillOverride,
  isSkillOverridden,
  getOverriddenSkills,
  lockSkillVersion,
  unlockSkillVersion,
  isSkillVersionLocked,
  lockAllSkillVersions,
  getImportStatistics
} from '../utils/skill-imports.js';

/**
 * Lock skill versions command
 * 
 * @param {string|string[]} [skillNames] - Skill name(s) to lock (optional, locks all if omitted)
 * @param {Object} options - Command options
 * @returns {Promise<void>}
 */
export async function skillLockCommand(skillNames, options) {
  const { verbose = false } = options;
  const projectPath = process.cwd();
  
  try {
    // Lock all skills if no specific skills provided
    if (!skillNames || skillNames.length === 0) {
      const spinner = ora('Locking all skill versions...').start();
      
      const result = await lockAllSkillVersions(projectPath);
      
      spinner.succeed(`Locked ${result.lockCount} skill version(s)`);
      
      if (verbose) {
        console.log(chalk.dim(`\nTotal skills: ${result.totalSkills}`));
        console.log(chalk.dim(`Newly locked: ${result.lockCount}`));
        console.log(chalk.dim(`Already locked: ${result.totalSkills - result.lockCount}`));
      }
      
      return;
    }
    
    // Lock specific skills
    const skills = Array.isArray(skillNames) ? skillNames : [skillNames];
    const spinner = ora('Locking skill versions...').start();
    
    for (const skillName of skills) {
      try {
        await lockSkillVersion(projectPath, skillName);
        spinner.text = `Locked ${skillName}`;
      } catch (error) {
        spinner.fail(`Failed to lock ${skillName}`);
        console.error(chalk.red(`  ${error.message}`));
        continue;
      }
    }
    
    spinner.succeed(`Locked ${skills.length} skill(s)`);
    
  } catch (error) {
    console.error(chalk.red(`\n✗ Lock failed: ${error.message}`));
    if (verbose) {
      console.error(chalk.dim('\nStack trace:'));
      console.error(chalk.dim(error.stack));
    }
    process.exit(1);
  }
}

/**
 * Unlock skill versions command
 * 
 * @param {string|string[]} skillNames - Skill name(s) to unlock
 * @param {Object} options - Command options
 * @returns {Promise<void>}
 */
export async function skillUnlockCommand(skillNames, options) {
  const { verbose = false } = options;
  const projectPath = process.cwd();
  
  if (!skillNames || skillNames.length === 0) {
    console.error(chalk.red('\n✗ Please specify skill name(s) to unlock'));
    process.exit(1);
  }
  
  try {
    const skills = Array.isArray(skillNames) ? skillNames : [skillNames];
    const spinner = ora('Unlocking skill versions...').start();
    
    for (const skillName of skills) {
      try {
        await unlockSkillVersion(projectPath, skillName);
        spinner.text = `Unlocked ${skillName}`;
      } catch (error) {
        spinner.fail(`Failed to unlock ${skillName}`);
        console.error(chalk.red(`  ${error.message}`));
        continue;
      }
    }
    
    spinner.succeed(`Unlocked ${skills.length} skill(s)`);
    
  } catch (error) {
    console.error(chalk.red(`\n✗ Unlock failed: ${error.message}`));
    if (verbose) {
      console.error(chalk.dim('\nStack trace:'));
      console.error(chalk.dim(error.stack));
    }
    process.exit(1);
  }
}

/**
 * Toggle skill override command
 * 
 * @param {string|string[]} skillNames - Skill name(s) to toggle override
 * @param {Object} options - Command options
 * @returns {Promise<void>}
 */
export async function skillOverrideCommand(skillNames, options) {
  const { enable = true, disable = false, verbose = false } = options;
  const projectPath = process.cwd();
  
  if (!skillNames || skillNames.length === 0) {
    console.error(chalk.red('\n✗ Please specify skill name(s) to override'));
    process.exit(1);
  }
  
  try {
    const skills = Array.isArray(skillNames) ? skillNames : [skillNames];
    const overrideValue = disable ? false : enable;
    const action = overrideValue ? 'Enabling' : 'Disabling';
    
    const spinner = ora(`${action} skill overrides...`).start();
    
    for (const skillName of skills) {
      try {
        await toggleSkillOverride(projectPath, skillName, overrideValue);
        spinner.text = `${action.slice(0, -3)}d override for ${skillName}`;
      } catch (error) {
        spinner.fail(`Failed to update ${skillName}`);
        console.error(chalk.red(`  ${error.message}`));
        continue;
      }
    }
    
    spinner.succeed(`${action.slice(0, -3)}d override for ${skills.length} skill(s)`);
    
    if (overrideValue) {
      console.log(chalk.yellow('\n⚠️  Override enabled: Local changes will be preserved during imports'));
    }
    
  } catch (error) {
    console.error(chalk.red(`\n✗ Override command failed: ${error.message}`));
    if (verbose) {
      console.error(chalk.dim('\nStack trace:'));
      console.error(chalk.dim(error.stack));
    }
    process.exit(1);
  }
}

/**
 * Show skill status command
 * 
 * @param {Object} options - Command options
 * @returns {Promise<void>}
 */
export async function skillStatusCommand(options) {
  const { verbose = false, json = false } = options;
  const projectPath = process.cwd();
  
  try {
    const spinner = ora('Loading skill status...').start();
    
    const skills = await getImportedSkills(projectPath);
    const stats = await getImportStatistics(projectPath);
    const overriddenSkills = await getOverriddenSkills(projectPath);
    
    spinner.stop();
    
    if (json) {
      console.log(JSON.stringify({
        totalSkills: stats.total,
        overridden: overriddenSkills.length,
        locked: skills.filter(s => s.versionLocked).length,
        skills: skills.map(s => ({
          name: s.name,
          version: s.version,
          source: s.source,
          override: s.override || false,
          versionLocked: s.versionLocked || false,
          importedAt: s.importedAt
        }))
      }, null, 2));
      return;
    }
    
    if (skills.length === 0) {
      console.log(chalk.yellow('\nNo skills imported'));
      return;
    }
    
    console.log(chalk.bold(`\n📊 Skill Import Status (${skills.length} total):\n`));
    console.log('─'.repeat(80));
    
    skills.forEach(skill => {
      const badges = [];
      if (skill.override) badges.push(chalk.yellow('OVERRIDDEN'));
      if (skill.versionLocked) badges.push(chalk.blue('LOCKED'));
      
      const badgeText = badges.length > 0 ? ` [${badges.join(', ')}]` : '';
      
      console.log(chalk.cyan(`\n• ${skill.name}`));
      console.log(chalk.dim(`  Version: ${skill.version}${badgeText}`));
      console.log(chalk.dim(`  Source: ${skill.source}`));
      console.log(chalk.dim(`  Imported: ${new Date(skill.importedAt).toLocaleDateString()}`));
      
      if (verbose) {
        if (skill.dependencies && skill.dependencies.length > 0) {
          console.log(chalk.dim(`  Dependencies: ${skill.dependencies.join(', ')}`));
        }
        if (skill.versionLocked && skill.lockedAt) {
          console.log(chalk.dim(`  Locked: ${new Date(skill.lockedAt).toLocaleDateString()}`));
        }
        if (skill.override && skill.overriddenAt) {
          console.log(chalk.dim(`  Overridden: ${new Date(skill.overriddenAt).toLocaleDateString()}`));
        }
      }
    });
    
    console.log('\n' + '─'.repeat(80));
    console.log(chalk.dim(`\nSummary:`));
    console.log(chalk.dim(`  Total: ${stats.total}`));
    console.log(chalk.dim(`  Overridden: ${stats.withOverrides}`));
    console.log(chalk.dim(`  Locked: ${skills.filter(s => s.versionLocked).length}`));
    console.log(chalk.dim(`  With dependencies: ${stats.withDependencies}`));
    
  } catch (error) {
    console.error(chalk.red(`\n✗ Status command failed: ${error.message}`));
    if (verbose) {
      console.error(chalk.dim('\nStack trace:'));
      console.error(chalk.dim(error.stack));
    }
    process.exit(1);
  }
}


