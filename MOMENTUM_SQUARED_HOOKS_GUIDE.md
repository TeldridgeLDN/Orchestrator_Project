# Momentum_Squared Hooks Guide

**Project**: Momentum_Squared  
**Hook System**: Claude Code Lifecycle Hooks  
**Location**: `~/.claude/hooks/` (global hooks)  
**Status**: ✅ Active and Operational

---

## Overview

The Momentum_Squared project uses **4 sophisticated lifecycle hooks** that automate quality control, skill activation, and file tracking during Claude Code sessions. These hooks run automatically at different stages of your development workflow.

---

## Hook Architecture

```
Claude Code Lifecycle
│
├── 1️⃣ UserPromptSubmit
│   └── user-prompt-submit-skills-activator.ts
│       ├── Analyzes your prompt
│       ├── Matches keywords/patterns
│       └── Injects skill reminders
│
├── 2️⃣ PostToolUse (after each tool)
│   └── post-tool-use-edit-tracker.ts
│       ├── Tracks file edits
│       ├── Logs to /tmp/claude-edits-[session].json
│       └── Builds session edit history
│
└── 3️⃣ StopEvent (after response)
    └── stop-event-quality-checker.ts
        ├── Sub-hook 1: Black Formatter
        ├── Sub-hook 2: Build Checker (pytest/flake8/mypy)
        ├── Sub-hook 3: Error Pattern Detector
        └── Sub-hook 4: Summary Display
```

---

## The 4 Hooks Explained

### 1. 🎯 User Prompt Submit: Skills Activator

**File**: `~/.claude/hooks/user-prompt-submit-skills-activator.ts`  
**Trigger**: **BEFORE** your prompt is sent to Claude  
**Purpose**: Auto-activate relevant skills based on what you're asking about

#### How It Works

1. **Reads** your prompt text
2. **Matches** against skill rules in `~/.claude/hooks/skills-rules.json`
3. **Injects** `<system-reminder>` tags with skill activation messages
4. **Passes** the enhanced prompt to Claude

#### Skill Rules (6 Skills Configured)

| Skill | Keywords | File Patterns | What It Does |
|-------|----------|---------------|--------------|
| **bayesian-scoring-dev** | bayesian, scoring, ensemble, momentum, factor weights | `src/scoring/**/*.py`, `scripts/score_*.py` | Reminds about Bayesian scoring patterns, score recording, uncertainty quantification |
| **portfolio-optimization-dev** | optimization, black-litterman, rebalancing, views | `src/optimization/**/*.py`, `scripts/*_optimizer*.py` | Reminds about Black-Litterman implementation, view construction, risk controls |
| **workflow-execution-dev** | workflow 9, underperformance, quarterly sipp | `scripts/portfolio_underperformance_analyzer.py` | Reminds about 11-phase SIPP workflow, validation gates, approval requirements |
| **database-operations-dev** | database, sqlite, migration, schema | `src/database/**/*.py`, `scripts/migrate_*.py` | Reminds about context managers, ACID transactions, score history patterns |
| **validation-framework-dev** | validation, consistency, approval gate | `src/validation/**/*.py`, `scripts/*_validator.py` | Reminds about progressive validation, score consistency checks, cash constraints |
| **python-execution-patterns** | pythonpath, venv, import error, pytest | `tests/**/*.py`, `scripts/**/*.py` | **CRITICAL** - Reminds to use `PYTHONPATH=.` for all Python scripts |

#### Example

**Your Prompt:**
> "Update the Bayesian scoring system to include sector momentum"

**Hook Injects:**
```xml
<system-reminder>
🎯 Skill Activated: bayesian-scoring-dev

Critical Reminders:
- Always record scores to database via score_history_recorder
- Include uncertainty quantification (Bayesian credible intervals)
- Use src/scoring/ modules for all scoring logic
- Test with: PYTHONPATH=. ./venv_torch/bin/python tests/test_bayesian_scorer.py
</system-reminder>
```

#### Configuration File

**Location**: `~/.claude/hooks/skills-rules.json`

```json
{
  "skills": [
    {
      "skillName": "bayesian-scoring-dev",
      "description": "Multi-factor Bayesian ensemble scoring",
      "triggers": {
        "keywords": ["bayesian", "scoring", "ensemble", "momentum", "fundamental"],
        "filePatterns": ["src/scoring/**/*.py", "scripts/score_*.py"],
        "contentPatterns": ["BayesianEnsembleScorer", "score_history_recorder"]
      },
      "reminderMessage": "Always use PYTHONPATH=. for imports..."
    }
  ]
}
```

---

### 2. 📝 Post Tool Use: Edit Tracker

**File**: `~/.claude/hooks/post-tool-use-edit-tracker.ts`  
**Trigger**: **AFTER** each tool use (Edit, Write, NotebookEdit)  
**Purpose**: Track all file modifications during your session

