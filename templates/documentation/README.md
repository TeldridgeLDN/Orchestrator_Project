# Documentation Templates

This directory contains standardized templates for creating documentation across the Orchestrator project.

## Philosophy

**Document for readers, not for ritual.** Every document must serve a purpose.

See `Docs/DOCUMENTATION_FRAMEWORK.md` for complete guidelines on when and how to document.

---

## Available Templates

| Template | Use When | Lifespan |
|----------|----------|----------|
| `ARCHITECTURE.md` | System design changes, new major components | Permanent |
| `IMPLEMENTATION_GUIDE.md` | Complex features that others will maintain | Permanent |
| `USER_GUIDE.md` | User-facing features, CLI commands | Permanent |
| `API_REFERENCE.md` | Public APIs, reusable libraries, MCP tools | Permanent |
| `QUICK_REFERENCE.md` | Cheat sheets, frequently used commands | Permanent |
| `MILESTONE_SUMMARY.md` | Epic/phase completion | Archive after 30 days |
| `ADR_TEMPLATE.md` | Architectural decisions, tech choices | Permanent |

---

## Quick Start

### 1. Choose the Right Template

Use the decision tree in `Docs/DOCUMENTATION_FRAMEWORK.md` to determine if documentation is needed and which template to use.

### 2. Copy the Template

```bash
# Example: Document new architecture
cp templates/documentation/ARCHITECTURE.md Docs/MY_FEATURE_ARCHITECTURE.md
```

### 3. Fill In the Template

Follow the structure provided. Delete sections that don't apply, but keep the core structure.

### 4. Place in Correct Location

**Permanent Documentation:**
- `Docs/` - Main documentation directory

**Ephemeral Documentation:**
- Root directory (will be archived after 30 days)
- `.claude/docs/sessions/YYYY-MM/` (session-based, 14 days)

---

## Template Descriptions

### ARCHITECTURE.md

**Purpose:** Document system design, component structure, data flow

**Use When:**
- New major components added
- Significant refactoring changes system structure
- Integration patterns need explanation

**Sections:**
- System context and dependencies
- Component architecture with diagrams
- Data flow
- Design decisions and trade-offs
- Extension points

---

### IMPLEMENTATION_GUIDE.md

**Purpose:** Help maintainers understand complex implementations

**Use When:**
- Feature is complex and non-obvious
- Critical code that others will maintain
- Implementation has tricky parts or gotchas

**Sections:**
- Implementation details per component
- Data flow with examples
- Critical code sections (annotated)
- Design patterns used
- Testing strategy
- Known issues and limitations

---

### USER_GUIDE.md

**Purpose:** Help users understand and use features

**Use When:**
- New user-facing features
- CLI commands
- Configuration changes users need to know

**Sections:**
- Getting started (quick start)
- Basic usage with examples
- Advanced features
- Configuration options
- Troubleshooting
- FAQ

---

### API_REFERENCE.md

**Purpose:** Document public APIs for developers

**Use When:**
- Public APIs
- Reusable libraries
- MCP server tools
- Functions/classes others will call

**Sections:**
- Classes and methods
- Functions
- Types/interfaces
- Constants
- Error handling
- Examples

---

### QUICK_REFERENCE.md

**Purpose:** Fast lookup for common tasks

**Use When:**
- Frequently used commands need quick reference
- Cheat sheets for complex workflows
- Troubleshooting guides

**Sections:**
- Common commands
- Code snippets
- Configuration quick start
- Troubleshooting
- Cheat sheet tables

---

### MILESTONE_SUMMARY.md

**Purpose:** Summarize completion of major work

**Use When:**
- Epic completion (multiple related tasks)
- Phase completion (major project phase)
- Release milestones

**Sections:**
- Executive summary
- What was delivered
- Metrics and statistics
- Technical accomplishments
- Lessons learned
- Next steps

**⏰ Lifecycle:** Archive to `Docs/archive/milestones/` after 30 days

---

### ADR_TEMPLATE.md

**Purpose:** Record significant architectural decisions

