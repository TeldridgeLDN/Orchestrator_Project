                                                                                                                                                                                  /**
 * diet103 Infrastructure Validation System
 * 
 * Provides comprehensive validation for diet103 project infrastructure,
 * including detection, gap analysis, and consistency checks.
 * 
 * @module diet103-validator
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Detect diet103 infrastructure components in a project
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Object>} Detection results with boolean flags for each component
 */
export async function detectDiet103Infrastructure(projectPath) {
  const checks = {
    hasDotClaude: false,
    hasClaudeMd: false,
    hasMetadata: false,
    hasSkillRules: false,
    hasHooks: false,
    hasUserPromptSubmit: false,
    hasPostToolUse: false,
    hasSkillsDir: false,
    hasCommandsDir: false,
    hasAgentsDir: false,
    hasResourcesDir: false,
    hasReadme: false,
    diet103Version: null,
    // Architecture documentation checks
    hasArchitectureMd: false,
    hasProjectClaudeMd: false,
    hasTemplatesDir: false
  };

  const claudeDir = path.join(projectPath, '.claude');

  // Check .claude/ directory exists
  if (fs.existsSync(claudeDir)) {
    checks.hasDotClaude = true;

    // Check critical files
    checks.hasClaudeMd = fs.existsSync(path.join(claudeDir, 'Claude.md'));
    checks.hasMetadata = fs.existsSync(path.join(claudeDir, 'metadata.json'));
    checks.hasSkillRules = fs.existsSync(path.join(claudeDir, 'skill-rules.json'));
    checks.hasReadme = fs.existsSync(path.join(claudeDir, 'README.md'));

    // Check hooks
    const hooksDir = path.join(claudeDir, 'hooks');
    checks.hasHooks = fs.existsSync(hooksDir);
    checks.hasUserPromptSubmit = fs.existsSync(path.join(hooksDir, 'UserPromptSubmit.js'));
    checks.hasPostToolUse = fs.existsSync(path.join(hooksDir, 'PostToolUse.js'));

    // Check directories
    checks.hasSkillsDir = fs.existsSync(path.join(claudeDir, 'skills'));
    checks.hasCommandsDir = fs.existsSync(path.join(claudeDir, 'commands'));
    checks.hasAgentsDir = fs.existsSync(path.join(claudeDir, 'agents'));
    checks.hasResourcesDir = fs.existsSync(path.join(claudeDir, 'resources'));

    // Check diet103 version
    if (checks.hasMetadata) {
      try {
        const metadataPath = path.join(claudeDir, 'metadata.json');
        const metadata = JSON.parse(await fs.promises.readFile(metadataPath, 'utf8'));
        checks.diet103Version = metadata.diet103_version || null;
      } catch (err) {
        // Invalid JSON, will be caught in consistency check
        checks.diet103Version = null;
      }
    }

    // Check templates directory
    checks.hasTemplatesDir = fs.existsSync(path.join(claudeDir, 'templates'));
  }

  // Check for architecture documentation (can be at root or in .claude/)
  checks.hasArchitectureMd = 
    fs.existsSync(path.join(projectPath, 'architecture.md')) ||
    fs.existsSync(path.join(projectPath, '.claude', 'architecture.md')) ||
    fs.existsSync(path.join(projectPath, 'ARCHITECTURE.md'));

  // Check for project-level CLAUDE.md (distinct from .claude/Claude.md)
  checks.hasProjectClaudeMd = 
    fs.existsSync(path.join(projectPath, 'CLAUDE.md')) ||
    fs.existsSync(path.join(projectPath, 'claude.md'));

  return checks;
}

/**
 * Analyze gaps in diet103 infrastructure
 * 
 * @param {Object} checks - Detection results from detectDiet103Infrastructure
 * @returns {Object} Gap analysis with critical/important/optional gaps and score
 */
