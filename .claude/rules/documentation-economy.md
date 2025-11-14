# Documentation Economy - Combat Bloat and Theatre

**Priority:** Critical  
**Applies To:** All diet103 projects  
**AI Assistants:** Claude, Cursor, Windsurf, Cline, Roo, and all others

---

## Core Principle

**NEVER generate documentation that doesn't provide lasting value.**

Documentation bloat is a massive waste of time, tokens, and cognitive resources. The vast majority of AI-generated documentation has limited lifespan and gets outdated within days. This rule establishes strict guidelines for when and what to document.

---

## The Problem: Documentation Theatre

### Common Wasteful Patterns

**❌ Session Summaries After Every Task**
```
TASK_1_COMPLETE.md
TASK_2_COMPLETE.md  
TASK_3_COMPLETE.md
SUBTASK_1.1_COMPLETE.md
SUBTASK_1.2_COMPLETE.md
SESSION_SUMMARY_NOV_14.md
SPRINT_1_PROGRESS.md
...
```
**Cost:** Thousands of tokens per file, hours of generation time, cognitive overload when browsing project

**❌ Duplicate Documentation**
```
API_GUIDE.md           ← Same content
API_DOCUMENTATION.md   ← Same content
API_REFERENCE.md       ← Same content
docs/api.md            ← Same content
```
**Cost:** Maintenance nightmare, version drift, confusion about canonical source

**❌ Over-Detailed Implementation Logs**
```markdown
## Changes Made

1. Opened file.js
2. Added import statement on line 5
3. Created new function on line 23
4. Added parameter validation on line 25
5. Added error handling on line 30
...
[500 lines of play-by-play]
```
**Cost:** High token usage, low information density, nobody reads it

**❌ Premature Architecture Documents**
```
SYSTEM_ARCHITECTURE_V1.md
SYSTEM_ARCHITECTURE_V2.md
SYSTEM_ARCHITECTURE_FINAL.md
SYSTEM_ARCHITECTURE_FINAL_REVISED.md
```
**Cost:** Outdated before implementation even starts

---

## The Solution: Documentation Tiers (Unified System)

Per [rule-integrity.md](./rule-integrity.md), Documentation Economy uses the unified tier classification:

| Unified Tier | Documentation Term | Treatment |
|--------------|-------------------|-----------|
| **TIER 0: PROHIBITED** | Tier 3 (Forbidden) | Never create, delete if exists |
| **TIER 1: CRITICAL** | Tier 1 (Critical) | Permanent, never archive |
| **TIER 2: PERMANENT** | Tier 1 (Critical) | Keep indefinitely, maintain |
| **TIER 3: TEMPORARY** | Tier 2 (Temporary) | Auto-archive after expiration |

### TIER 1: CRITICAL (Always Document)

These have permanent value and must be maintained:

**1. User-Facing Documentation**
- `README.md` - Project overview, setup, usage
- `CONTRIBUTING.md` - How to contribute
- `CHANGELOG.md` - Version history (via changesets)
- API documentation for public APIs
- User guides for end users

**2. Architectural Decisions**
- `Docs/ARCHITECTURE.md` - High-level system design (updated, not versioned)
- `Docs/ADR/` - Architectural Decision Records (immutable, dated)
- `Docs/*_PRD.md` - Product Requirements Documents (source of truth)

**3. Critical Configuration**
- `.cursorrules` or `CLAUDE.md` - AI assistant context
- Security policies, deployment procedures
- Database schemas (auto-generated from code)

**Location:** `Docs/` directory or project root  
**Maintenance:** Keep updated, don't version  
**Format:** Markdown, concise, scannable

---

### TIER 2: PERMANENT (Long-Term Reference)

Documentation that should be kept indefinitely but isn't critical for system operation.

**Includes TIER 1 categories** plus:
- Technical design documents
- Integration guides
- Historical context documents

---

### TIER 3: TEMPORARY (Time-Limited Value)

These are acceptable but should auto-expire:

**1. Implementation Notes**
- Session-specific findings that inform current work
- Debugging discoveries during active development
- Migration checklists while migration is happening

**2. Sprint/Milestone Summaries**
- Only if team needs them for standups/reviews
- Should be consolidated and archived after sprint ends

**Lifecycle:**
- Automatically move to `.claude/archive/` after 30 days
- File Lifecycle Management handles this automatically
- Mark with `file_class: ephemeral` in frontmatter

