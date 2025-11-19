# Design Review Workflow - Troubleshooting Guide

**Version:** 1.0  
**Last Updated:** 2025-11-19

---

## Table of Contents

1. [Common Issues](#common-issues)
2. [Dev Server Problems](#dev-server-problems)
3. [Browser Automation Issues](#browser-automation-issues)
4. [Accessibility Audit Problems](#accessibility-audit-problems)
5. [Screenshot Capture Issues](#screenshot-capture-issues)
6. [Report Generation Problems](#report-generation-problems)
7. [Configuration Issues](#configuration-issues)
8. [Performance Problems](#performance-problems)
9. [Edge Cases](#edge-cases)

---

## Common Issues

### Issue: "Dev server not accessible"

**Symptoms:**
```
❌ Dev server not accessible
💡 Start with: cd dashboard && npm run dev
```

**Causes:**
- Dev server not running
- Running on wrong port
- Network/firewall blocking access

**Solutions:**

1. **Start the dev server:**
   ```bash
   cd dashboard
   npm run dev
   ```

2. **Verify the port:**
   ```bash
   # Check if port 5173 is in use
   lsof -i :5173
   
   # If different port, update .claude/design-review.json
   ```

3. **Check configuration:**
   ```json
   {
     "devServer": {
       "url": "http://localhost:5173",
       "port": 5173
     }
   }
   ```

---

### Issue: "No components detected"

**Symptoms:**
```
⚠️  No components detected
```

**Causes:**
- React app not rendering
- Selectors not matching
- Page not fully loaded

**Solutions:**

1. **Check page source:**
   - Open browser to http://localhost:5173
   - View page source (Cmd+Option+U)
   - Look for `<div id="root">` or React root element

2. **Add wait time:**
   ```javascript
   await page.goto(url, { 
     waitUntil: 'networkidle',  // Wait for network to be idle
     timeout: 30000              // 30 second timeout
   });
   await page.waitForTimeout(2000);  // Additional 2s wait
   ```

3. **Update selectors:**
   ```javascript
   // In test script
   const componentSelectors = [
     { name: 'Main content', selector: '#root' },
     { name: 'React app', selector: '[data-testid], .App, main' }
   ];
   ```

---

### Issue: "Screenshot is blank or incomplete"

**Symptoms:**
- White/blank screenshot
- Partial content missing
- Screenshot too small

**Causes:**
- Page not fully loaded
- Content rendering slowly
- Viewport too small

**Solutions:**

1. **Increase wait time:**
   ```javascript
   await page.goto(url, { waitUntil: 'networkidle' });
   await page.waitForTimeout(3000);  // Wait 3 seconds
   await page.screenshot({ path: screenshotPath });
   ```

2. **Use fullPage option:**
   ```javascript
   await page.screenshot({ 
     path: screenshotPath,
     fullPage: true  // Capture entire page
   });
   ```

3. **Adjust viewport:**
   ```json
   {
     "screenshots": {
       "viewport": {
         "width": 1920,   // Wider viewport
         "height": 1080
       }
     }
   }
   ```

---

## Dev Server Problems

### Issue: Port Already in Use

**Symptoms:**
```
Error: Port 5173 is already in use
```

**Solutions:**

1. **Kill existing process:**
   ```bash
   # Find process using port 5173
   lsof -ti:5173
   
   # Kill the process
   kill -9 $(lsof -ti:5173)
   ```

2. **Use different port:**
   ```bash
   # Start Vite on different port
   npm run dev -- --port 3000
   
   # Update configuration
   ```

---

### Issue: Build/Compilation Errors

**Symptoms:**
```
Failed to compile
SyntaxError: ...
```

**Solutions:**

1. **Check console output:**
   - Review full error message
   - Fix syntax/type errors in code

2. **Clear cache:**
   ```bash
   rm -rf node_modules/.vite
   rm -rf dist
   npm run dev
   ```

3. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules
   npm install
   npm run dev
   ```

---

## Browser Automation Issues

### Issue: "Browser launch failed"

**Symptoms:**
```
Error: Failed to launch browser
```

**Causes:**
- Playwright not installed
- Missing browser binaries
- Insufficient permissions

**Solutions:**

1. **Install Playwright:**
   ```bash
   npm install --save-dev playwright
   npx playwright install
   ```

2. **Install specific browser:**
   ```bash
   npx playwright install chromium
   ```

3. **Check permissions:**
   ```bash
   # On macOS, allow terminal/app in System Preferences > Security
   ```

---

### Issue: "Page navigation timeout"

**Symptoms:**
```
TimeoutError: page.goto: Timeout 30000ms exceeded
```

**Solutions:**

1. **Increase timeout:**
   ```javascript
   await page.goto(url, { 
     waitUntil: 'networkidle',
     timeout: 60000  // 60 seconds
   });
   ```

2. **Use different wait strategy:**
   ```javascript
   await page.goto(url, { 
     waitUntil: 'domcontentloaded'  // Don't wait for all resources
   });
   ```

3. **Check for loading states:**
   ```javascript
   // Wait for specific element
   await page.waitForSelector('#root', { timeout: 30000 });
   ```

---

## Accessibility Audit Problems

### Issue: "axe-core not loading"

**Symptoms:**
```
ReferenceError: axe is not defined
```

**Causes:**
- CDN blocked
- Network issues
- Content Security Policy (CSP) blocking

**Solutions:**

1. **Verify CDN access:**
   ```bash
   curl https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js
   ```

2. **Use local axe-core:**
   ```bash
   npm install --save-dev axe-core
   ```
   
   ```javascript
   // Load from node_modules
   await page.addScriptTag({
     path: 'node_modules/axe-core/axe.min.js'
   });
   ```

3. **Check CSP:**
   - Review Content-Security-Policy headers
   - Add cdnjs.cloudflare.com to allowed sources

---

### Issue: "Accessibility audit takes too long"

**Symptoms:**
- Audit hangs or times out
- Very slow execution

**Solutions:**

1. **Add timeout:**
   ```javascript
   const results = await page.evaluate(async () => {
     return Promise.race([
       axe.run(),
       new Promise((_, reject) => 
         setTimeout(() => reject(new Error('Timeout')), 30000)
       )
     ]);
   });
   ```

2. **Limit scope:**
   ```javascript
   const results = await page.evaluate(async () => {
     return await axe.run('#main-content');  // Specific element only
   });
   ```

---

## Screenshot Capture Issues

### Issue: "Screenshot file too large"

**Symptoms:**
- Screenshot > 5MB
- Slow to capture/save

**Solutions:**

1. **Reduce viewport:**
   ```javascript
   const context = await browser.newContext({
     viewport: { width: 1280, height: 720 }  // Smaller viewport
   });
   ```

2. **Use JPEG instead of PNG:**
   ```javascript
   await page.screenshot({ 
     path: screenshotPath,
     type: 'jpeg',
     quality: 80
   });
   ```

3. **Capture specific element:**
   ```javascript
   const element = await page.$('#main-content');
   await element.screenshot({ path: screenshotPath });
   ```

---

### Issue: "Screenshots missing elements"

**Symptoms:**
- Modal/overlay not captured
- Dynamic content missing

**Solutions:**

1. **Wait for specific elements:**
   ```javascript
   await page.waitForSelector('.modal', { state: 'visible' });
   await page.screenshot({ path: screenshotPath });
   ```

2. **Trigger interactions:**
   ```javascript
   // Open modal before screenshot
   await page.click('button[data-open-modal]');
   await page.waitForTimeout(500);
   await page.screenshot({ path: screenshotPath });
   ```

---

## Report Generation Problems

### Issue: "Permission denied writing report"

**Symptoms:**
```
Error: EACCES: permission denied
```

**Solutions:**

1. **Check directory permissions:**
   ```bash
   ls -la dashboard/.claude/reports/design-review/
   chmod 755 dashboard/.claude/reports/design-review/
   ```

2. **Create directory:**
   ```bash
   mkdir -p dashboard/.claude/reports/design-review
   ```

---

### Issue: "Report formatting broken"

**Symptoms:**
- Markdown not rendering properly
- Tables broken
- Links not working

**Solutions:**

1. **Check markdown syntax:**
   - Tables need proper alignment
   - Links need proper format `[text](url)`

2. **Use markdown linter:**
   ```bash
   npm install -g markdownlint-cli
   markdownlint dashboard/.claude/reports/design-review/*.md
   ```

---

## Configuration Issues

### Issue: "Configuration file not found"

**Symptoms:**
```
Configuration not found: dashboard/.claude/design-review.json
```

**Solutions:**

1. **Create configuration:**
   ```bash
   mkdir -p dashboard/.claude
   # Copy default configuration
   cp .claude/design-review.json dashboard/.claude/
   ```

2. **Verify path:**
   ```bash
   ls -la dashboard/.claude/design-review.json
   ```

---

### Issue: "Invalid configuration format"

**Symptoms:**
```
SyntaxError: Unexpected token
JSON Parse error
```

**Solutions:**

1. **Validate JSON:**
   ```bash
   # Use JSON validator
   cat dashboard/.claude/design-review.json | jq .
   ```

2. **Check for common errors:**
   - Trailing commas
   - Missing quotes
   - Incorrect boolean values (`true` not `"true"`)

---

## Performance Problems

### Issue: "Tests running too slowly"

**Symptoms:**
- E2E tests take > 30 seconds
- Individual tests timeout

**Solutions:**

1. **Run in parallel:**
   ```javascript
   // Test multiple components concurrently
   await Promise.all(
     components.map(c => testComponent(browser, c, results))
   );
   ```

2. **Reduce wait times:**
   ```javascript
   // Only wait what's necessary
   await page.goto(url, { waitUntil: 'domcontentloaded' });
   ```

3. **Disable unnecessary features:**
   ```javascript
   const browser = await chromium.launch({
     headless: true,
     args: ['--disable-gpu', '--no-sandbox']
   });
   ```

---

### Issue: "Memory issues"

**Symptoms:**
```
JavaScript heap out of memory
```

**Solutions:**

1. **Increase memory:**
   ```bash
   NODE_OPTIONS=--max_old_space_size=4096 node test-design-review-e2e.js
   ```

2. **Close contexts:**
   ```javascript
   // Always close contexts after use
   await context.close();
   ```

3. **Reuse browser instance:**
   ```javascript
   // Use single browser for all tests
   const browser = await chromium.launch();
   // ... run all tests
   await browser.close();
   ```

---

## Edge Cases

### Issue: Large Components

**Problem:** Components with 1000+ elements

**Solution:**
```javascript
// Limit audit scope
const results = await page.evaluate(async () => {
  return await axe.run({
    runOnly: ['wcag2a', 'wcag2aa'],  // Limit rules
    resultTypes: ['violations']       // Only violations
  });
});
```

---

### Issue: Dynamic/Animated Content

**Problem:** Content that changes or animates

**Solution:**
```javascript
// Wait for animations to complete
await page.evaluate(() => {
  return new Promise(resolve => {
    setTimeout(resolve, 1000);  // Wait 1s after load
  });
});

// Disable animations
await page.addStyleTag({
  content: `
    *, *::before, *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }
  `
});
```

---

### Issue: Authentication Required

**Problem:** Components behind login

**Solution:**
```javascript
// Login first
await page.goto(`${baseUrl}/login`);
await page.fill('[name="email"]', 'test@example.com');
await page.fill('[name="password"]', 'password');
await page.click('button[type="submit"]');
await page.waitForNavigation();

// Then test component
await page.goto(`${baseUrl}/dashboard`);
```

---

### Issue: Multi-page Workflows

**Problem:** Component spans multiple pages

**Solution:**
```javascript
// Test each step
const steps = [
  { name: 'Step 1', url: '/onboarding/step1' },
  { name: 'Step 2', url: '/onboarding/step2' },
  { name: 'Step 3', url: '/onboarding/step3' }
];

for (const step of steps) {
  await page.goto(`${baseUrl}${step.url}`);
  const results = await runAccessibilityAudit(page);
  // ... generate report for each step
}
```

---

## Quick Reference

### Check System Status
```bash
# Dev server running?
curl -I http://localhost:5173

# Playwright installed?
npx playwright --version

# Configuration valid?
cat dashboard/.claude/design-review.json | jq .
```

### Run Tests
```bash
# Integration test
node test-dashboard-integration.js

# Single component
node test-dashboard-review.js

# E2E suite
node test-design-review-e2e.js
```

### View Results
```bash
# List reports
ls -lt dashboard/.claude/reports/design-review/*.md

# View latest report
cat $(ls -t dashboard/.claude/reports/design-review/*.md | head -1)

# View screenshots
open dashboard/.claude/reports/design-review/screenshots/
```

---

## Getting Help

### Debug Mode
```bash
# Enable verbose logging
DEBUG=pw:api node test-design-review-e2e.js
```

### Headful Mode
```javascript
// See what browser is doing
const browser = await chromium.launch({ 
  headless: false,  // Show browser window
  slowMo: 1000      // Slow down by 1 second
});
```

### Save HTML for Analysis
```javascript
// Save page HTML for debugging
const html = await page.content();
await fs.writeFile('debug-page.html', html);
```

---

**For additional support, check:**
- `DESIGN_REVIEW_COMPLETE_SUMMARY.md` - Complete system overview
- `DESIGN_REVIEW_QUICK_START.md` - Quick start guide
- `Docs/playwright-mcp.md` - Playwright documentation
- `TASK_118_DASHBOARD_INTEGRATION_GUIDE.md` - Integration guide

---

*Last updated: 2025-11-19*

