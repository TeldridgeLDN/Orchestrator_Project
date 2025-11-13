/**
 * UFC Pattern Validator
 * 
 * Validates UFC (Unified Filesystem Context) implementation against
 * PRD Section 3.4 and 4.2 requirements.
 * 
 * @module utils/ufc-validator
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Validation result
 * 
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Overall validation status
 * @property {number} score - Compliance score (0-100)
 * @property {Array<Object>} errors - Critical errors
 * @property {Array<Object>} warnings - Non-critical warnings
 * @property {Array<Object>} recommendations - Improvement suggestions
 * @property {Object} details - Detailed check results
 */

/**
 * UFC directory paths
 */
const UFC_PATHS = {
  root: path.join(process.env.HOME, '.claude', 'context'),
  projects: path.join(process.env.HOME, '.claude', 'context', 'projects'),
  workflows: path.join(process.env.HOME, '.claude', 'context', 'workflows'),
  knowledge: path.join(process.env.HOME, '.claude', 'context', 'knowledge'),
  preferences: path.join(process.env.HOME, '.claude', 'context', 'preferences'),
  registry: path.join(process.env.HOME, '.claude', 'context', 'projects', 'registry.json'),
  activeSymlink: path.join(process.env.HOME, '.claude', 'context', 'active-project')
};

/**
 * Validate entire UFC implementation
 * 
 * @param {Object} options - Validation options
 * @returns {Promise<ValidationResult>} Validation result
 */
export async function validateUFC(options = {}) {
  const result = {
    valid: true,
    score: 0,
    errors: [],
    warnings: [],
    recommendations: [],
    details: {}
  };

  const checks = [
    checkDirectoryStructure,
    checkRegistrySchema,
    checkRegistryIntegrity,
    checkSymlinkValidity,
    checkProjectDirectories,
    checkTimestampFormats,
    checkCacheStatus,
    checkFrequentlyUsedPaths,
    checkQuickAccess
  ];

  let passedChecks = 0;
  const totalChecks = checks.length;

  for (const check of checks) {
    try {
      const checkResult = await check(result);
      result.details[check.name] = checkResult;
      
      if (checkResult.passed) {
        passedChecks++;
      }
    } catch (error) {
      result.errors.push({
        check: check.name,
        message: `Check failed: ${error.message}`,
        critical: true
      });
    }
  }

  // Calculate compliance score
  result.score = Math.round((passedChecks / totalChecks) * 100);
  result.valid = result.errors.length === 0;

  return result;
}

/**
 * Check UFC directory structure exists
 */
async function checkDirectoryStructure(result) {
  const checkResult = {
    passed: true,
    details: {}
  };

  const requiredDirs = ['root', 'projects', 'workflows', 'knowledge', 'preferences'];

  for (const dirName of requiredDirs) {
    const dirPath = UFC_PATHS[dirName];
    
    try {
      const stats = await fs.stat(dirPath);
      
      if (!stats.isDirectory()) {
        result.errors.push({
          check: 'directory_structure',
          message: `${dirName} exists but is not a directory: ${dirPath}`,
          critical: true
        });
        checkResult.passed = false;
      }
      
      checkResult.details[dirName] = 'exists';
    } catch (error) {
      if (error.code === 'ENOENT') {
        result.errors.push({
          check: 'directory_structure',
          message: `Required directory missing: ${dirPath}`,
          critical: true
        });
        checkResult.passed = false;
        checkResult.details[dirName] = 'missing';
      } else {
        throw error;
      }
    }
  }

  return checkResult;
}

/**
 * Check registry.json schema
 */
