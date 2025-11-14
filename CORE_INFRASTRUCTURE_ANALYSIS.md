# Core Infrastructure Analysis & Recommendations

**Date:** November 14, 2025  
**Purpose:** Identify additional features that should be standard diet103 infrastructure  
**Context:** Following File Lifecycle Management becoming standard in v1.1.0

---

## Executive Summary

After making **File Lifecycle Management** standard infrastructure, we analyzed what other components should be automatically installed in all diet103 projects to ensure consistency and alignment with PAI/diet103 philosophy.

### Current State

**What IS Standard (diet103 v1.1.0):**
- ✅ `.claude/` directory structure
- ✅ `Claude.md` (project context)
- ✅ `metadata.json` (project manifest)
- ✅ `skill-rules.json` (auto-activation)
- ✅ `hooks/` (UserPromptSubmit.js, PostToolUse.js)
- ✅ `skills/`, `commands/`, `agents/`, `resources/` directories
- ✅ **File Lifecycle Management** (.file-manifest.json, archive/, backups/)

**What Could Be Standard:**
- ❓ TaskMaster integration
- ❓ `.mcp.json` configuration
- ❓ `.env` template
- ❓ Health monitoring system
- ❓ Git integration (`.gitignore`, branch strategies)
- ❓ Testing infrastructure
- ❓ Documentation templates

---

## Analysis Framework

### Evaluation Criteria

For each candidate feature, we assess:

1. **Philosophy Alignment**: Does it align with PAI/diet103 core principles?
2. **Universal Benefit**: Do ALL projects benefit from this?
3. **Low Overhead**: Is setup/maintenance cost acceptable?
4. **Non-Intrusive**: Can projects opt-out easily if needed?
5. **Maturity**: Is the feature production-ready?

### Scoring System

| Score | Recommendation |
|-------|----------------|
| **5/5** | **MUST HAVE** - Should be standard immediately |
| **4/5** | **SHOULD HAVE** - Strong candidate for standard |
| **3/5** | **COULD HAVE** - Project-specific, offer as template |
| **2/5** | **NICE TO HAVE** - Optional enhancement |
| **1/5** | **SKIP** - Not suitable for standard infrastructure |

---

## Candidate Features Analysis

### 1. TaskMaster Integration

**Current Status:** Optional (installed on demand)

#### Evaluation

| Criterion | Score | Rationale |
|-----------|-------|-----------|
| **Philosophy Alignment** | 4/5 | PAI emphasizes organized workflows; TaskMaster provides structure |
| **Universal Benefit** | 3/5 | Many projects benefit, but not ALL (tiny scripts, experiments) |
| **Low Overhead** | 3/5 | Requires API keys, adds complexity |
| **Non-Intrusive** | 4/5 | Can be ignored if not needed |
| **Maturity** | 5/5 | Production-ready, well-tested |
| **TOTAL** | **3.8/5** | **SHOULD HAVE** (with conditions) |

#### Recommendation: **CONDITIONAL STANDARD**

**Make Standard IF:**
- User confirms during `init` (opt-in prompt)
- API keys available
- Project size > single file

**Implementation:**
```bash
# During diet103 init
diet103 init
# Prompt: "Include TaskMaster for task management? (y/n)"
# If yes: Install TaskMaster infrastructure
# If no: Skip, can add later with 'diet103 add taskmaster'
```

**What Gets Installed:**
- `.taskmaster/` directory structure
- `.taskmaster/config.json`
- TaskMaster MCP integration in `.mcp.json`
- TaskMaster hooks (optional)

**Benefits:**
- ✅ Consistent task management across projects
- ✅ Better organization for complex features
- ✅ Integration with File Lifecycle (classify task summaries)

**Concerns:**
- ❌ Not all projects need task management
- ❌ Requires API keys (adds setup burden)
- ❌ Increases complexity for simple projects

---

### 2. `.mcp.json` Configuration

**Current Status:** Created during registration, auto-fixed

#### Evaluation

