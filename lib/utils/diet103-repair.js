/**
 * diet103 Infrastructure Repair System
 * 
 * Provides automated repair and installation of missing diet103 components.
 * Ensures projects meet diet103 1.2.0 specification requirements.
 * 
 * @module diet103-repair
 * @version 1.1.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectDiet103Infrastructure, analyzeDiet103Gaps } from './diet103-validator.js';
import { initializeFileLifecycle } from '../init/file_lifecycle_init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Template content for diet103 components
 */
const TEMPLATES = {
  CLAUDE_MD: `# {{PROJECT_NAME}}

## Project Overview
This project follows diet103 1.2.0 specification for Claude Code integration.

Created: {{CREATED_DATE}}

## Skills
{{SKILLS_DESCRIPTION}}

## Development Guidelines
- Follow diet103 conventions
- Keep hooks executable
- Maintain metadata.json accuracy
`,

  METADATA_JSON: {
    project_id: '{{PROJECT_ID}}',
    version: '0.1.0',
    description: '{{PROJECT_DESCRIPTION}}',
    skills: [],
    created: '{{CREATED_DATE}}',
    diet103_version: '1.2.0',
    tags: []
  },

  SKILL_RULES_JSON: {
    rules: []
  },

  README_MD: `# {{PROJECT_NAME}}

diet103-compliant Claude Code project.

## Structure
- \`.claude/\` - diet103 infrastructure
- \`.claude/hooks/\` - Claude Code hooks
- \`.claude/skills/\` - Project skills
- \`.claude/commands/\` - Custom commands
- \`.claude/agents/\` - Sub-agents

## Setup
1. Ensure hooks are executable: \`chmod +x .claude/hooks/*.js\`
2. Configure skills in \`metadata.json\`
3. Run validation: \`diet103 validate\`
`,

  USER_PROMPT_SUBMIT_HOOK: `#!/usr/bin/env node

/**
 * UserPromptSubmit Hook
 * 
 * Triggered when user submits a prompt to Claude.
 * Use for pre-processing, context injection, or prompt augmentation.
 * 
 * @param {Object} context - Hook context
 * @param {string} context.prompt - User's submitted prompt
 * @param {Object} context.project - Project information
 * @returns {Object} Modified context or null to proceed unchanged
 */

export default async function UserPromptSubmit(context) {
  // Your hook logic here
  
  return null; // Return null to proceed without modifications
}
`,

  POST_TOOL_USE_HOOK: `#!/usr/bin/env node

/**
 * PostToolUse Hook
 * 
 * Triggered after Claude uses a tool (file edit, terminal command, etc).
 * Use for post-processing, validation, or automated actions.
 * 
 * @param {Object} context - Hook context
 * @param {string} context.tool - Tool that was used
 * @param {Object} context.result - Tool execution result
 * @param {Object} context.project - Project information
 * @returns {Object} Additional actions or null
 */

export default async function PostToolUse(context) {
  // Your hook logic here
  
  return null; // Return null for no additional actions
}
`
};

/**
 * Replace template variables in content
 * 
 * @param {string} content - Template content with {{VARIABLE}} placeholders
 * @param {Object} variables - Key-value pairs for replacement
 * @returns {string} Content with variables replaced
 */
export function replaceTemplateVariables(content, variables) {
  let result = content;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replaceAll(placeholder, value);
  }
  
  return result;
}

/**
 * Install critical diet103 components
 * 
 * Creates:
 * - .claude/ directory
 * - Claude.md
 * - metadata.json
 * - skill-rules.json
 * - hooks/ directory
 * - hooks/UserPromptSubmit.js
 * - hooks/PostToolUse.js
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {Object} variables - Template variables for replacement
 * @returns {Promise<Array<string>>} Array of installed components
 */
