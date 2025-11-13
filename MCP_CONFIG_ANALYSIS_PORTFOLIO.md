# MCP Configuration Analysis: Portfolio-Redesign

**Date:** November 10, 2025  
**Reviewed By:** Orchestrator AI  
**Purpose:** Assess portfolio-redesign MCP config compliance with Orchestrator template standards

---

## Executive Summary

**Status:** ❌ **NON-COMPLIANT** (4 major issues identified)

**Risk Level:** 🟡 **MEDIUM** (Config works but doesn't follow best practices)

**Action Required:** Update `.cursor/mcp.json` to match Orchestrator template standards

---

## Current Configuration Review

### Portfolio-Redesign `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "ANTHROPIC_API_KEY_HERE",
        "PERPLEXITY_API_KEY": "PERPLEXITY_API_KEY_HERE",
        "OPENAI_API_KEY": "OPENAI_API_KEY_HERE",
        "GOOGLE_API_KEY": "GOOGLE_API_KEY_HERE",
        "XAI_API_KEY": "XAI_API_KEY_HERE",
        "OPENROUTER_API_KEY": "OPENROUTER_API_KEY_HERE",
        "MISTRAL_API_KEY": "MISTRAL_API_KEY_HERE",
        "AZURE_OPENAI_API_KEY": "AZURE_OPENAI_API_KEY_HERE",
        "OLLAMA_API_KEY": "OLLAMA_API_KEY_HERE"
      }
    }
  }
}
```

---

## Compliance Analysis

### ❌ Issue 1: Missing `type` Field

**Location:** `mcpServers.task-master-ai.type`

**Current State:**
```json
{
  "task-master-ai": {
    "command": "npx"  // ❌ No type specified
  }
}
```

**Orchestrator Standard:**
```json
{
  "task-master-ai": {
    "type": "stdio",  // ✅ Explicit communication protocol
    "command": "npx"
  }
}
```

**Impact:**
- Relies on implicit default (stdio)
- Not explicit about communication protocol
- May cause issues with future MCP versions
- Vibe Kanban may not recognize properly

**Fix Required:** ✅ Add `"type": "stdio"`

---

### ❌ Issue 2: Overly Complex Args Array

**Location:** `mcpServers.task-master-ai.args`

**Current State:**
```json
"args": ["-y", "--package=task-master-ai", "task-master-ai"]
```

**Problems:**
1. Redundant `--package=` flag
2. Duplicate package name specification
3. More complex than necessary

**Orchestrator Standard:**
```json
"args": ["-y", "task-master-ai"]
```

**Why Standard Is Better:**
- Cleaner, more maintainable
- Follows `npx` best practices
- Less prone to typos
- Consistent with Orchestrator template

**Fix Required:** ✅ Simplify to `["-y", "task-master-ai"]`

---

### 🔴 Issue 3: Hardcoded API Key Placeholders (CRITICAL)

**Location:** `mcpServers.task-master-ai.env`

**Current State:**
```json
"env": {
  "ANTHROPIC_API_KEY": "ANTHROPIC_API_KEY_HERE",
  "PERPLEXITY_API_KEY": "PERPLEXITY_API_KEY_HERE"
}
```

**CRITICAL PROBLEM:**
These are **literal strings**, not environment variable references!

**What This Means:**
- ❌ MCP receives the string `"ANTHROPIC_API_KEY_HERE"` as the actual key
- ❌ API calls **will fail** because the key is invalid
- ❌ No connection to `.env` file
- ❌ Secrets potentially exposed in version control

**Orchestrator Standard:**
```json
"env": {
  "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
  "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}"
}
```

**How It Works:**
1. ✅ MCP runtime reads `.env` file
2. ✅ Substitutes `${VAR_NAME}` with actual value from `.env`
3. ✅ Keeps secrets secure and out of `.mcp.json`
4. ✅ Supports per-environment configuration

**Fix Required:** ✅ Use `${VAR_NAME}` syntax for all API keys

---

### ❌ Issue 4: Missing Metadata

**Location:** `mcpServers.task-master-ai.metadata`

**Current State:**
```json
{
  "task-master-ai": {
    "command": "npx"
    // ❌ No metadata field at all
  }
}
```

**Orchestrator Standard:**
```json
{
  "task-master-ai": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "task-master-ai"],
    "env": { /* ... */ },
    "metadata": {
      "generatedFrom": "portfolio-redesign-project",
      "generatedAt": "2025-11-10T12:00:00Z",
      "description": "TaskMaster AI MCP for portfolio redesign",
      "project": "portfolio-redesign",
      "version": "1.0.0"
    }
  }
}
```

**Benefits of Metadata:**
- 📋 **Traceability:** Know when and why config was created
- 🏷️ **Organization:** Easier to manage multiple projects
- 🐛 **Debugging:** Context for troubleshooting
- 🔧 **Maintenance:** Track config versions over time
- 📊 **Vibe Kanban:** Better project categorization

**Fix Required:** ✅ Add metadata object with project info

---

## Recommended Configuration

**File:** `.cursor/mcp.json` (corrected version saved as `.cursor/mcp.json.recommended`)

```json
{
  "mcpServers": {
    "task-master-ai": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
        "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}",
        "OPENAI_API_KEY": "${OPENAI_API_KEY}",
        "GOOGLE_API_KEY": "${GOOGLE_API_KEY}",
        "XAI_API_KEY": "${XAI_API_KEY}",
        "OPENROUTER_API_KEY": "${OPENROUTER_API_KEY}",
        "MISTRAL_API_KEY": "${MISTRAL_API_KEY}",
        "AZURE_OPENAI_API_KEY": "${AZURE_OPENAI_API_KEY}",
        "OLLAMA_API_KEY": "${OLLAMA_API_KEY}"
      },
      "metadata": {
        "generatedFrom": "portfolio-redesign-project",
        "generatedAt": "2025-11-10T12:00:00Z",
        "description": "TaskMaster AI MCP for portfolio redesign task management",
        "project": "portfolio-redesign",
        "version": "1.0.0",
        "tags": ["landing-page", "reddit-campaign", "case-study"]
      }
    }
  }
}
```

---

## Required `.env` File

**File:** `.env` (in portfolio-redesign root, gitignored)

```bash
# TaskMaster AI - Required API Keys
# Add your actual keys here (never commit this file!)

