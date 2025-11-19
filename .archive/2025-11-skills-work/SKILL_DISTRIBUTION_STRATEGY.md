# React Component Analyzer - Distribution Strategy

**Date:** November 15, 2025  
**Issue:** Where should this skill live? How do frontend projects access it?

---

## Problem Statement

We've created the **React Component Analyzer** skill in the Orchestrator project, but:

1. **Frontend projects** (data-viz, multi-layer-cal) need access to it
2. Current `sync-rules` command only syncs **rules**, not **skills**
3. No clear pattern for global skill distribution

---

## Architecture Analysis

### Current Infrastructure (PAI + diet103 patterns)

```
~/.orchestrator/              # Global Orchestrator config
├── rules/                    # ✅ SYNCED via sync-rules
│   ├── taskmaster/
│   └── cursor_rules.mdc
├── projects.json             # ✅ Registered projects
└── config.json               # ✅ Global config

~/.claude/                    # Global Claude config (PAI pattern)
├── skills/                   # ⚠️ EXISTS but NO SYNC
│   └── [skills here]
└── Claude.md                 # Global context

Orchestrator_Project/
├── .claude/
│   ├── skills/               # ✅ Source of truth
│   │   ├── react-component-analyzer/  # ← NEW SKILL
│   │   ├── scenario_manager/
│   │   └── ...
│   └── skill-rules.json      # ✅ Auto-activation rules
```

**Key Finding:** Skills exist in the architecture but **aren't synced globally** like rules are!

---

## Three Distribution Strategies

### Strategy 1: Global Skills Directory (Recommended) ⭐

**Pattern:** Mirror the `sync-rules` system for skills

```
~/.claude/skills/                          # Global skills (PAI pattern)
└── react-component-analyzer/
    ├── skill.md
    ├── README.md
    └── resources/

data-viz/.claude/settings.json
{
  "skills": {
    "autoLoad": true,
    "paths": [
      "~/.claude/skills",              // ← Global skills
      ".claude/skills"                  // ← Project-specific skills
    ]
  }
}
```

**How Projects Access:**
```bash
# One-time sync from Orchestrator
orchestrator sync-skills

# Projects automatically load from global directory
cd ~/data-viz
# Skills auto-discovered from ~/.claude/skills/
```

**Pros:**
- ✅ Consistent with PAI pattern
- ✅ Single source of truth
- ✅ Updates propagate automatically
- ✅ No duplication

**Cons:**
- ⚠️ Requires new `sync-skills` command
- ⚠️ Requires updating skill discovery logic

---

### Strategy 2: Per-Project Installation (Current Implicit)

**Pattern:** Each project installs skills independently

```
data-viz/
└── .claude/skills/
    └── react-component-analyzer/  # ← Copy from Orchestrator

multi-layer-cal/
└── .claude/skills/
    └── react-component-analyzer/  # ← Another copy
```

**How Projects Access:**
```bash
# Manual copy (current method)
cd ~/data-viz
cp -r ~/Orchestrator_Project/.claude/skills/react-component-analyzer \
      .claude/skills/

# Or via command (exists but not documented)
orchestrator skill import react-component-analyzer
```

**Pros:**
- ✅ Works today (no new infrastructure)
- ✅ Projects control their skill versions
- ✅ No global state

**Cons:**
- ❌ Manual updates required
- ❌ Duplication across projects
- ❌ Version drift
- ❌ Inconsistent experience

---

### Strategy 3: Hybrid (Global + Local Override)

**Pattern:** Global skills with project-specific overrides

```
~/.claude/skills/
└── react-component-analyzer/          # ← v1.0 (global default)

data-viz/.claude/skills/
└── react-component-analyzer/          # ← v1.1-beta (override)

multi-layer-cal/.claude/skills/
[empty - uses global]
```

**How Projects Access:**
```bash
# Sync global skills
orchestrator sync-skills

# Project uses global by default
cd ~/multi-layer-cal
# Loads from ~/.claude/skills/

# Project can override with local copy
cd ~/data-viz
orchestrator skill import react-component-analyzer --local
# Edits stay in project, not global
```

**Pros:**
- ✅ Best of both worlds
- ✅ Global default + local flexibility
- ✅ Test new versions in one project

**Cons:**
- ⚠️ More complex discovery logic
- ⚠️ Need clear precedence rules

---

## Recommended Solution: Strategy 1 + 3 (Global with Override)

### Implementation Plan

#### Phase 1: Create `sync-skills` Command

```javascript
// lib/commands/sync-skills.js
export function createSyncSkillsCommand() {
  return new Command('sync-skills')
    .description('Sync Orchestrator skills to global directory')
    .option('--dry-run', 'Show what would be synced')
    .option('--force', 'Overwrite existing skills')
    .action(async (options) => {
      const sourceSkills = path.join(__dirname, '../../.claude/skills');
      const globalSkills = path.join(os.homedir(), '.claude', 'skills');
      
      // List of skills to sync globally
      const globalSkillList = [
        'react-component-analyzer',
        'scenario_manager',
        // Add more as needed
      ];
      
      for (const skill of globalSkillList) {
        const sourcePath = path.join(sourceSkills, skill);
        const destPath = path.join(globalSkills, skill);
        
        if (options.dryRun) {
          console.log(`Would sync: ${skill}`);
        } else {
          await fs.copy(sourcePath, destPath);
          console.log(`✓ Synced ${skill} to global directory`);
        }
      }
      
      // Update all registered projects
      await updateProjectSkillPaths();
    });
}
```

