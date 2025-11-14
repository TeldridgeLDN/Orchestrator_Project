# Phase 3 Implementation Plan - v1.3.0

**Version**: v1.3.0  
**Current**: v1.2.0 (Phase 2 complete)  
**Focus**: Enhanced User Experience & Developer Productivity  
**Estimated Effort**: 12-15 hours

---

## Overview

Phase 3 focuses on **making existing features more discoverable and easier to use**. Unlike Phase 2 which added new features, Phase 3 **improves the developer experience** of features that already exist.

### The Problem

Many powerful features exist in Orchestrator_Project but are:
- ❌ Hard to discover (scattered across multiple directories)
- ❌ Require manual setup (shell integration, badges)
- ❌ Not integrated into standard workflows
- ❌ Missing from `diet103` CLI

### The Solution

Phase 3 makes these features **first-class citizens** by:
- ✅ Integrating into `diet103` CLI
- ✅ Automating setup/installation
- ✅ Adding to `diet103 init` workflow
- ✅ Creating discoverable commands

---

## Existing Tools to Integrate

### 1. Project Validator (`lib/project-validator/`)
**Status**: Fully implemented, needs integration  
**Current Access**: Manual CLI (`node lib/project-validator/cli.js`)  
**Desired Access**: `diet103 project validate`

**Files**:
- `validator.js` - Core validation logic ✅
- `cli.js` - Standalone CLI ✅
- `shell-integration.sh` - Terminal prompt integration ✅
- `badge-generator.js` - Visual badges for docs ✅

### 2. Rule Sync (`lib/rule-sync/`)
**Status**: Partially implemented, needs CLI integration  
**Current Access**: Manual node scripts  
**Desired Access**: `diet103 rules sync`, `diet103 rules pull`

**Files**:
- `sync-pull.js` - Pull rules from registry ✅
- `registry.js` - Rule registry management ✅
- `version-check.js` - Version validation ✅
- `cli.js` - Standalone CLI ✅

### 3. Orchestrator Binary (`bin/orchestrator`)
**Status**: Exists but not integrated  
**Current Access**: Direct binary execution  
**Desired Access**: Integrated into `diet103` or documented

---

## Phase 3 Features

All features are **medium priority** with high user impact.

### Feature 1: Project Identity Validation Integration ⭐⭐⭐

**Goal**: Make project validator a first-class `diet103` command.

**What Changes**:
- **New Commands**:
  - `diet103 project validate` - Run full project identity validation
  - `diet103 project check-prd <file>` - Validate PRD against project
  - `diet103 project fix` - Auto-fix identity mismatches
  - `diet103 project badges generate` - Generate visual badges
  - `diet103 project badges inject <file>` - Inject badges into docs

**Implementation**:
1. Create `lib/commands/project-validator.js` - Wrapper for validator
2. Add commands to `bin/diet103.js` under `project` subcommand
3. Integrate with existing `validator.js` logic
4. Add validation to `diet103 health` output (optional)

**Effort**: 3-4 hours

**Benefits**:
- ✅ Easy discovery via `diet103 --help`
- ✅ Consistent CLI interface
- ✅ No need to remember manual paths
- ✅ Better error messages

---

### Feature 2: Shell Integration Auto-Setup ⭐⭐

**Goal**: Make terminal prompt integration opt-in during `diet103 init`.

**What Changes**:
- **Interactive Prompt** (during `diet103 init`):
  ```
  ? Enable terminal prompt integration? (Shows project name in prompt) [y/N]
  ```
- **Auto-Setup**:
  - Detects shell type (bash/zsh/fish)
  - Adds sourcing line to appropriate rc file
  - Tests integration immediately
  - Provides manual instructions if auto-setup fails

**Implementation**:
1. Create `lib/init/shell_integration_init.js`
2. Add prompt to `lib/commands/init.js` (like TaskMaster)
3. Detect shell: `$SHELL` environment variable
4. Append to `~/.bashrc`, `~/.zshrc`, or `~/.config/fish/config.fish`
5. Provide rollback command if user wants to remove

**Effort**: 4-5 hours

**Benefits**:
- ✅ One-time setup during init
- ✅ Always know which project you're in
- ✅ Color-coded status (green/yellow/red)
- ✅ Prevents project confusion incidents

---

### Feature 3: Rule Management CLI ⭐⭐

**Goal**: Make rule sync commands accessible via `diet103 rules`.

**What Changes**:
- **New Command Group**: `diet103 rules`
  - `diet103 rules sync` - Pull latest rules from registry
  - `diet103 rules list` - Show installed rule profiles
  - `diet103 rules add <profile>` - Add new rule profile
  - `diet103 rules remove <profile>` - Remove rule profile
  - `diet103 rules check` - Check for rule updates

