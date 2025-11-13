# Taskmaster Hook Integration Guide

**Related Documentation:**
- [USER_SCENARIO_EXAMPLE.md](./USER_SCENARIO_EXAMPLE.md) - **START HERE** - Real-world user scenario showing this in action
- [PAI_HISTORY_DECISION_ANALYSIS.md](./PAI_HISTORY_DECISION_ANALYSIS.md) - Validates this implementation against the official decision framework
- [Agentic_Feature_Selection_Workflow.md](../../Docs/Agentic_Feature_Selection_Workflow.md) - Official decision framework
- [WORKFLOW_CREATION_GUIDE.md](../../Docs/WORKFLOW_CREATION_GUIDE.md) - Implementation patterns

---

## The Problem We Solved

**Initial Implementation Issue:**
- Created `context-monitor.js` and `pai-history-logger.js` hooks
- Documented them as "automatically executed"
- **BUT**: Taskmaster has NO built-in hook execution system! ❌

**Why It Was Missed:**
- Confusion between different hook systems:
  - **Kiro hooks** (`.kiro/hooks/`) - Kiro's hook system
  - **Claude Code hooks** (`.claude/hooks/`) - Cursor/Claude Code hook system
  - **Diet103 hooks** - Project-level hooks
  - **Taskmaster hooks** (`.taskmaster/hooks/`) - NOT automatic!

Taskmaster is a **task management system**, not a hook orchestration platform. It doesn't watch for events or execute hooks automatically.

---

## The Solution: Claude Code Hook Bridge

We created a **Claude Code hook** that bridges Taskmaster functionality with PAI's tracking system.

### File: `.claude/hooks/taskmaster-session-tracker.js`

**Purpose**: Claude Code `UserPromptSubmit` hook that:
1. Detects task completion mentions in user prompts
2. Logs completions to PAI `history.jsonl`
3. Monitors context window usage
4. Provides helpful reminders

**Hook Type**: `UserPromptSubmit` (runs before Claude processes each prompt)

**Configured In**: `.claude/settings.json`
```json
{
  "hooks": {
    "UserPromptSubmit": [
      ".claude/hooks/taskmaster-session-tracker.js"
    ]
  }
}
```

---

## How It Works Now

### 1. Task Completion Detection

When you say things like:
- "task 65 is complete"
- "mark task 62.3 as done"
- "completed task 64"
- "all subtasks done"

The hook:
1. Detects the completion mention
2. Logs to `~/.claude/history.jsonl` with metadata
3. Prints confirmation: `✓ Logged to PAI history`

### 2. Context Window Monitoring

On every prompt:
- Reads `.context-state.json`
- Checks token usage percentage
- Warns at 85%: `⚠️ Context at 85%`
- Alerts at 95%: `🚨 CRITICAL: Context at 95%`

### 3. Taskmaster Command Detection

Reminds you to use MCP tools instead of CLI:
```
💡 Tip: Use MCP tools (mcp_task-master-ai_*) for better performance
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Claude Code (Cursor)                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  UserPromptSubmit Hook                              │  │
│  │  .claude/hooks/taskmaster-session-tracker.js       │  │
│  │                                                     │  │
│  │  1. Detect task completion                         │  │
│  │  2. Monitor context usage                          │  │
│  │  3. Provide helpful tips                           │  │
│  └─────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Taskmaster Hook Modules                           │  │
│  │  .taskmaster/hooks/                                │  │
│  │                                                     │  │
│  │  • pai-history-logger.js (functions)               │  │
│  │  • context-monitor.js (functions)                  │  │
│  │  • update-context-state.sh (state updates)         │  │
│  └─────────────────────────────────────────────────────┘  │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  PAI Infrastructure     │
              │  ~/.claude/             │
              │                         │
              │  • history.jsonl        │
              │  • context/             │
              │  • projects/            │
              └─────────────────────────┘
```

---

## Files & Their Roles

### Automatically Executed (via Claude Code)

**`.claude/hooks/taskmaster-session-tracker.js`**
- **Runs**: Before every user prompt
- **Does**: Detection, logging, monitoring
- **Configured**: In `.claude/settings.json`

### Utility Functions (called by above)

**`.taskmaster/hooks/pai-history-logger.js`**
- **Exports**: `logTaskCompletion()`, `logSessionMilestone()`, `logContextTransition()`
- **Does**: Writes to `~/.claude/history.jsonl`
- **Called by**: `taskmaster-session-tracker.js`

**`.taskmaster/hooks/context-monitor.js`**
- **Exports**: `checkContextWindow()`, `generateContextHandoff()`
- **Does**: Creates handoff documents, monitors usage
- **Called by**: `taskmaster-session-tracker.js` (when needed)

**`.taskmaster/hooks/update-context-state.sh`**
- **Runs**: Manually or via automation
- **Does**: Updates `.context-state.json` with current token usage
- **Usage**: `./update-context-state.sh <tokens_used> <max_tokens>`

### State Files

