/**
 * API Backend Template - Additional Files Generator
 * 
 * Generates route, middleware, utility, and configuration files
 * @module lib/templates/api-backend-files
 */

/**
 * Generate routes/index.js
 * 
 * @param {Object} context - Template context
 * @returns {string} Generated routes index content
 */
export function generateRoutesIndex(context) {
  const { framework = 'express' } = context;

  if (framework === 'fastify') {
    return `/**
 * Routes Index
 * 
 * Registers all API routes
 */

import healthRoutes from './health.js';

export default async function routes(app, options) {
  // Register route modules
  await app.register(healthRoutes, { prefix: '/health' });
  
  // Add more routes here as your API grows
}
`;
  }

  return `/**
 * Routes Index
 * 
 * Registers all API routes
 */

import { Router } from 'express';
import healthRoutes from './health.js';

const router = Router();

// Register route modules
router.use('/health', healthRoutes);

// Add more routes here as your API grows

export default router;
`;
}

/**
 * Generate routes/health.js
 * 
 * @param {Object} context - Template context
 * @returns {string} Generated health route content
 */
export function generateHealthRoute(context) {
  const { framework = 'express' } = context;

  if (framework === 'fastify') {
    return `/**
 * Health Check Routes
 * 
 * Provides health status endpoints
 */

export default async function healthRoutes(app, options) {
  app.get('/', async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };
  });
  
  app.get('/ready', async (request, reply) => {
    // Add readiness checks here (database, external services, etc.)
    const checks = {
      server: true
      // database: await checkDatabaseConnection()
    };
    
    const isReady = Object.values(checks).every(check => check === true);
    
    if (!isReady) {
      reply.status(503);
    }
    
    return {
      ready: isReady,
      checks,
      timestamp: new Date().toISOString()
    };
  });
}
`;
  }

  return `/**
 * Health Check Routes
 * 
 * Provides health status endpoints
 */

import { Router } from 'express';

const router = Router();

/**
 * GET /health
 * Basic health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * GET /health/ready
 * Readiness check endpoint
 */
router.get('/ready', async (req, res) => {
  // Add readiness checks here (database, external services, etc.)
  const checks = {
    server: true
    // database: await checkDatabaseConnection()
  };
  
  const isReady = Object.values(checks).every(check => check === true);
  
  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    checks,
    timestamp: new Date().toISOString()
  });
});

export default router;
`;
}

/**
 * Generate middleware/index.js
 * 
 * @returns {string} Generated middleware index content
 */
export function generateMiddlewareIndex() {
  return `/**
 * Middleware Index
 * 
 * Exports all custom middleware
 */

export { errorHandler } from './error-handler.js';
export { requestLogger } from './request-logger.js';
`;
}

/**
 * Generate middleware/error-handler.js
 * 
 * @param {Object} context - Template context
 * @returns {string} Generated error handler content
 */
export function generateErrorHandler(context) {
  const { framework = 'express' } = context;

  if (framework === 'fastify') {
    return `/**
 * Error Handler Plugin
 * 
 * Fastify error handling plugin
 */

import fp from 'fastify-plugin';
import logger from '../utils/logger.js';

async function errorHandlerPlugin(app, options) {
  app.setErrorHandler((error, request, reply) => {
    logger.error({
      err: error,
      req: request,
      msg: 'Request error'
    });
    
    const statusCode = error.statusCode || 500;
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    reply.status(statusCode).send({
      error: {
        message: error.message || 'Internal Server Error',
        statusCode,
        ...(isDevelopment && { stack: error.stack })
      }
    });
  });
}

export default fp(errorHandlerPlugin);
`;
  }

  return `/**
 * Error Handler Middleware
 * 
 * Global error handling for Express
 */

import logger from '../utils/logger.js';

/**
 * Error handling middleware
 * Must be registered last
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function errorHandler(err, req, res, next) {
  // Log the error
  logger.error({
    err,
    req: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body
    },
    msg: 'Request error'
  });
  
  // Determine status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Prepare error response
  const response = {
    error: {
      message: err.message || 'Internal Server Error',
      statusCode
    }
  };
  
  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }
  
  // Send error response
  res.status(statusCode).json(response);
}
`;
}

/**
 * Generate middleware/request-logger.js
 * 
 * @returns {string} Generated request logger content
 */
export function generateRequestLogger() {
  return `/**
 * Request Logger Middleware
 * 
 * Logs incoming requests
 */

import logger from '../utils/logger.js';

/**
 * Log incoming HTTP requests
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  
  // Log request
  logger.info({
    type: 'request',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info({
      type: 'response',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: \`\${duration}ms\`
    });
  });
  
  next();
}
`;
}

/**
 * Generate utils/logger.js
 * 
 * @returns {string} Generated logger utility content
 */
export function generateLogger() {
  return `/**
 * Winston Logger Configuration
 * 
 * Centralized logging utility
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = \`\${timestamp} [\${level}]: \${message}\`;
  
  if (Object.keys(metadata).length > 0) {
    msg += \` \${JSON.stringify(metadata)}\`;
  }
  
  return msg;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      )
    })
  ]
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error'
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log'
  }));
}

export default logger;
`;
}

/**
 * Generate config/index.js
 * 
 * @returns {string} Generated config index content
 */
export function generateConfigIndex() {
  return `/**
 * Configuration Index
 * 
 * Centralized configuration management
 */

import dotenv from 'dotenv';

dotenv.config();

const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },
  
  // API configuration
  api: {
    version: process.env.API_VERSION || 'v1',
    prefix: process.env.API_PREFIX || '/api'
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  },
  
  // Rate limiting configuration
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000
  }
};

export default config;
`;
}

/**
 * Generate config/database.js
 * 
 * @returns {string} Generated database config content
 */
export function generateDatabaseConfig() {
  return `/**
 * Database Configuration
 * 
 * Database connection and pool configuration
 */

import dotenv from 'dotenv';

dotenv.config();

const databaseConfig = {
  // PostgreSQL configuration
  postgres: {
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    
    // Connection pool settings
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 10
    },
    
    // SSL configuration
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  }
};

export default databaseConfig;
`;
}

/**
 * Generate controllers/index.js
 * 
 * @returns {string} Generated controllers index content
 */
export function generateControllersIndex() {
  return `/**
 * Controllers Index
 * 
 * Exports all controllers
 */

// Export controllers as they are created
// export { userController } from './user-controller.js';
`;
}

/**
 * Generate services/index.js
 * 
 * @returns {string} Generated services index content
 */
export function generateServicesIndex() {
  return `/**
 * Services Index
 * 
 * Exports all business logic services
 */

// Export services as they are created
// export { userService } from './user-service.js';
`;
}

/**
 * Generate models/index.js
 * 
 * @returns {string} Generated models index content
 */
export function generateModelsIndex() {
  return `/**
 * Models Index
 * 
 * Exports all data models
 */

// Export models as they are created
// export { User } from './user-model.js';
`;
}

/**
 * Generate utils/index.js
 * 
 * @returns {string} Generated utils index content
 */
export function generateUtilsIndex() {
  return `/**
 * Utils Index
 * 
 * Exports all utility functions
 */

export { default as logger } from './logger.js';
`;
}

export default {
  generateRoutesIndex,
  generateHealthRoute,
  generateMiddlewareIndex,
  generateErrorHandler,
  generateRequestLogger,
  generateLogger,
  generateConfigIndex,
  generateDatabaseConfig,
  generateControllersIndex,
  generateServicesIndex,
  generateModelsIndex,
  generateUtilsIndex
};