| Criterion | Score | Rationale |
|-----------|-------|-----------|
| **Philosophy Alignment** | 5/5 | Core to MCP integration, enables tool usage |
| **Universal Benefit** | 5/5 | ALL projects using Claude Code benefit |
| **Low Overhead** | 5/5 | Single file, minimal maintenance |
| **Non-Intrusive** | 5/5 | Ignored if not using MCP |
| **Maturity** | 5/5 | Standard Anthropic specification |
| **TOTAL** | **5.0/5** | **MUST HAVE** |

#### Recommendation: **MAKE STANDARD IMMEDIATELY** ✅

**Already Partially Implemented:** 
- ✅ Created during registration
- ✅ Auto-fixed by MCP validator
- ❌ Not always created during `init`

**Action Required:** Ensure `.mcp.json` is created during BOTH:
1. `diet103 init` (new projects)
2. `diet103 project register` (existing projects) ← Already done

**Template:**
```json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "",
        "PERPLEXITY_API_KEY": "",
        "OPENAI_API_KEY": ""
      },
      "disabled": true
    }
  }
}
```

**Benefits:**
- ✅ MCP tools work out of the box
- ✅ Consistent MCP configuration
- ✅ Easy to enable tools (flip `disabled` flag)

---

### 3. `.env` Template

**Current Status:** Not standard (manual creation)

#### Evaluation

| Criterion | Score | Rationale |
|-----------|-------|-----------|
| **Philosophy Alignment** | 4/5 | Security best practice, supports automation |
| **Universal Benefit** | 4/5 | Most projects need API keys or secrets |
| **Low Overhead** | 5/5 | Single file, one-time setup |
| **Non-Intrusive** | 5/5 | Ignored if not needed, standard practice |
| **Maturity** | 5/5 | Universal convention |
| **TOTAL** | **4.6/5** | **MUST HAVE** |

#### Recommendation: **MAKE STANDARD IMMEDIATELY** ✅

**What Gets Installed:**
- `.env.example` - Template with common keys
- `.gitignore` entry for `.env` - Security

**Template:**
```bash
# API Keys for AI Services
# Copy to .env and fill in your keys

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

**Benefits:**
- ✅ Security: Secrets not committed
- ✅ Convenience: Clear what keys are needed
- ✅ Standard: Follows universal conventions

---

### 4. `.gitignore` Configuration

**Current Status:** Not standard (manual creation)

#### Evaluation

| Criterion | Score | Rationale |
|-----------|-------|-----------|
| **Philosophy Alignment** | 4/5 | Protects critical files, prevents pollution |
| **Universal Benefit** | 5/5 | ALL projects using Git benefit |
| **Low Overhead** | 5/5 | Single file, rare updates |
| **Non-Intrusive** | 5/5 | Git standard, harmless if no Git |
| **Maturity** | 5/5 | Universal Git convention |
| **TOTAL** | **4.8/5** | **MUST HAVE** |

#### Recommendation: **MAKE STANDARD IMMEDIATELY** ✅

**What Gets Ignored:**
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

# Optional: Task Master (if user wants)
# .taskmaster/tasks.json
```

**Benefits:**
- ✅ Security: Prevents API key leaks
- ✅ Cleanliness: Avoids noise in Git
- ✅ Standard: Expected in all projects

---

### 5. Health Monitoring System

**Current Status:** Exists in Orchestrator, not standard

#### Evaluation

| Criterion | Score | Rationale |
|-----------|-------|-----------|
| **Philosophy Alignment** | 5/5 | Proactive health checks align with diet103 validation |
| **Universal Benefit** | 4/5 | Most projects benefit, especially long-lived ones |
| **Low Overhead** | 4/5 | Lightweight checks, on-demand execution |
| **Non-Intrusive** | 4/5 | Can be ignored, runs only when invoked |
| **Maturity** | 4/5 | Proven in Orchestrator |
| **TOTAL** | **4.2/5** | **SHOULD HAVE** |

#### Recommendation: **ADD TO STANDARD (v1.2.0)** 📅

**What Gets Installed:**
- `lib/health/` directory (in Orchestrator, reference only)
- Health check command: `diet103 health`
- Integration with File Lifecycle stats