export function analyzeDiet103Gaps(checks) {
  const gaps = {
    critical: [],
    important: [],
    optional: [],
    score: 0,
    isComplete: false
  };

  // Critical gaps (must be fixed) - 7 components
  if (!checks.hasDotClaude) gaps.critical.push('.claude/ directory missing');
  if (!checks.hasClaudeMd) gaps.critical.push('Claude.md missing');
  if (!checks.hasMetadata) gaps.critical.push('metadata.json missing');
  if (!checks.hasSkillRules) gaps.critical.push('skill-rules.json missing');
  if (!checks.hasHooks) gaps.critical.push('hooks/ directory missing');
  if (!checks.hasUserPromptSubmit) gaps.critical.push('hooks/UserPromptSubmit.js missing');
  if (!checks.hasPostToolUse) gaps.critical.push('hooks/PostToolUse.js missing');

  // Important gaps (should be fixed) - 7 components
  if (!checks.hasSkillsDir) gaps.important.push('skills/ directory missing');
  if (!checks.hasCommandsDir) gaps.important.push('commands/ directory missing');
  if (!checks.hasAgentsDir) gaps.important.push('agents/ directory missing');
  if (!checks.hasResourcesDir) gaps.important.push('resources/ directory missing');
  if (!checks.hasReadme) gaps.important.push('README.md missing');
  
  // Architecture documentation gaps (optional but recommended)
  if (!checks.hasArchitectureMd) gaps.optional.push('architecture.md missing (recommended for AI-assisted development)');
  if (!checks.hasProjectClaudeMd) gaps.optional.push('CLAUDE.md missing (recommended for development guidelines)');

  // Calculate completeness score (weighted: 70% critical, 30% important)
  const criticalCount = 7;
  const importantCount = 5;
  const optionalCount = 2; // Architecture docs

  const criticalMet = criticalCount - gaps.critical.length;
  const importantMet = importantCount - gaps.important.length;
  const optionalMet = optionalCount - gaps.optional.length;

  // Base score: 70% critical, 30% important
  gaps.score = Math.round(
    ((criticalMet / criticalCount) * 0.7 + (importantMet / importantCount) * 0.3) * 100
  );

  // Bonus score for architecture documentation (up to 5 extra points)
  const archDocsBonus = Math.round((optionalMet / optionalCount) * 5);
  gaps.scoreWithBonus = Math.min(100, gaps.score + archDocsBonus);

  // Track architecture documentation status
  gaps.hasArchitectureDocs = optionalMet === optionalCount;
  gaps.archDocsBonus = archDocsBonus;

  gaps.isComplete = gaps.critical.length === 0 && gaps.important.length === 0;
  gaps.isFullyComplete = gaps.isComplete && gaps.optional.length === 0;

  return gaps;
}

/**
 * Validate metadata.json structure and content
 * 
 * Checks for:
 * - Required fields: project_id, version, description, skills, created, diet103_version
 * - Correct data types
 * - diet103_version is exactly '1.2.0'
 * - skills array contains only strings
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Object>} Validation result with valid flag, errors, and warnings
 */
