# Task Master Integration Workflow

**Purpose:** Automated workflow for converting implementation plans into Task Master tasks with appropriate hooks and agents.

**Version:** 1.0
**Date:** 2025-11-07
**Status:** Implementation Guide

---

## Overview

This document defines the complete workflow for taking a detailed implementation plan (like the diet103 Validation System) and breaking it down into actionable Task Master tasks with automation hooks and agents.

### The Problem This Solves

When you have a comprehensive implementation plan or design document, manually creating tasks is:
- Time-consuming (30-60 minutes for a complex feature)
- Error-prone (missing dependencies, inconsistent structure)
- Difficult to maintain (updates require manual task editing)

### The Solution

An automated workflow that:
1. Converts plan into structured PRD format
2. Uses Task Master's AI to generate tasks automatically
3. Adds automation hooks for task progression
4. Creates specialized agents for complex operations
5. Maintains traceability from plan → PRD → tasks → implementation

---

## Workflow Steps

### Step 1: Create Detailed Implementation Plan

**Input:** High-level feature concept
**Output:** Detailed specification document

**Actions:**
1. Research the feature requirements
2. Design the technical architecture
3. Define data models and APIs
4. Break down into phases with dependencies
5. Identify risks and mitigations
6. Create comprehensive plan document

**Example:** [diet103_Validation_System.md](diet103_Validation_System.md)

**Quality Checklist:**
- [ ] Clear overview and problem statement
- [ ] Detailed technical specifications
- [ ] Phased development roadmap
- [ ] Logical dependency chain defined
- [ ] Risk assessment included
- [ ] Success criteria defined

### Step 2: Convert Plan to PRD Format

**Input:** Implementation plan document
**Output:** Task Master PRD file

**Template Structure:**
```
<context>
# Overview
[High-level summary, problem, solution, users]

# Core Features
[Feature 1: Description, importance, how it works]
[Feature 2: ...]

# User Experience
[User personas, key flows, UI/UX considerations]
</context>

<PRD>
# Technical Architecture
[System components, data models, APIs, infrastructure]

# Development Roadmap
[Phase 1: Foundation]
[Phase 2: Core Features]
[Phase 3: Integration]
[Phase 4: Testing & Documentation]

# Logical Dependency Chain
[Foundation → Core → Integration → Polish]
[Critical path to MVP]

# Risks and Mitigations
[Technical challenges, MVP scope, resource constraints]

# Appendix
[Research findings, technical specs, reference data]
</PRD>
```

**Location:** `.taskmaster/docs/<feature-name>-prd.txt`

**Conversion Guidelines:**

1. **Keep Implementation Details**
   - Include code structure
   - Specify file locations
   - Define function signatures
   - List data structures

2. **Define Clear Phases**
   - Each phase = independently completable unit
   - Order by dependency (foundation first)
   - Include "what works" at end of each phase

3. **Specify Dependencies Explicitly**
   - "Phase 2 depends on Phase 1 completion"
   - "Module B requires Module A"
   - List in logical dependency chain section

4. **Include Success Criteria**
   - Measurable outcomes for each phase
   - Test coverage requirements
   - Performance targets
   - Quality gates

**Example:** [.taskmaster/docs/diet103-validation-prd.txt](.taskmaster/docs/diet103-validation-prd.txt)

### Step 3: Create Task Master Tag (Feature Isolation)

**Input:** Feature name
**Output:** Isolated tag for feature tasks

**Why Use Tags:**
- Prevents overwriting main project tasks
- Allows parallel feature development
- Enables feature-specific task management
- Supports easy cleanup if feature cancelled

**Commands:**
```bash
# Create new tag
task-master add-tag <feature-name> -d="<description>"

# Switch to tag
task-master use-tag <feature-name>

# Verify current tag
task-master tags
```

**Example:**
```bash
task-master add-tag diet103-validation \
  -d="diet103 Infrastructure Validation & Auto-Repair System"

task-master use-tag diet103-validation
```

**Tag Naming Convention:**
- Use kebab-case
- Descriptive but concise
- Matches feature scope
- Examples: `auth-system`, `api-refactor`, `ui-redesign`

