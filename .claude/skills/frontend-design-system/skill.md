# Frontend Design System & Layout Patterns Skill

**Version:** 1.0.0  
**Scope:** React-based frontend projects  
**Auto-Activation:** Component generation, layout creation  
**Priority:** High  
**Token Footprint:** ~300 tokens (overview only)

---

## Purpose

Provide comprehensive design system specifications for building consistent, accessible, and visually cohesive React user interfaces. This skill is your **source of truth** for spacing, typography, colors, component specifications, and layout patterns.

**Key Benefits:**
- Eliminate arbitrary spacing and sizing decisions
- Maintain visual consistency across projects
- Speed up component development with proven specifications
- Ensure accessibility and responsiveness from the start
- Reduce "decision fatigue" during implementation

**Projects Using This:**
- `multi-layer-cal` - Calendar application
- `portfolio-redesign` - Personal portfolio site
- Any React-based UI project requiring consistent design

---

## When This Skill Activates

### Trigger Phrases
- "design system"
- "spacing system"
- "typography scale"
- "color palette"
- "component specs"
- "layout pattern"
- "button variants"
- "calendar grid"
- "card grid"
- "form layout"

### Context Requirements
- React project detected (package.json)
- Creating or modifying UI components
- Building page layouts
- Setting up CSS framework configuration

---

## Quick Start

### Most Common Requests

#### 1. Full Design System
```
"Load the frontend design system"
"Show me the complete design specs"
```
→ Use when starting new project or comprehensive refactor

#### 2. Specific Component
```
"Show button component specs"
"What are the input field specifications?"
"Give me card component details"
```
→ Use when implementing individual components

#### 3. Layout Pattern
```
"Show calendar grid layout pattern"
"I need the two-column blog layout"
"Card grid pattern specifications"
```
→ Use when building specific page layouts

#### 4. Design Tokens Only
```
"Export design tokens for Tailwind"
"Show spacing and color values"
"Give me CSS variables for the design system"
```
→ Use when setting up theme configuration

---

## Design System Overview

### Core Principles

**1. Consistency Over Perfection**
- Use specifications as guidelines, not rigid rules
- Adjust for specific contexts when needed
- Document deviations for team awareness

**2. Whitespace is Intentional**
- Don't reduce spacing "to fit"
- Adjust layout structure instead
- Breathing room improves readability and hierarchy

**3. Accessibility First**
- Minimum 44px touch targets
- WCAG AA color contrast (minimum)
- Semantic HTML and ARIA when needed

**4. Responsive by Default**
- Consider mobile, tablet, desktop from start
- Test at all breakpoints during development
- Progressive enhancement approach

**5. Design Tokens**
- Configure values once
- Reference throughout codebase
- Change globally, apply everywhere

---

## Available Resources

Load specific resources as needed for progressive detail:

### Quick Reference (`quick-ref`)
**Size:** < 200 lines | **Read Time:** 3 minutes

Essential values at a glance: spacing scale, typography roles, color palette, component quick specs.

**Contains:**
- Spacing system (xs to 3xl)
- Typography scale with use cases
- Complete color palette
- Component size references
- Responsive breakpoints

**Request:** "Show design system quick reference"

→ [View Quick Reference](resources/quick-ref.md)

---

### Component Specifications (`component-specs`)
**Size:** < 500 lines | **Read Time:** 8 minutes

Detailed specifications for Button, Input, Card, Badge components with variants, sizes, and states.

**Contains:**
- Button (variants: primary, secondary, ghost, destructive)
- Input/Form Field (states: default, focus, error, disabled)
- Card (with hover states)
- Badge (semantic variants)
- All sizes, paddings, colors, borders

**Request:** "Show component specifications"

→ [View Component Specs](resources/component-specs.md)

---

### Layout Patterns (`layout-patterns`)
**Size:** < 500 lines | **Read Time:** 10 minutes

Six proven layout patterns with complete specifications and spacing keys.

**Contains:**
- Two Column Blog Layout
- Calendar Grid
- Card Grid
- Form Layout
- Navigation Header
- Hero Section
- Responsive considerations for each

**Request:** "Show layout patterns"

→ [View Layout Patterns](resources/layout-patterns.md)

---

### Implementation Guide (`implementation-guide`)
**Size:** < 300 lines | **Read Time:** 5 minutes

How to translate specs into code using CSS-in-JS, Tailwind, CSS Modules, etc.

