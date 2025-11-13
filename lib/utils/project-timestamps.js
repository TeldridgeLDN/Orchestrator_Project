/**
 * Project Timestamp Tracking
 * 
 * Utilities for tracking project access times and health check timestamps.
 * Helps monitor project usage patterns and staleness.
 * 
 * @module utils/project-timestamps
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';

/**
 * Update project access timestamp
 * Records when a project was last accessed/used
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {boolean} Success status
 */
export function updateAccessTimestamp(projectPath) {
  const metadataPath = path.join(projectPath, '.claude', 'metadata.json');

  if (!fs.existsSync(metadataPath)) {
    return false;
  }

  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    
    // Initialize timestamps object if it doesn't exist
    if (!metadata.timestamps) {
      metadata.timestamps = {};
    }

    metadata.timestamps.lastAccessedAt = new Date().toISOString();

    fs.writeFileSync(
      metadataPath,
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    return true;
  } catch (err) {
    console.error(`Failed to update access timestamp: ${err.message}`);
    return false;
  }
}

/**
 * Update health check timestamp
 * Records when project health was last calculated
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {boolean} Success status
 */
export function updateHealthCheckTimestamp(projectPath) {
  const metadataPath = path.join(projectPath, '.claude', 'metadata.json');

  if (!fs.existsSync(metadataPath)) {
    return false;
  }

  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    
    // Initialize timestamps object if it doesn't exist
    if (!metadata.timestamps) {
      metadata.timestamps = {};
    }

    metadata.timestamps.lastHealthCheckAt = new Date().toISOString();

    fs.writeFileSync(
      metadataPath,
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    return true;
  } catch (err) {
    console.error(`Failed to update health check timestamp: ${err.message}`);
    return false;
  }
}

/**
 * Get project timestamps
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {Object|null} Timestamp data or null
 */
export function getProjectTimestamps(projectPath) {
  const metadataPath = path.join(projectPath, '.claude', 'metadata.json');

  if (!fs.existsSync(metadataPath)) {
    return null;
  }

  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    return metadata.timestamps || {
      lastAccessedAt: null,
      lastHealthCheckAt: null
    };
  } catch (err) {
    return null;
  }
}

/**
 * Check if project is stale (hasn't been accessed recently)
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {number} daysThreshold - Number of days before considering stale (default: 30)
 * @returns {Object} Staleness status with details
 */
export function isProjectStale(projectPath, daysThreshold = 30) {
  const timestamps = getProjectTimestamps(projectPath);

  if (!timestamps || !timestamps.lastAccessedAt) {
    return {
      isStale: true,
      reason: 'Never accessed or no timestamp recorded',
      daysSinceAccess: null
    };
  }

  const lastAccessed = new Date(timestamps.lastAccessedAt);
  const now = new Date();
  const daysSinceAccess = (now - lastAccessed) / (1000 * 60 * 60 * 24);

  return {
    isStale: daysSinceAccess > daysThreshold,
    daysSinceAccess: Math.floor(daysSinceAccess),
    lastAccessedAt: timestamps.lastAccessedAt,
    threshold: daysThreshold
  };
}

/**
 * Check if project health check is stale
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {number} daysThreshold - Number of days before health check is stale (default: 7)
 * @returns {Object} Health check staleness status
 */
export function isHealthCheckStale(projectPath, daysThreshold = 7) {
  const timestamps = getProjectTimestamps(projectPath);

  if (!timestamps || !timestamps.lastHealthCheckAt) {
    return {
      isStale: true,
      reason: 'Never checked or no timestamp recorded',
      daysSinceCheck: null
    };
  }

  const lastCheck = new Date(timestamps.lastHealthCheckAt);
  const now = new Date();
  const daysSinceCheck = (now - lastCheck) / (1000 * 60 * 60 * 24);

  return {
    isStale: daysSinceCheck > daysThreshold,
    daysSinceCheck: Math.floor(daysSinceCheck),
    lastHealthCheckAt: timestamps.lastHealthCheckAt,
    threshold: daysThreshold
  };
}

/**
 * Get formatted last access time (human-readable)
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {string} Formatted time string
 */
export function getFormattedLastAccess(projectPath) {
  const timestamps = getProjectTimestamps(projectPath);

  if (!timestamps || !timestamps.lastAccessedAt) {
    return 'Never';
  }

  const lastAccessed = new Date(timestamps.lastAccessedAt);
  const now = new Date();
  const diffMs = now - lastAccessed;
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) {
    return 'Just now';
  } else if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (days < 30) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else {
    const months = Math.floor(days / 30);
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Get all projects sorted by last access time
 * Requires access to global project registry
 * 
 * @param {Array<Object>} projects - Array of project objects with paths
 * @returns {Array<Object>} Projects sorted by access time (newest first)
 */
export function sortProjectsByAccess(projects) {
  return projects
    .map(project => ({
      ...project,
      timestamps: getProjectTimestamps(project.path),
      formatted: getFormattedLastAccess(project.path)
    }))
    .sort((a, b) => {
      const aTime = a.timestamps?.lastAccessedAt ? new Date(a.timestamps.lastAccessedAt) : new Date(0);
      const bTime = b.timestamps?.lastAccessedAt ? new Date(b.timestamps.lastAccessedAt) : new Date(0);
      return bTime - aTime; // Newest first
    });
}

/**
 * Initialize timestamps for a project
 * Call this when creating a new project
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {boolean} Success status
 */
export function initializeTimestamps(projectPath) {
  const metadataPath = path.join(projectPath, '.claude', 'metadata.json');

  if (!fs.existsSync(metadataPath)) {
    return false;
  }

  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    
    if (!metadata.timestamps) {
      const now = new Date().toISOString();
      metadata.timestamps = {
        createdAt: now,
        lastAccessedAt: now,
        lastHealthCheckAt: null
      };

      fs.writeFileSync(
        metadataPath,
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );
    }

    return true;
  } catch (err) {
    console.error(`Failed to initialize timestamps: ${err.message}`);
    return false;
  }
}

/**
 * Get project activity summary
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {Object} Activity summary with all relevant metrics
 */
export function getProjectActivitySummary(projectPath) {
  const timestamps = getProjectTimestamps(projectPath);
  const staleness = isProjectStale(projectPath);
  const healthStaleness = isHealthCheckStale(projectPath);

  return {
    lastAccessed: timestamps?.lastAccessedAt || null,
    lastAccessedFormatted: getFormattedLastAccess(projectPath),
    lastHealthCheck: timestamps?.lastHealthCheckAt || null,
    isStale: staleness.isStale,
    daysSinceAccess: staleness.daysSinceAccess,
    isHealthCheckStale: healthStaleness.isStale,
    daysSinceHealthCheck: healthStaleness.daysSinceCheck
  };
}

