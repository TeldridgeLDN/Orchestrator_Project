/**
 * @fileoverview Skill Import Command
 * @module lib/commands/skill-import
 * 
 * CLI command for importing skills into a project with version control
 * and dependency management.
 * 
 * @see {@link https://github.com/diet103/orchestrator|Diet103 Orchestrator}
 */

import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import {
  loadSkill,
  skillExists,
  listAvailableSkills,
  getSkillImportSummary,
  getGlobalSkillsPath,
  ensureGlobalSkillsDirectory
} from '../utils/skill-loader.js';
import {
  addSkillImport,
  isSkillImported,
  getImportedSkill,
  getImportStatistics
} from '../utils/skill-imports.js';
import { resolveDependencies } from '../utils/dependency-resolver.js';

/**
 * Display skill import summary
 * 
 * @param {Object} summary - Skill import summary
 */
function displaySkillSummary(summary) {
  console.log(chalk.cyan('\n📦 Skill Import Summary:'));
  console.log('─'.repeat(60));
  console.log(`${chalk.bold('Name:')} ${summary.name}`);
  console.log(`${chalk.bold('Version:')} ${summary.version}`);
  console.log(`${chalk.bold('Description:')} ${summary.description}`);
  console.log(`${chalk.bold('Author:')} ${summary.author}`);
  console.log(`${chalk.bold('Source:')} ${summary.source}`);
  
  if (summary.tags && summary.tags.length > 0) {
    console.log(`${chalk.bold('Tags:')} ${summary.tags.join(', ')}`);
  }
  
  if (summary.dependencies && summary.dependencies.length > 0) {
    console.log(`${chalk.bold('Dependencies:')} ${summary.dependencies.join(', ')}`);
  }
  
  if (summary.override) {
    console.log(chalk.yellow('\n⚠️  This will override the existing import'));
  }
  
  console.log('─'.repeat(60));
}

/**
 * Import a skill and its dependencies recursively
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {string} skillName - Name of the skill to import
 * @param {Object} options - Import options
 * @param {Set} [imported=new Set()] - Set of already imported skills (for cycle detection)
 * @returns {Promise<Object>} Import result
 */
async function importSkillRecursive(projectPath, skillName, options, imported = new Set()) {
  const { source = 'global', version, override = false, verbose = false } = options;
  
  // Check for circular dependencies
  if (imported.has(skillName)) {
    throw new Error(`Circular dependency detected: ${skillName}`);
  }
  
  // Mark as being imported
  imported.add(skillName);
  
  // Check if skill already imported
  const alreadyImported = await isSkillImported(projectPath, skillName);
  if (alreadyImported && !override) {
    if (verbose) {
      console.log(chalk.dim(`  ✓ ${skillName} already imported (skipping)`));
    }
    return { skipped: true, skillName };
  }
  
  // Load skill from source
  const skill = await loadSkill(source, skillName, version);
  if (!skill) {
    throw new Error(
      `Skill '${skillName}' not found in ${source}${version ? ` (version ${version})` : ''}`
    );
  }
  
  // Import dependencies first
  const dependencyResults = [];
  if (skill.dependencies && skill.dependencies.length > 0) {
    if (verbose) {
      console.log(chalk.dim(`  Importing dependencies for ${skillName}...`));
    }
    
    for (const dep of skill.dependencies) {
      const depName = typeof dep === 'string' ? dep : dep.name;
      const depVersion = typeof dep === 'object' ? dep.version : undefined;
      const depSource = typeof dep === 'object' ? dep.source : source;
      
      try {
        const depResult = await importSkillRecursive(
          projectPath,
          depName,
          { source: depSource, version: depVersion, override: false, verbose },
          imported
        );
        dependencyResults.push(depResult);
      } catch (error) {
        throw new Error(`Failed to import dependency '${depName}': ${error.message}`);
      }
    }
  }
  
  // Add skill import to metadata
  const skillImport = {
    name: skillName,
    source,
    version: skill.version,
    override,
    dependencies: skill.dependencies || []
  };
  
  await addSkillImport(projectPath, skillImport);
  
  return {
    imported: true,
    skillName,
    version: skill.version,
    dependencies: dependencyResults
  };
}

