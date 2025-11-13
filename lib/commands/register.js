/**
 * diet103 Register Command
 * 
 * Registers a project with automatic diet103 infrastructure validation.
 * Ensures projects meet minimum infrastructure requirements before registration.
 * 
 * @module commands/register
 * @version 1.0.0
 */

import path from 'path';
import { promises as fs } from 'fs';
import chalk from 'chalk';
import {
  detectDiet103Infrastructure,
  analyzeDiet103Gaps,
  validateDiet103Consistency
} from '../utils/diet103-validator.js';
import { repairDiet103Infrastructure } from '../utils/diet103-repair.js';
import { validateMcpConfig, autoFixMcpConfig } from '../utils/mcp-validator.js';
import { 
  createError, 
  createCommandErrorHandler, 
  wrapError,
  ProjectNotFoundError,
  InsufficientRequirementsError,
  JSONParseError
} from '../utils/errors/index.js';
import { scanForUnregisteredProjects, ProjectScanner } from '../utils/project-scanner.js';

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
 * Validate project infrastructure
 * 
 * @param {string} projectPath - Path to project
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} Validation result
 */
async function validateProjectInfrastructure(projectPath, options = {}) {
  const { repair = true, verbose = false } = options;

  if (verbose) {
    console.log(chalk.dim('Validating diet103 infrastructure...'));
  }

  // Detect infrastructure
  const checks = await detectDiet103Infrastructure(projectPath);
  const gaps = analyzeDiet103Gaps(checks);
  const consistency = await validateDiet103Consistency(projectPath);

  const result = {
    score: gaps.score,
    isComplete: gaps.isComplete,
    checks,
    gaps,
    consistency,
    repaired: false
  };

  // Auto-repair if enabled and needed
  if (repair && gaps.score < 100) {
    if (verbose) {
      console.log(chalk.dim('Auto-repair enabled - fixing infrastructure gaps...'));
    }

    const repairResult = await repairDiet103Infrastructure(projectPath, {
      installImportant: true,
      variables: {
        PROJECT_NAME: path.basename(projectPath)
      }
    });

    result.repaired = true;
    result.repairResult = repairResult;

    // Re-validate after repair
    const afterChecks = await detectDiet103Infrastructure(projectPath);
    const afterGaps = analyzeDiet103Gaps(afterChecks);
    result.score = afterGaps.score;
    result.gaps = afterGaps;
  }

  return result;
}

/**
 * Register project command handler
 * 
 * @param {string} projectPath - Path to project (optional, defaults to cwd)
 * @param {Object} options - Command options
 */
