/**
 * diet103 Validate Command
 * 
 * Validates diet103 infrastructure and optionally repairs issues.
 * 
 * @module commands/validate
 * @version 1.0.0
 */

import path from 'path';
import chalk from 'chalk';
import {
  detectDiet103Infrastructure,
  analyzeDiet103Gaps,
  validateDiet103Consistency
} from '../utils/diet103-validator.js';
import { repairDiet103Infrastructure } from '../utils/diet103-repair.js';
import { createCommandErrorHandler, wrapError } from '../utils/errors/index.js';

/**
 * Generate a comprehensive validation report
 * 
 * @param {Object} checks - Detection results
 * @param {Object} gaps - Gap analysis results
 * @param {Array<string>} consistency - Consistency issues
 * @param {Object} options - Command options
 * @returns {Object} Validation report
 */
export function generateValidationReport(checks, gaps, consistency, options = {}) {
  const { verbose = false } = options;

  const report = {
    score: gaps.score,
    isComplete: gaps.isComplete,
    diet103Version: checks.diet103Version,
    components: {
      critical: {
        total: 7,
        present: 7 - gaps.critical.length,
        missing: gaps.critical
      },
      important: {
        total: 5,
        present: 5 - gaps.important.length,
        missing: gaps.important
      }
    },
    consistency: {
      valid: consistency.length === 0,
      issues: consistency
    }
  };

  // Add detailed checks in verbose mode
  if (verbose) {
    report.detailedChecks = checks;
  }

  return report;
}

/**
 * Format and display validation report
 * 
 * @param {Object} report - Validation report
 * @param {Object} options - Display options
 */
