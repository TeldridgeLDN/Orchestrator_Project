# diet103 Infrastructure Validation & Auto-Repair System

**Purpose:** Comprehensive plan for validating and repairing diet103 infrastructure in projects managed by the Orchestrator.

**Version:** 1.0
**Date:** 2025-11-07
**Related:** [Quick_Implementation_Reference.md](Quick_Implementation_Reference.md), [DIET103_IMPLEMENTATION.md](../DIET103_IMPLEMENTATION.md)

---

## Overview

When an existing project is registered with the Orchestrator, the system must validate that it has complete diet103 infrastructure. If gaps exist, the system should detect and repair them automatically until reaching 100% confidence.

### Validation Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DETECT: Check if diet103 infrastructure exists          │
│    └─> Scan for .claude/ directory and core files          │
│                                                             │
│ 2. ANALYZE: Identify what exists vs what's missing         │
│    └─> Compare against diet103 1.2.0 specification         │
│                                                             │
│ 3. SCORE: Calculate completeness percentage                │
│    └─> Critical: 100%, Important: 75%, Optional: 50%       │
│                                                             │
│ 4. REPAIR: Auto-install missing components                 │
│    └─> Use templates, preserve existing customizations     │
│                                                             │
│ 5. VERIFY: Confirm 100% confidence in infrastructure       │
│    └─> Run validation checks, test hooks                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Core diet103 Components Checklist

### Critical (Must Exist - 100% Required)

These components are **absolutely required** for diet103 functionality:

```bash
✓ .claude/                          # Root directory
✓ .claude/Claude.md                 # Project context
✓ .claude/metadata.json             # Project manifest
✓ .claude/skill-rules.json          # Auto-activation rules
✓ .claude/hooks/                    # Hooks directory
✓ .claude/hooks/UserPromptSubmit.js # Pre-prompt validation
✓ .claude/hooks/PostToolUse.js      # Post-edit validation
```

**Total:** 7 components

### Important (Should Exist - 75% Recommended)

These components are **strongly recommended** for full diet103 functionality:

```bash
✓ .claude/skills/                   # Skills directory
✓ .claude/commands/                 # Slash commands directory
✓ .claude/agents/                   # Agents directory
✓ .claude/resources/                # Resources directory
✓ .claude/README.md                 # Infrastructure documentation
```

**Total:** 5 components

### Optional (Nice to Have - 50% Optional)

These components are **optional** but enhance the developer experience:

```bash
○ .claude/settings.local.json       # Claude Code settings
○ dev/                              # Dev docs (diet103 pattern)
○ dev/active/                       # Active task documentation
```

**Total:** 3 components

---

## Detection Logic

### Phase 1: Existence Check

**Location:** `~/.claude/lib/utils/diet103-validator.js`

```javascript
export async function detectDiet103Infrastructure(projectPath) {
  const checks = {
    hasDotClaude: false,
    hasClaudeMd: false,
    hasMetadata: false,
    hasSkillRules: false,
    hasHooks: false,
    hasUserPromptSubmit: false,
    hasPostToolUse: false,
    hasSkillsDir: false,
    hasCommandsDir: false,
    hasAgentsDir: false,
    hasResourcesDir: false,
    hasReadme: false,
    diet103Version: null
  };

  const claudeDir = path.join(projectPath, '.claude');

  // Check .claude/ directory exists
  if (fs.existsSync(claudeDir)) {
    checks.hasDotClaude = true;

    // Check critical files
    checks.hasClaudeMd = fs.existsSync(path.join(claudeDir, 'Claude.md'));
    checks.hasMetadata = fs.existsSync(path.join(claudeDir, 'metadata.json'));
    checks.hasSkillRules = fs.existsSync(path.join(claudeDir, 'skill-rules.json'));
    checks.hasReadme = fs.existsSync(path.join(claudeDir, 'README.md'));

    // Check hooks
    const hooksDir = path.join(claudeDir, 'hooks');
    checks.hasHooks = fs.existsSync(hooksDir);
    checks.hasUserPromptSubmit = fs.existsSync(path.join(hooksDir, 'UserPromptSubmit.js'));
    checks.hasPostToolUse = fs.existsSync(path.join(hooksDir, 'PostToolUse.js'));

    // Check directories
    checks.hasSkillsDir = fs.existsSync(path.join(claudeDir, 'skills'));
    checks.hasCommandsDir = fs.existsSync(path.join(claudeDir, 'commands'));
    checks.hasAgentsDir = fs.existsSync(path.join(claudeDir, 'agents'));
    checks.hasResourcesDir = fs.existsSync(path.join(claudeDir, 'resources'));

    // Check diet103 version
    if (checks.hasMetadata) {
      try {
        const metadata = JSON.parse(fs.readFileSync(path.join(claudeDir, 'metadata.json'), 'utf8'));
        checks.diet103Version = metadata.diet103_version || null;
      } catch (err) {
        // Invalid JSON, will be caught in consistency check
      }
    }
  }

  return checks;
}
```

