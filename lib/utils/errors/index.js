/**
 * Error Management System
 * 
 * Centralized error handling with:
 * - Standardized error codes
 * - Custom error classes
 * - User-friendly messaging
 * - Consistent logging
 * - Recovery mechanisms
 * 
 * @module utils/errors
 * @example
 * import { FileNotFoundError, handleError, displayError } from './utils/errors/index.js';
 * 
 * try {
 *   // operation
 * } catch (error) {
 *   throw new FileNotFoundError('/path/to/file');
 * }
 * 
 * // Or with automatic handling:
 * await handleError(error, {
 *   operation: 'myOperation',
 *   displayToUser: true,
 *   attemptRecovery: true
 * });
 */

// Export everything from error-codes
export * from './error-codes.js';

// Export everything from custom-errors
export * from './custom-errors.js';

// Export everything from error-handler
export * from './error-handler.js';

// Export everything from recovery
export * from './recovery.js';

// Re-export specific items for convenience
import { ERROR_CODES, getErrorDefinition } from './error-codes.js';
import {
  BaseError,
  FileNotFoundError,
  PermissionError,
  ValidationError,
  ConfigurationError,
  ProjectNotFoundError,
  ScenarioNotFoundError,
  wrapError,
  createError
} from './custom-errors.js';
import {
  handleError,
  displayError,
  getUserFriendlyMessage,
  configureErrorHandler,
  createCommandErrorHandler,
  createHookErrorHandler,
  withErrorHandling
} from './error-handler.js';

export default {
  // Common error codes
  ERROR_CODES,
  getErrorDefinition,
  
  // Common error classes
  BaseError,
  FileNotFoundError,
  PermissionError,
  ValidationError,
  ConfigurationError,
  ProjectNotFoundError,
  ScenarioNotFoundError,
  
  // Error creation and wrapping
  wrapError,
  createError,
  
  // Error handling
  handleError,
  displayError,
  getUserFriendlyMessage,
  configureErrorHandler,
  createCommandErrorHandler,
  createHookErrorHandler,
  withErrorHandling
};

