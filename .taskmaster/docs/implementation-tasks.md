# Multi-Project AI Orchestration System - Implementation Tasks

**Generated from:** Orchestrator_PRD.md v1.0
**Date:** 2025-11-05
**Total Tasks:** 40 (across 6 phases)

---

## Task Breakdown Overview

This document provides a comprehensive breakdown of the PRD into actionable implementation tasks, organized by the 6-phase implementation plan.

---

## PHASE 1: Foundation (Week 1)

### Task 1.1: Create Global Directory Structure
**ID:** 1.1
**Priority:** High
**Dependencies:** None
**Status:** Pending

**Description:**
Set up the `~/.claude/` directory structure for the global orchestration layer.

**Implementation Details:**
```bash
# Create directory structure
mkdir -p ~/.claude/{bin,skills,templates,context,cache,logs}
mkdir -p ~/.claude/skills/project_orchestrator/{workflows,resources}
mkdir -p ~/.claude/context/{projects,workflows,knowledge,preferences}
mkdir -p ~/.claude/templates/{base,web-app,shopify}/.claude
```

**Deliverables:**
- [ ] `~/.claude/` base directory exists
- [ ] All required subdirectories created
- [ ] Permissions set correctly (user-only: 700)

**Test Strategy:**
- Verify all directories exist: `ls -la ~/.claude/`
- Check permissions: `stat -f '%A' ~/.claude`
- Confirm no files exist yet (empty structure)

---

### Task 1.2: Define config.json Schema and Validation
**ID:** 1.2
**Priority:** High
**Dependencies:** None
**Status:** Pending

**Description:**
Create the JSON schema for `config.json` and implement validation logic.

**Implementation Details:**
```javascript
// schema/config-schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "active_project", "projects", "settings"],
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$"
    },
    "active_project": {
      "type": ["string", "null"]
    },
    "projects": {
      "type": "object",
      "patternProperties": {
        "^[a-zA-Z0-9_-]+$": {
          "type": "object",
          "required": ["path", "created"],
          "properties": {
            "path": {"type": "string"},
            "created": {"type": "string", "format": "date-time"},
            "last_active": {"type": "string", "format": "date-time"},
            "metadata": {
              "type": "object",
              "properties": {
                "description": {"type": "string"},
                "tags": {"type": "array", "items": {"type": "string"}}
              }
            }
          }
        }
      }
    },
    "settings": {
      "type": "object",
      "properties": {
        "auto_switch_on_directory_change": {"type": "boolean"},
        "cache_last_active": {"type": "boolean"},
        "validate_on_switch": {"type": "boolean"}
      }
    }
  }
}

// lib/config-validator.js
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export function validateConfig(config) {
  const ajv = new Ajv();
  addFormats(ajv);
  const schema = require('../schema/config-schema.json');
  const validate = ajv.compile(schema);
  const valid = validate(config);

  if (!valid) {
    throw new Error(`Invalid config: ${JSON.stringify(validate.errors)}`);
  }

  // Additional validation: active_project must exist in projects
  if (config.active_project && !config.projects[config.active_project]) {
    throw new Error(`Active project '${config.active_project}' not found in projects`);
  }

  // Validate all paths are absolute
  for (const [name, project] of Object.entries(config.projects)) {
    if (!path.isAbsolute(project.path)) {
      throw new Error(`Project '${name}' path must be absolute: ${project.path}`);
    }
  }

  return true;
}
```

**Deliverables:**
- [ ] JSON schema file created
- [ ] Validation function implemented
- [ ] Unit tests for validation pass

**Test Strategy:**
```javascript
describe('Config Validation', () => {
  it('accepts valid minimal config', () => {
    const config = {
      version: "1.0.0",
      active_project: null,
      projects: {},
      settings: {}
    };
    expect(() => validateConfig(config)).not.toThrow();
  });

  it('rejects invalid version format', () => {
    const config = { version: "1.0", ... };
    expect(() => validateConfig(config)).toThrow();
  });

  it('rejects non-existent active_project', () => {
    const config = {
      version: "1.0.0",
      active_project: "missing",
      projects: {},
      settings: {}
    };
    expect(() => validateConfig(config)).toThrow();
  });
});
```

---

### Task 1.3: Write Global Claude.md Template
**ID:** 1.3
**Priority:** Medium
**Dependencies:** 1.1
**Status:** Pending

**Description:**
Create the global `Claude.md` file that defines orchestrator behavior.

**Implementation Details:**
Create `~/.claude/Claude.md` following PAI principles:
- Describe meta-orchestrator role
- Define single active context rule
- Explain project switching mechanism
- Document token efficiency strategy

**Deliverables:**
- [ ] `~/.claude/Claude.md` created
- [ ] Content follows PAI UFC pattern
- [ ] Under 500 lines (diet103 rule)

**Test Strategy:**
- Verify file exists and is readable
- Check line count: `wc -l ~/.claude/Claude.md`
- Manual review for clarity and completeness

---

### Task 1.4: Create CLI Skeleton
**ID:** 1.4
**Priority:** High
**Dependencies:** 1.1
**Status:** Pending

**Description:**
Build the basic CLI entrypoint (`~/.claude/bin/claude`) with command routing.

**Implementation Details:**
```bash
#!/usr/bin/env bash
# ~/.claude/bin/claude

set -euo pipefail

CLAUDE_HOME="$HOME/.claude"
CONFIG="$CLAUDE_HOME/config.json"

# Source helper functions
source "$CLAUDE_HOME/bin/lib/utils.sh"

# Main command router
case "${1:-}" in
  "project")
    case "${2:-}" in
      "list")
        "$CLAUDE_HOME/bin/commands/list-projects.sh"
        ;;
      "create")
        "$CLAUDE_HOME/bin/commands/create-project.sh" "${3:-}"
        ;;
      "switch")
        "$CLAUDE_HOME/bin/commands/switch-project.sh" "${3:-}"
        ;;
      "remove")
        "$CLAUDE_HOME/bin/commands/remove-project.sh" "${3:-}"
        ;;
      "validate")
        "$CLAUDE_HOME/bin/commands/validate-project.sh" "${3:-}"
        ;;
      *)
        echo "Usage: claude project [list|create|switch|remove|validate]"
        exit 1
        ;;
    esac
    ;;
  *)
    echo "Usage: claude project <command>"
    exit 1
    ;;
esac
```

**Deliverables:**
- [ ] CLI entrypoint created
- [ ] Made executable (chmod +x)
- [ ] Added to PATH or symlinked
- [ ] Help text shows correctly

**Test Strategy:**
```bash
# Test help text
claude
claude project

# Should show usage
```

---

### Task 1.5: Implement List Projects Command (Read-Only)
**ID:** 1.5
**Priority:** High
**Dependencies:** 1.2, 1.4
**Status:** Pending

**Description:**
Implement the read-only `claude project list` command to validate infrastructure.

