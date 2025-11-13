# Orchestrator + TaskMaster Workflow

**Date:** November 10, 2025  
**Status:** ✅ Production Ready  
**Scope:** Simplified three-layer workflow for solo development

---

## Overview

This workflow uses three integrated tools:

1. **Orchestrator** - Multi-project context management
2. **TaskMaster AI** - Detailed task planning and tracking
3. **Claude Code** - AI-powered implementation

---

## Tool Responsibilities

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **Orchestrator** | Switch between projects, maintain project isolation | When changing projects |
| **TaskMaster AI** | Plan tasks, manage dependencies, track progress | Daily planning & task management |
| **Claude Code** | Implement features, write code | Continuous during development |

---

## Daily Workflow

### Morning: Planning Phase

```bash
# 1. Switch to your active project (if needed)
cd /Users/tomeldridge/portfolio-redesign

# 2. Review task status
task-master list

# 3. Check tags (epics)
task-master tags

# 4. Get next task
task-master next

# Example output:
# ┌─────────────────────────────────────────────┐
# │ NEXT TASK                                   │
# ├─────────────────────────────────────────────┤
# │ ID: 15                                      │
# │ Title: Establish A/B Testing Foundations   │
# │ Tag: monzo-enhancements                     │
# │ Status: pending                             │
# │ Priority: high                              │
# │ Dependencies: ✅ #3                         │
# └─────────────────────────────────────────────┘
```

### During Work: Implementation Phase

```bash
# 1. View detailed task information
task-master show 15

# 2. Start working (Claude Code helps implement)
# - Review task details
# - Check subtasks
# - Implement features
# - Test as you go

# 3. Log progress on subtasks
task-master update-subtask --id=15.1 --prompt="Completed Mailchimp API integration. Working implementation with test events."

# 4. Mark subtasks complete
task-master set-status --id=15.1 --status=done
```

### Evening: Review & Planning

```bash
# 1. Mark main task complete
task-master set-status --id=15 --status=done

# 2. Review completed work
task-master list --status done

# 3. Preview tomorrow's work
task-master next

# 4. Check overall progress
task-master list --tag validation
task-master list --tag monzo-enhancements
```

---

## Working with Tags (Epics)

### Current Portfolio-Redesign Tags:

#### 1. `validation` - Validation Subdomain
**Purpose:** Build landing page validation service  
**Progress:** 50% (10/20 tasks)  
**Priority:** High

```bash
# Switch to validation work
task-master use-tag validation
task-master next

# View all validation tasks
task-master list --tag validation --status pending
```

**Key Tasks:**
- Social proof section
- FAQ section
- Email automation
- Lead magnet PDF
- Booking system integration

#### 2. `monzo-enhancements` - Monzo UX Principles
**Purpose:** Apply Monzo design excellence  
**Progress:** 20% (3/15 tasks)  
**Priority:** Medium

```bash
# Switch to Monzo work
task-master use-tag monzo-enhancements
task-master next

# View all Monzo tasks
task-master list --tag monzo-enhancements --status pending
```

**Key Tasks:**
- Magic moments implementation
- Thoughtful friction checkpoints
- A/B testing infrastructure
- Analytics tracking
- Component library

#### 3. `master` - Foundation Setup
**Status:** ✅ 100% Complete  
**Use:** Reference only

```bash
# View completed foundation work
task-master use-tag master
task-master list --status done
```

---

## Multi-Project Workflow

### Scenario: Working on Multiple Projects

When you need to switch between projects (e.g., portfolio-redesign → Orchestrator):

```bash
# Terminal 1: Portfolio-Redesign
cd /Users/tomeldridge/portfolio-redesign
task-master next
# Work on portfolio tasks...

# Terminal 2: Orchestrator Project
cd /Users/tomeldridge/Orchestrator_Project
task-master next
# Work on orchestrator tasks...
```

**Benefits:**
- Separate TaskMaster contexts per project
- Isolated git repositories
- No task interference
- Clean context switching

---

## TaskMaster Quick Reference

### Essential Commands

