/**
 * Validation Report Generator
 * 
 * Generates human-readable validation reports in multiple formats
 * 
 * @module hooks/validator/ValidationReporter
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Validation Reporter Class
 */
export class ValidationReporter {
  /**
   * Generate console report
   * 
   * @param {Object} validationResult - Validation result from HookValidator
   * @returns {string} Formatted console output
   */
  static generateConsoleReport(validationResult) {
    const { valid, hookName, summary, checks, errors, warnings } = validationResult;
    
    let report = [];
    
    // Header
    report.push('\n' + '='.repeat(60));
    report.push(`Hook Validation Report: ${hookName}`);
    report.push('='.repeat(60));
    
    // Status
    const statusSymbol = valid ? '✅' : '❌';
    const statusText = valid ? 'PASSED' : 'FAILED';
    report.push(`\nStatus: ${statusSymbol} ${statusText}`);
    report.push(`Score: ${summary.passed}/${summary.total} checks (${summary.percentage}%)`);
    
    // Checks
    report.push('\n' + '-'.repeat(60));
    report.push('Checks:');
    report.push('-'.repeat(60));
    
    for (const check of checks) {
      const symbol = check.passed ? '✓' : '✗';
      report.push(`${symbol} ${check.name}`);
      if (!check.passed || validationResult.metadata.strict) {
        report.push(`  └─ ${check.details}`);
      }
    }
    
    // Errors
    if (errors.length > 0) {
      report.push('\n' + '-'.repeat(60));
      report.push('❌ Errors:');
      report.push('-'.repeat(60));
      errors.forEach(error => report.push(`  • ${error}`));
    }
    
    // Warnings
    if (warnings.length > 0) {
      report.push('\n' + '-'.repeat(60));
      report.push('⚠️  Warnings:');
      report.push('-'.repeat(60));
      warnings.forEach(warning => report.push(`  • ${warning}`));
    }
    
    report.push('\n' + '='.repeat(60) + '\n');
    
    return report.join('\n');
  }

  /**
   * Generate batch console report
   * 
   * @param {Object} batchResults - Batch validation results
   * @returns {string} Formatted console output
   */
  static generateBatchConsoleReport(batchResults) {
    const { total, passed, failed, results } = batchResults;
    
    let report = [];
    
    // Header
    report.push('\n' + '='.repeat(60));
    report.push('Batch Hook Validation Report');
    report.push('='.repeat(60));
    
    // Summary
    report.push(`\nTotal hooks validated: ${total}`);
    report.push(`✅ Passed: ${passed}`);
    report.push(`❌ Failed: ${failed}`);
    report.push(`Success rate: ${Math.round((passed / total) * 100)}%`);
    
    // Individual results
    report.push('\n' + '-'.repeat(60));
    report.push('Individual Results:');
    report.push('-'.repeat(60));
    
    for (const [hookName, result] of Object.entries(results)) {
      const symbol = result.valid ? '✅' : '❌';
      const score = `${result.summary.passed}/${result.summary.total}`;
      report.push(`${symbol} ${hookName} (${score})`);
      
      if (!result.valid) {
        result.errors.forEach(error => 
          report.push(`    └─ ${error}`)
        );
      }
    }
    
    report.push('\n' + '='.repeat(60) + '\n');
    
    return report.join('\n');
  }

  /**
   * Generate markdown report
   * 
   * @param {Object} validationResult - Validation result
   * @returns {string} Markdown formatted report
   */
  static generateMarkdownReport(validationResult) {
    const { valid, hookName, summary, checks, errors, warnings, metadata } = validationResult;
    
    let report = [];
    
    // Header
    report.push(`# Hook Validation Report: ${hookName}`);
    report.push('');
    
    // Status badge
    const badge = valid ? '![PASSED](https://img.shields.io/badge/status-PASSED-green)' : '![FAILED](https://img.shields.io/badge/status-FAILED-red)';
    report.push(badge);
    report.push('');
    
    // Summary
    report.push('## Summary');
    report.push('');
    report.push(`- **Status:** ${valid ? '✅ PASSED' : '❌ FAILED'}`);
    report.push(`- **Score:** ${summary.passed}/${summary.total} (${summary.percentage}%)`);
    report.push(`- **Timestamp:** ${metadata.timestamp}`);
    report.push(`- **Strict Mode:** ${metadata.strict ? 'Yes' : 'No'}`);
    report.push('');
    
    // Checks
    report.push('## Validation Checks');
    report.push('');
    report.push('| Check | Status | Details |');
    report.push('|-------|--------|---------|');
    
    for (const check of checks) {
      const status = check.passed ? '✓' : '✗';
      report.push(`| ${check.name} | ${status} | ${check.details} |`);
    }
    report.push('');
    
    // Errors
    if (errors.length > 0) {
      report.push('## ❌ Errors');
      report.push('');
      errors.forEach(error => report.push(`- ${error}`));
      report.push('');
    }
    
    // Warnings
    if (warnings.length > 0) {
      report.push('## ⚠️ Warnings');
      report.push('');
      warnings.forEach(warning => report.push(`- ${warning}`));
      report.push('');
    }
    
    report.push('---');
    report.push('');
    report.push(`*Generated by Hook Validator v1.0.0*`);
    
    return report.join('\n');
  }