**Implementation Details:**
```bash
#!/usr/bin/env bash
# ~/.claude/bin/commands/list-projects.sh

CONFIG="$HOME/.claude/config.json"

if [[ ! -f "$CONFIG" ]]; then
  echo "No projects registered yet."
  echo "Use 'claude project create <name>' to get started."
  exit 0
fi

# Parse config with jq
active=$(jq -r '.active_project // "none"' "$CONFIG")
projects=$(jq -r '.projects | keys[]' "$CONFIG")

echo "Active Projects:"
for project in $projects; do
  path=$(jq -r ".projects.\"$project\".path" "$CONFIG")
  last_active=$(jq -r ".projects.\"$project\".last_active // \"never\"" "$CONFIG")

  if [[ "$project" == "$active" ]]; then
    echo "* $project    $path    (active)"
  else
    echo "  $project    $path    (last used: $last_active)"
  fi
done

echo ""
echo "Total: $(echo "$projects" | wc -l) projects"
```

**Deliverables:**
- [ ] list-projects.sh script created
- [ ] Handles empty config gracefully
- [ ] Output formatted correctly

**Test Strategy:**
```bash
# Test with no config
rm ~/.claude/config.json
claude project list
# Should show friendly message

# Test with mock config
cat > ~/.claude/config.json <<EOF
{
  "version": "1.0.0",
  "active_project": "test-project",
  "projects": {
    "test-project": {
      "path": "/tmp/test",
      "created": "2025-11-05T10:00:00Z",
      "last_active": "2025-11-05T14:00:00Z"
    }
  },
  "settings": {}
}
EOF

claude project list
# Should show test-project as active
```

---

## PHASE 2: Project Creation (Week 2)

### Task 2.1: Create Base Project Template
**ID:** 2.1
**Priority:** High
**Dependencies:** 1.1
**Status:** Pending

**Description:**
Build the minimal base project template with diet103 structure.

**Implementation Details:**
```
~/.claude/templates/base/
└── .claude/
    ├── Claude.md                 # Project-level context template
    ├── skill-rules.json          # Empty rules array
    ├── metadata.json             # Project manifest template
    ├── skills/.gitkeep
    ├── hooks/
    │   ├── UserPromptSubmit.js  # diet103 hook template
    │   └── PostToolUse.js       # diet103 hook template
    ├── agents/.gitkeep
    ├── commands/.gitkeep
    └── resources/.gitkeep
```

Template files:
1. **Claude.md:** Project-specific context placeholder
2. **skill-rules.json:** `{"rules": []}`
3. **metadata.json:** Template with variables like `{{PROJECT_NAME}}`
4. **Hooks:** Functional but empty diet103 hooks

**Deliverables:**
- [ ] Base template directory created
- [ ] All template files present
- [ ] Variables clearly marked ({{VAR}})

**Test Strategy:**
- Verify directory structure matches PRD Section 4.4
- Check all files are valid (JSON files parse, hooks are executable)

---

### Task 2.2: Implement Template Variable Substitution
**ID:** 2.2
**Priority:** Medium
**Dependencies:** 2.1
**Status:** Pending

**Description:**
Create utility to replace template variables ({{PROJECT_NAME}}, etc.) when copying templates.

**Implementation Details:**
```javascript
// lib/template-processor.js
import fs from 'fs/promises';
import path from 'path';

export async function processTemplate(templatePath, outputPath, variables) {
  const files = await getAllFiles(templatePath);

  for (const file of files) {
    let content = await fs.readFile(file, 'utf-8');

    // Replace all variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    }

    // Write to output path
    const relativePath = path.relative(templatePath, file);
    const outputFile = path.join(outputPath, relativePath);

    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.writeFile(outputFile, content);
  }
}

async function getAllFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? getAllFiles(fullPath) : fullPath;
  }));
  return files.flat();
}
```

**Deliverables:**
- [ ] Template processor module created
- [ ] Supports nested directory traversal
- [ ] Handles binary files (skip processing)

**Test Strategy:**
```javascript
describe('Template Processing', () => {
  it('replaces variables in files', async () => {
    const vars = { PROJECT_NAME: 'test-app', VERSION: '1.0.0' };
    await processTemplate('/tmp/template', '/tmp/output', vars);

    const content = await fs.readFile('/tmp/output/metadata.json', 'utf-8');
    expect(content).toContain('"project_id": "test-app"');
  });
});
```

---

### Task 2.3: Implement Create Project Command
**ID:** 2.3
**Priority:** High
**Dependencies:** 2.1, 2.2, 1.2
**Status:** Pending

**Description:**
Build `claude project create <name>` command with full workflow.

**Implementation Details:**
```bash
#!/usr/bin/env bash
# ~/.claude/bin/commands/create-project.sh

PROJECT_NAME="$1"

# Validation
if [[ -z "$PROJECT_NAME" ]]; then
  echo "Error: Project name required"
  echo "Usage: claude project create <name>"
  exit 1
fi

# Check name format (alphanumeric, hyphens, underscores only)
if [[ ! "$PROJECT_NAME" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  echo "Error: Invalid project name"
  echo "Project names must contain only letters, numbers, hyphens, and underscores"
  exit 1
fi

# Check if already exists
if jq -e ".projects.\"$PROJECT_NAME\"" "$CONFIG" >/dev/null 2>&1; then
  echo "Error: Project '$PROJECT_NAME' already exists"
  echo "Use 'claude project switch $PROJECT_NAME' to activate it"
  exit 1
fi

# Prompt for path (default: ~/Projects/$PROJECT_NAME)
read -p "Project path [~/Projects/$PROJECT_NAME]: " PROJECT_PATH
PROJECT_PATH="${PROJECT_PATH:-$HOME/Projects/$PROJECT_NAME}"

# Expand ~
PROJECT_PATH="${PROJECT_PATH/#\~/$HOME}"

# Create directory
mkdir -p "$PROJECT_PATH"

# Copy template
cp -r "$CLAUDE_HOME/templates/base/.claude" "$PROJECT_PATH/"

# Process template variables
node "$CLAUDE_HOME/bin/lib/process-template.js" \
  "$PROJECT_PATH/.claude" \
  "$PROJECT_NAME" \
  "0.1.0"

# Register in config
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
jq ".projects.\"$PROJECT_NAME\" = {
  \"path\": \"$PROJECT_PATH\",
  \"created\": \"$NOW\",
  \"last_active\": \"$NOW\",
  \"metadata\": {
    \"description\": \"\",
    \"tags\": []
  }
} | .active_project = \"$PROJECT_NAME\"" "$CONFIG" > "$CONFIG.tmp"

mv "$CONFIG.tmp" "$CONFIG"

echo "✓ Project created: $PROJECT_PATH"
echo "✓ Project registered"
echo "✓ Set as active project"
echo ""
echo "Next steps:"
echo "  1. cd $PROJECT_PATH"
echo "  2. Review .claude/Claude.md for project context"
echo "  3. Start working - skills will auto-activate"
```

**Deliverables:**
- [ ] create-project.sh script created
- [ ] Validates input correctly
- [ ] Registers project in config
- [ ] Sets as active project

**Test Strategy:**
```bash
# Test validation
claude project create ""           # Should fail
claude project create "invalid!"   # Should fail
claude project create "test-123"   # Should succeed

# Verify registration
jq '.projects."test-123"' ~/.claude/config.json
# Should show project details

# Verify files created
ls ~/Projects/test-123/.claude/
# Should show diet103 structure
```

---

### Task 2.4: Add Web-App and Shopify Templates
**ID:** 2.4
**Priority:** Low
**Dependencies:** 2.1
**Status:** Pending

**Description:**
Create additional project templates for common use cases.

