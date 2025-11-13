/**
 * Scenario Parser Module
 * 
 * Provides comprehensive parsing and validation for scenario YAML files.
 * Used for scenario creation, validation, and scaffolding operations.
 * 
 * @module utils/scenario-parser
 */

import fs from 'fs/promises';
import yaml from 'js-yaml';
import Ajv from 'ajv';

/**
 * JSON Schema for scenario validation
 * Defines the complete structure and constraints for scenario YAML files
 */
export const scenarioSchema = {
  type: 'object',
  required: ['scenario'],
  properties: {
    scenario: {
      type: 'object',
      required: ['name', 'description', 'category', 'trigger', 'steps'],
      properties: {
        name: {
          type: 'string',
          pattern: '^[a-z0-9-]+$',
          minLength: 1
        },
        description: {
          type: 'string',
          minLength: 1
        },
        category: {
          type: 'string',
          enum: ['business_process', 'data_pipeline', 'automation', 'integration', 'other']
        },
        version: {
          type: 'string',
          pattern: '^\\d+\\.\\d+\\.\\d+$'
        },
        trigger: {
          type: 'object',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              enum: ['manual', 'scheduled', 'webhook', 'hybrid']
            },
            command: {
              type: 'string',
              pattern: '^/'
            },
            keywords: {
              type: 'array',
              items: { type: 'string' }
            },
            schedule: {
              type: 'object',
              properties: {
                cron: { type: 'string' }
              }
            },
            webhook: {
              type: 'object',
              properties: {
                path: { type: 'string', pattern: '^/' },
                method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }
              }
            }
          }
        },
        steps: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['id', 'action', 'type'],
            properties: {
              id: {
                type: 'string',
                pattern: '^[a-z0-9_]+$'
              },
              action: {
                type: 'string',
                minLength: 1
              },
              type: {
                type: 'string',
                enum: ['manual', 'webhook', 'ai_analysis', 'api_call', 'data_processing']
              },
              dependencies: {
                type: 'array',
                items: { type: 'string' }
              },
              mcp: {
                type: 'string'
              },
              inputs: {
                type: 'array',
                items: { type: 'string' }
              },
              outputs: {
                type: 'array',
                items: { type: 'string' }
              },
              timeout: {
                type: ['number', 'string']
              },
              calls: {
                type: 'string'
              }
            }
          }
        },
        dependencies: {
          type: 'object',
          properties: {
            mcps: {
              type: 'array',
              items: { type: 'string' }
            },
            skills: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        generates: {
          type: 'array',
          items: { type: 'string' }
        },
        design_decisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              rationale: { type: 'string' },
              alternatives_considered: {
                type: 'array',
                items: { type: 'string' }
              },
              trade_offs: { type: 'object' }
            }
          }
        },
        potential_improvements: {
          type: 'array',
          items: { type: 'string' }
        },
        testStrategy: {
          type: 'string'
        }
      }
    }
  }
};

/**
 * Validation result object
 * 
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {Array<Object>} errors - Array of validation errors
 * @property {string} phase - Which validation phase failed
 */

/**
 * Parsed scenario result
 * 
 * @typedef {Object} ParseResult
 * @property {boolean} success - Whether parsing succeeded
 * @property {Object} data - Parsed scenario data
 * @property {ValidationResult} validation - Validation results
 * @property {Error} error - Error object if parsing failed
 */

/**
 * Parse scenario YAML from file
 * 
 * @param {string} filePath - Path to scenario YAML file
 * @returns {Promise<ParseResult>} Parse result with validation
 */
export async function parseScenarioFile(filePath) {
  const result = {
    success: false,
    data: null,
    validation: {
      valid: false,
      errors: [],
      phase: null
    },
    error: null
  };

  try {
    // Read file
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Parse YAML
    const parsed = parseScenarioYAML(content);
    
    if (!parsed.success) {
      result.error = parsed.error;
      result.validation = parsed.validation;
      return result;
    }
    
    result.data = parsed.data;
    result.validation = parsed.validation;
    result.success = true;
    
    return result;
    
  } catch (error) {
    result.error = error;
    result.validation.phase = 'file_read';
    result.validation.errors.push({
      message: `Failed to read file: ${error.message}`,
      path: filePath
    });
    return result;
  }
}

