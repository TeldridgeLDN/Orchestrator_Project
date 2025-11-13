/**
 * Integration Tests for CLI Commands
 * 
 * Tests complete workflows using multiple commands together:
 * - Init → Register → Current
 * - Batch registration workflow
 * - Project lifecycle
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { initCommand } from '../../lib/commands/init.js';
import { registerCommand } from '../../lib/commands/register.js';
import { currentCommand } from '../../lib/commands/current.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturesDir = path.join(__dirname, '../fixtures', 'integration-tests');
const REGISTRY_FILE = path.join(process.env.HOME || '/tmp', '.claude', 'projects-registry-test.json');

// Mock getActiveProject for integration tests
vi.mock('../../lib/utils/config.js', () => ({
  getActiveProject: vi.fn(),
  setActiveProject: vi.fn(),
  readConfig: vi.fn().mockResolvedValue({ projects: {}, settings: {} }),
  writeConfig: vi.fn()
}));

import { getActiveProject, setActiveProject } from '../../lib/utils/config.js';

describe('CLI Command Integration', () => {
  let tempDir;
  
  beforeEach(async () => {
    tempDir = path.join(fixturesDir, `test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    
    // Clean up test registry
    try {
      await fs.unlink(REGISTRY_FILE);
    } catch (error) {
      // Ignore
    }
    
    vi.clearAllMocks();
  });
  
  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
    
    try {
      await fs.unlink(REGISTRY_FILE);
    } catch (error) {
      // Ignore
    }
  });
  
  describe('Complete Project Setup Workflow', () => {
    it('should init → register → view current', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      
      // Step 1: Initialize project
      await initCommand({
        path: tempDir,
        name: 'workflow-test',
        description: 'Testing complete workflow',
        interactive: false,
        verbose: false
      });
      
      // Verify init created files
      const claudeDir = path.join(tempDir, '.claude');
      const claudeDirExists = await fs.access(claudeDir).then(() => true).catch(() => false);
      expect(claudeDirExists).toBe(true);
      
      // Step 2: Add minimal infrastructure for registration
      const docsDir = path.join(tempDir, 'Docs');
      await fs.mkdir(docsDir, { recursive: true });
      await fs.writeFile(path.join(docsDir, 'README.md'), '# Test');
      
      // Step 3: Register project
      await registerCommand(tempDir, {
        name: 'workflow-test',
        displayName: 'Workflow Test Project',
        metadata: JSON.stringify({ stage: 'testing' }),
        verbose: false,
        threshold: 0
      });
      
      // Verify registration
      const registryContent = await fs.readFile(REGISTRY_FILE, 'utf-8');
      const registry = JSON.parse(registryContent);
      expect(registry.projects[tempDir]).toBeDefined();
      expect(registry.projects[tempDir].name).toBe('workflow-test');
      expect(registry.projects[tempDir].displayName).toBe('Workflow Test Project');
      expect(registry.projects[tempDir].stage).toBe('testing');
      
      // Step 4: Set as active and view current
      getActiveProject.mockResolvedValue({
        name: 'workflow-test',
        info: { 
          path: tempDir,
          last_active: new Date().toISOString()
        }
      });
      
      const consoleSpy = vi.spyOn(console, 'log');
      await currentCommand({ verbose: false });
      
      const output = consoleSpy.mock.calls.flat().join('');
      expect(output).toContain('workflow-test');
      expect(output).toContain('Testing complete workflow');
      
      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
  
  describe('Multiple Project Management', () => {
    it('should handle multiple projects independently', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      
      // Create two projects
      const project1Dir = path.join(tempDir, 'project1');
      const project2Dir = path.join(tempDir, 'project2');
      
      await fs.mkdir(project1Dir, { recursive: true });
      await fs.mkdir(project2Dir, { recursive: true });
      
      // Initialize both
      await initCommand({
        path: project1Dir,
        name: 'project-one',
        description: 'First project',
        interactive: false,
        verbose: false
      });
      
      await initCommand({
        path: project2Dir,
        name: 'project-two',
        description: 'Second project',
        interactive: false,
        verbose: false
      });
      
      // Add infrastructure
      for (const projDir of [project1Dir, project2Dir]) {
        const docsDir = path.join(projDir, 'Docs');
        await fs.mkdir(docsDir, { recursive: true });
        await fs.writeFile(path.join(docsDir, 'README.md'), '# Test');
      }
      
      // Register both
      await registerCommand(project1Dir, {
        name: 'project-one',
        metadata: JSON.stringify({ priority: 'high' }),
        verbose: false,
        threshold: 0
      });
      
      await registerCommand(project2Dir, {
        name: 'project-two',
        metadata: JSON.stringify({ priority: 'low' }),
        verbose: false,
        threshold: 0
      });
      
      // Verify both in registry
      const registryContent = await fs.readFile(REGISTRY_FILE, 'utf-8');
      const registry = JSON.parse(registryContent);
      
      expect(Object.keys(registry.projects).length).toBe(2);
      expect(registry.projects[project1Dir].priority).toBe('high');
      expect(registry.projects[project2Dir].priority).toBe('low');
      
      // View each project
      getActiveProject.mockResolvedValueOnce({
        name: 'project-one',
        info: { path: project1Dir }
      });
      
      const consoleSpy = vi.spyOn(console, 'log');
      await currentCommand({ json: true });
      
      const output = consoleSpy.mock.calls[0][0];
      const data = JSON.parse(output);
      expect(data.name).toBe('project-one');
      
      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
  
  describe('Project Reinitialization', () => {
    it('should handle reinitialization with different settings', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      
      // Initial setup
      await initCommand({
        path: tempDir,
        name: 'original-name',
        description: 'Original description',
        interactive: false,
        verbose: false
      });
      
      const originalMetadata = await fs.readFile(
        path.join(tempDir, '.claude', 'metadata.json'),
        'utf-8'
      );
      const originalData = JSON.parse(originalMetadata);
      
      // Reinitialize with force
      await initCommand({
        path: tempDir,
        name: 'new-name',
        description: 'New description',
        force: true,
        interactive: false,
        verbose: false
      });
      
      const newMetadata = await fs.readFile(
        path.join(tempDir, '.claude', 'metadata.json'),
        'utf-8'
      );
      const newData = JSON.parse(newMetadata);
      
      expect(newData.name).toBe('new-name');
      expect(newData.description).toBe('New description');
      expect(newData.name).not.toBe(originalData.name);
      
      exitSpy.mockRestore();
    });
  });
  
  describe('Error Recovery', () => {
    it('should handle corrupted metadata gracefully', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      
      // Initialize project
      await initCommand({
        path: tempDir,
        name: 'test-project',
        interactive: false,
        verbose: false
      });
      
      // Corrupt metadata
      await fs.writeFile(
        path.join(tempDir, '.claude', 'metadata.json'),
        '{ invalid json }'
      );
      
      // Try to view current - should handle gracefully
      getActiveProject.mockResolvedValue({
        name: 'test-project',
        info: { path: tempDir }
      });
      
      const consoleSpy = vi.spyOn(console, 'log');
      await currentCommand({ verbose: false });
      
      // Should not crash, should display project even with bad metadata
      const output = consoleSpy.mock.calls.flat().join('');
      expect(output).toContain('test-project');
      
      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
  
  describe('JSON Output Consistency', () => {
    it('should maintain consistent JSON structure across commands', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      
      // Setup project
      await initCommand({
        path: tempDir,
        name: 'json-test',
        interactive: false,
        verbose: false
      });
      
      getActiveProject.mockResolvedValue({
        name: 'json-test',
        info: { path: tempDir }
      });
      
      const consoleSpy = vi.spyOn(console, 'log');
      await currentCommand({ json: true });
      
      const output = consoleSpy.mock.calls[0][0];
      const data = JSON.parse(output);
      
      // Verify JSON structure
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('path');
      expect(data).toHaveProperty('resources');
      expect(data).toHaveProperty('taskmaster');
      expect(data.resources).toHaveProperty('scenarios');
      expect(data.resources).toHaveProperty('skills');
      expect(data.taskmaster).toHaveProperty('enabled');
      
      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
});

