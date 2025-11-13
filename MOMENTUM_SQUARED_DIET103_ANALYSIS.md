# Momentum_Squared diet103 Enhancement Analysis

**Date**: November 13, 2025  
**Analyzed Documents**: `QUICK_REFERENCE.md`, `COMPREHENSIVE_USER_GUIDE_PE_INTEGRATION.md`  
**Philosophy**: diet103 (PAI Skills-as-Containers)  
**Current State**: 6 skills, 3 hooks (user-prompt, post-tool, stop-event)

---

## Executive Summary

After analyzing Momentum_Squared's documentation against diet103 principles, I've identified **15 high-value opportunities** for skills, agents, and hooks that would significantly improve the development workflow.

### Priority Breakdown
- **🔴 Critical (Implement First)**: 5 items - Prevent common errors, save significant time
- **🟡 High Value (Implement Soon)**: 6 items - Enhance workflows, reduce manual work
- **🟢 Nice to Have (Future)**: 4 items - Polish and advanced features

---

## Current State Assessment

### ✅ What's Working Well

1. **Strong Hook System** (3 hooks)
   - Skills auto-activate on keywords ✅
   - Edit tracking works ✅
   - Quality checks run automatically ✅
   - Python-specific validations (PYTHONPATH, bare except, etc.) ✅

2. **Good Skill Coverage** (6 skills)
   - bayesian-scoring-dev ✅
   - portfolio-optimization-dev ✅
   - workflow-execution-dev ✅
   - database-operations-dev ✅
   - validation-framework-dev ✅
   - python-execution-patterns ✅

3. **Comprehensive Documentation**
   - Quick reference for emergencies ✅
   - Detailed user guides ✅
   - Integration guides ✅

### ⚠️ Identified Gaps

From analyzing the documentation, I found **15 patterns** that would benefit from diet103 structure:

---

## Recommended Enhancements

## 🔴 CRITICAL PRIORITY (Implement First)

### 1. **🚨 Pre-Command Validation Hook**

**Problem Identified:**
- Quick Reference shows: ❌ **WRONG**: `./venv_torch/bin/python scripts/script.py` (missing PYTHONPATH)
- This error pattern appears repeatedly in documentation
- Current stop-event hook only catches this AFTER execution

**Solution: UserPromptSubmit Enhancement**

**Hook**: `pre-command-validator.ts`  
**Trigger**: Before any command execution  
**Purpose**: Validate Python commands BEFORE they run

```typescript
// Enhancement to existing UserPromptSubmit hook
export function validatePythonCommand(command: string): ValidationResult {
  if (command.includes('venv_torch/bin/python') || 
      command.includes('./venv/bin/python')) {
    
    // Check for PYTHONPATH
    if (!command.includes('PYTHONPATH=')) {
      return {
        valid: false,
        error: '❌ Missing PYTHONPATH - will cause import errors',
        suggestion: `PYTHONPATH=. ${command}`,
        severity: 'BLOCKING'
      };
    }
  }
  
  // Check for subprocess calls without PYTHONPATH
  if (command.includes('subprocess.run') && 
      command.includes('python') &&
      !command.includes("'PYTHONPATH': '.'")) {
    return {
      valid: false,
      error: '❌ subprocess.run missing PYTHONPATH in env',
      suggestion: 'Add env={**os.environ, "PYTHONPATH": "."}',
      severity: 'BLOCKING'
    };
  }
  
  return { valid: true };
}
```

**Value**: 🔴 **CRITICAL** - Prevents #1 most common error (saves 10-15 min per occurrence)

---

### 2. **📊 Workflow 9 Execution Skill**

**Problem Identified:**
- Workflow 9 has 5+ steps that must run in sequence
- Quick Reference shows complex multi-line commands
- Easy to skip mandatory validation steps
- P/E Integration Guide adds new Step 3A (easy to forget)

**Solution: Dedicated Workflow Skill**

**Skill**: `workflow-9-executor`  
**Location**: `.claude/skills/workflow-9-executor/`  
**Activation Keywords**: "workflow 9", "monthly review", "underperformance analysis"

