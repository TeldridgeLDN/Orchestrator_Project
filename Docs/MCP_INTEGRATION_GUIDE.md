# MCP Integration Guide

**Purpose:** Comprehensive guide for creating and integrating MCP (Model Context Protocol) servers with the Project Orchestrator.

**Version:** 1.0
**Date:** 2025-11-08
**Status:** Production Ready

---

## Table of Contents

1. [Introduction](#introduction)
2. [When to Use MCPs](#when-to-use-mcps)
3. [MCP Architecture](#mcp-architecture)
4. [Server Implementation](#server-implementation)
5. [Integration Patterns](#integration-patterns)
6. [Security Best Practices](#security-best-practices)
7. [Performance Optimization](#performance-optimization)
8. [Troubleshooting](#troubleshooting)
9. [Examples](#examples)

---

## Introduction

### What is Model Context Protocol (MCP)?

**MCP** is a standardized protocol that enables Claude to interact with external systems, APIs, and data sources. It provides a structured way to:

- **Extend Claude's capabilities** with external tools
- **Access real-time data** from databases and APIs
- **Integrate proprietary systems** securely
- **Enable stateful operations** beyond Claude's context window

### Key Benefits

✅ **Faster Performance** - ~68% faster than CLI equivalents
✅ **Structured Data** - Type-safe JSON responses
✅ **Native Integration** - Tools appear directly in Claude's context
✅ **Better UX** - No need to parse command-line output
✅ **Persistent Connections** - Efficient for repeated operations

### How MCP Works

```
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│    Claude    │  Tools   │  MCP Server  │  Calls   │   External   │
│  (AI Agent)  │◄────────►│  (Protocol)  │◄────────►│    System    │
└──────────────┘          └──────────────┘          └──────────────┘
       │                         │                          │
       │  1. Request tool        │                          │
       │─────────────────────────►                          │
       │                         │  2. Process request      │
       │                         │─────────────────────────►│
       │                         │                          │
       │                         │  3. Return data          │
       │                         │◄─────────────────────────│
       │  4. Receive response    │                          │
       │◄─────────────────────────                          │
```

---

## When to Use MCPs

Refer to **Step 2** of the [Agentic Feature Selection Workflow](Agentic_Feature_Selection_Workflow.md) decision tree.

### MCP is Appropriate When:

✅ **External System Integration Required**
- Connecting to databases (PostgreSQL, MongoDB, etc.)
- Third-party API integration (Stripe, GitHub, etc.)
- Proprietary internal systems

✅ **Multiple Related Operations**
- CRUD operations on external data
- Complex queries with parameters
- Batch operations

✅ **Benefits from Persistent Connection**
- Frequent access to same system
- Authentication state maintenance
- Connection pooling advantages

✅ **Structured Data Exchange**
- Well-defined schemas
- Type-safe responses
- Programmatic consumption

### MCP is NOT Appropriate When:

❌ **Simple One-Off Tasks** → Use Slash Commands instead
❌ **Event-Driven Automation** → Use Hooks instead
❌ **Parallel/Isolated Execution** → Use Sub-Agents instead
❌ **No External System** → Use Skills or Commands

### Decision Checklist

- [ ] Requires external system connection?
- [ ] Provides multiple related operations?
- [ ] Benefits from persistent connection?
- [ ] Data format is well-structured?
- [ ] Performance improvement matters?

**If 3+ checkboxes are YES** → MCP is likely the right choice

---

## MCP Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                   Project Orchestrator                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  .mcp.json (Configuration)                                  │
│  ├── Server definitions                                     │
│  ├── Environment variables                                  │
│  └── Connection settings                                    │
│                                                             │
│  MCP Server Package                                         │
│  ├── Tool definitions                                       │
│  ├── Request handlers                                       │
│  ├── Authentication logic                                   │
│  └── Error handling                                         │
│                                                             │
│  External System                                            │
│  ├── Database / API                                         │
│  ├── Authentication                                         │
│  └── Data storage                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Configuration File Structure

**File:** `.mcp.json`

```json
{
  "mcpServers": {
    "server-name": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "package-name"],
      "env": {
        "API_KEY": "your-api-key",
        "DATABASE_URL": "connection-string"
      }
    }
  }
}
```

### Tool Naming Convention

MCP tools follow this pattern:
```
mcp__<server-name>__<operation-name>
```

**Examples:**
- `mcp__task_master_ai__get_tasks`
- `mcp__github__create_issue`
- `mcp__database__query`

---

## Server Implementation

### Basic MCP Server Structure

```javascript
// mcp-server.js
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

class MyMCPServer {
  constructor() {
    this.server = new Server({
      name: 'my-server',
      version: '1.0.0',
    });

    this.setupTools();
    this.setupErrorHandling();
  }

  setupTools() {
    // Define available tools
    this.server.setRequestHandler(
      'tools/list',
      async () => ({
        tools: [
          {
            name: 'get_data',
            description: 'Fetches data from external system',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Record ID to fetch'
                }
              },
              required: ['id']
            }
          }
        ]
      })
    );

    // Handle tool execution
    this.server.setRequestHandler(
      'tools/call',
      async (request) => {
        const { name, arguments: args } = request.params;

        try {
          switch (name) {
            case 'get_data':
              return await this.getData(args.id);
            default:
              throw new Error(`Unknown tool: ${name}`);
          }
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error: ${error.message}`
            }],
            isError: true
          };
        }
      }
    );
  }

  async getData(id) {
    // Implementation
    const data = await externalAPI.fetch(id);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(data, null, 2)
      }]
    };
  }

  setupErrorHandling() {
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      process.exit(1);
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP server running');
  }
}

