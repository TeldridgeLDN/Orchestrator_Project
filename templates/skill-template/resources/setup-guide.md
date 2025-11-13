# [Skill Name] - Setup Guide

<!-- 
TEMPLATE INSTRUCTIONS:
- Keep this file under 500 lines
- Step-by-step, tutorial style
- Assume minimal prior knowledge
- Include verification steps
- Delete these comment blocks when done
-->

← [Back to Overview](../SKILL.md)

---

## Prerequisites

Before setting up [Skill Name], ensure you have:

### Required
- **[Requirement 1]:** [Version or specification]
  - Verify: `[command to check]`
  - Install: `[installation command]`
  
- **[Requirement 2]:** [Version or specification]
  - Verify: `[command to check]`
  - Install: `[installation command]`

### Optional
- **[Optional Requirement 1]:** [Purpose]
  - Install: `[installation command]`

---

## Installation

### Step 1: [Installation Step Name]

**Purpose:** [Why this step is needed]

```bash
# [Explanation of command]
[installation command 1]
```

**Expected Output:**
```
[what user should see]
```

**Troubleshooting:**
- If you see `[error]`, try: `[solution]`
- If `[problem]` occurs, check: `[diagnostic]`

---

### Step 2: [Installation Step Name]

**Purpose:** [Why this step is needed]

```bash
# [Explanation of command]
[installation command 2]
```

**Expected Output:**
```
[what user should see]
```

---

### Step 3: [Installation Step Name]

**Purpose:** [Why this step is needed]

```bash
# [Explanation of command]
[installation command 3]
```

---

## Configuration

### Basic Configuration

#### 1. Create Configuration File

```bash
# Create config in default location
[command to create config]
```

**Example Configuration:**
```[yaml|json|toml]
[key1]: [value1]
[key2]: [value2]
[key3]:
  [subkey1]: [value]
  [subkey2]: [value]
```

#### 2. Set Required Parameters

**Parameter: `[parameter-name]`**
- **Purpose:** [What this configures]
- **Type:** [string|number|boolean|array]
- **Default:** `[default-value]`
- **Required:** Yes/No

**Example:**
```[format]
[parameter-name]: [example-value]
```

---

### Advanced Configuration

#### Custom Options

**Option: `[option-name]`**
```[format]
[option-name]:
  [sub-option1]: [value]
  [sub-option2]: [value]
```

**Use Case:** [When you'd use this option]

---

#### Environment-Specific Settings

**Development:**
```[format]
[env-specific-config for dev]
```

**Production:**
```[format]
[env-specific-config for prod]
```

---

### Configuration File Locations

The skill searches for configuration files in this order:

1. `[path1]` - Command-line specified
2. `[path2]` - Current directory
3. `[path3]` - User home directory
4. `[path4]` - System-wide

**Override Priority:** Earlier paths override later ones

---

## Verification

### Test Basic Functionality

```bash
# Run basic test
[test command]
```

**Expected Output:**
```
[successful output]
```

✅ **Success Indicator:** [What indicates success]  
❌ **Failure Indicator:** [What indicates failure]

---

### Test Advanced Features

```bash
# Test feature 1
[test command 1]

# Test feature 2
[test command 2]
```

---

### Verify Installation Checklist

- [ ] Prerequisites installed and verified
- [ ] Main package installed successfully
- [ ] Configuration file created and valid
- [ ] Required parameters set
- [ ] Basic functionality test passed
- [ ] Advanced features accessible
- [ ] No error messages in logs

---

## Post-Installation

### Recommended Next Steps

1. **[Next Step 1]**
   - Purpose: [Why recommended]
   - How: `[command or process]`

2. **[Next Step 2]**
   - Purpose: [Why recommended]
   - How: `[command or process]`

3. **[Next Step 3]**
   - Purpose: [Why recommended]
   - How: `[command or process]`

---

### Integration with Other Skills

**[Related Skill 1]:**
- Setup: [Brief integration steps]
- Benefit: [What this enables]

**[Related Skill 2]:**
- Setup: [Brief integration steps]
- Benefit: [What this enables]

---

## Upgrade Instructions

### Upgrading from [Version] to [Version]

```bash
# Backup current configuration
[backup command]

# Perform upgrade
[upgrade command]

# Migrate configuration if needed
[migration command]
```

**Breaking Changes:**
- [Change 1]: [How to adapt]
- [Change 2]: [How to adapt]

---

## Uninstallation

If you need to remove [Skill Name]:

```bash
# Remove package
[uninstall command]

# Clean up configuration
[cleanup command]

# Remove data (optional)
[data removal command]
```

**Warning:** [Any warnings about data loss or irreversible actions]

---

## Common Setup Issues

### Issue: [Problem Description]

**Symptoms:**
- [Symptom 1]
- [Symptom 2]

**Cause:** [Why this happens]

**Solution:**
```bash
[fix command]
```

---

### Issue: [Problem Description]

**Symptoms:**
- [Symptom 1]
- [Symptom 2]

**Cause:** [Why this happens]

**Solution:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

---

## Getting Help

- **Documentation:** [Link to full docs]
- **Issues:** [Link to issue tracker]
- **Community:** [Link to community forum/chat]
- **Troubleshooting:** [Link to troubleshooting guide](troubleshooting.md)

---

**Related Resources:**
- [Quick Reference](quick-ref.md) - Command syntax
- [API Reference](api-reference.md) - Technical details
- [Troubleshooting](troubleshooting.md) - Common issues