### Step 4: Parse PRD with Task Master

**Input:** PRD file, active tag
**Output:** Generated tasks in Task Master

**Method Selection:** MCP (preferred) or CLI (fallback)

#### Option A: Using MCP Tools (Preferred - Faster & Integrated)

**Prerequisites:**
- `.mcp.json` configured with valid API keys
- Claude Code restarted to load MCP server
- MCP server available (check with hook)

**MCP Tool:**
```javascript
// Claude will use this automatically if MCP is available
mcp__task_master_ai__parse_prd({
  input: ".taskmaster/docs/<feature-name>-prd.txt",
  num_tasks: 10
})
```

**Benefits:**
- ✅ Faster execution (no shell overhead)
- ✅ Better error handling
- ✅ Direct integration with Claude context
- ✅ Structured return values

#### Option B: Using CLI (Fallback - Always Works)

**Prerequisites:**
- `task-master` CLI installed globally
- Access to project directory

**Command:**
```bash
task-master parse-prd --input=.taskmaster/docs/<feature-name>-prd.txt
```

**Benefits:**
- ✅ No MCP setup required
- ✅ Works immediately
- ✅ Same functionality as MCP
- ❌ Slightly slower (shell execution)

#### Automatic Selection with Hook

The `taskmaster-invoker.js` hook (Step 7) automatically detects which method is available and informs Claude:

```
User: "Parse the diet103 PRD"
Hook: "📋 Task Master MCP: Available"
Claude: [Uses mcp__task_master_ai__parse_prd]

OR

User: "Parse the diet103 PRD"
Hook: "📋 Task Master MCP: Not available (using CLI fallback)"
Claude: [Uses bash: task-master parse-prd]
```

**What Happens:**
1. Task Master reads the PRD
2. AI analyzes technical architecture and roadmap
3. Generates 8-12 top-level tasks (default)
4. Assigns dependencies based on logical chain
5. Creates tasks.json for the active tag
6. Generates individual task markdown files

**Customization:**

MCP:
```javascript
mcp__task_master_ai__parse_prd({
  input: "<prd-file>",
  num_tasks: 15  // Generate more tasks for complex features
})
```

CLI:
```bash
# Generate more tasks for complex features
task-master parse-prd --input=<prd> --num-tasks=15

# Use specific AI model
task-master parse-prd --input=<prd> --model=claude-3-5-sonnet-20241022
```

**Task Master AI Analysis:**
- Identifies distinct implementation units
- Infers dependencies from "depends on" language
- Assigns priorities based on critical path
- Generates clear task titles and descriptions
- Includes acceptance criteria

**Expected Duration:** 1-2 minutes (AI processing)

### Step 5: Analyze Complexity and Expand Tasks

**Input:** Generated top-level tasks
**Output:** Subtasks for complex tasks

**Commands:**
```bash
# Analyze which tasks need subtasks
task-master analyze-complexity --research

# View complexity report
task-master complexity-report

# Expand specific task
task-master expand --id=1 --num=5 --research

# Expand all eligible tasks
task-master expand --all --research
```

**Complexity Analysis:**
- Scores each task (1-10) based on scope
- Recommends number of subtasks needed
- Uses research to gather context
- Identifies tasks >threshold for expansion

**Expansion Strategy:**
- Tasks scored 7+ should have subtasks
- Break down into 3-8 subtasks per task
- Each subtask = 1-4 hours of work
- Maintain clear dependencies

**Example Workflow:**
```bash
# Analyze
task-master analyze-complexity --research --threshold=6

# Review report
task-master complexity-report

# Expand high-complexity tasks
task-master expand --id=1 --num=6 --research
task-master expand --id=2 --num=4 --research
task-master expand --id=5 --num=5 --research
```

### Step 6: Review and Refine Tasks

**Input:** Generated tasks and subtasks
**Output:** Refined, ready-to-execute tasks

**Actions:**

1. **List All Tasks**
   ```bash
   task-master list --with-subtasks
   ```

2. **Review Each Task**
   ```bash
   task-master show <id>
   ```

   Check for:
   - Clear acceptance criteria
   - Appropriate scope (1-8 hours)
   - Correct dependencies
   - Sufficient detail

