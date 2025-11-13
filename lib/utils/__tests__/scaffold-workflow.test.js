/**
 * Tests for Scaffold Workflow
 * 
 * @group integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  scaffoldScenario,
  validateBeforeScaffold,
  previewScaffold
} from '../scaffold-workflow.js';

describe('Scaffold Workflow', () => {
  let testDir;
  let scenarioFile;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `scaffold-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    // Create a valid scenario file
    scenarioFile = path.join(testDir, 'test-scenario.yaml');
    const scenarioYaml = `
scenario:
  name: test-scenario
  description: Test scenario for scaffolding
  category: business_process
  version: "1.0.0"
  trigger:
    type: manual
    command: /test-scenario
    keywords:
      - test
      - scenario
  steps:
    - id: step_1
      action: First step
      type: manual
    - id: step_2
      action: Second step
      type: api_call
      mcp: test-mcp
      dependencies:
        - step_1
  dependencies:
    mcps:
      - test-mcp
    skills:
      - helper-skill
  generates:
    - "global_skill: test_scenario"
    - "slash_command: /test-scenario"
    - "hook: test_hook"
`;
    await fs.writeFile(scenarioFile, scenarioYaml);
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('validateBeforeScaffold', () => {
    it('should validate valid scenario', async () => {
      const result = await validateBeforeScaffold(scenarioFile);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.name).toBe('test-scenario');
    });

    it('should return generation targets', async () => {
      const result = await validateBeforeScaffold(scenarioFile);
      
      expect(result.targets).toBeDefined();
      expect(result.targets.skills).toContain('test_scenario');
      expect(result.targets.commands).toContain('/test-scenario');
      expect(result.targets.hooks).toContain('test_hook');
    });

    it('should fail for invalid scenario', async () => {
      const invalidFile = path.join(testDir, 'invalid.yaml');
      await fs.writeFile(invalidFile, 'invalid: yaml: content:');
      
      const result = await validateBeforeScaffold(invalidFile);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('previewScaffold', () => {
    it('should preview without writing files', async () => {
      const claudeHome = path.join(testDir, '.claude');
      
      const result = await previewScaffold(scenarioFile, {
        claudeHome
      });
      
      expect(result.success).toBe(true);
      expect(result.filesCreated).toHaveLength(0);
      expect(result.filesSkipped).toHaveLength(0);
      
      // No files should be created
      const skillsDir = path.join(claudeHome, 'skills');
      try {
        await fs.access(skillsDir);
        expect(true).toBe(false); // Should not reach here
      } catch {
        expect(true).toBe(true); // Dir doesn't exist - correct!
      }
    });
  });

  describe('scaffoldScenario', () => {
    it('should scaffold complete scenario', async () => {
      const claudeHome = path.join(testDir, '.claude');
      
      const result = await scaffoldScenario(scenarioFile, {
        claudeHome
      });
      
      expect(result.success).toBe(true);
      expect(result.filesCreated.length).toBeGreaterThan(0);
      expect(result.rolledBack).toBe(false);
    });

    it('should create skill files', async () => {
      const claudeHome = path.join(testDir, '.claude');
      
      await scaffoldScenario(scenarioFile, { claudeHome });
      
      const skillDir = path.join(claudeHome, 'skills', 'test_scenario');
      const skillMd = path.join(skillDir, 'SKILL.md');
      const metadata = path.join(skillDir, 'metadata.json');
      
      expect(await fs.access(skillMd).then(() => true).catch(() => false)).toBe(true);
      expect(await fs.access(metadata).then(() => true).catch(() => false)).toBe(true);
      
      const content = await fs.readFile(skillMd, 'utf-8');
      expect(content).toContain('TestScenario');
      expect(content).toContain('Test scenario for scaffolding');
    });

    it('should create command files', async () => {
      const claudeHome = path.join(testDir, '.claude');
      
      await scaffoldScenario(scenarioFile, { claudeHome });
      
      const commandFile = path.join(claudeHome, 'commands', 'test-scenario.md');
      
      expect(await fs.access(commandFile).then(() => true).catch(() => false)).toBe(true);
      
      const content = await fs.readFile(commandFile, 'utf-8');
      expect(content).toContain('/test-scenario');
    });

    it('should create hook files', async () => {
      const claudeHome = path.join(testDir, '.claude');
      
      await scaffoldScenario(scenarioFile, { claudeHome });
      
      const hookScript = path.join(claudeHome, 'hooks', 'test_hook.js');
      const hookMetadata = path.join(claudeHome, 'hooks', 'test_hook.json');
      
      expect(await fs.access(hookScript).then(() => true).catch(() => false)).toBe(true);
      expect(await fs.access(hookMetadata).then(() => true).catch(() => false)).toBe(true);
      
      // Check hook is executable
      const stats = await fs.stat(hookScript);
      expect(stats.mode & 0o111).toBeGreaterThan(0);
    });

    it('should fail to update existing files without overwrite permission', async () => {
      const claudeHome = path.join(testDir, '.claude');
      
      // First scaffold
      const first = await scaffoldScenario(scenarioFile, { claudeHome });
      expect(first.success).toBe(true);
      
      // Second scaffold - files exist with different content (timestamps changed)
      // Should fail without overwrite permission
      try {
        await scaffoldScenario(scenarioFile, { claudeHome });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.message).toContain('Failed to write');
      }
      
      // Original files should still exist (rollback prevented changes)
      const skillMd = path.join(claudeHome, 'skills', 'test_scenario', 'SKILL.md');
      const content = await fs.readFile(skillMd, 'utf-8');
      expect(content).toContain('TestScenario');
    });

    it('should overwrite with overwrite flag', async () => {
      const claudeHome = path.join(testDir, '.claude');
      
      // First scaffold
      await scaffoldScenario(scenarioFile, { claudeHome });
      
      // Second scaffold with overwrite
      const result = await scaffoldScenario(scenarioFile, {
        claudeHome,
        overwrite: true
      });
      
      expect(result.success).toBe(true);
      expect(result.filesUpdated.length).toBeGreaterThan(0);
    });

    it('should create backups when overwriting', async () => {
      const claudeHome = path.join(testDir, '.claude');
      
      // First scaffold
      await scaffoldScenario(scenarioFile, { claudeHome });
      
      // Second scaffold with overwrite
      await scaffoldScenario(scenarioFile, {
        claudeHome,
        overwrite: true,
        backup: true
      });
      
      // Check for backup files
      const skillDir = path.join(claudeHome, 'skills', 'test_scenario');
      const files = await fs.readdir(skillDir);
      
      const hasBackup = files.some(f => f.includes('.backup-'));
      expect(hasBackup).toBe(true);
    });

    it('should generate MCP configuration', async () => {
      const claudeHome = path.join(testDir, '.claude');
      
      const result = await scaffoldScenario(scenarioFile, { claudeHome });
      
      expect(result.mcpConfig).toBeDefined();
      expect(result.mcpConfig['test-mcp']).toBeDefined();
      expect(result.mcpDocs).toBeDefined();
    });

    it('should rollback on failure', async () => {
      const claudeHome = path.join(testDir, '.claude');
      
      // Create a file that will cause a conflict
      const skillDir = path.join(claudeHome, 'skills', 'test_scenario');
      await fs.mkdir(skillDir, { recursive: true });
      const skillMd = path.join(skillDir, 'SKILL.md');
      await fs.writeFile(skillMd, 'existing content');
      
      // Try to scaffold without overwrite (should fail and rollback)
      try {
        await scaffoldScenario(scenarioFile, {
          claudeHome,
          overwrite: false
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        // Expected failure
        expect(error.message).toContain('Failed to write');
      }
      
      // Original file should still exist with original content
      const content = await fs.readFile(skillMd, 'utf-8');
      expect(content).toBe('existing content');
    });

    it('should include metadata in result', async () => {
      const claudeHome = path.join(testDir, '.claude');
      
      const result = await scaffoldScenario(scenarioFile, { claudeHome });
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata.name).toBe('test-scenario');
      expect(result.metadata.category).toBe('business_process');
      expect(result.metadata.stepCount).toBe(2);
    });

    it('should include generation targets in result', async () => {
      const claudeHome = path.join(testDir, '.claude');
      
      const result = await scaffoldScenario(scenarioFile, { claudeHome });
      
      expect(result.targets).toBeDefined();
      expect(result.targets.skills).toContain('test_scenario');
      expect(result.targets.commands).toContain('/test-scenario');
      expect(result.targets.hooks).toContain('test_hook');
    });

    it('should track session ID', async () => {
      const claudeHome = path.join(testDir, '.claude');
      
      const result = await scaffoldScenario(scenarioFile, { claudeHome });
      
      expect(result.sessionId).toBeDefined();
      expect(result.sessionId).toContain('session-');
    });
  });
});

