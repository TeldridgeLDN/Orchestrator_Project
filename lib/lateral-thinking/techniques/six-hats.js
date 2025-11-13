/**
 * Six Thinking Hats Technique Implementation
 * 
 * Multi-perspective analysis framework examining problems from six distinct viewpoints:
 * - White Hat: Data and facts
 * - Red Hat: Emotions and intuition
 * - Black Hat: Caution and risks
 * - Yellow Hat: Benefits and optimism
 * - Green Hat: Creativity and alternatives
 * - Blue Hat: Process and control
 * 
 * @module lateral-thinking/techniques/six-hats
 */

import { BaseTechnique } from './base-technique.js';
import { log as logger } from '../../utils/logger.js';

/**
 * Six Thinking Hats with their perspectives
 */
const HATS = {
  white: {
    name: 'White Hat',
    emoji: '⚪',
    focus: 'Data and Facts',
    question: 'What information do we have? What data is missing? What do the facts tell us?',
    approach: 'Objective analysis of available information'
  },
  red: {
    name: 'Red Hat',
    emoji: '🔴',
    focus: 'Emotions and Intuition',
    question: 'What does intuition suggest? How do we feel about this? What are the gut reactions?',
    approach: 'Emotional and intuitive responses'
  },
  black: {
    name: 'Black Hat',
    emoji: '⚫',
    focus: 'Caution and Risks',
    question: 'What could go wrong? What are the weaknesses? Why might this fail?',
    approach: 'Critical assessment of potential problems'
  },
  yellow: {
    name: 'Yellow Hat',
    emoji: '🟡',
    focus: 'Benefits and Optimism',
    question: 'What are the benefits? What is the best case scenario? What value does this create?',
    approach: 'Positive thinking about outcomes and opportunities'
  },
  green: {
    name: 'Green Hat',
    emoji: '🟢',
    focus: 'Creativity and Alternatives',
    question: 'What are alternative approaches? How can we think differently? What if we broke the rules?',
    approach: 'Creative and lateral thinking'
  },
  blue: {
    name: 'Blue Hat',
    emoji: '🔵',
    focus: 'Process and Control',
    question: 'What thinking process should we use? How do we organize this? What have we learned?',
    approach: 'Meta-cognitive thinking about the thinking process'
  }
};

/**
 * Six Thinking Hats Technique Class
 */
export class SixThinkingHats extends BaseTechnique {
  constructor() {
    super('six-hats', 'Six Thinking Hats - Multi-perspective analysis');
    this.hats = HATS;
  }

  /**
   * Generate ideas from different hat perspectives
   * 
   * @param {Object} context - Problem context
   * @param {Object} config - Generation configuration
   * @returns {Promise<Array>} Generated ideas
   */
  async generate(context, config = {}) {
    const { ideasToGenerate = 6 } = config;  // One per hat by default
    
    logger.info('Six Hats: Starting generation', {
      problem: context.problem,
      baseline: context.baseline ? 'present' : 'absent',
      ideasToGenerate
    });

    const ideas = [];
    const hatKeys = Object.keys(this.hats);
    
    // Generate at least one idea per hat, then cycle if more needed
    for (let i = 0; i < ideasToGenerate; i++) {
      const hatKey = hatKeys[i % hatKeys.length];
      const hat = this.hats[hatKey];
      
      try {
        const idea = await this._applyHat(context, hatKey, hat);
        if (idea) {
          ideas.push(idea);
        }
      } catch (error) {
        logger.warn(`Six Hats: Hat ${hatKey} failed`, { error: error.message });
      }
    }
    
    logger.info('Six Hats: Generation complete', {
      ideasGenerated: ideas.length
    });
    
    return ideas;
  }

