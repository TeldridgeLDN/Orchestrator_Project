# Design Review Toolkit Package

**Created:** 2025-11-20  
**Location:** `/packages/design-review-toolkit/`  
**Status:** ✅ Ready for use in sibling projects

---

## 📦 What Was Created

A comprehensive, reusable design review system packaged for easy deployment to any sibling project. This toolkit consolidates all design review infrastructure from the Orchestrator Project into a single, portable package.

## 🎯 Purpose

Enable any web project (marketing sites, dashboards, web apps) to run automated design reviews with:
- Accessibility audits (WCAG 2.1 AA)
- Visual regression testing
- Design system consistency checks
- Template-specific validators (marketing, dashboard, etc.)
- Automated report generation

## 📂 Package Structure

```
packages/design-review-toolkit/
├── README.md                              # Main documentation (comprehensive)
├── INSTALL.md                             # Installation guide (3 options)
├── USAGE.md                               # Usage patterns and examples
├── LICENSE                                # MIT License
├── package.json                           # Package metadata
│
├── .claude/
│   ├── workflows/design-review/           # Core workflow modules
│   │   ├── index.js                       # Main entry point / API
│   │   ├── workflow.json                  # Orchestration config
│   │   ├── accessibility-audit.js         # WCAG audits with axe-core
│   │   ├── capture-screenshots.js         # Multi-viewport screenshots
│   │   ├── visual-diff.js                 # Visual regression testing
│   │   ├── design-consistency.js          # Design system validation
│   │   └── generate-report.js             # Markdown report generation
│   │
│   └── design-review/
│       ├── extensions/                    # Template-specific validators
│       │   └── marketing/
│       │       ├── conversion-check.js    # CTA placement, form optimization
│       │       ├── copy-quality.js        # Readability, jargon detection
│       │       └── trust-signals.js       # Testimonials, privacy policy
│       └── templates/
│           └── marketing-site.json        # Marketing site template config
│
├── test-runners/
│   ├── e2e-test.js                        # Multi-component E2E test runner
│   └── portfolio-test.js                  # Marketing site test runner
│
└── config-examples/
    ├── basic-config.json                  # Minimal configuration
    ├── dashboard-config.json              # Dashboard app config
    └── marketing-site-config.json         # Marketing site config (full)
```

## 🚀 Quick Start for Sibling Projects

### 1. Install (Choose One Method)

**Direct Copy (Most Common):**
```bash
cp -r /path/to/Orchestrator_Project/packages/design-review-toolkit .claude/design-review-toolkit
npm install --save-dev playwright axe-core
npx playwright install
```

**Symlink (For Active Development):**
```bash
ln -s /path/to/Orchestrator_Project/packages/design-review-toolkit .claude/design-review-toolkit
npm install --save-dev playwright axe-core
npx playwright install
```

**Git Submodule (For Version Control):**
```bash
git submodule add <orchestrator-repo-url> vendor/orchestrator
ln -s ../vendor/orchestrator/packages/design-review-toolkit .claude/design-review-toolkit
npm install --save-dev playwright axe-core
npx playwright install
```

### 2. Configure

```bash
# For a marketing site
cp .claude/design-review-toolkit/config-examples/marketing-site-config.json .claude/design-review.json

# For a dashboard
cp .claude/design-review-toolkit/config-examples/dashboard-config.json .claude/design-review.json

# For a basic web app
cp .claude/design-review-toolkit/config-examples/basic-config.json .claude/design-review.json
```

Edit `.claude/design-review.json` to match your project:
- Update `project.name` and `project.framework`
- Update `devServer.defaultUrl`
- Enable/disable checks as needed

### 3. Run

```bash
# Copy test runner
cp .claude/design-review-toolkit/test-runners/portfolio-test.js test-design-review.js

# Start dev server
npm run dev &

# Run design review
node test-design-review.js

# View reports
ls -la .claude/reports/design-review/
```

## 📋 Key Features

### Core Workflow Modules

1. **Accessibility Audit** (`accessibility-audit.js`)
   - WCAG 2.1 AA compliance checking
   - Powered by axe-core
   - Severity scoring (critical/serious/moderate/minor)
   - Detailed violation reports with help links

2. **Screenshot Capture** (`capture-screenshots.js`)
   - Multi-viewport support (mobile, tablet, desktop, wide)
   - Full-page and viewport screenshots
   - Baseline creation for visual regression

