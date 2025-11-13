/**
 * Markdown Report Generator for Podcast Learning Extraction
 * Generates structured markdown reports following PRD template
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

/**
 * Generates markdown content from processed episode data
 * @param {Object} data - Processed episode data
 * @returns {string} - Markdown content
 */
export function generateMarkdown(data) {
  const { episode, insights, references, actions, metadata } = data;
  
  let markdown = '';

  // Header
  markdown += generateHeader(episode);
  
  // Key Insights
  markdown += generateInsights(insights);
  
  // Referenced Resources (grouped by category)
  markdown += generateReferences(references);
  
  // Action Items by Context
  markdown += generateActions(actions);
  
  // Metadata footer
  markdown += generateFooter(metadata);

  return markdown;
}

/**
 * Generates episode header section
 * @param {Object} episode - Episode metadata
 * @returns {string} - Markdown header
 */
function generateHeader(episode) {
  let header = `# Episode ${episode.episodeNumber}: ${episode.title}`;
  
  if (episode.guest) {
    header += ` with ${episode.guest}`;
  }
  
  header += '\n\n';
  
  if (episode.date) {
    header += `**Date:** ${episode.date}\n`;
  }
  
  if (episode.duration) {
    header += `**Duration:** ${episode.duration}\n`;
  }
  
  header += '\n---\n\n';
  
  return header;
}

/**
 * Generates key insights section
 * @param {Array} insights - Array of insight strings
 * @returns {string} - Markdown insights section
 */
function generateInsights(insights) {
  if (!insights || insights.length === 0) {
    return '';
  }

  let section = '## Key Insights\n\n';
  
  insights.forEach((insight, index) => {
    section += `${index + 1}. ${insight}\n\n`;
  });
  
  section += '---\n\n';
  
  return section;
}

/**
 * Generates referenced resources section grouped by category
 * @param {Array} references - Array of reference objects with categories
 * @returns {string} - Markdown references section
 */
function generateReferences(references) {
  if (!references || references.length === 0) {
    return '';
  }

  // Group by category
  const grouped = {};
  references.forEach(ref => {
    const category = ref.category || 'unknown';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(ref);
  });

  let section = '## Referenced Resources\n\n';

  // Category order and labels
  const categoryConfig = {
    book: { label: 'Books', icon: '📚' },
    course: { label: 'Courses', icon: '🎓' },
    blog: { label: 'Blogs/Articles', icon: '📝' },
    article: { label: 'Articles', icon: '📄' },
    video: { label: 'Videos', icon: '📹' },
    podcast: { label: 'Podcasts', icon: '🎙️' },
    tool: { label: 'Tools/Services', icon: '🔧' },
    service: { label: 'Services', icon: '💼' },
    social: { label: 'Social Profiles', icon: '👤' },
    unknown: { label: 'Other Resources', icon: '🔗' }
  };

  // Generate sections for each category that has references
  Object.entries(categoryConfig).forEach(([category, config]) => {
    if (grouped[category] && grouped[category].length > 0) {
      section += `### ${config.icon} ${config.label}\n\n`;
      
      grouped[category].forEach(ref => {
        const status = ref.reachable ? '✅' : '⚠️';
        const title = ref.title || ref.url;
        section += `- ${status} [${title}](${ref.url})`;
        
        if (ref.description) {
          section += ` - ${ref.description}`;
        }
        
        section += '\n';
      });
      
      section += '\n';
    }
  });

  section += '---\n\n';
  
  return section;
}

/**
 * Generates action items section grouped by context
 * @param {Array} actions - Array of action objects grouped by context
 * @returns {string} - Markdown actions section
 */
function generateActions(actions) {
  if (!actions || actions.length === 0) {
    return '';
  }

  let section = '## Action Items by Context\n\n';

  actions.forEach(context => {
    section += `### ${context.name}\n\n`;
    
    if (context.description) {
      section += `*${context.description}*\n\n`;
    }

    if (context.actions && context.actions.length > 0) {
      context.actions.forEach(action => {
        // Format: - [ ] Title (effort: X, impact: Y, timeframe: Z)
        const metadata = [];
        if (action.effort) metadata.push(`effort: ${action.effort}`);
        if (action.impact) metadata.push(`impact: ${action.impact}`);
        if (action.timeframe) metadata.push(`${action.timeframe}`);
        
        const metaString = metadata.length > 0 ? ` *(${metadata.join(', ')})*` : '';
        
        section += `- [ ] **${action.title}**${metaString}\n`;
        
        if (action.description) {
          section += `  \n  ${action.description}\n`;
        }
        
        if (action.relatedInsights && action.relatedInsights.length > 0) {
          section += `  \n  *Related insights: ${action.relatedInsights.map(i => `#${i + 1}`).join(', ')}*\n`;
        }
        
        section += '\n';
      });
    }
    
    section += '\n';
  });

  section += '---\n\n';
  
  return section;
}

