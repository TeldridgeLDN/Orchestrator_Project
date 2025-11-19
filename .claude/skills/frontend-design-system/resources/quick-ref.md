# Frontend Design System - Quick Reference

**One-line:** Essential design tokens and component specs for consistent React UI development.

---

## Spacing System (Base-8)

| Token | Value | Usage |
|-------|-------|-------|
| `xs`  | 4px   | Tight element spacing, rarely used |
| `sm`  | 8px   | Subtle spacing, input padding, small gaps |
| `md`  | 16px  | **Default**, comfortable spacing |
| `lg`  | 24px  | Generous, section spacing |
| `xl`  | 32px  | Significant breathing room |
| `2xl` | 48px  | Major section breaks |
| `3xl` | 64px  | Page-level spacing |

**Rules:**
- Use consistently for padding, margins, gaps
- Avoid arbitrary values (e.g., 13px, 17px)
- When in doubt, use `md` (16px)

---

## Typography Scale

| Role | Size | Weight | Line Height | Use Case |
|------|------|--------|-------------|----------|
| **Display** | 48px | 700 | 1.2 | Hero headings, page titles |
| **Heading 1** | 36px | 600 | 1.3 | Main page titles |
| **Heading 2** | 28px | 600 | 1.3 | Section titles |
| **Heading 3** | 24px | 600 | 1.3 | Subsection titles |
| **Body Large** | 18px | 400 | 1.6 | Primary content, intros |
| **Body** | 16px | 400 | 1.5 | Standard text, paragraphs |
| **Body Small** | 14px | 400 | 1.5 | Secondary text |
| **Label** | 12px | 500 | 1.4 | Captions, metadata |
| **Caption** | 11px | 400 | 1.4 | Micro copy, timestamps |

**Font Stack:** Inter, system-ui, sans-serif  
**Weights Available:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

---

## Color Palette

### Primary Colors
```
Primary:       #0066CC  (actions, links, highlights)
Primary Dark:  #0052A3  (hover state)
Primary Light: #E6F2FF  (backgrounds, subtle)
```

### Semantic Colors
```
Success:  #10B981  (positive actions, confirmations)
Warning:  #F59E0B  (cautions, warnings)
Error:    #EF4444  (errors, destructive actions)
Info:     #3B82F6  (information, neutral alerts)
```

### Neutral Grays
```
Gray 50:   #F9FAFB  (lightest background)
Gray 100:  #F3F4F6  (light backgrounds)
Gray 200:  #E5E7EB  (borders, dividers)
Gray 300:  #D1D5DB  (secondary borders)
Gray 500:  #6B7280  (secondary text)
Gray 700:  #374151  (body text)
Gray 900:  #111827  (dark text, headings)
```

### Text Colors
```
Primary Text:    Gray 900 (#111827)
Secondary Text:  Gray 500 (#6B7280)
Placeholder:     Gray 300 (#D1D5DB)
Inverted (dark): White (#FFFFFF)
```

---

## Component Quick Specs

### Button
**Variants:** primary, secondary, ghost, destructive

| Size | Padding | Font Size |
|------|---------|-----------|
| sm   | 8px     | 14px |
| md   | 12px 24px | 16px |
| lg   | 16px 32px | 18px |

**States:** default, hover, active, disabled, loading  
**Border Radius:** 6px  
**Primary:** Blue background (#0066CC), white text

---

### Input/Form Field
**Height:** 40px (md)  
**Padding:** 8px 12px  
**Border:** 1px Gray 200  
**Border Radius:** 6px  
**Focus:** 2px solid Primary  
**Error:** 1px solid Error (#EF4444)

---

### Card
**Background:** White  
**Border:** 1px Gray 200  
**Border Radius:** 8px  
**Padding:** lg (24px)  
**Shadow:** 0 1px 3px rgba(0,0,0,0.1)  
**Hover Shadow:** 0 4px 12px rgba(0,0,0,0.15)

---

### Badge
**Padding:** 4px 12px  
**Font Size:** 12px  
**Border Radius:** 12px (pill-shaped)  
**Variants:** primary (blue), success (green), warning (orange), error (red)

---

## Visual Effects

### Shadows
```css
Card Shadow:   0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)
Button Shadow: 0 1px 2px rgba(0,0,0,0.05)
Modal Shadow:  0 10px 25px rgba(0,0,0,0.15)
```

### Borders
```css
Default: 1px solid #E5E7EB
Focus:   2px solid #0066CC
Error:   1px solid #EF4444
```

### Border Radius
```
Buttons:  6px
Cards:    8px
Inputs:   6px
Avatars:  50% (circular)
Badges:   4px
```

### Opacity
```
Disabled: 0.5
Overlay:  0.75
```

---

## Responsive Breakpoints

| Breakpoint | Range | Adjustments |
|------------|-------|-------------|
| **Mobile** | < 640px | Reduce padding to `md` (16px), stack columns |
| **Tablet** | 640px - 1024px | Use `lg` (24px) padding, 2-column grids |
| **Desktop** | > 1024px | Full `xl` (32px) padding, multi-column layouts |

**Typography Scaling:**
- Mobile: Reduce heading sizes by 1-2 levels
- Body text: Keep 16px minimum for readability

---

## Layout Pattern Quick Keys

### Two Column Blog
- Container: 1400px max
- Left: 65%, Right: 35%
- Column gap: xl (32px)
- Paragraph gap: lg (24px)

### Calendar Grid
- 7 columns (days)
- Cell height: 80px min
- Cell padding: md (16px)
- Border: 1px Gray 200

### Card Grid
- Desktop: 3 columns
- Tablet: 2 columns
- Mobile: 1 column
- Gap: lg (24px)

### Form Layout
- Max width: 600px
- Field gap: xl (32px)
- Label to input: sm (8px)

### Navigation Header
- Height: 64px
- Padding: md horizontal
- Nav link gap: lg (24px)

### Hero Section
- Height: 400-600px
- Vertical padding: 3xl (64px)
- Headline to subheading: md (16px)

---

## Common Patterns

### Button Spacing
```tsx
<button className="px-md py-sm">  // 16px × 8px
<button className="px-lg py-md">  // 24px × 16px (large)
```

### Card Layout
```tsx
<div className="p-lg gap-md">     // Padding 24px, gap 16px
```

### Section Spacing
```tsx
<section className="py-2xl px-xl"> // 48px vertical, 32px horizontal
```

### Form Groups
```tsx
<div className="space-y-xl">      // 32px between fields
  <label className="mb-sm">       // 8px below label
  <input />
</div>
```

---

## Accessibility Quick Checks

- [ ] Touch targets ≥ 44x44px
- [ ] Text contrast ≥ 4.5:1 (WCAG AA)
- [ ] Focus indicators visible (2px blue ring)
- [ ] Semantic HTML (`<button>`, `<nav>`)
- [ ] ARIA labels for icon-only buttons

---

## Usage Example

```typescript
// Request:
"Create a primary button using the design system"

// Generated:
<button className="
  bg-primary text-white 
  px-lg py-md 
  rounded-md 
  hover:bg-primary-dark 
  focus:ring-2 focus:ring-primary
">
  Click Me
</button>
```

---

## When to Load More

**Need detailed component specs?**
→ Load `component-specs` resource

**Building specific layout?**
→ Load `layout-patterns` resource

**Setting up CSS framework?**
→ Load `implementation-guide` resource

---

**Version:** 1.0.0  
**Last Updated:** November 15, 2025

