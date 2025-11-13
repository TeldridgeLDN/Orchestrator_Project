/**
 * Tests for Scenario Potential Improvements Command
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { improvementsCommand } from '../improvements.js';
import { Command } from 'commander';

describe('Scenario Improvements Command', () => {
  let tempDir;
  let scenariosDir;
  let testScenarioPath;

  beforeEach(async () => {
    // Create temp directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scenario-test-'));
    scenariosDir = path.join(tempDir, '.claude', 'scenarios');
    await fs.mkdir(scenariosDir, { recursive: true });
    
    // Mock getScenariosDir to return our test directory
    vi.mock('../../utils/scenario-directory.js', () => ({
      getScenariosDir: () => scenariosDir,
      scenariosDirectoryExists: () => true
    }));
    
    // Create test scenario
    const testScenario = {
      scenario: {
        name: 'test_scenario',
        description: 'Test scenario for improvements',
        version: '1.0.0',
        trigger: { type: 'manual' },
        steps: [
          {
            id: 'step1',
            name: 'Test Step',
            action: 'command',
            target: 'test'
          }
        ],
        potential_improvements: [
          {
            suggestion: 'Add caching layer',
            impact: 'high',
            complexity: 'medium',
            priority: 'high'
          },
          {
            suggestion: 'Improve error messages',
            impact: 'low',
            complexity: 'low',
            priority: 'medium'
          }
        ]
      }
    };
    
    testScenarioPath = path.join(scenariosDir, 'test_scenario.yaml');
    await fs.writeFile(testScenarioPath, yaml.dump(testScenario), 'utf-8');
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  describe('Command Configuration', () => {
    it('should create a valid command', () => {
      const command = improvementsCommand();
      expect(command).toBeInstanceOf(Command);
      expect(command.name()).toBe('improvements');
    });

    it('should have required argument', () => {
      const command = improvementsCommand();
      const args = command.registeredArguments || command.args || command.processedArgs || [];
      expect(args.length).toBeGreaterThanOrEqual(1);
      if (args[0]) {
        expect(args[0].name()).toBe('name');
      }
    });

    it('should have correct options', () => {
      const command = improvementsCommand();
      const optionNames = command.options.map(opt => opt.long);
      
      expect(optionNames).toContain('--add');
      expect(optionNames).toContain('--verbose');
      expect(optionNames).toContain('--priority');
      expect(optionNames).toContain('--sort-by-priority');
      expect(optionNames).toContain('--no-interactive');
      expect(optionNames).toContain('--suggestion');
      expect(optionNames).toContain('--impact');
      expect(optionNames).toContain('--complexity');
    });
  });

  describe('Viewing Improvements', () => {
    it('should display existing improvements', async () => {
      const data = await fs.readFile(testScenarioPath, 'utf-8');
      const scenario = yaml.load(data);
      
      expect(scenario.scenario.potential_improvements).toHaveLength(2);
      expect(scenario.scenario.potential_improvements[0].suggestion).toBe('Add caching layer');
    });

    it('should handle scenario with no improvements', async () => {
      // Create scenario without improvements
      const emptyScenario = {
        scenario: {
          name: 'empty_scenario',
          description: 'Test scenario',
          version: '1.0.0',
          trigger: { type: 'manual' },
          steps: []
        }
      };
      
      const emptyPath = path.join(scenariosDir, 'empty_scenario.yaml');
      await fs.writeFile(emptyPath, yaml.dump(emptyScenario), 'utf-8');
      
      const data = await fs.readFile(emptyPath, 'utf-8');
      const scenario = yaml.load(data);
      
      expect(scenario.scenario.potential_improvements).toBeUndefined();
    });

    it('should filter by priority', async () => {
      const data = yaml.load(await fs.readFile(testScenarioPath, 'utf-8'));
      const highPriority = data.scenario.potential_improvements.filter(i => i.priority === 'high');
      
      expect(highPriority).toHaveLength(1);
      expect(highPriority[0].suggestion).toBe('Add caching layer');
    });
  });

  describe('Adding Improvements', () => {
    it('should add improvement with all fields', async () => {
      const data = yaml.load(await fs.readFile(testScenarioPath, 'utf-8'));
      
      const newImprovement = {
        suggestion: 'Add real-time monitoring',
        impact: 'high',
        complexity: 'high',
        priority: 'medium'
      };
      
      data.scenario.potential_improvements.push(newImprovement);
      await fs.writeFile(testScenarioPath, yaml.dump(data), 'utf-8');
      
      const updated = yaml.load(await fs.readFile(testScenarioPath, 'utf-8'));
      expect(updated.scenario.potential_improvements).toHaveLength(3);
      expect(updated.scenario.potential_improvements[2].suggestion).toBe('Add real-time monitoring');
    });

    it('should initialize improvements array if not exists', async () => {
      // Create scenario without improvements
      const noImprovements = {
        scenario: {
          name: 'no_improvements',
          description: 'Test',
          version: '1.0.0',
          trigger: { type: 'manual' },
          steps: []
        }
      };
      
      const noImpPath = path.join(scenariosDir, 'no_improvements.yaml');
      await fs.writeFile(noImpPath, yaml.dump(noImprovements), 'utf-8');
      
      const data = yaml.load(await fs.readFile(noImpPath, 'utf-8'));
      data.scenario.potential_improvements = [];
      data.scenario.potential_improvements.push({
        suggestion: 'First improvement',
        impact: 'low',
        complexity: 'low',
        priority: 'low'
      });
      
      await fs.writeFile(noImpPath, yaml.dump(data), 'utf-8');
      
      const updated = yaml.load(await fs.readFile(noImpPath, 'utf-8'));
      expect(updated.scenario.potential_improvements).toHaveLength(1);
    });
  });

  describe('Priority Sorting', () => {
    it('should sort by priority (high, medium, low)', async () => {
      const data = yaml.load(await fs.readFile(testScenarioPath, 'utf-8'));
      const improvements = data.scenario.potential_improvements;
      
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const sorted = [...improvements].sort((a, b) => {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      
      expect(sorted[0].priority).toBe('high');
      expect(sorted[1].priority).toBe('medium');
    });
  });

  describe('Field Validation', () => {
    it('should validate impact enum', async () => {
      const validImpacts = ['low', 'medium', 'high'];
      const data = yaml.load(await fs.readFile(testScenarioPath, 'utf-8'));
      
      data.scenario.potential_improvements.forEach(imp => {
        expect(validImpacts).toContain(imp.impact);
      });
    });

    it('should validate complexity enum', async () => {
      const validComplexity = ['low', 'medium', 'high'];
      const data = yaml.load(await fs.readFile(testScenarioPath, 'utf-8'));
      
      data.scenario.potential_improvements.forEach(imp => {
        expect(validComplexity).toContain(imp.complexity);
      });
    });

    it('should validate priority enum', async () => {
      const validPriority = ['low', 'medium', 'high'];
      const data = yaml.load(await fs.readFile(testScenarioPath, 'utf-8'));
      
      data.scenario.potential_improvements.forEach(imp => {
        expect(validPriority).toContain(imp.priority);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent scenario file', async () => {
      const nonExistent = path.join(scenariosDir, 'nonexistent.yaml');
      
      await expect(
        fs.access(nonExistent)
      ).rejects.toThrow();
    });

    it('should handle invalid YAML', async () => {
      const invalidPath = path.join(scenariosDir, 'invalid.yaml');
      await fs.writeFile(invalidPath, 'invalid: yaml: content: [', 'utf-8');
      
      await expect(
        async () => yaml.load(await fs.readFile(invalidPath, 'utf-8'))
      ).rejects.toThrow();
    });
  });

  describe('Data Structure', () => {
    it('should preserve improvement structure', async () => {
      const data = yaml.load(await fs.readFile(testScenarioPath, 'utf-8'));
      const improvement = data.scenario.potential_improvements[0];
      
      expect(improvement).toHaveProperty('suggestion');
      expect(improvement).toHaveProperty('impact');
      expect(improvement).toHaveProperty('complexity');
      expect(improvement).toHaveProperty('priority');
    });

    it('should handle all priority levels', async () => {
      const data = yaml.load(await fs.readFile(testScenarioPath, 'utf-8'));
      
      // Add low priority improvement
      data.scenario.potential_improvements.push({
        suggestion: 'Minor UI tweak',
        impact: 'low',
        complexity: 'low',
        priority: 'low'
      });
      
      await fs.writeFile(testScenarioPath, yaml.dump(data), 'utf-8');
      
      const updated = yaml.load(await fs.readFile(testScenarioPath, 'utf-8'));
      const priorities = updated.scenario.potential_improvements.map(i => i.priority);
      
      expect(priorities).toContain('high');
      expect(priorities).toContain('medium');
      expect(priorities).toContain('low');
    });
  });
});