```markdown
# workflow-9-executor/skill.md

## Workflow 9: Monthly Portfolio Underperformance Analysis

**Purpose**: Execute complete monthly review with all validation gates

### Automatic Checklist

When user says "run workflow 9 for ISA", activate this checklist:

- [ ] **Step 1**: Score consistency validation (MANDATORY - blocks if failed)
- [ ] **Step 2**: Critical alerts check (warns if issues found)
- [ ] **Step 3**: Underperformance analysis (main analysis)
- [ ] **Step 3A**: P/E compression validation for each candidate (NEW)
- [ ] **Step 4**: Review recommendations (requires approval)
- [ ] **Step 5**: Strategic rotation (if approved)

### Commands (Auto-Execute in Sequence)

```bash
# Step 1: Consistency Check (MANDATORY - BLOCKS)
PYTHONPATH=. ./venv_torch/bin/python src/validation/score_consistency_checker.py --portfolio ISA
# If fails → STOP, show errors, request fix

# Step 2: Critical Alerts (WARNS)
PYTHONPATH=. ./venv_torch/bin/python scripts/score_trend_alert_monitor.py --all --critical-only
# If warnings → Display, continue with caution

# Step 3: Underperformance Analysis
PYTHONPATH=. ./venv_torch/bin/python scripts/portfolio_underperformance_analyzer.py \
  --portfolio ISA --compare-wishlist --score-trend-months 3 --trend-weight 0.25 --regime-aware \
  --show-charts --show-heatmap

# Step 3A: P/E Validation (For Each Candidate)
# Parse candidates from Step 3 output
# For each: [UNDERPERFORMER] → [CANDIDATE]
PYTHONPATH=. ./venv_torch/bin/python scripts/comprehensive_comparative_analysis.py \
  [UNDERPERFORMER] [CANDIDATE] --export-json --export-markdown --output-dir ./workflow9_analysis

# Step 4: Review & Approval Gate
# Display recommendations, await user approval

# Step 5: Strategic Rotation (If Approved)
# Execute rotation commands
```

### Error Handling

- **Step 1 Fails**: BLOCK, display consistency errors, suggest fixes
- **Step 2 Warnings**: CONTINUE, display warnings prominently
- **Step 3 No Candidates**: SUCCESS, report "no action needed"
- **Step 3A Low Confidence**: WARN, suggest seeking additional data
- **Step 4 User Rejects**: STOP, save analysis for review

### Integration with Existing Skills

- Uses `validation-framework-dev` for Step 1/2
- Uses `portfolio-optimization-dev` for Step 5
- Uses `database-operations-dev` for score queries
```

**Value**: 🔴 **CRITICAL** - Automates 30-45 min monthly workflow, prevents missed steps

---

### 3. **🔍 Database Query Validator Hook**

