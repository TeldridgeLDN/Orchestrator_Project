/**
 * Scenario Validate Command
 * 
 * Validate scenario configuration and dependencies.
 * 
 * @module commands/scenario/validate
 */

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import chalk from 'chalk';
import { getScenariosDir, scenariosDirectoryExists } from '../../utils/scenario-directory.js';
import { 
  createError, 
  createCommandErrorHandler, 
  wrapError, 
  ScenarioNotFoundError,
  YAMLParseError,
  SchemaValidationError
} from '../../utils/errors/index.js';

/**
 * JSON Schema for scenario validation
 */
const scenarioSchema = {
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
        }
      }
    }
  }
};

/**
 * Find scenario file by name
 * 
 * @param {string} name - Scenario name
 * @returns {Promise<string|null>} Path to scenario file or null
 */
async function findScenarioFile(name) {
  if (!scenariosDirectoryExists()) {
    return null;
  }
  
  const scenariosDir = getScenariosDir();
  const yamlPath = path.join(scenariosDir, `${name}.yaml`);
  const ymlPath = path.join(scenariosDir, `${name}.yml`);
  
  try {
    await fs.access(yamlPath);
    return yamlPath;
  } catch {
    try {
      await fs.access(ymlPath);
      return ymlPath;
    } catch {
      return null;
    }
  }
}

/**
 * Load scenario from file
 * 
 * @param {string} filePath - Path to scenario file
 * @returns {Promise<object>} Scenario data
 */
async function loadScenario(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return yaml.load(content);
  } catch (error) {
    if (error.name === 'YAMLException') {
      throw wrapError(error, 'UTIL-DATA-002', { path: filePath });
    }
    throw wrapError(error, 'UTIL-FS-006', { path: filePath });
  }
}

/**
 * Validate YAML syntax
 * 
 * @param {string} filePath - Path to file
 * @returns {{valid: boolean, error?: string}}
 */
async function validateYamlSyntax(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    yaml.load(content);
    return { valid: true };
  } catch (error) {
    const wrappedError = error.name === 'YAMLException' 
      ? wrapError(error, 'UTIL-DATA-002', { path: filePath })
      : wrapError(error, 'UTIL-FS-006', { path: filePath });
    
    return { 
      valid: false, 
      error: wrappedError.userMessage || wrappedError.message 
    };
  }
}

/**
 * Validate scenario against schema
 * 
 * @param {object} scenario - Scenario data
 * @param {boolean} strict - Use strict validation
 * @returns {{valid: boolean, errors?: any[]}}
 */
function validateSchema(scenario, strict = false) {
  const ajv = new Ajv({ allErrors: true, strict: strict });
  addFormats(ajv);
  
  const validate = ajv.compile(scenarioSchema);
  const valid = validate(scenario);
  
  return {
    valid,
    errors: validate.errors
  };
}

/**
 * Validate step dependencies
 * 
 * @param {object} scenario - Scenario data
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateDependencies(scenario) {
  const errors = [];
  const stepIds = new Set(scenario.scenario.steps.map(s => s.id));
  
  scenario.scenario.steps.forEach(step => {
    if (step.dependencies) {
      step.dependencies.forEach(dep => {
        if (!stepIds.has(dep)) {
          errors.push(`Step "${step.id}" depends on non-existent step "${dep}"`);
        }
      });
    }
  });
  
  // Check for circular dependencies
  const visited = new Set();
  const recursionStack = new Set();
  
  function hasCycle(stepId) {
    visited.add(stepId);
    recursionStack.add(stepId);
    
    const step = scenario.scenario.steps.find(s => s.id === stepId);
    if (step && step.dependencies) {
      for (const dep of step.dependencies) {
        if (!visited.has(dep)) {
          if (hasCycle(dep)) return true;
        } else if (recursionStack.has(dep)) {
          errors.push(`Circular dependency detected: ${stepId} -> ${dep}`);
          return true;
        }
      }
    }
    
    recursionStack.delete(stepId);
    return false;
  }
  
  scenario.scenario.steps.forEach(step => {
    if (!visited.has(step.id)) {
      hasCycle(step.id);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check for duplicate step IDs
 * 
 * @param {object} scenario - Scenario data
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateUniqueStepIds(scenario) {
  const errors = [];
  const stepIds = {};
  
  scenario.scenario.steps.forEach(step => {
    if (stepIds[step.id]) {
      errors.push(`Duplicate step ID: "${step.id}"`);
    } else {
      stepIds[step.id] = true;
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format validation results
 * 
 * @param {object} results - Validation results
 * @param {boolean} verbose - Show verbose output
 */
