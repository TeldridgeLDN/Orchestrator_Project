/**
 * LLM Client for Lateral Thinking
 * 
 * Provides a unified interface to multiple LLM providers:
 * - Anthropic (Claude)
 * - OpenAI (GPT)
 * - Mock (for testing)
 * 
 * @module lateral-thinking/llm/client
 */

import { log as logger } from '../../utils/logger.js';

/**
 * LLM Client Configuration
 */
const DEFAULT_CONFIG = {
  provider: 'anthropic', // 'anthropic' | 'openai' | 'mock'
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.7,
  maxTokens: 500,
  timeout: 30000, // 30 seconds
  apiKey: null
};

/**
 * LLMClient Class
 * 
 * Unified interface for calling different LLM providers
 */
export class LLMClient {
  /**
   * Create LLM client
   * 
   * @param {Object} config - Client configuration
   */
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Get API key from environment if not provided
    if (!this.config.apiKey) {
      this.config.apiKey = this._getAPIKeyFromEnv();
    }
    
    logger.debug('LLM Client initialized', {
      provider: this.config.provider,
      model: this.config.model,
      hasApiKey: !!this.config.apiKey
    });
  }

  /**
   * Generate completion from prompt
   * 
   * @param {string} prompt - Prompt to send
   * @param {Object} options - Override options
   * @returns {Promise<Object>} LLM response
   */
  async generate(prompt, options = {}) {
    const config = { ...this.config, ...options };
    
    logger.debug('LLM generate request', {
      provider: config.provider,
      promptLength: prompt.length,
      temperature: config.temperature
    });

    const startTime = Date.now();
    
    try {
      let response;
      
      switch (config.provider) {
        case 'anthropic':
          response = await this._generateAnthropic(prompt, config);
          break;
        case 'openai':
          response = await this._generateOpenAI(prompt, config);
          break;
        case 'mock':
          response = await this._generateMock(prompt, config);
          break;
        default:
          throw new Error(`Unknown provider: ${config.provider}`);
      }
      
      const duration = Date.now() - startTime;
      
      logger.info('LLM generation complete', {
        provider: config.provider,
        duration,
        tokensUsed: response.tokensUsed || 'unknown'
      });
      
      return response;
      
    } catch (error) {
      logger.error('LLM generation failed', {
        provider: config.provider,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate using Anthropic Claude
   * 
   * @param {string} prompt - Prompt to send
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Response
   * @private
   */
  async _generateAnthropic(prompt, config) {
    if (!config.apiKey) {
      throw new Error('Anthropic API key not found. Set ANTHROPIC_API_KEY environment variable.');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
      signal: AbortSignal.timeout(config.timeout)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      text: data.content[0].text,
      tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || null,
      model: data.model,
      stopReason: data.stop_reason
    };
  }

  /**
   * Generate using OpenAI GPT
   * 
   * @param {string} prompt - Prompt to send
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Response
   * @private
   */
  async _generateOpenAI(prompt, config) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key not found. Set OPENAI_API_KEY environment variable.');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4',
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
      signal: AbortSignal.timeout(config.timeout)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      text: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens || null,
      model: data.model,
      stopReason: data.choices[0].finish_reason
    };
  }

  /**
   * Generate mock response (for testing)
   * 
   * @param {string} prompt - Prompt to send
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Mock response
   * @private
   */
  async _generateMock(prompt, config) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate a mock JSON response
    const mockResponse = {
      title: 'AI-Generated Creative Solution',
      description: 'This is a mock response demonstrating the structure. In production, this would be a real AI-generated idea.',
      insight: 'This mock shows how the system would work with a real LLM.',
      actionable: 'Test the integration with real API keys.'
    };
    
    return {
      text: JSON.stringify(mockResponse, null, 2),
      tokensUsed: prompt.length + 100,
      model: 'mock-model',
      stopReason: 'end_turn'
    };
  }

  /**
   * Get API key from environment
   * 
   * @returns {string|null} API key
   * @private
   */
  _getAPIKeyFromEnv() {
    if (this.config.provider === 'anthropic') {
      return process.env.ANTHROPIC_API_KEY || null;
    }
    if (this.config.provider === 'openai') {
      return process.env.OPENAI_API_KEY || null;
    }
    return null;
  }

  /**
   * Parse JSON response from LLM
   * 
   * Handles both clean JSON and JSON wrapped in markdown code blocks
   * 
   * @param {string} text - LLM response text
   * @returns {Object} Parsed JSON
   */
  parseJSON(text) {
    try {
      // Try direct parse first
      return JSON.parse(text);
    } catch (e) {
      // Try extracting from markdown code block
      const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      
      // Try finding JSON between braces
      const braceMatch = text.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        return JSON.parse(braceMatch[0]);
      }
      
      logger.error('Failed to parse JSON from LLM response', {
        textPreview: text.substring(0, 200)
      });
      
      throw new Error('LLM response is not valid JSON');
    }
  }
}

/**
 * Create default LLM client
 * 
 * Reads configuration from environment variables:
 * - LATERAL_THINKING_LLM_PROVIDER (default: 'anthropic')
 * - LATERAL_THINKING_LLM_MODEL (default: 'claude-3-5-sonnet-20241022')
 * - ANTHROPIC_API_KEY or OPENAI_API_KEY
 * 
 * @returns {LLMClient} Configured client
 */
export function createDefaultClient() {
  const provider = process.env.LATERAL_THINKING_LLM_PROVIDER || 'anthropic';
  const model = process.env.LATERAL_THINKING_LLM_MODEL || 
    (provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4');
  
  return new LLMClient({
    provider,
    model,
    temperature: parseFloat(process.env.LATERAL_THINKING_LLM_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.LATERAL_THINKING_LLM_MAX_TOKENS || '500', 10)
  });
}

export default LLMClient;

