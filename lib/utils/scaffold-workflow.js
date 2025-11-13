/**
 * Scaffold Workflow Module
 * 
 * Main orchestration workflow for scenario compilation.
 * Coordinates parsing, template rendering, file generation, and rollback.
 * 
 * @module utils/scaffold-workflow
 */

import path from 'path';
import fs from 'fs/promises';
import { parseScenarioFile, getGenerationTargets, extractScenarioMetadata } from './scenario-parser.js';
import { generateSkillMd, generateSkillMetadata } from '../templates/scaffold/skill-template.js';
import { generateCommandMd } from '../templates/scaffold/command-template.js';
import { generateHookScript, generateHookMetadata } from '../templates/scaffold/hook-template.js';
import { generateMcpConfig, generateMcpDocumentation } from '../templates/scaffold/mcp-template.js';
import { writeFileSafe, writeFilesBatch, getClaudePaths } from './file-generator.js';
import { RollbackManager } from './rollback-manager.js';
import { registerScaffoldedScenario, syncScenariosWithFilesystem } from './scenario-metadata.js';

/**
 * Scaffold options
 * 
 * @typedef {Object} ScaffoldOptions
 * @property {boolean} dryRun - Preview without writing files
 * @property {boolean} overwrite - Allow overwriting existing files
 * @property {boolean} backup - Create backups before overwriting
 * @property {boolean} skipMcp - Skip MCP configuration generation
 * @property {string} claudeHome - Override Claude home directory
 */

/**
 * Scaffold result
 * 
 * @typedef {Object} ScaffoldResult
 * @property {boolean} success - Whether scaffolding succeeded
 * @property {Object} metadata - Scenario metadata
 * @property {Object} targets - Generation targets
 * @property {Array} filesCreated - List of created files
 * @property {Array} filesUpdated - List of updated files
 * @property {Array} filesSkipped - List of skipped files
 * @property {Array} errors - List of errors
 * @property {string} sessionId - Rollback session ID
 * @property {boolean} rolledBack - Whether rollback was performed
 */

/**
 * Main scaffold workflow
 * 
 * @param {string} scenarioPath - Path to scenario YAML file
 * @param {ScaffoldOptions} options - Scaffold options
 * @returns {Promise<ScaffoldResult>} Scaffold result
 */
export async function scaffoldScenario(scenarioPath, options = {}) {
  const opts = {
    dryRun: false,
    overwrite: false,
    backup: true,
    skipMcp: false,
    claudeHome: null,
    ...options
  };

  const result = {
    success: false,
    metadata: null,
    targets: null,
    filesCreated: [],
    filesUpdated: [],
    filesSkipped: [],
    errors: [],
    sessionId: null,
    rolledBack: false
  };

  // Initialize rollback manager
  const rollbackManager = new RollbackManager();
  const session = rollbackManager.startSession();
  result.sessionId = session.id;

  try {
    // Phase 1: Parse and validate scenario
    console.log('📄 Parsing scenario...');
    const parseResult = await parseScenarioFile(scenarioPath);
    
    if (!parseResult.success) {
      result.errors.push({
        phase: 'parse',
        message: 'Scenario validation failed',
        details: parseResult.validation.errors
      });
      throw new Error('Scenario validation failed');
    }

    const scenarioData = parseResult.data.scenario;
    result.metadata = extractScenarioMetadata(parseResult.data);
    result.targets = getGenerationTargets(parseResult.data);

    console.log(`✅ Scenario validated: ${scenarioData.name}`);

    // Phase 2: Generate content from templates
    console.log('🎨 Generating content from templates...');
    const generatedContent = await generateContent(scenarioData, result.targets);
    console.log(`✅ Generated ${generatedContent.length} files`);

    // Phase 3: Determine file paths
    const claudePaths = getClaudePaths();
    if (opts.claudeHome) {
      claudePaths.home = opts.claudeHome;
      // Update derived paths
      claudePaths.skills = path.join(opts.claudeHome, 'skills');
      claudePaths.agents = path.join(opts.claudeHome, 'agents');
      claudePaths.commands = path.join(opts.claudeHome, 'commands');
      claudePaths.hooks = path.join(opts.claudeHome, 'hooks');
    }

    const filesToWrite = mapContentToFiles(generatedContent, claudePaths, scenarioData.name);

    // Phase 4: Write files with rollback tracking
    console.log('💾 Writing files...');
    
    for (const file of filesToWrite) {
      const writeResult = await writeFileSafe(file.path, file.content, {
        overwrite: opts.overwrite,
        backup: opts.backup,
        dryRun: opts.dryRun,
        mode: file.mode
      });

      // Track operation for rollback
      if (!opts.dryRun) {
        if (writeResult.operation === 'created') {
          session.recordCreate(file.path);
          result.filesCreated.push(file.path);
        } else if (writeResult.operation === 'updated') {
          session.recordUpdate(file.path, writeResult.backup);
          result.filesUpdated.push(file.path);
        } else if (writeResult.operation === 'skipped') {
          result.filesSkipped.push(file.path);
        }
      }

      if (!writeResult.success && writeResult.operation !== 'skipped') {
        result.errors.push({
          phase: 'write',
          file: file.path,
          message: writeResult.error?.message || 'Write failed'
        });
        throw new Error(`Failed to write ${file.path}`);
      }
    }

    console.log(`✅ Files written: ${result.filesCreated.length} created, ${result.filesUpdated.length} updated, ${result.filesSkipped.length} skipped`);

    // Phase 5: Generate MCP configuration (if applicable and has MCP dependencies)
    const hasMcpDeps = scenarioData.dependencies?.mcps && scenarioData.dependencies.mcps.length > 0;
    
    if (!opts.skipMcp && hasMcpDeps) {
      console.log('⚙️  Generating MCP configuration...');
      
      const mcpConfig = generateMcpConfig({ scenario: scenarioData });
      const mcpDocs = generateMcpDocumentation({ scenario: scenarioData });
      
      // Add to result for user to manually merge
      result.mcpConfig = mcpConfig;
      result.mcpDocs = mcpDocs;
      
      console.log(`✅ MCP configuration generated (manual merge required)`);
    }

    // Success - commit session
    rollbackManager.commit();
    result.success = true;

    // Update metadata tracking
    try {
      // Ensure scenario is synced to config first
      await syncScenariosWithFilesystem();
      
      // Register as scaffolded
      await registerScaffoldedScenario(scenarioName, {
        filesCreated: result.filesCreated,
        sessionId: result.sessionId
      });
    } catch (metadataError) {
      console.warn('⚠️  Warning: Failed to update scenario metadata:', metadataError.message);
      // Don't fail the whole operation if metadata update fails
    }

    return result;

  } catch (error) {
    // Failure - rollback all operations
    console.error(`❌ Scaffolding failed: ${error.message}`);
    
    if (!opts.dryRun) {
      console.log('🔄 Rolling back changes...');
      const rollbackResult = await rollbackManager.rollback(session);
      
      result.rolledBack = true;
      
      if (rollbackResult.success) {
        console.log('✅ Rollback completed successfully');
      } else {
        console.error(`⚠️  Rollback completed with ${rollbackResult.errors.length} error(s)`);
        result.errors.push({
          phase: 'rollback',
          message: 'Partial rollback failure',
          details: rollbackResult.errors
        });
      }
    }

    throw error;
  }
}

