/**
 * Storage Utilities
 * 
 * Helper functions for Chrome extension storage operations.
 * Provides a simplified interface to chrome.storage.local API.
 * 
 * @module utils/storage
 */

/**
 * Get an item from storage
 * @param {string} key - Storage key
 * @param {*} [defaultValue=null] - Default value if key doesn't exist
 * @returns {Promise<*>} Stored value or default
 */
export async function getItem(key, defaultValue = null) {
  try {
    const result = await chrome.storage.local.get(key);
    return result[key] ?? defaultValue;
  } catch (error) {
    console.error(`Error getting item "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Set an item in storage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {Promise<boolean>} Success status
 */
export async function setItem(key, value) {
  try {
    await chrome.storage.local.set({ [key]: value });
    return true;
  } catch (error) {
    console.error(`Error setting item "${key}":`, error);
    return false;
  }
}

/**
 * Remove an item from storage
 * @param {string} key - Storage key
 * @returns {Promise<boolean>} Success status
 */
export async function removeItem(key) {
  try {
    await chrome.storage.local.remove(key);
    return true;
  } catch (error) {
    console.error(`Error removing item "${key}":`, error);
    return false;
  }
}

/**
 * Get multiple items from storage
 * @param {string[]} keys - Array of storage keys
 * @returns {Promise<Object>} Object with key-value pairs
 */
export async function getItems(keys) {
  try {
    const result = await chrome.storage.local.get(keys);
    return result;
  } catch (error) {
    console.error('Error getting items:', error);
    return {};
  }
}

/**
 * Set multiple items in storage
 * @param {Object} items - Object with key-value pairs
 * @returns {Promise<boolean>} Success status
 */
export async function setItems(items) {
  try {
    await chrome.storage.local.set(items);
    return true;
  } catch (error) {
    console.error('Error setting items:', error);
    return false;
  }
}

/**
 * Remove multiple items from storage
 * @param {string[]} keys - Array of storage keys
 * @returns {Promise<boolean>} Success status
 */
export async function removeItems(keys) {
  try {
    await chrome.storage.local.remove(keys);
    return true;
  } catch (error) {
    console.error('Error removing items:', error);
    return false;
  }
}

/**
 * Clear all items from storage
 * @returns {Promise<boolean>} Success status
 */
export async function clear() {
  try {
    await chrome.storage.local.clear();
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
}

/**
 * Get all items from storage
 * @returns {Promise<Object>} All stored items
 */
export async function getAll() {
  try {
    const result = await chrome.storage.local.get(null);
    return result;
  } catch (error) {
    console.error('Error getting all items:', error);
    return {};
  }
}

/**
 * Check if a key exists in storage
 * @param {string} key - Storage key
 * @returns {Promise<boolean>} True if key exists
 */
export async function hasItem(key) {
  try {
    const result = await chrome.storage.local.get(key);
    return key in result;
  } catch (error) {
    console.error(`Error checking if item "${key}" exists:`, error);
    return false;
  }
}

/**
 * Get storage usage information
 * @returns {Promise<Object>} Storage usage info
 */
export async function getStorageInfo() {
  try {
    const bytesInUse = await chrome.storage.local.getBytesInUse();
    const quota = chrome.storage.local.QUOTA_BYTES;
    const percentUsed = (bytesInUse / quota) * 100;
    
    return {
      bytesInUse,
      quota,
      percentUsed,
      bytesRemaining: quota - bytesInUse
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return {
      bytesInUse: 0,
      quota: 0,
      percentUsed: 0,
      bytesRemaining: 0
    };
  }
}

/**
 * Listen for storage changes
 * @param {Function} callback - Callback function (changes, areaName)
 * @returns {Function} Cleanup function to remove listener
 */
export function onStorageChanged(callback) {
  const listener = (changes, areaName) => {
    if (areaName === 'local') {
      callback(changes, areaName);
    }
  };
  
  chrome.storage.onChanged.addListener(listener);
  
  // Return cleanup function
  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}

/**
 * Watch a specific key for changes
 * @param {string} key - Storage key to watch
 * @param {Function} callback - Callback function (newValue, oldValue)
 * @returns {Function} Cleanup function to remove listener
 */
export function watchItem(key, callback) {
  return onStorageChanged((changes) => {
    if (key in changes) {
      const { newValue, oldValue } = changes[key];
      callback(newValue, oldValue);
    }
  });
}

/**
 * Store data with expiration
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @param {number} expirationMs - Expiration time in milliseconds
 * @returns {Promise<boolean>} Success status
 */
export async function setItemWithExpiration(key, value, expirationMs) {
  const expiresAt = Date.now() + expirationMs;
  return await setItem(key, {
    value,
    expiresAt
  });
}

/**
 * Get data with expiration check
 * @param {string} key - Storage key
 * @param {*} [defaultValue=null] - Default value if expired or not found
 * @returns {Promise<*>} Stored value or default
 */
export async function getItemWithExpiration(key, defaultValue = null) {
  const data = await getItem(key);
  
  if (!data || typeof data !== 'object' || !('expiresAt' in data)) {
    return defaultValue;
  }
  
  if (Date.now() > data.expiresAt) {
    // Data expired, remove it
    await removeItem(key);
    return defaultValue;
  }
  
  return data.value;
}

/**
 * Migrate data from old key to new key
 * @param {string} oldKey - Old storage key
 * @param {string} newKey - New storage key
 * @param {boolean} [removeOld=true] - Remove old key after migration
 * @returns {Promise<boolean>} Success status
 */
export async function migrateKey(oldKey, newKey, removeOld = true) {
  try {
    const value = await getItem(oldKey);
    
    if (value !== null) {
      await setItem(newKey, value);
      
      if (removeOld) {
        await removeItem(oldKey);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error migrating key "${oldKey}" to "${newKey}":`, error);
    return false;
  }
}

export default {
  getItem,
  setItem,
  removeItem,
  getItems,
  setItems,
  removeItems,
  clear,
  getAll,
  hasItem,
  getStorageInfo,
  onStorageChanged,
  watchItem,
  setItemWithExpiration,
  getItemWithExpiration,
  migrateKey
};