/**
 * Parse scenario YAML from string
 * 
 * @param {string} content - YAML content as string
 * @returns {ParseResult} Parse result with validation
 */
export function parseScenarioYAML(content) {
  const result = {
    success: false,
    data: null,
    validation: {
      valid: false,
      errors: [],
      phase: null
    },
    error: null
  };

  // Phase 1: YAML syntax validation
  try {
    result.data = yaml.load(content);
  } catch (error) {
    result.error = error;
    result.validation.phase = 'yaml_syntax';
    result.validation.errors.push({
      message: `YAML syntax error: ${error.message}`,
      line: error.mark?.line,
      column: error.mark?.column
    });
    return result;
  }

  // Phase 2: Schema validation
  const schemaValidation = validateScenarioSchema(result.data);
  
  if (!schemaValidation.valid) {
    result.validation = schemaValidation;
    return result;
  }

  // Phase 3: Business logic validation
  const logicValidation = validateScenarioLogic(result.data);
  
  if (!logicValidation.valid) {
    result.validation = logicValidation;
    return result;
  }

  // All validations passed
  result.success = true;
  result.validation = {
    valid: true,
    errors: [],
    phase: 'complete'
  };

  return result;
}

/**
 * Validate scenario against JSON Schema
 * 
 * @param {Object} data - Parsed scenario data
 * @returns {ValidationResult} Validation result
 */
export function validateScenarioSchema(data) {
  const result = {
    valid: false,
    errors: [],
    phase: 'schema'
  };

  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(scenarioSchema);
  const valid = validate(data);

  if (!valid) {
    result.errors = validate.errors.map(error => ({
      message: error.message,
      path: error.instancePath,
      keyword: error.keyword,
      params: error.params
    }));
    return result;
  }

  result.valid = true;
  return result;
}

/**
 * Validate scenario business logic
 * Checks dependencies, circular references, etc.
 * 
 * @param {Object} scenario - Parsed scenario data
 * @returns {ValidationResult} Validation result
 */
export function validateScenarioLogic(scenario) {
  const result = {
    valid: true,
    errors: [],
    phase: 'logic'
  };

  const steps = scenario.scenario.steps;

  // Check 1: Unique step IDs
  const stepIds = steps.map(s => s.id);
  const duplicates = stepIds.filter((id, index) => stepIds.indexOf(id) !== index);
  
  if (duplicates.length > 0) {
    result.valid = false;
    result.errors.push({
      message: `Duplicate step IDs found: ${duplicates.join(', ')}`,
      type: 'duplicate_ids'
    });
  }

  // Check 2: Valid step dependencies
  steps.forEach(step => {
    if (step.dependencies) {
      step.dependencies.forEach(depId => {
        if (!stepIds.includes(depId)) {
          result.valid = false;
          result.errors.push({
            message: `Step "${step.id}" depends on non-existent step "${depId}"`,
            type: 'invalid_dependency',
            stepId: step.id,
            missingDep: depId
          });
        }
      });
    }
  });

  // Check 3: Circular dependencies
  const circularCheck = detectCircularDependencies(steps);
  
  if (circularCheck.hasCircular) {
    result.valid = false;
    result.errors.push({
      message: `Circular dependency detected: ${circularCheck.cycle.join(' -> ')}`,
      type: 'circular_dependency',
      cycle: circularCheck.cycle
    });
  }

  return result;
}

/**
 * Detect circular dependencies in step definitions
 * 
 * @param {Array<Object>} steps - Array of step objects
 * @returns {Object} Result with hasCircular boolean and cycle array
 */
