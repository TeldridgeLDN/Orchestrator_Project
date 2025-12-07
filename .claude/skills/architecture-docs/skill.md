# Architecture Documentation Skill

**Version:** 1.0.0  
**Scope:** All projects  
**Auto-Activation:** Project setup, documentation requests  
**Priority:** High  
**Token Footprint:** ~400 tokens (overview only)

---

## Purpose

Create comprehensive architecture documentation for AI-assisted development. This skill generates two complementary documents that transform Claude from a general-purpose assistant into a specialized collaborator who understands your codebase:

1. **architecture.md** — The "what" and "why": system design, patterns, decisions, constraints
2. **claude.md (CLAUDE.md)** — The "how" and "when": workflow instructions, code templates, anti-patterns

Think of these as the documents you'd want when onboarding a senior developer who's never seen your codebase—except optimized for AI context windows.

**Key Benefits:**
- Eliminate context-switching overhead
- Maintain consistent coding patterns across sessions
- Capture architectural decisions permanently
- Speed up AI onboarding to new projects
- Reduce "decision fatigue" and repeated explanations

---

## When This Skill Activates

### Trigger Phrases
- "document the architecture"
- "create architecture docs"
- "set up AI documentation"
- "create development guidelines"
- "document for Claude"
- "onboard AI to this project"
- "create CLAUDE.md"
- "TDD workflow documentation"
- "coding standards document"

### Context Requirements
- Starting a new project
- Onboarding Claude/AI to existing codebase
- Establishing TDD or coding standards
- Migrating codebase (e.g., Python → Rust)
- Creating development guidelines

---

## Quick Start

### Most Common Requests

#### 1. Full Documentation Suite
```
"Create architecture documentation for this project"
"Set up AI development guidelines"
```
→ Creates both architecture.md and CLAUDE.md

#### 2. Architecture Only
```
"Document the system architecture"
"Create an architecture.md for this codebase"
```
→ Creates architecture.md with system design

#### 3. Development Guidelines Only
```
"Create CLAUDE.md development guidelines"
"Set up TDD workflow documentation"
```
→ Creates CLAUDE.md with workflow and patterns

#### 4. Language-Specific
```
"Create Python development guidelines"
"Set up TypeScript architecture docs"
"Create React component guidelines"
```
→ Uses language-specific template

---

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

**When to create:** Project setup, major refactors, team onboarding

### CLAUDE.md — Working Instructions

**Purpose:** Tell Claude exactly how to work in this codebase—workflow, TDD, commits, templates.

**Contents:**
- Workflow instructions (TDD cycle, commit conventions, PR standards)
- Code templates for common patterns (entities, value objects, ports)
- Anti-patterns with "what NOT to do" examples
- Quality gates and verification checklists
- Domain-specific constraints or gotchas

**When to create:** Establishing coding standards, TDD adoption, team alignment

---

## Available Templates

### Base Templates (Language-Agnostic)

| Template | Purpose | Size |
|----------|---------|------|
| `architecture.md` | System architecture template | ~11KB |
| `claude-base.md` | Development guidelines base | ~13KB |
| `patterns-catalog.md` | Architecture patterns reference | ~21KB |
| `anti-patterns-catalog.md` | Common anti-patterns | ~16KB |

### Language-Specific Templates

| Language | Template | Key Patterns |
|----------|----------|--------------|
| **TypeScript** | `claude/typescript.md` | Zod, Result types, strict mode |
| **React** | `claude/react.md` | Hooks, React Query, Testing Library |
| **Python** | `claude/python.md` | Dataclasses, Protocol, asyncio |
| **Rust** | `claude/rust.md` | Ownership, Result<T,E>, thiserror |
| **Go** | `claude/go.md` | Interfaces, error handling, table tests |

**Request language-specific:**
```
"Create Python development guidelines"
"Set up React architecture documentation"
"Create Rust coding standards"
```

---

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

### Phase 2: Template Selection

Based on discovery:

1. **Detect project language** from package files
2. **Select base template** (architecture.md)
3. **Select language template** from `claude/` directory
4. **Identify customizations** needed

### Phase 3: Document Creation

Generate documentation:

1. **Create architecture.md** with system design
2. **Create CLAUDE.md** with language-appropriate patterns
3. **Add domain-specific rules** based on project
4. **Include gotchas** discovered during exploration

### Phase 4: Placement

Save documents to project root or `.claude/` directory:
- `architecture.md` or `.claude/architecture.md`
- `CLAUDE.md` or `.claude/CLAUDE.md`

---

## Template Quick Reference

### Architecture Patterns

Load with: "Show architecture patterns reference"

| Pattern | Best For | Trade-offs |
|---------|----------|------------|
| **Hexagonal** | Multiple integrations, testability | More boilerplate |
| **Clean** | Complex business rules, longevity | Learning curve |
| **Layered** | CRUD apps, rapid development | Can become tangled |
| **CQRS** | Different read/write needs | Complexity |
| **Event-Driven** | Decoupling, audit trails | Debugging difficulty |
| **Microservices** | Large teams, scaling | Operational complexity |
| **Modular Monolith** | Starting point, clear boundaries | Discipline required |

