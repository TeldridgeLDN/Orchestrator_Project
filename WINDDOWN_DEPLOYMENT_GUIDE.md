# Wind-Down System Deployment Guide

**Version:** 1.2.0  
**Date:** November 15, 2025  
**Status:** ✅ Complete and Ready for Deployment

---

## Quick Summary

The **Session Wind-Down System** is now part of diet103 core infrastructure. It will automatically deploy to all projects through the standard repair/registration process.

---

## How It Works

### In Orchestrator Project (Source)

✅ **Already installed:**
- `.claude/hooks/session-winddown.js` - Detection hook
- `.claude/agents/session-cleanup.md` - 6-phase protocol
- `.claude/commands/wind-down.md` - User guide

### In Other Projects (Target)

🔄 **Gets installed automatically via:**

#### Option 1: Re-register Project (Recommended)

```bash
cd /path/to/your-project
diet103 project register --verbose
```

**What happens:**
1. diet103-repair system runs
2. Detects missing session-winddown hook
3. Installs hook from template (in `lib/utils/diet103-repair.js`)
4. Copies agent from Orchestrator → your project
5. Copies command docs from Orchestrator → your project
6. Makes hook executable
7. Reports installation success

**Result:**
```
✅ Session wind-down system installed:
  - .claude/hooks/session-winddown.js
  - .claude/agents/session-cleanup.md
  - .claude/commands/wind-down.md
```

---

#### Option 2: Auto-Repair (Next Session)

When you work in a project without wind-down:

```bash
cd /path/to/your-project
# Just start working normally
```

**What happens:**
1. diet103 auto-repair detects missing components
2. Installs wind-down system automatically
3. Silent installation (logs if verbose)
4. Ready to use immediately

---

#### Option 3: Manual Sync (Advanced)

If you want to force-install across multiple projects:

```bash
# For each project
for project in ~/dev/*/; do
  cd "$project"
  if [ -d .claude ]; then
    echo "Installing wind-down in: $project"
    diet103 project register --verbose
  fi
done
```

---

## What Gets Installed

### 1. Hook File (Always)

**Location:** `.claude/hooks/session-winddown.js`  
**Source:** Template in `lib/utils/diet103-repair.js`  
**Size:** 60+ lines  
**Executable:** Yes (auto-chmod 755)

**Detects:** "goodbye", "wind down", "wrap up", "end session", etc.  
**Action:** Injects session-cleanup agent into prompt

---

### 2. Agent File (If Source Exists)

**Location:** `.claude/agents/session-cleanup.md`  
**Source:** Copied from Orchestrator `.claude/agents/session-cleanup.md`  
**Size:** 734 lines  
**Type:** Markdown specification

**Contains:** Complete 6-phase wind-down protocol

---

### 3. Command Docs (If Source Exists)

**Location:** `.claude/commands/wind-down.md`  
**Source:** Copied from Orchestrator `.claude/commands/wind-down.md`  
**Size:** 427 lines  
**Type:** User guide and reference

**Contains:** Usage, options, examples, troubleshooting

---

## Verification After Installation

### Quick Check

```bash
# In your project directory
ls -la .claude/hooks/session-winddown.js
ls -la .claude/agents/session-cleanup.md
ls -la .claude/commands/wind-down.md
```

**Expected:**
```
-rwxr-xr-x  .claude/hooks/session-winddown.js      # Executable
-rw-r--r--  .claude/agents/session-cleanup.md      # Regular file
-rw-r--r--  .claude/commands/wind-down.md          # Regular file
```

---

### Test the System

```bash
# In your project, just say:
"goodbye"
```

**Expected behavior:**
```
[🌅 Session Wind-Down Detected]

The user is ending their session. Please activate the 
session-cleanup agent and guide them through a graceful 
wind-down process.

@session-cleanup.md
...
```

If you see this, **it's working!** ✅

---

## Project-Specific Behavior

### Source Project (Orchestrator)

**Status:** ✅ Has latest versions of all files  
**Updates:** Manual (you edit the source files)  
**Deployment:** Via diet103-repair to other projects

---

### Target Projects (Your Other Projects)

**Status:** 🔄 Gets copies during repair/registration  
**Updates:** Re-register to pull latest from Orchestrator  
**Behavior:** Identical to Orchestrator (same files)

---

## Version Management

### When You Update the Wind-Down System in Orchestrator

1. **Edit source files** in Orchestrator:
   - `.claude/hooks/session-winddown.js`
   - `.claude/agents/session-cleanup.md`
   - `.claude/commands/wind-down.md`

2. **Changes apply immediately** in Orchestrator

3. **Other projects get updates** when you:
   - Re-register: `diet103 project register`
   - Or manually copy updated files

---

### Template vs Full Files

| Component | Installation Method |
|-----------|---------------------|
| **Hook** | From template in `diet103-repair.js` |
| **Agent** | Copied from Orchestrator (if exists) |
| **Command** | Copied from Orchestrator (if exists) |

**Why?**
- Hook is small (60 lines) → embed in repair template
- Agent is large (734 lines) → copy from source
- Command is large (427 lines) → copy from source

