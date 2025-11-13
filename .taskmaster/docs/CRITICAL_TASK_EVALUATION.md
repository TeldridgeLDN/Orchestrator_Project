# Critical Task Evaluation System

**Version:** 1.0.0  
**Last Updated:** 2025-11-11  
**Status:** Production Ready

---

## Overview

The **Critical Task Evaluation System** implements an automated dual-pass approach to task generation, ensuring all tasks are evaluated against system philosophy before implementation. This eliminates over-engineering, YAGNI violations, and premature optimization.

---

## The Problem

**Manual Task Generation Issues:**
1. ✅ Generate tasks (Claude without specific role)
2. ❌ Manually prompt: "Now as a god-like programmer, critically evaluate..."
3. ❌ Manual copy/paste between iterations
4. ❌ Inconsistent evaluation criteria
5. ❌ No documentation of changes

**Result:** Time-consuming, inconsistent, undocumented process.

---

## The Solution: Automated Dual-Pass System

```
┌─────────────────────────────────────────────────────────────┐
│ PASS 1: GENERATION (Main Model)                            │
│ - Generates initial tasks from PRD/prompt                   │
│ - Creates standard task structure                          │
│ - Focuses on completeness                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ PASS 2: CRITICAL EVALUATION (Critic Model)                 │
│                                                             │
│ System Prompt: "You are a god-like programmer..."          │
│                                                             │
│ Evaluates against 6 criteria:                              │
│ • Complexity (Weight: 8/10)                                │
│ • Value (Weight: 10/10)                                    │
│ • Philosophy (Weight: 9/10)                                │
│ • YAGNI (Weight: 9/10)                                     │
│ • Risk (Weight: 6/10)                                      │
│ • Token Efficiency (Weight: 7/10)                          │
│                                                             │
│ Actions:                                                    │
│ • CANCEL: Remove over-engineered tasks                    │
│ • SIMPLIFY: Reduce complexity                             │
│ • MERGE: Combine redundant tasks                          │
│ • KEEP: Approve well-designed tasks                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ OUTPUT                                                      │
│ - Refined tasks.json                                       │
│ - Detailed evaluation report (JSON + Markdown)             │
│ - Backup of original tasks                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Configuration (Already Done)

Your `.taskmaster/config.json` is already configured with:

```json
{
  "models": {
    "critic": {
      "provider": "anthropic",
      "modelId": "claude-3-7-sonnet-20250219",
      "maxTokens": 120000,
      "temperature": 0.1,
      "enabled": true
    }
  },
  "global": {
    "enableCriticalReview": true
  },
  "criticalReview": {
    "enabled": true,
    "autoApply": true,
    "generateReport": true
  }
}
```

### 2. Basic Usage

#### Option A: Automatic (Recommended)

**When you generate tasks, evaluation happens automatically:**

```bash
# Parse PRD (automatic evaluation)
task-master parse-prd prd.txt

# Add task (automatic evaluation)
task-master add-task --prompt="Implement feature X"

# The critic model automatically evaluates and refines tasks
```

#### Option B: Manual Evaluation

**Evaluate existing tasks:**

```bash
# Evaluate tasks.json
node .taskmaster/scripts/critical-task-evaluator.js

# Evaluate specific file
node .taskmaster/scripts/critical-task-evaluator.js --tasks path/to/tasks.json

# Dry run (show prompt without API call)
node .taskmaster/scripts/critical-task-evaluator.js --dry-run
```

### 3. Review Results

**Check the evaluation report:**

```bash
# Latest report
ls -lt .taskmaster/reports/critical-review-*.md | head -1 | xargs cat

# Or open in editor
code .taskmaster/reports/critical-review-TIMESTAMP.md
```

---

## Configuration Options

### Enable/Disable Critical Review

**Globally:**
```json
{
  "global": {
    "enableCriticalReview": true  // Set to false to disable
  }
}
```

**Per Command:**
```bash
# Enable for this command
task-master parse-prd prd.txt --critical-review

