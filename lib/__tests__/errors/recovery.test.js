/**
 * Recovery Mechanisms Tests
 */

import { describe, it, expect } from 'vitest';
import {
  retryWithBackoff,
  retryFileOperation,
  retryNetworkOperation,
  attemptRecovery,
  withGracefulDegradation,
  CircuitBreaker
} from '../../utils/errors/recovery.js';
import { createFlakeyOperation, MockFileSystem, MockNetwork } from '../utils/test-helpers.js';

describe('Recovery Mechanisms', () => {
  describe('retryWithBackoff', () => {
    it('should retry until success', async () => {
      const flakey = createFlakeyOperation(2);
      const result = await retryWithBackoff(flakey, { maxAttempts: 5, initialDelayMs: 10 });
      
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
    });

    it('should throw after max attempts', async () => {
      const flakey = createFlakeyOperation(10);
      
      await expect(
        retryWithBackoff(flakey, { maxAttempts: 3, initialDelayMs: 10 })
      ).rejects.toThrow();
    });
  });

  describe('retryFileOperation', () => {
    it('should retry transient file errors', async () => {
      const mockFs = new MockFileSystem();
      mockFs.setFailureMode('EAGAIN');
      
      const result = await retryFileOperation(
        async () => await mockFs.readFile('/test'),
        { maxAttempts: 5, initialDelayMs: 10 }
      );
      
      expect(result).toBe('test file content');
      expect(mockFs.callCount).toBe(3);
    });
  });

  describe('Circuit Breaker', () => {
    it('should open after threshold failures', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3, resetTimeout: 1000 });
      
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Service down');
          });
        } catch (e) {
          // Expected
        }
      }
      
      const state = breaker.getState();
      expect(state.state).toBe('open');
    });
  });

  describe('withGracefulDegradation', () => {
    it('should return default on error', async () => {
      const result = await withGracefulDegradation(
        async () => {
          throw new Error('Failed');
        },
        { defaultValue: 'fallback' }
      );
      
      expect(result).toBe('fallback');
    });
  });
});