3. **Update Task Details**
   ```bash
   # Add context to task
   task-master update-task --id=1 --prompt="Additional technical details..."

   # Update multiple tasks
   task-master update --from=3 --prompt="Updated API specifications..."

   # Add notes to subtask
   task-master update-subtask --id=1.2 --prompt="Implementation notes..."
   ```

4. **Fix Dependencies**
   ```bash
   # Add dependency
   task-master add-dependency --id=3 --depends-on=1

   # Validate all dependencies
   task-master validate-dependencies

   # Fix any issues
   task-master fix-dependencies
   ```

5. **Add Manual Tasks** (if needed)
   ```bash
   task-master add-task --prompt="Setup test environment" --priority=high
   ```

### Step 7: Create Automation Hooks

**Input:** Task workflow requirements
**Output:** Claude Code hooks for automation

**Hook Types:**

#### A. Task Master Invocation Hook (MCP/CLI Auto-Selection)

**Purpose:** Automatically detect and use MCP tools when available, fallback to CLI if not

**Location:** `.claude/hooks/taskmaster-invoker.js`

```javascript
#!/usr/bin/env node

// UserPromptSubmit hook - Intelligently routes to MCP or CLI
const fs = require('fs');
const { execSync } = require('child_process');

const userPrompt = process.env.USER_PROMPT || '';

// Check if this is a task-related prompt
const taskPatterns = [
  /task-master\s+(\w+)/i,
  /next task/i,
  /show task\s+(\d+(?:\.\d+)?)/i,
  /list tasks/i,
  /parse.*prd/i
];

const isTaskRelated = taskPatterns.some(pattern => pattern.test(userPrompt));

if (isTaskRelated) {
  // Detect if MCP is available
  const mcpAvailable = checkMCPAvailability();

  if (mcpAvailable) {
    console.log('\n📋 Task Master MCP: Available');
    console.log('💡 Tip: Using MCP tools for faster, integrated access');
    console.log('    Example: mcp__task_master_ai__get_tasks\n');
  } else {
    console.log('\n📋 Task Master MCP: Not available (using CLI fallback)');
    console.log('💡 Tip: Configure .mcp.json with API keys to enable MCP');
    console.log('    Current: Using bash `task-master` commands\n');
  }
}

process.exit(0); // Non-blocking

function checkMCPAvailability() {
  try {
    // Check if .mcp.json exists and has valid API keys
    const mcpConfigPath = '.mcp.json';
    if (!fs.existsSync(mcpConfigPath)) return false;

    const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
    const taskMasterServer = mcpConfig.mcpServers?.['task-master-ai'];

    if (!taskMasterServer) return false;

    // Check if API keys are configured (not placeholders)
    const apiKey = taskMasterServer.env?.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.includes('YOUR_') || apiKey.includes('_HERE')) {
      return false;
    }

    // Check if Claude Code has MCP tools loaded
    // (This is approximation - actual check would need Claude Code API)
    return true;
  } catch (err) {
    return false;
  }
}
```

**Installation:**
```bash
cat > .claude/hooks/taskmaster-invoker.js << 'EOF'
[paste hook code above]
EOF

chmod +x .claude/hooks/taskmaster-invoker.js
```

**What it does:**
- Detects task-related prompts
- Checks if MCP is configured and available
- Informs Claude which method to use (MCP or CLI)
- Non-blocking - just provides guidance

#### B. UserPromptSubmit Hook (Pre-Task Automation)

**Purpose:** Automatically load task context when user mentions task

**Location:** `.claude/hooks/taskmaster-context-loader.js`