### Phase 2: Gap Analysis

**Location:** `~/.claude/lib/utils/diet103-validator.js`

```javascript
export function analyzeDiet103Gaps(checks) {
  const gaps = {
    critical: [],
    important: [],
    optional: [],
    score: 0,
    isComplete: false
  };

  // Critical gaps (must be fixed)
  if (!checks.hasDotClaude) gaps.critical.push('.claude/ directory missing');
  if (!checks.hasClaudeMd) gaps.critical.push('Claude.md missing');
  if (!checks.hasMetadata) gaps.critical.push('metadata.json missing');
  if (!checks.hasSkillRules) gaps.critical.push('skill-rules.json missing');
  if (!checks.hasHooks) gaps.critical.push('hooks/ directory missing');
  if (!checks.hasUserPromptSubmit) gaps.critical.push('hooks/UserPromptSubmit.js missing');
  if (!checks.hasPostToolUse) gaps.critical.push('hooks/PostToolUse.js missing');

  // Important gaps (should be fixed)
  if (!checks.hasSkillsDir) gaps.important.push('skills/ directory missing');
  if (!checks.hasCommandsDir) gaps.important.push('commands/ directory missing');
  if (!checks.hasAgentsDir) gaps.important.push('agents/ directory missing');
  if (!checks.hasResourcesDir) gaps.important.push('resources/ directory missing');
  if (!checks.hasReadme) gaps.important.push('README.md missing');

  // Calculate completeness score
  const criticalCount = 7; // Total critical components
  const importantCount = 5; // Total important components

  const criticalMet = criticalCount - gaps.critical.length;
  const importantMet = importantCount - gaps.important.length;

  // Weighted score: 70% critical, 30% important
  gaps.score = Math.round(
    ((criticalMet / criticalCount) * 0.7 + (importantMet / importantCount) * 0.3) * 100
  );

  gaps.isComplete = gaps.critical.length === 0 && gaps.important.length === 0;

  return gaps;
}
```

### Phase 3: Consistency Validation

**Location:** `~/.claude/lib/utils/diet103-validator.js`

