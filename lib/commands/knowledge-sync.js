#!/usr/bin/env node
/**
 * Global Knowledge Sync - Share patterns/skills across all projects
 * 
 * Manages the global knowledge base at ~/.orchestrator/global-knowledge/
 * Allows projects to reference shared patterns while maintaining local customizations
 * 
 * @module lib/commands/knowledge-sync
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GLOBAL_KNOWLEDGE_DIR = path.join(os.homedir(), '.orchestrator', 'global-knowledge');
const LOCAL_KNOWLEDGE_DIR = '.claude/knowledge';

/**
 * Ensure global knowledge directory exists
 */
async function ensureGlobalKnowledge() {
  const dirs = [
    GLOBAL_KNOWLEDGE_DIR,
    path.join(GLOBAL_KNOWLEDGE_DIR, 'patterns'),
    path.join(GLOBAL_KNOWLEDGE_DIR, 'skills'),
    path.join(GLOBAL_KNOWLEDGE_DIR, 'prompts'),
    path.join(GLOBAL_KNOWLEDGE_DIR, 'decisions')
  ];

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Sync knowledge from Orchestrator project to global
 */
async function syncToGlobal(options = {}) {
  const { force = false, category = null } = options;

  await ensureGlobalKnowledge();

  const categories = category ? [category] : ['patterns', 'prompts', 'skills'];
  const synced = [];

  for (const cat of categories) {
    const localDir = path.join(LOCAL_KNOWLEDGE_DIR, cat);
    const globalDir = path.join(GLOBAL_KNOWLEDGE_DIR, cat);

    try {
      const files = await fs.readdir(localDir);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const localPath = path.join(localDir, file);
        const globalPath = path.join(globalDir, file);

        // Check if exists
        let shouldCopy = force;
        if (!force) {
          try {
            await fs.access(globalPath);
            // File exists, check if local is newer
            const localStat = await fs.stat(localPath);
            const globalStat = await fs.stat(globalPath);
            shouldCopy = localStat.mtime > globalStat.mtime;
          } catch {
            // Doesn't exist, copy
            shouldCopy = true;
          }
        }

        if (shouldCopy) {
          await fs.copyFile(localPath, globalPath);
          synced.push({ category: cat, file, action: 'copied' });
        } else {
          synced.push({ category: cat, file, action: 'skipped' });
        }
      }
    } catch (err) {
      // Directory doesn't exist, skip
    }
  }

  // Create manifest
  await createManifest();

  return synced;
}

/**
 * Pull global knowledge to local project
 */
async function syncFromGlobal(options = {}) {
  const { force = false, category = null } = options;

  await ensureGlobalKnowledge();

  const categories = category ? [category] : ['patterns', 'prompts'];
  const pulled = [];

  for (const cat of categories) {
    const globalDir = path.join(GLOBAL_KNOWLEDGE_DIR, cat);
    const localDir = path.join(LOCAL_KNOWLEDGE_DIR, cat);

    try {
      await fs.mkdir(localDir, { recursive: true });
      const files = await fs.readdir(globalDir);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const globalPath = path.join(globalDir, file);
        const localPath = path.join(localDir, file);

        let shouldCopy = force;
        if (!force) {
          try {
            await fs.access(localPath);
            // Ask if should overwrite
            shouldCopy = false;
          } catch {
            // Doesn't exist, copy
            shouldCopy = true;
          }
        }

        if (shouldCopy) {
          await fs.copyFile(globalPath, localPath);
          pulled.push({ category: cat, file, action: 'copied' });
        } else {
          pulled.push({ category: cat, file, action: 'skipped' });
        }
      }
    } catch (err) {
      // Directory doesn't exist, skip
    }
  }

  return pulled;
}

/**
 * List global knowledge
 */
async function listGlobal() {
  await ensureGlobalKnowledge();

  const knowledge = {
    patterns: [],
    skills: [],
    prompts: [],
    decisions: []
  };

  for (const category of Object.keys(knowledge)) {
    const dir = path.join(GLOBAL_KNOWLEDGE_DIR, category);
    try {
      const files = await fs.readdir(dir);
      knowledge[category] = files.filter(f => f.endsWith('.md'));
    } catch {
      // Directory empty
    }
  }

  return knowledge;
}

/**
 * Create global knowledge manifest
 */
