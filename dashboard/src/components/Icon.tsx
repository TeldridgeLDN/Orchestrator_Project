/**
 * Icon Component
 * 
 * A reusable, accessible icon component that standardizes icon usage across
 * the landing page. Supports multiple sizes, colors, themes, and accessibility features.
 * 
 * @see .taskmaster/docs/landing-page-icon-mapping.json
 * @see src/lib/icons.tsx
 * 
 * Features:
 * - Multiple size variants (xs, sm, md, lg, xl, 2xl)
 * - Theme-aware colors (brand-primary, brand-accent, success, warning, error, neutral)
 * - Dark/light mode support
 * - Full accessibility support (aria-label, role)
 * - Smooth transitions
 * - TypeScript support
 * 
 * @example
 * ```tsx
 * import { Icon } from './components/Icon';
 * import { Compass } from './lib/icons';
 * 
 * <Icon 
 *   icon={Compass} 
 *   size="lg" 
 *   color="brand-primary"
 *   label="Discovery compass" 
 * />
 * ```
 */

import React from 'react';
import { type LucideIcon, type LucideProps } from 'lucide-react';
import { cn } from '../lib/utils';

// Size variants matching our approved icon scale
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Color variants from approved palette
export type IconColor = 
  | 'brand-primary'
  | 'brand-accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'
  | 'current'; // Inherits from parent

// Transition speed variants
export type IconTransition = 'none' | 'fast' | 'default' | 'slow';

export interface IconProps extends Omit<LucideProps, 'size' | 'color'> {
  /**
   * The Lucide icon component to render
   * @example icon={Compass}
   */
  icon: LucideIcon;
  
  /**
   * Size of the icon
   * @default 'md'
   */
  size?: IconSize;
  
  /**
   * Color variant from the approved palette
   * @default 'current'
   */
  color?: IconColor;
  
  /**
   * Accessibility label for screen readers
   * Required for semantic icons (when decorative=false)
   */
  label?: string;
  
  /**
   * Whether the icon is purely decorative (no semantic meaning)
   * If true, icon will be hidden from screen readers
   * @default false
   */
  decorative?: boolean;
  
  /**
   * Transition speed for hover/state changes
   * @default 'default'
   */
  transition?: IconTransition;
  
  /**
   * Additional CSS classes to apply
   */
  className?: string;
}

// Size mapping to Tailwind classes (from approved icon mapping)
const sizeMap: Record<IconSize, string> = {
  xs: 'h-3 w-3',      // 12px
  sm: 'h-4 w-4',      // 16px  
  md: 'h-6 w-6',      // 24px (default)
  lg: 'h-8 w-8',      // 32px
  xl: 'h-10 w-10',    // 40px
  '2xl': 'h-12 w-12', // 48px
};

// Color mapping to Tailwind classes (from approved palette)
const colorMap: Record<Exclude<IconColor, 'current'>, string> = {
  'brand-primary': 'text-brand-primary',
  'brand-accent': 'text-brand-accent',
  'success': 'text-success',
  'warning': 'text-warning',
  'error': 'text-error',
  'neutral': 'text-neutral',
};

// Transition mapping
const transitionMap: Record<IconTransition, string> = {
  none: '',
  fast: 'transition-all duration-100',
  default: 'transition-all duration-200',
  slow: 'transition-all duration-300',
};

/**
 * Icon Component
 * 
 * Renders a Lucide icon with standardized sizing, colors, and accessibility features.
 */
export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  (
    {
      icon: IconComponent,
      size = 'md',
      color = 'current',
      label,
      decorative = false,
      transition = 'default',
      className,
      ...props
    },
    ref
  ) => {
    // Accessibility validation in development
    if (process.env.NODE_ENV === 'development' && !decorative && !label) {
      console.warn(
        'Icon component: Non-decorative icons should have a "label" prop for accessibility. ' +
        'Either provide a label or set decorative={true} if the icon is purely visual.'
      );
    }

    // Build className string
    const iconClasses = cn(
      // Base size
      sizeMap[size],
      // Color (only if not 'current')
      color !== 'current' && colorMap[color],
      // Transition
      transitionMap[transition],
      // Custom classes
      className
    );

    // Accessibility attributes
    const ariaProps = decorative
      ? {
          'aria-hidden': 'true' as const,
          role: 'presentation' as const,
        }
      : {
          'aria-label': label,
          role: 'img' as const,
        };

    return (
      <IconComponent
        ref={ref}
        className={iconClasses}
        {...ariaProps}
        {...props}
      />
    );
  }
);

Icon.displayName = 'Icon';

export default Icon;
