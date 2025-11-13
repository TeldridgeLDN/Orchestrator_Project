#!/usr/bin/env node

/**
 * DocumentationLifecycle Hook
 * 
 * Automatically enforces documentation framework rules from DOCUMENTATION_FRAMEWORK.md
 * 
 * Features:
 * - Detects anti-pattern documentation files
 * - Warns when creating ephemeral docs
 * - Checks age of milestone documents
 * - Suggests archival when appropriate
 * - Validates file locations
 * 
 * Runs: After any file write/create operation (PostToolUse)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Anti-pattern file name patterns (from DOCUMENTATION_FRAMEWORK.md)
const ANTI_PATTERNS = [
  {
    pattern: /^TASK_\d+_COMPLETE\.md$/i,
    type: 'task-completion',
    message: 'Individual task completion files are anti-patterns. Use git commit messages instead.',
    suggestion: 'git commit -m "feat: Task X complete - <description>"'
  },
  {
    pattern: /^TASK_\d+_SUMMARY\.md$/i,
    type: 'task-summary',
    message: 'Individual task summary files are anti-patterns. Update task details instead.',
    suggestion: 'task-master update-subtask --id=X --prompt="<details>"'
  },
  {
    pattern: /^SUBTASK_\d+_\d+_COMPLETE\.md$/i,
    type: 'subtask-completion',
    message: 'Subtask completion files are anti-patterns. Use git commits or task updates.',
    suggestion: 'task-master update-subtask --id=X.Y --prompt="<details>"'
  },
  {
    pattern: /^SESSION_SUMMARY_.*\.md$/i,
    type: 'session-summary',
    message: 'Session summaries should be in .claude/docs/sessions/YYYY-MM/ directory.',
    suggestion: 'Move to: .claude/docs/sessions/' + new Date().toISOString().slice(0, 7) + '/'
  },
  {
    pattern: /_COMPLETION_SUMMARY\.md$/i,
    type: 'completion-summary',
    message: 'Individual completion summaries are anti-patterns unless they are major milestones.',
    suggestion: 'Consider if this is truly a milestone (Epic/Phase). If not, use git commits.'
  }
];

// Milestone patterns that should be archived after 30 days
const MILESTONE_PATTERNS = [
  /_COMPLETE\.md$/i,
  /_MILESTONE\.md$/i,
  /^IMPLEMENTATION_COMPLETE/i,
  /^INSTALLATION_COMPLETE/i,
  /^.*_IMPLEMENTATION_COMPLETE\.md$/i
];

// Maximum age for milestone docs (30 days in milliseconds)
const MILESTONE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

// Maximum age for session docs (14 days in milliseconds)
const SESSION_MAX_AGE = 14 * 24 * 60 * 60 * 1000;

/**
 * Check if file matches any anti-pattern
 */
function checkAntiPattern(filename) {
  for (const { pattern, type, message, suggestion } of ANTI_PATTERNS) {
    if (pattern.test(filename)) {
      return { isAntiPattern: true, type, message, suggestion };
    }
  }
  return { isAntiPattern: false };
}

/**
 * Check if file is a milestone document
 */
function isMilestoneDoc(filename) {
  return MILESTONE_PATTERNS.some(pattern => pattern.test(filename));
}

/**
 * Get file age in days
 */
