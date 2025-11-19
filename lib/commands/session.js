#!/usr/bin/env node
/**
 * Session Management - Save and restore development context
 * 
 * Enables developers to:
 * - Save current work state before context resets
 * - Restore context after resets
 * - Track progress across long-running tasks
 * - Handoff work between sessions
 * 
 * @module lib/commands/session
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Session directory
const SESSIONS_DIR = '.claude/sessions';

/**
 * Get list of open files from various editors
 */
async function getOpenFiles() {
  const openFiles = [];
  
  try {
    // Try to get files from git status (modified/staged)
    const gitStatus = execSync('git status --short', { encoding: 'utf-8' });
    const modifiedFiles = gitStatus
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.slice(3).trim());
    
    openFiles.push(...modifiedFiles);
  } catch (err) {
    // Git not available or not a git repo
  }
  
  return [...new Set(openFiles)];
}

/**
 * Get current task context from Taskmaster
 */
async function getCurrentTaskContext() {
  try {
    const tasksPath = '.taskmaster/tasks/tasks.json';
    const tasksContent = await fs.readFile(tasksPath, 'utf-8');
    const tasks = JSON.parse(tasksContent);
    
    // Find current in-progress tasks
    const inProgress = tasks.tasks.filter(t => t.status === 'in-progress');
    
    return {
      currentTasks: inProgress.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        subtasks: t.subtasks?.filter(st => st.status === 'in-progress' || st.status === 'pending')
      })),
      totalTasks: tasks.tasks.length,
      completedTasks: tasks.tasks.filter(t => t.status === 'done').length
    };
  } catch (err) {
    return { currentTasks: [], note: 'Taskmaster not initialized or no tasks found' };
  }
}

/**
 * Get recent git commits for context
 */
async function getRecentCommits(limit = 5) {
  try {
    const commits = execSync(
      `git log --oneline -n ${limit}`,
      { encoding: 'utf-8' }
    );
    return commits.trim().split('\n');
  } catch (err) {
    return [];
  }
}

/**
 * Save current session state
 */
export async function saveSession(sessionName, options = {}) {
  const {
    notes = '',
    includeContext = true,
    includeFiles = true,
    includeTasks = true
  } = options;

  // Ensure sessions directory exists
  await fs.mkdir(SESSIONS_DIR, { recursive: true });

  const timestamp = new Date().toISOString();
  const sessionDir = path.join(SESSIONS_DIR, sessionName);
  
  await fs.mkdir(sessionDir, { recursive: true });

  const sessionData = {
    name: sessionName,
    created: timestamp,
    notes: notes
  };

  // Collect context
  if (includeFiles) {
    sessionData.openFiles = await getOpenFiles();
  }

  if (includeTasks) {
    sessionData.taskContext = await getCurrentTaskContext();
  }

  if (includeContext) {
    sessionData.recentCommits = await getRecentCommits();
    
    // Get current branch
    try {
      const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
      sessionData.branch = branch;
    } catch (err) {
      sessionData.branch = 'unknown';
    }
  }

  // Save session metadata
  const metadataPath = path.join(sessionDir, 'session.json');
  await fs.writeFile(metadataPath, JSON.stringify(sessionData, null, 2));

  // Create human-readable plan
  const planPath = path.join(sessionDir, 'plan.md');
  const planContent = generatePlan(sessionData, notes);
  await fs.writeFile(planPath, planContent);

  // Create context file
  const contextPath = path.join(sessionDir, 'context.md');
  const contextContent = generateContext(sessionData);
  await fs.writeFile(contextPath, contextContent);

  // Create tasks checklist
  if (sessionData.taskContext?.currentTasks?.length > 0) {
    const tasksPath = path.join(sessionDir, 'tasks.md');
    const tasksContent = generateTasksChecklist(sessionData.taskContext);
    await fs.writeFile(tasksPath, tasksContent);
  }

  return {
    success: true,
    sessionDir,
    files: ['session.json', 'plan.md', 'context.md', 'tasks.md'].filter(f => 
      f !== 'tasks.md' || sessionData.taskContext?.currentTasks?.length > 0
    )
  };
}

