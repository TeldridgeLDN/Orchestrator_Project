/**
 * Project Health Recommendation Generator
 * 
 * Maps detected health issues to actionable user-facing recommendations.
 * Combines issue detection with the recommendation database to produce
 * clear, prioritized guidance for improving project health.
 * 
 * @module utils/health-recommendation-generator
 * @version 1.0.0
 */

import { 
  RECOMMENDATION_DATABASE,
  getRecommendation,
  sortRecommendationsByPriority,
  calculatePotentialImprovement as calculatePotentialImpact,
  formatRecommendation,
  getRecommendationSummary
} from './health-recommendations.js';

import {
  detectAllIssues,
  getIssuesByCategory,
  getIssuesBySeverity,
  calculateTotalImpact
} from './health-issue-detector.js';

/**
 * Full Recommendation Object (extends base recommendation with detection context)
 * @typedef {Object} FullRecommendation
 * @property {string} id - Recommendation ID
 * @property {string} category - Issue category
 * @property {string} severity - Severity level
 * @property {string} issue - Issue description
 * @property {string} recommendation - Actionable recommendation
 * @property {number} impact - Health score impact
 * @property {boolean} autoFixable - Can be auto-fixed
 * @property {string} [command] - CLI command for auto-fix
 * @property {string} [learnMoreUrl] - Documentation URL
 * @property {Object} context - Detection-specific context
 */

/**
 * Generate all recommendations for a project
 * Main entry point that detects issues and maps them to recommendations
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {Object} options - Generation options
 * @param {boolean} options.includeContext - Include detection context in output
 * @param {number} options.maxRecommendations - Maximum number of recommendations to return
 * @param {string[]} options.severityFilter - Filter by severity levels
 * @param {string[]} options.categoryFilter - Filter by categories
 * @returns {Promise<Object>} Recommendations object
 */
export async function generateRecommendations(projectPath, options = {}) {
  const {
    includeContext = true,
    maxRecommendations = Infinity,
    severityFilter = null,
    categoryFilter = null
  } = options;
  
  // Detect all issues
  const detectedIssues = await detectAllIssues(projectPath);
  
  // Map issues to recommendations
  let recommendations = mapIssuesToRecommendations(detectedIssues, includeContext);
  
  // Apply filters if specified
  if (severityFilter && severityFilter.length > 0) {
    recommendations = recommendations.filter(rec => 
      severityFilter.includes(rec.severity)
    );
  }
  
  if (categoryFilter && categoryFilter.length > 0) {
    recommendations = recommendations.filter(rec => 
      categoryFilter.includes(rec.category)
    );
  }
  
  // Sort by priority (severity first, then impact)
  recommendations = sortRecommendationsByPriority(recommendations);
  
  // Limit if specified
  if (maxRecommendations < Infinity) {
    recommendations = recommendations.slice(0, maxRecommendations);
  }
  
  // Generate summary
  const summary = getRecommendationSummary(recommendations);
  
  // Calculate potential improvement
  const potentialImprovement = calculateTotalImpact(detectedIssues);
  
  return {
    recommendations,
    summary,
    potentialImprovement,
    totalIssues: detectedIssues.length,
    timestamp: new Date().toISOString()
  };
}

/**
 * Map detected issues to full recommendation objects
 * 
 * @param {Array} detectedIssues - Array of detected issues
 * @param {boolean} includeContext - Whether to include detection context
 * @returns {Array<FullRecommendation>} Array of full recommendations
 */
export function mapIssuesToRecommendations(detectedIssues, includeContext = true) {
  return detectedIssues.map(issue => {
    // Get base recommendation from database
    const baseRecommendation = getRecommendation(issue.id);
    
    if (!baseRecommendation) {
      // Fallback for unknown issue IDs
      return {
        id: issue.id,
        category: issue.category,
        severity: issue.severity,
        issue: 'Unknown issue detected',
        recommendation: 'Please report this to the diet103 team',
        impact: issue.impact,
        autoFixable: false,
        context: includeContext ? issue.context : undefined
      };
    }
    
    // Merge base recommendation with detection context
    const fullRecommendation = {
      ...baseRecommendation,
      context: includeContext ? issue.context : undefined
    };
    
    // Enhance recommendation text with context if available
    if (includeContext && issue.context) {
      fullRecommendation.enhancedIssue = enhanceIssueDescription(
        baseRecommendation.issue,
        issue.context
      );
      fullRecommendation.enhancedRecommendation = enhanceRecommendationText(
        baseRecommendation.recommendation,
        issue.context
      );
    }
    
    return fullRecommendation;
  });
}

