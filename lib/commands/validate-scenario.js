#!/usr/bin/env node

/**
 * CLI Command: Validate Scenario
 * 
 * Provides user-friendly command-line interface for validating scenario YAML files.
 * Displays clear, actionable error messages with suggestions for fixes.
 */

import scenarioValidator from '../validators/scenario-validator.js';
import fs from 'fs';
import path from 'path';

/**
 * Format error output for CLI display
 * @param {Object} error - Formatted error object
 * @param {number} index - Error number
 * @returns {string} Formatted error message
 */
function formatErrorForCLI(error, index) {
  const lines = [];
  
  lines.push(`\n${index}. ${error.field}`);
  lines.push(`   ❌ ${error.message}`);
  
  if (error.suggestion) {
    lines.push(`   💡 ${error.suggestion}`);
  }
  
  if (error.value !== undefined) {
    const valueStr = JSON.stringify(error.value, null, 2);
    if (valueStr.length < 100) {
      lines.push(`   Current value: ${valueStr}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Display validation results in CLI
 * @param {Object} result - Validation result
 * @param {Object} options - Display options
 */
export function displayValidationResult(result, options = {}) {
  const { verbose = false, json = false } = options;
  
  // JSON output mode
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('  Scenario Validation Report');
  console.log('='.repeat(70));
  
  console.log(`\nFile: ${result.sourcePath}`);
  console.log(`Scenario: ${result.scenarioName}`);
  console.log(`Version: ${result.version}`);
  console.log(`Timestamp: ${new Date(result.timestamp).toLocaleString()}`);
  
  if (result.valid) {
    console.log('\n✅ Validation PASSED - Scenario is valid!\n');
    
    if (verbose) {
      console.log('Summary:');
      console.log(`  - All required fields present`);
      console.log(`  - All field types correct`);
      console.log(`  - All nested structures valid`);
    }
  } else {
    console.log(`\n❌ Validation FAILED - ${result.errorCount} error(s) found\n`);
    
    // Show critical errors first
    if (result.criticalErrors && result.criticalErrors.length > 0) {
      console.log('🚨 Critical Errors (must fix):');
      result.criticalErrors.forEach((error, idx) => {
        console.log(formatErrorForCLI(error, idx + 1));
      });
    }
    
    // Show other errors
    const otherErrors = result.errors.filter(e => 
      e.keyword !== 'required' && e.keyword !== 'type'
    );
    
    if (otherErrors.length > 0) {
      console.log('\n⚠️  Other Issues:');
      otherErrors.forEach((error, idx) => {
        console.log(formatErrorForCLI(error, idx + 1));
      });
    }
    
    // Show errors by field if verbose
    if (verbose && result.errorsByField) {
      console.log('\n📋 Errors by Field:');
      for (const [field, errors] of Object.entries(result.errorsByField)) {
        console.log(`\n  ${field}:`);
        errors.forEach(err => {
          console.log(`    - ${err.message}`);
        });
      }
    }
    
    // Show help
    console.log('\n💡 Quick Fixes:');
    console.log('  1. Check for required fields marked with ❌');
    console.log('  2. Verify data types (string, array, object)');
    console.log('  3. Ensure enum values match allowed options');
    console.log('  4. Review suggestions (💡) for each error');
    console.log('\n  Use --verbose for detailed error breakdown');
    console.log('  Use --json for machine-readable output');
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
}

/**
 * Display batch validation results
 * @param {Object} results - Batch validation results
 * @param {Object} options - Display options
 */
export function displayBatchResults(results, options = {}) {
  const { json = false } = options;
  
  if (json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('  Batch Scenario Validation Report');
  console.log('='.repeat(70));
  
  console.log(`\nTotal scenarios: ${results.total}`);
  console.log(`✅ Valid: ${results.valid}`);
  console.log(`❌ Invalid: ${results.invalid}`);
  
  if (results.invalid > 0) {
    console.log('\n❌ Failed Scenarios:');
    results.scenarios
      .filter(s => !s.valid)
      .forEach(scenario => {
        console.log(`\n  ${scenario.name} (${scenario.path})`);
        console.log(`    Errors: ${scenario.errorCount}`);
        
        if (scenario.errors && scenario.errors.length > 0) {
          scenario.errors.slice(0, 3).forEach(err => {
            console.log(`      - ${err.message}`);
          });
          
          if (scenario.errors.length > 3) {
            console.log(`      ... and ${scenario.errors.length - 3} more`);
          }
        }
      });
  }
  
  if (results.valid > 0) {
    console.log('\n✅ Valid Scenarios:');
    results.scenarios
      .filter(s => s.valid)
      .forEach(scenario => {
        console.log(`  ✓ ${scenario.name}`);
      });
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
}

/**
 * Display directory status
 * @param {Object} status - Directory status object
 */
export function displayDirectoryStatus(status) {
  console.log('\n📁 Scenarios Directory Status\n');
  console.log(`Path: ${status.path}`);
  console.log(`Exists: ${status.exists ? '✅' : '❌'}`);
  
  if (status.exists) {
    console.log(`Accessible: ${status.accessible ? '✅' : '❌'}`);
    console.log(`Writable: ${status.writable ? '✅' : '❌'}`);
    console.log(`\nYAML files found: ${status.files.length}`);
    
    if (status.files.length > 0) {
      console.log('\nAvailable scenarios:');
      status.files.forEach(file => {
        console.log(`  - ${file}`);
      });
    }
  } else {
    console.log('\n⚠️  Directory not found!');
    console.log('\nCreate it with:');
    console.log(`  mkdir -p ${status.path}`);
  }
  
  if (status.error) {
    console.log(`\n❌ Error: ${status.error}`);
  }
  
  console.log('');
}

/**
 * Main command handler
 * @param {Object} args - Command arguments
 */
export async function validateScenarioCommand(args) {
  const {
    file,
    dir,
    batch,
    verbose,
    json,
    strict = true,
    schema
  } = args;
  
  try {
    // Check directory status
    if (dir === 'status') {
      const status = scenarioValidator.checkScenariosDirectory();
      displayDirectoryStatus(status);
      return;
    }
    
    // Batch validation
    if (batch) {
      const scenariosDir = dir || '~/.claude/scenarios';
      const expandedPath = scenariosDir.replace('~', process.env.HOME);
      
      if (!fs.existsSync(expandedPath)) {
        console.error(`❌ Directory not found: ${expandedPath}`);
        process.exit(1);
      }
      
      const files = fs.readdirSync(expandedPath);
      const yamlFiles = files
        .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
        .map(f => path.join(expandedPath, f));
      
      if (yamlFiles.length === 0) {
        console.log(`\n⚠️  No YAML files found in ${expandedPath}\n`);
        return;
      }
      
      const results = scenarioValidator.validateBatch(yamlFiles, { strict, schemaPath: schema });
      displayBatchResults(results, { json });
      
      process.exit(results.invalid > 0 ? 1 : 0);
    }
    
    // Single file validation
    if (file) {
      if (!fs.existsSync(file)) {
        console.error(`❌ File not found: ${file}`);
        process.exit(1);
      }
      
      const result = scenarioValidator.validateScenario(file, { strict, schemaPath: schema });
      displayValidationResult(result, { verbose, json });
      
      process.exit(result.valid ? 0 : 1);
    }
    
    // No file specified - show help
    console.log('\nScenario Validator\n');
    console.log('Usage:');
    console.log('  node validate-scenario.js --file <path>          Validate single file');
    console.log('  node validate-scenario.js --batch [--dir <path>] Validate all scenarios');
    console.log('  node validate-scenario.js --dir status           Check directory status');
    console.log('\nOptions:');
    console.log('  --file <path>      Path to scenario YAML file');
    console.log('  --dir <path>       Scenarios directory (default: ~/.claude/scenarios)');
    console.log('  --batch            Validate all YAML files in directory');
    console.log('  --verbose          Show detailed error information');
    console.log('  --json             Output results as JSON');
    console.log('  --strict           Enable strict validation (default: true)');
    console.log('  --schema <path>    Use custom schema file');
    console.log('\nExamples:');
    console.log('  node validate-scenario.js --file scenario.yaml --verbose');
    console.log('  node validate-scenario.js --batch --dir ~/.claude/scenarios');
    console.log('  node validate-scenario.js --dir status');
    console.log('');
    
  } catch (error) {
    console.error(`\n❌ Validation Error: ${error.message}\n`);
    if (verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Parse command line arguments if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = {};
  
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = process.argv[i + 1];
      
      if (nextArg && !nextArg.startsWith('--')) {
        args[key] = nextArg;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  
  validateScenarioCommand(args);
}

export default validateScenarioCommand;

