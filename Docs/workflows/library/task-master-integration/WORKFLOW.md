# Workflow: Task Master Integration with MCP/CLI Fallback

**Purpose:** Automated integration of Task Master AI for project task management with intelligent MCP/CLI routing

**Category:** MCP Integration

**Complexity:** Medium

**Estimated Setup Time:** 1-2 hours

**Version:** 1.0
**Date:** 2025-11-08
**Status:** Production Ready

---

## Overview

### What This Workflow Does

Integrates Task Master AI into Claude Code projects, enabling:
- Automated task generation from PRD documents
- MCP-based tools with CLI fallback for reliability
- Task context auto-loading via hooks
- Intelligent workflow routing based on availability

### When to Use This Workflow

- Starting new project with task management needs
- Converting existing implementation plans to trackable tasks
- Need both fast MCP performance AND reliable CLI fallback
- Want automated task context loading in conversations

### When NOT to Use This Workflow

- Project doesn't need task tracking
- Manual task management is preferred
- No implementation plans or PRDs exist
- Working on trivial single-file changes

### Prerequisites

- [ ] Node.js installed (for MCP server)
- [ ] Task Master AI CLI installed: `npm install -g task-master-ai`
- [ ] At least one API key: Anthropic (Claude) or Perplexity (research)
- [ ] `.env` file for API keys
- [ ] Project already initialized (`task-master init` run)

---

## Architecture

### Components Used

| Component Type | Name | Purpose |
|----------------|------|---------|
| MCP Server | `task-master-ai` | Primary task operations (fast, integrated) |
| Hook | `taskmaster-invoker.js` | Detects MCP availability, routes to MCP/CLI |
| Hook | `taskmaster-context-loader.js` | Auto-loads task context on mention |
| Hook | `taskmaster-status-tracker.js` | Prompts status updates after file edits |

### Component Interaction Flow

```
User: "Parse the PRD"
    ↓
[Hook: taskmaster-invoker] → Checks MCP availability
    ↓
IF MCP available:
    → Informs Claude: "Use mcp__task_master_ai__parse_prd"
    → Claude calls MCP tool
    → Fast, structured response
ELSE:
    → Informs Claude: "Use CLI fallback"
    → Claude runs: task-master parse-prd
    → Same result, slightly slower

User: "Working on task 1.2"
    ↓
[Hook: taskmaster-context-loader] → Detects task mention
    ↓
Loads task-1.2.md content → Displays summary
    ↓
Claude has task context automatically
```

### Decision Justification

**Feature Selection Analysis:**

**Step 1: Single-step task?**
- Answer: NO
- Reasoning: Multiple operations (parse PRD, list tasks, update tasks, etc.)
- Decision: Continue to Step 2

**Step 2: External system/API?**
- Answer: YES
- Reasoning: Task Master is external system with API/CLI interface
- Decision: Use MCP Server

**Step 3: Event-driven trigger?**
- Answer: YES (additionally)
- Reasoning: Auto-load task context when tasks mentioned
- Decision: ALSO use Hooks for automation

**Final Architecture Choice:**

**MCP Server** for primary operations because:
- External system integration (Task Master AI)
- Multiple related operations (parse, list, show, update)
- Benefits from persistent connection
- Structured data exchange (JSON)

**Hooks** for automation because:
- Event-driven (detect task mentions, file edits)
- Non-blocking guidance
- Auto-context loading improves UX

**CLI Fallback** for reliability:
- MCP may not always be available
- API keys may be missing
- Ensures workflow always works

**Rejected Alternatives:**
- Pure CLI approach: Works but slower, less integrated
- Pure MCP approach: Fails if not configured
- Slash Commands only: Too manual, no automation
- Skill wrapping: Over-engineering for this use case

---

## Implementation

### Phase 1: MCP Server Setup

**Objective:** Configure MCP server for Task Master integration

**Steps:**

1. **Create MCP configuration**

   **File:** `.mcp.json` (project root)

   ```json
   {
     "mcpServers": {
       "task-master-ai": {
         "type": "stdio",
         "command": "npx",
         "args": ["-y", "task-master-ai"],
         "env": {
           "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
           "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}"
         }
       }
     }
   }
   ```

