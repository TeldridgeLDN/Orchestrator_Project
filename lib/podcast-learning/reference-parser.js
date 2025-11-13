/**
 * Reference Parser for Podcast Learning Extraction
 * Validates reference links and extracts metadata
 */

import chalk from 'chalk';
import validator from 'validator';
import fs from 'fs/promises';
import path from 'path';

/**
 * Validates and fetches metadata for a single URL
 * @param {string} url - URL to validate
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} - Validation result
 */
export async function validateUrl(url, options = {}) {
  const {
    timeout = 10000,
    followRedirects = true,
    maxRedirects = 5
  } = options;

  const result = {
    url,
    valid: false,
    reachable: false,
    status: null,
    statusText: null,
    redirected: false,
    finalUrl: null,
    title: null,
    description: null,
    error: null,
    metadata: {}
  };

  // Step 1: Format validation
  if (!validator.isURL(url, { require_protocol: true, protocols: ['http', 'https'] })) {
    result.error = 'Invalid URL format';
    return result;
  }

  result.valid = true;

  // Step 2: Reachability check
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const fetchOptions = {
      method: 'HEAD', // Use HEAD to avoid downloading full content
      redirect: followRedirects ? 'follow' : 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PodcastLearningBot/1.0)'
      }
    };

    let response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    result.status = response.status;
    result.statusText = response.statusText;
    result.reachable = response.ok; // 200-299 range
    result.redirected = response.redirected;
    result.finalUrl = response.url;

    // If HEAD fails, try GET (some servers don't support HEAD)
    if (response.status === 405 || response.status === 501) {
      const getController = new AbortController();
      const getTimeoutId = setTimeout(() => getController.abort(), timeout);

      response = await fetch(url, {
        method: 'GET',
        redirect: followRedirects ? 'follow' : 'manual',
        signal: getController.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PodcastLearningBot/1.0)'
        }
      });
      clearTimeout(getTimeoutId);

      result.status = response.status;
      result.statusText = response.statusText;
      result.reachable = response.ok;
      result.redirected = response.redirected;
      result.finalUrl = response.url;

      // Extract metadata from response if HTML
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const html = await response.text();
        const metadata = extractMetadata(html);
        result.title = metadata.title;
        result.description = metadata.description;
        result.metadata = metadata;
      }
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      result.error = 'Request timeout';
    } else if (error.code === 'ENOTFOUND') {
      result.error = 'Domain not found';
    } else if (error.code === 'ECONNREFUSED') {
      result.error = 'Connection refused';
    } else if (error.code === 'CERT_HAS_EXPIRED') {
      result.error = 'SSL certificate expired';
    } else {
      result.error = error.message;
    }
  }

  return result;
}

/**
 * Extracts metadata from HTML content
 * @param {string} html - HTML content
 * @returns {Object} - Extracted metadata
 */
