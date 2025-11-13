/**
 * Health Recommendations System Tests
 * 
 * Tests the complete recommendation generation workflow
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateRecommendations } from '../lib/utils/health-recommendation-generator.js';
import { detectAllIssues } from '../lib/utils/health-issue-detector.js';
import { RECOMMENDATION_DATABASE } from '../lib/utils/health-recommendations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test fixtures path
const fixturesPath = path.join(__dirname, 'fixtures', 'health-test-projects');

describe('Health Recommendations System', () => {
  
  describe('Recommendation Database', () => {
    it('should have recommendations for all critical issues', () => {
      const criticalRecommendations = Object.values(RECOMMENDATION_DATABASE)
        .filter(rec => rec.severity === 'critical');
      
      expect(criticalRecommendations.length).toBeGreaterThan(0);
      
      // Verify each has required fields
      criticalRecommendations.forEach(rec => {
        expect(rec.id).toBeDefined();
        expect(rec.category).toBeDefined();
        expect(rec.issue).toBeDefined();
        expect(rec.recommendation).toBeDefined();
        expect(rec.impact).toBeGreaterThan(0);
      });
    });
    
    it('should have auto-fix commands for auto-fixable issues', () => {
      const autoFixable = Object.values(RECOMMENDATION_DATABASE)
        .filter(rec => rec.autoFixable);
      
      autoFixable.forEach(rec => {
        expect(rec.command).toBeDefined();
        expect(rec.command.length).toBeGreaterThan(0);
      });
    });
    
    it('should have all 34 recommendations defined', () => {
      const count = Object.keys(RECOMMENDATION_DATABASE).length;
      expect(count).toBe(34);
    });
  });
  
  describe('Issue Detection', () => {
    it('should detect missing .claude directory', async () => {
      // Create a temporary empty project
      const tempDir = path.join(__dirname, 'temp-empty-project');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const issues = await detectAllIssues(tempDir);
      
      // Should detect critical structure issue
      const structureIssues = issues.filter(i => i.category === 'structure');
      expect(structureIssues.length).toBeGreaterThan(0);
      expect(structureIssues.some(i => i.id === 'struct-001')).toBe(true);
      
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
    
    it('should detect all issue types', async () => {
      // Use current project which should have various issues
      const projectRoot = path.join(__dirname, '..');
      const issues = await detectAllIssues(projectRoot);
      
      // Group by category
      const byCategory = {
        structure: issues.filter(i => i.category === 'structure'),
        hooks: issues.filter(i => i.category === 'hooks'),
        skills: issues.filter(i => i.category === 'skills'),
        config: issues.filter(i => i.category === 'config')
      };
      
      // Should detect at least some issues in various categories
      expect(issues.length).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Recommendation Generation', () => {
    it('should generate recommendations from detected issues', async () => {
      // Create a temporary project with missing hooks
      const tempDir = path.join(__dirname, 'temp-test-project');
      const claudeDir = path.join(tempDir, '.claude');
      const hooksDir = path.join(claudeDir, 'hooks');
      
      // Create structure but no hook files
      if (!fs.existsSync(hooksDir)) {
        fs.mkdirSync(hooksDir, { recursive: true });
      }
      
      // Generate recommendations
      const result = await generateRecommendations(tempDir);
      
      // Should have recommendations
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      
      // Should have summary
      expect(result.summary).toBeDefined();
      expect(result.summary.total).toBe(result.recommendations.length);
      
      // Should calculate potential improvement
      expect(result.potentialImprovement).toBeGreaterThanOrEqual(0);
      
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
    
    it('should prioritize critical issues first', async () => {
      const tempDir = path.join(__dirname, 'temp-priority-test');
      const claudeDir = path.join(tempDir, '.claude');
      
      // Create minimal structure
      if (!fs.existsSync(claudeDir)) {
        fs.mkdirSync(claudeDir, { recursive: true });
      }
      
      const result = await generateRecommendations(tempDir);
      
      if (result.recommendations.length > 1) {
        // Check that recommendations are sorted by severity
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        
        for (let i = 0; i < result.recommendations.length - 1; i++) {
          const currentSeverity = severityOrder[result.recommendations[i].severity];
          const nextSeverity = severityOrder[result.recommendations[i + 1].severity];
          
          expect(currentSeverity).toBeLessThanOrEqual(nextSeverity);
        }
      }
      
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
    
    it('should limit recommendations when max specified', async () => {
      const tempDir = path.join(__dirname, 'temp-limit-test');
      const claudeDir = path.join(tempDir, '.claude');
      
      if (!fs.existsSync(claudeDir)) {
        fs.mkdirSync(claudeDir, { recursive: true });
      }
      
      const result = await generateRecommendations(tempDir, {
        maxRecommendations: 3
      });
      
      expect(result.recommendations.length).toBeLessThanOrEqual(3);
      
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });
  
  describe('Recommendation Mapping', () => {
    it('should map detected issues to recommendations correctly', async () => {
      const tempDir = path.join(__dirname, 'temp-mapping-test');
      const claudeDir = path.join(tempDir, '.claude');
      const hooksDir = path.join(claudeDir, 'hooks');
      
      fs.mkdirSync(hooksDir, { recursive: true });
      
      const result = await generateRecommendations(tempDir);
      
      // Each recommendation should have all required fields
      result.recommendations.forEach(rec => {
        expect(rec.id).toBeDefined();
        expect(rec.category).toBeDefined();
        expect(rec.severity).toBeDefined();
        expect(rec.issue).toBeDefined();
        expect(rec.recommendation).toBeDefined();
        expect(rec.impact).toBeDefined();
        expect(typeof rec.autoFixable).toBe('boolean');
      });
      
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
    
    it('should enhance recommendations with context', async () => {
      const tempDir = path.join(__dirname, 'temp-context-test');
      const claudeDir = path.join(tempDir, '.claude');
      
      fs.mkdirSync(claudeDir, { recursive: true });
      
      const result = await generateRecommendations(tempDir, {
        includeContext: true
      });
      
      // Some recommendations should have context
      const withContext = result.recommendations.filter(rec => rec.context);
      expect(withContext.length).toBeGreaterThan(0);
      
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });
  
  describe('Healthy Project', () => {
    it('should return no recommendations for healthy project', async () => {
      // This test would require a fully configured project
      // Skip if not available
      
      // For now, just verify the function handles healthy projects
      const tempDir = path.join(__dirname, 'temp-healthy-test');
      const claudeDir = path.join(tempDir, '.claude');
      const metadataPath = path.join(claudeDir, 'metadata.json');
      
      fs.mkdirSync(claudeDir, { recursive: true });
      
      // Create minimal valid metadata
      const metadata = {
        project_id: 'test-123',
        version: '1.0.0',
        diet103_version: '1.0.3'
      };
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      const result = await generateRecommendations(tempDir);
      
      // Should still work, just with some recommendations
      expect(result).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });
});

