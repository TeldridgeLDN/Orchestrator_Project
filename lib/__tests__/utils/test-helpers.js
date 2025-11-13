/**
 * Test Helpers for Error Handling Tests
 * 
 * Provides utilities for testing error handling, logging, and recovery.
 */

import { createLogger } from '../../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

/**
 * Create a test logger that captures logs in memory
 */
export function createTestLogger() {
  const logs = [];
  
  const logger = createLogger({
    enableConsole: false,
    enableFile: false,
    level: 0 // DEBUG - capture everything
  });

  // Intercept _log method
  const originalLog = logger._log.bind(logger);
  logger._log = async function(level, message, data = {}) {
    logs.push({
      level,
      levelName: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'][level],
      message,
      data,
      timestamp: new Date().toISOString()
    });
    return originalLog(level, message, data);
  };

  return { logger, logs };
}

/**
 * Create a temporary log file for testing
 */
export async function createTempLogFile() {
  const tempDir = tmpdir();
  const logFile = path.join(tempDir, `test-log-${Date.now()}.log`);
  return logFile;
}

/**
 * Write test logs to a file
 */
export async function writeTestLogs(logFile, entries) {
  const lines = entries.map(entry => JSON.stringify(entry)).join('\n');
  await fs.writeFile(logFile, lines, 'utf-8');
}

/**
 * Clean up test log file
 */
export async function cleanupLogFile(logFile) {
  try {
    await fs.unlink(logFile);
    // Also clean up rotated files
    for (let i = 1; i <= 5; i++) {
      try {
        await fs.unlink(`${logFile}.${i}`);
      } catch (e) {
        // Ignore
      }
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Simulate an async operation that fails
 */
export async function failingOperation(errorMessage = 'Test error') {
  throw new Error(errorMessage);
}

/**
 * Simulate an async operation that fails N times then succeeds
 */
export function createFlakeyOperation(failCount) {
  let attempts = 0;
  
  return async function flakeyOperation() {
    attempts++;
    if (attempts <= failCount) {
      const error = new Error(`Attempt ${attempts} failed`);
      error.code = 'EAGAIN';
      throw error;
    }
    return { success: true, attempts };
  };
}

/**
 * Simulate file system errors
 */
export class MockFileSystem {
  constructor() {
    this.failureMode = null;
    this.callCount = 0;
  }

  setFailureMode(mode) {
    this.failureMode = mode;
    this.callCount = 0;
  }

  async readFile(path) {
    this.callCount++;
    
    if (this.failureMode === 'ENOENT') {
      const error = new Error(`ENOENT: no such file or directory, open '${path}'`);
      error.code = 'ENOENT';
      throw error;
    }
    
    if (this.failureMode === 'EACCES') {
      const error = new Error(`EACCES: permission denied, open '${path}'`);
      error.code = 'EACCES';
      throw error;
    }
    
    if (this.failureMode === 'EAGAIN') {
      if (this.callCount <= 2) {
        const error = new Error('EAGAIN: resource temporarily unavailable');
        error.code = 'EAGAIN';
        throw error;
      }
    }
    
    return 'test file content';
  }

  async writeFile(path, data) {
    this.callCount++;
    
    if (this.failureMode === 'ENOSPC') {
      const error = new Error('ENOSPC: no space left on device');
      error.code = 'ENOSPC';
      throw error;
    }
    
    if (this.failureMode === 'EACCES') {
      const error = new Error(`EACCES: permission denied, open '${path}'`);
      error.code = 'EACCES';
      throw error;
    }
    
    return true;
  }
}

/**
 * Simulate network errors
 */
export class MockNetwork {
  constructor() {
    this.failureMode = null;
    this.callCount = 0;
  }

  setFailureMode(mode) {
    this.failureMode = mode;
    this.callCount = 0;
  }

  async fetch(url) {
    this.callCount++;
    
    if (this.failureMode === 'ECONNREFUSED') {
      const error = new Error('connect ECONNREFUSED 127.0.0.1:8080');
      error.code = 'ECONNREFUSED';
      throw error;
    }
    
    if (this.failureMode === 'ETIMEDOUT') {
      const error = new Error('Request timeout');
      error.code = 'ETIMEDOUT';
      throw error;
    }
    
    if (this.failureMode === 'ENOTFOUND') {
      const error = new Error('getaddrinfo ENOTFOUND example.com');
      error.code = 'ENOTFOUND';
      throw error;
    }
    
    if (this.failureMode === 'TRANSIENT') {
      if (this.callCount <= 2) {
        const error = new Error('Network temporary failure');
        error.code = 'ECONNRESET';
        throw error;
      }
    }
    
    return { status: 200, data: 'success' };
  }
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(condition, timeout = 1000, interval = 50) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Timeout waiting for condition');
}

/**
 * Capture console output
 */
export function captureConsole() {
  const output = {
    log: [],
    error: [],
    warn: []
  };

  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args) => {
    output.log.push(args.join(' '));
    originalLog(...args);
  };

  console.error = (...args) => {
    output.error.push(args.join(' '));
    originalError(...args);
  };

  console.warn = (...args) => {
    output.warn.push(args.join(' '));
    originalWarn(...args);
  };

  return {
    output,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }
  };
}

/**
 * Create a mock error with specific code
 */
export function createMockError(code, message = 'Mock error') {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Assert error has expected properties
 */
export function assertError(error, expected) {
  if (expected.code && error.code !== expected.code) {
    throw new Error(`Expected error code "${expected.code}", got "${error.code}"`);
  }
  
  if (expected.message && !error.message.includes(expected.message)) {
    throw new Error(`Expected error message to include "${expected.message}", got "${error.message}"`);
  }
  
  if (expected.severity && error.severity !== expected.severity) {
    throw new Error(`Expected severity "${expected.severity}", got "${error.severity}"`);
  }
  
  if (expected.recoverable !== undefined && error.recoverable !== expected.recoverable) {
    throw new Error(`Expected recoverable to be ${expected.recoverable}, got ${error.recoverable}`);
  }
}

/**
 * Sleep for testing
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  createTestLogger,
  createTempLogFile,
  writeTestLogs,
  cleanupLogFile,
  failingOperation,
  createFlakeyOperation,
  MockFileSystem,
  MockNetwork,
  waitFor,
  captureConsole,
  createMockError,
  assertError,
  sleep
};

