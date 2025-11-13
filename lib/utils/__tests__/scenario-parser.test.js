/**
 * Tests for Scenario Parser
 * 
 * @group unit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseScenarioYAML,
  validateScenarioSchema,
  validateScenarioLogic,
  extractScenarioMetadata,
  getGenerationTargets,
  getErrorSummary,
  scenarioSchema
} from '../scenario-parser.js';

describe('Scenario Parser', () => {
  describe('parseScenarioYAML', () => {
    it('should parse valid scenario YAML', () => {
      const yaml = `
scenario:
  name: test-scenario
  description: Test scenario
  category: business_process
  trigger:
    type: manual
    command: /test
  steps:
    - id: step_1
      action: First step
      type: manual
`;

      const result = parseScenarioYAML(yaml);
      
      expect(result.success).toBe(true);
      expect(result.data.scenario.name).toBe('test-scenario');
      expect(result.validation.valid).toBe(true);
    });

    it('should detect YAML syntax errors', () => {
      const yaml = `
scenario:
  name: test
  invalid: yaml: content:
`;

      const result = parseScenarioYAML(yaml);
      
      expect(result.success).toBe(false);
      expect(result.validation.phase).toBe('yaml_syntax');
      expect(result.validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect schema violations', () => {
      const yaml = `
scenario:
  name: test-scenario
  description: Test
  category: invalid_category
  trigger:
    type: manual
  steps:
    - id: step_1
      action: First step
      type: manual
`;

      const result = parseScenarioYAML(yaml);
      
      expect(result.success).toBe(false);
      expect(result.validation.phase).toBe('schema');
      expect(result.validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid step dependencies', () => {
      const yaml = `
scenario:
  name: test-scenario
  description: Test
  category: business_process
  trigger:
    type: manual
  steps:
    - id: step_1
      action: First step
      type: manual
      dependencies:
        - nonexistent_step
`;

      const result = parseScenarioYAML(yaml);
      
      expect(result.success).toBe(false);
      expect(result.validation.phase).toBe('logic');
      expect(result.validation.errors.some(e => e.type === 'invalid_dependency')).toBe(true);
    });

    it('should detect circular dependencies', () => {
      const yaml = `
scenario:
  name: test-scenario
  description: Test
  category: business_process
  trigger:
    type: manual
  steps:
    - id: step_1
      action: First step
      type: manual
      dependencies:
        - step_2
    - id: step_2
      action: Second step
      type: manual
      dependencies:
        - step_1
`;

      const result = parseScenarioYAML(yaml);
      
      expect(result.success).toBe(false);
      expect(result.validation.phase).toBe('logic');
      expect(result.validation.errors.some(e => e.type === 'circular_dependency')).toBe(true);
    });

    it('should detect duplicate step IDs', () => {
      const yaml = `
scenario:
  name: test-scenario
  description: Test
  category: business_process
  trigger:
    type: manual
  steps:
    - id: step_1
      action: First step
      type: manual
    - id: step_1
      action: Duplicate ID
      type: manual
`;

      const result = parseScenarioYAML(yaml);
      
      expect(result.success).toBe(false);
      expect(result.validation.phase).toBe('logic');
      expect(result.validation.errors.some(e => e.type === 'duplicate_ids')).toBe(true);
    });
  });

  describe('validateScenarioSchema', () => {
    it('should validate correct schema', () => {
      const data = {
        scenario: {
          name: 'test',
          description: 'Test scenario',
          category: 'business_process',
          trigger: {
            type: 'manual',
            command: '/test'
          },
          steps: [
            {
              id: 'step_1',
              action: 'Do something',
              type: 'manual'
            }
          ]
        }
      };

      const result = validateScenarioSchema(data);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing required fields', () => {
      const data = {
        scenario: {
          name: 'test',
          // missing description
          category: 'business_process',
          trigger: {
            type: 'manual'
          },
          steps: []
        }
      };

      const result = validateScenarioSchema(data);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid category', () => {
      const data = {
        scenario: {
          name: 'test',
          description: 'Test',
          category: 'invalid_category',
          trigger: {
            type: 'manual'
          },
          steps: [
            {
              id: 'step_1',
              action: 'Do something',
              type: 'manual'
            }
          ]
        }
      };

      const result = validateScenarioSchema(data);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.keyword === 'enum')).toBe(true);
    });

    it('should reject invalid name format', () => {
      const data = {
        scenario: {
          name: 'Test With Spaces',
          description: 'Test',
          category: 'business_process',
          trigger: {
            type: 'manual'
          },
          steps: [
            {
              id: 'step_1',
              action: 'Do something',
              type: 'manual'
            }
          ]
        }
      };

      const result = validateScenarioSchema(data);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.keyword === 'pattern')).toBe(true);
    });

    it('should accept optional fields', () => {
      const data = {
        scenario: {
          name: 'test',
          description: 'Test',
          category: 'business_process',
          version: '1.0.0',
          trigger: {
            type: 'hybrid',
            command: '/test',
            keywords: ['test', 'scenario'],
            schedule: {
              cron: '0 9 * * 1'
            },
            webhook: {
              path: '/webhook/test',
              method: 'POST'
            }
          },
          steps: [
            {
              id: 'step_1',
              action: 'Do something',
              type: 'ai_analysis',
              mcp: 'perplexity-mcp',
              inputs: ['data'],
              outputs: ['result'],
              timeout: 30
            }
          ],
          dependencies: {
            mcps: ['perplexity-mcp'],
            skills: ['analyzer']
          },
          generates: ['global_skill: test', 'slash_command: /test'],
          testStrategy: 'Unit test each step'
        }
      };

      const result = validateScenarioSchema(data);
      
      expect(result.valid).toBe(true);
    });
  });

  describe('validateScenarioLogic', () => {
    it('should pass for valid logic', () => {
      const scenario = {
        scenario: {
          steps: [
            {
              id: 'step_1',
              action: 'First',
              type: 'manual'
            },
            {
              id: 'step_2',
              action: 'Second',
              type: 'manual',
              dependencies: ['step_1']
            }
          ]
        }
      };

      const result = validateScenarioLogic(scenario);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect duplicate step IDs', () => {
      const scenario = {
        scenario: {
          steps: [
            {
              id: 'step_1',
              action: 'First',
              type: 'manual'
            },
            {
              id: 'step_1',
              action: 'Duplicate',
              type: 'manual'
            }
          ]
        }
      };

      const result = validateScenarioLogic(scenario);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0].type).toBe('duplicate_ids');
    });

    it('should detect invalid dependencies', () => {
      const scenario = {
        scenario: {
          steps: [
            {
              id: 'step_1',
              action: 'First',
              type: 'manual',
              dependencies: ['step_999']
            }
          ]
        }
      };

      const result = validateScenarioLogic(scenario);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0].type).toBe('invalid_dependency');
      expect(result.errors[0].missingDep).toBe('step_999');
    });

    it('should detect simple circular dependency', () => {
      const scenario = {
        scenario: {
          steps: [
            {
              id: 'step_1',
              action: 'First',
              type: 'manual',
              dependencies: ['step_2']
            },
            {
              id: 'step_2',
              action: 'Second',
              type: 'manual',
              dependencies: ['step_1']
            }
          ]
        }
      };

      const result = validateScenarioLogic(scenario);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0].type).toBe('circular_dependency');
      expect(result.errors[0].cycle).toContain('step_1');
      expect(result.errors[0].cycle).toContain('step_2');
    });

    it('should detect complex circular dependency', () => {
      const scenario = {
        scenario: {
          steps: [
            {
              id: 'step_1',
              action: 'First',
              type: 'manual',
              dependencies: ['step_2']
            },
            {
              id: 'step_2',
              action: 'Second',
              type: 'manual',
              dependencies: ['step_3']
            },
            {
              id: 'step_3',
              action: 'Third',
              type: 'manual',
              dependencies: ['step_1']
            }
          ]
        }
      };

      const result = validateScenarioLogic(scenario);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0].type).toBe('circular_dependency');
    });

    it('should handle steps without dependencies', () => {
      const scenario = {
        scenario: {
          steps: [
            {
              id: 'step_1',
              action: 'First',
              type: 'manual'
            },
            {
              id: 'step_2',
              action: 'Second',
              type: 'manual'
            }
          ]
        }
      };

      const result = validateScenarioLogic(scenario);
      
      expect(result.valid).toBe(true);
    });
  });

  describe('extractScenarioMetadata', () => {
    it('should extract basic metadata', () => {
      const scenarioData = {
        scenario: {
          name: 'test-scenario',
          description: 'Test description',
          category: 'business_process',
          trigger: {
            type: 'manual',
            command: '/test'
          },
          steps: [
            { id: 'step_1', action: 'First', type: 'manual' },
            { id: 'step_2', action: 'Second', type: 'manual' }
          ]
        }
      };

      const metadata = extractScenarioMetadata(scenarioData);
      
      expect(metadata.name).toBe('test-scenario');
      expect(metadata.description).toBe('Test description');
      expect(metadata.category).toBe('business_process');
      expect(metadata.triggerType).toBe('manual');
      expect(metadata.triggerCommand).toBe('/test');
      expect(metadata.stepCount).toBe(2);
    });

    it('should extract dependencies', () => {
      const scenarioData = {
        scenario: {
          name: 'test',
          description: 'Test',
          category: 'automation',
          trigger: { type: 'manual' },
          steps: [{ id: 'step_1', action: 'Do', type: 'manual' }],
          dependencies: {
            mcps: ['mcp-1', 'mcp-2'],
            skills: ['skill-1']
          },
          generates: ['global_skill: test', 'slash_command: /test']
        }
      };

      const metadata = extractScenarioMetadata(scenarioData);
      
      expect(metadata.mcpDependencies).toEqual(['mcp-1', 'mcp-2']);
      expect(metadata.skillDependencies).toEqual(['skill-1']);
      expect(metadata.generates).toHaveLength(2);
    });

    it('should provide defaults for missing fields', () => {
      const scenarioData = {
        scenario: {
          name: 'test',
          description: 'Test',
          category: 'other',
          trigger: { type: 'manual' },
          steps: [{ id: 'step_1', action: 'Do', type: 'manual' }]
        }
      };

      const metadata = extractScenarioMetadata(scenarioData);
      
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.mcpDependencies).toEqual([]);
      expect(metadata.skillDependencies).toEqual([]);
      expect(metadata.generates).toEqual([]);
    });
  });

  describe('getGenerationTargets', () => {
    it('should parse generation targets', () => {
      const scenarioData = {
        scenario: {
          generates: [
            'global_skill: my_scenario',
            'slash_command: /my-scenario',
            'hook: scenario_hook',
            'webhook: /webhook/scenario',
            'mcp_config: scenario-mcp'
          ]
        }
      };

      const targets = getGenerationTargets(scenarioData);
      
      expect(targets.skills).toEqual(['my_scenario']);
      expect(targets.commands).toEqual(['/my-scenario']);
      expect(targets.hooks).toEqual(['scenario_hook']);
      expect(targets.webhooks).toEqual(['/webhook/scenario']);
      expect(targets.mcpConfigs).toEqual(['scenario-mcp']);
    });

    it('should handle empty generates array', () => {
      const scenarioData = {
        scenario: {
          generates: []
        }
      };

      const targets = getGenerationTargets(scenarioData);
      
      expect(targets.skills).toEqual([]);
      expect(targets.commands).toEqual([]);
      expect(targets.hooks).toEqual([]);
      expect(targets.webhooks).toEqual([]);
      expect(targets.mcpConfigs).toEqual([]);
    });

    it('should handle missing generates field', () => {
      const scenarioData = {
        scenario: {}
      };

      const targets = getGenerationTargets(scenarioData);
      
      expect(targets.skills).toEqual([]);
    });
  });

  describe('getErrorSummary', () => {
    it('should format error summary', () => {
      const parseResult = {
        success: false,
        validation: {
          phase: 'schema',
          errors: [
            {
              message: 'Invalid field',
              path: '/scenario/name'
            },
            {
              message: 'Missing required field',
              path: '/scenario/description'
            }
          ]
        }
      };

      const summary = getErrorSummary(parseResult);
      
      expect(summary).toContain('schema');
      expect(summary).toContain('Invalid field');
      expect(summary).toContain('Missing required field');
    });

    it('should handle success case', () => {
      const parseResult = {
        success: true,
        validation: {
          valid: true,
          errors: []
        }
      };

      const summary = getErrorSummary(parseResult);
      
      expect(summary).toBe('No errors');
    });

    it('should include line numbers when available', () => {
      const parseResult = {
        success: false,
        validation: {
          phase: 'yaml_syntax',
          errors: [
            {
              message: 'Syntax error',
              line: 10,
              column: 5
            }
          ]
        }
      };

      const summary = getErrorSummary(parseResult);
      
      expect(summary).toContain('Line: 10');
      expect(summary).toContain('Column: 5');
    });
  });

  describe('scenarioSchema', () => {
    it('should be a valid JSON schema', () => {
      expect(scenarioSchema).toBeDefined();
      expect(scenarioSchema.type).toBe('object');
      expect(scenarioSchema.required).toContain('scenario');
    });

    it('should define all required scenario fields', () => {
      const scenarioProps = scenarioSchema.properties.scenario;
      
      expect(scenarioProps.required).toContain('name');
      expect(scenarioProps.required).toContain('description');
      expect(scenarioProps.required).toContain('category');
      expect(scenarioProps.required).toContain('trigger');
      expect(scenarioProps.required).toContain('steps');
    });
  });
});

