/**
 * API Backend Template - Documentation Generator
 * 
 * Generates documentation and Claude integration files
 * @module lib/templates/api-backend-docs
 */

/**
 * Generate docs/api.md
 * 
 * @param {Object} context - Template context
 * @returns {string} Generated API documentation content
 */
export function generateApiDocs(context) {
  const { projectName = 'API Backend' } = context;

  return `# ${projectName} - API Reference

## Base URL

\`\`\`
http://localhost:3000/api
\`\`\`

## Authentication

Currently, this API does not require authentication. When implementing authentication:

1. Add authentication middleware
2. Protect routes with authentication
3. Document authentication requirements here

## Endpoints

### Health Check

#### GET /health

Check if the API is healthy and running.

**Response**

\`\`\`json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
\`\`\`

**Status Codes**

- \`200 OK\` - Service is healthy

---

#### GET /health/ready

Check if the API is ready to accept traffic.

**Response**

\`\`\`json
{
  "ready": true,
  "checks": {
    "server": true,
    "database": true
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
\`\`\`

**Status Codes**

- \`200 OK\` - Service is ready
- \`503 Service Unavailable\` - Service is not ready

---

## Error Responses

All error responses follow this format:

\`\`\`json
{
  "error": {
    "message": "Error description",
    "statusCode": 400
  }
}
\`\`\`

### Common Status Codes

- \`200 OK\` - Request successful
- \`201 Created\` - Resource created successfully
- \`400 Bad Request\` - Invalid request data
- \`401 Unauthorized\` - Authentication required
- \`403 Forbidden\` - Insufficient permissions
- \`404 Not Found\` - Resource not found
- \`429 Too Many Requests\` - Rate limit exceeded
- \`500 Internal Server Error\` - Server error

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Limit:** 100 requests
- **Window:** 15 minutes
- **Headers:** Rate limit info included in response headers

When rate limit is exceeded, you'll receive a \`429 Too Many Requests\` response.

## Versioning

The API uses URL path versioning:

\`\`\`
/api/v1/...
\`\`\`

## Best Practices

1. **Use appropriate HTTP methods**
   - GET for retrieving data
   - POST for creating resources
   - PUT for updating resources
   - DELETE for removing resources

2. **Handle errors gracefully**
   - Check status codes
   - Read error messages
   - Implement retry logic for transient errors

3. **Respect rate limits**
   - Monitor rate limit headers
   - Implement backoff strategies

4. **Keep connections alive**
   - Use keep-alive connections
   - Implement connection pooling

## Examples

### Using cURL

\`\`\`bash
# Health check
curl http://localhost:3000/api/health

# With headers
curl -H "Content-Type: application/json" \\
     http://localhost:3000/api/health
\`\`\`

### Using JavaScript (fetch)

\`\`\`javascript
const response = await fetch('http://localhost:3000/api/health');
const data = await response.json();
console.log(data);
\`\`\`

### Using Node.js (axios)

\`\`\`javascript
import axios from 'axios';

const response = await axios.get('http://localhost:3000/api/health');
console.log(response.data);
\`\`\`
`;
}

/**
 * Generate docs/development.md
 * 
 * @param {Object} context - Template context
 * @returns {string} Generated development guide content
 */
export function generateDevelopmentDocs(context) {
  const { projectName = 'API Backend', framework = 'express' } = context;

  return `# ${projectName} - Development Guide

## Architecture

This API follows a **layered architecture** pattern:

\`\`\`
┌─────────────────┐
│   Routes        │ ← HTTP endpoints
├─────────────────┤
│   Controllers   │ ← Request handling
├─────────────────┤
│   Services      │ ← Business logic
├─────────────────┤
│   Models        │ ← Data access
└─────────────────┘
\`\`\`

### Layers

1. **Routes** - Define API endpoints and HTTP methods
2. **Controllers** - Handle HTTP requests/responses
3. **Services** - Implement business logic
4. **Models** - Define data structures and database access

## Project Structure

\`\`\`
src/
├── app.js              # Application setup
├── routes/             # API endpoints
│   ├── index.js        # Route registration
│   └── health.js       # Health check routes
├── controllers/        # Request handlers
├── services/           # Business logic
├── middleware/         # Custom middleware
│   ├── error-handler.js
│   └── request-logger.js
├── models/             # Data models
├── config/             # Configuration
│   ├── index.js        # Main config
│   └── database.js     # Database config
└── utils/              # Utilities
    └── logger.js       # Logging
\`\`\`

## Development Workflow

### 1. Adding a New Route

1. **Create route file** in \`src/routes/\`
2. **Create controller** in \`src/controllers/\`
3. **Create service** (if needed) in \`src/services/\`
4. **Register route** in \`src/routes/index.js\`
5. **Add tests** in \`tests/integration/\`

### 2. Adding Middleware

1. **Create middleware file** in \`src/middleware/\`
2. **Export middleware** in \`src/middleware/index.js\`
3. **Register in app.js** or specific routes
4. **Add tests** in \`tests/unit/\`

### 3. Adding Configuration

1. **Add to \`.env.example\`**
2. **Update \`src/config/index.js\`**
3. **Document in README.md**

## Code Style

### Naming Conventions

- **Files:** kebab-case (e.g., \`user-controller.js\`)
- **Variables/Functions:** camelCase (e.g., \`getUserById\`)
- **Classes:** PascalCase (e.g., \`UserService\`)
- **Constants:** UPPER_SNAKE_CASE (e.g., \`MAX_RETRIES\`)

### File Structure

\`\`\`javascript
/**
 * Module description
 */

// Imports
import express from 'express';

// Constants
const MAX_ITEMS = 100;

// Helper functions
function helperFunction() {
  // ...
}

// Exported functions
export function mainFunction() {
  // ...
}

// Default export
export default {
  mainFunction
};
\`\`\`

## Testing Strategy

### Unit Tests

Test individual functions in isolation:

\`\`\`javascript
import { someFunction } from '../src/utils/helpers.js';

describe('someFunction', () => {
  it('should return expected result', () => {
    expect(someFunction(input)).toBe(expected);
  });
});
\`\`\`

### Integration Tests

Test complete request/response cycles:

\`\`\`javascript
import request from 'supertest';
import app from '../src/app.js';

describe('GET /api/endpoint', () => {
  it('should return 200 OK', async () => {
    await request(app)
      .get('/api/endpoint')
      .expect(200);
  });
});
\`\`\`

### Coverage Goals

- **Statements:** 70%
- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%

## Error Handling

### Creating Custom Errors

\`\`\`javascript
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}
\`\`\`

### Throwing Errors

\`\`\`javascript
export function getUser(id) {
  const user = findUser(id);
  
  if (!user) {
    throw new NotFoundError(\`User \${id} not found\`);
  }
  
  return user;
}
\`\`\`

### Async Error Handling

${framework === 'fastify' ? `Fastify automatically handles async errors. Just throw or let promises reject:

\`\`\`javascript
app.get('/api/user/:id', async (request, reply) => {
  const user = await getUserById(request.params.id);
  // If getUserById throws, Fastify will catch it
  return user;
});
\`\`\`` : `Use try-catch or pass errors to \`next()\`:

\`\`\`javascript
router.get('/api/user/:id', async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    next(error); // Pass to error handler
  }
});
\`\`\``}

