/**
 * Hook Requirement Detector
 * 
 * Analyzes feature specifications to automatically detect required hook integrations.
 * Uses pattern matching and rule-based analysis to identify lifecycle interactions,
 * file operations, external integrations, and state persistence needs.
 * 
 * @module hooks/detector/HookRequirementDetector
 * @version 1.0.0
 */

/**
 * Hook types - replicated here to avoid circular dependencies
 * These must match the values in lib/hooks/index.js
 */
export const HookTypes = {
  PRE_CONFIG_MODIFICATION: 'preConfigModification',
  USER_PROMPT_SUBMIT: 'userPromptSubmit',
  POST_TOOL_USE: 'postToolUse',
  PRE_PROJECT_SWITCH: 'preProjectSwitch',
  POST_PROJECT_SWITCH: 'postProjectSwitch'
};

/**
 * Feature specification schema
 * @typedef {Object} FeatureSpecification
 * @property {string} name - Feature name
 * @property {string} description - Feature description
 * @property {string[]} [filesCreated] - Files created by feature
 * @property {string[]} [filesRead] - Files read by feature
 * @property {string[]} [filesModified] - Files modified by feature
 * @property {string[]} [filesMonitored] - Files monitored for changes
 * @property {boolean} [needsBackup] - Requires backup before modification
 * @property {boolean} [needsTransactionSafety] - Requires atomic operations
 * @property {boolean} [analyzesPrompts] - Analyzes user input
 * @property {boolean} [detectsFilePatterns] - Uses file pattern matching
 * @property {boolean} [detectsContextChanges] - Detects context switches
 * @property {boolean} [providesContextualSuggestions] - Provides suggestions
 * @property {boolean} [monitorsProcessState] - Monitors process state
 * @property {boolean} [triggersProjectSwitch] - Triggers project switching
 * @property {boolean} [triggersContextReload] - Triggers context reload
 * @property {boolean} [logsToExternal] - Logs to external systems
 * @property {string[]} [externalSystems] - External systems integrated
 * @property {boolean} [requiresCaching] - Needs in-memory caching
 * @property {boolean} [requiresTimestamps] - Tracks timestamps
 * @property {boolean} [requiresHistory] - Maintains history
 * @property {boolean} [requiresThrottling] - Needs rate limiting
 * @property {string} [criticality] - 'low', 'medium', 'high'
 * @property {string[]} [hookDependencies] - Other hooks it depends on
 */

/**
 * Hook requirement recommendation
 * @typedef {Object} HookRecommendation
 * @property {string} type - Hook type from HookTypes
 * @property {string} reason - Why this hook is recommended
 * @property {number} priority - Suggested priority (1-100)
 * @property {string} name - Suggested hook name
 * @property {number} confidence - Confidence score (0-1)
 * @property {boolean} required - Whether hook is required vs optional
 * @property {string[]} indicators - Indicators that triggered this recommendation
 */

/**
 * Detection result
 * @typedef {Object} DetectionResult
 * @property {HookRecommendation[]} requiredHooks - Required hook integrations
 * @property {HookRecommendation[]} optionalHooks - Optional hook integrations
 * @property {Object} analysis - Detailed analysis breakdown
 * @property {string[]} warnings - Potential issues or conflicts
 */

/**
 * Hook Requirement Detector Class
 */
export class HookRequirementDetector {
  constructor() {
    this.rules = this._initializeRules();
  }

