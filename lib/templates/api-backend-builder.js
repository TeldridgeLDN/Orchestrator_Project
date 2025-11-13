/**
 * API Backend Template Builder
 * 
 * Orchestrates the creation of a complete API backend project
 * @module lib/templates/api-backend-builder
 */

import path from 'path';
import { ensureDirectory, writeFileSafe } from '../utils/file-generator.js';
import * as baseTemplates from './api-backend-template.js';
import * as fileTemplates from './api-backend-files.js';
import * as testTemplates from './api-backend-tests.js';
import * as docTemplates from './api-backend-docs.js';

/**
 * Default context values
 */
const DEFAULT_CONTEXT = {
  projectName: 'my-api',
  description: 'RESTful API backend',
  framework: 'express', // 'express' or 'fastify'
  includeDatabase: false,
  author: '',
  license: 'MIT'
};

/**
 * Project directory structure
 */
const DIRECTORY_STRUCTURE = {
  root: [],
  src: [
    'routes',
    'controllers',
    'services',
    'middleware',
    'models',
    'utils',
    'config'
  ],
  tests: [
    'unit',
    'integration'
  ],
  docs: [],
  '.claude': [
    'skills',
    'hooks'
  ]
};

/**
 * Build the complete API backend project
 * 
 * @param {string} targetDir - Target directory for the project
 * @param {Object} context - Template context
 * @returns {Promise<{success: boolean, message: string, files: string[]}>}
 */
export async function buildApiBackend(targetDir, context = {}) {
  const ctx = { ...DEFAULT_CONTEXT, ...context };
  const createdFiles = [];
  
  try {
    // Create directory structure
    await createDirectoryStructure(targetDir);
    
    // Generate root files
    const rootFiles = await generateRootFiles(targetDir, ctx);
    createdFiles.push(...rootFiles);
    
    // Generate source files
    const srcFiles = await generateSourceFiles(targetDir, ctx);
    createdFiles.push(...srcFiles);
    
    // Generate test files
    const testFiles = await generateTestFiles(targetDir, ctx);
    createdFiles.push(...testFiles);
    
    // Generate documentation files
    const docFiles = await generateDocumentationFiles(targetDir, ctx);
    createdFiles.push(...docFiles);
    
    // Generate Claude integration files
    const claudeFiles = await generateClaudeFiles(targetDir, ctx);
    createdFiles.push(...claudeFiles);
    
    return {
      success: true,
      message: `Successfully created API backend project at ${targetDir}`,
      files: createdFiles
    };
  } catch (error) {
    return {
      success: false,
      message: `Error creating API backend project: ${error.message}`,
      error,
      files: createdFiles
    };
  }
}

/**
 * Create directory structure
 * 
 * @param {string} targetDir - Target directory
 * @returns {Promise<void>}
 */
async function createDirectoryStructure(targetDir) {
  // Create root directory
  await ensureDirectory(targetDir);
  
  // Create all subdirectories
  for (const [parent, subdirs] of Object.entries(DIRECTORY_STRUCTURE)) {
    const parentDir = parent === 'root' ? targetDir : path.join(targetDir, parent);
    await ensureDirectory(parentDir);
    
    for (const subdir of subdirs) {
      await ensureDirectory(path.join(parentDir, subdir));
    }
  }
}

/**
 * Generate root files (package.json, README, etc.)
 * 
 * @param {string} targetDir - Target directory
 * @param {Object} context - Template context
 * @returns {Promise<string[]>} Array of created file paths
 */
async function generateRootFiles(targetDir, context) {
  const files = [];
  
  // package.json
  const packageJsonPath = path.join(targetDir, 'package.json');
  await writeFileSafe(packageJsonPath, baseTemplates.generatePackageJson(context));
  files.push(packageJsonPath);
  
  // .env.example
  const envExamplePath = path.join(targetDir, '.env.example');
  await writeFileSafe(envExamplePath, baseTemplates.generateEnvExample(context));
  files.push(envExamplePath);
  
  // .gitignore
  const gitignorePath = path.join(targetDir, '.gitignore');
  await writeFileSafe(gitignorePath, baseTemplates.generateGitignore());
  files.push(gitignorePath);
  
  // README.md
  const readmePath = path.join(targetDir, 'README.md');
  await writeFileSafe(readmePath, baseTemplates.generateReadme(context));
  files.push(readmePath);
  
  // server.js
  const serverPath = path.join(targetDir, 'server.js');
  await writeFileSafe(serverPath, baseTemplates.generateServerFile(context));
  files.push(serverPath);
  
  // jest.config.js
  const jestConfigPath = path.join(targetDir, 'jest.config.js');
  await writeFileSafe(jestConfigPath, testTemplates.generateJestConfig());
  files.push(jestConfigPath);
  
  // .eslintrc.js
  const eslintPath = path.join(targetDir, '.eslintrc.js');
  await writeFileSafe(eslintPath, docTemplates.generateEslintConfig());
  files.push(eslintPath);
  
  // .prettierrc
  const prettierPath = path.join(targetDir, '.prettierrc');
  await writeFileSafe(prettierPath, docTemplates.generatePrettierConfig());
  files.push(prettierPath);
  
  return files;
}

/**
 * Generate source files
 * 
 * @param {string} targetDir - Target directory
 * @param {Object} context - Template context
 * @returns {Promise<string[]>} Array of created file paths
 */
