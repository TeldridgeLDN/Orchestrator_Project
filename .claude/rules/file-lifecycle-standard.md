---
rule_version: 1.0.0
last_updated: 2025-11-18
authoritative_source: Orchestrator_Project
---

# File Lifecycle Management - Standard Infrastructure Rule

**Priority:** High  
**Applies To:** All diet103 v1.1.0+ projects  
**AI Assistants:** Claude, Cursor, Windsurf, Cline, Roo, and all others

---

## Core Principle

**File Lifecycle Management is NOT optional** - it is standard diet103 infrastructure automatically installed in all projects during registration or initialization (diet103 v1.1.0+).

---

## Why This Matters

### PAI/Diet103 Philosophy

Based on Orchestrator PRD and diet103 specifications:

1. **PAI Core Principle**: "Filesystem-based context management" is fundamental
2. **diet103 Principle**: Infrastructure should be automatic, not manual
3. **Orchestrator Objective**: "Easy Project Creation" means complete scaffolding

**Result**: File Lifecycle aligns with architecture philosophy and should be universally available.

---

## What Gets Installed

Every diet103 project automatically receives:

```
project/
├── .file-manifest.json          ← File classification registry
├── .claude/
│   ├── archive/                 ← Expired ephemeral files
│   └── backups/                 ← File backups
```

### File Tiers (Unified System)

Per [rule-integrity.md](./rule-integrity.md), File Lifecycle uses the unified tier classification:

| Unified Tier | File Lifecycle Term | Treatment |
|--------------|-------------------|-----------|
| **TIER 1: CRITICAL** | CRITICAL | Core config, never auto-move |
| **TIER 2: PERMANENT** | PERMANENT | Keep indefinitely, maintain |
| **TIER 3: TEMPORARY** | EPHEMERAL | Auto-archive after expiration |
| **TIER 4: ARCHIVED** | ARCHIVED | Historical reference |

**Examples:**
- **TIER 1 (CRITICAL)**: `config.json`, `.taskmaster/config.json`, `package.json`, PRDs
- **TIER 2 (PERMANENT)**: `Docs/`, `CLAUDE.md`, `README.md`, source code
- **TIER 3 (TEMPORARY)**: `*COMPLETE.md`, `session*.md`, migration notes
- **TIER 4 (ARCHIVED)**: Expired ephemeral files in `.claude/archive/`

**Note:** TIER 0 (PROHIBITED) is handled by [documentation-economy.md](./documentation-economy.md) - files that should never be created.

---

## Implementation Details

### Automatic Installation

Modified: `lib/utils/diet103-repair.js` (v1.1.0)

```javascript
// Initialize File Lifecycle Management System (NEW: Added in v1.1.0)
try {
  const fileLifecycleResult = await initializeFileLifecycle({
    projectRoot: projectPath,
    verbose: false
  });
  
  if (fileLifecycleResult && fileLifecycleResult.created) {
    result.installed.fileLifecycle = [
      '.file-manifest.json', 
      '.claude/archive/', 
      '.claude/backups/'
    ];
  }
} catch (error) {
  // File lifecycle initialization is non-critical, log but don't fail
  console.warn(`  ! File lifecycle initialization warning: ${error.message}`);
}
```

**Key Points:**
- ✅ Non-blocking: Errors don't prevent registration
- ✅ Idempotent: Safe to run multiple times
- ✅ Silent: No verbose output unless `--verbose` flag
- ✅ Auto-classifies existing files on first run

---

## Expected Behavior

### ✅ DO: Assume File Lifecycle Exists

When working with any diet103 project:

```bash
# File Lifecycle components should exist
.file-manifest.json
.claude/archive/
.claude/backups/
```

### ✅ DO: Use File Lifecycle Information

```bash
# Check file classifications
cat .file-manifest.json | jq '.statistics'

# View specific file tier
cat .file-manifest.json | jq '.files["path/to/file.md"].tier'
```

### ✅ DO: Register Projects Properly

```bash
# New project - file lifecycle auto-installed
diet103 project register

# Existing project - adds file lifecycle if missing
cd /path/to/existing-project
diet103 project register --verbose
```

### ❌ DON'T: Manually Create Manifest

```bash
# ❌ WRONG: Don't manually create
touch .file-manifest.json

# ✅ RIGHT: Let diet103 create it
diet103 project register
```

### ❌ DON'T: Assume It's Optional

File Lifecycle is part of the diet103 v1.1.0 specification, not optional infrastructure.

---

## Verification Steps

### 1. Check Installation

```bash
# Verify manifest exists
ls -la .file-manifest.json

# Expected: File should exist with proper structure
```

