/**
 * Tests for Command Disambiguation Handler
 * 
 * @module utils/__tests__/command-disambiguation.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  handleDisambiguationProgrammatic,
  getConfig,
  updateConfig,
  __testing__
} from '../command-disambiguation.js';

const { parseInput, isValidIndex } = __testing__;

// Test data
const testOptions = [
  {
    command: {
      id: 'switch-project',
      name: 'Switch Project',
      description: 'Switch to a different project'
    },
    pattern: 'switch to project {name}',
    score: 0.85,
    quality: 'good'
  },
  {
    command: {
      id: 'create-project',
      name: 'Create Project',
      description: 'Create a new project'
    },
    pattern: 'create project {name}',
    score: 0.83,
    quality: 'good'
  },
  {
    command: {
      id: 'list-projects',
      name: 'List Projects',
      description: 'List all projects'
    },
    pattern: 'list projects',
    score: 0.82,
    quality: 'good'
  }
];

describe('Command Disambiguation', () => {
  
  let originalConfig;
  
  beforeEach(() => {
    originalConfig = getConfig();
  });
  
  afterEach(() => {
    updateConfig(originalConfig);
  });
  
  describe('parseInput', () => {
    
    it('should parse cancel keys', () => {
      expect(parseInput('q')).toEqual({ type: 'cancel' });
      expect(parseInput('Q')).toEqual({ type: 'cancel' });
      expect(parseInput('escape')).toEqual({ type: 'cancel' });
    });
    
    it('should parse confirm keys', () => {
      expect(parseInput('enter')).toEqual({ type: 'confirm' });
      expect(parseInput('return')).toEqual({ type: 'confirm' });
    });
    
    it('should parse navigation keys', () => {
      expect(parseInput('up')).toEqual({ type: 'navigate', direction: 'up' });
      expect(parseInput('down')).toEqual({ type: 'navigate', direction: 'down' });
      expect(parseInput('k')).toEqual({ type: 'navigate', direction: 'up' });
      expect(parseInput('j')).toEqual({ type: 'navigate', direction: 'down' });
    });
    
    it('should parse number keys', () => {
      expect(parseInput('1')).toEqual({ type: 'number', value: 1 });
      expect(parseInput('5')).toEqual({ type: 'number', value: 5 });
      expect(parseInput('9')).toEqual({ type: 'number', value: 9 });
    });
    
    it('should handle unknown input', () => {
      const result = parseInput('x');
      expect(result.type).toBe('unknown');
      expect(result.input).toBe('x');
    });
    
    it('should be case-insensitive', () => {
      expect(parseInput('Q')).toEqual({ type: 'cancel' });
      expect(parseInput('K')).toEqual({ type: 'navigate', direction: 'up' });
    });
    
    it('should trim whitespace', () => {
      expect(parseInput('  q  ')).toEqual({ type: 'cancel' });
      expect(parseInput(' 1 ')).toEqual({ type: 'number', value: 1 });
    });
  });
  
  describe('isValidIndex', () => {
    
    it('should validate indices within bounds', () => {
      expect(isValidIndex(0, testOptions)).toBe(true);
      expect(isValidIndex(1, testOptions)).toBe(true);
      expect(isValidIndex(2, testOptions)).toBe(true);
    });
    
    it('should reject negative indices', () => {
      expect(isValidIndex(-1, testOptions)).toBe(false);
      expect(isValidIndex(-5, testOptions)).toBe(false);
    });
    
    it('should reject indices beyond array length', () => {
      expect(isValidIndex(3, testOptions)).toBe(false);
      expect(isValidIndex(10, testOptions)).toBe(false);
    });
    
    it('should handle empty arrays', () => {
      expect(isValidIndex(0, [])).toBe(false);
      expect(isValidIndex(1, [])).toBe(false);
    });
  });
  
  describe('handleDisambiguationProgrammatic', () => {
    
    it('should select by numeric index', () => {
      const result = handleDisambiguationProgrammatic('test', testOptions, 0);
      
      expect(result.success).toBe(true);
      expect(result.selected.id).toBe('switch-project');
      expect(result.index).toBe(0);
      expect(result.programmatic).toBe(true);
    });
    
    it('should select by command ID', () => {
      const result = handleDisambiguationProgrammatic('test', testOptions, 'create-project');
      
      expect(result.success).toBe(true);
      expect(result.selected.id).toBe('create-project');
      expect(result.index).toBe(1);
      expect(result.programmatic).toBe(true);
    });
    
    it('should handle all valid indices', () => {
      for (let i = 0; i < testOptions.length; i++) {
        const result = handleDisambiguationProgrammatic('test', testOptions, i);
        expect(result.success).toBe(true);
        expect(result.index).toBe(i);
      }
    });
    
    it('should reject invalid numeric index', () => {
      const result = handleDisambiguationProgrammatic('test', testOptions, 10);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid selection');
    });
    
    it('should reject negative index', () => {
      const result = handleDisambiguationProgrammatic('test', testOptions, -1);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid selection');
    });
    
    it('should reject invalid command ID', () => {
      const result = handleDisambiguationProgrammatic('test', testOptions, 'non-existent');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid selection');
    });
    
    it('should handle empty options array', () => {
      const result = handleDisambiguationProgrammatic('test', [], 0);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No options provided');
    });
    
    it('should handle null options', () => {
      const result = handleDisambiguationProgrammatic('test', null, 0);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No options provided');
    });
    
    it('should handle undefined options', () => {
      const result = handleDisambiguationProgrammatic('test', undefined, 0);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No options provided');
    });
  });
  
  describe('configuration', () => {
    
    it('should get current configuration', () => {
      const config = getConfig();
      
      expect(config).toHaveProperty('keys');
      expect(config).toHaveProperty('behavior');
      expect(config).toHaveProperty('timeout');
    });
    
    it('should have default key mappings', () => {
      const config = getConfig();
      
      expect(config.keys.cancel).toContain('q');
      expect(config.keys.cancel).toContain('escape');
      expect(config.keys.select).toContain('enter');
      expect(config.keys.up).toContain('up');
      expect(config.keys.down).toContain('down');
    });
    
    it('should update keys configuration', () => {
      updateConfig({
        keys: {
          cancel: ['x']
        }
      });
      
      const config = getConfig();
      expect(config.keys.cancel).toContain('x');
    });
    
    it('should update behavior configuration', () => {
      updateConfig({
        behavior: {
          autoSelectOnNumber: false
        }
      });
      
      const config = getConfig();
      expect(config.behavior.autoSelectOnNumber).toBe(false);
    });
    
    it('should update timeout configuration', () => {
      updateConfig({
        timeout: {
          enabled: true,
          duration: 10000
        }
      });
      
      const config = getConfig();
      expect(config.timeout.enabled).toBe(true);
      expect(config.timeout.duration).toBe(10000);
    });
    
    it('should preserve unmodified config values', () => {
      const originalShowInstructions = getConfig().behavior.showInstructions;
      
      updateConfig({
        behavior: {
          autoSelectOnNumber: false
        }
      });
      
      const config = getConfig();
      expect(config.behavior.showInstructions).toBe(originalShowInstructions);
    });
  });
  
  describe('edge cases', () => {
    
    it('should handle single option', () => {
      const singleOption = [testOptions[0]];
      const result = handleDisambiguationProgrammatic('test', singleOption, 0);
      
      expect(result.success).toBe(true);
      expect(result.selected.id).toBe('switch-project');
    });
    
    it('should handle many options', () => {
      const manyOptions = Array(20).fill(null).map((_, i) => ({
        command: { id: `cmd-${i}`, name: `Command ${i}` },
        pattern: `pattern ${i}`,
        score: 0.5,
        quality: 'potential'
      }));
      
      const result = handleDisambiguationProgrammatic('test', manyOptions, 15);
      
      expect(result.success).toBe(true);
      expect(result.index).toBe(15);
    });
    
    it('should handle options with minimal data', () => {
      const minimalOptions = [
        {
          command: { id: 'cmd1' },
          score: 0.5
        },
        {
          command: { id: 'cmd2' },
          score: 0.5
        }
      ];
      
      const result = handleDisambiguationProgrammatic('test', minimalOptions, 1);
      
      expect(result.success).toBe(true);
      expect(result.selected.id).toBe('cmd2');
    });
    
    it('should handle zero-based and one-based indexing correctly', () => {
      // Programmatic uses 0-based
      const result1 = handleDisambiguationProgrammatic('test', testOptions, 0);
      expect(result1.selected.id).toBe('switch-project');
      
      const result2 = handleDisambiguationProgrammatic('test', testOptions, 2);
      expect(result2.selected.id).toBe('list-projects');
    });
  });
  
  describe('selection methods', () => {
    
    it('should select first option', () => {
      const result = handleDisambiguationProgrammatic('test', testOptions, 0);
      
      expect(result.success).toBe(true);
      expect(result.selected.id).toBe(testOptions[0].command.id);
    });
    
    it('should select middle option', () => {
      const result = handleDisambiguationProgrammatic('test', testOptions, 1);
      
      expect(result.success).toBe(true);
      expect(result.selected.id).toBe(testOptions[1].command.id);
    });
    
    it('should select last option', () => {
      const result = handleDisambiguationProgrammatic('test', testOptions, testOptions.length - 1);
      
      expect(result.success).toBe(true);
      expect(result.selected.id).toBe(testOptions[testOptions.length - 1].command.id);
    });
    
    it('should include selection metadata', () => {
      const result = handleDisambiguationProgrammatic('test', testOptions, 1);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('selected');
      expect(result).toHaveProperty('index');
      expect(result).toHaveProperty('programmatic');
    });
  });
  
  describe('validation', () => {
    
    it('should validate options array', () => {
      const invalidCases = [
        null,
        undefined,
        [],
        'not an array',
        123,
        {}
      ];
      
      invalidCases.forEach(invalidCase => {
        const result = handleDisambiguationProgrammatic('test', invalidCase, 0);
        expect(result.success).toBe(false);
      });
    });
    
    it('should validate selection parameter', () => {
      const invalidSelections = [
        -1,
        testOptions.length,
        testOptions.length + 10,
        'invalid-id',
        null,
        undefined
      ];
      
      invalidSelections.forEach(invalidSelection => {
        const result = handleDisambiguationProgrammatic('test', testOptions, invalidSelection);
        expect(result.success).toBe(false);
      });
    });
  });
  
});

