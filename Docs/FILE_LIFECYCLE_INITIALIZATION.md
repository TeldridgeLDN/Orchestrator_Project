# File Lifecycle Initialization System

## Overview

The Orchestrator project now includes **automatic file lifecycle management** that initializes on every project startup. This ensures all files are properly classified, tracked, and managed according to their importance and retention requirements.

## Features

✅ **Automatic Initialization** - Runs on `npm install` or `npm run init`  
✅ **Smart Classification** - Pre-classifies common files with appropriate tiers  
✅ **Non-Destructive** - Never overwrites existing manifests, only updates  
✅ **Zero Configuration** - Works out of the box with sensible defaults  
✅ **Extensible** - Easy to customize classification patterns

---

## File Tiers

### CRITICAL 🔴
**Never deleted, always protected**

Examples:
- `.taskmaster/config.json`
- `.taskmaster/state.json`
- `lib/schemas/scenario-schema.json`
- `package.json`
- `.env`
- `.mcp.json`

**Characteristics:**
- Essential for system operation
- Required for configuration
- Sensitive information
- Schemas and contracts

### PERMANENT 📘
**Long-term storage, historical value**

Examples:
- `SESSION_SUMMARY_*.md`
- `TASK_*_COMPLETION_SUMMARY.md`
- `Docs/**/*.md`
- `README.md`
- `CLAUDE.md`
- `Changelog.md`

**Characteristics:**
- Documentation and summaries
- Historical records
- Implementation guides
- Task completions
- Never subject to cleanup

### EPHEMERAL ⚡
**Short-lived, cleaned up after retention period**

Examples:
- `.taskmaster/reports/**/*.json`
- `tests/fixtures/**/*.yaml`
- `*.log`
- `.context-state.json`
- `__pycache__/**`
- `node_modules/**`

**Characteristics:**
- Temporary outputs
- Cache files
- Test fixtures
- Log files
- Default retention: 60 days

### ARCHIVED 📦
**Moved to archive, extended retention**

Examples:
- Old session summaries (moved manually)
- Deprecated implementations
- Historical test results

**Characteristics:**
- No longer actively used
- Preserved for reference
- Default retention: 90 days
- Moved to `.claude/archive/`

---

## How It Works

### Startup Sequence

1. **Project Detection**
   - Verifies orchestrator project structure
   - Checks for `.taskmaster/`, `lib/`, `Docs/`, `package.json`

2. **Directory Setup**
   - Creates `.claude/` if missing
   - Creates `.claude/archive/` for archived files
   - Creates `.claude/backups/` for cleanup backups

3. **Manifest Creation**
   - Creates `.file-manifest.json` if doesn't exist
   - Loads existing manifest if present

4. **File Scanning**
   - Recursively scans project directory
   - Skips `.git`, `node_modules`, `__pycache__`, etc.
   - Matches files against classification patterns

5. **Auto-Classification**
   - Applies tier based on file path patterns
   - Records file metadata (size, dates, etc.)
   - Marks CRITICAL files as protected

6. **Statistics**
   - Updates total file counts
   - Counts files by tier
   - Saves manifest to disk

### Running Initialization

#### Automatic (on npm install)
```bash
npm install
```

#### Manual
```bash
npm run init
```

#### Silent Mode (no output)
```bash
npm run init:silent
```

#### Programmatic
```javascript
import runStartupHooks from './lib/init/startup_hooks.js';

const result = await runStartupHooks({
  projectRoot: '/path/to/project',
  silent: false
});
```

---

## Customization

### Adding Custom Patterns

Edit `lib/init/file_lifecycle_init.js` and modify the `getDefaultFileClassifications()` function:

```javascript
function getDefaultFileClassifications(projectRoot) {
  return {
    "CRITICAL": [
      ".taskmaster/config.json",
      "my-custom-critical-file.json"
    ],
    "PERMANENT": [
      "SESSION_SUMMARY_*.md",
      "my-project-docs/**/*.md"
    ],
    "EPHEMERAL": [
      "*.log",
      "temp/**/*"
    ]
  };
}
```

### Glob Pattern Syntax

- `*` - Matches any characters except `/`
- `**` - Matches any characters including `/` (recursive)
- `*.md` - All markdown files
- `Docs/**/*.md` - All markdown files in Docs and subdirectories
- `SESSION_SUMMARY_*.md` - Files matching pattern

---

