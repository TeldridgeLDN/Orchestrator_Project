/**
 * Project Health Issue Detector
 * 
 * Analyzes project health components and identifies specific issues
 * that map to recommendations in the health-recommendations database.
 * 
 * @module utils/health-issue-detector
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import {
  detectDiet103Infrastructure,
  analyzeDiet103Gaps,
  validateMetadataJson
} from './diet103-validator.js';
import { ISSUE_CATEGORIES, SEVERITY } from './health-recommendations.js';

/**
 * Detected Issue Object Structure
 * @typedef {Object} DetectedIssue
 * @property {string} id - Recommendation ID from database
 * @property {string} category - Issue category
 * @property {string} severity - Severity level
 * @property {string} issue - Issue description
 * @property {number} impact - Health impact
 * @property {Object} context - Additional context data
 */

/**
 * Detect all project health issues
 * Main entry point that runs all detection functions
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Array<DetectedIssue>>} Array of detected issues
 */
export async function detectAllIssues(projectPath) {
  const allIssues = [];
  
  // Run all detectors
  const structureIssues = await detectStructureIssues(projectPath);
  const hookIssues = await detectHookIssues(projectPath);
  const skillIssues = await detectSkillIssues(projectPath);
  const configIssues = await detectConfigIssues(projectPath);
  const compositeIssues = await detectCompositeIssues(projectPath);
  
  // Combine all issues
  allIssues.push(
    ...structureIssues,
    ...hookIssues,
    ...skillIssues,
    ...configIssues,
    ...compositeIssues
  );
  
  return allIssues;
}

/**
 * Detect structure-related issues
 * Checks for missing critical and important directories
 * 
 * @param {string} projectPath - Project path
 * @returns {Promise<Array<DetectedIssue>>} Detected structure issues
 */
export async function detectStructureIssues(projectPath) {
  const issues = [];
  
  try {
    const checks = await detectDiet103Infrastructure(projectPath);
    const gaps = analyzeDiet103Gaps(checks);
    
    // Check for missing .claude directory (most critical)
    if (!checks.claudeDir) {
      issues.push({
        id: 'struct-001',
        category: ISSUE_CATEGORIES.STRUCTURE,
        severity: SEVERITY.CRITICAL,
        impact: 40,
        context: { missing: '.claude' }
      });
      
      // If .claude doesn't exist, likely nothing else does either
      // Don't spam with all the other missing directory issues
      return issues;
    }
    
    // Check specific critical directories
    if (gaps.critical.includes('hooks')) {
      issues.push({
        id: 'struct-002',
        category: ISSUE_CATEGORIES.STRUCTURE,
        severity: SEVERITY.CRITICAL,
        impact: 15,
        context: { missing: '.claude/hooks' }
      });
    }
    
    if (gaps.critical.includes('skills')) {
      issues.push({
        id: 'struct-003',
        category: ISSUE_CATEGORIES.STRUCTURE,
        severity: SEVERITY.CRITICAL,
        impact: 10,
        context: { missing: '.claude/skills' }
      });
    }
    
    // Check important directories
    if (gaps.important.includes('prompts')) {
      issues.push({
        id: 'struct-004',
        category: ISSUE_CATEGORIES.STRUCTURE,
        severity: SEVERITY.HIGH,
        impact: 5,
        context: { missing: '.claude/prompts' }
      });
    }
    
    if (gaps.important.includes('templates')) {
      issues.push({
        id: 'struct-005',
        category: ISSUE_CATEGORIES.STRUCTURE,
        severity: SEVERITY.HIGH,
        impact: 5,
        context: { missing: '.claude/templates' }
      });
    }
    
    if (gaps.important.includes('docs')) {
      issues.push({
        id: 'struct-006',
        category: ISSUE_CATEGORIES.STRUCTURE,
        severity: SEVERITY.MEDIUM,
        impact: 3,
        context: { missing: '.claude/docs' }
      });
    }
    
    if (gaps.important.includes('context')) {
      issues.push({
        id: 'struct-007',
        category: ISSUE_CATEGORIES.STRUCTURE,
        severity: SEVERITY.MEDIUM,
        impact: 2,
        context: { missing: '.claude/context' }
      });
    }
    
  } catch (error) {
    // If detection fails completely, assume uninitialized project
    issues.push({
      id: 'struct-001',
      category: ISSUE_CATEGORIES.STRUCTURE,
      severity: SEVERITY.CRITICAL,
      impact: 40,
      context: { error: error.message }
    });
  }
  
  return issues;
}

