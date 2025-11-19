# Design Review System - Multi-Project Scaling Strategy

**Date:** 2025-11-19  
**Purpose:** Scale Design Review from dashboard → portfolio-redesign → all frontend projects  
**Architecture:** Template-based system with framework-agnostic core + project-specific extensions

---

## 🎯 Vision: Universal Design Review System

A single, scalable design review infrastructure that adapts to any frontend project type while maintaining consistency and leveraging project-specific optimizations.

**Core Insight:** Just like Orchestrator uses templates (base, web-app, shopify) for project scaffolding, Design Review needs templates for different validation needs.

---

## 📊 Current State

### What Exists (Task 117 Complete)
- ✅ Design Review working for `dashboard/` (Next.js)
- ✅ Accessibility audits (axe-core, WCAG 2.1)
- ✅ Screenshot capture (Playwright)
- ✅ Visual regression (baseline comparison)
- ✅ Design consistency checks
- ✅ Markdown report generation

### Architecture (Monorepo Pattern)
```
Orchestrator_Project/
├── .claude/                      # SHARED INFRASTRUCTURE
│   ├── hooks/design-review.js
│   ├── workflows/design-review/
│   └── utils/playwright-helper.js
│
└── dashboard/                    # SINGLE PROJECT
    └── .claude/design-review.json
```

---

## 🚀 Target State: Multi-Project Support

### Projects to Support

| Project | Type | Framework | Validation Priorities | Dev Server |
|---------|------|-----------|----------------------|------------|
| **dashboard** | Admin UI | Next.js | Accessibility, Components | :3000 |
| **portfolio-redesign** | Marketing Site | Next.js/React | Conversion, Copy Quality | :3000 |
| **multi-layer-cal** | Web App | Vite + React | Performance, UX | :5173 |
| **Future Projects** | Various | Astro, Svelte, etc. | TBD | Various |

### Challenge: Different Projects, Different Needs

**Dashboard (Admin UI):**
- Priority: Accessibility, data visualization
- Design System: Component library consistency
- Checks: ARIA attributes, keyboard navigation, color contrast

**Portfolio-Redesign (Marketing Site):**
- Priority: Conversion optimization, trust signals
- Design System: Monzo-inspired (specific color palette)
- Checks: CTA placement, form friction, loading time, copy quality

**Multi-Layer-Cal (Web App):**
- Priority: Performance, responsive design
- Design System: Energy-first design patterns
- Checks: Bundle size, render performance, mobile UX

**Key Insight:** One system, different validation rules per project type.

---

## 🏗️ Proposed Architecture: Template-Based Design Review

### Core Principle: PAI + diet103 Patterns

Following Orchestrator's principles:
1. **Progressive Disclosure:** Load only checks needed for current project
2. **Skills-as-Containers:** Each check type is independent module
3. **Context Isolation:** Each project has isolated config/reports
4. **Template System:** Reusable starting points
5. **Token Efficiency:** Lazy load extensions

### Global Infrastructure (Shared)

```
~/.claude/design-review/
├── core/                           # UNIVERSAL (all projects)
│   ├── accessibility-audit.js      # WCAG 2.1 compliance
│   ├── capture-screenshots.js      # Playwright screenshots
│   ├── visual-diff.js             # Baseline comparison
│   ├── design-consistency.js      # Basic naming/structure
│   └── generate-report.js         # Markdown reports
│
├── extensions/                     # OPTIONAL (per project type)
│   ├── marketing/
│   │   ├── conversion-check.js    # CTA placement, form friction
│   │   ├── copy-quality.js        # Readability, jargon detection
│   │   ├── trust-signals.js       # Testimonials, privacy policy
│   │   └── email-templates.js     # Email validation
│   │
│   ├── webapp/
│   │   ├── performance-budget.js  # Bundle size, loading time
│   │   ├── component-consistency.js # Design system tokens
│   │   └── responsive-design.js   # Mobile breakpoints
│   │
│   └── design-system/
│       ├── token-validation.js    # Color, spacing, typography
│       ├── api-consistency.js     # Component props
│       └── documentation-check.js # Storybook completeness
│
├── templates/                      # PROJECT TEMPLATES
│   ├── base.json                  # Minimal config
│   ├── marketing-site.json        # For portfolio-redesign
│   ├── web-app.json              # For multi-layer-cal
│   └── design-system.json        # For component libraries
│
└── utils/
    ├── playwright-helper.js       # Browser automation
    ├── framework-detector.js      # Auto-detect Next/Vite/Astro
    └── report-formatter.js        # Multi-format reports
```

