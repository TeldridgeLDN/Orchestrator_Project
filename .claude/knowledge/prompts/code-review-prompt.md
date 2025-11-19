# Code Review Prompt Template

**Purpose:** Systematic code review for quality, security, and maintainability  
**Use When:** Before merging, after implementing features, during refactoring

---

## Prompt

```
Please review the following code changes:

[Paste code or reference files]

Review for:

1. **Correctness**
   - Logic errors
   - Edge cases
   - Null/undefined handling

2. **Security**
   - Input validation
   - SQL injection risks
   - XSS vulnerabilities
   - Authentication/authorization

3. **Performance**
   - N+1 queries
   - Memory leaks
   - Inefficient algorithms
   - Caching opportunities

4. **Maintainability**
   - Code clarity
   - Naming conventions
   - Documentation
   - Test coverage

5. **Standards Compliance**
   - Follows project conventions
   - Adheres to style guide
   - Consistent patterns

Provide:
- Severity levels (Critical, High, Medium, Low)
- Specific line references
- Suggested fixes
- Explanation of issues
```

---

## Variations

### Quick Review (5 min)
```
Quick review focusing on:
- Critical security issues
- Obvious bugs
- Major style violations
```

### Deep Review (30 min)
```
Comprehensive review including:
- Architecture implications
- Test coverage gaps
- Performance analysis
- Documentation completeness
```

### Pre-Merge Checklist
```
Verify:
- [ ] All tests passing
- [ ] No linter errors
- [ ] Documentation updated
- [ ] Changelog entry added
- [ ] No TODO comments
- [ ] Performance acceptable
- [ ] Security scan passed
```

---

## Related

- **Agent:** `.claude/agents/code-reviewer.md` (if exists)
- **Rules:** `.cursor/rules/cursor_rules.mdc`
- **Standards:** Project-specific style guide

---

## Example Usage

```bash
# In agent chat:
"Please review my changes in lib/commands/sync-rules.js 
focusing on error handling and edge cases"
```

---

**Last Updated:** November 15, 2025