#### Phase 2: Update Skill Discovery

```javascript
// lib/utils/skill-loader.js (already exists, extend it)

export async function discoverSkills() {
  const skills = [];
  
  // 1. Load from global directory
  const globalPath = path.join(os.homedir(), '.claude', 'skills');
  if (fs.existsSync(globalPath)) {
    const globalSkills = await loadSkillsFromDir(globalPath);
    skills.push(...globalSkills.map(s => ({ ...s, source: 'global' })));
  }
  
  // 2. Load from project directory (overrides global)
  const projectPath = path.join(process.cwd(), '.claude', 'skills');
  if (fs.existsSync(projectPath)) {
    const projectSkills = await loadSkillsFromDir(projectPath);
    skills.push(...projectSkills.map(s => ({ ...s, source: 'local' })));
  }
  
  // Deduplicate: Local overrides global
  return deduplicateSkills(skills);
}
```

#### Phase 3: Update Project Settings Template

```json
// templates/project-setup/template/.claude/settings.json
{
  "rules": {
    "autoLoad": true,
    "paths": [
      "~/.orchestrator/rules",
      ".cursor/rules"
    ]
  },
  "skills": {
    "autoLoad": true,
    "paths": [
      "~/.claude/skills",        // ← Global skills (NEW)
      ".claude/skills"            // ← Project skills
    ]
  }
}
```

#### Phase 4: Add Skill Manifest

```json
// ~/.claude/skills/.skill-manifest.json
{
  "version": "1.0.0",
  "lastSync": "2025-11-15T10:30:00Z",
  "source": "Orchestrator_Project",
  "skills": [
    {
      "name": "react-component-analyzer",
      "version": "1.0.0",
      "scope": "global",
      "description": "UI design to React component analysis",
      "applies_to": ["react", "frontend"]
    },
    {
      "name": "scenario_manager",
      "version": "2.1.0",
      "scope": "global",
      "description": "Scenario creation and scaffolding",
      "applies_to": ["all"]
    }
  ]
}
```

---

## How Frontend Projects Will Use It

### Initial Setup (One-Time)

```bash
# 1. Sync skills from Orchestrator to global directory
cd ~/Orchestrator_Project
npm run build      # If needed
orchestrator sync-skills

# Output:
# ✓ Synced react-component-analyzer to ~/.claude/skills/
# ✓ Synced scenario_manager to ~/.claude/skills/
# ✓ Updated 5 registered projects

# 2. Verify sync
ls ~/.claude/skills/react-component-analyzer/
# skill.md  README.md  resources/
```

### In data-viz Project

```bash
cd ~/data-viz

# Skills auto-discovered from global directory
# No manual installation needed!

# Use the skill
# Paste a design mockup and say:
"Analyze this data visualization design"

# Skill activates automatically via trigger phrases in skill-rules.json
```

### In multi-layer-cal Project

```bash
cd ~/multi-layer-cal

# Same as data-viz - just works!

# Use the skill
"Extract design system from this calendar mockup"

# Auto-activates, uses global version from ~/.claude/skills/
```

### Testing New Version in One Project

```bash
# Test v1.1-beta in data-viz only
cd ~/data-viz
orchestrator skill import react-component-analyzer --local --version 1.1-beta

# data-viz now uses local v1.1-beta
# multi-layer-cal still uses global v1.0

# Promote to global after testing
cd ~/Orchestrator_Project
# Update skill, then:
orchestrator sync-skills --force
```

---

## What About Skill-Specific Dependencies?

### React-Specific Skills Should Check Context

```javascript
// In skill activation hook
async function shouldActivateSkill(skillName, projectContext) {
  if (skillName === 'react-component-analyzer') {
    // Check if project is React-based
    const packageJson = await readPackageJson(projectContext.root);
    
    if (!packageJson.dependencies?.react) {
      console.log('⚠️ react-component-analyzer requires React project');
      return false;
    }
  }
  
  return true;
}
```

### Skill Metadata Should Declare Requirements

```json
// react-component-analyzer/metadata.json
{
  "name": "react-component-analyzer",
  "version": "1.0.0",
  "description": "UI design to React component analysis",
  "requirements": {
    "frameworks": ["react"],
    "minReactVersion": "16.8.0",
    "languages": ["typescript", "javascript"],
    "optional": {
      "cssFrameworks": ["tailwind", "styled-components", "css-modules"]
    }
  },
  "applies_to": {
    "projectTypes": ["frontend", "web", "mobile-web"],
    "filePatterns": ["src/components/**", "design/**"]
  }
}
```

---

## Migration Path

### Immediate (This Session)

