#!/usr/bin/env node

/**
 * Rule Management Commands
 * 
 * diet103 compliant: <500 lines, thin wrapper
 * Exposes rule-sync functionality through diet103 CLI
 * 
 * @version 1.0.0 (Phase 3 Feature 3)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import CommonJS modules dynamically
let ProjectRegistry, VersionChecker, SyncPull;

async function loadModules() {
  if (!ProjectRegistry) {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    ProjectRegistry = require('../rule-sync/registry.cjs');
    VersionChecker = require('../rule-sync/version-check.cjs');
    SyncPull = require('../rule-sync/sync-pull.cjs');
  }
}

/**
 * Sync rules from source to current project
 */
export async function syncRulesCommand(options = {}) {
  await loadModules();
  
  const registry = new ProjectRegistry();
  const checker = new VersionChecker();
  const targetPath = process.cwd();

  try {
    // Get source and target
    const source = await registry.getSource();
    const target = await registry.getByPath(targetPath);

    if (!target) {
      console.error('❌ Project not registered with rule sync system');
      console.log('   Run: diet103 rules register');
      process.exit(1);
    }

    // Check what needs syncing
    const checkResult = await checker.check(source.path, target.path);

    if (checkResult.updates.length === 0 && !options.force) {
      console.log('✅ All rules up to date');
      return;
    }

    if (options.force && checkResult.updates.length === 0) {
      console.log('🔄 Force sync requested, but no rules found to sync');
      return;
    }

    console.log(`📦 Syncing ${checkResult.updates.length} rule(s)...`);
    console.log('');

    // Create syncer
    const syncer = new SyncPull({
      dryRun: options.dryRun,
      verbose: options.verbose
    });

    // Pull updates
    const pullOptions = {};
    if (options.only) pullOptions.only = options.only.split(',');
    if (options.exclude) pullOptions.exclude = options.exclude.split(',');

    const results = await syncer.pull(
      source.path,
      target.path,
      checkResult.updates,
      pullOptions
    );

    console.log(syncer.formatSummary(results));

    // Update registry if successful
    if (!options.dryRun && results.success.length > 0) {
      await registry.markSynced(target.name, source.rulesVersion);
    }

    process.exit(results.failed.length > 0 ? 1 : 0);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * List installed rule profiles
 */
export async function listRulesCommand(options = {}) {
  const targetPath = process.cwd();

  try {
    // Check for .claude/rules directory
    const rulesDir = path.join(targetPath, '.claude', 'rules');
    
    try {
      await fs.access(rulesDir);
    } catch {
      console.log('No .claude/rules directory found in current project');
      return;
    }

    // Read manifest if it exists
    const manifestPath = path.join(rulesDir, '.rule-manifest.json');
    let manifest = null;

    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);
    } catch {
      console.log('⚠️  No rule manifest found');
      console.log('   Run: diet103 rules sync');
      console.log('');
    }

    // List all rule files
    const entries = await fs.readdir(rulesDir, { withFileTypes: true });
    const ruleFiles = entries
      .filter(entry => entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdc')))
      .map(entry => entry.name);

    if (ruleFiles.length === 0) {
      console.log('No rule files found in .claude/rules/');
      return;
    }

    console.log('📋 Installed Rule Profiles:');
    console.log('');

    if (manifest) {
      console.log(`Version: v${manifest.rulesVersion}`);
      console.log(`Last Updated: ${new Date(manifest.lastUpdated).toLocaleString()}`);
      console.log('');

      if (manifest.categories) {
        // Group rules by category
        const categories = Object.entries(manifest.categories);
        
        for (const [categoryName, categoryRules] of categories) {
          // Capitalize category name
          const displayName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
          console.log(`${displayName}:`);
          
          // Show rules in this category
          for (const rulePath of categoryRules) {
            const ruleInfo = manifest.rules[rulePath];
            if (ruleInfo) {
              const icon = ruleInfo.scope === 'universal' ? '🔒' : '📝';
              const shortName = rulePath.split('/').pop();
              console.log(`  ${icon} ${shortName} (v${ruleInfo.version})`);
              if (options.verbose) {
                console.log(`     ${ruleInfo.description || 'No description'}`);
                console.log(`     Priority: ${ruleInfo.priority}`);
              }
            }
          }
          console.log('');
        }
      }
    } else {
      // Just list files without metadata
      console.log('Rule files (no manifest):');
      for (const file of ruleFiles) {
        console.log(`  📝 ${file}`);
      }
      console.log('');
    }

    // Show summary
    const totalRules = manifest ? Object.keys(manifest.rules).length : ruleFiles.length;
    console.log(`Total: ${totalRules} rule(s)`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Add a new rule profile
 */
export async function addRuleCommand(profile, options = {}) {
  console.log(`Adding rule profile: ${profile}`);
  console.log('');

  // This would integrate with a rule template system
  // For now, show a helpful message
  console.log('⚠️  Rule addition not yet implemented');
  console.log('');
  console.log('Available profiles:');
  console.log('  • cursor    - Cursor IDE rules');
  console.log('  • windsurf  - Windsurf rules');
  console.log('  • roo       - Roo Code rules');
  console.log('  • claude    - Claude Code rules');
  console.log('');
  console.log('To add rules manually:');
  console.log('  1. Create .md files in .claude/rules/');
  console.log('  2. Run: diet103 rules sync');
  console.log('');
}

/**
 * Remove a rule profile
 */
export async function removeRuleCommand(profile, options = {}) {
  const targetPath = process.cwd();

  try {
    const rulesDir = path.join(targetPath, '.claude', 'rules');
    const manifestPath = path.join(rulesDir, '.rule-manifest.json');

    // Read manifest
    let manifest;
    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);
    } catch {
      console.error('❌ No rule manifest found');
      console.log('   Run: diet103 rules sync first');
      process.exit(1);
    }

    // Find rules matching profile
    const matchingRules = Object.entries(manifest.rules)
      .filter(([name, _]) => name.toLowerCase().includes(profile.toLowerCase()));

    if (matchingRules.length === 0) {
      console.log(`No rules found matching "${profile}"`);
      return;
    }

    console.log(`Found ${matchingRules.length} rule(s) matching "${profile}":`);
    for (const [name, rule] of matchingRules) {
      console.log(`  • ${name} (${rule.scope})`);
    }
    console.log('');

    if (!options.force) {
      console.log('⚠️  Use --force to remove (this will delete rule files)');
      return;
    }

    // Remove rule files
    let removed = 0;
    for (const [name, rule] of matchingRules) {
      const rulePath = path.join(rulesDir, rule.path || `${name}.md`);
      try {
        await fs.unlink(rulePath);
        console.log(`✅ Removed: ${name}`);
        removed++;
      } catch (error) {
        console.error(`❌ Failed to remove ${name}: ${error.message}`);
      }
    }

    // Update manifest
    for (const [name, _] of matchingRules) {
      delete manifest.rules[name];
    }

    manifest.lastUpdated = new Date().toISOString();
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    console.log('');
    console.log(`✅ Removed ${removed} rule(s)`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Check for rule updates
 */
export async function checkRulesCommand(options = {}) {
  await loadModules();
  
  const registry = new ProjectRegistry();
  const checker = new VersionChecker();
  const targetPath = process.cwd();

  try {
    // Get source and target
    const source = await registry.getSource();
    const target = await registry.getByPath(targetPath);

    if (!target) {
      console.error('❌ Project not registered with rule sync system');
      console.log('   Run: diet103 rules register');
      process.exit(1);
    }

    // Check version status
    const result = await checker.check(source.path, target.path);

    // Show report
    console.log(checker.formatReport(result));

    if (result.updates.length > 0) {
      console.log('');
      console.log('To update rules, run: diet103 rules sync');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Register current project with rule sync
 */
export async function registerRulesCommand(options = {}) {
  await loadModules();
  
  const registry = new ProjectRegistry();
  const targetPath = process.cwd();

  try {
    // Check if already registered
    const existing = await registry.getByPath(targetPath);
    if (existing && !options.force) {
      console.log('✅ Project already registered');
      console.log(`   Name: ${existing.name}`);
      console.log(`   Rules Version: v${existing.rulesVersion}`);
      return;
    }

    // Register project
    const project = await registry.register(targetPath, options);
    
    console.log('✅ Registered with rule sync system');
    console.log(`   Name: ${project.name}`);
    console.log(`   Path: ${project.path}`);
    console.log(`   Rules Version: v${project.rulesVersion}`);
    console.log(`   Role: ${project.role}`);
    console.log('');
    console.log('Next steps:');
    console.log('  • Run: diet103 rules sync');
    console.log('  • Run: diet103 rules list');

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Show rule sync status
 */
export async function rulesStatusCommand(options = {}) {
  await loadModules();
  
  const registry = new ProjectRegistry();
  const targetPath = process.cwd();

  try {
    // Check if registered
    const target = await registry.getByPath(targetPath);

    if (!target) {
      console.log('❌ Not registered with rule sync system');
      console.log('   Run: diet103 rules register');
      return;
    }

    console.log('📦 Rule Sync Status:');
    console.log('');
    console.log(`Project: ${target.name}`);
    console.log(`Rules Version: v${target.rulesVersion}`);
    console.log(`Role: ${target.role}`);
    
    if (target.lastSynced) {
      console.log(`Last Synced: ${new Date(target.lastSynced).toLocaleString()}`);
    } else {
      console.log('Last Synced: Never');
    }
    
    console.log('');

    // Get source for comparison
    try {
      const source = await registry.getSource();
      const checker = new VersionChecker();
      const result = await checker.check(source.path, target.path);

      if (result.updates.length === 0) {
        console.log('✅ Up to date');
      } else {
        console.log(`⚠️  ${result.updates.length} update(s) available`);
        console.log('   Run: diet103 rules sync');
      }
    } catch (error) {
      console.log('⚠️  Cannot check for updates (no source project)');
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

