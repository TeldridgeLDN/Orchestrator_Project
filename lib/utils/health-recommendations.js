/**
 * Project Health Recommendations System
 * 
 * Defines common project health issues and their corresponding actionable recommendations.
 * This module provides the knowledge base for generating user-facing guidance to improve
 * project health scores.
 * 
 * @module utils/health-recommendations
 * @version 1.0.0
 */

/**
 * Issue Categories
 * @constant {Object}
 */
export const ISSUE_CATEGORIES = {
  STRUCTURE: 'structure',
  HOOKS: 'hooks',
  SKILLS: 'skills',
  CONFIG: 'config'
};

/**
 * Issue Severity Levels
 * @constant {Object}
 */
export const SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * Recommendation Database
 * Maps each possible issue to its corresponding actionable recommendation
 * 
 * Structure:
 * - id: Unique identifier for the issue
 * - category: Issue category (structure, hooks, skills, config)
 * - severity: How critical the issue is
 * - issue: User-friendly description of the problem
 * - recommendation: Clear, actionable steps to resolve the issue
 * - impact: Estimated health score improvement if resolved
 * - autoFixable: Whether this can be automatically fixed
 * - command: CLI command to fix (if autoFixable)
 * - learnMoreUrl: Optional documentation URL
 */
export const RECOMMENDATION_DATABASE = {
  
  // ==========================================
  // STRUCTURE ISSUES (40% weight)
  // ==========================================
  
  'struct-001': {
    id: 'struct-001',
    category: ISSUE_CATEGORIES.STRUCTURE,
    severity: SEVERITY.CRITICAL,
    issue: 'Missing .claude directory',
    recommendation: 'Initialize the diet103 structure by running: diet103 init',
    impact: 40,
    autoFixable: true,
    command: 'diet103 init',
    learnMoreUrl: '/docs/getting-started'
  },
  
  'struct-002': {
    id: 'struct-002',
    category: ISSUE_CATEGORIES.STRUCTURE,
    severity: SEVERITY.CRITICAL,
    issue: 'Missing .claude/hooks directory',
    recommendation: 'Create the hooks directory: mkdir -p .claude/hooks',
    impact: 15,
    autoFixable: true,
    command: 'mkdir -p .claude/hooks'
  },
  
  'struct-003': {
    id: 'struct-003',
    category: ISSUE_CATEGORIES.STRUCTURE,
    severity: SEVERITY.CRITICAL,
    issue: 'Missing .claude/skills directory',
    recommendation: 'Create the skills directory: mkdir -p .claude/skills',
    impact: 10,
    autoFixable: true,
    command: 'mkdir -p .claude/skills'
  },
  
  'struct-004': {
    id: 'struct-004',
    category: ISSUE_CATEGORIES.STRUCTURE,
    severity: SEVERITY.HIGH,
    issue: 'Missing .claude/prompts directory',
    recommendation: 'Create the prompts directory: mkdir -p .claude/prompts',
    impact: 5,
    autoFixable: true,
    command: 'mkdir -p .claude/prompts'
  },
  
  'struct-005': {
    id: 'struct-005',
    category: ISSUE_CATEGORIES.STRUCTURE,
    severity: SEVERITY.HIGH,
    issue: 'Missing .claude/templates directory',
    recommendation: 'Create the templates directory: mkdir -p .claude/templates',
    impact: 5,
    autoFixable: true,
    command: 'mkdir -p .claude/templates'
  },
  
  'struct-006': {
    id: 'struct-006',
    category: ISSUE_CATEGORIES.STRUCTURE,
    severity: SEVERITY.MEDIUM,
    issue: 'Missing .claude/docs directory',
    recommendation: 'Create the docs directory: mkdir -p .claude/docs',
    impact: 3,
    autoFixable: true,
    command: 'mkdir -p .claude/docs'
  },
  
  'struct-007': {
    id: 'struct-007',
    category: ISSUE_CATEGORIES.STRUCTURE,
    severity: SEVERITY.MEDIUM,
    issue: 'Missing .claude/context directory',
    recommendation: 'Create the context directory: mkdir -p .claude/context',
    impact: 2,
    autoFixable: true,
    command: 'mkdir -p .claude/context'
  },
  
  // ==========================================
  // HOOK ISSUES (30% weight)
  // ==========================================
  
  'hook-001': {
    id: 'hook-001',
    category: ISSUE_CATEGORIES.HOOKS,
    severity: SEVERITY.CRITICAL,
    issue: 'Missing UserPromptSubmit.js hook',
    recommendation: 'Create the UserPromptSubmit hook file. This hook runs before each user prompt is processed. Copy from template: cp lib/templates/hooks/UserPromptSubmit.js .claude/hooks/',
    impact: 15,
    autoFixable: true,
    command: 'cp lib/templates/hooks/UserPromptSubmit.js .claude/hooks/',
    learnMoreUrl: '/docs/hooks/user-prompt-submit'
  },
  
  'hook-002': {
    id: 'hook-002',
    category: ISSUE_CATEGORIES.HOOKS,
    severity: SEVERITY.CRITICAL,
    issue: 'Missing PostToolUse.js hook',
    recommendation: 'Create the PostToolUse hook file. This hook runs after each tool is executed. Copy from template: cp lib/templates/hooks/PostToolUse.js .claude/hooks/',
    impact: 15,
    autoFixable: true,
    command: 'cp lib/templates/hooks/PostToolUse.js .claude/hooks/',
    learnMoreUrl: '/docs/hooks/post-tool-use'
  },
  
  'hook-003': {
    id: 'hook-003',
    category: ISSUE_CATEGORIES.HOOKS,
    severity: SEVERITY.HIGH,
    issue: 'Invalid UserPromptSubmit.js hook',
    recommendation: 'The UserPromptSubmit.js hook exists but is invalid (empty, missing exports, or corrupted). Review and fix the file structure, or restore from template.',
    impact: 12,
    autoFixable: false,
    learnMoreUrl: '/docs/hooks/debugging'
  },
  
  'hook-004': {
    id: 'hook-004',
    category: ISSUE_CATEGORIES.HOOKS,
    severity: SEVERITY.HIGH,
    issue: 'Invalid PostToolUse.js hook',
    recommendation: 'The PostToolUse.js hook exists but is invalid (empty, missing exports, or corrupted). Review and fix the file structure, or restore from template.',
    impact: 12,
    autoFixable: false,
    learnMoreUrl: '/docs/hooks/debugging'
  },
  
  'hook-005': {
    id: 'hook-005',
    category: ISSUE_CATEGORIES.HOOKS,
    severity: SEVERITY.MEDIUM,
    issue: 'Hook file is suspiciously small',
    recommendation: 'One or more hook files are less than 100 bytes. They may be placeholder files. Review and implement proper hook logic.',
    impact: 5,
    autoFixable: false
  },
  
  // ==========================================
  // SKILL ISSUES (20% weight)
  // ==========================================
  
  'skill-001': {
    id: 'skill-001',
    category: ISSUE_CATEGORIES.SKILLS,
    severity: SEVERITY.MEDIUM,
    issue: 'Missing skill-rules.json',
    recommendation: 'Create skill-rules.json to define how skills are activated and used. Run: diet103 skills init',
    impact: 10,
    autoFixable: true,
    command: 'diet103 skills init',
    learnMoreUrl: '/docs/skills/configuration'
  },
  
  'skill-002': {
    id: 'skill-002',
    category: ISSUE_CATEGORIES.SKILLS,
    severity: SEVERITY.MEDIUM,
    issue: 'Invalid skill-rules.json',
    recommendation: 'The skill-rules.json file exists but contains invalid JSON. Validate and fix JSON syntax errors.',
    impact: 10,
    autoFixable: false
  },
  
  'skill-003': {
    id: 'skill-003',
    category: ISSUE_CATEGORIES.SKILLS,
    severity: SEVERITY.LOW,
    issue: 'No skill directories found',
    recommendation: 'No skills are configured in .claude/skills/. Consider creating skills to extend Claude\'s capabilities. Example: diet103 skill create my-skill',
    impact: 5,
    autoFixable: false,
    learnMoreUrl: '/docs/skills/creating'
  },
  
  'skill-004': {
    id: 'skill-004',
    category: ISSUE_CATEGORIES.SKILLS,
    severity: SEVERITY.LOW,
    issue: 'Empty skill-rules.json',
    recommendation: 'skill-rules.json exists but defines no skills. Add skill configurations or remove the empty file.',
    impact: 5,
    autoFixable: false
  },
  
  'skill-005': {
    id: 'skill-005',
    category: ISSUE_CATEGORIES.SKILLS,
    severity: SEVERITY.MEDIUM,
    issue: 'Mismatch between skill directories and skill-rules.json',
    recommendation: 'Some skill directories exist but are not defined in skill-rules.json, or vice versa. Synchronize your skill directories with skill-rules.json definitions.',
    impact: 7,
    autoFixable: false,
    learnMoreUrl: '/docs/skills/troubleshooting'
  },
  
  // ==========================================
  // CONFIGURATION ISSUES (10% weight)
  // ==========================================
  
  'config-001': {
    id: 'config-001',
    category: ISSUE_CATEGORIES.CONFIG,
    severity: SEVERITY.CRITICAL,
    issue: 'Missing metadata.json',
    recommendation: 'Create metadata.json file with project configuration. Run: diet103 init to generate a valid metadata file.',
    impact: 10,
    autoFixable: true,
    command: 'diet103 init',
    learnMoreUrl: '/docs/configuration/metadata'
  },
  
  'config-002': {
    id: 'config-002',
    category: ISSUE_CATEGORIES.CONFIG,
    severity: SEVERITY.HIGH,
    issue: 'Invalid metadata.json format',
    recommendation: 'The metadata.json file contains invalid JSON syntax. Fix JSON formatting errors.',
    impact: 8,
    autoFixable: false
  },
  
  'config-003': {
    id: 'config-003',
    category: ISSUE_CATEGORIES.CONFIG,
    severity: SEVERITY.HIGH,
    issue: 'Missing required field: project_id',
    recommendation: 'Add a unique project_id to metadata.json. This identifier is required for project tracking.',
    impact: 5,
    autoFixable: false
  },
  
  'config-004': {
    id: 'config-004',
    category: ISSUE_CATEGORIES.CONFIG,
    severity: SEVERITY.HIGH,
    issue: 'Missing required field: version',
    recommendation: 'Add a version field to metadata.json (e.g., "1.0.0"). This tracks your project version.',
    impact: 3,
    autoFixable: false
  },
  
  'config-005': {
    id: 'config-005',
    category: ISSUE_CATEGORIES.CONFIG,
    severity: SEVERITY.HIGH,
    issue: 'Missing required field: diet103_version',
    recommendation: 'Add diet103_version to metadata.json to specify which diet103 version your project uses.',
    impact: 2,
    autoFixable: false
  },
  
  'config-006': {
    id: 'config-006',
    category: ISSUE_CATEGORIES.CONFIG,
    severity: SEVERITY.MEDIUM,
    issue: 'Outdated diet103_version',
    recommendation: 'Your project specifies an older diet103 version. Consider updating to the latest version for new features and bug fixes.',
    impact: 2,
    autoFixable: false,
    learnMoreUrl: '/docs/upgrading'
  },
  
  'config-007': {
    id: 'config-007',
    category: ISSUE_CATEGORIES.CONFIG,
    severity: SEVERITY.LOW,
    issue: 'Missing optional field: name',
    recommendation: 'Consider adding a "name" field to metadata.json for better project identification.',
    impact: 1,
    autoFixable: false
  },
  
  'config-008': {
    id: 'config-008',
    category: ISSUE_CATEGORIES.CONFIG,
    severity: SEVERITY.LOW,
    issue: 'Missing optional field: description',
    recommendation: 'Consider adding a "description" field to metadata.json to document your project\'s purpose.',
    impact: 1,
    autoFixable: false
  },
  
  // ==========================================
  // COMPOSITE ISSUES (Multiple categories)
  // ==========================================
  
  'composite-001': {
    id: 'composite-001',
    category: 'general',
    severity: SEVERITY.CRITICAL,
    issue: 'Project appears to be uninitialized',
    recommendation: 'This project is missing critical diet103 infrastructure. Initialize the project structure: diet103 init',
    impact: 50,
    autoFixable: true,
    command: 'diet103 init'
  },
  
  'composite-002': {
    id: 'composite-002',
    category: 'general',
    severity: SEVERITY.MEDIUM,
    issue: 'Project has not been accessed recently',
    recommendation: 'This project hasn\'t been accessed in over 30 days. Consider archiving if no longer active, or run a health check to identify issues.',
    impact: 0,
    autoFixable: false
  },
  
  'composite-003': {
    id: 'composite-003',
    category: 'general',
    severity: SEVERITY.LOW,
    issue: 'Health check is stale',
    recommendation: 'Project health was last checked over 7 days ago. Run: diet103 health --update to refresh health status.',
    impact: 0,
    autoFixable: true,
    command: 'diet103 health --update'
  }
};

