# Installation Guide

## Quick Install for Sibling Projects

### Option 1: Direct Copy (Recommended for Most Projects)

```bash
# From your project root
cp -r /path/to/Orchestrator_Project/packages/design-review-toolkit .claude/design-review-toolkit

# Install dependencies
npm install --save-dev playwright axe-core
npx playwright install

# Copy example config
cp .claude/design-review-toolkit/config-examples/marketing-site-config.json .claude/design-review.json

# Edit config to match your project
# nano .claude/design-review.json

# Copy test runner
cp .claude/design-review-toolkit/test-runners/portfolio-test.js test-design-review.js

# Run review
npm run dev & # Start your dev server
sleep 5
node test-design-review.js
```

### Option 2: Symlink (For Active Development)

Use this if you want changes to the toolkit to automatically appear in your project:

```bash
# From your project root
mkdir -p .claude
ln -s /path/to/Orchestrator_Project/packages/design-review-toolkit .claude/design-review-toolkit

# Install dependencies
npm install --save-dev playwright axe-core
npx playwright install

# Copy and customize config (don't symlink config)
cp .claude/design-review-toolkit/config-examples/marketing-site-config.json .claude/design-review.json

# Copy test runner (customize as needed)
cp .claude/design-review-toolkit/test-runners/portfolio-test.js test-design-review.js
```

**When to use symlink:**
- You're actively developing/improving the toolkit
- You want toolkit updates to propagate automatically
- Multiple local projects share the same toolkit

**When NOT to use symlink:**
- You're deploying to production
- You want stability (no surprise updates)
- You're customizing the toolkit per-project

### Option 3: Git Submodule (For Version Control)

Best for tracking specific versions of the toolkit:

```bash
# Add as submodule
git submodule add https://github.com/your-org/orchestrator-project.git vendor/orchestrator
git submodule update --init

# Link the design review toolkit
mkdir -p .claude
ln -s ../vendor/orchestrator/packages/design-review-toolkit .claude/design-review-toolkit

# Install dependencies
npm install --save-dev playwright axe-core
npx playwright install

# Copy config
cp .claude/design-review-toolkit/config-examples/marketing-site-config.json .claude/design-review.json

# Commit
git add .gitmodules vendor/ .claude/design-review.json
git commit -m "Add design review toolkit"
```

**Updating the submodule:**
```bash
cd vendor/orchestrator
git pull origin main
cd ../..
git add vendor/orchestrator
git commit -m "Update design review toolkit"
```

## Project-Specific Setup

### Marketing Site (Landing Page, Lead Magnet)

```bash
cp .claude/design-review-toolkit/config-examples/marketing-site-config.json .claude/design-review.json
cp .claude/design-review-toolkit/test-runners/portfolio-test.js test-design-review.js
```

Edit `.claude/design-review.json`:
```json
{
  "project": {
    "name": "your-marketing-site",
    "framework": "astro"
  },
  "devServer": {
    "defaultUrl": "http://localhost:4321"
  }
}
```

### Dashboard/App

```bash
cp .claude/design-review-toolkit/config-examples/dashboard-config.json .claude/design-review.json
cp .claude/design-review-toolkit/test-runners/e2e-test.js test-design-review.js
```

Edit `.claude/design-review.json`:
```json
{
  "project": {
    "name": "your-dashboard",
    "framework": "react"
  },
  "devServer": {
    "defaultUrl": "http://localhost:5173"
  }
}
```

### Basic Web App

```bash
cp .claude/design-review-toolkit/config-examples/basic-config.json .claude/design-review.json
cp .claude/design-review-toolkit/test-runners/e2e-test.js test-design-review.js
```

## NPM Scripts (Recommended)

Add to your `package.json`:

```json
{
  "scripts": {
    "design-review": "node test-design-review.js",
    "design-review:watch": "nodemon --watch src test-design-review.js",
    "precommit": "npm run design-review"
  },
  "devDependencies": {
    "playwright": "^1.40.0",
    "axe-core": "^4.7.0",
    "nodemon": "^3.0.0"
  }
}
```

## Verification

Test that everything is installed correctly:

```bash
# Start your dev server
npm run dev &

# Wait for server to start
sleep 5

# Run design review
npm run design-review

# Check reports
ls -la .claude/reports/design-review/
```

You should see:
- Screenshot files in `.claude/reports/design-review/screenshots/`
- Markdown reports in `.claude/reports/design-review/`
- Console output showing accessibility scores and issues

## Troubleshooting

### "Cannot find module 'playwright'"

```bash
npm install --save-dev playwright
npx playwright install
```

### "Dev server not running"

Start your dev server before running the review:
```bash
npm run dev &
sleep 10
npm run design-review
```

### "Config file not found"

Make sure `.claude/design-review.json` exists:
```bash
cp .claude/design-review-toolkit/config-examples/basic-config.json .claude/design-review.json
```

### Test runner can't find modules

Update import paths in your test runner if you changed the installation location:

```javascript
// If you installed to a different location
const accessibilityAudit = await import('./custom-location/design-review-toolkit/.claude/workflows/design-review/accessibility-audit.js');
```

## Next Steps

1. ✅ Run a test review: `npm run design-review`
2. ✅ Review the generated report in `.claude/reports/design-review/`
3. ✅ Customize your config to enable/disable specific checks
4. ✅ Integrate into your workflow (pre-commit hook, CI/CD, etc.)
5. ✅ Establish baselines for visual regression testing

## Support

- Check the main [README.md](README.md) for detailed documentation
- Review example configs in `config-examples/`
- Examine test runners in `test-runners/`
- See the troubleshooting section in README.md

