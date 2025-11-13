#!/usr/bin/env node
/**
 * Taskmaster Session Tracker Hook
 * 
 * Claude Code hook that automatically:
 * 1. Logs task completions to PAI history.jsonl
 * 2. Monitors context window usage
 * 3. Creates handoff documents when needed
 * 
 * Hook Type: UserPromptSubmit
 * Triggers: Before each user prompt is processed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ORCHESTRATOR_PROJECT = process.env.ORCHESTRATOR_PROJECT_ROOT || 
  path.join(homedir(), 'Orchestrator_Project');

// Import our Taskmaster hooks
const HOOKS_DIR = path.join(ORCHESTRATOR_PROJECT, '.taskmaster/hooks');

/**
 * Check if user prompt mentions task completion
 */
function detectTaskCompletion(userPrompt) {
  const completionPatterns = [
    /task\s+(\d+(?:\.\d+)?)\s+(?:is\s+)?(?:complete|done|finished)/i,
    /completed?\s+task\s+(\d+(?:\.\d+)?)/i,
    /set.*status.*done.*(\d+(?:\.\d+)?)/i,
    /mark.*done.*(\d+(?:\.\d+)?)/i,
    /todo.*complete/i,
    /all.*subtasks.*done/i
  ];

  for (const pattern of completionPatterns) {
    const match = userPrompt.match(pattern);
    if (match) {
      return {
        detected: true,
        taskId: match[1] || null
      };
    }
  }

  return { detected: false };
}

/**
 * Get current token usage from environment or system
 */
function getCurrentTokenUsage() {
  // Try to read from context state file
  const stateFile = path.join(ORCHESTRATOR_PROJECT, '.context-state.json');
  
  if (fs.existsSync(stateFile)) {
    try {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
      return {
        used: state.tokensUsed || 0,
        max: state.maxTokens || 1000000,
        percentage: (state.tokensUsed || 0) / (state.maxTokens || 1000000)
      };
    } catch (error) {
      // Ignore errors, use defaults
    }
  }

  // Default: assume safe level
  return { used: 0, max: 1000000, percentage: 0 };
}

/**
 * Main hook execution
 */
async function main() {
  try {
    const userPrompt = process.env.USER_PROMPT || '';
    
    if (!userPrompt) {
      process.exit(0);
    }

    // 1. Check for task completion mentions
    const completion = detectTaskCompletion(userPrompt);
    
    if (completion.detected) {
      console.log('\n📝 Task completion detected');
      
      // Try to import and run PAI history logger
      try {
        const { logSessionMilestone } = await import(path.join(HOOKS_DIR, 'pai-history-logger.js'));
        
        const milestone = completion.taskId 
          ? `Task ${completion.taskId} marked complete`
          : 'Task completion workflow initiated';
          
        logSessionMilestone(milestone, {
          source: 'claude-hook',
          userPrompt: userPrompt.substring(0, 100) // First 100 chars
        });
        
        console.log('   ✓ Logged to PAI history');
      } catch (error) {
        console.log('   ⚠️  Could not log to PAI history:', error.message);
      }
    }

    // 2. Check context window usage
    const usage = getCurrentTokenUsage();
    
    if (usage.percentage >= 0.85) {
      const percentage = Math.round(usage.percentage * 100);
      
      if (usage.percentage >= 0.95) {
        console.log(`\n🚨 CRITICAL: Context at ${percentage}% - transition recommended!`);
        console.log('   Run: node ${HOOKS_DIR}/context-monitor.js');
      } else {
        console.log(`\n⚠️  Context at ${percentage}% - prepare for transition`);
      }
    }

    // 3. Detect Taskmaster commands
    const taskMasterPatterns = [
      /task-?master\s+(next|list|show|get)/i,
      /(get|show)\s+task/i,
      /next\s+task/i
    ];

    const isTaskMasterCommand = taskMasterPatterns.some(p => p.test(userPrompt));
    
    if (isTaskMasterCommand) {
      console.log('\n💡 Tip: Use MCP tools (mcp_task-master-ai_*) for better performance');
    }

    process.exit(0);
  } catch (error) {
    console.error('Hook error:', error.message);
    process.exit(0); // Don't block on errors
  }
}

// Run if executed directly
if (process.argv[1] === __filename || process.argv[1].endsWith('taskmaster-session-tracker.js')) {
  main();
}

