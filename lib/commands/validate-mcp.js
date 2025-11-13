/**
 * Validate MCP Command
 * 
 * CLI command to validate MCP configuration against Orchestrator standards
 */

import { validateMcpConfig, formatValidationResult, autoFixMcpConfig } from '../utils/mcp-validator.js';
import path from 'path';
import chalk from 'chalk';

/**
 * Validate MCP configuration for a project
 * 
 * @param {string} projectPath - Path to project (defaults to current directory)
 * @param {Object} options - Command options
 * @param {boolean} options.fix - Auto-fix issues
 * @param {boolean} options.verbose - Show detailed output
 */
export async function validateMcp(projectPath = process.cwd(), options = {}) {
  const { fix = false, verbose = false } = options;

  console.log(chalk.blue('🔍 Validating MCP configuration...\n'));
  console.log(`Project: ${chalk.cyan(projectPath)}\n`);

  // Validate
  const result = validateMcpConfig(projectPath);

  // Display results
  const formatted = formatValidationResult(result);
  console.log(formatted);

  // Auto-fix if requested
  if (fix && !result.valid) {
    console.log(chalk.yellow('\n🔧 Attempting auto-fix...\n'));
    
    const fixResult = autoFixMcpConfig(projectPath, result);
    
    if (fixResult.success) {
      console.log(chalk.green(`✅ ${fixResult.message}\n`));
      
      // Re-validate
      console.log(chalk.blue('🔍 Re-validating...\n'));
      const newResult = validateMcpConfig(projectPath);
      
      if (newResult.valid) {
        console.log(chalk.green('✅ All issues resolved!\n'));
      } else {
        console.log(chalk.yellow('⚠️  Some issues remain. Manual fixes may be needed.\n'));
        console.log(formatValidationResult(newResult));
      }
    } else {
      console.log(chalk.red(`❌ Auto-fix failed: ${fixResult.error}\n`));
    }
  }

  // Exit with appropriate code
  if (!result.valid && !fix) {
    console.log(chalk.yellow('\n💡 Tip: Run with --fix to auto-fix issues\n'));
    process.exit(1);
  }

  return result;
}

/**
 * Register command with Commander
 */
export function registerCommand(program) {
  program
    .command('validate-mcp [project-path]')
    .description('Validate MCP configuration against Orchestrator template standards')
    .option('-f, --fix', 'Auto-fix issues where possible')
    .option('-v, --verbose', 'Show detailed validation output')
    .action(validateMcp);
}

export default {
  validateMcp,
  registerCommand,
};


