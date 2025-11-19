# React Component Analyzer Skill

**Version:** 1.0.0  
**Scope:** React-based projects  
**Auto-Activation:** Design files, component development  
**Priority:** Medium

---

## Purpose

Transform UI design mockups into actionable React component specifications, design system documentation, and implementation guides. This is a **developer accelerator** that provides structured analysis and scaffolding, not a replacement for human judgment.

**Key Capabilities:**
- Extract design specifications from mockups (colors, typography, spacing)
- Generate component inventories and hierarchy maps
- Document interactive states and transitions
- Create React component scaffolding aligned with project conventions
- Provide implementation guidance for frontend developers

---

## When This Skill Activates

### Trigger Phrases
- "analyze design"
- "convert mockup"
- "design to code"
- "extract design system"
- "component from design"
- "mockup analysis"

### File Patterns
- Images in conversation (PNG, JPG, Figma exports)
- Design files in `design/`, `mockups/`, `figma/` directories
- Component files being created in `src/components/`

### Context Requirements
- Design image provided or referenced
- React project detected (via package.json)
- (Optional) Existing component library documentation

---

## Prerequisites

Before activating this skill, verify:

1. **Project Context**
   ```javascript
   // Auto-detected from project config
   - React version: 16.8+ (hooks required)
   - TypeScript: yes/no
   - CSS framework: tailwind|css-modules|styled-components|sass
   - Component library: mui|chakra|antd|custom|none
   ```

2. **Design Quality**
   - ✅ High-fidelity mockup (clear enough to extract colors/typography)
   - ⚠️ Medium-fidelity wireframe (can extract layout, limited styling)
   - ❌ Low-fidelity sketch (better suited for requirements gathering)

3. **Optional Enhancements**
   - Annotations showing interactions
   - Multiple states/screens (hover, error, loading)
   - Responsive variants (mobile, tablet, desktop)
   - Existing design system documentation

---

## v1.0 Scope: Analysis & Specification (Steps 1-4)

### What v1.0 Does

**Included:**
- ✅ Component inventory and hierarchy mapping
- ✅ Design system extraction (colors, typography, spacing)
- ✅ Interactive state documentation
- ✅ Structured design specification document
- ✅ Implementation guidance and recommendations

**Not Included (Future v1.1+):**
- ⏳ Full React component code generation
- ⏳ Automated testing strategies
- ⏳ Multi-framework support
- ⏳ Design diff detection

---

## Workflow Steps

### Step 1: Component Inventory & Hierarchy

When you receive a design image, systematically identify:

#### Component Types
```markdown
**Structural Components:**
- Layouts: Containers, sections, wrappers, grids
- Navigation: Headers, sidebars, breadcrumbs, tabs
- Cards/panels: Content containers with visual boundaries

**Interactive Components:**
- Buttons: Primary, secondary, tertiary, icon buttons
- Form inputs: Text, textarea, select, checkbox, radio, toggle
- Controls: Sliders, date pickers, file uploads

**Display Components:**
- Typography: Headings, body text, labels, hints, captions
- Media: Images, avatars, icons, badges
- Data display: Tables, lists, charts, progress bars

**Feedback Components:**
- Alerts/notifications: Success, warning, error, info
- Modals/dialogs: Confirmations, forms, detail views
- Tooltips/popovers: Contextual help, additional info
```

#### Hierarchy Mapping
```markdown
Document the nesting structure:

Page/Screen
├─ Header
│  ├─ Logo
│  ├─ Navigation
│  └─ User Menu
├─ Main Content
│  ├─ Sidebar (filters)
│  └─ Content Area
│     ├─ Card 1
│     │  ├─ Header
│     │  ├─ Body
│     │  └─ Actions
│     └─ Card 2
└─ Footer

Note:
- What appears conditionally? (e.g., error messages)
- What repeats dynamically? (e.g., list items)
- What's static vs. data-driven?
```

#### Output Format
```markdown
## Component Inventory

### Structural
- `PageContainer` - Full-page wrapper with max-width constraint
- `ContentGrid` - 2-column layout (sidebar + main)
- `Card` - Reusable content container with shadow and padding

### Interactive  
- `PrimaryButton` - Primary action button (blue background)
- `SearchInput` - Text input with search icon
- `FilterToggle` - Checkbox-style filter control

### Display
- `SectionHeading` - Large, bold section title
- `MetricBadge` - Small colored badge showing status
- `UserAvatar` - Circular user profile image

### Hierarchy
[Paste hierarchy tree from above]
```

