/**
 * Command Disambiguation Handler
 * 
 * Provides interactive disambiguation for ambiguous command matches,
 * including keyboard navigation, selection handling, and cancellation.
 * 
 * @module utils/command-disambiguation
 * @version 1.0.0
 */

import readline from 'readline';
import { displayAmbiguousMatch } from './command-suggestions.js';

/**
 * Configuration for disambiguation
 */
const CONFIG = {
  // Keyboard shortcuts
  keys: {
    cancel: ['escape', 'q'],
    select: ['enter', 'return'],
    up: ['up', 'k'],
    down: ['down', 'j'],
    numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9']
  },
  
  // Behavior
  behavior: {
    autoSelectOnNumber: true,  // Automatically select when number is pressed
    requireEnter: false,        // Don't require enter after number selection
    showInstructions: true,     // Show keyboard navigation instructions
    highlightSelection: true    // Highlight currently selected option
  },
  
  // Timeouts
  timeout: {
    enabled: false,
    duration: 30000,  // 30 seconds
    message: 'Selection timed out. Please try again.'
  }
};

/**
 * Parse keyboard input
 * 
 * @param {string} input - Raw keyboard input
 * @returns {Object} Parsed input object
 */
function parseInput(input) {
  const normalized = input.toLowerCase().trim();
  
  // Check for cancellation
  if (CONFIG.keys.cancel.includes(normalized)) {
    return { type: 'cancel' };
  }
  
  // Check for selection confirmation
  if (CONFIG.keys.select.includes(normalized)) {
    return { type: 'confirm' };
  }
  
  // Check for navigation
  if (CONFIG.keys.up.includes(normalized)) {
    return { type: 'navigate', direction: 'up' };
  }
  
  if (CONFIG.keys.down.includes(normalized)) {
    return { type: 'navigate', direction: 'down' };
  }
  
  // Check for number selection
  if (CONFIG.keys.numbers.includes(normalized)) {
    return { type: 'number', value: parseInt(normalized, 10) };
  }
  
  return { type: 'unknown', input: normalized };
}

/**
 * Validate option index
 * 
 * @param {number} index - Index to validate
 * @param {Array} options - Available options
 * @returns {boolean} True if valid
 */
function isValidIndex(index, options) {
  return index >= 0 && index < options.length;
}

/**
 * Display disambiguation prompt with current selection highlighted
 * 
 * @param {string} input - User input
 * @param {Array<Object>} options - Available options
 * @param {number} selectedIndex - Currently selected index
 * @returns {void}
 */
function displayPrompt(input, options, selectedIndex) {
  // Clear screen (optional - commented out to avoid disruption)
  // console.clear();
  
  // Display options using existing formatter
  const display = displayAmbiguousMatch(input, options);
  console.log(display);
  
  // Show instructions if enabled
  if (CONFIG.behavior.showInstructions) {
    console.log('\n' + [
      'Navigation: ↑/↓ or k/j to move, Enter to select, q or Esc to cancel',
      `Currently selected: ${selectedIndex + 1}`
    ].join('\n'));
  }
}

/**
 * Handle disambiguation interactively using readline
 * 
 * @param {string} input - Original user input
 * @param {Array<Object>} options - Ambiguous match options
 * @param {Object} config - Optional configuration overrides
 * @returns {Promise<Object>} Selected command or cancellation result
 */
