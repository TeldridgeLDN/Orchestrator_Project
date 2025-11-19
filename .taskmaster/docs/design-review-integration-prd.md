# Design Review Integration PRD

**Project:** Orchestrator Multi-Project AI System  
**Feature:** Automated Design Review Workflow with Playwright MCP  
**Version:** 1.0  
**Date:** 2025-11-19  
**Status:** Planning

---

## Executive Summary

Integrate OneRedOak's design-review workflow pattern with our existing frontend_design_system skill to create a comprehensive development-to-validation pipeline. This provides proactive guidance during development AND automated quality validation before commits/deployment.

---

## Problem Statement

### Current State
- ✅ We have proactive design guidance (frontend_design_system skill)
- ✅ Developers get implementation patterns during coding
- ❌ No automated visual validation of rendered output
- ❌ No accessibility compliance checking on actual UI
- ❌ No visual regression detection
- ❌ Manual design review process

### Gaps
1. **Quality Gate Missing:** Code can be written following patterns but still have visual issues
2. **Accessibility Validation:** WCAG compliance not automatically verified
3. **Team Consistency:** No automated enforcement across multiple developers
4. **Regression Detection:** Visual breaking changes not caught early

---

## Goals & Success Criteria

### Primary Goals
1. **Automated Design Review:** Validate frontend code changes automatically
2. **Accessibility Compliance:** Ensure WCAG standards are met on rendered UI
3. **Visual Regression Detection:** Catch breaking changes before production
4. **Developer Experience:** Seamless integration with existing workflow

### Success Criteria
- ✅ Design review runs automatically on pre-commit for .tsx/.jsx files
- ✅ Playwright MCP successfully captures and analyzes rendered UI
- ✅ Accessibility violations are detected and reported
- ✅ Visual diffs generated for UI changes
- ✅ Integration completes in < 30 seconds for typical component changes
- ✅ Works for portfolio-redesign (dashboard/) initially
- ✅ Extensible to other frontend projects (multi-layer-cal, etc.)

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│  PHASE 1: DEVELOPMENT                                   │
│  ─────────────────────────────────────────────────────  │
│  • Developer edits dashboard/src/components/Hero.tsx   │
│  • frontend_design_system skill auto-activates         │
│  • Provides shadcn/ui patterns, icon guidelines        │
│  • Developer implements following guidance             │
└─────────────────────────────────────────────────────────┘
                          ↓
                    git add Hero.tsx
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 2: PRE-COMMIT HOOK TRIGGERS                      │
│  ─────────────────────────────────────────────────────  │
│  • .claude/hooks/design-review.js executes             │
│  • Detects staged .tsx/.jsx/.css files                 │
│  • Launches Playwright MCP browser                     │
│  • Renders affected components                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 3: AUTOMATED ANALYSIS                            │
│  ─────────────────────────────────────────────────────  │
│  • Playwright captures screenshots                     │
│  • Runs accessibility audit (axe-core)                 │
│  • Compares with baseline (visual diff)                │
│  • Claude analyzes results with design context         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 4: REPORTING                                     │
│  ─────────────────────────────────────────────────────  │
│  • Generate report: .claude/reports/design-review/     │
│  • Display results in terminal                         │
│  • If issues found: Block commit (optional) OR warn    │
│  • If clean: Allow commit to proceed                   │
└─────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. Playwright MCP Integration
- **Purpose:** Browser automation for rendering and capturing UI
- **Location:** MCP server configuration in .cursor/mcp.json
- **Capabilities:**
  - Launch headless browser
  - Navigate to dev server (localhost:3000)
  - Capture screenshots
  - Run accessibility audits
  - Execute JavaScript in page context

#### 2. Design Review Hook
- **Purpose:** Trigger design review workflow on pre-commit
- **Location:** `.claude/hooks/design-review.js`
- **Trigger Conditions:**
  - Staged files include .tsx, .jsx, .css
  - Project is identified as frontend (has package.json + React)
  - Dev server is running (localhost:3000)
- **Actions:**
  - Identify affected components
  - Launch Playwright browser
  - Render components
  - Capture visual state
  - Run accessibility audit
  - Generate report

#### 3. Design Review Workflow
- **Purpose:** Orchestrate the review process
- **Location:** `.claude/workflows/design-review/`
- **Components:**
  - `workflow.json` - Workflow definition
  - `analyze-component.js` - Component analysis logic
  - `accessibility-audit.js` - WCAG validation
  - `visual-diff.js` - Screenshot comparison
  - `report-generator.js` - Create readable reports

#### 4. Review Agent
- **Purpose:** AI-powered analysis of visual output
- **Location:** `.claude/agents/design-review-agent/`
- **Responsibilities:**
  - Analyze screenshots for design consistency
  - Evaluate accessibility audit results
  - Compare against design principles
  - Generate actionable feedback
  - Determine pass/fail status

