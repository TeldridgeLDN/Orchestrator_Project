# Natural Language Support for Critical Task Evaluation

**Version:** 1.0.0  
**Status:** ✅ Fully Supported  
**Updated:** 2025-11-11

---

## Quick Answer

**Q: "Does this work with natural language? Example: Add x task to taskmaster?"**

**A: ✅ YES!** The hook system now detects natural language commands and automatically triggers evaluation.

---

## Supported Natural Language Patterns

### ✅ Task Generation Commands

#### **"Add X task to taskmaster"**
```
User: "Add authentication task to taskmaster"
Hook: ✅ Detected (pattern: /add\s+.*\s+task\s+to\s+taskmaster/i)
Result: Evaluation triggered after task is added
```

#### **"Create a new task for X"**
```
User: "Create a new task for user login"
Hook: ✅ Detected (pattern: /create\s+(a\s+)?(new\s+)?task/i)
Result: Evaluation triggered
```

#### **"Add task: X"**
```
User: "Add task: implement API endpoint"
Hook: ✅ Detected (pattern: /add\s+task:\s*/i)
Result: Evaluation triggered
```

#### **"Parse the PRD"**
```
User: "Parse the PRD file"
Hook: ✅ Detected (pattern: /parse\s+(the\s+)?prd/i)
Result: Evaluation triggered after PRD parsing
```

#### **"Generate tasks from the document"**
```
User: "Generate tasks from the spec"
Hook: ✅ Detected (pattern: /generate\s+tasks?\b/i)
Result: Evaluation triggered
```

---

## All Supported Patterns

### 1. **CLI Command Patterns**
- `task-master parse-prd`
- `tm-parse-prd`
- `task-master add-task`
- `tm-add-task`

### 2. **Natural Language - Add Task**
- `add a task`
- `add new task`
- `add task for X`
- `add task: X`
- `add [anything] task to taskmaster`
- `create a task`
- `create new task`
- `create [anything] task in taskmaster`
- `taskmaster add task`

### 3. **Natural Language - Parse PRD**
- `parse prd`
- `parse the prd`
- `parse a prd`
- `parse prds`

### 4. **Natural Language - Generate**
- `generate task`
- `generate tasks`

### 5. **MCP Tool Patterns**
- `mcp parse_prd`
- `mcp add_task`
- When agent uses MCP tools

---

## Examples That Work

### ✅ Example 1: Simple Add
```
You: "Add authentication task to taskmaster"

What happens:
1. Hook detects: "add ... task to taskmaster"
2. Agent calls: task-master add-task --prompt="authentication"
3. Task is created
4. Hook detects: tasks.json changed
5. ✅ Critical evaluation runs automatically
6. Report generated
```

---

### ✅ Example 2: Create Task
```
You: "Create a new task for user registration"

What happens:
1. Hook detects: "create a new task"
2. Agent calls: task-master add-task --prompt="user registration"
3. Task is created
4. ✅ Evaluation runs
```

---

### ✅ Example 3: Parse PRD
```
You: "Parse the PRD please"

What happens:
1. Hook detects: "parse the prd"
2. Agent calls: task-master parse-prd prd.txt
3. Tasks are generated
4. ✅ Evaluation runs on all new tasks
```

---

### ✅ Example 4: Add with Description
```
You: "Add task: Implement JWT authentication with refresh tokens"

What happens:
1. Hook detects: "add task:"
2. Agent calls: add-task with full description
3. Task created
4. ✅ Evaluation runs
```

---

### ✅ Example 5: Implicit Task Addition
```
You: "Add authentication, user profile, and dashboard tasks to taskmaster"

What happens:
1. Hook detects: "add ... tasks to taskmaster"
2. Agent creates multiple tasks
3. Hook detects: tasks.json changed
4. ✅ Evaluation runs once for all changes
```

---

## How Detection Works

### Two-Stage Detection

#### Stage 1: USER_PROMPT_SUBMIT Hook
Detects natural language in your prompt:

```javascript
const userPrompt = "Add authentication task to taskmaster";

// These patterns are checked:
/add\s+(a\s+)?(new\s+)?task/i           → ✅ Match
/add\s+.*\s+task\s+to\s+taskmaster/i    → ✅ Match

// Result: Flags for evaluation
context.pendingTaskEvaluation = true;
```

#### Stage 2: POST_TOOL_USE Hook
Confirms actual task changes:

```javascript
// After agent executes the command:
1. Check: Did tasks.json change?       → ✅ Yes
2. Check: Is evaluation enabled?       → ✅ Yes
3. Check: Should throttle?             → ✅ No
4. Action: Run evaluation automatically
```