function extractMetadata(html) {
  const metadata = {
    title: null,
    description: null,
    author: null,
    image: null,
    siteName: null
  };

  // Extract title (try multiple sources)
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  const twitterTitleMatch = html.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i);
  
  metadata.title = ogTitleMatch?.[1] || twitterTitleMatch?.[1] || titleMatch?.[1] || null;

  // Extract description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  const twitterDescMatch = html.match(/<meta\s+name=["']twitter:description["']\s+content=["']([^"']+)["']/i);
  
  metadata.description = ogDescMatch?.[1] || twitterDescMatch?.[1] || descMatch?.[1] || null;

  // Extract author
  const authorMatch = html.match(/<meta\s+name=["']author["']\s+content=["']([^"']+)["']/i);
  const ogAuthorMatch = html.match(/<meta\s+property=["']article:author["']\s+content=["']([^"']+)["']/i);
  
  metadata.author = authorMatch?.[1] || ogAuthorMatch?.[1] || null;

  // Extract image
  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  const twitterImageMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
  
  metadata.image = ogImageMatch?.[1] || twitterImageMatch?.[1] || null;

  // Extract site name
  const siteNameMatch = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
  
  metadata.siteName = siteNameMatch?.[1] || null;

  return metadata;
}

/**
 * Validates multiple URLs in parallel with rate limiting
 * @param {Array<string>} urls - URLs to validate
 * @param {Object} options - Validation options
 * @returns {Promise<Array>} - Validation results
 */
export async function validateUrls(urls, options = {}) {
  const {
    concurrency = 3,
    delayMs = 500,
    logProgress = true
  } = options;

  const results = [];
  const uniqueUrls = [...new Set(urls)]; // Remove duplicates

  if (logProgress) {
    console.log(chalk.blue(`\n🔗 Validating ${uniqueUrls.length} reference links...\n`));
  }

  // Process URLs in batches with rate limiting
  for (let i = 0; i < uniqueUrls.length; i += concurrency) {
    const batch = uniqueUrls.slice(i, i + concurrency);
    
    if (logProgress) {
      console.log(chalk.gray(`  Processing batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(uniqueUrls.length / concurrency)}...`));
    }

    const batchResults = await Promise.all(
      batch.map(url => validateUrl(url, options))
    );

    results.push(...batchResults);

    // Rate limiting delay between batches
    if (i + concurrency < uniqueUrls.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  if (logProgress) {
    displayValidationSummary(results);
  }

  return results;
}

/**
 * Displays validation summary
 * @param {Array} results - Validation results
 */
function displayValidationSummary(results) {
  const total = results.length;
  const valid = results.filter(r => r.valid).length;
  const reachable = results.filter(r => r.reachable).length;
  const broken = results.filter(r => r.valid && !r.reachable).length;
  const redirected = results.filter(r => r.redirected).length;

  console.log(chalk.cyan('\n📊 Validation Summary:\n'));
  console.log(chalk.white(`  Total links: ${total}`));
  console.log(chalk.green(`  ✓ Valid format: ${valid}`));
  console.log(chalk.green(`  ✓ Reachable: ${reachable}`));
  if (broken > 0) {
    console.log(chalk.yellow(`  ⚠️  Broken/Error: ${broken}`));
  }
  if (redirected > 0) {
    console.log(chalk.yellow(`  ↪  Redirected: ${redirected}`));
  }
  console.log('');
}

/**
 * Displays detailed validation results
 * @param {Array} results - Validation results
 */
export function displayValidationResults(results) {
  console.log(chalk.cyan.bold('\n🔗 Reference Link Validation Results:\n'));

  results.forEach((result, idx) => {
    const number = `${idx + 1}.`;
    
    if (result.reachable) {
      console.log(chalk.green(`${number} ✓ ${result.url}`));
      if (result.title) {
        console.log(chalk.gray(`   Title: ${result.title}`));
      }
      if (result.redirected) {
        console.log(chalk.yellow(`   ↪ Redirected to: ${result.finalUrl}`));
      }
    } else if (result.valid) {
      console.log(chalk.yellow(`${number} ⚠️  ${result.url}`));
      console.log(chalk.gray(`   Status: ${result.status} ${result.statusText || ''}`));
      if (result.error) {
        console.log(chalk.red(`   Error: ${result.error}`));
      }
    } else {
      console.log(chalk.red(`${number} ❌ ${result.url}`));
      console.log(chalk.red(`   Error: ${result.error}`));
    }
    console.log('');
  });
}

/**
 * Groups validation results by status
 * @param {Array} results - Validation results
 * @returns {Object} - Grouped results
 */
export function groupResultsByStatus(results) {
  return {
    reachable: results.filter(r => r.reachable),
    broken: results.filter(r => r.valid && !r.reachable),
    invalid: results.filter(r => !r.valid),
    redirected: results.filter(r => r.redirected)
  };
}

/**
 * Saves validation results to file
 * @param {Array} results - Validation results
 * @param {string} filename - Output filename
 * @returns {Promise<string>} - Output path
 */
export async function saveValidationResults(results, filename = 'reference-validation.json') {
  const outputDir = path.join(process.cwd(), '../../outputs/podcast-learning/references');
  await fs.mkdir(outputDir, { recursive: true });
  
  const outputPath = path.join(outputDir, filename);
  
  const output = {
    validatedAt: new Date().toISOString(),
    total: results.length,
    summary: {
      valid: results.filter(r => r.valid).length,
      reachable: results.filter(r => r.reachable).length,
      broken: results.filter(r => r.valid && !r.reachable).length,
      invalid: results.filter(r => !r.valid).length,
      redirected: results.filter(r => r.redirected).length
    },
    results
  };
  
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
  
  return outputPath;
}

/**
 * Logs validation errors for debugging
 * @param {Array} results - Validation results
 */
async function logValidationErrors(results) {
  const errors = results.filter(r => !r.reachable);
  
  if (errors.length === 0) return;
  
  const logDir = path.join(process.cwd(), '../../outputs/podcast-learning/logs');
  const logFile = path.join(logDir, 'reference-validation.log');
  
  await fs.mkdir(logDir, { recursive: true });
  
  const logEntry = `\n[VALIDATION ERRORS] ${new Date().toISOString()}\n` +
    errors.map(e => `${e.url}\n  Status: ${e.status || 'N/A'}\n  Error: ${e.error || 'Unreachable'}\n`).join('\n') +
    '\n';
  
  await fs.appendFile(logFile, logEntry);
}

export default {
  validateUrl,
  validateUrls,
  displayValidationResults,
  groupResultsByStatus,
  saveValidationResults
};