/**
 * Enhance issue description with specific context
 * 
 * @param {string} baseIssue - Base issue description
 * @param {Object} context - Detection context
 * @returns {string} Enhanced issue description
 */
function enhanceIssueDescription(baseIssue, context) {
  if (context.missing) {
    return `${baseIssue}: ${context.missing}`;
  }
  
  if (context.file) {
    return `${baseIssue}: ${context.file}${context.reason ? ` (${context.reason})` : ''}`;
  }
  
  if (context.field) {
    return `${baseIssue}: ${context.field}`;
  }
  
  if (context.empty !== undefined) {
    return `${baseIssue} (file exists but is empty)`;
  }
  
  if (context.dirsNotInRules || context.rulesNotInDirs) {
    const parts = [];
    if (context.dirsNotInRules && context.dirsNotInRules.length > 0) {
      parts.push(`Directories not in rules: ${context.dirsNotInRules.join(', ')}`);
    }
    if (context.rulesNotInDirs && context.rulesNotInDirs.length > 0) {
      parts.push(`Rules without directories: ${context.rulesNotInDirs.join(', ')}`);
    }
    return `${baseIssue}: ${parts.join('; ')}`;
  }
  
  if (context.daysSinceAccess !== undefined) {
    return `${baseIssue} (${context.daysSinceAccess} days)`;
  }
  
  if (context.daysSinceCheck !== undefined) {
    return `${baseIssue} (${context.daysSinceCheck} days ago)`;
  }
  
  if (context.current && context.latest) {
    return `${baseIssue}: Current ${context.current}, Latest ${context.latest}`;
  }
  
  return baseIssue;
}

/**
 * Enhance recommendation text with specific context
 * 
 * @param {string} baseRec - Base recommendation text
 * @param {Object} context - Detection context
 * @returns {string} Enhanced recommendation text
 */
function enhanceRecommendationText(baseRec, context) {
  // For most recommendations, the base text is sufficient
  // Context is available separately for display
  return baseRec;
}

/**
 * Get recommendations by category
 * 
 * @param {string} projectPath - Project path
 * @param {string} category - Category to filter by
 * @returns {Promise<Array<FullRecommendation>>} Filtered recommendations
 */
export async function getRecommendationsByCategory(projectPath, category) {
  const result = await generateRecommendations(projectPath, {
    categoryFilter: [category]
  });
  return result.recommendations;
}

/**
 * Get recommendations by severity
 * 
 * @param {string} projectPath - Project path
 * @param {string} severity - Severity to filter by
 * @returns {Promise<Array<FullRecommendation>>} Filtered recommendations
 */
export async function getRecommendationsBySeverity(projectPath, severity) {
  const result = await generateRecommendations(projectPath, {
    severityFilter: [severity]
  });
  return result.recommendations;
}

/**
 * Get only critical recommendations
 * 
 * @param {string} projectPath - Project path
 * @returns {Promise<Array<FullRecommendation>>} Critical recommendations
 */
export async function getCriticalRecommendations(projectPath) {
  return getRecommendationsBySeverity(projectPath, 'critical');
}

/**
 * Get only auto-fixable recommendations
 * 
 * @param {string} projectPath - Project path
 * @returns {Promise<Array<FullRecommendation>>} Auto-fixable recommendations
 */
export async function getAutoFixableRecommendations(projectPath) {
  const result = await generateRecommendations(projectPath);
  return result.recommendations.filter(rec => rec.autoFixable);
}

/**
 * Format recommendations for display
 * 
 * @param {Array<FullRecommendation>} recommendations - Recommendations to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted output
 */
export function formatRecommendationsForDisplay(recommendations, options = {}) {
  const {
    includeImpact = true,
    includeCommand = true,
    includeLearnMore = false,
    numbered = true,
    groupByCategory = false
  } = options;
  
  if (recommendations.length === 0) {
    return '✅ No recommendations - Your project health is excellent!';
  }
  
  let output = [];
  
  if (groupByCategory) {
    // Group by category
    const grouped = {};
    recommendations.forEach(rec => {
      if (!grouped[rec.category]) {
        grouped[rec.category] = [];
      }
      grouped[rec.category].push(rec);
    });
    
    // Format each category
    Object.entries(grouped).forEach(([category, recs]) => {
      output.push(`\n📁 ${category.toUpperCase()}`);
      output.push('─'.repeat(50));
      
      recs.forEach((rec, index) => {
        const formattedRec = formatSingleRecommendation(rec, {
          includeImpact,
          includeCommand,
          includeLearnMore,
          number: index + 1
        });
        output.push(formattedRec);
        output.push(''); // Blank line between recommendations
      });
    });
  } else {
    // Linear list
    recommendations.forEach((rec, index) => {
      const formattedRec = formatSingleRecommendation(rec, {
        includeImpact,
        includeCommand,
        includeLearnMore,
        number: numbered ? index + 1 : null
      });
      output.push(formattedRec);
      output.push(''); // Blank line between recommendations
    });
  }
  
  return output.join('\n');
}

