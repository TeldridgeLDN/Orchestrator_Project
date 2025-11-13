#!/usr/bin/env node

/**
 * Skill Structure Analyzer
 * 
 * Analyzes existing skill structure and identifies gaps relative to
 * the diet103 500-line rule specification.
 * 
 * Usage:
 *   node scripts/analyze-skill-structure.js --skill=SKILL_NAME
 *   node scripts/analyze-skill-structure.js --all
 *   node scripts/analyze-skill-structure.js --all --json > report.json
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Configuration
const SKILLS_DIR = path.join(os.homedir(), '.claude', 'skills');
const MAX_LINES = 500;
const TARGET_SKILL_MD_LINES = 300;

const REQUIRED_RESOURCES = [
  'quick-ref.md',
  'api-reference.md',
  'troubleshooting.md'
];

const OPTIONAL_RESOURCES = [
  'setup-guide.md',
  'examples.md',
  'advanced.md'
];

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
 * Analyze a single skill
 */
async function analyzeSkill(skillName) {
  const skillPath = path.join(SKILLS_DIR, skillName);
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  const resourcesPath = path.join(skillPath, 'resources');
  const metadataPath = path.join(skillPath, 'metadata.json');

  const analysis = {
    skillName,
    skillPath,
    hasMetadata: await fileExists(metadataPath),
    hasSkillMd: await fileExists(skillMdPath),
    skillMdLines: 0,
    exceedsLimit: false,
    hasResources: await fileExists(resourcesPath),
    resourceFiles: [],
    resourceStats: {},
    missingResources: [],
    recommendations: [],
    priority: 'LOW',
    estimatedEffort: '1 hour'
  };

  // Check SKILL.md
  if (analysis.hasSkillMd) {
    analysis.skillMdLines = await countLines(skillMdPath);
    analysis.exceedsLimit = analysis.skillMdLines > MAX_LINES;
    
    if (analysis.exceedsLimit) {
      analysis.priority = 'HIGH';
      analysis.recommendations.push(
        `CRITICAL: SKILL.md exceeds ${MAX_LINES} lines by ${analysis.skillMdLines - MAX_LINES} lines`
      );
      analysis.recommendations.push('Split content into resource files');
      analysis.estimatedEffort = '4 hours';
    } else if (analysis.skillMdLines > TARGET_SKILL_MD_LINES) {
      analysis.priority = 'MEDIUM';
      analysis.recommendations.push(
        `SKILL.md is ${analysis.skillMdLines} lines (target: ${TARGET_SKILL_MD_LINES})`
      );
      analysis.recommendations.push('Consider adding progressive disclosure resources');
      analysis.estimatedEffort = '2 hours';
    }
  } else {
    analysis.priority = 'HIGH';
    analysis.recommendations.push('CRITICAL: Missing SKILL.md - create from template');
    analysis.estimatedEffort = '1 hour';
  }

  // Check resources/
  if (analysis.hasResources) {
    try {
      const files = await fs.readdir(resourcesPath);
      analysis.resourceFiles = files.filter(f => f.endsWith('.md'));
      
      // Analyze each resource file
      for (const file of analysis.resourceFiles) {
        const filePath = path.join(resourcesPath, file);
        const lines = await countLines(filePath);
        analysis.resourceStats[file] = {
          lines,
          exceedsLimit: lines > MAX_LINES
        };
        
        if (lines > MAX_LINES) {
          analysis.recommendations.push(
            `Resource file ${file} exceeds ${MAX_LINES} lines (${lines} lines)`
          );
        }
      }
    } catch (error) {
      analysis.hasResources = false;
    }
  }

  // Check for missing required resources
  if (analysis.hasSkillMd && !analysis.exceedsLimit) {
    for (const resource of REQUIRED_RESOURCES) {
      if (!analysis.resourceFiles.includes(resource)) {
        analysis.missingResources.push(resource);
      }
    }
    
    if (analysis.missingResources.length > 0 && analysis.priority === 'LOW') {
      analysis.priority = 'MEDIUM';
      analysis.recommendations.push(
        `Missing resources: ${analysis.missingResources.join(', ')}`
      );
    }
  }

  // Additional recommendations
  if (!analysis.hasMetadata) {
    analysis.recommendations.push('WARNING: Missing metadata.json');
  }

  if (analysis.recommendations.length === 0) {
    analysis.recommendations.push('✓ Skill structure looks good!');
  }

  return analysis;
}

/**
 * Analyze all skills
 */
async function analyzeAllSkills() {
  try {
    const skills = await fs.readdir(SKILLS_DIR);
    const analyses = [];

    for (const skill of skills) {
      const skillPath = path.join(SKILLS_DIR, skill);
      const stats = await fs.stat(skillPath);
      
      if (stats.isDirectory()) {
        const analysis = await analyzeSkill(skill);
        analyses.push(analysis);
      }
    }

    return analyses;
  } catch (error) {
    console.error('Error reading skills directory:', error.message);
    return [];
  }
}

