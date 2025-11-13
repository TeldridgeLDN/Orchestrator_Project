/**
 * Tests for diet103 project register command
 * 
 * Tests project registration including:
 * - Basic registration
 * - Custom metadata
 * - Display names
 * - Batch registration
 * - Validation thresholds
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerCommand, batchRegisterProjects } from '../../lib/commands/register.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturesDir = path.join(__dirname, '../fixtures', 'register-tests');
const REGISTRY_FILE = path.join(process.env.HOME || '/tmp', '.claude', 'projects-registry-test.json');

// Mock the registry file path for testing
vi.mock('../../lib/commands/register.js', async () => {
  const actual = await vi.importActual('../../lib/commands/register.js');
  return {
    ...actual,
    REGISTRY_FILE: REGISTRY_FILE
  };
});

describe('diet103 project register command', () => {
  let tempDir;
  
  beforeEach(async () => {
    tempDir = path.join(fixturesDir, `test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    
    // Clean up test registry
    try {
      await fs.unlink(REGISTRY_FILE);
    } catch (error) {
      // Ignore if doesn't exist
    }
  });
  
  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
    
    // Clean up test registry
    try {
      await fs.unlink(REGISTRY_FILE);
    } catch (error) {
      // Ignore
    }
  });
  
  describe('Basic Registration', () => {
    beforeEach(async () => {
      // Create minimal project structure
      const claudeDir = path.join(tempDir, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });
      await fs.writeFile(path.join(claudeDir, 'metadata.json'), '{}');
      
      // Create minimal Docs directory for validation
      const docsDir = path.join(tempDir, 'Docs');
      await fs.mkdir(docsDir, { recursive: true });
      await fs.writeFile(path.join(docsDir, 'README.md'), '# Test');
    });
    
    it('should register project with default name', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'log');
      
      await registerCommand(tempDir, {
        verbose: false,
        threshold: 0 // Low threshold for testing
      });
      
      const output = consoleSpy.mock.calls.flat().join('');
      expect(output).toContain('Registration Successful');
      
      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });
    
    it('should use custom project name', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      
      await registerCommand(tempDir, {
        name: 'custom-name',
        verbose: false,
        threshold: 0
      });
      
      // Read registry to verify
      const registryContent = await fs.readFile(REGISTRY_FILE, 'utf-8');
      const registry = JSON.parse(registryContent);
      
      expect(registry.projects[tempDir].name).toBe('custom-name');
      
      exitSpy.mockRestore();
    });
  });
  
  describe('Display Name and Metadata', () => {
    beforeEach(async () => {
      // Create project structure
      const claudeDir = path.join(tempDir, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });
      await fs.writeFile(path.join(claudeDir, 'metadata.json'), '{}');
      
      const docsDir = path.join(tempDir, 'Docs');
      await fs.mkdir(docsDir, { recursive: true });
      await fs.writeFile(path.join(docsDir, 'README.md'), '# Test');
    });
    
    it('should store display name', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      
      await registerCommand(tempDir, {
        name: 'project-id',
        displayName: 'My Display Name',
        verbose: false,
        threshold: 0
      });
      
      const registryContent = await fs.readFile(REGISTRY_FILE, 'utf-8');
      const registry = JSON.parse(registryContent);
      
      expect(registry.projects[tempDir].displayName).toBe('My Display Name');
      
      exitSpy.mockRestore();
    });
    
    it('should store custom metadata', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      
      const metadata = { team: 'backend', version: '2.0', priority: 'high' };
      
      await registerCommand(tempDir, {
        name: 'test-project',
        metadata: JSON.stringify(metadata),
        verbose: false,
        threshold: 0
      });
      
      const registryContent = await fs.readFile(REGISTRY_FILE, 'utf-8');
      const registry = JSON.parse(registryContent);
      
      expect(registry.projects[tempDir].team).toBe('backend');
      expect(registry.projects[tempDir].version).toBe('2.0');
      expect(registry.projects[tempDir].priority).toBe('high');
      
      exitSpy.mockRestore();
    });
    
    it('should default display name to project name', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      
      await registerCommand(tempDir, {
        name: 'my-project',
        verbose: false,
        threshold: 0
      });
      
      const registryContent = await fs.readFile(REGISTRY_FILE, 'utf-8');
      const registry = JSON.parse(registryContent);
      
      expect(registry.projects[tempDir].displayName).toBe('my-project');
      
      exitSpy.mockRestore();
    });
  });
  
  describe('Validation and Thresholds', () => {
    it('should respect threshold setting', async () => {
      // Create project with minimal structure (low score)
      const claudeDir = path.join(tempDir, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });
      
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error');
      
      // Try with high threshold
      await registerCommand(tempDir, {
        name: 'test-project',
        verbose: false,
        threshold: 90,
        autoRepair: false
      });
      
      // Should fail due to low score
      expect(exitSpy).toHaveBeenCalledWith(1);
      
      exitSpy.mockRestore();
      errorSpy.mockRestore();
    });
    
    it('should update existing registration', async () => {
      const claudeDir = path.join(tempDir, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });
      await fs.writeFile(path.join(claudeDir, 'metadata.json'), '{}');
      
      const docsDir = path.join(tempDir, 'Docs');
      await fs.mkdir(docsDir, { recursive: true });
      await fs.writeFile(path.join(docsDir, 'README.md'), '# Test');
      
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'log');
      
      // First registration
      await registerCommand(tempDir, {
        name: 'original',
        verbose: false,
        threshold: 0
      });
      
      // Second registration
      await registerCommand(tempDir, {
        name: 'updated',
        verbose: false,
        threshold: 0
      });
      
      const output = consoleSpy.mock.calls.flat().join('');
      expect(output).toContain('already registered');
      
      const registryContent = await fs.readFile(REGISTRY_FILE, 'utf-8');
      const registry = JSON.parse(registryContent);
      
      expect(registry.projects[tempDir].name).toBe('updated');
      
      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
  
  describe('Batch Registration', () => {
    let batchDir;
    
    beforeEach(async () => {
      batchDir = path.join(fixturesDir, `batch-${Date.now()}`);
      await fs.mkdir(batchDir, { recursive: true });
      
      // Create multiple project directories
      for (let i = 1; i <= 3; i++) {
        const projectDir = path.join(batchDir, `project${i}`);
        await fs.mkdir(projectDir, { recursive: true });
        
        const claudeDir = path.join(projectDir, '.claude');
        await fs.mkdir(claudeDir, { recursive: true });
        await fs.writeFile(path.join(claudeDir, 'metadata.json'), '{}');
        
        const docsDir = path.join(projectDir, 'Docs');
        await fs.mkdir(docsDir, { recursive: true });
        await fs.writeFile(path.join(docsDir, 'README.md'), `# Project ${i}`);
      }
      
      // Create a directory without .claude (should be skipped)
      const nonClaudeDir = path.join(batchDir, 'not-a-project');
      await fs.mkdir(nonClaudeDir, { recursive: true });
    });
    
    afterEach(async () => {
      if (batchDir) {
        await fs.rm(batchDir, { recursive: true, force: true });
      }
    });
    
    it('should find all Claude projects', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      await batchRegisterProjects(batchDir, {
        verbose: false,
        threshold: 0
      });
      
      const output = consoleSpy.mock.calls.flat().join('');
      expect(output).toContain('Found 3 project(s)');
      
      consoleSpy.mockRestore();
    });
    
    it('should register all found projects', async () => {
      await batchRegisterProjects(batchDir, {
        verbose: false,
        threshold: 0
      });
      
      const registryContent = await fs.readFile(REGISTRY_FILE, 'utf-8');
      const registry = JSON.parse(registryContent);
      
      const projectPaths = Object.keys(registry.projects);
      expect(projectPaths.length).toBe(3);
    });
    
    it('should show summary of successful registrations', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      await batchRegisterProjects(batchDir, {
        verbose: false,
        threshold: 0
      });
      
      const output = consoleSpy.mock.calls.flat().join('');
      expect(output).toContain('Batch Registration Summary');
      expect(output).toContain('Successful: 3');
      
      consoleSpy.mockRestore();
    });
    
    it('should skip directories without .claude', async () => {
      await batchRegisterProjects(batchDir, {
        verbose: false,
        threshold: 0
      });
      
      const registryContent = await fs.readFile(REGISTRY_FILE, 'utf-8');
      const registry = JSON.parse(registryContent);
      
      const hasNonClaudeProject = Object.keys(registry.projects).some(p => 
        p.includes('not-a-project')
      );
      
      expect(hasNonClaudeProject).toBe(false);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle invalid metadata JSON', async () => {
      const claudeDir = path.join(tempDir, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });
      await fs.writeFile(path.join(claudeDir, 'metadata.json'), '{}');
      
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error');
      
      await registerCommand(tempDir, {
        name: 'test',
        metadata: '{ invalid json }',
        verbose: false,
        threshold: 0
      });
      
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(errorSpy).toHaveBeenCalled();
      
      exitSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });
});

