/**
 * API Utilities
 * 
 * Helper functions for making HTTP requests and handling API responses.
 * Provides a consistent interface for external API calls.
 * 
 * @module utils/api
 */

/**
 * Default API configuration
 */
const DEFAULT_CONFIG = {
  baseUrl: '{{API_BASE_URL}}',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};

/**
 * Make an HTTP request
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
async function request(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    timeout = DEFAULT_CONFIG.timeout,
    baseUrl = DEFAULT_CONFIG.baseUrl
  } = options;
  
  // Build full URL
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  // Build request options
  const fetchOptions = {
    method,
    headers: {
      ...DEFAULT_CONFIG.headers,
      ...headers
    }
  };
  
  // Add body if present
  if (body) {
    if (typeof body === 'object' && !(body instanceof FormData)) {
      fetchOptions.body = JSON.stringify(body);
    } else {
      fetchOptions.body = body;
    }
  }
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  fetchOptions.signal = controller.signal;
  
  try {
    const response = await fetch(fullUrl, fetchOptions);
    clearTimeout(timeoutId);
    
    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Parse response
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (contentType?.includes('text/')) {
      data = await response.text();
    } else {
      data = await response.blob();
    }
    
    return {
      success: true,
      data,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle different error types
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    throw error;
  }
}

/**
 * Make a GET request
 * @param {string} url - Request URL
 * @param {Object} [options={}] - Request options
 * @returns {Promise<Object>} Response data
 */
export async function get(url, options = {}) {
  return await request(url, { ...options, method: 'GET' });
}

/**
 * Make a POST request
 * @param {string} url - Request URL
 * @param {*} body - Request body
 * @param {Object} [options={}] - Request options
 * @returns {Promise<Object>} Response data
 */
export async function post(url, body, options = {}) {
  return await request(url, { ...options, method: 'POST', body });
}

/**
 * Make a PUT request
 * @param {string} url - Request URL
 * @param {*} body - Request body
 * @param {Object} [options={}] - Request options
 * @returns {Promise<Object>} Response data
 */
export async function put(url, body, options = {}) {
  return await request(url, { ...options, method: 'PUT', body });
}

/**
 * Make a PATCH request
 * @param {string} url - Request URL
 * @param {*} body - Request body
 * @param {Object} [options={}] - Request options
 * @returns {Promise<Object>} Response data
 */
export async function patch(url, body, options = {}) {
  return await request(url, { ...options, method: 'PATCH', body });
}

/**
 * Make a DELETE request
 * @param {string} url - Request URL
 * @param {Object} [options={}] - Request options
 * @returns {Promise<Object>} Response data
 */
export async function del(url, options = {}) {
  return await request(url, { ...options, method: 'DELETE' });
}

/**
 * Build query string from object
 * @param {Object} params - Query parameters
 * @returns {string} Query string
 */
export function buildQueryString(params) {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v));
      } else {
        searchParams.append(key, value);
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Parse query string to object
 * @param {string} queryString - Query string
 * @returns {Object} Parsed parameters
 */
export function parseQueryString(queryString) {
  const params = {};
  const searchParams = new URLSearchParams(queryString);
  
  for (const [key, value] of searchParams.entries()) {
    if (params[key]) {
      // Handle multiple values for same key
      if (Array.isArray(params[key])) {
        params[key].push(value);
      } else {
        params[key] = [params[key], value];
      }
    } else {
      params[key] = value;
    }
  }
  
  return params;
}

/**
 * Retry a request with exponential backoff
 * @param {Function} requestFn - Request function to retry
 * @param {number} [maxRetries=3] - Maximum number of retries
 * @param {number} [baseDelay=1000] - Base delay in ms
 * @returns {Promise<Object>} Response data
 */
export async function retryRequest(requestFn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on final attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Make multiple requests in parallel
 * @param {Array<Function>} requests - Array of request functions
 * @returns {Promise<Array>} Array of responses
 */
export async function parallel(requests) {
  return await Promise.all(requests.map(fn => fn()));
}

/**
 * Make multiple requests in sequence
 * @param {Array<Function>} requests - Array of request functions
 * @returns {Promise<Array>} Array of responses
 */
export async function sequence(requests) {
  const results = [];
  
  for (const requestFn of requests) {
    const result = await requestFn();
    results.push(result);
  }
  
  return results;
}

/**
 * Create an API client with base configuration
 * @param {Object} config - Client configuration
 * @returns {Object} API client
 */
export function createClient(config = {}) {
  const clientConfig = { ...DEFAULT_CONFIG, ...config };
  
  return {
    get: (url, options) => get(url, { ...clientConfig, ...options }),
    post: (url, body, options) => post(url, body, { ...clientConfig, ...options }),
    put: (url, body, options) => put(url, body, { ...clientConfig, ...options }),
    patch: (url, body, options) => patch(url, body, { ...clientConfig, ...options }),
    delete: (url, options) => del(url, { ...clientConfig, ...options }),
    request: (url, options) => request(url, { ...clientConfig, ...options })
  };
}

/**
 * Check if a URL is accessible
 * @param {string} url - URL to check
 * @returns {Promise<boolean>} True if accessible
 */
export async function isAccessible(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors'
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Download a file from URL
 * @param {string} url - File URL
 * @param {string} [filename] - Desired filename
 * @returns {Promise<Blob>} Downloaded file as Blob
 */
export async function downloadFile(url, filename) {
  const response = await get(url);
  
  if (!response.success) {
    throw new Error('Failed to download file');
  }
  
  // If filename provided and running in extension context
  if (filename && typeof chrome !== 'undefined' && chrome.downloads) {
    chrome.downloads.download({
      url,
      filename
    });
  }
  
  return response.data;
}

/**
 * Upload a file
 * @param {string} url - Upload URL
 * @param {File|Blob} file - File to upload
 * @param {string} [fieldName='file'] - Form field name
 * @param {Object} [additionalData={}] - Additional form data
 * @returns {Promise<Object>} Response data
 */
export async function uploadFile(url, file, fieldName = 'file', additionalData = {}) {
  const formData = new FormData();
  formData.append(fieldName, file);
  
  // Add additional data
  Object.entries(additionalData).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  return await post(url, formData, {
    headers: {
      // Don't set Content-Type, let browser set it with boundary
    }
  });
}

export default {
  get,
  post,
  put,
  patch,
  delete: del,
  buildQueryString,
  parseQueryString,
  retryRequest,
  parallel,
  sequence,
  createClient,
  isAccessible,
  downloadFile,
  uploadFile
};

