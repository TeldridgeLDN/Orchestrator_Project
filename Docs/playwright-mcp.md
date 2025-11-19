# Playwright MCP - Design Review Integration

**Version:** 1.0.0  
**Last Updated:** 2025-11-19  
**Status:** Production Ready

---

## Overview

Playwright MCP (Model Context Protocol) provides browser automation capabilities for the Orchestrator's design review workflow. It enables automated visual testing, accessibility audits, and screenshot capture for frontend components.

### Key Capabilities

- 🌐 **Multi-Browser Support:** Chromium, Firefox, and WebKit
- 📸 **Screenshot Capture:** Full page and element-specific screenshots
- ♿ **Accessibility Audits:** Integration with axe-core for WCAG compliance
- 🎯 **Element Interaction:** Wait for elements, click, type, navigate
- 📱 **Responsive Testing:** Test multiple viewport sizes
- 🔄 **Context Isolation:** Separate browser contexts for parallel testing

---

## Installation

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Install Playwright

```bash
npm install --save-dev playwright @playwright/test
```

### Configure MCP Server

Update `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp-server"]
    }
  }
}
```

### Verify Installation

```bash
node test-playwright-mcp.js
```

Expected output:
```
🎭 Playwright MCP Test Script
================================

1️⃣  Testing browser launch...
   ✅ Browser launched successfully

2️⃣  Testing page navigation...
   ✅ Navigation successful

3️⃣  Testing screenshot capture...
   ✅ Screenshot captured successfully

4️⃣  Testing accessibility scanning...
   ✅ Accessibility scan completed

🎯 Score: 4/4 tests passed
```

---

## Usage

### Basic Browser Automation

```javascript
import { PlaywrightHelper } from './.claude/utils/playwright-helper.js';

// Launch browser
const browser = await PlaywrightHelper.launchBrowser('chromium', {
  headless: true
});

// Create page
const context = await browser.newContext();
const page = await context.newPage();

// Navigate
await PlaywrightHelper.navigateAndWait(page, 'http://localhost:3000');

// Capture screenshot
await PlaywrightHelper.captureScreenshot(
  page,
  './screenshots/homepage.png',
  { fullPage: true }
);

// Cleanup
await browser.close();
```

### Accessibility Testing

```javascript
import { PlaywrightHelper } from './.claude/utils/playwright-helper.js';

const browser = await PlaywrightHelper.launchBrowser();
const page = await browser.newPage();
await page.goto('http://localhost:3000');

// Run accessibility audit
const results = await PlaywrightHelper.runAccessibilityAudit(page);

console.log(`Violations: ${results.violations.length}`);
console.log(`Passes: ${results.passes.length}`);

// Print violations
results.violations.forEach(violation => {
  console.log(`\n${violation.id}: ${violation.description}`);
  console.log(`Impact: ${violation.impact}`);
  console.log(`Help: ${violation.helpUrl}`);
});

await browser.close();
```

### Responsive Screenshots

```javascript
import { PlaywrightHelper } from './.claude/utils/playwright-helper.js';

const browser = await PlaywrightHelper.launchBrowser();
const page = await browser.newPage();
await page.goto('http://localhost:3000');

// Capture at multiple viewport sizes
const screenshots = await PlaywrightHelper.captureResponsiveScreenshots(
  page,
  './screenshots/homepage',
  [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ]
);

console.log('Screenshots captured:', screenshots);
await browser.close();
```

### Design Review Workflow

The design review hook automatically uses Playwright when triggered:

```bash
# Make changes to component
vim dashboard/src/components/Hero.tsx

# Stage changes
git add dashboard/src/components/Hero.tsx

# Commit triggers design review
git commit -m "feat: update Hero component"

# Playwright automatically:
# 1. Launches browser
# 2. Navigates to component route
# 3. Captures screenshot
# 4. Runs accessibility audit
# 5. Generates report
```

---

## API Reference

### PlaywrightHelper Class

#### `launchBrowser(browserType, options)`

Launch a browser instance.

**Parameters:**
- `browserType` (string): 'chromium', 'firefox', or 'webkit'
- `options` (object): Browser launch options

**Returns:** `Promise<Browser>`

**Example:**
```javascript
const browser = await PlaywrightHelper.launchBrowser('chromium', {
  headless: true,
  timeout: 30000
});
```

#### `captureScreenshot(page, path, options)`

Capture a screenshot of the current page.

**Parameters:**
- `page` (Page): Playwright page object
- `path` (string): File path to save screenshot
- `options` (object): Screenshot options

**Returns:** `Promise<Buffer>`

**Options:**
- `fullPage` (boolean): Capture entire scrollable page
- `type` ('png' | 'jpeg'): Image format
- `quality` (number): JPEG quality (0-100)

