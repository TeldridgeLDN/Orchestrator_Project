---
name: architecture-docs
description: Create architecture.md and claude.md documentation for AI-assisted development. Use when setting up a new codebase for AI pair programming, onboarding AI to an existing project, or when asked to document architecture patterns, create development guidelines, or generate context for Claude Code / AI assistants.
---

# Architecture Documentation for AI-Assisted Development

## Overview

This skill creates two complementary documents that transform Claude from a general-purpose assistant into a specialized collaborator who understands your codebase:

1. **architecture.md** — The "what" and "why": system design, patterns, decisions, constraints
2. **claude.md** — The "how" and "when": workflow instructions, code templates, anti-patterns

Think of these as the document you'd want when onboarding a senior developer who's never seen your codebase—except optimized for AI context windows.

## When to Use

**Use this skill when:**
- Setting up a new project for AI-assisted development
- Onboarding Claude Code to an existing codebase
- User asks to "document the architecture" or "create development guidelines"
- User wants to establish TDD, coding standards, or workflow conventions
- Migrating a codebase (e.g., Python → Rust) and needs context captured

**Do NOT use when:**
- Writing user-facing documentation (use docx skill instead)
- Creating API documentation (different format)
- Quick code reviews without establishing patterns

## The Two-Document System

### architecture.md — System Context

**Purpose:** Explain the system's intended design so Claude understands architectural intent, not just current code state.

**Contents:**
- Design patterns and architecture style (hexagonal, layered, etc.)
- Component relationships with ASCII diagrams
- Layer responsibilities and boundaries
- Decision records explaining "why" (e.g., "why rusqlite over sqlx")
- Code examples showing preferred patterns
- References to ADRs for deeper context

### claude.md — Working Instructions

**Purpose:** Tell Claude exactly how to work in this codebase—workflow, TDD, commits, templates.

**Contents:**
- Workflow instructions (TDD cycle, commit conventions, PR standards)
- Code templates for common patterns (entities, value objects, ports)
- Anti-patterns with "what NOT to do" examples
- Quality gates and verification checklists
- Domain-specific constraints or gotchas

## Process

### Phase 1: Discovery

Before writing, gather context:

1. **Codebase Review** — Scan directory structure, key files, dependencies
2. **Pattern Detection** — Identify existing architecture patterns
3. **Decision Archaeology** — Find implicit decisions in code structure
4. **User Interview** — Ask clarifying questions:
   - "What architecture pattern are you following or want to follow?"
   - "What are the non-negotiable principles (TDD, immutability, etc.)?"
   - "What mistakes do you want Claude to avoid?"
   - "Are there existing ADRs or design docs I should reference?"

### Phase 2: architecture.md Creation

Structure the document:

```markdown
# [Project Name] Architecture

## Overview
[2-3 sentences: what this system does and its core architectural approach]

## Architecture Pattern
[Name the pattern (hexagonal, clean, layered) and explain key principles]

## Component Diagram
```
[ASCII diagram showing major components and their relationships]
```

## Layer Responsibilities

### [Layer 1 Name]
- Purpose: [what this layer does]
- Contains: [what lives here]
- Dependencies: [what it can/cannot depend on]

### [Layer 2 Name]
[repeat pattern]

## Key Patterns

### [Pattern Name]
**When to use:** [context]
**Example:**
```[language]
[code example]
```

## Architecture Decision Records

### ADR-001: [Decision Title]
**Context:** [why this decision was needed]
**Decision:** [what was decided]
**Consequences:** [trade-offs accepted]

[Reference external ADRs if they exist: See `docs/adr/` for full records]

## Constraints
- [Technical constraints]
- [Business constraints]
- [Performance requirements]
```

### Phase 3: claude.md Creation

Structure the document:

```markdown
# Claude Development Guidelines

## Core Principles
[List 3-5 non-negotiable principles, e.g., TDD, immutability]

## Workflow

### Development Cycle
1. [Step-by-step workflow, e.g., RED-GREEN-REFACTOR]

### Before Every Commit
- [ ] [Verification checklist item]
- [ ] [Another item]

### Commit Conventions
[Format and examples]

## Code Patterns

### [Pattern Name] Template
```[language]
[reusable template with placeholders]
```

### Factory Functions (Testing)
```[language]
[example of preferred test data creation]
```

## Anti-Patterns

### ❌ [Bad Pattern Name]
```[language]
// DON'T do this
[bad example]
```

### ✅ Instead
```[language]
// DO this
[good example]
```

## Domain-Specific Rules
- [Domain constraint 1]
- [Domain constraint 2]

## Gotchas
- [Non-obvious behavior 1]
- [Setup quirk]
```

## Best Practices

**For architecture.md:**
- Include ASCII diagrams for component relationships
- Show concrete code examples, not abstract descriptions
- Explain "why" decisions were made, not just "what"
- Reference ADRs for detailed decision context
- Keep it updated as architecture evolves

**For claude.md:**
- Be explicit about workflow (Claude follows instructions literally)
- Include both patterns AND anti-patterns with examples
- Use imperative language: "Always do X" not "You might want to X"
- Include verification methods (how to check compliance)
- Provide templates that Claude can copy and adapt

**General principles:**
- Concise over verbose—respect the context window
- Examples over explanations—Claude learns from patterns
- Living documents—update as you discover what context Claude needs
- Assume competence—don't explain basics Claude already knows

## Example Prompts to User

When starting this skill, ask targeted questions:

**For new projects:**
> "What architecture pattern will this project follow? (hexagonal, clean, layered, etc.)"
> "What are your non-negotiable development principles? (TDD, functional, specific testing approach)"
> "What's the tech stack, and were there specific reasons for those choices?"

**For existing codebases:**
> "I'll do a thorough review of the codebase first. Are there any existing docs, ADRs, or READMEs I should prioritize?"
> "What patterns are you trying to enforce that might not be obvious from the code?"
> "What mistakes have you made that you want Claude to avoid repeating?"

**For migrations:**
> "What's the source and target (e.g., Python → Rust)?"
> "What patterns from the source should be preserved vs. reconsidered?"
> "Are there architectural improvements you want to make during migration?"

## Output Location

Save documents to project root or `.claude/` directory:
- `architecture.md` or `.claude/architecture.md`
- `CLAUDE.md` or `.claude/CLAUDE.md`

If using `.claude/` directory, also create supporting docs if needed:
- `.claude/docs/testing.md`
- `.claude/docs/workflow.md`
- `.claude/docs/patterns.md`

## References

See `references/` folder for:
- `architecture-template.md` — Full architecture.md template
- `claude-template.md` — Full claude.md template
- `patterns-catalog.md` — Common architecture patterns with diagrams
- `anti-patterns-catalog.md` — Common anti-patterns to include
