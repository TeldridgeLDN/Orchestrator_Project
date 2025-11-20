#!/usr/bin/env node

/**
 * Session Wrap-Up Hook
 * 
 * Automatically triggered when detecting session end phrases like:
 * - "wrap up", "end session", "goodbye", "goodnight"
 * - "that's all for today", "let's stop here"
 * 
 * Performs comprehensive session closure:
 * - Checks for uncommitted changes
 * - Reviews Taskmaster task status
 * - Generates session summary
 * - Suggests memories to create
 * - Validates documentation
 * - Reports on branch sync status
 * - Offers environment cleanup
 * 
 * Philosophy:
 * - Capture everything accomplished
 * - Prepare for next session
 * - Never lose context
 * - Smooth handoffs between sessions
 * 
 * @module hooks/sessionWrapUp
 * @version 1.0.0
 */

import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { verifyPrimacyRules } from '../init/primacy_rules_verification.js';

const execAsync = promisify(exec);

/**
 * Detect if user message indicates session end
 * 
 * @param {Object} context - Hook context
 * @param {string} context.userMessage - The user's message
 * @returns {boolean} True if session is ending
 */
export function detectSessionEnd(context) {
  const message = context.userMessage?.toLowerCase() || '';
  
  const endPhrases = [
    'wrap up',
    'wrap-up',
    'end session',
    'goodbye',
    'good bye',
    'goodnight',
    'good night',
    'that\'s all for today',
    'that\'s all',
    'let\'s stop here',
    'stop here',
    'see you tomorrow',
    'done for today',
    'calling it a day'
  ];
  
  return endPhrases.some(phrase => message.includes(phrase));
}

/**
 * Main wrap-up hook handler
 * 
 * @param {Object} context - Hook context
 * @param {Function} next - Next middleware
 */
export async function sessionWrapUpHook(context, next) {
  // Check if this is a session end
  if (!detectSessionEnd(context)) {
    return next();
  }
  
  console.log('');
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════'));
  console.log(chalk.bold.cyan('  🌙 Session Wrap-Up Initiated'));
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════'));
  console.log('');
  
  const wrapUpData = {
    timestamp: new Date().toISOString(),
    projectRoot: context.projectRoot || process.cwd()
  };
  
  // 1. Check Git Status
  console.log(chalk.bold('📊 Checking Git Status...'));
  wrapUpData.git = await checkGitStatus(wrapUpData.projectRoot);
  displayGitStatus(wrapUpData.git);
  console.log('');
  
  // 2. Check Primacy Rules
  console.log(chalk.bold('📋 Checking Primacy Rules...'));
  wrapUpData.primacyRules = await checkPrimacyRules(wrapUpData.projectRoot);
  displayPrimacyRulesStatus(wrapUpData.primacyRules);
  console.log('');
  
  // 3. Check Taskmaster Status
  console.log(chalk.bold('🎯 Checking Taskmaster Status...'));
  wrapUpData.taskmaster = await checkTaskmasterStatus(wrapUpData.projectRoot);
  displayTaskmasterStatus(wrapUpData.taskmaster);
  console.log('');
  
  // 4. Analyze Session Activity
  console.log(chalk.bold('📝 Analyzing Session Activity...'));
  wrapUpData.session = await analyzeSessionActivity(context, wrapUpData);
  displaySessionSummary(wrapUpData.session);
  console.log('');
  
  // 5. Generate Session Summary File
  console.log(chalk.bold('💾 Saving Session Summary...'));
  const summaryPath = await saveSessionSummary(wrapUpData);
  console.log(chalk.green(`   ✓ Summary saved: ${chalk.dim(path.basename(summaryPath))}`));
  console.log('');
  
  // 6. Memory Suggestions
  if (wrapUpData.session.memorySuggestions.length > 0) {
    console.log(chalk.bold('🧠 Memory Suggestions:'));
    wrapUpData.session.memorySuggestions.forEach((suggestion, i) => {
      console.log(chalk.cyan(`   ${i + 1}. ${suggestion.title}`));
      console.log(chalk.dim(`      ${suggestion.reason}`));
    });
    console.log('');
  }
  
  // 7. Final Wrap-Up Report
  displayFinalReport(wrapUpData);
  
  console.log('');
  console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════'));
  console.log('');
  console.log(chalk.dim('💡 Tip: Say "wake up" next session to restore context'));
  console.log('');
  
  // Store wrap-up data in context for potential use by other hooks
  context.wrapUpData = wrapUpData;
  
  await next();
}

