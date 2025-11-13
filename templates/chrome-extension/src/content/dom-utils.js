/**
 * DOM Utility Functions
 * 
 * Helper functions for DOM manipulation in content scripts.
 * 
 * @module content/dom-utils
 */

/**
 * Get an element by selector
 * @param {string} selector - CSS selector
 * @param {Element} [context=document] - Context to search within
 * @returns {Element|null} Found element or null
 */
export function getElement(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * Get all elements matching a selector
 * @param {string} selector - CSS selector
 * @param {Element} [context=document] - Context to search within
 * @returns {NodeList} List of matching elements
 */
export function getAllElements(selector, context = document) {
  return context.querySelectorAll(selector);
}

/**
 * Create a new element with attributes
 * @param {string} tagName - HTML tag name
 * @param {Object} [attributes={}] - Element attributes
 * @param {string} [textContent] - Text content
 * @returns {Element} Created element
 */
export function createElement(tagName, attributes = {}, textContent = '') {
  const element = document.createElement(tagName);
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('data-')) {
      element.setAttribute(key, value);
    } else {
      element[key] = value;
    }
  });
  
  // Set text content
  if (textContent) {
    element.textContent = textContent;
  }
  
  return element;
}

/**
 * Add class(es) to an element
 * @param {Element} element - Target element
 * @param {...string} classNames - Class names to add
 */
export function addClass(element, ...classNames) {
  if (element && element.classList) {
    element.classList.add(...classNames);
  }
}

/**
 * Remove class(es) from an element
 * @param {Element} element - Target element
 * @param {...string} classNames - Class names to remove
 */
export function removeClass(element, ...classNames) {
  if (element && element.classList) {
    element.classList.remove(...classNames);
  }
}

/**
 * Toggle a class on an element
 * @param {Element} element - Target element
 * @param {string} className - Class name to toggle
 * @param {boolean} [force] - Force add or remove
 * @returns {boolean} True if class is present after toggle
 */
export function toggleClass(element, className, force) {
  if (element && element.classList) {
    return element.classList.toggle(className, force);
  }
  return false;
}

/**
 * Check if element has a class
 * @param {Element} element - Target element
 * @param {string} className - Class name to check
 * @returns {boolean} True if element has the class
 */
export function hasClass(element, className) {
  return element && element.classList && element.classList.contains(className);
}

/**
 * Remove an element from the DOM
 * @param {Element} element - Element to remove
 */
export function removeElement(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * Insert element after a reference element
 * @param {Element} newElement - Element to insert
 * @param {Element} referenceElement - Reference element
 */
export function insertAfter(newElement, referenceElement) {
  if (referenceElement && referenceElement.parentNode) {
    referenceElement.parentNode.insertBefore(
      newElement,
      referenceElement.nextSibling
    );
  }
}

/**
 * Insert element before a reference element
 * @param {Element} newElement - Element to insert
 * @param {Element} referenceElement - Reference element
 */
export function insertBefore(newElement, referenceElement) {
  if (referenceElement && referenceElement.parentNode) {
    referenceElement.parentNode.insertBefore(newElement, referenceElement);
  }
}

/**
 * Wait for an element to appear in the DOM
 * @param {string} selector - CSS selector
 * @param {number} [timeout=10000] - Timeout in milliseconds
 * @returns {Promise<Element>} Found element
 */
export function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const element = getElement(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const element = getElement(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Get element position and dimensions
 * @param {Element} element - Target element
 * @returns {Object} Position and size information
 */
export function getElementRect(element) {
  if (!element) return null;
  
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom,
    right: rect.right
  };
}

/**
 * Check if element is visible in viewport
 * @param {Element} element - Target element
 * @returns {boolean} True if element is visible
 */
export function isElementVisible(element) {
  if (!element) return false;
  
  const rect = getElementRect(element);
  if (!rect) return false;
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Add event listener with automatic cleanup
 * @param {Element} element - Target element
 * @param {string} eventType - Event type
 * @param {Function} handler - Event handler
 * @param {Object} [options] - Event listener options
 * @returns {Function} Cleanup function
 */
export function addEvent(element, eventType, handler, options) {
  if (element && eventType && handler) {
    element.addEventListener(eventType, handler, options);
    
    // Return cleanup function
    return () => {
      element.removeEventListener(eventType, handler, options);
    };
  }
  
  return () => {};
}

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle a function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

