/**
 * @fileoverview Version Comparison and Semver Utilities
 * @module lib/utils/version-utils
 * 
 * Provides utilities for semantic version comparison, constraint parsing,
 * and version compatibility checking.
 * 
 * @see {@link https://semver.org/|Semantic Versioning}
 */

/**
 * Parse a semantic version string into components
 * 
 * @param {string} version - Version string (e.g., "1.2.3", "2.0.0-beta.1")
 * @returns {Object|null} Parsed version object or null if invalid
 */
export function parseVersion(version) {
  if (!version || typeof version !== 'string') {
    return null;
  }
  
  // Semver regex: major.minor.patch[-prerelease][+build]
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;
  const match = version.match(semverRegex);
  
  if (!match) {
    return null;
  }
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null,
    build: match[5] || null,
    raw: version
  };
}

/**
 * Compare two semantic versions
 * 
 * @param {string} v1 - First version
 * @param {string} v2 - Second version
 * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2, NaN if invalid
 */
export function compareVersions(v1, v2) {
  const parsed1 = parseVersion(v1);
  const parsed2 = parseVersion(v2);
  
  if (!parsed1 || !parsed2) {
    return NaN;
  }
  
  // Compare major, minor, patch
  if (parsed1.major !== parsed2.major) {
    return parsed1.major > parsed2.major ? 1 : -1;
  }
  if (parsed1.minor !== parsed2.minor) {
    return parsed1.minor > parsed2.minor ? 1 : -1;
  }
  if (parsed1.patch !== parsed2.patch) {
    return parsed1.patch > parsed2.patch ? 1 : -1;
  }
  
  // If versions are equal but one has prerelease, the one without is greater
  if (!parsed1.prerelease && parsed2.prerelease) {
    return 1;
  }
  if (parsed1.prerelease && !parsed2.prerelease) {
    return -1;
  }
  
  // Both have prereleases, compare lexicographically
  if (parsed1.prerelease && parsed2.prerelease) {
    if (parsed1.prerelease < parsed2.prerelease) return -1;
    if (parsed1.prerelease > parsed2.prerelease) return 1;
  }
  
  return 0;
}

/**
 * Check if a version satisfies a constraint
 * 
 * Supports: exact, ^, ~, >=, <=, >, <, =
 * 
 * @param {string} version - Version to check
 * @param {string} constraint - Version constraint (e.g., "^1.2.0", ">=2.0.0")
 * @returns {boolean} True if version satisfies constraint
 */
export function satisfiesConstraint(version, constraint) {
  if (!constraint || !version) {
    return false;
  }
  
  const parsed = parseVersion(version);
  if (!parsed) {
    return false;
  }
  
  // Exact match (no operator)
  if (!constraint.match(/^[~^><=]/)) {
    return compareVersions(version, constraint) === 0;
  }
  
  // Caret (^) - Compatible with version (same major)
  if (constraint.startsWith('^')) {
    const targetVersion = constraint.slice(1);
    const target = parseVersion(targetVersion);
    if (!target) return false;
    
    if (parsed.major !== target.major) return false;
    if (target.major === 0) {
      // For 0.x.x, minor version must match
      if (parsed.minor !== target.minor) return false;
    }
    return compareVersions(version, targetVersion) >= 0;
  }
  
  // Tilde (~) - Approximately equivalent (same major.minor)
  if (constraint.startsWith('~')) {
    const targetVersion = constraint.slice(1);
    const target = parseVersion(targetVersion);
    if (!target) return false;
    
    if (parsed.major !== target.major) return false;
    if (parsed.minor !== target.minor) return false;
    return compareVersions(version, targetVersion) >= 0;
  }
  
  // Greater than or equal (>=)
  if (constraint.startsWith('>=')) {
    const targetVersion = constraint.slice(2).trim();
    return compareVersions(version, targetVersion) >= 0;
  }
  
  // Less than or equal (<=)
  if (constraint.startsWith('<=')) {
    const targetVersion = constraint.slice(2).trim();
    return compareVersions(version, targetVersion) <= 0;
  }
  
  // Greater than (>)
  if (constraint.startsWith('>')) {
    const targetVersion = constraint.slice(1).trim();
    return compareVersions(version, targetVersion) > 0;
  }
  
  // Less than (<)
  if (constraint.startsWith('<')) {
    const targetVersion = constraint.slice(1).trim();
    return compareVersions(version, targetVersion) < 0;
  }
  
  // Equal (=)
  if (constraint.startsWith('=')) {
    const targetVersion = constraint.slice(1).trim();
    return compareVersions(version, targetVersion) === 0;
  }
  
  return false;
}

