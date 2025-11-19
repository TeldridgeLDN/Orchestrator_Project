# Global Rules Pattern

**Pattern Type:** Infrastructure  
**Created:** November 15, 2025  
**Status:** Active ✅

---

## Problem

Rules were only loading in the Orchestrator project, not when switching to other projects. This made infrastructure inconsistent across projects.

## Solution

Create a global rules system at `~/.orchestrator/rules/` that auto-loads in ALL projects.

### Architecture

```
~/.orchestrator/rules/           ← Global rules (14 core rules)
  ├── taskmaster/
  ├── platform-primacy.md
  ├── documentation-economy.md
  └── ... (11 more)

Each project/.claude/settings.json:
{
  "rules": {
    "autoLoad": true,
    "paths": [
      ".cursor/rules",                    // Project-specific
      "/Users/you/.orchestrator/rules"    // Global
    ]
  }
}
```

### Implementation

1. **Sync Rules Globally:**
   ```bash
   orchestrator sync-rules
   ```

2. **Rules Auto-Load:**
   - Claude automatically loads global + project rules
   - No manual copying needed
   - Updates propagate everywhere

### When to Use

- ✅ Core development standards (cursor_rules, self_improve)
- ✅ Cross-project patterns (taskmaster workflows)
- ✅ Critical infrastructure rules (primacy rules)
- ❌ Project-specific patterns (keep in `.cursor/rules/`)
- ❌ Language-specific rules (unless used everywhere)

## Benefits

- Rules consistent across all projects
- Updates sync automatically
- No manual rule copying
- New projects get rules automatically

## Related

- **Implementation:** `lib/rules/global-rules-loader.js`
- **Documentation:** `Docs/GLOBAL_RULES_SYSTEM.md`
- **Command:** `orchestrator sync-rules`

## Example

```bash
# Work in Orchestrator
cd ~/Orchestrator_Project
# ✓ All 14 rules loaded

# Switch to Portfolio  
cd ~/Portfolio_Redesign
# ✓ Same 14 rules still loaded!
```

## Lessons Learned

- Global infrastructure beats per-project setup
- Miessler's PAI pattern works well for rules
- Auto-loading via settings.json is key
- Keep manifest for tracking what's synced

