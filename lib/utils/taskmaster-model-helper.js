#!/usr/bin/env node

/**
 * TaskMaster Model Selection Helper
 * 
 * This utility helps TaskMaster read the intelligent model selection
 * configuration and apply it to operations.
 * 
 * Can be used by:
 * - TaskMaster MCP server (reads env vars)
 * - TaskMaster CLI (reads model-selection.json)
 * - External integrations
 */

import { loadModelSelection } from './model-selection-store.js';

/**
 * Determine which model tier an operation belongs to
 */
export function getOperationTier(operation, tiers) {
  if (!tiers) return 'medium'; // Default fallback
  
  // Check each tier
  for (const [tier, operations] of Object.entries(tiers)) {
    if (operations.includes(operation)) {
      return tier;
    }
  }
  
  // Check if operation has a flag (e.g., "expand-task --research")
  for (const [tier, operations] of Object.entries(tiers)) {
    for (const op of operations) {
      if (op.includes('--') && operation.includes(op.split(' --')[0])) {
        // Check if the flag matches
        const flags = op.split(' --').slice(1);
        const hasMatchingFlag = flags.some(flag => operation.includes(`--${flag}`));
        if (hasMatchingFlag) {
          return tier;
        }
      }
    }
  }
  
  return 'medium'; // Default fallback
}

/**
 * Get the appropriate model for an operation
 */
export function getModelForOperation(operation, modelSelection) {
  if (!modelSelection) {
    return null;
  }
  
  const tier = getOperationTier(operation, modelSelection.tiers);
  return modelSelection.models[tier] || modelSelection.models.medium;
}

/**
 * Read model selection from environment variables
 * This is used by TaskMaster MCP server
 */
export function readModelSelectionFromEnv() {
  const simple = process.env.TASKMASTER_SIMPLE_PROVIDER && process.env.TASKMASTER_SIMPLE_MODEL
    ? { provider: process.env.TASKMASTER_SIMPLE_PROVIDER, modelId: process.env.TASKMASTER_SIMPLE_MODEL }
    : null;
    
  const medium = process.env.TASKMASTER_MEDIUM_PROVIDER && process.env.TASKMASTER_MEDIUM_MODEL
    ? { provider: process.env.TASKMASTER_MEDIUM_PROVIDER, modelId: process.env.TASKMASTER_MEDIUM_MODEL }
    : null;
    
  const complex = process.env.TASKMASTER_COMPLEX_PROVIDER && process.env.TASKMASTER_COMPLEX_MODEL
    ? { provider: process.env.TASKMASTER_COMPLEX_PROVIDER, modelId: process.env.TASKMASTER_COMPLEX_MODEL }
    : null;
    
  const research = process.env.TASKMASTER_RESEARCH_PROVIDER && process.env.TASKMASTER_RESEARCH_MODEL
    ? { provider: process.env.TASKMASTER_RESEARCH_PROVIDER, modelId: process.env.TASKMASTER_RESEARCH_MODEL }
    : null;
  
  const tiersJson = process.env.TASKMASTER_OPERATION_TIERS;
  const tiers = tiersJson ? JSON.parse(tiersJson) : null;
  
  const enabled = process.env.TASKMASTER_INTELLIGENT_SELECTION === 'true';
  
  if (!enabled || !simple || !medium || !complex || !research || !tiers) {
    return null;
  }
  
  return {
    models: { simple, medium, complex, research },
    tiers,
    source: 'environment'
  };
}

/**
 * Read model selection from file system
 * This is used by TaskMaster CLI
 */
export function readModelSelectionFromFile(projectRoot) {
  const selection = loadModelSelection(projectRoot);
  if (selection) {
    selection.source = 'file';
  }
  return selection;
}

/**
 * Get model selection from best available source
 */
export function getModelSelection(projectRoot = null) {
  // Try environment variables first (faster, used by MCP)
  const envSelection = readModelSelectionFromEnv();
  if (envSelection) {
    return envSelection;
  }
  
  // Fall back to file system (used by CLI)
  if (projectRoot) {
    return readModelSelectionFromFile(projectRoot);
  }
  
  return null;
}

/**
 * Apply model override to TaskMaster config
 * This modifies the config object that TaskMaster will use
 */
export function applyModelOverride(taskmasterConfig, operation, modelSelection) {
  if (!modelSelection) {
    return taskmasterConfig;
  }
  
  const model = getModelForOperation(operation, modelSelection);
  if (!model) {
    return taskmasterConfig;
  }
  
  // Override the model configuration
  const tier = getOperationTier(operation, modelSelection.tiers);
  const role = tier === 'research' ? 'research' : 'main';
  
  taskmasterConfig.models = taskmasterConfig.models || {};
  taskmasterConfig.models[role] = {
    provider: model.provider,
    modelId: model.modelId
  };
  
  return taskmasterConfig;
}

/**
 * CLI tool to test model selection
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const operation = args[0];
  const projectRoot = args[1] || process.cwd();
  
  if (!operation) {
    console.log('Usage: taskmaster-model-helper.js <operation> [projectRoot]');
    console.log('');
    console.log('Examples:');
    console.log('  taskmaster-model-helper.js parse-prd');
    console.log('  taskmaster-model-helper.js update-subtask');
    console.log('  taskmaster-model-helper.js "expand-task --research"');
    process.exit(1);
  }
  
  const selection = getModelSelection(projectRoot);
  
  if (!selection) {
    console.log('❌ No model selection found');
    console.log('   Run orchestrator startup to initialize model selection');
    process.exit(1);
  }
  
  console.log('✅ Model Selection Loaded');
  console.log(`   Source: ${selection.source}`);
  console.log('');
  
  const tier = getOperationTier(operation, selection.tiers);
  const model = getModelForOperation(operation, selection);
  
  console.log(`Operation: ${operation}`);
  console.log(`Tier: ${tier}`);
  console.log(`Model: ${model.provider}/${model.modelId}`);
  console.log('');
  
  // Show all tier operations
  console.log('Available Tiers:');
  for (const [tierName, operations] of Object.entries(selection.tiers)) {
    const tierModel = selection.models[tierName];
    console.log(`  ${tierName}: ${tierModel.provider}/${tierModel.modelId}`);
    console.log(`    Operations: ${operations.join(', ')}`);
  }
}

export default {
  getOperationTier,
  getModelForOperation,
  readModelSelectionFromEnv,
  readModelSelectionFromFile,
  getModelSelection,
  applyModelOverride
};

