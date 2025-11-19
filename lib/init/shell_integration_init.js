/**
 * Shell Integration Initialization
 * 
 * Sets up terminal prompt integration to display current project name
 * and status in the shell prompt. Supports bash, zsh, and fish shells.
 * 
 * @module init/shell_integration_init
 * @version 1.0.0
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Detect the user's shell type
 * @returns {Promise<{shell: string, rcFile: string, supported: boolean}>}
 */
export async function detectShell() {
  const shellEnv = process.env.SHELL || '';
  const homeDir = os.homedir();
  
  let shell, rcFile;
  
  if (shellEnv.includes('zsh')) {
    shell = 'zsh';
    rcFile = path.join(homeDir, '.zshrc');
  } else if (shellEnv.includes('bash')) {
    shell = 'bash';
    // Prefer .bashrc on Linux, .bash_profile on macOS
    const bashrc = path.join(homeDir, '.bashrc');
    const bashProfile = path.join(homeDir, '.bash_profile');
    
    try {
      await fs.access(bashrc);
      rcFile = bashrc;
    } catch {
      rcFile = bashProfile;
    }
  } else if (shellEnv.includes('fish')) {
    shell = 'fish';
    rcFile = path.join(homeDir, '.config', 'fish', 'config.fish');
  } else {
    return {
      shell: shellEnv,
      rcFile: null,
      supported: false
    };
  }
  
  return {
    shell,
    rcFile,
    supported: true
  };
}

/**
 * Get the orchestrator installation directory
 * @returns {string}
 */
function getOrchestratorPath() {
  // Go up from lib/init to project root
  return path.resolve(__dirname, '../..');
}

/**
 * Generate shell integration script content
 * @param {string} shell - Shell type (bash, zsh, fish)
 * @returns {string}
 */
function generateShellIntegration(shell) {
  const orchestratorPath = getOrchestratorPath();
  const integrationScriptPath = path.join(orchestratorPath, 'lib', 'shell', 'prompt-integration.sh');
  
  if (shell === 'fish') {
    return `
# Orchestrator Shell Integration
# Auto-setup by diet103 init
set -x ORCHESTRATOR_PATH "${orchestratorPath}"

# Source prompt integration
if test -f "${integrationScriptPath}"
    source "${integrationScriptPath}"
end
`;
  }
  
  // bash/zsh
  return `
# Orchestrator Shell Integration
# Auto-setup by diet103 init
export ORCHESTRATOR_PATH="${orchestratorPath}"

# Source prompt integration
if [ -f "${integrationScriptPath}" ]; then
  source "${integrationScriptPath}"
fi
`;
}

/**
 * Check if shell integration is already installed
 * @param {string} rcFile - Path to shell RC file
 * @returns {Promise<boolean>}
 */
async function isAlreadyInstalled(rcFile) {
  try {
    const content = await fs.readFile(rcFile, 'utf-8');
    return content.includes('Orchestrator Shell Integration');
  } catch {
    return false;
  }
}

/**
 * Add shell integration to RC file
 * @param {string} rcFile - Path to shell RC file
 * @param {string} shell - Shell type
 * @returns {Promise<void>}
 */
async function addToRcFile(rcFile, shell) {
  const integration = generateShellIntegration(shell);
  
  // Ensure RC file exists
  try {
    await fs.access(rcFile);
  } catch {
    // Create it if it doesn't exist
    await fs.writeFile(rcFile, '');
  }
  
  // Append integration
  await fs.appendFile(rcFile, `\n${integration}\n`);
}

/**
 * Remove shell integration from RC file
 * @param {string} rcFile - Path to shell RC file
 * @returns {Promise<boolean>} True if removed, false if not found
 */
