#!/usr/bin/env node

/**
 * Global Rule Sync Script
 * 
 * Synchronizes primacy rules from Orchestrator_Project to all sibling projects
 * and the global ~/.orchestrator/rules/ directory.
 * 
 * Usage: npm run sync-rules-global
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define source and destination paths
const SOURCE_DIR = path.resolve(__dirname, '../.claude/rules/');
const DESTINATIONS = [
  {
    path: path.resolve(__dirname, '../../portfolio-redesign/.claude/rules/'),
    name: 'portfolio-redesign'
  },
  {
    path: path.resolve(__dirname, '../../Momentum_Squared/.claude/rules/'),
    name: 'Momentum_Squared'
  },
  {
    path: path.resolve(__dirname, '../../Claude_Memory/.claude/rules/'),
    name: 'Claude_Memory'
  },
  {
    path: path.resolve(process.env.HOME || '~', '.orchestrator/rules/'),
    name: 'Global (~/.orchestrator/rules/)'
  }
];

/**
 * Recursively create directories
 */
function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Copy file with overwrite
 */
function copyFileSync(src, dest) {
  fs.copyFileSync(src, dest);
}

/**
 * Main sync function
 */
async function syncRules() {
  console.log(chalk.blue.bold('\n🔄 Global Rule Sync\n'));
  
  try {
    // Verify source directory exists
    if (!fs.existsSync(SOURCE_DIR)) {
      console.error(chalk.red(`❌ Error: Source directory not found: ${SOURCE_DIR}`));
      process.exit(1);
    }

    // Get all rule files from source
    const ruleFiles = fs.readdirSync(SOURCE_DIR).filter(file => 
      file.endsWith('.json') || file.endsWith('.md')
    );
    
    if (ruleFiles.length === 0) {
      console.warn(chalk.yellow('⚠️  Warning: No rule files found in source directory'));
      console.log(chalk.dim(`   Source: ${SOURCE_DIR}`));
      process.exit(0);
    }

    console.log(chalk.blue(`📋 Found ${ruleFiles.length} rule files to sync:`));
    ruleFiles.forEach(file => {
      const stats = fs.statSync(path.join(SOURCE_DIR, file));
      const size = (stats.size / 1024).toFixed(1);
      console.log(chalk.dim(`   - ${file} (${size} KB)`));
    });
    console.log('');

    // Track sync results
    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    // Process each destination
    for (const dest of DESTINATIONS) {
      try {
        // Check if destination project exists (except for global)
        const isGlobal = dest.name.includes('Global');
        const projectExists = fs.existsSync(path.dirname(dest.path));
        
        if (!isGlobal && !projectExists) {
          console.log(chalk.yellow(`⏭️  Skipping ${dest.name} (project not found)`));
          results.skipped.push(dest.name);
          continue;
        }

        // Create destination directory if it doesn't exist
        ensureDirSync(dest.path);
        
        // Copy each rule file
        let copiedCount = 0;
        for (const file of ruleFiles) {
          const sourcePath = path.join(SOURCE_DIR, file);
          const destPath = path.join(dest.path, file);
          
          copyFileSync(sourcePath, destPath);
          copiedCount++;
        }
        
        console.log(chalk.green(`✅ Synced ${copiedCount} rules to ${dest.name}`));
        results.success.push(dest.name);
        
      } catch (err) {
        console.error(chalk.red(`❌ Error syncing to ${dest.name}: ${err.message}`));
        results.failed.push(dest.name);
      }
    }
    
    // Display summary
    console.log('');
    console.log(chalk.blue.bold('📊 Sync Summary:'));
    console.log(chalk.green(`   ✅ Successful: ${results.success.length}`));
    if (results.skipped.length > 0) {
      console.log(chalk.yellow(`   ⏭️  Skipped: ${results.skipped.length}`));
    }
    if (results.failed.length > 0) {
      console.log(chalk.red(`   ❌ Failed: ${results.failed.length}`));
    }
    
    console.log('');
    
    if (results.failed.length > 0) {
      console.log(chalk.red.bold('⚠️  Some syncs failed. Please check errors above.'));
      process.exit(1);
    } else if (results.success.length === 0) {
      console.log(chalk.yellow.bold('⚠️  No destinations were synced.'));
      process.exit(1);
    } else {
      console.log(chalk.green.bold('✨ Global rule sync completed successfully!\n'));
      process.exit(0);
    }
    
  } catch (err) {
    console.error(chalk.red(`❌ Fatal error during rule sync: ${err.message}`));
    console.error(chalk.dim(err.stack));
    process.exit(1);
  }
}

// Execute the sync
syncRules();

export { syncRules };
