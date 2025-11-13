/**
 * Tests for action-generator.js
 */

import { describe, it, expect } from 'vitest';
import {
  validateActions,
  getActionStats
} from '../action-generator.js';

describe('Action Generator', () => {
  describe('validateActions', () => {
    it('should validate complete action structure', () => {
      const actions = [
        {
          name: 'Personal Practice',
          actions: [
            {
              title: 'Test Action',
              description: 'This is a test action with sufficient length',
              effort: 'low',
              impact: 'high',
              timeframe: 'immediate'
            }
          ]
        }
      ];

      const contexts = [
        { name: 'Personal Practice', description: 'Test context' }
      ];

      const result = validateActions(actions, contexts);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing context coverage', () => {
      const actions = [
        {
          name: 'Personal Practice',
          actions: [{ title: 'Test', description: 'Test action' }]
        }
      ];

      const contexts = [
        { name: 'Personal Practice', description: 'Test' },
        { name: 'Regular Work', description: 'Test' }
      ];

      const result = validateActions(actions, contexts);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing actions for context: regular work');
    });

    it('should detect contexts with no actions', () => {
      const actions = [
        {
          name: 'Personal Practice',
          actions: []
        }
      ];

      const contexts = [
        { name: 'Personal Practice', description: 'Test' }
      ];

      const result = validateActions(actions, contexts);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Context "Personal Practice" has no actions');
    });

    it('should warn about short descriptions', () => {
      const actions = [
        {
          name: 'Personal Practice',
          actions: [
            {
              title: 'Test',
              description: 'Too short',
              effort: 'low',
              impact: 'high',
              timeframe: 'immediate'
            }
          ]
        }
      ];

      const contexts = [
        { name: 'Personal Practice', description: 'Test' }
      ];

      const result = validateActions(actions, contexts);
      
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('very short description');
    });

    it('should warn about missing metadata', () => {
      const actions = [
        {
          name: 'Personal Practice',
          actions: [
            {
              title: 'Test Action',
              description: 'This is a test action with sufficient length'
              // Missing effort, impact, timeframe
            }
          ]
        }
      ];

      const contexts = [
        { name: 'Personal Practice', description: 'Test' }
      ];

      const result = validateActions(actions, contexts);
      
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('missing metadata');
    });

    it('should be case-insensitive for context matching', () => {
      const actions = [
        {
          name: 'personal practice',
          actions: [{ title: 'Test', description: 'Test action description here' }]
        }
      ];

      const contexts = [
        { name: 'Personal Practice', description: 'Test' }
      ];

      const result = validateActions(actions, contexts);
      
      expect(result.valid).toBe(true);
    });
  });

  describe('getActionStats', () => {
    it('should calculate action statistics', () => {
      const actions = [
        {
          name: 'Context 1',
          actions: [
            {
              title: 'Action 1',
              description: 'Test',
              effort: 'low',
              impact: 'high',
              timeframe: 'immediate'
            },
            {
              title: 'Action 2',
              description: 'Test',
              effort: 'medium',
              impact: 'medium',
              timeframe: 'short-term'
            }
          ]
        },
        {
          name: 'Context 2',
          actions: [
            {
              title: 'Action 3',
              description: 'Test',
              effort: 'high',
              impact: 'low',
              timeframe: 'long-term'
            }
          ]
        }
      ];

      const stats = getActionStats(actions);

      expect(stats.totalContexts).toBe(2);
      expect(stats.totalActions).toBe(3);
      expect(stats.byEffort.low).toBe(1);
      expect(stats.byEffort.medium).toBe(1);
      expect(stats.byEffort.high).toBe(1);
      expect(stats.byImpact.high).toBe(1);
      expect(stats.byImpact.medium).toBe(1);
      expect(stats.byImpact.low).toBe(1);
      expect(stats.byTimeframe.immediate).toBe(1);
      expect(stats.byTimeframe['short-term']).toBe(1);
      expect(stats.byTimeframe['long-term']).toBe(1);
    });

    it('should handle empty actions', () => {
      const stats = getActionStats([]);

      expect(stats.totalContexts).toBe(0);
      expect(stats.totalActions).toBe(0);
      expect(stats.byEffort.low).toBe(0);
      expect(stats.byImpact.low).toBe(0);
      expect(stats.byTimeframe.immediate).toBe(0);
    });

    it('should handle contexts with multiple actions', () => {
      const actions = [
        {
          name: 'Context 1',
          actions: [
            { title: 'A1', description: 'Test', effort: 'low', impact: 'high', timeframe: 'immediate' },
            { title: 'A2', description: 'Test', effort: 'low', impact: 'high', timeframe: 'immediate' },
            { title: 'A3', description: 'Test', effort: 'low', impact: 'high', timeframe: 'immediate' }
          ]
        }
      ];

      const stats = getActionStats(actions);

      expect(stats.totalActions).toBe(3);
      expect(stats.byEffort.low).toBe(3);
    });
  });

  describe('Action structure validation', () => {
    it('should validate required action fields', () => {
      const validAction = {
        title: 'Test Action',
        description: 'A detailed description of the action to take',
        relatedInsights: [0, 1],
        effort: 'low',
        impact: 'high',
        timeframe: 'immediate'
      };

      expect(validAction.title).toBeDefined();
      expect(validAction.description).toBeDefined();
      expect(validAction.effort).toMatch(/^(low|medium|high)$/);
      expect(validAction.impact).toMatch(/^(low|medium|high)$/);
      expect(validAction.timeframe).toMatch(/^(immediate|short-term|long-term)$/);
    });

    it('should validate related insights are array of numbers', () => {
      const action = {
        relatedInsights: [0, 1, 2]
      };

      expect(Array.isArray(action.relatedInsights)).toBe(true);
      action.relatedInsights.forEach(insight => {
        expect(typeof insight).toBe('number');
      });
    });
  });
});

