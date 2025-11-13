/**
 * Error Code Registry
 * 
 * Centralized registry of all error codes used throughout the application.
 * Format: COMPONENT-CATEGORY-NUMBER
 * 
 * Components:
 * - CMD: Commands
 * - UTIL: Utilities
 * - HOOK: Hooks
 * - INIT: Initialization
 * - VAL: Validators
 * 
 * Categories:
 * - VAL: Validation
 * - FS: File System
 * - NET: Network
 * - CFG: Configuration
 * - EXEC: Execution
 * - DEP: Dependency
 * - AUTH: Authentication/Authorization
 * - DATA: Data processing
 * 
 * @module utils/errors/error-codes
 */

/**
 * Error code definitions
 * Each entry includes:
 * - code: Unique error identifier
 * - message: Technical error message template
 * - userMessage: User-friendly message template
 * - severity: error, warning, info
 * - recoverable: Whether automatic recovery is possible
 * - category: Error category
 * - component: Source component
 */
export const ERROR_CODES = {
  // ==================== Command Errors ====================
  
  // Validation Errors
  'CMD-VAL-001': {
    code: 'CMD-VAL-001',
    message: 'Invalid command arguments: {details}',
    userMessage: 'The command received invalid arguments. {details}',
    severity: 'error',
    recoverable: false,
    category: 'validation',
    component: 'commands'
  },
  
  'CMD-VAL-002': {
    code: 'CMD-VAL-002',
    message: 'Missing required argument: {argument}',
    userMessage: 'Required argument "{argument}" is missing. Please provide it and try again.',
    severity: 'error',
    recoverable: false,
    category: 'validation',
    component: 'commands'
  },
  
  'CMD-VAL-003': {
    code: 'CMD-VAL-003',
    message: 'Invalid option value: {option} = {value}',
    userMessage: 'The value "{value}" for option "{option}" is not valid.',
    severity: 'error',
    recoverable: false,
    category: 'validation',
    component: 'commands'
  },

  // Execution Errors
  'CMD-EXEC-001': {
    code: 'CMD-EXEC-001',
    message: 'Command execution failed: {command}',
    userMessage: 'Failed to execute command "{command}". Please check your input and try again.',
    severity: 'error',
    recoverable: false,
    category: 'execution',
    component: 'commands'
  },

  'CMD-EXEC-002': {
    code: 'CMD-EXEC-002',
    message: 'Command timeout: {command} exceeded {timeout}ms',
    userMessage: 'The command took too long to execute and was stopped. Please try again.',
    severity: 'error',
    recoverable: true,
    category: 'execution',
    component: 'commands'
  },

  // Scenario-specific
  'CMD-SCEN-001': {
    code: 'CMD-SCEN-001',
    message: 'Scenario not found: {name}',
    userMessage: 'Scenario "{name}" does not exist. Use "diet103 scenario list" to see available scenarios.',
    severity: 'error',
    recoverable: false,
    category: 'validation',
    component: 'commands'
  },

  'CMD-SCEN-002': {
    code: 'CMD-SCEN-002',
    message: 'Scenario already exists: {name}',
    userMessage: 'Scenario "{name}" already exists. Use a different name or remove the existing one first.',
    severity: 'error',
    recoverable: false,
    category: 'validation',
    component: 'commands'
  },

  'CMD-SCEN-003': {
    code: 'CMD-SCEN-003',
    message: 'Scenario deployment failed: {reason}',
    userMessage: 'Failed to deploy scenario: {reason}',
    severity: 'error',
    recoverable: false,
    category: 'execution',
    component: 'commands'
  },

  // Project/Registry
  'CMD-PROJ-001': {
    code: 'CMD-PROJ-001',
    message: 'Project not found: {name}',
    userMessage: 'Project "{name}" is not registered. Use "diet103 register" to add it.',
    severity: 'error',
    recoverable: false,
    category: 'validation',
    component: 'commands'
  },

  'CMD-PROJ-002': {
    code: 'CMD-PROJ-002',
    message: 'Project already registered: {name}',
    userMessage: 'Project "{name}" is already registered.',
    severity: 'error',
    recoverable: false,
    category: 'validation',
    component: 'commands'
  },

  'CMD-PROJ-003': {
    code: 'CMD-PROJ-003',
    message: 'Project does not meet diet103 requirements: {score}% (minimum: {minimum}%)',
    userMessage: 'Project infrastructure is incomplete ({score}%). Minimum required: {minimum}%.',
    severity: 'error',
    recoverable: false,
    category: 'validation',
    component: 'commands'
  },

  'CMD-PROJ-004': {
    code: 'CMD-PROJ-004',
    message: 'Cannot switch to project: {reason}',
    userMessage: 'Unable to switch projects: {reason}',
    severity: 'error',
    recoverable: false,
    category: 'execution',
    component: 'commands'
  },

  // Group Management
  'CMD-GROUP-001': {
    code: 'CMD-GROUP-001',
    message: 'Group already exists: {name}',
    userMessage: 'Group "{name}" already exists. Use a different name or delete the existing group first.',
    severity: 'error',
    recoverable: false,
    category: 'validation',
    component: 'commands'
  },

  'CMD-GROUP-002': {
    code: 'CMD-GROUP-002',
    message: 'Group not found: {name}',
    userMessage: 'Group "{name}" does not exist. Use "claude group list" to see available groups.',
    severity: 'error',
    recoverable: false,
    category: 'validation',
    component: 'commands'
  },

  'CMD-GROUP-003': {
    code: 'CMD-GROUP-003',
    message: 'Cannot delete group with projects: {name} has {count} project(s)',
    userMessage: 'Group "{name}" contains {count} project(s). Remove all projects first or use --force to delete anyway.',
    severity: 'error',
    recoverable: false,
    category: 'validation',
    component: 'commands'
  },

  'CMD-GROUP-004': {
    code: 'CMD-GROUP-004',
    message: 'Project already in group: {project} is in {group}',
    userMessage: 'Project "{project}" is already in group "{group}".',
    severity: 'error',
    recoverable: false,
    category: 'validation',
    component: 'commands'
  },

  'CMD-GROUP-005': {
    code: 'CMD-GROUP-005',
    message: 'Project not in group: {project} is not in {group}',
    userMessage: 'Project "{project}" is not in group "{group}".',
    severity: 'error',
    recoverable: false,
    category: 'validation',
    component: 'commands'
  },

  // ==================== Utility Errors ====================

  // File System Errors
  'UTIL-FS-001': {
    code: 'UTIL-FS-001',
    message: 'File not found: {path}',
    userMessage: 'File not found: {path}',
    severity: 'error',
    recoverable: false,
    category: 'filesystem',
    component: 'utils'
  },

  'UTIL-FS-002': {
    code: 'UTIL-FS-002',
    message: 'Permission denied: {path}',
    userMessage: 'Permission denied accessing: {path}. Check file permissions.',
    severity: 'error',
    recoverable: false,
    category: 'filesystem',
    component: 'utils'
  },

  'UTIL-FS-003': {
    code: 'UTIL-FS-003',
    message: 'Disk full: Cannot write to {path}',
    userMessage: 'Not enough disk space to complete the operation.',
    severity: 'error',
    recoverable: false,
    category: 'filesystem',
    component: 'utils'
  },

  'UTIL-FS-004': {
    code: 'UTIL-FS-004',
    message: 'Directory not found: {path}',
    userMessage: 'Directory not found: {path}',
    severity: 'error',
    recoverable: false,
    category: 'filesystem',
    component: 'utils'
  },

  'UTIL-FS-005': {
    code: 'UTIL-FS-005',
    message: 'Failed to create directory: {path}',
    userMessage: 'Failed to create directory: {path}. Check permissions.',
    severity: 'error',
    recoverable: false,
    category: 'filesystem',
    component: 'utils'
  },

  'UTIL-FS-006': {
    code: 'UTIL-FS-006',
    message: 'Failed to read file: {path}',
    userMessage: 'Failed to read file: {path}',
    severity: 'error',
    recoverable: true,
    category: 'filesystem',
    component: 'utils'
  },

  'UTIL-FS-007': {
    code: 'UTIL-FS-007',
    message: 'Failed to write file: {path}',
    userMessage: 'Failed to write file: {path}',
    severity: 'error',
    recoverable: true,
    category: 'filesystem',
    component: 'utils'
  },

  // Configuration Errors
  'UTIL-CFG-001': {
    code: 'UTIL-CFG-001',
    message: 'Invalid configuration: {details}',
    userMessage: 'Configuration is invalid: {details}',
    severity: 'error',
    recoverable: false,
    category: 'configuration',
    component: 'utils'
  },

  'UTIL-CFG-002': {
    code: 'UTIL-CFG-002',
    message: 'Missing required configuration field: {field}',
    userMessage: 'Configuration is missing required field: {field}',
    severity: 'error',
    recoverable: false,
    category: 'configuration',
    component: 'utils'
  },

  'UTIL-CFG-003': {
    code: 'UTIL-CFG-003',
    message: 'Failed to read configuration: {path}',
    userMessage: 'Failed to read configuration file. Using defaults.',
    severity: 'warning',
    recoverable: true,
    category: 'configuration',
    component: 'utils'
  },

  'UTIL-CFG-004': {
    code: 'UTIL-CFG-004',
    message: 'Failed to write configuration: {path}',
    userMessage: 'Failed to save configuration. Changes may not persist.',
    severity: 'error',
    recoverable: false,
    category: 'configuration',
    component: 'utils'
  },

  'UTIL-CFG-005': {
    code: 'UTIL-CFG-005',
    message: 'Configuration backup failed: {reason}',
    userMessage: 'Failed to create configuration backup: {reason}',
    severity: 'warning',
    recoverable: true,
    category: 'configuration',
    component: 'utils'
  },

  // Data Processing Errors
  'UTIL-DATA-001': {
    code: 'UTIL-DATA-001',
    message: 'Invalid JSON: {details}',
    userMessage: 'Failed to parse JSON data: {details}',
    severity: 'error',
    recoverable: false,
    category: 'data',
    component: 'utils'
  },

  'UTIL-DATA-002': {
    code: 'UTIL-DATA-002',
    message: 'Invalid YAML: {details}',
    userMessage: 'Failed to parse YAML data: {details}',
    severity: 'error',
    recoverable: false,
    category: 'data',
    component: 'utils'
  },

  'UTIL-DATA-003': {
    code: 'UTIL-DATA-003',
    message: 'Data validation failed: {details}',
    userMessage: 'Data validation failed: {details}',
    severity: 'error',
    recoverable: false,
    category: 'data',
    component: 'utils'
  },

  // Rollback Errors
  'UTIL-RB-001': {
    code: 'UTIL-RB-001',
    message: 'Rollback session not active',
    userMessage: 'Cannot perform operation: rollback session is not active.',
    severity: 'error',
    recoverable: false,
    category: 'execution',
    component: 'utils'
  },

  'UTIL-RB-002': {
    code: 'UTIL-RB-002',
    message: 'Rollback failed: {operation}',
    userMessage: 'Failed to rollback operation: {operation}',
    severity: 'error',
    recoverable: false,
    category: 'execution',
    component: 'utils'
  },

  'UTIL-RB-003': {
    code: 'UTIL-RB-003',
    message: 'Rollback partially succeeded: {successCount}/{totalCount} operations',
    userMessage: 'Rollback partially succeeded. {failureCount} operations could not be reversed.',
    severity: 'warning',
    recoverable: false,
    category: 'execution',
    component: 'utils'
  },

  // Metrics Errors
  'UTIL-MET-001': {
    code: 'UTIL-MET-001',
    message: 'Failed to record metrics: {details}',
    userMessage: 'Failed to record performance metrics (non-critical).',
    severity: 'warning',
    recoverable: true,
    category: 'execution',
    component: 'utils'
  },

  // ==================== Hook Errors ====================

  'HOOK-EXEC-001': {
    code: 'HOOK-EXEC-001',
    message: 'Hook execution failed: {hookName}',
    userMessage: 'An error occurred during hook execution: {hookName}',
    severity: 'warning',
    recoverable: true,
    category: 'execution',
    component: 'hooks'
  },

  'HOOK-EXEC-002': {
    code: 'HOOK-EXEC-002',
    message: 'Hook timeout: {hookName} exceeded {timeout}ms',
    userMessage: 'Hook {hookName} took too long and was stopped.',
    severity: 'warning',
    recoverable: true,
    category: 'execution',
    component: 'hooks'
  },

  'HOOK-VAL-001': {
    code: 'HOOK-VAL-001',
    message: 'Hook validation failed: {hookName} - {details}',
    userMessage: 'Hook validation failed: {details}',
    severity: 'error',
    recoverable: false,
    category: 'validation',
    component: 'hooks'
  },

  'HOOK-FS-001': {
    code: 'HOOK-FS-001',
    message: 'Hook failed to access file: {path}',
    userMessage: 'Hook could not access file: {path}',
    severity: 'warning',
    recoverable: true,
    category: 'filesystem',
    component: 'hooks'
  },

  // ==================== Initialization Errors ====================

  'INIT-EXEC-001': {
    code: 'INIT-EXEC-001',
    message: 'Initialization failed: {component}',
    userMessage: 'Failed to initialize {component}. The application may not work correctly.',
    severity: 'error',
    recoverable: false,
    category: 'execution',
    component: 'initialization'
  },

  'INIT-CFG-001': {
    code: 'INIT-CFG-001',
    message: 'Failed to initialize configuration',
    userMessage: 'Failed to initialize configuration. Using defaults.',
    severity: 'warning',
    recoverable: true,
    category: 'configuration',
    component: 'initialization'
  },

  'INIT-DEP-001': {
    code: 'INIT-DEP-001',
    message: 'Missing required dependency: {dependency}',
    userMessage: 'Required dependency "{dependency}" is missing. Please install it.',
    severity: 'error',
    recoverable: false,
    category: 'dependency',
    component: 'initialization'
  },

  // ==================== Validator Errors ====================

  'VAL-SCEN-001': {
    code: 'VAL-SCEN-001',
    message: 'Scenario validation failed: {details}',
    userMessage: 'Scenario validation failed: {details}',
    severity: 'error',
    recoverable: false,
    category: 'validation',
    component: 'validators'
  },

  'VAL-DIET-001': {
    code: 'VAL-DIET-001',
    message: 'diet103 validation failed: {details}',
    userMessage: 'Project does not meet diet103 standards: {details}',
    severity: 'error',
    recoverable: false,
    category: 'validation',
    component: 'validators'
  },

  'VAL-UFC-001': {
    code: 'VAL-UFC-001',
    message: 'UFC validation failed: {details}',
    userMessage: 'Unified File Context validation failed: {details}',
    severity: 'error',
    recoverable: false,
    category: 'validation',
    component: 'validators'
  },

  // ==================== Network Errors ====================

  'NET-CONN-001': {
    code: 'NET-CONN-001',
    message: 'Network connection failed: {details}',
    userMessage: 'Failed to connect to network. Please check your connection.',
    severity: 'error',
    recoverable: true,
    category: 'network',
    component: 'network'
  },

  'NET-TIMEOUT-001': {
    code: 'NET-TIMEOUT-001',
    message: 'Network request timeout: {url}',
    userMessage: 'Network request timed out. Please try again.',
    severity: 'error',
    recoverable: true,
    category: 'network',
    component: 'network'
  },

  // ==================== Generic/Unknown Errors ====================

  'GEN-UNKNOWN-001': {
    code: 'GEN-UNKNOWN-001',
    message: 'Unknown error occurred: {details}',
    userMessage: 'An unexpected error occurred. Please try again.',
    severity: 'error',
    recoverable: false,
    category: 'unknown',
    component: 'general'
  }
};