**Implementation Details:**
1. **Web-App Template:**
   - Base template + web_dev_assistant skill
   - Sample skill-rules.json with web patterns
   - React/Vue/etc. trigger phrases

2. **Shopify Template:**
   - Base template + shopify_skill + seo_optimizer
   - Shopify-specific triggers (*.liquid, etc.)
   - Example workflows for store setup

**Deliverables:**
- [ ] web-app template created
- [ ] shopify template created
- [ ] Templates documented in templates.md

**Test Strategy:**
- Create project from each template
- Verify skills are present
- Check skill-rules.json has appropriate triggers

---

## PHASE 3: Context Switching (Week 3)

### Task 3.1: Implement Context Unload Logic
**ID:** 3.1
**Priority:** High
**Dependencies:** None
**Status:** Pending

**Description:**
Build the mechanism to cleanly unload a project's context from Claude's memory.

**Implementation Details:**
```javascript
// lib/context-manager.js
export async function unloadProjectContext(projectName) {
  console.log(`Unloading context for project: ${projectName}`);

  // 1. Flush skill activation states
  await skillActivationManager.flush();

  // 2. Clear in-memory skill cache
  skillCache.clear(projectName);

  // 3. Optional: Cache current state for fast resume
  if (config.settings.cache_last_active) {
    await cacheProjectState(projectName);
  }

  // 4. Log unload event
  await logEvent('context_unload', {
    project: projectName,
    timestamp: new Date().toISOString()
  });

  return true;
}

async function cacheProjectState(projectName) {
  const cacheFile = `${CLAUDE_HOME}/cache/${projectName}.json`;
  const state = {
    project: projectName,
    cached_at: new Date().toISOString(),
    skill_states: skillActivationManager.getStates(),
    context_metadata: {
      loaded_skills: skillCache.getLoadedSkills(projectName)
    }
  };

  await fs.writeFile(cacheFile, JSON.stringify(state, null, 2));
}
```

**Deliverables:**
- [ ] context-manager.js module created
- [ ] unloadProjectContext function implemented
- [ ] Caching mechanism working

**Test Strategy:**
```javascript
describe('Context Unload', () => {
  it('clears skill cache', async () => {
    skillCache.set('test-project', ['skill1', 'skill2']);
    await unloadProjectContext('test-project');
    expect(skillCache.get('test-project')).toBeUndefined();
  });

  it('creates cache file when enabled', async () => {
    config.settings.cache_last_active = true;
    await unloadProjectContext('test-project');
    expect(fs.existsSync('~/.claude/cache/test-project.json')).toBe(true);
  });
});
```

---

### Task 3.2: Implement Context Load Logic
**ID:** 3.2
**Priority:** High
**Dependencies:** 3.1
**Status:** Pending

**Description:**
Build the mechanism to load a project's context into Claude's memory.

**Implementation Details:**
```javascript
export async function loadProjectContext(projectName) {
  const project = config.projects[projectName];
  if (!project) {
    throw new Error(`Project '${projectName}' not found in registry`);
  }

  console.log(`Loading context for project: ${projectName}`);

  // 1. Validate project path exists
  if (!fs.existsSync(project.path)) {
    throw new Error(`Project path not found: ${project.path}`);
  }

  // 2. Load metadata
  const metadataPath = `${project.path}/.claude/metadata.json`;
  const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

  // 3. Load Claude.md
  const claudeMdPath = `${project.path}/.claude/Claude.md`;
  const claudeMd = await fs.readFile(claudeMdPath, 'utf-8');

  // 4. Load skill-rules.json
  const skillRulesPath = `${project.path}/.claude/skill-rules.json`;
  const skillRules = JSON.parse(await fs.readFile(skillRulesPath, 'utf-8'));

  // 5. Initialize skill activation manager (but don't load skills yet - lazy load)
  await skillActivationManager.initialize(projectName, skillRules);

  // 6. Update context in Claude (implementation depends on Claude API)
  // This is conceptual - actual implementation depends on how Claude Code
  // manages context in practice

  // 7. Log load event
  await logEvent('context_load', {
    project: projectName,
    metadata: metadata,
    timestamp: new Date().toISOString()
  });

  return {
    project: projectName,
    metadata,
    skillRules,
    loadedAt: new Date().toISOString()
  };
}
```

**Deliverables:**
- [ ] loadProjectContext function implemented
- [ ] Validates project structure
- [ ] Initializes skill activation

**Test Strategy:**
```javascript
describe('Context Load', () => {
  it('loads project metadata', async () => {
    const result = await loadProjectContext('test-project');
    expect(result.metadata.project_id).toBe('test-project');
  });

  it('throws if project path missing', async () => {
    await expect(loadProjectContext('missing')).rejects.toThrow();
  });
});
```

---

### Task 3.3: Implement Switch Project Command
**ID:** 3.3
**Priority:** High
**Dependencies:** 3.1, 3.2, 1.2
**Status:** Pending

**Description:**
Build `claude project switch <name>` command with full unload/load cycle.

**Implementation Details:**
```bash
#!/usr/bin/env bash
# ~/.claude/bin/commands/switch-project.sh

PROJECT_NAME="$1"

if [[ -z "$PROJECT_NAME" ]]; then
  echo "Error: Project name required"
  echo "Usage: claude project switch <name>"
  exit 1
fi

# Check project exists
if ! jq -e ".projects.\"$PROJECT_NAME\"" "$CONFIG" >/dev/null 2>&1; then
  echo "Error: Project '$PROJECT_NAME' not found"
  echo "Use 'claude project list' to see available projects"
  exit 1
fi

# Get current active project
CURRENT=$(jq -r '.active_project // "none"' "$CONFIG")

if [[ "$CURRENT" == "$PROJECT_NAME" ]]; then
  echo "Project '$PROJECT_NAME' is already active"
  exit 0
fi

echo "Switching to project '$PROJECT_NAME'..."

# Unload current project (if any)
if [[ "$CURRENT" != "none" && "$CURRENT" != "null" ]]; then
  echo "✓ Context unloaded: $CURRENT"
  node "$CLAUDE_HOME/bin/lib/context-manager.js" unload "$CURRENT"
fi

# Load new project
START_TIME=$(date +%s)
node "$CLAUDE_HOME/bin/lib/context-manager.js" load "$PROJECT_NAME"
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

# Update config
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
jq ".active_project = \"$PROJECT_NAME\" |
    .projects.\"$PROJECT_NAME\".last_active = \"$NOW\"" \
    "$CONFIG" > "$CONFIG.tmp"
mv "$CONFIG.tmp" "$CONFIG"

echo "✓ Context loaded: $PROJECT_NAME"
echo "✓ Switch completed in ${ELAPSED}s"
echo ""

# Show project info
PROJECT_PATH=$(jq -r ".projects.\"$PROJECT_NAME\".path" "$CONFIG")
SKILL_COUNT=$(jq -r ".projects.\"$PROJECT_NAME\".metadata.skills // [] | length" "$PROJECT_PATH/.claude/metadata.json")

echo "Active project: $PROJECT_NAME"
echo "Path: $PROJECT_PATH"
echo "Skills: $SKILL_COUNT"
echo ""
echo "Start working - Claude is ready!"
```

**Deliverables:**
- [ ] switch-project.sh script created
- [ ] Performs unload → load cycle
- [ ] Updates config.json
- [ ] Measures and reports switch time

