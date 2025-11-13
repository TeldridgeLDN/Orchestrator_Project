/**
 * Template Engine Module
 * 
 * Provides code generation capabilities for scenario scaffolding.
 * Uses JavaScript template literals for flexible, type-safe templates.
 * 
 * @module utils/template-engine
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Helper functions for template transformations
 */
export const helpers = {
  /**
   * Convert string to camelCase
   * @param {string} str - Input string
   * @returns {string} camelCase version
   */
  camelCase(str) {
    return str
      .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
      .replace(/^(.)/, char => char.toLowerCase());
  },

  /**
   * Convert string to PascalCase
   * @param {string} str - Input string
   * @returns {string} PascalCase version
   */
  pascalCase(str) {
    return str
      .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
      .replace(/^(.)/, char => char.toUpperCase());
  },

  /**
   * Convert string to snake_case
   * @param {string} str - Input string
   * @returns {string} snake_case version
   */
  snakeCase(str) {
    return str
      .replace(/([A-Z])/g, '_$1')
      .replace(/[-\s]/g, '_')
      .toLowerCase()
      .replace(/^_/, '');
  },

  /**
   * Convert string to kebab-case
   * @param {string} str - Input string
   * @returns {string} kebab-case version
   */
  kebabCase(str) {
    return str
      .replace(/([A-Z])/g, '-$1')
      .replace(/[_\s]/g, '-')
      .toLowerCase()
      .replace(/^-/, '');
  },

  /**
   * Convert string to UPPER_SNAKE_CASE
   * @param {string} str - Input string
   * @returns {string} UPPER_SNAKE_CASE version
   */
  constantCase(str) {
    return helpers.snakeCase(str).toUpperCase();
  },

  /**
   * Escape string for use in code
   * @param {string} str - Input string
   * @returns {string} Escaped string
   */
  escapeString(str) {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  },

  /**
   * Format array as code list
   * @param {Array} arr - Input array
   * @param {string} indent - Indentation string
   * @returns {string} Formatted list
   */
  formatArray(arr, indent = '  ') {
    if (!arr || arr.length === 0) return '[]';
    const items = arr.map(item => `'${item}'`).join(', ');
    return `[${items}]`;
  },

  /**
   * Format array as multi-line list
   * @param {Array} arr - Input array
   * @param {string} indent - Indentation string
   * @returns {string} Formatted multi-line list
   */
  formatArrayMultiline(arr, indent = '  ') {
    if (!arr || arr.length === 0) return '[]';
    const items = arr.map(item => `${indent}'${item}'`).join(',\n');
    return `[\n${items}\n]`;
  },

  /**
   * Generate timestamp
   * @returns {string} ISO timestamp
   */
  timestamp() {
    return new Date().toISOString();
  },

  /**
   * Generate date string
   * @returns {string} Date in YYYY-MM-DD format
   */
  date() {
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Template context builder
 * Creates a context object for templates with helpers and data
 * 
 * @param {Object} data - Scenario data
 * @returns {Object} Template context
 */
export function buildTemplateContext(data) {
  return {
    ...data,
    helpers,
    h: helpers // Short alias
  };
}

/**
 * Render template with data
 * 
 * @param {Function} template - Template function
 * @param {Object} data - Data to inject
 * @returns {string} Rendered template
 */
export function renderTemplate(template, data) {
  const context = buildTemplateContext(data);
  return template(context);
}

/**
 * Load template from file
 * 
 * @param {string} templatePath - Path to template file
 * @returns {Promise<string>} Template content
 */
export async function loadTemplateFile(templatePath) {
  return await fs.readFile(templatePath, 'utf-8');
}

/**
 * Render template file with data
 * 
 * @param {string} templatePath - Path to template file
 * @param {Object} data - Data to inject
 * @returns {Promise<string>} Rendered template
 */
export async function renderTemplateFile(templatePath, data) {
  const content = await loadTemplateFile(templatePath);
  // For now, use simple string replacement
  // Could be enhanced with handlebars or similar later
  return content;
}

export default {
  helpers,
  buildTemplateContext,
  renderTemplate,
  loadTemplateFile,
  renderTemplateFile
};