**Health Metrics:**
```javascript
{
  structure_validity: 40%,    // diet103 compliance
  hook_status: 30%,           // Hooks present & executable
  skill_activity: 20%,        // Skills defined & used
  file_organization: 10%      // File Lifecycle metrics ← NEW
}
```

**Benefits:**
- ✅ Proactive issue detection
- ✅ Consistent health standards
- ✅ Integrates with existing validation

**Implementation Priority:** Medium (after core features)

---

### 6. Documentation Templates

**Current Status:** Not standard (manual creation)

#### Evaluation

| Criterion | Score | Rationale |
|-----------|-------|-----------|
| **Philosophy Alignment** | 4/5 | Supports progressive disclosure, UFC pattern |
| **Universal Benefit** | 3/5 | Helps most projects, not critical |
| **Low Overhead** | 5/5 | Static templates, one-time setup |
| **Non-Intrusive** | 5/5 | Can be ignored or customized |
| **Maturity** | 4/5 | Templates exist in Orchestrator |
| **TOTAL** | **4.2/5** | **SHOULD HAVE** |

#### Recommendation: **ADD TO STANDARD (v1.2.0)** 📅

**What Gets Installed:**
```
templates/
├── documentation/
│   ├── README_TEMPLATE.md
│   ├── IMPLEMENTATION_GUIDE_TEMPLATE.md
│   ├── API_REFERENCE_TEMPLATE.md
│   └── QUICK_REFERENCE_TEMPLATE.md
└── skills/
    └── SKILL_TEMPLATE.md
```

**Benefits:**
- ✅ Consistent documentation structure
- ✅ Reduces documentation friction
- ✅ Follows diet103 500-line rule

**Implementation Priority:** Low (nice to have)

---

### 7. Testing Infrastructure

**Current Status:** Project-specific

#### Evaluation

| Criterion | Score | Rationale |
|-----------|-------|-----------|
| **Philosophy Alignment** | 3/5 | Quality is important, but diet103 doesn't mandate testing |
| **Universal Benefit** | 3/5 | Many projects benefit, but test frameworks vary |
| **Low Overhead** | 2/5 | Framework-specific, adds dependencies |
| **Non-Intrusive** | 3/5 | Can be ignored, but adds files/deps |
| **Maturity** | 4/5 | Many options exist (Jest, Vitest, pytest) |
| **TOTAL** | **3.0/5** | **COULD HAVE** |

#### Recommendation: **OPTIONAL TEMPLATE, NOT STANDARD** ❌

**Reasoning:**
- Testing frameworks are language/framework-specific
- No one-size-fits-all solution
- Too opinionated for standard infrastructure

**Alternative:** Provide templates during `init`:
```bash
diet103 init
# Prompt: "Select testing framework:"
#   1) None
#   2) Jest (JavaScript)
#   3) Vitest (JavaScript)
#   4) pytest (Python)
#   5) Custom
```

---

### 8. Git Integration (Branch Strategies)

**Current Status:** Not standard

#### Evaluation

| Criterion | Score | Rationale |
|-----------|-------|-----------|
| **Philosophy Alignment** | 3/5 | Helpful but not core to diet103 |
| **Universal Benefit** | 4/5 | Most projects use Git |
| **Low Overhead** | 3/5 | Adds configuration, workflow docs |
| **Non-Intrusive** | 4/5 | Can be ignored |
| **Maturity** | 4/5 | Well-established patterns |
| **TOTAL** | **3.6/5** | **COULD HAVE** |

#### Recommendation: **OPTIONAL TEMPLATE, NOT STANDARD** ❌

**Reasoning:**
- Git workflows vary by team/org
- Too opinionated for universal standard
- `.gitignore` is enough for standard

**Alternative:** Offer as workflow template:
```bash
diet103 workflow add git-flow
# Installs Git Flow documentation and branch templates
```

---

## Summary of Recommendations

### **IMMEDIATE - Add to v1.1.1** (High Priority)

| Feature | Action | Effort | Impact |
|---------|--------|--------|--------|
| **`.mcp.json`** | Ensure created during `init` | Low | High |
| **`.env.example`** | Create template | Low | High |
| **`.gitignore`** | Create standard file | Low | High |

