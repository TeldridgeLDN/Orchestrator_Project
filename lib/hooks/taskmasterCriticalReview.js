/**
 * Taskmaster Critical Review Hook
 * 
 * Automatically triggers critical task evaluation after Taskmaster
 * operations that generate or modify tasks.
 * 
 * Integrates with:
 * - POST_TOOL_USE hook (detects task file changes)
 * - USER_PROMPT_SUBMIT hook (detects taskmaster commands)
 * 
 * @module hooks/taskmasterCriticalReview
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Configuration
 */
const CONFIG = {
  enabled: true,
  throttleMs: 5000, // Don't evaluate more than once per 5 seconds
  autoApply: true,
  generateReport: true
};

/**
 * State tracking
 */
let lastEvaluationTime = 0;
let lastTasksHash = null;

/**
 * Check if critical review is enabled in project config
 */
function isEnabledInConfig(projectRoot) {
  try {
    const configPath = path.join(projectRoot, '.taskmaster', 'config.json');
    if (!fs.existsSync(configPath)) {
      return false;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.global?.enableCriticalReview === true;
  } catch (error) {
    console.error('Error reading taskmaster config:', error.message);
    return false;
  }
}

/**
 * Get hash of tasks.json for change detection
 */
function getTasksHash(projectRoot) {
  try {
    const tasksPath = path.join(projectRoot, '.taskmaster', 'tasks', 'tasks.json');
    if (!fs.existsSync(tasksPath)) {
      return null;
    }

    const content = fs.readFileSync(tasksPath, 'utf8');
    // Simple hash: just use content length + first/last 100 chars
    return `${content.length}-${content.substring(0, 100)}-${content.substring(content.length - 100)}`;
  } catch (error) {
    return null;
  }
}

/**
 * Check if tasks.json has changed
 */
function tasksHaveChanged(projectRoot) {
  const currentHash = getTasksHash(projectRoot);
  if (currentHash === null) {
    return false;
  }

  if (lastTasksHash === null) {
    lastTasksHash = currentHash;
    return false;
  }

  const changed = currentHash !== lastTasksHash;
  if (changed) {
    lastTasksHash = currentHash;
  }

  return changed;
}

/**
 * Check if enough time has passed since last evaluation (throttling)
 */
function shouldThrottle() {
  const now = Date.now();
  const timeSinceLastEval = now - lastEvaluationTime;
  return timeSinceLastEval < CONFIG.throttleMs;
}

/**
 * Run critical evaluation script
 */
async function runEvaluation(projectRoot, options = {}) {
  const { silent = false } = options;

  if (!silent) {
    console.log('');
    console.log('🔍 Critical Task Evaluation: Running...');
  }

  try {
    const scriptPath = path.join(projectRoot, '.taskmaster', 'scripts', 'critical-task-evaluator.js');
    
    if (!fs.existsSync(scriptPath)) {
      if (!silent) {
        console.log('⚠️  Critical evaluation script not found');
      }
      return { success: false, reason: 'script_not_found' };
    }

    // Run evaluation script
    const output = execSync(`node "${scriptPath}"`, {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    lastEvaluationTime = Date.now();

    if (!silent) {
      console.log('✅ Critical evaluation complete');
      
      // Show latest report
      const reportsDir = path.join(projectRoot, '.taskmaster', 'reports');
      if (fs.existsSync(reportsDir)) {
        const reports = fs.readdirSync(reportsDir)
          .filter(f => f.startsWith('critical-review-') && f.endsWith('.md'))
          .sort()
          .reverse();
        
        if (reports.length > 0) {
          console.log(`📄 Report: .taskmaster/reports/${reports[0]}`);
        }
      }
    }

    return { success: true, output };

  } catch (error) {
    if (!silent) {
      console.error('❌ Critical evaluation failed:', error.message);
    }
    return { success: false, error: error.message };
  }
}

/**
 * POST_TOOL_USE Hook
 * 
 * Monitors for changes to tasks.json and automatically runs evaluation
 * 
 * @param {Object} context - Hook context
 * @param {Function} next - Next middleware
 */
export async function postToolUseReviewHook(context, next) {
  // Continue normal execution first
  await next();

  // Check if enabled
  if (!CONFIG.enabled) {
    return;
  }

  // Get project root from context
  const projectRoot = context.projectRoot || process.cwd();

  // Check if enabled in project config
  if (!isEnabledInConfig(projectRoot)) {
    return;
  }

  // Check if throttled
  if (shouldThrottle()) {
    return;
  }

  // Check if tasks have changed
  if (!tasksHaveChanged(projectRoot)) {
    return;
  }

  // Run evaluation
  await runEvaluation(projectRoot, { silent: false });
}

/**
 * USER_PROMPT_SUBMIT Hook
 * 
 * Detects Taskmaster commands that generate tasks and flags for evaluation
 * 
 * @param {Object} context - Hook context
 * @param {Function} next - Next middleware
 */
export async function userPromptReviewHook(context, next) {
  // Continue normal execution first
  await next();

  // Check if enabled
  if (!CONFIG.enabled) {
    return;
  }

  // Get user prompt
  const userPrompt = context.userPrompt || context.prompt || '';

  // Detect taskmaster task generation commands
  // Supports both CLI commands and natural language
  const taskmasterPatterns = [
    // CLI commands
    /task-master\s+parse-prd/i,
    /tm-parse-prd/i,
    /task-master\s+add-task/i,
    /tm-add-task/i,
    
    // Natural language patterns
    /parse\s+(the\s+)?prd/i,
    /parse\s+(a\s+)?prds?\b/i,
    /add\s+(a\s+)?(new\s+)?task/i,
    /create\s+(a\s+)?(new\s+)?task/i,
    /generate\s+tasks?\b/i,
    /add\s+.*\s+task\s+to\s+taskmaster/i,
    /create\s+.*\s+task\s+in\s+taskmaster/i,
    /taskmaster\s+add\s+task/i,
    /add\s+task\s+for\s+/i,
    /add\s+task:\s*/i,
    
    // MCP tool calls (detected in context)
    /mcp.*parse_prd/i,
    /mcp.*add_task/i
  ];

  const isTaskGenerationCommand = taskmasterPatterns.some(pattern => 
    pattern.test(userPrompt)
  );

  if (!isTaskGenerationCommand) {
    return;
  }

  // Get project root
  const projectRoot = context.projectRoot || process.cwd();

  // Check if enabled in project config
  if (!isEnabledInConfig(projectRoot)) {
    return;
  }

  // Set a flag for later evaluation (after the tool completes)
  // This is handled by postToolUseReviewHook
  context.pendingTaskEvaluation = true;
}

/**
 * Enable/disable the hook
 */
export function setEnabled(enabled) {
  CONFIG.enabled = enabled;
}

/**
 * Get current hook status
 */
export function getStatus() {
  return {
    enabled: CONFIG.enabled,
    throttleMs: CONFIG.throttleMs,
    lastEvaluationTime,
    timeSinceLastEval: Date.now() - lastEvaluationTime
  };
}

/**
 * Manually trigger evaluation (bypasses throttling)
 */
export async function manualEvaluation(projectRoot) {
  lastEvaluationTime = 0; // Reset throttle
  return await runEvaluation(projectRoot, { silent: false });
}

/**
 * Clear state (useful for testing)
 */
export function clearState() {
  lastEvaluationTime = 0;
  lastTasksHash = null;
}

export default {
  postToolUseReviewHook,
  userPromptReviewHook,
  setEnabled,
  getStatus,
  manualEvaluation,
  clearState
};