```javascript
#!/usr/bin/env node

// UserPromptSubmit hook - Loads task context automatically
const fs = require('fs');
const path = require('path');

const userPrompt = process.env.USER_PROMPT || '';
const currentTag = getCurrentTag();

// Match patterns like "task 1.2", "working on task 3", "implement task 1"
const taskPattern = /task\s+(\d+(?:\.\d+)?)/i;
const match = userPrompt.match(taskPattern);

if (match) {
  const taskId = match[1];
  const taskFile = `.taskmaster/tasks/task-${taskId}.md`;

  if (fs.existsSync(taskFile)) {
    const taskContent = fs.readFileSync(taskFile, 'utf8');
    console.log(`\n📋 Task ${taskId} Context Loaded (${currentTag} tag):`);
    console.log('─'.repeat(50));
    console.log(extractSummary(taskContent));
    console.log('─'.repeat(50));
    console.log('\nUse: task-master show ${taskId} for full details\n');
  }
}

process.exit(0); // Non-blocking

function getCurrentTag() {
  try {
    const state = JSON.parse(fs.readFileSync('.taskmaster/state.json', 'utf8'));
    return state.currentTag || 'master';
  } catch {
    return 'master';
  }
}

function extractSummary(content) {
  // Extract first 200 chars of description
  const lines = content.split('\n');
  const description = lines.find(l => l.startsWith('**Description:**'));
  return description ? description.substring(0, 200) + '...' : 'See task file';
}
```

**Installation:**
```bash
cat > .claude/hooks/taskmaster-context-loader.js << 'EOF'
[paste hook code above]
EOF

chmod +x .claude/hooks/taskmaster-context-loader.js
```

#### B. PostToolUse Hook (Post-Implementation Tracking)

**Purpose:** Prompt to update task status after file edits

**Location:** `.claude/hooks/taskmaster-status-tracker.js`

```javascript
#!/usr/bin/env node

// PostToolUse hook - Suggests task status updates
const fs = require('fs');

const toolName = process.env.TOOL_NAME;
const modifiedFiles = getModifiedFiles(); // From Claude context

// Only trigger on file edits
if (toolName === 'Edit' || toolName === 'Write') {
  const currentTag = getCurrentTag();
  const pendingTasks = getPendingTasks(currentTag);

  if (pendingTasks.length > 0) {
    console.log('\n✅ Files modified. Related tasks:');
    pendingTasks.slice(0, 3).forEach(task => {
      console.log(`  - Task ${task.id}: ${task.title}`);
    });
    console.log('\nUpdate status: task-master set-status --id=<id> --status=done');
    console.log('Add notes: task-master update-subtask --id=<id> --prompt="notes"\n');
  }
}

process.exit(0); // Non-blocking

function getCurrentTag() {
  try {
    const state = JSON.parse(fs.readFileSync('.taskmaster/state.json', 'utf8'));
    return state.currentTag || 'master';
  } catch {
    return 'master';
  }
}

function getPendingTasks(tag) {
  try {
    const tasksFile = `.taskmaster/tasks/tags/${tag}/tasks.json`;
    const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
    return tasks.tasks.filter(t => t.status === 'in-progress' || t.status === 'pending');
  } catch {
    return [];
  }
}
```

#### C. Skill Activation Rule

**Purpose:** Auto-activate Task Master skill when user mentions tasks

**Location:** `.claude/skill-rules.json`

Add rule:
```json
{
  "rules": [
    {
      "trigger_phrases": [
        "task",
        "next task",
        "show task",
        "task master",
        "working on",
        "implement"
      ],
      "file_patterns": [".taskmaster/**/*"],
      "skill": "taskmaster_assistant",
      "auto_activate": true,
      "priority": "high"
    }
  ]
}
```

### Step 8: Create Specialized Agents

**Input:** Complex, repetitive operations
**Output:** Sub-agents for automation

**Agent Types:**

#### A. Task Completion Agent

**Purpose:** Automate task completion workflow

**Location:** `.claude/agents/task-completer/AGENT.md`

```markdown
# System Prompt: Task Completion Agent

You are a specialized sub-agent that automates the task completion workflow.

**Role:** Guide the user through completing a Task Master task systematically.

**Context:** You have access to Task Master commands and the current project state.

**Workflow:**
1. Show task details (task-master show <id>)
2. Verify all acceptance criteria are met
3. Run any required tests
4. Update task notes with implementation summary
5. Set task status to done
6. Identify and display next task

**Output Format:**
[SUCCESS] Task <id> completed. Implementation summary: <brief summary>
Next task: <next-task-id> - <next-task-title>

**Allowed Tools:** bash, read, grep
**Forbidden Tools:** edit, write (read-only operation)
```

