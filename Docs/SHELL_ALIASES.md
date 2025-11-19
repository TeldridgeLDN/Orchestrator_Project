# Orchestrator Shell Aliases Setup

**Quick Reference:** Make `orch` commands even faster with shell aliases.

---

## Quick Install

Run this one command to install everything:

```bash
cd ~/Orchestrator_Project
npm link
```

This makes these commands globally available:
- `orch` - Quick helper
- `orchestrator` - Full CLI
- `diet103` - Original CLI

---

## Optional: Super-Short Aliases

For even faster access, add these to your shell config:

### Automatic Installation

```bash
# Add aliases to your shell
./bin/setup-aliases.sh
```

### Manual Installation

Choose your shell and add these lines:

#### For Zsh (macOS default)

```bash
# Add to ~/.zshrc
echo '# Orchestrator Aliases' >> ~/.zshrc
echo 'alias o="orch"' >> ~/.zshrc
echo 'alias on="orch next"' >> ~/.zshrc
echo 'alias ow="orch where"' >> ~/.zshrc
echo 'alias od="orch done"' >> ~/.zshrc
echo 'alias ol="orch log"' >> ~/.zshrc
echo 'alias os="orch show"' >> ~/.zshrc

# Apply changes
source ~/.zshrc
```

#### For Bash

```bash
# Add to ~/.bashrc or ~/.bash_profile
echo '# Orchestrator Aliases' >> ~/.bashrc
echo 'alias o="orch"' >> ~/.bashrc
echo 'alias on="orch next"' >> ~/.bashrc
echo 'alias ow="orch where"' >> ~/.bashrc
echo 'alias od="orch done"' >> ~/.bashrc
echo 'alias ol="orch log"' >> ~/.bashrc
echo 'alias os="orch show"' >> ~/.bashrc

# Apply changes
source ~/.bashrc
```

---

## Available Aliases

After setup, you can use:

| Alias | Full Command | Description |
|-------|-------------|-------------|
| `o` | `orch` | Main helper |
| `on` | `orch next` | Get next task |
| `ow` | `orch where` | Show current project |
| `od <id>` | `orch done <id>` | Mark task complete |
| `ol <id> <msg>` | `orch log <id> <msg>` | Log progress |
| `os <id>` | `orch show <id>` | Show task details |

---

## Usage Examples

### Before Aliases (Good)

```bash
orch where
orch next
orch show 2.1
orch log 2.1 "Completed feature"
orch done 2.1
```

### After Aliases (Better)

```bash
ow           # where
on           # next
os 2.1       # show
ol 2.1 "Completed feature"  # log
od 2.1       # done
```

**Time saved:** ~60% less typing!

---

## Verification

Test that everything works:

```bash
# Test global commands
orch help
orchestrator --version

# Test aliases (if installed)
o help
on
ow
```

Expected output:
- `orch help` shows the quick reference
- `on` shows your next task
- `ow` shows your current project

---

## Troubleshooting

### "command not found: orch"

Run in the Orchestrator_Project directory:
```bash
npm link
```

If that fails:
```bash
npm install -g .
```

### "command not found: o"

Aliases not installed. Run:
```bash
./bin/setup-aliases.sh
```

Or follow manual installation steps above.

### Aliases don't work after setup

Reload your shell:
```bash
# For zsh
source ~/.zshrc

# For bash
source ~/.bashrc
```

Or open a new terminal window.

### npm link permission errors

Use sudo (not recommended) or fix npm permissions:
```bash
# Fix npm global permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc

# Then try again
npm link
```

---

## Uninstall

### Remove global commands

```bash
cd ~/Orchestrator_Project
npm unlink
```

### Remove aliases

Edit your shell config file and remove the Orchestrator aliases section:

```bash
# For zsh
vim ~/.zshrc

# For bash
vim ~/.bashrc
```

Remove these lines:
```bash
# Orchestrator Aliases
alias o="orch"
alias on="orch next"
# ... etc
```

Then reload:
```bash
source ~/.zshrc  # or ~/.bashrc
```

---

## Custom Aliases

Want different shortcuts? Customize in your shell config:

```bash
# Add to ~/.zshrc or ~/.bashrc

# Your custom aliases
alias work="orch next"
alias done="orch done"
alias whereami="orch where"
alias progress="orch log"

# Project-specific aliases
alias momentum="orchestrator switch Momentum_Squared"
alias diet="orchestrator switch diet103"
```

---

## Shell Integration Tips

### Quick Project Switching

```bash
# Add to shell config
alias p-momentum="orchestrator switch Momentum_Squared && orch next"
alias p-diet="orchestrator switch diet103 && orch next"
```

Now `p-momentum` switches project AND shows next task!

### Auto-Show Current Project

Add to your shell prompt (advanced):

```bash
# For zsh, add to ~/.zshrc
PROMPT='%F{blue}$(orchestrator current --short 2>/dev/null)%f %F{green}%~%f $ '
```

Shows current project in your prompt!

### Task Completion with Git

```bash
# Add to shell config
function odg() {
  orch done $1 && git add . && git commit -m "Complete task $1"
}
```

Now `odg 2.1` marks task done AND commits!

---

## Best Practices

### Start of Day Routine

```bash
ow           # Where am I?
on           # What's next?
os 2.1       # Show task details
```

### During Development

```bash
ol 2.1 "Implemented X"    # Log progress
ol 2.1 "Fixed bug Y"      # Log more
od 2.1                     # Mark complete
```

### End of Day

```bash
git add . && git commit -m "..."
git push
```

---

## FAQ

**Q: Do I need aliases?**  
A: No! `orch` commands are already short. Aliases just save a few more keystrokes.

**Q: Which aliases should I use?**  
A: Start with just `o`, `on`, and `ow`. Add more as needed.

**Q: Can I use different names?**  
A: Yes! Customize aliases in your shell config file.

**Q: Will aliases work in all projects?**  
A: Yes! Once installed globally, they work everywhere.

---

## Summary

**Minimum Setup (Required):**
```bash
npm link  # Makes orch command available
```

**Maximum Convenience (Optional):**
```bash
./bin/setup-aliases.sh  # Adds super-short aliases
```

**Result:**
- ✅ `orch` commands work everywhere
- ✅ Super-short aliases available
- ✅ Faster workflow
- ✅ Less typing

---

**Ready to install?**

```bash
# 1. Install global commands
cd ~/Orchestrator_Project
npm link

# 2. (Optional) Install aliases
./bin/setup-aliases.sh

# 3. Test it
orch help
on
ow
```

**That's it!** 🎉

