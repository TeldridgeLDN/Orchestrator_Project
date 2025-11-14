# Rule Integrity - Meta-Rules for Rule Governance

**Priority:** Critical  
**Applies To:** All diet103 projects  
**AI Assistants:** Claude, Cursor, Windsurf, Cline, Roo, and all others

---

## Core Principle

**Rules must not conflict with each other. When conflicts arise, clear resolution protocols must exist.**

This meta-rule governs how all other rules interact, ensuring the rule system remains consistent, predictable, and maintainable.

---

## Why This Matters

### The Problem: Rule Conflicts

**Discovered Conflict Example:**
- **File Lifecycle** uses: CRITICAL, PERMANENT, EPHEMERAL, ARCHIVED
- **Documentation Economy** uses: Tier 1 (Critical), Tier 2 (Temporary), Tier 3 (Forbidden)

**Question:** What if File Lifecycle marks a document as "PERMANENT" but Documentation Economy says it's "Tier 3 (Forbidden - never create)"?

Without Rule Integrity, the system has no way to resolve this conflict.

---

## Rule Conflict Resolution Protocol

### Hierarchy of Resolution

When two rules conflict, apply these resolution steps in order:

#### 1. **Explicit Over Implicit**
- Rule with explicit guidance for the specific case wins
- Rule with general guidance defers

**Example:**
```
Conflict: File Lifecycle says "archive session summaries after 30 days"
         Documentation Economy says "never create session summaries"

Resolution: Documentation Economy is MORE EXPLICIT (says "never create")
           → Don't create session summaries at all
           → File Lifecycle archiving rule doesn't apply (file doesn't exist)
```

#### 2. **Prevention Over Remediation**
- Rules preventing creation/action take precedence over cleanup rules
- Better to not create the problem than to fix it later

**Example:**
```
Conflict: Documentation Economy: "Don't create task completion docs"
         File Lifecycle: "Archive ephemeral docs after 30 days"

Resolution: Prevention wins → Don't create the docs
           File Lifecycle's archiving is moot if doc never created
```

#### 3. **Specific Over General**
- Rule about specific file/pattern wins over general rule
- Context-specific guidance overrides broad directives

**Example:**
```
Conflict: Context Efficiency: "All files < 500 lines"
         Project-Specific: "API generated docs can be 1000 lines"

Resolution: Project-specific wins for API docs only
           Context Efficiency applies to all other files
```

#### 4. **Safety Over Convenience**
- Data preservation beats automation
- Security beats speed
- Reversibility beats optimization

**Example:**
```
Conflict: Autonomy Boundaries: "Confirm before deleting"
         Some automation: "Auto-cleanup old files"

Resolution: Safety (confirmation) wins
           Human must approve deletion
```

#### 5. **Newer Rule Must Acknowledge Older**
- New rules must explicitly state how they interact with existing rules
- If conflict, new rule must provide resolution guidance
- Old rule remains authoritative until explicitly superseded

---

## Rule Classification System Harmonization

### The Unified Tier System

To resolve the File Lifecycle vs Documentation Economy conflict, we establish a unified classification:

| Unified Tier | File Lifecycle Term | Documentation Economy Term | Treatment |
|--------------|-------------------|--------------------------|-----------|
| **TIER 0: PROHIBITED** | N/A | Tier 3 (Forbidden) | Never create, delete if exists |
| **TIER 1: CRITICAL** | CRITICAL | Tier 1 (Critical) | Permanent, never archive |
| **TIER 2: PERMANENT** | PERMANENT | Tier 1 (Critical) | Keep indefinitely, maintain |
| **TIER 3: TEMPORARY** | EPHEMERAL | Tier 2 (Temporary) | Auto-archive after expiration |
| **TIER 4: ARCHIVED** | ARCHIVED | N/A | Historical, read-only |

### Tier Decision Flow

```
For any file, ask:

1. Should this file exist at all?
   ├─ NO → TIER 0 (Prohibited)
   └─ YES → Continue

2. Is this required for system operation?
   ├─ YES → TIER 1 (Critical)
   └─ NO → Continue

3. Is this required for long-term reference?
   ├─ YES → TIER 2 (Permanent)
   └─ NO → Continue

4. Is this useful temporarily?
   ├─ YES → TIER 3 (Temporary + expiration)
   └─ NO → TIER 0 (Prohibited)
```

---

## Rule Creation Protocol

### Before Creating a New Rule

**Validation Checklist:**

- [ ] **Read all existing rules** - Ensure familiarity with current rule set
- [ ] **Identify potential conflicts** - Does this contradict anything?
- [ ] **Document interactions** - How does this relate to other rules?
- [ ] **Provide resolution guidance** - If conflicts exist, how to resolve?
- [ ] **Test against examples** - Run through real-world scenarios
- [ ] **Get feedback** - Review with other rules authors if possible

