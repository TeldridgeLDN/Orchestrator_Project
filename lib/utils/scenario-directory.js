/**
 * Scenario Directory Management Utility
 * 
 * Handles creation and management of the scenario layer directory structure
 * for the Partnership-Enabled Scenario System.
 * 
 * Location: ~/.claude/scenarios/
 * 
 * Structure:
 * ~/.claude/
 * ├── scenarios/
 * │   ├── examples/           # Example scenarios
 * │   ├── templates/          # Scenario templates
 * │   └── user/              # User-created scenarios
 * 
 * @module scenario-directory
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import os from 'os';

/**
 * Get the base Claude directory path
 * @returns {string} Path to ~/.claude/
 */
export function getClaudeDir() {
  return path.join(os.homedir(), '.claude');
}

/**
 * Get the scenarios directory path
 * @returns {string} Path to ~/.claude/scenarios/
 */
export function getScenariosDir() {
  return path.join(getClaudeDir(), 'scenarios');
}

/**
 * Get the path to a subdirectory within scenarios
 * @param {string} subdir - Subdirectory name (examples, templates, user)
 * @returns {string} Full path to subdirectory
 */
export function getScenarioSubdir(subdir) {
  return path.join(getScenariosDir(), subdir);
}

/**
 * Check if the scenarios directory exists
 * @returns {boolean} True if directory exists
 */
export function scenariosDirectoryExists() {
  return existsSync(getScenariosDir());
}

/**
 * Check if the Claude base directory exists
 * @returns {boolean} True if directory exists
 */
export function claudeDirectoryExists() {
  return existsSync(getClaudeDir());
}

/**
 * Create the scenario directory structure
 * 
 * Creates:
 * - ~/.claude/ (if it doesn't exist)
 * - ~/.claude/scenarios/
 * - ~/.claude/scenarios/examples/
 * - ~/.claude/scenarios/templates/
 * - ~/.claude/scenarios/user/
 * 
 * @param {Object} options - Creation options
 * @param {boolean} [options.force=false] - Force recreation if exists
 * @param {boolean} [options.verbose=false] - Log creation steps
 * @returns {Promise<Object>} Result with created paths and status
 */
export async function createScenarioDirectory(options = {}) {
  const { force = false, verbose = false } = options;

  const result = {
    success: false,
    created: [],
    existed: [],
    errors: [],
  };

  try {
    // 1. Ensure base .claude directory exists
    const claudeDir = getClaudeDir();
    if (!existsSync(claudeDir)) {
      await fs.mkdir(claudeDir, { recursive: true, mode: 0o755 });
      result.created.push(claudeDir);
      if (verbose) console.log(`Created: ${claudeDir}`);
    } else {
      result.existed.push(claudeDir);
      if (verbose) console.log(`Exists: ${claudeDir}`);
    }

    // 2. Create scenarios directory
    const scenariosDir = getScenariosDir();
    if (force && existsSync(scenariosDir)) {
      // If force, we don't delete, just ensure permissions are correct
      await fs.chmod(scenariosDir, 0o755);
      result.existed.push(scenariosDir);
      if (verbose) console.log(`Updated permissions: ${scenariosDir}`);
    } else if (!existsSync(scenariosDir)) {
      await fs.mkdir(scenariosDir, { recursive: true, mode: 0o755 });
      result.created.push(scenariosDir);
      if (verbose) console.log(`Created: ${scenariosDir}`);
    } else {
      result.existed.push(scenariosDir);
      if (verbose) console.log(`Exists: ${scenariosDir}`);
    }

    // 3. Create subdirectories
    const subdirs = ['examples', 'templates', 'user'];
    for (const subdir of subdirs) {
      const subdirPath = getScenarioSubdir(subdir);
      if (!existsSync(subdirPath)) {
        await fs.mkdir(subdirPath, { recursive: true, mode: 0o755 });
        result.created.push(subdirPath);
        if (verbose) console.log(`Created: ${subdirPath}`);
      } else {
        result.existed.push(subdirPath);
        if (verbose) console.log(`Exists: ${subdirPath}`);
      }
    }

    // 4. Create README files for each subdirectory
    await createReadmeFiles(verbose);

    result.success = true;
    return result;

  } catch (error) {
    result.errors.push({
      message: error.message,
      stack: error.stack,
    });
    return result;
  }
}

/**
 * Create README files for scenario subdirectories
 * @param {boolean} verbose - Log creation steps
 * @private
 */
