/**
 * Template Library Module
 * 
 * Provides functionality for managing a personal template library.
 * Allows organizing, searching, and installing project templates locally.
 * 
 * @module lib/utils/template-library
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  fileExists,
  ensureDirectory,
  writeFileSafe
} from './file-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Default template library configuration
 */
const DEFAULT_CONFIG = {
  registryPath: '.orchestrator/template-library.json',
  templatesDir: '.orchestrator/templates'
};

/**
 * Template library schema
 * 
 * @typedef {Object} TemplateLibrary
 * @property {string} version - Schema version
 * @property {Date} lastUpdated - Last update timestamp
 * @property {Object.<string, Template>} templates - Templates indexed by ID
 * @property {Category[]} categories - Available categories
 */

/**
 * Template metadata
 * 
 * @typedef {Object} Template
 * @property {string} id - Unique template identifier
 * @property {string} name - Display name
 * @property {string} description - Brief description
 * @property {string} category - Primary category
 * @property {string[]} tags - Search tags
 * @property {string} version - Template version
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @property {string} location - Path to template directory
 * @property {Requirements} requirements - Template requirements
 */

/**
 * Template requirements
 * 
 * @typedef {Object} Requirements
 * @property {string} orchestratorVersion - Required orchestrator version (semver)
 * @property {Dependency[]} dependencies - External dependencies
 */

/**
 * External dependency
 * 
 * @typedef {Object} Dependency
 * @property {string} type - Dependency type (npm, pip, etc.)
 * @property {string} name - Package name
 * @property {string} version - Version requirement
 */

/**
 * Category definition
 * 
 * @typedef {Object} Category
 * @property {string} id - Category identifier
 * @property {string} name - Display name
 * @property {string} description - Category description
 */

/**
 * Get the path to the template library registry
 * 
 * @param {string} projectPath - Project root path
 * @returns {string} Path to registry file
 */
function getRegistryPath(projectPath) {
  return path.join(projectPath, DEFAULT_CONFIG.registryPath);
}

/**
 * Get the path to the templates directory
 * 
 * @param {string} projectPath - Project root path
 * @returns {string} Path to templates directory
 */
function getTemplatesDir(projectPath) {
  return path.join(projectPath, DEFAULT_CONFIG.templatesDir);
}

/**
 * Initialize a new template library
 * 
 * @param {string} projectPath - Project root path
 * @returns {Promise<{success: boolean, message: string, registryPath: string}>}
 */
export async function initializeLibrary(projectPath) {
  try {
    const registryPath = getRegistryPath(projectPath);
    const templatesDir = getTemplatesDir(projectPath);
    
    // Check if library already exists
    const exists = await fileExists(registryPath);
    if (exists) {
      return {
        success: false,
        message: 'Template library already exists',
        registryPath
      };
    }
    
    // Create initial library structure
    const library = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      templates: {},
      categories: [
        {
          id: 'web',
          name: 'Web Development',
          description: 'Web application templates'
        },
        {
          id: 'api',
          name: 'API',
          description: 'API and backend service templates'
        },
        {
          id: 'cli',
          name: 'CLI',
          description: 'Command-line tool templates'
        },
        {
          id: 'data',
          name: 'Data',
          description: 'Data analysis and processing templates'
        },
        {
          id: 'automation',
          name: 'Automation',
          description: 'Automation and scripting templates'
        },
        {
          id: 'other',
          name: 'Other',
          description: 'Miscellaneous templates'
        }
      ]
    };
    
    // Ensure directories exist
    await ensureDirectory(path.dirname(registryPath));
    await ensureDirectory(templatesDir);
    
    // Write registry file
    await fs.writeFile(
      registryPath,
      JSON.stringify(library, null, 2),
      'utf-8'
    );
    
    return {
      success: true,
      message: 'Template library initialized successfully',
      registryPath
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to initialize library: ${error.message}`,
      error
    };
  }
}

/**
 * Read the template library registry
 * 
 * @param {string} projectPath - Project root path
 * @returns {Promise<TemplateLibrary>} Library data
 */
export async function readLibrary(projectPath) {
  try {
    const registryPath = getRegistryPath(projectPath);
    const exists = await fileExists(registryPath);
    
    if (!exists) {
      throw new Error('Template library not initialized. Run initializeLibrary() first.');
    }
    
    const content = await fs.readFile(registryPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read library: ${error.message}`);
  }
}

/**
 * Write the template library registry
 * 
 * @param {string} projectPath - Project root path
 * @param {TemplateLibrary} library - Library data to write
 * @returns {Promise<void>}
 */
async function writeLibrary(projectPath, library) {
  const registryPath = getRegistryPath(projectPath);
  library.lastUpdated = new Date().toISOString();
  
  await fs.writeFile(
    registryPath,
    JSON.stringify(library, null, 2),
    'utf-8'
  );
}

/**
 * Add a template to the library
 * 
 * @param {string} projectPath - Project root path
 * @param {Template} template - Template metadata
 * @returns {Promise<{success: boolean, message: string, templateId: string}>}
 */