3. **Visual Diff** (`visual-diff.js`)
   - Compare screenshots with baselines
   - Configurable diff threshold
   - Ignore regions for dynamic content

4. **Design Consistency** (`design-consistency.js`)
   - Design system validation
   - Color palette compliance
   - Typography hierarchy checking
   - Component consistency

5. **Report Generation** (`generate-report.js`)
   - Markdown format with embedded screenshots
   - Grouped by category and severity
   - Actionable recommendations
   - Timestamp and metadata

### Template-Specific Extensions

**Marketing Site Validators:**

1. **Conversion Optimization** (`conversion-check.js`)
   - CTA above-the-fold detection
   - Form field count optimization
   - Load time validation
   - Mobile CTA accessibility

2. **Copy Quality** (`copy-quality.js`)
   - Flesch-Kincaid readability score
   - Jargon detection (configurable list)
   - Action-oriented CTA validation
   - Headline clarity checks

3. **Trust Signals** (`trust-signals.js`)
   - Testimonial validation (names, companies, photos)
   - Privacy policy link detection
   - Fake urgency pattern detection
   - Social proof validation

### Configuration System

- **Template inheritance** via `extends` field
- **Design system definition** with color, typography, components
- **Per-check configuration** with thresholds and severity levels
- **Environment-specific configs** (dev vs. CI)
- **Team-specific rules** with assignee tracking

## 🎨 Use Cases by Project Type

### Marketing Sites / Landing Pages
- **Primary Checks:** Conversion, Copy Quality, Trust Signals, Accessibility
- **Template:** `marketing-site-config.json`
- **Test Runner:** `portfolio-test.js`
- **Key Metrics:** Conversion rate, readability score, trust signals present

### Dashboards / Internal Apps
- **Primary Checks:** Accessibility, Design Consistency
- **Template:** `dashboard-config.json`
- **Test Runner:** `e2e-test.js`
- **Key Metrics:** Accessibility score, component consistency

### Public Web Apps
- **Primary Checks:** Accessibility, Visual Regression, Design Consistency
- **Template:** `basic-config.json`
- **Test Runner:** `e2e-test.js`
- **Key Metrics:** Accessibility score, visual diff percentage

## 🔌 Integration Options

### Pre-commit Hook
```bash
#!/bin/sh
node test-design-review.js || exit 1
```

### CI/CD (GitHub Actions)
```yaml
- name: Design Review
  run: node test-design-review.js
- uses: actions/upload-artifact@v3
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
    "precommit": "npm run design-review"
  }
}
```

### VS Code Task
```json
{
  "label": "Design Review",
  "type": "shell",
  "command": "node test-design-review.js"
}
```

## 📊 Output

### Console Output
```
🎨 Portfolio-Redesign Design Review
=====================================

📍 Testing URL: http://localhost:4321/validate/
📋 Template: marketing-site
⚙️  Framework: astro

♿ Running Accessibility Audit (WCAG 2.1 AA)...
   Total Violations: 2
   Critical: 0
   Serious: 1
   Passes: 45
   ✅ All WCAG checks passed!

🔄 Running Conversion Optimization Check...
   Total Issues: 1
   Critical: 0
   Serious: 1
   Warnings: 0
   ⚠️  1 serious issues found

📝 Running Copy Quality Check...
   Readability Score: 68.2
   Word Count: 324
   Total Issues: 0
   ✅ Copy quality excellent!

🔐 Running Trust Signals Check...
   Testimonials Found: 3
   Total Issues: 0
   ✅ Trust signals strong!

📸 Capturing Screenshots...
   ✅ Screenshot saved: validate-page-1763560679283.png

=====================================
📊 DESIGN REVIEW SUMMARY

♿ Accessibility: 2 violations (0 critical)
🔄 Conversion: 1 issues (0 critical)
📝 Copy Quality: 0 issues (Score: 68.2)
🔐 Trust Signals: 0 issues (0 critical)

✅ Status: EXCELLENT - No issues found!

📄 Full report saved: portfolio-redesign/.claude/reports/design-review/review-1763560679557.json
```

### Markdown Reports
Generated in `.claude/reports/design-review/`:
- `review-{timestamp}.md` - Full review report
- `{ComponentName}-{timestamp}.md` - Per-component reports
- `e2e-test-{timestamp}.md` - E2E test suite summary

