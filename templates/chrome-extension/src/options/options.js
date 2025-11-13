/**
 * Options Page Script
 * 
 * Handles the UI logic for the extension options/settings page
 * 
 * @module options/options
 */

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  autoRun: true,
  notifications: true,
  theme: 'auto',
  size: 'medium',
  debugMode: false,
  customApiUrl: ''
};

// Current settings
let currentSettings = { ...DEFAULT_SETTINGS };

// DOM Elements
const elements = {};

/**
 * Initialize the options page
 */
async function initialize() {
  console.log('Initializing options page...');
  
  // Get DOM elements
  getDOMElements();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load and display current settings
  await loadSettings();
}

/**
 * Get references to DOM elements
 */
function getDOMElements() {
  // Settings inputs
  elements.enabledToggle = document.getElementById('enabledToggle');
  elements.autoRunToggle = document.getElementById('autoRunToggle');
  elements.notificationsToggle = document.getElementById('notificationsToggle');
  elements.themeSelect = document.getElementById('themeSelect');
  elements.sizeSelect = document.getElementById('sizeSelect');
  elements.debugModeToggle = document.getElementById('debugModeToggle');
  elements.customApiUrl = document.getElementById('customApiUrl');
  
  // Action buttons
  elements.saveBtn = document.getElementById('saveBtn');
  elements.exportBtn = document.getElementById('exportBtn');
  elements.importBtn = document.getElementById('importBtn');
  elements.resetBtn = document.getElementById('resetBtn');
  
  // Status and links
  elements.statusMessage = document.getElementById('statusMessage');
  elements.docsLink = document.getElementById('docsLink');
  elements.githubLink = document.getElementById('githubLink');
  elements.licenseLink = document.getElementById('licenseLink');
  
  // File input
  elements.importFileInput = document.getElementById('importFileInput');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Save button
  elements.saveBtn?.addEventListener('click', handleSave);
  
  // Action buttons
  elements.exportBtn?.addEventListener('click', handleExport);
  elements.importBtn?.addEventListener('click', handleImport);
  elements.resetBtn?.addEventListener('click', handleReset);
  
  // Import file input
  elements.importFileInput?.addEventListener('change', handleImportFile);
  
  // Auto-save on change (optional)
  const inputs = [
    elements.enabledToggle,
    elements.autoRunToggle,
    elements.notificationsToggle,
    elements.themeSelect,
    elements.sizeSelect,
    elements.debugModeToggle,
    elements.customApiUrl
  ];
  
  inputs.forEach(input => {
    if (input) {
      const eventType = input.type === 'checkbox' ? 'change' : 'input';
      input.addEventListener(eventType, () => {
        // Enable save button to indicate unsaved changes
        if (elements.saveBtn) {
          elements.saveBtn.textContent = 'Save Changes *';
        }
      });
    }
  });
  
  // Footer links
  elements.docsLink?.addEventListener('click', (e) => {
    e.preventDefault();
    openLink('https://github.com/{{GITHUB_USERNAME}}/{{PROJECT_NAME}}/wiki');
  });
  
  elements.githubLink?.addEventListener('click', (e) => {
    e.preventDefault();
    openLink('https://github.com/{{GITHUB_USERNAME}}/{{PROJECT_NAME}}');
  });
  
  elements.licenseLink?.addEventListener('click', (e) => {
    e.preventDefault();
    openLink('https://github.com/{{GITHUB_USERNAME}}/{{PROJECT_NAME}}/blob/main/LICENSE');
  });
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SETTINGS'
    });
    
    if (response.success) {
      currentSettings = { ...DEFAULT_SETTINGS, ...response.settings };
      displaySettings();
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Failed to load settings', 'error');
    // Use default settings
    displaySettings();
  }
}

/**
 * Display settings in the UI
 */
function displaySettings() {
  // Toggles
  if (elements.enabledToggle) {
    elements.enabledToggle.checked = currentSettings.enabled !== false;
  }
  if (elements.autoRunToggle) {
    elements.autoRunToggle.checked = currentSettings.autoRun !== false;
  }
  if (elements.notificationsToggle) {
    elements.notificationsToggle.checked = currentSettings.notifications !== false;
  }
  if (elements.debugModeToggle) {
    elements.debugModeToggle.checked = currentSettings.debugMode === true;
  }
  
  // Selects
  if (elements.themeSelect) {
    elements.themeSelect.value = currentSettings.theme || 'auto';
  }
  if (elements.sizeSelect) {
    elements.sizeSelect.value = currentSettings.size || 'medium';
  }
  
  // Text inputs
  if (elements.customApiUrl) {
    elements.customApiUrl.value = currentSettings.customApiUrl || '';
  }
  
  // Reset save button
  if (elements.saveBtn) {
    elements.saveBtn.textContent = 'Save Changes';
  }
}