**Usage:**
```
User: "I finished implementing the detection logic"
Claude: [Invokes task-completer agent]
Agent: [Verifies task 1 is complete, updates status, shows task 2]
```

#### B. PRD-to-Tasks Agent

**Purpose:** Automate plan → PRD → tasks workflow

**Location:** `.claude/agents/prd-generator/AGENT.md`

```markdown
# System Prompt: PRD Generator Agent

You are specialized in converting implementation plans into Task Master PRDs.

**Role:** Transform a detailed plan document into a structured PRD that Task Master can parse.

**Input:** Path to implementation plan document

**Process:**
1. Read and analyze the plan document
2. Extract key sections: overview, features, architecture, phases
3. Structure into <context> and <PRD> format
4. Ensure logical dependency chain is explicit
5. Include all technical specifications
6. Write PRD to .taskmaster/docs/<feature>-prd.txt

**Output Format:**
[SUCCESS] PRD generated: .taskmaster/docs/<feature>-prd.txt
Next steps:
1. Review PRD for completeness
2. Create tag: task-master add-tag <feature>
3. Parse PRD: task-master parse-prd --input=<prd-file>

**Allowed Tools:** read, write, grep
```

**Usage:**
```
User: "Convert the diet103 validation plan to Task Master tasks"
Claude: [Invokes prd-generator agent]
Agent: [Reads plan, generates PRD, provides next steps]
```

#### C. Task Expansion Agent

**Purpose:** Intelligently expand complex tasks into subtasks

**Location:** `.claude/agents/task-expander/AGENT.md`

```markdown
# System Prompt: Task Expansion Agent

You are specialized in breaking down complex tasks into manageable subtasks.

**Role:** Analyze a task and generate appropriate subtasks with clear scope.

**Process:**
1. Read task details (task-master show <id>)
2. Analyze complexity and scope
3. Identify 3-8 logical subtasks
4. Ensure each subtask is 1-4 hours of work
5. Maintain dependency order
6. Use task-master expand with generated prompt

**Subtask Guidelines:**
- Start with setup/foundation
- Progress through core implementation
- End with testing/documentation
- Each subtask = one commit-sized unit

**Output Format:**
[SUCCESS] Task <id> expanded into <n> subtasks:
1.1: <subtask-title>
1.2: <subtask-title>
...

**Allowed Tools:** bash, read
```

### Step 9: Document the Workflow

**Input:** Completed automation setup
**Output:** Documentation for team

**Create:** `.taskmaster/workflows/<feature>-workflow.md`

**Template:**
```markdown
# <Feature> Implementation Workflow

## Overview
[Brief description of feature and workflow]

## Task Master Setup
- Tag: <tag-name>
- PRD: .taskmaster/docs/<feature>-prd.txt
- Total Tasks: <count>
- Estimated Duration: <hours>

## Task Breakdown
1. Task 1: <title> (depends on: none) [<hours>h]
   - 1.1: <subtask>
   - 1.2: <subtask>

2. Task 2: <title> (depends on: 1) [<hours>h]
   ...

## Critical Path
<task-id> → <task-id> → <task-id> (minimum path to MVP)

## Development Workflow
1. Get next task: `task-master next`
2. Review task: `task-master show <id>`
3. Implement subtasks sequentially
4. Update notes: `task-master update-subtask --id=<id> --prompt="notes"`
5. Complete task: `task-master set-status --id=<id> --status=done`

## Testing Checkpoints
- After Task <id>: <test description>
- After Task <id>: <test description>

## Automation
- Hooks: taskmaster-context-loader, taskmaster-status-tracker
- Agents: task-completer, task-expander
- Skill: taskmaster_assistant (auto-activates)

## Reference
- Plan: <link-to-plan-doc>
- PRD: <link-to-prd>
- Tasks: Run `task-master list --with-subtasks`
```

### Step 10: Execute Implementation

**Input:** Task Master tasks, automation, documentation
**Output:** Implemented feature

