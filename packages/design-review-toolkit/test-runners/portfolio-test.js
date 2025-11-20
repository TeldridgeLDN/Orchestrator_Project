#!/usr/bin/env node
/**
 * Portfolio-Redesign Design Review Test Script
 * 
 * Tests the marketing-site template validators on http://localhost:4321/validate/
 * 
 * Usage: node test-portfolio-design-review.js
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const configPath = path.join(__dirname, 'portfolio-redesign/.claude/design-review.json');
const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

// Import validators
const conversionCheck = await import('./.claude/design-review/extensions/marketing/conversion-check.js');
const copyQualityCheck = await import('./.claude/design-review/extensions/marketing/copy-quality.js');
const trustSignalsCheck = await import('./.claude/design-review/extensions/marketing/trust-signals.js');

// Import existing workflow modules
const accessibilityAudit = await import('./.claude/workflows/design-review/accessibility-audit.js');
const captureScreenshots = await import('./.claude/workflows/design-review/capture-screenshots.js');
const visualDiff = await import('./.claude/workflows/design-review/visual-diff.js');
const designConsistency = await import('./.claude/workflows/design-review/design-consistency.js');

const PAGE_URL = config.devServer.defaultUrl + (config.devServer.healthCheckPath || '/');

console.log('🎨 Portfolio-Redesign Design Review');
console.log('=====================================\n');
console.log(`📍 Testing URL: ${PAGE_URL}`);
console.log(`📋 Template: ${config.template}`);
console.log(`⚙️  Framework: ${config.project.framework}\n`);

async function main() {
  let browser;
  
  try {
    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();
    
    // Navigate to page
    console.log(`🌐 Navigating to ${PAGE_URL}...\n`);
    try {
      await page.goto(PAGE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (error) {
      console.error('❌ Failed to load page. Is the dev server running on port 4321?');
      console.error(`   Run: cd portfolio-redesign && npm run dev`);
      process.exit(1);
    }
    
    const results = {
      url: PAGE_URL,
      timestamp: new Date().toISOString(),
      checks: {}
    };
    
    // ==========================================
    // CHECK 1: Accessibility Audit
    // ==========================================
    if (config.checks.accessibility.enabled) {
      console.log('♿ Running Accessibility Audit (WCAG 2.1 AA)...');
      try {
        results.checks.accessibility = await accessibilityAudit.default(page, config.checks.accessibility);
        
        const summary = results.checks.accessibility.summary;
        console.log(`   Total Violations: ${summary.totalViolations}`);
        console.log(`   Critical: ${summary.criticalViolations}`);
        console.log(`   Serious: ${summary.seriousViolations}`);
        console.log(`   Passes: ${summary.totalPasses}`);
        
        if (summary.criticalViolations > 0) {
          console.log(`   🔴 ${summary.criticalViolations} critical accessibility issues found!`);
        } else if (summary.totalViolations > 0) {
          console.log(`   ⚠️  ${summary.totalViolations} accessibility issues found`);
        } else {
          console.log(`   ✅ All WCAG checks passed!`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
        results.checks.accessibility = { error: error.message };
      }
      console.log('');
    }
    
    // ==========================================
    // CHECK 2: Conversion Optimization
    // ==========================================
    if (config.checks.conversionOptimization.enabled) {
      console.log('🔄 Running Conversion Optimization Check...');
      try {
        results.checks.conversion = await conversionCheck.checkConversion(page, config.checks.conversionOptimization);
        
        const summary = results.checks.conversion.summary;
        console.log(`   Total Issues: ${summary.total}`);
        console.log(`   Critical: ${summary.critical}`);
        console.log(`   Serious: ${summary.serious}`);
        console.log(`   Warnings: ${summary.warnings}`);
        
        if (summary.critical > 0) {
          console.log(`   🔴 ${summary.critical} critical conversion issues!`);
          results.checks.conversion.issues
            .filter(i => i.severity === 'critical')
            .forEach(issue => console.log(`      - ${issue.message}`));
        } else if (summary.serious > 0) {
          console.log(`   ⚠️  ${summary.serious} serious issues found`);
        } else {
          console.log(`   ✅ Conversion optimization passed!`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
        results.checks.conversion = { error: error.message };
      }
      console.log('');
    }
    
    // ==========================================
    // CHECK 3: Copy Quality
    // ==========================================
    if (config.checks.copyQuality.enabled) {
      console.log('📝 Running Copy Quality Check...');
      try {
        results.checks.copyQuality = await copyQualityCheck.checkCopyQuality(page, config.checks.copyQuality);
        
        const summary = results.checks.copyQuality.summary;
        const measurements = results.checks.copyQuality.measurements;
        
        console.log(`   Readability Score: ${measurements.readabilityScore?.toFixed(1) || 'N/A'}`);
        console.log(`   Word Count: ${measurements.wordCount || 'N/A'}`);
        console.log(`   Total Issues: ${summary.total}`);
        console.log(`   Warnings: ${summary.warnings}`);
        console.log(`   Suggestions: ${summary.suggestions}`);
        
        if (measurements.jargonWords && measurements.jargonWords.length > 0) {
          console.log(`   ⚠️  Jargon found: ${measurements.jargonWords.map(j => j.word).join(', ')}`);
        }
        
        if (measurements.ctaTexts && measurements.ctaTexts.length > 0) {
          console.log(`   CTAs found: ${measurements.ctaTexts.length}`);
        }
        
        if (summary.warnings === 0 && summary.suggestions === 0) {
          console.log(`   ✅ Copy quality excellent!`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
        results.checks.copyQuality = { error: error.message };
      }
      console.log('');
    }
    
    // ==========================================
    // CHECK 4: Trust Signals
    // ==========================================
    if (config.checks.trustSignals.enabled) {
      console.log('🔐 Running Trust Signals Check...');
      try {
        results.checks.trustSignals = await trustSignalsCheck.checkTrustSignals(page, config.checks.trustSignals);
        
        const summary = results.checks.trustSignals.summary;
        const measurements = results.checks.trustSignals.measurements;
        
        console.log(`   Testimonials Found: ${measurements.testimonialsFound || 0}`);
        console.log(`   Total Issues: ${summary.total}`);
        console.log(`   Critical: ${summary.critical}`);
        console.log(`   Warnings: ${summary.warnings}`);
        
        if (summary.critical > 0) {
          console.log(`   🔴 ${summary.critical} critical trust issues!`);
          results.checks.trustSignals.issues
            .filter(i => i.severity === 'critical')
            .forEach(issue => console.log(`      - ${issue.message}`));
        } else if (measurements.testimonialsFound >= config.checks.trustSignals.requirements.minTestimonials) {
          console.log(`   ✅ Trust signals strong!`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
        results.checks.trustSignals = { error: error.message };
      }
      console.log('');
    }
    
    // ==========================================
    // CHECK 5: Screenshot Capture
    // ==========================================
    console.log('📸 Capturing Screenshots...');
    try {
      const screenshotPath = path.join(__dirname, 'portfolio-redesign/.claude/reports/design-review/screenshots');
      await fs.mkdir(screenshotPath, { recursive: true });
      
      const timestamp = Date.now();
      const filename = `validate-page-${timestamp}.png`;
      const fullPath = path.join(screenshotPath, filename);
      
      await page.screenshot({ path: fullPath, fullPage: true });
      results.screenshot = fullPath;
      
      console.log(`   ✅ Screenshot saved: ${filename}`);
    } catch (error) {
      console.log(`   ⚠️  Error: ${error.message}`);
    }
    console.log('');
    
    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('=====================================');
    console.log('📊 DESIGN REVIEW SUMMARY\n');
    
    const allIssues = [];
    
    if (results.checks.accessibility) {
      const a11y = results.checks.accessibility;
      if (a11y.summary) {
        console.log(`♿ Accessibility: ${a11y.summary.totalViolations} violations (${a11y.summary.criticalViolations} critical)`);
        if (a11y.summary.totalViolations > 0) {
          allIssues.push(...(a11y.components[0]?.violations || []).map(v => ({
            category: 'Accessibility',
            severity: v.impact,
            message: v.description,
            help: v.help
          })));
        }
      }
    }
    
    if (results.checks.conversion) {
      const conv = results.checks.conversion;
      if (conv.summary) {
        console.log(`🔄 Conversion: ${conv.summary.total} issues (${conv.summary.critical} critical)`);
        allIssues.push(...conv.issues.map(i => ({
          category: 'Conversion',
          severity: i.severity,
          message: i.message,
          recommendation: i.recommendation
        })));
      }
    }
    
    if (results.checks.copyQuality) {
      const copy = results.checks.copyQuality;
      if (copy.summary) {
        console.log(`📝 Copy Quality: ${copy.summary.total} issues (Score: ${copy.measurements.readabilityScore?.toFixed(1) || 'N/A'})`);
        allIssues.push(...copy.issues.map(i => ({
          category: 'Copy Quality',
          severity: i.severity,
          message: i.message,
          recommendation: i.recommendation
        })));
      }
    }
    
    if (results.checks.trustSignals) {
      const trust = results.checks.trustSignals;
      if (trust.summary) {
        console.log(`🔐 Trust Signals: ${trust.summary.total} issues (${trust.summary.critical} critical)`);
        allIssues.push(...trust.issues.map(i => ({
          category: 'Trust Signals',
          severity: i.severity,
          message: i.message,
          recommendation: i.recommendation
        })));
      }
    }
    
    console.log('');
    
    // Overall status
    const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
    const seriousCount = allIssues.filter(i => i.severity === 'serious').length;
    
    if (criticalCount > 0) {
      console.log(`🔴 Status: CRITICAL - ${criticalCount} blocking issues found`);
    } else if (seriousCount > 0) {
      console.log(`⚠️  Status: WARNINGS - ${seriousCount} serious issues found`);
    } else if (allIssues.length > 0) {
      console.log(`💡 Status: SUGGESTIONS - ${allIssues.length} improvements recommended`);
    } else {
      console.log(`✅ Status: EXCELLENT - No issues found!`);
    }
    
    console.log('');
    
    // Show top 5 critical/serious issues
    const topIssues = allIssues
      .filter(i => ['critical', 'serious'].includes(i.severity))
      .slice(0, 5);
    
    if (topIssues.length > 0) {
      console.log('🔍 Top Issues to Address:\n');
      topIssues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.category}] ${issue.message}`);
        if (issue.recommendation) {
          console.log(`   💡 ${issue.recommendation.split('\n')[0]}`);
        }
        console.log('');
      });
    }
    
    // Save full report
    const reportPath = path.join(__dirname, 'portfolio-redesign/.claude/reports/design-review');
    await fs.mkdir(reportPath, { recursive: true });
    
    const reportFile = path.join(reportPath, `review-${Date.now()}.json`);
    await fs.writeFile(reportFile, JSON.stringify(results, null, 2));
    
    console.log(`📄 Full report saved: ${path.relative(__dirname, reportFile)}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Design review failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

main();