/**
 * Get current settings from UI
 * @returns {Object} Current settings from form
 */
function getSettingsFromUI() {
  return {
    enabled: elements.enabledToggle?.checked ?? true,
    autoRun: elements.autoRunToggle?.checked ?? true,
    notifications: elements.notificationsToggle?.checked ?? true,
    theme: elements.themeSelect?.value || 'auto',
    size: elements.sizeSelect?.value || 'medium',
    debugMode: elements.debugModeToggle?.checked ?? false,
    customApiUrl: elements.customApiUrl?.value.trim() || ''
  };
}

/**
 * Handle save button click
 */
async function handleSave() {
  try {
    const settings = getSettingsFromUI();
    
    // Validate settings
    if (settings.customApiUrl) {
      try {
        new URL(settings.customApiUrl);
      } catch {
        showStatus('Invalid API URL', 'error');
        return;
      }
    }
    
    // Save to storage
    const response = await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      data: settings
    });
    
    if (response.success) {
      currentSettings = response.settings;
      showStatus('Settings saved successfully!', 'success');
      
      if (elements.saveBtn) {
        elements.saveBtn.textContent = 'Save Changes';
      }
    } else {
      showStatus(response.error || 'Failed to save settings', 'error');
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('Failed to save settings', 'error');
  }
}

/**
 * Handle export button click
 */
function handleExport() {
  try {
    const settings = getSettingsFromUI();
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `{{PROJECT_NAME}}-settings-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showStatus('Settings exported successfully!', 'success');
  } catch (error) {
    console.error('Error exporting settings:', error);
    showStatus('Failed to export settings', 'error');
  }
}

/**
 * Handle import button click
 */
function handleImport() {
  elements.importFileInput?.click();
}

/**
 * Handle import file selection
 * @param {Event} event - File input change event
 */
async function handleImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const importedSettings = JSON.parse(text);
    
    // Validate imported settings
    if (typeof importedSettings !== 'object') {
      throw new Error('Invalid settings format');
    }
    
    // Merge with defaults to ensure all required fields exist
    currentSettings = { ...DEFAULT_SETTINGS, ...importedSettings };
    
    // Display imported settings
    displaySettings();
    
    showStatus('Settings imported successfully! Click Save to apply.', 'success');
    
    if (elements.saveBtn) {
      elements.saveBtn.textContent = 'Save Changes *';
    }
  } catch (error) {
    console.error('Error importing settings:', error);
    showStatus('Failed to import settings: Invalid file format', 'error');
  } finally {
    // Reset file input
    event.target.value = '';
  }
}

/**
 * Handle reset button click
 */
async function handleReset() {
  const confirmed = confirm(
    'Are you sure you want to reset all settings to their default values? This cannot be undone.'
  );
  
  if (!confirmed) return;
  
  try {
    currentSettings = { ...DEFAULT_SETTINGS };
    displaySettings();
    
    // Save default settings
    const response = await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      data: currentSettings
    });
    
    if (response.success) {
      showStatus('Settings reset to defaults!', 'success');
    } else {
      showStatus('Failed to reset settings', 'error');
    }
  } catch (error) {
    console.error('Error resetting settings:', error);
    showStatus('Failed to reset settings', 'error');
  }
}

/**
 * Show status message
 * @param {string} message - Status message
 * @param {string} type - Message type ('success' or 'error')
 */
function showStatus(message, type = 'success') {
  if (!elements.statusMessage) return;
  
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message ${type}`;
  
  // Clear after 5 seconds
  setTimeout(() => {
    elements.statusMessage.textContent = '';
    elements.statusMessage.className = 'status-message';
  }, 5000);
}

/**
 * Open a link in a new tab
 * @param {string} url - URL to open
 */
function openLink(url) {
  chrome.tabs.create({ url });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

