# Design Review - Quick Start Guide

**Status:** ✅ Production Ready  
**Version:** 1.0.0

---

## 🚀 Quick Setup (Already Done!)

The system is already configured and ready to use!

---

## 📋 How to Use

### 1. Start Dev Server
```bash
cd dashboard
pnpm dev
# Server should start on http://localhost:3000
```

### 2. Make Changes
```bash
# Edit any component
vim src/components/Hero.tsx
```

### 3. Commit
```bash
git add src/components/Hero.tsx
git commit -m "update: Hero component"
```

### 4. Review Results
The hook will automatically:
- ♿ Run accessibility audit
- 📸 Capture screenshot
- 🔍 Compare with baseline
- 🎨 Check design consistency
- 📝 Generate report

**Report Location:** `.claude/reports/design-review/review-*.md`

---

## ⚙️ Configuration

**Location:** `dashboard/.claude/design-review.json`

```json
{
  "enabled": true,
  "mode": "warn",  // "warn" or "block"
  "checks": {
    "accessibility": true,
    "visualRegression": false,  // Set to true after baselines created
    "designConsistency": true
  },
  "devServer": {
    "url": "http://localhost:3000"
  }
}
```

---

## 🧪 Test the System

```bash
# Run test script
node test-playwright-mcp.js

# Expected: 5/5 tests passing
```

---

## 📊 What Gets Checked

### Accessibility (WCAG 2.1)
- Color contrast
- Alt text
- Keyboard navigation
- ARIA attributes
- Form labels
- Link text
- Semantic HTML

### Visual Regression
- Screenshot comparison
- Baseline management
- Change detection

### Design Consistency
- Component naming (PascalCase)
- File organization
- Generic name detection

---

## 📁 Key Files

```
.claude/
├── hooks/design-review.js          # Main hook
├── workflows/design-review/        # Workflow modules
│   ├── accessibility-audit.js      # WCAG testing
│   ├── capture-screenshots.js      # Screenshots
│   ├── visual-diff.js             # Baseline comparison
│   ├── design-consistency.js      # Design rules
│   └── generate-report.js         # Reports
├── utils/playwright-helper.js      # Utility methods
└── reports/design-review/          # Generated reports
    ├── screenshots/                # Current screenshots
    ├── baselines/                  # Baseline images
    └── review-*.md                 # Reports
```

---

## 🔧 Common Tasks

### View Last Report
```bash
ls -lt .claude/reports/design-review/*.md | head -1 | awk '{print $NF}' | xargs cat
```

### Create Baseline
```bash
# Visual regression creates baselines automatically on first run
# Just commit a component - baseline will be created
```

### Update Baseline
```bash
# After verifying changes are correct:
cp .claude/reports/design-review/screenshots/Hero-*.png \
   .claude/reports/design-review/baselines/Hero-baseline.png
```

### Disable for One Commit
```bash
git commit --no-verify -m "skip review"
```

---

## 🐛 Troubleshooting

### "Dev server not running"
```bash
# Start dev server first
cd dashboard && pnpm dev
```

### "Playwright not found"
```bash
# Reinstall Playwright
npm install --save-dev playwright
npx playwright install
```

### "Hook not running"
```bash
# Check hook exists
ls -la .claude/hooks/design-review.js

# Check git hooks configured
cat .git/hooks/pre-commit
```

---

## 📈 Understanding Results

### Accessibility Score
- **95-100:** Excellent ✅
- **85-94:** Good ⚠️
- **70-84:** Needs work ⚠️
- **<70:** Poor ❌

### Violation Severity
- **Critical:** Blocks accessibility - fix immediately 🚨
- **Serious:** Major barriers - fix soon ⚠️
- **Moderate:** Noticeable issues - address when possible ℹ️
- **Minor:** Best practices - improve over time 💡

---

## 🎯 Best Practices

1. **Keep dev server running** during development
2. **Review reports** before pushing
3. **Fix critical violations** immediately
4. **Create baselines** for stable components
5. **Update baselines** when designs intentionally change

---

## 📚 More Information

- **Full Documentation:** `Docs/playwright-mcp.md`
- **Implementation Details:** `DESIGN_REVIEW_COMPLETE_SUMMARY.md`
- **Session Notes:** `SESSION_2025_11_19_DESIGN_REVIEW_COMPLETE.md`

---

## 🆘 Support

**Common Issues:**
- Dev server detection failing → Check port 3000
- Playwright errors → Run `npx playwright install`
- Hook not triggering → Check file patterns (.tsx/.jsx/.css)

**For Help:**
- Review troubleshooting section in `Docs/playwright-mcp.md`
- Check generated reports for specific guidance
- Review session notes for context

---

**Ready to use!** Just start developing and the system will automatically review your changes. 🚀

