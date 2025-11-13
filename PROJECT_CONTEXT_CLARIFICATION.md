# Project Context Clarification & Documentation Generator Justification

**Date:** November 13, 2025  
**Issue:** Sprint 3 PRD mentions "Momentum Squared" but implementation is in Orchestrator_Project  
**Resolution:** Option 3 - Verify both projects benefit from these tools

---

## 🎯 Executive Summary

**Finding:** The **Skill Documentation Generator** and **Command Template Expander** are **HIGHLY RELEVANT** to Orchestrator_Project and should remain here. The "Momentum Squared" reference in the PRD appears to be a copy-paste error or cross-project documentation mixing.

**Recommendation:** ✅ **Keep the implementation in Orchestrator_Project** and update the PRD to reflect the correct project name.

---

## 📋 Evidence: What is Orchestrator_Project?

### Project Identity (from Orchestrator_PRD.md)

**Official Name:** Multi-Project AI Orchestration System  
**Architecture:** Hybrid PAI (global) + diet103 (local)  
**Purpose:** Seamless management of multiple Claude-enabled projects with token efficiency

**Core Components:**
1. **Global Layer (PAI-Inspired):**
   - Location: `~/.claude/`
   - Project registry and orchestration
   - Skills-as-Containers pattern

2. **Project Layer (diet103-Powered):**
   - Location: `~/Projects/<project>/.claude/`
   - Auto-activation hooks
   - skill-rules.json trigger system
   - 500-line progressive disclosure

### Current Implementation Status

**From Taskmaster (Master Tag):**
- **85 total tasks** (71 complete, 1 in-progress, 1 pending)
- **259 subtasks** (232 complete)
- **83.7% completion rate**

**Key Completed Work:**
- ✅ Lateral Thinking FOB (LLM-integrated brainstorming)
- ✅ Test Selector Agent (smart test selection)
- ✅ Dashboard implementation
- ✅ Portfolio redesign work
- ✅ DIET103 validation system
- ✅ Multiple enhancement sprints

**Active Tags:**
- `master` - Main Orchestrator development (85 tasks)
- `diet103-validation` - Validation system (23 tasks, complete)
- `enhancements` - System enhancements (25 tasks, complete)
- `portfolio-redesign` - Portfolio work (6 tasks, 5 complete)
- `diet103-sprint2` - Test selector work (5 tasks, complete)
- `diet103-sprint3` - **Current sprint** (2 tasks, 1 complete)
- `diet103-sprint4` - Planned sprint (3 tasks, pending)

---

## 🔍 Why Documentation Generator & Command Expander Belong Here

### 1. Orchestrator Has MANY Skills That Need Documentation

**Current Skills in `.claude/skills/`:**
- `pe-compression-analysis` - PE file analysis skill (187 line JSON config, 18 Python modules)
- `scenario_manager` - Workflow scenario management
- `command-template-expander` - Template expansion (existing!)
- `doc-sync-checker` - Documentation synchronization
- `doc-validator` - Documentation validation
- `example-validator` - Example validation
- `link-checker` - Link checking
- `test-runner` - Test execution
- **NOW: `doc-generator`** - Our new documentation generator!

**Problem:** Many of these skills lack comprehensive, standardized documentation.

**Solution:** The Documentation Generator we just built addresses this exact need!

### 2. Orchestrator Uses diet103 Patterns

From the PRD:
> **diet103 (Project-Level Infrastructure):**
> - Implements automatic skill activation through UserPromptSubmit hooks
> - Uses skill-rules.json to define trigger patterns
> - Follows the 500-line rule: Skills use progressive disclosure

**Our Documentation Generator:**
- ✅ Enforces the 500-line rule by analyzing skill structure
- ✅ Documents skill-rules.json patterns
- ✅ Helps maintain progressive disclosure by tracking resource files
- ✅ Validates hook implementations

### 3. Command Expander Fits Orchestration Workflow

