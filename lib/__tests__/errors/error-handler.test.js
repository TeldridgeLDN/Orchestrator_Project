/**
 * Error Handler Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  handleError,
  displayError,
  createCommandErrorHandler,
  safeExecute,
  executeWithRetry
} from '../../utils/errors/error-handler.js';
import { createError, FileNotFoundError } from '../../utils/errors/custom-errors.js';
import { createTestLogger, captureConsole } from '../utils/test-helpers.js';

describe('Error Handler', () => {
  let consoleCapture;

  beforeEach(() => {
    consoleCapture = captureConsole();
  });

  afterEach(() => {
    consoleCapture.restore();
  });

  describe('handleError', () => {
    it('should handle custom error', async () => {
      const error = createError('CMD-VAL-001', { details: 'test' });
      
      await handleError(error, {
        displayToUser: false,
        attemptRecovery: false
      });
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should attempt recovery for recoverable errors', async () => {
      const error = createError('UTIL-FS-006', { path: '/test' });
      let recoveryCalled = false;
      
      const result = await handleError(error, {
        displayToUser: false,
        attemptRecovery: true,
        context: {
          fallback: async () => {
            recoveryCalled = true;
            return 'recovered';
          }
        }
      });
      
      expect(recoveryCalled).toBe(true);
      expect(result).toBe('recovered');
    });
  });

  describe('createCommandErrorHandler', () => {
    it('should create error handler', () => {
      const handler = createCommandErrorHandler({
        commandName: 'test-command',
        verbose: false,
        exitCode: 1
      });
      
      expect(typeof handler).toBe('function');
    });
  });

  describe('safeExecute', () => {
    it('should return success for successful operation', async () => {
      const result = await safeExecute(async () => {
        return 'success';
      });
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
    });

    it('should return error for failed operation', async () => {
      const result = await safeExecute(async () => {
        throw new Error('failed');
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('failed');
    });
  });

  describe('executeWithRetry', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      
      const result = await executeWithRetry(
        async () => {
          attempts++;
          if (attempts < 2) {
            const error = new Error('Temporary failure');
            error.code = 'EAGAIN';
            throw error;
          }
          return 'success';
        },
        { maxAttempts: 3, initialDelayMs: 10 }
      );
      
      expect(result.success).toBe(true);
      expect(attempts).toBe(2);
    });
  });
});