/**
 * Format analysis for display
 */
function formatAnalysis(analysis) {
  const lines = [];
  
  lines.push(`\n${'='.repeat(70)}`);
  lines.push(`Skill: ${analysis.skillName}`);
  lines.push(`Priority: ${analysis.priority} | Estimated Effort: ${analysis.estimatedEffort}`);
  lines.push(`${'='.repeat(70)}`);
  
  lines.push(`\nStructure:`);
  lines.push(`  - Metadata: ${analysis.hasMetadata ? '✓' : '✗'}`);
  lines.push(`  - SKILL.md: ${analysis.hasSkillMd ? '✓' : '✗'} ${analysis.hasSkillMd ? `(${analysis.skillMdLines} lines)` : ''}`);
  lines.push(`  - Resources: ${analysis.hasResources ? '✓' : '✗'} ${analysis.resourceFiles.length > 0 ? `(${analysis.resourceFiles.length} files)` : ''}`);
  
  if (analysis.resourceFiles.length > 0) {
    lines.push(`\nResource Files:`);
    for (const file of analysis.resourceFiles) {
      const stats = analysis.resourceStats[file];
      const status = stats.exceedsLimit ? '⚠️' : '✓';
      lines.push(`  ${status} ${file} (${stats.lines} lines)`);
    }
  }
  
  if (analysis.missingResources.length > 0) {
    lines.push(`\nMissing Resources:`);
    for (const resource of analysis.missingResources) {
      lines.push(`  ✗ ${resource}`);
    }
  }
  
  lines.push(`\nRecommendations:`);
  for (const rec of analysis.recommendations) {
    lines.push(`  • ${rec}`);
  }
  
  return lines.join('\n');
}

/**
 * Format summary report
 */
function formatSummary(analyses) {
  const high = analyses.filter(a => a.priority === 'HIGH');
  const medium = analyses.filter(a => a.priority === 'MEDIUM');
  const low = analyses.filter(a => a.priority === 'LOW');
  
  const totalEffort = analyses.reduce((sum, a) => {
    const hours = parseInt(a.estimatedEffort);
    return sum + (isNaN(hours) ? 0 : hours);
  }, 0);

  const lines = [];
  lines.push(`\n${'='.repeat(70)}`);
  lines.push(`SUMMARY REPORT`);
  lines.push(`${'='.repeat(70)}`);
  lines.push(`\nTotal Skills Analyzed: ${analyses.length}`);
  lines.push(`  - HIGH Priority: ${high.length} skills`);
  lines.push(`  - MEDIUM Priority: ${medium.length} skills`);
  lines.push(`  - LOW Priority: ${low.length} skills`);
  lines.push(`\nEstimated Total Effort: ${totalEffort} hours`);
  
  if (high.length > 0) {
    lines.push(`\nHIGH Priority Skills (Action Required):`);
    for (const analysis of high) {
      lines.push(`  • ${analysis.skillName} (${analysis.estimatedEffort})`);
    }
  }
  
  if (medium.length > 0) {
    lines.push(`\nMEDIUM Priority Skills (Recommended):`);
    for (const analysis of medium) {
      lines.push(`  • ${analysis.skillName} (${analysis.estimatedEffort})`);
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
Skill Structure Analyzer

Usage:
  node analyze-skill-structure.js --skill=SKILL_NAME    Analyze specific skill
  node analyze-skill-structure.js --all                  Analyze all skills
  node analyze-skill-structure.js --all --json           Output JSON report
  node analyze-skill-structure.js --help                 Show this help

Options:
  --skill=NAME    Name of the skill to analyze
  --all           Analyze all skills
  --json          Output JSON format (use with --all)
  --summary       Show only summary (use with --all)
    `);
    return;
  }

  if (flags.skill) {
    const analysis = await analyzeSkill(flags.skill);
    
    if (flags.json) {
      console.log(JSON.stringify(analysis, null, 2));
    } else {
      console.log(formatAnalysis(analysis));
    }
  } else if (flags.all) {
    const analyses = await analyzeAllSkills();
    
    if (flags.json) {
      console.log(JSON.stringify(analyses, null, 2));
    } else if (flags.summary) {
      console.log(formatSummary(analyses));
    } else {
      for (const analysis of analyses) {
        console.log(formatAnalysis(analysis));
      }
      console.log(formatSummary(analyses));
    }
  } else {
    console.log('Error: Specify --skill=NAME or --all');
    console.log('Run with --help for usage information');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

export { analyzeSkill, analyzeAllSkills, formatAnalysis, formatSummary };