export async function installCriticalComponents(projectPath, variables = {}) {
  const installed = [];
  const claudeDir = path.join(projectPath, '.claude');
  const hooksDir = path.join(claudeDir, 'hooks');

  // Create .claude directory
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
    installed.push('.claude/');
  }

  // Create hooks directory
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
    installed.push('.claude/hooks/');
  }

  // Install Claude.md
  const claudeMdPath = path.join(claudeDir, 'Claude.md');
  if (!fs.existsSync(claudeMdPath)) {
    const content = replaceTemplateVariables(TEMPLATES.CLAUDE_MD, variables);
    await fs.promises.writeFile(claudeMdPath, content, 'utf8');
    installed.push('.claude/Claude.md');
  }

  // Install metadata.json
  const metadataPath = path.join(claudeDir, 'metadata.json');
  if (!fs.existsSync(metadataPath)) {
    const template = JSON.parse(JSON.stringify(TEMPLATES.METADATA_JSON)); // Deep clone
    template.project_id = variables.PROJECT_ID || path.basename(projectPath);
    template.description = variables.PROJECT_DESCRIPTION || `diet103-compliant project`;
    template.created = variables.CREATED_DATE || new Date().toISOString();
    
    await fs.promises.writeFile(metadataPath, JSON.stringify(template, null, 2), 'utf8');
    installed.push('.claude/metadata.json');
  }

  // Install skill-rules.json
  const skillRulesPath = path.join(claudeDir, 'skill-rules.json');
  if (!fs.existsSync(skillRulesPath)) {
    await fs.promises.writeFile(
      skillRulesPath,
      JSON.stringify(TEMPLATES.SKILL_RULES_JSON, null, 2),
      'utf8'
    );
    installed.push('.claude/skill-rules.json');
  }

  // Install UserPromptSubmit.js hook
  const userPromptPath = path.join(hooksDir, 'UserPromptSubmit.js');
  if (!fs.existsSync(userPromptPath)) {
    await fs.promises.writeFile(userPromptPath, TEMPLATES.USER_PROMPT_SUBMIT_HOOK, 'utf8');
    fs.chmodSync(userPromptPath, 0o755); // Make executable
    installed.push('.claude/hooks/UserPromptSubmit.js');
  }

  // Install PostToolUse.js hook
  const postToolUsePath = path.join(hooksDir, 'PostToolUse.js');
  if (!fs.existsSync(postToolUsePath)) {
    await fs.promises.writeFile(postToolUsePath, TEMPLATES.POST_TOOL_USE_HOOK, 'utf8');
    fs.chmodSync(postToolUsePath, 0o755); // Make executable
    installed.push('.claude/hooks/PostToolUse.js');
  }

  return installed;
}

/**
 * Install important (but optional) diet103 directories
 * 
 * Creates:
 * - skills/ directory
 * - commands/ directory
 * - agents/ directory
 * - resources/ directory
 * - README.md
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {Object} variables - Template variables for replacement
 * @returns {Promise<Array<string>>} Array of installed directories
 */
export async function installImportantDirectories(projectPath, variables = {}) {
  const installed = [];
  const claudeDir = path.join(projectPath, '.claude');

  const directories = [
    'skills',
    'commands',
    'agents',
    'resources'
  ];

  // Create directories
  for (const dir of directories) {
    const dirPath = path.join(claudeDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      installed.push(`.claude/${dir}/`);
    }
  }

  // Create README.md
  const readmePath = path.join(claudeDir, 'README.md');
  if (!fs.existsSync(readmePath)) {
    const content = replaceTemplateVariables(TEMPLATES.README_MD, variables);
    await fs.promises.writeFile(readmePath, content, 'utf8');
    installed.push('.claude/README.md');
  }

  return installed;
}

/**
 * Repair diet103 infrastructure
 * 
 * Main entry point for auto-repair functionality.
 * Analyzes gaps and installs missing components.
 * 
 * @param {string} projectPath - Absolute path to project root
 * @param {Object} options - Repair options
 * @param {boolean} options.installImportant - Install important directories (default: true)
 * @param {Object} options.variables - Template variables for replacement
 * @returns {Promise<Object>} Repair results
 */
