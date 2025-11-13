/**
 * Custom Error Classes
 * 
 * Provides typed error classes for different error categories.
 * Each error class includes error code, user-friendly messages, and metadata.
 * 
 * @module utils/errors/custom-errors
 */

import { getErrorDefinition } from './error-codes.js';

/**
 * Base error class for all application errors
 * Extends native Error with additional metadata
 */
export class BaseError extends Error {
  /**
   * Create a BaseError
   * @param {string} code - Error code from error-codes.js
   * @param {Object} context - Context data for message interpolation
   * @param {Error} originalError - Original error if wrapping another error
   */
  constructor(code, context = {}, originalError = null) {
    const definition = getErrorDefinition(code);
    
    if (!definition) {
      throw new Error(`Invalid error code: ${code}`);
    }

    // Interpolate message with context
    const message = interpolateMessage(definition.message, context);
    super(message);

    this.name = this.constructor.name;
    this.code = code;
    this.userMessage = interpolateMessage(definition.userMessage, context);
    this.severity = definition.severity;
    this.recoverable = definition.recoverable;
    this.category = definition.category;
    this.component = definition.component;
    this.context = context;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);

    // Include original error stack if available
    if (originalError && originalError.stack) {
      this.stack += '\n\nCaused by:\n' + originalError.stack;
    }
  }

  /**
   * Get formatted error message for display
   * @param {boolean} includeCode - Include error code in message
   * @returns {string}
   */
  getDisplayMessage(includeCode = true) {
    if (includeCode) {
      return `[${this.code}] ${this.userMessage}`;
    }
    return this.userMessage;
  }

  /**
   * Get error as plain object
   * @param {boolean} includeStack - Include stack trace
   * @returns {Object}
   */
  toJSON(includeStack = false) {
    const obj = {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      recoverable: this.recoverable,
      category: this.category,
      component: this.component,
      context: this.context,
      timestamp: this.timestamp
    };

    if (includeStack) {
      obj.stack = this.stack;
    }

    if (this.originalError) {
      obj.originalError = {
        name: this.originalError.name,
        message: this.originalError.message
      };
    }

    return obj;
  }
}

// ==================== Operational Errors (Recoverable) ====================

/**
 * File system related errors
 */
export class FileSystemError extends BaseError {
  constructor(code, context = {}, originalError = null) {
    super(code, context, originalError);
    this.name = 'FileSystemError';
  }
}

/**
 * File not found error (ENOENT)
 */
export class FileNotFoundError extends FileSystemError {
  constructor(filePath, originalError = null) {
    super('UTIL-FS-001', { path: filePath }, originalError);
    this.name = 'FileNotFoundError';
    this.filePath = filePath;
  }
}

/**
 * Permission denied error (EACCES)
 */
export class PermissionError extends FileSystemError {
  constructor(filePath, originalError = null) {
    super('UTIL-FS-002', { path: filePath }, originalError);
    this.name = 'PermissionError';
    this.filePath = filePath;
  }
}

/**
 * Disk full error (ENOSPC)
 */
export class DiskFullError extends FileSystemError {
  constructor(filePath, originalError = null) {
    super('UTIL-FS-003', { path: filePath }, originalError);
    this.name = 'DiskFullError';
    this.filePath = filePath;
  }
}

/**
 * Network related errors
 */
export class NetworkError extends BaseError {
  constructor(code, context = {}, originalError = null) {
    super(code, context, originalError);
    this.name = 'NetworkError';
  }
}

/**
 * Connection error
 */
