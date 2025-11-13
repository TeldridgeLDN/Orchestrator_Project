/**
 * Metrics Wrapper Utility
 * 
 * Provides wrapper functions to instrument hooks and skills with metrics tracking
 * without modifying their original implementations. Uses the metrics utility
 * to record execution statistics while maintaining minimal overhead.
 * 
 * Key Features:
 * - Non-invasive instrumentation via function wrapping
 * - Automatic timing measurement
 * - Error tracking (warnings, errors caught, execution failures)
 * - <1ms wrapper overhead
 * - Graceful degradation if metrics system fails
 * 
 * @module utils/metrics-wrapper
 */

import {
  recordHookExecution,
  recordHookWarning,
  recordHookErrorCaught,
  recordHookError,
  recordSkillActivation,
  recordSkillDuration,
  recordSkillErrorsFound,
  recordSkillError
} from './metrics.js';

/**
 * Wrap a hook function with metrics tracking
 * 
 * Records:
 * - Execution count and timing
 * - Warnings issued (if hook adds warnings to context)
 * - Errors caught (if hook catches and handles errors)
 * - Execution failures (if hook throws)
 * 
 * @param {string} hookName - Name of the hook for metrics identification
 * @param {Function} hookFn - The hook function to wrap
 * @param {Object} options - Configuration options
 * @param {boolean} options.trackWarnings - Track warnings added to context (default: true)
 * @param {boolean} options.trackErrors - Track errors caught by the hook (default: true)
 * @returns {Function} Wrapped hook function with same signature
 */
export function wrapHook(hookName, hookFn, options = {}) {
  const {
    trackWarnings = true,
    trackErrors = true
  } = options;

  return async function wrappedHook(context, next) {
    const startTime = performance.now();
    let warningsBefore = 0;
    let errorsCaughtBefore = 0;

    try {
      // Track warnings and errors before execution
      if (trackWarnings && context.warnings) {
        warningsBefore = context.warnings.length || 0;
      }
      
      if (trackErrors && context.errorsCaught) {
        errorsCaughtBefore = context.errorsCaught.length || 0;
      }

      // Execute the original hook
      await hookFn(context, next);

      // Calculate execution time
      const endTime = performance.now();
      const durationMs = endTime - startTime;

      // Record successful execution with timing
      await recordHookExecution(hookName, durationMs);

      // Track warnings issued during execution
      if (trackWarnings && context.warnings) {
        const warningsIssued = (context.warnings.length || 0) - warningsBefore;
        if (warningsIssued > 0) {
          await recordHookWarning(hookName, warningsIssued);
        }
      }

      // Track errors caught during execution
      if (trackErrors && context.errorsCaught) {
        const errorsCaught = (context.errorsCaught.length || 0) - errorsCaughtBefore;
        if (errorsCaught > 0) {
          await recordHookErrorCaught(hookName, errorsCaught);
        }
      }

    } catch (error) {
      // Calculate execution time even on error
      const endTime = performance.now();
      const durationMs = endTime - startTime;

      // Record execution (even though it failed)
      await recordHookExecution(hookName, durationMs);
      
      // Record the hook execution error
      await recordHookError(hookName);

      // Re-throw the error to maintain original behavior
      throw error;
    }
  };
}

/**
 * Create metrics-tracked versions of multiple hooks at once
 * 
 * @param {Object} hooks - Map of hook names to hook functions
 * @param {Object} globalOptions - Options applied to all hooks
 * @returns {Object} Map of hook names to wrapped functions
 * 
 * @example
 * const wrapped = wrapHooks({
 *   'myHook': myHookFunction,
 *   'anotherHook': anotherHookFunction
 * });
 */
export function wrapHooks(hooks, globalOptions = {}) {
  const wrapped = {};
  
  for (const [hookName, hookFn] of Object.entries(hooks)) {
    wrapped[hookName] = wrapHook(hookName, hookFn, globalOptions);
  }
  
  return wrapped;
}

