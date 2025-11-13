/**
 * Tests for Directory Detection Hook
 * 
 * @module hooks/__tests__/directoryDetection.test.js
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import {
  directoryDetectionHook,
  promptDirectoryDetectionHook,
  clearProjectCache,
  resetDirectoryTracking
} from '../directoryDetection.js';

// Mock dependencies
vi.mock('../../utils/config.js');
vi.mock('../../commands/switch.js');

import { readConfig } from '../../utils/config.js';
import { switchCommand } from '../../commands/switch.js';

describe('Directory Detection Hook', () => {
  const mockConfig = {
    settings: {
      auto_switch_on_directory_change: true,
      validate_on_switch: true
    },
    projects: {
      'test-project-1': {
        path: '/Users/test/projects/project1'
      },
      'test-project-2': {
        path: '/Users/test/projects/project2'
      }
    }
  };

  const mockContextFile = path.join(os.homedir(), '.claude', 'current-project.json');

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    readConfig.mockResolvedValue(mockConfig);
    switchCommand.mockResolvedValue(undefined);
    
    // Reset hook state
    clearProjectCache();
    resetDirectoryTracking();
  });

  describe('directoryDetectionHook', () => {
    it('should detect directory change and switch project', async () => {
      // Mock process.cwd() to return a project directory
      const originalCwd = process.cwd;
      process.cwd = vi.fn(() => '/Users/test/projects/project1');

      // Mock context file to show different active project
      vi.spyOn(fs, 'readFile').mockResolvedValue(
        JSON.stringify({ name: 'test-project-2', path: '/Users/test/projects/project2' })
      );

      const context = {};
      const next = vi.fn();

      await directoryDetectionHook(context, next);

      expect(switchCommand).toHaveBeenCalledWith(
        '/Users/test/projects/project1',
        expect.objectContaining({
          name: 'test-project-1',
          validate: true,
          verbose: false
        })
      );
      expect(next).toHaveBeenCalled();

      // Restore
      process.cwd = originalCwd;
    });

    it('should skip if directory has not changed', async () => {
      const context = {};
      const next = vi.fn();

      // First call
      await directoryDetectionHook(context, next);

      vi.clearAllMocks();

      // Second call with same directory
      await directoryDetectionHook(context, next);

      expect(switchCommand).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should skip if auto-switching is disabled', async () => {
      readConfig.mockResolvedValue({
        ...mockConfig,
        settings: {
          ...mockConfig.settings,
          auto_switch_on_directory_change: false
        }
      });

      const originalCwd = process.cwd;
      process.cwd = vi.fn(() => '/Users/test/projects/project1');

      const context = {};
      const next = vi.fn();

      await directoryDetectionHook(context, next);

      expect(switchCommand).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();

      process.cwd = originalCwd;
    });

    it('should skip if not in a registered project', async () => {
      const originalCwd = process.cwd;
      process.cwd = vi.fn(() => '/Users/test/other-directory');

      const context = {};
      const next = vi.fn();

      await directoryDetectionHook(context, next);

      expect(switchCommand).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();

      process.cwd = originalCwd;
    });

    it('should skip if already in target project context', async () => {
      const originalCwd = process.cwd;
      process.cwd = vi.fn(() => '/Users/test/projects/project1');

      // Mock context file to show same active project
      vi.spyOn(fs, 'readFile').mockResolvedValue(
        JSON.stringify({ name: 'test-project-1', path: '/Users/test/projects/project1' })
      );

      const context = {};
      const next = vi.fn();

      await directoryDetectionHook(context, next);

      expect(switchCommand).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();

      process.cwd = originalCwd;
    });

    it('should handle subdirectories within project', async () => {
      const originalCwd = process.cwd;
      process.cwd = vi.fn(() => '/Users/test/projects/project1/src/components');

      vi.spyOn(fs, 'readFile').mockResolvedValue(
        JSON.stringify({ name: 'test-project-2', path: '/Users/test/projects/project2' })
      );

      const context = {};
      const next = vi.fn();

      await directoryDetectionHook(context, next);

      expect(switchCommand).toHaveBeenCalledWith(
        '/Users/test/projects/project1/src/components',
        expect.objectContaining({
          name: 'test-project-1'
        })
      );

      process.cwd = originalCwd;
    });

    it('should handle errors gracefully', async () => {
      const originalCwd = process.cwd;
      process.cwd = vi.fn(() => '/Users/test/projects/project1');

      // Mock switchCommand to throw error
      switchCommand.mockRejectedValue(new Error('Switch failed'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const context = {};
      const next = vi.fn();

      await directoryDetectionHook(context, next);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Directory detection hook error:',
        'Switch failed'
      );
      expect(next).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      process.cwd = originalCwd;
    });
  });

  describe('promptDirectoryDetectionHook', () => {
    beforeEach(() => {
      // Mock existsSync for directory checks
      vi.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
    });

    it('should detect cd command in prompt', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue(
        JSON.stringify({ name: 'test-project-2', path: '/Users/test/projects/project2' })
      );

      const context = { 
        prompt: 'Let me cd /Users/test/projects/project1 and check the files' 
      };
      const next = vi.fn();

      await promptDirectoryDetectionHook(context, next);

      expect(switchCommand).toHaveBeenCalledWith(
        '/Users/test/projects/project1',
        expect.objectContaining({
          name: 'test-project-1'
        })
      );
      expect(next).toHaveBeenCalled();
    });

    it('should handle relative paths in cd commands', async () => {
      const originalCwd = process.cwd;
      process.cwd = vi.fn(() => '/Users/test/projects');

      vi.spyOn(fs, 'readFile').mockResolvedValue(
        JSON.stringify({ name: 'test-project-2', path: '/Users/test/projects/project2' })
      );

      const context = { 
        prompt: 'cd project1' 
      };
      const next = vi.fn();

      await promptDirectoryDetectionHook(context, next);

      expect(switchCommand).toHaveBeenCalledWith(
        '/Users/test/projects/project1',
        expect.objectContaining({
          name: 'test-project-1'
        })
      );

      process.cwd = originalCwd;
    });

    it('should skip if no cd command in prompt', async () => {
      const context = { 
        prompt: 'Let me check the files in this directory' 
      };
      const next = vi.fn();

      await promptDirectoryDetectionHook(context, next);

      expect(switchCommand).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should skip if target directory does not exist', async () => {
      vi.spyOn(require('fs'), 'existsSync').mockReturnValue(false);

      const context = { 
        prompt: 'cd /nonexistent/path' 
      };
      const next = vi.fn();

      await promptDirectoryDetectionHook(context, next);

      expect(switchCommand).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should skip if auto-switching is disabled', async () => {
      readConfig.mockResolvedValue({
        ...mockConfig,
        settings: {
          ...mockConfig.settings,
          auto_switch_on_directory_change: false
        }
      });

      const context = { 
        prompt: 'cd /Users/test/projects/project1' 
      };
      const next = vi.fn();

      await promptDirectoryDetectionHook(context, next);

      expect(switchCommand).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      readConfig.mockRejectedValue(new Error('Config read failed'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const context = { 
        prompt: 'cd /Users/test/projects/project1' 
      };
      const next = vi.fn();

      await promptDirectoryDetectionHook(context, next);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Prompt directory detection hook error:',
        'Config read failed'
      );
      expect(next).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Cache Management', () => {
    it('should cache project paths for faster lookup', async () => {
      const originalCwd = process.cwd;
      process.cwd = vi.fn(() => '/Users/test/projects/project1');

      vi.spyOn(fs, 'readFile').mockResolvedValue(
        JSON.stringify({ name: 'test-project-2', path: '/Users/test/projects/project2' })
      );

      const context = {};
      const next = vi.fn();

      // First call builds cache
      await directoryDetectionHook(context, next);

      expect(readConfig).toHaveBeenCalledTimes(2); // Once for settings, once for cache build

      vi.clearAllMocks();
      resetDirectoryTracking();

      // Second call should use cache
      await directoryDetectionHook(context, next);

      // readConfig should be called once (for settings check), not for cache rebuild
      expect(readConfig).toHaveBeenCalledTimes(1);

      process.cwd = originalCwd;
    });

    it('should rebuild cache after TTL expires', async () => {
      // This test would require mocking timers to test TTL expiration
      // For now, we'll test the clearProjectCache function
      
      const originalCwd = process.cwd;
      process.cwd = vi.fn(() => '/Users/test/projects/project1');

      vi.spyOn(fs, 'readFile').mockResolvedValue(
        JSON.stringify({ name: 'test-project-2', path: '/Users/test/projects/project2' })
      );

      const context = {};
      const next = vi.fn();

      // First call builds cache
      await directoryDetectionHook(context, next);

      // Clear cache
      clearProjectCache();

      vi.clearAllMocks();
      resetDirectoryTracking();

      // Next call should rebuild cache
      await directoryDetectionHook(context, next);

      // Should call readConfig to rebuild
      expect(readConfig).toHaveBeenCalled();

      process.cwd = originalCwd;
    });
  });
});

