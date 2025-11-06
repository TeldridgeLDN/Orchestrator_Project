# Product Requirements Document: Multi-Project AI Orchestration System

**Version:** 1.0
**Status:** Draft for Implementation
**Last Updated:** 2025-11-05

---

## Executive Summary

This PRD defines a **hybrid orchestration system** that enables seamless management of multiple Claude-enabled projects while maintaining token efficiency and context isolation. The system combines a global orchestration layer (inspired by PAI architecture) with local per-project runtimes (diet103), allowing users to create, switch between, and manage multiple AI-assisted projects without context bleeding or excessive token consumption.

**Core Value Proposition:**
- Single active project context at any time (prevents token waste)
- Fast project switching (<1s)
- Preservation of existing diet103 functionality
- Clear separation between global orchestration and project-specific AI behavior

**Why Hybrid Architecture (PAI + diet103)?**

This system bridges two proven architectures, taking the best from each:

| From PAI (Global Layer) | From diet103 (Project Layer) |
|------------------------|------------------------------|
| Skills-as-Containers pattern | Auto-activation via hooks |
| Unified Filesystem Context (UFC) | 500-line rule for context limits |
| Natural language routing | Production-tested patterns (6 months) |
| Workflow organization | Progressive disclosure |
| Text as "thought-primitives" | skill-rules.json trigger system |

**Result:** A system where orchestration scaffolding (PAI) manages the big picture, while proven auto-activation patterns (diet103) handle the details—combining PAI's philosophy that "orchestration > intelligence" with diet103's solution to "skills don't activate automatically."

---

## 1. Problem Statement

### Current State

**What Exists:**

**diet103 (Project-Level Infrastructure):**
- A production-tested reference library for Claude Code environments
- Implements **automatic skill activation** through UserPromptSubmit hooks
- Uses `skill-rules.json` to define trigger patterns (keywords, file contexts, project patterns)
- Follows the **500-line rule**: Skills use progressive disclosure with main SKILL.md (<500 lines) + separate resource files
- Each repo has self-contained `.claude/` directory with skills, hooks, agents, and commands
- Proven pattern from 6 months of real-world use on TypeScript microservices projects

**PAI (Personal AI Infrastructure - Global Pattern):**
- Filesystem-based context management using `~/.claude/context/` as the system's "brain"
- **Skills-as-Containers** pattern: Skills package related workflows, knowledge, and procedures
- Four core primitives: Skills, Workflows, Agents, MCPs (Model Context Protocols)
- **Progressive disclosure**: Metadata always loads, detailed content loads on-demand
- Natural language routing with automatic skill activation
- v1.2.0 architecture with 73 workflows organized into skill-specific subdirectories

**Pain Points:**
1. **No Multi-Project Orchestration**: diet103 works brilliantly within a single repo but has no cross-project awareness
2. **Token Inefficiency Risk**: Loading multiple project `.claude/` contexts simultaneously causes redundant skill activation and context bloat
3. **No Unified Project Registry**: PAI's global structure exists, but lacks project-switching capability for multiple independent codebases
4. **Manual Project Scaffolding**: Creating new Claude-enabled projects requires copying `.claude/` structure manually
5. **Context Confusion**: When working across multiple projects, Claude can confuse contexts mid-conversation without explicit boundaries
6. **Missing Bridge**: No system combines PAI's global orchestration philosophy with diet103's proven auto-activation patterns

### Target State

A **hybrid meta-orchestration system** that bridges PAI and diet103:
- **Global Layer (PAI-inspired)**: Unified project registry, filesystem-based context (`~/.claude/`), orchestration primitives
- **Project Layer (diet103-powered)**: Proven auto-activation hooks, skill-rules.json patterns, 500-line progressive disclosure
- **Seamless Switching**: Instant project context changes with automatic unload/reload
- **Token Efficiency**: Only one project's context active at a time (PAI's progressive disclosure + diet103's lazy loading)
- **CLI + Natural Language**: Both command-line tools (`claude project switch`) and conversational project management
- **100% Backward Compatible**: Existing diet103 repos work unchanged; PAI workflows remain independent

---

## 2. Objectives & Success Criteria

### Primary Objectives

| Objective | Description | Success Metric |
|-----------|-------------|----------------|
| **Global Registry** | System-wide tracking of all Claude projects | `config.json` maintains accurate project list |
| **Context Isolation** | Only one project's `.claude/` loaded at any time | Token usage ≤ single project + 20% overhead |
| **Fast Switching** | Near-instant project context changes | Switch time < 1 second |
| **Backward Compatibility** | Existing diet103 repos work unchanged | 100% compatibility with existing projects |
| **Easy Project Creation** | Scaffold new projects from templates | `create` command succeeds in <2s |

### Non-Objectives (Out of Scope for v1.0)

- Cross-project dependency linking
- Shared skill libraries
- Remote project registry synchronization
- Multi-project parallel execution

---

## 3. System Architecture

### 3.1 Architectural Overview

**Hybrid Architecture: PAI Global + diet103 Local**

```
┌─────────────────────────────────────────────────────────────────────┐
│                   GLOBAL LAYER (PAI-Inspired)                       │
│  Location: ~/.claude/                                               │
│  Philosophy: Filesystem-based context, progressive disclosure       │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ config.json  │  │ Claude.md    │  │ context/ (UFC)          │ │
│  │ (registry)   │  │ (orchestr.)  │  │ - Unified FS Context    │ │
│  └──────────────┘  └──────────────┘  └─────────────────────────┘ │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  project_orchestrator (Meta-Skill)                         │   │
│  │  - Uses PAI Skills-as-Containers pattern                   │   │
│  │  - Workflows: create, switch, list, remove, validate       │   │
│  │  - Agents: parallel project validation, migration helpers  │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               │ orchestrates
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                PROJECT LAYER (diet103-Powered)                      │
│  Location: ~/Projects/<project>/.claude/                           │
│  Philosophy: Auto-activation, 500-line rule, production-tested     │
│                                                                     │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │ Claude.md    │  │ skill-rules.json │  │ metadata.json    │    │
│  │ (proj. ctx)  │  │ (auto-trigger)   │  │ (manifest)       │    │
│  └──────────────┘  └──────────────────┘  └──────────────────┘    │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  skills/ (500-line progressive disclosure)                 │   │
│  │    └── <skill-name>/                                       │   │
│  │        ├── SKILL.md (<500 lines, overview + navigation)    │   │
│  │        └── resources/ (<500 lines each, lazy-loaded)       │   │
│  ├────────────────────────────────────────────────────────────┤   │
│  │  hooks/ (diet103 auto-activation)                          │   │
│  │    ├── UserPromptSubmit (monitors prompts + file context)  │   │
│  │    └── PostToolUse (tracks Claude actions adaptively)      │   │
│  ├────────────────────────────────────────────────────────────┤   │
│  │  agents/ (specialized task workers)                        │   │
│  ├────────────────────────────────────────────────────────────┤   │
│  │  commands/ (slash commands for structured workflows)       │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

KEY PRINCIPLES:
• PAI Global: Orchestration scaffolding > model intelligence
• diet103 Local: Skills don't activate automatically → hooks solve this
• Progressive Disclosure: Metadata always, details on-demand
• 500-Line Rule: Each file <500 lines to avoid context limits
```

