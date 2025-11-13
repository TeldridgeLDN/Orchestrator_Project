# Quick Start: Critical Task Evaluation

**Time to Setup:** 2 minutes  
**Time to First Evaluation:** 30 seconds  
**Status:** ✅ Ready to use

---

## What Is This?

Automatic "god programmer" critical review of all tasks. No more manual copy/paste workflow.

**Before:**
```
You: "Here are some tasks"
Claude: [generates tasks]
You: "Now as a god-like programmer, critically evaluate these"
Claude: [evaluates]
You: [copy/paste refined tasks]
```

**After:**
```bash
task-master parse-prd prd.txt
# → Auto-generates AND auto-evaluates
# → Saves refined tasks
# → Generates detailed report
# → Done!
```

---

## Setup (Already Done!)

Your system is already configured. Check:

```bash
# Should show critic config
cat .taskmaster/config.json | jq '.models.critic'

# Should output: true
cat .taskmaster/config.json | jq '.global.enableCriticalReview'
```

**If not configured**, run:

```bash
# Will be added to Taskmaster CLI in future
# For now, config is manual - but already done for you!
```

---

## Usage

### Option 1: Automatic (Default)

**Just use Taskmaster normally:**

```bash
# Parse PRD - automatic evaluation
task-master parse-prd prd.txt

# Add task - automatic evaluation  
task-master add-task --prompt="Implement feature X"

# That's it! Evaluation happens automatically.
```

**Check the report:**

```bash
# View latest evaluation
ls -lt .taskmaster/reports/critical-review-*.md | head -1 | xargs cat
```

---

### Option 2: Manual Evaluation

**Evaluate existing tasks:**

```bash
# Basic usage
node .taskmaster/scripts/critical-task-evaluator.js

# Specific file
node .taskmaster/scripts/critical-task-evaluator.js --tasks path/to/tasks.json

# Dry run (see prompt without API call)
node .taskmaster/scripts/critical-task-evaluator.js --dry-run
```

---

## What Gets Evaluated?

### ✅ KEEPS (Simplified)

Tasks that solve real problems with simple implementations:

```json
{
  "id": "1",
  "title": "Simple Perplexity Integration",
  "description": "Direct API call with 5-min cache",
  "estimatedLOC": 100
}
```

**Why kept:** 
- Solves real user need (research)
- Simple implementation (<100 LOC)
- No external services
- High value

---

### ❌ CANCELS

Tasks that violate core principles:

```json
{
  "id": "2",
  "title": "Build MCP Registry System",
  "description": "3 MCPs with FastAPI, SQLite, OpenAPI parser",
  "estimatedLOC": 3000
}
```

**Why cancelled:**
- Over-engineering (3 services for static data)
- YAGNI violation (no users yet)
- Violates simplicity (file would work)
- Low ROI (3000 LOC for list of URLs)

**Better approach:** Markdown file with URL list

---

### 🔄 MERGES

Redundant tasks combined:

```json
// Before (2 tasks)
[
  { "id": "3", "title": "Setup Authentication" },
  { "id": "4", "title": "Add JWT Tokens" }
]

// After (1 task)
[
  { "id": "3", "title": "Setup JWT Authentication" }
]
```

**Why merged:** Same feature, artificial split

---

### ⚠️ SIMPLIFIES

Complex tasks reduced to essentials:

```json
// Before
{
  "title": "Build Caching Layer",
  "description": "Redis, fallback chains, TTL strategies...",
  "estimatedLOC": 800
}

// After
{
  "title": "Add Simple Cache",
  "description": "In-memory Map with 5-min TTL",
  "estimatedLOC": 50
}
```

**Why simplified:** Over-engineered for actual need

---

## Evaluation Criteria

### 1. **Complexity** (Weight: 8/10)
- Can this be simpler?
- Frameworks where functions work?
- Services where files work?

### 2. **Value** (Weight: 10/10)
- Solves real user problem?
- Actual or hypothetical need?
- Clear success criteria?

### 3. **Philosophy** (Weight: 9/10)
- PAI+diet103 alignment
- Token efficient
- Skills-as-Containers pattern

### 4. **YAGNI** (Weight: 9/10)
- "We might need..." → ❌
- "Users are asking..." → ✅
- Premature optimization → ❌

### 5. **Risk** (Weight: 6/10)
- Failure modes
- Dependencies
- Maintenance burden

### 6. **Token Efficiency** (Weight: 7/10)
- Minimal overhead
- Lazy loading
- Progressive disclosure

---

## Real Example

### Your Recent Scenario Builder Tasks

**Before Evaluation: 9 tasks, ~5000 LOC**