---

### Step 2: Design System Extraction

Extract the visual design language with **confidence levels**.

#### Color Palette
```markdown
## Colors (with confidence indicators)

**Primary Palette:**
- Primary: #3B82F6 (HIGH - clear from multiple buttons)
- Primary Hover: #2563EB (MEDIUM - estimated from interaction hints)
- Primary Text: #FFFFFF (HIGH - white text on blue buttons)

**Semantic Colors:**
- Success: #10B981 (HIGH - green success badge visible)
- Warning: #F59E0B (MEDIUM - inferred from design patterns)
- Error: #EF4444 (HIGH - red error message shown)
- Info: #3B82F6 (LOW - assuming primary blue for info)

**Neutral Palette:**
- Background: #FFFFFF (HIGH)
- Surface: #F9FAFB (HIGH - gray card backgrounds)
- Border: #E5E7EB (HIGH - visible card borders)
- Text Primary: #111827 (HIGH - main text color)
- Text Secondary: #6B7280 (HIGH - subtitle/caption text)

**Notes:**
- All colors extracted via pixel sampling
- Hover states estimated (not shown in static image)
- Consider loading actual brand colors if available
```

#### Typography
```markdown
## Typography (estimated from visual characteristics)

**Font Family:**
- Sans-serif (MEDIUM confidence)
- Likely: Inter, Roboto, or system-ui
- Recommendation: Check with design team or use project default

**Type Scale:**
- Display: ~32px, 700 weight (large headings)
- H1: ~24px, 600 weight (page titles)
- H2: ~20px, 600 weight (section headings)
- H3: ~18px, 600 weight (card titles)
- Body: ~16px, 400 weight (main text)
- Caption: ~14px, 400 weight (hints, labels)
- Small: ~12px, 400 weight (metadata, timestamps)

**Line Height:**
- Headings: 1.2-1.3
- Body text: 1.5
- Captions: 1.4

**Letter Spacing:**
- Headings: -0.02em (slightly tighter)
- Body: 0em (normal)

**Notes:**
- Font sizes estimated from visual proportion
- Exact values should be confirmed with design specs
```

#### Spacing System
```markdown
## Spacing (base-8 system detected)

**Base Unit:** 8px

**Scale:**
- 2xs: 4px (tight element spacing)
- xs: 8px (input padding, small gaps)
- sm: 12px (button padding vertical)
- md: 16px (button padding horizontal, card padding)
- lg: 24px (section spacing)
- xl: 32px (large gaps between sections)
- 2xl: 48px (major section breaks)

**Layout Patterns:**
- Card padding: 16px (md)
- Button padding: 12px 16px (sm md)
- Section gaps: 24px (lg)
- Page margins: 32px (xl)

**Notes:**
- Spacing follows consistent 8px grid
- Measured from visible gaps in design
```

#### Visual Effects
```markdown
## Visual Effects

**Shadows:**
- Card shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)
- Button shadow: 0 1px 2px rgba(0,0,0,0.05)
- Modal shadow: 0 10px 25px rgba(0,0,0,0.15)

**Borders:**
- Default: 1px solid #E5E7EB
- Focus: 2px solid #3B82F6
- Error: 1px solid #EF4444

**Border Radius:**
- Buttons: 6px
- Cards: 8px
- Inputs: 6px
- Avatars: 50% (circular)
- Badges: 4px

**Opacity:**
- Disabled elements: 0.5
- Overlay backgrounds: 0.75

**Notes:**
- Shadow values estimated from visual depth
- Actual CSS may need refinement for exact match
```

---

### Step 3: Interactive State Mapping

Document all observable and inferred interaction states.

