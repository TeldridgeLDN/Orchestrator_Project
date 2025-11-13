/**
 * Action Item Generator for Podcast Learning Extraction
 * Generates context-specific actionable recommendations using Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

/**
 * Builds system prompt for action generation
 * @returns {string} - System prompt
 */
function buildSystemPrompt() {
  return `You are an expert at transforming podcast insights into actionable recommendations.

Your task is to analyze podcast insights and generate specific, practical action items tailored to different professional contexts.

Guidelines:
1. Each action item should be concrete and immediately actionable
2. Actions should directly relate to the insights provided
3. Prioritize actions that will have the most impact
4. Be specific about implementation (not just "learn more about X")
5. Consider the user's expertise level and goals for each context
6. Generate 2-4 actions per context (quality over quantity)

Format your response as valid JSON with this structure:
{
  "contexts": [
    {
      "name": "Context Name",
      "description": "Brief context description",
      "actions": [
        {
          "title": "Action title",
          "description": "Detailed action description",
          "relatedInsights": [0, 1], // Indexes of related insights
          "effort": "low|medium|high",
          "impact": "low|medium|high",
          "timeframe": "immediate|short-term|long-term"
        }
      ]
    }
  ]
}`;
}

/**
 * Builds user prompt for action generation
 * @param {Array} insights - Extracted insights
 * @param {Array} contexts - User contexts
 * @param {Object} episode - Episode metadata
 * @returns {string} - User prompt
 */
function buildUserPrompt(insights, contexts, episode) {
  let prompt = `Episode: "${episode.title}"\n`;
  if (episode.guest) {
    prompt += `Guest: ${episode.guest}\n`;
  }
  prompt += '\n';

  prompt += 'Key Insights:\n';
  insights.forEach((insight, index) => {
    prompt += `${index}. ${insight}\n`;
  });
  prompt += '\n';

  prompt += 'Generate actionable recommendations for these contexts:\n\n';
  
  contexts.forEach((context, index) => {
    prompt += `${index + 1}. ${context.name}:\n`;
    prompt += `   ${context.description}\n`;
    if (context.goals && context.goals.length > 0) {
      prompt += `   Goals: ${context.goals.join(', ')}\n`;
    }
    prompt += '\n';
  });

  prompt += 'Return ONLY the JSON structure specified in the system prompt. No additional text.';

  return prompt;
}

/**
 * Parses JSON response from Claude
 * @param {string} text - Response text
 * @returns {Object} - Parsed action data
 */
