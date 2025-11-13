# Documentation Framework & Decision Rules

**Purpose:** Define clear rules for WHEN to document, WHAT to document, and HOW to structure documentation.

**Philosophy:** Document for readers, not for ritual. Every document must serve a purpose.

---

## Table of Contents

1. [Documentation Decision Tree](#documentation-decision-tree)
2. [Documentation Types & Triggers](#documentation-types--triggers)
3. [Template Selection Guide](#template-selection-guide)
4. [Lifecycle Management](#lifecycle-management)
5. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## Documentation Decision Tree

Use this decision tree to determine if documentation is needed:

```
┌─────────────────────────────────────┐
│  Task/Work Completed                │
└──────────────┬──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Is this PUBLIC API   │───YES──► Create API Documentation
    │ or USER-FACING?      │
    └──────────┬───────────┘
               │ NO
               ▼
    ┌──────────────────────┐
    │ Does this CHANGE     │───YES──► Update Architecture Doc
    │ SYSTEM ARCHITECTURE? │
    └──────────┬───────────┘
               │ NO
               ▼
    ┌──────────────────────┐
    │ Is this CRITICAL for │───YES──► Create Implementation Guide
    │ FUTURE MAINTENANCE?  │
    └──────────┬───────────┘
               │ NO
               ▼
    ┌──────────────────────┐
    │ Will OTHERS need to  │───YES──► Create Quick Reference
    │ UNDERSTAND/USE this? │
    └──────────┬───────────┘
               │ NO
               ▼
    ┌──────────────────────┐
    │ Is this a MILESTONE  │───YES──► Create Milestone Summary
    │ (Epic/Phase complete)│
    └──────────┬───────────┘
               │ NO
               ▼
         ┌────────────┐
         │ NO DOCS    │
         │ NEEDED     │
         │            │
         │ Log in git │
         │ commit msg │
         └────────────┘
```

---

## Documentation Types & Triggers

### Type 1: Architecture Documentation

**TRIGGER:**
- System design changes
- New major components
- Significant refactoring
- Integration patterns

**EXAMPLES:**
- ✅ "New MCP integration layer" → Document
- ✅ "Switched from monolith to modular" → Document
- ❌ "Fixed bug in validation" → No doc needed

**TEMPLATE:** `ARCHITECTURE.md`

**LOCATION:** `Docs/ARCHITECTURE.md` (project-level) or `path/to/feature/ARCHITECTURE.md` (feature-level)

**LIFESPAN:** Permanent (update as system evolves)

---

### Type 2: Implementation Guide

**TRIGGER:**
- Complex implementation that others will maintain
- Non-obvious design decisions
- Critical algorithms or workflows
- Integration with external systems

**EXAMPLES:**
- ✅ "Context monitor with token tracking" → Document
- ✅ "Scaffold workflow with rollback" → Document
- ❌ "Added error logging" → No doc needed

**TEMPLATE:** `IMPLEMENTATION_GUIDE.md`

**LOCATION:** `Docs/` or `.taskmaster/docs/`

**LIFESPAN:** Permanent (until feature is deprecated)

---

### Type 3: User/Developer Guide

**TRIGGER:**
- New CLI commands
- New workflows
- Configuration changes that users need to know
- Public APIs

**EXAMPLES:**
- ✅ "New `scaffold` command" → Document
- ✅ "Changed config structure" → Document
- ❌ "Refactored internal function" → No doc needed

**TEMPLATE:** `USER_GUIDE.md` or `QUICK_START.md`

**LOCATION:** `Docs/` (user-facing)

**LIFESPAN:** Permanent (update as features evolve)

---

### Type 4: Milestone Summary

**TRIGGER:**
- Epic completion (multiple related tasks)
- Phase completion (major project phase)
- Release milestones

**EXAMPLES:**
- ✅ "Phase 1 Model Selection Complete" → Document
- ✅ "DIET103 Integration Complete" → Document
- ❌ "Completed Task 7" → No doc needed

**TEMPLATE:** `MILESTONE_SUMMARY.md`

**LOCATION:** Root directory or `Docs/`

**LIFESPAN:** Archive after 30 days (move to `Docs/archive/milestones/`)

---

### Type 5: Quick Reference

**TRIGGER:**
- Frequently used commands/patterns
- Cheat sheets for complex workflows
- Troubleshooting guides

**EXAMPLES:**
- ✅ "DIET103 Quick Reference" → Document
- ✅ "MCP Integration Checklist" → Document
- ❌ "How I fixed this one bug" → No doc needed

**TEMPLATE:** `QUICK_REFERENCE.md`

**LOCATION:** `Docs/`

**LIFESPAN:** Permanent (update as needed)

---

### Type 6: API Documentation

**TRIGGER:**
- Public APIs
- Reusable libraries
- MCP server tools

**EXAMPLES:**
- ✅ "New MCP tool added" → Document
- ✅ "Public JavaScript library" → Document
- ❌ "Internal utility function" → No doc needed

**TEMPLATE:** `API_REFERENCE.md`

**LOCATION:** `Docs/` or feature directory

**LIFESPAN:** Permanent (tied to API lifecycle)

---

### Type 7: Decision Log (ADR)

**TRIGGER:**
- Significant architectural decisions
- Technology choices
- Trade-off analysis

**EXAMPLES:**
- ✅ "Why we chose Perplexity over Claude for research" → Document
- ✅ "Why hooks over sub-agents" → Document
- ❌ "Chose variable name 'result'" → No doc needed

**TEMPLATE:** `ADR_TEMPLATE.md`

**LOCATION:** `Docs/decisions/`

**LIFESPAN:** Permanent (historical record)

---

## Template Selection Guide

### When to Use Each Template

| Situation | Template | Reason |
|-----------|----------|--------|
| New system architecture | `ARCHITECTURE.md` | Explains design patterns |
| Complex feature completed | `IMPLEMENTATION_GUIDE.md` | Helps future maintenance |
| New CLI command | `USER_GUIDE.md` or `CLI_REFERENCE.md` | User-facing feature |
| Epic/Phase done | `MILESTONE_SUMMARY.md` | Tracks progress |
| Frequently asked questions | `QUICK_REFERENCE.md` | Fast lookup |
| Public API/Library | `API_REFERENCE.md` | Developer reference |
| Major tech decision | `ADR_TEMPLATE.md` | Historical context |

---

## Lifecycle Management

### Ephemeral vs. Permanent Documentation

#### Permanent (Keep Forever)
- Architecture documentation
- User guides
- API references
- Quick references
- ADRs (decision logs)

**Location:** `Docs/` (main directory)

---

#### Semi-Permanent (Keep 30-90 Days)
- Milestone summaries
- Implementation guides (after feature is stable)

**Lifecycle:**
1. Created in root or `Docs/`
2. After 30 days → Move to `Docs/archive/YYYY-MM/`
3. After 90 days → Delete or consolidate into permanent docs

---

#### Session-Based (Keep 7-14 Days)
- Session summaries
- Context handoffs
- Task completion summaries (individual tasks)

**Lifecycle:**
1. Created in `.claude/docs/sessions/YYYY-MM/`
2. After 7 days → Review for valuable content
3. Extract important info into permanent docs
4. After 14 days → Delete

---

### Automated Cleanup Rules

```javascript
// Suggested hook: .claude/hooks/DocumentationLifecycle.js

// Rule 1: Archive milestone docs after 30 days
if (doc.type === 'MILESTONE' && age > 30) {
  moveTo('Docs/archive/milestones/');
}

// Rule 2: Delete session docs after 14 days
if (doc.type === 'SESSION' && age > 14) {
  delete();
}

// Rule 3: Consolidate implementation guides after feature stabilizes
if (doc.type === 'IMPLEMENTATION' && featureStable && age > 90) {
  consolidateInto('Docs/ARCHITECTURE.md');
  delete();
}
```

---

## Anti-Patterns to Avoid

### ❌ Don't Document These

1. **Individual Task Completions** (unless they're milestones)
   - Bad: `TASK_7_COMPLETE.md`
   - Good: Git commit message

2. **Obvious Changes**
   - Bad: "Added error handling to function X"
   - Good: Inline code comments

3. **Implementation Details That Change Frequently**
   - Bad: "Function uses Array.map instead of for loop"
   - Good: Code is self-documenting

4. **Personal Notes**
   - Bad: "Today I learned X while fixing Y"
   - Good: Keep in personal notebook, not project docs

5. **Duplicate Information**
   - Bad: Same info in `README.md` and `USER_GUIDE.md`
   - Good: Link from README to detailed guide

---

### ✅ Good Documentation Practices

1. **Single Source of Truth**
   - Each concept documented in ONE place
   - Link to it from elsewhere

2. **Update Existing Docs Instead of Creating New Ones**
   - Don't create `TASK_X_SUMMARY.md` for every task
   - Update relevant section in `ARCHITECTURE.md` or `IMPLEMENTATION_GUIDE.md`

3. **Write for Your Future Self**
   - Assume you'll forget everything in 6 months
   - Would this doc help you then?

4. **Test Your Documentation**
   - Can a new developer follow it?
   - Are there any missing steps?

---

## Documentation Templates

All templates are located in `templates/documentation/`:

- `ARCHITECTURE.md` - System design documentation
- `IMPLEMENTATION_GUIDE.md` - Complex feature implementation
- `USER_GUIDE.md` - End-user documentation
- `QUICK_REFERENCE.md` - Cheat sheets
- `MILESTONE_SUMMARY.md` - Epic/phase completion
- `API_REFERENCE.md` - Public API documentation
- `ADR_TEMPLATE.md` - Architecture Decision Records

---

## Example: Applying the Framework

### Scenario 1: Completed a Bug Fix

**Question:** Should I document this?

**Decision Tree:**
- ❌ Not public API
- ❌ Doesn't change architecture
- ❌ Not critical for maintenance (it's a bug fix)
- ❌ Others don't need special understanding
- ❌ Not a milestone

**Answer:** NO DOCUMENTATION NEEDED

**Action:**
```bash
git commit -m "fix: Corrected validation logic in scenario parser

- Fixed edge case where empty arrays weren't handled
- Added test coverage for empty input
- Resolves #123"
```

---

### Scenario 2: Completed Scaffold Workflow Feature

**Question:** Should I document this?

**Decision Tree:**
- ✅ User-facing (CLI command)
- ✅ Changes architecture (new workflow system)
- ✅ Critical for maintenance
- ✅ Others need to understand/use it
- ✅ Milestone (major feature)

**Answer:** MULTIPLE DOCS NEEDED

**Actions:**
1. **Update CLI Reference** (`Docs/SCENARIO_CLI.md`)
   - Add scaffold command documentation
   
2. **Create Implementation Guide** (`Docs/SCAFFOLD_IMPLEMENTATION.md`)
   - Explain rollback mechanism
   - Document template engine
   
3. **Create Milestone Summary** (`SCAFFOLD_FEATURE_COMPLETE.md` → archive after 30 days)
   - Summarize what was built
   - Link to other docs
   
4. **Update Architecture Doc** (`Docs/ARCHITECTURE.md`)
   - Add workflow system section

---

### Scenario 3: Refactored Internal Module

**Question:** Should I document this?

**Decision Tree:**
- ❌ Not public API
- ⚠️ Might affect architecture (check if design pattern changed)
- ⚠️ Might be critical for maintenance (check if complex)
- ❌ Others don't need to understand (internal refactor)
- ❌ Not a milestone

**Answer:** CONDITIONAL

**If simple refactor:**
- NO DOCUMENTATION (just git commit)

**If complex refactor with new patterns:**
- Update `Docs/ARCHITECTURE.md` with new patterns
- Add inline code comments for tricky parts

---

## Integration with TaskMaster

When completing tasks in TaskMaster, use these guidelines:

### In Task Details

```json
{
  "id": 71,
  "title": "Implement scaffold_components Workflow",
  "documentationNeeded": [
    "USER_GUIDE",
    "IMPLEMENTATION_GUIDE",
    "MILESTONE_SUMMARY"
  ],
  "documentationRationale": "Major user-facing feature with complex implementation"
}
```

### In Subtask Updates

Instead of creating summary docs, update task details:

```bash
# Good: Update task with findings
task-master update-subtask --id=71.5 --prompt="
Implemented rollback mechanism using backup files.
Key decisions:
- Chose file-based backups over in-memory (safer)
- 5-minute cleanup window to prevent disk fill
- Atomic operations via fs.rename
"

# Bad: Create separate doc
# TASK_71_5_COMPLETE.md ❌
```

---

## Summary: The Golden Rules

1. **Document for readers, not for ritual**
2. **When in doubt, DON'T document** (err on side of less)
3. **Update existing docs > Create new docs**
4. **Git commits are documentation** (for small changes)
5. **Archive or delete ephemeral docs** (don't hoard)
6. **Test your docs** (can someone follow them?)
7. **One source of truth** (no duplication)

---

## Next Steps

1. Review existing documentation against this framework
2. Archive/delete docs that don't meet criteria
3. Create missing critical documentation
4. Set up automated lifecycle management
5. Add documentation decision to task templates

---

*This framework ensures documentation serves a purpose and doesn't become a maintenance burden.*

