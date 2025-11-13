/**
 * Lateral Thinking Session Integration Tests
 * 
 * Tests the complete workflow from session creation through
 * divergence, convergence, and output formatting.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingSession } from '../index.js';
import { LLMClient } from '../llm/client.js';

describe('LateralThinkingSession Integration', () => {
  let session;
  let mockClient;
  let testContext;

  beforeEach(() => {
    // Use mock LLM for fast, deterministic tests
    mockClient = new LLMClient({ provider: 'mock' });
    
    session = new LateralThinkingSession({
      llmClient: mockClient,
      tokenBudget: 5000,
      techniques: ['scamper', 'provocations'],
      ideasPerTechnique: 3,
      presentTopN: 3
    });

    testContext = {
      problem: 'Implement user authentication for mobile app',
      baseline: 'JWT tokens with username/password login',
      constraints: [
        'Must work offline',
        'Native iOS and Android',
        'GDPR compliant'
      ],
      goals: [
        'Minimize user friction',
        'Strong security',
        'Fast login (<1 second)'
      ],
      team: {
        capabilities: ['React Native', 'Node.js', 'PostgreSQL']
      },
      timeline: 'Quick - 2 weeks',
      riskTolerance: 'medium'
    };
  });

  describe('Complete Workflow', () => {
    it('should run complete session successfully', async () => {
      const results = await session.run(testContext);
      
      // Verify result structure
      expect(results).toHaveProperty('topOptions');
      expect(results).toHaveProperty('baseline');
      expect(results).toHaveProperty('actions');
      expect(results).toHaveProperty('metrics');
      
      // Verify top options
      expect(results.topOptions).toBeInstanceOf(Array);
      expect(results.topOptions.length).toBeLessThanOrEqual(3);
      
      if (results.topOptions.length > 0) {
        const option = results.topOptions[0];
        expect(option).toHaveProperty('title');
        expect(option).toHaveProperty('description');
        expect(option).toHaveProperty('scores');
        expect(option.scores).toHaveProperty('total');
        expect(option.scores).toHaveProperty('feasibility');
        expect(option.scores).toHaveProperty('impact');
        expect(option.scores).toHaveProperty('novelty');
        expect(option.scores).toHaveProperty('contextFit');
      }
      
      // Verify baseline is preserved
      expect(results.baseline).toBe(testContext.baseline);
      
      // Verify metrics
      expect(results.metrics).toHaveProperty('ideasGenerated');
      expect(results.metrics).toHaveProperty('totalTime');
      expect(results.metrics.ideasGenerated).toBeGreaterThan(0);
    }, 60000); // 60 second timeout for complete workflow

    it('should handle minimal context', async () => {
      const minimalContext = {
        problem: 'Simple problem to solve'
      };

      const results = await session.run(minimalContext);
      
      expect(results).toHaveProperty('topOptions');
      expect(results).toHaveProperty('metrics');
    });

    it('should respect idea count limits', async () => {
      const limitedSession = new LateralThinkingSession({
        llmClient: mockClient,
        techniques: ['scamper'],
        ideasPerTechnique: 2,
        presentTopN: 2
      });

      const results = await limitedSession.run(testContext);
      
      expect(results.topOptions.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Divergence Phase', () => {
    it('should generate ideas from multiple techniques', async () => {
      const session = new LateralThinkingSession({
        llmClient: mockClient,
        techniques: ['scamper', 'provocations', 'six-hats'],
        ideasPerTechnique: 2
      });

      const ideas = await session._diverge(testContext);
      
      expect(ideas).toBeInstanceOf(Array);
      expect(ideas.length).toBeGreaterThan(0);
      
      // Should have ideas from multiple techniques
      const techniques = new Set(ideas.map(i => i.technique));
      expect(techniques.size).toBeGreaterThan(1);
    });

    it('should handle technique failures gracefully', async () => {
      // Even if some techniques fail, should return available ideas
      const ideas = await session._diverge(testContext);
      
      expect(ideas).toBeInstanceOf(Array);
      // Should have at least some ideas even if not all techniques succeeded
    });
  });

  describe('Convergence Phase', () => {
    let rawIdeas;

    beforeEach(async () => {
      rawIdeas = await session._diverge(testContext);
    });

    it('should score all ideas', async () => {
      const result = await session._converge(rawIdeas, testContext);
      
      expect(result).toHaveProperty('scoredIdeas');
      expect(result.scoredIdeas).toBeInstanceOf(Array);
      
      result.scoredIdeas.forEach(idea => {
        expect(idea).toHaveProperty('score');
        expect(idea.score).toHaveProperty('total');
        expect(idea.score.total).toBeGreaterThanOrEqual(0);
        expect(idea.score.total).toBeLessThanOrEqual(1);
      });
    });

    it('should cluster similar ideas', async () => {
      const result = await session._converge(rawIdeas, testContext);
      
      expect(result).toHaveProperty('clusteredIdeas');
      expect(result.clusteredIdeas).toBeInstanceOf(Array);
      
      // Clustering should reduce count or keep same
      expect(result.clusteredIdeas.length).toBeLessThanOrEqual(rawIdeas.length);
    });

    it('should select top N options', async () => {
      const result = await session._converge(rawIdeas, testContext);
      
      expect(result).toHaveProperty('topOptions');
      expect(result.topOptions.length).toBeLessThanOrEqual(session.config.presentTopN);
      
      // Top options should be sorted by score (highest first)
      if (result.topOptions.length > 1) {
        for (let i = 1; i < result.topOptions.length; i++) {
          expect(result.topOptions[i - 1].score.total)
            .toBeGreaterThanOrEqual(result.topOptions[i].score.total);
        }
      }
    });
  });

  describe('Output Formatting', () => {
    it('should format results for presentation', async () => {
      const rawIdeas = await session._diverge(testContext);
      const convergence = await session._converge(rawIdeas, testContext);
      const formatted = await session._deliver(convergence, testContext, {});
      
      expect(formatted).toHaveProperty('summary');
      expect(formatted.summary).toHaveProperty('context');
      expect(formatted.summary).toHaveProperty('baseline');
      expect(formatted.summary).toHaveProperty('ideasGenerated');
      
      expect(formatted).toHaveProperty('topOptions');
      formatted.topOptions.forEach(option => {
        expect(option).toHaveProperty('rank');
        expect(option).toHaveProperty('title');
        expect(option).toHaveProperty('description');
        expect(option).toHaveProperty('why');
        expect(option).toHaveProperty('caution');
        expect(option).toHaveProperty('nextSteps');
      });
      
      expect(formatted).toHaveProperty('actions');
      expect(formatted.actions).toBeInstanceOf(Array);
    });

    it('should generate markdown output', async () => {
      const results = await session.run(testContext);
      const markdown = session.formatter.toMarkdown(results);
      
      expect(markdown).toContain('# 🎨 Lateral Thinking Results');
      expect(markdown).toContain('## 💡 Top Alternative Approaches');
      expect(markdown).toContain('## ⚡ Next Steps');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty context gracefully', async () => {
      await expect(session.run({})).rejects.toThrow();
    });

    it('should handle missing problem field', async () => {
      await expect(session.run({ baseline: 'test' })).rejects.toThrow();
    });

    it('should handle invalid technique names', () => {
      expect(() => {
        new LateralThinkingSession({
          techniques: ['invalid-technique']
        });
      }).toThrow();
    });

    it('should handle zero ideas requested', async () => {
      const emptySession = new LateralThinkingSession({
        llmClient: mockClient,
        ideasPerTechnique: 0
      });

      const results = await emptySession.run(testContext);
      expect(results.topOptions.length).toBe(0);
    });
  });

  describe('Metrics and Tracking', () => {
    it('should track generation metrics', async () => {
      const results = await session.run(testContext);
      
      expect(results.metrics).toHaveProperty('ideasGenerated');
      expect(results.metrics).toHaveProperty('ideasAfterClustering');
      expect(results.metrics).toHaveProperty('topOptionsPresented');
      expect(results.metrics).toHaveProperty('totalTime');
      expect(results.metrics).toHaveProperty('techniqueSuccess');
      
      expect(typeof results.metrics.totalTime).toBe('number');
      expect(results.metrics.totalTime).toBeGreaterThan(0);
    });

    it('should track technique success rates', async () => {
      const results = await session.run(testContext);
      
      expect(results.metrics.techniqueSuccess).toBeDefined();
      Object.values(results.metrics.techniqueSuccess).forEach(success => {
        expect(typeof success).toBe('boolean');
      });
    });
  });

  describe('Configuration Options', () => {
    it('should respect custom scoring weights', async () => {
      const customSession = new LateralThinkingSession({
        llmClient: mockClient,
        scoringWeights: {
          feasibility: 0.5,
          impact: 0.3,
          novelty: 0.1,
          contextFit: 0.1
        }
      });

      const results = await customSession.run(testContext);
      expect(results.topOptions).toBeDefined();
      // Scores should reflect custom weights
    });

    it('should respect custom clustering threshold', async () => {
      const customSession = new LateralThinkingSession({
        llmClient: mockClient,
        clusteringThreshold: 0.9 // Very high = less clustering
      });

      const results = await customSession.run(testContext);
      expect(results.metrics.ideasAfterClustering).toBeDefined();
    });
  });
});

describe('Real-World Scenarios', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = new LLMClient({ provider: 'mock' });
  });

  it('should handle e-commerce checkout problem', async () => {
    const session = new LateralThinkingSession({ llmClient: mockClient });
    
    const context = {
      problem: 'Reduce shopping cart abandonment rate',
      baseline: 'Multi-step checkout with address, payment, and review',
      constraints: ['PCI compliance required', 'International shipping'],
      goals: ['Increase conversion by 20%', 'Maintain security']
    };

    const results = await session.run(context);
    
    expect(results.topOptions.length).toBeGreaterThan(0);
    expect(results.topOptions[0].scores.contextFit).toBeGreaterThan(0);
  });

  it('should handle technical infrastructure problem', async () => {
    const session = new LateralThinkingSession({ llmClient: mockClient });
    
    const context = {
      problem: 'Scale API to handle 10x traffic',
      baseline: 'Single server with PostgreSQL database',
      constraints: ['Budget: $5000/month', 'Zero downtime migration'],
      goals: ['Handle 100k requests/second', 'Maintain <200ms latency']
    };

    const results = await session.run(context);
    
    expect(results.topOptions.length).toBeGreaterThan(0);
    expect(results.metrics.ideasGenerated).toBeGreaterThan(0);
  });

  it('should handle UX improvement problem', async () => {
    const session = new LateralThinkingSession({ llmClient: mockClient });
    
    const context = {
      problem: 'Improve mobile app onboarding',
      baseline: 'Tutorial slides + signup form',
      constraints: ['< 2 minutes to first value', 'Mobile-first'],
      goals: ['80% completion rate', 'Engaging experience']
    };

    const results = await session.run(context);
    
    expect(results.topOptions.length).toBeGreaterThan(0);
    results.topOptions.forEach(option => {
      expect(option.nextSteps).toBeInstanceOf(Array);
      expect(option.nextSteps.length).toBeGreaterThan(0);
    });
  });
});

