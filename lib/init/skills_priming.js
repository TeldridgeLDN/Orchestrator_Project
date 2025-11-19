#!/usr/bin/env node

/**
 * Skills Priming System
 * 
 * Intelligently activates and configures skills based on:
 * - Project type detection (web app, CLI tool, data pipeline, etc.)
 * - Existing file structure analysis
 * - User preferences
 * - Diet103/PAI/Orchestrator principles
 * 
 * Philosophy:
 * - Progressive disclosure: Only activate what's needed
 * - Context-aware: Different skills for different project types
 * - User control: Always allow customization
 * - Zero friction: Works automatically but never intrusive
 * 
 * @module init/skills_priming
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

/**
 * Skill recommendations per project type
 * 
 * Each project type gets a curated set of skills that provide
 * the most value for that specific development context.
 */
const SKILL_RECOMMENDATIONS = {
  'web-app': {
    essential: ['doc-generator', 'test-runner'],
    recommended: ['link-checker', 'doc-validator'],
    optional: ['example-validator']
  },
  'cli-tool': {
    essential: ['shell-integration', 'doc-generator'],
    recommended: ['test-runner', 'rule-management'],
    optional: ['scenario_manager']
  },
  'data-pipeline': {
    essential: ['scenario_manager', 'doc-generator'],
    recommended: ['test-runner'],
    optional: ['pe-compression-analysis']
  },
  'api-service': {
    essential: ['test-runner', 'doc-generator'],
    recommended: ['doc-validator', 'example-validator'],
    optional: ['link-checker']
  },
  'library': {
    essential: ['doc-generator', 'test-runner'],
    recommended: ['example-validator', 'doc-validator'],
    optional: ['link-checker']
  },
  'general': {
    essential: ['doc-generator'],
    recommended: ['scenario_manager', 'test-runner'],
    optional: ['rule-management', 'shell-integration']
  }
};

/**
 * Project type indicators
 * 
 * File/directory patterns that strongly indicate a project type.
 * Ordered by specificity (most specific first).
 */
const PROJECT_TYPE_INDICATORS = {
  'web-app': [
    { patterns: ['package.json', 'src/', 'public/', 'index.html'], weight: 3 },
    { patterns: ['vite.config.js', 'webpack.config.js'], weight: 2 },
    { patterns: ['tsconfig.json', 'src/components/'], weight: 2 },
    { patterns: ['next.config.js', 'app/', 'pages/'], weight: 3 },
    { patterns: ['svelte.config.js', 'src/routes/'], weight: 3 }
  ],
  'cli-tool': [
    { patterns: ['bin/', 'lib/', 'package.json'], weight: 3 },
    { patterns: ['bin/', 'index.js', 'package.json'], weight: 2 },
    { patterns: ['#!/usr/bin/env'], weight: 1, type: 'content' }
  ],
  'data-pipeline': [
    { patterns: ['*.ipynb', 'requirements.txt', 'data/'], weight: 3 },
    { patterns: ['scripts/', 'data/', 'notebooks/'], weight: 2 },
    { patterns: ['airflow', 'dags/', 'pipelines/'], weight: 3 }
  ],
  'api-service': [
    { patterns: ['routes/', 'controllers/', 'models/'], weight: 3 },
    { patterns: ['api/', 'server.js', 'app.js'], weight: 2 },
    { patterns: ['express', 'fastify', 'koa'], weight: 1, type: 'content' }
  ],
  'library': [
    { patterns: ['lib/', 'src/', 'tests/', 'package.json'], weight: 2 },
    { patterns: ['index.js', 'src/index.ts'], weight: 1 },
    { patterns: ['dist/', 'build/', 'lib/'], weight: 1 }
  ]
};

/**
 * Detect project type from file structure
 * 
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<string>} Detected project type
 */
async function detectProjectType(projectRoot) {
  const scores = {};
  
  // Initialize scores
  for (const type of Object.keys(PROJECT_TYPE_INDICATORS)) {
    scores[type] = 0;
  }
  
  // Check each project type's indicators
  for (const [type, indicators] of Object.entries(PROJECT_TYPE_INDICATORS)) {
    for (const indicator of indicators) {
      let matches = 0;
      
      for (const pattern of indicator.patterns) {
        const fullPath = path.join(projectRoot, pattern);
        
        try {
          await fs.access(fullPath);
          matches++;
        } catch (error) {
          // Pattern not found, continue
        }
      }
      
      // If all patterns match, add the weight
      if (matches === indicator.patterns.length) {
        scores[type] += indicator.weight;
      }
    }
  }
  
  // Find highest scoring type
  let maxScore = 0;
  let detectedType = 'general';
  
  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedType = type;
    }
  }
  
  return detectedType;
}

