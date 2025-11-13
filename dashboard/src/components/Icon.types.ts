/**
 * Icon Component API Types and Documentation
 * 
 * This file defines the complete API for the reusable Icon component,
 * including prop types, interfaces, and usage documentation.
 */

import type { LucideIcon, LucideProps } from 'lucide-react';

/**
 * Supported icon sizes
 * Maps to specific pixel dimensions via Tailwind classes
 */
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Predefined icon color variants
 * Maps to CSS custom properties for theme support
 */
export type IconColor = 'primary' | 'secondary' | 'accent' | 'muted' | 'current';

/**
 * Animation/transition speed presets
 */
export type IconTransition = 'default' | 'fast' | 'slow' | 'none';

/**
 * Icon Component Props
 * 
 * @property icon - The Lucide icon component to render (required)
 * @property size - Predefined size preset (default: 'md')
 * @property color - Predefined color preset (default: 'current')
 * @property transition - Animation speed preset (default: 'default')
 * @property label - Accessibility label for screen readers (required for decorative icons)
 * @property decorative - If true, adds aria-hidden and role="presentation" (default: false)
 * @property className - Additional Tailwind classes to merge
 * @property ...props - All other LucideProps are passed through
 * 
 * @example
 * // Basic usage
 * <Icon icon={CompassIcon} label="Navigation compass" />
 * 
 * @example
 * // With size and color
 * <Icon 
 *   icon={CheckIcon} 
 *   size="lg" 
 *   color="accent"
 *   label="Success indicator"
 * />
 * 
 * @example
 * // Decorative icon (no semantic meaning)
 * <Icon 
 *   icon={StarIcon} 
 *   decorative 
 *   className="opacity-50"
 * />
 * 
 * @example
 * // With custom classes and animations
 * <Icon 
 *   icon={LoadingIcon} 
 *   size="xl"
 *   transition="fast"
 *   className="animate-spin text-blue-500"
 *   label="Loading content"
 * />
 */
export interface IconProps extends Omit<LucideProps, 'ref'> {
  /** The Lucide icon component to render */
  icon: LucideIcon;
  
  /** Predefined size preset (default: 'md' - 24px) */
  size?: IconSize;
  
  /** Predefined color preset (default: 'current') */
  color?: IconColor;
  
  /** Animation/transition speed preset (default: 'default') */
  transition?: IconTransition;
  
  /** 
   * Accessibility label for screen readers
   * Required unless decorative is true
   */
  label?: string;
  
  /** 
   * If true, icon is treated as decorative (aria-hidden)
   * Use for icons that don't convey meaning
   * Default: false
   */
  decorative?: boolean;
  
  /** Additional Tailwind classes to merge with defaults */
  className?: string;
}

/**
 * Icon Component API Design Rationale
 * 
 * 1. **icon prop**: Required - ensures type safety and explicit icon usage
 * 2. **size prop**: Optional with good default - covers most use cases
 * 3. **color prop**: Optional - allows quick color changes without className
 * 4. **transition prop**: Optional - enables smooth animations by default
 * 5. **label prop**: Conditionally required - enforces accessibility
 * 6. **decorative prop**: Optional - handles non-semantic icons properly
 * 7. **className prop**: Optional - allows customization while maintaining defaults
 * 8. **LucideProps spread**: Enables full Lucide API access (strokeWidth, etc.)
 * 
 * Accessibility Best Practices:
 * - All semantic icons MUST have a label
 * - Decorative icons should set decorative=true
 * - Component automatically adds appropriate ARIA attributes
 * - Color contrast handled via CSS custom properties
 * - Theme switching supported out of the box
 * 
 * Size Mapping:
 * - xs: 12px (h-3 w-3) - Inline text icons
 * - sm: 16px (h-4 w-4) - Small UI elements
 * - md: 24px (h-6 w-6) - Default, most common
 * - lg: 32px (h-8 w-8) - Section headers
 * - xl: 48px (h-12 w-12) - Feature highlights
 * - 2xl: 64px (h-16 w-16) - Hero sections
 * 
 * Color Mapping:
 * - primary: Main text color (theme-aware)
 * - secondary: Muted text color
 * - accent: Brand/highlight color
 * - muted: Disabled/inactive state
 * - current: Inherits from parent (default)
 */

