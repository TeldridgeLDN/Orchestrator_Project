#!/usr/bin/env node

/**
 * Project Validator CLI
 * 
 * Command-line interface for project identity validation
 */

const ProjectValidator = require('./validator');
const path = require('path');
const fs = require('fs').promises;

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${COLORS[color] || ''}${text}${COLORS.reset}`;
}

async function validateCommand(options) {
  const projectRoot = options.projectRoot || process.cwd();
  const validator = new ProjectValidator(projectRoot);

  console.log(colorize('\n🔍 Validating project identity...\n', 'cyan'));

  const validation = await validator.validate();
  const report = validator.generateReport(validation);

  console.log(report);

  if (!validation.isConsistent) {
    process.exit(1);
  }
}

async function validatePrdCommand(prdPath, options) {
  const projectRoot = options.projectRoot || process.cwd();
  const validator = new ProjectValidator(projectRoot);

  console.log(colorize('\n🔍 Validating PRD against project identity...\n', 'cyan'));

  const absolutePrdPath = path.resolve(projectRoot, prdPath);

  try {
    await fs.access(absolutePrdPath);
  } catch (error) {
    console.error(colorize(`\n❌ Error: PRD file not found: ${prdPath}\n`, 'red'));
    process.exit(1);
  }

  const validation = await validator.validatePrd(absolutePrdPath);
  const report = validator.generateReport(validation);

  console.log(report);

  if (!validation.isConsistent) {
    if (options.interactive) {
      // Interactive mode: prompt user
      console.log(colorize('\n⚠️  Project identity mismatch detected!', 'yellow'));
      console.log('\nWhat would you like to do?');
      console.log('  1. Update PRD to match current project');
      console.log('  2. Switch to correct project directory');
      console.log('  3. Confirm this is intentional cross-project work');
      console.log('  4. Cancel');

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      readline.question('\nEnter choice (1-4): ', (answer) => {
        readline.close();
        
        if (answer === '3') {
          console.log(colorize('\n✅ Cross-project work confirmed. Proceeding with caution.\n', 'green'));
          process.exit(0);
        } else if (answer === '1' || answer === '2') {
          console.log(colorize('\n💡 Please make the necessary changes and run validation again.\n', 'cyan'));
          process.exit(1);
        } else {
          console.log(colorize('\n🛑 Cancelled.\n', 'red'));
          process.exit(1);
        }
      });
    } else {
      // Non-interactive: just fail
      console.log(colorize('\n🛑 Validation failed. Use --interactive for options.\n', 'red'));
      process.exit(1);
    }
  } else {
    console.log(colorize('\n✅ Validation passed!\n', 'green'));
  }
}

async function fixCommand(options) {
  const projectRoot = options.projectRoot || process.cwd();
  const validator = new ProjectValidator(projectRoot);

  console.log(colorize('\n🔧 Attempting to fix project identity issues...\n', 'cyan'));

  await validator.gatherSignals();
  const canonical = validator.determineCanonicalName();

  // Update config.json if needed
  const configPath = path.join(projectRoot, '.taskmaster/config.json');
  
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);

    if (config.global?.projectName !== canonical) {
      config.global.projectName = canonical;
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      console.log(colorize(`✅ Updated config.json projectName to "${canonical}"`, 'green'));
    } else {
      console.log(colorize(`✅ Config.json projectName already correct: "${canonical}"`, 'green'));
    }
  } catch (error) {
    console.error(colorize(`\n❌ Error updating config.json: ${error.message}\n`, 'red'));
    process.exit(1);
  }

  console.log(colorize('\n✅ Fix completed!\n', 'green'));
}

// CLI argument parsing
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'help' || command === '--help' || command === '-h') {
  console.log(`
${colorize('Project Validator', 'cyan')} - Validate project identity consistency

${colorize('Usage:', 'yellow')}
  project-validate validate [options]
  project-validate prd <prd-file> [options]
  project-validate fix [options]

${colorize('Commands:', 'yellow')}
  validate              Validate current project identity
  prd <file>           Validate PRD against project identity
  fix                  Attempt to fix project identity issues

${colorize('Options:', 'yellow')}
  --project-root <path>  Project root directory (default: current directory)
  --interactive         Interactive mode for PRD validation
  --help, -h           Show this help message

${colorize('Examples:', 'yellow')}
  project-validate validate
  project-validate prd .taskmaster/docs/sprint3_prd.txt
  project-validate prd sprint3.txt --interactive
  project-validate fix
  `);
  process.exit(0);
}

// Parse options
const options = {
  projectRoot: null,
  interactive: args.includes('--interactive'),
};

const projectRootIndex = args.indexOf('--project-root');
if (projectRootIndex !== -1 && args[projectRootIndex + 1]) {
  options.projectRoot = args[projectRootIndex + 1];
}

// Execute command
(async () => {
  try {
    if (command === 'validate') {
      await validateCommand(options);
    } else if (command === 'prd') {
      const prdPath = args[1];
      if (!prdPath) {
        console.error(colorize('\n❌ Error: PRD file path required\n', 'red'));
        console.log('Usage: project-validate prd <prd-file>\n');
        process.exit(1);
      }
      await validatePrdCommand(prdPath, options);
    } else if (command === 'fix') {
      await fixCommand(options);
    } else {
      console.error(colorize(`\n❌ Unknown command: ${command}\n`, 'red'));
      console.log('Run "project-validate help" for usage information.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error(colorize(`\n❌ Error: ${error.message}\n`, 'red'));
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
})();