export async function registerCommand(projectPath, options) {
  try {
    // Resolve project path
    const targetPath = projectPath ? path.resolve(projectPath) : process.cwd();
    const projectName = options.name || path.basename(targetPath);
    const displayName = options.displayName || projectName;
    const autoRepair = options.autoRepair !== false; // Default: true
    const threshold = parseInt(options.threshold || '70', 10);
    const verbose = options.verbose || false;
    const metadata = options.metadata ? JSON.parse(options.metadata) : {};

    console.log(chalk.bold('\n🔧 diet103 Project Registration'));
    console.log('─'.repeat(60));
    console.log(`${chalk.bold('Project:')} ${projectName}`);
    console.log(`${chalk.bold('Path:')} ${targetPath}`);
    console.log(`${chalk.bold('Auto-repair:')} ${autoRepair ? 'enabled' : 'disabled'}`);
    console.log(`${chalk.bold('Threshold:')} ${threshold}%`);
    console.log('─'.repeat(60) + '\n');

    // Step 1: Validate infrastructure
    console.log(chalk.bold('Step 1: Validating diet103 Infrastructure'));
    const validation = await validateProjectInfrastructure(targetPath, {
      repair: autoRepair,
      verbose
    });

    // Display validation results
    if (validation.repaired) {
      console.log(chalk.green(`  ✓ Auto-repair completed`));
      console.log(chalk.dim(`    Before: ${validation.repairResult.before.score}%`));
      console.log(chalk.dim(`    After: ${validation.score}%`));
      console.log(chalk.dim(`    Components installed: ${validation.repairResult.totalInstalled}`));
    } else {
      console.log(chalk.green(`  ✓ Infrastructure validated`));
      console.log(chalk.dim(`    Score: ${validation.score}%`));
    }

    // Step 2: Check if score meets threshold
    if (validation.score < threshold) {
      console.log('\n' + chalk.red(`✗ Registration Failed`));
      console.log(chalk.red(`  Infrastructure score (${validation.score}%) is below threshold (${threshold}%)`));
      console.log('\n' + chalk.yellow('Missing components:'));
      
      if (validation.gaps.critical.length > 0) {
        console.log(chalk.red('  Critical:'));
        validation.gaps.critical.forEach(item => {
          console.log(chalk.red(`    ✗ ${item}`));
        });
      }
      
      if (validation.gaps.important.length > 0) {
        console.log(chalk.yellow('  Important:'));
        validation.gaps.important.forEach(item => {
          console.log(chalk.yellow(`    ! ${item}`));
        });
      }

      console.log('\n' + chalk.dim('Suggestions:'));
      console.log(chalk.dim('  1. Run: claude validate --repair'));
      console.log(chalk.dim('  2. Manually install missing components'));
      console.log(chalk.dim('  3. Lower the threshold with --threshold=<value>'));
      console.log('─'.repeat(60) + '\n');

      throw new Error(`Project does not meet diet103 infrastructure requirements (score: ${validation.score}%, required: ${threshold}%)`);
    }

    console.log(chalk.green(`  ✓ Infrastructure meets requirements`));

    // Step 2: Validate MCP Configuration
    console.log('\n' + chalk.bold('Step 2: Validating MCP Configuration'));
    const mcpValidation = validateMcpConfig(targetPath);
    
    if (!mcpValidation.valid) {
      console.log(chalk.yellow(`  ! MCP configuration has issues`));
      
      if (autoRepair) {
        console.log(chalk.dim('    Auto-fixing MCP issues...'));
        const fixResult = autoFixMcpConfig(targetPath, mcpValidation);
        
        if (fixResult.success) {
          console.log(chalk.green(`    ✓ Fixed ${fixResult.fixed} issue(s)`));
          
          // Re-validate
          const newMcpValidation = validateMcpConfig(targetPath);
          if (newMcpValidation.valid) {
            console.log(chalk.green(`  ✓ MCP configuration validated`));
          } else {
            console.log(chalk.yellow(`  ! Some MCP issues remain`));
            console.log(chalk.dim(`    Errors: ${newMcpValidation.errors.length}, Warnings: ${newMcpValidation.warnings.length}`));
          }
        } else {
          console.log(chalk.yellow(`    ! Auto-fix failed: ${fixResult.error}`));
          console.log(chalk.dim(`    Manual fixes may be needed`));
        }
      } else {
        console.log(chalk.dim(`    Errors: ${mcpValidation.errors.length}, Warnings: ${mcpValidation.warnings.length}`));
        console.log(chalk.dim(`    Run 'claude validate-mcp --fix' to auto-fix`));
      }
    } else {
      console.log(chalk.green(`  ✓ MCP configuration validated`));
    }

    // Step 3: Load registry
    console.log('\n' + chalk.bold('Step 3: Updating Project Registry'));
    const registry = await loadRegistry();

    // Check if already registered
    if (registry.projects[targetPath]) {
      console.log(chalk.yellow(`  ! Project already registered - updating entry`));
    }

    // Step 4: Add to registry
    registry.projects[targetPath] = {
      name: projectName,
      displayName: displayName,
      path: targetPath,
      registeredAt: registry.projects[targetPath]?.registeredAt || new Date().toISOString(),
      lastValidated: new Date().toISOString(),
      validationScore: validation.score,
      diet103Version: validation.checks.diet103Version || 'unknown',
      ...metadata // Custom metadata
    };

    await saveRegistry(registry);
    console.log(chalk.green(`  ✓ Registry updated`));

    // Success summary
    console.log('\n' + '─'.repeat(60));
    console.log(chalk.green.bold('✓ Registration Successful!'));
    console.log('─'.repeat(60));
    console.log(`${chalk.bold('Project Name:')} ${projectName}`);
    console.log(`${chalk.bold('Validation Score:')} ${validation.score}%`);
    console.log(`${chalk.bold('Registry:')} ${REGISTRY_FILE}`);
    console.log('─'.repeat(60) + '\n');

    process.exit(0);

  } catch (error) {
    const handleError = createCommandErrorHandler({
      commandName: 'register',
      verbose: options.verbose || false,
      exitCode: 1
    });

    // For insufficient requirements errors, already displayed detailed info
    if (error instanceof InsufficientRequirementsError) {
      process.exit(1);
    }
    
    await handleError(error);
  }
}

/**
 * List registered projects
 * 
 * @param {Object} options - Command options
 */
export async function listRegisteredProjects(options = {}) {
  try {
    const registry = await loadRegistry();
    const projects = Object.values(registry.projects);

    if (projects.length === 0) {
      console.log(chalk.yellow('\nNo projects registered yet.\n'));
      return;
    }

    console.log(chalk.bold('\n📋 Registered Projects'));
    console.log('─'.repeat(60));

    projects.forEach((project, index) => {
      console.log(`\n${index + 1}. ${chalk.bold(project.name)}`);
      console.log(`   Path: ${chalk.dim(project.path)}`);
      console.log(`   Score: ${chalk.green(project.validationScore + '%')}`);
      console.log(`   Version: ${chalk.dim(project.diet103Version)}`);
      console.log(`   Last validated: ${chalk.dim(new Date(project.lastValidated).toLocaleString())}`);
    });

    console.log('\n─'.repeat(60));
    console.log(`Total: ${projects.length} project(s)\n`);

  } catch (error) {
    const handleError = createCommandErrorHandler({
      commandName: 'list-projects',
      verbose: options.verbose || false,
      exitCode: 1
    });
    await handleError(error);
  }
}