### Per-Project Configuration

```
<project>/.claude/
├── design-review.json              # PROJECT-SPECIFIC CONFIG
├── design-system.json              # Design tokens (optional)
└── reports/
    └── design-review/
        ├── screenshots/
        ├── baselines/
        └── review-*.md
```

---

## 📋 Template Definitions

### 1. Base Template (Minimal)

**Purpose:** Universal accessibility + visual regression  
**Use Case:** Any frontend project, minimal setup  
**File:** `~/.claude/design-review/templates/base.json`

```json
{
  "name": "base",
  "description": "Universal design review (accessibility + visual regression)",
  "extends": [],
  "checks": {
    "accessibility": {
      "enabled": true,
      "wcagLevel": "AA",
      "rules": ["color-contrast", "alt-text", "aria-attributes"]
    },
    "visualRegression": {
      "enabled": true,
      "threshold": 0.1
    },
    "designConsistency": {
      "enabled": true,
      "rules": ["naming-conventions", "file-organization"]
    }
  },
  "devServer": {
    "autoDetect": true,
    "defaultUrl": "http://localhost:3000"
  },
  "reporting": {
    "format": "markdown",
    "mode": "warn"
  }
}
```

### 2. Marketing Site Template

**Purpose:** Conversion-focused validation  
**Use Case:** portfolio-redesign, landing pages  
**File:** `~/.claude/design-review/templates/marketing-site.json`

```json
{
  "name": "marketing-site",
  "description": "Marketing site validation (conversion + trust)",
  "extends": ["base"],
  "checks": {
    "accessibility": { "enabled": true },
    "visualRegression": { "enabled": true },
    "designConsistency": { "enabled": true },
    
    "conversionOptimization": {
      "enabled": true,
      "rules": [
        "cta-above-fold",
        "form-field-count",
        "loading-time"
      ],
      "thresholds": {
        "loadTime": 3000,
        "maxFormFields": 3
      }
    },
    
    "copyQuality": {
      "enabled": true,
      "rules": [
        "readability-score",
        "jargon-detection",
        "action-oriented-ctas"
      ],
      "thresholds": {
        "fleschKincaid": 60,
        "maxJargonWords": 5
      }
    },
    
    "trustSignals": {
      "enabled": true,
      "rules": [
        "testimonials-have-names",
        "privacy-policy-linked",
        "no-fake-urgency"
      ]
    },
    
    "emailTemplates": {
      "enabled": true,
      "rules": [
        "plain-text-fallback",
        "unsubscribe-link",
        "personalization-tokens-valid"
      ]
    }
  },
  
  "designSystem": {
    "colorPalette": {
      "primary": "#0EBAC5",
      "secondary": "#FF5454",
      "accent": "#FFC700"
    },
    "typography": {
      "headings": "Inter Bold",
      "body": "Inter Regular",
      "code": "JetBrains Mono"
    },
    "components": {
      "button": {
        "borderRadius": "8px",
        "primaryColor": "#FF5454"
      },
      "card": {
        "borderRadius": "12px"
      }
    }
  }
}
```

### 3. Web App Template

**Purpose:** Performance + UX validation  
**Use Case:** multi-layer-cal, dashboard, SaaS apps  
**File:** `~/.claude/design-review/templates/web-app.json`

```json
{
  "name": "web-app",
  "description": "Web application validation (performance + UX)",
  "extends": ["base"],
  "checks": {
    "accessibility": { "enabled": true },
    "visualRegression": { "enabled": true },
    "designConsistency": { "enabled": true },
    
    "performanceBudget": {
      "enabled": true,
      "thresholds": {
        "bundleSize": 250000,
        "initialLoad": 2000,
        "largestContentfulPaint": 2500
      }
    },
    
    "componentConsistency": {
      "enabled": true,
      "rules": [
        "design-token-usage",
        "component-api-consistency",
        "prop-naming-conventions"
      ]
    },
    
    "responsiveDesign": {
      "enabled": true,
      "breakpoints": [375, 768, 1024, 1440],
      "rules": [
        "mobile-first",
        "touch-targets",
        "viewport-meta"
      ]
    }
  }
}
```

