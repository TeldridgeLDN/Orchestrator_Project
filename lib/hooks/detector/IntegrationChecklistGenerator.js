/**
 * Integration Checklist Generator
 * 
 * Generates detailed, actionable integration checklists for detected hook requirements.
 * Produces developer-friendly checklists in both Markdown and JSON formats with
 * comprehensive implementation guidance.
 * 
 * @module hooks/detector/IntegrationChecklistGenerator
 * @version 1.0.0
 */

import { HookTypes } from './HookRequirementDetector.js';

/**
 * Checklist item schema
 * @typedef {Object} ChecklistItem
 * @property {string} id - Unique identifier for the item
 * @property {string} category - Category (setup, implementation, testing, validation)
 * @property {string} title - Item title
 * @property {string} description - Detailed description
 * @property {boolean} completed - Completion status
 * @property {string[]} [resources] - Related resources or files
 * @property {string[]} [dependencies] - Other checklist items this depends on
 * @property {string} [code] - Example code snippet
 */

/**
 * Integration checklist schema
 * @typedef {Object} IntegrationChecklist
 * @property {string} hookName - Name of the hook
 * @property {string} hookType - Hook type from HookTypes
 * @property {number} priority - Execution priority
 * @property {number} confidence - Detection confidence (0-1)
 * @property {string} reason - Why this hook is needed
 * @property {ChecklistItem[]} items - Checklist items
 * @property {Object} metadata - Additional metadata
 * @property {string} metadata.triggerConditions - When hook triggers
 * @property {string} metadata.contextRequirements - Required context
 * @property {string} metadata.integrationNotes - Integration guidance
 * @property {Object} testingPlan - Testing strategy
 * @property {string[]} testingPlan.unitTests - Unit test requirements
 * @property {string[]} testingPlan.integrationTests - Integration test requirements
 * @property {string[]} testingPlan.scenarios - Test scenarios
 */

/**
 * Integration Checklist Generator Class
 */
export class IntegrationChecklistGenerator {
  constructor() {
    this.templates = this._initializeTemplates();
  }

  /**
   * Initialize checklist templates for each hook type
   * @private
   */
  _initializeTemplates() {
    return {
      [HookTypes.PRE_CONFIG_MODIFICATION]: this._getPreConfigModificationTemplate(),
      [HookTypes.USER_PROMPT_SUBMIT]: this._getUserPromptSubmitTemplate(),
      [HookTypes.POST_TOOL_USE]: this._getPostToolUseTemplate(),
      [HookTypes.PRE_PROJECT_SWITCH]: this._getPreProjectSwitchTemplate(),
      [HookTypes.POST_PROJECT_SWITCH]: this._getPostProjectSwitchTemplate()
    };
  }

  /**
   * Generate integration checklist from hook recommendation
   * 
   * @param {Object} hookRecommendation - Hook recommendation from detector
   * @param {Object} [analysisContext] - Optional analysis context from detector
   * @returns {IntegrationChecklist} Integration checklist
   */
  generate(hookRecommendation, analysisContext = {}) {
    if (!hookRecommendation || !hookRecommendation.type) {
      throw new Error('Invalid hook recommendation: type is required');
    }

    const template = this.templates[hookRecommendation.type];
    if (!template) {
      throw new Error(`Unknown hook type: ${hookRecommendation.type}`);
    }

    // Generate checklist items from template
    const items = this._generateChecklistItems(
      template,
      hookRecommendation,
      analysisContext
    );

    // Generate metadata
    const metadata = this._generateMetadata(
      hookRecommendation,
      analysisContext
    );

    // Generate testing plan
    const testingPlan = this._generateTestingPlan(
      hookRecommendation,
      analysisContext
    );

    return {
      hookName: hookRecommendation.name,
      hookType: hookRecommendation.type,
      priority: hookRecommendation.priority,
      confidence: hookRecommendation.confidence,
      reason: hookRecommendation.reason,
      items,
      metadata,
      testingPlan
    };
  }

  /**
   * Generate checklists for multiple hook recommendations
   * 
   * @param {Object[]} hookRecommendations - Array of hook recommendations
   * @param {Object} [analysisContext] - Optional analysis context
   * @returns {IntegrationChecklist[]} Array of checklists
   */
  generateBatch(hookRecommendations, analysisContext = {}) {
    return hookRecommendations.map(rec => 
      this.generate(rec, analysisContext)
    );
  }

