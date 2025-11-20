/**
 * A/B Test Variant Assignment Logic
 * Task 128.1 - Validation Landing Pages Test
 * 
 * Test Setup:
 * - Variant A (V1): Simplified Professional (25%)
 * - Variant B (V2): Simplified Problem-Focused (25%)
 * - Variant C (V3): Comprehensive + Authentic (50%)
 */

(function() {
  'use strict';

  const VARIANTS = {
    v1: { path: '/validate/', weight: 25, name: 'V1 - Simplified Professional' },
    v2: { path: '/validate-v2/', weight: 25, name: 'V2 - Simplified Problem-Focused' },
    v3: { path: '/validate-v3/', weight: 50, name: 'V3 - Comprehensive' }
  };

  const STORAGE_KEY = 'validation_variant';
  const STORAGE_TIMESTAMP_KEY = 'validation_variant_timestamp';
  const VARIANT_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  /**
   * Get variant from URL parameter (?variant=v1/v2/v3)
   */
  function getVariantFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const variant = urlParams.get('variant');
    
    if (variant && VARIANTS[variant]) {
      console.log('[A/B Test] Variant from URL:', variant);
      return variant;
    }
    
    return null;
  }

  /**
   * Get variant from localStorage (for returning visitors)
   */
  function getVariantFromStorage() {
    try {
      const storedVariant = localStorage.getItem(STORAGE_KEY);
      const storedTimestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
      
      if (storedVariant && storedTimestamp) {
        const age = Date.now() - parseInt(storedTimestamp, 10);
        
        // Check if stored variant is still valid (within 30 days)
        if (age < VARIANT_DURATION && VARIANTS[storedVariant]) {
          console.log('[A/B Test] Variant from storage:', storedVariant, `(${Math.floor(age / (24 * 60 * 60 * 1000))} days old)`);
          return storedVariant;
        } else {
          console.log('[A/B Test] Stored variant expired, reassigning...');
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        }
      }
    } catch (e) {
      console.warn('[A/B Test] localStorage not available:', e);
    }
    
    return null;
  }

  /**
   * Assign random variant based on weighted distribution (50/25/25)
   */
  function assignRandomVariant() {
    const random = Math.random() * 100; // 0-100
    let cumulative = 0;
    
    for (const [variantKey, variantData] of Object.entries(VARIANTS)) {
      cumulative += variantData.weight;
      if (random < cumulative) {
        console.log('[A/B Test] Assigned random variant:', variantKey, `(roll: ${random.toFixed(2)}, threshold: ${cumulative})`);
        return variantKey;
      }
    }
    
    // Fallback to V3 (should never reach here)
    console.log('[A/B Test] Fallback to V3');
    return 'v3';
  }

  /**
   * Save variant to localStorage
   */
  function saveVariantToStorage(variant) {
    try {
      localStorage.setItem(STORAGE_KEY, variant);
      localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
      console.log('[A/B Test] Saved variant to storage:', variant);
    } catch (e) {
      console.warn('[A/B Test] Could not save to localStorage:', e);
    }
  }

  /**
   * Track variant assignment in analytics (Plausible placeholder)
   */
  function trackVariantAssignment(variant, source) {
    console.log('[A/B Test] Tracking variant assignment:', { variant, source });
    
    // TODO: Uncomment when Plausible is set up
    // if (window.plausible) {
    //   window.plausible('Variant_Assigned', {
    //     props: {
    //       variant: variant.toUpperCase(),
    //       source: source, // 'url', 'storage', or 'random'
    //       name: VARIANTS[variant].name
    //     }
    //   });
    // }
  }

  /**
   * Main variant assignment logic
   */
  function assignVariant() {
    let variant = null;
    let source = null;

    // Priority 1: Check URL parameter (allows manual testing)
    variant = getVariantFromURL();
    if (variant) {
      source = 'url';
      saveVariantToStorage(variant);
      trackVariantAssignment(variant, source);
      return { variant, source };
    }

    // Priority 2: Check localStorage (returning visitor)
    variant = getVariantFromStorage();
    if (variant) {
      source = 'storage';
      trackVariantAssignment(variant, source);
      return { variant, source };
    }

    // Priority 3: Assign random variant (new visitor)
    variant = assignRandomVariant();
    source = 'random';
    saveVariantToStorage(variant);
    trackVariantAssignment(variant, source);
    
    return { variant, source };
  }

  /**
   * Redirect to assigned variant page
   */
  function redirectToVariant(variant) {
    const currentPath = window.location.pathname;
    const targetPath = VARIANTS[variant].path;

    // Don't redirect if already on the correct variant page
    if (currentPath === targetPath) {
      console.log('[A/B Test] Already on correct variant page:', targetPath);
      return;
    }

    // Don't redirect if on a specific variant page (V1, V2, or V3)
    // This prevents redirect loops when accessing pages directly
    const isOnVariantPage = Object.values(VARIANTS).some(v => currentPath === v.path);
    if (isOnVariantPage && !getVariantFromURL()) {
      console.log('[A/B Test] On specific variant page, not redirecting');
      return;
    }

    console.log('[A/B Test] Redirecting to:', targetPath);
    window.location.href = targetPath;
  }

  /**
   * Initialize A/B test
   */
  function init() {
    console.log('[A/B Test] Initializing variant assignment...');
    const { variant, source } = assignVariant();
    console.log('[A/B Test] Final assignment:', { variant, source, name: VARIANTS[variant].name });
    
    // Only redirect if on the test entry page (/validate-test/)
    if (window.location.pathname === '/validate-test/' || window.location.pathname === '/validate-test') {
      redirectToVariant(variant);
    }
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose utility for debugging in console
  window.variantTest = {
    getCurrentVariant: () => localStorage.getItem(STORAGE_KEY),
    clearVariant: () => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
      console.log('[A/B Test] Variant cleared from storage');
    },
    setVariant: (variant) => {
      if (VARIANTS[variant]) {
        saveVariantToStorage(variant);
        console.log('[A/B Test] Variant manually set to:', variant);
        window.location.href = VARIANTS[variant].path;
      } else {
        console.error('[A/B Test] Invalid variant:', variant);
      }
    },
    info: () => {
      const current = localStorage.getItem(STORAGE_KEY);
      const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
      console.log('[A/B Test] Current variant:', current);
      if (timestamp) {
        const age = Math.floor((Date.now() - parseInt(timestamp, 10)) / (24 * 60 * 60 * 1000));
        console.log('[A/B Test] Assigned:', age, 'days ago');
      }
      console.log('[A/B Test] Weights:', VARIANTS);
    }
  };

  console.log('[A/B Test] Debug utilities available: window.variantTest.info(), .clearVariant(), .setVariant(v1/v2/v3)');
})();


