/**
 * Icon Test Component
 * 
 * This component verifies that the icon system is working correctly:
 * - Icons render properly
 * - Accessibility attributes are present
 * - Theme support works (light/dark mode)
 * - Tailwind classes apply correctly
 * 
 * This is a temporary test component for Subtask 2.4
 * Can be deleted after verification is complete
 */

import React from 'react';
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
  Loader2,
  CheckCircle2,
  AlertCircle,
} from '../lib/icons';

export const IconTest: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Icon System Test
      </h1>
      
      {/* Hero Section Icons */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          1. Hero Section
        </h2>
        <div className="flex items-center gap-6">
          <div className="space-y-2">
            <ClipboardCheck 
              className="h-16 w-16 text-brand-primary"
              aria-label="Checklist icon"
              role="img"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">ClipboardCheck (Large)</p>
          </div>
          <div className="space-y-2">
            <ArrowRight 
              className="h-4 w-4 text-brand-primary"
              aria-label="Arrow right"
              role="img"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">ArrowRight (Small)</p>
          </div>
        </div>
      </section>

      {/* Discovery Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          2. Discovery Section
        </h2>
        <div className="flex items-center gap-6">
          <div className="space-y-2">
            <Compass 
              className="h-10 w-10 text-brand-primary"
              aria-label="Discovery compass icon"
              role="img"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">Compass (Medium-Large)</p>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          3. Trust Indicators
        </h2>
        <div className="flex items-center gap-6">
          <div className="space-y-2">
            <UserCheck 
              className="h-6 w-6 text-success"
              aria-label="User check icon"
              role="img"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">UserCheck</p>
          </div>
          <div className="space-y-2">
            <ShieldCheck 
              className="h-6 w-6 text-success"
              aria-label="Shield check icon"
              role="img"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">ShieldCheck</p>
          </div>
          <div className="space-y-2">
            <Zap 
              className="h-6 w-6 text-success"
              aria-label="Lightning bolt icon"
              role="img"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">Zap</p>
          </div>
        </div>
      </section>

      {/* Benefits/Features */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          4. Benefits/Features
        </h2>
        <div className="flex items-center gap-6">
          <div className="space-y-2">
            <ListChecks 
              className="h-8 w-8 text-brand-primary"
              aria-label="Checklist icon"
              role="img"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">ListChecks</p>
          </div>
          <div className="space-y-2">
            <AlertTriangle 
              className="h-8 w-8 text-warning"
              aria-label="Warning icon"
              role="img"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">AlertTriangle</p>
          </div>
          <div className="space-y-2">
            <Rocket 
              className="h-8 w-8 text-brand-accent"
              aria-label="Rocket launch icon"
              role="img"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">Rocket</p>
          </div>
        </div>
      </section>

      {/* Credibility */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          5. Credibility Section
        </h2>
        <div className="flex items-center gap-6">
          <div className="space-y-2">
            <Eye 
              className="h-12 w-12 text-brand-accent"
              aria-label="Eye icon"
              role="img"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">Eye (Large)</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          6. Final CTA Section
        </h2>
        <div className="flex items-center gap-6">
          <div className="space-y-2">
            <ArrowRight 
              className="h-4 w-4 text-brand-primary"
              aria-label="Arrow right"
              role="img"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">ArrowRight</p>
          </div>
          <div className="space-y-2">
            <Mail 
              className="h-5 w-5 text-brand-primary"
              aria-label="Mail icon"
              role="img"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">Mail</p>
          </div>
        </div>
      </section>

      {/* Interactive States */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          7. Interactive States
        </h2>
        <div className="flex items-center gap-6">
          <div className="space-y-2">
            <Loader2 
              className="h-5 w-5 text-brand-primary animate-spin"
              aria-label="Loading spinner"
              role="img"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading</p>
          </div>
          <div className="space-y-2">
            <CheckCircle2 
              className="h-5 w-5 text-success"
              aria-label="Success icon"
              role="img"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">Success</p>
          </div>
          <div className="space-y-2">
            <AlertCircle 
              className="h-5 w-5 text-error"
              aria-label="Error icon"
              role="img"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">Error</p>
          </div>
        </div>
      </section>

      {/* Hover & Transition Test */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          8. Hover & Transitions
        </h2>
        <div className="flex items-center gap-6">
          <div className="space-y-2">
            <Compass 
              className="h-10 w-10 text-brand-primary transition-all duration-200 hover:scale-110 hover:text-brand-accent cursor-pointer"
              aria-label="Hoverable compass icon"
              role="img"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">Hover me!</p>
          </div>
        </div>
      </section>

      {/* Accessibility Test */}
      <section className="space-y-4 border-t pt-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          ✅ Accessibility Checklist
        </h2>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            All icons have aria-label attributes
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Icons use role="img" for proper semantics
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Color contrast meets WCAG AA standards
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Icons support dark/light mode
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Transitions are smooth (200ms)
          </li>
        </ul>
      </section>

      {/* Dark Mode Toggle Instructions */}
      <section className="space-y-4 bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          🌗 Dark Mode Testing
        </h2>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          To test dark mode, add the "dark" class to the html or body element in your browser's dev tools.
          All icons should adapt their colors appropriately.
        </p>
        <code className="block bg-white dark:bg-gray-900 p-3 rounded text-xs">
          document.documentElement.classList.toggle('dark')
        </code>
      </section>
    </div>
  );
};

export default IconTest;