/**
 * Get the latest version from a list of versions
 * 
 * @param {Array<string>} versions - Array of version strings
 * @returns {string|null} Latest version or null if no valid versions
 */
export function getLatestVersion(versions) {
  if (!Array.isArray(versions) || versions.length === 0) {
    return null;
  }
  
  const validVersions = versions.filter(v => parseVersion(v) !== null);
  if (validVersions.length === 0) {
    return null;
  }
  
  return validVersions.reduce((latest, current) => {
    return compareVersions(current, latest) > 0 ? current : latest;
  });
}

/**
 * Filter versions that satisfy a constraint
 * 
 * @param {Array<string>} versions - Array of version strings
 * @param {string} constraint - Version constraint
 * @returns {Array<string>} Filtered versions
 */
export function filterVersions(versions, constraint) {
  if (!Array.isArray(versions)) {
    return [];
  }
  
  return versions.filter(v => satisfiesConstraint(v, constraint));
}

/**
 * Check if a version is a prerelease
 * 
 * @param {string} version - Version string
 * @returns {boolean} True if version is a prerelease
 */
export function isPrerelease(version) {
  const parsed = parseVersion(version);
  return parsed ? parsed.prerelease !== null : false;
}

/**
 * Increment version by type
 * 
 * @param {string} version - Current version
 * @param {string} type - Type of increment ('major', 'minor', 'patch')
 * @returns {string|null} New version or null if invalid
 */
export function incrementVersion(version, type) {
  const parsed = parseVersion(version);
  if (!parsed) {
    return null;
  }
  
  let { major, minor, patch } = parsed;
  
  switch (type) {
    case 'major':
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor += 1;
      patch = 0;
      break;
    case 'patch':
      patch += 1;
      break;
    default:
      return null;
  }
  
  return `${major}.${minor}.${patch}`;
}

/**
 * Validate version constraint syntax
 * 
 * @param {string} constraint - Version constraint to validate
 * @returns {Object} Validation result with valid flag and error message
 */
export function validateConstraint(constraint) {
  const result = {
    valid: true,
    error: null
  };
  
  if (!constraint || typeof constraint !== 'string') {
    result.valid = false;
    result.error = 'Constraint must be a non-empty string';
    return result;
  }
  
  // Check for valid operators
  const validOperators = /^([~^><=]+)?(.+)$/;
  const match = constraint.match(validOperators);
  
  if (!match) {
    result.valid = false;
    result.error = 'Invalid constraint format';
    return result;
  }
  
  const operator = match[1] || '';
  const version = match[2];
  
  // Validate version part
  if (!parseVersion(version)) {
    result.valid = false;
    result.error = `Invalid version: ${version}`;
    return result;
  }
  
  // Validate operator combinations
  if (operator.length > 2) {
    result.valid = false;
    result.error = 'Invalid operator combination';
    return result;
  }
  
  return result;
}

/**
 * Get version range description
 * 
 * @param {string} constraint - Version constraint
 * @returns {string} Human-readable description
 */
export function getConstraintDescription(constraint) {
  if (!constraint) {
    return 'Any version';
  }
  
  if (constraint.startsWith('^')) {
    return `Compatible with ${constraint.slice(1)} (same major version)`;
  }
  
  if (constraint.startsWith('~')) {
    return `Approximately ${constraint.slice(1)} (same major.minor version)`;
  }
  
  if (constraint.startsWith('>=')) {
    return `${constraint.slice(2).trim()} or newer`;
  }
  
  if (constraint.startsWith('<=')) {
    return `${constraint.slice(2).trim()} or older`;
  }
  
  if (constraint.startsWith('>')) {
    return `Newer than ${constraint.slice(1).trim()}`;
  }
  
  if (constraint.startsWith('<')) {
    return `Older than ${constraint.slice(1).trim()}`;
  }
  
  if (constraint.startsWith('=')) {
    return `Exactly ${constraint.slice(1).trim()}`;
  }
  
  return `Exactly ${constraint}`;
}

/**
 * Check version compatibility between two constraints
 * 
 * @param {string} constraint1 - First constraint
 * @param {string} constraint2 - Second constraint
 * @returns {boolean} True if constraints can be satisfied simultaneously
 */
export function areConstraintsCompatible(constraint1, constraint2) {
  // Simple check: generate some test versions and see if any satisfy both
  const testVersions = [
    '0.1.0', '0.9.9', '1.0.0', '1.1.0', '1.9.9',
    '2.0.0', '2.5.0', '3.0.0', '10.0.0'
  ];
  
  return testVersions.some(v => 
    satisfiesConstraint(v, constraint1) && 
    satisfiesConstraint(v, constraint2)
  );
}