/**
 * Format a single recommendation
 * 
 * @param {FullRecommendation} rec - Recommendation to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted recommendation
 */
function formatSingleRecommendation(rec, options = {}) {
  const {
    includeImpact = true,
    includeCommand = true,
    includeLearnMore = false,
    number = null
  } = options;
  
  const severityIcon = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🔵'
  };
  
  let lines = [];
  
  // Header with number and severity
  const prefix = number ? `${number}. ` : '';
  const issue = rec.enhancedIssue || rec.issue;
  lines.push(`${prefix}${severityIcon[rec.severity]} ${issue}`);
  
  // Recommendation text
  const recommendation = rec.enhancedRecommendation || rec.recommendation;
  lines.push(`   💡 ${recommendation}`);
  
  // Impact
  if (includeImpact && rec.impact > 0) {
    lines.push(`   📈 Impact: +${rec.impact} health points`);
  }
  
  // Command for auto-fixable
  if (includeCommand && rec.autoFixable && rec.command) {
    lines.push(`   ⚡ Quick fix: ${rec.command}`);
  }
  
  // Learn more
  if (includeLearnMore && rec.learnMoreUrl) {
    lines.push(`   📚 Learn more: ${rec.learnMoreUrl}`);
  }
  
  return lines.join('\n');
}

/**
 * Generate summary report
 * 
 * @param {Object} recommendationResult - Result from generateRecommendations
 * @returns {string} Formatted summary
 */
export function generateSummaryReport(recommendationResult) {
  const { summary, potentialImprovement, totalIssues } = recommendationResult;
  
  const lines = [];
  
  lines.push('📊 HEALTH RECOMMENDATIONS SUMMARY');
  lines.push('═'.repeat(50));
  lines.push('');
  
  lines.push(`Total Issues Found: ${totalIssues}`);
  lines.push(`Potential Health Improvement: +${potentialImprovement} points`);
  lines.push('');
  
  lines.push('By Severity:');
  lines.push(`  🔴 Critical: ${summary.bySeverity.critical}`);
  lines.push(`  🟠 High: ${summary.bySeverity.high}`);
  lines.push(`  🟡 Medium: ${summary.bySeverity.medium}`);
  lines.push(`  🔵 Low: ${summary.bySeverity.low}`);
  lines.push('');
  
  lines.push('By Category:');
  lines.push(`  📁 Structure: ${summary.byCategory.structure}`);
  lines.push(`  🔗 Hooks: ${summary.byCategory.hooks}`);
  lines.push(`  ⚡ Skills: ${summary.byCategory.skills}`);
  lines.push(`  ⚙️  Config: ${summary.byCategory.config}`);
  if (summary.byCategory.general > 0) {
    lines.push(`  📋 General: ${summary.byCategory.general}`);
  }
  lines.push('');
  
  lines.push(`Auto-fixable Issues: ${summary.autoFixable}/${summary.total}`);
  
  return lines.join('\n');
}

/**
 * Generate quick action list
 * Shows only the most critical/impactful recommendations
 * 
 * @param {string} projectPath - Project path
 * @param {number} limit - Maximum number of recommendations
 * @returns {Promise<string>} Formatted quick action list
 */
export async function generateQuickActionList(projectPath, limit = 5) {
  const result = await generateRecommendations(projectPath, {
    maxRecommendations: limit
  });
  
  const lines = [];
  lines.push('⚡ TOP PRIORITY ACTIONS');
  lines.push('═'.repeat(50));
  lines.push('');
  
  if (result.recommendations.length === 0) {
    lines.push('✅ No critical actions needed!');
    return lines.join('\n');
  }
  
  result.recommendations.forEach((rec, index) => {
    const issue = rec.enhancedIssue || rec.issue;
    const recommendation = rec.enhancedRecommendation || rec.recommendation;
    
    lines.push(`${index + 1}. ${issue}`);
    lines.push(`   ${recommendation}`);
    
    if (rec.autoFixable && rec.command) {
      lines.push(`   → ${rec.command}`);
    }
    lines.push('');
  });
  
  return lines.join('\n');
}