export async function addTemplate(projectPath, template) {
  try {
    const library = await readLibrary(projectPath);
    
    // Validate template ID is unique
    if (library.templates[template.id]) {
      return {
        success: false,
        message: `Template with ID '${template.id}' already exists`,
        templateId: template.id
      };
    }
    
    // Set timestamps
    const now = new Date().toISOString();
    template.createdAt = now;
    template.updatedAt = now;
    
    // Add template to library
    library.templates[template.id] = template;
    
    // Write updated library
    await writeLibrary(projectPath, library);
    
    return {
      success: true,
      message: `Template '${template.name}' added successfully`,
      templateId: template.id
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to add template: ${error.message}`,
      error
    };
  }
}

/**
 * Remove a template from the library
 * 
 * @param {string} projectPath - Project root path
 * @param {string} templateId - Template ID to remove
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function removeTemplate(projectPath, templateId) {
  try {
    const library = await readLibrary(projectPath);
    
    if (!library.templates[templateId]) {
      return {
        success: false,
        message: `Template '${templateId}' not found`
      };
    }
    
    const templateName = library.templates[templateId].name;
    delete library.templates[templateId];
    
    await writeLibrary(projectPath, library);
    
    return {
      success: true,
      message: `Template '${templateName}' removed successfully`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to remove template: ${error.message}`,
      error
    };
  }
}

/**
 * Get a specific template by ID
 * 
 * @param {string} projectPath - Project root path
 * @param {string} templateId - Template ID
 * @returns {Promise<Template|null>} Template data or null if not found
 */
export async function getTemplate(projectPath, templateId) {
  try {
    const library = await readLibrary(projectPath);
    return library.templates[templateId] || null;
  } catch (error) {
    throw new Error(`Failed to get template: ${error.message}`);
  }
}

/**
 * Update a template's metadata
 * 
 * @param {string} projectPath - Project root path
 * @param {string} templateId - Template ID
 * @param {Partial<Template>} updates - Fields to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateTemplate(projectPath, templateId, updates) {
  try {
    const library = await readLibrary(projectPath);
    
    if (!library.templates[templateId]) {
      return {
        success: false,
        message: `Template '${templateId}' not found`
      };
    }
    
    // Prevent updating certain fields
    delete updates.id;
    delete updates.createdAt;
    
    // Update template
    library.templates[templateId] = {
      ...library.templates[templateId],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await writeLibrary(projectPath, library);
    
    return {
      success: true,
      message: `Template '${library.templates[templateId].name}' updated successfully`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to update template: ${error.message}`,
      error
    };
  }
}

/**
 * List all templates in the library
 * 
 * @param {string} projectPath - Project root path
 * @returns {Promise<Template[]>} Array of all templates
 */
export async function listTemplates(projectPath) {
  try {
    const library = await readLibrary(projectPath);
    return Object.values(library.templates);
  } catch (error) {
    throw new Error(`Failed to list templates: ${error.message}`);
  }
}

/**
 * Search templates by criteria
 * 
 * @param {string} projectPath - Project root path
 * @param {Object} query - Search criteria
 * @param {string} [query.text] - Text to search in name/description
 * @param {string} [query.category] - Category to filter by
 * @param {string[]} [query.tags] - Tags to filter by (AND logic)
 * @returns {Promise<Template[]>} Matching templates
 */
export async function searchTemplates(projectPath, query = {}) {
  try {
    const templates = await listTemplates(projectPath);
    const { text, category, tags } = query;
    
    return templates.filter(template => {
      // Text search (case-insensitive)
      if (text) {
        const searchText = text.toLowerCase();
        const matchesName = template.name.toLowerCase().includes(searchText);
        const matchesDescription = template.description.toLowerCase().includes(searchText);
        
        if (!matchesName && !matchesDescription) {
          return false;
        }
      }
      
      // Category filter (exact match)
      if (category && template.category !== category) {
        return false;
      }
      
      // Tags filter (must have all specified tags)
      if (tags && tags.length > 0) {
        const hasAllTags = tags.every(tag => 
          template.tags.includes(tag)
        );
        
        if (!hasAllTags) {
          return false;
        }
      }
      
      return true;
    });
  } catch (error) {
    throw new Error(`Failed to search templates: ${error.message}`);
  }
}

/**
 * Get all categories
 * 
 * @param {string} projectPath - Project root path
 * @returns {Promise<Category[]>} Array of categories
 */
export async function getCategories(projectPath) {
  try {
    const library = await readLibrary(projectPath);
    return library.categories;
  } catch (error) {
    throw new Error(`Failed to get categories: ${error.message}`);
  }
}