  /**
   * Format checklist as Markdown
   * 
   * @param {IntegrationChecklist} checklist - Integration checklist
   * @returns {string} Markdown formatted checklist
   */
  formatAsMarkdown(checklist) {
    const lines = [];

    // Header
    lines.push(`# ${checklist.hookName} Integration Checklist\n`);
    lines.push(`**Hook Type:** ${checklist.hookType}  `);
    lines.push(`**Priority:** ${checklist.priority}  `);
    lines.push(`**Confidence:** ${(checklist.confidence * 100).toFixed(0)}%  `);
    lines.push(`**Reason:** ${checklist.reason}\n`);

    // Metadata
    lines.push('## Integration Details\n');
    lines.push(`**Trigger Conditions:** ${checklist.metadata.triggerConditions}\n`);
    lines.push(`**Context Requirements:** ${checklist.metadata.contextRequirements}\n`);
    lines.push(`**Integration Notes:** ${checklist.metadata.integrationNotes}\n`);

    // Checklist items by category
    const categories = {
      setup: '## 📋 Setup Tasks',
      implementation: '## 💻 Implementation Tasks',
      testing: '## 🧪 Testing Tasks',
      validation: '## ✅ Validation Tasks'
    };

    for (const [category, title] of Object.entries(categories)) {
      const categoryItems = checklist.items.filter(item => item.category === category);
      
      if (categoryItems.length > 0) {
        lines.push(`\n${title}\n`);
        
        categoryItems.forEach((item, index) => {
          const checkbox = item.completed ? '[x]' : '[ ]';
          lines.push(`${index + 1}. ${checkbox} **${item.title}**`);
          lines.push(`   - ${item.description}`);
          
          if (item.dependencies && item.dependencies.length > 0) {
            lines.push(`   - *Depends on:* ${item.dependencies.join(', ')}`);
          }
          
          if (item.resources && item.resources.length > 0) {
            lines.push(`   - *Resources:* ${item.resources.join(', ')}`);
          }
          
          if (item.code) {
            lines.push('   - *Example:*');
            lines.push('```javascript');
            lines.push(item.code);
            lines.push('```');
          }
          
          lines.push('');
        });
      }
    }

    // Testing Plan
    lines.push('\n## 🧪 Testing Plan\n');
    
    if (checklist.testingPlan.unitTests.length > 0) {
      lines.push('### Unit Tests\n');
      checklist.testingPlan.unitTests.forEach(test => {
        lines.push(`- ${test}`);
      });
      lines.push('');
    }

    if (checklist.testingPlan.integrationTests.length > 0) {
      lines.push('### Integration Tests\n');
      checklist.testingPlan.integrationTests.forEach(test => {
        lines.push(`- ${test}`);
      });
      lines.push('');
    }

    if (checklist.testingPlan.scenarios.length > 0) {
      lines.push('### Test Scenarios\n');
      checklist.testingPlan.scenarios.forEach(scenario => {
        lines.push(`- ${scenario}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Format checklist as JSON
   * 
   * @param {IntegrationChecklist} checklist - Integration checklist
   * @param {boolean} [pretty=true] - Pretty print JSON
   * @returns {string} JSON formatted checklist
   */
  formatAsJSON(checklist, pretty = true) {
    return JSON.stringify(checklist, null, pretty ? 2 : 0);
  }

  /**
   * Generate checklist items from template
   * @private
   */
  _generateChecklistItems(template, hookRecommendation, analysisContext) {
    const items = [];
    let itemId = 1;

    // Process template items
    for (const templateItem of template.items) {
      // Apply conditional logic
      if (templateItem.condition && !this._evaluateCondition(
        templateItem.condition,
        hookRecommendation,
        analysisContext
      )) {
        continue;
      }

      // Create checklist item
      const item = {
        id: `${hookRecommendation.name}-${itemId++}`,
        category: templateItem.category,
        title: this._interpolateString(templateItem.title, hookRecommendation, analysisContext),
        description: this._interpolateString(templateItem.description, hookRecommendation, analysisContext),
        completed: false,
        resources: templateItem.resources || [],
        dependencies: templateItem.dependencies || []
      };

      // Add code example if provided
      if (templateItem.code) {
        item.code = this._interpolateString(templateItem.code, hookRecommendation, analysisContext);
      }

      items.push(item);
    }

    return items;
  }

  /**
   * Generate metadata section
   * @private
   */
  _generateMetadata(hookRecommendation, analysisContext) {
    const triggerConditions = this._getTriggerConditions(hookRecommendation.type);
    const contextRequirements = this._getContextRequirements(hookRecommendation, analysisContext);
    const integrationNotes = this._getIntegrationNotes(hookRecommendation, analysisContext);

    return {
      triggerConditions,
      contextRequirements,
      integrationNotes
    };
  }

  /**
   * Generate testing plan
   * @private
   */
  _generateTestingPlan(hookRecommendation, analysisContext) {
    const template = this.templates[hookRecommendation.type];
    
    return {
      unitTests: template.testing.unitTests.map(test => 
        this._interpolateString(test, hookRecommendation, analysisContext)
      ),
      integrationTests: template.testing.integrationTests.map(test =>
        this._interpolateString(test, hookRecommendation, analysisContext)
      ),
      scenarios: template.testing.scenarios.map(scenario =>
        this._interpolateString(scenario, hookRecommendation, analysisContext)
      )
    };
  }

  /**
   * Get trigger conditions for hook type
   * @private
   */
  _getTriggerConditions(hookType) {
    const conditions = {
      [HookTypes.PRE_CONFIG_MODIFICATION]: 'Before any modification to configuration files',
      [HookTypes.USER_PROMPT_SUBMIT]: 'Before user prompt is processed',
      [HookTypes.POST_TOOL_USE]: 'After tool execution completes',
      [HookTypes.PRE_PROJECT_SWITCH]: 'Before switching project contexts',
      [HookTypes.POST_PROJECT_SWITCH]: 'After switching project contexts'
    };

    return conditions[hookType] || 'Unknown trigger condition';
  }

  /**
   * Get context requirements
   * @private
   */
  _getContextRequirements(hookRecommendation, analysisContext) {
    const requirements = [];

    // Check for file operations
    if (analysisContext.fileOperations) {
      if (analysisContext.fileOperations.reads && analysisContext.fileOperations.reads.length > 0) {
        requirements.push('Read access to: ' + analysisContext.fileOperations.reads.slice(0, 3).join(', '));
      }
      if (analysisContext.fileOperations.writes && analysisContext.fileOperations.writes.length > 0) {
        requirements.push('Write access to: ' + analysisContext.fileOperations.writes.slice(0, 3).join(', '));
      }
    }

    // Check for external systems
    if (analysisContext.externalIntegrations && analysisContext.externalIntegrations.systems) {
      requirements.push('External system access: ' + analysisContext.externalIntegrations.systems.join(', '));
    }

    // Check for state requirements
    if (analysisContext.statePersistence) {
      if (analysisContext.statePersistence.requiresCaching) {
        requirements.push('In-memory caching capability');
      }
      if (analysisContext.statePersistence.requiresTimestamps) {
        requirements.push('Timestamp tracking capability');
      }
    }

    return requirements.length > 0 ? requirements.join('; ') : 'No special requirements';
  }

  /**
   * Get integration notes
   * @private
   */
  _getIntegrationNotes(hookRecommendation, analysisContext) {
    const notes = [];

    // Add priority-based notes
    if (hookRecommendation.priority <= 10) {
      notes.push('High priority - runs early in execution chain');
    } else if (hookRecommendation.priority >= 50) {
      notes.push('Lower priority - runs late in execution chain');
    }

    // Add confidence-based notes
    if (hookRecommendation.confidence < 0.5) {
      notes.push('⚠️ Low confidence detection - verify requirements manually');
    } else if (hookRecommendation.confidence >= 0.9) {
      notes.push('✅ High confidence detection - requirements well-defined');
    }

    // Add criticality notes
    if (analysisContext.criticality === 'high') {
      notes.push('⚠️ High criticality - thorough testing required');
    }

    return notes.length > 0 ? notes.join('; ') : 'Standard integration process';
  }

  /**
   * Evaluate template condition
   * @private
   */
  _evaluateCondition(condition, hookRecommendation, analysisContext) {
    // Simple condition evaluation
    // Format: "property.path === value" or "property.path > value"
    
    try {
      // For now, support basic property checks
      if (condition.includes('confidence >')) {
        const threshold = parseFloat(condition.split('>')[1].trim());
        return hookRecommendation.confidence > threshold;
      }
      
      if (condition.includes('priority <')) {
        const threshold = parseInt(condition.split('<')[1].trim());
        return hookRecommendation.priority < threshold;
      }

      // Default: include item
      return true;
    } catch (error) {
      // If condition evaluation fails, include item
      return true;
    }
  }

  /**
   * Interpolate template string with values
   * @private
   */
  _interpolateString(str, hookRecommendation, analysisContext) {
    return str
      .replace(/\{hookName\}/g, hookRecommendation.name)
      .replace(/\{hookType\}/g, hookRecommendation.type)
      .replace(/\{priority\}/g, hookRecommendation.priority)
      .replace(/\{reason\}/g, hookRecommendation.reason);
  }

  // Template definitions below...

  /**
   * PRE_CONFIG_MODIFICATION template
   * @private
   */
  _getPreConfigModificationTemplate() {
    return {
      items: [
        {
          category: 'setup',
          title: 'Create hook file structure',
          description: 'Create lib/hooks/{hookName}.js with proper ES6 module structure',
          resources: ['lib/hooks/configBackup.js']
        },
        {
          category: 'setup',
          title: 'Import required dependencies',
          description: 'Import fs/promises, path, and any config utilities needed',
          code: `import fs from 'fs/promises';\nimport path from 'path';\nimport { readConfig } from '../utils/config.js';`
        },
        {
          category: 'implementation',
          title: 'Implement backup logic',
          description: 'Create backup of target files before modification with timestamped names',
          resources: ['lib/hooks/configBackup.js']
        },
        {
          category: 'implementation',
          title: 'Add error handling',
          description: 'Wrap backup logic in try-catch, log errors but don\'t block execution',
          code: `try {\n  // backup logic\n} catch (error) {\n  console.error('Backup failed:', error.message);\n}`
        },
        {
          category: 'implementation',
          title: 'Implement hook function',
          description: 'Export async function that accepts context and next parameters',
          code: `export async function {hookName}(context, next) {\n  // Implementation\n  await next();\n}`
        },
        {
          category: 'implementation',
          title: 'Register in HookManager',
          description: 'Add registration code to lib/hooks/index.js with priority {priority}',
          resources: ['lib/hooks/index.js'],
          code: `hookManager.register(\n  HookTypes.PRE_CONFIG_MODIFICATION,\n  {hookName},\n  { priority: {priority}, name: '{hookName}' }\n);`
        },
        {
          category: 'testing',
          title: 'Create test file',
          description: 'Create tests/hooks/{hookName}.test.js with test suite',
          resources: ['tests/hooks/']
        },
        {
          category: 'testing',
          title: 'Test backup creation',
          description: 'Verify backup files are created with correct timestamps'
        },
        {
          category: 'testing',
          title: 'Test error handling',
          description: 'Verify hook doesn\'t block execution on error'
        },
        {
          category: 'validation',
          title: 'Verify hook registration',
          description: 'Confirm hook is registered in HookManager with correct priority'
        },
        {
          category: 'validation',
          title: 'Test execution order',
          description: 'Verify hook runs before other PRE_CONFIG hooks if priority is lower'
        }
      ],
      testing: {
        unitTests: [
          'Test hook function exists and is async',
          'Test backup creation with valid config',
          'Test error handling with missing files',
          'Test next() is called to continue chain'
        ],
        integrationTests: [
          'Test hook triggers before config modification',
          'Test hook integration with existing PRE_CONFIG hooks',
          'Test backup restore functionality',
          'Test concurrent modification handling'
        ],
        scenarios: [
          'Config modification with valid backup',
          'Config modification with backup failure',
          'Multiple rapid config modifications',
          'Config modification during project switch'
        ]
      }
    };
  }

  /**
   * USER_PROMPT_SUBMIT template
   * @private
   */
  _getUserPromptSubmitTemplate() {
    return {
      items: [
        {
          category: 'setup',
          title: 'Create hook file',
          description: 'Create lib/hooks/{hookName}.js with module structure'
        },
        {
          category: 'setup',
          title: 'Set up caching if needed',
          description: 'Initialize in-memory cache with TTL for performance',
          condition: 'analysisContext.statePersistence.requiresCaching',
          code: `const cache = new Map();\nconst CACHE_TTL = 60000; // 1 minute`
        },
        {
          category: 'implementation',
          title: 'Parse prompt text',
          description: 'Extract and analyze user prompt from context.prompt',
          code: `const prompt = context.prompt || '';`
        },
        {
          category: 'implementation',
          title: 'Implement detection logic',
          description: 'Add logic to detect patterns, keywords, or context changes in prompt'
        },
        {
          category: 'implementation',
          title: 'Add throttling if needed',
          description: 'Implement throttling to prevent excessive processing',
          condition: 'analysisContext.statePersistence.requiresThrottling'
        },
        {
          category: 'implementation',
          title: 'Implement hook function',
          description: 'Export async function with proper middleware pattern',
          code: `export async function {hookName}(context, next) {\n  // Analysis logic\n  await next();\n}`
        },
        {
          category: 'implementation',
          title: 'Register in HookManager',
          description: 'Add to lib/hooks/index.js with priority {priority}',
          resources: ['lib/hooks/index.js']
        },
        {
          category: 'testing',
          title: 'Create test suite',
          description: 'Create comprehensive tests for prompt analysis'
        },
        {
          category: 'testing',
          title: 'Test pattern matching',
          description: 'Verify patterns are correctly detected in prompts'
        },
        {
          category: 'testing',
          title: 'Test false positives',
          description: 'Ensure hook doesn\'t trigger incorrectly'
        },
        {
          category: 'validation',
          title: 'Verify execution order',
          description: 'Confirm hook runs at correct point in USER_PROMPT chain'
        }
      ],
      testing: {
        unitTests: [
          'Test prompt parsing logic',
          'Test pattern detection with various inputs',
          'Test cache functionality if applicable',
          'Test throttling mechanism if applicable'
        ],
        integrationTests: [
          'Test integration with other USER_PROMPT hooks',
          'Test prompt submission flow',
          'Test context modification effects',
          'Test performance under load'
        ],
        scenarios: [
          'Simple prompt analysis',
          'Complex prompt with multiple patterns',
          'Rapid successive prompts',
          'Prompts during project switch'
        ]
      }
    };
  }

  /**
   * POST_TOOL_USE template
   * @private
   */
  _getPostToolUseTemplate() {
    return {
      items: [
        {
          category: 'setup',
          title: 'Create hook file',
          description: 'Create lib/hooks/{hookName}.js with proper structure'
        },
        {
          category: 'setup',
          title: 'Set up file monitoring',
          description: 'Initialize file timestamp tracking for monitored files',
          condition: 'analysisContext.fileOperations.monitors.length > 0',
          code: `const fileTimestamps = new Map();`
        },
        {
          category: 'implementation',
          title: 'Implement change detection',
          description: 'Add logic to detect file modifications using timestamps or hashing'
        },
        {
          category: 'implementation',
          title: 'Add external logging',
          description: 'Implement logging to external systems if required',
          condition: 'analysisContext.externalIntegrations.logsToExternal'
        },
        {
          category: 'implementation',
          title: 'Implement throttling',
          description: 'Add check interval throttling to reduce filesystem overhead',
          code: `const MIN_CHECK_INTERVAL = 1000; // 1 second\nif (Date.now() - lastCheck < MIN_CHECK_INTERVAL) return next();`
        },
        {
          category: 'implementation',
          title: 'Implement hook function',
          description: 'Export async function with tool context handling',
          code: `export async function {hookName}(context, next) {\n  // Monitor and react to changes\n  await next();\n}`
        },
        {
          category: 'implementation',
          title: 'Register in HookManager',
          description: 'Add to lib/hooks/index.js with priority {priority}'
        },
        {
          category: 'testing',
          title: 'Create test suite',
          description: 'Create tests for file monitoring and change detection'
        },
        {
          category: 'testing',
          title: 'Test change detection',
          description: 'Verify file changes are detected accurately'
        },
        {
          category: 'testing',
          title: 'Test throttling',
          description: 'Ensure throttling prevents excessive checks'
        },
        {
          category: 'validation',
          title: 'Verify POST_TOOL_USE trigger',
          description: 'Confirm hook runs after tool execution'
        }
      ],
      testing: {
        unitTests: [
          'Test file change detection logic',
          'Test timestamp tracking accuracy',
          'Test external logging if applicable',
          'Test throttling mechanism'
        ],
        integrationTests: [
          'Test integration with tool execution flow',
          'Test multiple file changes handling',
          'Test performance with many monitored files',
          'Test concurrent tool executions'
        ],
        scenarios: [
          'Single file modification',
          'Multiple simultaneous file changes',
          'Rapid successive tool executions',
          'Tool execution during context reload'
        ]
      }
    };
  }

  /**
   * PRE_PROJECT_SWITCH template
   * @private
   */
  _getPreProjectSwitchTemplate() {
    return {
      items: [
        {
          category: 'setup',
          title: 'Create hook file',
          description: 'Create lib/hooks/{hookName}.js'
        },
        {
          category: 'implementation',
          title: 'Implement cleanup logic',
          description: 'Add logic to clean up project-specific state before switch'
        },
        {
          category: 'implementation',
          title: 'Save state if needed',
          description: 'Persist any state that needs to survive project switch',
          condition: 'analysisContext.statePersistence.requiresHistory'
        },
        {
          category: 'implementation',
          title: 'Implement hook function',
          description: 'Export async function for pre-switch operations'
        },
        {
          category: 'implementation',
          title: 'Register in HookManager',
          description: 'Add to lib/hooks/index.js with priority {priority}'
        },
        {
          category: 'testing',
          title: 'Test cleanup logic',
          description: 'Verify state is properly cleaned up'
        },
        {
          category: 'validation',
          title: 'Test project switch flow',
          description: 'Verify hook runs before actual switch occurs'
        }
      ],
      testing: {
        unitTests: [
          'Test state cleanup logic',
          'Test state persistence if applicable',
          'Test error handling during cleanup'
        ],
        integrationTests: [
          'Test integration with project switch flow',
          'Test multiple successive switches',
          'Test switch with unsaved state'
        ],
        scenarios: [
          'Normal project switch',
          'Switch with active processes',
          'Switch with unsaved changes',
          'Rapid successive switches'
        ]
      }
    };
  }

  /**
   * POST_PROJECT_SWITCH template
   * @private
   */
  _getPostProjectSwitchTemplate() {
    return {
      items: [
        {
          category: 'setup',
          title: 'Create hook file',
          description: 'Create lib/hooks/{hookName}.js'
        },
        {
          category: 'implementation',
          title: 'Implement initialization logic',
          description: 'Add logic to initialize project-specific state'
        },
        {
          category: 'implementation',
          title: 'Load cached state',
          description: 'Restore any cached state for new project',
          condition: 'analysisContext.statePersistence.requiresCaching'
        },
        {
          category: 'implementation',
          title: 'Implement hook function',
          description: 'Export async function for post-switch operations'
        },
        {
          category: 'implementation',
          title: 'Register in HookManager',
          description: 'Add to lib/hooks/index.js with priority {priority}'
        },
        {
          category: 'testing',
          title: 'Test initialization logic',
          description: 'Verify state is properly initialized'
        },
        {
          category: 'validation',
          title: 'Test project switch flow',
          description: 'Verify hook runs after switch completes'
        }
      ],
      testing: {
        unitTests: [
          'Test state initialization logic',
          'Test cache loading if applicable',
          'Test error handling during initialization'
        ],
        integrationTests: [
          'Test integration with project switch flow',
          'Test switching between projects',
          'Test initialization with missing cache'
        ],
        scenarios: [
          'Switch to new project',
          'Switch to existing project',
          'Switch with cached state',
          'Switch without cached state'
        ]
      }
    };
  }
}

/**
 * Convenience function for generating checklist
 * 
 * @param {Object} hookRecommendation - Hook recommendation
 * @param {Object} [analysisContext] - Analysis context
 * @returns {IntegrationChecklist} Integration checklist
 */
export function generateIntegrationChecklist(hookRecommendation, analysisContext) {
  const generator = new IntegrationChecklistGenerator();
  return generator.generate(hookRecommendation, analysisContext);
}

export default IntegrationChecklistGenerator;

