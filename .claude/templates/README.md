# Architecture Documentation Templates

Templates for creating `architecture.md` and `claude.md` documentation for AI-assisted development.

## Quick Start

1. **Choose your language template** from `claude/` directory
2. **Copy and customize** the `architecture.md` template
3. **Combine** with language-specific `claude.md` guidelines

## Template Structure

```
templates/
├── README.md                    # This file
├── architecture.md              # Base architecture template (language-agnostic)
├── claude-base.md               # Base claude.md template (TypeScript-focused)
├── patterns-catalog.md          # Architecture patterns reference
├── anti-patterns-catalog.md     # Common anti-patterns to avoid
└── claude/                      # Language-specific claude.md templates
    ├── typescript.md           # TypeScript guidelines
    ├── react.md                # React/TypeScript guidelines
    ├── python.md               # Python guidelines
    ├── rust.md                 # Rust guidelines
    └── go.md                   # Go guidelines
```

## Usage

### For New Projects

1. **Determine project language/framework**
2. **Copy appropriate templates:**
   ```bash
   # For a React project
   cp .claude/templates/architecture.md ./architecture.md
   cp .claude/templates/claude/react.md ./CLAUDE.md
   
   # For a Python project
   cp .claude/templates/architecture.md ./architecture.md
   cp .claude/templates/claude/python.md ./CLAUDE.md
   
   # For a Rust project
   cp .claude/templates/architecture.md ./architecture.md
   cp .claude/templates/claude/rust.md ./CLAUDE.md
   ```

3. **Customize for your project:**
   - Fill in architecture.md with your system design
   - Adjust claude.md patterns to match your conventions
   - Add domain-specific rules and gotchas

### For Existing Projects

1. **Review codebase** to identify existing patterns
2. **Start with architecture.md** — document "what" and "why"
3. **Select closest language template** for claude.md base
4. **Customize** to match existing conventions

## Template Contents

### architecture.md
- System overview and purpose
- Architecture pattern (hexagonal, clean, layered, etc.)
- Component diagram (ASCII)
- Layer responsibilities
- Key patterns with code examples
- Architecture Decision Records (ADRs)
- Constraints (technical, business, operational)

### claude.md (Language-Specific)
- Core principles (TDD, immutability, etc.)
- Development workflow (RED-GREEN-REFACTOR)
- Code patterns with templates
- Anti-patterns with examples
- Language-specific rules
- Recommended libraries
- Testing guidelines

### patterns-catalog.md
Reference for common architecture patterns:
- Hexagonal Architecture
- Clean Architecture
- Layered Architecture
- CQRS
- Event-Driven
- Microservices
- Modular Monolith

### anti-patterns-catalog.md
Common mistakes to avoid:
- Testing implementation details
- Mutable state
- God classes/functions
- Deep nesting
- Magic numbers
- Anemic domain model
- Leaky abstractions

## Language Templates Comparison

| Feature | TypeScript | React | Python | Rust | Go |
|---------|------------|-------|--------|------|-----|
| Entity Pattern | Class-based | N/A | Dataclass | Struct | Struct |
| Value Object | Class-based | N/A | Frozen dataclass | Struct | Struct |
| Error Handling | Result type | React Query | Result type | Result<T,E> | error |
| Immutability | `readonly` | `useState` | `frozen=True` | Default | Explicit |
| Testing | Vitest | RTL + Vitest | pytest | cargo test | go test |
| Validation | Zod | Zod + RHF | Pydantic | Type system | validator |

## Customization Guide

### Adding Domain-Specific Rules

Add to the "Domain-Specific Rules" section:

```markdown
## Domain-Specific Rules

- All monetary amounts are stored in pence (integer)
- Customer IDs follow format: `cust_[a-z0-9]{14}`
- Payment states must follow: `pending` → `approved` | `rejected`
```

### Adding Gotchas

Add to the "Gotchas" section:

```markdown
## Gotchas

- Stripe webhook events can arrive out of order
- PostgreSQL JSONB doesn't preserve key order
- Our API rate limits at 100 req/min per customer
```

### Extending Patterns

Add new patterns following the template structure:

```markdown
### [Pattern Name] Template
```[language]
[reusable template with placeholders]
```

**When to use:** [guidance]
**Example:** [concrete example]
```

## Integration with PAI/diet103

These templates integrate with the Orchestrator system:

1. **diet103 Validation** — Can check for presence of architecture docs
2. **PAI Global Layer** — Patterns shared across projects
3. **Auto-Repair** — Can scaffold missing documentation
4. **Health Checks** — Documentation completeness scoring

## Best Practices

1. **Keep templates living** — Update as you discover what context Claude needs
2. **Be explicit** — Claude follows instructions literally
3. **Show, don't tell** — Examples over explanations
4. **Include anti-patterns** — Show what NOT to do
5. **Respect context windows** — Concise over verbose

## Contributing

When adding new language templates:

1. Follow existing template structure
2. Include all standard sections
3. Use idiomatic patterns for the language
4. Include recommended libraries table
5. Test with a sample project

---

*Templates designed for AI-assisted development with Claude Code and similar tools.*