#### 5. Configuration System
- **Purpose:** Project-specific review rules
- **Location:** `dashboard/.claude/design-review.json`
- **Configuration Options:**
  ```json
  {
    "enabled": true,
    "mode": "warn", // or "block"
    "checks": {
      "accessibility": true,
      "visualRegression": true,
      "designConsistency": true
    },
    "thresholds": {
      "accessibilityScore": 95,
      "visualDiffThreshold": 0.05
    },
    "devServer": {
      "url": "http://localhost:3000",
      "startCommand": "pnpm dev",
      "readyWhen": "Local:"
    },
    "components": {
      "routes": {
        "/": ["Hero", "Features", "Footer"],
        "/about": ["AboutHero", "Team"]
      }
    }
  }
  ```

---

## Implementation Requirements

### Phase 1: Core Infrastructure (Tasks 108-110)

**Task 108: Playwright MCP Server Setup**
- Install Playwright MCP server package
- Configure in .cursor/mcp.json
- Test browser launch and basic navigation
- Verify screenshot capture works
- Document configuration

**Task 109: Design Review Hook Implementation**
- Create `.claude/hooks/design-review.js`
- Implement pre-commit trigger logic
- Add file pattern detection (.tsx/.jsx/.css)
- Integrate with git hooks system
- Add dev server detection

**Task 110: Design Review Workflow Structure**
- Create workflow directory structure
- Implement workflow.json definition
- Create component analysis module
- Build accessibility audit module
- Implement visual diff comparison

### Phase 2: Analysis & Reporting (Tasks 111-113)

**Task 111: Design Review Agent Creation**
- Create sub-agent specification
- Implement screenshot analysis logic
- Add design principle validation
- Build accessibility evaluation
- Create feedback generation system

**Task 112: Report Generation System**
- Create report template structure
- Implement markdown report generator
- Add visual diff image embedding
- Create accessibility violation tables
- Build summary statistics

**Task 113: Configuration System**
- Create design-review.json schema
- Implement configuration loader
- Add validation for config values
- Create default configurations
- Document all options

### Phase 3: Portfolio Integration (Tasks 114-116)

**Task 114: Dashboard Project Integration**
- Add design-review.json to dashboard/
- Configure component routes mapping
- Set up dev server integration
- Test with existing components
- Create baseline screenshots

**Task 115: End-to-End Testing**
- Test complete workflow with real changes
- Verify accessibility detection works
- Validate visual diff generation
- Test pass/fail scenarios
- Document common issues and solutions

**Task 116: Documentation & Examples**
- Create usage guide for developers
- Document configuration options
- Provide example reports
- Create troubleshooting guide
- Write integration guide for new projects

### Phase 4: Extension & Optimization (Tasks 117-118)

**Task 117: Multi-Project Support**
- Create project detection logic
- Add framework-specific configurations
- Test with Next.js (dashboard)
- Document Vite integration (multi-layer-cal)
- Create project templates

**Task 118: Performance Optimization**
- Implement parallel component testing
- Add caching for unchanged components
- Optimize screenshot capture
- Reduce hook execution time
- Add selective component testing

---

## Technical Specifications

### Playwright MCP Configuration

```json
// .cursor/mcp.json addition
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp-server"],
      "env": {
        "PLAYWRIGHT_BROWSERS_PATH": "0"
      }
    }
  }
}
```

### Hook Implementation Pattern

```javascript
// .claude/hooks/design-review.js
export default {
  name: 'design-review',
  version: '1.0.0',
  trigger: 'pre-commit',
  
  // Only run for frontend files
  condition: async (context) => {
    const frontendFiles = context.stagedFiles.filter(f => 
      /\.(tsx|jsx|css)$/.test(f)
    );
    return frontendFiles.length > 0;
  },
  
  // Execute review workflow
  action: async (context) => {
    const workflow = await context.loadWorkflow('design-review');
    const results = await workflow.execute({
      files: context.stagedFiles,
      projectRoot: context.projectRoot
    });
    
    // Report results
    await context.report(results);
    
    // Block or warn based on config
    if (results.hasErrors && context.config.mode === 'block') {
      throw new Error('Design review failed. Fix issues before committing.');
    }
  }
};
```

### Workflow Definition

