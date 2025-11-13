#!/usr/bin/env node
/**
 * Project Detection Utility
 * 
 * Helps identify and switch between projects based on user intent
 * Prevents confusion between sibling projects
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Project registry with common names and absolute paths
const PROJECT_REGISTRY = {
  'orchestrator': '/Users/tomeldridge/Orchestrator_Project',
  'orchestrator-project': '/Users/tomeldridge/Orchestrator_Project',
  'orchestrator_project': '/Users/tomeldridge/Orchestrator_Project',
  'data-viz': '/Users/tomeldridge/data-vis',
  'data-vis': '/Users/tomeldridge/data-vis',
  'data_vis': '/Users/tomeldridge/data-vis',
  'dataviz': '/Users/tomeldridge/data-vis',
  'portfolio': '/Users/tomeldridge/portfolio-redesign',
  'portfolio-redesign': '/Users/tomeldridge/portfolio-redesign',
};

/**
 * Detect project from PRD content
 */
function detectProjectFromPRD(projectPath) {
  const prdPath = path.join(projectPath, '.taskmaster', 'docs', 'prd.txt');
  
  if (!fs.existsSync(prdPath)) {
    return null;
  }
  
  const prdContent = fs.readFileSync(prdPath, 'utf-8').toLowerCase();
  
  // Check for key phrases
  if (prdContent.includes('visual vocabulary') || prdContent.includes('csv') || prdContent.includes('data visualization ai')) {
    return 'data-vis';
  }
  
  if (prdContent.includes('prospecting landing page') || prdContent.includes('portfolio redesign')) {
    return 'portfolio-redesign';
  }
  
  if (prdContent.includes('orchestrator') || prdContent.includes('file lifecycle')) {
    return 'orchestrator';
  }
  
  return null;
}

/**
 * Get project info from path
 */
function getProjectInfo(projectPath) {
  if (!fs.existsSync(projectPath)) {
    return null;
  }
  
  const taskmasterPath = path.join(projectPath, '.taskmaster');
  if (!fs.existsSync(taskmasterPath)) {
    return null;
  }
  
  const prdPath = path.join(taskmasterPath, 'docs', 'prd.txt');
  const configPath = path.join(taskmasterPath, 'config.json');
  
  let prdTitle = 'Unknown Project';
  if (fs.existsSync(prdPath)) {
    const prdContent = fs.readFileSync(prdPath, 'utf-8');
    const titleMatch = prdContent.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      prdTitle = titleMatch[1];
    }
  }
  
  let projectName = path.basename(projectPath);
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.project?.name) {
        projectName = config.project.name;
      }
    } catch (err) {
      // Ignore parse errors
    }
  }
  
  return {
    path: projectPath,
    name: projectName,
    prdTitle,
    detectedType: detectProjectFromPRD(projectPath),
  };
}

/**
 * Resolve project name to absolute path
 */
function resolveProject(nameOrPath) {
  // If it's already an absolute path, return it
  if (path.isAbsolute(nameOrPath)) {
    return nameOrPath;
  }
  
  // Check registry (case-insensitive)
  const normalized = nameOrPath.toLowerCase().trim();
  if (PROJECT_REGISTRY[normalized]) {
    return PROJECT_REGISTRY[normalized];
  }
  
  // Try as relative path from home
  const homePath = path.join(os.homedir(), nameOrPath);
  if (fs.existsSync(homePath)) {
    return homePath;
  }
  
  return null;
}

/**
 * List all available projects
 */
function listProjects() {
  const projects = [];
  const seen = new Set();
  
  // Check all registered projects
  for (const [alias, projectPath] of Object.entries(PROJECT_REGISTRY)) {
    if (seen.has(projectPath)) continue;
    seen.add(projectPath);
    
    const info = getProjectInfo(projectPath);
    if (info) {
      projects.push(info);
    }
  }
  
  return projects;
}

/**
 * Find project by partial name or keyword
 */
function findProject(keyword) {
  const normalized = keyword.toLowerCase().trim();
  const projects = listProjects();
  
  // Exact match
  for (const project of projects) {
    if (project.name.toLowerCase() === normalized) {
      return project;
    }
  }
  
  // Partial match
  for (const project of projects) {
    if (project.name.toLowerCase().includes(normalized) ||
        project.prdTitle.toLowerCase().includes(normalized) ||
        project.detectedType === normalized) {
      return project;
    }
  }
  
  return null;
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'list') {
    const projects = listProjects();
    console.log('\n📁 Available Projects:\n');
    projects.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}`);
      console.log(`   Path: ${p.path}`);
      console.log(`   PRD: ${p.prdTitle}`);
      console.log(`   Type: ${p.detectedType || 'unknown'}`);
      console.log('');
    });
  } else if (command === 'find') {
    const keyword = args[1];
    if (!keyword) {
      console.error('Usage: project-detector.js find <keyword>');
      process.exit(1);
    }
    
    const project = findProject(keyword);
    if (project) {
      console.log(JSON.stringify(project, null, 2));
    } else {
      console.error(`No project found matching: ${keyword}`);
      process.exit(1);
    }
  } else if (command === 'resolve') {
    const nameOrPath = args[1];
    if (!nameOrPath) {
      console.error('Usage: project-detector.js resolve <name-or-path>');
      process.exit(1);
    }
    
    const resolved = resolveProject(nameOrPath);
    if (resolved) {
      console.log(resolved);
    } else {
      console.error(`Could not resolve: ${nameOrPath}`);
      process.exit(1);
    }
  } else {
    console.log('Usage:');
    console.log('  project-detector.js list');
    console.log('  project-detector.js find <keyword>');
    console.log('  project-detector.js resolve <name-or-path>');
    process.exit(1);
  }
}

module.exports = {
  resolveProject,
  getProjectInfo,
  listProjects,
  findProject,
  detectProjectFromPRD,
};