```bash
# Planning
task-master list                    # View all tasks
task-master next                    # Get next available task
task-master show <id>               # View task details
task-master tags                    # List all tags

# Execution
task-master use-tag <name>          # Switch to tag context
task-master set-status --id=<id> --status=done
task-master update-subtask --id=<id> --prompt="..."

# Analysis
task-master analyze-complexity      # Analyze task complexity
task-master expand --id=<id>        # Break down complex tasks
task-master expand --all            # Expand all eligible tasks

# Management
task-master add-task --prompt="..." # Add new task
task-master add-dependency --id=<id> --depends-on=<id>
task-master validate-dependencies   # Check for issues
```

### MCP Tools (Alternative)

When working in Claude Code, you can also use MCP tools:

```javascript
// Planning
mcp_taskmaster-ai_get_tasks({projectRoot: "..."})
mcp_taskmaster-ai_next_task({projectRoot: "..."})
mcp_taskmaster-ai_get_task({id: "15", projectRoot: "..."})

// Execution
mcp_taskmaster-ai_set_task_status({id: "15", status: "done", projectRoot: "..."})
mcp_taskmaster-ai_update_subtask({id: "15.1", prompt: "...", projectRoot: "..."})
```

---

## Task Breakdown Strategy

### When to Break Down Tasks

Use `task-master expand` when a task:
- Has complexity score 7+ (from analyze-complexity)
- Takes more than 4 hours to implement
- Has multiple distinct steps
- Involves multiple files/systems
- Needs staged implementation

### Example: Breaking Down Task #15

```bash
# 1. Analyze complexity
task-master analyze-complexity --research

# 2. Review report
task-master complexity-report

# Result: Task #15 scored 8/10 - Recommended for expansion

# 3. Expand into subtasks
task-master expand --id=15 --research

# Result: Created 7 subtasks:
# 15.1 - Mailchimp API integration
# 15.2 - Webhook receiver setup
# 15.3 - Plausible goals configuration
# 15.4 - Variant tracking system
# 15.5 - Testing infrastructure
# 15.6 - Documentation
# 15.7 - Analytics dashboard
```

---

## Dependency Management

### Adding Dependencies

```bash
# Task #13 (email automation) depends on Task #11 (social proof)
task-master add-dependency --id=13 --depends-on=11

# Now task #13 won't show in `next` until #11 is done
```

### Validating Dependencies

```bash
# Check for circular dependencies or broken links
task-master validate-dependencies

# Auto-fix issues
task-master fix-dependencies
```

---

## Progress Tracking

### View Progress by Tag

```bash
# Validation subdomain progress
task-master list --tag validation | grep -E "done|pending"

# Monzo enhancements progress
task-master list --tag monzo-enhancements | grep -E "done|pending"
```

### Generate Progress Report

```bash
# Get complexity analysis with progress
task-master analyze-complexity --research
task-master complexity-report

# Shows:
# - Tasks completed
# - Complexity scores
# - Recommended expansions
# - Estimated effort remaining
```

---

## Git Integration

### Workflow with Git

```bash
# 1. Start new task
task-master next
# Returns: Task #11 - Implement social proof

# 2. Create feature branch
git checkout -b task-11-social-proof

# 3. Implement (with Claude Code)
# ... code changes ...

# 4. Commit
git add .
git commit -m "feat: implement social proof section (task #11)"

# 5. Mark complete
task-master set-status --id=11 --status=done

# 6. Merge to main
git checkout main
git merge task-11-social-proof
git branch -d task-11-social-proof
```

---

## Best Practices

### 1. Tag Organization

Use tags to represent high-level epics/features:
- ✅ `validation` - Validation subdomain development
- ✅ `monzo-enhancements` - UX improvements
- ✅ `reddit-campaign` - Marketing content generation
- ✅ `analytics` - Tracking and metrics

### 2. Task Granularity

**Good Task Size:**
- 2-4 hours to implement
- Clear deliverable
- Testable independently
- Single responsibility

**Too Large:** Break down with `expand`  
**Too Small:** Combine into single task

### 3. Dependency Discipline

Always add dependencies when:
- Task B requires Task A's output
- Task B builds on Task A's foundation
- Task B tests Task A's functionality

### 4. Progress Logging

Use `update-subtask` to log:
- Implementation decisions
- What worked / didn't work
- Blockers encountered
- Solutions discovered
- Timestamps for history

---

## Common Scenarios

### Scenario 1: Starting a New Feature

```bash
# 1. Create main task
task-master add-task --prompt="Create email automation system for lead nurturing" --research

# 2. Analyze complexity
task-master analyze-complexity --research

# 3. Expand into subtasks
task-master expand --id=20 --research

# 4. Start first subtask
task-master next
```

