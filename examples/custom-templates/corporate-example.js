#!/usr/bin/env node

/**
 * Example: Custom Corporate Template Usage
 * 
 * This example shows how to use custom variables with the diet103 repair system
 * for organization-specific branding and requirements.
 * 
 * Usage:
 *   node examples/custom-templates/corporate-example.js /path/to/project
 */

import { repairDiet103Infrastructure } from '../../lib/utils/diet103-repair.js';
import path from 'path';

// Corporate configuration
const CORPORATE_CONFIG = {
  ORGANIZATION: 'Acme Corporation',
  TEAM_NAME: 'AI Platform Engineering',
  LICENSE: 'Proprietary',
  SUPPORT_EMAIL: 'ai-platform@acme.com',
  OWNER_EMAIL: 'john.doe@acme.com',
  TEAM_EMAIL: 'ai-team@acme.com',
  REPOSITORY_URL: 'https://github.com/acme-corp/ai-platform',
  WIKI_URL: 'https://wiki.acme.com/ai-platform',
  YEAR: new Date().getFullYear().toString(),
  
  // Custom project-specific overrides
  PROJECT_DESCRIPTION: 'Enterprise AI-powered automation platform',
  SKILLS_DESCRIPTION: `
- Natural language processing
- Data analysis and visualization  
- Automated workflow orchestration
- Integration with Acme ecosystem
  `.trim()
};

async function repairWithCorporateDefaults(projectPath) {
  console.log('🏢 Acme Corporation - diet103 Infrastructure Repair');
  console.log('=' .repeat(60));
  console.log(`\nProject: ${projectPath}`);
  console.log('Applying corporate templates and standards...\n');

  try {
    const result = await repairDiet103Infrastructure(projectPath, {
      installImportant: true,
      variables: CORPORATE_CONFIG
    });

    console.log('✅ Repair completed successfully!');
    console.log('\nResults:');
    console.log(`  Score Before: ${result.before.score}%`);
    console.log(`  Score After:  ${result.after.score}%`);
    console.log(`  Components Installed: ${result.totalInstalled}`);
    
    if (result.installed.critical.length > 0) {
      console.log('\n  Critical components:');
      result.installed.critical.forEach(item => {
        console.log(`    ✓ ${item}`);
      });
    }
    
    if (result.installed.important.length > 0) {
      console.log('\n  Important components:');
      result.installed.important.forEach(item => {
        console.log(`    ✓ ${item}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Project is now compliant with Acme standards!');
    
    return result;

  } catch (error) {
    console.error('❌ Repair failed:', error.message);
    process.exit(1);
  }
}

// CLI usage
const projectPath = process.argv[2] || process.cwd();
const resolvedPath = path.resolve(projectPath);

repairWithCorporateDefaults(resolvedPath);

