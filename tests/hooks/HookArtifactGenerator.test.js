/**
 * Hook Artifact Generator Tests
 * 
 * Tests the artifact generation system including hook files,
 * test files, registration code, and documentation.
 * 
 * @module tests/hooks/HookArtifactGenerator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  HookArtifactGenerator,
  generateHookArtifacts
} from '../../lib/hooks/detector/HookArtifactGenerator.js';
import { HookTypes } from '../../lib/hooks/detector/HookRequirementDetector.js';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

describe('HookArtifactGenerator', () => {
  let generator;
  let testOutputDir;

  beforeEach(async () => {
    // Create temporary test output directory
    testOutputDir = path.join(process.cwd(), 'test-output-' + Date.now());
    generator = new HookArtifactGenerator({
      outputDir: testOutputDir,
      overwrite: true
    });
  });

  afterEach(async () => {
    // Clean up test output directory
    try {
      if (existsSync(testOutputDir)) {
        await fs.rm(testOutputDir, { recursive: true, force: true });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Basic Functionality', () => {
    it('should create generator instance', () => {
      expect(generator).toBeDefined();
      expect(generator.generate).toBeDefined();
    });

    it('should throw error for invalid recommendation', async () => {
      await expect(generator.generate(null)).rejects.toThrow();
      await expect(generator.generate({})).rejects.toThrow();
      await expect(generator.generate({ type: 'test' })).rejects.toThrow();
      await expect(generator.generate({ name: 'test' })).rejects.toThrow();
    });
  });

  describe('Artifact Generation - Dry Run', () => {
    beforeEach(() => {
      generator = new HookArtifactGenerator({
        outputDir: testOutputDir,
        dryRun: true // Don't actually create files
      });
    });

    it('should generate result without creating files', async () => {
      const recommendation = {
        type: HookTypes.PRE_CONFIG_MODIFICATION,
        name: 'TestHook',
        priority: 5,
        confidence: 0.8,
        reason: 'Test hook'
      };

      const result = await generator.generate(recommendation);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.filesCreated.length).toBeGreaterThan(0);
      expect(result.registrationCode).toBeTruthy();

      // Files should NOT exist (dry run)
      for (const file of result.filesCreated) {
        expect(existsSync(file)).toBe(false);
      }
    });
  });

  describe('Hook File Generation', () => {
    it('should generate PRE_CONFIG_MODIFICATION hook', async () => {
      const recommendation = {
        type: HookTypes.PRE_CONFIG_MODIFICATION,
        name: 'ConfigBackupTest',
        priority: 5,
        confidence: 0.9,
        reason: 'Backup configuration'
      };

      const result = await generator.generate(recommendation);

      expect(result.success).toBe(true);
      expect(result.filesCreated.length).toBe(3); // hook, test, doc

      const hookFile = result.filesCreated[0];
      expect(existsSync(hookFile)).toBe(true);
      expect(hookFile).toContain('config-backup-test.js');

      const content = await fs.readFile(hookFile, 'utf-8');
      expect(content).toContain('configBackupTest');
      expect(content).toContain('export async function');
      expect(content).toContain('await next()');
    });

    it('should generate USER_PROMPT_SUBMIT hook', async () => {
      const recommendation = {
        type: HookTypes.USER_PROMPT_SUBMIT,
        name: 'PromptAnalyzerTest',
        priority: 25,
        confidence: 0.8,
        reason: 'Analyze prompts'
      };

      const result = await generator.generate(recommendation);

      expect(result.success).toBe(true);

      const hookFile = result.filesCreated[0];
      const content = await fs.readFile(hookFile, 'utf-8');
      expect(content).toContain('promptAnalyzerTest');
      expect(content).toContain('context.prompt');
    });

    it('should generate POST_TOOL_USE hook', async () => {
      const recommendation = {
        type: HookTypes.POST_TOOL_USE,
        name: 'FileMonitorTest',
        priority: 45,
        confidence: 0.75,
        reason: 'Monitor files'
      };

      const result = await generator.generate(recommendation);

      expect(result.success).toBe(true);

      const hookFile = result.filesCreated[0];
      const content = await fs.readFile(hookFile, 'utf-8');
      expect(content).toContain('fileMonitorTest');
      expect(content).toContain('fileTimestamps');
    });

    it('should generate PRE_PROJECT_SWITCH hook', async () => {
      const recommendation = {
        type: HookTypes.PRE_PROJECT_SWITCH,
        name: 'ProjectCleanupTest',
        priority: 15,
        confidence: 0.7,
        reason: 'Cleanup before switch'
      };

      const result = await generator.generate(recommendation);

      expect(result.success).toBe(true);

      const hookFile = result.filesCreated[0];
      const content = await fs.readFile(hookFile, 'utf-8');
      expect(content).toContain('projectCleanupTest');
      expect(content).toContain('cleanupProjectState');
    });

    it('should generate POST_PROJECT_SWITCH hook', async () => {
      const recommendation = {
        type: HookTypes.POST_PROJECT_SWITCH,
        name: 'ProjectInitTest',
        priority: 20,
        confidence: 0.85,
        reason: 'Initialize after switch'
      };

      const result = await generator.generate(recommendation);

      expect(result.success).toBe(true);

      const hookFile = result.filesCreated[0];
      const content = await fs.readFile(hookFile, 'utf-8');
      expect(content).toContain('projectInitTest');
      expect(content).toContain('initializeProjectState');
    });
  });

  describe('Test File Generation', () => {
    it('should generate test file', async () => {
      const recommendation = {
        type: HookTypes.PRE_CONFIG_MODIFICATION,
        name: 'TestHook',
        priority: 5,
        confidence: 0.8,
        reason: 'Test'
      };

      const result = await generator.generate(recommendation);

      const testFile = result.filesCreated[1];
      expect(existsSync(testFile)).toBe(true);
      expect(testFile).toContain('test-hook.test.js');

      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toContain('describe');
      expect(content).toContain('it(');
      expect(content).toContain('expect');
      expect(content).toContain('testHook');
    });

    it('should include vitest imports in test', async () => {
      const recommendation = {
        type: HookTypes.USER_PROMPT_SUBMIT,
        name: 'TestHook',
        priority: 20,
        confidence: 0.8,
        reason: 'Test'
      };

      const result = await generator.generate(recommendation);

      const testFile = result.filesCreated[1];
      const content = await fs.readFile(testFile, 'utf-8');
      
      expect(content).toContain("import { describe, it, expect");
      expect(content).toContain("from 'vitest'");
    });
  });

  describe('Registration Code Generation', () => {
    it('should generate registration code', async () => {
      const recommendation = {
        type: HookTypes.PRE_CONFIG_MODIFICATION,
        name: 'TestHook',
        priority: 5,
        confidence: 0.8,
        reason: 'Test'
      };

      const result = await generator.generate(recommendation);

      expect(result.registrationCode).toBeTruthy();
      expect(result.registrationCode).toContain('import');
      expect(result.registrationCode).toContain('hookManager.register');
      expect(result.registrationCode).toContain('HookTypes');
      expect(result.registrationCode).toContain('priority: 5');
      expect(result.registrationCode).toContain('testHook');
    });

    it('should use correct hook type constant', async () => {
      const recommendation = {
        type: HookTypes.USER_PROMPT_SUBMIT,
        name: 'PromptHook',
        priority: 25,
        confidence: 0.8,
        reason: 'Test'
      };

      const result = await generator.generate(recommendation);

      expect(result.registrationCode).toContain('USER_PROMPT_SUBMIT');
    });
  });

  describe('Documentation Generation', () => {
    it('should generate documentation file', async () => {
      const recommendation = {
        type: HookTypes.POST_TOOL_USE,
        name: 'TestHook',
        priority: 45,
        confidence: 0.75,
        reason: 'Monitor files'
      };

      const result = await generator.generate(recommendation);

      const docFile = result.filesCreated[2];
      expect(existsSync(docFile)).toBe(true);
      expect(docFile).toContain('test-hook.md');

      const content = await fs.readFile(docFile, 'utf-8');
      expect(content).toContain('# TestHook Hook');
      expect(content).toContain('**Type:**');
      expect(content).toContain('**Priority:**');
      expect(content).toContain('## Purpose');
    });

    it('should include analysis context in documentation', async () => {
      const recommendation = {
        type: HookTypes.POST_TOOL_USE,
        name: 'DocTest',
        priority: 45,
        confidence: 0.8,
        reason: 'Test with context'
      };

      const analysisContext = {
        fileOperations: {
          writes: ['output.txt'],
          monitors: ['*.md']
        },
        externalIntegrations: {
          systems: ['PAI'],
          logsToExternal: true
        }
      };

      const result = await generator.generate(recommendation, analysisContext);

      const docFile = result.filesCreated[2];
      const content = await fs.readFile(docFile, 'utf-8');
      
      expect(content).toContain('output.txt');
      expect(content).toContain('PAI');
    });
  });

  describe('Context-Aware Generation', () => {
    it('should include cache code for caching requirements', async () => {
      const recommendation = {
        type: HookTypes.USER_PROMPT_SUBMIT,
        name: 'CachedHook',
        priority: 25,
        confidence: 0.8,
        reason: 'Test caching'
      };

      const analysisContext = {
        statePersistence: {
          requiresCaching: true
        }
      };

      const result = await generator.generate(recommendation, analysisContext);

      const hookFile = result.filesCreated[0];
      const content = await fs.readFile(hookFile, 'utf-8');
      
      expect(content).toContain('cache');
      expect(content).toContain('Map()');
      expect(content).toContain('CACHE_TTL');
    });

    it('should include throttling code for throttling requirements', async () => {
      const recommendation = {
        type: HookTypes.USER_PROMPT_SUBMIT,
        name: 'ThrottledHook',
        priority: 25,
        confidence: 0.8,
        reason: 'Test throttling'
      };

      const analysisContext = {
        statePersistence: {
          requiresThrottling: true
        }
      };

      const result = await generator.generate(recommendation, analysisContext);

      const hookFile = result.filesCreated[0];
      const content = await fs.readFile(hookFile, 'utf-8');
      
      expect(content).toContain('lastCheck');
      expect(content).toContain('MIN_INTERVAL');
    });

    it('should include monitored files for file monitoring', async () => {
      const recommendation = {
        type: HookTypes.POST_TOOL_USE,
        name: 'MonitorHook',
        priority: 45,
        confidence: 0.75,
        reason: 'Test monitoring'
      };

      const analysisContext = {
        fileOperations: {
          monitors: ['file1.txt', 'file2.txt']
        }
      };

      const result = await generator.generate(recommendation, analysisContext);

      const hookFile = result.filesCreated[0];
      const content = await fs.readFile(hookFile, 'utf-8');
      
      expect(content).toContain('file1.txt');
      expect(content).toContain('file2.txt');
    });
  });

  describe('Warning Generation', () => {
    it('should warn for low confidence', async () => {
      const recommendation = {
        type: HookTypes.PRE_CONFIG_MODIFICATION,
        name: 'LowConfidenceHook',
        priority: 5,
        confidence: 0.3, // Low confidence
        reason: 'Test'
      };

      const result = await generator.generate(recommendation);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Low confidence'))).toBe(true);
    });
  });

  describe('File Overwrite Handling', () => {
    it('should not overwrite existing files without permission', async () => {
      const recommendation = {
        type: HookTypes.PRE_CONFIG_MODIFICATION,
        name: 'OverwriteTest',
        priority: 5,
        confidence: 0.8,
        reason: 'Test overwrite'
      };

      // Generate once
      await generator.generate(recommendation);

      // Try to generate again without overwrite permission
      const noOverwriteGenerator = new HookArtifactGenerator({
        outputDir: testOutputDir,
        overwrite: false
      });

      const result = await noOverwriteGenerator.generate(recommendation);

      expect(result.success).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Convenience Function', () => {
    it('should work with generateHookArtifacts shorthand', async () => {
      const recommendation = {
        type: HookTypes.POST_TOOL_USE,
        name: 'QuickTest',
        priority: 45,
        confidence: 0.75,
        reason: 'Quick test'
      };

      const result = await generateHookArtifacts(
        recommendation,
        {},
        { outputDir: testOutputDir, overwrite: true }
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.filesCreated.length).toBeGreaterThan(0);
    });
  });

  describe('Documentation Template Scenario', () => {
    it('should generate complete DocumentationLifecycle hook', async () => {
      const recommendation = {
        type: HookTypes.POST_TOOL_USE,
        name: 'DocumentationLifecycle',
        priority: 45,
        confidence: 0.8,
        reason: 'Monitor documentation template usage and lifecycle'
      };

      const analysisContext = {
        fileOperations: {
          writes: ['Docs/*.md'],
          monitors: ['Docs/**/*.md', 'templates/documentation/*.md']
        },
        externalIntegrations: {
          systems: ['PAI history.jsonl'],
          logsToExternal: true
        },
        statePersistence: {
          requiresTimestamps: true
        }
      };

      const result = await generator.generate(recommendation, analysisContext);

      expect(result.success).toBe(true);
      expect(result.filesCreated.length).toBe(3);

      // Check hook file
      const hookFile = result.filesCreated[0];
      expect(hookFile).toContain('documentation-lifecycle.js');
      
      const hookContent = await fs.readFile(hookFile, 'utf-8');
      expect(hookContent).toContain('documentationLifecycle');
      expect(hookContent).toContain('fileTimestamps');
      expect(hookContent).toContain('MONITORED_FILES');

      // Check test file
      const testFile = result.filesCreated[1];
      const testContent = await fs.readFile(testFile, 'utf-8');
      expect(testContent).toContain('DocumentationLifecycle Hook Tests');
      expect(testContent).toContain('describe');

      // Check documentation
      const docFile = result.filesCreated[2];
      const docContent = await fs.readFile(docFile, 'utf-8');
      expect(docContent).toContain('# DocumentationLifecycle Hook');
      expect(docContent).toContain('PAI history.jsonl');
      expect(docContent).toContain('Docs/**/*.md');

      // Check registration code
      expect(result.registrationCode).toContain('documentationLifecycle');
      expect(result.registrationCode).toContain('priority: 45');
      expect(result.registrationCode).toContain('POST_TOOL_USE');
    });
  });

  describe('Name Conversion', () => {
    it('should convert to kebab-case for filenames', async () => {
      const recommendation = {
        type: HookTypes.PRE_CONFIG_MODIFICATION,
        name: 'MyComplexHookName',
        priority: 5,
        confidence: 0.8,
        reason: 'Test'
      };

      const result = await generator.generate(recommendation);

      expect(result.filesCreated[0]).toContain('my-complex-hook-name.js');
      expect(result.filesCreated[1]).toContain('my-complex-hook-name.test.js');
    });

    it('should convert to camelCase for function names', async () => {
      const recommendation = {
        type: HookTypes.USER_PROMPT_SUBMIT,
        name: 'My Hook Function',
        priority: 25,
        confidence: 0.8,
        reason: 'Test'
      };

      const result = await generator.generate(recommendation);

      expect(result.registrationCode).toContain('myHookFunction');
    });
  });
});

