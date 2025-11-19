# Task 118: Dashboard Integration Guide

**Status:** In Progress  
**Date:** 2025-11-19

---

## ✅ Setup Complete

### Configuration Created
✅ **`dashboard/.claude/design-review.json`**
- Enabled: Accessibility & Design Consistency
- Mode: Warn (non-blocking)
- Dev Server: http://localhost:5173 (Vite default)
- Viewport: 1280x720

✅ **Directory Structure**
```
dashboard/
├── .claude/
│   ├── design-review.json          # Configuration
│   └── reports/
│       └── design-review/
│           ├── screenshots/        # Screenshot storage
│           └── baselines/          # Baseline images
```

---

## 🧪 Testing Instructions

### Step 1: Start Dev Server

```bash
cd dashboard
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 2: Run Integration Test

In a **new terminal** (keep dev server running):

```bash
cd /Users/tomeldridge/Orchestrator_Project
node test-dashboard-integration.js
```

**Expected Results:**
- ✅ Configuration loaded
- ✅ Dev server accessible
- ✅ Browser navigation working
- ✅ Screenshot captured
- ✅ Components detected
- ✅ Directory structure valid

### Step 3: Test Design Review Hook

Once the dev server is running:

```bash
# 1. Make a small change to a component
echo "// Test comment" >> dashboard/src/components/LandingPage.tsx

# 2. Stage the file
git add dashboard/src/components/LandingPage.tsx

# 3. Commit (this triggers the design review)
git commit -m "test: design review integration"
```

**What Happens:**
1. Pre-commit hook detects `.tsx` file
2. Checks dev server (localhost:5173)
3. Captures screenshot of LandingPage
4. Runs accessibility audit
5. Validates design consistency
6. Generates report

**Report Location:**
```
.claude/reports/design-review/review-<timestamp>.md
```

---

## 📋 Available Components

These components are available for testing:

| Component | File | Purpose |
|-----------|------|---------|
| **LandingPage** | `LandingPage.tsx` | Portfolio landing page |
| **Icon** | `Icon.tsx` | Icon component system |
| **WorkspacePanel** | `WorkspacePanel.tsx` | Workspace management |
| **ConnectionStatus** | `ConnectionStatus.tsx` | Status indicator |
| **ActiveSkillsPanel** | `ActiveSkillsPanel.tsx` | Skills display |
| **HealthMetricsPanel** | `HealthMetricsPanel.tsx` | Health metrics |
| **HealthAlertsPanel** | `HealthAlertsPanel.tsx` | Alert display |
| **WorkspaceContainer** | `WorkspaceContainer.tsx` | Container component |
| **GroupModal** | `GroupModal.tsx` | Modal dialog |

---

## 🎯 Test Scenarios

### Scenario 1: LandingPage Accessibility
**Component:** `dashboard/src/components/LandingPage.tsx`

**Test:**
```bash
# Start dev server
cd dashboard && npm run dev

# In new terminal, make change and commit
echo "// Accessibility test" >> src/components/LandingPage.tsx
git add src/components/LandingPage.tsx
git commit -m "test: landing page accessibility"
```

**Expected Checks:**
- ✅ Screenshot captured
- ✅ Color contrast validated
- ✅ Alt text checked
- ✅ ARIA attributes verified
- ✅ Design consistency validated

### Scenario 2: Icon Component Design
**Component:** `dashboard/src/components/Icon.tsx`

**Test:**
```bash
# Make change
echo "// Design test" >> dashboard/src/components/Icon.tsx
git add dashboard/src/components/Icon.tsx
git commit -m "test: icon component design"
```

**Expected Checks:**
- ✅ Typography validation
- ✅ Spacing validation
- ✅ Component patterns checked

### Scenario 3: Multiple Components
**Components:** Multiple files

**Test:**
```bash
# Change multiple files
echo "// Test" >> dashboard/src/components/LandingPage.tsx
echo "// Test" >> dashboard/src/components/Icon.tsx
git add dashboard/src/components/
git commit -m "test: multiple components"
```

**Expected:**
- Both components analyzed
- Combined report generated
- Summary shows both components

---

## 🔍 Manual Testing Checklist

### Before Committing
- [ ] Dev server is running (`http://localhost:5173`)
- [ ] Can access dashboard in browser
- [ ] Components are rendering correctly
- [ ] No console errors

