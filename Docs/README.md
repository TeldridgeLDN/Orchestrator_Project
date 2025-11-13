# Project Orchestrator

A powerful CLI tool for managing multiple Claude development projects with isolated contexts, efficient switching, and template-based project creation.

## What is Project Orchestrator?

Project Orchestrator solves the problem of working on multiple Claude projects simultaneously. Instead of having all your project contexts loaded at once (wasting tokens), it provides:

- **Context Isolation**: Only one project's context is active at a time
- **Fast Switching**: Change between projects in under 1 second
- **Template System**: Create new projects from pre-configured templates
- **Diet103 Compatible**: Follows PAI Skills-as-Containers architecture
- **Token Efficient**: Minimal overhead, maximum productivity

## Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Orchestrator_Project

# Set up the CLI (one-time setup)
cd ~/.claude
npm install
chmod +x bin/claude

# Add to your PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$HOME/.claude/bin:$PATH"

# Or create an alias
alias claude="~/.claude/bin/claude"
```

### Your First Project

```bash
# Create a new project from the base template
claude project create my-first-project --template base

# The project is automatically set as active
# Start working immediately!
```

### Essential Commands

```bash
# List all your projects
claude project list

# Switch to a different project
claude project switch my-other-project

# Check project health
claude project validate my-first-project

# Remove a project (keeps files, just unregisters)
claude project remove old-project
```

## How It Works

### Context Isolation

Only the active project's `.claude/` directory is loaded:
- Project-specific skills
- Custom commands
- Hooks and agents
- Project instructions (Claude.md)

Inactive projects remain completely dormant, saving tokens and preventing context pollution.

### Project Structure

When you create a project, you get a complete diet103 structure:

```
my-project/
└── .claude/
    ├── Claude.md              # Project-specific context
    ├── metadata.json          # Project info
    ├── skill-rules.json       # Auto-activation rules
    ├── hooks/                 # UserPromptSubmit, PostToolUse
    ├── skills/                # Project-specific skills
    ├── agents/                # Custom agents
    ├── commands/              # Slash commands
    └── resources/             # Additional resources
```

### Templates

Start new projects faster with templates:

- **base**: Minimal diet103 structure for any project
- **web-app**: Pre-configured for web development
- **shopify**: E-commerce development setup

```bash
# Create from template
claude project create my-store --template shopify --description "My e-commerce site"
```

## Real-World Workflow

### Scenario: Working on Multiple Clients

```bash
# Morning: Work on client A's website
claude project switch client-a-website
# ... do work ...

# Afternoon: Switch to client B's API
claude project switch client-b-api
# ... do work ...

# Evening: Personal project
claude project switch my-side-project
# ... do work ...
```

Each project maintains its own:
- Skill configurations
- Development context
- Custom workflows
- Git repository

### Scenario: Starting a New Feature

```bash
# Create a new project for the feature
claude project create auth-system --template web-app

# Work on it in isolation
# ... implement feature ...

# When ready, merge back or switch to main project
claude project switch main-app
```

## Understanding Context Layers

Project Orchestrator uses a **two-layer architecture** to efficiently manage your AI development workflow:

### The Two Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    GLOBAL LAYER (~/.claude/)                │
│                                                             │
│  Purpose: Project orchestration and CLI management         │
│  Token Cost: ~500 tokens (always loaded)                   │
│  Contains:                                                  │
│    • CLI executable (bin/claude)                           │
│    • Project management commands                           │
│    • Global configuration (config.json)                    │
│    • Project templates                                     │
│    • Orchestration skills                                  │
│                                                             │
│  Active: Always (manages all projects)                     │
│  Scope: Cross-project operations                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
              ┌─────────────────────────┐
              │   Project Switching      │
              │   (< 1 second)          │
              └─────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         PROJECT LAYER (~/Projects/my-project/.claude/)      │
│                                                             │
│  Purpose: Project-specific context and behavior            │
│  Token Cost: ~1,300+ tokens (only when active)             │
│  Contains:                                                  │
│    • Claude.md (project context)                           │
│    • Project metadata                                      │
│    • Project-specific skills                               │
│    • Custom hooks and agents                               │
│    • Slash commands                                        │
│    • Project resources                                     │
│                                                             │
│  Active: Only the current project                          │
│  Scope: Single project operations                          │
└─────────────────────────────────────────────────────────────┘
```

### Why Two Layers?

**Without Orchestrator** (All projects loaded at once):
```
Total Token Cost = 500 (global) + 1,300 (project A) + 1,300 (project B) + 1,300 (project C)
                 = 4,400 tokens 🔴 High cost, slow context
```

**With Orchestrator** (One project at a time):
```
Total Token Cost = 500 (global) + 1,300 (active project only)
                 = 1,800 tokens ✅ 59% reduction, fast context
```

### Context Verification

Check which context layer you're working in:

```bash
# Verify global layer is active
claude --version                    # Shows: Project Orchestrator v1.0.0
echo $CLAUDE_HOME                   # Shows: ~/.claude

# Verify project layer
claude project list                 # Shows all registered projects
claude project current              # Shows: my-first-project (active)

# Check what's loaded
ls ~/.claude/                       # Global layer files
ls ~/Projects/my-project/.claude/   # Project layer files (if active)
```

### Common Context Scenarios

#### Scenario 1: Creating a New Project
**Active Layers:** Global only  
**Token Cost:** ~500 tokens  
**What Happens:**
1. Global layer validates project name
2. Global layer copies template
3. Project layer is created but NOT loaded
4. Project becomes active (layer loads)

```bash
claude project create my-app --template base
# During creation: Global layer (~500 tokens)
# After creation: Global + Project layers (~1,800 tokens)
```

