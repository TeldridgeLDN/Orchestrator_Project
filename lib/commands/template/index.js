/**
 * Template Library Commands
 * 
 * Provides CLI commands for managing a personal template library.
 * 
 * @module lib/commands/template
 */

import {
  initializeLibrary,
  listTemplates,
  searchTemplates,
  getTemplate,
  addTemplate,
  removeTemplate,
  updateTemplate,
  installTemplate,
  createTemplateFromDirectory,
  getCategories,
  addCategory
} from '../../utils/template-library.js';

/**
 * Initialize template library command
 * 
 * @param {Object} options - Command options
 * @param {string} options.projectPath - Project root path
 * @returns {Promise<void>}
 */
export async function initCommand(options) {
  const { projectPath = process.cwd() } = options;
  
  console.log('Initializing template library...\n');
  
  const result = await initializeLibrary(projectPath);
  
  if (result.success) {
    console.log('✅', result.message);
    console.log('\nLibrary registry:', result.registryPath);
  } else {
    console.error('❌', result.message);
    process.exit(1);
  }
}

/**
 * List templates command
 * 
 * @param {Object} options - Command options
 * @param {string} options.projectPath - Project root path
 * @param {string} [options.category] - Filter by category
 * @param {string[]} [options.tags] - Filter by tags
 * @param {boolean} [options.json] - Output as JSON
 * @returns {Promise<void>}
 */
export async function listCommand(options) {
  const {
    projectPath = process.cwd(),
    category,
    tags,
    json = false
  } = options;
  
  try {
    let templates;
    
    if (category || tags) {
      templates = await searchTemplates(projectPath, { category, tags });
    } else {
      templates = await listTemplates(projectPath);
    }
    
    if (json) {
      console.log(JSON.stringify(templates, null, 2));
      return;
    }
    
    if (templates.length === 0) {
      console.log('No templates found.');
      return;
    }
    
    console.log(`Found ${templates.length} template(s):\n`);
    
    templates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name} (${template.id})`);
      console.log(`   Category: ${template.category}`);
      console.log(`   Description: ${template.description}`);
      if (template.tags.length > 0) {
        console.log(`   Tags: ${template.tags.join(', ')}`);
      }
      console.log(`   Version: ${template.version}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error listing templates:', error.message);
    process.exit(1);
  }
}

/**
 * Search templates command
 * 
 * @param {Object} options - Command options
 * @param {string} options.projectPath - Project root path
 * @param {string} options.text - Search text
 * @param {string} [options.category] - Filter by category
 * @param {string[]} [options.tags] - Filter by tags
 * @param {boolean} [options.json] - Output as JSON
 * @returns {Promise<void>}
 */
export async function searchCommand(options) {
  const {
    projectPath = process.cwd(),
    text,
    category,
    tags,
    json = false
  } = options;
  
  try {
    const templates = await searchTemplates(projectPath, { text, category, tags });
    
    if (json) {
      console.log(JSON.stringify(templates, null, 2));
      return;
    }
    
    if (templates.length === 0) {
      console.log('No templates found matching your criteria.');
      return;
    }
    
    console.log(`Found ${templates.length} matching template(s):\n`);
    
    templates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name} (${template.id})`);
      console.log(`   Category: ${template.category}`);
      console.log(`   Description: ${template.description}`);
      if (template.tags.length > 0) {
        console.log(`   Tags: ${template.tags.join(', ')}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error searching templates:', error.message);
    process.exit(1);
  }
}

/**
 * Show template details command
 * 
 * @param {Object} options - Command options
 * @param {string} options.projectPath - Project root path
 * @param {string} options.templateId - Template ID
 * @param {boolean} [options.json] - Output as JSON
 * @returns {Promise<void>}
 */
export async function showCommand(options) {
  const {
    projectPath = process.cwd(),
    templateId,
    json = false
  } = options;
  
  try {
    const template = await getTemplate(projectPath, templateId);
    
    if (!template) {
      console.error(`❌ Template '${templateId}' not found.`);
      process.exit(1);
    }
    
    if (json) {
      console.log(JSON.stringify(template, null, 2));
      return;
    }
    
    console.log(`\nTemplate: ${template.name}`);
    console.log('='.repeat(50));
    console.log(`ID: ${template.id}`);
    console.log(`Category: ${template.category}`);
    console.log(`Version: ${template.version}`);
    console.log(`\nDescription:`);
    console.log(`  ${template.description}`);
    console.log(`\nTags: ${template.tags.join(', ')}`);
    console.log(`\nLocation: ${template.location}`);
    
    if (template.requirements) {
      console.log(`\nRequirements:`);
      if (template.requirements.orchestratorVersion) {
        console.log(`  Orchestrator: ${template.requirements.orchestratorVersion}`);
      }
      if (template.requirements.dependencies && template.requirements.dependencies.length > 0) {
        console.log(`  Dependencies:`);
        template.requirements.dependencies.forEach(dep => {
          console.log(`    - ${dep.type}: ${dep.name}@${dep.version}`);
        });
      }
    }
    
    console.log(`\nCreated: ${new Date(template.createdAt).toLocaleString()}`);
    console.log(`Updated: ${new Date(template.updatedAt).toLocaleString()}`);
    console.log('');
  } catch (error) {
    console.error('❌ Error showing template:', error.message);
    process.exit(1);
  }
}

