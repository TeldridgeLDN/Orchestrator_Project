/**
 * diet103 Switch Command
 * 
 * Switch between projects with lightweight infrastructure validation.
 * Ensures project context switches are safe and validated.
 * 
 * @module commands/switch
 * @version 1.0.0
 */

import path from 'path';
import { promises as fs } from 'fs';
import chalk from 'chalk';
import {
  detectDiet103Infrastructure,
  analyzeDiet103Gaps
} from '../utils/diet103-validator.js';
import { updateAccessTimestamp } from '../utils/project-timestamps.js';
import { 
  createError, 
  createCommandErrorHandler, 
  wrapError,
  ProjectNotFoundError,
  InsufficientRequirementsError,
  JSONParseError
} from '../utils/errors/index.js';

/**
 * Project context file path
 */
const CONTEXT_FILE = path.join(process.env.HOME || '/tmp', '.claude', 'current-project.json');

/**
 * Load current project context
 * 
 * @returns {Promise<Object|null>} Current project context or null
 */
async function loadCurrentContext() {
  try {
    const content = await fs.readFile(CONTEXT_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    if (error instanceof SyntaxError) {
      throw wrapError(error, 'UTIL-DATA-001', { path: CONTEXT_FILE });
    }
    throw wrapError(error, 'UTIL-FS-006', { path: CONTEXT_FILE });
  }
}

/**
 * Save project context
 * 
 * @param {Object} context - Project context
 */
async function saveContext(context) {
  try {
    const contextDir = path.dirname(CONTEXT_FILE);
    
    // Ensure directory exists
    await fs.mkdir(contextDir, { recursive: true });
    
    await fs.writeFile(CONTEXT_FILE, JSON.stringify(context, null, 2), 'utf-8');
  } catch (error) {
    if (error.code === 'EACCES') {
      throw wrapError(error, 'UTIL-FS-002', { path: CONTEXT_FILE });
    }
    throw wrapError(error, 'UTIL-FS-007', { path: CONTEXT_FILE });
  }
}

/**
 * Validate project infrastructure (lightweight)
 * 
 * @param {string} projectPath - Path to project
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} Validation result
 */
async function validateProjectQuick(projectPath, options = {}) {
  const { verbose = false } = options;

  if (verbose) {
    console.log(chalk.dim('  Validating project infrastructure...'));
  }

  // Quick detection and gap analysis
  const checks = await detectDiet103Infrastructure(projectPath);
  const gaps = analyzeDiet103Gaps(checks);

  return {
    score: gaps.score,
    isComplete: gaps.isComplete,
    gaps
  };
}

/**
 * Display validation status
 * 
 * @param {Object} validation - Validation result
 * @param {Object} options - Display options
 */
function displayValidationStatus(validation, options = {}) {
  const { verbose = false } = options;
  const score = validation.score;

  if (score >= 85) {
    // Silent for high confidence
    if (verbose) {
      console.log(chalk.green(`  ✓ Infrastructure validated (${score}%)`));
    }
  } else if (score >= 70) {
    // Warning for partial
    console.log(chalk.yellow(`  ⚠ Warning: Project infrastructure is partially incomplete (${score}%)`));
    if (validation.gaps.critical.length > 0) {
      console.log(chalk.yellow(`    Missing critical components: ${validation.gaps.critical.length}`));
    }
    if (validation.gaps.important.length > 0) {
      console.log(chalk.yellow(`    Missing important components: ${validation.gaps.important.length}`));
    }
  } else {
    // Error for low confidence
    throw new InsufficientRequirementsError(
      `Project infrastructure is insufficient (${score}%). Minimum required: 70%`,
      'CMD-PROJ-003',
      { score, minimumScore: 70, gaps: validation.gaps }
    );
  }
}

/**
 * Switch project command handler
 * 
 * @param {string} projectPath - Path to project (optional, defaults to cwd)
 * @param {Object} options - Command options
 */
export async function switchCommand(projectPath, options) {
  const handleError = createCommandErrorHandler({
    commandName: 'switch',
    verbose: options.verbose || false,
    exitCode: 1
  });

  try {
    // Resolve project path
    const targetPath = projectPath ? path.resolve(projectPath) : process.cwd();
    const projectName = options.name || path.basename(targetPath);
    const validate = options.validate !== false; // Default: true
    const verbose = options.verbose || false;

    console.log(chalk.bold('\n🔄 Switching Project Context'));
    console.log('─'.repeat(60));
    console.log(`${chalk.bold('Project:')} ${projectName}`);
    console.log(`${chalk.bold('Path:')} ${targetPath}`);
    console.log(`${chalk.bold('Validation:')} ${validate ? 'enabled' : 'disabled'}`);
    console.log('─'.repeat(60) + '\n');

    // Step 1: Validate if enabled
    let validationScore = null;
    if (validate) {
      if (verbose) {
        console.log(chalk.bold('Step 1: Validating Infrastructure'));
      }

      const validation = await validateProjectQuick(targetPath, { verbose });
      validationScore = validation.score;

      // Check score thresholds
      if (validation.score < 70) {
        console.log('\n' + chalk.red(`✗ Switch Blocked`));
        console.log(chalk.red(`  Infrastructure score (${validation.score}%) is below minimum (70%)`));
        
        if (validation.gaps.critical.length > 0) {
          console.log('\n' + chalk.red('  Missing critical components:'));
          validation.gaps.critical.forEach(item => {
            console.log(chalk.red(`    ✗ ${item}`));
          });
        }
        
        if (validation.gaps.important.length > 0) {
          console.log('\n' + chalk.yellow('  Missing important components:'));
          validation.gaps.important.forEach(item => {
            console.log(chalk.yellow(`    ! ${item}`));
          });
        }

        console.log('\n' + chalk.dim('Suggestions:'));
        console.log(chalk.dim('  1. Run: claude validate --repair'));
        console.log(chalk.dim('  2. Use: --no-validate to bypass validation'));
        console.log('─'.repeat(60) + '\n');

        throw new InsufficientRequirementsError(
          `Cannot switch to project with insufficient infrastructure (${validation.score}%)`,
          'CMD-PROJ-003',
          { score: validation.score, minimumScore: 70, gaps: validation.gaps }
        );
      }

      displayValidationStatus(validation, { verbose });

    } else {
      if (verbose) {
        console.log(chalk.dim('Validation bypassed (--no-validate)'));
      }
    }

    // Step 2: Load and update context
    if (verbose) {
      console.log('\n' + chalk.bold('Step 2: Updating Project Context'));
    }

    const currentContext = await loadCurrentContext();
    
    if (currentContext && currentContext.path === targetPath) {
      console.log(chalk.yellow('  ! Already on this project'));
    } else {
      const newContext = {
        name: projectName,
        path: targetPath,
        switchedAt: new Date().toISOString(),
        validationScore: validationScore,
        previousProject: currentContext ? {
          name: currentContext.name,
          path: currentContext.path
        } : null
      };

      await saveContext(newContext);
      
      // Update project access timestamp
      updateAccessTimestamp(targetPath);
      
      if (verbose) {
        console.log(chalk.green('  ✓ Context updated'));
        console.log(chalk.dim('  ✓ Access timestamp recorded'));
      }
    }

    // Success summary
    console.log('\n' + '─'.repeat(60));
    console.log(chalk.green.bold('✓ Switch Successful!'));
    console.log('─'.repeat(60));
    console.log(`${chalk.bold('Project:')} ${projectName}`);
    console.log(`${chalk.bold('Path:')} ${targetPath}`);
    if (validationScore !== null) {
      console.log(`${chalk.bold('Validation Score:')} ${validationScore}%`);
    }
    console.log('─'.repeat(60) + '\n');

    process.exit(0);

  } catch (error) {
    // For insufficient requirements errors, already displayed detailed info
    if (error instanceof InsufficientRequirementsError) {
      process.exit(1);
    }
    
    // Wrap and handle other errors properly
    const wrappedError = error.code ? error : wrapError(error, 'CMD-PROJ-004', { 
      project: projectPath || process.cwd() 
    });
    await handleError(wrappedError);
  }
}

/**
 * Show current project context
 * 
 * @param {Object} options - Command options
 */
export async function showCurrentProject(options = {}) {
  const handleError = createCommandErrorHandler({
    commandName: 'show-current-project',
    verbose: options.verbose || false,
    exitCode: 1
  });

  try {
    const context = await loadCurrentContext();

    if (!context) {
      console.log(chalk.yellow('\nNo project context set.\n'));
      return;
    }

    console.log(chalk.bold('\n📂 Current Project'));
    console.log('─'.repeat(60));
    console.log(`${chalk.bold('Name:')} ${context.name}`);
    console.log(`${chalk.bold('Path:')} ${context.path}`);
    
    if (context.validationScore !== null && context.validationScore !== undefined) {
      const scoreColor = context.validationScore >= 85 ? chalk.green :
                        context.validationScore >= 70 ? chalk.yellow :
                        chalk.red;
      console.log(`${chalk.bold('Validation Score:')} ${scoreColor(context.validationScore + '%')}`);
    }
    
    console.log(`${chalk.bold('Switched:')} ${new Date(context.switchedAt).toLocaleString()}`);
    
    if (context.previousProject) {
      console.log(`${chalk.bold('Previous:')} ${context.previousProject.name}`);
    }
    
    console.log('─'.repeat(60) + '\n');

  } catch (error) {
    const wrappedError = error.code ? error : wrapError(error, 'CMD-PROJ-005', { 
      operation: 'show-current-project' 
    });
    await handleError(wrappedError);
  }
}

/**
 * Switch back to previous project
 * 
 * @param {Object} options - Command options
 */
export async function switchBackCommand(options = {}) {
  const handleError = createCommandErrorHandler({
    commandName: 'switch-back',
    verbose: options.verbose || false,
    exitCode: 1
  });

  try {
    const context = await loadCurrentContext();

    if (!context || !context.previousProject) {
      console.log(chalk.yellow('\nNo previous project to switch back to.\n'));
      process.exit(1);
    }

    console.log(chalk.dim(`\nSwitching back to: ${context.previousProject.name}`));
    
    // Recursively call switch with previous project path
    await switchCommand(context.previousProject.path, options);

  } catch (error) {
    const wrappedError = error.code ? error : wrapError(error, 'CMD-PROJ-006', { 
      operation: 'switch-back' 
    });
    await handleError(wrappedError);
  }
}
