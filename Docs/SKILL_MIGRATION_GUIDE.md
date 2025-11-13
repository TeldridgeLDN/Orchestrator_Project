# Skill Migration Guide: Transitioning to Structured Format

**Version:** 1.0  
**Target Audience:** Skill maintainers and contributors  
**Prerequisites:** Read `SKILL_STRUCTURE_SPECIFICATION.md`

---

## Overview

This guide provides step-by-step instructions for migrating existing skills to the structured format defined by the diet103 500-line rule.

**When to Migrate:**
- Skill exceeds 300 lines
- Content naturally divides into detail levels
- Users report difficulty finding information
- Skill has supplementary documentation already

**When NOT to Migrate:**
- Skill is under 300 lines and well-organized
- Content is cohesive and doesn't divide naturally
- Migration would create artificial complexity

---

## Pre-Migration Checklist

Before starting migration:

- [ ] Read the [Skill Structure Specification](SKILL_STRUCTURE_SPECIFICATION.md)
- [ ] Review the [Skill Audit Report](SKILL_AUDIT_REPORT.md)
- [ ] Read templates in `templates/skill-template/`
- [ ] Back up current skill files
- [ ] Ensure skill is under version control (git)
- [ ] Test current skill functionality
- [ ] Document current auto-activation triggers

---

## Migration Process

### Phase 1: Analysis

#### Step 1.1: Content Inventory

Create a content map of your current skill documentation:

```bash
# Count lines in current file
wc -l /path/to/skill.md

# Identify major sections
grep "^##" /path/to/skill.md
```

**Document:**
- Total line count
- Main sections (with line ranges)
- Example code blocks
- Cross-references to other files
- External links

**Tool:** Use `analyze-skill.sh` script (see Tools section)

---

#### Step 1.2: Identify Natural Boundaries

Ask yourself:

1. **Overview Content** (~50-100 lines)
   - What is essential to understand this skill?
   - What would a new user need to know first?

2. **Quick Reference** (< 100 lines)
   - What commands/functions are most common?
   - What would an experienced user look up?

3. **Setup Details** (< 500 lines)
   - What installation steps exist?
   - What configuration is needed?

4. **API/Technical** (< 500 lines)
   - What are the function signatures?
   - What parameters and return values exist?

5. **Troubleshooting** (< 500 lines)
   - What common problems occur?
   - What solutions work?

**Output:** Content distribution plan

---

#### Step 1.3: Create Migration Plan Document

```markdown
# Migration Plan: [Skill Name]

## Current State
- File: skill.md
- Lines: [count]
- Sections: [list]

## Target State
- SKILL.md: ~[X] lines
- resources/quick-ref.md: ~[X] lines
- resources/setup-guide.md: ~[X] lines
- resources/api-reference.md: ~[X] lines
- resources/troubleshooting.md: ~[X] lines

## Content Map
| Current Section | Target File | Lines |
|----------------|-------------|-------|
| [section] | [file] | [count] |

## Cross-References to Update
- [ ] Link 1: [description]
- [ ] Link 2: [description]
```

---

### Phase 2: Structure Creation

#### Step 2.1: Create Directory Structure

```bash
cd /path/to/skill
mkdir -p resources
mkdir -p backup

# Backup current files
cp *.md backup/
cp *.json backup/ 2>/dev/null || true
```

---

#### Step 2.2: Copy Templates

```bash
# Copy template files
cp ~/Orchestrator_Project/templates/skill-template/SKILL.md ./SKILL.md.new
cp ~/Orchestrator_Project/templates/skill-template/resources/*.md ./resources/
cp ~/Orchestrator_Project/templates/skill-template/metadata.json ./metadata.json

# If you don't have the template locally
# manually create files following the template structure
```

---

### Phase 3: Content Migration

#### Step 3.1: Extract Overview Content

**Target:** SKILL.md (Overview section)

1. Open old skill.md
2. Copy high-level description (first 50-100 lines typically)
3. Paste into SKILL.md Overview section
4. Edit for conciseness
5. Remove template comments

**Focus on:**
- What the skill does
- When to use it
- Key capabilities (bullets)

---

#### Step 3.2: Create Quick Start Examples

**Target:** SKILL.md (Quick Start section)

1. Identify 3-5 most common use cases
2. Extract minimal working examples
3. Add brief explanations
4. Keep total under 100 lines

**Format:**
```markdown
### Most Common Tasks

#### 1. [Task Name]
```bash
# [Brief description]
[minimal command]
```

#### 2. [Task Name]
...
```

---

#### Step 3.3: Build Quick Reference

**Target:** resources/quick-ref.md

