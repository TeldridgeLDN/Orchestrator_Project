# Troubleshooting Guide

Common issues and solutions for Project Orchestrator.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Command Not Found](#command-not-found)
3. [CLI Name Conflict](#cli-name-conflict)
4. [Project Creation Problems](#project-creation-problems)
5. [Switching Issues](#switching-issues)
6. [Validation Errors](#validation-errors)
7. [Hook Problems](#hook-problems)
8. [Performance Issues](#performance-issues)
9. [Configuration Problems](#configuration-problems)
10. [Permission Errors](#permission-errors)
11. [Context Layer Confusion](#context-layer-confusion)
12. [Getting Help](#getting-help)

---

## Installation Issues

### Problem: npm install fails

**Symptoms:**
```
npm ERR! code EACCES
npm ERR! syscall access
npm ERR! path /usr/local/lib/node_modules
```

**Solutions:**

1. **Use correct directory:**
   ```bash
   # Should be in ~/.claude, not /usr/local
   cd ~/.claude
   npm install
   ```

2. **Fix permissions:**
   ```bash
   sudo chown -R $USER ~/.claude
   npm install
   ```

3. **Use local install:**
   ```bash
   cd ~/.claude
   npm install --no-optional
   ```

---

### Problem: Node.js version too old

**Symptoms:**
```
error Requires Node.js v14 or higher
```

**Solution:**

Update Node.js:
```bash
# Check current version
node --version

# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install latest LTS
nvm install --lts
nvm use --lts

# Verify
node --version  # Should be v14+
```

---

## Command Not Found

### Problem: `claude: command not found`

**Symptoms:**
```bash
$ claude --version
bash: claude: command not found
```

**Solutions:**

1. **Check executable:**
   ```bash
   ls -la ~/.claude/bin/claude
   # Should show: -rwxr-xr-x
   ```

2. **Make executable:**
   ```bash
   chmod +x ~/.claude/bin/claude
   ```

3. **Add to PATH:**
   ```bash
   # For bash
   echo 'export PATH="$HOME/.claude/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc

   # For zsh
   echo 'export PATH="$HOME/.claude/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

4. **Use alias:**
   ```bash
   # For bash
   echo 'alias claude="$HOME/.claude/bin/claude"' >> ~/.bashrc
   source ~/.bashrc

   # For zsh
   echo 'alias claude="$HOME/.claude/bin/claude"' >> ~/.zshrc
   source ~/.zshrc
   ```

5. **Verify installation:**
   ```bash
   which claude
   # Should show: /Users/you/.claude/bin/claude

   claude --version
   # Should show version number
   ```

---

## CLI Name Conflict

### Problem: CLI conflict with Anthropic's official Claude CLI

**The Issue:**

Both Project Orchestrator and Anthropic's official Claude CLI use the command name `claude`. This can cause confusion when both are installed on the same system.

**Symptoms:**
```bash
$ claude --version
# Shows Anthropic CLI version instead of Project Orchestrator
# OR shows Project Orchestrator when you expected Anthropic CLI
```

**Detection:**

Determine which `claude` command is currently active:

```bash
# Check which claude is in your PATH
which claude

# Possible results:
# /usr/local/bin/claude          → Anthropic's official CLI
# ~/.claude/bin/claude            → Project Orchestrator
# /opt/homebrew/bin/claude        → Anthropic's CLI (Homebrew on macOS)
```

**Understanding the Conflict:**

- **Anthropic's Claude CLI**: Official tool for API interactions, chat sessions
- **Project Orchestrator**: Multi-project management and context switching

Both are valuable tools that serve different purposes. You can use both!

---

### Solution 1: Use Full Paths (Simplest)

**Recommended for:** Users who need both CLIs occasionally

**macOS / Linux:**
```bash
# Project Orchestrator
~/.claude/bin/claude project list

# Anthropic CLI
/usr/local/bin/claude chat
# OR (Homebrew on macOS)
/opt/homebrew/bin/claude chat
```

**Windows WSL:**
```bash
# Project Orchestrator
~/.claude/bin/claude project list

# Anthropic CLI
/mnt/c/Program\ Files/Claude/claude.exe chat
```

**Pros:**
- ✅ No configuration needed
- ✅ Always unambiguous
- ✅ Works immediately

**Cons:**
- ❌ Longer commands
- ❌ Need to remember full paths

---

### Solution 2: Create Shell Aliases (Recommended)

**Recommended for:** Users who use both CLIs frequently

**For Bash Users:**

Add to `~/.bashrc`:
```bash
# Project Orchestrator
alias po='~/.claude/bin/claude project'
alias orchestrator='~/.claude/bin/claude'

# Anthropic CLI
alias claude-api='claude'          # Keep original as-is
alias anthropic='claude'           # Alternative name
```

Then reload:
```bash
source ~/.bashrc
```

**For Zsh Users:**

Add to `~/.zshrc`:
```bash
# Project Orchestrator
alias po='~/.claude/bin/claude project'
alias orchestrator='~/.claude/bin/claude'

# Anthropic CLI
alias claude-api='claude'          # Keep original as-is
alias anthropic='claude'           # Alternative name
```

Then reload:
```bash
source ~/.zshrc
```

**For Fish Shell Users:**

Add to `~/.config/fish/config.fish`:
```fish
# Project Orchestrator
alias po='~/.claude/bin/claude project'
alias orchestrator='~/.claude/bin/claude'

# Anthropic CLI
alias claude-api='claude'
alias anthropic='claude'
```

Then reload:
```fish
source ~/.config/fish/config.fish
```

**Usage After Setup:**
```bash
# Project Orchestrator commands
po list                             # Lists projects
po switch my-project                # Switches project
orchestrator project create new-app # Full orchestrator command

# Anthropic CLI commands
claude-api chat                     # Anthropic chat
anthropic config                    # Anthropic config
```

**Pros:**
- ✅ Short, memorable commands
- ✅ Both CLIs easily accessible
- ✅ Clear separation of concerns

**Cons:**
- ❌ Requires initial setup
- ❌ Aliases don't persist across machines (need dotfile sync)

---

### Solution 3: Adjust PATH Priority (Advanced)

**Recommended for:** Users who primarily use one CLI over the other

**To Prioritize Project Orchestrator:**

```bash
# For bash - add to ~/.bashrc
export PATH="$HOME/.claude/bin:$PATH"

# For zsh - add to ~/.zshrc  
export PATH="$HOME/.claude/bin:$PATH"

# Reload
source ~/.bashrc  # or ~/.zshrc
```

**To Prioritize Anthropic CLI:**

```bash
# For bash - add to ~/.bashrc
export PATH="/usr/local/bin:$HOME/.claude/bin:$PATH"

# For zsh - add to ~/.zshrc
export PATH="/usr/local/bin:$HOME/.claude/bin:$PATH"

# Reload
source ~/.bashrc  # or ~/.zshrc
```

**Verify Priority:**
```bash
which claude
# First match in PATH is the one that will run

echo $PATH
# Shows directories in priority order (left = highest priority)
```

**Pros:**
- ✅ `claude` command works as expected for your primary use case
- ✅ No need for aliases

**Cons:**
- ❌ Less clear which CLI is active
- ❌ Can cause confusion if forgotten
- ❌ Secondary CLI requires full path

---

### Solution 4: Rename One CLI (Permanent)

**Recommended for:** Advanced users who want complete control

**Rename Project Orchestrator:**

```bash
# Move the orchestrator binary
mv ~/.claude/bin/claude ~/.claude/bin/orchestrator

# Update your PATH or create alias
alias po='orchestrator project'
```

**Rename Anthropic CLI:**

```bash
# macOS (Homebrew)
brew unlink claude
ln -s /opt/homebrew/bin/claude /usr/local/bin/claude-api

# Linux
sudo mv /usr/local/bin/claude /usr/local/bin/claude-api

# Update any scripts that reference 'claude'
```

**Pros:**
- ✅ Permanent, unambiguous solution
- ✅ No PATH priority issues

**Cons:**
- ❌ Requires modifying installed binaries
- ❌ May break on updates
- ❌ Not recommended for beginners

---

### Best Practices for CLI Management

#### 1. Document Your Choice

Add to your dotfiles or project README:
```markdown
## CLI Setup
- `claude` → Anthropic's official CLI
- `po` → Project Orchestrator
```

#### 2. Use Aliases Over PATH Priority

Aliases are explicit and self-documenting:
```bash
# ✅ Good: Clear intent
alias po='~/.claude/bin/claude project'
alias claude-api='claude'

# ❌ Avoid: Hidden PATH manipulation
export PATH="$HOME/.claude/bin:$PATH"  # Which claude?
```

#### 3. Test After Setup

Verify your configuration works:
```bash
# Test Project Orchestrator
po list
# OR
orchestrator project list

# Test Anthropic CLI  
claude-api chat
# OR
anthropic chat

# Verify no confusion
which claude
which po
which orchestrator
```

#### 4. Sync Across Machines

If using aliases, add to dotfiles repository:
```bash
# Example: dotfiles repo
~/dotfiles/
├── bashrc
├── zshrc
└── aliases/
    └── claude-tools.sh  # Shared alias definitions
```

---

### Quick Resolution Guide

**I primarily use Project Orchestrator:**
→ Use **Solution 2** (aliases): `alias po='~/.claude/bin/claude project'`

**I primarily use Anthropic CLI:**
→ Use **Solution 3** (PATH priority): Ensure Anthropic CLI path comes first

**I use both equally:**
→ Use **Solution 2** (aliases): Create distinct aliases for each

**I'm confused which is which:**
→ Use **Solution 1** (full paths): Most explicit, no ambiguity

---

### Verification Checklist

After implementing your solution:

```bash
# 1. Verify Project Orchestrator works
~/.claude/bin/claude --version
# OR (if using alias)
po list

# 2. Verify Anthropic CLI works
/usr/local/bin/claude --version
# OR (if using alias)
claude-api --version

# 3. Test your primary workflow
# Run the command you'll use most often
# Ensure it behaves as expected

# 4. Document your setup
# Add your aliases/PATH to dotfiles
# Note which CLI is which for future reference
```

---

## Project Creation Problems

### Problem: "Project already exists"

**Symptoms:**
```
Error: Project 'my-project' already exists
```

**Solutions:**

1. **Use different name:**
   ```bash
   claude project create my-project-v2
   ```

2. **Remove existing:**
   ```bash
   claude project remove my-project
   claude project create my-project
   ```

3. **Check registry:**
   ```bash
   claude project list
   ```

---

### Problem: "Template not found"

**Symptoms:**
```
Error: Template 'my-template' not found
```

**Solutions:**

1. **Use valid template:**
   ```bash
   # Valid templates: base, web-app, shopify
   claude project create my-project --template web-app
   ```

2. **List available templates:**
   ```bash
   ls ~/.claude/templates/
   ```

3. **Default to base:**
   ```bash
   claude project create my-project
   # Uses 'base' template by default
   ```

---

### Problem: Permission denied when creating project

**Symptoms:**
```
Error: EACCES: permission denied, mkdir '/Users/you/Projects/my-project'
```

**Solutions:**

1. **Check parent directory permissions:**
   ```bash
   ls -la ~/Projects/
   # Should be writable by you
   ```

2. **Create parent directory:**
   ```bash
   mkdir -p ~/Projects
   claude project create my-project
   ```

3. **Use custom path:**
   ```bash
   claude project create my-project --path ~/Documents/my-project
   ```

---

## Switching Issues

### Problem: "Project not found"

**Symptoms:**
```
Error: Project 'my-api' not found
```

**Solutions:**

1. **List all projects:**
   ```bash
   claude project list
   ```

2. **Register project:**
   ```bash
   cd ~/Projects/my-api
   claude project register
   ```

3. **Check project name:**
   ```bash
   # Names are case-sensitive
   claude project switch my-api  # correct
   claude project switch My-API  # wrong
   ```

---

### Problem: Context not loading after switch

**Symptoms:**
```
Switched to 'my-project' but context seems empty
```

**Solutions:**

1. **Validate project structure:**
   ```bash
   claude project validate my-project
   ```

2. **Check Claude.md exists:**
   ```bash
   ls ~/Projects/my-project/.claude/Claude.md
   ```

3. **Verify file is not empty:**
   ```bash
   cat ~/Projects/my-project/.claude/Claude.md
   ```

4. **Re-initialize if needed:**
   ```bash
   cd ~/Projects/my-project
   claude project init --template base
   ```

---

## Validation Errors

### Problem: "Invalid project structure"

**Symptoms:**
```
❌ .claude/ directory not found
❌ Claude.md missing
```

**Solutions:**

1. **Initialize structure:**
   ```bash
   cd ~/Projects/my-project
   claude project init
   ```

2. **Check required files:**
   ```bash
   # Minimum required:
   ls .claude/Claude.md
   ls .claude/metadata.json
   ```

3. **Copy from template:**
   ```bash
   cp -r ~/.claude/templates/base/.claude ~/Projects/my-project/
   ```

---

### Problem: "Invalid metadata.json"

**Symptoms:**
```
Error: Invalid JSON in metadata.json
```

**Solutions:**

1. **Validate JSON:**
   ```bash
   cd ~/Projects/my-project
   jq empty .claude/metadata.json
   ```

2. **Fix syntax errors:**
   ```bash
   # Common issues:
   # - Missing commas
   # - Trailing commas
   # - Unescaped quotes
   # - Missing brackets
   ```

3. **Use template:**
   ```bash
   cp ~/.claude/templates/base/.claude/metadata.json .claude/
   # Then edit as needed
   ```

---

## Hook Problems

### Problem: Hooks not executing

**Symptoms:**
```
Expected validation but hooks didn't run
```

**Solutions:**

1. **Check hook permissions:**
   ```bash
   ls -la .claude/hooks/
   # Should show -rwxr-xr-x for .sh files
   ```

2. **Make executable:**
   ```bash
   chmod +x .claude/hooks/*.sh
   ```

3. **Test hook manually:**
   ```bash
   ./.claude/hooks/UserPromptSubmit.sh
   # Should run without errors
   ```

4. **Check hook syntax:**
   ```bash
   bash -n .claude/hooks/UserPromptSubmit.sh
   # Should report no errors
   ```

---

### Problem: Hook reports errors

**Symptoms:**
```
.claude/hooks/UserPromptSubmit.sh: line 42: syntax error
```

**Solutions:**

1. **Check line mentioned:**
   ```bash
   sed -n '42p' .claude/hooks/UserPromptSubmit.sh
   ```

2. **Validate shell script:**
   ```bash
   bash -n .claude/hooks/UserPromptSubmit.sh
   ```

3. **Check dependencies:**
   ```bash
   # Hooks may require: grep, sed, awk, jq
   which grep sed awk jq
   ```

4. **Re-install hooks:**
   ```bash
   cp -r ~/.claude/templates/base/.claude/hooks .claude/
   chmod +x .claude/hooks/*.sh
   ```

---

## Performance Issues

### Problem: Slow project switching

**Symptoms:**
```
Switching takes 5+ seconds
```

**Solutions:**

1. **Check file sizes:**
   ```bash
   # Large Claude.md files slow loading
   wc -l .claude/Claude.md
   # Should be <5000 lines
   ```

2. **Enable caching:**
   ```bash
   # Edit ~/.claude/config.json
   {
     "settings": {
       "cache_last_active": true
     }
   }
   ```

3. **Reduce skills:**
   ```bash
   # Move unused skills out of .claude/skills/
   mv .claude/skills/unused ~/backup/
   ```

---

### Problem: Slow project listing

**Symptoms:**
```
`claude project list` takes several seconds
```

**Solutions:**

1. **Check number of projects:**
   ```bash
   # Too many projects (50+) slows listing
   claude project list | wc -l
   ```

2. **Remove unused projects:**
   ```bash
   claude project remove old-project-1
   claude project remove old-project-2
   ```

3. **Use JSON output:**
   ```bash
   # Faster for scripting
   claude project list --json
   ```

---

## Configuration Problems

### Problem: "Config file corrupted"

**Symptoms:**
```
Error: Unable to parse config.json
```

**Solutions:**

1. **Backup current config:**
   ```bash
   cp ~/.claude/config.json ~/.claude/config.json.backup
   ```

2. **Validate JSON:**
   ```bash
   jq empty ~/.claude/config.json
   ```

3. **Reset config:**
   ```bash
   cat > ~/.claude/config.json << 'EOF'
   {
     "version": "1.0.0",
     "active_project": null,
     "projects": {},
     "settings": {
       "auto_switch_on_directory_change": false,
       "cache_last_active": true,
       "validate_on_switch": true
     }
   }
   EOF
   ```

4. **Re-register projects:**
   ```bash
   cd ~/Projects/project-1
   claude project register

   cd ~/Projects/project-2
   claude project register
   ```

---

### Problem: "Active project mismatch"

**Symptoms:**
```
Config shows project-a active but context is project-b
```

**Solutions:**

1. **Force switch:**
   ```bash
   claude project switch project-a
   ```

2. **Reset active project:**
   ```bash
   # Edit ~/.claude/config.json
   # Set "active_project": null
   ```

3. **Clear cache:**
   ```bash
   rm -rf ~/.claude/cache/*
   claude project switch project-a
   ```

---

## Permission Errors

### Problem: EACCES errors

**Symptoms:**
```
Error: EACCES: permission denied
```

**Solutions:**

1. **Check ownership:**
   ```bash
   ls -la ~/.claude/
   # Should be owned by you, not root
   ```

2. **Fix ownership:**
   ```bash
   sudo chown -R $USER:$USER ~/.claude
   ```

3. **Check file permissions:**
   ```bash
   chmod -R u+rw ~/.claude
   chmod +x ~/.claude/bin/claude
   ```

---

### Problem: Cannot write to project directory

**Symptoms:**
```
Error: Cannot create .claude/ directory
```

**Solutions:**

1. **Check directory permissions:**
   ```bash
   ls -la ~/Projects/my-project/
   ```

2. **Fix permissions:**
   ```bash
   chmod u+w ~/Projects/my-project
   ```

3. **Use different location:**
   ```bash
   claude project create my-project --path ~/Documents/my-project
   ```

---

## Debug Mode

### Enable verbose logging

```bash
# Set log level
export CLAUDE_LOG_LEVEL=debug

# Run command
claude project create my-project

# Or inline
CLAUDE_LOG_LEVEL=debug claude project switch my-api
```

### Check logs

```bash
# View recent operations
tail -f ~/.claude/logs/orchestrator.log

# Search for errors
grep ERROR ~/.claude/logs/orchestrator.log
```

---

## Common Error Messages

### "Node.js version mismatch"
**Fix:** Update Node.js to v14 or higher

### "Command not found: claude"
**Fix:** Add `~/.claude/bin` to PATH or use alias

### "Template not found"
**Fix:** Use valid template: base, web-app, or shopify

### "Project already exists"
**Fix:** Use different name or remove existing project

### "Invalid JSON in config"
**Fix:** Validate and fix JSON syntax errors

### "Permission denied"
**Fix:** Check file ownership and permissions

### "Directory not empty"
**Fix:** Use `--force` flag or choose different directory

---

## Context Layer Confusion

Understanding the two-layer architecture prevents many common issues.

### Problem: Claude can't see my project-specific skills

**Symptoms:**
- Skills defined in `.claude/skills/` don't activate
- Custom commands aren't recognized
- Project context not loading

**Diagnosis:**
```bash
# Check if project is active
claude project current

# If shows "No active project" or wrong project:
claude project list                 # See all projects
claude project switch my-project    # Switch to correct one
```

**Solutions:**

1. **Verify project is active:**
   ```bash
   claude project current
   # Should show: my-project (active)
   ```

2. **Check project layer exists:**
   ```bash
   ls ~/Projects/my-project/.claude/
   # Should show: Claude.md, skill-rules.json, etc.
   ```

3. **Verify skill-rules.json:**
   ```bash
   cat ~/Projects/my-project/.claude/skill-rules.json
   # Check for proper trigger_phrases
   ```

---

### Problem: Changes to config aren't reflecting

**Symptoms:**
- Edited `~/.claude/config.json` but project still uses old settings
- Project metadata not updating

**Diagnosis:**
You're editing the wrong layer!

**Solutions:**

**Global Settings** (affect ALL projects):
```bash
# Edit:
~/.claude/config.json

# Contains:
- active_project
- projects registry
- global settings
```

**Project Settings** (affect ONE project):
```bash
# Edit:
~/Projects/my-project/.claude/metadata.json
~/Projects/my-project/.claude/skill-rules.json

# Contains:
- project-specific metadata
- skill activation rules
- project description
```

**Fix:**
```bash
# For project-specific changes:
cd ~/Projects/my-project
nano .claude/metadata.json          # Edit project config

# For global changes:
nano ~/.claude/config.json           # Edit global config
```

---

### Problem: Token count unexpectedly high

**Symptoms:**
- Token usage higher than expected (~3,000+ tokens)
- Multiple projects seem to be loaded

**Diagnosis:**
```bash
# Check active projects
claude project list

# Should show only ONE project as "(active)"
# If multiple show as active, that's the problem!
```

**Solutions:**

1. **Verify only one active:**
   ```bash
   claude project list
   # Only one should have "(active)" marker
   ```

2. **Force switch to clean state:**
   ```bash
   claude project switch my-project
   # This unloads all others and loads only my-project
   ```

3. **Check token breakdown:**
   ```
   Expected:
   - Global layer: ~500 tokens
   - Active project: ~1,300 tokens
   - Total: ~1,800 tokens
   
   If higher:
   - Multiple projects might be loaded
   - Check .claude/Claude.md size in active project
   - Large Claude.md = more tokens
   ```

---

### Problem: Can't find where to configure something

**Symptoms:**
- Unclear whether to edit global or project files
- Changes in wrong location have no effect

**Decision Tree:**

**Affects ALL projects?** → Global Layer (`~/.claude/`)
- CLI behavior
- Template definitions
- Project registry
- Global settings

**Affects ONE project?** → Project Layer (`~/Projects/my-project/.claude/`)
- Project context
- Skills and hooks
- Project metadata
- Custom commands

**Quick Reference:**
```bash
# Global configuration
~/.claude/config.json               # Orchestrator settings
~/.claude/templates/                # Project templates

# Project configuration  
.claude/Claude.md                   # Project context
.claude/metadata.json               # Project info
.claude/skill-rules.json            # Skill activation
.claude/skills/                     # Project skills
```

---

### Problem: Context verification commands failing

**Symptoms:**
```bash
$ claude project current
Error: No active project

$ ls ~/.claude/
ls: cannot access '~/.claude/': No such file or directory
```

**Diagnosis:**
Global layer not properly installed.

**Solutions:**

1. **Verify global layer exists:**
   ```bash
   ls -la ~/.claude/
   # Should show: bin/, lib/, templates/, config.json
   ```

2. **Reinstall if missing:**
   ```bash
   cd /path/to/Orchestrator_Project
   cd ~/.claude
   npm install
   chmod +x bin/claude
   ```

3. **Check PATH:**
   ```bash
   which claude
   # Should show: /Users/you/.claude/bin/claude
   
   # If not found, add to PATH:
   export PATH="$HOME/.claude/bin:$PATH"
   ```

---

### Quick Context Verification Checklist

Run these commands to verify your environment:

```bash
# 1. Global layer active
claude --version
# ✅ Should show: Project Orchestrator v1.0.0

# 2. Project layer exists
claude project list
# ✅ Should show your projects

# 3. Correct project active
claude project current
# ✅ Should show your current project

# 4. Project files present
ls .claude/
# ✅ Should show: Claude.md, metadata.json, etc.

# 5. Only one project active
claude project list | grep "(active)"
# ✅ Should show exactly ONE line
```

If all checks pass, your context layers are correctly configured!

---

## Getting Help

### Check version and system info

```bash
# Version
claude --version

# Help
claude --help
claude project --help

# System info
node --version
npm --version
which claude
```

### Validate installation

```bash
# Check CLI exists
ls -la ~/.claude/bin/claude

# Check config
cat ~/.claude/config.json | jq .

# Check templates
ls ~/.claude/templates/

# Test basic command
claude project list
```

### Collect diagnostic info

```bash
# Create diagnostic report
cat > ~/claude-diagnostics.txt << EOF
Node Version: $(node --version)
NPM Version: $(npm --version)
Claude Version: $(claude --version 2>&1 || echo "Not found")
Claude Path: $(which claude || echo "Not in PATH")
Config: $(cat ~/.claude/config.json 2>&1 || echo "Not found")
Projects: $(claude project list 2>&1 || echo "Failed")
EOF

cat ~/claude-diagnostics.txt
```

### Get support

1. **Review documentation:**
   - [README](README.md)
   - [Getting Started](GETTING_STARTED.md)
   - [CLI Reference](CLI_REFERENCE.md)
   - [FAQ](FAQ.md)

2. **Check GitHub issues:**
   - Search existing issues
   - Review closed issues
   - Check discussions

3. **Create new issue:**
   - Include diagnostic info
   - Describe problem clearly
   - Show exact error messages
   - Include steps to reproduce

---

## Reset and Recovery

### Complete reset (nuclear option)

```bash
# WARNING: This removes ALL orchestrator data!

# 1. Backup important data
cp -r ~/.claude/config.json ~/claude-config-backup.json
cp -r ~/Projects/my-project/.claude ~/my-project-claude-backup

# 2. Remove CLI
rm -rf ~/.claude

# 3. Remove from PATH/alias
# Edit ~/.bashrc or ~/.zshrc and remove claude lines

# 4. Reinstall fresh
cd ~/Orchestrator_Project
cd ~/.claude
npm install
chmod +x bin/claude
export PATH="$HOME/.claude/bin:$PATH"

# 5. Re-register projects
cd ~/Projects/my-project
claude project register
```

### Recover from backup

```bash
# Restore config
cp ~/claude-config-backup.json ~/.claude/config.json

# Restore project
cp -r ~/my-project-claude-backup ~/Projects/my-project/.claude
```

---

## Related Documentation

- [README](README.md) - Project overview
- [Getting Started](GETTING_STARTED.md) - Setup guide
- [CLI Reference](CLI_REFERENCE.md) - Command details
- [Architecture](ARCHITECTURE.md) - System design
- [FAQ](FAQ.md) - Common questions

---

**Last Updated:** 2025-11-07
**Version:** 1.0.0

If you're still experiencing issues after trying these solutions, please create an issue on GitHub with:
- Your diagnostic info
- Exact error messages
- Steps to reproduce
- Expected vs actual behavior
