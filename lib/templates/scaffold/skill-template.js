/**
 * Skill Template Generator
 * 
 * Generates skill definitions from scenario data
 */

import { helpers } from '../../utils/template-engine.js';

/**
 * Generate SKILL.md content for a scenario
 * 
 * @param {Object} context - Template context
 * @param {Object} context.scenario - Scenario data
 * @param {string} context.skillName - Name of the skill
 * @returns {string} Generated SKILL.md content
 */
export function generateSkillMd(context) {
  const { scenario, skillName } = context;
  const { name, description, steps, category } = scenario;
  
  return `# Skill: ${helpers.pascalCase(skillName)}

**Purpose:** ${description}

**Category:** ${category}

**Auto-generated from scenario:** \`${name}\`

---

## Overview

This skill was automatically generated from the \`${name}\` scenario definition.
It orchestrates the following workflow:

${steps.map((step, index) => `${index + 1}. **${step.action}** (${step.type})`).join('\n')}

## Workflow Steps

${steps.map(step => `
### Step: ${step.id}

**Action:** ${step.action}  
**Type:** ${step.type}  
${step.mcp ? `**MCP:** ${step.mcp}  ` : ''}
${step.dependencies ? `**Dependencies:** ${step.dependencies.join(', ')}  ` : ''}
${step.inputs ? `**Inputs:** ${step.inputs.join(', ')}  ` : ''}
${step.outputs ? `**Outputs:** ${step.outputs.join(', ')}  ` : ''}
`).join('\n')}

## Usage

This skill is activated via:
${scenario.trigger.command ? `- Slash command: \`${scenario.trigger.command}\`` : ''}
${scenario.trigger.keywords ? `- Keywords: ${scenario.trigger.keywords.map(k => `"${k}"`).join(', ')}` : ''}
${scenario.trigger.schedule ? `- Schedule: \`${scenario.trigger.schedule.cron}\`` : ''}
${scenario.trigger.webhook ? `- Webhook: \`${scenario.trigger.webhook.method} ${scenario.trigger.webhook.path}\`` : ''}

## Dependencies

${scenario.dependencies?.mcps?.length > 0 ? `**MCP Servers:**\n${scenario.dependencies.mcps.map(mcp => `- ${mcp}`).join('\n')}` : '**MCP Servers:** None'}

${scenario.dependencies?.skills?.length > 0 ? `\n**Skills:**\n${scenario.dependencies.skills.map(skill => `- ${skill}`).join('\n')}` : '\n**Skills:** None'}

## Execution Flow

\`\`\`
${steps.map((step, index) => {
  const deps = step.dependencies ? ` (after: ${step.dependencies.join(', ')})` : '';
  return `${index + 1}. [${step.id}] ${step.action}${deps}`;
}).join('\n')}
\`\`\`

---

**Generated:** ${helpers.timestamp()}  
**Scenario Version:** ${scenario.version || '1.0.0'}  
**Auto-generated - Do not edit manually**
`;
}

/**
 * Generate metadata.json for a skill
 * 
 * @param {Object} context - Template context
 * @returns {string} Generated metadata.json content
 */
export function generateSkillMetadata(context) {
  const { scenario, skillName } = context;
  
  const metadata = {
    name: skillName,
    version: scenario.version || '1.0.0',
    description: scenario.description,
    category: scenario.category,
    generatedFrom: scenario.name,
    generatedAt: helpers.timestamp(),
    dependencies: {
      mcps: scenario.dependencies?.mcps || [],
      skills: scenario.dependencies?.skills || []
    },
    triggers: {
      type: scenario.trigger.type,
      command: scenario.trigger.command,
      keywords: scenario.trigger.keywords,
      schedule: scenario.trigger.schedule,
      webhook: scenario.trigger.webhook
    },
    steps: scenario.steps.map(step => ({
      id: step.id,
      action: step.action,
      type: step.type
    }))
  };
  
  return JSON.stringify(metadata, null, 2);
}

export default {
  generateSkillMd,
  generateSkillMetadata
};

