#!/usr/bin/env node

/**
 * Multi-Project Taskmaster Dashboard Server
 * 
 * Serves the epic dashboard and provides API endpoints to fetch
 * tasks from any Orchestrator-registered project.
 */

import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3737; // Memorable port for Taskmaster dashboard

// MIME types for serving static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

/**
 * Load the Orchestrator projects registry
 */
async function loadProjectsRegistry() {
  try {
    const registryPath = join(os.homedir(), '.orchestrator', 'projects.json');
    const content = await readFile(registryPath, 'utf-8');
    const registry = JSON.parse(content);
    return registry.projects || {};
  } catch (error) {
    console.warn('⚠️  Could not load Orchestrator registry:', error.message);
    return {};
  }
}

/**
 * Load tasks.json from a specific project
 */
async function loadProjectTasks(projectPath) {
  try {
    const tasksPath = join(projectPath, '.taskmaster', 'tasks', 'tasks.json');
    const content = await readFile(tasksPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load tasks from ${projectPath}: ${error.message}`);
  }
}

/**
 * Load epics.json from a specific project (if exists)
 */
async function loadProjectEpics(projectPath) {
  try {
    const epicsPath = join(projectPath, '.taskmaster', 'epics.json');
    const content = await readFile(epicsPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // epics.json is optional, return null if not found
    return null;
  }
}

/**
 * Main request handler
 */
async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // API: Get list of available projects
    if (url.pathname === '/api/projects') {
      const projects = await loadProjectsRegistry();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(projects));
      return;
    }

    // API: Get tasks for a specific project
    if (url.pathname === '/api/tasks') {
      const projectName = url.searchParams.get('project');
      
      if (!projectName) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing project parameter' }));
        return;
      }

      const projects = await loadProjectsRegistry();
      const project = projects[projectName];

      if (!project) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Project '${projectName}' not found in registry` }));
        return;
      }

      const tasks = await loadProjectTasks(project.path);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(tasks));
      return;
    }

    // API: Get epics for a specific project
    if (url.pathname === '/api/epics') {
      const projectName = url.searchParams.get('project');
      
      if (!projectName) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing project parameter' }));
        return;
      }

      const projects = await loadProjectsRegistry();
      const project = projects[projectName];

      if (!project) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Project '${projectName}' not found in registry` }));
        return;
      }

      const epics = await loadProjectEpics(project.path);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(epics || {}));
      return;
    }

    // Serve static files
    let filePath = url.pathname === '/' ? '/epic-dashboard.html' : url.pathname;
    filePath = join(__dirname, filePath);

    const ext = filePath.substring(filePath.lastIndexOf('.'));
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);

  } catch (error) {
    console.error('Error handling request:', error);
    
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  }
}

/**
 * Start the server
 */
const server = createServer(handleRequest);

server.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   🎯 Taskmaster Multi-Project Dashboard Server           ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║   📍 URL: http://localhost:${PORT}                          ║`);
  console.log('║   📂 Serving from: dashboard/                             ║');
  console.log('║   🔄 Auto-loads from ~/.orchestrator/projects.json        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('✅ Server ready! Press Ctrl+C to stop.');
  console.log('');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please stop the other server or choose a different port.`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