// Start server
const server = new MyMCPServer();
server.start().catch(console.error);
```

### Package.json Configuration

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "my-mcp-server": "./mcp-server.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  }
}
```

### Publishing Your Server

```bash
# 1. Test locally
npm link

# 2. Verify package
npm pack

# 3. Publish to npm
npm publish

# 4. Use in projects
npx -y my-mcp-server
```

---

## Integration Patterns

### Pattern 1: Direct Tool Invocation

**Use Case:** One-time operations, simple queries

```javascript
// Claude calls MCP tool directly
const result = await mcp__task_master_ai__get_tasks({
  status: 'pending',
  priority: 'high'
});

console.log(result); // Structured response
```

### Pattern 2: Workflow Integration

**Use Case:** Multi-step processes

```javascript
// Step 1: Parse PRD
const parseResult = await mcp__task_master_ai__parse_prd({
  input: 'prd.txt',
  num_tasks: 10
});

// Step 2: Expand complex tasks
for (const task of parseResult.tasks) {
  if (task.complexity > 7) {
    await mcp__task_master_ai__expand_task({
      id: task.id,
      num: 5
    });
  }
}

// Step 3: Generate report
const report = await mcp__task_master_ai__generate_report({
  tag: parseResult.tag
});
```

### Pattern 3: Hook-Triggered MCP

**Use Case:** Automatic operations based on events

```javascript
// .claude/hooks/auto-task-loader.js
#!/usr/bin/env node

const userPrompt = process.env.USER_PROMPT || '';
const taskPattern = /task\s+(\d+(?:\.\d+)?)/i;
const match = userPrompt.match(taskPattern);

if (match) {
  const taskId = match[1];
  console.log(`\n💡 Tip: Use mcp__task_master_ai__show_task({ id: "${taskId}" })\n`);
}

process.exit(0);
```

### Pattern 4: MCP + CLI Fallback

**Use Case:** Reliability when MCP unavailable

See [TaskMaster_MCP_CLI_Fallback.md](TaskMaster_MCP_CLI_Fallback.md) for complete implementation.

