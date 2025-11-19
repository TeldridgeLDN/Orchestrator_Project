# diet103 Init Command - Missing Infrastructure Analysis

**Date:** November 17, 2025  
**Issue:** New projects created with `diet103 init` are missing critical PAI/diet103 infrastructure  
**Impact:** Projects like `claude_memory` lack primacy rules, proper hooks, and other standard components

---

## Executive Summary

The `diet103 init` command creates basic project structure but is **missing 6 critical infrastructure components** that should be standard in all PAI/diet103 projects based on the Orchestrator PRD and existing implementation patterns.

### Current State vs Should Be

| Component | Currently Installed? | Should Be Standard? | Priority |
|-----------|---------------------|---------------------|----------|
| **1. Primacy Rules** | ❌ NO | ✅ YES | **CRITICAL** |
| **2. Project Identity Rule** | ❌ NO | ✅ YES | **CRITICAL** |
| **3. File Lifecycle Management** | ⚠️ PARTIAL | ✅ YES | **HIGH** |
| **4. Core Hooks** | ❌ NO | ✅ YES | **HIGH** |
| **5. .gitignore** | ❌ NO | ✅ YES | **HIGH** |
| **6. .env.example** | ⚠️ PARTIAL | ✅ YES | **MEDIUM** |

---

## Detailed Gap Analysis

### 1. Primacy Rules ❌ CRITICAL GAP

**What's Missing:**
- 8 primacy rules from `.claude/rules/` NOT synced to new projects
- No automatic rule-sync registration
- No `.claude/rules/.rule-manifest.json`

**Expected Primacy Rules:**
1. `rule-integrity.md` (530 lines) - Meta-rules for governance
2. `platform-primacy.md` (311 lines) - .claude/rules precedence
3. `context-efficiency.md` (663 lines) - Token economy, 500-line limit
4. `context-isolation.md` (644 lines) - Single active context
5. `autonomy-boundaries.md` (666 lines) - When AI acts vs confirms
6. `non-interactive-execution.md` (771 lines) - Prevent blocking commands
7. `documentation-economy.md` (860 lines) - Combat doc bloat
8. `file-lifecycle-standard.md` (347 lines) - Auto-archiving

**Impact:**
- 💥 **SEVERE**: Projects lack fundamental governance rules
- 💥 Projects don't follow PAI/diet103 philosophy
- 💥 Inconsistent behavior across AI assistants
- 💥 Token inefficiency (no 500-line rule enforcement)
- 💥 Documentation bloat (no economy rule)

**Why It's Critical:**
From `PRIMACY_RULES_IMPLEMENTATION_COMPLETE.md`:
> "These rules govern the Orchestrator/diet103/PAI system, resolving existing conflicts and formalizing core principles."

From `PLATFORM_PRIMACY_RULE_COMPLETE.md`:
> "Claude rules (`.claude/rules/`) take precedence over all other AI assistant rules. This ensures consistency, platform agnosticism, and adherence to diet103 conventions."

**Existing Solution:**
- Rule-sync system exists in `lib/rule-sync/`
- Can register projects: `diet103 rules register`
- Can sync rules: `diet103 rules sync`
- **BUT** this is NEVER called during `diet103 init`

---

### 2. Project Identity Rule ❌ CRITICAL GAP

**What's Missing:**
- Customized `.cursor/rules/project-identity.mdc` NOT created
- Project-specific validation rule missing

**What Should Be Created:**
A customized version of `project-identity.mdc` with:
- Project name from init
- Project path
- Git remote (if applicable)
- Validation protocol specific to this project

**Template Variables:**
```markdown
**Canonical Name:** `{{PROJECT_NAME}}`

**Project Identifiers:**
- Working Directory: `{{PROJECT_PATH}}`
- Config File: `.taskmaster/config.json` → `global.projectName`
- Git Remote: Should contain "{{PROJECT_NAME_SLUG}}"
```

