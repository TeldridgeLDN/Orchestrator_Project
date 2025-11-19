# Frontend Design System Global Skill - Enhancement Proposal

**Date:** 2025-11-15  
**Status:** Ready for implementation  
**Target:** `~/.claude/skills/frontend_design_system/`

---

## Summary

This document proposes enhancements to the **global frontend_design_system skill** with comprehensive component specifications, layout patterns, and implementation guidance extracted from the new skill development work.

---

## Current Global Skill Structure

```
~/.claude/skills/frontend_design_system/
├── SKILL.md (8.2 KB)
├── metadata.json (2.6 KB)
└── resources/
    ├── design-principles.md (7.9 KB) - Typography, color, spacing
    ├── shadcn-ui-patterns.md (9.3 KB) - Shadcn/UI focused
    └── icon-guidelines.md (8.4 KB) - Icon implementation
```

**Total:** ~36 KB, 300-1400 tokens depending on resources loaded

---

## Proposed Enhancements

### New Resource File: `component-specifications.md`

**Purpose:** Comprehensive specifications for core UI components  
**Size:** ~9-10 KB (estimated)  
**Location:** `~/.claude/skills/frontend_design_system/resources/component-specifications.md`

**Content:**

#### Components Covered:
1. **Button** - All variants (primary, secondary, ghost, destructive), sizes, states
2. **Input/Form Field** - States, sizes, validation, labels, helper text
3. **Card** - Variants, layouts (vertical, horizontal), hover states
4. **Badge** - All semantic variants, sizes, with icons/dots/close

#### Specifications Include:
- Exact padding, margins, font sizes
- Color specifications from palette
- Border radius values
- Shadow specifications
- State transitions (hover, focus, active, disabled, loading)
- Accessibility requirements

---

### New Resource File: `layout-patterns.md`

**Purpose:** Proven layout pattern templates with complete specifications  
**Size:** ~12-15 KB (estimated)  
**Location:** `~/.claude/skills/frontend_design_system/resources/layout-patterns.md`

**Content:**

#### Patterns Included:

1. **Two Column Blog Layout**
   - 65/35 split, responsive stacking
   - Sidebar with related content
   - Key spacing specifications

2. **Calendar Grid**
   - 7-column grid for days
   - Cell specifications with states
   - Navigation header pattern

3. **Card Grid**
   - Responsive column counts (3/2/1)
   - Card hover effects
   - Image + content layouts

4. **Form Layout**
   - Max-width container
   - Field grouping and spacing
   - Label, input, helper text arrangement

5. **Navigation Header**
   - 64px height standard
   - Logo, nav links, actions layout
   - Mobile hamburger pattern

6. **Hero Section**
   - Centered content layout
   - Headline, subheading, CTA spacing
   - Flexible height (400-600px)

7. **Product Grid** (E-Commerce)
   - 4-column responsive grid
   - Product card with image, title, price, rating
   - Hover overlays and quick actions

8. **Product Detail Page**
   - Image gallery + details 2-column
   - Options, quantity, add-to-cart layout
   - Tabs/accordion for additional info

9. **Sidebar/Filters**
   - Fixed sidebar with sticky behavior
   - Filter groups with checkboxes
   - Mobile drawer conversion

10. **Blog Post List**
    - Featured image + excerpt cards
    - Meta information layout
    - Pagination spacing

11. **Footer**
    - Multi-column layout
    - Social icons and copyright
    - Responsive stacking

12. **Modal/Dialog**
    - Overlay and box specifications
    - Header, body, footer sections
    - Animation recommendations

13. **Tabs**
    - Tab list with active states
    - Panel content spacing
    - Border and color specifications

14. **Accordion**
    - Expandable sections
    - Chevron rotation
    - Content padding

15. **Search Bar**
    - Input with icon
    - Results dropdown
    - States: loading, no results, recent searches

16. **Portfolio/Case Study Grid**
    - 2-3 column showcase
    - Overlay effects
    - Category tags

17. **Team/About Section**
    - Person cards with avatars
    - Bio and social links
    - Centered layout

18. **Pricing Table**
    - 3-column pricing cards
    - Feature lists with checkmarks
    - Highlight popular plan

19. **Testimonials**
    - Quote cards with ratings
    - Author info and avatar
    - Carousel alternative

20. **CTA/Newsletter Section**
    - Full-width colored background
    - Email signup form
    - Center-aligned layout

#### Each Pattern Includes:
- Complete structure breakdown
- Key spacing specifications (with token values)
- Responsive considerations
- Typical component composition
- Mobile/tablet/desktop behaviors

---

### New Resource File: `implementation-guide.md`

**Purpose:** How to implement the design system in different CSS frameworks  
**Size:** ~6-8 KB (estimated)  
**Location:** `~/.claude/skills/frontend_design_system/resources/implementation-guide.md`

**Content:**

#### Implementation Approaches:

1. **Tailwind CSS Configuration**
   ```javascript
   // theme.extend in tailwind.config.js
   - Spacing scale mapping
   - Typography scale
   - Color palette
   - Border radius values
   - Box shadows
   ```

