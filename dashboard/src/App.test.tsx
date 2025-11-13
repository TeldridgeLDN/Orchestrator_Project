/**
 * Simple verification test for icon imports
 * Tests that icons can be imported and used in components
 */

import { describe, it, expect } from 'vitest';
import {
  ClipboardCheck,
  Compass,
  UserCheck,
  ShieldCheck,
  Zap,
  ListChecks,
  AlertTriangle,
  Rocket,
  Eye,
  ArrowRight,
  Mail,
  LANDING_PAGE_ICONS,
  TAILWIND_ICON_SIZES,
} from './lib/icons';

describe('Icon System', () => {
  it('exports all required hero icons', () => {
    expect(ClipboardCheck).toBeDefined();
    expect(ArrowRight).toBeDefined();
  });

  it('exports discovery icon', () => {
    expect(Compass).toBeDefined();
  });

  it('exports trust indicator icons', () => {
    expect(UserCheck).toBeDefined();
    expect(ShieldCheck).toBeDefined();
    expect(Zap).toBeDefined();
  });

  it('exports feature icons', () => {
    expect(ListChecks).toBeDefined();
    expect(AlertTriangle).toBeDefined();
    expect(Rocket).toBeDefined();
  });

  it('exports credibility icon', () => {
    expect(Eye).toBeDefined();
  });

  it('exports CTA icons', () => {
    expect(ArrowRight).toBeDefined();
    expect(Mail).toBeDefined();
  });

  it('provides LANDING_PAGE_ICONS mapping object', () => {
    expect(LANDING_PAGE_ICONS).toBeDefined();
    expect(LANDING_PAGE_ICONS.hero.primary).toBe(ClipboardCheck);
    expect(LANDING_PAGE_ICONS.discovery.primary).toBe(Compass);
    expect(LANDING_PAGE_ICONS.trustBadges.socialProof).toBe(UserCheck);
  });

  it('provides TAILWIND_ICON_SIZES mapping', () => {
    expect(TAILWIND_ICON_SIZES).toBeDefined();
    expect(TAILWIND_ICON_SIZES.xs).toBe('h-3 w-3');
    expect(TAILWIND_ICON_SIZES.sm).toBe('h-4 w-4');
    expect(TAILWIND_ICON_SIZES.md).toBe('h-6 w-6');
    expect(TAILWIND_ICON_SIZES.lg).toBe('h-8 w-8');
    expect(TAILWIND_ICON_SIZES.xl).toBe('h-10 w-10');
    expect(TAILWIND_ICON_SIZES['2xl']).toBe('h-12 w-12');
  });
});