# Disable for this command
task-master parse-prd prd.txt --no-critical-review
```

### Auto-Apply Changes

**Control whether refined tasks automatically replace original:**

```json
{
  "criticalReview": {
    "autoApply": true  // Set to false for manual review
  }
}
```

If `false`, you'll need to manually apply changes from the report.

### Report Generation

```json
{
  "criticalReview": {
    "generateReport": true  // Set to false to skip reports
  }
}
```

### Evaluation Criteria

**Adjust weights and guidelines:**

```json
{
  "criticalReview": {
    "criteria": {
      "complexity": {
        "enabled": true,
        "weight": 8,
        "guideline": "Your custom guideline..."
      },
      "value": {
        "enabled": true,
        "weight": 10,
        "guideline": "..."
      }
    }
  }
}
```

**Available criteria:**
- `complexity`: Favor simplicity (Weight: 8)
- `value`: Prioritize user value (Weight: 10)
- `philosophy`: PAI+diet103 alignment (Weight: 9)
- `yagni`: Avoid premature work (Weight: 9)
- `risk`: Minimize failure points (Weight: 6)
- `tokenEfficiency`: Minimal overhead (Weight: 7)

---

## Evaluation Criteria Explained

### 1. Complexity (Weight: 8/10)

**What it checks:**
- Is this over-engineered?
- Can it be simpler?
- Frameworks where functions work?
- Services where files work?
- Databases where JSON works?

**Red flags:**
- Tasks requiring >500 lines
- External services
- Sub-agents
- Complex abstractions
- Build pipelines

**Green flags:**
- <100 lines per function
- Self-contained files
- No external dependencies
- Direct implementations

---

### 2. Value (Weight: 10/10)

**What it checks:**
- Does this solve a real user problem?
- Is there actual demand?
- What's the ROI?
- What happens if we skip it?

**Red flags:**
- "Nice to have"
- "For future scaling"
- "Just in case"
- Hypothetical requirements

**Green flags:**
- User-requested features
- Blocking actual work
- Clear success criteria
- Measured pain points

---

### 3. Philosophy (Weight: 9/10)

**What it checks:**
- PAI+diet103 alignment
- Skills-as-Containers pattern
- Token efficiency
- Progressive disclosure
- Clear boundaries

**Red flags:**
- Cross-skill dependencies
- Heavy context loading
- Monolithic structures
- Framework overuse

**Green flags:**
- Self-contained skills
- Lazy loading
- Auto-activation
- Hook-based architecture

---

### 4. YAGNI (Weight: 9/10)

**What it checks:**
- Building for hypothetical futures?
- Premature abstraction?
- Premature optimization?
- Infrastructure before features?

**Red flags:**
- "We might need..."
- "For flexibility..."
- "To scale..."
- "Future-proofing..."

**Green flags:**
- "Users need..."
- "Blocking X..."
- "Measured Y..."
- "Solves Z..."

---

### 5. Risk (Weight: 6/10)

**What it checks:**
- Failure modes
- Dependencies
- Maintenance burden
- Debugging difficulty
- Rollback capability

**Red flags:**
- Cascading dependencies
- External services
- Complex error handling
- Hard to test

**Green flags:**
- Isolated changes
- Easy to rollback
- Fast to implement
- Simple to debug

---

### 6. Token Efficiency (Weight: 7/10)

**What it checks:**
- Context overhead
- Lazy loading
- Progressive disclosure
- Cache clearing

**Red flags:**
- Eager loading
- Persistent heavy context
- "Just in case" imports
- No cleanup

**Green flags:**
- Load on demand
- Clear after use
- Minimal persistent state
- Progressive loading

---

## Real-World Example

### Before Evaluation

```json
[
  {
    "id": "72",
    "title": "Partnership Level Configuration System",
    "description": "Build flexible partnership tiers with configuration...",
    "complexity": "HIGH",
    "estimatedLOC": 800
  },
  {
    "id": "75",
    "title": "Feasibility Checker Sub-Agent",
    "description": "Python agent with asyncio for parallel feasibility checking...",
    "complexity": "HIGH",
    "estimatedLOC": 1200
  },
  {
    "id": "77",
    "title": "Build Custom MCPs (Registry, Docs, Cost)",
    "description": "Create 3 separate MCPs with FastAPI, SQLite, OpenAPI parsing...",
    "complexity": "HIGH",
    "estimatedLOC": 3000
  }
]
```

**Issues:**
- 9 tasks total
- ~5000+ LOC estimated
- 3 external services
- 1 sub-agent
- 2 databases

---

### After Evaluation

```json
[
  {
    "id": "73",
    "title": "Research MCP Integration (Simplified)",
    "description": "Direct Perplexity API integration with 5-min cache",
    "complexity": "LOW",
    "estimatedLOC": 100
  },
  {
    "id": "76",
    "title": "Test Connection Workflow (Simplified)",
    "description": "Simple API test endpoint",
    "complexity": "LOW",
    "estimatedLOC": 50
  },
  {
    "id": "79",
    "title": "Document Decisions in YAML",
    "description": "Add decision tracking to YAML schema",
    "complexity": "LOW",
    "estimatedLOC": 20
  }
]
```

**Improvements:**
- 3 tasks total (9 → 3, 67% reduction)
- ~170 LOC estimated (5000 → 170, 97% reduction)
- 0 external services (3 → 0)
- 0 sub-agents (1 → 0)
- 0 databases (2 → 0)

---

### Evaluation Report Excerpt

```markdown
## Task #72: Partnership Level Configuration