/**
 * Detect hook-related issues
 * Checks for missing or invalid hook files
 * 
 * @param {string} projectPath - Project path
 * @returns {Promise<Array<DetectedIssue>>} Detected hook issues
 */
export async function detectHookIssues(projectPath) {
  const issues = [];
  const hooksDir = path.join(projectPath, '.claude', 'hooks');
  
  // If hooks directory doesn't exist, this is caught by structure detection
  if (!fs.existsSync(hooksDir)) {
    return issues;
  }
  
  // Check UserPromptSubmit.js
  const userPromptPath = path.join(hooksDir, 'UserPromptSubmit.js');
  const userPromptExists = fs.existsSync(userPromptPath);
  
  if (!userPromptExists) {
    issues.push({
      id: 'hook-001',
      category: ISSUE_CATEGORIES.HOOKS,
      severity: SEVERITY.CRITICAL,
      impact: 15,
      context: { missing: 'UserPromptSubmit.js' }
    });
  } else {
    // Check validity
    const isValid = await isValidHookFile(userPromptPath);
    if (!isValid.valid) {
      issues.push({
        id: 'hook-003',
        category: ISSUE_CATEGORIES.HOOKS,
        severity: SEVERITY.HIGH,
        impact: 12,
        context: { 
          file: 'UserPromptSubmit.js',
          reason: isValid.reason 
        }
      });
    } else if (isValid.size < 100) {
      issues.push({
        id: 'hook-005',
        category: ISSUE_CATEGORIES.HOOKS,
        severity: SEVERITY.MEDIUM,
        impact: 5,
        context: { 
          file: 'UserPromptSubmit.js',
          size: isValid.size
        }
      });
    }
  }
  
  // Check PostToolUse.js
  const postToolPath = path.join(hooksDir, 'PostToolUse.js');
  const postToolExists = fs.existsSync(postToolPath);
  
  if (!postToolExists) {
    issues.push({
      id: 'hook-002',
      category: ISSUE_CATEGORIES.HOOKS,
      severity: SEVERITY.CRITICAL,
      impact: 15,
      context: { missing: 'PostToolUse.js' }
    });
  } else {
    // Check validity
    const isValid = await isValidHookFile(postToolPath);
    if (!isValid.valid) {
      issues.push({
        id: 'hook-004',
        category: ISSUE_CATEGORIES.HOOKS,
        severity: SEVERITY.HIGH,
        impact: 12,
        context: { 
          file: 'PostToolUse.js',
          reason: isValid.reason 
        }
      });
    } else if (isValid.size < 100) {
      issues.push({
        id: 'hook-005',
        category: ISSUE_CATEGORIES.HOOKS,
        severity: SEVERITY.MEDIUM,
        impact: 5,
        context: { 
          file: 'PostToolUse.js',
          size: isValid.size
        }
      });
    }
  }
  
  return issues;
}

/**
 * Validate a hook file
 * Checks for proper structure and exports
 * 
 * @param {string} hookPath - Path to hook file
 * @returns {Promise<Object>} Validation result
 */
async function isValidHookFile(hookPath) {
  try {
    const stat = fs.statSync(hookPath);
    const content = fs.readFileSync(hookPath, 'utf-8');
    
    // Basic validity checks
    const hasExport = content.includes('export') || content.includes('module.exports');
    const hasFunction = content.includes('function') || content.includes('=>');
    
    if (!hasExport) {
      return { valid: false, reason: 'No exports found', size: stat.size };
    }
    
    if (!hasFunction) {
      return { valid: false, reason: 'No function definition found', size: stat.size };
    }
    
    if (stat.size === 0) {
      return { valid: false, reason: 'File is empty', size: 0 };
    }
    
    return { valid: true, size: stat.size };
    
  } catch (error) {
    return { valid: false, reason: error.message, size: 0 };
  }
}

/**
 * Detect skill-related issues
 * Checks for skill configuration and directory synchronization
 * 
 * @param {string} projectPath - Project path
 * @returns {Promise<Array<DetectedIssue>>} Detected skill issues
 */
