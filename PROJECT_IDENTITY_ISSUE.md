# Project Identity Confusion - Issue Analysis & Mitigation

**Date:** November 14, 2025  
**Status:** Analyzed - Solutions Proposed  
**Severity:** HIGH (Potential for wrong-project implementations)

---

## 🔍 Issue Description

The Orchestrator system has experienced confusion about which project is being worked on, leading to potential implementations in the wrong codebase. This occurred in this session where Sprint 3's PRD header indicated "Momentum Squared" while actual work was being done in Orchestrator_Project.

### What Happened (This Session)
1. ✅ Sprint 3 PRD created with header: "Momentum Squared diet103 Enhancements"
2. ✅ Tasks parsed and implementation started in Orchestrator_Project directory
3. ✅ User caught the discrepancy: "Can we check we haven't mixed up momentum squared"
4. ✅ Analysis confirmed implementation was CORRECT, PRD header was WRONG
5. ✅ PRD updated to reflect correct project name

**Outcome:** Correct implementation, but wasted time on validation and could have been wrong.

---

## 🎯 Root Causes

### 1. **Incorrect projectName in config.json**
```json
// Current (WRONG):
"projectName": "Taskmaster"

// Should be:
"projectName": "Orchestrator_Project"
```
This is a Taskmaster installation artifact, not the actual project name.

### 2. **No PRD Validation**
`parse-prd` reads PRD "Project:" field but doesn't validate it against:
- Current working directory name
- config.json projectName
- Git repository name
- Package.json name (if exists)

### 3. **Copy-Paste PRD Errors**
PRD templates make it easy to copy content between projects without updating the project name field.

### 4. **No AI Project Context Validation**
AI doesn't verify project identity before implementing. It assumes:
- Working directory = correct project
- No cross-check with PRD metadata

### 5. **Weak Project Identity Signals**
- Tag names (e.g., "diet103-sprint3") don't encode project identity
- Task descriptions are often generic enough to apply to multiple projects
- No visual indicators of current project

### 6. **Multiple Projects Sharing Concepts**
"diet103" appears in both Orchestrator_Project and potentially other projects, creating ambiguity.

---

## ⚠️ Severity Assessment

### Impact Levels

**🔴 Critical (Potential):**
- Implementing wrong-project features in current project
- Data corruption or incompatible code integration
- Production incidents from misplaced implementations

**🟠 High (Occurred This Session):**
- Wasted time validating project identity
- Confusion requiring manual intervention
- Potential for wrong implementation if not caught

**🟡 Medium:**
- Documentation referring to wrong project
- Ambiguous task descriptions
- Team confusion about where to implement

### Worst Case Scenario

```
User has 2 similar projects:
├─ ClientA-App (React + Node.js)
└─ ClientB-App (React + Node.js)

1. User creates PRD for ClientA feature
2. Accidentally runs parse-prd in ClientB directory
3. AI implements ClientA features in ClientB codebase
4. User doesn't notice until code review or production
5. Major rollback/refactoring required
```

**Risk:** HIGH - Easy to happen, severe consequences

---

## 💡 Proposed Solutions

### 🚨 IMMEDIATE ACTIONS (Do Now)

#### 1. Fix config.json projectName
**Time:** 2 minutes  
**Impact:** Foundation for all validation

```bash
# Update .taskmaster/config.json
sed -i '' 's/"projectName": "Taskmaster"/"projectName": "Orchestrator_Project"/' .taskmaster/config.json
```

**Manual alternative:**
```json
{
  "global": {
    "projectName": "Orchestrator_Project"  // ← Fix this
  }
}
```

#### 2. Add AI Project Validation Rule
**Time:** 5 minutes  
**Impact:** Prevents future confusion

Create `.cursor/rules/project-identity.mdc`:

```markdown
---
description: Validate project identity before implementations
globs: **/*
alwaysApply: true
---

## Project Identity Validation

**CRITICAL: Always validate project context before implementing tasks**

### Current Project Identity

Query multiple signals to establish project identity:
1. **Working Directory**: Extract project name from path
2. **config.json**: Check `.taskmaster/config.json` → `global.projectName`
3. **Git Remote**: Parse repository name from git remote URL
4. **Package.json**: Check `name` field if exists
5. **Main PRD**: Check project name in primary documentation

### Validation Process

Before implementing any task:

1. **Identify Current Project:**
   ```
   Working Directory: /Users/tomeldridge/Orchestrator_Project
   Config Project Name: Orchestrator_Project
   Git Remote: github.com/user/orchestrator-project
   → CANONICAL NAME: "Orchestrator_Project"
   ```

2. **If Reading a PRD:**
   - Extract "Project:" field from PRD header
   - Compare with canonical project name
   - If MISMATCH: **STOP AND ALERT USER**

3. **Alert Format:**
   ```
   ⚠️ PROJECT IDENTITY MISMATCH DETECTED
   
   Current Project: Orchestrator_Project
   PRD Project Field: Momentum Squared
   
   This may indicate:
   - Wrong PRD being used
   - Copy-paste error in PRD
   - Intentional cross-project work
   
   🛑 STOP: Confirm with user before proceeding.
   
   Options:
   1. Update PRD to correct project name
   2. Switch to correct project directory
   3. Confirm this is intentional cross-project work
   ```

4. **Verbalize Project Context:**
   When starting significant work, state:
   "I'm working in PROJECT_NAME. Let me verify this matches the task requirements..."

### Edge Cases

**Legitimate Cross-Project Work:**
If user explicitly wants to implement ProjectA features in ProjectB:
- Require explicit confirmation
- Document the decision
- Add note to task/PRD explaining why

**Project Renamed:**
If project was renamed after initialization:
- Update config.json manually
- Update all PRDs
- Update git remote if needed

**Monorepo:**
Include full path in project name:
- "monorepo/frontend"
- "monorepo/backend"
```

#### 3. Create PRD Validation Checklist
**Time:** 3 minutes  
**Impact:** Prevents PRD copy-paste errors

Add to `.taskmaster/templates/prd-checklist.md`:

```markdown
# PRD Creation Checklist

Before parsing any PRD with `task-master parse-prd`:

## ✅ Pre-Flight Checks

- [ ] **Project Name**: Verify "Project:" field matches current directory
- [ ] **Directory**: Confirm you're in the correct project directory (`pwd`)
- [ ] **Git Branch**: Check you're on the right branch (`git branch --show-current`)
- [ ] **Config**: Verify `.taskmaster/config.json` projectName is correct
- [ ] **Review**: Read PRD header to ensure no copy-paste artifacts

## ⚠️ Common Mistakes

- ❌ Copying PRD from another project without updating project name
- ❌ Using outdated PRD template with wrong project name
- ❌ Working in wrong directory while reading correct PRD
- ❌ Mixing projects with similar names (e.g., ClientA vs ClientB)

## 🔍 Validation Command

```bash
# Quick validation script
echo "Current Directory: $(basename $(pwd))"
echo "Config Project: $(jq -r '.global.projectName' .taskmaster/config.json)"
echo "Git Remote: $(git remote get-url origin | sed 's/.*\///' | sed 's/\.git$//')"
```

Expected: All three should refer to the same project.
```

---

### 🟠 HIGH PRIORITY (Next Sprint)

#### 4. Enhance Taskmaster parse-prd Validation
**Complexity:** Medium  
**Impact:** Automatic prevention

Add to Taskmaster's `parse-prd` command:

```javascript
// In scripts/modules/ai/prd-parser.js or similar

async function validateProjectIdentity(prdPath, projectRoot) {
  // 1. Extract PRD project name
  const prdContent = await fs.readFile(prdPath, 'utf-8');
  const prdProjectMatch = prdContent.match(/\*\*Project\*\*:\s*(.+)/);
  const prdProjectName = prdProjectMatch ? prdProjectMatch[1].trim() : null;
  
  // 2. Get canonical project name
  const configPath = path.join(projectRoot, '.taskmaster/config.json');
  const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
  const configProjectName = config.global?.projectName;
  
  // 3. Get directory name
  const dirName = path.basename(projectRoot);
  
  // 4. Validate match
  if (prdProjectName && configProjectName) {
    // Normalize for comparison (case-insensitive, ignore special chars)
    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const prdNorm = normalize(prdProjectName);
    const configNorm = normalize(configProjectName);
    const dirNorm = normalize(dirName);
    
    if (!prdNorm.includes(configNorm) && !configNorm.includes(prdNorm)) {
      // MISMATCH DETECTED
      console.warn('⚠️  PROJECT IDENTITY MISMATCH');
      console.warn(`   PRD Project: ${prdProjectName}`);
      console.warn(`   Config Project: ${configProjectName}`);
      console.warn(`   Directory: ${dirName}`);
      console.warn('');
      
      // Prompt user
      const answer = await prompt('Continue anyway? (yes/no): ');
      if (answer.toLowerCase() !== 'yes') {
        throw new Error('PRD parsing cancelled due to project mismatch');
      }
    }
  }
}

// Add to parse-prd flow:
await validateProjectIdentity(prdPath, projectRoot);
```

#### 5. Add Project Identity MCP Tool
**Complexity:** Medium  
**Impact:** Enables programmatic validation

```javascript
// In mcp.json schema, add new tool:
{
  "name": "mcp_taskmaster-ai_validate_project",
  "description": "Validate current project identity and detect mismatches",
  "parameters": {
    "projectRoot": "Project root path",
    "expectedProject": "Expected project name (optional)"
  }
}

// Tool returns:
{
  "projectRoot": "/Users/tomeldridge/Orchestrator_Project",
  "directoryName": "Orchestrator_Project",
  "configProjectName": "Orchestrator_Project",
  "gitRemoteName": "orchestrator-project",
  "packageName": null,
  "canonicalName": "Orchestrator_Project",
  "isConsistent": true,
  "warnings": []
}

// If mismatch:
{
  "isConsistent": false,
  "warnings": [
    "Config projectName 'Taskmaster' doesn't match directory 'Orchestrator_Project'",
    "Consider updating .taskmaster/config.json"
  ]
}
```

#### 6. Update PRD Templates
**Complexity:** Low  
**Impact:** Prevents template errors

```markdown
# [REPLACE_WITH_PROJECT_NAME] - Sprint X: [Sprint Theme]
# Product Requirements Document (PRD)

**Project**: [REPLACE_WITH_PROJECT_NAME] ← REPLACE THIS!
**Sprint**: [X] - [Theme]
**Date**: [YYYY-MM-DD]

<!-- CHECKLIST BEFORE PARSING:
[ ] Replaced all [REPLACE_WITH_PROJECT_NAME] placeholders
[ ] Verified working directory matches project name
[ ] Checked .taskmaster/config.json projectName
-->
```

---

### 🟡 MEDIUM PRIORITY (Future Enhancement)

#### 7. Project Identity in Terminal Prompt
**Complexity:** High (Shell integration)  
**Impact:** Constant visual reminder

```bash
# Add to .zshrc or .bashrc
TASKMASTER_PROJECT=$(jq -r '.global.projectName' .taskmaster/config.json 2>/dev/null || echo "")
if [ -n "$TASKMASTER_PROJECT" ]; then
  PS1="[$TASKMASTER_PROJECT] $PS1"
fi

# Result:
[Orchestrator_Project] ~/Orchestrator_Project $ 
```

#### 8. Visual Project Badges in Documentation
**Complexity:** Medium  
**Impact:** Clear documentation markers

Add to all generated docs:

