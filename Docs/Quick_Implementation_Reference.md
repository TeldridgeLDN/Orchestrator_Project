# Quick Implementation Reference

**Purpose:** Fast reference for where implementation files are located

---

## Core CLI Location

**All implementation is in:** `~/.claude/`

```bash
cd ~/.claude
```

---

## Key Files by Feature

### CLI Entry Point
```bash
~/.claude/bin/claude              # Main CLI (Node.js with Commander)
~/.claude/package.json            # Dependencies & scripts
```

### Commands (All Implemented)
```bash
~/.claude/lib/commands/create.js   # ✅ claude project create
~/.claude/lib/commands/switch.js   # ✅ claude project switch
~/.claude/lib/commands/list.js     # ✅ claude project list
~/.claude/lib/commands/remove.js   # ✅ claude project remove
~/.claude/lib/commands/validate.js # ⚠️  claude project validate (partial)
```

### Core Systems
```bash
~/.claude/lib/config-validator.js       # Config schema validation
~/.claude/lib/utils/context-manager.js  # Context switching logic (457 lines)
~/.claude/lib/utils/context.js          # Context load/save/cache
~/.claude/lib/utils/validation.js       # Structure validation
~/.claude/lib/utils/logger.js           # Event logging
~/.claude/lib/utils/formatting.js       # Output formatting
```

### Configuration & Data
```bash
~/.claude/config.json              # Global config (projects registry)
~/.claude/schema/config-schema.json # JSON schema
~/.claude/cache/                   # Cached project states
```

### Templates
```bash
~/.claude/templates/base/.claude/     # Base template (diet103 structure)
~/.claude/templates/web-app/.claude/  # Web app template
~/.claude/templates/shopify/.claude/  # Shopify template
```

### Documentation Sync System
```bash
~/.claude/bin/docs/fetch-claude-docs.sh      # Doc fetcher
~/.claude/bin/docs/validate-implementation.cjs # Validator
~/.claude/bin/docs/generate-report.sh         # Report generator
~/.claude/bin/docs/sync-workflow.sh           # Orchestrator
```

### Tests (Minimal)
```bash
~/.claude/tests/config-validator.test.js  # Config validation tests
~/.claude/tests/commands/                 # Command tests (minimal)
```

---

## Quick Test Commands

```bash
# Setup
cd ~/.claude
npm install

# Make executable
chmod +x bin/claude

# Add to PATH or alias
alias claude="~/.claude/bin/claude"

# Test basic commands
claude --version
claude project list

# Create test project
claude project create test-project

# Test switching
claude project create another-project
claude project switch test-project

# Test validation
claude project validate test-project

# Test removal
claude project remove another-project --force
```

---

## Project Structure Created by CLI

When you run `claude project create my-project`, it creates:

```
~/Projects/my-project/
└── .claude/
    ├── Claude.md              # Project context (from template)
    ├── metadata.json          # Project metadata
    ├── skill-rules.json       # Skill activation rules
    ├── hooks/
    │   ├── UserPromptSubmit.js
    │   └── PostToolUse.js
    ├── skills/
    ├── agents/
    ├── commands/
    └── resources/
```

---

## Key Classes & Functions

### ContextManager (context-manager.js)
```javascript
import { contextManager } from '~/.claude/lib/utils/context-manager.js';

// Usage:
contextManager.loadContext(projectName, projectPath, config);
contextManager.unloadContext(projectName, config);
contextManager.getActiveProject();
contextManager.getStats();
```

### Config Validator (config-validator.js)
```javascript
import { loadConfig, saveConfig, validateConfig } from '~/.claude/lib/config-validator.js';

// Usage:
const config = loadConfig();           // Load ~/.claude/config.json
saveConfig(config);                    // Save config
const isValid = validateConfig(config); // Validate against schema
```