**Test Strategy:**
```bash
# Create two test projects
claude project create test-a
claude project create test-b

# Switch between them
time claude project switch test-a
# Should complete in <1s

# Verify active project changed
jq '.active_project' ~/.claude/config.json
# Should show "test-a"

# Switch back
time claude project switch test-b
# Should complete in <1s
```

---

### Task 3.4: Implement Caching for Fast Resume
**ID:** 3.4
**Priority:** Medium
**Dependencies:** 3.1, 3.2
**Status:** Pending

**Description:**
Add caching mechanism to speed up project switching when returning to recent projects.

**Implementation Details:**
- Cache project state when unloading
- Check cache validity (timestamp, file changes)
- Load from cache if valid, otherwise full load
- Implement cache invalidation on project changes

**Deliverables:**
- [ ] Cache loading logic implemented
- [ ] Cache invalidation working
- [ ] Improves switch time for cached projects

**Test Strategy:**
- Switch to project A, then B, then back to A
- Second switch to A should be faster (cache hit)
- Modify A's .claude/ files, switch away and back
- Should detect changes and invalidate cache

---

### Task 3.5: Integrate with diet103 Hooks
**ID:** 3.5
**Priority:** High
**Dependencies:** 3.3
**Status:** Pending

**Description:**
Ensure project switching properly activates/deactivates diet103 hooks.

**Implementation Details:**
- Hook into diet103's UserPromptSubmit system
- Register/unregister skill-rules.json on switch
- Ensure only active project's hooks are listening
- Test with multiple projects having different rules

**Deliverables:**
- [ ] Hook integration working
- [ ] Only active project's rules apply
- [ ] No interference between projects

**Test Strategy:**
```bash
# Create project with specific trigger
cat > ~/Projects/test-a/.claude/skill-rules.json <<EOF
{
  "rules": [{
    "trigger_phrases": ["special-keyword-A"],
    "skill": "test_skill_a"
  }]
}
EOF

# Switch to project A
claude project switch test-a

# Trigger should activate
# (Test in Claude Code environment)
# User: "I need help with special-keyword-A"
# Should load test_skill_a

# Switch to project B
claude project switch test-b

# Previous trigger should not activate
# User: "I need help with special-keyword-A"
# Should NOT load test_skill_a (different project)
```

---

## PHASE 4: Project Orchestrator Skill (Week 4)

### Task 4.1: Create project_orchestrator Skill Structure
**ID:** 4.1
**Priority:** High
**Dependencies:** 1.1
**Status:** Pending

**Description:**
Build the PAI Skills-as-Containers structure for the orchestrator meta-skill.

**Implementation Details:**
```
~/.claude/skills/project_orchestrator/
├── SKILL.md                    # Main skill documentation
├── metadata.json               # Skill manifest
├── workflows/                  # PAI pattern
│   ├── create.md              # Project creation workflow
│   ├── switch.md              # Project switching workflow
│   ├── list.md                # Project listing workflow
│   ├── remove.md              # Project removal workflow
│   └── validate.md            # Project validation workflow
└── resources/                  # diet103 pattern
    ├── templates.md           # Template documentation
    └── troubleshooting.md     # Common issues
```

**Deliverables:**
- [ ] Directory structure created
- [ ] SKILL.md written (<500 lines, diet103 rule)
- [ ] metadata.json populated
- [ ] All workflow .md files created

**Test Strategy:**
- Verify structure matches PRD Section 4.3
- Check SKILL.md line count
- Validate metadata.json against schema

---

### Task 4.2: Implement Natural Language Hooks
**ID:** 4.2
**Priority:** Medium
**Dependencies:** 4.1
**Status:** Pending

**Description:**
Create UserPromptSubmit hooks that trigger orchestrator workflows from natural language.

**Implementation Details:**
```yaml
# ~/.claude/hooks/orchestrator-activation.yaml
version: "1.0"
description: "Activates project orchestrator based on user intent"

hooks:
  - event: UserPromptSubmit
    description: "Monitor for project management commands"
    conditions:
      - pattern: "(?i)(switch|change)\\s+(to\\s+)?project\\s+(\\w+)"
        workflow: "switch"
        extract_args: [3]

      - pattern: "(?i)create\\s+(new\\s+)?project\\s+(\\w+)"
        workflow: "create"
        extract_args: [2]

      - pattern: "(?i)(list|show)\\s+projects?"
        workflow: "list"

      - pattern: "(?i)(remove|delete)\\s+project\\s+(\\w+)"
        workflow: "remove"
        extract_args: [2]
        requires_confirmation: true
```

Implement hook handler:
```javascript
// ~/.claude/hooks/orchestrator-handler.js
export async function handleOrchestratorCommand(match, workflow, args) {
  switch (workflow) {
    case 'switch':
      const projectName = args[0];
      return await executeCLICommand('project', 'switch', projectName);

    case 'create':
      const newName = args[0];
      return await executeCLICommand('project', 'create', newName);

    case 'list':
      return await executeCLICommand('project', 'list');

    case 'remove':
      const removeName = args[0];
      // Show confirmation prompt first
      const confirmed = await askConfirmation(
        `Remove project '${removeName}'? This will deregister it but not delete files.`
      );
      if (confirmed) {
        return await executeCLICommand('project', 'remove', removeName);
      }
      break;
  }
}
```

**Deliverables:**
- [ ] orchestrator-activation.yaml created
- [ ] Hook handler implemented
- [ ] Natural language commands work

**Test Strategy:**
```
User: "Switch to my shopify project"
→ Should execute: claude project switch shopify

User: "Create new project called blog"
→ Should execute: claude project create blog

User: "Show me all projects"
→ Should execute: claude project list
```

---

### Task 4.3: Build JavaScript Action Handlers
**ID:** 4.3
**Priority:** Medium
**Dependencies:** 4.2
**Status:** Pending

**Description:**
Create JavaScript modules that handle orchestrator actions programmatically.

**Implementation Details:**
Create action modules in `~/.claude/skills/project_orchestrator/actions/`:

```javascript
// actions/create-project.js
export async function createProject(name, options = {}) {
  // Validate name
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error('Invalid project name');
  }

  // Check if exists
  const config = await loadConfig();
  if (config.projects[name]) {
    throw new Error(`Project '${name}' already exists`);
  }

  // Get template
  const template = options.template || 'base';
  const templatePath = `${CLAUDE_HOME}/templates/${template}`;

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template '${template}' not found`);
  }

  // Create project...
  // (Implementation from Task 2.3)

  return {
    success: true,
    project: name,
    path: projectPath
  };
}
```

**Deliverables:**
- [ ] create-project.js
- [ ] switch-project.js
- [ ] list-projects.js
- [ ] remove-project.js
- [ ] validate-project.js

**Test Strategy:**
```javascript
import { createProject } from './actions/create-project.js';

