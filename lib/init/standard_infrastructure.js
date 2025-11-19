/**
 * Standard Infrastructure Module
 * 
 * Unified module for installing all standard PAI/diet103 infrastructure components.
 * Used by both `diet103 init` and `diet103 project register` to ensure consistency.
 * 
 * @module init/standard_infrastructure
 * @version 1.0.0
 */

import path from 'path';
import { promises as fs } from 'fs';
import chalk from 'chalk';
import { initializeFileLifecycle } from './file_lifecycle_init.js';

/**
 * Install all standard infrastructure components
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {string} projectName - Name of the project
 * @param {Object} options - Configuration options
 * @param {boolean} [options.verbose=false] - Show detailed output
 * @param {boolean} [options.skipIfExists=true] - Skip components that already exist
 * @param {boolean} [options.includeOptional=false] - Include optional components
 * @returns {Promise<Object>} Installation results
 */
export async function installStandardInfrastructure(projectPath, projectName, options = {}) {
  const {
    verbose = false,
    skipIfExists = true,
    includeOptional = false
  } = options;
  
  const results = {
    success: true,
    installed: [],
    skipped: [],
    warnings: [],
    errors: []
  };
  
  try {
    // 1. Install Primacy Rules
    if (verbose) console.log(chalk.dim('  → Installing primacy rules...'));
    const rulesResult = await installPrimacyRules(projectPath, {
      verbose,
      skipIfExists
    });
    if (rulesResult.installed > 0) {
      results.installed.push(`${rulesResult.installed} primacy rules`);
    }
    if (rulesResult.skipped > 0) {
      results.skipped.push(`${rulesResult.skipped} primacy rules (already exist)`);
    }
    
    // 2. Create Project Identity Rule
    if (verbose) console.log(chalk.dim('  → Creating project identity rule...'));
    const identityResult = await createProjectIdentityRule(projectPath, projectName, {
      verbose,
      skipIfExists
    });
    if (identityResult.created) {
      results.installed.push('project identity rule');
    } else if (identityResult.skipped) {
      results.skipped.push('project identity rule (already exists)');
    }
    
    // 3. Install Core Hooks
    if (verbose) console.log(chalk.dim('  → Installing core hooks...'));
    const hooksResult = await installCoreHooks(projectPath, {
      verbose,
      skipIfExists
    });
    if (hooksResult.installed > 0) {
      results.installed.push(`${hooksResult.installed} core hooks`);
    }
    if (hooksResult.skipped > 0) {
      results.skipped.push(`${hooksResult.skipped} hooks (already exist)`);
    }
    
    // 4. Create .gitignore
    if (verbose) console.log(chalk.dim('  → Creating .gitignore...'));
    const gitignoreResult = await createGitIgnore(projectPath, {
      verbose,
      skipIfExists
    });
    if (gitignoreResult.created) {
      results.installed.push('.gitignore');
    } else if (gitignoreResult.skipped) {
      results.skipped.push('.gitignore (already exists)');
    }
    
    // 5. Initialize File Lifecycle
    if (verbose) console.log(chalk.dim('  → Initializing file lifecycle management...'));
    const lifecycleResult = await initializeFileLifecycle({
      projectRoot: projectPath,
      verbose: false
    });
    if (lifecycleResult && lifecycleResult.created) {
      results.installed.push('file lifecycle management');
    }
    
  } catch (error) {
    results.success = false;
    results.errors.push(error.message);
    if (verbose) {
      console.error(chalk.red(`  ✗ Error: ${error.message}`));
    }
  }
  
  return results;
}

/**
 * Install primacy rules from Orchestrator project
 */
