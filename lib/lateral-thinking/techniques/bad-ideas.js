/**
 * Bad Ideas Technique Implementation
 * 
 * Generate intentionally terrible ideas to find hidden value. By explicitly
 * seeking bad solutions, we:
 * - Remove fear of judgment
 * - Uncover why certain approaches are bad (revealing constraints)
 * - Extract valuable aspects from terrible ideas
 * - Challenge what we assume is "obviously wrong"
 * 
 * @module lateral-thinking/techniques/bad-ideas
 */

import { BaseTechnique } from './base-technique.js';
import { log as logger } from '../../utils/logger.js';

/**
 * Categories of "bad" with extraction strategies
 */
const BAD_IDEA_CATEGORIES = {
  insecure: {
    name: 'Intentionally Insecure',
    instruction: 'Make it completely insecure or unsafe',
    extraction: 'What if the "problem" the security solves could be eliminated?'
  },
  slow: {
    name: 'Intentionally Slow',
    instruction: 'Make it as slow and inefficient as possible',
    extraction: 'What if the slowness reveals what really matters?'
  },
  expensive: {
    name: 'Intentionally Expensive',
    instruction: 'Make it prohibitively expensive to implement or run',
    extraction: 'What if the cost reveals where value really comes from?'
  },
  complex: {
    name: 'Intentionally Complex',
    instruction: 'Make it as complicated and convoluted as possible',
    extraction: 'What if the complexity reveals what could be simplified elsewhere?'
  },
  limited: {
    name: 'Intentionally Limited',
    instruction: 'Make it work only in the most restrictive conditions',
    extraction: 'What if these limitations reveal the real core requirements?'
  }
};

/**
 * Bad Ideas Technique Class
 */
export class BadIdeas extends BaseTechnique {
  constructor() {
    super('bad-ideas', 'Bad Ideas - Extract value from intentionally terrible suggestions');
    this.categories = BAD_IDEA_CATEGORIES;
  }

  /**
   * Generate ideas by creating bad ideas and extracting value
   * 
   * @param {Object} context - Problem context
   * @param {Object} config - Generation configuration
   * @returns {Promise<Array>} Generated ideas
   */
  async generate(context, config = {}) {
    const { ideasToGenerate = 5 } = config;
    
    logger.info('Bad Ideas: Starting generation', {
      problem: context.problem,
      ideasToGenerate
    });

    const ideas = [];
    const categoryKeys = Object.keys(this.categories);
    
    // Generate at least one bad idea per category, then cycle
    for (let i = 0; i < ideasToGenerate; i++) {
      const categoryKey = categoryKeys[i % categoryKeys.length];
      const category = this.categories[categoryKey];
      
      try {
        const idea = await this._generateBadIdea(context, categoryKey, category);
        if (idea) {
          ideas.push(idea);
        }
      } catch (error) {
        logger.warn(`Bad Ideas: Category ${categoryKey} failed`, { error: error.message });
      }
    }
    
    logger.info('Bad Ideas: Generation complete', {
      ideasGenerated: ideas.length
    });
    
    return ideas;
  }

  /**
   * Generate one bad idea and extract value
   * 
   * @param {Object} context - Problem context
   * @param {string} categoryKey - Bad idea category key
   * @param {Object} category - Category configuration
   * @returns {Promise<Object>} Generated idea
   * @private
   */
  async _generateBadIdea(context, categoryKey, category) {
    const prompt = this._buildPrompt(context, category);
    const response = await this._callLLM(prompt, context);
    
    return {
      technique: 'bad-ideas',
      badIdeaCategory: categoryKey,
      categoryName: category.name,
      badIdea: response.badIdea,
      whyBad: response.whyBad,
      extraction: response.extraction,
      title: response.title,
      description: response.description,
      novelty: 0.7,  // Bad ideas often lead to novel insights
      feasibility: this._estimateFeasibility(response, context),
      metadata: {
        instruction: category.instruction,
        extractionStrategy: category.extraction
      }
    };
  }

