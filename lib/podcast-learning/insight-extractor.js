/**
 * Insight Extractor for Podcast Learning Extraction
 * Uses Claude API to extract key insights from podcast transcripts
 */

import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

/**
 * Initialize Anthropic client
 * @param {string} apiKey - Anthropic API key
 * @returns {Anthropic} - Initialized client
 */
export function initializeClient(apiKey) {
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required. Set it in environment variables or .env file.');
  }

  return new Anthropic({
    apiKey: apiKey
  });
}

/**
 * Builds the system prompt for insight extraction
 * @returns {string} - System prompt
 */
function buildSystemPrompt() {
  return `You are an expert at extracting actionable insights from podcast transcripts about design systems, technology, and professional development.

Your task is to analyze podcast episode transcripts and extract the most valuable, actionable insights that listeners can apply to their work and practice.

Guidelines:
- Extract 5-10 key insights (aim for 7-8 for balance)
- Each insight should be concise but complete (1-3 sentences)
- Focus on actionable takeaways, not just facts
- Prioritize insights that are practical and applicable
- Include both tactical advice and strategic thinking
- Capture the "why" behind recommendations when relevant
- Avoid generic platitudes; be specific
- Order insights from most to least impactful

Format each insight as:
- A clear, standalone statement that makes sense without context
- Should answer "what can I do with this information?"
- Should be memorable and quotable`;
}

/**
 * Builds the user prompt for insight extraction
 * @param {Object} inputData - Episode input data
 * @returns {string} - User prompt
 */
function buildUserPrompt(inputData) {
  const { metadata, transcript, contexts } = inputData;
  
  const contextDescription = contexts
    .map(c => `- ${c.name}: ${c.focus.join(', ')}`)
    .join('\n');

  return `Please analyze this podcast episode transcript and extract 5-10 key actionable insights.

**Episode:** ${metadata.title}
**Guest:** ${metadata.guest}
${metadata.date ? `**Date:** ${metadata.date}\n` : ''}

**Application Contexts for Insights:**
${contextDescription}

The insights should be valuable for someone working in these contexts.

**Transcript:**
${transcript}

**Instructions:**
Extract 5-10 key insights that are:
1. Actionable and practical
2. Specific to the content discussed
3. Valuable across the application contexts
4. Clear and standalone (understandable without full context)

Return ONLY a JSON array of insights, no other text. Each insight should be a string.

Example format:
[
  "Design systems teams are particularly vulnerable to burnout because they constantly context-switch between teams while doing infrastructure work that's often invisible and undervalued.",
  "Living your values in practice means being explicit about what matters to you and making decisions that align with those values, even when it puts you in conflict with organizational pressures.",
  ...
]`;
}

/**
 * Extracts insights from transcript using Claude API
 * @param {Anthropic} client - Anthropic client
 * @param {Object} inputData - Episode input data
 * @param {Object} options - Extraction options
 * @returns {Promise<Object>} - Extraction result
 */
export async function extractInsights(client, inputData, options = {}) {
  const {
    model = 'claude-3-5-sonnet-20241022',
    maxTokens = 2000,
    temperature = 0.7,
    logToFile = true,
    testMode = false
  } = options;

  const startTime = Date.now();
  
  // Test mode: use pre-generated insights
  if (testMode) {
    console.log(chalk.yellow('⚠️  Running in TEST MODE (using pre-generated insights)\n'));
    return await extractInsightsTestMode(startTime);
  }
  
  console.log(chalk.blue('\n🧠 Extracting insights with Claude API...\n'));

  try {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(inputData);

    // Log request details
    const requestLog = {
      timestamp: new Date().toISOString(),
      model,
      episode: inputData.metadata.title,
      transcriptLength: inputData.transcript.length,
      promptTokensEstimate: Math.ceil((systemPrompt.length + userPrompt.length) / 4)
    };

    if (logToFile) {
      await logRequest(requestLog);
    }

    // Make API call
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const duration = Date.now() - startTime;

    // Extract insights from response
    const contentText = response.content[0].text;
    let insights;

    try {
      // Try to parse as JSON
      insights = JSON.parse(contentText);
      
      if (!Array.isArray(insights)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      // Fallback: try to extract JSON from markdown code blocks
      const jsonMatch = contentText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[1]);
      } else {
        // Last resort: try to parse the whole thing
        console.warn(chalk.yellow('⚠️  Response not in expected JSON format, attempting to extract...'));
        insights = parseInsightsFromText(contentText);
      }
    }

    // Validate insights
    if (!Array.isArray(insights) || insights.length === 0) {
      throw new Error('No insights extracted from response');
    }

    if (insights.length < 5) {
      console.warn(chalk.yellow(`⚠️  Only ${insights.length} insights extracted (target: 5-10)`));
    }

    if (insights.length > 10) {
      console.warn(chalk.yellow(`⚠️  ${insights.length} insights extracted (target: 5-10), trimming to 10`));
      insights = insights.slice(0, 10);
    }

    // Log response details
    const responseLog = {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      insightsCount: insights.length,
      stopReason: response.stop_reason
    };

    if (logToFile) {
      await logResponse(responseLog);
    }

    // Display success
    console.log(chalk.green(`✓ Extracted ${insights.length} insights in ${duration}ms`));
    console.log(chalk.gray(`  Input tokens: ${response.usage.input_tokens}`));
    console.log(chalk.gray(`  Output tokens: ${response.usage.output_tokens}`));
    console.log(chalk.gray(`  Total tokens: ${response.usage.input_tokens + response.usage.output_tokens}\n`));

    return {
      success: true,
      insights,
      metadata: {
        model: response.model,
        duration,
        usage: response.usage,
        insightsCount: insights.length
      },
      rawResponse: response
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(chalk.red(`\n❌ Error extracting insights: ${error.message}\n`));

    // Log error
    const errorLog = {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      error: error.message,
      stack: error.stack
    };

    if (logToFile) {
      await logError(errorLog);
    }

    return {
      success: false,
      error: error.message,
      insights: [],
      metadata: {
        duration
      }
    };
  }
}