### 2. View Statistics

```bash
# Check classification statistics
cat .file-manifest.json | jq '.statistics'

# Expected output:
{
  "total_files": 17,
  "by_tier": {
    "CRITICAL": 5,
    "PERMANENT": 3,
    "EPHEMERAL": 9,
    "ARCHIVED": 0
  }
}
```

### 3. Verify Directories

```bash
# Check archive and backup directories exist
ls -la .claude/archive .claude/backups

# Expected: Both directories should exist
```

---

## Common Scenarios

### Scenario 1: New Project Creation

```bash
# Create and register new project
mkdir my-project && cd my-project
diet103 project register

# Verify file lifecycle installed
ls -la .file-manifest.json  # ✅ Should exist
```

### Scenario 2: Existing Project

```bash
# Navigate to existing project without file lifecycle
cd /path/to/existing-project

# Re-register (non-destructive, adds file lifecycle)
diet103 project register --verbose

# Check installation
ls -la .file-manifest.json  # ✅ Should now exist
```

### Scenario 3: Multiple Projects

```bash
# Register all projects in directory
for project in ~/Projects/*; do
  (cd "$project" && diet103 project register)
done

# Verify all have file lifecycle
for project in ~/Projects/*; do
  if [ -f "$project/.file-manifest.json" ]; then
    echo "✅ $project: File Lifecycle present"
  else
    echo "❌ $project: File Lifecycle missing"
  fi
done
```

---

## Integration with diet103 Repair System

File Lifecycle is integrated into the automatic repair flow:

```
1. Validate diet103 Infrastructure
   ↓
2. Install Critical Components
   (.claude/, hooks/, metadata.json)
   ↓
3. Install Important Directories
   (skills/, commands/, agents/)
   ↓
4. Initialize File Lifecycle ✨
   (.file-manifest.json, archive/, backups/)
   ↓
5. Validate MCP Configuration
   ↓
6. Update Project Registry
```

---

## Troubleshooting

### Issue: No .file-manifest.json After Registration

**Cause:** Registration may have failed or been interrupted

**Solution:**
```bash
# Re-register to trigger installation
diet103 project register --verbose

# Or manually initialize
node /path/to/orchestrator/lib/init/file_lifecycle_init.js
```

### Issue: Files Not Being Classified

**Diagnosis:**
```bash
# Check if manifest exists
ls -la .file-manifest.json

# Check statistics
cat .file-manifest.json | jq '.statistics'
```

**Solution:**
```bash
# Re-register to re-scan
diet103 project register --verbose
```

### Issue: Want to Customize Classification

**Options:**

1. **Edit Classification Patterns** (Code-level)
   - File: `lib/init/file_lifecycle_init.js`
   - Function: `getDefaultFileClassifications()`

2. **Use Frontmatter** (File-level)
   ```markdown
   ---
   file_class: permanent
   tags: [documentation, reference]
   ---
   
   # Your Document
   ```

3. **Future: Project Overrides** (Coming soon)
   - Override via `.claude/file-lifecycle.json`

---

## Documentation References

### Primary Documents

- **[FILE_LIFECYCLE_STANDARD_INFRASTRUCTURE.md](../Docs/FILE_LIFECYCLE_STANDARD_INFRASTRUCTURE.md)** - Complete implementation guide
- **[File_Lifecycle_Management_PRD.md](../Docs/File_Lifecycle_Management_PRD.md)** - Original PRD
- **[FILE_LIFECYCLE_INITIALIZATION.md](../Docs/FILE_LIFECYCLE_INITIALIZATION.md)** - Setup guide

### Code References

- **[diet103-repair.js](../lib/utils/diet103-repair.js)** - Integration point (line 317-330)
- **[file_lifecycle_init.js](../lib/init/file_lifecycle_init.js)** - Initialization logic

---

## Summary

**File Lifecycle Management is standard infrastructure in diet103 v1.1.0+:**

- ✅ Automatically installed during project registration
- ✅ Automatically installed during project initialization  
- ✅ Part of diet103 specification, not optional
- ✅ Consistent with PAI/diet103 philosophy
- ✅ Zero configuration required
- ✅ 100% backward compatible

**When working with diet103 projects, always assume File Lifecycle exists.**

**This applies to all AI coding assistants that follow diet103 conventions.**

---

**Rule Version:** 1.1.0 (Platform-Agnostic)  
**Last Updated:** November 14, 2025  
**Applies To:** All diet103 v1.1.0+ projects  
**Compatible With:** Claude, Cursor, Windsurf, Cline, Roo, and all AI coding assistants