export async function detectSkillIssues(projectPath) {
  const issues = [];
  const skillsDir = path.join(projectPath, '.claude', 'skills');
  const skillRulesPath = path.join(projectPath, '.claude', 'skill-rules.json');
  
  // If skills directory doesn't exist, this is caught by structure detection
  if (!fs.existsSync(skillsDir)) {
    return issues;
  }
  
  // Check for skill-rules.json
  if (!fs.existsSync(skillRulesPath)) {
    issues.push({
      id: 'skill-001',
      category: ISSUE_CATEGORIES.SKILLS,
      severity: SEVERITY.MEDIUM,
      impact: 10,
      context: { missing: 'skill-rules.json' }
    });
  } else {
    // Validate skill-rules.json
    try {
      const skillRulesContent = fs.readFileSync(skillRulesPath, 'utf-8');
      const skillRules = JSON.parse(skillRulesContent);
      
      // Check if empty
      if (Object.keys(skillRules).length === 0) {
        issues.push({
          id: 'skill-004',
          category: ISSUE_CATEGORIES.SKILLS,
          severity: SEVERITY.LOW,
          impact: 5,
          context: { empty: true }
        });
      }
      
      // Check synchronization with skill directories
      const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
        .filter(e => e.isDirectory() && !e.name.startsWith('.'))
        .map(e => e.name);
      
      const definedSkills = Object.keys(skillRules);
      
      // Check for mismatch
      const dirsNotInRules = skillDirs.filter(dir => !definedSkills.includes(dir));
      const rulesNotInDirs = definedSkills.filter(skill => !skillDirs.includes(skill));
      
      if (dirsNotInRules.length > 0 || rulesNotInDirs.length > 0) {
        issues.push({
          id: 'skill-005',
          category: ISSUE_CATEGORIES.SKILLS,
          severity: SEVERITY.MEDIUM,
          impact: 7,
          context: { 
            dirsNotInRules,
            rulesNotInDirs
          }
        });
      }
      
    } catch (error) {
      // Invalid JSON
      issues.push({
        id: 'skill-002',
        category: ISSUE_CATEGORIES.SKILLS,
        severity: SEVERITY.MEDIUM,
        impact: 10,
        context: { error: error.message }
      });
    }
  }
  
  // Check for skill directories
  try {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    const skillDirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));
    
    if (skillDirs.length === 0) {
      issues.push({
        id: 'skill-003',
        category: ISSUE_CATEGORIES.SKILLS,
        severity: SEVERITY.LOW,
        impact: 5,
        context: { count: 0 }
      });
    }
  } catch (error) {
    // Can't read skills directory
  }
  
  return issues;
}

/**
 * Detect configuration-related issues
 * Checks metadata.json validity and completeness
 * 
 * @param {string} projectPath - Project path
 * @returns {Promise<Array<DetectedIssue>>} Detected config issues
 */
export async function detectConfigIssues(projectPath) {
  const issues = [];
  const metadataPath = path.join(projectPath, '.claude', 'metadata.json');
  
  // Check if metadata.json exists
  if (!fs.existsSync(metadataPath)) {
    issues.push({
      id: 'config-001',
      category: ISSUE_CATEGORIES.CONFIG,
      severity: SEVERITY.CRITICAL,
      impact: 10,
      context: { missing: 'metadata.json' }
    });
    return issues;
  }
  
  try {
    // Try to parse JSON
    const content = fs.readFileSync(metadataPath, 'utf-8');
    const metadata = JSON.parse(content);
    
    // Check required fields
    if (!metadata.project_id) {
      issues.push({
        id: 'config-003',
        category: ISSUE_CATEGORIES.CONFIG,
        severity: SEVERITY.HIGH,
        impact: 5,
        context: { field: 'project_id' }
      });
    }
    
    if (!metadata.version) {
      issues.push({
        id: 'config-004',
        category: ISSUE_CATEGORIES.CONFIG,
        severity: SEVERITY.HIGH,
        impact: 3,
        context: { field: 'version' }
      });
    }
    
    if (!metadata.diet103_version) {
      issues.push({
        id: 'config-005',
        category: ISSUE_CATEGORIES.CONFIG,
        severity: SEVERITY.HIGH,
        impact: 2,
        context: { field: 'diet103_version' }
      });
    }
    
    // Check optional fields
    if (!metadata.name) {
      issues.push({
        id: 'config-007',
        category: ISSUE_CATEGORIES.CONFIG,
        severity: SEVERITY.LOW,
        impact: 1,
        context: { field: 'name' }
      });
    }
    
    if (!metadata.description) {
      issues.push({
        id: 'config-008',
        category: ISSUE_CATEGORIES.CONFIG,
        severity: SEVERITY.LOW,
        impact: 1,
        context: { field: 'description' }
      });
    }
    
    // Check for outdated diet103_version
    if (metadata.diet103_version) {
      const currentVersion = '1.0.3'; // This should be read from package.json ideally
      if (compareVersions(metadata.diet103_version, currentVersion) < 0) {
        issues.push({
          id: 'config-006',
          category: ISSUE_CATEGORIES.CONFIG,
          severity: SEVERITY.MEDIUM,
          impact: 2,
          context: { 
            current: metadata.diet103_version,
            latest: currentVersion
          }
        });
      }
    }
    
  } catch (error) {
    // Invalid JSON format
    issues.push({
      id: 'config-002',
      category: ISSUE_CATEGORIES.CONFIG,
      severity: SEVERITY.HIGH,
      impact: 8,
      context: { error: error.message }
    });
  }
  
  return issues;
}

