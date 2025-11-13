# MCP Configuration Testing Guide

**Date:** November 10, 2025  
**Purpose:** Verify MCP fixes are working correctly

---

## Prerequisites

Before testing, ensure:

1. ✅ Both `.cursor/mcp.json` files have been updated
2. ✅ `.env` files exist with real API keys
3. ⏱️ Claude Code has been restarted

---

## Step 1: Restart Claude Code

**CRITICAL:** MCP configurations are only loaded when Claude Code starts.

```bash
# Close Claude Code completely
# Mac: Cmd+Q (not just closing windows!)

# Wait 5 seconds

# Reopen Claude Code in portfolio-redesign
cd /Users/tomeldridge/portfolio-redesign
code .  # or however you launch Claude Code
```

---

## Step 2: Verify MCP Server Loaded

### Check MCP Status

Look for TaskMaster AI tools in your available tools list. You should see tools like:
- `mcp__task_master_ai__get_tasks`
- `mcp__task_master_ai__next_task`
- `mcp__task_master_ai__show_task`

### Quick Test Command

```javascript
// Try listing tasks
await mcp__task_master_ai__get_tasks({
  projectRoot: "/Users/tomeldridge/portfolio-redesign",
  status: "pending"
});
```

**Expected Result:**
```json
{
  "tasks": [
    {
      "id": "1",
      "title": "...",
      "status": "pending"
    }
    // ... more tasks
  ]
}
```

**If you get an error about ANTHROPIC_API_KEY:**
- Check that `.env` file has real key (not placeholder)
- Restart Claude Code again

---

## Step 3: Test Portfolio-Redesign MCP

### Test 1: Get All Tasks

```javascript
const result = await mcp__task_master_ai__get_tasks({
  projectRoot: "/Users/tomeldridge/portfolio-redesign"
});

console.log(`Total tasks: ${result.tasks.length}`);
```

**Expected:** ~86 tasks listed

### Test 2: Get Next Task

```javascript
const next = await mcp__task_master_ai__next_task({
  projectRoot: "/Users/tomeldridge/portfolio-redesign"
});

console.log(`Next task: ${next.id} - ${next.title}`);
```

**Expected:** Returns next available task

### Test 3: Show Specific Task

```javascript
const task = await mcp__task_master_ai__get_task({
  projectRoot: "/Users/tomeldridge/portfolio-redesign",
  id: "1"
});

console.log(task);
```

**Expected:** Detailed task information

---

## Step 4: Test Orchestrator_Project MCP

```bash
# Switch to Orchestrator
cd /Users/tomeldridge/Orchestrator_Project

# Restart Claude Code in this directory
```

### Test Orchestrator Tasks

```javascript
const result = await mcp__task_master_ai__get_tasks({
  projectRoot: "/Users/tomeldridge/Orchestrator_Project"
});

console.log(`Orchestrator tasks: ${result.tasks.length}`);
```

---

## Step 5: Validate MCP Configs

### Run Validator on Portfolio-Redesign

```bash
cd /Users/tomeldridge/Orchestrator_Project

# Validate portfolio-redesign
node -e "
import { validateMcpConfig, formatValidationResult } from './lib/utils/mcp-validator.js';
const result = validateMcpConfig('/Users/tomeldridge/portfolio-redesign');
console.log(formatValidationResult(result));
"
```

**Expected Output:**
```
✅ MCP configuration is valid
```

### Run Validator on Orchestrator

```bash
# Validate Orchestrator itself
node -e "
import { validateMcpConfig, formatValidationResult } from './lib/utils/mcp-validator.js';
const result = validateMcpConfig('/Users/tomeldridge/Orchestrator_Project');
console.log(formatValidationResult(result));
"
```

**Expected Output:**
```
✅ MCP configuration is valid
```

---

## Step 6: Test CLI Command

```bash
cd /Users/tomeldridge/Orchestrator_Project

# If you have the CLI installed globally:
claude validate-mcp /Users/tomeldridge/portfolio-redesign

# Or run directly:
node bin/claude.js validate-mcp /Users/tomeldridge/portfolio-redesign
```

**Expected Output:**
```
🔍 Validating MCP configuration...

Project: /Users/tomeldridge/portfolio-redesign

✅ MCP configuration is valid
```

---

## Step 7: Test Project Registration

### Register a Test Project

```bash
# Create a test directory
mkdir -p /tmp/test-project/.cursor

# Copy a valid MCP config
cp /Users/tomeldridge/portfolio-redesign/.cursor/mcp.json /tmp/test-project/.cursor/

# Try registering it
claude register /tmp/test-project --name test-project
```

**Expected Flow:**
```
🔧 diet103 Project Registration

Step 1: Validating diet103 Infrastructure
  ✓ Infrastructure validated

Step 2: Validating MCP Configuration
  ✓ MCP configuration validated

Step 3: Updating Project Registry
  ✓ Registry updated

✓ Registration Successful!
```

---

## Troubleshooting

### Problem: "MCP: Not available"

**Cause:** MCP server didn't load

**Solutions:**
1. Check `.cursor/mcp.json` syntax: `cat .cursor/mcp.json | jq .`
2. Verify API keys in `.env` file
3. Completely quit and restart Claude Code
4. Check Claude Code logs for MCP errors

### Problem: "Authentication failed"

**Cause:** API key not properly loaded from `.env`

**Solutions:**
1. Verify `.env` file exists and has real keys:
   ```bash
   cat /Users/tomeldridge/portfolio-redesign/.env
   # Should show: ANTHROPIC_API_KEY=sk-ant-api03-...
   ```
2. Check `.env` is NOT gitignored (it should be!)
3. Ensure no trailing spaces or quotes around key values
4. Restart Claude Code after fixing `.env`

### Problem: Validator shows errors after fix

**Cause:** Manual edit broke something

**Solution:**
1. Restore backup: `mv .cursor/mcp.json.backup .cursor/mcp.json`
2. Re-run auto-fix: `claude validate-mcp --fix`
3. Check JSON syntax with `jq`

---

## Success Criteria

✅ All tests must pass:

- [ ] Claude Code loads without MCP errors
- [ ] `mcp__task_master_ai__get_tasks` returns task data
- [ ] Portfolio-Redesign MCP validated successfully
- [ ] Orchestrator_Project MCP validated successfully
- [ ] CLI `validate-mcp` command works
- [ ] Project registration includes MCP validation step

---

## Next Steps After Testing

Once all tests pass:

1. **Delete temporary files:**
   ```bash
   rm /tmp/test-project -rf
   rm /Users/tomeldridge/portfolio-redesign/.cursor/mcp.json.backup
   rm /Users/tomeldridge/portfolio-redesign/.cursor/mcp.json.recommended
   ```

2. **Commit changes:**
   ```bash
   cd /Users/tomeldridge/Orchestrator_Project
   git add lib/utils/mcp-validator.js
   git add lib/commands/validate-mcp.js
   git add lib/commands/register.js
   git add .cursor/mcp.json
   git commit -m "feat: Add MCP configuration validation system"
   
   cd /Users/tomeldridge/portfolio-redesign
   git add .cursor/mcp.json
   git commit -m "fix: Update MCP config to match Orchestrator template"
   ```

3. **Proceed with Vibe Kanban integration** (now that MCP configs are compliant!)

---

**Testing Status:** ⏱️ Awaiting user execution