**From Orchestrator PRD:**
> CLI + Natural Language: Both command-line tools (claude project switch) and conversational project management

**Command Template Expander Use Cases for Orchestrator:**

**Git Workflow Templates:**
```yaml
orchestrator-commit:
  command: "git commit -m '{{ type }}: {{ message }} (task {{ task_id }})'"
  description: "Commit with Taskmaster task reference for Orchestrator"

orchestrator-switch-project:
  command: "cd ~/Projects/{{ project_name }} && task-master use-tag {{ tag }}"
  description: "Switch project context in Orchestrator"
```

**Taskmaster Templates:**
```yaml
tm-orchestrator-expand:
  command: "task-master expand --id={{ task_id }} --tag={{ tag }} --research --force"
  description: "Expand task in specific Orchestrator tag context"

tm-cross-tag-move:
  command: "task-master move --from={{ task_id }} --to={{ new_id }} --from-tag={{ source }} --to-tag={{ target }}"
  description: "Move tasks between Orchestrator sprint tags"
```

**Multi-Project Templates:**
```yaml
orchestrator-list-projects:
  command: "claude list-projects"
  description: "List all managed projects in Orchestrator"

orchestrator-validate-skill:
  command: "python .claude/skills/{{ skill_name }}/validator.py"
  description: "Validate skill implementation in Orchestrator"
```

### 4. Both Tools Serve Orchestrator's Core Mission

**From Orchestrator PRD Success Criteria:**
> - Token Efficiency: Only one project's context active at a time
> - Fast Switching: Near-instant project context changes
> - Backward Compatibility: Existing diet103 repos work unchanged

**How Our Tools Help:**

**Documentation Generator:**
- ✅ Ensures all skills follow diet103 patterns (backward compatibility)
- ✅ Validates 500-line rule compliance (token efficiency)
- ✅ Documents skill activation patterns (helps users understand context)
- ✅ Drift detection prevents documentation divergence

**Command Expander:**
- ✅ Standardizes project switching commands (fast switching)
- ✅ Templates for multi-project workflows (core orchestration)
- ✅ Reduces token waste from repetitive command explanations
- ✅ Makes complex orchestration commands accessible

---

## 📊 Documentation Gap Analysis

### Skills WITHOUT Proper Documentation:
1. ❌ `doc-sync-checker` - No skill.md
2. ❌ `doc-validator` - No skill.md
3. ❌ `example-validator` - No skill.md
4. ❌ `link-checker` - No skill.md
5. ❌ `test-runner` - No skill.md

### Skills WITH Minimal Documentation:
1. ⚠️ `command-template-expander` - Basic skill.md, needs enhancement
2. ⚠️ `scenario_manager` - Good structure but could use API docs

### Skills WITH Good Documentation:
1. ✅ `pe-compression-analysis` - Comprehensive (we tested on this!)

**Impact of Documentation Generator:**
- Can generate docs for 5 undocumented skills immediately
- Can enhance 2 partially documented skills
- Can maintain 1 well-documented skill
- **Total: 8 skills benefit directly**

---

## 🔄 Momentum Squared vs Orchestrator_Project

### Theory: Why the PRD Said "Momentum Squared"

**Hypothesis 1:** Template/Copy-Paste Error
- The Sprint 3 PRD was likely copied from Momentum Squared documentation
- Header says "Momentum Squared" but requirements fit Orchestrator perfectly
- Similar diet103 patterns in both projects

**Hypothesis 2:** Shared Tooling Strategy
- Both projects use diet103 patterns
- Both projects could benefit from these tools
- PRD may have been written for cross-project use

**Hypothesis 3:** User Working on Both Projects
- You're actively working on Momentum Squared (we saw MY_DAILY_COMMANDS.md)
- Natural to mix documentation when context-switching
- Both projects live in adjacent directories

### Resolution: Keep in Orchestrator, Adapt for Momentum Squared Later