async function installPrimacyRules(projectPath, options = {}) {
  const { verbose = false, skipIfExists = true } = options;
  const result = { installed: 0, skipped: 0, errors: [] };
  
  const rulesDir = path.join(projectPath, '.claude', 'rules');
  await fs.mkdir(rulesDir, { recursive: true });
  
  // Find Orchestrator project (source of primacy rules)
  const orchestratorPath = await findOrchestratorProject();
  if (!orchestratorPath) {
    if (verbose) {
      console.warn(chalk.yellow('    ⚠ Orchestrator project not found, skipping primacy rules'));
    }
    return result;
  }
  
  const sourceRulesDir = path.join(orchestratorPath, '.claude', 'rules');
  
  // List of primacy rules to copy
  const primacyRules = [
    'rule-integrity.md',
    'platform-primacy.md',
    'context-efficiency.md',
    'context-isolation.md',
    'autonomy-boundaries.md',
    'non-interactive-execution.md',
    'documentation-economy.md',
    'file-lifecycle-standard.md',
    'core-infrastructure-standard.md'
  ];
  
  for (const ruleName of primacyRules) {
    const sourcePath = path.join(sourceRulesDir, ruleName);
    const targetPath = path.join(rulesDir, ruleName);
    
    try {
      // Check if source exists
      await fs.access(sourcePath);
      
      // Check if target exists
      const targetExists = await fs.access(targetPath).then(() => true).catch(() => false);
      
      if (targetExists && skipIfExists) {
        result.skipped++;
        continue;
      }
      
      // Copy the rule
      await fs.copyFile(sourcePath, targetPath);
      result.installed++;
      
      if (verbose) {
        console.log(chalk.dim(`    ✓ ${ruleName}`));
      }
    } catch (error) {
      result.errors.push(`${ruleName}: ${error.message}`);
    }
  }
  
  // Copy rule manifest
  try {
    const manifestSource = path.join(sourceRulesDir, '.rule-manifest.json');
    const manifestTarget = path.join(rulesDir, '.rule-manifest.json');
    await fs.copyFile(manifestSource, manifestTarget);
    if (verbose) {
      console.log(chalk.dim('    ✓ .rule-manifest.json'));
    }
  } catch (error) {
    if (verbose) {
      console.warn(chalk.yellow('    ⚠ Could not copy rule manifest'));
    }
  }
  
  return result;
}

/**
 * Create customized project identity rule
 */
