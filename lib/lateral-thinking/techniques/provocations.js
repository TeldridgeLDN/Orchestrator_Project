/**
 * Provocations Technique Implementation
 * 
 * Deliberately false or extreme statements to disrupt thinking patterns and
 * spark creative alternatives. Five types of provocations:
 * - Contradiction: Opposite of assumptions
 * - Distortion: Extreme exaggeration
 * - Reversal: Flip key aspects
 * - Wishful: Impossible ideal scenarios
 * - Escapism: Remove constraints entirely
 * 
 * @module lateral-thinking/techniques/provocations
 */

import { BaseTechnique } from './base-technique.js';
import { log as logger } from '../../utils/logger.js';

/**
 * Provocation types and patterns
 */
const PROVOCATION_TYPES = {
  contradiction: {
    name: 'Contradiction',
    pattern: 'What if [opposite of assumption] were true?',
    description: 'Challenge core assumptions by stating the opposite',
    example: 'What if users didn\'t need to log in at all?'
  },
  distortion: {
    name: 'Distortion',
    pattern: 'What if [extreme version of attribute]?',
    description: 'Exaggerate or minimize to an extreme degree',
    example: 'What if authentication took 0.001 seconds or 1 hour?'
  },
  reversal: {
    name: 'Reversal',
    pattern: 'What if we reversed [key aspect]?',
    description: 'Flip the direction, flow, or responsibility',
    example: 'What if the server authenticated to the client instead?'
  },
  wishful: {
    name: 'Wishful Thinking',
    pattern: 'What if [ideal impossible scenario]?',
    description: 'Imagine a perfect world without limitations',
    example: 'What if authentication was instant and perfectly secure with zero effort?'
  },
  escapism: {
    name: 'Escapism',
    pattern: 'What if [remove major constraint]?',
    description: 'Eliminate a fundamental constraint or requirement',
    example: 'What if we didn\'t care about security at all?'
  }
};

/**
 * Provocations Technique Class
 */
export class Provocations extends BaseTechnique {
  constructor() {
    super('provocations', 'Provocations - Disruptive false statements to spark creativity');
    this.types = PROVOCATION_TYPES;
  }

  /**
   * Generate ideas through provocative statements
   * 
   * @param {Object} context - Problem context
   * @param {Object} config - Generation configuration
   * @returns {Promise<Array>} Generated ideas
   */
  async generate(context, config = {}) {
    const { ideasToGenerate = 5 } = config;  // One per provocation type by default
    
    logger.info('Provocations: Starting generation', {
      problem: context.problem,
      baseline: context.baseline ? 'present' : 'absent',
      ideasToGenerate
    });

    const ideas = [];
    const typeKeys = Object.keys(this.types);
    
    // Generate at least one idea per type, then cycle if more needed
    for (let i = 0; i < ideasToGenerate; i++) {
      const typeKey = typeKeys[i % typeKeys.length];
      const type = this.types[typeKey];
      
      try {
        const idea = await this._applyProvocation(context, typeKey, type);
        if (idea) {
          ideas.push(idea);
        }
      } catch (error) {
        logger.warn(`Provocations: Type ${typeKey} failed`, { error: error.message });
      }
    }
    
    logger.info('Provocations: Generation complete', {
      ideasGenerated: ideas.length
    });
    
    return ideas;
  }

  /**
   * Apply a single provocation type
   * 
   * @param {Object} context - Problem context
   * @param {string} typeKey - Provocation type key
   * @param {Object} type - Provocation type configuration
   * @returns {Promise<Object>} Generated idea
   * @private
   */
  async _applyProvocation(context, typeKey, type) {
    const prompt = this._buildPrompt(context, type);
    const response = await this._callLLM(prompt, context);
    
    return {
      technique: 'provocations',
      provocationType: typeKey,
      provocationName: type.name,
      provocation: response.provocation,
      extraction: response.extraction,
      title: response.title,
      description: response.description,
      novelty: 0.8,  // Provocations are inherently high novelty
      feasibility: this._estimateFeasibility(response, context),
      metadata: {
        pattern: type.pattern,
        typeDescription: type.description
      }
    };
  }

