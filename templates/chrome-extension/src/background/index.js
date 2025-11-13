/**
 * Background Service Worker
 * 
 * This is the main background script for the Chrome extension.
 * It handles extension lifecycle events, manages persistent state,
 * and coordinates communication between different parts of the extension.
 * 
 * @module background/index
 */

import { handleMessage, sendMessageToTab } from './messaging.js';

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // First time installation
    initializeExtension();
  } else if (details.reason === 'update') {
    // Extension updated
    handleExtensionUpdate(details.previousVersion);
  }
});

/**
 * Initialize extension on first install
 */
async function initializeExtension() {
  console.log('Initializing {{PROJECT_NAME}}...');
  
  // Set default settings
  await chrome.storage.local.set({
    settings: {
      enabled: true,
      version: '0.1.0'
    },
    lastUpdated: Date.now()
  });
  
  // Open options page on first install
  chrome.runtime.openOptionsPage();
}

/**
 * Handle extension update
 * @param {string} previousVersion - Previous version number
 */
async function handleExtensionUpdate(previousVersion) {
  console.log(`Extension updated from ${previousVersion}`);
  
  // Perform any necessary data migrations here
  const data = await chrome.storage.local.get('settings');
  if (data.settings) {
    data.settings.version = '0.1.0';
    await chrome.storage.local.set({ settings: data.settings });
  }
}

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    });
  
  // Return true to indicate we'll respond asynchronously
  return true;
});

// Handle browser action click (if popup is not set)
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked in tab:', tab.id);
  // Add custom behavior here
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab loaded:', tab.url);
    // Add custom behavior for when tabs finish loading
  }
});

// Listen for commands (keyboard shortcuts)
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);
  // Handle keyboard shortcuts defined in manifest
});

// Keep service worker alive if needed
// Note: Service workers in Manifest V3 have a 5-minute idle timeout
// Only keep alive if absolutely necessary for your use case
let keepAlivePort = null;

function keepServiceWorkerAlive() {
  if (!keepAlivePort) {
    keepAlivePort = chrome.runtime.connect({ name: 'keepalive' });
    keepAlivePort.onDisconnect.addListener(() => {
      keepAlivePort = null;
    });
  }
}

// Uncomment if you need to keep the service worker alive
// setInterval(keepServiceWorkerAlive, 20000);

console.log('{{PROJECT_NAME}} background service worker initialized');