/**
 * Import skills using advanced dependency resolver
 * 
 * @param {string|string[]} skillNames - Skill name(s) to import
 * @param {Object} options - Import options
 * @returns {Promise<void>}
 */
async function skillImportWithResolver(skillNames, options) {
  const {
    source = 'global',
    override = false,
    dryRun = false,
    verbose = false,
    yes = false,
    strategy = 'newest'
  } = options;
  
  const skills = Array.isArray(skillNames) ? skillNames : [skillNames];
  const projectPath = process.cwd();
  
  try {
    // Resolve dependencies
    const spinner = ora('Resolving dependencies...').start();
    
    const resolution = await resolveDependencies(source, skills, {
      strategy,
      allowCircular: false
    });
    
    spinner.stop();
    
    // Check for resolution errors
    if (!resolution.success) {
      console.error(chalk.red(`\n✗ Dependency resolution failed`));
      
      if (resolution.error) {
        console.error(chalk.red(`  ${resolution.error}`));
      }
      
      // Show circular dependencies
      if (resolution.cycles && resolution.cycles.length > 0) {
        console.error(chalk.red('\n  Circular dependencies detected:'));
        resolution.cycles.forEach(cycle => {
          console.error(chalk.dim(`    ${cycle}`));
        });
      }
      
      // Show conflicts
      if (resolution.conflicts && resolution.conflicts.length > 0) {
        console.error(chalk.yellow('\n  Version conflicts detected:'));
        resolution.conflicts.forEach(conflict => {
          console.error(chalk.yellow(`    ${conflict.skill}:`));
          conflict.conflictingRequirements.forEach(req => {
            console.error(chalk.dim(`      - ${req.requiredBy} requires ${req.version}`));
          });
        });
        
        console.error(chalk.dim('\n  Use --strategy to specify conflict resolution (newest, oldest)'));
      }
      
      process.exit(1);
    }
    
    // Display resolution plan
    console.log(chalk.bold(`\n📋 Import Plan (${resolution.resolved.length} skills):\n`));
    
    resolution.resolved.forEach((skill, index) => {
      const icon = index === 0 ? '●' : '○';
      console.log(chalk.cyan(`  ${icon} ${skill.name} (${skill.version})`));
      if (verbose && skill.dependencies.length > 0) {
        console.log(chalk.dim(`     Dependencies: ${skill.dependencies.join(', ')}`));
      }
    });
    
    // Show conflicts and resolutions
    if (resolution.conflicts && resolution.conflicts.length > 0) {
      console.log(chalk.yellow('\n⚠️  Version conflicts resolved:'));
      resolution.conflicts.forEach(conflict => {
        const resolution_details = resolution.resolutions[conflict.skill];
        console.log(chalk.yellow(`  ${conflict.skill}: ${resolution_details.reason}`));
      });
    }
    
    // Dry run mode - exit after showing plan
    if (dryRun) {
      console.log(chalk.yellow('\n🔍 Dry run mode - no changes made'));
      return;
    }
    
    // Confirm import (unless --yes flag)
    if (!yes) {
      console.log(chalk.yellow('\n⚠️  This will modify your project metadata'));
      console.log(chalk.dim('Use --yes to skip this confirmation\n'));
      console.log(chalk.dim('(Auto-proceeding - add prompt library for interactive mode)'));
    }
    
    // Import in dependency order
    const importSpinner = ora('Importing skills...').start();
    let imported = 0;
    
    for (const skill of resolution.resolved) {
      try {
        // Check if already imported
        const alreadyImported = await isSkillImported(projectPath, skill.name);
        if (alreadyImported && !override) {
          if (verbose) {
            importSpinner.text = `Skipped ${skill.name} (already imported)`;
          }
          continue;
        }
        
        // Import skill
        await addSkillImport(projectPath, {
          name: skill.name,
          source,
          version: skill.version,
          override,
          dependencies: skill.dependencies
        });
        
        imported++;
        importSpinner.text = `Imported ${skill.name} (${imported}/${resolution.resolved.length})`;
        
      } catch (error) {
        importSpinner.fail(`Failed to import ${skill.name}`);
        throw error;
      }
    }
    
    importSpinner.succeed(`Imported ${imported} skill(s)`);
    
    // Display summary
    console.log(chalk.green('\n✓ Import Complete!'));
    const stats = await getImportStatistics(projectPath);
    console.log(chalk.cyan('\n📊 Import Statistics:'));
    console.log(chalk.dim(`  Total imports: ${stats.total}`));
    console.log(chalk.dim(`  With overrides: ${stats.withOverrides}`));
    console.log(chalk.dim(`  With dependencies: ${stats.withDependencies}`));
    
  } catch (error) {
    console.error(chalk.red(`\n✗ Import failed: ${error.message}`));
    if (verbose) {
      console.error(chalk.dim('\nStack trace:'));
      console.error(chalk.dim(error.stack));
    }
    process.exit(1);
  }
}

