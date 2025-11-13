/**
 * MCP Configuration Validator
 * 
 * Validates .mcp.json files against Orchestrator template standards
 * Used during project initialization and registration
 */

import fs from 'fs';
import path from 'path';

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Overall validation status
 * @property {Array<Object>} errors - Critical issues that must be fixed
 * @property {Array<Object>} warnings - Non-critical issues (best practices)
 * @property {Object} suggestions - Recommended fixes
 */

/**
 * MCP template structure (from lib/templates/scaffold/mcp-template.js)
 */
const MCP_TEMPLATE_STANDARD = {
  requiredFields: ['type', 'command', 'args', 'env'],
  recommendedFields: ['metadata'],
  validTypes: ['stdio'],
  validCommands: ['npx', 'node'],
};

/**
 * Validate MCP configuration file
 * 
 * @param {string} projectPath - Absolute path to project directory
 * @returns {ValidationResult} Validation result with errors/warnings
 */
export function validateMcpConfig(projectPath) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    suggestions: {},
  };

  const mcpPath = path.join(projectPath, '.cursor', 'mcp.json');

  // Check if .mcp.json exists
  if (!fs.existsSync(mcpPath)) {
    result.errors.push({
      code: 'MCP_FILE_MISSING',
      message: 'MCP configuration file not found',
      location: mcpPath,
      severity: 'error',
    });
    result.valid = false;
    return result;
  }

  // Parse JSON
  let mcpConfig;
  try {
    const content = fs.readFileSync(mcpPath, 'utf-8');
    mcpConfig = JSON.parse(content);
  } catch (error) {
    result.errors.push({
      code: 'MCP_PARSE_ERROR',
      message: `Failed to parse MCP config: ${error.message}`,
      location: mcpPath,
      severity: 'error',
    });
    result.valid = false;
    return result;
  }

  // Validate structure
  if (!mcpConfig.mcpServers || typeof mcpConfig.mcpServers !== 'object') {
    result.errors.push({
      code: 'MCP_INVALID_STRUCTURE',
      message: 'Missing or invalid "mcpServers" object',
      location: mcpPath,
      severity: 'error',
    });
    result.valid = false;
    return result;
  }

  // Validate each MCP server
  const serverNames = Object.keys(mcpConfig.mcpServers);
  
  if (serverNames.length === 0) {
    result.warnings.push({
      code: 'MCP_NO_SERVERS',
      message: 'No MCP servers configured',
      location: mcpPath,
      severity: 'warning',
    });
  }

  serverNames.forEach(serverName => {
    const server = mcpConfig.mcpServers[serverName];
    const serverPath = `mcpServers.${serverName}`;

    // Validate required fields
    validateRequiredFields(server, serverPath, serverName, result);
    
    // Validate field values
    validateFieldValues(server, serverPath, serverName, result);
    
    // Validate environment variables
    validateEnvVars(server, serverPath, serverName, result);
    
    // Check for metadata (recommended)
    validateMetadata(server, serverPath, serverName, result);
  });

  // Generate suggestions if there are issues
  if (result.errors.length > 0 || result.warnings.length > 0) {
    result.suggestions = generateSuggestions(mcpConfig, result);
  }

  return result;
}

/**
 * Validate required fields exist
 */
function validateRequiredFields(server, serverPath, serverName, result) {
  // Check for 'type' field
  if (!server.type) {
    result.errors.push({
      code: 'MCP_MISSING_TYPE',
      message: `Missing required "type" field`,
      location: serverPath,
      serverName,
      severity: 'error',
      fix: 'Add "type": "stdio" to the server configuration',
    });
    result.valid = false;
  }

  // Check for 'command' field
  if (!server.command) {
    result.errors.push({
      code: 'MCP_MISSING_COMMAND',
      message: `Missing required "command" field`,
      location: serverPath,
      serverName,
      severity: 'error',
    });
    result.valid = false;
  }

  // Check for 'args' field
  if (!server.args) {
    result.errors.push({
      code: 'MCP_MISSING_ARGS',
      message: `Missing required "args" field`,
      location: serverPath,
      serverName,
      severity: 'error',
    });
    result.valid = false;
  }

  // Check for 'env' field
  if (!server.env) {
    result.warnings.push({
      code: 'MCP_MISSING_ENV',
      message: `Missing "env" field - MCP may not have access to API keys`,
      location: serverPath,
      serverName,
      severity: 'warning',
    });
  }
}