async function checkRegistrySchema(result) {
  const checkResult = {
    passed: true,
    details: {}
  };

  try {
    const registryContent = await fs.readFile(UFC_PATHS.registry, 'utf-8');
    const registry = JSON.parse(registryContent);

    // Check required top-level fields
    const requiredFields = ['version', 'updated_at', 'active_project', 'projects'];
    
    for (const field of requiredFields) {
      if (!(field in registry)) {
        result.errors.push({
          check: 'registry_schema',
          message: `Missing required field in registry: ${field}`,
          critical: true
        });
        checkResult.passed = false;
      }
    }

    // Check version format
    if (registry.version && !/^\d+\.\d+\.\d+$/.test(registry.version)) {
      result.warnings.push({
        check: 'registry_schema',
        message: `Invalid version format: ${registry.version} (should be semver)`,
        critical: false
      });
    }

    // Check active_project type
    if (registry.active_project !== null && typeof registry.active_project !== 'string') {
      result.errors.push({
        check: 'registry_schema',
        message: `Invalid active_project type: ${typeof registry.active_project} (should be string or null)`,
        critical: true
      });
      checkResult.passed = false;
    }

    // Check projects is object
    if (typeof registry.projects !== 'object' || Array.isArray(registry.projects)) {
      result.errors.push({
        check: 'registry_schema',
        message: `Invalid projects type: ${typeof registry.projects} (should be object)`,
        critical: true
      });
      checkResult.passed = false;
    }

    checkResult.details = {
      version: registry.version,
      projectCount: Object.keys(registry.projects || {}).length,
      activeProject: registry.active_project
    };

  } catch (error) {
    if (error.code === 'ENOENT') {
      result.errors.push({
        check: 'registry_schema',
        message: 'Registry file not found: ' + UFC_PATHS.registry,
        critical: true
      });
      checkResult.passed = false;
    } else if (error instanceof SyntaxError) {
      result.errors.push({
        check: 'registry_schema',
        message: 'Registry JSON is malformed: ' + error.message,
        critical: true
      });
      checkResult.passed = false;
    } else {
      throw error;
    }
  }

  return checkResult;
}

/**
 * Check registry data integrity
 */
async function checkRegistryIntegrity(result) {
  const checkResult = {
    passed: true,
    details: {}
  };

  try {
    const registryContent = await fs.readFile(UFC_PATHS.registry, 'utf-8');
    const registry = JSON.parse(registryContent);

    // Check active_project exists in projects
    if (registry.active_project && !registry.projects[registry.active_project]) {
      result.errors.push({
        check: 'registry_integrity',
        message: `Active project '${registry.active_project}' not found in projects`,
        critical: true
      });
      checkResult.passed = false;
    }

    // Check each project
    for (const [name, project] of Object.entries(registry.projects || {})) {
      const requiredFields = [
        'name', 'path', 'created_at', 'last_active', 
        'last_modified', 'frequently_used_paths', 
        'quick_access', 'cache_status'
      ];

      for (const field of requiredFields) {
        if (!(field in project)) {
          result.errors.push({
            check: 'registry_integrity',
            message: `Project '${name}' missing required field: ${field}`,
            critical: true
          });
          checkResult.passed = false;
        }
      }

      // Verify project path exists
      try {
        await fs.access(project.path);
      } catch (error) {
        result.warnings.push({
          check: 'registry_integrity',
          message: `Project '${name}' path does not exist: ${project.path}`,
          critical: false
        });
      }

      // Verify name matches key
      if (project.name !== name) {
        result.warnings.push({
          check: 'registry_integrity',
          message: `Project name mismatch: key='${name}', name='${project.name}'`,
          critical: false
        });
      }

      // Verify cache_status value
      if (!['hot', 'cold'].includes(project.cache_status)) {
        result.warnings.push({
          check: 'registry_integrity',
          message: `Invalid cache_status for '${name}': ${project.cache_status}`,
          critical: false
        });
      }
    }

    checkResult.details = {
      projectCount: Object.keys(registry.projects || {}).length,
      activeValid: registry.active_project ? 
        !!registry.projects[registry.active_project] : true
    };

  } catch (error) {
    // Already handled in schema check
    checkResult.passed = false;
  }

  return checkResult;
}

/**
 * Check active-project symlink validity
 */
