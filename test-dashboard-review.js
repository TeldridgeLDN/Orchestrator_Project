/**
 * Manual Design Review Test for Dashboard
 * 
 * Runs a complete design review on the dashboard LandingPage component
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  url: 'http://localhost:5173',
  component: 'LandingPage',
  outputDir: path.join(__dirname, 'dashboard/.claude/reports/design-review'),
  screenshotDir: path.join(__dirname, 'dashboard/.claude/reports/design-review/screenshots'),
  viewport: { width: 1280, height: 720 }
};

async function runDesignReview() {
  console.log('🎨 Running Design Review on Dashboard LandingPage\n');
  
  const timestamp = Date.now();
  const reportPath = path.join(CONFIG.outputDir, `review-${timestamp}.md`);
  
  let browser;
  
  try {
    // Ensure directories exist
    await fs.mkdir(CONFIG.screenshotDir, { recursive: true });
    
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: CONFIG.viewport });
    const page = await context.newPage();
    
    // Navigate to page
    console.log(`📍 Navigating to ${CONFIG.url}...`);
    await page.goto(CONFIG.url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Capture screenshot
    console.log('📸 Capturing screenshot...');
    const screenshotPath = path.join(CONFIG.screenshotDir, `${CONFIG.component}-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    const screenshotStats = await fs.stat(screenshotPath);
    console.log(`   ✅ Screenshot saved: ${(screenshotStats.size / 1024).toFixed(2)} KB`);
    
    // Run accessibility audit
    console.log('\n♿ Running accessibility audit...');
    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js'
    });
    
    const accessibilityResults = await page.evaluate(async () => {
      // @ts-ignore
      const results = await axe.run();
      return {
        violations: results.violations.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          nodes: v.nodes.length
        })),
        passes: results.passes.length,
        incomplete: results.incomplete.length
      };
    });
    
    console.log(`   Total violations: ${accessibilityResults.violations.length}`);
    console.log(`   Passes: ${accessibilityResults.passes}`);
    
    // Calculate accessibility score
    const criticalViolations = accessibilityResults.violations.filter(v => v.impact === 'critical').length;
    const seriousViolations = accessibilityResults.violations.filter(v => v.impact === 'serious').length;
    const moderateViolations = accessibilityResults.violations.filter(v => v.impact === 'moderate').length;
    const minorViolations = accessibilityResults.violations.filter(v => v.impact === 'minor').length;
    
    const score = Math.max(0, 100 - (
      criticalViolations * 20 +
      seriousViolations * 10 +
      moderateViolations * 5 +
      minorViolations * 2
    ));
    
    console.log(`   Accessibility Score: ${score}/100`);
    if (criticalViolations > 0) {
      console.log(`   🚨 Critical: ${criticalViolations}`);
    }
    if (seriousViolations > 0) {
      console.log(`   ⚠️  Serious: ${seriousViolations}`);
    }
    
    // Generate report
    console.log('\n📝 Generating report...');
    const report = generateReport({
      component: CONFIG.component,
      timestamp: new Date().toISOString(),
      screenshot: path.relative(__dirname, screenshotPath),
      accessibility: {
        score,
        violations: accessibilityResults.violations,
        passes: accessibilityResults.passes,
        summary: {
          critical: criticalViolations,
          serious: seriousViolations,
          moderate: moderateViolations,
          minor: minorViolations
        }
      }
    });
    
    await fs.writeFile(reportPath, report);
    console.log(`   ✅ Report saved: ${path.relative(__dirname, reportPath)}`);
    
    await browser.close();
    
    // Display summary
    console.log('\n' + '='.repeat(60));
    console.log('🎨 Design Review Summary');
    console.log('='.repeat(60));
    console.log(`Component: ${CONFIG.component}`);
    console.log(`Accessibility Score: ${score}/100`);
    console.log(`Total Violations: ${accessibilityResults.violations.length}`);
    console.log(`Screenshot: ${path.basename(screenshotPath)}`);
    console.log(`Report: ${path.basename(reportPath)}`);
    
    if (score >= 90) {
      console.log('\n✅ Excellent! No major accessibility issues.');
    } else if (score >= 70) {
      console.log('\n⚠️  Good, but some improvements needed.');
    } else {
      console.log('\n❌ Accessibility needs attention.');
    }
    
    console.log(`\n📖 View full report: ${reportPath}`);
    
  } catch (error) {
    console.error('\n❌ Error during design review:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

function generateReport(data) {
  const { component, timestamp, screenshot, accessibility } = data;
  const { score, violations, passes, summary } = accessibility;
  
  let report = `# Design Review Report: ${component}

**Date:** ${timestamp}  
**Component:** ${component}  
**Status:** ${score >= 90 ? '✅ Passed' : score >= 70 ? '⚠️  Warnings' : '❌ Failed'}

---

## Summary

| Metric | Value |
|--------|-------|
| **Accessibility Score** | ${score}/100 |
| **Total Violations** | ${violations.length} |
| **Passes** | ${passes} |
| **Screenshot** | [View](${screenshot}) |

### Violation Breakdown

- 🚨 **Critical:** ${summary.critical}
- ⚠️  **Serious:** ${summary.serious}
- ℹ️  **Moderate:** ${summary.moderate}
- 💡 **Minor:** ${summary.minor}

---

## Detailed Findings

`;

  if (violations.length === 0) {
    report += `✅ **No accessibility violations found!**\n\n`;
    report += `All ${passes} accessibility checks passed.\n\n`;
  } else {
    report += `### Accessibility Violations\n\n`;
    
    violations.forEach((v, index) => {
      report += `#### ${index + 1}. ${v.help}\n\n`;
      report += `- **Impact:** ${v.impact}\n`;
      report += `- **Description:** ${v.description}\n`;
      report += `- **Affected Nodes:** ${v.nodes}\n`;
      report += `- **Learn More:** [${v.helpUrl}](${v.helpUrl})\n\n`;
    });
  }

  report += `---

## Recommendations

`;

  if (summary.critical > 0) {
    report += `### 🚨 Critical Priority\n\n`;
    report += `Fix ${summary.critical} critical accessibility issue(s) immediately. These prevent users from accessing content.\n\n`;
  }
  
  if (summary.serious > 0) {
    report += `### ⚠️  High Priority\n\n`;
    report += `Address ${summary.serious} serious issue(s). These create significant barriers for users.\n\n`;
  }
  
  if (score === 100) {
    report += `🎉 **Perfect Score!** This component meets all accessibility standards.\n\n`;
  } else if (score >= 90) {
    report += `✅ **Excellent!** Only minor improvements needed.\n\n`;
  } else if (score >= 70) {
    report += `👍 **Good!** Address the issues above to improve accessibility.\n\n`;
  } else {
    report += `⚠️  **Needs Work:** Accessibility should be improved before deployment.\n\n`;
  }

  report += `---

**Report Generated:** ${timestamp}  
**Tool:** Design Review System v1.0
`;

  return report;
}

// Run the review
runDesignReview().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

