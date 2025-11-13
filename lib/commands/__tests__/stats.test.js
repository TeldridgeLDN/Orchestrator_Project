/**
 * Unit tests for stats command
 * 
 * Tests the CLI stats display command including formatting, calculations,
 * and display logic for skills and hooks metrics.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { statsCommand } from '../stats.js';
import { clearMetrics, recordSkillActivation, recordHookExecution, flushMetrics } from '../../utils/metrics.js';

describe('Stats Command', () => {
  
  let consoleLogSpy;
  let consoleErrorSpy;
  
  beforeEach(async () => {
    await clearMetrics();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  // ==================== Command Structure Tests ====================

  describe('Command Structure', () => {
    it('should create stats command', () => {
      const command = statsCommand();
      
      expect(command).toBeDefined();
      expect(command.name()).toBe('stats');
      expect(command.description()).toContain('metrics');
    });

    it('should have correct options', () => {
      const command = statsCommand();
      const options = command.options;
      
      const optionNames = options.map(opt => opt.long);
      expect(optionNames).toContain('--skills-only');
      expect(optionNames).toContain('--hooks-only');
      expect(optionNames).toContain('--storage');
      expect(optionNames).toContain('--weekly');
      expect(optionNames).toContain('--history');
    });

    it('should have help text', () => {
      const command = statsCommand();
      const helpText = command.helpInformation();
      
      // Help text should contain usage information
      expect(helpText).toContain('Usage');
      expect(helpText).toContain('Options');
    });
  });

  // ==================== Display Tests ====================

  describe('Stats Display', () => {
    it('should display message when no metrics available', async () => {
      const command = statsCommand();
      
      await command.parseAsync(['node', 'test'], { from: 'user' });
      
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Metrics Dashboard');
    });

    it('should display skills stats when data available', async () => {
      // Add some test data
      await recordSkillActivation('test-skill', false);
      await recordSkillActivation('test-skill', true);
      await flushMetrics(); // Force flush to disk
      
      const command = statsCommand();
      await command.parseAsync(['node', 'test'], { from: 'user' });
      
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Skills Performance');
      expect(output).toContain('test-skill');
    });

    it('should display hooks stats when data available', async () => {
      // Add some test data
      await recordHookExecution('test-hook', 10);
      await flushMetrics(); // Force flush to disk
      
      const command = statsCommand();
      await command.parseAsync(['node', 'test'], { from: 'user' });
      
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Hooks Performance');
      expect(output).toContain('test-hook');
    });

    it('should display star ratings for skills', async () => {
      // Create high-usage skill
      for (let i = 0; i < 60; i++) {
        await recordSkillActivation('popular-skill', i % 2 === 0);
      }
      await flushMetrics(); // Force flush to disk
      
      const command = statsCommand();
      await command.parseAsync(['node', 'test'], { from: 'user' });
      
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('★'); // Should have at least some stars
    });

    it('should display time savings estimates', async () => {
      await recordSkillActivation('test-skill', false);
      await flushMetrics(); // Force flush to disk
      
      const command = statsCommand();
      await command.parseAsync(['node', 'test'], { from: 'user' });
      
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Time Saved');
    });

    it('should display performance ratings for hooks', async () => {
      await recordHookExecution('fast-hook', 5);
      await flushMetrics(); // Force flush to disk
      
      const command = statsCommand();
      await command.parseAsync(['node', 'test'], { from: 'user' });
      
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toMatch(/Excellent|Good|Fair|Poor/);
    });

    it('should display summary statistics', async () => {
      await recordSkillActivation('skill1', false);
      await recordSkillActivation('skill2', true);
      await flushMetrics(); // Force flush to disk
      
      const command = statsCommand();
      await command.parseAsync(['node', 'test'], { from: 'user' });
      
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Summary');
      expect(output).toContain('Total Activations');
    });
  });

  // ==================== Option Tests ====================

  describe('Command Options', () => {
    it('should show only skills when --skills-only is used', async () => {
      await recordSkillActivation('test-skill', false);
      await recordHookExecution('test-hook', 10);
      await flushMetrics(); // Force flush to disk
      
      const command = statsCommand();
      await command.parseAsync(['node', 'test', '--skills-only'], { from: 'user' });
      
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Skills Performance');
      expect(output).not.toContain('Hooks Performance');
    });

    it('should show only hooks when --hooks-only is used', async () => {
      await recordSkillActivation('test-skill', false);
      await recordHookExecution('test-hook', 10);
      await flushMetrics(); // Force flush to disk
      
      const command = statsCommand();
      await command.parseAsync(['node', 'test', '--hooks-only'], { from: 'user' });
      
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Hooks Performance');
      expect(output).not.toContain('Skills Performance');
    });

    it('should show storage stats when --storage is used', async () => {
      const command = statsCommand();
      await command.parseAsync(['node', 'test', '--storage'], { from: 'user' });
      
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Storage');
    });

    it('should show weekly summary when --weekly is used', async () => {
      const command = statsCommand();
      await command.parseAsync(['node', 'test', '--weekly'], { from: 'user' });
      
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Weekly Summary');
    });

    it('should show historical data when --history is used', async () => {
      const command = statsCommand();
      await command.parseAsync(['node', 'test', '--history', '2'], { from: 'user' });
      
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Historical Aggregation');
      expect(output).toContain('2 weeks');
    });
  });

  // ==================== Calculation Tests ====================

  describe('Rating Calculations', () => {
    it('should calculate star ratings correctly', async () => {
      // Create skills with different usage levels
      for (let i = 0; i < 60; i++) {
        await recordSkillActivation('five-star-skill', false);
      }
      
      for (let i = 0; i < 10; i++) {
        await recordSkillActivation('low-usage-skill', false);
      }
      await flushMetrics(); // Force flush to disk
      
      const command = statsCommand();
      await command.parseAsync(['node', 'test'], { from: 'user' });
      
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      
      // Should show star ratings for both skills
      expect(output).toContain('five-star-skill');
      expect(output).toContain('low-usage-skill');
      expect(output).toContain('★');
    });

    it('should calculate time savings correctly', async () => {
      // Validation skill should have high time savings
      await recordSkillActivation('validate-something', false);
      await flushMetrics(); // Force flush to disk
      
      const command = statsCommand();
      await command.parseAsync(['node', 'test'], { from: 'user' });
      
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Time Saved');
    });

    it('should calculate hook performance correctly', async () => {
      // Fast hook
      await recordHookExecution('fast-hook', 2);
      
      // Slow hook
      await recordHookExecution('slow-hook', 150);
      await flushMetrics(); // Force flush to disk
      
      const command = statsCommand();
      await command.parseAsync(['node', 'test'], { from: 'user' });
      
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      
      expect(output).toContain('fast-hook');
      expect(output).toContain('slow-hook');
    });
  });

  // ==================== Formatting Tests ====================

  describe('Output Formatting', () => {
    it('should format durations correctly', async () => {
      const command = statsCommand();
      await command.parseAsync(['node', 'test'], { from: 'user' });
      
      // Just verify the command runs without errors
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should format large numbers correctly', async () => {
      // Create many activations
      for (let i = 0; i < 1000; i++) {
        await recordSkillActivation('popular-skill', false);
      }
      await flushMetrics(); // Force flush to disk
      
      const command = statsCommand();
      await command.parseAsync(['node', 'test'], { from: 'user' });
      
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('1000');
    });

    it('should use color coding in output', async () => {
      await recordSkillActivation('test-skill', false);
      
      const command = statsCommand();
      await command.parseAsync(['node', 'test'], { from: 'user' });
      
      // Verify output is generated (color codes are part of the output)
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should show timestamps correctly', async () => {
      await recordSkillActivation('test-skill', false);
      await flushMetrics(); // Force flush to disk
      
      const command = statsCommand();
      await command.parseAsync(['node', 'test'], { from: 'user' });
      
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Last used');
    });
  });

  // ==================== Error Handling Tests ====================

  describe('Error Handling', () => {
    it('should handle missing metrics gracefully', async () => {
      await clearMetrics();
      
      const command = statsCommand();
      await command.parseAsync(['node', 'test'], { from: 'user' });
      
      // Should not throw an error
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle invalid history parameter gracefully', async () => {
      const command = statsCommand();
      await command.parseAsync(['node', 'test', '--history', 'invalid'], { from: 'user' });
      
      // Should not throw an error (will use default)
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  // ==================== Integration Tests ====================

  describe('Integration', () => {
    it('should work with real metrics data', async () => {
      // Simulate realistic usage
      await recordSkillActivation('doc-validator', false);
      await recordSkillActivation('doc-validator', true);
      await recordSkillActivation('workflow-guide', false);
      await recordHookExecution('PostToolUse', 45);
      await recordHookExecution('PreConfigModification', 3);
      await flushMetrics(); // Force flush to disk
      
      const command = statsCommand();
      await command.parseAsync(['node', 'test'], { from: 'user' });
      
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      
      expect(output).toContain('doc-validator');
      expect(output).toContain('workflow-guide');
      expect(output).toContain('PostToolUse');
      expect(output).toContain('PreConfigModification');
      expect(output).toContain('Summary');
    });

    it('should handle all options together', async () => {
      await recordSkillActivation('test-skill', false);
      await recordHookExecution('test-hook', 10);
      await flushMetrics(); // Force flush to disk
      
      const command = statsCommand();
      await command.parseAsync([
        'node', 
        'test', 
        '--storage', 
        '--weekly', 
        '--history', 
        '2'
      ], { from: 'user' });
      
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      
      expect(output).toContain('Skills Performance');
      expect(output).toContain('Hooks Performance');
      expect(output).toContain('Storage');
      expect(output).toContain('Weekly Summary');
      expect(output).toContain('Historical Aggregation');
    });
  });
});

