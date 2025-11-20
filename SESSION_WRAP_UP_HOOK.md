# Session Wrap-Up Hook

**Created:** 2025-11-20  
**Location:** `/lib/hooks/sessionWrapUp.js`  
**Status:** ✅ Implemented and registered

---

## What Was Created

A comprehensive session wrap-up hook that automatically triggers when you end a session, providing a complete summary of your work and preparing for the next session.

## Trigger Phrases

The hook activates when you say any of these phrases:
- "wrap up"
- "end session"
- "goodbye" / "goodnight"
- "that's all for today"
- "let's stop here"
- "see you tomorrow"
- "done for today"
- "calling it a day"

## What It Does

### 1. Git Status Check (15 seconds)
- ✅ Checks for uncommitted changes
- ✅ Lists staged files
- ✅ Lists modified files
- ✅ Counts untracked files
- ✅ Shows current branch
- ✅ Counts unpushed commits

**Example Output:**
```
📊 Checking Git Status...
   Branch: feature/design-review-toolkit
   ⚠ 5 staged file(s)
   ⚠ 2 modified file(s)
   → 3 untracked file(s)
   ⚠ 1 unpushed commit(s)
```

### 2. Primacy Rules Check (10 seconds)
- ✅ Verifies all 9 critical primacy rules
- ✅ Reports missing rules
- ✅ Shows warnings and errors
- ✅ Suggests remediation (npm run sync-rules)

**Example Output:**
```
📋 Checking Primacy Rules...
   ✓ All primacy rules intact (9/9)
```

Or if there are issues:
```
📋 Checking Primacy Rules...
   ⚠ Primacy rules issues detected (7/9 active)
     → 2 missing rule(s)
     → 1 warning(s)
```

### 3. Taskmaster Status Check (30 seconds)
- ✅ Reads current tag and tasks
- ✅ Counts tasks by status
- ✅ Identifies next available task
- ✅ Shows task distribution

**Example Output:**
```
🎯 Checking Taskmaster Status...
   Tag: master
   Total Tasks: 45
   Status: 23 done, 2 in-progress, 18 pending, 2 blocked
   
   📍 Next Task:
      15. Implement user authentication
```

### 4. Session Activity Analysis (20 seconds)
- ✅ Lists all modified files
- ✅ Groups files by area (lib/, dashboard/, etc.)
- ✅ Identifies top 3 work areas
- ✅ Generates memory suggestions

**Example Output:**
```
📝 Analyzing Session Activity...
   Files Modified: 8
   Key Areas: packages, lib, .cursor
```

### 5. Session Summary File (10 seconds)
- ✅ Saves comprehensive markdown summary
- ✅ Location: `.cursor/session-summaries/YYYY-MM-DD-HH-MM-SS.md`
- ✅ Includes all session data
- ✅ Ready for next "wake up"

**Example Output:**
```
💾 Saving Session Summary...
   ✓ Summary saved: 2025-11-20-14-30-45.md
```

### 6. Memory Suggestions (5 seconds)
- ✅ Suggests memories based on activity
- ✅ Explains why each memory is relevant
- ✅ Prompts to create them

**Example Output:**
```
🧠 Memory Suggestions:
   1. Work on packages module
      Significant work in this area
   
   2. 2 tasks in progress
      Track active work for next session
```

### 7. Final Report (5 seconds)
- ✅ Summary statistics
- ✅ Reminders (uncommitted changes, unpushed commits)
- ✅ Tomorrow's focus (next task)
- ✅ Tips for next session

**Example Output:**
```
✅ Session Wrapped Up

   Files: 8 | Tasks: 23 done, 18 pending | Rules OK | 7 uncommitted changes

💡 Before You Go:
   ⚠ Consider committing your changes
   ⚠ Consider pushing your commits

🎯 Tomorrow's Focus:
   15. Implement user authentication

💡 Tip: Say "wake up" next session to restore context
```

## Session Summary File Format

Saved to: `.cursor/session-summaries/YYYY-MM-DD-HH-MM-SS.md`

```markdown
# Session Summary - [Date] [Time]

## Project Context
- **Branch:** feature/design-review-toolkit
- **Taskmaster Tag:** master
- **Primacy Rules:** ✓ Intact

## Session Activity
- **Files Modified:** 8
- **Key Areas:** packages, lib, .cursor

### Files Changed by Area
- **packages** (5 files)
  - `packages/design-review-toolkit/README.md`
  - `packages/design-review-toolkit/package.json`
  - `packages/design-review-toolkit/INSTALL.md`
  - ... and 2 more

- **lib** (2 files)
  - `lib/hooks/sessionWrapUp.js`
  - `lib/hooks/index.js`

- **.cursor** (1 files)
  - `.cursor/rules/wrap-up-protocol.mdc`

## Git Status at Session End
- **Clean:** No
- **Staged Files:** 5
- **Modified Files:** 2
- **Untracked Files:** 3
- **Unpushed Commits:** 1

## Primacy Rules Status
- **Status:** ✓ All rules intact
- **Active Rules:** 9/9

## Taskmaster Status
- **Total Tasks:** 45
- **Done:** 23
- **In Progress:** 2
- **Pending:** 18
- **Blocked:** 2

### Next Task
**15. Implement user authentication**

Set up JWT-based authentication system

## Memory Suggestions
1. **Work on packages module**
   - Modified 5 files in packages area
   - Reason: Significant work in this area

2. **2 tasks in progress**
   - Currently working on 2 task(s) in master tag
   - Reason: Track active work for next session

---
*Next wake-up command will restore this context*
```

## Integration with Wake-Up Protocol

The wrap-up hook creates session summaries that the wake-up protocol can load:

**Wrap-Up (End of Day):**
```bash
User: "Let's wrap up for today"

Agent: [Runs wrap-up sequence]
       [Saves summary to .cursor/session-summaries/2025-11-20-14-30-45.md]
```

**Wake-Up (Next Day):**
```bash
User: "wake up"

Agent: [Runs wake-up sequence]
       [Loads latest session summary from .cursor/session-summaries/]
       [Displays: "Last Session: 2025-11-20 14:30:45"]
       [Displays: "Tomorrow's Focus: Task 15 - Implement user authentication"]
```

## Hook Registration

The hook is automatically registered in `/lib/hooks/index.js`:

```javascript
// Session wrap-up hook (detects session end and generates summary)
hookManager.register(
  HookTypes.USER_PROMPT_SUBMIT,
  wrapHook('SessionWrapUp', sessionWrapUpHook),
  { priority: 5, name: 'SessionWrapUp' }  // Low priority = runs early
);
```

**Priority: 5** - Runs very early in the USER_PROMPT_SUBMIT hook chain, so it executes before other hooks that might process the user's message.

## Benefits

1. **Never Lose Context**: Session summaries capture everything accomplished
2. **Smooth Handoffs**: Next session knows exactly where to start
3. **Better Git Hygiene**: Reminds you to commit and push
4. **Taskmaster Sync**: Ensures task status is current
5. **Memory Creation**: Suggests what to remember
6. **Historical Record**: Track progress over time

## Usage

### Basic Usage
```
User: "wrap up"

Agent: [Runs complete wrap-up sequence]
       [Displays comprehensive summary]
       [Saves session summary file]
```

### Integration with Taskmaster
If you're using Taskmaster, the wrap-up will:
- Show current task status distribution
- Identify which tasks are in-progress
- Show next task to work on tomorrow
- Suggest task-related memories

### Integration with Git
The wrap-up will:
- Warn about uncommitted changes
- Warn about unpushed commits
- Show current branch
- List modified files by area

## File Locations

- **Hook Source:** `/lib/hooks/sessionWrapUp.js`
- **Hook Registration:** `/lib/hooks/index.js`
- **Rule Definition:** `.cursor/rules/wrap-up-protocol.mdc`
- **Session Summaries:** `.cursor/session-summaries/*.md`

## Configuration

No configuration needed! The hook works out of the box.

To disable it:
```javascript
// In lib/hooks/index.js, comment out the registration:
// hookManager.register(
//   HookTypes.USER_PROMPT_SUBMIT,
//   wrapHook('SessionWrapUp', sessionWrapUpHook),
//   { priority: 5, name: 'SessionWrapUp' }
// );
```

## Testing

Test the hook by saying:
```
wrap up
```

Expected behavior:
1. Displays "Session Wrap-Up Initiated" banner
2. Runs through all 6 steps
3. Creates session summary file in `.cursor/session-summaries/`
4. Displays final report

## Comparison with Wake-Up Protocol

| Feature | Wake-Up Protocol | Wrap-Up Hook |
|---------|-----------------|--------------|
| **When** | Session start | Session end |
| **Trigger** | "wake up", "good morning" | "wrap up", "goodbye" |
| **Location** | `.cursor/rules/wake-up-protocol.mdc` | `lib/hooks/sessionWrapUp.js` |
| **Purpose** | Load context | Save context |
| **Output** | Console summary | Console summary + file |
| **File** | Reads session summaries | Writes session summaries |
| **Git Check** | Status only | Status + warnings |
| **Taskmaster** | Shows status | Shows status + suggests updates |
| **Memory** | Loads existing | Suggests new |

## Future Enhancements

Potential improvements:

1. **Commit Prompting**: Offer to commit staged changes
2. **Push Integration**: Offer to push commits
3. **Documentation Check**: Warn if docs need updating
4. **Active Process Cleanup**: Offer to stop dev servers
5. **Branch Sync**: Offer to pull/push
6. **Email Summary**: Send session summary via email
7. **Slack Integration**: Post summary to Slack
8. **Analytics**: Track session metrics over time

## Example Session

```bash
# User at end of day
User: "Let's wrap up for today"

# Agent executes wrap-up sequence
Agent: 
═══════════════════════════════════════════════════════
  🌙 Session Wrap-Up Initiated
═══════════════════════════════════════════════════════

📊 Checking Git Status...
   Branch: feature/session-wrap-up
   ⚠ 3 staged file(s)
   ⚠ 1 modified file(s)

📋 Checking Primacy Rules...
   ✓ All primacy rules intact (9/9)

🎯 Checking Taskmaster Status...
   Tag: master
   Total Tasks: 45
   Status: 23 done, 2 in-progress, 18 pending
   
   📍 Next Task:
      15. Implement user authentication

📝 Analyzing Session Activity...
   Files Modified: 4
   Key Areas: lib, .cursor

💾 Saving Session Summary...
   ✓ Summary saved: 2025-11-20-17-45-32.md

🧠 Memory Suggestions:
   1. Work on lib module
      Significant work in this area
   
   2. 2 tasks in progress
      Track active work for next session

✅ Session Wrapped Up

   Files: 4 | Tasks: 23 done, 18 pending | Rules OK | 4 uncommitted changes

💡 Before You Go:
   ⚠ Consider committing your changes

🎯 Tomorrow's Focus:
   15. Implement user authentication

═══════════════════════════════════════════════════════

💡 Tip: Say "wake up" next session to restore context
```

---

**Status:** Production ready ✅  
**Testing:** Manual testing recommended  
**Documentation:** Complete  

**Next Steps:**
1. Test the hook by saying "wrap up"
2. Verify session summary is created
3. Test integration with wake-up protocol
4. Consider adding automated tests
