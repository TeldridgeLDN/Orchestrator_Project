/**
 * Prospecting Landing Page
 * 
 * A conversion-optimized landing page for the Pre-Launch Landing Page Checklist
 * Following Monzo design principles: Straightforward Kindness, Simplicity, Friction Reduction
 * 
 * Sections:
 * 1. Hero - Above the fold with email capture
 * 2. Trust Indicators - Social proof badges
 * 3. Discovery - Process explanation
 * 4. Benefits/Features - Value propositions
 * 5. Social Proof - Testimonials (deferred)
 * 6. Credibility - Authority establishment
 * 7. Final CTA - Second conversion opportunity
 */

import React, { useState } from 'react';
import { Icon } from './Icon';
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
  CheckCircle2,
} from '../lib/icons';

export const LandingPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent, source: 'hero' | 'cta') => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      console.log(`Email submitted from ${source}:`, email);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail('');
      }, 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-primary to-brand-accent text-white py-20 px-6 md:py-32 lg:py-40">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Icon */}
          <div className="mb-8 flex justify-center">
            <Icon 
              icon={ClipboardCheck}
              size="2xl"
              className="text-white drop-shadow-lg animate-fade-in"
              label="Landing page checklist"
            />
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Get Your Pre-Launch Landing Page Checklist
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl mb-10 text-white/90 leading-relaxed">
            The 5-step framework 500+ founders used to validate their ideas
          </p>

          {/* Email Form */}
          <form 
            onSubmit={(e) => handleSubmit(e, 'hero')}
            className="max-w-md mx-auto"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Icon
                  icon={Mail}
                  size="sm"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  decorative
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || isSubmitted}
                className="px-6 py-3 bg-white text-brand-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitted ? (
                  <>
                    <Icon icon={CheckCircle2} size="sm" decorative />
                    Sent!
                  </>
                ) : (
                  <>
                    Download Free Checklist
                    <Icon icon={ArrowRight} size="sm" decorative />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-10 text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <Icon 
                icon={UserCheck}
                size="md"
                color="accent"
                label="Social proof"
              />
              <span className="font-medium">Used by 100+ founders</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon 
                icon={ShieldCheck}
                size="md"
                color="accent"
                label="No risk"
              />
              <span className="font-medium">No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon 
                icon={Zap}
                size="md"
                color="accent"
                label="Instant access"
              />
              <span className="font-medium">Instant download</span>
            </div>
          </div>
        </div>
      </section>

      {/* Discovery Section */}
      <section className="py-20 px-6 md:py-28 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <Icon 
              icon={Compass}
              size="xl"
              className="text-brand-primary transition-transform hover:rotate-12 duration-300"
              label="Discovery process"
            />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            Discovery
          </h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            We kick off with a focused session to understand your idea, target audience, 
            and key assumptions to test
          </p>
        </div>
      </section>

      {/* Benefits/Features Section */}
      <section className="py-20 px-6 md:py-28 lg:py-32 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-16 text-center text-gray-900 dark:text-white">
            What You'll Get
          </h2>
          
          <div className="grid md:grid-cols-3 gap-10 lg:gap-12">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-6">
                <Icon 
                  icon={ListChecks}
                  size="lg"
                  className="text-brand-primary"
                  label="Essential elements"
                />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                5 Must-Have Elements
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                The essential components every pre-launch page needs to validate 
                your idea and capture leads effectively
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-6">
                <Icon 
                  icon={AlertTriangle}
                  size="lg"
                  className="text-warning"
                  label="Common mistakes"
                />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                10 Common Mistakes
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Avoid the pitfalls that cause 90% of pre-launch pages to fail. 
                Learn from others' mistakes
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-6">
                <Icon 
                  icon={Rocket}
                  size="lg"
                  className="text-brand-accent"
                  label="Implementation steps"
                />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Actionable Steps
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Step-by-step implementation guide with real examples and 
                templates you can use immediately
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Credibility Section */}
      <section className="py-20 px-6 md:py-28 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <Icon 
              icon={Eye}
              size="xl"
              className="text-brand-accent"
              label="Expertise"
            />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            Battle-Tested Expertise
          </h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed">
            I've reviewed 500+ landing pages and helped founders optimize their 
            pre-launch strategy. This checklist distills everything that works.
          </p>
          <div className="flex justify-center gap-12 md:gap-16 text-gray-600 dark:text-gray-400">
            <div>
              <div className="text-3xl font-bold text-brand-primary">500+</div>
              <div className="text-sm">Pages Reviewed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-primary">100+</div>
              <div className="text-sm">Founders Helped</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-primary">90%</div>
              <div className="text-sm">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6 md:py-32 lg:py-40 bg-gradient-to-br from-brand-primary to-brand-accent text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Validate Your Idea?
          </h2>
          <p className="text-xl mb-10 text-white/90 leading-relaxed">
            Download the free checklist and start building your pre-launch page today
          </p>

          {/* Email Form */}
          <form 
            onSubmit={(e) => handleSubmit(e, 'cta')}
            className="max-w-md mx-auto"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Icon
                  icon={Mail}
                  size="sm"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  decorative
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || isSubmitted}
                className="px-6 py-3 bg-white text-brand-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitted ? (
                  <>
                    <Icon icon={CheckCircle2} size="sm" decorative />
                    Sent!
                  </>
                ) : (
                  <>
                    Get Free Checklist
                    <Icon icon={ArrowRight} size="sm" decorative />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Trust reminder */}
          <div className="mt-8 flex justify-center items-center gap-8 text-sm text-white/80">
            <div className="flex items-center gap-1">
              <Icon icon={ShieldCheck} size="xs" decorative />
              <span>No spam</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon icon={Zap} size="xs" decorative />
              <span>Instant access</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon icon={CheckCircle2} size="xs" decorative />
              <span>Free forever</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-400 text-center text-sm">
        <p>&copy; 2025 Portfolio Redesign. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;

