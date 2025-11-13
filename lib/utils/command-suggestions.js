/**
 * Command Suggestions Display Utility
 * 
 * Provides formatting and display utilities for command suggestions,
 * including "did you mean?" functionality, highlighted differences,
 * and interactive selection.
 * 
 * @module utils/command-suggestions
 * @version 1.0.0
 */

import chalk from 'chalk';
import { getSuggestions } from './command-matcher.js';
import { getMatchQuality } from './similarity-scorer.js';

/**
 * Configuration for suggestion display
 */
const CONFIG = {
  // Display settings
  display: {
    maxSuggestions: 5,        // Maximum suggestions to show
    showScores: true,          // Show similarity scores
    showQuality: true,         // Show match quality badges
    highlightDifferences: true, // Highlight where input differs from pattern
    useColors: true,           // Use colored output
    useEmojis: true            // Use emoji indicators
  },
  
  // Formatting
  formatting: {
    indent: '  ',
    bullet: '•',
    arrow: '→',
    checkmark: '✓',
    question: '?'
  },
  
  // Quality badges
  qualityBadges: {
    exact: { emoji: '✓', color: 'green', label: 'Exact' },
    excellent: { emoji: '⭐', color: 'green', label: 'Excellent' },
    good: { emoji: '👍', color: 'yellow', label: 'Good' },
    potential: { emoji: '💡', color: 'cyan', label: 'Potential' },
    poor: { emoji: '❌', color: 'red', label: 'Poor' }
  }
};

/**
 * Format a similarity score for display
 * 
 * @param {number} score - Similarity score (0-1)
 * @param {boolean} asPercentage - Format as percentage
 * @returns {string} Formatted score
 */
export function formatScore(score, asPercentage = true) {
  if (asPercentage) {
    return `${Math.round(score * 100)}%`;
  }
  return score.toFixed(2);
}

/**
 * Get quality badge for a match
 * 
 * @param {string} quality - Quality level
 * @returns {string} Formatted badge
 */
export function getQualityBadge(quality) {
  const badge = CONFIG.qualityBadges[quality] || CONFIG.qualityBadges.poor;
  
  if (!CONFIG.display.useColors) {
    return CONFIG.display.useEmojis ? badge.emoji : badge.label;
  }
  
  const colorFn = chalk[badge.color] || chalk.white;
  const text = CONFIG.display.useEmojis ? badge.emoji : badge.label;
  
  return colorFn(text);
}

/**
 * Highlight differences between input and pattern
 * 
 * @param {string} input - User input
 * @param {string} pattern - Command pattern
 * @returns {string} Pattern with differences highlighted
 */
export function highlightDifferences(input, pattern) {
  if (!CONFIG.display.highlightDifferences || !CONFIG.display.useColors) {
    return pattern;
  }
  
  const inputWords = input.toLowerCase().split(/\s+/);
  const patternWords = pattern.split(/\s+/);
  
  const highlighted = patternWords.map(word => {
    const cleanWord = word.replace(/[{}]/g, '').toLowerCase();
    
    // Check if this word (or similar) exists in input
    const exists = inputWords.some(inputWord => {
      return inputWord === cleanWord || 
             cleanWord.includes(inputWord) ||
             inputWord.includes(cleanWord);
    });
    
    // Highlight parameters (words in {braces})
    if (word.includes('{') && word.includes('}')) {
      return chalk.cyan(word);
    }
    
    // Highlight words that don't exist in input
    if (!exists) {
      return chalk.dim(word);
    }
    
    return word;
  });
  
  return highlighted.join(' ');
}

/**
 * Format a single suggestion
 * 
 * @param {Object} suggestion - Suggestion object
 * @param {number} index - Index in suggestion list (0-based)
 * @param {string} input - Original user input
 * @returns {string} Formatted suggestion line
 */