**Example Frontmatter:**
```markdown
---
file_class: ephemeral
expires_after_days: 30
tags: [implementation, temp]
---

# Task 5 Implementation Notes

[Temporary notes here]
```

---

### TIER 0: PROHIBITED (Never Generate)

These are documentation theatre - **NEVER CREATE THESE:**

**❌ Verbose Session Summaries**
```markdown
# Session Summary - November 14, 2025

Today we accomplished:
- Task 1: Implemented feature X
  - Created file A
  - Modified file B
  - Added tests
- Task 2: Fixed bug Y
  - Identified root cause
  - Applied fix
  - Verified solution
  
[10 pages of obvious play-by-play]
```
**Why Forbidden:** Git commit history provides this. If you need summaries, they belong in task management (Taskmaster), not separate files.

**❌ Per-Task Completion Documents**
```
TASK_1_COMPLETE.md
TASK_2_COMPLETE.md
TASK_3_COMPLETE.md
```
**Why Forbidden:** Taskmaster already tracks task status. Creating separate files is pure redundancy.

**❌ Step-by-Step Implementation Logs**
```markdown
## Step-by-Step Changes

Step 1: Opened lib/utils/helper.js
Step 2: Located the processData function
Step 3: Added validation on line 45
Step 4: Added error handling on line 50
...
```
**Why Forbidden:** Git diff shows this. Nobody needs the play-by-play.

**❌ Duplicate API Documentation**
```
docs/api/users.md          ← Manual
src/api/users.js           ← Code comments
generated/api-docs.html    ← Auto-generated
```
**Why Forbidden:** Pick ONE source of truth (ideally auto-generated from code comments). Delete the rest.

**❌ Progress Reports Without Audience**
```
SPRINT_1_PROGRESS.md
SPRINT_1_80_PERCENT_COMPLETE.md
SPRINT_1_FINAL_STATUS.md
```
**Why Forbidden:** If nobody reads them (stakeholders, team leads), don't create them. Solo developers DON'T need progress reports for themselves.

---

## Decision Tree: Should I Create This Document?

```
START
  ↓
Is this user-facing documentation?
  ├─ YES → Tier 1: Create in Docs/ or README
  └─ NO → Continue
       ↓
Will this be needed in 6+ months?
  ├─ YES → Tier 1: Create in Docs/
  └─ NO → Continue
       ↓
Is this information already captured elsewhere?
  ├─ YES (Git commits) → Don't create
  ├─ YES (Taskmaster) → Don't create
  ├─ YES (Code comments) → Don't create
  └─ NO → Continue
       ↓
Does someone other than me need this?
  ├─ NO → Don't create (you'll remember or re-discover)
  └─ YES → Continue
       ↓
Will it be stale in < 30 days?
  ├─ YES → Tier 2: Create with ephemeral frontmatter
  └─ NO → Tier 1: Create in Docs/
```

---

## Enforcement Guidelines

### For AI Assistants (This is You!)

**BEFORE generating any documentation:**

1. **Ask yourself:** Is this Tier 1, Tier 2, or Tier 3 (forbidden)?
2. **Check if it already exists:** Don't duplicate existing documentation
3. **Consider the audience:** Who will read this in 30+ days?
4. **Evaluate information density:** Is this mostly obvious or already captured?

**Default stance:** When in doubt, DON'T create documentation. Err on the side of less documentation, not more.

### Red Flags to Watch For

**🚩 Red Flag 1: User asks for "documentation"**

```
User: "Can you document what we just did?"
```

**Response Pattern:**
```
Instead of creating a separate document, I can:
1. Ensure commit messages are descriptive
2. Update the relevant section in README.md or Docs/
3. Add inline code comments where logic is complex

Which approach would be most useful for you?
```

**🚩 Red Flag 2: End of session**

```
[End of long implementation session]
```

**DON'T:**
```markdown
# Create SESSION_SUMMARY_NOV_14_2025.md with 10 pages
```

**DO:**
```bash
# Write one good commit message
git commit -m "feat: implement user authentication

- Added JWT token generation
- Implemented password hashing with bcrypt
- Created authentication middleware
- Added tests for auth flow

Closes #123"
```

**🚩 Red Flag 3: Task completion**

```
User: "Task 5 is done"
```

**DON'T:**
```markdown
# Create TASK_5_COMPLETE.md
```

**DO:**
```bash
# Update task status in Taskmaster
task-master set-status --id=5 --status=done

# Commit changes with reference
git commit -m "feat(auth): complete task 5 - user authentication"
```