export class ConnectionError extends NetworkError {
  constructor(details, originalError = null) {
    super('NET-CONN-001', { details }, originalError);
    this.name = 'ConnectionError';
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends NetworkError {
  constructor(url, originalError = null) {
    super('NET-TIMEOUT-001', { url }, originalError);
    this.name = 'TimeoutError';
    this.url = url;
  }
}

/**
 * Validation errors
 */
export class ValidationError extends BaseError {
  constructor(code, context = {}, originalError = null) {
    super(code, context, originalError);
    this.name = 'ValidationError';
  }
}

/**
 * Schema validation error
 */
export class SchemaValidationError extends ValidationError {
  constructor(details, originalError = null) {
    super('UTIL-DATA-003', { details }, originalError);
    this.name = 'SchemaValidationError';
  }
}

/**
 * YAML parse error
 */
export class YAMLParseError extends ValidationError {
  constructor(details, originalError = null) {
    super('UTIL-DATA-002', { details }, originalError);
    this.name = 'YAMLParseError';
  }
}

/**
 * JSON parse error
 */
export class JSONParseError extends ValidationError {
  constructor(details, originalError = null) {
    super('UTIL-DATA-001', { details }, originalError);
    this.name = 'JSONParseError';
  }
}

/**
 * Configuration validation error
 */
export class ConfigValidationError extends ValidationError {
  constructor(details, originalError = null) {
    super('UTIL-CFG-001', { details }, originalError);
    this.name = 'ConfigValidationError';
  }
}

// ==================== Business Logic Errors (User-facing) ====================

/**
 * Project not found error
 */
export class ProjectNotFoundError extends BaseError {
  constructor(projectName, originalError = null) {
    super('CMD-PROJ-001', { name: projectName }, originalError);
    this.name = 'ProjectNotFoundError';
    this.projectName = projectName;
  }
}

/**
 * Scenario not found error
 */
export class ScenarioNotFoundError extends BaseError {
  constructor(scenarioName, originalError = null) {
    super('CMD-SCEN-001', { name: scenarioName }, originalError);
    this.name = 'ScenarioNotFoundError';
    this.scenarioName = scenarioName;
  }
}

/**
 * Resource already exists error
 */
export class ResourceExistsError extends BaseError {
  constructor(code, context = {}, originalError = null) {
    super(code, context, originalError);
    this.name = 'ResourceExistsError';
  }
}

/**
 * Invalid operation error
 */
export class InvalidOperationError extends BaseError {
  constructor(code, context = {}, originalError = null) {
    super(code, context, originalError);
    this.name = 'InvalidOperationError';
  }
}

/**
 * Insufficient requirements error (diet103)
 */
export class InsufficientRequirementsError extends BaseError {
  constructor(score, minimum = 85, originalError = null) {
    super('CMD-PROJ-003', { score, minimum }, originalError);
    this.name = 'InsufficientRequirementsError';
    this.score = score;
    this.minimum = minimum;
  }
}

// ==================== System Errors (Infrastructure) ====================

/**
 * Initialization error
 */
export class InitializationError extends BaseError {
  constructor(component, originalError = null) {
    super('INIT-EXEC-001', { component }, originalError);
    this.name = 'InitializationError';
    this.component = component;
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends BaseError {
  constructor(code, context = {}, originalError = null) {
    super(code, context, originalError);
    this.name = 'ConfigurationError';
  }
}

/**
 * Dependency error
 */
export class DependencyError extends BaseError {
  constructor(dependency, originalError = null) {
    super('INIT-DEP-001', { dependency }, originalError);
    this.name = 'DependencyError';
    this.dependency = dependency;
  }
}

/**
 * Hook execution error
 */
export class HookExecutionError extends BaseError {
  constructor(hookName, originalError = null) {
    super('HOOK-EXEC-001', { hookName }, originalError);
    this.name = 'HookExecutionError';
    this.hookName = hookName;
  }
}

/**
 * Rollback error
 */
export class RollbackError extends BaseError {
  constructor(operation, originalError = null) {
    super('UTIL-RB-002', { operation }, originalError);
    this.name = 'RollbackError';
    this.operation = operation;
  }
}

// ==================== Helper Functions ====================

/**
 * Interpolate message template with context values
 * @param {string} template - Message template with {placeholders}
 * @param {Object} context - Context values
 * @returns {string} Interpolated message
 */
function interpolateMessage(template, context) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return context[key] !== undefined ? context[key] : match;
  });
}

/**
 * Wrap a native error with appropriate custom error type
 * @param {Error} error - Native error
 * @param {string} defaultCode - Default error code if cannot be determined
 * @param {Object} context - Additional context
 * @returns {BaseError}
 */
export function wrapError(error, defaultCode = 'GEN-UNKNOWN-001', context = {}) {
  // Already a custom error
  if (error instanceof BaseError) {
    return error;
  }

  // Try to map native errors to custom errors
  if (error.code === 'ENOENT') {
    return new FileNotFoundError(context.path || error.path || 'unknown', error);
  }

  if (error.code === 'EACCES' || error.code === 'EPERM') {
    return new PermissionError(context.path || error.path || 'unknown', error);
  }

  if (error.code === 'ENOSPC') {
    return new DiskFullError(context.path || error.path || 'unknown', error);
  }

  if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    return new JSONParseError(error.message, error);
  }

