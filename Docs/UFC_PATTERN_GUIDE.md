# UFC (Unified Filesystem Context) Pattern Guide

**Version:** 1.0.0  
**Last Updated:** 2025-11-12  
**Status:** ✅ ACTIVE

---

## Overview

The **Unified Filesystem Context (UFC)** is PAI's hierarchical directory structure that serves as the system's persistent "brain" for context management. Rather than cramming knowledge into prompts, UFC uses `~/.claude/context/` as a structured filesystem that provides targeted, hierarchical context loading.

### Core Philosophy

**"The filesystem IS the context"** - UFC treats the filesystem as the primary interface for organizing and accessing persistent state, enabling:
- **Hierarchical Loading**: Load only what you need (`context/projects/shopify/` not entire context)
- **Zero-Token Dormancy**: Inactive projects consume zero tokens (stored on disk)
- **Shared Context**: Reduce duplication across agents and skills
- **Persistent Memory**: Filesystem survives restarts and context windows

---

## UFC Directory Structure

### Standard Hierarchy

```
~/.claude/
├── context/
│   ├── projects/               # Project metadata and relationships
│   │   ├── registry.json       # Central project registry (cache)
│   │   ├── {project-name}/     # Individual project context
│   │   │   ├── metadata.json   # Project-specific metadata
│   │   │   ├── cache.json      # Frequently accessed data
│   │   │   └── history.json    # Project activity history
│   │   └── ...
│   │
│   ├── workflows/              # Common workflow templates
│   │   ├── templates/          # Reusable workflow patterns
│   │   └── recipes/            # Common task recipes
│   │
│   ├── knowledge/              # Domain knowledge bases
│   │   ├── coding/             # Programming knowledge
│   │   ├── design/             # Design patterns
│   │   └── operations/         # DevOps knowledge
│   │
│   ├── preferences/            # User preferences and patterns
│   │   ├── editor.json         # Editor preferences
│   │   ├── shortcuts.json      # Custom shortcuts
│   │   └── patterns.json       # Common patterns
│   │
│   └── active-project/         # Symlink to current project
│       -> projects/{current}/
```

### Design Principles

1. **Hierarchical Organization**: Deep trees allow precise targeting
2. **Lazy Loading**: Load only needed subdirectories
3. **Text-Based**: Markdown and JSON (AI-native formats)
4. **Symlink Pattern**: `active-project/` points to current context
5. **Atomic Updates**: Use temp files + atomic moves

---

## Project Registry Schema

### registry.json Structure

**Location:** `~/.claude/context/projects/registry.json`

```json
{
  "version": "1.0.0",
  "updated_at": "2025-11-12T18:00:00.000Z",
  "active_project": "my-project",
  "projects": {
    "my-project": {
      "name": "my-project",
      "path": "/absolute/path/to/project",
      "created_at": "2025-11-10T10:00:00.000Z",
      "last_active": "2025-11-12T18:00:00.000Z",
      "last_modified": "2025-11-12T17:30:00.000Z",
      "frequently_used_paths": [
        "src/main.js",
        "README.md",
        "package.json"
      ],
      "quick_access": {
        "main_file": "src/index.js",
        "test_command": "npm test",
        "docs_url": "https://docs.example.com"
      },
      "cache_status": "hot"
    }
  }
}
```

### Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | ✅ | Schema version (semver) |
| `updated_at` | string | ✅ | ISO 8601 timestamp of last update |
| `active_project` | string \| null | ✅ | Name of currently active project |
| `projects` | object | ✅ | Map of project name → project metadata |

### Project Metadata Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Project identifier (unique) |
| `path` | string | ✅ | Absolute filesystem path |
| `created_at` | string | ✅ | ISO 8601 creation timestamp |
| `last_active` | string | ✅ | ISO 8601 last access timestamp |
| `last_modified` | string | ✅ | ISO 8601 last modification timestamp |
| `frequently_used_paths` | array | ✅ | Array of relative paths (most accessed files) |
| `quick_access` | object | ✅ | Key-value pairs for quick reference data |
| `cache_status` | string | ✅ | "hot" (recently used) or "cold" (inactive) |

---

## Hierarchical Loading Pattern

### Loading Strategy

UFC enables **progressive disclosure** through selective loading:

```javascript
// ❌ BAD: Load entire context
const context = await loadAll('~/.claude/context/');

// ✅ GOOD: Load only what you need
const projectMeta = await loadContext('projects/shopify/metadata.json');
const workflows = await loadContext('workflows/templates/');
```