## Logging

### Log Levels

- **error:** Critical errors requiring attention
- **warn:** Warning messages
- **info:** General informational messages
- **debug:** Detailed debug information

### Usage

\`\`\`javascript
import logger from './utils/logger.js';

logger.info('User created', { userId: 123 });
logger.error('Database connection failed', { error });
\`\`\`

## Environment Variables

### Required Variables

- \`NODE_ENV\` - Environment (development, production, test)
- \`PORT\` - Server port
- \`DATABASE_URL\` - Database connection string

### Optional Variables

- \`LOG_LEVEL\` - Logging level (default: info)
- \`CORS_ORIGIN\` - CORS origin (default: *)
- \`RATE_LIMIT_MAX\` - Max requests per window (default: 100)

## Database

### Migrations

TODO: Add migration instructions when database is implemented

### Seeding

TODO: Add seed data instructions when database is implemented

## Deployment

### Build Process

1. Install dependencies:
\`\`\`bash
npm ci
\`\`\`

2. Run tests:
\`\`\`bash
npm test
\`\`\`

3. Start server:
\`\`\`bash
npm start
\`\`\`

### Environment Setup

1. Set all required environment variables
2. Ensure database is accessible
3. Configure external services

### Health Checks

Use \`/api/health\` and \`/api/health/ready\` endpoints for:

- Load balancer health checks
- Kubernetes liveness/readiness probes
- Monitoring systems

## Common Tasks

### Adding a New Endpoint

1. Create route handler
2. Add business logic to service
3. Write tests
4. Update API documentation

### Debugging

1. Set \`LOG_LEVEL=debug\` in \`.env\`
2. Check logs for detailed information
3. Use debugger with Node.js:
\`\`\`bash
node --inspect server.js
\`\`\`

### Performance Optimization

1. Enable compression (already configured)
2. Implement caching where appropriate
3. Use connection pooling for database
4. Monitor with profiling tools

## Resources

- [${framework === 'fastify' ? 'Fastify' : 'Express'} Documentation](${framework === 'fastify' ? 'https://www.fastify.io/' : 'https://expressjs.com/'})
- [Jest Testing Guide](https://jestjs.io/)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
`;
}

/**
 * Generate .claude/config.json
 * 
 * @param {Object} context - Template context
 * @returns {string} Generated Claude config content
 */
export function generateClaudeConfig(context) {
  const { projectName = 'api-backend' } = context;

  const config = {
    name: projectName,
    description: 'API backend project with Claude Orchestrator integration',
    version: '1.0.0',
    skills: [
      {
        id: 'generate-route',
        name: 'Generate Route',
        description: 'Generate a new API route with controller and tests',
        path: '.claude/skills/generate-route.js'
      },
      {
        id: 'generate-controller',
        name: 'Generate Controller',
        description: 'Generate a new controller',
        path: '.claude/skills/generate-controller.js'
      },
      {
        id: 'generate-model',
        name: 'Generate Model',
        description: 'Generate a new data model',
        path: '.claude/skills/generate-model.js'
      },
      {
        id: 'generate-test',
        name: 'Generate Test',
        description: 'Generate tests for existing code',
        path: '.claude/skills/generate-test.js'
      }
    ],
    hooks: [
      {
        id: 'pre-commit',
        type: 'git',
        event: 'pre-commit',
        path: '.claude/hooks/pre-commit.js'
      }
    ]
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Generate ESLint configuration
 * 
 * @returns {string} Generated ESLint config content
 */
export function generateEslintConfig() {
  return `export default {
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'off'
  }
};
`;
}

/**
 * Generate Prettier configuration
 * 
 * @returns {string} Generated Prettier config content
 */
export function generatePrettierConfig() {
  return `{
  "semi": true,
  "trailingComma": "none",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid"
}
`;
}

export default {
  generateApiDocs,
  generateDevelopmentDocs,
  generateClaudeConfig,
  generateEslintConfig,
  generatePrettierConfig
};

