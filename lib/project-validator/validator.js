/**
 * Project Identity Validator
 * 
 * Validates project identity consistency across multiple signals
 * to prevent wrong-project implementations.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ProjectValidator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.signals = {};
  }

  /**
   * Gather all project identity signals
   */
  async gatherSignals() {
    this.signals = {
      directoryName: this.getDirectoryName(),
      configProjectName: await this.getConfigProjectName(),
      gitRemoteName: await this.getGitRemoteName(),
      packageName: await this.getPackageName(),
      prdProjectName: null, // Set separately when validating PRD
    };

    return this.signals;
  }

  /**
   * Get project name from directory
   */
  getDirectoryName() {
    return path.basename(this.projectRoot);
  }

  /**
   * Get project name from config.json
   */
  async getConfigProjectName() {
    try {
      const configPath = path.join(this.projectRoot, '.taskmaster/config.json');
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      return config.global?.projectName || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get project name from git remote
   */
  async getGitRemoteName() {
    try {
      const remote = execSync('git remote get-url origin', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim();

      // Extract repo name from URL
      const match = remote.match(/\/([^\/]+?)(\.git)?$/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get project name from package.json
   */
  async getPackageName() {
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      const content = await fs.readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(content);
      return pkg.name || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract project name from PRD content
   */
  extractPrdProjectName(prdContent) {
    const match = prdContent.match(/\*\*Project\*\*:\s*(.+)/);
    return match ? match[1].trim() : null;
  }

  /**
   * Normalize string for comparison
   */
  normalize(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Determine canonical project name from signals
   */
  determineCanonicalName() {
    // Priority: configProjectName > directoryName > gitRemoteName > packageName
    return (
      this.signals.configProjectName ||
      this.signals.directoryName ||
      this.signals.gitRemoteName ||
      this.signals.packageName ||
      'Unknown'
    );
  }

  /**
   * Check if two project names match (fuzzy)
   */
  namesMatch(name1, name2) {
    if (!name1 || !name2) return false;

    const norm1 = this.normalize(name1);
    const norm2 = this.normalize(name2);

    // Exact match
    if (norm1 === norm2) return true;

    // One contains the other (for cases like "Orchestrator" vs "Orchestrator_Project")
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      // But not if difference is too large (avoid false positives)
      const lengthRatio = Math.min(norm1.length, norm2.length) / Math.max(norm1.length, norm2.length);
      return lengthRatio > 0.3; // At least 30% overlap (relaxed for full names)
    }

    // Check if core identifiers match (extract key words)
    const words1 = name1.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 3);
    const words2 = name2.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 3);
    
    // If both contain "orchestrator", consider it a match
    const commonWords = words1.filter(w => words2.includes(w));
    if (commonWords.length > 0) {
      return true;
    }

    return false;
  }

  /**
   * Validate project identity consistency
   */
  async validate() {
    await this.gatherSignals();

    const canonical = this.determineCanonicalName();
    const warnings = [];
    const errors = [];

    // Check consistency between signals
    const signals = [
      { name: 'Config', value: this.signals.configProjectName },
      { name: 'Directory', value: this.signals.directoryName },
      { name: 'Git Remote', value: this.signals.gitRemoteName },
      { name: 'Package.json', value: this.signals.packageName },
    ].filter(s => s.value); // Only check non-null signals

    // Check each signal against canonical
    for (const signal of signals) {
      if (!this.namesMatch(signal.value, canonical)) {
        warnings.push(
          `${signal.name} "${signal.value}" doesn't match canonical name "${canonical}"`
        );
      }
    }

    return {
      projectRoot: this.projectRoot,
      signals: this.signals,
      canonicalName: canonical,
      isConsistent: warnings.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * Validate PRD against project identity
   */
  async validatePrd(prdPath) {
    // First validate project identity
    const validation = await this.validate();

    // Read PRD content
    const prdContent = await fs.readFile(prdPath, 'utf-8');
    const prdProjectName = this.extractPrdProjectName(prdContent);

    if (!prdProjectName) {
      validation.warnings.push('PRD has no "**Project**:" field');
      return validation;
    }

    // Check if PRD project name matches canonical
    if (!this.namesMatch(prdProjectName, validation.canonicalName)) {
      validation.errors.push(
        `PRD project "${prdProjectName}" doesn't match current project "${validation.canonicalName}"`
      );
      validation.isConsistent = false;
    }

    validation.signals.prdProjectName = prdProjectName;

    return validation;
  }

  /**
   * Generate validation report
   */
  generateReport(validation) {
    const lines = [];

    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('           PROJECT IDENTITY VALIDATION REPORT');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('');

    lines.push('📍 Project Signals:');
    lines.push(`   Directory:    ${validation.signals.directoryName || 'N/A'}`);
    lines.push(`   Config:       ${validation.signals.configProjectName || 'N/A'}`);
    lines.push(`   Git Remote:   ${validation.signals.gitRemoteName || 'N/A'}`);
    lines.push(`   Package.json: ${validation.signals.packageName || 'N/A'}`);
    if (validation.signals.prdProjectName) {
      lines.push(`   PRD:          ${validation.signals.prdProjectName}`);
    }
    lines.push('');

    lines.push(`🎯 Canonical Name: ${validation.canonicalName}`);
    lines.push('');

    if (validation.isConsistent) {
      lines.push('✅ Status: CONSISTENT - All signals match');
    } else {
      lines.push('⚠️  Status: INCONSISTENT - Issues detected');
    }
    lines.push('');

    if (validation.warnings.length > 0) {
      lines.push('⚠️  Warnings:');
      validation.warnings.forEach(w => lines.push(`   - ${w}`));
      lines.push('');
    }

    if (validation.errors.length > 0) {
      lines.push('🛑 Errors:');
      validation.errors.forEach(e => lines.push(`   - ${e}`));
      lines.push('');
    }

    if (!validation.isConsistent) {
      lines.push('💡 Recommendations:');
      if (validation.signals.configProjectName !== validation.canonicalName) {
        lines.push(`   - Update .taskmaster/config.json projectName to "${validation.canonicalName}"`);
      }
      if (validation.errors.length > 0) {
        lines.push('   - Update PRD "**Project**:" field to match current project');
        lines.push('   - OR switch to correct project directory');
        lines.push('   - OR confirm this is intentional cross-project work');
      }
    }

    lines.push('═══════════════════════════════════════════════════════════');

    return lines.join('\n');
  }
}

module.exports = ProjectValidator;

