/**
 * API Backend Template Generator
 * 
 * Generates Express/Fastify API backend projects following diet103 patterns
 * @module lib/templates/api-backend-template
 */

import { helpers } from '../utils/template-engine.js';

/**
 * Generate package.json for API backend
 * 
 * @param {Object} context - Template context
 * @param {string} context.projectName - Project name
 * @param {string} context.description - Project description
 * @param {string} context.framework - 'express' or 'fastify'
 * @param {boolean} context.includeDatabase - Whether to include database setup
 * @returns {string} Generated package.json content
 */
export function generatePackageJson(context) {
  const {
    projectName,
    description = 'API backend created with Claude Orchestrator',
    framework = 'express',
    includeDatabase = false
  } = context;

  const baseDependencies = {
    dotenv: '^16.4.5',
    winston: '^3.11.0',
    cors: '^2.8.5',
    helmet: '^7.1.0',
    compression: '^1.7.4'
  };

  const frameworkDependencies = framework === 'fastify' ? {
    fastify: '^4.26.0',
    '@fastify/cors': '^9.0.1',
    '@fastify/helmet': '^11.1.1',
    '@fastify/compress': '^7.0.0',
    '@fastify/rate-limit': '^9.1.0'
  } : {
    express: '^4.18.2',
    'express-rate-limit': '^7.1.5'
  };

  const databaseDependencies = includeDatabase ? {
    pg: '^8.11.3',
    'pg-promise': '^11.5.4'
  } : {};

  const packageJson = {
    name: projectName,
    version: '0.1.0',
    description,
    main: 'server.js',
    type: 'module',
    scripts: {
      start: 'node server.js',
      dev: 'nodemon server.js',
      test: 'NODE_ENV=test jest --coverage',
      'test:unit': 'NODE_ENV=test jest tests/unit',
      'test:integration': 'NODE_ENV=test jest tests/integration',
      'test:watch': 'NODE_ENV=test jest --watch',
      lint: 'eslint .',
      'lint:fix': 'eslint . --fix',
      format: 'prettier --write "**/*.{js,json,md}"'
    },
    dependencies: {
      ...baseDependencies,
      ...frameworkDependencies,
      ...databaseDependencies
    },
    devDependencies: {
      jest: '^29.7.0',
      supertest: '^6.3.4',
      nodemon: '^3.0.3',
      eslint: '^8.56.0',
      prettier: '^3.2.4',
      '@types/jest': '^29.5.11'
    }
  };

  return JSON.stringify(packageJson, null, 2);
}

/**
 * Generate .env.example file
 * 
 * @param {Object} context - Template context
 * @returns {string} Generated .env.example content
 */
export function generateEnvExample(context) {
  const { includeDatabase = false } = context;

  let content = `# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Logging
LOG_LEVEL=info

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
`;

  if (includeDatabase) {
    content += `
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dbname
DB_USER=user
DB_PASSWORD=password
DB_POOL_MIN=2
DB_POOL_MAX=10
`;
  }

  content += `
# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# API Configuration
API_VERSION=v1
API_PREFIX=/api
`;

  return content;
}

/**
 * Generate .gitignore file
 * 
 * @returns {string} Generated .gitignore content
 */
