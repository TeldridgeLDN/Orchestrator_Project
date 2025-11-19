/**
 * Shell Integration Command
 * 
 * Manages terminal prompt integration for the orchestrator.
 * Allows users to install, remove, and check status of shell integration.
 * 
 * @module commands/shell
 * @version 1.0.0
 */

import chalk from 'chalk';
import { createCommandErrorHandler } from '../utils/errors/index.js';
import { 
  initializeShellIntegration, 
  removeShellIntegrationCommand,
  detectShell 
} from '../init/shell_integration_init.js';

/**
 * Install shell integration
 * @param {Object} options - Command options
 * @param {boolean} options.verbose - Show detailed output
 */
export async function installCommand(options = {}) {
  const handleError = createCommandErrorHandler({
    commandName: 'shell install',
    verbose: options.verbose !== false,
    exitCode: 1
  });
  
  try {
    console.log(chalk.bold('\n🐚 Installing Shell Integration\n'));
    
    const result = await initializeShellIntegration({ 
      verbose: true, 
      interactive: false 
    });
    
    if (result.success) {
      if (result.alreadyInstalled) {
        console.log(chalk.blue('\nℹ️  Shell integration is already installed!'));
        console.log(`   RC file: ${result.rcFile}`);
      } else {
        console.log(chalk.green('\n✅ Shell integration installed successfully!'));
        console.log('\n' + chalk.bold('Next Steps:'));
        console.log('  1. Restart your terminal, or');
        console.log(`  2. Run: ${chalk.cyan(`source ${result.rcFile}`)}`);
        console.log('\nYour prompt will now show:');
        console.log(chalk.green('  [ProjectName]') + ' $ your command here');
      }
    } else {
      console.log(chalk.yellow('\n⚠️  Failed to install shell integration'));
      
      if (result.reason === 'unsupported_shell') {
        console.log(chalk.dim(`   Shell: ${result.shell}`));
        console.log(chalk.dim('   Supported: bash, zsh, fish'));
        console.log('\nPlease set up manually or use a supported shell.');
      } else {
        console.log(chalk.dim(`   Error: ${result.error}`));
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    await handleError(error);
  }
}

/**
 * Remove shell integration
 * @param {Object} options - Command options
 * @param {boolean} options.verbose - Show detailed output
 */
export async function removeCommand(options = {}) {
  const handleError = createCommandErrorHandler({
    commandName: 'shell remove',
    verbose: options.verbose !== false,
    exitCode: 1
  });
  
  try {
    console.log(chalk.bold('\n🗑️  Removing Shell Integration\n'));
    
    const result = await removeShellIntegrationCommand({ verbose: true });
    
    if (result.success) {
      if (result.removed) {
        console.log(chalk.green('\n✅ Shell integration removed successfully!'));
        console.log('\n' + chalk.bold('Next Steps:'));
        console.log('  1. Restart your terminal, or');
        console.log(`  2. Run: ${chalk.cyan(`source ${result.rcFile}`)}`);
      } else {
        console.log(chalk.blue('\nℹ️  Shell integration was not installed.'));
        console.log('   Nothing to remove.');
      }
    } else {
      console.log(chalk.yellow('\n⚠️  Failed to remove shell integration'));
      console.log(chalk.dim(`   Error: ${result.error || result.reason}`));
      process.exit(1);
    }
    
  } catch (error) {
    await handleError(error);
  }
}

/**
 * Show shell integration status
 * @param {Object} options - Command options
 * @param {boolean} options.verbose - Show detailed output
 */
export async function statusCommand(options = {}) {
  const handleError = createCommandErrorHandler({
    commandName: 'shell status',
    verbose: options.verbose !== false,
    exitCode: 1
  });
  
  try {
    console.log(chalk.bold('\n🐚 Shell Integration Status\n'));
    
    // Detect shell
    const shellInfo = await detectShell();
    
    if (!shellInfo.supported) {
      console.log(chalk.yellow('Shell: ') + chalk.red(shellInfo.shell + ' (unsupported)'));
      console.log(chalk.dim('Supported shells: bash, zsh, fish'));
      return;
    }
    
    console.log(chalk.yellow('Shell: ') + chalk.cyan(shellInfo.shell));
    console.log(chalk.yellow('RC File: ') + chalk.dim(shellInfo.rcFile));
    
    // Check if installed
    const { promises: fs } = await import('fs');
    try {
      const content = await fs.readFile(shellInfo.rcFile, 'utf-8');
      const installed = content.includes('Orchestrator Shell Integration');
      
      if (installed) {
        console.log(chalk.yellow('Status: ') + chalk.green('✓ Installed'));
        console.log('\nYour terminal prompt should show project names when');
        console.log('you\'re inside orchestrator projects.');
        console.log('\nTo remove: ' + chalk.cyan('diet103 shell remove'));
      } else {
        console.log(chalk.yellow('Status: ') + chalk.red('✗ Not installed'));
        console.log('\nTo install: ' + chalk.cyan('diet103 shell install'));
      }
    } catch (error) {
      console.log(chalk.yellow('Status: ') + chalk.red('✗ RC file not found'));
      console.log(chalk.dim(`   ${error.message}`));
    }
    
    console.log('');
    
  } catch (error) {
    await handleError(error);
  }
}

/**
 * Main shell command handler
 * @param {string} subcommand - Subcommand (install, remove, status)
 * @param {Object} options - Command options
 */
export async function shellCommand(subcommand, options = {}) {
  if (!subcommand) {
    // Default to status
    return await statusCommand(options);
  }
  
  switch (subcommand) {
    case 'install':
      return await installCommand(options);
    
    case 'remove':
    case 'uninstall':
      return await removeCommand(options);
    
    case 'status':
      return await statusCommand(options);
    
    default:
      console.error(chalk.red(`\n❌ Unknown subcommand: ${subcommand}\n`));
      console.log('Available subcommands:');
      console.log('  ' + chalk.cyan('install') + '   - Install shell integration');
      console.log('  ' + chalk.cyan('remove') + '    - Remove shell integration');
      console.log('  ' + chalk.cyan('status') + '    - Show integration status');
      console.log('');
      process.exit(1);
  }
}