/**
 * Get recommended skills for a project type
 * 
 * @param {string} projectType - Project type
 * @param {string} level - Recommendation level ('essential', 'recommended', 'all')
 * @returns {string[]} List of recommended skill IDs
 */
function getRecommendedSkills(projectType, level = 'recommended') {
  const recommendations = SKILL_RECOMMENDATIONS[projectType] || SKILL_RECOMMENDATIONS['general'];
  
  switch (level) {
    case 'essential':
      return recommendations.essential;
    case 'recommended':
      return [...recommendations.essential, ...recommendations.recommended];
    case 'all':
      return [...recommendations.essential, ...recommendations.recommended, ...recommendations.optional];
    default:
      return [...recommendations.essential, ...recommendations.recommended];
  }
}

/**
 * Get all available skills from the project
 * 
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<Object[]>} List of available skills with metadata
 */
async function getAvailableSkills(projectRoot) {
  const skillsDir = path.join(projectRoot, '.claude/skills');
  
  try {
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    const skills = [];
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillId = entry.name;
        const skillPath = path.join(skillsDir, skillId);
        
        // Try to read skill metadata
        let metadata = { id: skillId, name: formatSkillName(skillId) };
        
        // Check for skill.json
        try {
          const jsonPath = path.join(skillPath, 'skill.json');
          const jsonContent = await fs.readFile(jsonPath, 'utf-8');
          const skillData = JSON.parse(jsonContent);
          metadata = { ...metadata, ...skillData };
        } catch (error) {
          // No skill.json, try skill.md
        }
        
        // Check for SKILL.md or skill.md
        try {
          let mdPath = path.join(skillPath, 'SKILL.md');
          try {
            await fs.access(mdPath);
          } catch {
            mdPath = path.join(skillPath, 'skill.md');
          }
          
          const mdContent = await fs.readFile(mdPath, 'utf-8');
          
          // Extract title and description from markdown
          const titleMatch = mdContent.match(/^#\s+(.+)$/m);
          if (titleMatch) {
            metadata.name = titleMatch[1].replace(/\s+Skill$/, '');
          }
          
          const descMatch = mdContent.match(/\*\*Purpose:?\*\*\s+(.+?)(?:\n|$)/i) ||
                           mdContent.match(/##\s+Purpose\s+(.+?)(?:\n|$)/i) ||
                           mdContent.match(/##\s+Overview\s+(.+?)(?:\n|$)/i);
          if (descMatch) {
            metadata.description = descMatch[1].trim();
          }
        } catch (error) {
          // No skill.md either
        }
        
        skills.push(metadata);
      }
    }
    
    return skills;
  } catch (error) {
    return [];
  }
}

/**
 * Format skill ID into human-readable name
 * 
 * @param {string} skillId - Skill identifier
 * @returns {string} Formatted name
 */
function formatSkillName(skillId) {
  return skillId
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Activate skills in skill-rules.json
 * 
 * @param {string} projectRoot - Project root directory
 * @param {string[]} skillIds - Skills to activate
 * @returns {Promise<void>}
 */
async function activateSkills(projectRoot, skillIds) {
  const rulesPath = path.join(projectRoot, '.claude/skill-rules.json');
  
  try {
    const content = await fs.readFile(rulesPath, 'utf-8');
    const rules = JSON.parse(content);
    
    // Update auto_activate for matching skills
    rules.rules = rules.rules.map(rule => {
      if (skillIds.includes(rule.skill)) {
        return { ...rule, auto_activate: true };
      }
      return rule;
    });
    
    await fs.writeFile(rulesPath, JSON.stringify(rules, null, 2), 'utf-8');
  } catch (error) {
    throw new Error(`Failed to update skill-rules.json: ${error.message}`);
  }
}

/**
 * Update metadata.json with primed skills
 * 
 * @param {string} projectRoot - Project root directory
 * @param {string[]} skillIds - Primed skill IDs
 * @returns {Promise<void>}
 */
async function updateMetadataSkills(projectRoot, skillIds) {
  const metadataPath = path.join(projectRoot, '.claude/metadata.json');
  
  try {
    const content = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(content);
    
    // Update skills array
    metadata.skills = skillIds;
    metadata.last_updated = new Date().toISOString();
    
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  } catch (error) {
    throw new Error(`Failed to update metadata.json: ${error.message}`);
  }
}

/**
 * Prime skills for a project
 * 
 * Main entry point for the skill priming system.
 * 
 * @param {Object} options - Priming options
 * @param {string} options.projectRoot - Project root directory
 * @param {string} [options.projectType='auto-detect'] - Project type or 'auto-detect'
 * @param {string[]} [options.skills=[]] - Specific skills to prime (overrides recommendations)
 * @param {string} [options.level='recommended'] - Recommendation level
 * @param {boolean} [options.verbose=false] - Show detailed output
 * @returns {Promise<Object>} Priming result
 */
export async function primeSkillsForProject(options) {
  const {
    projectRoot,
    projectType = 'auto-detect',
    skills = [],
    level = 'recommended',
    verbose = false
  } = options;
  
  try {
    // Step 1: Detect or use provided project type
    const detectedType = projectType === 'auto-detect'
      ? await detectProjectType(projectRoot)
      : projectType;
    
    if (verbose) {
      console.log(chalk.dim(`  Detected project type: ${chalk.cyan(detectedType)}`));
    }
    
    // Step 2: Determine skills to activate
    let skillsToActivate = [];
    
    if (skills.length > 0) {
      // User provided specific skills
      skillsToActivate = skills;
      if (verbose) {
        console.log(chalk.dim(`  Using user-selected skills`));
      }
    } else {
      // Use recommendations based on project type
      skillsToActivate = getRecommendedSkills(detectedType, level);
      if (verbose) {
        console.log(chalk.dim(`  Using ${level} skill recommendations`));
      }
    }
    
    // Step 3: Get available skills to validate
    const availableSkills = await getAvailableSkills(projectRoot);
    const availableSkillIds = availableSkills.map(s => s.id);
    
    // Filter to only available skills
    const validSkills = skillsToActivate.filter(skillId => 
      availableSkillIds.includes(skillId)
    );
    
    const unavailableSkills = skillsToActivate.filter(skillId => 
      !availableSkillIds.includes(skillId)
    );
    
    if (verbose && unavailableSkills.length > 0) {
      console.log(chalk.yellow(`  ⚠️  Skipping unavailable skills: ${unavailableSkills.join(', ')}`));
    }
    
    if (validSkills.length === 0) {
      return {
        success: true,
        primedSkills: [],
        projectType: detectedType,
        warning: 'No valid skills to activate'
      };
    }
    
    // Step 4: Activate skills in skill-rules.json
    await activateSkills(projectRoot, validSkills);
    
    if (verbose) {
      validSkills.forEach(skillId => {
        const skill = availableSkills.find(s => s.id === skillId);
        console.log(chalk.green(`  ✓ Activated ${chalk.cyan(skill?.name || skillId)}`));
      });
    }
    
    // Step 5: Update metadata.json
    await updateMetadataSkills(projectRoot, validSkills);
    
    if (verbose) {
      console.log(chalk.dim(`  ✓ Updated project metadata`));
    }
    
    return {
      success: true,
      primedSkills: validSkills,
      projectType: detectedType,
      skippedSkills: unavailableSkills
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      projectType: projectType === 'auto-detect' ? 'unknown' : projectType
    };
  }
}

/**
 * Get skill choices for interactive selection
 * 
 * @param {string} projectRoot - Project root directory
 * @param {string} projectType - Detected project type
 * @returns {Promise<Object[]>} Prompts choices array
 */
export async function getSkillChoices(projectRoot, projectType) {
  const availableSkills = await getAvailableSkills(projectRoot);
  const recommendations = SKILL_RECOMMENDATIONS[projectType] || SKILL_RECOMMENDATIONS['general'];
  
  // Create emoji mapping
  const emojiMap = {
    'doc-generator': '📚',
    'test-runner': '🧪',
    'link-checker': '🔗',
    'scenario_manager': '📦',
    'shell-integration': '🐚',
    'rule-management': '📋',
    'doc-validator': '✅',
    'example-validator': '🔍',
    'pe-compression-analysis': '📊'
  };
  
  return availableSkills.map(skill => {
    const isEssential = recommendations.essential?.includes(skill.id);
    const isRecommended = recommendations.recommended?.includes(skill.id);
    const emoji = emojiMap[skill.id] || '⚙️';
    
    let title = `${emoji} ${skill.name}`;
    if (isEssential) {
      title += chalk.green(' (Essential)');
    } else if (isRecommended) {
      title += chalk.blue(' (Recommended)');
    }
    
    return {
      title,
      value: skill.id,
      selected: isEssential || isRecommended,
      description: skill.description
    };
  });
}

export {
  detectProjectType,
  getRecommendedSkills,
  getAvailableSkills,
  SKILL_RECOMMENDATIONS,
  PROJECT_TYPE_INDICATORS
};