  /**
   * Initialize detection rules
   * @private
   * @returns {Object} Detection rules
   */
  _initializeRules() {
    return {
      // PRE_CONFIG_MODIFICATION patterns
      preConfigModification: {
        indicators: [
          { key: 'filesModified', patterns: ['**/config.json', '**/.claude/**/*.json', '**/settings*.json'] },
          { key: 'needsBackup', value: true },
          { key: 'needsTransactionSafety', value: true },
          { key: 'criticality', value: 'high' }
        ],
        minScore: 2,
        priorityRange: [1, 10],
        hookType: HookTypes.PRE_CONFIG_MODIFICATION
      },

      // USER_PROMPT_SUBMIT patterns
      userPromptSubmit: {
        indicators: [
          { key: 'analyzesPrompts', value: true },
          { key: 'detectsContextChanges', value: true },
          { key: 'detectsFilePatterns', value: true },
          { key: 'providesContextualSuggestions', value: true },
          { key: 'triggersProjectSwitch', value: true }
        ],
        minScore: 1,
        priorityRange: [10, 40],
        hookType: HookTypes.USER_PROMPT_SUBMIT
      },

      // POST_TOOL_USE patterns
      postToolUse: {
        indicators: [
          { key: 'filesMonitored', hasValues: true },
          { key: 'triggersContextReload', value: true },
          { key: 'requiresTimestamps', value: true },
          { key: 'logsToExternal', value: true },
          { key: 'filesCreated', hasValues: true }
        ],
        minScore: 1,
        priorityRange: [40, 60],
        hookType: HookTypes.POST_TOOL_USE
      },

      // PRE_PROJECT_SWITCH patterns
      preProjectSwitch: {
        indicators: [
          { key: 'requiresHistory', value: true },
          { key: 'triggersProjectSwitch', value: true },
          { key: 'needsTransactionSafety', value: true }
        ],
        minScore: 1,
        priorityRange: [10, 30],
        hookType: HookTypes.PRE_PROJECT_SWITCH
      },

      // POST_PROJECT_SWITCH patterns
      postProjectSwitch: {
        indicators: [
          { key: 'requiresCaching', value: true },
          { key: 'triggersProjectSwitch', value: true },
          { key: 'monitorsProcessState', value: true }
        ],
        minScore: 1,
        priorityRange: [10, 50],
        hookType: HookTypes.POST_PROJECT_SWITCH
      }
    };
  }

  /**
   * Analyze feature specification and detect hook requirements
   * 
   * @param {FeatureSpecification} spec - Feature specification
   * @returns {DetectionResult} Detection result with recommendations
   */
  detect(spec) {
    if (!spec || !spec.name) {
      throw new Error('Invalid feature specification: name is required');
    }

    const analysis = this._analyzeFeature(spec);
    const hooks = this._matchPatterns(spec, analysis);
    const warnings = this._checkForWarnings(spec, hooks);

    return {
      requiredHooks: hooks.filter(h => h.required),
      optionalHooks: hooks.filter(h => !h.required),
      analysis,
      warnings
    };
  }

  /**
   * Analyze feature characteristics
   * @private
   * @param {FeatureSpecification} spec - Feature specification
   * @returns {Object} Analysis breakdown
   */
  _analyzeFeature(spec) {
    return {
      fileOperations: this._analyzeFileOperations(spec),
      lifecycleInteractions: this._analyzeLifecycleInteractions(spec),
      externalIntegrations: this._analyzeExternalIntegrations(spec),
      statePersistence: this._analyzeStatePersistence(spec),
      criticality: spec.criticality || 'medium'
    };
  }

  /**
   * Analyze file operations
   * @private
   */
  _analyzeFileOperations(spec) {
    return {
      reads: spec.filesRead || [],
      writes: spec.filesModified || spec.filesCreated || [],
      monitors: spec.filesMonitored || [],
      needsBackup: spec.needsBackup || false,
      needsAtomic: spec.needsTransactionSafety || false,
      modifiesConfig: this._checkConfigModification(spec)
    };
  }

  /**
   * Check if feature modifies configuration files
   * @private
   */
  _checkConfigModification(spec) {
    const allFiles = [
      ...(spec.filesModified || []),
      ...(spec.filesCreated || []),
      ...(spec.filesMonitored || [])
    ];

    const configPatterns = [
      /config\.json$/i,
      /settings.*\.json$/i,
      /metadata\.json$/i,
      /\.claude\/.*\.json$/i
    ];

    return allFiles.some(file => 
      configPatterns.some(pattern => pattern.test(file))
    );
  }

  /**
   * Analyze lifecycle interactions
   * @private
   */
  _analyzeLifecycleInteractions(spec) {
    return {
      analyzesUserInput: spec.analyzesPrompts || false,
      detectsContextChanges: spec.detectsContextChanges || false,
      triggersProjectSwitch: spec.triggersProjectSwitch || false,
      triggersContextReload: spec.triggersContextReload || false,
      monitorsToolExecution: (spec.filesMonitored || []).length > 0
    };
  }

  /**
   * Analyze external integrations
   * @private
   */
  _analyzeExternalIntegrations(spec) {
    return {
      systems: spec.externalSystems || [],
      logsToExternal: spec.logsToExternal || false,
      monitorsProcess: spec.monitorsProcessState || false,
      usesNetworking: (spec.externalSystems || []).some(sys => 
        ['api', 'http', 'rest', 'webhook'].some(term => sys.toLowerCase().includes(term))
      )
    };
  }