### 3.2 Global vs Local Separation

| Aspect | Global Layer (`~/.claude/`) | Local Layer (`<project>/.claude/`) |
|--------|----------------------------|-----------------------------------|
| **Purpose** | Orchestration, project management | Project-specific AI behavior |
| **Architecture Source** | PAI (Skills-as-Containers, UFC) | diet103 (Auto-activation, 500-line rule) |
| **Claude.md Role** | Orchestrator rules, meta-commands | Project context, team info, tone |
| **Skills Pattern** | PAI: Skills contain workflows | diet103: Skills with progressive disclosure |
| **Activation** | CLI + natural language routing | UserPromptSubmit hooks + skill-rules.json |
| **Lifecycle** | System-wide, persistent | Per-project, independent |
| **Token Impact** | Minimal (~200-500 tokens) | Full project context (lazy-loaded) |
| **Example Content** | "Manage project switching" | "This is a Shopify store project" |

### 3.3 diet103 Auto-Activation System (Project Layer)

**The Problem diet103 Solves:**
Claude Code skills exist passively—they don't activate automatically. Users must manually remember and invoke them, which breaks flow and reduces productivity.

**How diet103 Auto-Activation Works:**

1. **UserPromptSubmit Hook**
   - Monitors every user prompt before Claude processes it
   - Analyzes prompt content and current file context
   - Checks against `skill-rules.json` for pattern matches

2. **skill-rules.json Configuration**
   ```json
   {
     "rules": [
       {
         "trigger_phrases": ["Shopify", "online store", "product catalog"],
         "file_patterns": ["*.liquid", "shopify.config.js"],
         "context_patterns": ["working in themes/", "templates/"],
         "skill": "shopify_skill",
         "auto_activate": true
       },
       {
         "trigger_phrases": ["SEO", "AdWords", "analytics"],
         "skill": "seo_optimizer",
         "auto_activate": true
       }
     ]
   }
   ```

3. **Activation Flow**
   ```
   User: "I need to set up the product inventory for my Shopify store"
        ↓
   UserPromptSubmit Hook intercepts
        ↓
   Checks skill-rules.json:
   - "Shopify" matches trigger_phrase ✓
   - "product" matches trigger_phrase ✓
        ↓
   Loads shopify_skill/SKILL.md
        ↓
   Claude responds with shopify_skill context active
   ```

4. **PostToolUse Hook (Adaptive Loading)**
   - Monitors Claude's tool usage
   - Detects when skills need additional resources
   - Triggers lazy-loading of resource files only when needed

**Key Benefits:**
- **Zero Mental Overhead**: Skills appear when needed, not when remembered
- **Context-Aware**: File patterns and project context trigger relevant skills
- **Token Efficient**: Only loads what's actually needed for current task
- **Production-Tested**: 6 months of real-world validation on complex projects

### 3.4 PAI UFC (Unified Filesystem Context) - Global Layer

**Core Concept:**
Rather than cramming knowledge into prompts, PAI uses `~/.claude/context/` as the system's persistent "brain"—a hierarchical directory structure that provides targeted context loading.

**Structure:**
```
~/.claude/
├── context/
│   ├── projects/               # Project metadata and relationships
│   ├── workflows/              # Common workflow templates
│   ├── knowledge/              # Domain knowledge bases
│   └── preferences/            # User preferences and patterns
```

**How It Works:**
- Agents and skills load only the context subdirectories they need
- Hierarchical organization allows precise targeting (load `context/projects/shopify/` not entire context)
- Text-based files mirror how AI operates (markdown as "thought-primitives")
- Shared context across all agents reduces duplication

**Integration with Orchestrator:**
- Project registry stored in `~/.claude/context/projects/registry.json`
- Active project symlinked to `~/.claude/context/active-project/`
- Orchestrator workflows access UFC for project metadata
- Each project switch updates symlinks, keeping UFC current

### 3.5 Token Efficiency Model

```
Active Memory:
├── Global Context (always loaded)
│   ├── config.json metadata         ~100 tokens
│   ├── Global Claude.md             ~300 tokens
│   └── Orchestrator skill manifest  ~100 tokens
│
└── Active Project Context (only ONE loaded)
    ├── Local Claude.md              ~1000 tokens
    ├── skill-rules.json             ~200 tokens
    └── Active skills (lazy-loaded)  ~2000+ tokens

Inactive Projects: 0 tokens (dormant on disk)
```

**Total Active Footprint:** ~3700 tokens (vs ~3200 for single project)
**Overhead:** ~15-20% (acceptable for multi-project capability)

### 3.6 Agentic Feature Architecture & Selection

**Philosophy:** Start with the simplest primitive and scale only as necessary. Avoid over-engineering solutions.

**Core Principle:** All features are built on four foundational components: **Context, Model, Prompt, and Tools**. The **Prompt** is the fundamental primitive—the building block of all agentic features.

#### 3.6.1 Feature Complexity Hierarchy

The orchestrator system uses a clear hierarchy of agentic features, ordered from simplest to most complex:

```
1. Slash Commands (Simplest)    → Single-step, manual invocation
2. MCP Servers                  → External system integrations
3. Sub-Agents                   → Isolated, parallel task execution
4. Skills (Most Complex)        → Multi-step workflows that compose other features
```

**Key Insight:** Skills should **compose** (call/leverage) other features within their modular structure to manage complex workflows.

