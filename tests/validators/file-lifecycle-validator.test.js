/**
 * Tests for File Lifecycle Validation System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  isInExpectedLocation,
  detectMisplacedFiles,
  suggestCorrectLocation,
  calculateOrganizationScore,
  validateDirectoryStructure,
  generateAutoRepairActions
} from '../../lib/validators/file-lifecycle-validator.js';

describe('File Lifecycle Validator', () => {
  describe('isInExpectedLocation', () => {
    it('should identify correctly placed CRITICAL files', () => {
      expect(isInExpectedLocation('.taskmaster/config.json', 'CRITICAL')).toBe(true);
      expect(isInExpectedLocation('.claude/metadata.json', 'CRITICAL')).toBe(true);
      expect(isInExpectedLocation('package.json', 'CRITICAL')).toBe(true);
      expect(isInExpectedLocation('lib/schemas/test.json', 'CRITICAL')).toBe(true);
    });

    it('should identify correctly placed PERMANENT files', () => {
      expect(isInExpectedLocation('docs/core/README.md', 'PERMANENT')).toBe(true);
      expect(isInExpectedLocation('docs/impl/guide.md', 'PERMANENT')).toBe(true);
      expect(isInExpectedLocation('README.md', 'PERMANENT')).toBe(true);
      expect(isInExpectedLocation('Docs/architecture.md', 'PERMANENT')).toBe(true);
    });

    it('should identify correctly placed EPHEMERAL files', () => {
      expect(isInExpectedLocation('docs/sessions/session.md', 'EPHEMERAL')).toBe(true);
      expect(isInExpectedLocation('.taskmaster/reports/report.json', 'EPHEMERAL')).toBe(true);
      expect(isInExpectedLocation('tests/fixtures/data.yaml', 'EPHEMERAL')).toBe(true);
    });

    it('should identify misplaced files', () => {
      expect(isInExpectedLocation('random/config.json', 'CRITICAL')).toBe(false);
      expect(isInExpectedLocation('temp/docs.md', 'PERMANENT')).toBe(false);
      expect(isInExpectedLocation('wrong/location/session.md', 'EPHEMERAL')).toBe(false);
    });
  });

  describe('detectMisplacedFiles', () => {
    it('should detect no misplaced files in well-organized manifest', () => {
      const manifest = {
        files: {
          'package.json': { tier: 'CRITICAL', status: 'active' },
          'README.md': { tier: 'PERMANENT', status: 'active' },
          'docs/sessions/log.md': { tier: 'EPHEMERAL', status: 'active' }
        }
      };

      const misplaced = detectMisplacedFiles(manifest);
      expect(misplaced).toHaveLength(0);
    });

    it('should detect misplaced files', () => {
      const manifest = {
        files: {
          'wrong/location/config.json': { tier: 'CRITICAL', status: 'active' },
          'temp/guide.md': { tier: 'PERMANENT', status: 'active' },
          'random/session.md': { tier: 'EPHEMERAL', status: 'active' }
        }
      };

      const misplaced = detectMisplacedFiles(manifest);
      expect(misplaced).toHaveLength(3);
      expect(misplaced[0].path).toBe('wrong/location/config.json');
      expect(misplaced[0].tier).toBe('CRITICAL');
      expect(misplaced[0].suggestedMove).toBeDefined();
    });

    it('should skip archived files', () => {
      const manifest = {
        files: {
          'wrong/location/old.md': { tier: 'PERMANENT', status: 'archived' }
        }
      };

      const misplaced = detectMisplacedFiles(manifest);
      expect(misplaced).toHaveLength(0);
    });

    it('should handle empty manifest', () => {
      const misplaced = detectMisplacedFiles(null);
      expect(misplaced).toHaveLength(0);
    });
  });

  describe('suggestCorrectLocation', () => {
    it('should suggest correct location for CRITICAL files', () => {
      const suggestion = suggestCorrectLocation('wrong/config.json', 'CRITICAL');
      expect(suggestion).toBe('.taskmaster/config.json');
    });

    it('should suggest correct location for PERMANENT files', () => {
      const suggestion = suggestCorrectLocation('temp/guide.md', 'PERMANENT');
      expect(suggestion).toBe('docs/core/guide.md');
    });

    it('should suggest correct location for EPHEMERAL files', () => {
      const suggestion = suggestCorrectLocation('wrong/session.md', 'EPHEMERAL');
      expect(suggestion).toBe('docs/sessions/session.md');
    });

    it('should handle files in root when appropriate', () => {
      const suggestion = suggestCorrectLocation('package.json', 'CRITICAL');
      expect(suggestion).toBe('package.json');
    });
  });

  describe('calculateOrganizationScore', () => {
    it('should return 100% for perfectly organized manifest', () => {
      const manifest = {
        files: {
          'package.json': { tier: 'CRITICAL', status: 'active' },
          'README.md': { tier: 'PERMANENT', status: 'active' },
          'docs/sessions/log.md': { tier: 'EPHEMERAL', status: 'active' }
        }
      };

      const score = calculateOrganizationScore(manifest);
      expect(score.score).toBe(100);
      expect(score.percentage).toBe(100);
      expect(score.totalFiles).toBe(3);
      expect(score.correctlyPlaced).toBe(3);
      expect(score.misplaced).toBe(0);
    });

    it('should calculate correct score for partially organized manifest', () => {
      const manifest = {
        files: {
          'package.json': { tier: 'CRITICAL', status: 'active' },
          'wrong/config.json': { tier: 'CRITICAL', status: 'active' },
          'README.md': { tier: 'PERMANENT', status: 'active' },
          'temp/guide.md': { tier: 'PERMANENT', status: 'active' }
        }
      };

      const score = calculateOrganizationScore(manifest);
      expect(score.score).toBe(50); // 2 out of 4 files correctly placed
      expect(score.totalFiles).toBe(4);
      expect(score.correctlyPlaced).toBe(2);
      expect(score.misplaced).toBe(2);
    });

    it('should provide tier breakdown', () => {
      const manifest = {
        files: {
          'package.json': { tier: 'CRITICAL', status: 'active' },
          'wrong/config.json': { tier: 'CRITICAL', status: 'active' },
          'README.md': { tier: 'PERMANENT', status: 'active' }
        }
      };

      const score = calculateOrganizationScore(manifest);
      expect(score.tierBreakdown.CRITICAL).toEqual({
        total: 2,
        correctlyPlaced: 1,
        misplaced: 1,
        percentage: 50
      });
      expect(score.tierBreakdown.PERMANENT).toEqual({
        total: 1,
        correctlyPlaced: 1,
        misplaced: 0,
        percentage: 100
      });
    });

    it('should include misplaced file details', () => {
      const manifest = {
        files: {
          'wrong/config.json': { tier: 'CRITICAL', status: 'active' }
        }
      };

      const score = calculateOrganizationScore(manifest);
      expect(score.misplacedFiles).toHaveLength(1);
      expect(score.misplacedFiles[0].path).toBe('wrong/config.json');
      expect(score.misplacedFiles[0].tier).toBe('CRITICAL');
      expect(score.misplacedFiles[0].suggestedMove).toBeDefined();
    });

    it('should handle empty manifest', () => {
      const score = calculateOrganizationScore(null);
      expect(score.score).toBe(0);
      expect(score.totalFiles).toBe(0);
      expect(score.details).toBeDefined();
    });
  });

  describe('generateAutoRepairActions', () => {
    it('should generate directory creation actions', () => {
      const validationResults = {
        directoryStructure: {
          missingDirectories: [
            { path: 'docs/core', description: 'Core docs' },
            { path: 'docs/archive', description: 'Archive' }
          ]
        },
        organizationScore: {
          misplacedFiles: []
        }
      };

      const actions = generateAutoRepairActions(validationResults);
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('create_directories');
      expect(actions[0].priority).toBe('high');
      expect(actions[0].directories).toEqual(['docs/core', 'docs/archive']);
      expect(actions[0].automated).toBe(true);
    });

    it('should generate file move actions', () => {
      const validationResults = {
        directoryStructure: {
          missingDirectories: []
        },
        organizationScore: {
          misplacedFiles: [
            { path: 'wrong/config.json', tier: 'CRITICAL', suggestedMove: '.taskmaster/config.json' },
            { path: 'temp/guide.md', tier: 'PERMANENT', suggestedMove: 'docs/core/guide.md' }
          ]
        }
      };

      const actions = generateAutoRepairActions(validationResults);
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('move_files');
      expect(actions[0].priority).toBe('medium');
      expect(actions[0].moves).toHaveLength(2);
      expect(actions[0].automated).toBe(false);
      expect(actions[0].dryRunRecommended).toBe(true);
    });

    it('should generate both types of actions when needed', () => {
      const validationResults = {
        directoryStructure: {
          missingDirectories: [
            { path: 'docs/core', description: 'Core docs' }
          ]
        },
        organizationScore: {
          misplacedFiles: [
            { path: 'wrong/config.json', tier: 'CRITICAL', suggestedMove: '.taskmaster/config.json' }
          ]
        }
      };

      const actions = generateAutoRepairActions(validationResults);
      expect(actions).toHaveLength(2);
      expect(actions[0].type).toBe('create_directories');
      expect(actions[1].type).toBe('move_files');
    });

    it('should return empty array when no repairs needed', () => {
      const validationResults = {
        directoryStructure: {
          missingDirectories: []
        },
        organizationScore: {
          misplacedFiles: []
        }
      };

      const actions = generateAutoRepairActions(validationResults);
      expect(actions).toHaveLength(0);
    });
  });
});

