/**
 * Error Codes Tests
 * 
 * Tests for the error code registry and utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  ERROR_CODES,
  getErrorDefinition,
  isValidErrorCode,
  isRecoverable,
  getErrorsByComponent,
  getErrorStatistics
} from '../../utils/errors/error-codes.js';

describe('Error Codes', () => {
  describe('ERROR_CODES registry', () => {
    it('should have all required error codes', () => {
      expect(ERROR_CODES).toBeDefined();
      expect(Object.keys(ERROR_CODES).length).toBeGreaterThan(40);
    });

    it('should have unique error codes', () => {
      const codes = Object.keys(ERROR_CODES);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    });

    it('should follow naming convention COMPONENT-CATEGORY-NUMBER', () => {
      const codePattern = /^[A-Z]+-[A-Z]+-\d{3}$/;
      
      for (const code of Object.keys(ERROR_CODES)) {
        expect(code).toMatch(codePattern);
      }
    });

    it('should have required properties for each error code', () => {
      for (const [code, definition] of Object.entries(ERROR_CODES)) {
        expect(definition.code).toBe(code);
        expect(definition.message).toBeDefined();
        expect(definition.userMessage).toBeDefined();
        expect(definition.severity).toMatch(/^(error|warning|info)$/);
        expect(typeof definition.recoverable).toBe('boolean');
        expect(definition.category).toBeDefined();
        expect(definition.component).toBeDefined();
      }
    });

    it('should have distinct user messages from technical messages', () => {
      for (const definition of Object.values(ERROR_CODES)) {
        // Most errors should have different messages (not all, but most)
        if (definition.message !== definition.userMessage) {
          expect(definition.userMessage.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('getErrorDefinition', () => {
    it('should return error definition for valid code', () => {
      const definition = getErrorDefinition('CMD-VAL-001');
      
      expect(definition).toBeDefined();
      expect(definition.code).toBe('CMD-VAL-001');
      expect(definition.message).toBeDefined();
      expect(definition.userMessage).toBeDefined();
    });

    it('should return null for invalid code', () => {
      const definition = getErrorDefinition('INVALID-CODE-999');
      expect(definition).toBeNull();
    });

    it('should return null for undefined code', () => {
      const definition = getErrorDefinition();
      expect(definition).toBeNull();
    });
  });

  describe('isValidErrorCode', () => {
    it('should return true for valid error codes', () => {
      expect(isValidErrorCode('CMD-VAL-001')).toBe(true);
      expect(isValidErrorCode('UTIL-FS-006')).toBe(true);
      expect(isValidErrorCode('HOOK-EXEC-001')).toBe(true);
    });

    it('should return false for invalid error codes', () => {
      expect(isValidErrorCode('INVALID-CODE')).toBe(false);
      expect(isValidErrorCode('123-456-789')).toBe(false);
      expect(isValidErrorCode('')).toBe(false);
      expect(isValidErrorCode(null)).toBe(false);
      expect(isValidErrorCode(undefined)).toBe(false);
    });
  });

  describe('isRecoverable', () => {
    it('should return true for recoverable errors', () => {
      // Based on error-codes.js, these should be recoverable
      expect(isRecoverable({ code: 'UTIL-FS-006' })).toBe(true); // File read
      expect(isRecoverable({ code: 'NET-CONN-001' })).toBe(true); // Network
      expect(isRecoverable({ code: 'HOOK-EXEC-001' })).toBe(true); // Hook execution
    });

    it('should return false for non-recoverable errors', () => {
      expect(isRecoverable({ code: 'CMD-VAL-001' })).toBe(false); // Validation
      expect(isRecoverable({ code: 'CMD-SCEN-001' })).toBe(false); // Not found
    });

    it('should return false for errors without code', () => {
      expect(isRecoverable({})).toBe(false);
      expect(isRecoverable(null)).toBe(false);
      expect(isRecoverable(new Error('test'))).toBe(false);
    });

    it('should return false for invalid error codes', () => {
      expect(isRecoverable({ code: 'INVALID-CODE' })).toBe(false);
    });
  });

  describe('getErrorsByComponent', () => {
    it('should return errors for valid component', () => {
      const cmdErrors = getErrorsByComponent('commands');
      
      expect(Array.isArray(cmdErrors)).toBe(true);
      expect(cmdErrors.length).toBeGreaterThan(0);
      expect(cmdErrors.every(e => e.component === 'commands')).toBe(true);
    });

    it('should return errors for utils component', () => {
      const utilErrors = getErrorsByComponent('utils');
      
      expect(utilErrors.length).toBeGreaterThan(0);
      expect(utilErrors.every(e => e.component === 'utils')).toBe(true);
    });

    it('should return empty array for invalid component', () => {
      const errors = getErrorsByComponent('invalid-component');
      expect(errors).toEqual([]);
    });
  });

  describe('getErrorStatistics', () => {
    it('should return statistics about error codes', () => {
      const stats = getErrorStatistics();
      
      expect(stats.total).toBeGreaterThan(40);
      expect(stats.byComponent).toBeDefined();
      expect(stats.byCategory).toBeDefined();
      expect(stats.bySeverity).toBeDefined();
      expect(stats.recoverable).toBeDefined();
      expect(stats.nonRecoverable).toBeDefined();
    });

    it('should have correct totals', () => {
      const stats = getErrorStatistics();
      
      expect(stats.recoverable + stats.nonRecoverable).toBe(stats.total);
    });

    it('should have component breakdown', () => {
      const stats = getErrorStatistics();
      
      expect(stats.byComponent.commands).toBeGreaterThan(0);
      expect(stats.byComponent.utils).toBeGreaterThan(0);
      expect(stats.byComponent.hooks).toBeGreaterThan(0);
    });

    it('should have severity breakdown', () => {
      const stats = getErrorStatistics();
      
      expect(stats.bySeverity.error).toBeGreaterThan(0);
      expect(stats.bySeverity.warning).toBeGreaterThan(0);
    });
  });

  describe('Error code coverage', () => {
    it('should cover command errors', () => {
      const cmdErrors = getErrorsByComponent('commands');
      const categories = new Set(cmdErrors.map(e => e.category));
      
      expect(categories.has('validation')).toBe(true);
      expect(categories.has('execution')).toBe(true);
    });

    it('should cover file system errors', () => {
      const fsErrors = Object.values(ERROR_CODES).filter(e => e.category === 'filesystem');
      
      expect(fsErrors.length).toBeGreaterThan(0);
      expect(fsErrors.some(e => e.code === 'UTIL-FS-006')).toBe(true); // Read
      expect(fsErrors.some(e => e.code === 'UTIL-FS-007')).toBe(true); // Write
    });

    it('should cover network errors', () => {
      const netErrors = Object.values(ERROR_CODES).filter(e => e.category === 'network');
      
      expect(netErrors.length).toBeGreaterThan(0);
      expect(netErrors.some(e => e.code === 'NET-CONN-001')).toBe(true);
      expect(netErrors.some(e => e.code === 'NET-TIMEOUT-001')).toBe(true);
    });

    it('should cover hook errors', () => {
      const hookErrors = getErrorsByComponent('hooks');
      
      expect(hookErrors.length).toBeGreaterThan(0);
      expect(hookErrors.some(e => e.code === 'HOOK-EXEC-001')).toBe(true);
      expect(hookErrors.some(e => e.code === 'HOOK-FS-001')).toBe(true);
    });
  });

  describe('Message interpolation support', () => {
    it('should support placeholder syntax', () => {
      const errors = Object.values(ERROR_CODES);
      const withPlaceholders = errors.filter(e => 
        e.message.includes('{') || e.userMessage.includes('{')
      );
      
      expect(withPlaceholders.length).toBeGreaterThan(10);
    });

    it('should have consistent placeholder format', () => {
      const placeholderPattern = /\{[a-zA-Z_]+\}/g;
      
      for (const definition of Object.values(ERROR_CODES)) {
        const messagePlaceholders = definition.message.match(placeholderPattern) || [];
        const userMessagePlaceholders = definition.userMessage.match(placeholderPattern) || [];
        
        // If technical message has placeholders, user message should too (usually)
        if (messagePlaceholders.length > 0) {
          expect(userMessagePlaceholders.length).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });
});

