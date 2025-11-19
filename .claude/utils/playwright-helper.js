/**
 * Playwright Helper Utility
 * 
 * Provides common Playwright operations for design review and testing workflows.
 * Supports multiple browsers and includes error handling.
 * 
 * @module PlaywrightHelper
 * @version 1.0.0
 */

import { chromium, firefox, webkit } from 'playwright';

/**
 * Helper class for common Playwright operations
 */
export class PlaywrightHelper {
  /**
   * Launch a browser with specified options
   * @param {string} browserType - 'chromium', 'firefox', or 'webkit'
   * @param {object} options - Browser launch options
   * @returns {Promise<Browser>} Browser instance
   * @throws {Error} If browser type is invalid
   * 
   * @example
   * const browser = await PlaywrightHelper.launchBrowser('chromium', {
   *   headless: true,
   *   timeout: 30000
   * });
   */
  static async launchBrowser(browserType = 'chromium', options = {}) {
    const browsers = { chromium, firefox, webkit };
    
    if (!browsers[browserType]) {
      throw new Error(
        `Invalid browser type: ${browserType}. ` +
        `Must be one of: chromium, firefox, webkit`
      );
    }
    
    const defaultOptions = {
      headless: true,
      timeout: 30000
    };
    
    try {
      return await browsers[browserType].launch({
        ...defaultOptions,
        ...options
      });
    } catch (error) {
      throw new Error(
        `Failed to launch ${browserType} browser: ${error.message}`
      );
    }
  }
  
  /**
   * Capture screenshot of a page
   * @param {Page} page - Playwright page object
   * @param {string} path - Path to save screenshot
   * @param {object} options - Screenshot options
   * @returns {Promise<Buffer>} Screenshot data
   * @throws {Error} If screenshot capture fails
   * 
   * @example
   * const screenshot = await PlaywrightHelper.captureScreenshot(
   *   page,
   *   './screenshots/homepage.png',
   *   { fullPage: true }
   * );
   */
  static async captureScreenshot(page, path, options = {}) {
    if (!page) {
      throw new Error('Page object is required');
    }
    
    const defaultOptions = {
      fullPage: false,
      type: 'png'
    };
    
    try {
      return await page.screenshot({ 
        path, 
        ...defaultOptions, 
        ...options 
      });
    } catch (error) {
      throw new Error(
        `Failed to capture screenshot: ${error.message}`
      );
    }
  }
  
  /**
   * Navigate and wait for page to load completely
   * @param {Page} page - Playwright page object
   * @param {string} url - URL to navigate to
   * @param {object} options - Navigation options
   * @returns {Promise<Response>} Navigation response
   * @throws {Error} If navigation fails
   * 
   * @example
   * const response = await PlaywrightHelper.navigateAndWait(
   *   page,
   *   'http://localhost:3000'
   * );
   */
  static async navigateAndWait(page, url, options = {}) {
    if (!page) {
      throw new Error('Page object is required');
    }
    
    if (!url) {
      throw new Error('URL is required');
    }
    
    const defaultOptions = {
      waitUntil: 'networkidle',
      timeout: 30000
    };
    
    try {
      return await page.goto(url, {
        ...defaultOptions,
        ...options
      });
    } catch (error) {
      throw new Error(
        `Failed to navigate to ${url}: ${error.message}`
      );
    }
  }
  
  /**
   * Run accessibility audit using axe-core
   * @param {Page} page - Playwright page object
   * @param {object} options - axe-core options
   * @returns {Promise<object>} Accessibility audit results
   * @throws {Error} If accessibility audit fails
   * 
   * @example
   * const results = await PlaywrightHelper.runAccessibilityAudit(page);
   * console.log(`Violations: ${results.violations.length}`);
   */
  static async runAccessibilityAudit(page, options = {}) {
    if (!page) {
      throw new Error('Page object is required');
    }
    
    try {
      // Inject axe-core library
      await page.addScriptTag({
        url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js'
      });
      
      // Run accessibility audit
      const results = await page.evaluate((axeOptions) => {
        return new Promise((resolve, reject) => {
          // @ts-ignore
          if (typeof axe === 'undefined') {
            reject(new Error('axe-core not loaded'));
            return;
          }
          
          // @ts-ignore
          axe.run(axeOptions, (err, results) => {
            if (err) {
              reject(err);
            } else {
              resolve(results);
            }
          });
        });
      }, options);
      
      return results;
    } catch (error) {
      throw new Error(
        `Failed to run accessibility audit: ${error.message}`
      );
    }
  }
  
