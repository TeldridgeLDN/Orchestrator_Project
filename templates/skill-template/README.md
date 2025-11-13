# Skill Template

This directory contains the standard template for creating new skills following the diet103 500-line rule and progressive disclosure pattern.

## Quick Start

To create a new skill:

1. **Copy this template directory:**
   ```bash
   cp -r templates/skill-template ~/.claude/skills/your-skill-name
   ```

2. **Customize the files:**
   - Replace all `[placeholders]` with actual content
   - Remove template instruction comments
   - Adjust content to fit your skill's needs

3. **Verify structure:**
   - Check line counts: `wc -l *.md resources/*.md`
   - Ensure SKILL.md < 500 lines
   - Ensure quick-ref.md < 100 lines
   - Ensure all other resources < 500 lines

## Template Structure

```
skill-template/
├── SKILL.md                      # Main entry point (~300 lines)
├── metadata.json                 # Skill manifest
├── README.md                     # This file
└── resources/                    # Detail-level resources
    ├── quick-ref.md             # <100 lines - Command cheat sheet
    ├── setup-guide.md           # <500 lines - Detailed setup
    ├── api-reference.md         # <500 lines - API documentation
    └── troubleshooting.md       # <500 lines - Common issues
```

## File Descriptions

### SKILL.md
The main entry point, always loaded when the skill is activated. Contains:
- Overview of the skill
- Quick start examples
- Navigation to detail-level resources
- Metadata

**Target Size:** ~300 lines  
**Maximum Size:** 500 lines

### resources/quick-ref.md
Ultra-concise command cheat sheet for experienced users.

**Maximum Size:** 100 lines (hard limit)  
**Format:** Dense, tabular, scannable

### resources/setup-guide.md
Step-by-step setup and configuration guide.

**Maximum Size:** 500 lines  
**Format:** Tutorial-style, beginner-friendly

### resources/api-reference.md
Technical API/function documentation.

**Maximum Size:** 500 lines  
**Format:** Technical reference, precise

### resources/troubleshooting.md
Common problems and solutions.

**Maximum Size:** 500 lines  
**Format:** Problem-solution pairs, FAQ

## Customization Guidelines

### Required Customization

Replace these placeholders in all files:
- `[Skill Name]` - Your skill's name
- `[Version]` - Current version (e.g., 1.0.0)
- `[Date]` - Last updated date
- All other `[bracketed text]` - Skill-specific content

### Optional Resources

You can add additional resources if needed:
- `resources/examples/` - Extended examples
- `resources/advanced/` - Advanced topics
- `resources/integrations/` - Integration guides

**Rule:** All additional files must be < 500 lines

### Removing Resources

If your skill doesn't need a particular resource:
1. Delete the file
2. Remove references from SKILL.md
3. Update navigation links

**Minimum Required:** Only SKILL.md is required

## Validation

Before finalizing your skill:

### Structure Checklist
- [ ] Directory follows standard layout
- [ ] SKILL.md exists and is < 500 lines (ideally ~300)
- [ ] quick-ref.md is < 100 lines
- [ ] All other resources are < 500 lines
- [ ] File names follow kebab-case convention
- [ ] metadata.json is valid JSON

### Content Checklist
- [ ] All placeholders replaced
- [ ] Template comments removed
- [ ] Navigation links work correctly
- [ ] Cross-references are accurate
- [ ] Examples are tested and working
- [ ] No content duplication

### Quality Checklist
- [ ] Progressive disclosure (general → specific)
- [ ] Content is scannable (headers, lists, tables)
- [ ] Examples are clear and concise
- [ ] Language is consistent
- [ ] Code blocks have language tags

## Line Count Commands

Check file sizes:

```bash
# Check all markdown files
wc -l *.md resources/*.md

# Check specific file
wc -l SKILL.md

# Check if within limits
for file in resources/*.md; do
  lines=$(wc -l < "$file")
  echo "$file: $lines lines"
  if [[ "$file" == *"quick-ref"* && $lines -gt 100 ]]; then
    echo "  ⚠️  EXCEEDS LIMIT (100 lines)"
  elif [[ $lines -gt 500 ]]; then
    echo "  ⚠️  EXCEEDS LIMIT (500 lines)"
  fi
done
```

## Examples

For reference implementations, see:
- `project_orchestrator` skill (reference implementation)
- Other migrated skills in `~/.claude/skills/`

## Resources

- **Specification:** `Docs/SKILL_STRUCTURE_SPECIFICATION.md`
- **diet103 Documentation:** https://github.com/diet103/claude-code-infrastructure-showcase
- **PAI Progressive Disclosure:** https://danielmiessler.com/blog/personal-ai-infrastructure

## Support

Questions about this template? Check:
- Specification document for detailed guidelines
- Reference implementations for examples
- Community discussions for best practices