export async function validateMetadataJson(projectPath) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };

  const metadataPath = path.join(projectPath, '.claude', 'metadata.json');

  // Check if file exists
  if (!fs.existsSync(metadataPath)) {
    result.valid = false;
    result.errors.push('metadata.json does not exist');
    return result;
  }

  // Parse JSON
  let metadata;
  try {
    const content = await fs.promises.readFile(metadataPath, 'utf8');
    metadata = JSON.parse(content);
  } catch (err) {
    result.valid = false;
    result.errors.push(`metadata.json parse error: ${err.message}`);
    return result;
  }

  // Validate required fields
  const requiredFields = {
    project_id: 'string',
    version: 'string',
    description: 'string',
    skills: 'array',
    created: 'string',
    diet103_version: 'string'
  };

  for (const [field, expectedType] of Object.entries(requiredFields)) {
    if (!(field in metadata)) {
      result.valid = false;
      result.errors.push(`metadata.json missing required field: ${field}`);
      continue;
    }

    // Type checking
    const actualType = Array.isArray(metadata[field]) ? 'array' : typeof metadata[field];
    if (actualType !== expectedType) {
      result.valid = false;
      result.errors.push(
        `metadata.json field '${field}' has wrong type: expected ${expectedType}, got ${actualType}`
      );
    }
  }

  // Validate diet103_version is exactly '1.2.0'
  if (metadata.diet103_version && metadata.diet103_version !== '1.2.0') {
    result.valid = false;
    result.errors.push(
      `metadata.json has incorrect diet103_version: ${metadata.diet103_version} (expected '1.2.0')`
    );
  }

  // Validate skills array contains only strings
  if (Array.isArray(metadata.skills)) {
    const invalidSkills = metadata.skills.filter(skill => typeof skill !== 'string');
    if (invalidSkills.length > 0) {
      result.valid = false;
      result.errors.push(
        `metadata.json skills array contains non-string values: ${invalidSkills.join(', ')}`
      );
    }
  }

  // Validate optional tags array (if present)
  if ('tags' in metadata) {
    if (!Array.isArray(metadata.tags)) {
      result.warnings.push('metadata.json tags field should be an array');
    } else {
      const invalidTags = metadata.tags.filter(tag => typeof tag !== 'string');
      if (invalidTags.length > 0) {
        result.warnings.push('metadata.json tags array contains non-string values');
      }
    }
  }

  // Validate created is ISO 8601 date
  if (metadata.created) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    if (!dateRegex.test(metadata.created)) {
      result.warnings.push(
        'metadata.json created field should be ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)'
      );
    }
  }

  // Validate version is semver format
  if (metadata.version) {
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
    if (!semverRegex.test(metadata.version)) {
      result.warnings.push('metadata.json version should be semantic versioning format (X.Y.Z)');
    }
  }

  // Validate optional imports section
  if ('imports' in metadata) {
    if (typeof metadata.imports !== 'object' || metadata.imports === null) {
      result.warnings.push('metadata.json imports field should be an object');
    } else {
      // Validate imports.skills array
      if ('skills' in metadata.imports) {
        if (!Array.isArray(metadata.imports.skills)) {
          result.warnings.push('metadata.json imports.skills field should be an array');
        } else {
          // Validate each skill import entry
          metadata.imports.skills.forEach((skillImport, index) => {
            if (typeof skillImport !== 'object' || skillImport === null) {
              result.warnings.push(`metadata.json imports.skills[${index}] should be an object`);
              return;
            }

            // Required fields for skill import
            const requiredImportFields = ['name', 'source', 'version', 'importedAt'];
            requiredImportFields.forEach(field => {
              if (!(field in skillImport)) {
                result.warnings.push(
                  `metadata.json imports.skills[${index}] missing required field: ${field}`
                );
              } else if (typeof skillImport[field] !== 'string') {
                result.warnings.push(
                  `metadata.json imports.skills[${index}].${field} should be a string`
                );
              }
            });

            // Validate version format if present
            if (skillImport.version) {
              const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
              if (!semverRegex.test(skillImport.version)) {
                result.warnings.push(
                  `metadata.json imports.skills[${index}].version should be semantic versioning format (X.Y.Z)`
                );
              }
            }

            // Validate importedAt is ISO 8601 date if present
            if (skillImport.importedAt) {
              const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
              if (!dateRegex.test(skillImport.importedAt)) {
                result.warnings.push(
                  `metadata.json imports.skills[${index}].importedAt should be ISO 8601 format`
                );
              }
            }

            // Validate optional override field
            if ('override' in skillImport && typeof skillImport.override !== 'boolean') {
              result.warnings.push(
                `metadata.json imports.skills[${index}].override should be a boolean`
              );
            }

            // Validate optional overriddenAt field
            if ('overriddenAt' in skillImport && skillImport.overriddenAt !== null) {
              if (typeof skillImport.overriddenAt !== 'string') {
                result.warnings.push(
                  `metadata.json imports.skills[${index}].overriddenAt should be a string or null`
                );
              } else {
                const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
                if (!dateRegex.test(skillImport.overriddenAt)) {
                  result.warnings.push(
                    `metadata.json imports.skills[${index}].overriddenAt should be ISO 8601 format`
                  );
                }
              }
            }

            // Validate optional versionLocked field
            if ('versionLocked' in skillImport && typeof skillImport.versionLocked !== 'boolean') {
              result.warnings.push(
                `metadata.json imports.skills[${index}].versionLocked should be a boolean`
              );
            }

            // Validate optional lockedAt field
            if ('lockedAt' in skillImport && skillImport.lockedAt !== null) {
              if (typeof skillImport.lockedAt !== 'string') {
                result.warnings.push(
                  `metadata.json imports.skills[${index}].lockedAt should be a string or null`
                );
              } else {
                const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
                if (!dateRegex.test(skillImport.lockedAt)) {
                  result.warnings.push(
                    `metadata.json imports.skills[${index}].lockedAt should be ISO 8601 format`
                  );
                }
              }
            }

            // Validate optional dependencies field
            if ('dependencies' in skillImport) {
              if (!Array.isArray(skillImport.dependencies)) {
                result.warnings.push(
                  `metadata.json imports.skills[${index}].dependencies should be an array`
                );
              } else {
                skillImport.dependencies.forEach((dep, depIndex) => {
                  if (typeof dep !== 'string') {
                    result.warnings.push(
                      `metadata.json imports.skills[${index}].dependencies[${depIndex}] should be a string`
                    );
                  }
                });
              }
            }
          });
        }
      }
    }
  }

  return result;
}

