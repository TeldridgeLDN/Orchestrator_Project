/**
 * PAI History Logger Hook
 * 
 * Integrates Taskmaster with PAI's history.jsonl tracking system.
 * Logs task completions and major events to maintain consistency with PAI architecture.
 */

import fs from 'fs';
import path from 'path';
import { homedir } from 'os';

const PAI_HOME = process.env.CLAUDE_HOME || path.join(homedir(), '.claude');
const HISTORY_FILE = path.join(PAI_HOME, 'history.jsonl');

/**
 * Append entry to PAI history.jsonl
 * @param {Object} entry - History entry to log
 */
function appendToHistory(entry) {
  const line = JSON.stringify(entry) + '\n';
  
  try {
    // Ensure PAI home exists
    if (!fs.existsSync(PAI_HOME)) {
      console.warn('⚠️  PAI home directory not found, skipping history logging');
      return false;
    }

    // Append to history file
    fs.appendFileSync(HISTORY_FILE, line, 'utf-8');
    return true;
  } catch (error) {
    console.error('Failed to write to PAI history:', error.message);
    return false;
  }
}

/**
 * Log task completion to PAI history
 */
export function logTaskCompletion(task, context = {}) {
  const entry = {
    display: `Task ${task.id} completed: ${task.title}`,
    pastedContents: {},
    timestamp: Date.now(),
    project: context.projectPath || process.cwd(),
    metadata: {
      type: 'taskmaster:task-completion',
      taskId: task.id,
      status: task.status,
      subtasksCompleted: task.subtasks?.filter(s => s.status === 'done').length || 0,
      totalSubtasks: task.subtasks?.length || 0
    }
  };

  return appendToHistory(entry);
}

/**
 * Log session milestone to PAI history
 */
export function logSessionMilestone(milestone, details = {}) {
  const entry = {
    display: milestone,
    pastedContents: {},
    timestamp: Date.now(),
    project: details.projectPath || process.cwd(),
    metadata: {
      type: 'taskmaster:milestone',
      ...details
    }
  };

  return appendToHistory(entry);
}

/**
 * Log context transition to PAI history
 */
export function logContextTransition(reason, stats) {
  const entry = {
    display: `Context window transition: ${reason}`,
    pastedContents: {},
    timestamp: Date.now(),
    project: process.cwd(),
    metadata: {
      type: 'taskmaster:context-transition',
      tokensUsed: stats.tokensUsed,
      maxTokens: stats.maxTokens,
      percentage: stats.percentage,
      handoffDocument: stats.handoffPath
    }
  };

  return appendToHistory(entry);
}

/**
 * Query recent history entries
 * @param {number} limit - Number of recent entries to return
 * @param {string} projectFilter - Optional project path filter
 */
export function getRecentHistory(limit = 10, projectFilter = null) {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return [];
    }

    const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
    const lines = content.trim().split('\n');
    
    let entries = lines
      .filter(line => line.trim())
      .map(line => JSON.parse(line));

    // Apply project filter if specified
    if (projectFilter) {
      entries = entries.filter(e => e.project === projectFilter);
    }

    // Return most recent entries
    return entries.slice(-limit).reverse();
  } catch (error) {
    console.error('Failed to read PAI history:', error.message);
    return [];
  }
}

/**
 * Hook entry point
 */
export async function run(context) {
  // This hook is called after task completion
  if (context.event === 'task-completed' && context.task) {
    const logged = logTaskCompletion(context.task, context);
    
    if (logged) {
      console.log(`✓ Logged to PAI history: Task ${context.task.id}`);
    }
  }

  return { success: true };
}

