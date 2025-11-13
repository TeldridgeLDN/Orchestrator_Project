# Diet103 500-Line Rule Migration Plan

## Overview

This document outlines the comprehensive plan for migrating all existing skills to follow the diet103 500-line rule with structured detail levels.

## Current State Analysis

### Skills with SKILL.md Files

| Skill | Lines | Status | Priority |
|-------|-------|--------|----------|
| web-asset-generator | 766 | **EXCEEDS LIMIT** | HIGH |
| file_lifecycle_manager | 483 | Within limit | MEDIUM |
| project_orchestrator | 298 | Within limit | LOW |
| astro-core | 92 | Within limit | LOW |
| astro-content-collections | 92 | Within limit | LOW |
| tailwind-css | 75 | Within limit | LOW |
| scenario_builder | 74 | Within limit | LOW |
| netlify-deployment | 70 | Within limit | LOW |
| mdx-docs | 70 | Within limit | LOW |
| framer-motion | 70 | Within limit | LOW |

### Skills WITHOUT SKILL.md Files

**CRITICAL - Missing core documentation:**
- workflow-execution
- validation-framework
- usage-limit-manager
- references
- python-execution
- portfolio-optimization
- documentation
- development
- database-operations
- bayesian-scoring

## Migration Strategy

### Phase 1: Critical Migrations (HIGH Priority)

**1. web-asset-generator (766 lines → needs restructuring)**
- **Issue**: Exceeds 500-line limit by 266 lines
- **Action**: Split into SKILL.md + resources/
- **Effort**: 4 hours
- **Details**:
  - Extract API reference to `resources/api-reference.md`
  - Extract examples to `resources/examples.md`
  - Extract troubleshooting to `resources/troubleshooting.md`
  - Keep overview, quick-start, and navigation in SKILL.md

**2. Create SKILL.md for 10 skills with NO documentation**
- **Issue**: Missing primary documentation entry point
- **Action**: Create from templates + metadata
- **Effort**: 1 hour per skill = 10 hours total
- **Priority Order**:
  1. validation-framework (likely used frequently)
  2. workflow-execution (core functionality)
  3. database-operations (if applicable to projects)
  4. development (if applicable)
  5. Others as needed

### Phase 2: Structure Enhancement (MEDIUM Priority)