export function displayValidationReport(report, options = {}) {
  const { verbose = false, threshold = 70 } = options;

  console.log('\n' + chalk.bold('diet103 Infrastructure Validation Report'));
  console.log('─'.repeat(60));

  // Overall score
  const scoreColor = report.score >= threshold ? chalk.green : chalk.red;
  console.log(`\n${chalk.bold('Overall Score:')} ${scoreColor(report.score + '%')}`);
  
  if (report.diet103Version) {
    console.log(`${chalk.bold('diet103 Version:')} ${report.diet103Version}`);
  }

  // Critical components
  console.log(`\n${chalk.bold('Critical Components:')} ${report.components.critical.present}/${report.components.critical.total}`);
  if (report.components.critical.missing.length > 0) {
    console.log(chalk.red('  Missing:'));
    report.components.critical.missing.forEach(item => {
      console.log(chalk.red(`    ✗ ${item}`));
    });
  } else {
    console.log(chalk.green('  ✓ All critical components present'));
  }

  // Important components
  console.log(`\n${chalk.bold('Important Components:')} ${report.components.important.present}/${report.components.important.total}`);
  if (report.components.important.missing.length > 0) {
    console.log(chalk.yellow('  Missing:'));
    report.components.important.missing.forEach(item => {
      console.log(chalk.yellow(`    ! ${item}`));
    });
  } else {
    console.log(chalk.green('  ✓ All important components present'));
  }

  // Consistency issues
  console.log(`\n${chalk.bold('Consistency Check:')}`);
  if (report.consistency.valid) {
    console.log(chalk.green('  ✓ No consistency issues detected'));
  } else {
    const errors = report.consistency.issues.filter(issue => !issue.startsWith('Warning:'));
    const warnings = report.consistency.issues.filter(issue => issue.startsWith('Warning:'));

    if (errors.length > 0) {
      console.log(chalk.red(`  ✗ ${errors.length} error(s) found:`));
      errors.forEach(issue => {
        console.log(chalk.red(`    • ${issue}`));
      });
    }

    if (warnings.length > 0 && verbose) {
      console.log(chalk.yellow(`  ! ${warnings.length} warning(s):`));
      warnings.forEach(issue => {
        console.log(chalk.yellow(`    • ${issue.replace('Warning: ', '')}`));
      });
    }
  }

  // Detailed checks (verbose mode)
  if (verbose && report.detailedChecks) {
    console.log(`\n${chalk.bold('Detailed Component Status:')}`);
    const checks = report.detailedChecks;
    
    const displayCheck = (label, value) => {
      const status = value ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${status} ${label}`);
    };

    displayCheck('.claude/ directory', checks.hasDotClaude);
    displayCheck('Claude.md', checks.hasClaudeMd);
    displayCheck('metadata.json', checks.hasMetadata);
    displayCheck('skill-rules.json', checks.hasSkillRules);
    displayCheck('hooks/', checks.hasHooks);
    displayCheck('hooks/UserPromptSubmit.js', checks.hasUserPromptSubmit);
    displayCheck('hooks/PostToolUse.js', checks.hasPostToolUse);
    displayCheck('skills/', checks.hasSkillsDir);
    displayCheck('commands/', checks.hasCommandsDir);
    displayCheck('agents/', checks.hasAgentsDir);
    displayCheck('resources/', checks.hasResourcesDir);
    displayCheck('README.md', checks.hasReadme);
  }

  console.log('\n' + '─'.repeat(60) + '\n');
}

/**
 * Display repair results
 * 
 * @param {Object} repairResult - Repair operation results
 */
export function displayRepairResults(repairResult) {
  console.log(chalk.bold('\nRepair Results:'));
  console.log('─'.repeat(60));

  console.log(`${chalk.bold('Score Before:')} ${repairResult.before.score}%`);
  console.log(`${chalk.bold('Score After:')} ${repairResult.after.score}%`);
  console.log(`${chalk.bold('Components Installed:')} ${repairResult.totalInstalled}`);

  if (repairResult.installed.critical.length > 0) {
    console.log(`\n${chalk.green('Critical components installed:')}`);
    repairResult.installed.critical.forEach(item => {
      console.log(chalk.green(`  ✓ ${item}`));
    });
  }

  if (repairResult.installed.important.length > 0) {
    console.log(`\n${chalk.green('Important components installed:')}`);
    repairResult.installed.important.forEach(item => {
      console.log(chalk.green(`  ✓ ${item}`));
    });
  }

  if (repairResult.success) {
    console.log(chalk.green('\n✓ Repair completed successfully!'));
  } else {
    console.log(chalk.yellow('\n! Repair completed with warnings'));
  }

  console.log('─'.repeat(60) + '\n');
}

/**
 * Validate command handler
 * 
 * @param {string} projectPath - Path to project (optional, defaults to cwd)
 * @param {Object} options - Command options
 */
export async function validateCommand(projectPath, options) {
  const handleError = createCommandErrorHandler({
    commandName: 'validate',
    verbose: options.verbose || false,
    exitCode: 1
  });

  try {
    // Resolve project path
    const targetPath = projectPath ? path.resolve(projectPath) : process.cwd();
    const threshold = parseInt(options.threshold, 10);

    if (options.verbose) {
      console.log(chalk.dim(`\nValidating: ${targetPath}`));
    }

    // Step 1: Detect infrastructure
    if (options.verbose) {
      console.log(chalk.dim('Detecting diet103 infrastructure...'));
    }
    const checks = await detectDiet103Infrastructure(targetPath);

    // Step 2: Analyze gaps
    if (options.verbose) {
      console.log(chalk.dim('Analyzing infrastructure gaps...'));
    }
    const gaps = analyzeDiet103Gaps(checks);

    // Step 3: Validate consistency
    if (options.verbose) {
      console.log(chalk.dim('Validating consistency...'));
    }
    const consistency = await validateDiet103Consistency(targetPath);

    // Step 4: Generate report
    const report = generateValidationReport(checks, gaps, consistency, {
      verbose: options.verbose
    });

    // Step 5: Display report
    displayValidationReport(report, {
      verbose: options.verbose,
      threshold
    });

    // Step 6: Repair if requested
    if (options.repair) {
      if (gaps.score < 100) {
        console.log(chalk.bold('Initiating auto-repair...'));
        
        const repairResult = await repairDiet103Infrastructure(targetPath, {
          installImportant: options.important !== false,
          variables: {
            PROJECT_NAME: path.basename(targetPath)
          }
        });

        displayRepairResults(repairResult);

        // Re-validate after repair
        if (options.verbose) {
          console.log(chalk.dim('Re-validating after repair...'));
          const afterChecks = await detectDiet103Infrastructure(targetPath);
          const afterGaps = analyzeDiet103Gaps(afterChecks);
          const afterConsistency = await validateDiet103Consistency(targetPath);
          const afterReport = generateValidationReport(
            afterChecks,
            afterGaps,
            afterConsistency,
            { verbose: options.verbose }
          );
          
          console.log(chalk.bold('\nPost-Repair Validation:'));
          displayValidationReport(afterReport, {
            verbose: options.verbose,
            threshold
          });
        }
      } else {
        console.log(chalk.green('\n✓ No repair needed - infrastructure is complete!'));
      }
    }

    // Step 7: Exit with appropriate code based on threshold
    // Use final score after repair if repair was performed
    let finalScore = report.score;
    if (options.repair && gaps.score < 100) {
      const afterChecks = await detectDiet103Infrastructure(targetPath);
      const afterGaps = analyzeDiet103Gaps(afterChecks);
      finalScore = afterGaps.score;
    }

    if (finalScore < threshold) {
      console.log(chalk.red(`✗ Validation failed: Score ${finalScore}% is below threshold ${threshold}%`));
      process.exit(1);
    } else {
      console.log(chalk.green(`✓ Validation passed: Score ${finalScore}% meets threshold ${threshold}%`));
      process.exit(0);
    }

  } catch (error) {
    const wrappedError = error.code ? error : wrapError(error, 'CMD-VAL-001', { 
      project: projectPath || process.cwd() 
    });
    await handleError(wrappedError);
  }
}

