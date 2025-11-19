# Rule Management Skill

**Version:** 1.0.0  
**Auto-Activation:** Rule files (*.mdc), .cursor/rules/, .claude/rules/  
**Priority:** High

---

## Purpose

Guide systematic creation, maintenance, and improvement of Cursor/Claude rules following established standards and patterns.

---

## When This Skill Activates

### Trigger Phrases
- "update rules"
- "create rule"
- "modify rules"
- "rule management"

### File Patterns
- `.cursor/rules/` directory
- `.claude/rules/` directory
- `*.mdc` files
- `*rules*.md` files

---

## Rule Creation Standards

### Proper Rule Structure

All rules MUST follow this format:

```markdown
---
description: Clear, one-line description of what the rule enforces
globs: path/to/files/*.ext, other/path/**/*
alwaysApply: boolean
---

- **Main Points in Bold**
  - Sub-points with details
  - Examples and explanations
```

### Required Components

1. **YAML Frontmatter**
   - `description`: One-line summary
   - `globs`: File patterns where rule applies
   - `alwaysApply`: true for global rules

2. **Content Structure**
   - Main points in bold
   - Sub-points as bullet lists
   - Code examples with DO/DON'T
   - File references with mdc links

### File References

```markdown
Use [filename](mdc:path/to/file) format:

- Example: [prisma.mdc](mdc:.cursor/rules/prisma.mdc)
- Code reference: [schema.prisma](mdc:prisma/schema.prisma)
```

### Code Examples

```markdown
Use language-specific code blocks:

```typescript
// ✅ DO: Show good examples
const goodExample = true;

// ❌ DON'T: Show anti-patterns
const badExample = false;
```
```

---

## Rule Categories

### 1. Core Standards (`.cursor/rules/`)
**Always Apply:** Yes  
**Scope:** All projects

Examples:
- `cursor_rules.mdc` - IDE formatting standards
- `self_improve.mdc` - Rule improvement patterns
- `project-identity.mdc` - Project validation

### 2. Primacy Rules (`.claude/rules/`)
**Always Apply:** Yes  
**Scope:** All projects  
**Critical:** Yes

Examples:
- `platform-primacy.md` - Tool usage boundaries
- `documentation-economy.md` - Prevent excess docs
- `file-lifecycle-standard.md` - File management

### 3. Domain Rules (project-specific)
**Always Apply:** No (scoped by globs)  
**Scope:** Specific files/frameworks

Examples:
- `prisma.mdc` - Database patterns
- `react.mdc` - React conventions
- `api.mdc` - API design patterns

---

## Rule Improvement Process

Based on `.cursor/rules/self_improve.mdc`:

### 1. Pattern Recognition

Monitor for:
- Repeated similar implementations
- Common error patterns
- New libraries used consistently
- Emerging best practices

### 2. Rule Updates

**Add New Rules When:**
- New pattern used in 3+ files
- Common bugs could be prevented
- Repeated code review feedback
- New security/performance patterns

**Modify Existing Rules When:**
- Better examples exist
- Additional edge cases discovered
- Related rules updated
- Implementation details changed

### 3. Quality Checks

Rules should be:
- ✅ Actionable and specific
- ✅ Examples from actual code
- ✅ Up-to-date references
- ✅ Consistently enforced

---

## Global Rules System Integration

### What Goes Global?

**DO Sync Globally:**
- ✅ Taskmaster workflows (used everywhere)
- ✅ Cursor formatting standards (consistency)
- ✅ Project validation rules (prevent errors)
- ✅ Platform primacy (tool usage)
- ✅ Documentation economy (prevent bloat)

**DON'T Sync Globally:**
- ❌ Language-specific (unless used everywhere)
- ❌ Client-specific patterns
- ❌ Project conventions
- ❌ Experimental rules

### Syncing Process

```bash
# After creating/updating rules in Orchestrator
orchestrator sync-rules

# Rules propagate to all projects automatically
```

---

## Common Rule Patterns

### Pattern 1: Framework Usage

```markdown
---
description: React component best practices
globs: src/components/**/*.tsx, src/components/**/*.jsx
alwaysApply: false
---

- **Component Structure**
  - Use functional components with hooks
  - Keep components under 200 lines
  - Extract complex logic to custom hooks
  
```typescript
// ✅ DO: Clean, focused component
export function UserCard({ user }) {
  const { formatDate } = useDateFormatter();
  return <div>{formatDate(user.createdAt)}</div>;
}

// ❌ DON'T: Complex logic in component
export function UserCard({ user }) {
  const formatted = new Date(user.createdAt).toLocaleDateString(...);
  return <div>{formatted}</div>;
}
```
```

### Pattern 2: Tool Usage Standards

```markdown
---
description: Git commit message standards
globs: **/*
alwaysApply: true
---

- **Commit Format**
  - Use conventional commits: type(scope): message
  - Types: feat, fix, docs, chore, refactor, test
  - Keep first line under 72 characters

**Examples:**
```bash
# ✅ DO
git commit -m "feat(auth): add JWT token refresh"
git commit -m "fix(api): handle null user response"