#### 3.6.2 Decision Tree for Feature Selection

Use this decision tree to select the appropriate agentic feature for any new engineering task:

**Step 1: Is this a simple, single-step, or one-off task?**
- **YES** → Implement as a **Slash Command** (Prompt primitive)
  - Reusable shortcut for manual invocation
  - Example: Generating a single git commit message
  - Location: `.claude/commands/<command-name>.md`
- **NO** → Continue to Step 2

**Step 2: Does the task involve connecting to an external system, API, or proprietary data source?**
- **YES** → Implement as an **MCP Server**
  - Dedicated solution for integrating external tools and data
  - Example: Querying a database or fetching real-time data from a third-party API
  - Location: Separate MCP server package (referenced in `.mcp.json`)
- **NO** → Continue to Step 3

**Step 3: Does the task require high-scale or parallel execution, and must it be isolated from the main agent's context window?**
- **YES** → Implement as a **Sub-Agent**
  - Delegate isolatable tasks that can run in parallel
  - Context is lost after completion for efficiency (stateless execution)
  - Example: Running a comprehensive security audit or fixing failing tests at scale
  - Location: Global `~/.claude/agents/` or project `.claude/agents/`
- **NO** → Continue to Step 4

**Step 4: Is this a complex, multi-step process that needs to be an automatic, reoccurring, agent-invoked workflow?**
- **YES** → Implement as a **Skill**
  - Higher-level compositional unit for packaging custom expertise and logic
  - Skills should compose (call/leverage) other features: Slash Commands, Sub-Agents, MCPs
  - Example: Managing a system (like a Git Work Tree Manager) or detecting recurring style guide violations
  - Location: `.claude/skills/<skill-name>/`
- **NO** → Re-evaluate the need against Step 1

**Justification Requirement:** You must explicitly justify your final feature choice by referencing:
- Task complexity level
- Need for external integration
- Parallel execution requirements
- Reusability considerations

#### 3.6.3 Sub-Agent Design Patterns

When Step 3 determines a Sub-Agent is appropriate, follow these design patterns:

**1. System Prompt Definition (The Agent's Role)**

Define the agent's core purpose clearly, stating this is the system prompt and that responses must be formatted for the **Primary Agent** (not the user). The agent operates solely within its isolated context.

```markdown
# System Prompt: Security Audit Agent

You are a specialized security audit sub-agent. Your role is to perform comprehensive
security scans on the codebase and report findings back to the Primary Agent.

**IMPORTANT:**
- You operate in an isolated context window
- Your response will be consumed by the Primary Agent, not the user
- Format all output as structured data for programmatic consumption
- You have NO access to conversation history
```

**2. Tool Restrictions**

Explicitly list and restrict the tools the agent is allowed to use. Set clear boundaries for its operations.

```json
{
  "agent_id": "security_audit",
  "allowed_tools": ["bash", "grep", "read"],
  "forbidden_tools": ["edit", "write", "delete"],
  "tool_scope": "read-only analysis"
}
```

**3. Output Format (For Primary Agent)**

The agent's final response must be highly concise, factual, and actionable using this standard format:

```
[AGENT_STATUS] Brief, fact-based summary of work and result. Next step guidance (optional).
```

Example:
```
[SUCCESS] Scanned 1,247 files. Found 3 critical vulnerabilities in auth module.
Recommend: Review src/auth/validator.ts:42, src/auth/session.ts:156, src/api/middleware.ts:89
```

**4. Invocation Protocol**

**Agent Name:** Assign a unique ID for the sub-agent (e.g., `security_audit_agent`)

**Description (The Trigger):** Write a clear, information-dense description that tells the **Primary Agent exactly when to invoke this Sub-Agent**. Use precise trigger phrases.

Example:
```
"Must be used proactively when a user asks to perform a security scan, run audits,
identify vulnerabilities, or when the Primary Agent detects security-related keywords
in the user's request (e.g., 'audit', 'security', 'vulnerabilities', 'CVE')."
```

**Invocation Instruction:** When the Primary Agent calls this Sub-Agent, it must pass a single, clear, one-shot prompt containing all necessary context (file paths, branch names, specific instructions) since the Sub-Agent has no conversation history.

**5. Justification Checklist**

Before creating a Sub-Agent, verify:
- [ ] Is the task specialized enough to warrant isolation? (Y/N)
- [ ] Does the `description` mitigate the risk of decision overload for the Primary Agent? (Y/N)
- [ ] Is the output format structured for reliable consumption by the Primary Agent? (Y/N)
- [ ] Would a Slash Command or Skill be simpler? (N for Sub-Agent)

#### 3.6.4 Integration with Orchestrator Architecture

**Global Layer (PAI) Integration:**
- MCP Servers: Referenced in `~/.claude/.mcp.json`
- Global Sub-Agents: Located in `~/.claude/agents/`
- Orchestrator Skills: Located in `~/.claude/skills/project_orchestrator/`

**Project Layer (diet103) Integration:**
- Slash Commands: Located in `<project>/.claude/commands/`
- Project-Specific Skills: Located in `<project>/.claude/skills/`
- Project-Specific Sub-Agents: Located in `<project>/.claude/agents/`
- Skill Auto-Activation: Triggered via `skill-rules.json` and UserPromptSubmit hooks

**Composition Pattern Example:**

```markdown
# Skill: Git Work Tree Manager

## Workflows
- create.md (uses: git_worktree_create slash command)
- switch.md (uses: context_switch sub-agent for parallel validation)
- validate.md (uses: git_status MCP for real-time git state)

## Resources
- troubleshooting.md
- best-practices.md
```

---

## 4. Core Components

### 4.1 Global Configuration (`~/.claude/config.json`)

**Purpose:** System registry for all Claude-enabled projects

**Schema:**
```json
{
  "$schema": "https://claude.ai/schemas/orchestrator-config-v1.json",
  "version": "1.0.0",
  "active_project": "shopify-store",
  "projects": {
    "shopify-store": {
      "path": "/Users/you/Projects/shopify-store",
      "created": "2025-11-05T10:30:00Z",
      "last_active": "2025-11-05T14:22:00Z",
      "metadata": {
        "description": "E-commerce Shopify store",
        "tags": ["shopify", "ecommerce"]
      }
    },
    "ai-prototype": {
      "path": "/Users/you/Projects/ai-prototype",
      "created": "2025-10-15T08:00:00Z",
      "last_active": "2025-11-04T16:45:00Z",
      "metadata": {
        "description": "AI agent prototype",
        "tags": ["ai", "research"]
      }
    }
  },
  "settings": {
    "auto_switch_on_directory_change": false,
    "cache_last_active": true,
    "validate_on_switch": true
  }
}
```

**Validation Rules:**
- All paths must be absolute and exist on filesystem
- `active_project` must exist in `projects` map
- Project names must be valid directory names (alphanumeric, hyphens, underscores)
- Timestamps must be ISO 8601 format

### 4.2 Global Claude.md

**Location:** `~/.claude/Claude.md`

**Purpose:** Define orchestrator behavior and meta-level rules

**Template:**
```markdown
# Global AI Orchestration Layer

This is the **meta-orchestrator level** that manages multiple Claude projects.

## Orchestration Rules

1. **Single Active Context**: Only one project's `.claude/` directory is loaded at any time
2. **Explicit Switching**: Projects are switched via `claude project switch <name>` command or skill invocation
3. **Context Isolation**: Inactive projects remain dormant (not loaded into token context)

## Active Project

The current active project is defined in `~/.claude/config.json` under `active_project`.

When a project is active:
- Its local `.claude/Claude.md` is loaded
- Its `skill-rules.json` governs auto-activation
- Its skills/ directory is available for execution

## Project Orchestrator Skill

The `project_orchestrator` meta-skill handles:
- Creating new projects from templates
- Switching between registered projects
- Listing all available projects
- Removing (deregistering) projects

## Token Efficiency

- This global layer maintains minimal context (~500 tokens)
- Only the active project's context is loaded
- Switching triggers context unload → reload cycle
```

### 4.3 Project Orchestrator Meta-Skill

**Location:** `~/.claude/skills/project_orchestrator/`

**Architecture:** Follows PAI Skills-as-Containers pattern with workflows subdirectory

**Structure:**
```
project_orchestrator/
├── SKILL.md                    # Skill documentation (<500 lines)
├── metadata.json               # Skill manifest
├── workflows/                  # PAI pattern: workflows within skill
│   ├── create.md              # Project creation workflow
│   ├── switch.md              # Project switching workflow
│   ├── list.md                # Project listing workflow
│   ├── remove.md              # Project removal workflow
│   └── validate.md            # Project validation workflow
└── resources/                  # diet103 pattern: lazy-loaded resources
    ├── templates.md           # Template documentation
    └── troubleshooting.md     # Common issues and solutions
```

**metadata.json:**
```json
{
  "id": "project_orchestrator",
  "name": "Project Orchestrator",
  "type": "meta-skill",
  "version": "1.0.0",
  "description": "Global orchestrator for managing multiple Claude projects (PAI + diet103 hybrid)",
  "architecture": {
    "global_layer": "PAI Skills-as-Containers",
    "project_layer": "diet103 auto-activation"
  },
  "workflows": [
    "create",
    "switch",
    "list",
    "remove",
    "validate"
  ],
  "dependencies": [],
  "token_footprint": "minimal (~500 tokens)",
  "progressive_disclosure": true
}
```

**Natural Language Activation (diet103-inspired):**

The orchestrator skill uses natural language routing (PAI pattern) combined with diet103's UserPromptSubmit hook pattern:

```yaml
# Global hooks configuration
# Location: ~/.claude/hooks/orchestrator-activation.yaml
version: "1.0"
description: "Activates project orchestrator based on user intent"

hooks:
  - event: UserPromptSubmit
    description: "Monitor for project management commands"
    conditions:
      # Switch/Change project
      - pattern: "(?i)(switch|change)\\s+(to\\s+)?project\\s+(\\w+)"
        workflow: "switch"
        extract_args: [3]

      # Create new project
      - pattern: "(?i)create\\s+(new\\s+)?project\\s+(\\w+)"
        workflow: "create"
        extract_args: [2]

      # List projects
      - pattern: "(?i)(list|show)\\s+projects?"
        workflow: "list"

      # Remove project
      - pattern: "(?i)(remove|delete)\\s+project\\s+(\\w+)"
        workflow: "remove"
        extract_args: [2]
        requires_confirmation: true

      # Validate project
      - pattern: "(?i)validate\\s+project"
        workflow: "validate"
```

### 4.4 Local Project Structure

**Each project maintains standard diet103 structure:**

```
<project_root>/
├── .claude/
│   ├── Claude.md                  # Project-specific context
│   ├── skill-rules.json           # diet103 auto-activation rules
│   ├── metadata.json              # Project manifest (new for orchestrator)
│   │
│   ├── skills/                    # Domain-specific skills (500-line rule)
│   │   └── <skill-name>/
│   │       ├── SKILL.md          # Main skill file (<500 lines)
│   │       ├── metadata.json     # Skill manifest
│   │       └── resources/        # Lazy-loaded resources (<500 lines each)
│   │           ├── guide.md
│   │           └── examples.md
│   │
│   ├── hooks/                     # diet103 auto-activation hooks
│   │   ├── UserPromptSubmit.js   # Monitor prompts + file context
│   │   └── PostToolUse.js        # Track Claude actions adaptively
│   │
│   ├── agents/                    # Specialized task workers
│   │   └── <agent-name>/
│   │       ├── AGENT.md          # Agent documentation
│   │       └── config.json       # Agent configuration
│   │
│   ├── commands/                  # Slash commands for workflows
│   │   └── <command-name>.md     # Command implementation
│   │
│   └── resources/                 # Project-wide resources
│       └── <shared-resources>/
│
├── dev/                           # diet103 dev docs pattern (optional)
│   └── active/
│       ├── <task>-plan.md        # Strategy
│       ├── <task>-context.md     # Key decisions
│       └── <task>-tasks.md       # Checklist
│
├── src/                           # Project source code
├── tests/                         # Project tests
└── README.md                      # Project documentation
```

**New: Project metadata.json**
```json
{
  "project_id": "shopify-store",
  "version": "0.1.0",
  "description": "E-commerce Shopify store with SEO and payment integration",
  "skills": [
    "shopify_skill",
    "seo_optimizer",
    "payment_gateway_config"
  ],
  "created": "2025-11-05T10:30:00Z",
  "diet103_version": "1.2.0",
  "tags": ["shopify", "ecommerce", "seo"]
}
```

---

## 5. Technical Specifications

### 5.1 Project Lifecycle Operations

#### Create Project

**Command:** `claude project create <name> [--template <template_name>]`

**Process:**
1. Validate project name (alphanumeric, hyphens, underscores only)
2. Check if project already exists in registry
3. Prompt for project path (default: `~/Projects/<name>`)
4. Copy template from `~/.claude/templates/<template_name>` (default: `base`)
5. Initialize metadata.json with project details
6. Register in `config.json`
7. Set as active project
8. Output success message with next steps

**Template Structure:**
```
~/.claude/templates/
├── base/                          # Minimal template
│   └── .claude/
│       ├── Claude.md
│       ├── skill-rules.json
│       └── metadata.json
│
├── web-app/                       # Web application template
│   └── .claude/
│       ├── Claude.md
│       ├── skill-rules.json
│       ├── skills/
│       │   └── web_dev_assistant/
│       └── metadata.json
│
└── shopify/                       # Shopify-specific template
    └── .claude/
        ├── Claude.md
        ├── skill-rules.json
        ├── skills/
        │   ├── shopify_skill/
        │   └── seo_optimizer/
        └── metadata.json
```

**Error Handling:**
- Project name already exists → suggest alternative or switch command
- Invalid project name → show naming rules
- Template not found → list available templates
- Path already exists → confirm overwrite or choose new path

#### Switch Project

**Command:** `claude project switch <name>`

**Process:**
1. Validate project exists in registry
2. Validate project path still exists
3. **Unload current project:**
   - Flush skill activation states
   - Cache current context (optional, for fast resume)
   - Clear in-memory skill data
4. **Load new project:**
   - Read new project's `metadata.json`
   - Load new project's `Claude.md` into context
   - Load new project's `skill-rules.json`
   - Initialize skill activation listeners
5. Update `active_project` in config
6. Update `last_active` timestamp
7. Output confirmation message

**Performance Target:** <1 second for switch operation

**Error Handling:**
- Project not found → list available projects
- Project path missing → offer to remove or update path
- Invalid project structure → validate and repair command

#### List Projects

**Command:** `claude project list [--verbose]`

**Output Format (default):**
```
Active Projects:
* shopify-store    /Users/you/Projects/shopify-store    (active)
  ai-prototype     /Users/you/Projects/ai-prototype     (last used 1 day ago)
  infra-docs       /Users/you/Projects/infra-docs       (last used 5 days ago)

Total: 3 projects
```

**Output Format (verbose):**
```
┌─────────────────┬──────────────────────────────────┬────────────┬─────────────────────┐
│ Name            │ Path                             │ Skills     │ Last Active         │
├─────────────────┼──────────────────────────────────┼────────────┼─────────────────────┤
│ shopify-store * │ /Users/you/Projects/shopify-store│ 3          │ 2025-11-05 14:22:00 │
│ ai-prototype    │ /Users/you/Projects/ai-prototype │ 5          │ 2025-11-04 16:45:00 │
│ infra-docs      │ /Users/you/Projects/infra-docs   │ 2          │ 2025-10-30 09:15:00 │
└─────────────────┴──────────────────────────────────┴────────────┴─────────────────────┘

* = active project
```

#### Remove Project

**Command:** `claude project remove <name> [--force]`

**Process:**
1. Validate project exists
2. Check if project is currently active
3. **Without --force:** Show confirmation prompt
   - Display project details
   - Warn about what will be removed
   - Require explicit 'yes' to proceed
4. Remove from registry (`config.json`)
5. **Do NOT delete** project files (safety measure)
6. If removed project was active, set `active_project` to null or most recent
7. Output confirmation message

**Safety Rules:**
- Never delete project files (only deregister)
- Cannot remove active project without confirmation
- Must explicitly confirm removal

### 5.2 Context Management

#### Context Loading Strategy

**Global Context (Always Loaded):**
```javascript
{
  global: {
    config: <config.json>,           // ~100 tokens
    claudeMd: <Claude.md>,            // ~300 tokens
    orchestrator: <metadata>          // ~100 tokens
  },
  // Total: ~500 tokens
}
```

**Active Project Context (Loaded on Demand):**
```javascript
{
  project: {
    metadata: <metadata.json>,        // ~100 tokens
    claudeMd: <Claude.md>,            // ~1000 tokens
    skillRules: <skill-rules.json>,   // ~200 tokens
    activeSkills: []                  // Lazy-loaded
  },
  // Total: ~1300 tokens + skills
}
```

#### Context Switching Algorithm

```javascript
async function switchProject(newProjectName) {
  // 1. Validation
  const newProject = config.projects[newProjectName];
  if (!newProject) throw new Error('Project not found');
  if (!fs.existsSync(newProject.path)) throw new Error('Project path missing');

  // 2. Unload current project
  const currentProject = config.active_project;
  if (currentProject) {
    await unloadProjectContext(currentProject);
    await cacheProjectState(currentProject); // Optional
  }

  // 3. Load new project
  await loadProjectContext(newProjectName);

  // 4. Update config
  config.active_project = newProjectName;
  config.projects[newProjectName].last_active = new Date().toISOString();
  await saveConfig(config);

  // 5. Confirm
  return {
    success: true,
    previous: currentProject,
    current: newProjectName,
    switchTime: Date.now() - startTime
  };
}

async function unloadProjectContext(projectName) {
  // Flush skill activation states
  skillActivationManager.flush();

  // Clear in-memory skill data
  skillCache.clear(projectName);

  // Notify Claude to drop context
  await claudeApi.clearContext(`project:${projectName}`);
}

async function loadProjectContext(projectName) {
  const project = config.projects[projectName];
  const projectPath = project.path;

  // Load metadata
  const metadata = await readJSON(`${projectPath}/.claude/metadata.json`);

  // Load Claude.md
  const claudeMd = await readFile(`${projectPath}/.claude/Claude.md`);

  // Load skill rules
  const skillRules = await readJSON(`${projectPath}/.claude/skill-rules.json`);

  // Initialize skill activation (but don't load skills yet - lazy load)
  await skillActivationManager.initialize(skillRules);

  // Notify Claude of new context
  await claudeApi.setContext({
    project: projectName,
    metadata: metadata,
    claudeMd: claudeMd,
    skillRules: skillRules
  });
}
```

### 5.3 Validation & Integrity Checks

#### Project Validation

**Command:** `claude project validate [<name>|--all]`

**Checks:**
1. **Structure Validation:**
   - `.claude/` directory exists
   - `Claude.md` exists and is readable
   - `skill-rules.json` exists and is valid JSON
   - `metadata.json` exists and matches schema

2. **Skill Validation:**
   - All skills referenced in metadata exist in `skills/` directory
   - Skill manifests are valid
   - No broken symlinks

3. **Path Validation:**
   - Project path in config matches actual location
   - Path is absolute
   - Path is accessible

4. **Consistency Validation:**
   - Project name in metadata matches registry
   - No duplicate project IDs
   - Timestamps are valid

**Output:**
```
Validating project: shopify-store

✓ Directory structure
✓ Claude.md present
✓ skill-rules.json valid
✓ metadata.json valid
✗ Skill 'payment_gateway_config' referenced but not found
  → Fix: Remove from metadata or add skill

Validation: FAILED (1 error, 0 warnings)
```

---

## 6. Implementation Plan

### Phase 1: Foundation (Week 1)

**Goal:** Establish global infrastructure

**Tasks:**
1. Create `~/.claude/` directory structure
2. Implement `config.json` schema and validation
3. Write global `Claude.md` template
4. Set up basic CLI skeleton (`bin/claude`)
5. Implement `list` command (read-only operation)

**Deliverables:**
- [ ] `~/.claude/` directory exists
- [ ] `config.json` schema documented
- [ ] CLI can list projects
- [ ] Basic tests pass

### Phase 2: Project Creation (Week 2)

**Goal:** Enable new project scaffolding

**Tasks:**
1. Create base project template
2. Implement `create` command
3. Build template copying logic
4. Add project registration to config
5. Implement validation checks

**Deliverables:**
- [ ] `claude project create` works
- [ ] Templates directory populated
- [ ] New projects have valid structure
- [ ] Registration updates config correctly

### Phase 3: Context Switching (Week 3)

**Goal:** Implement core switching mechanism

**Tasks:**
1. Build context unload logic
2. Build context load logic
3. Implement `switch` command
4. Add caching for fast resume
5. Integrate with diet103 hooks

**Deliverables:**
- [ ] `claude project switch` works
- [ ] Context switches in <1s
- [ ] No token leakage between projects
- [ ] Active project persists across sessions

### Phase 4: Project Orchestrator Skill (Week 4)

**Goal:** Add skill-based orchestration

**Tasks:**
1. Create `project_orchestrator` skill structure
2. Implement hooks for natural language triggers
3. Build JavaScript action handlers
4. Add error handling and confirmations
5. Write skill documentation

**Deliverables:**
- [ ] Skill responds to "switch project X"
- [ ] Skill responds to "create project Y"
- [ ] Natural language commands work
- [ ] Skill integrates with CLI

### Phase 5: Management & Cleanup (Week 5)

**Goal:** Complete CRUD operations

**Tasks:**
1. Implement `remove` command
2. Add confirmation flows
3. Build project integrity repair tools
4. Create migration helper for existing projects
5. Write comprehensive tests

**Deliverables:**
- [ ] `claude project remove` works safely
- [ ] Existing diet103 repos can be registered
- [ ] Validation catches errors
- [ ] Full test coverage

### Phase 6: Polish & Documentation (Week 6)

**Goal:** Production readiness

**Tasks:**
1. Write user documentation
2. Create templates for common project types
3. Add shell completions
4. Optimize performance
5. Final integration testing

**Deliverables:**
- [ ] README with examples
- [ ] 3+ project templates
- [ ] Performance benchmarks met
- [ ] Zero known bugs

---

## 7. File Structure Reference

### Complete Global Structure

```
~/.claude/
├── bin/
│   └── claude                      # CLI entrypoint (executable)
│
├── config.json                     # Global project registry
├── Claude.md                       # Global orchestration context
│
├── skills/
│   └── project_orchestrator/
│       ├── SKILL.md
│       ├── metadata.json
│       ├── hooks.yaml
│       └── actions/
│           ├── create_project.js
│           ├── switch_project.js
│           ├── list_projects.js
│           ├── remove_project.js
│           └── validate_project.js
│
├── templates/
│   ├── base/
│   │   └── .claude/
│   │       ├── Claude.md
│   │       ├── skill-rules.json
│   │       └── metadata.json
│   │
│   ├── web-app/
│   │   └── .claude/
│   │       ├── Claude.md
│   │       ├── skill-rules.json
│   │       ├── skills/
│   │       │   └── web_dev_assistant/
│   │       └── metadata.json
│   │
│   └── shopify/
│       └── .claude/
│           ├── Claude.md
│           ├── skill-rules.json
│           ├── skills/
│           │   ├── shopify_skill/
│           │   └── seo_optimizer/
│           └── metadata.json
│
├── cache/                          # Optional: cached project states
│   ├── shopify-store.json
│   └── ai-prototype.json
│
└── logs/                           # Optional: operation logs
    └── orchestrator.log
```

### Complete Project Structure

```
~/Projects/shopify-store/
├── .claude/
│   ├── Claude.md                   # Project-specific context
│   ├── metadata.json               # Project manifest
│   ├── skill-rules.json            # diet103 auto-activation
│   │
│   ├── skills/
│   │   ├── shopify_skill/
│   │   │   ├── SKILL.md
│   │   │   ├── metadata.json
│   │   │   └── actions/
│   │   │       ├── setup_store.js
│   │   │       ├── configure_products.js
│   │   │       └── setup_payments.js
│   │   │
│   │   └── seo_optimizer/
│   │       ├── SKILL.md
│   │       ├── metadata.json
│   │       └── actions/
│   │           ├── analyze_seo.js
│   │           └── setup_analytics.js
│   │
│   └── resources/
│       ├── shopify_api_docs.md
│       └── seo_guidelines.md
│
├── src/                            # Project source code
├── tests/                          # Project tests
├── package.json                    # Project dependencies
└── README.md                       # Project documentation
```

---

## 8. Testing & Validation

### 8.1 Unit Tests

**Coverage Requirements:**
- Config validation: 100%
- Path normalization: 100%
- JSON schema validation: 100%
- Error handling: 95%+

**Test Cases:**

```javascript
describe('Project Creation', () => {
  it('should create project with valid name', async () => {
    const result = await createProject('test-project');
    expect(result.success).toBe(true);
    expect(fs.existsSync(result.path)).toBe(true);
  });

  it('should reject invalid project names', async () => {
    await expect(createProject('invalid name!')).rejects.toThrow();
  });

  it('should prevent duplicate projects', async () => {
    await createProject('duplicate');
    await expect(createProject('duplicate')).rejects.toThrow();
  });
});

describe('Project Switching', () => {
  it('should switch between projects in <1s', async () => {
    const start = Date.now();
    await switchProject('ai-prototype');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });

  it('should unload previous context', async () => {
    await switchProject('project-a');
    const contextA = getActiveContext();

    await switchProject('project-b');
    const contextB = getActiveContext();

    expect(contextB).not.toEqual(contextA);
    expect(contextB.project).toBe('project-b');
  });
});

describe('Config Validation', () => {
  it('should validate config schema', () => {
    const valid = validateConfig(mockConfig);
    expect(valid).toBe(true);
  });

  it('should reject malformed config', () => {
    const invalid = { ...mockConfig, active_project: 123 };
    expect(() => validateConfig(invalid)).toThrow();
  });
});
```

### 8.2 Integration Tests

**Scenarios:**

1. **Full Lifecycle Test:**
   - Create new project
   - Switch to it
   - Validate it
   - Remove it
   - Verify cleanup

2. **Multi-Project Test:**
   - Create 5 projects
   - Switch between them in sequence
   - Verify context isolation
   - Check token usage

3. **Error Recovery Test:**
   - Corrupt config.json
   - Attempt operation
   - Verify graceful failure
   - Test auto-repair

4. **Template Test:**
   - Create from each template
   - Validate structure
   - Check all skills present

### 8.3 Performance Benchmarks

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Project creation | <2s | Time from command to ready |
| Project switching | <1s | Unload + load time |
| Project listing | <100ms | Read config + format output |
| Validation | <500ms | Full structure check |
| Config update | <50ms | Write + verify |

### 8.4 Token Usage Tests

**Test Methodology:**
1. Measure baseline single-project token usage
2. Measure global layer token usage
3. Measure active project token usage
4. Verify inactive projects = 0 tokens
5. Calculate total overhead

**Acceptance Criteria:**
- Global layer: <500 tokens
- Overhead vs single project: <25%
- Inactive projects: 0 tokens
- No token leakage on switch

---

## 9. User Experience

### 9.1 CLI Usage Examples

#### Creating a New Shopify Project

```bash
$ claude project create shopify-store --template shopify
Creating new project 'shopify-store'...
✓ Template copied
✓ Metadata initialized
✓ Project registered
✓ Set as active project

Project created: /Users/you/Projects/shopify-store

Next steps:
  1. cd /Users/you/Projects/shopify-store
  2. Review .claude/Claude.md for project context
  3. Start working - skills will auto-activate

Available skills:
  - shopify_skill: Store setup and configuration
  - seo_optimizer: SEO and analytics setup
```

#### Switching Projects

```bash
$ claude project switch ai-prototype
Switching to project 'ai-prototype'...
✓ Context unloaded: shopify-store
✓ Context loaded: ai-prototype
✓ Skills activated: 5

Active project: ai-prototype
Path: /Users/you/Projects/ai-prototype
Last active: 1 day ago

Start working - Claude is ready!
```

#### Listing Projects

```bash
$ claude project list
Active Projects:
* shopify-store    /Users/you/Projects/shopify-store    (active)
  ai-prototype     /Users/you/Projects/ai-prototype     (1 day ago)
  infra-docs       /Users/you/Projects/infra-docs       (5 days ago)

Total: 3 projects

Use 'claude project switch <name>' to change active project
```

### 9.2 Natural Language Integration

**Via Project Orchestrator Skill:**

```
User: "I want to switch to my Shopify project"
Claude: "Switching to project 'shopify-store'...
         ✓ Context loaded
         Active skills: shopify_skill, seo_optimizer
         You can now work on your Shopify store."

User: "Create a new project called blog-platform"
Claude: "Creating new project 'blog-platform'...
         Which template would you like to use?
         - base (minimal setup)
         - web-app (web application)
         - custom (specify template)"

User: "Show me all my projects"
Claude: "You have 3 active projects:
         * shopify-store (active) - E-commerce Shopify store
         * ai-prototype (1 day ago) - AI agent prototype
         * infra-docs (5 days ago) - Infrastructure documentation

         Use 'switch to <name>' to change projects."
```

---

## 10. Security & Error Handling

### 10.1 Security Considerations

**Path Security:**
- All paths must be validated and canonicalized
- Prevent directory traversal attacks
- Reject paths outside user home directory (configurable)
- Validate symlinks before following

**Config Security:**
- Validate config.json schema on every read
- Backup config before modifications
- Atomic writes to prevent corruption
- Permission checks (config should be user-readable only)

**Injection Prevention:**
- Sanitize all user inputs (project names, paths)
- Use parameterized commands (no shell injection)
- Validate project names against whitelist regex

**Access Control:**
- Projects owned by user only
- No global system-wide modifications
- Respect filesystem permissions

### 10.2 Error Handling

**Error Categories:**

1. **Validation Errors** (user-recoverable)
   - Invalid project name
   - Project already exists
   - Template not found
   - → Provide helpful message + next steps

2. **System Errors** (may require intervention)
   - Config file corrupted
   - Filesystem permission denied
   - Disk space exhausted
   - → Attempt recovery, log error, notify user

3. **State Errors** (consistency issues)
   - Active project missing
   - Project path changed
   - Skill references broken
   - → Offer repair options

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Project 'shopify-store' not found in registry",
    "details": {
      "requested": "shopify-store",
      "available": ["ai-prototype", "infra-docs"]
    },
    "suggestions": [
      "Check project name spelling",
      "Use 'claude project list' to see available projects",
      "Create new project with 'claude project create shopify-store'"
    ]
  }
}
```

### 10.3 Recovery Mechanisms

**Config Corruption Recovery:**
```bash
$ claude project repair --config
Checking config integrity...
✗ config.json is corrupted

