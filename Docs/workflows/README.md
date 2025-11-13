# Workflows Library

Executable workflow templates for common development patterns.

## What is a Workflow?

A **workflow** is a reusable, documented implementation pattern that combines Orchestrator primitives (Commands, MCPs, Hooks, Agents, Skills) to accomplish a specific technical goal.

## Quick Start

1. Browse [library/](library/) for existing workflows
2. Select workflow matching your need
3. Follow `WORKFLOW.md` implementation steps
4. Customize configuration files
5. Test and validate

## Available Workflows

### MCP Integration Workflows
- [Task Master Integration](library/task-master-integration/) - Automated task management with MCP/CLI fallback

### Agent System Workflows
- Coming soon...

### Skill Composition Workflows
- Coming soon...

### Hook Automation Workflows
- Coming soon...

## Creating New Workflows

1. Copy [templates/WORKFLOW_TEMPLATE.md](templates/WORKFLOW_TEMPLATE.md)
2. Follow [Agentic Feature Selection Workflow](../Agentic_Feature_Selection_Workflow.md) decision tree
3. Document architecture and justification
4. Provide implementation steps
5. Include troubleshooting section
6. Submit PR to add to library

## Workflow vs Scenario

| Aspect | Workflow | Scenario |
|--------|----------|----------|
| **Scope** | Technical pattern | Business solution |
| **Composition** | Single-purpose | Multi-workflow |
| **Branching** | Linear | Decision-driven |
| **Audience** | Developers | Business + developers |
| **Reusability** | High | Medium (domain-specific) |

## Workflow Categories

### By Complexity
- **Simple**: Single component (Command or Hook)
- **Medium**: 2-3 components (MCP + Hook, Agent + Command)
- **Complex**: 4+ components (Skill composing multiple features)

### By Use Case
- **Integration**: Connecting external systems (MCP-focused)
- **Automation**: Event-driven processes (Hook-focused)
- **Orchestration**: Multi-step coordination (Skill-focused)
- **Processing**: Parallel execution (Agent-focused)

## Contributing

See [templates/](templates/) for standardized formats and [WORKFLOW_CREATION_GUIDE.md](../WORKFLOW_CREATION_GUIDE.md) for detailed guidance.

---

**Last Updated:** 2025-11-08
**Maintainer:** Orchestrator Project Team
