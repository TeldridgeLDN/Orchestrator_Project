#!/usr/bin/env node

/**
 * Sync Pull Engine
 * 
 * diet103 compliant: <500 lines, single responsibility
 * Pulls rules from source to target project
 */

const fs = require('fs').promises;
const path = require('path');

class SyncPull {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
  }

  /**
   * Pull rules from source to target
   */
  async pull(sourcePath, targetPath, updates, options = {}) {
    const results = {
      success: [],
      skipped: [],
      failed: [],
      dryRun: this.dryRun
    };

    // Filter updates based on options
    let filteredUpdates = updates;
    
    if (options.only) {
      // Only sync specific categories or rules
      filteredUpdates = updates.filter(u => 
        options.only.some(filter => u.path.includes(filter))
      );
    }

    if (options.exclude) {
      // Exclude specific categories or rules
      filteredUpdates = filteredUpdates.filter(u =>
        !options.exclude.some(filter => u.path.includes(filter))
      );
    }

    // Process each update
    for (const update of filteredUpdates) {
      try {
        const result = await this.pullRule(sourcePath, targetPath, update);
        
        if (result.skipped) {
          results.skipped.push(result);
        } else {
          results.success.push(result);
        }

        if (this.verbose) {
          console.log(this.formatResult(result));
        }
      } catch (error) {
        results.failed.push({
          path: update.path,
          error: error.message
        });
        
        if (this.verbose) {
          console.error(`❌ Failed: ${update.path} - ${error.message}`);
        }
      }
    }

    // Update target manifest if not dry run
    if (!this.dryRun && results.success.length > 0) {
      await this.updateTargetManifest(sourcePath, targetPath);
    }

    return results;
  }

  /**
   * Pull a single rule file
   */
  async pullRule(sourcePath, targetPath, update) {
    const sourceFile = path.join(sourcePath, update.path);
    const targetFile = path.join(targetPath, update.path);

    // Check if rule allows local override
    if (update.scope === 'customizable') {
      // Check if target has customizations
      const hasCustomizations = await this.hasLocalCustomizations(targetFile);
      
      if (hasCustomizations) {
        return {
          path: update.path,
          type: update.type,
          skipped: true,
          reason: 'Local customizations present (use --force to override)'
        };
      }
    }

    // Read source file
    const sourceContent = await fs.readFile(sourceFile, 'utf-8');

    if (this.dryRun) {
      return {
        path: update.path,
        type: update.type,
        dryRun: true,
        message: 'Would sync'
      };
    }

    // Ensure target directory exists
    const targetDir = path.dirname(targetFile);
    await fs.mkdir(targetDir, { recursive: true });

    // Create backup if target exists
    try {
      await fs.access(targetFile);
      const backupPath = `${targetFile}.backup`;
      await fs.copyFile(targetFile, backupPath);
    } catch {
      // Target doesn't exist - no backup needed
    }

    // Write to target
    await fs.writeFile(targetFile, sourceContent, 'utf-8');

    return {
      path: update.path,
      type: update.type,
      sourceVersion: update.sourceVersion,
      targetVersion: update.targetVersion,
      success: true
    };
  }

  /**
   * Check if a file has local customizations
   * (Placeholder - could be enhanced with comment markers)
   */
  async hasLocalCustomizations(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      // Check for customization markers
      return content.includes('<!-- LOCAL CUSTOMIZATION -->') ||
             content.includes('# LOCAL CUSTOMIZATION');
    } catch {
      return false; // File doesn't exist
    }
  }

  /**
   * Update target manifest after successful sync
   */
  async updateTargetManifest(sourcePath, targetPath) {
    const sourceManifestPath = path.join(sourcePath, '.claude', 'rules', '.rule-manifest.json');
    const targetManifestPath = path.join(targetPath, '.claude', 'rules', '.rule-manifest.json');

    // Read source manifest
    const sourceContent = await fs.readFile(sourceManifestPath, 'utf-8');
    const sourceManifest = JSON.parse(sourceContent);

    // Read or create target manifest
    let targetManifest;
    try {
      const targetContent = await fs.readFile(targetManifestPath, 'utf-8');
      targetManifest = JSON.parse(targetContent);
    } catch {
      // Create new manifest
      targetManifest = {
        manifestVersion: sourceManifest.manifestVersion,
        rulesVersion: '0.0.0',
        lastUpdated: new Date().toISOString(),
        sourceProject: sourceManifest.sourceProject,
        rules: {},
        categories: sourceManifest.categories
      };
    }

    // Update target manifest with source data
    targetManifest.rulesVersion = sourceManifest.rulesVersion;
    targetManifest.lastUpdated = new Date().toISOString();
    targetManifest.rules = { ...sourceManifest.rules };
    targetManifest.categories = { ...sourceManifest.categories };

    // Ensure directory exists
    const targetDir = path.dirname(targetManifestPath);
    await fs.mkdir(targetDir, { recursive: true });

    // Write updated manifest
    await fs.writeFile(targetManifestPath, JSON.stringify(targetManifest, null, 2));
  }

  /**
   * Format result for display
   */
  formatResult(result) {
    if (result.skipped) {
      return `⏭️  Skipped: ${result.path} (${result.reason})`;
    }

    if (result.dryRun) {
      return `🔍 Would sync: ${result.path}`;
    }

    const typeEmoji = {
      new: '✨',
      update: '⬆️',
      modified: '🔧',
      removed: '🗑️'
    };

    const emoji = typeEmoji[result.type] || '✅';
    return `${emoji} Synced: ${result.path}`;
  }

  /**
   * Generate sync summary
   */
  formatSummary(results) {
    const lines = [];
    
    lines.push('');
    lines.push('📦 Sync Summary');
    lines.push('─'.repeat(60));

    if (results.dryRun) {
      lines.push('🔍 DRY RUN - No changes made');
      lines.push('');
    }

    lines.push(`✅ Success: ${results.success.length}`);
    lines.push(`⏭️  Skipped: ${results.skipped.length}`);
    lines.push(`❌ Failed: ${results.failed.length}`);
    lines.push('');

    if (results.success.length > 0) {
      lines.push('Successfully synced:');
      results.success.forEach(r => {
        lines.push(`  • ${r.path}`);
      });
      lines.push('');
    }

    if (results.skipped.length > 0) {
      lines.push('Skipped:');
      results.skipped.forEach(r => {
        lines.push(`  • ${r.path} - ${r.reason}`);
      });
      lines.push('');
    }

    if (results.failed.length > 0) {
      lines.push('Failed:');
      results.failed.forEach(r => {
        lines.push(`  • ${r.path} - ${r.error}`);
      });
      lines.push('');
    }

    if (!results.dryRun && results.success.length > 0) {
      lines.push('✅ Sync complete!');
    }

    lines.push('─'.repeat(60));

    return lines.join('\n');
  }

  /**
   * Show diff for a rule
   */
  async showDiff(sourcePath, targetPath, rulePath) {
    const sourceFile = path.join(sourcePath, rulePath);
    const targetFile = path.join(targetPath, rulePath);

    try {
      const [sourceContent, targetContent] = await Promise.all([
        fs.readFile(sourceFile, 'utf-8'),
        fs.readFile(targetFile, 'utf-8').catch(() => '')
      ]);

      // Simple line-by-line diff
      const sourceLines = sourceContent.split('\n');
      const targetLines = targetContent.split('\n');

      const maxLines = Math.max(sourceLines.length, targetLines.length);
      const diff = [];

      for (let i = 0; i < maxLines; i++) {
        const sourceLine = sourceLines[i];
        const targetLine = targetLines[i];

        if (sourceLine === targetLine) {
          diff.push(`  ${i + 1} | ${sourceLine || ''}`);
        } else if (!targetLine) {
          diff.push(`+ ${i + 1} | ${sourceLine}`);
        } else if (!sourceLine) {
          diff.push(`- ${i + 1} | ${targetLine}`);
        } else {
          diff.push(`- ${i + 1} | ${targetLine}`);
          diff.push(`+ ${i + 1} | ${sourceLine}`);
        }
      }

      return diff.join('\n');
    } catch (error) {
      throw new Error(`Failed to generate diff: ${error.message}`);
    }
  }
}

module.exports = SyncPull;

// CLI usage
if (require.main === module) {
  const sourcePath = process.argv[2];
  const targetPath = process.argv[3];
  const flags = process.argv.slice(4);

  if (!sourcePath || !targetPath) {
    console.error('Usage: sync-pull.js <source-path> <target-path> [--dry-run] [--verbose]');
    process.exit(1);
  }

  const options = {
    dryRun: flags.includes('--dry-run'),
    verbose: flags.includes('--verbose') || flags.includes('-v')
  };

  const VersionChecker = require('./version-check.cjs');
  const checker = new VersionChecker();
  const syncer = new SyncPull(options);

  (async () => {
    try {
      // Check what needs syncing
      const checkResult = await checker.check(sourcePath, targetPath);
      
      if (checkResult.updates.length === 0) {
        console.log('✅ All rules up to date');
        process.exit(0);
      }

      console.log(`📦 Syncing ${checkResult.updates.length} rule(s)...`);
      console.log('');

      // Pull updates
      const results = await syncer.pull(sourcePath, targetPath, checkResult.updates);
      
      console.log(syncer.formatSummary(results));
      
      process.exit(results.failed.length > 0 ? 1 : 0);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(2);
    }
  })();
}

