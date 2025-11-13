#!/usr/bin/env node

/**
 * Template Library Example
 * 
 * Demonstrates how to use the template library for managing personal templates.
 * 
 * Usage:
 *   node examples/template-library-example.js
 */

import path from 'path';
import { fileURLToPath } from 'url';
import {
  initializeLibrary,
  addTemplate,
  listTemplates,
  searchTemplates,
  getTemplate,
  installTemplate,
  createTemplateFromDirectory
} from '../lib/utils/template-library.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Example project root (for demo purposes)
const projectRoot = path.join(__dirname, '..');

async function runExample() {
  console.log('Template Library Example');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // Step 1: Initialize library (if not already initialized)
    console.log('1. Initializing template library...');
    const initResult = await initializeLibrary(projectRoot);
    console.log('  ', initResult.message);
    console.log('');
    
    // Step 2: Add a custom template
    console.log('2. Adding a custom template...');
    const addResult = await addTemplate(projectRoot, {
      id: 'express-api-basic',
      name: 'Express API Basic',
      description: 'A basic Express.js REST API template',
      category: 'api',
      tags: ['express', 'rest', 'api', 'backend'],
      version: '1.0.0',
      location: './templates/express-api-basic', // Relative path
      requirements: {
        orchestratorVersion: '^1.0.0',
        dependencies: [
          { type: 'npm', name: 'express', version: '^4.18.0' },
          { type: 'npm', name: 'dotenv', version: '^16.0.0' }
        ]
      }
    });
    console.log('  ', addResult.message);
    console.log('');
    
    // Step 3: List all templates
    console.log('3. Listing all templates...');
    const templates = await listTemplates(projectRoot);
    console.log(`   Found ${templates.length} template(s):`);
    templates.forEach(t => {
      console.log(`   - ${t.name} (${t.id})`);
    });
    console.log('');
    
    // Step 4: Search templates by tag
    console.log('4. Searching for templates with tag "api"...');
    const apiTemplates = await searchTemplates(projectRoot, { tags: ['api'] });
    console.log(`   Found ${apiTemplates.length} template(s):`);
    apiTemplates.forEach(t => {
      console.log(`   - ${t.name}`);
    });
    console.log('');
    
    // Step 5: Get specific template
    console.log('5. Getting template details...');
    const template = await getTemplate(projectRoot, 'express-api-basic');
    if (template) {
      console.log(`   Name: ${template.name}`);
      console.log(`   Description: ${template.description}`);
      console.log(`   Category: ${template.category}`);
      console.log(`   Tags: ${template.tags.join(', ')}`);
    }
    console.log('');
    
    // Step 6: Install template (demonstration - commented out to prevent actual installation)
    console.log('6. Installing template (demo)...');
    console.log('   To install a template, use:');
    console.log('   ```javascript');
    console.log('   const result = await installTemplate(');
    console.log('     projectRoot,');
    console.log('     "express-api-basic",');
    console.log('     "/path/to/destination",');
    console.log('     {');
    console.log('       variables: {');
    console.log('         PROJECT_NAME: "My API",');
    console.log('         PORT: "3000"');
    console.log('       }');
    console.log('     }');
    console.log('   );');
    console.log('   ```');
    console.log('');
    
    // Step 7: Create template from directory (demonstration)
    console.log('7. Creating template from directory (demo)...');
    console.log('   To create a template from an existing directory, use:');
    console.log('   ```javascript');
    console.log('   const result = await createTemplateFromDirectory(');
    console.log('     projectRoot,');
    console.log('     "/path/to/source",');
    console.log('     {');
    console.log('       name: "My Template",');
    console.log('       description: "A custom template",');
    console.log('       category: "web",');
    console.log('       tags: ["custom"],');
    console.log('       version: "1.0.0"');
    console.log('     }');
    console.log('   );');
    console.log('   ```');
    console.log('');
    
    console.log('='.repeat(60));
    console.log('Example completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('- Create your own templates in the templates directory');
    console.log('- Use the template commands to manage your library');
    console.log('- Install templates to start new projects quickly');
    console.log('');
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Library already initialized (this is normal)');
      console.log('');
      console.log('The example demonstrates:');
      console.log('- How to initialize a template library');
      console.log('- How to add templates programmatically');
      console.log('- How to list, search, and retrieve templates');
      console.log('- How to install and create templates');
      console.log('');
    } else {
      console.error('❌ Error running example:', error.message);
      process.exit(1);
    }
  }
}

// Run the example
runExample();

