/**
 * Configuration Management
 * Centralized configuration for the Podcast Learning Extraction System
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: '../../.env' });
dotenv.config();

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  // API Configuration
  api: {
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 2000,
    temperature: 0.7,
    timeout: 60000 // 60 seconds
  },

  // Reference Validation
  references: {
    concurrency: 3,
    delayMs: 500,
    timeout: 10000,
    retries: 2
  },

  // Output Configuration
  output: {
    directory: '../../outputs/podcast-learning',
    saveJson: true,
    saveMarkdown: true,
    verbose: true
  },

  // Processing Options
  processing: {
    validateReferences: true,
    categorizeReferences: true,
    generateActions: true,
    generateMarkdown: true,
    useAIForCategorization: false, // Use AI only for ambiguous cases
    logToFile: true
  },

  // Default User Contexts
  contexts: [
    {
      name: 'Personal Practice',
      description: 'Applying design systems best practices to personal projects and skill development',
      goals: [
        'Improve design systems knowledge',
        'Build better personal projects',
        'Develop sustainable practices'
      ]
    },
    {
      name: 'Regular Work',
      description: 'Implementing design systems and avoiding burnout in professional design systems team work',
      goals: [
        'Improve team efficiency',
        'Build scalable systems',
        'Maintain work-life balance'
      ]
    },
    {
      name: 'Landing Page Business',
      description: 'Helping clients test online ideas with effective landing pages',
      goals: [
        'Create high-converting landing pages',
        'Help clients validate ideas quickly',
        'Build repeatable processes'
      ]
    }
  ]
};

/**
 * Gets API key from environment
 * @param {string} provider - Provider name (anthropic, openai, etc.)
 * @returns {string|null} - API key or null
 */
export function getApiKey(provider = 'anthropic') {
  const keyMap = {
    anthropic: 'ANTHROPIC_API_KEY',
    openai: 'OPENAI_API_KEY',
    perplexity: 'PERPLEXITY_API_KEY'
  };

  const envKey = keyMap[provider.toLowerCase()];
  return process.env[envKey] || null;
}

/**
 * Validates configuration
 * @param {Object} config - Configuration object
 * @returns {Object} - Validation result
 */
export function validateConfig(config) {
  const errors = [];
  const warnings = [];

  // Check API configuration
  if (config.api) {
    if (!config.api.model) {
      errors.push('API model is required');
    }
    if (config.api.maxTokens && (config.api.maxTokens < 100 || config.api.maxTokens > 4096)) {
      warnings.push('maxTokens should be between 100 and 4096');
    }
    if (config.api.temperature && (config.api.temperature < 0 || config.api.temperature > 1)) {
      errors.push('temperature must be between 0 and 1');
    }
  }

  // Check output configuration
  if (config.output) {
    if (!config.output.directory) {
      errors.push('Output directory is required');
    }
  }

  // Check contexts
  if (config.contexts) {
    if (!Array.isArray(config.contexts) || config.contexts.length === 0) {
      errors.push('At least one context is required');
    }
    config.contexts.forEach((context, index) => {
      if (!context.name) {
        errors.push(`Context ${index} missing name`);
      }
      if (!context.description) {
        warnings.push(`Context ${index} missing description`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Merges user configuration with defaults
 * @param {Object} userConfig - User-provided configuration
 * @returns {Object} - Merged configuration
 */
export function mergeConfig(userConfig = {}) {
  return {
    api: { ...DEFAULT_CONFIG.api, ...userConfig.api },
    references: { ...DEFAULT_CONFIG.references, ...userConfig.references },
    output: { ...DEFAULT_CONFIG.output, ...userConfig.output },
    processing: { ...DEFAULT_CONFIG.processing, ...userConfig.processing },
    contexts: userConfig.contexts || DEFAULT_CONFIG.contexts
  };
}

/**
 * Loads configuration from file
 * @param {string} configPath - Path to config file
 * @returns {Promise<Object>} - Loaded configuration
 */
export async function loadConfig(configPath) {
  try {
    const { default: config } = await import(configPath);
    return mergeConfig(config);
  } catch (error) {
    console.warn(`Could not load config from ${configPath}, using defaults`);
    return DEFAULT_CONFIG;
  }
}

/**
 * Gets output paths
 * @param {Object} config - Configuration object
 * @returns {Object} - Output paths
 */
export function getOutputPaths(config = DEFAULT_CONFIG) {
  const baseDir = path.resolve(process.cwd(), config.output.directory);
  
  return {
    base: baseDir,
    processed: path.join(baseDir, 'processed'),
    episodes: path.join(baseDir, 'episodes'),
    logs: path.join(baseDir, 'logs'),
    reports: path.join(baseDir, 'reports')
  };
}

/**
 * Creates configuration object for processing
 * @param {Object} overrides - Override values
 * @returns {Object} - Processing configuration
 */
export function createProcessingConfig(overrides = {}) {
  const config = mergeConfig(overrides);
  const validation = validateConfig(config);

  if (!validation.valid) {
    throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
  }

  if (validation.warnings.length > 0 && config.output.verbose) {
    console.warn('Configuration warnings:', validation.warnings);
  }

  return config;
}

/**
 * Gets model configuration for API calls
 * @param {Object} config - Configuration object
 * @returns {Object} - Model configuration
 */
export function getModelConfig(config = DEFAULT_CONFIG) {
  return {
    model: config.api.model,
    maxTokens: config.api.maxTokens,
    temperature: config.api.temperature
  };
}

/**
 * Exports current environment info for debugging
 * @returns {Object} - Environment information
 */
export function getEnvironmentInfo() {
  return {
    hasAnthropicKey: !!getApiKey('anthropic'),
    hasOpenAIKey: !!getApiKey('openai'),
    hasPerplexityKey: !!getApiKey('perplexity'),
    nodeVersion: process.version,
    platform: process.platform,
    cwd: process.cwd()
  };
}

export default {
  DEFAULT_CONFIG,
  getApiKey,
  validateConfig,
  mergeConfig,
  loadConfig,
  getOutputPaths,
  createProcessingConfig,
  getModelConfig,
  getEnvironmentInfo
};