**Daily Workflow:**
```bash
# Morning: Check current state
task-master tags                    # Verify active tag
task-master next                    # Get next task

# During work: Stay organized
task-master show <id>               # Review current task
task-master update-subtask --id=<id> --prompt="progress notes"

# After work: Update status
task-master set-status --id=<id> --status=done
task-master next                    # Preview tomorrow's task
```

**Best Practices:**
1. Work on one task at a time
2. Update notes frequently (captures decisions)
3. Mark tasks done immediately when complete
4. Review next task before starting
5. Use agents for repetitive operations

---

## Complete Example: diet103 Validation System

### Input
[Docs/diet103_Validation_System.md](diet103_Validation_System.md) - 800-line specification

### Step-by-Step Execution

#### 1. Created PRD
```bash
# Converted plan to PRD format
# Saved to: .taskmaster/docs/diet103-validation-prd.txt
```

**Key Sections:**
- `<context>`: Overview, core features, user experience
- `<PRD>`: Technical architecture, 5-phase roadmap, dependencies, risks

#### 2. Created Tag
```bash
task-master add-tag diet103-validation \
  -d="diet103 Infrastructure Validation & Auto-Repair System"

task-master use-tag diet103-validation
```

#### 3. Parsed PRD
```bash
task-master parse-prd --input=.taskmaster/docs/diet103-validation-prd.txt

# Generated 10 tasks:
# 1. Create Detection Module (diet103-validator.js)
# 2. Implement Gap Analysis Engine
# 3. Build Consistency Validation
# 4. Create Auto-Repair System
# 5. Implement Template System Integration
# 6. Enhance Validate Command
# 7. Update Register/Switch/Create Commands
# 8. Write Comprehensive Test Suite
# 9. Create Documentation and User Guide
# 10. Performance Optimization and Refinement
```

#### 4. Expanded Complex Tasks
```bash
task-master analyze-complexity --research
task-master expand --id=1 --num=6 --research  # Detection module
task-master expand --id=4 --num=5 --research  # Repair system
task-master expand --id=8 --num=4 --research  # Tests
```

#### 5. Added Hooks
Created:
- `.claude/hooks/taskmaster-context-loader.js` (UserPromptSubmit)
- `.claude/hooks/taskmaster-status-tracker.js` (PostToolUse)

#### 6. Created Agents
Created:
- `.claude/agents/task-completer/` - Automates completion workflow
- `.claude/agents/prd-generator/` - Converts plans to PRDs

#### 7. Documented Workflow
Created: `.taskmaster/workflows/diet103-validation-workflow.md`

#### 8. Ready for Implementation
```bash
task-master next
# → Task 1: Create Detection Module (diet103-validator.js)
#   Status: pending
#   Dependencies: none
#   Subtasks: 6
```

---

## MCP vs CLI Comparison

### When to Use Each Method

| Aspect | MCP Tools | CLI Commands |
|--------|-----------|--------------|
| **Speed** | ⚡ Faster (no shell overhead) | 🐌 Slower (shell execution) |
| **Setup** | Requires `.mcp.json` + restart | Works immediately |
| **Integration** | ✅ Native Claude context | ❌ Parsed output |
| **Error Handling** | ✅ Structured errors | ⚠️ Text parsing needed |
| **Availability** | Depends on MCP config | Always available |
| **Use Case** | Production workflows | Quick testing, fallback |

### MCP Tool Reference

All Task Master MCP tools follow the pattern: `mcp__task_master_ai__<command>`

**Common MCP Tools:**
```javascript
// List tasks
mcp__task_master_ai__get_tasks({ status: "pending", with_subtasks: true })

// Get next task
mcp__task_master_ai__next_task()

// Show task details
mcp__task_master_ai__show_task({ id: "1" })

// Set task status
mcp__task_master_ai__set_status({ id: "1", status: "done" })

// Parse PRD
mcp__task_master_ai__parse_prd({ input: "prd.txt", num_tasks: 10 })

// Expand task
mcp__task_master_ai__expand_task({ id: "1", num: 5, research: true })

// Add task
mcp__task_master_ai__add_task({
  prompt: "Implement feature X",
  priority: "high",
  dependencies: ["1", "2"]
})

// Update task
mcp__task_master_ai__update_task({ id: "1", prompt: "Additional context..." })
```

