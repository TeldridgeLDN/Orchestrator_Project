#!/usr/bin/env node

/**
 * Orchestrator Startup Hooks
 * 
 * Automatically runs initialization routines when the orchestrator starts.
 * Ensures all systems are properly configured before operation.
 * 
 * Hooks:
 * - Primacy Rules verification
 * - File Lifecycle Management initialization
 * - TaskMaster configuration verification and intelligent model selection
 * - diet103 Skills priming (optional)
 * - Wake-up summary display
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initializeFileLifecycle from './file_lifecycle_init.js';
import { initializeTaskMaster } from './taskmaster_init.js';
import { verifyPrimacyRules } from './primacy_rules_verification.js';
import { primeSkillsForProject } from './skills_priming.js';
import { displayWakeUpSummary, displayCompactSummary } from './wake_up_summary.js';

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
  const compact = options.compact === true;
  const skipSkills = options.skipSkills === true;
  
  // Verify we're in an orchestrator project
  if (!isOrchestratorProject(projectRoot)) {
    if (!silent) {
      console.log('⚠️  Not an orchestrator project, skipping initialization');
    }
    return { success: false, reason: 'not_orchestrator_project' };
  }
  
  const initResults = {
    projectRoot,
    projectName: path.basename(projectRoot)
  };
  
  try {
    // Hook 0: Verify Primacy Rules
    const primacyResult = await verifyPrimacyRules({
      projectRoot,
      verbose: !silent && !compact
    });
    
    initResults.primacyRules = primacyResult;
    
    // Hook 1: Initialize File Lifecycle Management
    const lifecycleResult = await initializeFileLifecycle({
      projectRoot,
      verbose: !silent && !compact
    });
    
    initResults.fileLifecycle = lifecycleResult;
    
    // Hook 2: Initialize TaskMaster Configuration
    const taskmasterResult = await initializeTaskMaster({
      projectRoot,
      verbose: !silent && !compact
    });
    
    initResults.taskmaster = taskmasterResult;
    
    // Hook 3: Prime diet103 Skills (optional)
    if (!skipSkills) {
      try {
        const skillsResult = await primeSkillsForProject({
          projectRoot,
          projectType: 'auto-detect',
          level: 'recommended',
          verbose: false // Silent for skills
        });
        
        initResults.skills = skillsResult;
      } catch (error) {
        // Skills priming is optional, don't fail startup
        initResults.skills = { success: false, error: error.message };
      }
    }
    
    // Display summary
    if (!silent) {
      if (compact) {
        displayCompactSummary(initResults);
      } else {
        displayWakeUpSummary(initResults, { projectRoot, projectName: initResults.projectName });
      }
    }
    
  } catch (error) {
    if (!silent) {
      console.error('');
      console.error('❌ Startup initialization failed:', error.message);
      console.error('');
    }
    
    return {
      success: false,
      error: error.message,
      projectRoot,
      projectName: path.basename(projectRoot)
    };
  }
  
  return {
    success: true,
    ...initResults
  };
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

