#!/usr/bin/env node

/**
 * Generate Content Script Skill
 * 
 * This Claude skill generates new content scripts for Chrome extensions
 * with proper DOM manipulation, messaging, and best practices.
 * 
 * @skill generate-content-script
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Generate a content script
 * @param {Object} options - Generation options
 * @param {string} options.name - Script name (e.g., 'youtube-enhancer')
 * @param {string} options.description - Script description
 * @param {string[]} options.matches - URL patterns to match
 * @param {boolean} options.runAtStart - Run at document_start vs document_idle
 * @param {string} options.outputDir - Output directory (default: src/content)
 * @returns {Promise<Object>} Generation result
 */
export async function generateContentScript(options) {
  const {
    name,
    description = 'Content script for {{PROJECT_NAME}}',
    matches = ['<all_urls>'],
    runAtStart = false,
    outputDir = 'src/content'
  } = options;
  
  // Validate inputs
  if (!name) {
    throw new Error('Script name is required');
  }
  
  // Create file name from script name
  const fileName = name.toLowerCase().replace(/\s+/g, '-');
  const scriptPath = path.join(outputDir, `${fileName}.js`);
  
  // Generate script content
  const scriptContent = generateScriptContent(name, description);
  
  // Create output directory if it doesn't exist
  await fs.mkdir(outputDir, { recursive: true });
  
  // Write script file
  await fs.writeFile(scriptPath, scriptContent, 'utf-8');
  
  // Generate instructions for manifest.json
  const manifestInstructions = generateManifestInstructions(fileName, matches, runAtStart);
  
  return {
    success: true,
    scriptPath,
    manifestInstructions,
    message: `Content script generated at ${scriptPath}`
  };
}

/**
 * Generate script content
 * @param {string} name - Script name
 * @param {string} description - Script description
 * @returns {string} Script content
 */
function generateScriptContent(name, description) {
  return `/**
 * ${name} Content Script
 * 
 * ${description}
 * 
 * @module content/${name.toLowerCase().replace(/\s+/g, '-')}
 */

import { getElement, createElement, addClass } from './dom-utils.js';

// Script state
let isInitialized = false;
let scriptSettings = {};

/**
 * Initialize the content script
 */
async function initialize() {
  if (isInitialized) {
    console.log('${name} already initialized');
    return;
  }
  
  console.log('Initializing ${name} on:', window.location.href);
  
  try {
    // Get settings from background
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SETTINGS'
    });
    
    if (response.success) {
      scriptSettings = response.settings;
    }
    
    // Check if enabled
    if (scriptSettings.enabled === false) {
      console.log('${name} is disabled');
      return;
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Run main functionality
    await runMainLogic();
    
    isInitialized = true;
    console.log('${name} initialized successfully');
    
  } catch (error) {
    console.error('Error initializing ${name}:', error);
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender)
      .then(sendResponse)
      .catch((error) => {
        console.error('Error handling message:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Keep channel open for async response
  });
  
  // Add page-specific listeners here
  document.addEventListener('DOMContentLoaded', handleDOMReady);
}

/**
 * Handle messages from background script
 * @param {Object} message - Message object
 * @param {Object} sender - Sender info
 * @returns {Promise<Object>} Response
 */
async function handleMessage(message, sender) {
  switch (message.type) {
    case 'UPDATE_SETTINGS':
      scriptSettings = { ...scriptSettings, ...message.data };
      return { success: true, settings: scriptSettings };
      
    case 'EXECUTE_ACTION':
      return await executeAction(message.action, message.data);
      
    case 'GET_PAGE_DATA':
      return getPageData();
      
    default:
      return { success: false, error: 'Unknown message type' };
  }
}

/**
 * Run main script logic
 */
async function runMainLogic() {
  // TODO: Implement your main content script logic here
  
  // Example: Find and modify elements
  const targetElement = getElement('#target-element');
  if (targetElement) {
    addClass(targetElement, 'enhanced-by-extension');
  }
  
  // Example: Create and inject custom elements
  const customElement = createElement('div', {
    id: '${name.toLowerCase().replace(/\s+/g, '-')}-widget',
    className: 'extension-widget'
  });
  
  // document.body.appendChild(customElement);
}

/**
 * Handle DOM ready event
 */
function handleDOMReady() {
  console.log('DOM ready for ${name}');
  // Add any DOM-ready specific logic here
}

/**
 * Execute an action
 * @param {string} action - Action name
 * @param {Object} data - Action data
 * @returns {Promise<Object>} Result
 */
async function executeAction(action, data) {
  console.log('Executing action:', action);
  
  switch (action) {
    case 'SAMPLE_ACTION':
      // Implement action logic
      return { success: true, result: 'Action completed' };
      
    default:
      return { success: false, error: 'Unknown action' };
  }
}

/**
 * Get page data
 * @returns {Object} Page data
 */
function getPageData() {
  return {
    success: true,
    data: {
      url: window.location.href,
      title: document.title,
      // Add more page data as needed
    }
  };
}

/**
 * Clean up when script is unloaded
 */
function cleanup() {
  console.log('Cleaning up ${name}');
  // Remove event listeners, custom elements, etc.
}

// Handle page unload
window.addEventListener('beforeunload', cleanup);

// Initialize when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
`;
}

/**
 * Generate manifest.json instructions
 * @param {string} fileName - Script file name
 * @param {string[]} matches - URL patterns
 * @param {boolean} runAtStart - Run at start flag
 * @returns {string} Instructions
 */
function generateManifestInstructions(fileName, matches, runAtStart) {
  return `
Add this to your manifest.json content_scripts array:

{
  "matches": ${JSON.stringify(matches, null, 2)},
  "js": ["src/content/${fileName}.js"],
  "run_at": "${runAtStart ? 'document_start' : 'document_idle'}"
}

Example:
"content_scripts": [
  {
    "matches": ${JSON.stringify(matches, null, 2)},
    "js": ["src/content/${fileName}.js"],
    "run_at": "${runAtStart ? 'document_start' : 'document_idle'}"
  }
]
`;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Generate Content Script Skill

Usage:
  node generate-content-script.js <name> [options]

Examples:
  node generate-content-script.js "YouTube Enhancer"
  node generate-content-script.js "Ad Blocker" --matches "https://*.example.com/*"
  node generate-content-script.js "Dark Mode" --run-at-start

Options:
  --matches <patterns>  URL patterns (comma-separated)
  --run-at-start        Run at document_start instead of document_idle
  --output <dir>        Output directory (default: src/content)
    `);
    process.exit(0);
  }
  
  const name = args[0];
  const matches = args.includes('--matches') 
    ? args[args.indexOf('--matches') + 1].split(',')
    : ['<all_urls>'];
  const runAtStart = args.includes('--run-at-start');
  const outputDir = args.includes('--output')
    ? args[args.indexOf('--output') + 1]
    : 'src/content';
  
  generateContentScript({ name, matches, runAtStart, outputDir })
    .then((result) => {
      console.log('✓', result.message);
      console.log('\n' + result.manifestInstructions);
    })
    .catch((error) => {
      console.error('✗ Error:', error.message);
      process.exit(1);
    });
}

export default { generateContentScript };