/**
 * Generate content from templates
 * 
 * @private
 * @param {Object} scenario - Scenario data
 * @param {Object} targets - Generation targets
 * @returns {Promise<Array>} Generated content items
 */
async function generateContent(scenario, targets) {
  const content = [];

  // Generate skills
  for (const skillName of targets.skills) {
    content.push({
      type: 'skill',
      name: skillName,
      files: {
        markdown: generateSkillMd({ scenario, skillName }),
        metadata: generateSkillMetadata({ scenario, skillName })
      }
    });
  }

  // Generate commands
  for (const commandName of targets.commands) {
    content.push({
      type: 'command',
      name: commandName,
      files: {
        markdown: generateCommandMd({ scenario, commandName })
      }
    });
  }

  // Generate hooks
  for (const hookName of targets.hooks) {
    content.push({
      type: 'hook',
      name: hookName,
      files: {
        script: generateHookScript({ scenario, hookName }),
        metadata: generateHookMetadata({ scenario, hookName })
      }
    });
  }

  return content;
}

/**
 * Map generated content to file paths
 * 
 * @private
 * @param {Array} content - Generated content
 * @param {Object} claudePaths - Claude directory paths
 * @param {string} scenarioName - Scenario name
 * @returns {Array} Files with paths and content
 */
function mapContentToFiles(content, claudePaths, scenarioName) {
  const files = [];

  for (const item of content) {
    switch (item.type) {
      case 'skill':
        const skillDir = path.join(claudePaths.skills, item.name);
        files.push({
          path: path.join(skillDir, 'SKILL.md'),
          content: item.files.markdown,
          mode: null
        });
        files.push({
          path: path.join(skillDir, 'metadata.json'),
          content: item.files.metadata,
          mode: null
        });
        break;

      case 'command':
        const commandFile = item.name.replace(/^\//, '') + '.md';
        files.push({
          path: path.join(claudePaths.commands, commandFile),
          content: item.files.markdown,
          mode: null
        });
        break;

      case 'hook':
        files.push({
          path: path.join(claudePaths.hooks, `${item.name}.js`),
          content: item.files.script,
          mode: 0o755 // Executable
        });
        files.push({
          path: path.join(claudePaths.hooks, `${item.name}.json`),
          content: item.files.metadata,
          mode: null
        });
        break;
    }
  }

  return files;
}

/**
 * Validate scenario file before scaffolding
 * 
 * @param {string} scenarioPath - Path to scenario YAML
 * @returns {Promise<Object>} Validation result
 */
export async function validateBeforeScaffold(scenarioPath) {
  const parseResult = await parseScenarioFile(scenarioPath);
  
  return {
    valid: parseResult.success,
    errors: parseResult.validation.errors,
    metadata: parseResult.success ? extractScenarioMetadata(parseResult.data) : null,
    targets: parseResult.success ? getGenerationTargets(parseResult.data) : null
  };
}

/**
 * Preview what would be scaffolded
 * 
 * @param {string} scenarioPath - Path to scenario YAML
 * @returns {Promise<Object>} Preview result
 */
export async function previewScaffold(scenarioPath) {
  return await scaffoldScenario(scenarioPath, { dryRun: true });
}

export default {
  scaffoldScenario,
  validateBeforeScaffold,
  previewScaffold
};