#### How It Works

1. **Monitors** Edit, Write, and NotebookEdit tools
2. **Logs** file paths with timestamps
3. **Saves** to `/tmp/claude-edits-[session-id].json`
4. **Filters** out temp files, venv, node_modules

#### Session Log Format

```json
{
  "sessionId": "1731524457000-a3b2c1d4",
  "startTime": "2025-11-13T17:40:57.000Z",
  "editedFiles": [
    {
      "filePath": "/Users/tomeldridge/Momentum_Squared/src/scoring/bayesian_ensemble_scorer.py",
      "tool": "Edit",
      "timestamp": "2025-11-13T17:41:23.456Z",
      "sessionId": "1731524457000-a3b2c1d4"
    },
    {
      "filePath": "/Users/tomeldridge/Momentum_Squared/tests/test_bayesian_scorer.py",
      "tool": "Edit",
      "timestamp": "2025-11-13T17:42:15.789Z",
      "sessionId": "1731524457000-a3b2c1d4"
    }
  ]
}
```

#### What Gets Tracked

✅ **Tracked:**
- Python files (`.py`)
- JavaScript/TypeScript files (`.js`, `.ts`)
- Configuration files (`.json`, `.yaml`)
- Documentation files (`.md`)

❌ **Filtered Out:**
- Virtual environments (`venv/`, `venv_torch/`)
- Node modules (`node_modules/`)
- Cache directories (`__pycache__/`, `.pytest_cache/`)
- Temporary files (`/tmp/`, `.pyc`)

#### Usage

The edit log is automatically consumed by the **stop-event-quality-checker** to run targeted quality checks only on files you modified.

---

### 3. ✅ Stop Event: Quality Checker

**File**: `~/.claude/hooks/stop-event-quality-checker.ts`  
**Trigger**: **AFTER** Claude's response is complete  
**Purpose**: Run comprehensive quality checks on your changes

#### The 4 Sub-Hooks

##### 3.1 🎨 Black Formatter
**Purpose**: Auto-format edited Python files

```bash
# Runs automatically:
black src/scoring/bayesian_ensemble_scorer.py
black tests/test_bayesian_scorer.py
```

**Output:**
```
[Black Formatter]
✓ src/scoring/bayesian_ensemble_scorer.py - reformatted
✓ tests/test_bayesian_scorer.py - already formatted
```

##### 3.2 🔨 Build Checker
**Purpose**: Run pytest, flake8, and mypy on edited files

```bash
# Runs automatically:
PYTHONPATH=. ./venv_torch/bin/python -m pytest tests/test_bayesian_scorer.py -v
flake8 src/scoring/bayesian_ensemble_scorer.py
mypy src/scoring/bayesian_ensemble_scorer.py
```

**Output:**
```
[Build Checker]
Pytest Results:
  ✓ tests/test_bayesian_scorer.py::test_score_calculation PASSED
  ✓ tests/test_bayesian_scorer.py::test_uncertainty_quantification PASSED
  ✓ 2 passed in 1.23s

Flake8 Results:
  ✓ No style issues found

Mypy Results:
  ✓ No type errors found
```

##### 3.3 🚨 Error Pattern Detector
**Purpose**: Detect forbidden patterns and common mistakes

**Checks For:**

1. **Bare `except:` Clauses**
   ```python
   # ❌ FORBIDDEN
   try:
       risky_operation()
   except:  # <-- Will be caught!
       pass
   
   # ✅ CORRECT
   try:
       risky_operation()
   except Exception as e:
       logger.error(f"Error: {e}")
   ```

2. **Missing `PYTHONPATH=` in Subprocess Calls**
   ```python
   # ❌ FORBIDDEN
   subprocess.run(['./venv_torch/bin/python', 'scripts/score_wishlist.py'])
   
   # ✅ CORRECT
   subprocess.run(
       ['./venv_torch/bin/python', 'scripts/score_wishlist.py'],
       env={**os.environ, 'PYTHONPATH': '.'}
   )
   ```

3. **Unclosed Database Connections**
   ```python
   # ❌ FORBIDDEN
   conn = sqlite3.connect('momentum_squared.db')
   cursor = conn.cursor()
   # ... no context manager!
   
   # ✅ CORRECT
   with sqlite3.connect('momentum_squared.db') as conn:
       cursor = conn.cursor()
       # ... automatically closes
   ```

**Output:**
```
[Error Pattern Detector]
✗ Found 1 forbidden pattern in src/scoring/bayesian_ensemble_scorer.py:
  Line 145: Bare except clause - specify exception type
  
Recommendation: Replace with 'except Exception as e:'
```

##### 3.4 📊 Summary Display
**Purpose**: Consolidate all check results

