#!/usr/bin/env node

/**
 * UserPromptSubmit Hook
 * 
 * Triggered when user submits a prompt to Claude.
 * Use for pre-processing, context injection, or prompt augmentation.
 * 
 * @param {Object} context - Hook context
 * @param {string} context.prompt - User's submitted prompt
 * @param {Object} context.project - Project information
 * @returns {Object} Modified context or null to proceed unchanged
 */

export default async function UserPromptSubmit(context) {
  // Your hook logic here
  
  return null; // Return null to proceed without modifications
}