/**
 * Main skill import command handler
 * 
 * @param {string|string[]} skillNames - Skill name(s) to import
 * @param {Object} options - Command options
 * @returns {Promise<void>}
 */
export async function skillImportCommand(skillNames, options) {
  const {
    source = 'global',
    version,
    override = false,
    dryRun = false,
    verbose = false,
    yes = false,
    resolve = true,  // Use advanced dependency resolver
    strategy = 'newest'  // Conflict resolution strategy
  } = options;
  
  // Normalize skillNames to array
  const skills = Array.isArray(skillNames) ? skillNames : [skillNames];
  
  // Get project path
  const projectPath = process.cwd();
  
  try {
    // Ensure global skills directory exists
    if (source === 'global') {
      await ensureGlobalSkillsDirectory();
    }
    
    // Use advanced dependency resolver if enabled
    if (resolve) {
      return await skillImportWithResolver(skillNames, options);
    }
    
    // Validate all skills exist before importing
    const spinner = ora('Validating skills...').start();
    
    for (const skillName of skills) {
      const exists = await skillExists(source, skillName);
      if (!exists) {
        spinner.fail();
        console.error(
          chalk.red(`\n✗ Skill '${skillName}' not found in ${source}`)
        );
        
        // Suggest similar skills
        console.log(chalk.dim('\nAvailable skills:'));
        const available = await listAvailableSkills(source);
        if (available.length > 0) {
          available.slice(0, 10).forEach(skill => {
            console.log(chalk.dim(`  - ${skill.name} (${skill.version})`));
          });
          if (available.length > 10) {
            console.log(chalk.dim(`  ... and ${available.length - 10} more`));
          }
        } else {
          console.log(chalk.dim('  (No skills found in source)'));
        }
        
        process.exit(1);
      }
    }
    
    spinner.succeed('Skills validated');
    
    // Display import plan
    console.log(chalk.bold('\n📋 Import Plan:'));
    for (const skillName of skills) {
      const skill = await loadSkill(source, skillName, version);
      const summary = getSkillImportSummary(skill, { source, override });
      
      console.log(chalk.cyan(`\n• ${skillName}`));
      console.log(chalk.dim(`  Version: ${summary.version}`));
      console.log(chalk.dim(`  Description: ${summary.description}`));
      
      if (summary.dependencies.length > 0) {
        console.log(chalk.dim(`  Dependencies: ${summary.dependencies.join(', ')}`));
      }
    }
    
    // Dry run mode - exit after showing plan
    if (dryRun) {
      console.log(chalk.yellow('\n🔍 Dry run mode - no changes made'));
      return;
    }
    
    // Confirm import (unless --yes flag)
    if (!yes) {
      console.log(chalk.yellow('\n⚠️  This will modify your project metadata'));
      console.log(chalk.dim('Use --yes to skip this confirmation\n'));
      
      // In a real implementation, we'd use a prompt library like inquirer
      // For now, we'll just proceed
      console.log(chalk.dim('(Auto-proceeding - add prompt library for interactive mode)'));
    }
    
    // Import each skill
    const importSpinner = ora('Importing skills...').start();
    const results = [];
    
    for (const skillName of skills) {
      try {
        const result = await importSkillRecursive(
          projectPath,
          skillName,
          { source, version, override, verbose }
        );
        results.push(result);
        
        if (result.skipped) {
          importSpinner.text = `Skipped ${skillName} (already imported)`;
        } else {
          importSpinner.text = `Imported ${skillName} v${result.version}`;
        }
      } catch (error) {
        importSpinner.fail(`Failed to import ${skillName}`);
        throw error;
      }
    }
    
    importSpinner.succeed('All skills imported successfully');
    
    // Display summary
    console.log(chalk.green('\n✓ Import Complete!'));
    console.log(chalk.dim('\nImported skills:'));
    
    results.forEach(result => {
      if (!result.skipped) {
        console.log(chalk.dim(`  • ${result.skillName} (${result.version})`));
        
        if (result.dependencies && result.dependencies.length > 0) {
          result.dependencies.forEach(dep => {
            if (!dep.skipped) {
              console.log(chalk.dim(`    → ${dep.skillName} (${dep.version})`));
            }
          });
        }
      }
    });
    
    // Show import statistics
    const stats = await getImportStatistics(projectPath);
    console.log(chalk.cyan('\n📊 Import Statistics:'));
    console.log(chalk.dim(`  Total imports: ${stats.total}`));
    console.log(chalk.dim(`  With overrides: ${stats.withOverrides}`));
    console.log(chalk.dim(`  With dependencies: ${stats.withDependencies}`));
    
  } catch (error) {
    console.error(chalk.red(`\n✗ Import failed: ${error.message}`));
    if (verbose) {
      console.error(chalk.dim('\nStack trace:'));
      console.error(chalk.dim(error.stack));
    }
    process.exit(1);
  }
}

