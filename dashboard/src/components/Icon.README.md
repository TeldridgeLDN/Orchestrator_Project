# Icon Component Documentation

A reusable, accessible icon component system for React with built-in theme support, standardized sizing, and smooth transitions.

## Quick Start

```tsx
import { Icon } from '@/components/Icon';
import { CompassIcon, CheckIcon } from '@/lib/icons';

// Basic usage
<Icon icon={CompassIcon} label="Navigate" />

// With size and color presets
<Icon icon={CheckIcon} size="lg" color="accent" label="Completed" />
```

## Installation

The Icon component is already set up in the project with all dependencies:

- ✅ `lucide-react` - Icon library
- ✅ `clsx` & `tailwind-merge` - Class name utilities
- ✅ Tailwind CSS - Styling framework

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `LucideIcon` | **Required** | The Lucide icon component to render |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'md'` | Predefined size preset |
| `color` | `'primary' \| 'secondary' \| 'accent' \| 'muted' \| 'current'` | `'current'` | Predefined color preset |
| `transition` | `'default' \| 'fast' \| 'slow' \| 'none'` | `'default'` | Animation speed preset |
| `label` | `string` | `undefined` | Accessibility label (required for semantic icons) |
| `decorative` | `boolean` | `false` | If true, icon is treated as decorative (aria-hidden) |
| `className` | `string` | `undefined` | Additional Tailwind classes to merge |
| `...props` | `LucideProps` | - | All Lucide props are passed through (strokeWidth, etc.) |

### Size Reference

| Size | Pixels | Tailwind | Use Case |
|------|--------|----------|----------|
| `xs` | 12px | `h-3 w-3` | Inline text icons |
| `sm` | 16px | `h-4 w-4` | Small UI elements, badges |
| `md` | 24px | `h-6 w-6` | **Default**, most common |
| `lg` | 32px | `h-8 w-8` | Section headers |
| `xl` | 48px | `h-12 w-12` | Feature highlights |
| `2xl` | 64px | `h-16 w-16` | Hero sections |

### Color Reference

| Color | CSS Variable | Light Mode | Dark Mode | Use Case |
|-------|--------------|------------|-----------|----------|
| `primary` | `--icon-primary` | `#111827` | `#f9fafb` | Main text color |
| `secondary` | `--icon-secondary` | `#6b7280` | `#9ca3af` | Muted text |
| `accent` | `--icon-accent` | `#3b82f6` | `#60a5fa` | Brand color |
| `muted` | `--icon-muted` | `#9ca3af` | `#6b7280` | Disabled state |
| `current` | N/A | Inherits | Inherits | **Default**, inherit color |

## Usage Examples

### Basic Icon

```tsx
<Icon icon={CheckIcon} label="Success" />
```

### Different Sizes

```tsx
<Icon icon={CompassIcon} size="xs" label="Small compass" />
<Icon icon={CompassIcon} size="sm" label="Small compass" />
<Icon icon={CompassIcon} size="md" label="Medium compass" />
<Icon icon={CompassIcon} size="lg" label="Large compass" />
<Icon icon={CompassIcon} size="xl" label="Extra large compass" />
<Icon icon={CompassIcon} size="2xl" label="Huge compass" />
```

### Color Variants

```tsx
<Icon icon={AlertIcon} color="primary" label="Primary alert" />
<Icon icon={AlertIcon} color="secondary" label="Secondary alert" />
<Icon icon={AlertIcon} color="accent" label="Accent alert" />
<Icon icon={AlertIcon} color="muted" label="Muted alert" />
```

### Decorative Icons

Use `decorative` for icons that don't convey meaning:

```tsx
<div>
  <Icon icon={StarIcon} decorative className="opacity-50" />
  <span>Featured Item</span>
</div>
```

### With Custom Styles

```tsx
<Icon 
  icon={LoadingIcon}
  size="lg"
  color="accent"
  className="animate-spin"
  label="Loading content"
/>
```

### With Hover Effects

```tsx
<Icon 
  icon={ArrowRightIcon}
  className="hover:translate-x-1 hover:text-accent cursor-pointer"
  label="Continue"
/>
```

### With Lucide Props

```tsx
<Icon 
  icon={AlertTriangleIcon}
  size="xl"
  strokeWidth={1.5}
  fill="currentColor"
  label="Warning"
/>
```

## Accessibility

