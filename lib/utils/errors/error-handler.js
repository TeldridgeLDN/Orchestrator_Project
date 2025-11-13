/**
 * Error Handler Utility
 * 
 * Centralized error handling with consistent logging, user messaging,
 * and recovery mechanisms.
 * 
 * @module utils/errors/error-handler
 */

import chalk from 'chalk';
import { BaseError, wrapError, isRecoverable, getErrorSeverity } from './custom-errors.js';
import { getLogger } from '../logger.js';
import { attemptRecovery, retryWithBackoff } from './recovery.js';

/**
 * Error handler configuration
 */
const config = {
  verbose: false,
  exitOnError: false, // Set to true for CLI commands that should exit
  logToFile: false,
  includeErrorCodes: true,
  includeStack: false, // Only show stack in verbose mode
};

/**
 * Configure error handler
 * @param {Object} options - Configuration options
 */
export function configureErrorHandler(options = {}) {
  Object.assign(config, options);
}

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @returns {string} User-friendly message
 */
export function getUserFriendlyMessage(error) {
  if (error instanceof BaseError) {
    return error.getDisplayMessage(config.includeErrorCodes);
  }
  
  // Fallback for non-custom errors
  return error.message || 'An unexpected error occurred';
}

/**
 * Display error to user
 * @param {Error} error - Error to display
 * @param {Object} options - Display options
 */
export function displayError(error, options = {}) {
  const {
    prefix = '✗',
    verbose = config.verbose,
    exitCode = null
  } = options;

  // Ensure error is wrapped
  const wrappedError = error instanceof BaseError ? error : wrapError(error);
  
  // Get severity and color
  const severity = wrappedError.severity || 'error';
  const color = getSeverityColor(severity);
  const icon = getSeverityIcon(severity);

  // Display user message
  const userMessage = getUserFriendlyMessage(wrappedError);
  console.error(chalk[color](`\n${icon} ${prefix}:`), userMessage);

  // Display error code if enabled
  if (config.includeErrorCodes && wrappedError.code) {
    console.error(chalk.dim(`   Code: ${wrappedError.code}`));
  }

  // Display technical details in verbose mode
  if (verbose) {
    console.error(chalk.dim('\n   Technical Details:'));
    console.error(chalk.dim(`   ${wrappedError.message}`));
    
    if (wrappedError.context && Object.keys(wrappedError.context).length > 0) {
      console.error(chalk.dim('   Context:'), wrappedError.context);
    }

    if (config.includeStack || verbose) {
      console.error(chalk.dim('\n   Stack Trace:'));
      console.error(chalk.dim(wrappedError.stack));
    }
  }

  console.error(''); // Empty line for spacing

  // Exit if configured
  if (exitCode !== null) {
    process.exit(exitCode);
  }

  if (config.exitOnError && severity === 'error') {
    process.exit(1);
  }
}

/**
 * Handle error with logging and optional recovery
 * @param {Error} error - Error to handle
 * @param {Object} options - Handling options
 * @returns {Promise<any>} Result of recovery or null
 */
export async function handleError(error, options = {}) {
  const {
    context = {},
    operation = 'operation',
    displayToUser = true,
    attemptRecovery = true,
    recoveryFn = null,
    verbose = config.verbose
  } = options;

  // Wrap error if needed
  const wrappedError = error instanceof BaseError 
    ? error 
    : wrapError(error, 'GEN-UNKNOWN-001', context);

  // Log error (for debugging/monitoring)
  logError(wrappedError, { operation, verbose });

  // Display to user if configured
  if (displayToUser) {
    displayError(wrappedError, { verbose });
  }

  // Attempt recovery for recoverable errors
  if (attemptRecovery && isRecoverable(wrappedError)) {
    try {
      if (verbose) {
        console.log(chalk.yellow('⟳ Attempting recovery...'));
      }
      
      // Use provided recovery function or attempt automatic recovery
      const recovery = recoveryFn 
        ? await recoveryFn(wrappedError)
        : await attemptRecovery(wrappedError, context);
      
      if (recovery.recovered || (typeof recovery !== 'object' && recovery !== null)) {
        if (verbose) {
          console.log(chalk.green(`✓ Recovery successful${recovery.strategy ? ` (${recovery.strategy})` : ''}\n`));
        }
        return recovery.result !== undefined ? recovery.result : recovery;
      } else if (verbose) {
        console.log(chalk.yellow(`⚠ Recovery not possible: ${recovery.message || 'No recovery strategy available'}\n`));
      }
    } catch (recoveryError) {
      if (verbose) {
        console.error(chalk.red('✗ Recovery failed\n'));
      }
      logError(recoveryError, { operation: 'recovery', verbose });
    }
  }

  return null;
}

