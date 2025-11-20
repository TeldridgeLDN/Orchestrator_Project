# Design Review Toolkit

**Version:** 1.0.0  
**Author:** Orchestrator Project  
**License:** MIT

A comprehensive, reusable design review system for web projects, featuring automated accessibility audits, visual regression testing, and template-specific validation (marketing sites, dashboards, etc.).

## 🎯 What This Package Does

- **Automated Design Reviews**: Run comprehensive design reviews on your web projects
- **Accessibility Audits**: WCAG 2.1 AA compliance checking with axe-core
- **Visual Regression**: Screenshot comparison across multiple viewports
- **Template-Specific Validators**: Marketing sites, dashboards, and more
- **Design System Validation**: Ensure consistency with your design tokens
- **Automated Reporting**: Generate detailed markdown reports with screenshots

## 📦 Package Contents

```
design-review-toolkit/
├── README.md                          # This file
├── package.json                       # Package configuration
├── .claude/
│   ├── workflows/design-review/       # Core workflow modules
│   │   ├── workflow.json              # Workflow orchestration
│   │   ├── accessibility-audit.js     # WCAG audits
│   │   ├── capture-screenshots.js     # Screenshot capture
│   │   ├── visual-diff.js             # Visual regression
│   │   ├── design-consistency.js      # Design system validation
│   │   └── generate-report.js         # Report generation
│   └── design-review/
│       ├── extensions/                # Template-specific validators
│       │   └── marketing/
│       │       ├── conversion-check.js
│       │       ├── copy-quality.js
│       │       └── trust-signals.js
│       └── templates/
│           ├── marketing-site.json    # Marketing site template
│           └── dashboard.json         # Dashboard template
├── test-runners/
│   ├── e2e-test.js                    # E2E test runner
│   └── portfolio-test.js              # Marketing site test runner
└── config-examples/
    ├── marketing-site-config.json     # Example: Marketing site
    ├── dashboard-config.json          # Example: Dashboard
    └── basic-config.json              # Minimal config
```

## 🚀 Quick Start

### 1. Install in Your Project

**Option A: Copy Directly**
```bash
# From your sibling project
cp -r /path/to/Orchestrator_Project/packages/design-review-toolkit .claude/design-review-toolkit
```

**Option B: Symlink (for development)**
```bash
ln -s /path/to/Orchestrator_Project/packages/design-review-toolkit .claude/design-review-toolkit
```

**Option C: Git Submodule**
```bash
git submodule add <orchestrator-repo-url> .claude/design-review-toolkit
git submodule update --init
```

### 2. Install Dependencies

```bash
npm install --save-dev playwright axe-core
```

### 3. Create Your Config

Copy an example config to your project:

```bash
# For a marketing site
cp .claude/design-review-toolkit/config-examples/marketing-site-config.json .claude/design-review.json

# For a dashboard
cp .claude/design-review-toolkit/config-examples/dashboard-config.json .claude/design-review.json
```

### 4. Customize Your Config

Edit `.claude/design-review.json`:

```json
{
  "template": "marketing-site",
  "extends": [".claude/design-review-toolkit/.claude/design-review/templates/marketing-site.json"],
  "project": {
    "name": "my-awesome-project",
    "framework": "react"
  },
  "devServer": {
    "defaultUrl": "http://localhost:3000"
  }
}
```

### 5. Run Design Review

```bash
# Copy test runner
cp .claude/design-review-toolkit/test-runners/portfolio-test.js test-design-review.js

# Run it
node test-design-review.js
```

## 📋 Configuration Guide

### Minimal Configuration

```json
{
  "template": "basic",
  "project": {
    "name": "my-project"
  },
  "devServer": {
    "defaultUrl": "http://localhost:3000"
  },
  "checks": {
    "accessibility": {
      "enabled": true
    }
  }
}
```

### Full Configuration Options

See `config-examples/marketing-site-config.json` for a comprehensive example.

#### Key Configuration Sections

**Project Info**
```json
{
  "project": {
    "name": "my-project",
    "type": "marketing-site",
    "framework": "react",
    "description": "Landing page for product",
    "targetAudience": "B2B SaaS founders"
  }
}
```

**Accessibility Checks**
```json
{
  "checks": {
    "accessibility": {
      "enabled": true,
      "wcagLevel": "AA",
      "blockOnCritical": false,
      "rules": [
        "color-contrast",
        "alt-text",
        "aria-attributes"
      ]
    }
  }
}
```

