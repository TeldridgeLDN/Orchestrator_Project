#!/usr/bin/env node

/**
 * PostToolUse Hook
 * 
 * Triggered after Claude uses a tool (file edit, terminal command, etc).
 * Use for post-processing, validation, or automated actions.
 * 
 * Integrations:
 * - DocumentationLifecycle: Enforces documentation framework rules
 * 
 * @param {Object} context - Hook context
 * @param {string} context.tool - Tool that was used
 * @param {Object} context.result - Tool execution result
 * @param {Object} context.project - Project information
 * @returns {Object} Additional actions or null
 */

import DocumentationLifecycle from './DocumentationLifecycle.js';

export default async function PostToolUse(context) {
  try {
    // Run Documentation Lifecycle hook (non-blocking)
    // Validates documentation files against framework rules
    await DocumentationLifecycle(context).catch(err => {
      console.warn('[PostToolUse] DocumentationLifecycle error:', err.message);
    });
    
    // Add other post-tool-use logic here as needed
    
    return null; // Return null for no additional actions
  } catch (error) {
    console.error('[PostToolUse] Hook error:', error);
    return null; // Non-blocking - don't fail tool operations
  }
}
