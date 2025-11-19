---
rule_version: 1.0.0
last_updated: 2025-11-18
authoritative_source: Orchestrator_Project
---

# Platform Primacy - Claude Rules Take Priority

**Priority:** Critical  
**Applies To:** All diet103 projects  
**AI Assistants:** Claude, Cursor, Windsurf, Cline, Roo, and all others

---

## Core Principle

**Claude rules (`.claude/rules/`) take precedence over all other AI assistant rules.**

This ensures consistency, platform agnosticism, and adherence to diet103 conventions across all AI coding assistants.

---

## Why This Matters

### Diet103 Philosophy

Based on Orchestrator PRD and diet103 specifications:

1. **Platform Agnostic**: Infrastructure should work with any AI coding assistant
2. **Canonical Location**: `.claude/` is the standard directory for all diet103 projects
3. **Consistency**: Same behavior regardless of which assistant is used

### Practical Benefits

- ✅ **Team Flexibility**: Developers can use different AI assistants
- ✅ **Future-Proof**: No vendor lock-in to specific assistants
- ✅ **Single Source of Truth**: One place to maintain rules
- ✅ **Easier Onboarding**: New team members see consistent behavior

---

## Priority Hierarchy

When multiple rule locations exist, follow this priority order:

```
1. .claude/rules/              ← HIGHEST PRIORITY (use this)
2. .cursor/rules/              ← Cursor-specific overrides only
3. .windsurf/rules/            ← Windsurf-specific overrides only
4. Other assistant rules       ← Assistant-specific overrides only
```

### Decision Matrix

| Scenario | Action |
|----------|--------|
| Creating **new rule** | ✅ Always create in `.claude/rules/` |
| Rule exists in **both** locations | ✅ Use `.claude/rules/` version, delete others |
| Need **assistant-specific** override | ⚠️ Only if truly necessary, document why |
| Migrating **existing rules** | ✅ Move to `.claude/rules/`, update references |

---

## Rule Format Standards

### ✅ DO: Use Standard Markdown

```markdown
# Rule Title

**Priority:** High/Medium/Low  
**Applies To:** All diet103 projects / Specific project types  
**AI Assistants:** Claude, Cursor, Windsurf, Cline, Roo, and all others

---

## Core Principle

[Rule description]

---

## Examples

[Concrete examples]
```

### ❌ DON'T: Use Assistant-Specific Frontmatter

```markdown
---
description: Rule description
globs: **/*.js
alwaysApply: true
---
```

**Why?** This frontmatter is Cursor-specific and won't work with other assistants.

---

## Implementation Guidelines

### For New Rules

```bash
# ✅ CORRECT: Create in platform-agnostic location
touch .claude/rules/your-new-rule.md

# ❌ WRONG: Create in assistant-specific location
touch .cursor/rules/your-new-rule.mdc
```

### For Existing Rules

```bash
# Migrate from assistant-specific to platform-agnostic
mv .cursor/rules/old-rule.mdc .claude/rules/old-rule.md

# Update frontmatter to standard markdown header
# Remove: ---\ndescription: ...\nglobs: ...\n---
# Add: # Rule Title with priority and compatibility info
```

### For Assistant-Specific Overrides

**Only create assistant-specific rules when:**
1. The override is truly necessary (e.g., different keyboard shortcuts)
2. You document WHY it's needed
3. You keep it minimal (just the override, not entire rule)

**Example legitimate override:**

```markdown
# .cursor/rules/cursor-shortcuts.mdc

---
description: Cursor-specific keyboard shortcuts (supplement to Claude rules)
alwaysApply: true
---

# Cursor Keyboard Shortcuts

**Note:** This supplements `.claude/rules/keyboard-shortcuts.md` 
with Cursor-specific bindings.

[Cursor-only shortcuts here]
```

---

## Common Scenarios

### Scenario 1: Conflicting Rules

**Problem:**
```
.claude/rules/coding-style.md     ← Says "use 2-space indentation"
.cursor/rules/coding-style.mdc    ← Says "use 4-space indentation"
```

**Resolution:**
1. Follow `.claude/rules/coding-style.md` (2-space indentation)
2. Delete `.cursor/rules/coding-style.mdc` (redundant)
3. If Cursor version is newer/better, update `.claude/` version and delete Cursor version

### Scenario 2: Assistant-Specific Feature

**Problem:**
```
.cursor/rules/cursor-composer.mdc  ← Describes Cursor Composer features
```

**Resolution:**
- ✅ Keep this one - it's legitimately Cursor-specific
- Document that it supplements Claude rules
- Keep it focused only on Cursor-specific features

