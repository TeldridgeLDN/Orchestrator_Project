/**
 * Similarity Scoring Utility
 * 
 * Provides algorithms for calculating similarity between text strings
 * to enable fuzzy matching for natural language command routing.
 * 
 * Combines multiple similarity techniques:
 * - Levenshtein distance for typo tolerance
 * - Token-based matching for semantic similarity
 * - Weighted keyword matching
 * 
 * @module utils/similarity-scorer
 * @version 1.0.0
 */

/**
 * Configuration for similarity scoring
 */
const CONFIG = {
  // Weight factors for different scoring components
  weights: {
    levenshtein: 0.4,    // Importance of character-level similarity
    tokenMatch: 0.35,     // Importance of matching tokens/words
    keywordMatch: 0.25    // Importance of key phrases
  },
  
  // Thresholds for match quality
  thresholds: {
    exact: 1.0,           // Perfect match
    excellent: 0.9,       // Clear winner
    good: 0.7,            // Acceptable match
    potential: 0.6,       // Consider as option
    ambiguous: 0.1        // Difference threshold for ambiguous matches
  },
  
  // Text normalization options
  normalization: {
    lowercase: true,
    trimWhitespace: true,
    removeExtraSpaces: true,
    removePunctuation: true
  }
};

/**
 * Normalize text for comparison
 * 
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  let normalized = text;
  
  if (CONFIG.normalization.lowercase) {
    normalized = normalized.toLowerCase();
  }
  
  if (CONFIG.normalization.trimWhitespace) {
    normalized = normalized.trim();
  }
  
  if (CONFIG.normalization.removePunctuation) {
    normalized = normalized.replace(/[^\w\s]/g, ' ');
  }
  
  if (CONFIG.normalization.removeExtraSpaces) {
    normalized = normalized.replace(/\s+/g, ' ').trim();
  }
  
  return normalized;
}

/**
 * Calculate Levenshtein distance between two strings
 * 
 * Measures the minimum number of single-character edits (insertions,
 * deletions, or substitutions) required to change one string into another.
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Create matrix
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
  
  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return matrix[len1][len2];
}

/**
 * Calculate normalized Levenshtein similarity score
 * 
 * Converts Levenshtein distance to a similarity score between 0 and 1,
 * where 1 is identical and 0 is completely different.
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
function levenshteinSimilarity(str1, str2) {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;
  
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  // Normalize to 0-1 range
  return 1 - (distance / maxLength);
}

/**
 * Tokenize text into words
 * 
 * @param {string} text - Text to tokenize
 * @returns {Array<string>} Array of tokens
 */
function tokenize(text) {
  return text.split(/\s+/).filter(token => token.length > 0);
}

/**
 * Calculate token-based similarity score
 * 
 * Measures how many tokens (words) are shared between two strings,
 * accounting for order and position.
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
function tokenSimilarity(str1, str2) {
  const tokens1 = tokenize(str1);
  const tokens2 = tokenize(str2);
  
  if (tokens1.length === 0 && tokens2.length === 0) return 1.0;
  if (tokens1.length === 0 || tokens2.length === 0) return 0.0;
  
  // Count matching tokens
  let matchCount = 0;
  const tokens2Set = new Set(tokens2);
  
  for (const token of tokens1) {
    if (tokens2Set.has(token)) {
      matchCount++;
    }
  }
  
  // Calculate Jaccard similarity
  const union = new Set([...tokens1, ...tokens2]);
  const jaccard = matchCount / union.size;
  
  // Bonus for matching order (applied before clamping)
  let orderBonus = 0;
  const minLength = Math.min(tokens1.length, tokens2.length);
  for (let i = 0; i < minLength; i++) {
    if (tokens1[i] === tokens2[i]) {
      orderBonus += 0.05;
    }
  }
  
  // Return base score + order bonus, clamped to ensure order matters
  return Math.min(jaccard * (1 + orderBonus), 1.0);
}

/**
 * Extract keywords from a command pattern
 * 
 * Identifies important words that define the command's purpose,
 * filtering out common words and connectors.
 * 
 * @param {string} pattern - Command pattern
 * @returns {Array<string>} Array of keywords
 */
function extractKeywords(pattern) {
  const stopWords = new Set([
    'a', 'an', 'the', 'to', 'from', 'in', 'on', 'at', 'by', 'with',
    'for', 'of', 'as', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'can', 'could', 'should', 'may', 'might', 'must', 'and', 'or',
    'but', 'not', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
  ]);
  
  const tokens = tokenize(normalizeText(pattern));
  return tokens.filter(token => 
    token.length > 2 && !stopWords.has(token)
  );
}

