/**
 * Idea Scoring System
 * 
 * Scores generated ideas across four dimensions:
 * - Feasibility (35%): Can we actually build this?
 * - Impact (35%): Will it solve the problem effectively?
 * - Novelty (20%): Is it genuinely different/creative?
 * - Context Fit (10%): Does it match constraints and goals?
 * 
 * @module lateral-thinking/scoring/scorer
 */

import { log as logger } from '../../utils/logger.js';

/**
 * Scoring weights (must sum to 1.0)
 */
const DEFAULT_WEIGHTS = {
  feasibility: 0.35,
  impact: 0.35,
  novelty: 0.20,
  contextFit: 0.10
};

/**
 * Scorer Class
 * 
 * Evaluates and ranks ideas based on multiple criteria
 */
export class Scorer {
  /**
   * Create scorer with optional custom weights
   * 
   * @param {Object} weights - Custom scoring weights
   */
  constructor(weights = {}) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
    
    // Validate weights sum to 1.0
    const sum = Object.values(this.weights).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      logger.warn('Scoring weights do not sum to 1.0', { weights: this.weights, sum });
    }
  }

  /**
   * Score all ideas
   * 
   * @param {Array} ideas - Ideas to score
   * @param {Object} context - Problem context
   * @returns {Promise<Array>} Scored ideas
   */
  async scoreAll(ideas, context) {
    logger.info('Scorer: Scoring ideas', {
      ideaCount: ideas.length,
      hasContext: !!context
    });

    const scored = await Promise.all(
      ideas.map(idea => this.score(idea, context))
    );

    logger.info('Scorer: Scoring complete', {
      scoredCount: scored.length,
      avgScore: this._calculateAverage(scored.map(s => s.score.total))
    });

    return scored;
  }

  /**
   * Score a single idea
   * 
   * @param {Object} idea - Idea to score
   * @param {Object} context - Problem context
   * @returns {Promise<Object>} Scored idea
   */
  async score(idea, context) {
    // Calculate each dimension
    const feasibility = await this._assessFeasibility(idea, context);
    const impact = await this._assessImpact(idea, context);
    const novelty = await this._assessNovelty(idea, context);
    const contextFit = await this._assessContextFit(idea, context);

    // Calculate weighted total
    const total = 
      (feasibility * this.weights.feasibility) +
      (impact * this.weights.impact) +
      (novelty * this.weights.novelty) +
      (contextFit * this.weights.contextFit);

    // Calculate confidence (consistency across dimensions)
    const confidence = this._calculateConfidence([feasibility, impact, novelty, contextFit]);

    return {
      ...idea,
      score: {
        total: Math.round(total * 100) / 100,
        feasibility: Math.round(feasibility * 100) / 100,
        impact: Math.round(impact * 100) / 100,
        novelty: Math.round(novelty * 100) / 100,
        contextFit: Math.round(contextFit * 100) / 100,
        confidence: Math.round(confidence * 100) / 100
      }
    };
  }

  /**
   * Assess feasibility (0-1): Can we actually build this?
   * 
   * Factors:
   * - Technical complexity
   * - Resource availability
   * - Time to implement
   * - Team expertise
   * - Dependency risk
   * 
   * @param {Object} idea - Idea to assess
   * @param {Object} context - Problem context
   * @returns {Promise<number>} Feasibility score
   * @private
   */
  async _assessFeasibility(idea, context) {
    let score = 0.7;  // Start at medium-high

    // Use technique's built-in estimate if available
    if (typeof idea.feasibility === 'number') {
      score = idea.feasibility;
    }

    const text = `${idea.title} ${idea.description}`.toLowerCase();

    // Check for complexity indicators
    const complexityIndicators = [
      'requires significant', 'major refactor', 'complete rewrite',
      'extensive', 'complex', 'challenging', 'difficult'
    ];
    const complexityCount = complexityIndicators.filter(term => text.includes(term)).length;
    score -= (complexityCount * 0.08);

    // Check for feasibility indicators
    const feasibilityIndicators = [
      'existing', 'available', 'proven', 'standard', 'simple',
      'straightforward', 'minimal', 'quick'
    ];
    const feasibilityCount = feasibilityIndicators.filter(term => text.includes(term)).length;
    score += (feasibilityCount * 0.06);

    // Check team capabilities
    if (context.team && context.team.capabilities) {
      const teamSkills = context.team.capabilities.join(' ').toLowerCase();
      // If idea mentions technologies the team knows, boost feasibility
      if (teamSkills.length > 0 && text.split(' ').some(word => teamSkills.includes(word))) {
        score += 0.10;
      }
    }

    // Check constraints
    if (context.timeline) {
      if (text.includes('quick') || text.includes('fast')) {
        score += 0.05;  // Good for tight timelines
      }
      if (text.includes('gradual') || text.includes('phased')) {
        score += 0.03;  // Can be done incrementally
      }
    }

    return Math.max(0.1, Math.min(score, 1.0));
  }

  /**
   * Assess impact (0-1): Will it solve the problem effectively?
   * 
   * Factors:
   * - Problem solution fit
   * - Benefit magnitude
   * - User value created
   * - Strategic alignment
   * 
   * @param {Object} idea - Idea to assess
   * @param {Object} context - Problem context
   * @returns {Promise<number>} Impact score
   * @private
   */
  async _assessImpact(idea, context) {
    let score = 0.6;  // Start at medium

    const text = `${idea.title} ${idea.description}`.toLowerCase();
    const problem = (context.problem || '').toLowerCase();

    // Check if idea addresses problem keywords
    const problemWords = problem.split(/\s+/).filter(w => w.length > 4);
    const relevantWords = problemWords.filter(word => text.includes(word));
    score += (relevantWords.length * 0.05);

    // Check for impact indicators
    const impactIndicators = [
      'solves', 'addresses', 'eliminates', 'improves', 'optimizes',
      'reduces', 'increases', 'enables', 'prevents'
    ];
    const impactCount = impactIndicators.filter(term => text.includes(term)).length;
    score += (impactCount * 0.07);

    // Check for benefit magnitude indicators
    const magnitudeIndicators = [
      'significant', 'substantial', 'major', 'dramatic', 'transformative'
    ];
    const magnitudeCount = magnitudeIndicators.filter(term => text.includes(term)).length;
    score += (magnitudeCount * 0.08);

    // Check goal alignment
    if (context.goals && Array.isArray(context.goals)) {
      const goalText = context.goals.join(' ').toLowerCase();
      const goalWords = goalText.split(/\s+/).filter(w => w.length > 4);
      const alignedWords = goalWords.filter(word => text.includes(word));
      score += (alignedWords.length * 0.06);
    }

    // Bonus for addressing root cause vs symptoms
    if (text.includes('root cause') || text.includes('fundamental') || text.includes('underlying')) {
      score += 0.10;
    }

    return Math.max(0.2, Math.min(score, 1.0));
  }

  /**
   * Assess novelty (0-1): Is it genuinely different/creative?
   * 
   * Factors:
   * - Uniqueness compared to baseline
   * - Creativity level
   * - Disruption potential
   * - Learning value
   * 
   * @param {Object} idea - Idea to assess
   * @param {Object} context - Problem context
   * @returns {Promise<number>} Novelty score
   * @private
   */
  async _assessNovelty(idea, context) {
    let score = 0.5;  // Start at medium

    // Use technique's built-in estimate if available
    if (typeof idea.novelty === 'number') {
      score = idea.novelty;
    }

    const text = `${idea.title} ${idea.description}`.toLowerCase();

    // Compare to baseline if available
    if (context.baseline) {
      const baselineText = (typeof context.baseline === 'string' 
        ? context.baseline 
        : JSON.stringify(context.baseline)).toLowerCase();
      
      // Calculate word overlap
      const ideaWords = new Set(text.split(/\s+/).filter(w => w.length > 4));
      const baselineWords = new Set(baselineText.split(/\s+/).filter(w => w.length > 4));
      const overlap = [...ideaWords].filter(w => baselineWords.has(w)).length;
      const overlapRatio = overlap / ideaWords.size;
      
      // Less overlap = more novel
      score = Math.max(score, 1.0 - overlapRatio);
    }

    // Check for novelty indicators
    const noveltyIndicators = [
      'novel', 'innovative', 'unique', 'different', 'new approach',
      'alternative', 'unconventional', 'creative'
    ];
    const noveltyCount = noveltyIndicators.filter(term => text.includes(term)).length;
    score += (noveltyCount * 0.08);

    // Check for disruptive indicators
    const disruptiveIndicators = [
      'eliminate', 'reverse', 'invert', 'opposite', 'completely different',
      'radical', 'revolutionary'
    ];
    const disruptiveCount = disruptiveIndicators.filter(term => text.includes(term)).length;
    score += (disruptiveCount * 0.10);

    // Technique-specific novelty bonuses
    if (idea.technique === 'provocations') score += 0.10;
    if (idea.technique === 'random-metaphors') score += 0.08;
    if (idea.technique === 'bad-ideas') score += 0.06;

    return Math.max(0.1, Math.min(score, 1.0));
  }

  /**
   * Assess context fit (0-1): Does it match constraints and goals?
   * 
   * Factors:
   * - Constraint compliance
   * - Goal alignment
   * - Strategic fit
   * - Risk tolerance match
   * 
   * @param {Object} idea - Idea to assess
   * @param {Object} context - Problem context
   * @returns {Promise<number>} Context fit score
   * @private
   */
  async _assessContextFit(idea, context) {
    let score = 0.7;  // Start at medium-high (assume decent fit unless proven otherwise)

    const text = `${idea.title} ${idea.description}`.toLowerCase();

    // Check constraint violations
    if (context.constraints && Array.isArray(context.constraints)) {
      for (const constraint of context.constraints) {
        const constraintText = constraint.toLowerCase();
        
        // Look for direct violations
        if (constraintText.includes('must') || constraintText.includes('required')) {
          // Extract the key requirement
          const words = constraintText.split(/\s+/).filter(w => w.length > 4);
          const matches = words.filter(word => text.includes(word));
          
          if (matches.length === 0) {
            score -= 0.15;  // Potential violation
          } else {
            score += 0.05;  // Explicitly addresses constraint
          }
        }
      }
    }

    // Check budget fit
    if (context.budget) {
      const budgetLower = context.budget.toLowerCase();
      if (budgetLower.includes('low') || budgetLower.includes('minimal')) {
        if (text.includes('expensive') || text.includes('costly')) {
          score -= 0.20;
        }
        if (text.includes('cheap') || text.includes('low-cost') || text.includes('free')) {
          score += 0.10;
        }
      }
    }

    // Check timeline fit
    if (context.timeline) {
      const timelineLower = context.timeline.toLowerCase();
      if (timelineLower.includes('urgent') || timelineLower.includes('quick') || timelineLower.includes('fast')) {
        if (text.includes('gradual') || text.includes('long-term') || text.includes('extensive')) {
          score -= 0.15;
        }
        if (text.includes('quick') || text.includes('immediate') || text.includes('fast')) {
          score += 0.10;
        }
      }
    }

    // Check risk tolerance
    if (context.riskTolerance) {
      const riskLower = context.riskTolerance.toLowerCase();
      if (riskLower === 'low') {
        if (text.includes('experimental') || text.includes('unproven') || text.includes('risky')) {
          score -= 0.20;
        }
      }
      if (riskLower === 'high') {
        if (text.includes('experimental') || text.includes('innovative') || text.includes('novel')) {
          score += 0.10;
        }
      }
    }

    return Math.max(0.1, Math.min(score, 1.0));
  }

  /**
   * Calculate confidence based on score consistency
   * 
   * Higher consistency across dimensions = higher confidence
   * 
   * @param {Array<number>} scores - Individual dimension scores
   * @returns {number} Confidence score (0-1)
   * @private
   */
  _calculateConfidence(scores) {
    if (scores.length === 0) return 0.5;

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Low standard deviation = high confidence
    // StdDev of 0 = confidence 1.0
    // StdDev of 0.5 = confidence 0.0
    const confidence = Math.max(0, 1.0 - (stdDev * 2));

    return confidence;
  }

  /**
   * Calculate average of array of numbers
   * 
   * @param {Array<number>} numbers - Numbers to average
   * @returns {number} Average
   * @private
   */
  _calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  /**
   * Get scoring statistics for ideas
   * 
   * @param {Array} scoredIdeas - Ideas with scores
   * @returns {Object} Statistics
   */
  getStatistics(scoredIdeas) {
    if (scoredIdeas.length === 0) {
      return { count: 0, avgTotal: 0, avgConfidence: 0 };
    }

    return {
      count: scoredIdeas.length,
      avgTotal: this._calculateAverage(scoredIdeas.map(i => i.score.total)),
      avgFeasibility: this._calculateAverage(scoredIdeas.map(i => i.score.feasibility)),
      avgImpact: this._calculateAverage(scoredIdeas.map(i => i.score.impact)),
      avgNovelty: this._calculateAverage(scoredIdeas.map(i => i.score.novelty)),
      avgContextFit: this._calculateAverage(scoredIdeas.map(i => i.score.contextFit)),
      avgConfidence: this._calculateAverage(scoredIdeas.map(i => i.score.confidence)),
      maxTotal: Math.max(...scoredIdeas.map(i => i.score.total)),
      minTotal: Math.min(...scoredIdeas.map(i => i.score.total))
    };
  }
}

export default Scorer;

