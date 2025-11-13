#!/usr/bin/env node

/**
 * TaskMaster Initialization Module
 * 
 * Automatically verifies and initializes TaskMaster configuration on startup.
 * Ensures proper model configuration based on task complexity and operation types.
 * 
 * This module:
 * - Verifies .taskmaster/config.json exists and is valid
 * - Validates model configurations (main, research, fallback)
 * - Checks API key availability for configured providers
 * - Initializes intelligent model selection for appropriate tasks
 * - Validates state.json for tag management
 * - Performs health checks on TaskMaster infrastructure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  saveModelSelection, 
  updateAllMCPConfigs 
} from '../utils/model-selection-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Default model configuration for new projects
 */
const DEFAULT_MODEL_CONFIG = {
  models: {
    main: {
      provider: "anthropic",
      modelId: "claude-3-7-sonnet-20250219",
      maxTokens: 120000,
      temperature: 0.2
    },
    research: {
      provider: "perplexity",
      modelId: "sonar-pro",
      maxTokens: 8700,
      temperature: 0.1
    },
    fallback: {
      provider: "anthropic",
      modelId: "claude-3-5-haiku-20241022",
      maxTokens: 200000,
      temperature: 0.2
    }
  },
  global: {
    logLevel: "info",
    debug: false,
    defaultNumTasks: 10,
    defaultSubtasks: 5,
    defaultPriority: "medium",
    projectName: "Taskmaster",
    responseLanguage: "English",
    enableCodebaseAnalysis: true,
    defaultTag: "master"
  }
};

/**
 * Model tier assignments for intelligent switching
 * Based on INTELLIGENT_MODEL_SELECTION_PROPOSAL.md
 */
const OPERATION_TIERS = {
  // Tier 1: Simple operations → Use fallback (Haiku - faster, cheaper)
  simple: [
    'update-subtask',
    'set-status',
    'commit-message',
    'format',
    'validate-simple'
  ],
  
  // Tier 2: Medium complexity → Use main (Sonnet - balanced)
  medium: [
    'add-task',
    'update-task',
    'update',
    'add-subtask',
    'auto-repair',
    'health-check',
    'scope-up',
    'scope-down'
  ],
  
  // Tier 3: Complex reasoning → Use main (Sonnet 4 - best quality)
  complex: [
    'parse-prd',
    'expand-task',
    'expand-all',
    'analyze-complexity',
    'generate-tests',
    'architecture-planning'
  ],
  
  // Research operations → Use research (Perplexity - up-to-date data)
  research: [
    'research',
    'analyze-complexity --research',
    'expand-task --research',
    'add-task --research',
    'update-task --research'
  ]
};

/**
 * Get project root directory
 */
function getProjectRoot() {
  return path.resolve(__dirname, '../../');
}

/**
 * Check if .env or mcp.json has required API keys
 */
function checkApiKeys(projectRoot, config, verbose) {
  const issues = [];
  const providers = new Set();
  
  // Collect all providers in use
  if (config.models?.main) providers.add(config.models.main.provider);
  if (config.models?.research) providers.add(config.models.research.provider);
  if (config.models?.fallback) providers.add(config.models.fallback.provider);
  
  // Check for .env file
  const envPath = path.join(projectRoot, '.env');
  const hasEnv = fs.existsSync(envPath);
  
  // Check for MCP configuration files
  const mcpPaths = [
    '.cursor/mcp.json',
    '.kiro/mcp.json',
    '.windsurf/mcp.json',
    '.roo/mcp.json',
    '.kilo/mcp.json'
  ].map(p => path.join(projectRoot, p));
  
  const hasMcp = mcpPaths.some(p => fs.existsSync(p));
  
  if (!hasEnv && !hasMcp) {
    issues.push({
      type: 'warning',
      message: 'No .env or mcp.json found. API keys may not be configured.'
    });
  }
  
  // Provider-specific warnings
  const providerKeys = {
    'anthropic': 'ANTHROPIC_API_KEY',
    'perplexity': 'PERPLEXITY_API_KEY',
    'openai': 'OPENAI_API_KEY',
    'google': 'GOOGLE_API_KEY'
  };
  
  for (const provider of providers) {
    const keyName = providerKeys[provider];
    if (keyName && verbose) {
      issues.push({
        type: 'info',
        message: `Model '${provider}' requires ${keyName} to be configured`
      });
    }
  }
  
  return { hasKeys: hasEnv || hasMcp, issues };
}