```javascript
export async function validateDiet103Consistency(projectPath) {
  const issues = [];
  const claudeDir = path.join(projectPath, '.claude');

  // 1. Validate metadata.json structure
  try {
    const metadata = JSON.parse(fs.readFileSync(path.join(claudeDir, 'metadata.json'), 'utf8'));

    if (!metadata.project_id) issues.push('metadata.json missing project_id');
    if (!metadata.version) issues.push('metadata.json missing version');
    if (!metadata.diet103_version) issues.push('metadata.json missing diet103_version');
    if (metadata.diet103_version && metadata.diet103_version !== '1.2.0') {
      issues.push(`metadata.json has outdated diet103_version: ${metadata.diet103_version} (expected 1.2.0)`);
    }

    // Validate skills array
    if (!metadata.skills || !Array.isArray(metadata.skills)) {
      issues.push('metadata.json missing or invalid skills array');
    }
  } catch (err) {
    issues.push(`metadata.json parse error: ${err.message}`);
  }

  // 2. Validate skill-rules.json structure
  try {
    const skillRules = JSON.parse(fs.readFileSync(path.join(claudeDir, 'skill-rules.json'), 'utf8'));

    if (!skillRules.rules || !Array.isArray(skillRules.rules)) {
      issues.push('skill-rules.json missing or invalid rules array');
    }
  } catch (err) {
    issues.push(`skill-rules.json parse error: ${err.message}`);
  }

  // 3. Validate hooks are executable
  const userPromptSubmit = path.join(claudeDir, 'hooks', 'UserPromptSubmit.js');
  const postToolUse = path.join(claudeDir, 'hooks', 'PostToolUse.js');

  try {
    if (fs.existsSync(userPromptSubmit)) {
      const stats = fs.statSync(userPromptSubmit);
      if (!(stats.mode & 0o111)) {
        issues.push('UserPromptSubmit.js not executable (run: chmod +x)');
      }
    }

    if (fs.existsSync(postToolUse)) {
      const stats = fs.statSync(postToolUse);
      if (!(stats.mode & 0o111)) {
        issues.push('PostToolUse.js not executable (run: chmod +x)');
      }
    }
  } catch (err) {
    issues.push(`Hook permission check failed: ${err.message}`);
  }

  // 4. Validate skills directory structure (if exists)
  const skillsDir = path.join(claudeDir, 'skills');
  if (fs.existsSync(skillsDir)) {
    const skills = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory());

    for (const skill of skills) {
      const skillPath = path.join(skillsDir, skill.name);
      const skillMd = path.join(skillPath, 'skill.md');
      const skillMdUpper = path.join(skillPath, 'SKILL.md');

      if (!fs.existsSync(skillMd) && !fs.existsSync(skillMdUpper)) {
        issues.push(`Skill ${skill.name} missing skill.md or SKILL.md (diet103 requires one)`);
      }
    }
  }

  // 5. Validate Claude.md has minimum content
  try {
    const claudeMd = fs.readFileSync(path.join(claudeDir, 'Claude.md'), 'utf8');
    if (claudeMd.trim().length < 50) {
      issues.push('Claude.md appears to be empty or too short (minimum context required)');
    }
  } catch (err) {
    issues.push(`Claude.md read error: ${err.message}`);
  }

  return issues;
}
```

---

## Auto-Repair Workflow

### Command: `claude project validate <name> --repair`

**Location:** `~/.claude/lib/commands/validate.js`

```javascript
export async function validateProject(projectName, options) {
  const config = loadConfig();
  const project = config.projects[projectName];

  if (!project) {
    throw new Error(`Project '${projectName}' not found`);
  }

  console.log(`\nValidating diet103 infrastructure for: ${projectName}`);
  console.log(`Path: ${project.path}\n`);

  // Phase 1: Detection
  console.log('Phase 1: Detecting infrastructure...');
  const checks = await detectDiet103Infrastructure(project.path);

  // Phase 2: Gap Analysis
  console.log('Phase 2: Analyzing gaps...');
  const gaps = analyzeDiet103Gaps(checks);

  console.log(`\nCompleteness Score: ${gaps.score}%`);

  if (gaps.critical.length > 0) {
    console.log('\n❌ Critical Issues:');
    gaps.critical.forEach(issue => console.log(`  - ${issue}`));
  }

  if (gaps.important.length > 0) {
    console.log('\n⚠️  Important Issues:');
    gaps.important.forEach(issue => console.log(`  - ${issue}`));
  }

  // Phase 3: Consistency Validation
  if (gaps.critical.length === 0) {
    console.log('\nPhase 3: Validating consistency...');
    const issues = await validateDiet103Consistency(project.path);

    if (issues.length > 0) {
      console.log('\n⚠️  Consistency Issues:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('✓ Consistency checks passed');
    }
  }

  // Phase 4: Auto-Repair (if --repair flag)
  if (options.repair) {
    if (gaps.critical.length > 0 || gaps.important.length > 0) {
      console.log('\n🔧 Auto-Repair Mode: Installing missing components...\n');
      await repairDiet103Infrastructure(project.path, gaps, checks);

      // Re-validate
      console.log('\n✓ Re-validating...');
      const newChecks = await detectDiet103Infrastructure(project.path);
      const recheckGaps = analyzeDiet103Gaps(newChecks);
      console.log(`\nNew Completeness Score: ${recheckGaps.score}%`);

      if (recheckGaps.isComplete) {
        console.log('✅ diet103 infrastructure is now complete!\n');
      }
    } else {
      console.log('\n✅ No repairs needed - infrastructure is complete!\n');
    }
  } else {
    console.log('\nRun with --repair flag to automatically fix issues.\n');
  }
}
```

