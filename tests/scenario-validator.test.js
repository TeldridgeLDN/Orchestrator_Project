#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Scenario Validator
 * 
 * Tests all aspects of YAML schema validation including:
 * - Schema loading
 * - YAML parsing
 * - Validation logic
 * - Error formatting
 * - Batch validation
 * - Custom rules
 * - Edge cases
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import scenarioValidator from '../lib/validators/scenario-validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'scenarios');
const VALID_SCENARIO = path.join(FIXTURES_DIR, 'valid-scenario.yaml');
const INVALID_SCENARIO = path.join(FIXTURES_DIR, 'invalid-scenario.yaml');

describe('Scenario Validator Tests', () => {
  
  describe('Schema Loading', () => {
    it('should load default schema successfully', () => {
      const schema = scenarioValidator.loadSchema();
      assert.ok(schema, 'Schema should be loaded');
      assert.strictEqual(schema.$schema, 'http://json-schema.org/draft-07/schema#');
      assert.strictEqual(schema.title, 'Claude Scenario Definition Schema');
    });
    
    it('should throw error for non-existent schema', () => {
      assert.throws(
        () => scenarioValidator.loadSchema('/non/existent/schema.json'),
        /Schema file not found/
      );
    });
    
    it('should have all required properties in schema', () => {
      const schema = scenarioValidator.loadSchema();
      const requiredFields = [
        'name',
        'domain',
        'complexity',
        'version',
        'status',
        'executive_summary',
        'scenario_overview',
        'workflow_composition',
        'scenario_flow'
      ];
      
      assert.deepStrictEqual(
        schema.required,
        requiredFields,
        'Schema should require all expected fields'
      );
    });
  });
  
  describe('YAML Parsing', () => {
    it('should parse valid YAML file', () => {
      const data = scenarioValidator.parseYamlFile(VALID_SCENARIO);
      assert.ok(data, 'Data should be parsed');
      assert.strictEqual(data.name, 'E-Commerce Client Onboarding');
      assert.strictEqual(data.domain, 'E-commerce');
    });
    
    it('should throw error for non-existent file', () => {
      assert.throws(
        () => scenarioValidator.parseYamlFile('/non/existent/file.yaml'),
        /YAML file not found/
      );
    });
    
    it('should handle malformed YAML', () => {
      const malformedPath = path.join(FIXTURES_DIR, 'malformed.yaml');
      fs.writeFileSync(malformedPath, 'invalid: yaml: content: [unclosed');
      
      assert.throws(
        () => scenarioValidator.parseYamlFile(malformedPath),
        /YAML parsing error/
      );
      
      fs.unlinkSync(malformedPath);
    });
  });
  
  describe('Validation - Valid Scenario', () => {
    it('should validate correct scenario successfully', () => {
      const result = scenarioValidator.validateScenario(VALID_SCENARIO);
      
      assert.ok(result.valid, 'Valid scenario should pass');
      assert.strictEqual(result.errorCount, 0, 'Should have no errors');
      assert.ok(result.data, 'Should return parsed data');
      assert.strictEqual(result.scenarioName, 'E-Commerce Client Onboarding');
    });
    
    it('should handle in-memory validation', () => {
      const data = scenarioValidator.parseYamlFile(VALID_SCENARIO);
      const result = scenarioValidator.validateScenario(data);
      
      assert.ok(result.valid, 'In-memory validation should work');
      assert.strictEqual(result.sourcePath, 'memory');
    });
  });
  
  describe('Validation - Invalid Scenario', () => {
    it('should detect all validation errors', () => {
      const result = scenarioValidator.validateScenario(INVALID_SCENARIO);
      
      assert.ok(!result.valid, 'Invalid scenario should fail');
      assert.ok(result.errorCount > 0, 'Should have errors');
      assert.ok(Array.isArray(result.errors), 'Should have errors array');
    });
    
    it('should detect missing required fields', () => {
      const result = scenarioValidator.validateScenario(INVALID_SCENARIO);
      const requiredErrors = result.errors.filter(e => e.keyword === 'required');
      
      assert.ok(requiredErrors.length > 0, 'Should detect missing required fields');
      
      // The invalid scenario has empty arrays and missing nested required fields
      // Just verify that required field validation is working
      assert.ok(Array.isArray(requiredErrors), 'Should return array of required field errors');
    });
    
    it('should detect invalid enum values', () => {
      const result = scenarioValidator.validateScenario(INVALID_SCENARIO);
      const enumErrors = result.errors.filter(e => e.keyword === 'enum');
      
      assert.ok(enumErrors.length > 0, 'Should detect invalid enum values');
    });
    
    it('should detect string length violations', () => {
      const result = scenarioValidator.validateScenario(INVALID_SCENARIO);
      const lengthErrors = result.errors.filter(e => e.keyword === 'minLength');
      
      assert.ok(lengthErrors.length > 0, 'Should detect strings that are too short');
    });
    
    it('should detect empty arrays', () => {
      const result = scenarioValidator.validateScenario(INVALID_SCENARIO);
      const arrayErrors = result.errors.filter(e => e.keyword === 'minItems');
      
      assert.ok(arrayErrors.length > 0, 'Should detect empty arrays where items required');
    });
    
    it('should detect invalid version format', () => {
      const result = scenarioValidator.validateScenario(INVALID_SCENARIO);
      const patternErrors = result.errors.filter(e => 
        e.keyword === 'pattern' && e.path && e.path.includes('version')
      );
      
      assert.ok(patternErrors.length > 0, 'Should detect invalid semver format');
    });
  });
  
  describe('Error Formatting', () => {
    it('should format validation errors with suggestions', () => {
      const result = scenarioValidator.validateScenario(INVALID_SCENARIO);
      
      result.errors.forEach(error => {
        assert.ok(error.field, 'Error should have field');
        assert.ok(error.message, 'Error should have message');
        assert.ok(error.keyword, 'Error should have keyword');
        
        // Most errors should have suggestions
        if (error.keyword !== 'additionalProperties') {
          assert.ok(error.suggestion, 'Error should have suggestion');
        }
      });
    });
    
    it('should group errors by field', () => {
      const result = scenarioValidator.validateScenario(INVALID_SCENARIO);
      const grouped = scenarioValidator.groupErrorsByField(result.errors);
      
      assert.ok(typeof grouped === 'object', 'Should return object');
      assert.ok(Object.keys(grouped).length > 0, 'Should have grouped errors');
      
      // Each group should be an array
      Object.values(grouped).forEach(group => {
        assert.ok(Array.isArray(group), 'Each group should be array');
      });
    });
    
    it('should separate critical errors from warnings', () => {
      const result = scenarioValidator.validateScenario(INVALID_SCENARIO);
      
      assert.ok(Array.isArray(result.criticalErrors), 'Should have criticalErrors array');
      assert.ok(Array.isArray(result.warnings), 'Should have warnings array');
      
      // Critical errors should be required or type errors
      result.criticalErrors.forEach(error => {
        assert.ok(
          error.keyword === 'required' || error.keyword === 'type',
          'Critical errors should be required or type errors'
        );
      });
    });
  });
  
  describe('Validation Summary', () => {
    it('should create comprehensive summary', () => {
      const result = scenarioValidator.validateScenario(INVALID_SCENARIO);
      
      assert.ok(result.timestamp, 'Should have timestamp');
      assert.strictEqual(typeof result.valid, 'boolean', 'Should have valid flag');
      assert.strictEqual(typeof result.errorCount, 'number', 'Should have error count');
      assert.ok(result.scenarioName, 'Should have scenario name');
      assert.ok(result.version, 'Should have version');
      assert.ok(result.errors, 'Should have errors array');
      assert.ok(result.errorsByField, 'Should have grouped errors');
    });
  });
  
  describe('Custom Validation Rules', () => {
    it('should apply custom validation rules', () => {
      const customRule = scenarioValidator.createCustomRule(
        'check-phase-count',
        (data) => {
          if (data.scenario_flow && data.scenario_flow.phases) {
            if (data.scenario_flow.phases.length < 2) {
              return {
                valid: false,
                field: 'scenario_flow.phases',
                message: 'Scenario should have at least 2 phases',
                suggestion: 'Add more phases to create a meaningful workflow'
              };
            }
          }
          return { valid: true };
        }
      );
      
      const minimalData = {
        name: 'Test',
        domain: 'E-commerce',
        complexity: 'Beginner',
        version: '1.0.0',
        status: 'Draft',
        executive_summary: {
          business_context: 'A' .repeat(60),
          key_stakeholders: [{ role: 'A', responsibilities: 'B', interaction_points: 'C' }],
          success_metrics: [{ metric: 'A', target: 'B', measurement_method: 'C' }]
        },
        scenario_overview: {
          problem: {
            current_state: 'A'.repeat(30),
            pain_points: ['A'],
            impact: {}
          },
          solution: {
            target_state: 'A'.repeat(30),
            key_improvements: [{ area: 'A', improvement: 'B' }]
          },
          expected_outcomes: {}
        },
        workflow_composition: {
          workflows: [{ name: 'A', purpose: 'B'.repeat(15), phase: 'A', critical: true }],
          dependencies: 'None'
        },
        scenario_flow: {
          phases: [
            {
              id: '1',
              name: 'Phase 1',
              trigger: 'Start',
              duration: '1 day',
              workflows_used: ['A'],
              success_criteria: ['Complete']
            }
          ]
        }
      };
      
      const result = scenarioValidator.validateScenario(minimalData, {
        customRules: [customRule]
      });
      
      const customError = result.errors.find(e => e.custom);
      assert.ok(customError, 'Should have custom validation error');
      assert.ok(customError.message.includes('at least 2 phases'));
    });
    
    it('should handle custom rule errors gracefully', () => {
      const buggyRule = () => {
        throw new Error('Rule implementation error');
      };
      
      const data = scenarioValidator.parseYamlFile(VALID_SCENARIO);
      const result = scenarioValidator.validateScenario(data, {
        customRules: [buggyRule]
      });
      
      const customError = result.errors.find(e => e.keyword === 'custom');
      assert.ok(customError, 'Should catch custom rule errors');
      assert.ok(customError.message.includes('Custom validation error'));
    });
  });
  
  describe('Batch Validation', () => {
    it('should validate multiple scenarios', () => {
      const results = scenarioValidator.validateBatch([
        VALID_SCENARIO,
        INVALID_SCENARIO
      ]);
      
      assert.strictEqual(results.total, 2, 'Should validate 2 scenarios');
      assert.strictEqual(results.valid, 1, 'Should have 1 valid');
      assert.strictEqual(results.invalid, 1, 'Should have 1 invalid');
      assert.ok(Array.isArray(results.scenarios), 'Should have scenarios array');
    });
    
    it('should handle empty batch', () => {
      const results = scenarioValidator.validateBatch([]);
      
      assert.strictEqual(results.total, 0);
      assert.strictEqual(results.valid, 0);
      assert.strictEqual(results.invalid, 0);
    });
    
    it('should handle non-existent files in batch', () => {
      const results = scenarioValidator.validateBatch([
        VALID_SCENARIO,
        '/non/existent/file.yaml'
      ]);
      
      assert.strictEqual(results.total, 2);
      assert.strictEqual(results.valid, 1);
      assert.strictEqual(results.invalid, 1);
      
      const failedScenario = results.scenarios.find(s => !s.valid);
      assert.ok(failedScenario);
      assert.ok(failedScenario.errors.some(e => e.fatal));
    });
  });
  
  describe('Directory Checking', () => {
    it('should check scenarios directory status', () => {
      const status = scenarioValidator.checkScenariosDirectory();
      
      assert.ok(status.path, 'Should have path');
      assert.strictEqual(typeof status.exists, 'boolean');
      assert.ok(Array.isArray(status.files), 'Should have files array');
    });
    
    it('should detect non-existent directory', () => {
      const status = scenarioValidator.checkScenariosDirectory('/tmp/non-existent-' + Date.now());
      
      assert.strictEqual(status.exists, false);
      assert.strictEqual(status.accessible, false);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle scenario with minimal required fields', () => {
      const minimalData = {
        name: 'Minimal Test',
        domain: 'Other',
        complexity: 'Beginner',
        version: '1.0.0',
        status: 'Draft',
        executive_summary: {
          business_context: 'A'.repeat(60),
          key_stakeholders: [
            {
              role: 'Test',
              responsibilities: 'Testing',
              interaction_points: 'Always'
            }
          ],
          success_metrics: [
            {
              metric: 'Test metric',
              target: '100%',
              measurement_method: 'Count'
            }
          ]
        },
        scenario_overview: {
          problem: {
            current_state: 'Current state description that is long enough',
            pain_points: ['Pain point 1'],
            impact: {}
          },
          solution: {
            target_state: 'Target state description that is long enough',
            key_improvements: [
              {
                area: 'Test',
                improvement: 'Improvement'
              }
            ]
          },
          expected_outcomes: {}
        },
        workflow_composition: {
          workflows: [
            {
              name: 'Test Workflow',
              purpose: 'Testing purpose with enough characters',
              phase: 'Phase 1',
              critical: true
            }
          ],
          dependencies: 'None'
        },
        scenario_flow: {
          phases: [
            {
              id: '1',
              name: 'Test Phase',
              trigger: 'Manual',
              duration: '1 day',
              workflows_used: ['Test'],
              success_criteria: ['Complete']
            }
          ]
        }
      };
      
      const result = scenarioValidator.validateScenario(minimalData);
      assert.ok(result.valid, 'Minimal valid scenario should pass');
    });
    
    it('should handle very long scenario', () => {
      const data = scenarioValidator.parseYamlFile(VALID_SCENARIO);
      
      // Add many phases with all required schema fields
      for (let i = 3; i <= 20; i++) {
        data.scenario_flow.phases.push({
          id: String(i),
          name: `Phase ${i}`,
          trigger: 'Previous phase completion',
          duration: '1 day',
          workflows_used: ['Test'],
          inputs: [],
          outputs: [],
          decision_points: [],
          error_handling: [],
          success_criteria: ['Phase completed successfully']
        });
      }
      
      const result = scenarioValidator.validateScenario(data);
      if (!result.valid) {
        console.error('Validation errors:', JSON.stringify(result.errors, null, 2));
      }
      assert.ok(result.valid, 'Long scenario should validate');
    });
    
    it('should handle special characters in fields', () => {
      const data = scenarioValidator.parseYamlFile(VALID_SCENARIO);
      data.name = 'Test & Special <Characters> "Quotes"';
      
      const result = scenarioValidator.validateScenario(data);
      assert.ok(result.valid, 'Should handle special characters');
    });
  });
  
  describe('Performance', () => {
    it('should validate quickly', () => {
      const start = Date.now();
      scenarioValidator.validateScenario(VALID_SCENARIO);
      const duration = Date.now() - start;
      
      assert.ok(duration < 1000, 'Validation should complete in < 1 second');
    });
    
    it('should handle batch validation efficiently', () => {
      const scenarios = Array(10).fill(VALID_SCENARIO);
      const start = Date.now();
      scenarioValidator.validateBatch(scenarios);
      const duration = Date.now() - start;
      
      assert.ok(duration < 5000, 'Batch validation should complete in < 5 seconds');
    });
  });
});

console.log('\nRunning scenario validator tests...\n');