async function checkSymlinkValidity(result) {
  const checkResult = {
    passed: true,
    details: {}
  };

  try {
    const symlinkTarget = await fs.readlink(UFC_PATHS.activeSymlink);
    checkResult.details.target = symlinkTarget;

    // Check if symlink points to valid location
    try {
      await fs.access(UFC_PATHS.activeSymlink);
      checkResult.details.valid = true;
    } catch (error) {
      result.warnings.push({
        check: 'symlink_validity',
        message: `Symlink exists but target is invalid: ${symlinkTarget}`,
        critical: false
      });
      checkResult.details.valid = false;
    }

    // Check if symlink matches active_project in registry
    try {
      const registryContent = await fs.readFile(UFC_PATHS.registry, 'utf-8');
      const registry = JSON.parse(registryContent);

      if (registry.active_project) {
        const expectedTarget = `projects/${registry.active_project}`;
        
        if (!symlinkTarget.includes(registry.active_project)) {
          result.warnings.push({
            check: 'symlink_validity',
            message: `Symlink target '${symlinkTarget}' doesn't match active_project '${registry.active_project}'`,
            critical: false
          });
        }
      }
    } catch (error) {
      // Registry error already handled
    }

  } catch (error) {
    if (error.code === 'ENOENT') {
      result.recommendations.push({
        check: 'symlink_validity',
        message: 'Active project symlink not found (create when project is active)',
        critical: false
      });
      checkResult.details.exists = false;
    } else if (error.code === 'EINVAL') {
      result.errors.push({
        check: 'symlink_validity',
        message: 'Active project path exists but is not a symlink',
        critical: true
      });
      checkResult.passed = false;
    } else {
      throw error;
    }
  }

  return checkResult;
}

/**
 * Check project context directories
 */
async function checkProjectDirectories(result) {
  const checkResult = {
    passed: true,
    details: {
      totalProjects: 0,
      withContextDir: 0,
      missing: []
    }
  };

  try {
    const registryContent = await fs.readFile(UFC_PATHS.registry, 'utf-8');
    const registry = JSON.parse(registryContent);

    checkResult.details.totalProjects = Object.keys(registry.projects || {}).length;

    for (const [name, project] of Object.entries(registry.projects || {})) {
      const projectContextDir = path.join(UFC_PATHS.projects, name);

      try {
        const stats = await fs.stat(projectContextDir);
        
        if (stats.isDirectory()) {
          checkResult.details.withContextDir++;
        }
      } catch (error) {
        if (error.code === 'ENOENT') {
          checkResult.details.missing.push(name);
          result.recommendations.push({
            check: 'project_directories',
            message: `Project '${name}' missing context directory`,
            critical: false
          });
        }
      }
    }

  } catch (error) {
    // Registry error already handled
  }

  return checkResult;
}

/**
 * Check timestamp formats
 */
async function checkTimestampFormats(result) {
  const checkResult = {
    passed: true,
    details: {
      validCount: 0,
      invalidCount: 0
    }
  };

  try {
    const registryContent = await fs.readFile(UFC_PATHS.registry, 'utf-8');
    const registry = JSON.parse(registryContent);

    // ISO 8601 regex
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

    // Check registry updated_at
    if (!iso8601Regex.test(registry.updated_at)) {
      result.warnings.push({
        check: 'timestamp_formats',
        message: `Invalid timestamp format for updated_at: ${registry.updated_at}`,
        critical: false
      });
      checkResult.details.invalidCount++;
    } else {
      checkResult.details.validCount++;
    }

    // Check project timestamps
    for (const [name, project] of Object.entries(registry.projects || {})) {
      const timestampFields = ['created_at', 'last_active', 'last_modified'];

      for (const field of timestampFields) {
        if (project[field]) {
          if (!iso8601Regex.test(project[field])) {
            result.warnings.push({
              check: 'timestamp_formats',
              message: `Invalid timestamp format for project '${name}'.${field}: ${project[field]}`,
              critical: false
            });
            checkResult.details.invalidCount++;
          } else {
            checkResult.details.validCount++;
          }
        }
      }
    }

  } catch (error) {
    // Registry error already handled
  }

  return checkResult;
}

/**
 * Check cache status management
 */
async function checkCacheStatus(result) {
  const checkResult = {
    passed: true,
    details: {
      hotCount: 0,
      coldCount: 0,
      invalidCount: 0
    }
  };

  try {
    const registryContent = await fs.readFile(UFC_PATHS.registry, 'utf-8');
    const registry = JSON.parse(registryContent);

    for (const [name, project] of Object.entries(registry.projects || {})) {
      if (project.cache_status === 'hot') {
        checkResult.details.hotCount++;
      } else if (project.cache_status === 'cold') {
        checkResult.details.coldCount++;
      } else {
        checkResult.details.invalidCount++;
        result.warnings.push({
          check: 'cache_status',
          message: `Invalid cache_status for '${name}': ${project.cache_status}`,
          critical: false
        });
      }
    }

    // Recommend if too many hot projects
    if (checkResult.details.hotCount > 3) {
      result.recommendations.push({
        check: 'cache_status',
        message: `${checkResult.details.hotCount} projects marked as 'hot'. Consider running cache cleanup.`,
        critical: false
      });
    }

  } catch (error) {
    // Registry error already handled
  }

  return checkResult;
}

