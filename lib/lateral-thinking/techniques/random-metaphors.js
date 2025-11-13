/**
 * Random Metaphors Technique Implementation
 * 
 * Uses random items or concepts to spark unexpected connections and
 * cross-domain inspiration. Forces creative links between unrelated
 * domains to discover novel solutions.
 * 
 * @module lateral-thinking/techniques/random-metaphors
 */

import { BaseTechnique } from './base-technique.js';
import { log as logger } from '../../utils/logger.js';

/**
 * Metaphor source categories with example items
 */
const METAPHOR_SOURCES = {
  nature: [
    'River ecosystem', 'Tree growth', 'Ant colony', 'Weather patterns',
    'Coral reef', 'Mycelium network', 'Bird migration', 'Tides'
  ],
  everyday: [
    'Restaurant service', 'Traffic lights', 'Library system', 'Post office',
    'Coffee shop', 'Gym membership', 'Hotel check-in', 'Grocery store'
  ],
  games: [
    'Chess strategy', 'Poker hands', 'Team sports', 'Video game levels',
    'Board game mechanics', 'Card deck shuffling', 'Tournament brackets', 'Game save points'
  ],
  biology: [
    'Immune system', 'Neural networks', 'Cell division', 'DNA replication',
    'Digestive process', 'Healing wounds', 'Muscle memory', 'Circadian rhythm'
  ],
  architecture: [
    'Building foundation', 'City planning', 'Bridge construction', 'Elevator system',
    'Plumbing network', 'Fire exits', 'Load-bearing walls', 'Modular design'
  ],
  transportation: [
    'Traffic flow', 'Airport security', 'Subway system', 'Highway rest stops',
    'GPS navigation', 'Parking garage', 'Train schedule', 'Shipping logistics'
  ]
};

/**
 * Random Metaphors Technique Class
 */
export class RandomMetaphors extends BaseTechnique {
  constructor() {
    super('random-metaphors', 'Random Metaphors - Cross-domain inspiration through forced connections');
    this.sources = METAPHOR_SOURCES;
  }

  /**
   * Generate ideas through random metaphorical connections
   * 
   * @param {Object} context - Problem context
   * @param {Object} config - Generation configuration
   * @returns {Promise<Array>} Generated ideas
   */
  async generate(context, config = {}) {
    const { ideasToGenerate = 5 } = config;
    
    logger.info('Random Metaphors: Starting generation', {
      problem: context.problem,
      ideasToGenerate
    });

    const ideas = [];
    
    for (let i = 0; i < ideasToGenerate; i++) {
      try {
        const metaphor = this._selectRandomMetaphor();
        const idea = await this._applyMetaphor(context, metaphor);
        if (idea) {
          ideas.push(idea);
        }
      } catch (error) {
        logger.warn(`Random Metaphors: Metaphor ${i} failed`, { error: error.message });
      }
    }
    
    logger.info('Random Metaphors: Generation complete', {
      ideasGenerated: ideas.length
    });
    
    return ideas;
  }

  /**
   * Select a random metaphor from the sources
   * 
   * @returns {Object} Selected metaphor with category
   * @private
   */
  _selectRandomMetaphor() {
    const categories = Object.keys(this.sources);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const items = this.sources[category];
    const item = items[Math.floor(Math.random() * items.length)];
    
    return { category, item };
  }

  /**
   * Apply a metaphor to generate an idea
   * 
   * @param {Object} context - Problem context
   * @param {Object} metaphor - Selected metaphor
   * @returns {Promise<Object>} Generated idea
   * @private
   */
  async _applyMetaphor(context, metaphor) {
    const prompt = this._buildPrompt(context, metaphor);
    const response = await this._callLLM(prompt, context);
    
    return {
      technique: 'random-metaphors',
      metaphor: metaphor.item,
      category: metaphor.category,
      attributes: response.attributes,
      connection: response.connection,
      title: response.title,
      description: response.description,
      novelty: 0.75,  // Random metaphors tend to be quite novel
      feasibility: this._estimateFeasibility(response, context),
      metadata: {
        sourceCategory: metaphor.category,
        forcedConnection: true
      }
    };
  }