```markdown
## Interactive States

### Button States
**Default (Rest):**
- Background: #3B82F6
- Text: #FFFFFF
- Border: none
- Shadow: subtle

**Hover (INFERRED - not shown):**
- Background: #2563EB (darker blue)
- Cursor: pointer
- Shadow: slightly stronger

**Active/Pressed (INFERRED):**
- Background: #1E40AF (even darker)
- Transform: scale(0.98)

**Focus (keyboard navigation):**
- Outline: 2px solid #3B82F6 with 2px offset
- Ring: blue glow

**Disabled (shown in image):**
- Background: #E5E7EB (gray)
- Text: #9CA3AF (light gray)
- Cursor: not-allowed
- Opacity: 0.6

**Loading (INFERRED):**
- Show spinner icon
- Text: "Loading..." or keep original text
- Disabled interaction

### Input States
**Default:**
- Border: 1px solid #E5E7EB
- Background: #FFFFFF
- Placeholder: #9CA3AF

**Focus:**
- Border: 2px solid #3B82F6
- Outline: blue ring
- Background: #FFFFFF

**Error (shown in image):**
- Border: 1px solid #EF4444 (red)
- Background: #FEF2F2 (light red tint)
- Error message below: red text

**Success:**
- Border: 1px solid #10B981 (green)
- Icon: green checkmark

**Disabled:**
- Background: #F9FAFB (light gray)
- Border: #E5E7EB
- Cursor: not-allowed

### Card States
**Default:**
- Shadow: soft
- Border: 1px solid #E5E7EB
- Background: #FFFFFF

**Hover (if interactive):**
- Shadow: medium
- Border: 1px solid #D1D5DB (slightly darker)
- Transform: translateY(-2px)

### Modal/Overlay States
**Closed (default):**
- Display: none
- Opacity: 0

**Opening (transition shown with arrow):**
- Backdrop fade-in: 200ms
- Modal slide-in: 300ms ease-out
- Transform: translateY(20px) → translateY(0)

**Open:**
- Backdrop: rgba(0,0,0,0.5)
- Modal: centered, full opacity
- Focus trap: enabled

**Closing:**
- Reverse of opening animation

### State Triggers
- Button click → Action state → Success/error feedback
- Input focus → Focus state
- Input validation → Error state (if invalid)
- Data loading → Loading state → Success state (data appears)
- Modal trigger → Modal opening transition
```

---

### Step 4: Generate Design Specification Document

Output format:

```markdown
# Design Specification: [Feature/Component Name]

**Date:** [Today's date]  
**Designer:** [If known]  
**Confidence:** [Overall: HIGH/MEDIUM/LOW]

---

## Overview

[2-3 sentence description of what this design represents]

Example:
> This design shows a user dashboard with activity cards, filter controls, 
> and a metrics overview. The layout uses a sidebar navigation pattern with 
> a main content area displaying time-based event cards.

---

## Component Inventory

[Paste from Step 1]

---

## Design System

### Color Palette
[Paste from Step 2]

### Typography
[Paste from Step 2]

### Spacing System
[Paste from Step 2]

### Visual Effects
[Paste from Step 2]

---

## Interactive States

[Paste from Step 3]

---

## Implementation Recommendations

### Component Architecture

**Suggested Component Breakdown:**
```
src/components/
├── layout/
│   ├── PageContainer.tsx
│   ├── ContentGrid.tsx
│   └── Sidebar.tsx
├── ui/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── Badge.tsx
└── features/
    ├── ActivityCard.tsx
    ├── MetricsPanel.tsx
    └── FilterBar.tsx
```

### State Management

**Local State:**
- Button loading/disabled states
- Input validation errors
- Modal open/closed
- Filter selections

**Global State (if needed):**
- User data
- Activity feed data
- Applied filters

**Recommended Approach:**
- Use `useState` for simple UI state
- Use `useReducer` for complex form state
- Consider Context API for filter state (if shared across components)
- Use React Query/SWR for data fetching state

### Data Requirements

**Expected Data Structures:**
```typescript
interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  status: 'pending' | 'complete' | 'error';
  user: {
    name: string;
    avatar: string;
  };
}