async function createManifest() {
  const knowledge = await listGlobal();

  const manifest = {
    version: '1.0.0',
    updated: new Date().toISOString(),
    location: GLOBAL_KNOWLEDGE_DIR,
    categories: {
      patterns: {
        count: knowledge.patterns.length,
        files: knowledge.patterns,
        description: 'Recurring technical solutions reusable across projects'
      },
      skills: {
        count: knowledge.skills.length,
        files: knowledge.skills,
        description: 'Project-agnostic skills available globally'
      },
      prompts: {
        count: knowledge.prompts.length,
        files: knowledge.prompts,
        description: 'Reusable prompt templates'
      },
      decisions: {
        count: knowledge.decisions.length,
        files: knowledge.decisions,
        description: 'Cross-project architectural decisions'
      }
    },
    totalFiles: Object.values(knowledge).flat().length
  };

  const manifestPath = path.join(GLOBAL_KNOWLEDGE_DIR, '.knowledge-manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  return manifest;
}

/**
 * CLI handler
 */
async function handleKnowledgeCommand(args) {
  const command = args[0];

  try {
    switch (command) {
      case 'push':
      case 'sync-to-global': {
        const force = args.includes('--force');
        const category = args.find(a => !a.startsWith('--') && a !== 'push' && a !== 'sync-to-global');

        const result = await syncToGlobal({ force, category });

        console.log('\n📤 Synced to global knowledge:\n');
        const copied = result.filter(r => r.action === 'copied');
        const skipped = result.filter(r => r.action === 'skipped');

        if (copied.length > 0) {
          console.log('✅ Copied:');
          copied.forEach(r => console.log(`  - ${r.category}/${r.file}`));
        }

        if (skipped.length > 0) {
          console.log('\n⏭️  Skipped (already up-to-date):');
          skipped.forEach(r => console.log(`  - ${r.category}/${r.file}`));
        }

        console.log(`\n📍 Location: ${GLOBAL_KNOWLEDGE_DIR}`);
        break;
      }

      case 'pull':
      case 'sync-from-global': {
        const force = args.includes('--force');
        const category = args.find(a => !a.startsWith('--') && a !== 'pull' && a !== 'sync-from-global');

        const result = await syncFromGlobal({ force, category });

        console.log('\n📥 Pulled from global knowledge:\n');
        const copied = result.filter(r => r.action === 'copied');
        const skipped = result.filter(r => r.action === 'skipped');

        if (copied.length > 0) {
          console.log('✅ Copied:');
          copied.forEach(r => console.log(`  - ${r.category}/${r.file}`));
        }

        if (skipped.length > 0) {
          console.log('\n⏭️  Skipped (already exists):');
          skipped.forEach(r => console.log(`  - ${r.category}/${r.file}`));
          console.log('\nUse --force to overwrite existing files');
        }
        break;
      }

      case 'list': {
        const knowledge = await listGlobal();

        console.log('\n📚 Global Knowledge Base:\n');
        console.log(`📍 Location: ${GLOBAL_KNOWLEDGE_DIR}\n`);

        for (const [category, files] of Object.entries(knowledge)) {
          if (files.length > 0) {
            console.log(`\n${category.toUpperCase()} (${files.length}):`);
            files.forEach(f => console.log(`  - ${f}`));
          }
        }

        const total = Object.values(knowledge).flat().length;
        console.log(`\n📊 Total: ${total} knowledge documents`);
        break;
      }

      case 'init': {
        await ensureGlobalKnowledge();
        console.log(`✅ Global knowledge initialized at: ${GLOBAL_KNOWLEDGE_DIR}`);
        break;
      }

      default:
        console.log(`
📚 Global Knowledge Management

USAGE:
  orchestrator knowledge push [category] [--force]    Sync local → global
  orchestrator knowledge pull [category] [--force]    Sync global → local
  orchestrator knowledge list                         List global knowledge
  orchestrator knowledge init                         Initialize global knowledge

CATEGORIES:
  patterns   - Recurring technical solutions
  skills     - Project-agnostic skills
  prompts    - Reusable prompt templates
  decisions  - Cross-project ADRs

EXAMPLES:
  orchestrator knowledge push                # Push all categories
  orchestrator knowledge push patterns       # Push patterns only
  orchestrator knowledge pull --force        # Force pull all
  orchestrator knowledge list                # Show what's available

WORKFLOW:
  1. Create knowledge in Orchestrator: .claude/knowledge/
  2. Push to global: orchestrator knowledge push
  3. Use in other projects: orchestrator knowledge pull
  4. Reference in project skills: See global pattern at ~/.orchestrator/...
        `);
    }
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  handleKnowledgeCommand(process.argv.slice(2));
}

export { syncToGlobal, syncFromGlobal, listGlobal, createManifest };

