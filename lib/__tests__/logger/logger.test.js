/**
 * Logger Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createLogger, LogLevel } from '../../utils/logger.js';
import { createTestLogger, createTempLogFile, cleanupLogFile } from '../utils/test-helpers.js';

describe('Logger', () => {
  describe('createLogger', () => {
    it('should create logger with default options', () => {
      const logger = createLogger();
      
      expect(logger).toBeDefined();
      expect(logger.level).toBeDefined();
      expect(logger.sessionId).toBeDefined();
    });

    it('should accept custom options', () => {
      const logger = createLogger({
        level: LogLevel.DEBUG,
        context: { app: 'test' }
      });
      
      expect(logger.level).toBe(LogLevel.DEBUG);
      expect(logger.context.app).toBe('test');
    });
  });

  describe('logging methods', () => {
    let testLogger, logs;

    beforeEach(() => {
      const setup = createTestLogger();
      testLogger = setup.logger;
      logs = setup.logs;
    });

    afterEach(() => {
      testLogger.destroy();
    });

    it('should log debug messages', async () => {
      await testLogger.debug('Debug message', { test: true });
      
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[0].message).toBe('Debug message');
      expect(logs[0].data.test).toBe(true);
    });

    it('should log info messages', async () => {
      await testLogger.info('Info message');
      
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
    });

    it('should log errors with aggregation', async () => {
      await testLogger.error('Error occurred', new Error('test'));
      await testLogger.error('Error occurred', new Error('test'));
      
      expect(logs.length).toBe(1); // Aggregated
    });
  });

  describe('performance tracking', () => {
    let testLogger, logs;

    beforeEach(() => {
      const setup = createTestLogger();
      testLogger = setup.logger;
      logs = setup.logs;
    });

    afterEach(() => {
      testLogger.destroy();
    });

    it('should track performance metrics', async () => {
      await testLogger.performance('test-op', 150, { status: 'success' });
      
      const perfLog = logs.find(l => l.data.performanceMetric);
      expect(perfLog).toBeDefined();
      expect(perfLog.data.durationMs).toBe(150);
    });

    it('should time operations', async () => {
      const result = await testLogger.time('test-op', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'done';
      });
      
      expect(result).toBe('done');
      const perfLog = logs.find(l => l.message.includes('Performance'));
      expect(perfLog).toBeDefined();
      expect(perfLog.data.durationMs).toBeGreaterThanOrEqual(50);
    });
  });

  describe('metrics', () => {
    it('should track logging metrics', async () => {
      const { logger } = createTestLogger();
      
      await logger.info('test 1');
      await logger.error('test 2', new Error('test'));
      await logger.warn('test 3');
      
      const metrics = logger.getMetrics();
      expect(metrics.logCount).toBe(3);
      expect(metrics.errorCount).toBe(1);
      expect(metrics.warningCount).toBe(1);
      
      logger.destroy();
    });

    it('should reset metrics', async () => {
      const { logger } = createTestLogger();
      
      await logger.info('test');
      logger.resetMetrics();
      
      const metrics = logger.getMetrics();
      expect(metrics.logCount).toBe(0);
      
      logger.destroy();
    });
  });

  describe('child loggers', () => {
    it('should create child with additional context', () => {
      const parent = createLogger({ context: { app: 'test' } });
      const child = parent.child({ requestId: '123' });
      
      expect(child.context.app).toBe('test');
      expect(child.context.requestId).toBe('123');
      expect(child.sessionId).toBe(parent.sessionId);
      
      parent.destroy();
      child.destroy();
    });
  });
});