**🚩 Red Flag 4: Multiple versions**

```
Existing files:
- API_GUIDE.md
- API_GUIDE_V2.md
- API_GUIDE_UPDATED.md
```

**Action:**
```
1. Consolidate into ONE file: Docs/API.md
2. Delete the versions (no V1, V2, V3)
3. Use git history for version tracking
4. Update, don't create new versions
```

---

## Better Alternatives to Documentation

### Instead of Session Summaries → Use Git

**❌ DON'T:**
```markdown
# Session Summary - Nov 14

## Tasks Completed
- Implemented authentication
- Fixed database bug
- Updated tests

## Files Modified
- src/auth.js
- src/db.js
- tests/auth.test.js
```

**✅ DO:**
```bash
# Descriptive commit messages
git commit -m "feat(auth): implement JWT authentication

- Added token generation with 1h expiration
- Implemented refresh token rotation
- Added authentication middleware
- Tests for happy path and edge cases"

git commit -m "fix(db): resolve connection pool exhaustion

Root cause: Connections not released after failed queries
Solution: Added try-finally blocks to ensure cleanup"

# View history when needed
git log --oneline --graph --all
```

### Instead of Task Completion Docs → Use Taskmaster

**❌ DON'T:**
```
TASK_1_COMPLETE.md
TASK_2_COMPLETE.md
TASK_3_COMPLETE.md
```

**✅ DO:**
```bash
# Update task status
task-master set-status --id=1 --status=done

# Add implementation notes to task (if needed)
task-master update-subtask --id=1.2 --prompt="Used bcrypt with cost factor 12. JWT expiry set to 1h based on security review."

# View task status
task-master list
```

### Instead of Implementation Logs → Use Code Comments

**❌ DON'T:**
```markdown
# IMPLEMENTATION_LOG.md

## processData Function Changes
1. Added validation for null inputs on line 45
2. Added try-catch for JSON parsing on line 50
3. Added logging for failures on line 55
```

**✅ DO:**
```javascript
// lib/utils/helper.js

/**
 * Process user data with validation and error handling
 * @param {Object} data - Raw user data
 * @returns {Object} Processed data
 * @throws {ValidationError} If data is invalid
 */
function processData(data) {
  // Validate input (null check prevents downstream errors)
  if (!data) {
    throw new ValidationError('Data cannot be null');
  }
  
  try {
    // Parse JSON (may fail if data.raw is malformed)
    return JSON.parse(data.raw);
  } catch (error) {
    // Log for debugging production issues
    logger.error('JSON parse failed', { data, error });
    throw new ParseError('Invalid JSON format');
  }
}
```

### Instead of Progress Reports → Use GitHub/Tools

**❌ DON'T:**
```
SPRINT_1_PROGRESS.md
SPRINT_1_80_PERCENT.md
SPRINT_1_COMPLETE.md
```

**✅ DO:**
```bash
# Use Taskmaster for status
task-master list --status=done
task-master next

# Use GitHub Projects/Issues for team visibility
gh issue list --label=sprint-1

# Use git stats for metrics (if needed)
git shortlog --since="2 weeks ago" --numbered --summary
```

---

## Special Cases: When More Documentation is Justified

### Open Source Projects

**More documentation is acceptable for:**
- Onboarding new contributors
- Complex setup procedures
- Non-obvious architecture decisions

**Still avoid:**
- Verbose implementation logs
- Duplicate documentation
- Per-commit summaries

### Team/Enterprise Projects

**More documentation is acceptable for:**
- Compliance requirements (security, audit)
- Onboarding new team members (runbooks)
- External stakeholder reports

**Still avoid:**
- Solo developer "progress reports"
- Documentation of obvious changes
- Play-by-play implementation logs

### Legacy Codebases

**More documentation is acceptable for:**
- Context AI assistants can't infer from code
- Historical decisions that aren't in git history
- Migration strategies from old to new

**Still avoid:**
- Re-documenting what's clear from code
- Verbose explanations of standard patterns

---

## Measuring Documentation Health

### Good Signals ✅

```bash
# Count documentation files
find Docs/ -type f -name "*.md" | wc -l
# Expected: 5-15 files for most projects

# Check documentation freshness
find Docs/ -type f -name "*.md" -mtime +180
# Expected: Only ADRs and stable architecture docs

# Check for bloat
find . -type f -name "*COMPLETE.md" | wc -l
# Expected: 0 (or < 5 if using Tier 2 properly)
```

