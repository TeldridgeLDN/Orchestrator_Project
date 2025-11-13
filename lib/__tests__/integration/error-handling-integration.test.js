/**
 * Error Handling Integration Tests
 * 
 * End-to-end tests for error handling workflows.
 */

import { describe, it, expect } from 'vitest';
import { createError, wrapError } from '../../utils/errors/custom-errors.js';
import { handleError, safeExecute } from '../../utils/errors/error-handler.js';
import { retryWithBackoff, attemptRecovery } from '../../utils/errors/recovery.js';
import { createTestLogger } from '../utils/test-helpers.js';

describe('Error Handling Integration', () => {
  describe('Complete error workflow', () => {
    it('should handle error with logging and recovery', async () => {
      const { logger, logs } = createTestLogger();
      let recoveryCalled = false;
      
      const error = createError('UTIL-FS-006', { path: '/test.txt' });
      
      const result = await handleError(error, {
        displayToUser: false,
        attemptRecovery: true,
        context: {
          fallback: async () => {
            recoveryCalled = true;
            return 'default content';
          }
        }
      });
      
      expect(recoveryCalled).toBe(true);
      expect(result).toBe('default content');
      
      logger.destroy();
    });
  });

  describe('Retry with error handling', () => {
    it('should retry and log attempts', async () => {
      const { logger, logs } = createTestLogger();
      let attempts = 0;
      
      const result = await retryWithBackoff(
        async () => {
          attempts++;
          if (attempts < 3) {
            throw createError('NET-CONN-001', { url: 'http://test.com' });
          }
          return 'success';
        },
        {
          maxAttempts: 5,
          initialDelayMs: 10,
          onRetry: (error, attempt) => {
            logger.warn('Retry attempt', { attempt, error: error.message });
          }
        }
      );
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
      expect(logs.filter(l => l.message === 'Retry attempt').length).toBe(2);
      
      logger.destroy();
    });
  });

  describe('Safe execution with graceful degradation', () => {
    it('should execute safely and log errors', async () => {
      const { logger, logs } = createTestLogger();
      
      const result = await safeExecute(
        async () => {
          throw createError('UTIL-MET-001', { operation: 'record-metrics' });
        },
        {
          operation: 'metrics-recording',
          displayToUser: false
        }
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      logger.destroy();
    });
  });

  describe('Error wrapping and context preservation', () => {
    it('should wrap native errors and preserve context', async () => {
      const nativeError = new Error('ENOENT: no such file');
      nativeError.code = 'ENOENT';
      
      const wrapped = wrapError(nativeError, 'UTIL-FS-006', {
        path: '/missing/file.txt',
        operation: 'read-config'
      });
      
      expect(wrapped.code).toBe('UTIL-FS-006');
      expect(wrapped.originalError).toBe(nativeError);
      expect(wrapped.context.path).toBe('/missing/file.txt');
      expect(wrapped.context.operation).toBe('read-config');
    });
  });

  describe('Multi-layer error handling', () => {
    it('should handle errors through multiple layers', async () => {
      const { logger, logs } = createTestLogger();
      
      async function layer3() {
        throw new Error('Database connection failed');
      }
      
      async function layer2() {
        try {
          return await layer3();
        } catch (error) {
          throw wrapError(error, 'UTIL-FS-006', { layer: 'data-access' });
        }
      }
      
      async function layer1() {
        const result = await safeExecute(
          async () => await layer2(),
          { operation: 'fetch-data' }
        );
        
        if (!result.success) {
          return await attemptRecovery(result.error, {
            defaultValue: [],
            operation: 'fetch-data'
          });
        }
        
        return result.result;
      }
      
      const recovery = await layer1();
      
      expect(recovery.recovered).toBe(true);
      expect(recovery.result).toEqual([]);
      
      logger.destroy();
    });
  });
});

