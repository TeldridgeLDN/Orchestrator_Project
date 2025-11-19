/**
 * Interactive Guide Command
 * 
 * Provides step-by-step tutorials for common diet103 workflows.
 * Part of Phase 3 Feature 4: Enhanced Help & Documentation
 * 
 * @version 1.3.0
 */

import inquirer from 'inquirer';
import chalk from 'chalk';

// Guide topics with their content
const topics = {
  validation: {
    title: 'Project Validation',
    description: 'Learn how to validate and repair your diet103 project structure',
    steps: [
      {
        title: 'Basic Validation',
        description: 'Check if your project follows diet103 standards',
        command: 'diet103 validate',
        explanation: 'This validates your project structure and reports any issues found.'
      },
      {
        title: 'Auto-Repair',
        description: 'Automatically fix missing components',
        command: 'diet103 validate --repair',
        explanation: 'Adds missing directories and files to make your project compliant.'
      },
      {
        title: 'Verbose Output',
        description: 'See detailed validation information',
        command: 'diet103 validate --verbose',
        explanation: 'Shows detailed information about what\'s being checked and found.'
      },
      {
        title: 'Set Threshold',
        description: 'Require minimum quality score',
        command: 'diet103 validate --threshold 80',
        explanation: 'Fails validation if project score is below 80/100.'
      }
    ]
  },
  health: {
    title: 'Project Health Monitoring',
    description: 'Monitor and maintain your project\'s health metrics',
    steps: [
      {
        title: 'Check Health',
        description: 'Get a comprehensive health score',
        command: 'diet103 health',
        explanation: 'Calculates overall project health based on structure, hooks, and files.'
      },
      {
        title: 'Update Metadata',
        description: 'Save health score to project metadata',
        command: 'diet103 health --update',
        explanation: 'Stores health metrics in .claude/metadata.json for tracking over time.'
      },
      {
        title: 'Detailed Health',
        description: 'See component-level breakdown',
        command: 'diet103 health --verbose',
        explanation: 'Shows scores for each component: structure, hooks, skills, and files.'
      },
      {
        title: 'JSON Output',
        description: 'Get machine-readable health data',
        command: 'diet103 health --json',
        explanation: 'Outputs health metrics in JSON format for programmatic use.'
      }
    ]
  },
  skills: {
    title: 'Skill Management',
    description: 'Import, manage, and share skills across projects',
    steps: [
      {
        title: 'List Available Skills',
        description: 'See what skills are available globally',
        command: 'diet103 skill list',
        explanation: 'Shows skills available in your global ~/.claude/skills/ directory.'
      },
      {
        title: 'Import a Skill',
        description: 'Add a skill to your current project',
        command: 'diet103 skill import skill-name',
        explanation: 'Copies a skill from global directory to your project\'s .claude/skills/.'
      },
      {
        title: 'Import with Override',
        description: 'Replace existing skill version',
        command: 'diet103 skill import skill-name --override',
        explanation: 'Forces import even if the skill already exists in your project.'
      },
      {
        title: 'Check Skill Status',
        description: 'View imported skills and their versions',
        command: 'diet103 skill status',
        explanation: 'Shows which skills are imported, locked, or overridden.'
      },
      {
        title: 'Lock Skill Version',
        description: 'Prevent skill from being updated',
        command: 'diet103 skill lock skill-name',
        explanation: 'Locks the skill version to prevent accidental updates.'
      }
    ]
  },
  files: {
    title: 'File Lifecycle Management',
    description: 'Organize and manage files using the Universal File Classification (UFC) system',
    steps: [
      {
        title: 'Classify Files',
        description: 'Analyze and tag files by importance',
        command: 'diet103 file-lifecycle classify',
        explanation: 'Scans files and assigns CRITICAL, PERMANENT, or EPHEMERAL tiers.'
      },
      {
        title: 'Preview Classification',
        description: 'See what would be classified without changes',
        command: 'diet103 file-lifecycle classify --dry-run',
        explanation: 'Shows classification results without modifying .file-manifest.json.'
      },
      {
        title: 'Organize Files',
        description: 'Move files into UFC-compliant directories',
        command: 'diet103 file-lifecycle organize',
        explanation: 'Restructures directories based on file classifications.'
      },
      {
        title: 'Archive Old Files',
        description: 'Move expired ephemeral files to archive',
        command: 'diet103 file-lifecycle archive',
        explanation: 'Moves files past their expiration date to Docs/archive/.'
      },
      {
        title: 'Cleanup Archives',
        description: 'Delete archived files past retention',
        command: 'diet103 file-lifecycle cleanup',
        explanation: 'Permanently deletes archived files older than retention period.'
      },
      {
        title: 'View Statistics',
        description: 'See file lifecycle metrics',
        command: 'diet103 file-lifecycle stats',
        explanation: 'Shows distribution of files across tiers and archival stats.'
      }
    ]
  },
  scenarios: {
    title: 'Scenario Testing',
    description: 'Create and manage test scenarios for your project',
    steps: [
      {
        title: 'List Scenarios',
        description: 'View all available test scenarios',
        command: 'diet103 scenario list',
        explanation: 'Shows scenarios defined in your project with their status.'
      },
      {
        title: 'Create Scenario',
        description: 'Create a new test scenario',
        command: 'diet103 scenario create',
        explanation: 'Interactive wizard to create a new scenario definition.'
      },
      {
        title: 'Show Scenario Details',
        description: 'View a specific scenario',
        command: 'diet103 scenario show scenario-name',
        explanation: 'Displays full details of a scenario including steps and decisions.'
      },
      {
        title: 'Validate Scenario',
        description: 'Check scenario definition for errors',
        command: 'diet103 scenario validate scenario-name',
        explanation: 'Validates scenario structure and decision logic.'
      },
      {
        title: 'Deploy Scenario',
        description: 'Set scenario as active for testing',
        command: 'diet103 scenario deploy scenario-name',
        explanation: 'Activates the scenario for AI agents to execute.'
      }
    ]
  },
  projects: {
    title: 'Project Management',
    description: 'Register and manage multiple Claude-enabled projects',
    steps: [
      {
        title: 'Register Project',
        description: 'Add current project to diet103 registry',
        command: 'diet103 project register',
        explanation: 'Registers project and performs initial validation.'
      },
      {
        title: 'List Projects',
        description: 'See all registered projects',
        command: 'diet103 project list',
        explanation: 'Shows all projects in the diet103 registry with their status.'
      },
      {
        title: 'Show Current Project',
        description: 'Display active project information',
        command: 'diet103 project current',
        explanation: 'Shows details about the currently active project.'
      },
      {
        title: 'Scan for Projects',
        description: 'Auto-discover projects in a directory',
        command: 'diet103 project scan ~/Projects',
        explanation: 'Finds all diet103-compatible projects in the specified directory.'
      },
      {
        title: 'Bulk Register',
        description: 'Register multiple projects interactively',
        command: 'diet103 project bulk-register ~/Projects',
        explanation: 'Interactive UI to select and register multiple discovered projects.'
      },
      {
        title: 'Validate Project Identity',
        description: 'Check project name consistency',
        command: 'diet103 project validate',
        explanation: 'Ensures project name is consistent across all files and config.'
      }
    ]
  }
};