**Output Format:**
```
╔════════════════════════════════════════════════════════════╗
║           Quality Check Summary                             ║
╚════════════════════════════════════════════════════════════╝

Session: 1731524457000-a3b2c1d4
Files Edited: 2
Checks Run: 4

Results:
  ✓ Black Formatter    - 2/2 files formatted
  ✓ Build Checker      - All tests passed
  ✗ Error Patterns     - 1 issue found
  ─ Summary            - Review required

Overall Status: ⚠️  WARNINGS (see details above)

Next Steps:
1. Fix bare except clause in bayesian_ensemble_scorer.py:145
2. Re-run quality checks: ~/.claude/hooks/stop-event-quality-checker.ts
```

#### Exit Codes

- **0** - All checks passed ✅
- **2** - Issues found (blocking) ❌

---

### 4. 🛠️ Smart Lint (Enhanced Shell Script)

**File**: `~/.claude/hooks/smart-lint.sh`  
**Trigger**: Manual or called by other hooks  
**Purpose**: Flexible linting and testing utility

#### Usage Modes

```bash
# 1. Full check on all files (original behavior)
~/.claude/hooks/smart-lint.sh

# 2. Targeted mode (specific files)
~/.claude/hooks/smart-lint.sh --files src/scoring/bayesian_scorer.py,scripts/score_wishlist.py

# 3. Quick mode (formatting only, no linting)
~/.claude/hooks/smart-lint.sh --mode quick

# 4. Full mode (formatting + linting + pytest)
~/.claude/hooks/smart-lint.sh --mode full
```

#### What It Does

**Quick Mode (`--mode quick`):**
- ✅ Black formatting
- ❌ No linting
- ❌ No testing
- ⚡ Fast (< 5 seconds)

**Full Mode (`--mode full`):**
- ✅ Black formatting
- ✅ Flake8 linting
- ✅ Mypy type checking
- ✅ Pytest on related test files
- 🐢 Comprehensive (30-60 seconds)

**Targeted Mode (`--files`):**
- Runs checks only on specified files
- Automatically finds related test files
- Useful for incremental development

---

## Hook Workflow Examples

### Example 1: Typical Development Session

```
You: "Update Bayesian scoring to include PE compression factor"
     ↓
[UserPromptSubmit Hook]
  ✓ Detects keywords: "bayesian", "scoring"
  ✓ Activates: bayesian-scoring-dev skill
  ✓ Injects reminder about score recording patterns
     ↓
Claude: <makes code changes>
     ↓
[PostToolUse Hook] (fires after each edit)
  ✓ Edit: src/scoring/bayesian_ensemble_scorer.py
  ✓ Edit: src/scoring/valuation_scorer.py
  ✓ Edit: tests/test_bayesian_scorer.py
  ✓ Logs all 3 files to /tmp/claude-edits-[session].json
     ↓
Claude: <completes response>
     ↓
[StopEvent Hook]
  ✓ Sub-hook 1: Black formats 3 files
  ✓ Sub-hook 2: Runs pytest on test_bayesian_scorer.py
  ✓ Sub-hook 3: Scans for error patterns
  ✓ Sub-hook 4: Shows summary
     ↓
Result: ✅ All checks passed!
```

### Example 2: Error Detected

```
You: "Add new scoring factor"
     ↓
[UserPromptSubmit Hook]
  ✓ Activates bayesian-scoring-dev
     ↓
Claude: <makes code changes with bare except:>
     ↓
[PostToolUse Hook]
  ✓ Tracks edited files
     ↓
[StopEvent Hook]
  ✓ Sub-hook 1: Formats code
  ✓ Sub-hook 2: Tests pass
  ✗ Sub-hook 3: Detects bare except clause!
  ✓ Sub-hook 4: Shows warning
     ↓
Result: ⚠️  Issue found - please fix before committing
```

---

## Hook Configuration

### Skills Rules Configuration

**File**: `~/.claude/hooks/skills-rules.json`  
**Size**: ~5KB  
**Skills**: 6 configured

To modify skill activation rules, edit this file and adjust:
- `keywords` - Words that trigger the skill
- `filePatterns` - File paths that trigger the skill
- `contentPatterns` - Code patterns that trigger the skill
- `reminderMessage` - What Claude should remember

### Environment Variables

```bash
# Session tracking
export CLAUDE_SESSION_ID="1731524457000-a3b2c1d4"

# Project paths
PROJECT_ROOT="/Users/tomeldridge/Momentum_Squared"
VENV_PYTHON="$PROJECT_ROOT/venv_torch/bin/python"
```

---

## Session Log Management

### View Current Session Edits

```bash
# Find current session
SESSION_ID=$(ls -t /tmp/claude-edits-*.json | head -1 | sed 's/.*claude-edits-\(.*\)\.json/\1/')
echo "Current session: $SESSION_ID"

# View edited files
cat /tmp/claude-edits-$SESSION_ID.json | jq '.editedFiles[].filePath'
```