**Contains:**
- Tailwind configuration setup
- CSS Variables approach
- Styled-components theme
- SCSS variables
- TypeScript type definitions
- Best practices for each approach

**Request:** "Show implementation guide"

→ [View Implementation Guide](resources/implementation-guide.md)

---

## Design Token Summary

### Spacing System (Base-8)
```
xs:   4px   (tight, rarely used)
sm:   8px   (subtle spacing)
md:   16px  (default, comfortable)
lg:   24px  (generous)
xl:   32px  (significant breathing room)
2xl:  48px  (major sections)
3xl:  64px  (page-level spacing)
```

### Typography Scale
```
Display:     48px, 700 weight (hero headings)
Heading 1:   36px, 600 weight (page titles)
Heading 2:   28px, 600 weight (section titles)
Heading 3:   24px, 600 weight (subsections)
Body Large:  18px, 400 weight (primary content)
Body:        16px, 400 weight (standard text)
Body Small:  14px, 400 weight (secondary text)
Label:       12px, 500 weight (captions)
Caption:     11px, 400 weight (micro copy)
```

### Color Palette
```
Primary:     #0066CC (actions, links, highlights)
Success:     #10B981 (positive actions)
Warning:     #F59E0B (cautions)
Error:       #EF4444 (errors, destructive actions)
Info:        #3B82F6 (information)

Grays:       50, 100, 200, 300, 500, 700, 900
```

### Responsive Breakpoints
```
Mobile:      < 640px
Tablet:      640px - 1024px
Desktop:     > 1024px
```

---

## Usage Examples

### Example 1: Create Button Component
```typescript
// Request:
"Using the design system, create a React Button component 
with primary, secondary, and ghost variants"

// Claude will:
1. Load component-specs resource
2. Reference Button specifications
3. Generate component following exact specs:
   - Sizes: sm (8px padding), md (12px), lg (16px)
   - Variants: primary, secondary, ghost
   - States: default, hover, active, disabled, loading
   - Colors from design system palette
   - Border radius: 6px
```

### Example 2: Build Calendar Layout
```typescript
// Request:
"Build a Calendar component following the Calendar Grid pattern"

// Claude will:
1. Load layout-patterns resource
2. Follow Calendar Grid specifications:
   - Header with month/year + navigation
   - 7-column grid (days of week)
   - Cell height: 80px minimum
   - Cell padding: md (16px)
   - Border: 1px Gray 200
   - Current day: Primary background
   - Hover states defined
```

### Example 3: Setup Tailwind Theme
```typescript
// Request:
"Export design tokens as Tailwind configuration"

// Claude will:
1. Load quick-ref resource
2. Load implementation-guide
3. Generate theme.extend in tailwind.config.js:
   - Spacing scale mapped to tokens
   - Typography scale
   - Color palette
   - Border radius values
   - Box shadows
```

---

## Integration with Other Skills

### With React Component Analyzer
**Relationship:** Complementary

**Scenario:**
1. **Analyzer** extracts specs from mockup/design
2. **Design System** provides standard specs
3. Claude compares and aligns them
4. Recommends: "Use design system Button specs, but adjust primary color to match brand"

**Request:**
```
"Analyze this design mockup and align it with our design system"
```

### With Taskmaster
**Automatic Integration:**

When using this skill, Claude can:
- Create implementation tasks for each component
- Add design system setup tasks
- Break down layout patterns into subtasks

**Example:**
```bash
task-master add-task \
  --prompt="Implement Button component following design system specs" \
  --dependencies="setup-design-tokens"
```

### With Code Reviewer Agent
**Validation:**

Code reviewer checks:
- ✅ Spacing values match design system
- ✅ Typography scale used correctly
- ✅ Colors from defined palette
- ✅ Component variants implemented
- ❌ Flag arbitrary values (e.g., `padding: 13px`)

---

## Best Practices

### DO:
✅ **Reference specific sections** when generating components
```
"Create button following component-specs → Button → Primary variant"
```

✅ **Use design tokens consistently**
```css
padding: var(--spacing-md); /* Good */
padding: 16px;              /* Okay, matches token */
padding: 15px;              /* Bad, arbitrary */
```

✅ **Adjust for context**
```
"Follow design system Button specs, but use larger padding 
for this hero CTA (xl instead of md)"
```

✅ **Document deviations**
```typescript
// Using xl padding instead of md for prominence in hero
<Button size="hero" className="px-xl py-lg">
```

