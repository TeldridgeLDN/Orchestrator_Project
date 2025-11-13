#!/usr/bin/env node

/**
 * CLI Interface for Podcast Learning Extraction
 * Provides interactive prompts and file-based input options
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import dotenv from 'dotenv';
import {
  validateInput,
  readFromFile,
  formatErrors,
  getDefaultContexts,
  displayInputSummary
} from './input-handler.js';
import { processEpisode } from './process.js';
import { createCommandErrorHandler } from '../utils/errors/index.js';

// Load environment variables
dotenv.config({ path: '../../.env' });
dotenv.config(); // Also try current directory

const program = new Command();

/**
 * Interactive prompt for episode metadata
 * @returns {Promise<Object>} - Episode metadata
 */
async function promptMetadata() {
  console.log(chalk.blue.bold('\n📋 Episode Metadata\n'));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: 'Episode title:',
      validate: (input) => input.trim().length >= 5 || 'Title must be at least 5 characters'
    },
    {
      type: 'input',
      name: 'guest',
      message: 'Guest name:',
      validate: (input) => input.trim().length >= 2 || 'Guest name must be at least 2 characters'
    },
    {
      type: 'input',
      name: 'episodeNumber',
      message: 'Episode number:',
      validate: (input) => {
        const num = parseInt(input, 10);
        return (!isNaN(num) && num > 0) || 'Must be a positive number';
      }
    },
    {
      type: 'input',
      name: 'date',
      message: 'Episode date (YYYY-MM-DD) [optional]:',
      default: new Date().toISOString().split('T')[0]
    },
    {
      type: 'input',
      name: 'duration',
      message: 'Duration (MM:SS or HH:MM:SS) [optional]:',
      default: ''
    }
  ]);

  return answers;
}

/**
 * Interactive prompt for content input
 * @returns {Promise<Object>} - Content data
 */
async function promptContent() {
  console.log(chalk.blue.bold('\n📝 Content Input\n'));
  
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'transcriptSource',
      message: 'How would you like to provide the transcript?',
      choices: ['File path', 'Paste text']
    },
    {
      type: 'input',
      name: 'transcriptFile',
      message: 'Path to transcript file:',
      when: (answers) => answers.transcriptSource === 'File path',
      validate: async (input) => {
        try {
          await readFromFile(input);
          return true;
        } catch (error) {
          return `Cannot read file: ${error.message}`;
        }
      }
    },
    {
      type: 'editor',
      name: 'transcriptText',
      message: 'Paste or type transcript (will open editor):',
      when: (answers) => answers.transcriptSource === 'Paste text',
      validate: (input) => input.trim().length >= 100 || 'Transcript must be at least 100 characters'
    },
    {
      type: 'list',
      name: 'showNotesSource',
      message: 'How would you like to provide the show notes?',
      choices: ['File path', 'Paste text']
    },
    {
      type: 'input',
      name: 'showNotesFile',
      message: 'Path to show notes file:',
      when: (answers) => answers.showNotesSource === 'File path',
      validate: async (input) => {
        try {
          await readFromFile(input);
          return true;
        } catch (error) {
          return `Cannot read file: ${error.message}`;
        }
      }
    },
    {
      type: 'editor',
      name: 'showNotesText',
      message: 'Paste or type show notes (will open editor):',
      when: (answers) => answers.showNotesSource === 'Paste text',
      validate: (input) => input.trim().length > 0 || 'Show notes cannot be empty'
    }
  ]);

  return answers;
}

/**
 * Interactive prompt for application contexts
 * @returns {Promise<Object>} - Contexts configuration
 */
async function promptContexts() {
  console.log(chalk.blue.bold('\n🎯 Application Contexts\n'));
  
  const { useDefaults } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useDefaults',
      message: 'Use default contexts (Personal Practice, Regular Work, Landing Page Business)?',
      default: true
    }
  ]);

  if (useDefaults) {
    return { contexts: getDefaultContexts() };
  }

  // Custom contexts (for future expansion)
  console.log(chalk.yellow('Custom contexts not yet implemented. Using defaults.'));
  return { contexts: getDefaultContexts() };
}

/**
 * Assembles complete input data from prompts
 * @returns {Promise<Object>} - Complete input data
 */
async function interactiveInput() {
  console.log(chalk.green.bold('\n🎙️  Podcast Learning Extraction - Interactive Input\n'));
  console.log(chalk.gray('This will guide you through providing episode data step by step.\n'));

  // Get metadata
  const metadata = await promptMetadata();

  // Get content
  const content = await promptContent();

  // Get contexts
  const { contexts } = await promptContexts();

  // Resolve content (from file or direct input)
  let transcript, showNotes;

  if (content.transcriptFile) {
    transcript = await readFromFile(content.transcriptFile);
    console.log(chalk.green(`✓ Loaded transcript from ${content.transcriptFile}`));
  } else {
    transcript = content.transcriptText;
  }

  if (content.showNotesFile) {
    showNotes = await readFromFile(content.showNotesFile);
    console.log(chalk.green(`✓ Loaded show notes from ${content.showNotesFile}`));
  } else {
    showNotes = content.showNotesText;
  }

  return {
    metadata,
    transcript,
    showNotes,
    contexts
  };
}

/**
 * Processes and validates input data
 * @param {Object} inputData - Raw input data
 * @returns {Object} - Validated data or null if invalid
 */
function processInput(inputData) {
  console.log(chalk.blue('\n🔍 Validating input...\n'));

  const validation = validateInput(inputData);

  if (!validation.valid) {
    console.error(formatErrors(validation.errors));
    return null;
  }

  displayInputSummary(validation.data);
  return validation.data;
}