Attempting recovery:
✓ Backup found: config.json.backup.2025-11-05
✓ Restored from backup
✓ Validated structure

Config repaired successfully.
```

**Project Path Migration:**
```bash
$ claude project update shopify-store --path /new/path/to/shopify-store
Updating project path...
✓ Validated new path exists
✓ Validated .claude/ structure
✓ Updated config.json
✓ Path migration complete
```

---

## 11. Success Metrics

### 11.1 Functional Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Project creation success rate | >99% | Automated tests |
| Switch success rate | >99.5% | Automated tests |
| Context isolation correctness | 100% | Token tracking tests |
| Backward compatibility | 100% | Existing diet103 repos work unchanged |
| Validation accuracy | >95% | Catch errors before runtime |

### 11.2 Performance Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Project creation time | <2s | Time command wrapper |
| Project switch time | <1s | Performance benchmarks |
| List operation time | <100ms | Performance benchmarks |
| Token overhead | <25% | Claude API monitoring |
| Memory footprint | <50MB | System monitoring |

### 11.3 User Experience Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Setup time (new user) | <10 min | Documentation walkthrough |
| Learning curve | <30 min | User testing |
| Error clarity | >90% users understand | User feedback |
| Command discoverability | >80% find without docs | User testing |

---

## 12. Risk Management

### 12.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Config corruption** | Low | High | Automatic backups, validation on load, repair tools |
| **Token leakage** | Medium | High | Strict context unload, automated tests, monitoring |
| **Path conflicts** | Medium | Medium | Path normalization, validation, collision detection |
| **Diet103 incompatibility** | Low | High | Extensive compatibility testing, version checks |
| **Slow context switching** | Medium | Medium | Caching, lazy loading, performance benchmarks |

### 12.2 User Experience Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Confusing CLI** | Medium | Medium | Clear help text, examples, shell completion |
| **Lost projects** | Low | High | Never auto-delete, require confirmations, backups |
| **Migration difficulty** | High | Low | Automated migration tool, clear documentation |
| **Template confusion** | Medium | Low | Template previews, clear descriptions, examples |

### 12.3 Rollback Strategy

**If orchestrator breaks existing workflows:**

1. **Preserve existing projects:**
   - Orchestrator never modifies existing `.claude/` directories
   - Projects continue to work standalone

2. **Disable orchestrator:**
   - Rename `~/.claude/` to `~/.claude.disabled/`
   - Projects revert to independent operation

3. **Gradual migration:**
   - Allow users to opt-in projects one at a time
   - Keep unregistered projects working as before

4. **Fallback mode:**
   - If config is corrupted, CLI operates in read-only mode
   - User can still view projects, but not modify

---

## 13. Future Enhancements (Post v1.0)

### 13.1 Planned Features (v1.1)

- **Project templates marketplace:** Share and download community templates
- **Skill sharing:** Global skill library with project-level overrides
- **Project groups:** Organize related projects (e.g., "client-work", "research")
- **Auto-detect projects:** Scan directories and offer to register found `.claude/` dirs
- **Cloud sync:** Sync project registry across machines

### 13.2 Considered Features (Future)

- **Cross-project skills:** Use skills from one project in another
- **Project dependencies:** Define relationships between projects
- **Workspace mode:** Load multiple projects in hierarchy
- **Remote projects:** Manage projects on remote servers
- **Team collaboration:** Shared project registries

---

## 14. Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| **Global Layer** | System-wide orchestration infrastructure at `~/.claude/` inspired by PAI architecture |
| **Local Layer** | Project-specific Claude configuration at `<project>/.claude/` powered by diet103 patterns |
| **Meta-skill** | A skill that manages the orchestration system itself (project_orchestrator) |
| **Active Project** | The single project whose context is currently loaded into Claude's memory |
| **Context Isolation** | Guarantee that inactive projects consume zero tokens (dormant on disk) |
| **Token Footprint** | Amount of Claude context consumed by loaded data and skills |
| **diet103** | Production-tested reference library for Claude Code auto-activation (6 months validation) |
| **PAI** | Personal AI Infrastructure - Daniel Miessler's system for AI capability organization |
| **UFC** | Unified Filesystem Context - PAI's hierarchical directory structure for persistent context |
| **Skills-as-Containers** | PAI pattern where skills package related workflows, knowledge, and procedures |
| **500-Line Rule** | diet103 principle: each file <500 lines to avoid context limits, use progressive disclosure |
| **Progressive Disclosure** | Loading strategy: metadata always, detailed content on-demand only |
| **UserPromptSubmit Hook** | diet103 hook that monitors prompts and file context for skill activation triggers |
| **skill-rules.json** | Configuration file defining trigger patterns for automatic skill activation |

### B. References

**Core Architectures:**
- diet103 (Claude Code Infrastructure Showcase): https://github.com/diet103/claude-code-infrastructure-showcase
- PAI (Personal AI Infrastructure): https://github.com/danielmiessler/Personal_AI_Infrastructure
- PAI Documentation: https://danielmiessler.com/blog/personal-ai-infrastructure

**Related Documentation:**
- Claude Code Documentation: https://docs.claude.com/en/docs/claude-code
- diet103 Production Patterns: See diet103 repository README for skill architecture, hooks, and agents
- PAI Skills-as-Containers: See PAI v1.2.0 migration notes for workflow organization
- Progressive Disclosure Pattern: diet103 500-line rule implementation examples

### C. Configuration Examples

**Minimal config.json:**
```json
{
  "version": "1.0.0",
  "active_project": null,
  "projects": {}
}
```

**Multi-project config.json:**
```json
{
  "version": "1.0.0",
  "active_project": "shopify-store",
  "projects": {
    "shopify-store": {
      "path": "/Users/you/Projects/shopify-store",
      "created": "2025-11-05T10:30:00Z",
      "last_active": "2025-11-05T14:22:00Z",
      "metadata": {
        "description": "E-commerce Shopify store",
        "tags": ["shopify", "ecommerce"]
      }
    }
  },
  "settings": {
    "auto_switch_on_directory_change": false,
    "cache_last_active": true,
    "validate_on_switch": true
  }
}
```

---

## Document Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-05 | Initial comprehensive PRD | Claude Code |
| 1.1 | 2025-11-06 | Added Section 3.6: Agentic Feature Architecture & Selection - includes feature hierarchy, decision tree, sub-agent design patterns, and integration guidelines | Claude Code |

---

**END OF DOCUMENT**