/**
 * Verify config.json structure and content
 */
function verifyConfig(configPath, verbose) {
  const issues = [];
  
  if (!fs.existsSync(configPath)) {
    return {
      valid: false,
      issues: [{
        type: 'error',
        message: 'config.json not found'
      }],
      needsCreation: true
    };
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    // Check required sections
    if (!config.models) {
      issues.push({
        type: 'error',
        message: 'Missing "models" section in config'
      });
    } else {
      // Check required model roles
      const requiredRoles = ['main', 'research', 'fallback'];
      for (const role of requiredRoles) {
        if (!config.models[role]) {
          issues.push({
            type: 'warning',
            message: `Missing "${role}" model configuration`
          });
        } else {
          // Verify model structure
          const model = config.models[role];
          if (!model.provider) {
            issues.push({
              type: 'error',
              message: `Model "${role}" missing provider`
            });
          }
          if (!model.modelId) {
            issues.push({
              type: 'error',
              message: `Model "${role}" missing modelId`
            });
          }
        }
      }
    }
    
    if (!config.global) {
      issues.push({
        type: 'warning',
        message: 'Missing "global" section in config'
      });
    }
    
    return {
      valid: issues.filter(i => i.type === 'error').length === 0,
      issues,
      config,
      needsCreation: false
    };
    
  } catch (error) {
    return {
      valid: false,
      issues: [{
        type: 'error',
        message: `Invalid JSON in config.json: ${error.message}`
      }],
      needsCreation: false
    };
  }
}

/**
 * Verify state.json for tag management
 */
function verifyState(statePath, verbose) {
  if (!fs.existsSync(statePath)) {
    return {
      valid: true,
      issues: [{
        type: 'info',
        message: 'state.json will be created on first TaskMaster operation'
      }],
      needsCreation: true
    };
  }
  
  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    
    const issues = [];
    
    if (!state.currentTag) {
      issues.push({
        type: 'warning',
        message: 'No currentTag set in state.json, will default to "master"'
      });
    }
    
    return {
      valid: true,
      issues,
      state,
      needsCreation: false
    };
    
  } catch (error) {
    return {
      valid: false,
      issues: [{
        type: 'error',
        message: `Invalid JSON in state.json: ${error.message}`
      }]
    };
  }
}

/**
 * Create default config.json
 */