### Scenario 3: New Team Member

**Problem:**
New developer joins, uses Windsurf instead of Cursor.

**Resolution:**
- ✅ They automatically get `.claude/rules/` (works with Windsurf)
- ✅ They don't see Cursor-specific rules (not relevant)
- ✅ Behavior is consistent with rest of team

---

## Migration Checklist

When migrating existing rules to platform-agnostic approach:

- [ ] Identify all rules in `.cursor/rules/`, `.windsurf/rules/`, etc.
- [ ] For each rule, ask:
  - [ ] Is this rule platform-agnostic? → Move to `.claude/rules/`
  - [ ] Is this rule assistant-specific? → Keep in assistant directory, document why
- [ ] Convert frontmatter to standard markdown headers
- [ ] Update any references in documentation
- [ ] Test with multiple AI assistants to verify compatibility
- [ ] Delete redundant copies

---

## Compatibility Matrix

| AI Assistant | Supports `.claude/rules/` | Notes |
|--------------|---------------------------|-------|
| **Claude Code** | ✅ Native | Automatically loads from `.claude/rules/` |
| **Cursor** | ✅ Compatible | Can reference via `.cursorrules` or symlinks |
| **Windsurf** | ✅ Native | Follows `.claude/` convention |
| **Cline** | ✅ Compatible | Follows diet103 structure |
| **Roo Code** | ✅ Native | Uses `.claude/` hierarchy |
| **Others** | ✅ Extensible | Can adopt diet103 conventions |

---

## Enforcement

### For AI Assistants (This is You!)

When you (the AI) encounter rules:

1. **Always check `.claude/rules/` first**
2. **If rule exists in both locations, use `.claude/` version**
3. **Alert user if conflicting rules exist**
4. **Suggest migration to `.claude/rules/` when you see assistant-specific rules**

**Example Alert:**

```
⚠️ RULE CONFLICT DETECTED

I found rules in multiple locations:
- .claude/rules/coding-style.md (says: 2-space indentation)
- .cursor/rules/coding-style.mdc (says: 4-space indentation)

Following `.claude/rules/` version (2-space indentation) per platform primacy rule.

Suggestion: Delete .cursor/rules/coding-style.mdc to avoid confusion.
```

### For Developers

When creating or updating rules:

1. **Default to `.claude/rules/` for all new rules**
2. **Use standard markdown format (no frontmatter)**
3. **Only create assistant-specific rules when absolutely necessary**
4. **Document reasoning for any assistant-specific overrides**

---

## Verification

### Check Your Current Rule Setup

```bash
# List all rule locations
find . -type f -path "*/.claude/rules/*" -o -path "*/.cursor/rules/*" -o -path "*/.windsurf/rules/*"

# Check for conflicts (same filename in multiple locations)
comm -12 \
  <(ls .claude/rules/ 2>/dev/null | sort) \
  <(ls .cursor/rules/ 2>/dev/null | sort)
```

### Expected Output for Well-Structured Project

```
.claude/rules/
├── platform-primacy.md          ✅ Platform-agnostic
├── file-lifecycle-standard.md   ✅ Platform-agnostic
├── coding-style.md              ✅ Platform-agnostic
└── team-conventions.md          ✅ Platform-agnostic

.cursor/rules/
├── cursor-shortcuts.mdc         ✅ Legitimately Cursor-specific
└── project-identity.mdc         ✅ Project-specific (Orchestrator_Project values)
```

---

## Documentation References

### Primary Documents

- **[PLATFORM_AGNOSTIC_UPDATE.md](../../PLATFORM_AGNOSTIC_UPDATE.md)** - Platform agnostic design rationale
- **[file-lifecycle-standard.md](./file-lifecycle-standard.md)** - Example of platform-agnostic rule

### Related Rules

- **[project-identity.mdc](../../.cursor/rules/project-identity.mdc)** - Project-specific validation (legitimately in `.cursor/`)

---

## Summary

**Platform Primacy Rule:**

- ✅ `.claude/rules/` is the canonical location for all rules
- ✅ Standard markdown format (no assistant-specific frontmatter)
- ✅ Assistant-specific rules only when truly necessary
- ✅ Claude rules take precedence over all other locations
- ✅ Enables platform-agnostic development with any AI assistant

**When in doubt, put rules in `.claude/rules/` using standard markdown.**

---

**Rule Version:** 1.0.0  
**Created:** November 14, 2025  
**Last Updated:** November 14, 2025  
**Applies To:** All diet103 projects  
**Compatible With:** Claude, Cursor, Windsurf, Cline, Roo, and all AI coding assistants

