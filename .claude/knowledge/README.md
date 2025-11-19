# Knowledge Base

**Pattern:** Miessler's Personal AI Infrastructure  
**Purpose:** Systematic capture of decisions, patterns, and reusable prompts  
**Status:** Active ✅

---

## Directory Structure

```
.claude/knowledge/
├── patterns/       # Recurring technical solutions
├── decisions/      # Architectural Decision Records (ADRs)
├── prompts/        # Reusable prompt templates
└── README.md      # This file
```

---

## What Goes Where

### Patterns (`patterns/`)

**Purpose:** Document recurring solutions to common problems

**When to Create:**
- Solved a problem more than once
- Found a useful technique
- Established a workflow that works
- Discovered a best practice

**Format:**
```markdown
# Pattern Name

## Problem
What problem does this solve?

## Solution
How do we solve it?

## When to Use
When should this pattern be applied?

## Example
Concrete example of usage

## Related
Links to related patterns, code, or docs
```

**Examples:**
- `global-rules-pattern.md` - How to sync rules globally
- `git-workflows.md` - Git branching strategies
- `error-handling.md` - Standard error handling approaches

---

### Decisions (`decisions/`)

**Purpose:** Document WHY architectural decisions were made

**Format:** Architecture Decision Records (ADRs)

**When to Create:**
- Choosing between alternatives
- Making architectural decisions
- Adopting new tools/patterns
- Changing existing approaches

**Format:**
```markdown
# ADR NNN: Decision Title

**Date:** YYYY-MM-DD
**Status:** Accepted/Rejected/Superseded
**Decision Makers:** Who decided

## Context
What is the issue we're addressing?

## Decision
What did we decide?

## Rationale
Why this choice?
Alternatives considered?

## Consequences
What are the implications?

## Review Date
When should we revisit this?
```

**Examples:**
- `001-taskmaster-integration.md` - Why Task Master AI
- `002-diet103-infrastructure.md` - Why diet103 pattern
- `003-global-rules-system.md` - Why global vs per-project

---

### Prompts (`prompts/`)

**Purpose:** Reusable prompt templates for common tasks

**When to Create:**
- Recurring prompt patterns
- Multi-step workflows
- Standard reviews/analyses
- Template structures

**Format:**
```markdown
# Prompt Name

**Purpose:** What this prompt does
**Use When:** When to use it

## Prompt
```
[Actual prompt text with placeholders]
```

## Variations
Different versions for different contexts

## Example Usage
How to actually use it
```

**Examples:**
- `code-review-prompt.md` - Standard code review
- `documentation-prompt.md` - Generate docs
- `refactoring-prompt.md` - Systematic refactoring

---

## Usage Patterns

### From Skills

Skills can reference knowledge:

```markdown
# My Skill

## Pattern Reference
See: `.claude/knowledge/patterns/auth-implementation.md`

For this project, we use JWT tokens...
```

### From Agents

Agents can leverage prompts:

```markdown
# Code Reviewer Agent

Use the standard prompt template:
`.claude/knowledge/prompts/code-review-prompt.md`

Customize severity levels based on...
```

### From Documentation

Link to decisions for context:

```markdown
# Why We Use Task Master

See ADR: `.claude/knowledge/decisions/001-taskmaster-integration.md`
```

---

## Maintenance

### Adding Knowledge

1. **Identify the Type**
   - Pattern? → `patterns/`
   - Decision? → `decisions/`
   - Prompt? → `prompts/`

2. **Use the Template**
   - Follow format above
   - Be specific and actionable
   - Include examples

3. **Link Relationships**
   - Reference related patterns
   - Link to code implementations
   - Connect to decisions

### Updating Knowledge

When solutions evolve:
- Update existing pattern
- Create new ADR (don't modify old ones)
- Mark superseded decisions

### Retiring Knowledge

When knowledge becomes obsolete:
- Don't delete (history is valuable)
- Mark as "Deprecated" or "Superseded"
- Point to replacement

---

## Current Inventory

### Patterns (1)
- `global-rules-pattern.md` - Global rules system

### Decisions (2)
- `001-taskmaster-integration.md` - Task management choice
- `002-diet103-infrastructure.md` - Infrastructure pattern

### Prompts (1)
- `code-review-prompt.md` - Code review template

---

## Benefits

### Personal

- **Memory Aid:** Never rediscover solutions
- **Consistency:** Apply same patterns everywhere
- **Efficiency:** Reuse prompts instead of recreating
- **Context:** Understand why decisions were made

### Team (Future)

- **Onboarding:** New members learn patterns quickly
- **Alignment:** Everyone uses same approaches
- **Documentation:** Living documentation
- **History:** Decision context preserved

---

## Integration

### With Global Knowledge

For cross-project patterns:
```
~/.orchestrator/global-knowledge/
├── patterns/              # Used in ALL projects
└── [project]/.claude/knowledge/
    └── patterns/          # This project's patterns
```

Reference global patterns from project knowledge:
```markdown
See global: ~/.orchestrator/global-knowledge/patterns/auth.md
Customized for this project: [specific details]
```

---

## Next Steps

### High-Value Additions

1. **Git Workflow Pattern** - Document your git practices
2. **Testing Strategy Pattern** - How you approach testing
3. **Error Handling Pattern** - Standard error approaches
4. **ADR 003** - Next architectural decision
5. **More Prompt Templates** - Refactoring, documentation, etc.

### Future Enhancements

- Index/search system
- Auto-generation from code
- Integration with agents
- Cross-project sharing

---

## References

- **Miessler's PAI:** https://github.com/danielmiessler/Personal_AI_Infrastructure
- **ADR Format:** https://adr.github.io/
- **Pattern Libraries:** https://refactoring.guru/design-patterns

---

**Created:** November 15, 2025  
**Last Updated:** November 15, 2025  
**Maintainer:** Tom Eldridge