/**
 * Restore a saved session
 */
export async function restoreSession(sessionName) {
  const sessionDir = path.join(SESSIONS_DIR, sessionName);
  
  try {
    await fs.access(sessionDir);
  } catch (err) {
    throw new Error(`Session '${sessionName}' not found`);
  }

  // Load session metadata
  const metadataPath = path.join(sessionDir, 'session.json');
  const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

  // Read all session files
  const files = await fs.readdir(sessionDir);
  const sessionContent = {};

  for (const file of files) {
    if (file.endsWith('.md') || file.endsWith('.json')) {
      const content = await fs.readFile(path.join(sessionDir, file), 'utf-8');
      sessionContent[file] = content;
    }
  }

  return {
    metadata,
    sessionContent,
    instructions: generateRestoreInstructions(metadata)
  };
}

/**
 * List all saved sessions
 */
export async function listSessions() {
  try {
    await fs.access(SESSIONS_DIR);
  } catch (err) {
    return [];
  }

  const entries = await fs.readdir(SESSIONS_DIR, { withFileTypes: true });
  const sessions = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      try {
        const metadataPath = path.join(SESSIONS_DIR, entry.name, 'session.json');
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
        sessions.push({
          name: entry.name,
          created: metadata.created,
          notes: metadata.notes,
          branch: metadata.branch,
          taskCount: metadata.taskContext?.currentTasks?.length || 0
        });
      } catch (err) {
        // Skip invalid sessions
      }
    }
  }

  return sessions.sort((a, b) => new Date(b.created) - new Date(a.created));
}

/**
 * Delete a session
 */
export async function deleteSession(sessionName) {
  const sessionDir = path.join(SESSIONS_DIR, sessionName);
  await fs.rm(sessionDir, { recursive: true, force: true });
}

/**
 * Generate plan.md content
 */
function generatePlan(sessionData, notes) {
  return `# Session Plan: ${sessionData.name}

**Created:** ${new Date(sessionData.created).toLocaleString()}  
**Branch:** ${sessionData.branch || 'unknown'}

---

## Session Goal

${notes || 'No notes provided'}

---

## Current Tasks

${sessionData.taskContext?.currentTasks?.length > 0 
  ? sessionData.taskContext.currentTasks.map(t => `
### Task ${t.id}: ${t.title}

${t.description}

**Subtasks:**
${t.subtasks?.map(st => `- [${st.status === 'done' ? 'x' : ' '}] ${st.title}`).join('\n') || '- No subtasks'}
`).join('\n')
  : 'No tasks in progress'}

---

## Progress Tracking

- [ ] Complete current subtask
- [ ] Update task status
- [ ] Run tests
- [ ] Commit changes
- [ ] Update documentation (if needed)

---

## Notes

<!-- Add implementation notes here -->
`;
}

/**
 * Generate context.md content
 */
function generateContext(sessionData) {
  return `# Session Context: ${sessionData.name}

**Created:** ${new Date(sessionData.created).toLocaleString()}  
**Branch:** ${sessionData.branch || 'unknown'}

---

## Modified Files

${sessionData.openFiles?.length > 0
  ? sessionData.openFiles.map(f => `- \`${f}\``).join('\n')
  : 'No modified files detected'}

---

## Recent Commits

${sessionData.recentCommits?.length > 0
  ? '```\n' + sessionData.recentCommits.join('\n') + '\n```'
  : 'No recent commits'}

---

## Task Progress

**Total Tasks:** ${sessionData.taskContext?.totalTasks || 0}  
**Completed:** ${sessionData.taskContext?.completedTasks || 0}  
**In Progress:** ${sessionData.taskContext?.currentTasks?.length || 0}

---