### Validation Utils (validation.js)
```javascript
import {
  validateProjectPath,
  validateProjectStructure,
  countProjectSkills
} from '~/.claude/lib/utils/validation.js';

// Usage:
const pathValid = validateProjectPath('/path/to/project');
const result = validateProjectStructure('/path/to/project');
// result = { valid: boolean, missing: [], errors: [] }
```

---

## Configuration Schema

**Location:** `~/.claude/schema/config-schema.json`

**Structure:**
```json
{
  "version": "1.0.0",
  "active_project": "project-name" | null,
  "projects": {
    "project-name": {
      "path": "/absolute/path",
      "created": "ISO8601",
      "last_active": "ISO8601",
      "metadata": {
        "description": "...",
        "tags": []
      }
    }
  },
  "settings": {
    "auto_switch_on_directory_change": false,
    "cache_last_active": true,
    "validate_on_switch": true
  }
}
```

---

## Template Variables

When creating projects, these variables are replaced:

- `{{PROJECT_NAME}}` → Project name
- `{{PROJECT_DESCRIPTION}}` → Description from --description flag
- `{{CREATED_DATE}}` → ISO8601 timestamp

**Implementation:** `replaceTemplateVariables()` in `lib/commands/create.js`

---

## Cache System

**Location:** `~/.claude/cache/`

**Structure:**
```
cache/
├── project1.json          # Cached state for project1
├── project2.json          # Cached state for project2
└── docs/
    ├── fetched/           # Cached Claude docs
    └── reports/           # Validation reports
```

**Cache Format:**
```json
{
  "projectName": "...",
  "cachedAt": "ISO8601",
  "timestamp": 1234567890,
  "activationStates": ["skill1", "skill2"],
  "projectPath": "/path",
  "lastActive": "ISO8601"
}
```

---

## Logging System

**Location:** `~/.claude/lib/utils/logger.js`

**Events Logged:**
- `context_load` - Project context loaded
- `context_unload` - Project context unloaded
- `skill_activation` - Skill activated
- `skill_deactivation` - Skill deactivated
- `context_load_error` - Error during load
- `context_unload_error` - Error during unload

**Log Location:** (Implementation may vary)

---

## Development Workflow

### Adding a New Command

1. Create command file:
   ```bash
   touch ~/.claude/lib/commands/mynewcmd.js
   ```

2. Implement command function:
   ```javascript
   export async function myNewCommand(args, options) {
     // Implementation
   }
   ```

3. Register in CLI:
   ```javascript
   // In ~/.claude/bin/claude
   import { myNewCommand } from '../lib/commands/mynewcmd.js';

   project
     .command('mynewcmd <arg>')
     .description('My new command')
     .action(myNewCommand);
   ```

### Adding a New Template

1. Create template directory:
   ```bash
   mkdir -p ~/.claude/templates/mytemplate/.claude
   ```

2. Copy base structure:
   ```bash
   cp -r ~/.claude/templates/base/.claude/* ~/.claude/templates/mytemplate/.claude/
   ```

3. Customize template files

4. Use it:
   ```bash
   claude project create myproject --template mytemplate
   ```

---

## Common Issues & Fixes

### "Project not found"
```bash
# Check config
cat ~/.claude/config.json | jq '.projects'

# List projects
claude project list
```

### "Invalid project structure"
```bash
# Validate project
claude project validate project-name

# Check what's missing
ls -la ~/Projects/project-name/.claude/
```

### "Switch time too slow"
```bash
# Profile performance
# (Task 57 - not yet implemented)
```

### Testing the CLI locally
```bash
cd ~/.claude
node bin/claude project list
```

---

## Next Steps for Development

See [Docs/Implementation_Assessment_Report.md](Implementation_Assessment_Report.md) for:
- Full implementation analysis
- Task status tracking
- Recommended priorities
- Gap analysis

---

**Last Updated:** 2025-11-07
**Related Docs:** Implementation_Assessment_Report.md, Orchestrator_PRD.md
