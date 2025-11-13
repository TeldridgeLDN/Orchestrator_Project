#!/usr/bin/env node

/**
 * Generate Background Feature Skill
 * 
 * This Claude skill generates new background service worker features
 * with proper message handling, storage integration, and Chrome API usage.
 * 
 * @skill generate-background-feature
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Generate a background feature module
 * @param {Object} options - Generation options
 * @param {string} options.name - Feature name (e.g., 'notification-manager')
 * @param {string} options.description - Feature description
 * @param {string[]} options.messageTypes - Message types this feature handles
 * @param {string} options.outputDir - Output directory (default: src/background)
 * @returns {Promise<Object>} Generation result
 */
export async function generateBackgroundFeature(options) {
  const {
    name,
    description = 'Background feature for {{PROJECT_NAME}}',
    messageTypes = [],
    outputDir = 'src/background'
  } = options;
  
  // Validate inputs
  if (!name) {
    throw new Error('Feature name is required');
  }
  
  // Create file name from feature name
  const fileName = name.toLowerCase().replace(/\s+/g, '-');
  const featurePath = path.join(outputDir, `${fileName}.js`);
  
  // Generate feature content
  const featureContent = generateFeatureContent(name, description, messageTypes);
  
  // Create output directory if it doesn't exist
  await fs.mkdir(outputDir, { recursive: true });
  
  // Write feature file
  await fs.writeFile(featurePath, featureContent, 'utf-8');
  
  // Generate integration instructions
  const integrationInstructions = generateIntegrationInstructions(fileName, messageTypes);
  
  return {
    success: true,
    featurePath,
    integrationInstructions,
    message: `Background feature generated at ${featurePath}`
  };
}

/**
 * Generate feature content
 * @param {string} name - Feature name
 * @param {string} description - Feature description
 * @param {string[]} messageTypes - Message types to handle
 * @returns {string} Feature content
 */
function generateFeatureContent(name, description, messageTypes) {
  const messageHandlers = messageTypes.map(type => `
  case '${type}':
    return await handle${toPascalCase(type)}(message.data);`).join('');
  
  const messageHandlerFunctions = messageTypes.map(type => `
/**
 * Handle ${type} message
 * @param {Object} data - Message data
 * @returns {Promise<Object>} Result
 */
async function handle${toPascalCase(type)}(data) {
  try {
    console.log('Handling ${type}:', data);
    
    // TODO: Implement ${type} logic here
    
    return {
      success: true,
      result: '${type} completed'
    };
  } catch (error) {
    console.error('Error handling ${type}:', error);
    return {
      success: false,
      error: error.message
    };
  }
}`).join('\n\n');
  
  return `/**
 * ${name} Feature
 * 
 * ${description}
 * 
 * @module background/${name.toLowerCase().replace(/\s+/g, '-')}
 */

/**
 * Initialize the feature
 */
export async function initialize() {
  console.log('Initializing ${name}...');
  
  try {
    // Load initial data/settings
    await loadFeatureData();
    
    // Set up Chrome API listeners
    setupListeners();
    
    console.log('${name} initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Error initializing ${name}:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Load feature data from storage
 */
async function loadFeatureData() {
  try {
    const data = await chrome.storage.local.get('${name.toLowerCase().replace(/\s+/g, '-')}-data');
    
    if (data && data['${name.toLowerCase().replace(/\s+/g, '-')}-data']) {
      console.log('${name} data loaded:', data);
      return data['${name.toLowerCase().replace(/\s+/g, '-')}-data'];
    }
    
    // Initialize with default data
    const defaultData = {
      enabled: true,
      lastUpdated: Date.now()
    };
    
    await chrome.storage.local.set({
      '${name.toLowerCase().replace(/\s+/g, '-')}-data': defaultData
    });
    
    return defaultData;
  } catch (error) {
    console.error('Error loading ${name} data:', error);
    return null;
  }
}

/**
 * Save feature data to storage
 * @param {Object} data - Data to save
 */
async function saveFeatureData(data) {
  try {
    await chrome.storage.local.set({
      '${name.toLowerCase().replace(/\s+/g, '-')}-data': {
        ...data,
        lastUpdated: Date.now()
      }
    });
    
    console.log('${name} data saved');
    return { success: true };
  } catch (error) {
    console.error('Error saving ${name} data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Set up Chrome API listeners
 */
function setupListeners() {
  // Example: Listen for tab updates
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      handleTabUpdate(tabId, tab);
    }
  });
  
  // Example: Listen for browser action clicks
  // chrome.action.onClicked.addListener(handleActionClick);
  
  // Add more listeners as needed
}

/**
 * Handle tab update
 * @param {number} tabId - Tab ID
 * @param {Object} tab - Tab object
 */
async function handleTabUpdate(tabId, tab) {
  console.log('Tab updated:', tab.url);
  // Add custom logic here
}

/**
 * Handle messages related to this feature
 * @param {Object} message - Message object
 * @param {Object} sender - Sender info
 * @returns {Promise<Object>} Response
 */
export async function handleMessage(message, sender) {
  try {
    switch (message.type) {${messageHandlers || '\n      // Add message type cases here'}
      
      default:
        return {
          success: false,
          error: 'Unknown message type for ${name}'
        };
    }
  } catch (error) {
    console.error('Error handling message in ${name}:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

${messageHandlerFunctions || '// Add message handler functions here'}

/**
 * Clean up feature resources
 */
export async function cleanup() {
  console.log('Cleaning up ${name}...');
  // Remove listeners, clear data, etc.
}

export default {
  initialize,
  handleMessage,
  cleanup
};
`;
}

