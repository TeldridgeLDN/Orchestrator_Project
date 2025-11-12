#!/usr/bin/env node

/**
 * Scenario YAML Schema Validator
 * 
 * Validates scenario YAML files against the comprehensive scenario schema.
 * Uses js-yaml for YAML parsing and Ajv for JSON Schema validation.
 * 
 * Features:
 * - Comprehensive validation with detailed error messages
 * - Modular design for extensibility
 * - Support for custom validation rules
 * - User-friendly error formatting
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load JSON Schema from file
 * @param {string} schemaPath - Path to schema file
 * @returns {Object} JSON Schema object
 */
export function loadSchema(schemaPath = null) {
  const defaultSchemaPath = path.join(__dirname, '../schemas/scenario-schema.json');
  const resolvedPath = schemaPath || defaultSchemaPath;
  
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Schema file not found: ${resolvedPath}`);
  }
  
  const schemaContent = fs.readFileSync(resolvedPath, 'utf8');
  return JSON.parse(schemaContent);
}

/**
 * Initialize Ajv validator with schema and formats
 * @param {Object} schema - JSON Schema object
 * @param {Object} options - Ajv options
 * @returns {Function} Validation function
 */
export function createValidator(schema, options = {}) {
  const ajvOptions = {
    allErrors: true,
    verbose: true,
    strict: false,
    strictTypes: false,
    strictTuples: false,
    allowUnionTypes: true,
    ...options
  };
  
  const ajv = new Ajv(ajvOptions);
  addFormats(ajv);
  
  return ajv.compile(schema);
}

/**
 * Parse YAML file to JavaScript object
 * @param {string} yamlPath - Path to YAML file
 * @returns {Object} Parsed YAML object
 * @throws {Error} If file doesn't exist or YAML is invalid
 */
export function parseYamlFile(yamlPath) {
  if (!fs.existsSync(yamlPath)) {
    throw new Error(`YAML file not found: ${yamlPath}`);
  }
  
  try {
    const fileContent = fs.readFileSync(yamlPath, 'utf8');
    return yaml.load(fileContent);
  } catch (error) {
    throw new Error(`YAML parsing error: ${error.message}`);
  }
}

/**
 * Format validation error for user-friendly display
 * @param {Object} error - Ajv error object
 * @param {Object} data - The data being validated
 * @returns {Object} Formatted error object
 */
export function formatValidationError(error, data) {
  const {
    instancePath,
    keyword,
    message,
    params,
    schemaPath
  } = error;
  
  // Create readable path (e.g., /scenario_flow/phases/0/name)
  const fieldPath = instancePath || 'root';
  const cleanPath = fieldPath.replace(/^\//, '').replace(/\//g, ' → ');
  
  let detailedMessage = message;
  let suggestion = '';
  
  // Customize messages based on error type
  switch (keyword) {
    case 'required':
      detailedMessage = `Missing required field: ${params.missingProperty}`;
      suggestion = `Add the '${params.missingProperty}' field to ${cleanPath || 'the root'}`;
      break;
      
    case 'type':
      detailedMessage = `Expected type '${params.type}' but got '${typeof data}'`;
      suggestion = `Ensure ${cleanPath} is of type ${params.type}`;
      break;
      
    case 'enum':
      detailedMessage = `Value must be one of: ${params.allowedValues.join(', ')}`;
      suggestion = `Choose a valid value for ${cleanPath}`;
      break;
      
    case 'minLength':
      detailedMessage = `String too short (minimum ${params.limit} characters)`;
      suggestion = `Provide more detail for ${cleanPath}`;
      break;
      
    case 'minItems':
      detailedMessage = `Array requires at least ${params.limit} item(s)`;
      suggestion = `Add more items to ${cleanPath}`;
      break;
      
    case 'pattern':
      detailedMessage = `Value doesn't match required pattern: ${params.pattern}`;
      suggestion = `Format ${cleanPath} according to the pattern`;
      break;
      
    case 'format':
      detailedMessage = `Invalid ${params.format} format`;
      suggestion = `Ensure ${cleanPath} is a valid ${params.format}`;
      break;
      
    case 'additionalProperties':
      detailedMessage = `Unknown property: ${params.additionalProperty}`;
      suggestion = `Remove '${params.additionalProperty}' or check for typos`;
      break;
  }
  
  return {
    field: cleanPath || 'root',
    path: instancePath,
    keyword,
    message: detailedMessage,
    suggestion,
    schemaPath: schemaPath.replace('#', 'schema'),
    value: instancePath ? getValueAtPath(data, instancePath) : undefined
  };
}

/**
 * Get value at specific path in object
 * @param {Object} obj - Object to traverse
 * @param {string} path - Path string (e.g., '/scenario_flow/phases/0')
 * @returns {any} Value at path
 */
function getValueAtPath(obj, path) {
  if (!path || path === '/') return obj;
  
  const parts = path.split('/').filter(p => p);
  let current = obj;
  
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  
  return current;
}

/**
 * Group errors by field path for better organization
 * @param {Array} errors - Array of formatted errors
 * @returns {Object} Errors grouped by field
 */
export function groupErrorsByField(errors) {
  const grouped = {};
  
  for (const error of errors) {
    const key = error.field || 'root';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(error);
  }
  
  return grouped;
}

/**
 * Create validation summary
 * @param {boolean} valid - Whether validation passed
 * @param {Array} errors - Array of validation errors
 * @param {Object} data - The validated data
 * @returns {Object} Validation summary
 */
