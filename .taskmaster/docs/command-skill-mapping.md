# Command to Skill Workflows Migration Mapping

**Date:** 2025-11-09
**Task:** 61.1 - Inventory and Map Legacy Commands to Skill Domains

## Overview

This document maps all legacy commands from `~/.claude/commands/` to their appropriate skill domains under `~/.claude/skills/<skill>/workflows/` according to PAI v1.2.0 architecture.

---

## Existing Workflows (Already Migrated)

These workflows already exist in `~/.claude/skills/project_orchestrator/workflows/`:

| Workflow File | Purpose | Status |
|---------------|---------|--------|
| `create.md` | Create new project with orchestrator | ✅ Already migrated |
| `list.md` | List all registered projects | ✅ Already migrated |
| `register.md` | Register existing project | ✅ Already migrated |
| `remove.md` | Remove project from registry | ✅ Already migrated |
| `switch.md` | Switch between projects | ✅ Already migrated |
| `validate.md` | Validate project structure | ✅ Already migrated |

---

## Commands to Migrate

Total: 10 command files

### Group 1: Development Workflows

**Skill Domain:** `development`
**Target Directory:** `~/.claude/skills/development/workflows/`

| Command File | Purpose | Target Filename | Priority |
|--------------|---------|-----------------|----------|
| `build-and-fix.md` | Quality pipeline (format, lint, test, fix) | `build-and-fix.md` | HIGH |
| `check.md` | Comprehensive quality verification | `check.md` | HIGH |
| `code-review.md` | Architectural and quality code review | `code-review.md` | MEDIUM |
| `next.md` | Production-quality implementation workflow | `next.md` | HIGH |
| `prompt.md` | Synthesize complete prompts | `prompt.md` | LOW |

**Rationale:** These are general development workflows not specific to project orchestration. They focus on code quality, testing, review, and implementation processes.

---

### Group 2: Documentation Workflows

**Skill Domain:** `documentation`
**Target Directory:** `~/.claude/skills/documentation/workflows/`

| Command File | Purpose | Target Filename | Priority |
|--------------|---------|-----------------|----------|
| `create-dev-docs.md` | Create dev docs for new features | `create-dev-docs.md` | MEDIUM |
| `update-dev-docs.md` | Update existing dev documentation | `update-dev-docs.md` | MEDIUM |

**Rationale:** These commands are specifically focused on documentation creation and maintenance using the dev docs system.

---

### Group 3: Portfolio-Specific Workflows

**Skill Domain:** `portfolio-optimization` (already exists)
**Target Directory:** `~/.claude/skills/portfolio-optimization/workflows/`

| Command File | Purpose | Target Filename | Priority |
|--------------|---------|-----------------|----------|
| `optimize-portfolio.md` | Run Enhanced Black-Litterman optimization | `optimize.md` | HIGH |
| `score-portfolio.md` | Score portfolio using Bayesian ensemble | `score.md` | HIGH |

**Rationale:** These are portfolio-specific operations that belong with the existing portfolio-optimization skill.

---

### Group 4: Project-Specific Workflow

**Skill Domain:** `workflow-execution` (already exists)
**Target Directory:** `~/.claude/skills/workflow-execution/workflows/`

| Command File | Purpose | Target Filename | Priority |
|--------------|---------|-----------------|----------|
| `workflow-9.md` | Execute specific workflow (project-specific) | `workflow-9.md` | LOW |

**Rationale:** This appears to be a numbered workflow that belongs with the workflow-execution skill.

---

## Migration Summary

### New Skills to Create

1. **`development`** - General development workflows (5 commands)
   - Already exists as a skill concept, just needs workflows directory
   
2. **`documentation`** - Documentation management (2 commands)
   - New skill to create

### Existing Skills to Extend

1. **`portfolio-optimization`** - Add 2 workflow files
2. **`workflow-execution`** - Add 1 workflow file

### Skills to Keep As-Is

1. **`project_orchestrator`** - Already has 6 workflows migrated

---

## Directory Structure (Target State)

```
~/.claude/
├── commands/
│   └── README.md (deprecation notice)
└── skills/
    ├── project_orchestrator/
    │   └── workflows/
    │       ├── create.md ✅
    │       ├── list.md ✅
    │       ├── register.md ✅
    │       ├── remove.md ✅
    │       ├── switch.md ✅
    │       └── validate.md ✅
    ├── development/
    │   ├── metadata.json (create)
    │   └── workflows/
    │       ├── build-and-fix.md (move)
    │       ├── check.md (move)
    │       ├── code-review.md (move)
    │       ├── next.md (move)
    │       └── prompt.md (move)
    ├── documentation/
    │   ├── metadata.json (create)
    │   └── workflows/
    │       ├── create-dev-docs.md (move)
    │       └── update-dev-docs.md (move)
    ├── portfolio-optimization/
    │   └── workflows/
    │       ├── optimize.md (move, rename)
    │       └── score.md (move, rename)
    └── workflow-execution/
        └── workflows/
            └── workflow-9.md (move)
```

---

## Migration Checklist

### Pre-Migration
- [x] Inventory all command files
- [x] Analyze command purposes
- [x] Determine skill groupings
- [x] Check existing skill directories
- [x] Document mapping decisions

### During Migration (Next Subtasks)
- [ ] Create `development` skill directory structure
- [ ] Create `documentation` skill directory structure
- [ ] Create metadata.json for new skills
- [ ] Move files to new locations
- [ ] Update internal references
- [ ] Create deprecation notice

### Post-Migration
- [ ] Test command resolution
- [ ] Update documentation
- [ ] Verify backward compatibility
- [ ] Remove old command files

---

## Notes

1. **Naming Convention:** Some files will be renamed during migration for consistency:
   - `optimize-portfolio.md` → `optimize.md` (skill name already indicates portfolio)
   - `score-portfolio.md` → `score.md` (skill name already indicates portfolio)

2. **Backward Compatibility:** All commands must remain accessible via their original names through CLI routing layer.

3. **Priority Levels:**
   - **HIGH:** Critical workflows used frequently
   - **MEDIUM:** Important but less frequent
   - **LOW:** Specialized or rarely used

4. **Testing Strategy:** Each migrated command must be tested via:
   - Natural language invocation
   - Direct workflow file execution
   - Legacy command name (via compatibility layer)

---

**Status:** ✅ Mapping Complete
**Next Step:** Proceed to subtask 61.2 (File Movement and Restructuring)

