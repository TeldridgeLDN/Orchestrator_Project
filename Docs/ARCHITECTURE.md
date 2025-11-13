# Project Orchestrator Architecture

System design and technical architecture documentation.

## Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [System Architecture](#system-architecture)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [File System Layout](#file-system-layout)
7. [diet103 Integration](#diet103-integration)
8. [Security Considerations](#security-considerations)
9. [Performance](#performance)
10. [Extensibility](#extensibility)

---

## Overview

Project Orchestrator is a CLI-based context management system for Claude development projects. It solves the token efficiency problem when working with multiple projects by ensuring only one project's context is active at any time.

### Key Concepts

- **Single Active Context Rule**: Only one project loaded at a time
- **Context Isolation**: Inactive projects remain completely dormant
- **Explicit Switching**: Projects switched via CLI or natural language
- **diet103 Compatible**: Follows PAI Skills-as-Containers architecture

### Goals

1. **Token Efficiency**: Minimize context overhead
2. **Fast Operations**: Sub-second switching
3. **Clean Separation**: No cross-project contamination
4. **Predictable Behavior**: Clear understanding of active state

---

## Design Principles

### 1. Single Responsibility
Each component has one clear purpose:
- CLI handles commands
- Config manages project registry
- Context manager handles loading/unloading
- Validator ensures structure integrity

### 2. Explicit Over Implicit
- Project switching is explicit via commands
- No automatic context loading
- Clear active project indication
- Predictable state transitions

### 3. Fail-Safe Defaults
- Non-blocking validation (warnings only)
- Graceful degradation
- Preserve user data
- Clear error messages

### 4. Token Efficiency First
- Global orchestration: <500 tokens
- Only active project loaded
- Lazy skill loading
- Context caching for fast resume

### 5. diet103 Compatibility
- Follows PAI principles
- Skills as containers (<500 lines)
- Progressive disclosure
- Modular structure

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User (CLI/IDE)                       │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              CLI Layer (Commander.js)                   │
│  ┌─────────┬────────┬────────┬────────┬──────────┐    │
│  │ create  │ switch │  list  │ remove │ validate │    │
│  └─────────┴────────┴────────┴────────┴──────────┘    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Core Systems Layer                         │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │   Config     │   Context    │  Validation  │        │
│  │   Manager    │   Manager    │   System     │        │
│  └──────────────┴──────────────┴──────────────┘        │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              File System Layer                          │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │   Global     │   Project    │   Template   │        │
│  │   Config     │   .claude/   │   System     │        │
│  └──────────────┴──────────────┴──────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Component Interaction

```
User Command
    │
    ▼
┌─────────────────┐
│  CLI Parser     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│ Command Handler │─────▶│ Config Mgr   │
└────────┬────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│ Context Manager │─────▶│ File System  │
└────────┬────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐
│ Validator       │
└────────┬────────┘
         │
         ▼
     Success/Error
```

---

## Core Components

### 1. CLI Layer (`~/.claude/bin/claude`)

**Purpose:** Command-line interface and user interaction

**Technology:** Node.js + Commander.js

**Responsibilities:**
- Parse command-line arguments
- Validate user input
- Route to appropriate handlers
- Format and display output
- Handle errors and exit codes

**Key Files:**
- `bin/claude` - Main entry point
- `lib/commands/*.js` - Command implementations

### 2. Configuration Manager

**Purpose:** Manage global configuration and project registry

**Location:** `~/.claude/lib/config-validator.js`

**Responsibilities:**
- Load/save global config
- Register/unregister projects
- Track active project
- Validate config schema
- Manage project metadata

**Data Structure:**
```javascript
{
  version: "1.0.0",
  active_project: "project-name",
  projects: {
    "project-name": {
      path: "/absolute/path",
      created: "ISO-8601 date",
      last_active: "ISO-8601 date",
      metadata: { /* custom fields */ }
    }
  },
  settings: { /* global settings */ }
}
```

### 3. Context Manager

**Purpose:** Handle project context loading/unloading

**Location:** `~/.claude/lib/utils/context-manager.js`

**Responsibilities:**
- Load project context files
- Unload previous context
- Cache recently used contexts
- Validate context structure
- Track context state

**Context Loading Process:**
1. Validate project exists
2. Unload current context (if any)
3. Load `.claude/Claude.md`
4. Load `skill-rules.json`
5. Register skills from `skills/`
6. Activate hooks from `hooks/`
7. Update active project

**Key Functions:**
```javascript
loadContext(projectName)
unloadContext(projectName)
cacheContext(projectName)
validateContext(projectPath)
```

### 4. Validation System

**Purpose:** Ensure project structure integrity

**Location:** `~/.claude/lib/utils/validation.js`

**Checks:**
- Required files present
- JSON schema validation
- File permissions
- Structure completeness
- Circular dependencies

**Validation Levels:**
- **Required:** Must pass (Claude.md, metadata.json)
- **Recommended:** Should pass (skill-rules.json)
- **Optional:** Nice to have (skills/, agents/)

### 5. Template System

**Purpose:** Provide starting points for new projects

**Location:** `~/.claude/templates/`

**Available Templates:**
- `base/` - Minimal diet103 structure
- `web-app/` - Web development setup
- `shopify/` - E-commerce configuration

**Template Structure:**
```
template/
└── .claude/
    ├── Claude.md         # Template context
    ├── metadata.json     # Template metadata
    ├── skill-rules.json  # Pre-configured rules
    ├── hooks/            # Optional hooks
    └── skills/           # Optional skills
```

---

## Data Flow

### Project Creation Flow

```
User: claude project create my-app --template web-app
    │
    ▼
┌───────────────────┐
│ Validate inputs   │
│ - name unique     │
│ - template exists │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Create directory  │
│ ~/Projects/my-app │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Copy template     │
│ web-app → my-app  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Update metadata   │
│ - name            │
│ - timestamp       │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Register project  │
│ in config.json    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Set as active     │
│ project           │
└─────────┬─────────┘
          │
          ▼
    Success ✓
```

### Project Switching Flow

```
User: claude project switch my-api
    │
    ▼
┌───────────────────┐
│ Validate project  │
│ exists            │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Unload current    │
│ context           │
│ - Clear skills    │
│ - Clear hooks     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Load new context  │
│ - Load Claude.md  │
│ - Load skills     │
│ - Load hooks      │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Update config     │
│ - active_project  │
│ - last_active     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Cache previous    │
│ context           │
└─────────┬─────────┘
          │
          ▼
    Success ✓
```

---

## File System Layout

### Global Structure

```
~/.claude/                      # CLI installation
├── bin/
│   └── claude                 # Main executable
├── lib/
│   ├── commands/              # Command implementations
│   │   ├── create.js
│   │   ├── switch.js
│   │   ├── list.js
│   │   ├── remove.js
│   │   └── validate.js
│   └── utils/                 # Utility modules
│       ├── context-manager.js
│       ├── config-validator.js
│       ├── validation.js
│       ├── logger.js
│       └── formatting.js
├── templates/                 # Project templates
│   ├── base/
│   ├── web-app/
│   └── shopify/
├── cache/                     # Context cache
├── config.json                # Global config
├── schema/
│   └── config-schema.json     # Config validation
├── package.json               # Dependencies
└── node_modules/              # Installed packages
```

### Project Structure

```
~/Projects/my-project/          # User's project
├── .claude/                    # diet103 structure
│   ├── Claude.md              # Project context (REQUIRED)
│   ├── metadata.json          # Project metadata (REQUIRED)
│   ├── skill-rules.json       # Skill activation rules
│   ├── settings.local.json    # Claude Code settings
│   ├── hooks/                 # Automation hooks
│   │   ├── UserPromptSubmit.sh
│   │   └── PostToolUse.sh
│   ├── skills/                # Project skills
│   │   └── my-skill/
│   │       └── skill.md
│   ├── commands/              # Slash commands
│   │   └── my-command.md
│   ├── agents/                # Custom agents
│   │   └── my-agent.md
│   └── resources/             # Additional resources
├── src/                       # Project source code
├── tests/                     # Project tests
└── package.json               # Project dependencies
```

---

## diet103 Integration

### Context Loading

When a project is activated, the orchestrator loads:

1. **Claude.md** - Project-specific instructions
2. **skill-rules.json** - Defines skill activation triggers
3. **skills/** - Available skills for the project
4. **hooks/** - Registered event handlers
5. **commands/** - Slash commands
6. **agents/** - Task handlers

### Token Budget

```
Global Layer:         ~500 tokens
  └─ Orchestration context

Active Project:       Variable
  └─ .claude/Claude.md content
  └─ Loaded skills (lazy)
  └─ Active hooks

Inactive Projects:    0 tokens
  └─ Completely dormant
```

### Skill Activation

Skills follow the PAI (Progressive AI Interaction) pattern:

1. **Main skill file** (<500 lines) - Overview + navigation
2. **Resource files** - Detailed topics
3. **Lazy loading** - Load only when needed
4. **Progressive disclosure** - Start simple, add detail

---

## Security Considerations

### 1. Path Validation
- All paths validated before operations
- No path traversal allowed
- Absolute paths required
- Symlink resolution

### 2. File Permissions
- Check write permissions before creating
- Executable flags for hooks verified
- Read-only operations when possible

### 3. Input Sanitization
- Project names validated (alphanumeric + hyphens)
- Template names whitelist-only
- JSON parsing with error handling
- Shell command escaping

### 4. Destructive Operations
- Confirmation prompts for removal
- `--force` flag required for auto-yes
- Clear warnings for data loss
- Backup recommendations

---

## Performance

### Target Metrics

- **Project Creation:** <2 seconds
- **Context Switching:** <1 second
- **Project Listing:** <100ms
- **Validation:** <1 second

### Optimization Strategies

1. **Context Caching**
   - Cache last 3 active projects
   - LRU (Least Recently Used) eviction
   - Fast resume without re-parsing

2. **Lazy Loading**
   - Skills loaded on-demand
   - Hooks registered but not executed until triggered
   - Resources loaded progressively

3. **Efficient Parsing**
   - Stream large files
   - Cache parsed JSON
   - Minimize file system operations

4. **Parallel Operations**
   - List multiple projects concurrently
   - Validate projects in parallel
   - Async file operations

---

## Extensibility

### Adding New Templates

1. Create directory: `~/.claude/templates/my-template/`
2. Add `.claude/` structure
3. Create template metadata
4. Document template purpose

### Adding New Commands

1. Create file: `~/.claude/lib/commands/my-command.js`
2. Implement command handler
3. Register in main CLI
4. Add tests
5. Update documentation

### Custom Validators

1. Create validator: `~/.claude/lib/utils/my-validator.js`
2. Export validation function
3. Register in validation system
4. Add to validation pipeline

### Plugin System (Future)

Planned architecture for plugins:

```javascript
// ~/.claude/plugins/my-plugin/
{
  name: "my-plugin",
  version: "1.0.0",
  hooks: {
    preSwitch: async (context) => { },
    postSwitch: async (context) => { }
  },
  commands: {
    myCommand: async (args) => { }
  }
}
```

---

## Error Handling

### Error Hierarchy

```
Error (base)
├── ValidationError
│   ├── InvalidStructureError
│   ├── MissingFileError
│   └── InvalidConfigError
├── OperationError
│   ├── ProjectExistsError
│   ├── ProjectNotFoundError
│   └── PermissionDeniedError
└── SystemError
    ├── FileSystemError
    └── NetworkError
```

### Error Recovery

- Graceful degradation
- Clear error messages
- Suggested fixes
- Rollback on failure
- State preservation

---

## Testing Strategy

### Unit Tests
- Command handlers
- Validation functions
- Config operations
- Context management

### Integration Tests
- End-to-end workflows
- Project creation flow
- Context switching
- Template copying

### Scenario Tests
- New user onboarding
- Existing project migration
- Power user workflows
- Error recovery

---

## Future Enhancements

### Planned Features

1. **Auto-detection**
   - Detect Claude projects in filesystem
   - Suggest registration

2. **Project Groups**
   - Organize projects by category
   - Bulk operations

3. **Remote Projects**
   - Sync projects across machines
   - Cloud storage integration

4. **Advanced Caching**
   - Persistent cache
   - Smart invalidation
   - Pre-loading

5. **IDE Integration**
   - VSCode extension
   - Status bar indicator
   - Quick switcher

---

## Related Documentation

- [README](README.md) - Overview
- [Getting Started](GETTING_STARTED.md) - User guide
- [CLI Reference](CLI_REFERENCE.md) - Command details
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues
- [FAQ](FAQ.md) - Questions

---

**Version:** 1.0.0
**Last Updated:** 2025-11-07
**Status:** Production Ready
