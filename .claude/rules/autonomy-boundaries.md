---
rule_version: 1.0.0
last_updated: 2025-11-18
authoritative_source: Orchestrator_Project
---

# Autonomy Boundaries - AI Confirmation Protocol

**Priority:** Critical  
**Applies To:** All diet103 projects  
**AI Assistants:** Claude, Cursor, Windsurf, Cline, Roo, and all others

---

## Core Principle

**Balance automation with safety. AI should act autonomously for safe operations, but MUST request confirmation for potentially destructive actions.**

This rule defines when AI assistants should proceed automatically versus when they must ask for explicit human approval.

---

## Relationship to Existing Rules

**Complements:**
- **Context Isolation** (explicit switching requires confirmation)
- **File Lifecycle** (archiving vs deleting requires different confirmation levels)
- **Documentation Economy** (automatic doc prevention vs manual creation)

**Balances:**
- diet103's "Zero Mental Overhead" (automation) 
- Orchestrator's "Explicit over Implicit" (confirmation)

**Conflicts With:** None identified

**Resolution Framework:** When automation and safety conflict, **safety wins**.

---

## Why This Matters

### The Autonomy Paradox

**Problem:** 
- diet103 emphasizes "auto-activation" and "zero mental overhead"
- Orchestrator emphasizes "explicit over implicit" and "fail-safe defaults"
- These appear contradictory!

**Solution:**
- Automate SAFE operations (reading, searching, analyzing)
- Require confirmation for DESTRUCTIVE operations (deleting, overwriting)
- The boundary depends on **reversibility** and **scope of impact**

---

## The Autonomy Matrix

### Decision Framework

```
                        Reversibility
                    Easy  │  Hard  │  None
                    ──────┼────────┼───────
Scope:  Single File │  ✅  │   ⚠️   │   🛑
Impact: Multi-File  │  ⚠️  │   🛑   │   🚨
        System-Wide │  🛑  │   🚨   │   🚨

Legend:
✅ Automatic (proceed without asking)
⚠️ Warn (show intent, proceed unless user stops)
🛑 Confirm (require explicit approval)
🚨 Double Confirm (require typed confirmation)
```

### Reversibility Assessment

**Easy to Reverse:**
- Git can undo (committed changes)
- Backup exists (auto-backup systems)
- Redo operation available
- Examples: Modify committed file, create branch

**Hard to Reverse:**
- Manual recovery required
- Backup exists but restore complex
- Examples: Delete with backup, force push to branch

**Impossible to Reverse:**
- No backup exists
- Data destruction
- Examples: Delete uncommitted work, overwrite without backup

### Scope of Impact

**Single File:**
- Affects one file only
- Local changes
- Examples: Edit file, create file, rename file

**Multi-File:**
- Affects multiple files
- Project-level changes
- Examples: Refactor across files, batch delete, search-replace

**System-Wide:**
- Affects global config
- Cross-project impact
- Examples: Modify `~/.claude/config.json`, remove project from registry

---

## Autonomy Levels

### Level 1: ✅ AUTOMATIC (No Confirmation)

**Characteristics:**
- Read-only operations
- Non-destructive
- Fully reversible
- Low impact

**Examples:**

```markdown
✅ Reading files
✅ Searching codebase
✅ Running tests (read-only)
✅ Analyzing code
✅ Generating suggestions
✅ Showing diffs
✅ Git status checks
✅ Listing projects
✅ Viewing documentation
```

**AI Behavior:**
```
User: "Show me the authentication logic"
AI: [Reads files automatically]
    "Here's the authentication logic from src/auth.js..."
```

---

### Level 2: ⚠️ WARN (Show Intent, Proceed)

**Characteristics:**
- Modifies existing content
- Reversible (git, backups)
- Medium impact
- User can interrupt

**Examples:**

```markdown
⚠️ Modifying existing files (with git)
⚠️ Creating new files
⚠️ Installing dependencies
⚠️ Running builds
⚠️ Creating git branches
⚠️ Committing changes
⚠️ Switching projects
⚠️ Updating metadata
```

