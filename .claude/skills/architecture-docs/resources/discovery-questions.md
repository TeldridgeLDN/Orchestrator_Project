# Architecture Documentation Discovery Questions

Use these questions when starting the architecture-docs skill to gather context before generating documentation.

## For New Projects

### Architecture
- "What architecture pattern will this project follow? (hexagonal, clean, layered, etc.)"
- "Will this be a monolith, modular monolith, or microservices?"
- "What are the main components/modules of the system?"

### Principles
- "What are your non-negotiable development principles?"
  - TDD mandatory?
  - Functional/immutable preferred?
  - Specific testing approach?
- "What patterns do you want to enforce? (Result types, Value Objects, etc.)"

### Tech Stack
- "What's the tech stack, and were there specific reasons for those choices?"
- "Any constraints on libraries or frameworks?"
- "Database choice and why?"

### Team
- "Team size and experience levels?"
- "Any existing code standards to align with?"

---

## For Existing Codebases

### Discovery
- "I'll do a thorough review of the codebase first. Are there any existing docs, ADRs, or READMEs I should prioritize?"
- "Where does the core business logic live?"
- "Any areas of the codebase that are particularly complex or non-obvious?"

### Patterns
- "What patterns are you trying to enforce that might not be obvious from the code?"
- "Are there patterns in the code you'd like to move away from?"
- "What's the intended separation between layers/modules?"

### Pain Points
- "What mistakes have you made that you want Claude to avoid repeating?"
- "What questions do new developers typically ask?"
- "Any gotchas or non-obvious behaviors?"

---

## For Migrations

### Source & Target
- "What's the source and target? (e.g., Python → Rust, JavaScript → TypeScript)"
- "Is this a complete rewrite or gradual migration?"

### Preservation
- "What patterns from the source should be preserved?"
- "What patterns should be reconsidered during migration?"
- "Any improvements you want to make during migration?"

### Constraints
- "Timeline and phasing requirements?"
- "Backwards compatibility needs?"
- "Performance targets?"

---

## Quick Assessment Checklist

Before generating docs, confirm:

- [ ] Primary language/framework identified
- [ ] Architecture pattern decided (or detected)
- [ ] Core principles established (TDD, immutability, etc.)
- [ ] Key patterns to enforce identified
- [ ] Anti-patterns to avoid listed
- [ ] Domain-specific rules noted
- [ ] Known gotchas documented

---

## Language Detection Prompts

If language isn't clear:

```
"I'll scan your project to detect the primary language and framework.
Looking for: package.json, tsconfig.json, Cargo.toml, go.mod, requirements.txt..."
```

Then select appropriate template:
- TypeScript detected → `claude/typescript.md`
- React detected → `claude/react.md`
- Python detected → `claude/python.md`
- Rust detected → `claude/rust.md`
- Go detected → `claude/go.md`
