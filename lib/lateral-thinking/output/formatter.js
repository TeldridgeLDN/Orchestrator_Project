/**
 * Output Formatting System
 * 
 * Formats lateral thinking results for presentation to users.
 * Creates clear, actionable outputs with rationale and next steps.
 * 
 * @module lateral-thinking/output/formatter
 */

import { log as logger } from '../../utils/logger.js';

/**
 * OutputFormatter Class
 * 
 * Transforms scored ideas into user-friendly output
 */
export class OutputFormatter {
  /**
   * Create formatter
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      includeBaseline: true,
      includeMetrics: true,
      includeActions: true,
      ...config
    };
  }

  /**
   * Format complete session results
   * 
   * @param {Object} data - Session data to format
   * @returns {Promise<Object>} Formatted output
   */
  async format(data) {
    const {
      topOptions = [],
      allIdeas = [],
      clusteredIdeas = [],
      scoredIdeas = [],
      baseline,
      metrics = {},
      context = {}
    } = data;

    logger.info('Formatter: Formatting output', {
      topOptionsCount: topOptions.length,
      allIdeasCount: allIdeas.length
    });

    const output = {
      summary: this._formatSummary(context, metrics),
      topOptions: this._formatTopOptions(topOptions),
      ...(this.config.includeBaseline && baseline ? { baseline: this._formatBaseline(baseline) } : {}),
      actions: this._formatActions(topOptions, baseline),
      ...(this.config.includeMetrics ? { metrics: this._formatMetrics(metrics, allIdeas, clusteredIdeas) } : {})
    };

    return output;
  }

  /**
   * Format summary section
   * 
   * @param {Object} context - Problem context
   * @param {Object} metrics - Session metrics
   * @returns {Object} Formatted summary
   * @private
   */
  _formatSummary(context, metrics) {
    return {
      context: context.problem || 'Problem not specified',
      baseline: context.baseline ? (typeof context.baseline === 'string' ? context.baseline : 'Baseline approach provided') : 'No baseline',
      techniquesApplied: Object.keys(metrics.techniqueSuccess || {}).filter(t => metrics.techniqueSuccess[t]),
      ideasGenerated: metrics.ideasGenerated || 0,
      timeElapsed: this._formatDuration(metrics.totalTime)
    };
  }

  /**
   * Format top options
   * 
   * @param {Array} options - Top scored options
   * @returns {Array} Formatted options
   * @private
   */
  _formatTopOptions(options) {
    return options.map((option, index) => ({
      rank: index + 1,
      title: option.title,
      description: option.description,
      confidence: this._formatConfidence(option.score?.confidence || 0.5),
      scores: {
        total: option.score?.total || 0,
        feasibility: option.score?.feasibility || 0,
        impact: option.score?.impact || 0,
        novelty: option.score?.novelty || 0,
        contextFit: option.score?.contextFit || 0
      },
      why: this._extractWhy(option),
      caution: this._extractCaution(option),
      nextSteps: this._extractNextSteps(option),
      technique: option.technique,
      metadata: this._selectiveMetadata(option)
    }));
  }

  /**
   * Extract "why interesting" rationale
   * 
   * @param {Object} option - Idea option
   * @returns {string} Why this is interesting
   * @private
   */
  _extractWhy(option) {
    // Try to extract rationale from various fields
    if (option.rationale) return option.rationale;
    if (option.insight) return option.insight;
    if (option.extraction) return option.extraction;
    
    // Generate based on scores
    const reasons = [];
    if (option.score?.feasibility > 0.7) {
      reasons.push('Highly feasible to implement');
    }
    if (option.score?.impact > 0.7) {
      reasons.push('Strong potential impact');
    }
    if (option.score?.novelty > 0.7) {
      reasons.push('Novel approach');
    }
    
    return reasons.length > 0 ? reasons.join('. ') : 'Interesting alternative worth exploring';
  }

  /**
   * Extract cautions/considerations
   * 
   * @param {Object} option - Idea option
   * @returns {string} Cautions
   * @private
   */
  _extractCaution(option) {
    const cautions = [];
    
    // Based on scores
    if (option.score?.feasibility < 0.5) {
      cautions.push('May be challenging to implement');
    }
    if (option.score?.novelty > 0.8) {
      cautions.push('Unproven approach - consider piloting first');
    }
    if (option.score?.contextFit < 0.5) {
      cautions.push('May need adjustment to fit constraints');
    }
    
    // Based on technique
    if (option.technique === 'provocations') {
      cautions.push('Derived from provocative thinking - validate assumptions');
    }
    if (option.technique === 'bad-ideas') {
      cautions.push('Extracted from intentionally bad idea - test carefully');
    }
    
    // From metadata
    if (option.whyBad) {
      cautions.push(`Original concern: ${option.whyBad}`);
    }
    
    return cautions.length > 0 ? cautions.join('. ') : 'Standard implementation considerations apply';
  }

  /**
   * Extract next steps
   * 
   * @param {Object} option - Idea option
   * @returns {Array<string>} Next steps
   * @private
   */
  _extractNextSteps(option) {
    const steps = [];
    
    // From implementation field
    if (option.implementation && Array.isArray(option.implementation)) {
      return option.implementation;
    }
    
    // From actionable field
    if (option.actionable) {
      steps.push(option.actionable);
    }
    
    // Generic steps based on scores
    if (option.score?.feasibility < 0.6) {
      steps.push('Assess technical feasibility in detail');
    }
    if (option.score?.impact > 0.7) {
      steps.push('Define success metrics');
    }
    steps.push('Create proof-of-concept');
    steps.push('Gather team feedback');
    
    return steps;
  }

