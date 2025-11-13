/**
 * Reference Categorizer for Podcast Learning Extraction
 * Categorizes reference links by type using rule-based and AI-assisted methods
 */

import chalk from 'chalk';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Reference categories
 */
export const CATEGORIES = {
  BOOK: 'book',
  BLOG: 'blog',
  ARTICLE: 'article',
  COURSE: 'course',
  VIDEO: 'video',
  PODCAST: 'podcast',
  TOOL: 'tool',
  SERVICE: 'service',
  SOCIAL: 'social',
  UNKNOWN: 'unknown'
};

/**
 * URL patterns for rule-based categorization
 */
const URL_PATTERNS = {
  book: [
    /amazon\.com.*\/dp\//i,
    /amazon\.com.*\/gp\/product/i,
    /bookshop\.org/i,
    /abookapart\.com\/products/i,
    /oreilly\.com\/library\/view/i,
    /manning\.com\/books/i,
    /packtpub\.com\/product/i,
    /nostarch\.com\/catalog/i,
    /pragprog\.com\/titles/i,
    /rosenfeldmedia\.com\/books/i
  ],
  course: [
    /udemy\.com\/course/i,
    /coursera\.org\/learn/i,
    /edx\.org\/course/i,
    /pluralsight\.com\/courses/i,
    /linkedin\.com\/learning/i,
    /egghead\.io/i,
    /frontendmasters\.com\/courses/i,
    /designtokenscourse\.com/i,
    /atomicdesigncourse\.com/i
  ],
  video: [
    /youtube\.com\/watch/i,
    /youtu\.be\//i,
    /vimeo\.com/i,
    /wistia\.com/i
  ],
  podcast: [
    /podcasts\.apple\.com/i,
    /spotify\.com\/episode/i,
    /spotify\.com\/show/i,
    /overcast\.fm/i,
    /pocketcasts\.com/i
  ],
  social: [
    /linkedin\.com\/in\//i,
    /twitter\.com/i,
    /x\.com/i,
    /github\.com\/[^\/]+$/i, // User profile, not repo
    /mastodon\./i,
    /bsky\.app\/profile/i
  ],
  blog: [
    /medium\.com/i,
    /dev\.to/i,
    /substack\.com/i,
    /hashnode\./i,
    /wordpress\.com/i,
    /blogspot\.com/i,
    /ghost\.io/i
  ]
};

/**
 * Domain-based categorization rules
 */
const DOMAIN_CATEGORIES = {
  'github.com': 'tool',
  'gitlab.com': 'tool',
  'figma.com': 'tool',
  'sketch.com': 'tool',
  'notion.so': 'tool',
  'airtable.com': 'tool',
  'miro.com': 'tool',
  'canva.com': 'tool'
};

/**
 * Title/description keyword patterns
 */
const KEYWORD_PATTERNS = {
  book: ['book', 'author', 'isbn', 'paperback', 'hardcover', 'kindle'],
  course: ['course', 'learn', 'tutorial', 'certification', 'training', 'lessons'],
  blog: ['blog', 'post', 'article', 'writing'],
  tool: ['tool', 'app', 'software', 'platform', 'service'],
  video: ['video', 'watch', 'episode'],
  podcast: ['podcast', 'episode', 'listen']
};

/**
 * Categorizes a single reference using rule-based methods
 * @param {Object} reference - Reference object with URL and metadata
 * @returns {string} - Category or 'unknown'
 */
export function categorizeByRules(reference) {
  const { url, title, description, metadata } = reference;
  
  // Check URL patterns
  for (const [category, patterns] of Object.entries(URL_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(url))) {
      return category;
    }
  }

  // Check domain rules
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, '');
    
    if (DOMAIN_CATEGORIES[domain]) {
      return DOMAIN_CATEGORIES[domain];
    }
  } catch (error) {
    // Invalid URL, skip domain check
  }

  // Check title and description keywords
  const searchText = [title, description, metadata?.siteName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (searchText) {
    for (const [category, keywords] of Object.entries(KEYWORD_PATTERNS)) {
      if (keywords.some(keyword => searchText.includes(keyword))) {
        return category;
      }
    }
  }

  return CATEGORIES.UNKNOWN;
}

/**
 * Uses Claude API to categorize ambiguous references
 * @param {Anthropic} client - Anthropic client
 * @param {Object} reference - Reference object
 * @returns {Promise<string>} - Category
 */
export async function categorizeWithAI(client, reference) {
  const { url, title, description } = reference;

  const prompt = `Categorize this reference link into one of these types:
- book: Published books (physical or ebook)
- course: Online courses, tutorials, training programs
- blog: Blog posts, articles, written content
- video: Video content (YouTube, Vimeo, etc.)
- podcast: Podcast episodes or shows
- tool: Software tools, applications, platforms
- service: Professional services, consulting
- social: Social media profiles
- unknown: If unclear

Reference:
URL: ${url}
${title ? `Title: ${title}` : ''}
${description ? `Description: ${description}` : ''}

Respond with ONLY the category name (one word, lowercase).`;

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 50,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const category = response.content[0].text.trim().toLowerCase();
    
    // Validate response
    if (Object.values(CATEGORIES).includes(category)) {
      return category;
    }
    
    return CATEGORIES.UNKNOWN;
  } catch (error) {
    console.error(chalk.red(`  ⚠️  AI categorization failed for ${url}: ${error.message}`));
    return CATEGORIES.UNKNOWN;
  }
}

