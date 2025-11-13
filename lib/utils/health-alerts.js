/**
 * Project Health Alert System
 * 
 * Generates and manages alerts based on project health score changes.
 * Provides notification capabilities for health status changes.
 * 
 * @module utils/health-alerts
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';

/**
 * Alert severity levels
 * @constant {Object}
 */
export const ALERT_SEVERITY = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success'
};

/**
 * Alert types
 * @constant {Object}
 */
export const ALERT_TYPE = {
  HEALTH: 'health',
  HEALTH_IMPROVED: 'health_improved',
  HEALTH_DEGRADED: 'health_degraded'
};

/**
 * Health score alert thresholds
 * @constant {Object}
 */
export const HEALTH_THRESHOLDS = {
  CRITICAL: 50,  // Score < 50 triggers critical alert
  WARNING: 70,   // Score < 70 triggers warning alert
  IMPROVEMENT: 20 // Score improvement >= 20 triggers info alert
};

/**
 * Alert Object Structure
 * @typedef {Object} HealthAlert
 * @property {string} id - Unique alert identifier
 * @property {string} type - Alert type (health/health_improved/health_degraded)
 * @property {string} severity - Alert severity (critical/warning/info/success)
 * @property {string} message - Alert message
 * @property {number} score - Current health score
 * @property {number} [previousScore] - Previous health score (for change alerts)
 * @property {string} timestamp - ISO timestamp when alert was created
 * @property {boolean} dismissed - Whether alert has been dismissed
 * @property {string} [dismissedAt] - ISO timestamp when alert was dismissed
 */

/**
 * Generate alert ID
 * @returns {string} Unique alert ID
 */
function generateAlertId() {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get alert severity based on health score
 * @param {number} score - Current health score
 * @returns {string} Alert severity
 */
export function getHealthScoreSeverity(score) {
  if (score < HEALTH_THRESHOLDS.CRITICAL) {
    return ALERT_SEVERITY.CRITICAL;
  }
  if (score < HEALTH_THRESHOLDS.WARNING) {
    return ALERT_SEVERITY.WARNING;
  }
  return ALERT_SEVERITY.INFO;
}

/**
 * Generate alert message based on score and type
 * @param {string} type - Alert type
 * @param {number} score - Current health score
 * @param {number} [previousScore] - Previous health score
 * @returns {string} Alert message
 */
export function generateAlertMessage(type, score, previousScore) {
  switch (type) {
    case ALERT_TYPE.HEALTH:
      if (score < HEALTH_THRESHOLDS.CRITICAL) {
        return `⚠️ Project health is critical (${score}/100). Immediate action required.`;
      }
      if (score < HEALTH_THRESHOLDS.WARNING) {
        return `⚡ Project health needs attention (${score}/100).`;
      }
      return `✓ Project health is good (${score}/100).`;
    
    case ALERT_TYPE.HEALTH_IMPROVED:
      const improvement = score - (previousScore || 0);
      return `🎉 Great! Project health improved by ${improvement} points (${previousScore}→${score}).`;
    
    case ALERT_TYPE.HEALTH_DEGRADED:
      const degradation = (previousScore || 0) - score;
      return `📉 Project health declined by ${degradation} points (${previousScore}→${score}).`;
    
    default:
      return `Project health: ${score}/100`;
  }
}

/**
 * Check and generate health alerts based on current score
 * @param {string} projectPath - Absolute path to project root
 * @param {number} currentScore - Current health score
 * @param {number} [previousScore] - Previous health score (for comparison)
 * @returns {Promise<Array<HealthAlert>>} Array of new alerts generated
 */
export async function checkHealthAlerts(projectPath, currentScore, previousScore = null) {
  const newAlerts = [];
  
  // Load existing alerts
  const existingAlerts = await loadProjectAlerts(projectPath);
  
  // Filter out old health alerts (keep non-health alerts and dismissed alerts)
  const nonHealthAlerts = existingAlerts.filter(
    alert => alert.type !== ALERT_TYPE.HEALTH && 
             alert.type !== ALERT_TYPE.HEALTH_IMPROVED &&
             alert.type !== ALERT_TYPE.HEALTH_DEGRADED
  );
  
  const dismissedHealthAlerts = existingAlerts.filter(
    alert => (alert.type === ALERT_TYPE.HEALTH || 
              alert.type === ALERT_TYPE.HEALTH_IMPROVED ||
              alert.type === ALERT_TYPE.HEALTH_DEGRADED) &&
             alert.dismissed === true
  );
  
  // Generate new health status alert
  if (currentScore < HEALTH_THRESHOLDS.WARNING) {
    const severity = getHealthScoreSeverity(currentScore);
    const message = generateAlertMessage(ALERT_TYPE.HEALTH, currentScore);
    
    newAlerts.push({
      id: generateAlertId(),
      type: ALERT_TYPE.HEALTH,
      severity,
      message,
      score: currentScore,
      previousScore,
      timestamp: new Date().toISOString(),
      dismissed: false
    });
  }
  
  // Generate improvement/degradation alerts if previous score exists
  if (previousScore !== null && previousScore !== undefined) {
    const scoreDiff = currentScore - previousScore;
    
    // Significant improvement
    if (scoreDiff >= HEALTH_THRESHOLDS.IMPROVEMENT) {
      newAlerts.push({
        id: generateAlertId(),
        type: ALERT_TYPE.HEALTH_IMPROVED,
        severity: ALERT_SEVERITY.SUCCESS,
        message: generateAlertMessage(ALERT_TYPE.HEALTH_IMPROVED, currentScore, previousScore),
        score: currentScore,
        previousScore,
        timestamp: new Date().toISOString(),
        dismissed: false
      });
    }
    
    // Significant degradation
    if (scoreDiff <= -HEALTH_THRESHOLDS.IMPROVEMENT) {
      newAlerts.push({
        id: generateAlertId(),
        type: ALERT_TYPE.HEALTH_DEGRADED,
        severity: ALERT_SEVERITY.WARNING,
        message: generateAlertMessage(ALERT_TYPE.HEALTH_DEGRADED, currentScore, previousScore),
        score: currentScore,
        previousScore,
        timestamp: new Date().toISOString(),
        dismissed: false
      });
    }
  }
  
  // Combine all alerts: non-health alerts + dismissed health alerts + new health alerts
  const allAlerts = [...nonHealthAlerts, ...dismissedHealthAlerts, ...newAlerts];
  
  // Save updated alerts
  await saveProjectAlerts(projectPath, allAlerts);
  
  return newAlerts;
}

/**
 * Get active (non-dismissed) alerts for a project
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Array<HealthAlert>>} Array of active alerts
 */
export async function getActiveAlerts(projectPath) {
  const alerts = await loadProjectAlerts(projectPath);
  return alerts.filter(alert => !alert.dismissed);
}

/**
 * Get all alerts (including dismissed) for a project
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Array<HealthAlert>>} Array of all alerts
 */
export async function getAllAlerts(projectPath) {
  return await loadProjectAlerts(projectPath);
}

/**
 * Dismiss an alert
 * @param {string} projectPath - Absolute path to project root
 * @param {string} alertId - Alert ID to dismiss
 * @returns {Promise<boolean>} Success status
 */
export async function dismissAlert(projectPath, alertId) {
  const alerts = await loadProjectAlerts(projectPath);
  
  const alert = alerts.find(a => a.id === alertId);
  if (!alert) {
    return false;
  }
  
  alert.dismissed = true;
  alert.dismissedAt = new Date().toISOString();
  
  await saveProjectAlerts(projectPath, alerts);
  return true;
}

/**
 * Dismiss all active alerts
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<number>} Number of alerts dismissed
 */
export async function dismissAllAlerts(projectPath) {
  const alerts = await loadProjectAlerts(projectPath);
  let dismissedCount = 0;
  
  alerts.forEach(alert => {
    if (!alert.dismissed) {
      alert.dismissed = true;
      alert.dismissedAt = new Date().toISOString();
      dismissedCount++;
    }
  });
  
  await saveProjectAlerts(projectPath, alerts);
  return dismissedCount;
}

/**
 * Clear old dismissed alerts (older than specified days)
 * @param {string} projectPath - Absolute path to project root
 * @param {number} daysOld - Age threshold in days (default: 30)
 * @returns {Promise<number>} Number of alerts removed
 */
export async function clearOldAlerts(projectPath, daysOld = 30) {
  const alerts = await loadProjectAlerts(projectPath);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const remaining = alerts.filter(alert => {
    if (!alert.dismissed) {
      return true; // Keep all active alerts
    }
    
    const dismissedDate = new Date(alert.dismissedAt || alert.timestamp);
    return dismissedDate > cutoffDate;
  });
  
  const removedCount = alerts.length - remaining.length;
  
  if (removedCount > 0) {
    await saveProjectAlerts(projectPath, remaining);
  }
  
  return removedCount;
}

/**
 * Load alerts from project metadata
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Array<HealthAlert>>} Array of alerts
 */
async function loadProjectAlerts(projectPath) {
  const metadataPath = path.join(projectPath, '.claude', 'metadata.json');
  
  if (!fs.existsSync(metadataPath)) {
    return [];
  }
  
  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    return metadata.alerts || [];
  } catch (error) {
    console.error(`Failed to load alerts: ${error.message}`);
    return [];
  }
}