/**
 * Calculate keyword-based similarity score
 * 
 * Focuses on matching key phrases that define command intent,
 * with higher weight on matching important keywords.
 * 
 * @param {string} input - Input text
 * @param {string} pattern - Command pattern
 * @returns {number} Similarity score (0-1)
 */
function keywordSimilarity(input, pattern) {
  const inputKeywords = extractKeywords(input);
  const patternKeywords = extractKeywords(pattern);
  
  if (patternKeywords.length === 0) return 0.0;
  if (inputKeywords.length === 0) return 0.0;
  
  // Count matching keywords
  let matchCount = 0;
  const patternSet = new Set(patternKeywords);
  
  for (const keyword of inputKeywords) {
    if (patternSet.has(keyword)) {
      matchCount++;
    }
  }
  
  // Calculate recall: what percentage of pattern keywords were matched
  const recall = matchCount / patternKeywords.length;
  
  // Calculate precision: what percentage of input keywords were valid
  const precision = matchCount / inputKeywords.length;
  
  // F1 score combines both recall and precision
  if (recall + precision === 0) return 0.0;
  return (2 * recall * precision) / (recall + precision);
}

/**
 * Calculate comprehensive similarity score
 * 
 * Combines multiple similarity metrics with configurable weights
 * to produce a final similarity score between input and pattern.
 * 
 * @param {string} input - User input text
 * @param {string} pattern - Command pattern to match against
 * @returns {number} Similarity score (0-1)
 */
export function calculateSimilarity(input, pattern) {
  // Handle empty inputs
  if (!input || !pattern) return 0.0;
  
  // Normalize both strings
  const normalizedInput = normalizeText(input);
  const normalizedPattern = normalizeText(pattern);
  
  // Check for exact match first (optimization)
  if (normalizedInput === normalizedPattern) return 1.0;
  
  // Calculate component scores
  const levScore = levenshteinSimilarity(normalizedInput, normalizedPattern);
  const tokenScore = tokenSimilarity(normalizedInput, normalizedPattern);
  const keywordScore = keywordSimilarity(normalizedInput, normalizedPattern);
  
  // Combine scores with weights
  const finalScore = 
    (levScore * CONFIG.weights.levenshtein) +
    (tokenScore * CONFIG.weights.tokenMatch) +
    (keywordScore * CONFIG.weights.keywordMatch);
  
  // Ensure score is in valid range
  return Math.max(0, Math.min(1, finalScore));
}

/**
 * Calculate similarity scores for multiple patterns
 * 
 * @param {string} input - User input text
 * @param {Array<string>} patterns - Array of command patterns
 * @returns {Array<Object>} Array of {pattern, score} objects sorted by score
 */
export function calculateMultipleScores(input, patterns) {
  if (!patterns || !Array.isArray(patterns)) {
    return [];
  }
  
  const scores = patterns.map(pattern => ({
    pattern,
    score: calculateSimilarity(input, pattern)
  }));
  
  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);
  
  return scores;
}

/**
 * Determine match quality based on score
 * 
 * @param {number} score - Similarity score (0-1)
 * @returns {string} Quality level: 'exact', 'excellent', 'good', 'potential', 'poor'
 */
export function getMatchQuality(score) {
  const thresholds = CONFIG.thresholds;
  
  if (score >= thresholds.exact) return 'exact';
  if (score >= thresholds.excellent) return 'excellent';
  if (score >= thresholds.good) return 'good';
  if (score >= thresholds.potential) return 'potential';
  return 'poor';
}

/**
 * Check if two scores represent an ambiguous match
 * 
 * @param {number} score1 - First score
 * @param {number} score2 - Second score
 * @returns {boolean} True if scores are ambiguously close
 */
export function isAmbiguous(score1, score2) {
  return Math.abs(score1 - score2) < CONFIG.thresholds.ambiguous;
}

/**
 * Get current configuration
 * 
 * @returns {Object} Configuration object
 */
export function getConfig() {
  return { ...CONFIG };
}

/**
 * Update configuration
 * 
 * @param {Object} newConfig - New configuration values
 * @returns {void}
 */
export function updateConfig(newConfig) {
  if (newConfig.weights) {
    Object.assign(CONFIG.weights, newConfig.weights);
  }
  if (newConfig.thresholds) {
    Object.assign(CONFIG.thresholds, newConfig.thresholds);
  }
  if (newConfig.normalization) {
    Object.assign(CONFIG.normalization, newConfig.normalization);
  }
}

/**
 * Export for testing
 */
export const __testing__ = {
  CONFIG,
  normalizeText,
  levenshteinDistance,
  levenshteinSimilarity,
  tokenize,
  tokenSimilarity,
  extractKeywords,
  keywordSimilarity
};

export default {
  calculateSimilarity,
  calculateMultipleScores,
  getMatchQuality,
  isAmbiguous,
  getConfig,
  updateConfig
};

