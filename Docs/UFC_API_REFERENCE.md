# UFC API Reference

**Version:** 1.0.0  
**Last Updated:** 2025-11-12

---

## Overview

This document provides the complete API reference for working with the UFC (Unified Filesystem Context) system programmatically.

---

## Registry Operations

### loadRegistry()

Load the central project registry from disk.

```javascript
import { loadRegistry } from './lib/utils/ufc-registry.js';

const registry = await loadRegistry();
```

**Returns:** `Promise<Registry>`

**Registry Type:**
```typescript
interface Registry {
  version: string;
  updated_at: string;  // ISO 8601
  active_project: string | null;
  projects: Record<string, ProjectMetadata>;
}
```

**Throws:**
- `RegistryCorruptedError` - If registry.json is malformed
- `RegistryNotFoundError` - If registry.json doesn't exist

---

### saveRegistry(registry)

Save registry to disk with atomic write operation.

```javascript
import { saveRegistry } from './lib/utils/ufc-registry.js';

registry.active_project = 'my-project';
await saveRegistry(registry);
```

**Parameters:**
- `registry` (Registry) - Registry object to save

**Returns:** `Promise<void>`

**Throws:**
- `ValidationError` - If registry doesn't match schema
- `FileSystemError` - If write operation fails

**Notes:**
- Uses atomic write (temp file + rename)
- Automatically updates `updated_at` timestamp
- Validates schema before writing

---

### updateRegistry(updateFn)

Safely update registry with automatic locking and validation.

```javascript
import { updateRegistry } from './lib/utils/ufc-registry.js';

await updateRegistry((registry) => {
  registry.projects['new-project'] = {
    name: 'new-project',
    path: '/path/to/project',
    created_at: new Date().toISOString(),
    last_active: new Date().toISOString(),
    last_modified: new Date().toISOString(),
    frequently_used_paths: [],
    quick_access: {},
    cache_status: 'hot'
  };
  
  return registry;
});
```

**Parameters:**
- `updateFn` (Function) - Function that receives registry and returns modified registry

**Returns:** `Promise<Registry>` - Updated registry

**Throws:**
- `RegistryLockedError` - If another operation is in progress
- `ValidationError` - If update function returns invalid registry

**Notes:**
- Automatically handles locking
- Validates before and after update
- Atomic write operation

---

## Project Operations

### addProject(projectData)

Add a new project to the registry.

```javascript
import { addProject } from './lib/utils/ufc-registry.js';

await addProject({
  name: 'my-project',
  path: '/absolute/path/to/project'
});
```

**Parameters:**
```typescript
interface ProjectData {
  name: string;           // Project identifier (unique)
  path: string;           // Absolute filesystem path
  description?: string;   // Optional description
  tags?: string[];       // Optional tags
}
```

**Returns:** `Promise<ProjectMetadata>`

**Throws:**
- `ProjectExistsError` - If project name already exists
- `InvalidPathError` - If path is not absolute or doesn't exist

---

### removeProject(projectName)

Remove a project from the registry.

```javascript
import { removeProject } from './lib/utils/ufc-registry.js';

await removeProject('old-project');
```

**Parameters:**
- `projectName` (string) - Name of project to remove

**Returns:** `Promise<void>`

**Throws:**
- `ProjectNotFoundError` - If project doesn't exist
- `ActiveProjectError` - If trying to remove active project

**Notes:**
- Cannot remove currently active project
- Does NOT delete project files, only removes from registry

---

### getProject(projectName)

Get metadata for a specific project.

```javascript
import { getProject } from './lib/utils/ufc-registry.js';

const project = await getProject('my-project');
console.log(project.last_active);
```

**Parameters:**
- `projectName` (string) - Name of project

**Returns:** `Promise<ProjectMetadata>`

**Throws:**
- `ProjectNotFoundError` - If project doesn't exist

---

### listProjects(options)

List all projects with optional filtering.

```javascript
import { listProjects } from './lib/utils/ufc-registry.js';

// All projects
const all = await listProjects();

// Only hot projects
const hot = await listProjects({ cacheStatus: 'hot' });

// Recently active
const recent = await listProjects({ 
  sortBy: 'last_active', 
  limit: 5 
});
```

**Parameters:**
```typescript
interface ListOptions {
  cacheStatus?: 'hot' | 'cold';  // Filter by cache status
  sortBy?: 'name' | 'last_active' | 'created_at';
  order?: 'asc' | 'desc';
  limit?: number;                 // Max results
}
```

**Returns:** `Promise<ProjectMetadata[]>`

---

## Active Project Management

### getActiveProject()

Get the currently active project.