**Example:**
```javascript
await PlaywrightHelper.captureScreenshot(
  page,
  './screenshot.png',
  { fullPage: true, type: 'png' }
);
```

#### `navigateAndWait(page, url, options)`

Navigate to URL and wait for page load.

**Parameters:**
- `page` (Page): Playwright page object
- `url` (string): URL to navigate to
- `options` (object): Navigation options

**Returns:** `Promise<Response>`

**Options:**
- `waitUntil` ('load' | 'domcontentloaded' | 'networkidle'): When to consider navigation succeeded
- `timeout` (number): Maximum time in milliseconds

**Example:**
```javascript
await PlaywrightHelper.navigateAndWait(
  page,
  'http://localhost:3000',
  { waitUntil: 'networkidle' }
);
```

#### `runAccessibilityAudit(page, options)`

Run axe-core accessibility audit on current page.

**Parameters:**
- `page` (Page): Playwright page object
- `options` (object): axe-core options

**Returns:** `Promise<object>` - Accessibility results

**Example:**
```javascript
const results = await PlaywrightHelper.runAccessibilityAudit(page);

// Result structure:
{
  violations: [...],  // Array of violations
  passes: [...],      // Array of passed checks
  incomplete: [...]   // Array of incomplete checks
}
```

#### `waitForElement(page, selector, options)`

Wait for an element to be visible.

**Parameters:**
- `page` (Page): Playwright page object
- `selector` (string): CSS selector
- `options` (object): Wait options

**Returns:** `Promise<ElementHandle>`

**Example:**
```javascript
const element = await PlaywrightHelper.waitForElement(
  page,
  '.hero-section',
  { timeout: 10000 }
);
```

#### `captureResponsiveScreenshots(page, basePath, viewports)`

Capture screenshots at multiple viewport sizes.

**Parameters:**
- `page` (Page): Playwright page object
- `basePath` (string): Base path for screenshots
- `viewports` (Array): Array of viewport configurations

**Returns:** `Promise<Array<string>>` - Array of screenshot paths

**Example:**
```javascript
const screenshots = await PlaywrightHelper.captureResponsiveScreenshots(
  page,
  './screenshots/homepage',
  [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'desktop', width: 1920, height: 1080 }
  ]
);
```

#### `checkDevServer(url, timeout)`

Check if a development server is running.

**Parameters:**
- `url` (string): Server URL to check
- `timeout` (number): Timeout in milliseconds (default: 5000)

**Returns:** `Promise<boolean>`

**Example:**
```javascript
const isRunning = await PlaywrightHelper.checkDevServer(
  'http://localhost:3000'
);
```

---

## Configuration

### Browser Options

Common browser launch options:

```javascript
{
  headless: true,              // Run without UI
  timeout: 30000,              // Launch timeout (ms)
  slowMo: 100,                 // Slow down operations (ms)
  devtools: false,             // Open DevTools
  args: ['--disable-gpu'],     // Additional CLI args
  executablePath: '/path/to/browser'  // Custom browser path
}
```

### Context Options

Browser context configuration:

```javascript
{
  viewport: {
    width: 1280,
    height: 720
  },
  userAgent: 'Custom User Agent',
  locale: 'en-US',
  timezoneId: 'America/New_York',
  geolocation: { latitude: 40.7128, longitude: -74.0060 },
  permissions: ['geolocation']
}
```

---

## Troubleshooting

### Browser Not Launching

**Problem:** `Error: Failed to launch chromium browser`

**Solutions:**
1. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

2. Check system dependencies:
   ```bash
   npx playwright install-deps
   ```

3. Try different browser:
   ```javascript
   const browser = await PlaywrightHelper.launchBrowser('firefox');
   ```

### Screenshot Capture Fails

**Problem:** `Error: Failed to capture screenshot`

**Solutions:**
1. Ensure page is fully loaded:
   ```javascript
   await page.waitForLoadState('networkidle');
   await PlaywrightHelper.captureScreenshot(page, path);
   ```

2. Check file path permissions:
   ```javascript
   import fs from 'fs/promises';
   await fs.mkdir('./screenshots', { recursive: true });
   ```

### Accessibility Audit Errors

**Problem:** `Error: axe-core not loaded`

**Solutions:**
1. Check internet connection (CDN access required)
2. Use local axe-core:
   ```bash
   npm install axe-core
   ```
   ```javascript
   await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
   ```

### Navigation Timeout

**Problem:** `Error: page.goto: Timeout exceeded`

**Solutions:**
1. Increase timeout:
   ```javascript
   await page.goto(url, { timeout: 60000 });
   ```

2. Change wait condition:
   ```javascript
   await page.goto(url, { waitUntil: 'domcontentloaded' });
   ```

3. Verify dev server is running:
   ```javascript
   const isRunning = await PlaywrightHelper.checkDevServer(url);
   ```

---

## Best Practices

