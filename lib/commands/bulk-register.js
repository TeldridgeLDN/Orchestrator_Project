/**
 * diet103 Bulk Registration Command
 * 
 * Interactive bulk registration of multiple discovered projects with selection UI.
 * 
 * @module commands/bulk-register
 * @version 1.0.0
 */

import path from 'path';
import { promises as fs } from 'fs';
import chalk from 'chalk';
import inquirer from 'inquirer';
import {
  detectDiet103Infrastructure,
  analyzeDiet103Gaps
} from '../utils/diet103-validator.js';
import { repairDiet103Infrastructure } from '../utils/diet103-repair.js';
import { ProjectScanner } from '../utils/project-scanner.js';
import { 
  createError, 
  createCommandErrorHandler, 
  wrapError 
} from '../utils/errors/index.js';

/**
 * Project registry file path
 */
const REGISTRY_FILE = path.join(process.env.HOME || '/tmp', '.claude', 'projects-registry.json');

/**
 * Load existing project registry
 * 
 * @returns {Promise<Object>} Registry data
 */
async function loadRegistry() {
  try {
    const content = await fs.readFile(REGISTRY_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // Return empty registry if file doesn't exist
    if (error.code === 'ENOENT') {
      return {
        version: '1.0.0',
        projects: {},
        lastUpdated: new Date().toISOString()
      };
    }
    if (error instanceof SyntaxError) {
      throw wrapError(error, 'UTIL-DATA-001', { path: REGISTRY_FILE });
    }
    throw wrapError(error, 'UTIL-FS-006', { path: REGISTRY_FILE });
  }
}

/**
 * Save project registry
 * 
 * @param {Object} registry - Registry data
 */
async function saveRegistry(registry) {
  try {
    const registryDir = path.dirname(REGISTRY_FILE);
    
    // Ensure directory exists
    await fs.mkdir(registryDir, { recursive: true });
    
    registry.lastUpdated = new Date().toISOString();
    await fs.writeFile(REGISTRY_FILE, JSON.stringify(registry, null, 2), 'utf-8');
  } catch (error) {
    if (error.code === 'EACCES') {
      throw wrapError(error, 'UTIL-FS-002', { path: REGISTRY_FILE });
    }
    throw wrapError(error, 'UTIL-FS-007', { path: REGISTRY_FILE });
  }
}

/**
 * Validate and optionally repair a single project
 * 
 * @param {Object} project - Project information
 * @param {boolean} autoRepair - Whether to auto-repair
 * @returns {Promise<Object>} Validation result
 */
async function validateProject(project, autoRepair = true) {
  const checks = await detectDiet103Infrastructure(project.path);
  const gaps = analyzeDiet103Gaps(checks);
  
  const result = {
    path: project.path,
    name: project.name,
    score: gaps.score,
    isComplete: gaps.isComplete,
    checks,
    gaps,
    repaired: false
  };
  
  // Auto-repair if enabled and needed
  if (autoRepair && gaps.score < 100) {
    try {
      const repairResult = await repairDiet103Infrastructure(project.path, {
        installImportant: true,
        variables: {
          PROJECT_NAME: project.name
        }
      });
      
      result.repaired = true;
      result.repairResult = repairResult;
      
      // Re-validate after repair
      const afterChecks = await detectDiet103Infrastructure(project.path);
      const afterGaps = analyzeDiet103Gaps(afterChecks);
      result.score = afterGaps.score;
      result.gaps = afterGaps;
    } catch (error) {
      // Repair failed, continue with original score
      result.repairError = error.message;
    }
  }
  
  return result;
}

/**
 * Register a single project to the registry
 * 
 * @param {Object} project - Project information
 * @param {Object} validation - Validation result
 * @param {Object} registry - Registry object
 */
function registerProjectToRegistry(project, validation, registry) {
  registry.projects[project.path] = {
    name: project.name,
    displayName: project.name,
    path: project.path,
    registeredAt: new Date().toISOString(),
    lastValidated: new Date().toISOString(),
    validationScore: validation.score,
    diet103Version: validation.checks.diet103Version || 'unknown',
    bulkRegistered: true
  };
}

/**
 * Display project selection UI
 * 
 * @param {Array} projects - List of discovered projects
 * @returns {Promise<Array>} Selected projects
 */
async function selectProjectsUI(projects) {
  if (projects.length === 0) {
    return [];
  }
  
  // Format choices for inquirer
  const choices = projects.map((project, idx) => ({
    name: `${chalk.bold(project.name)} ${chalk.dim(`(${project.path})`)} ${chalk.green(`- Score: ${project.score}%`)}`,
    value: project,
    checked: project.score >= 70 // Auto-select projects with good scores
  }));
  
  // Add select all/deselect all options
  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedProjects',
      message: 'Select projects to register:',
      choices: [
        new inquirer.Separator('─'.repeat(80)),
        {
          name: chalk.cyan('[ Select All ]'),
          value: '__SELECT_ALL__',
          checked: false
        },
        {
          name: chalk.cyan('[ Deselect All ]'),
          value: '__DESELECT_ALL__',
          checked: false
        },
        new inquirer.Separator('─'.repeat(80)),
        ...choices,
        new inquirer.Separator('─'.repeat(80))
      ],
      pageSize: 15,
      loop: false,
      validate: (input) => {
        // Filter out special options
        const realProjects = input.filter(
          val => val !== '__SELECT_ALL__' && val !== '__DESELECT_ALL__'
        );
        
        if (realProjects.length === 0) {
          return 'Please select at least one project to register';
        }
        return true;
      }
    }
  ]);
  
  // Handle select all/deselect all
  let selectedProjects = answers.selectedProjects;
  
  // If select all was chosen, return all projects
  if (selectedProjects.includes('__SELECT_ALL__')) {
    return projects;
  }
  
  // If deselect all was chosen, return empty array (but validation will prevent this)
  if (selectedProjects.includes('__DESELECT_ALL__')) {
    return [];
  }
  
  // Filter out special options
  selectedProjects = selectedProjects.filter(
    val => val !== '__SELECT_ALL__' && val !== '__DESELECT_ALL__'
  );
  
  return selectedProjects;
}