**Impact:**
- 🔴 **HIGH**: No protection against wrong-project implementations
- 🔴 Cross-project confusion (documented incident in Sprint 3)
- 🔴 Risk of implementing features in wrong project

**Evidence:**
From `.cursor/rules/project-identity.mdc`:
> "This rule was created on 2025-11-14 in response to Sprint 3 project confusion incident."

---

### 3. File Lifecycle Management ⚠️ PARTIAL

**Current Status:**
- `.mcp.json` created ✅
- `.env.example` partially created ✅
- **BUT** File Lifecycle components NOT created ❌

**What's Missing:**
According to `FILE_LIFECYCLE_STANDARD_INFRASTRUCTURE.md`:
- `.file-manifest.json` (file registry)
- `.claude/archive/` directory
- `.claude/backups/` directory
- Automatic file classification

**Expected Behavior:**
From the doc (v1.1.0 spec):
> "As of diet103 v1.1.0, **File Lifecycle Management** is now a **standard infrastructure component** that is automatically installed in all diet103-compliant projects during registration or initialization."

**Current Init Code:**
```javascript
// lib/commands/init.js does NOT call initializeFileLifecycle()
// Only diet103-repair.js (project register) calls it
```

**Impact:**
- ⚠️ **MEDIUM**: New projects lack file organization infrastructure
- ⚠️ Inconsistent with v1.1.0 specification
- ⚠️ No automatic ephemeral file archival
- ⚠️ No file tier classification

---

### 4. Core Hooks ❌ HIGH PRIORITY GAP

**What's Missing:**
Only basic `.claude/hooks/` directory created, but NO hook files installed.

**Expected Hooks:**
From `Docs/diet103_Validation_System.md` and `Docs/DIET103_QUICK_REFERENCE.md`:

**Critical Hooks (Auto-installed):**
1. `UserPromptSubmit.js` - Monitors prompts for skill activation
2. `PostToolUse.js` - Tracks Claude actions adaptively

**Optional Hooks (Project-specific):**
3. `file-lifecycle.js` - File management automation
4. `skill-activation.js` - Enhanced skill triggering
5. `session-winddown.js` - Session cleanup
6. `taskmaster-session-tracker.js` - Task tracking

**Current Init Behavior:**
```javascript
// lib/commands/init.js:129-158
// Only creates empty directories:
const directories = [
  '.claude/skills',
  '.claude/hooks',      // ← EMPTY
  '.claude/commands',
  '.claude/agents',
  '.claude/resources'
];
```

**Impact:**
- 🔴 **HIGH**: Auto-activation system DOES NOT WORK
- 🔴 Skills won't auto-activate (no UserPromptSubmit.js)
- 🔴 No adaptive behavior (no PostToolUse.js)
- 🔴 Core diet103 pattern broken

**Evidence:**
From `Docs/Orchestrator_PRD.md`:
> "**diet103 (Project-Level Infrastructure):**
> - Implements **automatic skill activation** through UserPromptSubmit hooks
> - Uses `skill-rules.json` to define trigger patterns"

Without the hooks, skill-rules.json is useless.

---

### 5. .gitignore ❌ HIGH PRIORITY GAP

**What's Missing:**
No `.gitignore` file created during init.

**Should Include:**
From `CORE_INFRASTRUCTURE_ANALYSIS.md` (Score: 4.8/5 - MUST HAVE):

```gitignore
# Environment & Secrets
.env
.env.local
*.key
*.pem

# Dependencies
node_modules/
venv/
.venv/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Build outputs
dist/
build/
*.log

# Temporary files
*.tmp
*.cache
.file-manifest.json.bak
.claude/backups/*.bak

# Optional: Task Master
# .taskmaster/tasks.json
```

**Impact:**
- 🔴 **HIGH SECURITY**: API keys could be committed (no .env ignored)
- 🔴 Repository pollution with OS files, IDE configs
- 🔴 Potential secret leaks