**Use When:**
- Significant architectural decisions
- Technology stack choices
- Trade-offs with long-term implications
- Decisions difficult to reverse

**Sections:**
- Context and problem statement
- Options considered with pros/cons
- Decision and rationale
- Consequences
- Implementation plan

**📂 Location:** `Docs/decisions/ADR-XXX.md`

---

## Anti-Patterns

### ❌ Don't Document These

1. **Individual task completions** (use git commits instead)
2. **Obvious changes** (code is self-documenting)
3. **Personal notes** (keep in personal notebook)
4. **Duplicate information** (link to single source of truth)
5. **Implementation details that change frequently**

---

## Best Practices

### ✅ Single Source of Truth

Each concept documented in ONE place. Link to it from elsewhere.

**Bad:**
```
README.md → "Feature works by doing X, Y, Z..."
USER_GUIDE.md → "Feature works by doing X, Y, Z..." (duplicate)
```

**Good:**
```
README.md → "See USER_GUIDE.md for how Feature works"
USER_GUIDE.md → Complete explanation
```

---

### ✅ Update Existing Docs > Create New Docs

**Bad:**
```
TASK_7_COMPLETE.md
TASK_8_COMPLETE.md
TASK_9_COMPLETE.md
```

**Good:**
```
# Update existing docs
Docs/ARCHITECTURE.md (updated with new changes)
```

---

### ✅ Write for Your Future Self

Assume you'll forget everything in 6 months. Would this doc help you then?

---

### ✅ Test Your Documentation

- Can a new developer follow it?
- Are steps missing?
- Are examples clear?

---

## Template Customization

### Adding Sections

Feel free to add sections specific to your needs, but maintain the core structure.

### Removing Sections

Delete sections that don't apply to your use case. Don't leave empty placeholders.

### Maintaining Consistency

Keep similar types of documentation consistent in structure and style.

---

## Lifecycle Management

### Permanent Docs

**Location:** `Docs/`  
**Maintenance:** Update when system changes  
**Examples:** Architecture, User Guides, API References

### Semi-Permanent Docs

**Location:** Root or `Docs/`  
**Lifecycle:** Archive after 30-90 days  
**Examples:** Milestone summaries, implementation guides

### Session-Based Docs

**Location:** `.claude/docs/sessions/YYYY-MM/`  
**Lifecycle:** Review after 7 days, delete after 14 days  
**Examples:** Task completion summaries, session notes

---

## Automation

### Suggested Hook: DocumentationLifecycle.js

```javascript
// .claude/hooks/DocumentationLifecycle.js

// Archive milestone docs after 30 days
if (doc.type === 'MILESTONE' && age > 30) {
  moveTo('Docs/archive/milestones/');
}

// Delete session docs after 14 days
if (doc.type === 'SESSION' && age > 14) {
  delete();
}
```

---

## Examples

### Example 1: Documenting a New Feature

**Situation:** Completed scaffold workflow feature

**Documents Created:**
1. `Docs/SCAFFOLD_ARCHITECTURE.md` (how system works)
2. `Docs/SCAFFOLD_IMPLEMENTATION.md` (maintenance guide)
3. `Docs/SCENARIO_CLI.md` (updated with scaffold command)
4. `SCAFFOLD_FEATURE_COMPLETE.md` (milestone, will archive)

---

### Example 2: Bug Fix

**Situation:** Fixed validation bug

**Documents Created:**
- None (just git commit message)

---

### Example 3: Architecture Decision

**Situation:** Decided to use hooks over sub-agents

**Documents Created:**
1. `Docs/decisions/ADR-001-hooks-over-subagents.md`

---

## Getting Help

For questions about which template to use or how to structure documentation, refer to:

- **Main Guide:** `Docs/DOCUMENTATION_FRAMEWORK.md`
- **Project Issues:** GitHub issues for documentation questions

---

## Contributing

When adding new templates:

1. Follow existing template structure
2. Include clear instructions in comments
3. Provide examples throughout
4. Update this README with template description
5. Add to the decision tree in `DOCUMENTATION_FRAMEWORK.md`

---

*Keep documentation purposeful, consistent, and maintainable.*

