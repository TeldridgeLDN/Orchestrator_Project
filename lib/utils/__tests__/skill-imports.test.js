/**
 * @fileoverview Tests for Skill Import Management Utilities
 * @module lib/utils/__tests__/skill-imports.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  loadProjectMetadata,
  saveProjectMetadata,
  ensureImportsSection,
  getImportedSkills,
  getImportedSkill,
  isSkillImported,
  addSkillImport,
  updateSkillImport,
  removeSkillImport,
  getSkillDependencies,
  getSkillDependents,
  validateSkillImport,
  getImportStatistics
} from '../skill-imports.js';

describe('Skill Import Management', () => {
  let testDir;
  let testProjectPath;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'skill-imports-test-'));
    testProjectPath = testDir;

    // Create .claude directory
    const claudeDir = path.join(testProjectPath, '.claude');
    await fs.promises.mkdir(claudeDir, { recursive: true });

    // Create default metadata.json
    const metadata = {
      name: 'test-project',
      version: '1.0.0',
      description: 'Test project',
      created: new Date().toISOString(),
      diet103_version: '1.0.0',
      tags: [],
      settings: {
        auto_validate: true,
        health_tracking: true
      },
      imports: {
        skills: []
      }
    };

    await fs.promises.writeFile(
      path.join(claudeDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf8'
    );
  });

  afterEach(async () => {
    // Clean up test directory
    if (testDir) {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    }
  });

  describe('loadProjectMetadata', () => {
    it('should load metadata from file', async () => {
      const metadata = await loadProjectMetadata(testProjectPath);
      expect(metadata).toBeDefined();
      expect(metadata.name).toBe('test-project');
      expect(metadata.imports).toBeDefined();
    });

    it('should throw error if metadata file not found', async () => {
      const invalidPath = path.join(testDir, 'nonexistent');
      await expect(loadProjectMetadata(invalidPath)).rejects.toThrow();
    });

    it('should throw error if metadata is invalid JSON', async () => {
      const metadataPath = path.join(testProjectPath, '.claude', 'metadata.json');
      await fs.promises.writeFile(metadataPath, 'invalid json', 'utf8');
      await expect(loadProjectMetadata(testProjectPath)).rejects.toThrow();
    });
  });

  describe('saveProjectMetadata', () => {
    it('should save metadata to file', async () => {
      const metadata = await loadProjectMetadata(testProjectPath);
      metadata.name = 'updated-project';
      
      await saveProjectMetadata(testProjectPath, metadata);
      
      const loaded = await loadProjectMetadata(testProjectPath);
      expect(loaded.name).toBe('updated-project');
    });

    it('should format JSON with proper indentation', async () => {
      const metadata = await loadProjectMetadata(testProjectPath);
      await saveProjectMetadata(testProjectPath, metadata);
      
      const content = await fs.promises.readFile(
        path.join(testProjectPath, '.claude', 'metadata.json'),
        'utf8'
      );
      expect(content).toContain('  '); // Should have 2-space indentation
    });
  });

  describe('ensureImportsSection', () => {
    it('should add imports section if missing', () => {
      const metadata = { name: 'test' };
      const result = ensureImportsSection(metadata);
      
      expect(result.imports).toBeDefined();
      expect(result.imports.skills).toEqual([]);
    });

    it('should initialize skills array if missing', () => {
      const metadata = { name: 'test', imports: {} };
      const result = ensureImportsSection(metadata);
      
      expect(result.imports.skills).toEqual([]);
    });

    it('should not modify existing imports section', () => {
      const metadata = {
        name: 'test',
        imports: {
          skills: [{ name: 'existing' }]
        }
      };
      const result = ensureImportsSection(metadata);
      
      expect(result.imports.skills).toHaveLength(1);
      expect(result.imports.skills[0].name).toBe('existing');
    });
  });

  describe('getImportedSkills', () => {
    it('should return empty array when no skills imported', async () => {
      const skills = await getImportedSkills(testProjectPath);
      expect(skills).toEqual([]);
    });

    it('should return all imported skills', async () => {
      const metadata = await loadProjectMetadata(testProjectPath);
      metadata.imports.skills = [
        { name: 'skill1', source: 'global', version: '1.0.0', importedAt: new Date().toISOString() },
        { name: 'skill2', source: 'global', version: '2.0.0', importedAt: new Date().toISOString() }
      ];
      await saveProjectMetadata(testProjectPath, metadata);
      
      const skills = await getImportedSkills(testProjectPath);
      expect(skills).toHaveLength(2);
      expect(skills[0].name).toBe('skill1');
      expect(skills[1].name).toBe('skill2');
    });
  });

  describe('getImportedSkill', () => {
    beforeEach(async () => {
      const metadata = await loadProjectMetadata(testProjectPath);
      metadata.imports.skills = [
        { name: 'test-skill', source: 'global', version: '1.0.0', importedAt: new Date().toISOString() }
      ];
      await saveProjectMetadata(testProjectPath, metadata);
    });

    it('should return skill by name', async () => {
      const skill = await getImportedSkill(testProjectPath, 'test-skill');
      expect(skill).toBeDefined();
      expect(skill.name).toBe('test-skill');
    });

    it('should return null if skill not found', async () => {
      const skill = await getImportedSkill(testProjectPath, 'nonexistent');
      expect(skill).toBeNull();
    });
  });

  describe('isSkillImported', () => {
    beforeEach(async () => {
      const metadata = await loadProjectMetadata(testProjectPath);
      metadata.imports.skills = [
        { name: 'imported-skill', source: 'global', version: '1.0.0', importedAt: new Date().toISOString() }
      ];
      await saveProjectMetadata(testProjectPath, metadata);
    });

    it('should return true for imported skill', async () => {
      const result = await isSkillImported(testProjectPath, 'imported-skill');
      expect(result).toBe(true);
    });

    it('should return false for non-imported skill', async () => {
      const result = await isSkillImported(testProjectPath, 'nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('addSkillImport', () => {
    it('should add new skill import', async () => {
      const skillImport = {
        name: 'new-skill',
        source: 'global',
        version: '1.0.0'
      };
      
      await addSkillImport(testProjectPath, skillImport);
      
      const skills = await getImportedSkills(testProjectPath);
      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('new-skill');
      expect(skills[0].importedAt).toBeDefined();
      expect(skills[0].override).toBe(false);
      expect(skills[0].dependencies).toEqual([]);
    });

    it('should replace existing skill import', async () => {
      // Add initial import
      await addSkillImport(testProjectPath, {
        name: 'test-skill',
        source: 'global',
        version: '1.0.0'
      });
      
      // Replace with new version
      await addSkillImport(testProjectPath, {
        name: 'test-skill',
        source: 'global',
        version: '2.0.0'
      });
      
      const skills = await getImportedSkills(testProjectPath);
      expect(skills).toHaveLength(1);
      expect(skills[0].version).toBe('2.0.0');
    });

    it('should preserve custom importedAt if provided', async () => {
      const customDate = '2025-01-01T00:00:00.000Z';
      await addSkillImport(testProjectPath, {
        name: 'test-skill',
        source: 'global',
        version: '1.0.0',
        importedAt: customDate
      });
      
      const skill = await getImportedSkill(testProjectPath, 'test-skill');
      expect(skill.importedAt).toBe(customDate);
    });

    it('should support override flag', async () => {
      await addSkillImport(testProjectPath, {
        name: 'test-skill',
        source: 'global',
        version: '1.0.0',
        override: true
      });
      
      const skill = await getImportedSkill(testProjectPath, 'test-skill');
      expect(skill.override).toBe(true);
    });

    it('should support dependencies', async () => {
      await addSkillImport(testProjectPath, {
        name: 'test-skill',
        source: 'global',
        version: '1.0.0',
        dependencies: ['dep1', 'dep2']
      });
      
      const skill = await getImportedSkill(testProjectPath, 'test-skill');
      expect(skill.dependencies).toEqual(['dep1', 'dep2']);
    });

    it('should throw error if missing required fields', async () => {
      await expect(
        addSkillImport(testProjectPath, { name: 'test' })
      ).rejects.toThrow('Missing required field');
    });
  });

  describe('updateSkillImport', () => {
    beforeEach(async () => {
      await addSkillImport(testProjectPath, {
        name: 'test-skill',
        source: 'global',
        version: '1.0.0'
      });
    });

    it('should update skill import fields', async () => {
      await updateSkillImport(testProjectPath, 'test-skill', {
        version: '2.0.0',
        override: true
      });
      
      const skill = await getImportedSkill(testProjectPath, 'test-skill');
      expect(skill.version).toBe('2.0.0');
      expect(skill.override).toBe(true);
    });

    it('should throw error if skill not found', async () => {
      await expect(
        updateSkillImport(testProjectPath, 'nonexistent', { version: '2.0.0' })
      ).rejects.toThrow('Skill import not found');
    });
  });

  describe('removeSkillImport', () => {
    beforeEach(async () => {
      await addSkillImport(testProjectPath, {
        name: 'test-skill',
        source: 'global',
        version: '1.0.0'
      });
    });

    it('should remove skill import', async () => {
      await removeSkillImport(testProjectPath, 'test-skill');
      
      const skills = await getImportedSkills(testProjectPath);
      expect(skills).toHaveLength(0);
    });

    it('should throw error if skill not found', async () => {
      await expect(
        removeSkillImport(testProjectPath, 'nonexistent')
      ).rejects.toThrow('Skill import not found');
    });
  });

  describe('getSkillDependencies', () => {
    it('should return dependencies for skill', async () => {
      await addSkillImport(testProjectPath, {
        name: 'test-skill',
        source: 'global',
        version: '1.0.0',
        dependencies: ['dep1', 'dep2']
      });
      
      const deps = await getSkillDependencies(testProjectPath, 'test-skill');
      expect(deps).toEqual(['dep1', 'dep2']);
    });

    it('should return empty array if no dependencies', async () => {
      await addSkillImport(testProjectPath, {
        name: 'test-skill',
        source: 'global',
        version: '1.0.0'
      });
      
      const deps = await getSkillDependencies(testProjectPath, 'test-skill');
      expect(deps).toEqual([]);
    });

    it('should return empty array if skill not found', async () => {
      const deps = await getSkillDependencies(testProjectPath, 'nonexistent');
      expect(deps).toEqual([]);
    });
  });

  describe('getSkillDependents', () => {
    beforeEach(async () => {
      await addSkillImport(testProjectPath, {
        name: 'base-skill',
        source: 'global',
        version: '1.0.0'
      });
      
      await addSkillImport(testProjectPath, {
        name: 'dependent-skill-1',
        source: 'global',
        version: '1.0.0',
        dependencies: ['base-skill']
      });
      
      await addSkillImport(testProjectPath, {
        name: 'dependent-skill-2',
        source: 'global',
        version: '1.0.0',
        dependencies: ['base-skill', 'other-skill']
      });
    });

    it('should return all skills that depend on target skill', async () => {
      const dependents = await getSkillDependents(testProjectPath, 'base-skill');
      expect(dependents).toHaveLength(2);
      expect(dependents).toContain('dependent-skill-1');
      expect(dependents).toContain('dependent-skill-2');
    });

    it('should return empty array if no dependents', async () => {
      const dependents = await getSkillDependents(testProjectPath, 'dependent-skill-1');
      expect(dependents).toEqual([]);
    });
  });

  describe('validateSkillImport', () => {
    it('should validate correct skill import', () => {
      const skillImport = {
        name: 'test-skill',
        source: 'global',
        version: '1.0.0',
        importedAt: '2025-11-12T00:00:00.000Z',
        override: false,
        dependencies: ['dep1']
      };
      
      const result = validateSkillImport(skillImport);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const skillImport = {
        name: 'test-skill',
        source: 'global'
      };
      
      const result = validateSkillImport(skillImport);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('version'))).toBe(true);
      expect(result.errors.some(e => e.includes('importedAt'))).toBe(true);
    });

    it('should validate version format', () => {
      const skillImport = {
        name: 'test-skill',
        source: 'global',
        version: 'invalid',
        importedAt: '2025-11-12T00:00:00.000Z'
      };
      
      const result = validateSkillImport(skillImport);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('semantic versioning'))).toBe(true);
    });

    it('should validate importedAt format', () => {
      const skillImport = {
        name: 'test-skill',
        source: 'global',
        version: '1.0.0',
        importedAt: 'invalid-date'
      };
      
      const result = validateSkillImport(skillImport);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('ISO 8601'))).toBe(true);
    });

    it('should validate override type', () => {
      const skillImport = {
        name: 'test-skill',
        source: 'global',
        version: '1.0.0',
        importedAt: '2025-11-12T00:00:00.000Z',
        override: 'not-a-boolean'
      };
      
      const result = validateSkillImport(skillImport);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('override must be a boolean'))).toBe(true);
    });

    it('should validate dependencies type', () => {
      const skillImport = {
        name: 'test-skill',
        source: 'global',
        version: '1.0.0',
        importedAt: '2025-11-12T00:00:00.000Z',
        dependencies: 'not-an-array'
      };
      
      const result = validateSkillImport(skillImport);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('dependencies must be an array'))).toBe(true);
    });

    it('should validate dependencies array contents', () => {
      const skillImport = {
        name: 'test-skill',
        source: 'global',
        version: '1.0.0',
        importedAt: '2025-11-12T00:00:00.000Z',
        dependencies: ['valid', 123, 'also-valid']
      };
      
      const result = validateSkillImport(skillImport);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('dependencies[1] must be a string'))).toBe(true);
    });
  });

  describe('getImportStatistics', () => {
    beforeEach(async () => {
      await addSkillImport(testProjectPath, {
        name: 'skill1',
        source: 'global',
        version: '1.0.0'
      });
      
      await addSkillImport(testProjectPath, {
        name: 'skill2',
        source: 'global',
        version: '1.0.0',
        override: true
      });
      
      await addSkillImport(testProjectPath, {
        name: 'skill3',
        source: '/custom/path',
        version: '1.0.0',
        dependencies: ['skill1', 'skill2']
      });
    });

    it('should return correct statistics', async () => {
      const stats = await getImportStatistics(testProjectPath);
      
      expect(stats.total).toBe(3);
      expect(stats.bySource['global']).toBe(2);
      expect(stats.bySource['/custom/path']).toBe(1);
      expect(stats.withOverrides).toBe(1);
      expect(stats.withDependencies).toBe(1);
      expect(stats.totalDependencies).toBe(2);
    });

    it('should return empty statistics for no imports', async () => {
      // Remove all imports
      await removeSkillImport(testProjectPath, 'skill1');
      await removeSkillImport(testProjectPath, 'skill2');
      await removeSkillImport(testProjectPath, 'skill3');
      
      const stats = await getImportStatistics(testProjectPath);
      
      expect(stats.total).toBe(0);
      expect(stats.bySource).toEqual({});
      expect(stats.withOverrides).toBe(0);
      expect(stats.withDependencies).toBe(0);
      expect(stats.totalDependencies).toBe(0);
    });
  });
});