function createDefaultConfig(configPath, verbose) {
  try {
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(
      configPath,
      JSON.stringify(DEFAULT_MODEL_CONFIG, null, 2),
      'utf-8'
    );
    
    if (verbose) {
      console.log('   ✓ Created default config.json');
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Initialize intelligent model selection
 * Maps operations to appropriate model tiers and persists configuration
 */
function initializeModelSelection(projectRoot, config, verbose) {
  const selection = {
    tiers: OPERATION_TIERS,
    models: {
      simple: config.models.fallback,
      medium: config.models.main,
      complex: config.models.main,
      research: config.models.research
    }
  };
  
  if (verbose) {
    console.log('');
    console.log('📊 Model Selection Strategy:');
    console.log(`   Simple ops   → ${selection.models.simple.provider}/${selection.models.simple.modelId}`);
    console.log(`   Medium ops   → ${selection.models.medium.provider}/${selection.models.medium.modelId}`);
    console.log(`   Complex ops  → ${selection.models.complex.provider}/${selection.models.complex.modelId}`);
    console.log(`   Research ops → ${selection.models.research.provider}/${selection.models.research.modelId}`);
  }
  
  // Save model selection to persistent storage
  try {
    const storePath = saveModelSelection(projectRoot, selection);
    if (verbose) {
      console.log(`   ✓ Model selection saved: ${path.basename(storePath)}`);
    }
  } catch (error) {
    if (verbose) {
      console.log(`   ⚠ Could not save model selection: ${error.message}`);
    }
  }
  
  // Update MCP configuration files with model selection
  try {
    const results = updateAllMCPConfigs(projectRoot, selection);
    const updated = results.filter(r => r.success);
    if (verbose && updated.length > 0) {
      console.log(`   ✓ Updated ${updated.length} MCP config(s) with intelligent model selection`);
      updated.forEach(r => {
        console.log(`     • ${r.path}`);
      });
    }
  } catch (error) {
    if (verbose) {
      console.log(`   ⚠ Could not update MCP configs: ${error.message}`);
    }
  }
  
  return selection;
}

/**
 * Main initialization function
 */
export async function initializeTaskMaster(options = {}) {
  const projectRoot = options.projectRoot || getProjectRoot();
  const verbose = options.verbose !== false;
  
  if (verbose) {
    console.log('🔧 Initializing TaskMaster Configuration...');
    console.log(`   Project: ${path.basename(projectRoot)}`);
  }
  
  const results = {
    success: true,
    checks: [],
    modelSelection: null
  };
  
  // 1. Verify .taskmaster directory exists
  const taskmasterDir = path.join(projectRoot, '.taskmaster');
  if (!fs.existsSync(taskmasterDir)) {
    if (verbose) {
      console.log('   ℹ .taskmaster directory not found');
      console.log('   → TaskMaster not initialized yet');
      console.log('   → Run: task-master init');
    }
    results.success = false;
    results.reason = 'taskmaster_not_initialized';
    return results;
  }
  
  // 2. Verify config.json
  const configPath = path.join(taskmasterDir, 'config.json');
  const configCheck = verifyConfig(configPath, verbose);
  results.checks.push({ name: 'config.json', ...configCheck });
  
  if (configCheck.needsCreation) {
    if (verbose) {
      console.log('   ⚙️  Creating default config.json...');
    }
    const createResult = createDefaultConfig(configPath, verbose);
    if (!createResult.success) {
      results.success = false;
      results.error = createResult.error;
      return results;
    }
    // Re-verify after creation
    const newConfigCheck = verifyConfig(configPath, verbose);
    results.checks[results.checks.length - 1] = { name: 'config.json', ...newConfigCheck };
  }
  
  // Get final config
  const config = results.checks.find(c => c.name === 'config.json')?.config;
  
  // 3. Verify state.json
  const statePath = path.join(taskmasterDir, 'state.json');
  const stateCheck = verifyState(statePath, verbose);
  results.checks.push({ name: 'state.json', ...stateCheck });
  
  // 4. Check API keys (only if config is valid)
  if (config) {
    const keyCheck = checkApiKeys(projectRoot, config, verbose);
    results.checks.push({ name: 'api-keys', ...keyCheck });
    
    // 5. Initialize intelligent model selection (now with persistence)
    results.modelSelection = initializeModelSelection(projectRoot, config, verbose);
  }
  
  // 6. Report results
  const errors = results.checks.flatMap(c => c.issues?.filter(i => i.type === 'error') || []);
  const warnings = results.checks.flatMap(c => c.issues?.filter(i => i.type === 'warning') || []);
  
  // Set success to false if there are any errors
  if (errors.length > 0) {
    results.success = false;
  }
  
  if (verbose) {
    console.log('');
    
    if (errors.length > 0) {
      console.log('❌ Errors:');
      errors.forEach(e => console.log(`   • ${e.message}`));
    }
    
    if (warnings.length > 0) {
      console.log('⚠️  Warnings:');
      warnings.forEach(w => console.log(`   • ${w.message}`));
    }
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ TaskMaster configuration verified!');
    }
  }
  
  return results;
}

/**
 * CLI entry point
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const silent = args.includes('--silent') || args.includes('-s');
  
  initializeTaskMaster({ silent: !silent })
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Failed to initialize TaskMaster:', error.message);
      process.exit(1);
    });
}

export default initializeTaskMaster;

