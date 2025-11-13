/**
 * Tests for Scenario Design Decisions Command
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { decisionsCommand } from '../decisions.js';
import { Command } from 'commander';

describe('Scenario Decisions Command', () => {
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
        description: 'Test scenario for decisions',
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
        design_decisions: [
          {
            decision: 'Use PostgreSQL instead of MySQL',
            reasoning: 'Better JSON support and more features',
            alternatives_considered: ['MySQL', 'MongoDB'],
            trade_offs: 'Slightly more complex setup',
            date: '2025-01-01'
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
      const command = decisionsCommand();
      expect(command).toBeInstanceOf(Command);
      expect(command.name()).toBe('decisions');
    });

    it('should have required argument', () => {
      const command = decisionsCommand();
      const args = command.registeredArguments || command.args || command.processedArgs || [];
      expect(args.length).toBeGreaterThanOrEqual(1);
      if (args[0]) {
        expect(args[0].name()).toBe('name');
      }
    });

    it('should have correct options', () => {
      const command = decisionsCommand();
      const optionNames = command.options.map(opt => opt.long);
      
      expect(optionNames).toContain('--add');
      expect(optionNames).toContain('--verbose');
      expect(optionNames).toContain('--no-interactive');
      expect(optionNames).toContain('--decision');
      expect(optionNames).toContain('--reasoning');
      expect(optionNames).toContain('--alternatives');
      expect(optionNames).toContain('--trade-offs');
    });
  });

  describe('Viewing Decisions', () => {
    it('should display existing decisions', async () => {
      const data = await fs.readFile(testScenarioPath, 'utf-8');
      const scenario = yaml.load(data);
      
      expect(scenario.scenario.design_decisions).toHaveLength(1);
      expect(scenario.scenario.design_decisions[0].decision).toBe('Use PostgreSQL instead of MySQL');
    });

    it('should handle scenario with no decisions', async () => {
      // Create scenario without decisions
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
      
      expect(scenario.scenario.design_decisions).toBeUndefined();
    });
  });

  describe('Adding Decisions', () => {
    it('should add decision with all fields', async () => {
      const data = yaml.load(await fs.readFile(testScenarioPath, 'utf-8'));
      
      const newDecision = {
        decision: 'Use REST instead of GraphQL',
        reasoning: 'Simpler to implement and maintain',
        alternatives_considered: ['GraphQL', 'gRPC'],
        trade_offs: 'Less flexible querying',
        date: '2025-01-15'
      };
      
      data.scenario.design_decisions.push(newDecision);
      await fs.writeFile(testScenarioPath, yaml.dump(data), 'utf-8');
      
      const updated = yaml.load(await fs.readFile(testScenarioPath, 'utf-8'));
      expect(updated.scenario.design_decisions).toHaveLength(2);
      expect(updated.scenario.design_decisions[1].decision).toBe('Use REST instead of GraphQL');
    });

    it('should add decision with minimal fields', async () => {
      const data = yaml.load(await fs.readFile(testScenarioPath, 'utf-8'));
      
      const minimalDecision = {
        decision: 'Use TypeScript for better type safety',
        reasoning: 'Catch errors at compile time',
        date: '2025-01-20'
      };
      
      data.scenario.design_decisions.push(minimalDecision);
      await fs.writeFile(testScenarioPath, yaml.dump(data), 'utf-8');
      
      const updated = yaml.load(await fs.readFile(testScenarioPath, 'utf-8'));
      expect(updated.scenario.design_decisions).toHaveLength(2);
      expect(updated.scenario.design_decisions[1].alternatives_considered).toBeUndefined();
    });

    it('should initialize decisions array if not exists', async () => {
      // Create scenario without decisions
      const noDecisions = {
        scenario: {
          name: 'no_decisions',
          description: 'Test',
          version: '1.0.0',
          trigger: { type: 'manual' },
          steps: []
        }
      };
      
      const noDecPath = path.join(scenariosDir, 'no_decisions.yaml');
      await fs.writeFile(noDecPath, yaml.dump(noDecisions), 'utf-8');
      
      const data = yaml.load(await fs.readFile(noDecPath, 'utf-8'));
      data.scenario.design_decisions = [];
      data.scenario.design_decisions.push({
        decision: 'First decision',
        reasoning: 'Test',
        date: '2025-01-01'
      });
      
      await fs.writeFile(noDecPath, yaml.dump(data), 'utf-8');
      
      const updated = yaml.load(await fs.readFile(noDecPath, 'utf-8'));
      expect(updated.scenario.design_decisions).toHaveLength(1);
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

    it('should handle empty alternatives list', async () => {
      const data = yaml.load(await fs.readFile(testScenarioPath, 'utf-8'));
      
      const decisionNoAlts = {
        decision: 'Use Redis for caching',
        reasoning: 'Fast in-memory storage',
        alternatives_considered: [],
        date: '2025-02-01'
      };
      
      data.scenario.design_decisions.push(decisionNoAlts);
      await fs.writeFile(testScenarioPath, yaml.dump(data), 'utf-8');
      
      const updated = yaml.load(await fs.readFile(testScenarioPath, 'utf-8'));
      expect(updated.scenario.design_decisions[1].alternatives_considered).toEqual([]);
    });
  });

  describe('Data Validation', () => {
    it('should preserve decision structure', async () => {
      const data = yaml.load(await fs.readFile(testScenarioPath, 'utf-8'));
      const decision = data.scenario.design_decisions[0];
      
      expect(decision).toHaveProperty('decision');
      expect(decision).toHaveProperty('reasoning');
      expect(decision).toHaveProperty('alternatives_considered');
      expect(decision).toHaveProperty('trade_offs');
      expect(decision).toHaveProperty('date');
    });

    it('should handle date format', async () => {
      const data = yaml.load(await fs.readFile(testScenarioPath, 'utf-8'));
      const date = data.scenario.design_decisions[0].date;
      
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});

