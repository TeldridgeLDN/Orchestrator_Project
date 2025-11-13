/**
 * Skill Suggestions Hook
 * 
 * Proactively suggests relevant skills based on user context:
 * - Open files and file patterns
 * - Keywords in the user's prompt
 * - Current directory patterns
 * - Project type
 * 
 * Implements throttling to prevent suggestion fatigue and only loads
 * skill metadata (not full skill content) for efficiency.
 * 
 * @module hooks/skillSuggestions
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { minimatch } from 'minimatch';
import { readConfig } from '../utils/config.js';

// Configuration
const CONFIG = {
  enabled: true,
  throttleMinutes: 5,
  maxSuggestions: 2,
  minMatchScore: 1 // Minimum number of matches required to suggest
};

// In-memory throttling cache
const suggestionTimestamps = new Map();

// Metadata cache
let metadataCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Check if a skill can be suggested (not recently suggested)
 * 
 * @param {string} skillId - Skill identifier
 * @returns {boolean} True if skill can be suggested
 */
function canSuggest(skillId) {
  const now = Date.now();
  const lastSuggested = suggestionTimestamps.get(skillId) || 0;
  const throttleMs = CONFIG.throttleMinutes * 60 * 1000;
  
  return (now - lastSuggested) > throttleMs;
}

/**
 * Mark a skill as recently suggested
 * 
 * @param {string} skillId - Skill identifier
 */
function markSkillSuggested(skillId) {
  suggestionTimestamps.set(skillId, Date.now());
}

/**
 * Load skill metadata from a directory
 * 
 * @param {string} skillsDir - Path to skills directory
 * @returns {Promise<Array>} Array of skill metadata objects
 */