### Bad Signals 🚩

```bash
# Too many documentation files
find . -type f -name "*.md" | wc -l
# Warning if: > 50 files

# Documentation graveyard
find . -type f -name "*SUMMARY*.md" | wc -l
find . -type f -name "*SESSION*.md" | wc -l
# Warning if: > 0

# Version proliferation
find . -type f -name "*V[0-9]*.md"
find . -type f -name "*_FINAL*.md"
# Warning if: > 0
```

---

## Migration: Cleaning Up Existing Bloat

### Audit Current Documentation

```bash
# Generate inventory
find . -type f -name "*.md" ! -path "./node_modules/*" ! -path "./.git/*" > doc-inventory.txt

# Categorize by pattern
grep -E "COMPLETE|SUMMARY|SESSION" doc-inventory.txt > bloat-candidates.txt
grep -E "V[0-9]|FINAL|REVISED" doc-inventory.txt >> bloat-candidates.txt

# Review candidates for deletion
cat bloat-candidates.txt
```

### Consolidation Strategy

**Step 1: Identify Duplicates**
```bash
# Find similar filenames
find Docs/ -type f -name "*.md" | sed 's/_V[0-9]*//' | sort | uniq -d
```

**Step 2: Keep Best Version**
- Newest content
- Most comprehensive
- Best organized

**Step 3: Delete Redundant Versions**
```bash
# Archive before deleting (optional)
mkdir -p .claude/archive/documentation-consolidation-$(date +%Y%m%d)
mv OLD_FILE.md .claude/archive/documentation-consolidation-$(date +%Y%m%d)/

# Or just delete
rm OLD_FILE_V1.md OLD_FILE_V2.md
```

**Step 4: Update References**
```bash
# Find and update references to old docs
rg "OLD_FILE" --type md
# Manually update to point to consolidated version
```

### Cleanup Checklist

- [ ] Delete all `*_COMPLETE.md` files (info is in git/Taskmaster)
- [ ] Delete all `*_SUMMARY.md` files (info is in git commits)
- [ ] Delete all `*_SESSION*.md` files (ephemeral, no lasting value)
- [ ] Consolidate duplicate API docs into ONE source
- [ ] Remove versioned docs (V1, V2, FINAL, etc.) - keep latest only
- [ ] Move surviving temporary docs to Tier 2 with expiration frontmatter
- [ ] Update any references to deleted docs
- [ ] Commit cleanup: `git commit -m "docs: remove documentation bloat"`

---

## Templates for Acceptable Documentation

### Tier 1: README.md Template

```markdown
# Project Name

Brief one-liner description.

## Quick Start

\`\`\`bash
npm install
npm start
\`\`\`

## Features

- Feature 1
- Feature 2

## Documentation

- [Architecture](./Docs/ARCHITECTURE.md)
- [API Reference](./Docs/API.md)
- [Contributing](./CONTRIBUTING.md)

## License

MIT
```

**Length:** 50-200 lines  
**Update Frequency:** With major changes only

### Tier 1: Architecture Document Template

```markdown
# Architecture

**Last Updated:** YYYY-MM-DD

## Overview

[One paragraph system description]

## System Diagram

[Mermaid diagram or ASCII art]

## Core Components

### Component 1
- Purpose: [one sentence]
- Tech: [framework/library]
- Location: [path]

### Component 2
...

## Data Flow

[Brief description or diagram]

## Key Decisions

See [ADR/](./ADR/) for detailed architectural decision records.

## Security

[Authentication, authorization, data protection]

## Deployment

[High-level deployment architecture]
```

**Length:** 100-500 lines  
**Update Frequency:** With major architectural changes

### Tier 1: ADR Template

```markdown
# ADR-001: Use PostgreSQL for Primary Database

**Status:** Accepted  
**Date:** 2025-11-14  
**Deciders:** [Names]

## Context

[Problem statement and constraints]

## Decision

We will use PostgreSQL as our primary database.

## Rationale

- **Requirement 1:** Need ACID compliance → PostgreSQL provides
- **Requirement 2:** Complex queries → PostgreSQL excellent support
- **Requirement 3:** Team familiarity → Team has PostgreSQL experience

## Consequences

**Positive:**
- Reliability and data integrity
- Rich feature set (JSON, full-text search)
- Strong ecosystem

**Negative:**
- Higher operational complexity than MongoDB
- Requires more DBA knowledge

## Alternatives Considered

- **MongoDB:** Rejected due to lack of ACID guarantees
- **MySQL:** Rejected due to weaker JSON support
```

