# Usage Guide

## Basic Usage

### 1. Run a Design Review

```bash
# Make sure dev server is running
npm run dev &

# Run review
node test-design-review.js
```

### 2. Review Results

```bash
# View latest report
cat .claude/reports/design-review/review-*.md | tail -n 50

# View screenshots
open .claude/reports/design-review/screenshots/
```

### 3. Fix Issues

Address issues in priority order:
1. **Critical (🔴)** - Blocking issues, must fix
2. **Serious (⚠️)** - Important issues, should fix
3. **Warning (⚡)** - Minor issues, nice to fix
4. **Suggestion (💡)** - Improvements, optional

## Advanced Usage

### Custom Test Runner

Create your own test runner for specific needs:

```javascript
#!/usr/bin/env node
import { chromium } from 'playwright';
import { loadConfig, runDesignReview } from './.claude/design-review-toolkit/.claude/workflows/design-review/index.js';

const config = await loadConfig('.claude/design-review.json');

const browser = await chromium.launch();

// Test multiple pages
const pages = [
  { url: 'http://localhost:3000/', name: 'Home' },
  { url: 'http://localhost:3000/about', name: 'About' },
  { url: 'http://localhost:3000/contact', name: 'Contact' }
];

for (const page of pages) {
  console.log(`\n📍 Reviewing ${page.name}...`);
  const results = await runDesignReview({
    url: page.url,
    config,
    browser
  });
  
  console.log(`✅ Accessibility Score: ${results.checks.accessibility?.summary?.totalPasses || 0}`);
  console.log(`⚠️  Violations: ${results.checks.accessibility?.summary?.totalViolations || 0}`);
}

await browser.close();
```

### Component-Level Testing

Test specific components instead of full pages:

```javascript
import { chromium } from 'playwright';
import { accessibilityAudit } from './.claude/design-review-toolkit/.claude/workflows/design-review/index.js';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:3000');

// Test specific component
const componentSelector = '[data-testid="hero-section"]';
await page.waitForSelector(componentSelector);

// Run accessibility check on component only
const results = await page.evaluate(async (selector) => {
  await axe.run(selector);
}, componentSelector);

console.log(results);
await browser.close();
```

### Continuous Monitoring

Set up automated reviews on a schedule:

```javascript
// watch-and-review.js
import { watch } from 'fs';
import { runDesignReview, loadConfig } from './.claude/design-review-toolkit/.claude/workflows/design-review/index.js';

const config = await loadConfig('.claude/design-review.json');

console.log('👀 Watching for changes...');

watch('./src', { recursive: true }, async (eventType, filename) => {
  if (filename.endsWith('.tsx') || filename.endsWith('.jsx')) {
    console.log(`\n🔄 Change detected in ${filename}`);
    console.log('⏳ Waiting 3 seconds for rebuild...');
    
    setTimeout(async () => {
      try {
        const results = await runDesignReview({
          url: config.devServer.defaultUrl,
          config
        });
        
        const violations = results.checks.accessibility?.summary?.totalViolations || 0;
        if (violations > 0) {
          console.log(`⚠️  ${violations} accessibility issues detected`);
        } else {
          console.log('✅ No accessibility issues');
        }
      } catch (error) {
        console.error('❌ Review failed:', error.message);
      }
    }, 3000);
  }
});
```

Run with:
```bash
node watch-and-review.js
```

## Configuration Patterns

### Incremental Adoption

Start with minimal checks, gradually enable more:

**Week 1: Accessibility Only**
```json
{
  "checks": {
    "accessibility": { "enabled": true },
    "visualRegression": { "enabled": false },
    "designConsistency": { "enabled": false }
  }
}
```

**Week 2: Add Visual Regression**
```json
{
  "checks": {
    "accessibility": { "enabled": true },
    "visualRegression": { "enabled": true },
    "designConsistency": { "enabled": false }
  }
}
```

**Week 3: Full Suite**
```json
{
  "checks": {
    "accessibility": { "enabled": true },
    "visualRegression": { "enabled": true },
    "designConsistency": { "enabled": true }
  }
}
```

### Environment-Specific Configs

Different configs for dev vs. CI:

**.claude/design-review.dev.json** (Lenient)
```json
{
  "checks": {
    "accessibility": {
      "enabled": true,
      "blockOnCritical": false
    }
  },
  "reporting": {
    "mode": "warn"
  }
}
```

**.claude/design-review.ci.json** (Strict)
```json
{
  "checks": {
    "accessibility": {
      "enabled": true,
      "blockOnCritical": true
    }
  },
  "reporting": {
    "mode": "fail"
  }
}
```

Load based on environment:
```javascript
const configFile = process.env.CI 
  ? '.claude/design-review.ci.json'
  : '.claude/design-review.dev.json';
const config = await loadConfig(configFile);
```

### Team-Specific Rules

Different checks for different teams:

```json
{
  "checks": {
    "accessibility": {
      "enabled": true,
      "assignee": "accessibility-team"
    },
    "designConsistency": {
      "enabled": true,
      "assignee": "design-team"
    },
    "conversionOptimization": {
      "enabled": true,
      "assignee": "growth-team"
    }
  }
}
```

## Integration Patterns

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "🔍 Running design review..."

# Only run if frontend files changed
CHANGED_FILES=$(git diff --cached --name-only | grep -E '\.(tsx?|jsx?|css|scss)$')

if [ -z "$CHANGED_FILES" ]; then
  echo "✅ No frontend changes, skipping design review"
  exit 0
fi

# Start dev server if not running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "⏳ Starting dev server..."
  npm run dev &
  DEV_PID=$!
  sleep 10
fi

# Run review
node test-design-review.js

REVIEW_EXIT=$?

# Cleanup
if [ ! -z "$DEV_PID" ]; then
  kill $DEV_PID
fi

if [ $REVIEW_EXIT -ne 0 ]; then
  echo "❌ Design review failed. Fix issues or use 'git commit --no-verify' to skip."
  exit 1
fi

echo "✅ Design review passed"
exit 0
```

### CI/CD Pipeline

**GitHub Actions:**
```yaml
name: Design Review

on:
  pull_request:
    paths:
      - 'src/**'
      - '.claude/design-review.json'

jobs:
  design-review:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm ci
          npx playwright install --with-deps
      
      - name: Start dev server
        run: npm run dev &
      
      - name: Wait for server
        run: npx wait-on http://localhost:3000 --timeout 60000
      
      - name: Run design review
        run: node test-design-review.js
      
      - name: Upload reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: design-review-reports
          path: .claude/reports/design-review/
      
      - name: Comment on PR
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('.claude/reports/design-review/latest.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '## 🎨 Design Review Failed\n\n' + report
            });
```

### VS Code Task

Add to `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Design Review",
      "type": "shell",
      "command": "node test-design-review.js",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      },
      "group": {
        "kind": "test",
        "isDefault": true
      }
    }
  ]
}
```

Run with: `Cmd+Shift+P` → "Tasks: Run Task" → "Design Review"

## Best Practices

### 1. Run Reviews Frequently
- Before committing
- After major UI changes
- Before deploying
- Periodically on main branch

### 2. Establish Baselines
```bash
# Capture baseline screenshots
node test-design-review.js
mv .claude/reports/design-review/screenshots/*.png .claude/reports/design-review/baselines/
```

### 3. Track Progress
```bash
# Generate trend report
node -e "
const fs = require('fs');
const reports = fs.readdirSync('.claude/reports/design-review/')
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync('.claude/reports/design-review/' + f)))
  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

console.log('Accessibility Score Trend:');
reports.forEach(r => {
  const score = r.checks.accessibility?.summary?.totalPasses || 0;
  console.log(\`\${new Date(r.timestamp).toLocaleDateString()}: \${score}\`);
});
"
```

### 4. Document Decisions
When you skip a check or accept an issue, document why:

```json
{
  "checks": {
    "accessibility": {
      "ignoreRules": [
        {
          "rule": "color-contrast",
          "reason": "Brand colors approved by design team",
          "approvedBy": "design-lead@company.com",
          "date": "2025-01-15"
        }
      ]
    }
  }
}
```

## Common Workflows

### Pre-Launch Checklist
```bash
# 1. Full review
node test-design-review.js

# 2. Check all pages
for page in / /about /contact /pricing; do
  echo "Reviewing $page"
  # Modify test-design-review.js to test $page
done

# 3. Multiple viewports
# Enable all viewports in config

# 4. Generate final report
cat .claude/reports/design-review/*.md > launch-review.md
```

### Post-Deployment Verification
```bash
# Test production site
sed -i 's/localhost:3000/production-url.com/g' .claude/design-review.json
node test-design-review.js
git checkout .claude/design-review.json
```

### Regression Testing After Refactor
```bash
# Before refactor: capture baseline
node test-design-review.js
mv .claude/reports/design-review/screenshots/ .claude/reports/design-review/baselines/

# After refactor: compare
node test-design-review.js
# Visual diff will automatically compare with baselines
```

## Troubleshooting

### Review Takes Too Long
```json
{
  "performance": {
    "parallel": true,
    "maxConcurrency": 5,
    "timeout": 60000
  }
}
```

### Too Many False Positives
```json
{
  "checks": {
    "accessibility": {
      "ignoreRules": ["duplicate-id"],
      "ignoreSelectors": ["[data-test-id]"]
    }
  }
}
```

### Memory Issues with Large Sites
```javascript
// In test runner
const browser = await chromium.launch({
  args: ['--max-old-space-size=4096']
});
```

## Next Steps

1. Review the [Configuration Reference](README.md#configuration-guide)
2. Explore [Extension Development](README.md#extending-the-toolkit)
3. Set up [CI/CD Integration](#cicd-pipeline)
4. Customize [Report Templates](README.md#report-format)

