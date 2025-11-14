/**
 * TaskMaster Integration - Initialization Module
 * 
 * Handles opt-in installation of TaskMaster AI during diet103 init.
 * Creates necessary directories, installs package, and configures MCP integration.
 * 
 * @module init/taskmaster_init
 * @version 1.2.0 (Phase 2 Feature 3)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import prompts from 'prompts';

/**
 * Default tasks.json template for new projects
 */
const DEFAULT_TASKS_TEMPLATE = {
  "$schema": "./tasks-schema.json",
  "project": {
    "name": "New Project",
    "version": "0.1.0",
    "created": new Date().toISOString()
  },
  "tasks": []
};

/**
 * TaskMaster MCP server configuration template
 */
const TASKMASTER_MCP_CONFIG = {
  "command": "npx",
  "args": ["-y", "task-master-ai"],
  "disabled": false,
  "env": {
    "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
    "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}",
    "OPENAI_API_KEY": "${OPENAI_API_KEY}",
    "GOOGLE_API_KEY": "${GOOGLE_API_KEY}",
    "XAI_API_KEY": "${XAI_API_KEY}",
    "OPENROUTER_API_KEY": "${OPENROUTER_API_KEY}",
    "MISTRAL_API_KEY": "${MISTRAL_API_KEY}"
  }
};

/**
 * Check if TaskMaster is already installed in the project
 */