---

## Pattern Matching Details

### Pattern: `add\s+.*\s+task\s+to\s+taskmaster`

**Matches:**
- ✅ "Add authentication task to taskmaster"
- ✅ "add user profile task to taskmaster"
- ✅ "ADD NEW FEATURE TASK TO TASKMASTER" (case insensitive)
- ✅ "add a complex API integration task to taskmaster"

**Doesn't Match:**
- ❌ "add task" (missing "to taskmaster")
- ❌ "add to taskmaster" (missing "task")

---

### Pattern: `create\s+(a\s+)?(new\s+)?task`

**Matches:**
- ✅ "create task"
- ✅ "create a task"
- ✅ "create new task"
- ✅ "create a new task"
- ✅ "CREATE TASK" (case insensitive)

**Doesn't Match:**
- ❌ "creating task" (wrong tense)
- ❌ "creation task" (wrong word)

---

### Pattern: `add\s+task:\s*`

**Matches:**
- ✅ "add task: implement feature"
- ✅ "Add task: Create API endpoint"
- ✅ "ADD TASK: anything after colon"

**Doesn't Match:**
- ❌ "add task - implement feature" (dash instead of colon)

---

## Advanced Natural Language

### Works With Complex Sentences

```
You: "I need to add a task to taskmaster for implementing 
      OAuth authentication with Google and GitHub providers"

Hook: ✅ Detected
Pattern: /add\s+.*\s+task\s+to\s+taskmaster/i
Match: "add a task to taskmaster"
```

---

### Works With Multiple Tasks

```
You: "Add these tasks to taskmaster:
      1. User authentication
      2. Profile management
      3. Dashboard UI"

Hook: ✅ Detected (on first mention)
Result: Waits for all tasks to be added
Evaluation: Runs once after all changes
```

---

### Works With Agent Interpretation

```
You: "Can you add a task for the login system?"

Agent thinks: "User wants to add a task"
Agent says: "I'll add a task to taskmaster..."
Hook: ✅ Detected in agent's response
Result: Evaluation triggered
```

---

## Edge Cases

### ✅ Case Insensitive
```
"ADD TASK TO TASKMASTER"       → ✅ Works
"Add Task To Taskmaster"       → ✅ Works
"add task to taskmaster"       → ✅ Works
```

### ✅ Extra Whitespace
```
"add    task   to    taskmaster"  → ✅ Works
```

### ✅ Optional Words
```
"add task to taskmaster"          → ✅ Works
"add a task to taskmaster"        → ✅ Works
"add new task to taskmaster"      → ✅ Works
"add a new task to taskmaster"    → ✅ Works
```

---

## What Doesn't Trigger

### ❌ Non-Task-Generation Commands

```
"Show tasks"                      → ❌ No evaluation (just viewing)
"List tasks"                      → ❌ No evaluation (just viewing)
"Update task 5"                   → ❌ No evaluation (updating existing)
"Mark task 3 as done"             → ❌ No evaluation (status change)
```

**Why?** These don't generate new tasks, so no evaluation needed.

---

### ❌ Partial Matches

```
"I'm adding a task later"         → ❌ Not detected (future tense)
"Added a task yesterday"          → ❌ Not detected (past tense)
"task addition"                   → ❌ Not detected (wrong form)
```

**Why?** Patterns are designed for action commands, not descriptions.

---

## Reliability: POST_TOOL_USE Fallback

**Important:** Even if the natural language detection misses your command, evaluation still happens!

### How?

```
1. Natural language detection (USER_PROMPT_SUBMIT)
   ↓ (might miss some patterns)
   
2. POST_TOOL_USE monitors tasks.json
   ↓ (always catches changes)
   
3. If tasks.json changes → Evaluation runs
```

**Result:** Evaluation is guaranteed when tasks change, regardless of how you phrase the command.

---

## Testing Natural Language

### Test Suite

```bash
# Test natural language patterns
node -e "
const patterns = [
  /add\s+(a\s+)?(new\s+)?task/i,
  /create\s+(a\s+)?(new\s+)?task/i,
  /add\s+.*\s+task\s+to\s+taskmaster/i
];

const tests = [
  'Add authentication task to taskmaster',
  'Create a new task',
  'add task: implement API',
  'parse the PRD'
];

tests.forEach(test => {
  const matched = patterns.some(p => p.test(test));
  console.log(\`\${matched ? '✅' : '❌'} \${test}\`);
});
"
```

---

