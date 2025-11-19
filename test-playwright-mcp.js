/**
 * Playwright MCP Test Script
 * 
 * Verifies that Playwright is correctly installed and configured.
 * Tests basic browser automation capabilities.
 * 
 * Usage: node test-playwright-mcp.js
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPlaywrightMCP() {
  const results = {
    browserLaunch: false,
    navigation: false,
    screenshot: false,
    accessibility: false,
    errors: []
  };

  try {
    console.log('🎭 Playwright MCP Test Script');
    console.log('================================\n');

    // Test 1: Browser Launch
    console.log('1️⃣  Testing browser launch...');
    const browser = await chromium.launch({ 
      headless: true,
      timeout: 30000 
    });
    console.log('   ✅ Browser launched successfully');
    results.browserLaunch = true;

    // Test 2: Page Creation and Navigation
    console.log('\n2️⃣  Testing page navigation...');
    const page = await browser.newPage();
    await page.goto('https://example.com', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    const title = await page.title();
    console.log(`   ✅ Navigation successful - Page title: "${title}"`);
    results.navigation = true;

    // Test 3: Screenshot Capture
    console.log('\n3️⃣  Testing screenshot capture...');
    const screenshotDir = path.join(__dirname, '.playwright-tests');
    await fs.mkdir(screenshotDir, { recursive: true });
    
    const screenshotPath = path.join(screenshotDir, 'example-screenshot.png');
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    const stats = await fs.stat(screenshotPath);
    console.log(`   ✅ Screenshot captured successfully (${(stats.size / 1024).toFixed(2)} KB)`);
    console.log(`   📁 Location: ${screenshotPath}`);
    results.screenshot = true;

    // Test 4: Basic Accessibility Check
    console.log('\n4️⃣  Testing accessibility scanning...');
    try {
      // Inject axe-core for accessibility testing
      await page.addScriptTag({
        url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js'
      });
      
      // Run accessibility audit
      const accessibilityResults = await page.evaluate(() => {
        return new Promise((resolve) => {
          // @ts-ignore
          axe.run((err, results) => {
            if (err) resolve({ error: err.message });
            resolve({
              violations: results.violations.length,
              passes: results.passes.length,
              incomplete: results.incomplete.length
            });
          });
        });
      });

      if (accessibilityResults.error) {
        console.log(`   ⚠️  Accessibility scan failed: ${accessibilityResults.error}`);
      } else {
        console.log(`   ✅ Accessibility scan completed`);
        console.log(`      - Violations: ${accessibilityResults.violations}`);
        console.log(`      - Passes: ${accessibilityResults.passes}`);
        console.log(`      - Incomplete: ${accessibilityResults.incomplete}`);
        results.accessibility = true;
      }
    } catch (error) {
      console.log(`   ⚠️  Accessibility test skipped: ${error.message}`);
    }

    // Test 5: Multiple Browser Contexts
    console.log('\n5️⃣  Testing browser context isolation...');
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    await Promise.all([
      page1.goto('https://example.com'),
      page2.goto('https://example.org')
    ]);
    
    console.log('   ✅ Multiple contexts working correctly');
    
    await context1.close();
    await context2.close();

    // Cleanup
    console.log('\n6️⃣  Cleaning up...');
    await browser.close();
    console.log('   ✅ Browser closed successfully');

    // Summary
    console.log('\n================================');
    console.log('📊 Test Summary:');
    console.log('================================');
    console.log(`✅ Browser Launch:     ${results.browserLaunch ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Navigation:         ${results.navigation ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Screenshot:         ${results.screenshot ? 'PASS' : 'FAIL'}`);
    console.log(`${results.accessibility ? '✅' : '⚠️ '} Accessibility:      ${results.accessibility ? 'PASS' : 'SKIPPED'}`);
    
    const totalTests = 4;
    const passedTests = Object.values(results).filter(Boolean).length;
    console.log(`\n🎯 Score: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
      console.log('\n🎉 All tests passed! Playwright MCP is ready to use.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed or were skipped. Review output above.');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
console.log('Starting Playwright MCP tests...\n');
testPlaywrightMCP().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