describe('createProject', () => {
  it('creates new project', async () => {
    const result = await createProject('test-api');
    expect(result.success).toBe(true);
    expect(fs.existsSync(result.path)).toBe(true);
  });

  it('rejects invalid names', async () => {
    await expect(createProject('invalid!')).rejects.toThrow();
  });
});
```

---

### Task 4.4: Add Error Handling and Confirmations
**ID:** 4.4
**Priority:** Medium
**Dependencies:** 4.3
**Status:** Pending

**Description:**
Implement comprehensive error handling and confirmation flows for destructive operations.

**Implementation Details:**
```javascript
// lib/error-handler.js
export class OrchestratorError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'OrchestratorError';
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        suggestions: this.getSuggestions()
      }
    };
  }

  getSuggestions() {
    switch (this.code) {
      case 'PROJECT_NOT_FOUND':
        return [
          "Check project name spelling",
          "Use 'claude project list' to see available projects",
          `Create new project with 'claude project create ${this.details.requested}'`
        ];

      case 'INVALID_PROJECT_NAME':
        return [
          "Project names must contain only letters, numbers, hyphens, and underscores",
          "Examples: my-project, api_v2, dashboard-2024"
        ];

      default:
        return [];
    }
  }
}

// Confirmation helper
export async function confirm(message, defaultValue = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    const prompt = `${message} ${defaultValue ? '[Y/n]' : '[y/N]'}: `;
    rl.question(prompt, answer => {
      rl.close();

      if (!answer) {
        resolve(defaultValue);
      } else {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      }
    });
  });
}
```

**Deliverables:**
- [ ] Error handler class created
- [ ] All error codes defined
- [ ] Confirmation utility implemented
- [ ] Integrated into all actions

**Test Strategy:**
- Trigger each error code
- Verify suggestions are helpful
- Test confirmation prompts (yes/no/default)

---

### Task 4.5: Write Skill Documentation
**ID:** 4.5
**Priority:** Low
**Dependencies:** 4.1, 4.2, 4.3
**Status:** Pending

**Description:**
Complete the SKILL.md and workflow documentation for the orchestrator.

**Implementation Details:**
- Write clear, concise SKILL.md (under 500 lines)
- Document each workflow in workflows/ directory
- Include usage examples
- Add troubleshooting section in resources/

**Deliverables:**
- [ ] SKILL.md complete and reviewed
- [ ] All workflow .md files documented
- [ ] resources/troubleshooting.md created

**Test Strategy:**
- Manual review for clarity
- Test examples actually work
- Verify line count <500

---

### Task 4.6: Create Agentic Feature Selection Guide
**ID:** 4.6
**Priority:** High
**Dependencies:** None
**Status:** Pending

**Description:**
Implement the decision tree framework for selecting appropriate agentic features (Slash Commands, MCPs, Sub-Agents, Skills) based on task requirements.

**Implementation Details:**
Create `~/.claude/docs/AGENTIC_FEATURE_GUIDE.md`:

```markdown
# Agentic Feature Selection Guide

## Decision Tree

### Step 1: Simple, single-step task?
→ YES: Use Slash Command (.claude/commands/)
→ NO: Continue to Step 2

### Step 2: External system integration?
→ YES: Use MCP Server (.mcp.json)
→ NO: Continue to Step 3

### Step 3: High-scale parallel execution with context isolation?
→ YES: Use Sub-Agent (.claude/agents/)
→ NO: Continue to Step 4

### Step 4: Complex multi-step workflow?
→ YES: Use Skill (.claude/skills/)
→ NO: Re-evaluate against Step 1

## Justification Template

When proposing a new feature, document:
- [ ] Task complexity level
- [ ] External integration requirements
- [ ] Parallel execution needs
- [ ] Reusability considerations
- [ ] Selected feature type with rationale
```

**Deliverables:**
- [ ] AGENTIC_FEATURE_GUIDE.md created
- [ ] Decision tree documented
- [ ] Examples for each feature type
- [ ] Justification template provided

**Test Strategy:**
- Apply decision tree to 5 example tasks
- Verify recommendations align with architecture
- Review with sample use cases

---

### Task 4.7: Define Sub-Agent System Prompt Template
**ID:** 4.7
**Priority:** High
**Dependencies:** 4.6
**Status:** Pending

**Description:**
Create standardized templates for sub-agent design following Section 3.6.3 patterns.

**Implementation Details:**
Create `~/.claude/templates/sub-agent-template/`:

```
sub-agent-template/
├── AGENT.md                    # Agent system prompt and documentation
├── config.json                 # Agent configuration and tool restrictions
└── README.md                   # Usage instructions
```

**AGENT.md Template:**
```markdown
# System Prompt: [Agent Name]

You are a specialized [purpose] sub-agent. Your role is to [specific task].

**IMPORTANT:**
- You operate in an isolated context window
- Your response will be consumed by the Primary Agent, not the user
- Format all output as structured data for programmatic consumption
- You have NO access to conversation history

## Tools Allowed
- [List specific tools]

## Output Format
[AGENT_STATUS] Brief, fact-based summary of work and result. Next step guidance (optional).

## Task Definition
[Detailed task description]
```

**config.json Template:**
```json
{
  "agent_id": "example_agent",
  "agent_type": "sub-agent",
  "allowed_tools": ["bash", "grep", "read"],
  "forbidden_tools": ["edit", "write", "delete"],
  "tool_scope": "read-only",
  "output_format": "[STATUS] summary",
  "invocation_triggers": [
    "keyword1",
    "keyword2"
  ],
  "description": "Proactively invoked when user requests [specific task type]"
}
```

**Deliverables:**
- [ ] Sub-agent template directory created
- [ ] AGENT.md template with all required sections
- [ ] config.json schema defined
- [ ] README.md with usage instructions

**Test Strategy:**
```bash
# Test template instantiation
cp -r ~/.claude/templates/sub-agent-template ~/.claude/agents/test_agent
# Customize test_agent
# Validate against checklist in Section 3.6.3
```

---

### Task 4.8: Implement Feature Composition Framework
**ID:** 4.8
**Priority:** Medium
**Dependencies:** 4.6, 4.7
**Status:** Pending

**Description:**
Build the framework for Skills to compose (call/leverage) other features: Slash Commands, Sub-Agents, and MCPs.

**Implementation Details:**
Create `~/.claude/lib/feature-composer.js`:

```javascript
// lib/feature-composer.js
export class FeatureComposer {
  /**
   * Execute a slash command from within a skill
   */
  async executeSlashCommand(commandName, args = []) {
    const commandPath = `${CLAUDE_HOME}/commands/${commandName}.md`;
    if (!fs.existsSync(commandPath)) {
      throw new Error(`Slash command '${commandName}' not found`);
    }

    // Load and process command
    const commandContent = await fs.readFile(commandPath, 'utf-8');
    return await processCommand(commandContent, args);
  }

  /**
   * Invoke a sub-agent from within a skill
   */
  async invokeSubAgent(agentId, prompt, context = {}) {
    const agentPath = `${CLAUDE_HOME}/agents/${agentId}`;
    const config = await loadJSON(`${agentPath}/config.json`);

    // Validate invocation
    if (!config.agent_type === 'sub-agent') {
      throw new Error(`${agentId} is not a sub-agent`);
    }

    // Execute agent with isolated context
    const result = await executeAgent(agentId, prompt, {
      isolated: true,
      allowedTools: config.allowed_tools,
      context: context
    });

    // Parse standardized output: [STATUS] message
    return parseAgentOutput(result);
  }

  /**
   * Query an MCP server from within a skill
   */
  async queryMCP(serverId, method, params = {}) {
    const mcpConfig = await loadJSON(`${CLAUDE_HOME}/.mcp.json`);
    const server = mcpConfig.mcpServers[serverId];

    if (!server) {
      throw new Error(`MCP server '${serverId}' not found`);
    }

    return await mcpClient.request(server, method, params);
  }
}

