#!/usr/bin/env node

/**
 * Skill Structure Validator
 * 
 * Validates skill structure against diet103 500-line rule specification.
 * 
 * Usage:
 *   node scripts/validate-skill-structure.js --skill=SKILL_NAME
 *   node scripts/validate-skill-structure.js --all
 *   node scripts/validate-skill-structure.js --all --strict
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const SKILLS_DIR = path.join(os.homedir(), '.claude', 'skills');
const MAX_LINES = 500;
const TARGET_SKILL_MD_LINES = 300;

/**
 * Validation rules
 */
const RULES = {
  SKILL_MD_EXISTS: {
    severity: 'ERROR',
    message: 'SKILL.md must exist'
  },
  SKILL_MD_MAX_LINES: {
    severity: 'ERROR',
    message: `SKILL.md must not exceed ${MAX_LINES} lines`
  },
  SKILL_MD_TARGET_LINES: {
    severity: 'WARNING',
    message: `SKILL.md should ideally be ≤${TARGET_SKILL_MD_LINES} lines`
  },
  RESOURCE_MAX_LINES: {
    severity: 'ERROR',
    message: `Resource files must not exceed ${MAX_LINES} lines`
  },
  METADATA_EXISTS: {
    severity: 'WARNING',
    message: 'metadata.json should exist'
  },
  RESOURCES_DIR_EXISTS: {
    severity: 'INFO',
    message: 'resources/ directory recommended for progressive disclosure'
  }
};

/**
 * Count lines in a file
 */
