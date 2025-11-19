# Critical Task Evaluation - Debug Report

**Date:** 2025-11-11  
**Issue:** Dashboard tasks (98-103) were generated without running the "god-like programmer" critical evaluation

---

## A) Fixed Issues in the Evaluator Script

### Issue 1: Placeholder Anthropic API Call ❌→✅ FIXED
**Problem:** The `callAnthropicAPI` function was just returning placeholder text instead of actually calling the API.

**Fix Applied:**
```javascript
// Before: Returned "PLACEHOLDER: Critic model response would appear here..."
// After: Actual fetch() call to Anthropic API with proper headers and error handling
```

**Status:** ✅ Fixed (lines 173-209)

---

### Issue 2: Tagged Tasks.json Support ❌→✅ FIXED
**Problem:** Script was trying to load tasks as a direct array, but TaskMaster now uses tagged structure:
```json
{
  "master": { "tasks": [...] },
  "diet103-validation": { "tasks": [...] }
}
```

**Fix Applied:**
- Detects tagged vs legacy format
- Reads current tag from `.taskmaster/state.json`
- Loads tasks from correct tag (defaults to "master")
- Properly reports task count with tag name

**Status:** ✅ Fixed (lines 343-364)

---

### Issue 3: Invalid API Key ⚠️ PENDING
**Problem:** When manually running the script:
```
❌ Error: Anthropic API error (401): authentication_error
```

**Current State:**
- `ANTHROPIC_API_KEY` is set in environment (starts with `sk-ant-api...`)
- Key appears to be invalid or expired
- MCP might have access to a different key in `.cursor/mcp.json`

**Required Action:**
1. Check `.cursor/mcp.json` for the correct API key
2. Or run the script with correct environment: `ANTHROPIC_API_KEY=<valid-key> node .taskmaster/scripts/critical-task-evaluator.js`

---

## B) Hook System Investigation

### Hook Registration Status: ✅ ACTIVE

**Confirmed Active Hooks:**
```javascript
// lib/hooks/index.js lines 188-199

// USER_PROMPT_SUBMIT Hook (Priority: 35)
hookManager.register(
  HookTypes.USER_PROMPT_SUBMIT,
  userPromptReviewHook,
  { priority: 35, name: 'taskmasterCriticalReview' }
);

// POST_TOOL_USE Hook (Priority: 60)
hookManager.register(
  HookTypes.POST_TOOL_USE,
  postToolUseReviewHook,
  { priority: 60, name: 'taskmasterCriticalReviewMonitor' }
);
```

**Hook Initialization:**
- `initializeHooks()` is called on module load (line 244)
- `registerBuiltInHooks()` includes taskmaster hooks
- **Hooks ARE registered and active**

---

### Why Didn't the Hook Run During `parse_prd`?

**Possible Reasons:**

#### 1. MCP Tools Don't Trigger Orchestrator Hooks ❓
**Evidence:**
- I used `mcp_taskmaster-ai_parse_prd` tool
- This calls TaskMaster directly via MCP server
- MCP server is external to Orchestrator process
- Orchestrator hooks only run in Orchestrator's Node.js process

**Implication:** MCP tool calls bypass the Orchestrator hook system entirely.

#### 2. Hook Conditions Not Met ❓
**Required Conditions for `postToolUseReviewHook`:**
- `CONFIG.enabled = true` ✅ (hardcoded in hook)
- `enableCriticalReview = true` in config ✅ (verified)
- Not throttled (5 second cooldown) ✅ (first run)
- `tasks.json` actually changed ✅ (tasks 98-103 were added)

**Required Conditions for `userPromptReviewHook`:**
- Detects patterns like `/task-master\s+parse-prd/i`
- User prompt was: "Lets parse this into tasksmaster"
- Pattern might not have matched ❓

#### 3. Hook Execution Context Missing ❓
**POST_TOOL_USE Hook Requirements:**
- Expects `context.projectRoot` or falls back to `process.cwd()`
- If called from MCP context, `projectRoot` might not be set

---

### Detection Patterns in Hook

The hook tries to detect taskmaster commands from user prompts:

```javascript
const taskmasterPatterns = [
  /task-master\s+parse-prd/i,       // "task-master parse-prd"
  /tm-parse-prd/i,                  // "tm-parse-prd"
  /parse\s+(the\s+)?prd/i,          // "parse the prd", "parse prd"
  /add\s+(a\s+)?(new\s+)?task/i,    // "add a task", "add task"
  /mcp.*parse_prd/i,                // "mcp parse_prd"
  // ... more patterns
];
```

**My Prompt:** "Lets parse this into tasksmaster"
- Matches `/parse/i` ✅
- But full pattern is `/parse\s+(the\s+)?prd/i` ❌
- "parse this into tasksmaster" doesn't include "prd"

**Conclusion:** Hook pattern might not have matched my natural language request.

---

## Root Cause Analysis

### Most Likely Reason: MCP Tools Bypass Orchestrator Hooks

**Evidence:**
1. MCP tools run in separate TaskMaster process
2. Orchestrator hooks only run in Orchestrator's Node.js process
3. When I use `mcp_taskmaster-ai_parse_prd`, it goes:
   ```
   Cursor → MCP Server → TaskMaster CLI → Parse PRD
   ```
   NOT:
   ```
   Cursor → Orchestrator → Hooks → TaskMaster CLI
   ```

4. The hook documentation says it activates "when Orchestrator starts"
5. But MCP tools don't go through Orchestrator

---

## What Should Have Happened

According to the workflow documentation and critical evaluation system:

### Correct Task Generation Flow:

```
1. Parse PRD
   ↓
2. **RUN CRITICAL EVALUATION** ← MISSED THIS!
   ↓
3. Analyze Complexity
   ↓
4. Expand Tasks
   ↓
5. Review & Refine
```