function getFileAgeDays(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const ageMs = Date.now() - stats.mtimeMs;
    return Math.floor(ageMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Check if file should be archived
 */
function shouldArchive(filePath, filename) {
  const ageDays = getFileAgeDays(filePath);
  
  // Milestone docs > 30 days
  if (isMilestoneDoc(filename) && ageDays > 30) {
    return {
      shouldArchive: true,
      reason: 'milestone-age',
      ageDays,
      archivePath: 'Docs/archive/milestones/',
      message: `Milestone document is ${ageDays} days old. Consider archiving to Docs/archive/milestones/`
    };
  }
  
  // Session docs > 14 days (if in root, not already in sessions dir)
  if (filename.startsWith('SESSION_') && !filePath.includes('.claude/docs/sessions/')) {
    if (ageDays > 14) {
      return {
        shouldArchive: true,
        reason: 'session-age',
        ageDays,
        archivePath: 'Docs/archive/sessions/',
        message: `Session document is ${ageDays} days old. Should be deleted or archived.`
      };
    }
  }
  
  return { shouldArchive: false };
}

/**
 * Get appropriate location for file type
 */
function suggestLocation(filename) {
  // Session summaries
  if (filename.startsWith('SESSION_SUMMARY')) {
    const yearMonth = new Date().toISOString().slice(0, 7);
    return `.claude/docs/sessions/${yearMonth}/`;
  }
  
  // Milestone summaries
  if (isMilestoneDoc(filename)) {
    return 'Root directory (but schedule for archival after 30 days)';
  }
  
  // Permanent documentation
  if (filename.includes('ARCHITECTURE') || 
      filename.includes('IMPLEMENTATION_GUIDE') ||
      filename.includes('USER_GUIDE') ||
      filename.includes('API_REFERENCE')) {
    return 'Docs/';
  }
  
  return 'Review DOCUMENTATION_FRAMEWORK.md for guidance';
}

/**
 * Main hook function
 */
export default async function DocumentationLifecycle(context) {
  try {
    const { tool, result } = context;
    
    // Only process write operations
    if (tool !== 'write' && tool !== 'write_file') {
      return null;
    }
    
    // Get file path from tool parameters
    let filePath = context.parameters?.file_path || 
                   context.parameters?.path ||
                   result?.path;
    
    if (!filePath) {
      return null;
    }
    
    // Normalize path
    filePath = path.resolve(filePath);
    const filename = path.basename(filePath);
    const projectRoot = process.cwd();
    const relativePath = path.relative(projectRoot, filePath);
    
    // Skip if not a markdown file
    if (!filename.endsWith('.md')) {
      return null;
    }
    
    // Skip if in archive, templates, or node_modules
    if (relativePath.includes('archive/') || 
        relativePath.includes('templates/') ||
        relativePath.includes('node_modules/') ||
        relativePath.includes('.git/')) {
      return null;
    }
    
    const warnings = [];
    
    // Check 1: Anti-pattern detection
    const antiPatternCheck = checkAntiPattern(filename);
    if (antiPatternCheck.isAntiPattern) {
      warnings.push({
        type: 'ANTI_PATTERN',
        severity: 'WARNING',
        file: filename,
        message: antiPatternCheck.message,
        suggestion: antiPatternCheck.suggestion
      });
    }
    
    // Check 2: Archive recommendation
    if (fs.existsSync(filePath)) {
      const archiveCheck = shouldArchive(filePath, filename);
      if (archiveCheck.shouldArchive) {
        warnings.push({
          type: 'ARCHIVE_NEEDED',
          severity: 'INFO',
          file: filename,
          message: archiveCheck.message,
          suggestion: `mv ${filename} ${archiveCheck.archivePath}`
        });
      }
    }
    
    // Check 3: Location validation
    const isInRoot = !relativePath.includes('/');
    const isInDocs = relativePath.startsWith('Docs/');
    
    if (isInRoot && !isMilestoneDoc(filename) && !antiPatternCheck.isAntiPattern) {
      const suggestedLoc = suggestLocation(filename);
      if (suggestedLoc !== 'Root directory (but schedule for archival after 30 days)') {
        warnings.push({
          type: 'LOCATION_SUGGESTION',
          severity: 'INFO',
          file: filename,
          message: `Consider organizing this file better.`,
          suggestion: `Suggested location: ${suggestedLoc}`
        });
      }
    }
    
    // Display warnings if any
    if (warnings.length > 0) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📚 Documentation Framework - Automatic Review');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`\n📄 File: ${filename}`);
      console.log(`📍 Location: ${relativePath}\n`);
      
      warnings.forEach((warning, idx) => {
        const icon = warning.severity === 'WARNING' ? '⚠️ ' : 'ℹ️ ';
        console.log(`${icon} ${warning.type}:`);
        console.log(`   ${warning.message}`);
        if (warning.suggestion) {
          console.log(`   💡 Suggestion: ${warning.suggestion}`);
        }
        if (idx < warnings.length - 1) {
          console.log('');
        }
      });
      
      console.log('\n📖 Framework: Docs/DOCUMENTATION_FRAMEWORK.md');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
    return null; // Non-blocking - hook doesn't prevent file creation
    
  } catch (error) {
    // Hook failures should not break file operations
    console.error('[DocumentationLifecycle] Hook error:', error.message);
    return null;
  }
}

