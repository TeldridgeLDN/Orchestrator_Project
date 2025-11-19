/**
 * Trust Signals Check
 * 
 * Validates trust-building elements on marketing pages:
 * - Testimonials with real names/photos
 * - Privacy policy links
 * - No fake urgency tactics
 * - Social proof elements
 * - Security badges
 * 
 * Based on Monzo principles:
 * - "Consistency = Trust" - predictable, reliable patterns
 * - "Straightforward Kindness" - genuine, not manipulative
 */

export async function checkTrustSignals(page, config) {
  const issues = [];
  const measurements = {};
  
  try {
    // ==========================================
    // CHECK 1: Testimonials Quality
    // ==========================================
    try {
      const testimonials = await page.locator('[data-testimonial], .testimonial, [class*="testimonial"]').all();
      measurements.testimonialsFound = testimonials.length;
      
      const minTestimonials = config.requirements?.minTestimonials || 2;
      
      if (testimonials.length === 0) {
        issues.push({
          severity: config.severity?.['missing-testimonials'] || 'warning',
          category: 'trust-signals',
          rule: 'testimonials-have-names',
          message: 'No testimonials found on page',
          recommendation: 'Add 2-3 authentic testimonials with real names and companies to build trust',
          impact: 'Medium - Social proof increases conversion by 15-34%'
        });
      } else if (testimonials.length < minTestimonials) {
        issues.push({
          severity: 'suggestion',
          category: 'trust-signals',
          rule: 'testimonials-have-names',
          message: `Only ${testimonials.length} testimonial(s) found (recommended: ${minTestimonials}+)`,
          recommendation: 'Add more testimonials for stronger social proof',
          impact: 'Low - More testimonials increase credibility'
        });
      }
      
      // Check each testimonial for required elements
      const testimonialDetails = [];
      
      for (const [index, testimonial] of testimonials.entries()) {
        const details = await testimonial.evaluate((el) => {
          const hasName = !!(
            el.querySelector('[data-author-name], .author-name, [class*="name"]') ||
            el.textContent.match(/—\s*\w+\s+\w+/) // Match "— John Doe" format
          );
          
          const hasPhoto = !!el.querySelector('img[data-author-photo], img[alt*="photo"], img[alt*="headshot"]');
          
          const hasCompany = !!(
            el.querySelector('[data-company], .company, [class*="company"]') ||
            el.textContent.match(/,\s*(CEO|Founder|Manager)\s+@\s*\w+/) // Match "CEO @ Company" format
          );
          
          return { hasName, hasPhoto, hasCompany };
        });
        
        testimonialDetails.push(details);
        
        // Flag missing name
        if (!details.hasName) {
          issues.push({
            severity: 'warning',
            category: 'trust-signals',
            rule: 'testimonials-have-names',
            message: `Testimonial #${index + 1} missing author name`,
            recommendation: 'Add real name to testimonial (Monzo principle: authenticity builds trust)',
            impact: 'Medium - Anonymous testimonials reduce credibility by 50%',
            testimonialIndex: index + 1
          });
        }
        
        // Flag missing photo (if configured)
        if (!details.hasPhoto && config.rules?.includes('testimonials-have-photos')) {
          issues.push({
            severity: 'suggestion',
            category: 'trust-signals',
            rule: 'testimonials-have-photos',
            message: `Testimonial #${index + 1} missing author photo`,
            recommendation: 'Add photo for authenticity (real faces increase trust)',
            impact: 'Low - Photos improve testimonial credibility',
            testimonialIndex: index + 1
          });
        }
        
        // Flag missing company
        if (!details.hasCompany) {
          issues.push({
            severity: 'suggestion',
            category: 'trust-signals',
            rule: 'testimonials-have-names',
            message: `Testimonial #${index + 1} missing company/title`,
            recommendation: 'Add company name or role for context',
            impact: 'Low - Context increases relevance',
            testimonialIndex: index + 1
          });
        }
      }
      
      measurements.testimonialDetails = testimonialDetails;
      
    } catch (err) {
      console.warn('Testimonial check failed:', err.message);
    }
    
    // ==========================================
    // CHECK 2: Privacy Policy & Legal Links
    // ==========================================
    try {
      const requiredLinks = config.requirements?.requiredLinks || ['privacy-policy', 'terms-of-service'];
      const foundLinks = {};
      
      for (const linkType of requiredLinks) {
        const linkExists = await page.locator(`a[href*="${linkType}"], a[href*="${linkType.replace('-', '')}"]`).count() > 0;
        foundLinks[linkType] = linkExists;
        
        if (!linkExists && linkType === 'privacy-policy') {
          issues.push({
            severity: config.severity?.['no-privacy-policy'] || 'critical',
            category: 'trust-signals',
            rule: 'privacy-policy-linked',
            message: 'No privacy policy link found',
            recommendation: 'Add privacy policy link in footer (legal requirement + trust signal)',
            impact: 'High - Required by GDPR/CCPA, absence reduces trust significantly'
          });
        } else if (!linkExists) {
          issues.push({
            severity: 'warning',
            category: 'trust-signals',
            rule: 'privacy-policy-linked',
            message: `No ${linkType.replace('-', ' ')} link found`,
            recommendation: `Add ${linkType.replace('-', ' ')} link for transparency`,
            impact: 'Medium - Missing legal links reduce credibility'
          });
        }
      }
      
      measurements.requiredLinks = foundLinks;
      
    } catch (err) {
      console.warn('Legal links check failed:', err.message);
    }
    
    // ==========================================
    // CHECK 3: Fake Urgency Detection
    // ==========================================
    try {
      const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
      
      const fakeUrgencyPatterns = config.fakeUrgencyPatterns || [
        { pattern: /only\s+\d+\s+spots?\s+left/i, type: 'limited-spots' },
        { pattern: /expires?\s+in\s+\d+\s+(minutes?|hours?)/i, type: 'time-limit' },
        { pattern: /limited\s+time\s+offer/i, type: 'vague-urgency' },
        { pattern: /almost\s+sold\s+out/i, type: 'stock-pressure' },
        { pattern: /\d+\s+people\s+watching/i, type: 'social-pressure' },
        { pattern: /act\s+now|buy\s+now|order\s+now/i, type: 'pressure-tactics' }
      ];
      
      const urgencyFound = [];
      
      for (const { pattern, type } of fakeUrgencyPatterns) {
        const matches = pageText.match(pattern);
        if (matches) {
          // Check if urgency is genuine (has data attribute or countdown element)
          const isGenuine = await page.evaluate((urgencyType) => {
            // Check for data attributes
            if (document.querySelector('[data-spots-remaining]')) return true;
            if (document.querySelector('[data-countdown]')) return true;
            if (document.querySelector('[data-end-date]')) return true;
            if (document.querySelector('[data-stock-level]')) return true;
            
            // Check for actual countdown timer scripts
            if (document.querySelector('script[src*="countdown"]')) return true;
            
            return false;
          }, type);
          
          if (!isGenuine) {
            urgencyFound.push({ type, text: matches[0] });
          }
        }
      }
      
      measurements.urgencyTactics = {
        found: urgencyFound.length,
        genuine: urgencyFound.length === 0,
        details: urgencyFound
      };
      
      if (urgencyFound.length > 0) {
        issues.push({
          severity: config.severity?.['fake-urgency'] || 'critical',
          category: 'trust-signals',
          rule: 'no-fake-urgency',
          message: `Potential fake urgency detected: ${urgencyFound.map(u => `"${u.text}"`).join(', ')}`,
          recommendation: 'Use genuine scarcity only (Monzo principle: trust over tricks):\n' +
                         '  - Add data-countdown attribute to countdown timers\n' +
                         '  - Add data-spots-remaining attribute for limited availability\n' +
                         '  - Remove vague urgency language if not backed by real data',
          impact: 'High - Fake urgency destroys trust when discovered',
          urgencyTactics: urgencyFound
        });
      }
      
    } catch (err) {
      console.warn('Fake urgency check failed:', err.message);
    }
    
    // ==========================================
    // CHECK 4: Social Proof Elements
    // ==========================================
    try {
      const socialProofElements = {
        customerCount: await page.locator('[data-customer-count], [class*="customer-count"]').count() > 0,
        trustBadges: await page.locator('[data-trust-badge], .trust-badge, [class*="badge"]').count() > 0,
        logoStrip: await page.locator('[data-logo-strip], .logo-strip, [class*="clients"]').count() > 0,
        ratings: await page.locator('[data-rating], .rating, [class*="stars"]').count() > 0
      };
      
      measurements.socialProof = socialProofElements;
      
      const socialProofCount = Object.values(socialProofElements).filter(Boolean).length;
      
      if (socialProofCount === 0) {
        issues.push({
          severity: 'warning',
          category: 'trust-signals',
          rule: 'social-proof-present',
          message: 'No social proof elements found',
          recommendation: 'Add social proof:\n' +
                         '  - Customer count ("Join 10,000+ users")\n' +
                         '  - Trust badges (security, certifications)\n' +
                         '  - Client/partner logos\n' +
                         '  - Ratings or reviews',
          impact: 'Medium - Social proof increases conversion by 15%'
        });
      } else if (socialProofCount < 2) {
        issues.push({
          severity: 'suggestion',
          category: 'trust-signals',
          rule: 'social-proof-present',
          message: `Only ${socialProofCount} type of social proof found`,
          recommendation: 'Add additional social proof types for stronger credibility',
          impact: 'Low - Multiple proof types compound trust'
        });
      }
      
    } catch (err) {
      console.warn('Social proof check failed:', err.message);
    }
    
    // ==========================================
    // CHECK 5: Security Indicators
    // ==========================================
    try {
      const securityElements = {
        https: await page.evaluate(() => window.location.protocol === 'https:'),
        securityBadges: await page.locator('[alt*="secure"], [alt*="ssl"], [alt*="verified"]').count() > 0,
        paymentIcons: await page.locator('[alt*="visa"], [alt*="mastercard"], [alt*="paypal"]').count() > 0
      };
      
      measurements.security = securityElements;
      
      if (!securityElements.https) {
        issues.push({
          severity: 'critical',
          category: 'trust-signals',
          rule: 'secure-badges',
          message: 'Site not using HTTPS protocol',
          recommendation: 'Enable HTTPS/SSL certificate (required for collecting user data)',
          impact: 'Critical - Browsers warn users, destroys trust'
        });
      }
      
      // Only check for payment icons if there's a form (likely checkout)
      const hasForms = await page.locator('form').count() > 0;
      if (hasForms && !securityElements.securityBadges) {
        issues.push({
          severity: 'suggestion',
          category: 'trust-signals',
          rule: 'secure-badges',
          message: 'No security badges found near form',
          recommendation: 'Add security badges near data collection forms to build trust',
          impact: 'Low - Security indicators reduce form abandonment'
        });
      }
      
    } catch (err) {
      console.warn('Security check failed:', err.message);
    }
    
    // ==========================================
    // CHECK 6: Money-Back Guarantee / Risk Reversal
    // ==========================================
    try {
      const guaranteeText = await page.evaluate(() => {
        const text = document.body.innerText.toLowerCase();
        return {
          moneyBack: text.includes('money back') || text.includes('money-back'),
          guarantee: text.includes('guarantee'),
          refund: text.includes('refund'),
          noRisk: text.includes('no risk') || text.includes('risk-free')
        };
      });
      
      measurements.guarantee = guaranteeText;
      
      const hasGuarantee = Object.values(guaranteeText).some(Boolean);
      
      if (!hasGuarantee) {
        issues.push({
          severity: 'suggestion',
          category: 'trust-signals',
          rule: 'social-proof-present',
          message: 'No risk reversal/guarantee mentioned',
          recommendation: 'Consider adding:\n' +
                         '  - Money-back guarantee\n' +
                         '  - Free trial period\n' +
                         '  - No credit card required\n' +
                         '  - Cancel anytime policy',
          impact: 'Low-Medium - Guarantees reduce purchase anxiety'
        });
      }
      
    } catch (err) {
      console.warn('Guarantee check failed:', err.message);
    }
    
  } catch (error) {
    console.error('Trust signals check error:', error);
    issues.push({
      severity: 'warning',
      category: 'system',
      rule: 'trust-signals-check',
      message: `Trust signals check encountered an error: ${error.message}`,
      recommendation: 'Review page structure',
      impact: 'Unknown'
    });
  }
  
  return {
    passed: issues.filter(i => i.severity === 'critical').length === 0,
    issues,
    measurements,
    summary: {
      total: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      suggestions: issues.filter(i => i.severity === 'suggestion').length
    }
  };
}

export default checkTrustSignals;