### 4. Design System Template

**Purpose:** Component library validation  
**Use Case:** Shared component libraries, design systems  
**File:** `~/.claude/design-review/templates/design-system.json`

```json
{
  "name": "design-system",
  "description": "Design system validation (tokens + documentation)",
  "extends": ["base"],
  "checks": {
    "accessibility": { "enabled": true },
    "visualRegression": { "enabled": true },
    
    "tokenValidation": {
      "enabled": true,
      "rules": [
        "color-token-usage",
        "spacing-scale-adherence",
        "typography-consistency"
      ]
    },
    
    "apiConsistency": {
      "enabled": true,
      "rules": [
        "prop-naming",
        "event-handler-naming",
        "component-composition"
      ]
    },
    
    "documentation": {
      "enabled": true,
      "rules": [
        "storybook-completeness",
        "prop-table-accuracy",
        "usage-examples"
      ]
    }
  }
}
```

---

## 🔧 Project Setup Workflow

### CLI Commands (New)

```bash
# Initialize design review in a project
claude design-review init [--template <name>]

# Examples:
claude design-review init --template marketing-site    # For portfolio-redesign
claude design-review init --template web-app           # For multi-layer-cal
claude design-review init --template base              # Minimal setup

# List available templates
claude design-review templates

# Validate project setup
claude design-review validate

# Update config
claude design-review config --set checks.conversion.enabled=true
```

### Installation Process

**Step 1: Detect Project Type**
```javascript
// Auto-detect from package.json, framework files
const projectType = detectFramework(projectRoot);
// Returns: 'nextjs', 'vite', 'astro', 'unknown'
```

**Step 2: Suggest Template**
```bash
$ claude design-review init

🔍 Detected: Next.js project
📊 Analyzing project structure...

Suggested templates:
1. marketing-site (recommended for landing pages)
2. web-app (recommended for SaaS applications)
3. base (minimal setup)

Select template: [1]
```

**Step 3: Copy Configuration**
```
Copying files...
✅ .claude/design-review.json
✅ .claude/design-system.json (optional)
✅ Installing workflow modules: conversion-check, copy-quality, trust-signals

Setup complete! 🎉
```

**Step 4: Create Baselines**
```bash
$ git add .
$ git commit -m "feat: add design review"

🎨 First run detected. Creating baselines...
📸 Capturing 5 components...
✅ Baselines created: .claude/reports/design-review/baselines/
```

---

## 📦 Distribution Strategy

### Option 1: Monorepo (Current)

**Use Case:** Projects in Orchestrator_Project repo  
**Implementation:** Shared `.claude/` at root

```
Orchestrator_Project/
├── .claude/design-review/        # SHARED
│   ├── core/
│   ├── extensions/
│   └── templates/
│
├── dashboard/
│   └── .claude/design-review.json
│
├── portfolio-redesign/
│   └── .claude/design-review.json
│
└── multi-layer-cal/
    └── .claude/design-review.json
```

**Pros:**
- ✅ Single source of truth
- ✅ Easy updates (update once, affects all)
- ✅ Consistent behavior

**Cons:**
- ⚠️ All projects must be in same repo

---

### Option 2: npm Package (Future)

**Use Case:** Independent projects in separate repos  
**Package:** `@orchestrator/design-review`

```bash
# Install in any project
npm install --save-dev @orchestrator/design-review

# Initialize
npx orchestrator-design-review init --template marketing-site
```

**Package Structure:**
```
@orchestrator/design-review/
├── bin/
│   └── cli.js                    # CLI commands
├── core/                         # Core checks
├── extensions/                   # Optional checks
├── templates/                    # Config templates
└── package.json
```