/**
 * Display registration confirmation
 * 
 * @param {Array} projects - Selected projects
 * @returns {Promise<boolean>} Confirmed
 */
async function confirmRegistration(projects) {
  console.log(chalk.bold('\n📋 Registration Summary:'));
  console.log('─'.repeat(80));
  console.log(`${chalk.bold('Projects to register:')} ${projects.length}`);
  
  projects.forEach((project, idx) => {
    console.log(`  ${idx + 1}. ${chalk.bold(project.name)} ${chalk.dim(`(score: ${project.score}%)`)}`);
  });
  
  console.log('─'.repeat(80));
  
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Proceed with registration?',
      default: true
    }
  ]);
  
  return answers.confirmed;
}

/**
 * Bulk register projects command with interactive UI
 * 
 * @param {string} scanPath - Path to scan for projects
 * @param {Object} options - Command options
 */
export async function bulkRegisterCommand(scanPath, options = {}) {
  try {
    const basePath = path.resolve(scanPath);
    const verbose = options.verbose || false;
    const autoRepair = options.autoRepair !== false;
    const threshold = parseInt(options.threshold || '70', 10);
    const maxDepth = parseInt(options.maxDepth || '3', 10);
    const nonInteractive = options.nonInteractive || false;
    
    console.log(chalk.bold('\n🔍 Bulk Project Registration'));
    console.log('─'.repeat(80));
    console.log(`${chalk.bold('Scanning:')} ${basePath}`);
    console.log(`${chalk.bold('Max Depth:')} ${maxDepth}`);
    console.log(`${chalk.bold('Min Score:')} ${threshold}%`);
    console.log(`${chalk.bold('Auto-repair:')} ${autoRepair ? 'enabled' : 'disabled'}`);
    console.log('─'.repeat(80) + '\n');
    
    // Step 1: Scan for unregistered projects
    console.log(chalk.bold('Step 1: Discovering Projects'));
    
    const registry = await loadRegistry();
    const scanner = new ProjectScanner({
      maxDepth,
      validateStructure: true,
      minValidationScore: 0, // Get all projects, filter later
      filterRegistered: true,
      registeredProjects: Object.keys(registry.projects || {})
    });
    
    // Progress reporting
    let lastProgress = Date.now();
    scanner.on('progress', (data) => {
      if (Date.now() - lastProgress > 500) {
        process.stdout.write(`\r${chalk.dim(`  Scanning... ${data.directoriesScanned} directories checked, ${data.projectsFound} projects found`)}`);
        lastProgress = Date.now();
      }
    });
    
    const startTime = Date.now();
    const discoveredProjects = await scanner.scan(basePath);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const stats = scanner.getStats();
    
    // Clear progress line
    process.stdout.write('\r' + ' '.repeat(80) + '\r');
    
    console.log(chalk.green(`  ✓ Scan complete: ${discoveredProjects.length} unregistered project(s) found in ${duration}s`));
    
    if (stats.errorsEncountered > 0) {
      console.log(chalk.yellow(`  ! Encountered ${stats.errorsEncountered} error(s) during scan (permission denied or inaccessible)`));
    }
    
    if (discoveredProjects.length === 0) {
      console.log(chalk.yellow('\nNo unregistered projects found.\n'));
      return;
    }
    
    // Step 2: Display and select projects (unless non-interactive)
    let selectedProjects;
    
    if (nonInteractive) {
      // In non-interactive mode, select all projects above threshold
      selectedProjects = discoveredProjects.filter(p => p.score >= threshold);
      console.log(chalk.dim(`\n  Non-interactive mode: Auto-selected ${selectedProjects.length} project(s) with score >= ${threshold}%\n`));
    } else {
      console.log('\n' + chalk.bold('Step 2: Select Projects'));
      
      // Display all discovered projects
      console.log(chalk.dim('\nDiscovered projects:\n'));
      discoveredProjects.forEach((project, idx) => {
        const scoreColor = project.score >= 80 ? chalk.green : project.score >= 60 ? chalk.yellow : chalk.red;
        console.log(`  ${idx + 1}. ${chalk.bold(project.name)}`);
        console.log(`     ${chalk.dim('Path:')} ${project.path}`);
        console.log(`     ${chalk.dim('Score:')} ${scoreColor(project.score + '%')}`);
        
        if (project.validation?.gaps?.critical?.length > 0) {
          console.log(`     ${chalk.yellow(`Missing: ${project.validation.gaps.critical.length} critical component(s)`)}`);
        }
      });
      
      console.log('');
      
      // Interactive selection
      selectedProjects = await selectProjectsUI(discoveredProjects);
      
      if (selectedProjects.length === 0) {
        console.log(chalk.yellow('\nNo projects selected. Exiting.\n'));
        return;
      }
      
      // Confirmation
      const confirmed = await confirmRegistration(selectedProjects);
      
      if (!confirmed) {
        console.log(chalk.yellow('\nRegistration cancelled.\n'));
        return;
      }
    }
    
    // Step 3: Batch registration process
    console.log('\n' + chalk.bold('Step 3: Registering Projects') + '\n');
    
    const results = {
      successful: [],
      failed: []
    };
    
    const total = selectedProjects.length;
    
    for (let i = 0; i < selectedProjects.length; i++) {
      const project = selectedProjects[i];
      const num = i + 1;
      
      try {
        // Progress indicator
        console.log(chalk.dim(`[${num}/${total}] Processing ${chalk.bold(project.name)}...`));
        
        // Validate and optionally repair
        const validation = await validateProject(project, autoRepair);
        
        if (verbose) {
          if (validation.repaired) {
            console.log(chalk.green(`  ✓ Auto-repair completed (${validation.score}%)`));
          } else {
            console.log(chalk.dim(`  • Validation score: ${validation.score}%`));
          }
        }
        
        // Check if meets threshold
        if (validation.score < threshold) {
          throw new Error(`Validation score (${validation.score}%) below threshold (${threshold}%)`);
        }
        
        // Register to registry
        registerProjectToRegistry(project, validation, registry);
        
        results.successful.push({
          name: project.name,
          path: project.path,
          score: validation.score,
          repaired: validation.repaired
        });
        
        console.log(chalk.green(`  ✓ Registered successfully`));
        
      } catch (error) {
        results.failed.push({
          name: project.name,
          path: project.path,
          error: error.message
        });
        
        console.log(chalk.red(`  ✗ Failed: ${error.message}`));
      }
      
      console.log('');
    }
    
    // Save registry once after all registrations
    if (results.successful.length > 0) {
      await saveRegistry(registry);
    }
    
    // Step 4: Display summary report
    console.log('─'.repeat(80));
    console.log(chalk.bold('Registration Complete'));
    console.log('─'.repeat(80));
    console.log(chalk.green(`✓ Successful: ${results.successful.length}`));
    console.log(chalk.red(`✗ Failed: ${results.failed.length}`));
    console.log('─'.repeat(80));
    
    // Successful projects
    if (results.successful.length > 0) {
      console.log('\n' + chalk.green.bold('Successfully Registered:'));
      results.successful.forEach((item, idx) => {
        const repairedLabel = item.repaired ? chalk.dim(' [repaired]') : '';
        console.log(chalk.green(`  ${idx + 1}. ${item.name} (${item.score}%)${repairedLabel}`));
        if (verbose) {
          console.log(chalk.dim(`     ${item.path}`));
        }
      });
    }
    
    // Failed projects
    if (results.failed.length > 0) {
      console.log('\n' + chalk.red.bold('Failed to Register:'));
      results.failed.forEach((item, idx) => {
        console.log(chalk.red(`  ${idx + 1}. ${item.name}`));
        console.log(chalk.dim(`     ${item.path}`));
        console.log(chalk.dim(`     Error: ${item.error}`));
      });
      
      console.log('\n' + chalk.dim('Suggestions:'));
      console.log(chalk.dim('  • Run individual projects through: diet103 project register <path>'));
      console.log(chalk.dim('  • Check project structure and fix critical components'));
      console.log(chalk.dim('  • Lower the threshold with --threshold=<value>'));
    }
    
    console.log('\n' + '─'.repeat(80));
    console.log(`${chalk.bold('Registry:')} ${REGISTRY_FILE}`);
    console.log('─'.repeat(80) + '\n');
    
  } catch (error) {
    const handleError = createCommandErrorHandler({
      commandName: 'bulk-register',
      verbose: options.verbose || false,
      exitCode: 1
    });
    await handleError(error);
  }
}

