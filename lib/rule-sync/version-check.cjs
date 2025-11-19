#!/usr/bin/env node

/**
 * Version Checker
 * 
 * diet103 compliant: <500 lines, single responsibility
 * Compares rule versions and checksums between projects
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class VersionChecker {
  /**
   * Load manifest from a project
   */
  async loadManifest(projectPath) {
    const manifestPath = path.join(projectPath, '.claude', 'rules', '.rule-manifest.json');
    
    try {
      const content = await fs.readFile(manifestPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load manifest from ${projectPath}: ${error.message}`);
    }
  }

  /**
   * Calculate checksum of a file
   */
  async calculateChecksum(filePath) {
    try {
      const content = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      return null;
    }
  }

  /**
   * Compare two semantic versions
   * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      
      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }
    
    return 0;
  }

  /**
   * Check if a project's rules are outdated
   */
  async check(sourcePath, targetPath) {
    const sourceManifest = await this.loadManifest(sourcePath);
    let targetManifest;
    
    try {
      targetManifest = await this.loadManifest(targetPath);
    } catch (error) {
      // No manifest = needs full sync
      return {
        status: 'missing',
        message: 'No rule manifest found - full sync needed',
        sourceVersion: sourceManifest.rulesVersion,
        targetVersion: '0.0.0',
        updates: Object.keys(sourceManifest.rules).map(rulePath => ({
          path: rulePath,
          type: 'new',
          sourceVersion: sourceManifest.rules[rulePath].version,
          description: sourceManifest.rules[rulePath].description
        }))
      };
    }

    // Compare versions
    const versionComparison = this.compareVersions(
      sourceManifest.rulesVersion,
      targetManifest.rulesVersion
    );

    if (versionComparison === 0) {
      // Same version - verify checksums
      const differences = await this.findDifferences(
        sourcePath,
        targetPath,
        sourceManifest,
        targetManifest
      );

      if (differences.length === 0) {
        return {
          status: 'up-to-date',
          message: 'All rules up to date',
          sourceVersion: sourceManifest.rulesVersion,
          targetVersion: targetManifest.rulesVersion,
          updates: []
        };
      }

      return {
        status: 'modified',
        message: 'Checksum mismatches detected',
        sourceVersion: sourceManifest.rulesVersion,
        targetVersion: targetManifest.rulesVersion,
        updates: differences
      };
    }

    if (versionComparison > 0) {
      // Source is newer
      const differences = await this.findDifferences(
        sourcePath,
        targetPath,
        sourceManifest,
        targetManifest
      );

      return {
        status: 'outdated',
        message: `Updates available (${targetManifest.rulesVersion} → ${sourceManifest.rulesVersion})`,
        sourceVersion: sourceManifest.rulesVersion,
        targetVersion: targetManifest.rulesVersion,
        updates: differences
      };
    }

    // Target is newer (unusual)
    return {
      status: 'ahead',
      message: 'Target has newer version than source',
      sourceVersion: sourceManifest.rulesVersion,
      targetVersion: targetManifest.rulesVersion,
      updates: []
    };
  }

  /**
   * Find differences between source and target manifests
   */
  async findDifferences(sourcePath, targetPath, sourceManifest, targetManifest) {
    const differences = [];
    const sourceRules = sourceManifest.rules;
    const targetRules = targetManifest.rules;

    // Check each source rule
    for (const [rulePath, sourceRule] of Object.entries(sourceRules)) {
      const targetRule = targetRules[rulePath];

      if (!targetRule) {
        // New rule in source
        differences.push({
          path: rulePath,
          type: 'new',
          sourceVersion: sourceRule.version,
          targetVersion: null,
          description: sourceRule.description,
          priority: sourceRule.priority,
          scope: sourceRule.scope
        });
        continue;
      }

      // Compare versions
      const versionDiff = this.compareVersions(sourceRule.version, targetRule.version);
      
      if (versionDiff > 0) {
        // Source rule is newer
        differences.push({
          path: rulePath,
          type: 'update',
          sourceVersion: sourceRule.version,
          targetVersion: targetRule.version,
          description: sourceRule.description,
          priority: sourceRule.priority,
          scope: sourceRule.scope
        });
        continue;
      }

      // Same version - check checksum
      if (sourceRule.checksum !== targetRule.checksum) {
        // Verify actual file checksums
        const sourceFile = path.join(sourcePath, rulePath);
        const targetFile = path.join(targetPath, rulePath);
        
        const sourceChecksum = await this.calculateChecksum(sourceFile);
        const targetChecksum = await this.calculateChecksum(targetFile);

        if (sourceChecksum && targetChecksum && sourceChecksum !== targetChecksum) {
          differences.push({
            path: rulePath,
            type: 'modified',
            sourceVersion: sourceRule.version,
            targetVersion: targetRule.version,
            description: sourceRule.description,
            priority: sourceRule.priority,
            scope: sourceRule.scope,
            checksumMismatch: true
          });
        }
      }
    }

    // Check for rules that exist in target but not source (removed)
    for (const rulePath of Object.keys(targetRules)) {
      if (!sourceRules[rulePath]) {
        differences.push({
          path: rulePath,
          type: 'removed',
          sourceVersion: null,
          targetVersion: targetRules[rulePath].version,
          description: targetRules[rulePath].description
        });
      }
    }

    return differences;
  }

  /**
   * Generate human-readable status report
   */
  formatReport(checkResult) {
    const lines = [];
    
    lines.push('📦 Rule Sync Status');
    lines.push('─'.repeat(60));
    lines.push(`Status: ${this.formatStatus(checkResult.status)}`);
    lines.push(`Source Version: v${checkResult.sourceVersion}`);
    lines.push(`Target Version: v${checkResult.targetVersion}`);
    lines.push('');

    if (checkResult.updates.length === 0) {
      lines.push('✅ All rules up to date');
      return lines.join('\n');
    }

    // Group by type
    const byType = {
      new: [],
      update: [],
      modified: [],
      removed: []
    };

    checkResult.updates.forEach(update => {
      byType[update.type].push(update);
    });

    if (byType.new.length > 0) {
      lines.push('✨ New Rules:');
      byType.new.forEach(u => {
        lines.push(`  • ${u.path} (v${u.sourceVersion})`);
        if (u.description) lines.push(`    ${u.description}`);
      });
      lines.push('');
    }

    if (byType.update.length > 0) {
      lines.push('⬆️  Updated Rules:');
      byType.update.forEach(u => {
        lines.push(`  • ${u.path} (v${u.targetVersion} → v${u.sourceVersion})`);
        if (u.description) lines.push(`    ${u.description}`);
      });
      lines.push('');
    }

    if (byType.modified.length > 0) {
      lines.push('⚠️  Modified Rules (checksum mismatch):');
      byType.modified.forEach(u => {
        lines.push(`  • ${u.path}`);
      });
      lines.push('');
    }

    if (byType.removed.length > 0) {
      lines.push('🗑️  Removed Rules:');
      byType.removed.forEach(u => {
        lines.push(`  • ${u.path} (was v${u.targetVersion})`);
      });
      lines.push('');
    }

    lines.push('─'.repeat(60));
    lines.push('Run: orchestrator rule-sync pull');

    return lines.join('\n');
  }

  /**
   * Format status with emoji
   */
  formatStatus(status) {
    const statusMap = {
      'up-to-date': '✅ Up to date',
      'outdated': '⚠️  Outdated',
      'missing': '❌ Missing',
      'modified': '⚠️  Modified',
      'ahead': '⚡ Ahead of source'
    };
    return statusMap[status] || status;
  }

  /**
   * Quick check - just return boolean
   */
  async isOutdated(sourcePath, targetPath) {
    const result = await this.check(sourcePath, targetPath);
    return ['outdated', 'missing', 'modified'].includes(result.status);
  }
}

module.exports = VersionChecker;

// CLI usage
if (require.main === module) {
  const checker = new VersionChecker();
  const sourcePath = process.argv[2];
  const targetPath = process.argv[3];

  if (!sourcePath || !targetPath) {
    console.error('Usage: version-check.js <source-path> <target-path>');
    process.exit(1);
  }

  (async () => {
    try {
      const result = await checker.check(sourcePath, targetPath);
      console.log(checker.formatReport(result));
      
      // Exit code: 0 = up-to-date, 1 = needs sync
      process.exit(result.updates.length > 0 ? 1 : 0);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(2);
    }
  })();
}