**Pros:**
- ✅ Works in any repo
- ✅ Versioned releases
- ✅ Standard npm tooling

**Cons:**
- ⚠️ Requires npm publish workflow
- ⚠️ Version management complexity

---

### Option 3: Hybrid (Recommended)

**Use Case:** Flexibility for both scenarios  
**Implementation:**

1. **For Monorepo Projects:** Use shared `.claude/design-review/`
2. **For External Projects:** Symlink or copy from global templates

```bash
# Monorepo projects
cd Orchestrator_Project/portfolio-redesign
claude design-review init --shared  # Uses ../. claude/design-review/

# External projects
cd ~/external-project
claude design-review init --standalone  # Copies templates locally
```

---

## 🎯 Portfolio-Redesign Implementation

### Phase 1: Setup (Week 1)

**Tasks:**
1. Create marketing-site template
2. Define Monzo design system validation rules
3. Install in portfolio-redesign/

**Files to Create:**
```
~/.claude/design-review/
├── templates/marketing-site.json
└── extensions/marketing/
    ├── conversion-check.js
    ├── copy-quality.js
    ├── trust-signals.js
    └── email-templates.js
```

### Phase 2: Custom Checks (Week 2)

**Marketing-Specific Validators:**

#### 1. Conversion Optimization Check
```javascript
// extensions/marketing/conversion-check.js

export async function checkConversion(page, config) {
  const issues = [];
  
  // Check: CTA above fold
  const ctaButton = await page.locator('button[data-cta="primary"]');
  const viewport = page.viewportSize();
  const ctaBox = await ctaButton.boundingBox();
  
  if (ctaBox.y > viewport.height) {
    issues.push({
      severity: 'critical',
      message: 'Primary CTA is below the fold',
      recommendation: 'Move CTA button above fold for better conversion'
    });
  }
  
  // Check: Form field count
  const formFields = await page.locator('input, textarea, select').count();
  if (formFields > config.thresholds.maxFormFields) {
    issues.push({
      severity: 'warning',
      message: `Form has ${formFields} fields (max: ${config.thresholds.maxFormFields})`,
      recommendation: 'Reduce form friction by minimizing fields'
    });
  }
  
  // Check: Loading time
  const loadTime = await page.evaluate(() => performance.timing.loadEventEnd - performance.timing.navigationStart);
  if (loadTime > config.thresholds.loadTime) {
    issues.push({
      severity: 'serious',
      message: `Page load time: ${loadTime}ms (max: ${config.thresholds.loadTime}ms)`,
      recommendation: 'Optimize images, bundle size, or server response'
    });
  }
  
  return { issues, passed: issues.filter(i => i.severity === 'critical').length === 0 };
}
```

#### 2. Copy Quality Check
```javascript
// extensions/marketing/copy-quality.js

import { Readability } from 'readability';
import nlp from 'compromise';

export async function checkCopyQuality(page, config) {
  const issues = [];
  
  // Extract all text content
  const textContent = await page.evaluate(() => document.body.innerText);
  
  // Check: Readability score (Flesch-Kincaid)
  const readabilityScore = calculateFleschKincaid(textContent);
  if (readabilityScore < config.thresholds.fleschKincaid) {
    issues.push({
      severity: 'warning',
      message: `Readability score: ${readabilityScore} (target: ${config.thresholds.fleschKincaid}+)`,
      recommendation: 'Simplify language for better comprehension'
    });
  }
  
  // Check: Jargon detection
  const jargonWords = detectJargon(textContent);
  if (jargonWords.length > config.thresholds.maxJargonWords) {
    issues.push({
      severity: 'suggestion',
      message: `Found ${jargonWords.length} jargon words: ${jargonWords.join(', ')}`,
      recommendation: 'Replace technical terms with plain language'
    });
  }
  
  // Check: Action-oriented CTAs
  const ctaText = await page.locator('button[data-cta]').allTextContents();
  const weakCTAs = ctaText.filter(text => ['submit', 'click here', 'learn more'].includes(text.toLowerCase()));
  if (weakCTAs.length > 0) {
    issues.push({
      severity: 'suggestion',
      message: `Weak CTAs found: ${weakCTAs.join(', ')}`,
      recommendation: 'Use action-oriented text like "Download Free Checklist"'
    });
  }
  
  return { issues, score: readabilityScore };
}
```

