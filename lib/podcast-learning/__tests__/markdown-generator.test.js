/**
 * Tests for markdown-generator.js
 */

import { describe, it, expect } from 'vitest';
import {
  generateMarkdown,
  validateMarkdown
} from '../markdown-generator.js';

describe('Markdown Generator', () => {
  const sampleData = {
    episode: {
      title: 'Test Episode',
      guest: 'John Doe',
      episodeNumber: 1,
      date: '2025-01-01',
      duration: '45:30'
    },
    insights: [
      'First insight about design systems',
      'Second insight about burnout prevention'
    ],
    references: [
      {
        url: 'https://example.com/book',
        category: 'book',
        title: 'Test Book',
        reachable: true
      },
      {
        url: 'https://example.com/blog',
        category: 'blog',
        title: 'Test Blog Post',
        reachable: false
      }
    ],
    actions: [
      {
        name: 'Personal Practice',
        description: 'Personal development context',
        actions: [
          {
            title: 'Test Action',
            description: 'Do something useful',
            effort: 'low',
            impact: 'high',
            timeframe: 'immediate',
            relatedInsights: [0]
          }
        ]
      }
    ],
    metadata: {
      processedAt: '2025-01-01T12:00:00Z',
      model: 'claude-3-5-sonnet',
      duration: 1500,
      usage: {
        input_tokens: 100,
        output_tokens: 50
      }
    }
  };

  describe('generateMarkdown', () => {
    it('should generate valid markdown with all sections', () => {
      const markdown = generateMarkdown(sampleData);

      expect(markdown).toContain('# Episode 1: Test Episode with John Doe');
      expect(markdown).toContain('## Key Insights');
      expect(markdown).toContain('## Referenced Resources');
      expect(markdown).toContain('## Action Items by Context');
      expect(markdown).toContain('## Processing Metadata');
    });

    it('should include episode metadata in header', () => {
      const markdown = generateMarkdown(sampleData);

      expect(markdown).toContain('**Date:** 2025-01-01');
      expect(markdown).toContain('**Duration:** 45:30');
    });

    it('should format insights as numbered list', () => {
      const markdown = generateMarkdown(sampleData);

      expect(markdown).toContain('1. First insight about design systems');
      expect(markdown).toContain('2. Second insight about burnout prevention');
    });

    it('should group references by category', () => {
      const markdown = generateMarkdown(sampleData);

      expect(markdown).toContain('### 📚 Books');
      expect(markdown).toContain('### 📝 Blogs/Articles');
    });

    it('should show reference reachability status', () => {
      const markdown = generateMarkdown(sampleData);

      expect(markdown).toContain('✅'); // Reachable
      expect(markdown).toContain('⚠️'); // Unreachable
    });

    it('should format actions as checkboxes with metadata', () => {
      const markdown = generateMarkdown(sampleData);

      expect(markdown).toContain('- [ ] **Test Action**');
      expect(markdown).toContain('effort: low');
      expect(markdown).toContain('impact: high');
      expect(markdown).toContain('immediate');
    });

    it('should include related insights for actions', () => {
      const markdown = generateMarkdown(sampleData);

      expect(markdown).toContain('*Related insights: #1*');
    });

    it('should include section dividers', () => {
      const markdown = generateMarkdown(sampleData);

      const dividers = markdown.match(/^---$/gm);
      expect(dividers).toBeTruthy();
      expect(dividers.length).toBeGreaterThan(0);
    });

    it('should include processing metadata', () => {
      const markdown = generateMarkdown(sampleData);

      expect(markdown).toContain('**Model:** claude-3-5-sonnet');
      expect(markdown).toContain('**Processing Time:** 1500ms');
      expect(markdown).toContain('**Tokens Used:** 150');
    });
  });

  describe('validateMarkdown', () => {
    it('should validate complete markdown structure', () => {
      const markdown = generateMarkdown(sampleData);
      const result = validateMarkdown(markdown);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing header', () => {
      const markdown = '## Key Insights\n\nSome text';
      const result = validateMarkdown(markdown);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required section: # Episode');
    });

    it('should detect missing insights section', () => {
      const markdown = '# Episode 1: Test\n\n## Referenced Resources';
      const result = validateMarkdown(markdown);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required section: ## Key Insights');
    });

    it('should detect missing references section', () => {
      const markdown = '# Episode 1: Test\n\n## Key Insights\n\n## Action Items by Context';
      const result = validateMarkdown(markdown);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required section: ## Referenced Resources');
    });

    it('should detect missing actions section', () => {
      const markdown = '# Episode 1: Test\n\n## Key Insights\n\n## Referenced Resources';
      const result = validateMarkdown(markdown);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required section: ## Action Items by Context');
    });

    it('should warn about empty insights section', () => {
      const markdown = '# Episode 1: Test\n\n## Key Insights\n\n---\n\n## Referenced Resources\n\n## Action Items by Context';
      const result = validateMarkdown(markdown);

      expect(result.warnings).toContain('Key Insights section is empty');
    });

    it('should warn about empty references section', () => {
      const markdown = '# Episode 1: Test\n\n## Key Insights\n\n1. Test\n\n## Referenced Resources\n\n---\n\n## Action Items by Context';
      const result = validateMarkdown(markdown);

      expect(result.warnings).toContain('Referenced Resources section is empty');
    });
  });

  describe('Edge cases', () => {
    it('should handle episode without guest', () => {
      const data = {
        ...sampleData,
        episode: {
          ...sampleData.episode,
          guest: null
        }
      };

      const markdown = generateMarkdown(data);
      expect(markdown).toContain('# Episode 1: Test Episode\n');
      expect(markdown).not.toContain('with');
    });

    it('should handle empty insights array', () => {
      const data = {
        ...sampleData,
        insights: []
      };

      const markdown = generateMarkdown(data);
      expect(markdown).not.toContain('## Key Insights');
    });

    it('should handle empty references array', () => {
      const data = {
        ...sampleData,
        references: []
      };

      const markdown = generateMarkdown(data);
      expect(markdown).not.toContain('### 📚 Books');
    });

    it('should handle actions without related insights', () => {
      const data = {
        ...sampleData,
        actions: [{
          name: 'Test Context',
          actions: [{
            title: 'Test',
            description: 'Test action',
            effort: 'low',
            impact: 'high',
            timeframe: 'immediate'
            // No relatedInsights
          }]
        }]
      };

      const markdown = generateMarkdown(data);
      expect(markdown).toContain('- [ ] **Test**');
      expect(markdown).not.toContain('*Related insights:');
    });
  });
});

