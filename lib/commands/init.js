/**
 * Claude Init Command
 * 
 * Initializes a new Claude project in the current directory,
 * setting up the necessary file structure and configuration.
 * 
 * @module commands/init
 * @version 1.0.0
 */

import path from 'path';
import { promises as fs } from 'fs';
import chalk from 'chalk';
import prompts from 'prompts';
import { createError, wrapError, createCommandErrorHandler } from '../utils/errors/index.js';

/**
 * Default Claude.md template
 */
const DEFAULT_CLAUDE_MD = `# {{PROJECT_NAME}}

## Project Overview

{{PROJECT_DESCRIPTION}}

## Project Context

This project uses the diet103 orchestration system to manage development workflows and infrastructure.

### Key Technologies

- **Framework**: (Add your framework here)
- **Language**: (Add your language here)
- **Infrastructure**: diet103 orchestrator

### Project Structure

\`\`\`
project/
├── .claude/              # Claude orchestration files
├── .taskmaster/          # Task management (optional)
├── src/                  # Source code
└── docs/                 # Documentation
\`\`\`

## Development Guidelines

### Code Standards

- Follow existing code patterns
- Write tests for new features
- Document public APIs

### Workflow

1. Use TaskMaster for task management
2. Follow git branch naming conventions
3. Create descriptive commit messages

## Available Skills

(Skills will be listed here as they are added)

## Slash Commands

(Custom commands will be listed here as they are created)
`;

/**
 * Default metadata.json template
 */
function createDefaultMetadata(projectName, description) {
  return {
    name: projectName,
    version: '1.0.0',
    description: description || `${projectName} - A Claude orchestrated project`,
    created: new Date().toISOString(),
    diet103_version: '1.0.0',
    tags: [],
    settings: {
      auto_validate: true,
      health_tracking: true
    },
    imports: {
      skills: []
    }
  };
}

/**
 * Default skill-rules.json template
 */
function createDefaultSkillRules() {
  return {
    rules: [],
    settings: {
      auto_activate: true,
      confidence_threshold: 0.8
    }
  };
}

/**
 * Check if directory is suitable for initialization
 */
async function validateDirectory(targetPath) {
  const claudeDir = path.join(targetPath, '.claude');
  
  try {
    await fs.access(claudeDir);
    return {
      valid: false,
      reason: 'A Claude project already exists in this directory',
      existingPath: claudeDir
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { valid: true };
    }
    throw error;
  }
}

/**
 * Create directory structure
 */
async function createDirectoryStructure(targetPath, verbose = false) {
  const dirs = [
    '.claude',
    '.claude/hooks',
    '.claude/skills',
    '.claude/commands',
    '.claude/resources',
    '.claude/archive',
    '.claude/backups'
  ];
  
  let created = 0;
  
  for (const dir of dirs) {
    const fullPath = path.join(targetPath, dir);
    try {
      await fs.mkdir(fullPath, { recursive: true });
      created++;
      if (verbose) {
        console.log(chalk.dim(`  ✓ Created ${dir}/`));
      }
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw wrapError(error, 'UTIL-FS-005', { path: fullPath });
      }
    }
  }
  
  return created;
}

/**
 * Create configuration files
 */