### During Commit
- [ ] Hook detects changed files
- [ ] Dev server check passes
- [ ] Screenshots are captured
- [ ] Accessibility audit runs
- [ ] Design validation executes
- [ ] Report is generated

### After Commit
- [ ] Report exists in `.claude/reports/design-review/`
- [ ] Report contains component analysis
- [ ] Screenshots saved in `screenshots/` directory
- [ ] Violations (if any) are clearly described
- [ ] Suggestions are actionable

---

## 📸 Screenshot Verification

When you provide a screenshot, I'll look for:

### Dashboard Homepage
- ✅ Clean layout
- ✅ Proper spacing
- ✅ Icon system working
- ✅ Typography consistent
- ✅ Colors from design system

### Individual Components
- ✅ Component structure
- ✅ Styling applied
- ✅ Interactive elements visible
- ✅ Proper hierarchy

---

## 🐛 Troubleshooting

### Issue: "Dev server not accessible"
**Solution:**
```bash
cd dashboard
npm run dev
# Wait for "ready" message before testing
```

### Issue: "No components detected"
**Solution:**
- Check that React is rendering: View page source
- Look for `<div id="root">` or similar
- Verify components are actually mounted

### Issue: "Screenshot is blank"
**Solution:**
- Increase `waitForLoad` timeout in config
- Check for loading states in components
- Try with `fullPage: true` in config

### Issue: "Hook not running"
**Solution:**
```bash
# Verify hook is installed
ls -la .git/hooks/pre-commit

# Check hook permissions
chmod +x .git/hooks/pre-commit

# Test hook manually
.git/hooks/pre-commit
```

---

## 📊 Configuration Options

### Current Settings
```json
{
  "enabled": true,
  "mode": "warn",              // Won't block commits
  "devServer": {
    "url": "http://localhost:5173",
    "port": 5173,
    "checkTimeout": 5000
  },
  "checks": {
    "accessibility": true,      // WCAG 2.1 AA
    "visualRegression": false,  // Disabled until baselines created
    "designConsistency": true   // Design system validation
  }
}
```

### To Enable Visual Regression
1. Create baselines for components
2. Set `visualRegression: true` in config
3. Future commits will compare against baselines

---

## 🎯 Success Criteria

### Configuration ✅
- [x] `.claude/design-review.json` created
- [x] Directory structure established
- [x] Settings configured for Vite

### Integration ⏳
- [ ] Dev server running
- [ ] Integration test passing
- [ ] Hook executing on commit
- [ ] Reports generating

### Validation ⏳
- [ ] Accessibility checks working
- [ ] Design consistency validating
- [ ] Screenshots capturing
- [ ] Reports readable and actionable

---

## 📋 Next Steps

1. **Start Dev Server**
   ```bash
   cd dashboard && npm run dev
   ```

2. **Run Integration Test**
   ```bash
   node test-dashboard-integration.js
   ```

3. **Provide Screenshot** (if needed)
   - Navigate to http://localhost:5173
   - Take screenshot of dashboard
   - Share for verification

4. **Test Real Commit**
   - Make small change
   - Commit and review report

5. **Create Baselines**
   - Approve current design
   - Run baseline creation
   - Enable visual regression

---

## 📚 Documentation References

- **Quick Start:** `DESIGN_REVIEW_QUICK_START.md`
- **Complete Guide:** `DESIGN_REVIEW_COMPLETE_SUMMARY.md`
- **Playwright Docs:** `Docs/playwright-mcp.md`
- **Task 117 Details:** `TASK_117_COMPLETE.md`

---

**Ready to test!** 🚀

Start the dev server and run the integration test, or provide a screenshot for visual verification.

