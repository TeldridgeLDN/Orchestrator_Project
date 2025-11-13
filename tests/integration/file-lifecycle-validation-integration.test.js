/**
 * Integration Tests for File Lifecycle Validation System
 * 
 * Tests the complete validation workflow including:
 * - Loading real manifests
 * - Directory structure validation
 * - Full validation reports
 * - Auto-repair action generation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import {
  loadManifest,
  validateDirectoryStructure,
  validateFileLifecycle,
  generateAutoRepairActions
} from '../../lib/validators/file-lifecycle-validator.js';

const TEST_PROJECT_ROOT = path.join(process.cwd(), 'tests', 'fixtures', 'test-project');

describe('File Lifecycle Validation Integration', () => {
  beforeEach(async () => {
    // Create test project structure
    await fs.mkdir(TEST_PROJECT_ROOT, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test project
    await fs.rm(TEST_PROJECT_ROOT, { recursive: true, force: true });
  });

  describe('loadManifest', () => {
    it('should load and parse real manifest file', async () => {
      // Create a test manifest
      const manifestData = {
        version: '1.0',
        project: 'test-project',
        initialized: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        statistics: {
          total_files: 2,
          by_tier: { CRITICAL: 1, PERMANENT: 1, EPHEMERAL: 0, ARCHIVED: 0 },
          pending_archive: 0,
          misplaced: 0
        },
        files: {
          'package.json': { tier: 'CRITICAL', status: 'active' },
          'README.md': { tier: 'PERMANENT', status: 'active' }
        },
        settings: {
          ephemeral_expiration_days: 60,
          archive_retention_days: 90,
          auto_organize: false,
          confidence_threshold: 0.8
        }
      };

      await fs.writeFile(
        path.join(TEST_PROJECT_ROOT, '.file-manifest.json'),
        JSON.stringify(manifestData, null, 2)
      );

      const manifest = await loadManifest(TEST_PROJECT_ROOT);
      expect(manifest).toBeDefined();
      expect(manifest.project).toBe('test-project');
      expect(manifest.files['package.json']).toBeDefined();
      expect(manifest.statistics.total_files).toBe(2);
    });

    it('should return null for non-existent manifest', async () => {
      const manifest = await loadManifest(TEST_PROJECT_ROOT);
      expect(manifest).toBeNull();
    });

    it('should throw error for invalid JSON manifest', async () => {
      await fs.writeFile(
        path.join(TEST_PROJECT_ROOT, '.file-manifest.json'),
        'invalid json content'
      );

      await expect(loadManifest(TEST_PROJECT_ROOT)).rejects.toThrow();
    });
  });

  describe('validateDirectoryStructure', () => {
    it('should detect missing directories in new project', async () => {
      const result = await validateDirectoryStructure(TEST_PROJECT_ROOT);
      
      expect(result.compliant).toBe(false);
      expect(result.missingDirectories.length).toBeGreaterThan(0);
      expect(result.missingDirectories.some(d => d.path === 'docs')).toBe(true);
      expect(result.missingDirectories.some(d => d.path === 'lib')).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should validate compliant directory structure', async () => {
      // Create UFC-compliant structure
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'docs', 'core'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'docs', 'impl'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'docs', 'sessions'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'docs', 'archive'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'lib'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'tests'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'templates'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, '.claude'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, '.taskmaster'), { recursive: true });

      const result = await validateDirectoryStructure(TEST_PROJECT_ROOT);
      
      expect(result.compliant).toBe(true);
      expect(result.missingDirectories).toHaveLength(0);
      expect(result.recommendations).toHaveLength(0);
    });

    it('should detect when expected directory is a file', async () => {
      // Create a file where a directory should be
      await fs.writeFile(path.join(TEST_PROJECT_ROOT, 'docs'), 'this should be a directory');

      const result = await validateDirectoryStructure(TEST_PROJECT_ROOT);
      
      expect(result.compliant).toBe(false);
      expect(result.unexpectedStructure.length).toBeGreaterThan(0);
      expect(result.unexpectedStructure[0].path).toBe('docs');
      expect(result.unexpectedStructure[0].issue).toContain('Expected directory');
    });
  });

  describe('validateFileLifecycle - Full Integration', () => {
    it('should provide comprehensive validation report for well-organized project', async () => {
      // Setup compliant structure
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'docs', 'core'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'docs', 'impl'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'docs', 'sessions'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'docs', 'archive'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'lib'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'tests'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'templates'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, '.claude'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, '.taskmaster'), { recursive: true });

      // Create well-organized manifest
      const manifestData = {
        version: '1.0',
        project: 'test-project',
        initialized: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        statistics: {
          total_files: 3,
          by_tier: { CRITICAL: 1, PERMANENT: 2, EPHEMERAL: 0, ARCHIVED: 0 },
          pending_archive: 0,
          misplaced: 0
        },
        files: {
          'package.json': { tier: 'CRITICAL', status: 'active' },
          'docs/core/README.md': { tier: 'PERMANENT', status: 'active' },
          'docs/impl/guide.md': { tier: 'PERMANENT', status: 'active' }
        },
        settings: {
          ephemeral_expiration_days: 60,
          archive_retention_days: 90,
          auto_organize: false,
          confidence_threshold: 0.8
        }
      };

      await fs.writeFile(
        path.join(TEST_PROJECT_ROOT, '.file-manifest.json'),
        JSON.stringify(manifestData, null, 2)
      );

      const result = await validateFileLifecycle(TEST_PROJECT_ROOT);
      
      expect(result.compliant).toBe(true);
      expect(result.organizationScore.score).toBe(100);
      expect(result.directoryStructure.compliant).toBe(true);
      expect(result.manifest.exists).toBe(true);
      expect(result.manifest.totalFiles).toBe(3);
      expect(result.recommendations).toHaveLength(0);
    });

    it('should identify issues in poorly organized project', async () => {
      // Create manifest with misplaced files
      const manifestData = {
        version: '1.0',
        project: 'test-project',
        initialized: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        statistics: {
          total_files: 3,
          by_tier: { CRITICAL: 1, PERMANENT: 2, EPHEMERAL: 0, ARCHIVED: 0 },
          pending_archive: 0,
          misplaced: 0
        },
        files: {
          'wrong/package.json': { tier: 'CRITICAL', status: 'active' },
          'temp/README.md': { tier: 'PERMANENT', status: 'active' },
          'random/guide.md': { tier: 'PERMANENT', status: 'active' }
        },
        settings: {
          ephemeral_expiration_days: 60,
          archive_retention_days: 90,
          auto_organize: false,
          confidence_threshold: 0.8
        }
      };

      await fs.writeFile(
        path.join(TEST_PROJECT_ROOT, '.file-manifest.json'),
        JSON.stringify(manifestData, null, 2)
      );

      const result = await validateFileLifecycle(TEST_PROJECT_ROOT);
      
      expect(result.compliant).toBe(false);
      expect(result.organizationScore.score).toBeLessThan(80);
      expect(result.organizationScore.misplaced).toBeGreaterThan(0);
      expect(result.directoryStructure.compliant).toBe(false);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle project without manifest', async () => {
      const result = await validateFileLifecycle(TEST_PROJECT_ROOT);
      
      expect(result.compliant).toBe(false);
      expect(result.manifest.exists).toBe(false);
      expect(result.manifest.totalFiles).toBe(0);
      expect(result.directoryStructure.compliant).toBe(false);
    });
  });

  describe('generateAutoRepairActions - Integration', () => {
    it('should generate comprehensive repair plan for non-compliant project', async () => {
      // Create manifest with misplaced files
      const manifestData = {
        version: '1.0',
        project: 'test-project',
        files: {
          'wrong/config.json': { tier: 'CRITICAL', status: 'active' },
          'temp/guide.md': { tier: 'PERMANENT', status: 'active' }
        }
      };

      await fs.writeFile(
        path.join(TEST_PROJECT_ROOT, '.file-manifest.json'),
        JSON.stringify(manifestData, null, 2)
      );

      const validationResult = await validateFileLifecycle(TEST_PROJECT_ROOT);
      const actions = generateAutoRepairActions(validationResult);
      
      expect(actions.length).toBeGreaterThan(0);
      
      // Should have directory creation action
      const createDirAction = actions.find(a => a.type === 'create_directories');
      expect(createDirAction).toBeDefined();
      expect(createDirAction.automated).toBe(true);
      expect(createDirAction.priority).toBe('high');
      
      // Should have file move action
      const moveFilesAction = actions.find(a => a.type === 'move_files');
      expect(moveFilesAction).toBeDefined();
      expect(moveFilesAction.automated).toBe(false);
      expect(moveFilesAction.dryRunRecommended).toBe(true);
      expect(moveFilesAction.moves.length).toBe(2);
    });

    it('should generate no actions for compliant project', async () => {
      // Setup compliant structure
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'docs', 'core'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'docs', 'impl'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'docs', 'sessions'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'docs', 'archive'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'lib'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'tests'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'templates'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, '.claude'), { recursive: true });
      await fs.mkdir(path.join(TEST_PROJECT_ROOT, '.taskmaster'), { recursive: true });

      const manifestData = {
        version: '1.0',
        project: 'test-project',
        files: {
          'package.json': { tier: 'CRITICAL', status: 'active' },
          'docs/core/README.md': { tier: 'PERMANENT', status: 'active' }
        }
      };

      await fs.writeFile(
        path.join(TEST_PROJECT_ROOT, '.file-manifest.json'),
        JSON.stringify(manifestData, null, 2)
      );

      const validationResult = await validateFileLifecycle(TEST_PROJECT_ROOT);
      const actions = generateAutoRepairActions(validationResult);
      
      expect(actions).toHaveLength(0);
    });
  });
});

