/**
 * Scenario Create Command
 * 
 * Interactive and template-based scenario creation.
 * 
 * @module commands/scenario/create
 */

import { Command } from 'commander';
import prompts from 'prompts';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import chalk from 'chalk';
import { createScenarioDirectory, getScenariosDir } from '../../utils/scenario-directory.js';
import { 
  createError,
  createCommandErrorHandler,
  wrapError,
  ResourceExistsError
} from '../../utils/errors/index.js';

// Available templates
const TEMPLATES = {
  basic: 'lib/templates/scenario/basic.yaml',
  advanced: 'lib/templates/scenario/advanced.yaml'
};

// Available categories
const CATEGORIES = [
  'business_process',
  'data_pipeline', 
  'automation',
  'integration',
  'other'
];

/**
 * Interactive scenario creation workflow
 * 
 * @returns {Promise<object>} Scenario configuration
 */
async function interactiveCreate() {
  console.log(chalk.blue('\n🎯 Create a New Scenario\n'));
  
  const answers = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'Scenario name (kebab-case):',
      validate: name => {
        if (!name) return 'Name is required';
        if (!/^[a-z0-9-]+$/.test(name)) {
          return 'Name must be lowercase letters, numbers, and hyphens only';
        }
        return true;
      }
    },
    {
      type: 'text',
      name: 'description',
      message: 'Brief description:',
      validate: desc => desc ? true : 'Description is required'
    },
    {
      type: 'select',
      name: 'category',
      message: 'Category:',
      choices: CATEGORIES.map(cat => ({ title: cat, value: cat }))
    },
    {
      type: 'select',
      name: 'template',
      message: 'Template to use:',
      choices: [
        { title: 'Basic - Simple workflow', value: 'basic' },
        { title: 'Advanced - Complex with AI and integrations', value: 'advanced' },
        { title: 'Custom - Start from scratch', value: 'custom' }
      ]
    },
    {
      type: 'select',
      name: 'triggerType',
      message: 'How should this scenario be triggered?',
      choices: [
        { title: 'Manual - Via slash command', value: 'manual' },
        { title: 'Scheduled - Run on a schedule', value: 'scheduled' },
        { title: 'Webhook - HTTP endpoint', value: 'webhook' },
        { title: 'Hybrid - Multiple trigger types', value: 'hybrid' }
      ]
    }
  ]);
  
  if (!answers.name) {
    console.log(chalk.yellow('\nScenario creation cancelled.'));
    process.exit(0);
  }
  
  return answers;
}

/**
 * Load a template file
 * 
 * @param {string} templateName - Template name
 * @returns {Promise<object>} Template content as object
 */
async function loadTemplate(templateName) {
  if (templateName === 'custom') {
    return createEmptyScenario();
  }
  
  const templatePath = TEMPLATES[templateName];
  if (!templatePath) {
    throw createError('CMD-VAL-003', { 
      option: 'template',
      value: templateName 
    });
  }
  
  try {
    const content = await fs.readFile(templatePath, 'utf-8');
    return yaml.load(content);
  } catch (error) {
    throw wrapError(error, 'UTIL-FS-006', { path: templatePath });
  }
}

/**
 * Create an empty scenario structure
 * 
 * @returns {object} Empty scenario template
 */
function createEmptyScenario() {
  return {
    scenario: {
      name: 'new-scenario',
      description: 'Description of scenario',
      category: 'business_process',
      version: '1.0.0',
      trigger: {
        type: 'manual',
        command: '/new-scenario'
      },
      steps: [
        {
          id: 'step_1',
          action: 'First step description',
          type: 'manual'
        }
      ],
      dependencies: {
        mcps: [],
        skills: []
      },
      generates: [
        'global_skill: new_scenario',
        'slash_command: /new-scenario'
      ]
    }
  };
}

/**
 * Customize template with user input
 * 
 * @param {object} template - Template object
 * @param {object} answers - User answers
 * @returns {object} Customized scenario
 */
