# UFC Migration Guide

**Version:** 1.0.0  
**Last Updated:** 2025-11-12  
**Audience:** Developers migrating existing projects to UFC pattern

---

## Overview

This guide walks you through migrating existing Claude-enabled projects to use the UFC (Unified Filesystem Context) pattern. The migration is **non-destructive** and **backward-compatible**.

---

## Pre-Migration Checklist

Before migrating, verify:

- [ ] **Backup your project** (git commit or full backup)
- [ ] **Node.js v18+** installed
- [ ] **Project has `.claude/` directory** (if not, initialize first)
- [ ] **Read UFC Pattern Guide** for understanding
- [ ] **Close all editors** with project open
- [ ] **Stop any running processes** using the project

---

## Migration Methods

Choose the method that best fits your situation:

### Method 1: Automatic Migration (Recommended)

Use the built-in migration tool.

```bash
# From Orchestrator project
cd /path/to/Orchestrator_Project

# Run migration
npm run migrate:ufc -- /path/to/your/project
```

**What it does:**
1. Creates UFC directory structure
2. Registers project in UFC registry
3. Creates project context directory
4. Initializes metadata
5. Sets up symlink (if active project)

**Output:**
```
🔄 Migrating project to UFC pattern...
   
✅ Created UFC structure at ~/.claude/context/
✅ Registered project: my-project
✅ Created context directory: ~/.claude/context/projects/my-project/
✅ Initialized metadata.json
✅ Migration complete!

Summary:
- Project name: my-project
- Path: /path/to/your/project
- Registry entry: Created
- Context directory: Created
- Symlink: Not created (project not active)

Next steps:
1. Activate project: claude project switch my-project
2. Verify: claude project list
```

---

### Method 2: Manual Migration

Step-by-step manual migration for custom needs.

#### Step 1: Create UFC Structure

```bash
# Create directories
mkdir -p ~/.claude/context/{projects,workflows,knowledge,preferences}

# Create empty registry
cat > ~/.claude/context/projects/registry.json << 'EOF'
{
  "version": "1.0.0",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "active_project": null,
  "projects": {}
}
EOF
```

#### Step 2: Register Your Project

Edit `~/.claude/context/projects/registry.json`:

```json
{
  "version": "1.0.0",
  "updated_at": "2025-11-12T18:00:00.000Z",
  "active_project": null,
  "projects": {
    "my-project": {
      "name": "my-project",
      "path": "/absolute/path/to/your/project",
      "created_at": "2025-11-12T18:00:00.000Z",
      "last_active": "2025-11-12T18:00:00.000Z",
      "last_modified": "2025-11-12T18:00:00.000Z",
      "frequently_used_paths": [],
      "quick_access": {},
      "cache_status": "cold"
    }
  }
}
```

#### Step 3: Create Project Context Directory

```bash
PROJECT_NAME="my-project"
mkdir -p ~/.claude/context/projects/$PROJECT_NAME

# Create metadata
cat > ~/.claude/context/projects/$PROJECT_NAME/metadata.json << 'EOF'
{
  "project_name": "my-project",
  "project_path": "/absolute/path/to/your/project",
  "last_sync": "2025-11-12T18:00:00.000Z",
  "file_count": 0,
  "total_size": 0
}
EOF
```

#### Step 4: Create Active Project Symlink (Optional)

```bash
# If this is your active project
ln -sf projects/my-project ~/.claude/context/active-project
```

---

### Method 3: Programmatic Migration

Use the Node.js API for batch migrations.

```javascript
import { migrateToUFC } from './lib/utils/ufc-migration.js';

// Migrate single project
const result = await migrateToUFC('/path/to/project');

if (result.success) {
  console.log(`✅ Migrated: ${result.projectName}`);
  console.log('Changes:', result.changes);
} else {
  console.error('❌ Migration failed:', result.error);
}

// Batch migrate multiple projects
const projects = [
  '/path/to/project1',
  '/path/to/project2',
  '/path/to/project3'
];

for (const projectPath of projects) {
  try {
    await migrateToUFC(projectPath);
    console.log(`✅ ${projectPath}`);
  } catch (error) {
    console.error(`❌ ${projectPath}:`, error.message);
  }
}
```

---

## Post-Migration Validation

### Verify Directory Structure

```bash
# Check UFC directories exist
ls -la ~/.claude/context/

# Should show:
# drwxr-xr-x  projects/
# drwxr-xr-x  workflows/
# drwxr-xr-x  knowledge/
# drwxr-xr-x  preferences/
```

### Verify Registry

```bash
# Check registry exists
cat ~/.claude/context/projects/registry.json | jq '.'

# Verify your project is listed
cat ~/.claude/context/projects/registry.json | jq '.projects | keys'
```

### Verify Project Context

```bash
PROJECT_NAME="my-project"

# Check project context directory
ls -la ~/.claude/context/projects/$PROJECT_NAME/

# Should contain:
# metadata.json
```

### Verify Symlink (if active)

```bash
# Check symlink
ls -la ~/.claude/context/active-project

# Should point to:
# active-project -> projects/my-project
```

### Test Project Switch

```bash
# Try switching to your migrated project
claude project switch my-project

# Verify it's active
claude project list
# Should show active indicator next to my-project
```

---

## Common Migration Scenarios

### Scenario 1: Single Project User

You have one project and want to add UFC support.

```bash
# Migrate your project
npm run migrate:ufc -- /path/to/your/project

# Activate it
claude project switch my-project

# Done! Continue working normally
```

