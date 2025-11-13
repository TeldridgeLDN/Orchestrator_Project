/**
 * Slash Command Template Generator
 * 
 * Generates slash command definitions from scenario data
 */

import { helpers } from '../../utils/template-engine.js';

/**
 * Generate slash command content for a scenario
 * 
 * @param {Object} context - Template context
 * @param {Object} context.scenario - Scenario data
 * @param {string} context.commandName - Name of the command (e.g., /client-intake)
 * @returns {string} Generated command.md content
 */
export function generateCommandMd(context) {
  const { scenario, commandName } = context;
  const { description, steps } = scenario;
  
  // Ensure command has leading slash
  const fullCommand = commandName.startsWith('/') ? commandName : `/${commandName}`;
  
  return `# ${fullCommand}

${description}

**Auto-generated from scenario:** \`${scenario.name}\`

---

## Description

${description}

## Steps

This command executes the following workflow:

${steps.map((step, index) => `${index + 1}. **${step.action}**
   - Type: ${step.type}
   ${step.mcp ? `- Uses: ${step.mcp}` : ''}
   ${step.dependencies ? `- Requires: ${step.dependencies.join(', ')}` : ''}`).join('\n\n')}

## Prerequisites

${scenario.dependencies?.mcps?.length > 0 ? `**MCP Servers:**\n${scenario.dependencies.mcps.map(mcp => `- \`${mcp}\``).join('\n')}` : '**MCP Servers:** None required'}

${scenario.dependencies?.skills?.length > 0 ? `\n**Skills:**\n${scenario.dependencies.skills.map(skill => `- \`${skill}\``).join('\n')}` : '\n**Skills:** None required'}

## Usage

\`\`\`
${fullCommand}
\`\`\`

The command will:
${steps.map((step, index) => `${index + 1}. ${step.action}`).join('\n')}

## Expected Output

The workflow will execute each step in sequence, respecting dependencies.
Progress and results will be displayed as each step completes.

${scenario.testStrategy ? `## Testing\n\n${scenario.testStrategy}` : ''}

---

**Generated:** ${helpers.timestamp()}  
**Version:** ${scenario.version || '1.0.0'}  
**Auto-generated - Customize as needed**
`;
}

export default {
  generateCommandMd
};