async function generateSourceFiles(targetDir, context) {
  const files = [];
  const srcDir = path.join(targetDir, 'src');
  
  // app.js
  const appPath = path.join(srcDir, 'app.js');
  await writeFileSafe(appPath, baseTemplates.generateAppFile(context));
  files.push(appPath);
  
  // routes/
  const routesIndexPath = path.join(srcDir, 'routes', 'index.js');
  await writeFileSafe(routesIndexPath, fileTemplates.generateRoutesIndex(context));
  files.push(routesIndexPath);
  
  const healthRoutePath = path.join(srcDir, 'routes', 'health.js');
  await writeFileSafe(healthRoutePath, fileTemplates.generateHealthRoute(context));
  files.push(healthRoutePath);
  
  // controllers/
  const controllersIndexPath = path.join(srcDir, 'controllers', 'index.js');
  await writeFileSafe(controllersIndexPath, fileTemplates.generateControllersIndex());
  files.push(controllersIndexPath);
  
  // services/
  const servicesIndexPath = path.join(srcDir, 'services', 'index.js');
  await writeFileSafe(servicesIndexPath, fileTemplates.generateServicesIndex());
  files.push(servicesIndexPath);
  
  // middleware/
  const middlewareIndexPath = path.join(srcDir, 'middleware', 'index.js');
  await writeFileSafe(middlewareIndexPath, fileTemplates.generateMiddlewareIndex());
  files.push(middlewareIndexPath);
  
  const errorHandlerPath = path.join(srcDir, 'middleware', 'error-handler.js');
  await writeFileSafe(errorHandlerPath, fileTemplates.generateErrorHandler(context));
  files.push(errorHandlerPath);
  
  const requestLoggerPath = path.join(srcDir, 'middleware', 'request-logger.js');
  await writeFileSafe(requestLoggerPath, fileTemplates.generateRequestLogger());
  files.push(requestLoggerPath);
  
  // models/
  const modelsIndexPath = path.join(srcDir, 'models', 'index.js');
  await writeFileSafe(modelsIndexPath, fileTemplates.generateModelsIndex());
  files.push(modelsIndexPath);
  
  // utils/
  const utilsIndexPath = path.join(srcDir, 'utils', 'index.js');
  await writeFileSafe(utilsIndexPath, fileTemplates.generateUtilsIndex());
  files.push(utilsIndexPath);
  
  const loggerPath = path.join(srcDir, 'utils', 'logger.js');
  await writeFileSafe(loggerPath, fileTemplates.generateLogger());
  files.push(loggerPath);
  
  // config/
  const configIndexPath = path.join(srcDir, 'config', 'index.js');
  await writeFileSafe(configIndexPath, fileTemplates.generateConfigIndex());
  files.push(configIndexPath);
  
  const databaseConfigPath = path.join(srcDir, 'config', 'database.js');
  await writeFileSafe(databaseConfigPath, fileTemplates.generateDatabaseConfig());
  files.push(databaseConfigPath);
  
  return files;
}

/**
 * Generate test files
 * 
 * @param {string} targetDir - Target directory
 * @param {Object} context - Template context
 * @returns {Promise<string[]>} Array of created file paths
 */
async function generateTestFiles(targetDir, context) {
  const files = [];
  const testsDir = path.join(targetDir, 'tests');
  
  // setup.js
  const setupPath = path.join(testsDir, 'setup.js');
  await writeFileSafe(setupPath, testTemplates.generateTestSetup());
  files.push(setupPath);
  
  // unit/example.test.js
  const unitTestPath = path.join(testsDir, 'unit', 'example.test.js');
  await writeFileSafe(unitTestPath, testTemplates.generateExampleUnitTest());
  files.push(unitTestPath);
  
  // integration/health.test.js
  const integrationTestPath = path.join(testsDir, 'integration', 'health.test.js');
  await writeFileSafe(integrationTestPath, testTemplates.generateHealthIntegrationTest(context));
  files.push(integrationTestPath);
  
  return files;
}

/**
 * Generate documentation files
 * 
 * @param {string} targetDir - Target directory
 * @param {Object} context - Template context
 * @returns {Promise<string[]>} Array of created file paths
 */
async function generateDocumentationFiles(targetDir, context) {
  const files = [];
  const docsDir = path.join(targetDir, 'docs');
  
  // api.md
  const apiDocsPath = path.join(docsDir, 'api.md');
  await writeFileSafe(apiDocsPath, docTemplates.generateApiDocs(context));
  files.push(apiDocsPath);
  
  // development.md
  const devDocsPath = path.join(docsDir, 'development.md');
  await writeFileSafe(devDocsPath, docTemplates.generateDevelopmentDocs(context));
  files.push(devDocsPath);
  
  return files;
}

/**
 * Generate Claude integration files
 * 
 * @param {string} targetDir - Target directory
 * @param {Object} context - Template context
 * @returns {Promise<string[]>} Array of created file paths
 */
async function generateClaudeFiles(targetDir, context) {
  const files = [];
  const claudeDir = path.join(targetDir, '.claude');
  
  // config.json
  const configPath = path.join(claudeDir, 'config.json');
  await writeFileSafe(configPath, docTemplates.generateClaudeConfig(context));
  files.push(configPath);
  
  // Create placeholder files for skills and hooks
  // These will be generated by specific skills
  
  return files;
}

/**
 * Validate template context
 * 
 * @param {Object} context - Template context to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateContext(context) {
  const errors = [];
  
  if (context.projectName && !/^[a-z0-9-]+$/.test(context.projectName)) {
    errors.push('Project name must be lowercase with hyphens only');
  }
  
  if (context.framework && !['express', 'fastify'].includes(context.framework)) {
    errors.push('Framework must be either "express" or "fastify"');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export default {
  buildApiBackend,
  validateContext,
  DEFAULT_CONTEXT
};