# ❌ DON'T
git commit -m "fixed stuff"
git commit -m "wip"
```
```

### Pattern 3: Security/Safety Rules

```markdown
---
description: Prevent accidental API key exposure
globs: **/*
alwaysApply: true
---

- **API Key Management**
  - Never hardcode API keys in source
  - Use environment variables
  - Add to .gitignore
  - Use .env.example for templates

```javascript
// ❌ DON'T
const API_KEY = "sk_live_1234567890";

// ✅ DO
const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error("API_KEY required");
```
```

---

## Rule Lifecycle

### Creating a New Rule

1. **Identify the Need**
   - Pattern used 3+ times
   - Prevent common errors
   - Enforce new standard

2. **Draft the Rule**
   - Follow structure template
   - Include DO/DON'T examples
   - Reference actual code
   - Add file references

3. **Test the Rule**
   - Apply to existing code
   - Verify examples work
   - Check with team (if applicable)

4. **Deploy**
   - Add to `.cursor/rules/` or `.claude/rules/`
   - Update `.rule-manifest.json` if global
   - Sync if global rule
   - Document in knowledge base

### Updating a Rule

1. **Gather Examples**
   - Find new patterns in codebase
   - Identify edge cases
   - Collect better examples

2. **Update Content**
   - Add new examples
   - Update references
   - Clarify ambiguous points
   - Add edge case handling

3. **Version**
   - Note what changed
   - Update references
   - Communicate if breaking change

### Deprecating a Rule

1. **Mark as Deprecated**
   ```markdown
   **DEPRECATED:** This rule is replaced by [new-rule.mdc](mdc:.cursor/rules/new-rule.mdc)
   ```

2. **Provide Migration Path**
   - Explain what changed
   - Show before/after examples
   - Link to replacement

3. **Remove After Grace Period**
   - Keep for 1-2 months
   - Then delete
   - Document in decisions/

---

## Rule Testing

### Manual Verification

1. **Read the Rule**
   - Does it make sense?
   - Are examples clear?
   - Is it actionable?

2. **Apply to Code**
   - Follow the rule in real code
   - See if it improves quality
   - Note any friction

3. **Get Feedback**
   - Ask Claude to follow the rule
   - See if AI interprets correctly
   - Refine if needed

### Automated Checks

For rules that can be automated:
- ESLint rules (JavaScript)
- Pylint rules (Python)
- Custom linters

But many rules are judgment-based (can't automate).

---

## Best Practices

### DO:
- ✅ Keep rules focused (one concern per rule)
- ✅ Use real code examples
- ✅ Include both DO and DON'T
- ✅ Cross-reference related rules
- ✅ Update when code evolves
- ✅ Make rules actionable

### DON'T:
- ❌ Create rules for every tiny detail
- ❌ Use theoretical examples
- ❌ Make rules too generic
- ❌ Forget to update when code changes
- ❌ Create conflicting rules
- ❌ Write vague guidelines

---

## Troubleshooting

### Rules Not Loading?

**Check:**
```bash
# Verify file exists
ls .cursor/rules/my-rule.mdc

# Check settings.json
cat .claude/settings.json | jq '.rules'

# Ensure autoLoad is true
```

### Rules Conflicting?

**Solution:**
- Review `.rule-manifest.json`
- Check rule descriptions
- Consolidate similar rules
- Clarify precedence

### Rules Too Specific?

**Symptom:** Creating rules for one-off situations

**Solution:**
- Only create after 3+ uses
- Make rules general enough to reuse
- Delete if not used for 3 months

---

## Integration with Knowledge Base

### Document Patterns

When creating rules, also document in knowledge:

```markdown
# .claude/knowledge/patterns/auth-pattern.md

## Problem
Need consistent auth across projects

## Solution  
See rule: [auth-standard.mdc](mdc:.cursor/rules/auth-standard.mdc)

## Usage
[Examples...]
```

### Reference Decisions

Link rules to architectural decisions:

```markdown
# Rule content

**Rationale:** See [ADR 003](mdc:.claude/knowledge/decisions/003-api-design.md)
```

---

## Quick Reference

### Create New Rule

```bash
# 1. Create file
vim .cursor/rules/my-new-rule.mdc

# 2. Follow template (see above)

# 3. If global, add to sync list
# Edit: lib/rules/global-rules-loader.js

# 4. Sync
orchestrator sync-rules
```

### Update Existing Rule

```bash
# 1. Edit file
vim .cursor/rules/existing-rule.mdc

# 2. If global, re-sync
orchestrator sync-rules

# 3. Document changes
# Add note in .claude/knowledge/patterns/
```

---

## Related

- **Standards:** `.cursor/rules/self_improve.mdc`
- **Global Sync:** `lib/rules/global-rules-loader.js`
- **Command:** `orchestrator sync-rules`
- **Knowledge:** `.claude/knowledge/patterns/`

---

**Auto-Activation Priority:** High  
**Related Skills:** documentation, shell-integration  
**Related Agents:** N/A

---

**Last Updated:** November 15, 2025

