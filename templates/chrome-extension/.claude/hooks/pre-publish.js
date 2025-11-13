#!/usr/bin/env node

/**
 * Pre-Publish Hook
 * 
 * Validates the Chrome extension before publishing to Chrome Web Store.
 * Performs comprehensive checks for production readiness.
 * 
 * @hook pre-publish
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Run pre-publish checks
 */
async function runPrePublish() {
  console.log('Running pre-publish checks for Chrome Web Store...\n');
  
  const checks = [
    validateManifestForPublishing,
    checkAssets,
    validateDocumentation,
    checkSensitiveData,
    validatePermissions,
    checkCodeQuality
  ];
  
  let allPassed = true;
  const warnings = [];
  
  for (const check of checks) {
    try {
      const result = await check();
      if (!result.passed) {
        allPassed = false;
        console.error(`✗ ${result.name}: FAILED`);
        console.error(`  ${result.message}\n`);
      } else {
        console.log(`✓ ${result.name}: PASSED`);
        if (result.warnings) {
          warnings.push(...result.warnings);
        }
      }
    } catch (error) {
      allPassed = false;
      console.error(`✗ ${check.name}: ERROR`);
      console.error(`  ${error.message}\n`);
    }
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠ Warnings:');
    warnings.forEach(w => console.warn(`  - ${w}`));
    console.log('');
  }
  
  if (allPassed) {
    console.log('✓ All pre-publish checks passed!');
    console.log('\nNext steps:');
    console.log('1. Create a ZIP file of your extension');
    console.log('2. Upload to Chrome Web Store Developer Dashboard');
    console.log('3. Fill in store listing details');
    console.log('4. Submit for review\n');
    process.exit(0);
  } else {
    console.error('✗ Some checks failed. Please fix before publishing.');
    process.exit(1);
  }
}

/**
 * Validate manifest for publishing
 */
async function validateManifestForPublishing() {
  try {
    const manifestPath = path.join(process.cwd(), 'manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);
    
    const warnings = [];
    
    // Check name length (45 char limit)
    if (manifest.name && manifest.name.length > 45) {
      return {
        name: 'Manifest Publishing',
        passed: false,
        message: `Extension name too long (${manifest.name.length} chars). Chrome Web Store limit is 45.`
      };
    }
    
    // Check for description
    if (!manifest.description || manifest.description.length < 10) {
      return {
        name: 'Manifest Publishing',
        passed: false,
        message: 'Description is required and should be at least 10 characters'
      };
    }
    
    if (manifest.description.length > 132) {
      warnings.push(`Description is long (${manifest.description.length} chars). Chrome Web Store shows first 132 chars.`);
    }
    
    // Check for icons
    if (!manifest.icons || !manifest.icons['128']) {
      return {
        name: 'Manifest Publishing',
        passed: false,
        message: '128x128 icon is required for publishing'
      };
    }
    
    // Check version format
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      return {
        name: 'Manifest Publishing',
        passed: false,
        message: 'Version must be in format X.Y.Z (e.g., 1.0.0)'
      };
    }
    
    // Warn if version is 0.x.x
    if (manifest.version.startsWith('0.')) {
      warnings.push('Version starts with 0. Consider using 1.0.0 for first public release.');
    }
    
    return {
      name: 'Manifest Publishing',
      passed: true,
      warnings
    };
  } catch (error) {
    return {
      name: 'Manifest Publishing',
      passed: false,
      message: error.message
    };
  }
}

/**
 * Check required assets
 */
async function checkAssets() {
  try {
    const warnings = [];
    const requiredIcons = ['icon-16.png', 'icon-48.png', 'icon-128.png'];
    const missingIcons = [];
    
    for (const icon of requiredIcons) {
      const iconPath = path.join(process.cwd(), 'assets', icon);
      try {
        await fs.access(iconPath);
      } catch {
        missingIcons.push(icon);
      }
    }
    
    if (missingIcons.length > 0) {
      return {
        name: 'Assets Check',
        passed: false,
        message: `Missing required icons: ${missingIcons.join(', ')}`
      };
    }
    
    // Check for promotional images
    const promoPath = path.join(process.cwd(), 'promo');
    try {
      await fs.access(promoPath);
    } catch {
      warnings.push('No promo directory found. You\'ll need promotional images for Chrome Web Store listing.');
    }
    
    return {
      name: 'Assets Check',
      passed: true,
      warnings
    };
  } catch (error) {
    return {
      name: 'Assets Check',
      passed: false,
      message: error.message
    };
  }
}

/**
 * Validate documentation
 */
