/**
 * Central Icon Exports
 * Landing Page Icon System
 * 
 * This file exports all icons used in the prospecting landing page
 * with their approved mappings from the stakeholder review.
 * 
 * @see .taskmaster/docs/landing-page-icon-mapping.json
 * @see .taskmaster/docs/STAKEHOLDER_APPROVALS.md
 * 
 * Date: 2025-11-13
 * Approved by: Product Owner
 */

// Import approved icons from lucide-react
import {
  // Hero Section
  ClipboardCheck,
  
  // Discovery Section
  Compass,
  
  // Trust Indicators
  UserCheck,
  ShieldCheck,
  Zap,
  
  // Benefits/Features
  ListChecks,
  AlertTriangle,
  Rocket,
  
  // Social Proof (deferred until testimonials exist)
  Quote,
  Star,
  TrendingUp,
  
  // Credibility
  Eye,
  
  // CTA Section
  ArrowRight,
  Mail,
  
  // Utility Icons
  ChevronDown,
  X,
  Menu,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  
  // Additional useful icons
  FileText,
  Download,
  Send,
  ChevronRight,
  
  // Type for all Lucide icons
  type LucideIcon,
} from 'lucide-react';

// Export all icons as named exports
export {
  // Hero Section
  ClipboardCheck,
  
  // Discovery Section
  Compass,
  
  // Trust Indicators
  UserCheck,
  ShieldCheck,
  Zap,
  
  // Benefits/Features
  ListChecks,
  AlertTriangle,
  Rocket,
  
  // Social Proof
  Quote,
  Star,
  TrendingUp,
  
  // Credibility
  Eye,
  
  // CTA Section
  ArrowRight,
  Mail,
  
  // Utility Icons
  ChevronDown,
  X,
  Menu,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  
  // Additional Icons
  FileText,
  Download,
  Send,
  ChevronRight,
  
  // Type export
  type LucideIcon,
};

// Icon mapping object for programmatic access
export const LANDING_PAGE_ICONS = {
  hero: {
    primary: ClipboardCheck,
    cta: ArrowRight,
  },
  discovery: {
    primary: Compass,
  },
  trustBadges: {
    socialProof: UserCheck,
    security: ShieldCheck,
    speed: Zap,
  },
  features: {
    checklist: ListChecks,
    mistakes: AlertTriangle,
    implementation: Rocket,
  },
  socialProof: {
    testimonial: Quote,
    rating: Star,
    metrics: TrendingUp,
  },
  credibility: {
    primary: Eye,
  },
  cta: {
    button: ArrowRight,
    email: Mail,
  },
  utility: {
    scrollIndicator: ChevronDown,
    close: X,
    menu: Menu,
    externalLink: ExternalLink,
    loading: Loader2,
    success: CheckCircle2,
    error: AlertCircle,
  },
} as const;

// Default icon props for consistent usage
export const DEFAULT_ICON_PROPS = {
  size: 24,
  strokeWidth: 2,
  'aria-hidden': false, // Explicitly set to false to ensure accessibility
} as const;

// Icon size mapping (matches Tailwind config)
export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  '2xl': 64,
} as const;

// Helper function to get icon size in pixels
export function getIconSize(size: keyof typeof ICON_SIZES): number {
  return ICON_SIZES[size];
}

/**
 * Helper function to get the appropriate icon class names
 * @param size - Icon size key (xs, sm, md, lg, xl, 2xl)
 * @param color - Tailwind color class (e.g., 'text-brand-primary')
 * @param className - Additional custom classes
 * @returns Complete className string
 */
export function getIconClassName(
  size: keyof typeof ICON_SIZES = 'md',
  color?: string,
  className?: string
): string {
  const sizeClass = `h-${size === 'xs' ? 3 : size === 'sm' ? 4 : size === 'md' ? 6 : size === 'lg' ? 8 : size === 'xl' ? 10 : 12} w-${size === 'xs' ? 3 : size === 'sm' ? 4 : size === 'md' ? 6 : size === 'lg' ? 8 : size === 'xl' ? 10 : 12}`;
  return [sizeClass, color, className].filter(Boolean).join(' ');
}

// Tailwind size classes mapping for easier use
export const TAILWIND_ICON_SIZES = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-10 w-10',
  '2xl': 'h-12 w-12',
} as const;
