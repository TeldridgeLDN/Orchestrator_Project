# Critical Task Evaluation - Activation Status

**Date:** 2025-11-11  
**Status:** ⚠️ **CONFIGURED BUT NOT YET ACTIVE**

---

## Current State

### ✅ What's Ready

1. **Configuration** - `.taskmaster/config.json` fully configured with:
   - Critic model settings
   - 6 evaluation criteria
   - Auto-apply and report settings

2. **Script** - `.taskmaster/scripts/critical-task-evaluator.js` ready to use

3. **Documentation** - Complete guides and philosophy

4. **Template** - Report generation template

### ❌ What's Missing

**The evaluation is NOT automatically triggered** because:

1. **Taskmaster is External**: `task-master-ai` is an NPM package we don't control
2. **No Built-in Hooks**: Taskmaster doesn't have a plugin/hook system for post-processing
3. **No Integration**: The script exists but isn't called automatically

---

## Why It's Not Active

**Taskmaster (`task-master-ai`) is an external package:**
- Installed via `npm install -g task-master-ai`
- We can't modify its internals
- It doesn't support plugins/hooks natively
- Commands like `parse-prd` and `add-task` run independently

**Our script is standalone:**
- Lives in `.taskmaster/scripts/`
- Can be called manually
- Not integrated into Taskmaster's execution flow

---

## Activation Options

### Option 1: Manual Evaluation (WORKS NOW)

**Status:** ✅ Ready to use  
**Effort:** None  
**Workflow:**

```bash
# 1. Generate tasks normally
task-master parse-prd prd.txt

# 2. Manually run evaluation
node .taskmaster/scripts/critical-task-evaluator.js

# 3. Review report
code .taskmaster/reports/critical-review-*.md
```

**Pros:**
- Works immediately
- Full control over when to evaluate
- No setup needed

**Cons:**
- Not automatic (manual step)
- Easy to forget

---

### Option 2: Wrapper Script (RECOMMENDED)

**Status:** ⏳ Needs implementation  
**Effort:** 15 minutes  
**Workflow:**

Create wrapper scripts that automatically call evaluation:

```bash
# Instead of: task-master parse-prd
# You run: tm-parse-prd (our wrapper)

# Which does:
# 1. Call task-master parse-prd
# 2. Automatically run critical evaluation
# 3. Show report summary
```

**Implementation:**
- Create `tm-parse-prd`, `tm-add-task` wrapper scripts
- Add to PATH or create aliases
- Transparent to user

**Pros:**
- Fully automatic
- Transparent (drop-in replacement)
- No changes to Taskmaster

**Cons:**
- Need wrapper for each command
- Requires PATH/alias setup

---

### Option 3: Claude/Agent Integration

**Status:** ⏳ Needs implementation  
**Effort:** 20 minutes  
**Workflow:**

Train Claude/agents to automatically run evaluation after task generation:

```
User: "Parse the PRD"
Claude: 
  1. Runs task-master parse-prd
  2. Automatically runs critical-task-evaluator.js
  3. Shows summary of changes
  4. Asks for confirmation
```

**Implementation:**
- Update agent rules
- Create workflow templates
- Add to prompts

**Pros:**
- Works with existing commands
- Flexible (can override)
- Natural language control

**Cons:**
- Depends on agent following workflow
- Not enforced technically

---

### Option 4: Git Pre-Commit Hook

**Status:** ⏳ Needs implementation  
**Effort:** 10 minutes  
**Workflow:**

When `tasks.json` is staged, automatically evaluate:

```bash
git add .taskmaster/tasks/tasks.json
# → Triggers evaluation
# → Blocks commit if issues found
# → Or auto-applies refined tasks
```

**Implementation:**
- `.git/hooks/pre-commit` script
- Checks for tasks.json changes
- Runs evaluation

**Pros:**
- Catches all changes
- Enforced by Git
- Works with any workflow

**Cons:**
- Only triggers on commit
- May slow down commits
- Can be bypassed with --no-verify

---

### Option 5: File Watcher

**Status:** ⏳ Needs implementation  
**Effort:** 20 minutes  
**Workflow:**

Background process watches `tasks.json` for changes:

```bash
# Start watcher
npm run watch-tasks

# Any time tasks.json changes:
# → Automatically runs evaluation
# → Updates tasks
# → Generates report
```

**Implementation:**
- Use `chokidar` or `nodemon`
- Watch `.taskmaster/tasks/tasks.json`
- Run evaluation on change

**Pros:**
- Fully automatic
- Real-time
- Works with any tool

**Cons:**
- Background process needed
- Potential race conditions
- More complex setup

---

## Recommendation

### For Your Workflow: **Option 2 (Wrapper Scripts)**

**Why:**
1. **Transparent**: Just use `tm-parse-prd` instead of `task-master parse-prd`
2. **Automatic**: Evaluation happens every time
3. **Simple**: Easy to implement
4. **Reliable**: No background processes, no agent dependencies

**Implementation** (next section)