2. **Configure environment variables**

   **File:** `.env`

   ```bash
   # Required: At least one
   ANTHROPIC_API_KEY=sk-ant-api03-...
   PERPLEXITY_API_KEY=pplx-...

   # Optional: For additional features
   OPENAI_API_KEY=sk-...
   ```

3. **Restart Claude Code**

   - Quit Claude Code completely
   - Reopen in project directory
   - MCP servers load on startup

**Validation:**
```bash
# Test MCP availability (will be checked by hook)
# No manual test needed - hook validates automatically
```

**Expected Output:**
```
MCP server configured and ready
Hook will detect availability automatically
```

### Phase 2: Hook Installation

**Objective:** Install automation hooks for intelligent routing and context loading

**Steps:**

1. **Install MCP/CLI routing hook**

   **File:** `.claude/hooks/taskmaster-invoker.js`

   ```javascript
   #!/usr/bin/env node

   const fs = require('fs');
   const userPrompt = process.env.USER_PROMPT || '';

   // Check if this is a task-related prompt
   const taskPatterns = [
     /task-master\s+(\w+)/i,
     /next task/i,
     /show task\s+(\d+(?:\.\d+)?)/i,
     /list tasks/i,
     /parse.*prd/i
   ];

   const isTaskRelated = taskPatterns.some(pattern => pattern.test(userPrompt));

   if (isTaskRelated) {
     // Detect if MCP is available
     const mcpAvailable = checkMCPAvailability();

     if (mcpAvailable) {
       console.log('\n📋 Task Master MCP: Available');
       console.log('💡 Tip: Using MCP tools for faster, integrated access\n');
     } else {
       console.log('\n📋 Task Master MCP: Not available (using CLI fallback)');
       console.log('💡 Tip: Configure .mcp.json with API keys to enable MCP\n');
     }
   }

   process.exit(0);

   function checkMCPAvailability() {
     try {
       const mcpConfigPath = '.mcp.json';
       if (!fs.existsSync(mcpConfigPath)) return false;

       const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
       const taskMasterServer = mcpConfig.mcpServers?.['task-master-ai'];

       if (!taskMasterServer) return false;

       // Check if API keys are configured (not placeholders)
       const apiKey = taskMasterServer.env?.ANTHROPIC_API_KEY;
       if (!apiKey || apiKey.includes('YOUR_') || apiKey.includes('_HERE')) {
         return false;
       }

       return true;
     } catch (err) {
       return false;
     }
   }
   ```

   ```bash
   chmod +x .claude/hooks/taskmaster-invoker.js
   ```

2. **Install context auto-loader hook**

   **File:** `.claude/hooks/taskmaster-context-loader.js`

   ```javascript
   #!/usr/bin/env node

   const fs = require('fs');
   const userPrompt = process.env.USER_PROMPT || '';

   // Match patterns like "task 1.2", "working on task 3"
   const taskPattern = /task\s+(\d+(?:\.\d+)?)/i;
   const match = userPrompt.match(taskPattern);

   if (match) {
     const taskId = match[1];
     const taskFile = `.taskmaster/tasks/task-${taskId}.md`;

     if (fs.existsSync(taskFile)) {
       const taskContent = fs.readFileSync(taskFile, 'utf8');
       const summary = extractSummary(taskContent);

       console.log(`\n📋 Task ${taskId} Context:`);
       console.log('─'.repeat(50));
       console.log(summary);
       console.log('─'.repeat(50));
       console.log(`\nFull details: task-master show ${taskId}\n`);
     }
   }

   process.exit(0);

   function extractSummary(content) {
     const lines = content.split('\n');
     const titleLine = lines.find(l => l.startsWith('# Task'));
     const descLine = lines.find(l => l.startsWith('**Description:**'));

     return `${titleLine || ''}\n${descLine?.substring(0, 200) || ''}...`;
   }
   ```

   ```bash
   chmod +x .claude/hooks/taskmaster-context-loader.js
   ```

**Validation:**
```bash
# Test hooks manually
USER_PROMPT="parse the PRD" .claude/hooks/taskmaster-invoker.js
USER_PROMPT="working on task 1" .claude/hooks/taskmaster-context-loader.js
```