1. ✅ **Keep skill in Orchestrator** - Source of truth
2. ✅ **Document distribution strategy** - This file
3. 🔲 **Create metadata.json** - Requirements and scope

### Short-Term (Next Session)

1. 🔲 **Implement `sync-skills` command** - Mirror `sync-rules`
2. 🔲 **Test in data-viz** - Verify it works for frontend projects
3. 🔲 **Update project setup template** - Auto-configure skill paths

### Medium-Term (Sprint 5)

1. 🔲 **Add skill version management** - Track versions per project
2. 🔲 **Implement skill requirements checking** - Auto-detect applicability
3. 🔲 **Create skill marketplace** - Discover and install skills

---

## Comparison to Rules System

| Aspect | Rules (`sync-rules`) | Skills (Proposed) |
|--------|---------------------|-------------------|
| **Source** | `.cursor/rules/` | `.claude/skills/` |
| **Global Location** | `~/.orchestrator/rules/` | `~/.claude/skills/` |
| **Sync Command** | `orchestrator sync-rules` | `orchestrator sync-skills` |
| **Auto-Load** | Via `.claude/settings.json` | Via `.claude/settings.json` |
| **Override** | Project rules extend global | Project skills override global |
| **Manifest** | `.rule-manifest.json` | `.skill-manifest.json` |

**Key Difference:** Rules are **additive** (global + project), skills are **override** (local replaces global).

---

## For data-viz and multi-layer-cal Specifically

### data-viz (Data Visualization Dashboard)

**Should get:**
- ✅ `react-component-analyzer` - For dashboard component designs
- ✅ `scenario_manager` - For feature scaffolding
- ❌ Shell integration skills - Not needed in frontend

**Auto-detection:**
```json
// data-viz/.claude/project-context.json
{
  "projectType": "frontend",
  "frameworks": ["react", "d3"],
  "applicableSkills": [
    "react-component-analyzer",
    "scenario_manager"
  ]
}
```

### multi-layer-cal (Multi-Layer Calendar)

**Should get:**
- ✅ `react-component-analyzer` - For calendar component designs
- ✅ `scenario_manager` - For feature scaffolding
- ⚠️ May need custom calendar-specific skill in future

**Usage Example:**
```
User: "Analyze this calendar week view design"

System: 
  1. Detects: Working in multi-layer-cal (React project)
  2. Finds: react-component-analyzer in ~/.claude/skills/
  3. Activates: Full 4-step analysis workflow
  4. Outputs: Calendar component specification
```

---

## Decision Summary

### ✅ Recommended Approach

**Use Strategy 1 + 3: Global Skills with Local Override**

1. **React Component Analyzer lives in:**
   - `Orchestrator_Project/.claude/skills/` (source)
   - `~/.claude/skills/` (global distribution)
   - `{project}/.claude/skills/` (optional override)

2. **Frontend projects access via:**
   - `orchestrator sync-skills` (one-time setup)
   - Auto-discovery from global directory
   - Settings configured in project setup template

3. **Benefits:**
   - ✅ Single source of truth (Orchestrator)
   - ✅ Automatic propagation to all projects
   - ✅ No manual copying
   - ✅ Consistent with PAI/diet103 patterns
   - ✅ Version control per-project if needed

---

## Next Steps

### Before Announcing Skill

1. **Create metadata.json**
   ```json
   {
     "name": "react-component-analyzer",
     "version": "1.0.0",
     "requirements": {
       "frameworks": ["react"],
       "minReactVersion": "16.8.0"
     }
   }
   ```

2. **Implement `sync-skills` command**
   - Mirror `sync-rules` implementation
   - Add to `bin/orchestrator`

3. **Test in frontend projects**
   - Verify auto-activation works
   - Confirm skill discovery
   - Validate React version checking

4. **Document for users**
   - Add to DAILY_WORKFLOW.md
   - Update HOW_TO_APPLY_INFRASTRUCTURE.md
   - Create SKILLS.md guide

---

## FAQ

**Q: Why not just copy the skill to each project?**  
A: Manual copying doesn't scale. When we fix bugs or add features, every project needs manual updates. Global sync solves this.

**Q: What if data-viz needs a different version than multi-layer-cal?**  
A: Local override! Copy skill to `.claude/skills/` in that project. Local version takes precedence.

**Q: How do non-React projects avoid loading this skill?**  
A: Skill metadata declares `"frameworks": ["react"]`. Discovery logic checks project type and skips if not applicable.

**Q: Can I test a new skill version before syncing globally?**  
A: Yes! Develop in Orchestrator → Test locally → Sync when stable.

**Q: Does this work with Claude Code, Cursor, and other IDEs?**  
A: Yes! The `.claude/` directory is platform-agnostic (PAI pattern). All tools read from same location.

---

**Decision:** Implement global skills directory with `sync-skills` command  
**Timeline:** Implement in Sprint 5, test in data-viz first  
**Priority:** Medium (skill works locally today, global sync is optimization)

---

**Last Updated:** November 15, 2025  
**Status:** Documented - Implementation Pending