### Performance Benefits

| Scenario | Full Load | Hierarchical Load | Savings |
|----------|-----------|-------------------|---------|
| Project switch | ~5000 tokens | ~500 tokens | 90% |
| Quick lookup | ~5000 tokens | ~100 tokens | 98% |
| Bulk operation | ~5000 tokens | ~1500 tokens | 70% |

### Implementation Example

```javascript
/**
 * Load project context hierarchically
 * Only loads the specific project subdirectory
 */
async function loadProjectContext(projectName) {
  const projectDir = path.join(
    process.env.HOME,
    '.claude/context/projects',
    projectName
  );
  
  // Load only this project's directory
  const metadata = await fs.readJson(
    path.join(projectDir, 'metadata.json')
  );
  
  return metadata;
}
```

---

## Active Project Symlink

### Symlink Pattern

**Purpose:** Provide constant path to current project without hardcoding project name.

**Location:** `~/.claude/context/active-project/`  
**Target:** `~/.claude/context/projects/{current-project-name}/`

### Usage Example

```javascript
// ❌ BAD: Hardcode project name
const meta = await loadContext('projects/shopify/metadata.json');

// ✅ GOOD: Use symlink
const meta = await loadContext('active-project/metadata.json');
```

### Atomic Updates

**Critical:** Symlink updates must be atomic to prevent race conditions.

```javascript
import fs from 'fs/promises';
import path from 'path';

/**
 * Atomically update active project symlink
 */
async function updateActiveProjectSymlink(projectName) {
  const symlinkPath = path.join(
    process.env.HOME,
    '.claude/context/active-project'
  );
  
  const targetPath = path.join(
    '..',  // Relative to symlink location
    'projects',
    projectName
  );
  
  const tempSymlink = `${symlinkPath}.tmp.${Date.now()}`;
  
  try {
    // Create temp symlink
    await fs.symlink(targetPath, tempSymlink);
    
    // Atomic rename (replaces old symlink)
    await fs.rename(tempSymlink, symlinkPath);
    
  } catch (error) {
    // Cleanup temp symlink on error
    try {
      await fs.unlink(tempSymlink);
    } catch {}
    throw error;
  }
}
```

---

## Integration with Project Switching

### Switch Flow

```
User: "Switch to project X"
    ↓
1. Validate project exists in registry
    ↓
2. Update active_project in registry.json
    ↓
3. Update active-project symlink (atomic)
    ↓
4. Update last_active timestamp
    ↓
5. Mark old project as "cold", new as "hot"
    ↓
6. Trigger context reload
```

### Code Integration Points

```javascript
// In project switching logic
async function switchProject(projectName) {
  // 1. Update registry
  await updateRegistry((registry) => {
    const oldProject = registry.active_project;
    
    // Update cache status
    if (oldProject && registry.projects[oldProject]) {
      registry.projects[oldProject].cache_status = 'cold';
    }
    
    // Set new active project
    registry.active_project = projectName;
    registry.projects[projectName].last_active = new Date().toISOString();
    registry.projects[projectName].cache_status = 'hot';
    registry.updated_at = new Date().toISOString();
    
    return registry;
  });
  
  // 2. Update symlink
  await updateActiveProjectSymlink(projectName);
  
  // 3. Trigger context reload (implementation-specific)
  await reloadContext();
}
```

---

## Cache Status Management

### Hot vs Cold

- **hot**: Recently accessed, likely to be needed again
- **cold**: Inactive, can be safely ignored or archived

### Status Update Rules

1. **On Switch:** New project → hot, old project → cold
2. **On Access:** Project accessed → hot
3. **On Inactivity:** After 7 days → cold (automatic)
4. **On Archive:** Archived projects → removed from registry

### Implementation

```javascript
/**
 * Update cache status based on last_active timestamp
 */
function updateCacheStatus(registry) {
  const now = Date.now();
  const COLD_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  for (const [name, project] of Object.entries(registry.projects)) {
    const lastActive = new Date(project.last_active).getTime();
    const isActive = name === registry.active_project;
    
    if (isActive) {
      project.cache_status = 'hot';
    } else if (now - lastActive > COLD_THRESHOLD) {
      project.cache_status = 'cold';
    }
  }
  
  return registry;
}
```

---

## Frequently Used Paths

### Purpose

Track most-accessed files per project for quick reference and optimization.

### Tracking Strategy

