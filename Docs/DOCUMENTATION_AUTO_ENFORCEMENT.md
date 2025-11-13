# Documentation Framework - Automatic Enforcement

**Date:** 2025-11-11  
**Status:** ✅ ACTIVE  
**Type:** Automatic Validation System

---

## Overview

The Documentation Framework is now **automatically enforced** through the `DocumentationLifecycle.js` hook that runs after every file write operation.

**Key Feature:** Non-blocking warnings that guide without preventing work.

---

## How It Works

### Automatic Activation

The hook is **automatically active** because it's integrated into the PostToolUse hook:

```
Claude writes file
    ↓
PostToolUse hook triggered
    ↓
DocumentationLifecycle.js runs
    ↓
Checks file against framework rules
    ↓
Displays warnings if needed
    ↓
File operation completes (non-blocking)
```

**Location:** `.claude/hooks/DocumentationLifecycle.js`  
**Integrated Into:** `.claude/hooks/PostToolUse.js`  
**Activation:** Automatic on every file write

---

## What It Detects

### 1. Anti-Pattern Files ⚠️

**Triggers:**
- `TASK_X_COMPLETE.md`
- `TASK_X_SUMMARY.md`
- `SUBTASK_X_Y_COMPLETE.md`
- `SESSION_SUMMARY_*.md` (in root)
- `*_COMPLETION_SUMMARY.md`

**Warning Example:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Documentation Framework - Automatic Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 File: TASK_7_COMPLETE.md
📍 Location: TASK_7_COMPLETE.md

⚠️  ANTI_PATTERN:
   Individual task completion files are anti-patterns. Use git commit messages instead.
   💡 Suggestion: git commit -m "feat: Task 7 complete - <description>"

📖 Framework: Docs/DOCUMENTATION_FRAMEWORK.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 2. Archive Recommendations ℹ️

**Triggers:**
- Milestone docs older than 30 days
- Session docs older than 14 days

**Warning Example:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Documentation Framework - Automatic Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 File: FEATURE_X_COMPLETE.md
📍 Location: FEATURE_X_COMPLETE.md

ℹ️  ARCHIVE_NEEDED:
   Milestone document is 45 days old. Consider archiving to Docs/archive/milestones/
   💡 Suggestion: mv FEATURE_X_COMPLETE.md Docs/archive/milestones/

📖 Framework: Docs/DOCUMENTATION_FRAMEWORK.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 3. Location Suggestions ℹ️

**Triggers:**
- Files in root that should be in `Docs/`
- Misplaced session summaries

**Warning Example:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Documentation Framework - Automatic Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 File: API_REFERENCE.md
📍 Location: API_REFERENCE.md

ℹ️  LOCATION_SUGGESTION:
   Consider organizing this file better.
   💡 Suggested location: Docs/

📖 Framework: Docs/DOCUMENTATION_FRAMEWORK.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Detection Rules

### Anti-Pattern Detection

```javascript
// Automatically detected patterns
TASK_\d+_COMPLETE.md          → Task completion (use git commit)
TASK_\d+_SUMMARY.md           → Task summary (use task updates)
SUBTASK_\d+_\d+_COMPLETE.md   → Subtask completion (use git commit)
SESSION_SUMMARY_*.md          → Session summary (wrong location)
*_COMPLETION_SUMMARY.md       → Completion summary (anti-pattern)
```

### Milestone Detection

```javascript
// Files that should be archived after 30 days
*_COMPLETE.md
*_MILESTONE.md
IMPLEMENTATION_COMPLETE*.md
INSTALLATION_COMPLETE*.md
*_IMPLEMENTATION_COMPLETE.md
```

### Age Thresholds

| Type | Max Age | Action |
|------|---------|--------|
| Milestone docs | 30 days | Suggest archiving to `Docs/archive/milestones/` |
| Session docs | 14 days | Suggest deleting or archiving |

---

## What Files Are Skipped

The hook intelligently skips:
- ❌ Non-markdown files
- ❌ Files in `archive/` directories
- ❌ Files in `templates/` directories
- ❌ Files in `node_modules/`
- ❌ Files in `.git/`

**Result:** Only relevant documentation files are checked.

---

## Non-Blocking Design

### Critical Feature: Won't Break Your Workflow