/**
 * Install template command
 * 
 * @param {Object} options - Command options
 * @param {string} options.projectPath - Project root path
 * @param {string} options.templateId - Template ID to install
 * @param {string} options.destination - Destination directory
 * @param {Object} [options.variables] - Template variables
 * @param {boolean} [options.overwrite] - Allow overwriting
 * @returns {Promise<void>}
 */
export async function installCommand(options) {
  const {
    projectPath = process.cwd(),
    templateId,
    destination,
    variables = {},
    overwrite = false
  } = options;
  
  console.log(`Installing template '${templateId}' to '${destination}'...\n`);
  
  const result = await installTemplate(
    projectPath,
    templateId,
    destination,
    { variables, overwrite }
  );
  
  if (result.success) {
    console.log('✅', result.message);
    console.log('\nInstalled to:', result.location);
    
    if (Object.keys(variables).length > 0) {
      console.log('\nVariables substituted:');
      Object.entries(variables).forEach(([key, value]) => {
        console.log(`  {{${key}}} → ${value}`);
      });
    }
  } else {
    console.error('❌', result.message);
    process.exit(1);
  }
}

/**
 * Create template from directory command
 * 
 * @param {Object} options - Command options
 * @param {string} options.projectPath - Project root path
 * @param {string} options.sourcePath - Source directory path
 * @param {string} options.name - Template name
 * @param {string} options.description - Template description
 * @param {string} options.category - Template category
 * @param {string[]} [options.tags] - Template tags
 * @param {string} [options.version] - Template version
 * @param {string} [options.id] - Template ID (auto-generated if not provided)
 * @returns {Promise<void>}
 */
export async function createCommand(options) {
  const {
    projectPath = process.cwd(),
    sourcePath,
    name,
    description,
    category,
    tags = [],
    version = '1.0.0',
    id
  } = options;
  
  console.log(`Creating template from '${sourcePath}'...\n`);
  
  const metadata = {
    id,
    name,
    description,
    category,
    tags,
    version
  };
  
  const result = await createTemplateFromDirectory(projectPath, sourcePath, metadata);
  
  if (result.success) {
    console.log('✅', result.message);
    console.log('\nTemplate ID:', result.templateId);
  } else {
    console.error('❌', result.message);
    process.exit(1);
  }
}

/**
 * Remove template command
 * 
 * @param {Object} options - Command options
 * @param {string} options.projectPath - Project root path
 * @param {string} options.templateId - Template ID to remove
 * @param {boolean} [options.yes] - Skip confirmation
 * @returns {Promise<void>}
 */
export async function removeCommand(options) {
  const {
    projectPath = process.cwd(),
    templateId,
    yes = false
  } = options;
  
  try {
    // Get template details first
    const template = await getTemplate(projectPath, templateId);
    
    if (!template) {
      console.error(`❌ Template '${templateId}' not found.`);
      process.exit(1);
    }
    
    // Confirm deletion
    if (!yes) {
      console.log(`\nAre you sure you want to remove template '${template.name}' (${templateId})?`);
      console.log('This will remove it from the library registry.');
      console.log('(Use --yes to skip this confirmation)\n');
      
      // In a real CLI, you would prompt for confirmation here
      // For now, we'll just warn that --yes is required
      console.error('❌ Confirmation required. Use --yes to confirm removal.');
      process.exit(1);
    }
    
    const result = await removeTemplate(projectPath, templateId);
    
    if (result.success) {
      console.log('✅', result.message);
    } else {
      console.error('❌', result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error removing template:', error.message);
    process.exit(1);
  }
}

/**
 * List categories command
 * 
 * @param {Object} options - Command options
 * @param {string} options.projectPath - Project root path
 * @param {boolean} [options.json] - Output as JSON
 * @returns {Promise<void>}
 */
export async function categoriesCommand(options) {
  const {
    projectPath = process.cwd(),
    json = false
  } = options;
  
  try {
    const categories = await getCategories(projectPath);
    
    if (json) {
      console.log(JSON.stringify(categories, null, 2));
      return;
    }
    
    console.log(`Available categories:\n`);
    
    categories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name} (${category.id})`);
      console.log(`   ${category.description}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error listing categories:', error.message);
    process.exit(1);
  }
}

export default {
  initCommand,
  listCommand,
  searchCommand,
  showCommand,
  installCommand,
  createCommand,
  removeCommand,
  categoriesCommand
};