**Skills with SKILL.md but missing resources/**
- **Action**: Add progressive disclosure resources
- **Effort**: 2 hours per skill
- **Candidates**:
  - file_lifecycle_manager (483 lines, add resources for progressive disclosure)
  - project_orchestrator (298 lines, already has resources/, verify structure)

### Phase 3: Validation & Polish (LOW Priority)

**All other skills (70-92 lines)**
- **Status**: Already compliant, minimal action needed
- **Action**: Verify they have minimal resources/ structure
- **Effort**: 30 min per skill

## Migration Tools

### Tool 1: Skill Structure Analyzer
**Purpose**: Analyze current skill structure and identify gaps

**Script**: `scripts/analyze-skill-structure.js`

**Output**: JSON report with:
```json
{
  "skillName": "web-asset-generator",
  "hasSkillMd": true,
  "skillMdLines": 766,
  "exceedsLimit": true,
  "hasResources": true,
  "resourceFiles": ["examples.md"],
  "missingResources": ["quick-ref.md", "api-reference.md", "troubleshooting.md"],
  "recommendations": [
    "Split SKILL.md into multiple files",
    "Create quick-ref.md with command summary",
    "Move API details to api-reference.md"
  ]
}
```

### Tool 2: Content Splitter
**Purpose**: Intelligently split large SKILL.md files

**Script**: `scripts/split-skill-content.js`

**Features**:
- Detects section headers (##, ###)
- Identifies API reference sections
- Identifies troubleshooting sections
- Identifies example code blocks
- Suggests file splits with line counts
- Generates cross-reference links

**Usage**:
```bash
node scripts/split-skill-content.js --skill=web-asset-generator --dry-run
node scripts/split-skill-content.js --skill=web-asset-generator --execute
```

### Tool 3: SKILL.md Generator
**Purpose**: Generate SKILL.md from templates + metadata

**Script**: `scripts/generate-skill-md.js`

**Features**:
- Reads skill metadata.json
- Applies appropriate template
- Generates navigation to resources/
- Includes placeholder sections
- Respects 300-line target

**Usage**:
```bash
node scripts/generate-skill-md.js --skill=validation-framework
node scripts/generate-skill-md.js --all-missing
```

### Tool 4: Resource File Generator
**Purpose**: Create resource files from templates

**Script**: `scripts/generate-resource-files.js`

**Features**:
- Creates resources/ directory if missing
- Generates quick-ref.md
- Generates setup-guide.md (if applicable)
- Generates api-reference.md (if applicable)
- Generates troubleshooting.md

**Usage**:
```bash
node scripts/generate-resource-files.js --skill=file_lifecycle_manager --type=quick-ref
node scripts/generate-resource-files.js --skill=file_lifecycle_manager --all
```

### Tool 5: Cross-Reference Updater
**Purpose**: Update links between files after migration

**Script**: `scripts/update-cross-references.js`

**Features**:
- Scans for broken links
- Updates relative paths
- Adds "See also" sections
- Validates all links

**Usage**:
```bash
node scripts/update-cross-references.js --skill=web-asset-generator --validate
node scripts/update-cross-references.js --skill=web-asset-generator --fix
```

### Tool 6: Structure Validator
**Purpose**: Validate migrated skills against spec

**Script**: `scripts/validate-skill-structure.js`

**Checks**:
- SKILL.md exists and ≤500 lines
- Resource files ≤500 lines each
- Navigation links are valid
- All sections have appropriate content
- Cross-references work

**Usage**:
```bash
node scripts/validate-skill-structure.js --skill=web-asset-generator
node scripts/validate-skill-structure.js --all
```

## Migration Process

### For Skills Exceeding Limit (web-asset-generator)

**Step 1: Analyze**
```bash
node scripts/analyze-skill-structure.js --skill=web-asset-generator
```

**Step 2: Split Content (Dry Run)**
```bash
node scripts/split-skill-content.js --skill=web-asset-generator --dry-run
```
- Review suggested splits
- Adjust if needed

**Step 3: Execute Split**
```bash
node scripts/split-skill-content.js --skill=web-asset-generator --execute
```
- Creates resources/ directory
- Moves content to appropriate files
- Updates SKILL.md with navigation

**Step 4: Update Cross-References**
```bash
node scripts/update-cross-references.js --skill=web-asset-generator --fix
```

**Step 5: Validate**
```bash
node scripts/validate-skill-structure.js --skill=web-asset-generator
```

**Step 6: Manual Review**
- Test navigation between files
- Verify content categorization
- Check examples still work
- Commit changes

### For Skills Missing SKILL.md

**Step 1: Generate from Template**
```bash
node scripts/generate-skill-md.js --skill=validation-framework
```
- Uses metadata.json
- Creates placeholder sections
- Adds navigation framework

**Step 2: Generate Resources**
```bash
node scripts/generate-resource-files.js --skill=validation-framework --all
```
- Creates resources/ directory
- Generates all standard resource files

**Step 3: Manual Content Addition**
- Fill in placeholders
- Add real examples
- Document actual workflows

**Step 4: Validate**
```bash
node scripts/validate-skill-structure.js --skill=validation-framework
```

**Step 5: Commit**

### For Skills Within Limit but Missing Resources

**Step 1: Analyze**
```bash
node scripts/analyze-skill-structure.js --skill=file_lifecycle_manager
```

**Step 2: Generate Missing Resources**
```bash
node scripts/generate-resource-files.js --skill=file_lifecycle_manager --type=quick-ref
```

**Step 3: Extract Content**
- Manually move appropriate sections from SKILL.md
- Or leave SKILL.md as-is if it's already progressive

**Step 4: Validate**
```bash
node scripts/validate-skill-structure.js --skill=file_lifecycle_manager
```

## Rollback Procedures

### Before Migration
```bash
# Create backup
cp -r ~/.claude/skills/SKILL_NAME ~/.claude/skills/SKILL_NAME.backup
```

### If Migration Fails
```bash
# Restore backup
rm -rf ~/.claude/skills/SKILL_NAME
mv ~/.claude/skills/SKILL_NAME.backup ~/.claude/skills/SKILL_NAME
```

### Git-Based Rollback
```bash
# If in version control
git checkout -- ~/.claude/skills/SKILL_NAME/
```

## Testing Strategy

### Unit Tests
- Test each migration tool independently
- Mock file system operations
- Validate outputs

### Integration Tests
- Run full migration on test skill
- Verify structure matches spec
- Check all links work

### User Acceptance Tests
- Skill loads correctly in context
- Navigation works as expected
- Content is accessible and readable

## Success Metrics

- [ ] All skills have SKILL.md ≤500 lines
- [ ] All resource files ≤500 lines
- [ ] All skills pass validation script
- [ ] Navigation links work correctly
- [ ] Content is properly categorized
- [ ] Token usage reduced by 20-30% (estimated)

## Timeline

| Phase | Tasks | Duration | Target Date |
|-------|-------|----------|-------------|
| Phase 1 | High-priority migrations | 14 hours | Week 1 |
| Phase 2 | Medium-priority migrations | 6 hours | Week 2 |
| Phase 3 | Validation & polish | 5 hours | Week 2 |
| **Total** | **All migrations** | **25 hours** | **2 weeks** |

## Special Cases

### Skills with Custom Structure
Some skills may have unique requirements:

**scenario_builder**
- Already has workflows/ directory
- May need custom resource organization
- Validate templates/ directory handling

**file_lifecycle_manager**
- Has hooks/ directory
- Has lib/ directory with actual code
- Docs vs code separation already exists

### Skills with No Documentation
For skills with only metadata.json:
- Generate complete documentation from scratch
- Use metadata fields as starting point
- May require developer input for details

## Post-Migration

### Documentation Updates
- Update main README with new structure
- Create quick guide for navigating skills
- Document how to request detail levels

### Hook Updates
- Ensure UserPromptSubmit hook respects structure
- Update auto-activation patterns
- Test progressive disclosure

### Template Updates
- Ensure new skill template reflects standard
- Update skill creation documentation
- Add examples of good structure

## Appendix: File Size Guidelines

### SKILL.md Target
- **Ideal**: 200-300 lines
- **Maximum**: 500 lines
- **Contents**:
  - Overview (50-100 lines)
  - Quick start (50-100 lines)
  - Navigation (30-50 lines)
  - Core concepts (50-100 lines)
  - Links to resources (20-30 lines)

### Resource Files Target
- **quick-ref.md**: <100 lines (TL;DR command cheat sheet)
- **setup-guide.md**: 200-500 lines (detailed setup)
- **api-reference.md**: 200-500 lines (API/technical)
- **troubleshooting.md**: 100-300 lines (common issues)
- **examples.md**: 100-400 lines (code examples)

### Token Savings Calculation
Assuming average 4 chars/token:
- Loading 300-line SKILL.md: ~75 tokens
- Loading 766-line SKILL.md: ~190 tokens
- **Savings**: ~115 tokens per load (60% reduction)
- With progressive disclosure: Only load details when needed
- **Estimated total savings**: 20-30% across all skill loads

## Conclusion

This migration plan provides a clear, tool-supported path to bring all skills into compliance with the diet103 500-line rule while improving discoverability and reducing token usage.