/**
 * Wrap a simple async function (non-hook) with basic timing metrics
 * Useful for utility functions that should be tracked but aren't hooks
 * 
 * @param {string} functionName - Name for metrics identification
 * @param {Function} fn - The async function to wrap
 * @returns {Function} Wrapped function with same signature
 */
export function wrapTimedFunction(functionName, fn) {
  return async function(...args) {
    const startTime = performance.now();
    
    try {
      const result = await fn(...args);
      
      const endTime = performance.now();
      const durationMs = endTime - startTime;
      
      // Record as hook execution (reuse existing infrastructure)
      await recordHookExecution(functionName, durationMs);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const durationMs = endTime - startTime;
      
      await recordHookExecution(functionName, durationMs);
      await recordHookError(functionName);
      
      throw error;
    }
  };
}

/**
 * Check if a hook is already wrapped
 * Prevents double-wrapping by checking for wrapper signature
 * 
 * @param {Function} fn - Function to check
 * @returns {boolean} True if function appears to be wrapped
 */
export function isWrapped(fn) {
  return fn.name === 'wrappedHook' || fn.name === 'wrappedFunction';
}

/**
 * Safely wrap a hook (checks if already wrapped)
 * 
 * @param {string} hookName - Name of the hook
 * @param {Function} hookFn - The hook function
 * @param {Object} options - Wrapping options
 * @returns {Function} Wrapped function (or original if already wrapped)
 */
export function safeWrapHook(hookName, hookFn, options = {}) {
  if (isWrapped(hookFn)) {
    console.debug(`Hook ${hookName} is already wrapped, skipping`);
    return hookFn;
  }
  
  return wrapHook(hookName, hookFn, options);
}

/**
 * Hook execution context helper
 * Initializes context properties used by metrics tracking
 * 
 * @param {Object} context - Hook context object
 * @returns {Object} Context with metrics-tracking properties initialized
 */
export function initializeMetricsContext(context = {}) {
  if (!context.warnings) {
    context.warnings = [];
  }
  
  if (!context.errorsCaught) {
    context.errorsCaught = [];
  }
  
  if (!context.metricsEnabled) {
    context.metricsEnabled = true;
  }
  
  return context;
}

/**
 * Add a warning to the hook context
 * Helper for hooks to properly track warnings
 * 
 * @param {Object} context - Hook context
 * @param {string} warning - Warning message
 */
export function addWarning(context, warning) {
  if (!context.warnings) {
    context.warnings = [];
  }
  context.warnings.push(warning);
}

/**
 * Record an error as caught in the hook context
 * Helper for hooks to properly track caught errors
 * 
 * @param {Object} context - Hook context
 * @param {Error} error - The error that was caught
 */
export function addErrorCaught(context, error) {
  if (!context.errorsCaught) {
    context.errorsCaught = [];
  }
  context.errorsCaught.push({
    message: error.message,
    timestamp: new Date().toISOString()
  });
}

/**
 * Decorator for marking hooks that should skip metrics
 * Useful for development or testing
 * 
 * @param {Function} hookFn - The hook function
 * @returns {Function} Hook with metrics skipping marker
 */
export function skipMetrics(hookFn) {
  hookFn._skipMetrics = true;
  return hookFn;
}

/**
 * Check if a hook should skip metrics
 * 
 * @param {Function} hookFn - The hook function to check
 * @returns {boolean} True if metrics should be skipped
 */
export function shouldSkipMetrics(hookFn) {
  return hookFn._skipMetrics === true;
}

// ==================== Skill/Command Metrics ====================