## Manifest Structure

### Location
`.file-manifest.json` (project root)

### Format
```json
{
  "$schema": "https://claude.ai/schemas/file-manifest-v1.json",
  "version": "1.0",
  "project": "Orchestrator_Project",
  "initialized": "2025-11-10T10:17:46.089Z",
  "last_updated": "2025-11-10T10:17:46.098Z",
  "statistics": {
    "total_files": 13,
    "by_tier": {
      "CRITICAL": 7,
      "PERMANENT": 5,
      "EPHEMERAL": 1,
      "ARCHIVED": 0
    }
  },
  "files": {
    "SESSION_SUMMARY_2025-11-10.md": {
      "tier": "PERMANENT",
      "status": "active",
      "created": "2025-11-10T10:08:43.369Z",
      "modified": "2025-11-10T10:16:47.080Z",
      "added_to_manifest": "2025-11-10T10:17:46.096Z",
      "protected": false,
      "size_bytes": 18338,
      "notes": "Auto-classified on initialization"
    }
  },
  "settings": {
    "ephemeral_expiration_days": 60,
    "archive_retention_days": 90,
    "auto_organize": false,
    "confidence_threshold": 0.80
  }
}
```

---

## Integration with Cleanup Workflow

The file lifecycle initialization system integrates seamlessly with the cleanup workflow from Task 19:

### Cleanup Command
```bash
# Preview what would be deleted
node cli.js cleanup --dry-run

# Execute cleanup (backs up first)
node cli.js cleanup --force

# Custom retention
node cli.js cleanup --force --retention-days 180
```

### Protection Rules

1. **CRITICAL files are NEVER deleted**
   - Even if archived
   - Even if exceeding retention
   - `protected: true` flag enforced

2. **PERMANENT files are NEVER deleted**
   - Historical value preserved
   - No automatic archiving

3. **EPHEMERAL files are deleted after 60 days**
   - Unless moved to archive
   - Can be overridden per file

4. **ARCHIVED files are deleted after 90 days**
   - Backed up before deletion
   - Can be recovered from `.claude/backups/`

---

## Verification

### Check Manifest Exists
```bash
ls -la .file-manifest.json
```

### View File Classifications
```bash
cat .file-manifest.json | jq '.files'
```

### View Statistics
```bash
cat .file-manifest.json | jq '.statistics'
```

### Check Specific File
```bash
cat .file-manifest.json | jq '.files["SESSION_SUMMARY_2025-11-10.md"]'
```

---

## Troubleshooting

### Manifest Not Created

**Problem:** `.file-manifest.json` doesn't exist after `npm install`

**Solution:**
```bash
npm run init
```

### Wrong File Classification

**Problem:** File is classified with wrong tier

**Solution:** Edit `.file-manifest.json` directly or update patterns in `lib/init/file_lifecycle_init.js`

### Re-initialization Needed

**Problem:** Need to re-scan project

**Solution:**
```bash
# Backup existing manifest
cp .file-manifest.json .file-manifest.backup.json

# Delete manifest
rm .file-manifest.json

# Re-initialize
npm run init
```

### Startup Hook Not Running

**Problem:** Hook doesn't run on `npm install`

**Solution:** Check `package.json` has `postinstall` script:
```json
{
  "scripts": {
    "postinstall": "node lib/init/startup_hooks.js"
  }
}
```

---

## Future Enhancements

Planned features:
- [ ] Automatic archiving based on age
- [ ] Periodic cleanup scheduling
- [ ] Integration with git hooks
- [ ] Machine learning for classification suggestions
- [ ] Dashboard for file lifecycle visualization
- [ ] Email notifications for cleanup actions
- [ ] Cloud backup integration

---

## Related Documentation

- [Task 19 Completion Summary](../TASK_19_COMPLETION_SUMMARY.md)
- [File Lifecycle Management PRD](./File_Lifecycle_Management_PRD.md)
- [Cleanup Workflow Guide](../portfolio-redesign/.claude/skills/file_lifecycle_manager/CLEANUP_WORKFLOW.md)

---

## Summary

✅ **Automatic** - Initializes on startup  
✅ **Smart** - Pre-classifies common files  
✅ **Safe** - Protects CRITICAL files  
✅ **Tracked** - Full audit trail  
✅ **Extensible** - Easy to customize  

**Your session summary is now properly classified as PERMANENT! 🎉**