**Expected Output:**
```
📋 Task Master MCP: Available
💡 Tip: Using MCP tools for faster, integrated access

📋 Task 1 Context:
──────────────────────────────────────────────────
# Task 1: Create Detection Module
**Description:** Implement diet103 structure detection...
──────────────────────────────────────────────────
```

### Phase 3: Verify Integration

**Objective:** Test MCP and CLI paths work correctly

**Steps:**

1. **Test MCP path** (if MCP configured)

   In Claude Code conversation:
   ```
   User: "Parse the PRD at .taskmaster/docs/test.txt"

   [Hook displays: "Task Master MCP: Available"]

   Claude uses: mcp__task_master_ai__parse_prd({ input: "..." })

   Expected: Tasks generated successfully
   ```

2. **Test CLI fallback** (temporarily disable MCP)

   ```bash
   # Rename .mcp.json temporarily
   mv .mcp.json .mcp.json.bak
   ```

   In Claude Code:
   ```
   User: "List all tasks"

   [Hook displays: "Task Master MCP: Not available (using CLI fallback)"]

   Claude runs: task-master list

   Expected: Tasks listed successfully
   ```

   ```bash
   # Restore MCP
   mv .mcp.json.bak .mcp.json
   ```

3. **Test context auto-loading**

   ```
   User: "I'm working on task 1.2"

   [Hook displays task 1.2 summary]

   Expected: Task context loaded, Claude is aware of task details
   ```

**Validation:**
- [ ] MCP path works (faster response)
- [ ] CLI fallback works (same results)
- [ ] Context auto-loading works
- [ ] No errors in hook execution

---

## Configuration Files

### Environment Variables

**File:** `.env`

```bash
# Task Master API Keys (at least one required)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
PERPLEXITY_API_KEY=pplx-your-key-here

# Optional: Additional AI providers
OPENAI_API_KEY=sk-your-key
GOOGLE_API_KEY=your-key
```

**Security:**
- Add `.env` to `.gitignore`
- Never commit API keys
- Use environment variable substitution in `.mcp.json`

### MCP Configuration

**File:** `.mcp.json`

```json
{
  "mcpServers": {
    "task-master-ai": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
        "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}"
      }
    }
  }
}
```

**Activation:** Restart Claude Code after configuration changes

---

## Usage Examples

### Example 1: Parse PRD (Happy Path - MCP Available)

**Context:** New project, MCP configured, PRD ready

**User Action:**
```
User: "Parse the PRD at .taskmaster/docs/feature.txt"
```

**System Response:**
```
📋 Task Master MCP: Available
💡 Tip: Using MCP tools for faster, integrated access

[Claude uses MCP tool]
mcp__task_master_ai__parse_prd({ input: ".taskmaster/docs/feature.txt" })

✓ PRD parsed successfully
✓ Generated 10 tasks
✓ Tasks saved to .taskmaster/tasks/tasks.json

Tasks created:
1. Foundation Setup
2. Core Implementation
3. Testing
...
```

### Example 2: Parse PRD (CLI Fallback - MCP Not Available)

**Context:** MCP not configured or API keys missing

**User Action:**
```
User: "Parse the PRD at .taskmaster/docs/feature.txt"
```

**System Response:**
```
📋 Task Master MCP: Not available (using CLI fallback)
💡 Tip: Configure .mcp.json with API keys to enable MCP

[Claude uses CLI]
$ task-master parse-prd --input=.taskmaster/docs/feature.txt

✓ PRD parsed successfully
✓ Generated 10 tasks
✓ Tasks saved to .taskmaster/tasks/tasks.json

Tasks created:
1. Foundation Setup
2. Core Implementation
...
```

### Example 3: Auto-Context Loading

**Context:** Working on specific task

**User Action:**
```
User: "I'm working on task 1.2"
```

**System Response:**
```
📋 Task 1.2 Context:
──────────────────────────────────────────────────
# Task 1.2: Implement Gap Analysis Engine
**Description:** Create logic to compare actual vs expected diet103 structure...
──────────────────────────────────────────────────

Full details: task-master show 1.2

[Claude now has full context of task 1.2]

I see you're working on the Gap Analysis Engine. This task involves...
[continues with context-aware assistance]
```

---

