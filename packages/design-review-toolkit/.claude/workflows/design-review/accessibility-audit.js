/**
 * Accessibility Audit Module
 * 
 * Runs axe-core accessibility audits on components using Playwright
 * 
 * @module accessibility-audit
 */

import { PlaywrightHelper } from '../../utils/playwright-helper.js';

/**
 * Run accessibility audit on components
 * @param {Object} context - Workflow context
 * @param {Array} affectedComponents - Components to audit
 * @param {Object} serverStatus - Dev server status
 * @param {Object} config - Design review configuration
 * @returns {Promise<Object>} Accessibility audit results
 */
export async function runAccessibilityAudit(context, { affectedComponents, serverStatus, config }) {
  const results = {
    components: [],
    summary: {
      totalViolations: 0,
      totalPasses: 0,
      totalIncomplete: 0,
      criticalViolations: 0,
      seriousViolations: 0
    }
  };

  if (!serverStatus.isRunning) {
    context.warn('⚠️  Dev server not running. Skipping accessibility audit.');
    return { skipped: true, reason: 'Dev server not available' };
  }

  context.log('♿ Running accessibility audits...');

  let browser = null;

  try {
    // Launch browser
    browser = await PlaywrightHelper.launchBrowser('chromium', {
      headless: true
    });

    for (const component of affectedComponents) {
      context.log(`  Auditing ${component.name}...`);

      try {
        const page = await browser.newPage();

        // Navigate to component route
        const url = `${config.devServer.url}${component.route}`;
        await PlaywrightHelper.navigateAndWait(page, url);

        // Run accessibility audit
        const auditResults = await PlaywrightHelper.runAccessibilityAudit(page);

        // Process results
        const componentResults = {
          name: component.name,
          file: component.file,
          route: component.route,
          url: url,
          violations: auditResults.violations.map(v => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            help: v.help,
            helpUrl: v.helpUrl,
            nodes: v.nodes.map(n => ({
              html: n.html,
              target: n.target,
              failureSummary: n.failureSummary
            }))
          })),
          passes: auditResults.passes.length,
          incomplete: auditResults.incomplete.length,
          timestamp: new Date().toISOString()
        };

        // Update summary
        results.summary.totalViolations += componentResults.violations.length;
        results.summary.totalPasses += componentResults.passes;
        results.summary.totalIncomplete += componentResults.incomplete;

        // Count critical and serious violations
        componentResults.violations.forEach(v => {
          if (v.impact === 'critical') results.summary.criticalViolations++;
          if (v.impact === 'serious') results.summary.seriousViolations++;
        });

        results.components.push(componentResults);

        // Log summary for this component
        if (componentResults.violations.length > 0) {
          context.warn(
            `    ⚠️  ${componentResults.violations.length} violation(s) found ` +
            `(${componentResults.violations.filter(v => v.impact === 'critical').length} critical)`
          );
        } else {
          context.log(`    ✅ No violations found`);
        }

        await page.close();

      } catch (error) {
        context.error(`  ❌ Failed to audit ${component.name}: ${error.message}`);
        results.components.push({
          name: component.name,
          file: component.file,
          error: error.message,
          violations: [],
          passes: 0,
          incomplete: 0
        });
      }
    }

  } catch (error) {
    context.error('❌ Accessibility audit failed:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Log overall summary
  context.log('\n📊 Accessibility Summary:');
  context.log(`   Total Violations: ${results.summary.totalViolations}`);
  context.log(`   Critical: ${results.summary.criticalViolations}`);
  context.log(`   Serious: ${results.summary.seriousViolations}`);
  context.log(`   Passes: ${results.summary.totalPasses}`);

  return results;
}

export default runAccessibilityAudit;

