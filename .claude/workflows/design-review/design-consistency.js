/**
 * Design Consistency Check Module
 * 
 * Validates components against design system principles
 * 
 * @module design-consistency
 */

/**
 * Design system rules
 */
const DESIGN_SYSTEM = {
  colors: {
    primary: ['#0066cc', '#0052a3', '#003d7a'],
    secondary: ['#6c757d', '#545b62'],
    success: ['#28a745', '#218838'],
    danger: ['#dc3545', '#c82333'],
    warning: ['#ffc107', '#e0a800'],
    info: ['#17a2b8', '#138496']
  },
  typography: {
    fontFamilies: [
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif'
    ],
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  spacing: {
    baseUnit: 8,
    scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128]
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
};

/**
 * Check design consistency of components
 * @param {Object} context - Workflow context
 * @param {Array} screenshots - Screenshot results
 * @param {Object} config - Design review configuration
 * @returns {Promise<Object>} Design consistency results
 */
export async function checkDesignConsistency(context, { screenshots, config }) {
  const results = {
    components: [],
    summary: {
      totalIssues: 0,
      criticalIssues: 0,
      suggestions: 0
    }
  };

  if (!screenshots || screenshots.skipped) {
    context.warn('⚠️  Screenshots not available. Skipping design consistency check.');
    return { skipped: true, reason: 'Screenshots not available' };
  }

  context.log('🎨 Checking design consistency...');

  for (const screenshot of screenshots.screenshots) {
    context.log(`  Analyzing ${screenshot.component}...`);

    try {
      // Analyze screenshot for design patterns
      const issues = [];
      
      // Check 1: Component naming conventions
      const namingIssues = checkNamingConventions(screenshot.component);
      issues.push(...namingIssues);
      
      // Check 2: File organization
      const orgIssues = checkFileOrganization(screenshot.file);
      issues.push(...orgIssues);
      
      // Check 3: Color validation (if color info available)
      if (screenshot.metadata?.colors) {
        const colorIssues = validateColors(screenshot.metadata.colors, context);
        issues.push(...colorIssues);
      }
      
      // Check 4: Typography validation (if typography info available)
      if (screenshot.metadata?.typography) {
        const typographyIssues = validateTypography(screenshot.metadata.typography, context);
        issues.push(...typographyIssues);
      }
      
      // Check 5: Spacing validation (if spacing info available)
      if (screenshot.metadata?.spacing) {
        const spacingIssues = validateSpacing(screenshot.metadata.spacing, context);
        issues.push(...spacingIssues);
      }
      
      // Check 6: Component patterns (basic file-based analysis)
      const patternIssues = validateComponentPatterns(screenshot.file, screenshot.component, context);
      issues.push(...patternIssues);
      
      const componentResults = {
        name: screenshot.component,
        file: screenshot.file,
        screenshot: screenshot.path,
        issues: issues,
        timestamp: new Date().toISOString()
      };

      // Update summary
      results.summary.totalIssues += issues.length;
      results.summary.criticalIssues += issues.filter(i => i.severity === 'critical').length;
      results.summary.suggestions += issues.filter(i => i.severity === 'suggestion').length;

      results.components.push(componentResults);

      if (issues.length > 0) {
        context.warn(`    ⚠️  ${issues.length} design issue(s) found`);
      } else {
        context.log(`    ✅ No design issues found`);
      }

    } catch (error) {
      context.error(`  ❌ Failed to analyze ${screenshot.component}: ${error.message}`);
      results.components.push({
        name: screenshot.component,
        file: screenshot.file,
        error: error.message,
        issues: []
      });
    }
  }

  // Log summary
  context.log('\n🎨 Design Consistency Summary:');
  context.log(`   Total Issues: ${results.summary.totalIssues}`);
  context.log(`   Critical: ${results.summary.criticalIssues}`);
  context.log(`   Suggestions: ${results.summary.suggestions}`);

  return results;
}

/**
 * Check naming conventions
 */
function checkNamingConventions(componentName) {
  const issues = [];
  
  // Should be PascalCase
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(componentName)) {
    issues.push({
      type: 'naming',
      severity: 'warning',
      message: `Component name "${componentName}" should be PascalCase`,
      suggestion: 'Use PascalCase for React component names (e.g., MyComponent)'
    });
  }
  
  // Should not be too generic
  const genericNames = ['Component', 'Wrapper', 'Container', 'Element', 'Item'];
  if (genericNames.includes(componentName)) {
    issues.push({
      type: 'naming',
      severity: 'suggestion',
      message: `Component name "${componentName}" is too generic`,
      suggestion: 'Use descriptive names that indicate the component\'s purpose'
    });
  }
  
  return issues;
}

