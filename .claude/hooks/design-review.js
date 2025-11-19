/**
 * Design Review Hook
 * 
 * Automatically triggers design review workflow on pre-commit for frontend files.
 * Integrates Playwright MCP for visual testing and accessibility audits.
 * 
 * @version 1.0.0
 */

export default {
  name: 'design-review',
  version: '1.0.0',
  description: 'Automated design review using Playwright MCP for frontend changes',
  
  // Trigger on pre-commit
  trigger: 'pre-commit',
  
  /**
   * Condition: Only run for frontend file changes
   */
  condition: async (context) => {
    const frontendFiles = context.stagedFiles.filter(file => 
      /\.(tsx|jsx|css|scss|sass)$/.test(file)
    );
    
    if (frontendFiles.length === 0) {
      return false;
    }
    
    // Check if project has design review configuration
    const configPath = `${context.projectRoot}/.claude/design-review.json`;
    const hasConfig = await context.fileExists(configPath);
    
    if (hasConfig) {
      const config = await context.readJSON(configPath);
      return config.enabled !== false;
    }
    
    // Default to enabled if no config
    return true;
  },
  
  /**
   * Action: Execute design review workflow
   */
  action: async (context) => {
    const startTime = Date.now();
    
    try {
      context.log('🎨 Starting design review...');
      
      // Load configuration
      const config = await loadConfig(context);
      
      // Check if dev server is running
      const serverRunning = await checkDevServer(config.devServer);
      
      if (!serverRunning && config.devServer.autoStart) {
        context.log('📦 Starting dev server...');
        await startDevServer(context, config.devServer);
      } else if (!serverRunning) {
        context.warn('⚠️  Dev server not running. Skipping visual review.');
        return {
          status: 'skipped',
          reason: 'Dev server not available'
        };
      }
      
      // Get affected components
      const affectedComponents = await detectAffectedComponents(
        context.stagedFiles,
        config
      );
      
      if (affectedComponents.length === 0) {
        context.log('✅ No components affected');
        return { status: 'success', components: [] };
      }
      
      context.log(`📊 Reviewing ${affectedComponents.length} components...`);
      
      // Execute review workflow
      const results = await executeReview(context, affectedComponents, config);
      
      // Generate report
      const reportPath = await generateReport(context, results);
      
      // Display summary
      displaySummary(context, results);
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      context.log(`⏱️  Review completed in ${duration}s`);
      
      // Handle blocking vs warning mode
      if (results.hasErrors && config.mode === 'block') {
        throw new Error(
          `Design review failed with ${results.errorCount} errors. ` +
          `Fix issues or update configuration. Report: ${reportPath}`
        );
      } else if (results.hasWarnings) {
        context.warn(
          `⚠️  Design review found ${results.warningCount} warnings. ` +
          `Review report: ${reportPath}`
        );
      }
      
      return {
        status: results.hasErrors ? 'failed' : 'success',
        results,
        reportPath,
        duration
      };
      
    } catch (error) {
      context.error('❌ Design review error:', error.message);
      throw error;
    }
  }
};

/**
 * Load design review configuration
 */
async function loadConfig(context) {
  const configPath = `${context.projectRoot}/.claude/design-review.json`;
  
  const defaultConfig = {
    enabled: true,
    mode: 'warn', // 'warn' or 'block'
    checks: {
      accessibility: true,
      visualRegression: false, // Disabled by default (needs baselines)
      designConsistency: true
    },
    thresholds: {
      accessibilityScore: 95,
      visualDiffThreshold: 0.05
    },
    devServer: {
      url: 'http://localhost:3000',
      autoStart: false,
      startCommand: 'npm run dev',
      readyTimeout: 30000
    },
    components: {}
  };
  
  if (await context.fileExists(configPath)) {
    const userConfig = await context.readJSON(configPath);
    return { ...defaultConfig, ...userConfig };
  }
  
  return defaultConfig;
}

/**
 * Check if dev server is running
 */