2. **CSS Variables (Custom Properties)**
   ```css
   // :root CSS variables
   - Spacing tokens
   - Color tokens
   - Typography tokens
   - Effect tokens
   ```

3. **Styled-components Theme**
   ```typescript
   // Theme object structure
   - Spacing object
   - Colors object
   - Typography object
   - TypeScript type definitions
   ```

4. **SCSS Variables**
   ```scss
   // SCSS variable definitions
   - Spacing map
   - Color map
   - Typography mixins
   ```

5. **CSS Modules**
   ```css
   // Using composes and class composition
   - Token files
   - Component styles
   - Utility classes
   ```

#### Best Practices for Each:
- How to reference tokens
- Component style organization
- Theming approaches
- Dark mode implementation
- Performance considerations

---

## Updated SKILL.md Structure

Enhance the main SKILL.md to reference new resources:

```markdown
## Available Resources

### Quick Access
- **design-principles.md** - Typography, colors, spacing, accessibility
- **shadcn-ui-patterns.md** - Shadcn/UI component patterns
- **icon-guidelines.md** - Icon system and implementation
- **component-specifications.md** [NEW] - Button, Input, Card, Badge specs
- **layout-patterns.md** [NEW] - 20 proven layout patterns
- **implementation-guide.md** [NEW] - CSS framework integration

### Progressive Loading
1. Load SKILL.md overview (~300 tokens)
2. Load specific resource as needed (~500-800 tokens each)
3. Total system: ~300-1400 tokens (same as before)
```

---

## Implementation Steps

### Step 1: Create New Resource Files

```bash
cd ~/.claude/skills/frontend_design_system/resources/

# Create component specifications
touch component-specifications.md

# Create layout patterns
touch layout-patterns.md

# Create implementation guide
touch implementation-guide.md
```

### Step 2: Add Content to New Files

Copy the enhanced content provided below into each file.

### Step 3: Update metadata.json

Add new resources to the metadata:

```json
{
  "resources": {
    "design-principles": {
      "file": "resources/design-principles.md",
      "description": "Typography, color, spacing, layout, accessibility"
    },
    "shadcn-ui-patterns": {
      "file": "resources/shadcn-ui-patterns.md",
      "description": "Shadcn/UI component patterns and best practices"
    },
    "icon-guidelines": {
      "file": "resources/icon-guidelines.md",
      "description": "Icon selection, sizing, and implementation"
    },
    "component-specifications": {
      "file": "resources/component-specifications.md",
      "description": "Detailed specs for Button, Input, Card, Badge components"
    },
    "layout-patterns": {
      "file": "resources/layout-patterns.md",
      "description": "20 proven layout patterns with complete specifications"
    },
    "implementation-guide": {
      "file": "resources/implementation-guide.md",
      "description": "CSS framework integration (Tailwind, CSS vars, styled-components)"
    }
  }
}
```

### Step 4: Update SKILL.md

Add references to new resources in the "Available Resources" section.

### Step 5: Update .claude/skill-rules.json (Project-Level)

Add trigger phrases for the enhanced capabilities:

```json
{
  "id": "frontend_design_system",
  "trigger_phrases": [
    "design system",
    "spacing system",
    "typography scale",
    "color palette",
    "component specs",
    "button component",
    "input field",
    "card component",
    "badge component",
    "layout pattern",
    "two column layout",
    "calendar grid",
    "card grid",
    "form layout",
    "hero section",
    "product grid",
    "pricing table",
    "footer layout",
    "modal dialog",
    "tabs pattern",
    "accordion pattern"
  ],
  "file_patterns": [
    "src/components/**",
    "components/**",
    "src/ui/**",
    "src/layouts/**",
    "*.tsx",
    "*.jsx"
  ],
  "skill": "frontend_design_system",
  "auto_activate": true,
  "priority": "high",
  "description": "Comprehensive design system with component specs and layout patterns"
}
```

---

## Content for New Files

### File 1: component-specifications.md

```markdown
# Component Specifications

Detailed specifications for core UI components. Use these exact values for consistency.

[FULL CONTENT FROM YOUR ENHANCED SKILL - Component Specifications section]
```

### File 2: layout-patterns.md

```markdown
# Layout Patterns

Proven layout pattern templates with complete specifications and spacing keys.

[FULL CONTENT FROM YOUR ENHANCED SKILL - Layout Patterns section]
```

### File 3: implementation-guide.md

```markdown
# Implementation Guide

How to implement the design system in different CSS frameworks.

## Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      colors: {
        primary: {
          DEFAULT: '#0066CC',
          dark: '#0052A3',
          light: '#E6F2FF',
        },
        // ... rest of color palette
      },
      fontSize: {
        'display': ['48px', { lineHeight: '1.2', fontWeight: '700' }],
        'h1': ['36px', { lineHeight: '1.3', fontWeight: '600' }],
        // ... rest of typography scale
      },
      borderRadius: {
        'button': '6px',
        'card': '8px',
        'badge': '12px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'modal': '0 20px 25px rgba(0, 0, 0, 0.15)',
      },
    },
  },
}
```