export function createValidationSummary(valid, errors, data) {
  const summary = {
    valid,
    errorCount: errors ? errors.length : 0,
    timestamp: new Date().toISOString(),
    scenarioName: data?.name || 'unknown',
    version: data?.version || 'unknown'
  };
  
  if (errors && errors.length > 0) {
    summary.errors = errors;
    summary.errorsByField = groupErrorsByField(errors);
    summary.criticalErrors = errors.filter(e => 
      e.keyword === 'required' || e.keyword === 'type'
    );
    summary.warnings = errors.filter(e => 
      e.keyword === 'minLength' || e.keyword === 'pattern'
    );
  }
  
  return summary;
}

/**
 * Main validation function
 * @param {string|Object} yamlPathOrData - Path to YAML file or parsed data
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with errors
 */
export function validateScenario(yamlPathOrData, options = {}) {
  const {
    schemaPath = null,
    customRules = [],
    strict = true
  } = options;
  
  try {
    // Parse YAML if path provided
    let data;
    let sourcePath;
    
    if (typeof yamlPathOrData === 'string') {
      sourcePath = yamlPathOrData;
      data = parseYamlFile(yamlPathOrData);
    } else {
      data = yamlPathOrData;
      sourcePath = 'memory';
    }
    
    // Load schema and create validator
    const schema = loadSchema(schemaPath);
    const validate = createValidator(schema, { strict });
    
    // Run validation
    const valid = validate(data);
    
    // Format errors if validation failed
    let formattedErrors = [];
    if (!valid && validate.errors) {
      formattedErrors = validate.errors.map(err => 
        formatValidationError(err, data)
      );
    }
    
    // Apply custom validation rules
    if (customRules.length > 0) {
      const customErrors = runCustomValidations(data, customRules);
      formattedErrors = formattedErrors.concat(customErrors);
    }
    
    // Create comprehensive summary
    const summary = createValidationSummary(
      valid && formattedErrors.length === 0,
      formattedErrors,
      data
    );
    
    return {
      ...summary,
      sourcePath,
      data: valid ? data : null
    };
    
  } catch (error) {
    return {
      valid: false,
      errorCount: 1,
      timestamp: new Date().toISOString(),
      errors: [{
        field: 'file',
        message: error.message,
        suggestion: 'Check that the file exists and is valid YAML',
        fatal: true
      }],
      sourcePath: typeof yamlPathOrData === 'string' ? yamlPathOrData : 'memory'
    };
  }
}

/**
 * Run custom validation rules
 * @param {Object} data - Scenario data
 * @param {Array} rules - Array of custom validation functions
 * @returns {Array} Custom validation errors
 */
function runCustomValidations(data, rules) {
  const errors = [];
  
  for (const rule of rules) {
    try {
      const result = rule(data);
      if (!result.valid) {
        errors.push({
          field: result.field || 'custom',
          message: result.message,
          suggestion: result.suggestion || '',
          keyword: 'custom',
          custom: true
        });
      }
    } catch (error) {
      errors.push({
        field: 'custom',
        message: `Custom validation error: ${error.message}`,
        suggestion: 'Check custom validation rules',
        keyword: 'custom',
        custom: true
      });
    }
  }
  
  return errors;
}

/**
 * Validate multiple scenarios
 * @param {Array} yamlPaths - Array of YAML file paths
 * @param {Object} options - Validation options
 * @returns {Object} Batch validation results
 */
export function validateBatch(yamlPaths, options = {}) {
  const results = {
    total: yamlPaths.length,
    valid: 0,
    invalid: 0,
    scenarios: []
  };
  
  for (const yamlPath of yamlPaths) {
    const result = validateScenario(yamlPath, options);
    
    if (result.valid) {
      results.valid++;
    } else {
      results.invalid++;
    }
    
    results.scenarios.push({
      path: yamlPath,
      name: result.scenarioName,
      valid: result.valid,
      errorCount: result.errorCount,
      errors: result.errors
    });
  }
  
  return results;
}

/**
 * Check if scenarios directory exists and is accessible
 * @param {string} scenariosDir - Path to scenarios directory
 * @returns {Object} Status information
 */
export function checkScenariosDirectory(scenariosDir = '~/.claude/scenarios') {
  const expandedPath = scenariosDir.replace('~', process.env.HOME);
  
  const status = {
    path: expandedPath,
    exists: false,
    accessible: false,
    writable: false,
    files: []
  };
  
  try {
    if (fs.existsSync(expandedPath)) {
      status.exists = true;
      
      // Check access
      fs.accessSync(expandedPath, fs.constants.R_OK);
      status.accessible = true;
      
      // Check writable
      try {
        fs.accessSync(expandedPath, fs.constants.W_OK);
        status.writable = true;
      } catch (e) {
        // Not writable
      }
      
      // List YAML files
      const files = fs.readdirSync(expandedPath);
      status.files = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
    }
  } catch (error) {
    status.error = error.message;
  }
  
  return status;
}

/**
 * Create custom validation rule
 * @param {string} name - Rule name
 * @param {Function} validator - Validation function
 * @returns {Function} Custom rule function
 */
export function createCustomRule(name, validator) {
  return (data) => {
    try {
      return validator(data);
    } catch (error) {
      return {
        valid: false,
        field: name,
        message: `Custom rule '${name}' failed: ${error.message}`,
        suggestion: 'Check custom validation logic'
      };
    }
  };
}

// Export default validator instance
export default {
  validateScenario,
  validateBatch,
  parseYamlFile,
  loadSchema,
  createValidator,
  formatValidationError,
  groupErrorsByField,
  createValidationSummary,
  checkScenariosDirectory,
  createCustomRule,
  runCustomValidations
};