**Rationale:** These are low-effort, high-impact, universally beneficial, and align perfectly with best practices.

### **SHORT-TERM - Add to v1.2.0** (Medium Priority)

| Feature | Action | Effort | Impact |
|---------|--------|--------|--------|
| **TaskMaster Integration** | Make opt-in during `init` | Medium | High |
| **Health Monitoring** | Add `diet103 health` with File Lifecycle | Medium | Medium |
| **Documentation Templates** | Add to `templates/` | Low | Medium |

**Rationale:** These add significant value but require more implementation work or conditional logic.

### **LONG-TERM - Consider for v2.0** (Low Priority)

| Feature | Action | Effort | Impact |
|---------|--------|--------|--------|
| **Testing Infrastructure** | Offer as optional templates | Medium | Low |
| **Git Workflows** | Offer as workflow library | Low | Low |

**Rationale:** Too project-specific to be universal standard, better as optional enhancements.

---

## Implementation Plan

### Phase 1: Critical Infrastructure (v1.1.1) - THIS WEEK

**Goal:** Add universally beneficial, low-overhead features

#### 1. Update `diet103-repair.js`

Add to `installCriticalComponents()`:

```javascript
// Create .mcp.json if missing
const mcpConfigPath = path.join(projectPath, '.mcp.json');
if (!fs.existsSync(mcpConfigPath)) {
  const mcpTemplate = {
    mcpServers: {
      "task-master-ai": {
        command: "npx",
        args: ["-y", "task-master-ai"],
        env: {
          ANTHROPIC_API_KEY: "",
          PERPLEXITY_API_KEY: "",
          OPENAI_API_KEY: ""
        },
        disabled: true
      }
    }
  };
  await fs.promises.writeFile(
    mcpConfigPath,
    JSON.stringify(mcpTemplate, null, 2),
    'utf8'
  );
  installed.push('.mcp.json');
}

// Create .env.example
const envExamplePath = path.join(projectPath, '.env.example');
if (!fs.existsSync(envExamplePath)) {
  const envTemplate = `# API Keys for AI Services
# Copy to .env and fill in your keys

# Required for TaskMaster
ANTHROPIC_API_KEY=
PERPLEXITY_API_KEY=

# Optional
OPENAI_API_KEY=
GOOGLE_API_KEY=
`;
  await fs.promises.writeFile(envExamplePath, envTemplate, 'utf8');
  installed.push('.env.example');
}

// Create .gitignore
const gitignorePath = path.join(projectPath, '.gitignore');
if (!fs.existsSync(gitignorePath)) {
  const gitignoreTemplate = `# Environment & Secrets
.env
.env.local
*.key

# Dependencies
node_modules/
venv/

# Build outputs
dist/
build/
*.log
`;
  await fs.promises.writeFile(gitignorePath, gitignoreTemplate, 'utf8');
  installed.push('.gitignore');
}
```

#### 2. Update `init.js`

Ensure same files created during `diet103 init`.

#### 3. Testing

```bash
# Test new project
mkdir test-project && cd test-project
diet103 init

# Verify files exist
ls -la .mcp.json .env.example .gitignore

# Test existing project registration
cd /path/to/existing-project
diet103 project register --verbose

# Verify files created
```

**Estimated Effort:** 2-3 hours  
**Target Date:** November 15, 2025

---

### Phase 2: Enhanced Features (v1.2.0) - NEXT SPRINT

#### 1. TaskMaster Opt-In

Add prompt during `diet103 init`:

```javascript
// During init
const { includeTaskmaster } = await prompts({
  type: 'confirm',
  name: 'includeTaskmaster',
  message: 'Include TaskMaster for task management?',
  initial: true
});

if (includeTaskmaster) {
  await initializeTaskMaster(projectPath);
}
```

#### 2. Health Monitoring Integration

```bash
# New command
diet103 health

# Output
Project Health Score: 85%
├── Structure Validity: 90% (diet103 compliance)
├── Hook Status: 100% (all hooks present & executable)
├── Skill Activity: 70% (3/5 skills active)
└── File Organization: 80% (File Lifecycle metrics)

Recommendations:
- Consider activating unused skills
- 15 ephemeral files ready for archival
```