**AI Behavior:**
```
User: "Add authentication to the API"
AI: "I'll modify these files:
     - src/api/routes.js (add auth middleware)
     - src/auth/middleware.js (create new)
     - tests/auth.test.js (add tests)
    
    Proceeding in 3 seconds... (Ctrl+C to cancel)"
    
    [Wait 3 seconds or proceed if user says "go"]
    
    "✅ Done. Authentication added."
```

**Important:** User has opportunity to interrupt before action.

---

### Level 3: 🛑 CONFIRM (Require Explicit Approval)

**Characteristics:**
- Potentially destructive
- Hard to reverse
- High impact
- Requires explicit "yes"

**Examples:**

```markdown
🛑 Deleting files
🛑 Overwriting without backup
🛑 Removing projects from registry
🛑 Modifying global config
🛑 Force pushing git
🛑 Dropping database tables
🛑 Removing active project
🛑 Archiving critical files
🛑 Disabling security features
```

**AI Behavior:**
```
User: "Delete the old authentication module"
AI: "⚠️ DESTRUCTIVE OPERATION
    
    I will DELETE these files:
    - src/auth/old-auth.js (450 lines)
    - src/auth/deprecated.js (280 lines)
    
    This action is:
    - ⚠️ Destructive (files will be deleted)
    - ✅ Reversible (files are committed to git)
    - 📊 Impact: 2 files, 730 lines
    
    Proceed with deletion? (yes/no)"

User: "yes"

AI: "✅ Deleted 2 files. 
    Restore with: git checkout HEAD src/auth/old-auth.js"
```

**Important:** Requires explicit "yes" or "y" from user.

---

### Level 4: 🚨 DOUBLE CONFIRM (Extra Safety)

**Characteristics:**
- Irreversible destruction
- System-wide impact
- Data loss risk
- Requires typed confirmation

**Examples:**

```markdown
🚨 Deleting projects (filesystem)
🚨 Removing active project from registry
🚨 Corrupting config files
🚨 Force deleting without backup
🚨 Dropping production database
🚨 Removing security keys
🚨 Disabling all backups
```

**AI Behavior:**
```
User: "Delete the entire Shopify project"
AI: "🚨 CRITICAL: IRREVERSIBLE OPERATION
    
    This will PERMANENTLY DELETE:
    - Project: shopify-store
    - Path: ~/Projects/shopify-store
    - Files: 1,247 files (45MB)
    - Status: Currently ACTIVE project
    
    ⚠️ THIS CANNOT BE UNDONE
    ⚠️ No git backup exists (uncommitted changes)
    ⚠️ This is your ACTIVE project
    
    Type the project name to confirm: 'shopify-store'"

User: "shopify-store"

AI: "Final confirmation: Are you absolutely sure? (yes/no)"

User: "yes"

AI: "🗑️ Deleting... Done.
    Project removed from registry and filesystem."
```

**Important:** Requires typed confirmation + explicit "yes".

---

## Decision Tree

### Before Any Action

```
START: Analyze action

1. Is this read-only?
   ├─ YES → ✅ AUTOMATIC (proceed)
   └─ NO → Continue

2. Does this modify files?
   ├─ NO (new files only) → ⚠️ WARN
   └─ YES → Continue

3. Is modification reversible?
   ├─ EASY (git committed) → ⚠️ WARN
   ├─ HARD (backup exists) → 🛑 CONFIRM
   └─ NO (no backup) → Continue to 4

4. What's the scope?
   ├─ Single file → 🛑 CONFIRM
   ├─ Multi-file → 🚨 DOUBLE CONFIRM
   └─ System-wide → 🚨 DOUBLE CONFIRM

5. Is this the active project?
   ├─ NO → 🛑 CONFIRM (safer)
   └─ YES → 🚨 DOUBLE CONFIRM (critical)
```

---

## Special Cases

### Case 1: Auto-Generated Code

**Question:** Does auto-generated code require confirmation?

**Answer:** Depends on impact.

