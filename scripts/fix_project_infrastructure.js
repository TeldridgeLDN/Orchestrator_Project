#!/usr/bin/env node
/**
 * Fix Project Infrastructure
 * 
 * Applies missing standard infrastructure to an existing project.
 * Useful for projects created before infrastructure was standardized.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { installStandardInfrastructure } from '../lib/init/standard_infrastructure.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const args = process.argv.slice(2);
  const projectPath = args[0] || process.cwd();
  const projectName = args[1] || path.basename(projectPath);
  
  console.log(chalk.bold.blue('\n🔧 Fixing Project Infrastructure\n'));
  console.log(chalk.dim(`Project: ${projectName}`));
  console.log(chalk.dim(`Path: ${projectPath}`));
  console.log('');
  
  try {
    const result = await installStandardInfrastructure(projectPath, projectName, {
      verbose: true,
      skipIfExists: true,
      includeOptional: false
    });
    
    console.log('');
    console.log(chalk.bold('📊 Results:'));
    console.log('');
    
    if (result.installed.length > 0) {
      console.log(chalk.green('✅ Installed:'));
      result.installed.forEach(item => {
        console.log(chalk.green(`  ✓ ${item}`));
      });
      console.log('');
    }
    
    if (result.skipped.length > 0) {
      console.log(chalk.yellow('⏭️  Skipped (already exist):'));
      result.skipped.forEach(item => {
        console.log(chalk.yellow(`  - ${item}`));
      });
      console.log('');
    }
    
    if (result.warnings.length > 0) {
      console.log(chalk.yellow('⚠️  Warnings:'));
      result.warnings.forEach(warning => {
        console.log(chalk.yellow(`  ! ${warning}`));
      });
      console.log('');
    }
    
    if (result.errors.length > 0) {
      console.log(chalk.red('❌ Errors:'));
      result.errors.forEach(error => {
        console.log(chalk.red(`  ✗ ${error}`));
      });
      console.log('');
    }
    
    if (result.success) {
      console.log(chalk.green.bold('✅ Infrastructure fix complete!\n'));
      process.exit(0);
    } else {
      console.log(chalk.red.bold('❌ Infrastructure fix completed with errors.\n'));
      process.exit(1);
    }
    
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Error:'), error.message);
    if (error.stack) {
      console.error(chalk.dim(error.stack));
    }
    process.exit(1);
  }
}

main();