/**
 * Get recommendation by ID
 * 
 * @param {string} id - Recommendation ID
 * @returns {Object|null} Recommendation object or null if not found
 */
export function getRecommendation(id) {
  return RECOMMENDATION_DATABASE[id] || null;
}

/**
 * Get all recommendations for a category
 * 
 * @param {string} category - Category name
 * @returns {Array} Array of recommendation objects
 */
export function getRecommendationsByCategory(category) {
  return Object.values(RECOMMENDATION_DATABASE)
    .filter(rec => rec.category === category);
}

/**
 * Get all recommendations by severity
 * 
 * @param {string} severity - Severity level
 * @returns {Array} Array of recommendation objects
 */
export function getRecommendationsBySeverity(severity) {
  return Object.values(RECOMMENDATION_DATABASE)
    .filter(rec => rec.severity === severity);
}

/**
 * Get all auto-fixable recommendations
 * 
 * @returns {Array} Array of recommendation objects that can be auto-fixed
 */
export function getAutoFixableRecommendations() {
  return Object.values(RECOMMENDATION_DATABASE)
    .filter(rec => rec.autoFixable);
}

/**
 * Calculate total potential health improvement
 * 
 * @param {Array<string>} recommendationIds - Array of recommendation IDs
 * @returns {number} Total potential health score improvement
 */