/**
 * Validate field values are correct
 */
function validateFieldValues(server, serverPath, serverName, result) {
  // Validate type
  if (server.type && !MCP_TEMPLATE_STANDARD.validTypes.includes(server.type)) {
    result.errors.push({
      code: 'MCP_INVALID_TYPE',
      message: `Invalid type "${server.type}". Must be one of: ${MCP_TEMPLATE_STANDARD.validTypes.join(', ')}`,
      location: `${serverPath}.type`,
      serverName,
      severity: 'error',
    });
    result.valid = false;
  }

  // Validate command
  if (server.command && !MCP_TEMPLATE_STANDARD.validCommands.includes(server.command)) {
    result.warnings.push({
      code: 'MCP_UNUSUAL_COMMAND',
      message: `Unusual command "${server.command}". Expected: ${MCP_TEMPLATE_STANDARD.validCommands.join(', ')}`,
      location: `${serverPath}.command`,
      serverName,
      severity: 'warning',
    });
  }

  // Validate args format
  if (server.args) {
    if (!Array.isArray(server.args)) {
      result.errors.push({
        code: 'MCP_INVALID_ARGS',
        message: `"args" must be an array`,
        location: `${serverPath}.args`,
        serverName,
        severity: 'error',
      });
      result.valid = false;
    } else {
      // Check for overly complex args (like --package= syntax)
      const hasComplexArgs = server.args.some(arg => 
        typeof arg === 'string' && arg.includes('--package=')
      );
      
      if (hasComplexArgs) {
        result.warnings.push({
          code: 'MCP_COMPLEX_ARGS',
          message: `Args array contains complex syntax. Consider simplifying to ["-y", "package-name"]`,
          location: `${serverPath}.args`,
          serverName,
          severity: 'warning',
          currentValue: server.args,
          suggestedValue: ['-y', serverName],
        });
      }
    }
  }
}

/**
 * Validate environment variables
 */
function validateEnvVars(server, serverPath, serverName, result) {
  if (!server.env || typeof server.env !== 'object') {
    return;
  }

  const envVars = Object.entries(server.env);

  envVars.forEach(([key, value]) => {
    // Check for hardcoded values (not env var references)
    const isEnvVarReference = typeof value === 'string' && 
                             value.startsWith('${') && 
                             value.endsWith('}');

    if (!isEnvVarReference) {
      // Check if it's a placeholder string
      const isPlaceholder = typeof value === 'string' && 
                           (value.includes('YOUR_') || 
                            value.includes('_HERE') || 
                            value.includes('PASTE_YOUR'));

      if (isPlaceholder) {
        result.errors.push({
          code: 'MCP_HARDCODED_PLACEHOLDER',
          message: `Environment variable "${key}" contains placeholder value instead of env var reference`,
          location: `${serverPath}.env.${key}`,
          serverName,
          severity: 'error',
          currentValue: value,
          suggestedValue: `\${${key}}`,
          fix: `Change "${value}" to "\${${key}}" to reference actual environment variable`,
        });
        result.valid = false;
      } else {
        // Actual hardcoded secret
        result.errors.push({
          code: 'MCP_HARDCODED_SECRET',
          message: `Environment variable "${key}" appears to be hardcoded (security risk!)`,
          location: `${serverPath}.env.${key}`,
          serverName,
          severity: 'error',
          fix: `Change to "\${${key}}" and move actual value to .env file`,
        });
        result.valid = false;
      }
    }
  });
}

/**
 * Validate metadata (recommended but not required)
 */
function validateMetadata(server, serverPath, serverName, result) {
  if (!server.metadata) {
    result.warnings.push({
      code: 'MCP_NO_METADATA',
      message: `Missing recommended "metadata" object`,
      location: serverPath,
      serverName,
      severity: 'warning',
      fix: 'Add metadata object with project, description, and generatedAt fields',
    });
    return;
  }

  const metadata = server.metadata;

  // Check for recommended metadata fields
  const recommendedFields = ['project', 'description', 'generatedAt'];
  
  recommendedFields.forEach(field => {
    if (!metadata[field]) {
      result.warnings.push({
        code: 'MCP_INCOMPLETE_METADATA',
        message: `Metadata missing recommended field: "${field}"`,
        location: `${serverPath}.metadata`,
        serverName,
        severity: 'warning',
      });
    }
  });
}

