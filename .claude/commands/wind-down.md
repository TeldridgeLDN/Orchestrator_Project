# /wind-down Command

**Purpose:** Gracefully end coding session with full cleanup and handoff preparation  
**Alias:** `/goodbye`, `/wrap-up`

---

## Quick Usage

Just type:
```
/wind-down
```

Or naturally:
```
goodbye
wind down
wrap up
```

The session-winddown hook will automatically detect and activate.

---

## What It Does

This command orchestrates a complete session wind-down:

1. **Saves Progress** → Documents what you accomplished
2. **Tidies Docs** → Applies Documentation Economy principles  
3. **Saves Session** → Creates restore point for next time
4. **Git Status** → Checks for uncommitted changes
5. **Handoff Notes** → Prepares clear next-session guide
6. **Summary** → Shows what was done and what's next

---

## Workflow

### Automatic Flow

When you say "goodbye" (or similar), the agent will:

```
Step 1: Assess current state
  ├─ Check git status
  ├─ Check Taskmaster progress
  └─ Scan for tidying opportunities

Step 2: Document progress  
  ├─ Update task logs
  ├─ Save session state
  └─ Capture key decisions

Step 3: Tidy documentation
  ├─ Archive completed docs
  ├─ Remove test artifacts
  └─ Consolidate redundancies

Step 4: Handle git changes
  ├─ Review uncommitted changes
  ├─ Offer to commit
  └─ Ensure clean state

Step 5: Create handoff
  ├─ Generate HANDOFF.md
  ├─ Document next steps
  └─ Identify context files

Step 6: Provide summary
  └─ Show session achievements & restore instructions
```

---

## Session Saves To

```
.claude/sessions/[session-name]/
├── session.json      # Metadata
├── plan.md          # Session plan
├── context.md       # Key context
├── HANDOFF.md       # Next session guide
└── tasks.md         # Task checklist (if applicable)
```

**Session naming:** `YYYY-MM-DD-task-<id>` or custom name

---

## Documentation Tidying (Enhanced Primacy Rules Compliance)

### Automated Compliance Check

The wind-down system now performs a **comprehensive primacy rules compliance check** against:

1. **Documentation Economy** (TIER 0 - PROHIBITED patterns)
2. **File Lifecycle Management** (TIER 3 - TEMPORARY expired files)
3. **Duplicate documentation detection**
4. **Test artifact cleanup**
5. **Project root document count**
6. **File-manifest classification validation**

### What Gets Checked & Tidied

