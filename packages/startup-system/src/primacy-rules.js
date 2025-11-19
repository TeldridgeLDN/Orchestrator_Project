/**
 * Primacy Rules Verification System
 * 
 * Ensures all 9 critical primacy rules are present and intact on startup.
 * Provides clear reporting of rule status and potential issues.
 * 
 * Philosophy:
 * - Verify critical infrastructure is present
 * - Non-blocking: warn but don't fail startup
 * - Clear actionable feedback
 * - Support for global rule sync
 * 
 * @module @diet103/startup-system/primacy-rules
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

/**
 * Expected primacy rules (9 total)
 */
const PRIMACY_RULES = [
  {
    file: 'rule-integrity.md',
    name: 'Rule Integrity',
    priority: 'CRITICAL',
    minSize: 10000,
    description: 'Meta-rules governing rule interactions'
  },
  {
    file: 'platform-primacy.md',
    name: 'Platform Primacy',
    priority: 'CRITICAL',
    minSize: 7000,
    description: '.claude/rules/ takes precedence'
  },
  {
    file: 'context-isolation.md',
    name: 'Context Isolation',
    priority: 'CRITICAL',
    minSize: 14000,
    description: 'Single active context protocol'
  },
  {
    file: 'autonomy-boundaries.md',
    name: 'Autonomy Boundaries',
    priority: 'CRITICAL',
    minSize: 13000,
    description: 'Confirmation protocol'
  },
  {
    file: 'non-interactive-execution.md',
    name: 'Non-Interactive Execution',
    priority: 'CRITICAL',
    minSize: 17000,
    description: 'Automation-first design'
  },
  {
    file: 'context-efficiency.md',
    name: 'Context Efficiency',
    priority: 'CRITICAL',
    minSize: 14000,
    description: 'Token economy, 500-line rule'
  },
  {
    file: 'documentation-economy.md',
    name: 'Documentation Economy',
    priority: 'CRITICAL',
    minSize: 18000,
    description: 'Combat doc bloat'
  },
  {
    file: 'file-lifecycle-standard.md',
    name: 'File Lifecycle',
    priority: 'HIGH',
    minSize: 7000,
    description: 'Auto-archiving system'
  },
  {
    file: 'core-infrastructure-standard.md',
    name: 'Core Infrastructure',
    priority: 'HIGH',
    minSize: 5000,
    description: 'Infrastructure standards'
  }
];

/**
 * Verify a single rule file
 * 
 * @param {string} rulesDir - Path to .claude/rules directory
 * @param {Object} rule - Rule definition
 * @returns {Promise<Object>} Verification result
 */
