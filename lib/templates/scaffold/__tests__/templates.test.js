/**
 * Tests for Scaffold Templates
 * 
 * @group unit
 */

import { describe, it, expect } from 'vitest';
import { generateSkillMd, generateSkillMetadata } from '../skill-template.js';
import { generateCommandMd } from '../command-template.js';
import { generateHookScript, generateHookMetadata } from '../hook-template.js';
import { generateMcpConfig, generateMcpDocumentation } from '../mcp-template.js';

describe('Scaffold Templates', () => {
  const mockScenario = {
    scenario: {
      name: 'test-scenario',
      description: 'Test scenario description',
      category: 'business_process',
      version: '1.0.0',
      trigger: {
        type: 'hybrid',
        command: '/test-scenario',
        keywords: ['test', 'scenario']
      },
      steps: [
        {
          id: 'step_1',
          action: 'First step action',
          type: 'manual'
        },
        {
          id: 'step_2',
          action: 'Second step action',
          type: 'api_call',
          mcp: 'test-mcp',
          dependencies: ['step_1'],
          inputs: ['data'],
          outputs: ['result']
        }
      ],
      dependencies: {
        mcps: ['test-mcp'],
        skills: ['helper-skill']
      }
    }
  };

  describe('Skill Template', () => {
    it('should generate valid skill markdown', () => {
      const context = {
        scenario: mockScenario.scenario,
        skillName: 'test_scenario'
      };
      
      const result = generateSkillMd(context);
      
      expect(result).toContain('# Skill: TestScenario');
      expect(result).toContain('Test scenario description');
      expect(result).toContain('business_process');
      expect(result).toContain('First step action');
      expect(result).toContain('Second step action');
    });

    it('should include all steps', () => {
      const context = {
        scenario: mockScenario.scenario,
        skillName: 'test_scenario'
      };
      
      const result = generateSkillMd(context);
      
      expect(result).toContain('step_1');
      expect(result).toContain('step_2');
    });

    it('should include dependencies', () => {
      const context = {
        scenario: mockScenario.scenario,
        skillName: 'test_scenario'
      };
      
      const result = generateSkillMd(context);
      
      expect(result).toContain('test-mcp');
      expect(result).toContain('helper-skill');
    });

    it('should generate valid metadata JSON', () => {
      const context = {
        scenario: mockScenario.scenario,
        skillName: 'test_scenario'
      };
      
      const result = generateSkillMetadata(context);
      const metadata = JSON.parse(result);
      
      expect(metadata.name).toBe('test_scenario');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.generatedFrom).toBe('test-scenario');
      expect(metadata.steps).toHaveLength(2);
    });
  });

  describe('Command Template', () => {
    it('should generate valid command markdown', () => {
      const context = {
        scenario: mockScenario.scenario,
        commandName: '/test-scenario'
      };
      
      const result = generateCommandMd(context);
      
      expect(result).toContain('# /test-scenario');
      expect(result).toContain('Test scenario description');
      expect(result).toContain('First step action');
      expect(result).toContain('Second step action');
    });

    it('should include MCP prerequisites', () => {
      const context = {
        scenario: mockScenario.scenario,
        commandName: '/test-scenario'
      };
      
      const result = generateCommandMd(context);
      
      expect(result).toContain('test-mcp');
    });

    it('should handle command without leading slash', () => {
      const context = {
        scenario: mockScenario.scenario,
        commandName: 'test-scenario'
      };
      
      const result = generateCommandMd(context);
      
      expect(result).toContain('/test-scenario');
    });
  });

  describe('Hook Template', () => {
    it('should generate valid hook script', () => {
      const context = {
        scenario: mockScenario.scenario,
        hookName: 'test-hook',
        hookType: 'UserPromptSubmit'
      };
      
      const result = generateHookScript(context);
      
      expect(result).toContain('#!/usr/bin/env node');
      expect(result).toContain('test-scenario');
      expect(result).toContain('UserPromptSubmit');
      expect(result).toContain('process.env.USER_PROMPT');
    });

    it('should include trigger keywords', () => {
      const context = {
        scenario: mockScenario.scenario,
        hookName: 'test-hook'
      };
      
      const result = generateHookScript(context);
      
      expect(result).toContain('test');
      expect(result).toContain('scenario');
    });

    it('should include command detection', () => {
      const context = {
        scenario: mockScenario.scenario,
        hookName: 'test-hook'
      };
      
      const result = generateHookScript(context);
      
      expect(result).toContain('/test-scenario');
      expect(result).toContain('commandMatch');
    });

    it('should generate valid hook metadata', () => {
      const context = {
        scenario: mockScenario.scenario,
        hookName: 'test-hook',
        hookType: 'UserPromptSubmit'
      };
      
      const result = generateHookMetadata(context);
      const metadata = JSON.parse(result);
      
      expect(metadata.name).toBe('test-hook');
      expect(metadata.type).toBe('UserPromptSubmit');
      expect(metadata.scenario).toBe('test-scenario');
    });
  });

  describe('MCP Template', () => {
    it('should generate MCP configuration', () => {
      const context = {
        scenario: mockScenario.scenario
      };
      
      const result = generateMcpConfig(context);
      
      expect(result['test-mcp']).toBeDefined();
      expect(result['test-mcp'].type).toBe('stdio');
      expect(result['test-mcp'].command).toBe('npx');
      expect(result['test-mcp'].args).toContain('test-mcp');
    });

    it('should handle no MCP dependencies', () => {
      const context = {
        scenario: {
          ...mockScenario.scenario,
          dependencies: {}
        }
      };
      
      const result = generateMcpConfig(context);
      
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should generate MCP documentation', () => {
      const context = {
        scenario: mockScenario.scenario
      };
      
      const result = generateMcpDocumentation(context);
      
      expect(result).toContain('test-mcp');
      expect(result).toContain('Installation');
      expect(result).toContain('Configuration');
      expect(result).toContain('.mcp.json');
    });

    it('should handle no MCPs in documentation', () => {
      const context = {
        scenario: {
          ...mockScenario.scenario,
          dependencies: {}
        }
      };
      
      const result = generateMcpDocumentation(context);
      
      expect(result).toContain('No MCP dependencies');
    });
  });
});