#### 3. Trust Signals Check
```javascript
// extensions/marketing/trust-signals.js

export async function checkTrustSignals(page, config) {
  const issues = [];
  
  // Check: Testimonials have real names
  const testimonials = await page.locator('[data-testimonial]').all();
  for (const testimonial of testimonials) {
    const hasName = await testimonial.locator('[data-author-name]').count() > 0;
    const hasPhoto = await testimonial.locator('img[data-author-photo]').count() > 0;
    
    if (!hasName) {
      issues.push({
        severity: 'warning',
        message: 'Testimonial missing author name',
        recommendation: 'Add real names to build trust (Monzo principle)'
      });
    }
    
    if (!hasPhoto && config.rules.includes('testimonials-have-photos')) {
      issues.push({
        severity: 'suggestion',
        message: 'Testimonial missing author photo',
        recommendation: 'Add photos for authenticity'
      });
    }
  }
  
  // Check: Privacy policy linked
  const privacyLink = await page.locator('a[href*="privacy"]').count();
  if (privacyLink === 0) {
    issues.push({
      severity: 'critical',
      message: 'No privacy policy link found',
      recommendation: 'Add privacy policy link (legal requirement + trust signal)'
    });
  }
  
  // Check: No fake urgency
  const suspiciousText = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase();
    return [
      text.includes('only 2 spots left') && !document.querySelector('[data-spots-remaining]'),
      text.includes('expires in') && !document.querySelector('[data-countdown]'),
      text.includes('limited time') && !document.querySelector('[data-end-date]')
    ];
  });
  
  if (suspiciousText.some(Boolean)) {
    issues.push({
      severity: 'critical',
      message: 'Potential fake urgency detected',
      recommendation: 'Use genuine scarcity only (Monzo principle: trust over tricks)'
    });
  }
  
  return { issues };
}
```

### Phase 3: Monzo Design System Validation

**Custom Design System Check:**
```javascript
// portfolio-redesign/.claude/design-review.json

{
  "template": "marketing-site",
  "designSystem": {
    "colorPalette": {
      "primary": "#0EBAC5",
      "secondary": "#FF5454",
      "accent": "#FFC700",
      "neutrals": ["#FFFFFF", "#F5F5F5", "#333333", "#666666"]
    },
    "typography": {
      "headings": "Inter Bold",
      "body": "Inter Regular",
      "code": "JetBrains Mono",
      "sizes": {
        "h1": "48px",
        "h2": "36px",
        "h3": "24px",
        "body": "18px",
        "small": "14px"
      }
    },
    "components": {
      "button": {
        "primary": {
          "background": "#FF5454",
          "color": "#FFFFFF",
          "borderRadius": "8px",
          "padding": "16px 32px"
        },
        "secondary": {
          "background": "#FFFFFF",
          "color": "#0EBAC5",
          "border": "2px solid #0EBAC5"
        }
      },
      "input": {
        "border": "2px solid #E0E0E0",
        "focusColor": "#0EBAC5",
        "borderRadius": "8px"
      },
      "card": {
        "background": "#FFFFFF",
        "border": "1px solid #E0E0E0",
        "borderRadius": "12px"
      }
    }
  }
}
```

---

## 🧪 Multi-Project Testing

### Test Matrix

| Project | Template | Framework | Port | Components | Priority Checks |
|---------|----------|-----------|------|------------|----------------|
| dashboard | web-app | Next.js | 3000 | 8 | Accessibility, Components |
| portfolio-redesign | marketing-site | Next.js | 3000 | 5 | Conversion, Copy, Trust |
| multi-layer-cal | web-app | Vite | 5173 | 12 | Performance, UX |

### E2E Test Script