# Primary AI Model (Required)
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_ACTUAL_KEY_HERE

# Research Model (Highly Recommended)
PERPLEXITY_API_KEY=pplx-YOUR_ACTUAL_KEY_HERE

# Alternative Models (Optional)
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY
GOOGLE_API_KEY=YOUR_GOOGLE_KEY
XAI_API_KEY=YOUR_XAI_KEY
OPENROUTER_API_KEY=YOUR_OPENROUTER_KEY
MISTRAL_API_KEY=YOUR_MISTRAL_KEY
AZURE_OPENAI_API_KEY=YOUR_AZURE_KEY
OLLAMA_API_KEY=YOUR_OLLAMA_KEY

# Note: Only keys for providers you're using need actual values
# Others can remain as placeholders
```

---

## Orchestrator_Project MCP Config Comparison

**File:** `Orchestrator_Project/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "YOUR_ANTHROPIC_API_KEY_HERE",
        "PERPLEXITY_API_KEY": "YOUR_PERPLEXITY_API_KEY_HERE",
        // ... similar placeholder pattern
      }
    }
  }
}
```

**Status:** ⚠️ **Also needs updating** (same issues as portfolio-redesign)

**Note:** Orchestrator has same problems - should be fixed simultaneously.

---

## Vibe Kanban Integration Implications

### Why Correct MCP Config Matters for Vibe Kanban

1. **Centralized MCP Management:**
   - Vibe Kanban can read and edit `.mcp.json` files
   - Standard format ensures compatibility
   - Metadata helps organize multiple projects

2. **Project Recognition:**
   ```json
   "metadata": {
     "project": "portfolio-redesign",
     "tags": ["landing-page", "reddit-campaign", "case-study"]
   }
   ```
   - Vibe Kanban uses metadata to categorize projects
   - Tags map to your 3 epics
   - Description appears in project cards

3. **API Key Security:**
   - Vibe Kanban won't expose hardcoded keys
   - Uses `${VAR}` references safely
   - Can validate if keys are properly configured

---

## Migration Steps

### Step 1: Backup Current Config

```bash
cd /Users/tomeldridge/portfolio-redesign
cp .cursor/mcp.json .cursor/mcp.json.backup
```

### Step 2: Replace with Recommended Config

```bash
mv .cursor/mcp.json.recommended .cursor/mcp.json
```

### Step 3: Verify .env File Exists

```bash
# Check if .env exists (will show error if filtered by .cursorignore)
ls -la .env

# If doesn't exist, create it:
touch .env
echo "ANTHROPIC_API_KEY=your-actual-key-here" >> .env
echo "PERPLEXITY_API_KEY=your-actual-key-here" >> .env
# ... add other keys as needed
```

### Step 4: Restart Claude Code

**Critical:** MCP configs are loaded on startup, so you must:

1. Completely quit Claude Code (`Cmd+Q`)
2. Reopen in portfolio-redesign directory
3. Verify MCP loaded: Look for TaskMaster AI tools available

### Step 5: Test MCP Functionality

```javascript
// Try a simple TaskMaster command
const tasks = await mcp__task_master_ai__get_tasks({
  projectRoot: "/Users/tomeldridge/portfolio-redesign",
  status: "pending"
});