async function createProjectIdentityRule(projectPath, projectName, options = {}) {
  const { verbose = false, skipIfExists = true } = options;
  const result = { created: false, skipped: false };
  
  const targetDir = path.join(projectPath, '.cursor', 'rules');
  const targetPath = path.join(targetDir, 'project-identity.mdc');
  
  // Check if already exists
  const exists = await fs.access(targetPath).then(() => true).catch(() => false);
  if (exists && skipIfExists) {
    result.skipped = true;
    return result;
  }
  
  await fs.mkdir(targetDir, { recursive: true });
  
  // Get git remote if available
  let gitRemote = '';
  try {
    const { execSync } = await import('child_process');
    gitRemote = execSync('git remote get-url origin 2>/dev/null || echo ""', {
      cwd: projectPath,
      encoding: 'utf-8'
    }).trim();
  } catch (error) {
    // No git remote, that's okay
  }
  
  const template = `---
description: Validate project identity before implementations to prevent wrong-project work
globs: **/*
alwaysApply: true
---

# Project Identity Validation

**CRITICAL RULE: Always validate project context before implementing tasks**

## Current Project

**Canonical Name:** \`${projectName}\`

**Project Identifiers:**
- Working Directory: \`${projectPath}\`
- Config File: \`.taskmaster/config.json\` → \`global.projectName\`
${gitRemote ? `- Git Remote: ${gitRemote}` : '- Git Remote: Not configured'}

## Validation Protocol

### Before ANY Implementation

When starting work on a task, especially from a PRD:

1. **Verify Working Directory**
   \`\`\`bash
   # Expected: ${projectPath}
   pwd
   \`\`\`

2. **Check Config Project Name**
   \`\`\`json
   // .taskmaster/config.json
   {
     "global": {
       "projectName": "${projectName}"  // ← Must match
     }
   }
   \`\`\`

3. **If Reading a PRD, Validate Project Field**
   \`\`\`markdown
   **Project**: [Name Here]
   
   ✅ CORRECT: "${projectName}" or similar variations
   ❌ WRONG: Any other project name
   \`\`\`

### If Mismatch Detected

**STOP IMMEDIATELY and alert user:**

\`\`\`
⚠️ PROJECT IDENTITY MISMATCH DETECTED

Current Working Directory: ${projectName}
PRD Project Field: [Different Project Name]

This indicates one of:
1. Wrong PRD being used in this project
2. Copy-paste error in PRD header
3. You're in the wrong project directory

🛑 CONFIRM WITH USER:
- Which project should this work be done in?
- Should the PRD be updated?
- Is this intentional cross-project work?

DO NOT PROCEED until user clarifies.
\`\`\`

## Verbalization Protocol

When starting significant work, explicitly state project context:

\`\`\`
"I'm working in ${projectName}. Let me verify the task requirements 
match this project before proceeding..."

[After checking PRD]
"✅ Confirmed: Task is for ${projectName}. Proceeding with implementation."

OR

"⚠️ Warning: PRD indicates [Other Project] but we're in ${projectName}. 
Please clarify before I proceed."
\`\`\`

## Cross-Project Work

If user explicitly wants to implement features from ProjectA in ProjectB:

1. **Require Explicit Confirmation**
   - User must state: "Yes, implement ProjectA features in ProjectB"
   
2. **Document the Decision**
   - Add note to task: "Cross-project implementation approved by user"
   - Explain why this makes sense

3. **Extra Caution**
   - Double-check all file paths
   - Verify dependencies are compatible
   - Test thoroughly

## Validation Tools

Use these to verify project identity:

\`\`\`bash
# Quick project check
echo "Directory: $(basename $(pwd))"
jq -r '"Config: " + .global.projectName' .taskmaster/config.json 2>/dev/null || echo "No taskmaster config"
git remote get-url origin 2>/dev/null | sed 's/.*\\///' | sed 's/\\.git$//' | xargs -I {} echo "Git: {}" || echo "No git remote"
\`\`\`

## Critical Files to Check

Before implementing, quickly scan these for project identity:

1. \`.taskmaster/config.json\` → \`global.projectName\`
2. \`package.json\` → \`name\` (if exists)
3. \`README.md\` → Project title

All should refer to the same project.

## Consequences of Violation

If project validation is skipped and wrong project is implemented:

- ⚠️ **Minor:** Wasted time, need to delete and redo
- 🔴 **Major:** Code incompatibility, merge conflicts
- 💥 **Critical:** Production incidents, data corruption

**Always validate. Always.**

---

*When in doubt about project identity, ask the user. 
Better to ask once than implement in the wrong project.*
`;
  
  await fs.writeFile(targetPath, template, 'utf-8');
  result.created = true;
  
  if (verbose) {
    console.log(chalk.dim('    ✓ project-identity.mdc'));
  }
  
  return result;
}

/**
 * Install core hooks (UserPromptSubmit.js and PostToolUse.js)
 */
