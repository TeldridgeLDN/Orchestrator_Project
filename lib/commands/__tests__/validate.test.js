/**
 * Tests for diet103 Validate Command
 * 
 * @module commands/validate.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateValidationReport,
  displayValidationReport,
  displayRepairResults
} from '../validate.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('Validate Command', () => {
  let testProjectPath;

  beforeEach(() => {
    testProjectPath = path.join(os.tmpdir(), 'test-validate-' + Date.now());
    fs.mkdirSync(testProjectPath, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testProjectPath)) {
      fs.rmSync(testProjectPath, { recursive: true, force: true });
    }
  });

  describe('generateValidationReport', () => {
    it('should generate report for empty project', () => {
      const checks = {
        hasDotClaude: false,
        hasClaudeMd: false,
        hasMetadata: false,
        hasSkillRules: false,
        hasHooks: false,
        hasUserPromptSubmit: false,
        hasPostToolUse: false,
        hasSkillsDir: false,
        hasCommandsDir: false,
        hasAgentsDir: false,
        hasResourcesDir: false,
        hasReadme: false,
        diet103Version: null
      };

      const gaps = {
        score: 0,
        isComplete: false,
        critical: [
          '.claude/ directory missing',
          'Claude.md missing',
          'metadata.json missing',
          'skill-rules.json missing',
          'hooks/ directory missing',
          'hooks/UserPromptSubmit.js missing',
          'hooks/PostToolUse.js missing'
        ],
        important: [
          'skills/ directory missing',
          'commands/ directory missing',
          'agents/ directory missing',
          'resources/ directory missing',
          'README.md missing'
        ]
      };

      const consistency = [
        'metadata.json does not exist',
        'skill-rules.json does not exist',
        'hooks/ directory does not exist',
        'Claude.md does not exist'
      ];

      const report = generateValidationReport(checks, gaps, consistency);

      expect(report.score).toBe(0);
      expect(report.isComplete).toBe(false);
      expect(report.components.critical.total).toBe(7);
      expect(report.components.critical.present).toBe(0);
      expect(report.components.critical.missing).toHaveLength(7);
      expect(report.components.important.total).toBe(5);
      expect(report.components.important.present).toBe(0);
      expect(report.consistency.valid).toBe(false);
      expect(report.consistency.issues).toHaveLength(4);
    });

    it('should generate report for complete project', () => {
      const checks = {
        hasDotClaude: true,
        hasClaudeMd: true,
        hasMetadata: true,
        hasSkillRules: true,
        hasHooks: true,
        hasUserPromptSubmit: true,
        hasPostToolUse: true,
        hasSkillsDir: true,
        hasCommandsDir: true,
        hasAgentsDir: true,
        hasResourcesDir: true,
        hasReadme: true,
        diet103Version: '1.2.0'
      };

      const gaps = {
        score: 100,
        isComplete: true,
        critical: [],
        important: []
      };

      const consistency = [];

      const report = generateValidationReport(checks, gaps, consistency);

      expect(report.score).toBe(100);
      expect(report.isComplete).toBe(true);
      expect(report.diet103Version).toBe('1.2.0');
      expect(report.components.critical.present).toBe(7);
      expect(report.components.critical.missing).toHaveLength(0);
      expect(report.components.important.present).toBe(5);
      expect(report.consistency.valid).toBe(true);
    });

    it('should generate report for partially complete project', () => {
      const checks = {
        hasDotClaude: true,
        hasClaudeMd: true,
        hasMetadata: true,
        hasSkillRules: true,
        hasHooks: false,
        hasUserPromptSubmit: false,
        hasPostToolUse: false,
        hasSkillsDir: false,
        hasCommandsDir: false,
        hasAgentsDir: false,
        hasResourcesDir: false,
        hasReadme: false,
        diet103Version: '1.2.0'
      };

      const gaps = {
        score: 58, // 4/7 critical * 70% + 0/5 important * 30%
        isComplete: false,
        critical: [
          'hooks/ directory missing',
          'hooks/UserPromptSubmit.js missing',
          'hooks/PostToolUse.js missing'
        ],
        important: [
          'skills/ directory missing',
          'commands/ directory missing',
          'agents/ directory missing',
          'resources/ directory missing',
          'README.md missing'
        ]
      };

      const consistency = ['hooks/ directory does not exist'];

      const report = generateValidationReport(checks, gaps, consistency);

      expect(report.score).toBe(58);
      expect(report.isComplete).toBe(false);
      expect(report.components.critical.present).toBe(4);
      expect(report.components.critical.missing).toHaveLength(3);
      expect(report.components.important.present).toBe(0);
      expect(report.components.important.missing).toHaveLength(5);
      expect(report.consistency.valid).toBe(false);
    });

    it('should include detailed checks in verbose mode', () => {
      const checks = {
        hasDotClaude: true,
        hasClaudeMd: true,
        diet103Version: '1.2.0'
      };

      const gaps = { score: 100, isComplete: true, critical: [], important: [] };
      const consistency = [];

      const report = generateValidationReport(checks, gaps, consistency, { verbose: true });

      expect(report.detailedChecks).toBeDefined();
      expect(report.detailedChecks).toEqual(checks);
    });

    it('should not include detailed checks in non-verbose mode', () => {
      const checks = {
        hasDotClaude: true,
        hasClaudeMd: true,
        diet103Version: '1.2.0'
      };

      const gaps = { score: 100, isComplete: true, critical: [], important: [] };
      const consistency = [];

      const report = generateValidationReport(checks, gaps, consistency, { verbose: false });

      expect(report.detailedChecks).toBeUndefined();
    });
  });

  describe('displayValidationReport', () => {
    it('should not throw for empty project report', () => {
      const report = {
        score: 0,
        isComplete: false,
        diet103Version: null,
        components: {
          critical: { total: 7, present: 0, missing: ['test'] },
          important: { total: 5, present: 0, missing: ['test'] }
        },
        consistency: { valid: false, issues: ['error'] }
      };

      expect(() => displayValidationReport(report)).not.toThrow();
    });

    it('should not throw for complete project report', () => {
      const report = {
        score: 100,
        isComplete: true,
        diet103Version: '1.2.0',
        components: {
          critical: { total: 7, present: 7, missing: [] },
          important: { total: 5, present: 5, missing: [] }
        },
        consistency: { valid: true, issues: [] }
      };

      expect(() => displayValidationReport(report)).not.toThrow();
    });

    it('should not throw in verbose mode', () => {
      const report = {
        score: 100,
        isComplete: true,
        diet103Version: '1.2.0',
        components: {
          critical: { total: 7, present: 7, missing: [] },
          important: { total: 5, present: 5, missing: [] }
        },
        consistency: { valid: true, issues: [] },
        detailedChecks: {
          hasDotClaude: true,
          hasClaudeMd: true
        }
      };

      expect(() => displayValidationReport(report, { verbose: true })).not.toThrow();
    });
  });

  describe('displayRepairResults', () => {
    it('should not throw for successful repair', () => {
      const repairResult = {
        before: { score: 0, criticalGaps: 7, importantGaps: 5 },
        after: { score: 100, criticalGaps: 0, importantGaps: 0 },
        installed: {
          critical: ['.claude/', 'Claude.md'],
          important: ['skills/', 'commands/']
        },
        totalInstalled: 4,
        success: true
      };

      expect(() => displayRepairResults(repairResult)).not.toThrow();
    });

    it('should not throw for partial repair', () => {
      const repairResult = {
        before: { score: 0, criticalGaps: 7, importantGaps: 5 },
        after: { score: 70, criticalGaps: 0, importantGaps: 5 },
        installed: {
          critical: ['.claude/', 'Claude.md'],
          important: []
        },
        totalInstalled: 2,
        success: true
      };

      expect(() => displayRepairResults(repairResult)).not.toThrow();
    });
  });
});

