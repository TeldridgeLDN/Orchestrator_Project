/**
 * Tests for diet103 project current command
 * 
 * Tests displaying current project information including:
 * - Basic project info
 * - Health scores
 * - Resource counts
 * - TaskMaster integration
 * - JSON output
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { currentCommand } from '../../lib/commands/current.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturesDir = path.join(__dirname, '../fixtures', 'current-tests');

// Mock the config module
vi.mock('../../lib/utils/config.js', () => ({
  getActiveProject: vi.fn()
}));

import { getActiveProject } from '../../lib/utils/config.js';

describe('diet103 project current command', () => {
  let tempDir;
  
  beforeEach(async () => {
    tempDir = path.join(fixturesDir, `test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });
  
  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
    vi.clearAllMocks();
  });
  
  describe('No Active Project', () => {
    it('should display message when no project is active', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'log');
      
      getActiveProject.mockResolvedValue(null);
      
      await currentCommand({ verbose: false });
      
      const output = consoleSpy.mock.calls.flat().join('');
      expect(output).toContain('No active project');
      expect(exitSpy).toHaveBeenCalledWith(1);
      
      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });
    
    it('should output JSON when no project and --json flag', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'log');
      
      getActiveProject.mockResolvedValue(null);
      
      await currentCommand({ json: true });
      
      const output = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);
      expect(parsed.error).toBe('No active project');
      
      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
  
  describe('Project Information Display', () => {
    beforeEach(async () => {
      // Create mock project structure
      const claudeDir = path.join(tempDir, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });
      
      const metadata = {
        name: 'test-project',
        version: '1.0.0',
        description: 'A test project',
        created: '2025-01-01T00:00:00.000Z',
        diet103_version: '1.0.0',
        health_score: 85,
        tags: ['test', 'demo'],
        settings: {
          auto_validate: true,
          health_tracking: true
        }
      };
      
      await fs.writeFile(
        path.join(claudeDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      getActiveProject.mockResolvedValue({
        name: 'test-project',
        info: {
          path: tempDir,
          last_active: '2025-01-15T10:00:00.000Z'
        }
      });
    });
    
    it('should display basic project information', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'log');
      
      await currentCommand({ verbose: false });
      
      const output = consoleSpy.mock.calls.flat().join('');
      expect(output).toContain('test-project');
      expect(output).toContain(tempDir);
      expect(output).toContain('A test project');
      expect(output).toContain('1.0.0');
      
      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });
    
    it('should display health score', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'log');
      
      await currentCommand({ verbose: false });
      
      const output = consoleSpy.mock.calls.flat().join('');
      expect(output).toContain('85%');
      
      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });
    
    it('should display verbose information when flag set', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'log');
      
      await currentCommand({ verbose: true });
      
      const output = consoleSpy.mock.calls.flat().join('');
      expect(output).toContain('Configuration');
      expect(output).toContain('test, demo');
      expect(output).toContain('Auto-validate');
      expect(output).toContain('diet103 version');
      
      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });
    
    it('should output valid JSON', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'log');
      
      await currentCommand({ json: true });
      
      const output = consoleSpy.mock.calls[0][0];
      const data = JSON.parse(output);
      
      expect(data.name).toBe('test-project');
      expect(data.path).toBe(tempDir);
      expect(data.version).toBe('1.0.0');
      expect(data.healthScore).toBe(85);
      expect(data.resources).toBeDefined();
      expect(data.taskmaster).toBeDefined();
      
      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
  
  describe('Resource Counting', () => {
    beforeEach(async () => {
      const claudeDir = path.join(tempDir, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });
      
      const metadata = {
        name: 'test-project',
        version: '1.0.0'
      };
      
      await fs.writeFile(
        path.join(claudeDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      // Create scenarios
      const scenariosDir = path.join(claudeDir, 'scenarios');
      await fs.mkdir(scenariosDir, { recursive: true });
      await fs.writeFile(path.join(scenariosDir, 'scenario1.yaml'), 'test');
      await fs.writeFile(path.join(scenariosDir, 'scenario2.yml'), 'test');
      
      // Create skills
      const skillsDir = path.join(claudeDir, 'skills');
      await fs.mkdir(skillsDir, { recursive: true });
      await fs.mkdir(path.join(skillsDir, 'skill1'));
      await fs.mkdir(path.join(skillsDir, 'skill2'));
      
      getActiveProject.mockResolvedValue({
        name: 'test-project',
        info: { path: tempDir }
      });
    });
    
    it('should count scenarios correctly', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'log');
      
      await currentCommand({ verbose: false });
      
      const output = consoleSpy.mock.calls.flat().join('');
      expect(output).toContain('Scenarios: 2');
      
      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });
    
    it('should count skills correctly', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'log');
      
      await currentCommand({ verbose: false });
      
      const output = consoleSpy.mock.calls.flat().join('');
      expect(output).toContain('Skills: 2');
      
      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
  
  describe('TaskMaster Integration', () => {
    beforeEach(async () => {
      const claudeDir = path.join(tempDir, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });
      
      const metadata = {
        name: 'test-project',
        version: '1.0.0'
      };
      
      await fs.writeFile(
        path.join(claudeDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      getActiveProject.mockResolvedValue({
        name: 'test-project',
        info: { path: tempDir }
      });
    });
    
    it('should show TaskMaster as not initialized', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'log');
      
      await currentCommand({ verbose: false });
      
      const output = consoleSpy.mock.calls.flat().join('');
      expect(output).toContain('TaskMaster Status');
      expect(output).toContain('Not initialized');
      
      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });
    
    it('should display TaskMaster statistics when initialized', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'log');
      
      // Create TaskMaster structure
      const taskmasterDir = path.join(tempDir, '.taskmaster', 'tasks');
      await fs.mkdir(taskmasterDir, { recursive: true });
      
      const tasks = {
        tags: {
          master: [
            { id: 1, status: 'done', title: 'Task 1' },
            { id: 2, status: 'in-progress', title: 'Task 2' },
            { id: 3, status: 'pending', title: 'Task 3' }
          ]
        }
      };
      
      await fs.writeFile(
        path.join(taskmasterDir, 'tasks.json'),
        JSON.stringify(tasks, null, 2)
      );
      
      await currentCommand({ verbose: false });
      
      const output = consoleSpy.mock.calls.flat().join('');
      expect(output).toContain('Total Tasks: 3');
      expect(output).toContain('Completed: 1');
      expect(output).toContain('In Progress: 1');
      expect(output).toContain('Pending: 1');
      
      exitSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
});