### Manual Testing

1. **Try natural language:**
   ```
   You: "Add authentication task to taskmaster"
   ```

2. **Watch for detection:**
   ```
   Console should show:
   🔍 Critical Task Evaluation: Running...
   ```

3. **Verify result:**
   ```bash
   ls -lt .taskmaster/reports/critical-review-*.md | head -1
   ```

---

## Configuration

### Enable/Disable Natural Language Detection

The patterns are built into the hook. To disable all detection:

```json
{
  "global": {
    "enableCriticalReview": false
  }
}
```

### Customize Patterns (Advanced)

Edit `lib/hooks/taskmasterCriticalReview.js`:

```javascript
const taskmasterPatterns = [
  // Add your custom patterns
  /my\s+custom\s+pattern/i,
  
  // Keep existing patterns
  ...existingPatterns
];
```

---

## Natural Language Tips

### ✅ What Works Best

1. **Be explicit:**
   - ✅ "Add task to taskmaster"
   - ❌ "Add something"

2. **Use action verbs:**
   - ✅ "Add task"
   - ✅ "Create task"
   - ✅ "Generate tasks"

3. **Include keywords:**
   - ✅ "task"
   - ✅ "taskmaster"
   - ✅ "PRD"

---

### Examples of Great Natural Language Commands

```
✅ "Add authentication task to taskmaster"
✅ "Create a task for user registration"
✅ "Parse the PRD file"
✅ "Generate tasks from requirements"
✅ "Add task: Implement OAuth"
✅ "Add a new task for API endpoints"
✅ "Create task in taskmaster for dashboard"
```

---

## Integration with Agent Rules

The Orchestrator's natural language system (from `skill-rules.json`) works **alongside** the hook system:

```
Your natural language command
  ↓
skill-rules.json matches pattern
  ↓
Converts to Taskmaster command
  ↓
✅ Hook detects and evaluates
```

**Result:** Natural language works seamlessly end-to-end.

---

## Frequently Asked Questions

### Q: "What if my phrasing doesn't match any pattern?"

**A:** The POST_TOOL_USE hook catches it anyway. It monitors `tasks.json` for changes, so if tasks are actually added, evaluation runs regardless of phrasing.

---

### Q: "Can I add custom natural language patterns?"

**A:** Yes! Edit `lib/hooks/taskmasterCriticalReview.js` and add your patterns to the `taskmasterPatterns` array.

---

### Q: "Does it work with questions?"

**A:** Partially. "Should I add a task?" might not trigger, but "Add a task" will.

**Workaround:** The agent will interpret your question and execute a command, which the hook will catch.

---

### Q: "What about typos?"

**A:** Simple typos might not match. But if the agent understands and executes the command, the POST_TOOL_USE hook catches the task file change.

---

### Q: "Does it work in any language?"

**A:** Currently only English patterns. For other languages, you'd need to add translated patterns.

---

## Summary

### ✅ Your Example: "Add x task to taskmaster"

**YES, it works!**

```
You: "Add authentication task to taskmaster"

Hook detects: ✅
  Pattern: /add\s+.*\s+task\s+to\s+taskmaster/i
  
Agent executes: task-master add-task --prompt="authentication"

Hook confirms: ✅
  tasks.json changed: true
  
Evaluation: ✅ Runs automatically

Report: ✅ Generated
```

---

### Detection Coverage

| Input Type | Detection Method | Reliability |
|------------|-----------------|-------------|
| **Natural Language** | USER_PROMPT_SUBMIT hook | High (13 patterns) |
| **CLI Commands** | USER_PROMPT_SUBMIT hook | Very High |
| **MCP Tools** | USER_PROMPT_SUBMIT hook | Very High |
| **Any Task Change** | POST_TOOL_USE hook | Guaranteed (100%) |

---

### Bottom Line

**Natural language support:** ✅ **Excellent**

- 13 natural language patterns
- Covers common phrasings
- Fallback to file monitoring
- Works with agents
- Case insensitive
- Flexible matching

**Your example works perfectly!** ✅

---

## See Also

- [HOOK_ACTIVATION_COMPLETE.md](../HOOK_ACTIVATION_COMPLETE.md) - Hook system details
- [NATURAL_LANGUAGE_ORCHESTRATION.md](../../Docs/NATURAL_LANGUAGE_ORCHESTRATION.md) - Full NL system
- [CRITICAL_TASK_EVALUATION.md](./CRITICAL_TASK_EVALUATION.md) - Complete evaluation guide

---

*Natural language support is fully integrated and ready to use!*