```json
[
  { "id": "72", "title": "Partnership Level Config", "loc": 800 },
  { "id": "75", "title": "Feasibility Checker Agent", "loc": 1200 },
  { "id": "77", "title": "Build Custom MCPs", "loc": 3000 },
  // ... 6 more
]
```

**After Evaluation: 3 tasks, ~170 LOC**

```json
[
  { "id": "73", "title": "Simple Perplexity API", "loc": 100 },
  { "id": "76", "title": "Test Connection", "loc": 50 },
  { "id": "79", "title": "Add YAML Decision Field", "loc": 20 }
]
```

**Result:**
- ✅ 90% less code
- ✅ 0 external services (was 3)
- ✅ 0 sub-agents (was 1)
- ✅ 0 databases (was 2)
- ✅ Same user value

---

## Configuration

### Disable Evaluation

**Globally:**
```json
{
  "global": {
    "enableCriticalReview": false
  }
}
```

**Per command:**
```bash
task-master parse-prd prd.txt --no-critical-review
```

---

### Disable Auto-Apply

**Review before applying:**
```json
{
  "criticalReview": {
    "autoApply": false
  }
}
```

Now refined tasks go to report, you apply manually.

---

### Adjust Criteria Weights

```json
{
  "criticalReview": {
    "criteria": {
      "complexity": {
        "weight": 10,  // Make even stricter
        "enabled": true
      },
      "value": {
        "weight": 5,   // Make more lenient
        "enabled": true
      }
    }
  }
}
```

---

## Output

### Evaluation Report

**Location:** `.taskmaster/reports/critical-review-TIMESTAMP.md`

**Contains:**
- Overall assessment
- Detailed changes (CANCEL, SIMPLIFY, MERGE, KEEP)
- Impact summary (LOC reduction, service count, etc.)
- Refined task list
- Lessons learned

**Example excerpt:**

```markdown
## Task #75: Feasibility Checker Sub-Agent

**Action:** CANCELLED

**Rationale:** 
Massive over-engineering. Python agent with asyncio 
for parallel execution. Better to just TRY the 
integration and see if it works.

**Criteria Violated:**
- Complexity (8/10): Unnecessary sub-agent
- Philosophy (9/10): Violates simplicity
- YAGNI (9/10): Solving imagined problem

**LOC Saved:** ~1200 lines

**Alternative:** 
Simple function to test API connection (~50 LOC)
```

---

## Troubleshooting

### Not Running?

```bash
# Check config
cat .taskmaster/config.json | jq '.global.enableCriticalReview'

# Check API key
echo $ANTHROPIC_API_KEY
```

### No Report Generated?

```bash
# Enable reports
# Edit .taskmaster/config.json:
{
  "criticalReview": {
    "generateReport": true
  }
}
```

### Tasks Not Applying?

```bash
# Enable auto-apply
# Edit .taskmaster/config.json:
{
  "criticalReview": {
    "autoApply": true
  }
}
```

---

## Tips

### 1. Trust the Process

If the critic cancels a task, there's a good reason:
- YAGNI violation
- Over-engineering
- Premature optimization
- Low user value

### 2. Learn from Reports

Review reports to improve your PRDs:
- See what gets cancelled → stop proposing
- See what gets simplified → start simpler
- See patterns → apply them earlier

### 3. Start Simple

Better to start too simple than too complex:
- Simple → Easy to add complexity later
- Complex → Hard to simplify later

### 4. Question Frameworks

Before proposing a framework/service/agent, ask:
- Can a function do this?
- Can a file do this?
- Do I have actual users needing this?

---

## Next Steps

1. ✅ **Configuration is done**
2. ⏳ **Generate tasks** (they'll auto-evaluate)
3. ⏳ **Review the report**
4. ⏳ **Start implementing** refined tasks
5. ⏳ **Learn patterns** for next time

---

## See Also

- **Full Guide:** [CRITICAL_TASK_EVALUATION.md](./CRITICAL_TASK_EVALUATION.md)
- **Philosophy:** [SYSTEM_PHILOSOPHY.md](./SYSTEM_PHILOSOPHY.md)
- **Example:** [TASK_SIMPLIFICATION_REVIEW.md](./TASK_SIMPLIFICATION_REVIEW.md)

---

**The One-Sentence Summary:**

> Your manual "god programmer" review is now automatic, consistent, and documented.

---

**Questions?**

- Read the full guide: [CRITICAL_TASK_EVALUATION.md](./CRITICAL_TASK_EVALUATION.md)
- Review system philosophy: [SYSTEM_PHILOSOPHY.md](./SYSTEM_PHILOSOPHY.md)
- See real example: [TASK_SIMPLIFICATION_REVIEW.md](./TASK_SIMPLIFICATION_REVIEW.md)