### DON'T:
❌ **Use arbitrary spacing values**
```css
margin: 13px;  /* Bad - not in spacing scale */
gap: 20px;     /* Bad - use lg (24px) or md (16px) */
```

❌ **Ignore responsive considerations**
```typescript
// Bad - fixed padding
<div className="p-xl">

// Good - responsive padding
<div className="p-md md:p-lg lg:p-xl">
```

❌ **Mix design systems**
```typescript
// Bad - mixing Material UI and custom design system
<MuiButton>  // Material design
<CustomCard> // Design system
```

---

## Progressive Loading Strategy

**Start Small, Load as Needed:**

1. **Overview** (This file)
   - Understand what's available
   - See token summary
   - Know when to load resources

2. **Quick Reference** (When building)
   - Fast lookups during development
   - No need to load full specs

3. **Component Specs** (When implementing components)
   - Load only when creating buttons, inputs, etc.
   - Detailed variant specifications

4. **Layout Patterns** (When building pages)
   - Load specific pattern you need
   - Complete implementation guide

5. **Implementation Guide** (When setting up)
   - Load when configuring CSS framework
   - Export design tokens

**Token Efficiency:**
- Overview only: ~300 tokens
- Overview + Quick Ref: ~500 tokens
- Overview + Component Specs: ~800 tokens
- Overview + Layout Pattern: ~800 tokens
- Everything: ~1,800 tokens (rarely needed)

---

## Output Formats

### CSS Variables
```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  /* ... */
  
  --color-primary: #0066CC;
  --color-success: #10B981;
  /* ... */
}
```

### Tailwind Config
```javascript
module.exports = {
  theme: {
    extend: {
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        // ...
      },
      colors: {
        primary: '#0066CC',
        // ...
      }
    }
  }
}
```

### Styled-components Theme
```typescript
export const theme = {
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    // ...
  },
  colors: {
    primary: '#0066CC',
    // ...
  }
};
```

---

## Customization

### Project-Specific Overrides

**When projects need variations:**

1. **Document the override**
```typescript
// multi-layer-cal overrides
const calendarTheme = {
  ...baseTheme,
  spacing: {
    ...baseTheme.spacing,
    cellPadding: '12px', // Override for calendar cells
  }
};
```

2. **Note in project README**
```markdown
## Design System Customizations

- Calendar cells use 12px padding (vs. 16px standard)
- Primary color adjusted for accessibility: #0052A3
```

3. **Keep core system intact**
- Override at application level
- Don't modify base design system
- Allows updates without breaking customizations

---

## Accessibility Checklist

When using this design system:

- [ ] All touch targets minimum 44x44px
- [ ] Text contrast ratio minimum 4.5:1 (WCAG AA)
- [ ] Focus indicators visible (2px blue ring)
- [ ] Semantic HTML used (`<button>`, `<nav>`, etc.)
- [ ] ARIA labels for icon-only buttons
- [ ] Error messages associated with inputs (aria-describedby)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader tested (VoiceOver, NVDA)

---

## Troubleshooting

### "Design system specs conflict with mockup"
**Solution:**
- Use design system as standard
- Note deviations from mockup
- Consult designer for alignment
- Document approved variations

### "Spacing looks wrong on mobile"
**Solution:**
- Check responsive padding adjustments
- Use smaller spacing values on mobile (md → sm)
- Test at actual mobile screen size

### "Colors don't match brand guidelines"
**Solution:**
- Override primary/secondary colors
- Keep semantic colors (success, error, warning)
- Ensure accessibility maintained
- Document color customizations

---

## Related Skills

- **react-component-analyzer** - Extract specs from designs, align with system
- **doc-generator** - Document components built with system
- **code-reviewer** - Validate design system adherence

---

## Quick Commands

```bash
# Load full system
"Show me the frontend design system"

# Quick reference
"Design system quick reference"

# Specific component
"Button component specifications"

# Specific layout
"Calendar grid layout pattern"

# Export tokens
"Export design tokens for Tailwind"

# Create component with system
"Create a Button component following the design system"
```

---

**Auto-Activation Priority:** High  
**Progressive Disclosure:** Enabled  
**Token Footprint:** 300 tokens (overview)

---

**Last Updated:** November 15, 2025  
**Skill Maturity:** v1.0 (Complete Specifications)

**Navigation:** [Quick Ref](resources/quick-ref.md) | [Components](resources/component-specs.md) | [Layouts](resources/layout-patterns.md) | [Implementation](resources/implementation-guide.md)

