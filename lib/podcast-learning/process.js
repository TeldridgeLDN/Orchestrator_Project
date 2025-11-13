/**
 * Processing pipeline for podcast learning extraction
 * Orchestrates the flow from input validation to insight extraction
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { validateInput, displayInputSummary } from './input-handler.js';
import { 
  initializeClient, 
  extractInsights, 
  displayInsights,
  getApiKey 
} from './insight-extractor.js';
import {
  validateUrls,
  displayValidationResults,
  groupResultsByStatus
} from './reference-parser.js';
import {
  categorizeReferences,
  displayCategorizedReferences,
  getCategoryStats
} from './reference-categorizer.js';
import {
  generateActions,
  displayActions,
  validateActions
} from './action-generator.js';
import {
  generateReport
} from './markdown-generator.js';

/**
 * Processes input data through the extraction pipeline
 * @param {Object} inputData - Validated input data
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Processing result
 */
export async function processEpisode(inputData, options = {}) {
  const {
    validateFirst = true,
    saveOutput = true,
    verbose = true,
    testMode = false,
    validateReferences = true,
    categorizeReferences: categorizeRefs = true,
    generateActionItems = true,
    generateMarkdownReport = true
  } = options;

  console.log(chalk.green.bold('\n🎙️  Podcast Learning Extraction Pipeline\n'));

  let totalSteps = 3; // Base: validate, extract, output
  if (validateReferences) totalSteps++;
  if (categorizeRefs) totalSteps++;
  if (generateActionItems) totalSteps++;
  if (generateMarkdownReport) totalSteps++;
  let currentStep = 1;

  // Step 1: Validate input
  if (validateFirst) {
    console.log(chalk.blue(`Step ${currentStep}/${totalSteps}: Validating input data...\n`));
    
    const validation = validateInput(inputData);
    
    if (!validation.valid) {
      console.error(chalk.red('❌ Validation failed:\n'));
      validation.errors.forEach(err => console.error(chalk.red(`  • ${err}`)));
      throw new Error('Input validation failed');
    }
    
    if (verbose) {
      displayInputSummary(validation.data);
    } else {
      console.log(chalk.green('✓ Input validated\n'));
    }
    
    inputData = validation.data;
    currentStep++;
  }

  // Step 2: Extract insights
  console.log(chalk.blue(`Step ${currentStep}/${totalSteps}: Extracting insights with Claude API...\n`));
  currentStep++;
  
  let apiKey;
  try {
    apiKey = getApiKey();
  } catch (error) {
    console.error(chalk.red(`❌ ${error.message}\n`));
    throw error;
  }

  const client = initializeClient(apiKey);
  
  const extractionResult = await extractInsights(client, inputData, {
    logToFile: true,
    testMode
  });

  if (!extractionResult.success) {
    throw new Error(`Insight extraction failed: ${extractionResult.error}`);
  }

  if (verbose) {
    displayInsights(extractionResult.insights);
  }

  // Step 3: Validate reference links
  let referenceResults = [];
  if (validateReferences && inputData.extractedLinks && inputData.extractedLinks.length > 0) {
    console.log(chalk.blue(`Step ${currentStep}/${totalSteps}: Validating reference links...\n`));
    currentStep++;
    
    referenceResults = await validateUrls(inputData.extractedLinks, {
      concurrency: 3,
      delayMs: 500,
      logProgress: verbose
    });

    if (verbose) {
      displayValidationResults(referenceResults);
    }
  } else if (validateReferences) {
    console.log(chalk.yellow('⚠️  No reference links to validate\n'));
    currentStep++;
  }

  // Step 4: Categorize references
  let categorizedReferences = [];
  if (categorizeRefs && referenceResults.length > 0) {
    console.log(chalk.blue(`Step ${currentStep}/${totalSteps}: Categorizing references...\n`));
    currentStep++;
    
    const { categorizeReferences: categorizeFn } = await import('./reference-categorizer.js');
    
    categorizedReferences = await categorizeFn(referenceResults, {
      useAI: false, // Can be enabled later
      logProgress: verbose
    });

    if (verbose) {
      displayCategorizedReferences(categorizedReferences);
    }
  } else if (categorizeRefs && referenceResults.length === 0 && inputData.extractedLinks?.length > 0) {
    // No validation results, but we have links - create basic structure
    categorizedReferences = inputData.extractedLinks.map(url => ({
      url,
      valid: true,
      reachable: false,
      validated: false,
      category: 'unknown'
    }));
    currentStep++;
  } else if (categorizeRefs) {
    currentStep++;
  }

  // Step 5: Generate action items
  let generatedActions = [];
  if (generateActionItems && inputData.contexts && inputData.contexts.length > 0) {
    console.log(chalk.blue(`Step ${currentStep}/${totalSteps}: Generating action items...\n`));
    currentStep++;

    const actionResult = await generateActions(
      client,
      extractionResult.insights,
      inputData.contexts,
      inputData.metadata,
      {
        logToFile: true,
        testMode
      }
    );

    if (!actionResult.success) {
      throw new Error('Action generation failed');
    }

    generatedActions = actionResult.actions;

    // Validate actions
    const validation = validateActions(generatedActions, inputData.contexts);
    if (!validation.valid) {
      console.error(chalk.red('\n⚠️  Action validation failed:'));
      validation.errors.forEach(error => console.error(chalk.red(`  • ${error}`)));
    }
    if (validation.warnings.length > 0 && verbose) {
      console.log(chalk.yellow('\nWarnings:'));
      validation.warnings.forEach(warning => console.log(chalk.yellow(`  • ${warning}`)));
    }

    if (verbose) {
      displayActions(generatedActions);
    }
  } else if (generateActionItems) {
    console.log(chalk.yellow('⚠️  No contexts provided for action generation\n'));
    currentStep++;
  }

  // Step 6: Prepare output data
  console.log(chalk.blue(`Step ${currentStep}/${totalSteps}: Preparing output...\n`));

  const output = {
    episode: {
      title: inputData.metadata.title,
      guest: inputData.metadata.guest,
      episodeNumber: inputData.metadata.episodeNumber,
      date: inputData.metadata.date,
      duration: inputData.metadata.duration
    },
    insights: extractionResult.insights,
    references: categorizedReferences.length > 0 
      ? categorizedReferences 
      : (referenceResults.length > 0 
          ? referenceResults 
          : inputData.extractedLinks.map(url => ({ url, validated: false, category: 'unknown' }))),
    actions: generatedActions,
    contexts: inputData.contexts,
    metadata: {
      processedAt: new Date().toISOString(),
      ...extractionResult.metadata,
      referencesValidated: referenceResults.length > 0,
      referencesCategorized: categorizedReferences.length > 0,
      actionsGenerated: generatedActions.length > 0
    }
  };

  if (saveOutput) {
    const outputPath = await saveResult(output, inputData.metadata);
    console.log(chalk.green(`✓ JSON results saved to: ${outputPath}\n`));
  }

  currentStep++;

  // Step 7: Generate markdown report
  let markdownPath = null;
  if (generateMarkdownReport) {
    console.log(chalk.blue(`Step ${currentStep}/${totalSteps}: Generating markdown report...\n`));
    
    const reportResult = await generateReport(output, {
      saveToFile: saveOutput,
      verbose
    });

    if (reportResult.success) {
      markdownPath = reportResult.filePath;
    }
  }

  console.log(chalk.green.bold('✅ Processing complete!\n'));
  console.log(chalk.cyan('Summary:'));
  console.log(chalk.white(`  • Insights extracted: ${extractionResult.insights.length}`));
  console.log(chalk.white(`  • Reference links: ${inputData.extractedLinks.length} total`));
  
  if (referenceResults.length > 0) {
    const grouped = groupResultsByStatus(referenceResults);
    console.log(chalk.green(`    ✓ Reachable: ${grouped.reachable.length}`));
    if (grouped.broken.length > 0) {
      console.log(chalk.yellow(`    ⚠️  Broken: ${grouped.broken.length}`));
    }
    if (grouped.invalid.length > 0) {
      console.log(chalk.red(`    ❌ Invalid: ${grouped.invalid.length}`));
    }
  }
  
  if (categorizedReferences.length > 0) {
    const stats = getCategoryStats(categorizedReferences);
    console.log(chalk.white(`  • Categories: ${Object.keys(stats.byCategory).length} types identified`));
  }
  
  if (generatedActions.length > 0) {
    const totalActions = generatedActions.reduce((sum, ctx) => sum + ctx.actions.length, 0);
    console.log(chalk.white(`  • Action items: ${totalActions} across ${generatedActions.length} contexts`));
  }
  
  console.log(chalk.white(`  • Processing time: ${extractionResult.metadata.duration}ms`));
  console.log(chalk.white(`  • Tokens used: ${extractionResult.metadata.usage.input_tokens + extractionResult.metadata.usage.output_tokens}\n`));

  return {
    success: true,
    output,
    insights: extractionResult.insights,
    metadata: extractionResult.metadata,
    markdownPath
  };
}

/**
 * Saves processing result to file
 * @param {Object} output - Processing output
 * @param {Object} metadata - Episode metadata
 * @returns {Promise<string>} - Output file path
 */
async function saveResult(output, metadata) {
  const outputDir = path.join(process.cwd(), '../../outputs/podcast-learning/processed');
  await fs.mkdir(outputDir, { recursive: true });
  
  // Generate filename from episode metadata
  const filename = `episode-${metadata.episodeNumber}-${slugify(metadata.guest)}.json`;
  const outputPath = path.join(outputDir, filename);
  
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
  
  return outputPath;
}

/**
 * Converts string to URL-safe slug
 * @param {string} text - Text to slugify
 * @returns {string} - Slugified text
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default {
  processEpisode
};