function parseAgentOutput(rawOutput) {
  // Parse format: [STATUS] message
  const match = rawOutput.match(/^\[(\w+)\]\s+(.+)$/s);
  if (!match) {
    throw new Error('Invalid agent output format');
  }

  return {
    status: match[1],
    message: match[2],
    raw: rawOutput
  };
}
```

**Skill Integration Example:**
```javascript
// skills/git_worktree_manager/workflows/validate.js
import { FeatureComposer } from '~/.claude/lib/feature-composer.js';

const composer = new FeatureComposer();

// Use slash command
await composer.executeSlashCommand('git_status');

// Use sub-agent for parallel validation
const result = await composer.invokeSubAgent(
  'context_validator',
  'Validate git worktree at /path/to/worktree',
  { worktreePath: '/path/to/worktree' }
);

// Use MCP for real-time git state
const gitState = await composer.queryMCP(
  'git_mcp',
  'getStatus',
  { repo: '/path/to/repo' }
);
```

**Deliverables:**
- [ ] FeatureComposer class implemented
- [ ] Methods for all feature types (Commands, Agents, MCPs)
- [ ] Agent output parser
- [ ] Integration examples documented

**Test Strategy:**
```javascript
describe('FeatureComposer', () => {
  it('executes slash commands', async () => {
    const result = await composer.executeSlashCommand('test_command');
    expect(result).toBeDefined();
  });

  it('invokes sub-agents with isolation', async () => {
    const result = await composer.invokeSubAgent('test_agent', 'test prompt');
    expect(result.status).toBe('SUCCESS');
  });

  it('queries MCP servers', async () => {
    const data = await composer.queryMCP('test_mcp', 'getData');
    expect(data).toBeDefined();
  });
});
```

---

### Task 4.9: Build MCP Integration Guidelines
**ID:** 4.9
**Priority:** Low
**Dependencies:** 4.6
**Status:** Pending

**Description:**
Document when and how to create MCP servers for external system integrations.

**Implementation Details:**
Create `~/.claude/docs/MCP_INTEGRATION_GUIDE.md`:

```markdown
# MCP Integration Guide

## When to Use MCPs (Step 2 of Decision Tree)

Use an MCP Server when:
- Connecting to external APIs (REST, GraphQL, gRPC)
- Querying databases (SQL, NoSQL)
- Accessing proprietary data sources
- Real-time data fetching requirements
- Third-party service integrations

## MCP Server Structure

### Configuration (.mcp.json)
```json
{
  "mcpServers": {
    "database_connector": {
      "command": "npx",
      "args": ["-y", "@myorg/database-mcp"],
      "env": {
        "DATABASE_URL": "postgresql://...",
        "API_KEY": "..."
      }
    }
  }
}
```

### Server Implementation
- Located: Separate npm package or local executable
- Protocol: MCP (Model Context Protocol) standard
- Tools: Expose specific methods for Primary Agent to call

## Integration from Skills

```javascript
// From a skill workflow
const composer = new FeatureComposer();

const data = await composer.queryMCP('database_connector', 'query', {
  sql: 'SELECT * FROM users WHERE active = true'
});
```

## Best Practices
1. **Security**: Never hardcode credentials, use environment variables
2. **Error Handling**: Implement retry logic for network failures
3. **Rate Limiting**: Respect API rate limits
4. **Caching**: Cache responses when appropriate
5. **Documentation**: Document all exposed methods clearly
```

**Deliverables:**
- [ ] MCP_INTEGRATION_GUIDE.md created
- [ ] When-to-use decision criteria documented
- [ ] Configuration examples provided
- [ ] Integration patterns documented
- [ ] Best practices section included

**Test Strategy:**
- Create example MCP server for testing
- Verify integration with FeatureComposer
- Test error handling scenarios

---

## PHASE 5: Management & Cleanup (Week 5)

### Task 5.1: Implement Remove Project Command
**ID:** 5.1
**Priority:** High
**Dependencies:** 4.4
**Status:** Pending

**Description:**
Build `claude project remove <name>` command with safety measures.

**Implementation Details:**
```bash
#!/usr/bin/env bash
# ~/.claude/bin/commands/remove-project.sh

PROJECT_NAME="$1"
FORCE="${2:-}"

if [[ -z "$PROJECT_NAME" ]]; then
  echo "Error: Project name required"
  echo "Usage: claude project remove <name> [--force]"
  exit 1
fi

# Check project exists
if ! jq -e ".projects.\"$PROJECT_NAME\"" "$CONFIG" >/dev/null 2>&1; then
  echo "Error: Project '$PROJECT_NAME' not found"
  exit 1
fi

# Get project details
PROJECT_PATH=$(jq -r ".projects.\"$PROJECT_NAME\".path" "$CONFIG")
IS_ACTIVE=$(jq -r ".active_project == \"$PROJECT_NAME\"" "$CONFIG")

# Show project info
echo "Project: $PROJECT_NAME"
echo "Path: $PROJECT_PATH"
echo "Active: $IS_ACTIVE"
echo ""
echo "This will:"
echo "  - Remove project from registry"
echo "  - NOT delete project files (safety measure)"

# Confirmation (unless --force)
if [[ "$FORCE" != "--force" ]]; then
  read -p "Are you sure you want to remove this project? [y/N]: " CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Cancelled"
    exit 0
  fi
fi

# Remove from config
jq "del(.projects.\"$PROJECT_NAME\")" "$CONFIG" > "$CONFIG.tmp"

# If this was active project, set active to null
if [[ "$IS_ACTIVE" == "true" ]]; then
  jq '.active_project = null' "$CONFIG.tmp" > "$CONFIG.tmp2"
  mv "$CONFIG.tmp2" "$CONFIG.tmp"
fi

mv "$CONFIG.tmp" "$CONFIG"

echo "✓ Project '$PROJECT_NAME' removed from registry"
echo ""
echo "Project files still exist at: $PROJECT_PATH"
echo "To delete files, run: rm -rf $PROJECT_PATH"
```

**Deliverables:**
- [ ] remove-project.sh script created
- [ ] Requires confirmation by default
- [ ] Never deletes files (safety)
- [ ] Handles active project removal

**Test Strategy:**
```bash
# Create test project
claude project create test-remove

# Try to remove without confirmation
echo "n" | claude project remove test-remove
# Should cancel

# Remove with confirmation
echo "y" | claude project remove test-remove
# Should succeed

# Verify still registered
jq '.projects."test-remove"' ~/.claude/config.json
# Should be null

# Verify files still exist
ls ~/Projects/test-remove/.claude/
# Should still show files
```

---

### Task 5.2: Build Project Integrity Validation
**ID:** 5.2
**Priority:** Medium
**Dependencies:** None
**Status:** Pending

**Description:**
Implement `claude project validate <name>` to check project structure and health.

**Implementation Details:**
```javascript
// lib/validator.js
export async function validateProject(projectName) {
  const results = {
    project: projectName,
    checks: [],
    errors: [],
    warnings: []
  };

  const project = config.projects[projectName];
  if (!project) {
    results.errors.push({
      check: 'project_exists',
      message: `Project '${projectName}' not found in registry`
    });
    return results;
  }

  // 1. Structure Validation
  results.checks.push(await checkDirectoryStructure(project.path));

  // 2. Claude.md Validation
  results.checks.push(await checkClaudeMd(project.path));

  // 3. skill-rules.json Validation
  results.checks.push(await checkSkillRules(project.path));

  // 4. metadata.json Validation
  results.checks.push(await checkMetadata(project.path, projectName));

  // 5. Skill Validation
  results.checks.push(await checkSkills(project.path));

  // 6. Path Validation
  results.checks.push(await checkPath(project.path));

  // Categorize results
  for (const check of results.checks) {
    if (check.status === 'error') {
      results.errors.push(check);
    } else if (check.status === 'warning') {
      results.warnings.push(check);
    }
  }

  return results;
}