/**
 * Fallback parser for non-JSON responses
 * @param {string} text - Response text
 * @returns {Array<string>} - Parsed insights
 */
function parseInsightsFromText(text) {
  const insights = [];
  
  // Try to find numbered or bulleted lists
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Match numbered lists: "1. " or "1) "
    const numberedMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (numberedMatch) {
      insights.push(numberedMatch[1]);
      continue;
    }
    
    // Match bulleted lists: "- " or "* "
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      insights.push(bulletMatch[1]);
      continue;
    }
    
    // If line is substantial, add it
    if (trimmed.length > 50 && !trimmed.startsWith('[') && !trimmed.startsWith('{')) {
      insights.push(trimmed);
    }
  }
  
  return insights;
}

/**
 * Logs API request details
 * @param {Object} requestLog - Request log data
 */
async function logRequest(requestLog) {
  const logDir = path.join(process.cwd(), '../../outputs/podcast-learning/logs');
  const logFile = path.join(logDir, 'insight-extraction.log');
  
  await fs.mkdir(logDir, { recursive: true });
  
  const logEntry = `\n[REQUEST] ${requestLog.timestamp}\n${JSON.stringify(requestLog, null, 2)}\n`;
  await fs.appendFile(logFile, logEntry);
}

/**
 * Logs API response details
 * @param {Object} responseLog - Response log data
 */
async function logResponse(responseLog) {
  const logDir = path.join(process.cwd(), '../../outputs/podcast-learning/logs');
  const logFile = path.join(logDir, 'insight-extraction.log');
  
  await fs.mkdir(logDir, { recursive: true });
  
  const logEntry = `[RESPONSE] ${responseLog.timestamp}\n${JSON.stringify(responseLog, null, 2)}\n`;
  await fs.appendFile(logFile, logEntry);
}

/**
 * Logs API errors
 * @param {Object} errorLog - Error log data
 */
async function logError(errorLog) {
  const logDir = path.join(process.cwd(), '../../outputs/podcast-learning/logs');
  const logFile = path.join(logDir, 'insight-extraction.log');
  
  await fs.mkdir(logDir, { recursive: true });
  
  const logEntry = `[ERROR] ${errorLog.timestamp}\n${JSON.stringify(errorLog, null, 2)}\n`;
  await fs.appendFile(logFile, logEntry);
}

/**
 * Test mode: Load pre-generated insights
 * @param {number} startTime - Start timestamp
 * @returns {Promise<Object>} - Extraction result
 */
async function extractInsightsTestMode(startTime) {
  const testInsightsPath = path.join(process.cwd(), 'test-insights.json');
  
  try {
    const testData = await fs.readFile(testInsightsPath, 'utf-8');
    const insights = JSON.parse(testData);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const duration = Date.now() - startTime;
    
    console.log(chalk.green(`✓ Loaded ${insights.length} test insights in ${duration}ms\n`));
    
    return {
      success: true,
      insights,
      metadata: {
        model: 'test-mode',
        duration,
        usage: {
          input_tokens: 0,
          output_tokens: 0
        },
        insightsCount: insights.length
      }
    };
  } catch (error) {
    throw new Error(`Failed to load test insights: ${error.message}`);
  }
}

/**
 * Displays extracted insights
 * @param {Array<string>} insights - Extracted insights
 */
export function displayInsights(insights) {
  console.log(chalk.cyan.bold('\n💡 Extracted Insights:\n'));
  
  insights.forEach((insight, idx) => {
    console.log(chalk.white(`${idx + 1}. ${insight}\n`));
  });
}

/**
 * Gets API key from environment
 * @returns {string} - API key
 */
export function getApiKey() {
  // Try multiple sources
  const apiKey = process.env.ANTHROPIC_API_KEY || 
                 process.env.CLAUDE_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY not found in environment. ' +
      'Please set it in your .env file or environment variables.'
    );
  }
  
  return apiKey;
}

export default {
  initializeClient,
  extractInsights,
  displayInsights,
  getApiKey
};

