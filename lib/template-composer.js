/**
 * Template Composer Module
 * 
 * Provides functionality for composing multiple template addons into a single project.
 * Handles directory merging, rule appending, metadata merging, and conflict resolution.
 * 
 * @module lib/template-composer
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  fileExists,
  ensureDirectory,
  writeFileSafe,
  readFileWithHash,
  createBackup
} from './utils/file-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Conflict resolution strategies
 */
export const CONFLICT_STRATEGIES = {
  OVERRIDE: 'override',  // Last addon wins
  MERGE: 'merge',        // Attempt to merge content
  SKIP: 'skip'           // Keep existing file
};

/**
 * Composition result object
 * 
 * @typedef {Object} CompositionResult
 * @property {boolean} success - Whether composition succeeded
 * @property {string} message - Result message
 * @property {Array<Object>} conflicts - List of conflicts encountered
 * @property {Array<Object>} operations - List of file operations performed
 * @property {Error} error - Error object if failed
 */

/**
 * Composition options
 * 
 * @typedef {Object} CompositionOptions
 * @property {string} conflictStrategy - How to handle conflicts (override, merge, skip)
 * @property {boolean} createBackups - Create backups before overwriting
 * @property {boolean} verbose - Enable verbose logging
 * @property {boolean} dryRun - Don't actually write files
 */

/**
 * Get the templates directory path
 * 
 * @param {string} customPath - Optional custom templates directory path
 * @returns {string} Path to templates directory
 */
function getTemplatesDir(customPath) {
  if (customPath) {
    return path.resolve(customPath);
  }
  return path.resolve(__dirname, '..', 'templates');
}

/**
 * Validate that an addon exists and has required structure
 * 
 * @param {string} addonName - Name of the addon to validate
 * @param {string} templatesDir - Optional custom templates directory path
 * @returns {Promise<{valid: boolean, message: string, path: string}>} Validation result
 */
export async function validateAddon(addonName, templatesDir) {
  const templatesPath = getTemplatesDir(templatesDir);
  const addonPath = path.join(templatesPath, addonName);
  
  // Check if addon directory exists
  const exists = await fileExists(addonPath);
  if (!exists) {
    return {
      valid: false,
      message: `Addon '${addonName}' not found at ${addonPath}`,
      path: addonPath
    };
  }
  
  // Check if it's a directory
  try {
    const stats = await fs.stat(addonPath);
    if (!stats.isDirectory()) {
      return {
        valid: false,
        message: `Addon '${addonName}' is not a directory`,
        path: addonPath
      };
    }
  } catch (error) {
    return {
      valid: false,
      message: `Error accessing addon '${addonName}': ${error.message}`,
      path: addonPath
    };
  }
  
  return {
    valid: true,
    message: `Addon '${addonName}' is valid`,
    path: addonPath
  };
}

/**
 * Copy a template directory to target location
 * 
 * @param {string} templatePath - Path to template directory
 * @param {string} targetDir - Destination directory
 * @returns {Promise<{success: boolean, message: string}>} Copy result
 */
export async function copyTemplate(templatePath, targetDir) {
  try {
    // Ensure target directory exists
    await ensureDirectory(targetDir);
    
    // Check if template exists
    const exists = await fileExists(templatePath);
    if (!exists) {
      return {
        success: false,
        message: `Template not found at ${templatePath}`
      };
    }
    
    // Copy directory recursively
    await copyDirectoryRecursive(templatePath, targetDir);
    
    return {
      success: true,
      message: `Successfully copied template from ${templatePath} to ${targetDir}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Error copying template: ${error.message}`,
      error
    };
  }
}

/**
 * Copy directory recursively
 * 
 * @param {string} source - Source directory
 * @param {string} target - Target directory
 * @returns {Promise<void>}
 */
async function copyDirectoryRecursive(source, target) {
  await ensureDirectory(target);
  
  const entries = await fs.readdir(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectoryRecursive(sourcePath, targetPath);
    } else {
      const content = await fs.readFile(sourcePath, 'utf-8');
      await fs.writeFile(targetPath, content, 'utf-8');
    }
  }
}

/**
 * Merge a source directory into a target directory
 * 
 * @param {string} source - Source directory to merge from
 * @param {string} target - Target directory to merge into
 * @param {CompositionOptions} options - Composition options
 * @returns {Promise<{conflicts: Array, operations: Array}>} Merge result
 */