export function formatSuggestion(suggestion, index, input = '') {
  const parts = [];
  
  // Number/bullet
  const prefix = CONFIG.display.useColors 
    ? chalk.cyan(`${index + 1}.`)
    : `${index + 1}.`;
  parts.push(prefix);
  
  // Command name
  const nameText = CONFIG.display.useColors
    ? chalk.bold(suggestion.command.name || suggestion.command.id)
    : suggestion.command.name || suggestion.command.id;
  parts.push(nameText);
  
  // Quality badge
  if (CONFIG.display.showQuality && suggestion.quality) {
    parts.push(getQualityBadge(suggestion.quality));
  }
  
  // Score
  if (CONFIG.display.showScores && typeof suggestion.score === 'number') {
    const scoreText = CONFIG.display.useColors
      ? chalk.gray(`(${formatScore(suggestion.score)})`)
      : `(${formatScore(suggestion.score)})`;
    parts.push(scoreText);
  }
  
  // Pattern with highlighting
  if (suggestion.pattern) {
    const patternText = highlightDifferences(input, suggestion.pattern);
    const arrow = CONFIG.display.useColors ? chalk.dim(CONFIG.formatting.arrow) : CONFIG.formatting.arrow;
    parts.push(arrow, patternText);
  }
  
  // Description (on new line if provided)
  let result = CONFIG.formatting.indent + parts.join(' ');
  
  if (suggestion.command.description) {
    const descText = CONFIG.display.useColors
      ? chalk.gray(`\n${CONFIG.formatting.indent}${CONFIG.formatting.indent}${suggestion.command.description}`)
      : `\n${CONFIG.formatting.indent}${CONFIG.formatting.indent}${suggestion.command.description}`;
    result += descText;
  }
  
  return result;
}

/**
 * Format a list of suggestions
 * 
 * @param {Array<Object>} suggestions - Array of suggestion objects
 * @param {string} input - Original user input
 * @param {Object} options - Formatting options
 * @returns {string} Formatted suggestion list
 */
export function formatSuggestionList(suggestions, input = '', options = {}) {
  const {
    title = 'Did you mean:',
    maxSuggestions = CONFIG.display.maxSuggestions
  } = options;
  
  if (!suggestions || suggestions.length === 0) {
    return '';
  }
  
  const lines = [];
  
  // Title
  if (title) {
    const titleText = CONFIG.display.useColors
      ? chalk.bold.yellow(`\n${title}`)
      : `\n${title}`;
    lines.push(titleText);
  }
  
  // Suggestions
  const limitedSuggestions = suggestions.slice(0, maxSuggestions);
  limitedSuggestions.forEach((suggestion, index) => {
    lines.push(formatSuggestion(suggestion, index, input));
  });
  
  // Footer hint
  if (CONFIG.display.useColors) {
    lines.push(chalk.dim(`\nType a number to select, or refine your command.`));
  } else {
    lines.push(`\nType a number to select, or refine your command.`);
  }
  
  return lines.join('\n');
}

/**
 * Display "no match" message with suggestions
 * 
 * @param {string} input - User input that didn't match
 * @param {Array<Object>} commands - Available commands
 * @param {Object} options - Display options
 * @returns {string} Formatted message
 */
export function displayNoMatch(input, commands, options = {}) {
  const {
    minScore = 0.3,
    maxSuggestions = CONFIG.display.maxSuggestions
  } = options;
  
  const lines = [];
  
  // Error message
  const errorMsg = CONFIG.display.useColors
    ? chalk.red(`\n❌ No command found matching: "${input}"`)
    : `\nNo command found matching: "${input}"`;
  lines.push(errorMsg);
  
  // Try to get suggestions with lower threshold
  const suggestions = getSuggestions(input, commands, {
    count: maxSuggestions,
    minScore
  });
  
  if (suggestions.length > 0) {
    lines.push(formatSuggestionList(suggestions, input, {
      title: 'Did you mean one of these?',
      maxSuggestions
    }));
  } else {
    // No suggestions available
    const hintMsg = CONFIG.display.useColors
      ? chalk.gray('\nNo similar commands found. Try listing all commands.')
      : '\nNo similar commands found. Try listing all commands.';
    lines.push(hintMsg);
  }
  
  return lines.join('\n');
}

