/**
 * File Lifecycle Validation System
 * 
 * Integrates with diet103 validation to provide organization scoring,
 * misplaced file detection, and auto-repair recommendations.
 * 
 * @module file-lifecycle-validator
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * UFC-compliant directory structure definition
 */
const UFC_DIRECTORY_STRUCTURE = {
  docs: {
    core: 'Core documentation files',
    impl: 'Implementation guides and technical docs',
    sessions: 'Session summaries and logs',
    archive: 'Archived documentation'
  },
  lib: 'Source code and libraries',
  tests: 'Test files and fixtures',
  templates: 'Project templates',
  '.claude': 'Claude AI configuration',
  '.taskmaster': 'Task Master configuration and data'
};

/**
 * Expected file locations per tier
 */
const EXPECTED_LOCATIONS = {
  CRITICAL: [
    '.taskmaster',
    '.claude',
    'lib/schemas',
    '.' // root directory for config files
  ],
  PERMANENT: [
    'docs/core',
    'docs/impl',
    '.taskmaster/docs',
    'Docs',
    '.' // root for main docs
  ],
  EPHEMERAL: [
    'docs/sessions',
    '.taskmaster/reports',
    'tests/fixtures',
    'logs'
  ],
  ARCHIVED: [
    'docs/archive',
    '.taskmaster/archive'
  ]
};

/**
 * Load file manifest from project
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<Object>} File manifest object
 */
export async function loadManifest(projectRoot) {
  const manifestPath = path.join(projectRoot, '.file-manifest.json');
  
  try {
    const content = await fs.readFile(manifestPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // Manifest doesn't exist yet
    }
    throw new Error(`Failed to load manifest: ${error.message}`);
  }
}

/**
 * Check if a file is in an expected location for its tier
 * @param {string} filePath - Relative file path from project root
 * @param {string} tier - File tier (CRITICAL, PERMANENT, EPHEMERAL, ARCHIVED)
 * @returns {boolean} True if file is in expected location
 */
export function isInExpectedLocation(filePath, tier) {
  const expectedDirs = EXPECTED_LOCATIONS[tier] || [];
  
  // Get the directory of the file
  const fileDir = path.dirname(filePath);
  
  // Check if file is in any of the expected directories
  return expectedDirs.some(expectedDir => {
    if (expectedDir === '.') {
      // Root directory - file should have no subdirectory (no slashes)
      return !filePath.includes('/');
    }
    return fileDir.startsWith(expectedDir);
  });
}

/**
 * Detect misplaced files based on manifest and UFC guidelines
 * @param {Object} manifest - File manifest object
 * @returns {Array<Object>} Array of misplaced file objects
 */
export function detectMisplacedFiles(manifest) {
  if (!manifest || !manifest.files) {
    return [];
  }
  
  const misplaced = [];
  
  for (const [filePath, fileData] of Object.entries(manifest.files)) {
    const { tier, status } = fileData;
    
    // Skip archived files (they're supposed to be in archive)
    if (status === 'archived') {
      continue;
    }
    
    // Check if file is in expected location for its tier
    if (!isInExpectedLocation(filePath, tier)) {
      misplaced.push({
        path: filePath,
        tier,
        currentLocation: path.dirname(filePath),
        expectedLocations: EXPECTED_LOCATIONS[tier] || [],
        suggestedMove: suggestCorrectLocation(filePath, tier)
      });
    }
  }
  
  return misplaced;
}

/**
 * Suggest correct location for a misplaced file
 * @param {string} filePath - Current file path
 * @param {string} tier - File tier
 * @returns {string} Suggested new path
 */
export function suggestCorrectLocation(filePath, tier) {
  const fileName = path.basename(filePath);
  const expectedDirs = EXPECTED_LOCATIONS[tier] || [];
  
  // Use the first expected directory as default suggestion
  if (expectedDirs.length === 0) {
    return filePath; // No suggestion if no expected dirs
  }
  
  // If already in root and root is an expected location, don't suggest a move
  if (!filePath.includes('/') && expectedDirs.includes('.')) {
    return filePath;
  }
  
  // Find the first non-root expected directory, or use root if that's the only option
  const targetDir = expectedDirs.find(dir => dir !== '.') || expectedDirs[0];
  
  if (targetDir === '.') {
    return fileName;
  }
  
  return path.join(targetDir, fileName);
}

/**
 * Calculate organization score based on file placement
 * @param {Object} manifest - File manifest object
 * @returns {Object} Organization score and metrics
 */
