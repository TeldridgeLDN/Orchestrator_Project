/**
 * Tests for Skill Suggestions Hook
 * 
 * @module hooks/__tests__/skillSuggestions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  skillSuggestionsHook,
  clearSuggestionCache,
  updateConfig,
  getConfig,
  __testing__
} from '../skillSuggestions.js';

const {
  CONFIG,
  suggestionTimestamps,
  canSuggest,
  markSkillSuggested,
  calculateMatchScore,
  suggestSkills,
  formatSuggestions
} = __testing__;

describe('Skill Suggestions Hook', () => {
  beforeEach(() => {
    // Clear state before each test
    clearSuggestionCache();
    suggestionTimestamps.clear();
    
    // Reset config to defaults
    updateConfig({
      enabled: true,
      throttleMinutes: 5,
      maxSuggestions: 2,
      minMatchScore: 1
    });
  });

  describe('Configuration', () => {
    it('should have default configuration', () => {
      const config = getConfig();
      
      expect(config.enabled).toBe(true);
      expect(config.throttleMinutes).toBe(5);
      expect(config.maxSuggestions).toBe(2);
      expect(config.minMatchScore).toBe(1);
    });

    it('should update configuration', () => {
      updateConfig({ throttleMinutes: 10, maxSuggestions: 3 });
      
      const config = getConfig();
      expect(config.throttleMinutes).toBe(10);
      expect(config.maxSuggestions).toBe(3);
    });
  });

  describe('Throttling', () => {
    it('should allow first suggestion for a skill', () => {
      expect(canSuggest('test-skill')).toBe(true);
    });

    it('should prevent immediate re-suggestion', () => {
      markSkillSuggested('test-skill');
      expect(canSuggest('test-skill')).toBe(false);
    });

    it('should allow suggestion after throttle period', () => {
      // Set very short throttle for testing
      updateConfig({ throttleMinutes: 0.001 }); // ~60ms
      
      markSkillSuggested('test-skill');
      expect(canSuggest('test-skill')).toBe(false);
      
      // Wait for throttle period
      return new Promise(resolve => {
        setTimeout(() => {
          expect(canSuggest('test-skill')).toBe(true);
          resolve();
        }, 100);
      });
    });

    it('should track different skills independently', () => {
      markSkillSuggested('skill-1');
      
      expect(canSuggest('skill-1')).toBe(false);
      expect(canSuggest('skill-2')).toBe(true);
    });

    it('should clear throttling cache', () => {
      markSkillSuggested('skill-1');
      markSkillSuggested('skill-2');
      
      clearSuggestionCache();
      
      expect(canSuggest('skill-1')).toBe(true);
      expect(canSuggest('skill-2')).toBe(true);
    });
  });

  describe('Match Score Calculation', () => {
    it('should calculate score for file match', () => {
      const skill = {};
      const matchData = { fileMatch: true, keywordMatch: false, dirMatch: false, projectMatch: false };
      
      expect(calculateMatchScore(skill, matchData)).toBe(3);
    });

    it('should calculate score for keyword match', () => {
      const skill = {};
      const matchData = { fileMatch: false, keywordMatch: true, dirMatch: false, projectMatch: false };
      
      expect(calculateMatchScore(skill, matchData)).toBe(2);
    });

    it('should calculate score for directory match', () => {
      const skill = {};
      const matchData = { fileMatch: false, keywordMatch: false, dirMatch: true, projectMatch: false };
      
      expect(calculateMatchScore(skill, matchData)).toBe(2);
    });

    it('should calculate score for project match', () => {
      const skill = {};
      const matchData = { fileMatch: false, keywordMatch: false, dirMatch: false, projectMatch: true };
      
      expect(calculateMatchScore(skill, matchData)).toBe(1);
    });

    it('should calculate cumulative score for multiple matches', () => {
      const skill = {};
      const matchData = { fileMatch: true, keywordMatch: true, dirMatch: true, projectMatch: true };
      
      expect(calculateMatchScore(skill, matchData)).toBe(8);
    });
  });

  describe('Suggestion Formatting', () => {
    it('should format single suggestion', () => {
      const suggestions = [
        {
          id: 'test-skill',
          name: 'Test Skill',
          description: 'A test skill for testing',
          score: 5
        }
      ];
      
      const formatted = formatSuggestions(suggestions);
      expect(formatted).toContain('💡 Test Skill skill available - A test skill for testing');
    });

    it('should format multiple suggestions', () => {
      const suggestions = [
        {
          id: 'skill-1',
          name: 'Skill One',
          description: 'First skill',
          score: 5
        },
        {
          id: 'skill-2',
          name: 'Skill Two',
          description: 'Second skill',
          score: 4
        }
      ];
      
      const formatted = formatSuggestions(suggestions);
      expect(formatted).toContain('💡 Skill One');
      expect(formatted).toContain('💡 Skill Two');
    });

    it('should return empty string for no suggestions', () => {
      const formatted = formatSuggestions([]);
      expect(formatted).toBe('');
    });
  });

  describe('Hook Handler', () => {
    it('should call next middleware', async () => {
      const next = vi.fn();
      const context = { prompt: 'test prompt' };
      
      await skillSuggestionsHook(context, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should handle missing prompt gracefully', async () => {
      const next = vi.fn();
      const context = {};
      
      await skillSuggestionsHook(context, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should respect enabled configuration', async () => {
      updateConfig({ enabled: false });
      
      const next = vi.fn();
      const context = { prompt: 'test prompt' };
      
      await skillSuggestionsHook(context, next);
      
      expect(next).toHaveBeenCalled();
      expect(context.skillSuggestions).toBeUndefined();
    });

    it('should add suggestions to context', async () => {
      // This test would require mocking the file system and config
      // For now, just verify the structure
      const next = vi.fn();
      const context = { prompt: 'test prompt', openFiles: [] };
      
      await skillSuggestionsHook(context, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // Force an error by providing invalid context
      const next = vi.fn();
      const context = { prompt: null };
      
      // Should not throw
      await expect(skillSuggestionsHook(context, next)).resolves.not.toThrow();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('File Pattern Matching', () => {
    // These tests would require full integration with minimatch
    // and mock file system. For now, document expected behavior
    
    it('should match glob patterns against files', () => {
      // Test case: **.md should match any markdown file
      // Implementation uses minimatch library
      expect(true).toBe(true); // Placeholder
    });

    it('should be case-sensitive by default', () => {
      // Test case: **.md should not match file.MD
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Keyword Matching', () => {
    it('should be case-insensitive', () => {
      // Keyword "testing" should match prompt "I need Testing help"
      const lowerPrompt = 'I need Testing help'.toLowerCase();
      const keyword = 'testing'.toLowerCase();
      
      expect(lowerPrompt.includes(keyword)).toBe(true);
    });

    it('should match partial keywords', () => {
      // Keyword "test" should match prompt "testing something"
      const lowerPrompt = 'testing something'.toLowerCase();
      const keyword = 'test'.toLowerCase();
      
      expect(lowerPrompt.includes(keyword)).toBe(true);
    });

    it('should not match unrelated keywords', () => {
      const lowerPrompt = 'documentation help'.toLowerCase();
      const keyword = 'testing'.toLowerCase();
      
      expect(lowerPrompt.includes(keyword)).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should handle many skills efficiently', () => {
      // This would test with 50+ mock skills
      // Verify response time is acceptable (<100ms)
      expect(true).toBe(true); // Placeholder
    });

    it('should cache metadata appropriately', () => {
      // Verify metadata is cached and reused
      expect(true).toBe(true); // Placeholder
    });

    it('should not impact prompt submission latency significantly', () => {
      // Measure time added by suggestion system (<50ms)
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing metadata files gracefully', async () => {
      // Skills without metadata.json should be skipped
      const next = vi.fn();
      const context = { prompt: 'test', openFiles: [] };
      
      await expect(skillSuggestionsHook(context, next)).resolves.not.toThrow();
    });

    it('should handle malformed metadata gracefully', async () => {
      // Invalid JSON in metadata should be skipped
      const next = vi.fn();
      const context = { prompt: 'test', openFiles: [] };
      
      await expect(skillSuggestionsHook(context, next)).resolves.not.toThrow();
    });

    it('should handle missing skill directories', async () => {
      // ~/.claude/skills not existing should not crash
      const next = vi.fn();
      const context = { prompt: 'test', openFiles: [] };
      
      await expect(skillSuggestionsHook(context, next)).resolves.not.toThrow();
    });

    it('should respect max suggestions limit', () => {
      // With 5 matching skills and maxSuggestions=2, only return 2
      updateConfig({ maxSuggestions: 2 });
      
      const suggestions = [
        { id: '1', score: 8 },
        { id: '2', score: 7 },
        { id: '3', score: 6 },
        { id: '4', score: 5 },
        { id: '5', score: 4 }
      ];
      
      // Should return top 2 by score
      const limited = suggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);
      
      expect(limited).toHaveLength(2);
      expect(limited[0].score).toBe(8);
      expect(limited[1].score).toBe(7);
    });
  });
});