/**
 * Add a custom category
 * 
 * @param {string} projectPath - Project root path
 * @param {Category} category - Category to add
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function addCategory(projectPath, category) {
  try {
    const library = await readLibrary(projectPath);
    
    // Check if category ID already exists
    const exists = library.categories.some(cat => cat.id === category.id);
    if (exists) {
      return {
        success: false,
        message: `Category '${category.id}' already exists`
      };
    }
    
    library.categories.push(category);
    await writeLibrary(projectPath, library);
    
    return {
      success: true,
      message: `Category '${category.name}' added successfully`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to add category: ${error.message}`,
      error
    };
  }
}

/**
 * Install a template to a destination directory
 * 
 * @param {string} projectPath - Project root path
 * @param {string} templateId - Template ID to install
 * @param {string} destination - Destination directory
 * @param {Object} options - Installation options
 * @param {Object} options.variables - Template variables to substitute
 * @param {boolean} options.overwrite - Allow overwriting existing files
 * @returns {Promise<{success: boolean, message: string, location: string}>}
 */
export async function installTemplate(projectPath, templateId, destination, options = {}) {
  try {
    const { variables = {}, overwrite = false } = options;
    
    // Get template from library
    const template = await getTemplate(projectPath, templateId);
    if (!template) {
      return {
        success: false,
        message: `Template '${templateId}' not found`
      };
    }
    
    // Check if destination already exists
    const destExists = await fileExists(destination);
    if (destExists && !overwrite) {
      return {
        success: false,
        message: `Destination '${destination}' already exists. Use overwrite option to replace.`
      };
    }
    
    // Resolve template location (can be relative or absolute)
    let templateLocation = template.location;
    if (!path.isAbsolute(templateLocation)) {
      templateLocation = path.join(projectPath, templateLocation);
    }
    
    // Check if template location exists
    const templateExists = await fileExists(templateLocation);
    if (!templateExists) {
      return {
        success: false,
        message: `Template files not found at '${templateLocation}'`
      };
    }
    
    // Ensure destination directory exists
    await ensureDirectory(destination);
    
    // Copy template files with variable substitution
    await copyTemplateWithVariables(templateLocation, destination, variables);
    
    return {
      success: true,
      message: `Template '${template.name}' installed successfully`,
      location: destination
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to install template: ${error.message}`,
      error
    };
  }
}

/**
 * Copy template directory with variable substitution
 * 
 * @param {string} source - Source template directory
 * @param {string} destination - Destination directory
 * @param {Object} variables - Variables to substitute
 * @returns {Promise<void>}
 */
async function copyTemplateWithVariables(source, destination, variables) {
  const entries = await fs.readdir(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      await ensureDirectory(destPath);
      await copyTemplateWithVariables(sourcePath, destPath, variables);
    } else {
      // Read file content
      let content = await fs.readFile(sourcePath, 'utf-8');
      
      // Substitute variables (format: {{VARIABLE_NAME}})
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        content = content.replace(regex, value);
      }
      
      // Write to destination
      await fs.writeFile(destPath, content, 'utf-8');
    }
  }
}

/**
 * Create a new template from an existing directory
 * 
 * @param {string} projectPath - Project root path
 * @param {string} sourcePath - Path to directory to template-ize
 * @param {Object} metadata - Template metadata
 * @returns {Promise<{success: boolean, message: string, templateId: string}>}
 */
export async function createTemplateFromDirectory(projectPath, sourcePath, metadata) {
  try {
    const templatesDir = getTemplatesDir(projectPath);
    
    // Ensure source exists
    const sourceExists = await fileExists(sourcePath);
    if (!sourceExists) {
      return {
        success: false,
        message: `Source directory '${sourcePath}' not found`
      };
    }
    
    // Generate template ID if not provided
    if (!metadata.id) {
      metadata.id = metadata.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    
    // Create template directory in library
    const templateDir = path.join(templatesDir, metadata.id);
    const templateDirExists = await fileExists(templateDir);
    
    if (templateDirExists) {
      return {
        success: false,
        message: `Template directory '${metadata.id}' already exists`
      };
    }
    
    // Copy source to template directory
    await ensureDirectory(templateDir);
    await copyDirectoryRecursive(sourcePath, templateDir);
    
    // Set location to relative path
    metadata.location = path.join(DEFAULT_CONFIG.templatesDir, metadata.id);
    
    // Add template to library
    const result = await addTemplate(projectPath, metadata);
    
    return result;
  } catch (error) {
    return {
      success: false,
      message: `Failed to create template: ${error.message}`,
      error
    };
  }
}

/**
 * Copy directory recursively (helper function)
 * 
 * @param {string} source - Source directory
 * @param {string} destination - Destination directory
 * @returns {Promise<void>}
 */
async function copyDirectoryRecursive(source, destination) {
  await ensureDirectory(destination);
  
  const entries = await fs.readdir(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectoryRecursive(sourcePath, destPath);
    } else {
      const content = await fs.readFile(sourcePath, 'utf-8');
      await fs.writeFile(destPath, content, 'utf-8');
    }
  }
}

export default {
  initializeLibrary,
  readLibrary,
  addTemplate,
  removeTemplate,
  getTemplate,
  updateTemplate,
  listTemplates,
  searchTemplates,
  getCategories,
  addCategory,
  installTemplate,
  createTemplateFromDirectory
};

