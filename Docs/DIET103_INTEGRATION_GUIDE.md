# diet103 Integration Guide

Complete guide to integrating the Orchestrator Project with diet103 specification and creating diet103-compliant projects.

## Table of Contents

- [Overview](#overview)
- [diet103 Specification](#diet103-specification)
- [Orchestrator's diet103 Implementation](#orchestrators-diet103-implementation)
- [Creating diet103 Projects](#creating-diet103-projects)
- [Component Architecture](#component-architecture)
- [Scenario-Based Workflow](#scenario-based-workflow)
- [PAI Pattern Integration](#pai-pattern-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Orchestrator Project fully implements the diet103 specification, providing tools and workflows for creating, managing, and deploying diet103-compliant AI assistant projects.

### What is diet103?

diet103 is a lightweight specification for structuring AI coding assistants like Claude Code. It emphasizes:

- **Modularity**: Skills, commands, hooks, and agents as independent components
- **Auto-activation**: Natural language triggers for skill activation
- **Progressive Disclosure**: Load only what's needed, when it's needed
- **PAI Pattern**: Prompt as Interface for natural interaction
- **Token Efficiency**: Minimal context overhead

### Why diet103?

Traditional approaches load entire codebases into context, consuming thousands of tokens. diet103 provides:

- **Reduced Token Usage**: 70-90% reduction through selective loading
- **Faster Response Times**: Less context to process
- **Better Organization**: Clear component boundaries
- **Reusable Components**: Skills and commands work across projects
- **Natural Interaction**: Conversational triggers instead of rigid commands

---

## diet103 Specification

### Core Components

#### 1. **Skills** (`.claude/skills/`)

Containerized capabilities that auto-activate based on natural language triggers.

**Structure:**
```
~/.claude/skills/<skill-name>/
├── SKILL.md              # Skill documentation (<500 lines)
├── metadata.json         # Skill metadata and configuration
└── workflows/            # Optional workflow definitions
    └── *.md
```

**metadata.json Example:**
```json
{
  "name": "scenario_manager",
  "version": "1.0.0",
  "description": "Manage scenario lifecycle",
  "triggers": {
    "keywords": ["scenario", "workflow", "scaffold"],
    "patterns": ["create scenario", "list scenarios"]
  },
  "dependencies": {
    "mcps": [],
    "skills": []
  },
  "token_budget": 500
}
```

**Characteristics:**
- **<500 lines** per skill file (diet103 rule)
- **Auto-activation** based on trigger patterns
- **Progressive disclosure** - load only when needed
- **Token efficient** - metadata always loaded, content on-demand

#### 2. **Commands** (`.claude/commands/`)

Slash commands that orchestrate workflows.

**Structure:**
```markdown
# /command-name

Brief description of what this command does.

## Prerequisites

- List required skills
- List required MCPs
- Any other dependencies

## Steps

1. First step
2. Second step
3. Third step

## Usage

```bash
/command-name [arguments]
```

## Examples

```bash
/create-scenario my-scenario
```

## Expected Output

Description of what the command produces.
```

**Characteristics:**
- **Explicit user invocation** via `/` prefix
- **Orchestration** - delegates to skills
- **Step-by-step** workflow documentation
- **Clear output** expectations

#### 3. **Hooks** (`.claude/hooks/`)

Lifecycle event handlers that run automatically.

**Types:**
- `UserPromptSubmit` - Runs before processing user input
- `PostToolUse` - Runs after tool execution
- `PreResponse` - Runs before generating response
- `PostResponse` - Runs after response generation

**Structure:**
```javascript
#!/usr/bin/env node

// Hook logic
const result = validateInput(userPrompt);

if (result.hasErrors) {
  console.error('Validation failed:', result.errors);
  // Non-blocking by default
}

// Exit with status
process.exit(0);
```

**Characteristics:**
- **Executable** scripts (`.js`, `.sh`, `.py`)
- **Non-blocking** by default (exit 0)
- **Blocking** optional (exit 1)
- **Context-aware** - receives event data

#### 4. **Agents** (`.claude/agents/`)

Autonomous task executors with multi-phase workflows.

**Structure:**
```
~/.claude/agents/<agent-name>/
├── AGENT.md              # Agent documentation
├── phases/               # Phase definitions
│   ├── discover.md
│   ├── analyze.md
│   └── report.md
└── templates/            # Output templates
    └── report-template.md
```

**UFC Pattern (User, Function, Context):**
```markdown
# Agent Name

## USER
Who this agent serves and what problems it solves.

## FUNCTION
What autonomous tasks this agent performs.

## CONTEXT
When and how to invoke this agent.
```

**Characteristics:**
- **Autonomous execution** - runs without user intervention
- **Multi-phase** - structured workflow phases
- **Quality gates** - validation between phases
- **Structured output** - consistent report format

---

## Orchestrator's diet103 Implementation

The Orchestrator Project provides comprehensive tooling for diet103:

### 1. **Scenario System**

Declarative YAML definitions for recurring workflows.

**Features:**
- Create scenarios from templates
- Validate scenario structure
- Generate diet103 components from scenarios
- Deploy scenarios to environments

**Commands:**
```bash
diet103 scenario create        # Create new scenario
diet103 scenario validate      # Validate scenario YAML
diet103 scenario scaffold      # Generate diet103 components
diet103 scenario deploy        # Deploy to environment
```

**See:** [SCENARIO_CLI.md](./SCENARIO_CLI.md)

### 2. **Component Scaffolding**

Automated generation of diet103 components from scenarios.

**Generates:**
- Skills with SKILL.md and metadata.json
- Slash commands with full documentation
- Hooks with validation logic
- MCP configuration snippets

**Example:**
```bash
# Create scenario
diet103 scenario create --template advanced --name client-intake

# Generate components
diet103 scenario scaffold client-intake

# Result:
# ~/.claude/skills/client_intake/
# ~/.claude/commands/client-intake.md
# ~/.claude/hooks/client_intake_hook.js
```

### 3. **Validation System**

Multi-layer validation for diet103 compliance.

**Validates:**
- YAML syntax and schema
- Component structure
- Dependencies and relationships
- File size limits (<500 lines)
- Naming conventions
- Token budgets

**Commands:**
```bash
diet103 scenario validate my-scenario       # Validate scenario
diet103 validate-mcp .mcp.json             # Validate MCP config
```

### 4. **Template Library**

Pre-built templates for common patterns.

**Available Templates:**
- `basic` - Simple manual trigger workflow
- `advanced` - Full-featured hybrid trigger
- `custom` - Empty starting point

**Location:** `~/.claude/scenarios/templates/`

### 5. **Project PRD Template**

Structured template for planning diet103 projects.

**Template:** `.taskmaster/templates/diet103_project_prd.txt`

**Sections:**
- Project Overview
- Core Features
- Required Skills
- Required Agents
- Required Commands
- Required Hooks
- Technical Architecture
- Development Roadmap

**Usage:**
```bash
# Copy template
cp .taskmaster/templates/diet103_project_prd.txt my-project-prd.txt

# Fill out sections
nano my-project-prd.txt

# Generate tasks
task-master parse-prd my-project-prd.txt
```

---

## Creating diet103 Projects

### Quick Start

#### 1. **Initialize Project Structure**

```bash
# Create project directory
mkdir my-diet103-project
cd my-diet103-project

# Create Claude directory
mkdir -p .claude/{skills,commands,hooks,agents,scenarios}

# Create configuration files
touch .claude/metadata.json
touch .claude/skill-rules.json
touch .claude/settings.local.json
```

#### 2. **Create metadata.json**

```json
{
  "project": {
    "name": "My diet103 Project",
    "version": "1.0.0",
    "description": "AI-enhanced project following diet103 specification"
  },
  "team": {
    "lead": "Your Name",
    "members": []
  },
  "diet103": {
    "version": "1.0.0",
    "compliance": true
  }
}
```

#### 3. **Create skill-rules.json**

```json
{
  "skills": [],
  "auto_activation": {
    "enabled": true,
    "confidence_threshold": 0.7
  },
  "token_budget": {
    "total": 5000,
    "per_skill": 500
  }
}
```

#### 4. **Create settings.local.json**

```json
{
  "allowedTools": [
    "read_file",
    "search_replace",
    "grep",
    "run_terminal_cmd"
  ],
  "maxContextSize": 100000,
  "diet103": {
    "enabled": true,
    "strictMode": false
  }
}
```

### Using the Scenario System

#### 1. **Create a Scenario**

```bash
diet103 scenario create --template advanced --name my-workflow
```

**Produces:** `~/.claude/scenarios/my-workflow.yaml`

#### 2. **Edit Scenario**

```yaml
scenario:
  name: my-workflow
  description: "My custom workflow"
  category: business_process
  version: "1.0.0"
  
  trigger:
    type: hybrid
    command: /my-workflow
    keywords: ["workflow", "process"]
    schedule:
      cron: "0 9 * * 1"  # Monday 9am
      
  steps:
    - id: step_1
      type: manual
      action: "Gather requirements"
      dependencies: []
      
    - id: step_2
      type: api_call
      action: "Process data"
      dependencies: [step_1]
      mcps: ["data-processor-mcp"]
      
  generates:
    skills: ["my_workflow"]
    commands: ["/my-workflow"]
    hooks: []
```

#### 3. **Validate Scenario**

```bash
diet103 scenario validate my-workflow
```

**Output:**
```
🔍 Validation Results

✅ YAML Syntax: Valid
✅ Schema: Valid
✅ Dependencies: Valid
✅ Step IDs: Unique

✅ All validations passed!
```

#### 4. **Scaffold Components**

```bash
# Preview first
diet103 scenario scaffold my-workflow --dry-run

# Generate components
diet103 scenario scaffold my-workflow
```

**Generates:**
```
~/.claude/
├── skills/my_workflow/
│   ├── SKILL.md
│   └── metadata.json
├── commands/my-workflow.md
└── [MCP config for manual merge]
```

#### 5. **Test Components**

```bash
# Restart Claude Code to load components
# Then test:
# 1. Mention "workflow" in conversation (auto-activate skill)
# 2. Run /my-workflow command
# 3. Verify hook execution
```

---

## Component Architecture

### Skill Lifecycle

```
1. Auto-Activation Detection
   ↓
2. Metadata Load (always in context)
   ↓
3. Trigger Match? → No → Skip
   ↓ Yes
4. Load SKILL.md content
   ↓
5. Execute skill logic
   ↓
6. Unload on completion (free tokens)
```

### Command Execution Flow

```
User: /command-name args
   ↓
1. Parse command and arguments
   ↓
2. Load command documentation
   ↓
3. Check prerequisites (skills, MCPs)
   ↓
4. Execute step-by-step workflow
   ↓
5. Delegate to skills as needed
   ↓
6. Return structured output
```

### Hook Event Flow

```
Event Trigger (e.g., UserPromptSubmit)
   ↓
1. Load hook script
   ↓
2. Pass event data to hook
   ↓
3. Execute hook logic
   ↓
4. Collect hook output
   ↓
5. Continue/Block based on exit code
```

### Agent Execution Flow

```
Agent Invocation
   ↓
1. Load agent definition (AGENT.md)
   ↓
2. Phase 1: Discovery
   ├─→ Collect data
   └─→ Quality gate validation
   ↓
3. Phase 2: Analysis
   ├─→ Process data
   └─→ Quality gate validation
   ↓
4. Phase N: Final phase
   ├─→ Generate output
   └─→ Quality gate validation
   ↓
5. Produce structured report
```

---

## Scenario-Based Workflow

### Typical Development Flow

```bash
# 1. Plan project with PRD
cp .taskmaster/templates/diet103_project_prd.txt project-prd.txt
# Edit PRD...

# 2. Generate TaskMaster tasks
task-master parse-prd project-prd.txt

# 3. Create scenarios for each major feature
diet103 scenario create --template advanced --name feature-1
diet103 scenario create --template advanced --name feature-2

# 4. Edit scenarios with specific requirements
diet103 scenario edit feature-1
diet103 scenario edit feature-2

# 5. Validate all scenarios
diet103 scenario validate feature-1
diet103 scenario validate feature-2

# 6. Scaffold components
diet103 scenario scaffold feature-1
diet103 scenario scaffold feature-2

# 7. Test generated components
# Restart Claude Code, test skills/commands

# 8. Iterate and refine
diet103 scenario edit feature-1
diet103 scenario scaffold feature-1 --force
```

### Integration with TaskMaster

The Orchestrator uses TaskMaster for project planning:

```bash
# Parse diet103 project PRD
task-master parse-prd project-prd.txt

# Tasks are generated for:
# - Phase 1: Foundation (directory structure)
# - Phase 2: Core Skills (implement skills)
# - Phase 3: Hooks (validation automation)
# - Phase 4: Commands (user-facing workflows)
# - Phase 5: Agents (autonomous tasks)
# - Phase 6: Testing & Documentation

# Work through tasks systematically
task-master next                    # Get next task
task-master show <id>              # View task details
task-master set-status <id> done   # Mark complete
```

---

## PAI Pattern Integration

### Prompt as Interface (PAI)

diet103 uses PAI for natural, conversational interaction:

**Traditional Approach:**
```
❌ Complex configuration files
❌ Rigid command syntax
❌ Hidden functionality
❌ Steep learning curve
```

**PAI Approach:**
```
✅ Natural language triggers
✅ Conversational discovery
✅ Progressive disclosure
✅ Context-aware assistance
```

### PAI in Skills

**Auto-Activation Example:**

```markdown
# Scenario Manager Skill

**Triggers:**
- "What scenarios do I have?"
- "Create a new scenario"
- "Scaffold the client-intake scenario"

**Progressive Disclosure:**
1. User mentions "scenario" → Skill metadata loads (50 tokens)
2. Match confidence > 70% → Full skill loads (500 tokens)
3. Skill provides context-aware guidance
4. Skill unloads after completion (free tokens)
```

### PAI in Commands

**Natural Discovery:**

```
User: "How do I create a workflow?"
Claude: "You can use the /scenario command with the create subcommand:
         
         /scenario create --template basic --name my-workflow
         
         This will guide you through creating a new scenario."
```

**Conversational Help:**

```
User: "What does the scaffold command do?"
Claude: "The scaffold command generates diet103 components from a
         scenario definition. It creates:
         - Skills in ~/.claude/skills/
         - Commands in ~/.claude/commands/
         - Hooks in ~/.claude/hooks/
         
         Try: /scenario scaffold my-workflow --dry-run"
```

---

## Best Practices

### Component Design

#### Skills

1. **Keep skills focused** - Single Responsibility Principle
2. **Stay under 500 lines** - diet103 size limit
3. **Use clear triggers** - Specific keywords and patterns
4. **Document workflows** - Step-by-step in SKILL.md
5. **Minimize dependencies** - Reduce coupling

**Good Example:**
```markdown
# Skill: Client Intake

Handles client requirement gathering workflow.

**Triggers:** "client intake", "gather requirements", "client form"

**Token Budget:** 450 tokens

**Workflow:**
1. Present intake form
2. Validate responses
3. Store in database
4. Notify team
```

**Bad Example:**
```markdown
❌ Skill: Everything (3000 lines)
- Client intake
- Order processing
- Inventory management
- Customer support
- ... (too broad, over size limit)
```

#### Commands

1. **Clear naming** - Use kebab-case
2. **Document prerequisites** - List required skills/MCPs
3. **Provide examples** - Show common usage
4. **Explain output** - What to expect
5. **Error guidance** - How to troubleshoot

**Good Example:**
```markdown
# /process-order

Process a customer order through the fulfillment workflow.

## Prerequisites
- Skill: order_processor
- MCP: inventory-mcp
- MCP: payment-mcp

## Usage
```bash
/process-order --order-id 12345
```

## Expected Output
Order confirmation and tracking number.
```

#### Hooks

1. **Non-blocking by default** - Exit 0 unless critical
2. **Fast execution** - <100ms for most hooks
3. **Clear output** - User-friendly messages
4. **Targeted validation** - Specific checks only
5. **Graceful degradation** - Handle errors well

**Good Example:**
```javascript
#!/usr/bin/env node

// Validate scenario YAML before scaffolding
if (isScaffoldCommand && hasYAMLFile) {
  const valid = validateYAML(yamlFile);
  if (!valid.ok) {
    console.error('❌ YAML validation failed:');
    valid.errors.forEach(e => console.error(`  ${e}`));
    // Non-blocking - let user proceed
    process.exit(0);
  }
  console.log('✅ YAML validation passed');
}
process.exit(0);
```

### Project Structure

**Recommended Layout:**
```
project/
├── .claude/
│   ├── metadata.json            # Project identity
│   ├── skill-rules.json         # Auto-activation rules
│   ├── settings.local.json      # Local configuration
│   ├── skills/                  # Skill components
│   │   ├── feature_a/
│   │   └── feature_b/
│   ├── commands/                # Slash commands
│   │   ├── feature-a.md
│   │   └── feature-b.md
│   ├── hooks/                   # Lifecycle hooks
│   │   ├── UserPromptSubmit.js
│   │   └── PostToolUse.js
│   ├── agents/                  # Autonomous agents
│   │   └── analyzer/
│   └── scenarios/               # Scenario definitions
│       ├── feature-a.yaml
│       └── feature-b.yaml
├── .taskmaster/                 # TaskMaster integration
│   ├── tasks/
│   └── templates/
├── src/                         # Application code
└── README.md
```

### Token Management

**Metadata Always Loaded:**
```json
{
  "name": "scenario_manager",
  "triggers": {
    "keywords": ["scenario", "workflow"],
    "patterns": ["create scenario"]
  },
  "token_budget": 500
}
```
**Cost:** ~50 tokens (always in context)

**Skill Content On-Demand:**
- Loaded when trigger matches
- Unloaded after execution
- **Cost:** ~500 tokens (temporary)

**Total Budget:**
- 10 skills × 50 tokens metadata = 500 tokens base
- +500 tokens per active skill (on-demand)
- Total: 500-1000 tokens vs. 10,000+ traditional

### Testing

**Scenario Validation:**
```bash
# Always validate before scaffolding
diet103 scenario validate my-scenario

# Use dry-run to preview
diet103 scenario scaffold my-scenario --dry-run

# Test incrementally
diet103 scenario scaffold my-scenario
# Restart Claude Code
# Test skill auto-activation
# Test command execution
# Test hook triggering
```

**Component Testing:**
1. **Skills**: Mention trigger keywords, verify activation
2. **Commands**: Run `/command`, verify output
3. **Hooks**: Trigger events, verify execution
4. **Agents**: Invoke agent, verify phase execution

---

## Troubleshooting

### Common Issues

#### Skill Not Auto-Activating

**Problem:** Skill doesn't load when trigger keywords mentioned.

**Solutions:**
1. Check `skill-rules.json` has correct triggers
2. Verify `metadata.json` exists and is valid JSON
3. Ensure trigger confidence > threshold (default 0.7)
4. Restart Claude Code after changes
5. Check `.claude/settings.local.json` has auto_activation enabled

**Debug:**
```bash
# Validate skill structure
ls -la ~/.claude/skills/my_skill/

# Check metadata
cat ~/.claude/skills/my_skill/metadata.json | jq

# Verify skill-rules
cat ~/.claude/skill-rules.json | jq
```

#### Command Not Found

**Problem:** `/command` not recognized.

**Solutions:**
1. Verify command file exists: `~/.claude/commands/command.md`
2. Check command name matches file name (kebab-case)
3. Restart Claude Code after creating command
4. Ensure command starts with `/` in documentation

#### Scaffold Generates Nothing

**Problem:** `scaffold` command runs but creates no files.

**Solutions:**
1. Validate scenario first: `diet103 scenario validate name`
2. Check scenario has `generates` section
3. Verify permissions on `~/.claude/` directory
4. Use `--verbose` flag for detailed output
5. Check for validation errors in terminal

#### Hook Not Executing

**Problem:** Hook script not running on events.

**Solutions:**
1. Verify hook is executable: `chmod +x ~/.claude/hooks/hook.js`
2. Check hook has correct shebang: `#!/usr/bin/env node`
3. Verify hook name matches event type exactly
4. Check for syntax errors in hook script
5. Ensure hook exits with code 0 (non-blocking)

### Getting Help

**Documentation:**
- [SCENARIO_CLI.md](./SCENARIO_CLI.md) - Scenario commands
- [SCENARIO_VALIDATION_GUIDE.md](./SCENARIO_VALIDATION_GUIDE.md) - Validation rules
- [DIET103_COMPLIANCE_COMPLETE.md](./DIET103_COMPLIANCE_COMPLETE.md) - Compliance checklist

**Commands:**
```bash
# Command help
diet103 scenario --help
diet103 scenario scaffold --help

# Validate configuration
diet103 validate-mcp .mcp.json

# Check scenario structure
diet103 scenario show my-scenario -v
```

**Community:**
- GitHub Issues: Report bugs or request features
- Discussions: Ask questions and share projects
- Examples: See `Docs/scenarios/library/` for reference scenarios

---

## Appendix

### diet103 Compliance Checklist

Use this checklist to verify diet103 compliance:

#### Project Structure
- [ ] `.claude/` directory exists
- [ ] `metadata.json` present and valid
- [ ] `skill-rules.json` present and valid
- [ ] `settings.local.json` present and valid

#### Skills
- [ ] Each skill under 500 lines
- [ ] SKILL.md documentation exists
- [ ] metadata.json has triggers defined
- [ ] Token budget specified (<500 tokens)
- [ ] Auto-activation patterns defined

#### Commands
- [ ] Commands use kebab-case naming
- [ ] Documentation includes prerequisites
- [ ] Usage examples provided
- [ ] Expected output documented

#### Hooks
- [ ] Hooks are executable (chmod +x)
- [ ] Proper shebang present
- [ ] Non-blocking by default (exit 0)
- [ ] Fast execution (<100ms)

#### General
- [ ] Follows PAI pattern
- [ ] Progressive disclosure implemented
- [ ] Token-efficient design
- [ ] Clear documentation

### Quick Reference

**Create New Project:**
```bash
mkdir project && cd project
mkdir -p .claude/{skills,commands,hooks,scenarios}
# Add metadata.json, skill-rules.json, settings.local.json
```

**Create Scenario:**
```bash
diet103 scenario create --template advanced --name my-feature
diet103 scenario edit my-feature
diet103 scenario validate my-feature
```

**Generate Components:**
```bash
diet103 scenario scaffold my-feature --dry-run  # Preview
diet103 scenario scaffold my-feature            # Generate
```

**Test Components:**
```bash
# Restart Claude Code
# Mention trigger keywords → Skill activates
# Run /command → Command executes
```

**Integrate with TaskMaster:**
```bash
cp .taskmaster/templates/diet103_project_prd.txt my-prd.txt
# Edit PRD
task-master parse-prd my-prd.txt
task-master next
```

---

**Version**: 1.0.0  
**Last Updated**: November 11, 2025  
**Maintainers**: Orchestrator Project Team