async function countLines(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

/**
 * Check if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a single skill
 */
async function validateSkill(skillName, strict = false) {
  const skillPath = path.join(SKILLS_DIR, skillName);
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  const resourcesPath = path.join(skillPath, 'resources');
  const metadataPath = path.join(skillPath, 'metadata.json');

  const validation = {
    skillName,
    valid: true,
    errors: [],
    warnings: [],
    info: []
  };

  // Check SKILL.md exists
  const hasSkillMd = await fileExists(skillMdPath);
  if (!hasSkillMd) {
    validation.valid = false;
    validation.errors.push({
      rule: 'SKILL_MD_EXISTS',
      message: RULES.SKILL_MD_EXISTS.message
    });
  } else {
    // Check SKILL.md line count
    const skillMdLines = await countLines(skillMdPath);
    
    if (skillMdLines > MAX_LINES) {
      validation.valid = false;
      validation.errors.push({
        rule: 'SKILL_MD_MAX_LINES',
        message: `SKILL.md has ${skillMdLines} lines (max: ${MAX_LINES})`
      });
    } else if (skillMdLines > TARGET_SKILL_MD_LINES) {
      if (strict) {
        validation.valid = false;
      }
      validation.warnings.push({
        rule: 'SKILL_MD_TARGET_LINES',
        message: `SKILL.md has ${skillMdLines} lines (target: ${TARGET_SKILL_MD_LINES})`
      });
    }
  }

  // Check metadata.json
  const hasMetadata = await fileExists(metadataPath);
  if (!hasMetadata) {
    if (strict) {
      validation.valid = false;
    }
    validation.warnings.push({
      rule: 'METADATA_EXISTS',
      message: RULES.METADATA_EXISTS.message
    });
  }

  // Check resources/
  const hasResources = await fileExists(resourcesPath);
  if (hasResources) {
    try {
      const files = await fs.readdir(resourcesPath);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      
      for (const file of mdFiles) {
        const filePath = path.join(resourcesPath, file);
        const lines = await countLines(filePath);
        
        if (lines > MAX_LINES) {
          validation.valid = false;
          validation.errors.push({
            rule: 'RESOURCE_MAX_LINES',
            message: `resources/${file} has ${lines} lines (max: ${MAX_LINES})`
          });
        }
      }
    } catch (error) {
      // Ignore
    }
  } else if (hasSkillMd) {
    validation.info.push({
      rule: 'RESOURCES_DIR_EXISTS',
      message: RULES.RESOURCES_DIR_EXISTS.message
    });
  }

  return validation;
}

/**
 * Validate all skills
 */
async function validateAllSkills(strict = false) {
  try {
    const skills = await fs.readdir(SKILLS_DIR);
    const validations = [];

    for (const skill of skills) {
      const skillPath = path.join(SKILLS_DIR, skill);
      const stats = await fs.stat(skillPath);
      
      if (stats.isDirectory()) {
        const validation = await validateSkill(skill, strict);
        validations.push(validation);
      }
    }

    return validations;
  } catch (error) {
    console.error('Error reading skills directory:', error.message);
    return [];
  }
}

/**
 * Format validation result
 */
function formatValidation(validation) {
  const lines = [];
  const status = validation.valid ? '✓ PASS' : '✗ FAIL';
  
  lines.push(`\n${'='.repeat(70)}`);
  lines.push(`${status}: ${validation.skillName}`);
  lines.push(`${'='.repeat(70)}`);
  
  if (validation.errors.length > 0) {
    lines.push(`\n❌ ERRORS (${validation.errors.length}):`);
    for (const error of validation.errors) {
      lines.push(`  • ${error.message}`);
    }
  }
  
  if (validation.warnings.length > 0) {
    lines.push(`\n⚠️  WARNINGS (${validation.warnings.length}):`);
    for (const warning of validation.warnings) {
      lines.push(`  • ${warning.message}`);
    }
  }
  
  if (validation.info.length > 0) {
    lines.push(`\nℹ️  INFO (${validation.info.length}):`);
    for (const info of validation.info) {
      lines.push(`  • ${info.message}`);
    }
  }
  
  if (validation.valid && validation.warnings.length === 0 && validation.info.length === 0) {
    lines.push(`\n✓ Skill structure is fully compliant!`);
  }
  
  return lines.join('\n');
}

/**
 * Format summary
 */
function formatSummary(validations) {
  const passed = validations.filter(v => v.valid);
  const failed = validations.filter(v => !v.valid);
  const totalErrors = validations.reduce((sum, v) => sum + v.errors.length, 0);
  const totalWarnings = validations.reduce((sum, v) => sum + v.warnings.length, 0);

  const lines = [];
  lines.push(`\n${'='.repeat(70)}`);
  lines.push(`VALIDATION SUMMARY`);
  lines.push(`${'='.repeat(70)}`);
  lines.push(`\nTotal Skills: ${validations.length}`);
  lines.push(`  ✓ Passed: ${passed.length}`);
  lines.push(`  ✗ Failed: ${failed.length}`);
  lines.push(`\nTotal Issues:`);
  lines.push(`  ❌ Errors: ${totalErrors}`);
  lines.push(`  ⚠️  Warnings: ${totalWarnings}`);
  
  if (failed.length > 0) {
    lines.push(`\nFailed Skills:`);
    for (const validation of failed) {
      lines.push(`  • ${validation.skillName} (${validation.errors.length} errors)`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const flags = {};
  
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      flags[key] = value || true;
    }
  }

  if (flags.help) {
    console.log(`
Skill Structure Validator

Usage:
  node validate-skill-structure.js --skill=SKILL_NAME    Validate specific skill
  node validate-skill-structure.js --all                  Validate all skills
  node validate-skill-structure.js --all --strict         Strict mode (warnings = errors)
  node validate-skill-structure.js --help                 Show this help

Options:
  --skill=NAME    Name of the skill to validate
  --all           Validate all skills
  --strict        Treat warnings as errors
  --json          Output JSON format
  --summary       Show only summary (use with --all)

Exit Codes:
  0 - All validations passed
  1 - One or more validations failed
    `);
    return;
  }

  const strict = flags.strict === true;
  let exitCode = 0;

  if (flags.skill) {
    const validation = await validateSkill(flags.skill, strict);
    
    if (flags.json) {
      console.log(JSON.stringify(validation, null, 2));
    } else {
      console.log(formatValidation(validation));
    }
    
    if (!validation.valid) {
      exitCode = 1;
    }
  } else if (flags.all) {
    const validations = await validateAllSkills(strict);
    
    if (flags.json) {
      console.log(JSON.stringify(validations, null, 2));
    } else if (flags.summary) {
      console.log(formatSummary(validations));
    } else {
      for (const validation of validations) {
        console.log(formatValidation(validation));
      }
      console.log(formatSummary(validations));
    }
    
    const failed = validations.filter(v => !v.valid);
    if (failed.length > 0) {
      exitCode = 1;
    }
  } else {
    console.log('Error: Specify --skill=NAME or --all');
    console.log('Run with --help for usage information');
    process.exit(1);
  }

  process.exit(exitCode);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

export { validateSkill, validateAllSkills, formatValidation, formatSummary };

