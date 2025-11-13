/**
 * API Backend Template - Claude Skills Generator
 * 
 * Generates Claude skills for API development tasks
 * @module lib/templates/api-backend-skills
 */

import { helpers } from '../utils/template-engine.js';

/**
 * Generate route skill
 * 
 * @param {Object} context - Template context
 * @returns {string} Generated route skill content
 */
export function generateRouteSkill(context) {
  const { framework = 'express' } = context;

  return `/**
 * Generate Route Skill
 * 
 * Creates a new API route with controller and tests
 * 
 * Usage: /generate-route <resourceName>
 * Example: /generate-route user
 */

import fs from 'fs/promises';
import path from 'path';

const TEMPLATE_${framework.toUpperCase()} = \`
/**
 * {{ResourceName}} Routes
 * 
 * API routes for {{resourceName}} resources
 */

${framework === 'fastify' ? `export default async function {{resourceName}}Routes(app, options) {
  // GET /{{resourceName}}s
  app.get('/{{resourceName}}s', async (request, reply) => {
    // TODO: Implement list {{resourceName}}s
    return { {{resourceName}}s: [] };
  });
  
  // GET /{{resourceName}}s/:id
  app.get('/{{resourceName}}s/:id', async (request, reply) => {
    const { id } = request.params;
    // TODO: Implement get {{resourceName}} by ID
    return { {{resourceName}}: { id } };
  });
  
  // POST /{{resourceName}}s
  app.post('/{{resourceName}}s', async (request, reply) => {
    const data = request.body;
    // TODO: Implement create {{resourceName}}
    reply.status(201);
    return { {{resourceName}}: data };
  });
  
  // PUT /{{resourceName}}s/:id
  app.put('/{{resourceName}}s/:id', async (request, reply) => {
    const { id } = request.params;
    const data = request.body;
    // TODO: Implement update {{resourceName}}
    return { {{resourceName}}: { id, ...data } };
  });
  
  // DELETE /{{resourceName}}s/:id
  app.delete('/{{resourceName}}s/:id', async (request, reply) => {
    const { id } = request.params;
    // TODO: Implement delete {{resourceName}}
    reply.status(204);
    return;
  });
}` : `import { Router } from 'express';

const router = Router();

/**
 * GET /{{resourceName}}s
 * List all {{resourceName}}s
 */
router.get('/{{resourceName}}s', async (req, res, next) => {
  try {
    // TODO: Implement list {{resourceName}}s
    res.json({ {{resourceName}}s: [] });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /{{resourceName}}s/:id
 * Get a specific {{resourceName}}
 */
router.get('/{{resourceName}}s/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    // TODO: Implement get {{resourceName}} by ID
    res.json({ {{resourceName}}: { id } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /{{resourceName}}s
 * Create a new {{resourceName}}
 */
router.post('/{{resourceName}}s', async (req, res, next) => {
  try {
    const data = req.body;
    // TODO: Implement create {{resourceName}}
    res.status(201).json({ {{resourceName}}: data });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /{{resourceName}}s/:id
 * Update a {{resourceName}}
 */
router.put('/{{resourceName}}s/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    // TODO: Implement update {{resourceName}}
    res.json({ {{resourceName}}: { id, ...data } });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /{{resourceName}}s/:id
 * Delete a {{resourceName}}
 */
router.delete('/{{resourceName}}s/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    // TODO: Implement delete {{resourceName}}
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;`}
\`;

export async function execute(args) {
  const resourceName = args[0];
  
  if (!resourceName) {
    return {
      success: false,
      message: 'Please provide a resource name, e.g., /generate-route user'
    };
  }
  
  const ResourceName = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
  
  // Generate route file
  const routePath = path.join('src', 'routes', \`\${resourceName}.js\`);
  const routeContent = TEMPLATE_${framework.toUpperCase()}
    .replace(/{{resourceName}}/g, resourceName)
    .replace(/{{ResourceName}}/g, ResourceName);
  
  await fs.writeFile(routePath, routeContent);
  
  return {
    success: true,
    message: \`Created route file: \${routePath}\`,
    files: [routePath]
  };
}
`;
}

/**
 * Generate controller skill
 * 
 * @returns {string} Generated controller skill content
 */
export function generateControllerSkill() {
  return `/**
 * Generate Controller Skill
 * 
 * Creates a new controller file
 * 
 * Usage: /generate-controller <controllerName>
 * Example: /generate-controller user
 */

import fs from 'fs/promises';
import path from 'path';

const TEMPLATE = \`
/**
 * {{ControllerName}} Controller
 * 
 * Handles HTTP requests for {{controllerName}} operations
 */

/**
 * List all {{controllerName}}s
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export async function list{{ControllerName}}s(req, res, next) {
  try {
    // TODO: Implement list logic
    const {{controllerName}}s = [];
    res.json({ {{controllerName}}s });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a specific {{controllerName}}
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export async function get{{ControllerName}}(req, res, next) {
  try {
    const { id } = req.params;
    // TODO: Implement get logic
    const {{controllerName}} = { id };
    res.json({ {{controllerName}} });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new {{controllerName}}
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export async function create{{ControllerName}}(req, res, next) {
  try {
    const data = req.body;
    // TODO: Implement create logic
    const {{controllerName}} = data;
    res.status(201).json({ {{controllerName}} });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a {{controllerName}}
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export async function update{{ControllerName}}(req, res, next) {
  try {
    const { id } = req.params;
    const data = req.body;
    // TODO: Implement update logic
    const {{controllerName}} = { id, ...data };
    res.json({ {{controllerName}} });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a {{controllerName}}
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export async function delete{{ControllerName}}(req, res, next) {
  try {
    const { id } = req.params;
    // TODO: Implement delete logic
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
\`;

export async function execute(args) {
  const controllerName = args[0];
  
  if (!controllerName) {
    return {
      success: false,
      message: 'Please provide a controller name, e.g., /generate-controller user'
    };
  }
  
  const ControllerName = controllerName.charAt(0).toUpperCase() + controllerName.slice(1);
  
  // Generate controller file
  const controllerPath = path.join('src', 'controllers', \`\${controllerName}-controller.js\`);
  const controllerContent = TEMPLATE
    .replace(/{{controllerName}}/g, controllerName)
    .replace(/{{ControllerName}}/g, ControllerName);
  
  await fs.writeFile(controllerPath, controllerContent);
  
  return {
    success: true,
    message: \`Created controller file: \${controllerPath}\`,
    files: [controllerPath]
  };
}
`;
}

/**
 * Generate model skill
 * 
 * @returns {string} Generated model skill content
 */
export function generateModelSkill() {
  return `/**
 * Generate Model Skill
 * 
 * Creates a new data model file
 * 
 * Usage: /generate-model <modelName> [fields]
 * Example: /generate-model user name:string email:string age:number
 */

import fs from 'fs/promises';
import path from 'path';

const TEMPLATE = \`
/**
 * {{ModelName}} Model
 * 
 * Data model for {{modelName}} resources
 */

/**
 * {{ModelName}} class
 */
export class {{ModelName}} {
  constructor(data = {}) {
{{fields}}
  }
  
  /**
   * Validate {{modelName}} data
   * 
   * @returns {{valid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];
    
    // TODO: Add validation logic
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Convert to JSON
   * 
   * @returns {Object}
   */
  toJSON() {
    return {
{{jsonFields}}
    };
  }
}
\`;

export async function execute(args) {
  const [modelName, ...fieldDefs] = args;
  
  if (!modelName) {
    return {
      success: false,
      message: 'Please provide a model name, e.g., /generate-model user name:string email:string'
    };
  }
  
  const ModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
  
  // Parse field definitions
  const fields = fieldDefs.map(def => {
    const [name, type = 'string'] = def.split(':');
    const defaultValue = type === 'number' ? '0' : 
                        type === 'boolean' ? 'false' : 
                        type === 'array' ? '[]' : 
                        type === 'object' ? '{}' : '\\'\\'';
    return {
      name,
      type,
      defaultValue
    };
  });
  
  // Generate constructor fields
  const fieldLines = fields.map(f => 
    \`    this.\${f.name} = data.\${f.name} !== undefined ? data.\${f.name} : \${f.defaultValue};\`
  ).join('\\n');
  
  // Generate JSON fields
  const jsonLines = fields.map(f => 
    \`      \${f.name}: this.\${f.name}\`
  ).join(',\\n');
  
  // Generate model file
  const modelPath = path.join('src', 'models', \`\${modelName}-model.js\`);
  const modelContent = TEMPLATE
    .replace(/{{modelName}}/g, modelName)
    .replace(/{{ModelName}}/g, ModelName)
    .replace(/{{fields}}/g, fieldLines || '    // No fields defined')
    .replace(/{{jsonFields}}/g, jsonLines || '      // No fields defined');
  
  await fs.writeFile(modelPath, modelContent);
  
  return {
    success: true,
    message: \`Created model file: \${modelPath}\`,
    files: [modelPath]
  };
}
`;
}

/**
 * Generate test skill
 * 
 * @param {Object} context - Template context
 * @returns {string} Generated test skill content
 */
export function generateTestSkill(context) {
  const { framework = 'express' } = context;

  return `/**
 * Generate Test Skill
 * 
 * Creates test files for existing code
 * 
 * Usage: /generate-test <type> <name>
 * Example: /generate-test route user
 */

import fs from 'fs/promises';
import path from 'path';

const ROUTE_TEST_TEMPLATE = \`
/**
 * {{ResourceName}} Routes Integration Tests
 */

${framework === 'fastify' ? `import app from '../../src/app.js';

describe('{{ResourceName}} Routes', () => {
  beforeAll(async () => {
    await app.ready();
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('GET /api/{{resourceName}}s', () => {
    it('should return 200 OK', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/{{resourceName}}s'
      });
      
      expect(response.statusCode).toBe(200);
    });
  });
  
  describe('POST /api/{{resourceName}}s', () => {
    it('should create a new {{resourceName}}', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/{{resourceName}}s',
        payload: { name: 'Test' }
      });
      
      expect(response.statusCode).toBe(201);
    });
  });
});` : `import request from 'supertest';
import app from '../../src/app.js';

describe('{{ResourceName}} Routes', () => {
  describe('GET /api/{{resourceName}}s', () => {
    it('should return 200 OK', async () => {
      await request(app)
        .get('/api/{{resourceName}}s')
        .expect(200);
    });
  });
  
  describe('POST /api/{{resourceName}}s', () => {
    it('should create a new {{resourceName}}', async () => {
      await request(app)
        .post('/api/{{resourceName}}s')
        .send({ name: 'Test' })
        .expect(201);
    });
  });
});`}
\`;

export async function execute(args) {
  const [type, name] = args;
  
  if (!type || !name) {
    return {
      success: false,
      message: 'Please provide type and name, e.g., /generate-test route user'
    };
  }
  
  const ResourceName = name.charAt(0).toUpperCase() + name.slice(1);
  
  if (type === 'route') {
    const testPath = path.join('tests', 'integration', \`\${name}.test.js\`);
    const testContent = ROUTE_TEST_TEMPLATE
      .replace(/{{resourceName}}/g, name)
      .replace(/{{ResourceName}}/g, ResourceName);
    
    await fs.writeFile(testPath, testContent);
    
    return {
      success: true,
      message: \`Created test file: \${testPath}\`,
      files: [testPath]
    };
  }
  
  return {
    success: false,
    message: \`Unknown test type: \${type}. Supported types: route\`
  };
}
`;
}

/**
 * Generate pre-commit hook
 * 
 * @returns {string} Generated pre-commit hook content
 */
export function generatePreCommitHook() {
  return `/**
 * Pre-Commit Hook
 * 
 * Runs checks before allowing commits
 */

import { execSync } from 'child_process';

export async function execute() {
  try {
    // Run linter
    console.log('Running ESLint...');
    execSync('npm run lint', { stdio: 'inherit' });
    
    // Run tests
    console.log('Running tests...');
    execSync('npm test', { stdio: 'inherit' });
    
    return {
      success: true,
      message: 'All pre-commit checks passed'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Pre-commit checks failed. Please fix errors before committing.'
    };
  }
}
`;
}

export default {
  generateRouteSkill,
  generateControllerSkill,
  generateModelSkill,
  generateTestSkill,
  generatePreCommitHook
};