/**
 * Display ambiguous match message
 * 
 * @param {string} input - User input
 * @param {Array<Object>} options - Ambiguous match options
 * @returns {string} Formatted message
 */
export function displayAmbiguousMatch(input, options) {
  const lines = [];
  
  // Warning message
  const warningMsg = CONFIG.display.useColors
    ? chalk.yellow(`\n⚠️  Multiple commands match: "${input}"`)
    : `\nMultiple commands match: "${input}"`;
  lines.push(warningMsg);
  
  // Formatted suggestions
  lines.push(formatSuggestionList(options, input, {
    title: 'Please select the command you meant:',
    maxSuggestions: options.length
  }));
  
  return lines.join('\n');
}

/**
 * Display successful match confirmation
 * 
 * @param {Object} match - Match result
 * @param {string} input - Original input
 * @returns {string} Formatted confirmation
 */
export function displayMatchConfirmation(match, input = '') {
  if (!match || !match.command) {
    return '';
  }
  
  const parts = [];
  
  // Quality badge
  if (match.quality === 'exact') {
    const checkmark = CONFIG.display.useColors 
      ? chalk.green('✓')
      : CONFIG.formatting.checkmark;
    parts.push(checkmark);
  }
  
  // Command name
  const name = CONFIG.display.useColors
    ? chalk.bold(match.command.name || match.command.id)
    : match.command.name || match.command.id;
  parts.push(name);
  
  // Score (if not exact)
  if (match.quality !== 'exact' && CONFIG.display.showScores) {
    const scoreText = CONFIG.display.useColors
      ? chalk.gray(`(${formatScore(match.score)})`)
      : `(${formatScore(match.score)})`;
    parts.push(scoreText);
  }
  
  return parts.join(' ');
}

/**
 * Create an interactive suggestion prompt
 * 
 * @param {Array<Object>} suggestions - Suggestions to choose from
 * @param {string} input - Original input
 * @returns {Object} Prompt configuration for CLI libraries
 */
export function createSelectionPrompt(suggestions, input = '') {
  const choices = suggestions.map((suggestion, index) => ({
    name: formatSuggestion(suggestion, index, input),
    value: suggestion.command.id,
    short: suggestion.command.name || suggestion.command.id
  }));
  
  return {
    type: 'list',
    name: 'selectedCommand',
    message: 'Select a command:',
    choices
  };
}

/**
 * Format suggestions as plain text (no colors/emojis)
 * 
 * @param {Array<Object>} suggestions - Suggestions to format
 * @param {string} input - Original input
 * @returns {string} Plain text suggestions
 */
export function formatSuggestionsPlainText(suggestions, input = '') {
  const originalUseColors = CONFIG.display.useColors;
  const originalUseEmojis = CONFIG.display.useEmojis;
  
  CONFIG.display.useColors = false;
  CONFIG.display.useEmojis = false;
  
  const result = formatSuggestionList(suggestions, input);
  
  CONFIG.display.useColors = originalUseColors;
  CONFIG.display.useEmojis = originalUseEmojis;
  
  return result;
}

/**
 * Get configuration
 * 
 * @returns {Object} Current configuration
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
  if (newConfig.display) {
    Object.assign(CONFIG.display, newConfig.display);
  }
  if (newConfig.formatting) {
    Object.assign(CONFIG.formatting, newConfig.formatting);
  }
  if (newConfig.qualityBadges) {
    Object.assign(CONFIG.qualityBadges, newConfig.qualityBadges);
  }
}

/**
 * Export for testing
 */
export const __testing__ = {
  CONFIG
};

export default {
  formatScore,
  getQualityBadge,
  highlightDifferences,
  formatSuggestion,
  formatSuggestionList,
  displayNoMatch,
  displayAmbiguousMatch,
  displayMatchConfirmation,
  createSelectionPrompt,
  formatSuggestionsPlainText,
  getConfig,
  updateConfig
};

