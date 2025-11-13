# Workflow Creation Guide - Complete Reference

**Purpose:** Master guide for creating workflows using the right tools (Slash Commands, MCP, Hooks, Sub-Agents, Skills).

**Version:** 1.0
**Date:** 2025-11-07
**Status:** Production Ready

---

## Quick Start Decision Flow

When creating ANY workflow, use this flow:

```
1. What are you building?
   ↓
2. Consult Decision Tree (Section: Feature Selection)
   ↓
3. Choose appropriate tool (Command/MCP/Hook/Agent/Skill)
   ↓
4. Implement using patterns (Section: Implementation)
   ↓
5. Document in workflow guide (Section: Documentation)
   ↓
6. Test and iterate (Section: Testing)
```

---

## Table of Contents

1. [Feature Selection Decision Tree](#feature-selection-decision-tree)
2. [Tool Reference](#tool-reference)
3. [Implementation Patterns](#implementation-patterns)
4. [Real-World Examples](#real-world-examples)
5. [Best Practices](#best-practices)
6. [Documentation Templates](#documentation-templates)

---

## Feature Selection Decision Tree

### The 5-Step Process

**Step 1: Single-step task?**
- YES → **Slash Command**
- NO → Continue to Step 2

**Step 2: External system/API?**
- YES → **MCP Server**
- NO → Continue to Step 3

**Step 3: Event-driven trigger?**
- YES → **Hook**
- NO → Continue to Step 4

**Step 4: Parallel/isolated execution?**
- YES → **Sub-Agent**
- NO → Continue to Step 5

**Step 5: Multi-step workflow?**
- YES → **Skill** (compose other features)
- NO → Re-evaluate from Step 1

### Visual Decision Tree

See [Agentic_Feature_Selection_Workflow.md](Agentic_Feature_Selection_Workflow.md) for detailed decision tree with visual diagrams.

---

## Tool Reference

### 1. Slash Commands

**When to use:**
- Simple, single-step operations
- User-invoked (manual trigger)
- No external dependencies
- Predictable output

**Examples:**
- `/commit` - Generate git commit message
- `/validate-docs` - Run documentation validation
- `/create-project` - Scaffold new project

**Location:** `.claude/commands/<name>.md`

**Template:**
```markdown
# /<command-name>

[Brief description of what this command does]

**Steps:**
1. [First step]
2. [Second step]
3. [Third step]

**Example Usage:**
User: "/<command-name> <args>"
```

---

### 2. MCP Servers

**When to use:**
- External system integration
- Database connections
- Third-party APIs
- Structured data operations

**Examples:**
- Task Master AI (task management)
- Database query interface
- GitHub API integration

**Location:** `.mcp.json` (configuration)

**Template:**
```json
{
  "mcpServers": {
    "<server-name>": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "<package-name>"],
      "env": {
        "API_KEY": "..."
      }
    }
  }
}
```

**Provides Tools:**
```javascript
mcp__<server>__<operation>({ param: value })
```

---

### 3. Hooks

**When to use:**
- Event-driven automation
- Auto-detection/guidance
- Context loading
- Non-blocking operations

**Examples:**
- Load task context on mention
- Detect MCP availability
- Validate files after edit

**Location:** `.claude/hooks/<name>.js`

**Hook Types:**
- **UserPromptSubmit** - Before Claude processes prompt
- **PostToolUse** - After Claude uses tools

**Template:**
```javascript
#!/usr/bin/env node

// Hook description
const userPrompt = process.env.USER_PROMPT || '';

// Detection logic
if (condition) {
  console.log('💡 Guidance message\n');
}

process.exit(0); // Non-blocking
```

---

### 4. Sub-Agents

**When to use:**
- Parallel processing
- Isolated operations
- Stateless tasks
- High-scale operations

**Examples:**
- Security audit (scan 1000+ files)
- Test failure analysis
- Code refactoring validation

**Location:** `.claude/agents/<name>/AGENT.md`

**Template:**
```markdown
# System Prompt: <Agent Name>

You are a specialized sub-agent for <purpose>.

**Role:** <specific role description>

**IMPORTANT:**
- You operate in an isolated context window
- Your response will be consumed by the Primary Agent
- Format output as structured data
- You have NO access to conversation history

**Tools Allowed:** [list]
**Tools Forbidden:** [list]

**Output Format:**
[STATUS] Brief summary. Recommendations.
```

---

### 5. Skills

**When to use:**
- Multi-step workflows
- Compose multiple features
- Domain expertise
- Auto-activation needed

**Examples:**
- Git Work Tree Manager
- Project scaffolding system
- Multi-step deployment

**Location:** `.claude/skills/<name>/`

**Structure:**
```
skill-name/
├── SKILL.md              # Main documentation
├── metadata.json         # Manifest
├── workflows/            # Sub-workflows
│   ├── create.md        # Uses slash command
│   ├── validate.md      # Uses sub-agent
│   └── sync.md          # Uses MCP
└── resources/           # Additional docs
    └── troubleshooting.md
```

**Auto-Activation:**
Via `skill-rules.json`:
```json
{
  "rules": [
    {
      "trigger_phrases": ["keyword1", "keyword2"],
      "skill": "skill_name",
      "auto_activate": true
    }
  ]
}
```

---

## Implementation Patterns

### Pattern 1: MCP with CLI Fallback

**Use Case:** Reliable external integration

**Implementation:**
1. Configure MCP in `.mcp.json`
2. Create hook to detect availability
3. Use MCP when available, CLI as fallback

**Example:**
```javascript
// Hook: taskmaster-invoker.js
if (mcpAvailable) {
  console.log('Use: mcp__task_master_ai__parse_prd');
} else {
  console.log('Use: bash task-master parse-prd');
}
```

**Benefits:**
- Always works (CLI fallback)
- Better performance (MCP when available)
- Transparent to user

**See:** [TaskMaster_MCP_CLI_Fallback.md](TaskMaster_MCP_CLI_Fallback.md)

---

### Pattern 2: Hook Triggers Sub-Agent

**Use Case:** Event-driven parallel processing

**Implementation:**
1. Hook detects condition
2. Suggests sub-agent invocation
3. Sub-agent processes in isolation
4. Reports back to Primary Agent

**Example:**
```javascript
// PostToolUse hook
if (modifiedFiles.length > 10) {
  console.log('💡 Large change detected. Consider running code analyzer sub-agent');
}
```

**Benefits:**
- Automatic detection
- Parallel processing
- Non-blocking workflow

---

### Pattern 3: Skill Composes Everything

**Use Case:** Complex workflow orchestration

**Implementation:**
1. Skill defines overall workflow
2. Uses slash commands for simple steps
3. Uses MCP for data operations
4. Uses sub-agents for complex analysis
5. Uses hooks for auto-activation

**Example:**
```markdown
# Skill: Project Manager

## Workflows

### Create Project
1. Slash command: /create-project <name>
2. MCP: project_db.checkDuplicates()
3. Sub-agent: project-scaffolder
4. Hook: project-context-loader activates

### Validate Project
1. Hook detects project mention
2. MCP: project_db.loadContext()
3. Sub-agent: project-validator runs checks
4. Present results to user
```

**Benefits:**
- Modular composition
- Reusable components
- Clear workflow structure

---

## Real-World Examples

### Example 1: Task Master Integration

**Goal:** Automated task management workflow

**Analysis:**
1. **Parse PRD** → MCP (external Task Master system)
2. **Detect MCP** → Hook (event-driven)
3. **Load context** → Hook (auto-load on mention)
4. **Complete task** → Sub-Agent (isolated workflow)
5. **Orchestrate** → Skill (compose all above)

**Result:**
```
Skill: taskmaster_assistant
├── MCP: task-master-ai (parse, list, update)
├── Hook: taskmaster-invoker (detect availability)
├── Hook: taskmaster-context-loader (auto-load)
└── Sub-Agent: task-completer (workflows)
```

**Documentation:** [TaskMaster_Integration_Workflow.md](TaskMaster_Integration_Workflow.md)

---

### Example 2: diet103 Validation

**Goal:** Validate and repair project infrastructure

**Analysis:**
1. **Validate command** → Slash Command (user-invoked)
2. **Auto-detect on switch** → Hook (event-driven)
3. **Detection logic** → Function (internal, not feature)
4. **Repair logic** → Function (called by command)

**Result:**
```
Slash Command: /validate-diet103 --repair
  ↓ Calls detection function
  ↓ Calls repair function
  ↓ Reports results

Hook: project-switch-validator
  ↓ Detects project switch
  ↓ Runs detection
  ↓ Warns if gaps found
```

**Key Insight:** Not everything needs to be a feature. Core logic can be regular functions called by features.

---

### Example 3: Documentation Workflow

**Goal:** Automated doc validation and sync

**Analysis:**
1. **Validate docs** → Slash Command (/validate-docs)
2. **Link checker** → Skill (multi-step with sub-agent)
3. **Auto-validate on edit** → Hook (PostToolUse)
4. **Sync external docs** → MCP (if external API) or Bash (if CLI)

**Result:**
```
Skill: doc-validator
├── Slash Command: /validate-docs (entry point)
├── Sub-Agent: link-checker (parallel link validation)
├── Hook: PostToolUse (auto-check after edits)
└── Bash: sync external docs (CLI tools)
```

---

## Best Practices

### DO:

✅ **Start Simple**
- Begin with slash command
- Scale only when needed
- Avoid over-engineering

✅ **Compose, Don't Duplicate**
- Skills should use existing features
- Don't reimplement MCP logic
- Reuse sub-agents across skills

✅ **Use Hooks Wisely**
- Keep hooks lightweight
- Non-blocking operations only
- Provide guidance, not processing

✅ **Document Decisions**
- Explain why you chose each tool
- Reference decision tree steps
- Include justification checklist

✅ **Test Both Paths**
- If using MCP with fallback, test both
- Verify hooks don't block
- Ensure sub-agents return structured output

---

### DON'T:

❌ **Over-Engineer**
- Don't create skill for simple operation
- Don't use sub-agent for sequential task
- Don't add MCP for local-only operations

❌ **Block Execution**
- Hooks must exit quickly (process.exit(0))
- Don't perform heavy computation in hooks
- Delegate processing to sub-agents

❌ **Ignore Fallbacks**
- Always have CLI fallback for MCP
- Don't assume MCP is available
- Test failure scenarios

❌ **Duplicate Logic**
- Skills should compose, not reimplement
- Use existing MCP tools
- Reuse slash commands

❌ **Forget Documentation**
- Every feature needs docs
- Explain composition patterns
- Include usage examples

---

## Documentation Templates

### Workflow Documentation Template

```markdown
# <Feature Name> Workflow

**Purpose:** [Brief description]
**Version:** 1.0
**Date:** YYYY-MM-DD

## Overview
[Detailed description of workflow]

## Architecture

### Components
1. **Slash Command:** /<command> - [Purpose]
2. **MCP Server:** <server> - [Purpose]
3. **Hook:** <hook-name> - [Purpose]
4. **Sub-Agent:** <agent-name> - [Purpose]
5. **Skill:** <skill-name> - [Purpose]

### Decision Justification

**Step 1 Analysis:**
- Is this single-step? [YES/NO]
- Justification: [...]

**Step 2 Analysis:**
- External system? [YES/NO]
- Justification: [...]

[Continue through decision tree]

**Final Choice:** [Tool selected]
**Reasoning:** [Detailed justification]

## Implementation

### [Component 1]
[Code/configuration]

### [Component 2]
[Code/configuration]

## Usage Examples

### Example 1: [Scenario]
```
User: [prompt]
System: [response]
```

### Example 2: [Scenario]
```
User: [prompt]
System: [response]
```

## Testing

### Test Cases
1. [Test description]
2. [Test description]

## Troubleshooting

### Issue: [Common problem]
**Solution:** [Fix]

---

**Last Updated:** YYYY-MM-DD
**Related Docs:** [Links]
```

---

### Feature Justification Template

```markdown
# Feature: <Name>

## Decision Analysis

### Step 1: Single-step task?
- **Answer:** [YES/NO]
- **Analysis:** [Explanation]
- **Decision:** [Continue/Use Slash Command]

### Step 2: External system/API?
- **Answer:** [YES/NO]
- **Analysis:** [Explanation]
- **Decision:** [Continue/Use MCP]

### Step 3: Event-driven trigger?
- **Answer:** [YES/NO]
- **Analysis:** [Explanation]
- **Decision:** [Continue/Use Hook]

### Step 4: Parallel/isolated?
- **Answer:** [YES/NO]
- **Analysis:** [Explanation]
- **Decision:** [Continue/Use Sub-Agent]

### Step 5: Multi-step workflow?
- **Answer:** [YES/NO]
- **Analysis:** [Explanation]
- **Decision:** [Use Skill/Re-evaluate]

## Final Choice

**Selected Tool:** [Slash Command/MCP/Hook/Sub-Agent/Skill]

**Justification:**
- Task complexity: [Simple/Medium/Complex]
- External integration: [YES/NO]
- Parallel execution: [YES/NO]
- Reusability: [Low/Medium/High]

**Alternatives Considered:**
1. [Alternative 1] - Rejected because [reason]
2. [Alternative 2] - Rejected because [reason]

## Implementation Plan

[Implementation details]
```

---

## Quick Reference Cards

### When to Use What

| If you need... | Use this |
|----------------|----------|
| One-off user command | Slash Command |
| External API access | MCP Server |
| Auto-detection | Hook |
| Parallel processing | Sub-Agent |
| Complex workflow | Skill |
| MCP reliability | MCP + CLI fallback |
| Event automation | Hook |
| Composition | Skill (composes others) |

---

### Tool Comparison Matrix

| Feature | Slash Cmd | MCP | Hook | Sub-Agent | Skill |
|---------|-----------|-----|------|-----------|-------|
| **Complexity** | Low | Med | Low | Med | High |
| **Auto-trigger** | No | No | Yes | No | Yes |
| **Stateful** | No | Yes | No | No | Yes |
| **External** | No | Yes | No | No | Partial |
| **Composable** | Yes | Yes | Yes | Yes | N/A |
| **Parallel** | No | No | No | Yes | No |

---

## Workflow Creation Checklist

When creating a new workflow:

- [ ] **Define Goal** - What are you building?
- [ ] **Run Decision Tree** - Which tool is appropriate?
- [ ] **Justify Choice** - Document reasoning
- [ ] **Check for Reuse** - Can you compose existing features?
- [ ] **Implement** - Follow patterns from this guide
- [ ] **Test Both Paths** - If using fallback, test both
- [ ] **Document** - Use templates above
- [ ] **Add Examples** - Show real usage
- [ ] **Consider Edge Cases** - What can go wrong?
- [ ] **Plan Maintenance** - How will this evolve?

---

## Additional Resources

### Decision Making
- [Agentic_Feature_Selection_Workflow.md](Agentic_Feature_Selection_Workflow.md) - Detailed decision tree
- [Orchestrator_PRD.md Section 3.6](Orchestrator_PRD.md#36-agentic-feature-architecture--selection) - Original specification

### Implementation Guides
- [TaskMaster_Integration_Workflow.md](TaskMaster_Integration_Workflow.md) - Complete workflow example
- [TaskMaster_MCP_CLI_Fallback.md](TaskMaster_MCP_CLI_Fallback.md) - Fallback pattern
- [diet103_Validation_System.md](diet103_Validation_System.md) - Technical specification example

### Reference
- [Quick_Implementation_Reference.md](Quick_Implementation_Reference.md) - Implementation details
- [CLI_REFERENCE.md](CLI_REFERENCE.md) - Command reference

---

## Summary

**The Right Tool for the Right Job:**

1. **Slash Commands** - Simple, manual, one-step operations
2. **MCP Servers** - External system integrations with fallback
3. **Hooks** - Event-driven automation and detection
4. **Sub-Agents** - Parallel, isolated, stateless processing
5. **Skills** - Complex workflows that compose everything above

**Golden Rule:** Start with the simplest primitive and scale only as necessary. The decision tree ensures you choose the appropriate abstraction level for each task.

**Remember:** Not every piece of logic needs to be a feature. Core functions can be called by features without being features themselves.

---

**Last Updated:** 2025-11-07
**Version:** 1.0
**Status:** Production Ready

**Maintained By:** Orchestrator Project Team
**Feedback:** Create issue or update this guide with learnings