  /**
   * Build LLM prompt for bad idea generation
   * 
   * @param {Object} context - Problem context
   * @param {Object} category - Bad idea category
   * @returns {string} Formatted prompt
   * @private
   */
  _buildPrompt(context, category) {
    let prompt = `You are using the Bad Ideas creativity technique to find valuable insights by intentionally generating terrible solutions.

**Bad Idea Category**: ${category.name}
**Instruction**: ${category.instruction}
**Extraction Strategy**: ${category.extraction}

${this._buildContextSection(context)}

**Your Task**:
1. Generate ONE intentionally BAD idea following the "${category.name}" instruction
2. Explain clearly WHY this idea is bad (what problems it creates)
3. Extract a GOOD, VIABLE idea from analyzing why the bad idea is bad

**Important Guidelines**:
- The bad idea should be obviously terrible - don't hold back
- Be specific about why it's bad (not just "it's insecure" but HOW and WHY)
- The extracted idea should flip the bad idea into something valuable
- The extracted idea should be practical and implementable
- Explain the connection between the bad idea and the extracted good idea

**Example Process**:
Bad Idea (Insecure): "Store all passwords in plain text in a public database"
Why Bad: "Zero security, passwords visible to everyone, violates every security principle"
Extraction: "If passwords are the problem, eliminate them entirely - use passwordless auth"
Good Idea: "Passwordless authentication via biometrics or magic links"

**Output Format** (JSON):
{
  "badIdea": "The intentionally terrible idea (1-2 sentences)",
  "whyBad": "Detailed explanation of why this is bad and what problems it creates (2-3 sentences)",
  "extraction": "The insight gained from why it's bad (1-2 sentences)",
  "connection": "How analyzing the bad idea led to the good idea (1-2 sentences)",
  "title": "Brief title for the extracted good idea (5-8 words)",
  "description": "Clear description of the practical idea extracted (2-3 sentences)"
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
    logger.debug('Bad Ideas: Would call LLM with prompt', {
      promptLength: prompt.length,
      hasBaseline: !!context.baseline
    });
    
    // Mock response for development/testing
    return {
      badIdea: 'A deliberately terrible approach to solving this problem.',
      whyBad: 'This is bad because it violates fundamental principles and creates numerous problems.',
      extraction: 'By analyzing why this is bad, we realize a better approach.',
      connection: 'The bad idea revealed a constraint that we can eliminate or transform.',
      title: 'Value Extracted from Bad Idea',
      description: 'A practical, viable solution inspired by understanding why the bad idea fails.'
    };
  }

  /**
   * Estimate feasibility for extracted ideas
   * Ideas from bad-ideas technique can be surprisingly practical
   * 
   * @param {Object} response - LLM response
   * @param {Object} context - Problem context
   * @returns {number} Feasibility score
   * @private
   */
  _estimateFeasibility(response, context) {
    // Check if the extraction is grounded or still somewhat radical
    const text = `${response.extraction} ${response.description}`.toLowerCase();
    
    // Good signs
    const practicalTerms = ['eliminate', 'simplify', 'reduce', 'focus', 'core'];
    // Warning signs
    const radicalTerms = ['completely different', 'revolutionary', 'unprecedented'];
    
    const practicalCount = practicalTerms.filter(t => text.includes(t)).length;
    const radicalCount = radicalTerms.filter(t => text.includes(t)).length;
    
    // Bad ideas often extract surprisingly practical solutions
    const score = 0.65 + (practicalCount * 0.08) - (radicalCount * 0.12);
    return Math.max(0.3, Math.min(score, 0.95));
  }
}

/**
 * Helper to generate a bad idea in a specific category
 * 
 * @param {string} category - Category (insecure, slow, expensive, complex, limited)
 * @param {Object} context - Problem context
 * @returns {Promise<Object>} Generated idea
 */
export async function generateBadIdea(category, context) {
  const badIdeas = new BadIdeas();
  const cat = badIdeas.categories[category];
  
  if (!cat) {
    throw new Error(`Unknown category: ${category}. Must be one of: ${Object.keys(badIdeas.categories).join(', ')}`);
  }
  
  return await badIdeas._generateBadIdea(context, category, cat);
}

export { BAD_IDEA_CATEGORIES };
export default BadIdeas;

