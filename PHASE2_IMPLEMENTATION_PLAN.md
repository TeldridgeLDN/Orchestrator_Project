---
file_class: ephemeral
expires_after_days: 30
tags: [implementation, phase2, planning]
---

# Phase 2 Implementation Plan - v1.2.0

**Date**: November 14, 2025  
**Status**: Planning  
**Target Version**: diet103 v1.2.0

---

## Overview

Phase 2 adds **three medium-priority features** to diet103 standard infrastructure:

1. **Documentation Templates** (Low effort, Medium impact) ← START HERE
2. **Health Monitoring** (Medium effort, Medium impact)
3. **TaskMaster Integration** (Medium effort, High impact)

---

## Feature 1: Documentation Templates ⭐ START HERE

### Goal
Provide standard documentation templates in `templates/documentation/` that follow Documentation Economy rules.

### What Gets Created
```
templates/documentation/
├── README.md          # Project README template
├── ARCHITECTURE.md    # System architecture template
├── ADR_TEMPLATE.md    # Architectural Decision Record template
├── CONTRIBUTING.md    # Contribution guidelines template
└── API.md            # API documentation template
```

### Implementation Steps

**Step 1: Create templates/documentation/ directory**
```bash
mkdir -p templates/documentation
```

**Step 2: Create 5 template files**
Each template should be:
- Concise (50-200 lines)
- Follow Documentation Economy Tier 1 guidelines
- Include helpful comments for what to fill in
- Reference existing templates from `templates/` directory

**Step 3: Update diet103-repair.js**
Add templates to installation (only if missing):
```javascript
// In repairDiet103Infrastructure()
const templatesDir = path.join(projectPath, 'templates/documentation');
if (!fs.existsSync(templatesDir)) {
  await fs.promises.mkdir(templatesDir, { recursive: true });
  // Copy templates from diet103 package
  result.installed.templates = ['README.md', 'ARCHITECTURE.md', 'ADR_TEMPLATE.md', 'CONTRIBUTING.md', 'API.md'];
}
```

**Step 4: Test**
- Fresh project: verify templates created
- Existing project: verify templates added during repair

### Effort
**Estimated**: 2-3 hours

### Benefits
- ✅ Consistent documentation structure across projects
- ✅ Reduces time to start documenting
- ✅ Follows Documentation Economy rules by default
- ✅ Non-intrusive (users can modify or delete)

---

## Feature 2: Health Monitoring

### Goal
Add `diet103 health` command that reports project health metrics including File Lifecycle stats.

### What Gets Created
```
lib/commands/health.js  # Health check command
```

### Health Metrics
```javascript
{
  structure_validity: 40%,    // diet103 compliance
  hook_status: 30%,           // Hooks present & executable
  skill_activity: 20%,        // Skills defined & used
  file_organization: 10%      // File Lifecycle metrics (NEW)
}
```

### Implementation Steps

**Step 1: Create lib/commands/health.js**
- Import existing `detectDiet103Infrastructure()` from validator
- Add File Lifecycle stats reader
- Calculate weighted health score
- Display colored output (green/yellow/red)

**Step 2: Add to bin/diet103.js**
```javascript
program
  .command('health')
  .description('Check project health metrics')
  .action(async () => {
    await healthCommand();
  });
```

**Step 3: Integration with File Lifecycle**
```javascript
// Read .file-manifest.json
// Calculate metrics:
// - % files classified
// - % files with tier assigned
// - Archive activity (files moved in last 30 days)
```

**Step 4: Test**
- Run on Orchestrator_Project
- Run on fresh project
- Verify metrics calculation

### Effort
**Estimated**: 4-5 hours

### Benefits
- ✅ Proactive issue detection
- ✅ Visibility into File Lifecycle adoption
- ✅ Standard health scoring across projects
- ✅ Integrates with existing validation

---

## Feature 3: TaskMaster Integration (Opt-in)

