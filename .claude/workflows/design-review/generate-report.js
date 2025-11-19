/**
 * Report Generation Module
 * 
 * Generates comprehensive markdown reports for design review results
 * 
 * @module generate-report
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Generate design review report
 * @param {Object} context - Workflow context
 * @param {Array} affectedComponents - Components reviewed
 * @param {Object} screenshots - Screenshot results
 * @param {Object} accessibilityResults - Accessibility audit results
 * @param {Object} visualDiffs - Visual diff results
 * @param {Object} designIssues - Design consistency results
 * @returns {Promise<string>} Path to generated report
 */
export async function generateReport(context, {
  affectedComponents,
  screenshots,
  accessibilityResults,
  visualDiffs,
  designIssues
}) {
  context.log('📝 Generating report...');

  const timestamp = new Date().toISOString();
  const reportId = Date.now();
  const reportDir = path.join(context.projectRoot, '.claude/reports/design-review');
  await fs.mkdir(reportDir, { recursive: true });
  
  const reportPath = path.join(reportDir, `review-${reportId}.md`);

  // Calculate overall status
  const hasErrors = 
    (accessibilityResults?.summary?.criticalViolations > 0) ||
    (visualDiffs?.summary?.changed > 0);
  
  const hasWarnings =
    (accessibilityResults?.summary?.totalViolations > 0) ||
    (designIssues?.summary?.totalIssues > 0);

  const status = hasErrors ? '❌ Failed' : hasWarnings ? '⚠️  Warnings' : '✅ Passed';

  // Generate report content
  const report = `# Design Review Report

**Date:** ${timestamp}  
**Status:** ${status}  
**Components Reviewed:** ${affectedComponents.length}

---

## Summary

${generateSummarySection(accessibilityResults, visualDiffs, designIssues)}

---

## Components

${generateComponentsSection(affectedComponents, screenshots, accessibilityResults, visualDiffs, designIssues)}

---

## Detailed Findings

${generateDetailedFindings(accessibilityResults, visualDiffs, designIssues)}

---

## Recommendations

${generateRecommendations(accessibilityResults, visualDiffs, designIssues)}

---

**Report ID:** ${reportId}  
**Generated:** ${timestamp}  
**Report Path:** ${reportPath}
`;

  await fs.writeFile(reportPath, report);
  
  context.log(`   ✅ Report saved: ${path.basename(reportPath)}`);
  
  return reportPath;
}

/**
 * Generate summary section
 */
function generateSummarySection(accessibility, visualDiffs, designIssues) {
  const sections = [];

  if (accessibility && !accessibility.skipped) {
    sections.push(`### Accessibility
- **Total Violations:** ${accessibility.summary.totalViolations}
- **Critical:** ${accessibility.summary.criticalViolations}
- **Serious:** ${accessibility.summary.seriousViolations}
- **Passes:** ${accessibility.summary.totalPasses}`);
  }

  if (visualDiffs && !visualDiffs.skipped) {
    sections.push(`### Visual Changes
- **Total Comparisons:** ${visualDiffs.summary.totalComparisons}
- **Changed:** ${visualDiffs.summary.changed}
- **Unchanged:** ${visualDiffs.summary.unchanged}
- **No Baseline:** ${visualDiffs.summary.noBaseline}`);
  }

  if (designIssues && !designIssues.skipped) {
    sections.push(`### Design Consistency
- **Total Issues:** ${designIssues.summary.totalIssues}
- **Critical:** ${designIssues.summary.criticalIssues}
- **Suggestions:** ${designIssues.summary.suggestions}`);
  }

  return sections.length > 0 ? sections.join('\n\n') : '*No checks performed*';
}

/**
 * Generate components section
 */
