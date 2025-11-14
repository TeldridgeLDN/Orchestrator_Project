# [PROJECT_NAME] - Sprint [X]: [Sprint Theme]
# Product Requirements Document (PRD)

**Project**: [PROJECT_NAME] ⚠️ REPLACE THIS PLACEHOLDER
**Sprint**: [X] - [Sprint Theme]
**Date**: [YYYY-MM-DD]
**Author**: [Your Name]
**Version**: 1.0

<!-- 
═══════════════════════════════════════════════════════════════
                    PRD VALIDATION CHECKLIST
═══════════════════════════════════════════════════════════════

BEFORE PARSING THIS PRD WITH task-master parse-prd:

✅ Pre-Flight Checks:
   [ ] Replaced [PROJECT_NAME] with actual project name
   [ ] Verified working directory: pwd
   [ ] Confirmed config project name: 
       jq -r '.global.projectName' .taskmaster/config.json
   [ ] Checked git branch: git branch --show-current
   [ ] Reviewed entire PRD header for copy-paste artifacts

⚠️ Common Mistakes to Avoid:
   ❌ Copying PRD from another project without updating project name
   ❌ Using outdated template with wrong project name
   ❌ Working in wrong directory while reading correct PRD
   ❌ Mixing similar project names (ClientA vs ClientB)

🔍 Quick Validation:
   Run this before parse-prd:
   
   echo "Directory: $(basename $(pwd))"
   echo "Config: $(jq -r '.global.projectName' .taskmaster/config.json)"
   echo "Git: $(git remote get-url origin 2>/dev/null | sed 's/.*\///' | sed 's/\.git$//' || echo 'N/A')"
   
   Expected: All should refer to the SAME project

═══════════════════════════════════════════════════════════════
-->

---

## Executive Summary

[Brief overview of the sprint goals and expected outcomes]

### Sprint Goals
1. [Goal 1]
2. [Goal 2]
3. [Goal 3]

### Success Metrics
- [Metric 1]
- [Metric 2]
- [Metric 3]

---

## Sprint Overview

[Detailed description of the sprint focus and context]

---

## Tasks

### Task 1: [Task Title]

**Description:**
[Detailed task description]

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

**Estimated Effort:** [X hours/days]

**Dependencies:**
- [Dependency 1]
- [Dependency 2]

**Technical Notes:**
[Any technical considerations, architecture decisions, or implementation guidance]

**Testing Strategy:**
[How to test and validate this task]

---

### Task 2: [Task Title]

[Repeat structure for each task]

---

## Technical Considerations

[Any cross-cutting concerns, architectural decisions, or general technical notes]

---

## Dependencies & Risks

**Dependencies:**
- [External dependency 1]
- [External dependency 2]

**Risks:**
- [Risk 1 and mitigation]
- [Risk 2 and mitigation]

---

## Timeline

**Sprint Duration:** [X weeks]
**Key Milestones:**
- Week 1: [Milestone]
- Week 2: [Milestone]
- Week 3: [Milestone]

---

## Appendix

**References:**
- [Reference 1]
- [Reference 2]

**Change Log:**
| Date | Version | Changes | Author |
|------|---------|---------|--------|
| [YYYY-MM-DD] | 1.0 | Initial version | [Name] |

---

<!-- 
═══════════════════════════════════════════════════════════════
              POST-PARSING VALIDATION CHECKLIST
═══════════════════════════════════════════════════════════════

AFTER task-master parse-prd completes:

✅ Verify Tasks Generated:
   [ ] task-master list --tag=[sprint-tag]
   [ ] All tasks match PRD sections
   [ ] Task descriptions are accurate
   [ ] Dependencies are correctly set

✅ Check Project Identity:
   [ ] Tasks appear in correct project
   [ ] Tag name reflects correct context
   [ ] No cross-contamination from other projects

✅ Next Steps:
   [ ] Review complexity: task-master analyze-complexity --tag=[sprint-tag]
   [ ] Expand tasks: task-master expand --all --tag=[sprint-tag]
   [ ] Start work: task-master next --tag=[sprint-tag]

═══════════════════════════════════════════════════════════════
-->