```bash
#!/bin/bash
# test-multi-project-design-review.sh

echo "🧪 Testing Design Review across projects..."

# Test 1: Dashboard (existing)
echo "📊 Testing dashboard..."
cd dashboard
npm run dev &
DEV_PID=$!
sleep 5
git add src/components/Hero.tsx
git commit -m "test: design review" --no-verify
RESULT_1=$?
kill $DEV_PID

# Test 2: Portfolio (new)
echo "🎨 Testing portfolio-redesign..."
cd ../portfolio-redesign
npm run dev &
DEV_PID=$!
sleep 5
git add src/components/LandingPage.tsx
git commit -m "test: design review" --no-verify
RESULT_2=$?
kill $DEV_PID

# Test 3: Multi-layer-cal (different framework)
echo "📅 Testing multi-layer-cal..."
cd ../multi-layer-cal
pnpm dev &
DEV_PID=$!
sleep 5
git add src/components/Calendar.tsx
git commit -m "test: design review" --no-verify
RESULT_3=$?
kill $DEV_PID

# Summary
echo "========================================="
echo "Test Results:"
echo "Dashboard:          $([ $RESULT_1 -eq 0 ] && echo '✅' || echo '❌')"
echo "Portfolio:          $([ $RESULT_2 -eq 0 ] && echo '✅' || echo '❌')"
echo "Multi-layer-cal:    $([ $RESULT_3 -eq 0 ] && echo '✅' || echo '❌')"
echo "========================================="
```

---

## 📈 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Template Coverage** | 3+ templates | base, marketing-site, web-app |
| **Project Adoption** | 3+ projects using | dashboard, portfolio, multi-layer-cal |
| **Check Extensibility** | <1hr to add new check | Time to implement custom validator |
| **Performance** | <15s per review | From commit trigger to report |
| **Accuracy** | >90% actionable findings | % of findings that lead to fixes |

---

## 🎓 Lessons from Orchestrator

### Architectural Patterns to Follow

1. **Template System** ✅
   - Orchestrator: base, web-app, shopify project templates
   - Design Review: base, marketing-site, web-app validation templates

2. **Context Isolation** ✅
   - Orchestrator: Only one project loaded at a time
   - Design Review: Each project has isolated config/reports

3. **Progressive Disclosure** ✅
   - Orchestrator: Load skills on-demand
   - Design Review: Load extension checks only if enabled

4. **Diet103 500-Line Rule** ✅
   - Keep each validator module <500 lines
   - Split complex checks into smaller files

5. **Auto-Activation** ✅
   - Orchestrator: skill-rules.json triggers skills
   - Design Review: Pre-commit hook triggers checks

---

## 🚀 Implementation Roadmap

### Sprint 1: Multi-Project Foundation (1 week)
- [ ] Create template system architecture
- [ ] Implement framework detection
- [ ] Build CLI commands (init, templates, validate)
- [ ] Test with dashboard (existing) + portfolio (new)

### Sprint 2: Marketing Extensions (1 week)
- [ ] Implement conversion-check.js
- [ ] Implement copy-quality.js
- [ ] Implement trust-signals.js
- [ ] Test on portfolio-redesign landing page

### Sprint 3: Web App Extensions (1 week)
- [ ] Implement performance-budget.js
- [ ] Implement component-consistency.js
- [ ] Implement responsive-design.js
- [ ] Test on multi-layer-cal

### Sprint 4: Polish & Documentation (3 days)
- [ ] Write usage guide per template
- [ ] Create video walkthrough
- [ ] Document custom check creation
- [ ] Performance optimization

---

## 💡 Key Takeaways

1. **Scalability Through Templates:** One system adapts to any frontend project type
2. **Progressive Disclosure:** Load only checks needed for current project
3. **Monzo Principles Enforced:** Design review validates "Magic Moments," "Consistency," "Straightforward Kindness"
4. **Framework Agnostic:** Works with Next.js, Vite, Astro, etc.
5. **Extensible:** Easy to add custom validators for domain-specific needs

---

**Next Steps:**
1. Review this strategy with user
2. Create marketing-site template
3. Implement first custom check (conversion-check.js)
4. Test on portfolio-redesign landing page
5. Document findings and iterate

---

**Created:** 2025-11-19  
**Status:** Ready for implementation  
**Priority:** High (enables portfolio-redesign quality + scales to all frontend work)

🎉 **This is the bridge between Orchestrator infrastructure and portfolio marketing excellence!**