**`.context-state.json`** (gitignored)
```json
{
  "tokensUsed": 142000,
  "maxTokens": 1000000,
  "lastChecked": "2025-11-09T21:00:00Z",
  "percentage": 0.142
}
```

**`~/.claude/history.jsonl`** (PAI's global history)
```jsonl
{"display":"Task 65 completed","timestamp":1762722075328,"project":"/Users/.../Orchestrator_Project","metadata":{"type":"taskmaster:task-completion","taskId":65}}
{"display":"Context transition","timestamp":1762722186289,"metadata":{"type":"taskmaster:context-transition"}}
```

---

## Testing

### Test Hook Execution
```bash
# Simulate task completion
USER_PROMPT="task 65 is complete" node .claude/hooks/taskmaster-session-tracker.js

# Check if logged
tail -1 ~/.claude/history.jsonl | jq '.'
```

### Test Context Monitoring
```bash
# Update context state to 90%
.taskmaster/hooks/update-context-state.sh 900000 1000000

# Trigger hook
USER_PROMPT="anything" node .claude/hooks/taskmaster-session-tracker.js
# Should show: ⚠️ Context at 90%
```

### Test in Real Usage
Just use Claude Code normally:
- Say "task 65 is complete"
- Say "mark task 62.3 as done"
- The hook runs automatically on every prompt

---

## Updating Token State

The hook reads `.context-state.json` but doesn't update it (read-only).

To update token usage, run:
```bash
.taskmaster/hooks/update-context-state.sh <current_tokens> 1000000
```

**Automation Options:**

1. **Manual** (current): Run the script when context % is shown
2. **Periodic**: Add to cron/launchd to check periodically
3. **Integration**: Modify Cursor to export token usage to file
4. **Prompt-based**: Agent parses "Token usage: X/Y" from system messages

---

## Why This Approach?

### ✅ Pros
1. **Works immediately** - No Taskmaster modifications needed
2. **Integrates with PAI** - Uses existing `history.jsonl` pattern
3. **Automatic** - Runs on every prompt via Claude Code
4. **Lightweight** - Minimal overhead, fails gracefully
5. **Standard pattern** - Follows Claude Code hook conventions

### ❌ Cons
1. **Requires Claude Code** - Won't work in other environments
2. **Detection-based** - Relies on text pattern matching
3. **Token state external** - Requires manual or scripted updates

### Alternative Approaches We Didn't Use

1. **Taskmaster MCP Server Extension**: Would require modifying task-master-ai npm package
2. **File Watcher**: Would need always-running daemon process
3. **Git Hooks**: Would only trigger on commits, not task completions
4. **Cron Jobs**: Too slow, not real-time

---

## Troubleshooting

### Hook Not Running

**Check hook is registered:**
```bash
grep -A 5 '"hooks"' .claude/settings.json
```

Should show:
```json
"hooks": {
  "UserPromptSubmit": [
    ".claude/hooks/taskmaster-session-tracker.js"
  ]
}
```

**Check hook is executable:**
```bash
ls -la .claude/hooks/taskmaster-session-tracker.js
# Should show: -rwxr-xr-x
```

**Test directly:**
```bash
USER_PROMPT="task 1 done" node .claude/hooks/taskmaster-session-tracker.js
```

### Not Logging to PAI History

**Check PAI home exists:**
```bash
ls -la ~/.claude/history.jsonl
```

**Check imports work:**
```bash
node -e "import('.taskmaster/hooks/pai-history-logger.js').then(m => console.log('OK'))"
```

### Context Warnings Not Showing

**Check state file:**
```bash
cat .context-state.json
```

**Update state manually:**
```bash
.taskmaster/hooks/update-context-state.sh 950000 1000000
# Should show: ⚠️ WARNING
```

---

## Future Enhancements

### Possible Improvements

1. **Automatic Token Tracking**: Hook into Cursor's token counter
2. **Task Status Sync**: Automatically call `task-master set-status` on detection
3. **Richer Context**: Include file changes, test results in history
4. **Multi-project Support**: Track which project is being discussed
5. **Analytics Dashboard**: Visualize task completion patterns over time

### Contributing

To add new detection patterns:
1. Edit `.claude/hooks/taskmaster-session-tracker.js`
2. Add pattern to relevant array
3. Test with `USER_PROMPT="..." node <hook>`
4. Update this documentation

---

## Summary

✅ **Now Working:**
- Task completions automatically logged to PAI history
- Context usage monitored on every prompt
- Helpful tips provided in real-time
- Full integration with Claude Code hook system

✅ **PAI Compatible:**
- Follows `history.jsonl` format from [official PAI repo](https://github.com/danielmiessler/Personal_AI_Infrastructure)
- Uses UFC (Unified Filesystem Context) pattern
- Maintains consistency with PAI v1.2.0 architecture

✅ **Production Ready:**
- Fails gracefully on errors
- Minimal performance impact
- Easy to disable (remove from `settings.json`)
- Well-documented and testable

---

*Created: 2025-11-09*  
*Last Updated: 2025-11-09*

