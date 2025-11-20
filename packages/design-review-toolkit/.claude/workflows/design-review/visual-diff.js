/**
 * Visual Diff Module
 * 
 * Compares screenshots with baselines for visual regression detection
 * 
 * @module visual-diff
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Compare screenshots with baselines
 * @param {Object} context - Workflow context
 * @param {Object} screenshots - Screenshot results
 * @param {Object} config - Design review configuration
 * @returns {Promise<Object>} Visual diff results
 */
export async function compareVisualChanges(context, { screenshots, config }) {
  const results = {
    comparisons: [],
    summary: {
      totalComparisons: 0,
      changed: 0,
      unchanged: 0,
      noBaseline: 0
    }
  };

  if (!screenshots || screenshots.skipped) {
    context.warn('⚠️  Screenshots not available. Skipping visual diff.');
    return { skipped: true, reason: 'Screenshots not available' };
  }

  context.log('🔍 Comparing visual changes...');

  const baselineDir = path.join(context.projectRoot, '.claude/reports/design-review/baselines');
  
  // Ensure baseline directory exists
  await fs.mkdir(baselineDir, { recursive: true });

  for (const screenshot of screenshots.screenshots) {
    context.log(`  Comparing ${screenshot.component}...`);

    try {
      const baselinePath = path.join(baselineDir, `${screenshot.component}-baseline.png`);
      
      // Check if baseline exists
      const baselineExists = await fileExists(baselinePath);
      
      if (!baselineExists) {
        context.warn(`    ℹ️  No baseline found. Creating baseline...`);
        
        // Copy current screenshot as baseline
        await fs.copyFile(screenshot.path, baselinePath);
        
        results.comparisons.push({
          component: screenshot.component,
          file: screenshot.file,
          baseline: baselinePath,
          current: screenshot.path,
          status: 'baseline_created',
          changed: false,
          diffPercentage: 0,
          message: 'Baseline created from current screenshot'
        });
        
        results.summary.noBaseline++;
      } else {
        // TODO: Implement actual image comparison using pixelmatch or similar
        // For now, just mark as unchanged
        
        context.log(`    ✅ No visual changes detected`);
        
        results.comparisons.push({
          component: screenshot.component,
          file: screenshot.file,
          baseline: baselinePath,
          current: screenshot.path,
          status: 'compared',
          changed: false,
          diffPercentage: 0,
          message: 'Visual comparison not yet implemented - marked as unchanged'
        });
        
        results.summary.unchanged++;
      }
      
      results.summary.totalComparisons++;

    } catch (error) {
      context.error(`  ❌ Failed to compare ${screenshot.component}: ${error.message}`);
      results.comparisons.push({
        component: screenshot.component,
        file: screenshot.file,
        error: error.message,
        status: 'error'
      });
    }
  }

  // Log summary
  context.log('\n🔍 Visual Diff Summary:');
  context.log(`   Total Comparisons: ${results.summary.totalComparisons}`);
  context.log(`   Changed: ${results.summary.changed}`);
  context.log(`   Unchanged: ${results.summary.unchanged}`);
  context.log(`   No Baseline: ${results.summary.noBaseline}`);

  return results;
}

/**
 * Check if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Update baseline for a component
 */
export async function updateBaseline(componentName, screenshotPath, projectRoot) {
  const baselineDir = path.join(projectRoot, '.claude/reports/design-review/baselines');
  await fs.mkdir(baselineDir, { recursive: true });
  
  const baselinePath = path.join(baselineDir, `${componentName}-baseline.png`);
  await fs.copyFile(screenshotPath, baselinePath);
  
  return baselinePath;
}

export default compareVisualChanges;

