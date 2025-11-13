/**
 * Lateral Thinking Hook Detector
 * 
 * Detects when lateral thinking would be beneficial based on workflow state,
 * task complexity, and user behavior patterns. Integrates with Orchestrator's
 * hook system to suggest creative exploration at optimal intervention points.
 * 
 * @module hooks/lateralThinkingDetector
 * @version 1.0.0
 */

import { HookTypes } from './index.js';

/**
 * Trigger condition types for lateral thinking activation
 */
export const TriggerTypes = {
  POST_RESEARCH: 'postResearch',
  PRE_RESEARCH: 'preResearch',
  STUCK_STATE: 'stuckState',
  WICKED_PROBLEM: 'wickedProblem',
  EXPLICIT_REQUEST: 'explicitRequest',
  PRE_PLANNING: 'prePlanning'
};

/**
 * Configuration for lateral thinking triggers
 */
const DEFAULT_CONFIG = {
  enabled: true,
  autoActivate: false,  // Start manual-only for user comfort
  triggers: {
    postResearch: {
      enabled: true,
      confidence: 0.7,
      message: 'Research complete. Explore creative alternatives before planning?'
    },
    preResearch: {
      enabled: false,  // Disabled by default
      confidence: 0.6,
      message: 'Challenge problem framing with lateral thinking before researching?'
    },
    stuckState: {
      enabled: true,
      threshold: 3,  // Number of failed attempts
      confidence: 0.8,
      message: 'Detected repeated attempts. Try creative reframing?'
    },
    wickedProblem: {
      enabled: true,
      indicators: [
        'multiple solutions',
        'unclear requirements',
        'no obvious path',
        'complex dependencies',
        'competing constraints'
      ],
      confidence: 0.75,
      message: 'Complex problem detected. Use lateral thinking for exploration?'
    },
    prePlanning: {
      enabled: true,
      confidence: 0.65,
      message: 'Before finalizing plan, explore alternative approaches?'
    }
  },
  tokenBudget: 3000,
  techniques: 2,
  ideasPerTechnique: 5,
  autoConverge: true,
  presentTopN: 3,
  minConfidence: 0.6,
  cooldownPeriod: 3600000  // 1 hour between auto-suggestions
};

/**
 * Lateral Thinking Detector Class
 */