- ✅ **Warnings only** - Never prevents file creation
- ✅ **Informative** - Explains why and suggests alternatives
- ✅ **Non-intrusive** - Clean, formatted output
- ✅ **Error-safe** - Hook failures don't break file operations

**Philosophy:** Guide and educate, don't block.

---

## Example Workflows

### Scenario 1: Creating Anti-Pattern File

**You do:**
```bash
# Write a task completion file
echo "Task 5 complete" > TASK_5_COMPLETE.md
```

**System responds:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Documentation Framework - Automatic Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 File: TASK_5_COMPLETE.md
📍 Location: TASK_5_COMPLETE.md

⚠️  ANTI_PATTERN:
   Individual task completion files are anti-patterns. Use git commit messages instead.
   💡 Suggestion: git commit -m "feat: Task 5 complete - <description>"

📖 Framework: Docs/DOCUMENTATION_FRAMEWORK.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**You see the warning and:**
```bash
# Delete the anti-pattern file
rm TASK_5_COMPLETE.md

# Do it the right way
git commit -m "feat: Implement feature X (Task 5)

- Added functionality A
- Updated component B
- Tests passing

See Docs/FEATURE_IMPLEMENTATION.md for details"
```

---

### Scenario 2: Old Milestone Document

**System detects:**
```
You edited: PROJECT_SETUP_COMPLETE.md (45 days old)
```

**System responds:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Documentation Framework - Automatic Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 File: PROJECT_SETUP_COMPLETE.md
📍 Location: PROJECT_SETUP_COMPLETE.md

ℹ️  ARCHIVE_NEEDED:
   Milestone document is 45 days old. Consider archiving to Docs/archive/milestones/
   💡 Suggestion: mv PROJECT_SETUP_COMPLETE.md Docs/archive/milestones/

📖 Framework: Docs/DOCUMENTATION_FRAMEWORK.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**You take action:**
```bash
# Archive the old milestone
mv PROJECT_SETUP_COMPLETE.md Docs/archive/milestones/
```

---

### Scenario 3: Proper Documentation (No Warnings)

**You do:**
```bash
# Create proper architecture doc
cat > Docs/NEW_FEATURE_ARCHITECTURE.md << 'EOF'
# New Feature Architecture

## Overview
...
EOF
```

**System responds:**
```
(No warnings - file follows framework rules)
```

**Result:** Proper documentation is created without friction.

---

## Technical Details

### Hook Integration

**File:** `.claude/hooks/PostToolUse.js`

```javascript
import DocumentationLifecycle from './DocumentationLifecycle.js';

export default async function PostToolUse(context) {
  try {
    // Run Documentation Lifecycle hook (non-blocking)
    await DocumentationLifecycle(context).catch(err => {
      console.warn('[PostToolUse] DocumentationLifecycle error:', err.message);
    });
    
    return null;
  } catch (error) {
    console.error('[PostToolUse] Hook error:', error);
    return null;
  }
}
```

**Result:** Automatically runs on every file write.

---

### Hook Implementation

**File:** `.claude/hooks/DocumentationLifecycle.js`

**Key Features:**
- Pattern matching for anti-patterns
- File age calculation
- Location validation
- Formatted warning output
- Error handling (non-blocking)

**Lines of Code:** ~300 lines

---

## Configuration

### Currently Hardcoded Rules

The hook enforces rules from `DOCUMENTATION_FRAMEWORK.md`:

- Anti-patterns: 5 patterns
- Milestone age: 30 days
- Session age: 14 days
- Skip directories: archive, templates, node_modules, .git

### Future: Configurable Rules

Consider adding `.claude/config/documentation-rules.json`:

```json
{
  "antiPatterns": {
    "enabled": true,
    "patterns": ["TASK_*_COMPLETE.md", "..."]
  },
  "archiving": {
    "milestoneMaxAgeDays": 30,
    "sessionMaxAgeDays": 14,
    "autoArchive": false
  },
  "locations": {
    "validateLocations": true,
    "suggestMoves": true
  }
}
```

---

## Maintenance

### Updating Rules

To add new anti-patterns:

1. Edit `.claude/hooks/DocumentationLifecycle.js`
2. Add pattern to `ANTI_PATTERNS` array
3. Specify message and suggestion
4. Save (changes take effect immediately)