export async function handleDisambiguation(input, options, config = {}) {
  // Merge config
  const settings = { ...CONFIG, ...config };
  
  // Validate options
  if (!options || !Array.isArray(options) || options.length === 0) {
    return {
      cancelled: true,
      reason: 'No options provided'
    };
  }
  
  // If only one option, return it immediately
  if (options.length === 1) {
    return {
      selected: options[0].command,
      index: 0,
      automatic: true
    };
  }
  
  let selectedIndex = 0;
  
  return new Promise((resolve) => {
    // Create readline interface
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
    
    // Setup timeout if enabled
    let timeoutId;
    if (settings.timeout.enabled) {
      timeoutId = setTimeout(() => {
        rl.close();
        resolve({
          cancelled: true,
          reason: 'timeout',
          message: settings.timeout.message
        });
      }, settings.timeout.duration);
    }
    
    // Display initial prompt
    displayPrompt(input, options, selectedIndex);
    
    // Setup raw mode for key-by-key input
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    
    // Handle keyboard input
    const onKeypress = (str, key) => {
      if (!key) return;
      
      // Parse input
      const parsed = parseInput(key.name || str);
      
      switch (parsed.type) {
        case 'cancel':
          if (timeoutId) clearTimeout(timeoutId);
          rl.close();
          resolve({
            cancelled: true,
            reason: 'user'
          });
          break;
          
        case 'confirm':
          if (isValidIndex(selectedIndex, options)) {
            if (timeoutId) clearTimeout(timeoutId);
            rl.close();
            resolve({
              selected: options[selectedIndex].command,
              index: selectedIndex,
              manual: true
            });
          }
          break;
          
        case 'navigate':
          if (parsed.direction === 'up') {
            selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : options.length - 1;
          } else if (parsed.direction === 'down') {
            selectedIndex = selectedIndex < options.length - 1 ? selectedIndex + 1 : 0;
          }
          displayPrompt(input, options, selectedIndex);
          break;
          
        case 'number':
          const index = parsed.value - 1;  // Convert to 0-based
          if (isValidIndex(index, options)) {
            if (settings.behavior.autoSelectOnNumber) {
              // Immediate selection
              if (timeoutId) clearTimeout(timeoutId);
              rl.close();
              resolve({
                selected: options[index].command,
                index,
                manual: true,
                method: 'number'
              });
            } else {
              // Update selection, wait for confirm
              selectedIndex = index;
              displayPrompt(input, options, selectedIndex);
            }
          }
          break;
          
        default:
          // Ignore unknown input
          break;
      }
    };
    
    // Listen for keypress events
    process.stdin.on('keypress', onKeypress);
    
    // Cleanup on close
    rl.on('close', () => {
      process.stdin.removeListener('keypress', onKeypress);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      if (timeoutId) clearTimeout(timeoutId);
    });
  });
}

/**
 * Handle disambiguation programmatically (non-interactive)
 * 
 * Useful for testing or scripted scenarios
 * 
 * @param {string} input - Original user input
 * @param {Array<Object>} options - Ambiguous match options
 * @param {number|string} selection - Index or command ID to select
 * @returns {Object} Selected command or error
 */
export function handleDisambiguationProgrammatic(input, options, selection) {
  if (!options || !Array.isArray(options) || options.length === 0) {
    return {
      success: false,
      error: 'No options provided'
    };
  }
  
  let selectedIndex;
  
  // Handle numeric index
  if (typeof selection === 'number') {
    selectedIndex = selection;
  } 
  // Handle command ID
  else if (typeof selection === 'string') {
    selectedIndex = options.findIndex(opt => opt.command.id === selection);
  }
  
  // Validate index
  if (!isValidIndex(selectedIndex, options)) {
    return {
      success: false,
      error: 'Invalid selection',
      selection
    };
  }
  
  return {
    success: true,
    selected: options[selectedIndex].command,
    index: selectedIndex,
    programmatic: true
  };
}

/**
 * Create a simple prompt-based disambiguation (alternative to interactive)
 * 
 * Uses basic readline question/answer instead of keypress handling
 * 
 * @param {string} input - Original user input
 * @param {Array<Object>} options - Ambiguous match options
 * @returns {Promise<Object>} Selected command or cancellation result
 */
export async function handleDisambiguationSimple(input, options) {
  if (!options || !Array.isArray(options) || options.length === 0) {
    return {
      cancelled: true,
      reason: 'No options provided'
    };
  }
  
  // Display options
  const display = displayAmbiguousMatch(input, options);
  console.log(display);
  
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\nEnter number to select (or "q" to cancel): ', (answer) => {
      rl.close();
      
      const normalized = answer.trim().toLowerCase();
      
      // Check for cancellation
      if (normalized === 'q' || normalized === 'quit' || normalized === 'cancel') {
        resolve({
          cancelled: true,
          reason: 'user'
        });
        return;
      }
      
      // Try to parse as number
      const num = parseInt(normalized, 10);
      if (isNaN(num)) {
        resolve({
          cancelled: true,
          reason: 'invalid',
          message: 'Invalid input. Please enter a number.'
        });
        return;
      }
      
      const index = num - 1;  // Convert to 0-based
      
      if (!isValidIndex(index, options)) {
        resolve({
          cancelled: true,
          reason: 'invalid',
          message: `Invalid option. Please choose 1-${options.length}.`
        });
        return;
      }
      
      resolve({
        selected: options[index].command,
        index,
        manual: true,
        method: 'simple'
      });
    });
  });
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
  if (newConfig.keys) {
    Object.assign(CONFIG.keys, newConfig.keys);
  }
  if (newConfig.behavior) {
    Object.assign(CONFIG.behavior, newConfig.behavior);
  }
  if (newConfig.timeout) {
    Object.assign(CONFIG.timeout, newConfig.timeout);
  }
}

/**
 * Export for testing
 */
export const __testing__ = {
  CONFIG,
  parseInput,
  isValidIndex,
  displayPrompt
};

export default {
  handleDisambiguation,
  handleDisambiguationProgrammatic,
  handleDisambiguationSimple,
  getConfig,
  updateConfig
};