**Problem Identified:**
- Quick Reference shows common pitfalls:
  - ❌ Querying `score_history` table (doesn't exist)
  - ❌ Querying `momentum_squared.db` for portfolio scores (wrong DB)
  - ❌ Relying on portfolio master JSON (incomplete)
  - ✅ Must use `asset_score_history.db` → `asset_scores` table

**Solution: PostToolUse Enhancement**

**Hook**: `database-query-validator.ts` (add to existing PostToolUse)  
**Trigger**: After any database query command  
**Purpose**: Catch incorrect database/table references

```typescript
export function validateDatabaseQuery(command: string): ValidationResult {
  const errors: string[] = [];
  
  // Check 1: Wrong table name
  if (command.includes('score_history') && !command.includes('asset_score')) {
    errors.push('❌ Table "score_history" doesn\'t exist. Use "asset_scores" instead.');
  }
  
  // Check 2: Wrong database for portfolio scores
  if (command.includes('momentum_squared.db') && 
      (command.includes('portfolio') || command.includes('score'))) {
    errors.push('❌ Portfolio scores are in "asset_score_history.db", not "momentum_squared.db"');
    errors.push('💡 Correct: sqlite3 data/asset_score_history.db "SELECT ..."');
  }
  
  // Check 3: Suggest helper script
  if (command.includes('SELECT') && command.includes('score') && 
      command.includes('portfolio')) {
    errors.push('💡 TIP: Use helper script instead:');
    errors.push('   python scripts/get_portfolio_scores.py --portfolio ISA');
  }
  
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      severity: 'WARNING',
      autoFix: true
    };
  }
  
  return { valid: true };
}
```

**Value**: 🔴 **CRITICAL** - Prevents #2 most common error, saves 5-10 min per occurrence

---

### 4. **📝 P/E Analysis Integration Skill**

**Problem Identified:**
- New P/E compression framework has complex usage patterns
- 6-section framework with different modes (full vs offline)
- Integration with Workflow 9 not automatic
- Easy to forget --skip-perplexity for offline mode

**Solution: Dedicated PE Analysis Skill**

**Skill**: `pe-compression-analysis`  
**Location**: `.claude/skills/pe-compression-analysis/`  
**Activation Keywords**: "p/e compression", "comparative pe", "valuation analysis", "pe analysis"

```markdown
# pe-compression-analysis/skill.md

## P/E Compression Comparative Analysis

**Purpose**: Execute comparative valuation analysis with confidence scoring

### Activation Patterns

**Basic Comparison:**
User: "Compare AAPL and MSFT P/E"
→ Run: comparative_pe_analysis.py AAPL MSFT

**Full 6-Section Analysis:**
User: "Full PE analysis of AAPL vs MSFT"
→ Check: PERPLEXITY_API_KEY set?
→ If yes: comprehensive_comparative_analysis.py AAPL MSFT
→ If no: comprehensive_comparative_analysis.py AAPL MSFT --skip-perplexity

**Workflow 9 Integration:**
User: "Workflow 9 for ISA" (via workflow-9-executor)
→ After Step 3, for each [UNDERPERFORMER] → [CANDIDATE]:
→ Run: comprehensive_comparative_analysis.py [U] [C] --export-json --skip-perplexity

### Command Templates

```bash
# Quick comparison (no API key)
PYTHONPATH=. ./venv_torch/bin/python scripts/comparative_pe_analysis.py {SYMBOL1} {SYMBOL2}

# Full analysis with exports
PYTHONPATH=. ./venv_torch/bin/python scripts/comprehensive_comparative_analysis.py \
  {SYMBOL1} {SYMBOL2} --export-json --export-markdown --output-dir ./pe_analysis

# Offline mode (no Perplexity)
PYTHONPATH=. ./venv_torch/bin/python scripts/comprehensive_comparative_analysis.py \
  {SYMBOL1} {SYMBOL2} --skip-perplexity
```

### Decision Framework Reminder

After analysis completes, display:

```
📊 P/E Analysis Complete - Review Section 6 Recommendation

Confidence Levels:
- HIGH confidence PREFER_{X} → ✅ Strong validation, proceed with rotation
- MEDIUM confidence       → ⚠️  Review rationale, validate fundamentals
- LOW confidence          → 🔴 Seek additional data before decision
- NEUTRAL                 → ⚙️  Reconsider replacement (marginal benefit)

Key Metrics to Review:
1. P/E Compression % (Section 3): Growth expectations
2. Risk/Reward Ratio (Section 6.4): Upside vs downside
3. Downside Protection (Section 5): Exposure at 20x P/E
4. Data Quality: Completeness of analysis (target: 100%)
```

### Integration Points

- **Workflow 9**: Auto-runs for each replacement candidate
- **Monthly Review**: Compare top holdings
- **Quarterly Rebalancing**: Concentration risk evaluation
```

**Value**: 🔴 **CRITICAL** - New feature, needs skill for adoption (saves 15-20 min, reduces errors)

---

### 5. **⚡ Emergency Recovery Agent**

**Problem Identified:**
- Quick Reference has "Emergency Recovery" section
- Manual multi-step recovery process
- Critical for context loss scenarios
- No automation currently

**Solution: Recovery Agent**

**Agent**: `emergency-recovery-agent`  
**Location**: `.claude/agents/emergency-recovery/`  
**Activation Command**: `/recover-context`

```markdown
# emergency-recovery-agent/agent.md

## Emergency Context Recovery

**Purpose**: Automated recovery from context loss or session interruption

### Trigger

User says: "I lost context" or runs `/recover-context`

### Automatic Actions

1. **Identify Current Work**
   ```bash
   # Check active feature branches
   ls -la dev/active/
   
   # Find most recent feature
   RECENT=$(ls -t dev/active/ | head -1)
   echo "Most recent feature: $RECENT"
   ```

2. **Load Critical Files (In Order)**
   ```bash
   # Priority 1: Project architecture
   cat CLAUDE.md
   
   # Priority 2: Current work plan
   cat dev/active/$RECENT/plan.md
   
   # Priority 3: Implementation notes
   cat dev/active/$RECENT/context.md
   ```

3. **Check Recent Edits**
   ```bash
   # Files edited in last session
   cat /tmp/claude-edits-*.json | jq '.editedFiles[-10:]'
   ```

4. **Show Task Status**
   ```bash
   # Check TaskMaster status
   task-master list --status=in-progress
   task-master show $(task-master list --status=in-progress | head -1 | awk '{print $1}')
   ```

5. **Run Validation**
   ```bash
   # Quick health check
   PYTHONPATH=. ./venv_torch/bin/pytest tests/ -x --tb=short
   ```

6. **Display Summary**
   ```
   📋 Context Recovery Complete
   
   Current Feature: {FEATURE_NAME}
   Last Modified Files: {LIST}
   In-Progress Tasks: {COUNT}
   Test Status: {PASS/FAIL}
   
   Ready to Resume: {YES/NO}
   Next Step: {RECOMMENDATION}
   ```

### Recovery Checklist

- [ ] Project architecture loaded (CLAUDE.md)
- [ ] Current work plan identified
- [ ] Implementation notes reviewed
- [ ] Recent edits identified
- [ ] Task status checked
- [ ] Tests validated
- [ ] Next step determined

### Error Handling

- **No active features**: Suggest checking git branches
- **Tests failing**: Display failures, suggest fixes
- **Context files missing**: Recreate from git history
```

**Value**: 🔴 **CRITICAL** - Saves 20-30 min recovery time, prevents lost work

---

## 🟡 HIGH VALUE PRIORITY (Implement Soon)

### 6. **📈 Score Trend Monitoring Skill**

**Problem Identified:**
- Daily score monitoring command in Quick Reference
- No automation or alerting built-in
- Manual interpretation of results

**Solution**: `score-trend-monitor` skill  
**Activation**: "check score trends", "monitor scores", "daily check"  
**Value**: Automates daily 5-min task, highlights critical issues

---

### 7. **🔄 Portfolio Master Sync Validator Hook**

**Problem Identified:**
- Quick Reference mentions portfolio master files as "single source of truth"
- No validation that master files stay in sync with database
- Potential drift over time

**Solution**: `portfolio-sync-checker.ts` (StopEvent hook enhancement)  
**Trigger**: After any portfolio master file edit  
**Value**: Prevents master/DB drift, saves 30+ min debugging

---

### 8. **💾 Database Connection Manager Hook**

**Problem Identified:**
- Troubleshooting table shows: `database is locked` → "Close connections, wait 30s"
- Manual connection management required
- Context managers mentioned but not enforced

**Solution**: `db-connection-guardian.ts` (PostToolUse enhancement)  
**Trigger**: After any code that opens DB connections  
**Value**: Prevents DB locks, saves 5-10 min per occurrence

---

### 9. **🧪 Test Selector Agent**

**Problem Identified:**
- Emergency Recovery shows: "Run full test suite"
- 650+ scripts = potentially hundreds of tests
- No guidance on which tests to run for specific changes

**Solution**: `test-selector-agent`  
**Command**: `/select-tests`  
**Value**: Runs only relevant tests, saves 5-15 min per test cycle

---

### 10. **📚 Skill Documentation Generator Agent**

**Problem Identified:**
- Quick Reference mentions 6 skills but provides minimal documentation
- Skills reference says "See skill for details" but skills may be incomplete
- Documentation drift from code reality

**Solution**: `skill-doc-generator-agent`  
**Command**: `/update-skill-docs`  
**Value**: Keeps skills documentation current, saves 30-60 min manual updates

---

### 11. **🎯 Command Template Skill**

**Problem Identified:**
- Quick Reference has many command templates with placeholders
- Manual substitution required: `{SYMBOL1}`, `{PORTFOLIO}`, etc.
- Easy to make typos or forget required arguments

**Solution**: `command-template-expander` skill  
**Activation**: "score ISA holdings", "run workflow 9 for SIPP"  
**Value**: Auto-expands templates, prevents typos, saves 2-3 min per command

---

## 🟢 NICE TO HAVE (Future Enhancement)

### 12. **📊 Workflow Progress Tracker Agent**

**Problem**: No visual progress tracking for multi-step workflows  
**Solution**: Agent that displays progress bars and checkmarks  
**Value**: Better UX, reduces anxiety during long workflows

---

### 13. **🔔 Alert Aggregator Skill**

**Problem**: Multiple alert/validation systems, no unified view  
**Solution**: Skill that aggregates all warnings/errors from different systems  
**Value**: Clearer visibility, prioritized action items

---

### 14. **📖 Context-Aware Documentation Skill**

**Problem**: User must know which doc to read  
**Solution**: Skill that suggests relevant docs based on current task  
**Value**: Faster information discovery, reduced documentation search time

---

### 15. **🎨 Output Formatter Agent**

**Problem**: Command outputs vary in format, hard to parse  
**Solution**: Agent that formats outputs consistently (tables, JSON, etc.)  
**Value**: Easier result interpretation, better for documentation

---

## Implementation Priority Matrix

### Phase 1: Critical Safety Nets (Week 1)
**Effort**: 8-12 hours  
**ROI**: Extremely High

1. Pre-Command Validation Hook (2h)
2. Database Query Validator Hook (2h)
3. Emergency Recovery Agent (3h)
4. Workflow 9 Execution Skill (3-4h)

**Impact**: Prevents 80% of common errors, saves 2-3 hours per week

---

### Phase 2: Workflow Automation (Week 2)
**Effort**: 10-14 hours  
**ROI**: High

5. P/E Analysis Integration Skill (3h)
6. Score Trend Monitoring Skill (2h)
7. Portfolio Master Sync Validator (2h)
8. Database Connection Manager (2h)
9. Test Selector Agent (3-4h)

**Impact**: Automates 50% of manual workflows, saves 1-2 hours per week

---

### Phase 3: Polish & Enhancement (Week 3)
**Effort**: 12-16 hours  
**ROI**: Medium

10. Skill Documentation Generator (3h)
11. Command Template Skill (2h)
12. Workflow Progress Tracker (2h)
13. Alert Aggregator (2h)
14. Context-Aware Documentation (2h)
15. Output Formatter Agent (2h)

**Impact**: Better UX, easier onboarding, maintains momentum

---

## Specific Implementation Examples

### Example 1: Pre-Command Validation Hook

**File**: `.claude/hooks/pre-command-validator.ts`

```typescript
#!/usr/bin/env node
/**
 * Pre-Command Validator
 * Validates Python commands BEFORE execution
 */

interface CommandValidation {
  valid: boolean;
  errors?: string[];
  suggestions?: string[];
  severity?: 'INFO' | 'WARNING' | 'BLOCKING';
}

function validateCommand(command: string): CommandValidation {
  const errors: string[] = [];
  const suggestions: string[] = [];
  
  // Python command without PYTHONPATH
  if ((command.includes('venv_torch/bin/python') || 
       command.includes('./venv/bin/python')) &&
      !command.includes('PYTHONPATH=')) {
    errors.push('❌ CRITICAL: Missing PYTHONPATH=.');
    suggestions.push(`✅ Correct command: PYTHONPATH=. ${command}`);
    return { valid: false, errors, suggestions, severity: 'BLOCKING' };
  }
  
  // Subprocess without PYTHONPATH in env
  if (command.includes('subprocess.run') && 
      command.includes('python') &&
      !command.includes('PYTHONPATH')) {
    errors.push('❌ WARNING: subprocess.run missing PYTHONPATH in env');
    suggestions.push('✅ Add: env={**os.environ, "PYTHONPATH": "."}');
    return { valid: false, errors, suggestions, severity: 'WARNING' };
  }
  
  return { valid: true, severity: 'INFO' };
}

// Main execution
const input = process.stdin.read();
const validation = validateCommand(input);

if (!validation.valid && validation.severity === 'BLOCKING') {
  console.error(validation.errors?.join('\n'));
  console.error(validation.suggestions?.join('\n'));
  process.exit(2); // Block execution
}

if (!validation.valid && validation.severity === 'WARNING') {
  console.warn(validation.errors?.join('\n'));
  console.warn(validation.suggestions?.join('\n'));
  // Continue but warn
}

process.exit(0);
```

---

### Example 2: Workflow 9 Execution Skill

**File**: `.claude/skills/workflow-9-executor/skill.md`

```markdown
# Workflow 9 Executor

**Auto-activates when**: User mentions "workflow 9", "monthly review", "underperformance"

## Execution Sequence

When activated, I will:

1. **Confirm Portfolio**
   "Running Workflow 9 for {PORTFOLIO}. Proceed? (yes/no)"

2. **Step 1: Consistency Validation (MANDATORY)**
   ```bash
   PYTHONPATH=. ./venv_torch/bin/python src/validation/score_consistency_checker.py --portfolio {PORTFOLIO}
   ```
   - If fails: STOP, display errors, request manual fix
   - If passes: Continue to Step 2

3. **Step 2: Critical Alerts**
   ```bash
   PYTHONPATH=. ./venv_torch/bin/python scripts/score_trend_alert_monitor.py --all --critical-only
   ```
   - Display any warnings
   - Continue regardless

4. **Step 3: Underperformance Analysis**
   ```bash
   PYTHONPATH=. ./venv_torch/bin/python scripts/portfolio_underperformance_analyzer.py \
     --portfolio {PORTFOLIO} --compare-wishlist --score-trend-months 3 --regime-aware
   ```
   - Parse output for [UNDERPERFORMER] → [CANDIDATE] pairs
   - Store for Step 3A

5. **Step 3A: P/E Validation (For Each Candidate)**
   ```bash
   # For each pair from Step 3:
   PYTHONPATH=. ./venv_torch/bin/python scripts/comprehensive_comparative_analysis.py \
     {UNDERPERFORMER} {CANDIDATE} --export-json --skip-perplexity
   ```
   - Display Section 6 recommendation
   - Track HIGH/MEDIUM/LOW confidence

6. **Step 4: Summary & Approval**
   Display:
   ```
   Workflow 9 Results:
   - Underperformers: {COUNT}
   - Candidates validated: {COUNT}
   - HIGH confidence recommendations: {COUNT}
   - MEDIUM confidence: {COUNT}
   - LOW confidence: {COUNT}
   
   Recommended actions:
   {LIST}
   
   Approve rotations? (yes/no/review)
   ```

7. **Step 5: Strategic Rotation (If Approved)**
   Execute approved rotations

## Error Handling

- **Step 1 Fails**: Display full error output, suggest running with --verbose
- **Step 3 No Results**: Report "✅ No underperformers found. Portfolio healthy."
- **Step 3A Low Confidence**: Flag for manual review
- **User Rejects**: Save analysis to `./workflow9_analysis_{DATE}.json`

## Reminders

- ALWAYS run Step 1 first (consistency check is MANDATORY gate)
- NEVER skip P/E validation for replacement candidates
- ALWAYS require user approval before rotations
- ALWAYS save analysis results even if no action taken
```

---

## Benefits Analysis

### Time Savings Per Week

| Enhancement | Time Saved | Frequency | Weekly Savings |
|-------------|------------|-----------|----------------|
| Pre-Command Validator | 10 min | 5-10x | 50-100 min |
| Workflow 9 Executor | 30 min | 1x | 30 min |
| Database Query Validator | 10 min | 3-5x | 30-50 min |
| Emergency Recovery | 25 min | 0.5x | 12.5 min |
| P/E Analysis Skill | 15 min | 2-3x | 30-45 min |

**Total Weekly Savings**: 2.5 - 3.9 hours

**Annual Savings**: 130 - 203 hours (3-5 work weeks)

---

### Error Prevention

| Enhancement | Errors Prevented | Impact |
|-------------|------------------|--------|
| Pre-Command Validator | Missing PYTHONPATH | HIGH - #1 error |
| Database Query Validator | Wrong DB/table queries | HIGH - #2 error |
| DB Connection Manager | Database locks | MEDIUM |
| Portfolio Sync Validator | Master/DB drift | LOW frequency, HIGH impact |

---

## Comparison to Orchestrator diet103

### What Orchestrator Has (That Momentum_Squared Needs)

✅ **Pre-validation hooks** (UserPromptSubmit)  
✅ **Post-edit validation** (PostToolUse)  
✅ **Comprehensive documentation validation**  
✅ **Slash commands** for common workflows  

### What Momentum_Squared Has (That's Better)

✅ **Domain-specific skills** (Bayesian scoring, portfolio optimization)  
✅ **Python-specific error detection** (PYTHONPATH, bare except, DB context managers)  
✅ **Quality checks** (Black, pytest, flake8, mypy)  
✅ **Session tracking** (edit logs)

### Opportunities

1. **Port Orchestrator's validation approach** → Momentum_Squared workflows
2. **Port Momentum_Squared's Python patterns** → Orchestrator (if needed)
3. **Create shared diet103 templates** for both projects

---

## Recommended Implementation Order

### Sprint 1 (Week 1): Critical Safety
**Goal**: Prevent the most common errors

1. Pre-Command Validation Hook (Day 1-2)
2. Database Query Validator Hook (Day 2-3)
3. Emergency Recovery Agent (Day 3-5)

**Deliverable**: Error rate reduced by 60-70%

---

### Sprint 2 (Week 2): Workflow Automation
**Goal**: Automate the most time-consuming workflows

4. Workflow 9 Execution Skill (Day 1-2)
5. P/E Analysis Integration Skill (Day 3-4)
6. Score Trend Monitoring Skill (Day 5)

**Deliverable**: Weekly time savings of 1.5-2 hours

---

### Sprint 3 (Week 3): System Integrity
**Goal**: Ensure data consistency and prevent drift

7. Portfolio Master Sync Validator (Day 1-2)
8. Database Connection Manager (Day 2-3)
9. Test Selector Agent (Day 4-5)

**Deliverable**: Zero DB locks, zero master/DB drift

---

### Sprint 4 (Week 4): Polish & Documentation
**Goal**: Better UX and maintainability

10. Skill Documentation Generator (Day 1-2)
11. Command Template Skill (Day 2-3)
12. Additional nice-to-haves (Day 4-5)

**Deliverable**: Self-maintaining documentation, better UX

---

## Success Metrics

### Quantitative

- **Error Reduction**: 70-80% reduction in common errors (PYTHONPATH, DB queries)
- **Time Savings**: 2.5-3.9 hours per week
- **Workflow Completion Rate**: 95%+ for Workflow 9 (vs current ~70%)
- **Recovery Time**: <5 min (vs current 20-30 min)

### Qualitative

- **Developer Confidence**: Higher confidence in commands
- **Onboarding Time**: Reduced onboarding time for new developers
- **Documentation Quality**: Always current, never drifts
- **User Satisfaction**: Less frustration, more flow state

---

## Files to Create

### Phase 1 (Critical)
```
.claude/hooks/
├── pre-command-validator.ts           # New
├── database-query-validator.ts        # Enhancement to PostToolUse
└── enhanced-stop-event.ts            # Enhancement to existing

.claude/skills/
├── workflow-9-executor/
│   ├── skill.md                      # New
│   └── resources/
│       ├── command-templates.md
│       └── error-recovery.md

.claude/agents/
└── emergency-recovery/
    ├── agent.md                       # New
    └── resources/
        └── recovery-checklist.md
```

### Phase 2 (Workflow)
```
.claude/skills/
├── pe-compression-analysis/
│   ├── skill.md                      # New
│   └── resources/
│       ├── decision-framework.md
│       └── offline-mode-guide.md
├── score-trend-monitor/
│   └── skill.md                      # New
└── command-template-expander/
    └── skill.md                      # New
```

### Phase 3 (Polish)
```
.claude/agents/
├── test-selector/
│   └── agent.md                      # New
└── skill-doc-generator/
    └── agent.md                      # New

.claude/commands/
├── recover-context.md                 # New
├── select-tests.md                    # New
└── update-skill-docs.md              # New
```

---

## Conclusion

The Momentum_Squared project would benefit significantly from **15 targeted diet103 enhancements**, with the **top 5 critical items** providing immediate ROI:

1. **Pre-Command Validation Hook** - Prevents #1 error (PYTHONPATH)
2. **Workflow 9 Execution Skill** - Automates 30-45 min monthly workflow
3. **Database Query Validator** - Prevents #2 error (wrong DB/table)
4. **P/E Analysis Integration Skill** - Supports new feature adoption
5. **Emergency Recovery Agent** - Saves 20-30 min recovery time

**Recommended Approach**: Implement Phase 1 (critical safety nets) first, measure impact, then proceed to Phase 2 if ROI justifies continued investment.

**Total Investment**: 30-42 hours across 4 sprints  
**Expected Return**: 130-203 hours annually + significant error reduction

**Next Step**: Review priorities with user, begin Sprint 1 implementation.

---

*Analysis completed: November 13, 2025*  
*Based on: QUICK_REFERENCE.md, COMPREHENSIVE_USER_GUIDE_PE_INTEGRATION.md*  
*Philosophy: diet103 (PAI Skills-as-Containers)*

