/**
 * MCP Configuration Template Generator
 * 
 * Generates MCP configuration entries from scenario data
 */

import { helpers } from '../../utils/template-engine.js';

/**
 * Generate MCP configuration section for .mcp.json
 * 
 * @param {Object} context - Template context
 * @param {Object} context.scenario - Scenario data
 * @returns {Object} MCP configuration object (to be merged)
 */
export function generateMcpConfig(context) {
  const { scenario } = context;
  const mcps = scenario.dependencies?.mcps || [];
  
  if (mcps.length === 0) {
    return {};
  }
  
  const config = {};
  
  // Generate configuration for each MCP
  mcps.forEach(mcpName => {
    // Extract package name from MCP name
    const packageName = mcpName;
    
    config[mcpName] = {
      type: 'stdio',
      command: 'npx',
      args: ['-y', packageName],
      env: {
        // Placeholder - user will need to configure actual API keys
        API_KEY: `\${${helpers.constantCase(mcpName)}_API_KEY}`
      },
      metadata: {
        generatedFrom: scenario.name,
        generatedAt: helpers.timestamp(),
        description: `MCP for ${scenario.description}`
      }
    };
  });
  
  return config;
}

/**
 * Generate documentation for MCP setup
 * 
 * @param {Object} context - Template context
 * @returns {string} MCP setup documentation
 */
export function generateMcpDocumentation(context) {
  const { scenario } = context;
  const mcps = scenario.dependencies?.mcps || [];
  
  if (mcps.length === 0) {
    return 'No MCP dependencies required.';
  }
  
  return `# MCP Configuration for ${scenario.name}

## Required MCPs

${mcps.map(mcp => `
### ${mcp}

**Purpose:** Used in scenario steps for ${scenario.description}

**Installation:**
\`\`\`bash
npm install -g ${mcp}
\`\`\`

**Configuration:**
Add to \`.mcp.json\`:
\`\`\`json
{
  "mcpServers": {
    "${mcp}": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "${mcp}"],
      "env": {
        "API_KEY": "\${${helpers.constantCase(mcp)}_API_KEY}"
      }
    }
  }
}
\`\`\`

**Environment Variable:**
Add to \`.env\`:
\`\`\`bash
${helpers.constantCase(mcp)}_API_KEY=your-api-key-here
\`\`\`
`).join('\n')}

## Verification

After configuration, restart Claude Code and verify MCP availability:

\`\`\`bash
# Check MCP status
# (specific commands depend on MCP implementation)
\`\`\`

---

**Generated:** ${helpers.timestamp()}
`;
}

export default {
  generateMcpConfig,
  generateMcpDocumentation
};