export class LateralThinkingDetector {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.lastTriggerTime = null;
    this.triggerHistory = [];
  }

  /**
   * Main detection method - checks if lateral thinking should be suggested
   * 
   * @param {Object} context - Current workflow context
   * @returns {Object} Detection result with trigger info
   */
  detect(context) {
    if (!this.config.enabled) {
      return { shouldTrigger: false, reason: 'Detector disabled' };
    }

    // Check cooldown period
    if (this._isInCooldown()) {
      return { shouldTrigger: false, reason: 'In cooldown period' };
    }

    // Check explicit request first (highest priority)
    const explicitTrigger = this._detectExplicitRequest(context);
    if (explicitTrigger.matches) {
      return this._createTriggerResponse(TriggerTypes.EXPLICIT_REQUEST, explicitTrigger);
    }

    // Check each trigger condition
    const triggers = [
      this._detectPostResearch(context),
      this._detectPreResearch(context),
      this._detectStuckState(context),
      this._detectWickedProblem(context),
      this._detectPrePlanning(context)
    ];

    // Find highest confidence trigger
    const bestTrigger = triggers
      .filter(t => t.shouldTrigger)
      .sort((a, b) => b.confidence - a.confidence)[0];

    if (bestTrigger) {
      this._recordTrigger(bestTrigger);
      return bestTrigger;
    }

    return { shouldTrigger: false, reason: 'No trigger conditions met' };
  }

  /**
   * Detect explicit user request for lateral thinking
   * @private
   */
  _detectExplicitRequest(context) {
    const { userInput } = context;
    if (!userInput) return { matches: false };

    const patterns = [
      /lateral\s+thinking/i,
      /think\s+outside\s+the\s+box/i,
      /creative\s+(solution|approach|alternative)/i,
      /brainstorm/i,
      /challenge\s+assumptions?/i,
      /explore\s+alternatives/i,
      /apply\s+(scamper|six\s+hats|provocations)/i
    ];

    const matches = patterns.some(pattern => pattern.test(userInput));

    return {
      matches,
      confidence: 1.0,
      userInput,
      message: 'Explicit lateral thinking request detected'
    };
  }

  /**
   * Detect post-research trigger condition
   * @private
   */
  _detectPostResearch(context) {
    const triggerConfig = this.config.triggers.postResearch;
    if (!triggerConfig.enabled) {
      return { shouldTrigger: false };
    }

    const { lastCommand, task, researchComplete } = context;

    // Check if research just completed
    const researchJustCompleted = 
      lastCommand === 'research' ||
      researchComplete === true ||
      (task && task.status === 'in-progress' && task.lastAction === 'research');

    if (!researchJustCompleted) {
      return { shouldTrigger: false };
    }

    // Check if planning hasn't started yet
    const planningNotStarted = !task?.plan || task?.plan.status === 'pending';

    if (!planningNotStarted) {
      return { shouldTrigger: false };
    }

    return {
      shouldTrigger: true,
      type: TriggerTypes.POST_RESEARCH,
      confidence: triggerConfig.confidence,
      message: triggerConfig.message,
      context: {
        researchFindings: context.researchFindings,
        baseline: this._extractBaseline(context)
      },
      actions: [
        'Yes, explore alternatives (standard: ~3min)',
        'Quick mode (1 technique, ~1min)',
        'No, proceed to planning'
      ]
    };
  }

  /**
   * Detect pre-research trigger condition
   * @private
   */
  _detectPreResearch(context) {
    const triggerConfig = this.config.triggers.preResearch;
    if (!triggerConfig.enabled) {
      return { shouldTrigger: false };
    }

    const { task, aboutToResearch } = context;

    if (!aboutToResearch) {
      return { shouldTrigger: false };
    }

    // Only trigger for complex or ambiguous problems
    const problemComplexity = this._assessComplexity(context);
    if (problemComplexity < 6) {
      return { shouldTrigger: false };
    }

    return {
      shouldTrigger: true,
      type: TriggerTypes.PRE_RESEARCH,
      confidence: triggerConfig.confidence,
      message: triggerConfig.message,
      context: {
        problem: task?.description,
        initialFraming: context.problemFraming
      },
      actions: [
        'Yes, reframe problem first',
        'No, proceed with current framing'
      ]
    };
  }

  /**
   * Detect stuck state (circular reasoning, repeated failures)
   * @private
   */
  _detectStuckState(context) {
    const triggerConfig = this.config.triggers.stuckState;
    if (!triggerConfig.enabled) {
      return { shouldTrigger: false };
    }

    const { task, history } = context;

    if (!task || !history) {
      return { shouldTrigger: false };
    }

    // Count failed attempts on current task
    const failedAttempts = history.filter(entry =>
      entry.taskId === task.id &&
      (entry.result === 'failed' || entry.status === 'failed')
    ).length;

    if (failedAttempts < triggerConfig.threshold) {
      return { shouldTrigger: false };
    }

    // Check if approaches are similar (circular reasoning)
    const recentApproaches = history
      .filter(e => e.taskId === task.id)
      .slice(-5)
      .map(e => e.approach);

    const circularReasoning = this._detectCircularReasoning(recentApproaches);

    return {
      shouldTrigger: true,
      type: TriggerTypes.STUCK_STATE,
      confidence: triggerConfig.confidence,
      message: `${triggerConfig.message} (${failedAttempts} attempts${circularReasoning ? ', circular reasoning detected' : ''})`,
      context: {
        failedAttempts,
        circularReasoning,
        recentApproaches
      },
      actions: [
        'Yes, reframe problem creatively',
        'No, try one more time with current approach'
      ]
    };
  }

  /**
   * Detect wicked problem (complex, open-ended, no clear solution)
   * @private
   */
  _detectWickedProblem(context) {
    const triggerConfig = this.config.triggers.wickedProblem;
    if (!triggerConfig.enabled) {
      return { shouldTrigger: false };
    }

    const { task } = context;

    if (!task) {
      return { shouldTrigger: false };
    }

    // Check for wicked problem indicators
    const taskText = `${task.title} ${task.description} ${task.details || ''}`.toLowerCase();

    const indicatorMatches = triggerConfig.indicators.filter(indicator =>
      taskText.includes(indicator.toLowerCase())
    );

    // Also check complexity score
    const complexity = this._assessComplexity(context);

    const isWicked = indicatorMatches.length >= 2 || complexity >= 8;

    if (!isWicked) {
      return { shouldTrigger: false };
    }

    return {
      shouldTrigger: true,
      type: TriggerTypes.WICKED_PROBLEM,
      confidence: triggerConfig.confidence,
      message: `${triggerConfig.message} (indicators: ${indicatorMatches.join(', ')})`,
      context: {
        complexity,
        indicators: indicatorMatches,
        taskDescription: task.description
      },
      actions: [
        'Yes, use lateral thinking for exploration',
        'Quick exploration (1 technique)',
        'No, attempt linear approach first'
      ]
    };
  }

  /**
   * Detect pre-planning trigger
   * @private
   */
  _detectPrePlanning(context) {
    const triggerConfig = this.config.triggers.prePlanning;
    if (!triggerConfig.enabled) {
      return { shouldTrigger: false };
    }

    const { task, aboutToPlan } = context;

    if (!aboutToPlan) {
      return { shouldTrigger: false };
    }

    // Only trigger if we have some baseline/research to work from
    const hasBaseline = context.baseline || context.researchFindings;

    if (!hasBaseline) {
      return { shouldTrigger: false };
    }

    return {
      shouldTrigger: true,
      type: TriggerTypes.PRE_PLANNING,
      confidence: triggerConfig.confidence,
      message: triggerConfig.message,
      context: {
        baseline: this._extractBaseline(context),
        research: context.researchFindings
      },
      actions: [
        'Yes, explore alternatives',
        'No, proceed with current plan'
      ]
    };
  }

  /**
   * Assess problem complexity (0-10 scale)
   * @private
   */
  _assessComplexity(context) {
    const { task } = context;

    if (!task) return 5;  // Default medium complexity

    let score = 0;

    // Check various complexity indicators
    if (task.dependencies && task.dependencies.length > 2) score += 2;
    if (task.subtasks && task.subtasks.length > 5) score += 2;
    if (task.details && task.details.length > 500) score += 1;
    if (task.priority === 'high') score += 1;
    if (task.testStrategy && task.testStrategy.length > 200) score += 1;

    // Check description for complexity keywords
    const complexityKeywords = [
      'integrate', 'multiple', 'complex', 'various',
      'coordinate', 'synchronize', 'distributed', 'concurrent'
    ];

    const description = (task.description || '').toLowerCase();
    const keywordMatches = complexityKeywords.filter(kw => description.includes(kw)).length;
    score += keywordMatches;

    return Math.min(score, 10);
  }

  /**
   * Detect circular reasoning in approach history
   * @private
   */
  _detectCircularReasoning(approaches) {
    if (approaches.length < 3) return false;

    // Simple similarity check - in production, use more sophisticated NLP
    const recent = approaches.slice(-3);
    const similarities = [];

    for (let i = 0; i < recent.length - 1; i++) {
      for (let j = i + 1; j < recent.length; j++) {
        const similarity = this._calculateSimilarity(recent[i], recent[j]);
        similarities.push(similarity);
      }
    }

    // If average similarity > 0.7, likely circular
    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
    return avgSimilarity > 0.7;
  }

  /**
   * Simple string similarity calculation (Jaccard)
   * @private
   */
  _calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;

    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Extract baseline approach from context
   * @private
   */
  _extractBaseline(context) {
    if (context.baseline) return context.baseline;

    if (context.researchFindings) {
      // Try to extract recommended approach from research
      const findings = context.researchFindings;
      if (findings.recommendation) return findings.recommendation;
      if (findings.summary) return findings.summary;
    }

    if (context.task && context.task.details) {
      // Extract from task details
      return context.task.details;
    }

    return null;
  }

  /**
   * Check if currently in cooldown period
   * @private
   */
  _isInCooldown() {
    if (!this.lastTriggerTime) return false;

    const elapsed = Date.now() - this.lastTriggerTime;
    return elapsed < this.config.cooldownPeriod;
  }

  /**
   * Record trigger for history and cooldown
   * @private
   */
  _recordTrigger(trigger) {
    this.lastTriggerTime = Date.now();
    this.triggerHistory.push({
      timestamp: this.lastTriggerTime,
      type: trigger.type,
      confidence: trigger.confidence,
      accepted: null  // Will be updated when user responds
    });

    // Keep only last 20 triggers
    if (this.triggerHistory.length > 20) {
      this.triggerHistory.shift();
    }
  }

  /**
   * Record user response to trigger
   */
  recordResponse(triggerType, accepted) {
    const trigger = this.triggerHistory
      .reverse()
      .find(t => t.type === triggerType && t.accepted === null);

    if (trigger) {
      trigger.accepted = accepted;
    }
  }

  /**
   * Get trigger statistics for optimization
   */
  getStatistics() {
    const stats = {
      totalTriggers: this.triggerHistory.length,
      acceptedCount: this.triggerHistory.filter(t => t.accepted === true).length,
      rejectedCount: this.triggerHistory.filter(t => t.accepted === false).length,
      byType: {}
    };

    stats.acceptanceRate = stats.acceptedCount / stats.totalTriggers;

    // Group by type
    for (const trigger of this.triggerHistory) {
      if (!stats.byType[trigger.type]) {
        stats.byType[trigger.type] = {
          count: 0,
          accepted: 0,
          avgConfidence: 0
        };
      }

      const typeStats = stats.byType[trigger.type];
      typeStats.count++;
      if (trigger.accepted) typeStats.accepted++;
      typeStats.avgConfidence =
        (typeStats.avgConfidence * (typeStats.count - 1) + trigger.confidence) / typeStats.count;
    }

    // Calculate acceptance rate per type
    for (const type in stats.byType) {
      stats.byType[type].acceptanceRate =
        stats.byType[type].accepted / stats.byType[type].count;
    }

    return stats;
  }

  /**
   * Create standardized trigger response
   * @private
   */
  _createTriggerResponse(type, data) {
    return {
      shouldTrigger: true,
      type,
      confidence: data.confidence || 1.0,
      message: data.message,
      context: data.context || {},
      actions: data.actions || [
        'Yes, use lateral thinking',
        'No, proceed without it'
      ],
      config: {
        tokenBudget: this.config.tokenBudget,
        techniques: this.config.techniques,
        ideasPerTechnique: this.config.ideasPerTechnique,
        autoConverge: this.config.autoConverge,
        presentTopN: this.config.presentTopN,
        minConfidence: this.config.minConfidence
      }
    };
  }
}

/**
 * Factory function to create detector instance
 */
export function createLateralThinkingDetector(config) {
  return new LateralThinkingDetector(config);
}

/**
 * Hook integration point for postToolUse
 */
export function lateralThinkingHook(context) {
  const detector = createLateralThinkingDetector(context.config?.lateralThinking);
  return detector.detect(context);
}

export default {
  LateralThinkingDetector,
  createLateralThinkingDetector,
  lateralThinkingHook,
  TriggerTypes
};

