/**
 * Tests for File Generator
 * 
 * @group unit
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  calculateHash,
  fileExists,
  readFileWithHash,
  createBackup,
  ensureDirectory,
  writeFileSafe,
  writeFilesBatch,
  deleteFileSafe,
  getComponentPaths,
  getClaudePaths,
  cleanupOldBackups
} from '../file-generator.js';

describe('File Generator', () => {
  let testDir;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `file-gen-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('calculateHash', () => {
    it('should generate consistent hash for same content', () => {
      const content = 'test content';
      const hash1 = calculateHash(content);
      const hash2 = calculateHash(content);
      
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different content', () => {
      const hash1 = calculateHash('content1');
      const hash2 = calculateHash('content2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should return hex string', () => {
      const hash = calculateHash('test');
      
      expect(hash).toMatch(/^[a-f0-9]+$/);
      expect(hash.length).toBe(64); // SHA256 hex length
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const filePath = path.join(testDir, 'exists.txt');
      await fs.writeFile(filePath, 'content');
      
      const exists = await fileExists(filePath);
      
      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const filePath = path.join(testDir, 'does-not-exist.txt');
      
      const exists = await fileExists(filePath);
      
      expect(exists).toBe(false);
    });
  });

  describe('readFileWithHash', () => {
    it('should read file and calculate hash', async () => {
      const filePath = path.join(testDir, 'test.txt');
      const content = 'test content';
      await fs.writeFile(filePath, content);
      
      const result = await readFileWithHash(filePath);
      
      expect(result).not.toBeNull();
      expect(result.content).toBe(content);
      expect(result.hash).toBe(calculateHash(content));
    });

    it('should return null for non-existent file', async () => {
      const filePath = path.join(testDir, 'missing.txt');
      
      const result = await readFileWithHash(filePath);
      
      expect(result).toBeNull();
    });
  });

  describe('createBackup', () => {
    it('should create backup with timestamp', async () => {
      const filePath = path.join(testDir, 'original.txt');
      await fs.writeFile(filePath, 'original content');
      
      const backupPath = await createBackup(filePath);
      
      expect(backupPath).toContain('.backup-');
      expect(await fileExists(backupPath)).toBe(true);
      
      const backupContent = await fs.readFile(backupPath, 'utf-8');
      expect(backupContent).toBe('original content');
    });

    it('should preserve file extension', async () => {
      const filePath = path.join(testDir, 'file.yaml');
      await fs.writeFile(filePath, 'content');
      
      const backupPath = await createBackup(filePath);
      
      expect(backupPath).toMatch(/\.yaml$/);
    });
  });

  describe('ensureDirectory', () => {
    it('should create directory if it does not exist', async () => {
      const dirPath = path.join(testDir, 'new', 'nested', 'dir');
      
      await ensureDirectory(dirPath);
      
      const exists = await fileExists(dirPath);
      expect(exists).toBe(true);
    });

    it('should not fail if directory already exists', async () => {
      const dirPath = path.join(testDir, 'existing');
      await fs.mkdir(dirPath);
      
      await expect(ensureDirectory(dirPath)).resolves.not.toThrow();
    });

    it('should create nested directories', async () => {
      const dirPath = path.join(testDir, 'level1', 'level2', 'level3');
      
      await ensureDirectory(dirPath);
      
      expect(await fileExists(dirPath)).toBe(true);
    });
  });

  describe('writeFileSafe', () => {
    it('should create new file', async () => {
      const filePath = path.join(testDir, 'new.txt');
      const content = 'new content';
      
      const result = await writeFileSafe(filePath, content);
      
      expect(result.success).toBe(true);
      expect(result.operation).toBe('created');
      expect(await fileExists(filePath)).toBe(true);
      
      const written = await fs.readFile(filePath, 'utf-8');
      expect(written).toBe(content);
    });

    it('should skip if content is identical', async () => {
      const filePath = path.join(testDir, 'same.txt');
      const content = 'same content';
      
      await fs.writeFile(filePath, content);
      
      const result = await writeFileSafe(filePath, content);
      
      expect(result.success).toBe(true);
      expect(result.operation).toBe('skipped');
    });

    it('should block overwrite if not allowed', async () => {
      const filePath = path.join(testDir, 'existing.txt');
      await fs.writeFile(filePath, 'original');
      
      const result = await writeFileSafe(filePath, 'new content', { overwrite: false });
      
      expect(result.success).toBe(false);
      expect(result.operation).toBe('blocked');
      expect(result.error).toBeDefined();
    });

    it('should overwrite if allowed', async () => {
      const filePath = path.join(testDir, 'overwrite.txt');
      await fs.writeFile(filePath, 'original');
      
      const result = await writeFileSafe(filePath, 'new content', { overwrite: true });
      
      expect(result.success).toBe(true);
      expect(result.operation).toBe('updated');
      
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('new content');
    });

    it('should create backup when overwriting', async () => {
      const filePath = path.join(testDir, 'backup-test.txt');
      await fs.writeFile(filePath, 'original');
      
      const result = await writeFileSafe(filePath, 'new', { overwrite: true, backup: true });
      
      expect(result.success).toBe(true);
      expect(result.backup).toBeDefined();
      expect(await fileExists(result.backup)).toBe(true);
      
      const backupContent = await fs.readFile(result.backup, 'utf-8');
      expect(backupContent).toBe('original');
    });

    it('should handle dry run mode', async () => {
      const filePath = path.join(testDir, 'dry-run.txt');
      
      const result = await writeFileSafe(filePath, 'content', { dryRun: true });
      
      expect(result.success).toBe(true);
      expect(result.operation).toBe('dry_run');
      expect(await fileExists(filePath)).toBe(false);
    });

    it('should create parent directories', async () => {
      const filePath = path.join(testDir, 'nested', 'deep', 'file.txt');
      
      const result = await writeFileSafe(filePath, 'content');
      
      expect(result.success).toBe(true);
      expect(await fileExists(filePath)).toBe(true);
    });

    it('should set file permissions if specified', async () => {
      const filePath = path.join(testDir, 'executable.sh');
      
      const result = await writeFileSafe(filePath, '#!/bin/bash\necho test', { mode: 0o755 });
      
      expect(result.success).toBe(true);
      
      const stats = await fs.stat(filePath);
      // Check that execute bit is set (mode will be 0o100755 on Unix)
      expect(stats.mode & 0o111).toBeGreaterThan(0);
    });
  });

  describe('writeFilesBatch', () => {
    it('should write multiple files', async () => {
      const files = [
        { path: path.join(testDir, 'file1.txt'), content: 'content1' },
        { path: path.join(testDir, 'file2.txt'), content: 'content2' },
        { path: path.join(testDir, 'file3.txt'), content: 'content3' }
      ];
      
      const results = await writeFilesBatch(files);
      
      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      
      for (const file of files) {
        expect(await fileExists(file.path)).toBe(true);
      }
    });

    it('should stop on error by default', async () => {
      const existingPath = path.join(testDir, 'existing.txt');
      await fs.writeFile(existingPath, 'original');
      
      const files = [
        { path: path.join(testDir, 'file1.txt'), content: 'content1' },
        { path: existingPath, content: 'new content' }, // Will fail
        { path: path.join(testDir, 'file3.txt'), content: 'content3' }
      ];
      
      const results = await writeFilesBatch(files, { overwrite: false });
      
      expect(results).toHaveLength(2); // Stopped after error
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      
      expect(await fileExists(files[2].path)).toBe(false); // Never created
    });

    it('should continue on error if specified', async () => {
      const existingPath = path.join(testDir, 'existing.txt');
      await fs.writeFile(existingPath, 'original');
      
      const files = [
        { path: path.join(testDir, 'file1.txt'), content: 'content1' },
        { path: existingPath, content: 'new content' }, // Will fail
        { path: path.join(testDir, 'file3.txt'), content: 'content3' }
      ];
      
      const results = await writeFilesBatch(files, { 
        overwrite: false, 
        continueOnError: true 
      });
      
      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true); // Continued despite error
    });
  });

  describe('deleteFileSafe', () => {
    it('should delete existing file', async () => {
      const filePath = path.join(testDir, 'delete-me.txt');
      await fs.writeFile(filePath, 'content');
      
      const result = await deleteFileSafe(filePath, { backup: false });
      
      expect(result.success).toBe(true);
      expect(result.operation).toBe('deleted');
      expect(await fileExists(filePath)).toBe(false);
    });

    it('should create backup before deleting', async () => {
      const filePath = path.join(testDir, 'delete-with-backup.txt');
      const content = 'important content';
      await fs.writeFile(filePath, content);
      
      const result = await deleteFileSafe(filePath, { backup: true });
      
      expect(result.success).toBe(true);
      expect(result.backup).toBeDefined();
      expect(await fileExists(result.backup)).toBe(true);
      
      const backupContent = await fs.readFile(result.backup, 'utf-8');
      expect(backupContent).toBe(content);
    });

    it('should handle non-existent file', async () => {
      const filePath = path.join(testDir, 'does-not-exist.txt');
      
      const result = await deleteFileSafe(filePath);
      
      expect(result.success).toBe(true);
      expect(result.operation).toBe('skipped');
    });
  });

  describe('getComponentPaths', () => {
    it('should return skill paths', () => {
      const basePath = '/home/user/.claude';
      const paths = getComponentPaths(basePath, 'skill', 'my-skill');
      
      expect(paths.root).toBe('/home/user/.claude/skills/my-skill');
      expect(paths.main).toBe('/home/user/.claude/skills/my-skill/SKILL.md');
      expect(paths.metadata).toBe('/home/user/.claude/skills/my-skill/metadata.json');
    });

    it('should return agent paths', () => {
      const basePath = '/home/user/.claude';
      const paths = getComponentPaths(basePath, 'agent', 'my-agent');
      
      expect(paths.root).toBe('/home/user/.claude/agents/my-agent');
      expect(paths.main).toBe('/home/user/.claude/agents/my-agent/AGENT.md');
    });

    it('should include subdirectories', () => {
      const paths = getComponentPaths('/base', 'skill', 'test');
      
      expect(paths.resources).toContain('resources');
      expect(paths.workflows).toContain('workflows');
      expect(paths.agents).toContain('agents');
    });
  });

  describe('getClaudePaths', () => {
    it('should return Claude directory structure', () => {
      const paths = getClaudePaths();
      
      expect(paths.home).toBeDefined();
      expect(paths.skills).toContain('skills');
      expect(paths.agents).toContain('agents');
      expect(paths.commands).toContain('commands');
      expect(paths.hooks).toContain('hooks');
      expect(paths.scenarios).toContain('scenarios');
      expect(paths.mcpConfig).toContain('.mcp.json');
    });

    it('should respect CLAUDE_HOME environment variable', () => {
      const originalHome = process.env.CLAUDE_HOME;
      process.env.CLAUDE_HOME = '/custom/claude';
      
      const paths = getClaudePaths();
      
      expect(paths.home).toBe('/custom/claude');
      expect(paths.skills).toBe('/custom/claude/skills');
      
      // Restore
      if (originalHome) {
        process.env.CLAUDE_HOME = originalHome;
      } else {
        delete process.env.CLAUDE_HOME;
      }
    });
  });

  describe('cleanupOldBackups', () => {
    it('should delete old backup files', async () => {
      const backupDir = testDir;
      
      // Create old backup (simulate by setting mtime in the past)
      const oldBackup = path.join(backupDir, 'file.backup-1234567890.txt');
      await fs.writeFile(oldBackup, 'old');
      
      // Create recent backup
      const recentBackup = path.join(backupDir, `file.backup-${Date.now()}.txt`);
      await fs.writeFile(recentBackup, 'recent');
      
      // Set old backup's mtime to 60 days ago
      const oldTime = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      await fs.utimes(oldBackup, oldTime, oldTime);
      
      const deletedCount = await cleanupOldBackups(backupDir, 30);
      
      expect(deletedCount).toBe(1);
      expect(await fileExists(oldBackup)).toBe(false);
      expect(await fileExists(recentBackup)).toBe(true);
    });

    it('should handle non-existent directory', async () => {
      const result = await cleanupOldBackups('/non/existent/dir');
      
      expect(result).toBe(0);
    });

    it('should only delete backup files', async () => {
      const regularFile = path.join(testDir, 'regular.txt');
      await fs.writeFile(regularFile, 'content');
      
      const oldTime = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      await fs.utimes(regularFile, oldTime, oldTime);
      
      await cleanupOldBackups(testDir, 30);
      
      expect(await fileExists(regularFile)).toBe(true);
    });
  });
});