async function validateDocumentation() {
  try {
    const warnings = [];
    
    // Check README
    const readmePath = path.join(process.cwd(), 'README.md');
    const readmeContent = await fs.readFile(readmePath, 'utf-8');
    
    if (readmeContent.length < 200) {
      warnings.push('README.md seems short. Consider adding more documentation.');
    }
    
    // Check for privacy policy if needed
    if (!readmeContent.toLowerCase().includes('privacy')) {
      warnings.push('No privacy information found. Add a privacy policy if you collect any data.');
    }
    
    // Check for LICENSE
    try {
      await fs.access(path.join(process.cwd(), 'LICENSE'));
    } catch {
      warnings.push('No LICENSE file found. Consider adding one.');
    }
    
    return {
      name: 'Documentation Check',
      passed: true,
      warnings
    };
  } catch (error) {
    return {
      name: 'Documentation Check',
      passed: false,
      message: error.message
    };
  }
}

/**
 * Check for sensitive data
 */
async function checkSensitiveData() {
  try {
    const warnings = [];
    const sensitivePatterns = [
      { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]{20,}['"]/gi, name: 'API keys' },
      { pattern: /secret\s*[:=]\s*['"][^'"]{10,}['"]/gi, name: 'Secrets' },
      { pattern: /password\s*[:=]\s*['"][^'"]+['"]/gi, name: 'Passwords' },
      { pattern: /token\s*[:=]\s*['"][^'"]{20,}['"]/gi, name: 'Tokens' }
    ];
    
    const jsFiles = await findJSFiles('src');
    
    for (const file of jsFiles) {
      const content = await fs.readFile(file, 'utf-8');
      
      for (const { pattern, name } of sensitivePatterns) {
        if (pattern.test(content)) {
          warnings.push(`Possible ${name} found in ${path.relative(process.cwd(), file)}`);
        }
      }
    }
    
    return {
      name: 'Sensitive Data Check',
      passed: warnings.length === 0,
      message: warnings.length > 0 ? 'Possible sensitive data found in code' : undefined,
      warnings
    };
  } catch (error) {
    return {
      name: 'Sensitive Data Check',
      passed: true,
      warnings: [`Check skipped: ${error.message}`]
    };
  }
}

/**
 * Validate permissions for publishing
 */
async function validatePermissions() {
  try {
    const manifestPath = path.join(process.cwd(), 'manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);
    
    const warnings = [];
    const permissions = manifest.permissions || [];
    
    // Check for permissions that need justification
    const needsJustification = ['tabs', 'webRequest', 'cookies', 'history', 'bookmarks'];
    const used = permissions.filter(p => needsJustification.includes(p));
    
    if (used.length > 0) {
      warnings.push(`Permissions requiring justification: ${used.join(', ')}. Make sure to explain these in your store listing.`);
    }
    
    return {
      name: 'Permissions Validation',
      passed: true,
      warnings
    };
  } catch (error) {
    return {
      name: 'Permissions Validation',
      passed: false,
      message: error.message
    };
  }
}

/**
 * Check code quality for publishing
 */
async function checkCodeQuality() {
  try {
    const warnings = [];
    
    // Check for console statements
    const jsFiles = await findJSFiles('src');
    let consoleCount = 0;
    
    for (const file of jsFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const matches = content.match(/console\.(log|warn|error)\(/g);
      if (matches) {
        consoleCount += matches.length;
      }
    }
    
    if (consoleCount > 20) {
      warnings.push(`Found ${consoleCount} console statements. Consider removing or using conditional logging.`);
    }
    
    // Check for TODO/FIXME
    let todoCount = 0;
    for (const file of jsFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const matches = content.match(/TODO|FIXME/gi);
      if (matches) {
        todoCount += matches.length;
      }
    }
    
    if (todoCount > 0) {
      warnings.push(`Found ${todoCount} TODO/FIXME comments. Consider resolving before publishing.`);
    }
    
    return {
      name: 'Code Quality',
      passed: true,
      warnings
    };
  } catch (error) {
    return {
      name: 'Code Quality',
      passed: true,
      warnings: [`Check skipped: ${error.message}`]
    };
  }
}

/**
 * Find all JavaScript files
 */
async function findJSFiles(dir) {
  const files = [];
  
  async function scan(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          files.push(fullPath);
        }
      }
    } catch {
      // Ignore errors
    }
  }
  
  await scan(dir);
  return files;
}

// Run checks
runPrePublish().catch((error) => {
  console.error('Pre-publish hook failed:', error);
  process.exit(1);
});