### Clean Up Old Sessions

```bash
# Remove session logs older than 7 days
find /tmp -name "claude-edits-*.json" -mtime +7 -delete
```

---

## Benefits of This Hook System

### 1. 🎯 **Zero Configuration Needed**
- Hooks run automatically
- No manual linting commands
- No remembering to format code

### 2. 🚀 **Instant Feedback**
- Catches errors immediately
- Formats code on the fly
- Runs tests automatically

### 3. 🧠 **Smart Context Injection**
- Relevant skills auto-activate
- Project-specific reminders
- Reduces manual prompting

### 4. 📝 **Session Tracking**
- Know exactly what changed
- Audit trail for debugging
- Targeted quality checks

### 5. ⚡ **Performance**
- Only checks edited files
- Parallel execution
- Caches results

---

## Troubleshooting

### Hook Not Running?

```bash
# Check if hooks are executable
ls -la ~/.claude/hooks/*.ts ~/.claude/hooks/*.sh

# Make executable if needed
chmod +x ~/.claude/hooks/*.ts ~/.claude/hooks/*.sh

# Test manually
~/.claude/hooks/user-prompt-submit-skills-activator.ts
```

### Session Log Not Found?

```bash
# List all session logs
ls -lht /tmp/claude-edits-*.json

# Create new session manually
echo '{"sessionId":"test","startTime":"'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'","editedFiles":[]}' > /tmp/claude-edits-test.json
```

### Quality Checks Failing?

```bash
# Run checks manually with verbose output
cd /Users/tomeldridge/Momentum_Squared

# Black
black --check src/scoring/

# Flake8
flake8 src/scoring/

# Pytest
PYTHONPATH=. ./venv_torch/bin/python -m pytest tests/ -v

# MyPy
mypy src/scoring/
```

### Skills Not Activating?

```bash
# Check skills-rules.json exists
cat ~/.claude/hooks/skills-rules.json | jq '.skills[].skillName'

# Test keyword matching manually
echo "bayesian scoring" | grep -i "bayesian"
```

---

## Customization

### Adding a New Skill

1. **Edit skills-rules.json:**
```json
{
  "skills": [
    {
      "skillName": "my-new-skill",
      "description": "Custom skill for my workflow",
      "triggers": {
        "keywords": ["custom", "workflow"],
        "filePatterns": ["src/custom/**/*.py"],
        "contentPatterns": ["CustomClass"]
      },
      "reminderMessage": "Remember to follow custom patterns..."
    }
  ]
}
```

2. **Test activation:**
```bash
# Prompt with keyword
echo "I need to update the custom workflow"
# Should inject reminder
```

### Disabling a Hook Temporarily

```bash
# Rename to disable
mv ~/.claude/hooks/stop-event-quality-checker.ts ~/.claude/hooks/stop-event-quality-checker.ts.disabled

# Restore to enable
mv ~/.claude/hooks/stop-event-quality-checker.ts.disabled ~/.claude/hooks/stop-event-quality-checker.ts
```

---

## Best Practices

### 1. Trust the Hooks
- Let them run automatically
- Review their output
- Fix issues they find

### 2. Keep Session Logs
- Don't delete during active development
- Use for debugging
- Review what changed

### 3. Monitor Hook Output
- Read the quality check summaries
- Fix warnings promptly
- Update skills rules as needed

### 4. Use Targeted Linting
- For quick fixes: `--mode quick`
- For thorough checks: `--mode full`
- For specific files: `--files`

---

## Summary

The Momentum_Squared project has a **sophisticated 4-hook system** that:

✅ **Auto-activates** relevant skills based on your prompts  
✅ **Tracks** all file edits during your session  
✅ **Formats** code automatically with Black  
✅ **Tests** changes with pytest, flake8, and mypy  
✅ **Detects** forbidden patterns and common mistakes  
✅ **Reports** comprehensive quality check results  

All of this happens **automatically** without any manual intervention!

---

**Questions or Issues?**

Check the Phase 1 completion documentation:
- `/Users/tomeldridge/Momentum_Squared/.claude/hooks/PHASE_1_COMPLETION_SUMMARY.md`
- `/Users/tomeldridge/Momentum_Squared/.claude/hooks/PHASE_1_TEST_RESULTS.md`

Or review the hook source code:
- `~/.claude/hooks/user-prompt-submit-skills-activator.ts`
- `~/.claude/hooks/post-tool-use-edit-tracker.ts`
- `~/.claude/hooks/stop-event-quality-checker.ts`
- `~/.claude/hooks/smart-lint.sh`

---

*Hook system implemented October 2025 for Momentum_Squared project*  
*Documentation created November 13, 2025*

