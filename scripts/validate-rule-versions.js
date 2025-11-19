#!/usr/bin/env node

/**
 * Rule Version Validation Script
 * 
 * Validates that all primacy rules have proper version frontmatter
 * and checks for version consistency across projects.
 * 
 * Usage: npm run validate-rules
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rule files to validate
const RULES_DIR = path.resolve(__dirname, '../.claude/rules/');
const REQUIRED_FIELDS = ['rule_version', 'last_updated', 'authoritative_source'];

/**
 * Parse frontmatter from a markdown file
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return null;
  }
  
  const frontmatter = {};
  const lines = match[1].split('\n');
  
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      frontmatter[key.trim()] = valueParts.join(':').trim();
    }
  }
  
  return frontmatter;
}

/**
 * Validate semantic versioning format
 */
function isValidSemver(version) {
  const semverRegex = /^\d+\.\d+\.\d+$/;
  return semverRegex.test(version);
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function isValidDate(dateString) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(dateString);
}

/**
 * Validate a single rule file
 */
function validateRule(filePath) {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const frontmatter = parseFrontmatter(content);
  
  const errors = [];
  const warnings = [];
  
  // Check if frontmatter exists
  if (!frontmatter) {
    errors.push('No frontmatter found');
    return { fileName, errors, warnings, frontmatter: null };
  }
  
  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!frontmatter[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate version format
  if (frontmatter.rule_version && !isValidSemver(frontmatter.rule_version)) {
    errors.push(`Invalid version format: ${frontmatter.rule_version} (expected: X.Y.Z)`);
  }
  
  // Validate date format
  if (frontmatter.last_updated && !isValidDate(frontmatter.last_updated)) {
    warnings.push(`Invalid date format: ${frontmatter.last_updated} (expected: YYYY-MM-DD)`);
  }
  
  // Check authoritative source
  if (frontmatter.authoritative_source && frontmatter.authoritative_source !== 'Orchestrator_Project') {
    warnings.push(`Non-standard authoritative source: ${frontmatter.authoritative_source}`);
  }
  
  return { fileName, errors, warnings, frontmatter };
}

/**
 * Main validation function
 */
async function validateRules() {
  console.log(chalk.blue.bold('\n📋 Rule Version Validation\n'));
  
  try {
    // Get all markdown files
    if (!fs.existsSync(RULES_DIR)) {
      console.error(chalk.red(`❌ Rules directory not found: ${RULES_DIR}`));
      process.exit(1);
    }
    
    const ruleFiles = fs.readdirSync(RULES_DIR)
      .filter(file => file.endsWith('.md'))
      .map(file => path.join(RULES_DIR, file));
    
    if (ruleFiles.length === 0) {
      console.warn(chalk.yellow('⚠️  No markdown rule files found'));
      process.exit(0);
    }
    
    console.log(chalk.blue(`Found ${ruleFiles.length} rule files to validate\n`));
    
    // Validate each rule
    const results = ruleFiles.map(validateRule);
    
    // Display results
    let hasErrors = false;
    let hasWarnings = false;
    
    for (const result of results) {
      if (result.errors.length > 0) {
        hasErrors = true;
        console.log(chalk.red(`❌ ${result.fileName}`));
        result.errors.forEach(err => console.log(chalk.red(`   • ${err}`)));
      } else if (result.warnings.length > 0) {
        hasWarnings = true;
        console.log(chalk.yellow(`⚠️  ${result.fileName}`));
        result.warnings.forEach(warn => console.log(chalk.yellow(`   • ${warn}`)));
      } else {
        const version = result.frontmatter?.rule_version || 'unknown';
        const date = result.frontmatter?.last_updated || 'unknown';
        console.log(chalk.green(`✅ ${result.fileName} (v${version}, updated ${date})`));
      }
    }
    
    // Summary
    console.log('');
    console.log(chalk.blue.bold('📊 Validation Summary:'));
    
    const validCount = results.filter(r => r.errors.length === 0).length;
    const errorCount = results.filter(r => r.errors.length > 0).length;
    const warningCount = results.filter(r => r.warnings.length > 0).length;
    
    console.log(chalk.green(`   ✅ Valid: ${validCount}/${results.length}`));
    if (errorCount > 0) {
      console.log(chalk.red(`   ❌ Errors: ${errorCount}`));
    }
    if (warningCount > 0) {
      console.log(chalk.yellow(`   ⚠️  Warnings: ${warningCount}`));
    }
    
    console.log('');
    
    if (hasErrors) {
      console.log(chalk.red.bold('❌ Validation failed. Please fix errors above.\n'));
      process.exit(1);
    } else if (hasWarnings) {
      console.log(chalk.yellow.bold('⚠️  Validation passed with warnings.\n'));
      process.exit(0);
    } else {
      console.log(chalk.green.bold('✨ All rules validated successfully!\n'));
      process.exit(0);
    }
    
  } catch (err) {
    console.error(chalk.red(`❌ Validation error: ${err.message}`));
    console.error(chalk.dim(err.stack));
    process.exit(1);
  }
}

// Execute validation
validateRules();

export { validateRules, parseFrontmatter };