/**
 * Convert string to PascalCase
 * @param {string} str - String to convert
 * @returns {string} PascalCase string
 */
function toPascalCase(str) {
  return str
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Generate integration instructions
 * @param {string} fileName - Feature file name
 * @param {string[]} messageTypes - Message types
 * @returns {string} Instructions
 */
function generateIntegrationInstructions(fileName, messageTypes) {
  return `
Integration Instructions:

1. Import the feature in src/background/index.js:

   import * as ${fileName.replace(/-/g, '')}Feature from './${fileName}.js';

2. Initialize the feature on extension startup:

   // In chrome.runtime.onInstalled or at startup
   await ${fileName.replace(/-/g, '')}Feature.initialize();

3. Add message routing in src/background/messaging.js:

   import * as ${fileName.replace(/-/g, '')}Feature from './${fileName}.js';

   // In handleMessage function
   ${messageTypes.length > 0 ? `case '${messageTypes[0]}':
     return await ${fileName.replace(/-/g, '')}Feature.handleMessage(message, sender);` : '// Route messages to feature.handleMessage()'}

4. Test the feature:
   - Load the extension
   - Send a test message from popup or content script
   - Check the service worker console for logs

Message Types Handled:
${messageTypes.map(type => `  - ${type}`).join('\n') || '  (None specified - add your own)'}
`;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Generate Background Feature Skill

Usage:
  node generate-background-feature.js <name> [options]

Examples:
  node generate-background-feature.js "Notification Manager"
  node generate-background-feature.js "Data Sync" --messages SYNC_DATA,FETCH_DATA
  node generate-background-feature.js "Analytics" --output src/background/features

Options:
  --messages <types>  Message types (comma-separated, e.g., GET_DATA,SET_DATA)
  --output <dir>      Output directory (default: src/background)
    `);
    process.exit(0);
  }
  
  const name = args[0];
  const messageTypes = args.includes('--messages')
    ? args[args.indexOf('--messages') + 1].split(',')
    : [];
  const outputDir = args.includes('--output')
    ? args[args.indexOf('--output') + 1]
    : 'src/background';
  
  generateBackgroundFeature({ name, messageTypes, outputDir })
    .then((result) => {
      console.log('✓', result.message);
      console.log('\n' + result.integrationInstructions);
    })
    .catch((error) => {
      console.error('✗ Error:', error.message);
      process.exit(1);
    });
}

export default { generateBackgroundFeature };

