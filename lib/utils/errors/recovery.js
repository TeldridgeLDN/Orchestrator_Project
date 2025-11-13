/**
 * Error Recovery Mechanisms
 * 
 * Provides retry logic, exponential backoff, and recovery strategies
 * for transient and recoverable errors.
 * 
 * @module utils/errors/recovery
 */

import { getErrorDefinition, isRecoverable } from './error-codes.js';

/**
 * Retry configuration
 */
const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  jitter: true
};

/**
 * Calculate delay with exponential backoff
 * 
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {Object} config - Retry configuration
 * @returns {number} Delay in milliseconds
 */
function calculateBackoffDelay(attempt, config) {
  const { initialDelayMs, maxDelayMs, backoffMultiplier, jitter } = config;
  
  // Calculate exponential delay
  let delay = initialDelayMs * Math.pow(backoffMultiplier, attempt);
  
  // Cap at max delay
  delay = Math.min(delay, maxDelayMs);
  
  // Add jitter to prevent thundering herd
  if (jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }
  
  return Math.floor(delay);
}

/**
 * Sleep for specified milliseconds
 * 
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff
 * 
 * @param {Function} operation - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxAttempts - Maximum retry attempts
 * @param {number} options.initialDelayMs - Initial delay between retries
 * @param {number} options.maxDelayMs - Maximum delay between retries
 * @param {number} options.backoffMultiplier - Backoff multiplier
 * @param {boolean} options.jitter - Add jitter to delays
 * @param {Function} options.shouldRetry - Custom retry condition
 * @param {Function} options.onRetry - Callback before each retry
 * @returns {Promise<any>} Result of operation
 */
export async function retryWithBackoff(operation, options = {}) {
  const config = { ...DEFAULT_RETRY_CONFIG, ...options };
  const { maxAttempts, shouldRetry, onRetry } = config;
  
  let lastError;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      const isLastAttempt = attempt === maxAttempts - 1;
      if (isLastAttempt) {
        throw error;
      }
      
      // Custom retry condition
      if (shouldRetry && !shouldRetry(error, attempt)) {
        throw error;
      }
      
      // Default: only retry recoverable errors
      if (error.code && !isRecoverable(error)) {
        throw error;
      }
      
      // Calculate delay and wait
      const delay = calculateBackoffDelay(attempt, config);
      
      // Notify about retry
      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      }
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Retry a file system operation
 * 
 * @param {Function} operation - File system operation
 * @param {Object} options - Options
 * @returns {Promise<any>}
 */
export async function retryFileOperation(operation, options = {}) {
  return retryWithBackoff(operation, {
    maxAttempts: 3,
    initialDelayMs: 50,
    maxDelayMs: 1000,
    shouldRetry: (error) => {
      // Retry on EAGAIN, EBUSY, EMFILE (file descriptor issues)
      const retryableCodes = ['EAGAIN', 'EBUSY', 'EMFILE', 'ENOTCONN'];
      return retryableCodes.includes(error.code);
    },
    ...options
  });
}

/**
 * Retry a network operation
 * 
 * @param {Function} operation - Network operation
 * @param {Object} options - Options
 * @returns {Promise<any>}
 */
export async function retryNetworkOperation(operation, options = {}) {
  return retryWithBackoff(operation, {
    maxAttempts: 3,
    initialDelayMs: 200,
    maxDelayMs: 3000,
    shouldRetry: (error) => {
      // Retry on network errors
      const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'];
      return retryableCodes.includes(error.code) || 
             error.message?.includes('timeout') ||
             error.message?.includes('network');
    },
    ...options
  });
}

/**
 * Attempt to recover from an error
 * 
 * @param {Error} error - The error to recover from
 * @param {Object} context - Recovery context
 * @param {string} context.operation - Operation that failed
 * @param {Function} context.fallback - Fallback function
 * @param {any} context.defaultValue - Default value to return
 * @returns {Promise<Object>} Recovery result
 */