/**
 * Check primacy rules status
 * 
 * @param {string} projectRoot - Project root path
 * @returns {Promise<Object>} Primacy rules status information
 */
async function checkPrimacyRules(projectRoot) {
  try {
    const result = await verifyPrimacyRules({
      projectRoot,
      silent: true  // Don't print to console, we'll handle display
    });
    
    return {
      success: result.success,
      stats: result.stats,
      issues: result.issues || []
    };
  } catch (error) {
    return {
      error: 'Failed to verify primacy rules',
      success: false
    };
  }
}

/**
 * Display primacy rules status
 * 
 * @param {Object} primacyRules - Primacy rules status information
 */
function displayPrimacyRulesStatus(primacyRules) {
  if (primacyRules.error) {
    console.log(chalk.yellow(`   ⚠ ${primacyRules.error}`));
    return;
  }
  
  const { stats, success } = primacyRules;
  
  if (success) {
    console.log(chalk.green(`   ✓ All primacy rules intact (${stats.ok}/${stats.total})`));
  } else {
    console.log(chalk.yellow(`   ⚠ Primacy rules issues detected (${stats.ok}/${stats.total} active)`));
    
    if (stats.missing > 0) {
      console.log(chalk.dim(`     → ${stats.missing} missing rule(s)`));
    }
    
    if (stats.warnings > 0) {
      console.log(chalk.dim(`     → ${stats.warnings} warning(s)`));
    }
    
    if (stats.errors > 0) {
      console.log(chalk.red(`     → ${stats.errors} error(s)`));
    }
  }
}

/**
 * Check git status
 * 
 * @param {string} projectRoot - Project root path
 * @returns {Promise<Object>} Git status information
 */
async function checkGitStatus(projectRoot) {
  try {
    // Check for uncommitted changes
    const { stdout: statusShort } = await execAsync('git status --short', { cwd: projectRoot });
    
    // Check staged files
    const { stdout: staged } = await execAsync('git diff --cached --name-only', { cwd: projectRoot });
    
    // Check modified files
    const { stdout: modified } = await execAsync('git diff --name-only', { cwd: projectRoot });
    
    // Check current branch
    const { stdout: branch } = await execAsync('git branch --show-current', { cwd: projectRoot });
    
    // Check unpushed commits
    let unpushedCount = 0;
    try {
      const { stdout: unpushed } = await execAsync('git rev-list @{u}.. 2>&1', { cwd: projectRoot });
      unpushedCount = unpushed.trim().split('\n').filter(Boolean).length;
    } catch (error) {
      // No upstream branch or other error
    }
    
    return {
      clean: statusShort.trim().length === 0,
      stagedFiles: staged.trim().split('\n').filter(Boolean),
      modifiedFiles: modified.trim().split('\n').filter(Boolean),
      untrackedCount: (statusShort.match(/^\?\?/gm) || []).length,
      currentBranch: branch.trim(),
      unpushedCommits: unpushedCount
    };
  } catch (error) {
    return {
      error: 'Failed to check git status',
      clean: true
    };
  }
}

/**
 * Display git status
 * 
 * @param {Object} git - Git status information
 */