### What I Actually Did:

```
1. Parse PRD ✅
   ↓
2. ❌ SKIPPED Critical Evaluation
   ↓
3. Analyze Complexity ✅
   ↓
4. Expand Tasks ✅
   ↓
5. Review & Refine ⏳
```

---

## Impact of Missing Critical Evaluation

### What the Critic Would Have Done:

1. **CANCEL** tasks violating principles:
   - Over-engineering
   - YAGNI violations
   - Premature optimization
   - Hypothetical requirements

2. **SIMPLIFY** complex tasks:
   - Reduce external dependencies
   - Remove unnecessary frameworks
   - Replace services with files
   - Reduce LOC estimates

3. **MERGE** redundant tasks:
   - Combine similar functionality
   - Eliminate duplication

4. **Provide Rationale:**
   - Which criteria violated (Complexity, Value, Philosophy, YAGNI, Risk, Token Efficiency)
   - Estimated LOC reduction
   - Maintenance burden assessment

### What We Might Have Missed:

Looking at the 6 dashboard tasks (98-103):

**Potential Issues the Critic Might Flag:**

1. **Task 98:** Design Static HTML Dashboard Prototype
   - YAGNI: Do we need Figma mockups before prototyping?
   - Could go straight to React prototype

2. **Task 99:** Implement Orchestrator Data Loader
   - Complexity: Caching might be premature optimization
   - Could start simpler without caching

3. **Task 101:** Implement Real-Time Updates via File Watchers
   - Complexity: Chokidar + debouncing + React integration
   - Philosophy: Is real-time necessary for MVP?
   - Could start with manual refresh

4. **Task 102:** Develop Modular React UI Components
   - Complexity: 6 panels at once
   - YAGNI: Do we need all 6 panels initially?
   - Could build 2-3 core panels first

5. **Task 103:** Implement Structured Hook Logging
   - YAGNI: Are hooks being logged to files yet?
   - Risk: Requires hook system changes
   - Could defer until hooks are more mature

**Estimated Impact:**
- Tasks: 6 → Possibly 3-4 (33% reduction)
- Complexity: Reduced by removing real-time updates, full caching, all 6 panels
- Focus: MVP dashboard with core functionality first

---

## Recommended Actions

### Immediate (Right Now):

1. **Fix API Key Issue:**
   ```bash
   # Check MCP config for valid key
   cat .cursor/mcp.json | jq '.mcpServers.taskmaster.env.ANTHROPIC_API_KEY'
   
   # Or set from MCP config:
   export ANTHROPIC_API_KEY="$(cat .cursor/mcp.json | jq -r '.mcpServers["task-master-ai"].env.ANTHROPIC_API_KEY')"
   ```

2. **Run Critical Evaluation Manually:**
   ```bash
   node .taskmaster/scripts/critical-task-evaluator.js
   ```

3. **Review the Report:**
   ```bash
   code .taskmaster/reports/critical-review-*.md
   ```

4. **Apply Recommended Changes:**
   - Cancel over-engineered tasks
   - Simplify complex tasks
   - Update PRD if needed

---

### Process Fix (For Future):

#### Option A: Always Run Manually After MCP parse_prd
```bash
# After: mcp_taskmaster-ai_parse_prd
# Run: node .taskmaster/scripts/critical-task-evaluator.js
```

#### Option B: Use CLI Wrapper Instead of MCP
```bash
# Instead of MCP tool, use:
tm-parse-prd prd.txt  # Wrapper that includes evaluation
```

#### Option C: Add to TaskMaster Integration Workflow
Update `.cursor/rules/taskmaster/dev_workflow.mdc` to explicitly state:

```markdown
### After Parsing PRD (Step 4):
**CRITICAL:** Run the god-like programmer evaluation:
```bash
node .taskmaster/scripts/critical-task-evaluator.js
```
Review the report before proceeding to complexity analysis.
```

#### Option D: MCP Tool Enhancement
Add the critical evaluation to the `parse_prd` MCP tool itself so it:
1. Parses PRD
2. Automatically runs critical evaluation
3. Returns refined tasks

---

## Current Status

### Script Fixes: ✅ COMPLETE
- Anthropic API integration: ✅ Implemented
- Tagged tasks.json support: ✅ Implemented
- API key: ⚠️ Needs valid key from user

### Evaluation Status: ⏳ PENDING
- Dashboard tasks (98-103): Not yet critically evaluated
- Waiting for: Valid API key to run evaluation

### Next Steps:
1. Get valid `ANTHROPIC_API_KEY`
2. Run `node .taskmaster/scripts/critical-task-evaluator.js`
3. Review report in `.taskmaster/reports/`
4. Apply recommended changes to tasks 98-103
5. Update workflow/rules to prevent future misses

---

## Lessons Learned

1. **MCP tools bypass Orchestrator hooks** - They run in separate processes
2. **Critical evaluation is not automatic for MCP users** - Must be run manually
3. **Workflow documentation needs update** - Should explicitly mention running evaluator after MCP parse_prd
4. **Script was incomplete** - Had placeholder API calls that needed implementation
5. **Tagged tasks.json support was missing** - Script assumed legacy format

---

**Bottom Line:** The critical evaluation system exists and is configured, but it didn't run because:
1. MCP tools bypass Orchestrator hooks
2. Script had implementation bugs (now fixed)
3. Workflow documentation didn't explicitly require manual run for MCP users

**Solution:** Run the evaluation manually now, apply recommendations, and update workflow for future.

---

*Report Generated: 2025-11-11*  
*Status: Script Fixed, Awaiting Valid API Key to Run Evaluation*

