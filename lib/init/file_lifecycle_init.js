#!/usr/bin/env node

/**
 * File Lifecycle System Initialization
 * 
 * Automatically initializes file lifecycle management for the orchestrator project.
 * Runs on startup to ensure proper file classification and tracking.
 * 
 * This module:
 * - Creates .file-manifest.json if it doesn't exist
 * - Pre-classifies core orchestrator files with appropriate tiers
 * - Sets up directory structure for archiving
 * - Registers session summaries, task completions, and documentation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get project root directory
 */
function getProjectRoot() {
  // Go up from lib/init/ to project root
  return path.resolve(__dirname, '../../');
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  return false;
}

/**
 * Create initial manifest structure
 */
function createManifest(projectRoot) {
  return {
    "$schema": "https://claude.ai/schemas/file-manifest-v1.json",
    "version": "1.0",
    "project": path.basename(projectRoot),
    "initialized": new Date().toISOString(),
    "last_updated": new Date().toISOString(),
    "statistics": {
      "total_files": 0,
      "by_tier": {
        "CRITICAL": 0,
        "PERMANENT": 0,
        "EPHEMERAL": 0,
        "ARCHIVED": 0
      },
      "pending_archive": 0,
      "misplaced": 0
    },
    "files": {},
    "settings": {
      "ephemeral_expiration_days": 60,
      "archive_retention_days": 90,
      "auto_organize": false,
      "confidence_threshold": 0.80
    }
  };
}

/**
 * Pre-classify core orchestrator files
 */
function getDefaultFileClassifications(projectRoot) {
  const now = new Date().toISOString();
  
  return {
    // CRITICAL: Core configuration and schemas
    "CRITICAL": [
      ".taskmaster/config.json",
      ".taskmaster/state.json",
      "lib/schemas/scenario-schema.json",
      "package.json",
      "requirements-scenario.txt",
      ".mcp.json",
      ".env"
    ],
    
    // PERMANENT: Documentation, summaries, completed tasks
    "PERMANENT": [
      "SESSION_SUMMARY_*.md",
      "TASK_*_COMPLETION_SUMMARY.md",
      "Docs/**/*.md",
      ".taskmaster/docs/**/*.md",
      "README.md",
      "CLAUDE.md",
      "AGENT.md",
      "Changelog.md"
    ],
    
    // EPHEMERAL: Temporary outputs, logs, cache
    "EPHEMERAL": [
      ".taskmaster/reports/**/*.json",
      "tests/fixtures/**/*.yaml",
      "*.log",
      ".context-state.json",
      "lib/__pycache__/**",
      "tests/__pycache__/**",
      "node_modules/**"
    ]
  };
}

/**
 * Check if file path matches glob pattern
 */
function matchesPattern(filePath, pattern) {
  // Simple glob matching for ** and *
  const regexPattern = pattern
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\./g, '\\.');
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(filePath);
}

/**
 * Classify a file based on default patterns
 */
function classifyFile(relativePath, patterns) {
  for (const [tier, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      if (matchesPattern(relativePath, pattern)) {
        return tier;
      }
    }
  }
  return null; // Unclassified
}

/**
 * Scan project directory for files
 */
function scanDirectory(dir, baseDir, patterns, manifest, stats) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    // Skip ignored directories
    if (entry.isDirectory()) {
      if (['.git', 'node_modules', '__pycache__', '.next', 'dist', 'build'].includes(entry.name)) {
        continue;
      }
      scanDirectory(fullPath, baseDir, patterns, manifest, stats);
      continue;
    }
    
    // Skip if already in manifest
    if (manifest.files[relativePath]) {
      continue;
    }
    
    // Classify the file
    const tier = classifyFile(relativePath, patterns);
    if (!tier) {
      continue; // Skip unclassified files
    }
    
    const fileStats = fs.statSync(fullPath);
    const now = new Date().toISOString();
    
    manifest.files[relativePath] = {
      "tier": tier,
      "status": "active",
      "created": fileStats.birthtime.toISOString(),
      "modified": fileStats.mtime.toISOString(),
      "added_to_manifest": now,
      "protected": tier === "CRITICAL",
      "size_bytes": fileStats.size,
      "notes": `Auto-classified on initialization`
    };
    
    stats.total_files++;
    stats.by_tier[tier]++;
  }
}

/**
 * Initialize file lifecycle system
 */
export async function initializeFileLifecycle(options = {}) {
  const projectRoot = options.projectRoot || getProjectRoot();
  const manifestPath = path.join(projectRoot, '.file-manifest.json');
  const verbose = options.verbose !== false;
  
  if (verbose) {
    console.log('🔄 Initializing File Lifecycle Management...');
    console.log(`   Project: ${path.basename(projectRoot)}`);
  }
  
  // Create .claude directory if needed
  const claudeDir = path.join(projectRoot, '.claude');
  const archiveDir = path.join(claudeDir, 'archive');
  const backupDir = path.join(claudeDir, 'backups');
  
  let dirsCreated = 0;
  if (ensureDir(claudeDir)) dirsCreated++;
  if (ensureDir(archiveDir)) dirsCreated++;
  if (ensureDir(backupDir)) dirsCreated++;
  
  if (verbose && dirsCreated > 0) {
    console.log(`   ✓ Created ${dirsCreated} directory(ies)`);
  }
  
  // Check if manifest already exists
  let manifest;
  let isNew = false;
  
  if (fs.existsSync(manifestPath)) {
    if (verbose) {
      console.log('   ℹ Manifest already exists, loading...');
    }
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } else {
    if (verbose) {
      console.log('   ✓ Creating new manifest...');
    }
    manifest = createManifest(projectRoot);
    isNew = true;
  }
  
  // Get default classifications
  const patterns = getDefaultFileClassifications(projectRoot);
  
  // Scan project and classify files
  const stats = {
    total_files: Object.keys(manifest.files).length,
    by_tier: { ...manifest.statistics.by_tier }
  };
  
  if (verbose) {
    console.log('   🔍 Scanning project files...');
  }
  
  scanDirectory(projectRoot, projectRoot, patterns, manifest, stats);
  
  // Update statistics
  manifest.statistics = {
    total_files: stats.total_files,
    by_tier: stats.by_tier,
    pending_archive: 0,
    misplaced: 0
  };
  manifest.last_updated = new Date().toISOString();
  
  // Save manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  
  if (verbose) {
    console.log('   ✓ Manifest saved');
    console.log('');
    console.log('📊 File Lifecycle Statistics:');
    console.log(`   Total Files: ${stats.total_files}`);
    console.log(`   CRITICAL:    ${stats.by_tier.CRITICAL} files`);
    console.log(`   PERMANENT:   ${stats.by_tier.PERMANENT} files`);
    console.log(`   EPHEMERAL:   ${stats.by_tier.EPHEMERAL} files`);
    console.log(`   ARCHIVED:    ${stats.by_tier.ARCHIVED} files`);
    console.log('');
    console.log('✅ File Lifecycle Management initialized!');
  }
  
  return {
    success: true,
    isNew,
    manifestPath,
    statistics: manifest.statistics
  };
}

/**
 * CLI entry point
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeFileLifecycle()
    .then(result => {
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Failed to initialize file lifecycle:', error.message);
      process.exit(1);
    });
}

export default initializeFileLifecycle;

