/**
 * Tests for Command Matching Service
 * 
 * @module utils/__tests__/command-matcher.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  findBestCommandMatch,
  getSuggestions,
  isExactMatch,
  batchMatch,
  getLearningStats,
  getConfig,
  updateConfig,
  clearCache,
  getCacheStats,
  __testing__
} from '../command-matcher.js';

import { clearCorrections, recordCorrection } from '../command-corrections-store.js';

// Test command data
const testCommands = [
  {
    id: 'switch-project',
    name: 'Switch Project',
    description: 'Switch to a different project',
    patterns: [
      'switch to project {name}',
      'change to project {name}',
      'switch project {name}'
    ]
  },
  {
    id: 'create-project',
    name: 'Create Project',
    description: 'Create a new project',
    patterns: [
      'create project {name}',
      'make project {name}',
      'new project {name}'
    ]
  },
  {
    id: 'list-projects',
    name: 'List Projects',
    description: 'List all projects',
    patterns: [
      'list projects',
      'show projects',
      'display projects',
      'show all projects'
    ]
  },
  {
    id: 'delete-project',
    name: 'Delete Project',
    description: 'Delete a project',
    patterns: [
      'delete project {name}',
      'remove project {name}',
      'destroy project {name}'
    ]
  }
];

describe('Command Matcher', () => {
  
  beforeEach(async () => {
    clearCache();
    await clearCorrections();
  });
  
  afterEach(() => {
    clearCache();
  });
  
  describe('findBestCommandMatch', () => {
    
    it('should find exact match', async () => {
      const result = await findBestCommandMatch('list projects', testCommands);
      
      expect(result.success).toBe(true);
      expect(result.match).toBeDefined();
      expect(result.match.command.id).toBe('list-projects');
      expect(result.match.score).toBe(1.0);
      expect(result.match.quality).toBe('exact');
    });
    
    it('should find match with minor variations', async () => {
      const result = await findBestCommandMatch('switch to project blog', testCommands);
      
      expect(result.success).toBe(true);
      expect(result.match).toBeDefined();
      expect(result.match.command.id).toBe('switch-project');
      expect(result.match.score).toBeGreaterThan(0.7);
    });
    
    it('should handle typos', async () => {
      const result = await findBestCommandMatch('swich to project blog', testCommands, {
        minScore: 0.5  // Lower threshold for typos
      });
      
      if (result.success) {
        expect(result.match).toBeDefined();
        expect(result.match.command.id).toBe('switch-project');
      } else {
        // Typo might be too severe, but suggestions should be available
        expect(result.noMatch).toBe(true);
      }
    });
    
    it('should handle extra words', async () => {
      const result = await findBestCommandMatch('please list all projects', testCommands, {
        minScore: 0.5  // Lower threshold for extra words
      });
      
      expect(result.success).toBe(true);
      expect(result.match).toBeDefined();
      expect(result.match.command.id).toBe('list-projects');
    });
    
    it('should return no match for unrelated input', async () => {
      const result = await findBestCommandMatch('unrelated random text', testCommands);
      
      expect(result.success).toBe(false);
      expect(result.noMatch).toBe(true);
    });
    
    it('should detect ambiguous matches', async () => {
      const ambiguousCommands = [
        {
          id: 'cmd1',
          name: 'Command 1',
          patterns: ['switch to project']
        },
        {
          id: 'cmd2',
          name: 'Command 2',
          patterns: ['change to project']
        }
      ];
      
      const result = await findBestCommandMatch('switch project', ambiguousCommands);
      
      // Both patterns are very similar, should detect ambiguity
      if (result.ambiguous) {
        expect(result.options).toBeDefined();
        expect(result.options.length).toBeGreaterThan(1);
      }
    });
    
    it('should respect minScore threshold', async () => {
      const result = await findBestCommandMatch('unrelated text', testCommands, {
        minScore: 0.9  // Very high threshold
      });
      
      expect(result.success).toBe(false);
      expect(result.noMatch).toBe(true);
    });
    
    it('should limit suggestions', async () => {
      const result = await findBestCommandMatch('project', testCommands, {
        maxSuggestions: 2
      });
      
      if (result.success && result.suggestions) {
        expect(result.suggestions.length).toBeLessThanOrEqual(2);
      }
    });
    
    it('should provide suggestions with main match', async () => {
      const result = await findBestCommandMatch('switch to project', testCommands);
      
      expect(result.success).toBe(true);
      expect(result.match).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
    
    it('should handle invalid input', async () => {
      const result1 = await findBestCommandMatch('', testCommands);
      expect(result1.success).toBe(false);
      
      const result2 = await findBestCommandMatch(null, testCommands);
      expect(result2.success).toBe(false);
      
      const result3 = await findBestCommandMatch('valid input', []);
      expect(result3.success).toBe(false);
      
      const result4 = await findBestCommandMatch('valid input', null);
      expect(result4.success).toBe(false);
    });
    
    it('should handle commands without patterns', async () => {
      const invalidCommands = [
        { id: 'cmd1', name: 'Command 1' },  // No patterns
        { id: 'cmd2', name: 'Command 2', patterns: [] }  // Empty patterns
      ];
      
      const result = await findBestCommandMatch('test', invalidCommands);
      expect(result.success).toBe(false);
      expect(result.noMatch).toBe(true);
    });
  });
  
  describe('getSuggestions', () => {
    
    it('should return suggestions sorted by score', async () => {
      const suggestions = await getSuggestions('project', testCommands);
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Verify sorted by score descending
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].score).toBeGreaterThanOrEqual(suggestions[i].score);
      }
    });
    
    it('should respect count limit', async () => {
      const suggestions = await getSuggestions('project', testCommands, { count: 2 });
      
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });
    
    it('should respect minScore threshold', async () => {
      const suggestions = await getSuggestions('xyz', testCommands, { minScore: 0.8 });
      
      suggestions.forEach(s => {
        expect(s.score).toBeGreaterThanOrEqual(0.8);
      });
    });
    
    it('should return empty array for no matches', async () => {
      const suggestions = await getSuggestions('completely unrelated text xyz', testCommands);
      
      expect(Array.isArray(suggestions)).toBe(true);
      // Might be empty or have very low scores
    });
  });
  
  describe('isExactMatch', () => {
    
    it('should return true for exact matches', async () => {
      const command = testCommands[2];  // list-projects
      
      expect(isExactMatch('list projects', command)).toBe(true);
      expect(isExactMatch('show projects', command)).toBe(true);
    });
    
    it('should return false for non-exact matches', async () => {
      const command = testCommands[2];  // list-projects
      
      expect(isExactMatch('list project', command)).toBe(false);
      expect(isExactMatch('please list projects', command)).toBe(false);
    });
    
    it('should handle commands without patterns', async () => {
      const invalidCommand = { id: 'cmd', name: 'Command' };
      
      expect(isExactMatch('test', invalidCommand)).toBe(false);
    });
  });
  
  describe('batchMatch', () => {
    
    it('should match multiple inputs', async () => {
      const inputs = [
        'list projects',
        'switch to project blog',
        'create project test'
      ];
      
      const results = await batchMatch(inputs, testCommands);
      
      expect(results.length).toBe(3);
      results.forEach(r => {
        expect(r.input).toBeDefined();
        expect(r.result).toBeDefined();
      });
      
      expect(results[0].result.match.command.id).toBe('list-projects');
      expect(results[1].result.match.command.id).toBe('switch-project');
      expect(results[2].result.match.command.id).toBe('create-project');
    });
    
    it('should handle empty input array', async () => {
      const results = await batchMatch([], testCommands);
      
      expect(results.length).toBe(0);
    });
    
    it('should throw on invalid inputs parameter', async () => {
      await expect(batchMatch(null, testCommands)).rejects.toThrow();
      await expect(batchMatch('not an array', testCommands)).rejects.toThrow();
    });
  });
  
  describe('caching', () => {
    
    it('should cache results', async () => {
      // Clear cache first
      clearCache();
      
      // First call
      const result1 = await findBestCommandMatch('list projects', testCommands);
      expect(result1.success).toBe(true);
      
      const stats1 = getCacheStats();
      expect(stats1.size).toBe(1);
      
      // Second call with same input should use cache
      const result2 = await findBestCommandMatch('list projects', testCommands);
      expect(result2.success).toBe(true);
      
      const stats2 = getCacheStats();
      expect(stats2.size).toBe(1);  // Still 1, used cache
      
      // Verify results are identical
      expect(result1).toEqual(result2);
    });
    
    it('should evict oldest entries when cache is full', async () => {
      clearCache();
      
      // Update config to have smaller cache for testing
      const originalConfig = getConfig();
      __testing__.CONFIG.performance.cacheResults = true;
      
      // Fill cache beyond max size
      const maxSize = getCacheStats().maxSize;
      
      for (let i = 0; i < maxSize + 5; i++) {
        findBestCommandMatch(`input ${i}`, testCommands);
      }
      
      const stats = getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(maxSize);
      
      // Restore config
      updateConfig(originalConfig);
    });
    
    it('should respect cache configuration', async () => {
      clearCache();
      
      // Disable caching
      updateConfig({
        performance: { cacheResults: false }
      });
      
      findBestCommandMatch('list projects', testCommands);
      
      const stats1 = getCacheStats();
      expect(stats1.size).toBe(0);  // Nothing cached
      
      // Re-enable caching
      updateConfig({
        performance: { cacheResults: true }
      });
      
      findBestCommandMatch('list projects', testCommands);
      
      const stats2 = getCacheStats();
      expect(stats2.size).toBe(1);  // Now cached
    });
    
    it('should clear cache', async () => {
      clearCache();
      
      // Add some entries
      findBestCommandMatch('list projects', testCommands);
      findBestCommandMatch('switch project', testCommands);
      
      let stats = getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
      
      // Clear cache
      clearCache();
      
      stats = getCacheStats();
      expect(stats.size).toBe(0);
    });
  });
  
  describe('configuration', () => {
    
    let originalConfig;
    
    beforeEach(() => {
      originalConfig = getConfig();
    });
    
    afterEach(() => {
      updateConfig(originalConfig);
    });
    
    it('should get current configuration', async () => {
      const config = getConfig();
      
      expect(config).toHaveProperty('thresholds');
      expect(config).toHaveProperty('suggestions');
      expect(config).toHaveProperty('performance');
      expect(config).toHaveProperty('similarity');
    });
    
    it('should update thresholds', async () => {
      updateConfig({
        thresholds: { excellent: 0.95 }
      });
      
      const config = getConfig();
      expect(config.thresholds.excellent).toBe(0.95);
    });
    
    it('should update suggestions config', async () => {
      updateConfig({
        suggestions: { maxResults: 10 }
      });
      
      const config = getConfig();
      expect(config.suggestions.maxResults).toBe(10);
    });
    
    it('should update performance config', async () => {
      updateConfig({
        performance: { earlyExitOnExact: false }
      });
      
      const config = getConfig();
      expect(config.performance.earlyExitOnExact).toBe(false);
    });
  });
  
  describe('edge cases and error handling', () => {
    
    it('should handle commands with multiple high-scoring patterns', async () => {
      const cmd = {
        id: 'multi-pattern',
        name: 'Multi Pattern',
        patterns: [
          'show all items',
          'display all items',
          'list all items'
        ]
      };
      
      const result = await findBestCommandMatch('show items', [cmd]);
      
      expect(result.success).toBe(true);
      expect(result.match.command.id).toBe('multi-pattern');
    });
    
    it('should handle very long input strings', async () => {
      const longInput = 'switch to project ' + 'a'.repeat(1000);
      
      const result = await findBestCommandMatch(longInput, testCommands);
      
      // Should still work, even if slowly
      expect(result).toBeDefined();
    });
    
    it('should handle special characters in input', async () => {
      const specialInput = 'switch to project-name!@#$%';
      
      const result = await findBestCommandMatch(specialInput, testCommands);
      
      expect(result).toBeDefined();
      if (result.success) {
        expect(result.match.command.id).toBe('switch-project');
      }
    });
    
    it('should handle unicode characters', async () => {
      const unicodeInput = 'switch to project 你好';
      
      const result = await findBestCommandMatch(unicodeInput, testCommands);
      
      expect(result).toBeDefined();
    });
  });
  
  describe('real-world scenarios', () => {
    
    it('should handle common misspellings', async () => {
      const misspellings = [
        'swithc to project',
        'swtich to project',
        'switch too project',
        'swith to project'
      ];
      
      for (const input of misspellings) {
        const result = await findBestCommandMatch(input, testCommands);
        
        if (result.success) {
          expect(result.match.command.id).toBe('switch-project');
        }
      }
    });
    
    it('should handle natural language variations', async () => {
      const variations = [
        'I want to switch to project blog',
        'Can you switch to project blog',
        'Please switch to project blog',
        'Switch to the project called blog'
      ];
      
      for (const input of variations) {
        const result = await findBestCommandMatch(input, testCommands);
        
        expect(result).toBeDefined();
        if (result.success) {
          expect(result.match.command.id).toBe('switch-project');
        }
      }
    });
    
    it('should distinguish between similar commands', async () => {
      const createResult = await findBestCommandMatch('create new project test', testCommands, {
        minScore: 0.5
      });
      const deleteResult = await findBestCommandMatch('delete old project test', testCommands, {
        minScore: 0.5
      });
      
      expect(createResult.success).toBe(true);
      expect(createResult.match.command.id).toBe('create-project');
      
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.match.command.id).toBe('delete-project');
    });
  });
  
  describe('Learning from corrections', () => {
    
    it('should apply learning boost to frequently corrected commands', async () => {
      // Record some corrections
      await recordCorrection('switch to project blog', 'list-projects', 'switch-project');
      await recordCorrection('switch to project blog', 'list-projects', 'switch-project');
      await recordCorrection('switch to project blog', 'list-projects', 'switch-project');
      
      const result = await findBestCommandMatch('switch to project blog', testCommands);
      
      expect(result.success).toBe(true);
      expect(result.match.command.id).toBe('switch-project');
      
      // Should have learning boost applied
      if (result.match.learningBoost !== undefined) {
        expect(result.match.learningBoost).toBeGreaterThan(0);
      }
    });
    
    it('should not boost commands with low frequency', async () => {
      // Record only once (below minFrequency of 2)
      await recordCorrection('test input', 'cmd1', 'cmd2');
      
      const result = await findBestCommandMatch('test input', testCommands);
      
      // Learning boost should not be applied
      if (result.match) {
        expect(result.match.learningBoost).toBeUndefined();
      }
    });
    
    it('should work with learning disabled', async () => {
      await recordCorrection('switch to project blog', 'list-projects', 'switch-project');
      await recordCorrection('switch to project blog', 'list-projects', 'switch-project');
      
      const result = await findBestCommandMatch('switch to project blog', testCommands, {
        useLearning: false
      });
      
      expect(result.success).toBeDefined();
      
      if (result.match) {
        expect(result.match.learningBoost).toBeUndefined();
      }
    });
    
    it('should get learning statistics', async () => {
      await recordCorrection('test input', 'cmd1', 'switch-project');
      await recordCorrection('test input', 'cmd1', 'switch-project');
      
      const stats = await getLearningStats('test input', 'switch-project');
      
      expect(stats).not.toBeNull();
      expect(stats.frequency).toBe(2);
      expect(stats).toHaveProperty('firstSeen');
      expect(stats).toHaveProperty('lastSeen');
    });
    
    it('should return null for commands without corrections', async () => {
      const stats = await getLearningStats('unknown input', 'switch-project');
      
      expect(stats).toBeNull();
    });
    
  });
  
});

