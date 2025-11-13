#!/usr/bin/env node

/**
 * Orchestrator Startup Hooks
 * 
 * Automatically runs initialization routines when the orchestrator starts.
 * Ensures all systems are properly configured before operation.
 * 
 * Hooks:
 * - File Lifecycle Management initialization
 * - TaskMaster configuration verification and intelligent model selection
 * - MCP server health checks (future)
 * - Directory structure validation (future)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initializeFileLifecycle from './file_lifecycle_init.js';
import initializeTaskMaster from './taskmaster_init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get project root directory
 */
function getProjectRoot() {
  return path.resolve(__dirname, '../../');
}

/**
 * Check if we're in a valid orchestrator project
 */
function isOrchestratorProject(projectRoot) {
  const indicators = [
    '.taskmaster',
    'lib',
    'Docs',
    'package.json'
  ];
  
  return indicators.every(indicator => {
    const fullPath = path.join(projectRoot, indicator);
    return fs.existsSync(fullPath);
  });
}

/**
 * Run all startup hooks
 */
export async function runStartupHooks(options = {}) {
  const projectRoot = options.projectRoot || getProjectRoot();
  const silent = options.silent === true;
  
  if (!silent) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Claude Orchestrator - Startup Initialization');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
  }
  
  // Verify we're in an orchestrator project
  if (!isOrchestratorProject(projectRoot)) {
    if (!silent) {
      console.log('⚠️  Not an orchestrator project, skipping initialization');
    }
    return { success: false, reason: 'not_orchestrator_project' };
  }
  
  const results = {
    success: true,
    hooks: []
  };
  
  try {
    // Hook 1: Initialize File Lifecycle Management
    if (!silent) {
      console.log('');
    }
    
    const lifecycleResult = await initializeFileLifecycle({
      projectRoot,
      verbose: !silent
    });
    
    results.hooks.push({
      name: 'file_lifecycle',
      success: lifecycleResult.success,
      details: lifecycleResult
    });
    
    // Hook 2: Initialize TaskMaster Configuration
    if (!silent) {
      console.log('');
    }
    
    const taskmasterResult = await initializeTaskMaster({
      projectRoot,
      verbose: !silent
    });
    
    results.hooks.push({
      name: 'taskmaster',
      success: taskmasterResult.success,
      details: taskmasterResult
    });
    
    // Hook 3: Check MCP servers (future)
    // Hook 4: Validate directory structure (future)
    
    if (!silent) {
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('  ✅ Orchestrator ready!');
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
    }
    
  } catch (error) {
    results.success = false;
    results.error = error.message;
    
    if (!silent) {
      console.error('');
      console.error('❌ Startup initialization failed:', error.message);
      console.error('');
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
  
  runStartupHooks({ silent })
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error during startup:', error);
      process.exit(1);
    });
}

export default runStartupHooks;