### Repair Implementation

**Location:** `~/.claude/lib/utils/diet103-repair.js`

```javascript
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function repairDiet103Infrastructure(projectPath, gaps, checks) {
  const claudeDir = path.join(projectPath, '.claude');
  const templateBase = path.join(os.homedir(), '.claude', 'templates', 'base', '.claude');

  // Create .claude/ if missing
  if (!checks.hasDotClaude) {
    console.log('  ✓ Creating .claude/ directory');
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  // Install critical components
  if (!checks.hasClaudeMd) {
    console.log('  ✓ Installing Claude.md');
    const projectName = path.basename(projectPath);
    const template = fs.readFileSync(path.join(templateBase, 'Claude.md'), 'utf8');
    const content = template.replace(/{{PROJECT_NAME}}/g, projectName)
                           .replace(/{{CREATED_DATE}}/g, new Date().toISOString());
    fs.writeFileSync(path.join(claudeDir, 'Claude.md'), content);
  }

  if (!checks.hasMetadata) {
    console.log('  ✓ Installing metadata.json');
    const metadata = {
      project_id: path.basename(projectPath),
      version: '0.1.0',
      description: 'Project managed by Orchestrator',
      skills: [],
      created: new Date().toISOString(),
      diet103_version: '1.2.0',
      tags: []
    };
    fs.writeFileSync(path.join(claudeDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
  }

  if (!checks.hasSkillRules) {
    console.log('  ✓ Installing skill-rules.json');
    fs.copyFileSync(
      path.join(templateBase, 'skill-rules.json'),
      path.join(claudeDir, 'skill-rules.json')
    );
  }

  // Install hooks
  if (!checks.hasHooks) {
    console.log('  ✓ Creating hooks/ directory');
    fs.mkdirSync(path.join(claudeDir, 'hooks'), { recursive: true });
  }

  if (!checks.hasUserPromptSubmit) {
    console.log('  ✓ Installing UserPromptSubmit.js');
    const hookPath = path.join(claudeDir, 'hooks', 'UserPromptSubmit.js');
    fs.copyFileSync(path.join(templateBase, 'hooks', 'UserPromptSubmit.js'), hookPath);
    fs.chmodSync(hookPath, 0o755); // Make executable
  }

  if (!checks.hasPostToolUse) {
    console.log('  ✓ Installing PostToolUse.js');
    const hookPath = path.join(claudeDir, 'hooks', 'PostToolUse.js');
    fs.copyFileSync(path.join(templateBase, 'hooks', 'PostToolUse.js'), hookPath);
    fs.chmodSync(hookPath, 0o755); // Make executable
  }

  // Install important directories
  const dirs = [
    { check: 'hasSkillsDir', name: 'skills' },
    { check: 'hasCommandsDir', name: 'commands' },
    { check: 'hasAgentsDir', name: 'agents' },
    { check: 'hasResourcesDir', name: 'resources' }
  ];

  for (const dir of dirs) {
    if (!checks[dir.check]) {
      console.log(`  ✓ Creating ${dir.name}/ directory`);
      const dirPath = path.join(claudeDir, dir.name);
      fs.mkdirSync(dirPath, { recursive: true });

      // Copy README if exists in template
      const readmePath = path.join(templateBase, dir.name, 'README.md');
      if (fs.existsSync(readmePath)) {
        fs.copyFileSync(readmePath, path.join(dirPath, 'README.md'));
      }
    }
  }

  // Install README
  if (!checks.hasReadme) {
    console.log('  ✓ Installing README.md');
    fs.copyFileSync(
      path.join(templateBase, 'README.md'),
      path.join(claudeDir, 'README.md')
    );
  }

  console.log('\n✅ Repair complete!');
}
```

---

## Integration with Project Commands

### On Project Registration (`claude project register`)

```javascript
export async function registerProject(projectPath, options) {
  // ... existing registration logic ...

  // Auto-validate diet103 infrastructure
  console.log('\nValidating diet103 infrastructure...');
  const checks = await detectDiet103Infrastructure(projectPath);
  const gaps = analyzeDiet103Gaps(checks);

  if (gaps.score < 100) {
    console.log(`\n⚠️  Infrastructure completeness: ${gaps.score}%`);

    if (gaps.critical.length > 0) {
      console.log('❌ Critical components missing. Auto-repair required.\n');

      if (options.autoRepair !== false) {
        await repairDiet103Infrastructure(projectPath, gaps, checks);
      } else {
        console.log('Run with --repair flag or use: claude project validate <name> --repair\n');
      }
    }
  } else {
    console.log('✅ diet103 infrastructure complete');
  }
}
```

