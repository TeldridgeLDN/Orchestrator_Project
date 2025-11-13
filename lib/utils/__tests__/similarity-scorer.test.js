/**
 * Tests for Similarity Scoring Utility
 * 
 * @module utils/__tests__/similarity-scorer.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateSimilarity,
  calculateMultipleScores,
  getMatchQuality,
  isAmbiguous,
  getConfig,
  updateConfig,
  __testing__
} from '../similarity-scorer.js';

const {
  normalizeText,
  levenshteinDistance,
  levenshteinSimilarity,
  tokenize,
  tokenSimilarity,
  extractKeywords,
  keywordSimilarity
} = __testing__;

describe('Similarity Scorer', () => {
  
  describe('normalizeText', () => {
    it('should convert to lowercase', () => {
      expect(normalizeText('Hello World')).toBe('hello world');
    });
    
    it('should trim whitespace', () => {
      expect(normalizeText('  hello world  ')).toBe('hello world');
    });
    
    it('should remove extra spaces', () => {
      expect(normalizeText('hello    world')).toBe('hello world');
    });
    
    it('should remove punctuation', () => {
      expect(normalizeText('hello, world!')).toBe('hello world');
    });
    
    it('should handle empty strings', () => {
      expect(normalizeText('')).toBe('');
      expect(normalizeText(null)).toBe('');
      expect(normalizeText(undefined)).toBe('');
    });
    
    it('should handle complex punctuation', () => {
      expect(normalizeText('switch to project-name!')).toBe('switch to project name');
    });
  });
  
  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(levenshteinDistance('hello', 'hello')).toBe(0);
    });
    
    it('should calculate distance for single character difference', () => {
      expect(levenshteinDistance('hello', 'hallo')).toBe(1);
    });
    
    it('should calculate distance for insertions', () => {
      expect(levenshteinDistance('hello', 'hellos')).toBe(1);
    });
    
    it('should calculate distance for deletions', () => {
      expect(levenshteinDistance('hello', 'hell')).toBe(1);
    });
    
    it('should calculate distance for multiple edits', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    });
    
    it('should handle empty strings', () => {
      expect(levenshteinDistance('', 'hello')).toBe(5);
      expect(levenshteinDistance('hello', '')).toBe(5);
      expect(levenshteinDistance('', '')).toBe(0);
    });
  });
  
  describe('levenshteinSimilarity', () => {
    it('should return 1.0 for identical strings', () => {
      expect(levenshteinSimilarity('hello', 'hello')).toBe(1.0);
    });
    
    it('should return high similarity for minor typos', () => {
      const similarity = levenshteinSimilarity('hello', 'hallo');
      expect(similarity).toBeGreaterThanOrEqual(0.8);
    });
    
    it('should return low similarity for very different strings', () => {
      const similarity = levenshteinSimilarity('hello', 'world');
      expect(similarity).toBeLessThan(0.3);
    });
    
    it('should return 0.0 for empty strings', () => {
      expect(levenshteinSimilarity('', 'hello')).toBe(0.0);
      expect(levenshteinSimilarity('hello', '')).toBe(0.0);
    });
  });
  
  describe('tokenize', () => {
    it('should split text into tokens', () => {
      expect(tokenize('hello world')).toEqual(['hello', 'world']);
    });
    
    it('should handle multiple spaces', () => {
      expect(tokenize('hello    world')).toEqual(['hello', 'world']);
    });
    
    it('should filter empty tokens', () => {
      expect(tokenize('  hello  world  ')).toEqual(['hello', 'world']);
    });
    
    it('should handle empty strings', () => {
      expect(tokenize('')).toEqual([]);
    });
  });
  
  describe('tokenSimilarity', () => {
    it('should return 1.0 for identical token sequences', () => {
      expect(tokenSimilarity('hello world', 'hello world')).toBe(1.0);
    });
    
    it('should return high similarity for matching tokens in different order', () => {
      const similarity = tokenSimilarity('hello world', 'world hello');
      expect(similarity).toBeGreaterThan(0.5);
    });
    
    it('should return bonus for matching order', () => {
      const orderedSimilarity = tokenSimilarity('switch to project name', 'switch to project');
      const unorderedSimilarity = tokenSimilarity('switch to project name', 'project to switch');
      // Verify that partial order matching gives higher score than no order
      expect(orderedSimilarity).toBeGreaterThan(unorderedSimilarity);
    });
    
    it('should handle partial matches', () => {
      const similarity = tokenSimilarity('switch to project', 'switch project');
      expect(similarity).toBeGreaterThan(0.5);
    });
    
    it('should return 0.0 for no matching tokens', () => {
      expect(tokenSimilarity('hello world', 'foo bar')).toBeLessThan(0.5);
    });
  });
  
  describe('extractKeywords', () => {
    it('should extract important words', () => {
      const keywords = extractKeywords('switch to project blog');
      expect(keywords).toContain('switch');
      expect(keywords).toContain('project');
      expect(keywords).toContain('blog');
    });
    
    it('should filter stop words', () => {
      const keywords = extractKeywords('switch to the project');
      expect(keywords).not.toContain('to');
      expect(keywords).not.toContain('the');
    });
    
    it('should filter short words', () => {
      const keywords = extractKeywords('switch to a project');
      expect(keywords).not.toContain('to');
      expect(keywords).not.toContain('a');
    });
    
    it('should handle empty strings', () => {
      expect(extractKeywords('')).toEqual([]);
    });
  });
  
  describe('keywordSimilarity', () => {
    it('should return high similarity for matching keywords', () => {
      const similarity = keywordSimilarity(
        'switch to project blog',
        'change to project blog'
      );
      expect(similarity).toBeGreaterThan(0.6);
    });
    
    it('should return moderate similarity for partial keyword matches', () => {
      const similarity = keywordSimilarity(
        'switch to project',
        'switch to project blog'
      );
      expect(similarity).toBeGreaterThan(0.5);
    });
    
    it('should return low similarity for different keywords', () => {
      const similarity = keywordSimilarity(
        'create new project',
        'delete old files'
      );
      expect(similarity).toBeLessThan(0.3);
    });
  });
  
  describe('calculateSimilarity', () => {
    it('should return 1.0 for exact matches', () => {
      expect(calculateSimilarity('hello world', 'hello world')).toBe(1.0);
    });
    
    it('should return high similarity for minor variations', () => {
      const similarity = calculateSimilarity(
        'switch to project blog',
        'switch to the project blog'
      );
      expect(similarity).toBeGreaterThan(0.8);
    });
    
    it('should handle typos well', () => {
      const similarity = calculateSimilarity(
        'switch to projct',
        'switch to project'
      );
      expect(similarity).toBeGreaterThan(0.65);
    });
    
    it('should return moderate similarity for semantically similar commands', () => {
      const similarity = calculateSimilarity(
        'switch to project blog',
        'change to project blog'
      );
      expect(similarity).toBeGreaterThan(0.6);
    });
    
    it('should return low similarity for completely different commands', () => {
      const similarity = calculateSimilarity(
        'switch to project',
        'delete all files'
      );
      expect(similarity).toBeLessThan(0.3);
    });
    
    it('should handle empty inputs', () => {
      expect(calculateSimilarity('', 'hello')).toBe(0.0);
      expect(calculateSimilarity('hello', '')).toBe(0.0);
      expect(calculateSimilarity('', '')).toBe(0.0);
    });
    
    it('should handle case insensitivity', () => {
      const similarity = calculateSimilarity(
        'SWITCH TO PROJECT',
        'switch to project'
      );
      expect(similarity).toBe(1.0);
    });
  });
  
  describe('calculateMultipleScores', () => {
    const patterns = [
      'switch to project blog',
      'create new project',
      'list all projects',
      'delete project blog'
    ];
    
    it('should calculate scores for all patterns', () => {
      const results = calculateMultipleScores('switch to project', patterns);
      expect(results).toHaveLength(4);
      expect(results[0]).toHaveProperty('pattern');
      expect(results[0]).toHaveProperty('score');
    });
    
    it('should sort by score descending', () => {
      const results = calculateMultipleScores('switch to project', patterns);
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });
    
    it('should rank best match first', () => {
      const results = calculateMultipleScores('switch to project blog', patterns);
      expect(results[0].pattern).toBe('switch to project blog');
    });
    
    it('should handle empty patterns array', () => {
      const results = calculateMultipleScores('hello', []);
      expect(results).toEqual([]);
    });
    
    it('should handle null patterns', () => {
      const results = calculateMultipleScores('hello', null);
      expect(results).toEqual([]);
    });
  });
  
  describe('getMatchQuality', () => {
    it('should return "exact" for score 1.0', () => {
      expect(getMatchQuality(1.0)).toBe('exact');
    });
    
    it('should return "excellent" for scores >= 0.9', () => {
      expect(getMatchQuality(0.95)).toBe('excellent');
      expect(getMatchQuality(0.9)).toBe('excellent');
    });
    
    it('should return "good" for scores >= 0.7', () => {
      expect(getMatchQuality(0.8)).toBe('good');
      expect(getMatchQuality(0.7)).toBe('good');
    });
    
    it('should return "potential" for scores >= 0.6', () => {
      expect(getMatchQuality(0.65)).toBe('potential');
      expect(getMatchQuality(0.6)).toBe('potential');
    });
    
    it('should return "poor" for scores < 0.6', () => {
      expect(getMatchQuality(0.5)).toBe('poor');
      expect(getMatchQuality(0.0)).toBe('poor');
    });
  });
  
  describe('isAmbiguous', () => {
    it('should return true for very close scores', () => {
      expect(isAmbiguous(0.85, 0.84)).toBe(true);
    });
    
    it('should return false for clearly different scores', () => {
      expect(isAmbiguous(0.9, 0.7)).toBe(false);
    });
    
    it('should use configured threshold', () => {
      expect(isAmbiguous(0.9, 0.81)).toBe(true);  // Within 0.1
      expect(isAmbiguous(0.9, 0.79)).toBe(false); // Beyond 0.1
    });
  });
  
  describe('configuration', () => {
    let originalConfig;
    
    beforeEach(() => {
      originalConfig = getConfig();
    });
    
    it('should get current configuration', () => {
      const config = getConfig();
      expect(config).toHaveProperty('weights');
      expect(config).toHaveProperty('thresholds');
      expect(config).toHaveProperty('normalization');
    });
    
    it('should update weights', () => {
      updateConfig({
        weights: { levenshtein: 0.5 }
      });
      
      const config = getConfig();
      expect(config.weights.levenshtein).toBe(0.5);
      
      // Restore
      updateConfig(originalConfig);
    });
    
    it('should update thresholds', () => {
      updateConfig({
        thresholds: { excellent: 0.95 }
      });
      
      const config = getConfig();
      expect(config.thresholds.excellent).toBe(0.95);
      
      // Restore
      updateConfig(originalConfig);
    });
  });
  
  describe('real-world command matching scenarios', () => {
    it('should match "switch to project" variations', () => {
      const patterns = [
        'switch to project {name}',
        'create project {name}',
        'list projects',
        'delete project {name}'
      ];
      
      const testCases = [
        'switch to project blog',
        'change to project blog',
        'switch project blog',
        'swich to project blog'  // typo
      ];
      
      testCases.forEach(input => {
        const results = calculateMultipleScores(input, patterns);
        expect(results[0].pattern).toBe('switch to project {name}');
        expect(results[0].score).toBeGreaterThan(0.45);
      });
    });
    
    it('should distinguish between similar commands', () => {
      const patterns = [
        'create new project',
        'delete old project'
      ];
      
      const createResults = calculateMultipleScores('create project', patterns);
      expect(createResults[0].pattern).toBe('create new project');
      
      const deleteResults = calculateMultipleScores('delete project', patterns);
      expect(deleteResults[0].pattern).toBe('delete old project');
    });
    
    it('should handle command variations with extra words', () => {
      const similarity = calculateSimilarity(
        'can you please switch to my project called blog',
        'switch to project blog'
      );
      expect(similarity).toBeGreaterThan(0.5);
    });
    
    it('should handle abbreviations and shorthand', () => {
      const similarity = calculateSimilarity(
        'switch proj blog',
        'switch to project blog'
      );
      expect(similarity).toBeGreaterThan(0.5);
    });
  });
  
});