function displayGitStatus(git) {
  if (git.error) {
    console.log(chalk.yellow(`   ⚠ ${git.error}`));
    return;
  }
  
  console.log(chalk.dim('   Branch:'), chalk.cyan(git.currentBranch));
  
  if (git.clean) {
    console.log(chalk.green('   ✓ Working directory clean'));
  } else {
    if (git.stagedFiles.length > 0) {
      console.log(chalk.yellow(`   ⚠ ${git.stagedFiles.length} staged file(s)`));
    }
    if (git.modifiedFiles.length > 0) {
      console.log(chalk.yellow(`   ⚠ ${git.modifiedFiles.length} modified file(s)`));
    }
    if (git.untrackedCount > 0) {
      console.log(chalk.dim(`   → ${git.untrackedCount} untracked file(s)`));
    }
  }
  
  if (git.unpushedCommits > 0) {
    console.log(chalk.yellow(`   ⚠ ${git.unpushedCommits} unpushed commit(s)`));
  }
}

/**
 * Check Taskmaster status
 * 
 * @param {string} projectRoot - Project root path
 * @returns {Promise<Object>} Taskmaster status information
 */
async function checkTaskmasterStatus(projectRoot) {
  try {
    const tasksFilePath = path.join(projectRoot, '.taskmaster/tasks/tasks.json');
    
    // Check if tasks file exists
    try {
      await fs.access(tasksFilePath);
    } catch {
      return { configured: false };
    }
    
    // Read tasks
    const tasksData = JSON.parse(await fs.readFile(tasksFilePath, 'utf-8'));
    const currentTag = tasksData.state?.currentTag || 'master';
    const tasks = tasksData.tags?.[currentTag]?.tasks || [];
    
    // Count by status
    const statusCounts = {
      pending: 0,
      'in-progress': 0,
      done: 0,
      review: 0,
      deferred: 0,
      blocked: 0
    };
    
    tasks.forEach(task => {
      if (statusCounts.hasOwnProperty(task.status)) {
        statusCounts[task.status]++;
      }
    });
    
    // Find next task
    let nextTask = null;
    for (const task of tasks) {
      if (task.status === 'pending') {
        const allDepsComplete = (task.dependencies || []).every(depId => {
          const depTask = tasks.find(t => t.id === depId);
          return depTask?.status === 'done';
        });
        
        if (allDepsComplete) {
          nextTask = task;
          break;
        }
      }
    }
    
    return {
      configured: true,
      currentTag,
      totalTasks: tasks.length,
      statusCounts,
      nextTask
    };
  } catch (error) {
    return {
      configured: false,
      error: 'Failed to read Taskmaster data'
    };
  }
}

/**
 * Display Taskmaster status
 * 
 * @param {Object} taskmaster - Taskmaster status information
 */
function displayTaskmasterStatus(taskmaster) {
  if (!taskmaster.configured) {
    console.log(chalk.dim('   → Taskmaster not configured'));
    return;
  }
  
  if (taskmaster.error) {
    console.log(chalk.yellow(`   ⚠ ${taskmaster.error}`));
    return;
  }
  
  console.log(chalk.dim('   Tag:'), chalk.cyan(taskmaster.currentTag));
  console.log(chalk.dim('   Total Tasks:'), taskmaster.totalTasks);
  
  const { statusCounts } = taskmaster;
  const statusLine = [
    statusCounts.done > 0 && chalk.green(`${statusCounts.done} done`),
    statusCounts['in-progress'] > 0 && chalk.yellow(`${statusCounts['in-progress']} in-progress`),
    statusCounts.pending > 0 && chalk.cyan(`${statusCounts.pending} pending`),
    statusCounts.review > 0 && chalk.blue(`${statusCounts.review} review`),
    statusCounts.blocked > 0 && chalk.red(`${statusCounts.blocked} blocked`)
  ].filter(Boolean).join(chalk.dim(', '));
  
  console.log(chalk.dim('   Status:'), statusLine);
  
  if (taskmaster.nextTask) {
    console.log('');
    console.log(chalk.bold('   📍 Next Task:'));
    console.log(chalk.cyan(`      ${taskmaster.nextTask.id}. ${taskmaster.nextTask.title}`));
  }
}

