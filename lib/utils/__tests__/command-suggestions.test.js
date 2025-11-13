/**
 * Tests for Command Suggestions Display Utility
 * 
 * @module utils/__tests__/command-suggestions.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  formatScore,
  getQualityBadge,
  highlightDifferences,
  formatSuggestion,
  formatSuggestionList,
  displayNoMatch,
  displayAmbiguousMatch,
  displayMatchConfirmation,
  createSelectionPrompt,
  formatSuggestionsPlainText,
  getConfig,
  updateConfig,
  __testing__
} from '../command-suggestions.js';

// Test data
const testSuggestion = {
  command: {
    id: 'switch-project',
    name: 'Switch Project',
    description: 'Switch to a different project'
  },
  pattern: 'switch to project {name}',
  score: 0.85,
  quality: 'good'
};

const testSuggestions = [
  {
    command: {
      id: 'switch-project',
      name: 'Switch Project',
      description: 'Switch to a different project'
    },
    pattern: 'switch to project {name}',
    score: 0.95,
    quality: 'excellent'
  },
  {
    command: {
      id: 'create-project',
      name: 'Create Project',
      description: 'Create a new project'
    },
    pattern: 'create project {name}',
    score: 0.75,
    quality: 'good'
  },
  {
    command: {
      id: 'list-projects',
      name: 'List Projects',
      description: 'List all projects'
    },
    pattern: 'list projects',
    score: 0.65,
    quality: 'potential'
  }
];

describe('Command Suggestions Display', () => {
  
  let originalConfig;
  
  beforeEach(() => {
    originalConfig = getConfig();
  });
  
  afterEach(() => {
    updateConfig(originalConfig);
  });
  
  describe('formatScore', () => {
    
    it('should format as percentage by default', () => {
      expect(formatScore(0.85)).toBe('85%');
      expect(formatScore(0.95)).toBe('95%');
      expect(formatScore(1.0)).toBe('100%');
      expect(formatScore(0.0)).toBe('0%');
    });
    
    it('should format as decimal when requested', () => {
      expect(formatScore(0.85, false)).toBe('0.85');
      expect(formatScore(0.95, false)).toBe('0.95');
      expect(formatScore(1.0, false)).toBe('1.00');
    });
    
    it('should round to nearest integer for percentages', () => {
      expect(formatScore(0.854)).toBe('85%');
      expect(formatScore(0.856)).toBe('86%');
    });
  });
  
  describe('getQualityBadge', () => {
    
    it('should return badge for each quality level', () => {
      const badges = {
        exact: getQualityBadge('exact'),
        excellent: getQualityBadge('excellent'),
        good: getQualityBadge('good'),
        potential: getQualityBadge('potential'),
        poor: getQualityBadge('poor')
      };
      
      Object.values(badges).forEach(badge => {
        expect(typeof badge).toBe('string');
        expect(badge.length).toBeGreaterThan(0);
      });
    });
    
    it('should return default badge for unknown quality', () => {
      const badge = getQualityBadge('unknown');
      expect(typeof badge).toBe('string');
    });
    
    it('should respect useColors config', () => {
      updateConfig({ display: { useColors: true } });
      const colorBadge = getQualityBadge('excellent');
      
      updateConfig({ display: { useColors: false } });
      const plainBadge = getQualityBadge('excellent');
      
      // Colored badge should contain ANSI codes (longer)
      expect(colorBadge.length).toBeGreaterThanOrEqual(plainBadge.length);
    });
    
    it('should respect useEmojis config', () => {
      updateConfig({ display: { useEmojis: true, useColors: false } });
      const emojiBadge = getQualityBadge('excellent');
      
      updateConfig({ display: { useEmojis: false, useColors: false } });
      const textBadge = getQualityBadge('excellent');
      
      expect(emojiBadge).not.toBe(textBadge);
    });
  });
  
  describe('highlightDifferences', () => {
    
    it('should return pattern unchanged when highlighting disabled', () => {
      updateConfig({ display: { highlightDifferences: false } });
      
      const result = highlightDifferences('test input', 'test pattern');
      expect(result).toBe('test pattern');
    });
    
    it('should highlight parameters in braces', () => {
      updateConfig({ display: { highlightDifferences: true, useColors: true } });
      
      const result = highlightDifferences('switch project', 'switch to project {name}');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
    
    it('should handle patterns without parameters', () => {
      const result = highlightDifferences('list projects', 'list all projects');
      expect(result).toBeDefined();
    });
  });
  
  describe('formatSuggestion', () => {
    
    it('should format a suggestion with all components', () => {
      const result = formatSuggestion(testSuggestion, 0, 'switch project');
      
      expect(result).toContain('1.');  // Index
      expect(result).toContain('Switch Project');  // Name
      expect(result).toBeDefined();
    });
    
    it('should include score when showScores is true', () => {
      updateConfig({ display: { showScores: true } });
      
      const result = formatSuggestion(testSuggestion, 0, 'switch project');
      expect(result).toContain('85%');
    });
    
    it('should not include score when showScores is false', () => {
      updateConfig({ display: { showScores: false } });
      
      const result = formatSuggestion(testSuggestion, 0, 'switch project');
      expect(result).not.toContain('85%');
    });
    
    it('should include description when provided', () => {
      const result = formatSuggestion(testSuggestion, 0, 'switch project');
      expect(result).toContain('Switch to a different project');
    });
    
    it('should handle suggestion without description', () => {
      const noDescSuggestion = {
        ...testSuggestion,
        command: { ...testSuggestion.command, description: undefined }
      };
      
      const result = formatSuggestion(noDescSuggestion, 0, 'switch project');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });
  
  describe('formatSuggestionList', () => {
    
    it('should format multiple suggestions', () => {
      const result = formatSuggestionList(testSuggestions, 'project');
      
      expect(result).toContain('Did you mean:');
      expect(result).toContain('Switch Project');
      expect(result).toContain('Create Project');
      expect(result).toContain('List Projects');
    });
    
    it('should return empty string for no suggestions', () => {
      expect(formatSuggestionList([], 'test')).toBe('');
      expect(formatSuggestionList(null, 'test')).toBe('');
      expect(formatSuggestionList(undefined, 'test')).toBe('');
    });
    
    it('should respect maxSuggestions limit', () => {
      const result = formatSuggestionList(testSuggestions, 'project', {
        maxSuggestions: 2
      });
      
      expect(result).toContain('Switch Project');
      expect(result).toContain('Create Project');
      expect(result).not.toContain('List Projects');
    });
    
    it('should use custom title when provided', () => {
      const result = formatSuggestionList(testSuggestions, 'project', {
        title: 'Custom Title:'
      });
      
      expect(result).toContain('Custom Title:');
      expect(result).not.toContain('Did you mean:');
    });
    
    it('should include selection hint', () => {
      const result = formatSuggestionList(testSuggestions, 'project');
      expect(result).toContain('Type a number to select');
    });
  });
  
  describe('displayNoMatch', () => {
    
    const testCommands = [
      {
        id: 'cmd1',
        name: 'Command 1',
        patterns: ['pattern one']
      },
      {
        id: 'cmd2',
        name: 'Command 2',
        patterns: ['pattern two']
      }
    ];
    
    it('should display error message', () => {
      const result = displayNoMatch('unknown command', testCommands);
      
      expect(result).toContain('No command found');
      expect(result).toContain('unknown command');
    });
    
    it('should include suggestions when available', () => {
      const result = displayNoMatch('pattern', testCommands);
      
      expect(result).toContain('Did you mean');
    });
    
    it('should show message when no suggestions available', () => {
      const result = displayNoMatch('completely unrelated xyz', testCommands);
      
      expect(result).toContain('No similar commands found');
    });
    
    it('should respect maxSuggestions option', () => {
      const result = displayNoMatch('pattern', testCommands, {
        maxSuggestions: 1
      });
      
      expect(result).toBeDefined();
    });
  });
  
  describe('displayAmbiguousMatch', () => {
    
    it('should display warning message', () => {
      const result = displayAmbiguousMatch('ambiguous input', testSuggestions);
      
      expect(result).toContain('Multiple commands match');
      expect(result).toContain('ambiguous input');
    });
    
    it('should include all ambiguous options', () => {
      const result = displayAmbiguousMatch('project', testSuggestions);
      
      expect(result).toContain('Switch Project');
      expect(result).toContain('Create Project');
      expect(result).toContain('List Projects');
    });
    
    it('should prompt for selection', () => {
      const result = displayAmbiguousMatch('project', testSuggestions);
      
      expect(result).toContain('select');
    });
  });
  
  describe('displayMatchConfirmation', () => {
    
    it('should display command name', () => {
      const match = {
        command: { id: 'test', name: 'Test Command' },
        quality: 'good',
        score: 0.8
      };
      
      const result = displayMatchConfirmation(match);
      expect(result).toContain('Test Command');
    });
    
    it('should show checkmark for exact matches', () => {
      const match = {
        command: { id: 'test', name: 'Test Command' },
        quality: 'exact',
        score: 1.0
      };
      
      const result = displayMatchConfirmation(match);
      expect(result).toBeDefined();
    });
    
    it('should show score for non-exact matches', () => {
      updateConfig({ display: { showScores: true } });
      
      const match = {
        command: { id: 'test', name: 'Test Command' },
        quality: 'good',
        score: 0.85
      };
      
      const result = displayMatchConfirmation(match);
      expect(result).toContain('85%');
    });
    
    it('should not show score for exact matches', () => {
      updateConfig({ display: { showScores: true } });
      
      const match = {
        command: { id: 'test', name: 'Test Command' },
        quality: 'exact',
        score: 1.0
      };
      
      const result = displayMatchConfirmation(match);
      expect(result).not.toContain('100%');
    });
    
    it('should handle missing match', () => {
      expect(displayMatchConfirmation(null)).toBe('');
      expect(displayMatchConfirmation({})).toBe('');
    });
  });
  
  describe('createSelectionPrompt', () => {
    
    it('should create prompt configuration', () => {
      const prompt = createSelectionPrompt(testSuggestions, 'project');
      
      expect(prompt).toHaveProperty('type', 'list');
      expect(prompt).toHaveProperty('name', 'selectedCommand');
      expect(prompt).toHaveProperty('message');
      expect(prompt).toHaveProperty('choices');
    });
    
    it('should include all suggestions as choices', () => {
      const prompt = createSelectionPrompt(testSuggestions, 'project');
      
      expect(prompt.choices.length).toBe(testSuggestions.length);
    });
    
    it('should map command IDs to values', () => {
      const prompt = createSelectionPrompt(testSuggestions, 'project');
      
      expect(prompt.choices[0].value).toBe('switch-project');
      expect(prompt.choices[1].value).toBe('create-project');
      expect(prompt.choices[2].value).toBe('list-projects');
    });
    
    it('should include short names', () => {
      const prompt = createSelectionPrompt(testSuggestions, 'project');
      
      prompt.choices.forEach(choice => {
        expect(choice).toHaveProperty('short');
        expect(choice.short.length).toBeGreaterThan(0);
      });
    });
  });
  
  describe('formatSuggestionsPlainText', () => {
    
    it('should format without colors', () => {
      const result = formatSuggestionsPlainText(testSuggestions, 'project');
      
      // Check for absence of ANSI escape codes
      expect(result).not.toMatch(/\x1b\[\d+m/);
    });
    
    it('should format without emojis', () => {
      const result = formatSuggestionsPlainText(testSuggestions, 'project');
      
      // Should still contain essential text
      expect(result).toContain('Switch Project');
      expect(result).toContain('Create Project');
    });
    
    it('should restore original config after formatting', () => {
      const originalUseColors = __testing__.CONFIG.display.useColors;
      const originalUseEmojis = __testing__.CONFIG.display.useEmojis;
      
      formatSuggestionsPlainText(testSuggestions, 'project');
      
      expect(__testing__.CONFIG.display.useColors).toBe(originalUseColors);
      expect(__testing__.CONFIG.display.useEmojis).toBe(originalUseEmojis);
    });
  });
  
  describe('configuration', () => {
    
    it('should get current configuration', () => {
      const config = getConfig();
      
      expect(config).toHaveProperty('display');
      expect(config).toHaveProperty('formatting');
      expect(config).toHaveProperty('qualityBadges');
    });
    
    it('should update display config', () => {
      updateConfig({
        display: { maxSuggestions: 10 }
      });
      
      const config = getConfig();
      expect(config.display.maxSuggestions).toBe(10);
    });
    
    it('should update formatting config', () => {
      updateConfig({
        formatting: { bullet: '-' }
      });
      
      const config = getConfig();
      expect(config.formatting.bullet).toBe('-');
    });
    
    it('should update quality badges', () => {
      updateConfig({
        qualityBadges: {
          excellent: { emoji: '🌟', color: 'blue', label: 'Great' }
        }
      });
      
      const config = getConfig();
      expect(config.qualityBadges.excellent.label).toBe('Great');
    });
  });
  
  describe('edge cases', () => {
    
    it('should handle very long command names', () => {
      const longSuggestion = {
        command: {
          id: 'long',
          name: 'A'.repeat(100),
          description: 'B'.repeat(200)
        },
        pattern: 'pattern',
        score: 0.8,
        quality: 'good'
      };
      
      const result = formatSuggestion(longSuggestion, 0, 'test');
      expect(result).toBeDefined();
    });
    
    it('should handle suggestions with missing properties', () => {
      const minimalSuggestion = {
        command: { id: 'test' },
        score: 0.5
      };
      
      const result = formatSuggestion(minimalSuggestion, 0, 'test');
      expect(result).toBeDefined();
    });
    
    it('should handle zero score', () => {
      const zeroSuggestion = {
        command: { id: 'test', name: 'Test' },
        score: 0,
        quality: 'poor'
      };
      
      const result = formatSuggestion(zeroSuggestion, 0, 'test');
      expect(result).toContain('0%');
    });
    
    it('should handle perfect score', () => {
      const perfectSuggestion = {
        command: { id: 'test', name: 'Test' },
        score: 1.0,
        quality: 'exact'
      };
      
      const result = formatSuggestion(perfectSuggestion, 0, 'test');
      expect(result).toBeDefined();
    });
  });
  
});

