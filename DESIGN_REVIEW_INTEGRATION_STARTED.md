# Design Review Integration - Initial Implementation

**Date:** 2025-11-19  
**Status:** ✅ Core Infrastructure Started  
**Tasks Created:** 115-124 (10 tasks)

---

## Summary

Successfully initiated the integration of automated design review workflow combining our proactive frontend_design_system skill with OneRedOak's reactive validation approach using Playwright MCP.

---

## What We've Built

### 1. Task Planning ✅
- Created comprehensive PRD: `.taskmaster/docs/design-review-integration-prd.md`
- Generated 10 tasks (115-124) covering full implementation
- Expanded Task 115 with 5 subtasks
- **Note:** Fixed Perplexity API key issue in `.cursor/mcp.json`

### 2. Playwright MCP Setup ✅ (Task 115.1 Complete)

**Installed:**
```bash
npm install --save-dev playwright @playwright/test
```

**Configured MCP Server:**
```json
// .cursor/mcp.json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp-server"]
    }
  }
}
```

### 3. Design Review Hook ✅ (Created)

**Location:** `.claude/hooks/design-review.js`

**Capabilities:**
- ✅ Pre-commit trigger for `.tsx/.jsx/.css` files
- ✅ Dev server detection and startup
- ✅ Component identification from staged files
- ✅ Accessibility checking (placeholder for axe-core integration)
- ✅ Visual regression detection (placeholder for Playwright screenshots)
- ✅ Design consistency validation
- ✅ Markdown report generation
- ✅ Configurable `warn` vs `block` modes

**Hook Flow:**
```
git add Hero.tsx
    ↓
Pre-commit trigger
    ↓
Check staged files (.tsx/.jsx/.css)
    ↓
Load .claude/design-review.json config
    ↓
Check if dev server running
    ↓
Detect affected components
    ↓
Run checks:
  - Accessibility (axe-core)
  - Visual regression (screenshots)
  - Design consistency
    ↓
Generate report in .claude/reports/design-review/
    ↓
Display summary
    ↓
Warn or block based on config
```

### 4. Dashboard Configuration ✅ (Created)

**Location:** `dashboard/.claude/design-review.json`

```json
{
  "enabled": true,
  "mode": "warn",
  "checks": {
    "accessibility": true,
    "visualRegression": false,
    "designConsistency": true
  },
  "thresholds": {
    "accessibilityScore": 95,
    "visualDiffThreshold": 0.05
  },
  "devServer": {
    "url": "http://localhost:3000",
    "autoStart": false,
    "startCommand": "pnpm dev",
    "readyTimeout": 30000
  },
  "components": {
    "/": ["Hero", "Features", "Footer"],
    "/about": ["AboutHero", "Team"]
  }
}
```

---

## Architecture Overview

```
┌────────────────────────────────────────────────────┐
│  PROACTIVE: Development Phase                     │
│  ──────────────────────────────────────────────   │
│  • Edit dashboard/src/components/Hero.tsx         │
│  • frontend_design_system skill auto-activates    │
│  • Get shadcn/ui patterns, icon guidelines        │
│  • Build with guidance                            │
└────────────────────────────────────────────────────┘
                        ↓
                   git add Hero.tsx
                        ↓
┌────────────────────────────────────────────────────┐
│  REACTIVE: Pre-Commit Validation                  │
│  ──────────────────────────────────────────────   │
│  • .claude/hooks/design-review.js triggers        │
│  • Playwright MCP launches browser                │
│  • Captures screenshots, runs axe-core            │
│  • Generates accessibility audit                  │
│  • Creates visual diffs                           │
│  • Validates against design principles            │
│  • Generates markdown report                      │
│  • Warns or blocks based on config               │
└────────────────────────────────────────────────────┘
```

---

## Tasks Breakdown

### ✅ Task 115: Playwright MCP Server Setup (In Progress)
- **115.1:** ✅ Install and configure (DONE)
- **115.2:** Create test script
- **115.3:** Implement PlaywrightHelper utility
- **115.4:** Integrate with startup verification
- **115.5:** Create documentation

### 📋 Task 116: Design Review Hook (DONE - Hook Created)
- Implement pre-commit logic
- File pattern detection
- Git hooks integration
- Dev server detection

### 📋 Task 117: Design Review Workflow Structure
- Create workflow directory
- Implement workflow.json
- Component analysis module
- Accessibility audit (axe-core)
- Visual diff (pixelmatch)

### 📋 Task 118: Design Review Agent
- Create sub-agent spec
- Screenshot analysis
- Design principle validation
- Accessibility evaluation
- Feedback generation

### 📋 Task 119: Report Generation System
- Report templates
- Markdown generator
- Visual diff embedding
- Accessibility tables
- Summary statistics

### 📋 Task 120: Configuration System
- Schema creation
- Config loader
- Validation
- Default configurations

### 📋 Task 121: Dashboard Integration
- Add design-review.json (DONE)
- Component routes mapping
- Next.js dev server setup
- Test with components
- Baseline screenshots

### 📋 Task 122: End-to-End Testing
- Test full workflow
- Verify accessibility detection
- Validate visual diffs
- Test pass/fail scenarios
- Document issues

### 📋 Task 123: Documentation & Examples
- Usage guide
- Configuration docs
- Sample reports
- Troubleshooting guide
- Integration guide

### 📋 Task 124: Performance Optimization
- Parallel testing
- Component caching
- Screenshot optimization
- Reduce execution time < 30s
- Selective testing

---

## Next Steps

