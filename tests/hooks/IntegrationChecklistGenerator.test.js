/**
 * Integration Checklist Generator Tests
 * 
 * Comprehensive test suite for the checklist generation system.
 * 
 * @module tests/hooks/IntegrationChecklistGenerator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  IntegrationChecklistGenerator, 
  generateIntegrationChecklist 
} from '../../lib/hooks/detector/IntegrationChecklistGenerator.js';
import { HookTypes } from '../../lib/hooks/detector/HookRequirementDetector.js';

describe('IntegrationChecklistGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new IntegrationChecklistGenerator();
  });

  describe('Basic Functionality', () => {
    it('should create generator instance', () => {
      expect(generator).toBeDefined();
      expect(generator.generate).toBeDefined();
      expect(generator.generateBatch).toBeDefined();
      expect(generator.formatAsMarkdown).toBeDefined();
      expect(generator.formatAsJSON).toBeDefined();
    });

    it('should throw error for invalid recommendation', () => {
      expect(() => generator.generate(null)).toThrow();
      expect(() => generator.generate({})).toThrow();
      expect(() => generator.generate({ name: 'Test' })).toThrow();
    });

    it('should throw error for unknown hook type', () => {
      expect(() => generator.generate({
        name: 'Test',
        type: 'unknownType'
      })).toThrow();
    });
  });

  describe('Checklist Generation', () => {
    it('should generate checklist for PRE_CONFIG_MODIFICATION', () => {
      const recommendation = {
        type: HookTypes.PRE_CONFIG_MODIFICATION,
        name: 'ConfigBackup',
        priority: 5,
        confidence: 0.9,
        reason: 'Backup configuration before modification'
      };

      const checklist = generator.generate(recommendation);

      expect(checklist).toBeDefined();
      expect(checklist.hookName).toBe('ConfigBackup');
      expect(checklist.hookType).toBe(HookTypes.PRE_CONFIG_MODIFICATION);
      expect(checklist.priority).toBe(5);
      expect(checklist.confidence).toBe(0.9);
      expect(checklist.items).toBeDefined();
      expect(checklist.items.length).toBeGreaterThan(0);
      expect(checklist.metadata).toBeDefined();
      expect(checklist.testingPlan).toBeDefined();
    });

    it('should generate checklist for USER_PROMPT_SUBMIT', () => {
      const recommendation = {
        type: HookTypes.USER_PROMPT_SUBMIT,
        name: 'PromptAnalyzer',
        priority: 25,
        confidence: 0.8,
        reason: 'Analyze user prompts'
      };

      const checklist = generator.generate(recommendation);

      expect(checklist.hookName).toBe('PromptAnalyzer');
      expect(checklist.hookType).toBe(HookTypes.USER_PROMPT_SUBMIT);
      expect(checklist.items.length).toBeGreaterThan(0);
    });

    it('should generate checklist for POST_TOOL_USE', () => {
      const recommendation = {
        type: HookTypes.POST_TOOL_USE,
        name: 'FileMonitor',
        priority: 45,
        confidence: 0.75,
        reason: 'Monitor file changes'
      };

      const checklist = generator.generate(recommendation);

      expect(checklist.hookName).toBe('FileMonitor');
      expect(checklist.hookType).toBe(HookTypes.POST_TOOL_USE);
      expect(checklist.items.length).toBeGreaterThan(0);
    });

    it('should generate checklist for PRE_PROJECT_SWITCH', () => {
      const recommendation = {
        type: HookTypes.PRE_PROJECT_SWITCH,
        name: 'ProjectCleanup',
        priority: 15,
        confidence: 0.7,
        reason: 'Cleanup before switch'
      };

      const checklist = generator.generate(recommendation);

      expect(checklist.hookName).toBe('ProjectCleanup');
      expect(checklist.hookType).toBe(HookTypes.PRE_PROJECT_SWITCH);
      expect(checklist.items.length).toBeGreaterThan(0);
    });

    it('should generate checklist for POST_PROJECT_SWITCH', () => {
      const recommendation = {
        type: HookTypes.POST_PROJECT_SWITCH,
        name: 'ProjectInit',
        priority: 20,
        confidence: 0.85,
        reason: 'Initialize after switch'
      };

      const checklist = generator.generate(recommendation);

      expect(checklist.hookName).toBe('ProjectInit');
      expect(checklist.hookType).toBe(HookTypes.POST_PROJECT_SWITCH);
      expect(checklist.items.length).toBeGreaterThan(0);
    });
  });

  describe('Checklist Items', () => {
    it('should include all required categories', () => {
      const recommendation = {
        type: HookTypes.PRE_CONFIG_MODIFICATION,
        name: 'TestHook',
        priority: 10,
        confidence: 0.8,
        reason: 'Test'
      };

      const checklist = generator.generate(recommendation);

      const categories = new Set(checklist.items.map(item => item.category));
      
      expect(categories.has('setup')).toBe(true);
      expect(categories.has('implementation')).toBe(true);
      expect(categories.has('testing')).toBe(true);
      expect(categories.has('validation')).toBe(true);
    });

    it('should have proper item structure', () => {
      const recommendation = {
        type: HookTypes.USER_PROMPT_SUBMIT,
        name: 'TestHook',
        priority: 20,
        confidence: 0.7,
        reason: 'Test'
      };

      const checklist = generator.generate(recommendation);
      const item = checklist.items[0];

      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('completed');
      expect(item.completed).toBe(false);
    });

    it('should interpolate hook name in items', () => {
      const recommendation = {
        type: HookTypes.POST_TOOL_USE,
        name: 'MyCustomHook',
        priority: 40,
        confidence: 0.75,
        reason: 'Custom monitoring'
      };

      const checklist = generator.generate(recommendation);
      
      // Check that some items contain the hook name
      const hasHookName = checklist.items.some(item => 
        item.title.includes('MyCustomHook') || 
        item.description.includes('MyCustomHook') ||
        (item.code && item.code.includes('MyCustomHook'))
      );

      expect(hasHookName).toBe(true);
    });
  });

  describe('Analysis Context Integration', () => {
    it('should use analysis context for metadata', () => {
      const recommendation = {
        type: HookTypes.POST_TOOL_USE,
        name: 'DocumentationMonitor',
        priority: 45,
        confidence: 0.8,
        reason: 'Monitor docs'
      };

      const analysisContext = {
        fileOperations: {
          reads: ['template.md'],
          writes: ['output.md'],
          monitors: ['docs/*.md']
        },
        externalIntegrations: {
          systems: ['PAI'],
          logsToExternal: true
        },
        statePersistence: {
          requiresCaching: true,
          requiresTimestamps: true
        }
      };

      const checklist = generator.generate(recommendation, analysisContext);

      expect(checklist.metadata.contextRequirements).toContain('template.md');
      expect(checklist.metadata.contextRequirements).toContain('PAI');
      expect(checklist.metadata.contextRequirements).toContain('caching');
    });

    it('should include conditional items based on context', () => {
      const recommendation = {
        type: HookTypes.USER_PROMPT_SUBMIT,
        name: 'CachedAnalyzer',
        priority: 25,
        confidence: 0.9,
        reason: 'Cached analysis'
      };

      const analysisContext = {
        statePersistence: {
          requiresCaching: true,
          requiresThrottling: true
        }
      };

      const checklist = generator.generate(recommendation, analysisContext);

      // Should have cache-related items
      const hasCacheItems = checklist.items.some(item =>
        item.title.toLowerCase().includes('cache') ||
        item.description.toLowerCase().includes('cache')
      );

      expect(hasCacheItems).toBe(true);
    });
  });

  describe('Metadata Generation', () => {
    it('should generate trigger conditions', () => {
      const recommendation = {
        type: HookTypes.PRE_CONFIG_MODIFICATION,
        name: 'TestHook',
        priority: 5,
        confidence: 0.8,
        reason: 'Test'
      };

      const checklist = generator.generate(recommendation);

      expect(checklist.metadata.triggerConditions).toBeDefined();
      expect(checklist.metadata.triggerConditions).toContain('configuration');
    });

    it('should generate context requirements', () => {
      const recommendation = {
        type: HookTypes.POST_TOOL_USE,
        name: 'TestHook',
        priority: 45,
        confidence: 0.75,
        reason: 'Test'
      };

      const checklist = generator.generate(recommendation);

      expect(checklist.metadata.contextRequirements).toBeDefined();
      expect(typeof checklist.metadata.contextRequirements).toBe('string');
    });

    it('should generate integration notes', () => {
      const recommendation = {
        type: HookTypes.USER_PROMPT_SUBMIT,
        name: 'TestHook',
        priority: 20,
        confidence: 0.6,
        reason: 'Test'
      };

      const checklist = generator.generate(recommendation);

      expect(checklist.metadata.integrationNotes).toBeDefined();
      expect(typeof checklist.metadata.integrationNotes).toBe('string');
    });

    it('should include low confidence warning', () => {
      const recommendation = {
        type: HookTypes.POST_TOOL_USE,
        name: 'TestHook',
        priority: 45,
        confidence: 0.4, // Low confidence
        reason: 'Test'
      };

      const checklist = generator.generate(recommendation);

      expect(checklist.metadata.integrationNotes).toContain('Low confidence');
    });

    it('should include high priority note', () => {
      const recommendation = {
        type: HookTypes.PRE_CONFIG_MODIFICATION,
        name: 'TestHook',
        priority: 3, // High priority (low number)
        confidence: 0.9,
        reason: 'Test'
      };

      const checklist = generator.generate(recommendation);

      expect(checklist.metadata.integrationNotes).toContain('priority');
    });
  });

  describe('Testing Plan Generation', () => {
    it('should generate unit tests', () => {
      const recommendation = {
        type: HookTypes.PRE_CONFIG_MODIFICATION,
        name: 'TestHook',
        priority: 5,
        confidence: 0.8,
        reason: 'Test'
      };

      const checklist = generator.generate(recommendation);

      expect(checklist.testingPlan.unitTests).toBeDefined();
      expect(Array.isArray(checklist.testingPlan.unitTests)).toBe(true);
      expect(checklist.testingPlan.unitTests.length).toBeGreaterThan(0);
    });

    it('should generate integration tests', () => {
      const recommendation = {
        type: HookTypes.USER_PROMPT_SUBMIT,
        name: 'TestHook',
        priority: 25,
        confidence: 0.8,
        reason: 'Test'
      };

      const checklist = generator.generate(recommendation);

      expect(checklist.testingPlan.integrationTests).toBeDefined();
      expect(Array.isArray(checklist.testingPlan.integrationTests)).toBe(true);
      expect(checklist.testingPlan.integrationTests.length).toBeGreaterThan(0);
    });

    it('should generate test scenarios', () => {
      const recommendation = {
        type: HookTypes.POST_TOOL_USE,
        name: 'TestHook',
        priority: 45,
        confidence: 0.75,
        reason: 'Test'
      };

      const checklist = generator.generate(recommendation);

      expect(checklist.testingPlan.scenarios).toBeDefined();
      expect(Array.isArray(checklist.testingPlan.scenarios)).toBe(true);
      expect(checklist.testingPlan.scenarios.length).toBeGreaterThan(0);
    });
  });

  describe('Batch Generation', () => {
    it('should generate multiple checklists', () => {
      const recommendations = [
        {
          type: HookTypes.PRE_CONFIG_MODIFICATION,
          name: 'Hook1',
          priority: 5,
          confidence: 0.9,
          reason: 'Test 1'
        },
        {
          type: HookTypes.USER_PROMPT_SUBMIT,
          name: 'Hook2',
          priority: 25,
          confidence: 0.8,
          reason: 'Test 2'
        },
        {
          type: HookTypes.POST_TOOL_USE,
          name: 'Hook3',
          priority: 45,
          confidence: 0.75,
          reason: 'Test 3'
        }
      ];

      const checklists = generator.generateBatch(recommendations);

      expect(checklists).toBeDefined();
      expect(checklists.length).toBe(3);
      expect(checklists[0].hookName).toBe('Hook1');
      expect(checklists[1].hookName).toBe('Hook2');
      expect(checklists[2].hookName).toBe('Hook3');
    });
  });

  describe('Markdown Formatting', () => {
    it('should format checklist as markdown', () => {
      const recommendation = {
        type: HookTypes.PRE_CONFIG_MODIFICATION,
        name: 'TestHook',
        priority: 5,
        confidence: 0.85,
        reason: 'Test backup'
      };

      const checklist = generator.generate(recommendation);
      const markdown = generator.formatAsMarkdown(checklist);

      expect(typeof markdown).toBe('string');
      expect(markdown).toContain('# TestHook Integration Checklist');
      expect(markdown).toContain('**Hook Type:**');
      expect(markdown).toContain('**Priority:**');
      expect(markdown).toContain('**Confidence:**');
      expect(markdown).toContain('## 📋 Setup Tasks');
      expect(markdown).toContain('## 💻 Implementation Tasks');
      expect(markdown).toContain('## 🧪 Testing Tasks');
      expect(markdown).toContain('## ✅ Validation Tasks');
    });

    it('should include checkboxes in markdown', () => {
      const recommendation = {
        type: HookTypes.USER_PROMPT_SUBMIT,
        name: 'TestHook',
        priority: 20,
        confidence: 0.8,
        reason: 'Test'
      };

      const checklist = generator.generate(recommendation);
      const markdown = generator.formatAsMarkdown(checklist);

      expect(markdown).toContain('[ ]'); // Unchecked checkbox
    });

    it('should include testing plan in markdown', () => {
      const recommendation = {
        type: HookTypes.POST_TOOL_USE,
        name: 'TestHook',
        priority: 45,
        confidence: 0.75,
        reason: 'Test'
      };

      const checklist = generator.generate(recommendation);
      const markdown = generator.formatAsMarkdown(checklist);

      expect(markdown).toContain('## 🧪 Testing Plan');
      expect(markdown).toContain('### Unit Tests');
      expect(markdown).toContain('### Integration Tests');
      expect(markdown).toContain('### Test Scenarios');
    });

    it('should include code blocks in markdown', () => {
      const recommendation = {
        type: HookTypes.PRE_CONFIG_MODIFICATION,
        name: 'TestHook',
        priority: 5,
        confidence: 0.9,
        reason: 'Test'
      };

      const checklist = generator.generate(recommendation);
      const markdown = generator.formatAsMarkdown(checklist);

      expect(markdown).toContain('```javascript');
      expect(markdown).toContain('```');
    });
  });

  describe('JSON Formatting', () => {
    it('should format checklist as JSON', () => {
      const recommendation = {
        type: HookTypes.PRE_CONFIG_MODIFICATION,
        name: 'TestHook',
        priority: 5,
        confidence: 0.85,
        reason: 'Test'
      };

      const checklist = generator.generate(recommendation);
      const json = generator.formatAsJSON(checklist);

      expect(typeof json).toBe('string');
      
      // Should be valid JSON
      const parsed = JSON.parse(json);
      expect(parsed.hookName).toBe('TestHook');
      expect(parsed.hookType).toBe(HookTypes.PRE_CONFIG_MODIFICATION);
      expect(parsed.items).toBeDefined();
    });

    it('should format as pretty JSON by default', () => {
      const recommendation = {
        type: HookTypes.USER_PROMPT_SUBMIT,
        name: 'TestHook',
        priority: 20,
        confidence: 0.8,
        reason: 'Test'
      };

      const checklist = generator.generate(recommendation);
      const json = generator.formatAsJSON(checklist);

      // Pretty JSON should have newlines and indentation
      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });

    it('should format as compact JSON when requested', () => {
      const recommendation = {
        type: HookTypes.POST_TOOL_USE,
        name: 'TestHook',
        priority: 45,
        confidence: 0.75,
        reason: 'Test'
      };

      const checklist = generator.generate(recommendation);
      const json = generator.formatAsJSON(checklist, false);

      // Compact JSON should not have extra whitespace
      expect(json.split('\n').length).toBe(1);
    });
  });

  describe('Convenience Function', () => {
    it('should work with generateIntegrationChecklist shorthand', () => {
      const recommendation = {
        type: HookTypes.PRE_CONFIG_MODIFICATION,
        name: 'QuickTest',
        priority: 5,
        confidence: 0.8,
        reason: 'Quick test'
      };

      const checklist = generateIntegrationChecklist(recommendation);

      expect(checklist).toBeDefined();
      expect(checklist.hookName).toBe('QuickTest');
      expect(checklist.items).toBeDefined();
    });
  });

  describe('Documentation Template Scenario', () => {
    it('should generate comprehensive checklist for DocumentationLifecycle hook', () => {
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

      const checklist = generator.generate(recommendation, analysisContext);

      expect(checklist.hookName).toBe('DocumentationLifecycle');
      expect(checklist.items.length).toBeGreaterThan(5);
      expect(checklist.testingPlan.unitTests.length).toBeGreaterThan(0);
      expect(checklist.testingPlan.integrationTests.length).toBeGreaterThan(0);
      expect(checklist.testingPlan.scenarios.length).toBeGreaterThan(0);
      
      // Should mention documentation in context
      expect(checklist.metadata.contextRequirements).toContain('Docs');
      expect(checklist.metadata.contextRequirements).toContain('PAI');
    });
  });
});

