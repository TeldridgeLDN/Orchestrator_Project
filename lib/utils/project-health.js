/**
 * Project Health Score Calculator
 * 
 * Calculates a comprehensive health score (0-100) for Claude projects
 * based on structure validity, hook status, skill activity, and configuration completeness.
 * 
 * @module utils/project-health
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import {
  detectDiet103Infrastructure,
  analyzeDiet103Gaps,
  validateMetadataJson
} from './diet103-validator.js';

/**
 * Weight configuration for health score components
 * Updated in v1.2.0 to include File Lifecycle metrics
 */
const HEALTH_WEIGHTS = {
  structure: 0.35,       // 35% - Basic infrastructure validity (reduced from 40%)
  hooks: 0.25,           // 25% - Hook configuration and activity (reduced from 30%)
  skills: 0.20,          // 20% - Skill configuration and usage
  config: 0.10,          // 10% - Configuration completeness
  fileOrganization: 0.10 // 10% - File Lifecycle metrics (NEW in v1.2.0)
};

/**
 * Calculate comprehensive project health score
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Object>} Health score details
 */
export async function calculateProjectHealth(projectPath) {
  const health = {
    score: 0,
    timestamp: new Date().toISOString(),
    components: {
      structure: { score: 0, details: [] },
      hooks: { score: 0, details: [] },
      skills: { score: 0, details: [] },
      config: { score: 0, details: [] },
      fileOrganization: { score: 0, details: [] } // NEW in v1.2.0
    },
    issues: {
      critical: [],
      warnings: []
    }
  };

  try {
    // Component 1: Structure Validity (35%)
    const structureScore = await calculateStructureScore(projectPath);
    health.components.structure = structureScore;

    // Component 2: Hook Status (25%)
    const hookScore = await calculateHookScore(projectPath);
    health.components.hooks = hookScore;

    // Component 3: Skill Activity (20%)
    const skillScore = await calculateSkillScore(projectPath);
    health.components.skills = skillScore;

    // Component 4: Configuration Completeness (10%)
    const configScore = await calculateConfigScore(projectPath);
    health.components.config = configScore;

    // Component 5: File Organization (10%) - NEW in v1.2.0
    const fileOrgScore = await calculateFileOrganizationScore(projectPath);
    health.components.fileOrganization = fileOrgScore;

    // Calculate weighted total score
    health.score = Math.round(
      structureScore.score * HEALTH_WEIGHTS.structure +
      hookScore.score * HEALTH_WEIGHTS.hooks +
      skillScore.score * HEALTH_WEIGHTS.skills +
      configScore.score * HEALTH_WEIGHTS.config +
      fileOrgScore.score * HEALTH_WEIGHTS.fileOrganization
    );

    // Clamp between 0-100
    health.score = Math.max(0, Math.min(100, health.score));

    // Collect issues
    health.issues = collectIssues(health.components);

  } catch (error) {
    health.error = error.message;
    health.score = 0;
  }

  return health;
}

/**
 * Calculate structure validity score
 * Uses existing diet103-validator for consistency
 * 
 * @param {string} projectPath - Project path
 * @returns {Promise<Object>} Structure score details
 */
async function calculateStructureScore(projectPath) {
  const checks = await detectDiet103Infrastructure(projectPath);
  const gaps = analyzeDiet103Gaps(checks);

  return {
    score: gaps.score,
    details: [
      `Critical components: ${7 - gaps.critical.length}/7`,
      `Important components: ${5 - gaps.important.length}/5`,
      `Overall completeness: ${gaps.score}%`
    ],
    gaps: {
      critical: gaps.critical,
      important: gaps.important
    }
  };
}

/**
 * Calculate hook status score
 * Checks for hook presence, validity, and activity
 * 
 * @param {string} projectPath - Project path
 * @returns {Promise<Object>} Hook score details
 */
async function calculateHookScore(projectPath) {
  const hooksDir = path.join(projectPath, '.claude', 'hooks');
  const score = {
    score: 0,
    details: [],
    hooks: {}
  };

  if (!fs.existsSync(hooksDir)) {
    score.details.push('Hooks directory not found');
    return score;
  }

  // Check for required hooks
  const requiredHooks = [
    'UserPromptSubmit.js',
    'PostToolUse.js'
  ];

  let hookCount = 0;
  let validHooks = 0;

  for (const hookFile of requiredHooks) {
    const hookPath = path.join(hooksDir, hookFile);
    const exists = fs.existsSync(hookPath);
    
    score.hooks[hookFile] = {
      exists,
      valid: false,
      size: 0
    };

    if (exists) {
      hookCount++;
      
      try {
        const stat = fs.statSync(hookPath);
        score.hooks[hookFile].size = stat.size;
        
        // Basic validity: file must have content and basic structure
        const content = fs.readFileSync(hookPath, 'utf-8');
        const hasExport = content.includes('export') || content.includes('module.exports');
        const hasFunction = content.includes('function') || content.includes('=>');
        
        if (hasExport && hasFunction && stat.size > 100) {
          score.hooks[hookFile].valid = true;
          validHooks++;
        }
      } catch (err) {
        // Invalid hook file
      }
    }
  }

  // Calculate hook score (0-100)
  // 50% for presence, 50% for validity
  const presenceScore = (hookCount / requiredHooks.length) * 50;
  const validityScore = (validHooks / requiredHooks.length) * 50;
  score.score = Math.round(presenceScore + validityScore);

  score.details.push(
    `Hooks present: ${hookCount}/${requiredHooks.length}`,
    `Valid hooks: ${validHooks}/${requiredHooks.length}`
  );

  return score;
}