#### 3. Documentation Templates

Add to `templates/documentation/` directory.

**Estimated Effort:** 1-2 weeks  
**Target Date:** December 2025

---

## Backward Compatibility

### All Changes Are Additive

- ✅ No breaking changes to existing functionality
- ✅ Existing projects continue working unchanged
- ✅ New files only added if missing
- ✅ No overwrites of existing configuration

### Migration Path

```bash
# For existing projects, re-register to add new infrastructure
cd /path/to/existing-project
diet103 project register --verbose

# New infrastructure automatically added:
# ✅ .mcp.json (if missing)
# ✅ .env.example (if missing)
# ✅ .gitignore (if missing)
# ✅ File Lifecycle (already added in v1.1.0)
```

---

## Risk Assessment

### Low Risk Changes (Phase 1)

| Risk | Mitigation |
|------|------------|
| File conflicts | Check existence before creating |
| User customization | Never overwrite existing files |
| Project-specific needs | All files can be safely deleted/ignored |

### Medium Risk Changes (Phase 2)

| Risk | Mitigation |
|------|------------|
| TaskMaster complexity | Make opt-in, clear documentation |
| Health scoring controversy | Make recommendations, not requirements |
| Template preferences | Offer multiple options, easy to customize |

---

## Success Metrics

### Phase 1 Success Criteria

- [ ] `.mcp.json` created in 100% of new projects
- [ ] `.env.example` created in 100% of new projects
- [ ] `.gitignore` created in 100% of new projects
- [ ] Zero breaking changes reported
- [ ] Positive user feedback

### Phase 2 Success Criteria

- [ ] TaskMaster adoption rate > 60% (opt-in)
- [ ] Health command used regularly
- [ ] Documentation templates reduce doc friction
- [ ] Maintains 100% backward compatibility

---

## Conclusion

**Immediate Actions (v1.1.1):**

1. ✅ Add `.mcp.json` to standard infrastructure
2. ✅ Add `.env.example` to standard infrastructure
3. ✅ Add `.gitignore` to standard infrastructure

**These three additions:**
- Align with universal best practices
- Require minimal effort
- Provide immediate value
- Are completely non-intrusive
- Follow security and organizational standards

**Future Enhancements (v1.2.0+):**
- TaskMaster opt-in integration
- Health monitoring with File Lifecycle metrics
- Documentation templates

**Not Recommended for Standard:**
- Testing infrastructure (too varied)
- Git workflow strategies (too opinionated)

---

**Status:** Analysis Complete, Ready for Implementation  
**Next Step:** Implement Phase 1 changes (v1.1.1)  
**Estimated Timeline:** Phase 1 complete by November 15, 2025

---

**Document Version:** 1.0  
**Date:** November 14, 2025  
**Author:** AI Agent Analysis  
**Reviewed:** Pending



---

## ✅ IMPLEMENTATION UPDATE - November 14, 2025

### Phase 1: COMPLETE

All three high-priority features have been successfully implemented:

1. **`.mcp.json`** - ✅ Implemented in diet103-repair.js and init.js
2. **`.env.example`** - ✅ Implemented in diet103-repair.js and init.js  
3. **`.gitignore`** - ✅ Implemented in diet103-repair.js and init.js

**Testing Results**:
- ✅ New project creation: All files installed
- ✅ Existing project registration: Files installed during repair
- ✅ Content validation: All templates correct

**Documentation**:
- ✅ Implementation guide: `CORE_INFRASTRUCTURE_IMPLEMENTATION_COMPLETE.md`
- ✅ Platform-agnostic rule: `.claude/rules/core-infrastructure-standard.md`

**Version**: diet103 v1.1.1

See `CORE_INFRASTRUCTURE_IMPLEMENTATION_COMPLETE.md` for complete implementation details.

### Next Steps

**Phase 2 & 3**: Awaiting user direction. Recommendations for medium and low priority features are documented above.

**Recommended Approach**: Deploy Phase 1 changes to production, monitor adoption, and gather user feedback before implementing Phase 2/3 features.