/**
 * Get error definition by code
 * @param {string} code - Error code
 * @returns {Object|null} Error definition or null if not found
 */
export function getErrorDefinition(code) {
  return ERROR_CODES[code] || null;
}

/**
 * Check if error code exists
 * @param {string} code - Error code to check
 * @returns {boolean}
 */
export function isValidErrorCode(code) {
  return code in ERROR_CODES;
}

/**
 * Get all error codes for a component
 * @param {string} component - Component name (commands, utils, hooks, etc.)
 * @returns {Object[]} Array of error definitions
 */
export function getErrorsByComponent(component) {
  return Object.values(ERROR_CODES).filter(def => def.component === component);
}

/**
 * Get all error codes for a category
 * @param {string} category - Category name (validation, filesystem, etc.)
 * @returns {Object[]} Array of error definitions
 */
export function getErrorsByCategory(category) {
  return Object.values(ERROR_CODES).filter(def => def.category === category);
}

/**
 * Get all recoverable errors
 * @returns {Object[]} Array of error definitions
 */
export function getRecoverableErrors() {
  return Object.values(ERROR_CODES).filter(def => def.recoverable);
}

/**
 * Check if an error code is recoverable
 * @param {string} code - Error code
 * @returns {boolean} True if recoverable
 */
export function isRecoverable(code) {
  const def = ERROR_CODES[code];
  return def ? def.recoverable : false;
}

/**
 * Get error statistics
 * @returns {Object} Statistics about error codes
 */
export function getErrorStatistics() {
  const codes = Object.values(ERROR_CODES);
  
  return {
    total: codes.length,
    byComponent: codes.reduce((acc, def) => {
      acc[def.component] = (acc[def.component] || 0) + 1;
      return acc;
    }, {}),
    byCategory: codes.reduce((acc, def) => {
      acc[def.category] = (acc[def.category] || 0) + 1;
      return acc;
    }, {}),
    bySeverity: codes.reduce((acc, def) => {
      acc[def.severity] = (acc[def.severity] || 0) + 1;
      return acc;
    }, {}),
    recoverable: codes.filter(def => def.recoverable).length,
    nonRecoverable: codes.filter(def => !def.recoverable).length
  };
}

export default {
  ERROR_CODES,
  getErrorDefinition,
  isValidErrorCode,
  isRecoverable,
  getErrorsByComponent,
  getErrorsByCategory,
  getRecoverableErrors,
  getErrorStatistics
};