/**
 * Log error for debugging
 * @param {Error} error - Error to log
 * @param {Object} options - Logging options
 */
function logError(error, options = {}) {
  const { operation = 'operation', verbose = false } = options;
  
  const wrappedError = error instanceof BaseError ? error : wrapError(error);
  const logger = getLogger();
  
  // Create structured log data
  const logData = {
    operation,
    errorCode: wrappedError.code,
    errorType: wrappedError.constructor.name,
    severity: wrappedError.severity,
    recoverable: wrappedError.recoverable,
    context: wrappedError.context
  };

  // Log with appropriate level based on severity
  if (wrappedError.severity === 'fatal' || wrappedError.severity === 'error') {
    logger.error(
      wrappedError.message,
      wrappedError,
      logData
    );
  } else if (wrappedError.severity === 'warning') {
    logger.warn(
      wrappedError.message,
      logData
    );
  } else {
    logger.info(
      wrappedError.message,
      logData
    );
  }
}

/**
 * Wrap async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {Object} options - Error handling options
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn, options = {}) {
  return async function(...args) {
    try {
      return await fn(...args);
    } catch (error) {
      await handleError(error, options);
      
      // Re-throw if not configured to exit
      if (!config.exitOnError && options.exitCode === undefined) {
        throw error;
      }
    }
  };
}

/**
 * Wrap sync function with error handling
 * @param {Function} fn - Function to wrap
 * @param {Object} options - Error handling options
 * @returns {Function} Wrapped function
 */
export function withErrorHandlingSync(fn, options = {}) {
  return function(...args) {
    try {
      return fn(...args);
    } catch (error) {
      // Handle error synchronously
      const wrappedError = error instanceof BaseError ? error : wrapError(error);
      
      if (options.displayToUser !== false) {
        displayError(wrappedError, options);
      }
      
      logError(wrappedError, { operation: options.operation || 'operation' });
      
      if (options.exitCode !== undefined) {
        process.exit(options.exitCode);
      }
      
      throw error;
    }
  };
}

/**
 * Create a command error handler
 * Configured for CLI commands that should display errors and exit
 * @param {Object} options - Command-specific options
 * @returns {Function} Error handler function
 */
export function createCommandErrorHandler(options = {}) {
  const {
    commandName = 'command',
    verbose = false,
    exitCode = 1
  } = options;

  return async (error) => {
    await handleError(error, {
      operation: commandName,
      displayToUser: true,
      attemptRecovery: false,
      verbose
    });

    process.exit(exitCode);
  };
}

/**
 * Create a hook error handler
 * Configured for hooks that should log but not block execution
 * @param {string} hookName - Name of the hook
 * @param {Object} options - Hook-specific options
 * @returns {Function} Error handler function
 */
export function createHookErrorHandler(hookName, options = {}) {
  const { verbose = false } = options;

  return async (error) => {
    await handleError(error, {
      operation: `hook:${hookName}`,
      displayToUser: false, // Hooks shouldn't display to user
      attemptRecovery: false,
      verbose
    });

    // Hooks don't throw - return null to indicate failure
    return null;
  };
}

