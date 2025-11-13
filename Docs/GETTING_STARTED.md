# Getting Started with Project Orchestrator

This guide walks you through setting up and using Project Orchestrator, from installation to advanced workflows.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Your First Project](#your-first-project)
4. [Migrating Existing Projects](#migrating-existing-projects)
5. [Understanding Project Structure](#understanding-project-structure)
6. [Working with Templates](#working-with-templates)
7. [Daily Workflow](#daily-workflow)
8. [Advanced Usage](#advanced-usage)
9. [Tips and Best Practices](#tips-and-best-practices)

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** v14 or higher installed
- **npm** or **yarn** package manager
- **Git** for version control
- Basic familiarity with command line
- Claude Code or Claude API access

Check your Node.js version:
```bash
node --version  # Should be v14.0.0 or higher
```

---

## Installation

### Step 1: Clone the Repository

```bash
# Clone the Project Orchestrator
git clone <repository-url>
cd Orchestrator_Project
```

### Step 2: Install Dependencies

```bash
# Navigate to the CLI directory
cd ~/.claude

# Install dependencies
npm install
```

### Step 3: Make CLI Executable

```bash
# Make the CLI executable
chmod +x ~/.claude/bin/claude
```

### Step 4: Add to PATH

Choose one of these options:

**Option A: Add to PATH (Recommended)**
```bash
# For bash users - add to ~/.bashrc
echo 'export PATH="$HOME/.claude/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# For zsh users - add to ~/.zshrc
echo 'export PATH="$HOME/.claude/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Option B: Create an Alias**
```bash
# For bash users
echo 'alias claude="$HOME/.claude/bin/claude"' >> ~/.bashrc
source ~/.bashrc

# For zsh users
echo 'alias claude="$HOME/.claude/bin/claude"' >> ~/.zshrc
source ~/.zshrc
```

### Step 5: Verify Installation

```bash
# Test the CLI
claude --version

# Should output: Project Orchestrator v1.0.0 (or similar)

# View available commands
claude --help
```

---

## Your First Project

Let's create your first orchestrated project from scratch.

### Create a New Project

```bash
# Create a project using the base template
claude project create my-first-project --template base

# Output:
# ✅ Created project: my-first-project
# 📁 Location: /Users/you/Projects/my-first-project
# 🎯 Active project set to: my-first-project
```

### What Just Happened?

The CLI created:
1. A new directory at `~/Projects/my-first-project/`
2. A complete `.claude/` structure inside it
3. Registered the project in `~/.claude/config.json`
4. Set it as the active project

### Understanding Your Environment Context

**Important:** Project Orchestrator operates on **two distinct context layers**. Understanding this helps avoid confusion and optimize your workflow.

#### The Two Context Layers

**Global Layer** (`~/.claude/`):
- Always active, manages ALL projects
- Contains: CLI, config, templates
- Token cost: ~500 tokens (constant)

**Project Layer** (`~/Projects/my-first-project/.claude/`):
- Only active project is loaded
- Contains: Project context, skills, hooks
- Token cost: ~1,300 tokens (only when active)

#### Verification: Which Layer Am I In?

```bash
# Check global layer (always works)
claude --version                    # ✅ Global layer is working
claude project list                 # ✅ Shows all projects

# Check project layer (only works if project is active)
claude project current              # Shows: my-first-project
ls ~/Projects/my-first-project/.claude/  # Shows project files

# Verify what's loaded
echo "Current project files:"
ls -la ~/Projects/my-first-project/.claude/

echo "Global orchestrator files:"
ls -la ~/.claude/
```

#### Common Context Confusion

**Problem:** "Why can't Claude see my project-specific skills?"
**Answer:** The project might not be active. Run:
```bash
claude project current              # Check which project is active
claude project switch my-project    # Switch if needed
```

**Problem:** "Changes to ~/.claude/config.json aren't reflecting"
**Answer:** That's the global layer. Project-specific changes go in:
```bash
# Project layer (project-specific)
~/Projects/my-project/.claude/metadata.json
~/Projects/my-project/.claude/skill-rules.json

# Global layer (cross-project)
~/.claude/config.json
```

**Problem:** "Token count seems high even with one project"
**Answer:** Verify only one project is active:
```bash
claude project list
# Only one project should show as "(active)"
```

#### Environment Context Checklist

Before starting work, verify your environment:

- [ ] **Global layer active**: `claude --version` works
- [ ] **Correct project active**: `claude project current` shows your project
- [ ] **Project files exist**: `.claude/` directory in project folder
- [ ] **No other projects loaded**: Only one project marked "(active)"

### Explore the Project

```bash
# Navigate to your project
cd ~/Projects/my-first-project

# View the structure
tree .claude/

# Output:
# .claude/
# ├── Claude.md              # Project context
# ├── metadata.json          # Project info
# ├── skill-rules.json       # Skill activation rules
# ├── hooks/
# │   ├── UserPromptSubmit.js
# │   └── PostToolUse.js
# ├── skills/
# ├── agents/
# ├── commands/
# └── resources/
```

### Customize Your Project

After creating a project, the orchestrator will display a **Portability Analysis** checkpoint with recommendations for optimizing your setup.

```bash
# Edit the project context
nano .claude/Claude.md

# Add your project-specific instructions, workflows, and context

# Review the portability checklist
cat Docs/PROJECT_PORTABILITY_CHECKLIST.md
```

**📋 Important**: Follow the [Project Portability Checklist](PROJECT_PORTABILITY_CHECKLIST.md) to:
- Merge permissions from existing projects
- Adapt validation hooks for your tech stack
- Configure skill auto-activation
- Create project-specific slash commands

### Start Working

Your project is now active! When you use Claude Code or Claude API:
- Only this project's context is loaded
- Skills from this project are available
- Hooks from this project are active

---

## Migrating Existing Projects

Have existing projects? Here's how to migrate them to the orchestrator approach.

### Scenario: You Have Existing Claude Projects

You've been working on several projects without orchestration:
- `/Users/you/old-project-1/` - Has some `.claude/` files
- `/Users/you/old-project-2/` - No `.claude/` directory yet
- `/Users/you/legacy-app/` - Complex setup with custom configs

### Migration Strategy

#### Option 1: Register Existing Projects (Minimal Changes)

If your project already has a `.claude/` directory with diet103 structure:

```bash
# Navigate to the project
cd /Users/you/old-project-1

# Validate it has the required structure
ls -la .claude/

# If it has Claude.md, hooks/, skills/, etc., register it:
claude project register

# Or specify the path explicitly:
claude project register /Users/you/old-project-1 --name old-project-1
```

**What this does:**
- ✅ Adds project to `~/.claude/config.json`
- ✅ No files are modified
- ✅ Project becomes available for switching
- ✅ Existing structure is preserved
- 📋 Displays **Portability Analysis** checkpoint (see [checklist](PROJECT_PORTABILITY_CHECKLIST.md))

#### Option 2: Initialize Minimal Structure (Quick Setup)

If your project lacks a `.claude/` directory:

```bash
# Navigate to the project
cd /Users/you/old-project-2

# Initialize with base template
claude project init --template base

# Output:
# ✅ Initialized .claude/ directory
# 📁 Created: .claude/Claude.md, hooks/, skills/, etc.
# 🎯 Project registered as: old-project-2
```

**What this creates:**
```
old-project-2/
├── (your existing files)
└── .claude/              # ← NEW
    ├── Claude.md
    ├── metadata.json
    ├── skill-rules.json
    ├── hooks/
    ├── skills/
    ├── agents/
    ├── commands/
    └── resources/
```

#### Option 3: Migrate with Custom Configuration (Advanced)

For complex projects with existing non-standard configurations:

```bash
cd /Users/you/legacy-app

# Step 1: Backup existing config (if any)
[ -d .claude ] && cp -r .claude .claude.backup

# Step 2: Initialize base structure
claude project init --template base

# Step 3: Merge your custom configuration
# Manually copy custom skills, hooks, or configs from backup
cp .claude.backup/skills/my-custom-skill.js .claude/skills/
cp .claude.backup/hooks/MyCustomHook.js .claude/hooks/

# Step 4: Update Claude.md with project-specific context
nano .claude/Claude.md

# Step 5: Validate the structure
claude project validate legacy-app
```

### Migration Checklist

Use this checklist when migrating each project:

- [ ] **Backup**: Copy existing `.claude/` directory if it exists
- [ ] **Choose strategy**: Register, init, or custom migration
- [ ] **Verify structure**: Run `claude project validate <name>`
- [ ] **Test switching**: `claude project switch <name>`
- [ ] **Update context**: Edit `.claude/Claude.md` with project details
- [ ] **Test workflows**: Verify skills, hooks, and commands work
- [ ] **Clean up**: Remove old configuration files if no longer needed

### Example: Complete Migration Workflow

```bash
# 1. List your existing projects
ls ~/Projects/

# Output:
# client-a-website/
# client-b-api/
# personal-blog/

# 2. Migrate each one

# Project 1: Has .claude/ already
cd ~/Projects/client-a-website
claude project register --name client-a-website

# Project 2: No .claude/ yet
cd ~/Projects/client-b-api
claude project init --template base --name client-b-api

# Project 3: Complex setup
cd ~/Projects/personal-blog
[ -d .claude ] && cp -r .claude .claude.backup
claude project init --template web-app --name personal-blog
# ... merge custom config from backup ...

# 3. Verify all projects
claude project list

# Output:
# 📋 Registered Projects:
#
# ✅ client-a-website     /Users/you/Projects/client-a-website
# ✅ client-b-api         /Users/you/Projects/client-b-api
# ✅ personal-blog        /Users/you/Projects/personal-blog (active)

# 4. Test switching
claude project switch client-a-website
claude project switch client-b-api
claude project switch personal-blog
```

### Migrating Multiple Projects (Batch)

For many projects, use a script:

```bash
# Create a migration script
cat > migrate-projects.sh << 'EOF'
#!/bin/bash

PROJECTS_DIR="$HOME/Projects"

for project in "$PROJECTS_DIR"/*/; do
  project_name=$(basename "$project")
  echo "Migrating: $project_name"

  cd "$project"

  # Check if .claude/ exists
  if [ -d ".claude" ]; then
    echo "  └─ Registering existing structure"
    claude project register --name "$project_name"
  else
    echo "  └─ Initializing new structure"
    claude project init --template base --name "$project_name"
  fi

  echo "  ✅ Done"
  echo ""
done

echo "🎉 All projects migrated!"
claude project list
EOF

# Make it executable
chmod +x migrate-projects.sh

# Run it
./migrate-projects.sh
```

---

## Understanding Project Structure

Each orchestrated project follows the diet103 architecture.

### Core Files

#### `.claude/Claude.md`
Project-specific context and instructions. This is loaded when the project is active.

```markdown
# My Project

## Project Overview
This is a web application for...

## Development Guidelines
- Use TypeScript for all new code
- Follow React best practices
- Test coverage required: 80%+

## Key Commands
- `npm run dev` - Start dev server
- `npm test` - Run tests
```

#### `.claude/metadata.json`
Project metadata and configuration.

```json
{
  "name": "my-first-project",
  "version": "1.0.0",
  "description": "My first orchestrated project",
  "created": "2025-11-07T10:00:00Z",
  "diet103_version": "1.2.0",
  "tags": ["web", "typescript", "react"]
}
```

#### `.claude/skill-rules.json`
Defines when skills should auto-activate.

```json
{
  "rules": [
    {
      "skill": "web-asset-generator",
      "triggers": ["favicon", "icon", "logo"],
      "auto_activate": true
    }
  ]
}
```

### Directory Structure

```
.claude/
├── Claude.md              # Project context (required)
├── metadata.json          # Project info (required)
├── skill-rules.json       # Auto-activation rules (optional)
├── hooks/                 # Custom hooks (optional)
│   ├── UserPromptSubmit.js
│   └── PostToolUse.js
├── skills/                # Project-specific skills (optional)
│   └── my-custom-skill/
│       ├── skill.js
│       └── README.md
├── agents/                # Custom agents (optional)
│   └── my-agent.js
├── commands/              # Slash commands (optional)
│   └── deploy.md
└── resources/             # Additional resources (optional)
    └── docs/
```

---

## Working with Templates

Templates provide starting points for common project types.

### Available Templates

#### Base Template
Minimal diet103 structure for any project.

```bash
claude project create my-project --template base
```

**Use for:**
- Backend APIs
- CLI tools
- Libraries
- General-purpose projects

#### Web App Template
Pre-configured for web development.

```bash
claude project create my-webapp --template web-app
```

**Includes:**
- Web asset generation skills
- Favicon/icon workflows
- Frontend development patterns
- Responsive design context

**Use for:**
- React/Vue/Angular apps
- Static websites
- Progressive web apps

#### Shopify Template
E-commerce development setup.

```bash
claude project create my-store --template shopify
```

**Includes:**
- Shopify API integration
- Theme development patterns
- E-commerce workflows
- Payment processing context

**Use for:**
- Shopify stores
- E-commerce sites
- Online marketplaces

### Creating Custom Templates

```bash
# 1. Create template directory
mkdir -p ~/.claude/templates/my-template/.claude

# 2. Copy base structure
cp -r ~/.claude/templates/base/.claude/* ~/.claude/templates/my-template/.claude/

# 3. Customize files
nano ~/.claude/templates/my-template/.claude/Claude.md

# 4. Use your template
claude project create new-project --template my-template
```

---

## Daily Workflow

### Morning: Starting Work

```bash
# List your projects
claude project list

# Switch to today's project
claude project switch client-a-website

# Navigate to the project
cd ~/Projects/client-a-website

# Start working with Claude
# Your context is automatically loaded!
```

### During the Day: Switching Context

```bash
# Quick status check
claude project list

# Switch to another project
claude project switch client-b-api

# Context automatically switches:
# - Previous project unloaded
# - New project loaded
# - Skills/hooks updated
```

### End of Day: Review

```bash
# Check which project is active
claude project list

# Validate project health
claude project validate client-a-website

# View project stats (if implemented)
claude project info client-a-website
```

---

## Advanced Usage

### Project Descriptions and Tags

```bash
# Create with description
claude project create my-project \
  --template base \
  --description "Client website for Acme Corp"

# Add tags (edit metadata.json)
cd ~/Projects/my-project
nano .claude/metadata.json
# Add: "tags": ["client", "urgent", "web"]
```

### Project Validation

```bash
# Validate current project
claude project validate

# Validate specific project
claude project validate my-project

# Output:
# ✅ Valid project structure
# ✅ Claude.md exists
# ✅ metadata.json exists
# ✅ Hooks directory exists
# ⚠️  No skills found (optional)
```

### Removing Projects

```bash
# Remove from orchestrator (keeps files)
claude project remove my-old-project

# With force flag (no confirmation)
claude project remove my-old-project --force
```

**Important:** This only unregisters the project. Files are **not deleted**.

### Working with Git

Projects work seamlessly with Git:

```bash
# Create project
claude project create my-app --template base

# Initialize git
cd ~/Projects/my-app
git init
git add .
git commit -m "Initial commit with orchestrator setup"

# The .claude/ directory is part of your repo
git push origin main
```

### Team Collaboration

Share orchestrated projects with your team:

```bash
# Team member clones the repo
git clone <repo-url>
cd my-app

# Register with orchestrator
claude project register --name my-app

# Start working immediately
claude project switch my-app
```

---

## Tips and Best Practices

### 1. One Project Per Repository
Keep projects aligned with Git repositories for clarity.

```bash
# Good
~/Projects/
├── acme-website/        # One repo, one project
│   └── .claude/
├── acme-api/            # One repo, one project
│   └── .claude/
└── acme-mobile/         # One repo, one project
    └── .claude/
```

### 2. Use Descriptive Names
Choose clear, memorable project names.

```bash
# Good
claude project create client-acme-website
claude project create internal-api-v2

# Avoid
claude project create proj1
claude project create temp
```

### 3. Keep Claude.md Updated
Document your project context as it evolves.

```markdown
# Regular updates to .claude/Claude.md

## Recent Changes
- 2025-11-07: Added authentication system
- 2025-11-06: Migrated to TypeScript
- 2025-11-05: Project kickoff
```

### 4. Validate After Changes
Check project health after major modifications.

```bash
# After adding skills or hooks
claude project validate my-project
```

### 5. Use Tags for Organization
Tag projects for easy mental grouping.

```json
// In .claude/metadata.json
{
  "tags": ["client", "active", "production"]
}
```

### 6. Switch Before Committing
Ensure correct context before git operations.

```bash
# Always switch first
claude project switch my-project

# Then commit
git add .
git commit -m "Feature: Add user authentication"
```

### 7. Backup Before Migration
Always backup when migrating existing projects.

```bash
# Before migration
cp -r .claude .claude.backup
```

### 8. Clean Up Inactive Projects
Periodically remove projects you no longer need.

```bash
# Review your projects
claude project list

# Remove old ones
claude project remove archived-project
```

---

## Next Steps

Now that you're set up with Project Orchestrator:

1. **Create multiple projects** to experience context switching
2. **Migrate your existing projects** using the migration guide above
3. **Explore templates** to find your preferred starting point
4. **Customize Claude.md** with project-specific context
5. **Add custom skills** for repeated workflows
6. **Read the [CLI Reference](CLI_REFERENCE.md)** for all commands
7. **Check [Troubleshooting](TROUBLESHOOTING.md)** if you encounter issues

---

## Quick Reference Card

```bash
# Essential Commands
claude project create <name>              # Create new project
claude project switch <name>              # Switch active project
claude project list                       # List all projects
claude project validate <name>            # Validate project
claude project remove <name>              # Unregister project

# Migration Commands
claude project register                   # Register existing project
claude project init                       # Initialize .claude/ directory

# Info Commands
claude --version                          # Check version
claude --help                             # View help
claude project --help                     # View project commands
```

---

**Related Documentation:**
- [README](README.md) - Overview and quick start
- [CLI Reference](CLI_REFERENCE.md) - Complete command reference
- [Architecture](ARCHITECTURE.md) - System design
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues
- [FAQ](FAQ.md) - Frequently asked questions

**Last Updated:** 2025-11-07