// CLI Commands

program
  .name('podcast-learning')
  .description('CLI tool for podcast learning extraction')
  .version('1.0.0');

program
  .command('input')
  .description('Start interactive input for podcast episode data')
  .action(async () => {
    try {
      const inputData = await interactiveInput();
      const validatedData = processInput(inputData);

      if (validatedData) {
        console.log(chalk.green.bold('\n✅ Input complete and validated!\n'));
        console.log(chalk.cyan('Next: This data will be passed to the insight extractor.'));
        console.log(chalk.gray('(Processing pipeline not yet implemented)\n'));
        
        // Save to temp file for now (will integrate with pipeline later)
        const outputDir = path.join(process.cwd(), '../../outputs/podcast-learning');
        const outputPath = path.join(outputDir, 'temp-input.json');
        const fs = await import('fs/promises');
        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(outputPath, JSON.stringify(validatedData, null, 2));
        console.log(chalk.gray(`Input data saved to: ${outputPath}\n`));
      } else {
        console.error(chalk.red('\n❌ Input validation failed. Please fix errors and try again.\n'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      process.exit(1);
    }
  });

program
  .command('input-from-files')
  .description('Provide input via file paths (non-interactive)')
  .requiredOption('-t, --transcript <path>', 'Path to transcript file')
  .requiredOption('-s, --show-notes <path>', 'Path to show notes file')
  .requiredOption('--title <title>', 'Episode title')
  .requiredOption('--guest <name>', 'Guest name')
  .requiredOption('--episode <number>', 'Episode number')
  .option('--date <date>', 'Episode date (YYYY-MM-DD)')
  .option('--duration <duration>', 'Episode duration (MM:SS or HH:MM:SS)')
  .action(async (options) => {
    try {
      console.log(chalk.blue('\n📂 Loading input from files...\n'));

      const transcript = await readFromFile(options.transcript);
      const showNotes = await readFromFile(options.showNotes);

      const inputData = {
        metadata: {
          title: options.title,
          guest: options.guest,
          episodeNumber: options.episode,
          date: options.date,
          duration: options.duration
        },
        transcript,
        showNotes,
        contexts: getDefaultContexts()
      };

      const validatedData = processInput(inputData);

      if (validatedData) {
        console.log(chalk.green.bold('\n✅ Input complete and validated!\n'));
        
        // Save to temp file
        const outputDir = path.join(process.cwd(), '../../outputs/podcast-learning');
        const outputPath = path.join(outputDir, 'temp-input.json');
        const fs = await import('fs/promises');
        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(outputPath, JSON.stringify(validatedData, null, 2));
        console.log(chalk.gray(`Input data saved to: ${outputPath}\n`));
      } else {
        console.error(chalk.red('\n❌ Input validation failed. Please fix errors and try again.\n'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate input files without processing')
  .requiredOption('-t, --transcript <path>', 'Path to transcript file')
  .requiredOption('-s, --show-notes <path>', 'Path to show notes file')
  .action(async (options) => {
    try {
      const transcript = await readFromFile(options.transcript);
      const showNotes = await readFromFile(options.showNotes);

      const inputData = {
        metadata: {
          title: 'Test Episode',
          guest: 'Test Guest',
          episodeNumber: '1'
        },
        transcript,
        showNotes,
        contexts: getDefaultContexts()
      };

      const validation = validateInput(inputData);

      if (validation.valid) {
        console.log(chalk.green.bold('\n✅ Validation successful!\n'));
        displayInputSummary(validation.data);
      } else {
        console.error(formatErrors(validation.errors));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      process.exit(1);
    }
  });

program
  .command('process')
  .description('Process an episode through the complete extraction pipeline')
  .requiredOption('-t, --transcript <path>', 'Path to transcript file')
  .requiredOption('-s, --show-notes <path>', 'Path to show notes file')
  .requiredOption('--title <title>', 'Episode title')
  .requiredOption('--guest <name>', 'Guest name')
  .requiredOption('--episode <number>', 'Episode number')
  .option('--date <date>', 'Episode date (YYYY-MM-DD)')
  .option('--duration <duration>', 'Episode duration (MM:SS or HH:MM:SS)')
  .option('--no-save', 'Do not save output to file')
  .option('-q, --quiet', 'Minimal output (less verbose)')
  .option('--test', 'Use test mode with pre-generated insights (no API key required)')
  .option('--skip-refs', 'Skip reference link validation')
  .action(async (options) => {
    try {
      console.log(chalk.blue('\n📂 Loading input from files...\n'));

      const transcript = await readFromFile(options.transcript);
      const showNotes = await readFromFile(options.showNotes);

      const inputData = {
        metadata: {
          title: options.title,
          guest: options.guest,
          episodeNumber: options.episode,
          date: options.date,
          duration: options.duration
        },
        transcript,
        showNotes,
        contexts: getDefaultContexts()
      };

      const result = await processEpisode(inputData, {
        validateFirst: true,
        saveOutput: options.save !== false,
        verbose: !options.quiet,
        testMode: options.test || false,
        validateReferences: !options.skipRefs
      });

      if (result.success) {
        console.log(chalk.green.bold('\n🎉 Episode processed successfully!\n'));
        console.log(chalk.cyan('Next steps:'));
        console.log(chalk.white('  • Review extracted insights'));
        console.log(chalk.white('  • Validate reference links'));
        console.log(chalk.white('  • Generate action items'));
        console.log(chalk.white('  • Create markdown report\n'));
      } else {
        console.error(chalk.red('\n❌ Processing failed\n'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      if (error.stack && !options.quiet) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

program.parse();

