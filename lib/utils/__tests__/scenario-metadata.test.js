/**
 * Tests for scenario-metadata.js
 * 
 * @group unit
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  getConfigPath,
  loadConfig,
  saveConfig,
  getDefaultConfig,
  syncScenariosWithFilesystem,
  registerScaffoldedScenario,
  touchScenario,
  getAvailableScenarios,
  getScaffoldedScenarios,
  getScenarioMetadata,
  isScenarioScaffolded,
  getScenarioStatistics,
  removeScenarioMetadata,
  validateMetadataConsistency
} from '../scenario-metadata.js';

describe('scenario-metadata', () => {
  let tempDir;
  let originalHome;

  beforeEach(async () => {
    // Create temp directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scenario-metadata-test-'));
    
    // Mock homedir
    originalHome = os.homedir;
    os.homedir = () => tempDir;
  });

  afterEach(async () => {
    // Restore homedir
    os.homedir = originalHome;
    
    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('getConfigPath', () => {
    it('should return correct config path', () => {
      const configPath = getConfigPath();
      expect(configPath).toBe(path.join(tempDir, '.claude', 'config.json'));
    });
  });

  describe('loadConfig', () => {
    it('should return default config if file does not exist', async () => {
      const config = await loadConfig();
      expect(config).toHaveProperty('scenarios');
      expect(config.scenarios).toHaveProperty('available');
      expect(config.scenarios).toHaveProperty('scaffolded');
    });

    it('should load existing config', async () => {
      const testConfig = {
        version: '1.0.0',
        scenarios: { available: {}, scaffolded: {} }
      };
      
      const claudeDir = path.join(tempDir, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });
      await fs.writeFile(path.join(claudeDir, 'config.json'), JSON.stringify(testConfig));

      const config = await loadConfig();
      expect(config.version).toBe('1.0.0');
    });
  });

  describe('saveConfig', () => {
    it('should save config to file', async () => {
      const config = getDefaultConfig();
      await saveConfig(config);

      const configPath = getConfigPath();
      const exists = await fs.access(configPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      const saved = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      expect(saved.version).toBe('1.0.0');
    });

    it('should update last_modified timestamp', async () => {
      const config = getDefaultConfig();
      config.last_modified = '2020-01-01T00:00:00Z';
      
      await saveConfig(config);

      const saved = JSON.parse(await fs.readFile(getConfigPath(), 'utf-8'));
      expect(saved.last_modified).not.toBe('2020-01-01T00:00:00Z');
    });
  });

  describe('getDefaultConfig', () => {
    it('should return valid default config structure', () => {
      const config = getDefaultConfig();
      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('scenarios');
      expect(config.scenarios).toHaveProperty('available');
      expect(config.scenarios).toHaveProperty('scaffolded');
      expect(config).toHaveProperty('settings');
      expect(config).toHaveProperty('paths');
      expect(config).toHaveProperty('statistics');
    });
  });

  describe('syncScenariosWithFilesystem', () => {
    it('should return error if scenarios directory does not exist', async () => {
      const result = await syncScenariosWithFilesystem();
      expect(result.success).toBe(false);
      expect(result.scenarios_found).toBe(0);
    });

    it('should sync scenarios from filesystem', async () => {
      // Create scenarios directory with test YAML
      const scenariosDir = path.join(tempDir, '.claude', 'scenarios');
      await fs.mkdir(scenariosDir, { recursive: true });
      
      const testScenario = {
        scenario: {
          name: 'test-scenario',
          description: 'Test scenario',
          category: 'business_process',
          trigger: { type: 'manual', command: '/test' },
          steps: [
            { id: 'step1', action: 'Test step', type: 'manual' }
          ],
          dependencies: { mcps: [], skills: [] },
          generates: ['global_skill: test_scenario']
        }
      };
      
      await fs.writeFile(
        path.join(scenariosDir, 'test-scenario.yaml'),
        `scenario:\n  name: test-scenario\n  description: Test scenario\n  category: business_process\n  trigger:\n    type: manual\n    command: /test\n  steps:\n    - id: step1\n      action: Test step\n      type: manual\n  dependencies:\n    mcps: []\n    skills: []\n  generates:\n    - "global_skill: test_scenario"`
      );

      const result = await syncScenariosWithFilesystem();
      expect(result.success).toBe(true);
      expect(result.scenarios_found).toBe(1);
      expect(result.synced).toBe(1);
    });
  });

  describe('registerScaffoldedScenario', () => {
    it('should move scenario from available to scaffolded', async () => {
      const config = getDefaultConfig();
      config.scenarios.available['test-scenario'] = {
        path: '/test/path.yaml',
        description: 'Test',
        components: { skills: [], commands: [], hooks: [] }
      };
      await saveConfig(config);

      await registerScaffoldedScenario('test-scenario', {
        filesCreated: ['/test/file.md'],
        sessionId: 'session-123'
      });

      const updated = await loadConfig();
      expect(updated.scenarios.available['test-scenario']).toBeUndefined();
      expect(updated.scenarios.scaffolded['test-scenario']).toBeDefined();
      expect(updated.scenarios.scaffolded['test-scenario'].status).toBe('scaffolded');
      expect(updated.scenarios.scaffolded['test-scenario'].session_id).toBe('session-123');
    });

    it('should throw error if scenario not found', async () => {
      await expect(
        registerScaffoldedScenario('non-existent', { filesCreated: [] })
      ).rejects.toThrow('not found');
    });
  });

  describe('touchScenario', () => {
    it('should update last_used timestamp', async () => {
      const config = getDefaultConfig();
      config.scenarios.scaffolded['test'] = {
        last_used: '2020-01-01T00:00:00Z'
      };
      await saveConfig(config);

      await touchScenario('test');

      const updated = await loadConfig();
      expect(updated.scenarios.scaffolded['test'].last_used).not.toBe('2020-01-01T00:00:00Z');
    });

    it('should do nothing if scenario not scaffolded', async () => {
      await touchScenario('non-existent');
      // Should not throw
    });
  });

  describe('getAvailableScenarios', () => {
    it('should return available scenarios', async () => {
      const config = getDefaultConfig();
      config.scenarios.available['test'] = { path: '/test' };
      await saveConfig(config);

      const scenarios = await getAvailableScenarios();
      expect(scenarios).toHaveProperty('test');
    });
  });

  describe('getScaffoldedScenarios', () => {
    it('should return scaffolded scenarios', async () => {
      const config = getDefaultConfig();
      config.scenarios.scaffolded['test'] = { scaffolded_at: '2020-01-01' };
      await saveConfig(config);

      const scenarios = await getScaffoldedScenarios();
      expect(scenarios).toHaveProperty('test');
    });
  });

  describe('getScenarioMetadata', () => {
    it('should return metadata from available scenarios', async () => {
      const config = getDefaultConfig();
      config.scenarios.available['test'] = { path: '/test' };
      await saveConfig(config);

      const metadata = await getScenarioMetadata('test');
      expect(metadata).toEqual({ path: '/test' });
    });

    it('should return metadata from scaffolded scenarios', async () => {
      const config = getDefaultConfig();
      config.scenarios.scaffolded['test'] = { scaffolded_at: '2020-01-01' };
      await saveConfig(config);

      const metadata = await getScenarioMetadata('test');
      expect(metadata).toEqual({ scaffolded_at: '2020-01-01' });
    });

    it('should return null if not found', async () => {
      const metadata = await getScenarioMetadata('non-existent');
      expect(metadata).toBeNull();
    });
  });

  describe('isScenarioScaffolded', () => {
    it('should return true if scaffolded', async () => {
      const config = getDefaultConfig();
      config.scenarios.scaffolded['test'] = { scaffolded_at: '2020-01-01' };
      await saveConfig(config);

      const result = await isScenarioScaffolded('test');
      expect(result).toBe(true);
    });

    it('should return false if not scaffolded', async () => {
      const result = await isScenarioScaffolded('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('getScenarioStatistics', () => {
    it('should return statistics', async () => {
      const config = getDefaultConfig();
      config.statistics.total_scenarios = 5;
      await saveConfig(config);

      const stats = await getScenarioStatistics();
      expect(stats.total_scenarios).toBe(5);
    });
  });

  describe('removeScenarioMetadata', () => {
    it('should remove from available scenarios', async () => {
      const config = getDefaultConfig();
      config.scenarios.available['test'] = { path: '/test' };
      await saveConfig(config);

      const removed = await removeScenarioMetadata('test');
      expect(removed).toBe(true);

      const updated = await loadConfig();
      expect(updated.scenarios.available['test']).toBeUndefined();
    });

    it('should remove from scaffolded scenarios', async () => {
      const config = getDefaultConfig();
      config.scenarios.scaffolded['test'] = { scaffolded_at: '2020-01-01' };
      await saveConfig(config);

      const removed = await removeScenarioMetadata('test');
      expect(removed).toBe(true);

      const updated = await loadConfig();
      expect(updated.scenarios.scaffolded['test']).toBeUndefined();
    });

    it('should return false if not found', async () => {
      const removed = await removeScenarioMetadata('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('validateMetadataConsistency', () => {
    it('should detect missing scenario files', async () => {
      const config = getDefaultConfig();
      config.scenarios.available['test'] = {
        path: '/non/existent/path.yaml'
      };
      await saveConfig(config);

      const result = await validateMetadataConsistency();
      expect(result.consistent).toBe(false);
      expect(result.issues_count).toBeGreaterThan(0);
      expect(result.issues[0].type).toBe('missing_file');
    });

    it('should detect missing generated files', async () => {
      const config = getDefaultConfig();
      config.scenarios.scaffolded['test'] = {
        generated_files: ['/non/existent/file.md']
      };
      await saveConfig(config);

      const result = await validateMetadataConsistency();
      expect(result.consistent).toBe(false);
      expect(result.issues_count).toBeGreaterThan(0);
      expect(result.issues[0].type).toBe('missing_generated_file');
    });

    it('should return consistent for valid metadata', async () => {
      const result = await validateMetadataConsistency();
      expect(result.consistent).toBe(true);
      expect(result.issues_count).toBe(0);
    });
  });
});

