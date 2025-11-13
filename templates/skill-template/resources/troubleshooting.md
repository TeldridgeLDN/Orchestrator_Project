# [Skill Name] - Troubleshooting Guide

<!-- 
TEMPLATE INSTRUCTIONS:
- Keep this file under 500 lines
- Problem-solution format
- Include error messages and symptoms
- Add diagnostic steps
- Delete these comment blocks when done
-->

← [Back to Overview](../SKILL.md)

---

## Quick Diagnostics

Run these checks first to identify common issues:

```bash
# Check installation
[diagnostic command 1]

# Verify configuration
[diagnostic command 2]

# Test connectivity/functionality
[diagnostic command 3]
```

---

## Common Issues

### Issue: [Error Message or Problem Description]

**Symptoms:**
- [Symptom 1]
- [Symptom 2]
- [Symptom 3]

**Cause:**
[Explanation of why this happens]

**Solution:**

1. **Step 1: [Action]**
   ```bash
   [command or action]
   ```
   
2. **Step 2: [Action]**
   ```bash
   [command or action]
   ```
   
3. **Step 3: [Verification]**
   ```bash
   [verification command]
   ```

**Expected Result:**
```
[what success looks like]
```

**If Still Not Working:**
- Check: [Additional diagnostic]
- Try: [Alternative solution]
- See: [Link to related issue or documentation]

---

### Issue: [Error Message or Problem Description]

**Symptoms:**
```
Error: [actual error message]
```

**Cause:**
[Why this error occurs]

**Quick Fix:**
```bash
[one-line fix if applicable]
```

**Detailed Solution:**

**Option A: [Solution approach]**
```bash
[commands for option A]
```

**Option B: [Alternative approach]**
```bash
[commands for option B]
```

**Prevention:**
- [How to avoid this issue in the future]

---

### Issue: [Performance Problem]

**Symptoms:**
- Slow execution
- High resource usage
- Timeouts

**Cause:**
[Performance bottleneck explanation]

**Solution:**

**Immediate Fix:**
```bash
# Temporary workaround
[quick fix command]
```

**Long-term Fix:**
1. [Optimization step 1]
2. [Optimization step 2]
3. [Configuration change]

**Monitoring:**
```bash
# Check performance metrics
[monitoring command]
```

---

### Issue: Configuration Not Loading

**Symptoms:**
- Default values used instead of custom config
- "Config not found" warnings
- Settings not applied

**Diagnostic Steps:**

1. **Check config file location:**
   ```bash
   # Find config file
   [find command]
   ```

2. **Validate config syntax:**
   ```bash
   # Validate config
   [validation command]
   ```

3. **Check permissions:**
   ```bash
   # Check file permissions
   ls -la [config-path]
   ```

**Common Causes & Fixes:**

| Cause | Fix |
|-------|-----|
| Wrong file path | Move config to: `[correct-path]` |
| Invalid syntax | Validate with: `[validator]` |
| Permission denied | Run: `chmod 644 [config-path]` |
| File encoding | Ensure UTF-8 encoding |

---

### Issue: Dependency Conflicts

**Symptoms:**
```
Error: Cannot find module '[module-name]'
Error: Version conflict detected
```

**Solution:**

**Check Dependencies:**
```bash
# List installed dependencies
[list command]

# Check for conflicts
[conflict-check command]
```

**Resolve Conflicts:**

1. **Update dependencies:**
   ```bash
   [update command]
   ```

2. **Clear cache:**
   ```bash
   [cache-clear command]
   ```

3. **Reinstall:**
   ```bash
   [reinstall command]
   ```

---

## Error Messages Reference

### Error Codes

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| `ERR_001` | `[error message]` | [Cause] | [Quick fix] |
| `ERR_002` | `[error message]` | [Cause] | [Quick fix] |
| `ERR_003` | `[error message]` | [Cause] | [Quick fix] |
| `ERR_999` | `[error message]` | [Cause] | [Quick fix] |

### Warning Messages