/**
 * Validate skill-rules.json format and structure
 * 
 * Checks for:
 * - Valid JSON format
 * - Required 'rules' array
 * - Optional validation of rule structure
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Object>} Validation result with valid flag, errors, and warnings
 */
export async function validateSkillRules(projectPath) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };

  const skillRulesPath = path.join(projectPath, '.claude', 'skill-rules.json');

  // Check if file exists
  if (!fs.existsSync(skillRulesPath)) {
    result.valid = false;
    result.errors.push('skill-rules.json does not exist');
    return result;
  }

  // Parse JSON
  let skillRules;
  try {
    const content = await fs.promises.readFile(skillRulesPath, 'utf8');
    skillRules = JSON.parse(content);
  } catch (err) {
    result.valid = false;
    result.errors.push(`skill-rules.json parse error: ${err.message}`);
    return result;
  }

  // Validate 'rules' array exists
  if (!('rules' in skillRules)) {
    result.valid = false;
    result.errors.push('skill-rules.json missing required field: rules');
    return result;
  }

  if (!Array.isArray(skillRules.rules)) {
    result.valid = false;
    result.errors.push('skill-rules.json rules field must be an array');
    return result;
  }

  // Optional: Validate each rule has expected structure
  for (let i = 0; i < skillRules.rules.length; i++) {
    const rule = skillRules.rules[i];
    
    if (typeof rule !== 'object' || rule === null) {
      result.warnings.push(`Rule at index ${i} should be an object`);
      continue;
    }

    // Check for common fields (not enforced, just warnings)
    if (!rule.trigger_phrases && !rule.file_patterns && !rule.context_patterns) {
      result.warnings.push(
        `Rule at index ${i} has no trigger mechanisms (trigger_phrases, file_patterns, or context_patterns)`
      );
    }

    if (!rule.skill) {
      result.warnings.push(`Rule at index ${i} missing 'skill' field`);
    }
  }

  return result;
}

/**
 * Validate hook file permissions
 * 
 * Checks that UserPromptSubmit.js and PostToolUse.js have executable permissions
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Object>} Validation result with valid flag, errors, and warnings
 */
export async function validateHookPermissions(projectPath) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };

  const claudeDir = path.join(projectPath, '.claude');
  const hooksDir = path.join(claudeDir, 'hooks');
  const userPromptSubmit = path.join(hooksDir, 'UserPromptSubmit.js');
  const postToolUse = path.join(hooksDir, 'PostToolUse.js');

  // Check if hooks directory exists
  if (!fs.existsSync(hooksDir)) {
    result.valid = false;
    result.errors.push('hooks/ directory does not exist');
    return result;
  }

  try {
    // Check UserPromptSubmit.js
    if (fs.existsSync(userPromptSubmit)) {
      const stats = fs.statSync(userPromptSubmit);
      // Check if executable bit is set (owner, group, or other)
      if (!(stats.mode & 0o111)) {
        result.valid = false;
        result.errors.push(
          'UserPromptSubmit.js not executable (run: chmod +x hooks/UserPromptSubmit.js)'
        );
      }
    } else {
      result.warnings.push('UserPromptSubmit.js not found (optional but recommended)');
    }

    // Check PostToolUse.js
    if (fs.existsSync(postToolUse)) {
      const stats = fs.statSync(postToolUse);
      if (!(stats.mode & 0o111)) {
        result.valid = false;
        result.errors.push('PostToolUse.js not executable (run: chmod +x hooks/PostToolUse.js)');
      }
    } else {
      result.warnings.push('PostToolUse.js not found (optional but recommended)');
    }
  } catch (err) {
    result.valid = false;
    result.errors.push(`Hook permission check failed: ${err.message}`);
  }

  return result;
}

/**
 * Validate skill directory structure
 * 
 * Checks that each skill directory contains a skill.md or SKILL.md file
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Object>} Validation result with valid flag, errors, and warnings
 */