---

## Quick Implementation: Wrapper Scripts

### 1. Create Wrapper for parse-prd

**File:** `.taskmaster/bin/tm-parse-prd`

```bash
#!/bin/bash
# Wrapper for task-master parse-prd with automatic evaluation

set -e

echo "🎯 Task Master with Critical Evaluation"
echo ""

# 1. Run task-master parse-prd with all arguments
echo "📋 Step 1: Generating tasks..."
task-master parse-prd "$@"

# 2. Check if evaluation is enabled
if ! jq -e '.global.enableCriticalReview == true' .taskmaster/config.json > /dev/null 2>&1; then
  echo "ℹ️  Critical review disabled in config"
  exit 0
fi

# 3. Run critical evaluation
echo ""
echo "🔍 Step 2: Running critical evaluation..."
node .taskmaster/scripts/critical-task-evaluator.js

# 4. Show summary
echo ""
echo "✅ Complete! Check report:"
ls -t .taskmaster/reports/critical-review-*.md | head -1
```

### 2. Create Wrapper for add-task

**File:** `.taskmaster/bin/tm-add-task`

```bash
#!/bin/bash
# Wrapper for task-master add-task with automatic evaluation

set -e

# 1. Run task-master add-task
echo "📋 Adding task..."
task-master add-task "$@"

# 2. Get the newly added task ID (from output or tasks.json)
NEW_TASK_ID=$(jq -r '.[-1].id' .taskmaster/tasks/tasks.json)

# 3. Check if evaluation enabled
if jq -e '.global.enableCriticalReview == true' .taskmaster/config.json > /dev/null 2>&1; then
  echo ""
  echo "🔍 Running critical evaluation on new task..."
  node .taskmaster/scripts/critical-task-evaluator.js
fi

echo "✅ Task $NEW_TASK_ID added and evaluated"
```

### 3. Make Executable

```bash
chmod +x .taskmaster/bin/tm-parse-prd
chmod +x .taskmaster/bin/tm-add-task
```

### 4. Add to PATH (Optional)

**Option A: Add to shell profile**
```bash
# Add to ~/.zshrc or ~/.bashrc
export PATH="$PATH:$PWD/.taskmaster/bin"
```

**Option B: Create global aliases**
```bash
# Add to ~/.zshrc or ~/.bashrc
alias tm-parse-prd="node $PWD/.taskmaster/scripts/wrapper-parse-prd.js"
alias tm-add-task="node $PWD/.taskmaster/scripts/wrapper-add-task.js"
```

**Option C: Use directly**
```bash
# No setup needed, just use:
./.taskmaster/bin/tm-parse-prd prd.txt
./.taskmaster/bin/tm-add-task --prompt="Feature X"
```

---

## Alternative: Agent-Based Activation

Since you're using AI agents heavily, here's a simpler approach:

### Update Agent Rules

Add to agent rules (`.cursor/rules/`, `.roo/rules/`, etc.):

```markdown
## Taskmaster Critical Evaluation

**ALWAYS run critical evaluation after generating tasks:**

### After parse-prd:
```bash
task-master parse-prd prd.txt
node .taskmaster/scripts/critical-task-evaluator.js
```

### After add-task:
```bash
task-master add-task --prompt="..."
node .taskmaster/scripts/critical-task-evaluator.js
```

### Show summary:
```bash
code .taskmaster/reports/critical-review-*.md
```

**This is REQUIRED, not optional.**
```

**Pros:**
- No wrapper scripts needed
- Works with existing commands
- Flexible (agents can decide when to skip)

**Cons:**
- Depends on agent compliance
- Not technically enforced

---

## Current Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Configuration | ✅ Ready | All settings in place |
| Script | ✅ Ready | Fully functional |
| Documentation | ✅ Ready | Complete guides |
| **Automatic Activation** | ❌ Not Active | Needs integration |

---

## Next Steps

### To Activate (Choose One):

1. **Manual (Works Now):**
   - Just run the script after generating tasks
   - No setup needed

2. **Wrapper Scripts (Recommended):**
   - Implement the two wrapper scripts above
   - Takes 5 minutes
   - Fully automatic

3. **Agent Rules (Simplest):**
   - Add rule to always run evaluation
   - No code changes
   - Relies on agent compliance

4. **Git Hooks:**
   - Implement pre-commit evaluation
   - Enforced by Git

5. **File Watcher:**
   - Background process
   - Real-time evaluation

---

## Questions?

**"Why isn't it automatic?"**  
Taskmaster is an external package we can't modify. We need to wrap or trigger our evaluation externally.

**"Which option should I use?"**  
**Wrapper scripts** for reliability, or **agent rules** for simplicity.

**"Does it work now?"**  
Yes, but manually. Run the script after generating tasks.

**"How do I activate it?"**  
Follow one of the options above. Wrapper scripts are recommended.

---

*See [CRITICAL_TASK_EVALUATION.md](./CRITICAL_TASK_EVALUATION.md) for full documentation.*

