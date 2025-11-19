# Orchestrator Quick Reference

**One-page guide to essential Orchestrator (diet103) commands and workflows.**

---

## Project Initialization

### Create New Project

```bash
diet103 init
```

**Interactive prompts:**
- Project name & description
- TaskMaster integration (optional)
- Shell integration (optional)
- **Skill Priming** ⭐ NEW
  - Auto: Activate skills based on project type
  - Custom: Choose specific skills
  - Skip: Manual configuration later

**Auto-detected project types:**
- web-app, cli-tool, data-pipeline, api-service, library

---

## Core Commands

### Validation & Health

```bash
diet103 validate              # Check infrastructure integrity
diet103 health                # Assess project health score
```

### Shell Integration

```bash
diet103 shell install         # Add project name to terminal prompt
diet103 shell uninstall       # Remove shell integration
diet103 shell status          # Check current configuration
```

### Knowledge Management

```bash
diet103 knowledge-sync        # Sync project context to global knowledge
diet103 session save          # Save current session state
diet103 session restore       # Restore previous session
```

### Rule Management

```bash
diet103 rules add cursor      # Add Cursor rules profile
diet103 rules remove roo      # Remove Roo rules profile
diet103 rules list            # Show active rule profiles
```

---

## TaskMaster Integration

### Task Management

```bash
task-master init              # Initialize TaskMaster in project
task-master list              # Show all tasks
task-master next              # Get next available task
task-master show <id>         # View task details
```

### Task Operations

```bash
task-master set-status --id=<id> --status=done
task-master expand --id=<id> --research
task-master update-task --id=<id> --prompt="changes..."
```

### PRD Workflow

```bash
task-master parse-prd docs/prd.txt
task-master analyze-complexity --research
task-master expand --all --research
```

---

## Skill System

### Available Skills

- **📚 doc-generator** - Automatic documentation generation
- **🧪 test-runner** - Test execution and reporting
- **🔗 link-checker** - Link validation
- **📦 scenario_manager** - Scenario-based workflows
- **🐚 shell-integration** - Terminal enhancements
- **📋 rule-management** - Rule creation and maintenance

### Skill Auto-Activation

Skills activate automatically based on:
- **Trigger phrases** in your requests
- **File patterns** you're working with
- **Project context** from initialization

**Check active skills:**
```bash
cat .claude/skill-rules.json
```

---

## Project Structure

```
project/
├── .claude/                    # Claude orchestration
│   ├── metadata.json          # Project metadata
│   ├── skill-rules.json       # Skill activation rules
│   ├── settings.json          # Claude Code settings
│   ├── skills/                # Skill definitions
│   ├── agents/                # Specialized agents
│   ├── commands/              # Slash commands
│   ├── hooks/                 # Automation hooks
│   └── knowledge/             # Project knowledge base
│
├── .taskmaster/               # Task management (optional)
│   ├── tasks/tasks.json      # Task definitions
│   ├── config.json           # TaskMaster config
│   └── docs/                 # PRDs and documentation
│
├── .mcp.json                  # MCP server configuration
├── .env                       # API keys (gitignored)
├── .env.example              # Template for API keys
├── CLAUDE.md                 # Project context (auto-loaded)
└── .gitignore                # Git ignore patterns
```

---

## Environment Setup

### Required API Keys

Add to `.env` file (copy from `.env.example`):

```bash
# Essential
ANTHROPIC_API_KEY=sk-ant-...        # Claude models
PERPLEXITY_API_KEY=pplx-...         # Research features

# Optional
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
XAI_API_KEY=...
MISTRAL_API_KEY=...
```

### Model Configuration

```bash
task-master models --setup          # Interactive configuration
task-master models --set-main claude-3-5-sonnet-20241022
task-master models --set-research perplexity-llama-3.1-sonar-large-128k-online
```

---

## Common Workflows

### Starting a New Feature

```bash
# 1. Get next task
task-master next

# 2. Expand if needed
task-master expand --id=<id> --research

# 3. Work on subtasks
task-master show <id>.<subtask>

# 4. Mark complete
task-master set-status --id=<id>.<subtask> --status=done
```

### Code Review Workflow

```bash
# 1. Stage your changes
git add .

# 2. Run pre-merge review (if using agents)
# Use slash command: /pre-merge-review

# 3. Commit with descriptive message
git commit -m "feat: implement feature X"
```

### Project Health Check

```bash
# 1. Validate infrastructure
diet103 validate

# 2. Check health score
diet103 health

# 3. Sync knowledge if needed
diet103 knowledge-sync
```

---

## Tips & Tricks

### Skill Activation Control

**Force activate a skill:**
```json
// Edit .claude/skill-rules.json
{
  "skill": "my-skill",
  "auto_activate": true  // ← Change to true
}
```

**Disable auto-activation:**
```json
{
  "skill": "my-skill",
  "auto_activate": false  // ← Change to false
}
```

### Project Type Override

**Force specific project type during init:**

Edit `lib/commands/init.js` or use Custom mode and select appropriate skills manually.

### TaskMaster Research Mode

**Enable research for better task generation:**
```bash
task-master expand --id=<id> --research --force
```

The `--research` flag uses Perplexity AI for up-to-date context.

### Shell Integration for Multiple Projects

Shell integration shows project name in terminal:
```bash
(my-project) user@machine:~/my-project$
```

Works across all your Orchestrator projects!

---

## Troubleshooting

### Skills Not Activating

1. Check `skill-rules.json` has `auto_activate: true`
2. Verify skill exists in `.claude/skills/`
3. Try manual trigger phrase (e.g., "use scenario manager")

### TaskMaster API Errors

1. Check API key in `.env` or `.mcp.json`
2. Run `task-master models` to verify configuration
3. Test with `task-master list` (doesn't require AI)

### Init Command Hangs

1. Ensure all prompts are answered (or use `--no-interactive`)
2. Check network connection if using `--taskmaster`
3. Skip skill priming with "Skip" mode

### Project Type Misdetected

1. Use **Custom mode** during init
2. Manually select appropriate skills
3. Alternatively, run after init:
   ```javascript
   import { primeSkillsForProject } from './lib/init/skills_priming.js';
   await primeSkillsForProject({ 
     projectRoot: process.cwd(),
     projectType: 'web-app',  // force type
     verbose: true 
   });
   ```

---

## Help & Documentation

- **Full Documentation:** `Docs/` directory
- **Skill Guide:** `Docs/SKILL_PRIMING.md`
- **Shell Integration:** `Docs/SHELL_INTEGRATION.md`
- **Global Rules:** `Docs/GLOBAL_RULES_SYSTEM.md`
- **Changelog:** `CHANGELOG.md`
- **Implementation:** `*_COMPLETE.md` files

---

## Quick Links

| Command | What It Does |
|---------|-------------|
| `diet103 init` | Start new project with guided setup |
| `diet103 validate` | Check project infrastructure |
| `diet103 health` | Get project health score |
| `task-master init` | Add task management to project |
| `task-master next` | Find next task to work on |
| `task-master parse-prd` | Generate tasks from PRD |

---

*Last Updated: November 15, 2025*  
*Orchestrator Project (diet103) v1.3.0*