/**
 * List available skills command handler
 * 
 * @param {Object} options - Command options
 * @returns {Promise<void>}
 */
export async function listSkillsCommand(options) {
  const { source = 'global', verbose = false } = options;
  
  try {
    // Ensure global skills directory exists
    if (source === 'global') {
      await ensureGlobalSkillsDirectory();
    }
    
    const spinner = ora('Loading available skills...').start();
    const skills = await listAvailableSkills(source);
    spinner.stop();
    
    if (skills.length === 0) {
      console.log(chalk.yellow('\nNo skills found in source'));
      console.log(chalk.dim(`Source: ${source === 'global' ? getGlobalSkillsPath() : source}`));
      return;
    }
    
    console.log(chalk.bold(`\n📚 Available Skills (${skills.length}):`));
    console.log('─'.repeat(60));
    
    skills.forEach(skill => {
      console.log(chalk.cyan(`\n• ${skill.name}`));
      console.log(chalk.dim(`  Version: ${skill.version}`));
      console.log(chalk.dim(`  Description: ${skill.description}`));
      
      if (verbose) {
        if (skill.author) {
          console.log(chalk.dim(`  Author: ${skill.author}`));
        }
        if (skill.tags && skill.tags.length > 0) {
          console.log(chalk.dim(`  Tags: ${skill.tags.join(', ')}`));
        }
        if (skill.dependencies && skill.dependencies.length > 0) {
          console.log(chalk.dim(`  Dependencies: ${skill.dependencies.join(', ')}`));
        }
      }
    });
    
    console.log();
    
  } catch (error) {
    console.error(chalk.red(`\n✗ Failed to list skills: ${error.message}`));
    process.exit(1);
  }
}

