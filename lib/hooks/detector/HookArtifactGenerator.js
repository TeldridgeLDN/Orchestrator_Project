/**
 * Hook Artifact Generator
 * 
 * Automatically generates hook implementation files, tests, registration code,
 * and documentation based on detected hook requirements and generated checklists.
 * 
 * @module hooks/detector/HookArtifactGenerator
 * @version 1.0.0
 */

import { HookTypes } from './HookRequirementDetector.js';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/**
 * Artifact generation result
 * @typedef {Object} GenerationResult
 * @property {boolean} success - Whether generation succeeded
 * @property {string[]} filesCreated - List of created file paths
 * @property {string[]} warnings - Any warnings during generation
 * @property {string} registrationCode - Generated registration code
 * @property {Object} metadata - Generation metadata
 */

/**
 * Hook Artifact Generator Class
 */
export class HookArtifactGenerator {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || process.cwd(),
      overwrite: options.overwrite || false,
      dryRun: options.dryRun || false,
      ...options
    };
  }

  /**
   * Generate all artifacts for a hook
   * 
   * @param {Object} hookRecommendation - Hook recommendation from detector
   * @param {Object} [analysisContext] - Optional analysis context
   * @returns {Promise<GenerationResult>} Generation result
   */
  async generate(hookRecommendation, analysisContext = {}) {
    if (!hookRecommendation || !hookRecommendation.type || !hookRecommendation.name) {
      throw new Error('Invalid hook recommendation: type and name are required');
    }

    const result = {
      success: false,
      filesCreated: [],
      warnings: [],
      registrationCode: '',
      metadata: {
        hookName: hookRecommendation.name,
        hookType: hookRecommendation.type,
        timestamp: new Date().toISOString()
      }
    };

    try {
      // Generate hook implementation file
      const hookFile = await this._generateHookFile(hookRecommendation, analysisContext);
      result.filesCreated.push(hookFile);

      // Generate test file
      const testFile = await this._generateTestFile(hookRecommendation, analysisContext);
      result.filesCreated.push(testFile);

      // Generate registration code
      result.registrationCode = this._generateRegistrationCode(hookRecommendation);

      // Generate documentation
      const docFile = await this._generateDocumentation(hookRecommendation, analysisContext);
      result.filesCreated.push(docFile);

      result.success = true;

      // Add warnings if needed
      if (hookRecommendation.confidence < 0.5) {
        result.warnings.push('Low confidence detection - manual review recommended');
      }

    } catch (error) {
      result.success = false;
      result.warnings.push(`Generation error: ${error.message}`);
    }

    return result;
  }

  /**
   * Generate hook implementation file
   * @private
   */
  async _generateHookFile(hookRecommendation, analysisContext) {
    const template = this._getHookTemplate(hookRecommendation.type);
    const content = this._interpolateTemplate(template, hookRecommendation, analysisContext);
    
    const fileName = this._toKebabCase(hookRecommendation.name) + '.js';
    const filePath = path.join(this.options.outputDir, 'lib/hooks', fileName);

    if (!this.options.dryRun) {
      await this._ensureDirectory(path.dirname(filePath));
      
      if (existsSync(filePath) && !this.options.overwrite) {
        throw new Error(`File already exists: ${filePath}. Use overwrite option to replace.`);
      }

      await fs.writeFile(filePath, content, 'utf-8');
    }

    return filePath;
  }

  /**
   * Generate test file
   * @private
   */
  async _generateTestFile(hookRecommendation, analysisContext) {
    const template = this._getTestTemplate(hookRecommendation.type);
    const content = this._interpolateTemplate(template, hookRecommendation, analysisContext);
    
    const fileName = this._toKebabCase(hookRecommendation.name) + '.test.js';
    const filePath = path.join(this.options.outputDir, 'tests/hooks', fileName);

    if (!this.options.dryRun) {
      await this._ensureDirectory(path.dirname(filePath));
      
      if (existsSync(filePath) && !this.options.overwrite) {
        throw new Error(`File already exists: ${filePath}. Use overwrite option to replace.`);
      }

      await fs.writeFile(filePath, content, 'utf-8');
    }

    return filePath;
  }

  /**
   * Generate registration code snippet
   * @private
   */
  _generateRegistrationCode(hookRecommendation) {
    const importName = this._toCamelCase(hookRecommendation.name);
    const fileName = this._toKebabCase(hookRecommendation.name);
    
    return `// Import hook
import { ${importName} } from './${fileName}.js';

// Register hook
hookManager.register(
  HookTypes.${this._getHookTypeConstant(hookRecommendation.type)},
  ${importName},
  { priority: ${hookRecommendation.priority}, name: '${hookRecommendation.name}' }
);`;
  }

  /**
   * Generate documentation file
   * @private
   */
  async _generateDocumentation(hookRecommendation, analysisContext) {
    const template = this._getDocTemplate();
    const content = this._interpolateTemplate(template, hookRecommendation, analysisContext);
    
    const fileName = this._toKebabCase(hookRecommendation.name) + '.md';
    const filePath = path.join(this.options.outputDir, 'lib/hooks/docs', fileName);

    if (!this.options.dryRun) {
      await this._ensureDirectory(path.dirname(filePath));
      
      if (existsSync(filePath) && !this.options.overwrite) {
        throw new Error(`File already exists: ${filePath}. Use overwrite option to replace.`);
      }

      await fs.writeFile(filePath, content, 'utf-8');
    }

    return filePath;
  }

  /**
   * Get hook implementation template
   * @private
   */
  _getHookTemplate(hookType) {
    const templates = {
      [HookTypes.PRE_CONFIG_MODIFICATION]: this._getPreConfigModificationHookTemplate(),
      [HookTypes.USER_PROMPT_SUBMIT]: this._getUserPromptSubmitHookTemplate(),
      [HookTypes.POST_TOOL_USE]: this._getPostToolUseHookTemplate(),
      [HookTypes.PRE_PROJECT_SWITCH]: this._getPreProjectSwitchHookTemplate(),
      [HookTypes.POST_PROJECT_SWITCH]: this._getPostProjectSwitchHookTemplate()
    };

    return templates[hookType] || this._getGenericHookTemplate();
  }

  /**
   * Get test template
   * @private
   */
  _getTestTemplate(hookType) {
    // Use generic test template for all types
    return this._getGenericTestTemplate();
  }

  /**
   * Get documentation template
   * @private
   */
  _getDocTemplate() {
    return `# {{hookName}} Hook

**Type:** {{hookType}}  
**Priority:** {{priority}}  
**Confidence:** {{confidence}}%

## Purpose

{{reason}}

## Trigger Conditions

{{triggerConditions}}

## Context Requirements

{{contextRequirements}}

## Implementation Details

### File Operations
{{fileOperations}}

### External Integrations
{{externalIntegrations}}

### State Persistence
{{statePersistence}}

## Usage Example

\`\`\`javascript
import { {{hookFunctionName}} } from './{{hookFileName}}.js';

// Hook is automatically registered in lib/hooks/index.js
// See registration code for details
\`\`\`

## Testing

Run the test suite:
\`\`\`bash
npm test -- tests/hooks/{{hookFileName}}.test.js
\`\`\`

## Related Resources

- [Hook System Documentation](../README.md)
- [Hook Types Reference](../index.js)
- [Integration Checklist](../../.taskmaster/hooks/checklists/{{hookFileName}}-checklist.md)

---

**Generated:** {{timestamp}}  
**Generator:** Hook Artifact Generator v1.0.0
`;
  }

  /**
   * PRE_CONFIG_MODIFICATION hook template
   * @private
   */
  _getPreConfigModificationHookTemplate() {
    return `/**
 * {{hookName}} Hook
 * 
 * {{reason}}
 * 
 * @module hooks/{{hookFileName}}
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import os from 'os';

// Configuration
const BACKUP_DIR = path.join(os.homedir(), '.claude', 'backups');
const MAX_BACKUPS = 10;

/**
 * {{hookName}} Hook Handler
 * 
 * Triggers before configuration file modifications to create backups.
 * 
 * @param {Object} context - Hook context
 * @param {Function} next - Next middleware function
 * @returns {Promise<void>}
 */
export async function {{hookFunctionName}}(context, next) {
  try {
    // Ensure backup directory exists
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    
    // Get target files from context or defaults
    const targetFiles = context.targetFiles || {{targetFiles}};
    
    // Create backups
    for (const file of targetFiles) {
      if (existsSync(file)) {
        const timestamp = Math.floor(Date.now() / 1000);
        const backupPath = path.join(
          BACKUP_DIR,
          \`\${path.basename(file)}.backup.\${timestamp}\`
        );
        
        await fs.copyFile(file, backupPath);
        console.debug(\`✅ Created backup: \${backupPath}\`);
      }
    }
    
    // Prune old backups
    await pruneOldBackups();
    
  } catch (error) {
    // Log error but don't block operation
    console.error(\`⚠️  {{hookName}} error: \${error.message}\`);
  }
  
  // Continue to next hook
  await next();
}

/**
 * Prune old backups
 * @private
 */
async function pruneOldBackups() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backups = files.filter(f => f.includes('.backup.'));
    
    // Sort by timestamp (newest first)
    backups.sort((a, b) => {
      const timeA = parseInt(a.split('.').pop(), 10);
      const timeB = parseInt(b.split('.').pop(), 10);
      return timeB - timeA;
    });
    
    // Remove excess backups
    if (backups.length > MAX_BACKUPS) {
      const toRemove = backups.slice(MAX_BACKUPS);
      for (const file of toRemove) {
        await fs.unlink(path.join(BACKUP_DIR, file));
      }
    }
  } catch (error) {
    console.error(\`⚠️  Backup pruning error: \${error.message}\`);
  }
}

export default {{hookFunctionName}};
`;
  }

  /**
   * USER_PROMPT_SUBMIT hook template
   * @private
   */
  _getUserPromptSubmitHookTemplate() {
    return `/**
 * {{hookName}} Hook
 * 
 * {{reason}}
 * 
 * @module hooks/{{hookFileName}}
 * @version 1.0.0
 */

{{cacheImports}}

{{throttleConfig}}

/**
 * {{hookName}} Hook Handler
 * 
 * Triggers before user prompt is processed to analyze and enhance context.
 * 
 * @param {Object} context - Hook context
 * @param {string} context.prompt - User prompt text
 * @param {Function} next - Next middleware function
 * @returns {Promise<void>}
 */
export async function {{hookFunctionName}}(context, next) {
  try {
    // Get prompt from context
    const prompt = context.prompt || '';
    
    {{throttleCheck}}
    
    // Analyze prompt
    const analysis = analyzePrompt(prompt);
    
    // Add analysis to context
    context.{{contextKey}} = analysis;
    
    {{cacheUpdate}}
    
  } catch (error) {
    // Log error but don't block execution
    console.error(\`⚠️  {{hookName}} error: \${error.message}\`);
  }
  
  // Continue to next hook
  await next();
}

/**
 * Analyze prompt text
 * @private
 * @param {string} prompt - Prompt text
 * @returns {Object} Analysis result
 */
function analyzePrompt(prompt) {
  // TODO: Implement analysis logic based on requirements
  return {
    analyzed: true,
    timestamp: Date.now(),
    patterns: []
  };
}

export default {{hookFunctionName}};
`;
  }

  /**
   * POST_TOOL_USE hook template
   * @private
   */
  _getPostToolUseHookTemplate() {
    return `/**
 * {{hookName}} Hook
 * 
 * {{reason}}
 * 
 * @module hooks/{{hookFileName}}
 * @version 1.0.0
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';

// File tracking
const fileTimestamps = new Map();
let lastCheck = 0;

// Configuration
const CHECK_INTERVAL = 1000; // 1 second
const MONITORED_FILES = {{monitoredFiles}};

/**
 * {{hookName}} Hook Handler
 * 
 * Triggers after tool execution to monitor file changes.
 * 
 * @param {Object} context - Hook context
 * @param {Object} [context.tool] - Tool information
 * @param {Function} next - Next middleware function
 * @returns {Promise<void>}
 */
export async function {{hookFunctionName}}(context, next) {
  try {
    // Throttle checks
    const now = Date.now();
    if (now - lastCheck < CHECK_INTERVAL) {
      await next();
      return;
    }
    lastCheck = now;
    
    // Initialize timestamps on first run
    if (fileTimestamps.size === 0) {
      await initializeTimestamps();
      await next();
      return;
    }
    
    // Check for file changes
    const changes = await detectChanges();
    
    if (changes.length > 0) {
      console.log(\`📦 {{hookName}}: Detected changes in \${changes.length} file(s)\`);
      
      // Handle changes
      await handleChanges(changes, context);
    }
    
  } catch (error) {
    // Log error but don't block execution
    console.error(\`⚠️  {{hookName}} error: \${error.message}\`);
  }
  
  // Continue to next hook
  await next();
}

/**
 * Initialize file timestamps
 * @private
 */
async function initializeTimestamps() {
  for (const file of MONITORED_FILES) {
    if (existsSync(file)) {
      const stats = await fs.stat(file);
      fileTimestamps.set(file, stats.mtimeMs);
    }
  }
}

/**
 * Detect file changes
 * @private
 * @returns {Promise<string[]>} Changed files
 */
async function detectChanges() {
  const changes = [];
  
  for (const file of MONITORED_FILES) {
    if (!existsSync(file)) continue;
    
    const stats = await fs.stat(file);
    const lastModified = fileTimestamps.get(file) || 0;
    
    if (stats.mtimeMs > lastModified) {
      changes.push(file);
      fileTimestamps.set(file, stats.mtimeMs);
    }
  }
  
  return changes;
}

/**
 * Handle detected changes
 * @private
 * @param {string[]} changes - Changed files
 * @param {Object} context - Hook context
 */
async function handleChanges(changes, context) {
  // TODO: Implement change handling logic
  // Examples:
  // - Reload configuration
  // - Clear caches
  // - Log to external system
  // - Notify user
}

/**
 * Clear tracked timestamps
 * Useful for testing or forcing fresh check
 */
export function clearTimestamps() {
  fileTimestamps.clear();
  lastCheck = 0;
}

export default {{hookFunctionName}};
`;
  }

  /**
   * PRE_PROJECT_SWITCH hook template
   * @private
   */
  _getPreProjectSwitchHookTemplate() {
    return `/**
 * {{hookName}} Hook
 * 
 * {{reason}}
 * 
 * @module hooks/{{hookFileName}}
 * @version 1.0.0
 */

/**
 * {{hookName}} Hook Handler
 * 
 * Triggers before project context switch to clean up state.
 * 
 * @param {Object} context - Hook context
 * @param {string} context.currentProject - Current project name
 * @param {string} context.targetProject - Target project name
 * @param {Function} next - Next middleware function
 * @returns {Promise<void>}
 */
export async function {{hookFunctionName}}(context, next) {
  try {
    const { currentProject, targetProject } = context;
    
    console.log(\`🔄 {{hookName}}: Switching from \${currentProject} to \${targetProject}\`);
    
    // Clean up project-specific state
    await cleanupProjectState(currentProject);
    
    // Save any state that needs to persist
    await saveProjectState(currentProject);
    
  } catch (error) {
    // Log error but don't block switch
    console.error(\`⚠️  {{hookName}} error: \${error.message}\`);
  }
  
  // Continue to next hook
  await next();
}

/**
 * Clean up project-specific state
 * @private
 * @param {string} projectName - Project name
 */
async function cleanupProjectState(projectName) {
  // TODO: Implement cleanup logic
  // Examples:
  // - Clear caches
  // - Close connections
  // - Release resources
}

/**
 * Save project state
 * @private
 * @param {string} projectName - Project name
 */
async function saveProjectState(projectName) {
  // TODO: Implement state persistence
  // Examples:
  // - Save to disk
  // - Update config
  // - Log to history
}

export default {{hookFunctionName}};
`;
  }

  /**
   * POST_PROJECT_SWITCH hook template
   * @private
   */
  _getPostProjectSwitchHookTemplate() {
    return `/**
 * {{hookName}} Hook
 * 
 * {{reason}}
 * 
 * @module hooks/{{hookFileName}}
 * @version 1.0.0
 */

/**
 * {{hookName}} Hook Handler
 * 
 * Triggers after project context switch to initialize state.
 * 
 * @param {Object} context - Hook context
 * @param {string} context.project - New project name
 * @param {Function} next - Next middleware function
 * @returns {Promise<void>}
 */
export async function {{hookFunctionName}}(context, next) {
  try {
    const { project } = context;
    
    console.log(\`✅ {{hookName}}: Initializing project \${project}\`);
    
    // Initialize project-specific state
    await initializeProjectState(project);
    
    // Load any cached state
    await loadProjectState(project);
    
  } catch (error) {
    // Log error but don't block execution
    console.error(\`⚠️  {{hookName}} error: \${error.message}\`);
  }
  
  // Continue to next hook
  await next();
}

/**
 * Initialize project state
 * @private
 * @param {string} projectName - Project name
 */
async function initializeProjectState(projectName) {
  // TODO: Implement initialization logic
  // Examples:
  // - Initialize caches
  // - Set up connections
  // - Load configuration
}

/**
 * Load project state
 * @private
 * @param {string} projectName - Project name
 */
async function loadProjectState(projectName) {
  // TODO: Implement state loading
  // Examples:
  // - Load from disk
  // - Restore caches
  // - Apply saved settings
}

export default {{hookFunctionName}};
`;
  }

  /**
   * Generic hook template (fallback)
   * @private
   */
  _getGenericHookTemplate() {
    return `/**
 * {{hookName}} Hook
 * 
 * {{reason}}
 * 
 * @module hooks/{{hookFileName}}
 * @version 1.0.0
 */

/**
 * {{hookName}} Hook Handler
 * 
 * @param {Object} context - Hook context
 * @param {Function} next - Next middleware function
 * @returns {Promise<void>}
 */
export async function {{hookFunctionName}}(context, next) {
  try {
    // TODO: Implement hook logic based on requirements
    
    console.debug('{{hookName}} hook executed');
    
  } catch (error) {
    console.error(\`⚠️  {{hookName}} error: \${error.message}\`);
  }
  
  // Continue to next hook
  await next();
}

export default {{hookFunctionName}};
`;
  }

  /**
   * Generic test template
   * @private
   */
  _getGenericTestTemplate() {
    return `/**
 * {{hookName}} Hook Tests
 * 
 * @module tests/hooks/{{hookFileName}}
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { {{hookFunctionName}} } from '../../lib/hooks/{{hookFileName}}.js';

describe('{{hookName}} Hook', () => {
  let context;
  let nextFn;

  beforeEach(() => {
    context = {};
    nextFn = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should be defined', () => {
      expect({{hookFunctionName}}).toBeDefined();
      expect(typeof {{hookFunctionName}}).toBe('function');
    });

    it('should be async', () => {
      const result = {{hookFunctionName}}(context, nextFn);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should call next() to continue chain', async () => {
      await {{hookFunctionName}}(context, nextFn);
      expect(nextFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Force an error
      nextFn.mockRejectedValue(new Error('Test error'));
      
      // Should not throw
      await expect(
        {{hookFunctionName}}(context, nextFn)
      ).resolves.not.toThrow();
    });

    it('should call next() even after error', async () => {
      await {{hookFunctionName}}(context, nextFn);
      expect(nextFn).toHaveBeenCalled();
    });
  });

  describe('Context Handling', () => {
    it('should handle empty context', async () => {
      await expect(
        {{hookFunctionName}}({}, nextFn)
      ).resolves.not.toThrow();
    });

    it('should not mutate context unexpectedly', async () => {
      const originalContext = { ...context };
      await {{hookFunctionName}}(context, nextFn);
      
      // Context should only have expected additions
      // TODO: Add specific context checks based on implementation
    });
  });

  // TODO: Add implementation-specific tests based on hook requirements
  describe('Hook-Specific Behavior', () => {
    it.todo('should implement required functionality');
    it.todo('should meet performance requirements');
    it.todo('should integrate with other hooks correctly');
  });
});
`;
  }

  /**
   * Interpolate template with values
   * @private
   */
  _interpolateTemplate(template, hookRecommendation, analysisContext) {
    const values = this._getTemplateValues(hookRecommendation, analysisContext);
    
    let result = template;
    for (const [key, value] of Object.entries(values)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, value);
    }
    
    return result;
  }

  /**
   * Get template interpolation values
   * @private
   */
  _getTemplateValues(hookRecommendation, analysisContext) {
    const values = {
      hookName: hookRecommendation.name,
      hookType: hookRecommendation.type,
      hookFileName: this._toKebabCase(hookRecommendation.name),
      hookFunctionName: this._toCamelCase(hookRecommendation.name),
      priority: hookRecommendation.priority.toString(),
      confidence: (hookRecommendation.confidence * 100).toFixed(0),
      reason: hookRecommendation.reason,
      timestamp: new Date().toISOString(),
      contextKey: this._toCamelCase(hookRecommendation.name) + 'Data'
    };

    // Add context-specific values
    if (analysisContext.fileOperations) {
      values.targetFiles = JSON.stringify(
        analysisContext.fileOperations.writes || ['~/.claude/config.json']
      );
      values.monitoredFiles = JSON.stringify(
        analysisContext.fileOperations.monitors || []
      );
      values.fileOperations = this._formatFileOperations(analysisContext.fileOperations);
    } else {
      values.targetFiles = '["~/.claude/config.json"]';
      values.monitoredFiles = '[]';
      values.fileOperations = 'None specified';
    }

    if (analysisContext.externalIntegrations) {
      values.externalIntegrations = this._formatExternalIntegrations(
        analysisContext.externalIntegrations
      );
    } else {
      values.externalIntegrations = 'None specified';
    }

    if (analysisContext.statePersistence) {
      values.statePersistence = this._formatStatePersistence(
        analysisContext.statePersistence
      );
      
      // Add conditional template sections
      if (analysisContext.statePersistence.requiresCaching) {
        values.cacheImports = '// Cache management\nconst cache = new Map();\nconst CACHE_TTL = 60000; // 1 minute';
        values.cacheUpdate = '// Update cache\n    cache.set(prompt, analysis);';
      } else {
        values.cacheImports = '';
        values.cacheUpdate = '';
      }

      if (analysisContext.statePersistence.requiresThrottling) {
        values.throttleConfig = 'let lastCheck = 0;\nconst MIN_INTERVAL = 1000; // 1 second';
        values.throttleCheck = 'const now = Date.now();\n    if (now - lastCheck < MIN_INTERVAL) {\n      await next();\n      return;\n    }\n    lastCheck = now;';
      } else {
        values.throttleConfig = '';
        values.throttleCheck = '';
      }
    } else {
      values.statePersistence = 'None specified';
      values.cacheImports = '';
      values.cacheUpdate = '';
      values.throttleConfig = '';
      values.throttleCheck = '';
    }

    // Add trigger conditions
    values.triggerConditions = this._getTriggerConditions(hookRecommendation.type);
    values.contextRequirements = this._getContextRequirements(analysisContext);

    return values;
  }

  /**
   * Format file operations for documentation
   * @private
   */
  _formatFileOperations(fileOps) {
    const lines = [];
    if (fileOps.reads && fileOps.reads.length > 0) {
      lines.push(`- Reads: ${fileOps.reads.join(', ')}`);
    }
    if (fileOps.writes && fileOps.writes.length > 0) {
      lines.push(`- Writes: ${fileOps.writes.join(', ')}`);
    }
    if (fileOps.monitors && fileOps.monitors.length > 0) {
      lines.push(`- Monitors: ${fileOps.monitors.join(', ')}`);
    }
    return lines.length > 0 ? lines.join('\n') : 'None specified';
  }

  /**
   * Format external integrations for documentation
   * @private
   */
  _formatExternalIntegrations(integrations) {
    const lines = [];
    if (integrations.systems && integrations.systems.length > 0) {
      lines.push(`- Systems: ${integrations.systems.join(', ')}`);
    }
    if (integrations.logsToExternal) {
      lines.push('- Logs to external systems');
    }
    return lines.length > 0 ? lines.join('\n') : 'None specified';
  }

  /**
   * Format state persistence for documentation
   * @private
   */
  _formatStatePersistence(persistence) {
    const lines = [];
    if (persistence.requiresCaching) lines.push('- Requires caching');
    if (persistence.requiresTimestamps) lines.push('- Requires timestamps');
    if (persistence.requiresHistory) lines.push('- Requires history');
    if (persistence.requiresThrottling) lines.push('- Requires throttling');
    return lines.length > 0 ? lines.join('\n') : 'None specified';
  }

  /**
   * Get trigger conditions for hook type
   * @private
   */
  _getTriggerConditions(hookType) {
    const conditions = {
      [HookTypes.PRE_CONFIG_MODIFICATION]: 'Before configuration file modifications',
      [HookTypes.USER_PROMPT_SUBMIT]: 'Before user prompt processing',
      [HookTypes.POST_TOOL_USE]: 'After tool execution',
      [HookTypes.PRE_PROJECT_SWITCH]: 'Before project context switch',
      [HookTypes.POST_PROJECT_SWITCH]: 'After project context switch'
    };
    return conditions[hookType] || 'Unknown';
  }

  /**
   * Get context requirements
   * @private
   */
  _getContextRequirements(analysisContext) {
    const reqs = [];
    
    if (analysisContext.fileOperations) {
      if (analysisContext.fileOperations.writes && analysisContext.fileOperations.writes.length > 0) {
        reqs.push('Write access to specified files');
      }
      if (analysisContext.fileOperations.reads && analysisContext.fileOperations.reads.length > 0) {
        reqs.push('Read access to specified files');
      }
    }
    
    if (analysisContext.externalIntegrations && analysisContext.externalIntegrations.systems) {
      reqs.push(`External system access: ${analysisContext.externalIntegrations.systems.join(', ')}`);
    }
    
    return reqs.length > 0 ? reqs.join('; ') : 'No special requirements';
  }

  /**
   * Get hook type constant name
   * @private
   */
  _getHookTypeConstant(hookType) {
    const constants = {
      'preConfigModification': 'PRE_CONFIG_MODIFICATION',
      'userPromptSubmit': 'USER_PROMPT_SUBMIT',
      'postToolUse': 'POST_TOOL_USE',
      'preProjectSwitch': 'PRE_PROJECT_SWITCH',
      'postProjectSwitch': 'POST_PROJECT_SWITCH'
    };
    return constants[hookType] || hookType.toUpperCase();
  }

  /**
   * Convert string to kebab-case
   * @private
   */
  _toKebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  /**
   * Convert string to camelCase
   * @private
   */
  _toCamelCase(str) {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) =>
        index === 0 ? letter.toLowerCase() : letter.toUpperCase()
      )
      .replace(/\s+/g, '');
  }

  /**
   * Ensure directory exists
   * @private
   */
  async _ensureDirectory(dirPath) {
    if (!existsSync(dirPath)) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}

/**
 * Convenience function for generating artifacts
 * 
 * @param {Object} hookRecommendation - Hook recommendation
 * @param {Object} [analysisContext] - Analysis context
 * @param {Object} [options] - Generation options
 * @returns {Promise<GenerationResult>} Generation result
 */
export async function generateHookArtifacts(hookRecommendation, analysisContext, options) {
  const generator = new HookArtifactGenerator(options);
  return generator.generate(hookRecommendation, analysisContext);
}

export default HookArtifactGenerator;