/**
 * Calculate skill configuration and activity score
 * 
 * @param {string} projectPath - Project path
 * @returns {Promise<Object>} Skill score details
 */
async function calculateSkillScore(projectPath) {
  const skillsDir = path.join(projectPath, '.claude', 'skills');
  const skillRulesPath = path.join(projectPath, '.claude', 'skill-rules.json');
  
  const score = {
    score: 0,
    details: [],
    skills: []
  };

  // Check if skills directory exists
  if (!fs.existsSync(skillsDir)) {
    score.details.push('Skills directory not found');
    return score;
  }

  // Check if skill-rules.json exists and is valid
  let hasSkillRules = false;
  let configuredSkills = 0;

  if (fs.existsSync(skillRulesPath)) {
    try {
      const skillRules = JSON.parse(fs.readFileSync(skillRulesPath, 'utf-8'));
      hasSkillRules = true;
      configuredSkills = Object.keys(skillRules).length;
      score.details.push(`Configured skills in rules: ${configuredSkills}`);
    } catch (err) {
      score.details.push('skill-rules.json is invalid');
    }
  } else {
    score.details.push('skill-rules.json not found');
  }

  // Count skill directories
  let skillDirs = 0;
  try {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    skillDirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.')).length;
    
    score.skills = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => e.name);
    
    score.details.push(`Skill directories: ${skillDirs}`);
  } catch (err) {
    score.details.push('Could not read skills directory');
  }

  // Calculate skill score
  // 50% for having skill-rules.json
  // 50% for having at least one skill directory
  let skillScore = 0;
  
  if (hasSkillRules) {
    skillScore += 50;
  }
  
  if (skillDirs > 0) {
    skillScore += 50;
  }

  score.score = skillScore;

  return score;
}

/**
 * Calculate configuration completeness score
 * 
 * @param {string} projectPath - Project path
 * @returns {Promise<Object>} Config score details
 */
async function calculateConfigScore(projectPath) {
  const metadataPath = path.join(projectPath, '.claude', 'metadata.json');
  
  const score = {
    score: 0,
    details: [],
    metadata: null
  };

  if (!fs.existsSync(metadataPath)) {
    score.details.push('metadata.json not found');
    return score;
  }

  try {
    // Use existing validator
    const validation = await validateMetadataJson(projectPath);
    
    if (validation.valid) {
      score.score = 100;
      score.details.push('All required fields present');
      score.details.push('Valid diet103 version');
      
      // Read metadata for additional details
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      score.metadata = {
        project_id: metadata.project_id,
        version: metadata.version,
        diet103_version: metadata.diet103_version,
        skills_count: metadata.skills?.length || 0
      };
    } else {
      // Partial score based on which fields are present
      const errorCount = validation.errors.length;
      score.score = Math.max(0, 100 - (errorCount * 20)); // -20 points per error
      score.details.push(`Validation errors: ${errorCount}`);
      score.details = score.details.concat(validation.errors);
    }
    
    if (validation.warnings.length > 0) {
      score.details = score.details.concat(validation.warnings);
    }
  } catch (err) {
    score.details.push(`Error reading metadata: ${err.message}`);
  }

  return score;
}

/**
 * Calculate file organization score (File Lifecycle metrics)
 * NEW in v1.2.0 - Phase 2 Feature 2
 * 
 * @param {string} projectPath - Project path
 * @returns {Promise<Object>} File organization score details
 */
