/**
 * Health Alerts System Tests
 * 
 * Tests for the health alert generation, storage, and management system.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  checkHealthAlerts,
  getActiveAlerts,
  getAllAlerts,
  dismissAlert,
  dismissAllAlerts,
  clearOldAlerts,
  getAlertStatistics,
  getHealthScoreSeverity,
  generateAlertMessage,
  HEALTH_THRESHOLDS,
  ALERT_SEVERITY,
  ALERT_TYPE
} from '../lib/utils/health-alerts.js';

describe('Health Alerts System', () => {
  let testProjectPath;
  let claudeDir;
  let metadataPath;

  beforeEach(() => {
    // Create temporary test project
    testProjectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'health-alerts-test-'));
    claudeDir = path.join(testProjectPath, '.claude');
    metadataPath = path.join(claudeDir, 'metadata.json');

    // Create .claude directory and metadata file
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(metadataPath, JSON.stringify({
      project: 'Test Project',
      version: '1.0.0',
      alerts: []
    }, null, 2));
  });

  afterEach(() => {
    // Clean up test project
    if (fs.existsSync(testProjectPath)) {
      fs.rmSync(testProjectPath, { recursive: true, force: true });
    }
  });

  describe('Alert Thresholds and Constants', () => {
    it('should have correct health thresholds', () => {
      expect(HEALTH_THRESHOLDS.CRITICAL).toBe(50);
      expect(HEALTH_THRESHOLDS.WARNING).toBe(70);
      expect(HEALTH_THRESHOLDS.IMPROVEMENT).toBe(20);
    });

    it('should have correct alert severity levels', () => {
      expect(ALERT_SEVERITY.CRITICAL).toBe('critical');
      expect(ALERT_SEVERITY.WARNING).toBe('warning');
      expect(ALERT_SEVERITY.INFO).toBe('info');
      expect(ALERT_SEVERITY.SUCCESS).toBe('success');
    });

    it('should have correct alert types', () => {
      expect(ALERT_TYPE.HEALTH).toBe('health');
      expect(ALERT_TYPE.HEALTH_IMPROVED).toBe('health_improved');
      expect(ALERT_TYPE.HEALTH_DEGRADED).toBe('health_degraded');
    });
  });

  describe('getHealthScoreSeverity', () => {
    it('should return critical for scores below 50', () => {
      expect(getHealthScoreSeverity(0)).toBe(ALERT_SEVERITY.CRITICAL);
      expect(getHealthScoreSeverity(30)).toBe(ALERT_SEVERITY.CRITICAL);
      expect(getHealthScoreSeverity(49)).toBe(ALERT_SEVERITY.CRITICAL);
    });

    it('should return warning for scores 50-69', () => {
      expect(getHealthScoreSeverity(50)).toBe(ALERT_SEVERITY.WARNING);
      expect(getHealthScoreSeverity(60)).toBe(ALERT_SEVERITY.WARNING);
      expect(getHealthScoreSeverity(69)).toBe(ALERT_SEVERITY.WARNING);
    });

    it('should return info for scores 70+', () => {
      expect(getHealthScoreSeverity(70)).toBe(ALERT_SEVERITY.INFO);
      expect(getHealthScoreSeverity(85)).toBe(ALERT_SEVERITY.INFO);
      expect(getHealthScoreSeverity(100)).toBe(ALERT_SEVERITY.INFO);
    });
  });

  describe('generateAlertMessage', () => {
    it('should generate critical health message for low scores', () => {
      const message = generateAlertMessage(ALERT_TYPE.HEALTH, 30);
      expect(message).toContain('critical');
      expect(message).toContain('30/100');
      expect(message).toContain('⚠️');
    });

    it('should generate warning health message for medium scores', () => {
      const message = generateAlertMessage(ALERT_TYPE.HEALTH, 60);
      expect(message).toContain('needs attention');
      expect(message).toContain('60/100');
      expect(message).toContain('⚡');
    });

    it('should generate good health message for high scores', () => {
      const message = generateAlertMessage(ALERT_TYPE.HEALTH, 85);
      expect(message).toContain('good');
      expect(message).toContain('85/100');
      expect(message).toContain('✓');
    });

    it('should generate improvement message with score change', () => {
      const message = generateAlertMessage(ALERT_TYPE.HEALTH_IMPROVED, 85, 60);
      expect(message).toContain('improved');
      expect(message).toContain('25');
      expect(message).toContain('60→85');
      expect(message).toContain('🎉');
    });

    it('should generate degradation message with score change', () => {
      const message = generateAlertMessage(ALERT_TYPE.HEALTH_DEGRADED, 60, 85);
      expect(message).toContain('declined');
      expect(message).toContain('25');
      expect(message).toContain('85→60');
      expect(message).toContain('📉');
    });
  });

  describe('checkHealthAlerts - Critical Score', () => {
    it('should generate critical alert for score below 50', async () => {
      const alerts = await checkHealthAlerts(testProjectPath, 40);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe(ALERT_TYPE.HEALTH);
      expect(alerts[0].severity).toBe(ALERT_SEVERITY.CRITICAL);
      expect(alerts[0].score).toBe(40);
      expect(alerts[0].dismissed).toBe(false);
    });

    it('should persist critical alert to metadata', async () => {
      await checkHealthAlerts(testProjectPath, 40);
      
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      expect(metadata.alerts).toHaveLength(1);
      expect(metadata.alerts[0].severity).toBe(ALERT_SEVERITY.CRITICAL);
    });
  });

  describe('checkHealthAlerts - Warning Score', () => {
    it('should generate warning alert for score 50-69', async () => {
      const alerts = await checkHealthAlerts(testProjectPath, 60);
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe(ALERT_TYPE.HEALTH);
      expect(alerts[0].severity).toBe(ALERT_SEVERITY.WARNING);
      expect(alerts[0].score).toBe(60);
    });

    it('should not generate alert for healthy score', async () => {
      const alerts = await checkHealthAlerts(testProjectPath, 85);
      
      expect(alerts).toHaveLength(0);
    });
  });

  describe('checkHealthAlerts - Score Improvements', () => {
    it('should generate improvement alert for 20+ point increase', async () => {
      const alerts = await checkHealthAlerts(testProjectPath, 80, 55);
      
      const improvementAlert = alerts.find(a => a.type === ALERT_TYPE.HEALTH_IMPROVED);
      expect(improvementAlert).toBeDefined();
      expect(improvementAlert.severity).toBe(ALERT_SEVERITY.SUCCESS);
      expect(improvementAlert.score).toBe(80);
      expect(improvementAlert.previousScore).toBe(55);
    });

    it('should not generate improvement alert for small increase', async () => {
      const alerts = await checkHealthAlerts(testProjectPath, 80, 70);
      
      const improvementAlert = alerts.find(a => a.type === ALERT_TYPE.HEALTH_IMPROVED);
      expect(improvementAlert).toBeUndefined();
    });
  });

  describe('checkHealthAlerts - Score Degradations', () => {
    it('should generate degradation alert for 20+ point decrease', async () => {
      const alerts = await checkHealthAlerts(testProjectPath, 50, 75);
      
      const degradationAlert = alerts.find(a => a.type === ALERT_TYPE.HEALTH_DEGRADED);
      expect(degradationAlert).toBeDefined();
      expect(degradationAlert.severity).toBe(ALERT_SEVERITY.WARNING);
      expect(degradationAlert.score).toBe(50);
      expect(degradationAlert.previousScore).toBe(75);
    });

    it('should not generate degradation alert for small decrease', async () => {
      const alerts = await checkHealthAlerts(testProjectPath, 75, 80);
      
      const degradationAlert = alerts.find(a => a.type === ALERT_TYPE.HEALTH_DEGRADED);
      expect(degradationAlert).toBeUndefined();
    });
  });

  describe('checkHealthAlerts - Multiple Alerts', () => {
    it('should generate both health and degradation alerts', async () => {
      const alerts = await checkHealthAlerts(testProjectPath, 60, 85);
      
      expect(alerts.length).toBeGreaterThanOrEqual(2);
      expect(alerts.some(a => a.type === ALERT_TYPE.HEALTH)).toBe(true);
      expect(alerts.some(a => a.type === ALERT_TYPE.HEALTH_DEGRADED)).toBe(true);
    });

    it('should replace old health alerts with new ones', async () => {
      // Generate first set of alerts
      await checkHealthAlerts(testProjectPath, 60);
      
      // Generate new alerts (should replace old health alert)
      await checkHealthAlerts(testProjectPath, 40);
      
      const allAlerts = await getAllAlerts(testProjectPath);
      const healthAlerts = allAlerts.filter(a => a.type === ALERT_TYPE.HEALTH && !a.dismissed);
      
      // Should only have one active health alert (the new one)
      expect(healthAlerts).toHaveLength(1);
      expect(healthAlerts[0].score).toBe(40);
    });
  });

  describe('getActiveAlerts', () => {
    it('should return only non-dismissed alerts', async () => {
      // Generate alerts
      await checkHealthAlerts(testProjectPath, 40);
      const allAlerts = await getAllAlerts(testProjectPath);
      
      // Dismiss one
      await dismissAlert(testProjectPath, allAlerts[0].id);
      
      // Check active alerts
      const activeAlerts = await getActiveAlerts(testProjectPath);
      expect(activeAlerts).toHaveLength(0);
    });

    it('should return empty array when no alerts exist', async () => {
      const activeAlerts = await getActiveAlerts(testProjectPath);
      expect(activeAlerts).toEqual([]);
    });
  });

  describe('dismissAlert', () => {
    it('should mark alert as dismissed', async () => {
      await checkHealthAlerts(testProjectPath, 40);
      const alerts = await getAllAlerts(testProjectPath);
      
      const success = await dismissAlert(testProjectPath, alerts[0].id);
      
      expect(success).toBe(true);
      
      const updatedAlerts = await getAllAlerts(testProjectPath);
      expect(updatedAlerts[0].dismissed).toBe(true);
      expect(updatedAlerts[0].dismissedAt).toBeDefined();
    });

    it('should return false for non-existent alert ID', async () => {
      const success = await dismissAlert(testProjectPath, 'non-existent-id');
      expect(success).toBe(false);
    });
  });

  describe('dismissAllAlerts', () => {
    it('should dismiss all active alerts', async () => {
      // Generate multiple alerts
      await checkHealthAlerts(testProjectPath, 40, 80);
      
      const beforeCount = (await getActiveAlerts(testProjectPath)).length;
      expect(beforeCount).toBeGreaterThan(0);
      
      const dismissedCount = await dismissAllAlerts(testProjectPath);
      
      expect(dismissedCount).toBe(beforeCount);
      
      const afterCount = (await getActiveAlerts(testProjectPath)).length;
      expect(afterCount).toBe(0);
    });

    it('should return 0 when no active alerts exist', async () => {
      const dismissedCount = await dismissAllAlerts(testProjectPath);
      expect(dismissedCount).toBe(0);
    });
  });

  describe('clearOldAlerts', () => {
    it('should remove old dismissed alerts', async () => {
      // Generate and dismiss alerts
      await checkHealthAlerts(testProjectPath, 40);
      const alerts = await getAllAlerts(testProjectPath);
      await dismissAlert(testProjectPath, alerts[0].id);
      
      // Modify dismissedAt to be 31 days ago
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);
      metadata.alerts[0].dismissedAt = oldDate.toISOString();
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      // Clear old alerts
      const removedCount = await clearOldAlerts(testProjectPath, 30);
      
      expect(removedCount).toBe(1);
      
      const remainingAlerts = await getAllAlerts(testProjectPath);
      expect(remainingAlerts).toHaveLength(0);
    });

    it('should keep recent dismissed alerts', async () => {
      await checkHealthAlerts(testProjectPath, 40);
      const alerts = await getAllAlerts(testProjectPath);
      await dismissAlert(testProjectPath, alerts[0].id);
      
      const removedCount = await clearOldAlerts(testProjectPath, 30);
      
      expect(removedCount).toBe(0);
      
      const remainingAlerts = await getAllAlerts(testProjectPath);
      expect(remainingAlerts).toHaveLength(1);
    });

    it('should never remove active alerts', async () => {
      await checkHealthAlerts(testProjectPath, 40);
      
      const removedCount = await clearOldAlerts(testProjectPath, 0);
      
      expect(removedCount).toBe(0);
      
      const activeAlerts = await getActiveAlerts(testProjectPath);
      expect(activeAlerts).toHaveLength(1);
    });
  });

  describe('getAlertStatistics', () => {
    it('should return correct statistics', async () => {
      // Generate mix of alerts
      await checkHealthAlerts(testProjectPath, 40, 80);
      
      const stats = await getAlertStatistics(testProjectPath);
      
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.active).toBe(stats.total);
      expect(stats.dismissed).toBe(0);
      expect(stats.bySeverity).toBeDefined();
      expect(stats.byType).toBeDefined();
    });

    it('should update statistics after dismissals', async () => {
      await checkHealthAlerts(testProjectPath, 40);
      const alerts = await getAllAlerts(testProjectPath);
      await dismissAlert(testProjectPath, alerts[0].id);
      
      const stats = await getAlertStatistics(testProjectPath);
      
      expect(stats.active).toBe(0);
      expect(stats.dismissed).toBe(1);
    });

    it('should return zeros for empty project', async () => {
      const stats = await getAlertStatistics(testProjectPath);
      
      expect(stats.total).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.dismissed).toBe(0);
      expect(stats.bySeverity.critical).toBe(0);
    });
  });

  describe('Alert Persistence', () => {
    it('should preserve dismissed alerts in metadata', async () => {
      await checkHealthAlerts(testProjectPath, 40);
      const alerts = await getAllAlerts(testProjectPath);
      await dismissAlert(testProjectPath, alerts[0].id);
      
      // Re-run health check
      await checkHealthAlerts(testProjectPath, 45);
      
      const allAlerts = await getAllAlerts(testProjectPath);
      const dismissedAlerts = allAlerts.filter(a => a.dismissed);
      
      expect(dismissedAlerts.length).toBeGreaterThan(0);
    });

    it('should maintain alert history through multiple checks with scores that trigger alerts', async () => {
      // Use scores that will trigger alerts (below 70)
      await checkHealthAlerts(testProjectPath, 40);
      await checkHealthAlerts(testProjectPath, 60);
      await checkHealthAlerts(testProjectPath, 65);
      
      // Should have alerts in metadata (scores below 70 trigger alerts)
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      expect(metadata.alerts.length).toBeGreaterThan(0);
    });
  });

  describe('Rapid Score Changes', () => {
    it('should handle rapid score changes and generate improvement alerts', async () => {
      // Use score changes that trigger improvement alerts (20+ point jumps)
      const scores = [30, 40, 50, 75]; // 50->75 is a 25 point improvement
      
      for (let i = 1; i < scores.length; i++) {
        await checkHealthAlerts(testProjectPath, scores[i], scores[i - 1]);
      }
      
      const allAlerts = await getAllAlerts(testProjectPath);
      expect(allAlerts.length).toBeGreaterThan(0);
      
      // Should have improvement alerts (25 point jump from 50 to 75)
      const improvements = allAlerts.filter(a => a.type === ALERT_TYPE.HEALTH_IMPROVED);
      expect(improvements.length).toBeGreaterThan(0);
    });
  });
});

