# Agentic Feature Selection Workflow

**Purpose:** Decision framework for choosing the right tool (Slash Commands, MCP, Sub-Agents, Skills, or Hooks) when creating workflows.

**Version:** 1.0
**Date:** 2025-11-07
**Based On:** [Orchestrator_PRD.md Section 3.6](Orchestrator_PRD.md#36-agentic-feature-architecture--selection)

---

## Core Philosophy

> **Start with the simplest primitive and scale only as necessary. Avoid over-engineering solutions.**

All features are built on four foundational components:
1. **Context** - Information available
2. **Model** - AI capabilities
3. **Prompt** - Instructions
4. **Tools** - Available actions

**The Prompt is the fundamental primitive** - the building block of all agentic features.

---

## Feature Complexity Hierarchy

Listed from simplest to most complex:

```
1. Slash Commands (Simplest)    → Single-step, manual invocation
2. MCP Servers                  → External system integrations
3. Hooks                        → Event-driven automation
4. Sub-Agents                   → Isolated, parallel task execution
5. Skills (Most Complex)        → Multi-step workflows that compose other features
```

**Key Insight:** Skills should **compose** (call/leverage) other features within their modular structure to manage complex workflows.

---

## Decision Tree

Use this decision tree to select the appropriate agentic feature for any new engineering task:

```
┌────────────────────────────────────────────────────────────┐
│ Start: New Feature/Workflow Needed                        │
└──────────────────┬─────────────────────────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │ Step 1: Simple, single-step task?    │
    └──────────────┬───────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
        YES                 NO
         │                   │
         ▼                   ▼
    ┌─────────┐    ┌────────────────────────────────┐
    │ SLASH   │    │ Step 2: External system/API?   │
    │ COMMAND │    └────────┬───────────────────────┘
    └─────────┘             │
                  ┌─────────┴─────────┐
                  │                   │
                 YES                 NO
                  │                   │
                  ▼                   ▼
            ┌─────────┐    ┌────────────────────────────────┐
            │   MCP   │    │ Step 3: Event-driven trigger?  │
            │ SERVER  │    └────────┬───────────────────────┘
            └─────────┘             │
                          ┌─────────┴─────────┐
                          │                   │
                         YES                 NO
                          │                   │
                          ▼                   ▼
                    ┌─────────┐    ┌────────────────────────────────┐
                    │  HOOK   │    │ Step 4: Parallel/isolated?     │
                    └─────────┘    └────────┬───────────────────────┘
                                            │
                                  ┌─────────┴─────────┐
                                  │                   │
                                 YES                 NO
                                  │                   │
                                  ▼                   ▼
                            ┌──────────┐    ┌────────────────────────────────┐
                            │   SUB-   │    │ Step 5: Multi-step workflow?   │
                            │  AGENT   │    └────────┬───────────────────────┘
                            └──────────┘             │
                                          ┌──────────┴──────────┐
                                          │                     │
                                         YES                   NO
                                          │                     │
                                          ▼                     ▼
                                    ┌─────────┐         ┌──────────────┐
                                    │  SKILL  │         │ RE-EVALUATE  │
                                    └─────────┘         │ (Start at 1) │
                                                        └──────────────┘
```

---

## Decision Steps (Detailed)

### Step 1: Is this a simple, single-step, or one-off task?

**YES** → **Slash Command** (Prompt primitive)

**Characteristics:**
- Reusable shortcut for manual invocation
- Single, straightforward operation
- User explicitly triggers
- No complex state or dependencies

**Examples:**
- Generate a git commit message
- Format code snippet
- Create boilerplate file
- Run specific validation

**Location:** `.claude/commands/<command-name>.md`

**Implementation:**
```markdown
# /commit-message

Generate a git commit message based on current staged changes.

**Steps:**
1. Run `git diff --staged` to see changes
2. Analyze changes and categorize (feat/fix/refactor/docs)
3. Generate concise, conventional commit message
4. Present to user for approval
```

**Justification Checklist:**
- [ ] Single, focused operation?
- [ ] User-invoked (not automatic)?
- [ ] No external system integration needed?
- [ ] No complex state management?

---

### Step 2: Does the task involve connecting to an external system, API, or proprietary data source?

**YES** → **MCP Server**

**Characteristics:**
- Dedicated solution for external integrations
- Provides tools/resources to Claude
- Stateful connection to external system
- Structured data exchange

**Examples:**
- Task Master AI (task management system)
- Database query interface
- Third-party API integration
- Real-time data feeds

**Location:** Separate MCP server package (referenced in `.mcp.json`)

**Implementation:**
```json
{
  "mcpServers": {
    "task-master-ai": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "...",
        "PERPLEXITY_API_KEY": "..."
      }
    }
  }
}
```

**Provides Tools:**
- `mcp__task_master_ai__get_tasks`
- `mcp__task_master_ai__parse_prd`
- etc.

**Justification Checklist:**
- [ ] Requires external system connection?
- [ ] Provides multiple related operations?
- [ ] Benefits from persistent connection?
- [ ] Data format is well-structured?

---

### Step 3: Does the task need to trigger automatically on events?

**YES** → **Hook**

**Characteristics:**
- Event-driven automation
- Triggers on specific events (UserPromptSubmit, PostToolUse, etc.)
- Non-blocking (provides guidance/context)
- No user invocation needed

**Examples:**
- Load task context when user mentions task ID
- Detect MCP availability and inform Claude
- Validate files after edits
- Track task status changes

**Location:** `.claude/hooks/<hook-name>.js`

**Hook Types:**
- **UserPromptSubmit** - Before Claude processes prompt
- **PostToolUse** - After Claude uses tools (Edit, Write, etc.)

**Implementation:**
```javascript
#!/usr/bin/env node

// UserPromptSubmit hook - Auto-detects task mentions
const userPrompt = process.env.USER_PROMPT || '';
const taskPattern = /task\s+(\d+(?:\.\d+)?)/i;
const match = userPrompt.match(taskPattern);

if (match) {
  const taskId = match[1];
  // Load task context and display summary
  console.log(`\n📋 Task ${taskId} Context Loaded\n`);
}

process.exit(0); // Non-blocking
```

**Justification Checklist:**
- [ ] Triggers on specific events?
- [ ] Should happen automatically (not user-invoked)?
- [ ] Provides context/guidance to Claude?
- [ ] Non-blocking operation?

---

### Step 4: Does the task require high-scale or parallel execution, and must it be isolated from the main agent's context window?

**YES** → **Sub-Agent**

**Characteristics:**
- Isolate tasks that can run in parallel
- Context is lost after completion (stateless)
- Specialized, focused operations
- Reports results to Primary Agent

**Examples:**
- Comprehensive security audit (scan 1000+ files)
- Fix failing tests at scale
- Parallel code analysis
- Large-scale refactoring validation

**Location:** `.claude/agents/<agent-name>/AGENT.md`

**Implementation:**
```markdown
# System Prompt: Security Audit Agent

You are a specialized security audit sub-agent.

**Role:** Perform comprehensive security scans on the codebase and report findings back to the Primary Agent.

**IMPORTANT:**
- You operate in an isolated context window
- Your response will be consumed by the Primary Agent, not the user
- Format all output as structured data for programmatic consumption
- You have NO access to conversation history

**Tools Allowed:** bash, grep, read (read-only)
**Tools Forbidden:** edit, write, delete

**Output Format:**
[SUCCESS] Scanned 1,247 files. Found 3 critical vulnerabilities in auth module.
Recommend: Review src/auth/validator.ts:42, src/auth/session.ts:156
```

**Justification Checklist:**
- [ ] Task is specialized enough for isolation?
- [ ] Requires parallel/high-scale execution?
- [ ] Output format is structured for consumption?
- [ ] Stateless operation (no context preservation needed)?

---

### Step 5: Is this a complex, multi-step process that needs to be an automatic, reoccurring, agent-invoked workflow?

**YES** → **Skill**

**Characteristics:**
- Higher-level compositional unit
- Packages custom expertise and logic
- Composes other features (commands, agents, MCPs)
- Auto-activates based on context

**Examples:**
- Git Work Tree Manager
- Style guide violation detector
- Project scaffolding system
- Multi-step deployment workflow

**Location:** `.claude/skills/<skill-name>/`

**Structure:**
```
skill-name/
├── SKILL.md              # Main skill documentation
├── metadata.json         # Skill manifest
├── workflows/            # Sub-workflows
│   ├── create.md        # Uses slash command
│   ├── validate.md      # Uses sub-agent
│   └── sync.md          # Uses MCP
└── resources/           # Additional resources
    └── troubleshooting.md
```

**Implementation:**
```markdown
# Skill: Git Work Tree Manager

## Overview
Manages git worktrees with validation, cleanup, and synchronization.

## Workflows
- **create.md** - Uses: git_worktree_create slash command
- **validate.md** - Uses: worktree_validator sub-agent
- **sync.md** - Uses: git_status MCP for real-time state

## Auto-Activation
Triggers on: "worktree", "work tree", "parallel development"
```

**Justification Checklist:**
- [ ] Multi-step workflow required?
- [ ] Composes multiple other features?
- [ ] Needs auto-activation based on context?
- [ ] Provides domain expertise/logic?

---

## Integration with Task Master Workflow

### Applying Decision Tree to Task Master Integration

**Goal:** Create automation for Task Master PRD → tasks workflow

**Decision Process:**

1. **Parse PRD** (User request: "Convert PRD to tasks")
   - Step 1: Single-step? **NO** (requires AI processing)
   - Step 2: External system? **YES** → **MCP Server**
   - **Choice:** `mcp__task_master_ai__parse_prd`
   - **Fallback:** CLI `task-master parse-prd`

2. **Detect MCP Availability** (Automatic context guidance)
   - Step 1: Single-step? **YES**
   - **But** needs automatic trigger → Continue
   - Step 3: Event-driven? **YES** → **Hook**
   - **Choice:** `taskmaster-invoker.js` (UserPromptSubmit)

3. **Load Task Context** (When user mentions task)
   - Step 1: Single-step? **YES**
   - **But** needs automatic trigger → Continue
   - Step 3: Event-driven? **YES** → **Hook**
   - **Choice:** `taskmaster-context-loader.js` (UserPromptSubmit)

4. **Complete Task Workflow** (Guide through completion)
   - Step 1: Single-step? **NO** (multi-step)
   - Step 2: External system? **NO**
   - Step 3: Event-driven? **NO**
   - Step 4: Parallel/isolated? **YES** → **Sub-Agent**
   - **Choice:** `task-completer` agent
   - **Reason:** Isolated workflow with structured output

5. **PRD Generation** (Convert plan to PRD)
   - Step 1: Single-step? **NO** (requires analysis)
   - Step 2: External system? **NO**
   - Step 3: Event-driven? **NO**
   - Step 4: Parallel/isolated? **YES** → **Sub-Agent**
   - **Choice:** `prd-generator` agent
   - **Reason:** One-shot transformation, stateless

6. **Task Master Assistant** (Overall coordination)
   - Step 1: Single-step? **NO**
   - Step 2: External system? **Partially** (uses MCP)
   - Step 3: Event-driven? **Partially** (uses hooks)
   - Step 4: Parallel? **NO**
   - Step 5: Multi-step workflow? **YES** → **Skill**
   - **Choice:** `taskmaster_assistant` skill
   - **Composition:**
     - Uses MCP tools for task operations
     - Uses hooks for auto-detection
     - Uses sub-agents for complex operations

---

## Composition Patterns

### Pattern 1: Skill Composes Everything

**Use Case:** Complex workflow manager

```
Skill: Project Manager
├── Uses Slash Command: /create-project
├── Uses MCP: project_db for data
├── Uses Hook: project-context-loader
└── Uses Sub-Agent: project-validator
```

**Example:**
```markdown
# Skill: Project Manager

## Workflows

### Create Project Workflow
1. User invokes: `/create-project <name>`
2. Slash command validates name
3. MCP `project_db` checks for duplicates
4. Sub-agent `project-scaffolder` creates structure
5. Hook `project-context-loader` activates on next prompt

### Validate Project Workflow
1. Hook detects project mention
2. Skill loads project context via MCP
3. Sub-agent `project-validator` runs checks
4. Results presented to user
```

---

### Pattern 2: Hook Triggers Sub-Agent

**Use Case:** Event-driven parallel processing

```
Hook: PostToolUse
  ↓ (detects large code changes)
  ↓
Sub-Agent: Code Analyzer
  ↓ (parallel analysis)
  ↓
Report to Primary Agent
```

**Example:**
```javascript
// PostToolUse hook
if (modifiedFiles.length > 10) {
  console.log('🤖 Large change detected. Invoking code analyzer...');
  // Trigger sub-agent invocation
}
```

---

### Pattern 3: MCP with CLI Fallback

**Use Case:** Reliable external integration

```
Hook: Detects MCP availability
  ↓
  ├─> MCP Available → Use mcp__tool
  └─> MCP Unavailable → Use bash: cli-command
```

**Example:**
```javascript
// Hook determines method
const mcpAvailable = checkMCPAvailability();

if (mcpAvailable) {
  console.log('💡 Use: mcp__task_master_ai__parse_prd');
} else {
  console.log('💡 Use: bash: task-master parse-prd');
}
```

---

## Common Pitfalls to Avoid

### ❌ Over-Engineering

**Problem:** Using a Skill when a Slash Command would suffice

**Example:**
```
❌ BAD: Create entire skill for simple git commit
✅ GOOD: Use slash command /commit
```

**Rule:** Start simple, scale only when needed

---

### ❌ Wrong Tool for the Job

**Problem:** Using Sub-Agent for sequential workflow

**Example:**
```
❌ BAD: Sub-agent for multi-step wizard (needs context)
✅ GOOD: Skill with multiple workflows
```

**Rule:** Sub-agents are stateless - use skills for stateful workflows

---

### ❌ Missing Composition

**Problem:** Duplicating functionality instead of composing

**Example:**
```
❌ BAD: Skill reimplements MCP functionality
✅ GOOD: Skill uses MCP tools in workflows
```

**Rule:** Skills should compose existing features, not duplicate them

---

### ❌ Hook Overload

**Problem:** Hook doing too much work (blocking)

**Example:**
```
❌ BAD: Hook performs complex analysis (blocks prompt)
✅ GOOD: Hook detects need, sub-agent does analysis
```

**Rule:** Hooks should be lightweight detectors, not processors

---

## Practical Examples

### Example 1: diet103 Validation System

**Feature:** Validate and repair diet103 infrastructure

**Decision Process:**

1. **Detection** (Check for components)
   - Step 1: Single-step? **NO** (12 components to check)
   - Step 2: External system? **NO**
   - Step 3: Event-driven? **NO**
   - Step 4: Parallel? **NO** (sequential checks)
   - Step 5: Multi-step? **NO** (just detection logic)
   - **Choice:** Regular function (not a feature)
   - **Justification:** Core logic, not user-facing

2. **Validate Command** (User invokes validation)
   - Step 1: Single-step? **YES** (user runs one command)
   - **Choice:** Slash Command `/validate-diet103`
   - **Justification:** Single invocation, predictable output

3. **Auto-Repair** (Fix infrastructure gaps)
   - Step 1: Single-step? **NO** (multiple components to install)
   - Step 2: External system? **NO**
   - Step 3: Event-driven? **NO**
   - Step 4: Parallel? **NO** (sequential installation)
   - Step 5: Multi-step? **NO** (part of validate command)
   - **Choice:** Function called by slash command
   - **Justification:** Internal logic, not separate feature

4. **Auto-Detect on Switch** (Check before project switch)
   - Step 1: Single-step? **YES** (just check)
   - Step 3: Event-driven? **YES** → **Hook**
   - **Choice:** Hook on project switch event
   - **Justification:** Automatic trigger, non-blocking

**Architecture:**
```
Hook: project-switch-validator.js
  ↓ (detects project switch)
  ↓ Runs detection function
  ↓ If gaps found
  ↓
Slash Command: /validate-diet103 --repair
  ↓ Runs validation
  ↓ Calls repair function
  ↓ Reports results
```

---

### Example 2: Task Master Workflow Automation

**Feature:** Automated task management workflow

**Decision Process:**

1. **Parse PRD** (Convert PRD to tasks)
   - Step 2: External system? **YES** (Task Master API)
   - **Choice:** MCP Server
   - **Tools:** `mcp__task_master_ai__parse_prd`

2. **Detect MCP** (Check if MCP available)
   - Step 3: Event-driven? **YES** (on task-related prompts)
   - **Choice:** Hook
   - **Implementation:** `taskmaster-invoker.js`

3. **Load Task Context** (Show task details when mentioned)
   - Step 3: Event-driven? **YES** (on "task 1.2" mention)
   - **Choice:** Hook
   - **Implementation:** `taskmaster-context-loader.js`

4. **Complete Task** (Multi-step completion workflow)
   - Step 4: Parallel? **YES** (isolated workflow)
   - **Choice:** Sub-Agent
   - **Implementation:** `task-completer` agent

5. **Overall Coordination** (Skill that ties it all together)
   - Step 5: Multi-step workflow? **YES**
   - **Choice:** Skill
   - **Composition:**
     - Uses MCP for operations
     - Uses hooks for detection
     - Uses sub-agents for workflows

**Architecture:**
```
Skill: taskmaster_assistant
├── Uses MCP: task-master-ai (data operations)
├── Uses Hook: taskmaster-invoker (detection)
├── Uses Hook: taskmaster-context-loader (auto-load)
└── Uses Sub-Agent: task-completer (workflows)
```

---

## Quick Reference Decision Matrix

| Feature Type | Invocation | Complexity | Stateful | External | Best For |
|--------------|-----------|------------|----------|----------|----------|
| **Slash Command** | Manual | Simple | No | No | One-off operations |
| **MCP Server** | Automatic | Medium | Yes | Yes | External integrations |
| **Hook** | Event | Simple | No | No | Auto-detection/guidance |
| **Sub-Agent** | Delegated | Medium | No | No | Parallel/isolated tasks |
| **Skill** | Context | High | Yes | Partial | Multi-step workflows |

---

## Workflow Creation Checklist

When creating a new workflow, ask:

1. **What triggers it?**
   - [ ] User command → Slash Command
   - [ ] Event → Hook
   - [ ] Context → Skill

2. **Does it need external data?**
   - [ ] Yes → MCP Server
   - [ ] No → Continue

3. **Is it stateful?**
   - [ ] Yes → Skill or MCP
   - [ ] No → Slash Command or Sub-Agent

4. **Does it compose other features?**
   - [ ] Yes → Skill
   - [ ] No → Simpler primitive

5. **Can it be done in one step?**
   - [ ] Yes → Slash Command
   - [ ] No → Continue down tree

---

## Summary

**The Right Tool for the Right Job:**

1. **Slash Commands** - Simple, manual, one-step operations
2. **MCP Servers** - External system integrations
3. **Hooks** - Event-driven automation and detection
4. **Sub-Agents** - Parallel, isolated, stateless processing
5. **Skills** - Complex workflows that compose everything above

**Remember:** Start simple, scale only when necessary. The decision tree ensures you choose the appropriate abstraction level for each task.

---

**Last Updated:** 2025-11-07
**Based On:** [Orchestrator_PRD.md Section 3.6](Orchestrator_PRD.md#36-agentic-feature-architecture--selection)
**Related Docs:**
- [TaskMaster_Integration_Workflow.md](TaskMaster_Integration_Workflow.md) - Workflow implementation
- [TaskMaster_MCP_CLI_Fallback.md](TaskMaster_MCP_CLI_Fallback.md) - MCP/CLI strategy
- [Orchestrator_PRD.md](Orchestrator_PRD.md) - Complete specification
