# Skill Migration Tools

Helper scripts for migrating skills to the structured format defined by the diet103 500-line rule.

## Available Tools

### 1. analyze-skill.sh

Analyzes an existing skill file and generates a comprehensive report.

**Usage:**
```bash
./analyze-skill.sh <path-to-skill.md>
```

**Example:**
```bash
./analyze-skill.sh ~/.claude/skills/my-skill/skill.md
```

**Output:**
- Total line count and status (under/over limits)
- Section breakdown with line numbers
- Content statistics (headers, code blocks, links, words)
- Migration analysis and recommendations
- Estimated effort
- Next steps

**When to use:**
- Before starting migration
- To assess if migration is needed
- To plan content distribution

---

### 2. validate-structure.sh

Validates a migrated skill against the specification requirements.

**Usage:**
```bash
./validate-structure.sh <skill-directory>
```

**Example:**
```bash
./validate-structure.sh ~/.claude/skills/my-skill
```

**Checks:**
- ✅ Required files exist (SKILL.md, resources/)
- ✅ Line counts meet limits
- ✅ JSON syntax valid (metadata.json)
- ✅ Required sections present
- ✅ Internal links functional
- ⚠️  Optional but recommended features

**Exit Codes:**
- `0` - Validation passed
- `1` - Validation failed (errors found)

**When to use:**
- After completing migration
- Before committing changes
- As part of CI/CD validation

---

## Quick Start

### Analyze Before Migration

```bash
# Check if your skill needs restructuring
cd ~/Orchestrator_Project/tools/skill-migration
./analyze-skill.sh ~/.claude/skills/your-skill/skill.md
```

### Validate After Migration

```bash
# Verify the migrated structure
./validate-structure.sh ~/.claude/skills/your-skill
```

---

## Migration Workflow

```
1. Analyze current skill
   → ./analyze-skill.sh skill.md

2. Review output and create migration plan

3. Follow SKILL_MIGRATION_GUIDE.md

4. Perform migration manually
   (using templates from templates/skill-template/)

5. Validate migrated structure
   → ./validate-structure.sh skill-directory/

6. Fix any errors/warnings

7. Test functionality

8. Commit changes
```

---

## Tool Dependencies

### Required
- `bash` 4.0+
- `grep`
- `sed`
- `wc`

### Optional
- `jq` - For JSON validation in validate-structure.sh

---

## Examples

### Example 1: Analyze scenario_manager

```bash
$ ./analyze-skill.sh ~/.claude/skills/scenario_manager/SKILL.md

╔══════════════════════════════════════════════════════════════════╗
║             Skill Analysis Report                                 ║
╚══════════════════════════════════════════════════════════════════╝

Skill: scenario_manager
File: /Users/.../.claude/skills/scenario_manager/SKILL.md
Total Lines: 427

Status: ⚠️  Approaching limit (300-500 lines)
Recommendation: Consider restructuring if content grows

──────────────────────────────────────────────────────────────────
Section Breakdown
──────────────────────────────────────────────────────────────────
Line 10: Purpose
Line 20: Capabilities
Line 53: Architecture
...
```

### Example 2: Validate Migrated Skill

```bash
$ ./validate-structure.sh ~/.claude/skills/my-skill

╔══════════════════════════════════════════════════════════════════╗
║             Skill Structure Validation                            ║
╚══════════════════════════════════════════════════════════════════╝

Skill: my-skill
Directory: /Users/.../.claude/skills/my-skill

──────────────────────────────────────────────────────────────────
Required Files Check
──────────────────────────────────────────────────────────────────
✅ SKILL.md exists
✅ resources/ directory exists
✅ metadata.json exists
  └─ Valid JSON syntax

──────────────────────────────────────────────────────────────────
Line Count Validation
──────────────────────────────────────────────────────────────────
✅ SKILL.md: 285 lines (under target)
✅ resources/quick-ref.md: 95 lines
✅ resources/setup-guide.md: 420 lines
✅ resources/api-reference.md: 380 lines

...

═══════════════════════════════════════════════════════════════
✅ VALIDATION PASSED - Structure meets all requirements!
═══════════════════════════════════════════════════════════════
```

---

## Troubleshooting

### Script Won't Execute

```bash
# Make scripts executable
chmod +x *.sh
```

### jq Not Found Warning

```bash
# Install jq (macOS)
brew install jq

# Install jq (Ubuntu/Debian)
sudo apt-get install jq
```

### Broken Link False Positives

The link validator checks relative paths. Ensure:
- Links use correct relative paths
- Referenced files exist
- Path separators are correct for your OS

---

## Contributing

To add new migration tools:

1. Create script in this directory
2. Follow existing naming convention: `action-target.sh`
3. Add usage documentation at top of script
4. Make executable: `chmod +x script.sh`
5. Update this README
6. Test on sample skills

---

## See Also

- [Skill Structure Specification](../../Docs/SKILL_STRUCTURE_SPECIFICATION.md)
- [Skill Migration Guide](../../Docs/SKILL_MIGRATION_GUIDE.md)
- [Skill Audit Report](../../Docs/SKILL_AUDIT_REPORT.md)
- [Template Files](../../templates/skill-template/)

---

**Questions?** Check the main documentation or ask in project discussions.