### On Project Switch (`claude project switch`)

```javascript
export async function switchProject(projectName, options) {
  // ... existing switch logic ...

  // Quick validation check (if enabled in config)
  if (options.validate !== false) {
    const checks = await detectDiet103Infrastructure(project.path);
    const gaps = analyzeDiet103Gaps(checks);

    if (gaps.score < 85) {
      console.log(`\n⚠️  Warning: Project infrastructure is ${gaps.score}% complete`);
      console.log('Run: claude project validate ' + projectName + ' --repair\n');

      // Block switch if score too low
      if (gaps.score < 70) {
        throw new Error('Project infrastructure incomplete (< 70%). Run validation first.');
      }
    }
  }
}
```

### On Project Creation (`claude project create`)

```javascript
export async function createProject(projectName, options) {
  // ... create project from template ...

  // Validate installation was successful
  const checks = await detectDiet103Infrastructure(project.path);
  const gaps = analyzeDiet103Gaps(checks);

  if (gaps.score !== 100) {
    console.log(`\n⚠️  Warning: Template installation incomplete (${gaps.score}%)`);
    console.log('Run: claude project validate ' + projectName + ' --repair\n');
  } else {
    console.log('\n✅ diet103 infrastructure fully installed\n');
  }
}
```

---

## Validation Report Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
diet103 Infrastructure Validation Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project: my-shopify-store
Path: /Users/you/Projects/my-shopify-store
Validated: 2025-11-07 14:30:00

COMPLETENESS SCORE: 85%

✅ Critical Components (7/7)
  ✓ .claude/ directory
  ✓ Claude.md
  ✓ metadata.json (diet103 v1.2.0)
  ✓ skill-rules.json
  ✓ hooks/ directory
  ✓ UserPromptSubmit.js (executable)
  ✓ PostToolUse.js (executable)

⚠️  Important Components (3/5)
  ✓ skills/ directory (2 skills detected)
  ✓ commands/ directory (3 commands detected)
  ✗ agents/ directory (MISSING)
  ✗ resources/ directory (MISSING)
  ✓ README.md

CONSISTENCY CHECKS:
  ✓ metadata.json structure valid
  ✓ metadata.json has diet103_version: 1.2.0
  ✓ skill-rules.json valid (4 rules configured)
  ✓ UserPromptSubmit.js executable
  ✓ PostToolUse.js executable
  ✓ All skills have skill.md
  ✓ Claude.md has sufficient content

RECOMMENDATIONS:
  1. Create agents/ directory for specialized task handlers
  2. Create resources/ directory for additional documentation
  3. Consider adding project-specific slash commands

Run with --repair flag to automatically apply fixes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Confidence Level System

The validation system provides clear confidence levels:

| Score | Level | Description | Action |
|-------|-------|-------------|--------|
| **100%** | Complete | All critical & important components present and valid | ✅ Ready to use |
| **85-99%** | Good | All critical components present, some important missing | ⚠️ Minor repair recommended |
| **70-84%** | Incomplete | Some critical components missing | ❌ Repair required |
| **<70%** | Insufficient | Major infrastructure gaps | 🚫 Full installation required |

**Orchestrator Policy:**
- **Allow switching:** 85%+ confidence
- **Warn on switch:** 70-84% confidence
- **Block switching:** <70% confidence (requires repair first)

---

## Testing the Validation System

### Manual Testing

```bash
# Test detection on existing project
claude project validate my-project

# Test auto-repair
claude project validate my-project --repair

# Test on project registration
claude project register /path/to/existing/project

# Test with auto-repair on register
claude project register /path/to/existing/project --auto-repair

# Test on project switch
claude project switch my-project

# Bypass validation on switch (not recommended)
claude project switch my-project --no-validate

# Verbose output
claude project validate my-project --verbose --repair
```

### Automated Testing

