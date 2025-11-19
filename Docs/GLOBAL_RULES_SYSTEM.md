# Global Rules System

**Problem Solved:** Rules were only loading in the Orchestrator project, not in other projects you switch to.

**Solution:** Global rules system inspired by [Daniel Miessler's Personal AI Infrastructure](https://github.com/danielmiessler/Personal_AI_Infrastructure).

---

## Quick Setup

```bash
# Run once to set up global rules
cd ~/Orchestrator_Project
npm install -g .
orchestrator sync-rules
```

**Done!** Rules now load automatically in ALL projects.

---

## How It Works

### The Problem

**Before:**
```
Orchestrator_Project/
├── .cursor/rules/          # Rules HERE
│   ├── taskmaster.mdc
│   └── ...

Portfolio_Redesign/
├── .cursor/rules/          # No Orchestrator rules!
```

When you switch to Portfolio_Redesign, Orchestrator rules don't load.

### The Solution

**After:**
```
~/.orchestrator/
├── rules/                  # ← GLOBAL rules (cross-project)
│   ├── taskmaster.mdc
│   ├── cursor_rules.mdc
│   └── ...

Orchestrator_Project/
├── .claude/settings.json   # Points to ~/.orchestrator/rules
├── .cursor/rules/          # Project-specific rules

Portfolio_Redesign/
├── .claude/settings.json   # Points to ~/.orchestrator/rules  
├── .cursor/rules/          # Project-specific rules
```

Now **both** global and project-specific rules load automatically!

---

## Architecture

Inspired by [Miessler's PAI](https://github.com/danielmiessler/Personal_AI_Infrastructure):

```
~/.orchestrator/              # Global infrastructure
├── rules/                    # Cross-project rules
│   ├── taskmaster/
│   │   ├── dev_workflow.mdc
│   │   └── taskmaster.mdc
│   ├── cursor_rules.mdc
│   ├── self_improve.mdc
│   └── project_identity.mdc
├── projects.json             # Registered projects
└── config.json               # Global config

Each Project/
├── .claude/
│   └── settings.json         # Auto-loads global + local rules
└── .cursor/rules/            # Project-specific rules only
```

### Rule Loading Priority

1. **Global rules** (`.orchestrator/rules/`) - Orchestrator patterns
2. **Project rules** (`.cursor/rules/`) - Project-specific patterns

Both load automatically via `.claude/settings.json`:

```json
{
  "rules": {
    "autoLoad": true,
    "paths": [
      "/Users/you/.orchestrator/rules",  // ← Global
      ".cursor/rules"                     // ← Project-specific
    ]
  }
}
```

---

## Commands

### Sync Rules (Primary)

```bash
# Set up global rules and sync to all projects
orchestrator sync-rules
```

**What it does:**
1. Creates `~/.orchestrator/rules/`
2. Copies core Orchestrator rules there
3. Updates `.claude/settings.json` in all registered projects
4. Enables auto-load

### Verify Setup

```bash
# Check where rules are loaded from
cat ~/.orchestrator/rules/.rule-manifest.json

# Check a project's settings
cat ~/Portfolio_Redesign/.claude/settings.json
```

---

## What Rules Are Synced Globally?

Core Orchestrator rules that apply to all projects:

| Rule | Description | Why Global |
|------|-------------|------------|
| `taskmaster/dev_workflow.mdc` | Taskmaster workflow patterns | Use Taskmaster everywhere |
| `taskmaster/taskmaster.mdc` | Taskmaster tool reference | Use Taskmaster everywhere |
| `cursor_rules.mdc` | Cursor IDE standards | Consistent formatting |
| `self_improve.mdc` | Rule improvement patterns | Maintain rule quality |
| `project_identity.mdc` | Project validation | Prevent wrong-project work |

### Project-Specific Rules

Keep these in `.cursor/rules/` (NOT synced globally):
- Language-specific rules (Python, JavaScript, etc.)
- Framework rules (React, Django, etc.)
- Project conventions
- Client-specific patterns

---

## Usage Examples

### Example 1: New Project

```bash
# Create new project with template
./templates/project-setup/setup-project.sh ~/projects/my-api

# Sync rules (automatic during setup, but can run manually)
orchestrator sync-rules

# Start working - rules auto-load!
cd ~/projects/my-api
# Claude automatically loads Orchestrator rules + project rules
```

### Example 2: Existing Project

```bash
# Register existing project
cd ~/existing-project
orchestrator register "Existing Project"

# Sync rules
orchestrator sync-rules

# Start working - rules auto-load!
# Claude automatically loads Orchestrator rules + project rules
```

### Example 3: Switching Projects

```bash
# Work in Orchestrator
cd ~/Orchestrator_Project
orch next
# ✓ Orchestrator rules loaded

# Switch to Portfolio
cd ~/Portfolio_Redesign  
orch next
# ✓ Orchestrator rules STILL loaded!
```

---

## Integration with Project Setup Template

The project setup template automatically configures global rules:

```bash
./templates/project-setup/setup-project.sh ~/projects/my-project
```

What it does:
1. Creates `.claude/settings.json` with both global and local paths
2. Configures auto-load
3. No manual sync needed!

See `templates/project-setup/README.md` for details.

---

## Manual Setup (If Automated Fails)

### Step 1: Create Global Rules Directory

```bash
mkdir -p ~/.orchestrator/rules/taskmaster
```

### Step 2: Copy Core Rules

```bash
cd ~/Orchestrator_Project

# Copy core rules
cp .cursor/rules/taskmaster/dev_workflow.mdc ~/.orchestrator/rules/taskmaster/
cp .cursor/rules/taskmaster/taskmaster.mdc ~/.orchestrator/rules/taskmaster/
cp .cursor/rules/cursor_rules.mdc ~/.orchestrator/rules/
cp .cursor/rules/self_improve.mdc ~/.orchestrator/rules/
cp .cursor/rules/project_identity.mdc ~/.orchestrator/rules/
```

### Step 3: Update Project Settings

For each project, edit `.claude/settings.json`:

```json
{
  "rules": {
    "autoLoad": true,
    "paths": [
      "/Users/YOUR_USERNAME/.orchestrator/rules",
      ".cursor/rules"
    ]
  }
}
```

Replace `YOUR_USERNAME` with your actual username.

---

## Troubleshooting

### Rules Not Loading

**Check settings file:**
```bash
cat ~/your-project/.claude/settings.json
```

Should include:
```json
{
  "rules": {
    "autoLoad": true,
    "paths": [
      "/Users/you/.orchestrator/rules",
      ".cursor/rules"
    ]
  }
}
```

**Fix:**
```bash
orchestrator sync-rules
```

### Global Rules Directory Doesn't Exist

```bash
# Check if it exists
ls ~/.orchestrator/rules/

# If not, create it
orchestrator sync-rules
```

### Rules Outdated

```bash
# Re-sync to get latest rules
orchestrator sync-rules
```

### Wrong Path in settings.json

**Symptom:** Settings show wrong path like `/Users/someoneelse/.orchestrator/rules`

**Fix:** Edit `.claude/settings.json` manually or re-run:
```bash
orchestrator sync-rules
```

---

## Maintenance

### Updating Global Rules

When you improve rules in Orchestrator project:

```bash
cd ~/Orchestrator_Project

# Make changes to .cursor/rules/
vim .cursor/rules/taskmaster/dev_workflow.mdc

# Sync to global location
orchestrator sync-rules

# Now all projects get the update!
```

### Adding New Global Rules

1. Create rule in Orchestrator `.cursor/rules/`
2. Add to `lib/rules/global-rules-loader.js` in `coreRules` array
3. Run `orchestrator sync-rules`

### Removing Global Rules

Edit `~/.orchestrator/rules/.rule-manifest.json` to see what's synced, then:

```bash
# Remove specific rule
rm ~/.orchestrator/rules/unwanted-rule.mdc

# Or re-sync to restore defaults
orchestrator sync-rules
```

---

## Best Practices

### DO:
- ✅ Keep Taskmaster rules global (used everywhere)
- ✅ Keep Cursor formatting rules global (consistency)
- ✅ Keep project validation rules global (prevent errors)
- ✅ Sync rules after major updates
- ✅ Use project-specific rules for unique patterns

### DON'T:
- ❌ Don't make language-specific rules global (unless you use that language everywhere)
- ❌ Don't make client-specific rules global
- ❌ Don't edit rules in `~/.orchestrator/rules/` directly (edit in Orchestrator project, then sync)
- ❌ Don't skip sync after major rule changes

---

## Integration with diet103 Pattern

This system follows the [diet103](https://github.com/diet103/claude-code-infrastructure-showcase) pattern:

- **Global Layer:** `~/.orchestrator/rules/` (like diet103's global skills)
- **Local Layer:** `.cursor/rules/` (like diet103's project skills)
- **Auto-Loading:** `.claude/settings.json` (like diet103's settings)

Combined with [Miessler's PAI](https://github.com/danielmiessler/Personal_AI_Infrastructure) approach:

- **Central Infrastructure:** All global patterns in one place
- **Project Customization:** Each project can extend with local rules
- **Automatic Loading:** No manual work required

---

## Success Metrics

### Week 1
- ✅ Global rules directory created
- ✅ Core rules synced
- ✅ All projects configured
- ✅ Rules load automatically

### Month 1
- ✅ Rules load in all projects consistently
- ✅ Project-specific rules coexist with global
- ✅ Updates propagate automatically
- ✅ No manual rule copying needed

### Month 3
- ✅ Rule system feels invisible (just works)
- ✅ Cross-project consistency achieved
- ✅ New projects get rules automatically
- ✅ Maintenance is minimal

---

## FAQ

**Q: Do I need to run sync-rules for every project?**  
A: No! Run it once, and it syncs to ALL registered projects.

**Q: What if I add a new project later?**  
A: The project setup template handles it automatically. Or run `orchestrator sync-rules` again.

**Q: Can I have different global rules per project?**  
A: Not really - that defeats the purpose. Use project-specific rules in `.cursor/rules/` instead.

**Q: How do I know which rules are global vs project-specific?**  
A: Check `~/.orchestrator/rules/.rule-manifest.json` for global rules.

**Q: Can I disable global rules for a specific project?**  
A: Yes, edit that project's `.claude/settings.json` and remove the global path.

---

## Related Documentation

- **Main Infrastructure Guide:** HOW_TO_APPLY_INFRASTRUCTURE.md
- **Project Setup Template:** templates/project-setup/README.md
- **Daily Workflow:** DAILY_WORKFLOW.md
- **Shell Aliases:** Docs/SHELL_ALIASES.md

---

## Summary

**Problem:** Rules only loaded in Orchestrator project

**Solution:** Global rules system inspired by Miessler's PAI

**Setup:**
```bash
orchestrator sync-rules
```

**Result:**
- ✅ Rules load everywhere automatically
- ✅ No manual copying
- ✅ Updates propagate to all projects
- ✅ Consistent experience across projects

**Just works!** 🎉

---

**Last Updated:** November 15, 2025  
**Based on:** [Miessler's PAI](https://github.com/danielmiessler/Personal_AI_Infrastructure) + [diet103 patterns](https://github.com/diet103/claude-code-infrastructure-showcase)