  if (error.name === 'YAMLException') {
    return new YAMLParseError(error.message, error);
  }

  // Default: wrap in BaseError with provided code
  return new BaseError(defaultCode, { details: error.message }, error);
}

/**
 * Check if error is recoverable
 * @param {Error} error - Error to check
 * @returns {boolean}
 */
export function isRecoverable(error) {
  return error instanceof BaseError && error.recoverable;
}

/**
 * Get error severity
 * @param {Error} error - Error to check
 * @returns {string} Severity level (error, warning, info)
 */
export function getErrorSeverity(error) {
  if (error instanceof BaseError) {
    return error.severity;
  }
  return 'error'; // Default for non-custom errors
}

/**
 * Create error from code
 * @param {string} code - Error code
 * @param {Object} context - Context for interpolation
 * @param {Error} originalError - Original error if wrapping
 * @returns {BaseError}
 */
export function createError(code, context = {}, originalError = null) {
  // Map specific codes to specific error classes
  const errorMap = {
    'UTIL-FS-001': (ctx, orig) => new FileNotFoundError(ctx.path, orig),
    'UTIL-FS-002': (ctx, orig) => new PermissionError(ctx.path, orig),
    'UTIL-FS-003': (ctx, orig) => new DiskFullError(ctx.path, orig),
    'CMD-PROJ-001': (ctx, orig) => new ProjectNotFoundError(ctx.name, orig),
    'CMD-SCEN-001': (ctx, orig) => new ScenarioNotFoundError(ctx.name, orig),
    'CMD-PROJ-003': (ctx, orig) => new InsufficientRequirementsError(ctx.score, ctx.minimum, orig),
    'INIT-EXEC-001': (ctx, orig) => new InitializationError(ctx.component, orig),
    'INIT-DEP-001': (ctx, orig) => new DependencyError(ctx.dependency, orig),
    'HOOK-EXEC-001': (ctx, orig) => new HookExecutionError(ctx.hookName, orig),
    'UTIL-RB-002': (ctx, orig) => new RollbackError(ctx.operation, orig),
    'UTIL-DATA-001': (ctx, orig) => new JSONParseError(ctx.details, orig),
    'UTIL-DATA-002': (ctx, orig) => new YAMLParseError(ctx.details, orig),
    'UTIL-DATA-003': (ctx, orig) => new SchemaValidationError(ctx.details, orig),
    'UTIL-CFG-001': (ctx, orig) => new ConfigValidationError(ctx.details, orig),
    'NET-CONN-001': (ctx, orig) => new ConnectionError(ctx.details, orig),
    'NET-TIMEOUT-001': (ctx, orig) => new TimeoutError(ctx.url, orig)
  };

  const creator = errorMap[code];
  if (creator) {
    return creator(context, originalError);
  }

  // Default: create BaseError
  return new BaseError(code, context, originalError);
}

export default {
  // Base
  BaseError,
  
  // Operational
  FileSystemError,
  FileNotFoundError,
  PermissionError,
  DiskFullError,
  NetworkError,
  ConnectionError,
  TimeoutError,
  ValidationError,
  SchemaValidationError,
  YAMLParseError,
  JSONParseError,
  ConfigValidationError,
  
  // Business Logic
  ProjectNotFoundError,
  ScenarioNotFoundError,
  ResourceExistsError,
  InvalidOperationError,
  InsufficientRequirementsError,
  
  // System
  InitializationError,
  ConfigurationError,
  DependencyError,
  HookExecutionError,
  RollbackError,
  
  // Helpers
  wrapError,
  isRecoverable,
  getErrorSeverity,
  createError
};