→ [View Patterns Catalog](../templates/patterns-catalog.md)

### Anti-Patterns Reference

Load with: "Show common anti-patterns"

**Categories:**
- Testing Anti-Patterns (implementation details, shared state)
- Code Structure (deep nesting, god classes)
- Mutation (direct array/object mutation)
- TypeScript-Specific (any, missing readonly)
- Architecture (anemic domain, leaky abstractions)

→ [View Anti-Patterns Catalog](../templates/anti-patterns-catalog.md)

---

## Integration with Other Skills

### With diet103 Validation

**Automatic Integration:**
- diet103 health checks now include architecture documentation
- Missing `architecture.md` or `CLAUDE.md` affects project health score
- Auto-repair can scaffold documentation from templates

### With Taskmaster

**Automatic Integration:**
- Can create tasks for implementing architecture patterns
- Documentation tasks can be tracked
- Progress logged to subtasks

### With doc-generator

**Complementary:**
- doc-generator creates API documentation
- architecture-docs creates system-level documentation
- Use together for comprehensive documentation

---

## Best Practices

### DO:
✅ **Ask discovery questions** before generating
```
"What architecture pattern are you following?"
"What are your non-negotiable principles?"
```

✅ **Use language-appropriate templates**
```
"Create Python development guidelines using the Python template"
```

✅ **Include concrete examples** from the codebase
```typescript
// Example from your codebase
class PaymentService { ... }
```

✅ **Document domain-specific rules**
```markdown
## Domain-Specific Rules
- All amounts stored in pence (integer)
- Customer IDs: `cust_[a-z0-9]{14}`
```

✅ **Keep documents living**
- Update as architecture evolves
- Add gotchas when discovered
- Refine anti-patterns based on mistakes

### DON'T:
❌ **Generate without understanding context**
- Always review codebase first
- Ask clarifying questions

❌ **Use wrong language template**
- Python patterns in TypeScript project
- React patterns for CLI tool

❌ **Duplicate existing documentation**
- Reference ADRs, don't copy
- Link to existing docs

❌ **Make documents too long**
- Respect context windows
- Use progressive disclosure

---

## Output Location

**Recommended placement:**

```
project/
├── architecture.md          # System architecture
├── CLAUDE.md               # Development guidelines
└── .claude/
    └── docs/               # Supporting documentation
        ├── adr/            # Architecture Decision Records
        └── patterns.md     # Project-specific patterns
```

**Alternative (centralized):**

```
project/
└── .claude/
    ├── architecture.md     # System architecture
    ├── CLAUDE.md          # Development guidelines
    └── docs/
        └── ...
```

---

## Customization Guide

### Adding Domain-Specific Rules

```markdown
## Domain-Specific Rules

- All monetary amounts stored in pence (integer), not pounds (float)
- Customer IDs follow format: `cust_[a-z0-9]{14}`
- Payment states: `pending` → `approved` | `rejected` → `settled`
- Audit events are immutable once created
```

### Adding Gotchas

```markdown
## Gotchas

- Stripe webhooks can arrive out of order — check state before processing
- PostgreSQL JSONB doesn't preserve key order
- Jest mock timers don't advance automatically
- Our API rate limits at 100 req/min per customer
```

### Extending Patterns

```markdown
### [Custom Pattern] Template
\`\`\`typescript
// Your custom template
\`\`\`

**When to use:** [guidance]
**Example:** [concrete example from codebase]
```

---

## Related Skills

- **doc-generator** — Generate API documentation from code
- **doc-validator** — Validate documentation completeness
- **frontend-design-system** — UI component specifications
- **react-component-analyzer** — Extract component patterns

---

## Quick Commands

```bash
# Full documentation
"Create architecture documentation for this project"

# Architecture only
"Document the system architecture"

# Language-specific guidelines
"Create TypeScript development guidelines"
"Create Python coding standards"
"Create React component guidelines"

# Pattern reference
"Show architecture patterns catalog"
"Show common anti-patterns"

# Update existing
"Update CLAUDE.md with new patterns we discovered"
"Add this gotcha to the architecture docs"
```

---

## File Structure

```
.claude/skills/architecture-docs/
├── skill.md                 # This file
├── metadata.json           # Skill metadata
└── resources/
    ├── discovery-questions.md    # Interview questions
    └── language-detection.md     # How to detect project language

.claude/templates/          # Shared templates
├── README.md               # Template usage guide
├── architecture.md         # Base architecture template
├── claude-base.md          # Base CLAUDE.md template
├── patterns-catalog.md     # Architecture patterns
├── anti-patterns-catalog.md # Anti-patterns catalog
└── claude/                 # Language-specific templates
    ├── typescript.md
    ├── react.md
    ├── python.md
    ├── rust.md
    └── go.md
```

---

**Auto-Activation Priority:** High  
**Progressive Disclosure:** Enabled  
**Token Footprint:** 400 tokens (overview)

---

**Last Updated:** December 7, 2025  
**Skill Maturity:** v1.0 (Complete Templates)

**Navigation:** [Templates](../templates/README.md) | [Patterns](../templates/patterns-catalog.md) | [Anti-Patterns](../templates/anti-patterns-catalog.md)
