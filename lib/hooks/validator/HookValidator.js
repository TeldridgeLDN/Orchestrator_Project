/**
 * Hook Validation and Verification System
 * 
 * Validates hook implementations for:
 * - Correct registration in HookManager
 * - Proper execution order (priority)
 * - Valid trigger conditions
 * - Integration with existing hooks
 * - Code integrity and functionality
 * 
 * @module hooks/validator/HookValidator
 * @version 1.0.0
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { HookTypes } from '../detector/HookRequirementDetector.js';

/**
 * Validation result
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Overall validation status
 * @property {Object[]} checks - Individual check results
 * @property {string[]} errors - Critical errors
 * @property {string[]} warnings - Non-critical warnings
 * @property {Object} metadata - Validation metadata
 */

/**
 * Hook Validator Class
 */
export class HookValidator {
  constructor(options = {}) {
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      strict: options.strict !== false, // Default to strict mode
      ...options
    };
    
    this.checks = [];
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate a hook implementation
   * 
   * @param {string} hookName - Name of the hook to validate
   * @param {Object} [options] - Validation options
   * @returns {Promise<ValidationResult>} Validation result
   */
  async validate(hookName, options = {}) {
    this.checks = [];
    this.errors = [];
    this.warnings = [];

    const hookPath = this._getHookPath(hookName);
    const testPath = this._getTestPath(hookName);
    const indexPath = path.join(this.options.projectRoot, 'lib/hooks/index.js');

    try {
      // Check 1: Hook file exists
      await this._checkFileExists(hookPath, 'Hook implementation file');

      // Check 2: Test file exists
      await this._checkFileExists(testPath, 'Test file');

      // Check 3: Hook file structure
      await this._validateHookStructure(hookPath, hookName);

      // Check 4: Test file structure
      await this._validateTestStructure(testPath, hookName);

      // Check 5: Hook registration
      await this._validateRegistration(indexPath, hookName);

      // Check 6: Execution order (priority)
      await this._validateExecutionOrder(indexPath, hookName);

      // Check 7: Middleware pattern
      await this._validateMiddlewarePattern(hookPath);

      // Check 8: Error handling
      await this._validateErrorHandling(hookPath);

      // Check 9: Documentation
      await this._validateDocumentation(hookName);

    } catch (error) {
      this.errors.push(`Fatal validation error: ${error.message}`);
    }

    return this._generateResult(hookName);
  }

  /**
   * Validate multiple hooks in batch
   * 
   * @param {string[]} hookNames - Hook names to validate
   * @returns {Promise<Object>} Batch validation results
   */
  async validateBatch(hookNames) {
    const results = {};
    
    for (const hookName of hookNames) {
      results[hookName] = await this.validate(hookName);
    }

    return {
      total: hookNames.length,
      passed: Object.values(results).filter(r => r.valid).length,
      failed: Object.values(results).filter(r => !r.valid).length,
      results
    };
  }

  /**
   * Validate all hooks in the project
   * 
   * @returns {Promise<Object>} Validation results for all hooks
   */
  async validateAll() {
    const hooksDir = path.join(this.options.projectRoot, 'lib/hooks');
    
    if (!existsSync(hooksDir)) {
      throw new Error(`Hooks directory not found: ${hooksDir}`);
    }

    const files = await fs.readdir(hooksDir);
    const hookFiles = files.filter(f => 
      f.endsWith('.js') && 
      f !== 'index.js' &&
      !f.includes('.test.')
    );

    const hookNames = hookFiles.map(f => 
      this._fileNameToHookName(f.replace('.js', ''))
    );

    return this.validateBatch(hookNames);
  }

  /**
   * Check if file exists
   * @private
   */
  async _checkFileExists(filePath, description) {
    const exists = existsSync(filePath);
    
    this.checks.push({
      name: `File exists: ${description}`,
      passed: exists,
      details: filePath
    });

    if (!exists) {
      this.errors.push(`${description} not found: ${filePath}`);
    }

    return exists;
  }

  /**
   * Validate hook file structure
   * @private
   */
  async _validateHookStructure(hookPath, hookName) {
    if (!existsSync(hookPath)) {
      return;
    }

    const content = await fs.readFile(hookPath, 'utf-8');
    const functionName = this._toFunctionName(hookName);

    // Check for function export
    const hasExport = content.includes(`export async function ${functionName}`) ||
                      content.includes(`export function ${functionName}`);
    
    this.checks.push({
      name: 'Hook function exported',
      passed: hasExport,
      details: `Looking for: export function ${functionName}`
    });

    if (!hasExport) {
      this.errors.push(`Hook function '${functionName}' not properly exported`);
    }

    // Check for context parameter
    const hasContext = content.includes('(context,') || content.includes('(context )');
    
    this.checks.push({
      name: 'Context parameter present',
      passed: hasContext,
      details: 'Hook should accept (context, next) parameters'
    });

    if (!hasContext && this.options.strict) {
      this.warnings.push('Hook should accept context parameter');
    }

    // Check for next parameter
    const hasNext = content.includes(', next)');
    
    this.checks.push({
      name: 'Next parameter present',
      passed: hasNext,
      details: 'Hook should accept next parameter for middleware chain'
    });

    if (!hasNext) {
      this.errors.push('Hook must accept next parameter for middleware chain');
    }

    // Check for default export
    const hasDefaultExport = content.includes(`export default ${functionName}`);
    
    this.checks.push({
      name: 'Default export present',
      passed: hasDefaultExport,
      details: `export default ${functionName}`
    });

    if (!hasDefaultExport && this.options.strict) {
      this.warnings.push('Hook should have default export');
    }
  }

