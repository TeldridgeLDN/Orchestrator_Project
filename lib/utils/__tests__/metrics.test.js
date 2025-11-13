/**
 * Unit tests for metrics tracking utility
 * 
 * Tests atomic file operations, schema validation, buffering,
 * histogram updates, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import os from 'os';
import {
  loadMetrics,
  flushMetrics,
  getMetrics,
  clearMetrics,
  recordSkillActivation,
  recordSkillDuration,
  recordSkillErrorsFound,
  recordSkillError,
  recordHookExecution,
  recordHookWarning,
  recordHookErrorCaught,
  recordHookError,
  getSkillMetrics,
  getHookMetrics,
  validateMetrics
} from '../metrics.js';

const TEST_METRICS_DIR = path.join(os.homedir(), '.claude');
const TEST_METRICS_PATH = path.join(TEST_METRICS_DIR, 'metrics.json');
const TEST_BACKUP_PATH = `${TEST_METRICS_PATH}.test-backup`;

describe('Metrics Utility', () => {
  
  // ==================== Setup/Teardown ====================
  
  beforeEach(async () => {
    // Backup existing metrics if they exist
    if (existsSync(TEST_METRICS_PATH)) {
      await fs.copyFile(TEST_METRICS_PATH, TEST_BACKUP_PATH);
      await fs.unlink(TEST_METRICS_PATH);
    }
  });

  afterEach(async () => {
    // Clean up test metrics
    if (existsSync(TEST_METRICS_PATH)) {
      await fs.unlink(TEST_METRICS_PATH);
    }
    
    // Restore backup if it exists
    if (existsSync(TEST_BACKUP_PATH)) {
      await fs.copyFile(TEST_BACKUP_PATH, TEST_METRICS_PATH);
      await fs.unlink(TEST_BACKUP_PATH);
    }
  });

  // ==================== Load/Save Tests ====================

  describe('loadMetrics', () => {
    it('should return default metrics when file does not exist', async () => {
      const metrics = await loadMetrics();
      
      expect(metrics).toHaveProperty('version');
      expect(metrics).toHaveProperty('reporting_period');
      expect(metrics).toHaveProperty('metadata');
      expect(metrics).toHaveProperty('skills');
      expect(metrics).toHaveProperty('hooks');
      expect(metrics.skills).toEqual({});
      expect(metrics.hooks).toEqual({});
    });

    it('should load existing metrics from disk', async () => {
      // Create test metrics file
      const testMetrics = {
        version: '1.0.0',
        reporting_period: {
          start: '2025-01-01T00:00:00Z',
          end: '2025-01-07T23:59:59Z'
        },
        metadata: {
          created: '2025-01-01T00:00:00Z',
          last_modified: '2025-01-07T23:59:59Z',
          flush_pending: false
        },
        skills: {
          'test-skill': {
            activations: 10,
            manual: 5,
            auto: 5,
            avg_duration_seconds: 2.5,
            total_duration_seconds: 25,
            duration_histogram: {
              '<1s': 2,
              '1-5s': 6,
              '5-10s': 2,
              '10-30s': 0,
              '>30s': 0
            },
            errors_found: 3,
            errors_encountered: 1,
            first_used: '2025-01-01T00:00:00Z',
            last_used: '2025-01-07T12:00:00Z'
          }
        },
        hooks: {}
      };

      await fs.mkdir(TEST_METRICS_DIR, { recursive: true });
      await fs.writeFile(TEST_METRICS_PATH, JSON.stringify(testMetrics, null, 2));

      const loaded = await loadMetrics();
      
      expect(loaded.skills['test-skill'].activations).toBe(10);
      expect(loaded.skills['test-skill'].avg_duration_seconds).toBe(2.5);
    });

    it('should return defaults if metrics file is corrupted', async () => {
      await fs.mkdir(TEST_METRICS_DIR, { recursive: true });
      await fs.writeFile(TEST_METRICS_PATH, 'invalid json content');

      const metrics = await loadMetrics();
      
      expect(metrics).toHaveProperty('version');
      expect(metrics.skills).toEqual({});
      expect(metrics.hooks).toEqual({});
    });
  });

  describe('flushMetrics', () => {
    it('should write metrics to disk atomically', async () => {
      await recordSkillActivation('flush-test-skill', false);
      
      // Force flush
      await flushMetrics();

      expect(existsSync(TEST_METRICS_PATH)).toBe(true);
      
      const content = readFileSync(TEST_METRICS_PATH, 'utf-8');
      const metrics = JSON.parse(content);
      
      expect(metrics.skills['flush-test-skill']).toBeDefined();
      expect(metrics.skills['flush-test-skill'].activations).toBe(1);
    });

    it('should not leave temp files after flush', async () => {
      await recordSkillActivation('temp-file-test', false);
      await flushMetrics();

      const tempPath = `${TEST_METRICS_PATH}.tmp`;
      expect(existsSync(tempPath)).toBe(false);
    });

    it('should merge buffer with existing disk metrics', async () => {
      // Create initial metrics
      await recordSkillActivation('skill-a', true);
      await flushMetrics();

      // Record new metric
      await recordSkillActivation('skill-b', false);
      await flushMetrics();

      const metrics = await loadMetrics();
      
      expect(metrics.skills['skill-a']).toBeDefined();
      expect(metrics.skills['skill-b']).toBeDefined();
      expect(metrics.skills['skill-a'].activations).toBe(1);
      expect(metrics.skills['skill-b'].activations).toBe(1);
    });
  });

  // ==================== Schema Validation Tests ====================

  describe('validateMetrics', () => {
    it('should validate correct metrics structure', async () => {
      const validMetrics = {
        version: '1.0.0',
        reporting_period: {
          start: '2025-01-01T00:00:00Z',
          end: '2025-01-07T23:59:59Z'
        },
        metadata: {
          created: '2025-01-01T00:00:00Z',
          last_modified: '2025-01-07T23:59:59Z'
        },
        skills: {},
        hooks: {}
      };

      const result = await validateMetrics(validMetrics);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject metrics with missing required fields', async () => {
      const invalidMetrics = {
        version: '1.0.0',
        skills: {},
        hooks: {}
        // Missing reporting_period and metadata
      };

      const result = await validateMetrics(invalidMetrics);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject metrics with invalid version format', async () => {
      const invalidMetrics = {
        version: 'invalid-version',
        reporting_period: {
          start: '2025-01-01T00:00:00Z',
          end: '2025-01-07T23:59:59Z'
        },
        metadata: {
          created: '2025-01-01T00:00:00Z',
          last_modified: '2025-01-07T23:59:59Z'
        },
        skills: {},
        hooks: {}
      };

      const result = await validateMetrics(invalidMetrics);
      
      expect(result.valid).toBe(false);
    });
  });

  // ==================== Skill Metrics Tests ====================

  describe('Skill Metrics Recording', () => {
    it('should record manual skill activation', async () => {
      await recordSkillActivation('manual-skill', false);
      await flushMetrics();

      const metrics = await getSkillMetrics('manual-skill');
      
      expect(metrics.activations).toBe(1);
      expect(metrics.manual).toBe(1);
      expect(metrics.auto).toBe(0);
    });

    it('should record automatic skill activation', async () => {
      await recordSkillActivation('auto-skill', true);
      await flushMetrics();

      const metrics = await getSkillMetrics('auto-skill');
      
      expect(metrics.activations).toBe(1);
      expect(metrics.auto).toBe(1);
      expect(metrics.manual).toBe(0);
    });

    it('should record multiple activations correctly', async () => {
      await recordSkillActivation('multi-skill', true);
      await recordSkillActivation('multi-skill', false);
      await recordSkillActivation('multi-skill', true);
      await flushMetrics();

      const metrics = await getSkillMetrics('multi-skill');
      
      expect(metrics.activations).toBe(3);
      expect(metrics.auto).toBe(2);
      expect(metrics.manual).toBe(1);
    });

    it('should record skill duration and update histogram', async () => {
      await recordSkillActivation('duration-skill', false);
      await recordSkillDuration('duration-skill', 2.5); // 2.5 seconds
      await flushMetrics();

      const metrics = await getSkillMetrics('duration-skill');
      
      expect(metrics.total_duration_seconds).toBe(2.5);
      expect(metrics.avg_duration_seconds).toBe(2.5);
      expect(metrics.duration_histogram['1-5s']).toBe(1);
    });

    it('should correctly update duration histogram buckets', async () => {
      await recordSkillActivation('histogram-skill', false);
      await recordSkillDuration('histogram-skill', 0.5);  // <1s
      await recordSkillDuration('histogram-skill', 3);    // 1-5s
      await recordSkillDuration('histogram-skill', 7);    // 5-10s
      await recordSkillDuration('histogram-skill', 15);   // 10-30s
      await recordSkillDuration('histogram-skill', 45);   // >30s
      await flushMetrics();

      const metrics = await getSkillMetrics('histogram-skill');
      
      expect(metrics.duration_histogram['<1s']).toBe(1);
      expect(metrics.duration_histogram['1-5s']).toBe(1);
      expect(metrics.duration_histogram['5-10s']).toBe(1);
      expect(metrics.duration_histogram['10-30s']).toBe(1);
      expect(metrics.duration_histogram['>30s']).toBe(1);
    });

    it('should calculate average duration correctly', async () => {
      await recordSkillActivation('avg-skill', false);
      await recordSkillDuration('avg-skill', 2);
      await recordSkillActivation('avg-skill', false);
      await recordSkillDuration('avg-skill', 4);
      await recordSkillActivation('avg-skill', false);
      await recordSkillDuration('avg-skill', 6);
      await flushMetrics();

      const metrics = await getSkillMetrics('avg-skill');
      
      expect(metrics.total_duration_seconds).toBe(12);
      expect(metrics.activations).toBe(3);
      expect(metrics.avg_duration_seconds).toBe(4);
    });

    it('should record errors found by skill', async () => {
      await recordSkillErrorsFound('error-finder-skill', 5);
      await recordSkillErrorsFound('error-finder-skill', 3);
      await flushMetrics();

      const metrics = await getSkillMetrics('error-finder-skill');
      
      expect(metrics.errors_found).toBe(8);
    });

    it('should record skill execution errors', async () => {
      await recordSkillError('error-prone-skill');
      await recordSkillError('error-prone-skill');
      await flushMetrics();

      const metrics = await getSkillMetrics('error-prone-skill');
      
      expect(metrics.errors_encountered).toBe(2);
    });

    it('should update last_used timestamp on activation', async () => {
      const before = new Date();
      
      await recordSkillActivation('timestamp-skill', false);
      await flushMetrics();

      const metrics = await getSkillMetrics('timestamp-skill');
      const lastUsed = new Date(metrics.last_used);
      
      expect(lastUsed.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  // ==================== Hook Metrics Tests ====================

  describe('Hook Metrics Recording', () => {
    it('should record hook execution', async () => {
      await recordHookExecution('test-hook', 10);
      await flushMetrics();

      const metrics = await getHookMetrics('test-hook');
      
      expect(metrics.executions).toBe(1);
      expect(metrics.avg_execution_ms).toBe(10);
    });

    it('should record multiple hook executions and calculate average', async () => {
      await recordHookExecution('multi-hook', 5);
      await recordHookExecution('multi-hook', 10);
      await recordHookExecution('multi-hook', 15);
      await flushMetrics();

      const metrics = await getHookMetrics('multi-hook');
      
      expect(metrics.executions).toBe(3);
      expect(metrics.total_execution_ms).toBe(30);
      expect(metrics.avg_execution_ms).toBe(10);
    });

    it('should update execution histogram correctly', async () => {
      await recordHookExecution('histogram-hook', 0.5);  // <1ms
      await recordHookExecution('histogram-hook', 3);    // 1-5ms
      await recordHookExecution('histogram-hook', 7);    // 5-10ms
      await recordHookExecution('histogram-hook', 25);   // 10-50ms
      await recordHookExecution('histogram-hook', 100);  // >50ms
      await flushMetrics();

      const metrics = await getHookMetrics('histogram-hook');
      
      expect(metrics.execution_histogram['<1ms']).toBe(1);
      expect(metrics.execution_histogram['1-5ms']).toBe(1);
      expect(metrics.execution_histogram['5-10ms']).toBe(1);
      expect(metrics.execution_histogram['10-50ms']).toBe(1);
      expect(metrics.execution_histogram['>50ms']).toBe(1);
    });

    it('should record hook warnings', async () => {
      await recordHookWarning('warning-hook', 2);
      await recordHookWarning('warning-hook', 3);
      await flushMetrics();

      const metrics = await getHookMetrics('warning-hook');
      
      expect(metrics.warnings_issued).toBe(5);
    });

    it('should record errors caught by hook', async () => {
      await recordHookErrorCaught('error-catcher-hook', 4);
      await flushMetrics();

      const metrics = await getHookMetrics('error-catcher-hook');
      
      expect(metrics.errors_caught).toBe(4);
    });

    it('should record hook execution errors', async () => {
      await recordHookError('failing-hook');
      await recordHookError('failing-hook');
      await flushMetrics();

      const metrics = await getHookMetrics('failing-hook');
      
      expect(metrics.errors_encountered).toBe(2);
    });
  });

  // ==================== Utility Functions Tests ====================

  describe('Utility Functions', () => {
    it('should get complete metrics snapshot', async () => {
      await recordSkillActivation('skill-1', false);
      await recordHookExecution('hook-1', 5);
      await flushMetrics();

      const metrics = await getMetrics();
      
      expect(metrics.skills['skill-1']).toBeDefined();
      expect(metrics.hooks['hook-1']).toBeDefined();
    });

    it('should clear all metrics', async () => {
      await recordSkillActivation('to-clear-skill', false);
      await recordHookExecution('to-clear-hook', 5);
      await flushMetrics();

      await clearMetrics();

      const metrics = await getMetrics();
      
      expect(Object.keys(metrics.skills)).toHaveLength(0);
      expect(Object.keys(metrics.hooks)).toHaveLength(0);
    });

    it('should return null for non-existent skill metrics', async () => {
      const metrics = await getSkillMetrics('non-existent-skill');
      expect(metrics).toBeNull();
    });

    it('should return null for non-existent hook metrics', async () => {
      const metrics = await getHookMetrics('non-existent-hook');
      expect(metrics).toBeNull();
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases and Error Handling', () => {
    it('should handle recording metrics for same skill/hook in rapid succession', async () => {
      const promises = [];
      
      for (let i = 0; i < 100; i++) {
        promises.push(recordSkillActivation('rapid-skill', i % 2 === 0));
      }
      
      await Promise.all(promises);
      await flushMetrics();

      const metrics = await getSkillMetrics('rapid-skill');
      
      expect(metrics.activations).toBe(100);
      expect(metrics.manual).toBe(50);
      expect(metrics.auto).toBe(50);
    });

    it('should handle zero duration gracefully', async () => {
      await recordSkillActivation('zero-duration-skill', false);
      await recordSkillDuration('zero-duration-skill', 0);
      await flushMetrics();

      const metrics = await getSkillMetrics('zero-duration-skill');
      
      expect(metrics.avg_duration_seconds).toBe(0);
      expect(metrics.duration_histogram['<1s']).toBe(1);
    });

    it('should handle very large duration values', async () => {
      await recordSkillActivation('large-duration-skill', false);
      await recordSkillDuration('large-duration-skill', 3600); // 1 hour
      await flushMetrics();

      const metrics = await getSkillMetrics('large-duration-skill');
      
      expect(metrics.total_duration_seconds).toBe(3600);
      expect(metrics.duration_histogram['>30s']).toBe(1);
    });

    it('should not crash on invalid metric names', async () => {
      await expect(
        recordSkillActivation('', false)
      ).resolves.not.toThrow();
      
      await expect(
        recordHookExecution('', 5)
      ).resolves.not.toThrow();
    });
  });

  // ==================== Performance Tests ====================

  describe('Performance', () => {
    it('should complete metric recording in <5ms', async () => {
      const start = performance.now();
      
      await recordSkillActivation('perf-test-skill', false);
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(5);
    });

    it('should handle debounced flush correctly', async () => {
      // Record multiple metrics
      await recordSkillActivation('debounce-skill-1', false);
      await recordSkillActivation('debounce-skill-2', true);
      await recordHookExecution('debounce-hook', 5);

      // Wait for debounce period (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Verify metrics were flushed
      expect(existsSync(TEST_METRICS_PATH)).toBe(true);
      
      const metrics = await loadMetrics();
      expect(metrics.skills['debounce-skill-1']).toBeDefined();
      expect(metrics.skills['debounce-skill-2']).toBeDefined();
      expect(metrics.hooks['debounce-hook']).toBeDefined();
    });
  });
});