### Goal
Make TaskMaster installation opt-in during `diet103 init` with proper prompt.

### What Changes
**Current**: TaskMaster is manual install only
**New**: Option to install during project initialization

### Implementation Steps

**Step 1: Add prompt to lib/commands/init.js**
```javascript
// During diet103 init, after basic setup
const includeTaskmaster = await prompts({
  type: 'confirm',
  name: 'value',
  message: 'Include TaskMaster for task management? (requires API keys)',
  initial: false
});

if (includeTaskmaster.value) {
  // Install TaskMaster infrastructure
  await installTaskmaster(projectPath);
}
```

**Step 2: Create lib/init/taskmaster_init.js**
```javascript
export async function installTaskmaster(projectPath) {
  // Create .taskmaster/ directory
  // Install taskmaster-ai package
  // Add to .mcp.json (if not already present)
  // Create initial tasks.json template
  return { success: true, tasksFile: '.taskmaster/tasks/tasks.json' };
}
```

**Step 3: Update .mcp.json handling**
If user opts in to TaskMaster:
- Ensure TaskMaster AI MCP server is in .mcp.json
- Set `disabled: false` (instead of default `true`)
- Prompt for API keys or remind to add to .env

**Step 4: Test**
- `diet103 init` → Answer "yes" to TaskMaster → verify installation
- `diet103 init` → Answer "no" → verify skipped
- Verify .mcp.json has correct enabled/disabled state

### Effort
**Estimated**: 5-6 hours

### Benefits
- ✅ Easier TaskMaster adoption for new projects
- ✅ Opt-in respects user choice
- ✅ Integrates with existing .mcp.json infrastructure
- ✅ High impact for task-driven development

---

## Implementation Order

### Recommended Sequence
1. **Documentation Templates** (2-3h) ← Easiest, immediate value
2. **Health Monitoring** (4-5h) ← Medium complexity, builds on existing
3. **TaskMaster Integration** (5-6h) ← Most complex, opt-in logic

**Total Effort**: 11-14 hours

### Rationale
- Start with low-hanging fruit (templates)
- Build confidence with medium complexity (health)
- Finish with most complex feature (TaskMaster opt-in)

---

## Testing Strategy

### For Each Feature
1. **Fresh Project Test**: Run `diet103 init` or `diet103 project register`
2. **Existing Project Test**: Run on Orchestrator_Project
3. **Edge Cases**: Missing files, existing files, permission errors
4. **Documentation**: Update CHANGELOG, create rule if needed

### Acceptance Criteria
- ✅ No breaking changes to v1.1.1 projects
- ✅ Backwards compatible
- ✅ Non-blocking installation (failures logged as warnings)
- ✅ Documentation complete

---

## Version Planning

**Current**: v1.1.1 (Phase 1 complete)  
**Target**: v1.2.0 (Phase 2 complete)

**Version Bump Rationale**: 
- MINOR version (1.1 → 1.2)
- New features, no breaking changes
- Backwards compatible with v1.1.1

---

## Documentation Deliverables

Per Documentation Economy rule, **ONE document per feature**:

1. **Templates**: Update `CORE_INFRASTRUCTURE_IMPLEMENTATION_COMPLETE.md` with templates section
2. **Health**: Create `.claude/rules/health-monitoring-standard.md` (Tier 1 - agent guidelines)
3. **TaskMaster**: Create `.claude/rules/taskmaster-integration-standard.md` (Tier 1 - agent guidelines)

**No separate completion docs** - Update CHANGELOG.md only.

---

## Decision Needed

**Which feature should we start with?**

**Recommendation**: Start with **Documentation Templates** (easiest, 2-3h)

**Alternative**: Start with **Health Monitoring** (medium, 4-5h) if you want more substance first

**Your call**: Which feature should we implement first?

---

**Created**: November 14, 2025  
**Status**: Awaiting user decision on starting feature

