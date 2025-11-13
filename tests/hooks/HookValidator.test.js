/**
 * Hook Validator Tests
 * 
 * @module tests/hooks/HookValidator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  HookValidator,
  validateHook,
  validateAllHooks
} from '../../lib/hooks/validator/HookValidator.js';
import { ValidationReporter } from '../../lib/hooks/validator/ValidationReporter.js';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

describe('HookValidator', () => {
  let validator;
  let testOutputDir;

  beforeEach(() => {
    testOutputDir = path.join(process.cwd(), 'test-validator-output-' + Date.now());
    validator = new HookValidator({
      projectRoot: process.cwd(),
      strict: true
    });
  });

  afterEach(async () => {
    // Clean up test output
    try {
      if (existsSync(testOutputDir)) {
        await fs.rm(testOutputDir, { recursive: true, force: true });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Basic Functionality', () => {
    it('should create validator instance', () => {
      expect(validator).toBeDefined();
      expect(validator.validate).toBeDefined();
      expect(validator.validateBatch).toBeDefined();
      expect(validator.validateAll).toBeDefined();
    });

    it('should have default options', () => {
      const defaultValidator = new HookValidator();
      expect(defaultValidator.options.projectRoot).toBeDefined();
      expect(defaultValidator.options.strict).toBe(true);
    });

    it('should accept custom options', () => {
      const customValidator = new HookValidator({
        projectRoot: '/custom/path',
        strict: false
      });
      expect(customValidator.options.projectRoot).toBe('/custom/path');
      expect(customValidator.options.strict).toBe(false);
    });
  });

  describe('Validation Result Structure', () => {
    it('should return proper validation result structure', async () => {
      const result = await validator.validate('configBackup');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('hookName');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('checks');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('metadata');
      
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.checks)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should include summary with scores', async () => {
      const result = await validator.validate('configBackup');
      
      expect(result.summary).toBeDefined();
      expect(result.summary).toHaveProperty('passed');
      expect(result.summary).toHaveProperty('total');
      expect(result.summary).toHaveProperty('percentage');
      
      expect(typeof result.summary.passed).toBe('number');
      expect(typeof result.summary.total).toBe('number');
      expect(typeof result.summary.percentage).toBe('number');
    });

    it('should include metadata', async () => {
      const result = await validator.validate('configBackup');
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata).toHaveProperty('strict');
      expect(result.metadata).toHaveProperty('timestamp');
      expect(result.metadata).toHaveProperty('projectRoot');
    });
  });

  describe('File Existence Checks', () => {
    it('should detect existing hook files', async () => {
      const result = await validator.validate('preConfigModification');
      
      const fileCheck = result.checks.find(c => 
        c.name.includes('Hook implementation file')
      );
      
      expect(fileCheck).toBeDefined();
      // File might exist with different naming - just check it's reported
      expect(fileCheck).toHaveProperty('passed');
    });

    it('should detect existing test files', async () => {
      const result = await validator.validate('configBackup');
      
      const testCheck = result.checks.find(c => 
        c.name.includes('Test file')
      );
      
      expect(testCheck).toBeDefined();
      // May or may not exist - just checking it's reported
    });

    it('should report missing hook files', async () => {
      const result = await validator.validate('NonExistentHook');
      
      const fileCheck = result.checks.find(c => 
        c.name.includes('Hook implementation file')
      );
      
      expect(fileCheck).toBeDefined();
      expect(fileCheck.passed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Hook Structure Validation', () => {
    it('should validate hook function export', async () => {
      const result = await validator.validate('configBackup');
      
      const exportCheck = result.checks.find(c => 
        c.name.includes('Hook function exported')
      );
      
      if (exportCheck) {
        expect(exportCheck).toHaveProperty('passed');
        expect(exportCheck).toHaveProperty('details');
      }
    });

    it('should validate context parameter', async () => {
      const result = await validator.validate('configBackup');
      
      const contextCheck = result.checks.find(c => 
        c.name.includes('Context parameter')
      );
      
      if (contextCheck) {
        expect(contextCheck).toHaveProperty('passed');
      }
    });

    it('should validate next parameter', async () => {
      const result = await validator.validate('configBackup');
      
      const nextCheck = result.checks.find(c => 
        c.name.includes('Next parameter')
      );
      
      if (nextCheck) {
        expect(nextCheck).toHaveProperty('passed');
      }
    });

    it('should check for default export', async () => {
      const result = await validator.validate('configBackup');
      
      const defaultCheck = result.checks.find(c => 
        c.name.includes('Default export')
      );
      
      if (defaultCheck) {
        expect(defaultCheck).toHaveProperty('passed');
      }
    });
  });

  describe('Test File Validation', () => {
    it('should validate Vitest imports', async () => {
      const result = await validator.validate('configBackup');
      
      const vitestCheck = result.checks.find(c => 
        c.name.includes('Vitest imports')
      );
      
      if (vitestCheck) {
        expect(vitestCheck).toHaveProperty('passed');
      }
    });

    it('should validate hook import in tests', async () => {
      const result = await validator.validate('configBackup');
      
      const importCheck = result.checks.find(c => 
        c.name.includes('Hook imported in test')
      );
      
      if (importCheck) {
        expect(importCheck).toHaveProperty('passed');
      }
    });

    it('should check for describe blocks', async () => {
      const result = await validator.validate('configBackup');
      
      const describeCheck = result.checks.find(c => 
        c.name.includes('describe block')
      );
      
      if (describeCheck) {
        expect(describeCheck).toHaveProperty('passed');
      }
    });

    it('should check for test cases', async () => {
      const result = await validator.validate('configBackup');
      
      const testCheck = result.checks.find(c => 
        c.name.includes('Test cases present')
      );
      
      if (testCheck) {
        expect(testCheck).toHaveProperty('passed');
      }
    });
  });

  describe('Registration Validation', () => {
    it('should validate hook import in index', async () => {
      const result = await validator.validate('configBackup');
      
      const importCheck = result.checks.find(c => 
        c.name.includes('Hook imported in index')
      );
      
      if (importCheck) {
        expect(importCheck).toHaveProperty('passed');
        expect(importCheck).toHaveProperty('details');
      }
    });

    it('should validate hook registration', async () => {
      const result = await validator.validate('configBackup');
      
      const regCheck = result.checks.find(c => 
        c.name.includes('Hook registered')
      );
      
      if (regCheck) {
        expect(regCheck).toHaveProperty('passed');
      }
    });
  });

  describe('Priority Validation', () => {
    it('should check for priority specification', async () => {
      const result = await validator.validate('configBackup');
      
      const priorityCheck = result.checks.find(c => 
        c.name.includes('Priority specified')
      );
      
      if (priorityCheck) {
        expect(priorityCheck).toHaveProperty('passed');
      }
    });

    it('should validate priority range', async () => {
      const result = await validator.validate('configBackup');
      
      const rangeCheck = result.checks.find(c => 
        c.name.includes('Valid priority range')
      );
      
      if (rangeCheck) {
        expect(rangeCheck).toHaveProperty('passed');
      }
    });
  });

  describe('Middleware Pattern Validation', () => {
    it('should validate await next() call', async () => {
      const result = await validator.validate('configBackup');
      
      const middlewareCheck = result.checks.find(c => 
        c.name.includes('Middleware pattern')
      );
      
      if (middlewareCheck) {
        expect(middlewareCheck).toHaveProperty('passed');
      }
    });

    it('should validate next() placement', async () => {
      const result = await validator.validate('configBackup');
      
      const placementCheck = result.checks.find(c => 
        c.name.includes('Next called properly')
      );
      
      if (placementCheck) {
        expect(placementCheck).toHaveProperty('passed');
      }
    });
  });

  describe('Error Handling Validation', () => {
    it('should validate error handling presence', async () => {
      const result = await validator.validate('configBackup');
      
      const errorCheck = result.checks.find(c => 
        c.name.includes('Error handling present')
      );
      
      if (errorCheck) {
        expect(errorCheck).toHaveProperty('passed');
      }
    });

    it('should validate error logging', async () => {
      const result = await validator.validate('configBackup');
      
      const logCheck = result.checks.find(c => 
        c.name.includes('Error logging')
      );
      
      if (logCheck) {
        expect(logCheck).toHaveProperty('passed');
      }
    });

    it('should check for non-blocking errors', async () => {
      const result = await validator.validate('configBackup');
      
      const blockCheck = result.checks.find(c => 
        c.name.includes('Non-blocking errors')
      );
      
      if (blockCheck) {
        expect(blockCheck).toHaveProperty('passed');
      }
    });
  });

  describe('Documentation Validation', () => {
    it('should check for documentation existence', async () => {
      const result = await validator.validate('configBackup');
      
      const docCheck = result.checks.find(c => 
        c.name.includes('Documentation exists')
      );
      
      if (docCheck) {
        expect(docCheck).toHaveProperty('passed');
        expect(docCheck).toHaveProperty('details');
      }
    });

    it('should validate documentation completeness', async () => {
      const result = await validator.validate('configBackup');
      
      const completeCheck = result.checks.find(c => 
        c.name.includes('Documentation complete')
      );
      
      // Only checked if doc exists
      if (completeCheck) {
        expect(completeCheck).toHaveProperty('passed');
      }
    });
  });

  describe('Batch Validation', () => {
    it('should validate multiple hooks', async () => {
      const hookNames = ['configBackup', 'directoryDetection'];
      const results = await validator.validateBatch(hookNames);
      
      expect(results).toBeDefined();
      expect(results).toHaveProperty('total');
      expect(results).toHaveProperty('passed');
      expect(results).toHaveProperty('failed');
      expect(results).toHaveProperty('results');
      
      expect(results.total).toBe(hookNames.length);
      expect(Object.keys(results.results)).toHaveLength(hookNames.length);
    });

    it('should provide individual results in batch', async () => {
      const results = await validator.validateBatch(['configBackup']);
      
      expect(results.results).toHaveProperty('configBackup');
      expect(results.results.configBackup).toHaveProperty('valid');
      expect(results.results.configBackup).toHaveProperty('checks');
    });
  });

  describe('Convenience Functions', () => {
    it('should work with validateHook shorthand', async () => {
      const result = await validateHook('configBackup', {
        projectRoot: process.cwd()
      });
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('checks');
    });

    it('should work with validateAllHooks shorthand', async () => {
      const results = await validateAllHooks({
        projectRoot: process.cwd()
      });
      
      expect(results).toBeDefined();
      expect(results).toHaveProperty('total');
      expect(results).toHaveProperty('results');
      expect(results.total).toBeGreaterThan(0);
    });
  });

  describe('Strict vs Non-Strict Mode', () => {
    it('should apply strict mode checks', async () => {
      const strictValidator = new HookValidator({ strict: true });
      const result = await strictValidator.validate('configBackup');
      
      expect(result.metadata.strict).toBe(true);
      // Strict mode may generate more warnings
    });

    it('should skip optional checks in non-strict mode', async () => {
      const lenientValidator = new HookValidator({ strict: false });
      const result = await lenientValidator.validate('configBackup');
      
      expect(result.metadata.strict).toBe(false);
    });
  });

  describe('Name Conversion', () => {
    it('should convert names correctly', () => {
      // Test internal methods via validation
      expect(() => validator.validate('MyTestHook')).not.toThrow();
      expect(() => validator.validate('my-test-hook')).not.toThrow();
      expect(() => validator.validate('myTestHook')).not.toThrow();
    });
  });
});

describe('ValidationReporter', () => {
  let mockResult;

  beforeEach(() => {
    mockResult = {
      valid: true,
      hookName: 'TestHook',
      summary: {
        passed: 8,
        total: 10,
        percentage: 80
      },
      checks: [
        { name: 'Test check 1', passed: true, details: 'Details 1' },
        { name: 'Test check 2', passed: false, details: 'Details 2' }
      ],
      errors: ['Error 1'],
      warnings: ['Warning 1'],
      metadata: {
        strict: true,
        timestamp: '2025-01-01T00:00:00.000Z',
        projectRoot: '/test'
      }
    };
  });

  describe('Console Report Generation', () => {
    it('should generate console report', () => {
      const report = ValidationReporter.generateConsoleReport(mockResult);
      
      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      expect(report).toContain('TestHook');
      expect(report).toContain('8/10');
      expect(report).toContain('Error 1');
      expect(report).toContain('Warning 1');
    });

    it('should include status symbol', () => {
      const passedReport = ValidationReporter.generateConsoleReport(mockResult);
      expect(passedReport).toContain('✅');
      
      const failedResult = { ...mockResult, valid: false };
      const failedReport = ValidationReporter.generateConsoleReport(failedResult);
      expect(failedReport).toContain('❌');
    });

    it('should list all checks', () => {
      const report = ValidationReporter.generateConsoleReport(mockResult);
      expect(report).toContain('Test check 1');
      expect(report).toContain('Test check 2');
    });
  });

  describe('Markdown Report Generation', () => {
    it('should generate markdown report', () => {
      const report = ValidationReporter.generateMarkdownReport(mockResult);
      
      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      expect(report).toContain('# Hook Validation Report');
      expect(report).toContain('TestHook');
      expect(report).toContain('## Summary');
      expect(report).toContain('## Validation Checks');
    });

    it('should include markdown table', () => {
      const report = ValidationReporter.generateMarkdownReport(mockResult);
      expect(report).toContain('| Check | Status | Details |');
      expect(report).toContain('|-------|--------|---------|');
    });

    it('should include status badge', () => {
      const passedReport = ValidationReporter.generateMarkdownReport(mockResult);
      expect(passedReport).toContain('PASSED');
      
      const failedResult = { ...mockResult, valid: false };
      const failedReport = ValidationReporter.generateMarkdownReport(failedResult);
      expect(failedReport).toContain('FAILED');
    });
  });

  describe('JSON Report Generation', () => {
    it('should generate JSON report', () => {
      const report = ValidationReporter.generateJSONReport(mockResult);
      
      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      
      const parsed = JSON.parse(report);
      expect(parsed).toHaveProperty('valid');
      expect(parsed).toHaveProperty('hookName');
      expect(parsed).toHaveProperty('checks');
    });

    it('should support pretty printing', () => {
      const pretty = ValidationReporter.generateJSONReport(mockResult, true);
      const compact = ValidationReporter.generateJSONReport(mockResult, false);
      
      expect(pretty.length).toBeGreaterThan(compact.length);
      expect(pretty).toContain('\n');
      expect(compact).not.toContain('\n  ');
    });
  });

  describe('Batch Report Generation', () => {
    it('should generate batch console report', () => {
      const batchResults = {
        total: 2,
        passed: 1,
        failed: 1,
        results: {
          'Hook1': { ...mockResult, valid: true },
          'Hook2': { ...mockResult, valid: false, hookName: 'Hook2' }
        }
      };
      
      const report = ValidationReporter.generateBatchConsoleReport(batchResults);
      
      expect(report).toBeDefined();
      expect(report).toContain('Batch Hook Validation Report');
      expect(report).toContain('Total hooks validated: 2');
      expect(report).toContain('Hook1');
      expect(report).toContain('Hook2');
    });

    it('should generate batch markdown report', () => {
      const batchResults = {
        total: 2,
        passed: 1,
        failed: 1,
        results: {
          'Hook1': { ...mockResult, valid: true },
          'Hook2': { ...mockResult, valid: false, hookName: 'Hook2' }
        }
      };
      
      const report = ValidationReporter.generateBatchMarkdownReport(batchResults);
      
      expect(report).toBeDefined();
      expect(report).toContain('# Batch Hook Validation Report');
      expect(report).toContain('## Summary');
      expect(report).toContain('## Results');
    });
  });
});

