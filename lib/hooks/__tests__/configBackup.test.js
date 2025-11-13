/**
 * Tests for Config Backup Hook
 * @vitest
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';
import {
  preConfigModification,
  listConfigBackups,
  restoreConfigFromBackup,
  getMostRecentBackup
} from '../configBackup.js';

const TEST_DIR = path.join(os.tmpdir(), 'config-backup-test');
const TEST_CONFIG_DIR = path.join(TEST_DIR, '.claude');
const TEST_CONFIG_PATH = path.join(TEST_CONFIG_DIR, 'config.json');
const TEST_BACKUP_DIR = path.join(TEST_CONFIG_DIR, 'backups');

// Mock os.homedir() to use test directory
const originalHomedir = os.homedir;

describe('Config Backup Hook', () => {
  beforeEach(async () => {
    // Set up test directory
    await fs.mkdir(TEST_CONFIG_DIR, { recursive: true });
    
    // Create a test config file
    await fs.writeFile(
      TEST_CONFIG_PATH,
      JSON.stringify({ version: '1.0.0', test: true }, null, 2)
    );
    
    // Mock homedir
    os.homedir = () => TEST_DIR;
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
    
    // Restore original homedir
    os.homedir = originalHomedir;
  });

  it('should create a backup directory if it does not exist', async () => {
    await preConfigModification();
    
    expect(existsSync(TEST_BACKUP_DIR)).toBe(true);
  });

  it('should create a backup file with timestamp', async () => {
    await preConfigModification();
    
    const backups = await listConfigBackups();
    expect(backups.length).toBe(1);
    expect(backups[0].filename).toMatch(/^config\.json\.backup\.\d+$/);
  });

  it('should backup the config file content correctly', async () => {
    await preConfigModification();
    
    const backups = await listConfigBackups();
    const backupContent = await fs.readFile(backups[0].path, 'utf-8');
    const originalContent = await fs.readFile(TEST_CONFIG_PATH, 'utf-8');
    
    expect(backupContent).toBe(originalContent);
  });

  it('should prune old backups when exceeding MAX_BACKUPS', async () => {
    // Create 12 backups (MAX_BACKUPS is 10)
    for (let i = 0; i < 12; i++) {
      await preConfigModification();
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const backups = await listConfigBackups();
    expect(backups.length).toBe(10);
  });

  it('should keep most recent backups when pruning', async () => {
    // Create multiple backups
    for (let i = 0; i < 5; i++) {
      await preConfigModification();
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const backups = await listConfigBackups();
    
    // Backups should be sorted newest first
    for (let i = 0; i < backups.length - 1; i++) {
      expect(backups[i].timestamp).toBeGreaterThan(backups[i + 1].timestamp);
    }
  });

  it('should not fail if config file does not exist', async () => {
    // Remove the config file
    await fs.unlink(TEST_CONFIG_PATH);
    
    // Should not throw
    await expect(preConfigModification()).resolves.toBeUndefined();
  });

  it('should list backups in correct order', async () => {
    // Create 3 backups
    for (let i = 0; i < 3; i++) {
      await preConfigModification();
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const backups = await listConfigBackups();
    
    expect(backups.length).toBe(3);
    expect(backups[0].timestamp).toBeGreaterThan(backups[1].timestamp);
    expect(backups[1].timestamp).toBeGreaterThan(backups[2].timestamp);
  });

  it('should return empty array if no backups exist', async () => {
    const backups = await listConfigBackups();
    expect(backups).toEqual([]);
  });

  it('should restore config from backup', async () => {
    // Create a backup
    await preConfigModification();
    
    // Modify the config
    await fs.writeFile(
      TEST_CONFIG_PATH,
      JSON.stringify({ version: '2.0.0', modified: true }, null, 2)
    );
    
    // Restore from backup
    const backups = await listConfigBackups();
    await restoreConfigFromBackup(backups[0].path);
    
    // Verify restoration
    const restoredContent = await fs.readFile(TEST_CONFIG_PATH, 'utf-8');
    const restored = JSON.parse(restoredContent);
    
    expect(restored.version).toBe('1.0.0');
    expect(restored.test).toBe(true);
    expect(restored.modified).toBeUndefined();
  });

  it('should create pre-restore backup when restoring', async () => {
    // Create initial backup
    await preConfigModification();
    
    // Modify config
    await fs.writeFile(
      TEST_CONFIG_PATH,
      JSON.stringify({ version: '2.0.0' }, null, 2)
    );
    
    // Restore from backup
    const backups = await listConfigBackups();
    await restoreConfigFromBackup(backups[0].path);
    
    // Check for pre-restore backup
    const allBackups = await listConfigBackups();
    const preRestoreBackup = allBackups.find(b => b.filename.includes('pre-restore'));
    
    expect(preRestoreBackup).toBeDefined();
  });

  it('should throw error when restoring from non-existent backup', async () => {
    const fakePath = path.join(TEST_BACKUP_DIR, 'fake-backup.json');
    
    await expect(restoreConfigFromBackup(fakePath))
      .rejects.toThrow('Backup file not found');
  });

  it('should get most recent backup', async () => {
    // Create 3 backups
    for (let i = 0; i < 3; i++) {
      await preConfigModification();
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const mostRecent = await getMostRecentBackup();
    const allBackups = await listConfigBackups();
    
    expect(mostRecent).toEqual(allBackups[0]);
  });

  it('should return null if no backups for getMostRecentBackup', async () => {
    const mostRecent = await getMostRecentBackup();
    expect(mostRecent).toBeNull();
  });
});

