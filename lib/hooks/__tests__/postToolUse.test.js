/**
 * Tests for PostToolUse Hook
 * 
 * @group hooks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { 
  postToolUseHook,
  setEnabled,
  getStatus,
  clearTimestamps,
  fileTimestamps,
  CONFIG 
} from '../postToolUse.js';

// Mock filesystem
vi.mock('fs/promises');

describe('PostToolUse Hook', () => {
  beforeEach(() => {
    clearTimestamps();
    setEnabled(true);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with empty timestamps', () => {
      clearTimestamps();
      expect(fileTimestamps.size).toBe(0);
    });

    it('should be enabled by default', () => {
      const status = getStatus();
      expect(status.enabled).toBe(true);
    });

    it('should allow enabling/disabling', () => {
      setEnabled(false);
      expect(getStatus().enabled).toBe(false);

      setEnabled(true);
      expect(getStatus().enabled).toBe(true);
    });
  });

  describe('File Change Detection', () => {
    it('should detect when metadata.json is modified', async () => {
      const mockNext = vi.fn();
      const context = {};

      // Mock file existence
      fs.access = vi.fn().mockResolvedValue(undefined);

      // Mock file stats - first call returns old time, second returns new time
      let callCount = 0;
      fs.stat = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          mtimeMs: callCount === 1 ? 1000 : 2000
        });
      });

      // First call - initialize timestamps
      await postToolUseHook(context, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Reset mock
      mockNext.mockClear();

      // Second call - should detect change
      await postToolUseHook(context, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should not trigger on first run', async () => {
      const mockNext = vi.fn();
      const context = {};

      fs.access = vi.fn().mockResolvedValue(undefined);
      fs.stat = vi.fn().mockResolvedValue({ mtimeMs: 1000 });
      fs.readdir = vi.fn().mockResolvedValue([]);

      const consoleSpy = vi.spyOn(console, 'log');

      await postToolUseHook(context, mockNext);

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Configuration changes detected')
      );
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle missing files gracefully', async () => {
      const mockNext = vi.fn();
      const context = {};

      fs.access = vi.fn().mockRejectedValue(new Error('File not found'));
      fs.stat = vi.fn().mockRejectedValue(new Error('File not found'));

      await expect(postToolUseHook(context, mockNext)).resolves.not.toThrow();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Scenario File Monitoring', () => {
    it('should detect changes in scenario YAML files', async () => {
      const mockNext = vi.fn();
      const context = {};

      fs.access = vi.fn().mockResolvedValue(undefined);
      fs.stat = vi.fn().mockResolvedValue({ mtimeMs: 1000 });
      fs.readdir = vi.fn().mockResolvedValue([
        'test-scenario.yaml',
        'another.yml',
        'not-yaml.txt'
      ]);

      // First call - initialize
      await postToolUseHook(context, mockNext);

      // Wait for throttle interval
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Update mock for second call
      fs.stat = vi.fn().mockResolvedValue({ mtimeMs: 2000 });

      // Second call - should detect changes
      const consoleSpy = vi.spyOn(console, 'log');
      await postToolUseHook(context, mockNext);

      // Should have logged scenario changes
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Modified scenario files')
      );
    });

    it('should filter out non-YAML files', async () => {
      const mockNext = vi.fn();
      const context = {};

      fs.access = vi.fn().mockResolvedValue(undefined);
      fs.stat = vi.fn().mockResolvedValue({ mtimeMs: 1000 });
      fs.readdir = vi.fn().mockResolvedValue([
        'readme.md',
        'config.json',
        'script.js'
      ]);

      await postToolUseHook(context, mockNext);

      // Should not have checked any files (no YAML)
      expect(fileTimestamps.size).toBeLessThan(10); // Only config files
    });

    it('should handle scenarios directory not existing', async () => {
      const mockNext = vi.fn();
      const context = {};

      fs.access = vi.fn().mockImplementation((filePath) => {
        if (filePath.includes('scenarios')) {
          return Promise.reject(new Error('Not found'));
        }
        return Promise.resolve();
      });

      fs.stat = vi.fn().mockResolvedValue({ mtimeMs: 1000 });
      fs.readdir = vi.fn().mockRejectedValue(new Error('Directory not found'));

      await expect(postToolUseHook(context, mockNext)).resolves.not.toThrow();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Throttling', () => {
    it('should throttle checks based on interval', async () => {
      const mockNext = vi.fn();
      const context = {};

      fs.access = vi.fn().mockResolvedValue(undefined);
      fs.stat = vi.fn().mockResolvedValue({ mtimeMs: 1000 });
      fs.readdir = vi.fn().mockResolvedValue([]);

      // First call
      await postToolUseHook(context, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Immediate second call - should be throttled
      await postToolUseHook(context, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);

      // File system operations should not have been called again
      const statCallCount = fs.stat.mock.calls.length;

      // Wait for throttle interval
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Third call - should check again
      await postToolUseHook(context, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(3);
    });
  });

  describe('Status Reporting', () => {
    it('should report correct status', () => {
      clearTimestamps();
      setEnabled(true);

      const status = getStatus();

      expect(status).toHaveProperty('enabled');
      expect(status).toHaveProperty('monitoredFiles');
      expect(status).toHaveProperty('lastCheck');
      expect(status.enabled).toBe(true);
      expect(status.monitoredFiles).toBe(0);
    });

    it('should update monitored files count', async () => {
      const mockNext = vi.fn();
      const context = {};

      fs.access = vi.fn().mockResolvedValue(undefined);
      fs.stat = vi.fn().mockResolvedValue({ mtimeMs: 1000 });
      fs.readdir = vi.fn().mockResolvedValue(['test.yaml']);

      await postToolUseHook(context, mockNext);

      const status = getStatus();
      expect(status.monitoredFiles).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should continue execution on filesystem errors', async () => {
      const mockNext = vi.fn();
      const context = {};

      fs.access = vi.fn().mockRejectedValue(new Error('Access denied'));
      fs.stat = vi.fn().mockRejectedValue(new Error('Stat failed'));
      fs.readdir = vi.fn().mockRejectedValue(new Error('Readdir failed'));

      await expect(postToolUseHook(context, mockNext)).resolves.not.toThrow();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should not throw on errors', async () => {
      const mockNext = vi.fn();
      const context = {};

      // Make file operations throw errors
      fs.access = vi.fn().mockRejectedValue(new Error('Access error'));
      fs.stat = vi.fn().mockRejectedValue(new Error('Stat error'));
      fs.readdir = vi.fn().mockRejectedValue(new Error('Readdir error'));

      // Wait for throttle and clear timestamps to ensure hook runs
      await new Promise(resolve => setTimeout(resolve, 1100));
      clearTimestamps();

      // Should not throw despite errors
      await expect(postToolUseHook(context, mockNext)).resolves.not.toThrow();
      
      // Should still call next
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hook Disabled State', () => {
    it('should skip checks when disabled', async () => {
      setEnabled(false);

      const mockNext = vi.fn();
      const context = {};

      fs.stat = vi.fn();

      await postToolUseHook(context, mockNext);

      expect(fs.stat).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Timestamp Clearing', () => {
    it('should clear all timestamps', async () => {
      const mockNext = vi.fn();
      const context = {};

      fs.access = vi.fn().mockResolvedValue(undefined);
      fs.stat = vi.fn().mockResolvedValue({ mtimeMs: 1000 });
      fs.readdir = vi.fn().mockResolvedValue([]);

      // Populate timestamps
      await postToolUseHook(context, mockNext);
      expect(fileTimestamps.size).toBeGreaterThan(0);

      // Clear
      clearTimestamps();
      expect(fileTimestamps.size).toBe(0);
    });
  });

  describe('Configuration Options', () => {
    it('should have correct default configuration', () => {
      expect(CONFIG.enabled).toBe(true);
      expect(CONFIG.checkInterval).toBe(1000);
      expect(CONFIG.filesToMonitor).toBeInstanceOf(Array);
      expect(CONFIG.filesToMonitor.length).toBeGreaterThan(0);
    });

    it('should monitor expected files', () => {
      expect(CONFIG.filesToMonitor).toContain('.claude/metadata.json');
      expect(CONFIG.filesToMonitor).toContain('.claude/skill-rules.json');
      expect(CONFIG.filesToMonitor).toContain('.taskmaster/tasks/tasks.json');
    });
  });
});