```markdown
✅ AUTOMATIC:
- Generating test files (new files, reversible)
- Creating boilerplate (new files)
- Adding imports (minor modification)

⚠️ WARN:
- Refactoring existing code (major modification)
- Migrating patterns (multi-file impact)

🛑 CONFIRM:
- Deleting deprecated code
- Removing features
```

### Case 2: Dependencies

**Question:** Do dependency operations require confirmation?

**Answer:** Depends on package manager and scope.

```markdown
⚠️ WARN:
- npm install <package> (reversible, package-lock)
- npm update (versioned, reversible)

🛑 CONFIRM:
- npm uninstall (removes functionality)
- npm install --force (overwrites)
- rm -rf node_modules (can rebuild but slow)
```

### Case 3: Git Operations

**Question:** Do git operations require confirmation?

**Answer:** Depends on destructiveness.

```markdown
✅ AUTOMATIC:
- git status
- git log
- git diff
- git branch (list)

⚠️ WARN:
- git add
- git commit
- git checkout <branch>
- git merge (fast-forward)

🛑 CONFIRM:
- git reset --hard
- git push --force
- git branch -D (delete)
- git clean -fd (delete untracked)

🚨 DOUBLE CONFIRM:
- git push --force origin main (push to main)
- git reset --hard HEAD~10 (lose commits)
```

### Case 4: Taskmaster Operations

**Question:** Do Taskmaster operations require confirmation?

**Answer:** Depends on destructiveness.

```markdown
✅ AUTOMATIC:
- task-master list
- task-master next
- task-master show <id>

⚠️ WARN:
- task-master set-status (update metadata)
- task-master add-task (new task)
- task-master update-subtask (append info)

🛑 CONFIRM:
- task-master remove-task (delete task)
- task-master clear-subtasks (delete subtasks)
- task-master move --from=<id> --to=<id> (reorganize)
```

---

## Implementation Guidelines

### For AI Assistants

#### Decision Algorithm

```python
def determine_autonomy_level(action):
    # Analyze action characteristics
    reversibility = assess_reversibility(action)
    scope = assess_scope(action)
    is_active_project = check_active_project(action)
    
    # Apply decision tree
    if action.is_read_only:
        return AUTOMATIC
    
    if action.creates_new_files_only:
        return WARN
    
    if reversibility == "EASY" and scope == "SINGLE_FILE":
        return WARN
    
    if reversibility == "HARD" or scope == "MULTI_FILE":
        return CONFIRM
    
    if reversibility == "NONE" or scope == "SYSTEM_WIDE":
        return DOUBLE_CONFIRM
    
    if is_active_project and (reversibility == "NONE" or scope != "SINGLE_FILE"):
        return DOUBLE_CONFIRM
    
    # Default: err on side of caution
    return CONFIRM
```

#### Confirmation Templates

**Warn Template:**
```
I'll {action}:
{list of changes}

Proceeding in 3 seconds... (Ctrl+C to cancel)
```

**Confirm Template:**
```
⚠️ {LEVEL} OPERATION

I will {action}:
{detailed changes}

This action is:
- {reversibility status}
- {scope status}
- {impact summary}

Proceed? (yes/no)
```

**Double Confirm Template:**
```
🚨 CRITICAL: {LEVEL} OPERATION

This will {action}:
{very detailed changes}

⚠️ THIS CANNOT BE UNDONE
⚠️ {specific risk}
⚠️ {additional warnings}

Type '{confirmation_string}' to confirm:
```

---

### For Developers

#### Override Protocol

**Project-Level Override (use sparingly):**

```markdown
# .claude/autonomy-overrides.json

{
  "overrides": [
    {
      "action": "delete_test_files",
      "default_level": "CONFIRM",
      "override_level": "WARN",
      "justification": "Test files regenerated by CI/CD",
      "approved_by": "team lead",
      "review_date": "2026-01-01"
    }
  ]
}
```

**Batch Operations:**

