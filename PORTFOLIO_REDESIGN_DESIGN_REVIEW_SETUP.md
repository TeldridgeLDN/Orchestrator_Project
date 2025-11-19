# Portfolio-Redesign: Design Review Integration

**Date:** 2025-11-19  
**Source:** Orchestrator_Project  
**Target:** portfolio-redesign  
**Model:** Git Subtree (Separate Repositories)

---

## 📊 Project Analysis

### Current State
- **Location:** `/Users/tomeldridge/portfolio-redesign`
- **Type:** Separate git repository (Astro project)
- **Dev Server:** Astro dev (default port 4321)
- **Build Tool:** Astro
- **Already Has:**
  - ✅ `.claude/` directory
  - ✅ `.taskmaster/` directory  
  - ✅ Organized component structure

### Compatibility Assessment
| Feature | Status | Notes |
|---------|--------|-------|
| **Separate Repo** | ✅ Yes | Use Git Subtree model |
| **Modern Framework** | ✅ Astro | Similar to React/Vue |
| **Component-Based** | ✅ Yes | Has src/ directory |
| **Dev Server** | ✅ Yes | `npm run dev` |
| **Existing .claude** | ✅ Yes | Can extend |

---

## 🎯 Recommended Approach: Git Subtree

**Rationale:**
- Separate repos require Git Subtree
- Maintains independence
- Easy to sync updates
- Preserves history

---

## 🚀 Implementation Plan

### Phase 1: Add Design Review Infrastructure

```bash
cd /Users/tomeldridge/portfolio-redesign

# Add Orchestrator's design review system as subtree
git subtree add \
  --prefix=.design-review-system \
  /Users/tomeldridge/Orchestrator_Project/.claude \
  main --squash

# Create symlinks to make it accessible
ln -s ../.design-review-system/hooks .claude/hooks
ln -s ../.design-review-system/workflows .claude/workflows  
ln -s ../.design-review-system/utils .claude/utils
```

---

### Phase 2: Create Project-Specific Configuration

```bash
cd /Users/tomeldridge/portfolio-redesign

# Create directories
mkdir -p .claude/reports/design-review/{screenshots,baselines}

# Create configuration
cat > .claude/design-review.json << 'EOF'
{
  "enabled": true,
  "mode": "warn",
  "checks": {
    "accessibility": true,
    "visualRegression": false,
    "designConsistency": true
  },
  "devServer": {
    "url": "http://localhost:4321",
    "port": 4321,
    "checkTimeout": 5000,
    "command": "npm run dev"
  },
  "components": {
    "paths": [
      "src/components/**/*.astro",
      "src/pages/**/*.astro",
      "src/layouts/**/*.astro"
    ],
    "exclude": [
      "**/node_modules/**",
      "**/dist/**",
      "**/.astro/**"
    ]
  },
  "screenshots": {
    "viewport": {
      "width": 1280,
      "height": 720
    },
    "fullPage": false,
    "waitForLoad": true,
    "timeout": 30000
  },
  "accessibility": {
    "wcagLevel": "AA",
    "includeWarnings": true,
    "includeIncomplete": false,
    "rules": {
      "color-contrast": { "enabled": true },
      "link-name": { "enabled": true },
      "button-name": { "enabled": true },
      "image-alt": { "enabled": true },
      "label": { "enabled": true },
      "aria-roles": { "enabled": true }
    }
  },
  "designSystem": {
    "colors": {
      "primary": ["#0066cc", "#0052a3"],
      "secondary": ["#6c757d"],
      "accent": ["#28a745"]
    },
    "typography": {
      "fontFamilies": [
        "system-ui",
        "-apple-system",
        "BlinkMacSystemFont"
      ],
      "fontSizes": {
        "base": "1rem",
        "lg": "1.125rem",
        "xl": "1.25rem",
        "2xl": "1.5rem"
      }
    },
    "spacing": {
      "baseUnit": 8,
      "scale": [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64]
    }
  },
  "reporting": {
    "outputDir": ".claude/reports/design-review",
    "format": "markdown",
    "includeScreenshots": true,
    "includeTimestamp": true
  }
}
EOF
```

---

### Phase 3: Copy Test Scripts