export async function mergeDirectory(source, target, options = {}) {
  const opts = {
    conflictStrategy: CONFLICT_STRATEGIES.OVERRIDE,
    createBackups: true,
    verbose: false,
    ...options
  };
  
  const conflicts = [];
  const operations = [];
  
  // Ensure target exists
  await ensureDirectory(target);
  
  // Check if source exists
  const sourceExists = await fileExists(source);
  if (!sourceExists) {
    return { conflicts, operations };
  }
  
  // Read source directory
  const entries = await fs.readdir(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively merge subdirectories
      const subResult = await mergeDirectory(sourcePath, targetPath, opts);
      conflicts.push(...subResult.conflicts);
      operations.push(...subResult.operations);
    } else {
      // Handle file merging
      const targetExists = await fileExists(targetPath);
      
      if (targetExists) {
        // Conflict detected
        const conflict = {
          path: targetPath,
          source: sourcePath,
          strategy: opts.conflictStrategy,
          timestamp: new Date().toISOString()
        };
        
        conflicts.push(conflict);
        
        // Apply resolution strategy
        if (opts.conflictStrategy === CONFLICT_STRATEGIES.OVERRIDE) {
          // Create backup if requested
          if (opts.createBackups) {
            await createBackup(targetPath);
          }
          
          // Copy source to target
          const content = await fs.readFile(sourcePath, 'utf-8');
          await fs.writeFile(targetPath, content, 'utf-8');
          
          operations.push({
            type: 'override',
            path: targetPath,
            source: sourcePath
          });
        } else if (opts.conflictStrategy === CONFLICT_STRATEGIES.SKIP) {
          operations.push({
            type: 'skip',
            path: targetPath,
            source: sourcePath
          });
        } else if (opts.conflictStrategy === CONFLICT_STRATEGIES.MERGE) {
          // For now, merge strategy falls back to override
          // In future, could implement smart merging for specific file types
          if (opts.createBackups) {
            await createBackup(targetPath);
          }
          
          const content = await fs.readFile(sourcePath, 'utf-8');
          await fs.writeFile(targetPath, content, 'utf-8');
          
          operations.push({
            type: 'merge',
            path: targetPath,
            source: sourcePath
          });
        }
      } else {
        // No conflict, simply copy
        const content = await fs.readFile(sourcePath, 'utf-8');
        await ensureDirectory(path.dirname(targetPath));
        await fs.writeFile(targetPath, content, 'utf-8');
        
        operations.push({
          type: 'create',
          path: targetPath,
          source: sourcePath
        });
      }
    }
  }
  
  return { conflicts, operations };
}

/**
 * Append rules from addon to target rules file
 * 
 * @param {string} addonRulesPath - Path to addon rules file
 * @param {string} targetRulesPath - Path to target rules file
 * @returns {Promise<{success: boolean, message: string, addedCount: number}>} Append result
 */
export async function appendRules(addonRulesPath, targetRulesPath) {
  try {
    // Check if addon rules exist
    const addonExists = await fileExists(addonRulesPath);
    if (!addonExists) {
      return {
        success: true,
        message: 'No addon rules to append',
        addedCount: 0
      };
    }
    
    // Read addon rules
    const addonRulesContent = await fs.readFile(addonRulesPath, 'utf-8');
    const addonRules = JSON.parse(addonRulesContent);
    
    // Read or initialize target rules
    let targetRules = { rules: [] };
    const targetExists = await fileExists(targetRulesPath);
    
    if (targetExists) {
      const targetRulesContent = await fs.readFile(targetRulesPath, 'utf-8');
      targetRules = JSON.parse(targetRulesContent);
    }
    
    // Ensure rules array exists
    if (!targetRules.rules) {
      targetRules.rules = [];
    }
    
    // Create a set of existing rule IDs/names for deduplication
    const existingRuleIds = new Set(
      targetRules.rules
        .filter(rule => rule.id || rule.name)
        .map(rule => rule.id || rule.name)
    );
    
    // Add new rules, avoiding duplicates
    let addedCount = 0;
    const addonRulesArray = Array.isArray(addonRules) ? addonRules : (addonRules.rules || []);
    
    for (const rule of addonRulesArray) {
      const ruleId = rule.id || rule.name;
      if (ruleId && !existingRuleIds.has(ruleId)) {
        targetRules.rules.push(rule);
        existingRuleIds.add(ruleId);
        addedCount++;
      }
    }
    
    // Write updated rules
    await ensureDirectory(path.dirname(targetRulesPath));
    await fs.writeFile(
      targetRulesPath,
      JSON.stringify(targetRules, null, 2),
      'utf-8'
    );
    
    return {
      success: true,
      message: `Successfully appended ${addedCount} rules`,
      addedCount
    };
  } catch (error) {
    return {
      success: false,
      message: `Error appending rules: ${error.message}`,
      error,
      addedCount: 0
    };
  }
}

