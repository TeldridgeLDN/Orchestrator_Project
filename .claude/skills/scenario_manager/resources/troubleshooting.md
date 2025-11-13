# Scenario Manager - Troubleshooting Guide

← [Back to Overview](../SKILL.md)

---

## Quick Diagnostics

Run these checks first:

```bash
# Check scenarios directory exists
ls ~/.claude/scenarios/

# Check config.json structure
cat ~/.claude/config.json | grep -A 10 "scenarios"

# Validate a scenario
diet103 scenario validate <scenario-name>

# List all scenarios
diet103 scenario list
```

---

## Common Issues

### Issue: Scenario Not Found

**Symptoms:**
```
Scenario 'my-scenario' not found.
```

**Cause:**
- YAML file doesn't exist in `~/.claude/scenarios/`
- File name doesn't match expected format
- Metadata not synchronized

**Solution:**

**Step 1: Check if file exists**
```bash
ls ~/.claude/scenarios/ | grep my-scenario
```

**Step 2: If file exists but not found**
```bash
# Resync metadata
diet103 scenario list --resync
```

**Step 3: If file doesn't exist**
```bash
# Create new scenario
diet103 scenario create my-scenario
```

---

### Issue: Invalid YAML Syntax

**Symptoms:**
```
Scenario 'client-intake' has validation errors:
✗ YAML syntax error at line 15
```

**Cause:**
- Malformed YAML (indentation, quotes, etc.)
- Missing colons or hyphens
- Special characters not escaped

**Solution:**

**Step 1: Identify the error**
```bash
diet103 scenario validate client-intake --verbose
```

**Step 2: Common YAML issues**

| Problem | Fix |
|---------|-----|
| Wrong indentation | Use 2 spaces (not tabs) |
| Missing colon | Add `:` after keys |
| Unquoted special chars | Wrap in quotes: `"value"` |
| List format wrong | Use `- item` format |

**Step 3: Validate syntax online**
- Copy YAML to https://www.yamllint.com/
- Fix reported errors
- Re-validate with diet103

---

### Issue: Circular Dependencies

**Symptoms:**
```
✗ Circular dependency detected: step_1 → step_2 → step_1
```

**Cause:**
- Step A depends on Step B
- Step B depends on Step A
- Chain creates loop

**Solution:**

**Step 1: Visualize dependencies**
```bash
# List all step dependencies
grep "depends_on" ~/.claude/scenarios/my-scenario.yaml
```

**Step 2: Break the cycle**
- Remove one dependency
- Reorder steps logically
- Create intermediate step

**Example Fix:**
```yaml
# BEFORE (circular)
steps:
  - id: step_1
    depends_on: [step_2]
  - id: step_2
    depends_on: [step_1]

# AFTER (fixed)
steps:
  - id: step_1
    depends_on: []
  - id: step_2
    depends_on: [step_1]
```

---

### Issue: Missing Required Fields

**Symptoms:**
```
✗ Missing required field: scenario.name
✗ Missing required field: steps[0].action
```

**Cause:**
- YAML incomplete
- Template not fully customized
- Copy-paste errors

**Solution:**

**Required Fields Checklist:**
```yaml
scenario:
  name: "my-scenario"           # Required
  description: "Description"    # Required
  version: "1.0.0"             # Required

steps:
  - id: "step_1"               # Required
    name: "Step Name"          # Required
    action: "command"          # Required
    component: "skill"         # Required
```

**Validation:**
```bash
diet103 scenario validate my-scenario --check-required
```

---

### Issue: Metadata Out of Sync

**Symptoms:**
```
Warning: Metadata inconsistency detected
Scenario 'my-scenario' marked as scaffolded, but files not found
```

**Cause:**
- Files deleted manually
- Scenario unscaffolded without updating config
- Config.json corrupted

**Solution:**

**Option 1: Re-scaffold**
```bash
diet103 scenario scaffold my-scenario --force
```

**Option 2: Update metadata**
```bash
# Mark as not_scaffolded
diet103 scenario reset my-scenario
```

**Option 3: Remove from registry**
```bash
# If scenario no longer needed
diet103 scenario remove my-scenario
```

---

### Issue: MCP Dependency Not Found

**Symptoms:**
```
⚠ Warning: MCP dependency 'google-forms-mcp' not installed
```

**Cause:**
- MCP server not installed
- MCP not configured in `.mcp.json`
- Typo in MCP name

**Solution:**

**Step 1: Check MCP installation**
```bash
# Check .mcp.json
cat ~/.mcp.json | grep -A 5 "google-forms-mcp"
```

**Step 2: Install MCP if missing**
```bash
# Example installation (varies by MCP)
npm install -g @google/forms-mcp
```

**Step 3: Configure in .mcp.json**
```json
{
  "mcpServers": {
    "google-forms-mcp": {
      "command": "npx",
      "args": ["-y", "@google/forms-mcp"]
    }
  }
}
```

**Step 4: Update scenario**
- If MCP is optional, scenario will still scaffold with warnings
- Generated hook will have placeholder for MCP calls

---

### Issue: Permission Denied

**Symptoms:**
```
Error: EACCES: permission denied, open '~/.claude/scenarios/my-scenario.yaml'
```

