# Development Guide

This guide covers the development workflow, architecture, and best practices for {{PROJECT_NAME}}.

## Table of Contents

- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Debugging](#debugging)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Google Chrome (latest version)
- Basic knowledge of JavaScript ES6+
- Understanding of Chrome Extension APIs

### Initial Setup

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/{{GITHUB_USERNAME}}/{{PROJECT_NAME}}.git
   cd {{PROJECT_NAME}}
   npm install
   ```

2. Load the extension in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project directory

3. Make changes and reload:
   - After code changes, click the reload icon on the extension card
   - For content script changes, also refresh the target web page

## Architecture

### Manifest V3 Structure

This extension uses Chrome Extension Manifest V3, which introduces several key changes:

- **Service Workers** instead of background pages
- **Declarative permissions** with host_permissions
- **Promise-based APIs** (mostly)
- **Content Security Policy** restrictions

### Component Overview

```
┌─────────────────────────────────────────────────────┐
│                  Chrome Extension                    │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────┐    ┌──────────────┐              │
│  │   Popup UI   │    │  Options UI  │              │
│  │  (HTML/CSS)  │    │  (HTML/CSS)  │              │
│  └──────┬───────┘    └──────┬───────┘              │
│         │                    │                       │
│         │    ┌───────────────┴────────────┐         │
│         │    │                             │         │
│         └────►  Background Service Worker  ◄────┐   │
│              │    (Message Hub)            │    │   │
│              └───────────┬─────────────────┘    │   │
│                          │                      │   │
│              ┌───────────▼─────────────┐        │   │
│              │   Content Scripts        │        │   │
│              │   (Page Interaction)     │────────┘   │
│              └──────────────────────────┘            │
│                          │                            │
│              ┌───────────▼─────────────┐            │
│              │   Web Page DOM          │            │
│              └─────────────────────────┘            │
└─────────────────────────────────────────────────────┘
```

### Message Flow

1. **Popup → Background**:
   ```javascript
   // In popup
   const response = await chrome.runtime.sendMessage({
     type: 'GET_SETTINGS'
   });
   ```

2. **Background → Content Script**:
   ```javascript
   // In background
   await chrome.tabs.sendMessage(tabId, {
     type: 'UPDATE_SETTINGS',
     data: { enabled: true }
   });
   ```

3. **Content Script → Background**:
   ```javascript
   // In content script
   const response = await chrome.runtime.sendMessage({
     type: 'EXECUTE_ACTION',
     action: 'SAMPLE_ACTION'
   });
   ```

## Development Workflow

### Adding a New Feature

1. **Plan the feature**:
   - Identify which components need changes
   - Determine message flow requirements
   - Consider storage needs

2. **Implement in order**:
   - Background script logic first
   - Content script changes (if needed)
   - UI updates last

3. **Test thoroughly**:
   - Unit tests for utilities
   - Manual testing in Chrome
   - Test in different scenarios

4. **Update documentation**:
   - Code comments
   - README if user-facing
   - This guide for complex features

### Hot Reload Development

For faster development, you can set up automatic reloading:

1. Watch for file changes:
   ```bash
   npm run watch  # Add this script if needed
   ```

2. Use `chrome.runtime.reload()` in your code during development

3. Consider using a tool like `web-ext` for Firefox-compatible testing

## Testing

### Unit Tests

Located in `tests/unit/`, using Vitest:

```javascript
// tests/unit/storage.test.js
import { describe, it, expect } from 'vitest';
import { getItem, setItem } from '../../src/utils/storage.js';

describe('Storage utilities', () => {
  it('should save and retrieve items', async () => {
    await setItem('testKey', 'testValue');
    const value = await getItem('testKey');
    expect(value).toBe('testValue');
  });
});
```

Run tests:
```bash
npm test              # Run all tests
npm run test:ui       # Run with UI
npm run test:coverage # Generate coverage report
```

### Manual Testing

1. **Popup Testing**:
   - Click extension icon
   - Test all buttons and interactions
   - Verify settings persistence

2. **Content Script Testing**:
   - Navigate to target pages
   - Open DevTools console
   - Check for errors or warnings
   - Verify DOM modifications

3. **Background Script Testing**:
   - Open extension service worker console: `chrome://extensions/` → "service worker"
   - Check message handling
   - Verify storage operations

### Integration Testing

Test the complete flow:
```bash
# Example test scenario
1. Install extension
2. Open popup → Toggle settings
3. Navigate to test page
4. Verify content script behavior
5. Check background script logs
6. Open options page → Export settings
7. Reload extension → Import settings
8. Verify persistence
```

## Debugging

### Chrome DevTools

1. **Service Worker Console**:
   - Go to `chrome://extensions/`
   - Click "service worker" link under your extension
   - View logs and debug

2. **Popup DevTools**:
   - Right-click the popup
   - Select "Inspect"
   - Debug HTML/CSS/JS

3. **Content Script DevTools**:
   - Open DevTools on the target page
   - Content script errors appear in the console
   - Set breakpoints in Sources tab

### Common Issues

**Service worker not starting**:
```javascript
// Check manifest.json syntax
// Verify background.service_worker path
// Check for syntax errors in background/index.js
```

**Content script not injecting**:
```javascript
// Verify matches patterns in manifest.json
// Check permissions
// Ensure script paths are correct
// Reload both extension and page
```

**Storage not persisting**:
```javascript
// Check storage permissions
// Verify chrome.storage API usage
// Check for quota limits
// Use chrome.storage.local over sync for larger data
```

### Debug Mode

Enable debug mode in options:
```javascript
// In your code
if (settings.debugMode) {
  console.log('[DEBUG]', 'Detailed log message');
}
```

## Best Practices

### Code Organization

1. **Modular structure**: Keep files focused on single responsibilities
2. **Shared utilities**: Place common code in `src/utils/`
3. **Clear naming**: Use descriptive function and variable names
4. **JSDoc comments**: Document public APIs

### Performance

1. **Lazy loading**: Load resources only when needed
2. **Debounce/throttle**: Limit frequent operations
3. **Efficient DOM queries**: Cache selectors when possible
4. **Background script**: Keep it lightweight (5-minute timeout)

### Security

1. **Content Security Policy**: Follow CSP rules in Manifest V3
2. **Input validation**: Sanitize all user input
3. **XSS prevention**: Use `textContent` over `innerHTML`
4. **Permissions**: Request only necessary permissions

### Manifest V3 Specific

1. **Use service workers**: Background pages are deprecated
2. **Promises over callbacks**: Use async/await
3. **Dynamic imports**: Load code on demand
4. **Host permissions**: Use declaratively in manifest

## Common Patterns

### Storage Pattern

```javascript
// src/utils/storage.js
export async function getItem(key, defaultValue = null) {
  const result = await chrome.storage.local.get(key);
  return result[key] ?? defaultValue;
}

export async function setItem(key, value) {
  await chrome.storage.local.set({ [key]: value });
}
```

### Message Pattern

```javascript
// Background message handler
async function handleMessage(message, sender) {
  switch (message.type) {
    case 'GET_DATA':
      return await getData();
    case 'SET_DATA':
      return await setData(message.data);
    default:
      throw new Error('Unknown message type');
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(err => sendResponse({ error: err.message }));
  return true; // Keep channel open for async response
});
```

### Content Script Pattern

```javascript
// Wait for element
async function waitForElement(selector, timeout = 5000) {
  const existing = document.querySelector(selector);
  if (existing) return existing;
  
  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
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
      reject(new Error(`Element ${selector} not found`));
    }, timeout);
  });
}
```

### Error Handling Pattern

```javascript
// Consistent error handling
async function performAction() {
  try {
    const result = await riskyOperation();
    return { success: true, data: result };
  } catch (error) {
    console.error('Action failed:', error);
    return { success: false, error: error.message };
  }
}
```

## Additional Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/migrating/)
- [Chrome Extension Samples](https://github.com/GoogleChrome/chrome-extensions-samples)
- [Web Extensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)

## Getting Help

- Check the [troubleshooting section](../README.md#troubleshooting)
- Search [existing issues](https://github.com/{{GITHUB_USERNAME}}/{{PROJECT_NAME}}/issues)
- Ask in [discussions](https://github.com/{{GITHUB_USERNAME}}/{{PROJECT_NAME}}/discussions)
- Review [Chrome Extension documentation](https://developer.chrome.com/docs/extensions/)

---

Happy coding! 🚀