### New Rule Template

```markdown
# [Rule Name]

**Priority:** Critical/High/Medium  
**Applies To:** All projects / Specific types  
**AI Assistants:** All

---

## Relationship to Existing Rules

**Complements:** [List rules this works with]
**Conflicts With:** [List any conflicts]
**Resolution:** [How conflicts are resolved]

**Example:**
Complements: Platform Primacy (both govern rule hierarchy)
Conflicts With: None identified
Resolution: N/A

---

[Rest of rule content]
```

---

## Rule Amendment Protocol

### Updating Existing Rules

When modifying a rule:

1. **Impact Analysis**
   - Identify all rules that reference this rule
   - Check for new conflicts created
   - Document what changes

2. **Version History**
   - Add version number and date
   - Summarize changes
   - Note any breaking changes

3. **Notification**
   - Update CRITICAL_RULES_ESTABLISHED.md or similar
   - Alert AI assistants to reload rules
   - Document migration path if needed

### Rule Deprecation

To deprecate a rule:

1. **Mark as Deprecated**
   ```markdown
   **Status:** DEPRECATED as of [DATE]  
   **Replacement:** [New rule name]  
   **Migration:** [How to transition]
   ```

2. **Grace Period**
   - Keep deprecated rule for 30 days
   - Add warnings when referenced
   - Provide migration guidance

3. **Removal**
   - Archive to `.claude/archive/rules/`
   - Remove from active rule set
   - Update all references

---

## Conflict Detection

### AI Assistant Responsibilities

When encountering potential rule conflicts:

1. **Alert User Immediately**
   ```
   ⚠️ RULE CONFLICT DETECTED
   
   Rule A: [Rule name] says: [Directive]
   Rule B: [Rule name] says: [Different directive]
   
   Context: [What triggered the conflict]
   
   Resolution per Rule Integrity:
   [Hierarchy step that applies]
   → [Recommended action]
   
   Proceeding with: [Chosen action]
   ```

2. **Document for Review**
   - Log conflict to `.claude/rule-conflicts.log`
   - Include resolution applied
   - Flag for human review

3. **Suggest Rule Updates**
   - If conflict is recurring
   - Propose clarification or amendment
   - Help maintain rule quality

---

## Rule Priority Levels

### Critical Rules (Highest Priority)

Cannot be overridden by project-specific rules:

1. **Rule Integrity** (this rule)
2. **Platform Primacy** (rule location hierarchy)
3. **Security Baseline** (when created)

### High Priority Rules

Can be overridden with explicit justification:

1. **Context Isolation**
2. **Autonomy Boundaries**
3. **Context Efficiency**

### Medium Priority Rules

Project-specific overrides encouraged:

1. **Documentation Economy** (project may have different needs)
2. **File Lifecycle** (project may have custom tiers)

### Override Protocol

```markdown
# Project-Specific Override Example

## Overriding: Documentation Economy

**Default Rule:** Never create session summaries
**Override:** Create session summaries for this project

**Justification:**
- Client contractually requires daily progress reports
- Reports must be in markdown format
- Automated from session summaries

**Compatibility:**
- File Lifecycle: Mark as TEMPORARY, expire after 90 days
- Context Efficiency: Keep summaries < 500 lines
- Autonomy Boundaries: Auto-generate, no confirmation needed

**Review Date:** 2026-01-01 (reassess when contract ends)
```

---

## Testing Rule Changes

### Before Implementing Rule Changes

**Test Scenarios:**

1. **Compatibility Test**
   - Does new rule work with existing rules?
   - Run through 5 common scenarios
   - Check for unexpected conflicts

2. **Conflict Test**
   - Intentionally create conflict situations
   - Verify resolution protocol works
   - Ensure AI can detect and resolve

3. **Regression Test**
   - Verify existing functionality still works
   - Check that no new issues introduced
   - Validate against past conflict resolutions

---

## Common Conflict Patterns

### Pattern 1: Classification Mismatch

**Symptom:** Two rules use different classification systems

**Example:** File Lifecycle (CRITICAL/PERMANENT/EPHEMERAL) vs Documentation Economy (Tier 1/2/3)

**Resolution:** Use Unified Tier System defined in this rule

### Pattern 2: Scope Overlap

**Symptom:** Two rules govern same files/actions

**Example:** Context Efficiency says "split at 500 lines", project rule says "1000 lines OK for generated files"

**Resolution:** Specific (generated files) wins over general (all files)

### Pattern 3: Timing Conflict

**Symptom:** One rule says create/do X, another says don't

