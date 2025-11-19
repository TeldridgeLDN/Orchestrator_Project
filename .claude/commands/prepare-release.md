# /prepare-release Command

**Purpose:** Systematic release preparation using release-coordinator

---

## Workflow

### Step 1: Pre-Flight Check

```
@release-coordinator.md

Pre-release verification for version [X.Y.Z]:

Run through the complete pre-release checklist:
1. Code quality verification
2. Documentation review
3. Version management check
4. Testing verification
5. Dependencies audit

Report any blockers or concerns.
```

---

### Step 2: Dependency Security Scan

```
@dependency-auditor.md

Security audit for release:
- Run npm audit
- Check for critical vulnerabilities
- Verify all dependencies are current
- Review any outdated packages

Block release if critical issues found.
```

---

### Step 3: Final Code Review

```
@code-reviewer.md

Final pre-release code review:

Review recent changes since last release.
Focus on:
- Any security concerns
- Breaking changes properly documented
- Critical paths tested
- No obvious bugs

Give final approval or flag issues.
```

---

### Step 4: Release Execution

If all checks pass:

```
@release-coordinator.md

Execute release process:
1. Verify changeset status
2. Run changeset version
3. Generate release notes
4. Provide git commands for tagging
5. Provide publish commands

Guide me through the release step-by-step.
```

---

### Step 5: Post-Release Verification

After publishing:

```
@release-coordinator.md

Post-release verification:
- Confirm package published
- Verify git tag created
- Check smoke tests
- Review initial metrics

Report status and any issues.
```

---

## Usage

```
/prepare-release

Target version: 1.2.0
Type: minor
Changes: Added session persistence, global knowledge sharing
```

---

**Command Type:** Multi-Agent Workflow  
**Agents Used:** release-coordinator, dependency-auditor, code-reviewer  
**Duration:** ~20-30 minutes