```javascript
/**
 * Track file access and update frequently_used_paths
 */
async function recordFileAccess(projectName, filePath) {
  await updateRegistry((registry) => {
    const project = registry.projects[projectName];
    
    if (!project) return registry;
    
    // Add to frequently used paths
    const paths = project.frequently_used_paths || [];
    
    // Remove if already exists (will re-add at top)
    const filtered = paths.filter(p => p !== filePath);
    
    // Add to front
    filtered.unshift(filePath);
    
    // Keep only top 20
    project.frequently_used_paths = filtered.slice(0, 20);
    
    return registry;
  });
}
```

---

## Quick Access Metadata

### Purpose

Store key-value pairs for instant access to important project information.

### Common Use Cases

```javascript
const quickAccess = {
  // Development
  "main_file": "src/index.js",
  "entry_point": "src/main.ts",
  "test_command": "npm test",
  "dev_command": "npm run dev",
  
  // Documentation
  "docs_url": "https://docs.example.com",
  "readme_path": "README.md",
  
  // Infrastructure
  "deploy_script": "deploy.sh",
  "config_file": ".env.example",
  
  // Custom
  "api_endpoint": "https://api.example.com",
  "database_url": "postgres://localhost/mydb"
};
```

### Updating Quick Access

```javascript
async function setQuickAccess(projectName, key, value) {
  await updateRegistry((registry) => {
    const project = registry.projects[projectName];
    
    if (!project) return registry;
    
    project.quick_access = project.quick_access || {};
    project.quick_access[key] = value;
    project.last_modified = new Date().toISOString();
    
    return registry;
  });
}
```

---

## Best Practices

### DO ✅

- **Use atomic file operations** for registry updates
- **Validate registry schema** before and after updates
- **Update timestamps** on every modification
- **Keep frequently_used_paths** limited (≤20 entries)
- **Use relative paths** in symlinks when possible
- **Handle missing files** gracefully
- **Log all UFC operations** for debugging

### DON'T ❌

- **Don't load entire context** tree unnecessarily
- **Don't hardcode project names** (use symlinks)
- **Don't skip validation** of registry structure
- **Don't forget** to update last_active timestamps
- **Don't store sensitive data** in quick_access
- **Don't create deep nesting** (keep ≤3 levels)
- **Don't modify registry** without atomic operations

---

## Troubleshooting

### Common Issues

#### Broken Symlink

**Symptom:** `active-project/` points to non-existent directory

**Solution:**
```bash
# Check symlink
ls -la ~/.claude/context/active-project

# Fix manually
rm ~/.claude/context/active-project
ln -s projects/my-project ~/.claude/context/active-project
```

#### Corrupted Registry

**Symptom:** registry.json fails to parse

**Solution:**
```bash
# Backup corrupted file
mv ~/.claude/context/projects/registry.json \
   ~/.claude/context/projects/registry.json.backup

# Restore from empty template
cat > ~/.claude/context/projects/registry.json << 'EOF'
{
  "version": "1.0.0",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "active_project": null,
  "projects": {}
}
EOF
```

#### Missing Project Directory

**Symptom:** Project in registry but directory doesn't exist

**Solution:**
```javascript
// Clean up orphaned entries
await cleanupRegistry();
```

---

## Compliance Checklist

Use this checklist to verify UFC pattern compliance:

- [ ] Registry exists at `~/.claude/context/projects/registry.json`
- [ ] Registry follows schema (version, updated_at, active_project, projects)
- [ ] All projects have required metadata fields
- [ ] Timestamps are ISO 8601 format
- [ ] Active project symlink exists and is valid
- [ ] Symlink updates are atomic
- [ ] Hierarchical loading is implemented
- [ ] Only needed subdirectories are loaded
- [ ] Cache status is maintained correctly
- [ ] frequently_used_paths is limited and updated
- [ ] quick_access contains useful metadata
- [ ] File operations use atomic patterns
- [ ] Error handling is implemented
- [ ] Logging captures UFC operations

---

## Related Documentation

- **[UFC API Reference](UFC_API_REFERENCE.md)** - API documentation
- **[UFC Migration Guide](UFC_MIGRATION_GUIDE.md)** - Migration instructions
- **[Orchestrator PRD Section 3.4](Orchestrator_PRD.md#34-pai-ufc-unified-filesystem-context---global-layer)** - UFC specification
- **[Project Registry Requirements](Orchestrator_PRD.md#42-global-claudemd)** - Registry requirements

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-12 | Initial UFC pattern guide |


