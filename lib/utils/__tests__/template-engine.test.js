/**
 * Tests for Template Engine
 * 
 * @group unit
 */

import { describe, it, expect } from 'vitest';
import {
  helpers,
  buildTemplateContext,
  renderTemplate
} from '../template-engine.js';

describe('Template Engine', () => {
  describe('helpers.camelCase', () => {
    it('should convert kebab-case to camelCase', () => {
      expect(helpers.camelCase('my-scenario-name')).toBe('myScenarioName');
    });

    it('should convert snake_case to camelCase', () => {
      expect(helpers.camelCase('my_scenario_name')).toBe('myScenarioName');
    });

    it('should handle single word', () => {
      expect(helpers.camelCase('scenario')).toBe('scenario');
    });
  });

  describe('helpers.pascalCase', () => {
    it('should convert kebab-case to PascalCase', () => {
      expect(helpers.pascalCase('my-scenario-name')).toBe('MyScenarioName');
    });

    it('should convert snake_case to PascalCase', () => {
      expect(helpers.pascalCase('my_scenario_name')).toBe('MyScenarioName');
    });

    it('should handle single word', () => {
      expect(helpers.pascalCase('scenario')).toBe('Scenario');
    });
  });

  describe('helpers.snakeCase', () => {
    it('should convert kebab-case to snake_case', () => {
      expect(helpers.snakeCase('my-scenario-name')).toBe('my_scenario_name');
    });

    it('should convert PascalCase to snake_case', () => {
      expect(helpers.snakeCase('MyScenarioName')).toBe('my_scenario_name');
    });

    it('should handle single word', () => {
      expect(helpers.snakeCase('scenario')).toBe('scenario');
    });
  });

  describe('helpers.kebabCase', () => {
    it('should convert snake_case to kebab-case', () => {
      expect(helpers.kebabCase('my_scenario_name')).toBe('my-scenario-name');
    });

    it('should convert PascalCase to kebab-case', () => {
      expect(helpers.kebabCase('MyScenarioName')).toBe('my-scenario-name');
    });

    it('should handle already kebab-case', () => {
      expect(helpers.kebabCase('my-scenario')).toBe('my-scenario');
    });
  });

  describe('helpers.constantCase', () => {
    it('should convert to UPPER_SNAKE_CASE', () => {
      expect(helpers.constantCase('my-scenario-name')).toBe('MY_SCENARIO_NAME');
    });

    it('should handle snake_case', () => {
      expect(helpers.constantCase('my_scenario_name')).toBe('MY_SCENARIO_NAME');
    });
  });

  describe('helpers.escapeString', () => {
    it('should escape quotes', () => {
      expect(helpers.escapeString('It\'s a "test"')).toBe('It\\\'s a \\"test\\"');
    });

    it('should escape backslashes', () => {
      expect(helpers.escapeString('path\\to\\file')).toBe('path\\\\to\\\\file');
    });

    it('should escape newlines', () => {
      expect(helpers.escapeString('line1\nline2')).toBe('line1\\nline2');
    });
  });

  describe('helpers.formatArray', () => {
    it('should format simple array', () => {
      expect(helpers.formatArray(['a', 'b', 'c'])).toBe("['a', 'b', 'c']");
    });

    it('should handle empty array', () => {
      expect(helpers.formatArray([])).toBe('[]');
    });

    it('should handle null', () => {
      expect(helpers.formatArray(null)).toBe('[]');
    });
  });

  describe('helpers.formatArrayMultiline', () => {
    it('should format multiline array', () => {
      const result = helpers.formatArrayMultiline(['a', 'b', 'c'], '  ');
      expect(result).toContain("'a'");
      expect(result).toContain("'b'");
      expect(result).toContain("'c'");
      expect(result).toMatch(/^\[/);
      expect(result).toMatch(/\]$/);
    });

    it('should handle empty array', () => {
      expect(helpers.formatArrayMultiline([])).toBe('[]');
    });
  });

  describe('helpers.timestamp', () => {
    it('should return ISO timestamp', () => {
      const ts = helpers.timestamp();
      expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('helpers.date', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const date = helpers.date();
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('buildTemplateContext', () => {
    it('should include data and helpers', () => {
      const data = { name: 'test', value: 123 };
      const context = buildTemplateContext(data);
      
      expect(context.name).toBe('test');
      expect(context.value).toBe(123);
      expect(context.helpers).toBeDefined();
      expect(context.h).toBeDefined();
      expect(context.helpers.camelCase).toBe(helpers.camelCase);
    });
  });

  describe('renderTemplate', () => {
    it('should render template with data', () => {
      const template = (ctx) => `Hello, ${ctx.name}!`;
      const data = { name: 'World' };
      
      const result = renderTemplate(template, data);
      
      expect(result).toBe('Hello, World!');
    });

    it('should provide helpers in template', () => {
      const template = (ctx) => ctx.helpers.camelCase('my-name');
      const data = {};
      
      const result = renderTemplate(template, data);
      
      expect(result).toBe('myName');
    });

    it('should provide helper alias', () => {
      const template = (ctx) => ctx.h.pascalCase('my-name');
      const data = {};
      
      const result = renderTemplate(template, data);
      
      expect(result).toBe('MyName');
    });
  });
});

