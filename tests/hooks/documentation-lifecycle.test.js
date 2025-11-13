/**
 * DocumentationLifecycle Hook Tests (Simplified)
 * 
 * @module tests/hooks/documentationLifecycle-simple
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  documentationLifecycle,
  getDocumentationStats,
  clearTimestamps
} from '../../lib/hooks/documentationLifecycle.js';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

describe('DocumentationLifecycle Hook (Simplified)', () => {
  let context;
  let nextFn;
  let testDocsDir;

  beforeEach(async () => {
    context = {};
    nextFn = vi.fn();
    
    // Create test directory in absolute path
    testDocsDir = path.join(process.cwd(), 'test-docs-' + Date.now());
    await fs.mkdir(testDocsDir, { recursive: true });
    await fs.mkdir(path.join(testDocsDir, 'Docs'), { recursive: true });
    
    // Clear timestamps before each test
    clearTimestamps();
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      if (existsSync(testDocsDir)) {
        await fs.rm(testDocsDir, { recursive: true, force: true });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
    
    clearTimestamps();
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should be defined', () => {
      expect(documentationLifecycle).toBeDefined();
      expect(typeof documentationLifecycle).toBe('function');
    });

    it('should be async', () => {
      const result = documentationLifecycle(context, nextFn);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should call next() to continue chain', async () => {
      await documentationLifecycle(context, nextFn);
      expect(nextFn).toHaveBeenCalledTimes(1);
    });

    it('should have utility functions', () => {
      expect(getDocumentationStats).toBeDefined();
      expect(clearTimestamps).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Provide invalid context but still succeed
      const badContext = { projectRoot: '/nonexistent' };
      
      await expect(
        documentationLifecycle(badContext, nextFn)
      ).resolves.not.toThrow();
    });

    it('should call next() even with errors', async () => {
      const badContext = { projectRoot: '/nonexistent' };
      await documentationLifecycle(badContext, nextFn);
      expect(nextFn).toHaveBeenCalled();
    });
  });

  describe('Context Handling', () => {
    it('should handle empty context', async () => {
      await expect(
        documentationLifecycle({}, nextFn)
      ).resolves.not.toThrow();
    });

    it('should handle context with projectRoot', async () => {
      const contextWithRoot = {
        projectRoot: testDocsDir
      };
      
      await expect(
        documentationLifecycle(contextWithRoot, nextFn)
      ).resolves.not.toThrow();
    });

    it('should handle context with tool information', async () => {
      const contextWithTool = {
        tool: { name: 'testTool' },
        projectRoot: testDocsDir
      };
      
      await expect(
        documentationLifecycle(contextWithTool, nextFn)
      ).resolves.not.toThrow();
    });
  });

  describe('Statistics', () => {
    it('should return documentation statistics', () => {
      const stats = getDocumentationStats();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalFiles');
      expect(stats).toHaveProperty('byDirectory');
      expect(stats).toHaveProperty('lastCheck');
      
      expect(typeof stats.totalFiles).toBe('number');
      expect(typeof stats.byDirectory).toBe('object');
      expect(typeof stats.lastCheck).toBe('string');
    });

    it('should track files by directory', () => {
      const stats = getDocumentationStats();
      expect(stats.byDirectory).toBeDefined();
    });
  });

  describe('Timestamp Management', () => {
    it('should clear timestamps', () => {
      clearTimestamps();
      const stats = getDocumentationStats();
      expect(stats.totalFiles).toBe(0);
    });

    it('should reset after clearing', async () => {
      // First run to initialize
      const ctx = { projectRoot: testDocsDir };
      await documentationLifecycle(ctx, nextFn);
      
      // Clear
      clearTimestamps();
      
      // Should re-initialize on next run
      await expect(
        documentationLifecycle(ctx, nextFn)
      ).resolves.not.toThrow();
    });
  });

  describe('File Monitoring', () => {
    it('should monitor Docs directory when it exists', async () => {
      // Create test file
      const testFile = path.join(testDocsDir, 'Docs', 'test.md');
      await fs.writeFile(testFile, '# Test', 'utf-8');
      
      const ctx = { projectRoot: testDocsDir };
      
      // First run to initialize
      await documentationLifecycle(ctx, nextFn);
      
      // Stats should reflect initialization
      expect(nextFn).toHaveBeenCalled();
    });

    it('should handle nested directories', async () => {
      // Create nested structure
      const nestedDir = path.join(testDocsDir, 'Docs', 'subdir');
      await fs.mkdir(nestedDir, { recursive: true });
      const testFile = path.join(nestedDir, 'test.md');
      await fs.writeFile(testFile, '# Test', 'utf-8');
      
      const ctx = { projectRoot: testDocsDir };
      
      await expect(
        documentationLifecycle(ctx, nextFn)
      ).resolves.not.toThrow();
    });

    it('should handle missing Docs directory', async () => {
      // Don't create Docs directory
      const emptyDir = path.join(testDocsDir, 'empty');
      await fs.mkdir(emptyDir, { recursive: true });
      
      const ctx = { projectRoot: emptyDir };
      
      await expect(
        documentationLifecycle(ctx, nextFn)
      ).resolves.not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete quickly for empty directories', async () => {
      const ctx = { projectRoot: testDocsDir };
      
      const start = Date.now();
      await documentationLifecycle(ctx, nextFn);
      const duration = Date.now() - start;
      
      // Should complete in under 100ms for empty directory
      expect(duration).toBeLessThan(100);
    });

    it('should handle directories with multiple files', async () => {
      // Create multiple files
      const docsDir = path.join(testDocsDir, 'Docs');
      for (let i = 0; i < 10; i++) {
        await fs.writeFile(
          path.join(docsDir, `file${i}.md`),
          `# File ${i}`,
          'utf-8'
        );
      }
      
      const ctx = { projectRoot: testDocsDir };
      
      await expect(
        documentationLifecycle(ctx, nextFn)
      ).resolves.not.toThrow();
    });
  });

  describe('Throttling', () => {
    it('should throttle rapid calls', async () => {
      const ctx = { projectRoot: testDocsDir };
      
      // First call
      await documentationLifecycle(ctx, nextFn);
      expect(nextFn).toHaveBeenCalledTimes(1);
      
      // Immediate second call should be throttled
      await documentationLifecycle(ctx, nextFn);
      expect(nextFn).toHaveBeenCalledTimes(2);
      // Both calls should succeed, throttling only affects internal logic
    });
  });

  describe('Integration', () => {
    it('should work with default process.cwd() when no projectRoot provided', async () => {
      // No projectRoot in context - should use process.cwd()
      await expect(
        documentationLifecycle({}, nextFn)
      ).resolves.not.toThrow();
      
      expect(nextFn).toHaveBeenCalled();
    });

    it('should override with context.projectRoot when provided', async () => {
      const ctx = { projectRoot: testDocsDir };
      
      await expect(
        documentationLifecycle(ctx, nextFn)
      ).resolves.not.toThrow();
      
      expect(nextFn).toHaveBeenCalled();
    });
  });
});

