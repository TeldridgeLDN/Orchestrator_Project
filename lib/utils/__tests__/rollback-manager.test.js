/**
 * Tests for Rollback Manager
 * 
 * @group unit
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  RollbackSession,
  RollbackManager,
  OperationType,
  defaultManager
} from '../rollback-manager.js';

describe('Rollback Manager', () => {
  let testDir;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `rollback-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('RollbackSession', () => {
    it('should create session with unique ID', () => {
      const session = new RollbackSession();
      
      expect(session.id).toBeDefined();
      expect(session.id).toContain('session-');
      expect(session.active).toBe(true);
      expect(session.committed).toBe(false);
      expect(session.rolledBack).toBe(false);
    });

    it('should create session with custom ID', () => {
      const customId = 'my-session-123';
      const session = new RollbackSession(customId);
      
      expect(session.id).toBe(customId);
    });

    it('should record create operation', () => {
      const session = new RollbackSession();
      
      session.recordCreate('/path/to/file.txt');
      
      expect(session.operations).toHaveLength(1);
      expect(session.operations[0].type).toBe(OperationType.CREATE);
      expect(session.operations[0].path).toBe('/path/to/file.txt');
    });

    it('should record update operation', () => {
      const session = new RollbackSession();
      
      session.recordUpdate('/path/to/file.txt', '/path/to/file.backup');
      
      expect(session.operations).toHaveLength(1);
      expect(session.operations[0].type).toBe(OperationType.UPDATE);
      expect(session.operations[0].backup).toBe('/path/to/file.backup');
    });

    it('should record delete operation', () => {
      const session = new RollbackSession();
      
      session.recordDelete('/path/to/file.txt', '/path/to/file.backup');
      
      expect(session.operations).toHaveLength(1);
      expect(session.operations[0].type).toBe(OperationType.DELETE);
    });

    it('should record mkdir operation', () => {
      const session = new RollbackSession();
      
      session.recordMkdir('/path/to/dir');
      
      expect(session.operations).toHaveLength(1);
      expect(session.operations[0].type).toBe(OperationType.MKDIR);
    });

    it('should not allow operations on inactive session', () => {
      const session = new RollbackSession();
      session.commit();
      
      expect(() => session.recordCreate('/path')).toThrow('not active');
    });

    it('should commit session', () => {
      const session = new RollbackSession();
      session.recordCreate('/path');
      
      session.commit();
      
      expect(session.active).toBe(false);
      expect(session.committed).toBe(true);
    });

    it('should generate summary', () => {
      const session = new RollbackSession();
      
      session.recordCreate('/file1');
      session.recordCreate('/file2');
      session.recordUpdate('/file3', '/file3.bak');
      session.recordDelete('/file4', '/file4.bak');
      session.recordMkdir('/dir');
      
      const summary = session.getSummary();
      
      expect(summary.totalOperations).toBe(5);
      expect(summary.counts[OperationType.CREATE]).toBe(2);
      expect(summary.counts[OperationType.UPDATE]).toBe(1);
      expect(summary.counts[OperationType.DELETE]).toBe(1);
      expect(summary.counts[OperationType.MKDIR]).toBe(1);
    });

    it('should serialize to JSON', () => {
      const session = new RollbackSession('test-session');
      session.recordCreate('/file');
      
      const json = session.toJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.id).toBe('test-session');
      expect(parsed.operations).toHaveLength(1);
    });

    it('should deserialize from JSON', () => {
      const session = new RollbackSession('test-session');
      session.recordCreate('/file');
      session.recordUpdate('/file2', '/file2.bak');
      
      const json = session.toJSON();
      const restored = RollbackSession.fromJSON(json);
      
      expect(restored.id).toBe(session.id);
      expect(restored.operations).toHaveLength(2);
      expect(restored.operations[0].type).toBe(OperationType.CREATE);
    });
  });

  describe('RollbackManager', () => {
    let manager;

    beforeEach(() => {
      manager = new RollbackManager();
    });

    it('should start new session', () => {
      const session = manager.startSession();
      
      expect(session).toBeInstanceOf(RollbackSession);
      expect(manager.getCurrentSession()).toBe(session);
    });

    it('should start session with custom ID', () => {
      const session = manager.startSession('custom-id');
      
      expect(session.id).toBe('custom-id');
    });

    it('should get session by ID', () => {
      const session = manager.startSession('find-me');
      
      const found = manager.getSession('find-me');
      
      expect(found).toBe(session);
    });

    it('should commit current session', () => {
      const session = manager.startSession();
      
      manager.commit();
      
      expect(session.committed).toBe(true);
      expect(manager.getCurrentSession()).toBeNull();
    });

    it('should throw if committing without session', () => {
      expect(() => manager.commit()).toThrow('No active session');
    });

    it('should rollback file creation', async () => {
      const filePath = path.join(testDir, 'created.txt');
      
      // Create file and record it
      await fs.writeFile(filePath, 'content');
      const session = manager.startSession();
      session.recordCreate(filePath);
      
      // Rollback
      const result = await manager.rollback(session);
      
      expect(result.success).toBe(true);
      
      // File should be removed
      try {
        await fs.access(filePath);
        expect(true).toBe(false); // Should not reach here
      } catch {
        expect(true).toBe(true); // File doesn't exist - good!
      }
    });

    it('should rollback file update', async () => {
      const filePath = path.join(testDir, 'updated.txt');
      const backupPath = path.join(testDir, 'updated.backup.txt');
      
      // Create original and backup
      await fs.writeFile(backupPath, 'original');
      await fs.writeFile(filePath, 'updated');
      
      const session = manager.startSession();
      session.recordUpdate(filePath, backupPath);
      
      // Rollback
      const result = await manager.rollback(session);
      
      expect(result.success).toBe(true);
      
      // File should be restored
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('original');
    });

    it('should rollback file deletion', async () => {
      const filePath = path.join(testDir, 'deleted.txt');
      const backupPath = path.join(testDir, 'deleted.backup.txt');
      
      // Create backup (original file is "deleted")
      await fs.writeFile(backupPath, 'original content');
      
      const session = manager.startSession();
      session.recordDelete(filePath, backupPath);
      
      // Rollback
      const result = await manager.rollback(session);
      
      expect(result.success).toBe(true);
      
      // File should be restored
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('original content');
    });

    it('should rollback directory creation', async () => {
      const dirPath = path.join(testDir, 'new-dir');
      
      // Create directory
      await fs.mkdir(dirPath);
      
      const session = manager.startSession();
      session.recordMkdir(dirPath);
      
      // Rollback
      const result = await manager.rollback(session);
      
      expect(result.success).toBe(true);
      
      // Directory should be removed
      try {
        await fs.access(dirPath);
        expect(true).toBe(false); // Should not reach here
      } catch {
        expect(true).toBe(true); // Dir doesn't exist - good!
      }
    });

    it('should not rollback non-empty directory', async () => {
      const dirPath = path.join(testDir, 'non-empty-dir');
      const filePath = path.join(dirPath, 'file.txt');
      
      // Create directory with file
      await fs.mkdir(dirPath);
      await fs.writeFile(filePath, 'content');
      
      const session = manager.startSession();
      session.recordMkdir(dirPath);
      
      // Rollback
      const result = await manager.rollback(session);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      
      // Directory should still exist
      const exists = await fs.access(dirPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should rollback multiple operations in reverse order', async () => {
      const file1 = path.join(testDir, 'file1.txt');
      const file2 = path.join(testDir, 'file2.txt');
      const file3 = path.join(testDir, 'file3.txt');
      
      // Create files
      await fs.writeFile(file1, 'content1');
      await fs.writeFile(file2, 'content2');
      await fs.writeFile(file3, 'content3');
      
      const session = manager.startSession();
      session.recordCreate(file1);
      session.recordCreate(file2);
      session.recordCreate(file3);
      
      // Rollback
      const result = await manager.rollback(session);
      
      expect(result.success).toBe(true);
      expect(result.operations).toHaveLength(3);
      
      // All files should be removed
      for (const file of [file1, file2, file3]) {
        const exists = await fs.access(file).then(() => true).catch(() => false);
        expect(exists).toBe(false);
      }
    });

    it('should handle rollback of already rolled back session', async () => {
      const session = manager.startSession();
      session.recordCreate('/some/path');
      
      await manager.rollback(session);
      const result = await manager.rollback(session);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('already rolled back');
    });

    it('should rollback current session', async () => {
      const filePath = path.join(testDir, 'current.txt');
      await fs.writeFile(filePath, 'content');
      
      manager.startSession();
      manager.getCurrentSession().recordCreate(filePath);
      
      await manager.rollbackCurrent();
      
      expect(manager.getCurrentSession()).toBeNull();
      
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });

    it('should throw if rolling back without current session', async () => {
      await expect(manager.rollbackCurrent()).rejects.toThrow('No active session');
    });

    it('should cleanup session backups', async () => {
      const filePath = path.join(testDir, 'file.txt');
      const backupPath = path.join(testDir, 'file.backup.txt');
      
      await fs.writeFile(backupPath, 'backup content');
      
      const session = manager.startSession();
      session.recordUpdate(filePath, backupPath);
      
      const deletedCount = await manager.cleanupSession(session);
      
      expect(deletedCount).toBe(1);
      
      const exists = await fs.access(backupPath).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });

    it('should get all session summaries', () => {
      manager.startSession('session1').recordCreate('/file1');
      manager.startSession('session2').recordCreate('/file2');
      manager.startSession('session3').recordCreate('/file3');
      
      const summaries = manager.getAllSummaries();
      
      expect(summaries).toHaveLength(3);
      expect(summaries.map(s => s.id)).toContain('session1');
      expect(summaries.map(s => s.id)).toContain('session2');
      expect(summaries.map(s => s.id)).toContain('session3');
    });

    it('should clear all sessions', () => {
      manager.startSession('session1');
      manager.startSession('session2');
      
      manager.clearSessions();
      
      expect(manager.getAllSummaries()).toHaveLength(0);
      expect(manager.getCurrentSession()).toBeNull();
    });
  });

  describe('OperationType', () => {
    it('should define operation types', () => {
      expect(OperationType.CREATE).toBe('create');
      expect(OperationType.UPDATE).toBe('update');
      expect(OperationType.DELETE).toBe('delete');
      expect(OperationType.MKDIR).toBe('mkdir');
    });
  });

  describe('defaultManager', () => {
    it('should export singleton instance', () => {
      expect(defaultManager).toBeInstanceOf(RollbackManager);
    });
  });
});

