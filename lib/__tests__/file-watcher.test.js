import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileWatcherManager } from '../file-watcher.js';
import { writeFile, mkdir, unlink, rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

describe('FileWatcherManager', () => {
  let watcher;
  let testDir;
  let testConfigPath;
  let testLogPath;

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `file-watcher-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    
    testConfigPath = path.join(testDir, 'config.json');
    testLogPath = path.join(testDir, 'logs');
    await mkdir(testLogPath, { recursive: true });

    // Initialize watcher with test paths
    watcher = new FileWatcherManager({
      watchPaths: {
        config: testConfigPath,
        logs: [testLogPath],
        projectConfig: path.join(testDir, 'package.json')
      }
    });
  });

  afterEach(async () => {
    if (watcher && watcher.isActive) {
      await watcher.stop();
    }
    
    // Clean up test directory
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('Initialization', () => {
    it('should create watcher with default options', () => {
      expect(watcher).toBeDefined();
      expect(watcher.isActive).toBe(false);
      expect(watcher.watchers.size).toBe(0);
    });

    it('should accept custom watch paths', () => {
      const customWatcher = new FileWatcherManager({
        watchPaths: {
          config: '/custom/config.json',
          logs: ['/custom/logs'],
          projectConfig: '/custom/package.json'
        }
      });
      
      expect(customWatcher.watchPaths.config).toBe('/custom/config.json');
      expect(customWatcher.watchPaths.logs).toContain('/custom/logs');
    });

    it('should have correct chokidar options', () => {
      expect(watcher.chokidarOptions.persistent).toBe(true);
      expect(watcher.chokidarOptions.ignoreInitial).toBe(true);
      expect(watcher.chokidarOptions.awaitWriteFinish).toBeDefined();
    });
  });

  describe('Starting and Stopping', () => {
    it('should start watchers successfully', async () => {
      // Create initial files to watch
      await writeFile(testConfigPath, JSON.stringify({ test: true }));
      await writeFile(path.join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));

      await watcher.start();
      
      expect(watcher.isActive).toBe(true);
      expect(watcher.watchers.size).toBeGreaterThan(0);
    });

    it('should prevent starting twice', async () => {
      await writeFile(testConfigPath, JSON.stringify({ test: true }));
      await writeFile(path.join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));

      await watcher.start();
      expect(watcher.isActive).toBe(true);
      
      // Try starting again
      await watcher.start();
      expect(watcher.isActive).toBe(true);
    });

    it('should stop all watchers', async () => {
      await writeFile(testConfigPath, JSON.stringify({ test: true }));
      await writeFile(path.join(testDir, 'package.json'), JSON.stringify({ name: 'test' }));

      await watcher.start();
      expect(watcher.isActive).toBe(true);
      
      await watcher.stop();
      expect(watcher.isActive).toBe(false);
      expect(watcher.watchers.size).toBe(0);
    });

    it('should handle stopping when not active', async () => {
      expect(watcher.isActive).toBe(false);
      await expect(watcher.stop()).resolves.not.toThrow();
    });
  });

  describe('Configuration File Watching', () => {
    it('should detect config file changes', async () => {
      // Create initial config
      await writeFile(testConfigPath, JSON.stringify({ version: '1.0.0' }));
      await watcher.start();

      return new Promise((resolve) => {
        let eventReceived = false;

        watcher.on('config-change', (event) => {
          eventReceived = true;
          expect(event.type).toBe('config-change');
          expect(event.data.config.version).toBe('2.0.0');
          expect(event.data.timestamp).toBeDefined();
          
          if (eventReceived) {
            resolve();
          }
        });

        // Give watchers time to initialize
        setTimeout(async () => {
          await writeFile(testConfigPath, JSON.stringify({ version: '2.0.0' }));
        }, 500);
      });
    }, 10000);

    it('should handle malformed config gracefully', async () => {
      await writeFile(testConfigPath, JSON.stringify({ version: '1.0.0' }));
      await watcher.start();

      return new Promise((resolve) => {
        let errorHandled = false;

        watcher.on('config-change', (event) => {
          // This should not be called for malformed JSON
          errorHandled = false;
        });

        setTimeout(async () => {
          // Write malformed JSON
          await writeFile(testConfigPath, 'invalid json{');
          
          // Wait to ensure no event is emitted
          setTimeout(() => {
            // The watcher should handle the error internally
            errorHandled = true;
            resolve();
          }, 1000);
        }, 500);

        setTimeout(() => {
          if (!errorHandled) {
            resolve();
          }
        }, 3000);
      });
    }, 10000);
  });

  describe('Log File Watching', () => {
    it('should detect new log files', async () => {
      await watcher.start();

      return new Promise((resolve) => {
        watcher.on('log-added', (event) => {
          expect(event.type).toBe('log-added');
          expect(event.data.filename).toBe('test.log');
          expect(event.data.path).toContain('test.log');
          resolve();
        });

        setTimeout(async () => {
          await writeFile(path.join(testLogPath, 'test.log'), 'Log entry 1\n');
        }, 500);
      });
    }, 10000);

    it('should detect log file changes', async () => {
      const logFile = path.join(testLogPath, 'test.log');
      await writeFile(logFile, 'Initial log entry\n');
      await watcher.start();

      return new Promise((resolve) => {
        let changeDetected = false;

        watcher.on('log-change', (event) => {
          if (changeDetected) return;
          changeDetected = true;

          expect(event.type).toBe('log-change');
          expect(event.data.filename).toBe('test.log');
          expect(event.data.recentContent).toContain('New log entry');
          resolve();
        });

        setTimeout(async () => {
          await writeFile(logFile, 'Initial log entry\nNew log entry\n');
        }, 500);
      });
    }, 10000);

    it('should detect log file removal', async () => {
      const logFile = path.join(testLogPath, 'temp.log');
      await writeFile(logFile, 'Temporary log\n');
      await watcher.start();

      return new Promise((resolve) => {
        watcher.on('log-removed', (event) => {
          expect(event.type).toBe('log-removed');
          expect(event.data.filename).toBe('temp.log');
          resolve();
        });

        setTimeout(async () => {
          await unlink(logFile);
        }, 500);
      });
    }, 10000);

    it('should only watch .log files', async () => {
      await watcher.start();

      return new Promise((resolve) => {
        let logEventReceived = false;

        watcher.on('log-added', (event) => {
          if (event.data.filename === 'not-a-log.txt') {
            logEventReceived = true;
          }
        });

        setTimeout(async () => {
          // Create a non-log file
          await writeFile(path.join(testLogPath, 'not-a-log.txt'), 'Not a log file\n');
          
          // Wait and verify no event was received
          setTimeout(() => {
            expect(logEventReceived).toBe(false);
            resolve();
          }, 1000);
        }, 500);
      });
    }, 10000);
  });

  describe('Project Config Watching', () => {
    it('should detect project config changes', async () => {
      const packagePath = path.join(testDir, 'package.json');
      await writeFile(packagePath, JSON.stringify({ name: 'test', version: '1.0.0' }));
      await watcher.start();

      return new Promise((resolve) => {
        watcher.on('project-config-change', (event) => {
          expect(event.type).toBe('project-config-change');
          expect(event.data.config.version).toBe('2.0.0');
          resolve();
        });

        setTimeout(async () => {
          await writeFile(packagePath, JSON.stringify({ name: 'test', version: '2.0.0' }));
        }, 500);
      });
    }, 10000);
  });

  describe('Event Handling', () => {
    it('should register and call event handlers', async () => {
      const handler = vi.fn();
      watcher.on('test-event', handler);

      await watcher.emitEvent('test-event', { type: 'test-event', data: { test: true } });

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith({ type: 'test-event', data: { test: true } });
    });

    it('should support wildcard event handlers', async () => {
      const wildcardHandler = vi.fn();
      watcher.on('*', wildcardHandler);

      await watcher.emitEvent('any-event', { type: 'any-event', data: {} });

      expect(wildcardHandler).toHaveBeenCalledOnce();
    });

    it('should remove event handlers', async () => {
      const handler = vi.fn();
      watcher.on('test-event', handler);
      watcher.off('test-event', handler);

      await watcher.emitEvent('test-event', { type: 'test-event', data: {} });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle errors in event handlers gracefully', async () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const goodHandler = vi.fn();

      watcher.on('test-event', errorHandler);
      watcher.on('test-event', goodHandler);

      await watcher.emitEvent('test-event', { type: 'test-event', data: {} });

      // Both handlers should have been called despite error in first
      expect(errorHandler).toHaveBeenCalled();
      expect(goodHandler).toHaveBeenCalled();
    });
  });

  describe('Custom Watchers', () => {
    it('should add custom watchers', async () => {
      const customPath = path.join(testDir, 'custom');
      await mkdir(customPath, { recursive: true });
      await watcher.start();

      await watcher.addCustomWatch('custom', customPath);
      expect(watcher.watchers.has('custom')).toBe(true);
    });

    it('should remove custom watchers', async () => {
      const customPath = path.join(testDir, 'custom');
      await mkdir(customPath, { recursive: true });
      await watcher.start();

      await watcher.addCustomWatch('custom', customPath);
      expect(watcher.watchers.has('custom')).toBe(true);

      await watcher.removeCustomWatch('custom');
      expect(watcher.watchers.has('custom')).toBe(false);
    });

    it('should emit custom events', async () => {
      const customPath = path.join(testDir, 'custom');
      await mkdir(customPath, { recursive: true });
      await watcher.start();

      await watcher.addCustomWatch('custom', customPath);

      return new Promise((resolve) => {
        watcher.on('custom-custom', (event) => {
          expect(event.type).toBe('custom-custom');
          expect(event.data.event).toBe('add');
          resolve();
        });

        setTimeout(async () => {
          await writeFile(path.join(customPath, 'test.txt'), 'custom file');
        }, 500);
      });
    }, 10000);
  });

  describe('Statistics', () => {
    it('should track watcher statistics', async () => {
      await writeFile(testConfigPath, JSON.stringify({ test: true }));
      await watcher.start();

      const stats = watcher.getStats();
      expect(stats.isActive).toBe(true);
      expect(stats.activeWatchers).toBeGreaterThan(0);
      expect(stats.totalEvents).toBe(0);
    });

    it('should increment statistics on events', async () => {
      await writeFile(testConfigPath, JSON.stringify({ version: '1.0.0' }));
      await watcher.start();

      return new Promise((resolve) => {
        watcher.on('config-change', () => {
          const stats = watcher.getStats();
          expect(stats.configChanges).toBe(1);
          expect(stats.totalEvents).toBe(1);
          expect(stats.lastEvent).toBeDefined();
          resolve();
        });

        setTimeout(async () => {
          await writeFile(testConfigPath, JSON.stringify({ version: '2.0.0' }));
        }, 500);
      });
    }, 10000);
  });

  describe('Utility Methods', () => {
    it('should read last N lines from file', async () => {
      const logFile = path.join(testLogPath, 'multiline.log');
      const lines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`);
      await writeFile(logFile, lines.join('\n'));

      const lastLines = await watcher.readLastLines(logFile, 10);
      const linesArray = lastLines.split('\n').filter(l => l);
      
      expect(linesArray.length).toBeLessThanOrEqual(10);
      expect(linesArray[linesArray.length - 1]).toContain('Line 100');
    });

    it('should handle errors when reading non-existent file', async () => {
      const result = await watcher.readLastLines('/non/existent/file.log', 10);
      expect(result).toBe('');
    });
  });
});

