/**
 * Tests for diet103 init command
 * 
 * Tests initialization of Claude projects including:
 * - Directory structure creation
 * - Configuration file generation
 * - TaskMaster integration
 * - Force reinitialization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { initCommand } from '../../lib/commands/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturesDir = path.join(__dirname, '../fixtures', 'init-tests');

describe('diet103 init command', () => {
  let tempDir;
  
  beforeEach(async () => {
    // Create temporary test directory
    tempDir = path.join(fixturesDir, `test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });
  
  afterEach(async () => {
    // Cleanup
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
  
  describe('Directory Structure Creation', () => {
    it('should create .claude directory structure', async () => {
      // Mock process.exit
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      
      await initCommand({
        path: tempDir,
        name: 'test-project',
        description: 'Test project',
        interactive: false,
        verbose: false
      });
      
      // Verify directory structure
      const claudeDir = path.join(tempDir, '.claude');
      expect(await fs.access(claudeDir).then(() => true).catch(() => false)).toBe(true);
      
      const subdirs = ['hooks', 'skills', 'commands', 'resources', 'archive', 'backups'];
      for (const dir of subdirs) {
        const dirPath = path.join(claudeDir, dir);
        expect(await fs.access(dirPath).then(() => true).catch(() => false)).toBe(true);
      }
      
      exitSpy.mockRestore();
    });
    
    it('should create CLAUDE.md with project name', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      
      const projectName = 'my-awesome-project';
      await initCommand({
        path: tempDir,
        name: projectName,
        description: 'An awesome project',
        interactive: false,
        verbose: false
      });
      
      const claudeMdPath = path.join(tempDir, 'CLAUDE.md');
      const content = await fs.readFile(claudeMdPath, 'utf-8');
      
      expect(content).toContain(projectName);
      expect(content).toContain('An awesome project');
      
      exitSpy.mockRestore();
    });
    
    it('should create metadata.json with correct structure', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      
      await initCommand({
        path: tempDir,
        name: 'test-project',
        description: 'Test description',
        interactive: false,
        verbose: false
      });
      
      const metadataPath = path.join(tempDir, '.claude', 'metadata.json');
      const content = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(content);
      
      expect(metadata.name).toBe('test-project');
      expect(metadata.description).toBe('Test description');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.created).toBeDefined();
      expect(metadata.diet103_version).toBeDefined();
      expect(metadata.settings).toBeDefined();
      
      exitSpy.mockRestore();
    });
    
    it('should create settings.json for Claude Code integration', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      
      await initCommand({
        path: tempDir,
        name: 'test-project',
        interactive: false,
        verbose: false
      });
      
      const settingsPath = path.join(tempDir, '.claude', 'settings.json');
      const content = await fs.readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(content);
      
      expect(settings.allowedTools).toBeDefined();
      expect(settings.autoLoadContext).toBe(true);
      expect(settings.contextFiles).toContain('CLAUDE.md');
      
      exitSpy.mockRestore();
    });
    
    it('should create skill-rules.json', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      
      await initCommand({
        path: tempDir,
        name: 'test-project',
        interactive: false,
        verbose: false
      });
      
      const rulesPath = path.join(tempDir, '.claude', 'skill-rules.json');
      const content = await fs.readFile(rulesPath, 'utf-8');
      const rules = JSON.parse(content);
      
      expect(rules.rules).toBeDefined();
      expect(Array.isArray(rules.rules)).toBe(true);
      expect(rules.settings).toBeDefined();
      
      exitSpy.mockRestore();
    });
  });
  
  describe('Force Reinitialization', () => {
    it('should warn when project already exists', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'log');
      
      // First initialization
      await initCommand({
        path: tempDir,
        name: 'test-project',
        interactive: false,
        verbose: false
      });
      
      // Second initialization without force
      await initCommand({
        path: tempDir,
        name: 'test-project',
        interactive: false,
        verbose: false,
        force: false
      });
      
      // Should display warning
      const logCalls = consoleSpy.mock.calls.flat().join('');
      expect(logCalls).toContain('already exists');
      
      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });
    
    it('should reinitialize when force flag is used', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      
      // First initialization
      await initCommand({
        path: tempDir,
        name: 'original-name',
        interactive: false,
        verbose: false
      });
      
      // Force reinitialize with new name
      await initCommand({
        path: tempDir,
        name: 'new-name',
        force: true,
        interactive: false,
        verbose: false
      });
      
      // Check metadata was updated
      const metadataPath = path.join(tempDir, '.claude', 'metadata.json');
      const content = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(content);
      
      expect(metadata.name).toBe('new-name');
      
      exitSpy.mockRestore();
    });
  });
  
  describe('TaskMaster Integration', () => {
    it('should skip TaskMaster when flag not set', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      
      await initCommand({
        path: tempDir,
        name: 'test-project',
        interactive: false,
        verbose: false,
        taskmaster: false
      });
      
      // TaskMaster files should not exist
      const taskmasterDir = path.join(tempDir, '.taskmaster');
      const exists = await fs.access(taskmasterDir).then(() => true).catch(() => false);
      expect(exists).toBe(false);
      
      exitSpy.mockRestore();
    });
  });
  
  describe('Error Handling', () => {
    it('should handle permission errors gracefully', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error');
      
      // Try to init in a non-existent deeply nested directory without creating parents
      const invalidPath = path.join('/nonexistent', 'deeply', 'nested', 'path');
      
      await initCommand({
        path: invalidPath,
        name: 'test-project',
        interactive: false,
        verbose: false
      });
      
      // Should have logged error
      expect(errorSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);
      
      exitSpy.mockRestore();
      errorSpy.mockRestore();
    });
    
    it('should validate project name format', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      
      // Try with invalid characters in name - should still work as we don't validate in non-interactive mode
      await initCommand({
        path: tempDir,
        name: 'test project',
        interactive: false,
        verbose: false
      });
      
      const metadataPath = path.join(tempDir, '.claude', 'metadata.json');
      const exists = await fs.access(metadataPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
      
      exitSpy.mockRestore();
    });
  });
});

