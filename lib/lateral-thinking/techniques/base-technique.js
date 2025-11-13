/**
 * Base Technique Class
 * 
 * Abstract base class for all lateral thinking techniques.
 * Provides common functionality for idea generation, LLM integration,
 * and basic scoring heuristics.
 * 
 * @module lateral-thinking/techniques/base-technique
 */

import { log as logger } from '../../utils/logger.js';
import { createDefaultClient } from '../llm/client.js';

/**
 * Base Technique Abstract Class
 */
export class BaseTechnique {
  /**
   * Create base technique
   * 
   * @param {string} name - Technique name
   * @param {string} description - Technique description
   * @param {Object} llmClient - Optional LLM client (defaults to createDefaultClient())
   */
  constructor(name, description, llmClient = null) {
    if (new.target === BaseTechnique) {
      throw new Error('BaseTechnique is abstract and cannot be instantiated directly');
    }
    
    this.name = name;
    this.description = description;
    this.llmClient = llmClient || createDefaultClient();
  }

  /**
   * Generate ideas using this technique
   * Must be implemented by subclasses
   * 
   * @param {Object} context - Problem context
   * @param {Object} config - Generation configuration
   * @returns {Promise<Array>} Generated ideas
   * @abstract
   */
  async generate(context, config) {
    throw new Error(`${this.name}: generate() must be implemented by subclass`);
  }

  /**
   * Validate context has required fields
   * 
   * @param {Object} context - Problem context
   * @param {Array<string>} required - Required field names
   * @throws {Error} If required fields missing
   * @protected
   */
  _validateContext(context, required = ['problem']) {
    for (const field of required) {
      if (!context[field]) {
        throw new Error(`${this.name}: Missing required context field: ${field}`);
      }
    }
  }

  /**
   * Call LLM with a prompt
   * 
   * @param {string} prompt - Prompt to send to LLM
   * @param {Object} context - Problem context (for logging)
   * @param {Object} options - Override options
   * @returns {Promise<Object>} Parsed JSON response
   * @protected
   */
  async _callLLM(prompt, context = {}, options = {}) {
    try {
      logger.debug(`${this.name}: Calling LLM`, {
        promptLength: prompt.length,
        provider: this.llmClient.config.provider
      });

      const response = await this.llmClient.generate(prompt, options);
      const parsed = this._parseLLMResponse(response.text);
      
      return parsed;
    } catch (error) {
      logger.error(`${this.name}: LLM call failed`, {
        error: error.message
      });
      
      // Return a fallback response
      return {
        title: `${this.name} - Generation Error`,
        description: 'Failed to generate idea from LLM',
        rationale: error.message,
        error: true
      };
    }
  }

  /**
   * Parse LLM JSON response safely
   * 
   * @param {string} response - Raw LLM response
   * @returns {Object} Parsed JSON or error object
   * @protected
   */
  _parseLLMResponse(response) {
    try {
      // Use the LLM client's parser which handles markdown blocks
      return this.llmClient.parseJSON(response);
    } catch (error) {
      logger.error(`${this.name}: Failed to parse LLM response`, {
        error: error.message,
        response: response.substring(0, 200)
      });
      return {
        title: 'Parse Error',
        description: 'Failed to parse LLM response',
        rationale: 'LLM response was not valid JSON',
        error: true
      };
    }
  }

  /**
   * Estimate novelty score (0-1)
   * Simple heuristic based on keywords
   * Can be overridden by subclasses
   * 
   * @param {Object} idea - Generated idea
   * @param {Object} context - Problem context
   * @returns {number} Novelty score
   * @protected
   */
  _estimateNovelty(idea, context) {
    if (!context.baseline) return 0.6;  // Medium if no baseline to compare
    
    const novelKeywords = [
      'new', 'novel', 'innovative', 'unique', 'different',
      'unprecedented', 'revolutionary', 'breakthrough', 'disruptive'
    ];
    
    const text = `${idea.title} ${idea.description}`.toLowerCase();
    const matches = novelKeywords.filter(word => text.includes(word)).length;
    
    return Math.min(0.4 + (matches * 0.1), 1.0);
  }