/**
 * Safely execute operation with error handling
 * @param {Function} operation - Operation to execute
 * @param {Object} options - Error handling options
 * @returns {Promise<{success: boolean, result?: any, error?: Error}>}
 */
export async function safeExecute(operation, options = {}) {
  try {
    const result = await operation();
    return { success: true, result };
  } catch (error) {
    await handleError(error, {
      ...options,
      displayToUser: false // Caller decides whether to display
    });
    
    return { success: false, error };
  }
}

/**
 * Execute operation with automatic retry for recoverable errors
 * @param {Function} operation - Operation to execute
 * @param {Object} options - Options
 * @param {number} options.maxAttempts - Maximum retry attempts
 * @param {number} options.initialDelayMs - Initial delay between retries
 * @param {boolean} options.verbose - Show retry attempts
 * @param {Function} options.onRetry - Callback before each retry
 * @returns {Promise<{success: boolean, result?: any, error?: Error, attempts?: number}>}
 */
export async function executeWithRetry(operation, options = {}) {
  const {
    maxAttempts = 3,
    initialDelayMs = 100,
    verbose = false,
    onRetry,
    ...otherOptions
  } = options;
  
  try {
    const result = await retryWithBackoff(operation, {
      maxAttempts,
      initialDelayMs,
      onRetry: (error, attempt, delay) => {
        if (verbose) {
          console.log(chalk.yellow(`⟳ Retry attempt ${attempt}/${maxAttempts} (delay: ${delay}ms)`));
        }
        if (onRetry) {
          onRetry(error, attempt, delay);
        }
      }
    });
    
    return { success: true, result };
  } catch (error) {
    await handleError(error, {
      ...otherOptions,
      displayToUser: false,
      attemptRecovery: true
    });
    
    return { success: false, error, attempts: maxAttempts };
  }
}

// ==================== Helper Functions ====================

/**
 * Get color for severity level
 * @param {string} severity - Severity level
 * @returns {string} Chalk color
 */
function getSeverityColor(severity) {
  const colors = {
    error: 'red',
    warning: 'yellow',
    info: 'blue'
  };
  return colors[severity] || 'red';
}

/**
 * Get icon for severity level
 * @param {string} severity - Severity level
 * @returns {string} Icon
 */
function getSeverityIcon(severity) {
  const icons = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  return icons[severity] || '❌';
}

/**
 * Format error for logging
 * @param {Error} error - Error to format
 * @param {boolean} includeStack - Include stack trace
 * @returns {string} Formatted error
 */
export function formatErrorForLog(error, includeStack = false) {
  const wrappedError = error instanceof BaseError ? error : wrapError(error);
  
  let formatted = `[${wrappedError.code}] ${wrappedError.message}`;
  
  if (wrappedError.context && Object.keys(wrappedError.context).length > 0) {
    formatted += `\nContext: ${JSON.stringify(wrappedError.context)}`;
  }
  
  if (includeStack && wrappedError.stack) {
    formatted += `\nStack: ${wrappedError.stack}`;
  }
  
  return formatted;
}

/**
 * Check if error should trigger immediate exit
 * @param {Error} error - Error to check
 * @returns {boolean}
 */
export function shouldExitImmediately(error) {
  if (!(error instanceof BaseError)) {
    return false;
  }

  // Exit on critical errors
  const criticalCodes = [
    'INIT-EXEC-001', // Initialization failure
    'INIT-DEP-001',  // Missing dependency
    'UTIL-FS-003'    // Disk full
  ];

  return criticalCodes.includes(error.code);
}

export default {
  configureErrorHandler,
  getUserFriendlyMessage,
  displayError,
  handleError,
  withErrorHandling,
  withErrorHandlingSync,
  createCommandErrorHandler,
  createHookErrorHandler,
  safeExecute,
  formatErrorForLog,
  shouldExitImmediately
};

