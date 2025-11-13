/**
 * Tests for diet103 Infrastructure Repair System
 * 
 * @module diet103-repair.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  replaceTemplateVariables,
  installCriticalComponents,
  installImportantDirectories,
  repairDiet103Infrastructure
} from '../diet103-repair.js';
import { detectDiet103Infrastructure, analyzeDiet103Gaps } from '../diet103-validator.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('diet103 Repair System', () => {
  let testProjectPath;

  beforeEach(() => {
    // Create temporary test project
    testProjectPath = path.join(os.tmpdir(), 'test-repair-' + Date.now());
    fs.mkdirSync(testProjectPath, { recursive: true });
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(testProjectPath)) {
      fs.rmSync(testProjectPath, { recursive: true, force: true });
    }
  });

  describe('replaceTemplateVariables', () => {
    it('should replace single variable', () => {
      const template = 'Hello {{NAME}}!';
      const result = replaceTemplateVariables(template, { NAME: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should replace multiple variables', () => {
      const template = '{{GREETING}} {{NAME}}, today is {{DAY}}!';
      const result = replaceTemplateVariables(template, {
        GREETING: 'Hello',
        NAME: 'Alice',
        DAY: 'Monday'
      });
      expect(result).toBe('Hello Alice, today is Monday!');
    });

    it('should handle variables that appear multiple times', () => {
      const template = '{{NAME}} said {{NAME}} again';
      const result = replaceTemplateVariables(template, { NAME: 'Echo' });
      expect(result).toBe('Echo said Echo again');
    });

    it('should leave unknown variables unchanged', () => {
      const template = 'Known {{KNOWN}} and unknown {{UNKNOWN}}';
      const result = replaceTemplateVariables(template, { KNOWN: 'value' });
      expect(result).toBe('Known value and unknown {{UNKNOWN}}');
    });

    it('should handle empty variables object', () => {
      const template = 'No {{VARIABLES}} here';
      const result = replaceTemplateVariables(template, {});
      expect(result).toBe('No {{VARIABLES}} here');
    });
  });

  describe('installCriticalComponents', () => {
    it('should create .claude directory', async () => {
      await installCriticalComponents(testProjectPath);
      expect(fs.existsSync(path.join(testProjectPath, '.claude'))).toBe(true);
    });

    it('should create hooks directory', async () => {
      await installCriticalComponents(testProjectPath);
      expect(fs.existsSync(path.join(testProjectPath, '.claude', 'hooks'))).toBe(true);
    });

    it('should create Claude.md', async () => {
      await installCriticalComponents(testProjectPath);
      const claudeMdPath = path.join(testProjectPath, '.claude', 'Claude.md');
      expect(fs.existsSync(claudeMdPath)).toBe(true);
      
      const content = fs.readFileSync(claudeMdPath, 'utf8');
      expect(content).toContain('# ');
      expect(content.length).toBeGreaterThan(50);
    });

    it('should create metadata.json with correct structure', async () => {
      await installCriticalComponents(testProjectPath);
      const metadataPath = path.join(testProjectPath, '.claude', 'metadata.json');
      expect(fs.existsSync(metadataPath)).toBe(true);
      
      const content = fs.readFileSync(metadataPath, 'utf8');
      const metadata = JSON.parse(content);
      
      expect(metadata.diet103_version).toBe('1.2.0');
      expect(metadata).toHaveProperty('project_id');
      expect(metadata).toHaveProperty('version');
      expect(metadata).toHaveProperty('description');
      expect(metadata).toHaveProperty('skills');
      expect(metadata).toHaveProperty('created');
    });

    it('should create skill-rules.json', async () => {
      await installCriticalComponents(testProjectPath);
      const skillRulesPath = path.join(testProjectPath, '.claude', 'skill-rules.json');
      expect(fs.existsSync(skillRulesPath)).toBe(true);
      
      const content = fs.readFileSync(skillRulesPath, 'utf8');
      const skillRules = JSON.parse(content);
      expect(skillRules).toHaveProperty('rules');
      expect(Array.isArray(skillRules.rules)).toBe(true);
    });

    it('should create executable UserPromptSubmit.js hook', async () => {
      await installCriticalComponents(testProjectPath);
      const hookPath = path.join(testProjectPath, '.claude', 'hooks', 'UserPromptSubmit.js');
      expect(fs.existsSync(hookPath)).toBe(true);
      
      const stats = fs.statSync(hookPath);
      expect(stats.mode & 0o111).toBeTruthy(); // Check executable bit
    });

    it('should create executable PostToolUse.js hook', async () => {
      await installCriticalComponents(testProjectPath);
      const hookPath = path.join(testProjectPath, '.claude', 'hooks', 'PostToolUse.js');
      expect(fs.existsSync(hookPath)).toBe(true);
      
      const stats = fs.statSync(hookPath);
      expect(stats.mode & 0o111).toBeTruthy(); // Check executable bit
    });

    it('should not overwrite existing files', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      
      const claudeMdPath = path.join(claudeDir, 'Claude.md');
      const existingContent = '# Existing content that should not be overwritten';
      fs.writeFileSync(claudeMdPath, existingContent);
      
      await installCriticalComponents(testProjectPath);
      
      const content = fs.readFileSync(claudeMdPath, 'utf8');
      expect(content).toBe(existingContent);
    });

    it('should return list of installed components', async () => {
      const installed = await installCriticalComponents(testProjectPath);
      
      expect(installed).toContain('.claude/');
      expect(installed).toContain('.claude/hooks/');
      expect(installed).toContain('.claude/Claude.md');
      expect(installed).toContain('.claude/metadata.json');
      expect(installed).toContain('.claude/skill-rules.json');
      expect(installed).toContain('.claude/hooks/UserPromptSubmit.js');
      expect(installed).toContain('.claude/hooks/PostToolUse.js');
    });

    it('should replace template variables in Claude.md', async () => {
      const variables = {
        PROJECT_NAME: 'My Test Project',
        CREATED_DATE: '2025-11-10T00:00:00.000Z'
      };
      
      await installCriticalComponents(testProjectPath, variables);
      
      const claudeMdPath = path.join(testProjectPath, '.claude', 'Claude.md');
      const content = fs.readFileSync(claudeMdPath, 'utf8');
      
      expect(content).toContain('My Test Project');
      expect(content).toContain('2025-11-10T00:00:00.000Z');
    });
  });

  describe('installImportantDirectories', () => {
    it('should create skills directory', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      
      await installImportantDirectories(testProjectPath);
      expect(fs.existsSync(path.join(claudeDir, 'skills'))).toBe(true);
    });

    it('should create commands directory', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      
      await installImportantDirectories(testProjectPath);
      expect(fs.existsSync(path.join(claudeDir, 'commands'))).toBe(true);
    });

    it('should create agents directory', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      
      await installImportantDirectories(testProjectPath);
      expect(fs.existsSync(path.join(claudeDir, 'agents'))).toBe(true);
    });

    it('should create resources directory', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      
      await installImportantDirectories(testProjectPath);
      expect(fs.existsSync(path.join(claudeDir, 'resources'))).toBe(true);
    });

    it('should create README.md', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      
      await installImportantDirectories(testProjectPath);
      const readmePath = path.join(claudeDir, 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
    });

    it('should not overwrite existing directories', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      const skillsDir = path.join(claudeDir, 'skills');
      fs.mkdirSync(skillsDir, { recursive: true });
      
      const testFile = path.join(skillsDir, 'test.txt');
      fs.writeFileSync(testFile, 'existing content');
      
      await installImportantDirectories(testProjectPath);
      
      expect(fs.existsSync(testFile)).toBe(true);
      expect(fs.readFileSync(testFile, 'utf8')).toBe('existing content');
    });

    it('should return list of installed directories', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      
      const installed = await installImportantDirectories(testProjectPath);
      
      expect(installed).toContain('.claude/skills/');
      expect(installed).toContain('.claude/commands/');
      expect(installed).toContain('.claude/agents/');
      expect(installed).toContain('.claude/resources/');
      expect(installed).toContain('.claude/README.md');
    });
  });

  describe('repairDiet103Infrastructure', () => {
    it('should repair empty project to 70% score (critical only)', async () => {
      const result = await repairDiet103Infrastructure(testProjectPath, { installImportant: false });
      
      expect(result.before.score).toBe(0);
      expect(result.after.score).toBe(70); // 100% of critical (70% weight)
      expect(result.after.criticalGaps).toBe(0);
      expect(result.success).toBe(true);
    });

    it('should repair empty project to 100% score (with important)', async () => {
      const result = await repairDiet103Infrastructure(testProjectPath, { installImportant: true });
      
      expect(result.before.score).toBe(0);
      expect(result.after.score).toBe(100);
      expect(result.after.criticalGaps).toBe(0);
      expect(result.after.importantGaps).toBe(0);
      expect(result.success).toBe(true);
    });

    it('should report installed components', async () => {
      const result = await repairDiet103Infrastructure(testProjectPath);
      
      expect(result.installed.critical.length).toBeGreaterThan(0);
      expect(result.installed.important.length).toBeGreaterThan(0);
      expect(result.totalInstalled).toBeGreaterThan(0);
    });

    it('should handle partially complete project', async () => {
      // Pre-create some components
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'Claude.md'), '# Existing');
      
      const result = await repairDiet103Infrastructure(testProjectPath);
      
      expect(result.success).toBe(true);
      expect(result.after.score).toBe(100);
      // Should not include Claude.md in installed since it existed
      expect(result.installed.critical).not.toContain('.claude/Claude.md');
    });

    it('should not overwrite existing infrastructure', async () => {
      // Create complete infrastructure
      await repairDiet103Infrastructure(testProjectPath);
      
      // Modify a file
      const claudeMdPath = path.join(testProjectPath, '.claude', 'Claude.md');
      const modifiedContent = '# MODIFIED CONTENT';
      fs.writeFileSync(claudeMdPath, modifiedContent);
      
      // Try to repair again
      const result = await repairDiet103Infrastructure(testProjectPath);
      
      // Should report nothing installed
      expect(result.totalInstalled).toBe(0);
      
      // Modified content should be preserved
      const content = fs.readFileSync(claudeMdPath, 'utf8');
      expect(content).toBe(modifiedContent);
    });

    it('should accept custom template variables', async () => {
      const result = await repairDiet103Infrastructure(testProjectPath, {
        variables: {
          PROJECT_NAME: 'Custom Project Name',
          PROJECT_DESCRIPTION: 'Custom description'
        }
      });
      
      const claudeMdPath = path.join(testProjectPath, '.claude', 'Claude.md');
      const content = fs.readFileSync(claudeMdPath, 'utf8');
      expect(content).toContain('Custom Project Name');
      
      const metadataPath = path.join(testProjectPath, '.claude', 'metadata.json');
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      expect(metadata.description).toContain('Custom description');
    });

    it('should validate infrastructure after repair', async () => {
      await repairDiet103Infrastructure(testProjectPath);
      
      // Verify using validator
      const checks = await detectDiet103Infrastructure(testProjectPath);
      const gaps = analyzeDiet103Gaps(checks);
      
      expect(gaps.score).toBe(100);
      expect(gaps.critical.length).toBe(0);
      expect(gaps.important.length).toBe(0);
    });

    it('should handle repair on project with some missing components', async () => {
      // Create partial infrastructure
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'Claude.md'), '# Test');
      fs.writeFileSync(
        path.join(claudeDir, 'metadata.json'),
        JSON.stringify({ diet103_version: '1.2.0', created: new Date().toISOString() })
      );
      
      const result = await repairDiet103Infrastructure(testProjectPath);
      
      expect(result.success).toBe(true);
      expect(result.after.criticalGaps).toBe(0);
      // Should install missing critical components
      expect(result.installed.critical.length).toBeGreaterThan(0);
    });
  });
});

