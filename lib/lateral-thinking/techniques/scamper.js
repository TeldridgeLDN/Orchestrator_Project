/**
 * SCAMPER Technique Implementation
 * 
 * Systematic transformation through seven dimensions:
 * - Substitute: Replace components with alternatives
 * - Combine: Merge elements or concepts
 * - Adapt: Adjust for different context
 * - Modify: Change attributes
 * - Put to other uses: Repurpose
 * - Eliminate: Remove unnecessary elements
 * - Reverse: Flip or invert
 * 
 * @module lateral-thinking/techniques/scamper
 */

import { BaseTechnique } from './base-technique.js';
import { log as logger } from '../../utils/logger.js';

/**
 * SCAMPER dimensions with prompting strategies
 */
const DIMENSIONS = {
  substitute: {
    name: 'Substitute',
    prompt: 'What components, materials, processes, or technologies can we REPLACE or SUBSTITUTE?',
    focus: ['components', 'materials', 'processes', 'people', 'technology', 'methods']
  },
  combine: {
    name: 'Combine',
    prompt: 'What elements, features, or concepts can we MERGE or COMBINE?',
    focus: ['features', 'services', 'technologies', 'workflows', 'teams', 'data sources']
  },
  adapt: {
    name: 'Adapt',
    prompt: 'How can we ADAPT or ADJUST this for different contexts, users, or environments?',
    focus: ['scaling', 'different users', 'different environments', 'different platforms']
  },
  modify: {
    name: 'Modify',
    prompt: 'What can we CHANGE, MAGNIFY, or MINIMIZE? What attributes can we alter?',
    focus: ['size', 'speed', 'complexity', 'scope', 'frequency', 'intensity']
  },
  putToUse: {
    name: 'Put to Other Uses',
    prompt: 'What ELSE can this be used for? Are there alternative applications or purposes?',
    focus: ['alternative applications', 'different problems', 'new markets', 'unexpected uses']
  },
  eliminate: {
    name: 'Eliminate',
    prompt: 'What can we REMOVE, SIMPLIFY, or STREAMLINE? What is unnecessary?',
    focus: ['features', 'steps', 'complexity', 'dependencies', 'assumptions']
  },
  reverse: {
    name: 'Reverse',
    prompt: 'What if we REVERSED, FLIPPED, or INVERTED this? What happens if we do the opposite?',
    focus: ['flow direction', 'responsibility', 'assumptions', 'order', 'roles']
  }
};

/**
 * SCAMPER Technique Class
 */
export class SCAMPER extends BaseTechnique {
  constructor() {
    super('scamper', 'SCAMPER - Systematic transformation through seven dimensions');
  }

  /**
   * Generate ideas using SCAMPER dimensions
   * 
   * @param {Object} context - Problem context
   * @param {Object} config - Generation configuration
   * @returns {Promise<Array>} Generated ideas
   */
  async generate(context, config = {}) {
    const { ideasToGenerate = 7 } = config;  // One per dimension by default
    
    logger.info('SCAMPER: Starting generation', {
      problem: context.problem,
      baseline: context.baseline ? 'present' : 'absent',
      ideasToGenerate
    });

    const ideas = [];
    const dimensionKeys = Object.keys(DIMENSIONS);
    
    // Generate at least one idea per dimension, then cycle if more needed
    for (let i = 0; i < ideasToGenerate; i++) {
      const dimensionKey = dimensionKeys[i % dimensionKeys.length];
      const dimension = DIMENSIONS[dimensionKey];
      
      try {
        const idea = await this._applyDimension(context, dimensionKey, dimension);
        if (idea) {
          ideas.push(idea);
        }
      } catch (error) {
        logger.warn(`SCAMPER: Dimension ${dimensionKey} failed`, { error: error.message });
      }
    }
    
    logger.info('SCAMPER: Generation complete', {
      ideasGenerated: ideas.length
    });
    
    return ideas;
  }

  /**
   * Apply a single SCAMPER dimension
   * 
   * @param {Object} context - Problem context
   * @param {string} dimensionKey - Dimension key
   * @param {Object} dimension - Dimension configuration
   * @returns {Promise<Object>} Generated idea
   * @private
   */
  async _applyDimension(context, dimensionKey, dimension) {
    const prompt = this._buildPrompt(context, dimension);
    
    // This is where we would call the actual LLM
    // For now, return a structured response that shows what would be generated
    const response = await this._callLLM(prompt, context);
    
    return {
      technique: 'scamper',
      dimension: dimensionKey,
      dimensionName: dimension.name,
      title: response.title,
      description: response.description,
      rationale: response.rationale,
      novelty: this._estimateNovelty(response, context),
      feasibility: this._estimateFeasibility(response, context),
      metadata: {
        focus: dimension.focus,
        prompt: dimension.prompt
      }
    };
  }