## Key Decisions

<!-- Document important decisions made during this session -->

---

## Blockers

<!-- List any blockers or issues encountered -->

---

## Next Session

<!-- What should be tackled next? -->
`;
}

/**
 * Generate tasks.md checklist
 */
function generateTasksChecklist(taskContext) {
  return `# Task Checklist

${taskContext.currentTasks.map(t => `
## ${t.id}: ${t.title}

${t.subtasks?.map(st => 
  `- [${st.status === 'done' ? 'x' : ' '}] ${st.id} - ${st.title}`
).join('\n') || '- No subtasks'}
`).join('\n')}

---

**Progress:** ${taskContext.completedTasks}/${taskContext.totalTasks} tasks complete
`;
}

/**
 * Generate restore instructions
 */
function generateRestoreInstructions(metadata) {
  return `
📋 **Session Restored: ${metadata.name}**

Created: ${new Date(metadata.created).toLocaleString()}
Branch: ${metadata.branch || 'unknown'}

**Next Steps:**

1. Review plan.md for session goals
2. Check context.md for key decisions
3. Review tasks.md for checklist
4. Resume work on current tasks

${metadata.taskContext?.currentTasks?.length > 0 
  ? `\n**Current Task:** ${metadata.taskContext.currentTasks[0].id} - ${metadata.taskContext.currentTasks[0].title}`
  : ''}
`;
}

/**
 * CLI handler for session commands
 */
async function handleSessionCommand(args) {
  const command = args[0];
  
  try {
    switch (command) {
      case 'save': {
        const sessionName = args[1];
        if (!sessionName) {
          console.error('❌ Error: Session name required');
          console.log('Usage: orch save-session <name> [notes]');
          process.exit(1);
        }
        
        const notes = args.slice(2).join(' ');
        const result = await saveSession(sessionName, { notes });
        
        console.log(`✅ Session saved: ${sessionName}`);
        console.log(`📁 Location: ${result.sessionDir}`);
        console.log(`📄 Files: ${result.files.join(', ')}`);
        break;
      }
      
      case 'restore': {
        const sessionName = args[1];
        if (!sessionName) {
          console.error('❌ Error: Session name required');
          console.log('Usage: orch restore-session <name>');
          process.exit(1);
        }
        
        const result = await restoreSession(sessionName);
        
        console.log(result.instructions);
        console.log('\n📄 Session files loaded:');
        Object.keys(result.sessionContent).forEach(file => {
          console.log(`  - ${file}`);
        });
        break;
      }
      
      case 'list': {
        const sessions = await listSessions();
        
        if (sessions.length === 0) {
          console.log('No saved sessions found');
        } else {
          console.log('\n📋 Saved Sessions:\n');
          sessions.forEach(s => {
            console.log(`  ${s.name}`);
            console.log(`    Created: ${new Date(s.created).toLocaleString()}`);
            console.log(`    Branch: ${s.branch || 'unknown'}`);
            console.log(`    Tasks: ${s.taskCount}`);
            if (s.notes) console.log(`    Notes: ${s.notes}`);
            console.log('');
          });
        }
        break;
      }
      
      case 'delete': {
        const sessionName = args[1];
        if (!sessionName) {
          console.error('❌ Error: Session name required');
          console.log('Usage: orch delete-session <name>');
          process.exit(1);
        }
        
        await deleteSession(sessionName);
        console.log(`✅ Session deleted: ${sessionName}`);
        break;
      }
      
      default:
        console.log(`
🎯 Session Management

USAGE:
  orch save-session <name> [notes]      Save current session
  orch restore-session <name>           Restore a saved session
  orch list-sessions                    List all sessions
  orch delete-session <name>            Delete a session

EXAMPLES:
  orch save-session auth-feature "Implementing JWT auth"
  orch restore-session auth-feature
  orch list-sessions
        `);
    }
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  handleSessionCommand(process.argv.slice(2));
}

