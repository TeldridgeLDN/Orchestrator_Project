# Quick Start Guide

## 5-Minute Setup

### 1. Copy Files (2 min)

```bash
# Copy toolkit
cp -r /path/to/Orchestrator_Project/packages/design-review-toolkit .claude/design-review-toolkit

# Install dependencies
npm install --save-dev playwright axe-core
npx playwright install
```

### 2. Choose Template (1 min)

**Marketing Site:**
```bash
cp .claude/design-review-toolkit/config-examples/marketing-site-config.json .claude/design-review.json
cp .claude/design-review-toolkit/test-runners/portfolio-test.js test-design-review.js
```

**Dashboard:**
```bash
cp .claude/design-review-toolkit/config-examples/dashboard-config.json .claude/design-review.json
cp .claude/design-review-toolkit/test-runners/e2e-test.js test-design-review.js
```

**Basic Web App:**
```bash
cp .claude/design-review-toolkit/config-examples/basic-config.json .claude/design-review.json
cp .claude/design-review-toolkit/test-runners/e2e-test.js test-design-review.js
```

### 3. Configure (1 min)

Edit `.claude/design-review.json`:

```json
{
  "project": {
    "name": "your-project-name",    // ← Change this
    "framework": "react"             // ← Change this
  },
  "devServer": {
    "defaultUrl": "http://localhost:3000"  // ← Change this
  }
}
```

### 4. Run (1 min)

```bash
# Start your dev server
npm run dev &

# Wait for it to start
sleep 5

# Run design review
node test-design-review.js
```

## That's It! 🎉

Reports are saved in: `.claude/reports/design-review/`

## Next Steps

- Review the generated report
- Fix any critical issues (🔴)
- Add to your workflow: `npm run design-review`
- Read full docs: `cat .claude/design-review-toolkit/README.md`

## Common Issues

**"Dev server not running"**
```bash
npm run dev &
sleep 10
node test-design-review.js
```

**"Cannot find module 'playwright'"**
```bash
npm install --save-dev playwright
npx playwright install
```

**"Config file not found"**
```bash
# Make sure you copied the config
ls -la .claude/design-review.json
```

## One-Liner Install

**For Marketing Sites:**
```bash
cp -r /path/to/Orchestrator_Project/packages/design-review-toolkit .claude/design-review-toolkit && npm install --save-dev playwright axe-core && npx playwright install && cp .claude/design-review-toolkit/config-examples/marketing-site-config.json .claude/design-review.json && cp .claude/design-review-toolkit/test-runners/portfolio-test.js test-design-review.js && echo "✅ Installed! Edit .claude/design-review.json then run: node test-design-review.js"
```

**For Dashboards:**
```bash
cp -r /path/to/Orchestrator_Project/packages/design-review-toolkit .claude/design-review-toolkit && npm install --save-dev playwright axe-core && npx playwright install && cp .claude/design-review-toolkit/config-examples/dashboard-config.json .claude/design-review.json && cp .claude/design-review-toolkit/test-runners/e2e-test.js test-design-review.js && echo "✅ Installed! Edit .claude/design-review.json then run: node test-design-review.js"
```

## NPM Scripts (Recommended)

Add to your `package.json`:

```json
{
  "scripts": {
    "design-review": "node test-design-review.js",
    "precommit": "npm run design-review"
  }
}
```

Then use:
```bash
npm run design-review
```

## What Gets Checked?

### Marketing Sites
- ♿ Accessibility (WCAG 2.1 AA)
- 🔄 Conversion Optimization
- 📝 Copy Quality
- 🔐 Trust Signals
- 📸 Visual Regression

### Dashboards/Apps
- ♿ Accessibility (WCAG 2.1 AA)
- 🎨 Design Consistency
- 📸 Visual Regression
- 🧩 Component Testing

### Basic Web Apps
- ♿ Accessibility (WCAG 2.1 AA)
- 📸 Visual Regression (optional)

## Need Help?

- **Full Docs:** `.claude/design-review-toolkit/README.md`
- **Install Guide:** `.claude/design-review-toolkit/INSTALL.md`
- **Usage Examples:** `.claude/design-review-toolkit/USAGE.md`

---

**Ready to run?** `node test-design-review.js` 🚀

