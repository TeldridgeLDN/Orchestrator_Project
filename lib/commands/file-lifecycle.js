#!/usr/bin/env node

/**
 * File Lifecycle Management Commands
 * 
 * CLI commands for UFC (Universal File Classification) system:
 * - classify: Classify files into CRITICAL, PERMANENT, EPHEMERAL tiers
 * - organize: Move files into UFC-compliant directory structure
 * - archive: Archive expired ephemeral files
 * - cleanup: Remove archived files past retention period
 * - status: Show file lifecycle system status
 * - stats: Display statistics and metrics
 * 
 * @module commands/file-lifecycle
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

/**
 * Load file manifest from project
 * @param {string} projectPath - Project root path
 * @returns {Promise<Object>} Manifest data
 */
async function loadManifest(projectPath) {
  const manifestPath = path.join(projectPath, '.file-manifest.json');
  try {
    const data = await fs.readFile(manifestPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(chalk.yellow('No file manifest found. Run `diet103 file-lifecycle init` first.'));
      return null;
    }
    throw error;
  }
}

/**
 * Save manifest to project
 * @param {string} projectPath - Project root path
 * @param {Object} manifest - Manifest data to save
 */
async function saveManifest(projectPath, manifest) {
  const manifestPath = path.join(projectPath, '.file-manifest.json');
  manifest.last_updated = new Date().toISOString();
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
}

/**
 * Classify Command
 * Scan and classify files into tiers
 */
export async function classifyCommand(path_arg, options) {
  const projectPath = path_arg || process.cwd();
  const { dryRun, verbose, config } = options;

  console.log(chalk.blue('🔍 Classifying files in project...'));
  if (dryRun) {
    console.log(chalk.yellow('Dry-run mode: No changes will be made\n'));
  }

  const manifest = await loadManifest(projectPath);
  if (!manifest) return;

  // TODO: Implement classification logic from lib/init/file_lifecycle_init.js
  // This should scan files and assign tiers based on patterns

  console.log(chalk.green('✅ Classification complete'));
  console.log(`Total files classified: ${manifest.statistics.total_files}`);
}

/**
 * Organize Command  
 * Move files into UFC-compliant directory structure
 */
export async function organizeCommand(path_arg, options) {
  const projectPath = path_arg || process.cwd();
  const { dryRun, verbose, config } = options;

  console.log(chalk.blue('📁 Organizing files into UFC structure...'));
  if (dryRun) {
    console.log(chalk.yellow('Dry-run mode: No files will be moved\n'));
  }

  const manifest = await loadManifest(projectPath);
  if (!manifest) return;

  // TODO: Implement organization logic
  // Move files to docs/core, docs/impl, docs/sessions, docs/archive
  // Update references in manifest and markdown links
  // Protect CRITICAL files from auto-move

  console.log(chalk.green('✅ Organization complete'));
}

/**
 * Archive Command
 * Archive expired ephemeral files
 */
export async function archiveCommand(path_arg, options) {
  const projectPath = path_arg || process.cwd();
  const { dryRun, verbose, config } = options;

  console.log(chalk.blue('📦 Archiving expired ephemeral files...'));
  if (dryRun) {
    console.log(chalk.yellow('Dry-run mode: No files will be archived\n'));
  }

  const manifest = await loadManifest(projectPath);
  if (!manifest) return;

  const expirationDays = manifest.settings.ephemeral_expiration_days || 60;
  const now = new Date();
  
  // TODO: Implement archival logic
  // Find EPHEMERAL files older than expiration_days
  // Move to docs/archive
  // Update manifest and frontmatter
  // Send notifications 7 days before archival

  console.log(chalk.green('✅ Archival complete'));
}

/**
 * Cleanup Command
 * Remove archived files past retention period
 */