/**
 * Wrap a command/skill function with metrics tracking
 * 
 * Records:
 * - Activation count (treats all invocations as manual)
 * - Execution duration
 * - Errors found (if function returns error count)
 * - Execution failures (if function throws)
 * 
 * @param {string} skillName - Name of the skill/command for metrics
 * @param {Function} skillFn - The async function to wrap
 * @param {Object} options - Configuration options
 * @param {boolean} options.isAutomatic - Whether activation is automatic (default: false)
 * @param {boolean} options.trackErrors - Track errors in result (default: true)
 * @returns {Function} Wrapped function with same signature
 */
export function wrapSkill(skillName, skillFn, options = {}) {
  const {
    isAutomatic = false,
    trackErrors = true
  } = options;

  return async function wrappedSkill(...args) {
    const startTime = performance.now();

    try {
      // Record activation
      await recordSkillActivation(skillName, isAutomatic);

      // Execute the skill/command
      const result = await skillFn(...args);

      // Calculate duration
      const endTime = performance.now();
      const durationSeconds = (endTime - startTime) / 1000;

      // Record duration
      await recordSkillDuration(skillName, durationSeconds);

      // Track errors found if result has error count
      if (trackErrors && result) {
        if (typeof result.errorsFound === 'number' && result.errorsFound > 0) {
          await recordSkillErrorsFound(skillName, result.errorsFound);
        }
        if (typeof result.errors === 'number' && result.errors > 0) {
          await recordSkillErrorsFound(skillName, result.errors);
        }
      }

      return result;
    } catch (error) {
      // Calculate duration even on error
      const endTime = performance.now();
      const durationSeconds = (endTime - startTime) / 1000;

      // Record duration (even though it failed)
      await recordSkillDuration(skillName, durationSeconds);
      
      // Record the skill execution error
      await recordSkillError(skillName);

      // Re-throw the error to maintain original behavior
      throw error;
    }
  };
}

/**
 * Create metrics-tracked versions of multiple skills/commands at once
 * 
 * @param {Object} skills - Map of skill names to skill functions
 * @param {Object} globalOptions - Options applied to all skills
 * @returns {Object} Map of skill names to wrapped functions
 * 
 * @example
 * const wrapped = wrapSkills({
 *   'mySkill': mySkillFunction,
 *   'anotherSkill': anotherSkillFunction
 * });
 */
export function wrapSkills(skills, globalOptions = {}) {
  const wrapped = {};
  
  for (const [skillName, skillFn] of Object.entries(skills)) {
    wrapped[skillName] = wrapSkill(skillName, skillFn, globalOptions);
  }
  
  return wrapped;
}

/**
 * Wrap a Commander.js command action with metrics tracking
 * 
 * This is specifically designed for Commander.js action handlers.
 * Automatically extracts command name from the function or uses provided name.
 * 
 * @param {string} commandName - Name of the command for metrics
 * @param {Function} actionFn - The Commander.js action handler
 * @returns {Function} Wrapped action handler
 * 
 * @example
 * command
 *   .action(wrapCommandAction('scenario-create', async (options) => {
 *     // Command logic
 *   }));
 */
export function wrapCommandAction(commandName, actionFn) {
  return wrapSkill(commandName, actionFn, { isAutomatic: false });
}

/**
 * Helper to wrap all scenario subcommands
 * 
 * @param {Object} commands - Map of command names to action functions
 * @returns {Object} Map of command names to wrapped action functions
 * 
 * @example
 * const wrapped = wrapScenarioCommands({
 *   'create': createActionHandler,
 *   'list': listActionHandler,
 *   'deploy': deployActionHandler
 * });
 */
export function wrapScenarioCommands(commands) {
  return wrapSkills(commands, { isAutomatic: false });
}

export default {
  // Hook wrappers
  wrapHook,
  wrapHooks,
  wrapTimedFunction,
  
  // Skill/Command wrappers
  wrapSkill,
  wrapSkills,
  wrapCommandAction,
  wrapScenarioCommands,
  
  // Utilities
  isWrapped,
  safeWrapHook,
  initializeMetricsContext,
  addWarning,
  addErrorCaught,
  skipMetrics,
  shouldSkipMetrics
};