**Length:** 100-300 lines per ADR  
**Update Frequency:** NEVER (immutable record)

### Tier 2: Temporary Implementation Note Template

```markdown
---
file_class: ephemeral
expires_after_days: 30
tags: [implementation, migration]
---

# Database Migration - Auth Schema

**Context:** Migrating auth from MongoDB to PostgreSQL (see ADR-003)  
**Timeline:** Nov 14 - Nov 28, 2025  
**Status:** In Progress

## Blockers

- [ ] Old sessions still reference MongoDB IDs
- [ ] Migration script needs testing with production data size

## Decisions Made

- Using UUID v4 for new user IDs (not auto-increment)
- Keeping old MongoDB IDs in `legacy_id` column for reconciliation

## Resources

- Migration script: `scripts/migrate-auth-schema.sql`
- Rollback plan: `Docs/RUNBOOKS.md#auth-migration-rollback`
```

**Length:** 50-200 lines  
**Lifespan:** Auto-archived after 30 days

---

## Token Cost Analysis

### Documentation Bloat Costs

**Example: Verbose Session Summary**
```
Average length: 2000 lines
Token cost: ~3000 tokens to generate
Time cost: 2-5 minutes
Value: Near-zero (redundant with git)
```

**Cost per 10 sessions:** 30,000 tokens ≈ $0.60 (Claude Sonnet 4.5)  
**Annual cost (weekly sessions):** 156,000 tokens ≈ $3.12

**But the real cost:**
- AI time wasted: ~50 minutes per week
- Human time reviewing: ~20 minutes per week
- Cognitive load browsing bloated project: Significant
- Maintenance burden: Hours when docs get stale

### Documentation Economy Savings

**After implementing this rule:**

- Reduce documentation generation by 80%
- Save ~40 minutes AI time per week
- Save ~15 minutes human time per week
- Cleaner project structure
- Less maintenance burden

**Annual savings:** ~47 hours developer time, $150+ in API costs

---

## Accountability Measures

### For AI Assistants

**Track your documentation generation:**

```
Session Start:
- Docs created last session: [count]
- Tier 1 (lasting value): [count]
- Tier 2 (temporary): [count]
- Tier 3 (forbidden): [count] ← Should be ZERO

Session End:
- Docs created this session: [count]
- Self-check: Did I violate documentation economy?
```

### For Developers

**Periodic documentation audits:**

```bash
# Monthly audit
find . -name "*.md" -mtime -30 ! -path "./node_modules/*" | wc -l

# If count > 10, ask:
# - How many are Tier 1 (keep)?
# - How many are Tier 2 (archive soon)?
# - How many are Tier 3 (delete now)?
```

---

## Summary

### The Golden Rules

1. **Default to NO documentation** - Err on the side of less
2. **Never duplicate** - One source of truth only
3. **Never version documents** - Update in place, use git for history
4. **Use existing tools** - Git, Taskmaster, code comments
5. **Tier 1 only for lasting value** - 6+ month lifespan
6. **Tier 2 with expiration** - Temporary notes expire automatically
7. **Never Tier 3** - Session summaries and completion docs are forbidden

### Quick Decision Matrix

| Question | Answer | Action |
|----------|--------|--------|
| User-facing docs? | Yes | Create in `Docs/` or `README.md` |
| Needed in 6+ months? | Yes | Create in `Docs/` |
| Already in git/Taskmaster/code? | Yes | **Don't create** |
| Session summary? | - | **Never create** |
| Task completion doc? | - | **Never create** |
| Temporary notes? | Yes | Create with expiration frontmatter |

### Enforcement

**AI Assistants:** Proactively suggest AGAINST creating documentation. When user asks for docs, offer better alternatives (git commits, task updates, code comments).

**Developers:** Monthly audit to identify and remove bloat. Use File Lifecycle Management to auto-archive ephemeral docs.

---

**Rule Version:** 1.0.0  
**Created:** November 14, 2025  
**Last Updated:** November 14, 2025  
**Applies To:** All diet103 projects  
**Token Savings:** Estimated 80% reduction in documentation generation

---

*"The best documentation is no documentation. The second-best is documentation that writes itself from code. The third-best is concise, lasting documentation in `Docs/`. Everything else is bloat."*