```markdown
<!-- PROJECT BADGE -->
<div align="center">
  <strong>📦 Project: Orchestrator_Project</strong>
</div>
```

#### 9. Project-Scoped Taskmaster Instances
**Complexity:** Very High  
**Impact:** Complete isolation

Future architecture where each project has truly isolated Taskmaster:
- Separate config per project
- No shared state
- Explicit project switching required

---

## 🎯 Recommended Implementation Plan

### Phase 1: Immediate (Today)
1. ✅ Fix config.json projectName
2. ✅ Add AI project validation rule
3. ✅ Create PRD validation checklist
4. ✅ Document this issue

**Time:** 30 minutes  
**Risk:** Low  
**Impact:** High

### Phase 2: Short-term (This Sprint)
4. Enhance parse-prd with validation
5. Add project-identity MCP tool
6. Update PRD templates

**Time:** 4-6 hours  
**Risk:** Medium  
**Impact:** High

### Phase 3: Long-term (Future Sprint)
7. Terminal prompt integration
8. Visual project badges
9. Consider project-scoped Taskmaster

**Time:** TBD  
**Risk:** Variable  
**Impact:** Medium

---

## 🔒 Safeguards & Escape Hatches

### Legitimate Cross-Project Work

If user NEEDS to implement ProjectA tasks in ProjectB:

```bash
# Explicit flag to bypass validation
task-master parse-prd prd.txt --force-cross-project --target-project="ProjectB"

# AI rule: Require documented justification
# Add to task notes:
"Cross-project implementation: Implementing ClientA auth pattern 
in ClientB because [specific technical reason]. Approved by [user]."
```

### False Positive Handling

If validation is too strict:

```bash
# Add project alias
task-master add-project-alias "orchestrator" "Orchestrator_Project"
task-master add-project-alias "orch" "Orchestrator_Project"

# Validation will accept any alias
```

### Emergency Override

```bash
# Skip all validation (use with extreme caution)
export TASKMASTER_SKIP_PROJECT_VALIDATION=1
task-master parse-prd prd.txt
```

---

## 📊 Success Metrics

### Short-term (1 month)
- ✅ Zero project confusion incidents
- ✅ 100% PRD project name accuracy
- ✅ <1 minute to validate project identity

### Long-term (3 months)
- ✅ Automated validation in 100% of parse-prd calls
- ✅ AI catches project mismatches before user does
- ✅ Team adoption of PRD checklist

### Quantifiable
- **Before:** 1 confusion incident per sprint (potential)
- **After:** 0 confusion incidents (target)
- **Time saved:** 30-60 minutes per avoided incident

---

## 🎓 Lessons Learned

### What Went Well
- User caught the issue before wrong implementation
- Analysis confirmed implementation was correct
- Created comprehensive documentation of the problem

### What Could Be Better
- Should have validated project identity upfront
- Config.json projectName was never corrected
- No automated checks in place

### Systemic Improvements
- Multi-layer validation (PRD, AI, Taskmaster)
- Clear documentation and checklists
- Escape hatches for edge cases
- Gradual rollout (warn → block)

---

## 🚀 Next Steps

### Immediate (Owner: Development Team)
1. [x] Document issue (this file)
2. [ ] Fix config.json projectName
3. [ ] Add AI validation rule
4. [ ] Create PRD checklist
5. [ ] Test validation with sample PRD

### Short-term (Owner: Taskmaster Team)
6. [ ] Implement parse-prd validation
7. [ ] Add project-identity MCP tool
8. [ ] Update PRD templates
9. [ ] Write unit tests for validation

### Long-term (Owner: Architecture Team)
10. [ ] Design terminal integration
11. [ ] Implement visual indicators
12. [ ] Evaluate project-scoped architecture

---

**Priority:** 🔴 HIGH  
**Status:** Solutions Proposed  
**Next Action:** Implement Phase 1 (30 minutes)

---

*This document serves as the definitive guide for preventing and handling project identity confusion in the Orchestrator system.*

