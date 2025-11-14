# Project Validator

**Multi-signal project identity validation for Orchestrator**

Prevents wrong-project implementations by validating project identity across multiple signals: directory name, config file, git remote, package.json, and PRD headers.

---

## Features

- ✅ **Multi-Signal Validation** - Checks 5+ project identity sources
- ✅ **PRD Validation** - Ensures PRD matches current project
- ✅ **Fuzzy Matching** - Handles variations ("Orchestrator" vs "Orchestrator_Project")
- ✅ **Interactive Mode** - Guided resolution of mismatches
- ✅ **Auto-Fix** - Automatically corrects config.json projectName
- ✅ **Clear Reports** - Human-readable validation reports

---

## Installation

```bash
# From project root
cd lib/project-validator
chmod +x cli.js

# Optional: Link globally
npm link

# Or add to package.json scripts
```

---

## Usage

### Validate Current Project

```bash
# Basic validation
project-validate validate

# Output:
═══════════════════════════════════════════════════════════
           PROJECT IDENTITY VALIDATION REPORT
═══════════════════════════════════════════════════════════

📍 Project Signals:
   Directory:    Orchestrator_Project
   Config:       Orchestrator_Project
   Git Remote:   orchestrator-project
   Package.json: N/A

🎯 Canonical Name: Orchestrator_Project

✅ Status: CONSISTENT - All signals match

═══════════════════════════════════════════════════════════
```

### Validate PRD Against Project

```bash
# Basic PRD validation
project-validate prd .taskmaster/docs/sprint3_prd.txt

# Interactive mode (prompts for action on mismatch)
project-validate prd sprint3_prd.txt --interactive

# Output if mismatch:
═══════════════════════════════════════════════════════════
           PROJECT IDENTITY VALIDATION REPORT
═══════════════════════════════════════════════════════════

📍 Project Signals:
   Directory:    Orchestrator_Project
   Config:       Orchestrator_Project
   Git Remote:   orchestrator-project
   Package.json: N/A
   PRD:          Momentum Squared

🎯 Canonical Name: Orchestrator_Project

⚠️  Status: INCONSISTENT - Issues detected

🛑 Errors:
   - PRD project "Momentum Squared" doesn't match current project "Orchestrator_Project"

💡 Recommendations:
   - Update PRD "**Project**:" field to match current project
   - OR switch to correct project directory
   - OR confirm this is intentional cross-project work

═══════════════════════════════════════════════════════════
```

### Auto-Fix Project Identity

```bash
# Fix config.json projectName
project-validate fix

# Output:
🔧 Attempting to fix project identity issues...

✅ Updated config.json projectName to "Orchestrator_Project"

✅ Fix completed!
```

---

## API Usage

### Validate Project Identity

```javascript
const ProjectValidator = require('./validator');

async function example() {
  const validator = new ProjectValidator('/path/to/project');
  
  const validation = await validator.validate();
  
  console.log(`Project: ${validation.canonicalName}`);
  console.log(`Consistent: ${validation.isConsistent}`);
  
  if (!validation.isConsistent) {
    console.log('Warnings:', validation.warnings);
    console.log('Errors:', validation.errors);
  }
}
```

### Validate PRD

```javascript
const ProjectValidator = require('./validator');

async function validatePrd() {
  const validator = new ProjectValidator('/path/to/project');
  
  const validation = await validator.validatePrd('./prd.txt');
  
  if (!validation.isConsistent) {
    console.log(validator.generateReport(validation));
    // Handle mismatch
  }
}
```

---

## Integration with Taskmaster

### Add to parse-prd Workflow

```javascript
// In Taskmaster parse-prd command
const ProjectValidator = require('@orchestrator/project-validator');

async function parsePrd(prdPath, options) {
  // Validate before parsing
  const validator = new ProjectValidator(options.projectRoot);
  const validation = await validator.validatePrd(prdPath);
  
  if (!validation.isConsistent) {
    console.error('⚠️  Project identity mismatch!');
    console.log(validator.generateReport(validation));
    
    if (!options.force) {
      throw new Error('PRD validation failed. Use --force to override.');
    }
  }
  
  // Continue with parsing...
}
```