**Visual Regression**
```json
{
  "checks": {
    "visualRegression": {
      "enabled": true,
      "threshold": 0.1,
      "captureViewports": [
        { "width": 375, "height": 667, "name": "mobile" },
        { "width": 1280, "height": 720, "name": "desktop" }
      ]
    }
  }
}
```

**Conversion Optimization (Marketing Sites)**
```json
{
  "checks": {
    "conversionOptimization": {
      "enabled": true,
      "thresholds": {
        "loadTime": 3000,
        "maxFormFields": 1,
        "minCtaSize": { "width": 140, "height": 48 }
      }
    }
  }
}
```

**Copy Quality (Marketing Sites)**
```json
{
  "checks": {
    "copyQuality": {
      "enabled": true,
      "thresholds": {
        "fleschKincaid": 65,
        "maxJargonWords": 3
      },
      "jargonList": ["leverage", "synergy", "paradigm"]
    }
  }
}
```

## 🎨 Design System Integration

Define your design system for automated consistency checks:

```json
{
  "designSystem": {
    "name": "My Design System",
    "version": "1.0.0",
    "colorPalette": {
      "primary": {
        "value": "#0066CC",
        "usage": "Primary CTA backgrounds"
      }
    },
    "typography": {
      "fontFamilies": {
        "headings": {
          "family": "Inter",
          "weight": "700"
        }
      }
    },
    "components": {
      "button": {
        "primary": {
          "background": "#0066CC",
          "minHeight": "48px"
        }
      }
    }
  }
}
```

## 🧪 Testing Modes

### E2E Test Runner

For comprehensive multi-component testing:

```bash
node test-design-review.js
```

Features:
- Tests multiple components/views
- Parallel execution
- Detailed per-component reports
- Overall summary report

### Portfolio/Marketing Test Runner

Specialized for marketing sites:

```bash
node test-portfolio-design-review.js
```

Features:
- Marketing-specific validators
- Conversion optimization checks
- Copy quality analysis
- Trust signal validation

### Custom Test Runner

Create your own test runner:

```javascript
import { chromium } from 'playwright';
import fs from 'fs/promises';

// Load config
const config = JSON.parse(await fs.readFile('.claude/design-review.json', 'utf-8'));

// Import modules
const accessibilityAudit = await import('./.claude/design-review-toolkit/.claude/workflows/design-review/accessibility-audit.js');
const captureScreenshots = await import('./.claude/design-review-toolkit/.claude/workflows/design-review/capture-screenshots.js');

// Your custom test logic
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(config.devServer.defaultUrl);

// Run checks
const a11yResults = await accessibilityAudit.default(page, config.checks.accessibility);

// Generate report
console.log(a11yResults);
```

## 📊 Report Format

Reports are generated in markdown format with the following structure:

```markdown
# Design Review: Component Name

**Date:** ISO timestamp
**Status:** ✅ Pass / ❌ Fail

## Results

| Metric | Value |
|--------|-------|
| Accessibility Score | 95/100 |
| Total Violations | 2 |
| Screenshot | [View](path/to/screenshot.png) |

## Detailed Findings

### 1. Color Contrast Issue
- **Impact:** serious
- **Description:** Elements must have sufficient color contrast
- **Learn More:** [WCAG Guide](...)

## Recommendations

- Fix color contrast on CTA buttons
- Add alt text to hero image
```

## 🔌 Extending the Toolkit

### Adding Custom Validators

1. Create a new validator file:

```javascript
// .claude/design-review/extensions/my-validator/custom-check.js

export async function checkCustomRule(page, config) {
  const results = {
    issues: [],
    measurements: {},
    summary: { total: 0, critical: 0, warnings: 0 }
  };
  
  // Your validation logic
  const elements = await page.$$('[data-custom]');
  
  if (elements.length === 0) {
    results.issues.push({
      severity: 'critical',
      message: 'Missing custom elements',
      recommendation: 'Add data-custom attributes'
    });
    results.summary.critical++;
  }
  
  results.summary.total = results.issues.length;
  return results;
}
```

2. Add to your test runner:

```javascript
const customCheck = await import('./.claude/design-review/extensions/my-validator/custom-check.js');
const customResults = await customCheck.checkCustomRule(page, config);
```

### Creating Custom Templates

1. Create template config:

