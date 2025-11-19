# /pre-merge-review Command

**Purpose:** Complete pre-merge review workflow using multiple agents

---

## Workflow

Execute the following steps in order:

### 1. Code Review (`code-reviewer` agent)

Invoke the code-reviewer agent:

```
@code-reviewer.md

Please review the following changes for merge readiness:

[List files or provide context]

Focus on:
- Security vulnerabilities (critical)
- Code quality issues
- Test coverage
- Documentation completeness

Use standard review format with severity levels.
```

**Expected Output:** Code review with categorized issues

---

### 2. Dependency Check (`dependency-auditor` agent)

If dependencies were changed, invoke:

```
@dependency-auditor.md

Check dependency changes:
- Run npm audit
- Verify new dependencies are safe
- Check for breaking changes
- Review license compliance

Report any security issues or concerns.
```

**Expected Output:** Dependency safety report

---

### 3. Release Check (`release-coordinator` agent)

Verify release readiness:

```
@release-coordinator.md

Pre-merge checklist verification:
- [ ] All tests passing?
- [ ] Changeset created (if applicable)?
- [ ] Documentation updated?
- [ ] Breaking changes documented?
- [ ] Ready for merge?

Provide approval or list blockers.
```

**Expected Output:** Merge readiness status

---

## Final Decision

Based on agent reports:

**✅ APPROVE MERGE if:**
- No critical issues from code review
- No security vulnerabilities
- Tests passing
- Documentation complete

**❌ REQUEST CHANGES if:**
- Critical/high severity issues found
- Security vulnerabilities present
- Tests failing
- Missing documentation

**💬 DISCUSS if:**
- Architectural concerns
- Major refactoring needed
- Breaking changes impact unclear

---

## Usage

```
/pre-merge-review

Files changed:
- src/auth/login.ts
- src/auth/tokens.ts
- tests/auth.test.ts

Purpose: Implement JWT refresh tokens
```

---

**Command Type:** Multi-Agent Workflow  
**Agents Used:** code-reviewer, dependency-auditor, release-coordinator  
**Duration:** ~10-15 minutes

