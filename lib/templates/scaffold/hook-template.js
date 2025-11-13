/**
 * Hook Template Generator
 * 
 * Generates hook scripts from scenario data
 */

import { helpers } from '../../utils/template-engine.js';

/**
 * Generate hook script for a scenario
 * 
 * @param {Object} context - Template context
 * @param {Object} context.scenario - Scenario data
 * @param {string} context.hookName - Name of the hook
 * @param {string} context.hookType - Type of hook (UserPromptSubmit, PostToolUse, etc.)
 * @returns {string} Generated hook script
 */
export function generateHookScript(context) {
  const { scenario, hookName, hookType = 'UserPromptSubmit' } = context;
  const { name, description, trigger } = scenario;
  
  const keywords = trigger.keywords || [];
  const command = trigger.command || '';
  
  return `#!/usr/bin/env node

/**
 * ${hookType} Hook: ${hookName}
 * 
 * Auto-generated from scenario: ${name}
 * ${description}
 * 
 * This hook detects when the scenario should be triggered and
 * provides contextual guidance to Claude.
 */

const userPrompt = process.env.USER_PROMPT || '';
const userPromptLower = userPrompt.toLowerCase();

// Detection patterns
const keywords = ${JSON.stringify(keywords, null, 2)};
const command = '${command}';

// Check for keyword matches
const keywordMatch = keywords.some(keyword => 
  userPromptLower.includes(keyword.toLowerCase())
);

// Check for command match
const commandMatch = userPrompt.trim().startsWith(command);

// Trigger detection
if (keywordMatch || commandMatch) {
  console.log(\`
💡 Scenario Detected: ${name}

${description}

This scenario involves:
${scenario.steps.map((step, i) => `${i + 1}. ${step.action}`).join('\n')}

${command ? `You can trigger this workflow with: \`${command}\`` : ''}

Would you like me to help you execute this scenario?
\`);
}

process.exit(0);
`;
}

/**
 * Generate hook metadata file
 * 
 * @param {Object} context - Template context
 * @returns {string} Generated metadata.json content
 */
export function generateHookMetadata(context) {
  const { scenario, hookName, hookType } = context;
  
  const metadata = {
    name: hookName,
    type: hookType || 'UserPromptSubmit',
    scenario: scenario.name,
    description: scenario.description,
    generatedAt: helpers.timestamp(),
    triggers: {
      keywords: scenario.trigger.keywords || [],
      command: scenario.trigger.command
    }
  };
  
  return JSON.stringify(metadata, null, 2);
}

export default {
  generateHookScript,
  generateHookMetadata
};