  /**
   * Wait for element to be visible
   * @param {Page} page - Playwright page object
   * @param {string} selector - CSS selector
   * @param {object} options - Wait options
   * @returns {Promise<ElementHandle>} Element handle
   * @throws {Error} If element not found
   * 
   * @example
   * const element = await PlaywrightHelper.waitForElement(
   *   page,
   *   '.hero-section'
   * );
   */
  static async waitForElement(page, selector, options = {}) {
    if (!page) {
      throw new Error('Page object is required');
    }
    
    if (!selector) {
      throw new Error('Selector is required');
    }
    
    const defaultOptions = {
      state: 'visible',
      timeout: 10000
    };
    
    try {
      await page.waitForSelector(selector, {
        ...defaultOptions,
        ...options
      });
      
      return await page.$(selector);
    } catch (error) {
      throw new Error(
        `Element not found: ${selector} - ${error.message}`
      );
    }
  }
  
  /**
   * Create a new browser context with custom settings
   * @param {Browser} browser - Browser instance
   * @param {object} options - Context options
   * @returns {Promise<BrowserContext>} Browser context
   * 
   * @example
   * const context = await PlaywrightHelper.createContext(browser, {
   *   viewport: { width: 1920, height: 1080 },
   *   userAgent: 'Custom User Agent'
   * });
   */
  static async createContext(browser, options = {}) {
    if (!browser) {
      throw new Error('Browser instance is required');
    }
    
    const defaultOptions = {
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Design Review Bot)'
    };
    
    try {
      return await browser.newContext({
        ...defaultOptions,
        ...options
      });
    } catch (error) {
      throw new Error(
        `Failed to create browser context: ${error.message}`
      );
    }
  }
  
  /**
   * Take multiple screenshots at different viewport sizes
   * @param {Page} page - Playwright page object
   * @param {string} basePath - Base path for screenshots
   * @param {Array<object>} viewports - Array of viewport configurations
   * @returns {Promise<Array<string>>} Array of screenshot paths
   * 
   * @example
   * const paths = await PlaywrightHelper.captureResponsiveScreenshots(
   *   page,
   *   './screenshots/homepage',
   *   [
   *     { name: 'mobile', width: 375, height: 667 },
   *     { name: 'tablet', width: 768, height: 1024 },
   *     { name: 'desktop', width: 1920, height: 1080 }
   *   ]
   * );
   */
  static async captureResponsiveScreenshots(page, basePath, viewports) {
    if (!page) {
      throw new Error('Page object is required');
    }
    
    const defaultViewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];
    
    const useViewports = viewports || defaultViewports;
    const screenshotPaths = [];
    
    for (const viewport of useViewports) {
      try {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height
        });
        
        const screenshotPath = `${basePath}-${viewport.name}.png`;
        await this.captureScreenshot(page, screenshotPath, {
          fullPage: true
        });
        
        screenshotPaths.push(screenshotPath);
      } catch (error) {
        console.error(
          `Failed to capture ${viewport.name} screenshot: ${error.message}`
        );
      }
    }
    
    return screenshotPaths;
  }
  
  /**
   * Check if dev server is running
   * @param {string} url - Server URL to check
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>} True if server is running
   * 
   * @example
   * const isRunning = await PlaywrightHelper.checkDevServer(
   *   'http://localhost:3000'
   * );
   */
  static async checkDevServer(url, timeout = 5000) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(timeout)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default PlaywrightHelper;