### Scenario 2: Multiple Existing Projects

You have several projects to migrate.

```bash
# Create a migration script
cat > migrate-all.sh << 'EOF'
#!/bin/bash

PROJECTS=(
  "/path/to/project1"
  "/path/to/project2"
  "/path/to/project3"
)

for project in "${PROJECTS[@]}"; do
  echo "Migrating: $project"
  npm run migrate:ufc -- "$project"
  echo ""
done
EOF

chmod +x migrate-all.sh
./migrate-all.sh
```

### Scenario 3: From Old Registry Format

You have projects in old `~/.claude/config.json` format.

```bash
# Use conversion tool
npm run convert:registry
```

This will:
1. Read old `config.json`
2. Create new UFC registry
3. Migrate all project entries
4. Preserve timestamps and metadata
5. Create backup of old config

---

## Rollback Procedure

If you need to roll back the migration:

### Step 1: Backup Current State

```bash
# Backup UFC registry
cp ~/.claude/context/projects/registry.json \
   ~/.claude/context/projects/registry.json.backup
```

### Step 2: Remove UFC Structure

```bash
# Remove UFC directories (WARNING: Destructive)
rm -rf ~/.claude/context/projects/
rm -rf ~/.claude/context/workflows/
rm -rf ~/.claude/context/knowledge/
rm -rf ~/.claude/context/preferences/
```

### Step 3: Restore Old Config

```bash
# If you have a backup
cp ~/.claude/config.json.backup ~/.claude/config.json
```

### Step 4: Restart Claude

```bash
# Restart to clear any cached context
```

---

## Troubleshooting

### Issue: "Project already exists in registry"

**Cause:** Project was already migrated.

**Solution:**
```bash
# Check existing entry
cat ~/.claude/context/projects/registry.json | jq '.projects["my-project"]'

# If you want to re-migrate, remove first
npm run migrate:ufc -- /path/to/project --force
```

---

### Issue: "Registry is corrupted"

**Cause:** Invalid JSON in registry.json.

**Solution:**
```bash
# Validate JSON
cat ~/.claude/context/projects/registry.json | jq '.'

# If invalid, restore from backup or recreate
cat > ~/.claude/context/projects/registry.json << 'EOF'
{
  "version": "1.0.0",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "active_project": null,
  "projects": {}
}
EOF

# Then re-migrate projects
```

---

### Issue: "Symlink points to wrong project"

**Cause:** Symlink was manually modified or corrupted.

**Solution:**
```bash
# Remove symlink
rm ~/.claude/context/active-project

# Recreate (replace my-project with your project name)
ln -sf projects/my-project ~/.claude/context/active-project

# Verify
ls -la ~/.claude/context/active-project
```

---

### Issue: "Permission denied"

**Cause:** Incorrect file permissions.

**Solution:**
```bash
# Fix permissions
chmod -R u+rw ~/.claude/context/
chmod 644 ~/.claude/context/projects/registry.json
```

---

### Issue: "Project not found after migration"

**Cause:** Project path changed or became invalid.

**Solution:**
```bash
# Update path in registry
# Edit ~/.claude/context/projects/registry.json
# Update the "path" field for your project
```

---

## Migration Best Practices

### DO ✅

- **Backup before migrating**
- **Test on one project first**
- **Verify after each migration**
- **Document custom changes**
- **Use the automatic tool** when possible
- **Check file permissions**
- **Validate registry JSON**

### DON'T ❌

- **Don't skip backups**
- **Don't migrate without testing**
- **Don't manually edit registry** (use tools)
- **Don't delete old config** until verified
- **Don't migrate while project is open**
- **Don't ignore warnings**

---

## FAQ

### Q: Will migration break my existing project?

**A:** No. Migration is non-destructive and only adds UFC metadata. Your project files remain unchanged.

### Q: Can I migrate back?

**A:** Yes. Simply remove the UFC directories and restore your old `config.json` backup.

### Q: Do I need to migrate all projects at once?

**A:** No. You can migrate projects incrementally. Non-migrated projects continue working normally.

### Q: What happens to my project's `.claude/` directory?

**A:** It remains unchanged. UFC adds a parallel metadata layer in `~/.claude/context/`.

### Q: Will this affect my team members?

**A:** No. UFC metadata is stored in `~/.claude/`, which is user-specific. Team members' setups are unaffected.

### Q: Can I customize the registry structure?

**A:** The core schema should not be modified, but you can add custom fields to `quick_access`.

---

## Support

### Getting Help

1. **Check documentation:**
   - [UFC Pattern Guide](UFC_PATTERN_GUIDE.md)
   - [UFC API Reference](UFC_API_REFERENCE.md)

2. **Run diagnostics:**
   ```bash
   npm run ufc:diagnose
   ```

3. **Review logs:**
   ```bash
   cat ~/.claude/logs/ufc-migration.log
   ```

4. **File an issue:**
   - Include migration output
   - Include diagnostic results
   - Include registry.json (redact sensitive paths)

---

## Next Steps After Migration

1. **Verify migration:** Run validation checks
2. **Test switching:** Switch between projects
3. **Update workflows:** Adapt any custom scripts
4. **Document changes:** Note any customizations
5. **Train team:** Share UFC guide with team

---

## Related Documentation

- **[UFC Pattern Guide](UFC_PATTERN_GUIDE.md)** - Core concepts
- **[UFC API Reference](UFC_API_REFERENCE.md)** - API documentation
- **[Orchestrator PRD](Orchestrator_PRD.md)** - Full specification

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-12 | Initial migration guide |