export async function attemptRecovery(error, context = {}) {
  const { operation, fallback, defaultValue } = context;
  
  // Check if error is recoverable
  if (!error.code || !isRecoverable(error)) {
    return {
      recovered: false,
      error,
      message: 'Error is not recoverable'
    };
  }
  
  const errorDef = getErrorDefinition(error.code);
  
  try {
    // Strategy 1: Execute fallback function
    if (fallback && typeof fallback === 'function') {
      const result = await fallback(error);
      return {
        recovered: true,
        result,
        strategy: 'fallback',
        message: `Recovered using fallback for ${operation || 'operation'}`
      };
    }
    
    // Strategy 2: Return default value
    if (defaultValue !== undefined) {
      return {
        recovered: true,
        result: defaultValue,
        strategy: 'default-value',
        message: `Using default value for ${operation || 'operation'}`
      };
    }
    
    // Strategy 3: Graceful degradation
    if (errorDef.severity === 'warning') {
      return {
        recovered: true,
        result: null,
        strategy: 'graceful-degradation',
        message: `Gracefully degraded ${operation || 'operation'}`
      };
    }
    
    // No recovery strategy available
    return {
      recovered: false,
      error,
      message: 'No recovery strategy available'
    };
    
  } catch (recoveryError) {
    return {
      recovered: false,
      error: recoveryError,
      message: `Recovery attempt failed: ${recoveryError.message}`
    };
  }
}

/**
 * Execute operation with automatic recovery
 * 
 * @param {Function} operation - Operation to execute
 * @param {Object} recoveryContext - Recovery context
 * @returns {Promise<Object>} Execution result
 */
export async function executeWithRecovery(operation, recoveryContext = {}) {
  const { 
    retry = false,
    retryConfig = {},
    ...context 
  } = recoveryContext;
  
  try {
    // Execute with or without retry
    const result = retry 
      ? await retryWithBackoff(operation, retryConfig)
      : await operation();
      
    return {
      success: true,
      result
    };
  } catch (error) {
    // Attempt recovery
    const recovery = await attemptRecovery(error, context);
    
    if (recovery.recovered) {
      return {
        success: true,
        result: recovery.result,
        recovered: true,
        recoveryStrategy: recovery.strategy,
        originalError: error
      };
    }
    
    // Recovery failed
    return {
      success: false,
      error,
      recoveryAttempted: true,
      recoveryMessage: recovery.message
    };
  }
}

/**
 * Create a resilient wrapper for an operation
 * 
 * @param {Function} operation - Operation to wrap
 * @param {Object} config - Configuration
 * @param {boolean} config.retry - Enable retry
 * @param {Object} config.retryConfig - Retry configuration
 * @param {Function} config.fallback - Fallback function
 * @param {any} config.defaultValue - Default value
 * @param {string} config.operation - Operation name
 * @returns {Function} Wrapped operation
 */
export function createResilientOperation(operation, config = {}) {
  return async function resilientOperation(...args) {
    return executeWithRecovery(
      () => operation(...args),
      config
    );
  };
}

/**
 * Graceful degradation wrapper
 * Executes operation but doesn't throw on failure
 * 
 * @param {Function} operation - Operation to execute
 * @param {Object} options - Options
 * @param {any} options.defaultValue - Value to return on failure
 * @param {Function} options.onError - Error callback
 * @returns {Promise<any>} Result or default value
 */
export async function withGracefulDegradation(operation, options = {}) {
  const { defaultValue = null, onError } = options;
  
  try {
    return await operation();
  } catch (error) {
    if (onError) {
      onError(error);
    }
    return defaultValue;
  }
}

/**
 * Circuit breaker pattern implementation
 * Prevents repeated attempts to an operation that's likely to fail
 */
export class CircuitBreaker {
  constructor(config = {}) {
    this.failureThreshold = config.failureThreshold || 5;
    this.resetTimeout = config.resetTimeout || 60000; // 1 minute
    this.state = 'closed'; // closed, open, half-open
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }
  
  async execute(operation) {
    // Check if circuit is open
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'half-open';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await operation();
      
      // Success
      if (this.state === 'half-open') {
        this.successCount++;
        if (this.successCount >= 2) {
          this.reset();
        }
      } else {
        this.failureCount = 0;
      }
      
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'open';
      }
      
      throw error;
    }
  }
  
  reset() {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }
  
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

/**
 * Timeout wrapper for operations
 * 
 * @param {Function} operation - Operation to execute
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} operationName - Operation name for error message
 * @returns {Promise<any>}
 */
export async function withTimeout(operation, timeoutMs, operationName = 'operation') {
  return Promise.race([
    operation(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