**Benefits:**
- Works with or without MCP configured
- Automatic detection
- Same workflow documentation
- Graceful degradation

---

## Security Best Practices

### 1. API Key Management

**✅ DO:**
```json
// .mcp.json
{
  "mcpServers": {
    "my-server": {
      "env": {
        "API_KEY": "${API_KEY}"  // Reference from .env
      }
    }
  }
}
```

```bash
# .env (gitignored)
API_KEY=sk-real-key-here
PERPLEXITY_API_KEY=pplx-real-key-here
```

**❌ DON'T:**
```json
// DON'T hardcode API keys
{
  "mcpServers": {
    "my-server": {
      "env": {
        "API_KEY": "sk-actual-key-12345"  // ❌ NEVER DO THIS
      }
    }
  }
}
```

### 2. Input Validation

```javascript
async function getData(args) {
  // Validate input
  if (!args.id) {
    throw new Error('ID parameter is required');
  }

  // Sanitize input
  const sanitizedId = String(args.id).replace(/[^a-zA-Z0-9-]/g, '');

  // Type checking
  if (typeof args.limit !== 'number' || args.limit < 1 || args.limit > 100) {
    throw new Error('Limit must be between 1 and 100');
  }

  // Proceed with validated input
  return await externalAPI.fetch(sanitizedId);
}
```

### 3. Authentication & Authorization

```javascript
class SecureMCPServer {
  async validateRequest(request) {
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      throw new Error('API_KEY not configured');
    }

    // Verify API key format
    if (!apiKey.startsWith('sk-') || apiKey.length < 32) {
      throw new Error('Invalid API key format');
    }

    // Additional auth checks
    // ...
  }

  async handleRequest(request) {
    await this.validateRequest(request);
    // Process request
  }
}
```

### 4. Error Handling

```javascript
async function handleToolCall(name, args) {
  try {
    // Attempt operation
    const result = await performOperation(args);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result)
      }]
    };
  } catch (error) {
    // Log error (server-side only)
    console.error(`Error in ${name}:`, error);

    // Return sanitized error to client
    return {
      content: [{
        type: 'text',
        text: `Operation failed: ${sanitizError(error.message)}`
      }],
      isError: true
    };
  }
}

function sanitizeError(message) {
  // Remove sensitive information
  return message
    .replace(/sk-[a-zA-Z0-9]+/g, '[REDACTED]')
    .replace(/password[^\s]*/gi, '[REDACTED]')
    .replace(/token[^\s]*/gi, '[REDACTED]');
}
```

### 5. Rate Limiting

```javascript
class RateLimitedServer {
  constructor() {
    this.requestCounts = new Map();
    this.RATE_LIMIT = 100; // requests per minute
    this.WINDOW = 60 * 1000; // 1 minute
  }

  async checkRateLimit(clientId) {
    const now = Date.now();
    const clientData = this.requestCounts.get(clientId) || { count: 0, resetAt: now + this.WINDOW };

    if (now > clientData.resetAt) {
      // Reset window
      clientData.count = 0;
      clientData.resetAt = now + this.WINDOW;
    }

    if (clientData.count >= this.RATE_LIMIT) {
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((clientData.resetAt - now) / 1000)}s`);
    }

    clientData.count++;
    this.requestCounts.set(clientId, clientData);
  }
}
```

### 6. Secure Communication

```javascript
// Use HTTPS for external API calls
const https = require('https');

const httpsAgent = new https.Agent({
  rejectUnauthorized: true, // Verify SSL certificates
  minVersion: 'TLSv1.2'     // Minimum TLS version
});

// Make requests with secure agent
await axios.get('https://api.example.com/data', { httpsAgent });
```

---

## Performance Optimization

### 1. Connection Pooling

```javascript
const { Pool } = require('pg');