async function loadSkillMetadataFromDir(skillsDir) {
  const metadata = [];
  
  try {
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const metadataPath = path.join(skillsDir, entry.name, 'metadata.json');
      
      try {
        const data = await fs.readFile(metadataPath, 'utf-8');
        const skillMeta = JSON.parse(data);
        
        metadata.push({
          id: entry.name,
          name: skillMeta.name || entry.name,
          one_liner: skillMeta.one_liner || skillMeta.description?.substring(0, 100) || '',
          file_patterns: skillMeta.file_patterns || [],
          keywords: skillMeta.keywords || [],
          directory_patterns: skillMeta.directory_patterns || [],
          project_types: skillMeta.project_types || [],
          auto_activate: skillMeta.auto_activate || false
        });
      } catch (error) {
        // Skip skills without valid metadata
        console.debug(`Skipping skill ${entry.name}: ${error.message}`);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
    console.debug(`Cannot read skills directory ${skillsDir}: ${error.message}`);
  }
  
  return metadata;
}

/**
 * Load all skill metadata (with caching)
 * 
 * @returns {Promise<Array>} Array of skill metadata objects
 */
async function loadSkillMetadata() {
  const now = Date.now();
  
  // Return cached data if still fresh
  if (metadataCache && (now - cacheTimestamp) < CACHE_TTL) {
    return metadataCache;
  }
  
  const allMetadata = [];
  
  // Load global skills
  const globalSkillsPath = path.join(os.homedir(), '.claude', 'skills');
  const globalSkills = await loadSkillMetadataFromDir(globalSkillsPath);
  allMetadata.push(...globalSkills);
  
  // Load project skills if active project exists
  try {
    const config = await readConfig();
    if (config.active_project) {
      const project = config.projects[config.active_project];
      if (project && project.path) {
        const projectSkillsPath = path.join(project.path, '.claude', 'skills');
        const projectSkills = await loadSkillMetadataFromDir(projectSkillsPath);
        allMetadata.push(...projectSkills);
      }
    }
  } catch (error) {
    console.debug(`Cannot load project skills: ${error.message}`);
  }
  
  // Update cache
  metadataCache = allMetadata;
  cacheTimestamp = now;
  
  return allMetadata;
}

/**
 * Get currently active skills
 * 
 * @returns {Promise<Set>} Set of active skill IDs
 */
async function getActiveSkills() {
  // TODO: Implement proper active skills tracking
  // For now, return empty set
  return new Set();
}

/**
 * Get open files from context
 * 
 * @param {Object} context - Hook context
 * @returns {Array<string>} Array of open file paths
 */
function getOpenFiles(context) {
  // Extract from context if available
  if (context.openFiles && Array.isArray(context.openFiles)) {
    return context.openFiles;
  }
  
  // Fallback to empty array
  return [];
}

/**
 * Get current working directory
 * 
 * @returns {string} Current working directory
 */
function getCurrentDirectory() {
  return process.cwd();
}

/**
 * Get project type from config
 * 
 * @returns {Promise<string|null>} Project type or null
 */
async function getProjectType() {
  try {
    const config = await readConfig();
    if (config.active_project) {
      const project = config.projects[config.active_project];
      return project?.type || null;
    }
  } catch (error) {
    console.debug(`Cannot determine project type: ${error.message}`);
  }
  
  return null;
}

/**
 * Calculate match score for a skill
 * 
 * @param {Object} skill - Skill metadata
 * @param {Object} matchData - Match data object
 * @returns {number} Match score (higher = better match)
 */
function calculateMatchScore(skill, matchData) {
  let score = 0;
  
  if (matchData.fileMatch) score += 3;
  if (matchData.keywordMatch) score += 2;
  if (matchData.dirMatch) score += 2;
  if (matchData.projectMatch) score += 1;
  
  return score;
}

/**
 * Suggest relevant skills based on context
 * 
 * @param {string} prompt - User's prompt text
 * @param {Object} context - Hook context
 * @returns {Promise<Array>} Array of suggestion objects
 */
async function suggestSkills(prompt, context) {
  const suggestions = [];
  
  // Get context information
  const openFiles = getOpenFiles(context);
  const currentDir = getCurrentDirectory();
  const projectType = await getProjectType();
  const activeSkills = await getActiveSkills();
  const availableSkills = await loadSkillMetadata();
  
  // Analyze each skill for relevance
  for (const skill of availableSkills) {
    // Skip already active skills
    if (activeSkills.has(skill.id)) continue;
    
    // Skip if auto-activate is enabled (handled elsewhere)
    if (skill.auto_activate) continue;
    
    // Skip if recently suggested
    if (!canSuggest(skill.id)) continue;
    
    // Calculate matches
    const matchData = {
      fileMatch: false,
      keywordMatch: false,
      dirMatch: false,
      projectMatch: false
    };
    
    // File pattern matching
    if (skill.file_patterns && skill.file_patterns.length > 0) {
      matchData.fileMatch = openFiles.some(file => 
        skill.file_patterns.some(pattern => minimatch(file, pattern))
      );
    }
    
    // Keyword matching (case-insensitive)
    if (skill.keywords && skill.keywords.length > 0) {
      const lowerPrompt = prompt.toLowerCase();
      matchData.keywordMatch = skill.keywords.some(keyword =>
        lowerPrompt.includes(keyword.toLowerCase())
      );
    }
    
    // Directory pattern matching
    if (skill.directory_patterns && skill.directory_patterns.length > 0) {
      matchData.dirMatch = skill.directory_patterns.some(pattern =>
        minimatch(currentDir, pattern)
      );
    }
    
    // Project type matching
    if (skill.project_types && skill.project_types.length > 0 && projectType) {
      matchData.projectMatch = skill.project_types.includes(projectType);
    }
    
    // Calculate match score
    const score = calculateMatchScore(skill, matchData);
    
    // If score meets threshold, add to suggestions
    if (score >= CONFIG.minMatchScore) {
      suggestions.push({
        id: skill.id,
        name: skill.name,
        description: skill.one_liner,
        score,
        matchData
      });
      
      // Mark as suggested
      markSkillSuggested(skill.id);
    }
  }
  
  // Sort by score (highest first) and limit to max suggestions
  suggestions.sort((a, b) => b.score - a.score);
  return suggestions.slice(0, CONFIG.maxSuggestions);
}

/**
 * Format suggestions for display
 * 
 * @param {Array} suggestions - Array of suggestion objects
 * @returns {string} Formatted suggestions text
 */
function formatSuggestions(suggestions) {
  if (suggestions.length === 0) {
    return '';
  }
  
  const lines = suggestions.map(s => 
    `💡 ${s.name} skill available - ${s.description}`
  );
  
  return '\n' + lines.join('\n') + '\n';
}

/**
 * Skill Suggestions Hook Handler
 * 
 * @param {Object} context - Hook context
 * @param {string} context.prompt - User's prompt text
 * @param {Function} next - Next middleware function
 * @returns {Promise<void>}
 */
export async function skillSuggestionsHook(context, next) {
  try {
    // Check if suggestions are enabled
    if (!CONFIG.enabled) {
      await next();
      return;
    }
    
    // Check if we have a prompt
    if (!context.prompt || typeof context.prompt !== 'string') {
      await next();
      return;
    }
    
    // Get suggestions
    const suggestions = await suggestSkills(context.prompt, context);
    
    // Display suggestions if any
    if (suggestions.length > 0) {
      const formatted = formatSuggestions(suggestions);
      console.log(formatted);
      
      // Add suggestions to context for potential UI integration
      context.skillSuggestions = suggestions;
    }
    
    // Continue to next hook
    await next();
    
  } catch (error) {
    // Log error but don't block execution
    console.error('Skill suggestions hook error:', error.message);
    await next();
  }
}

/**
 * Clear the suggestion throttling cache
 * Useful when switching projects or contexts
 * 
 * @returns {void}
 */
export function clearSuggestionCache() {
  suggestionTimestamps.clear();
  metadataCache = null;
  cacheTimestamp = 0;
}

/**
 * Update configuration
 * 
 * @param {Object} newConfig - New configuration options
 * @returns {void}
 */
export function updateConfig(newConfig) {
  Object.assign(CONFIG, newConfig);
}

/**
 * Get current configuration
 * 
 * @returns {Object} Current configuration
 */
export function getConfig() {
  return { ...CONFIG };
}

/**
 * Export for testing
 */
export const __testing__ = {
  CONFIG,
  suggestionTimestamps,
  canSuggest,
  markSkillSuggested,
  calculateMatchScore,
  suggestSkills,
  formatSuggestions
};

export default skillSuggestionsHook;