async function createConfigurationFiles(targetPath, config, verbose = false) {
  const { projectName, description } = config;
  
  try {
    // Create Claude.md
    const claudeMdPath = path.join(targetPath, 'CLAUDE.md');
    const claudeMdContent = DEFAULT_CLAUDE_MD
      .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
      .replace(/\{\{PROJECT_DESCRIPTION\}\}/g, description);
    
    await fs.writeFile(claudeMdPath, claudeMdContent, 'utf-8');
    if (verbose) {
      console.log(chalk.dim('  ✓ Created CLAUDE.md'));
    }
    
    // Create .claude/metadata.json
    const metadataPath = path.join(targetPath, '.claude', 'metadata.json');
    const metadata = createDefaultMetadata(projectName, description);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    if (verbose) {
      console.log(chalk.dim('  ✓ Created .claude/metadata.json'));
    }
    
    // Create .claude/skill-rules.json
    const skillRulesPath = path.join(targetPath, '.claude', 'skill-rules.json');
    const skillRules = createDefaultSkillRules();
    await fs.writeFile(skillRulesPath, JSON.stringify(skillRules, null, 2), 'utf-8');
    if (verbose) {
      console.log(chalk.dim('  ✓ Created .claude/skill-rules.json'));
    }
    
    // Create .claude/settings.json (for Claude Code integration)
    const settingsPath = path.join(targetPath, '.claude', 'settings.json');
    const settings = {
      allowedTools: [
        "Edit",
        "Bash(*)",
        "mcp__*"
      ],
      autoLoadContext: true,
      contextFiles: [
        "CLAUDE.md"
      ]
    };
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    if (verbose) {
      console.log(chalk.dim('  ✓ Created .claude/settings.json'));
    }

    // Create Core Infrastructure Files (NEW: Added in v1.1.1)
    let coreFilesCreated = 0;

    // 1. Create .mcp.json
    const mcpConfigPath = path.join(targetPath, '.mcp.json');
    if (!await fs.access(mcpConfigPath).then(() => true).catch(() => false)) {
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
      await fs.writeFile(mcpConfigPath, JSON.stringify(mcpTemplate, null, 2), 'utf-8');
      if (verbose) {
        console.log(chalk.dim('  ✓ Created .mcp.json'));
      }
      coreFilesCreated++;
    }

    // 2. Create .env.example
    const envExamplePath = path.join(targetPath, '.env.example');
    if (!await fs.access(envExamplePath).then(() => true).catch(() => false)) {
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
      await fs.writeFile(envExamplePath, envTemplate, 'utf-8');
      if (verbose) {
        console.log(chalk.dim('  ✓ Created .env.example'));
      }
      coreFilesCreated++;
    }

    // 3. Create .gitignore
    const gitignorePath = path.join(targetPath, '.gitignore');
    if (!await fs.access(gitignorePath).then(() => true).catch(() => false)) {
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
      await fs.writeFile(gitignorePath, gitignoreTemplate, 'utf-8');
      if (verbose) {
        console.log(chalk.dim('  ✓ Created .gitignore'));
      }
      coreFilesCreated++;
    }

  } catch (error) {
    throw wrapError(error, 'UTIL-FS-007', { path: targetPath });
  }
  
  return 4 + coreFilesCreated; // Base files + core infrastructure files
}

/**
 * Interactive project setup
 */
async function interactiveSetup(targetPath) {
  console.log(chalk.blue('\n🎯 Initialize Claude Project\n'));
  
  const defaultName = path.basename(targetPath);
  
  const answers = await prompts([
    {
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: defaultName,
      validate: name => {
        if (!name) return 'Project name is required';
        if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
          return 'Name must contain only letters, numbers, hyphens, and underscores';
        }
        return true;
      }
    },
    {
      type: 'text',
      name: 'description',
      message: 'Project description:',
      initial: `${defaultName} - A Claude orchestrated project`
    },
    {
      type: 'confirm',
      name: 'includeTaskmaster',
      message: 'Initialize TaskMaster for task management?',
      initial: false
    }
  ]);
  
  if (!answers.projectName) {
    // User cancelled - this is not an error, just exit gracefully
    console.log(chalk.yellow('\nInitialization cancelled.\n'));
    return null; // Signal cancellation to caller
  }
  
  return answers;
}

/**
 * Initialize TaskMaster (optional)
 */
async function initializeTaskMaster(targetPath, verbose = false) {
  try {
    // Check if TaskMaster module is available
    const { initializeFileLifecycle } = await import('../init/file_lifecycle_init.js');
    
    if (verbose) {
      console.log(chalk.dim('\n  Initializing TaskMaster...'));
    }
    
    await initializeFileLifecycle({
      projectRoot: targetPath,
      verbose: false
    });
    
    if (verbose) {
      console.log(chalk.dim('  ✓ TaskMaster initialized'));
    }
    
    return true;
  } catch (error) {
    if (verbose) {
      console.log(chalk.yellow(`  ! TaskMaster initialization skipped: ${error.message}`));
    }
    return false;
  }
}

/**
 * Init command handler
 */
