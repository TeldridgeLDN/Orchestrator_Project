# Shell Integration Guide

**Version:** 1.3.0  
**Feature:** Phase 3, Feature 2  
**Status:** ✅ Production Ready

## Overview

The Orchestrator Shell Integration adds your current project name to your terminal prompt, making it immediately clear which project context you're working in. This helps prevent project confusion and provides at-a-glance project status.

## Features

- **Auto-Detection**: Automatically detects your shell type (bash, zsh, fish)
- **Color-Coded Status**: Shows project health with visual indicators
  - 🟢 Green: Healthy project
  - 🟡 Yellow: Pending critical tasks or uncommitted changes
  - 🔴 Red: Issues detected
- **Opt-in Setup**: Interactive prompt during `diet103 init`
- **Easy Management**: Simple commands to install, remove, or check status

## Quick Start

### During Project Initialization

When initializing a new project, you'll be prompted:

```bash
$ diet103 init

? Enable terminal prompt integration? (Shows project name in prompt) [y/N]
```

Select **yes** to automatically set up shell integration.

### Manual Installation

If you skipped the prompt or want to add it later:

```bash
$ diet103 shell install
```

### Verify Installation

Check if shell integration is active:

```bash
$ diet103 shell status
```

## What You'll See

### Before Integration

```bash
user@machine ~/projects/my-project $
```

### After Integration

```bash
[my-project] user@machine ~/projects/my-project $
```

The project name appears in **color-coded brackets** at the start of your prompt.

## Supported Shells

| Shell | Status | RC File |
|-------|--------|---------|
| **Zsh** | ✅ Fully Supported | `~/.zshrc` |
| **Bash** | ✅ Fully Supported | `~/.bashrc` or `~/.bash_profile` |
| **Fish** | ✅ Fully Supported | `~/.config/fish/config.fish` |
| Other | ❌ Not Supported | - |

## Commands

### Install Shell Integration

```bash
diet103 shell install
```

**What it does:**
1. Detects your shell type
2. Creates the prompt integration script
3. Adds sourcing line to your shell RC file
4. Provides activation instructions

**Options:**
- `-v, --verbose` - Show detailed output

**Example:**
```bash
$ diet103 shell install

🐚 Installing Shell Integration

✓ Detected shell: zsh
  RC file: /Users/you/.zshrc
  Creating prompt integration script...
  Adding integration to /Users/you/.zshrc...
  Testing integration...
✅ Shell integration installed successfully!

Next Steps:
  1. Restart your terminal, or
  2. Run: source /Users/you/.zshrc

Your prompt will now show:
  [ProjectName] $ your command here
```

### Remove Shell Integration

```bash
diet103 shell remove
```

**What it does:**
1. Detects your shell type
2. Removes integration code from RC file
3. Provides reload instructions

**Options:**
- `-v, --verbose` - Show detailed output

**Example:**
```bash
$ diet103 shell remove

🗑️  Removing Shell Integration

✓ Detected shell: zsh
✅ Shell integration removed successfully!

Next Steps:
  1. Restart your terminal, or
  2. Run: source /Users/you/.zshrc
```

### Check Integration Status

```bash
diet103 shell status
```

**What it does:**
- Shows current shell type
- Shows RC file location
- Reports installation status

**Example:**
```bash
$ diet103 shell status

🐚 Shell Integration Status

Shell: zsh
RC File: /Users/you/.zshrc
Status: ✓ Installed

Your terminal prompt should show project names when
you're inside orchestrator projects.

To remove: diet103 shell remove
```

## How It Works

### Integration Architecture

1. **Shell RC File**: A small sourcing block is added to your shell configuration
2. **Integration Script**: Located at `lib/shell/prompt-integration.sh`
3. **Project Detection**: Checks for `.claude/metadata.json` to identify projects
4. **Dynamic Prompt**: Updates prompt based on current directory

### What Gets Added to Your RC File

For **bash/zsh**:

```bash
# Orchestrator Shell Integration
# Auto-setup by diet103 init
export ORCHESTRATOR_PATH="/path/to/Orchestrator_Project"

# Source prompt integration
if [ -f "/path/to/Orchestrator_Project/lib/shell/prompt-integration.sh" ]; then
  source "/path/to/Orchestrator_Project/lib/shell/prompt-integration.sh"
fi
```

For **fish**:

```fish
# Orchestrator Shell Integration
# Auto-setup by diet103 init
set -x ORCHESTRATOR_PATH "/path/to/Orchestrator_Project"

# Source prompt integration
if test -f "/path/to/Orchestrator_Project/lib/shell/prompt-integration.sh"
    source "/path/to/Orchestrator_Project/lib/shell/prompt-integration.sh"
end
```

### Status Color Logic

The prompt color changes based on project health:

- **🟢 Green (default)**: All systems go
- **🟡 Yellow**: One of:
  - Pending high-priority tasks
  - Uncommitted git changes
- **🔴 Red**: Critical issues detected

## Non-Interactive Mode

You can enable shell integration during non-interactive initialization:

```bash
diet103 init --name my-project --shell --no-interactive
```

This is useful for automated project setup scripts.

## Troubleshooting

### Integration Not Working After Install

**Solution 1: Restart Terminal**
- Close and reopen your terminal application

**Solution 2: Manual Source**
```bash
# For bash/zsh
source ~/.zshrc  # or ~/.bashrc

# For fish
source ~/.config/fish/config.fish
```

### Wrong Shell Detected

If the auto-detection fails, check your `SHELL` environment variable:

```bash
echo $SHELL
```

Ensure it points to your actual shell binary (e.g., `/bin/zsh`, `/bin/bash`).

### RC File Not Found

For **bash** users, the installer prefers `~/.bashrc` but will fall back to `~/.bash_profile`. If neither exists, the installer will create `~/.bash_profile`.

### Integration Conflicts with Other Tools

If you use other prompt customization tools (e.g., Starship, Oh My Zsh), the integration should work alongside them. The orchestrator prompt appears *before* your existing prompt.

If you experience conflicts:
1. Check the order of sourcing in your RC file
2. Consider disabling one or the other
3. Report the issue for compatibility improvements

### Project Name Not Showing

**Possible Causes:**
1. Not inside an orchestrator project directory
2. Missing `.claude/metadata.json` file

**Verify:**
```bash
# Check if in orchestrator project
ls .claude/metadata.json

# Validate project
diet103 validate
```

## Advanced Configuration

### Customizing Prompt Appearance

The integration script is located at:
```
lib/shell/prompt-integration.sh
```

You can edit this file to customize:
- Color codes
- Prompt format
- Status indicators
- Additional project information

**Example customizations:**
- Show git branch alongside project name
- Add task count to prompt
- Display project health score

### Disable for Specific Projects

To prevent the integration from showing in a specific project, you can:

1. Remove `.claude/metadata.json` (not recommended)
2. Modify the prompt script to check for a `.no-prompt` file
3. Use a different terminal profile for that project

## Integration with Other Tools

### TaskMaster

The shell integration checks for pending high-priority tasks in `.taskmaster/tasks/tasks.json` and adjusts the prompt color accordingly.

### Git

If git is available, the integration detects uncommitted changes and adjusts the prompt color to yellow.

### Project Validator

The integration uses project metadata from `.claude/metadata.json` to display the correct project name.

## Performance Considerations

The shell integration is designed to be lightweight:
- Runs only on directory change (via `chpwd` hook in zsh, `PROMPT_COMMAND` in bash)
- Uses fast file checks (`test -f`)
- Minimal JSON parsing (only if in project directory)
- No network calls
- No external dependencies beyond standard shell utilities

**Typical overhead:** < 10ms per directory change

## Uninstallation

To completely remove shell integration:

1. **Remove via CLI:**
   ```bash
   diet103 shell remove
   ```

2. **Manual Removal (if needed):**
   - Edit your shell RC file (`~/.zshrc`, `~/.bashrc`, etc.)
   - Remove the "Orchestrator Shell Integration" block
   - Restart your terminal

3. **Verify Removal:**
   ```bash
   diet103 shell status
   # Should show: Status: ✗ Not installed
   ```

## FAQ

### Does this work on Windows?

**WSL/WSL2**: Yes, if using a supported shell (bash, zsh, fish)  
**PowerShell/CMD**: Not currently supported  
**Git Bash**: Yes, works like standard bash

### Can I use this with multiple projects?

Yes! The integration automatically detects which project you're in based on the current directory. Navigate between projects and the prompt updates accordingly.

### Will this slow down my terminal?

No. The integration is highly optimized and adds < 10ms to each directory change. You won't notice any performance impact.

### Can I customize the colors?

Yes. Edit `lib/shell/prompt-integration.sh` and modify the ANSI color codes in the `get_orchestrator_project()` function.

### Does this require jq to be installed?

The integration uses `jq` for optimal JSON parsing, but degrades gracefully if `jq` is not available (basic parsing with grep/sed).

For best experience, install `jq`:
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Fedora/RHEL
sudo dnf install jq
```

## Support

For issues or feature requests related to shell integration:

1. Check this documentation
2. Run `diet103 shell status` to diagnose
3. Try `diet103 shell remove` then `diet103 shell install` to reset
4. Check `.claude/metadata.json` exists in your project
5. Verify your shell is supported

---

**Related Documentation:**
- [CLI Reference](./CLI_REFERENCE.md)
- [Getting Started](./GETTING_STARTED.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Phase 3 Implementation](../PHASE3_IMPLEMENTATION_PLAN.md)