  /**
   * Build LLM prompt for a dimension
   * 
   * @param {Object} context - Problem context
   * @param {Object} dimension - Dimension configuration
   * @returns {string} Formatted prompt
   * @private
   */
  _buildPrompt(context, dimension) {
    const { problem, baseline, research, constraints = [], goals = [] } = context;
    
    let prompt = `You are applying the SCAMPER creativity technique to generate an innovative solution.

**SCAMPER Dimension**: ${dimension.name}
**Question**: ${dimension.prompt}
**Focus Areas**: ${dimension.focus.join(', ')}

**Problem/Challenge**:
${problem}
`;

    if (baseline) {
      prompt += `
**Current/Baseline Approach**:
${typeof baseline === 'string' ? baseline : JSON.stringify(baseline, null, 2)}
`;
    }

    if (research) {
      prompt += `
**Research Context**:
${typeof research === 'string' ? research : JSON.stringify(research, null, 2)}
`;
    }

    if (constraints.length > 0) {
      prompt += `
**Constraints to Consider**:
${constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}
`;
    }

    if (goals.length > 0) {
      prompt += `
**Goals/Objectives**:
${goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}
`;
    }

    prompt += `
**Task**: Generate ONE specific, actionable idea by applying the ${dimension.name} dimension. Your idea should:
1. Directly address the problem using the ${dimension.name} approach
2. Be concrete and implementable (not vague or abstract)
3. Build on or transform the baseline approach if one exists
4. Respect the constraints while achieving the goals
5. Be genuinely different from obvious solutions

**Output Format** (JSON):
{
  "title": "Brief, catchy title for the idea (5-8 words)",
  "description": "Clear description of what this idea involves (2-3 sentences)",
  "rationale": "Why this ${dimension.name}-based approach is interesting and valuable (2-3 sentences)",
  "implementation": "Key steps or considerations for implementing this (3-5 bullet points)"
}

Respond with ONLY valid JSON, no additional text.`;

    return prompt;
  }

  /**
   * Call LLM with prompt (placeholder for actual implementation)
   * 
   * @param {string} prompt - Formatted prompt
   * @param {Object} context - Problem context
   * @returns {Promise<Object>} LLM response
   * @private
   */
  async _callLLM(prompt, context) {
    // TODO: Implement actual LLM call
    // This would integrate with whatever LLM provider is configured
    // For now, return a mock response
    
    logger.debug('SCAMPER: Would call LLM with prompt', {
      promptLength: prompt.length,
      hasBaseline: !!context.baseline
    });
    
    // Mock response for development/testing
    return {
      title: 'Generated Idea Title',
      description: 'This would be the LLM-generated description of the idea.',
      rationale: 'This would be the LLM-generated rationale for why this idea is valuable.',
      implementation: [
        'Implementation step 1',
        'Implementation step 2',
        'Implementation step 3'
      ]
    };
  }

  /**
   * Estimate novelty score (0-1)
   * 
   * @param {Object} response - LLM response
   * @param {Object} context - Problem context
   * @returns {number} Novelty score
   * @private
   */
  _estimateNovelty(response, context) {
    // Simple heuristic: compare to baseline
    if (!context.baseline) return 0.7;  // Default medium-high if no baseline
    
    // Check if idea mentions transformative keywords
    const transformative = ['eliminate', 'reverse', 'invert', 'opposite', 'completely', 'radical'];
    const text = `${response.title} ${response.description}`.toLowerCase();
    const transformativeCount = transformative.filter(word => text.includes(word)).length;
    
    return Math.min(0.5 + (transformativeCount * 0.1), 1.0);
  }

  /**
   * Estimate feasibility score (0-1)
   * 
   * @param {Object} response - LLM response
   * @param {Object} context - Problem context
   * @returns {number} Feasibility score
   * @private
   */
  _estimateFeasibility(response, context) {
    // Simple heuristic: check for complexity indicators
    const complex = ['requires', 'needs', 'must', 'challenging', 'difficult', 'complex'];
    const text = `${response.description} ${response.rationale}`.toLowerCase();
    const complexityCount = complex.filter(word => text.includes(word)).length;
    
    // More complexity indicators = lower feasibility
    return Math.max(0.3, 1.0 - (complexityCount * 0.1));
  }
}

/**
 * Helper function to apply specific SCAMPER dimension
 * 
 * @param {string} dimension - Dimension name (substitute, combine, etc.)
 * @param {Object} context - Problem context
 * @returns {Promise<Object>} Generated idea
 */
export async function applySCAMPERDimension(dimension, context) {
  const scamper = new SCAMPER();
  const dimensionConfig = DIMENSIONS[dimension];
  
  if (!dimensionConfig) {
    throw new Error(`Unknown SCAMPER dimension: ${dimension}`);
  }
  
  return await scamper._applyDimension(context, dimension, dimensionConfig);
}

export { DIMENSIONS };
export default SCAMPER;