  /**
   * Analyze state persistence needs
   * @private
   */
  _analyzeStatePersistence(spec) {
    return {
      requiresCaching: spec.requiresCaching || false,
      requiresTimestamps: spec.requiresTimestamps || false,
      requiresHistory: spec.requiresHistory || false,
      requiresThrottling: spec.requiresThrottling || false
    };
  }

  /**
   * Match patterns to detect hook requirements
   * @private
   * @returns {HookRecommendation[]}
   */
  _matchPatterns(spec, analysis) {
    const recommendations = [];

    for (const [ruleName, rule] of Object.entries(this.rules)) {
      const match = this._evaluateRule(spec, rule);
      
      if (match.score >= rule.minScore) {
        const recommendation = this._createRecommendation(
          spec,
          rule,
          match,
          ruleName
        );
        
        recommendations.push(recommendation);
      }
    }

    // Sort by confidence and priority
    recommendations.sort((a, b) => {
      if (a.required !== b.required) return a.required ? -1 : 1;
      if (Math.abs(a.confidence - b.confidence) > 0.1) return b.confidence - a.confidence;
      return a.priority - b.priority;
    });

    return recommendations;
  }

  /**
   * Evaluate a detection rule
   * @private
   * @returns {{score: number, matchedIndicators: string[]}}
   */
  _evaluateRule(spec, rule) {
    let score = 0;
    const matchedIndicators = [];

    for (const indicator of rule.indicators) {
      if (this._matchesIndicator(spec, indicator)) {
        score++;
        matchedIndicators.push(indicator.key);
      }
    }

    return { score, matchedIndicators };
  }

  /**
   * Check if spec matches an indicator
   * @private
   */
  _matchesIndicator(spec, indicator) {
    const value = spec[indicator.key];

    // Check for boolean match
    if (indicator.value !== undefined) {
      return value === indicator.value;
    }

    // Check for array with values
    if (indicator.hasValues) {
      return Array.isArray(value) && value.length > 0;
    }

    // Check for pattern matches in arrays
    if (indicator.patterns && Array.isArray(value)) {
      return value.some(v => 
        indicator.patterns.some(pattern => 
          this._matchesPattern(v, pattern)
        )
      );
    }

    return false;
  }

  /**
   * Check if string matches glob-like pattern
   * @private
   */
  _matchesPattern(str, pattern) {
    // Simple glob matching (** for any path, * for any chars)
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\./g, '\\.');
    