/**
 * Generates metadata footer
 * @param {Object} metadata - Processing metadata
 * @returns {string} - Markdown footer
 */
function generateFooter(metadata) {
  let footer = '## Processing Metadata\n\n';
  
  footer += `- **Processed:** ${metadata.processedAt}\n`;
  footer += `- **Model:** ${metadata.model}\n`;
  footer += `- **Processing Time:** ${metadata.duration}ms\n`;
  
  if (metadata.usage) {
    const totalTokens = metadata.usage.input_tokens + metadata.usage.output_tokens;
    footer += `- **Tokens Used:** ${totalTokens} (${metadata.usage.input_tokens} input, ${metadata.usage.output_tokens} output)\n`;
  }
  
  footer += '\n';
  
  return footer;
}

/**
 * Saves markdown content to file
 * @param {string} markdown - Markdown content
 * @param {Object} episode - Episode metadata
 * @param {string} outputDir - Output directory path
 * @returns {Promise<string>} - Path to saved file
 */
export async function saveMarkdown(markdown, episode, outputDir) {
  // Create filename from episode metadata
  const filename = createFilename(episode);
  const outputPath = path.join(outputDir, 'episodes', filename);
  
  // Ensure directory exists
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  
  // Write markdown file
  await fs.writeFile(outputPath, markdown, 'utf-8');
  
  return outputPath;
}

/**
 * Creates filename from episode metadata
 * @param {Object} episode - Episode metadata
 * @returns {string} - Filename
 */
function createFilename(episode) {
  const episodeNum = String(episode.episodeNumber).padStart(2, '0');
  
  // Create slug from guest name or title
  let slug = '';
  if (episode.guest) {
    slug = episode.guest
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  } else if (episode.title) {
    slug = episode.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50); // Limit length
  }
  
  return `episode-${episodeNum}${slug ? '-' + slug : ''}.md`;
}

/**
 * Generates and saves markdown report
 * @param {Object} data - Processed episode data
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} - Result with file path and stats
 */
export async function generateReport(data, options = {}) {
  const {
    outputDir = path.join(process.cwd(), '../../outputs/podcast-learning'),
    saveToFile = true,
    verbose = true
  } = options;

  if (verbose) {
    console.log(chalk.blue('\n📝 Generating markdown report...\n'));
  }

  // Generate markdown content
  const markdown = generateMarkdown(data);
  
  // Calculate statistics
  const stats = {
    lines: markdown.split('\n').length,
    characters: markdown.length,
    sections: (markdown.match(/^##/gm) || []).length,
    insights: data.insights?.length || 0,
    references: data.references?.length || 0,
    actions: data.actions?.reduce((sum, ctx) => sum + (ctx.actions?.length || 0), 0) || 0
  };

  if (verbose) {
    console.log(chalk.cyan('Report Statistics:'));
    console.log(chalk.white(`  • Lines: ${stats.lines}`));
    console.log(chalk.white(`  • Sections: ${stats.sections}`));
    console.log(chalk.white(`  • Insights: ${stats.insights}`));
    console.log(chalk.white(`  • References: ${stats.references}`));
    console.log(chalk.white(`  • Actions: ${stats.actions}`));
    console.log('');
  }

  let filePath = null;
  
  if (saveToFile) {
    filePath = await saveMarkdown(markdown, data.episode, outputDir);
    
    if (verbose) {
      console.log(chalk.green(`✓ Markdown report saved to: ${filePath}\n`));
    }
  }

  return {
    success: true,
    markdown,
    filePath,
    stats
  };
}

/**
 * Validates markdown structure
 * @param {string} markdown - Markdown content
 * @returns {Object} - Validation result
 */
export function validateMarkdown(markdown) {
  const errors = [];
  const warnings = [];

  // Check for required sections
  const requiredSections = [
    '# Episode',
    '## Key Insights',
    '## Referenced Resources',
    '## Action Items by Context'
  ];

  requiredSections.forEach(section => {
    if (!markdown.includes(section)) {
      errors.push(`Missing required section: ${section}`);
    }
  });

  // Check for empty sections
  if (markdown.includes('## Key Insights\n\n---')) {
    warnings.push('Key Insights section is empty');
  }

  if (markdown.includes('## Referenced Resources\n\n---')) {
    warnings.push('Referenced Resources section is empty');
  }

  if (markdown.includes('## Action Items by Context\n\n---')) {
    warnings.push('Action Items section is empty');
  }

  // Check for proper formatting
  if (!markdown.includes('---')) {
    warnings.push('Missing section dividers');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export default {
  generateMarkdown,
  generateReport,
  saveMarkdown,
  validateMarkdown
};