/**
 * Merge metadata from addon to target metadata file
 * 
 * @param {string} addonMetadataPath - Path to addon metadata file
 * @param {string} targetMetadataPath - Path to target metadata file
 * @returns {Promise<{success: boolean, message: string}>} Merge result
 */
export async function mergeMetadata(addonMetadataPath, targetMetadataPath) {
  try {
    // Check if addon metadata exists
    const addonExists = await fileExists(addonMetadataPath);
    if (!addonExists) {
      return {
        success: true,
        message: 'No addon metadata to merge'
      };
    }
    
    // Read addon metadata
    const addonMetadataContent = await fs.readFile(addonMetadataPath, 'utf-8');
    const addonMetadata = JSON.parse(addonMetadataContent);
    
    // Read or initialize target metadata
    let targetMetadata = {};
    const targetExists = await fileExists(targetMetadataPath);
    
    if (targetExists) {
      const targetMetadataContent = await fs.readFile(targetMetadataPath, 'utf-8');
      targetMetadata = JSON.parse(targetMetadataContent);
    }
    
    // Merge metadata (addon values take precedence for scalar values)
    // For arrays, we concatenate and deduplicate
    for (const [key, value] of Object.entries(addonMetadata)) {
      if (Array.isArray(value) && Array.isArray(targetMetadata[key])) {
        // Merge arrays and deduplicate
        const combined = [...targetMetadata[key], ...value];
        targetMetadata[key] = [...new Set(combined)];
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Merge objects recursively
        targetMetadata[key] = {
          ...(targetMetadata[key] || {}),
          ...value
        };
      } else {
        // Override scalar values
        targetMetadata[key] = value;
      }
    }
    
    // Write merged metadata
    await ensureDirectory(path.dirname(targetMetadataPath));
    await fs.writeFile(
      targetMetadataPath,
      JSON.stringify(targetMetadata, null, 2),
      'utf-8'
    );
    
    return {
      success: true,
      message: 'Successfully merged metadata'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error merging metadata: ${error.message}`,
      error
    };
  }
}

/**
 * Validate a composed project structure
 * 
 * @param {string} targetDir - Directory to validate
 * @returns {Promise<{valid: boolean, message: string, errors: Array}>} Validation result
 */
export async function validateComposedProject(targetDir) {
  const errors = [];
  
  try {
    // Check if target directory exists
    const exists = await fileExists(targetDir);
    if (!exists) {
      errors.push(`Target directory does not exist: ${targetDir}`);
      return {
        valid: false,
        message: 'Target directory does not exist',
        errors
      };
    }
    
    // Check for required files/directories
    // This is a basic validation - can be enhanced based on project requirements
    const requiredPaths = [
      // Add any required paths here based on your project structure
    ];
    
    for (const requiredPath of requiredPaths) {
      const fullPath = path.join(targetDir, requiredPath);
      const pathExists = await fileExists(fullPath);
      if (!pathExists) {
        errors.push(`Required path missing: ${requiredPath}`);
      }
    }
    
    // If metadata.json exists, validate it
    const metadataPath = path.join(targetDir, 'metadata.json');
    const metadataExists = await fileExists(metadataPath);
    if (metadataExists) {
      try {
        const content = await fs.readFile(metadataPath, 'utf-8');
        JSON.parse(content); // Validate JSON structure
      } catch (error) {
        errors.push(`Invalid metadata.json: ${error.message}`);
      }
    }
    
    // If skill-rules.json exists, validate it
    const rulesPath = path.join(targetDir, 'skill-rules.json');
    const rulesExists = await fileExists(rulesPath);
    if (rulesExists) {
      try {
        const content = await fs.readFile(rulesPath, 'utf-8');
        JSON.parse(content); // Validate JSON structure
      } catch (error) {
        errors.push(`Invalid skill-rules.json: ${error.message}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      message: errors.length === 0 
        ? 'Project structure is valid' 
        : `Validation failed with ${errors.length} error(s)`,
      errors
    };
  } catch (error) {
    errors.push(`Validation error: ${error.message}`);
    return {
      valid: false,
      message: 'Validation failed',
      errors
    };
  }
}