/**
 * Analyze session activity
 * 
 * @param {Object} context - Hook context
 * @param {Object} wrapUpData - Wrap-up data being collected
 * @returns {Promise<Object>} Session activity analysis
 */
async function analyzeSessionActivity(context, wrapUpData) {
  const { git, taskmaster } = wrapUpData;
  
  // Extract key accomplishments from git changes
  const filesModified = [...new Set([
    ...(git.stagedFiles || []),
    ...(git.modifiedFiles || [])
  ])];
  
  // Categorize files by area
  const filesByArea = {};
  filesModified.forEach(file => {
    const area = file.split('/')[0] || 'root';
    if (!filesByArea[area]) filesByArea[area] = [];
    filesByArea[area].push(file);
  });
  
  // Generate memory suggestions based on activity
  const memorySuggestions = [];
  
  if (filesModified.length > 0) {
    const topArea = Object.entries(filesByArea)
      .sort(([, a], [, b]) => b.length - a.length)[0];
    
    if (topArea) {
      memorySuggestions.push({
        title: `Work on ${topArea[0]} module`,
        content: `Modified ${topArea[1].length} files in ${topArea[0]} area`,
        reason: 'Significant work in this area'
      });
    }
  }
  
  if (taskmaster.configured && taskmaster.statusCounts['in-progress'] > 0) {
    memorySuggestions.push({
      title: `${taskmaster.statusCounts['in-progress']} tasks in progress`,
      content: `Currently working on ${taskmaster.statusCounts['in-progress']} task(s) in ${taskmaster.currentTag} tag`,
      reason: 'Track active work for next session'
    });
  }
  
  return {
    duration: 'unknown', // Would need session start time
    filesModified: filesModified.length,
    filesByArea,
    topAreas: Object.keys(filesByArea).slice(0, 3),
    memorySuggestions
  };
}

/**
 * Display session summary
 * 
 * @param {Object} session - Session activity information
 */
function displaySessionSummary(session) {
  console.log(chalk.dim('   Files Modified:'), session.filesModified);
  
  if (session.topAreas.length > 0) {
    console.log(chalk.dim('   Key Areas:'), session.topAreas.join(chalk.dim(', ')));
  }
}

/**
 * Save session summary to file
 * 
 * @param {Object} wrapUpData - Complete wrap-up data
 * @returns {Promise<string>} Path to saved summary
 */
async function saveSessionSummary(wrapUpData) {
  const summaryDir = path.join(wrapUpData.projectRoot, '.cursor/session-summaries');
  await fs.mkdir(summaryDir, { recursive: true });
  
  const timestamp = new Date();
  const filename = `${timestamp.toISOString().split('T')[0]}-${timestamp.toTimeString().split(' ')[0].replace(/:/g, '-')}.md`;
  const summaryPath = path.join(summaryDir, filename);
  
  const summary = generateMarkdownSummary(wrapUpData);
  await fs.writeFile(summaryPath, summary);
  
  return summaryPath;
}

/**
 * Generate markdown session summary
 * 
 * @param {Object} wrapUpData - Wrap-up data
 * @returns {string} Markdown content
 */