**Recommendation:**
> "**MAKE STANDARD IMMEDIATELY** ✅
> 
> **Benefits:**
> - ✅ Security: Prevents API key leaks
> - ✅ Cleanliness: Avoids noise in Git
> - ✅ Standard: Expected in all projects"

---

### 6. .env.example ⚠️ PARTIAL

**Current Status:**
Partially created in init.js (lines 246-280), but incomplete.

**Current Template:**
```bash
# API Keys for AI Services
# Copy this file to .env and fill in your actual keys

# Required for TaskMaster
ANTHROPIC_API_KEY=
PERPLEXITY_API_KEY=

# Optional
OPENAI_API_KEY=
GOOGLE_API_KEY=
MISTRAL_API_KEY=

# Project-specific
# Add your keys below
```

**What's Missing:**
From `CORE_INFRASTRUCTURE_ANALYSIS.md` analysis:
- XAI_API_KEY (Grok models)
- AZURE_OPENAI_API_KEY
- AZURE_OPENAI_ENDPOINT
- OLLAMA_API_KEY
- OLLAMA_BASE_URL
- OPENROUTER_API_KEY

**Impact:**
- ⚠️ **MEDIUM**: Users don't know all available API options
- ⚠️ Incomplete guidance for model switching

---

## Root Cause Analysis

### Why These Gaps Exist

**1. Init vs Register Divergence:**
- `diet103 project register` (lib/utils/diet103-repair.js) installs EVERYTHING
- `diet103 init` (lib/commands/init.js) installs MINIMAL structure
- No code sharing between the two

**Evidence:**
```javascript
// diet103-repair.js includes:
await initializeFileLifecycle(...)
// Installs hooks, rules, everything

// init.js does NOT call:
// - initializeFileLifecycle()
// - syncPrimacyRules()
// - createCoreHooks()
```

**2. Historical Artifact:**
- Init command created early (v0.x)
- Infrastructure components added later (v1.1.0+)
- Init command never updated to include new standards

**3. No Shared Infrastructure Module:**
- Each system (init, register, repair) reimplements setup
- DRY principle violated
- Updates to one don't propagate to others

---

## Recommended Solution

### Phase 1: Create Unified Infrastructure Module

**New File:** `lib/init/standard_infrastructure.js`

**Purpose:** Single source of truth for ALL standard infrastructure

```javascript
export async function installStandardInfrastructure(projectPath, projectName, options = {}) {
  const results = {
    success: true,
    installed: [],
    warnings: []
  };
  
  // 1. Primacy Rules
  await installPrimacyRules(projectPath, projectName, options);
  
  // 2. Project Identity
  await createProjectIdentityRule(projectPath, projectName, options);
  
  // 3. File Lifecycle
  await initializeFileLifecycle({ projectRoot: projectPath, ...options });
  
  // 4. Core Hooks
  await installCoreHooks(projectPath, options);
  
  // 5. .gitignore
  await createGitIgnore(projectPath, options);
  
  // 6. .env.example (enhanced)
  await createEnvExample(projectPath, options);
  
  return results;
}
```

### Phase 2: Update Init Command

**Modify:** `lib/commands/init.js`

**Add Step 4:** (after configuration files, before TaskMaster)

```javascript
// Step 4: Install Standard Infrastructure
if (verbose) {
  console.log('\n' + chalk.bold('Step 4: Installing Standard Infrastructure'));
}

const infraResult = await installStandardInfrastructure(
  targetPath, 
  config.projectName,
  { verbose, includeOptional: true }
);

if (verbose && infraResult.installed.length > 0) {
  console.log(chalk.green(`  ✓ Installed ${infraResult.installed.length} components`));
}
```

### Phase 3: Refactor Register/Repair

Update `lib/utils/diet103-repair.js` to use same shared module:

```javascript
// Replace current ad-hoc installation with:
await installStandardInfrastructure(projectPath, projectName, {
  verbose: options.verbose,
  repair: true  // Skip if exists
});
```

---

## Implementation Checklist

