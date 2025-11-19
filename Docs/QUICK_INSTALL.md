# Orchestrator - Quick Install Guide

**Time:** 2 minutes  
**Result:** `orch` and `orchestrator` commands work globally

---

## Installation

Run these commands from the Orchestrator_Project directory:

```bash
cd ~/Orchestrator_Project

# Install globally
npm install -g .

# Or create a symlink (alternative)
npm link
```

---

## Verification

Test that it worked:

```bash
# Test main commands
orch help
orchestrator --version

# Test quick commands
orch where
orch next
```

**Expected output:**
- `orch help` shows the command list
- `orch where` shows your current project  
- `orch next` shows next available task

---

## Optional: Super-Short Aliases

For even faster commands (like `on` instead of `orch next`):

```bash
# Run the alias installer
./bin/setup-aliases.sh

# Reload your shell
source ~/.zshrc  # for zsh
# or
source ~/.bashrc  # for bash
```

Now you can use:
- `o` = `orch`
- `on` = `orch next`
- `ow` = `orch where`
- `od <id>` = `orch done <id>`
- `ol <id> <msg>` = `orch log <id> <msg>`
- `os <id>` = `orch show <id>`

---

## Troubleshooting

### "command not found: orch"

**Solution 1: Use full path (works immediately)**
```bash
cd ~/Orchestrator_Project
./bin/orch help
```

**Solution 2: Add to PATH**
```bash
# Add to ~/.zshrc or ~/.bashrc
export PATH="$HOME/Orchestrator_Project/bin:$PATH"

# Reload shell
source ~/.zshrc
```

**Solution 3: Global install**
```bash
cd ~/Orchestrator_Project
npm install -g .
```

### npm link permission errors

Fix npm permissions:
```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc

# Try again
cd ~/Orchestrator_Project
npm link
```

### Aliases don't work

Reload your shell:
```bash
source ~/.zshrc  # or ~/.bashrc
```

Or open a new terminal window.

---

## Manual Installation (If All Else Fails)

Create shell functions directly:

```bash
# Add to ~/.zshrc or ~/.bashrc
export ORCHESTRATOR_PATH="$HOME/Orchestrator_Project"

orch() {
    node "$ORCHESTRATOR_PATH/bin/orch" "$@"
}

orchestrator() {
    node "$ORCHESTRATOR_PATH/bin/orchestrator.cjs" "$@"
}
```

Reload shell and test:
```bash
source ~/.zshrc
orch help
```

---

## Success Checklist

After installation, verify:

- [ ] `orch help` works
- [ ] `orch where` shows current project
- [ ] `orch next` shows tasks
- [ ] (Optional) `on` works (if aliases installed)
- [ ] (Optional) `ow` works (if aliases installed)

---

## Next Steps

1. **Read the workflow guide:**
   ```bash
   cat DAILY_WORKFLOW.md
   ```

2. **Try the template system:**
   ```bash
   ./templates/project-setup/setup-project.sh ~/test-project
   ```

3. **Start using it:**
   ```bash
   orch where
   orch next
   # ... implement code ...
   orch done 1.1
   ```

---

## Uninstall

```bash
# Remove global installation
npm uninstall -g orchestrator-project

# Or remove symlink
cd ~/Orchestrator_Project
npm unlink

# Remove aliases (edit and delete the "Orchestrator Aliases" section)
vim ~/.zshrc  # or ~/.bashrc
```

---

**Quick reference:** See `DAILY_WORKFLOW.md`  
**Full documentation:** See `Docs/SHELL_ALIASES.md`  
**Template setup:** See `templates/project-setup/QUICKSTART.md`