/**
 * Generate fix suggestions based on errors
 */
function generateSuggestions(mcpConfig, result) {
  const suggestions = {};

  result.errors.forEach(error => {
    if (error.suggestedValue) {
      if (!suggestions[error.serverName]) {
        suggestions[error.serverName] = {};
      }
      
      const field = error.location.split('.').pop();
      suggestions[error.serverName][field] = error.suggestedValue;
    }
  });

  return suggestions;
}

/**
 * Format validation result for display
 * 
 * @param {ValidationResult} result - Validation result
 * @returns {string} Formatted output
 */
export function formatValidationResult(result) {
  let output = [];

  if (result.valid) {
    output.push('✅ MCP configuration is valid\n');
  } else {
    output.push('❌ MCP configuration has issues\n');
  }

  // Display errors
  if (result.errors.length > 0) {
    output.push('\n🔴 ERRORS (must fix):\n');
    result.errors.forEach((error, i) => {
      output.push(`${i + 1}. [${error.code}] ${error.message}`);
      output.push(`   Location: ${error.location}`);
      if (error.fix) {
        output.push(`   Fix: ${error.fix}`);
      }
      if (error.currentValue) {
        output.push(`   Current: ${JSON.stringify(error.currentValue)}`);
      }
      if (error.suggestedValue) {
        output.push(`   Suggested: ${JSON.stringify(error.suggestedValue)}`);
      }
      output.push('');
    });
  }

  // Display warnings
  if (result.warnings.length > 0) {
    output.push('\n⚠️  WARNINGS (should fix):\n');
    result.warnings.forEach((warning, i) => {
      output.push(`${i + 1}. [${warning.code}] ${warning.message}`);
      output.push(`   Location: ${warning.location}`);
      if (warning.fix) {
        output.push(`   Suggestion: ${warning.fix}`);
      }
      output.push('');
    });
  }

  return output.join('\n');
}

/**
 * Auto-fix MCP configuration issues
 * 
 * @param {string} projectPath - Absolute path to project directory
 * @param {ValidationResult} validationResult - Previous validation result
 * @returns {Object} Result of auto-fix operation
 */
export function autoFixMcpConfig(projectPath, validationResult) {
  const mcpPath = path.join(projectPath, '.cursor', 'mcp.json');
  
  // Backup original
  const backupPath = `${mcpPath}.backup`;
  fs.copyFileSync(mcpPath, backupPath);

  try {
    const content = fs.readFileSync(mcpPath, 'utf-8');
    let mcpConfig = JSON.parse(content);

    let fixed = 0;

    // Apply fixes based on suggestions
    Object.keys(validationResult.suggestions).forEach(serverName => {
      const serverSuggestions = validationResult.suggestions[serverName];
      const server = mcpConfig.mcpServers[serverName];

      Object.keys(serverSuggestions).forEach(field => {
        server[field] = serverSuggestions[field];
        fixed++;
      });
    });

    // Fix hardcoded env vars
    validationResult.errors.forEach(error => {
      if (error.code === 'MCP_HARDCODED_PLACEHOLDER' || error.code === 'MCP_HARDCODED_SECRET') {
        const serverName = error.serverName;
        const envKey = error.location.split('.').pop();
        
        if (mcpConfig.mcpServers[serverName]?.env) {
          mcpConfig.mcpServers[serverName].env[envKey] = `\${${envKey}}`;
          fixed++;
        }
      }
    });

    // Add missing type fields
    Object.keys(mcpConfig.mcpServers).forEach(serverName => {
      if (!mcpConfig.mcpServers[serverName].type) {
        mcpConfig.mcpServers[serverName].type = 'stdio';
        fixed++;
      }
    });

    // Write fixed config
    fs.writeFileSync(mcpPath, JSON.stringify(mcpConfig, null, 2));

    return {
      success: true,
      fixed,
      backupPath,
      message: `Fixed ${fixed} issue(s). Original saved to ${backupPath}`,
    };
  } catch (error) {
    // Restore backup on error
    fs.copyFileSync(backupPath, mcpPath);
    
    return {
      success: false,
      error: error.message,
      message: 'Auto-fix failed. Original config restored.',
    };
  }
}

export default {
  validateMcpConfig,
  formatValidationResult,
  autoFixMcpConfig,
};


