# Project Health Guide

Comprehensive guide to understanding, maintaining, and improving your Claude project's health score.

## Table of Contents

1. [Overview](#overview)
2. [Health Score Components](#health-score-components)
3. [Health Status Categories](#health-status-categories)
4. [Running Health Checks](#running-health-checks)
5. [Understanding Recommendations](#understanding-recommendations)
6. [Health Alerts](#health-alerts)
7. [Improving Your Health Score](#improving-your-health-score)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Project health scores provide a quantitative measure (0-100) of your Claude project's structural integrity, configuration completeness, and operational readiness. A higher score indicates a more robust, maintainable, and reliable project.

### Why Health Scores Matter

- **Early Problem Detection**: Identify issues before they impact development
- **Maintenance Guidance**: Know exactly what needs attention
- **Team Onboarding**: New team members can quickly assess project quality
- **Continuous Improvement**: Track progress over time
- **Automation Ready**: Integrate health checks into CI/CD pipelines

### Quick Start

```bash
# Check your project's health
claude project health

# Get detailed breakdown
claude project health --verbose

# Save score to project metadata
claude project health --update
```

---

## Health Score Components

The health score is calculated from four weighted components, each focusing on a different aspect of project quality.

### 1. Structure Validity (40% of total score)

**What it measures:** Presence and correctness of required directories and files.

**Checks performed:**
- ✅ `.claude/` directory exists
- ✅ Required subdirectories present:
  - `hooks/` - Project hooks
  - `skills/` - Project-specific skills
  - `prompts/` - Custom prompts
  - `templates/` - File templates
  - `docs/` - Documentation
  - `context/` - Context files
- ✅ Core files present:
  - `Claude.md` - Project context
  - `metadata.json` - Project configuration
  - `skill-rules.json` - Skill activation rules

**Scoring:**
```
Missing critical directory:     -6 points
Missing optional directory:     -2 points
Missing critical file:          -5 points
Missing optional file:          -2 points
Invalid file format:            -3 points
```

**Example:**
```
Structure Validity: 36/40 (90%)

✅ .claude/ directory exists
✅ All required subdirectories present
✅ Claude.md exists (2,341 lines)
✅ metadata.json valid
⚠️  skill-rules.json missing (-2 points)
✅ All other files present
```

### 2. Hook Status (30% of total score)

**What it measures:** Validation of project hooks for user interactions and tool usage.

**Checks performed:**
- ✅ `UserPromptSubmit.js` exists
- ✅ `UserPromptSubmit.js` exports `handleUserPromptSubmit` function
- ✅ `PostToolUse.js` exists
- ✅ `PostToolUse.js` exports `handlePostToolUse` function
- ✅ Hooks contain valid JavaScript syntax
- ✅ Hooks follow correct structure

**Scoring:**
```
Missing hook file:              -15 points
Invalid export:                 -10 points
Syntax errors:                  -8 points
Structural issues:              -5 points
```

**Example:**
```
Hook Status: 30/30 (100%)

✅ UserPromptSubmit.js present
✅ Exports handleUserPromptSubmit correctly
✅ PostToolUse.js present
✅ Exports handlePostToolUse correctly
✅ No syntax errors detected
✅ Proper hook structure
```

### 3. Skill Activity (20% of total score)

**What it measures:** Configuration and synchronization of project skills.

**Checks performed:**
- ✅ `skill-rules.json` exists and is valid JSON
- ✅ Skill directories match skill-rules definitions
- ✅ At least one skill configured
- ✅ Skills have activation rules defined
- ✅ No orphaned skill directories

**Scoring:**
```
Missing skill-rules.json:       -10 points
Invalid JSON:                   -8 points
No skills configured:           -6 points
Orphaned directories:           -2 points per orphan
Missing activation rules:       -1 point per skill
```

**Example:**
```
Skill Activity: 16/20 (80%)

✅ skill-rules.json present and valid
✅ 5 skills configured
⚠️  2 skills missing activation rules (-2 points)
⚠️  1 orphaned directory: old-skill/ (-2 points)
✅ 3 skills fully configured
```

### 4. Configuration Completeness (10% of total score)

**What it measures:** Quality and completeness of project metadata.

**Checks performed:**
- ✅ `metadata.json` exists
- ✅ Valid JSON format
- ✅ Required fields present:
  - `name` - Project name
  - `version` - Semantic version
  - `description` - Project description
- ✅ Optional fields recommended:
  - `author` - Creator information
  - `tags` - Classification tags
  - `timestamps` - Activity tracking

**Scoring:**
```
Missing required field:         -4 points
Invalid version format:         -2 points
Missing recommended field:      -1 point
```

**Example:**
```
Configuration Completeness: 9/10 (90%)

✅ metadata.json exists
✅ Valid JSON format
✅ name: "my-webapp"
✅ version: "1.2.0"
✅ description present
⚠️  author field missing (-1 point)
✅ tags present
```

---

## Health Status Categories

Based on your total score, your project falls into one of three categories:

### 🟢 Healthy (85-100 points)

**Meaning:** Your project is in excellent condition with minimal or no issues.

**Characteristics:**
- All critical components present and valid
- Strong documentation and configuration
- Active skill management
- Ready for production use

**Action:** Maintain current standards and monitor for changes.

### 🟡 Needs Attention (70-84 points)

**Meaning:** Your project has minor issues that should be addressed.

**Characteristics:**
- Some optional components missing
- Minor configuration gaps
- Skill synchronization issues
- Generally functional but improvable

**Action:** Review recommendations and address high-impact items.

### 🔴 Critical (0-69 points)

**Meaning:** Your project has significant problems requiring immediate attention.

**Characteristics:**
- Missing critical components
- Invalid configurations
- Broken hooks or skills
- May not function correctly

**Action:** Address critical issues immediately before continuing development.

---

## Running Health Checks

### Basic Health Check

```bash
# Check current project
claude project health

# Check specific project
claude project health ~/Projects/my-webapp
```

### Detailed Analysis

```bash
# Show full breakdown
claude project health --verbose

# This displays:
# - Detailed component scores
# - All recommendations (not just top 10)
# - Summary statistics
# - Potential improvement metrics
```

### Saving Results

```bash
# Update project metadata with health score
claude project health --update

# This saves to metadata.json:
{
  "healthScore": 87,
  "timestamps": {
    "createdAt": "2025-11-01T10:00:00.000Z",
    "lastAccessedAt": "2025-11-12T19:30:00.000Z",
    "lastHealthCheckAt": "2025-11-12T19:30:00.000Z"
  }
}
```

**Project Timestamps:**
The orchestrator automatically tracks three key timestamps in project metadata:

1. **createdAt** - When the project was initialized or registered
2. **lastAccessedAt** - Last time the project was switched to or used
3. **lastHealthCheckAt** - Last time a health check was performed

These timestamps help you:
- Track project activity and usage patterns
- Identify stale or abandoned projects (not accessed in 30+ days)
- Know when health checks need refreshing (recommended weekly)
- Monitor team member engagement with project switching logs

**View Timestamps:**
```bash
# In project list (with --verbose)
claude project list --verbose

# In health report
claude project health --verbose

# Direct from metadata
cat .claude/metadata.json | jq '.timestamps'
```

### JSON Output for Automation

```bash
# Get machine-readable output
claude project health --json

# Use in scripts:
SCORE=$(claude project health --json | jq '.health.score')
if [ $SCORE -lt 70 ]; then
  echo "Health check failed!"
  exit 1
fi
```

---

## Understanding Recommendations

Health checks generate actionable recommendations prioritized by impact and severity. The recommendation system is powered by an intelligent analysis engine that maps detected issues to specific, actionable guidance.

### How Recommendations Work

The system follows this workflow:
1. **Issue Detection** - Analyzes project structure, hooks, skills, and configuration
2. **Issue Mapping** - Matches detected issues to a database of 34+ known recommendations
3. **Context Enhancement** - Adds project-specific details to recommendations
4. **Prioritization** - Sorts by severity and potential impact
5. **Presentation** - Displays top recommendations with actionable steps

### Recommendation Structure

Each recommendation includes:

```
🟡 [MEDIUM] Add missing skill directories
   Issue: skill-rules.json references skills not in skills/ directory
   Impact: +8 points to health score
   Action: Synchronize skill directories with skill-rules.json
   Command: mkdir -p .claude/skills/missing-skill
```

**Components:**
- **Icon & Severity**: 🔴 Critical, 🟡 Medium, 🔵 Low
- **Title**: Brief description of the issue
- **Issue**: Detailed explanation of what's wrong
- **Impact**: Potential score improvement
- **Action**: What you need to do
- **Command**: Executable fix (when available)

### Severity Levels

**🔴 Critical (High Priority)**
- Blocking core functionality
- Must be fixed before production
- Examples: Missing hooks, invalid metadata

**🟡 Medium Priority**
- Affects quality but not blocking
- Should be addressed soon
- Examples: Missing optional files, skill sync issues

**🔵 Low Priority**
- Nice-to-have improvements
- Can be deferred
- Examples: Missing documentation, optional metadata

### Recommendation Example

```
📋 RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 🔴 [CRITICAL] Fix missing UserPromptSubmit hook
   Issue: Required hook file not found
   Impact: +15 points to health score
   Action: Create UserPromptSubmit.js in hooks/ directory
   Command: cp templates/hooks/UserPromptSubmit.js .claude/hooks/

2. 🟡 [MEDIUM] Synchronize skill directories
   Issue: 2 skills in skill-rules.json have no corresponding directories
   Impact: +8 points to health score
   Action: Create missing skill directories or remove from config

3. 🔵 [LOW] Add author metadata
   Issue: Optional author field missing from metadata.json
   Impact: +1 point to health score
   Action: Add author information to project metadata
```

---

## Health Alerts

Alerts are automatically generated based on health score changes and thresholds.

### Alert Types

**🔴 Critical Alert (Score < 50)**
```
🚨 CRITICAL: Project health is below 50 (Current: 42/100)
Immediate action required to restore project functionality.
```

**🟡 Warning Alert (Score < 70)**
```
⚠️  WARNING: Project health needs attention (Current: 68/100)
Address issues to prevent degradation of project quality.
```

**🟢 Success Alert (Improvement ≥ 20 points)**
```
🎉 SUCCESS: Project health improved by 23 points (Was: 65, Now: 88)
Great work maintaining project quality!
```

**ℹ️  Info Alert (Score 70-84)**
```
ℹ️  INFO: Project health is adequate but improvable (Current: 78/100)
Review recommendations for optimization opportunities.
```

### Alert History

Alerts are stored in `metadata.json`:

```json
{
  "alerts": [
    {
      "type": "health",
      "severity": "warning",
      "message": "Project health needs attention (68/100)",
      "timestamp": "2025-11-12T10:30:00.000Z",
      "dismissed": false
    }
  ]
}
```

---

## Improving Your Health Score

### Quick Wins (High Impact, Low Effort)

1. **Create Missing Directories**
   ```bash
   mkdir -p .claude/{hooks,skills,prompts,templates,docs,context}
   ```
   Impact: Up to +12 points

2. **Add Basic Hooks**
   ```bash
   cp templates/hooks/*.js .claude/hooks/
   ```
   Impact: Up to +30 points

3. **Create skill-rules.json**
   ```bash
   echo '{"skills":[]}' > .claude/skill-rules.json
   ```
   Impact: +10 points

4. **Add Metadata Fields**
   ```json
   {
     "name": "my-project",
     "version": "1.0.0",
     "description": "My awesome project",
     "author": "Your Name"
   }
   ```
   Impact: +10 points

### Medium Effort Improvements

1. **Synchronize Skills**
   - Review skill-rules.json
   - Create missing skill directories
   - Remove orphaned directories
   Impact: +5-10 points

2. **Complete Documentation**
   - Add README in docs/
   - Document skills
   - Create usage examples
   Impact: +3-5 points

3. **Validate Hook Logic**
   - Ensure proper exports
   - Add error handling
   - Test hook execution
   Impact: +5-8 points

### Long-term Maintenance

1. **Regular Health Checks**
   ```bash
   # Weekly health check
   claude project health --update --verbose
   ```

2. **Automated Monitoring**
   ```bash
   # Add to CI/CD pipeline
   claude project health --json || exit 1
   ```

3. **Track Improvements**
   ```bash
   # Compare health over time
   git log -p metadata.json | grep healthScore
   ```

---

## Best Practices

### During Development

1. **Check Health Before Major Changes**
   ```bash
   claude project health --update
   git add metadata.json
   git commit -m "Health check before feature work"
   ```

2. **Fix Issues Incrementally**
   - Address one recommendation at a time
   - Test after each fix
   - Commit frequently

3. **Use Health as Quality Gate**
   ```bash
   # Don't merge if health < 80
   SCORE=$(claude project health --json | jq '.health.score')
   [ $SCORE -ge 80 ] || exit 1
   ```

### For Team Projects

1. **Set Minimum Health Standards**
   - Define acceptable thresholds (e.g., 85+)
   - Document in contributing guidelines
   - Enforce in code review

2. **Regular Team Health Reviews**
   - Weekly health check meetings
   - Rotate responsibility for fixes
   - Celebrate improvements

3. **Onboarding Checklist**
   - Run health check on first day
   - Review all recommendations
   - Fix critical issues together

### For Production Projects

1. **Monitor Continuously**
   ```bash
   # Daily automated checks
   0 0 * * * cd /path/to/project && claude project health --update
   ```

2. **Alert on Degradation**
   ```bash
   # Notify if health drops
   if [ $SCORE -lt 85 ]; then
     notify-send "Project health degraded: $SCORE"
   fi
   ```

3. **Document Health History**
   - Track in release notes
   - Include in status reports
   - Celebrate milestones

---

## Troubleshooting

### "Not in a valid Claude project directory"

**Problem:** Health command can't find `.claude/` directory.

**Solutions:**
1. Navigate to project root
2. Initialize project:
   ```bash
   claude project init
   ```
3. Check directory structure

### Health Score Lower Than Expected

**Problem:** Score doesn't match perceived project quality.

**Diagnosis:**
```bash
# Get detailed breakdown
claude project health --verbose

# Review each component score
# Identify specific failing checks
```

**Common Causes:**
- Missing optional files (check recommendations)
- Outdated metadata.json
- Orphaned skill directories
- Invalid hook exports

### Recommendations Not Helping

**Problem:** Following recommendations doesn't improve score.

**Steps:**
1. Run health check again:
   ```bash
   claude project health --update
   ```

2. Verify changes were applied:
   ```bash
   ls -la .claude/
   cat .claude/metadata.json
   ```

3. Check for syntax errors:
   ```bash
   node -c .claude/hooks/*.js
   ```

4. Review logs for detailed errors

### JSON Output Invalid

**Problem:** `--json` flag produces unparseable output.

**Solutions:**
1. Check for extra output (remove debug statements)
2. Verify node version compatibility
3. Try without other flags first:
   ```bash
   claude project health --json > health.json
   cat health.json | jq .
   ```

---

## Related Documentation

- [CLI Reference](CLI_REFERENCE.md) - Complete command documentation
- [Getting Started](GETTING_STARTED.md) - Project setup guide
- [Project Portability Checklist](PROJECT_PORTABILITY_CHECKLIST.md) - Migration optimization
- [Troubleshooting](TROUBLESHOOTING.md) - General issues and solutions

---

**Last Updated:** 2025-11-12  
**Version:** 1.0.0  
**Maintainer:** Project Orchestrator Team