1. Extract all command syntax
2. Create command table
3. Add parameter reference
4. Include common patterns
5. **Ensure < 100 lines**

**Use tables for density:**
```markdown
| Command | Purpose | Syntax |
|---------|---------|--------|
| cmd1 | description | `cmd1 [args]` |
```

**Tool:** Use `extract-commands.sh` (see Tools section)

---

#### Step 3.4: Migrate Setup Content

**Target:** resources/setup-guide.md

1. Extract all installation steps
2. Copy configuration examples
3. Include verification procedures
4. Add troubleshooting for setup issues
5. Keep under 500 lines

**Follow template structure:**
- Prerequisites
- Installation
- Configuration
- Verification

---

#### Step 3.5: Extract API/Technical Details

**Target:** resources/api-reference.md

1. Copy function signatures
2. Document parameters
3. List return values
4. Include error codes
5. Add type definitions
6. Keep under 500 lines

**Use consistent format:**
```markdown
### `functionName(param1, param2)`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| param1 | Type | Yes | Description |
```

---

#### Step 3.6: Compile Troubleshooting Content

**Target:** resources/troubleshooting.md

1. Extract all error messages
2. List common problems
3. Document solutions
4. Add diagnostic commands
5. Include FAQ
6. Keep under 500 lines

**Use problem-solution format:**
```markdown
### Issue: [Error message or problem]

**Symptoms:**
- [List symptoms]

**Solution:**
1. [Step-by-step fix]
```

---

#### Step 3.7: Create Navigation in SKILL.md

**Target:** SKILL.md (Available Resources section)

1. List each resource file
2. Describe what each contains
3. Estimate reading time
4. Provide clear links
5. Show how to request resources

**Format:**
```markdown
## Available Resources

### Quick Reference (`quick-ref`)
**Size:** < 100 lines | **Read Time:** 2 minutes

[Description of contents]

**Request:** "Show me the quick reference"

→ [View Quick Reference](resources/quick-ref.md)
```

---

### Phase 4: Cross-Reference Updates

#### Step 4.1: Update Internal Links

1. Find all links in SKILL.md
2. Update paths to resources/
3. Add "Back to Overview" links in resources
4. Test all links resolve correctly

**Find links:**
```bash
grep -n '\[.*\](.*\.md)' SKILL.md resources/*.md
```

---

#### Step 4.2: Update External References

If other skills or documentation reference this skill:

1. Search for references: `grep -r "skill-name" ..`
2. Update links if file structure changed
3. Test external links still work

---

### Phase 5: Validation

#### Step 5.1: Verify Line Counts

```bash
echo "=== Line Count Validation ==="
echo "SKILL.md:" && wc -l SKILL.md
echo "quick-ref.md:" && wc -l resources/quick-ref.md
echo "setup-guide.md:" && wc -l resources/setup-guide.md
echo "api-reference.md:" && wc -l resources/api-reference.md
echo "troubleshooting.md:" && wc -l resources/troubleshooting.md

# Check limits
for file in resources/*.md; do
  lines=$(wc -l < "$file")
  name=$(basename "$file")
  if [[ "$name" == "quick-ref.md" && $lines -gt 100 ]]; then
    echo "❌ $name exceeds 100 line limit: $lines lines"
  elif [[ $lines -gt 500 ]]; then
    echo "❌ $name exceeds 500 line limit: $lines lines"
  else
    echo "✅ $name: $lines lines"
  fi
done
```

**Tool:** Use `validate-structure.sh` (see Tools section)

---

#### Step 5.2: Content Completeness Check

- [ ] All original content preserved or intentionally removed
- [ ] No duplicated content between files
- [ ] Examples still make sense in new context
- [ ] Technical accuracy maintained

**Compare:**
```bash
# Word count should be similar
wc -w backup/skill.md
wc -w SKILL.md resources/*.md | tail -1
```

---

#### Step 5.3: Link Validation

```bash
# Check all markdown links
for file in SKILL.md resources/*.md; do
  echo "Checking links in $file..."
  grep -o '\[.*\](.*\.md[^)]*)' "$file" | while read -r link; do
    target=$(echo "$link" | sed 's/.*](\(.*\))/\1/')
    if [ ! -f "$(dirname "$file")/$target" ]; then
      echo "❌ Broken link in $file: $target"
    fi
  done
done
```

---

#### Step 5.4: Functional Testing

1. **Test Auto-Activation:**
   - Verify hook still detects skill
   - Test trigger phrases work
   - Confirm skill loads correctly

2. **Test Navigation:**
   - Request each resource explicitly
   - Verify correct content loads
   - Check cross-references work