### CLI Command Reference

**Common CLI Commands:**
```bash
# List tasks
task-master list --status=pending --with-subtasks

# Get next task
task-master next

# Show task details
task-master show 1

# Set task status
task-master set-status --id=1 --status=done

# Parse PRD
task-master parse-prd --input=prd.txt --num-tasks=10

# Expand task
task-master expand --id=1 --num=5 --research

# Add task
task-master add-task --prompt="Implement feature X" --priority=high --dependencies=1,2

# Update task
task-master update-task --id=1 --prompt="Additional context..."
```

### MCP Configuration Guide

**Location:** `.mcp.json` (project root)

**Minimal Configuration:**
```json
{
  "mcpServers": {
    "task-master-ai": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-...",
        "PERPLEXITY_API_KEY": "pplx-..."
      }
    }
  }
}
```

**Using .env File:**
```json
{
  "mcpServers": {
    "task-master-ai": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
        "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}"
      }
    }
  }
}
```

**Note:** Environment variable substitution may not work in all MCP implementations. If it doesn't work, copy keys directly from `.env` file.

**Activation:**
1. Configure `.mcp.json` with valid API keys
2. Restart Claude Code
3. MCP tools will be automatically available
4. Verify with hook: "📋 Task Master MCP: Available"

## Automation Architecture

### Hook Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User: "I'm working on task 1.2"                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │ UserPromptSubmit Hook       │
    │ (taskmaster-context-loader) │
    └─────────────┬───────────────┘
                  │
                  ├──> Detects "task 1.2"
                  ├──> Loads .taskmaster/tasks/task-1.2.md
                  ├──> Displays task summary
                  └──> Passes to Claude with context

                  ▼
    ┌─────────────────────────────┐
    │ Claude Implements Task      │
    │ (edits files, writes code)  │
    └─────────────┬───────────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │ PostToolUse Hook            │
    │ (taskmaster-status-tracker) │
    └─────────────┬───────────────┘
                  │
                  ├──> Detects file edits
                  ├──> Checks pending tasks
                  ├──> Suggests status update
                  └──> Displays update commands
```

### Agent Invocation Flow

```
User Prompt → Claude Analyzes → Decides Agent Needed
                                        │
                                        ▼
                                ┌───────────────┐
                                │ Invoke Agent  │
                                └───────┬───────┘
                                        │
                        ┌───────────────┼───────────────┐
                        ▼               ▼               ▼
                ┌──────────────┐ ┌──────────┐ ┌──────────────┐
                │ task-        │ │ prd-     │ │ task-        │
                │ completer    │ │ generator│ │ expander     │
                └──────┬───────┘ └────┬─────┘ └──────┬───────┘
                       │              │              │
                       └──────────────┼──────────────┘
                                     ▼
                            ┌──────────────────┐
                            │ Agent Returns    │
                            │ [SUCCESS] Result │
                            └────────┬─────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │ Claude Presents  │
                            │ to User          │
                            └──────────────────┘
```

---

## Benefits Summary

### Time Savings

| Task | Manual | Automated | Savings |
|------|--------|-----------|---------|
| Plan → PRD | 30 min | 10 min | 67% |
| Generate tasks | 45 min | 2 min | 96% |
| Expand tasks | 30 min | 5 min | 83% |
| Setup hooks | 20 min | 5 min | 75% |
| **Total** | **2h 5m** | **22 min** | **82%** |

### Quality Improvements

- ✅ **Consistency:** All tasks follow same structure
- ✅ **Traceability:** Plan → PRD → Tasks → Code
- ✅ **Dependencies:** Automatically inferred and enforced
- ✅ **Context:** Hooks load task details automatically
- ✅ **Completeness:** Nothing missed from original plan

### Maintainability

- PRD serves as canonical source
- Tasks can be regenerated if needed
- Changes to plan → update PRD → re-parse
- Tag system isolates features
- Documentation auto-generated

---

## Troubleshooting

### Issue: Task Master generates too few tasks

**Solution:**
```bash
task-master parse-prd --input=<prd> --num-tasks=15
```

### Issue: Tasks missing dependencies

**Solution:**
```bash
# Validate dependencies
task-master validate-dependencies