**Location:** `~/.claude/tests/diet103-validator.test.js`

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectDiet103Infrastructure, analyzeDiet103Gaps, validateDiet103Consistency } from '../lib/utils/diet103-validator.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('diet103 Validation System', () => {
  let testProjectPath;

  beforeEach(() => {
    // Create temporary test project
    testProjectPath = path.join(os.tmpdir(), 'test-project-' + Date.now());
    fs.mkdirSync(testProjectPath, { recursive: true });
  });

  afterEach(() => {
    // Cleanup
    fs.rmSync(testProjectPath, { recursive: true, force: true });
  });

  describe('detectDiet103Infrastructure', () => {
    it('should detect missing .claude directory', async () => {
      const checks = await detectDiet103Infrastructure(testProjectPath);
      expect(checks.hasDotClaude).toBe(false);
    });

    it('should detect existing .claude directory', async () => {
      fs.mkdirSync(path.join(testProjectPath, '.claude'));
      const checks = await detectDiet103Infrastructure(testProjectPath);
      expect(checks.hasDotClaude).toBe(true);
    });

    it('should detect all critical components', async () => {
      // Create full structure
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'Claude.md'), '# Test');
      fs.writeFileSync(path.join(claudeDir, 'metadata.json'), JSON.stringify({ diet103_version: '1.2.0' }));
      fs.writeFileSync(path.join(claudeDir, 'skill-rules.json'), JSON.stringify({ rules: [] }));
      fs.mkdirSync(path.join(claudeDir, 'hooks'), { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'hooks', 'UserPromptSubmit.js'), '#!/usr/bin/env node\n');
      fs.writeFileSync(path.join(claudeDir, 'hooks', 'PostToolUse.js'), '#!/usr/bin/env node\n');

      const checks = await detectDiet103Infrastructure(testProjectPath);

      expect(checks.hasClaudeMd).toBe(true);
      expect(checks.hasMetadata).toBe(true);
      expect(checks.hasSkillRules).toBe(true);
      expect(checks.hasUserPromptSubmit).toBe(true);
      expect(checks.hasPostToolUse).toBe(true);
      expect(checks.diet103Version).toBe('1.2.0');
    });
  });

  describe('analyzeDiet103Gaps', () => {
    it('should return 0% score for empty project', () => {
      const checks = { hasDotClaude: false /* all false */ };
      const gaps = analyzeDiet103Gaps(checks);
      expect(gaps.score).toBe(0);
      expect(gaps.critical.length).toBeGreaterThan(0);
    });

    it('should return 100% score for complete project', () => {
      const checks = {
        hasDotClaude: true,
        hasClaudeMd: true,
        hasMetadata: true,
        hasSkillRules: true,
        hasHooks: true,
        hasUserPromptSubmit: true,
        hasPostToolUse: true,
        hasSkillsDir: true,
        hasCommandsDir: true,
        hasAgentsDir: true,
        hasResourcesDir: true,
        hasReadme: true
      };
      const gaps = analyzeDiet103Gaps(checks);
      expect(gaps.score).toBe(100);
      expect(gaps.isComplete).toBe(true);
    });

    it('should calculate weighted score correctly', () => {
      // All critical, no important
      const checks = {
        hasDotClaude: true,
        hasClaudeMd: true,
        hasMetadata: true,
        hasSkillRules: true,
        hasHooks: true,
        hasUserPromptSubmit: true,
        hasPostToolUse: true,
        hasSkillsDir: false,
        hasCommandsDir: false,
        hasAgentsDir: false,
        hasResourcesDir: false,
        hasReadme: false
      };
      const gaps = analyzeDiet103Gaps(checks);
      expect(gaps.score).toBe(70); // 70% weight on critical
    });
  });

  describe('validateDiet103Consistency', () => {
    it('should detect invalid metadata.json', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'metadata.json'), 'invalid json');

      const issues = await validateDiet103Consistency(testProjectPath);
      expect(issues.some(issue => issue.includes('parse error'))).toBe(true);
    });

    it('should detect missing diet103_version', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'metadata.json'), JSON.stringify({ project_id: 'test' }));

      const issues = await validateDiet103Consistency(testProjectPath);
      expect(issues.some(issue => issue.includes('diet103_version'))).toBe(true);
    });

    it('should detect non-executable hooks', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(path.join(claudeDir, 'hooks'), { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'hooks', 'UserPromptSubmit.js'), '#!/usr/bin/env node\n');
      fs.chmodSync(path.join(claudeDir, 'hooks', 'UserPromptSubmit.js'), 0o644); // Not executable

      const issues = await validateDiet103Consistency(testProjectPath);
      expect(issues.some(issue => issue.includes('not executable'))).toBe(true);
    });
  });
});
```

---

## Implementation Files

### New Files to Create

```bash
# Core validation system
~/.claude/lib/utils/diet103-validator.js      # Detection & analysis (350 lines)
~/.claude/lib/utils/diet103-repair.js         # Auto-repair logic (200 lines)