function formatResults(results, verbose) {
  console.log(chalk.bold('\n🔍 Validation Results\n'));
  
  // YAML Syntax
  if (results.yamlSyntax.valid) {
    console.log(chalk.green('✅ YAML Syntax: Valid'));
  } else {
    console.log(chalk.red('❌ YAML Syntax: Invalid'));
    console.log(chalk.red(`   ${results.yamlSyntax.error}`));
  }
  
  // Schema Validation
  if (results.schema.valid) {
    console.log(chalk.green('✅ Schema: Valid'));
  } else {
    console.log(chalk.red('❌ Schema: Invalid'));
    if (verbose && results.schema.errors) {
      results.schema.errors.forEach(err => {
        console.log(chalk.red(`   ${err.instancePath || '/'}: ${err.message}`));
      });
    }
  }
  
  // Dependencies
  if (results.dependencies.valid) {
    console.log(chalk.green('✅ Dependencies: Valid'));
  } else {
    console.log(chalk.red('❌ Dependencies: Invalid'));
    results.dependencies.errors.forEach(err => {
      console.log(chalk.red(`   ${err}`));
    });
  }
  
  // Unique Step IDs
  if (results.uniqueStepIds.valid) {
    console.log(chalk.green('✅ Step IDs: Unique'));
  } else {
    console.log(chalk.red('❌ Step IDs: Not Unique'));
    results.uniqueStepIds.errors.forEach(err => {
      console.log(chalk.red(`   ${err}`));
    });
  }
  
  // Overall result
  const allValid = results.yamlSyntax.valid && 
                   results.schema.valid && 
                   results.dependencies.valid &&
                   results.uniqueStepIds.valid;
  
  if (allValid) {
    console.log(chalk.green.bold('\n✅ All validations passed!\n'));
  } else {
    console.log(chalk.red.bold('\n❌ Validation failed. Please fix the errors above.\n'));
  }
  
  return allValid;
}

/**
 * Handle the scenario validate command
 * 
 * @param {string} name - Scenario name
 * @param {object} options - Command options
 * @param {boolean} options.strict - Use strict validation
 * @param {boolean} options.verbose - Show verbose output
 */
async function handleValidate(name, options) {
  const handleError = createCommandErrorHandler({
    commandName: 'scenario-validate',
    verbose: options.verbose || false,
    exitCode: 1
  });

  try {
    // Find scenario file
    const filePath = await findScenarioFile(name);
    
    if (!filePath) {
      throw new ScenarioNotFoundError(
        `Scenario "${name}" not found`,
        'CMD-SCEN-001',
        { scenario: name, suggestion: 'List available scenarios with: diet103 scenario list' }
      );
    }
    
    console.log(chalk.gray(`Validating scenario: ${name}`));
    
    // Run validations
    const results = {
      yamlSyntax: await validateYamlSyntax(filePath),
      schema: { valid: true },
      dependencies: { valid: true, errors: [] },
      uniqueStepIds: { valid: true, errors: [] }
    };
    
    // Only proceed with further validation if YAML is valid
    if (results.yamlSyntax.valid) {
      const scenario = await loadScenario(filePath);
      
      results.schema = validateSchema(scenario, options.strict);
      results.dependencies = validateDependencies(scenario);
      results.uniqueStepIds = validateUniqueStepIds(scenario);
    }
    
    // Format and display results
    const allValid = formatResults(results, options.verbose);
    
    process.exit(allValid ? 0 : 1);
    
  } catch (error) {
    await handleError(error);
  }
}

/**
 * Create the 'scenario validate' command
 * 
 * @returns {Command} Configured Commander.js command
 */
export function validateCommand() {
  return new Command('validate')
    .description('Validate scenario configuration and dependencies')
    .argument('<name>', 'Scenario name')
    .option('--strict', 'Use strict validation rules')
    .option('-v, --verbose', 'Show detailed validation output')
    .addHelpText('after', `
Examples:
  $ diet103 scenario validate my-scenario           # Validate scenario
  $ diet103 scenario validate my-scenario --strict  # Strict validation
  $ diet103 scenario validate my-scenario -v        # Verbose output
    `)
    .action(handleValidate);
}

