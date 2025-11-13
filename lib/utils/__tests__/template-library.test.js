/**
 * Tests for Template Library Module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
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
} from '../template-library.js';

describe('Template Library', () => {
  let testDir;
  
  beforeEach(async () => {
    // Create a temporary test directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'template-lib-test-'));
  });
  
  afterEach(async () => {
    // Clean up test directory
    if (testDir) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });
  
  describe('initializeLibrary', () => {
    it('should create a new template library', async () => {
      const result = await initializeLibrary(testDir);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('initialized successfully');
      expect(result.registryPath).toBeDefined();
      
      // Verify file was created
      const registryPath = path.join(testDir, '.orchestrator/template-library.json');
      const exists = await fs.access(registryPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
    
    it('should fail if library already exists', async () => {
      await initializeLibrary(testDir);
      const result = await initializeLibrary(testDir);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
    });
    
    it('should create default categories', async () => {
      await initializeLibrary(testDir);
      const library = await readLibrary(testDir);
      
      expect(library.categories).toBeDefined();
      expect(library.categories.length).toBeGreaterThan(0);
      
      const categoryIds = library.categories.map(cat => cat.id);
      expect(categoryIds).toContain('web');
      expect(categoryIds).toContain('api');
      expect(categoryIds).toContain('cli');
    });
  });
  
  describe('readLibrary', () => {
    it('should read an existing library', async () => {
      await initializeLibrary(testDir);
      const library = await readLibrary(testDir);
      
      expect(library).toBeDefined();
      expect(library.version).toBe('1.0.0');
      expect(library.templates).toBeDefined();
      expect(library.categories).toBeDefined();
    });
    
    it('should throw error if library does not exist', async () => {
      await expect(readLibrary(testDir)).rejects.toThrow('not initialized');
    });
  });
  
  describe('addTemplate', () => {
    beforeEach(async () => {
      await initializeLibrary(testDir);
    });
    
    it('should add a new template', async () => {
      const template = {
        id: 'test-template',
        name: 'Test Template',
        description: 'A test template',
        category: 'web',
        tags: ['test', 'example'],
        version: '1.0.0',
        location: '/path/to/template',
        requirements: {
          orchestratorVersion: '^1.0.0',
          dependencies: []
        }
      };
      
      const result = await addTemplate(testDir, template);
      
      expect(result.success).toBe(true);
      expect(result.templateId).toBe('test-template');
      
      // Verify template was added
      const retrieved = await getTemplate(testDir, 'test-template');
      expect(retrieved).toBeDefined();
      expect(retrieved.name).toBe('Test Template');
      expect(retrieved.createdAt).toBeDefined();
      expect(retrieved.updatedAt).toBeDefined();
    });
    
    it('should fail if template ID already exists', async () => {
      const template = {
        id: 'duplicate',
        name: 'Template 1',
        description: 'First template',
        category: 'web',
        tags: [],
        version: '1.0.0',
        location: '/path/1'
      };
      
      await addTemplate(testDir, template);
      const result = await addTemplate(testDir, template);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
    });
  });
  
  describe('removeTemplate', () => {
    beforeEach(async () => {
      await initializeLibrary(testDir);
      await addTemplate(testDir, {
        id: 'removable',
        name: 'Removable Template',
        description: 'Will be removed',
        category: 'web',
        tags: [],
        version: '1.0.0',
        location: '/path/removable'
      });
    });
    
    it('should remove an existing template', async () => {
      const result = await removeTemplate(testDir, 'removable');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('removed successfully');
      
      // Verify template was removed
      const retrieved = await getTemplate(testDir, 'removable');
      expect(retrieved).toBeNull();
    });
    
    it('should fail if template does not exist', async () => {
      const result = await removeTemplate(testDir, 'non-existent');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });
  
  describe('getTemplate', () => {
    beforeEach(async () => {
      await initializeLibrary(testDir);
      await addTemplate(testDir, {
        id: 'get-test',
        name: 'Get Test Template',
        description: 'For testing get',
        category: 'api',
        tags: ['test'],
        version: '1.0.0',
        location: '/path/get-test'
      });
    });
    
    it('should retrieve an existing template', async () => {
      const template = await getTemplate(testDir, 'get-test');
      
      expect(template).toBeDefined();
      expect(template.id).toBe('get-test');
      expect(template.name).toBe('Get Test Template');
    });
    
    it('should return null for non-existent template', async () => {
      const template = await getTemplate(testDir, 'non-existent');
      
      expect(template).toBeNull();
    });
  });
  
  describe('updateTemplate', () => {
    beforeEach(async () => {
      await initializeLibrary(testDir);
      await addTemplate(testDir, {
        id: 'update-test',
        name: 'Original Name',
        description: 'Original description',
        category: 'web',
        tags: ['original'],
        version: '1.0.0',
        location: '/path/original'
      });
    });
    
    it('should update template fields', async () => {
      const result = await updateTemplate(testDir, 'update-test', {
        name: 'Updated Name',
        description: 'Updated description',
        tags: ['updated', 'modified']
      });
      
      expect(result.success).toBe(true);
      
      const template = await getTemplate(testDir, 'update-test');
      expect(template.name).toBe('Updated Name');
      expect(template.description).toBe('Updated description');
      expect(template.tags).toEqual(['updated', 'modified']);
    });
    
    it('should not update protected fields', async () => {
      const originalTemplate = await getTemplate(testDir, 'update-test');
      
      await updateTemplate(testDir, 'update-test', {
        id: 'hacked-id',
        createdAt: '2000-01-01T00:00:00Z'
      });
      
      const template = await getTemplate(testDir, 'update-test');
      expect(template.id).toBe('update-test'); // Not changed
      expect(template.createdAt).toBe(originalTemplate.createdAt); // Not changed
    });
    
    it('should update the updatedAt timestamp', async () => {
      const before = await getTemplate(testDir, 'update-test');
      
      // Wait a tiny bit to ensure timestamp differs
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await updateTemplate(testDir, 'update-test', {
        description: 'New description'
      });
      
      const after = await getTemplate(testDir, 'update-test');
      expect(after.updatedAt).not.toBe(before.updatedAt);
    });
    
    it('should fail if template does not exist', async () => {
      const result = await updateTemplate(testDir, 'non-existent', {
        name: 'New Name'
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });
  
  describe('listTemplates', () => {
    beforeEach(async () => {
      await initializeLibrary(testDir);
    });
    
    it('should return empty array for new library', async () => {
      const templates = await listTemplates(testDir);
      
      expect(templates).toEqual([]);
    });
    
    it('should list all templates', async () => {
      await addTemplate(testDir, {
        id: 'template-1',
        name: 'Template 1',
        description: 'First template',
        category: 'web',
        tags: [],
        version: '1.0.0',
        location: '/path/1'
      });
      
      await addTemplate(testDir, {
        id: 'template-2',
        name: 'Template 2',
        description: 'Second template',
        category: 'api',
        tags: [],
        version: '1.0.0',
        location: '/path/2'
      });
      
      const templates = await listTemplates(testDir);
      
      expect(templates).toHaveLength(2);
      expect(templates.map(t => t.id)).toContain('template-1');
      expect(templates.map(t => t.id)).toContain('template-2');
    });
  });
  
  describe('searchTemplates', () => {
    beforeEach(async () => {
      await initializeLibrary(testDir);
      
      // Add test templates
      await addTemplate(testDir, {
        id: 'react-app',
        name: 'React Web App',
        description: 'A modern React application template',
        category: 'web',
        tags: ['react', 'frontend', 'spa'],
        version: '1.0.0',
        location: '/templates/react-app'
      });
      
      await addTemplate(testDir, {
        id: 'express-api',
        name: 'Express API',
        description: 'RESTful API built with Express',
        category: 'api',
        tags: ['express', 'backend', 'rest'],
        version: '1.0.0',
        location: '/templates/express-api'
      });
      
      await addTemplate(testDir, {
        id: 'react-native',
        name: 'React Native App',
        description: 'Mobile app template with React Native',
        category: 'web',
        tags: ['react', 'mobile', 'ios', 'android'],
        version: '1.0.0',
        location: '/templates/react-native'
      });
    });
    
    it('should return all templates with no query', async () => {
      const results = await searchTemplates(testDir, {});
      
      expect(results).toHaveLength(3);
    });
    
    it('should search by text in name', async () => {
      const results = await searchTemplates(testDir, { text: 'react' });
      
      expect(results).toHaveLength(2);
      expect(results.map(t => t.id)).toContain('react-app');
      expect(results.map(t => t.id)).toContain('react-native');
    });
    
    it('should search by text in description', async () => {
      const results = await searchTemplates(testDir, { text: 'RESTful' });
      
      expect(results).toHaveLength(1); // Express API mentions RESTful in description
      expect(results[0].id).toBe('express-api');
    });
    
    it('should be case-insensitive', async () => {
      const results = await searchTemplates(testDir, { text: 'REACT' });
      
      expect(results).toHaveLength(2);
    });
    
    it('should filter by category', async () => {
      const results = await searchTemplates(testDir, { category: 'api' });
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('express-api');
    });
    
    it('should filter by single tag', async () => {
      const results = await searchTemplates(testDir, { tags: ['mobile'] });
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('react-native');
    });
    
    it('should filter by multiple tags (AND logic)', async () => {
      const results = await searchTemplates(testDir, { 
        tags: ['react', 'frontend'] 
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('react-app');
    });
    
    it('should combine multiple filters', async () => {
      const results = await searchTemplates(testDir, {
        text: 'react',
        category: 'web',
        tags: ['mobile']
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('react-native');
    });
    
    it('should return empty array if no matches', async () => {
      const results = await searchTemplates(testDir, {
        text: 'nonexistent'
      });
      
      expect(results).toEqual([]);
    });
  });
  
  describe('getCategories', () => {
    beforeEach(async () => {
      await initializeLibrary(testDir);
    });
    
    it('should return default categories', async () => {
      const categories = await getCategories(testDir);
      
      expect(categories).toBeDefined();
      expect(categories.length).toBeGreaterThan(0);
      
      const webCategory = categories.find(cat => cat.id === 'web');
      expect(webCategory).toBeDefined();
      expect(webCategory.name).toBeDefined();
      expect(webCategory.description).toBeDefined();
    });
  });
  
  describe('addCategory', () => {
    beforeEach(async () => {
      await initializeLibrary(testDir);
    });
    
    it('should add a custom category', async () => {
      const category = {
        id: 'custom',
        name: 'Custom Category',
        description: 'A custom category for testing'
      };
      
      const result = await addCategory(testDir, category);
      
      expect(result.success).toBe(true);
      
      const categories = await getCategories(testDir);
      const added = categories.find(cat => cat.id === 'custom');
      expect(added).toBeDefined();
      expect(added.name).toBe('Custom Category');
    });
    
    it('should fail if category ID already exists', async () => {
      const result = await addCategory(testDir, {
        id: 'web', // Already exists
        name: 'Duplicate Web',
        description: 'Duplicate category'
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
    });
  });
  
  describe('installTemplate', () => {
    let templateSourceDir;
    let installDestDir;
    
    beforeEach(async () => {
      await initializeLibrary(testDir);
      
      // Create a template source directory
      templateSourceDir = path.join(testDir, 'template-source');
      await fs.mkdir(templateSourceDir, { recursive: true });
      
      // Create template files
      await fs.writeFile(
        path.join(templateSourceDir, 'README.md'),
        '# {{PROJECT_NAME}}\n\n{{PROJECT_DESCRIPTION}}',
        'utf-8'
      );
      
      await fs.mkdir(path.join(templateSourceDir, 'src'), { recursive: true });
      await fs.writeFile(
        path.join(templateSourceDir, 'src', 'index.js'),
        'console.log("{{PROJECT_NAME}}");',
        'utf-8'
      );
      
      // Add template to library
      await addTemplate(testDir, {
        id: 'test-install',
        name: 'Test Install Template',
        description: 'Template for testing installation',
        category: 'web',
        tags: ['test'],
        version: '1.0.0',
        location: 'template-source'
      });
      
      // Install destination
      installDestDir = path.join(testDir, 'installed-project');
    });
    
    it('should install a template to destination', async () => {
      const result = await installTemplate(testDir, 'test-install', installDestDir);
      
      expect(result.success).toBe(true);
      expect(result.location).toBe(installDestDir);
      
      // Verify files were copied
      const readmeExists = await fs.access(path.join(installDestDir, 'README.md'))
        .then(() => true).catch(() => false);
      expect(readmeExists).toBe(true);
      
      const indexExists = await fs.access(path.join(installDestDir, 'src', 'index.js'))
        .then(() => true).catch(() => false);
      expect(indexExists).toBe(true);
    });
    
    it('should substitute template variables', async () => {
      const result = await installTemplate(
        testDir, 
        'test-install', 
        installDestDir,
        {
          variables: {
            PROJECT_NAME: 'My Awesome Project',
            PROJECT_DESCRIPTION: 'This is a test project'
          }
        }
      );
      
      expect(result.success).toBe(true);
      
      // Check README content
      const readmeContent = await fs.readFile(
        path.join(installDestDir, 'README.md'),
        'utf-8'
      );
      expect(readmeContent).toContain('# My Awesome Project');
      expect(readmeContent).toContain('This is a test project');
      
      // Check index.js content
      const indexContent = await fs.readFile(
        path.join(installDestDir, 'src', 'index.js'),
        'utf-8'
      );
      expect(indexContent).toContain('console.log("My Awesome Project");');
    });
    
    it('should fail if template does not exist', async () => {
      const result = await installTemplate(testDir, 'non-existent', installDestDir);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
    
    it('should fail if destination exists and overwrite is false', async () => {
      // Create destination
      await fs.mkdir(installDestDir, { recursive: true });
      
      const result = await installTemplate(testDir, 'test-install', installDestDir);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
    });
    
    it('should overwrite destination if overwrite is true', async () => {
      // Create destination with existing file
      await fs.mkdir(installDestDir, { recursive: true });
      await fs.writeFile(path.join(installDestDir, 'existing.txt'), 'old content', 'utf-8');
      
      const result = await installTemplate(
        testDir, 
        'test-install', 
        installDestDir,
        { overwrite: true }
      );
      
      expect(result.success).toBe(true);
    });
  });
  
  describe('createTemplateFromDirectory', () => {
    let sourceDir;
    
    beforeEach(async () => {
      await initializeLibrary(testDir);
      
      // Create a source directory
      sourceDir = path.join(testDir, 'my-project');
      await fs.mkdir(sourceDir, { recursive: true });
      
      // Create some files
      await fs.writeFile(
        path.join(sourceDir, 'package.json'),
        '{"name": "test-project"}',
        'utf-8'
      );
      
      await fs.mkdir(path.join(sourceDir, 'src'), { recursive: true });
      await fs.writeFile(
        path.join(sourceDir, 'src', 'main.js'),
        'console.log("Hello");',
        'utf-8'
      );
    });
    
    it('should create a template from directory', async () => {
      const metadata = {
        name: 'My Project Template',
        description: 'Template created from my-project',
        category: 'web',
        tags: ['project', 'example'],
        version: '1.0.0'
      };
      
      const result = await createTemplateFromDirectory(testDir, sourceDir, metadata);
      
      expect(result.success).toBe(true);
      expect(result.templateId).toBeDefined();
      
      // Verify template was added to library
      const template = await getTemplate(testDir, result.templateId);
      expect(template).toBeDefined();
      expect(template.name).toBe('My Project Template');
      
      // Verify files were copied
      const templatePath = path.join(testDir, template.location);
      const packageExists = await fs.access(path.join(templatePath, 'package.json'))
        .then(() => true).catch(() => false);
      expect(packageExists).toBe(true);
    });
    
    it('should generate ID from name if not provided', async () => {
      const metadata = {
        name: 'My Awesome Template!',
        description: 'Test template',
        category: 'web',
        tags: [],
        version: '1.0.0'
      };
      
      const result = await createTemplateFromDirectory(testDir, sourceDir, metadata);
      
      expect(result.success).toBe(true);
      expect(result.templateId).toBe('my-awesome-template');
    });
    
    it('should fail if source directory does not exist', async () => {
      const result = await createTemplateFromDirectory(
        testDir,
        path.join(testDir, 'nonexistent'),
        {
          name: 'Test',
          description: 'Test',
          category: 'web',
          tags: [],
          version: '1.0.0'
        }
      );
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
    
    it('should fail if template directory already exists', async () => {
      const metadata = {
        id: 'duplicate-template',
        name: 'Duplicate',
        description: 'First template',
        category: 'web',
        tags: [],
        version: '1.0.0'
      };
      
      // Create first template
      await createTemplateFromDirectory(testDir, sourceDir, metadata);
      
      // Try to create again with same ID
      const result = await createTemplateFromDirectory(testDir, sourceDir, metadata);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
    });
  });
});

