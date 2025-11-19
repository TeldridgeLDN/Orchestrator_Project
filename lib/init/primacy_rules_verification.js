#!/usr/bin/env node

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
 * @module init/primacy_rules_verification
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
    minSize: 10000, // ~14KB expected
    description: 'Meta-rules governing rule interactions'
  },
  {
    file: 'platform-primacy.md',
    name: 'Platform Primacy',
    priority: 'CRITICAL',
    minSize: 7000, // ~8.4KB expected
    description: '.claude/rules/ takes precedence'
  },
  {
    file: 'context-isolation.md',
    name: 'Context Isolation',
    priority: 'CRITICAL',
    minSize: 14000, // ~16KB expected
    description: 'Single active context protocol'
  },
  {
    file: 'autonomy-boundaries.md',
    name: 'Autonomy Boundaries',
    priority: 'CRITICAL',
    minSize: 13000, // ~15KB expected
    description: 'Confirmation protocol'
  },
  {
    file: 'non-interactive-execution.md',
    name: 'Non-Interactive Execution',
    priority: 'CRITICAL',
    minSize: 17000, // ~19KB expected
    description: 'Automation-first design'
  },
  {
    file: 'context-efficiency.md',
    name: 'Context Efficiency',
    priority: 'CRITICAL',
    minSize: 14000, // ~16KB expected
    description: 'Token economy, 500-line rule'
  },
  {
    file: 'documentation-economy.md',
    name: 'Documentation Economy',
    priority: 'CRITICAL',
    minSize: 18000, // ~20KB expected
    description: 'Combat doc bloat'
  },
  {
    file: 'file-lifecycle-standard.md',
    name: 'File Lifecycle',
    priority: 'HIGH',
    minSize: 7000, // ~8.2KB expected
    description: 'Auto-archiving system'
  },
  {
    file: 'core-infrastructure-standard.md',
    name: 'Core Infrastructure',
    priority: 'HIGH',
    minSize: 5000, // ~6.6KB expected
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
    
    // Check file size (basic integrity check)
    const sizeOk = stats.size >= rule.minSize;
    
    // Check content has expected markdown structure
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
  
  // Check if rules directory exists
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
  
  // Verify each rule
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
    
    // Update stats
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
  
  // Display results if verbose
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
 * 
 * @param {Array} results - Verification results
 * @param {Object} stats - Statistics
 */
function displayVerificationResults(results, stats) {
  console.log('');
  console.log(chalk.dim('📊 Primacy Rules Status:'));
  
  // Group by priority
  const critical = results.filter(r => r.rule.priority === 'CRITICAL');
  const high = results.filter(r => r.rule.priority === 'HIGH');
  
  // Display critical rules
  console.log('');
  console.log(chalk.dim('   CRITICAL Priority:'));
  for (const result of critical) {
    displayRuleStatus(result);
  }
  
  // Display high priority rules
  console.log('');
  console.log(chalk.dim('   HIGH Priority:'));
  for (const result of high) {
    displayRuleStatus(result);
  }
  
  // Summary
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
 * 
 * @param {Object} result - Rule verification result
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
  } else if (status === 'missing') {
    icon = '✗';
    color = chalk.red;
  } else {
    icon = '✗';
    color = chalk.red;
  }
  
  const sizeStr = size ? `(${(size / 1024).toFixed(1)}KB)` : '';
  console.log(color(`   ${icon} ${rule.name.padEnd(25)} ${sizeStr}`));
  
  // Display warnings if any
  if (warnings && warnings.length > 0) {
    for (const warning of warnings) {
      console.log(chalk.dim(`      → ${warning}`));
    }
  }
}

/**
 * Check if global rules sync is needed
 * 
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<boolean>} True if sync recommended
 */
export async function shouldSyncGlobalRules(projectRoot) {
  const globalRulesDir = path.join(process.env.HOME || process.env.USERPROFILE, '.orchestrator', 'rules');
  
  try {
    await fs.access(globalRulesDir);
    
    // Check if manifest exists
    const manifestPath = path.join(globalRulesDir, '.rule-manifest.json');
    try {
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
      
      // Check if it's recent (within last 30 days)
      const lastUpdate = new Date(manifest.lastUpdated);
      const daysSince = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      
      return daysSince > 30; // Recommend sync if older than 30 days
    } catch {
      return true; // No manifest, recommend sync
    }
  } catch {
    return true; // Directory doesn't exist, recommend sync
  }
}

/**
 * Get remediation suggestions for missing/broken rules
 * 
 * @param {Object} verificationResult - Result from verifyPrimacyRules
 * @returns {string[]} List of suggested actions
 */
export function getRemediationSuggestions(verificationResult) {
  const suggestions = [];
  
  if (verificationResult.stats.missing > 0) {
    suggestions.push('Run: npm run sync-rules (to restore missing rules from backup)');
  }
  
  if (verificationResult.stats.warnings > 0) {
    suggestions.push('Review: .claude/rules/ files may be corrupted or incomplete');
  }
  
  if (!verificationResult.success) {
    suggestions.push('Refer to: COMPLETE_PRIMACY_RULES_SUMMARY.md for rule details');
  }
  
  return suggestions;
}

export default verifyPrimacyRules;