  /**
   * Estimate feasibility score (0-1)
   * Simple heuristic based on keywords
   * Can be overridden by subclasses
   * 
   * @param {Object} idea - Generated idea
   * @param {Object} context - Problem context
   * @returns {number} Feasibility score
   * @protected
   */
  _estimateFeasibility(idea, context) {
    const complexityIndicators = [
      'requires', 'needs', 'must', 'challenging', 'difficult',
      'complex', 'significant', 'extensive', 'major'
    ];
    
    const feasibilityIndicators = [
      'simple', 'easy', 'straightforward', 'existing', 'available',
      'quick', 'minimal', 'lightweight'
    ];
    
    const text = `${idea.description} ${idea.rationale}`.toLowerCase();
    
    const complexCount = complexityIndicators.filter(word => text.includes(word)).length;
    const feasibleCount = feasibilityIndicators.filter(word => text.includes(word)).length;
    
    const score = 0.7 + (feasibleCount * 0.05) - (complexCount * 0.08);
    return Math.max(0.2, Math.min(score, 1.0));
  }

  /**
   * Extract constraints from context
   * 
   * @param {Object} context - Problem context
   * @returns {Array<string>} List of constraints
   * @protected
   */
  _extractConstraints(context) {
    const constraints = [];
    
    if (context.constraints && Array.isArray(context.constraints)) {
      constraints.push(...context.constraints);
    }
    
    if (context.timeline) {
      constraints.push(`Timeline: ${context.timeline}`);
    }
    
    if (context.budget) {
      constraints.push(`Budget: ${context.budget}`);
    }
    
    if (context.team && context.team.capabilities) {
      constraints.push(`Team expertise: ${context.team.capabilities.join(', ')}`);
    }
    
    return constraints;
  }

  /**
   * Extract goals from context
   * 
   * @param {Object} context - Problem context
   * @returns {Array<string>} List of goals
   * @protected
   */
  _extractGoals(context) {
    const goals = [];
    
    if (context.goals && Array.isArray(context.goals)) {
      goals.push(...context.goals);
    }
    
    if (context.objectives && Array.isArray(context.objectives)) {
      goals.push(...context.objectives);
    }
    
    if (context.successCriteria) {
      goals.push(...context.successCriteria);
    }
    
    return goals;
  }

  /**
   * Build common context section for prompts
   * 
   * @param {Object} context - Problem context
   * @returns {string} Formatted context section
   * @protected
   */
  _buildContextSection(context) {
    let section = `**Problem/Challenge**:\n${context.problem}\n`;
    
    if (context.baseline) {
      section += `\n**Current/Baseline Approach**:\n${this._formatBaseline(context.baseline)}\n`;
    }
    
    if (context.research) {
      section += `\n**Research Context**:\n${this._formatResearch(context.research)}\n`;
    }
    
    const constraints = this._extractConstraints(context);
    if (constraints.length > 0) {
      section += `\n**Constraints**:\n${constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n`;
    }
    
    const goals = this._extractGoals(context);
    if (goals.length > 0) {
      section += `\n**Goals**:\n${goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}\n`;
    }
    
    return section;
  }

  /**
   * Format baseline for display
   * 
   * @param {*} baseline - Baseline approach (string or object)
   * @returns {string} Formatted baseline
   * @private
   */
  _formatBaseline(baseline) {
    if (typeof baseline === 'string') {
      return baseline;
    }
    
    if (baseline.approach) {
      return baseline.approach;
    }
    
    return JSON.stringify(baseline, null, 2);
  }

  /**
   * Format research for display
   * 
   * @param {*} research - Research findings
   * @returns {string} Formatted research
   * @private
   */
  _formatResearch(research) {
    if (typeof research === 'string') {
      return research;
    }
    
    if (research.summary) {
      return research.summary;
    }
    
    if (research.findings) {
      return JSON.stringify(research.findings, null, 2);
    }
    
    return JSON.stringify(research, null, 2);
  }

  /**
   * Get technique metadata
   * 
   * @returns {Object} Technique metadata
   */
  getMetadata() {
    return {
      name: this.name,
      description: this.description,
      type: this.constructor.name
    };
  }
}

export default BaseTechnique;