  /**
   * Validate test file structure
   * @private
   */
  async _validateTestStructure(testPath, hookName) {
    if (!existsSync(testPath)) {
      return;
    }

    const content = await fs.readFile(testPath, 'utf-8');
    const functionName = this._toFunctionName(hookName);

    // Check for Vitest imports
    const hasVitestImports = content.includes("from 'vitest'");
    
    this.checks.push({
      name: 'Vitest imports present',
      passed: hasVitestImports,
      details: "Should import from 'vitest'"
    });

    if (!hasVitestImports) {
      this.errors.push('Test file missing Vitest imports');
    }

    // Check for hook import
    const hasHookImport = content.includes(functionName);
    
    this.checks.push({
      name: 'Hook imported in test',
      passed: hasHookImport,
      details: `Should import ${functionName}`
    });

    if (!hasHookImport) {
      this.errors.push(`Test file does not import ${functionName}`);
    }

    // Check for describe block
    const hasDescribe = content.includes('describe(');
    
    this.checks.push({
      name: 'Test describe block present',
      passed: hasDescribe,
      details: 'Test should use describe() blocks'
    });

    if (!hasDescribe) {
      this.warnings.push('Test file should use describe() blocks');
    }

    // Check for test cases
    const hasTests = content.includes('it(') || content.includes('test(');
    
    this.checks.push({
      name: 'Test cases present',
      passed: hasTests,
      details: 'Test file should contain it() or test() cases'
    });

    if (!hasTests) {
      this.errors.push('Test file contains no test cases');
    }
  }

  /**
   * Validate hook registration
   * @private
   */
  async _validateRegistration(indexPath, hookName) {
    if (!existsSync(indexPath)) {
      this.errors.push('Hook index file not found');
      return;
    }

    const content = await fs.readFile(indexPath, 'utf-8');
    const fileName = this._toKebabCase(hookName);
    const functionName = this._toFunctionName(hookName);

    // Check for import
    const hasImport = content.includes(`from './${fileName}.js'`);
    
    this.checks.push({
      name: 'Hook imported in index',
      passed: hasImport,
      details: `import { ${functionName} } from './${fileName}.js'`
    });

    if (!hasImport) {
      this.warnings.push(`Hook not imported in index.js - may need manual registration`);
    }

    // Check for registration
    const hasRegistration = content.includes('hookManager.register') && 
                           content.includes(functionName);
    
    this.checks.push({
      name: 'Hook registered',
      passed: hasRegistration,
      details: 'hookManager.register() call with hook function'
    });

    if (!hasRegistration && hasImport) {
      this.errors.push('Hook imported but not registered in hookManager');
    }
  }

  /**
   * Validate execution order (priority)
   * @private
   */
  async _validateExecutionOrder(indexPath, hookName) {
    if (!existsSync(indexPath)) {
      return;
    }

    const content = await fs.readFile(indexPath, 'utf-8');
    const functionName = this._toFunctionName(hookName);

    // Extract registration call
    const registrationPattern = new RegExp(
      `hookManager\\.register\\([^)]*${functionName}[^)]*\\)`,
      'g'
    );
    
    const matches = content.match(registrationPattern);

    if (matches && matches.length > 0) {
      const registration = matches[0];
      
      // Check for priority specification
      const hasPriority = registration.includes('priority');
      
      this.checks.push({
        name: 'Priority specified',
        passed: hasPriority,
        details: 'Registration should include priority value'
      });

      if (!hasPriority && this.options.strict) {
        this.warnings.push('Hook registration should specify explicit priority');
      }

      // Extract priority value
      const priorityMatch = registration.match(/priority:\s*(\d+)/);
      if (priorityMatch) {
        const priority = parseInt(priorityMatch[1], 10);
        const validPriority = priority >= 0 && priority <= 100;
        
        this.checks.push({
          name: 'Valid priority range',
          passed: validPriority,
          details: `Priority ${priority} should be between 0-100`
        });

        if (!validPriority) {
          this.warnings.push(`Priority ${priority} outside recommended range (0-100)`);
        }
      }
    }
  }

  /**
   * Validate middleware pattern
   * @private
   */
  async _validateMiddlewarePattern(hookPath) {
    if (!existsSync(hookPath)) {
      return;
    }

    const content = await fs.readFile(hookPath, 'utf-8');

    // Check for await next() call
    const hasAwaitNext = content.includes('await next()');
    
    this.checks.push({
      name: 'Middleware pattern (await next)',
      passed: hasAwaitNext,
      details: 'Hook should call await next() to continue chain'
    });

    if (!hasAwaitNext) {
      this.errors.push('Hook must call await next() to continue middleware chain');
    }

    // Check if next() is called in try-catch or at end
    const hasProperPlacement = 
      content.includes('} catch') && content.includes('await next()') ||
      content.match(/await next\(\);?\s*}/);
    
