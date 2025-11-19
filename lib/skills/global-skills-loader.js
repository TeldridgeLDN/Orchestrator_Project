#!/usr/bin/env node

/**
 * Global Skills Loader
 * 
 * Ensures critical Orchestrator skills are loaded in ALL projects,
 * not just the Orchestrator project itself.
 * 
 * Mirrors the pattern from global-rules-loader.js
 * Inspired by Daniel Miessler's Personal AI Infrastructure pattern.
 * 
 * Strategy:
 * 1. Global skills in ~/.claude/skills/ (cross-project, PAI pattern)
 * 2. Project-specific skills in .claude/skills/ (per-project)
 * 3. Both are auto-loaded by skill discovery
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GLOBAL_SKILLS_DIR = path.join(os.homedir(), '.claude', 'skills');
const ORCHESTRATOR_SKILLS = path.resolve(__dirname, '../../.claude/skills');

/**
 * Ensure global skills directory exists
 */
async function ensureGlobalSkillsDir() {
  try {
    await fs.mkdir(GLOBAL_SKILLS_DIR, { recursive: true });
    return true;
  } catch (error) {
    console.error('Failed to create global skills directory:', error.message);
    return false;
  }
}

/**
 * Copy a directory recursively
 */
async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Get list of global skills from Orchestrator
 */
async function getGlobalSkillsList() {
  // Skills that should be available globally
  return [
    'react-component-analyzer',  // UI design analysis
    'scenario_manager',           // Scenario scaffolding
    // Add more skills as they become global-ready
  ];
}

/**
 * Check if skill has proper metadata
 */
async function validateSkillMetadata(skillPath) {
  const metadataPath = path.join(skillPath, 'metadata.json');
  
  try {
    const content = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(content);
    
    // Check required fields
    const required = ['name', 'version', 'description', 'scope'];
    for (const field of required) {
      if (!metadata[field]) {
        return { valid: false, reason: `Missing field: ${field}` };
      }
    }
    
    // Check if marked as global
    if (metadata.scope !== 'global') {
      return { valid: false, reason: 'Not marked as global scope' };
    }
    
    return { valid: true, metadata };
  } catch (error) {
    return { valid: false, reason: error.message };
  }
}

/**
 * Copy core skills from Orchestrator to global location
 */
async function syncCoreSkillsToGlobal() {
  try {
    const globalSkills = await getGlobalSkillsList();
    let synced = 0;
    const skipped = [];
    
    for (const skillName of globalSkills) {
      const srcPath = path.join(ORCHESTRATOR_SKILLS, skillName);
      const destPath = path.join(GLOBAL_SKILLS_DIR, skillName);
      
      try {
        // Check if skill exists
        await fs.access(srcPath);
        
        // Validate metadata
        const validation = await validateSkillMetadata(srcPath);
        if (!validation.valid) {
          skipped.push({ skill: skillName, reason: validation.reason });
          console.error(`   ⚠ Skipping ${skillName}: ${validation.reason}`);
          continue;
        }
        
        // Copy entire skill directory
        await copyDirectory(srcPath, destPath);
        synced++;
      } catch (error) {
        skipped.push({ skill: skillName, reason: error.message });
        console.error(`   ⚠ Could not sync ${skillName}: ${error.message}`);
        continue;
      }
    }
    
    return { synced, skipped };
  } catch (error) {
    console.error('Failed to sync core skills:', error.message);
    return { synced: 0, skipped: [] };
  }
}

/**
 * Update project's .claude/settings.json to include global skills
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
    
    // Ensure skills section exists
    if (!settings.skills) {
      settings.skills = {};
    }
    
    // Enable auto-load
    settings.skills.autoLoad = true;
    
    // Add both global and local paths
    const skillPaths = [
      GLOBAL_SKILLS_DIR,  // Global skills (cross-project)
      '.claude/skills'     // Project-specific skills
    ];
    
    // Deduplicate paths
    settings.skills.paths = [...new Set([
      ...(settings.skills.paths || []),
      ...skillPaths
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
 * Create skill manifest for documentation
 */
async function createSkillManifest() {
  const manifestPath = path.join(GLOBAL_SKILLS_DIR, '.skill-manifest.json');
  
  const globalSkills = await getGlobalSkillsList();
  const skills = [];
  
  // Gather metadata from each skill
  for (const skillName of globalSkills) {
    const skillPath = path.join(GLOBAL_SKILLS_DIR, skillName);
    const metadataPath = path.join(skillPath, 'metadata.json');
    
    try {
      const content = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(content);
      
      skills.push({
        name: metadata.name,
        version: metadata.version,
        description: metadata.description,
        scope: metadata.scope,
        type: metadata.type || 'general',
        applies_to: metadata.applies_to || {},
        requirements: metadata.requirements || {},
        auto_activation: metadata.auto_activation || {}
      });
    } catch {
      // Skip if metadata can't be read
      continue;
    }
  }
  
  const manifest = {
    version: '1.0.0',
    description: 'Global Orchestrator skills available in all projects',
    lastUpdated: new Date().toISOString(),
    skillsPath: GLOBAL_SKILLS_DIR,
    skills,
    usage: [
      'These skills are automatically discovered from ~/.claude/skills/',
      'Projects can override with local skills in .claude/skills/',
      'Local skills take precedence over global skills'
    ],
    notes: [
      'Global skills follow the PAI (Personal AI Infrastructure) pattern',
      'Skills are synced from Orchestrator_Project via `orchestrator sync-skills`',
      'Only skills with scope: "global" are synced globally'
    ]
  };
  
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  return manifest;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const projectPath = args[0] || process.cwd();
  
  console.log('🔧 Global Skills Loader\n');
  
  // Step 1: Ensure global directory exists
  console.log('📁 Setting up global skills directory...');
  const dirCreated = await ensureGlobalSkillsDir();
  if (dirCreated) {
    console.log(`   ✓ Created: ${GLOBAL_SKILLS_DIR}`);
  }
  
  // Step 2: Sync core skills
  console.log('\n📋 Syncing core skills...');
  const { synced, skipped } = await syncCoreSkillsToGlobal();
  console.log(`   ✓ Synced ${synced} skills to global location`);
  if (skipped.length > 0) {
    console.log(`   ⚠ Skipped ${skipped.length} skills (see warnings above)`);
  }
  
  // Step 3: Create manifest
  console.log('\n📝 Creating skill manifest...');
  const manifest = await createSkillManifest();
  console.log('   ✓ Manifest created');
  console.log(`   ✓ ${manifest.skills.length} skills documented`);
  
  // Step 4: Update project settings
  console.log(`\n⚙️  Updating project settings: ${path.basename(projectPath)}`);
  const updated = await updateProjectSettings(projectPath);
  if (updated) {
    console.log('   ✓ Settings updated');
  }
  
  console.log('\n✅ Global skills setup complete!\n');
  console.log('📍 Global skills location:', GLOBAL_SKILLS_DIR);
  console.log('📍 Project settings:', path.join(projectPath, '.claude', 'settings.json'));
  console.log('\n💡 These skills will now be discovered automatically in ALL projects.');
  console.log('💡 Local project skills can override global skills if needed.');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { 
  ensureGlobalSkillsDir, 
  syncCoreSkillsToGlobal, 
  updateProjectSettings,
  createSkillManifest,
  getGlobalSkillsList
};

