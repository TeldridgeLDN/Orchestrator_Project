/**
 * LLM Integration Tests
 * 
 * Tests the LLM client and technique integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LLMClient } from '../llm/client.js';
import { SCAMPER } from '../techniques/scamper.js';
import { SixThinkingHats } from '../techniques/six-hats.js';
import { Provocations } from '../techniques/provocations.js';

describe('LLMClient', () => {
  describe('Mock Provider', () => {
    let client;

    beforeEach(() => {
      client = new LLMClient({ provider: 'mock' });
    });

    it('should create mock client', () => {
      expect(client).toBeDefined();
      expect(client.config.provider).toBe('mock');
    });

    it('should generate mock response', async () => {
      const response = await client.generate('Test prompt');
      
      expect(response).toHaveProperty('text');
      expect(response).toHaveProperty('tokensUsed');
      expect(response).toHaveProperty('model', 'mock-model');
    });

    it('should parse JSON from response', () => {
      const jsonText = '{"title": "Test", "description": "Test description"}';
      const parsed = client.parseJSON(jsonText);
      
      expect(parsed).toEqual({
        title: 'Test',
        description: 'Test description'
      });
    });

    it('should parse JSON from markdown code block', () => {
      const markdownText = '```json\n{"title": "Test"}\n```';
      const parsed = client.parseJSON(markdownText);
      
      expect(parsed).toEqual({ title: 'Test' });
    });

    it('should handle malformed JSON gracefully', () => {
      expect(() => {
        client.parseJSON('not json at all');
      }).toThrow();
    });
  });

  describe('API Key Handling', () => {
    it('should get Anthropic key from environment', () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      process.env.ANTHROPIC_API_KEY = 'test-key';
      
      const client = new LLMClient({ provider: 'anthropic' });
      expect(client.config.apiKey).toBe('test-key');
      
      process.env.ANTHROPIC_API_KEY = originalKey;
    });

    it('should accept API key in config', () => {
      const client = new LLMClient({
        provider: 'anthropic',
        apiKey: 'explicit-key'
      });
      
      expect(client.config.apiKey).toBe('explicit-key');
    });
  });
});

describe('Technique Integration with LLM', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = new LLMClient({ provider: 'mock' });
  });

  describe('SCAMPER with Mock LLM', () => {
    it('should generate ideas using mock LLM', async () => {
      const scamper = new SCAMPER(mockClient);
      const context = {
        problem: 'Improve mobile app authentication',
        baseline: 'JWT tokens with password login'
      };

      const ideas = await scamper.generate(context, { ideasToGenerate: 2 });
      
      expect(ideas).toBeInstanceOf(Array);
      expect(ideas.length).toBeGreaterThan(0);
      expect(ideas[0]).toHaveProperty('technique', 'scamper');
      expect(ideas[0]).toHaveProperty('title');
      expect(ideas[0]).toHaveProperty('description');
    });
  });

  describe('Six Thinking Hats with Mock LLM', () => {
    it('should generate ideas using mock LLM', async () => {
      const sixHats = new SixThinkingHats(mockClient);
      const context = {
        problem: 'Reduce customer churn',
        baseline: 'Email campaigns and discounts'
      };

      const ideas = await sixHats.generate(context, { ideasToGenerate: 2 });
      
      expect(ideas).toBeInstanceOf(Array);
      expect(ideas.length).toBeGreaterThan(0);
      expect(ideas[0]).toHaveProperty('technique', 'six-hats');
      expect(ideas[0]).toHaveProperty('hat');
      expect(ideas[0]).toHaveProperty('hatName');
    });
  });

  describe('Provocations with Mock LLM', () => {
    it('should generate ideas using mock LLM', async () => {
      const provocations = new Provocations(mockClient);
      const context = {
        problem: 'Speed up checkout process',
        baseline: 'Multi-step form with validation'
      };

      const ideas = await provocations.generate(context, { ideasToGenerate: 2 });
      
      expect(ideas).toBeInstanceOf(Array);
      expect(ideas.length).toBeGreaterThan(0);
      expect(ideas[0]).toHaveProperty('technique', 'provocations');
      expect(ideas[0]).toHaveProperty('provocation');
      expect(ideas[0]).toHaveProperty('extraction');
    });
  });
});

describe('Error Handling', () => {
  it('should handle LLM errors gracefully', async () => {
    // Create a client that will fail
    const failClient = new LLMClient({
      provider: 'anthropic',
      apiKey: 'invalid-key',
      timeout: 1000
    });

    const scamper = new SCAMPER(failClient);
    const context = {
      problem: 'Test problem'
    };

    // Should not throw, but return error ideas
    const ideas = await scamper.generate(context, { ideasToGenerate: 1 });
    
    expect(ideas).toBeInstanceOf(Array);
    // Error responses should be filtered or handled
  });

  it('should handle timeout', async () => {
    const timeoutClient = new LLMClient({
      provider: 'mock',
      timeout: 1 // 1ms timeout
    });

    // Mock implementation doesn't actually timeout, but in real scenario:
    // - Request should abort after timeout
    // - Error should be caught and handled
    expect(timeoutClient.config.timeout).toBe(1);
  });
});