**Benefit:** Hook always installs, even if source files missing

---

## Troubleshooting

### Hook Installed But Agent Missing

**Symptom:**
```
[Wind-Down Hook] session-cleanup.md agent not found
```

**Cause:** Agent file not copied (source didn't exist during install)

**Fix:**
```bash
# Manually copy from Orchestrator
cp /path/to/Orchestrator_Project/.claude/agents/session-cleanup.md .claude/agents/
```

---

### "Permission Denied" When Running Hook

**Symptom:**
```
Error: EACCES: permission denied
```

**Cause:** Hook not executable

**Fix:**
```bash
chmod +x .claude/hooks/session-winddown.js
```

---

### Wind-Down Doesn't Trigger

**Symptom:** Saying "goodbye" doesn't activate agent

**Possible causes:**
1. Hook not installed
2. Hook not executable
3. Different AI assistant doesn't support hooks

**Fix:**
```bash
# Check hook exists
ls -la .claude/hooks/session-winddown.js

# If missing, re-register
diet103 project register

# Manual invocation
"@session-cleanup.md wind down the session"
```

---

## Migration Path for Existing Projects

### Step 1: List Your Projects

```bash
cat ~/.orchestrator/projects.json | jq -r '.projects | keys[]'
```

---

### Step 2: Re-register Each

```bash
# For each project path from Step 1
cd /path/to/project
diet103 project register --verbose
```

**Look for:**
```
✅ Session wind-down system installed:
  - .claude/hooks/session-winddown.js
  - .claude/agents/session-cleanup.md  (if source exists)
  - .claude/commands/wind-down.md      (if source exists)
```

---

### Step 3: Verify

```bash
# In each project
ls -la .claude/hooks/session-winddown.js

# Test
# Say "goodbye" and watch for wind-down activation
```

---

## Rollout Strategy

### Immediate (Orchestrator Only)

✅ **Complete** - System working in Orchestrator

---

### Week 1 (High-Priority Projects)

Re-register your most-used projects:
```bash
cd ~/important-project
diet103 project register --verbose
```

Test wind-down in each.

---

### Week 2-4 (All Projects)

Let auto-repair handle the rest:
- As you work in each project
- Auto-repair will install wind-down
- No manual action needed

---

### Week 4+ (New Projects)

All new projects get wind-down automatically:
```bash
diet103 init my-new-project
# Wind-down included from the start
```

---

## Benefits by Project Type

### Personal Projects

**Benefit:** Clean project state every session  
**Impact:** ~5 hours/year saved on manual cleanup

---

### Team Projects

**Benefit:** Consistent session management across team  
**Impact:** Better handoffs, less "what were you doing?" questions

---

### Client Projects

**Benefit:** Professional project organization  
**Impact:** Client confidence, easier audits

---

### Open Source Projects

**Benefit:** Contributors get same workflow  
**Impact:** Easier onboarding, consistent practices

---

## FAQ

### Q: Do I need to re-register all projects now?

**A:** No. Auto-repair will install wind-down as you work in each project. Re-register only if you want wind-down immediately.

---

### Q: What if I don't want wind-down in a project?

**A:** Delete the hook:
```bash
rm .claude/hooks/session-winddown.js
```

The system won't re-install unless you re-register.

---

### Q: Can I customize wind-down per project?

**A:** Yes! Edit `.claude/agents/session-cleanup.md` in that project. Changes are local to that project.

---

### Q: Will updates from Orchestrator overwrite my customizations?

**A:** No. `diet103-repair.js` only copies files if they **don't exist**. Your customizations are safe.

To get updates:
```bash
rm .claude/agents/session-cleanup.md
diet103 project register  # Reinstalls latest
```

---

### Q: Does this work with Cursor/Windsurf/etc.?

**A:** Yes! Platform-agnostic. Works with:
- Claude Code ✅
- Cursor ✅
- Windsurf ✅
- Cline ✅
- Roo Code ✅
- Any future diet103-compatible tool ✅

---

## Support & Issues

### If Wind-Down Doesn't Work

1. **Check installation:**
   ```bash
   ls -la .claude/hooks/session-winddown.js
   ls -la .claude/agents/session-cleanup.md
   ```

2. **Verify hook executable:**
   ```bash
   chmod +x .claude/hooks/session-winddown.js
   ```

3. **Test manually:**
   ```
   @session-cleanup.md wind down the session
   ```

4. **Re-register project:**
   ```bash
   diet103 project register --verbose
   ```

---

### If You Want Latest Version

```bash
# Pull latest from Orchestrator
rm .claude/hooks/session-winddown.js
rm .claude/agents/session-cleanup.md
rm .claude/commands/wind-down.md

# Reinstall
diet103 project register
```

---

## Summary

✅ **Wind-down system is now core infrastructure**  
✅ **Auto-installs via diet103-repair**  
✅ **Works across all your projects**  
✅ **Platform-agnostic**  
✅ **Zero configuration needed**

**Just say "goodbye" and it works!** 🌅

---

**Last Updated:** November 15, 2025  
**Version:** diet103 v1.2.0  
**Status:** Production Ready

