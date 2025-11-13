/**
 * Custom Errors Tests
 * 
 * Tests for custom error classes and error creation utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  BaseError,
  FileSystemError,
  FileNotFoundError,
  PermissionError,
  NetworkError,
  ValidationError,
  ConfigurationError,
  ProjectNotFoundError,
  ScenarioNotFoundError,
  wrapError,
  createError,
  isRecoverable,
  getErrorSeverity
} from '../../utils/errors/custom-errors.js';

describe('Custom Error Classes', () => {
  describe('BaseError', () => {
    it('should create a basic error', () => {
      const error = new BaseError('Test message', 'TEST-001');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseError);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST-001');
      expect(error.name).toBe('BaseError');
    });

    it('should store context data', () => {
      const error = new BaseError('Test', 'TEST-001', {
        userId: '123',
        operation: 'test'
      });
      
      expect(error.context).toEqual({
        userId: '123',
        operation: 'test'
      });
    });

    it('should have stack trace', () => {
      const error = new BaseError('Test', 'TEST-001');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('BaseError');
    });

    it('should format display message with error code', () => {
      const error = new BaseError('Test message', 'TEST-001');
      const message = error.getDisplayMessage(true);
      
      expect(message).toContain('[TEST-001]');
      expect(message).toContain('Test message');
    });

    it('should format display message without error code', () => {
      const error = new BaseError('Test message', 'TEST-001');
      const message = error.getDisplayMessage(false);
      
      expect(message).not.toContain('[TEST-001]');
      expect(message).toBe('Test message');
    });
  });

  describe('FileSystemError', () => {
    it('should create file system error', () => {
      const error = new FileSystemError('Failed to read', 'UTIL-FS-006');
      
      expect(error).toBeInstanceOf(FileSystemError);
      expect(error).toBeInstanceOf(BaseError);
      expect(error.name).toBe('FileSystemError');
      expect(error.code).toBe('UTIL-FS-006');
    });

    it('should be recoverable by default', () => {
      const error = new FileSystemError('Test', 'UTIL-FS-006');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('FileNotFoundError', () => {
    it('should create file not found error', () => {
      const error = new FileNotFoundError('/path/to/file');
      
      expect(error).toBeInstanceOf(FileNotFoundError);
      expect(error).toBeInstanceOf(FileSystemError);
      expect(error.message).toContain('/path/to/file');
      expect(error.code).toBe('UTIL-FS-001');
    });

    it('should be non-recoverable', () => {
      const error = new FileNotFoundError('/test');
      expect(error.recoverable).toBe(false);
    });
  });

  describe('PermissionError', () => {
    it('should create permission error', () => {
      const error = new PermissionError('/path/to/file');
      
      expect(error).toBeInstanceOf(PermissionError);
      expect(error.message).toContain('/path/to/file');
      expect(error.code).toBe('UTIL-FS-002');
    });

    it('should be non-recoverable', () => {
      const error = new PermissionError('/test');
      expect(error.recoverable).toBe(false);
    });
  });

  describe('NetworkError', () => {
    it('should create network error', () => {
      const error = new NetworkError('Connection failed', 'NET-CONN-001');
      
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.name).toBe('NetworkError');
      expect(error.code).toBe('NET-CONN-001');
    });

    it('should be recoverable by default', () => {
      const error = new NetworkError('Test', 'NET-CONN-001');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid input', 'CMD-VAL-001');
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe('ValidationError');
    });

    it('should be non-recoverable', () => {
      const error = new ValidationError('Test', 'CMD-VAL-001');
      expect(error.recoverable).toBe(false);
    });
  });

  describe('ProjectNotFoundError', () => {
    it('should create project not found error', () => {
      const error = new ProjectNotFoundError('my-project');
      
      expect(error).toBeInstanceOf(ProjectNotFoundError);
      expect(error.message).toContain('my-project');
      expect(error.code).toBe('CMD-PROJ-001');
    });
  });

  describe('ScenarioNotFoundError', () => {
    it('should create scenario not found error', () => {
      const error = new ScenarioNotFoundError('my-scenario');
      
      expect(error).toBeInstanceOf(ScenarioNotFoundError);
      expect(error.message).toContain('my-scenario');
      expect(error.code).toBe('CMD-SCEN-001');
    });
  });
});

describe('Error Creation Utilities', () => {
  describe('createError', () => {
    it('should create error with valid code', () => {
      const error = createError('CMD-VAL-001', { argument: 'test' });
      
      expect(error).toBeInstanceOf(BaseError);
      expect(error.code).toBe('CMD-VAL-001');
      expect(error.context).toEqual({ argument: 'test' });
    });

    it('should interpolate context into message', () => {
      const error = createError('UTIL-FS-001', { path: '/my/file.txt' });
      
      expect(error.message).toContain('/my/file.txt');
    });

    it('should use user message', () => {
      const error = createError('CMD-VAL-001', { details: 'missing arg' });
      
      expect(error.userMessage).toBeDefined();
      expect(error.userMessage).toContain('missing arg');
    });

    it('should throw for invalid error code', () => {
      expect(() => {
        createError('INVALID-CODE-999');
      }).toThrow();
    });
  });

  describe('wrapError', () => {
    it('should wrap native ENOENT error', () => {
      const nativeError = new Error('ENOENT: no such file');
      nativeError.code = 'ENOENT';
      
      const wrapped = wrapError(nativeError, 'UTIL-FS-006', { path: '/test' });
      
      expect(wrapped).toBeInstanceOf(BaseError);
      expect(wrapped.code).toBe('UTIL-FS-006');
      expect(wrapped.originalError).toBe(nativeError);
      expect(wrapped.context.path).toBe('/test');
    });

    it('should wrap native EACCES error', () => {
      const nativeError = new Error('EACCES: permission denied');
      nativeError.code = 'EACCES';
      
      const wrapped = wrapError(nativeError, 'UTIL-FS-002');
      
      expect(wrapped).toBeInstanceOf(PermissionError);
      expect(wrapped.code).toBe('UTIL-FS-002');
    });

    it('should wrap native ECONNREFUSED error', () => {
      const nativeError = new Error('connect ECONNREFUSED');
      nativeError.code = 'ECONNREFUSED';
      
      const wrapped = wrapError(nativeError, 'NET-CONN-001');
      
      expect(wrapped).toBeInstanceOf(NetworkError);
      expect(wrapped.code).toBe('NET-CONN-001');
    });

    it('should preserve original stack trace', () => {
      const nativeError = new Error('Test error');
      const wrapped = wrapError(nativeError);
      
      expect(wrapped.originalError).toBe(nativeError);
      expect(wrapped.originalError.stack).toBeDefined();
    });

    it('should return error as-is if already wrapped', () => {
      const baseError = new BaseError('Test', 'TEST-001');
      const wrapped = wrapError(baseError);
      
      expect(wrapped).toBe(baseError);
    });

    it('should handle error without code', () => {
      const error = new Error('Generic error');
      const wrapped = wrapError(error);
      
      expect(wrapped).toBeInstanceOf(BaseError);
      expect(wrapped.code).toBeDefined();
    });
  });
});

describe('Error Utility Functions', () => {
  describe('isRecoverable', () => {
    it('should return true for recoverable errors', () => {
      const error = new NetworkError('Test', 'NET-CONN-001');
      error.recoverable = true;
      
      expect(isRecoverable(error)).toBe(true);
    });

    it('should return false for non-recoverable errors', () => {
      const error = new ValidationError('Test', 'CMD-VAL-001');
      error.recoverable = false;
      
      expect(isRecoverable(error)).toBe(false);
    });

    it('should check error code if recoverable flag not set', () => {
      const error = { code: 'UTIL-FS-006' };
      expect(isRecoverable(error)).toBe(true);
    });

    it('should return false for non-error objects', () => {
      expect(isRecoverable(null)).toBe(false);
      expect(isRecoverable(undefined)).toBe(false);
      expect(isRecoverable({})).toBe(false);
    });
  });

  describe('getErrorSeverity', () => {
    it('should return error severity from error code', () => {
      const error = createError('CMD-VAL-001');
      expect(getErrorSeverity(error)).toBe('error');
    });

    it('should return warning severity for warning errors', () => {
      const error = createError('UTIL-CFG-003');
      expect(getErrorSeverity(error)).toBe('warning');
    });

    it('should default to error for unknown codes', () => {
      const error = { code: 'UNKNOWN-CODE' };
      expect(getErrorSeverity(error)).toBe('error');
    });
  });
});

describe('Error Inheritance', () => {
  it('should maintain proper inheritance chain', () => {
    const error = new FileNotFoundError('/test');
    
    expect(error instanceof Error).toBe(true);
    expect(error instanceof BaseError).toBe(true);
    expect(error instanceof FileSystemError).toBe(true);
    expect(error instanceof FileNotFoundError).toBe(true);
  });

  it('should allow instanceof checks', () => {
    const fsError = new FileSystemError('Test', 'UTIL-FS-006');
    const netError = new NetworkError('Test', 'NET-CONN-001');
    
    expect(fsError instanceof FileSystemError).toBe(true);
    expect(fsError instanceof NetworkError).toBe(false);
    expect(netError instanceof NetworkError).toBe(true);
    expect(netError instanceof FileSystemError).toBe(false);
  });
});

