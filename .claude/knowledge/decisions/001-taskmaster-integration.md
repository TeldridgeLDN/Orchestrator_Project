# ADR 001: Taskmaster Integration

**Date:** November 13-15, 2025  
**Status:** Accepted ✅  
**Decision Makers:** Tom + AI Agent

---

## Context

Orchestrator needed a task management system that could:
1. Break down PRDs into actionable tasks
2. Track dependencies between tasks
3. Manage subtasks for complex work
4. Integrate with AI agents
5. Work across multiple projects

## Decision

Integrate [Task Master AI](https://github.com/task-master-ai/task-master-ai) as the primary task management system.

## Rationale

### Why Task Master AI?

**Pros:**
- ✅ AI-powered PRD parsing
- ✅ Automatic task generation
- ✅ Dependency management
- ✅ Subtask expansion
- ✅ Research integration (Perplexity)
- ✅ MCP server for agent integration
- ✅ CLI + programmatic API
- ✅ Tagged task lists (multi-context support)

**Cons:**
- ⚠️ Learning curve for full feature set
- ⚠️ Requires API keys for AI features
- ⚠️ Additional dependency

### Alternatives Considered

1. **Plain Markdown Checklists**
   - Too manual, no automation
   - No dependency management
   - Hard to track across projects

2. **GitHub Issues/Projects**
   - External dependency
   - Not AI-integrated
   - Overkill for personal projects

3. **Linear/Asana**
   - SaaS dependency
   - Cost
   - Not AI-first

## Implementation

### Integration Points

1. **Global Rules:**
   - `taskmaster/dev_workflow.mdc` - Workflow patterns
   - `taskmaster/taskmaster.mdc` - Tool reference
   - Both synced globally to all projects

2. **CLI Helper:**
   - `orch next` → `task-master next`
   - `orch show <id>` → `task-master show <id>`
   - `orch done <id>` → `task-master set-status --id=<id> --status=done`

3. **Project Template:**
   - Auto-initializes Taskmaster in new projects
   - Includes example PRD template
   - Configures MCP integration

## Consequences

### Positive

- Systematic task breakdown
- AI assists with task generation
- Dependency tracking prevents errors
- Cross-project task management
- Integrated with daily workflow

### Negative

- One more tool to learn
- Requires API keys for full power
- Tasks.json files in Git (minor noise)

### Mitigations

- Created DAILY_WORKFLOW.md with 7 essential commands
- Simplified CLI via `orch` helper
- Pre-configured in project template
- Global rules ensure consistency

## Review Date

January 2026 - After 2 months of usage

## References

- **Task Master Repo:** https://github.com/task-master-ai/task-master-ai
- **Workflow Guide:** `DAILY_WORKFLOW.md`
- **CLI Reference:** `Docs/CLI_REFERENCE.md`
- **Rules:** `.cursor/rules/taskmaster/`