console.log(tasks); // Should return actual task data
```

If this fails with authentication error, it means:
- ❌ `.env` file doesn't have real API keys
- ❌ Keys are not in correct format
- ✅ Config is now correctly referencing env vars!

### Step 6: Update Orchestrator_Project Config

Apply same fixes to Orchestrator's `.mcp.json`:

```bash
cd /Users/tomeldridge/Orchestrator_Project
# Apply same changes...
```

---

## Security Best Practices

### ✅ DO:

1. **Use Environment Variable References:**
   ```json
   "env": { "API_KEY": "${API_KEY}" }
   ```

2. **Store Secrets in .env (gitignored):**
   ```bash
   # .gitignore
   .env
   .env.local
   *.key
   ```

3. **Add .env.example Template:**
   ```bash
   # .env.example (committed to git)
   ANTHROPIC_API_KEY=sk-ant-api03-PASTE_YOUR_KEY_HERE
   PERPLEXITY_API_KEY=pplx-PASTE_YOUR_KEY_HERE
   ```

### ❌ DON'T:

1. **Hardcode API Keys:**
   ```json
   "env": { "API_KEY": "sk-actual-secret-key" }  // ❌ NEVER!
   ```

2. **Commit .env to Git:**
   ```bash
   git add .env  // ❌ NEVER!
   ```

3. **Use Placeholder Values in MCP Config:**
   ```json
   "env": { "API_KEY": "YOUR_KEY_HERE" }  // ❌ Won't work!
   ```

---

## Orchestrator Template Reference

**Location:** `lib/templates/scaffold/mcp-template.js`

**Key Functions:**

```javascript
// Generates MCP config from scenario data
export function generateMcpConfig(context) {
  return {
    type: 'stdio',
    command: 'npx',
    args: ['-y', packageName],
    env: {
      API_KEY: `\${${CONSTANT_CASE}_API_KEY}`  // ← Template var
    },
    metadata: {
      generatedFrom: scenario.name,
      generatedAt: timestamp(),
      description: scenario.description
    }
  };
}
```

**Usage:**
This template is used by Orchestrator's scenario system to generate standardized MCP configs.

---

## Future Considerations

### 1. Multi-MCP Support

When adding more MCPs (e.g., for GitHub, database access):

```json
{
  "mcpServers": {
    "task-master-ai": { /* ... */ },
    "github-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "github-mcp"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      },
      "metadata": {
        "project": "portfolio-redesign",
        "description": "GitHub integration for issue tracking"
      }
    }
  }
}
```

### 2. Per-Epic MCP Configs

For your 3 epics, you might want different MCP servers:

```json
{
  "mcpServers": {
    "task-master-ai": {
      "metadata": {
        "tags": ["landing-page", "reddit-campaign", "case-study"]
      }
    },
    "reddit-api-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "reddit-api-mcp"],
      "metadata": {
        "tags": ["reddit-campaign"]  // ← Only for Epic 2
      }
    }
  }
}
```

### 3. Vibe Kanban MCP Management

Once Vibe Kanban is integrated, it can:
- Display all configured MCPs per project
- Allow editing MCP configs via UI
- Validate API key presence
- Show MCP health status

---

## Summary

### Issues Found

| Issue | Severity | Impact | Fix Required |
|-------|----------|--------|--------------|
| Missing `type` field | 🟡 Medium | Implicit behavior | Add `"type": "stdio"` |
| Complex args array | 🟡 Medium | Maintenance burden | Simplify to `["-y", "pkg"]` |
| Hardcoded API placeholders | 🔴 **Critical** | **MCP won't work** | Use `"${VAR}"` syntax |
| Missing metadata | 🟢 Low | Reduced traceability | Add metadata object |

### Compliance Status

- **Overall:** ❌ **NON-COMPLIANT**
- **Blocker:** Issue #3 (hardcoded placeholders)
- **Risk:** Medium (config exists but doesn't follow best practices)

### Action Items

1. ✅ **Immediate:** Replace `.cursor/mcp.json` with recommended version
2. ✅ **Immediate:** Verify `.env` file has real API keys
3. ✅ **Immediate:** Restart Claude Code
4. ✅ **Immediate:** Test MCP functionality
5. ⏱️ **Soon:** Apply same fixes to Orchestrator_Project
6. ⏱️ **Future:** Add metadata tags for 3 epics
7. ⏱️ **Future:** Create `.env.example` template

---

## Related Documentation

- [MCP Integration Guide](Docs/MCP_INTEGRATION_GUIDE.md) - Comprehensive MCP documentation
- [Orchestrator Architecture](Docs/ARCHITECTURE.md) - System design principles
- [TaskMaster MCP/CLI Fallback](Docs/TaskMaster_MCP_CLI_Fallback.md) - Reliability patterns

---

**Report Generated:** November 10, 2025  
**Tool Used:** Orchestrator AI Analysis  
**Status:** ✅ Corrected config ready at `.cursor/mcp.json.recommended`