/**
 * Check frequently_used_paths
 */
async function checkFrequentlyUsedPaths(result) {
  const checkResult = {
    passed: true,
    details: {
      totalProjects: 0,
      withPaths: 0,
      overLimit: 0
    }
  };

  try {
    const registryContent = await fs.readFile(UFC_PATHS.registry, 'utf-8');
    const registry = JSON.parse(registryContent);

    checkResult.details.totalProjects = Object.keys(registry.projects || {}).length;

    for (const [name, project] of Object.entries(registry.projects || {})) {
      if (Array.isArray(project.frequently_used_paths)) {
        if (project.frequently_used_paths.length > 0) {
          checkResult.details.withPaths++;
        }

        if (project.frequently_used_paths.length > 20) {
          checkResult.details.overLimit++;
          result.recommendations.push({
            check: 'frequently_used_paths',
            message: `Project '${name}' has ${project.frequently_used_paths.length} frequently used paths (limit: 20)`,
            critical: false
          });
        }
      }
    }

  } catch (error) {
    // Registry error already handled
  }

  return checkResult;
}

/**
 * Check quick_access
 */
async function checkQuickAccess(result) {
  const checkResult = {
    passed: true,
    details: {
      totalProjects: 0,
      withQuickAccess: 0
    }
  };

  try {
    const registryContent = await fs.readFile(UFC_PATHS.registry, 'utf-8');
    const registry = JSON.parse(registryContent);

    checkResult.details.totalProjects = Object.keys(registry.projects || {}).length;

    for (const [name, project] of Object.entries(registry.projects || {})) {
      if (project.quick_access && typeof project.quick_access === 'object') {
        if (Object.keys(project.quick_access).length > 0) {
          checkResult.details.withQuickAccess++;
        }
      }
    }

  } catch (error) {
    // Registry error already handled
  }

  return checkResult;
}

/**
 * Generate compliance report
 * 
 * @param {ValidationResult} result - Validation result
 * @returns {string} Formatted report
 */
export function generateComplianceReport(result) {
  const lines = [];

  lines.push('═══════════════════════════════════════════════════════');
  lines.push('UFC PATTERN COMPLIANCE REPORT');
  lines.push('═══════════════════════════════════════════════════════');
  lines.push('');

  // Overall status
  const statusIcon = result.valid ? '✅' : '❌';
  const statusText = result.valid ? 'COMPLIANT' : 'NON-COMPLIANT';
  lines.push(`Status: ${statusIcon} ${statusText}`);
  lines.push(`Compliance Score: ${result.score}%`);
  lines.push('');

  // Errors
  if (result.errors.length > 0) {
    lines.push(`❌ ERRORS (${result.errors.length}):`);
    for (const error of result.errors) {
      lines.push(`   • [${error.check}] ${error.message}`);
    }
    lines.push('');
  }

  // Warnings
  if (result.warnings.length > 0) {
    lines.push(`⚠️  WARNINGS (${result.warnings.length}):`);
    for (const warning of result.warnings) {
      lines.push(`   • [${warning.check}] ${warning.message}`);
    }
    lines.push('');
  }

  // Recommendations
  if (result.recommendations.length > 0) {
    lines.push(`💡 RECOMMENDATIONS (${result.recommendations.length}):`);
    for (const rec of result.recommendations) {
      lines.push(`   • [${rec.check}] ${rec.message}`);
    }
    lines.push('');
  }

  // Details
  if (Object.keys(result.details).length > 0) {
    lines.push('📊 CHECK DETAILS:');
    for (const [checkName, details] of Object.entries(result.details)) {
      const passedIcon = details.passed ? '✅' : '❌';
      lines.push(`   ${passedIcon} ${checkName}`);
      
      if (details.details && typeof details.details === 'object') {
        for (const [key, value] of Object.entries(details.details)) {
          lines.push(`      ${key}: ${JSON.stringify(value)}`);
        }
      }
    }
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════');

  return lines.join('\n');
}

export default {
  validateUFC,
  generateComplianceReport
};

