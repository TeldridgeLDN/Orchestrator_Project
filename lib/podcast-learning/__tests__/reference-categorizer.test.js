/**
 * Tests for reference-categorizer.js
 */

import { describe, it, expect } from 'vitest';
import {
  CATEGORIES,
  categorizeByRules,
  groupByCategory,
  getCategoryStats
} from '../reference-categorizer.js';

describe('Reference Categorizer', () => {
  describe('categorizeByRules', () => {
    it('should categorize book URLs correctly', () => {
      const bookUrls = [
        { url: 'https://amazon.com/dp/123456789' },
        { url: 'https://bookshop.org/books/test-book' },
        { url: 'https://abookapart.com/products/design-systems' },
        { url: 'https://rosenfeldmedia.com/books/content-strategy' }
      ];

      bookUrls.forEach(ref => {
        expect(categorizeByRules(ref)).toBe(CATEGORIES.BOOK);
      });
    });

    it('should categorize course URLs correctly', () => {
      const courseUrls = [
        { url: 'https://udemy.com/course/design-systems' },
        { url: 'https://coursera.org/learn/web-design' },
        { url: 'https://frontendmasters.com/courses/css-grid' }
      ];

      courseUrls.forEach(ref => {
        expect(categorizeByRules(ref)).toBe(CATEGORIES.COURSE);
      });
    });

    it('should categorize video URLs correctly', () => {
      const videoUrls = [
        { url: 'https://youtube.com/watch?v=abc123' },
        { url: 'https://youtu.be/xyz789' },
        { url: 'https://vimeo.com/123456789' }
      ];

      videoUrls.forEach(ref => {
        expect(categorizeByRules(ref)).toBe(CATEGORIES.VIDEO);
      });
    });

    it('should categorize podcast URLs correctly', () => {
      const podcastUrls = [
        { url: 'https://podcasts.apple.com/us/podcast/id123' },
        { url: 'https://spotify.com/episode/abc123' },
        { url: 'https://overcast.fm/+xyz' }
      ];

      podcastUrls.forEach(ref => {
        expect(categorizeByRules(ref)).toBe(CATEGORIES.PODCAST);
      });
    });

    it('should categorize social URLs correctly', () => {
      const socialUrls = [
        { url: 'https://linkedin.com/in/johndoe' },
        { url: 'https://twitter.com/johndoe' },
        { url: 'https://x.com/johndoe' },
        { url: 'https://github.com/johndoe' }
      ];

      socialUrls.forEach(ref => {
        expect(categorizeByRules(ref)).toBe(CATEGORIES.SOCIAL);
      });
    });

    it('should categorize blog platform URLs correctly', () => {
      const blogUrls = [
        { url: 'https://medium.com/@johndoe/article' },
        { url: 'https://dev.to/johndoe/post' },
        { url: 'https://johndoe.substack.com/p/article' }
      ];

      blogUrls.forEach(ref => {
        expect(categorizeByRules(ref)).toBe(CATEGORIES.BLOG);
      });
    });

    it('should categorize tool URLs by domain', () => {
      const toolUrls = [
        { url: 'https://figma.com/file/abc123' },
        { url: 'https://notion.so/workspace/page' },
        { url: 'https://github.com/org/repo' }
      ];

      toolUrls.forEach(ref => {
        expect(categorizeByRules(ref)).toBe(CATEGORIES.TOOL);
      });
    });

    it('should use title keywords for categorization', () => {
      const refWithTitle = {
        url: 'https://example.com/resource',
        title: 'Learn Design Systems - Complete Course'
      };

      expect(categorizeByRules(refWithTitle)).toBe(CATEGORIES.COURSE);
    });

    it('should return unknown for uncategorizable URLs', () => {
      const unknownRef = {
        url: 'https://random-site.com/page'
      };

      expect(categorizeByRules(unknownRef)).toBe(CATEGORIES.UNKNOWN);
    });
  });

  describe('groupByCategory', () => {
    it('should group references by category', () => {
      const references = [
        { url: 'book1', category: CATEGORIES.BOOK },
        { url: 'book2', category: CATEGORIES.BOOK },
        { url: 'video1', category: CATEGORIES.VIDEO },
        { url: 'unknown1', category: CATEGORIES.UNKNOWN }
      ];

      const grouped = groupByCategory(references);

      expect(grouped[CATEGORIES.BOOK]).toHaveLength(2);
      expect(grouped[CATEGORIES.VIDEO]).toHaveLength(1);
      expect(grouped[CATEGORIES.UNKNOWN]).toHaveLength(1);
    });

    it('should handle empty input', () => {
      const grouped = groupByCategory([]);
      expect(Object.keys(grouped)).toHaveLength(0);
    });
  });

  describe('getCategoryStats', () => {
    it('should calculate category statistics', () => {
      const references = [
        { url: 'book1', category: CATEGORIES.BOOK, reachable: true },
        { url: 'book2', category: CATEGORIES.BOOK, reachable: false },
        { url: 'video1', category: CATEGORIES.VIDEO, reachable: true },
        { url: 'unknown1', category: CATEGORIES.UNKNOWN, reachable: true }
      ];

      const stats = getCategoryStats(references);

      expect(stats.total).toBe(4);
      expect(stats.byCategory[CATEGORIES.BOOK]).toBe(2);
      expect(stats.byCategory[CATEGORIES.VIDEO]).toBe(1);
      expect(stats.byCategory[CATEGORIES.UNKNOWN]).toBe(1);
      expect(stats.unknownCount).toBe(1);
      expect(stats.reachableByCategory[CATEGORIES.BOOK]).toBe(1);
      expect(stats.reachableByCategory[CATEGORIES.VIDEO]).toBe(1);
    });

    it('should handle empty input', () => {
      const stats = getCategoryStats([]);
      expect(stats.total).toBe(0);
      expect(stats.unknownCount).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle invalid URLs gracefully', () => {
      const ref = { url: 'not-a-valid-url' };
      expect(categorizeByRules(ref)).toBe(CATEGORIES.UNKNOWN);
    });

    it('should handle missing metadata', () => {
      const ref = { url: 'https://example.com' };
      expect(categorizeByRules(ref)).toBe(CATEGORIES.UNKNOWN);
    });

    it('should be case-insensitive for patterns', () => {
      const ref = {
        url: 'https://BOOKSHOP.ORG/books/test',
        title: 'TEST BOOK'
      };
      expect(categorizeByRules(ref)).toBe(CATEGORIES.BOOK);
    });
  });
});

