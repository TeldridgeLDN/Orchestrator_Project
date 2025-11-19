#!/usr/bin/env node

/**
 * Basic usage example for @diet103/startup-system
 * 
 * Run this from any diet103 project to verify startup systems.
 */

import { runStartupVerification, verifyPrimacyRules, findProjectRoot } from '../src/index.js';

async function main() {
  console.log('🔍 Example: Basic Startup Verification\n');
  
  // Example 1: Find project root
  console.log('1️⃣ Finding project root...');
  const projectRoot = findProjectRoot();
  console.log(`   Found: ${projectRoot}\n`);
  
  // Example 2: Run full verification (detailed)
  console.log('2️⃣ Running detailed verification...');
  const detailedResults = await runStartupVerification({
    projectRoot,
    verbose: true,
    compact: false
  });
  console.log(`   Result: ${detailedResults.success ? '✅ PASSED' : '❌ FAILED'}\n`);
  
  // Example 3: Run compact verification
  console.log('3️⃣ Running compact verification...');
  await runStartupVerification({
    projectRoot,
    compact: true
  });
  
  // Example 4: Verify primacy rules only
  console.log('4️⃣ Checking primacy rules only...');
  const rulesResult = await verifyPrimacyRules({
    projectRoot,
    verbose: false
  });
  console.log(`   Rules: ${rulesResult.stats.ok}/${rulesResult.stats.total} OK`);
  if (rulesResult.stats.warnings > 0) {
    console.log(`   ⚠️  Warnings: ${rulesResult.stats.warnings}`);
  }
  if (rulesResult.stats.missing > 0) {
    console.log(`   ❌ Missing: ${rulesResult.stats.missing}`);
  }
  console.log('');
  
  // Example 5: Silent mode (programmatic use)
  console.log('5️⃣ Running silent mode (no output)...');
  const silentResults = await runStartupVerification({
    projectRoot,
    silent: true
  });
  console.log(`   Success: ${silentResults.success}`);
  console.log(`   Primacy Rules: ${silentResults.primacyRules.stats.ok}/${silentResults.primacyRules.stats.total}`);
  console.log(`   File Lifecycle: ${silentResults.fileLifecycle.success ? 'Active' : 'Inactive'}`);
  console.log(`   TaskMaster: ${silentResults.taskmaster.configured ? 'Configured' : 'Not configured'}`);
  console.log('');
  
  console.log('✅ Examples complete!');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