```bash
cd /Users/tomeldridge/portfolio-redesign

# Copy test scripts from Orchestrator
cp /Users/tomeldridge/Orchestrator_Project/test-dashboard-integration.js \
   ./test-portfolio-integration.js

cp /Users/tomeldridge/Orchestrator_Project/test-dashboard-review.js \
   ./test-portfolio-review.js

cp /Users/tomeldridge/Orchestrator_Project/test-design-review-e2e.js \
   ./test-portfolio-e2e.js
```

---

### Phase 4: Customize Test Scripts

Update the test scripts for Astro/portfolio specifics:

**test-portfolio-integration.js:**
```javascript
const CONFIG = {
  url: 'http://localhost:4321',  // Astro default port
  // ... rest of config
};
```

**test-portfolio-review.js:**
```javascript
const CONFIG = {
  url: 'http://localhost:4321',
  component: 'HomePage',  // Or your main component
  // ... rest of config
};
```

**test-portfolio-e2e.js:**
```javascript
const TEST_COMPONENTS = [
  {
    name: 'HomePage',
    path: '/',
    expectedScore: { min: 85, target: 90 },
    description: 'Main portfolio landing page'
  },
  {
    name: 'AboutPage',
    path: '/about',
    expectedScore: { min: 85, target: 90 },
    description: 'About/bio page'
  },
  {
    name: 'ProjectsPage',
    path: '/projects',
    expectedScore: { min: 85, target: 90 },
    description: 'Projects showcase'
  }
];
```

---

### Phase 5: Install Dependencies

```bash
cd /Users/tomeldridge/portfolio-redesign

# Install Playwright if not already installed
npm install --save-dev playwright

# Install browser binaries
npx playwright install chromium
```

---

### Phase 6: Test the Integration

```bash
# Step 1: Start dev server
npm run dev

# Step 2: In new terminal, run integration test
cd /Users/tomeldridge/portfolio-redesign
node test-portfolio-integration.js

# Step 3: Run design review on homepage
node test-portfolio-review.js

# Step 4: Run full E2E suite
node test-portfolio-e2e.js
```

---

## 📋 Component Mapping

### Astro Pages to Test

Based on typical portfolio structure:

| Page | Path | Priority | Expected Score |
|------|------|----------|----------------|
| **Home** | `/` | High | 90+ |
| **About** | `/about` | High | 90+ |
| **Projects** | `/projects` | High | 90+ |
| **Contact** | `/contact` | Medium | 85+ |
| **Blog** | `/blog` | Medium | 85+ |

### Astro Components to Test

| Component | Location | Type |
|-----------|----------|------|
| **Header** | `src/components/Header.astro` | Layout |
| **Footer** | `src/components/Footer.astro` | Layout |
| **Hero** | `src/components/Hero.astro` | Content |
| **ProjectCard** | `src/components/ProjectCard.astro` | Content |
| **ContactForm** | `src/components/ContactForm.astro` | Interactive |

---

## 🔧 Astro-Specific Considerations

### 1. Static Site Generation
**Impact:** Pages are pre-rendered, not dynamic React components

**Solution:**
- Test built pages after `npm run build`
- OR test dev server (which has HMR)

**Recommendation:** Test dev server (easier, same as dashboard)

### 2. Island Architecture
**Impact:** Interactive components are "islands" in static HTML

**Solution:**
- Playwright handles both static and interactive elements
- No special handling needed

### 3. Component Syntax
**Impact:** `.astro` files instead of `.tsx`

**Solution:**
- Playwright tests the rendered HTML, not the source
- No changes needed to test infrastructure

---

## 🎨 Design System Customization

### Colors (Example - Update to Match Your Brand)

```json
{
  "colors": {
    "primary": ["#your-primary-color"],
    "secondary": ["#your-secondary-color"],
    "accent": ["#your-accent-color"]
  }
}
```

### Typography (Example - Update to Match Your Fonts)

```json
{
  "typography": {
    "fontFamilies": [
      "Your-Font-Family",
      "system-ui",
      "sans-serif"
    ]
  }
}
```

---

## 🧪 Testing Workflow

### Development Workflow

```bash
# 1. Start dev server
npm run dev

# 2. Make changes to components
vim src/components/Hero.astro

# 3. Run design review
node test-portfolio-review.js

# 4. Review report
cat .claude/reports/design-review/review-*.md

# 5. Fix any issues
# ... make fixes

# 6. Commit
git add .
git commit -m "feat: improved Hero component accessibility"
```

