#!/usr/bin/env node

/**
 * Model Selection Store
 * 
 * Manages persistent storage of intelligent model selection configuration
 * that TaskMaster MCP server can read to automatically switch models.
 * 
 * Storage Location: .taskmaster/model-selection.json
 * 
 * Used by:
 * - Orchestrator startup (writes config)
 * - TaskMaster MCP via environment variables (reads config)
 */

import fs from 'fs';
import path from 'path';

/**
 * Get the model selection storage path
 */
export function getModelSelectionPath(projectRoot) {
  return path.join(projectRoot, '.taskmaster', 'model-selection.json');
}

/**
 * Save model selection configuration
 * This is called during orchestrator startup
 */
export function saveModelSelection(projectRoot, modelSelection) {
  const storePath = getModelSelectionPath(projectRoot);
  
  // Ensure .taskmaster directory exists
  const taskmasterDir = path.dirname(storePath);
  if (!fs.existsSync(taskmasterDir)) {
    fs.mkdirSync(taskmasterDir, { recursive: true });
  }
  
  // Create storage object with metadata
  const storage = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    generatedBy: 'orchestrator-startup',
    modelSelection
  };
  
  fs.writeFileSync(storePath, JSON.stringify(storage, null, 2));
  
  return storePath;
}

/**
 * Load model selection configuration
 * This can be called by TaskMaster to read the config
 */
export function loadModelSelection(projectRoot) {
  const storePath = getModelSelectionPath(projectRoot);
  
  if (!fs.existsSync(storePath)) {
    return null;
  }
  
  try {
    const data = fs.readFileSync(storePath, 'utf8');
    const storage = JSON.parse(data);
    return storage.modelSelection;
  } catch (error) {
    console.error('Error loading model selection:', error.message);
    return null;
  }
}

/**
 * Convert model selection to environment variables
 * This format can be injected into TaskMaster MCP server
 */
export function modelSelectionToEnv(modelSelection) {
  if (!modelSelection) {
    return {};
  }
  
  const env = {};
  
  // Export tier-to-model mappings
  if (modelSelection.models) {
    // Simple operations model
    if (modelSelection.models.simple) {
      env.TASKMASTER_SIMPLE_PROVIDER = modelSelection.models.simple.provider;
      env.TASKMASTER_SIMPLE_MODEL = modelSelection.models.simple.modelId;
    }
    
    // Medium operations model
    if (modelSelection.models.medium) {
      env.TASKMASTER_MEDIUM_PROVIDER = modelSelection.models.medium.provider;
      env.TASKMASTER_MEDIUM_MODEL = modelSelection.models.medium.modelId;
    }
    
    // Complex operations model
    if (modelSelection.models.complex) {
      env.TASKMASTER_COMPLEX_PROVIDER = modelSelection.models.complex.provider;
      env.TASKMASTER_COMPLEX_MODEL = modelSelection.models.complex.modelId;
    }
    
    // Research operations model
    if (modelSelection.models.research) {
      env.TASKMASTER_RESEARCH_PROVIDER = modelSelection.models.research.provider;
      env.TASKMASTER_RESEARCH_MODEL = modelSelection.models.research.modelId;
    }
  }
  
  // Export tier definitions (as JSON string)
  if (modelSelection.tiers) {
    env.TASKMASTER_OPERATION_TIERS = JSON.stringify(modelSelection.tiers);
  }
  
  // Enable intelligent model selection flag
  env.TASKMASTER_INTELLIGENT_SELECTION = 'true';
  
  return env;
}

/**
 * Generate MCP configuration with model selection
 * This creates the mcp.json env block with intelligent model selection
 */
export function generateMCPConfig(projectRoot, modelSelection) {
  const baseEnv = {
    ANTHROPIC_API_KEY: '${ANTHROPIC_API_KEY}',
    PERPLEXITY_API_KEY: '${PERPLEXITY_API_KEY}',
    OPENAI_API_KEY: '${OPENAI_API_KEY}',
    GOOGLE_API_KEY: '${GOOGLE_API_KEY}',
    XAI_API_KEY: '${XAI_API_KEY}',
    OPENROUTER_API_KEY: '${OPENROUTER_API_KEY}',
    MISTRAL_API_KEY: '${MISTRAL_API_KEY}',
    AZURE_OPENAI_API_KEY: '${AZURE_OPENAI_API_KEY}',
    OLLAMA_API_KEY: '${OLLAMA_API_KEY}'
  };
  
  // Add model selection environment variables
  const modelEnv = modelSelectionToEnv(modelSelection);
  
  return {
    ...baseEnv,
    ...modelEnv
  };
}

/**
 * Update MCP configuration file with model selection
 */
export function updateMCPConfigFile(projectRoot, modelSelection, mcpPath = '.cursor/mcp.json') {
  const fullPath = path.join(projectRoot, mcpPath);
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`MCP config not found: ${fullPath}`);
    return false;
  }
  
  try {
    // Read existing config
    const configData = fs.readFileSync(fullPath, 'utf8');
    const config = JSON.parse(configData);
    
    // Update task-master-ai server env
    if (config.mcpServers && config.mcpServers['task-master-ai']) {
      const newEnv = generateMCPConfig(projectRoot, modelSelection);
      config.mcpServers['task-master-ai'].env = newEnv;
      
      // Update metadata
      if (!config.mcpServers['task-master-ai'].metadata) {
        config.mcpServers['task-master-ai'].metadata = {};
      }
      config.mcpServers['task-master-ai'].metadata.intelligentModelSelection = true;
      config.mcpServers['task-master-ai'].metadata.lastUpdated = new Date().toISOString();
      
      // Write back
      fs.writeFileSync(fullPath, JSON.stringify(config, null, '\t'));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating MCP config: ${error.message}`);
    return false;
  }
}

/**
 * Update all MCP configuration files (Cursor, Windsurf, Kilo, etc.)
 */
export function updateAllMCPConfigs(projectRoot, modelSelection) {
  const mcpPaths = [
    '.cursor/mcp.json',
    '.windsurf/mcp.json',
    '.kilo/mcp.json',
    '.roo/mcp.json'
  ];
  
  const results = [];
  
  for (const mcpPath of mcpPaths) {
    const fullPath = path.join(projectRoot, mcpPath);
    if (fs.existsSync(fullPath)) {
      const success = updateMCPConfigFile(projectRoot, modelSelection, mcpPath);
      results.push({ path: mcpPath, success });
    }
  }
  
  return results;
}

export default {
  getModelSelectionPath,
  saveModelSelection,
  loadModelSelection,
  modelSelectionToEnv,
  generateMCPConfig,
  updateMCPConfigFile,
  updateAllMCPConfigs
};

