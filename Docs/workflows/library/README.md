# Workflows Library

Reusable technical implementation patterns using Orchestrator primitives.

## Available Workflows

### MCP Integration Workflows

#### [Task Master Integration](task-master-integration/)
**Purpose:** Automated task management with MCP/CLI fallback  
**Complexity:** Medium  
**Setup Time:** 1-2 hours  

Integrates Task Master AI for project task tracking with intelligent routing between MCP (fast) and CLI (reliable fallback).

**Key Features:**
- Automatic MCP availability detection
- CLI fallback for reliability
- Task context auto-loading via hooks
- Intelligent workflow routing

---

## Using Workflows

### Quick Start

1. Browse workflows above
2. Select one matching your need
3. Open the `WORKFLOW.md` file
4. Follow implementation steps
5. Customize configuration files

### Example: Adding Task Master to Your Project

```bash
cd your-project
cd Docs/workflows/library/task-master-integration/

# Follow WORKFLOW.md steps:
# 1. Configure .mcp.json
# 2. Install hooks
# 3. Test integration
```

---

## Creating New Workflows

1. Copy `../templates/WORKFLOW_TEMPLATE.md`
2. Follow [Agentic Feature Selection Workflow](../../Agentic_Feature_Selection_Workflow.md)
3. Document architecture and justification
4. Provide complete implementation steps
5. Add to this README

---

**Last Updated:** 2025-11-08