function generateMarkdownSummary(wrapUpData) {
  const { git, primacyRules, taskmaster, session, timestamp } = wrapUpData;
  
  return `# Session Summary - ${new Date(timestamp).toLocaleString()}

## Project Context
- **Branch:** ${git.currentBranch || 'unknown'}
- **Taskmaster Tag:** ${taskmaster.currentTag || 'N/A'}
- **Primacy Rules:** ${primacyRules.success ? '✓ Intact' : '⚠ Issues detected'}

## Session Activity
- **Files Modified:** ${session.filesModified}
- **Key Areas:** ${session.topAreas.join(', ') || 'None'}

### Files Changed by Area
${Object.entries(session.filesByArea).map(([area, files]) => 
  `- **${area}** (${files.length} files)\n${files.slice(0, 5).map(f => `  - \`${f}\``).join('\n')}${files.length > 5 ? `\n  - ... and ${files.length - 5} more` : ''}`
).join('\n\n')}

## Git Status at Session End
- **Clean:** ${git.clean ? 'Yes ✓' : 'No'}
- **Staged Files:** ${git.stagedFiles?.length || 0}
- **Modified Files:** ${git.modifiedFiles?.length || 0}
- **Untracked Files:** ${git.untrackedCount || 0}
- **Unpushed Commits:** ${git.unpushedCommits || 0}

## Primacy Rules Status
- **Status:** ${primacyRules.success ? '✓ All rules intact' : '⚠ Issues detected'}
- **Active Rules:** ${primacyRules.stats?.ok || 0}/${primacyRules.stats?.total || 9}
${primacyRules.stats?.missing > 0 ? `- **Missing Rules:** ${primacyRules.stats.missing}` : ''}
${primacyRules.stats?.warnings > 0 ? `- **Warnings:** ${primacyRules.stats.warnings}` : ''}
${primacyRules.stats?.errors > 0 ? `- **Errors:** ${primacyRules.stats.errors}` : ''}

## Taskmaster Status
${taskmaster.configured ? `
- **Total Tasks:** ${taskmaster.totalTasks}
- **Done:** ${taskmaster.statusCounts.done}
- **In Progress:** ${taskmaster.statusCounts['in-progress']}
- **Pending:** ${taskmaster.statusCounts.pending}
- **Blocked:** ${taskmaster.statusCounts.blocked}

${taskmaster.nextTask ? `### Next Task
**${taskmaster.nextTask.id}. ${taskmaster.nextTask.title}**

${taskmaster.nextTask.description || ''}` : ''}
` : '- Not configured'}

## Memory Suggestions
${session.memorySuggestions.map((s, i) => 
  `${i + 1}. **${s.title}**\n   - ${s.content}\n   - Reason: ${s.reason}`
).join('\n\n')}

---
*Next wake-up command will restore this context*
`;
}

/**
 * Display final wrap-up report
 * 
 * @param {Object} wrapUpData - Complete wrap-up data
 */
function displayFinalReport(wrapUpData) {
  const { git, primacyRules, taskmaster } = wrapUpData;
  
  console.log(chalk.bold('✅ Session Wrapped Up'));
  console.log('');
  
  // Quick stats
  const stats = [
    `${chalk.dim('Files:')} ${wrapUpData.session.filesModified}`,
    taskmaster.configured && `${chalk.dim('Tasks:')} ${taskmaster.statusCounts.done} done, ${taskmaster.statusCounts.pending} pending`,
    primacyRules.success && chalk.green('Rules OK'),
    !git.clean && chalk.yellow(`${git.stagedFiles.length + git.modifiedFiles.length} uncommitted changes`)
  ].filter(Boolean);
  
  console.log('   ' + stats.join(chalk.dim(' | ')));
  
  // Next steps
  if (!git.clean || git.unpushedCommits > 0 || !primacyRules.success) {
    console.log('');
    console.log(chalk.bold('💡 Before You Go:'));
    
    if (!primacyRules.success) {
      console.log(chalk.yellow('   ⚠ Primacy rules need attention'));
      if (primacyRules.stats?.missing > 0) {
        console.log(chalk.dim(`      Run: npm run sync-rules`));
      }
    }
    
    if (!git.clean) {
      console.log(chalk.yellow('   ⚠ Consider committing your changes'));
    }
    
    if (git.unpushedCommits > 0) {
      console.log(chalk.yellow('   ⚠ Consider pushing your commits'));
    }
  }
  
  // Tomorrow's focus
  if (taskmaster.nextTask) {
    console.log('');
    console.log(chalk.bold('🎯 Tomorrow\'s Focus:'));
    console.log(chalk.cyan(`   ${taskmaster.nextTask.id}. ${taskmaster.nextTask.title}`));
  }
}

/**
 * Export hook for registration
 */
export default sessionWrapUpHook;