/**
 * Compose multiple templates into a single project
 * 
 * @param {string} baseTemplate - The base template name
 * @param {string[]} addons - Array of addon template names
 * @param {string} targetDir - Output directory for the composed project
 * @param {CompositionOptions} options - Composition options
 * @returns {Promise<CompositionResult>} Result object with success status and messages
 */
export async function composeTemplates(baseTemplate, addons, targetDir, options = {}) {
  const opts = {
    conflictStrategy: CONFLICT_STRATEGIES.OVERRIDE,
    createBackups: true,
    verbose: false,
    dryRun: false,
    templatesDir: null, // Optional custom templates directory
    ...options
  };
  
  const result = {
    success: false,
    message: '',
    conflicts: [],
    operations: [],
    error: null
  };
  
  try {
    const templatesPath = getTemplatesDir(opts.templatesDir);
    
    // Validate base template
    const baseTemplatePath = path.join(templatesPath, baseTemplate);
    const baseExists = await fileExists(baseTemplatePath);
    if (!baseExists) {
      result.message = `Base template '${baseTemplate}' not found at ${baseTemplatePath}`;
      return result;
    }
    
    // Copy base template first
    if (!opts.dryRun) {
      const copyResult = await copyTemplate(baseTemplatePath, targetDir);
      if (!copyResult.success) {
        result.message = copyResult.message;
        result.error = copyResult.error;
        return result;
      }
      result.operations.push({
        type: 'copy_base',
        template: baseTemplate,
        target: targetDir
      });
    }
    
    // Apply each addon sequentially
    for (const addon of addons) {
      // Validate addon exists
      const validation = await validateAddon(addon, opts.templatesDir);
      if (!validation.valid) {
        result.message = validation.message;
        return result;
      }
      
      const addonPath = validation.path;
      
      if (!opts.dryRun) {
        // Merge skills directories if they exist
        const skillsSource = path.join(addonPath, 'skills');
        const skillsTarget = path.join(targetDir, 'skills');
        const skillsExists = await fileExists(skillsSource);
        
        if (skillsExists) {
          const mergeResult = await mergeDirectory(skillsSource, skillsTarget, opts);
          result.conflicts.push(...mergeResult.conflicts);
          result.operations.push(...mergeResult.operations);
        }
        
        // Append skill rules if they exist
        const rulesSource = path.join(addonPath, 'skill-rules.json');
        const rulesTarget = path.join(targetDir, 'skill-rules.json');
        const rulesResult = await appendRules(rulesSource, rulesTarget);
        
        if (rulesResult.addedCount > 0) {
          result.operations.push({
            type: 'append_rules',
            addon,
            addedCount: rulesResult.addedCount
          });
        }
        
        // Merge metadata if it exists
        const metadataSource = path.join(addonPath, 'metadata.json');
        const metadataTarget = path.join(targetDir, 'metadata.json');
        await mergeMetadata(metadataSource, metadataTarget);
        
        result.operations.push({
          type: 'apply_addon',
          addon,
          path: addonPath
        });
      }
    }
    
    // Validate final result
    if (!opts.dryRun) {
      const validationResult = await validateComposedProject(targetDir);
      
      if (!validationResult.valid) {
        result.message = `Composition completed but validation failed: ${validationResult.message}`;
        result.errors = validationResult.errors;
        result.success = true; // Composition succeeded even if validation has warnings
        return result;
      }
    }
    
    result.success = true;
    result.message = opts.dryRun 
      ? `Dry run: Would compose ${baseTemplate} with ${addons.length} addon(s)` 
      : `Successfully composed ${baseTemplate} with ${addons.length} addon(s)`;
    
    return result;
  } catch (error) {
    result.message = `Error composing templates: ${error.message}`;
    result.error = error;
    return result;
  }
}

export default {
  composeTemplates,
  validateAddon,
  copyTemplate,
  mergeDirectory,
  appendRules,
  mergeMetadata,
  validateComposedProject,
  CONFLICT_STRATEGIES
};