### Pre-Deployment Workflow

```bash
# 1. Run full E2E suite
node test-portfolio-e2e.js

# 2. Verify all pages pass
# Review E2E report

# 3. Create baselines (if visual regression enabled)
# Capture screenshots of current "good" state

# 4. Deploy
npm run build
# ... deploy to Netlify/Vercel
```

---

## 🔄 Syncing Updates from Orchestrator

When the design review system is updated in Orchestrator_Project:

```bash
cd /Users/tomeldridge/portfolio-redesign

# Pull updates from Orchestrator
git subtree pull \
  --prefix=.design-review-system \
  /Users/tomeldridge/Orchestrator_Project/.claude \
  main --squash

# Test that updates work
node test-portfolio-integration.js
```

---

## 📊 Expected Results

### First Run

**Homepage:**
- Expected Score: 85-95/100
- Common Issues:
  - Missing alt text on images
  - Landmark structure
  - Color contrast (if using custom colors)

**Component Pages:**
- Expected Score: 80-90/100
- Common Issues:
  - Form labels
  - Button accessibility
  - Heading hierarchy

### After Fixes

**All Pages:**
- Target Score: 90-100/100
- Zero critical issues
- Clean semantic HTML
- Proper ARIA attributes

---

## 🎯 Success Criteria

- [ ] Git subtree added successfully
- [ ] Symlinks created and working
- [ ] Configuration file created
- [ ] Dependencies installed
- [ ] Integration test passing
- [ ] Design review generating reports
- [ ] E2E tests running on multiple pages
- [ ] Accessibility scores ≥ 85/100

---

## 🐛 Troubleshooting

### Issue: "Port 4321 already in use"

**Solution:**
```bash
# Kill existing process
lsof -ti:4321 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

### Issue: "Astro components not rendering"

**Solution:**
```bash
# Ensure dev server is fully started
# Wait for "Astro dev server running" message

# Increase wait time in test
await page.waitForTimeout(3000);
```

### Issue: "Can't find .design-review-system"

**Solution:**
```bash
# Verify subtree was added
ls -la .design-review-system

# If missing, re-run git subtree add command
```

---

## 📚 Documentation Updates

### Add to portfolio-redesign README.md

```markdown
## Design Review

This project uses automated design review for accessibility and design consistency.

### Running Design Review

\`\`\`bash
# Start dev server
npm run dev

# Run design review (new terminal)
node test-portfolio-review.js

# Run full E2E tests
node test-portfolio-e2e.js
\`\`\`

### Viewing Reports

Reports are generated in `.claude/reports/design-review/`

### Configuration

Edit `.claude/design-review.json` to customize:
- Accessibility rules
- Design system values
- Component paths
- Screenshot settings
```

---

## 🎊 Next Steps After Setup

1. **Test Homepage**
   - Run review on main page
   - Fix any critical issues
   - Achieve 90+ score

2. **Test All Pages**
   - Run E2E on all routes
   - Document scores
   - Prioritize fixes

3. **Create Baselines**
   - Capture "good" state screenshots
   - Enable visual regression
   - Test on future changes

4. **Integrate with CI/CD**
   - Add to Netlify build
   - Block deploys on critical issues
   - Generate reports per deploy

5. **Share with Team**
   - Document workflow
   - Train team members
   - Establish review process

---

## 🔗 References

- **Main Strategy:** `DESIGN_REVIEW_REPLICATION_STRATEGY.md`
- **Troubleshooting:** `DESIGN_REVIEW_TROUBLESHOOTING.md`
- **Complete System:** `DESIGN_REVIEW_COMPLETE_SUMMARY.md`
- **Dashboard Example:** `TASK_118_DASHBOARD_INTEGRATION_GUIDE.md`

---

**Ready to implement? Run these commands to get started!**

```bash
cd /Users/tomeldridge/portfolio-redesign

# Add design review system
git subtree add --prefix=.design-review-system \
  /Users/tomeldridge/Orchestrator_Project/.claude main --squash

# Create symlinks
ln -s ../.design-review-system/hooks .claude/hooks
ln -s ../.design-review-system/workflows .claude/workflows
ln -s ../.design-review-system/utils .claude/utils

# Create config and test!
```