async function installCoreHooks(projectPath, options = {}) {
  const { verbose = false, skipIfExists = true } = options;
  const result = { installed: 0, skipped: 0, errors: [] };
  
  const hooksDir = path.join(projectPath, '.claude', 'hooks');
  await fs.mkdir(hooksDir, { recursive: true });
  
  // Find Orchestrator project (source of hooks)
  const orchestratorPath = await findOrchestratorProject();
  if (!orchestratorPath) {
    if (verbose) {
      console.warn(chalk.yellow('    ⚠ Orchestrator project not found, skipping hooks'));
    }
    return result;
  }
  
  const sourceHooksDir = path.join(orchestratorPath, '.claude', 'hooks');
  
  // Core hooks to install
  const coreHooks = [
    'UserPromptSubmit.js',
    'PostToolUse.js'
  ];
  
  for (const hookName of coreHooks) {
    const sourcePath = path.join(sourceHooksDir, hookName);
    const targetPath = path.join(hooksDir, hookName);
    
    try {
      // Check if source exists
      await fs.access(sourcePath);
      
      // Check if target exists
      const targetExists = await fs.access(targetPath).then(() => true).catch(() => false);
      
      if (targetExists && skipIfExists) {
        result.skipped++;
        continue;
      }
      
      // Copy the hook
      await fs.copyFile(sourcePath, targetPath);
      
      // Make executable
      await fs.chmod(targetPath, 0o755);
      
      result.installed++;
      
      if (verbose) {
        console.log(chalk.dim(`    ✓ ${hookName}`));
      }
    } catch (error) {
      result.errors.push(`${hookName}: ${error.message}`);
    }
  }
  
  return result;
}

/**
 * Create .gitignore file
 */
async function createGitIgnore(projectPath, options = {}) {
  const { verbose = false, skipIfExists = true } = options;
  const result = { created: false, skipped: false };
  
  const targetPath = path.join(projectPath, '.gitignore');
  
  // Check if already exists
  const exists = await fs.access(targetPath).then(() => true).catch(() => false);
  if (exists && skipIfExists) {
    result.skipped = true;
    return result;
  }
  
  const content = `# Environment & Secrets
.env
.env.local
.env.*.local
*.key
*.pem
*.p12

# Dependencies
node_modules/
venv/
.venv/
__pycache__/
*.pyc
*.pyo

# IDE & Editors
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# OS Files
.DS_Store
Thumbs.db
desktop.ini

# Build Outputs
dist/
build/
*.log
*.pid
*.seed
*.pid.lock

# Temporary Files
*.tmp
*.temp
*.cache
.file-manifest.json.bak
.claude/backups/*.bak

# Test Coverage
coverage/
htmlcov/
.coverage
.pytest_cache/
*.cover

# Optional: TaskMaster (uncomment if you want to exclude task files)
# .taskmaster/tasks/tasks.json
# .taskmaster/tasks/*.md
`;
  
  await fs.writeFile(targetPath, content, 'utf-8');
  result.created = true;
  
  if (verbose) {
    console.log(chalk.dim('    ✓ .gitignore'));
  }
  
  return result;
}

/**
 * Find Orchestrator project path
 * Looks in common locations and uses registry if available
 */
async function findOrchestratorProject() {
  // Try common locations
  const commonPaths = [
    path.resolve(process.cwd(), '..', 'Orchestrator_Project'),
    path.resolve(process.cwd()),  // Could be current project
    path.join(process.env.HOME, 'Orchestrator_Project'),
    path.join(process.env.HOME, 'Projects', 'Orchestrator_Project'),
    path.join(process.env.HOME, 'projects', 'Orchestrator_Project'),
  ];
  
  for (const testPath of commonPaths) {
    try {
      // Check if it's the Orchestrator project by looking for marker files
      const rulesManifest = path.join(testPath, '.claude', 'rules', '.rule-manifest.json');
      await fs.access(rulesManifest);
      return testPath;
    } catch (error) {
      // Not this path, try next
    }
  }
  
  // Try to find via registry
  try {
    const registryPath = path.join(process.env.HOME, '.orchestrator', 'projects.json');
    const registryData = await fs.readFile(registryPath, 'utf-8');
    const registry = JSON.parse(registryData);
    
    for (const [projectPath, projectData] of Object.entries(registry.projects || {})) {
      if (projectData.name === 'Orchestrator_Project' || projectData.role === 'source') {
        return projectPath;
      }
    }
  } catch (error) {
    // Registry doesn't exist or can't be read
  }
  
  return null;
}

/**
 * Export individual functions for testing and direct use
 */
export {
  installPrimacyRules,
  createProjectIdentityRule,
  installCoreHooks,
  createGitIgnore,
  findOrchestratorProject
};