# Updated commands
~/.claude/lib/commands/validate.js             # Enhanced validate command (150 lines)
~/.claude/lib/commands/register.js             # Auto-validate on register (add 30 lines)
~/.claude/lib/commands/switch.js               # Quick check on switch (add 20 lines)
~/.claude/lib/commands/create.js               # Validate on create (add 15 lines)

# Tests
~/.claude/tests/diet103-validator.test.js      # Validation tests (400 lines)
~/.claude/tests/diet103-repair.test.js         # Repair tests (300 lines)
```

### Total Implementation Effort

- **diet103-validator.js:** ~4 hours
- **diet103-repair.js:** ~3 hours
- **Command updates:** ~2 hours
- **Tests:** ~3 hours
- **Documentation:** ~1 hour

**Total:** ~13 hours

---

## Usage Examples

### Example 1: Validate Existing Project

```bash
$ claude project validate my-shopify-store

Validating diet103 infrastructure for: my-shopify-store
Path: /Users/you/Projects/my-shopify-store

Phase 1: Detecting infrastructure...
Phase 2: Analyzing gaps...

Completeness Score: 85%

⚠️  Important Issues:
  - agents/ directory missing
  - resources/ directory missing

Phase 3: Validating consistency...
✓ Consistency checks passed

Run with --repair flag to automatically fix issues.
```

### Example 2: Auto-Repair Project

```bash
$ claude project validate my-shopify-store --repair

Validating diet103 infrastructure for: my-shopify-store
Path: /Users/you/Projects/my-shopify-store

Phase 1: Detecting infrastructure...
Phase 2: Analyzing gaps...

Completeness Score: 85%

⚠️  Important Issues:
  - agents/ directory missing
  - resources/ directory missing

🔧 Auto-Repair Mode: Installing missing components...

  ✓ Creating agents/ directory
  ✓ Creating resources/ directory

✅ Repair complete!

✓ Re-validating...

New Completeness Score: 100%
✅ diet103 infrastructure is now complete!
```

### Example 3: Register with Auto-Repair

```bash
$ claude project register /Users/you/Projects/legacy-project

Registering project at: /Users/you/Projects/legacy-project

Validating diet103 infrastructure...

⚠️  Infrastructure completeness: 45%
❌ Critical components missing. Auto-repair required.

🔧 Installing missing components...

  ✓ Creating .claude/ directory
  ✓ Installing Claude.md
  ✓ Installing metadata.json
  ✓ Installing skill-rules.json
  ✓ Creating hooks/ directory
  ✓ Installing UserPromptSubmit.js
  ✓ Installing PostToolUse.js
  ✓ Creating skills/ directory
  ✓ Creating commands/ directory
  ✓ Creating agents/ directory
  ✓ Creating resources/ directory
  ✓ Installing README.md

✅ Repair complete!
✅ diet103 infrastructure complete

Project 'legacy-project' registered successfully.
```

---

## Next Steps

1. **Implement validator module** (`diet103-validator.js`)
2. **Implement repair module** (`diet103-repair.js`)
3. **Update command files** (validate, register, switch, create)
4. **Write comprehensive tests**
5. **Test on real projects** (orchestrator-project, test projects)
6. **Document in CLI reference**

---

**Last Updated:** 2025-11-07
**Status:** Planning Complete - Ready for Implementation
**Related Docs:** [Quick_Implementation_Reference.md](Quick_Implementation_Reference.md), [DIET103_IMPLEMENTATION.md](../DIET103_IMPLEMENTATION.md), [Orchestrator_PRD.md](Orchestrator_PRD.md)
