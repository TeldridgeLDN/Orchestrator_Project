/**
 * Command Matching Service
 * 
 * Provides intelligent command matching using similarity scoring to handle
 * variations in natural language command phrasing. Enables fuzzy matching,
 * suggestion mechanisms, and disambiguation for ambiguous commands.
 * 
 * @module utils/command-matcher
 * @version 1.0.0
 */

import {
  calculateSimilarity,
  calculateMultipleScores,
  getMatchQuality,
  isAmbiguous,
  getConfig as getSimilarityConfig
} from './similarity-scorer.js';

import {
  getMostCommonCorrection,
  getCorrectionsForInput
} from './command-corrections-store.js';

/**
 * Configuration for command matching
 */
const CONFIG = {
  // Match quality thresholds
  thresholds: {
    excellent: 0.9,       // Clear winner - use immediately
    good: 0.7,            // Acceptable match - use with confirmation
    potential: 0.6,       // Minimum threshold to consider
    ambiguous: 0.1        // Difference threshold for ambiguous matches
  },
  
  // Suggestion settings
  suggestions: {
    maxResults: 5,        // Maximum number of suggestions to return
    showScores: true      // Include similarity scores in suggestions
  },
  
  // Performance optimizations
  performance: {
    earlyExitOnExact: true,  // Stop searching on exact match
    cacheResults: true        // Cache recent matches
  },
  
  // Learning from corrections
  learning: {
    enabled: true,            // Use historical corrections
    boostFactor: 0.2,         // Score boost for learned corrections (0-0.5)
    minFrequency: 2,          // Minimum frequency to apply boost
    requireRecentUsage: true, // Only boost if used in last 30 days
    recentDays: 30            // Days to consider "recent"
  }
};

// Simple LRU cache for command match results
let matchCache = new Map();
const MAX_CACHE_SIZE = 100;

/**
 * Apply learning boost to command scores based on historical corrections
 * 
 * @param {string} input - User input
 * @param {Array<Object>} results - Matching results
 * @returns {Promise<Array<Object>>} Results with learning boost applied
 */
