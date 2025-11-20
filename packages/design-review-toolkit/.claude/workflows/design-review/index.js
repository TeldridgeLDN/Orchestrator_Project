/**
 * Design Review Toolkit - Main Entry Point
 * 
 * Export all workflow modules for easy importing
 */

export { default as accessibilityAudit } from './accessibility-audit.js';
export { default as captureScreenshots } from './capture-screenshots.js';
export { default as visualDiff } from './visual-diff.js';
export { default as designConsistency } from './design-consistency.js';
export { default as generateReport } from './generate-report.js';

// Re-export marketing extensions for convenience
export { checkConversion } from '../../../.claude/design-review/extensions/marketing/conversion-check.js';
export { checkCopyQuality } from '../../../.claude/design-review/extensions/marketing/copy-quality.js';
export { checkTrustSignals } from '../../../.claude/design-review/extensions/marketing/trust-signals.js';

/**
 * Load configuration from a project
 * @param {string} configPath - Path to design-review.json
 * @returns {Promise<object>} Configuration object
 */
export async function loadConfig(configPath) {
  const fs = await import('fs/promises');
  const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
  
  // If config extends templates, merge them
  if (config.extends && Array.isArray(config.extends)) {
    const path = await import('path');
    for (const templatePath of config.extends) {
      const resolvedPath = path.resolve(path.dirname(configPath), templatePath);
      try {
        const template = JSON.parse(await fs.readFile(resolvedPath, 'utf-8'));
        config.checks = { ...template.checks, ...config.checks };
        config.designSystem = { ...template.designSystem, ...config.designSystem };
      } catch (error) {
        console.warn(`Warning: Could not load template ${templatePath}:`, error.message);
      }
    }
  }
  
  return config;
}

/**
 * Run a complete design review
 * @param {object} options - Review options
 * @param {string} options.url - URL to review
 * @param {object} options.config - Design review configuration
 * @param {object} options.browser - Playwright browser instance (optional, will create if not provided)
 * @returns {Promise<object>} Review results
 */
export async function runDesignReview({ url, config, browser }) {
  const playwright = await import('playwright');
  const shouldCloseBrowser = !browser;
  
  try {
    if (!browser) {
      browser = await playwright.chromium.launch({ headless: true });
    }
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: config.performance?.timeout || 30000 });
    
    const results = {
      url,
      timestamp: new Date().toISOString(),
      checks: {}
    };
    
    // Run accessibility audit
    if (config.checks?.accessibility?.enabled) {
      const { default: accessibilityAudit } = await import('./accessibility-audit.js');
      results.checks.accessibility = await accessibilityAudit(page, config.checks.accessibility);
    }
    
    // Run visual regression (if baselines exist)
    if (config.checks?.visualRegression?.enabled) {
      const { default: visualDiff } = await import('./visual-diff.js');
      try {
        results.checks.visualRegression = await visualDiff(page, config.checks.visualRegression);
      } catch (error) {
        results.checks.visualRegression = { error: error.message, skipped: true };
      }
    }
    
    // Run design consistency checks
    if (config.checks?.designConsistency?.enabled) {
      const { default: designConsistency } = await import('./design-consistency.js');
      results.checks.designConsistency = await designConsistency(page, config.checks.designConsistency);
    }
    
    // Marketing-specific checks
    if (config.template === 'marketing-site') {
      if (config.checks?.conversionOptimization?.enabled) {
        const { checkConversion } = await import('../../../.claude/design-review/extensions/marketing/conversion-check.js');
        results.checks.conversion = await checkConversion(page, config.checks.conversionOptimization);
      }
      
      if (config.checks?.copyQuality?.enabled) {
        const { checkCopyQuality } = await import('../../../.claude/design-review/extensions/marketing/copy-quality.js');
        results.checks.copyQuality = await checkCopyQuality(page, config.checks.copyQuality);
      }
      
      if (config.checks?.trustSignals?.enabled) {
        const { checkTrustSignals } = await import('../../../.claude/design-review/extensions/marketing/trust-signals.js');
        results.checks.trustSignals = await checkTrustSignals(page, config.checks.trustSignals);
      }
    }
    
    // Capture screenshots
    const { default: captureScreenshots } = await import('./capture-screenshots.js');
    results.screenshots = await captureScreenshots(page, config.checks?.visualRegression || {});
    
    await context.close();
    
    return results;
  } finally {
    if (shouldCloseBrowser && browser) {
      await browser.close();
    }
  }
}

