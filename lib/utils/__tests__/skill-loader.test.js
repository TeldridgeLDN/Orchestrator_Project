/**
 * @fileoverview Tests for Skill Discovery and Loading Utilities
 * @module lib/utils/__tests__/skill-loader.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  getGlobalSkillsPath,
  ensureGlobalSkillsDirectory,
  loadSkillMetadata,
  loadSkill,
  skillExists,
  listAvailableSkills,
  searchSkills,
  getSkillVersions,
  validateSkillStructure,
  copySkillFiles,
  getSkillImportSummary
} from '../skill-loader.js';

describe('Skill Loader', () => {
  let testDir;
  let skillsDir;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'skill-loader-test-'));
    skillsDir = path.join(testDir, 'skills');
    await fs.promises.mkdir(skillsDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    if (testDir) {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    }
  });

  describe('getGlobalSkillsPath', () => {
    it('should return path from environment variable if set', () => {
      const originalEnv = process.env.DIET103_SKILLS_PATH;
      process.env.DIET103_SKILLS_PATH = '/custom/path';
      
      const result = getGlobalSkillsPath();
      expect(result).toBe('/custom/path');
      
      // Restore
      if (originalEnv) {
        process.env.DIET103_SKILLS_PATH = originalEnv;
      } else {
        delete process.env.DIET103_SKILLS_PATH;
      }
    });

    it('should return default path if no environment variable', () => {
      const originalEnv = process.env.DIET103_SKILLS_PATH;
      delete process.env.DIET103_SKILLS_PATH;
      
      const result = getGlobalSkillsPath();
      expect(result).toBe(path.join(os.homedir(), '.claude', 'skills'));
      
      // Restore
      if (originalEnv) {
        process.env.DIET103_SKILLS_PATH = originalEnv;
      }
    });
  });

  describe('ensureGlobalSkillsDirectory', () => {
    it('should create directory if it does not exist', async () => {
      const originalEnv = process.env.DIET103_SKILLS_PATH;
      process.env.DIET103_SKILLS_PATH = path.join(testDir, 'global-skills');
      
      const result = await ensureGlobalSkillsDirectory();
      
      expect(result).toBe(path.join(testDir, 'global-skills'));
      expect(fs.existsSync(result)).toBe(true);
      
      // Restore
      if (originalEnv) {
        process.env.DIET103_SKILLS_PATH = originalEnv;
      } else {
        delete process.env.DIET103_SKILLS_PATH;
      }
    });
  });

  describe('loadSkillMetadata', () => {
    it('should load valid skill metadata', async () => {
      const skillDir = path.join(skillsDir, 'test-skill');
      await fs.promises.mkdir(skillDir);
      
      const metadata = {
        name: 'test-skill',
        version: '1.0.0',
        description: 'A test skill'
      };
      
      await fs.promises.writeFile(
        path.join(skillDir, 'metadata.json'),
        JSON.stringify(metadata),
        'utf8'
      );
      
      const result = await loadSkillMetadata(skillDir);
      expect(result).toEqual(metadata);
    });

    it('should throw error if metadata.json not found', async () => {
      const skillDir = path.join(skillsDir, 'missing-metadata');
      await fs.promises.mkdir(skillDir);
      
      await expect(loadSkillMetadata(skillDir)).rejects.toThrow('metadata.json not found');
    });

    it('should throw error if metadata has invalid JSON', async () => {
      const skillDir = path.join(skillsDir, 'invalid-json');
      await fs.promises.mkdir(skillDir);
      
      await fs.promises.writeFile(
        path.join(skillDir, 'metadata.json'),
        'invalid json',
        'utf8'
      );
      
      await expect(loadSkillMetadata(skillDir)).rejects.toThrow('Invalid JSON');
    });

    it('should throw error if required fields are missing', async () => {
      const skillDir = path.join(skillsDir, 'incomplete');
      await fs.promises.mkdir(skillDir);
      
      const metadata = {
        name: 'incomplete-skill'
        // Missing version and description
      };
      
      await fs.promises.writeFile(
        path.join(skillDir, 'metadata.json'),
        JSON.stringify(metadata),
        'utf8'
      );
      
      await expect(loadSkillMetadata(skillDir)).rejects.toThrow('missing required field');
    });
  });

  describe('loadSkill', () => {
    beforeEach(async () => {
      // Create test skill
      const skillDir = path.join(skillsDir, 'my-skill');
      await fs.promises.mkdir(skillDir);
      
      const metadata = {
        name: 'my-skill',
        version: '1.0.0',
        description: 'My test skill'
      };
      
      await fs.promises.writeFile(
        path.join(skillDir, 'metadata.json'),
        JSON.stringify(metadata),
        'utf8'
      );
    });

    it('should load skill from source', async () => {
      const skill = await loadSkill(skillsDir, 'my-skill');
      
      expect(skill).toBeDefined();
      expect(skill.name).toBe('my-skill');
      expect(skill.version).toBe('1.0.0');
      expect(skill.path).toBe(path.join(skillsDir, 'my-skill'));
      expect(skill.source).toBe(skillsDir);
    });

    it('should return null if skill not found', async () => {
      const skill = await loadSkill(skillsDir, 'nonexistent');
      expect(skill).toBeNull();
    });

    it('should return null if version does not match', async () => {
      const skill = await loadSkill(skillsDir, 'my-skill', '2.0.0');
      expect(skill).toBeNull();
    });

    it('should load skill with matching version', async () => {
      const skill = await loadSkill(skillsDir, 'my-skill', '1.0.0');
      
      expect(skill).toBeDefined();
      expect(skill.version).toBe('1.0.0');
    });
  });

  describe('skillExists', () => {
    beforeEach(async () => {
      // Create test skill
      const skillDir = path.join(skillsDir, 'existing-skill');
      await fs.promises.mkdir(skillDir);
    });

    it('should return true if skill exists', async () => {
      const exists = await skillExists(skillsDir, 'existing-skill');
      expect(exists).toBe(true);
    });

    it('should return false if skill does not exist', async () => {
      const exists = await skillExists(skillsDir, 'nonexistent');
      expect(exists).toBe(false);
    });

    it('should return false if path is a file not directory', async () => {
      await fs.promises.writeFile(path.join(skillsDir, 'file.txt'), 'test');
      
      const exists = await skillExists(skillsDir, 'file.txt');
      expect(exists).toBe(false);
    });
  });

  describe('listAvailableSkills', () => {
    beforeEach(async () => {
      // Create multiple test skills
      const skills = [
        { name: 'skill-a', version: '1.0.0', description: 'Skill A' },
        { name: 'skill-b', version: '2.0.0', description: 'Skill B' },
        { name: 'skill-c', version: '1.5.0', description: 'Skill C' }
      ];
      
      for (const skill of skills) {
        const skillDir = path.join(skillsDir, skill.name);
        await fs.promises.mkdir(skillDir);
        await fs.promises.writeFile(
          path.join(skillDir, 'metadata.json'),
          JSON.stringify(skill),
          'utf8'
        );
      }
    });

    it('should list all available skills', async () => {
      const skills = await listAvailableSkills(skillsDir);
      
      expect(skills).toHaveLength(3);
      expect(skills.map(s => s.name)).toContain('skill-a');
      expect(skills.map(s => s.name)).toContain('skill-b');
      expect(skills.map(s => s.name)).toContain('skill-c');
    });

    it('should return empty array if source does not exist', async () => {
      const skills = await listAvailableSkills(path.join(testDir, 'nonexistent'));
      expect(skills).toEqual([]);
    });

    it('should skip skills with invalid metadata', async () => {
      // Create skill with invalid metadata
      const invalidDir = path.join(skillsDir, 'invalid');
      await fs.promises.mkdir(invalidDir);
      await fs.promises.writeFile(
        path.join(invalidDir, 'metadata.json'),
        'invalid json',
        'utf8'
      );
      
      const skills = await listAvailableSkills(skillsDir);
      expect(skills).toHaveLength(3); // Should skip the invalid one
    });
  });

  describe('searchSkills', () => {
    beforeEach(async () => {
      // Create test skills with tags
      const skills = [
        {
          name: 'auth-skill',
          version: '1.0.0',
          description: 'Authentication utilities',
          tags: ['auth', 'security']
        },
        {
          name: 'data-skill',
          version: '1.0.0',
          description: 'Data processing tools',
          tags: ['data', 'processing']
        },
        {
          name: 'security-helper',
          version: '1.0.0',
          description: 'Security helpers',
          tags: ['security', 'crypto']
        }
      ];
      
      for (const skill of skills) {
        const skillDir = path.join(skillsDir, skill.name);
        await fs.promises.mkdir(skillDir);
        await fs.promises.writeFile(
          path.join(skillDir, 'metadata.json'),
          JSON.stringify(skill),
          'utf8'
        );
      }
    });

    it('should find skills by name', async () => {
      const results = await searchSkills('auth', skillsDir);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('auth-skill');
    });

    it('should find skills by description', async () => {
      const results = await searchSkills('processing', skillsDir);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('data-skill');
    });

    it('should find skills by tags', async () => {
      const results = await searchSkills('security', skillsDir);
      expect(results).toHaveLength(2);
      expect(results.map(s => s.name)).toContain('auth-skill');
      expect(results.map(s => s.name)).toContain('security-helper');
    });

    it('should return empty array if no matches', async () => {
      const results = await searchSkills('nonexistent', skillsDir);
      expect(results).toEqual([]);
    });

    it('should be case insensitive', async () => {
      const results = await searchSkills('AUTH', skillsDir);
      expect(results).toHaveLength(1);
    });
  });

  describe('getSkillVersions', () => {
    beforeEach(async () => {
      // Create test skill
      const skillDir = path.join(skillsDir, 'versioned-skill');
      await fs.promises.mkdir(skillDir);
      
      const metadata = {
        name: 'versioned-skill',
        version: '1.2.3',
        description: 'Test skill'
      };
      
      await fs.promises.writeFile(
        path.join(skillDir, 'metadata.json'),
        JSON.stringify(metadata),
        'utf8'
      );
    });

    it('should return available versions', async () => {
      const versions = await getSkillVersions(skillsDir, 'versioned-skill');
      expect(versions).toEqual(['1.2.3']);
    });

    it('should return empty array if skill not found', async () => {
      const versions = await getSkillVersions(skillsDir, 'nonexistent');
      expect(versions).toEqual([]);
    });
  });

  describe('validateSkillStructure', () => {
    it('should validate correct skill structure', async () => {
      const skillDir = path.join(skillsDir, 'valid-skill');
      await fs.promises.mkdir(skillDir);
      
      const metadata = {
        name: 'valid-skill',
        version: '1.0.0',
        description: 'Valid skill',
        author: 'Test Author',
        tags: ['test'],
        dependencies: []
      };
      
      await fs.promises.writeFile(
        path.join(skillDir, 'metadata.json'),
        JSON.stringify(metadata),
        'utf8'
      );
      
      await fs.promises.writeFile(
        path.join(skillDir, 'README.md'),
        '# Valid Skill',
        'utf8'
      );
      
      const result = await validateSkillStructure(skillDir);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required files', async () => {
      const skillDir = path.join(skillsDir, 'incomplete-skill');
      await fs.promises.mkdir(skillDir);
      
      const result = await validateSkillStructure(skillDir);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('metadata.json'))).toBe(true);
    });

    it('should warn about missing recommended files', async () => {
      const skillDir = path.join(skillsDir, 'no-readme');
      await fs.promises.mkdir(skillDir);
      
      const metadata = {
        name: 'no-readme',
        version: '1.0.0',
        description: 'No README'
      };
      
      await fs.promises.writeFile(
        path.join(skillDir, 'metadata.json'),
        JSON.stringify(metadata),
        'utf8'
      );
      
      const result = await validateSkillStructure(skillDir);
      
      expect(result.warnings.some(w => w.includes('README.md'))).toBe(true);
    });

    it('should return error if path is not a directory', async () => {
      const filePath = path.join(skillsDir, 'file.txt');
      await fs.promises.writeFile(filePath, 'test');
      
      const result = await validateSkillStructure(filePath);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('not a directory'))).toBe(true);
    });
  });

  describe('copySkillFiles', () => {
    it('should copy all skill files', async () => {
      const sourceDir = path.join(skillsDir, 'source-skill');
      const targetDir = path.join(testDir, 'target-skill');
      
      await fs.promises.mkdir(sourceDir);
      await fs.promises.writeFile(path.join(sourceDir, 'file1.txt'), 'content1');
      await fs.promises.writeFile(path.join(sourceDir, 'file2.txt'), 'content2');
      
      const copiedFiles = await copySkillFiles(sourceDir, targetDir);
      
      expect(copiedFiles).toHaveLength(2);
      expect(fs.existsSync(path.join(targetDir, 'file1.txt'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'file2.txt'))).toBe(true);
    });

    it('should copy subdirectories recursively', async () => {
      const sourceDir = path.join(skillsDir, 'source-skill');
      const targetDir = path.join(testDir, 'target-skill');
      
      await fs.promises.mkdir(sourceDir);
      await fs.promises.mkdir(path.join(sourceDir, 'subdir'));
      await fs.promises.writeFile(path.join(sourceDir, 'file1.txt'), 'content1');
      await fs.promises.writeFile(path.join(sourceDir, 'subdir', 'file2.txt'), 'content2');
      
      const copiedFiles = await copySkillFiles(sourceDir, targetDir);
      
      expect(copiedFiles).toHaveLength(2);
      expect(fs.existsSync(path.join(targetDir, 'file1.txt'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'subdir', 'file2.txt'))).toBe(true);
    });
  });

  describe('getSkillImportSummary', () => {
    it('should generate summary for skill', () => {
      const skill = {
        name: 'test-skill',
        version: '1.0.0',
        description: 'Test skill',
        author: 'Test Author',
        dependencies: ['dep1', 'dep2'],
        tags: ['test', 'example']
      };
      
      const summary = getSkillImportSummary(skill, {
        source: 'global',
        override: true
      });
      
      expect(summary.name).toBe('test-skill');
      expect(summary.version).toBe('1.0.0');
      expect(summary.source).toBe('global');
      expect(summary.override).toBe(true);
      expect(summary.dependencies).toEqual(['dep1', 'dep2']);
      expect(summary.tags).toEqual(['test', 'example']);
    });

    it('should handle missing optional fields', () => {
      const skill = {
        name: 'minimal-skill',
        version: '1.0.0',
        description: 'Minimal skill'
      };
      
      const summary = getSkillImportSummary(skill);
      
      expect(summary.author).toBe('Unknown');
      expect(summary.dependencies).toEqual([]);
      expect(summary.tags).toEqual([]);
      expect(summary.override).toBe(false);
    });
  });
});