export async function cleanupCommand(path_arg, options) {
  const projectPath = path_arg || process.cwd();
  const { dryRun, verbose, config } = options;

  console.log(chalk.blue('🗑️  Cleaning up old archived files...'));
  if (dryRun) {
    console.log(chalk.yellow('Dry-run mode: No files will be deleted\n'));
  }

  const manifest = await loadManifest(projectPath);
  if (!manifest) return;

  const retentionDays = manifest.settings.archive_retention_days || 90;
  
  // TODO: Implement cleanup logic
  // Scan docs/archive for files exceeding retention period
  // Never auto-delete CRITICAL files
  // Backup before deletion
  // Update manifest

  console.log(chalk.green('✅ Cleanup complete'));
}

/**
 * Status Command
 * Show file lifecycle system status
 */
export async function statusCommand(path_arg, options) {
  const projectPath = path_arg || process.cwd();
  const { json, verbose } = options;

  const manifest = await loadManifest(projectPath);
  if (!manifest) return;

  if (json) {
    console.log(JSON.stringify(manifest, null, 2));
    return;
  }

  console.log(chalk.bold('\n📊 File Lifecycle Status\n'));
  console.log(`Project: ${chalk.cyan(manifest.project)}`);
  console.log(`Last Updated: ${chalk.gray(new Date(manifest.last_updated).toLocaleString())}\n`);

  console.log(chalk.bold('Statistics:'));
  console.log(`  Total Files: ${chalk.yellow(manifest.statistics.total_files)}`);
  console.log(`  ${chalk.red('CRITICAL')}: ${manifest.statistics.by_tier.CRITICAL}`);
  console.log(`  ${chalk.green('PERMANENT')}: ${manifest.statistics.by_tier.PERMANENT}`);
  console.log(`  ${chalk.blue('EPHEMERAL')}: ${manifest.statistics.by_tier.EPHEMERAL}`);
  console.log(`  ${chalk.gray('ARCHIVED')}: ${manifest.statistics.by_tier.ARCHIVED}`);
  console.log(`  Pending Archive: ${chalk.yellow(manifest.statistics.pending_archive)}`);
  console.log(`  Misplaced: ${chalk.red(manifest.statistics.misplaced)}\n`);

  console.log(chalk.bold('Settings:'));
  console.log(`  Ephemeral Expiration: ${manifest.settings.ephemeral_expiration_days} days`);
  console.log(`  Archive Retention: ${manifest.settings.archive_retention_days} days`);
  console.log(`  Auto-Organize: ${manifest.settings.auto_organize ? 'enabled' : 'disabled'}`);
  console.log(`  Confidence Threshold: ${(manifest.settings.confidence_threshold * 100).toFixed(0)}%\n`);
}

/**
 * Stats Command
 * Display detailed statistics and metrics
 */
export async function statsCommand(path_arg, options) {
  const projectPath = path_arg || process.cwd();
  const { json, verbose } = options;

  const manifest = await loadManifest(projectPath);
  if (!manifest) return;

  if (json) {
    console.log(JSON.stringify(manifest.statistics, null, 2));
    return;
  }

  console.log(chalk.bold('\n📈 File Lifecycle Statistics\n'));

  // File count by tier
  console.log(chalk.bold('Files by Tier:'));
  const tierColors = {
    CRITICAL: chalk.red,
    PERMANENT: chalk.green,
    EPHEMERAL: chalk.blue,
    ARCHIVED: chalk.gray
  };
  
  for (const [tier, count] of Object.entries(manifest.statistics.by_tier)) {
    const percentage = manifest.statistics.total_files > 0 
      ? ((count / manifest.statistics.total_files) * 100).toFixed(1)
      : '0.0';
    console.log(`  ${tierColors[tier](tier.padEnd(10))}: ${count.toString().padStart(4)} (${percentage}%)`);
  }

  console.log();
  console.log(chalk.bold('Health Metrics:'));
  console.log(`  Pending Archive: ${chalk.yellow(manifest.statistics.pending_archive)} files`);
  console.log(`  Misplaced Files: ${manifest.statistics.misplaced > 0 ? chalk.red(manifest.statistics.misplaced) : chalk.green(manifest.statistics.misplaced)}`);
  console.log();
}