async function applyLearningBoost(input, results) {
  if (!CONFIG.learning.enabled || results.length === 0) {
    return results;
  }
  
  try {
    // Get historical corrections for this input
    const corrections = await getCorrectionsForInput(input);
    
    if (corrections.length === 0) {
      return results;
    }
    
    // Filter corrections by frequency and recency
    const relevantCorrections = corrections.filter(corr => {
      if (corr.frequency < CONFIG.learning.minFrequency) {
        return false;
      }
      
      if (CONFIG.learning.requireRecentUsage) {
        const lastSeenDate = new Date(corr.lastSeen);
        const daysSince = (Date.now() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= CONFIG.learning.recentDays;
      }
      
      return true;
    });
    
    if (relevantCorrections.length === 0) {
      return results;
    }
    
    // Create a map of command ID to correction
    const correctionMap = new Map();
    relevantCorrections.forEach(corr => {
      correctionMap.set(corr.selectedId, corr);
    });
    
    // Apply boost to matching commands
    const boosted = results.map(result => {
      const correction = correctionMap.get(result.command.id);
      
      if (!correction) {
        return result;
      }
      
      // Calculate boost based on frequency
      const frequencyMultiplier = Math.min(correction.frequency / 10, 1.0);
      const boost = CONFIG.learning.boostFactor * frequencyMultiplier;
      
      // Apply boost (cap at 1.0)
      const boostedScore = Math.min(result.score + boost, 1.0);
      
      return {
        ...result,
        score: boostedScore,
        originalScore: result.score,
        learningBoost: boost,
        learningData: {
          frequency: correction.frequency,
          lastSeen: correction.lastSeen
        }
      };
    });
    
    // Re-sort by new scores
    boosted.sort((a, b) => b.score - a.score);
    
    return boosted;
  } catch (error) {
    // If learning fails, just return original results
    console.error('Learning boost failed:', error.message);
    return results;
  }
}

/**
 * Get learning statistics for a command match
 * 
 * @param {string} input - User input
 * @param {string} commandId - Command ID
 * @returns {Promise<Object|null>} Learning statistics or null
 */
export async function getLearningStats(input, commandId) {
  if (!CONFIG.learning.enabled) {
    return null;
  }
  
  try {
    const corrections = await getCorrectionsForInput(input);
    const relevant = corrections.find(c => c.selectedId === commandId);
    
    if (!relevant) {
      return null;
    }
    
    return {
      frequency: relevant.frequency,
      firstSeen: relevant.firstSeen,
      lastSeen: relevant.lastSeen,
      contexts: relevant.contexts || []
    };
  } catch (error) {
    return null;
  }
}

/**
 * Clear the match cache
 * 
 * @returns {void}
 */
export function clearCache() {
  matchCache.clear();
}

/**
 * Get cache statistics
 * 
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  return {
    size: matchCache.size,
    maxSize: MAX_CACHE_SIZE
  };
}

/**
 * Add result to cache with LRU eviction
 * 
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @returns {void}
 */
function addToCache(key, value) {
  if (!CONFIG.performance.cacheResults) return;
  
  // LRU: Delete and re-add to move to end
  if (matchCache.has(key)) {
    matchCache.delete(key);
  }
  
  // Evict oldest entry if at max size
  if (matchCache.size >= MAX_CACHE_SIZE) {
    const firstKey = matchCache.keys().next().value;
    matchCache.delete(firstKey);
  }
  
  matchCache.set(key, value);
}

/**
 * Get cached result
 * 
 * @param {string} key - Cache key
 * @returns {*} Cached value or undefined
 */
function getFromCache(key) {
  if (!CONFIG.performance.cacheResults) return undefined;
  
  if (matchCache.has(key)) {
    // LRU: Move to end
    const value = matchCache.get(key);
    matchCache.delete(key);
    matchCache.set(key, value);
    return value;
  }
  
  return undefined;
}

/**
 * Find the best matching command from a list of commands
 * 
 * @param {string} input - User input text
 * @param {Array<Object>} commands - Array of command objects
 * @param {Object} options - Matching options
 * @param {number} options.minScore - Minimum similarity score (default: 0.6)
 * @param {number} options.maxSuggestions - Max suggestions to return (default: 5)
 * @param {boolean} options.includeAmbiguous - Include ambiguous matches (default: true)
 * @param {boolean} options.useLearning - Use historical corrections (default: true)
 * @returns {Promise<Object>} Match result object
 */
export async function findBestCommandMatch(input, commands, options = {}) {
  // Validate inputs
  if (!input || typeof input !== 'string') {
    return {
      success: false,
      error: 'Invalid input: must be a non-empty string'
    };
  }
  
  if (!commands || !Array.isArray(commands) || commands.length === 0) {
    return {
      success: false,
      error: 'Invalid commands: must be a non-empty array'
    };
  }
  
  // Set default options
  const {
    minScore = CONFIG.thresholds.potential,
    maxSuggestions = CONFIG.suggestions.maxResults,
    includeAmbiguous = true,
    useLearning = true
  } = options;
  
  // Check cache
  const cacheKey = `${input}:${minScore}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
  }
  
  const results = [];
  
  // Iterate through commands
  for (const command of commands) {
    // Validate command structure
    if (!command.patterns || !Array.isArray(command.patterns)) {
      continue;
    }
    
    // Calculate similarity scores for each pattern
    const patternScores = command.patterns.map(pattern => ({
      pattern,
      score: calculateSimilarity(input, pattern)
    }));
    
    // Get best score for this command
    const bestMatch = patternScores.reduce((best, current) => {
      return current.score > best.score ? current : best;
    }, { score: 0, pattern: null });
    
    // Check for exact match (optimization)
    if (CONFIG.performance.earlyExitOnExact && bestMatch.score === 1.0) {
      const result = {
        success: true,
        match: {
          command,
          pattern: bestMatch.pattern,
          score: bestMatch.score,
          quality: 'exact'
        },
        allPatternScores: patternScores
      };
      addToCache(cacheKey, result);
      return result;
    }
    
    // Add to results if meets minimum threshold
    if (bestMatch.score >= minScore) {
      results.push({
        command,
        pattern: bestMatch.pattern,
        score: bestMatch.score,
        quality: getMatchQuality(bestMatch.score),
        allPatternScores: patternScores
      });
    }
  }
  
  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  
  // Apply learning boost if enabled
  let finalResults = results;
  if (useLearning && CONFIG.learning.enabled) {
    finalResults = await applyLearningBoost(input, results);
  }
  
  // No matches found
  if (finalResults.length === 0) {
    const result = {
      success: false,
      noMatch: true,
      message: 'No commands found matching the input',
      suggestions: []
    };
    addToCache(cacheKey, result);
    return result;
  }
  
  // Single excellent match - clear winner
  if (finalResults.length === 1 || finalResults[0].score >= CONFIG.thresholds.excellent) {
    const result = {
      success: true,
      match: finalResults[0],
      suggestions: finalResults.slice(1, maxSuggestions + 1)
    };
    addToCache(cacheKey, result);
    return result;
  }
  
  // Check for ambiguous matches
  if (includeAmbiguous && finalResults.length > 1) {
    const scoreDiff = finalResults[0].score - finalResults[1].score;
    
    if (scoreDiff < CONFIG.thresholds.ambiguous) {
      // Ambiguous match - multiple options with similar scores
      const result = {
        success: true,
        ambiguous: true,
        message: 'Multiple commands match your input',
        options: finalResults.slice(0, Math.min(3, finalResults.length))
      };
      addToCache(cacheKey, result);
      return result;
    }
  }
  
  // Good match with alternatives
  const result = {
    success: true,
    match: finalResults[0],
    suggestions: finalResults.slice(1, maxSuggestions + 1)
  };
  addToCache(cacheKey, result);
  return result;
}

/**
 * Find suggestions for a command input
 * 
 * Returns the top N most similar commands without making a definitive match.
 * Useful for "did you mean?" functionality.
 * 
 * @param {string} input - User input text
 * @param {Array<Object>} commands - Array of command objects
 * @param {Object} options - Options
 * @param {number} options.count - Number of suggestions (default: 5)
 * @param {number} options.minScore - Minimum score (default: 0.3)
 * @returns {Promise<Array<Object>>} Array of suggestion objects
 */
export async function getSuggestions(input, commands, options = {}) {
  const {
    count = CONFIG.suggestions.maxResults,
    minScore = 0.3
  } = options;
  
  const result = await findBestCommandMatch(input, commands, {
    minScore,
    maxSuggestions: count,
    includeAmbiguous: false
  });
  
  if (!result.success || result.noMatch) {
    return [];
  }
  
  const suggestions = [];
  
  if (result.match) {
    suggestions.push(result.match);
  }
  
  if (result.suggestions) {
    suggestions.push(...result.suggestions);
  }
  
  return suggestions.slice(0, count);
}

/**
 * Check if input exactly matches a command pattern
 * 
 * @param {string} input - User input text
 * @param {Object} command - Command object
 * @returns {boolean} True if exact match found
 */
export function isExactMatch(input, command) {
  if (!command.patterns || !Array.isArray(command.patterns)) {
    return false;
  }
  
  return command.patterns.some(pattern => {
    return calculateSimilarity(input, pattern) === 1.0;
  });
}

/**
 * Batch match multiple inputs against commands
 * 
 * @param {Array<string>} inputs - Array of input strings
 * @param {Array<Object>} commands - Array of command objects
 * @param {Object} options - Matching options
 * @returns {Promise<Array<Object>>} Array of match results
 */
export async function batchMatch(inputs, commands, options = {}) {
  if (!Array.isArray(inputs)) {
    throw new Error('Inputs must be an array');
  }
  
  return Promise.all(inputs.map(async input => ({
    input,
    result: await findBestCommandMatch(input, commands, options)
  })));
}

/**
 * Get configuration
 * 
 * @returns {Object} Current configuration
 */
export function getConfig() {
  return {
    ...CONFIG,
    similarity: getSimilarityConfig()
  };
}

/**
 * Update configuration
 * 
 * @param {Object} newConfig - New configuration values
 * @returns {void}
 */
export function updateConfig(newConfig) {
  if (newConfig.thresholds) {
    Object.assign(CONFIG.thresholds, newConfig.thresholds);
  }
  if (newConfig.suggestions) {
    Object.assign(CONFIG.suggestions, newConfig.suggestions);
  }
  if (newConfig.performance) {
    Object.assign(CONFIG.performance, newConfig.performance);
  }
}

/**
 * Export for testing
 */
export const __testing__ = {
  CONFIG,
  matchCache,
  addToCache,
  getFromCache
};

export default {
  findBestCommandMatch,
  getSuggestions,
  isExactMatch,
  batchMatch,
  getLearningStats,
  getConfig,
  updateConfig,
  clearCache,
  getCacheStats
};