/**
 * Display available topics
 */
function listTopics() {
  console.log(chalk.bold('\n📚 Available Guide Topics:\n'));
  
  Object.entries(topics).forEach(([key, topic]) => {
    console.log(chalk.cyan(`  ${key.padEnd(12)}`), chalk.dim('→'), topic.title);
    console.log(chalk.dim(`  ${' '.repeat(15)} ${topic.description}\n`));
  });
  
  console.log(chalk.dim('Usage: diet103 guide --topic <name>'));
  console.log(chalk.dim('   or: diet103 guide (for interactive selection)\n'));
}

/**
 * Display a tutorial for a specific topic
 */
async function showTutorial(topicKey, options = {}) {
  const topic = topics[topicKey];
  
  if (!topic) {
    console.error(chalk.red(`\n❌ Unknown topic: ${topicKey}`));
    console.log(chalk.dim('Run \'diet103 guide --list\' to see available topics.\n'));
    return;
  }
  
  // Display topic header
  console.log(chalk.bold.cyan(`\n${'='.repeat(60)}`));
  console.log(chalk.bold.cyan(`  ${topic.title}`));
  console.log(chalk.bold.cyan(`${'='.repeat(60)}\n`));
  console.log(chalk.dim(topic.description) + '\n');
  
  // Interactive step-by-step mode
  for (let i = 0; i < topic.steps.length; i++) {
    const step = topic.steps[i];
    
    console.log(chalk.bold(`${i + 1}. ${step.title}`));
    console.log(chalk.dim(`   ${step.description}\n`));
    console.log(chalk.green(`   $ ${step.command}\n`));
    console.log(`   ${step.explanation}\n`);
    
    // Ask if user wants to continue (except for last step)
    if (i < topic.steps.length - 1) {
      const { continue: shouldContinue } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continue',
          message: 'Continue to next step?',
          default: true
        }
      ]);
      
      if (!shouldContinue) {
        console.log(chalk.dim('\n💡 You can resume this tutorial anytime with:'));
        console.log(chalk.dim(`   diet103 guide --topic ${topicKey}\n`));
        return;
      }
      
      console.log(''); // Add spacing
    }
  }
  
  // Tutorial complete
  console.log(chalk.bold.green('✅ Tutorial complete!\n'));
  
  // Suggest related topics
  const relatedTopics = Object.keys(topics).filter(k => k !== topicKey).slice(0, 3);
  if (relatedTopics.length > 0) {
    console.log(chalk.dim('💡 You might also be interested in:'));
    relatedTopics.forEach(key => {
      console.log(chalk.dim(`   • ${key}: ${topics[key].title}`));
    });
    console.log('');
  }
}

/**
 * Interactive topic selection
 */
async function selectTopic() {
  const { topic } = await inquirer.prompt([
    {
      type: 'list',
      name: 'topic',
      message: 'What would you like to learn about?',
      choices: Object.entries(topics).map(([key, topic]) => ({
        name: `${topic.title} - ${chalk.dim(topic.description)}`,
        value: key,
        short: topic.title
      })),
      pageSize: 10
    }
  ]);
  
  return topic;
}

/**
 * Main guide command handler
 */
export async function guideCommand(options) {
  try {
    // List topics if requested
    if (options.list) {
      listTopics();
      return;
    }
    
    // Jump to specific topic if provided
    if (options.topic) {
      await showTutorial(options.topic, options);
      return;
    }
    
    // Interactive mode: let user select topic
    console.log(chalk.bold.cyan('\n🎓 diet103 Interactive Guide\n'));
    console.log(chalk.dim('Learn common workflows step-by-step.\n'));
    
    const selectedTopic = await selectTopic();
    await showTutorial(selectedTopic, options);
    
  } catch (error) {
    if (error.message.includes('User force closed')) {
      console.log(chalk.dim('\n\n👋 Guide cancelled. Run \'diet103 guide\' anytime to continue learning.\n'));
      return;
    }
    
    console.error(chalk.red('\n❌ Error running guide:'), error.message);
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

