/**
 * Screenshot Capture Module
 * 
 * Captures screenshots of components using Playwright
 * 
 * @module capture-screenshots
 */

import { PlaywrightHelper } from '../../utils/playwright-helper.js';
import path from 'path';
import fs from 'fs/promises';

/**
 * Capture screenshots of affected components
 * @param {Object} context - Workflow context
 * @param {Array} affectedComponents - Components to screenshot
 * @param {Object} serverStatus - Dev server status
 * @param {Object} config - Design review configuration
 * @returns {Promise<Object>} Screenshot results
 */
export async function captureScreenshots(context, { affectedComponents, serverStatus, config }) {
  const results = {
    screenshots: [],
    failed: []
  };

  if (!serverStatus.isRunning) {
    context.warn('⚠️  Dev server not running. Skipping screenshot capture.');
    return { skipped: true, reason: 'Dev server not available' };
  }

  context.log('📸 Capturing screenshots...');

  // Ensure screenshot directory exists
  const screenshotDir = path.join(context.projectRoot, '.claude/reports/design-review/screenshots');
  await fs.mkdir(screenshotDir, { recursive: true });

  const timestamp = Date.now();
  let browser = null;

  try {
    // Launch browser
    browser = await PlaywrightHelper.launchBrowser('chromium', {
      headless: true
    });

    for (const component of affectedComponents) {
      context.log(`  Capturing ${component.name}...`);

      try {
        const page = await browser.newPage();

        // Set viewport size
        await page.setViewportSize({
          width: 1280,
          height: 720
        });

        // Navigate to component route
        const url = `${config.devServer.url}${component.route}`;
        await PlaywrightHelper.navigateAndWait(page, url);

        // Wait a bit for any animations or dynamic content
        await page.waitForTimeout(500);

        // Capture full page screenshot
        const screenshotPath = path.join(
          screenshotDir,
          `${component.name}-${timestamp}.png`
        );

        await PlaywrightHelper.captureScreenshot(page, screenshotPath, {
          fullPage: true
        });

        results.screenshots.push({
          component: component.name,
          file: component.file,
          route: component.route,
          url: url,
          path: screenshotPath,
          timestamp: new Date().toISOString()
        });

        context.log(`    ✅ Screenshot saved: ${path.basename(screenshotPath)}`);

        await page.close();

      } catch (error) {
        context.error(`  ❌ Failed to capture ${component.name}: ${error.message}`);
        results.failed.push({
          component: component.name,
          file: component.file,
          error: error.message
        });
      }
    }

  } catch (error) {
    context.error('❌ Screenshot capture failed:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  context.log(`\n📷 Captured ${results.screenshots.length} screenshots`);
  if (results.failed.length > 0) {
    context.warn(`⚠️  Failed to capture ${results.failed.length} screenshots`);
  }

  return results;
}

export default captureScreenshots;