export async function validateSkillDirectory(projectPath) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };

  const skillsDir = path.join(projectPath, '.claude', 'skills');

  // Check if skills directory exists
  if (!fs.existsSync(skillsDir)) {
    // Skills directory is optional, just note it
    result.warnings.push('skills/ directory does not exist (optional)');
    return result;
  }

  try {
    const skills = await fs.promises.readdir(skillsDir, { withFileTypes: true });
    const skillDirs = skills.filter(dirent => dirent.isDirectory());

    if (skillDirs.length === 0) {
      result.warnings.push('skills/ directory is empty');
      return result;
    }

    for (const skill of skillDirs) {
      const skillPath = path.join(skillsDir, skill.name);
      const skillMd = path.join(skillPath, 'skill.md');
      const skillMdUpper = path.join(skillPath, 'SKILL.md');

      if (!fs.existsSync(skillMd) && !fs.existsSync(skillMdUpper)) {
        result.valid = false;
        result.errors.push(
          `Skill '${skill.name}' missing skill.md or SKILL.md (diet103 requires one)`
        );
      }
    }
  } catch (err) {
    result.valid = false;
    result.errors.push(`Skill directory validation failed: ${err.message}`);
  }

  return result;
}

/**
 * Validate Claude.md content length
 * 
 * Checks that Claude.md exists and has sufficient content (minimum 50 characters)
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Object>} Validation result with valid flag, errors, and warnings
 */
export async function validateClaudeMdContent(projectPath) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };

  const claudeMdPath = path.join(projectPath, '.claude', 'Claude.md');

  // Check if file exists
  if (!fs.existsSync(claudeMdPath)) {
    result.valid = false;
    result.errors.push('Claude.md does not exist');
    return result;
  }

  // Read and check content length
  try {
    const claudeMd = await fs.promises.readFile(claudeMdPath, 'utf8');
    const trimmedContent = claudeMd.trim();

    if (trimmedContent.length === 0) {
      result.valid = false;
      result.errors.push('Claude.md is empty');
    } else if (trimmedContent.length < 50) {
      result.valid = false;
      result.errors.push(
        `Claude.md is too short (${trimmedContent.length} characters, minimum 50 required)`
      );
    }

    // Check for basic markdown structure
    if (!trimmedContent.startsWith('#')) {
      result.warnings.push('Claude.md should start with a markdown heading (#)');
    }
  } catch (err) {
    result.valid = false;
    result.errors.push(`Claude.md read error: ${err.message}`);
  }

  return result;
}

/**
 * Validate architecture documentation presence and quality
 * 
 * Checks for:
 * - architecture.md exists (root or .claude/)
 * - CLAUDE.md exists (project root)
 * - Minimum content length
 * - Basic structure (headings present)
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Object>} Validation result with details
 */
export async function validateArchitectureDocs(projectPath) {
  const result = {
    valid: true,
    hasArchitectureMd: false,
    hasClaudeMd: false,
    errors: [],
    warnings: [],
    recommendations: []
  };

  // Check for architecture.md
  const archPaths = [
    path.join(projectPath, 'architecture.md'),
    path.join(projectPath, 'ARCHITECTURE.md'),
    path.join(projectPath, '.claude', 'architecture.md')
  ];

  let archPath = null;
  for (const p of archPaths) {
    if (fs.existsSync(p)) {
      archPath = p;
      result.hasArchitectureMd = true;
      break;
    }
  }

  if (archPath) {
    try {
      const content = await fs.promises.readFile(archPath, 'utf8');
      const trimmed = content.trim();

      // Check minimum length
      if (trimmed.length < 200) {
        result.warnings.push(
          `architecture.md is quite short (${trimmed.length} chars). Consider adding more system design details.`
        );
      }

      // Check for key sections
      const hasOverview = /^#+\s*(overview|introduction)/im.test(content);
      const hasArchitecture = /^#+\s*(architecture|pattern|design)/im.test(content);
      const hasComponents = /^#+\s*(component|layer|module)/im.test(content);

      if (!hasOverview) {
        result.warnings.push('architecture.md missing Overview section');
      }
      if (!hasArchitecture) {
        result.warnings.push('architecture.md missing Architecture Pattern section');
      }
      if (!hasComponents) {
        result.warnings.push('architecture.md missing Component/Layer section');
      }
    } catch (err) {
      result.errors.push(`Failed to read architecture.md: ${err.message}`);
      result.valid = false;
    }
  } else {
    result.recommendations.push(
      'Consider creating architecture.md to document system design for AI-assisted development'
    );
  }

  // Check for CLAUDE.md
  const claudePaths = [
    path.join(projectPath, 'CLAUDE.md'),
    path.join(projectPath, 'claude.md')
  ];

  let claudePath = null;
  for (const p of claudePaths) {
    if (fs.existsSync(p)) {
      claudePath = p;
      result.hasClaudeMd = true;
      break;
    }
  }

  if (claudePath) {
    try {
      const content = await fs.promises.readFile(claudePath, 'utf8');
      const trimmed = content.trim();

      // Check minimum length
      if (trimmed.length < 500) {
        result.warnings.push(
          `CLAUDE.md is quite short (${trimmed.length} chars). Consider adding workflow and patterns.`
        );
      }

      // Check for key sections
      const hasPrinciples = /^#+\s*(principle|core|foundation)/im.test(content);
      const hasWorkflow = /^#+\s*(workflow|process|development)/im.test(content);
      const hasPatterns = /^#+\s*(pattern|template|code)/im.test(content);
      const hasAntiPatterns = /^#+\s*(anti-pattern|don't|avoid)/im.test(content);

      if (!hasPrinciples && !hasWorkflow) {
        result.warnings.push('CLAUDE.md missing Core Principles or Workflow section');
      }
      if (!hasPatterns) {
        result.warnings.push('CLAUDE.md missing Code Patterns section');
      }
      if (!hasAntiPatterns) {
        result.warnings.push('CLAUDE.md missing Anti-Patterns section (helps prevent common mistakes)');
      }
    } catch (err) {
      result.errors.push(`Failed to read CLAUDE.md: ${err.message}`);
      result.valid = false;
    }
  } else {
    result.recommendations.push(
      'Consider creating CLAUDE.md to document development guidelines for AI-assisted development'
    );
  }

  // Overall recommendation if neither exists
  if (!result.hasArchitectureMd && !result.hasClaudeMd) {
    result.recommendations.push(
      'Use the architecture-docs skill to generate comprehensive AI development documentation: ' +
      '"Create architecture documentation for this project"'
    );
  }

  return result;
}