export function generateGitignore() {
  return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.*.local

# Testing
coverage/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Build output
dist/
build/
*.pid
*.seed
*.pid.lock

# Temporary files
tmp/
temp/
`;
}

/**
 * Generate README.md for API backend
 * 
 * @param {Object} context - Template context
 * @returns {string} Generated README.md content
 */
export function generateReadme(context) {
  const {
    projectName,
    description = 'RESTful API backend',
    framework = 'express'
  } = context;

  return `# ${helpers.pascalCase(projectName)}

${description}

## Features

- **${helpers.pascalCase(framework)}** framework for robust API handling
- **Structured routing** with organized controllers and services
- **Middleware pipeline** for request processing and error handling
- **Environment-based configuration** using dotenv
- **Comprehensive logging** with Winston
- **Security headers** with Helmet
- **CORS support** for cross-origin requests
- **Rate limiting** to prevent abuse
- **Compression** for optimized responses
- **Testing setup** with Jest and Supertest

## Project Structure

\`\`\`
${projectName}/
├── src/
│   ├── app.js              # Application setup
│   ├── config/             # Configuration files
│   │   ├── index.js        # Main config
│   │   └── database.js     # Database config
│   ├── routes/             # API routes
│   │   ├── index.js        # Routes index
│   │   └── health.js       # Health check route
│   ├── controllers/        # Route controllers
│   │   └── index.js        # Controllers index
│   ├── services/           # Business logic
│   │   └── index.js        # Services index
│   ├── middleware/         # Custom middleware
│   │   ├── index.js        # Middleware index
│   │   ├── error-handler.js
│   │   └── request-logger.js
│   ├── models/             # Data models
│   │   └── index.js        # Models index
│   └── utils/              # Utility functions
│       ├── index.js        # Utils index
│       └── logger.js       # Winston logger
├── tests/
│   ├── setup.js            # Test configuration
│   ├── unit/               # Unit tests
│   └── integration/        # Integration tests
├── docs/
│   ├── api.md              # API documentation
│   └── development.md      # Development guide
├── .claude/
│   ├── config.json         # Claude configuration
│   ├── skills/             # Project-specific skills
│   └── hooks/              # Git hooks
├── server.js               # Entry point
├── package.json
├── .env.example
└── .gitignore
\`\`\`

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd ${projectName}
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

4. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The server will start on \`http://localhost:3000\` by default.

## Available Scripts

- \`npm start\` - Start production server
- \`npm run dev\` - Start development server with auto-reload
- \`npm test\` - Run all tests with coverage
- \`npm run test:unit\` - Run unit tests only
- \`npm run test:integration\` - Run integration tests only
- \`npm run test:watch\` - Run tests in watch mode
- \`npm run lint\` - Check code for linting errors
- \`npm run lint:fix\` - Fix linting errors automatically
- \`npm run format\` - Format code with Prettier

## API Endpoints

### Health Check
\`\`\`
GET /api/health
\`\`\`

Returns server health status.

See [API Documentation](docs/api.md) for complete endpoint reference.

## Testing

The project uses Jest for testing:

\`\`\`bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
\`\`\`

## Development

See [Development Guide](docs/development.md) for detailed development instructions.

## License

MIT

---

Generated with Claude Orchestrator API Backend Template
`;
}

/**
 * Generate server.js entry point
 * 
 * @param {Object} context - Template context
 * @returns {string} Generated server.js content
 */
export function generateServerFile(context) {
  const { framework = 'express' } = context;

  return `/**
 * Server Entry Point
 * 
 * Initializes and starts the API server
 */

import dotenv from 'dotenv';
import app from './src/app.js';
import logger from './src/utils/logger.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

/**
 * Start the server
 */
${framework === 'fastify' ? `async function start() {
  try {
    await app.listen({ port: PORT, host: HOST });
    logger.info(\`Server listening on http://\${HOST}:\${PORT}\`);
  } catch (err) {
    logger.error('Error starting server:', err);
    process.exit(1);
  }
}` : `function start() {
  const server = app.listen(PORT, HOST, () => {
    logger.info(\`Server listening on http://\${HOST}:\${PORT}\`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
}`}

start();
`;
}

/**
 * Generate app.js main application file
 * 
 * @param {Object} context - Template context
 * @returns {string} Generated app.js content
 */
export function generateAppFile(context) {
  const { framework = 'express' } = context;

  if (framework === 'fastify') {
    return `/**
 * Fastify Application Setup
 * 
 * Configures the Fastify application with plugins and routes
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';
import logger from './utils/logger.js';
import routes from './routes/index.js';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});

// Register plugins
await app.register(cors, {
  origin: process.env.CORS_ORIGIN || '*'
});

await app.register(helmet);
await app.register(compress);
await app.register(rateLimit, {
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000
});

// Register routes
await app.register(routes, { prefix: process.env.API_PREFIX || '/api' });

// Error handler
app.setErrorHandler((error, request, reply) => {
  logger.error('Error:', error);
  
  reply.status(error.statusCode || 500).send({
    error: {
      message: error.message || 'Internal Server Error',
      statusCode: error.statusCode || 500
    }
  });
});

export default app;
`;
  }

  // Express version
  return `/**
 * Express Application Setup
 * 
 * Configures the Express application with middleware and routes
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { requestLogger } from './middleware/request-logger.js';
import { errorHandler } from './middleware/error-handler.js';
import routes from './routes/index.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Request logging
app.use(requestLogger);

// API routes
app.use(process.env.API_PREFIX || '/api', routes);

// Error handling (must be last)
app.use(errorHandler);

export default app;
`;
}

export default {
  generatePackageJson,
  generateEnvExample,
  generateGitignore,
  generateReadme,
  generateServerFile,
  generateAppFile
};