interface Metrics {
  total: number;
  active: number;
  pending: number;
  completed: number;
}
```

### Responsive Considerations

**Breakpoints:**
- Mobile: < 640px (stack cards vertically, hide sidebar)
- Tablet: 640px - 1024px (show toggle for sidebar)
- Desktop: > 1024px (show sidebar by default)

**Layout Changes:**
- Mobile: Single column, filters in drawer
- Tablet: 2-column grid for cards, collapsible sidebar
- Desktop: Full sidebar + multi-column card grid

### Accessibility Requirements

**Keyboard Navigation:**
- Tab order: logical flow (top to bottom, left to right)
- Escape key: close modals/drawers
- Enter/Space: activate buttons
- Arrow keys: navigate list items

**Screen Reader Support:**
- Label all inputs with `aria-label` or associated `<label>`
- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Provide `aria-live` regions for dynamic updates
- Include `aria-describedby` for error messages

**Focus Management:**
- Visible focus indicators (blue ring)
- Focus trap in modals
- Return focus to trigger element after modal closes

### Integration Points

**API Endpoints (assumed):**
- `GET /api/activities` - Fetch activity list
- `GET /api/metrics` - Fetch metrics summary
- `POST /api/activities/:id/complete` - Mark activity complete

**External Dependencies:**
```json
{
  "lucide-react": "^0.263.1",  // Icons
  "date-fns": "^2.30.0",        // Date formatting
  "clsx": "^2.0.0"              // Conditional classNames
}
```

### Testing Strategy

**Unit Tests:**
- Button states (disabled, loading)
- Input validation logic
- Date formatting utilities

**Integration Tests:**
- Form submission flow
- Filter application
- Activity card interactions

**Visual Regression:**
- Screenshot tests for each component state
- Test responsive breakpoints

---

## Developer Checklist

**Before Starting Implementation:**
- [ ] Confirm design specs with designer
- [ ] Verify color values match brand guidelines
- [ ] Check if existing components can be reused
- [ ] Review accessibility requirements with team
- [ ] Set up component library (if creating from scratch)

**During Implementation:**
- [ ] Follow project's file structure conventions
- [ ] Use design tokens (colors, spacing) from spec
- [ ] Implement all interactive states
- [ ] Add TypeScript types for props
- [ ] Include JSDoc comments for component props
- [ ] Handle loading/error states
- [ ] Test keyboard navigation

**After Implementation:**
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Responsive testing (mobile, tablet, desktop)
- [ ] Accessibility audit (axe DevTools)
- [ ] Code review with team
- [ ] Update Storybook/component documentation

---

## Open Questions

[List any ambiguities or clarifications needed]

Examples:
- What happens when activity list is empty? Show empty state?
- Should filters persist across page refreshes?
- Are there any animations/transitions beyond modal open/close?
- What's the max length for activity titles? How to handle overflow?

---

## Confidence Assessment

**HIGH Confidence:**
- Color palette (extracted from design)
- Component layout and hierarchy
- Basic interactive states

**MEDIUM Confidence:**
- Font family (estimated from visual characteristics)
- Exact spacing values (measured from image)
- Hover/active states (inferred from patterns)

**LOW Confidence:**
- Responsive breakpoints (not shown in image)
- Animation timing (no motion in static image)
- Empty/loading states (not visible in design)

**Recommendation:** Review these specs with design team before final implementation.

---

**Generated by:** React Component Analyzer v1.0  
**Requires Review:** Yes (human validation recommended)
```

---

## Usage Guidelines

### Step-by-Step Usage

1. **Provide Context**
   ```
   "Analyze this design mockup for our React dashboard. 
   We're using TypeScript and Tailwind CSS."
   ```

2. **Share Image**
   - Paste image in chat
   - Or reference file path: `design/dashboard-mockup.png`

3. **Specify Focus (optional)**
   ```
   "Focus on the activity card component"
   or
   "Extract the full design system"
   ```

4. **Review Output**
   - Check confidence levels
   - Verify against design files
   - Ask clarifying questions

5. **Request Refinements**
   ```
   "Can you elaborate on the responsive breakpoints?"
   "Show me the TypeScript interfaces for the data structures"
   ```

### Best Results When You:

✅ **DO:**
- Provide high-quality design images
- Share project context (framework, styling approach)
- Specify which parts to focus on
- Ask questions about ambiguous elements
- Review and validate extracted values

❌ **DON'T:**
- Expect pixel-perfect accuracy without review
- Assume generated values are production-ready
- Skip validation with design team
- Use low-quality/blurry images
- Expect it to generate full production code (v1.0 limitation)

---

## Output Modes

### Mode 1: Quick Analysis (Default)
**Time:** ~2-3 minutes  
**Output:** Component inventory + basic design system

### Mode 2: Full Specification (Recommended)
**Time:** ~5-8 minutes  
**Output:** Complete design spec document (all 4 steps)

### Mode 3: Component Focus
**Time:** ~3-5 minutes  
**Output:** Deep dive on specific component(s)

### Mode 4: Design System Only
**Time:** ~2-3 minutes  
**Output:** Colors, typography, spacing, effects (skip components)

**Specify mode in your request:**
```
"Quick analysis of this design"
"Full specification for implementation"
"Focus on the card component"
"Extract just the design system tokens"
```