/**
 * Batch register projects from a directory
 * 
 * @param {string} scanPath - Path to scan for projects
 * @param {Object} options - Command options
 */
export async function batchRegisterProjects(scanPath, options = {}) {
  try {
    const basePath = path.resolve(scanPath);
    const verbose = options.verbose || false;
    const autoRepair = options.autoRepair !== false;
    const threshold = parseInt(options.threshold || '70', 10);
    
    console.log(chalk.bold('\n🔍 Batch Project Registration'));
    console.log('─'.repeat(60));
    console.log(`${chalk.bold('Scanning:')} ${basePath}`);
    console.log('─'.repeat(60) + '\n');
    
    // Find all directories with .claude folders
    const entries = await fs.readdir(basePath, { withFileTypes: true });
    const projectDirs = [];
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const fullPath = path.join(basePath, entry.name);
      const claudeDir = path.join(fullPath, '.claude');
      
      try {
        await fs.access(claudeDir);
        projectDirs.push({ name: entry.name, path: fullPath });
      } catch (error) {
        // Skip directories without .claude folder
      }
    }
    
    if (projectDirs.length === 0) {
      console.log(chalk.yellow('No Claude projects found in directory.\n'));
      return;
    }
    
    console.log(chalk.green(`Found ${projectDirs.length} project(s):\n`));
    projectDirs.forEach((proj, idx) => {
      console.log(`  ${idx + 1}. ${proj.name}`);
    });
    console.log('');
    
    // Register each project
    const results = {
      successful: [],
      failed: []
    };
    
    for (const project of projectDirs) {
      try {
        console.log(chalk.dim(`\nRegistering ${project.name}...`));
        
        // Call registerCommand for each project
        await registerCommand(project.path, {
          name: project.name,
          autoRepair,
          threshold,
          verbose: false // Suppress verbose output in batch mode
        });
        
        results.successful.push(project.name);
      } catch (error) {
        results.failed.push({ name: project.name, error: error.message });
        console.error(chalk.red(`  ✗ Failed: ${error.message}`));
      }
    }
    
    // Summary
    console.log('\n' + '─'.repeat(60));
    console.log(chalk.bold('Batch Registration Summary'));
    console.log('─'.repeat(60));
    console.log(chalk.green(`Successful: ${results.successful.length}`));
    console.log(chalk.red(`Failed: ${results.failed.length}`));
    
    if (results.failed.length > 0) {
      console.log('\n' + chalk.red('Failed projects:'));
      results.failed.forEach(item => {
        console.log(chalk.red(`  ✗ ${item.name}: ${item.error}`));
      });
    }
    
    console.log('─'.repeat(60) + '\n');
    
  } catch (error) {
    const handleError = createCommandErrorHandler({
      commandName: 'batch-register',
      verbose: options.verbose || false,
      exitCode: 1
    });
    await handleError(error);
  }
}

/**
 * Unregister a project
 * 
 * @param {string} projectPath - Path to project
 * @param {Object} options - Command options
 */
export async function unregisterCommand(projectPath, options = {}) {
  try {
    const targetPath = path.resolve(projectPath);
    const registry = await loadRegistry();

    if (!registry.projects[targetPath]) {
      console.log(chalk.yellow(`\n! Project not found in registry: ${targetPath}\n`));
      process.exit(1);
    }

    const projectName = registry.projects[targetPath].name;
    delete registry.projects[targetPath];
    await saveRegistry(registry);

    console.log(chalk.green(`\n✓ Project unregistered: ${projectName}\n`));
    process.exit(0);

  } catch (error) {
    const handleError = createCommandErrorHandler({
      commandName: 'unregister',
      verbose: options.verbose || false,
      exitCode: 1
    });
    await handleError(error);
  }
}

/**
 * Scan for and optionally auto-register projects
 * 
 * @param {string} scanPath - Path to scan for projects
 * @param {Object} options - Command options
 */