**Implementation**:
1. Create `lib/commands/rules.js` - Wrapper for rule-sync
2. Add `rules` command group to `bin/diet103.js`
3. Integrate existing `lib/rule-sync/cli.js` logic
4. Add version checking and auto-update prompts

**Effort**: 3-4 hours

**Benefits**:
- ✅ Easy rule management
- ✅ Discoverable via CLI
- ✅ Consistent with `diet103` interface
- ✅ Version awareness

---

### Feature 4: Enhanced Help & Documentation ⭐

**Goal**: Improve discoverability of all `diet103` features.

**What Changes**:
- **Improved `--help` Output**:
  - Group commands by category
  - Show examples for common workflows
  - Indicate new/experimental features
- **Interactive Guide**: `diet103 guide`
  - Walks through common tasks
  - Shows recommended workflows
  - Links to relevant documentation
- **Quick Start**: `diet103 quickstart`
  - Interactive setup wizard
  - Configures recommended settings
  - Runs initial validation

**Implementation**:
1. Update Commander.js help formatting
2. Create `lib/commands/guide.js` - Interactive tutorial
3. Create `lib/commands/quickstart.js` - Setup wizard
4. Add examples to each command's help text

**Effort**: 2-3 hours

**Benefits**:
- ✅ Reduces learning curve
- ✅ Better onboarding experience
- ✅ Self-documenting CLI
- ✅ Fewer support questions

---

## Implementation Order

### Recommended Sequence

1. **Project Validator Integration** (3-4h) ← High value, builds on existing
2. **Rule Management CLI** (3-4h) ← Medium complexity, clean integration
3. **Shell Integration Auto-Setup** (4-5h) ← Most complex, requires testing
4. **Enhanced Help** (2-3h) ← Polish, can be done incrementally

**Total Effort**: 12-15 hours

### Rationale

- Start with easiest integration (validator commands)
- Build momentum with rule management
- Tackle complex shell integration with confidence
- Polish with improved help/documentation

---

## Implementation Details

### Feature 1: Project Validator Commands

**New File**: `lib/commands/project-validator.js`

```javascript
import { validateProject, validatePRD, autoFixProject } from '../project-validator/validator.js';
import { generateBadge, injectBadge } from '../project-validator/badge-generator.js';

export async function validateProjectCommand(options) {
  // Call existing validator.js
}

export async function checkPRDCommand(file, options) {
  // Call existing validatePRD
}

export async function fixProjectCommand(options) {
  // Call existing autoFixProject
}

export async function generateBadgeCommand(options) {
  // Call existing badge-generator
}
```

**Integration Point**: `bin/diet103.js`

```javascript
// Add to project command group
project
  .command('validate')
  .description('Validate project identity across all signals')
  .option('-v, --verbose', 'Show detailed validation output')
  .action(validateProjectCommand);

project
  .command('check-prd <file>')
  .description('Validate PRD file against project identity')
  .action(checkPRDCommand);

project
  .command('fix')
  .description('Auto-fix project identity mismatches')
  .option('-y, --yes', 'Skip confirmation')
  .action(fixProjectCommand);
```

---

### Feature 2: Shell Integration Setup

**New File**: `lib/init/shell_integration_init.js`

```javascript
export async function initializeShellIntegration(options) {
  const { projectRoot, projectName, skipPrompts = false } = options;
  
  // 1. Detect shell type
  const shell = detectShell(); // bash, zsh, fish
  
  // 2. Determine rc file
  const rcFile = getRcFile(shell);
  
  // 3. Check if already installed
  if (await isAlreadyInstalled(rcFile)) {
    return { success: true, skipped: 'Already installed' };
  }
  
  // 4. Generate integration line
  const integrationLine = generateIntegrationLine(projectRoot);
  
  // 5. Append to rc file (with user permission)
  await appendToRcFile(rcFile, integrationLine);
  
  // 6. Test integration
  const testResult = await testIntegration(shell);
  
  return { success: true, shell, rcFile, testResult };
}
```

**Integration Point**: `lib/commands/init.js`

```javascript
// After TaskMaster prompt
{
  type: 'confirm',
  name: 'includeShellIntegration',
  message: 'Enable terminal prompt integration? (Shows project name in prompt)',
  initial: false
}

// Step 6: Initialize Shell Integration (optional)
if (config.includeShellIntegration) {
  await initializeShellIntegration({
    projectRoot: targetPath,
    projectName: config.projectName,
    skipPrompts: true
  });
}
```

---

### Feature 3: Rule Management Commands

**New File**: `lib/commands/rules-management.js`