### Screenshots
Saved in `.claude/reports/design-review/screenshots/`:
- `{page}-{timestamp}.png` - Current screenshots
- Baselines in `baselines/` for visual regression

## 🛠️ Customization

### Add Custom Validator

```javascript
// .claude/design-review/extensions/custom/my-check.js
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

### Create Custom Template

```json
{
  "$schema": "https://orchestrator.ai/schemas/design-review-v1.json",
  "name": "e-commerce-site",
  "version": "1.0.0",
  "checks": {
    "accessibility": { "enabled": true },
    "productPageOptimization": { "enabled": true }
  }
}
```

## 📚 Documentation

- **README.md** - Comprehensive overview, features, configuration reference
- **INSTALL.md** - Installation guide with 3 methods (copy, symlink, submodule)
- **USAGE.md** - Usage patterns, advanced examples, best practices
- **LICENSE** - MIT License

## 🔄 Version Management

### Current Version: 1.0.0

**Contents:**
- Core workflow modules (accessibility, visual regression, consistency)
- Marketing site template with 3 validators
- Dashboard template (basic)
- E2E and portfolio test runners
- Comprehensive configuration system
- Full documentation suite

### Updating the Toolkit

**For projects using direct copy:**
```bash
# Pull latest version
cp -r /path/to/Orchestrator_Project/packages/design-review-toolkit .claude/design-review-toolkit
```

**For projects using symlink:**
```bash
# Already updated automatically
```

**For projects using git submodule:**
```bash
cd vendor/orchestrator
git pull origin main
cd ../..
git add vendor/orchestrator
git commit -m "Update design review toolkit"
```

## 🎓 Best Practices

1. **Start Small:** Begin with accessibility checks only, add more over time
2. **Run Frequently:** Integrate into development workflow, not just pre-launch
3. **Establish Baselines:** Capture baseline screenshots for visual regression
4. **Document Decisions:** When skipping checks, document why in config
5. **Track Progress:** Monitor scores over time to measure improvement
6. **Team Ownership:** Assign different check categories to appropriate teams

## 🆘 Troubleshooting

### Common Issues

**Dev server not running:**
```bash
npm run dev &
sleep 5
node test-design-review.js
```

**Playwright not installed:**
```bash
npm install --save-dev playwright
npx playwright install
```

**Config not found:**
```bash
cp .claude/design-review-toolkit/config-examples/basic-config.json .claude/design-review.json
```

**Import path errors:**
Update paths in test runner to match your installation location

## 🤝 Contributing Back to the Toolkit

If you improve the toolkit in your project:

1. Make changes in `Orchestrator_Project/packages/design-review-toolkit`
2. Test in your sibling project
3. Commit to Orchestrator_Project repo
4. Other projects can pull updates

## 🎉 Success Metrics

**After implementing this toolkit, you can track:**
- Accessibility score trends over time
- Conversion optimization compliance
- Copy quality improvements
- Trust signal presence
- Visual consistency maintenance
- Design system adherence

**Example Goals:**
- Maintain 90+ accessibility score
- Zero critical issues in production
- 65+ Flesch-Kincaid readability
- 3+ testimonials with complete info
- < 5% visual regression between releases

## 🔮 Future Enhancements

Potential additions to the toolkit:

1. **Additional Templates**
   - E-commerce sites
   - SaaS applications
   - Blog/content sites
   - Documentation sites

2. **More Validators**
   - Performance metrics (Core Web Vitals)
   - SEO optimization
   - Mobile responsiveness
   - Cross-browser compatibility

3. **Enhanced Reporting**
   - HTML reports with interactive charts
   - Trend analysis over time
   - Team-specific dashboards
   - Slack/Discord notifications

4. **AI-Powered Features**
   - Automated fix suggestions
   - Copy improvement recommendations
   - Design anomaly detection

## 📞 Support

For issues or questions:
- Check the comprehensive documentation in `README.md`
- Review installation guide in `INSTALL.md`
- Explore usage patterns in `USAGE.md`
- Examine example configs in `config-examples/`
- Reference test runners in `test-runners/`

---

**Built with ❤️ by the Orchestrator Project Team**

*Last Updated: 2025-11-20*