/**
 * Validate diet103 consistency across all components
 * 
 * Performs deep validation including:
 * - metadata.json structure validation
 * - skill-rules.json format validation
 * - Hook file permissions
 * - Skill directory structure
 * - Claude.md content length
 * 
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Array<string>>} Array of consistency issues (empty if fully consistent)
 */
export async function validateDiet103Consistency(projectPath) {
  const issues = [];

  // 1. Validate metadata.json structure
  const metadataResult = await validateMetadataJson(projectPath);
  if (!metadataResult.valid) {
    issues.push(...metadataResult.errors);
  }
  if (metadataResult.warnings.length > 0) {
    issues.push(...metadataResult.warnings.map(w => `Warning: ${w}`));
  }

  // 2. Validate skill-rules.json structure
  const skillRulesResult = await validateSkillRules(projectPath);
  if (!skillRulesResult.valid) {
    issues.push(...skillRulesResult.errors);
  }
  if (skillRulesResult.warnings.length > 0) {
    issues.push(...skillRulesResult.warnings.map(w => `Warning: ${w}`));
  }

  // 3. Validate hooks are executable
  const hookPermissionsResult = await validateHookPermissions(projectPath);
  if (!hookPermissionsResult.valid) {
    issues.push(...hookPermissionsResult.errors);
  }
  if (hookPermissionsResult.warnings.length > 0) {
    issues.push(...hookPermissionsResult.warnings.map(w => `Warning: ${w}`));
  }

  // 4. Validate skills directory structure
  const skillDirectoryResult = await validateSkillDirectory(projectPath);
  if (!skillDirectoryResult.valid) {
    issues.push(...skillDirectoryResult.errors);
  }
  if (skillDirectoryResult.warnings.length > 0) {
    issues.push(...skillDirectoryResult.warnings.map(w => `Warning: ${w}`));
  }

  // 5. Validate Claude.md has minimum content
  const claudeMdResult = await validateClaudeMdContent(projectPath);
  if (!claudeMdResult.valid) {
    issues.push(...claudeMdResult.errors);
  }
  if (claudeMdResult.warnings.length > 0) {
    issues.push(...claudeMdResult.warnings.map(w => `Warning: ${w}`));
  }

  // 6. Validate architecture documentation (optional but recommended)
  const archDocsResult = await validateArchitectureDocs(projectPath);
  if (!archDocsResult.valid) {
    issues.push(...archDocsResult.errors);
  }
  if (archDocsResult.warnings.length > 0) {
    issues.push(...archDocsResult.warnings.map(w => `Info: ${w}`));
  }
  if (archDocsResult.recommendations.length > 0) {
    issues.push(...archDocsResult.recommendations.map(r => `Recommendation: ${r}`));
  }

  return issues;
}

