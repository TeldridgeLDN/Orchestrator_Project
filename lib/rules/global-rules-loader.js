#!/usr/bin/env node

/**
 * Global Rules Loader
 * 
 * Ensures critical Orchestrator rules are loaded in ALL projects,
 * not just the Orchestrator project itself.
 * 
 * Inspired by Daniel Miessler's Personal AI Infrastructure pattern:
 * https://github.com/danielmiessler/Personal_AI_Infrastructure
 * 
 * Strategy:
 * 1. Global rules in ~/.orchestrator/rules/ (cross-project)
 * 2. Project-specific rules in .cursor/rules/ (per-project)
 * 3. Both are auto-loaded by Claude
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GLOBAL_RULES_DIR = path.join(os.homedir(), '.orchestrator', 'rules');
const ORCHESTRATOR_CURSOR_RULES = path.resolve(__dirname, '../../.cursor/rules');
const ORCHESTRATOR_CLAUDE_RULES = path.resolve(__dirname, '../../.claude/rules');

/**
 * Ensure global rules directory exists
 */
async function ensureGlobalRulesDir() {
  try {
    await fs.mkdir(GLOBAL_RULES_DIR, { recursive: true });
    return true;
  } catch (error) {
    console.error('Failed to create global rules directory:', error.message);
    return false;
  }
}

/**
 * Copy core rules from Orchestrator to global location
 */
async function syncCoreRulesToGlobal() {
  try {
    // Core rules that should be available globally
    const coreRules = [
      // Taskmaster integration (from .cursor/rules)
      'taskmaster/dev_workflow.mdc',
      'taskmaster/taskmaster.mdc',
      
      // Core standards (from .cursor/rules)
      'cursor_rules.mdc',
      'self_improve.mdc',
      'project-identity.mdc',
      
      // Primacy rules (from .claude/rules) - Critical!
      'platform-primacy.md',
      'documentation-economy.md',
      'autonomy-boundaries.md',
      'context-efficiency.md',
      'context-isolation.md',
      'core-infrastructure-standard.md',
      'file-lifecycle-standard.md',
      'non-interactive-execution.md',
      'rule-integrity.md'
    ];

    let synced = 0;
    
    for (const rulePath of coreRules) {
      const destPath = path.join(GLOBAL_RULES_DIR, rulePath);
      
      try {
        // Create subdirectory if needed
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        
        // Try .cursor/rules first, then .claude/rules
        let srcPath = path.join(ORCHESTRATOR_CURSOR_RULES, rulePath);
        try {
          await fs.access(srcPath);
        } catch {
          // Try .claude/rules instead
          srcPath = path.join(ORCHESTRATOR_CLAUDE_RULES, rulePath);
          await fs.access(srcPath);
        }
        
        // Copy file
        await fs.copyFile(srcPath, destPath);
        synced++;
      } catch (error) {
        // Skip if file doesn't exist in either location
        console.error(`   ⚠ Could not find: ${rulePath}`);
        continue;
      }
    }
    
    return synced;
  } catch (error) {
    console.error('Failed to sync core rules:', error.message);
    return 0;
  }
}

/**
 * Update project's .claude/settings.json to include global rules
 */
async function updateProjectSettings(projectPath) {
  const settingsPath = path.join(projectPath, '.claude', 'settings.json');
  
  try {
    // Check if .claude directory exists
    await fs.mkdir(path.join(projectPath, '.claude'), { recursive: true });
    
    let settings;
    try {
      const content = await fs.readFile(settingsPath, 'utf-8');
      settings = JSON.parse(content);
    } catch {
      // Create default settings if file doesn't exist
      settings = {
        mcpServers: {},
        allowedTools: ["Edit", "Bash", "Read", "List", "Write", "Delete", "Grep", "MCP"]
      };
    }
    
    // Ensure rules section exists
    if (!settings.rules) {
      settings.rules = {};
    }
    
    // Enable auto-load
    settings.rules.autoLoad = true;
    
    // Add both global and local paths
    const rulePaths = [
      GLOBAL_RULES_DIR,  // Global rules (cross-project)
      '.cursor/rules'     // Project-specific rules
    ];
    
    // Deduplicate paths
    settings.rules.paths = [...new Set([
      ...(settings.rules.paths || []),
      ...rulePaths
    ])];
    
    // Write back
    await fs.writeFile(
      settingsPath,
      JSON.stringify(settings, null, 2) + '\n',
      'utf-8'
    );
    
    return true;
  } catch (error) {
    console.error(`Failed to update settings for ${projectPath}:`, error.message);
    return false;
  }
}

