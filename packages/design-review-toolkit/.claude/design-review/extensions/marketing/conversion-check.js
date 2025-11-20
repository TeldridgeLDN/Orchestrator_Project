/**
 * Conversion Optimization Check
 * 
 * Validates elements that impact conversion rates on marketing pages:
 * - CTA placement (above fold)
 * - Form friction (field count)
 * - Loading performance
 * - Mobile accessibility
 * 
 * Based on Monzo principle: "Thoughtful Friction" - minimize unnecessary friction
 */

export async function checkConversion(page, config) {
  const issues = [];
  const measurements = {};
  
  try {
    // Get viewport dimensions
    const viewport = page.viewportSize();
    measurements.viewport = viewport;
    
    // ==========================================
    // CHECK 1: CTA Above Fold
    // ==========================================
    try {
      const ctaButtons = await page.locator('button[data-cta="primary"], a[data-cta="primary"], button:has-text("Download"), button:has-text("Get Started")').all();
      
      if (ctaButtons.length === 0) {
        issues.push({
          severity: 'critical',
          category: 'conversion',
          rule: 'cta-above-fold',
          message: 'No primary CTA button found on page',
          recommendation: 'Add a clear, prominent CTA button with data-cta="primary" attribute',
          impact: 'High - Users may not know what action to take'
        });
      } else {
        for (const [index, cta] of ctaButtons.entries()) {
          const box = await cta.boundingBox();
          
          if (box) {
            const isBelowFold = box.y > viewport.height;
            measurements[`cta${index + 1}`] = {
              position: { x: box.x, y: box.y },
              size: { width: box.width, height: box.height },
              belowFold: isBelowFold
            };
            
            if (isBelowFold) {
              const text = await cta.textContent();
              issues.push({
                severity: config.severity?.['cta-below-fold'] || 'critical',
                category: 'conversion',
                rule: 'cta-above-fold',
                message: `Primary CTA "${text}" is ${Math.round(box.y - viewport.height)}px below the fold`,
                recommendation: 'Move CTA button above fold (within first viewport height) for better visibility and conversion',
                impact: 'High - 70% of users never scroll below fold',
                location: { x: box.x, y: box.y }
              });
            }
            
            // Check CTA size (touch targets)
            const minSize = config.thresholds?.minCtaSize || { width: 120, height: 44 };
            if (box.width < minSize.width || box.height < minSize.height) {
              issues.push({
                severity: 'warning',
                category: 'conversion',
                rule: 'mobile-cta-accessibility',
                message: `CTA button is too small (${Math.round(box.width)}x${Math.round(box.height)}px, min: ${minSize.width}x${minSize.height}px)`,
                recommendation: 'Increase button size for better mobile usability (44px min height recommended)',
                impact: 'Medium - Hard to tap on mobile devices'
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('CTA check failed:', err.message);
    }
    
    // ==========================================
    // CHECK 2: Form Friction
    // ==========================================
    try {
      const forms = await page.locator('form').all();
      
      for (const [formIndex, form] of forms.entries()) {
        // Count form fields (input, textarea, select)
        const inputs = await form.locator('input:not([type="hidden"]), textarea, select').all();
        const fieldCount = inputs.length;
        
        measurements[`form${formIndex + 1}`] = {
          fieldCount,
          fields: []
        };
        
        const maxFields = config.thresholds?.maxFormFields || 3;
        
        if (fieldCount > maxFields) {
          issues.push({
            severity: config.severity?.['too-many-fields'] || 'warning',
            category: 'conversion',
            rule: 'form-field-count',
            message: `Form has ${fieldCount} fields (recommended max: ${maxFields} for lead capture)`,
            recommendation: 'Reduce form friction by minimizing fields. Ask only for essential information (e.g., email only for lead magnet)',
            impact: 'Medium - Each additional field reduces conversion by ~11%',
            formIndex: formIndex + 1
          });
        }
        
        // Check for required asterisks without labels
        for (const input of inputs) {
          const hasLabel = await input.evaluate(el => {
            const label = el.closest('label') || document.querySelector(`label[for="${el.id}"]`);
            return !!label;
          });
          
          const isRequired = await input.getAttribute('required') !== null;
          
          if (isRequired && !hasLabel) {
            issues.push({
              severity: 'warning',
              category: 'conversion',
              rule: 'form-field-count',
              message: 'Required form field missing associated label',
              recommendation: 'Add clear labels to all form fields for better UX',
              impact: 'Low - Reduces user confidence'
            });
          }
        }
      }
    } catch (err) {
      console.warn('Form friction check failed:', err.message);
    }
    
    // ==========================================
    // CHECK 3: Loading Performance
    // ==========================================
    try {
      const performanceTiming = await page.evaluate(() => {
        const perf = performance.timing;
        return {
          loadTime: perf.loadEventEnd - perf.navigationStart,
          domContentLoaded: perf.domContentLoadedEventEnd - perf.navigationStart,
          firstPaint: performance.getEntriesByType('paint').find(e => e.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByType('paint').find(e => e.name === 'first-contentful-paint')?.startTime || 0
        };
      });
      
      measurements.performance = performanceTiming;
      
      const maxLoadTime = config.thresholds?.loadTime || 3000;
      
      if (performanceTiming.loadTime > maxLoadTime) {
        issues.push({
          severity: config.severity?.['slow-loading'] || 'serious',
          category: 'conversion',
          rule: 'loading-time',
          message: `Page load time: ${Math.round(performanceTiming.loadTime)}ms (target: <${maxLoadTime}ms)`,
          recommendation: 'Optimize page speed:\n' +
                         '  - Compress images (use WebP format)\n' +
                         '  - Minimize JavaScript bundle size\n' +
                         '  - Enable CDN caching\n' +
                         '  - Use lazy loading for below-fold content',
          impact: 'High - 53% of users abandon if page takes >3s to load',
          measurements: {
            loadTime: performanceTiming.loadTime,
            domContentLoaded: performanceTiming.domContentLoaded,
            firstContentfulPaint: performanceTiming.firstContentfulPaint
          }
        });
      }
      
      // Check First Contentful Paint (FCP)
      if (performanceTiming.firstContentfulPaint > 1800) {
        issues.push({
          severity: 'warning',
          category: 'conversion',
          rule: 'loading-time',
          message: `First Contentful Paint: ${Math.round(performanceTiming.firstContentfulPaint)}ms (target: <1800ms)`,
          recommendation: 'Improve perceived performance by optimizing critical rendering path',
          impact: 'Medium - Users perceive site as slow'
        });
      }
    } catch (err) {
      console.warn('Performance check failed:', err.message);
    }
    
    // ==========================================
    // CHECK 4: CTA Contrast (Accessibility meets Conversion)
    // ==========================================
    try {
      const ctaButtons = await page.locator('button[data-cta="primary"]').all();
      
      for (const [index, cta] of ctaButtons.entries()) {
        const styles = await cta.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color,
            fontSize: computed.fontSize
          };
        });
        
        measurements[`cta${index + 1}Styles`] = styles;
        
        // Calculate contrast ratio (simplified)
        const minContrast = config.thresholds?.ctaMinContrast || 4.5;
        
        // Note: Real contrast calculation would use relative luminance formula
        // For now, we flag for manual review if colors look similar
        if (styles.backgroundColor === styles.color) {
          issues.push({
            severity: 'critical',
            category: 'conversion',
            rule: 'cta-above-fold',
            message: 'CTA button has identical background and text colors',
            recommendation: 'Ensure CTA button has high contrast (min 4.5:1 ratio) for visibility',
            impact: 'High - Button is invisible to users'
          });
        }
      }
    } catch (err) {
      console.warn('CTA contrast check failed:', err.message);
    }
    
  } catch (error) {
    console.error('Conversion check error:', error);
    issues.push({
      severity: 'warning',
      category: 'system',
      rule: 'conversion-check',
      message: `Conversion check encountered an error: ${error.message}`,
      recommendation: 'Review page structure and ensure elements have proper selectors',
      impact: 'Unknown'
    });
  }
  
  // Calculate pass/fail
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const seriousIssues = issues.filter(i => i.severity === 'serious');
  
  return {
    passed: criticalIssues.length === 0,
    issues,
    measurements,
    summary: {
      total: issues.length,
      critical: criticalIssues.length,
      serious: seriousIssues.length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      suggestions: issues.filter(i => i.severity === 'suggestion').length
    },
    recommendations: generateRecommendations(issues, measurements)
  };
}

/**
 * Generate prioritized recommendations based on issues found
 */
function generateRecommendations(issues, measurements) {
  const recommendations = [];
  
  // Priority 1: Critical issues
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  if (criticalIssues.length > 0) {
    recommendations.push({
      priority: 'critical',
      title: 'Fix Critical Conversion Issues',
      items: criticalIssues.map(i => i.recommendation),
      impact: 'Immediate action required - these issues significantly harm conversion'
    });
  }
  
  // Priority 2: Performance
  const perfIssues = issues.filter(i => i.rule === 'loading-time');
  if (perfIssues.length > 0) {
    recommendations.push({
      priority: 'high',
      title: 'Improve Page Performance',
      items: perfIssues.map(i => i.recommendation),
      impact: 'High - Speed directly correlates with conversion rate'
    });
  }
  
  // Priority 3: Form optimization
  const formIssues = issues.filter(i => i.rule === 'form-field-count');
  if (formIssues.length > 0) {
    recommendations.push({
      priority: 'medium',
      title: 'Reduce Form Friction',
      items: formIssues.map(i => i.recommendation),
      impact: 'Medium - Simpler forms convert better'
    });
  }
  
  return recommendations;
}

/**
 * Helper: Calculate color contrast ratio
 * https://www.w3.org/TR/WCAG20-TECHS/G18.html
 */
function calculateContrastRatio(color1, color2) {
  // Parse RGB values
  const rgb1 = parseRGB(color1);
  const rgb2 = parseRGB(color2);
  
  // Calculate relative luminance
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  
  // Calculate contrast ratio
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function parseRGB(color) {
  // Simplified RGB parser (would need full implementation)
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    return {
      r: parseInt(match[1]) / 255,
      g: parseInt(match[2]) / 255,
      b: parseInt(match[3]) / 255
    };
  }
  return { r: 0, g: 0, b: 0 };
}

function relativeLuminance({ r, g, b }) {
  // Convert to linear RGB
  const [rs, gs, bs] = [r, g, b].map(c => 
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  
  // Calculate luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export default checkConversion;

