#!/usr/bin/env node

/**
 * Pre-Commit Hook
 * 
 * Validates the Chrome extension before committing changes.
 * Checks manifest.json, permissions, and code quality.
 * 
 * @hook pre-commit
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Run pre-commit checks
 */
async function runPreCommit() {
  console.log('Running pre-commit checks...\n');
  
  const checks = [
    validateManifest,
    checkPermissions,
    validateFileStructure,
    checkCodeQuality
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const result = await check();
      if (!result.passed) {
        allPassed = false;
        console.error(`✗ ${result.name}: FAILED`);
        console.error(`  ${result.message}\n`);
      } else {
        console.log(`✓ ${result.name}: PASSED`);
      }
    } catch (error) {
      allPassed = false;
      console.error(`✗ ${check.name}: ERROR`);
      console.error(`  ${error.message}\n`);
    }
  }
  
  if (allPassed) {
    console.log('\n✓ All pre-commit checks passed!');
    process.exit(0);
  } else {
    console.error('\n✗ Some checks failed. Please fix the issues before committing.');
    process.exit(1);
  }
}

/**
 * Validate manifest.json
 */
async function validateManifest() {
  try {
    const manifestPath = path.join(process.cwd(), 'manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);
    
    // Check required fields
    const requiredFields = ['name', 'version', 'manifest_version'];
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length > 0) {
      return {
        name: 'Manifest Validation',
        passed: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      };
    }
    
    // Check manifest version
    if (manifest.manifest_version !== 3) {
      return {
        name: 'Manifest Validation',
        passed: false,
        message: 'Manifest version must be 3'
      };
    }
    
    // Validate version format (semver)
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      return {
        name: 'Manifest Validation',
        passed: false,
        message: 'Version must follow semantic versioning (e.g., 1.0.0)'
      };
    }
    
    return {
      name: 'Manifest Validation',
      passed: true
    };
  } catch (error) {
    return {
      name: 'Manifest Validation',
      passed: false,
      message: error.message
    };
  }
}

/**
 * Check permissions usage
 */
async function checkPermissions() {
  try {
    const manifestPath = path.join(process.cwd(), 'manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);
    
    const permissions = manifest.permissions || [];
    const hostPermissions = manifest.host_permissions || [];
    
    // Warn about dangerous permissions
    const dangerousPermissions = ['tabs', 'webRequest', 'webRequestBlocking', 'cookies', 'history'];
    const usedDangerous = permissions.filter(p => dangerousPermissions.includes(p));
    
    if (usedDangerous.length > 0) {
      console.warn(`  ⚠ Warning: Using sensitive permissions: ${usedDangerous.join(', ')}`);
      console.warn(`    Make sure these are necessary and documented in README.md\n`);
    }
    
    // Check for overly broad host permissions
    const broadPatterns = ['<all_urls>', '*://*/*', 'http://*/*', 'https://*/*'];
    const hasBroadPermissions = hostPermissions.some(p => broadPatterns.includes(p));
    
    if (hasBroadPermissions) {
      console.warn(`  ⚠ Warning: Using broad host permissions`);
      console.warn(`    Consider restricting to specific domains if possible\n`);
    }
    
    return {
      name: 'Permissions Check',
      passed: true
    };
  } catch (error) {
    return {
      name: 'Permissions Check',
      passed: false,
      message: error.message
    };
  }
}

/**
 * Validate file structure
 */
async function validateFileStructure() {
  try {
    const requiredFiles = [
      'manifest.json',
      'src/background/index.js',
      'src/popup/index.html',
      'README.md'
    ];
    
    const missingFiles = [];
    
    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      try {
        await fs.access(filePath);
      } catch {
        missingFiles.push(file);
      }
    }
    
    if (missingFiles.length > 0) {
      return {
        name: 'File Structure',
        passed: false,
        message: `Missing required files: ${missingFiles.join(', ')}`
      };
    }
    
    return {
      name: 'File Structure',
      passed: true
    };
  } catch (error) {
    return {
      name: 'File Structure',
      passed: false,
      message: error.message
    };
  }
}

/**
 * Check code quality (basic checks)
 */
async function checkCodeQuality() {
  try {
    // Check for console.logs in production code (warning only)
    const jsFiles = await findJSFiles('src');
    let consoleLogCount = 0;
    
    for (const file of jsFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const matches = content.match(/console\.log\(/g);
      if (matches) {
        consoleLogCount += matches.length;
      }
    }
    
    if (consoleLogCount > 10) {
      console.warn(`  ⚠ Warning: Found ${consoleLogCount} console.log statements`);
      console.warn(`    Consider removing or using a proper logging system\n`);
    }
    
    return {
      name: 'Code Quality',
      passed: true
    };
  } catch (error) {
    return {
      name: 'Code Quality',
      passed: true,
      message: 'Skipped: ' + error.message
    };
  }
}

/**
 * Find all JavaScript files in a directory
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
    } catch (error) {
      // Ignore errors (e.g., permission denied)
    }
  }
  
  await scan(dir);
  return files;
}

// Run checks
runPreCommit().catch((error) => {
  console.error('Pre-commit hook failed:', error);
  process.exit(1);
});

