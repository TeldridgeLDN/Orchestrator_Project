/**
 * API Backend Builder Tests
 * 
 * Tests for the API backend template builder
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { buildApiBackend, validateContext, DEFAULT_CONTEXT } from '../api-backend-builder.js';

describe('API Backend Builder', () => {
  let testDir;

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `api-backend-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('validateContext', () => {
    it('should validate valid context', () => {
      const context = {
        projectName: 'my-api',
        framework: 'express'
      };

      const result = validateContext(context);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid project names', () => {
      const context = {
        projectName: 'My API', // spaces not allowed
        framework: 'express'
      };

      const result = validateContext(context);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('lowercase');
    });

    it('should reject invalid frameworks', () => {
      const context = {
        projectName: 'my-api',
        framework: 'koa' // not supported
      };

      const result = validateContext(context);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('express');
    });
  });

  describe('buildApiBackend', () => {
    it('should create project with default context', async () => {
      const result = await buildApiBackend(testDir);

      expect(result.success).toBe(true);
      expect(result.files.length).toBeGreaterThan(0);

      // Verify key files exist
      const packageJsonPath = path.join(testDir, 'package.json');
      const serverPath = path.join(testDir, 'server.js');
      const readmePath = path.join(testDir, 'README.md');

      expect(await fs.access(packageJsonPath).then(() => true).catch(() => false)).toBe(true);
      expect(await fs.access(serverPath).then(() => true).catch(() => false)).toBe(true);
      expect(await fs.access(readmePath).then(() => true).catch(() => false)).toBe(true);
    });

    it('should create Express project', async () => {
      const context = {
        projectName: 'express-api',
        framework: 'express'
      };

      const result = await buildApiBackend(testDir, context);

      expect(result.success).toBe(true);

      // Verify Express-specific files
      const appPath = path.join(testDir, 'src', 'app.js');
      const appContent = await fs.readFile(appPath, 'utf-8');

      expect(appContent).toContain('express');
      expect(appContent).not.toContain('fastify');
    });

    it('should create Fastify project', async () => {
      const context = {
        projectName: 'fastify-api',
        framework: 'fastify'
      };

      const result = await buildApiBackend(testDir, context);

      expect(result.success).toBe(true);

      // Verify Fastify-specific files
      const appPath = path.join(testDir, 'src', 'app.js');
      const appContent = await fs.readFile(appPath, 'utf-8');

      expect(appContent).toContain('fastify');
      expect(appContent).not.toContain('express');
    });

    it('should create all required directories', async () => {
      const result = await buildApiBackend(testDir);

      expect(result.success).toBe(true);

      // Verify directory structure
      const requiredDirs = [
        'src',
        'src/routes',
        'src/controllers',
        'src/services',
        'src/middleware',
        'src/models',
        'src/utils',
        'src/config',
        'tests',
        'tests/unit',
        'tests/integration',
        'docs',
        '.claude',
        '.claude/skills',
        '.claude/hooks'
      ];

      for (const dir of requiredDirs) {
        const dirPath = path.join(testDir, dir);
        const exists = await fs.access(dirPath).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      }
    });

    it('should create package.json with correct dependencies', async () => {
      const context = {
        projectName: 'test-api',
        framework: 'express'
      };

      const result = await buildApiBackend(testDir, context);

      expect(result.success).toBe(true);

      const packageJsonPath = path.join(testDir, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

      expect(packageJson.name).toBe('test-api');
      expect(packageJson.dependencies).toHaveProperty('express');
      expect(packageJson.dependencies).toHaveProperty('dotenv');
      expect(packageJson.dependencies).toHaveProperty('winston');
      expect(packageJson.devDependencies).toHaveProperty('jest');
      expect(packageJson.devDependencies).toHaveProperty('supertest');
    });

    it('should include database config when requested', async () => {
      const context = {
        projectName: 'db-api',
        framework: 'express',
        includeDatabase: true
      };

      const result = await buildApiBackend(testDir, context);

      expect(result.success).toBe(true);

      // Verify database dependencies
      const packageJsonPath = path.join(testDir, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

      expect(packageJson.dependencies).toHaveProperty('pg');

      // Verify database config in .env.example
      const envExamplePath = path.join(testDir, '.env.example');
      const envExample = await fs.readFile(envExamplePath, 'utf-8');

      expect(envExample).toContain('DATABASE_URL');
      expect(envExample).toContain('DB_HOST');
    });

    it('should create test files', async () => {
      const result = await buildApiBackend(testDir);

      expect(result.success).toBe(true);

      // Verify test files
      const setupPath = path.join(testDir, 'tests', 'setup.js');
      const unitTestPath = path.join(testDir, 'tests', 'unit', 'example.test.js');
      const integrationTestPath = path.join(testDir, 'tests', 'integration', 'health.test.js');

      expect(await fs.access(setupPath).then(() => true).catch(() => false)).toBe(true);
      expect(await fs.access(unitTestPath).then(() => true).catch(() => false)).toBe(true);
      expect(await fs.access(integrationTestPath).then(() => true).catch(() => false)).toBe(true);
    });

    it('should create documentation files', async () => {
      const result = await buildApiBackend(testDir);

      expect(result.success).toBe(true);

      // Verify documentation files
      const apiDocsPath = path.join(testDir, 'docs', 'api.md');
      const devDocsPath = path.join(testDir, 'docs', 'development.md');

      expect(await fs.access(apiDocsPath).then(() => true).catch(() => false)).toBe(true);
      expect(await fs.access(devDocsPath).then(() => true).catch(() => false)).toBe(true);
    });

    it('should create Claude integration files', async () => {
      const result = await buildApiBackend(testDir);

      expect(result.success).toBe(true);

      // Verify Claude config
      const claudeConfigPath = path.join(testDir, '.claude', 'config.json');
      const claudeConfig = JSON.parse(await fs.readFile(claudeConfigPath, 'utf-8'));

      expect(claudeConfig).toHaveProperty('skills');
      expect(claudeConfig.skills.length).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      const invalidContext = {
        projectName: 'test api', // invalid name
        framework: 'express'
      };

      // Should still create files but with validation warnings
      const result = await buildApiBackend('/invalid/path/that/cannot/be/created', invalidContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('DEFAULT_CONTEXT', () => {
    it('should have required default values', () => {
      expect(DEFAULT_CONTEXT).toHaveProperty('projectName');
      expect(DEFAULT_CONTEXT).toHaveProperty('framework');
      expect(DEFAULT_CONTEXT).toHaveProperty('includeDatabase');
      expect(DEFAULT_CONTEXT.framework).toBe('express');
    });
  });
});

