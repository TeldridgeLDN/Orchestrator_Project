/**
 * Scenario Metadata Manager
 * 
 * Manages scenario metadata in ~/.claude/config.json
 * Tracks available vs scaffolded scenarios, timestamps, and generated components
 * 
 * @module utils/scenario-metadata
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { parseScenarioFile, extractScenarioMetadata, getGenerationTargets } from './scenario-parser.js';
import { getScenariosDir, scenariosDirectoryExists } from './scenario-directory.js';

/**
 * Get config.json path
 * 
 * @returns {string} Path to config.json
 */
export function getConfigPath() {
  return path.join(os.homedir(), '.claude', 'config.json');
}

/**
 * Load config.json
 * 
 * @returns {Promise<Object>} Config object
 */
export async function loadConfig() {
  const configPath = getConfigPath();
  
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Config doesn't exist, return default
      return getDefaultConfig();
    }
    throw error;
  }
}

/**
 * Save config.json
 * 
 * @param {Object} config - Config object to save
 * @returns {Promise<void>}
 */
export async function saveConfig(config) {
  const configPath = getConfigPath();
  const configDir = path.dirname(configPath);
  
  // Ensure directory exists
  await fs.mkdir(configDir, { recursive: true });
  
  // Update timestamp
  config.last_modified = new Date().toISOString();
  
  // Write atomically (write to temp, then rename)
  const tempPath = `${configPath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(config, null, 2));
  await fs.rename(tempPath, configPath);
}

/**
 * Get default config structure
 * 
 * @returns {Object} Default config
 */
export function getDefaultConfig() {
  return {
    "$schema": "https://claude.ai/schemas/orchestrator-config-v1.json",
    "version": "1.0.0",
    "description": "Orchestrator global configuration with scenario metadata tracking",
    "created": new Date().toISOString(),
    "last_modified": new Date().toISOString(),
    "scenarios": {
      "available": {},
      "scaffolded": {},
      "metadata_version": "1.0.0"
    },
    "settings": {
      "auto_track_scenarios": true,
      "validate_on_load": true,
      "cache_validation_results": true,
      "sync_with_filesystem": true
    },
    "paths": {
      "scenarios_dir": "~/.claude/scenarios",
      "skills_dir": "~/.claude/skills",
      "commands_dir": "~/.claude/commands",
      "hooks_dir": "~/.claude/hooks"
    },
    "statistics": {
      "total_scenarios": 0,
      "scaffolded_count": 0,
      "available_count": 0,
      "last_scaffolded": null
    }
  };
}

/**
 * Sync filesystem scenarios with config metadata
 * Scans ~/.claude/scenarios/ and updates config
 * 
 * @returns {Promise<Object>} Sync result
 */
export async function syncScenariosWithFilesystem() {
  if (!scenariosDirectoryExists()) {
    return {
      success: false,
      message: 'Scenarios directory does not exist',
      scenarios_found: 0
    };
  }

  const config = await loadConfig();
  const scenariosDir = getScenariosDir();
  const files = await fs.readdir(scenariosDir);
  const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  const syncedScenarios = [];
  const errors = [];

  for (const file of yamlFiles) {
    const scenarioPath = path.join(scenariosDir, file);
    const scenarioName = path.basename(file, path.extname(file));

    try {
      // Parse scenario to get metadata
      const parseResult = await parseScenarioFile(scenarioPath);
      
      if (!parseResult.success) {
        errors.push({
          file,
          error: 'Validation failed',
          details: parseResult.validation.errors
        });
        continue;
      }

      const metadata = extractScenarioMetadata(parseResult.data);
      const targets = getGenerationTargets(parseResult.data);

      // Check if already tracked
      if (!config.scenarios.available[scenarioName] && !config.scenarios.scaffolded[scenarioName]) {
        // Add to available
        config.scenarios.available[scenarioName] = {
          path: scenarioPath,
          created: new Date().toISOString(),
          modified: (await fs.stat(scenarioPath)).mtime.toISOString(),
          description: metadata.description,
          category: metadata.category,
          components: {
            skills: targets.skills,
            commands: targets.commands,
            hooks: targets.hooks
          },
          status: "not_scaffolded",
          validation: {
            last_checked: new Date().toISOString(),
            valid: true,
            warnings: []
          }
        };

        syncedScenarios.push(scenarioName);
      }
    } catch (error) {
      errors.push({
        file,
        error: error.message
      });
    }
  }

  // Update statistics
  config.statistics.available_count = Object.keys(config.scenarios.available).length;
  config.statistics.scaffolded_count = Object.keys(config.scenarios.scaffolded).length;
  config.statistics.total_scenarios = config.statistics.available_count + config.statistics.scaffolded_count;

  await saveConfig(config);

  return {
    success: true,
    scenarios_found: yamlFiles.length,
    synced: syncedScenarios.length,
    synced_scenarios: syncedScenarios,
    errors
  };
}

/**
 * Register a scaffolded scenario
 * Moves from available to scaffolded
 * 
 * @param {string} scenarioName - Name of scenario
 * @param {Object} scaffoldResult - Result from scaffold workflow
 * @returns {Promise<void>}
 */
export async function registerScaffoldedScenario(scenarioName, scaffoldResult) {
  const config = await loadConfig();

  // Get scenario from available
  const availableScenario = config.scenarios.available[scenarioName];
  
  if (!availableScenario) {
    throw new Error(`Scenario '${scenarioName}' not found in available scenarios`);
  }

  // Move to scaffolded
  config.scenarios.scaffolded[scenarioName] = {
    ...availableScenario,
    status: "scaffolded",
    scaffolded_at: new Date().toISOString(),
    generated_files: scaffoldResult.filesCreated,
    session_id: scaffoldResult.sessionId,
    last_used: new Date().toISOString()
  };

  // Remove from available
  delete config.scenarios.available[scenarioName];

  // Update statistics
  config.statistics.scaffolded_count = Object.keys(config.scenarios.scaffolded).length;
  config.statistics.available_count = Object.keys(config.scenarios.available).length;
  config.statistics.last_scaffolded = new Date().toISOString();

  await saveConfig(config);
}

/**
 * Update last used timestamp for a scaffolded scenario
 * 
 * @param {string} scenarioName - Name of scenario
 * @returns {Promise<void>}
 */
export async function touchScenario(scenarioName) {
  const config = await loadConfig();

  if (config.scenarios.scaffolded[scenarioName]) {
    config.scenarios.scaffolded[scenarioName].last_used = new Date().toISOString();
    await saveConfig(config);
  }
}

/**
 * Get all available scenarios
 * 
 * @returns {Promise<Object>} Available scenarios
 */
export async function getAvailableScenarios() {
  const config = await loadConfig();
  return config.scenarios.available;
}

/**
 * Get all scaffolded scenarios
 * 
 * @returns {Promise<Object>} Scaffolded scenarios
 */
export async function getScaffoldedScenarios() {
  const config = await loadConfig();
  return config.scenarios.scaffolded;
}

/**
 * Get scenario metadata (from available or scaffolded)
 * 
 * @param {string} scenarioName - Name of scenario
 * @returns {Promise<Object|null>} Scenario metadata or null
 */
export async function getScenarioMetadata(scenarioName) {
  const config = await loadConfig();
  
  return config.scenarios.available[scenarioName] || 
         config.scenarios.scaffolded[scenarioName] || 
         null;
}

/**
 * Check if scenario is scaffolded
 * 
 * @param {string} scenarioName - Name of scenario
 * @returns {Promise<boolean>} True if scaffolded
 */
export async function isScenarioScaffolded(scenarioName) {
  const config = await loadConfig();
  return !!config.scenarios.scaffolded[scenarioName];
}

/**
 * Get scenario statistics
 * 
 * @returns {Promise<Object>} Statistics object
 */
export async function getScenarioStatistics() {
  const config = await loadConfig();
  return config.statistics;
}

/**
 * Remove scenario from metadata
 * 
 * @param {string} scenarioName - Name of scenario
 * @returns {Promise<boolean>} True if removed
 */
export async function removeScenarioMetadata(scenarioName) {
  const config = await loadConfig();
  
  let removed = false;
  
  if (config.scenarios.available[scenarioName]) {
    delete config.scenarios.available[scenarioName];
    removed = true;
  }
  
  if (config.scenarios.scaffolded[scenarioName]) {
    delete config.scenarios.scaffolded[scenarioName];
    removed = true;
  }

  if (removed) {
    // Update statistics
    config.statistics.scaffolded_count = Object.keys(config.scenarios.scaffolded).length;
    config.statistics.available_count = Object.keys(config.scenarios.available).length;
    config.statistics.total_scenarios = config.statistics.available_count + config.statistics.scaffolded_count;
    
    await saveConfig(config);
  }

  return removed;
}

/**
 * Validate metadata consistency
 * Checks if tracked scenarios still exist on filesystem
 * 
 * @returns {Promise<Object>} Validation result
 */
export async function validateMetadataConsistency() {
  const config = await loadConfig();
  const issues = [];

  // Check available scenarios
  for (const [name, scenario] of Object.entries(config.scenarios.available)) {
    try {
      await fs.access(scenario.path);
    } catch {
      issues.push({
        type: 'missing_file',
        scenario: name,
        expected_path: scenario.path,
        category: 'available'
      });
    }
  }

  // Check scaffolded scenarios - verify generated files exist
  for (const [name, scenario] of Object.entries(config.scenarios.scaffolded)) {
    for (const file of scenario.generated_files || []) {
      try {
        await fs.access(file);
      } catch {
        issues.push({
          type: 'missing_generated_file',
          scenario: name,
          expected_file: file,
          category: 'scaffolded'
        });
      }
    }
  }

  return {
    consistent: issues.length === 0,
    issues_count: issues.length,
    issues
  };
}

export default {
  getConfigPath,
  loadConfig,
  saveConfig,
  getDefaultConfig,
  syncScenariosWithFilesystem,
  registerScaffoldedScenario,
  touchScenario,
  getAvailableScenarios,
  getScaffoldedScenarios,
  getScenarioMetadata,
  isScenarioScaffolded,
  getScenarioStatistics,
  removeScenarioMetadata,
  validateMetadataConsistency
};

