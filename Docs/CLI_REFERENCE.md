# CLI Reference

Complete command reference for the Project Orchestrator CLI tool.

## Table of Contents

1. [Installation](#installation)
2. [Global Commands](#global-commands)
3. [Project Commands](#project-commands)
4. [Rule Management Commands](#rule-management-commands)
5. [Command Options](#command-options)
6. [Exit Codes](#exit-codes)
7. [Environment Variables](#environment-variables)
8. [Configuration Files](#configuration-files)

---

## Installation

### Prerequisites
- Node.js v14 or higher
- npm or yarn
- Git

### Setup
```bash
# Navigate to CLI directory
cd ~/.claude

# Install dependencies
npm install

# Make executable
chmod +x bin/claude

# Add to PATH
export PATH="$HOME/.claude/bin:$PATH"

# Or create alias
alias claude="~/.claude/bin/claude"
```

### Verify Installation
```bash
claude --version
claude --help
```

---

## Global Commands

### `claude --version`
Display the Project Orchestrator version.

**Usage:**
```bash
claude --version
```

**Output:**
```
Project Orchestrator v1.0.0
```

### `claude --help`
Display help information for all commands.

**Usage:**
```bash
claude --help
claude project --help
```

**Output:**
```
Usage: claude [command] [options]

Commands:
  init                     Initialize Claude orchestrator
  project create <name>    Create a new project
  project switch <name>    Switch to a project
  project list            List all projects
  project remove <name>   Remove a project
  project validate <name> Validate project structure

Options:
  -h, --help     Display help
  -v, --version  Display version
```

---

### `diet103 init`
Initialize a new Claude project in the specified directory.

**Syntax:**
```bash
diet103 init [path] [options]
```

**Arguments:**
- `path` - Directory to initialize (defaults to current directory)

**Options:**
- `-n, --name <name>` - Project name
- `-d, --description <desc>` - Project description
- `--taskmaster` - Include TaskMaster initialization
- `--no-interactive` - Skip interactive prompts
- `-f, --force` - Force initialization even if project exists
- `-v, --verbose` - Show detailed output

**Examples:**
```bash
# Initialize current directory interactively
diet103 init

# Initialize specific directory with name
diet103 init ./my-project --name my-project

# Non-interactive initialization with TaskMaster
diet103 init --name my-app --description "My application" --taskmaster --no-interactive

# Force reinitialization
diet103 init --force
```

**What it does:**
1. Creates `.claude/` directory structure
2. Creates `CLAUDE.md` context file
3. Initializes `.claude/metadata.json`
4. Sets up `.claude/settings.json` for Claude Code
5. Creates `.claude/skill-rules.json`
6. Optionally initializes TaskMaster

**Exit codes:**
- `0` - Success
- `1` - Initialization failed
- `1` - Project already exists (use --force)

---

## Project Commands

### `diet103 project current`
Show information about the currently active project.

**Syntax:**
```bash
diet103 project current [options]
```

**Options:**
- `-v, --verbose` - Show detailed project information
- `--json` - Output as JSON

**Examples:**
```bash
# Show current project
diet103 project current

# Show with detailed information
diet103 project current --verbose

# Output as JSON for scripting
diet103 project current --json
```

**Displays:**
- Project name and path
- Description and version
- Creation and last active dates
- Health score
- Number of scenarios and skills
- TaskMaster status and statistics

**Exit codes:**
- `0` - Success
- `1` - No active project

---

### `diet103 project register`
Register a project with diet103 infrastructure validation.

**Syntax:**
```bash
diet103 project register [path] [options]
```

**Arguments:**
- `path` - Project path (defaults to current directory)

**Options:**
- `-n, --name <name>` - Project name
- `-d, --display-name <name>` - Display name for the project
- `-m, --metadata <json>` - Custom metadata as JSON string
- `--no-auto-repair` - Disable automatic repair
- `-t, --threshold <score>` - Minimum validation score required (0-100), default: 70
- `-v, --verbose` - Show detailed output

**Examples:**
```bash
# Register current directory
diet103 project register

# Register with custom name
diet103 project register --name my-project

# Register with display name and metadata
diet103 project register --name api-server --display-name "API Server" --metadata '{"team":"backend","version":"2.0"}'

# Register with lower threshold
diet103 project register --threshold 60

# Register without auto-repair
diet103 project register --no-auto-repair
```

**What it does:**
1. Validates diet103 infrastructure
2. Auto-repairs missing components (if enabled)
3. Validates MCP configuration
4. Adds project to registry
5. Stores validation score and metadata

**Exit codes:**
- `0` - Success
- `1` - Validation score below threshold
- `1` - Infrastructure validation failed

---

### `diet103 project register-batch`
Batch register all Claude projects in a directory.

**Syntax:**
```bash
diet103 project register-batch <directory> [options]
```

**Arguments:**
- `directory` - Directory to scan for projects

**Options:**
- `--no-auto-repair` - Disable automatic repair
- `-t, --threshold <score>` - Minimum validation score required (0-100), default: 70
- `-v, --verbose` - Show detailed output

**Examples:**
```bash
# Register all projects in a directory
diet103 project register-batch ~/Projects

# Batch register with custom threshold
diet103 project register-batch ~/MyApps --threshold 60
```

**What it does:**
1. Scans directory for subdirectories with `.claude` folders
2. Registers each project found
3. Displays summary of successful and failed registrations

**Exit codes:**
- `0` - Success (even if some registrations failed)
- `1` - Scan failed

---

### `diet103 project list`
List all registered projects.

**Syntax:**
```bash
diet103 project list [options]
```

**Options:**
- `--json` - Output as JSON

**Examples:**
```bash
# List all registered projects
diet103 project list

# List as JSON
diet103 project list --json
```

**Displays:**
- Project name and path
- Validation score
- diet103 version
- Last validated date

**Exit codes:**
- `0` - Success

---

### `diet103 project unregister`
Unregister a project from the registry.

**Syntax:**
```bash
diet103 project unregister <path> [options]
```

**Arguments:**
- `path` - Project path to unregister

**Options:**
- `-v, --verbose` - Show detailed output

**Examples:**
```bash
# Unregister a project
diet103 project unregister ~/Projects/my-project
```

**Note:** This only removes the project from the registry. It does NOT delete project files.

**Exit codes:**
- `0` - Success
- `1` - Project not found in registry

---

### `claude project create <name>`
Create a new project from a template.

**Syntax:**
```bash
claude project create <name> [options]
```

**Options:**
- `--template <type>` - Template to use (base, web-app, shopify)
- `--description <text>` - Project description
- `--path <directory>` - Custom project path

**Examples:**
```bash
# Create with base template
claude project create my-project

# Create with specific template
claude project create my-webapp --template web-app

# Create with description
claude project create my-store --template shopify --description "E-commerce site"

# Create at custom path
claude project create my-api --path ~/Projects/api-project
```

**What it creates:**
```
~/Projects/<name>/
└── .claude/
    ├── Claude.md
    ├── metadata.json
    ├── skill-rules.json
    ├── hooks/
    ├── skills/
    ├── agents/
    ├── commands/
    └── resources/
```

**Post-creation:**
- Automatically runs **Portability Analysis** checkpoint
- Displays recommendations from [Project Portability Checklist](PROJECT_PORTABILITY_CHECKLIST.md)
- Guides you through optimizing settings, hooks, and skills

**Exit codes:**
- `0` - Success
- `1` - Project already exists
- `2` - Invalid template
- `3` - Permission denied

---

### `claude project switch <name>`
Switch the active project context.

**Syntax:**
```bash
claude project switch <name>
```

**Examples:**
```bash
# Switch to a project
claude project switch my-webapp

# Switch with validation
claude project switch my-api --validate
```

**What happens:**
1. Current project context unloaded
2. New project context loaded from `.claude/`
3. Active project updated in `~/.claude/config.json`
4. Project marked as last active

**Exit codes:**
- `0` - Success
- `1` - Project not found
- `2` - Project path invalid

---

### `claude project list`
List all registered projects.

**Syntax:**
```bash
claude project list [options]
```

**Options:**
- `--active-only` - Show only active project
- `--json` - Output as JSON
- `--verbose` - Show detailed information

**Examples:**
```bash
# List all projects
claude project list

# Show active project only
claude project list --active-only

# JSON output
claude project list --json

# Detailed view
claude project list --verbose
```

**Output:**
```
📋 Registered Projects:

✅ my-webapp          /Users/you/Projects/my-webapp (active)
   Last active: 2 minutes ago
   Created: 2025-11-05

✅ my-api             /Users/you/Projects/my-api
   Last active: 2 hours ago
   Created: 2025-11-04

✅ my-store           /Users/you/Projects/my-store
   Last active: 1 day ago
   Created: 2025-11-03

Total: 3 projects
```

**Exit codes:**
- `0` - Success
- `1` - No projects registered

---

### `claude project remove <name>`
Remove a project from the registry (files are NOT deleted).

**Syntax:**
```bash
claude project remove <name> [options]
```

**Options:**
- `--force` - Skip confirmation prompt
- `--delete-files` - Also delete project files (dangerous!)

**Examples:**
```bash
# Remove with confirmation
claude project remove my-old-project

# Remove without confirmation
claude project remove my-old-project --force

# Remove and delete files (use with caution!)
claude project remove my-test --force --delete-files
```

**What happens:**
1. Project removed from `~/.claude/config.json`
2. Cache cleared for the project
3. Files remain on disk (unless `--delete-files` used)

**Exit codes:**
- `0` - Success
- `1` - Project not found
- `2` - User cancelled

---

### `claude project validate <name>`
Validate a project's diet103 structure.

**Syntax:**
```bash
claude project validate [name] [options]
```

**Options:**
- `--strict` - Enable strict validation
- `--fix` - Attempt to fix issues automatically

**Examples:**
```bash
# Validate current project
claude project validate

# Validate specific project
claude project validate my-webapp

# Strict validation
claude project validate my-api --strict

# Validate and fix
claude project validate my-store --fix
```

**Checks performed:**
- ✓ `.claude/` directory exists
- ✓ `Claude.md` exists
- ✓ `metadata.json` valid
- ✓ Hooks directory exists
- ✓ Skills directory exists
- ⚠️ Optional: skill-rules.json present
- ⚠️ Optional: Skills present

**Output:**
```
Validating: my-webapp

✅ .claude/ directory exists
✅ Claude.md exists (1,234 lines)
✅ metadata.json exists and valid
✅ Hooks directory exists
✅ Skills directory exists
⚠️  No skill-rules.json (optional)
⚠️  No skills found (optional)

Project structure: VALID ✓
Warnings: 2 (non-critical)
```

**Exit codes:**
- `0` - Valid structure
- `1` - Invalid structure
- `2` - Project not found

---

### `claude project register [path]`
Register an existing project with the orchestrator.

**Syntax:**
```bash
claude project register [path] [options]
```

**Options:**
- `--name <name>` - Custom project name
- `--no-validate` - Skip validation

**Examples:**
```bash
# Register current directory
cd ~/Projects/existing-project
claude project register

# Register specific path
claude project register ~/Projects/old-project --name old-project

# Register without validation
claude project register ~/Projects/legacy --no-validate
```

**Requirements:**
- Directory must contain `.claude/` folder
- Must have valid `Claude.md`
- Must have valid `metadata.json`

**Post-registration:**
- Automatically runs **Portability Analysis** checkpoint
- Displays optimization recommendations from [Project Portability Checklist](PROJECT_PORTABILITY_CHECKLIST.md)
- Suggests elements to port from other projects

**Exit codes:**
- `0` - Success
- `1` - Invalid structure
- `2` - Already registered

---

### `claude project init [path]`
Initialize diet103 structure in existing directory.

**Syntax:**
```bash
claude project init [path] [options]
```

**Options:**
- `--template <type>` - Template to use (base, web-app, shopify)
- `--name <name>` - Project name

**Examples:**
```bash
# Initialize current directory
cd ~/Projects/my-project
claude project init

# Initialize specific directory
claude project init ~/Projects/legacy-app --template base

# Initialize with custom name
claude project init --name my-custom-project
```

**What it creates:**
- `.claude/` directory with full structure
- Registers project in config
- Does not overwrite existing files

**Exit codes:**
- `0` - Success
- `1` - Already initialized
- `2` - Permission denied

---

### `claude project current`
Display the currently active project.

**Syntax:**
```bash
claude project current [options]
```

**Options:**
- `--json` - Output as JSON
- `--path` - Show project path only
- `--verbose` - Show detailed information

**Examples:**
```bash
# Show current project
claude project current

# JSON output
claude project current --json

# Show only path
claude project current --path

# Detailed view
claude project current --verbose
```

**Output:**
```
Current Project: my-webapp
Path: /Users/you/Projects/my-webapp
Last Active: 2 minutes ago
Created: 2025-11-05
```

**Exit codes:**
- `0` - Success
- `1` - No active project

---

### `claude project health [path]`
Calculate and display comprehensive health metrics for a project.

**Syntax:**
```bash
claude project health [path] [options]
```

**Options:**
- `--update` - Save health score to project metadata
- `--verbose` - Show detailed breakdown and all recommendations
- `--json` - Output as JSON
- `--no-recommendations` - Skip recommendation generation

**Examples:**
```bash
# Check health of current project
claude project health

# Check specific project
claude project health ~/Projects/my-webapp

# Update metadata with health score
claude project health --update

# Detailed view with all recommendations
claude project health --verbose

# JSON output for automation
claude project health --json
```

**Health Score Components:**
The health score (0-100) is calculated from four weighted components:

1. **Structure Validity (40%)** - Presence and correctness of required directories and files
   - `.claude/` directory
   - Required subdirectories (hooks, skills, prompts, templates, docs, context)
   - Core files (Claude.md, metadata.json, skill-rules.json)

2. **Hook Status (30%)** - Validation of project hooks
   - `UserPromptSubmit.js` exists and exports correct function
   - `PostToolUse.js` exists and exports correct function
   - Hooks contain valid JavaScript

3. **Skill Activity (20%)** - Skill configuration and usage
   - `skill-rules.json` validity
   - Skill directories synchronized with rules
   - Active skills configured

4. **Configuration Completeness (10%)** - Metadata quality
   - `metadata.json` validity
   - Required fields present (name, version, description)
   - Version compatibility

**Health Status Categories:**
- 🟢 **Healthy** (85-100): Project is in excellent condition
- 🟡 **Needs Attention** (70-84): Minor issues to address
- 🔴 **Critical** (0-69): Significant problems requiring immediate attention

**Sample Output:**
```
🏥 PROJECT HEALTH ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project: my-webapp
Path: /Users/you/Projects/my-webapp

Overall Health Score: 87/100 🟢 Healthy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 COMPONENT BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Structure Validity     40/40  [████████████████████] 100%
✅ Hook Status            30/30  [████████████████████] 100%
⚠️  Skill Activity        12/20  [████████████░░░░░░░░]  60%
✅ Configuration          10/10  [████████████████████] 100%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 🟡 [MEDIUM] Add missing skill directories
   Issue: skill-rules.json references skills not in skills/ directory
   Impact: +8 points to health score
   Action: Synchronize skill directories with skill-rules.json
   
2. 🔵 [LOW] Update skill-rules.json with activation patterns
   Issue: Some skills lack activation rules
   Impact: +2 points to health score
   Action: Add conditions and patterns to skill configurations

Last Health Check: Just now
```

**Health Alerts:**
The health command also generates automatic alerts based on score thresholds:
- 🔴 **Critical Alert** (score < 50): Immediate action required
- 🟡 **Warning Alert** (score < 70): Issues need attention
- 🟢 **Success Alert**: Score improved by 20+ points

**Metadata Storage:**
When using `--update`, the health score is stored in `metadata.json`:
```json
{
  "name": "my-webapp",
  "healthScore": 87,
  "timestamps": {
    "lastHealthCheckAt": "2025-11-12T19:30:00.000Z"
  }
}
```

**Exit codes:**
- `0` - Success (any health score)
- `1` - Not in a valid project directory
- `2` - Health calculation failed

**Related Commands:**
- `claude project validate` - Basic structure validation
- `claude project list` - View health scores for all projects (when available)

---

## Rule Management Commands

### `diet103 rules sync`
Sync rules with central registry from source project.

**Syntax:**
```bash
diet103 rules sync [options]
```

**Options:**
- `-f, --force` - Force re-sync even if up to date
- `--dry-run` - Preview changes without applying
- `--only <filter>` - Only sync matching rules (comma-separated)
- `--exclude <filter>` - Exclude matching rules (comma-separated)
- `-v, --verbose` - Show detailed sync output

**Examples:**
```bash
# Sync all rules
diet103 rules sync

# Preview changes without applying
diet103 rules sync --dry-run

# Sync only primacy rules
diet103 rules sync --only=primacy

# Sync all except validation rules
diet103 rules sync --exclude=validation

# Force sync with verbose output
diet103 rules sync --force --verbose
```

**What it does:**
1. Compares current rules with source project
2. Identifies new, updated, and modified rules
3. Creates backups of existing rules
4. Applies rule updates
5. Updates rule manifest
6. Updates project registry

**Exit codes:**
- `0` - Success or no updates needed
- `1` - Sync failed or rules not registered

---

### `diet103 rules list`
List installed rule profiles.

**Syntax:**
```bash
diet103 rules list [options]
```

**Options:**
- `-v, --verbose` - Show descriptions and priority levels

**Examples:**
```bash
# List all rules
diet103 rules list

# List with descriptions
diet103 rules list --verbose
```

**Output:**
- Rules version number
- Last update timestamp
- Rules grouped by category (Primacy, Infrastructure, Validation, Meta)
- Scope indicators: 🔒 (universal/locked) or 📝 (customizable)
- Rule versions
- Total rule count

**Exit codes:**
- `0` - Success

---

### `diet103 rules add <profile>`
Add a new rule profile to the project.

**Syntax:**
```bash
diet103 rules add <profile> [options]
```

**Arguments:**
- `profile` - Rule profile name (cursor, windsurf, roo, claude, etc.)

**Options:**
- `-v, --verbose` - Show detailed output

**Examples:**
```bash
# Add cursor rules
diet103 rules add cursor

# Add windsurf rules with verbose output
diet103 rules add windsurf --verbose
```

**Available Profiles:**
- `cursor` - Cursor IDE rules
- `windsurf` - Windsurf rules  
- `roo` - Roo Code rules
- `claude` - Claude Code rules

**Exit codes:**
- `0` - Success

---

### `diet103 rules remove <profile>`
Remove a rule profile from the project.

**Syntax:**
```bash
diet103 rules remove <profile> [options]
```

**Arguments:**
- `profile` - Rule profile name or pattern to match

**Options:**
- `-f, --force` - Force removal without confirmation
- `-v, --verbose` - Show detailed output

**Examples:**
```bash
# List rules matching profile (dry run)
diet103 rules remove cursor

# Remove with confirmation
diet103 rules remove cursor --force

# Remove with verbose output
diet103 rules remove cursor --force --verbose
```

**What it does:**
1. Searches for rules matching profile name
2. Lists matching rules
3. Removes rule files (if --force)
4. Updates rule manifest

**Exit codes:**
- `0` - Success
- `1` - No matching rules or manifest not found

---

### `diet103 rules check`
Check for rule updates from source project.

**Syntax:**
```bash
diet103 rules check [options]
```

**Options:**
- `-v, --verbose` - Show detailed check output

**Examples:**
```bash
# Check for updates
diet103 rules check

# Check with detailed report
diet103 rules check --verbose
```

**Output:**
- Current rules version
- Source rules version  
- Number of available updates
- List of rules to update
- Update types (new, update, modified)

**Exit codes:**
- `0` - Up to date
- `1` - Updates available or not registered

---

### `diet103 rules register`
Register current project with rule sync system.

**Syntax:**
```bash
diet103 rules register [options]
```

**Options:**
- `-f, --force` - Force re-registration
- `-v, --verbose` - Show detailed output

**Examples:**
```bash
# Register current project
diet103 rules register

# Force re-registration
diet103 rules register --force
```

**What it does:**
1. Detects project path and name
2. Reads rule manifest if exists
3. Determines rules version
4. Registers project in global registry
5. Sets project role (source or consumer)

**Exit codes:**
- `0` - Success or already registered
- `1` - Registration failed

---

### `diet103 rules status`
Show rule sync status for current project.

**Syntax:**
```bash
diet103 rules status [options]
```

**Options:**
- `-v, --verbose` - Show detailed status

**Examples:**
```bash
# Show status
diet103 rules status

# Show detailed status
diet103 rules status --verbose
```

**Output:**
- Project name
- Current rules version
- Project role (source/consumer)
- Last sync timestamp
- Update availability

**Exit codes:**
- `0` - Success
- `1` - Not registered

---

## Command Options

### Common Options

Available for most commands:

- `--help, -h` - Display command help
- `--verbose, -v` - Verbose output
- `--quiet, -q` - Suppress output
- `--json` - JSON formatted output
- `--no-color` - Disable colored output

### Template Options

Templates available for `create` and `init`:

- `base` - Minimal diet103 structure (default)
- `web-app` - Web development configuration
- `shopify` - E-commerce/Shopify setup

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid input/configuration |
| 3 | Permission denied |
| 4 | File not found |
| 5 | Network error |

**Usage in scripts:**
```bash
#!/bin/bash

claude project switch my-api
if [ $? -eq 0 ]; then
  echo "Switch successful"
else
  echo "Switch failed"
  exit 1
fi
```

---

## Environment Variables

### `CLAUDE_HOME`
Override default CLI location.

**Default:** `~/.claude`

**Usage:**
```bash
export CLAUDE_HOME="$HOME/custom/path"
claude project list
```

### `CLAUDE_CONFIG`
Override config file location.

**Default:** `~/.claude/config.json`

**Usage:**
```bash
export CLAUDE_CONFIG="/path/to/custom/config.json"
```

### `CLAUDE_NO_COLOR`
Disable colored output.

**Usage:**
```bash
export CLAUDE_NO_COLOR=1
claude project list
```

### `CLAUDE_LOG_LEVEL`
Set logging verbosity.

**Values:** `debug`, `info`, `warn`, `error`

**Usage:**
```bash
export CLAUDE_LOG_LEVEL=debug
claude project create my-project
```

---

## Configuration Files

### `~/.claude/config.json`
Global configuration and project registry.

**Location:** `~/.claude/config.json`

**Structure:**
```json
{
  "version": "1.0.0",
  "active_project": "my-webapp",
  "projects": {
    "my-webapp": {
      "path": "/Users/you/Projects/my-webapp",
      "created": "2025-11-05T10:00:00Z",
      "last_active": "2025-11-07T15:30:00Z",
      "metadata": {
        "description": "Web application project",
        "tags": ["web", "production"]
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

### Project `metadata.json`
Project-specific metadata.

**Location:** `<project>/.claude/metadata.json`

**Structure:**
```json
{
  "name": "my-webapp",
  "version": "1.0.0",
  "description": "Web application project",
  "created": "2025-11-05T10:00:00Z",
  "diet103_version": "1.2.0",
  "tags": ["web", "typescript", "react"]
}
```

### Project `skill-rules.json`
Skill activation rules.

**Location:** `<project>/.claude/skill-rules.json`

**Structure:**
```json
{
  "version": "1.0.0",
  "rules": [
    {
      "skill": "web-asset-generator",
      "triggers": ["favicon", "icon", "logo"],
      "auto_activate": true,
      "priority": "high"
    }
  ]
}
```

---

## Tips and Best Practices

### 1. Use Descriptive Names
```bash
# Good
claude project create client-acme-website

# Avoid
claude project create proj1
```

### 2. Validate After Major Changes
```bash
# After adding skills or hooks
claude project validate my-project
```

### 3. Use Templates Appropriately
```bash
# Web projects
claude project create my-site --template web-app

# General projects
claude project create my-api --template base
```

### 4. Leverage Environment Variables
```bash
# In scripts
export CLAUDE_LOG_LEVEL=debug
export CLAUDE_NO_COLOR=1
```

### 5. Check Before Removing
```bash
# List projects first
claude project list

# Then remove
claude project remove old-project
```

---

## Troubleshooting

For troubleshooting common issues, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

For frequently asked questions, see [FAQ.md](FAQ.md).

---

**Related Documentation:**
- [Getting Started](GETTING_STARTED.md)
- [Architecture](ARCHITECTURE.md)
- [README](README.md)

**Last Updated:** 2025-11-07