export function calculateOrganizationScore(manifest) {
  if (!manifest || !manifest.files) {
    return {
      score: 0,
      percentage: 0,
      totalFiles: 0,
      correctlyPlaced: 0,
      misplaced: 0,
      details: 'No manifest found'
    };
  }
  
  const misplacedFiles = detectMisplacedFiles(manifest);
  const totalFiles = Object.keys(manifest.files).length;
  const correctlyPlaced = totalFiles - misplacedFiles.length;
  
  const percentage = totalFiles > 0 ? (correctlyPlaced / totalFiles) * 100 : 0;
  
  // Score breakdown by tier
  const tierBreakdown = {};
  for (const tier of ['CRITICAL', 'PERMANENT', 'EPHEMERAL', 'ARCHIVED']) {
    const tierFiles = Object.entries(manifest.files).filter(([, data]) => data.tier === tier);
    const tierMisplaced = misplacedFiles.filter(f => f.tier === tier);
    
    tierBreakdown[tier] = {
      total: tierFiles.length,
      correctlyPlaced: tierFiles.length - tierMisplaced.length,
      misplaced: tierMisplaced.length,
      percentage: tierFiles.length > 0 ? 
        ((tierFiles.length - tierMisplaced.length) / tierFiles.length) * 100 : 100
    };
  }
  
  return {
    score: Math.round(percentage),
    percentage: Math.round(percentage * 10) / 10,
    totalFiles,
    correctlyPlaced,
    misplaced: misplacedFiles.length,
    tierBreakdown,
    misplacedFiles: misplacedFiles.map(f => ({
      path: f.path,
      tier: f.tier,
      suggestedMove: f.suggestedMove
    }))
  };
}

/**
 * Scan directory structure and compare with UFC guidelines
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<Object>} Directory structure validation results
 */
export async function validateDirectoryStructure(projectRoot) {
  const results = {
    compliant: true,
    missingDirectories: [],
    unexpectedStructure: [],
    recommendations: []
  };
  
  // Check for expected directories
  for (const [dirName, description] of Object.entries(UFC_DIRECTORY_STRUCTURE)) {
    const dirPath = path.join(projectRoot, dirName);
    
    try {
      const stat = await fs.stat(dirPath);
      if (!stat.isDirectory()) {
        results.compliant = false;
        results.unexpectedStructure.push({
          path: dirName,
          issue: 'Expected directory but found file',
          description
        });
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        results.compliant = false;
        results.missingDirectories.push({
          path: dirName,
          description,
          createCommand: `mkdir -p ${dirName}`
        });
      }
    }
  }
  
  // Check for nested docs structure
  const docsSubdirs = ['core', 'impl', 'sessions', 'archive'];
  for (const subdir of docsSubdirs) {
    const subdirPath = path.join(projectRoot, 'docs', subdir);
    
    try {
      await fs.stat(subdirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        results.compliant = false;
        results.missingDirectories.push({
          path: `docs/${subdir}`,
          description: UFC_DIRECTORY_STRUCTURE.docs[subdir],
          createCommand: `mkdir -p docs/${subdir}`
        });
      }
    }
  }
  
  // Generate recommendations
  if (results.missingDirectories.length > 0) {
    results.recommendations.push({
      type: 'create_directories',
      message: 'Create missing UFC-compliant directories',
      autoRepair: true,
      directories: results.missingDirectories.map(d => d.path)
    });
  }
  
  return results;
}

/**
 * Comprehensive validation combining manifest and directory checks
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<Object>} Complete validation results
 */
export async function validateFileLifecycle(projectRoot) {
  const manifest = await loadManifest(projectRoot);
  const directoryValidation = await validateDirectoryStructure(projectRoot);
  const organizationScore = calculateOrganizationScore(manifest);
  
  const overallCompliance = directoryValidation.compliant && organizationScore.score >= 80;
  
  return {
    compliant: overallCompliance,
    organizationScore,
    directoryStructure: directoryValidation,
    manifest: {
      exists: manifest !== null,
      totalFiles: manifest ? Object.keys(manifest.files).length : 0,
      lastUpdated: manifest ? manifest.last_updated : null
    },
    recommendations: [
      ...directoryValidation.recommendations,
      ...(organizationScore.score < 80 ? [{
        type: 'organize_files',
        message: `Organization score is ${organizationScore.score}%. Consider running 'diet103 fl organize' to auto-fix file placement.`,
        autoRepair: true,
        misplacedCount: organizationScore.misplaced
      }] : [])
    ]
  };
}

/**
 * Generate auto-repair actions based on validation results
 * @param {Object} validationResults - Results from validateFileLifecycle
 * @returns {Array<Object>} Array of repair actions
 */
export function generateAutoRepairActions(validationResults) {
  const actions = [];
  
  // Directory creation actions
  if (validationResults.directoryStructure.missingDirectories.length > 0) {
    actions.push({
      type: 'create_directories',
      priority: 'high',
      description: 'Create missing UFC-compliant directories',
      directories: validationResults.directoryStructure.missingDirectories.map(d => d.path),
      automated: true
    });
  }
  
  // File organization actions
  if (validationResults.organizationScore.misplacedFiles.length > 0) {
    actions.push({
      type: 'move_files',
      priority: 'medium',
      description: 'Move misplaced files to correct locations',
      moves: validationResults.organizationScore.misplacedFiles.map(f => ({
        from: f.path,
        to: f.suggestedMove,
        tier: f.tier
      })),
      automated: false, // Requires user confirmation
      dryRunRecommended: true
    });
  }
  
  return actions;
}

export default {
  loadManifest,
  isInExpectedLocation,
  detectMisplacedFiles,
  suggestCorrectLocation,
  calculateOrganizationScore,
  validateDirectoryStructure,
  validateFileLifecycle,
  generateAutoRepairActions
};

