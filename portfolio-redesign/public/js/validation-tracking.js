/**
 * Validation Landing Pages - Analytics Tracking
 * Task 128.2 - Plausible Analytics Event Placeholders
 * 
 * Events to track:
 * - Package clicks (Core, Premium, Add-ons)
 * - Example page views (Starter, Standard, Comparison)
 * - Scroll depth (25%, 50%, 75%, 100%)
 * - Checklist download (V3 only)
 */

(function() {
  'use strict';

  // Get current variant from localStorage or path
  function getCurrentVariant() {
    const storedVariant = localStorage.getItem('validation_variant');
    if (storedVariant) {
      return storedVariant.toUpperCase();
    }

    // Fallback: detect from URL path
    const path = window.location.pathname;
    if (path.includes('/validate-v2/')) return 'V2';
    if (path.includes('/validate-v3/')) return 'V3';
    if (path.includes('/validate/')) return 'V1';
    
    return 'UNKNOWN';
  }

  const variant = getCurrentVariant();
  console.log('[Analytics] Current variant:', variant);

  /**
   * Track package click
   */
  function trackPackageClick(packageName, location) {
    console.log('[Analytics] Package click:', { packageName, variant, location });
    
    // TODO: Uncomment when Plausible is set up
    // if (window.plausible) {
    //   window.plausible('Package_Click', {
    //     props: {
    //       package: packageName,
    //       variant: variant,
    //       location: location // 'top' or 'bottom'
    //     }
    //   });
    // }
  }

  /**
   * Track example page view
   */
  function trackExampleView(exampleName) {
    console.log('[Analytics] Example view:', { exampleName, variant });
    
    // TODO: Uncomment when Plausible is set up
    // if (window.plausible) {
    //   window.plausible('Example_View', {
    //     props: {
    //       example: exampleName, // 'Starter', 'Standard', 'Compare'
    //       variant: variant
    //     }
    //   });
    // }
  }

  /**
   * Track scroll depth
   */
  function trackScrollDepth(depth) {
    console.log('[Analytics] Scroll depth:', { depth, variant });
    
    // TODO: Uncomment when Plausible is set up
    // if (window.plausible) {
    //   window.plausible('Scroll_Depth', {
    //     props: {
    //       depth: depth, // '25', '50', '75', '100'
    //       variant: variant
    //     }
    //   });
    // }
  }

  /**
   * Track checklist download (V3 only)
   */
  function trackChecklistDownload() {
    console.log('[Analytics] Checklist download:', { variant });
    
    // TODO: Uncomment when Plausible is set up
    // if (window.plausible) {
    //   window.plausible('Checklist_Download', {
    //     props: {
    //       variant: variant
    //     }
    //   });
    // }
  }

  /**
   * Set up scroll depth tracking
   */
  function initScrollTracking() {
    const scrollMilestones = [25, 50, 75, 100];
    const tracked = new Set();

    function checkScrollDepth() {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      scrollMilestones.forEach(milestone => {
        if (scrollPercentage >= milestone && !tracked.has(milestone)) {
          tracked.add(milestone);
          trackScrollDepth(milestone.toString());
        }
      });
    }

    window.addEventListener('scroll', () => {
      requestAnimationFrame(checkScrollDepth);
    }, { passive: true });

    // Check immediately in case page loads scrolled
    checkScrollDepth();
  }

  /**
   * Set up package click tracking
   */
  function initPackageTracking() {
    // Track all package CTA buttons
    document.querySelectorAll('a[href="#"]').forEach(button => {
      const buttonText = button.textContent.trim();
      
      if (buttonText.includes('Choose') || buttonText.includes('Discuss')) {
        button.addEventListener('click', (e) => {
          let packageName = 'Unknown';
          
          if (buttonText.includes('Core')) packageName = 'Core';
          else if (buttonText.includes('Premium')) packageName = 'Premium';
          else if (buttonText.includes('Add-on')) packageName = 'Add-ons';
          
          // Determine location (top packages section vs footer CTA)
          const isInFooter = button.closest('footer') !== null;
          const location = isInFooter ? 'footer' : 'packages';
          
          trackPackageClick(packageName, location);
        });
      }
    });

    // Track "View Packages" CTAs
    document.querySelectorAll('a[href="#packages"]').forEach(button => {
      button.addEventListener('click', () => {
        console.log('[Analytics] View Packages CTA clicked');
      });
    });
  }

  /**
   * Set up example link tracking
   */
  function initExampleTracking() {
    document.querySelectorAll('a[href^="/examples/greenroot"]').forEach(link => {
      link.addEventListener('click', () => {
        const href = link.getAttribute('href');
        let exampleName = 'Unknown';
        
        if (href.includes('/starter')) exampleName = 'Starter';
        else if (href.includes('/standard')) exampleName = 'Standard';
        else if (href === '/examples/greenroot' || href === '/examples/greenroot/') exampleName = 'Compare';
        
        trackExampleView(exampleName);
      });
    });
  }

  /**
   * Set up checklist download tracking (V3 only)
   */
  function initChecklistTracking() {
    // Look for checklist form submission
    const checklistForm = document.querySelector('form');
    if (checklistForm && variant === 'V3') {
      checklistForm.addEventListener('submit', (e) => {
        trackChecklistDownload();
      });
    }
  }

  /**
   * Initialize all tracking
   */
  function init() {
    console.log('[Analytics] Initializing tracking for variant:', variant);
    
    initScrollTracking();
    initPackageTracking();
    initExampleTracking();
    initChecklistTracking();
    
    console.log('[Analytics] All tracking initialized');
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual testing
  window.validationTracking = {
    trackPackageClick,
    trackExampleView,
    trackScrollDepth,
    trackChecklistDownload,
    getCurrentVariant: () => variant
  };

  console.log('[Analytics] Manual tracking: window.validationTracking');
})();


