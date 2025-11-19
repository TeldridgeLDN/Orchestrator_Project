# Orchestrator Project Setup Template

**Version:** 1.0.0  
**Date:** November 15, 2025  
**Based on:** diet103 & Miessler infrastructure patterns

---

## Overview

This template allows you to quickly set up any project with Orchestrator infrastructure, including:

- ✅ Skill auto-activation (diet103 pattern)
- ✅ Hook-based context injection
- ✅ Taskmaster integration
- ✅ Knowledge base structure
- ✅ Specialized agents
- ✅ Daily workflow guides

**Setup Time:** ~2 minutes per project

---

## Quick Start

### Option 1: Basic Setup (Recommended)

```bash
# From Orchestrator_Project root
./templates/project-setup/setup-project.sh ~/projects/my-new-project
```

This will:
1. Create project directory
2. Install infrastructure (hooks, skills, agents)
3. Initialize Git
4. Register with Orchestrator
5. Initialize Taskmaster
6. Create initial commit

### Option 2: Custom Setup

```bash
# Backend API project with specific skills
./templates/project-setup/setup-project.sh \
  --type backend \
  --skills "backend-dev,testing" \
  --name "ACME Corp API" \
  ~/projects/acme-api

# Frontend project, no prompts
./templates/project-setup/setup-project.sh \
  --yes \
  --type frontend \
  --skills "frontend-dev" \
  ~/projects/my-blog
```

### Option 3: Manual Setup

If the script doesn't work, copy files manually:

```bash
# Create project
mkdir -p ~/projects/my-project
cd ~/projects/my-project

# Copy infrastructure
cp -r /path/to/Orchestrator_Project/templates/project-setup/template/.claude .
cp /path/to/Orchestrator_Project/templates/project-setup/template/DAILY_WORKFLOW.md .
cp /path/to/Orchestrator_Project/templates/project-setup/template/README_TEMPLATE.md README.md

# Initialize
git init
orchestrator register "My Project"
task-master init
```

---

## Script Options

```
Usage: setup-project.sh [OPTIONS] PROJECT_PATH

OPTIONS:
  -n, --name NAME       Project name (defaults to directory name)
  -t, --type TYPE       Project type: backend, frontend, fullstack, library
  -s, --skills LIST     Comma-separated skills (default: scenario-manager)
  --no-taskmaster       Skip Taskmaster initialization
  --no-register         Skip Orchestrator registration
  -y, --yes             Skip all prompts
  -h, --help            Show help
```

---

## Project Types

### Backend
**Best for:** REST APIs, GraphQL servers, microservices

**Includes:**
- Backend-focused agents
- API testing patterns
- Database patterns
- Server-side validation

**Recommended Skills:** backend-dev, testing, doc-generator

### Frontend
**Best for:** React/Vue/Angular apps, static sites

**Includes:**
- Frontend-focused agents
- Component patterns
- State management patterns
- UI/UX guidelines

**Recommended Skills:** frontend-dev, testing, design-system

### Fullstack
**Best for:** Full-stack applications, monoliths

**Includes:**
- Both backend and frontend agents
- Integration patterns
- End-to-end testing patterns

**Recommended Skills:** backend-dev, frontend-dev, testing

### Library
**Best for:** npm packages, Python libraries, shared modules

**Includes:**
- Library-focused agents
- API design patterns
- Documentation patterns
- Publishing workflows

**Recommended Skills:** doc-generator, testing, scenario-manager

---

## Available Skills

Skills are auto-activated based on trigger phrases.

### scenario_manager (Default)
**Triggers:** "create scenario", "new scenario", "validate scenario"  
**Use for:** Creating reusable project templates

### backend-dev (Optional)
**Triggers:** "create endpoint", "add route", "database query"  
**Use for:** Backend development patterns

### frontend-dev (Optional)
**Triggers:** "create component", "add component", "React component"  
**Use for:** Frontend development patterns

### testing (Optional)
**Triggers:** "test", "write tests", "test coverage"  
**Use for:** Testing strategies and patterns

### doc-generator (Optional)
**Triggers:** "generate docs", "create documentation"  
**Use for:** Automated documentation generation

---

## What Gets Created

```
your-project/
├── .claude/
│   ├── settings.json              # Hook registration
│   ├── skill-rules.json           # Auto-activation triggers
│   ├── hooks/
│   │   └── skill-activation.js    # Diet103 activation logic
│   ├── skills/
│   │   └── scenario_manager/      # Default skill
│   ├── agents/
│   │   └── test-selector.md       # Default agent
│   └── knowledge/
│       ├── patterns/               # Document recurring solutions
│       ├── decisions/              # Log architectural decisions
│       └── prompts/                # Save reusable prompts
├── .cursor/
│   └── rules/                      # Cursor-specific rules
├── .taskmaster/
│   ├── tasks/tasks.json            # Task management
│   └── docs/example-prd.txt        # PRD template
├── .gitignore                      # Sensible defaults
├── DAILY_WORKFLOW.md               # Workflow reference
└── README.md                       # Project documentation
```

---

## After Setup

### Step 1: Verify Installation (1 minute)

```bash
cd your-project

# Check project is registered
orchestrator current

# Should show your project name and path
```

### Step 2: Read Workflow Guide (5 minutes)

```bash
cat DAILY_WORKFLOW.md
```

Focus on these 7 commands:
1. `orchestrator current` - Where am I?
2. `task-master next` - What's next?
3. `task-master show <id>` - View task
4. `task-master update-subtask` - Log progress
5. `task-master set-status` - Complete task
6. `orchestrator switch` - Change project
7. `git add/commit` - Commit work

### Step 3: Create Tasks (10 minutes)