    return new RegExp(regexPattern).test(str);
  }

  /**
   * Create hook recommendation from rule match
   * @private
   * @returns {HookRecommendation}
   */
  _createRecommendation(spec, rule, match, ruleName) {
    const confidence = match.score / rule.indicators.length;
    const isRequired = confidence >= 0.7 || spec.criticality === 'high';
    
    // Calculate priority based on range and dependencies
    const basePriority = rule.priorityRange[0];
    const prioritySpread = rule.priorityRange[1] - rule.priorityRange[0];
    const priority = Math.round(basePriority + (prioritySpread * (1 - confidence)));

    return {
      type: rule.hookType,
      reason: this._generateReason(spec, rule.hookType, match.matchedIndicators),
      priority,
      name: this._generateHookName(spec, rule.hookType),
      confidence,
      required: isRequired,
      indicators: match.matchedIndicators
    };
  }

  /**
   * Generate human-readable reason for hook recommendation
   * @private
   */
  _generateReason(spec, hookType, indicators) {
    const reasons = {
      [HookTypes.PRE_CONFIG_MODIFICATION]: 'Backup configuration before modification',
      [HookTypes.USER_PROMPT_SUBMIT]: 'Analyze user input and provide context',
      [HookTypes.POST_TOOL_USE]: 'Monitor file changes and maintain synchronization',
      [HookTypes.PRE_PROJECT_SWITCH]: 'Prepare for project context switch',
      [HookTypes.POST_PROJECT_SWITCH]: 'Initialize project state after switch'
    };

    let reason = reasons[hookType] || 'Required for feature functionality';

    // Add specific indicators if available
    if (indicators.length > 0) {
      const indicatorReasons = indicators.map(ind => {
        return ind.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
      });
      reason += ` (${indicatorReasons.slice(0, 2).join(', ')})`;
    }

    return reason;
  }

  /**
   * Generate suggested hook name
   * @private
   */
  _generateHookName(spec, hookType) {
    const featureName = spec.name
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '');

    const hookSuffix = {
      [HookTypes.PRE_CONFIG_MODIFICATION]: 'Backup',
      [HookTypes.USER_PROMPT_SUBMIT]: 'Analyzer',
      [HookTypes.POST_TOOL_USE]: 'Monitor',
      [HookTypes.PRE_PROJECT_SWITCH]: 'Prepare',
      [HookTypes.POST_PROJECT_SWITCH]: 'Initialize'
    };

    return `${featureName}${hookSuffix[hookType] || 'Hook'}`;
  }

  /**
   * Check for warnings and potential issues
   * @private
   * @returns {string[]}
   */
  _checkForWarnings(spec, hooks) {
    const warnings = [];

    // Check for priority conflicts
    const priorities = hooks.map(h => h.priority);
    const duplicates = priorities.filter((p, i) => priorities.indexOf(p) !== i);
    if (duplicates.length > 0) {
      warnings.push(`Priority conflict detected: Multiple hooks assigned priority ${duplicates[0]}`);
    }

    // Check for missing dependencies
    if (spec.hookDependencies && spec.hookDependencies.length > 0) {
      warnings.push(`Feature depends on existing hooks: ${spec.hookDependencies.join(', ')}`);
    }

    // Check for high complexity
    if (hooks.length > 3) {
      warnings.push('Feature requires 4+ hooks - consider splitting feature into smaller components');
    }

    // Check for config modification without backup
    if (spec.filesModified && spec.filesModified.some(f => f.includes('config'))) {
      const hasBackupHook = hooks.some(h => h.type === HookTypes.PRE_CONFIG_MODIFICATION);
      if (!hasBackupHook) {
        warnings.push('Config modification detected but no PRE_CONFIG_MODIFICATION hook recommended - verify data safety');
      }
    }

    return warnings;
  }

  /**
   * Batch analyze multiple features
   * 
   * @param {FeatureSpecification[]} specs - Array of feature specifications
   * @returns {DetectionResult[]} Array of detection results
   */
  detectBatch(specs) {
    return specs.map(spec => this.detect(spec));
  }

  /**
   * Generate a detailed report
   * 
   * @param {DetectionResult} result - Detection result
   * @returns {string} Formatted report
   */
  generateReport(result) {
    const lines = [];
    
    lines.push('# Hook Requirement Detection Report\n');
    
    if (result.requiredHooks.length > 0) {
      lines.push('## Required Hooks\n');
      result.requiredHooks.forEach(hook => {
        lines.push(`### ${hook.name}`);
        lines.push(`- **Type:** ${hook.type}`);
        lines.push(`- **Priority:** ${hook.priority}`);
        lines.push(`- **Confidence:** ${(hook.confidence * 100).toFixed(0)}%`);
        lines.push(`- **Reason:** ${hook.reason}`);
        lines.push(`- **Indicators:** ${hook.indicators.join(', ')}`);
        lines.push('');
      });
    }

    if (result.optionalHooks.length > 0) {
      lines.push('## Optional Hooks\n');
      result.optionalHooks.forEach(hook => {
        lines.push(`### ${hook.name}`);
        lines.push(`- **Type:** ${hook.type}`);
        lines.push(`- **Priority:** ${hook.priority}`);
        lines.push(`- **Confidence:** ${(hook.confidence * 100).toFixed(0)}%`);
        lines.push(`- **Reason:** ${hook.reason}`);
        lines.push('');
      });
    }

    if (result.warnings.length > 0) {
      lines.push('## Warnings\n');
      result.warnings.forEach(warning => {
        lines.push(`⚠️  ${warning}`);
      });
      lines.push('');
    }

    lines.push('## Analysis Summary\n');
    lines.push(`- **File Operations:** ${result.analysis.fileOperations.writes.length} write(s), ${result.analysis.fileOperations.reads.length} read(s)`);
    lines.push(`- **Lifecycle Interactions:** ${Object.values(result.analysis.lifecycleInteractions).filter(Boolean).length} interaction(s)`);
    lines.push(`- **External Integrations:** ${result.analysis.externalIntegrations.systems.length} system(s)`);
    lines.push(`- **Criticality:** ${result.analysis.criticality}`);
    
    return lines.join('\n');
  }
}

/**
 * Convenience function for quick detection
 * 
 * @param {FeatureSpecification} spec - Feature specification
 * @returns {DetectionResult} Detection result
 */
export function detectHookRequirements(spec) {
  const detector = new HookRequirementDetector();
  return detector.detect(spec);
}

export default HookRequirementDetector;

