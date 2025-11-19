/**
 * Test Dashboard Integration
 * 
 * Verifies the dashboard design review integration
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DASHBOARD_URL = 'http://localhost:5173';
const CONFIG_PATH = './dashboard/.claude/design-review.json';

async function testDashboardIntegration() {
  console.log('🧪 Testing Dashboard Integration\n');
  
  let browser;
  let passed = 0;
  let failed = 0;
  
  try {
    // Test 1: Configuration exists
    console.log('1️⃣  Test: Configuration file exists');
    try {
      const config = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf-8'));
      console.log('   ✅ Configuration loaded');
      console.log(`   📋 Mode: ${config.mode}`);
      console.log(`   🎨 Checks enabled: ${Object.keys(config.checks).filter(k => config.checks[k]).join(', ')}`);
      passed++;
    } catch (error) {
      console.log(`   ❌ Configuration not found: ${error.message}`);
      failed++;
      return;
    }
    
    // Test 2: Dev server is running
    console.log('\n2️⃣  Test: Dev server accessibility');
    try {
      const response = await fetch(DASHBOARD_URL, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        console.log(`   ✅ Dev server accessible at ${DASHBOARD_URL}`);
        passed++;
      } else {
        console.log(`   ⚠️  Dev server responded with status: ${response.status}`);
        console.log('   💡 Start dev server with: cd dashboard && npm run dev');
        failed++;
        return;
      }
    } catch (error) {
      console.log(`   ❌ Dev server not accessible: ${error.message}`);
      console.log('   💡 Start dev server with: cd dashboard && npm run dev');
      failed++;
      return;
    }
    
    // Test 3: Browser can launch and navigate
    console.log('\n3️⃣  Test: Browser navigation');
    try {
      browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox']
      });
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
      });
      const page = await context.newPage();
      
      await page.goto(DASHBOARD_URL, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      const title = await page.title();
      console.log(`   ✅ Page loaded: "${title}"`);
      passed++;
      
      // Test 4: Screenshot capture
      console.log('\n4️⃣  Test: Screenshot capture');
      const screenshotDir = path.join(__dirname, 'dashboard/.claude/reports/design-review/screenshots');
      await fs.mkdir(screenshotDir, { recursive: true });
      
      const screenshotPath = path.join(screenshotDir, `test-${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath });
      
      const stats = await fs.stat(screenshotPath);
      console.log(`   ✅ Screenshot captured: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`   📁 Path: ${path.relative(__dirname, screenshotPath)}`);
      passed++;
      
      // Test 5: Component detection
      console.log('\n5️⃣  Test: Component detection');
      const componentSelectors = [
        { name: 'Main content', selector: '#root' },
        { name: 'React app', selector: '[data-testid], .App, main, article' }
      ];
      
      let componentsFound = 0;
      for (const { name, selector } of componentSelectors) {
        const element = await page.$(selector);
        if (element) {
          console.log(`   ✅ Found: ${name}`);
          componentsFound++;
        }
      }
      
      if (componentsFound > 0) {
        console.log(`   ✅ Detected ${componentsFound} component(s)`);
        passed++;
      } else {
        console.log('   ⚠️  No components detected');
        failed++;
      }
      
      // Test 6: Directory structure
      console.log('\n6️⃣  Test: Directory structure');
      const dirs = [
        'dashboard/.claude',
        'dashboard/.claude/reports',
        'dashboard/.claude/reports/design-review',
        'dashboard/.claude/reports/design-review/screenshots',
        'dashboard/.claude/reports/design-review/baselines'
      ];
      
      for (const dir of dirs) {
        try {
          await fs.access(dir);
          console.log(`   ✅ ${dir}`);
        } catch {
          console.log(`   ❌ ${dir} (missing)`);
          failed++;
        }
      }
      passed++;
      
      await browser.close();
      
    } catch (error) {
      console.log(`   ❌ Browser test failed: ${error.message}`);
      failed++;
      if (browser) await browser.close();
    }
    
  } catch (error) {
    console.log(`\n❌ Unexpected error: ${error.message}`);
    console.error(error.stack);
    failed++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Dashboard integration is ready.');
    console.log('\n📋 Next steps:');
    console.log('   1. Make a change to a component');
    console.log('   2. git add <component-file>');
    console.log('   3. git commit -m "test design review"');
    console.log('   4. Review the generated report');
  } else {
    console.log('\n⚠️  Some tests failed. Please address the issues above.');
  }
  
  process.exit(failed === 0 ? 0 : 1);
}

// Run tests
testDashboardIntegration().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