### Critical Priority (Do First)

- [ ] **Create `lib/init/standard_infrastructure.js`**
  - [ ] `installPrimacyRules()` function
  - [ ] `createProjectIdentityRule()` function
  - [ ] `installCoreHooks()` function
  - [ ] `createGitIgnore()` function
  - [ ] `createEnvExample()` function (enhanced)
  - [ ] Main `installStandardInfrastructure()` orchestrator

- [ ] **Implement Primacy Rules Sync**
  - [ ] Copy rules from Orchestrator `.claude/rules/`
  - [ ] Create `.rule-manifest.json`
  - [ ] Register project with rule-sync system
  - [ ] Handle missing Orchestrator gracefully

- [ ] **Implement Project Identity Creation**
  - [ ] Template customization with project name
  - [ ] Detect git remote if available
  - [ ] Create `.cursor/rules/project-identity.mdc`

- [ ] **Implement Core Hooks Installation**
  - [ ] Copy `UserPromptSubmit.js` from templates
  - [ ] Copy `PostToolUse.js` from templates
  - [ ] Make hooks executable (chmod +x)
  - [ ] Validate hook syntax

### High Priority (Do Second)

- [ ] **Update Init Command**
  - [ ] Import `installStandardInfrastructure`
  - [ ] Add Step 4 after configuration files
  - [ ] Update step numbering
  - [ ] Add verbose output
  - [ ] Handle errors gracefully

- [ ] **Create .gitignore Template**
  - [ ] Include all standard patterns
  - [ ] Add diet103-specific exclusions
  - [ ] Comment sections clearly

- [ ] **Integrate File Lifecycle**
  - [ ] Call `initializeFileLifecycle()` from shared module
  - [ ] Ensure consistency with diet103-repair.js

### Medium Priority (Do Third)

- [ ] **Refactor diet103-repair.js**
  - [ ] Use shared infrastructure module
  - [ ] Remove duplicate code
  - [ ] Maintain backward compatibility

- [ ] **Enhance .env.example**
  - [ ] Add all supported API keys
  - [ ] Group by provider
  - [ ] Add comments explaining each key

- [ ] **Add Tests**
  - [ ] Test init with all options
  - [ ] Verify all files created
  - [ ] Test rule sync integration
  - [ ] Test hook installation

### Documentation Updates

- [ ] **Update QUICK_START_GUIDE.md**
  - [ ] Document what gets installed
  - [ ] Show example output

- [ ] **Update CLI_REFERENCE.md**
  - [ ] Document new init behavior
  - [ ] List all installed components

- [ ] **Update CHANGELOG.md**
  - [ ] Add breaking changes note
  - [ ] Document new infrastructure

---

## Benefits After Fix

### For New Projects

✅ **Instant Compliance**: All projects start 100% diet103/PAI compliant  
✅ **Primacy Rules**: Governance and best practices built-in  
✅ **Working Auto-Activation**: Skills activate automatically  
✅ **Security**: .gitignore prevents secret leaks  
✅ **Organization**: File Lifecycle manages ephemeral files  
✅ **Validation**: Project Identity prevents wrong-project work

### For Ecosystem

✅ **Consistency**: All projects have same foundation  
✅ **Maintainability**: Single source of truth for infrastructure  
✅ **DRY Principle**: No duplicate setup code  
✅ **Future-Proof**: Easy to add new standard components

### Token Efficiency

✅ **500-line Rule**: Enforced from day 1 (context-efficiency.md)  
✅ **Documentation Economy**: Prevents bloat (documentation-economy.md)  
✅ **Progressive Disclosure**: Only load what's needed  
✅ **Estimated Savings**: ~31,000 tokens per context load ($62/year per project)

---

## Testing Plan

### Unit Tests

```bash
# Test standard infrastructure installation
npm test lib/init/standard_infrastructure.test.js

# Test individual components
npm test lib/init/primacy_rules_installer.test.js
npm test lib/init/project_identity_creator.test.js
npm test lib/init/hooks_installer.test.js
```

