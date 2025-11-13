/**
 * API Backend Template - Test Files Generator
 * 
 * Generates test setup and example test files
 * @module lib/templates/api-backend-tests
 */

/**
 * Generate tests/setup.js
 * 
 * @returns {string} Generated test setup content
 */
export function generateTestSetup() {
  return `/**
 * Test Setup
 * 
 * Global test configuration and setup
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Random port for testing
process.env.LOG_LEVEL = 'error'; // Reduce noise in test output

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Close any open connections
  // await closeDatabase();
});
`;
}

/**
 * Generate tests/unit/example.test.js
 * 
 * @returns {string} Generated example unit test content
 */
export function generateExampleUnitTest() {
  return `/**
 * Example Unit Test
 * 
 * Demonstrates unit testing patterns
 */

import logger from '../../src/utils/logger.js';

describe('Logger Utility', () => {
  it('should be defined', () => {
    expect(logger).toBeDefined();
  });
  
  it('should have required methods', () => {
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
  });
  
  it('should log info messages without throwing', () => {
    expect(() => {
      logger.info('Test info message');
    }).not.toThrow();
  });
  
  it('should log error messages without throwing', () => {
    expect(() => {
      logger.error('Test error message');
    }).not.toThrow();
  });
});
`;
}

/**
 * Generate tests/integration/health.test.js
 * 
 * @param {Object} context - Template context
 * @returns {string} Generated health integration test content
 */
export function generateHealthIntegrationTest(context) {
  const { framework = 'express' } = context;

  if (framework === 'fastify') {
    return `/**
 * Health Check Integration Tests
 * 
 * Tests health check endpoints
 */

import app from '../../src/app.js';

describe('Health Check Endpoints', () => {
  beforeAll(async () => {
    await app.ready();
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('GET /api/health', () => {
    it('should return 200 OK', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health'
      });
      
      expect(response.statusCode).toBe(200);
    });
    
    it('should return health status object', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health'
      });
      
      const body = JSON.parse(response.body);
      
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('uptime');
      expect(body).toHaveProperty('environment');
      expect(body.status).toBe('healthy');
    });
  });
  
  describe('GET /api/health/ready', () => {
    it('should return 200 OK when ready', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health/ready'
      });
      
      expect(response.statusCode).toBe(200);
    });
    
    it('should return readiness status object', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health/ready'
      });
      
      const body = JSON.parse(response.body);
      
      expect(body).toHaveProperty('ready');
      expect(body).toHaveProperty('checks');
      expect(body).toHaveProperty('timestamp');
      expect(body.ready).toBe(true);
    });
  });
});
`;
  }

  return `/**
 * Health Check Integration Tests
 * 
 * Tests health check endpoints
 */

import request from 'supertest';
import app from '../../src/app.js';

describe('Health Check Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return 200 OK', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body).toBeDefined();
    });
    
    it('should return health status object', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body.status).toBe('healthy');
    });
    
    it('should return valid timestamp', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });
  });
  
  describe('GET /api/health/ready', () => {
    it('should return 200 OK when ready', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200);
      
      expect(response.body).toBeDefined();
    });
    
    it('should return readiness status object', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200);
      
      expect(response.body).toHaveProperty('ready');
      expect(response.body).toHaveProperty('checks');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.ready).toBe(true);
    });
    
    it('should include checks object', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200);
      
      expect(response.body.checks).toBeDefined();
      expect(typeof response.body.checks).toBe('object');
    });
  });
});
`;
}

/**
 * Generate jest.config.js
 * 
 * @returns {string} Generated Jest configuration content
 */
export function generateJestConfig() {
  return `/**
 * Jest Configuration
 */

export default {
  // Test environment
  testEnvironment: 'node',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/index.js'
  ],
  
  coverageDirectory: 'coverage',
  
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Module resolution
  moduleNameMapper: {
    '^(\\\\.{1,2}/.*)\\\\.js$': '$1'
  },
  
  // Transform
  transform: {},
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  
  // Verbose output
  verbose: true
};
`;
}

export default {
  generateTestSetup,
  generateExampleUnitTest,
  generateHealthIntegrationTest,
  generateJestConfig
};