# Add missing dependencies
task-master add-dependency --id=3 --depends-on=1

# Fix automatically
task-master fix-dependencies
```

### Issue: Tasks too complex (not expanded)

**Solution:**
```bash
# Analyze and get recommendations
task-master analyze-complexity --research

# Expand specific tasks
task-master expand --id=<id> --num=5 --research
```

### Issue: Hooks not activating

**Solution:**
```bash
# Check permissions
ls -la .claude/hooks/

# Make executable
chmod +x .claude/hooks/*.js

# Test hook
./.claude/hooks/taskmaster-context-loader.js
```

### Issue: Wrong tag active

**Solution:**
```bash
# Check current tag
task-master tags

# Switch to correct tag
task-master use-tag <feature-name>
```

---

## Best Practices

### DO:
✅ Create detailed PRDs with explicit dependencies
✅ Use tags for feature isolation
✅ Expand complex tasks into subtasks
✅ Update task notes frequently during implementation
✅ Test hooks and agents before starting work
✅ Document the workflow for team reference
✅ Configure MCP for better performance (when possible)
✅ Use CLI fallback when MCP isn't available

### DON'T:
❌ Skip the PRD step (AI needs structure)
❌ Parse PRD on master tag (creates conflicts)
❌ Ignore complexity analysis recommendations
❌ Mark tasks done without updating notes
❌ Mix multiple features in one tag
❌ Forget to switch tags when context switching
❌ Assume MCP is always available (have CLI fallback)
❌ Hardcode MCP vs CLI choice (use hook detection)

## MCP/CLI Fallback Strategy Summary

### Intelligent Routing System

The workflow includes automatic detection and fallback:

**1. Hook Detection (`taskmaster-invoker.js`):**
- Checks `.mcp.json` configuration
- Validates API keys are real (not placeholders)
- Informs Claude which method to use

**2. Claude's Decision:**
```
IF (MCP available AND configured):
  Use mcp__task_master_ai__ tools
ELSE:
  Use bash: task-master commands
END
```

**3. User Experience:**
- Transparent to user
- Always works (MCP or CLI)
- Better performance when MCP available
- No manual switching needed

### Configuration Examples

**MCP Configured (This Project):**
```json
// .mcp.json
{
  "mcpServers": {
    "task-master-ai": {
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-api03-...",
        "PERPLEXITY_API_KEY": "pplx-..."
      }
    }
  }
}
```

**MCP Not Configured (Fallback):**
```json
// .mcp.json missing or has placeholder keys
{
  "mcpServers": {
    "task-master-ai": {
      "env": {
        "ANTHROPIC_API_KEY": "YOUR_KEY_HERE"  // ❌ Triggers CLI fallback
      }
    }
  }
}
```

### Workflow Adaptability

Both methods work with the same workflow:

| Step | MCP | CLI | Result |
|------|-----|-----|--------|
| Parse PRD | `mcp__task_master_ai__parse_prd` | `task-master parse-prd` | ✅ Tasks generated |
| List tasks | `mcp__task_master_ai__get_tasks` | `task-master list` | ✅ Tasks displayed |
| Get next | `mcp__task_master_ai__next_task` | `task-master next` | ✅ Next task shown |
| Update | `mcp__task_master_ai__update_task` | `task-master update-task` | ✅ Task updated |

**Key Insight:** The workflow documentation works for both methods. Claude automatically adapts based on hook detection.

---

## Next Steps

1. **Try the workflow** with a small feature (1-2 hours)
2. **Refine your PRD template** based on results
3. **Create project-specific hooks** for your workflow
4. **Build custom agents** for repetitive tasks
5. **Share workflow** with team and iterate

---

**Last Updated:** 2025-11-07
**Related Docs:** [Quick_Implementation_Reference.md](Quick_Implementation_Reference.md), [diet103_Validation_System.md](diet103_Validation_System.md)