### Integration Tests

```bash
# Test full init flow
npm test tests/integration/init_command.test.js

# Test with various project types
npm test tests/integration/init_scenarios.test.js
```

### Manual Testing

```bash
# Create test project
mkdir /tmp/test-init && cd /tmp/test-init
diet103 init --name="Test Project" --no-interactive

# Verify all components
ls -la .claude/rules/          # Should have 8+ rule files
ls -la .cursor/rules/          # Should have project-identity.mdc
ls -la .claude/hooks/          # Should have UserPromptSubmit.js, PostToolUse.js
ls -la .file-manifest.json     # Should exist
ls -la .gitignore              # Should exist
cat .env.example               # Should have all API keys

# Check rule manifest
cat .claude/rules/.rule-manifest.json | jq '.rules | keys'
```

---

## Priority Justification

### Why Primacy Rules Are CRITICAL

From the research:

1. **Foundation of System**:
   > "These 8 primacy rules govern the Orchestrator/diet103/PAI system"

2. **Total Impact**:
   > "~4,250 lines of formalized governance"
   > "$150+/year in token/time savings"

3. **Platform Agnostic**:
   > "Ensures consistency, platform agnosticism, and adherence to diet103 conventions across all AI coding assistants"

4. **Conflict Resolution**:
   > "Resolves actual conflict between File Lifecycle (CRITICAL/PERMANENT/EPHEMERAL) and Documentation Economy (Tier 1/2/3) tier systems"

### Why Hooks Are HIGH Priority

From the PRD:

> "**diet103 (Project-Level Infrastructure):**
> - A production-tested reference library for Claude Code environments
> - Implements **automatic skill activation** through UserPromptSubmit hooks"

**Without hooks, diet103 doesn't work.**

---

## Risk Assessment

### If Not Fixed

| Risk | Likelihood | Impact | Severity |
|------|-----------|--------|----------|
| Projects lack governance | 100% | High | 🔴 **CRITICAL** |
| Auto-activation broken | 100% | High | 🔴 **CRITICAL** |
| API key leaks | 60% | Critical | 🔴 **CRITICAL** |
| Wrong-project work | 40% | Medium | 🟡 **HIGH** |
| Documentation bloat | 80% | Medium | 🟡 **HIGH** |
| Token inefficiency | 100% | Medium | 🟡 **HIGH** |

### If Fixed

| Benefit | Certainty | Impact | Value |
|---------|-----------|--------|-------|
| 100% compliance | 100% | High | 🟢 **HIGH** |
| Working auto-activation | 100% | High | 🟢 **HIGH** |
| Security by default | 100% | Critical | 🟢 **CRITICAL** |
| Consistent behavior | 100% | High | 🟢 **HIGH** |
| Token savings | 100% | Medium | 🟢 **MEDIUM** |

---

## Conclusion

The `diet103 init` command has **significant gaps** that make new projects non-compliant with PAI/diet103 principles:

**Critical Gaps (Must Fix):**
1. Primacy Rules NOT synced
2. Project Identity Rule NOT created
3. Core Hooks NOT installed

**High Priority Gaps (Should Fix):**
4. .gitignore NOT created
5. File Lifecycle NOT fully initialized

**Medium Priority Gaps (Could Fix):**
6. .env.example incomplete

**Recommended Action:** Implement unified infrastructure module and update init command to use it.

**Estimated Effort:** 
- Phase 1 (Shared Module): 4-6 hours
- Phase 2 (Update Init): 2-3 hours
- Phase 3 (Refactor Repair): 2-3 hours
- Testing & Documentation: 3-4 hours
- **Total: ~12-16 hours**

**Impact:** All new projects will be fully compliant, consistent, and functional from day 1.

---

**Status:** 📋 Analysis Complete - Ready for Implementation  
**Date:** November 17, 2025  
**Next Step:** Create implementation plan and begin Phase 1