**TIER 0 (PROHIBITED) - Deleted:**
- `*_COMPLETE.md` - Session completion docs (use git instead)
- `*_SUMMARY.md` - Session summaries (use git commits)
- `*_PROGRESS.md` - Progress reports (solo dev doesn't need)
- `*_STATUS.md` - Status reports (use Taskmaster)
- `SESSION_*.md` - Session notes (captured in git)
- `*_V[0-9].md` - Versioned docs (use git for versions)
- `*_FINAL.md`, `*_UPDATED.md`, `*_REVISED.md` - Version suffixes

**TIER 3 (TEMPORARY) - Archived:**
- Expired EPHEMERAL files from `.file-manifest.json`
- Files past their `expires_after_days` setting
- Moved to `.claude/archive/YYYY-MM/`

**Sprint/Phase Docs - Archived:**
- `SPRINT*_COMPLETE.md` → `Docs/archive/sprints/`
- `PHASE*_COMPLETE.md` → `Docs/archive/phases/`

**Removed:**
- `test-docs-*/` directories (older than 1 day)
- Coverage reports (if not actively analyzing)
- Temporary test files (`*.test.tmp`, `*.fixture.tmp`)

**Consolidated:**
- Multiple implementation logs → relevant locations
- Scattered status updates → session file
- Duplicate guides → single canonical version

**Duplicates Detected:**
- Multiple API guides → Keep most recent/complete
- Similar setup docs → Merge into README
- Redundant architecture docs → Consolidate to Docs/ARCHITECTURE.md

**Document Bloat Warnings:**
- If >15 markdown files in root → Cleanup suggestions
- Token savings calculated per cleanup
- Project health score provided

### What's Protected

**Never touched:**
- `.taskmaster/tasks/tasks.json`
- `CHANGELOG.md`
- `README.md`
- `.cursor/rules/*.mdc`
- `.claude/knowledge/`
- `Docs/` directory (permanent documentation)
- Active sprint/phase docs
- `package.json`, dependencies
- `.file-manifest.json` (auto-updated)

### Interactive Options

For each compliance violation, you'll be asked:

**For TIER 0 (PROHIBITED) files:**
```
1. 🗑️  Delete all (recommended)
2. 📦 Archive for reference
3. 📋 Review each file first
4. ⏭️  Skip
```

**For expired EPHEMERAL files:**
```
1. 📦 Archive all (recommended)
2. 📋 Review before archiving
3. ⏳ Extend expiration
4. ⏭️  Skip
```

**For duplicates:**
```
1. ✂️  Auto-consolidate (merge & delete)
2. 📋 Show differences first
3. 🔗 Create links instead
4. ⏭️  Skip
```

**For test artifacts:**
```
1. 🗑️  Delete artifacts >1 day old
2. 🗑️  Delete all artifacts
3. 📋 Keep coverage, delete others
4. ⏭️  Skip
```

**For unclassified files:**
```
1. 🤖 Auto-classify (recommended)
2. 📋 Classify manually
3. ⏭️  Skip
```

---

## Options & Modes

### Express Mode

Quick wind-down (saves essentials, skips detailed cleanup):

```
goodbye --express
```

or

```
/wind-down --quick
```

### Commit Mode

Automatically commit all changes with generated message:

```
goodbye --commit
```

### Review Mode

Pause for manual review of each cleanup action:

```
goodbye --review
```

### Tidy-Only Mode

Just clean up docs without full session save:

```
/wind-down --tidy-only
```

---

## Manual Commands

If you prefer manual control:

```bash
# Save session manually
orch save-session "my-session-name" "Working on auth feature"

# Tidy docs manually
orch tidy-docs

# Update task status
orch set-status --id=<task> --status=done

# List available sessions
orch list-sessions

# Restore previous session
orch restore-session <session-name>
```

---

## Example Interactions

### Example 1: Clean Wind-Down

**User:** `goodbye`

**Agent:**
```
✨ Session wind-down initiated!

📊 Current State:
- Modified files: 3
- Current task: 15.2 - Implement JWT middleware
- In-progress subtasks: 1

📝 Documenting progress...
✅ Task 15.2 progress logged
✅ Session saved: 2024-11-15-task-15

🧹 Tidying documentation...
✅ Archived 2 completion docs
✅ Removed 5 test artifact directories
✅ Consolidated status updates

🔍 Git Status:
You have 3 uncommitted files.

Would you like to:
1. ✅ Commit now (I'll write message)
2. 💾 Save as-is (commit later)

Recommendation: Commit now - changes are stable
```

---

### Example 2: Incomplete Work

**User:** `wrap up - didn't finish what I wanted`

**Agent:**
```
🌅 No problem! Let's wrap up gracefully.

📋 Current Progress:
- Task 15.2 still in progress
- Subtask 15.2.3 partially complete

📝 I've saved detailed notes on where you left off:
- Implemented auth middleware structure
- Tests written but 2 failing
- Need to debug token validation logic

💡 Next Session Start:
```bash
orch restore-session 2024-11-15-task-15
orch show 15.2
```

HANDOFF.md has specific next steps.

Your work is safe - you can pick up exactly where you left off! 👍
```

---

### Example 3: Multiple Tasks

**User:** `goodbye - worked on several things`

**Agent:**
```
✨ Great session! Let me organize this.

📊 You worked on:
- Task 12 (completed ✅)
- Task 15 (in progress 🚧)  
- Task 18 (started 🆕)

📝 Recommendations:
1. Mark Task 12 as done? [Yes]
2. Keep Task 15 as in-progress? [Yes]
3. Reset Task 18 to pending? (you just started) [Recommended]

This will help you focus on Task 15 next session.

Proceed with recommendations? [y/n]
```

---

## Integration Points

### With Taskmaster

- Auto-updates task progress
- Syncs task status
- Identifies next task based on dependencies

### With Git

- Checks status before wind-down
- Offers to commit changes
- Ensures no work is lost

### With Documentation System

- Applies Documentation Economy principles
- Archives completed work
- Removes cruft

### With Knowledge Base

- Optionally syncs to global knowledge (Orchestrator project)
- Saves patterns discovered during session
- Updates decision records if applicable

---

## Troubleshooting

### "Session already exists"

```
Session name already used. Options:
1. Overwrite previous session
2. Use new name: 2024-11-15-task-15-v2
3. Restore previous first, then save

What would you like to do?
```

### "Uncommitted changes but unsure"

```
Let me help you decide:

Changed files:
- lib/auth/jwt.js (new functionality)
- tests/auth.test.js (new tests)
- package.json (dependency added)

Analysis: These look like stable additions worth committing.

Suggested message:
"feat(auth): Add JWT middleware with tests"

Commit with this message? [y/n]
```

### "Too many docs to tidy"

```
Found 45 files that could be tidied!

Recommendations:
1. Archive 12 completion docs
2. Remove 28 test artifact dirs
3. Consolidate 5 status files

This is safe - everything goes to archive.
Proceed with cleanup? [y/n]

(You can always restore from .claude/sessions/archive/)
```

---

## Best Practices

### DO:
- ✅ Wind down regularly (every work session)
- ✅ Let agent guide the process
- ✅ Review handoff notes it creates
- ✅ Commit stable changes before ending
- ✅ Trust the tidying (it archives, not deletes)

### DON'T:
- ❌ Skip wind-down when ending sessions
- ❌ Leave work uncommitted without session save
- ❌ Ignore documentation tidying suggestions
- ❌ Delete session files manually
- ❌ Override agent without review

---

## Configuration

### Customize Wind-Down Behavior

Edit `.claude/config/wind-down.json` (if exists):

```json
{
  "auto_commit": false,
  "auto_tidy": true,
  "archive_threshold_days": 7,
  "keep_test_artifacts_days": 1,
  "session_naming": "date-task",
  "handoff_verbosity": "detailed",
  "prompt_before_cleanup": true
}
```

---

## Related Commands

- `/save-session` - Save without full wind-down
- `/restore-session` - Restore saved session
- `/tidy-docs` - Documentation cleanup only
- `/commit-session` - Commit with auto-generated message

---

## Tips for New Users

**First time using wind-down?**

1. Just type "goodbye" and let the agent guide you
2. Answer its questions (it will explain each step)
3. Review the HANDOFF.md it creates
4. Next session: `orch restore-session <name>`
5. You'll quickly see the value!

**Pro tip:** Use wind-down even for short sessions. The habit of clean handoffs compounds into massive productivity gains.

---

**Command Type:** Orchestrated Workflow  
**Agents Used:** session-cleanup  
**Duration:** 5-10 minutes (2-3 minutes in express mode)  
**Prerequisites:** None (works in any project state)

---

**Last Updated:** November 15, 2025