async function createReadmeFiles(verbose = false) {
  const readmes = {
    '': `# Claude Scenarios Directory

This directory contains scenario definitions for the Partnership-Enabled Scenario System.

## Structure

- \`examples/\` - Example scenarios demonstrating common patterns
- \`templates/\` - Reusable scenario templates for quick creation
- \`user/\` - User-created custom scenarios

## Usage

Create a new scenario:
\`\`\`bash
claude scenario create
\`\`\`

List all scenarios:
\`\`\`bash
claude scenario list
\`\`\`

Deploy a scenario:
\`\`\`bash
claude scenario deploy <name>
\`\`\`

For more information, see the documentation at:
https://github.com/orchestrator-project/docs
`,
    'examples': `# Example Scenarios

This directory contains example scenarios demonstrating common patterns and best practices.

## Available Examples

Examples will be added here as the system develops.

## Using Examples

To use an example as a starting point:
\`\`\`bash
claude scenario create --template example-name
\`\`\`
`,
    'templates': `# Scenario Templates

This directory contains reusable templates for common scenario types.

## Available Templates

Templates will be added here as the system develops.

## Creating from Template

\`\`\`bash
claude scenario create --template template-name
\`\`\`
`,
    'user': `# User Scenarios

This directory contains your custom scenario definitions.

## Creating a Scenario

\`\`\`bash
claude scenario create
\`\`\`

Your scenarios will be saved here automatically.
`,
  };

  for (const [subdir, content] of Object.entries(readmes)) {
    const readmePath = path.join(getScenariosDir(), subdir, 'README.md');
    const readmeDir = path.dirname(readmePath);
    
    // Ensure parent directory exists
    if (!existsSync(readmeDir)) {
      await fs.mkdir(readmeDir, { recursive: true, mode: 0o755 });
    }

    // Only create if doesn't exist (don't overwrite user customizations)
    if (!existsSync(readmePath)) {
      await fs.writeFile(readmePath, content.trim(), { mode: 0o644 });
      if (verbose) console.log(`Created README: ${readmePath}`);
    }
  }
}

/**
 * Verify the scenario directory structure
 * 
 * Checks that all required directories exist with correct permissions
 * 
 * @returns {Promise<Object>} Validation result
 */
export async function verifyScenarioDirectory() {
  const result = {
    valid: true,
    missing: [],
    permissionErrors: [],
    details: {},
  };

  try {
    // Check base directory
    const claudeDir = getClaudeDir();
    if (!existsSync(claudeDir)) {
      result.valid = false;
      result.missing.push(claudeDir);
    } else {
      try {
        await fs.access(claudeDir, fs.constants.R_OK | fs.constants.W_OK);
        result.details.claudeDir = { exists: true, writable: true };
      } catch {
        result.valid = false;
        result.permissionErrors.push(claudeDir);
        result.details.claudeDir = { exists: true, writable: false };
      }
    }

    // Check scenarios directory
    const scenariosDir = getScenariosDir();
    if (!existsSync(scenariosDir)) {
      result.valid = false;
      result.missing.push(scenariosDir);
    } else {
      try {
        await fs.access(scenariosDir, fs.constants.R_OK | fs.constants.W_OK);
        result.details.scenariosDir = { exists: true, writable: true };
      } catch {
        result.valid = false;
        result.permissionErrors.push(scenariosDir);
        result.details.scenariosDir = { exists: true, writable: false };
      }
    }

    // Check subdirectories
    const subdirs = ['examples', 'templates', 'user'];
    for (const subdir of subdirs) {
      const subdirPath = getScenarioSubdir(subdir);
      if (!existsSync(subdirPath)) {
        result.valid = false;
        result.missing.push(subdirPath);
        result.details[subdir] = { exists: false };
      } else {
        try {
          await fs.access(subdirPath, fs.constants.R_OK | fs.constants.W_OK);
          result.details[subdir] = { exists: true, writable: true };
        } catch {
          result.valid = false;
          result.permissionErrors.push(subdirPath);
          result.details[subdir] = { exists: true, writable: false };
        }
      }
    }

    return result;

  } catch (error) {
    result.valid = false;
    result.error = error.message;
    return result;
  }
}

/**
 * Get statistics about the scenarios directory
 * 
 * @returns {Promise<Object>} Statistics object
 */
export async function getScenarioStats() {
  const stats = {
    exists: scenariosDirectoryExists(),
    totalScenarios: 0,
    userScenarios: 0,
    exampleScenarios: 0,
    templates: 0,
  };

  if (!stats.exists) {
    return stats;
  }

  try {
    // Count user scenarios
    const userDir = getScenarioSubdir('user');
    if (existsSync(userDir)) {
      const userFiles = await fs.readdir(userDir);
      stats.userScenarios = userFiles.filter(f => f.endsWith('.yaml') || f.endsWith('.yml')).length;
    }

    // Count examples
    const examplesDir = getScenarioSubdir('examples');
    if (existsSync(examplesDir)) {
      const exampleFiles = await fs.readdir(examplesDir);
      stats.exampleScenarios = exampleFiles.filter(f => f.endsWith('.yaml') || f.endsWith('.yml')).length;
    }

    // Count templates
    const templatesDir = getScenarioSubdir('templates');
    if (existsSync(templatesDir)) {
      const templateFiles = await fs.readdir(templatesDir);
      stats.templates = templateFiles.filter(f => f.endsWith('.yaml') || f.endsWith('.yml')).length;
    }

    stats.totalScenarios = stats.userScenarios + stats.exampleScenarios;

    return stats;

  } catch (error) {
    stats.error = error.message;
    return stats;
  }
}

export default {
  getClaudeDir,
  getScenariosDir,
  getScenarioSubdir,
  scenariosDirectoryExists,
  claudeDirectoryExists,
  createScenarioDirectory,
  verifyScenarioDirectory,
  getScenarioStats,
};

