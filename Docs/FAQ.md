# Frequently Asked Questions (FAQ)

Common questions about Project Orchestrator.

## Table of Contents

1. [General Questions](#general-questions)
2. [Installation & Setup](#installation--setup)
3. [Project Management](#project-management)
4. [Context Switching](#context-switching)
5. [diet103 Integration](#diet103-integration)
6. [Performance & Limits](#performance--limits)
7. [Templates & Customization](#templates--customization)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Usage](#advanced-usage)

---

## General Questions

### What is Project Orchestrator?

Project Orchestrator is a CLI tool for managing multiple Claude development projects with isolated contexts. It solves the token efficiency problem by ensuring only one project's context is loaded at a time.

**Key benefits:**
- Token efficiency (only active project loaded)
- Fast context switching (<1 second)
- Clean separation between projects
- diet103 compatible structure

---

### Why do I need Project Orchestrator?

**Problem:** Without orchestration, all your project contexts load simultaneously, wasting tokens and causing confusion.

**Solution:** Project Orchestrator loads only the active project's context, saving tokens and providing clean separation.

**Example scenario:**
```
Without Orchestrator:
- client-a-website context: 2,000 tokens
- client-b-api context: 1,500 tokens
- personal-blog context: 1,800 tokens
Total: 5,300 tokens (all loaded always)

With Orchestrator:
- Only active project loaded: ~2,000 tokens
- Savings: 3,300 tokens (62%)
```

---

### How is this different from git worktrees?

**Git worktrees** manage code versions within the same repository.

**Project Orchestrator** manages completely different projects with isolated Claude contexts.

**Comparison:**

| Feature | Git Worktrees | Project Orchestrator |
|---------|---------------|---------------------|
| Purpose | Multiple branches | Multiple projects |
| Scope | Same repository | Different repositories |
| Context | Shared | Isolated |
| Use case | Feature development | Multi-client work |

**You can use both together:**
```bash
# Use worktrees for feature branches
git worktree add ../feature-auth feature/auth

# Use orchestrator for different projects
claude project switch client-a
```

---

### Is Project Orchestrator free?

Yes, Project Orchestrator is open source. The actual implementation lives at `~/.claude/` and this repository contains documentation and specifications.

---

## Installation & Setup

### What are the prerequisites?

- **Node.js** v14 or higher
- **npm** or **yarn**
- **Git** (for version control)
- Basic command line familiarity

Check versions:
```bash
node --version  # Should be v14+
npm --version
git --version
```

---

### Where is the CLI installed?

The CLI is installed at `~/.claude/`:

```
~/.claude/
├── bin/claude          # Main executable
├── lib/                # Core systems
├── templates/          # Project templates
├── config.json         # Global configuration
└── package.json        # Dependencies
```

Your projects are separate, typically in `~/Projects/`.

---

### Can I install it somewhere else?

Yes, use the `CLAUDE_HOME` environment variable:

```bash
export CLAUDE_HOME="$HOME/custom/path"
```

However, `~/.claude/` is recommended for consistency.

---

### How do I uninstall?

Complete removal:

```bash
# 1. Backup if needed
cp ~/.claude/config.json ~/backup-config.json

# 2. Remove CLI
rm -rf ~/.claude

# 3. Remove from PATH
# Edit ~/.bashrc or ~/.zshrc and remove claude lines
source ~/.bashrc  # or ~/.zshrc
```

Note: Your project files remain untouched.

---

## Project Management

### How many projects can I have?

There's no hard limit, but practical considerations:

- **1-10 projects:** Optimal performance
- **10-25 projects:** Good performance
- **25-50 projects:** Acceptable
- **50+ projects:** Consider archiving old projects

List regularly:
```bash
claude project list
```

---

### Can I have multiple projects in the same directory?

No. Each project should have its own directory with a `.claude/` subdirectory.

**Bad:**
```
~/Projects/
└── shared/
    ├── .claude/          # ❌ Shared context
    ├── project-a/
    └── project-b/
```

**Good:**
```
~/Projects/
├── project-a/
│   └── .claude/          # ✓ Isolated
└── project-b/
    └── .claude/          # ✓ Isolated
```

---

### What happens to my files when I remove a project?

**Files are NOT deleted.** The `remove` command only unregisters the project from the orchestrator.

```bash
claude project remove my-project
# Project removed from registry
# Files at ~/Projects/my-project/ STILL EXIST
```

To also delete files (dangerous!):
```bash
claude project remove my-project --delete-files
# ⚠️ This deletes everything!
```

---

### Can I rename a project?

Not directly, but you can:

**Option 1: Create new, remove old**
```bash
# Create new with correct name
claude project create my-project-new --template base

# Copy content from old
cp -r ~/Projects/my-project-old/* ~/Projects/my-project-new/

# Remove old registration
claude project remove my-project-old
```

**Option 2: Manual edit**
```bash
# Edit ~/.claude/config.json
# Change project name in "projects" object
# Update .claude/metadata.json in project directory
```

---

## Context Switching

### How fast is context switching?

**Target:** <1 second

**Typical performance:**
- Small projects (<100 files): 200-500ms
- Medium projects (100-1000 files): 500-800ms
- Large projects (1000+ files): 800ms-1.5s

**Factors affecting speed:**
- Size of `.claude/Claude.md`
- Number of skills
- Disk I/O speed
- Cache status

---

### What exactly switches when I change projects?

**Unloaded from memory:**
- Previous project's `Claude.md` context
- Skill definitions
- Hook registrations
- Command definitions

**Loaded into memory:**
- New project's `Claude.md` context
- Skill definitions from `.claude/skills/`
- Hooks from `.claude/hooks/`
- Commands from `.claude/commands/`

**Unchanged:**
- Global orchestration context (~500 tokens)
- Your conversation history
- Claude Code settings

---

### Can I have multiple projects active simultaneously?

No. The **Single Active Context Rule** ensures only one project is active at a time.

**Workaround:** Use multiple terminal sessions:
```bash
# Terminal 1
cd ~/Projects/project-a
claude project switch project-a

# Terminal 2
cd ~/Projects/project-b
claude project switch project-b
```

Each terminal can have a different active project.

---

### How do I know which project is active?

Several ways:

**1. List projects:**
```bash
claude project list
# Shows (active) next to current project
```

**2. Check config:**
```bash
cat ~/.claude/config.json | jq '.active_project'
```

**3. Project info:**
```bash
claude project list --active-only
```

---

## diet103 Integration

### What is diet103?

**diet103** (also called PAI - Progressive AI Interaction) is an architecture pattern for organizing Claude projects:

- **Skills as Containers:** Modular, self-contained skills
- **Main file <500 lines:** Overview + navigation
- **Resource files:** Detailed topics
- **Progressive disclosure:** Start simple, add detail as needed

Learn more: https://github.com/diet103/

---

### Do I need to follow diet103?

**Minimum requirements:**
- `.claude/Claude.md` (project context)
- `.claude/metadata.json` (project info)

**Recommended but optional:**
- `skill-rules.json` (skill activation)
- `hooks/` (automation)
- `skills/` (modular capabilities)

You can start minimal and add more structure later.

---

### Can I use my existing Claude project?

Yes! Two options:

**Option 1: Register existing structure**
```bash
cd ~/Projects/existing-project
claude project register
```

**Option 2: Initialize new structure**
```bash
cd ~/Projects/existing-project
claude project init --template base
```

Your existing files are not modified.

---

### What's the difference between hooks, skills, and commands?

| Component | Purpose | Example |
|-----------|---------|---------|
| **Hooks** | Automated triggers | Validate markdown on save |
| **Skills** | Capabilities | Documentation validator |
| **Commands** | Manual actions | `/validate-docs` |

**Hooks:** Run automatically (e.g., before every prompt)
**Skills:** Activated by keywords or file patterns
**Commands:** Invoked explicitly by you

---

## Performance & Limits

### How much does the orchestrator cost in tokens?

**Global orchestration layer:** ~500 tokens (always loaded)

**Per project:** Variable, depends on your `.claude/Claude.md` size

**Example breakdown:**
```
Global layer:              500 tokens
Active project (medium):  2,000 tokens
Skills (3 loaded):         600 tokens
─────────────────────────────────────
Total:                    3,100 tokens

vs. without orchestrator:
All projects loaded:      8,500+ tokens
Savings:                  5,400 tokens (63%)
```

---

### Can I use this with large projects?

Yes, but be mindful of `.claude/Claude.md` size:

**Recommendations:**
- Keep `Claude.md` <5,000 lines
- Use skills for detailed topics
- Leverage resource files
- Progressive disclosure pattern

**If too large:**
- Split into multiple projects
- Move content to skills
- Use external documentation links

---

### Does switching affect my conversation history?

No. Your conversation history with Claude persists across project switches.

**What persists:**
- Your messages
- Claude's responses
- Conversation context

**What changes:**
- Project-specific context (Claude.md)
- Available skills
- Active hooks

---

### How many skills can I have per project?

**Practical limits:**
- **1-5 skills:** Optimal
- **5-10 skills:** Good
- **10-20 skills:** Acceptable
- **20+ skills:** Consider consolidation

More skills = slower loading. Use only what you need.

---

## Templates & Customization

### What templates are available?

**Built-in templates:**

1. **base** - Minimal diet103 structure
   - For: APIs, CLIs, libraries, general projects
   - Includes: Basic hooks, minimal setup

2. **web-app** - Web development
   - For: React, Vue, Angular, static sites
   - Includes: Web asset skills, frontend patterns

3. **shopify** - E-commerce
   - For: Shopify stores, e-commerce
   - Includes: Shopify API, theme development

**Usage:**
```bash
claude project create my-project --template web-app
```

---

### Can I create custom templates?

Yes!

**Steps:**
```bash
# 1. Create template directory
mkdir -p ~/.claude/templates/my-template/.claude

# 2. Add structure
cd ~/.claude/templates/my-template
# Create Claude.md, metadata.json, etc.

# 3. Use your template
claude project create new-project --template my-template
```

**Template structure:**
```
my-template/
└── .claude/
    ├── Claude.md
    ├── metadata.json
    ├── skill-rules.json
    ├── hooks/
    └── skills/
```

---

### Can I modify a project after creation?

Absolutely! Projects are fully editable:

```bash
# Edit project context
nano ~/Projects/my-project/.claude/Claude.md

# Add skills
mkdir ~/Projects/my-project/.claude/skills/my-skill

# Add hooks
cp my-hook.sh ~/Projects/my-project/.claude/hooks/
chmod +x ~/Projects/my-project/.claude/hooks/my-hook.sh

# Update metadata
nano ~/Projects/my-project/.claude/metadata.json
```

Changes take effect immediately (no need to re-register).

---

### Can I share projects with my team?

Yes! Projects are version control friendly:

**Share via Git:**
```bash
# In your project
git add .claude/
git commit -m "Add orchestrator structure"
git push

# Team member clones
git clone <repo>
cd project
claude project register
```

The `.claude/` directory is checked into version control.

---

## Troubleshooting

### Why isn't my project showing up?

**Check registration:**
```bash
claude project list
# Should show your project
```

**If missing, register:**
```bash
cd ~/Projects/my-project
claude project register
```

**Verify structure:**
```bash
claude project validate my-project
```

---

### Why are my hooks not running?

**Common causes:**

1. **Not executable:**
   ```bash
   chmod +x .claude/hooks/*.sh
   ```

2. **Syntax errors:**
   ```bash
   bash -n .claude/hooks/UserPromptSubmit.sh
   ```

3. **Wrong location:**
   ```bash
   # Should be: .claude/hooks/
   # Not: .claude/hook/ or hooks/
   ```

---

### Can I disable hooks temporarily?

Yes, two methods:

**Method 1: Rename hooks**
```bash
mv .claude/hooks/UserPromptSubmit.sh .claude/hooks/UserPromptSubmit.sh.disabled
```

**Method 2: Make non-executable**
```bash
chmod -x .claude/hooks/*.sh
```

Re-enable:
```bash
chmod +x .claude/hooks/*.sh
```

---

### Where can I get more help?

1. **Documentation:**
   - [README](README.md)
   - [Getting Started](GETTING_STARTED.md)
   - [CLI Reference](CLI_REFERENCE.md)
   - [Architecture](ARCHITECTURE.md)
   - [Troubleshooting](TROUBLESHOOTING.md)

2. **Community:**
   - GitHub Issues
   - Discussions
   - Example projects

3. **Debug mode:**
   ```bash
   export CLAUDE_LOG_LEVEL=debug
   claude project create my-project
   ```

---

## Advanced Usage

### Can I automate project switching?

Yes, using scripts:

```bash
#!/bin/bash
# auto-switch.sh

PROJECT=$1

if [ -z "$PROJECT" ]; then
  echo "Usage: $0 <project-name>"
  exit 1
fi

claude project switch "$PROJECT"
if [ $? -eq 0 ]; then
  cd ~/Projects/"$PROJECT"
  echo "Switched to $PROJECT and changed directory"
else
  echo "Failed to switch to $PROJECT"
  exit 1
fi
```

---

### Can I use environment variables in Claude.md?

Not directly, but you can use hooks to inject them:

```bash
# .claude/hooks/UserPromptSubmit.sh
export PROJECT_ENV="production"
export API_KEY="..."
```

Or reference them in your context:
```markdown
# Claude.md
Environment: Check $PROJECT_ENV variable
API Key: Use $API_KEY for authentication
```

---

### Can I have project-specific git hooks?

Yes! Use both:

**Git hooks:** `.git/hooks/` (git operations)
**Claude hooks:** `.claude/hooks/` (Claude operations)

They serve different purposes and can coexist.

---

### Can I nest projects?

Not recommended, but possible:

```
parent-project/
├── .claude/              # Parent context
└── sub-project/
    └── .claude/          # Sub-project context
```

**Better approach:** Separate projects:
```
~/Projects/
├── parent-project/
│   └── .claude/
└── sub-project/
    └── .claude/
```

---

### How do I back up my configuration?

**Backup everything:**
```bash
# Backup global config
cp ~/.claude/config.json ~/backup/claude-config.json

# Backup project contexts
tar -czf ~/backup/claude-projects.tar.gz ~/Projects/*/.claude/
```

**Restore:**
```bash
cp ~/backup/claude-config.json ~/.claude/config.json
tar -xzf ~/backup/claude-projects.tar.gz -C ~/
```

---

### Can I use this with CI/CD?

Yes! Example workflow:

```yaml
# .github/workflows/validate.yml
name: Validate Project

on: [push]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install Claude CLI
        run: |
          cd ~/.claude
          npm install

      - name: Validate project
        run: |
          cd $GITHUB_WORKSPACE
          claude project validate
```

---

## Still Have Questions?

- Check [Troubleshooting](TROUBLESHOOTING.md) for common issues
- Review [CLI Reference](CLI_REFERENCE.md) for command details
- Read [Architecture](ARCHITECTURE.md) for system design
- See [Getting Started](GETTING_STARTED.md) for tutorials

**Create an issue** if you can't find an answer!

---

**Last Updated:** 2025-11-07
**Version:** 1.0.0