**Example:** Some automation wants to create logs, Documentation Economy says minimize files

**Resolution:** Prevention over remediation - don't create unless necessary

### Pattern 4: Precedence Ambiguity

**Symptom:** Unclear which rule should take priority

**Example:** Two rules at same priority level conflict

**Resolution:** Fall back to hierarchy: Explicit > Prevention > Specific > Safety > Newer

---

## Rule Maintenance Schedule

### Monthly Review
- Check for new conflicts reported
- Review rule-conflicts.log
- Update conflict resolution examples

### Quarterly Audit
- Validate all rules still relevant
- Check for outdated guidance
- Update version history
- Archive deprecated rules

### Annual Overhaul
- Major revision if needed
- Consolidate overlapping rules
- Simplify where possible
- Update based on usage patterns

---

## Emergency Rule Override

### When Rules Block Critical Work

If following rules would cause:
- Data loss
- Security vulnerability
- System failure
- Blocked critical path

**Override Protocol:**

1. **Document Emergency**
   ```markdown
   EMERGENCY RULE OVERRIDE
   Date: [timestamp]
   Rule(s) Overridden: [names]
   Reason: [critical justification]
   Action Taken: [what was done]
   Review Required: YES
   ```

2. **Proceed with Caution**
   - Minimal deviation from rules
   - Document every decision
   - Create backup before action

3. **Post-Mortem**
   - Review within 24 hours
   - Determine if rule needs updating
   - Prevent future emergencies

---

## Examples of Good Rule Interaction

### Example 1: Documentation Economy + File Lifecycle

**Scenario:** User completes a task

**Documentation Economy says:** "Don't create TASK_X_COMPLETE.md files (Tier 3 Forbidden)"

**File Lifecycle would say:** "If file existed, archive after 30 days"

**Resolution:** 
- Don't create the file (Documentation Economy prevention)
- File Lifecycle archiving is moot (no file to archive)
- ✅ Rules work together harmoniously

### Example 2: Context Efficiency + Project Override

**Scenario:** Generated API documentation is 800 lines

**Context Efficiency says:** "All files < 500 lines, split if larger"

**Project rule says:** "Generated docs exception: < 1000 lines OK"

**Resolution:**
- Specific (project override) wins for generated docs
- Context Efficiency still applies to hand-written files
- ✅ Both rules respected in their contexts

### Example 3: Autonomy Boundaries + Platform Primacy

**Scenario:** AI about to delete a file

**Autonomy Boundaries says:** "Confirm before deleting files"

**Platform Primacy says:** ".claude/rules/ takes precedence"

**Resolution:**
- Platform Primacy governs WHERE rules come from
- Autonomy Boundaries governs WHAT action to take
- No conflict - different domains
- ✅ Confirmation required, sourced from .claude/rules/

---

## AI Assistant Implementation Guide

### On Rule Load

```python
# Pseudocode for AI assistant behavior

def load_rules():
    rules = load_all_rules_from_claude_directory()
    
    # Validate rule integrity
    conflicts = detect_conflicts(rules)
    
    if conflicts:
        for conflict in conflicts:
            resolution = apply_resolution_protocol(conflict)
            log_conflict_and_resolution(conflict, resolution)
            alert_user_if_critical(conflict)
    
    return rules
```

### On Action

```python
def before_action(action, context):
    applicable_rules = find_applicable_rules(action, context)
    
    if len(applicable_rules) > 1:
        # Multiple rules apply - check for conflicts
        if rules_conflict(applicable_rules):
            resolution = apply_resolution_protocol(applicable_rules)
            notify_user_of_conflict(resolution)
            return resolution.recommended_action
    
    return apply_single_rule(applicable_rules[0])
```

---

## Summary: The Golden Rules of Rule Integrity

1. **Explicit Over Implicit** - Clear guidance beats general principle
2. **Prevention Over Remediation** - Don't create problems to fix later
3. **Specific Over General** - Context-specific wins
4. **Safety Over Convenience** - Preserve data, require confirmation
5. **Newer Acknowledges Older** - New rules must document interactions
6. **Unified Classification** - Use common tier system
7. **Test Before Deploy** - Validate against existing rules
8. **Document Conflicts** - Log and resolve transparently
9. **Emergency Override** - Allowed but documented
10. **Continuous Review** - Rules evolve with needs

---

**Rule Version:** 1.0.0  
**Created:** November 14, 2025  
**Last Updated:** November 14, 2025  
**Applies To:** All diet103 projects  
**Supersedes:** None (foundational rule)

**Next Review:** December 14, 2025 (or when new rules added)

---

*"A system of rules without integrity is worse than no rules at all. Conflicts breed confusion; resolution breeds trust."*