export async function removeShellIntegration(rcFile) {
  try {
    const content = await fs.readFile(rcFile, 'utf-8');
    
    if (!content.includes('Orchestrator Shell Integration')) {
      return false;
    }
    
    // Remove the integration block
    const lines = content.split('\n');
    const newLines = [];
    let inBlock = false;
    
    for (const line of lines) {
      if (line.includes('# Orchestrator Shell Integration')) {
        inBlock = true;
        continue;
      }
      
      if (inBlock && (line.trim() === '' || line.includes('fi') || line.includes('end'))) {
        inBlock = false;
        continue;
      }
      
      if (!inBlock) {
        newLines.push(line);
      }
    }
    
    await fs.writeFile(rcFile, newLines.join('\n'));
    return true;
  } catch (error) {
    throw new Error(`Failed to remove integration: ${error.message}`);
  }
}

/**
 * Test if shell integration works
 * @param {string} shell - Shell type
 * @param {string} rcFile - Path to shell RC file
 * @returns {Promise<boolean>}
 */
async function testIntegration(shell, rcFile) {
  try {
    // Try to source the file and check if ORCHESTRATOR_PATH is set
    const cmd = shell === 'fish' 
      ? `fish -c "source ${rcFile}; echo $ORCHESTRATOR_PATH"`
      : `${shell} -c "source ${rcFile}; echo $ORCHESTRATOR_PATH"`;
    
    const { stdout } = await execAsync(cmd);
    return stdout.trim().length > 0;
  } catch {
    // If test fails, that's okay - integration may still work on next shell restart
    return false;
  }
}

/**
 * Create the prompt integration script
 * @returns {Promise<void>}
 */