  /**
   * Apply a single hat perspective
   * 
   * @param {Object} context - Problem context
   * @param {string} hatKey - Hat key (white, red, etc.)
   * @param {Object} hat - Hat configuration
   * @returns {Promise<Object>} Generated idea
   * @private
   */
  async _applyHat(context, hatKey, hat) {
    const prompt = this._buildPrompt(context, hat);
    const response = await this._callLLM(prompt, context);
    
    return {
      technique: 'six-hats',
      hat: hatKey,
      hatName: hat.name,
      hatEmoji: hat.emoji,
      perspective: hat.focus,
      title: response.title,
      description: response.description,
      insight: response.insight,
      novelty: this._estimateNoveltyForHat(hatKey, response, context),
      feasibility: this._estimateFeasibility(response, context),
      metadata: {
        focus: hat.focus,
        question: hat.question,
        approach: hat.approach
      }
    };
  }

  /**
   * Build LLM prompt for a hat perspective
   * 
   * @param {Object} context - Problem context
   * @param {Object} hat - Hat configuration
   * @returns {string} Formatted prompt
   * @private
   */
  _buildPrompt(context, hat) {
    let prompt = `You are applying the Six Thinking Hats technique to analyze a problem from a specific perspective.

**Hat**: ${hat.emoji} ${hat.name}
**Focus**: ${hat.focus}
**Key Question**: ${hat.question}
**Approach**: ${hat.approach}

${this._buildContextSection(context)}

**Your Task**: Wearing the ${hat.name}, analyze this problem and generate ONE specific insight, observation, or recommendation from this perspective.

**Guidelines**:
1. Stay strictly within this hat's perspective (${hat.focus})
2. Be specific and actionable, not vague or general
3. Consider the baseline approach if one exists
4. Provide genuine insight, not superficial observations
5. Your analysis should lead to a concrete idea or recommendation

**Output Format** (JSON):
{
  "title": "Brief title for this insight (5-8 words)",
  "description": "What this perspective reveals (2-3 sentences)",
  "insight": "The key insight or recommendation from this viewpoint (2-3 sentences)",
  "actionable": "What action this perspective suggests (1-2 sentences)"
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
    logger.debug('Six Hats: Would call LLM with prompt', {
      promptLength: prompt.length,
      hasBaseline: !!context.baseline
    });
    
    // Mock response for development/testing
    return {
      title: 'Six Hats Generated Insight',
      description: 'This would be the LLM-generated perspective from this hat.',
      insight: 'This would be the key insight from this thinking perspective.',
      actionable: 'This would be the recommended action.'
    };
  }

  /**
   * Estimate novelty score based on hat type
   * 
   * @param {string} hatKey - Which hat was used
   * @param {Object} response - LLM response
   * @param {Object} context - Problem context
   * @returns {number} Novelty score
   * @private
   */
  _estimateNoveltyForHat(hatKey, response, context) {
    // Green hat is most likely to produce novel ideas
    // White/Black hats are more analytical, less novel
    const noveltyByHat = {
      green: 0.9,   // Most creative
      red: 0.7,     // Intuition can be novel
      yellow: 0.6,  // Optimistic but not always novel
      blue: 0.5,    // Meta-cognitive, moderate novelty
      white: 0.4,   // Data-focused, less novel
      black: 0.4    // Risk-focused, less novel
    };
    
    return noveltyByHat[hatKey] || 0.5;
  }
}

/**
 * Helper to apply a specific hat
 * 
 * @param {string} hatKey - Hat to apply (white, red, black, yellow, green, blue)
 * @param {Object} context - Problem context
 * @returns {Promise<Object>} Generated idea
 */
export async function applySixHat(hatKey, context) {
  const sixHats = new SixThinkingHats();
  const hat = sixHats.hats[hatKey];
  
  if (!hat) {
    throw new Error(`Unknown hat: ${hatKey}. Must be one of: ${Object.keys(sixHats.hats).join(', ')}`);
  }
  
  return await sixHats._applyHat(context, hatKey, hat);
}

export { HATS };
export default SixThinkingHats;