/**
 * Check file organization
 */
function checkFileOrganization(filePath) {
  const issues = [];
  
  // Extract component name from file path
  const fileName = filePath.split('/').pop().replace(/\.(tsx|jsx)$/, '');
  
  // Check if component is in appropriate directory
  if (!filePath.includes('/components/') && !filePath.includes('/pages/')) {
    issues.push({
      type: 'organization',
      severity: 'suggestion',
      message: `Component file should be in /components or /pages directory`,
      suggestion: 'Organize components in dedicated directories for better maintainability'
    });
  }
  
  // Check for index files (might be barrel exports)
  if (fileName === 'index') {
    issues.push({
      type: 'organization',
      severity: 'info',
      message: 'Using index files as barrel exports',
      suggestion: 'Consider named exports for better IDE support'
    });
  }
  
  return issues;
}

/**
 * Validate colors against design system palette
 * @param {Array} colors - Array of color values used in component
 * @param {Object} context - Workflow context for logging
 * @returns {Array} Array of color validation issues
 */
function validateColors(colors, context) {
  const issues = [];
  const designSystemColors = Object.values(DESIGN_SYSTEM.colors).flat();
  
  for (const color of colors) {
    const normalizedColor = color.toLowerCase();
    
    // Check if color is in design system
    const isInDesignSystem = designSystemColors.some(
      dsColor => dsColor.toLowerCase() === normalizedColor
    );
    
    if (!isInDesignSystem) {
      // Check if it's close to a design system color (within 10% similarity)
      const closestColor = findClosestColor(normalizedColor, designSystemColors);
      
      if (closestColor.similarity > 0.9) {
        issues.push({
          type: 'color',
          severity: 'warning',
          message: `Color "${color}" is close to design system color "${closestColor.color}"`,
          suggestion: `Consider using design system color: ${closestColor.color}`,
          actual: color,
          expected: closestColor.color
        });
      } else if (closestColor.similarity > 0.7) {
        issues.push({
          type: 'color',
          severity: 'suggestion',
          message: `Color "${color}" may not be from the design system`,
          suggestion: `Consider using a design system color. Closest match: ${closestColor.color}`,
          actual: color,
          expected: closestColor.color
        });
      }
    }
  }
  
  return issues;
}

/**
 * Validate typography against design system specifications
 * @param {Object} typography - Typography information from component
 * @param {Object} context - Workflow context for logging
 * @returns {Array} Array of typography validation issues
 */
