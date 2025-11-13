/**
 * Podcast Learning Extraction System
 * Main module exports for programmatic usage
 */

// Input handling and validation
export {
  validateInput,
  readFromFile,
  formatErrors,
  getDefaultContexts,
  displayInputSummary
} from './input-handler.js';

// API clients and insight extraction
export {
  initializeClient,
  extractInsights,
  displayInsights,
  getApiKey
} from './insight-extractor.js';

// Reference parsing and validation
export {
  extractLinks,
  validateUrls,
  displayValidationResults,
  groupResultsByStatus
} from './reference-parser.js';

// Reference categorization
export {
  CATEGORIES,
  categorizeByRules,
  categorizeWithAI,
  categorizeReferences,
  displayCategorizedReferences,
  groupByCategory,
  getCategoryStats
} from './reference-categorizer.js';

// Action item generation
export {
  generateActions,
  displayActions,
  validateActions as validateActionItems,
  getActionStats
} from './action-generator.js';

// Markdown report generation
export {
  generateMarkdown,
  generateReport,
  saveMarkdown,
  validateMarkdown
} from './markdown-generator.js';

// Complete processing pipeline
export {
  processEpisode
} from './process.js';

/**
 * Quick-start function for processing a podcast episode
 * @param {Object} episodeData - Episode data with transcript, show notes, metadata
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Processing result
 * 
 * @example
 * import { quickProcess } from './podcast-learning/index.js';
 * 
 * const result = await quickProcess({
 *   transcript: 'Episode transcript text...',
 *   showNotes: '# Show notes markdown...',
 *   metadata: {
 *     title: 'Episode Title',
 *     guest: 'Guest Name',
 *     episodeNumber: 1
 *   }
 * });
 */
export async function quickProcess(episodeData, options = {}) {
  const { processEpisode } = await import('./process.js');
  
  const inputData = {
    transcript: episodeData.transcript,
    showNotes: episodeData.showNotes,
    metadata: episodeData.metadata,
    contexts: episodeData.contexts || getDefaultContexts()
  };

  return await processEpisode(inputData, {
    validateFirst: true,
    testMode: false,
    ...options
  });
}

/**
 * Module information
 */
export const VERSION = '1.0.0';
export const MODULE_NAME = 'podcast-learning-extraction';

export default {
  // Input handling
  validateInput,
  readFromFile,
  
  // Extraction
  extractInsights,
  
  // References
  validateUrls,
  categorizeReferences,
  
  // Actions
  generateActions,
  
  // Output
  generateReport,
  
  // Pipeline
  processEpisode,
  quickProcess,
  
  // Metadata
  VERSION,
  MODULE_NAME
};

