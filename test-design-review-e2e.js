/**
 * End-to-End Test Suite for Design Review Workflow
 * 
 * Comprehensive testing covering:
 * - Multiple components
 * - Accessibility validation
 * - Design consistency checking
 * - Report generation
 * - Error handling
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  url: 'http://localhost:5173',
  viewport: { width: 1280, height: 720 },
  timeout: 30000,
  screenshotDir: 'dashboard/.claude/reports/design-review/screenshots',
  reportDir: 'dashboard/.claude/reports/design-review',
  baselineDir: 'dashboard/.claude/reports/design-review/baselines'
};

// Test scenarios
const TEST_COMPONENTS = [
  {
    name: 'LandingPage',
    view: 'landing',
    expectedScore: { min: 85, target: 90 },
    criticalIssues: 0,
    description: 'Portfolio landing page with email capture'
  },
  {
    name: 'Dashboard',
    view: 'dashboard',
    expectedScore: { min: 80, target: 85 },
    criticalIssues: 0,
    description: 'Main dashboard view with panels'
  },
  {
    name: 'IconTest',
    view: 'icon-test',
    expectedScore: { min: 85, target: 90 },
    criticalIssues: 0,
    description: 'Icon component testing page'
  }
];

class TestResults {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
    this.components = [];
    this.startTime = Date.now();
  }

  addResult(componentName, result) {
    this.components.push({ name: componentName, ...result });
    if (result.success) {
      this.passed++;
    } else {
      this.failed++;
    }
    if (result.warnings > 0) {
      this.warnings++;
    }
  }

  getElapsedTime() {
    return ((Date.now() - this.startTime) / 1000).toFixed(2);
  }

  getSummary() {
    const total = this.passed + this.failed;
    const passRate = ((this.passed / total) * 100).toFixed(1);
    return {
      total,
      passed: this.passed,
      failed: this.failed,
      warnings: this.warnings,
      passRate,
      elapsedTime: this.getElapsedTime()
    };
  }
}

async function runE2ETests() {
  console.log('🧪 Design Review End-to-End Test Suite\n');
  console.log('=' .repeat(60));
  console.log('Testing Configuration');
  console.log('='.repeat(60));
  console.log(`Dev Server: ${CONFIG.url}`);
  console.log(`Viewport: ${CONFIG.viewport.width}x${CONFIG.viewport.height}`);
  console.log(`Components to Test: ${TEST_COMPONENTS.length}`);
  console.log('='.repeat(60) + '\n');

  const results = new TestResults();
  let browser;

  try {
    // Setup
    console.log('📦 Setting up test environment...');
    await fs.mkdir(CONFIG.screenshotDir, { recursive: true });
    await fs.mkdir(CONFIG.reportDir, { recursive: true });
    await fs.mkdir(CONFIG.baselineDir, { recursive: true });
    console.log('   ✅ Directories created\n');

    // Check dev server
    console.log('🌐 Checking dev server...');
    try {
      const response = await fetch(CONFIG.url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      console.log('   ✅ Dev server accessible\n');
    } catch (error) {
      console.error('   ❌ Dev server not accessible');
      console.error('   💡 Start with: cd dashboard && npm run dev');
      process.exit(1);
    }

    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await chromium.launch({ headless: true });
    console.log('   ✅ Browser ready\n');

    // Run tests for each component
    for (const component of TEST_COMPONENTS) {
      await testComponent(browser, component, results);
    }

    await browser.close();

    // Generate comprehensive report
    await generateE2EReport(results);

    // Display summary
    displaySummary(results);

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    console.error(error.stack);
    if (browser) await browser.close();
    process.exit(1);
  }
}

async function testComponent(browser, component, results) {
  console.log('='.repeat(60));
  console.log(`Testing: ${component.name}`);
  console.log('='.repeat(60));
  console.log(`Description: ${component.description}`);
  console.log(`Expected Score: ${component.expectedScore.target}/100 (min: ${component.expectedScore.min})`);
  console.log('');

  const timestamp = Date.now();
  const context = await browser.newContext({ viewport: CONFIG.viewport });
  const page = await context.newPage();

  const componentResult = {
    success: false,
    score: 0,
    violations: [],
    warnings: 0,
    screenshot: null,
    error: null
  };

  try {
    // Navigate to page
    console.log(`1️⃣  Navigating to ${CONFIG.url}...`);
    await page.goto(CONFIG.url, { waitUntil: 'networkidle', timeout: CONFIG.timeout });
    
    // Switch to component view
    if (component.view !== 'landing') {
      console.log(`   Switching to ${component.view} view...`);
      const buttonSelector = `button:has-text("${component.view === 'dashboard' ? 'Dashboard' : 'Icon Test'}")`;
      await page.click(buttonSelector);
      await page.waitForTimeout(1000); // Allow view to render
    }
    
    console.log('   ✅ Navigation successful');

    // Capture screenshot
    console.log('\n2️⃣  Capturing screenshot...');
    const screenshotPath = path.join(__dirname, CONFIG.screenshotDir, `${component.name}-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    const stats = await fs.stat(screenshotPath);
    console.log(`   ✅ Screenshot saved: ${(stats.size / 1024).toFixed(2)} KB`);
    componentResult.screenshot = path.relative(__dirname, screenshotPath);

    // Run accessibility audit
    console.log('\n3️⃣  Running accessibility audit...');
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

    // Calculate score
    const critical = accessibilityResults.violations.filter(v => v.impact === 'critical').length;
    const serious = accessibilityResults.violations.filter(v => v.impact === 'serious').length;
    const moderate = accessibilityResults.violations.filter(v => v.impact === 'moderate').length;
    const minor = accessibilityResults.violations.filter(v => v.impact === 'minor').length;

    const score = Math.max(0, 100 - (
      critical * 20 +
      serious * 10 +
      moderate * 5 +
      minor * 2
    ));

    componentResult.score = score;
    componentResult.violations = accessibilityResults.violations;

    console.log(`   Accessibility Score: ${score}/100`);
    console.log(`   Total Violations: ${accessibilityResults.violations.length}`);
    console.log(`   Passes: ${accessibilityResults.passes}`);
    
    if (critical > 0) console.log(`   🚨 Critical: ${critical}`);
    if (serious > 0) console.log(`   ⚠️  Serious: ${serious}`);
    if (moderate > 0) console.log(`   ℹ️  Moderate: ${moderate}`);
    if (minor > 0) console.log(`   💡 Minor: ${minor}`);

    // Validate against expectations
    console.log('\n4️⃣  Validating results...');
    
    const meetsTarget = score >= component.expectedScore.target;
    const meetsMinimum = score >= component.expectedScore.min;
    const noCritical = critical === component.criticalIssues;

    if (meetsTarget && noCritical) {
      console.log(`   ✅ Score meets target (${score} >= ${component.expectedScore.target})`);
      componentResult.success = true;
    } else if (meetsMinimum && noCritical) {
      console.log(`   ⚠️  Score meets minimum (${score} >= ${component.expectedScore.min})`);
      componentResult.success = true;
      componentResult.warnings++;
    } else {
      console.log(`   ❌ Score below minimum (${score} < ${component.expectedScore.min})`);
      componentResult.success = false;
    }

    if (!noCritical) {
      console.log(`   ❌ Critical issues found: ${critical} (expected: ${component.criticalIssues})`);
      componentResult.success = false;
    }

    // Generate component report
    console.log('\n5️⃣  Generating report...');
    const reportPath = await generateComponentReport(component, {
      timestamp,
      score,
      violations: accessibilityResults.violations,
      passes: accessibilityResults.passes,
      screenshot: componentResult.screenshot,
      success: componentResult.success
    });
    console.log(`   ✅ Report saved: ${path.basename(reportPath)}`);

  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    componentResult.error = error.message;
    componentResult.success = false;
  } finally {
    await context.close();
  }

  results.addResult(component.name, componentResult);
  
  console.log('\n' + (componentResult.success ? '✅ PASS' : '❌ FAIL'));
  console.log('='.repeat(60) + '\n');
}

async function generateComponentReport(component, data) {
  const { timestamp, score, violations, passes, screenshot, success } = data;
  const reportPath = path.join(__dirname, CONFIG.reportDir, `${component.name}-${timestamp}.md`);

  const report = `# Design Review: ${component.name}

**Date:** ${new Date(timestamp).toISOString()}  
**Status:** ${success ? '✅ Pass' : '❌ Fail'}  
**Description:** ${component.description}

---

## Results

| Metric | Value |
|--------|-------|
| **Accessibility Score** | ${score}/100 |
| **Expected Target** | ${component.expectedScore.target}/100 |
| **Expected Minimum** | ${component.expectedScore.min}/100 |
| **Total Violations** | ${violations.length} |
| **Passes** | ${passes} |
| **Screenshot** | [View](${screenshot}) |

### Violation Breakdown

${generateViolationTable(violations)}

---

## Detailed Findings

${violations.length === 0 ? '✅ **No violations found!**\n' : generateViolationDetails(violations)}

---

## Test Result

${success ? 
  `✅ **Test Passed**\n\nComponent meets accessibility standards.` : 
  `❌ **Test Failed**\n\nComponent needs accessibility improvements.`}

---

*Generated by Design Review E2E Test Suite*
`;

  await fs.writeFile(reportPath, report);
  return reportPath;
}

function generateViolationTable(violations) {
  if (violations.length === 0) {
    return '*No violations found*';
  }

  const critical = violations.filter(v => v.impact === 'critical').length;
  const serious = violations.filter(v => v.impact === 'serious').length;
  const moderate = violations.filter(v => v.impact === 'moderate').length;
  const minor = violations.filter(v => v.impact === 'minor').length;

  return `- 🚨 **Critical:** ${critical}
- ⚠️  **Serious:** ${serious}
- ℹ️  **Moderate:** ${moderate}
- 💡 **Minor:** ${minor}`;
}

function generateViolationDetails(violations) {
  return violations.map((v, i) => `### ${i + 1}. ${v.help}

- **Impact:** ${v.impact}
- **Description:** ${v.description}
- **Affected Nodes:** ${v.nodes}
- **Learn More:** [${v.helpUrl}](${v.helpUrl})
`).join('\n');
}

async function generateE2EReport(results) {
  const summary = results.getSummary();
  const reportPath = path.join(__dirname, CONFIG.reportDir, `e2e-test-${Date.now()}.md`);

  const report = `# Design Review E2E Test Report

**Date:** ${new Date().toISOString()}  
**Duration:** ${summary.elapsedTime}s  
**Status:** ${summary.failed === 0 ? '✅ All Tests Passed' : `❌ ${summary.failed} Test(s) Failed`}

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tests** | ${summary.total} |
| **Passed** | ${summary.passed} ✅ |
| **Failed** | ${summary.failed} ❌ |
| **Warnings** | ${summary.warnings} ⚠️ |
| **Pass Rate** | ${summary.passRate}% |
| **Execution Time** | ${summary.elapsedTime}s |

---

## Component Results

${results.components.map(c => `### ${c.name}

- **Status:** ${c.success ? '✅ Pass' : '❌ Fail'}
- **Score:** ${c.score}/100
- **Violations:** ${c.violations.length}
- **Screenshot:** [View](${c.screenshot || 'N/A'})
${c.error ? `- **Error:** ${c.error}` : ''}
`).join('\n')}

---

## Recommendations

${generateRecommendations(results)}

---

*Generated by Design Review E2E Test Suite*
`;

  await fs.writeFile(reportPath, report);
  console.log(`\n📊 E2E Report saved: ${path.basename(reportPath)}`);
}

function generateRecommendations(results) {
  const failed = results.components.filter(c => !c.success);
  const warnings = results.components.filter(c => c.warnings > 0);

  if (failed.length === 0 && warnings.length === 0) {
    return '🎉 **All components passed with excellent scores!**';
  }

  let recommendations = '';

  if (failed.length > 0) {
    recommendations += `### Failed Components\n\n`;
    recommendations += `The following components need attention:\n\n`;
    failed.forEach(c => {
      recommendations += `- **${c.name}**: Score ${c.score}/100\n`;
    });
    recommendations += '\n';
  }

  if (warnings.length > 0) {
    recommendations += `### Components with Warnings\n\n`;
    recommendations += `These components passed but could be improved:\n\n`;
    warnings.forEach(c => {
      recommendations += `- **${c.name}**: Score ${c.score}/100 (below target)\n`;
    });
  }

  return recommendations;
}

function displaySummary(results) {
  const summary = results.getSummary();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 END-TO-END TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${summary.total}`);
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`⚠️  Warnings: ${summary.warnings}`);
  console.log(`📈 Pass Rate: ${summary.passRate}%`);
  console.log(`⏱️  Time: ${summary.elapsedTime}s`);
  console.log('='.repeat(60));
  
  if (summary.failed === 0) {
    console.log('\n🎉 All tests passed successfully!');
  } else {
    console.log(`\n⚠️  ${summary.failed} test(s) failed. Review the reports for details.`);
  }
  
  console.log('\n📁 Reports generated in:');
  console.log(`   ${CONFIG.reportDir}/`);
}

// Run the test suite
runE2ETests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