  /**
   * Generate JSON report
   * 
   * @param {Object} validationResult - Validation result
   * @param {boolean} [pretty=true] - Pretty print JSON
   * @returns {string} JSON formatted report
   */
  static generateJSONReport(validationResult, pretty = true) {
    return JSON.stringify(validationResult, null, pretty ? 2 : 0);
  }

  /**
   * Save report to file
   * 
   * @param {Object} validationResult - Validation result
   * @param {string} outputPath - Output file path
   * @param {string} [format='markdown'] - Report format (console, markdown, json)
   * @returns {Promise<string>} Saved file path
   */
  static async saveReport(validationResult, outputPath, format = 'markdown') {
    let content;
    
    switch (format.toLowerCase()) {
      case 'console':
        content = this.generateConsoleReport(validationResult);
        break;
      case 'markdown':
      case 'md':
        content = this.generateMarkdownReport(validationResult);
        break;
      case 'json':
        content = this.generateJSONReport(validationResult);
        break;
      default:
        throw new Error(`Unknown format: ${format}`);
    }
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(outputPath, content, 'utf-8');
    
    return outputPath;
  }

  /**
   * Generate batch markdown report
   * 
   * @param {Object} batchResults - Batch validation results
   * @returns {string} Markdown formatted report
   */
  static generateBatchMarkdownReport(batchResults) {
    const { total, passed, failed, results } = batchResults;
    
    let report = [];
    
    // Header
    report.push('# Batch Hook Validation Report');
    report.push('');
    
    // Summary
    report.push('## Summary');
    report.push('');
    report.push(`- **Total Hooks:** ${total}`);
    report.push(`- **Passed:** ${passed} ✅`);
    report.push(`- **Failed:** ${failed} ❌`);
    report.push(`- **Success Rate:** ${Math.round((passed / total) * 100)}%`);
    report.push('');
    
    // Results table
    report.push('## Results');
    report.push('');
    report.push('| Hook Name | Status | Score | Errors | Warnings |');
    report.push('|-----------|--------|-------|--------|----------|');
    
    for (const [hookName, result] of Object.entries(results)) {
      const status = result.valid ? '✅ PASSED' : '❌ FAILED';
      const score = `${result.summary.passed}/${result.summary.total}`;
      const errorCount = result.errors.length;
      const warningCount = result.warnings.length;
      
      report.push(`| ${hookName} | ${status} | ${score} | ${errorCount} | ${warningCount} |`);
    }
    report.push('');
    
    // Failed hooks details
    const failedHooks = Object.entries(results).filter(([, r]) => !r.valid);
    
    if (failedHooks.length > 0) {
      report.push('## Failed Hooks Details');
      report.push('');
      
      for (const [hookName, result] of failedHooks) {
        report.push(`### ${hookName}`);
        report.push('');
        
        if (result.errors.length > 0) {
          report.push('**Errors:**');
          result.errors.forEach(error => report.push(`- ${error}`));
          report.push('');
        }
        
        if (result.warnings.length > 0) {
          report.push('**Warnings:**');
          result.warnings.forEach(warning => report.push(`- ${warning}`));
          report.push('');
        }
      }
    }
    
    report.push('---');
    report.push('');
    report.push(`*Generated by Hook Validator v1.0.0 at ${new Date().toISOString()}*`);
    
    return report.join('\n');
  }
}

export default ValidationReporter;