  /**
   * Build LLM prompt for a provocation type
   * 
   * @param {Object} context - Problem context
   * @param {Object} type - Provocation type configuration
   * @returns {string} Formatted prompt
   * @private
   */
  _buildPrompt(context, type) {
    let prompt = `You are using the Provocations creativity technique to break free from conventional thinking.

**Provocation Type**: ${type.name}
**Pattern**: ${type.pattern}
**Description**: ${type.description}
**Example**: ${type.example}

${this._buildContextSection(context)}

**Your Task**: 
1. Create a deliberately FALSE or EXTREME provocation statement about this problem using the ${type.name} pattern
2. Then extract a VIABLE, PRACTICAL idea from that provocation

**Important Guidelines**:
- The provocation should be obviously false, extreme, or impossible
- The provocation's purpose is to break assumptions and spark new thinking
- The extraction should be a real, implementable idea inspired by the provocation
- The extracted idea should be different from obvious solutions
- Explain how the provocation led to the extracted idea

**Output Format** (JSON):
{
  "provocation": "The deliberately false/extreme statement (1 sentence)",
  "why_provocative": "Why this challenges conventional thinking (1 sentence)",
  "extraction": "The viable idea extracted from this provocation (2 sentences)",
  "connection": "How the provocation led to this idea (1-2 sentences)",
  "title": "Brief title for the extracted idea (5-8 words)",
  "description": "Clear description of the practical idea (2-3 sentences)"
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
    logger.debug('Provocations: Would call LLM with prompt', {
      promptLength: prompt.length,
      hasBaseline: !!context.baseline
    });
    
    // Mock response for development/testing
    return {
      provocation: 'What if users never needed to authenticate?',
      why_provocative: 'Challenges the fundamental assumption that authentication is necessary',
      extraction: 'Anonymous-first architecture with progressive authentication',
      connection: 'The provocation led to rethinking when authentication is truly needed',
      title: 'Progressive Authentication Model',
      description: 'Users start anonymous, authenticate only when accessing sensitive features. Reduces friction while maintaining security where needed.'
    };
  }

  /**
   * Estimate feasibility for provocative ideas
   * Provocations tend to be less feasible but more novel
   * 
   * @param {Object} response - LLM response
   * @param {Object} context - Problem context
   * @returns {number} Feasibility score
   * @private
   */
  _estimateFeasibility(response, context) {
    // Check if the extraction mentions implementation challenges
    const text = `${response.extraction} ${response.description}`.toLowerCase();
    
    const feasibilityHints = ['simple', 'existing', 'standard', 'proven', 'straightforward'];
    const challengeHints = ['requires', 'significant', 'major', 'complex', 'challenging'];
    
    const feasibleCount = feasibilityHints.filter(h => text.includes(h)).length;
    const challengeCount = challengeHints.filter(h => text.includes(h)).length;
    
    // Start at medium-low (provocations are often radical)
    // Adjust based on hints
    const score = 0.55 + (feasibleCount * 0.08) - (challengeCount * 0.10);
    return Math.max(0.2, Math.min(score, 0.9));
  }
}

/**
 * Helper to apply a specific provocation type
 * 
 * @param {string} type - Provocation type (contradiction, distortion, reversal, wishful, escapism)
 * @param {Object} context - Problem context
 * @returns {Promise<Object>} Generated idea
 */
export async function applyProvocation(type, context) {
  const provocations = new Provocations();
  const provType = provocations.types[type];
  
  if (!provType) {
    throw new Error(`Unknown provocation type: ${type}. Must be one of: ${Object.keys(provocations.types).join(', ')}`);
  }
  
  return await provocations._applyProvocation(context, type, provType);
}

export { PROVOCATION_TYPES };
export default Provocations;