export function calculatePotentialImprovement(recommendationIds) {
  return recommendationIds.reduce((total, id) => {
    const rec = getRecommendation(id);
    return total + (rec ? rec.impact : 0);
  }, 0);
}

/**
 * Sort recommendations by priority
 * Priority order: severity first, then impact
 * 
 * @param {Array} recommendations - Array of recommendation objects
 * @returns {Array} Sorted recommendations
 */
export function sortRecommendationsByPriority(recommendations) {
  const severityOrder = {
    [SEVERITY.CRITICAL]: 0,
    [SEVERITY.HIGH]: 1,
    [SEVERITY.MEDIUM]: 2,
    [SEVERITY.LOW]: 3
  };
  
  return [...recommendations].sort((a, b) => {
    // First sort by severity
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }
    
    // Then by impact (higher impact first)
    return b.impact - a.impact;
  });
}

/**
 * Format recommendation for display
 * 
 * @param {Object} recommendation - Recommendation object
 * @param {Object} options - Formatting options
 * @returns {string} Formatted recommendation text
 */
export function formatRecommendation(recommendation, options = {}) {
  const { includeImpact = true, includeCommand = true, includeLearnMore = true } = options;
  
  let output = [];
  
  // Severity indicator
  const severityIcon = {
    [SEVERITY.CRITICAL]: '🔴',
    [SEVERITY.HIGH]: '🟠',
    [SEVERITY.MEDIUM]: '🟡',
    [SEVERITY.LOW]: '🔵'
  };
  
  output.push(`${severityIcon[recommendation.severity]} ${recommendation.issue}`);
  output.push(`   ${recommendation.recommendation}`);
  
  if (includeImpact && recommendation.impact > 0) {
    output.push(`   Impact: +${recommendation.impact} health points`);
  }
  
  if (includeCommand && recommendation.autoFixable && recommendation.command) {
    output.push(`   Quick fix: ${recommendation.command}`);
  }
  
  if (includeLearnMore && recommendation.learnMoreUrl) {
    output.push(`   Learn more: ${recommendation.learnMoreUrl}`);
  }
  
  return output.join('\n');
}

/**
 * Generate recommendation summary statistics
 * 
 * @param {Array} recommendations - Array of recommendation objects
 * @returns {Object} Summary statistics
 */
export function getRecommendationSummary(recommendations) {
  const summary = {
    total: recommendations.length,
    bySeverity: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    },
    byCategory: {
      structure: 0,
      hooks: 0,
      skills: 0,
      config: 0,
      general: 0
    },
    autoFixable: 0,
    totalImpact: 0
  };
  
  recommendations.forEach(rec => {
    summary.bySeverity[rec.severity]++;
    summary.byCategory[rec.category]++;
    if (rec.autoFixable) {
      summary.autoFixable++;
    }
    summary.totalImpact += rec.impact;
  });
  
  return summary;
}