  /**
   * Build LLM prompt for metaphor application
   * 
   * @param {Object} context - Problem context
   * @param {Object} metaphor - Selected metaphor
   * @returns {string} Formatted prompt
   * @private
   */
  _buildPrompt(context, metaphor) {
    let prompt = `You are using the Random Metaphors creativity technique to find innovative solutions through cross-domain inspiration.

**Random Metaphor**: ${metaphor.item}
**Category**: ${metaphor.category}

${this._buildContextSection(context)}

**Your Task**:
1. List 4-5 key attributes, characteristics, or mechanisms of "${metaphor.item}"
2. Force connections between these attributes and the problem domain
3. Extract a viable, practical idea inspired by this metaphor

**Guidelines**:
- Don't be superficial - dig into how "${metaphor.item}" actually works
- The connection might not be obvious at first - that's the point
- The extracted idea should be inspired by the metaphor but practical
- Explain clearly how the metaphor led to this specific solution

**Example Process**:
Metaphor: "Restaurant Service"
Attributes: "Reservation system", "Table management", "Menu variety", "Kitchen workflow"
Connection: "Reservation → Pre-booking resources"
Idea: "Pre-allocated authentication sessions for known high-traffic times"

**Output Format** (JSON):
{
  "attributes": ["Attribute 1", "Attribute 2", "Attribute 3", "Attribute 4"],
  "connection": "How these attributes relate to the problem (2 sentences)",
  "inspiration": "What specific aspect of the metaphor inspired this idea (1-2 sentences)",
  "title": "Brief title for the idea (5-8 words)",
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
    logger.debug('Random Metaphors: Would call LLM with prompt', {
      promptLength: prompt.length,
      hasBaseline: !!context.baseline
    });
    
    // Mock response for development/testing
    return {
      attributes: ['Attribute 1', 'Attribute 2', 'Attribute 3', 'Attribute 4'],
      connection: 'The metaphor relates to the problem through these key similarities.',
      inspiration: 'The specific mechanism that inspired this approach.',
      title: 'Metaphor-Inspired Solution',
      description: 'A practical idea derived from the random metaphor.'
    };
  }

  /**
   * Estimate feasibility for metaphor-inspired ideas
   * 
   * @param {Object} response - LLM response
   * @param {Object} context - Problem context
   * @returns {number} Feasibility score
   * @private
   */
  _estimateFeasibility(response, context) {
    // Metaphor ideas can range from very practical to quite abstract
    // Check if the description is grounded
    const text = `${response.description} ${response.connection}`.toLowerCase();
    
    const groundedTerms = ['existing', 'standard', 'similar to', 'like', 'adapted from'];
    const abstractTerms = ['revolutionary', 'completely new', 'unprecedented', 'radical'];
    
    const groundedCount = groundedTerms.filter(t => text.includes(t)).length;
    const abstractCount = abstractTerms.filter(t => text.includes(t)).length;
    
    const score = 0.6 + (groundedCount * 0.10) - (abstractCount * 0.12);
    return Math.max(0.3, Math.min(score, 0.9));
  }
}

/**
 * Helper to apply a specific metaphor
 * 
 * @param {string} category - Metaphor category
 * @param {string} item - Specific metaphor item
 * @param {Object} context - Problem context
 * @returns {Promise<Object>} Generated idea
 */
export async function applySpecificMetaphor(category, item, context) {
  const randomMetaphors = new RandomMetaphors();
  
  if (!randomMetaphors.sources[category]) {
    throw new Error(`Unknown category: ${category}. Must be one of: ${Object.keys(randomMetaphors.sources).join(', ')}`);
  }
  
  return await randomMetaphors._applyMetaphor(context, { category, item });
}

export { METAPHOR_SOURCES };
export default RandomMetaphors;