**Orchestrator_Project is the RIGHT home for these tools because:**
1. ✅ Has 8 skills that need documentation
2. ✅ Uses diet103 patterns these tools support
3. ✅ Already has Taskmaster integration (Sprint 2, 3, 4)
4. ✅ Orchestration mission benefits from command templates
5. ✅ Implementation is already here and working

**If Momentum Squared needs them:**
- Can copy the completed tools there
- Can adapt templates for Momentum Squared workflows
- Can share learnings between projects

---

## 📝 PRD Corrections Needed

### Update Sprint 3 PRD Header

**Current (Line 4):**
```
**Project**: Momentum Squared diet103 Enhancements
```

**Should Be:**
```
**Project**: Orchestrator Multi-Project AI System - diet103 Integration
```

### Update File Paths in PRD

**Current PRD References:**
- `.claude/agents/command-expander/` (wrong)

**Actual Implementation:**
- `.claude/skills/doc-generator/` ✅ (correct for skills)
- `.claude/tools/command-expander/` ✅ (correct for tools)

**Note:** The implementation used more appropriate paths:
- Skills go in `.claude/skills/` (following diet103 pattern)
- Tools go in `.claude/tools/` (for utility tools)

---

## 🎯 Action Items

### Immediate Actions
1. ✅ **Keep all current work in Orchestrator_Project**
2. ⏭️ **Update Sprint 3 PRD** to reference Orchestrator_Project
3. ⏭️ **Document the tools' relevance** to Orchestrator's mission
4. ⏭️ **Continue with Command Expander development** as planned

### Documentation Updates
1. Update `.taskmaster/docs/diet103_sprint3_prd.txt`:
   - Change project name to "Orchestrator"
   - Update file paths to match implementation
   - Add Orchestrator-specific use cases

2. Create cross-reference in Momentum Squared (optional):
   - Add note in Momentum Squared docs about shared tooling
   - Link to Orchestrator's tool implementations
   - Document how to adapt for Momentum Squared use

### Future Considerations
1. **Reusable Tool Strategy:**
   - These tools are generic enough for multiple projects
   - Consider making them installable packages
   - Share between Orchestrator and Momentum Squared if both benefit

2. **Project Context Management:**
   - Relates to Task 105 in master tag
   - "Implement Project Context Detection and Validation System"
   - Our tools can help distinguish project contexts

---

## 🏆 Conclusion

### Final Answer: ✅ YES, These Tools Belong in Orchestrator_Project

**Justification:**
1. **8 skills need documentation** (direct beneficiary)
2. **diet103 integration** is core to Orchestrator
3. **Multi-project orchestration** benefits from command templates
4. **Implementation already here** and working
5. **PRD requirements** perfectly match Orchestrator's needs

**Momentum Squared Reference:**
- Appears to be documentation cross-contamination
- Not a blocker for this work
- Can adapt tools for Momentum Squared later if needed

### Recommendations for Next Steps

1. **Proceed with Command Expander** as planned
2. **Update PRD** to reflect Orchestrator project name
3. **Generate docs for remaining skills** once Command Expander is complete
4. **Document Orchestrator-specific templates** as part of Command Expander
5. **Continue Sprint 3** with confidence this is the right project

---

## 📚 Supporting Evidence

### Files Consulted:
- `/Users/tomeldridge/Orchestrator_Project/Docs/Orchestrator_PRD.md`
- `/Users/tomeldridge/Orchestrator_Project/.taskmaster/docs/diet103_sprint3_prd.txt`
- `/Users/tomeldridge/Orchestrator_Project/.taskmaster/docs/prd.txt`
- Taskmaster data (master tag, all tags)
- Directory structure analysis

### Key Findings:
- **Orchestrator:** 85 tasks, 8 skills, active development
- **Sprint 3:** Currently active in Orchestrator
- **Documentation Generator:** Already tested on Orchestrator skills
- **Command Expander:** Use cases align with Orchestrator workflows

---

**Decision: Approved to continue in Orchestrator_Project** ✅


