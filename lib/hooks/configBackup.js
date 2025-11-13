/**
 * Config Backup Hook
 * Automatically backs up ~/.claude/config.json before modifications
 * 
 * This is a critical safety feature that prevents data loss by creating
 * timestamped backups and maintaining a rolling window of the most recent backups.
 * 
 * @module hooks/configBackup
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import os from 'os';

// Configuration
const MAX_BACKUPS = 10;
const CONFIG_PATH = path.join(os.homedir(), '.claude', 'config.json');
const BACKUP_DIR = path.join(os.homedir(), '.claude', 'backups');

/**
 * PreToolUse hook that creates a backup of config.json before modifications
 * @returns {Promise<void>}
 */
export async function preConfigModification() {
  try {
    // Ensure backup directory exists
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    
    // Check if config exists before attempting backup
    if (existsSync(CONFIG_PATH)) {
      // Generate timestamp for backup filename
      const timestamp = Math.floor(Date.now() / 1000);
      const backupPath = path.join(BACKUP_DIR, `config.json.backup.${timestamp}`);
      
      // Create the backup
      await fs.copyFile(CONFIG_PATH, backupPath);
      console.debug(`✅ Created config backup at ${backupPath}`);
      
      // Prune old backups if needed
      await pruneOldBackups();
    }
  } catch (error) {
    // Log error but don't block operation - better to continue than fail
    console.error(`⚠️  Warning: Failed to create config backup: ${error.message}`);
  }
}

/**
 * Removes old backups, keeping only the most recent MAX_BACKUPS
 * @returns {Promise<void>}
 */
async function pruneOldBackups() {
  try {
    // Get all backup files
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files.filter(file => file.startsWith('config.json.backup.'));
    
    // Sort by timestamp (newest first)
    backupFiles.sort((a, b) => {
      const timestampA = parseInt(a.split('.').pop(), 10);
      const timestampB = parseInt(b.split('.').pop(), 10);
      return timestampB - timestampA;
    });
    
    // Remove excess backups
    if (backupFiles.length > MAX_BACKUPS) {
      const filesToRemove = backupFiles.slice(MAX_BACKUPS);
      for (const file of filesToRemove) {
        await fs.unlink(path.join(BACKUP_DIR, file));
        console.debug(`🗑️  Removed old backup: ${file}`);
      }
    }
  } catch (error) {
    console.error(`⚠️  Warning: Failed to prune old backups: ${error.message}`);
  }
}

/**
 * Lists available config backups
 * @returns {Promise<Array<{path: string, timestamp: number, date: Date}>>}
 */
export async function listConfigBackups() {
  try {
    // Check if backup directory exists
    if (!existsSync(BACKUP_DIR)) {
      return [];
    }
    
    const files = await fs.readdir(BACKUP_DIR);
    const backups = files
      .filter(file => file.startsWith('config.json.backup.'))
      .map(file => {
        const timestamp = parseInt(file.split('.').pop(), 10);
        return {
          path: path.join(BACKUP_DIR, file),
          timestamp,
          date: new Date(timestamp * 1000),
          filename: file
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
      
    return backups;
  } catch (error) {
    console.error(`Error listing config backups: ${error.message}`);
    return [];
  }
}

/**
 * Restores config from a backup file
 * @param {string} backupPath - Path to the backup file
 * @returns {Promise<void>}
 */
export async function restoreConfigFromBackup(backupPath) {
  try {
    if (!existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    // Create a backup of the current config before restoring
    if (existsSync(CONFIG_PATH)) {
      const timestamp = Math.floor(Date.now() / 1000);
      const preRestoreBackupPath = path.join(BACKUP_DIR, `config.json.pre-restore.${timestamp}`);
      await fs.copyFile(CONFIG_PATH, preRestoreBackupPath);
      console.log(`📦 Backed up current config to: ${preRestoreBackupPath}`);
    }
    
    // Restore from backup
    await fs.copyFile(backupPath, CONFIG_PATH);
    console.log(`✅ Restored config from backup: ${backupPath}`);
  } catch (error) {
    throw new Error(`Failed to restore config from backup: ${error.message}`);
  }
}

/**
 * Gets the most recent backup
 * @returns {Promise<{path: string, timestamp: number, date: Date} | null>}
 */
export async function getMostRecentBackup() {
  const backups = await listConfigBackups();
  return backups.length > 0 ? backups[0] : null;
}

export default {
  preConfigModification,
  listConfigBackups,
  restoreConfigFromBackup,
  getMostRecentBackup
};