function validateTypography(typography, context) {
  const issues = [];
  const { fontFamilies, fontSizes, fontWeights } = DESIGN_SYSTEM.typography;
  
  // Validate font family
  if (typography.fontFamily) {
    const usedFont = typography.fontFamily.toLowerCase();
    const isValidFont = fontFamilies.some(
      font => usedFont.includes(font.toLowerCase())
    );
    
    if (!isValidFont) {
      issues.push({
        type: 'typography',
        severity: 'warning',
        message: `Font family "${typography.fontFamily}" not in design system`,
        suggestion: `Use system font stack: ${fontFamilies.slice(0, 3).join(', ')}`,
        actual: typography.fontFamily,
        expected: fontFamilies[0]
      });
    }
  }
  
  // Validate font size
  if (typography.fontSize) {
    const sizeValues = Object.values(fontSizes);
    const isValidSize = sizeValues.includes(typography.fontSize);
    
    if (!isValidSize) {
      const closestSize = findClosestFontSize(typography.fontSize, fontSizes);
      issues.push({
        type: 'typography',
        severity: 'suggestion',
        message: `Font size "${typography.fontSize}" not in design system scale`,
        suggestion: `Consider using design system size: ${closestSize.name} (${closestSize.value})`,
        actual: typography.fontSize,
        expected: closestSize.value
      });
    }
  }
  
  // Validate font weight
  if (typography.fontWeight) {
    const weightValues = Object.values(fontWeights);
    const numericWeight = parseInt(typography.fontWeight);
    const isValidWeight = weightValues.includes(numericWeight);
    
    if (!isValidWeight && !isNaN(numericWeight)) {
      const closestWeight = findClosestValue(numericWeight, weightValues);
      const weightName = Object.keys(fontWeights).find(
        key => fontWeights[key] === closestWeight
      );
      
      issues.push({
        type: 'typography',
        severity: 'suggestion',
        message: `Font weight "${typography.fontWeight}" not in design system`,
        suggestion: `Consider using design system weight: ${weightName} (${closestWeight})`,
        actual: typography.fontWeight,
        expected: closestWeight
      });
    }
  }
  
  return issues;
}

/**
 * Validate spacing against design system scale
 * @param {Object} spacing - Spacing information from component
 * @param {Object} context - Workflow context for logging
 * @returns {Array} Array of spacing validation issues
 */
function validateSpacing(spacing, context) {
  const issues = [];
  const { scale, baseUnit } = DESIGN_SYSTEM.spacing;
  
  // Check padding values
  if (spacing.padding) {
    for (const [side, value] of Object.entries(spacing.padding)) {
      const numericValue = parseSpacingValue(value);
      if (numericValue !== null && !scale.includes(numericValue)) {
        const closest = findClosestValue(numericValue, scale);
        issues.push({
          type: 'spacing',
          severity: 'suggestion',
          message: `Padding-${side} value "${value}" not on spacing scale`,
          suggestion: `Use spacing scale value: ${closest}px (${closest / baseUnit}x base unit)`,
          actual: value,
          expected: `${closest}px`
        });
      }
    }
  }
  
  // Check margin values
  if (spacing.margin) {
    for (const [side, value] of Object.entries(spacing.margin)) {
      const numericValue = parseSpacingValue(value);
      if (numericValue !== null && !scale.includes(numericValue)) {
        const closest = findClosestValue(numericValue, scale);
        issues.push({
          type: 'spacing',
          severity: 'suggestion',
          message: `Margin-${side} value "${value}" not on spacing scale`,
          suggestion: `Use spacing scale value: ${closest}px (${closest / baseUnit}x base unit)`,
          actual: value,
          expected: `${closest}px`
        });
      }
    }
  }
  
  // Check gap values
  if (spacing.gap) {
    const numericValue = parseSpacingValue(spacing.gap);
    if (numericValue !== null && !scale.includes(numericValue)) {
      const closest = findClosestValue(numericValue, scale);
      issues.push({
        type: 'spacing',
        severity: 'suggestion',
        message: `Gap value "${spacing.gap}" not on spacing scale`,
        suggestion: `Use spacing scale value: ${closest}px (${closest / baseUnit}x base unit)`,
        actual: spacing.gap,
        expected: `${closest}px`
      });
    }
  }
  
  return issues;
}

/**
 * Validate component patterns and best practices
 * @param {string} filePath - Component file path
 * @param {string} componentName - Component name
 * @param {Object} context - Workflow context for logging
 * @returns {Array} Array of pattern validation issues
 */