### Immediate (Complete Task 115):
1. ✅ **115.1 Done:** Package install and MCP config
2. **115.2:** Create test script (`test-playwright-mcp.js`)
3. **115.3:** Build PlaywrightHelper utility
4. **115.4:** Add startup verification
5. **115.5:** Write documentation

### Phase 2 (Tasks 117-118):
- Implement actual Playwright integration in hook
- Add axe-core for accessibility testing
- Create workflow modules
- Build design review agent

### Phase 3 (Tasks 119-120):
- Report generation system
- Configuration loader
- Threshold validation

### Phase 4 (Tasks 121-123):
- Dashboard testing
- End-to-end workflow
- Documentation

### Phase 5 (Task 124):
- Performance tuning
- Multi-project support

---

## Files Created

```
.taskmaster/docs/design-review-integration-prd.md    # Full PRD
.cursor/mcp.json                                      # Updated with Playwright
.claude/hooks/design-review.js                        # Hook implementation
dashboard/.claude/design-review.json                  # Dashboard config
```

---

## Key Decisions

### 1. Two-Phase Approach
- **Proactive:** frontend_design_system skill during development
- **Reactive:** Playwright validation on pre-commit

### 2. Hook-Based Integration
- Leverages existing Orchestrator hook system
- Automatic trigger on frontend file changes
- Configurable per-project

### 3. Warn-First Strategy
- Default mode: `warn` (don't block commits)
- Projects can opt into `block` mode
- Gradual adoption path

### 4. Playwright MCP
- Uses official `@playwright/mcp-server`
- Browser automation for visual testing
- Screenshot capture and comparison
- axe-core integration for accessibility

### 5. Component-Based Analysis
- Detect affected components from file changes
- Map components to routes
- Selective testing (performance)

---

## Configuration Options

### Per-Project Config (`.claude/design-review.json`)

```typescript
interface DesignReviewConfig {
  enabled: boolean;
  mode: 'warn' | 'block';
  checks: {
    accessibility: boolean;
    visualRegression: boolean;
    designConsistency: boolean;
  };
  thresholds: {
    accessibilityScore: number; // 0-100
    visualDiffThreshold: number; // 0-1
  };
  devServer: {
    url: string;
    autoStart: boolean;
    startCommand: string;
    readyTimeout: number;
  };
  components: Record<string, string[]>; // route -> component names
}
```

---

## Technical Stack

- **Browser Automation:** Playwright MCP
- **Accessibility Testing:** axe-core (to be integrated)
- **Visual Diff:** pixelmatch (to be integrated)
- **Image Processing:** sharp (to be integrated)
- **Hook System:** Existing Orchestrator hooks
- **Dev Server:** Next.js (dashboard), Vite (multi-layer-cal)

---

## Benefits

### For Developers
✅ Proactive guidance during coding  
✅ Automated validation before commit  
✅ Fast feedback loop (< 30s target)  
✅ Learn from violations  
✅ Confidence in accessibility

### For Teams
✅ Consistent design standards  
✅ Reduced manual review time  
✅ Catch issues early  
✅ Portable across projects  
✅ Configurable enforcement

### For Users
✅ Better accessibility  
✅ Consistent UI/UX  
✅ Fewer visual bugs  
✅ Professional quality

---

## Known Limitations

1. **Dev Server Dependency:** Requires running dev server for visual checks
2. **No Baseline Yet:** Visual regression needs initial baselines
3. **Placeholder Checks:** Actual Playwright/axe-core integration pending
4. **Performance:** Not yet optimized for large component counts

---

## Comparison: Our System vs OneRedOak

| Feature | OneRedOak | Our System |
|---------|-----------|------------|
| **Timing** | Post-implementation | During + Post |
| **Guidance** | No (review only) | Yes (skill-based) |
| **Scope** | Visual validation | Visual + Guidance + Patterns |
| **Token Cost** | Higher (full pages) | Lower (progressive disclosure) |
| **Setup** | Manual Playwright | Auto-detecting hook |
| **Integration** | CI/CD focused | Pre-commit + CI/CD |
| **Extensibility** | Project-specific | Multi-project ready |

---

## Success Criteria

- [x] PRD created and approved
- [x] Tasks generated in Task Master
- [x] Playwright MCP configured
- [x] Hook created and functional structure
- [x] Dashboard config created
- [ ] Test script working
- [ ] Actual accessibility checks functional
- [ ] Visual regression working
- [ ] End-to-end test passing
- [ ] < 30s execution time
- [ ] Documentation complete

---

## Resources

- **PRD:** `.taskmaster/docs/design-review-integration-prd.md`
- **Hook:** `.claude/hooks/design-review.js`
- **Config Example:** `dashboard/.claude/design-review.json`
- **OneRedOak Reference:** https://github.com/OneRedOak/claude-code-workflows/tree/main/design-review
- **Playwright Docs:** https://playwright.dev/
- **axe-core Docs:** https://github.com/dequelabs/axe-core

---

## Status Summary

**Current Progress:** 15% Complete

- ✅ Planning & PRD (100%)
- ✅ Core Infrastructure (20% - Playwright installed, hook created)
- ⏳ Implementation (0% - Actual checks pending)
- ⏳ Testing (0%)
- ⏳ Documentation (0%)
- ⏳ Optimization (0%)

**Estimated Completion:** 2 weeks (based on PRD timeline)

**Next Session Priority:** Complete Task 115 (Playwright setup), start Task 117 (workflow implementation)

---

**Ready to continue building!** 🚀