async function isTaskMasterInstalled(projectPath) {
  const tasksJsonPath = path.join(projectPath, '.taskmaster', 'tasks', 'tasks.json');
  const mcpJsonPath = path.join(projectPath, '.mcp.json');
  
  try {
    await fs.access(tasksJsonPath);
    
    // Check if MCP config includes TaskMaster
    try {
      const mcpConfig = JSON.parse(await fs.readFile(mcpJsonPath, 'utf-8'));
      return mcpConfig.mcpServers?.['task-master-ai'] !== undefined;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

/**
 * Create TaskMaster directory structure
 */
async function createTaskMasterDirectories(projectPath, verbose = false) {
  const dirs = [
    '.taskmaster',
    '.taskmaster/tasks',
    '.taskmaster/docs',
    '.taskmaster/reports',
    '.taskmaster/templates'
  ];
  
  let created = 0;
  
  for (const dir of dirs) {
    const fullPath = path.join(projectPath, dir);
    try {
      await fs.mkdir(fullPath, { recursive: true });
      created++;
      if (verbose) {
        console.log(chalk.dim(`  ✓ Created ${dir}/`));
      }
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
  
  return created;
}

/**
 * Create initial tasks.json file
 */
async function createTasksFile(projectPath, projectName, verbose = false) {
  const tasksPath = path.join(projectPath, '.taskmaster', 'tasks', 'tasks.json');
  
  const tasksContent = {
    ...DEFAULT_TASKS_TEMPLATE,
    project: {
      name: projectName,
      version: "0.1.0",
      created: new Date().toISOString()
    }
  };
  
  await fs.writeFile(tasksPath, JSON.stringify(tasksContent, null, 2), 'utf-8');
  
  if (verbose) {
    console.log(chalk.dim('  ✓ Created .taskmaster/tasks/tasks.json'));
  }
  
  return tasksPath;
}

/**
 * Update .mcp.json to include TaskMaster server
 */
async function updateMcpConfig(projectPath, verbose = false) {
  const mcpPath = path.join(projectPath, '.mcp.json');
  
  let mcpConfig;
  try {
    const existingConfig = await fs.readFile(mcpPath, 'utf-8');
    mcpConfig = JSON.parse(existingConfig);
  } catch {
    // If .mcp.json doesn't exist, create minimal config
    mcpConfig = { mcpServers: {} };
  }
  
  // Ensure mcpServers object exists
  if (!mcpConfig.mcpServers) {
    mcpConfig.mcpServers = {};
  }
  
  // Add TaskMaster AI server config (if not already present)
  if (!mcpConfig.mcpServers['task-master-ai']) {
    mcpConfig.mcpServers['task-master-ai'] = TASKMASTER_MCP_CONFIG;
    
    await fs.writeFile(mcpPath, JSON.stringify(mcpConfig, null, 2), 'utf-8');
    
    if (verbose) {
      console.log(chalk.dim('  ✓ Updated .mcp.json with TaskMaster server'));
    }
    
    return true;
  }
  
  if (verbose) {
    console.log(chalk.dim('  → TaskMaster already in .mcp.json'));
  }
  
  return false;
}

/**
 * Check for API keys and provide guidance
 */
async function checkApiKeys(projectPath, verbose = false) {
  const envPath = path.join(projectPath, '.env');
  const envExamplePath = path.join(projectPath, '.env.example');
  
  let hasKeys = false;
  
  try {
    const envContent = await fs.readFile(envPath, 'utf-8');
    hasKeys = envContent.includes('ANTHROPIC_API_KEY') || 
              envContent.includes('PERPLEXITY_API_KEY') ||
              envContent.includes('OPENAI_API_KEY');
  } catch {
    // .env doesn't exist
  }
  
  if (!hasKeys && verbose) {
    console.log(chalk.yellow('\n  ⚠️  API Keys Required'));
    console.log(chalk.dim('  TaskMaster requires at least one AI provider API key:'));
    console.log(chalk.dim('  - ANTHROPIC_API_KEY (Claude) - Recommended'));
    console.log(chalk.dim('  - PERPLEXITY_API_KEY (Research features)'));
    console.log(chalk.dim('  - OPENAI_API_KEY (GPT models)'));
    console.log(chalk.dim(`\n  Add your keys to: ${envPath}`));
    console.log(chalk.dim(`  Example format: ${envExamplePath}`));
  }
  
  return hasKeys;
}

/**
 * Install TaskMaster npm package
 */
async function installTaskMasterPackage(projectPath, verbose = false) {
  if (verbose) {
    console.log(chalk.dim('  ↓ Installing task-master-ai package...'));
  }
  
  try {
    // Check if package.json exists in project
    const packageJsonPath = path.join(projectPath, 'package.json');
    let hasPackageJson = false;
    
    try {
      await fs.access(packageJsonPath);
      hasPackageJson = true;
    } catch {
      // No package.json
    }
    
    if (hasPackageJson) {
      // Install as dev dependency
      execSync('npm install --save-dev task-master-ai', {
        cwd: projectPath,
        stdio: verbose ? 'inherit' : 'pipe'
      });
      
      if (verbose) {
        console.log(chalk.dim('  ✓ Installed task-master-ai as dev dependency'));
      }
      
      return { installed: true, method: 'npm-dev' };
    } else {
      // No package.json - will use npx
      if (verbose) {
        console.log(chalk.dim('  → No package.json found, will use npx (no installation needed)'));
      }
      
      return { installed: false, method: 'npx' };
    }
  } catch (error) {
    if (verbose) {
      console.log(chalk.yellow(`  ! Package installation skipped: ${error.message}`));
      console.log(chalk.dim('  → TaskMaster will use npx instead'));
    }
    
    return { installed: false, method: 'npx-fallback', error: error.message };
  }
}

/**
 * Main TaskMaster initialization function
 * 
 * @param {Object} options - Initialization options
 * @param {string} options.projectRoot - Absolute path to project root
 * @param {string} options.projectName - Name of the project
 * @param {boolean} [options.verbose=false] - Show detailed output
 * @param {boolean} [options.skipPrompts=false] - Skip interactive prompts
 * @returns {Promise<Object>} Installation result
 */
export async function initializeTaskMaster(options) {
  const {
    projectRoot,
    projectName = 'New Project',
    verbose = false,
    skipPrompts = false
  } = options;
  
  const result = {
    success: false,
    installed: [],
    skipped: [],
    warnings: []
  };
  
  try {
    // Check if already installed
    const alreadyInstalled = await isTaskMasterInstalled(projectRoot);
    if (alreadyInstalled) {
      if (verbose) {
        console.log(chalk.yellow('  → TaskMaster already initialized'));
      }
      result.skipped.push('TaskMaster already exists');
      result.success = true;
      return result;
    }
    
    // Step 1: Create directory structure
    if (verbose) {
      console.log(chalk.dim('\n  Creating TaskMaster directories...'));
    }
    const dirsCreated = await createTaskMasterDirectories(projectRoot, verbose);
    result.installed.push(`${dirsCreated} directories`);
    
    // Step 2: Create tasks.json
    if (verbose) {
      console.log(chalk.dim('\n  Creating initial tasks file...'));
    }
    const tasksPath = await createTasksFile(projectRoot, projectName, verbose);
    result.installed.push('.taskmaster/tasks/tasks.json');
    
    // Step 3: Update .mcp.json
    if (verbose) {
      console.log(chalk.dim('\n  Configuring MCP integration...'));
    }
    const mcpUpdated = await updateMcpConfig(projectRoot, verbose);
    if (mcpUpdated) {
      result.installed.push('.mcp.json (TaskMaster server)');
    }
    
    // Step 4: Install npm package (if package.json exists)
    if (verbose) {
      console.log(chalk.dim('\n  Installing TaskMaster package...'));
    }
    const packageResult = await installTaskMasterPackage(projectRoot, verbose);
    if (packageResult.installed) {
      result.installed.push('task-master-ai (npm package)');
    } else {
      result.warnings.push(`Will use npx for TaskMaster (${packageResult.method})`);
    }
    
    // Step 5: Check API keys
    const hasKeys = await checkApiKeys(projectRoot, verbose);
    if (!hasKeys) {
      result.warnings.push('API keys not configured - add to .env file');
    }
    
    result.success = true;
    
  } catch (error) {
    result.success = false;
    result.error = error.message;
    throw error;
  }
  
  return result;
}

/**
 * Validate TaskMaster installation
 */
export async function validateTaskMasterInstallation(projectRoot) {
  const checks = {
    directories: false,
    tasksFile: false,
    mcpConfig: false
  };
  
  try {
    // Check directories
    await fs.access(path.join(projectRoot, '.taskmaster', 'tasks'));
    checks.directories = true;
    
    // Check tasks.json
    await fs.access(path.join(projectRoot, '.taskmaster', 'tasks', 'tasks.json'));
    checks.tasksFile = true;
    
    // Check MCP config
    const mcpPath = path.join(projectRoot, '.mcp.json');
    const mcpConfig = JSON.parse(await fs.readFile(mcpPath, 'utf-8'));
    checks.mcpConfig = mcpConfig.mcpServers?.['task-master-ai'] !== undefined;
    
  } catch {
    // Validation failed
  }
  
  return {
    valid: checks.directories && checks.tasksFile && checks.mcpConfig,
    checks
  };
}