```bash
# For repetitive operations, allow batch mode
AI: "I need to delete 50 deprecated test files. 
     Confirm each (50 prompts) or batch mode (1 prompt)?"

User: "batch"

AI: "⚠️ BATCH OPERATION
     Deleting 50 test files (all in tests/deprecated/)
     
     Proceed with batch delete? (yes/no)"
```

---

## Error Handling

### User Cancels Operation

```python
def handle_cancel():
    # User interrupted or said "no"
    
    log_action_cancelled(action, user_response)
    
    return {
        "status": "cancelled",
        "message": "Operation cancelled by user",
        "no_changes_made": True
    }
```

### Timeout (No Response)

```python
def handle_timeout():
    # User didn't respond to confirmation
    
    # Default: CANCEL (fail-safe)
    log_action_timeout(action)
    
    return {
        "status": "timeout",
        "message": "No response received, operation cancelled (fail-safe)",
        "no_changes_made": True
    }
```

**Important:** Timeout always CANCELS. Never proceed without explicit confirmation.

---

## Integration with Other Rules

### With Context Isolation

**Scenario:** Switching projects

**Context Isolation:** "Explicit switching required"  
**Autonomy Boundaries:** "Project switching = WARN level"

**Combined Result:**
```
User: "Switch to Shopify project"
AI: [⚠️ WARN level]
    "Switching from orchestrator → shopify-store
    Proceeding in 3 seconds..."
```

### With Documentation Economy

**Scenario:** AI wants to create session summary

**Documentation Economy:** "Never create session summaries (Tier 3 Forbidden)"  
**Autonomy Boundaries:** "Would be WARN level if allowed"

**Combined Result:**
```
User: "Document what we did today"
AI: [Blocked by Documentation Economy]
    "Per documentation-economy.md, session summaries are Tier 3 (Forbidden).
    
    Instead, I can:
    1. Update git commit messages
    2. Update Taskmaster subtask notes
    3. Update README if needed
    
    Which would you prefer?"
```

### With File Lifecycle

**Scenario:** Auto-archiving ephemeral files

**File Lifecycle:** "Archive after 30 days"  
**Autonomy Boundaries:** "Archiving (reversible) = WARN level"

**Combined Result:**
```
AI: [Automatic check daily]
    "30-day expiration reached for 3 files:
    - TASK_5_COMPLETE.md
    - MIGRATION_NOTES.md  
    - SESSION_OCT_15.md
    
    Archiving to .claude/archive/ in 3 seconds...
    (Ctrl+C to cancel)"
```

---

## Summary: Autonomy Boundaries

### The Four Levels

1. **✅ AUTOMATIC** - Read-only, safe operations
2. **⚠️ WARN** - Reversible modifications, show intent
3. **🛑 CONFIRM** - Destructive but recoverable, require "yes"
4. **🚨 DOUBLE CONFIRM** - Irreversible, require typed confirmation

### Decision Factors

1. **Reversibility** - Can this be undone?
2. **Scope** - Single file, multi-file, or system-wide?
3. **Active Project** - Is this the current working project?
4. **Data Loss Risk** - Could this lose uncommitted work?

### Fail-Safe Defaults

- **When in doubt → CONFIRM**
- **Timeout → CANCEL**
- **Unclear → Ask user**
- **Safety > Convenience**

### Quick Reference

| Operation | Level | Reason |
|-----------|-------|--------|
| Read file | ✅ Automatic | Read-only |
| Edit file (committed) | ⚠️ Warn | Reversible via git |
| Delete file | 🛑 Confirm | Destructive |
| Delete project | 🚨 Double | Irreversible |
| Switch project | ⚠️ Warn | Reversible, explicit |
| Install package | ⚠️ Warn | Reversible, package-lock |
| Force push main | 🚨 Double | Affects team |

---

**Rule Version:** 1.0.0  
**Created:** November 14, 2025  
**Last Updated:** November 14, 2025  
**Applies To:** All diet103 projects  
**Balances:** diet103 automation + Orchestrator explicitness

**Next Review:** December 14, 2025

---

*"Automate the safe, confirm the destructive, double-check the irreversible."*