function generateComponentsSection(components, screenshots, accessibility, visualDiffs, designIssues) {
  if (components.length === 0) return '*No components reviewed*';

  return components.map(component => {
    const sections = [`### ${component.name}

**File:** \`${component.file}\`  
**Route:** \`${component.route}\``];

    // Screenshot
    const screenshot = screenshots?.screenshots?.find(s => s.component === component.name);
    if (screenshot) {
      sections.push(`**Screenshot:** \`${path.basename(screenshot.path)}\``);
    }

    // Accessibility
    const a11yResult = accessibility?.components?.find(c => c.name === component.name);
    if (a11yResult && !a11yResult.error) {
      const violations = a11yResult.violations.length;
      const icon = violations > 0 ? '⚠️' : '✅';
      sections.push(`**Accessibility:** ${icon} ${violations} violation(s), ${a11yResult.passes} passes`);
    }

    // Visual diff
    const visualResult = visualDiffs?.comparisons?.find(c => c.component === component.name);
    if (visualResult) {
      const icon = visualResult.changed ? '⚠️' : visualResult.status === 'baseline_created' ? 'ℹ️' : '✅';
      sections.push(`**Visual Changes:** ${icon} ${visualResult.message || visualResult.status}`);
    }

    // Design issues
    const designResult = designIssues?.components?.find(c => c.name === component.name);
    if (designResult && !designResult.error) {
      const issues = designResult.issues.length;
      const icon = issues > 0 ? '⚠️' : '✅';
      sections.push(`**Design Issues:** ${icon} ${issues} issue(s) found`);
    }

    return sections.join('  \n');
  }).join('\n\n');
}

/**
 * Generate detailed findings
 */
function generateDetailedFindings(accessibility, visualDiffs, designIssues) {
  const sections = [];

  // Accessibility violations
  if (accessibility && accessibility.summary.totalViolations > 0) {
    sections.push('### Accessibility Violations\n');
    
    accessibility.components.forEach(component => {
      if (component.violations && component.violations.length > 0) {
        sections.push(`#### ${component.name}\n`);
        
        component.violations.forEach((violation, index) => {
          sections.push(`${index + 1}. **${violation.id}** (${violation.impact})
   - ${violation.description}
   - **Help:** ${violation.help}
   - **Learn more:** ${violation.helpUrl}
   - **Affected elements:** ${violation.nodes.length}
`);
        });
      }
    });
  }

  // Design issues
  if (designIssues && designIssues.summary.totalIssues > 0) {
    sections.push('### Design Consistency Issues\n');
    
    designIssues.components.forEach(component => {
      if (component.issues && component.issues.length > 0) {
        sections.push(`#### ${component.name}\n`);
        
        component.issues.forEach((issue, index) => {
          sections.push(`${index + 1}. **${issue.type}** (${issue.severity})
   - ${issue.message}
   - **Suggestion:** ${issue.suggestion}
`);
        });
      }
    });
  }

  return sections.length > 0 ? sections.join('\n') : '*No issues found*';
}

/**
 * Generate recommendations
 */
function generateRecommendations(accessibility, visualDiffs, designIssues) {
  const recommendations = [];

  if (accessibility?.summary?.criticalViolations > 0) {
    recommendations.push('🚨 **Critical:** Address critical accessibility violations immediately. These prevent users from accessing your application.');
  }

  if (accessibility?.summary?.seriousViolations > 0) {
    recommendations.push('⚠️  **Important:** Fix serious accessibility violations. These significantly impact user experience for people with disabilities.');
  }

  if (visualDiffs?.summary?.changed > 0) {
    recommendations.push('👀 **Review:** Visual changes detected. Review the differences and update baselines if intentional.');
  }

  if (visualDiffs?.summary?.noBaseline > 0) {
    recommendations.push('📸 **Baseline:** New baselines created. Verify these represent the intended design before committing.');
  }

  if (designIssues?.summary?.criticalIssues > 0) {
    recommendations.push('🎨 **Design:** Critical design inconsistencies found. Review against design system guidelines.');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ **All Good:** No critical issues found. Consider the suggestions for improvements.');
  }

  return recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n');
}

export default generateReport;