export async function repairDiet103Infrastructure(projectPath, options = {}) {
  const { installImportant = true, variables = {} } = options;

  // Detect current state
  const checks = await detectDiet103Infrastructure(projectPath);
  const gaps = analyzeDiet103Gaps(checks);

  const result = {
    before: {
      score: gaps.score,
      criticalGaps: gaps.critical.length,
      importantGaps: gaps.important.length
    },
    installed: {
      critical: [],
      important: []
    },
    after: {
      score: 0,
      criticalGaps: 0,
      importantGaps: 0
    }
  };

  // Prepare template variables
  const templateVars = {
    PROJECT_NAME: path.basename(projectPath),
    PROJECT_ID: path.basename(projectPath).toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    PROJECT_DESCRIPTION: `diet103-compliant project`,
    CREATED_DATE: new Date().toISOString(),
    SKILLS_DESCRIPTION: 'No skills configured yet',
    ...variables
  };

  // Install critical components if needed
  if (gaps.critical.length > 0) {
    result.installed.critical = await installCriticalComponents(projectPath, templateVars);
  }

  // Install important directories if requested
  if (installImportant && gaps.important.length > 0) {
    result.installed.important = await installImportantDirectories(projectPath, templateVars);
  }

  // Initialize File Lifecycle Management System (NEW: Added in v1.1.0)
  try {
    const fileLifecycleResult = await initializeFileLifecycle({
      projectRoot: projectPath,
      verbose: false
    });
    
    if (fileLifecycleResult && fileLifecycleResult.created) {
      result.installed.fileLifecycle = ['.file-manifest.json', '.claude/archive/', '.claude/backups/'];
    }
  } catch (error) {
    // File lifecycle initialization is non-critical, log but don't fail
    console.warn(`  ! File lifecycle initialization warning: ${error.message}`);
  }

  // Install Core Infrastructure Files (NEW: Added in v1.1.1)
  result.installed.coreInfrastructure = [];
  
  try {
    // 1. Create .mcp.json if missing
    const mcpConfigPath = path.join(projectPath, '.mcp.json');
    if (!fs.existsSync(mcpConfigPath)) {
      const mcpTemplate = {
        mcpServers: {
          "task-master-ai": {
            command: "npx",
            args: ["-y", "task-master-ai"],
            env: {
              ANTHROPIC_API_KEY: "",
              PERPLEXITY_API_KEY: "",
              OPENAI_API_KEY: "",
              GOOGLE_API_KEY: "",
              XAI_API_KEY: "",
              MISTRAL_API_KEY: ""
            },
            disabled: true
          }
        }
      };
      await fs.promises.writeFile(
        mcpConfigPath,
        JSON.stringify(mcpTemplate, null, 2),
        'utf8'
      );
      result.installed.coreInfrastructure.push('.mcp.json');
    }

    // 2. Create .env.example
    const envExamplePath = path.join(projectPath, '.env.example');
    if (!fs.existsSync(envExamplePath)) {
      const envTemplate = `# API Keys for AI Services
# Copy this file to .env and fill in your actual keys
# Never commit .env to version control!

# Required for TaskMaster AI
ANTHROPIC_API_KEY=your_anthropic_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here

# Optional AI Service Keys
OPENAI_API_KEY=your_openai_key_here
GOOGLE_API_KEY=your_google_key_here
XAI_API_KEY=your_xai_key_here
MISTRAL_API_KEY=your_mistral_key_here

# Project-Specific Keys
# Add your custom API keys below
`;
      await fs.promises.writeFile(envExamplePath, envTemplate, 'utf8');
      result.installed.coreInfrastructure.push('.env.example');
    }

    // 3. Create .gitignore
    const gitignorePath = path.join(projectPath, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      const gitignoreTemplate = `# Environment & Secrets
.env
.env.local
.env.*.local
*.key
*.pem
*.p12
*.pfx

# Dependencies
node_modules/
venv/
.venv/
env/
ENV/
__pycache__/
*.py[cod]

# IDE & Editors
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Build Outputs
dist/
build/
*.log
*.tmp
*.cache

# Test Coverage
coverage/
.nyc_output/
htmlcov/
.coverage

# File Lifecycle Backups
.file-manifest.json.bak
.claude/backups/*.bak

# Optional: Uncomment if you want to exclude TaskMaster tasks from Git
# .taskmaster/tasks.json
# .taskmaster/reports/
`;
      await fs.promises.writeFile(gitignorePath, gitignoreTemplate, 'utf8');
      result.installed.coreInfrastructure.push('.gitignore');
    }
  } catch (error) {
    // Core infrastructure installation is non-critical, log but don't fail
    console.warn(`  ! Core infrastructure installation warning: ${error.message}`);
  }

  // Install Documentation Templates (NEW: Added in v1.2.0 - Phase 2)
  result.installed.documentationTemplates = [];
  
  try {
    const templatesDir = path.join(projectPath, 'templates', 'documentation');
    
    // Only create templates directory if it doesn't exist
    if (!fs.existsSync(templatesDir)) {
      await fs.promises.mkdir(templatesDir, { recursive: true });
      
      // Define template sources from Orchestrator_Project
      const templateSources = path.join(__dirname, '../../templates/documentation');
      const templateFiles = [
        'README.md',
        'ARCHITECTURE.md',
        'ADR_TEMPLATE.md',
        'CONTRIBUTING.md',
        'API.md'
      ];
      
      // Copy each template if source exists
      for (const templateFile of templateFiles) {
        const sourcePath = path.join(templateSources, templateFile);
        const destPath = path.join(templatesDir, templateFile);
        
        try {
          if (fs.existsSync(sourcePath)) {
            await fs.promises.copyFile(sourcePath, destPath);
            result.installed.documentationTemplates.push(`templates/documentation/${templateFile}`);
          }
        } catch (copyError) {
          // Individual template copy failure is non-critical
          console.warn(`  ! Could not copy template ${templateFile}: ${copyError.message}`);
        }
      }
    }
  } catch (error) {
    // Documentation templates installation is non-critical, log but don't fail
    console.warn(`  ! Documentation templates installation warning: ${error.message}`);
  }

  // Re-check after repair
  const afterChecks = await detectDiet103Infrastructure(projectPath);
  const afterGaps = analyzeDiet103Gaps(afterChecks);

  result.after = {
    score: afterGaps.score,
    criticalGaps: afterGaps.critical.length,
    importantGaps: afterGaps.important.length
  };

  result.success = afterGaps.critical.length === 0;
  result.totalInstalled = result.installed.critical.length + 
                         result.installed.important.length + 
                         (result.installed.fileLifecycle?.length || 0) + 
                         (result.installed.coreInfrastructure?.length || 0) +
                         (result.installed.documentationTemplates?.length || 0);

  return result;
}