/**
 * Save alerts to project metadata
 * @param {string} projectPath - Absolute path to project root
 * @param {Array<HealthAlert>} alerts - Array of alerts to save
 * @returns {Promise<boolean>} Success status
 */
async function saveProjectAlerts(projectPath, alerts) {
  const metadataPath = path.join(projectPath, '.claude', 'metadata.json');
  
  if (!fs.existsSync(metadataPath)) {
    return false;
  }
  
  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    metadata.alerts = alerts;
    
    fs.writeFileSync(
      metadataPath,
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );
    
    return true;
  } catch (error) {
    console.error(`Failed to save alerts: ${error.message}`);
    return false;
  }
}

/**
 * Get alert statistics
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Object>} Alert statistics
 */
export async function getAlertStatistics(projectPath) {
  const alerts = await loadProjectAlerts(projectPath);
  
  return {
    total: alerts.length,
    active: alerts.filter(a => !a.dismissed).length,
    dismissed: alerts.filter(a => a.dismissed).length,
    bySeverity: {
      critical: alerts.filter(a => a.severity === ALERT_SEVERITY.CRITICAL && !a.dismissed).length,
      warning: alerts.filter(a => a.severity === ALERT_SEVERITY.WARNING && !a.dismissed).length,
      info: alerts.filter(a => a.severity === ALERT_SEVERITY.INFO && !a.dismissed).length,
      success: alerts.filter(a => a.severity === ALERT_SEVERITY.SUCCESS && !a.dismissed).length
    },
    byType: {
      health: alerts.filter(a => a.type === ALERT_TYPE.HEALTH && !a.dismissed).length,
      health_improved: alerts.filter(a => a.type === ALERT_TYPE.HEALTH_IMPROVED && !a.dismissed).length,
      health_degraded: alerts.filter(a => a.type === ALERT_TYPE.HEALTH_DEGRADED && !a.dismissed).length
    }
  };
}