async function verifyRule(rulesDir, rule) {
  const filePath = path.join(rulesDir, rule.file);
  
  try {
    const stats = await fs.stat(filePath);
    const content = await fs.readFile(filePath, 'utf-8');
    
    const sizeOk = stats.size >= rule.minSize;
    const hasHeading = content.includes('#');
    const hasDescription = content.length > 100;
    
    return {
      exists: true,
      size: stats.size,
      sizeOk,
      contentOk: hasHeading && hasDescription,
      status: sizeOk && hasHeading && hasDescription ? 'ok' : 'warning',
      warnings: [
        !sizeOk ? `File unusually small (${stats.size} bytes, expected ${rule.minSize}+)` : null,
        !hasHeading ? 'Missing markdown headings' : null,
        !hasDescription ? 'File appears empty' : null
      ].filter(Boolean)
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        exists: false,
        status: 'missing',
        error: 'File not found'
      };
    }
    
    return {
      exists: false,
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Verify all primacy rules
 * 
 * @param {Object} options - Verification options
 * @param {string} options.projectRoot - Project root directory
 * @param {boolean} [options.verbose=false] - Show detailed output
 * @returns {Promise<Object>} Verification results
 */
export async function verifyPrimacyRules(options) {
  const { projectRoot, verbose = false } = options;
  const rulesDir = path.join(projectRoot, '.claude/rules');
  
  if (verbose) {
    console.log(chalk.dim('🔍 Verifying Primacy Rules...'));
  }
  
  try {
    await fs.access(rulesDir);
  } catch {
    return {
      success: false,
      error: '.claude/rules/ directory not found',
      results: [],
      stats: {
        total: PRIMACY_RULES.length,
        ok: 0,
        warnings: 0,
        missing: 0,
        errors: 0
      }
    };
  }
  
  const results = [];
  const stats = {
    total: PRIMACY_RULES.length,
    ok: 0,
    warnings: 0,
    missing: 0,
    errors: 0
  };
  
  for (const rule of PRIMACY_RULES) {
    const result = await verifyRule(rulesDir, rule);
    results.push({
      rule,
      ...result
    });
    
    if (result.status === 'ok') {
      stats.ok++;
    } else if (result.status === 'warning') {
      stats.warnings++;
    } else if (result.status === 'missing') {
      stats.missing++;
    } else if (result.status === 'error') {
      stats.errors++;
    }
  }
  
  if (verbose) {
    displayVerificationResults(results, stats);
  }
  
  return {
    success: stats.missing === 0 && stats.errors === 0,
    results,
    stats
  };
}

/**
 * Display verification results
 */
function displayVerificationResults(results, stats) {
  console.log('');
  console.log(chalk.dim('📊 Primacy Rules Status:'));
  
  const critical = results.filter(r => r.rule.priority === 'CRITICAL');
  const high = results.filter(r => r.rule.priority === 'HIGH');
  
  console.log('');
  console.log(chalk.dim('   CRITICAL Priority:'));
  for (const result of critical) {
    displayRuleStatus(result);
  }
  
  console.log('');
  console.log(chalk.dim('   HIGH Priority:'));
  for (const result of high) {
    displayRuleStatus(result);
  }
  
  console.log('');
  console.log(chalk.dim('   Summary:'));
  console.log(chalk.green(`   ✓ OK:       ${stats.ok}/${stats.total}`));
  
  if (stats.warnings > 0) {
    console.log(chalk.yellow(`   ⚠ Warnings: ${stats.warnings}`));
  }
  
  if (stats.missing > 0) {
    console.log(chalk.red(`   ✗ Missing:  ${stats.missing}`));
  }
  
  if (stats.errors > 0) {
    console.log(chalk.red(`   ✗ Errors:   ${stats.errors}`));
  }
  
  console.log('');
}

/**
 * Display single rule status
 */
function displayRuleStatus(result) {
  const { rule, status, size, warnings } = result;
  
  let icon, color;
  if (status === 'ok') {
    icon = '✓';
    color = chalk.green;
  } else if (status === 'warning') {
    icon = '⚠';
    color = chalk.yellow;
  } else {
    icon = '✗';
    color = chalk.red;
  }
  
  const sizeStr = size ? `(${(size / 1024).toFixed(1)}KB)` : '';
  console.log(color(`   ${icon} ${rule.name.padEnd(25)} ${sizeStr}`));
  
  if (warnings && warnings.length > 0) {
    for (const warning of warnings) {
      console.log(chalk.dim(`      → ${warning}`));
    }
  }
}

/**
 * Check if global rules sync is needed
 */
export async function shouldSyncGlobalRules(projectRoot) {
  const globalRulesDir = path.join(process.env.HOME || process.env.USERPROFILE, '.orchestrator', 'rules');
  
  try {
    await fs.access(globalRulesDir);
    
    const manifestPath = path.join(globalRulesDir, '.rule-manifest.json');
    try {
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
      const lastUpdate = new Date(manifest.lastUpdated);
      const daysSince = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      
      return daysSince > 30;
    } catch {
      return true;
    }
  } catch {
    return true;
  }
}

/**
 * Get remediation suggestions for missing/broken rules
 */
export function getRemediationSuggestions(verificationResult) {
  const suggestions = [];
  
  if (verificationResult.stats.missing > 0) {
    suggestions.push('Run: npm run sync-rules-global (to restore missing rules)');
  }
  
  if (verificationResult.stats.warnings > 0) {
    suggestions.push('Review: .claude/rules/ files may be corrupted or incomplete');
  }
  
  if (!verificationResult.success) {
    suggestions.push('Check: Primacy rules documentation');
  }
  
  return suggestions;
}

export default verifyPrimacyRules;