  /**
   * Select useful metadata to include
   * 
   * @param {Object} option - Idea option
   * @returns {Object} Selected metadata
   * @private
   */
  _selectiveMetadata(option) {
    const meta = {};
    
    if (option.dimension) meta.scamperDimension = option.dimensionName || option.dimension;
    if (option.hat) meta.thinkingHat = `${option.hatEmoji} ${option.hatName}`;
    if (option.provocationType) meta.provocation = option.provocation;
    if (option.metaphor) meta.metaphor = option.metaphor;
    if (option.badIdeaCategory) meta.badIdeaOrigin = option.badIdea;
    
    return meta;
  }

  /**
   * Format baseline approach
   * 
   * @param {*} baseline - Baseline approach
   * @returns {Object} Formatted baseline
   * @private
   */
  _formatBaseline(baseline) {
    if (typeof baseline === 'string') {
      return {
        approach: baseline,
        complexity: 'Medium',
        timeline: 'Standard'
      };
    }
    
    return {
      approach: baseline.approach || JSON.stringify(baseline),
      complexity: baseline.complexity || 'Medium',
      timeline: baseline.timeline || 'Standard'
    };
  }

  /**
   * Format action choices
   * 
   * @param {Array} topOptions - Top options
   * @param {*} baseline - Baseline approach
   * @returns {Array} Action choices
   * @private
   */
  _formatActions(topOptions, baseline) {
    const actions = [];
    
    // Option-specific actions
    topOptions.forEach((option, index) => {
      actions.push({
        label: `Deep dive on option #${index + 1}`,
        description: `Explore "${option.title}" in detail`,
        effect: 'expand-option',
        optionId: index + 1
      });
    });
    
    // Combination actions
    if (topOptions.length >= 2) {
      actions.push({
        label: `Combine options #1 + #2`,
        description: 'Hybrid approach using multiple ideas',
        effect: 'combine-options',
        optionIds: [1, 2]
      });
    }
    
    // Baseline action
    if (baseline) {
      actions.push({
        label: 'Use baseline approach',
        description: 'Proceed with standard solution',
        effect: 'use-baseline'
      });
    }
    
    // Iteration action
    actions.push({
      label: 'Generate more ideas',
      description: 'Run another lateral thinking session',
      effect: 'iterate'
    });
    
    return actions;
  }

  /**
   * Format metrics
   * 
   * @param {Object} metrics - Raw metrics
   * @param {Array} allIdeas - All generated ideas
   * @param {Array} clusteredIdeas - Clustered ideas
   * @returns {Object} Formatted metrics
   * @private
   */
  _formatMetrics(metrics, allIdeas, clusteredIdeas) {
    return {
      ideasGenerated: metrics.ideasGenerated || allIdeas.length,
      ideasAfterClustering: metrics.ideasAfterClustering || clusteredIdeas.length,
      topOptionsPresented: metrics.topOptionsPresented || 0,
      tokensUsed: metrics.tokensUsed || 'N/A',
      totalTime: metrics.totalTime || 0, // Keep raw totalTime for programmatic access
      timeElapsed: this._formatDuration(metrics.totalTime),
      techniqueSuccess: metrics.techniqueSuccess || {},
      convergenceTime: this._formatDuration(metrics.convergenceTime)
    };
  }

  /**
   * Format duration in milliseconds to human-readable
   * 
   * @param {number} ms - Duration in milliseconds
   * @returns {string} Formatted duration
   * @private
   */
  _formatDuration(ms) {
    if (!ms) return 'N/A';
    
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  }

  /**
   * Format confidence as emoji + text
   * 
   * @param {number} confidence - Confidence score (0-1)
   * @returns {string} Formatted confidence
   * @private
   */
  _formatConfidence(confidence) {
    if (confidence >= 0.8) return '🟢 High confidence';
    if (confidence >= 0.65) return '🟡 Medium confidence';
    if (confidence >= 0.5) return '🟠 Lower confidence';
    return '🔴 Exploratory only';
  }

  /**
   * Format as markdown for display
   * 
   * @param {Object} output - Formatted output
   * @returns {string} Markdown string
   */
  toMarkdown(output) {
    let md = '# 🎨 Lateral Thinking Results\n\n';
    
    // Summary
    md += '## 📊 Summary\n\n';
    md += `**Problem**: ${output.summary.context}\n\n`;
    md += `**Baseline**: ${output.summary.baseline}\n\n`;
    md += `**Techniques Applied**: ${output.summary.techniquesApplied.join(', ')}\n\n`;
    md += `**Ideas Generated**: ${output.summary.ideasGenerated}\n\n`;
    md += '---\n\n';
    
    // Top Options
    md += '## 💡 Top Alternative Approaches\n\n';
    output.topOptions.forEach(option => {
      md += `### ${option.rank}. ${option.title} (${option.confidence})\n\n`;
      md += `${option.description}\n\n`;
      md += `**Why interesting**: ${option.why}\n\n`;
      md += `**Caution**: ${option.caution}\n\n`;
      md += '**Next Steps**:\n';
      option.nextSteps.forEach(step => {
        md += `- ${step}\n`;
      });
      md += '\n';
    });
    
    // Baseline
    if (output.baseline) {
      md += '## 📊 Standard Approach (Baseline)\n\n';
      md += `${output.baseline.approach}\n\n`;
      md += `**Expected Complexity**: ${output.baseline.complexity} | **Timeline**: ${output.baseline.timeline}\n\n`;
      md += '---\n\n';
    }
    
    // Actions
    md += '## ⚡ Next Steps\n\n';
    output.actions.forEach(action => {
      md += `- **${action.label}**: ${action.description}\n`;
    });
    
    return md;
  }
}

export default OutputFormatter;

