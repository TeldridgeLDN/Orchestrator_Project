/**
 * Unit tests for metrics aggregation and archiving utility
 * 
 * Tests aggregation logic, archiving, compression, and maintenance operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';
import {
  aggregateByPeriod,
  generateWeeklySummary,
  getHistoricalAggregation,
  archiveMetrics,
  listArchives,
  getArchivesToPrune,
  pruneOldArchives,
  archiveAndRotate,
  loadArchivedMetrics,
  performMaintenance,
  getStorageStats,
  getISOWeek,
  getWeekDateRange
} from '../metrics-aggregation.js';
import { loadMetrics, clearMetrics, flushMetrics } from '../metrics.js';

const TEST_ARCHIVE_DIR = path.join(os.homedir(), '.claude', 'metrics-archive');

describe('Metrics Aggregation', () => {
  
  beforeEach(async () => {
    await clearMetrics();
  });

  afterEach(async () => {
    // Clean up test archives
    if (existsSync(TEST_ARCHIVE_DIR)) {
      const files = await fs.readdir(TEST_ARCHIVE_DIR);
      for (const file of files) {
        if (file.startsWith('metrics-test-') || file.includes('2025-W')) {
          await fs.unlink(path.join(TEST_ARCHIVE_DIR, file)).catch(() => {});
        }
      }
    }
  });

  // ==================== Helper Function Tests ====================

  describe('getISOWeek', () => {
    it('should return correct ISO week string', () => {
      const date = new Date('2025-01-15');
      const week = getISOWeek(date);
      
      expect(week).toMatch(/^\d{4}-W\d{2}$/);
      expect(week).toContain('2025-W');
    });

    it('should handle different dates correctly', () => {
      const dates = [
        new Date('2025-01-01'),
        new Date('2025-06-15'),
        new Date('2025-12-31')
      ];

      for (const date of dates) {
        const week = getISOWeek(date);
        expect(week).toMatch(/^\d{4}-W\d{2}$/);
      }
    });
  });

  describe('getWeekDateRange', () => {
    it('should return correct date range for ISO week', () => {
      const isoWeek = '2025-W03';
      const range = getWeekDateRange(isoWeek);
      
      expect(range).toHaveProperty('start');
      expect(range).toHaveProperty('end');
      expect(range.start).toBeInstanceOf(Date);
      expect(range.end).toBeInstanceOf(Date);
      expect(range.end.getTime()).toBeGreaterThan(range.start.getTime());
    });

    it('should return 7-day range', () => {
      const isoWeek = '2025-W10';
      const range = getWeekDateRange(isoWeek);
      
      const daysDiff = Math.floor((range.end - range.start) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(6); // Start to end is 6 days (7 days inclusive)
    });
  });

  // ==================== Aggregation Tests ====================

  describe('aggregateByPeriod', () => {
    it('should aggregate metrics by week', async () => {
      const metrics = await loadMetrics();
      const aggregated = aggregateByPeriod(metrics, 'week');
      
      expect(aggregated).toHaveProperty('period', 'week');
      expect(aggregated).toHaveProperty('generated');
      expect(aggregated).toHaveProperty('weeks');
      expect(typeof aggregated.weeks).toBe('object');
    });

    it('should include current week in aggregation', async () => {
      const metrics = await loadMetrics();
      const aggregated = aggregateByPeriod(metrics, 'week');
      
      const currentWeek = getISOWeek(new Date());
      expect(aggregated.weeks).toHaveProperty(currentWeek);
    });

    it('should aggregate skill metrics correctly', async () => {
      const metrics = {
        skills: {
          'test-skill': {
            activations: 10,
            manual: 6,
            auto: 4,
            avg_duration_seconds: 2.5,
            total_duration_seconds: 25,
            errors_found: 2,
            errors_encountered: 1,
            last_used: new Date().toISOString()
          }
        },
        hooks: {}
      };

      const aggregated = aggregateByPeriod(metrics, 'week');
      const currentWeek = getISOWeek(new Date());
      const weekData = aggregated.weeks[currentWeek];
      
      expect(weekData.skills['test-skill'].activations).toBe(10);
      expect(weekData.skills['test-skill'].manual).toBe(6);
      expect(weekData.skills['test-skill'].auto).toBe(4);
    });

    it('should aggregate hook metrics correctly', async () => {
      const metrics = {
        skills: {},
        hooks: {
          'test-hook': {
            executions: 100,
            warnings_issued: 5,
            errors_caught: 2,
            errors_encountered: 1,
            avg_execution_ms: 3.5,
            total_execution_ms: 350,
            last_executed: new Date().toISOString()
          }
        }
      };

      const aggregated = aggregateByPeriod(metrics, 'week');
      const currentWeek = getISOWeek(new Date());
      const weekData = aggregated.weeks[currentWeek];
      
      expect(weekData.hooks['test-hook'].executions).toBe(100);
      expect(weekData.hooks['test-hook'].warnings_issued).toBe(5);
    });

    it('should calculate summary statistics', async () => {
      const metrics = {
        skills: {
          'skill1': { activations: 10, errors_encountered: 1 },
          'skill2': { activations: 5, errors_encountered: 0 }
        },
        hooks: {
          'hook1': { executions: 50, errors_encountered: 2 },
          'hook2': { executions: 30, errors_encountered: 1 }
        }
      };

      const aggregated = aggregateByPeriod(metrics, 'week');
      const currentWeek = getISOWeek(new Date());
      const summary = aggregated.weeks[currentWeek].summary;
      
      expect(summary.total_skill_activations).toBe(15);
      expect(summary.total_hook_executions).toBe(80);
      expect(summary.total_errors).toBe(4);
    });
  });

  describe('generateWeeklySummary', () => {
    it('should generate weekly summary from current metrics', async () => {
      const summary = await generateWeeklySummary();
      
      expect(summary).toHaveProperty('period', 'week');
      expect(summary).toHaveProperty('generated');
      expect(summary).toHaveProperty('weeks');
    });
  });

  describe('getHistoricalAggregation', () => {
    it('should generate aggregation for multiple weeks', async () => {
      const aggregation = await getHistoricalAggregation(4);
      
      expect(aggregation).toHaveProperty('period', '4-weeks');
      expect(aggregation).toHaveProperty('weeks');
      expect(Object.keys(aggregation.weeks)).toHaveLength(4);
    });

    it('should include correct ISO weeks', async () => {
      const aggregation = await getHistoricalAggregation(2);
      const weeks = Object.keys(aggregation.weeks);
      
      for (const week of weeks) {
        expect(week).toMatch(/^\d{4}-W\d{2}$/);
      }
    });
  });

  // ==================== Archiving Tests ====================

  describe('archiveMetrics', () => {
    it('should create compressed archive', async () => {
      const metrics = await loadMetrics();
      const result = await archiveMetrics(metrics, 'metrics-test-archive.json');
      
      expect(result.success).toBe(true);
      expect(result.path).toContain('.json.gz');
      expect(existsSync(result.path)).toBe(true);
      
      // Clean up
      await fs.unlink(result.path);
    });

    it('should create archive with timestamp if no name provided', async () => {
      const metrics = await loadMetrics();
      const result = await archiveMetrics(metrics);
      
      expect(result.success).toBe(true);
      expect(result.path).toMatch(/metrics-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
      
      // Clean up
      await fs.unlink(result.path);
    });

    it('should report file size', async () => {
      const metrics = await loadMetrics();
      const result = await archiveMetrics(metrics, 'metrics-test-size.json');
      
      expect(result.size).toBeGreaterThan(0);
      
      // Clean up
      await fs.unlink(result.path);
    });

    it('should handle archiving errors gracefully', async () => {
      // Create invalid metrics that will cause JSON.stringify to throw
      const invalidMetrics = {};
      invalidMetrics.circular = invalidMetrics; // Circular reference
      
      const result = await archiveMetrics(invalidMetrics);
      
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('listArchives', () => {
    it('should list all archive files', async () => {
      // Create test archives
      const metrics = await loadMetrics();
      await archiveMetrics(metrics, 'metrics-test-list-1.json');
      await archiveMetrics(metrics, 'metrics-test-list-2.json');
      
      const archives = await listArchives();
      const testArchives = archives.filter(a => a.name.includes('test-list'));
      
      expect(testArchives.length).toBeGreaterThanOrEqual(2);
      
      // Clean up
      for (const archive of testArchives) {
        await fs.unlink(archive.path);
      }
    });

    it('should include file metadata', async () => {
      const metrics = await loadMetrics();
      await archiveMetrics(metrics, 'metrics-test-metadata.json');
      
      const archives = await listArchives();
      const testArchive = archives.find(a => a.name.includes('test-metadata'));
      
      expect(testArchive).toBeDefined();
      expect(testArchive).toHaveProperty('name');
      expect(testArchive).toHaveProperty('path');
      expect(testArchive).toHaveProperty('size');
      expect(testArchive).toHaveProperty('created');
      expect(testArchive).toHaveProperty('modified');
      
      // Clean up
      await fs.unlink(testArchive.path);
    });

    it('should sort archives by creation date', async () => {
      const metrics = await loadMetrics();
      
      await archiveMetrics(metrics, 'metrics-test-sort-1.json');
      await new Promise(resolve => setTimeout(resolve, 100));
      await archiveMetrics(metrics, 'metrics-test-sort-2.json');
      
      const archives = await listArchives();
      const testArchives = archives.filter(a => a.name.includes('test-sort'));
      
      if (testArchives.length >= 2) {
        expect(testArchives[0].created.getTime())
          .toBeGreaterThanOrEqual(testArchives[1].created.getTime());
      }
      
      // Clean up
      for (const archive of testArchives) {
        await fs.unlink(archive.path);
      }
    });
  });

  describe('pruneOldArchives', () => {
    it('should identify archives to prune', async () => {
      const archives = await getArchivesToPrune(30);
      
      expect(Array.isArray(archives)).toBe(true);
    });

    it('should not prune recent archives', async () => {
      const metrics = await loadMetrics();
      await archiveMetrics(metrics, 'metrics-test-recent.json');
      
      const toPrune = await getArchivesToPrune(30);
      const recentArchive = toPrune.find(a => a.name.includes('test-recent'));
      
      expect(recentArchive).toBeUndefined();
      
      // Clean up
      const archives = await listArchives();
      const testArchive = archives.find(a => a.name.includes('test-recent'));
      if (testArchive) {
        await fs.unlink(testArchive.path);
      }
    });

    it('should return prune statistics', async () => {
      const result = await pruneOldArchives(30);
      
      expect(result).toHaveProperty('pruned');
      expect(result).toHaveProperty('kept');
      expect(typeof result.pruned).toBe('number');
      expect(typeof result.kept).toBe('number');
    });
  });

  describe('loadArchivedMetrics', () => {
    it('should decompress and load archived metrics', async () => {
      const originalMetrics = {
        version: '1.0.0',
        skills: { 'test': { activations: 5 } },
        hooks: {}
      };
      
      const result = await archiveMetrics(originalMetrics, 'metrics-test-load.json');
      const loaded = await loadArchivedMetrics(result.path);
      
      expect(loaded.skills.test.activations).toBe(5);
      
      // Clean up
      await fs.unlink(result.path);
    });

    it('should handle corrupted archives', async () => {
      const corruptedPath = path.join(TEST_ARCHIVE_DIR, 'corrupted.json.gz');
      
      await expect(
        loadArchivedMetrics(corruptedPath)
      ).rejects.toThrow();
    });
  });

  // ==================== Maintenance Tests ====================

  describe('performMaintenance', () => {
    it('should perform all maintenance tasks', async () => {
      const report = await performMaintenance();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('actions');
      expect(report).toHaveProperty('success');
      expect(Array.isArray(report.actions)).toBe(true);
    });

    it('should validate metrics', async () => {
      const report = await performMaintenance();
      const validateAction = report.actions.find(a => a.action === 'validate');
      
      expect(validateAction).toBeDefined();
      expect(validateAction).toHaveProperty('success');
    });

    it('should prune archives', async () => {
      const report = await performMaintenance();
      const pruneAction = report.actions.find(a => a.action === 'prune');
      
      expect(pruneAction).toBeDefined();
      expect(pruneAction).toHaveProperty('pruned');
      expect(pruneAction).toHaveProperty('kept');
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', async () => {
      const stats = await getStorageStats();
      
      expect(stats).toHaveProperty('current');
      expect(stats).toHaveProperty('archives');
      expect(stats).toHaveProperty('total');
    });

    it('should calculate total size', async () => {
      const stats = await getStorageStats();
      
      expect(typeof stats.total).toBe('number');
      expect(stats.total).toBeGreaterThanOrEqual(0);
    });

    it('should include archive counts', async () => {
      const stats = await getStorageStats();
      
      expect(stats.archives).toHaveProperty('count');
      expect(stats.archives).toHaveProperty('totalSize');
      expect(typeof stats.archives.count).toBe('number');
      expect(typeof stats.archives.totalSize).toBe('number');
    });
  });

  // ==================== Integration Tests ====================

  describe('Integration', () => {
    it('should archive, list, and load in sequence', async () => {
      const metrics = await loadMetrics();
      
      // Archive
      const archiveResult = await archiveMetrics(metrics, 'metrics-test-integration.json');
      expect(archiveResult.success).toBe(true);
      
      // List
      const archives = await listArchives();
      const testArchive = archives.find(a => a.name.includes('test-integration'));
      expect(testArchive).toBeDefined();
      
      // Load
      const loaded = await loadArchivedMetrics(testArchive.path);
      expect(loaded).toBeDefined();
      
      // Clean up
      await fs.unlink(testArchive.path);
    });

    it('should handle full archiveAndRotate workflow', async () => {
      const result = await archiveAndRotate(false);
      
      expect(result).toHaveProperty('success');
      
      if (result.success) {
        // Clean up the created archive
        await fs.unlink(result.path).catch(() => {});
      }
    });
  });
});

