# Wind-Down Compliance Check - Quick Reference

**Purpose:** Automated primacy rules enforcement during session end  
**Location:** Phase 3 of session wind-down system  
**Activation:** Runs automatically when you say "goodbye" or "wind down"

---

## What Gets Checked (6 Steps)

### 1. 🚫 TIER 0 (PROHIBITED) Files
**Files that should never exist:**

| Pattern | Why Prohibited | Use Instead |
|---------|---------------|-------------|
| `*_COMPLETE.md` | Session completion docs | Git commit messages |
| `*_SUMMARY.md` | Session summaries | Git log |
| `*_PROGRESS.md` | Progress reports | Taskmaster status |
| `SESSION_*.md` | Session notes | Git commits |
| `*_V[0-9].md` | Versioned docs | Git history |
| `*_FINAL.md` | Version suffixes | Update in place |

**Your Options:**
1. 🗑️ Delete all (recommended)
2. 📦 Archive for reference
3. 📋 Review each first
4. ⏭️ Skip

---

### 2. 📦 TIER 3 (TEMPORARY) Expired Files
**Files past their expiration date:**

Checks `.file-manifest.json` for:
- Files with `file_class: ephemeral`
- Past their `expires_after_days` setting
- Should be archived to `.claude/archive/YYYY-MM/`

**Your Options:**
1. 📦 Archive all (recommended)
2. 📋 Review before archiving
3. ⏳ Extend expiration
4. ⏭️ Skip

---

### 3. 🔍 Duplicate Documentation
**Multiple files documenting the same thing:**

Detects patterns like:
- `API_GUIDE.md`, `API_DOCUMENTATION.md`, `docs/api.md`
- `SETUP.md`, `INSTALLATION.md`
- `ARCHITECTURE_V1.md`, `ARCHITECTURE_V2.md`

**Recommendation:** Keep ONE source of truth (most recent/complete)

**Your Options:**
1. ✂️ Auto-consolidate (merge & delete)
2. 📋 Show differences first
3. 🔗 Create links instead
4. ⏭️ Skip

---

### 4. 🧪 Test Artifacts
**Temporary test files:**

Finds:
- `test-docs-*/` directories
- `coverage/`, `htmlcov/` reports
- `*.test.tmp`, `*.coverage` files

**Your Options:**
1. 🗑️ Delete artifacts >1 day old
2. 🗑️ Delete all artifacts
3. 📋 Keep coverage, delete others
4. ⏭️ Skip

---

### 5. ⚠️ Project Root Bloat
**Too many markdown files in root:**

**Warning Trigger:** >15 markdown files in project root

Shows:
- Categorized file breakdown
- Estimated token savings from cleanup
- Before/after file counts
- Project health score

**Your Options:**
1. 🧹 Execute full cleanup (delete + archive + consolidate)
2. 📋 Show detailed breakdown
3. 🎯 Interactive cleanup (ask per file)
4. ⏭️ Skip

---

### 6. 📋 Unclassified Files
**Files not in `.file-manifest.json`:**

All markdown files should be classified as:
- **CRITICAL** - Core config, never auto-move
- **PERMANENT** - Keep indefinitely, maintain
- **EPHEMERAL** - Auto-archive after expiration

**Your Options:**
1. 🤖 Auto-classify (recommended)
2. 📋 Classify manually
3. ⏭️ Skip

---

## What's Protected (Never Touched)

✅ **Always Safe:**
- `.taskmaster/tasks/tasks.json`
- `CHANGELOG.md`
- `README.md`
- `.cursor/rules/*.mdc`
- `.claude/knowledge/`
- `Docs/` directory
- `package.json`, dependencies
- `.file-manifest.json`

---

## Example Wind-Down Flow

```bash
User: goodbye

Agent: 🌅 Session Wind-Down Detected
       Running Phase 3: Documentation Tidying...

       🚫 TIER 0 (PROHIBITED) Documents Found
       
       The following files violate Documentation Economy:
       ❌ TASK_5_COMPLETE.md - Session completion doc
       ❌ SPRINT1_PROGRESS.md - Progress report
       
       Would you like me to:
       1. 🗑️ Delete all (recommended)
       2. 📦 Archive for reference
       3. 📋 Review each first
       4. ⏭️ Skip

User: 1

Agent: ✅ Deleted 2 TIER 0 files
       
       📦 TIER 3 (TEMPORARY) Documents Ready for Archiving
       
       📄 MIGRATION_NOTES.md
          - Expired: 2025-11-15 (3 days ago)
       
       Would you like me to:
       1. 📦 Archive all (recommended)
       2. 📋 Review before archiving
       3. ⏳ Extend expiration
       4. ⏭️ Skip

User: 1

Agent: ✅ Archived 1 file to .claude/archive/2025-11/
       
       ✅ Documentation Tidying Complete
       
       Summary:
       - 🗑️ Deleted 2 TIER 0 files
       - 📦 Archived 1 expired file
       - Root markdown files: 23 → 20 (13% reduction)
       - Token savings: ~8,000 tokens per session
       
       Your project now complies with:
       ✅ Documentation Economy
       ✅ File Lifecycle Management
```

---

## Token Savings Example

**Before Cleanup:**
```
47 markdown files in root
= ~156,000 tokens loaded per session
= ~$0.47 per session (GPT-4 pricing)
```

**After Cleanup:**
```
8 markdown files in root
= ~25,000 tokens loaded per session
= ~$0.08 per session

Savings: 131,000 tokens (~$0.39 per session)
Annual savings (100 sessions): ~$39
```

---

## When to Skip

**It's OK to skip when:**
- ✅ You're in the middle of debugging
- ✅ You need to reference session docs immediately
- ✅ You're creating documentation intentionally for a specific purpose
- ✅ You understand the token cost and accept it

**You should NOT skip when:**
- ❌ Project has >30 root markdown files
- ❌ Multiple TIER 0 violations detected
- ❌ You don't remember why a file exists
- ❌ It's been >1 week since last cleanup

---

## Quick Commands

**Express Mode (Skip detailed checks):**
```bash
goodbye --express
```

**Review Mode (See everything):**
```bash
goodbye --review
```

**Auto-cleanup (No prompts):**
```bash
goodbye --auto-cleanup
```

---

## Learn More

- **Full Implementation:** `WINDDOWN_PRIMACY_COMPLIANCE_COMPLETE.md`
- **Session Agent:** `.claude/agents/session-cleanup.md`
- **Wind-Down Command:** `.claude/commands/wind-down.md`
- **Documentation Economy:** `.claude/rules/documentation-economy.md`
- **File Lifecycle:** `.claude/rules/file-lifecycle-standard.md`

---

## FAQ

**Q: What if I need to keep a TIER 0 file?**  
A: Archive it instead of deleting. It will be preserved in `.claude/archive/prohibited/` for reference.

**Q: Can I customize what gets detected?**  
A: Yes, create `.claude/rules/local-overrides.md` to whitelist specific patterns for your project.

**Q: What if I accidentally delete something?**  
A: Check `.claude/archive/` for archived files. Git history also preserves everything.

**Q: How do I classify new files?**  
A: Add to `.file-manifest.json`:
```json
"MY_FILE.md": {
  "file_class": "ephemeral",
  "created_at": "2025-11-18T...",
  "expires_after_days": 30,
  "purpose": "Temporary implementation notes"
}
```

**Q: Can I run compliance check without ending session?**  
A: Not yet, but planned for future enhancement. Currently only runs during wind-down.

---

**Version:** Session Wind-Down System v1.2  
**Last Updated:** November 18, 2025