```json
{
  "$schema": "https://orchestrator.ai/schemas/design-review-v1.json",
  "name": "e-commerce-site",
  "version": "1.0.0",
  "description": "Design review template for e-commerce sites",
  "checks": {
    "accessibility": {
      "enabled": true,
      "wcagLevel": "AA"
    },
    "productPageOptimization": {
      "enabled": true,
      "rules": ["add-to-cart-visible", "price-clear", "reviews-present"]
    }
  }
}
```

2. Reference in project config:

```json
{
  "extends": [".claude/design-review-toolkit/.claude/design-review/templates/e-commerce-site.json"]
}
```

## 🤝 Integration with Other Tools

### Git Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "Running design review..."
node test-design-review.js

if [ $? -ne 0 ]; then
  echo "Design review failed. Commit blocked."
  exit 1
fi
```

### CI/CD Integration

**GitHub Actions:**
```yaml
name: Design Review
on: [pull_request]
jobs:
  design-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run dev &
      - run: sleep 10
      - run: node test-design-review.js
      - uses: actions/upload-artifact@v2
        with:
          name: design-review-reports
          path: .claude/reports/design-review/
```

### NPM Scripts

```json
{
  "scripts": {
    "design-review": "node test-design-review.js",
    "design-review:watch": "nodemon test-design-review.js",
    "design-review:marketing": "node test-portfolio-design-review.js"
  }
}
```

## 🐛 Troubleshooting

### Dev Server Not Running

```
❌ Failed to load page. Is the dev server running?
```

**Solution:** Start your dev server first:
```bash
npm run dev
# or
npm start
```

### Playwright Not Installed

```
Error: Cannot find module 'playwright'
```

**Solution:**
```bash
npm install --save-dev playwright
npx playwright install
```

### Screenshots Not Saving

Check permissions on the reports directory:
```bash
mkdir -p .claude/reports/design-review/screenshots
chmod -R 755 .claude/reports
```

### Config Not Loading

Verify your config path matches the test runner:
```javascript
// In test runner
const configPath = path.join(__dirname, '.claude/design-review.json');
```

## 📚 Examples

### Example 1: Basic Accessibility Check

```javascript
import { chromium } from 'playwright';
import accessibilityAudit from './.claude/design-review-toolkit/.claude/workflows/design-review/accessibility-audit.js';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:3000');

const results = await accessibilityAudit.default(page, {
  wcagLevel: 'AA',
  rules: ['color-contrast', 'alt-text']
});

console.log(`Violations: ${results.summary.totalViolations}`);
await browser.close();
```

### Example 2: Marketing Site Review

```javascript
import conversionCheck from './.claude/design-review-toolkit/.claude/design-review/extensions/marketing/conversion-check.js';
import copyQualityCheck from './.claude/design-review-toolkit/.claude/design-review/extensions/marketing/copy-quality.js';

const conversionResults = await conversionCheck.checkConversion(page, config.checks.conversionOptimization);
const copyResults = await copyQualityCheck.checkCopyQuality(page, config.checks.copyQuality);

console.log(`Conversion Score: ${conversionResults.summary.critical === 0 ? 'Pass' : 'Fail'}`);
console.log(`Readability Score: ${copyResults.measurements.readabilityScore}`);
```

## 🎓 Best Practices

1. **Run Reviews Early and Often**: Integrate into your development workflow, not just at the end
2. **Customize for Your Project**: Don't enable every check - focus on what matters for your use case
3. **Set Realistic Thresholds**: Start with lenient thresholds and tighten over time
4. **Review Reports Together**: Design reviews are conversation starters, not final verdicts
5. **Keep Baselines Updated**: Update visual regression baselines after intentional design changes
6. **Version Your Config**: Track config changes in git to understand how standards evolve

## 🔄 Version History

### 1.0.0 (2025-11-20)
- Initial package creation
- Core workflow modules (accessibility, visual regression, consistency)
- Marketing site template with conversion/copy/trust validators
- E2E and portfolio test runners
- Comprehensive configuration system

## 🤝 Contributing

To contribute improvements back to the toolkit:

1. Make changes in `Orchestrator_Project/packages/design-review-toolkit`
2. Test in your sibling project
3. Commit to Orchestrator_Project repo
4. Other projects can pull updates via git submodule or manual copy

## 📄 License

MIT License - feel free to use in any project

## 🆘 Support

For issues or questions:
- Check the troubleshooting section above
- Review example configs in `config-examples/`
- Examine test runners in `test-runners/`
- Refer to the Orchestrator Project documentation

---

**Built with ❤️ by the Orchestrator Project Team**