```javascript
import { getActiveProject } from './lib/utils/ufc-registry.js';

const active = await getActiveProject();
if (active) {
  console.log(`Active: ${active.name}`);
} else {
  console.log('No active project');
}
```

**Returns:** `Promise<ProjectMetadata | null>`

---

### setActiveProject(projectName)

Set the active project and update symlink.

```javascript
import { setActiveProject } from './lib/utils/ufc-registry.js';

await setActiveProject('my-project');
```

**Parameters:**
- `projectName` (string) - Name of project to activate

**Returns:** `Promise<void>`

**Throws:**
- `ProjectNotFoundError` - If project doesn't exist

**Side Effects:**
- Updates `active_project` in registry
- Updates `last_active` timestamp
- Sets new project to `cache_status: 'hot'`
- Sets old project to `cache_status: 'cold'`
- Updates `active-project` symlink atomically

---

## Symlink Management

### updateSymlink(projectName)

Update the active-project symlink to point to specified project.

```javascript
import { updateSymlink } from './lib/utils/ufc-registry.js';

await updateSymlink('my-project');
```

**Parameters:**
- `projectName` (string) - Target project name

**Returns:** `Promise<void>`

**Throws:**
- `ProjectNotFoundError` - If project directory doesn't exist
- `FileSystemError` - If symlink operation fails

**Notes:**
- Uses atomic rename operation
- Creates temp symlink first
- Cleans up on error

---

### validateSymlink()

Verify the active-project symlink is valid and points to correct project.

```javascript
import { validateSymlink } from './lib/utils/ufc-registry.js';

const result = await validateSymlink();

if (!result.valid) {
  console.error('Symlink issue:', result.error);
  
  if (result.canAutoFix) {
    await result.fix();
  }
}
```

**Returns:**
```typescript
interface SymlinkValidation {
  valid: boolean;
  exists: boolean;
  target: string | null;
  pointsToActiveProject: boolean;
  error?: string;
  canAutoFix: boolean;
  fix?: () => Promise<void>;
}
```

---

## Context Loading

### loadProjectContext(projectName, options)

Load project-specific context hierarchically.

```javascript
import { loadProjectContext } from './lib/utils/ufc-context.js';

// Load full project context
const context = await loadProjectContext('my-project');

// Load only metadata
const meta = await loadProjectContext('my-project', {
  metadataOnly: true
});

// Load with cache
const cached = await loadProjectContext('my-project', {
  useCache: true
});
```

**Parameters:**
- `projectName` (string) - Project to load
- `options` (Object) - Loading options

**Options:**
```typescript
interface LoadOptions {
  metadataOnly?: boolean;  // Load only metadata.json
  useCache?: boolean;      // Use cached data if available
  maxAge?: number;        // Max cache age in ms
}
```

**Returns:** `Promise<ProjectContext>`

```typescript
interface ProjectContext {
  metadata: ProjectMetadata;
  cache?: any;
  history?: any;
}
```

---

## Cache Management

### updateCacheStatus(projectName, status)

Manually update a project's cache status.

```javascript
import { updateCacheStatus } from './lib/utils/ufc-registry.js';

await updateCacheStatus('old-project', 'cold');
```

**Parameters:**
- `projectName` (string) - Project name
- `status` ('hot' | 'cold') - New cache status

**Returns:** `Promise<void>`

---

### autoCacheStatus()

Automatically update cache status for all projects based on last_active.

```javascript
import { autoCacheStatus } from './lib/utils/ufc-registry.js';

// Run daily or on schedule
await autoCacheStatus();
```

**Returns:** `Promise<{ updated: string[], unchanged: string[] }>`

**Logic:**
- Projects not accessed in 7 days → 'cold'
- Active project → 'hot'

---

## Frequently Used Paths

### recordFileAccess(projectName, filePath)

Record file access to track frequently used paths.

```javascript
import { recordFileAccess } from './lib/utils/ufc-registry.js';

// After opening a file
await recordFileAccess('my-project', 'src/index.js');
```

**Parameters:**
- `projectName` (string) - Project name
- `filePath` (string) - Relative path to file

**Returns:** `Promise<void>`

**Notes:**
- Automatically manages top 20 most-accessed files
- Updates on every file access
- Uses LRU (Least Recently Used) strategy

---

### getFrequentlyUsedPaths(projectName, limit)

Get most frequently used paths for a project.

```javascript
import { getFrequentlyUsedPaths } from './lib/utils/ufc-registry.js';

const paths = await getFrequentlyUsedPaths('my-project', 10);
// Returns: ['src/index.js', 'README.md', ...]
```

**Parameters:**
- `projectName` (string) - Project name
- `limit` (number) - Max paths to return (default: 20)