| Warning | Meaning | Action Needed |
|---------|---------|---------------|
| `[warning text]` | [Explanation] | [Response] |
| `[warning text]` | [Explanation] | [Response] |

---

## Platform-Specific Issues

### Platform Differences

| Platform | Common Issue | Solution |
|----------|--------------|----------|
| macOS | [Issue] | `[fix command]` |
| Linux | [Issue] | `[fix command]` |
| Windows | [Issue] | `[fix command]` |

---

## Integration Issues

### Issue: Conflicts with [Other Skill/Tool]

**Symptoms:**
- [Conflict symptom 1]
- [Conflict symptom 2]

**Cause:**
[Why the conflict occurs]

**Solution:**

**Option 1: Configure [Skill Name]**
```bash
[configuration to avoid conflict]
```

**Option 2: Configure [Other Tool]**
```bash
[alternative configuration]
```

**Verification:**
```bash
# Test both tools work together
[test command]
```

---

## Debugging Techniques

### Enable Debug Mode

```bash
# Enable verbose logging
[command with debug flag]

# Set log level
[log level command]

# Output to file
[logging to file command]
```

---

### Collect Diagnostic Information

```bash
# System information
[system info command]

# Configuration dump
[config dump command]

# Recent logs
[log command]
```

**Share this when reporting issues:**
```bash
# Generate diagnostic report
[diagnostic report command]
```

---

### Step-by-Step Debugging

1. **Isolate the problem:**
   ```bash
   # Test minimal case
   [minimal test command]
   ```

2. **Check intermediate results:**
   ```bash
   # Inspect state
   [inspection command]
   ```

3. **Compare with working case:**
   ```bash
   # Run comparison
   [comparison command]
   ```

---

## FAQ

| Question | Answer |
|----------|--------|
| [Common question]? | [Answer]. Example: `[command]` |
| How do I [task]? | [Brief answer with steps] |
| Why is [operation] slow? | [Explanation and optimization tip] |
| Where is config file? | Check: `[path1]`, `[path2]`, `[path3]` |
| Recommended settings for [use case]? | [Brief config example] |

---

## Known Issues

### Issue: [Known limitation or bug]

**Status:** [In Progress / Planned Fix / Workaround Available]

**Affects:** [Versions or conditions]

**Workaround:**
```bash
[workaround if available]
```

**Tracking:** [Issue #123 or link]

---

### Issue: [Known limitation]

**Status:** By Design / Won't Fix

**Explanation:** [Why this is the case]

**Alternative:** [How to accomplish the goal differently]

---

## Getting Help

If you can't resolve your issue:

### 1. Check Documentation
- [Quick Reference](quick-ref.md)
- [Setup Guide](setup-guide.md)
- [API Reference](api-reference.md)

### 2. Search Existing Issues
- [Issue Tracker URL]
- Search keywords: [suggested search terms]

### 3. Community Support
- [Forum/Chat URL]
- [Community guidelines]

### 4. Report a Bug

**Before reporting:**
- [ ] Checked this troubleshooting guide
- [ ] Searched existing issues
- [ ] Collected diagnostic information
- [ ] Created minimal reproduction case

**Report template:**
```markdown
**Environment:**
- OS: [e.g., macOS 13.0]
- Version: [skill version]
- Related tools: [other tool versions]

**Problem:**
[Clear description]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Error occurs]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Diagnostic Info:**
[Output from diagnostic commands]

**Additional Context:**
[Any other relevant information]
```

---

## Emergency Procedures

### Complete Reset

⚠️ **Warning:** This will erase all configuration and data

```bash
# Backup first
[backup command]

# Complete reset
[reset command]

# Reinstall
[reinstall command]
```

---

### Rollback to Previous Version

```bash
# Check current version
[version check command]

# Install specific version
[version install command]

# Verify rollback
[verification command]
```

---

**Need More Help?**
- [Setup Guide](setup-guide.md) - Reinstall or reconfigure
- [API Reference](api-reference.md) - Technical details
- [Community Forum](#) - Ask the community
- [Issue Tracker](#) - Report bugs