The Icon component follows WCAG 2.1 AA guidelines:

### Semantic Icons (Convey Meaning)

**Always provide a label:**

```tsx
✅ <Icon icon={CheckIcon} label="Completed" />
❌ <Icon icon={CheckIcon} />  // Console warning!
```

### Decorative Icons (No Meaning)

**Mark as decorative:**

```tsx
✅ <Icon icon={StarIcon} decorative />
```

### Interactive Icons

**Wrap in button with accessible label:**

```tsx
<button aria-label="Close dialog">
  <Icon icon={XIcon} decorative />
</button>
```

## Theme Support

The component automatically supports light/dark modes:

```tsx
// Toggle theme on html element
document.documentElement.classList.toggle('dark');

// Icon colors automatically adjust
<Icon icon={CompassIcon} color="primary" label="Navigate" />
```

## Performance

- **Tree-shaking**: Only imports used icons
- **No runtime overhead**: Pure Tailwind CSS
- **SSR compatible**: Works with Next.js and similar frameworks
- **Type-safe**: Full TypeScript support

## Common Patterns

### Button Icons

```tsx
<button className="flex items-center gap-2">
  <Icon icon={DownloadIcon} size="sm" decorative />
  Download
</button>
```

### Section Headers

```tsx
<h2 className="flex items-center gap-3">
  <Icon icon={CompassIcon} size="lg" color="accent" decorative />
  Discovery Process
</h2>
```

### Loading States

```tsx
{isLoading && (
  <Icon 
    icon={LoadingIcon}
    className="animate-spin"
    label="Loading"
  />
)}
```

### Icon Lists

```tsx
<ul className="space-y-2">
  {features.map((feature) => (
    <li key={feature.id} className="flex items-center gap-2">
      <Icon icon={CheckIcon} size="sm" color="accent" decorative />
      {feature.name}
    </li>
  ))}
</ul>
```

## Troubleshooting

### Icon Not Rendering

1. **Check import path**: Ensure icon is exported from `@/lib/icons`
2. **Verify Lucide installation**: `npm list lucide-react`
3. **Check TypeScript errors**: Icon must be a LucideIcon type

### Accessibility Warning

If you see "Non-decorative icons should have a label" in console:

```tsx
// Add label prop
<Icon icon={CheckIcon} label="Success indicator" />

// OR mark as decorative if it doesn't convey meaning
<Icon icon={CheckIcon} decorative />
```

### Colors Not Working

1. **Check CSS variables**: Ensure `index.css` has icon color variables
2. **Verify Tailwind config**: darkMode should be set to 'class'
3. **Check parent theme**: Ensure `.dark` class is on html/body element

### Custom Classes Being Overridden

Use more specific Tailwind classes or `!important`:

```tsx
<Icon 
  icon={StarIcon}
  className="!text-red-500 !h-10 !w-10"
  label="Important"
/>
```

## Advanced Usage

### ForwardRef Support

```tsx
const iconRef = useRef<SVGSVGElement>(null);

<Icon 
  ref={iconRef}
  icon={CompassIcon}
  label="Navigate"
/>
```

### Dynamic Icons

```tsx
const iconMap = {
  success: CheckIcon,
  warning: AlertTriangleIcon,
  error: XIcon,
};

<Icon 
  icon={iconMap[status]}
  color={status === 'success' ? 'accent' : 'primary'}
  label={`Status: ${status}`}
/>
```

### Animated Icons

```tsx
<Icon 
  icon={HeartIcon}
  className="hover:scale-125 hover:text-red-500 cursor-pointer transition-all"
  onClick={handleLike}
  label="Like"
/>
```

## Related Files

- **Component**: [`Icon.tsx`](./Icon.tsx) - Main component implementation
- **Types**: [`Icon.types.ts`](./Icon.types.ts) - TypeScript definitions
- **Icons Library**: [`lib/icons.tsx`](../lib/icons.tsx) - Icon exports and utilities
- **Utils**: [`lib/utils.ts`](../lib/utils.ts) - Class name merging utility
- **Test Component**: [`IconTest.tsx`](./IconTest.tsx) - Visual testing component

## Support

For issues or questions:
1. Check this documentation
2. Review the IconTest component for examples
3. Check console for accessibility warnings
4. Verify Tailwind config and CSS variables

---

**Version**: 1.0  
**Last Updated**: 2025-11-13  
**Maintainer**: Development Team

