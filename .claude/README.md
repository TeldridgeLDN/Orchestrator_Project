# .claude Directory - diet103 Structure

This directory contains the complete diet103 (PAI Skills-as-Containers) infrastructure for the Orchestrator documentation project.

## Purpose

Provides automated validation, quality checks, and workflow automation for maintaining high-quality documentation.

## Directory Structure

```
.claude/
├── README.md              # This file
├── metadata.json          # Project identity and tracking
├── skill-rules.json       # Skill auto-activation rules
├── settings.local.json    # Claude Code settings
├── hooks/                 # Automation hooks
│   ├── UserPromptSubmit.sh   # Pre-processing validation
│   └── PostToolUse.sh        # Post-edit validation
├── skills/                # Project-specific skills
│   ├── doc-validator/        # Documentation validation
│   ├── test-runner/          # Test suite execution
│   └── link-checker/         # Link validation
├── commands/              # Slash commands
│   ├── validate-docs.md      # /validate-docs
│   ├── run-tests.md          # /run-tests
│   └── prep-release.md       # /prep-release
├── agents/                # Specialized task handlers
│   └── README.md
└── resources/             # Additional resources
    └── README.md
```

## Components Overview

### metadata.json
Project identity, version tracking, and quality metrics.

**Key fields:**
- `name`: orchestrator-docs
- `version`: 1.0.0
- `project_type`: documentation
- `diet103_version`: 1.2.0

### skill-rules.json
Defines when skills should auto-activate based on:
- Trigger keywords in user prompts
- File patterns being edited
- Priority levels

### Hooks

#### UserPromptSubmit.sh
Runs **before** Claude processes each prompt.

**Checks:**
- Markdown syntax validation
- Unclosed code blocks detection
- Broken internal links warning
- Test script executability

**Exit behavior:** Non-blocking (warnings only)

#### PostToolUse.sh
Runs **after** Claude modifies files (Edit/Write).

**Checks:**
- Recently modified markdown files
- Code block closure
- Link validation
- JSON syntax (via jq)
- Shell script syntax

**Exit behavior:** Non-blocking (warnings only)

### Skills

#### doc-validator
Comprehensive documentation validation suite.

**Validates:**
- Markdown syntax
- Internal links
- Code blocks
- Consistency across documents
- Terminology

#### test-runner
Test suite execution and result parsing.

**Capabilities:**
- Run all test scenarios
- Execute individual tests
- Parse and report results
- Track execution time

#### link-checker
Link validation across all documentation.

**Checks:**
- Internal document links
- Anchor links
- Relative paths
- External URLs (optional)

### Commands (Slash Commands)

#### /validate-docs
Quick comprehensive validation of all documentation.

**Usage:** `/validate-docs`

**Runs:**
- Markdown syntax checks
- Link validation
- JSON validation
- Code block verification

#### /run-tests
Execute the complete test suite.

**Usage:** `/run-tests`

**Runs:**
- Pre-flight checks
- All test scenarios
- Feature tests
- Performance tests

#### /prep-release
Pre-release validation checklist.

**Usage:** `/prep-release`

**Runs:**
- Documentation validation
- Test suite
- Version consistency checks
- Example validation
- Git status review

## Usage Examples

### Natural Language Skill Activation

Thanks to skill-rules.json, skills auto-activate:

```
"I need to validate the documentation"
→ doc-validator skill activates

"Run the test suite"
→ test-runner skill activates

"Check for broken links"
→ link-checker skill activates
```

### Slash Commands

```bash
# Validate all documentation
/validate-docs

# Run complete test suite
/run-tests

# Prepare for release
/prep-release
```

### Hook Behavior

Hooks run automatically:

```
# UserPromptSubmit runs before every prompt
You: "Update GETTING_STARTED.md"
→ Hook checks markdown syntax
→ Hook warns of potential issues
→ Claude proceeds with your request

# PostToolUse runs after file modifications
Claude: [Edits a .md file]
→ Hook validates the changes
→ Hook reports any issues found
```

## Benefits

### Automatic Quality Gates
- Hooks catch issues before they're committed
- No manual validation needed
- Consistent quality enforcement

### Workflow Automation
- One-command documentation validation
- Automated test execution
- Pre-release checklists

### Time Savings
- Manual validation: 10-15 minutes
- With diet103: 2-3 minutes
- 70-80% time reduction

### Documentation Accuracy
- Automatic link checking
- Syntax validation
- Consistency enforcement

## Maintenance

### Adding New Skills
1. Create directory in `skills/`
2. Add `skill.md` with documentation
3. Update `skill-rules.json` with triggers
4. Test skill activation

### Adding New Commands
1. Create `.md` file in `commands/`
2. Document steps and examples
3. Define success criteria
4. Test command execution

### Updating Hooks
1. Edit hook scripts in `hooks/`
2. Ensure executable: `chmod +x hooks/*.sh`
3. Test hook behavior
4. Keep non-blocking (exit 0)

## Testing

```bash
# Test UserPromptSubmit hook
.claude/hooks/UserPromptSubmit.sh

# Test PostToolUse hook
.claude/hooks/PostToolUse.sh

# Validate structure
ls -R .claude/
```

## Integration Points

- **Claude Code**: Hooks run automatically
- **Git workflow**: Pre-commit validation
- **CI/CD**: Test execution and validation
- **Documentation updates**: Automatic link checking

## Version History

- **1.0.0** (2025-11-07): Initial diet103 implementation
  - Core hooks (UserPromptSubmit, PostToolUse)
  - Three skills (doc-validator, test-runner, link-checker)
  - Three commands (validate-docs, run-tests, prep-release)
  - Complete directory structure

## References

- [diet103 Specification](https://github.com/diet103/claude-code-infrastructure-showcase)
- [PAI Skills-as-Containers](https://github.com/diet103/)
- [Project Orchestrator Docs](../Docs/README.md)

---

**Last Updated:** 2025-11-07
**diet103 Version:** 1.2.0
**Maintainer:** Project Orchestrator Team