export async function initCommand(options = {}) {
  const handleError = createCommandErrorHandler({
    commandName: 'init',
    verbose: options.verbose !== false,
    exitCode: 1
  });

  try {
    const targetPath = options.path ? path.resolve(options.path) : process.cwd();
    const force = options.force || false;
    const verbose = options.verbose !== false;
    
    if (verbose) {
      console.log(chalk.bold('\n🚀 Claude Project Initialization'));
      console.log('─'.repeat(60));
      console.log(`${chalk.bold('Target directory:')} ${targetPath}`);
      console.log('─'.repeat(60) + '\n');
    }
    
    // Step 1: Validate directory
    if (!force) {
      const validation = await validateDirectory(targetPath);
      if (!validation.valid) {
        console.log(chalk.yellow(`\n⚠️  ${validation.reason}`));
        console.log(chalk.dim(`   Existing: ${validation.existingPath}`));
        
        const answer = await prompts({
          type: 'confirm',
          name: 'proceed',
          message: 'Reinitialize project (existing files will be preserved)?',
          initial: false
        });
        
        if (!answer.proceed) {
          console.log(chalk.yellow('\nInitialization cancelled.\n'));
          return { cancelled: true }; // Signal graceful exit to error handler
        }
      }
    }
    
    // Step 2: Get project configuration
    let config;
    if (options.name && !options.interactive) {
      // Non-interactive mode
      config = {
        projectName: options.name,
        description: options.description || `${options.name} - A Claude orchestrated project`,
        includeTaskmaster: options.taskmaster || false
      };
    } else {
      // Interactive mode
      config = await interactiveSetup(targetPath);
      
      // User cancelled during interactive setup
      if (!config) {
        process.exit(0); // Graceful exit, not an error
      }
    }
    
    // Step 3: Create directory structure
    if (verbose) {
      console.log(chalk.bold('Step 1: Creating Directory Structure'));
    }
    const dirsCreated = await createDirectoryStructure(targetPath, verbose);
    if (verbose && !options.verbose) {
      console.log(chalk.green(`  ✓ Created ${dirsCreated} directories`));
    }
    
    // Step 4: Create configuration files
    if (verbose) {
      console.log('\n' + chalk.bold('Step 2: Creating Configuration Files'));
    }
    const filesCreated = await createConfigurationFiles(targetPath, config, verbose);
    if (verbose && !options.verbose) {
      console.log(chalk.green(`  ✓ Created ${filesCreated} configuration files`));
    }
    
    // Step 5: Initialize TaskMaster (optional)
    if (config.includeTaskmaster) {
      if (verbose) {
        console.log('\n' + chalk.bold('Step 3: Initializing TaskMaster'));
      }
      await initializeTaskMaster(targetPath, verbose);
    }
    
    // Success summary
    console.log('\n' + '─'.repeat(60));
    console.log(chalk.green.bold('✅ Claude Project Initialized Successfully!'));
    console.log('─'.repeat(60));
    console.log(`${chalk.bold('Project:')} ${config.projectName}`);
    console.log(`${chalk.bold('Location:')} ${targetPath}`);
    console.log(`${chalk.bold('Context File:')} CLAUDE.md`);
    console.log('─'.repeat(60));
    
    // Next steps
    console.log(chalk.blue('\n📚 Next Steps:\n'));
    console.log('  1. ' + chalk.cyan('Edit CLAUDE.md') + ' to add project-specific context');
    console.log('  2. ' + chalk.cyan('diet103 validate') + ' to check infrastructure');
    console.log('  3. ' + chalk.cyan('diet103 health') + ' to assess project health');
    if (!config.includeTaskmaster) {
      console.log('  4. ' + chalk.cyan('task-master init') + ' to enable task management (optional)');
    }
    console.log('');
    
    // Success - exit gracefully
    process.exit(0);
    
  } catch (error) {
    // Check if this is a graceful cancellation
    if (error.cancelled) {
      process.exit(0);
    }
    
    // Wrap and handle actual errors
    const wrappedError = error.code ? error : wrapError(error, 'CMD-INIT-001', { 
      path: options.path || process.cwd() 
    });
    
    await handleError(wrappedError);
  }
}

