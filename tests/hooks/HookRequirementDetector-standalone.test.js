/**
 * Hook Requirement Detector Standalone Tests
 * 
 * Tests the detector without importing the full hook system
 * to avoid dependency issues during testing.
 * 
 * @module tests/hooks/HookRequirementDetector-standalone
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HookRequirementDetector, detectHookRequirements, HookTypes } from '../../lib/hooks/detector/HookRequirementDetector.js';

describe('HookRequirementDetector - Standalone', () => {
  let detector;

  beforeEach(() => {
    detector = new HookRequirementDetector();
  });

  describe('Basic Functionality', () => {
    it('should create detector instance', () => {
      expect(detector).toBeDefined();
      expect(detector.detect).toBeDefined();
      expect(detector.detectBatch).toBeDefined();
      expect(detector.generateReport).toBeDefined();
    });

    it('should detect no hooks for minimal feature', () => {
      const spec = {
        name: 'Minimal Feature',
        description: 'Simple feature with no side effects'
      };

      const result = detector.detect(spec);

      expect(result).toBeDefined();
      expect(result.requiredHooks).toBeDefined();
      expect(result.optionalHooks).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it('should throw error for invalid spec', () => {
      expect(() => detector.detect(null)).toThrow();
      expect(() => detector.detect({})).toThrow();
      expect(() => detector.detect({ description: 'No name' })).toThrow();
    });
  });

  describe('Config Modification Detection', () => {
    it('should detect PRE_CONFIG_MODIFICATION for config backup', () => {
      const spec = {
        name: 'Config Backup',
        description: 'Backs up configuration',
        filesModified: ['~/.claude/config.json'],
        needsBackup: true,
        criticality: 'high'
      };

      const result = detector.detect(spec);

      expect(result.requiredHooks.length).toBeGreaterThan(0);
      const configHook = result.requiredHooks.find(h => 
        h.type === HookTypes.PRE_CONFIG_MODIFICATION
      );
      expect(configHook).toBeDefined();
      expect(configHook.priority).toBeLessThanOrEqual(10);
    });

    it('should recommend high confidence for strong indicators', () => {
      const spec = {
        name: 'Critical Config',
        filesModified: ['config.json'],
        needsBackup: true,
        needsTransactionSafety: true,
        criticality: 'high'
      };

      const result = detector.detect(spec);

      expect(result.requiredHooks.length).toBeGreaterThan(0);
      expect(result.requiredHooks[0].confidence).toBeGreaterThan(0.5);
    });
  });

  describe('User Prompt Analysis Detection', () => {
    it('should detect USER_PROMPT_SUBMIT for prompt analysis', () => {
      const spec = {
        name: 'Prompt Analyzer',
        analyzesPrompts: true,
        detectsContextChanges: true
      };

      const result = detector.detect(spec);

      const found = [...result.requiredHooks, ...result.optionalHooks].some(h =>
        h.type === HookTypes.USER_PROMPT_SUBMIT
      );

      expect(found).toBe(true);
    });

    it('should detect skill suggestions pattern', () => {
      const spec = {
        name: 'Skill Suggestions',
        analyzesPrompts: true,
        providesContextualSuggestions: true,
        requiresCaching: true,
        detectsFilePatterns: true
      };

      const result = detector.detect(spec);

      const promptHook = [...result.requiredHooks, ...result.optionalHooks].find(h =>
        h.type === HookTypes.USER_PROMPT_SUBMIT
      );

      expect(promptHook).toBeDefined();
      expect(promptHook.priority).toBeGreaterThanOrEqual(10);
      expect(promptHook.priority).toBeLessThanOrEqual(40);
    });
  });

  describe('Post Tool Use Detection', () => {
    it('should detect POST_TOOL_USE for file monitoring', () => {
      const spec = {
        name: 'File Monitor',
        filesMonitored: ['.claude/*.json', '.taskmaster/tasks/tasks.json'],
        requiresTimestamps: true
      };

      const result = detector.detect(spec);

      const toolHook = [...result.requiredHooks, ...result.optionalHooks].find(h =>
        h.type === HookTypes.POST_TOOL_USE
      );

      expect(toolHook).toBeDefined();
      expect(toolHook.priority).toBeGreaterThanOrEqual(40);
    });

    it('should detect context reload pattern', () => {
      const spec = {
        name: 'Context Reloader',
        filesMonitored: ['metadata.json', 'skill-rules.json'],
        triggersContextReload: true,
        requiresTimestamps: true,
        requiresThrottling: true
      };

      const result = detector.detect(spec);

      const reloadHook = [...result.requiredHooks, ...result.optionalHooks].find(h =>
        h.type === HookTypes.POST_TOOL_USE
      );

      expect(reloadHook).toBeDefined();
      expect(reloadHook.indicators).toContain('filesMonitored');
    });
  });

  describe('Documentation Template Scenario', () => {
    it('should detect DocumentationLifecycle hook requirements', () => {
      const spec = {
        name: 'Documentation Template',
        description: 'Creates documentation from templates',
        filesCreated: ['Docs/*.md'],
        filesMonitored: ['Docs/**/*.md', 'templates/documentation/*.md'],
        logsToExternal: true,
        externalSystems: ['PAI history.jsonl'],
        requiresTimestamps: true
      };

      const result = detector.detect(spec);

      // Should recommend POST_TOOL_USE for lifecycle tracking
      const lifecycleHook = [...result.requiredHooks, ...result.optionalHooks].find(h =>
        h.type === HookTypes.POST_TOOL_USE
      );

      expect(lifecycleHook).toBeDefined();
      expect(lifecycleHook.name).toContain('Documentation');
      expect(lifecycleHook.confidence).toBeGreaterThan(0.3);
    });

    it('should generate appropriate hook name', () => {
      const spec = {
        name: 'Documentation Template',
        filesMonitored: ['*.md'],
        logsToExternal: true
      };

      const result = detector.detect(spec);

      if (result.requiredHooks.length > 0 || result.optionalHooks.length > 0) {
        const hook = [...result.requiredHooks, ...result.optionalHooks][0];
        expect(hook.name).toBeTruthy();
        expect(hook.name.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Multiple Hook Detection', () => {
    it('should detect multiple hooks for complex features', () => {
      const spec = {
        name: 'Project Manager',
        filesModified: ['config.json'],
        analyzesPrompts: true,
        filesMonitored: ['.claude/*'],
        detectsContextChanges: true,
        triggersProjectSwitch: true,
        needsBackup: true,
        requiresCaching: true,
        criticality: 'high'
      };

      const result = detector.detect(spec);

      // Should detect multiple hook types
      const allHooks = [...result.requiredHooks, ...result.optionalHooks];
      expect(allHooks.length).toBeGreaterThan(1);

      const hookTypes = new Set(allHooks.map(h => h.type));
      expect(hookTypes.size).toBeGreaterThan(1);
    });
  });

  describe('Warning Generation', () => {
    it('should warn about features with many hooks', () => {
      const spec = {
        name: 'Monolithic Feature',
        filesModified: ['config.json'],
        analyzesPrompts: true,
        filesMonitored: ['*.json'],
        detectsContextChanges: true,
        triggersProjectSwitch: true,
        triggersContextReload: true,
        logsToExternal: true,
        needsBackup: true,
        requiresCaching: true,
        criticality: 'high'
      };

      const result = detector.detect(spec);

      // If many hooks detected, should warn
      const totalHooks = result.requiredHooks.length + result.optionalHooks.length;
      if (totalHooks > 3) {
        expect(result.warnings.length).toBeGreaterThan(0);
      }
    });

    it('should warn about hook dependencies', () => {
      const spec = {
        name: 'Dependent Feature',
        analyzesPrompts: true,
        hookDependencies: ['existingHook1', 'existingHook2']
      };

      const result = detector.detect(spec);

      expect(result.warnings.some(w => w.includes('depends on'))).toBe(true);
    });
  });

  describe('Analysis Details', () => {
    it('should analyze file operations', () => {
      const spec = {
        name: 'File Handler',
        filesRead: ['input.json'],
        filesModified: ['output.json'],
        filesMonitored: ['watch.json']
      };

      const result = detector.detect(spec);

      expect(result.analysis.fileOperations).toBeDefined();
      expect(result.analysis.fileOperations.reads).toContain('input.json');
      expect(result.analysis.fileOperations.writes).toContain('output.json');
      expect(result.analysis.fileOperations.monitors).toContain('watch.json');
    });

    it('should detect config modification patterns', () => {
      const spec = {
        name: 'Settings Editor',
        filesModified: ['settings.json']
      };

      const result = detector.detect(spec);

      expect(result.analysis.fileOperations.modifiesConfig).toBe(true);
    });

    it('should analyze lifecycle interactions', () => {
      const spec = {
        name: 'Lifecycle Manager',
        analyzesPrompts: true,
        detectsContextChanges: true,
        triggersProjectSwitch: true
      };

      const result = detector.detect(spec);

      expect(result.analysis.lifecycleInteractions).toBeDefined();
      expect(result.analysis.lifecycleInteractions.analyzesUserInput).toBe(true);
      expect(result.analysis.lifecycleInteractions.detectsContextChanges).toBe(true);
      expect(result.analysis.lifecycleInteractions.triggersProjectSwitch).toBe(true);
    });

    it('should analyze external integrations', () => {
      const spec = {
        name: 'External Integrator',
        externalSystems: ['PAI', 'REST API'],
        logsToExternal: true,
        monitorsProcessState: true
      };

      const result = detector.detect(spec);

      expect(result.analysis.externalIntegrations).toBeDefined();
      expect(result.analysis.externalIntegrations.systems).toHaveLength(2);
      expect(result.analysis.externalIntegrations.logsToExternal).toBe(true);
      expect(result.analysis.externalIntegrations.usesNetworking).toBe(true);
    });

    it('should analyze state persistence needs', () => {
      const spec = {
        name: 'State Manager',
        requiresCaching: true,
        requiresTimestamps: true,
        requiresHistory: true,
        requiresThrottling: true
      };

      const result = detector.detect(spec);

      expect(result.analysis.statePersistence).toBeDefined();
      expect(result.analysis.statePersistence.requiresCaching).toBe(true);
      expect(result.analysis.statePersistence.requiresTimestamps).toBe(true);
      expect(result.analysis.statePersistence.requiresHistory).toBe(true);
      expect(result.analysis.statePersistence.requiresThrottling).toBe(true);
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple specs at once', () => {
      const specs = [
        { name: 'Feature A', analyzesPrompts: true },
        { name: 'Feature B', filesModified: ['config.json'] },
        { name: 'Feature C', filesMonitored: ['*.json'] }
      ];

      const results = detector.detectBatch(specs);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.analysis).toBeDefined();
        expect(result.requiredHooks).toBeDefined();
        expect(result.optionalHooks).toBeDefined();
      });
    });
  });

  describe('Report Generation', () => {
    it('should generate formatted markdown report', () => {
      const spec = {
        name: 'Test Feature',
        filesModified: ['config.json'],
        needsBackup: true,
        analyzesPrompts: true
      };

      const result = detector.detect(spec);
      const report = detector.generateReport(result);

      expect(report).toContain('# Hook Requirement Detection Report');
      expect(report).toContain('## Analysis Summary');
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(100);
    });

    it('should include warnings in report', () => {
      const spec = {
        name: 'Test Feature',
        hookDependencies: ['dep1', 'dep2'],
        analyzesPrompts: true
      };

      const result = detector.detect(spec);
      const report = detector.generateReport(result);

      if (result.warnings.length > 0) {
        expect(report).toContain('## Warnings');
      }
    });
  });

  describe('Convenience Functions', () => {
    it('should work with detectHookRequirements shorthand', () => {
      const spec = {
        name: 'Quick Test',
        analyzesPrompts: true
      };

      const result = detectHookRequirements(spec);

      expect(result).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.requiredHooks).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty arrays', () => {
      const spec = {
        name: 'Empty Arrays',
        filesRead: [],
        filesModified: [],
        externalSystems: []
      };

      const result = detector.detect(spec);

      expect(result).toBeDefined();
      expect(result.requiredHooks).toBeDefined();
      expect(result.optionalHooks).toBeDefined();
    });

    it('should handle undefined optional fields', () => {
      const spec = {
        name: 'Minimal Spec'
        // Only name provided
      };

      const result = detector.detect(spec);

      expect(result).toBeDefined();
      expect(result.analysis.criticality).toBe('medium'); // default
    });

    it('should handle mixed case in file patterns', () => {
      const spec = {
        name: 'Case Test',
        filesModified: ['Config.JSON', 'settings.Json']
      };

      const result = detector.detect(spec);

      expect(result.analysis.fileOperations.modifiesConfig).toBe(true);
    });
  });
});

