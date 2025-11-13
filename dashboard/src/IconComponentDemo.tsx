/**
 * Icon Component Demo
 * 
 * Comprehensive demonstration of the Icon component with all approved icons,
 * sizes, colors, and usage patterns for the landing page.
 * 
 * To view: Import this in App.tsx and render <IconComponentDemo />
 */

import { Icon } from './components/Icon';
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
} from './lib/icons';

export default function IconComponentDemo() {
  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Icon Component Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Reusable icon component with all approved landing page icons
          </p>
        </header>

        {/* Size Variants */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Size Variants
          </h2>
          <div className="flex items-end gap-8 flex-wrap">
            <div className="text-center space-y-2">
              <Icon icon={Compass} size="xs" label="XS Compass" />
              <p className="text-sm text-gray-600">xs (12px)</p>
            </div>
            <div className="text-center space-y-2">
              <Icon icon={Compass} size="sm" label="SM Compass" />
              <p className="text-sm text-gray-600">sm (16px)</p>
            </div>
            <div className="text-center space-y-2">
              <Icon icon={Compass} size="md" label="MD Compass" />
              <p className="text-sm text-gray-600">md (24px)</p>
            </div>
            <div className="text-center space-y-2">
              <Icon icon={Compass} size="lg" label="LG Compass" />
              <p className="text-sm text-gray-600">lg (32px)</p>
            </div>
            <div className="text-center space-y-2">
              <Icon icon={Compass} size="xl" label="XL Compass" />
              <p className="text-sm text-gray-600">xl (40px)</p>
            </div>
            <div className="text-center space-y-2">
              <Icon icon={Compass} size="2xl" label="2XL Compass" />
              <p className="text-sm text-gray-600">2xl (48px)</p>
            </div>
          </div>
        </section>

        {/* Color Variants */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Color Variants
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center space-y-3">
              <Icon icon={Compass} size="xl" color="brand-primary" label="Brand Primary" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">brand-primary</p>
              <p className="text-xs text-gray-500">#667eea</p>
            </div>
            <div className="text-center space-y-3">
              <Icon icon={Compass} size="xl" color="brand-accent" label="Brand Accent" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">brand-accent</p>
              <p className="text-xs text-gray-500">#764ba2</p>
            </div>
            <div className="text-center space-y-3">
              <Icon icon={CheckCircle2} size="xl" color="success" label="Success" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">success</p>
              <p className="text-xs text-gray-500">#10b981</p>
            </div>
            <div className="text-center space-y-3">
              <Icon icon={AlertTriangle} size="xl" color="warning" label="Warning" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">warning</p>
              <p className="text-xs text-gray-500">#f59e0b</p>
            </div>
            <div className="text-center space-y-3">
              <Icon icon={AlertCircle} size="xl" color="error" label="Error" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">error</p>
              <p className="text-xs text-gray-500">#ef4444</p>
            </div>
            <div className="text-center space-y-3">
              <Icon icon={Compass} size="xl" color="neutral" label="Neutral" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">neutral</p>
              <p className="text-xs text-gray-500">#6b7280</p>
            </div>
          </div>
        </section>

        {/* Landing Page Icons */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Approved Landing Page Icons
          </h2>
          
          <div className="space-y-8">
            {/* Hero */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Hero Section
              </h3>
              <div className="flex items-center gap-6">
                <Icon 
                  icon={ClipboardCheck}
                  size="2xl"
                  color="brand-primary"
                  label="Pre-launch checklist"
                />
                <div>
                  <p className="font-medium">ClipboardCheck</p>
                  <p className="text-sm text-gray-600">Main hero icon, emphasizes action</p>
                </div>
              </div>
            </div>

            {/* Discovery */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Discovery Section
              </h3>
              <div className="flex items-center gap-6">
                <Icon 
                  icon={Compass}
                  size="lg"
                  color="brand-primary"
                  label="Discovery process"
                />
                <div>
                  <p className="font-medium">Compass</p>
                  <p className="text-sm text-gray-600">Represents exploration and guidance</p>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Trust Indicators
              </h3>
              <div className="flex gap-8 flex-wrap">
                <div className="flex items-center gap-3">
                  <Icon 
                    icon={UserCheck}
                    size="md"
                    color="success"
                    label="Used by 100+ founders"
                  />
                  <span className="text-sm">UserCheck</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon 
                    icon={ShieldCheck}
                    size="md"
                    color="success"
                    label="No credit card required"
                  />
                  <span className="text-sm">ShieldCheck</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon 
                    icon={Zap}
                    size="md"
                    color="success"
                    label="Instant download"
                  />
                  <span className="text-sm">Zap</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Benefits/Features
              </h3>
              <div className="flex gap-8 flex-wrap">
                <div className="flex items-center gap-3">
                  <Icon 
                    icon={ListChecks}
                    size="lg"
                    color="brand-primary"
                    label="5 must-have elements"
                  />
                  <span className="text-sm">ListChecks</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon 
                    icon={AlertTriangle}
                    size="lg"
                    color="warning"
                    label="10 common mistakes"
                  />
                  <span className="text-sm">AlertTriangle</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon 
                    icon={Rocket}
                    size="lg"
                    color="brand-accent"
                    label="Implementation steps"
                  />
                  <span className="text-sm">Rocket</span>
                </div>
              </div>
            </div>

            {/* Credibility */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Credibility Section
              </h3>
              <div className="flex items-center gap-6">
                <Icon 
                  icon={Eye}
                  size="xl"
                  color="brand-accent"
                  label="500+ landing pages reviewed"
                />
                <div>
                  <p className="font-medium">Eye</p>
                  <p className="text-sm text-gray-600">Represents reviews and expertise</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                CTA Section
              </h3>
              <div className="flex gap-8 flex-wrap">
                <div className="flex items-center gap-3">
                  <Icon 
                    icon={ArrowRight}
                    size="sm"
                    color="brand-primary"
                    decorative
                  />
                  <span className="text-sm">ArrowRight (decorative in button)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon 
                    icon={Mail}
                    size="sm"
                    color="brand-primary"
                    decorative
                  />
                  <span className="text-sm">Mail (near form)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Examples */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Interactive Examples
          </h2>
          
          <div className="space-y-6">
            {/* Hover Effect */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                Hover Effect
              </h3>
              <Icon 
                icon={Compass}
                size="xl"
                color="brand-primary"
                label="Hoverable compass"
                className="hover:scale-110 cursor-pointer"
                transition="fast"
              />
              <p className="text-sm text-gray-600 mt-2">Hover over the icon</p>
            </div>

            {/* Loading Spinner */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                Loading Spinner
              </h3>
              <Icon 
                icon={Loader2}
                size="lg"
                color="brand-primary"
                label="Loading"
                className="animate-spin"
                transition="none"
              />
            </div>

            {/* Button with Icon */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                Button with Decorative Icon
              </h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#667eea] text-white rounded-lg hover:bg-[#764ba2] transition-colors">
                Download Checklist
                <Icon icon={ArrowRight} size="sm" decorative />
              </button>
            </div>

            {/* Icon with Text */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                Icon with Text
              </h3>
              <div className="flex items-center gap-2 text-[#10b981]">
                <Icon icon={CheckCircle2} size="sm" decorative />
                <span>Used by 100+ founders</span>
              </div>
            </div>
          </div>
        </section>

        {/* Accessibility Notes */}
        <section className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-xl p-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Icon icon={CheckCircle2} size="lg" color="success" decorative />
            Accessibility Features
          </h2>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <Icon icon={CheckCircle2} size="sm" color="success" decorative />
              <span>Semantic icons have aria-label for screen readers</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon={CheckCircle2} size="sm" color="success" decorative />
              <span>Decorative icons are hidden from assistive technology</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon={CheckCircle2} size="sm" color="success" decorative />
              <span>All colors meet WCAG AA contrast standards</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon={CheckCircle2} size="sm" color="success" decorative />
              <span>Development warnings for missing labels</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon={CheckCircle2} size="sm" color="success" decorative />
              <span>Full TypeScript support with type safety</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

