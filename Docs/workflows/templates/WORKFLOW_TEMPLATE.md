# Workflow: [Workflow Name]

**Purpose:** [One-line description of what this workflow accomplishes]

**Category:** [MCP Integration | Agent System | Skill Composition | Hook Automation]

**Complexity:** [Simple | Medium | Complex]

**Estimated Setup Time:** [X hours]

**Version:** 1.0
**Date:** YYYY-MM-DD
**Status:** [Template | Draft | Production Ready]

---

## Overview

### What This Workflow Does
[Detailed description of the workflow's purpose and outcomes]

### When to Use This Workflow
- [Use case 1]
- [Use case 2]
- [Use case 3]

### When NOT to Use This Workflow
- [Anti-pattern 1]
- [Anti-pattern 2]

### Prerequisites
- [ ] [Requirement 1]
- [ ] [Requirement 2]
- [ ] [API keys/credentials needed]
- [ ] [Software dependencies]

---

## Architecture

### Components Used

| Component Type | Name | Purpose |
|----------------|------|---------|
| Slash Command | `/command-name` | [Purpose] |
| MCP Server | `mcp-server-name` | [Purpose] |
| Hook | `hook-name.js` | [Purpose] |
| Sub-Agent | `agent-name` | [Purpose] |
| Skill | `skill-name` | [Purpose] |

### Component Interaction Flow

```
[Visual diagram of how components interact]

Example:
User Input
    ↓
[Hook: Detects trigger] → Informs Claude
    ↓
[MCP: Fetches data] → Returns structured response
    ↓
[Agent: Processes data] → Parallel analysis
    ↓
[Command: Presents results] → User sees output
```

### Decision Justification

**Feature Selection Analysis:**

Use the [Agentic Feature Selection Workflow](../../Agentic_Feature_Selection_Workflow.md) decision tree.

**Step 1: Single-step task?**
- Answer: [YES/NO]
- Reasoning: [Explanation]
- Decision: [Continue to Step 2 | Use Slash Command]

**Step 2: External system/API?**
- Answer: [YES/NO]
- Reasoning: [Explanation]
- Decision: [Continue to Step 3 | Use MCP Server]

**Step 3: Event-driven trigger?**
- Answer: [YES/NO]
- Reasoning: [Explanation]
- Decision: [Continue to Step 4 | Use Hook]

**Step 4: Parallel/isolated execution?**
- Answer: [YES/NO]
- Reasoning: [Explanation]
- Decision: [Continue to Step 5 | Use Sub-Agent]

**Step 5: Multi-step workflow?**
- Answer: [YES/NO]
- Reasoning: [Explanation]
- Decision: [Use Skill | Re-evaluate]

**Final Architecture Choice:** [Detailed justification for selected components and why alternatives were rejected]

---

## Implementation

### Phase 1: [Foundation/Setup]

**Objective:** [What this phase achieves]

**Steps:**

1. **[Step name]**
   ```bash
   # Command or code to execute
   command --arg=value
   ```

2. **[Step name]**
   ```bash
   # Command or code
   ```

**Validation:**
```bash
# Commands to verify phase 1 completion
test-command --verify
```

**Expected Output:**
```
✓ [Success indicator]
✓ [Success indicator]
```

### Phase 2: [Core Components]

**Objective:** [What this phase achieves]

**Steps:**

1. **Create MCP configuration** (if applicable)

   **File:** `.mcp.json`
   ```json
   {
     "mcpServers": {
       "server-name": {
         "type": "stdio",
         "command": "npx",
         "args": ["-y", "package-name"],
         "env": {
           "API_KEY": "${API_KEY}"
         }
       }
     }
   }
   ```

2. **Create Hook** (if applicable)

   **File:** `.claude/hooks/hook-name.js`
   ```javascript
   #!/usr/bin/env node

   const userPrompt = process.env.USER_PROMPT || '';

   // Detection logic
   if (condition) {
     console.log('💡 Guidance message\n');
   }

   process.exit(0);
   ```

   ```bash
   # Make executable
   chmod +x .claude/hooks/hook-name.js
   ```

3. **Create Agent** (if applicable)

   **File:** `.claude/agents/agent-name/AGENT.md`
   ```markdown
   # System Prompt: Agent Name

   You are specialized in [purpose].

   **Role:** [Specific role description]

   **Workflow:**
   1. [Step 1]
   2. [Step 2]

   **Output Format:**
   [STATUS] [Brief summary]

   **Allowed Tools:** [list]
   **Forbidden Tools:** [list]
   ```

4. **Create Slash Command** (if applicable)

   **File:** `.claude/commands/command-name.md`
   ```markdown
   # /command-name

   [Description]

   **Steps:**
   1. [Step 1]
   2. [Step 2]
   ```

**Validation:**
```bash
# Test each component
```

### Phase 3: [Integration]

**Objective:** Connect components and test interaction

**Steps:**

1. **Test component communication**
   ```bash
   # Test commands
   ```

2. **Verify data flow**
   ```bash
   # Verification commands
   ```

**Validation:**
```bash
# End-to-end test
```

### Phase 4: [Testing & Documentation]

**Objective:** Ensure reliability and document usage

**Steps:**

1. **Test edge cases**
   - [Edge case 1]
   - [Edge case 2]

2. **Document usage patterns**
   - Update project README
   - Add examples

3. **Create monitoring**
   - Define success metrics
   - Setup logging

**Validation:**
```bash
# Final verification
```

---

## Configuration Files

### Environment Variables

**File:** `.env`

```bash
# API Keys
API_KEY_NAME=your-key-here
ANOTHER_API_KEY=another-key

# Configuration
CONFIG_OPTION=value
```

### MCP Configuration

**File:** `.mcp.json`

```json
{
  "mcpServers": {
    "server-name": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "package-name"],
      "env": {
        "API_KEY": "${API_KEY}"
      }
    }
  }
}
```

**Activation:** Restart Claude Code after configuration

### Hook Configuration

**File:** `.claude/hooks/hook-name.js`

[Full hook code]

**Testing:**
```bash
# Test hook manually
./.claude/hooks/hook-name.js
```

### Skill Configuration

**File:** `.claude/skill-rules.json`

```json
{
  "rules": [
    {
      "trigger_phrases": ["keyword1", "keyword2"],
      "skill": "skill_name",
      "auto_activate": true
    }
  ]
}
```

---

## Usage Examples

### Example 1: [Common Scenario]

**Context:** [Setup description]

**User Action:**
```bash
# What the user types or does
command --option
```

**System Response:**
```
[Expected output shown to user]
```

**Behind the Scenes:**
1. Hook detects trigger → Informs Claude
2. MCP fetches data → Returns JSON
3. Agent processes → Returns analysis
4. Command presents → User sees result

### Example 2: [Edge Case]

**Context:** [Different scenario]

**User Action:**
```bash
# Command
```

**System Response:**
```
[Expected output]
```

### Example 3: [Error Handling]

**Context:** [When something goes wrong]

**User Action:**
```bash
# Command that triggers error
```

**System Response:**
```
Error: [Clear error message]
Suggestion: [How to fix]
```

---

## Troubleshooting

### Issue: [Common Problem 1]

**Symptoms:**
- [Symptom 1]
- [Symptom 2]

**Diagnosis:**
```bash
# Commands to diagnose
check-status --verbose
```

**Solution:**
```bash
# Fix commands
fix-command --option
```

**Prevention:**
[How to avoid this issue in the future]

### Issue: [Common Problem 2]

**Symptoms:**
- [What user sees]

**Root Cause:**
[Technical explanation]

**Solution:**
1. [Step 1]
2. [Step 2]

### Issue: [Performance Problem]

**Symptoms:**
- Slow response times
- Timeouts

**Diagnosis:**
```bash
# Profile performance
time command --profile
```

**Optimization:**
- [Optimization 1]
- [Optimization 2]

---

## Maintenance

### Updating This Workflow

**When to update:**
- External API changes
- New requirements emerge
- Performance improvements needed

**Update process:**
1. Review current implementation
2. Test changes in isolation
3. Update documentation
4. Notify users of breaking changes

### Monitoring

**Health Indicators:**
- [Metric 1]: [Target value]
- [Metric 2]: [Target value]

**Monitoring Commands:**
```bash
# Check workflow health
status-check --workflow=[name]
```

**Logging:**
```bash
# View logs
tail -f .logs/workflow-name.log
```

### Deprecation Plan

**This workflow should be deprecated if:**
- [Condition 1]
- [Condition 2]

**Migration path:**
- Alternative: [Workflow name]
- Migration guide: [Link]

---

## Performance Considerations

### Expected Performance

| Operation | Target | Actual |
|-----------|--------|--------|
| [Operation 1] | < 1s | [Measure] |
| [Operation 2] | < 5s | [Measure] |

### Optimization Opportunities

1. **[Optimization area]**
   - Current: [Current implementation]
   - Improvement: [How to optimize]
   - Impact: [Expected gain]

2. **[Optimization area]**
   - [Details]

### Scaling Considerations

- **Small scale** (< 10 operations/day): [Considerations]
- **Medium scale** (10-100 operations/day): [Considerations]
- **Large scale** (100+ operations/day): [Considerations]

---

## Security Considerations

### API Key Management
- Store keys in `.env` (gitignored)
- Never hardcode credentials
- Rotate keys periodically

### Input Validation
- [Validation rule 1]
- [Validation rule 2]

### Access Control
- [Who can use this workflow]
- [Required permissions]

---

## Related Resources

### Workflows That Use This
- [Workflow 1](../workflow-1/WORKFLOW.md)
- [Workflow 2](../workflow-2/WORKFLOW.md)

### Scenarios Using This Workflow
- [Scenario 1](../../scenarios/library/scenario-1/SCENARIO.md)

### Documentation References
- [Agentic Feature Selection Workflow](../../Agentic_Feature_Selection_Workflow.md)
- [MCP Integration Guide](../../MCP_INTEGRATION_GUIDE.md)
- [WORKFLOW_CREATION_GUIDE](../../WORKFLOW_CREATION_GUIDE.md)

### External Resources
- [API Documentation](https://example.com/docs)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)

---

## Changelog

### v1.0 (YYYY-MM-DD)
- Initial workflow creation
- Core functionality implemented
- Documentation complete

### v1.1 (YYYY-MM-DD)
- [Changes made]
- [Bug fixes]

---

**Last Updated:** YYYY-MM-DD
**Maintainer:** [Name/Team]
**Feedback:** [How to provide feedback - GitHub issues, email, etc.]
**License:** [License information if applicable]