## CSS Variables

```css
:root {
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;

  /* Colors */
  --color-primary: #0066CC;
  --color-primary-dark: #0052A3;
  --color-primary-light: #E6F2FF;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;

  /* Grays */
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-300: #D1D5DB;
  --color-gray-500: #6B7280;
  --color-gray-700: #374151;
  --color-gray-900: #111827;

  /* Typography */
  --font-family: Inter, system-ui, sans-serif;
  --font-size-display: 48px;
  --font-size-h1: 36px;
  --font-size-h2: 28px;
  --font-size-h3: 24px;
  --font-size-body-lg: 18px;
  --font-size-body: 16px;
  --font-size-body-sm: 14px;
  --font-size-label: 12px;
  --font-size-caption: 11px;

  /* Effects */
  --border-radius-button: 6px;
  --border-radius-card: 8px;
  --border-radius-badge: 12px;
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

## Styled-components Theme

```typescript
// theme.ts
export const theme = {
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  colors: {
    primary: {
      main: '#0066CC',
      dark: '#0052A3',
      light: '#E6F2FF',
    },
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      500: '#6B7280',
      700: '#374151',
      900: '#111827',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      display: '48px',
      h1: '36px',
      h2: '28px',
      h3: '24px',
      bodyLg: '18px',
      body: '16px',
      bodySm: '14px',
      label: '12px',
      caption: '11px',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  effects: {
    borderRadius: {
      button: '6px',
      card: '8px',
      badge: '12px',
    },
    shadow: {
      card: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      cardHover: '0 4px 12px rgba(0, 0, 0, 0.15)',
      modal: '0 20px 25px rgba(0, 0, 0, 0.15)',
    },
  },
};

export type Theme = typeof theme;
```

## SCSS Variables

```scss
// _variables.scss
$spacing: (
  xs: 4px,
  sm: 8px,
  md: 16px,
  lg: 24px,
  xl: 32px,
  2xl: 48px,
  3xl: 64px,
);

$colors: (
  primary: #0066CC,
  primary-dark: #0052A3,
  primary-light: #E6F2FF,
  success: #10B981,
  warning: #F59E0B,
  error: #EF4444,
  info: #3B82F6,
);

$gray: (
  50: #F9FAFB,
  100: #F3F4F6,
  200: #E5E7EB,
  300: #D1D5DB,
  500: #6B7280,
  700: #374151,
  900: #111827,
);

// Usage:
// padding: map-get($spacing, md);
// color: map-get($colors, primary);
```

## Best Practices

### Token Reference Consistency
✅ **DO:** Use tokens everywhere
```css
padding: var(--spacing-md);
color: var(--color-primary);
```

❌ **DON'T:** Use arbitrary values
```css
padding: 15px;
color: #0066DD;
```

### Dark Mode Support
```css
:root {
  --bg-primary: #FFFFFF;
  --text-primary: #111827;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #111827;
    --text-primary: #FFFFFF;
  }
}
```

### Responsive Utilities
```javascript
// Tailwind
<div className="p-md md:p-lg lg:p-xl">

// CSS variables with media queries
@media (min-width: 640px) {
  .container {
    padding: var(--spacing-lg);
  }
}
```
```

---

## Benefits of Enhancements

1. **Comprehensive Component Specs**
   - Eliminates guesswork for common components
   - Ensures consistency across all projects
   - Speeds up component development

2. **20 Layout Patterns**
   - Covers most common UI patterns
   - Includes e-commerce, blog, portfolio patterns
   - Complete spacing specifications

3. **Multi-Framework Support**
   - Tailwind, CSS vars, styled-components, SCSS
   - Easy to adapt to any project setup
   - Copy-paste ready configurations

4. **Maintains Progressive Disclosure**
   - SKILL.md remains lightweight (~300 tokens)
   - Resources loaded on demand
   - Total footprint still manageable

5. **Global Availability**
   - One source of truth for all projects
   - Updates propagate automatically
   - Consistent across multi-layer-cal, portfolio-redesign, etc.

---

## Next Steps

1. **Review this proposal** - Confirm the enhancements align with your needs
2. **Create new resource files** - Add the three new files to global skill
3. **Copy content** - Transfer the enhanced specs into resource files
4. **Update metadata** - Add new resources to metadata.json
5. **Test activation** - Verify auto-activation works with new trigger phrases
6. **Update project configs** - Add skill-rules.json entries in projects that need it

---

## Estimated Effort

- Creating new resource files: **15-20 minutes**
- Updating metadata and SKILL.md: **5 minutes**
- Testing activation: **5 minutes**

**Total:** ~30 minutes

---

**Status:** ✅ Ready for implementation  
**Conflict Resolution:** ✅ Duplicate skill deleted  
**Global Skill Preserved:** ✅ `~/.claude/skills/frontend_design_system/`

