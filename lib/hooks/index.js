/**
 * Hook Management System
 * 
 * Central registration and management for all hooks in the orchestrator.
 * Hooks are middleware functions that run at specific points in the
 * application lifecycle.
 * 
 * @module hooks/index
 * @version 1.0.0
 */

import { preConfigModification } from './configBackup.js';
import { 
  directoryDetectionHook, 
  promptDirectoryDetectionHook 
} from './directoryDetection.js';
import { postToolUseHook } from './postToolUse.js';
import { skillSuggestionsHook } from './skillSuggestions.js';
import { 
  postToolUseReviewHook, 
  userPromptReviewHook 
} from './taskmasterCriticalReview.js';
import { documentationLifecycle } from './documentationLifecycle.js';
import { sessionWrapUpHook } from './sessionWrapUp.js';
import { wrapHook } from '../utils/metrics-wrapper.js';

/**
 * Hook types and their execution points
 */
export const HookTypes = {
  PRE_CONFIG_MODIFICATION: 'preConfigModification',
  USER_PROMPT_SUBMIT: 'userPromptSubmit',
  POST_TOOL_USE: 'postToolUse',
  PRE_PROJECT_SWITCH: 'preProjectSwitch',
  POST_PROJECT_SWITCH: 'postProjectSwitch'
};

/**
 * Hook Manager Class
 * Manages registration and execution of hooks
 */
class HookManager {
  constructor() {
    this.hooks = new Map();
    
    // Initialize hook type arrays
    Object.values(HookTypes).forEach(type => {
      this.hooks.set(type, []);
    });
  }

  /**
   * Register a hook for a specific type
   * 
   * @param {string} type - Hook type from HookTypes
   * @param {Function} handler - Hook handler function
   * @param {Object} options - Hook options
   * @param {number} options.priority - Priority (lower = earlier, default: 50)
   * @param {string} options.name - Optional name for the hook
   * @returns {void}
   */
  register(type, handler, options = {}) {
    if (!this.hooks.has(type)) {
      throw new Error(`Unknown hook type: ${type}`);
    }

    const { priority = 50, name = 'anonymous' } = options;

    const hook = {
      type,
      handler,
      priority,
      name
    };

    const hooks = this.hooks.get(type);
    hooks.push(hook);

    // Sort by priority (lower = earlier)
    hooks.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Execute all hooks for a specific type
   * 
   * @param {string} type - Hook type from HookTypes
   * @param {Object} context - Context to pass to hooks
   * @returns {Promise<void>}
   */
  async execute(type, context = {}) {
    if (!this.hooks.has(type)) {
      throw new Error(`Unknown hook type: ${type}`);
    }

    const hooks = this.hooks.get(type);

    // Execute hooks in order with middleware pattern
    let index = 0;

    const next = async () => {
      if (index < hooks.length) {
        const hook = hooks[index++];
        await hook.handler(context, next);
      }
    };

    await next();
  }

  /**
   * Get all registered hooks for a type
   * 
   * @param {string} type - Hook type from HookTypes
   * @returns {Array} Array of hook objects
   */
  getHooks(type) {
    return this.hooks.get(type) || [];
  }

  /**
   * Clear all hooks for a type
   * 
   * @param {string} type - Hook type from HookTypes
   * @returns {void}
   */
  clear(type) {
    if (this.hooks.has(type)) {
      this.hooks.set(type, []);
    }
  }

  /**
   * Clear all hooks
   * 
   * @returns {void}
   */
  clearAll() {
    Object.values(HookTypes).forEach(type => {
      this.hooks.set(type, []);
    });
  }
}

// Create singleton instance
const hookManager = new HookManager();

/**
 * Register all built-in hooks (with automatic metrics tracking)
 * 
 * All hooks are automatically wrapped with metrics tracking to record:
 * - Execution counts and timing
 * - Warnings issued
 * - Errors caught
 * - Execution failures
 * 
 * @returns {void}
 */
export function registerBuiltInHooks() {
  // Config backup hook (highest priority)
  hookManager.register(
    HookTypes.PRE_CONFIG_MODIFICATION,
    wrapHook('configBackup', async (context, next) => {
      await preConfigModification();
      await next();
    }),
    { priority: 1, name: 'configBackup' }
  );

  // Directory detection hooks
  hookManager.register(
    HookTypes.USER_PROMPT_SUBMIT,
    wrapHook('directoryDetection', directoryDetectionHook),
    { priority: 20, name: 'directoryDetection' }
  );

  hookManager.register(
    HookTypes.USER_PROMPT_SUBMIT,
    wrapHook('promptDirectoryDetection', promptDirectoryDetectionHook),
    { priority: 10, name: 'promptDirectoryDetection' }
  );

  // Skill suggestions hook (runs after directory detection)
  hookManager.register(
    HookTypes.USER_PROMPT_SUBMIT,
    wrapHook('skillSuggestions', skillSuggestionsHook),
    { priority: 30, name: 'skillSuggestions' }
  );

  // PostToolUse hook for auto-reload detection
  hookManager.register(
    HookTypes.POST_TOOL_USE,
    wrapHook('postToolUseAutoReload', postToolUseHook),
    { priority: 50, name: 'postToolUseAutoReload' }
  );

  // Taskmaster Critical Review hooks
  hookManager.register(
    HookTypes.USER_PROMPT_SUBMIT,
    wrapHook('taskmasterCriticalReview', userPromptReviewHook),
    { priority: 35, name: 'taskmasterCriticalReview' }
  );

  hookManager.register(
    HookTypes.POST_TOOL_USE,
    wrapHook('taskmasterCriticalReviewMonitor', postToolUseReviewHook),
    { priority: 60, name: 'taskmasterCriticalReviewMonitor' }
  );

  // Documentation lifecycle tracking hook
  hookManager.register(
    HookTypes.POST_TOOL_USE,
    wrapHook('DocumentationLifecycle', documentationLifecycle),
    { priority: 45, name: 'DocumentationLifecycle' }
  );

  // Session wrap-up hook (detects session end and generates summary)
  hookManager.register(
    HookTypes.USER_PROMPT_SUBMIT,
    wrapHook('SessionWrapUp', sessionWrapUpHook),
    { priority: 5, name: 'SessionWrapUp' }  // Low priority = runs early
  );
}

/**
 * Initialize the hook system
 * Call this once on application startup
 * 
 * @returns {void}
 */
export function initializeHooks() {
  registerBuiltInHooks();
}

/**
 * Execute a specific hook type
 * Convenience function for executing hooks
 * 
 * @param {string} type - Hook type from HookTypes
 * @param {Object} context - Context to pass to hooks
 * @returns {Promise<void>}
 */
export async function executeHook(type, context = {}) {
  return hookManager.execute(type, context);
}

/**
 * Export the singleton hook manager instance
 */
export { hookManager };

/**
 * Export hook registration function for external use
 */
export function registerHook(type, handler, options) {
  hookManager.register(type, handler, options);
}

// Initialize hooks on module load
initializeHooks();

