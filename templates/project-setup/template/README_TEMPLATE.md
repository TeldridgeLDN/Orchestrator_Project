# {{PROJECT_NAME}}

**Project Type:** {{PROJECT_TYPE}}  
**Setup Date:** $(date +%Y-%m-%d)  
**Infrastructure:** Orchestrator + Taskmaster + diet103 patterns

---

## Quick Start

```bash
# View current project
orchestrator current

# Get next task
task-master next

# View task details
task-master show <id>

# Start working
# ... implement code ...

# Log progress
task-master update-subtask --id=X.Y --prompt="Progress notes..."

# Complete task
task-master set-status --id=X.Y --status=done

# Commit
git add . && git commit -m "..."
```

---

## Project Structure

```
.
├── .claude/
│   ├── settings.json           # Hook & skill configuration
│   ├── skill-rules.json        # Auto-activation triggers
│   ├── hooks/                  # Skill activation logic
│   ├── skills/                 # Project-specific skills
│   ├── agents/                 # Specialized agents
│   └── knowledge/              # Documented patterns & decisions
├── .taskmaster/
│   ├── tasks/tasks.json        # Task management
│   └── docs/                   # PRDs and documentation
├── DAILY_WORKFLOW.md           # Workflow reference
└── README.md                   # This file
```

---

## Skills & Agents

### Installed Skills

Check `.claude/skills/` directory for available skills.

Skills auto-activate based on trigger phrases defined in `.claude/skill-rules.json`.

### Available Agents

Check `.claude/agents/` directory for specialized agents.

---

## Daily Workflow

See `DAILY_WORKFLOW.md` for detailed workflow guide.

**Essential Commands:**
- `orchestrator current` - Where am I?
- `task-master next` - What should I work on?
- `task-master update-subtask` - Log progress
- `task-master set-status` - Complete task

---

## Knowledge Base

Document patterns, decisions, and prompts in `.claude/knowledge/`:

- `patterns/` - Recurring solutions
- `decisions/` - Architectural decisions (ADRs)
- `prompts/` - Reusable prompts

---

## Getting Help

```bash
# Orchestrator help
orchestrator help

# Taskmaster help
task-master help

# Read workflow guide
cat DAILY_WORKFLOW.md
```

---

## License

[Your License Here]

---

**Setup by:** [Orchestrator Project Setup](https://github.com/yourusername/orchestrator)  
**Infrastructure:** Based on [diet103](https://github.com/diet103/claude-code-infrastructure-showcase) & [Daniel Miessler](https://github.com/danielmiessler/Personal_AI_Infrastructure) patterns