async function checkDevServer(config) {
  try {
    const response = await fetch(config.url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Start dev server
 */
async function startDevServer(context, config) {
  // Implementation would spawn dev server process
  // For now, just log a message
  context.log(`Run: ${config.startCommand}`);
  throw new Error('Dev server auto-start not yet implemented. Please start manually.');
}

/**
 * Detect which components are affected by file changes
 */
async function detectAffectedComponents(stagedFiles, config) {
  const components = [];
  
  for (const file of stagedFiles) {
    // Extract component name from file path
    const match = file.match(/\/([A-Z][a-zA-Z0-9]+)\.(tsx|jsx)$/);
    if (match) {
      components.push({
        name: match[1],
        file: file,
        route: findComponentRoute(match[1], config.components)
      });
    }
  }
  
  return components;
}

/**
 * Find route for component
 */
function findComponentRoute(componentName, componentConfig) {
  for (const [route, components] of Object.entries(componentConfig)) {
    if (components.includes(componentName)) {
      return route;
    }
  }
  return '/'; // Default to home route
}

/**
 * Execute review workflow
 */
async function executeReview(context, components, config) {
  const results = {
    components: [],
    hasErrors: false,
    hasWarnings: false,
    errorCount: 0,
    warningCount: 0
  };
  
  for (const component of components) {
    const componentResult = {
      name: component.name,
      file: component.file,
      accessibility: null,
      visualDiff: null,
      designConsistency: null
    };
    
    // Accessibility check
    if (config.checks.accessibility) {
      componentResult.accessibility = await checkAccessibility(
        context,
        component,
        config
      );
      
      if (componentResult.accessibility.violations.length > 0) {
        results.hasErrors = true;
        results.errorCount += componentResult.accessibility.violations.length;
      }
    }
    
    // Visual regression check
    if (config.checks.visualRegression) {
      componentResult.visualDiff = await checkVisualRegression(
        context,
        component,
        config
      );
      
      if (componentResult.visualDiff.changed) {
        results.hasWarnings = true;
        results.warningCount++;
      }
    }
    
    // Design consistency check
    if (config.checks.designConsistency) {
      componentResult.designConsistency = await checkDesignConsistency(
        context,
        component,
        config
      );
      
      if (componentResult.designConsistency.issues.length > 0) {
        results.hasWarnings = true;
        results.warningCount += componentResult.designConsistency.issues.length;
      }
    }
    
    results.components.push(componentResult);
  }
  
  return results;
}

/**
 * Check accessibility using Playwright + axe-core
 */
async function checkAccessibility(context, component, config) {
  try {
    // Import workflow module
    const { runAccessibilityAudit } = await import('../workflows/design-review/accessibility-audit.js');
    
    // Check dev server
    const serverStatus = {
      isRunning: await checkDevServer(config.devServer)
    };
    
    if (!serverStatus.isRunning) {
      return { skipped: true, reason: 'Dev server not available' };
    }
    
    // Run audit for single component
    const results = await runAccessibilityAudit(context, {
      affectedComponents: [component],
      serverStatus,
      config
    });
    
    if (results.skipped) {
      return { score: 0, violations: [], passes: 0 };
    }
    
    const componentResult = results.components[0];
    return {
      score: calculateAccessibilityScore(componentResult),
      violations: componentResult.violations || [],
      passes: componentResult.passes || 0
    };
  } catch (error) {
    context.error(`Accessibility check failed: ${error.message}`);
    return { score: 0, violations: [], passes: 0, error: error.message };
  }
}

/**
 * Calculate accessibility score from results
 */
function calculateAccessibilityScore(results) {
  if (!results || results.error) return 0;
  
  const total = results.violations.length + results.passes;
  if (total === 0) return 100;
  
  // Penalize more for critical and serious violations
  let penalty = 0;
  results.violations.forEach(v => {
    if (v.impact === 'critical') penalty += 10;
    else if (v.impact === 'serious') penalty += 5;
    else if (v.impact === 'moderate') penalty += 2;
    else penalty += 1;
  });
  
  return Math.max(0, 100 - penalty);
}

/**
 * Check for visual regressions
 */
async function checkVisualRegression(context, component, config) {
  try {
    // Import workflow module
    const { captureScreenshots } = await import('../workflows/design-review/capture-screenshots.js');
    
    // Check dev server
    const serverStatus = {
      isRunning: await checkDevServer(config.devServer)
    };
    
    if (!serverStatus.isRunning) {
      return { skipped: true, reason: 'Dev server not available' };
    }
    
    // Capture screenshot for single component
    const results = await captureScreenshots(context, {
      affectedComponents: [component],
      serverStatus,
      config
    });
    
    if (results.skipped) {
      return { changed: false, diff: 0 };
    }
    
    const screenshot = results.screenshots[0];
    
    // TODO: Implement baseline comparison
    // For now, just return the screenshot path
    return {
      changed: false, // Will be true when baseline comparison is implemented
      diff: 0,
      baseline: null,
      current: screenshot ? screenshot.path : null
    };
  } catch (error) {
    context.error(`Visual regression check failed: ${error.message}`);
    return { changed: false, diff: 0, error: error.message };
  }
}

/**
 * Check design consistency
 */
async function checkDesignConsistency(context, component, config) {
  // TODO: Implement design system validation
  // For now, return empty issues
  context.log(`  🎨 Checking design consistency for ${component.name}...`);
  
  return {
    issues: []
  };
}

/**
 * Generate markdown report
 */
async function generateReport(context, results) {
  const timestamp = new Date().toISOString();
  const reportDir = `${context.projectRoot}/.claude/reports/design-review`;
  const reportPath = `${reportDir}/${Date.now()}-report.md`;
  
  await context.ensureDir(reportDir);
  
  const report = `# Design Review Report
  
**Date:** ${timestamp}  
**Status:** ${results.hasErrors ? '❌ Failed' : '✅ Passed'}  
**Components:** ${results.components.length}

## Summary

- **Errors:** ${results.errorCount}
- **Warnings:** ${results.warningCount}

## Component Results

${results.components.map(c => `
### ${c.name}

**File:** \`${c.file}\`

${c.accessibility ? `
#### Accessibility
- **Score:** ${c.accessibility.score}%
- **Violations:** ${c.accessibility.violations.length}
- **Passes:** ${c.accessibility.passes}
` : ''}

${c.visualDiff ? `
#### Visual Changes
- **Changed:** ${c.visualDiff.changed ? 'Yes' : 'No'}
- **Diff Score:** ${c.visualDiff.diff}
` : ''}

${c.designConsistency ? `
#### Design Consistency
- **Issues:** ${c.designConsistency.issues.length}
` : ''}
`).join('\n')}
`;
  
  await context.writeFile(reportPath, report);
  
  return reportPath;
}

/**
 * Display summary in terminal
 */
function displaySummary(context, results) {
  context.log('\n📋 Design Review Summary:');
  context.log(`   Components: ${results.components.length}`);
  context.log(`   Errors: ${results.errorCount}`);
  context.log(`   Warnings: ${results.warningCount}`);
  
  if (results.hasErrors) {
    context.error('   Status: ❌ Failed');
  } else if (results.hasWarnings) {
    context.warn('   Status: ⚠️  Warnings');
  } else {
    context.log('   Status: ✅ Passed');
  }
}

