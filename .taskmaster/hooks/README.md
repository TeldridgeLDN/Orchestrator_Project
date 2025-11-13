# Taskmaster Hooks

This directory contains automated hooks that are triggered at various points during task execution.

## Available Hooks

### context-monitor.js

**Purpose**: Automatically monitors token usage and triggers graceful context window transitions.

**Trigger**: After each TODO completion

**Behavior**:
- **85% threshold**: Warning message
- **95% threshold**: Creates handoff document and recommends transition

**Handoff Process**:
1. Generates comprehensive handoff document
2. Logs transition to PAI history.jsonl
3. Provides clear continuation instructions

### pai-history-logger.js

**Purpose**: Integrates Taskmaster with PAI's history.jsonl tracking system.

This follows the **Unified Filesystem Context (UFC)** pattern from [PAI v1.2.0](https://github.com/danielmiessler/Personal_AI_Infrastructure), maintaining consistency with PAI's global tracking architecture.

**Trigger**: After each TODO completion

**Behavior**:
- **85% threshold**: Warning message
- **95% threshold**: Creates handoff document and recommends transition

**Handoff Process**:
1. Generates comprehensive handoff document with:
   - Recently completed tasks
   - Active task progress
   - Next steps
   - Key decisions and implementation notes
   - Modified files list
2. Saves to `.taskmaster/docs/CONTEXT_HANDOFF_YYYY-MM-DD.md`
3. Provides clear instructions for continuing in new window

## Hook Configuration

Hooks are automatically executed by Taskmaster when certain events occur. To disable a hook:

```bash
# Rename the hook file
mv context-monitor.js context-monitor.js.disabled
```

## Creating Custom Hooks

Hooks should export a `run` function that accepts a context object:

```javascript
export async function run(context) {
  // Hook logic here
  return {
    success: true,
    message: 'Hook completed'
  };
}
```

## Hook Context Object

The context object passed to hooks contains:

```javascript
{
  event: 'todo-completed',  // Event that triggered the hook
  task: { ... },             // Current task information
  project: { ... },          // Project metadata
  timestamp: '2025-11-09...' // Event timestamp
}
```

## Testing Hooks

Test a hook directly:

```bash
node .taskmaster/hooks/context-monitor.js
```

## Hook Execution Order

1. Pre-execution hooks (if any)
2. Main operation (e.g., task completion)
3. Post-execution hooks
4. Context monitor (automatic)