**Example:**
```javascript
{
  pattern: /^FEATURE_\d+_DONE\.md$/i,
  type: 'feature-completion',
  message: 'Feature completion files are anti-patterns.',
  suggestion: 'Use git commit and update architecture docs instead.'
}
```

---

### Disabling the Hook

To temporarily disable:

**Option 1:** Comment out in PostToolUse.js
```javascript
// await DocumentationLifecycle(context).catch(err => { ... });
```

**Option 2:** Rename the file
```bash
mv .claude/hooks/DocumentationLifecycle.js \
   .claude/hooks/DocumentationLifecycle.js.disabled
```

**Option 3:** Add early return
```javascript
export default async function DocumentationLifecycle(context) {
  return null; // Disabled
  // ... rest of code
}
```

---

## Monitoring

### How to Verify It's Working

**Test 1:** Create anti-pattern file
```bash
echo "test" > TASK_1_COMPLETE.md
# Should see warning immediately
```

**Test 2:** Create proper doc
```bash
echo "# Architecture" > Docs/NEW_ARCHITECTURE.md
# Should see no warnings
```

**Test 3:** Check hook execution
```bash
# Look for hook output in terminal after file operations
# Format: "📚 Documentation Framework - Automatic Review"
```

---

## Benefits

### Immediate Value

1. **Education** - Teaches framework rules in real-time
2. **Prevention** - Catches anti-patterns before they accumulate
3. **Maintenance** - Reminds about old docs needing archival
4. **Organization** - Suggests better file locations
5. **Consistency** - Enforces standards automatically

### Long-Term Value

1. **Reduced Debt** - Prevents documentation accumulation
2. **Clean Codebase** - Maintains organization automatically
3. **Best Practices** - Reinforces good habits
4. **Efficiency** - Less manual cleanup needed
5. **Quality** - Better documentation structure

---

## Comparison

### Before Automatic Enforcement

- ❌ Manual framework consultation required
- ❌ Anti-patterns accumulated unnoticed
- ❌ No reminders about old docs
- ❌ Periodic manual audits needed
- ❌ Inconsistent adherence

### After Automatic Enforcement

- ✅ Real-time framework guidance
- ✅ Anti-patterns caught immediately
- ✅ Automatic age-based reminders
- ✅ Continuous enforcement
- ✅ Consistent adherence

---

## Troubleshooting

### Hook Not Running

**Symptoms:**
- No warnings displayed
- Anti-pattern files created without alerts

**Checks:**
```bash
# 1. Verify hook files exist
ls -la .claude/hooks/DocumentationLifecycle.js
ls -la .claude/hooks/PostToolUse.js

# 2. Verify they're executable
chmod +x .claude/hooks/DocumentationLifecycle.js
chmod +x .claude/hooks/PostToolUse.js

# 3. Check for syntax errors
node .claude/hooks/DocumentationLifecycle.js
```

---

### Warning Not Showing

**Check:**
1. File is markdown (`.md`)
2. File not in skipped directory (archive/, templates/, etc.)
3. Pattern matches anti-pattern rules
4. Hook integrated into PostToolUse.js

---

### False Positives

**If legitimate files trigger warnings:**

1. Rename file to avoid anti-pattern
2. Move to appropriate location
3. Or update hook rules if pattern is too broad

---

## Related Documentation

- **Framework Rules:** `Docs/DOCUMENTATION_FRAMEWORK.md`
- **Cleanup Script:** `scripts/cleanup-documentation.sh`
- **Templates:** `templates/documentation/`
- **Audit Report:** `Docs/DOCUMENTATION_AUDIT_RECOMMENDATIONS.md`

---

## Summary

The Documentation Framework is now **automatically enforced** through:

- ✅ **DocumentationLifecycle.js hook** - Pattern detection & validation
- ✅ **PostToolUse.js integration** - Automatic execution
- ✅ **Non-blocking warnings** - Guide without blocking
- ✅ **Real-time feedback** - Immediate guidance
- ✅ **Age-based reminders** - Archival suggestions

**Result:** Documentation framework rules are now automatically active and will guide your documentation practices in real-time.

---

## Archive Notice

📦 **This document is permanent and will NOT be archived.**

It describes the automatic enforcement system which is a permanent feature of the project.

---

*Documentation Framework automatic enforcement is now active and monitoring all file operations.* 🎉