**Cause:**
- File permissions restrictive
- Directory not writable
- Ownership issues

**Solution:**

```bash
# Fix file permissions
chmod 644 ~/.claude/scenarios/my-scenario.yaml

# Fix directory permissions
chmod 755 ~/.claude/scenarios/

# Check ownership
ls -la ~/.claude/scenarios/

# Fix ownership if needed
chown $USER ~/.claude/scenarios/my-scenario.yaml
```

---

### Issue: Skill Doesn't Auto-Activate

**Symptoms:**
- Trigger phrases don't activate skill
- Manual invocation works

**Cause:**
- Trigger phrase mismatch
- Hook not configured
- Skill not registered

**Solution:**

**Step 1: Check trigger phrases**
See [Quick Reference](quick-ref.md) for complete trigger list

**Step 2: Verify hook configuration**
```bash
# Check UserPromptSubmit hook
cat ~/.claude/hooks/UserPromptSubmit.js | grep scenario_manager
```

**Step 3: Test specific trigger**
```
Try: "list scenarios" (exact phrase)
```

**Step 4: Check skill registration**
```bash
# Verify skill exists
ls ~/.claude/skills/ | grep scenario_manager
```

---

## Error Messages Reference

### Validation Errors

| Error Code | Message | Solution |
|------------|---------|----------|
| `VAL001` | Missing required field | Add missing field to YAML |
| `VAL002` | Invalid YAML syntax | Fix syntax error |
| `VAL003` | Circular dependency | Break dependency cycle |
| `VAL004` | Invalid step reference | Fix step ID references |
| `VAL005` | Duplicate step ID | Make step IDs unique |

---

### System Errors

| Error Code | Message | Solution |
|------------|---------|----------|
| `SYS001` | File not found | Check file path |
| `SYS002` | Permission denied | Fix file permissions |
| `SYS003` | Config.json corrupt | Restore from backup |
| `SYS004` | Parser error | Update diet103 |

---

## Debugging Techniques

### Enable Verbose Mode

```bash
# Verbose validation
diet103 scenario validate my-scenario --verbose

# Debug scaffolding
diet103 scenario scaffold my-scenario --debug

# Trace execution
diet103 scenario scaffold my-scenario --trace
```

---

### Check Logs

```bash
# View recent logs
tail -f ~/.claude/logs/diet103.log

# Search for errors
grep -i error ~/.claude/logs/diet103.log

# Filter by scenario
grep "my-scenario" ~/.claude/logs/diet103.log
```

---

### Manual Validation Steps

**Step 1: YAML syntax**
```bash
# Use yamllint or online validator
yamllint ~/.claude/scenarios/my-scenario.yaml
```

**Step 2: Required fields**
```bash
# Check key fields exist
grep -E "(name|description|steps)" ~/.claude/scenarios/my-scenario.yaml
```

**Step 3: Dependencies**
```bash
# List all depends_on
grep "depends_on" ~/.claude/scenarios/my-scenario.yaml
```

---

## FAQ

| Question | Answer |
|----------|--------|
| Can I edit scaffolded scenarios? | Edit YAML → unscaffold → re-scaffold |
| How do I back up? | `cp -r ~/.claude/scenarios/ ~/backups/` |
| Multiple versions? | Use suffixes: `client-intake-v1.yaml`, `v2.yaml` |
| Remove completely? | Delete YAML → unscaffold → `list --cleanup` |
| Performance impact? | ~200-300 tokens (metadata), +300 for full scenario |

---

## Known Limitations

| Limitation | Workaround |
|------------|------------|
| No rollback after manual edits | Keep YAML as source, re-scaffold if needed |
| Single version active | Use different names: `client-intake-v1`, `v2` |
| MCP dependencies not validated | Manually verify MCPs before scaffolding |

---

## Getting Help

If you can't resolve your issue:

### 1. Check Documentation
- [Quick Reference](quick-ref.md) - Commands
- [Architecture](architecture.md) - How it works
- [Examples](examples.md) - Usage patterns

### 2. Search Existing Issues
- Check GitHub issues for similar problems
- Review closed issues for solutions

### 3. Enable Debug Mode
```bash
export DEBUG=diet103:*
diet103 scenario scaffold my-scenario
```

### 4. Report Bug

**Include:**
- Scenario YAML (sanitized)
- Error message (full)
- diet103 version: `diet103 --version`
- Node version: `node --version`
- OS: `uname -a` or `ver` (Windows)
- Steps to reproduce

---

## Emergency Procedures

### Complete Reset

⚠️ **Warning:** Erases all scenario metadata

```bash
# Backup first
cp ~/.claude/config.json ~/.claude/config.json.backup

# Remove scenario metadata
# Edit config.json and remove "scenarios" section

# Resync
diet103 scenario list --resync
```

---

### Restore from Backup

```bash
# Restore config.json
cp ~/backups/config-20251111.json ~/.claude/config.json

# Restore scenarios
cp -r ~/backups/scenarios-20251111/* ~/.claude/scenarios/

# Verify
diet103 scenario list
```

---

**Need More Help?**
- [Architecture Guide](architecture.md) - Technical details
- [Examples](examples.md) - Real-world usage
- [Quick Reference](quick-ref.md) - Command syntax