async function calculateFileOrganizationScore(projectPath) {
  const manifestPath = path.join(projectPath, '.file-manifest.json');
  
  const score = {
    score: 0,
    details: [],
    stats: null
  };

  // If File Lifecycle not initialized, return 0 with note
  if (!fs.existsSync(manifestPath)) {
    score.details.push('File Lifecycle not initialized');
    score.score = 0;
    return score;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const stats = manifest.statistics || {};
    
    score.stats = stats;
    
    // Calculate organization score based on:
    // 1. Classification coverage (50%)
    // 2. Pending archive count (30%)
    // 3. Misplaced files (20%)
    
    let orgScore = 0;
    
    // Classification coverage (50 points max)
    const totalFiles = stats.total_files || 0;
    const classifiedFiles = (stats.by_tier?.CRITICAL || 0) +
                           (stats.by_tier?.PERMANENT || 0) +
                           (stats.by_tier?.EPHEMERAL || 0) +
                           (stats.by_tier?.ARCHIVED || 0);
    
    if (totalFiles > 0) {
      const coverage = classifiedFiles / totalFiles;
      orgScore += Math.round(coverage * 50);
      score.details.push(`Classified files: ${classifiedFiles}/${totalFiles} (${Math.round(coverage * 100)}%)`);
    } else {
      score.details.push('No files tracked yet');
    }
    
    // Pending archive (30 points max)
    // Fewer pending = better (inverse scoring)
    const pendingArchive = stats.pending_archive || 0;
    if (totalFiles > 0) {
      const pendingRatio = Math.min(pendingArchive / totalFiles, 1);
      orgScore += Math.round((1 - pendingRatio) * 30);
      
      if (pendingArchive > 0) {
        score.details.push(`Pending archive: ${pendingArchive} files`);
      }
    }
    
    // Misplaced files (20 points max)
    // Fewer misplaced = better (inverse scoring)
    const misplaced = stats.misplaced || 0;
    if (totalFiles > 0) {
      const misplacedRatio = Math.min(misplaced / totalFiles, 1);
      orgScore += Math.round((1 - misplacedRatio) * 20);
      
      if (misplaced > 0) {
        score.details.push(`Misplaced files: ${misplaced}`);
      }
    }
    
    score.score = Math.min(100, orgScore);
    
    // Add tier breakdown
    if (stats.by_tier) {
      score.details.push(
        `By tier: CRITICAL(${stats.by_tier.CRITICAL || 0}), ` +
        `PERMANENT(${stats.by_tier.PERMANENT || 0}), ` +
        `EPHEMERAL(${stats.by_tier.EPHEMERAL || 0}), ` +
        `ARCHIVED(${stats.by_tier.ARCHIVED || 0})`
      );
    }
    
  } catch (err) {
    score.details.push(`Error reading manifest: ${err.message}`);
    score.score = 0;
  }

  return score;
}

/**
 * Collect issues from all components
 * 
 * @param {Object} components - Health components
 * @returns {Object} Categorized issues
 */
function collectIssues(components) {
  const issues = {
    critical: [],
    warnings: []
  };

  // Structure issues
  if (components.structure.gaps?.critical) {
    issues.critical = issues.critical.concat(
      components.structure.gaps.critical.map(g => `Structure: ${g}`)
    );
  }
  if (components.structure.gaps?.important) {
    issues.warnings = issues.warnings.concat(
      components.structure.gaps.important.map(g => `Structure: ${g}`)
    );
  }

  // Hook issues
  if (components.hooks.score < 50) {
    issues.critical.push('Hooks: Missing or invalid hook files');
  } else if (components.hooks.score < 100) {
    issues.warnings.push('Hooks: Some hooks may need attention');
  }

  // Skill issues
  if (components.skills.score === 0) {
    issues.warnings.push('Skills: No skills configured');
  }

  // Config issues
  if (components.config.score < 50) {
    issues.critical.push('Config: metadata.json has critical issues');
  } else if (components.config.score < 100) {
    issues.warnings.push('Config: metadata.json has validation warnings');
  }

  // File Organization issues (NEW in v1.2.0)
  if (components.fileOrganization) {
    if (components.fileOrganization.score === 0) {
      issues.warnings.push('File Organization: File Lifecycle not initialized');
    } else if (components.fileOrganization.score < 50) {
      issues.warnings.push('File Organization: Many files need classification or archiving');
    }
  }

  return issues;
}

/**
 * Update project metadata with health score
 * 
 * @param {string} projectPath - Project path
 * @param {Object} health - Health score data
 * @returns {Promise<boolean>} Success status
 */
export async function updateProjectHealthMetadata(projectPath, health) {
  const metadataPath = path.join(projectPath, '.claude', 'metadata.json');

  if (!fs.existsSync(metadataPath)) {
    return false;
  }

  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    
    // Add or update health data (updated in v1.2.0 to include fileOrganization)
    metadata.health = {
      score: health.score,
      last_check: health.timestamp,
      components: {
        structure: health.components.structure.score,
        hooks: health.components.hooks.score,
        skills: health.components.skills.score,
        config: health.components.config.score,
        fileOrganization: health.components.fileOrganization?.score || 0 // NEW in v1.2.0
      }
    };

    // Write back
    fs.writeFileSync(
      metadataPath,
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    return true;
  } catch (err) {
    console.error(`Failed to update health metadata: ${err.message}`);
    return false;
  }
}

/**
 * Get project health score (quick version)
 * Returns just the score number from metadata if available
 * 
 * @param {string} projectPath - Project path
 * @returns {number|null} Health score or null if not available
 */
export function getProjectHealthScore(projectPath) {
  const metadataPath = path.join(projectPath, '.claude', 'metadata.json');

  if (!fs.existsSync(metadataPath)) {
    return null;
  }

  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    return metadata.health?.score || null;
  } catch (err) {
    return null;
  }
}

/**
 * Get health status category based on score
 * 
 * @param {number} score - Health score (0-100)
 * @returns {Object} Status category with label and indicator
 */
export function getHealthStatus(score) {
  if (score >= 85) {
    return { label: 'Healthy', indicator: '✓', color: 'green' };
  } else if (score >= 70) {
    return { label: 'Needs Attention', indicator: '⚠', color: 'yellow' };
  } else {
    return { label: 'Critical Issues', indicator: '✗', color: 'red' };
  }
}

