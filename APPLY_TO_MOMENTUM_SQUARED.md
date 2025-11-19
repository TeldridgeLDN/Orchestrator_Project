# Applying Infrastructure to Momentum Squared

**Goal:** Get all today's infrastructure features working automatically in Momentum Squared

---

## Current State

✅ Momentum Squared has:
- `.claude/` directory with some infrastructure
- `settings.local.json` (not standard `settings.json`)
- Skills, agents, hooks already present

❌ Momentum Squared needs:
- Global rules auto-loading
- File-based skill triggers
- Session persistence
- Global knowledge access
- New agents & workflows

---

## Option 1: Quick Update (Recommended - 5 minutes)

Update Momentum Squared to use global infrastructure without losing existing setup.

### Step 1: Sync Global Rules

```bash
cd ~/Orchestrator_Project

# Sync global rules (if not done already)
orchestrator sync-rules

# Verify global rules exist
ls ~/.orchestrator/rules/
cat ~/.orchestrator/rules/.rule-manifest.json | jq -r '.rules[].file'
```

**What this does:** Makes 14 core rules available globally

---

### Step 2: Update Momentum Squared Settings

```bash
cd ~/Momentum_Squared

# Check current settings structure
ls .claude/*.json

# If using settings.local.json, we need to add global rules path
```

**Create/Update `.claude/settings.json`:**

```bash
cat > .claude/settings.json << 'EOF'
{
  "rules": {
    "autoLoad": true,
    "paths": [
      ".claude/rules",
      "/Users/tomeldridge/.orchestrator/rules"
    ]
  },
  "hooks": {
    "UserPromptSubmit": [
      ".claude/hooks/skill-activation.js"
    ]
  }
}
EOF
```

**What this does:** 
- Loads local `.claude/rules/` first
- Then loads global `~/.orchestrator/rules/`
- Enables skill auto-activation hook

---

### Step 3: Copy New Infrastructure

```bash
cd ~/Orchestrator_Project

# Copy new agents
cp .claude/agents/code-reviewer.md ~/Momentum_Squared/.claude/agents/
cp .claude/agents/release-coordinator.md ~/Momentum_Squared/.claude/agents/
cp .claude/agents/dependency-auditor.md ~/Momentum_Squared/.claude/agents/

# Copy workflow commands
mkdir -p ~/Momentum_Squared/.claude/commands
cp .claude/commands/*.md ~/Momentum_Squared/.claude/commands/

# Copy new skills
cp -r .claude/skills/shell-integration ~/Momentum_Squared/.claude/skills/
cp -r .claude/skills/rule-management ~/Momentum_Squared/.claude/skills/

# Copy skill-rules.json (with file-based triggers)
cp .claude/skill-rules.json ~/Momentum_Squared/.claude/

# Copy knowledge base structure
mkdir -p ~/Momentum_Squared/.claude/knowledge/{patterns,decisions,prompts}
```

**What this does:** Adds all new features to Momentum Squared

---

### Step 4: Verify Setup

```bash
cd ~/Momentum_Squared

# Check agents (should see 4 total)
ls .claude/agents/*.md

# Check workflows (should see 3)
ls .claude/commands/*.md

# Check skills (should see multiple)
ls .claude/skills/*/skill.md

# Check skill-rules
cat .claude/skill-rules.json | jq -r '.rules[] | .id'

# Verify settings
cat .claude/settings.json
```

---

### Step 5: Test in Momentum Squared

Open Claude/Cursor in Momentum Squared and test:

**Test 1: Global Rules Loading**
```
# Open any file in Momentum Squared
# Global rules should be active (documentation-economy, platform-primacy, etc.)
```

**Test 2: File-Based Skill Activation**
```
# Open .taskmaster/tasks.json → taskmaster skill activates
# Open scripts/*.py → python-dev skill activates (if you have it)
# Open .claude/rules/*.md → rule-management skill activates
```

**Test 3: Session Management**
```bash
orch save-session test "Testing in Momentum Squared"
orch list-sessions
```

**Test 4: Global Knowledge**
```bash
orchestrator knowledge pull
ls .claude/knowledge/patterns/
```

**Test 5: New Agents**
```
@code-reviewer.md

Review [some Python file] for security and quality issues.
```

---

## Option 2: Fresh Template Setup (15 minutes)

If you want to completely refresh Momentum Squared's infrastructure:

### Warning: This will replace existing `.claude/` structure

```bash
cd ~/Orchestrator_Project

# Backup current Momentum Squared .claude/
cp -r ~/Momentum_Squared/.claude ~/Momentum_Squared/.claude.backup

# Apply template (this replaces .claude/)
./templates/project-setup/setup-project.sh \
  --type backend \
  --name "Momentum Squared" \
  ~/Momentum_Squared

# Restore any custom skills/agents from backup
# (Compare .claude.backup with new .claude and merge)
```

**Pros:** Clean, standardized setup  
**Cons:** Need to manually merge any custom configurations

---

## Option 3: Manual Registration (If not registered)

If Momentum Squared isn't registered with Orchestrator:

```bash
cd ~/Momentum_Squared

# Register with Orchestrator
orchestrator register momentum-squared

# Or with full details
orchestrator register \
  --name "Momentum Squared" \
  --path ~/Momentum_Squared \
  --description "Investment portfolio analysis system"
```

Then follow Option 1 steps.

---

## What You Get

After completing Option 1, Momentum Squared will have:

### Automatic Features
- ✅ 14 global rules (documentation-economy, platform-primacy, etc.)
- ✅ File-based skill activation (open file → skill activates)
- ✅ 4 agents (code-reviewer, release-coordinator, dependency-auditor, test-selector)
- ✅ 3 multi-agent workflows (/pre-merge-review, /prepare-release, /dependency-update)
- ✅ Session persistence (orch save-session / restore-session)
- ✅ Global knowledge access (orchestrator knowledge pull)
- ✅ All Orchestrator CLI commands

### Your Workflow in Momentum Squared
```bash
# Navigate to project
cd ~/Momentum_Squared

# Check current project
orch where
# Output: Momentum Squared

# Get next task
orch next

# Work on task...

# Save session before context reset
orch save-session feature-x "Working on portfolio scoring"

# After context reset, restore
orch restore-session feature-x

# Use agents
# @code-reviewer.md - Review my Python scoring changes
# @dependency-auditor.md - Check for security issues in dependencies
```

---

## Verification Checklist

After setup, verify everything works:

```bash
cd ~/Momentum_Squared

# 1. Global rules accessible
ls ~/.orchestrator/rules/

# 2. Settings configured
cat .claude/settings.json | jq '.rules.paths'
# Should show: [".claude/rules", "/Users/tomeldridge/.orchestrator/rules"]

# 3. Agents present
ls .claude/agents/*.md | wc -l
# Should show: 4 or more

# 4. Workflows present
ls .claude/commands/*.md | wc -l
# Should show: 3

# 5. Skills with file triggers
cat .claude/skill-rules.json | jq '.rules[] | select(.file_patterns) | .id'
# Should show: taskmaster_work, shell_scripting, rule_management, etc.

# 6. Session system works
orch save-session test "Test"
orch list-sessions
# Should show: test

# 7. Knowledge accessible
orchestrator knowledge list
# Should show: patterns, prompts from global
```

---

## Troubleshooting

### Issue: Global rules not loading

**Check:**
```bash
# 1. Verify global rules exist
ls ~/.orchestrator/rules/

# 2. Check settings.json paths
cat .claude/settings.json | jq '.rules.paths'

# 3. If using settings.local.json, rename or merge
mv .claude/settings.local.json .claude/settings.local.json.backup
# Then recreate settings.json as shown in Step 2
```

### Issue: Skills not activating

**Check:**
```bash
# 1. Verify skill-rules.json has file_patterns
cat .claude/skill-rules.json | jq '.rules[] | select(.file_patterns)'

# 2. Ensure hook is registered
cat .claude/settings.json | jq '.hooks'

# 3. Copy hook if missing
cp ~/Orchestrator_Project/.claude/hooks/skill-activation.js .claude/hooks/
```

### Issue: Agents not found

**Check:**
```bash
# Copy agents
cp ~/Orchestrator_Project/.claude/agents/*.md .claude/agents/

# Verify
ls .claude/agents/
```

### Issue: orch commands don't work

**Solution:**
```bash
# Ensure npm package is linked globally
cd ~/Orchestrator_Project
npm install -g .

# Test
orch help
```

---

## Recommended: Option 1 (Quick Update)

**Why:**
- Preserves existing Momentum Squared setup
- Adds new features without disruption
- Takes only 5 minutes
- Low risk

**Steps:**
1. Run `orchestrator sync-rules` (if not done)
2. Create/update `.claude/settings.json` with global rules path
3. Copy new agents, workflows, skills
4. Test in Momentum Squared

---

## After Setup

### First Session in Momentum Squared

1. **Open project:**
   ```bash
   cd ~/Momentum_Squared
   # Open in Claude/Cursor
   ```

2. **Verify rules loading:**
   - Check that documentation-economy prevents excessive docs
   - Check that platform-primacy guides tool usage

3. **Test file triggers:**
   - Open `scripts/score_*.py` → relevant skill activates
   - Open `.claude/rules/*.md` → rule-management activates

4. **Use session management:**
   ```bash
   orch save-session current "Working on scoring improvements"
   ```

5. **Pull global knowledge:**
   ```bash
   orchestrator knowledge pull
   # Review patterns in .claude/knowledge/patterns/
   ```

---

## Summary

**Fastest Path (5 minutes):**
1. `orchestrator sync-rules` (from Orchestrator project)
2. Update `.claude/settings.json` in Momentum Squared
3. Copy new agents/workflows/skills
4. Test

**Result:**
- All infrastructure features work automatically
- No loss of existing Momentum Squared setup
- Full access to global rules and knowledge
- Session persistence available
- New agents ready to use

---

**Next:** Choose Option 1 and follow the steps!

