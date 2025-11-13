# Icon Component Documentation

## Overview

The `Icon` component is a reusable, accessible wrapper for Lucide React icons that standardizes icon usage across the landing page with consistent sizing, colors, and accessibility features.

## Installation

The Icon component is already set up in your project. Icons are imported from `src/lib/icons.tsx`.

```tsx
import { Icon } from './components/Icon';
import { Compass, ClipboardCheck, UserCheck } from './lib/icons';
```

## Basic Usage

### Simple Icon

```tsx
<Icon icon={Compass} />
```

### With Accessibility Label

```tsx
<Icon 
  icon={Compass} 
  label="Discovery compass icon" 
/>
```

### Custom Size and Color

```tsx
<Icon 
  icon={ClipboardCheck}
  size="xl"
  color="brand-primary"
  label="Checklist"
/>
```

## Props API

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `icon` | `LucideIcon` | The Lucide icon component to render |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'md'` | Icon size variant |
| `color` | `'brand-primary' \| 'brand-accent' \| 'success' \| 'warning' \| 'error' \| 'neutral' \| 'current'` | `'current'` | Color from approved palette |
| `label` | `string` | `undefined` | Accessibility label for screen readers (required for semantic icons) |
| `decorative` | `boolean` | `false` | Set to true if icon is purely decorative |
| `transition` | `'none' \| 'fast' \| 'default' \| 'slow'` | `'default'` | Transition speed for animations |
| `className` | `string` | `undefined` | Additional Tailwind classes |

All [Lucide icon props](https://lucide.dev/guide/packages/lucide-react) are also supported (strokeWidth, etc.)

## Size Reference

| Size | Dimensions | Use Case |
|------|------------|----------|
| `xs` | 12px (h-3 w-3) | Inline text icons |
| `sm` | 16px (h-4 w-4) | Buttons, small badges |
| `md` | 24px (h-6 w-6) | Default, section icons |
| `lg` | 32px (h-8 w-8) | Feature icons |
| `xl` | 40px (h-10 w-10) | Hero sections |
| `2xl` | 48px (h-12 w-12) | Large hero emphasis |

## Color Reference

All colors are from the approved brand palette:

| Color | Hex Code | Use Case |
|-------|----------|----------|
| `brand-primary` | #667eea | Main brand color, primary icons |
| `brand-accent` | #764ba2 | Secondary brand color, highlights |
| `success` | #10b981 | Trust badges, success states |
| `warning` | #f59e0b | Alerts, cautions |
| `error` | #ef4444 | Error states |
| `neutral` | #6b7280 | Secondary icons |
| `current` | (inherits) | Inherits text color from parent |

## Usage Examples

### Landing Page Sections

#### Hero Section

```tsx
<Icon 
  icon={ClipboardCheck}
  size="2xl"
  color="brand-primary"
  label="Pre-launch checklist"
/>
```

#### Discovery Section

```tsx
<Icon 
  icon={Compass}
  size="lg"
  color="brand-primary"
  label="Discovery process"
/>
```

#### Trust Badges

```tsx
<div className="flex gap-4">
  <Icon 
    icon={UserCheck}
    size="md"
    color="success"
    label="Used by 100+ founders"
  />
  <Icon 
    icon={ShieldCheck}
    size="md"
    color="success"
    label="No credit card required"
  />
  <Icon 
    icon={Zap}
    size="md"
    color="success"
    label="Instant download"
  />
</div>
```

#### Benefits/Features

```tsx
<div className="space-y-6">
  <Icon 
    icon={ListChecks}
    size="lg"
    color="brand-primary"
    label="5 must-have elements"
  />
  <Icon 
    icon={AlertTriangle}
    size="lg"
    color="warning"
    label="10 common mistakes to avoid"
  />
  <Icon 
    icon={Rocket}
    size="lg"
    color="brand-accent"
    label="Actionable implementation steps"
  />
</div>
```

#### Credibility Section

```tsx
<Icon 
  icon={Eye}
  size="xl"
  color="brand-accent"
  label="500+ landing pages reviewed"
/>
```

#### CTA Buttons

```tsx
<button className="flex items-center gap-2">
  Download Checklist
  <Icon 
    icon={ArrowRight}
    size="sm"
    decorative
  />
</button>
```

### Advanced Usage

#### With Hover Effects

```tsx
<Icon 
  icon={Compass}
  size="lg"
  color="brand-primary"
  label="Discovery"
  className="hover:scale-110 cursor-pointer"
  transition="fast"