#### Scenario 2: Switching Projects
**Active Layers:** Global + Old Project → Global + New Project  
**Token Cost:** ~1,800 tokens (constant)  
**What Happens:**
1. Old project layer unloads
2. New project layer loads
3. Total tokens stay the same

```bash
claude project switch other-project
# Before: Global (~500) + Old Project (~1,300) = 1,800
# After:  Global (~500) + New Project (~1,300) = 1,800
# Switching time: <1 second
```

#### Scenario 3: Working in a Project
**Active Layers:** Global + Active Project  
**Token Cost:** ~1,800 tokens  
**What Happens:**
1. You interact with Claude Code
2. Project layer provides context
3. Global layer remains dormant
4. Inactive projects use 0 tokens

```bash
# While working in my-project:
# Active: Global (~500) + my-project (~1,300) = 1,800 tokens
# Inactive: client-a (0 tokens), client-b (0 tokens), experiment (0 tokens)
```

### Token Optimization Tips

1. **Keep projects focused**: Smaller `.claude/Claude.md` = fewer tokens
2. **Use templates wisely**: Start with minimal structure, add as needed
3. **Archive old projects**: Remove from orchestrator (keeps files)
4. **Switch frequently**: No penalty for switching, always same token cost

## Key Features

### Token Efficiency
- Global orchestration context: ~500 tokens
- Only active project loaded: ~1,300 tokens
- Inactive projects: 0 tokens
- Total active cost: ~1,800 tokens vs 4,400+ without orchestrator
- Cached contexts for instant resume

### Fast Operations
- Project creation: ~1-2 seconds (with validation)
- Context switching: <1 second
- Project listing: instant
- Validation checks: ~1 second

### Extensibility
- Create custom templates
- Add project-specific skills
- Configure per-project hooks
- Define custom slash commands

## Common Use Cases

### Development Agency
Manage multiple client projects with isolated contexts:
```bash
claude project create acme-corp --template web-app
claude project create xyz-startup --template shopify
```

### Open Source Maintainer
Separate work for different repositories:
```bash
claude project create my-lib-v2 --template base
claude project create my-lib-docs --template base
```

### Full-Stack Developer
Different contexts for frontend/backend/mobile:
```bash
claude project create frontend --template web-app
claude project create backend --template base
claude project create mobile --template base
```

### Experimenter
Isolated environments for testing new approaches:
```bash
claude project create experiment-graphql --template base
claude project create experiment-microservices --template base
```

## Configuration

Project Orchestrator stores its configuration in `~/.claude/config.json`:

```json
{
  "version": "1.0.0",
  "active_project": "my-first-project",
  "projects": {
    "my-first-project": {
      "path": "/Users/you/Projects/my-first-project",
      "created": "2025-11-07T10:00:00Z",
      "last_active": "2025-11-07T15:30:00Z",
      "metadata": {
        "description": "My first orchestrated project",
        "tags": ["learning", "experiment"]
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

## Getting Help

### Documentation
- [Getting Started Guide](GETTING_STARTED.md) - Detailed walkthrough
- [CLI Reference](CLI_REFERENCE.md) - Complete command documentation
- [Slash Commands Reference](SLASH_COMMANDS.md) - **NEW!** Quick commands for Claude Code IDE
- [Project Health Guide](PROJECT_HEALTH_GUIDE.md) - **NEW!** Understanding and improving project health scores
- [Project Portability Checklist](PROJECT_PORTABILITY_CHECKLIST.md) - Optimize new/migrated projects
- [Architecture](ARCHITECTURE.md) - System design and internals
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions
- [FAQ](FAQ.md) - Frequently asked questions

### Workflow & Scenario System
- [Workflow Creation Guide](WORKFLOW_CREATION_GUIDE.md) - Complete guide for creating workflows
- [Agentic Feature Selection](Agentic_Feature_Selection_Workflow.md) - Decision tree for feature selection
- [Workflows Library](workflows/) - Reusable technical implementation patterns
- [Scenarios Library](scenarios/) - Complete business solution templates
- **[Scenario CLI Guide](../docs/SCENARIO_CLI.md)** - **NEW!** Complete CLI reference for scenario management
- [Scenario Quick Reference](../docs/SCENARIO_QUICK_REFERENCE.md) - One-page command cheat sheet

### Quick Reference
- [Developer Quick Reference](Quick_Implementation_Reference.md) - For contributors
- [MCP Integration Guide](MCP_INTEGRATION_GUIDE.md) - External system integrations

### Support
```bash
# Check version
claude --version

# Get help
claude --help
claude project --help
```

## Next Steps

1. **Read the [Getting Started Guide](GETTING_STARTED.md)** for a detailed walkthrough
2. **Create your first project** using `claude project create`
3. **Explore templates** to find the best starting point
4. **Browse [Workflows Library](workflows/)** for reusable implementation patterns
5. **Check [Scenarios Library](scenarios/)** for complete business solution examples
6. **Customize your workflow** with project-specific skills and commands

## Philosophy

Project Orchestrator follows these principles:

- **Single Active Context Rule**: Only one project context at a time
- **Token Efficiency First**: Minimal overhead, maximum value
- **Diet103 Compatible**: Follows PAI Skills-as-Containers architecture
- **Explicit Over Implicit**: Clear project switching, no magic
- **Fast and Predictable**: Sub-second operations, consistent behavior

## Contributing

See [Developer Quick Reference](Quick_Implementation_Reference.md) for implementation details and contribution guidelines.

---

**Version**: 1.0.0
**Last Updated**: 2025-11-07
**License**: [Your License]
**Repository**: [Your Repository URL]