export async function scanProjectsCommand(scanPath, options = {}) {
  try {
    const basePath = path.resolve(scanPath);
    const verbose = options.verbose || false;
    const autoRegister = options.autoRegister || false;
    const maxDepth = parseInt(options.maxDepth || '3', 10);
    const threshold = parseInt(options.threshold || '70', 10);
    const autoRepair = options.autoRepair !== false;
    
    console.log(chalk.bold('\n🔍 Auto-Detect Claude Projects'));
    console.log('─'.repeat(60));
    console.log(`${chalk.bold('Scanning:')} ${basePath}`);
    console.log(`${chalk.bold('Max Depth:')} ${maxDepth}`);
    console.log(`${chalk.bold('Min Score:')} ${threshold}%`);
    console.log('─'.repeat(60) + '\n');
    
    // Create scanner with progress reporting
    const scanner = new ProjectScanner({
      maxDepth,
      validateStructure: true,
      minValidationScore: threshold,
      filterRegistered: true,
      registeredProjects: Object.keys((await loadRegistry()).projects || {})
    });

    // Progress reporting
    let lastProgress = Date.now();
    scanner.on('progress', (data) => {
      // Throttle progress updates to every 500ms
      if (Date.now() - lastProgress > 500) {
        console.log(chalk.dim(`  Scanning... ${data.directoriesScanned} directories checked, ${data.projectsFound} projects found`));
        lastProgress = Date.now();
      }
    });

    scanner.on('project-found', (project) => {
      if (verbose) {
        console.log(chalk.green(`  ✓ Found: ${project.name} (score: ${project.score}%)`));
      }
    });

    scanner.on('project-skipped', (info) => {
      if (verbose) {
        if (info.reason === 'already-registered') {
          console.log(chalk.dim(`  ⊘ Skipped: ${info.path} (already registered)`));
        } else if (info.reason === 'validation-failed') {
          console.log(chalk.yellow(`  ! Skipped: ${path.basename(info.path)} (score: ${info.score}%, required: ${info.minScore}%)`));
        }
      }
    });

    // Start scan
    const startTime = Date.now();
    const projects = await scanner.scan(basePath);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const stats = scanner.getStats();

    // Display results
    console.log('\n' + '─'.repeat(60));
    console.log(chalk.bold('Scan Complete'));
    console.log('─'.repeat(60));
    console.log(`${chalk.bold('Directories scanned:')} ${stats.directoriesScanned}`);
    console.log(`${chalk.bold('Projects found:')} ${projects.length}`);
    console.log(`${chalk.bold('Duration:')} ${duration}s`);
    
    if (stats.errorsEncountered > 0) {
      console.log(chalk.yellow(`${chalk.bold('Errors:')} ${stats.errorsEncountered} (permission denied or inaccessible directories)`));
    }
    
    console.log('─'.repeat(60));

    if (projects.length === 0) {
      console.log(chalk.yellow('\nNo unregistered Claude projects found.\n'));
      return;
    }

    // Display found projects
    console.log(chalk.bold('\n📋 Discovered Projects:\n'));
    projects.forEach((project, idx) => {
      console.log(`  ${idx + 1}. ${chalk.bold(project.name)}`);
      console.log(`     Path: ${chalk.dim(project.path)}`);
      console.log(`     Score: ${chalk.green(project.score + '%')}`);
      if (project.validation?.gaps?.critical?.length > 0) {
        console.log(`     ${chalk.yellow(`Missing: ${project.validation.gaps.critical.length} critical component(s)`)}`);
      }
    });
    console.log('');

    // Auto-register if requested
    if (autoRegister) {
      console.log(chalk.bold('\n🔧 Auto-Registering Projects...\n'));
      
      const results = {
        successful: [],
        failed: []
      };

      for (const project of projects) {
        try {
          console.log(chalk.dim(`Registering ${project.name}...`));
          
          // Register project
          const registry = await loadRegistry();
          
          registry.projects[project.path] = {
            name: project.name,
            displayName: project.name,
            path: project.path,
            registeredAt: new Date().toISOString(),
            lastValidated: new Date().toISOString(),
            validationScore: project.score,
            diet103Version: project.validation?.checks?.diet103Version || 'unknown',
            autoDiscovered: true
          };

          await saveRegistry(registry);
          results.successful.push(project.name);
          console.log(chalk.green(`  ✓ Registered: ${project.name}`));
          
        } catch (error) {
          results.failed.push({ name: project.name, error: error.message });
          console.error(chalk.red(`  ✗ Failed: ${error.message}`));
        }
      }

      // Summary
      console.log('\n' + '─'.repeat(60));
      console.log(chalk.bold('Auto-Registration Summary'));
      console.log('─'.repeat(60));
      console.log(chalk.green(`Successful: ${results.successful.length}`));
      console.log(chalk.red(`Failed: ${results.failed.length}`));
      console.log('─'.repeat(60) + '\n');
    } else {
      console.log(chalk.dim('Tip: Add --auto-register to automatically register these projects\n'));
    }

  } catch (error) {
    const handleError = createCommandErrorHandler({
      commandName: 'scan-projects',
      verbose: options.verbose || false,
      exitCode: 1
    });
    await handleError(error);
  }
}