**Option A: From PRD**
```bash
# Edit the example PRD
vim .taskmaster/docs/example-prd.txt

# Generate tasks
task-master parse-prd .taskmaster/docs/example-prd.txt

# View tasks
task-master list
```

**Option B: Manual**
```bash
# Add tasks one by one
task-master add-task --prompt="Set up project structure"
task-master add-task --prompt="Configure build system"
task-master add-task --prompt="Write initial tests"
```

### Step 4: Start Working (∞)

```bash
# Get next task
task-master next

# View details
task-master show 1.1

# Implement in agent chat
# ... code ...

# Log progress
task-master update-subtask --id=1.1 --prompt="Completed setup"

# Mark done
task-master set-status --id=1.1 --status=done

# Commit
git add . && git commit -m "..."
```

---

## Customization

### Adding More Skills

1. Copy skill to `.claude/skills/new-skill/`
2. Add trigger rules to `.claude/skill-rules.json`:

```json
{
  "id": "new_skill",
  "trigger_phrases": ["keyword1", "keyword2"],
  "skill": "new-skill",
  "auto_activate": true,
  "priority": "high"
}
```

3. Test: Say trigger phrase in agent chat

### Adding More Agents

Create `.claude/agents/my-agent.md` with this structure:

```markdown
# Agent Name

**Role:** [Specialist description]

## Purpose
What this agent does...

## Workflow
How to use this agent...

## Example Interactions
Concrete examples...
```

### Project-Specific Knowledge

Document your patterns in `.claude/knowledge/`:

```bash
# Recurring solution
echo "# Auth Pattern" > .claude/knowledge/patterns/auth.md

# Architectural decision
echo "# ADR 001: Chose PostgreSQL" > .claude/knowledge/decisions/001-postgres.md

# Reusable prompt
echo "# Add Feature Template" > .claude/knowledge/prompts/add-feature.md
```

---

## Troubleshooting

### Script Fails: "orchestrator command not found"

Install Orchestrator globally:
```bash
npm install -g orchestrator-project
```

Or skip registration:
```bash
./setup-project.sh --no-register ~/projects/my-project
```

### Script Fails: "task-master command not found"

Install Taskmaster globally:
```bash
npm install -g task-master-ai
```

Or skip Taskmaster:
```bash
./setup-project.sh --no-taskmaster ~/projects/my-project
```

### Skills Not Auto-Activating

Check `.claude/settings.json` includes:
```json
"hooks": {
  "UserPromptSubmit": [
    ".claude/hooks/skill-activation.js"
  ]
}
```

Restart your agent/IDE after changes.

### Git Issues

If git init fails:
```bash
cd your-project
git init
git add .
git commit -m "Initial commit"
```

---

## Examples

### Example 1: Backend REST API

```bash
./setup-project.sh \
  --type backend \
  --name "User Service API" \
  --skills "backend-dev,testing" \
  ~/projects/user-service-api

cd ~/projects/user-service-api

# Create PRD describing your API
vim .taskmaster/docs/user-service-prd.txt

# Generate tasks
task-master parse-prd .taskmaster/docs/user-service-prd.txt

# Start working
task-master next
```

### Example 2: React Frontend

```bash
./setup-project.sh \
  --type frontend \
  --name "Marketing Dashboard" \
  --skills "frontend-dev" \
  ~/projects/marketing-dashboard

cd ~/projects/marketing-dashboard

# Manually add initial tasks
task-master add-task --prompt="Set up React + TypeScript"
task-master add-task --prompt="Create component library"
task-master add-task --prompt="Build dashboard layout"

# Start working
task-master next
```

### Example 3: Quick Prototype

```bash
# Use defaults, skip prompts
./setup-project.sh -y ~/projects/prototype

cd ~/projects/prototype
task-master add-task --prompt="Build quick prototype"
task-master next
# ... code ...
```

---

## Updating the Template

If you improve your infrastructure in Orchestrator_Project, update the template:

```bash
# From Orchestrator_Project root
cd templates/project-setup/template

# Copy updated files
cp ~/Orchestrator_Project/.claude/hooks/skill-activation.js .claude/hooks/
cp ~/Orchestrator_Project/DAILY_WORKFLOW.md .

# Update other files as needed
```

---

## Best Practices

### 1. Keep Template Minimal

Don't include project-specific code. Template should only include:
- Infrastructure (hooks, skills, agents)
- Documentation (workflows, guides)
- Configuration (settings, rules)

### 2. Customize Per Project

After setup, customize for your specific needs:
- Adjust trigger phrases in `skill-rules.json`
- Add project-specific skills
- Document patterns in `knowledge/`

### 3. Version Your Infrastructure

As you improve your workflow:
1. Update Orchestrator_Project infrastructure
2. Copy changes to template
3. Apply to new projects
4. Optionally update existing projects

### 4. Share Templates

For teams, create specialized templates:
```
templates/
├── backend-api/        # For backend services
├── react-app/          # For React applications
├── python-library/     # For Python packages
└── project-setup/      # Base template (this one)
```

---

## Resources

- **Main Project:** [Orchestrator_Project](/)
- **diet103 Infrastructure:** https://github.com/diet103/claude-code-infrastructure-showcase
- **Miessler Infrastructure:** https://github.com/danielmiessler/Personal_AI_Infrastructure
- **Taskmaster:** https://github.com/tomeldridge/task-master-ai

---

## Contributing

Found ways to improve the template? 

1. Update Orchestrator_Project infrastructure
2. Test improvements
3. Update this template
4. Document changes

---

**Created:** November 15, 2025  
**Last Updated:** November 15, 2025  
**Maintainer:** Orchestrator Project

