#!/usr/bin/env node

/**
 * UFC Pattern Validation Command
 * 
 * Validates UFC (Unified Filesystem Context) implementation
 * against PRD requirements.
 * 
 * Usage:
 *   node bin/validate-ufc.js
 *   npm run validate:ufc
 */

import { validateUFC, generateComplianceReport } from '../lib/utils/ufc-validator.js';

async function main() {
  console.log('\n🔍 Validating UFC Pattern Implementation...\n');

  try {
    const result = await validateUFC();
    const report = generateComplianceReport(result);

    console.log(report);

    // Exit with appropriate code
    process.exit(result.valid ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Validation failed with error:\n');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(2);
  }
}

main();

