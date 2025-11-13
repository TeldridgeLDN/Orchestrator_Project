/**
 * Content Script
 * 
 * This script runs in the context of web pages.
 * It can access and modify the DOM of the current page.
 * 
 * @module content/index
 */

import { getElement, createElement, addClass, removeClass } from './dom-utils.js';

// Extension state
let isEnabled = true;
let settings = {};

/**
 * Initialize the content script
 */
async function initialize() {
  console.log('{{PROJECT_NAME}} content script initialized on:', window.location.href);
  
  // Get settings from background
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SETTINGS'
    });
    
    if (response.success) {
      settings = response.settings;
      isEnabled = settings.enabled !== false;
    }
  } catch (error) {
    console.error('Error getting settings:', error);
  }
  
  // Only run if enabled
  if (!isEnabled) {
    console.log('Extension is disabled');
    return;
  }
  
  // Set up event listeners
  setupEventListeners();
  
  // Run main functionality
  runMainFunctionality();
}

/**
 * Set up event listeners for the page
 */
function setupEventListeners() {
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender)
      .then(sendResponse)
      .catch((error) => {
        console.error('Error handling message:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Indicates async response
  });
  
  // Listen for DOM changes if needed
  observeDOMChanges();
}

/**
 * Handle messages from background script
 * @param {Object} message - Incoming message
 * @param {Object} sender - Sender information
 * @returns {Promise<Object>} Response
 */
async function handleMessage(message, sender) {
  switch (message.type) {
    case 'TOGGLE_EXTENSION':
      isEnabled = !isEnabled;
      return { success: true, enabled: isEnabled };
      
    case 'UPDATE_SETTINGS':
      settings = { ...settings, ...message.data };
      return { success: true, settings };
      
    case 'GET_PAGE_INFO':
      return getPageInfo();
      
    default:
      return { success: false, error: 'Unknown message type' };
  }
}

/**
 * Get information about the current page
 * @returns {Object} Page information
 */
function getPageInfo() {
  return {
    success: true,
    info: {
      url: window.location.href,
      title: document.title,
      host: window.location.host,
      path: window.location.pathname,
      readyState: document.readyState
    }
  };
}

/**
 * Run the main functionality of the extension
 */
function runMainFunctionality() {
  // Add your main content script logic here
  console.log('Running main functionality...');
  
  // Example: Add a custom element to the page
  // const customElement = createElement('div', {
  //   id: 'custom-extension-element',
  //   className: 'extension-widget'
  // });
  // document.body.appendChild(customElement);
}

/**
 * Observe DOM changes using MutationObserver
 */
function observeDOMChanges() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Handle added/removed nodes
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            handleNewElement(node);
          }
        });
      }
    });
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Handle newly added elements to the page
 * @param {Element} element - New element
 */
function handleNewElement(element) {
  // Add custom logic for handling new elements
  // console.log('New element added:', element);
}

/**
 * Clean up resources when content script is unloaded
 */
function cleanup() {
  console.log('Content script cleanup');
  // Remove any event listeners or custom elements
}

// Handle page unload
window.addEventListener('beforeunload', cleanup);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