**Returns:** `Promise<string[]>`

---

## Quick Access

### setQuickAccess(projectName, key, value)

Set a quick access value for a project.

```javascript
import { setQuickAccess } from './lib/utils/ufc-registry.js';

await setQuickAccess('my-project', 'main_file', 'src/index.js');
await setQuickAccess('my-project', 'test_command', 'npm test');
```

**Parameters:**
- `projectName` (string) - Project name
- `key` (string) - Access key
- `value` (any) - Value (will be JSON stringified)

**Returns:** `Promise<void>`

---

### getQuickAccess(projectName, key)

Get a quick access value for a project.

```javascript
import { getQuickAccess } from './lib/utils/ufc-registry.js';

const mainFile = await getQuickAccess('my-project', 'main_file');
// Returns: 'src/index.js'
```

**Parameters:**
- `projectName` (string) - Project name
- `key` (string) - Access key

**Returns:** `Promise<any | undefined>`

---

### deleteQuickAccess(projectName, key)

Remove a quick access entry.

```javascript
import { deleteQuickAccess } from './lib/utils/ufc-registry.js';

await deleteQuickAccess('my-project', 'old_key');
```

**Parameters:**
- `projectName` (string) - Project name
- `key` (string) - Access key to remove

**Returns:** `Promise<void>`

---

## Validation

### validateRegistry(registry)

Validate registry object against schema.

```javascript
import { validateRegistry } from './lib/utils/ufc-validator.js';

const result = validateRegistry(registry);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

**Parameters:**
- `registry` (Registry) - Registry to validate

**Returns:**
```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
  value: any;
}
```

---

### validateProjectMetadata(metadata)

Validate project metadata against schema.

```javascript
import { validateProjectMetadata } from './lib/utils/ufc-validator.js';

const result = validateProjectMetadata(projectData);
```

**Parameters:**
- `metadata` (ProjectMetadata) - Metadata to validate

**Returns:** `ValidationResult`

---

## Utilities

### ensureUFCStructure()

Ensure UFC directory structure exists.

```javascript
import { ensureUFCStructure } from './lib/utils/ufc-init.js';

await ensureUFCStructure();
```

**Returns:** `Promise<void>`

**Creates:**
- `~/.claude/context/`
- `~/.claude/context/projects/`
- `~/.claude/context/workflows/`
- `~/.claude/context/knowledge/`
- `~/.claude/context/preferences/`
- `~/.claude/context/projects/registry.json` (if missing)

---

### migrateToUFC(projectPath)

Migrate an existing project to UFC structure.

```javascript
import { migrateToUFC } from './lib/utils/ufc-migration.js';

await migrateToUFC('/path/to/existing/project');
```

**Parameters:**
- `projectPath` (string) - Path to project

**Returns:** `Promise<MigrationResult>`

```typescript
interface MigrationResult {
  success: boolean;
  projectName: string;
  changes: string[];
  warnings: string[];
}
```

---

## Error Types

### RegistryError

Base error for registry operations.

```javascript
class RegistryError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'RegistryError';
    this.code = code;
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `REGISTRY_NOT_FOUND` | Registry file doesn't exist |
| `REGISTRY_CORRUPTED` | Registry JSON is malformed |
| `REGISTRY_LOCKED` | Registry is locked by another operation |
| `PROJECT_NOT_FOUND` | Project doesn't exist in registry |
| `PROJECT_EXISTS` | Project name already exists |
| `ACTIVE_PROJECT_ERROR` | Operation not allowed on active project |
| `INVALID_PATH` | Path is invalid or doesn't exist |
| `VALIDATION_ERROR` | Data doesn't match schema |
| `FILESYSTEM_ERROR` | Filesystem operation failed |
| `SYMLINK_ERROR` | Symlink operation failed |

---

## Type Definitions

### Registry

```typescript
interface Registry {
  version: string;
  updated_at: string;
  active_project: string | null;
  projects: Record<string, ProjectMetadata>;
}
```

### ProjectMetadata

```typescript
interface ProjectMetadata {
  name: string;
  path: string;
  created_at: string;
  last_active: string;
  last_modified: string;
  frequently_used_paths: string[];
  quick_access: Record<string, any>;
  cache_status: 'hot' | 'cold';
}
```

---

## Related Documentation

- **[UFC Pattern Guide](UFC_PATTERN_GUIDE.md)** - Overview and concepts
- **[UFC Migration Guide](UFC_MIGRATION_GUIDE.md)** - Migration instructions
- **[Orchestrator PRD](Orchestrator_PRD.md)** - Full specification

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-12 | Initial API reference |