function customizeTemplate(template, answers) {
  const scenario = template.scenario;
  
  scenario.name = answers.name;
  scenario.description = answers.description;
  scenario.category = answers.category;
  scenario.trigger.type = answers.triggerType;
  scenario.trigger.command = `/${answers.name}`;
  
  // Update generated artifacts
  scenario.generates = [
    `global_skill: ${answers.name.replace(/-/g, '_')}`,
    `slash_command: /${answers.name}`
  ];
  
  return template;
}

/**
 * Save scenario to file
 * 
 * @param {string} name - Scenario name
 * @param {object} scenario - Scenario configuration
 * @returns {Promise<string>} Path to saved file
 */
async function saveScenario(name, scenario) {
  await createScenarioDirectory();
  
  const scenariosDir = getScenariosDir();
  const filePath = path.join(scenariosDir, `${name}.yaml`);
  
  // Check if file already exists
  try {
    await fs.access(filePath);
    throw createError('CMD-SCEN-002', { name });
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw wrapError(err, 'UTIL-FS-006', { path: filePath });
    }
    // File doesn't exist - this is expected, continue
  }
  
  // Write YAML file
  try {
    const yamlContent = yaml.dump(scenario, {
      indent: 2,
      lineWidth: 100,
      noRefs: true
    });
    
    await fs.writeFile(filePath, yamlContent, 'utf-8');
  } catch (error) {
    throw wrapError(error, 'UTIL-FS-007', { path: filePath });
  }
  
  return filePath;
}

/**
 * Handle the scenario create command
 * 
 * @param {object} options - Command options
 * @param {string} options.template - Template name to use
 * @param {string} options.name - Scenario name
 * @param {boolean} options.interactive - Use interactive mode
 */
async function handleCreate(options) {
  const handleError = createCommandErrorHandler({
    commandName: 'scenario-create',
    verbose: options.verbose || false,
    exitCode: 1
  });

  try {
    let answers;
    
    // Non-interactive mode with options
    if (options.interactive === false && options.name && options.template) {
      answers = {
        name: options.name,
        description: `${options.name} scenario`,
        category: 'business_process',
        template: options.template,
        triggerType: 'manual'
      };
    } 
    // Interactive mode
    else {
      answers = await interactiveCreate();
    }
    
    // Load template
    console.log(chalk.gray(`\nLoading ${answers.template} template...`));
    const template = await loadTemplate(answers.template);
    
    // Customize template
    const scenario = customizeTemplate(template, answers);
    
    // Save scenario
    console.log(chalk.gray(`Saving scenario to ~/.claude/scenarios/...`));
    const filePath = await saveScenario(answers.name, scenario);
    
    // Success message
    console.log(chalk.green('\n✅ Scenario created successfully!\n'));
    console.log(chalk.bold('📄 File:'), filePath);
    console.log(chalk.bold('📝 Name:'), answers.name);
    console.log(chalk.bold('📋 Category:'), answers.category);
    console.log(chalk.bold('🎯 Trigger:'), `/${answers.name}`);
    
    console.log(chalk.blue('\n📚 Next steps:'));
    console.log(`  1. Edit the scenario: ${chalk.cyan(`diet103 scenario edit ${answers.name}`)}`);
    console.log(`  2. Validate it: ${chalk.cyan(`diet103 scenario validate ${answers.name}`)}`);
    console.log(`  3. Deploy it: ${chalk.cyan(`diet103 scenario deploy ${answers.name}`)}`);
    
  } catch (error) {
    await handleError(error);
  }
}

/**
 * Create the 'scenario create' command
 * 
 * @returns {Command} Configured Commander.js command
 */
export function createCommand() {
  return new Command('create')
    .description('Create a new scenario interactively or from a template')
    .option('-t, --template <name>', 'Template to use (basic, advanced, custom)')
    .option('-n, --name <name>', 'Scenario name')
    .option('--no-interactive', 'Disable interactive prompts')
    .addHelpText('after', `
Examples:
  $ diet103 scenario create                           # Interactive mode
  $ diet103 scenario create --template basic          # Create from basic template
  $ diet103 scenario create --name my-app --template advanced
    `)
    .action(handleCreate);
}