class DatabaseMCP {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      max: 20,                    // Maximum pool size
      idleTimeoutMillis: 30000,   // Close idle connections
      connectionTimeoutMillis: 2000
    });
  }

  async query(sql, params) {
    const client = await this.pool.connect();
    try {
      return await client.query(sql, params);
    } finally {
      client.release();
    }
  }
}
```

### 2. Response Caching

```javascript
class CachedMCP {
  constructor() {
    this.cache = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  }

  async getData(id) {
    const cacheKey = `data:${id}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() < cached.expiresAt) {
      console.error(`Cache hit: ${cacheKey}`);
      return cached.data;
    }

    // Fetch fresh data
    const data = await externalAPI.fetch(id);

    // Cache result
    this.cache.set(cacheKey, {
      data,
      expiresAt: Date.now() + this.CACHE_TTL
    });

    return data;
  }

  clearCache() {
    this.cache.clear();
  }
}
```

### 3. Batch Operations

```javascript
async function batchGetTasks(ids) {
  // Instead of N individual queries
  // ❌ for (const id of ids) { await getTask(id); }

  // Use one batched query
  // ✅
  const tasks = await db.query(
    'SELECT * FROM tasks WHERE id = ANY($1)',
    [ids]
  );

  return tasks.rows;
}
```

### 4. Async/Parallel Processing

```javascript
async function processMultipleTasks(taskIds) {
  // Process in parallel
  const results = await Promise.all(
    taskIds.map(id => processTask(id))
  );

  return results;
}

// With error handling
async function safeParallelProcessing(items) {
  const results = await Promise.allSettled(
    items.map(item => processItem(item))
  );

  const successful = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  const failed = results
    .filter(r => r.status === 'rejected')
    .map(r => r.reason);

  return { successful, failed };
}
```

### 5. Monitoring & Logging

```javascript
class InstrumentedMCP {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      totalDuration: 0
    };
  }

  async handleRequest(name, args) {
    const startTime = Date.now();
    this.metrics.requests++;

    try {
      const result = await this.processRequest(name, args);
      const duration = Date.now() - startTime;

      this.metrics.totalDuration += duration;
      console.error(`[METRICS] ${name}: ${duration}ms`);

      return result;
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      avgDuration: this.metrics.requests > 0
        ? this.metrics.totalDuration / this.metrics.requests
        : 0
    };
  }
}
```

---

## Troubleshooting

### Issue: MCP Server Not Loading

**Symptoms:**
- Tools not appearing in Claude
- "MCP: Not available" in hooks

**Solutions:**

1. **Check .mcp.json syntax:**
```bash
cat .mcp.json | jq .
# Should parse without errors
```

2. **Verify API keys:**
```bash
grep API_KEY .mcp.json
# Keys should NOT contain placeholders like "YOUR_KEY_HERE"
```

3. **Restart Claude Code:**
- Completely quit Claude Code
- Reopen in project directory
- MCP servers load on startup

4. **Check server installation:**
```bash
npx -y task-master-ai --version
# Should display version without errors
```

### Issue: Slow MCP Performance

**Diagnosis:**

```javascript
// Add timing to your MCP server
console.error(`[TIMING] Operation took ${Date.now() - start}ms`);
```

**Common Causes & Fixes:**

| Cause | Solution |
|-------|----------|
| No connection pooling | Implement connection pool |
| Missing cache | Add response caching |
| Sequential operations | Use Promise.all for parallel |
| Large responses | Paginate or filter data |
| Inefficient queries | Add database indexes |

### Issue: Authentication Failures

**Debug Steps:**

```javascript
// Log authentication details (server-side only)
console.error('API Key present:', !!process.env.API_KEY);
console.error('API Key format:', process.env.API_KEY?.slice(0, 7));

// Verify environment variables loaded
console.error('ENV vars:', Object.keys(process.env).filter(k => k.includes('API')));
```

### Issue: MCP vs CLI Inconsistency

**Symptom:** Different results from MCP tool vs CLI command

**Solution:** Ensure both use same underlying logic

```javascript
// Shared business logic
async function getTasks(filters) {
  // Single implementation used by both
  return await database.query(filters);
}

// MCP tool wrapper
mcpServer.addTool('get_tasks', getTasks);

// CLI command wrapper
cli.command('list', () => getTasks(parseArgs()));
```

---

## Examples

### Example 1: Task Master MCP

**Configuration:**

```json
{
  "mcpServers": {
    "task-master-ai": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-api03-...",
        "PERPLEXITY_API_KEY": "pplx-..."
      }
    }
  }
}
```

**Usage:**

```javascript
// Parse PRD
const result = await mcp__task_master_ai__parse_prd({
  input: ".taskmaster/docs/prd.txt",
  num_tasks: 10
});

// List tasks
const tasks = await mcp__task_master_ai__get_tasks({
  status: "pending"
});

// Show specific task
const task = await mcp__task_master_ai__show_task({
  id: "1.2"
});
```

**See:** [TaskMaster_MCP_CLI_Fallback.md](TaskMaster_MCP_CLI_Fallback.md)

### Example 2: Database MCP Template

```javascript
// database-mcp-server.js
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { Pool } = require('pg');

class DatabaseMCP {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    this.server = new Server({
      name: 'database-mcp',
      version: '1.0.0'
    });

    this.setupTools();
  }

  setupTools() {
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'query',
          description: 'Execute SQL query',
          inputSchema: {
            type: 'object',
            properties: {
              sql: { type: 'string' },
              params: { type: 'array' }
            },
            required: ['sql']
          }
        }
      ]
    }));

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'query') {
        const result = await this.pool.query(args.sql, args.params || []);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result.rows)
          }]
        };
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

new DatabaseMCP().start();
```

### Example 3: GitHub Integration MCP

```javascript
// github-mcp-server.js
const { Octokit } = require('@octokit/rest');

class GitHubMCP {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    // Define tools: create_issue, list_prs, get_repo, etc.
  }

  async createIssue(args) {
    const { owner, repo, title, body } = args;

    const response = await this.octokit.issues.create({
      owner,
      repo,
      title,
      body
    });

    return {
      content: [{
        type: 'text',
        text: `Created issue #${response.data.number}: ${response.data.html_url}`
      }]
    };
  }
}
```

---

## Summary

### Key Takeaways

1. **Use MCPs for external system integration** - Follow decision tree Step 2
2. **Implement security best practices** - Validate input, manage secrets
3. **Optimize for performance** - Connection pooling, caching, batching
4. **Provide CLI fallback** - Ensure reliability when MCP unavailable
5. **Monitor and log** - Track performance and errors

### Quick Reference

| Aspect | Recommendation |
|--------|----------------|
| **When to use** | External APIs, databases, proprietary systems |
| **Configuration** | `.mcp.json` with env vars from `.env` |
| **Tool naming** | `mcp__server__operation` format |
| **Security** | Input validation, API key management, error sanitization |
| **Performance** | Connection pooling, caching, async operations |
| **Reliability** | Provide CLI fallback for critical workflows |

### Next Steps

1. Review [Agentic Feature Selection Workflow](Agentic_Feature_Selection_Workflow.md)
2. Check [TaskMaster_MCP_CLI_Fallback.md](TaskMaster_MCP_CLI_Fallback.md) for implementation example
3. Implement your MCP server following the patterns above
4. Test with and without MCP to ensure fallback works
5. Document your MCP tools in project README

---

**Related Documentation:**
- [Agentic Feature Selection Workflow](Agentic_Feature_Selection_Workflow.md) - Decision framework
- [TaskMaster MCP/CLI Fallback](TaskMaster_MCP_CLI_Fallback.md) - Real implementation
- [README](README.md) - Project overview
- [ARCHITECTURE](ARCHITECTURE.md) - System design

**Last Updated:** 2025-11-08
**Version:** 1.0.0
**Status:** Production Ready