```javascript
import { syncRules, checkVersion } from '../rule-sync/sync-pull.js';
import { listRules, addRule, removeRule } from '../rule-sync/registry.js';

export async function syncRulesCommand(options) {
  // Call existing sync-pull logic
}

export async function listRulesCommand(options) {
  // Call existing registry logic
}

export async function addRuleCommand(profile, options) {
  // Call existing registry.addRule
}
```

**Integration Point**: `bin/diet103.js`

```javascript
// Add rules command group
const rules = program
  .command('rules')
  .description('Manage project rule profiles');

rules
  .command('sync')
  .description('Sync rules with central registry')
  .option('-f, --force', 'Force re-sync even if up to date')
  .action(syncRulesCommand);

rules
  .command('list')
  .description('List installed rule profiles')
  .action(listRulesCommand);

rules
  .command('add <profile>')
  .description('Add a new rule profile (cursor, windsurf, etc.)')
  .action(addRuleCommand);
```

---

## Testing Strategy

### For Each Feature

1. **Unit Tests**: Test command logic independently
2. **Integration Tests**: Test with real diet103 CLI
3. **User Acceptance**: Test with fresh project
4. **Regression Tests**: Ensure existing features still work

### Specific Tests

**Project Validator**:
- ✅ `diet103 project validate` in consistent project
- ✅ `diet103 project validate` with mismatch
- ✅ `diet103 project check-prd` with valid PRD
- ✅ `diet103 project check-prd` with mismatched PRD
- ✅ `diet103 project fix` auto-correction

**Shell Integration**:
- ✅ Setup in bash (Ubuntu, macOS)
- ✅ Setup in zsh (macOS default)
- ✅ Setup in fish (if available)
- ✅ Prompt shows correct project name
- ✅ Prompt color-codes status
- ✅ Rollback/uninstall works

**Rule Management**:
- ✅ `diet103 rules list` shows current rules
- ✅ `diet103 rules add cursor` installs correctly
- ✅ `diet103 rules remove cursor` removes cleanly
- ✅ `diet103 rules sync` updates from registry

---

## Documentation Deliverables

Per Documentation Economy rule:

1. **Update CHANGELOG.md** - Single source of truth for v1.3.0
2. **Update CLAUDE.md** - Add new commands to quick reference
3. **No separate completion docs** - Keep it lean

**Rule Updates**:
- Update `.cursor/rules/taskmaster/taskmaster.mdc` with new commands
- Add examples for common workflows

---

## Version Planning

**Current**: v1.2.0 (Phase 2 complete - new features)  
**Target**: v1.3.0 (Phase 3 complete - UX improvements)

**Version Bump Rationale**:
- MINOR version (1.2 → 1.3)
- New commands, no breaking changes
- Enhanced UX, backwards compatible

---

## Success Criteria

After Phase 3 implementation:

### Developer Experience
- ✅ All features discoverable via `diet103 --help`
- ✅ No manual file paths needed
- ✅ Consistent CLI interface
- ✅ One-command setup for optional features

### Project Identity
- ✅ Terminal prompt shows project name
- ✅ Color-coded status indicators
- ✅ Visual badges in documentation
- ✅ Automated validation hooks

### Rule Management
- ✅ Easy rule installation
- ✅ Version awareness
- ✅ Registry integration
- ✅ Clean add/remove workflow

### Discoverability
- ✅ Interactive guide available
- ✅ Quick start wizard
- ✅ Comprehensive help text
- ✅ Examples in documentation

---

## Risk Assessment

### Low Risk
- Project validator integration (wraps existing code)
- Rule management CLI (wraps existing code)
- Enhanced help (additive only)

### Medium Risk
- Shell integration auto-setup (modifies user's rc files)
  - **Mitigation**: Ask permission, provide rollback, test thoroughly
  - **Fallback**: Manual instructions if auto-setup fails

---

## Backwards Compatibility

All Phase 3 features are **100% backwards compatible**:

- ✅ No changes to existing commands
- ✅ No changes to existing files
- ✅ No changes to data formats
- ✅ New commands are opt-in
- ✅ Shell integration is optional

---

## Decision Time

**Which feature should we start with?**

**Recommendation**: Start with **Project Validator Integration** (3-4h)

**Why**:
- Easiest integration
- High value immediately
- Builds confidence
- No risk to user environment

**Alternative**: Start with **Rule Management** if you want cleaner codebase organization first

---

**Created**: November 14, 2025  
**Status**: Ready to implement  
**Estimated Total Time**: 12-15 hours  
**Target Version**: v1.3.0

---

*Phase 3 transforms existing powerful tools into first-class features that users actually discover and use.*

