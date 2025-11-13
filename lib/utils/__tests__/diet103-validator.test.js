/**
 * Tests for diet103 Infrastructure Validation System
 * 
 * @module diet103-validator.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  detectDiet103Infrastructure,
  analyzeDiet103Gaps,
  validateMetadataJson,
  validateSkillRules,
  validateHookPermissions,
  validateSkillDirectory,
  validateClaudeMdContent,
  validateDiet103Consistency
} from '../diet103-validator.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('diet103 Validation System', () => {
  let testProjectPath;

  beforeEach(() => {
    // Create temporary test project
    testProjectPath = path.join(os.tmpdir(), 'test-project-' + Date.now());
    fs.mkdirSync(testProjectPath, { recursive: true });
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(testProjectPath)) {
      fs.rmSync(testProjectPath, { recursive: true, force: true });
    }
  });

  describe('detectDiet103Infrastructure', () => {
    it('should detect missing .claude directory', async () => {
      const checks = await detectDiet103Infrastructure(testProjectPath);
      expect(checks.hasDotClaude).toBe(false);
      expect(checks.hasClaudeMd).toBe(false);
      expect(checks.hasMetadata).toBe(false);
    });

    it('should detect existing .claude directory', async () => {
      fs.mkdirSync(path.join(testProjectPath, '.claude'));
      const checks = await detectDiet103Infrastructure(testProjectPath);
      expect(checks.hasDotClaude).toBe(true);
    });

    it('should detect all critical components', async () => {
      // Create full structure
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'Claude.md'), '# Test Project\n\nThis is a test.');
      fs.writeFileSync(
        path.join(claudeDir, 'metadata.json'),
        JSON.stringify({ diet103_version: '1.2.0' })
      );
      fs.writeFileSync(path.join(claudeDir, 'skill-rules.json'), JSON.stringify({ rules: [] }));
      fs.mkdirSync(path.join(claudeDir, 'hooks'), { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'hooks', 'UserPromptSubmit.js'), '#!/usr/bin/env node\n');
      fs.writeFileSync(path.join(claudeDir, 'hooks', 'PostToolUse.js'), '#!/usr/bin/env node\n');

      const checks = await detectDiet103Infrastructure(testProjectPath);

      expect(checks.hasClaudeMd).toBe(true);
      expect(checks.hasMetadata).toBe(true);
      expect(checks.hasSkillRules).toBe(true);
      expect(checks.hasUserPromptSubmit).toBe(true);
      expect(checks.hasPostToolUse).toBe(true);
      expect(checks.diet103Version).toBe('1.2.0');
    });

    it('should detect important directories', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.mkdirSync(path.join(claudeDir, 'skills'));
      fs.mkdirSync(path.join(claudeDir, 'commands'));
      fs.mkdirSync(path.join(claudeDir, 'agents'));
      fs.mkdirSync(path.join(claudeDir, 'resources'));

      const checks = await detectDiet103Infrastructure(testProjectPath);

      expect(checks.hasSkillsDir).toBe(true);
      expect(checks.hasCommandsDir).toBe(true);
      expect(checks.hasAgentsDir).toBe(true);
      expect(checks.hasResourcesDir).toBe(true);
    });
  });

  describe('analyzeDiet103Gaps', () => {
    it('should return 0% score for empty project', () => {
      const checks = {
        hasDotClaude: false,
        hasClaudeMd: false,
        hasMetadata: false,
        hasSkillRules: false,
        hasHooks: false,
        hasUserPromptSubmit: false,
        hasPostToolUse: false,
        hasSkillsDir: false,
        hasCommandsDir: false,
        hasAgentsDir: false,
        hasResourcesDir: false,
        hasReadme: false
      };
      const gaps = analyzeDiet103Gaps(checks);
      expect(gaps.score).toBe(0);
      expect(gaps.critical.length).toBe(7);
      expect(gaps.important.length).toBe(5);
      expect(gaps.isComplete).toBe(false);
    });

    it('should return 100% score for complete project', () => {
      const checks = {
        hasDotClaude: true,
        hasClaudeMd: true,
        hasMetadata: true,
        hasSkillRules: true,
        hasHooks: true,
        hasUserPromptSubmit: true,
        hasPostToolUse: true,
        hasSkillsDir: true,
        hasCommandsDir: true,
        hasAgentsDir: true,
        hasResourcesDir: true,
        hasReadme: true
      };
      const gaps = analyzeDiet103Gaps(checks);
      expect(gaps.score).toBe(100);
      expect(gaps.critical.length).toBe(0);
      expect(gaps.important.length).toBe(0);
      expect(gaps.isComplete).toBe(true);
    });

    it('should calculate weighted score correctly (70% critical, 30% important)', () => {
      // All critical, no important
      const checks = {
        hasDotClaude: true,
        hasClaudeMd: true,
        hasMetadata: true,
        hasSkillRules: true,
        hasHooks: true,
        hasUserPromptSubmit: true,
        hasPostToolUse: true,
        hasSkillsDir: false,
        hasCommandsDir: false,
        hasAgentsDir: false,
        hasResourcesDir: false,
        hasReadme: false
      };
      const gaps = analyzeDiet103Gaps(checks);
      expect(gaps.score).toBe(70); // 100% of 70% weight
      expect(gaps.critical.length).toBe(0);
      expect(gaps.important.length).toBe(5);
    });

    it('should handle partial completion correctly', () => {
      // Half critical, half important
      const checks = {
        hasDotClaude: true,
        hasClaudeMd: true,
        hasMetadata: true,
        hasSkillRules: true,
        hasHooks: false,
        hasUserPromptSubmit: false,
        hasPostToolUse: false,
        hasSkillsDir: true,
        hasCommandsDir: true,
        hasAgentsDir: true,
        hasResourcesDir: false,
        hasReadme: false
      };
      const gaps = analyzeDiet103Gaps(checks);
      // 4/7 critical (57%) * 0.7 = 40%
      // 3/5 important (60%) * 0.3 = 18%
      // Total = 58%
      expect(gaps.score).toBe(58);
      expect(gaps.critical.length).toBe(3);
      expect(gaps.important.length).toBe(2);
    });
  });

  describe('validateMetadataJson', () => {
    it('should return error if metadata.json does not exist', async () => {
      const result = await validateMetadataJson(testProjectPath);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('metadata.json does not exist');
    });

    it('should detect invalid JSON', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'metadata.json'), 'invalid json');

      const result = await validateMetadataJson(testProjectPath);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('parse error');
    });

    it('should detect missing required fields', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeDir, 'metadata.json'),
        JSON.stringify({ project_id: 'test' })
      );

      const result = await validateMetadataJson(testProjectPath);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('version'))).toBe(true);
      expect(result.errors.some(e => e.includes('description'))).toBe(true);
      expect(result.errors.some(e => e.includes('skills'))).toBe(true);
      expect(result.errors.some(e => e.includes('created'))).toBe(true);
      expect(result.errors.some(e => e.includes('diet103_version'))).toBe(true);
    });

    it('should detect incorrect diet103_version', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeDir, 'metadata.json'),
        JSON.stringify({
          project_id: 'test',
          version: '1.0.0',
          description: 'Test',
          skills: [],
          created: '2025-11-10T00:00:00.000Z',
          diet103_version: '1.1.0'
        })
      );

      const result = await validateMetadataJson(testProjectPath);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('diet103_version'))).toBe(true);
      expect(result.errors.some(e => e.includes('1.2.0'))).toBe(true);
    });

    it('should validate correct metadata.json', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeDir, 'metadata.json'),
        JSON.stringify({
          project_id: 'test',
          version: '1.0.0',
          description: 'Test project',
          skills: ['skill1', 'skill2'],
          created: '2025-11-10T00:00:00.000Z',
          diet103_version: '1.2.0'
        })
      );

      const result = await validateMetadataJson(testProjectPath);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect non-string values in skills array', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeDir, 'metadata.json'),
        JSON.stringify({
          project_id: 'test',
          version: '1.0.0',
          description: 'Test',
          skills: ['skill1', 123, 'skill2'],
          created: '2025-11-10T00:00:00.000Z',
          diet103_version: '1.2.0'
        })
      );

      const result = await validateMetadataJson(testProjectPath);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('non-string values'))).toBe(true);
    });

    it('should warn about invalid date format', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeDir, 'metadata.json'),
        JSON.stringify({
          project_id: 'test',
          version: '1.0.0',
          description: 'Test',
          skills: [],
          created: '2025-11-10',
          diet103_version: '1.2.0'
        })
      );

      const result = await validateMetadataJson(testProjectPath);
      expect(result.warnings.some(w => w.includes('ISO 8601'))).toBe(true);
    });

    it('should warn about invalid semver format', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeDir, 'metadata.json'),
        JSON.stringify({
          project_id: 'test',
          version: '1.0',
          description: 'Test',
          skills: [],
          created: '2025-11-10T00:00:00.000Z',
          diet103_version: '1.2.0'
        })
      );

      const result = await validateMetadataJson(testProjectPath);
      expect(result.warnings.some(w => w.includes('semantic versioning'))).toBe(true);
    });
  });

  describe('validateSkillRules', () => {
    it('should return error if skill-rules.json does not exist', async () => {
      const result = await validateSkillRules(testProjectPath);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('skill-rules.json does not exist');
    });

    it('should detect invalid JSON', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'skill-rules.json'), 'invalid json');

      const result = await validateSkillRules(testProjectPath);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('parse error');
    });

    it('should detect missing rules field', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'skill-rules.json'), JSON.stringify({}));

      const result = await validateSkillRules(testProjectPath);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('skill-rules.json missing required field: rules');
    });

    it('should detect non-array rules field', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'skill-rules.json'), JSON.stringify({ rules: 'not an array' }));

      const result = await validateSkillRules(testProjectPath);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('skill-rules.json rules field must be an array');
    });

    it('should warn about rules with no trigger mechanisms', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeDir, 'skill-rules.json'),
        JSON.stringify({
          rules: [{ skill: 'test-skill' }]
        })
      );

      const result = await validateSkillRules(testProjectPath);
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('no trigger mechanisms'))).toBe(true);
    });

    it('should validate correct skill-rules.json', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeDir, 'skill-rules.json'),
        JSON.stringify({
          rules: [
            {
              trigger_phrases: ['test'],
              skill: 'test-skill'
            }
          ]
        })
      );

      const result = await validateSkillRules(testProjectPath);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateHookPermissions', () => {
    it('should return error if hooks directory does not exist', async () => {
      const result = await validateHookPermissions(testProjectPath);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('hooks/ directory does not exist');
    });

    it('should detect non-executable UserPromptSubmit.js', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(path.join(claudeDir, 'hooks'), { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'hooks', 'UserPromptSubmit.js'), '#!/usr/bin/env node\n');
      fs.chmodSync(path.join(claudeDir, 'hooks', 'UserPromptSubmit.js'), 0o644);

      const result = await validateHookPermissions(testProjectPath);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('UserPromptSubmit.js not executable'))).toBe(true);
    });

    it('should detect non-executable PostToolUse.js', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(path.join(claudeDir, 'hooks'), { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'hooks', 'PostToolUse.js'), '#!/usr/bin/env node\n');
      fs.chmodSync(path.join(claudeDir, 'hooks', 'PostToolUse.js'), 0o644);

      const result = await validateHookPermissions(testProjectPath);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('PostToolUse.js not executable'))).toBe(true);
    });

    it('should warn if hook files are missing', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(path.join(claudeDir, 'hooks'), { recursive: true });

      const result = await validateHookPermissions(testProjectPath);
      expect(result.warnings.some(w => w.includes('UserPromptSubmit.js not found'))).toBe(true);
      expect(result.warnings.some(w => w.includes('PostToolUse.js not found'))).toBe(true);
    });

    it('should pass with properly configured hooks', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(path.join(claudeDir, 'hooks'), { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'hooks', 'UserPromptSubmit.js'), '#!/usr/bin/env node\n');
      fs.writeFileSync(path.join(claudeDir, 'hooks', 'PostToolUse.js'), '#!/usr/bin/env node\n');
      fs.chmodSync(path.join(claudeDir, 'hooks', 'UserPromptSubmit.js'), 0o755);
      fs.chmodSync(path.join(claudeDir, 'hooks', 'PostToolUse.js'), 0o755);

      const result = await validateHookPermissions(testProjectPath);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateSkillDirectory', () => {
    it('should warn if skills directory does not exist', async () => {
      const result = await validateSkillDirectory(testProjectPath);
      expect(result.warnings).toContain('skills/ directory does not exist (optional)');
    });

    it('should warn if skills directory is empty', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(path.join(claudeDir, 'skills'), { recursive: true });

      const result = await validateSkillDirectory(testProjectPath);
      expect(result.warnings).toContain('skills/ directory is empty');
    });

    it('should detect missing skill.md', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      const skillDir = path.join(claudeDir, 'skills', 'test-skill');
      fs.mkdirSync(skillDir, { recursive: true });

      const result = await validateSkillDirectory(testProjectPath);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('test-skill') && e.includes('skill.md'))).toBe(true);
    });

    it('should accept skill.md', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      const skillDir = path.join(claudeDir, 'skills', 'test-skill');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'skill.md'), '# Test Skill');

      const result = await validateSkillDirectory(testProjectPath);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept SKILL.md', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      const skillDir = path.join(claudeDir, 'skills', 'test-skill');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Test Skill');

      const result = await validateSkillDirectory(testProjectPath);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateClaudeMdContent', () => {
    it('should return error if Claude.md does not exist', async () => {
      const result = await validateClaudeMdContent(testProjectPath);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Claude.md does not exist');
    });

    it('should detect empty Claude.md', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'Claude.md'), '   \n  ');

      const result = await validateClaudeMdContent(testProjectPath);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Claude.md is empty');
    });

    it('should detect Claude.md that is too short', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'Claude.md'), '# Test');

      const result = await validateClaudeMdContent(testProjectPath);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('too short'))).toBe(true);
    });

    it('should warn if Claude.md does not start with heading', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeDir, 'Claude.md'),
        'This is test content without a heading but has sufficient length.'
      );

      const result = await validateClaudeMdContent(testProjectPath);
      expect(result.warnings.some(w => w.includes('should start with a markdown heading'))).toBe(true);
    });

    it('should validate correct Claude.md', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeDir, 'Claude.md'),
        '# Test Project\n\nThis is a test project with sufficient content.'
      );

      const result = await validateClaudeMdContent(testProjectPath);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateDiet103Consistency', () => {
    it('should detect missing metadata.json', async () => {
      const issues = await validateDiet103Consistency(testProjectPath);
      expect(issues.some(issue => issue.includes('metadata.json'))).toBe(true);
    });

    it('should detect invalid skill-rules.json', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'skill-rules.json'), 'invalid json');

      const issues = await validateDiet103Consistency(testProjectPath);
      expect(issues.some(issue => issue.includes('skill-rules.json'))).toBe(true);
    });

    it('should detect non-executable hooks', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(path.join(claudeDir, 'hooks'), { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'hooks', 'UserPromptSubmit.js'), '#!/usr/bin/env node\n');
      fs.chmodSync(path.join(claudeDir, 'hooks', 'UserPromptSubmit.js'), 0o644); // Not executable

      const issues = await validateDiet103Consistency(testProjectPath);
      expect(issues.some(issue => issue.includes('not executable'))).toBe(true);
    });

    it('should detect missing skill.md in skill directories', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      const skillDir = path.join(claudeDir, 'skills', 'test-skill');
      fs.mkdirSync(skillDir, { recursive: true });

      const issues = await validateDiet103Consistency(testProjectPath);
      expect(issues.some(issue => issue.includes('test-skill') && issue.includes('skill.md'))).toBe(
        true
      );
    });

    it('should detect Claude.md that is too short', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'Claude.md'), '# Test');

      const issues = await validateDiet103Consistency(testProjectPath);
      expect(issues.some(issue => issue.includes('too short'))).toBe(true);
    });

    it('should pass for fully consistent project (with optional warnings)', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });

      // Create valid metadata.json
      fs.writeFileSync(
        path.join(claudeDir, 'metadata.json'),
        JSON.stringify({
          project_id: 'test',
          version: '1.0.0',
          description: 'Test project',
          skills: [],
          created: '2025-11-10T00:00:00.000Z',
          diet103_version: '1.2.0'
        })
      );

      // Create valid skill-rules.json
      fs.writeFileSync(path.join(claudeDir, 'skill-rules.json'), JSON.stringify({ rules: [] }));

      // Create valid Claude.md with sufficient content
      fs.writeFileSync(
        path.join(claudeDir, 'Claude.md'),
        '# Test Project\n\nThis is a test project with sufficient content for validation.'
      );

      // Create hooks with proper permissions
      fs.mkdirSync(path.join(claudeDir, 'hooks'), { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'hooks', 'UserPromptSubmit.js'), '#!/usr/bin/env node\n');
      fs.writeFileSync(path.join(claudeDir, 'hooks', 'PostToolUse.js'), '#!/usr/bin/env node\n');
      fs.chmodSync(path.join(claudeDir, 'hooks', 'UserPromptSubmit.js'), 0o755);
      fs.chmodSync(path.join(claudeDir, 'hooks', 'PostToolUse.js'), 0o755);

      const issues = await validateDiet103Consistency(testProjectPath);
      // Should have no errors, but may have optional warnings (like missing skills directory)
      const errors = issues.filter(issue => !issue.startsWith('Warning:'));
      expect(errors).toHaveLength(0);
    });

    it('should have no issues for complete project with skills', async () => {
      const claudeDir = path.join(testProjectPath, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });

      // Create valid metadata.json
      fs.writeFileSync(
        path.join(claudeDir, 'metadata.json'),
        JSON.stringify({
          project_id: 'test',
          version: '1.0.0',
          description: 'Test project',
          skills: ['test-skill'],
          created: '2025-11-10T00:00:00.000Z',
          diet103_version: '1.2.0'
        })
      );

      // Create valid skill-rules.json
      fs.writeFileSync(path.join(claudeDir, 'skill-rules.json'), JSON.stringify({ rules: [] }));

      // Create valid Claude.md with sufficient content
      fs.writeFileSync(
        path.join(claudeDir, 'Claude.md'),
        '# Test Project\n\nThis is a test project with sufficient content for validation.'
      );

      // Create hooks with proper permissions
      fs.mkdirSync(path.join(claudeDir, 'hooks'), { recursive: true });
      fs.writeFileSync(path.join(claudeDir, 'hooks', 'UserPromptSubmit.js'), '#!/usr/bin/env node\n');
      fs.writeFileSync(path.join(claudeDir, 'hooks', 'PostToolUse.js'), '#!/usr/bin/env node\n');
      fs.chmodSync(path.join(claudeDir, 'hooks', 'UserPromptSubmit.js'), 0o755);
      fs.chmodSync(path.join(claudeDir, 'hooks', 'PostToolUse.js'), 0o755);

      // Create a valid skill with skill.md
      const skillDir = path.join(claudeDir, 'skills', 'test-skill');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'skill.md'), '# Test Skill\n\nA test skill.');

      const issues = await validateDiet103Consistency(testProjectPath);
      expect(issues).toHaveLength(0);
    });
  });
});

