/**
 * Popup Script
 * 
 * Handles the UI logic for the extension popup
 * 
 * @module popup/popup
 */

// UI State
let isEnabled = true;
let currentSettings = {};

// DOM Elements
const elements = {
  statusLight: null,
  statusText: null,
  toggleBtn: null,
  settingsBtn: null,
  pageUrl: null,
  pageTitle: null,
  action1Btn: null,
  action2Btn: null,
  statValue1: null,
  statValue2: null,
  helpLink: null,
  feedbackLink: null
};

/**
 * Initialize the popup
 */
async function initialize() {
  console.log('Initializing popup...');
  
  // Get DOM elements
  getDOMElements();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load initial data
  await loadSettings();
  await loadPageInfo();
  await loadStats();
}

/**
 * Get references to DOM elements
 */
function getDOMElements() {
  elements.statusLight = document.getElementById('statusLight');
  elements.statusText = document.getElementById('statusText');
  elements.toggleBtn = document.getElementById('toggleBtn');
  elements.settingsBtn = document.getElementById('settingsBtn');
  elements.pageUrl = document.getElementById('pageUrl');
  elements.pageTitle = document.getElementById('pageTitle');
  elements.action1Btn = document.getElementById('action1Btn');
  elements.action2Btn = document.getElementById('action2Btn');
  elements.statValue1 = document.getElementById('statValue1');
  elements.statValue2 = document.getElementById('statValue2');
  elements.helpLink = document.getElementById('helpLink');
  elements.feedbackLink = document.getElementById('feedbackLink');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Toggle button
  elements.toggleBtn?.addEventListener('click', handleToggle);
  
  // Settings button
  elements.settingsBtn?.addEventListener('click', handleSettings);
  
  // Action buttons
  elements.action1Btn?.addEventListener('click', () => handleAction('action1'));
  elements.action2Btn?.addEventListener('click', () => handleAction('action2'));
  
  // Footer links
  elements.helpLink?.addEventListener('click', (e) => {
    e.preventDefault();
    openHelpPage();
  });
  
  elements.feedbackLink?.addEventListener('click', (e) => {
    e.preventDefault();
    openFeedbackPage();
  });
}

/**
 * Load settings from background
 */
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SETTINGS'
    });
    
    if (response.success) {
      currentSettings = response.settings;
      isEnabled = response.settings.enabled !== false;
      updateUI();
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    showError('Failed to load settings');
  }
}

/**
 * Load current page information
 */
async function loadPageInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab) {
      elements.pageUrl.textContent = tab.url || 'N/A';
      elements.pageTitle.textContent = tab.title || 'N/A';
    }
  } catch (error) {
    console.error('Error loading page info:', error);
    elements.pageUrl.textContent = 'Error loading';
    elements.pageTitle.textContent = 'Error loading';
  }
}

/**
 * Load statistics
 */
async function loadStats() {
  try {
    // Load stats from storage
    const data = await chrome.storage.local.get(['stats']);
    const stats = data.stats || { count1: 0, count2: 0 };
    
    elements.statValue1.textContent = stats.count1 || 0;
    elements.statValue2.textContent = stats.count2 || 0;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

/**
 * Update UI based on current state
 */
function updateUI() {
  // Update status indicator
  if (elements.statusLight && elements.statusText) {
    if (isEnabled) {
      elements.statusLight.classList.remove('status-inactive');
      elements.statusLight.classList.add('status-active');
      elements.statusText.textContent = 'Active';
    } else {
      elements.statusLight.classList.remove('status-active');
      elements.statusLight.classList.add('status-inactive');
      elements.statusText.textContent = 'Inactive';
    }
  }
  
  // Update toggle button
  if (elements.toggleBtn) {
    elements.toggleBtn.textContent = isEnabled ? 'Disable' : 'Enable';
  }
}

/**
 * Handle toggle button click
 */
async function handleToggle() {
  try {
    isEnabled = !isEnabled;
    
    // Update settings in background
    const response = await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      data: { enabled: isEnabled }
    });
    
    if (response.success) {
      currentSettings = response.settings;
      updateUI();
      
      // Notify content script of the change
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'UPDATE_SETTINGS',
          data: { enabled: isEnabled }
        });
      }
    }
  } catch (error) {
    console.error('Error toggling extension:', error);
    showError('Failed to toggle extension');
    // Revert state on error
    isEnabled = !isEnabled;
    updateUI();
  }
}

/**
 * Handle settings button click
 */
function handleSettings() {
  chrome.runtime.openOptionsPage();
}

/**
 * Handle action button clicks
 * @param {string} action - Action identifier
 */
async function handleAction(action) {
  try {
    console.log('Executing action:', action);
    
    // Send message to background script
    const response = await chrome.runtime.sendMessage({
      type: 'EXECUTE_ACTION',
      action: action.toUpperCase(),
      data: {}
    });
    
    if (response.success) {
      showSuccess(`Action ${action} completed`);
      await loadStats(); // Reload stats after action
    } else {
      showError(response.error || 'Action failed');
    }
  } catch (error) {
    console.error('Error executing action:', error);
    showError('Failed to execute action');
  }
}

/**
 * Open help page
 */
function openHelpPage() {
  chrome.tabs.create({
    url: 'https://github.com/{{GITHUB_USERNAME}}/{{PROJECT_NAME}}/wiki'
  });
}

/**
 * Open feedback page
 */
function openFeedbackPage() {
  chrome.tabs.create({
    url: 'https://github.com/{{GITHUB_USERNAME}}/{{PROJECT_NAME}}/issues'
  });
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
  console.log('✓', message);
  // You can implement a toast notification here
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  console.error('✗', message);
  // You can implement a toast notification here
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