/**
 * Create rule manifest for documentation
 */
async function createRuleManifest() {
  const manifestPath = path.join(GLOBAL_RULES_DIR, '.rule-manifest.json');
  
  const manifest = {
    version: '2.0.0',
    description: 'Global Orchestrator rules available in all projects',
    lastUpdated: new Date().toISOString(),
    rules: [
      // Taskmaster Integration
      {
        file: 'taskmaster/dev_workflow.mdc',
        description: 'Taskmaster development workflow patterns',
        scope: 'global',
        category: 'taskmaster'
      },
      {
        file: 'taskmaster/taskmaster.mdc',
        description: 'Taskmaster tool reference and usage',
        scope: 'global',
        category: 'taskmaster'
      },
      // Core Standards
      {
        file: 'cursor_rules.mdc',
        description: 'Cursor IDE rules and formatting standards',
        scope: 'global',
        category: 'standards'
      },
      {
        file: 'self_improve.mdc',
        description: 'Rule improvement and maintenance patterns',
        scope: 'global',
        category: 'standards'
      },
      {
        file: 'project-identity.mdc',
        description: 'Project identity validation rules (prevents wrong-project work)',
        scope: 'global',
        category: 'standards'
      },
      // Primacy Rules (Critical Infrastructure)
      {
        file: 'platform-primacy.md',
        description: 'Platform-specific tool usage rules (terminal vs agent)',
        scope: 'global',
        category: 'primacy',
        critical: true
      },
      {
        file: 'documentation-economy.md',
        description: 'Documentation generation rules (prevents excessive file creation)',
        scope: 'global',
        category: 'primacy',
        critical: true
      },
      {
        file: 'autonomy-boundaries.md',
        description: 'Agent autonomy boundaries and decision-making',
        scope: 'global',
        category: 'primacy'
      },
      {
        file: 'context-efficiency.md',
        description: 'Context window efficiency and management',
        scope: 'global',
        category: 'primacy'
      },
      {
        file: 'context-isolation.md',
        description: 'Context isolation across sessions',
        scope: 'global',
        category: 'primacy'
      },
      {
        file: 'core-infrastructure-standard.md',
        description: 'Core infrastructure patterns and standards',
        scope: 'global',
        category: 'primacy'
      },
      {
        file: 'file-lifecycle-standard.md',
        description: 'File lifecycle management (creation, updates, deletion)',
        scope: 'global',
        category: 'primacy',
        critical: true
      },
      {
        file: 'non-interactive-execution.md',
        description: 'Non-interactive command execution patterns',
        scope: 'global',
        category: 'primacy'
      },
      {
        file: 'rule-integrity.md',
        description: 'Rule integrity and validation',
        scope: 'global',
        category: 'primacy'
      }
    ],
    categories: {
      taskmaster: 'Taskmaster task management integration',
      standards: 'Core development standards and patterns',
      primacy: 'Critical infrastructure rules established Nov 14, 2025'
    },
    usage: 'These rules are automatically loaded in all projects via .claude/settings.json'
  };
  
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const projectPath = args[0] || process.cwd();
  
  console.log('🔧 Global Rules Loader\n');
  
  // Step 1: Ensure global directory exists
  console.log('📁 Setting up global rules directory...');
  const dirCreated = await ensureGlobalRulesDir();
  if (dirCreated) {
    console.log(`   ✓ Created: ${GLOBAL_RULES_DIR}`);
  }
  
  // Step 2: Sync core rules
  console.log('\n📋 Syncing core rules...');
  const synced = await syncCoreRulesToGlobal();
  console.log(`   ✓ Synced ${synced} core rules to global location`);
  
  // Step 3: Create manifest
  console.log('\n📝 Creating rule manifest...');
  await createRuleManifest();
  console.log('   ✓ Manifest created');
  
  // Step 4: Update project settings
  console.log(`\n⚙️  Updating project settings: ${path.basename(projectPath)}`);
  const updated = await updateProjectSettings(projectPath);
  if (updated) {
    console.log('   ✓ Settings updated');
  }
  
  console.log('\n✅ Global rules setup complete!\n');
  console.log('📍 Global rules location:', GLOBAL_RULES_DIR);
  console.log('📍 Project settings:', path.join(projectPath, '.claude', 'settings.json'));
  console.log('\n💡 These rules will now load automatically in ALL projects.');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ensureGlobalRulesDir, syncCoreRulesToGlobal, updateProjectSettings };

