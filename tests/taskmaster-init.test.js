#!/usr/bin/env node

/**
 * TaskMaster Initialization Tests
 * 
 * Tests for the automatic TaskMaster initialization on startup
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initializeTaskMaster from '../lib/init/taskmaster_init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test fixtures directory
const fixturesDir = path.join(__dirname, 'fixtures', 'taskmaster-init');

describe('TaskMaster Initialization', () => {
  let tempDir;
  
  beforeEach(() => {
    // Create temporary test directory
    tempDir = path.join(fixturesDir, `test-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
  });
  
  afterEach(() => {
    // Cleanup temporary test directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
  
  describe('Configuration Verification', () => {
    it('should detect missing .taskmaster directory', async () => {
      const result = await initializeTaskMaster({
        projectRoot: tempDir,
        verbose: false
      });
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('taskmaster_not_initialized');
    });
    
    it('should create default config.json if missing', async () => {
      // Create .taskmaster directory but no config
      const taskmasterDir = path.join(tempDir, '.taskmaster');
      fs.mkdirSync(taskmasterDir, { recursive: true });
      
      const result = await initializeTaskMaster({
        projectRoot: tempDir,
        verbose: false
      });
      
      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(taskmasterDir, 'config.json'))).toBe(true);
      
      // Verify default config structure
      const config = JSON.parse(
        fs.readFileSync(path.join(taskmasterDir, 'config.json'), 'utf-8')
      );
      expect(config.models).toBeDefined();
      expect(config.models.main).toBeDefined();
      expect(config.models.research).toBeDefined();
      expect(config.models.fallback).toBeDefined();
      expect(config.global).toBeDefined();
    });
    
    it('should verify valid config.json', async () => {
      const taskmasterDir = path.join(tempDir, '.taskmaster');
      fs.mkdirSync(taskmasterDir, { recursive: true });
      
      const validConfig = {
        models: {
          main: {
            provider: "anthropic",
            modelId: "claude-3-7-sonnet-20250219",
            maxTokens: 120000,
            temperature: 0.2
          },
          research: {
            provider: "perplexity",
            modelId: "sonar-pro",
            maxTokens: 8700,
            temperature: 0.1
          },
          fallback: {
            provider: "anthropic",
            modelId: "claude-3-5-haiku-20241022",
            maxTokens: 200000,
            temperature: 0.2
          }
        },
        global: {
          logLevel: "info",
          defaultTag: "master"
        }
      };
      
      fs.writeFileSync(
        path.join(taskmasterDir, 'config.json'),
        JSON.stringify(validConfig, null, 2)
      );
      
      const result = await initializeTaskMaster({
        projectRoot: tempDir,
        verbose: false
      });
      
      expect(result.success).toBe(true);
      expect(result.checks.find(c => c.name === 'config.json').valid).toBe(true);
    });
    
    it('should detect invalid config.json', async () => {
      const taskmasterDir = path.join(tempDir, '.taskmaster');
      fs.mkdirSync(taskmasterDir, { recursive: true });
      
      // Write invalid JSON
      fs.writeFileSync(
        path.join(taskmasterDir, 'config.json'),
        '{ invalid json }'
      );
      
      const result = await initializeTaskMaster({
        projectRoot: tempDir,
        verbose: false
      });
      
      expect(result.success).toBe(false);
      const configCheck = result.checks.find(c => c.name === 'config.json');
      expect(configCheck.valid).toBe(false);
      expect(configCheck.issues.some(i => i.type === 'error')).toBe(true);
    });
    
    it('should detect missing model configurations', async () => {
      const taskmasterDir = path.join(tempDir, '.taskmaster');
      fs.mkdirSync(taskmasterDir, { recursive: true });
      
      const incompleteConfig = {
        models: {
          main: {
            provider: "anthropic",
            modelId: "claude-3-7-sonnet-20250219"
          }
          // Missing research and fallback
        },
        global: {}
      };
      
      fs.writeFileSync(
        path.join(taskmasterDir, 'config.json'),
        JSON.stringify(incompleteConfig, null, 2)
      );
      
      const result = await initializeTaskMaster({
        projectRoot: tempDir,
        verbose: false
      });
      
      const configCheck = result.checks.find(c => c.name === 'config.json');
      expect(configCheck.issues.some(i => i.message.includes('research'))).toBe(true);
      expect(configCheck.issues.some(i => i.message.includes('fallback'))).toBe(true);
    });
  });
  
  describe('Model Selection Initialization', () => {
    it('should initialize model selection tiers', async () => {
      const taskmasterDir = path.join(tempDir, '.taskmaster');
      fs.mkdirSync(taskmasterDir, { recursive: true });
      
      const validConfig = {
        models: {
          main: {
            provider: "anthropic",
            modelId: "claude-3-7-sonnet-20250219",
            maxTokens: 120000,
            temperature: 0.2
          },
          research: {
            provider: "perplexity",
            modelId: "sonar-pro",
            maxTokens: 8700,
            temperature: 0.1
          },
          fallback: {
            provider: "anthropic",
            modelId: "claude-3-5-haiku-20241022",
            maxTokens: 200000,
            temperature: 0.2
          }
        },
        global: {
          logLevel: "info"
        }
      };
      
      fs.writeFileSync(
        path.join(taskmasterDir, 'config.json'),
        JSON.stringify(validConfig, null, 2)
      );
      
      const result = await initializeTaskMaster({
        projectRoot: tempDir,
        verbose: false
      });
      
      expect(result.success).toBe(true);
      expect(result.modelSelection).toBeDefined();
      expect(result.modelSelection.tiers).toBeDefined();
      expect(result.modelSelection.models).toBeDefined();
      
      // Verify tier mappings
      expect(result.modelSelection.tiers.simple).toBeDefined();
      expect(result.modelSelection.tiers.medium).toBeDefined();
      expect(result.modelSelection.tiers.complex).toBeDefined();
      expect(result.modelSelection.tiers.research).toBeDefined();
      
      // Verify model assignments
      expect(result.modelSelection.models.simple.modelId).toBe('claude-3-5-haiku-20241022');
      expect(result.modelSelection.models.medium.modelId).toBe('claude-3-7-sonnet-20250219');
      expect(result.modelSelection.models.complex.modelId).toBe('claude-3-7-sonnet-20250219');
      expect(result.modelSelection.models.research.modelId).toBe('sonar-pro');
    });
    
    it('should map operations to correct tiers', async () => {
      const taskmasterDir = path.join(tempDir, '.taskmaster');
      fs.mkdirSync(taskmasterDir, { recursive: true });
      
      const validConfig = {
        models: {
          main: { provider: "anthropic", modelId: "claude-3-7-sonnet-20250219" },
          research: { provider: "perplexity", modelId: "sonar-pro" },
          fallback: { provider: "anthropic", modelId: "claude-3-5-haiku-20241022" }
        },
        global: {}
      };
      
      fs.writeFileSync(
        path.join(taskmasterDir, 'config.json'),
        JSON.stringify(validConfig, null, 2)
      );
      
      const result = await initializeTaskMaster({
        projectRoot: tempDir,
        verbose: false
      });
      
      // Check simple operations
      expect(result.modelSelection.tiers.simple).toContain('update-subtask');
      expect(result.modelSelection.tiers.simple).toContain('set-status');
      
      // Check medium operations
      expect(result.modelSelection.tiers.medium).toContain('add-task');
      expect(result.modelSelection.tiers.medium).toContain('update-task');
      
      // Check complex operations
      expect(result.modelSelection.tiers.complex).toContain('parse-prd');
      expect(result.modelSelection.tiers.complex).toContain('expand-task');
      expect(result.modelSelection.tiers.complex).toContain('analyze-complexity');
      
      // Check research operations
      expect(result.modelSelection.tiers.research).toContain('research');
    });
  });
  
  describe('State Verification', () => {
    it('should handle missing state.json gracefully', async () => {
      const taskmasterDir = path.join(tempDir, '.taskmaster');
      fs.mkdirSync(taskmasterDir, { recursive: true });
      
      const validConfig = {
        models: {
          main: { provider: "anthropic", modelId: "claude-3-7-sonnet-20250219" },
          research: { provider: "perplexity", modelId: "sonar-pro" },
          fallback: { provider: "anthropic", modelId: "claude-3-5-haiku-20241022" }
        },
        global: {}
      };
      
      fs.writeFileSync(
        path.join(taskmasterDir, 'config.json'),
        JSON.stringify(validConfig, null, 2)
      );
      
      const result = await initializeTaskMaster({
        projectRoot: tempDir,
        verbose: false
      });
      
      expect(result.success).toBe(true);
      const stateCheck = result.checks.find(c => c.name === 'state.json');
      expect(stateCheck.needsCreation).toBe(true);
    });
    
    it('should verify valid state.json', async () => {
      const taskmasterDir = path.join(tempDir, '.taskmaster');
      fs.mkdirSync(taskmasterDir, { recursive: true });
      
      const validConfig = {
        models: {
          main: { provider: "anthropic", modelId: "claude-3-7-sonnet-20250219" },
          research: { provider: "perplexity", modelId: "sonar-pro" },
          fallback: { provider: "anthropic", modelId: "claude-3-5-haiku-20241022" }
        },
        global: {}
      };
      
      const validState = {
        currentTag: "master",
        lastSwitched: new Date().toISOString(),
        branchTagMapping: {},
        migrationNoticeShown: true
      };
      
      fs.writeFileSync(
        path.join(taskmasterDir, 'config.json'),
        JSON.stringify(validConfig, null, 2)
      );
      
      fs.writeFileSync(
        path.join(taskmasterDir, 'state.json'),
        JSON.stringify(validState, null, 2)
      );
      
      const result = await initializeTaskMaster({
        projectRoot: tempDir,
        verbose: false
      });
      
      expect(result.success).toBe(true);
      const stateCheck = result.checks.find(c => c.name === 'state.json');
      expect(stateCheck.valid).toBe(true);
    });
  });
  
  describe('API Key Detection', () => {
    it('should detect .env file', async () => {
      const taskmasterDir = path.join(tempDir, '.taskmaster');
      fs.mkdirSync(taskmasterDir, { recursive: true });
      
      const validConfig = {
        models: {
          main: { provider: "anthropic", modelId: "claude-3-7-sonnet-20250219" },
          research: { provider: "perplexity", modelId: "sonar-pro" },
          fallback: { provider: "anthropic", modelId: "claude-3-5-haiku-20241022" }
        },
        global: {}
      };
      
      fs.writeFileSync(
        path.join(taskmasterDir, 'config.json'),
        JSON.stringify(validConfig, null, 2)
      );
      
      // Create .env file
      fs.writeFileSync(
        path.join(tempDir, '.env'),
        'ANTHROPIC_API_KEY=test\nPERPLEXITY_API_KEY=test'
      );
      
      const result = await initializeTaskMaster({
        projectRoot: tempDir,
        verbose: false
      });
      
      expect(result.success).toBe(true);
      const keyCheck = result.checks.find(c => c.name === 'api-keys');
      expect(keyCheck.hasKeys).toBe(true);
    });
    
    it('should detect mcp.json file', async () => {
      const taskmasterDir = path.join(tempDir, '.taskmaster');
      fs.mkdirSync(taskmasterDir, { recursive: true });
      
      const validConfig = {
        models: {
          main: { provider: "anthropic", modelId: "claude-3-7-sonnet-20250219" },
          research: { provider: "perplexity", modelId: "sonar-pro" },
          fallback: { provider: "anthropic", modelId: "claude-3-5-haiku-20241022" }
        },
        global: {}
      };
      
      fs.writeFileSync(
        path.join(taskmasterDir, 'config.json'),
        JSON.stringify(validConfig, null, 2)
      );
      
      // Create .cursor/mcp.json
      const cursorDir = path.join(tempDir, '.cursor');
      fs.mkdirSync(cursorDir, { recursive: true });
      fs.writeFileSync(
        path.join(cursorDir, 'mcp.json'),
        JSON.stringify({ mcpServers: {} }, null, 2)
      );
      
      const result = await initializeTaskMaster({
        projectRoot: tempDir,
        verbose: false
      });
      
      expect(result.success).toBe(true);
      const keyCheck = result.checks.find(c => c.name === 'api-keys');
      expect(keyCheck.hasKeys).toBe(true);
    });
  });
});

