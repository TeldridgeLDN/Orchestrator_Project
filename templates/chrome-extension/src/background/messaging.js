/**
 * Messaging Module
 * 
 * Handles communication between different parts of the extension:
 * - Content scripts <-> Background
 * - Popup <-> Background
 * - Options <-> Background
 * 
 * @module background/messaging
 */

/**
 * Handle incoming messages from content scripts or popup
 * @param {Object} message - Message object
 * @param {Object} sender - Sender information
 * @returns {Promise<Object>} Response object
 */
export async function handleMessage(message, sender) {
  console.log('Received message:', message.type, 'from:', sender);
  
  switch (message.type) {
    case 'GET_SETTINGS':
      return await getSettings();
      
    case 'UPDATE_SETTINGS':
      return await updateSettings(message.data);
      
    case 'GET_TAB_INFO':
      return await getTabInfo(sender.tab?.id);
      
    case 'EXECUTE_ACTION':
      return await executeAction(message.action, message.data);
      
    default:
      console.warn('Unknown message type:', message.type);
      return { success: false, error: 'Unknown message type' };
  }
}

/**
 * Get extension settings from storage
 * @returns {Promise<Object>} Settings object
 */
async function getSettings() {
  try {
    const data = await chrome.storage.local.get('settings');
    return {
      success: true,
      settings: data.settings || { enabled: true }
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update extension settings
 * @param {Object} newSettings - New settings to save
 * @returns {Promise<Object>} Result object
 */
async function updateSettings(newSettings) {
  try {
    const data = await chrome.storage.local.get('settings');
    const settings = { ...data.settings, ...newSettings };
    
    await chrome.storage.local.set({ settings, lastUpdated: Date.now() });
    
    return { success: true, settings };
  } catch (error) {
    console.error('Error updating settings:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get information about a specific tab
 * @param {number} tabId - Tab ID
 * @returns {Promise<Object>} Tab information
 */
async function getTabInfo(tabId) {
  try {
    if (!tabId) {
      return { success: false, error: 'No tab ID provided' };
    }
    
    const tab = await chrome.tabs.get(tabId);
    return {
      success: true,
      tab: {
        id: tab.id,
        url: tab.url,
        title: tab.title,
        active: tab.active
      }
    };
  } catch (error) {
    console.error('Error getting tab info:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute a specific action
 * @param {string} action - Action name
 * @param {Object} data - Action data
 * @returns {Promise<Object>} Result object
 */
async function executeAction(action, data) {
  try {
    console.log('Executing action:', action, 'with data:', data);
    
    // Add your custom actions here
    switch (action) {
      case 'SAMPLE_ACTION':
        // Implement your action logic
        return { success: true, result: 'Action executed' };
        
      default:
        return { success: false, error: 'Unknown action' };
    }
  } catch (error) {
    console.error('Error executing action:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a message to a specific tab
 * @param {number} tabId - Target tab ID
 * @param {Object} message - Message to send
 * @returns {Promise<Object>} Response from the tab
 */
export async function sendMessageToTab(tabId, message) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, message);
    return response;
  } catch (error) {
    console.error('Error sending message to tab:', error);
    throw error;
  }
}

/**
 * Send a message to all tabs
 * @param {Object} message - Message to broadcast
 * @returns {Promise<Array>} Array of responses
 */
export async function broadcastMessage(message) {
  try {
    const tabs = await chrome.tabs.query({});
    const promises = tabs.map(tab => 
      sendMessageToTab(tab.id, message).catch(err => ({
        tabId: tab.id,
        error: err.message
      }))
    );
    
    return await Promise.all(promises);
  } catch (error) {
    console.error('Error broadcasting message:', error);
    throw error;
  }
}

