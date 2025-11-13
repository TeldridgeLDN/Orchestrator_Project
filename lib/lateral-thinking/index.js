/**
 * Lateral Thinking Session Implementation
 * 
 * Core implementation of lateral thinking techniques for creative problem-solving.
 * Manages three-phase process: diverge (generate ideas), converge (curate), deliver (format).
 * 
 * @module lateral-thinking
 * @version 1.0.0
 */

import { log as logger } from '../utils/logger.js';
import { SCAMPER } from './techniques/scamper.js';
import { SixThinkingHats } from './techniques/six-hats.js';
import { Provocations } from './techniques/provocations.js';
import { RandomMetaphors } from './techniques/random-metaphors.js';
import { BadIdeas } from './techniques/bad-ideas.js';
import { Scorer } from './scoring/scorer.js';
import { Clusterer } from './convergence/clusterer.js';
import { OutputFormatter } from './output/formatter.js';

/**
 * Available techniques
 */
const TECHNIQUES = {
  scamper: SCAMPER,
  'six-hats': SixThinkingHats,
  provocations: Provocations,
  'random-metaphors': RandomMetaphors,
  'bad-ideas': BadIdeas
};

/**
 * Default session configuration
 */
const DEFAULT_CONFIG = {
  tokenBudget: 3000,
  techniques: ['scamper', 'provocations'],
  ideasPerTechnique: 5,
  autoConverge: true,
  presentTopN: 3,
  includeBaseline: true,
  minConfidence: 0.6,
  budgetAllocation: {
    divergence: 0.60,
    convergence: 0.30,
    delivery: 0.10
  }
};

/**
 * Lateral Thinking Session
 * 
 * Manages complete lateral thinking workflow:
 * 1. Diverge - Generate ideas using techniques
 * 2. Converge - Cluster and score ideas
 * 3. Deliver - Format and present results
 */
export class LateralThinkingSession {
  /**
   * Create new session
   * @param {Object} config - Session configuration
   */
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.tokensUsed = 0;
    this.startTime = null;
    this.ideas = [];
    this.clusteredIdeas = [];
    this.scoredIdeas = [];
    this.topOptions = [];
    this.metrics = {
      ideasGenerated: 0,
      ideasAfterClustering: 0,
      topOptionsPresented: 0,
      techniqueSuccess: {},
      convergenceTime: 0,
      totalTime: 0
    };
  }

  /**
   * Run complete lateral thinking session
   * 
   * @param {Object} context - Problem context
   * @returns {Promise<Object>} Session results
   */
  async run(context) {
    this.startTime = Date.now();
    
    try {
      logger.info('Starting lateral thinking session', {
        problem: context.problem,
        techniques: this.config.techniques
      });

      // Phase 1: Diverge
      await this.diverge(context);
      
      // Phase 2: Converge (if enabled)
      if (this.config.autoConverge) {
        await this.converge(context);
      }
      
      // Calculate total time before delivering
      this.metrics.totalTime = Date.now() - this.startTime;
      
      // Phase 3: Deliver
      const output = await this.deliver(context);
      
      logger.info('Lateral thinking session complete', {
        ideasGenerated: this.metrics.ideasGenerated,
        topOptions: this.topOptions.length,
        tokensUsed: this.tokensUsed,
        timeMs: this.metrics.totalTime
      });
      
      return output;
      
    } catch (error) {
      logger.error('Lateral thinking session failed', { error: error.message });
      return this._handleError(error, context);
    }
  }

  /**
   * Divergence phase - Generate ideas
   * 
   * @param {Object} context - Problem context
   * @private
   */
  async diverge(context) {
    const divergenceBudget = this.config.tokenBudget * this.config.budgetAllocation.divergence;
    const techniques = this._selectTechniques(context);
    
    logger.info('Divergence phase starting', {
      techniques: techniques.map(t => t.name),
      budget: divergenceBudget
    });

    const techniquePromises = techniques.map(async (TechniqueClass) => {
      try {
        const technique = new TechniqueClass();
        const ideas = await technique.generate(context, {
          ideasToGenerate: this.config.ideasPerTechnique,
          tokenBudget: divergenceBudget / techniques.length
        });
        
        this.metrics.techniqueSuccess[technique.name] = true;
        return ideas;
        
      } catch (error) {
        logger.warn(`Technique ${TechniqueClass.name} failed`, { error: error.message });
        this.metrics.techniqueSuccess[TechniqueClass.name] = false;
        return [];
      }
    });

    const results = await Promise.all(techniquePromises);
    this.ideas = results.flat();
    this.metrics.ideasGenerated = this.ideas.length;
    
    logger.info('Divergence phase complete', {
      ideasGenerated: this.ideas.length
    });
  }

  /**
   * Convergence phase - Cluster and score ideas
   * 
   * @param {Object} context - Problem context
   * @private
   */
  async converge(context) {
    const convergenceStart = Date.now();
    const convergenceBudget = this.config.tokenBudget * this.config.budgetAllocation.convergence;
    
    logger.info('Convergence phase starting', {
      ideasToProcess: this.ideas.length,
      budget: convergenceBudget
    });

    // Step 1: Cluster similar ideas
    const clusterer = new Clusterer();
    this.clusteredIdeas = await clusterer.cluster(this.ideas, {
      similarityThreshold: 0.7,
      maxClusters: this.config.presentTopN * 2  // Get some extras for scoring
    });
    
    this.metrics.ideasAfterClustering = this.clusteredIdeas.length;
    
    // Step 2: Score each clustered idea
    const scorer = new Scorer();
    this.scoredIdeas = await scorer.scoreAll(this.clusteredIdeas, context);
    
    // Step 3: Filter by confidence and select top N
    this.topOptions = this.scoredIdeas
      .filter(idea => idea.score.confidence >= this.config.minConfidence)
      .sort((a, b) => b.score.total - a.score.total)
      .slice(0, this.config.presentTopN);
    
    this.metrics.topOptionsPresented = this.topOptions.length;
    this.metrics.convergenceTime = Date.now() - convergenceStart;
    
    logger.info('Convergence phase complete', {
      clustered: this.clusteredIdeas.length,
      scored: this.scoredIdeas.length,
      selected: this.topOptions.length,
      timeMs: this.metrics.convergenceTime
    });
  }

  /**
   * Delivery phase - Format and present results
   * 
   * @param {Object} context - Problem context
   * @returns {Promise<Object>} Formatted output
   * @private
   */
  async deliver(context) {
    const formatter = new OutputFormatter(this.config);
    
    const output = await formatter.format({
      topOptions: this.topOptions,
      allIdeas: this.ideas,
      clusteredIdeas: this.clusteredIdeas,
      scoredIdeas: this.scoredIdeas,
      baseline: context.baseline,
      metrics: this.metrics,
      context
    });
    
    return output;
  }

  /**
   * Select techniques based on context
   * 
   * @param {Object} context - Problem context
   * @returns {Array<Function>} Selected technique classes
   * @private
   */
  _selectTechniques(context) {
    // If techniques specified in config, use those
    if (Array.isArray(this.config.techniques)) {
      return this.config.techniques.map(name => {
        const TechniqueClass = TECHNIQUES[name];
        if (!TechniqueClass) {
          logger.warn(`Unknown technique: ${name}, skipping`);
          return null;
        }
        return TechniqueClass;
      }).filter(Boolean);
    }
    
    // Otherwise, use context-aware selection
    return this._selectTechniquesForContext(context);
  }

  /**
   * Context-aware technique selection
   * 
   * @param {Object} context - Problem context
   * @returns {Array<Function>} Selected technique classes
   * @private
   */
  _selectTechniquesForContext(context) {
    const { stuckCount = 0, complexity = 5, baseline } = context;
    
    // Stuck state → most disruptive
    if (stuckCount >= 3) {
      logger.info('Selecting disruptive techniques for stuck state');
      return [TECHNIQUES.provocations, TECHNIQUES['bad-ideas']];
    }
    
    // Has baseline → systematic variation
    if (baseline) {
      logger.info('Selecting systematic techniques for baseline variation');
      return [TECHNIQUES.scamper, TECHNIQUES['six-hats']];
    }
    
    // High complexity → comprehensive
    if (complexity >= 8) {
      logger.info('Selecting comprehensive techniques for complex problem');
      return [TECHNIQUES['six-hats'], TECHNIQUES.scamper, TECHNIQUES.provocations];
    }
    
    // Default: balanced
    logger.info('Selecting balanced technique set');
    return [TECHNIQUES.scamper, TECHNIQUES.provocations];
  }

  /**
   * Handle errors gracefully
   * 
   * @param {Error} error - Error that occurred
   * @param {Object} context - Problem context
   * @returns {Object} Fallback response
   * @private
   */
  _handleError(error, context) {
    return {
      error: true,
      message: 'Lateral thinking session encountered an error',
      details: error.message,
      fallback: {
        suggestion: 'Proceed with baseline approach',
        baseline: context.baseline || 'No baseline available',
        actions: ['Continue with standard approach', 'Retry lateral thinking']
      },
      metrics: this.metrics
    };
  }

  /**
   * Get current session statistics
   * 
   * @returns {Object} Session statistics
   */
  getStatistics() {
    return {
      ...this.metrics,
      tokensUsed: this.tokensUsed,
      config: this.config,
      ideasPerTechnique: this.ideas.length / Object.keys(this.metrics.techniqueSuccess).length
    };
  }
}