async function checkDirectoryStructure(projectPath) {
  const required = [
    '.claude/Claude.md',
    '.claude/skill-rules.json',
    '.claude/metadata.json',
    '.claude/skills',
    '.claude/hooks',
    '.claude/agents',
    '.claude/commands',
    '.claude/resources'
  ];

  const missing = [];
  for (const path of required) {
    if (!fs.existsSync(`${projectPath}/${path}`)) {
      missing.push(path);
    }
  }

  return {
    name: 'Directory Structure',
    status: missing.length === 0 ? 'pass' : 'error',
    message: missing.length === 0
      ? 'All required directories present'
      : `Missing: ${missing.join(', ')}`,
    fix: missing.length > 0
      ? `Run: mkdir -p ${missing.map(p => `${projectPath}/${p}`).join(' ')}`
      : null
  };
}
```

**Deliverables:**
- [ ] validate-project.sh command created
- [ ] Validator module implemented
- [ ] Checks all required components
- [ ] Provides fix suggestions

**Test Strategy:**
```bash
# Validate good project
claude project validate test-project
# All checks should pass

# Break a project (remove Claude.md)
rm ~/Projects/test-project/.claude/Claude.md

# Validate again
claude project validate test-project
# Should show error with fix suggestion
```

---

### Task 5.3: Create Migration Helper for Existing Projects
**ID:** 5.3
**Priority:** Medium
**Dependencies:** 2.1
**Status:** Pending

**Description:**
Build tool to register existing diet103 projects with the orchestrator.

**Implementation Details:**
```bash
#!/usr/bin/env bash
# ~/.claude/bin/commands/register-existing.sh

PROJECT_PATH="$1"

if [[ -z "$PROJECT_PATH" ]]; then
  echo "Usage: claude project register <path>"
  exit 1
fi

# Expand path
PROJECT_PATH="${PROJECT_PATH/#\~/$HOME}"

# Check .claude/ exists
if [[ ! -d "$PROJECT_PATH/.claude" ]]; then
  echo "Error: Not a Claude project (no .claude/ directory found)"
  exit 1
fi

# Detect project name from path
PROJECT_NAME=$(basename "$PROJECT_PATH")

# Prompt for custom name
read -p "Project name [$PROJECT_NAME]: " CUSTOM_NAME
PROJECT_NAME="${CUSTOM_NAME:-$PROJECT_NAME}"

# Validate name
if [[ ! "$PROJECT_NAME" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  echo "Error: Invalid project name"
  exit 1
fi

# Check if already registered
if jq -e ".projects.\"$PROJECT_NAME\"" "$CONFIG" >/dev/null 2>&1; then
  echo "Error: Project '$PROJECT_NAME' already registered"
  exit 1
fi

# Add metadata.json if missing
if [[ ! -f "$PROJECT_PATH/.claude/metadata.json" ]]; then
  echo "Creating metadata.json..."
  cat > "$PROJECT_PATH/.claude/metadata.json" <<EOF
{
  "project_id": "$PROJECT_NAME",
  "version": "0.1.0",
  "description": "",
  "skills": [],
  "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "diet103_version": "1.2.0",
  "tags": []
}
EOF
fi

# Register in config
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
jq ".projects.\"$PROJECT_NAME\" = {
  \"path\": \"$PROJECT_PATH\",
  \"created\": \"$NOW\",
  \"last_active\": \"$NOW\",
  \"metadata\": {
    \"description\": \"\",
    \"tags\": []
  }
}" "$CONFIG" > "$CONFIG.tmp"

mv "$CONFIG.tmp" "$CONFIG"

echo "✓ Registered existing project: $PROJECT_NAME"
echo "✓ Path: $PROJECT_PATH"
```

**Deliverables:**
- [ ] register-existing.sh script created
- [ ] Detects existing diet103 projects
- [ ] Adds missing metadata.json
- [ ] Registers in config

**Test Strategy:**
```bash
# Create diet103 project manually
mkdir -p /tmp/old-project/.claude/{skills,hooks,agents,commands}
touch /tmp/old-project/.claude/{Claude.md,skill-rules.json}

# Register it
claude project register /tmp/old-project

# Verify registration
jq '.projects."old-project"' ~/.claude/config.json
# Should show project details
```

---

### Task 5.4: Write Comprehensive Tests
**ID:** 5.4
**Priority:** High
**Dependencies:** All previous tasks
**Status:** Pending

**Description:**
Create full test suite covering all orchestrator functionality.

**Implementation Details:**
```javascript
// tests/integration.test.js
describe('Orchestrator Integration Tests', () => {

  describe('Project Lifecycle', () => {
    it('full lifecycle: create -> switch -> validate -> remove', async () => {
      // Create
      const result = await createProject('integration-test');
      expect(result.success).toBe(true);

      // Validate
      const validation = await validateProject('integration-test');
      expect(validation.errors.length).toBe(0);

      // Switch
      await switchProject('integration-test');
      const config = await loadConfig();
      expect(config.active_project).toBe('integration-test');

      // Remove
      await removeProject('integration-test', true);
      const configAfter = await loadConfig();
      expect(configAfter.projects['integration-test']).toBeUndefined();
    });
  });

  describe('Multi-Project Isolation', () => {
    it('maintains context isolation between projects', async () => {
      // Create two projects with different configs
      await createProject('project-a');
      await createProject('project-b');

      // Configure different triggers
      await setSkillRule('project-a', {
        trigger_phrases: ['keyword-a'],
        skill: 'skill-a'
      });

      await setSkillRule('project-b', {
        trigger_phrases: ['keyword-b'],
        skill: 'skill-b'
      });

      // Switch to A
      await switchProject('project-a');

      // Verify A's rules active, B's not
      // (This test requires integration with actual Claude Code)
    });
  });

  describe('Performance', () => {
    it('switches projects in <1s', async () => {
      await createProject('perf-test-a');
      await createProject('perf-test-b');

      const start = Date.now();
      await switchProject('perf-test-b');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(1000);
    });
  });

  describe('Error Recovery', () => {
    it('recovers from corrupted config', async () => {
      // Corrupt config
      await fs.writeFile(CONFIG, '{invalid json}');

      // Should detect and recover
      const result = await repairConfig();
      expect(result.success).toBe(true);

      // Config should be valid
      const config = await loadConfig();
      expect(() => validateConfig(config)).not.toThrow();
    });
  });
});
```

**Deliverables:**
- [ ] Unit tests for all modules (>80% coverage)
- [ ] Integration tests for workflows
- [ ] Performance benchmarks
- [ ] Error recovery tests

**Test Strategy:**
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run only integration tests
npm run test:integration

# Performance benchmarks
npm run test:perf
```