async function createPromptIntegrationScript() {
  const orchestratorPath = getOrchestratorPath();
  const shellDir = path.join(orchestratorPath, 'lib', 'shell');
  const scriptPath = path.join(shellDir, 'prompt-integration.sh');
  
  // Ensure directory exists
  try {
    await fs.mkdir(shellDir, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create shell directory: ${error.message}`);
  }
  
  // Check if script already exists
  try {
    await fs.access(scriptPath);
    return; // Already exists
  } catch {
    // Create it
  }
  
  const scriptContent = `#!/bin/bash

# Orchestrator Project Prompt Integration
# Shows current project name and status in terminal prompt

# Get current project information
get_orchestrator_project() {
  # Check if we're in an orchestrator project
  if [ ! -f ".claude/metadata.json" ]; then
    return
  fi
  
  # Extract project name from metadata
  if command -v jq >/dev/null 2>&1; then
    local project_name=$(jq -r '.name // empty' .claude/metadata.json 2>/dev/null)
    if [ -n "$project_name" ]; then
      # Color codes
      local green="\\\\033[32m"
      local yellow="\\\\033[33m"
      local red="\\\\033[31m"
      local reset="\\\\033[0m"
      
      # Check project health
      local color="$green"
      
      # Check for issues
      if [ -d ".taskmaster" ] && [ -f ".taskmaster/tasks/tasks.json" ]; then
        # Check for pending critical tasks
        local pending_critical=$(jq '[.tasks[] | select(.status == "pending" and .priority == "high")] | length' .taskmaster/tasks/tasks.json 2>/dev/null)
        if [ "$pending_critical" -gt 0 ]; then
          color="$yellow"
        fi
      fi
      
      # Check for git issues (optional)
      if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
        if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
          # Uncommitted changes - use yellow if not already red
          if [ "$color" != "$red" ]; then
            color="$yellow"
          fi
        fi
      fi
      
      echo -e "${color}[$project_name]${reset} "
    fi
  fi
}

# Integration for different shells
if [ -n "$ZSH_VERSION" ]; then
  # Zsh integration
  setopt PROMPT_SUBST
  PROMPT='$(get_orchestrator_project)'$PROMPT
  
elif [ -n "$BASH_VERSION" ]; then
  # Bash integration
  if [[ ! "$PROMPT_COMMAND" =~ "__orchestrator_prompt" ]]; then
    __orchestrator_prompt() {
      PS1="$(get_orchestrator_project)$__orchestrator_original_ps1"
    }
    __orchestrator_original_ps1="$PS1"
    PROMPT_COMMAND="__orchestrator_prompt\${PROMPT_COMMAND:+; \$PROMPT_COMMAND}"
  fi
fi
`;
  
  await fs.writeFile(scriptPath, scriptContent);
  await fs.chmod(scriptPath, 0o755);
}

/**
 * Initialize shell integration
 * @param {Object} options
 * @param {boolean} options.verbose - Show detailed output
 * @param {boolean} options.interactive - Use interactive prompts
 * @returns {Promise<Object>}
 */
export async function initializeShellIntegration(options = {}) {
  const { verbose = false, interactive = true } = options;
  
  try {
    if (verbose) {
      console.log('🐚 Initializing shell integration...');
    }
    
    // Step 1: Detect shell
    const shellInfo = await detectShell();
    
    if (!shellInfo.supported) {
      if (verbose) {
        console.log(`⚠️  Shell not supported: ${shellInfo.shell}`);
        console.log('   Supported shells: bash, zsh, fish');
      }
      return {
        success: false,
        reason: 'unsupported_shell',
        shell: shellInfo.shell
      };
    }
    
    if (verbose) {
      console.log(`✓ Detected shell: ${shellInfo.shell}`);
      console.log(`  RC file: ${shellInfo.rcFile}`);
    }
    
    // Step 2: Check if already installed
    const alreadyInstalled = await isAlreadyInstalled(shellInfo.rcFile);
    
    if (alreadyInstalled) {
      if (verbose) {
        console.log('✓ Shell integration already installed');
      }
      return {
        success: true,
        alreadyInstalled: true,
        shell: shellInfo.shell,
        rcFile: shellInfo.rcFile
      };
    }
    
    // Step 3: Create prompt integration script
    if (verbose) {
      console.log('  Creating prompt integration script...');
    }
    await createPromptIntegrationScript();
    
    // Step 4: Add to RC file
    if (verbose) {
      console.log(`  Adding integration to ${shellInfo.rcFile}...`);
    }
    await addToRcFile(shellInfo.rcFile, shellInfo.shell);
    
    // Step 5: Test integration (best effort)
    let tested = false;
    if (verbose) {
      console.log('  Testing integration...');
    }
    
    try {
      tested = await testIntegration(shellInfo.shell, shellInfo.rcFile);
    } catch {
      // Test failure is not critical
    }
    
    if (verbose) {
      console.log('✅ Shell integration installed successfully!');
      console.log('');
      console.log('   To activate, restart your terminal or run:');
      console.log(`   source ${shellInfo.rcFile}`);
      console.log('');
      console.log('   To remove integration later, run:');
      console.log('   diet103 shell remove');
    }
    
    return {
      success: true,
      shell: shellInfo.shell,
      rcFile: shellInfo.rcFile,
      tested,
      alreadyInstalled: false
    };
    
  } catch (error) {
    if (verbose) {
      console.error(`❌ Failed to initialize shell integration: ${error.message}`);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Remove shell integration
 * @param {Object} options
 * @param {boolean} options.verbose - Show detailed output
 * @returns {Promise<Object>}
 */
export async function removeShellIntegrationCommand(options = {}) {
  const { verbose = false } = options;
  
  try {
    if (verbose) {
      console.log('🗑️  Removing shell integration...');
    }
    
    // Detect shell
    const shellInfo = await detectShell();
    
    if (!shellInfo.supported) {
      if (verbose) {
        console.log('⚠️  Shell not supported or not detected');
      }
      return {
        success: false,
        reason: 'unsupported_shell'
      };
    }
    
    // Remove from RC file
    const removed = await removeShellIntegration(shellInfo.rcFile);
    
    if (removed) {
      if (verbose) {
        console.log('✅ Shell integration removed successfully!');
        console.log('');
        console.log('   Restart your terminal or run:');
        console.log(`   source ${shellInfo.rcFile}`);
      }
      
      return {
        success: true,
        removed: true,
        rcFile: shellInfo.rcFile
      };
    } else {
      if (verbose) {
        console.log('ℹ️  Shell integration was not installed');
      }
      
      return {
        success: true,
        removed: false,
        reason: 'not_installed'
      };
    }
    
  } catch (error) {
    if (verbose) {
      console.error(`❌ Failed to remove shell integration: ${error.message}`);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