### Add MCP Tool

```json
{
  "name": "mcp_taskmaster-ai_validate_project",
  "description": "Validate current project identity",
  "parameters": {
    "projectRoot": "Project root path",
    "prdPath": "Optional PRD path to validate"
  }
}
```

---

## Validation Algorithm

### Project Signals (Priority Order)

1. **Config ProjectName** - `.taskmaster/config.json` → `global.projectName`
2. **Directory Name** - Last component of project path
3. **Git Remote** - Repository name from `git remote get-url origin`
4. **Package.json** - `name` field (Node.js projects)
5. **PRD Header** - `**Project**:` field

### Matching Logic

**Fuzzy matching** to handle variations:
- Case-insensitive
- Ignores special characters (`-`, `_`, spaces)
- Allows substring matches (50%+ overlap)

Examples:
- ✅ "Orchestrator_Project" matches "orchestrator-project"
- ✅ "Orchestrator" matches "Orchestrator_Project" (substring)
- ❌ "Momentum" doesn't match "Orchestrator" (different)

### Canonical Name

Determined by priority:
1. Config projectName (if exists)
2. Directory name (fallback)
3. Git remote (if available)
4. Package name (if available)

---

## Error Handling

### Exit Codes

- `0` - Validation passed
- `1` - Validation failed or error occurred

### Interactive Mode

When `--interactive` flag is used with PRD validation:

```
⚠️  Project identity mismatch detected!

What would you like to do?
  1. Update PRD to match current project
  2. Switch to correct project directory
  3. Confirm this is intentional cross-project work
  4. Cancel

Enter choice (1-4):
```

---

## Examples

### Pre-Parse PRD Validation Script

```bash
#!/bin/bash
# pre-parse.sh

PRD_FILE=$1

if [ -z "$PRD_FILE" ]; then
  echo "Usage: ./pre-parse.sh <prd-file>"
  exit 1
fi

# Validate PRD
project-validate prd "$PRD_FILE" --interactive

if [ $? -eq 0 ]; then
  # Validation passed, proceed with parsing
  task-master parse-prd "$PRD_FILE"
else
  echo "❌ Validation failed. PRD not parsed."
  exit 1
fi
```

### Git Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Validate project identity before committing
project-validate validate

if [ $? -ne 0 ]; then
  echo "❌ Project identity validation failed!"
  echo "Run 'project-validate fix' to resolve issues."
  exit 1
fi
```

---

## Configuration

### Environment Variables

- `DEBUG=1` - Enable debug output (stack traces on errors)

### Project Root Detection

By default, uses current working directory. Override with:

```bash
project-validate validate --project-root /path/to/project
```

---

## Testing

```bash
# Run tests
npm test

# Manual testing
cd /Users/tomeldridge/Orchestrator_Project
project-validate validate
project-validate prd .taskmaster/docs/diet103_sprint3_prd.txt
project-validate fix
```

---

## Troubleshooting

### "Config.json not found"

Ensure Taskmaster is initialized:
```bash
task-master init
```

### "Git remote not found"

Project not in git repository. Git remote validation will be skipped.

### "False positive mismatch"

Add project alias support (future enhancement) or use fuzzy matching adjustments.

---

## Roadmap

### Planned Features

- [ ] Project alias configuration
- [ ] Custom validation rules
- [ ] Integration with CI/CD
- [ ] Visual Studio Code extension
- [ ] Automated PRD correction
- [ ] Historical validation reports

---

## License

MIT - Part of Orchestrator Project

---

## Contributing

Issues and PRs welcome! See [PROJECT_IDENTITY_ISSUE.md](../../PROJECT_IDENTITY_ISSUE.md) for context.

---

**Status:** Production-ready  
**Version:** 1.0.0  
**Tested:** Node.js 16+