/**
 * Detect composite/cross-cutting issues
 * Issues that span multiple categories or are general in nature
 * 
 * @param {string} projectPath - Project path
 * @returns {Promise<Array<DetectedIssue>>} Detected composite issues
 */
export async function detectCompositeIssues(projectPath) {
  const issues = [];
  
  // Check if project appears uninitialized
  const claudeDir = path.join(projectPath, '.claude');
  if (!fs.existsSync(claudeDir)) {
    issues.push({
      id: 'composite-001',
      category: 'general',
      severity: SEVERITY.CRITICAL,
      impact: 50,
      context: { uninitialized: true }
    });
    return issues; // No point checking other composite issues
  }
  
  // Check timestamp issues (if metadata exists)
  const metadataPath = path.join(claudeDir, 'metadata.json');
  if (fs.existsSync(metadataPath)) {
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      
      // Check if project is stale (not accessed recently)
      if (metadata.timestamps?.lastAccessedAt) {
        const lastAccessed = new Date(metadata.timestamps.lastAccessedAt);
        const daysSinceAccess = (new Date() - lastAccessed) / (1000 * 60 * 60 * 24);
        
        if (daysSinceAccess > 30) {
          issues.push({
            id: 'composite-002',
            category: 'general',
            severity: SEVERITY.MEDIUM,
            impact: 0,
            context: { 
              daysSinceAccess: Math.round(daysSinceAccess),
              lastAccessedAt: metadata.timestamps.lastAccessedAt
            }
          });
        }
      }
      
      // Check if health check is stale
      if (metadata.health?.last_check) {
        const lastCheck = new Date(metadata.health.last_check);
        const daysSinceCheck = (new Date() - lastCheck) / (1000 * 60 * 60 * 24);
        
        if (daysSinceCheck > 7) {
          issues.push({
            id: 'composite-003',
            category: 'general',
            severity: SEVERITY.LOW,
            impact: 0,
            context: { 
              daysSinceCheck: Math.round(daysSinceCheck),
              lastCheck: metadata.health.last_check
            }
          });
        }
      }
      
    } catch (error) {
      // Metadata parsing failed, but this is caught in config detection
    }
  }
  
  return issues;
}

/**
 * Compare semantic versions
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 * 
 * @param {string} v1 - First version string
 * @param {string} v2 - Second version string
 * @returns {number} Comparison result
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  
  return 0;
}

/**
 * Get issues by category
 * 
 * @param {Array<DetectedIssue>} issues - Array of detected issues
 * @param {string} category - Category to filter by
 * @returns {Array<DetectedIssue>} Filtered issues
 */
export function getIssuesByCategory(issues, category) {
  return issues.filter(issue => issue.category === category);
}

/**
 * Get issues by severity
 * 
 * @param {Array<DetectedIssue>} issues - Array of detected issues
 * @param {string} severity - Severity to filter by
 * @returns {Array<DetectedIssue>} Filtered issues
 */
export function getIssuesBySeverity(issues, severity) {
  return issues.filter(issue => issue.severity === severity);
}

/**
 * Calculate total health impact of issues
 * 
 * @param {Array<DetectedIssue>} issues - Array of detected issues
 * @returns {number} Total impact score
 */
export function calculateTotalImpact(issues) {
  return issues.reduce((total, issue) => total + issue.impact, 0);
}