/**
 * Categorizes multiple references
 * @param {Array} references - Array of reference objects
 * @param {Object} options - Categorization options
 * @returns {Promise<Array>} - Categorized references
 */
export async function categorizeReferences(references, options = {}) {
  const {
    useAI = false,
    aiClient = null,
    logProgress = true
  } = options;

  if (logProgress) {
    console.log(chalk.blue(`\n🏷️  Categorizing ${references.length} references...\n`));
  }

  const categorized = [];
  let unknownCount = 0;
  let aiCategorized = 0;

  for (const reference of references) {
    // Apply rule-based categorization
    let category = categorizeByRules(reference);

    // Use AI for unknown categories if enabled
    if (category === CATEGORIES.UNKNOWN && useAI && aiClient) {
      if (logProgress) {
        console.log(chalk.gray(`  Using AI for: ${reference.url}`));
      }
      category = await categorizeWithAI(aiClient, reference);
      aiCategorized++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (category === CATEGORIES.UNKNOWN) {
      unknownCount++;
    }

    categorized.push({
      ...reference,
      category
    });
  }

  if (logProgress) {
    displayCategorizationSummary(categorized, aiCategorized);
  }

  return categorized;
}

/**
 * Displays categorization summary
 * @param {Array} categorized - Categorized references
 * @param {number} aiCategorized - Count of AI categorizations
 */
function displayCategorizationSummary(categorized, aiCategorized) {
  const summary = {};
  
  for (const ref of categorized) {
    summary[ref.category] = (summary[ref.category] || 0) + 1;
  }

  console.log(chalk.cyan('\n📊 Categorization Summary:\n'));
  
  const categoryLabels = {
    book: '📚 Books',
    course: '🎓 Courses',
    blog: '📝 Blogs',
    article: '📄 Articles',
    video: '📹 Videos',
    podcast: '🎙️  Podcasts',
    tool: '🔧 Tools',
    service: '💼 Services',
    social: '👤 Social',
    unknown: '❓ Unknown'
  };

  for (const [category, count] of Object.entries(summary).sort((a, b) => b[1] - a[1])) {
    const label = categoryLabels[category] || category;
    console.log(chalk.white(`  ${label}: ${count}`));
  }

  if (aiCategorized > 0) {
    console.log(chalk.gray(`\n  (${aiCategorized} categorized with AI assistance)`));
  }

  console.log('');
}

/**
 * Displays categorized references grouped by type
 * @param {Array} categorized - Categorized references
 */
export function displayCategorizedReferences(categorized) {
  console.log(chalk.cyan.bold('\n🏷️  Categorized References:\n'));

  const grouped = {};
  for (const ref of categorized) {
    if (!grouped[ref.category]) {
      grouped[ref.category] = [];
    }
    grouped[ref.category].push(ref);
  }

  const categoryLabels = {
    book: '📚 Books',
    course: '🎓 Courses',
    blog: '📝 Blogs/Articles',
    article: '📄 Articles',
    video: '📹 Videos',
    podcast: '🎙️  Podcasts',
    tool: '🔧 Tools',
    service: '💼 Services',
    social: '👤 Social Profiles',
    unknown: '❓ Uncategorized'
  };

  for (const [category, refs] of Object.entries(grouped).sort()) {
    const label = categoryLabels[category] || category;
    console.log(chalk.yellow(`\n${label}:`));
    
    refs.forEach(ref => {
      const status = ref.reachable ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${status} ${ref.url}`);
      if (ref.title) {
        console.log(chalk.gray(`     ${ref.title}`));
      }
    });
  }

  console.log('');
}

/**
 * Groups categorized references by type
 * @param {Array} categorized - Categorized references
 * @returns {Object} - Grouped references
 */
export function groupByCategory(categorized) {
  const grouped = {};
  
  for (const ref of categorized) {
    if (!grouped[ref.category]) {
      grouped[ref.category] = [];
    }
    grouped[ref.category].push(ref);
  }

  return grouped;
}

/**
 * Gets category statistics
 * @param {Array} categorized - Categorized references
 * @returns {Object} - Category statistics
 */
export function getCategoryStats(categorized) {
  const stats = {
    total: categorized.length,
    byCategory: {},
    reachableByCategory: {},
    unknownCount: 0
  };

  for (const ref of categorized) {
    stats.byCategory[ref.category] = (stats.byCategory[ref.category] || 0) + 1;
    
    if (ref.reachable) {
      stats.reachableByCategory[ref.category] = (stats.reachableByCategory[ref.category] || 0) + 1;
    }
    
    if (ref.category === CATEGORIES.UNKNOWN) {
      stats.unknownCount++;
    }
  }

  return stats;
}

export default {
  CATEGORIES,
  categorizeByRules,
  categorizeWithAI,
  categorizeReferences,
  displayCategorizedReferences,
  groupByCategory,
  getCategoryStats
};