---

## PHASE 6: Polish & Documentation (Week 6)

### Task 6.1: Write User Documentation
**ID:** 6.1
**Priority:** Medium
**Dependencies:** All previous tasks
**Status:** Pending

**Description:**
Create comprehensive user-facing documentation.

**Implementation Details:**
Create `~/.claude/docs/` with:
1. **README.md** - Overview and quick start
2. **GETTING_STARTED.md** - Step-by-step guide
3. **CLI_REFERENCE.md** - All commands documented
4. **ARCHITECTURE.md** - System design explanation
5. **TROUBLESHOOTING.md** - Common issues and solutions
6. **FAQ.md** - Frequently asked questions

**Deliverables:**
- [ ] All documentation files created
- [ ] Examples tested and verified
- [ ] Screenshots/diagrams included

**Test Strategy:**
- Have new user follow getting started guide
- Verify all examples work
- Check for broken links

---

### Task 6.2: Create Additional Project Templates
**ID:** 6.2
**Priority:** Low
**Dependencies:** 2.1
**Status:** Pending

**Description:**
Add more project templates for common use cases.

**Implementation Details:**
Create templates for:
1. **api-backend** - REST API with backend-dev-guidelines skill
2. **data-science** - Python data analysis with relevant skills
3. **documentation** - Documentation project with doc_generator skill

**Deliverables:**
- [ ] 3+ additional templates created
- [ ] Each template documented
- [ ] Examples for each template type

**Test Strategy:**
```bash
# Test each template
for template in api-backend data-science documentation; do
  claude project create "test-${template}" --template "$template"
  claude project validate "test-${template}"
done
```

---

### Task 6.3: Add Shell Completions
**ID:** 6.3
**Priority:** Low
**Dependencies:** 1.4
**Status:** Pending

**Description:**
Create bash/zsh completion scripts for the CLI.

**Implementation Details:**
```bash
# ~/.claude/completions/claude-completion.bash
_claude_completions() {
  local cur prev opts projects
  COMPREPLY=()
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"

  # Top-level commands
  if [[ ${COMP_CWORD} == 1 ]]; then
    opts="project"
    COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
    return 0
  fi

  # project subcommands
  if [[ ${prev} == "project" ]]; then
    opts="list create switch remove validate"
    COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
    return 0
  fi

  # Complete project names for switch/remove/validate
  if [[ ${prev} == "switch" || ${prev} == "remove" || ${prev} == "validate" ]]; then
    projects=$(jq -r '.projects | keys[]' ~/.claude/config.json 2>/dev/null)
    COMPREPLY=( $(compgen -W "${projects}" -- ${cur}) )
    return 0
  fi
}

complete -F _claude_completions claude
```

**Deliverables:**
- [ ] Bash completion script
- [ ] Zsh completion script
- [ ] Installation instructions

**Test Strategy:**
```bash
# Source completion
source ~/.claude/completions/claude-completion.bash

# Test tab completion
claude pro[TAB]
# Should complete to "project"

claude project swi[TAB]
# Should complete to "switch"

claude project switch [TAB]
# Should show project names
```

---

### Task 6.4: Optimize Performance
**ID:** 6.4
**Priority:** Medium
**Dependencies:** 3.3, 3.4
**Status:** Pending

**Description:**
Profile and optimize critical paths to meet performance targets.

**Implementation Details:**
1. **Profile switch operation:**
   - Identify bottlenecks
   - Optimize file I/O
   - Parallelize independent operations

2. **Cache optimization:**
   - Tune cache invalidation logic
   - Minimize unnecessary reads

3. **Config loading:**
   - Lazy load where possible
   - Validate only when needed

**Deliverables:**
- [ ] Performance profiling results
- [ ] Optimizations implemented
- [ ] Benchmarks show <1s switch time

**Test Strategy:**
```bash
# Benchmark script
#!/usr/bin/env bash
for i in {1..10}; do
  time claude project switch test-a
  time claude project switch test-b
done | grep real | awk '{print $2}' | sort -n | tail -1
# Max time should be <1s
```

---

### Task 6.5: Final Integration Testing
**ID:** 6.5
**Priority:** High
**Dependencies:** All tasks
**Status:** Pending

**Description:**
Comprehensive end-to-end testing of the entire system.

**Implementation Details:**
Test scenarios:
1. **New user setup:**
   - Fresh install
   - Create first project
   - Switch between projects

2. **Migration scenario:**
   - Register existing diet103 projects
   - Verify backward compatibility

3. **Power user scenario:**
   - Manage 10+ projects
   - Rapid switching
   - Natural language commands

4. **Error scenarios:**
   - Corrupted config
   - Missing project files
   - Invalid inputs

**Deliverables:**
- [ ] All scenarios documented
- [ ] Test scripts created
- [ ] All scenarios pass

**Test Strategy:**
Execute full test suite:
```bash
# Run integration tests
npm run test:integration

# Run performance benchmarks
npm run test:perf

# Run user scenarios
./tests/scenarios/new-user.sh
./tests/scenarios/migration.sh
./tests/scenarios/power-user.sh
./tests/scenarios/error-recovery.sh
```

---

## Summary Statistics

**Total Tasks:** 44
**Phases:** 6
**Estimated Timeline:** 7 weeks

**By Priority:**
- High: 22 tasks
- Medium: 16 tasks
- Low: 6 tasks

**By Phase:**
- Phase 1 (Foundation): 5 tasks
- Phase 2 (Project Creation): 4 tasks
- Phase 3 (Context Switching): 5 tasks
- Phase 4 (Orchestrator Skill): 9 tasks (added 4 new tasks for agentic architecture)
- Phase 5 (Management): 4 tasks
- Phase 6 (Polish): 5 tasks

**New Tasks Added (v1.1):**
- Task 4.6: Create Agentic Feature Selection Guide (High)
- Task 4.7: Define Sub-Agent System Prompt Template (High)
- Task 4.8: Implement Feature Composition Framework (Medium)
- Task 4.9: Build MCP Integration Guidelines (Low)

**Critical Path:**
1.1 → 1.2 → 1.4 → 1.5 → 2.1 → 2.3 → 3.1 → 3.2 → 3.3 → 4.1 → 4.2 → 4.3 → 4.6 → 4.7 → 4.8 → 5.1 → 6.5

---

## Next Steps

To begin implementation:

1. **Set up development environment**
   ```bash
   cd ~/.claude
   npm init -y
   npm install ajv ajv-formats
   ```

2. **Start with Phase 1, Task 1.1**
   ```bash
   # Create directory structure
   bash -c "$(cat task-1.1-script.sh)"
   ```

3. **Track progress**
   - Mark tasks as completed in this document
   - Update status in task management system
   - Document any deviations or learnings

4. **Configure Task Master (optional)**
   - Add API keys to `.env`
   - Run: `task-master parse-prd Docs/Orchestrator_PRD.md`
   - Use Task Master for task tracking

---

**Document Version:** 1.1
**Last Updated:** 2025-11-06
**Source PRD:** Orchestrator_PRD.md v1.1

**Change Log:**
- v1.0 (2025-11-05): Initial task breakdown from PRD v1.0
- v1.1 (2025-11-06): Added 4 new Phase 4 tasks for Agentic Feature Architecture (Tasks 4.6-4.9)
