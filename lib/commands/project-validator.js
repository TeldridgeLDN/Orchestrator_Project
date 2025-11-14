/**
 * Project Validator Command Integration
 * 
 * Integrates the project-validator tool into the diet103 CLI.
 * Wraps the existing CommonJS validator in ES module interface.
 * 
 * @module commands/project-validator
 * @version 1.3.0 (Phase 3 Feature 1)
 */

import { createRequire } from 'module';
import path from 'path';
import { promises as fs } from 'fs';
import chalk from 'chalk';
import { createCommandErrorHandler } from '../utils/errors/index.js';
import { fileURLToPath } from 'url';

// Create require for CommonJS modules
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the CommonJS validator
const validatorPath = path.join(__dirname, '../project-validator/validator.js');
const ProjectValidator = require(validatorPath);

/**
 * Validate project identity command
 * 
 * @param {Object} options - Command options
 * @param {string} [options.path] - Project path (defaults to cwd)
 * @param {boolean} [options.verbose] - Show detailed output
 * @param {boolean} [options.json] - Output as JSON
 */
export async function validateProjectCommand(options = {}) {
  const handleError = createCommandErrorHandler({
    commandName: 'project-validator',
    verbose: options.verbose !== false,
    exitCode: 1
  });

  try {
    const projectRoot = options.path ? path.resolve(options.path) : process.cwd();
    const validator = new ProjectValidator(projectRoot);

    if (!options.json) {
      console.log(chalk.cyan('\n🔍 Validating project identity...\n'));
    }

    const validation = await validator.validate();

    if (options.json) {
      console.log(JSON.stringify(validation, null, 2));
    } else {
      const report = validator.generateReport(validation);
      console.log(report);
    }

    if (!validation.isConsistent) {
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    await handleError(error);
  }
}

/**
 * Validate PRD file against project identity
 * 
 * @param {string} prdPath - Path to PRD file
 * @param {Object} options - Command options
 * @param {string} [options.path] - Project path (defaults to cwd)
 * @param {boolean} [options.verbose] - Show detailed output
 */
export async function checkPRDCommand(prdPath, options = {}) {
  const handleError = createCommandErrorHandler({
    commandName: 'project-check-prd',
    verbose: options.verbose !== false,
    exitCode: 1
  });

  try {
    const projectRoot = options.path ? path.resolve(options.path) : process.cwd();
    const validator = new ProjectValidator(projectRoot);

    console.log(chalk.cyan('\n🔍 Validating PRD against project identity...\n'));

    const absolutePrdPath = path.resolve(projectRoot, prdPath);

    // Check if PRD file exists
    try {
      await fs.access(absolutePrdPath);
    } catch {
      console.log(chalk.red(`✗ PRD file not found: ${prdPath}\n`));
      process.exit(1);
    }

    const prdValidation = await validator.validatePRD(absolutePrdPath);

    // Display results
    if (prdValidation.isValid) {
      console.log(chalk.green('✅ Validation passed!'));
      console.log(chalk.dim(`   PRD project matches: ${prdValidation.prdProjectName}`));
    } else {
      console.log(chalk.red('❌ Validation failed!'));
      console.log(chalk.yellow(`\n⚠️  Project Mismatch Detected:`));
      console.log(chalk.dim(`   PRD Project:      ${prdValidation.prdProjectName}`));
      console.log(chalk.dim(`   Canonical Name:   ${prdValidation.canonicalName}`));
      console.log(chalk.dim(`\n   This PRD appears to be for "${prdValidation.prdProjectName}"`));
      console.log(chalk.dim(`   but you're in "${prdValidation.canonicalName}".\n`));
      
      console.log(chalk.cyan('💡 Suggested Actions:'));
      console.log(chalk.dim('   1. Verify you are in the correct project directory'));
      console.log(chalk.dim('   2. Check if the PRD header is correct'));
      console.log(chalk.dim('   3. Update the PRD **Project:** field if this is the right project\n'));

      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    await handleError(error);
  }
}

/**
 * Auto-fix project identity mismatches
 * 
 * @param {Object} options - Command options
 * @param {string} [options.path] - Project path (defaults to cwd)
 * @param {boolean} [options.yes] - Skip confirmation prompts
 * @param {boolean} [options.verbose] - Show detailed output
 */
export async function fixProjectCommand(options = {}) {
  const handleError = createCommandErrorHandler({
    commandName: 'project-fix',
    verbose: options.verbose !== false,
    exitCode: 1
  });

  try {
    const projectRoot = options.path ? path.resolve(options.path) : process.cwd();
    const validator = new ProjectValidator(projectRoot);

    console.log(chalk.cyan('\n🔧 Attempting to fix project identity issues...\n'));

    const fixResult = await validator.autoFix({ skipConfirmation: options.yes });

    if (fixResult.fixed) {
      console.log(chalk.green('✅ Fix completed!'));
      if (fixResult.actions && fixResult.actions.length > 0) {
        console.log(chalk.dim('\nActions taken:'));
        fixResult.actions.forEach(action => {
          console.log(chalk.dim(`  - ${action}`));
        });
      }
    } else {
      console.log(chalk.yellow('⚠️  No issues found or unable to fix automatically.'));
      if (fixResult.message) {
        console.log(chalk.dim(`\n${fixResult.message}\n`));
      }
    }

    console.log('');
    process.exit(0);
  } catch (error) {
    await handleError(error);
  }
}

/**
 * Generate project badges
 * 
 * @param {Object} options - Command options
 * @param {string} [options.path] - Project path (defaults to cwd)
 * @param {string} [options.style] - Badge style (simple, html, shields)
 * @param {string} [options.color] - Badge color
 * @param {boolean} [options.verbose] - Show detailed output
 */
export async function generateBadgeCommand(options = {}) {
  const handleError = createCommandErrorHandler({
    commandName: 'project-badges-generate',
    verbose: options.verbose !== false,
    exitCode: 1
  });

  try {
    const projectRoot = options.path ? path.resolve(options.path) : process.cwd();
    
    // Import badge generator (CommonJS)
    const badgeGeneratorPath = path.join(__dirname, '../project-validator/badge-generator.js');
    const BadgeGenerator = require(badgeGeneratorPath);

    // Get project name
    const validator = new ProjectValidator(projectRoot);
    await validator.gatherSignals();
    const projectName = validator.signals.directoryName;

    const generator = new BadgeGenerator(projectName);

    // Generate badge based on style
    let badge;
    const style = options.style || 'simple';
    switch (style) {
      case 'html':
        badge = generator.generateHtmlBadge({ color: options.color });
        break;
      case 'markdown':
      case 'shields':
        badge = generator.generateMarkdownBadge({ color: options.color });
        break;
      case 'svg':
        badge = generator.generateSvgBadge({ color: options.color });
        break;
      case 'simple':
      default:
        badge = generator.generateSimpleBadge();
        break;
    }

    console.log(chalk.green('\n✅ Badge generated:\n'));
    console.log(badge);
    console.log('');

    process.exit(0);
  } catch (error) {
    await handleError(error);
  }
}

/**
 * Inject project badge into documentation file
 * 
 * @param {string} targetFile - File to inject badge into
 * @param {Object} options - Command options
 * @param {string} [options.path] - Project path (defaults to cwd)
 * @param {string} [options.style] - Badge style
 * @param {boolean} [options.verbose] - Show detailed output
 */
export async function injectBadgeCommand(targetFile, options = {}) {
  const handleError = createCommandErrorHandler({
    commandName: 'project-badges-inject',
    verbose: options.verbose !== false,
    exitCode: 1
  });

  try {
    const projectRoot = options.path ? path.resolve(options.path) : process.cwd();
    const absoluteTargetPath = path.resolve(projectRoot, targetFile);

    // Check if target file exists
    try {
      await fs.access(absoluteTargetPath);
    } catch {
      console.log(chalk.red(`✗ Target file not found: ${targetFile}\n`));
      process.exit(1);
    }

    // Import badge generator (CommonJS)
    const badgeGeneratorPath = path.join(__dirname, '../project-validator/badge-generator.js');
    const BadgeGenerator = require(badgeGeneratorPath);

    // Get project name
    const validator = new ProjectValidator(projectRoot);
    await validator.gatherSignals();
    const projectName = validator.signals.directoryName;

    const generator = new BadgeGenerator(projectName);

    const result = await generator.injectIntoFile(absoluteTargetPath);

    if (result.injected) {
      console.log(chalk.green(`✅ Badge injected into ${targetFile}`));
    } else {
      console.log(chalk.yellow(`⚠️  Badge already exists in ${targetFile}`));
    }

    console.log('');
    process.exit(0);
  } catch (error) {
    await handleError(error);
  }
}