**Action:** CANCELLED

**Rationale:** 
Premature abstraction. Building "partnership levels" before having 
any users/partners. Violates YAGNI principle. Wait until actual 
partnership requirements emerge from real usage.

**Criteria Violated:**
- YAGNI (Weight: 9/10): Hypothetical requirement
- Value (Weight: 10/10): No current users
- Complexity (Weight: 8/10): Unnecessary abstraction

**LOC Saved:** ~800 lines

---

## Task #75: Feasibility Checker Sub-Agent

**Action:** CANCELLED

**Rationale:**
Massive over-engineering. Python agent with asyncio for parallel 
execution. "Feasibility scoring" is subjective and misleading. 
Better to just TRY the integration and see if it works.

**Alternative:** 
Replace with simple "test connection" workflow (see Task #76).

**Criteria Violated:**
- Complexity (Weight: 8/10): Sub-agent unnecessary
- Philosophy (Weight: 9/10): Violates simplicity-first
- YAGNI (Weight: 9/10): Solving imagined problem

**LOC Saved:** ~1200 lines
```

---

## Workflow Integration

### Standard Workflow (Automatic)

```bash
# 1. Write PRD
echo "Feature requirements..." > prd.txt

# 2. Parse PRD (automatic evaluation)
task-master parse-prd prd.txt
# → Generates tasks
# → Automatically evaluates
# → Saves refined tasks
# → Generates report

# 3. Review report
code .taskmaster/reports/critical-review-*.md

# 4. Start implementation
task-master next
```

### Manual Review Workflow

**If you want manual control:**

```json
{
  "criticalReview": {
    "autoApply": false  // Require manual approval
  }
}
```

```bash
# 1. Generate tasks
task-master parse-prd prd.txt

# 2. Evaluation happens automatically but doesn't apply

# 3. Review report
code .taskmaster/reports/critical-review-*.md

# 4. Manual decision:
#    - Accept: Copy refined tasks from report
#    - Reject: Keep original tasks
#    - Modify: Edit and re-evaluate

# 5. If accepting, manually update tasks.json
cp .taskmaster/reports/refined-tasks.json .taskmaster/tasks/tasks.json
```

---

## Advanced Usage

### Custom Evaluation Prompt

**Add custom context for specific evaluations:**

```bash
task-master parse-prd prd.txt --critical-review-prompt="
  Additional context:
  - This is for MVP, prioritize speed
  - Budget constraint: 1 week max
  - Team size: 1 developer
"
```

### Batch Evaluation

**Evaluate multiple task files:**

```bash
for file in .taskmaster/tasks/*.json; do
  node .taskmaster/scripts/critical-task-evaluator.js --tasks "$file"
done
```

### Integration with CI/CD

**Automate evaluation in GitHub Actions:**

```yaml
name: Task Evaluation

on:
  push:
    paths:
      - '.taskmaster/tasks/tasks.json'

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Evaluate Tasks
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          node .taskmaster/scripts/critical-task-evaluator.js
          
      - name: Upload Report
        uses: actions/upload-artifact@v2
        with:
          name: evaluation-report
          path: .taskmaster/reports/critical-review-*.md
```

---

## Troubleshooting

### Evaluation Not Running

**Check configuration:**
```bash
# Verify critic enabled
cat .taskmaster/config.json | jq '.models.critic.enabled'
# Should output: true

# Verify critical review enabled
cat .taskmaster/config.json | jq '.global.enableCriticalReview'
# Should output: true
```

**Check API key:**
```bash
# For CLI
echo $ANTHROPIC_API_KEY

# For MCP
cat .cursor/mcp.json | jq '.mcpServers.taskmaster.env.ANTHROPIC_API_KEY'
```

---

### Report Not Generated

**Enable report generation:**
```json
{
  "criticalReview": {
    "generateReport": true
  }
}
```

**Check permissions:**
```bash
# Ensure reports directory is writable
ls -ld .taskmaster/reports/
# Should show: drwxr-xr-x
```

---

### Tasks Not Auto-Applying

**Check auto-apply setting:**
```json
{
  "criticalReview": {
    "autoApply": true  // Must be true for auto-apply
  }
}
```

**Manual apply if needed:**
```bash
# Extract refined tasks from report
jq '.refinedTasks' .taskmaster/reports/critical-review-*.json > tasks.json
```

---

### API Errors

**Rate limiting:**
```bash
# Reduce concurrent evaluations
# Add delay between calls
sleep 2 && node .taskmaster/scripts/critical-task-evaluator.js
```

**Token limits:**
```json
{
  "models": {
    "critic": {
      "maxTokens": 120000  // Adjust if hitting limits
    }
  }
}
```

---

## Performance

**Typical Evaluation Times:**
- Small tasks (<5): 10-20 seconds
- Medium tasks (5-15): 30-45 seconds
- Large tasks (15+): 60-90 seconds

**Cost Estimates (Claude 3.7 Sonnet):**
- Input: ~$3 per 1M tokens
- Output: ~$15 per 1M tokens
- Average evaluation: $0.05-0.20

**Optimization tips:**
- Use lower temperature (0.1) for consistency
- Enable caching for repeated evaluations
- Use fallback model for non-critical evaluations

---

## Best Practices

### 1. Write Good PRDs

**The better your PRD, the better the initial tasks:**
- Be specific about requirements
- Include success criteria
- Mention constraints (time, budget, team size)
- Reference system philosophy

### 2. Review Reports

**Always review evaluation reports:**
- Understand why tasks were changed
- Learn patterns for future PRDs
- Identify recurring issues

### 3. Iterate

**Use feedback to improve:**
- If critic consistently cancels certain types of tasks, stop proposing them
- If critic suggests simplifications, apply those patterns earlier
- Update PRD templates based on patterns

### 4. Trust the Process

**The critic is ruthless for good reason:**
- It prevents technical debt
- It saves implementation time
- It improves maintainability
- It enforces consistency

---

## FAQ

### Q: Can I disable evaluation for specific tasks?

**A:** Yes, use task-level flags:

```json
{
  "id": "1",
  "title": "Special Task",
  "skipCriticalReview": true
}
```

### Q: Can I use a different model for evaluation?

**A:** Yes, configure in `.taskmaster/config.json`:

```json
{
  "models": {
    "critic": {
      "provider": "openai",
      "modelId": "gpt-4-turbo"
    }
  }
}
```

### Q: What if I disagree with the evaluation?

**A:** Three options:

1. **Accept**: Trust the process, it's usually right
2. **Override**: Disable auto-apply and manually keep original
3. **Refine**: Update PRD with more context and re-evaluate

### Q: Can I customize evaluation criteria?

**A:** Yes, in `.taskmaster/config.json`:

```json
{
  "criticalReview": {
    "criteria": {
      "myCustomCriterion": {
        "enabled": true,
        "weight": 8,
        "guideline": "Your guideline here"
      }
    }
  }
}
```

### Q: Does this work with MCP tools?

**A:** Yes, MCP tools automatically use critical review if enabled in config.

---

## Reference

### Files

- **Config**: `.taskmaster/config.json`
- **Philosophy**: `.taskmaster/docs/SYSTEM_PHILOSOPHY.md`
- **Script**: `.taskmaster/scripts/critical-task-evaluator.js`
- **Template**: `.taskmaster/templates/evaluation-report.md`
- **Reports**: `.taskmaster/reports/critical-review-*.{json,md}`

### Commands

```bash
# Evaluate tasks
node .taskmaster/scripts/critical-task-evaluator.js

# With options
node .taskmaster/scripts/critical-task-evaluator.js --tasks path/to/tasks.json --dry-run

# Help
node .taskmaster/scripts/critical-task-evaluator.js --help
```

### Configuration Keys

```json
{
  "models.critic.enabled": "Enable/disable critic model",
  "global.enableCriticalReview": "Global on/off switch",
  "criticalReview.enabled": "Feature toggle",
  "criticalReview.autoApply": "Auto-apply refined tasks",
  "criticalReview.generateReport": "Generate evaluation reports",
  "criticalReview.criteria.*": "Evaluation criteria configuration"
}
```

---

## Next Steps

1. ✅ **System is configured and ready**
2. ⏳ **Generate your first tasks** with `task-master parse-prd`
3. ⏳ **Review the evaluation report** in `.taskmaster/reports/`
4. ⏳ **Start implementing** refined tasks
5. ⏳ **Iterate** based on feedback

---

**The Goal:**

> Eliminate the manual "god programmer" review step while maintaining ruthless quality standards.

**The Result:**

> Every task you implement is already battle-tested against over-engineering, YAGNI violations, and premature optimization.

---

*For questions or issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or consult [SYSTEM_PHILOSOPHY.md](./SYSTEM_PHILOSOPHY.md)*