### Scenario 2: Handling Implementation Drift

When implementation differs from plan:

```bash
# Update future tasks to reflect new approach
task-master update --from=21 --prompt="Switched from Mailchimp to ConvertKit. Update all email-related tasks accordingly."

# Or update single task
task-master update-task --id=22 --prompt="Now using ConvertKit API instead of Mailchimp"
```

### Scenario 3: Blocked by External Dependency

```bash
# Mark task as blocked
task-master set-status --id=23 --status=blocked

# Add note explaining blocker
task-master update-task --id=23 --prompt="Blocked: Waiting for ConvertKit API key approval (requested 2025-11-10)"

# Work on different task
task-master next
```

---

## Troubleshooting

### Issue: "No tasks available"

**Check:**
```bash
# View all tasks (including blocked/done)
task-master list

# Check current tag
task-master tags

# Switch to different tag
task-master use-tag validation
```

### Issue: "Task X depends on Y which is pending"

**Solution:**
```bash
# Complete dependency first
task-master show Y
task-master set-status --id=Y --status=done

# Or remove dependency if no longer needed
task-master remove-dependency --id=X --depends-on=Y
```

### Issue: "MCP tools not available"

**Fix:**
```bash
# Restart Claude Code (MCP loads on startup)
# Close Claude Code completely (Cmd+Q on Mac)
# Reopen in your project directory
```

---

## File Locations

### Configuration Files

```
portfolio-redesign/
├── .taskmaster/
│   ├── tasks/
│   │   ├── tasks.json          # Main task database
│   │   └── task-*.md          # Individual task files
│   ├── config.json             # AI model configuration
│   ├── state.json              # Current tag context
│   └── reports/
│       └── task-complexity-report.json
├── .cursor/
│   └── mcp.json                # MCP server configuration
└── .env                        # API keys

Orchestrator_Project/
├── .taskmaster/                # Separate task context
├── .cursor/mcp.json            # Separate MCP config
└── .env                        # Separate API keys
```

### Important Files

- `tasks.json` - Never edit manually, use TaskMaster commands
- `.mcp.json` - Validated by Orchestrator on project registration
- `state.json` - Tracks current tag context
- `config.json` - AI model settings (use `task-master models`)

---

## Integration with Orchestrator

### Project Registration

When registering new projects with Orchestrator:

```bash
# Register existing project
claude register /path/to/project

# Orchestrator automatically:
# 1. Validates project structure
# 2. Checks MCP configuration
# 3. Auto-fixes MCP issues
# 4. Registers project for context switching
```

### Context Switching

```bash
# Switch to portfolio-redesign
claude switch portfolio-redesign

# Switch to orchestrator
claude switch orchestrator

# Each project maintains its own:
# - TaskMaster context
# - Git repository
# - MCP configuration
# - Task tags
```

---

## Summary

### Three-Layer Workflow

```
Level 1: Orchestrator (Project Management)
  └─> Switch between: portfolio-redesign, Orchestrator_Project, etc.
  
Level 2: TaskMaster AI (Task Planning)
  └─> Tags: validation, monzo-enhancements, master
      └─> Tasks: #1-#38 with dependencies
          └─> Subtasks: #15.1, #15.2, etc.
  
Level 3: Claude Code (Implementation)
  └─> Write code, run tests, commit changes
```

### Key Benefits

- ✅ **Clear separation of concerns** - Each tool has specific role
- ✅ **No tool overlap** - No redundancy or confusion
- ✅ **Simple workflow** - Easy to learn and maintain
- ✅ **Solo-optimized** - No unnecessary overhead
- ✅ **MCP-powered** - Seamless TaskMaster integration
- ✅ **Git-friendly** - Natural integration with version control

---

## Related Documentation

- **Orchestrator Architecture:** `Docs/ARCHITECTURE.md`
- **TaskMaster Integration:** `Docs/TaskMaster_Integration_Workflow.md`
- **MCP Configuration:** `MCP_VALIDATION_IMPLEMENTATION.md`
- **MCP Testing:** `MCP_TEST_RESULTS.md`

---

**Last Updated:** November 10, 2025  
**Status:** ✅ Production Ready  
**Next Review:** After 2 weeks of usage


