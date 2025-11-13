#!/usr/bin/env node

/**
 * Scenario Command Group
 * 
 * Main entry point for all scenario-related CLI commands.
 * Provides a command group with subcommands for scenario lifecycle management.
 * 
 * @module commands/scenario
 */

import { Command } from 'commander';
import { createCommand } from './create.js';
import { listCommand } from './list.js';
import { showCommand } from './show.js';
import { editCommand } from './edit.js';
import { deployCommand } from './deploy.js';
import { validateCommand } from './validate.js';
import { removeCommand } from './remove.js';
import { optimizeCommand } from './optimize.js';
import { exploreCommand } from './explore.js';
import { scaffoldCommand } from './scaffold.js';
import { decisionsCommand } from './decisions.js';
import { improvementsCommand } from './improvements.js';

/**
 * Create the scenario command group with all subcommands
 * 
 * @returns {Command} Configured Commander.js command
 */
export function scenarioCommand() {
  const scenario = new Command('scenario')
    .description('Manage scenario lifecycle: create, deploy, validate, and optimize scenarios')
    .addHelpText('after', `
Examples:
  $ diet103 scenario create                    # Interactive scenario creation
  $ diet103 scenario create --template basic   # Create from template
  $ diet103 scenario list                      # List all scenarios
  $ diet103 scenario show my-scenario          # Show scenario details
  $ diet103 scenario validate my-scenario      # Validate scenario configuration
  $ diet103 scenario deploy my-scenario        # Deploy scenario
  $ diet103 scenario optimize my-scenario      # Get optimization suggestions
  $ diet103 scenario explore my-scenario       # Explore alternatives
  
Workflows:
  Complete workflow guides available in:
  - Docs/workflows/library/scenario-creation/create_scenario.md
  - Docs/workflows/library/scenario-creation/analyze_scenario.md
  
  Or view online documentation:
  - docs/SCENARIO_CLI.md - Complete CLI reference
  - docs/SCENARIO_QUICK_REFERENCE.md - Quick reference guide
  
For more information on a specific command:
  $ diet103 scenario <command> --help
    `);

  // Add all subcommands
  scenario.addCommand(createCommand());
  scenario.addCommand(listCommand());
  scenario.addCommand(showCommand());
  scenario.addCommand(editCommand());
  scenario.addCommand(validateCommand());
  scenario.addCommand(scaffoldCommand());
  scenario.addCommand(deployCommand());
  scenario.addCommand(optimizeCommand());
  scenario.addCommand(exploreCommand());
  scenario.addCommand(removeCommand());
  scenario.addCommand(decisionsCommand());
  scenario.addCommand(improvementsCommand());

  return scenario;
}