/>
```

#### With Custom Stroke Width

```tsx
<Icon 
  icon={Eye}
  size="xl"
  color="brand-accent"
  label="Reviews"
  strokeWidth={1.5}
/>
```

#### Decorative Icons (Hidden from Screen Readers)

```tsx
<div className="flex items-center gap-2">
  <Icon 
    icon={Mail}
    size="sm"
    color="brand-primary"
    decorative
  />
  <span>contact@example.com</span>
</div>
```

#### Loading Spinner

```tsx
<Icon 
  icon={Loader2}
  size="md"
  color="brand-primary"
  label="Loading"
  className="animate-spin"
  transition="none"
/>
```

## Accessibility

### Semantic Icons

For icons that convey meaning, always provide a `label`:

```tsx
✅ Good
<Icon icon={Compass} label="Discovery process" />

❌ Bad (will show warning in development)
<Icon icon={Compass} />
```

### Decorative Icons

For purely visual icons next to text, use `decorative`:

```tsx
✅ Good
<div>
  <Icon icon={ArrowRight} decorative />
  <span>Learn More</span>
</div>

❌ Bad (redundant for screen readers)
<div>
  <Icon icon={ArrowRight} label="Arrow right" />
  <span>Learn More</span>
</div>
```

### Color Contrast

All approved colors meet WCAG AA standards:
- Brand colors: 4.5:1+ contrast ratio
- Success/Warning/Error: 4.5:1+ contrast ratio
- Neutral: 4.5:1+ contrast ratio

## Dark Mode Support

The Icon component automatically supports dark/light mode through Tailwind's dark mode system:

```tsx
<Icon 
  icon={Compass}
  size="lg"
  color="brand-primary"
  label="Discovery"
  className="dark:text-brand-accent"
/>
```

The approved colors are designed to work in both light and dark themes.

## TypeScript Support

The Icon component is fully typed:

```typescript
import { type IconProps, type IconSize, type IconColor } from './components/Icon';

// All props are type-safe
const mySize: IconSize = 'lg';
const myColor: IconColor = 'brand-primary';
```

## Performance

- Icons are SVGs, very lightweight
- No runtime CSS-in-JS overhead
- Tree-shaking supported (only imports used icons)
- Memoization built into React.forwardRef

## Testing

Test icons with accessibility tools:

```bash
# Run your test suite
npm test

# Check accessibility with axe
# (Icons should have proper aria-label or aria-hidden)
```

## Common Patterns

### Icon with Text

```tsx
<div className="flex items-center gap-2">
  <Icon icon={UserCheck} size="sm" color="success" decorative />
  <span>100+ founders</span>
</div>
```

### Icon Button

```tsx
<button className="p-2 rounded-lg hover:bg-gray-100">
  <Icon 
    icon={X}
    size="md"
    label="Close"
    transition="fast"
  />
</button>
```

### Icon Grid

```tsx
<div className="grid grid-cols-3 gap-4">
  <Icon icon={ListChecks} size="lg" color="brand-primary" label="Features" />
  <Icon icon={AlertTriangle} size="lg" color="warning" label="Warnings" />
  <Icon icon={Rocket} size="lg" color="brand-accent" label="Launch" />
</div>
```

## Troubleshooting

### Icon not showing

1. Check that the icon is imported from `src/lib/icons.tsx`
2. Verify Tailwind CSS is configured (should be if you're seeing this)
3. Check console for accessibility warnings

### Wrong size

Make sure you're using the correct size prop value:
- Use `size="lg"`, not `size="large"`
- Use `size="2xl"`, not `size="xxl"`

### Color not applying

1. Verify the color is from the approved palette
2. Check that custom `className` isn't overriding color
3. Use `color="current"` to inherit from parent text color

## Related Documentation

- [Icon Mapping (.taskmaster/docs/landing-page-icon-mapping.json)](../../.taskmaster/docs/landing-page-icon-mapping.json)
- [Icon Exports (src/lib/icons.tsx)](../lib/icons.tsx)
- [Stakeholder Approvals (.taskmaster/docs/STAKEHOLDER_APPROVALS.md)](../../.taskmaster/docs/STAKEHOLDER_APPROVALS.md)
- [Lucide React Documentation](https://lucide.dev/guide/packages/lucide-react)

## Support

For questions or issues with the Icon component, refer to:
1. This documentation
2. The icon mapping JSON file
3. The stakeholder approval document
4. The Lucide React documentation