```json
// .claude/workflows/design-review/workflow.json
{
  "name": "design-review",
  "version": "1.0.0",
  "description": "Automated design review using Playwright MCP",
  "steps": [
    {
      "id": "detect-components",
      "module": "./detect-components.js",
      "input": ["changedFiles"],
      "output": "affectedComponents"
    },
    {
      "id": "start-dev-server",
      "module": "./dev-server.js",
      "input": ["projectRoot"],
      "output": "serverUrl"
    },
    {
      "id": "capture-screenshots",
      "module": "./playwright-capture.js",
      "input": ["affectedComponents", "serverUrl"],
      "output": "screenshots"
    },
    {
      "id": "accessibility-audit",
      "module": "./accessibility-audit.js",
      "input": ["affectedComponents", "serverUrl"],
      "output": "a11yResults"
    },
    {
      "id": "visual-diff",
      "module": "./visual-diff.js",
      "input": ["screenshots"],
      "output": "visualDiffs"
    },
    {
      "id": "ai-analysis",
      "agent": "design-review-agent",
      "input": ["screenshots", "a11yResults", "visualDiffs"],
      "output": "analysis"
    },
    {
      "id": "generate-report",
      "module": "./report-generator.js",
      "input": ["analysis"],
      "output": "report"
    }
  ]
}
```

### Agent Configuration

```json
// .claude/agents/design-review-agent/agent.json
{
  "name": "design-review-agent",
  "version": "1.0.0",
  "model": "claude-3-5-sonnet-20241022",
  "temperature": 0.3,
  "systemPrompt": "You are a design review specialist...",
  "tools": [
    "image-analysis",
    "accessibility-evaluation"
  ],
  "context": [
    "~/.claude/skills/frontend_design_system/SKILL.md",
    "~/.claude/skills/frontend_design_system/resources/design-principles.md"
  ]
}
```

---

## Success Metrics

### Quantitative Metrics
- **Review Time:** < 30 seconds for typical component changes
- **Accuracy:** 95%+ accessibility violation detection rate
- **Coverage:** All staged frontend files reviewed
- **Performance:** No more than 10% increase in commit time

### Qualitative Metrics
- Developer satisfaction with feedback quality
- Reduction in design issues reaching production
- Improved accessibility compliance scores
- Faster design iteration cycles

---

## Dependencies

### External Dependencies
- `@playwright/mcp-server` - Browser automation
- `axe-core` - Accessibility auditing
- `pixelmatch` - Visual diff comparison
- `sharp` - Image processing

### Internal Dependencies
- Existing hook system (`.claude/hooks/`)
- Workflow infrastructure (`.claude/workflows/`)
- Sub-agent system (`.claude/agents/`)
- frontend_design_system skill

### System Requirements
- Node.js 18+
- Playwright browsers installed
- Dev server capability (Next.js, Vite, etc.)
- Git for pre-commit hooks

---

## Rollout Plan

### Phase 1: Core Implementation (Week 1)
- Playwright MCP setup
- Hook implementation
- Basic workflow structure
- Initial testing

### Phase 2: Analysis & Reporting (Week 1)
- Agent creation
- Report generation
- Configuration system
- Documentation

### Phase 3: Portfolio Integration (Week 2)
- Dashboard integration
- End-to-end testing
- Bug fixes and refinements
- Performance tuning

### Phase 4: Extension (Week 2)
- Multi-project support
- Additional project testing
- Final documentation
- Knowledge transfer

---

## Risk Mitigation

### Identified Risks

1. **Dev Server Dependency**
   - Risk: Review can't run if dev server isn't available
   - Mitigation: Auto-start dev server, fallback to component testing

2. **Performance Impact**
   - Risk: Slow reviews frustrate developers
   - Mitigation: Parallel execution, caching, selective testing

3. **False Positives**
   - Risk: Blocking valid commits due to overly strict rules
   - Mitigation: Warn mode by default, configurable thresholds

4. **Playwright Compatibility**
   - Risk: Browser automation issues across environments
   - Mitigation: Comprehensive testing, fallback mechanisms

---

## Future Enhancements

### Potential Extensions
1. **CI/CD Integration:** Run in GitHub Actions
2. **Visual Regression Baseline Management:** Track approved designs
3. **Design System Validation:** Verify component library usage
4. **Performance Metrics:** Lighthouse scores, Core Web Vitals
5. **Cross-Browser Testing:** Test in multiple browsers
6. **Mobile Responsive Checks:** Validate mobile layouts

---

## Appendix

### Reference Implementation
- OneRedOak repository: https://github.com/OneRedOak/claude-code-workflows/tree/main/design-review
- Playwright MCP documentation
- diet103 hooks specification
- Orchestrator workflow system

### Related Documents
- `FRONTEND_DESIGN_SKILL_IMPLEMENTATION.md`
- `Orchestrator_PRD.md` - Section 3.6 (Agentic Features)
- `WORKFLOW_CREATION_GUIDE.md`
- Hook system documentation

---

**Status:** Ready for Implementation  
**Next Step:** Parse PRD and generate Task Master tasks  
**Target Start:** 2025-11-19