function parseActionResponse(text) {
  try {
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!parsed.contexts || !Array.isArray(parsed.contexts)) {
      throw new Error('Invalid response structure: missing contexts array');
    }

    // Validate each context
    parsed.contexts.forEach((context, index) => {
      if (!context.name || !context.actions) {
        throw new Error(`Context ${index} missing required fields`);
      }
      if (!Array.isArray(context.actions)) {
        throw new Error(`Context ${index} actions is not an array`);
      }
      
      // Validate actions
      context.actions.forEach((action, actionIndex) => {
        if (!action.title || !action.description) {
          throw new Error(`Context ${index}, action ${actionIndex} missing required fields`);
        }
      });
    });

    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse action response: ${error.message}`);
  }
}

/**
 * Generates action items using Claude API
 * @param {Anthropic} client - Anthropic client
 * @param {Array} insights - Extracted insights
 * @param {Array} contexts - User contexts
 * @param {Object} episode - Episode metadata
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} - Generated actions and metadata
 */
export async function generateActions(client, insights, contexts, episode, options = {}) {
  const {
    model = 'claude-3-5-sonnet-20241022',
    maxTokens = 2000,
    temperature = 0.7,
    logToFile = true,
    testMode = false
  } = options;

  const startTime = Date.now();

  // Test mode: use pre-generated actions
  if (testMode) {
    console.log(chalk.yellow('⚠️  Running in TEST MODE (using pre-generated actions)\n'));
    return await generateActionsTestMode(startTime);
  }

  console.log(chalk.blue('\n🎯 Generating context-specific action items...\n'));

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(insights, contexts, episode);

  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    });

    const duration = Date.now() - startTime;
    const responseText = response.content[0].text;

    // Log API call
    if (logToFile) {
      await logApiCall({
        timestamp: new Date().toISOString(),
        model,
        duration,
        usage: response.usage,
        systemPrompt,
        userPrompt,
        response: responseText
      });
    }

    // Parse response
    const actionData = parseActionResponse(responseText);

    console.log(chalk.green(`✓ Generated actions for ${actionData.contexts.length} contexts in ${duration}ms\n`));

    return {
      success: true,
      actions: actionData.contexts,
      metadata: {
        model,
        duration,
        usage: response.usage,
        totalActions: actionData.contexts.reduce((sum, ctx) => sum + ctx.actions.length, 0)
      }
    };
  } catch (error) {
    await logError(error);
    throw new Error(`Action generation failed: ${error.message}`);
  }
}

/**
 * Test mode: loads pre-generated actions
 * @param {number} startTime - Start timestamp
 * @returns {Promise<Object>} - Test actions
 */
async function generateActionsTestMode(startTime) {
  const testActionsPath = path.join(process.cwd(), 'test-actions.json');
  
  try {
    const testData = await fs.readFile(testActionsPath, 'utf-8');
    const actionData = JSON.parse(testData);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const duration = Date.now() - startTime;
    
    console.log(chalk.green(`✓ Loaded test actions for ${actionData.contexts.length} contexts in ${duration}ms\n`));
    
    return {
      success: true,
      actions: actionData.contexts,
      metadata: {
        model: 'test-mode',
        duration,
        usage: {
          input_tokens: 0,
          output_tokens: 0
        },
        totalActions: actionData.contexts.reduce((sum, ctx) => sum + ctx.actions.length, 0)
      }
    };
  } catch (error) {
    throw new Error(`Failed to load test actions: ${error.message}`);
  }
}

/**
 * Logs API call details
 * @param {Object} callData - API call data
 */
async function logApiCall(callData) {
  try {
    const logsDir = path.join(process.cwd(), '../../outputs/podcast-learning/logs');
    await fs.mkdir(logsDir, { recursive: true });

    const logFile = path.join(logsDir, 'action-generation.log');
    const logEntry = `\n${'='.repeat(80)}\n${JSON.stringify(callData, null, 2)}\n`;

    await fs.appendFile(logFile, logEntry);
  } catch (error) {
    console.error(chalk.red(`Failed to write log: ${error.message}`));
  }
}

/**
 * Logs errors
 * @param {Error} error - Error object
 */
async function logError(error) {
  try {
    const logsDir = path.join(process.cwd(), '../../outputs/podcast-learning/logs');
    await fs.mkdir(logsDir, { recursive: true });

    const errorLog = path.join(logsDir, 'action-generation-errors.log');
    const errorEntry = `\n[${new Date().toISOString()}] ${error.message}\n${error.stack}\n`;

    await fs.appendFile(errorLog, errorEntry);
  } catch (err) {
    console.error(chalk.red(`Failed to write error log: ${err.message}`));
  }
}

/**
 * Displays generated actions
 * @param {Array} actions - Generated actions grouped by context
 */
export function displayActions(actions) {
  console.log(chalk.cyan.bold('\n🎯 Generated Action Items:\n'));

  actions.forEach((context, contextIndex) => {
    console.log(chalk.yellow(`\n${contextIndex + 1}. ${context.name}`));
    if (context.description) {
      console.log(chalk.gray(`   ${context.description}`));
    }
    console.log('');

    context.actions.forEach((action, actionIndex) => {
      const effortIcon = { low: '🟢', medium: '🟡', high: '🔴' }[action.effort] || '⚪';
      const impactIcon = { low: '📊', medium: '📈', high: '🚀' }[action.impact] || '📊';
      
      console.log(chalk.white(`   ${actionIndex + 1}. ${action.title}`));
      console.log(chalk.gray(`      ${action.description}`));
      console.log(chalk.gray(`      ${effortIcon} Effort: ${action.effort} | ${impactIcon} Impact: ${action.impact} | ⏱️  ${action.timeframe}`));
      
      if (action.relatedInsights && action.relatedInsights.length > 0) {
        console.log(chalk.gray(`      📝 Related insights: ${action.relatedInsights.join(', ')}`));
      }
      console.log('');
    });
  });
}

/**
 * Validates that all contexts have actions
 * @param {Array} actions - Generated actions
 * @param {Array} contexts - Original contexts
 * @returns {Object} - Validation result
 */
export function validateActions(actions, contexts) {
  const errors = [];
  const warnings = [];

  // Check if all contexts are covered
  const actionContextNames = actions.map(a => a.name.toLowerCase());
  const requiredContextNames = contexts.map(c => c.name.toLowerCase());

  requiredContextNames.forEach(contextName => {
    if (!actionContextNames.includes(contextName)) {
      errors.push(`Missing actions for context: ${contextName}`);
    }
  });

  // Check if each context has at least one action
  actions.forEach(context => {
    if (!context.actions || context.actions.length === 0) {
      errors.push(`Context "${context.name}" has no actions`);
    }
  });

  // Check for quality issues
  actions.forEach(context => {
    context.actions.forEach(action => {
      if (action.description.length < 20) {
        warnings.push(`Action "${action.title}" in "${context.name}" has very short description`);
      }
      if (!action.effort || !action.impact || !action.timeframe) {
        warnings.push(`Action "${action.title}" in "${context.name}" missing metadata`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Gets action statistics
 * @param {Array} actions - Generated actions
 * @returns {Object} - Action statistics
 */
export function getActionStats(actions) {
  const stats = {
    totalContexts: actions.length,
    totalActions: 0,
    byEffort: { low: 0, medium: 0, high: 0 },
    byImpact: { low: 0, medium: 0, high: 0 },
    byTimeframe: { immediate: 0, 'short-term': 0, 'long-term': 0 }
  };

  actions.forEach(context => {
    stats.totalActions += context.actions.length;
    
    context.actions.forEach(action => {
      if (action.effort) stats.byEffort[action.effort]++;
      if (action.impact) stats.byImpact[action.impact]++;
      if (action.timeframe) stats.byTimeframe[action.timeframe]++;
    });
  });

  return stats;
}

export default {
  generateActions,
  displayActions,
  validateActions,
  getActionStats
};