### 1. Resource Cleanup

Always close browsers and contexts:

```javascript
try {
  const browser = await PlaywrightHelper.launchBrowser();
  const page = await browser.newPage();
  // ... operations ...
} finally {
  await browser.close();
}
```

### 2. Parallel Execution

Use multiple contexts for parallel testing:

```javascript
const browser = await PlaywrightHelper.launchBrowser();

const [result1, result2] = await Promise.all([
  testComponent(browser, '/component-1'),
  testComponent(browser, '/component-2')
]);

await browser.close();
```

### 3. Error Handling

Implement comprehensive error handling:

```javascript
try {
  await PlaywrightHelper.navigateAndWait(page, url);
} catch (error) {
  if (error.message.includes('Timeout')) {
    console.error('Page took too long to load');
  } else {
    console.error('Navigation failed:', error.message);
  }
  throw error;
}
```

### 4. Screenshot Organization

Use consistent naming conventions:

```javascript
const timestamp = Date.now();
const componentName = 'Hero';
const screenshotPath = `./screenshots/${componentName}-${timestamp}.png`;
```

### 5. Accessibility Reporting

Log all violations with context:

```javascript
const results = await PlaywrightHelper.runAccessibilityAudit(page);

results.violations.forEach((violation, index) => {
  console.log(`\nViolation ${index + 1}:`);
  console.log(`  Rule: ${violation.id}`);
  console.log(`  Impact: ${violation.impact}`);
  console.log(`  Description: ${violation.description}`);
  console.log(`  Help: ${violation.helpUrl}`);
  console.log(`  Nodes affected: ${violation.nodes.length}`);
});
```

---

## Performance Considerations

### 1. Headless Mode

Always use headless mode in CI/CD:

```javascript
const browser = await PlaywrightHelper.launchBrowser('chromium', {
  headless: true  // Faster, uses less resources
});
```

### 2. Screenshot Optimization

Only capture what you need:

```javascript
// ❌ Slow: Full page screenshot
await page.screenshot({ path: 'full.png', fullPage: true });

// ✅ Fast: Viewport only
await page.screenshot({ path: 'viewport.png' });

// ✅ Faster: Specific element
const element = await page.$('.hero');
await element.screenshot({ path: 'hero.png' });
```

### 3. Network Optimization

Control network behavior:

```javascript
// Block unnecessary resources
await page.route('**/*.{png,jpg,jpeg,gif,svg}', route => route.abort());

// Navigate faster
await page.goto(url, { waitUntil: 'domcontentloaded' });
```

### 4. Browser Reuse

Reuse browser instances:

```javascript
// ❌ Slow: Launch browser per test
for (const url of urls) {
  const browser = await PlaywrightHelper.launchBrowser();
  // test...
  await browser.close();
}

// ✅ Fast: Launch once, reuse
const browser = await PlaywrightHelper.launchBrowser();
for (const url of urls) {
  const page = await browser.newPage();
  // test...
  await page.close();
}
await browser.close();
```

---

## Security Recommendations

### 1. Sandbox Mode

Always run with sandbox enabled (default):

```javascript
const browser = await PlaywrightHelper.launchBrowser('chromium', {
  // Don't disable sandbox in production
  // args: ['--no-sandbox']  // ❌ Insecure
});
```

### 2. URL Validation

Validate URLs before navigation:

```javascript
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

if (!isValidUrl(url)) {
  throw new Error('Invalid URL');
}
await page.goto(url);
```

### 3. Sensitive Data

Don't capture sensitive information:

```javascript
// Redact sensitive fields before screenshot
await page.evaluate(() => {
  document.querySelectorAll('[type="password"]').forEach(el => {
    el.value = '****';
  });
});
await page.screenshot({ path: 'safe-screenshot.png' });
```

---

## Integration with Design Review

The design review hook automatically uses Playwright. Configuration in `dashboard/.claude/design-review.json`:

```json
{
  "enabled": true,
  "mode": "warn",
  "checks": {
    "accessibility": true,
    "visualRegression": false,
    "designConsistency": true
  },
  "devServer": {
    "url": "http://localhost:3000",
    "autoStart": false,
    "startCommand": "pnpm dev"
  }
}
```

---

## Resources

- **Playwright Docs:** https://playwright.dev/
- **axe-core Docs:** https://github.com/dequelabs/axe-core
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **Test Script:** `test-playwright-mcp.js`
- **Helper Utility:** `.claude/utils/playwright-helper.js`
- **Design Review Hook:** `.claude/hooks/design-review.js`

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Run test script: `node test-playwright-mcp.js`
3. Review design review reports in `.claude/reports/design-review/`
4. Consult Playwright documentation

---

**Last Updated:** 2025-11-19  
**Version:** 1.0.0  
**Maintained by:** Orchestrator Project Team

