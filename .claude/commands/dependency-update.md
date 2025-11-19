# /dependency-update Command

**Purpose:** Safe dependency update workflow

---

## Workflow

### Step 1: Audit Current State

```
@dependency-auditor.md

Dependency audit:
1. Run npm audit for security issues
2. Run npm outdated for update candidates
3. Check license compliance
4. Review bundle size (if frontend)

Provide prioritized list of updates needed.
```

---

### Step 2: Plan Updates

Based on audit results, categorize updates:

**Critical (Do immediately):**
- Security vulnerabilities
- Patches for known bugs

**High Priority (This sprint):**
- Minor version updates
- Dev dependency updates

**Low Priority (Next quarter):**
- Major version updates
- Non-critical upgrades

---

### Step 3: Execute Safe Updates

For each update category:

```
@dependency-auditor.md

Update [package-name] from [old] to [new]:
1. Check breaking changes
2. Review migration guide
3. Assess impact on our code
4. Provide update command
5. List tests to run

Guide me through this update safely.
```

---

### Step 4: Test & Verify

After each update:

```
Run tests:
npm test

If tests pass:
- Commit changes
- Move to next update

If tests fail:
@code-reviewer.md
Review failing tests and guide fixes.
```

---

### Step 5: Final Verification

After all updates:

```
@dependency-auditor.md

Post-update verification:
- Run npm audit (should be clean)
- Run npm outdated (should be minimal)
- Verify bundle size (if applicable)
- Check for any new warnings

Confirm all updates successful.
```

---

## Usage

```
/dependency-update

Scope: security updates only
OR
Scope: all outdated packages
OR
Scope: specific package (react)
```

---

**Command Type:** Multi-Agent Workflow  
**Agents Used:** dependency-auditor, code-reviewer  
**Duration:** ~30-60 minutes (depends on number of updates)