3. **Test Examples:**
   - Run code examples
   - Verify commands execute
   - Check output is as documented

---

### Phase 6: Finalization

#### Step 6.1: Create/Update metadata.json

```json
{
  "name": "skill-name",
  "version": "2.0.0",
  "structure": {
    "format": "diet103-progressive-disclosure",
    "version": "1.0",
    "mainFile": "SKILL.md",
    "resources": {
      "quick-ref": {
        "file": "resources/quick-ref.md",
        "description": "Command cheat sheet",
        "maxLines": 100
      },
      // ... other resources
    }
  }
}
```

---

#### Step 6.2: Update Changelog

Document the migration:

```markdown
## [2.0.0] - YYYY-MM-DD

### Changed
- **BREAKING:** Restructured documentation following diet103 500-line rule
- Split single file into progressive disclosure structure
- Improved navigation with explicit detail levels

### Migration
- Main documentation now in SKILL.md (~[X] lines)
- Command reference in resources/quick-ref.md
- Setup guide in resources/setup-guide.md
- Technical details in resources/api-reference.md
- Troubleshooting in resources/troubleshooting.md

### Added
- metadata.json with structure metadata
- Progressive disclosure navigation
- Explicit resource loading

### Removed
- Monolithic skill.md (backed up in backup/)
```

---

#### Step 6.3: Clean Up

```bash
# Remove old skill.md if no longer needed
# (Backup is in backup/ directory)
rm skill.md.old 2>/dev/null || true

# Remove template comments from all files
for file in SKILL.md resources/*.md; do
  sed -i.bak '/^<!-- TEMPLATE/,/^-->/d' "$file"
  rm "$file.bak"
done
```

---

#### Step 6.4: Commit Changes

```bash
git add SKILL.md resources/ metadata.json
git commit -m "refactor: Restructure skill following diet103 500-line rule

- Split [old-name].md into progressive disclosure structure
- Created SKILL.md with overview and navigation (~[X] lines)
- Extracted quick reference to resources/ (< 100 lines)
- Moved detailed docs to resources/ (< 500 lines each)
- Added metadata.json with structure metadata
- Updated all cross-references
- Verified all links functional
- Tested auto-activation still works

Closes #[issue-number]
"
```

---

## Rollback Procedure

If migration causes issues:

### Immediate Rollback

```bash
# Restore from backup
cd /path/to/skill
rm -rf resources/ SKILL.md metadata.json
cp backup/* .
```

### Git Rollback

```bash
git revert [commit-hash]
```

---

## Common Migration Challenges

### Challenge 1: Content Doesn't Fit Cleanly

**Symptom:** Content spans multiple categories

**Solution:**
- Place in most relevant resource
- Add cross-reference to related content
- Use "See also" sections

---

### Challenge 2: Quick Reference Exceeds 100 Lines

**Symptom:** Too many commands to fit in quick-ref.md

**Solution Options:**
1. **Curate:** Include only most common commands
2. **Categorize:** Group related commands
3. **Use tables:** More dense than lists
4. **Split:** Create multiple quick-ref files (e.g., quick-ref-basic.md, quick-ref-advanced.md)

---

### Challenge 3: Lots of Small Sections

**Symptom:** Many small sections don't reach resource size

**Solution:**
- Combine related small sections
- Create single "advanced.md" or "misc.md" resource
- Keep in SKILL.md if total stays under 500 lines

---

### Challenge 4: External Dependencies

**Symptom:** Skill references external files that also need updating

**Solution:**
1. Document all external dependencies
2. Update in coordinated commit
3. Test integration after migration
4. Communicate changes to dependents

---

## Migration Tools

See `tools/skill-migration/` directory for helper scripts:

1. **analyze-skill.sh** - Analyze current skill structure
2. **extract-commands.sh** - Extract command syntax
3. **validate-structure.sh** - Validate migrated structure
4. **update-links.sh** - Update cross-references
5. **generate-metadata.sh** - Create metadata.json

Usage documented in each script.

---

## Success Criteria

Migration is successful when:

- [ ] All files meet size limits
- [ ] All content preserved or intentionally removed
- [ ] All links functional
- [ ] Navigation clear and intuitive
- [ ] Auto-activation still works
- [ ] Examples execute correctly
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Changes committed
- [ ] No regressions in functionality

---

## Getting Help

**Questions about migration?**
- Check [Skill Structure Specification](SKILL_STRUCTURE_SPECIFICATION.md)
- Review [Skill Audit Report](SKILL_AUDIT_REPORT.md)
- See reference implementation: `scenario_manager` skill
- Ask in project discussions

---

**Happy Migrating!**

