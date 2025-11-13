/**
 * Input Handler for Podcast Learning Extraction
 * Handles manual input of podcast transcripts and show notes with validation
 */

import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import validator from 'validator';
import chalk from 'chalk';

/**
 * Validates markdown content
 * @param {string} content - Markdown content to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateMarkdown(content) {
  const errors = [];

  if (!content || typeof content !== 'string') {
    errors.push('Content must be a non-empty string');
    return { valid: false, errors };
  }

  if (content.trim().length === 0) {
    errors.push('Content cannot be empty or only whitespace');
    return { valid: false, errors };
  }

  // Try to parse the markdown
  try {
    marked.parse(content);
  } catch (error) {
    errors.push(`Markdown parsing error: ${error.message}`);
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}

/**
 * Validates episode metadata
 * @param {Object} metadata - Episode metadata object
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateMetadata(metadata) {
  const errors = [];
  const required = ['title', 'guest', 'episodeNumber'];

  // Check required fields
  for (const field of required) {
    if (!metadata[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate title
  if (metadata.title && metadata.title.trim().length < 5) {
    errors.push('Title must be at least 5 characters long');
  }

  // Validate guest name
  if (metadata.guest && metadata.guest.trim().length < 2) {
    errors.push('Guest name must be at least 2 characters long');
  }

  // Validate episode number
  if (metadata.episodeNumber) {
    const epNum = parseInt(metadata.episodeNumber, 10);
    if (isNaN(epNum) || epNum < 1) {
      errors.push('Episode number must be a positive integer');
    }
  }

  // Validate date if provided
  if (metadata.date && !validator.isISO8601(metadata.date)) {
    errors.push('Date must be in ISO 8601 format (YYYY-MM-DD)');
  }

  // Validate duration if provided
  if (metadata.duration) {
    const durationPattern = /^\d+:\d{2}(:\d{2})?$/;
    if (!durationPattern.test(metadata.duration)) {
      errors.push('Duration must be in format MM:SS or HH:MM:SS');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates show notes and extracts links
 * @param {string} showNotes - Show notes in markdown format
 * @returns {Object} - { valid: boolean, errors: string[], links: string[] }
 */
export function validateShowNotes(showNotes) {
  const errors = [];
  const links = [];

  // First validate as markdown
  const markdownValidation = validateMarkdown(showNotes);
  if (!markdownValidation.valid) {
    return { valid: false, errors: markdownValidation.errors, links: [] };
  }

  // Extract links using regex
  const markdownLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  
  let match;
  
  // Extract markdown-style links
  while ((match = markdownLinkPattern.exec(showNotes)) !== null) {
    const url = match[2];
    if (validator.isURL(url, { require_protocol: true })) {
      links.push(url);
    } else {
      errors.push(`Invalid URL format: ${url}`);
    }
  }

  // Extract plain URLs
  const plainUrls = showNotes.match(urlPattern) || [];
  for (const url of plainUrls) {
    // Avoid duplicates from markdown links
    if (!links.includes(url) && validator.isURL(url, { require_protocol: true })) {
      links.push(url);
    }
  }

  // Warn if no links found
  if (links.length === 0) {
    console.warn(chalk.yellow('⚠️  Warning: No reference links found in show notes'));
  }

  return { valid: errors.length === 0, errors, links };
}

/**
 * Reads content from a file path
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} - File content
 */
export async function readFromFile(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }
}

/**
 * Validates complete input data
 * @param {Object} inputData - Complete input object
 * @returns {Object} - { valid: boolean, errors: string[], data: Object }
 */
export function validateInput(inputData) {
  const allErrors = [];
  
  // Validate metadata
  const metadataValidation = validateMetadata(inputData.metadata);
  if (!metadataValidation.valid) {
    allErrors.push(...metadataValidation.errors.map(e => `Metadata: ${e}`));
  }

  // Validate transcript
  const transcriptValidation = validateMarkdown(inputData.transcript);
  if (!transcriptValidation.valid) {
    allErrors.push(...transcriptValidation.errors.map(e => `Transcript: ${e}`));
  }

  // Check transcript length
  if (inputData.transcript && inputData.transcript.trim().length < 100) {
    allErrors.push('Transcript: Content seems too short (minimum 100 characters)');
  }

  // Validate show notes
  const showNotesValidation = validateShowNotes(inputData.showNotes);
  if (!showNotesValidation.valid) {
    allErrors.push(...showNotesValidation.errors.map(e => `Show Notes: ${e}`));
  }

  // Validate application contexts if provided
  if (inputData.contexts) {
    if (!Array.isArray(inputData.contexts) || inputData.contexts.length === 0) {
      allErrors.push('Contexts: Must be a non-empty array');
    } else {
      for (const ctx of inputData.contexts) {
        if (!ctx.name || !ctx.focus) {
          allErrors.push(`Contexts: Each context must have 'name' and 'focus' properties`);
        }
      }
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    data: {
      ...inputData,
      extractedLinks: showNotesValidation.links
    }
  };
}

/**
 * Formats validation errors for display
 * @param {string[]} errors - Array of error messages
 * @returns {string} - Formatted error message
 */
export function formatErrors(errors) {
  if (errors.length === 0) return '';
  
  return chalk.red.bold('\n❌ Validation Errors:\n') + 
    errors.map((err, idx) => chalk.red(`  ${idx + 1}. ${err}`)).join('\n');
}

/**
 * Creates a default contexts array
 * @returns {Array} - Default application contexts
 */
export function getDefaultContexts() {
  return [
    {
      name: 'Personal Practice',
      focus: ['frameworks', 'self-care', 'skill-building']
    },
    {
      name: 'Regular Work',
      focus: ['team-practices', 'advocacy', 'implementation']
    },
    {
      name: 'Landing Page Business',
      focus: ['client-deliverables', 'reusable-patterns', 'efficiency']
    }
  ];
}

/**
 * Displays input summary
 * @param {Object} data - Validated input data
 */
export function displayInputSummary(data) {
  console.log(chalk.green.bold('\n✅ Input Validation Successful\n'));
  console.log(chalk.cyan('Episode Metadata:'));
  console.log(`  Title: ${chalk.white(data.metadata.title)}`);
  console.log(`  Guest: ${chalk.white(data.metadata.guest)}`);
  console.log(`  Episode: ${chalk.white(data.metadata.episodeNumber)}`);
  if (data.metadata.date) {
    console.log(`  Date: ${chalk.white(data.metadata.date)}`);
  }
  if (data.metadata.duration) {
    console.log(`  Duration: ${chalk.white(data.metadata.duration)}`);
  }
  
  console.log(chalk.cyan('\nContent Statistics:'));
  console.log(`  Transcript length: ${chalk.white(data.transcript.length)} characters`);
  console.log(`  Show notes length: ${chalk.white(data.showNotes.length)} characters`);
  console.log(`  Reference links found: ${chalk.white(data.extractedLinks.length)}`);
  
  console.log(chalk.cyan('\nApplication Contexts:'));
  data.contexts.forEach(ctx => {
    console.log(`  • ${chalk.white(ctx.name)}: ${ctx.focus.join(', ')}`);
  });
  
  console.log('');
}

export default {
  validateMarkdown,
  validateMetadata,
  validateShowNotes,
  validateInput,
  readFromFile,
  formatErrors,
  getDefaultContexts,
  displayInputSummary
};