function detectCircularDependencies(steps) {
  const result = {
    hasCircular: false,
    cycle: []
  };

  // Build adjacency list
  const graph = {};
  steps.forEach(step => {
    graph[step.id] = step.dependencies || [];
  });

  // DFS to detect cycles
  const visited = new Set();
  const recStack = new Set();

  function dfs(node, path = []) {
    if (recStack.has(node)) {
      // Found a cycle
      const cycleStart = path.indexOf(node);
      result.hasCircular = true;
      result.cycle = [...path.slice(cycleStart), node];
      return true;
    }

    if (visited.has(node)) {
      return false;
    }

    visited.add(node);
    recStack.add(node);
    path.push(node);

    const neighbors = graph[node] || [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor, [...path])) {
        return true;
      }
    }

    recStack.delete(node);
    return false;
  }

  // Check each node
  for (const stepId of Object.keys(graph)) {
    if (!visited.has(stepId)) {
      if (dfs(stepId)) {
        break;
      }
    }
  }

  return result;
}

/**
 * Extract scenario metadata for quick access
 * 
 * @param {Object} scenarioData - Parsed scenario data
 * @returns {Object} Metadata object
 */
export function extractScenarioMetadata(scenarioData) {
  const scenario = scenarioData.scenario;
  
  return {
    name: scenario.name,
    description: scenario.description,
    category: scenario.category,
    version: scenario.version || '1.0.0',
    triggerType: scenario.trigger.type,
    triggerCommand: scenario.trigger.command,
    stepCount: scenario.steps.length,
    mcpDependencies: scenario.dependencies?.mcps || [],
    skillDependencies: scenario.dependencies?.skills || [],
    generates: scenario.generates || []
  };
}

/**
 * Get scenario generation targets
 * Parses the 'generates' array to determine what to create
 * 
 * @param {Object} scenarioData - Parsed scenario data
 * @returns {Object} Generation targets
 */
export function getGenerationTargets(scenarioData) {
  const generates = scenarioData.scenario.generates || [];
  
  const targets = {
    skills: [],
    commands: [],
    hooks: [],
    webhooks: [],
    mcpConfigs: []
  };

  generates.forEach(item => {
    const [type, value] = item.split(':').map(s => s.trim());
    
    switch (type) {
      case 'global_skill':
        targets.skills.push(value);
        break;
      case 'slash_command':
        targets.commands.push(value);
        break;
      case 'hook':
        targets.hooks.push(value);
        break;
      case 'webhook':
        targets.webhooks.push(value);
        break;
      case 'mcp_config':
        targets.mcpConfigs.push(value);
        break;
    }
  });

  return targets;
}

/**
 * Validate multiple scenarios
 * 
 * @param {Array<string>} filePaths - Array of scenario file paths
 * @returns {Promise<Array<ParseResult>>} Array of parse results
 */
export async function parseMultipleScenarios(filePaths) {
  const results = await Promise.all(
    filePaths.map(filePath => parseScenarioFile(filePath))
  );
  
  return results;
}

/**
 * Get human-readable error summary
 * 
 * @param {ParseResult} parseResult - Parse result object
 * @returns {string} Formatted error message
 */
export function getErrorSummary(parseResult) {
  if (parseResult.success) {
    return 'No errors';
  }

  const { validation } = parseResult;
  const lines = [];

  lines.push(`Validation failed at phase: ${validation.phase}`);
  lines.push('');

  validation.errors.forEach((error, index) => {
    lines.push(`${index + 1}. ${error.message}`);
    if (error.path) {
      lines.push(`   Path: ${error.path}`);
    }
    if (error.line) {
      lines.push(`   Line: ${error.line}, Column: ${error.column}`);
    }
  });

  return lines.join('\n');
}

export default {
  parseScenarioFile,
  parseScenarioYAML,
  validateScenarioSchema,
  validateScenarioLogic,
  extractScenarioMetadata,
  getGenerationTargets,
  parseMultipleScenarios,
  getErrorSummary,
  scenarioSchema
};