---

## Integration with Orchestrator

### Auto-Save Locations

```bash
# Design specs saved to
.claude/knowledge/design-specs/[feature-name].md

# Component tasks added to
.taskmaster/tasks/tasks.json

# Design tokens extracted to (if requested)
src/styles/design-tokens.ts
```

### Task Creation

After generating a spec, the skill can:

```bash
# Auto-create implementation tasks
task-master add-task \
  --prompt="Implement [Component] based on design spec" \
  --dependencies="design-spec-review"

# Add to current sprint
task-master add-tag design-implementation
```

### Rule Respect

This skill automatically:
- Checks `.claude/rules/react.mdc` for component conventions
- Follows `.claude/rules/typescript.mdc` for type patterns
- Respects project styling approach from config

---

## Limitations & Disclaimers

### What This Skill Cannot Do

❌ **Cannot:**
- Read Figma files directly (export to image first)
- Generate pixel-perfect measurements (estimates only)
- Determine exact font families from images
- Show animations/transitions from static images
- Access design system documentation (unless provided)
- Generate production-ready code (v1.0)
- Detect business logic requirements
- Understand project-specific naming conventions (without context)

### Accuracy Expectations

**Visual Elements:** 85-90% accuracy
- Colors, layouts, component types

**Typography:** 60-70% accuracy  
- Font sizes approximate, families estimated

**Spacing:** 70-80% accuracy
- Measured from image, may need refinement

**Interactions:** 40-60% accuracy
- Inferred from static images, needs validation

### Required Manual Steps

After using this skill, developers should:

1. **Validate Specs**
   - Confirm colors with design files
   - Verify spacing with design team
   - Check font families against brand guidelines

2. **Implement Code**
   - Use specs as scaffolding, not final code
   - Apply project conventions
   - Add business logic

3. **Test Thoroughly**
   - Cross-browser testing
   - Responsive behavior
   - Accessibility audit

---

## Future Roadmap

### v1.1 (Planned)
- React component code generation
- Integration with existing component libraries
- Design diff detection (compare v1 vs v2)

### v1.2 (Planned)
- Storybook story generation
- Automated test scaffolding
- Design token export (CSS variables, Tailwind config)

### v2.0 (Planned)
- Multi-framework support (Vue, Svelte, Angular)
- Figma plugin integration
- Real-time collaboration features

---

## Troubleshooting

### "Cannot extract design system"
**Cause:** Image quality too low or design too complex

**Solution:**
- Use higher resolution image
- Break design into smaller sections
- Provide multiple views (zoomed in/out)

### "Generated spec doesn't match design"
**Cause:** AI misinterpreted visual elements

**Solution:**
- Provide annotations on image
- Describe ambiguous elements in prompt
- Review confidence levels and validate manually

### "Missing interactive states"
**Cause:** Static image doesn't show all states

**Solution:**
- Provide multiple images (default, hover, error)
- Describe expected interactions in prompt
- Reference similar components in project

### "Code suggestions don't match project style"
**Cause:** Skill lacks project context

**Solution:**
- Share project config in prompt
- Reference existing component files
- Specify TypeScript/JavaScript, CSS framework, etc.

---

## Related Resources

**Orchestrator Docs:**
- `.claude/knowledge/patterns/component-design.md`
- `.claude/rules/react.mdc`
- `.claude/rules/typescript.mdc`

**External Resources:**
- [React Docs - Components](https://react.dev)
- [Tailwind CSS - Design Tokens](https://tailwindcss.com)
- [MDN - Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

## Quick Reference

### Commands

```bash
# Activate skill manually
"Activate react-component-analyzer skill"

# Run full analysis
"Analyze this design mockup: [paste image]"

# Focus on component
"Extract specs for the button component"

# Design system only
"Get design tokens from this mockup"

# Save to knowledge base
"Save design spec to .claude/knowledge/design-specs/"
```

### Key Phrases

- "analyze design" → Full workflow
- "extract colors" → Color palette only
- "component breakdown" → Inventory + hierarchy
- "design system" → Visual design extraction
- "implementation guide" → Developer recommendations

---

**Auto-Activation Priority:** Medium  
**Related Skills:** doc-generator, shell-integration  
**Related Agents:** code-reviewer

---

**Last Updated:** November 15, 2025  
**Skill Maturity:** v1.0 (Analysis & Specification Only)