    this.checks.push({
      name: 'Next called properly',
      passed: hasProperPlacement,
      details: 'next() should be called after hook logic or in finally block'
    });

    if (!hasProperPlacement && this.options.strict) {
      this.warnings.push('Ensure next() is called appropriately in control flow');
    }
  }

  /**
   * Validate error handling
   * @private
   */
  async _validateErrorHandling(hookPath) {
    if (!existsSync(hookPath)) {
      return;
    }

    const content = await fs.readFile(hookPath, 'utf-8');

    // Check for try-catch
    const hasTryCatch = content.includes('try {') && content.includes('} catch');
    
    this.checks.push({
      name: 'Error handling present',
      passed: hasTryCatch,
      details: 'Hook should use try-catch for error handling'
    });

    if (!hasTryCatch) {
      this.errors.push('Hook must include try-catch error handling');
    }

    // Check for error logging
    const hasErrorLog = content.includes('console.error') || 
                       content.includes('logger.error');
    
    this.checks.push({
      name: 'Error logging present',
      passed: hasErrorLog,
      details: 'Hook should log errors'
    });

    if (!hasErrorLog && this.options.strict) {
      this.warnings.push('Hook should log errors for debugging');
    }

    // Check that errors don't block execution
    const doesntThrow = !content.match(/throw\s+(?!new)/);
    
    this.checks.push({
      name: 'Non-blocking errors',
      passed: doesntThrow,
      details: 'Hook should not throw errors (handle gracefully)'
    });

    if (!doesntThrow && this.options.strict) {
      this.warnings.push('Hook should handle errors gracefully without throwing');
    }
  }

  /**
   * Validate documentation
   * @private
   */
  async _validateDocumentation(hookName) {
    const fileName = this._toKebabCase(hookName);
    const docPath = path.join(
      this.options.projectRoot,
      'lib/hooks/docs',
      `${fileName}.md`
    );

    const exists = existsSync(docPath);
    
    this.checks.push({
      name: 'Documentation exists',
      passed: exists,
      details: docPath
    });

    if (!exists && this.options.strict) {
      this.warnings.push('Hook should have documentation in lib/hooks/docs/');
    }

    if (exists) {
      const content = await fs.readFile(docPath, 'utf-8');
      
      // Check for key sections
      const hasPurpose = content.includes('## Purpose') || content.includes('Purpose');
      const hasUsage = content.includes('## Usage') || content.includes('Usage');
      
      this.checks.push({
        name: 'Documentation complete',
        passed: hasPurpose && hasUsage,
        details: 'Should include Purpose and Usage sections'
      });

      if (!hasPurpose || !hasUsage) {
        this.warnings.push('Documentation should include Purpose and Usage sections');
      }
    }
  }

  /**
   * Generate validation result
   * @private
   */
  _generateResult(hookName) {
    const passed = this.checks.filter(c => c.passed).length;
    const total = this.checks.length;
    const valid = this.errors.length === 0;

    return {
      valid,
      hookName,
      summary: {
        passed,
        total,
        percentage: total > 0 ? Math.round((passed / total) * 100) : 0
      },
      checks: this.checks,
      errors: this.errors,
      warnings: this.warnings,
      metadata: {
        strict: this.options.strict,
        timestamp: new Date().toISOString(),
        projectRoot: this.options.projectRoot
      }
    };
  }

  /**
   * Get hook file path
   * @private
   */
  _getHookPath(hookName) {
    const fileName = this._toKebabCase(hookName);
    return path.join(this.options.projectRoot, 'lib/hooks', `${fileName}.js`);
  }

  /**
   * Get test file path
   * @private
   */
  _getTestPath(hookName) {
    const fileName = this._toKebabCase(hookName);
    return path.join(this.options.projectRoot, 'tests/hooks', `${fileName}.test.js`);
  }

  /**
   * Convert hook name to function name (camelCase)
   * @private
   */
  _toFunctionName(hookName) {
    return hookName.charAt(0).toLowerCase() + 
           hookName.slice(1).replace(/[-_\s](.)/g, (_, c) => c.toUpperCase());
  }

  /**
   * Convert hook name to kebab-case
   * @private
   */
  _toKebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  /**
   * Convert file name to hook name
   * @private
   */
  _fileNameToHookName(fileName) {
    return fileName
      .split('-')
      .map((word, index) => 
        index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join('');
  }
}

/**
 * Quick validation function
 * 
 * @param {string} hookName - Hook name to validate
 * @param {Object} [options] - Validation options
 * @returns {Promise<ValidationResult>} Validation result
 */
export async function validateHook(hookName, options) {
  const validator = new HookValidator(options);
  return validator.validate(hookName);
}

/**
 * Validate all hooks
 * 
 * @param {Object} [options] - Validation options
 * @returns {Promise<Object>} Batch validation results
 */
export async function validateAllHooks(options) {
  const validator = new HookValidator(options);
  return validator.validateAll();
}

export default HookValidator;