## Troubleshooting

### Issue: MCP Not Detected

**Symptoms:**
- Hook always shows "MCP: Not available"
- Claude only uses CLI commands
- Slower performance

**Diagnosis:**
```bash
# Check .mcp.json exists
ls -la .mcp.json

# Validate JSON syntax
cat .mcp.json | jq .

# Check API keys
grep -E "ANTHROPIC|PERPLEXITY" .mcp.json
```

**Solution:**

1. **Fix .mcp.json:**
   ```bash
   # Ensure valid JSON
   # Ensure API keys don't contain "YOUR_" or "_HERE"
   # Use actual keys from .env
   ```

2. **Restart Claude Code:**
   - Completely quit
   - Reopen in project directory
   - MCP servers load on startup

**Prevention:**
- Use `.env.example` template
- Validate JSON before committing
- Test with `jq` before using

### Issue: Hook Not Triggering

**Symptoms:**
- No "Task Master MCP: Available" message
- Context not auto-loading

**Diagnosis:**
```bash
# Check hook permissions
ls -la .claude/hooks/*.js

# Test hook manually
USER_PROMPT="test" .claude/hooks/taskmaster-invoker.js
```

**Solution:**
```bash
# Make executable
chmod +x .claude/hooks/*.js

# Verify exit code is 0 (non-blocking)
# Hooks must use process.exit(0)
```

### Issue: CLI Fallback Not Working

**Symptoms:**
- Error: "task-master: command not found"

**Diagnosis:**
```bash
# Check if CLI installed
which task-master
task-master --version
```

**Solution:**
```bash
# Install Task Master CLI globally
npm install -g task-master-ai

# Verify installation
task-master --help
```

---

## Performance Considerations

### Expected Performance

| Operation | MCP Path | CLI Path | Difference |
|-----------|----------|----------|------------|
| Parse PRD | ~2 seconds | ~5 seconds | 60% faster |
| List tasks | < 1 second | ~2 seconds | 50% faster |
| Show task | < 1 second | ~1 second | Comparable |
| Update task | ~1 second | ~2 seconds | 50% faster |

### Why MCP is Faster

- No shell spawning overhead
- Direct process communication
- Structured JSON exchange
- Persistent connection

### When CLI is Acceptable

- One-time setup operations
- Debugging/troubleshooting
- MCP configuration issues
- Small projects (< 10 tasks)

---

## Related Resources

### Workflows That Use This
- (None yet - this is foundational workflow)

### Scenarios Using This Workflow
- [Shopify Client Automation](../../../scenarios/library/shopify-client-automation/SCENARIO.md) - Uses for project tracking

### Documentation References
- [MCP Integration Guide](../../../MCP_INTEGRATION_GUIDE.md)
- [TaskMaster_MCP_CLI_Fallback](../../../TaskMaster_MCP_CLI_Fallback.md) - Detailed fallback pattern
- [Task Master Integration Workflow](../../../TaskMaster_Integration_Workflow.md) - Original comprehensive guide

### External Resources
- [Task Master AI](https://npmjs.com/package/task-master-ai)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)

---

## Classification Justification

**Type:** WORKFLOW

**Validation Checklist:**
- [x] Single technical purpose? - YES (Integrate Task Master)
- [x] Reusable across scenarios? - YES (Any project can use this)
- [x] Linear flow (no major branching)? - YES (Sequential setup steps)
- [x] Uses 2-5 components? - YES (1 MCP + 2 Hooks = 3 components)
- [x] Domain-specific business logic? - NO (Generic task management)

**Decision:** WORKFLOW based on:
- Single purpose: Integrate Task Master into project
- Reusable: Works for any domain (e-commerce, SaaS, etc.)
- Technical focus: MCP setup, hook configuration
- No business branching: Same setup regardless of business type

---

## Changelog

### v1.0 (2025-11-08)
- Initial workflow creation from TaskMaster_Integration_Workflow.md
- Standardized format using WORKFLOW_TEMPLATE
- Added classification justification
- Reorganized for clarity and consistency

---

**Last Updated:** 2025-11-08
**Maintainer:** Orchestrator Project Team
**Feedback:** Create issue in project repository
**License:** MIT (same as Orchestrator Project)