/**
 * Quick mode session (fast, lightweight)
 * 
 * @param {Object} context - Problem context
 * @returns {Promise<Object>} Session results
 */
export async function quickMode(context) {
  const session = new LateralThinkingSession({
    tokenBudget: 1000,
    techniques: ['provocations'],
    ideasPerTechnique: 3,
    presentTopN: 1
  });
  
  return await session.run(context);
}

/**
 * Standard mode session (balanced)
 * 
 * @param {Object} context - Problem context
 * @returns {Promise<Object>} Session results
 */
export async function standardMode(context) {
  const session = new LateralThinkingSession({
    tokenBudget: 3000,
    techniques: ['scamper', 'provocations'],
    ideasPerTechnique: 5,
    presentTopN: 3
  });
  
  return await session.run(context);
}

/**
 * Deep exploration mode (comprehensive)
 * 
 * @param {Object} context - Problem context
 * @returns {Promise<Object>} Session results
 */
export async function deepMode(context) {
  const session = new LateralThinkingSession({
    tokenBudget: 5000,
    techniques: ['scamper', 'six-hats', 'provocations'],
    ideasPerTechnique: 7,
    presentTopN: 5
  });
  
  return await session.run(context);
}

/**
 * Factory function to create session with context-aware defaults
 * 
 * @param {Object} context - Problem context
 * @param {Object} overrides - Config overrides
 * @returns {LateralThinkingSession} New session instance
 */
export function createSession(context, overrides = {}) {
  const session = new LateralThinkingSession(overrides);
  
  // Adjust config based on context
  if (context.stuckCount >= 3 && !overrides.techniques) {
    session.config.techniques = ['provocations', 'bad-ideas'];
  }
  
  if (context.complexity >= 8 && !overrides.techniques) {
    session.config.techniques = ['six-hats', 'scamper', 'provocations'];
  }
  
  return session;
}

export default {
  LateralThinkingSession,
  quickMode,
  standardMode,
  deepMode,
  createSession,
  TECHNIQUES
};