function validateComponentPatterns(filePath, componentName, context) {
  const issues = [];
  
  // Check for co-location of styles
  if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
    const stylesPath = filePath.replace(/\.(tsx|jsx)$/, '.module.css');
    const scssPath = filePath.replace(/\.(tsx|jsx)$/, '.module.scss');
    
    // This is a suggestion for better organization
    issues.push({
      type: 'pattern',
      severity: 'info',
      message: 'Consider co-locating styles with component',
      suggestion: `Create ${componentName}.module.css or use CSS-in-JS for better encapsulation`
    });
  }
  
  // Check for proper component directory structure
  const pathParts = filePath.split('/');
  const componentDir = pathParts[pathParts.length - 2];
  
  if (componentDir === 'components' && pathParts.length > 2) {
    // Direct child of components folder - might want to group by feature
    issues.push({
      type: 'pattern',
      severity: 'info',
      message: 'Component is directly in /components folder',
      suggestion: 'Consider organizing components by feature or domain (e.g., /components/auth/, /components/dashboard/)'
    });
  }
  
  // Check for test file co-location
  const testPatterns = ['.test.', '.spec.'];
  const hasColocatedTest = testPatterns.some(pattern => 
    filePath.includes(pattern)
  );
  
  if (!hasColocatedTest) {
    issues.push({
      type: 'pattern',
      severity: 'info',
      message: 'No test file found near component',
      suggestion: `Create ${componentName}.test.tsx for better test maintainability`
    });
  }
  
  return issues;
}

/**
 * Helper: Find closest color from design system
 */
function findClosestColor(color, designSystemColors) {
  // Simple hex color comparison (could be enhanced with proper color distance algorithms)
  let closestColor = designSystemColors[0];
  let highestSimilarity = 0;
  
  for (const dsColor of designSystemColors) {
    const similarity = calculateColorSimilarity(color, dsColor);
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      closestColor = dsColor;
    }
  }
  
  return { color: closestColor, similarity: highestSimilarity };
}

/**
 * Helper: Calculate color similarity (0-1)
 */
function calculateColorSimilarity(color1, color2) {
  // Normalize colors
  const c1 = color1.replace('#', '').toLowerCase();
  const c2 = color2.replace('#', '').toLowerCase();
  
  if (c1 === c2) return 1.0;
  
  // Parse RGB values
  const r1 = parseInt(c1.substring(0, 2), 16);
  const g1 = parseInt(c1.substring(2, 4), 16);
  const b1 = parseInt(c1.substring(4, 6), 16);
  
  const r2 = parseInt(c2.substring(0, 2), 16);
  const g2 = parseInt(c2.substring(2, 4), 16);
  const b2 = parseInt(c2.substring(4, 6), 16);
  
  // Calculate Euclidean distance in RGB space
  const distance = Math.sqrt(
    Math.pow(r1 - r2, 2) + 
    Math.pow(g1 - g2, 2) + 
    Math.pow(b1 - b2, 2)
  );
  
  // Normalize to 0-1 (max distance in RGB is sqrt(3 * 255^2))
  const maxDistance = Math.sqrt(3 * Math.pow(255, 2));
  const similarity = 1 - (distance / maxDistance);
  
  return similarity;
}

/**
 * Helper: Find closest font size from design system
 */
function findClosestFontSize(fontSize, fontSizes) {
  const numericSize = parseFloat(fontSize);
  if (isNaN(numericSize)) return { name: 'base', value: fontSizes.base };
  
  let closestName = 'base';
  let closestValue = fontSizes.base;
  let smallestDiff = Infinity;
  
  for (const [name, value] of Object.entries(fontSizes)) {
    const numericValue = parseFloat(value);
    const diff = Math.abs(numericSize - numericValue);
    
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestName = name;
      closestValue = value;
    }
  }
  
  return { name: closestName, value: closestValue };
}

/**
 * Helper: Find closest value from an array
 */
function findClosestValue(target, values) {
  return values.reduce((prev, curr) => 
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
  );
}

/**
 * Helper: Parse spacing value to numeric (handles px, rem, etc.)
 */
function parseSpacingValue(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  
  // Remove units and parse
  const numeric = parseFloat(value.replace(/[^\d.]/g, ''));
  
  // Convert rem to px (assuming 16px base)
  if (value.includes('rem')) {
    return numeric * 16;
  }
  
  return isNaN(numeric) ? null : numeric;
}

/**
 * Get design system reference
 */
export function getDesignSystem() {
  return DESIGN_SYSTEM;
}

export default checkDesignConsistency;

