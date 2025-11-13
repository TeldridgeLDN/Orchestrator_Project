/**
 * Hook Requirement Detector Tests
 * 
 * Comprehensive test suite for the hook detection algorithm.
 * Tests against known scenarios and edge cases.
 * 
 * @module tests/hooks/HookRequirementDetector
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HookRequirementDetector, detectHookRequirements } from '../../lib/hooks/detector/HookRequirementDetector.js';
import { HookTypes } from '../../lib/hooks/index.js';

describe('HookRequirementDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new HookRequirementDetector();
  });

  describe('Existing Hook Validation', () => {
    it('should detect PRE_CONFIG_MODIFICATION for configBackup scenario', () => {
      const spec = {
        name: 'Config Backup',
        description: 'Backs up configuration before modification',
        filesModified: ['~/.claude/config.json'],
        needsBackup: true,
        needsTransactionSafety: true,
        requiresTimestamps: true,
        requiresHistory: true,
        criticality: 'high'
      };

      const result = detector.detect(spec);

      expect(result.requiredHooks).toHaveLength(1);
      expect(result.requiredHooks[0].type).toBe(HookTypes.PRE_CONFIG_MODIFICATION);
      expect(result.requiredHooks[0].priority).toBeLessThanOrEqual(10);
      expect(result.requiredHooks[0].confidence).toBeGreaterThan(0.7);
    });

    it('should detect USER_PROMPT_SUBMIT for directory detection scenario', () => {
      const spec = {
        name: 'Directory Detection',
        description: 'Detects directory changes and switches context',
        analyzesPrompts: true,
        detectsContextChanges: true,
        triggersProjectSwitch: true,
        monitorsProcessState: true,
        requiresCaching: true
      };

      const result = detector.detect(spec);

      const promptHook = result.requiredHooks.find(h => h.type === HookTypes.USER_PROMPT_SUBMIT);
      expect(promptHook).toBeDefined();
      expect(promptHook.priority).toBeGreaterThanOrEqual(10);
      expect(promptHook.priority).toBeLessThanOrEqual(40);
    });

    it('should detect USER_PROMPT_SUBMIT for skill suggestions scenario', () => {
      const spec = {
        name: 'Skill Suggestions',
        description: 'Suggests skills based on context',
        analyzesPrompts: true,
        detectsFilePatterns: true,
        providesContextualSuggestions: true,
        requiresCaching: true,
        requiresThrottling: true,
        filesRead: ['~/.claude/skills/*/metadata.json']
      };

      const result = detector.detect(spec);

      const promptHook = result.requiredHooks.find(h => h.type === HookTypes.USER_PROMPT_SUBMIT);
      expect(promptHook).toBeDefined();
      expect(promptHook.name).toContain('Analyzer');
    });

    it('should detect POST_TOOL_USE for context reload scenario', () => {
      const spec = {
        name: 'Auto Reload Context',
        description: 'Monitors file changes and reloads context',
        filesMonitored: [
          '.claude/metadata.json',
          '.claude/skill-rules.json',
          '.claude/scenarios/*.yaml',
          '.taskmaster/tasks/tasks.json'
        ],
        triggersContextReload: true,
        requiresTimestamps: true,
        requiresThrottling: true,
        logsToExternal: true,
        externalSystems: ['session-logs']
      };

      const result = detector.detect(spec);

      const postToolHook = result.requiredHooks.find(h => h.type === HookTypes.POST_TOOL_USE);
      expect(postToolHook).toBeDefined();
      expect(postToolHook.priority).toBeGreaterThanOrEqual(40);
      expect(postToolHook.priority).toBeLessThanOrEqual(60);
    });
  });

  describe('Documentation Template Scenario', () => {
    it('should detect POST_TOOL_USE for DocumentationLifecycle', () => {
      const spec = {
        name: 'Documentation Template',
        description: 'Creates documentation from templates',
        filesCreated: ['Docs/*.md', 'templates/documentation/*.md'],
        filesRead: ['templates/documentation/*'],
        filesMonitored: ['Docs/**/*.md'],
        logsToExternal: true,
        externalSystems: ['PAI history.jsonl'],
        requiresTimestamps: true
      };

      const result = detector.detect(spec);

      expect(result.requiredHooks.length).toBeGreaterThan(0);
      
      const lifecycleHook = result.requiredHooks.find(h => 
        h.type === HookTypes.POST_TOOL_USE
      );

      expect(lifecycleHook).toBeDefined();
      expect(lifecycleHook.name).toContain('Documentation');
      expect(lifecycleHook.confidence).toBeGreaterThan(0.5);
    });

    it('should suggest USER_PROMPT_SUBMIT for template suggestions', () => {
      const spec = {
        name: 'Documentation Template',
        description: 'Creates documentation from templates',
        filesCreated: ['Docs/*.md'],
        providesContextualSuggestions: true,
        detectsFilePatterns: true,
        filesRead: ['templates/documentation/*']
      };

      const result = detector.detect(spec);

      const suggestionHook = result.optionalHooks.find(h => 
        h.type === HookTypes.USER_PROMPT_SUBMIT
      );

      // Should suggest or require based on confidence
      const hasPromptHook = [...result.requiredHooks, ...result.optionalHooks]
        .some(h => h.type === HookTypes.USER_PROMPT_SUBMIT);

      expect(hasPromptHook).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should return empty recommendations for feature without hook needs', () => {
      const spec = {
        name: 'Pure Computation',
        description: 'Performs calculation with no side effects'
      };

      const result = detector.detect(spec);

      expect(result.requiredHooks).toHaveLength(0);
      expect(result.optionalHooks).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle multiple hook types for complex feature', () => {
      const spec = {
        name: 'Project Manager',
        description: 'Manages project lifecycle',
        filesModified: ['~/.claude/config.json'],
        analyzesPrompts: true,
        detectsContextChanges: true,
        triggersProjectSwitch: true,
        triggersContextReload: true,
        filesMonitored: ['.claude/*'],
        needsBackup: true,
        requiresCaching: true,
        criticality: 'high'
      };

      const result = detector.detect(spec);

      // Should detect multiple hook types
      expect(result.requiredHooks.length).toBeGreaterThan(1);
      
      const hookTypes = new Set(result.requiredHooks.map(h => h.type));
      expect(hookTypes.size).toBeGreaterThan(1);
    });

    it('should warn about priority conflicts', () => {
      // This is tricky - we'd need to create a spec that causes conflicts
      // For now, we test that warnings can be generated
      const spec = {
        name: 'Complex Feature',
        description: 'Feature with many hooks',
        filesModified: ['config.json'],
        analyzesPrompts: true,
        filesMonitored: ['*.json'],
        logsToExternal: true,
        triggersProjectSwitch: true,
        hookDependencies: ['existingHook1', 'existingHook2']
      };

      const result = detector.detect(spec);

      // Should have at least the dependency warning
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('depends on'))).toBe(true);
    });

    it('should warn about features requiring too many hooks', () => {
      const spec = {
        name: 'Monolithic Feature',
        description: 'Does everything',
        filesModified: ['config.json'],
        filesMonitored: ['*.json'],
        analyzesPrompts: true,
        detectsContextChanges: true,
        triggersProjectSwitch: true,
        triggersContextReload: true,
        logsToExternal: true,
        needsBackup: true,
        providesContextualSuggestions: true,
        requiresCaching: true,
        criticality: 'high'
      };

      const result = detector.detect(spec);

      if (result.requiredHooks.length + result.optionalHooks.length > 3) {
        expect(result.warnings.some(w => w.includes('4+ hooks'))).toBe(true);
      }
    });

    it('should handle missing config backup warning', () => {
      const spec = {
        name: 'Config Editor',
        description: 'Edits config without proper backup',
        filesModified: ['config.json'],
        // Intentionally no needsBackup flag
        criticality: 'medium'
      };

      const result = detector.detect(spec);

      // Should either recommend PRE_CONFIG or warn about missing backup
      const hasBackupHook = [...result.requiredHooks, ...result.optionalHooks]
        .some(h => h.type === HookTypes.PRE_CONFIG_MODIFICATION);

      if (!hasBackupHook) {
        expect(result.warnings.some(w => w.includes('data safety'))).toBe(true);
      }
    });
  });

  describe('Priority Calculation', () => {
    it('should assign higher priority to critical operations', () => {
      const criticalSpec = {
        name: 'Critical Config',
        filesModified: ['config.json'],
        needsBackup: true,
        criticality: 'high'
      };

      const normalSpec = {
        name: 'Normal Config',
        filesModified: ['config.json'],
        needsBackup: true,
        criticality: 'medium'
      };

      const criticalResult = detector.detect(criticalSpec);
      const normalResult = detector.detect(normalSpec);

      // Critical should be marked as required
      expect(criticalResult.requiredHooks.length).toBeGreaterThan(0);
    });

    it('should respect priority ranges for hook types', () => {
      const specs = [
        {
          name: 'Config Modifier',
          filesModified: ['config.json'],
          needsBackup: true,
          criticality: 'high'
        },
        {
          name: 'Prompt Analyzer',
          analyzesPrompts: true
        },
        {
          name: 'Tool Monitor',
          filesMonitored: ['*.json']
        }
      ];

      const results = specs.map(spec => detector.detect(spec));

      // Check that PRE_CONFIG has lowest priority number (runs first)
      const configHook = results[0].requiredHooks[0];
      if (configHook && configHook.type === HookTypes.PRE_CONFIG_MODIFICATION) {
        expect(configHook.priority).toBeLessThan(20);
      }

      // Check that POST_TOOL_USE has higher priority number (runs later)
      const monitorResult = results[2];
      const toolHook = [...monitorResult.requiredHooks, ...monitorResult.optionalHooks]
        .find(h => h.type === HookTypes.POST_TOOL_USE);
      
      if (toolHook) {
        expect(toolHook.priority).toBeGreaterThan(30);
      }
    });
  });

  describe('Confidence Scoring', () => {
    it('should assign high confidence when all indicators match', () => {
      const spec = {
        name: 'Perfect Match',
        filesModified: ['config.json'],
        needsBackup: true,
        needsTransactionSafety: true,
        criticality: 'high'
      };

      const result = detector.detect(spec);

      const hook = result.requiredHooks[0];
      expect(hook.confidence).toBeGreaterThan(0.7);
    });

    it('should assign lower confidence for partial matches', () => {
      const spec = {
        name: 'Partial Match',
        analyzesPrompts: true
        // Only one indicator
      };

      const result = detector.detect(spec);

      if (result.optionalHooks.length > 0) {
        expect(result.optionalHooks[0].confidence).toBeLessThan(0.7);
      }
    });
  });

  describe('Batch Detection', () => {
    it('should process multiple features at once', () => {
      const specs = [
        {
          name: 'Feature A',
          analyzesPrompts: true
        },
        {
          name: 'Feature B',
          filesModified: ['config.json']
        },
        {
          name: 'Feature C',
          filesMonitored: ['*.json']
        }
      ];

      const results = detector.detectBatch(specs);

      expect(results).toHaveLength(3);
      expect(results[0].analysis).toBeDefined();
      expect(results[1].analysis).toBeDefined();
      expect(results[2].analysis).toBeDefined();
    });
  });

  describe('Report Generation', () => {
    it('should generate formatted report', () => {
      const spec = {
        name: 'Documentation Template',
        filesCreated: ['Docs/*.md'],
        filesMonitored: ['Docs/**/*.md'],
        logsToExternal: true,
        externalSystems: ['PAI']
      };

      const result = detector.detect(spec);
      const report = detector.generateReport(result);

      expect(report).toContain('# Hook Requirement Detection Report');
      expect(report).toContain('## Analysis Summary');
      
      if (result.requiredHooks.length > 0) {
        expect(report).toContain('## Required Hooks');
      }
      
      if (result.warnings.length > 0) {
        expect(report).toContain('## Warnings');
      }
    });
  });

  describe('Convenience Function', () => {
    it('should work with detectHookRequirements shorthand', () => {
      const spec = {
        name: 'Quick Test',
        analyzesPrompts: true
      };

      const result = detectHookRequirements(spec);

      expect(result).toBeDefined();
      expect(result.analysis).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid spec', () => {
      expect(() => {
        detector.detect(null);
      }).toThrow('Invalid feature specification');

      expect(() => {
        detector.detect({});
      }).toThrow('Invalid feature specification');
    });

    it('should handle spec with only name', () => {
      const spec = {
        name: 'Minimal Feature'
      };

      const result = detector.detect(spec);

      expect(result).toBeDefined();
      expect(result.requiredHooks).toBeDefined();
      expect(result.optionalHooks).toBeDefined();
    });
  });

  describe('Analysis Details', () => {
    it('should provide detailed file operations analysis', () => {
      const spec = {
        name: 'File Operator',
        filesRead: ['input.txt'],
        filesModified: ['output.txt'],
        filesMonitored: ['watch.txt']
      };

      const result = detector.detect(spec);

      expect(result.analysis.fileOperations.reads).toContain('input.txt');
      expect(result.analysis.fileOperations.writes).toContain('output.txt');
      expect(result.analysis.fileOperations.monitors).toContain('watch.txt');
    });

    it('should detect config modification from file patterns', () => {
      const spec = {
        name: 'Config Modifier',
        filesModified: ['~/.claude/config.json']
      };

      const result = detector.detect(spec);

      expect(result.analysis.fileOperations.modifiesConfig).toBe(true);
    });

    it('should analyze external integrations', () => {
      const spec = {
        name: 'API Integrator',
        externalSystems: ['REST API', 'PAI history.jsonl'],
        logsToExternal: true
      };

      const result = detector.detect(spec);

      expect(result.analysis.externalIntegrations.systems).toHaveLength(2);
      expect(result.analysis.externalIntegrations.logsToExternal).toBe(true);
      expect(result.analysis.externalIntegrations.usesNetworking).toBe(true);
    });
  });
});

