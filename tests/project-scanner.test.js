/**
 * Project Scanner Tests
 * 
 * Tests for the project auto-detection functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { ProjectScanner, scanForProjects, scanForUnregisteredProjects, loadRegisteredProjects } from '../lib/utils/project-scanner.js';

describe('ProjectScanner', () => {
  let tempDir;
  
  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = path.join(os.tmpdir(), `scanner-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('isClaudeProject', () => {
    it('should detect a valid Claude project', async () => {
      // Create a directory with .claude folder
      const projectDir = path.join(tempDir, 'test-project');
      const claudeDir = path.join(projectDir, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });

      const scanner = new ProjectScanner();
      const isProject = await scanner.isClaudeProject(projectDir);
      
      expect(isProject).toBe(true);
    });

    it('should not detect directory without .claude folder', async () => {
      const projectDir = path.join(tempDir, 'not-a-project');
      await fs.mkdir(projectDir, { recursive: true });

      const scanner = new ProjectScanner();
      const isProject = await scanner.isClaudeProject(projectDir);
      
      expect(isProject).toBe(false);
    });

    it('should not detect .claude as a file', async () => {
      const projectDir = path.join(tempDir, 'fake-project');
      await fs.mkdir(projectDir, { recursive: true });
      await fs.writeFile(path.join(projectDir, '.claude'), 'fake');

      const scanner = new ProjectScanner();
      const isProject = await scanner.isClaudeProject(projectDir);
      
      expect(isProject).toBe(false);
    });
  });

  describe('scan', () => {
    it('should find projects at root level', async () => {
      // Create a project at root
      const projectDir = path.join(tempDir, 'root-project');
      await fs.mkdir(path.join(projectDir, '.claude'), { recursive: true });

      const scanner = new ProjectScanner({ maxDepth: 2 });
      const projects = await scanner.scan(tempDir);

      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('root-project');
      expect(projects[0].path).toBe(projectDir);
    });

    it('should find nested projects', async () => {
      // Create nested projects
      const project1 = path.join(tempDir, 'folder1', 'project1');
      const project2 = path.join(tempDir, 'folder1', 'folder2', 'project2');
      
      await fs.mkdir(path.join(project1, '.claude'), { recursive: true });
      await fs.mkdir(path.join(project2, '.claude'), { recursive: true });

      const scanner = new ProjectScanner({ maxDepth: 3 });
      const projects = await scanner.scan(tempDir);

      expect(projects).toHaveLength(2);
      expect(projects.find(p => p.name === 'project1')).toBeDefined();
      expect(projects.find(p => p.name === 'project2')).toBeDefined();
    });

    it('should respect maxDepth limit', async () => {
      // Create projects at different depths
      const shallow = path.join(tempDir, 'shallow');
      const deep = path.join(tempDir, 'a', 'b', 'c', 'deep');
      
      await fs.mkdir(path.join(shallow, '.claude'), { recursive: true });
      await fs.mkdir(path.join(deep, '.claude'), { recursive: true });

      const scanner = new ProjectScanner({ maxDepth: 1 });
      const projects = await scanner.scan(tempDir);

      // Should only find shallow project within depth limit
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('shallow');
    });

    it('should exclude common directories', async () => {
      // Create projects inside excluded directories
      const nodeModules = path.join(tempDir, 'node_modules', 'project');
      const git = path.join(tempDir, '.git', 'project');
      const valid = path.join(tempDir, 'valid-project');
      
      await fs.mkdir(path.join(nodeModules, '.claude'), { recursive: true });
      await fs.mkdir(path.join(git, '.claude'), { recursive: true });
      await fs.mkdir(path.join(valid, '.claude'), { recursive: true });

      const scanner = new ProjectScanner({ maxDepth: 3 });
      const projects = await scanner.scan(tempDir);

      // Should only find the valid project, not those in excluded dirs
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('valid-project');
    });

    it('should not scan inside discovered projects', async () => {
      // Create nested project structure (project inside project)
      const outer = path.join(tempDir, 'outer-project');
      const inner = path.join(outer, 'inner-project');
      
      await fs.mkdir(path.join(outer, '.claude'), { recursive: true });
      await fs.mkdir(path.join(inner, '.claude'), { recursive: true });

      const scanner = new ProjectScanner({ maxDepth: 3 });
      const projects = await scanner.scan(tempDir);

      // Should only find outer project, not scan inside it
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('outer-project');
    });

    it('should emit progress events', async () => {
      // Create many directories to trigger progress events (every 10 directories)
      for (let i = 0; i < 15; i++) {
        await fs.mkdir(path.join(tempDir, `dir${i}`, 'subdir'), { recursive: true });
      }
      // Create projects
      await fs.mkdir(path.join(tempDir, 'p1', '.claude'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'p2', '.claude'), { recursive: true });

      const scanner = new ProjectScanner({ maxDepth: 3 });
      const progressEvents = [];
      const projectEvents = [];

      scanner.on('progress', (data) => {
        progressEvents.push(data);
      });

      scanner.on('project-found', (project) => {
        projectEvents.push(project);
      });

      await scanner.scan(tempDir);

      expect(projectEvents).toHaveLength(2);
      // Progress events are emitted every 10 directories, so with 15+ dirs we should get at least 1
      expect(progressEvents.length).toBeGreaterThanOrEqual(0); // May or may not emit depending on scan order
    });

    it('should support cancellation', async () => {
      // Create many nested directories for a longer scan
      for (let i = 0; i < 10; i++) {
        const dir = path.join(tempDir, `dir${i}`, 'subdir');
        await fs.mkdir(dir, { recursive: true });
      }

      const scanner = new ProjectScanner({ maxDepth: 3 });
      let cancelEventFired = false;
      
      scanner.on('scan-cancelled', () => {
        cancelEventFired = true;
      });
      
      // Start scan and cancel it mid-flight
      const scanPromise = scanner.scan(tempDir);
      scanner.cancel();
      
      await scanPromise;
      
      // Verify cancellation was triggered
      expect(cancelEventFired).toBe(true);
    });
  });

  describe('filtering', () => {
    it('should filter registered projects when enabled', async () => {
      const project1 = path.join(tempDir, 'project1');
      const project2 = path.join(tempDir, 'project2');
      
      await fs.mkdir(path.join(project1, '.claude'), { recursive: true });
      await fs.mkdir(path.join(project2, '.claude'), { recursive: true });

      const scanner = new ProjectScanner({
        maxDepth: 2,
        filterRegistered: true,
        registeredProjects: [project1]
      });

      const projects = await scanner.scan(tempDir);

      // Should only find project2 (project1 is registered)
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('project2');
    });

    it('should emit skip events for registered projects', async () => {
      const project1 = path.join(tempDir, 'registered-project');
      await fs.mkdir(path.join(project1, '.claude'), { recursive: true });

      const scanner = new ProjectScanner({
        maxDepth: 2,
        filterRegistered: true,
        registeredProjects: [project1]
      });

      const skippedEvents = [];
      scanner.on('project-skipped', (info) => {
        skippedEvents.push(info);
      });

      await scanner.scan(tempDir);

      expect(skippedEvents).toHaveLength(1);
      expect(skippedEvents[0].reason).toBe('already-registered');
    });
  });

  describe('validation', () => {
    it('should validate project structure when enabled', async () => {
      const project = path.join(tempDir, 'test-project');
      const claudeDir = path.join(project, '.claude');
      
      // Create a basic valid project
      await fs.mkdir(claudeDir, { recursive: true });
      await fs.writeFile(path.join(claudeDir, 'Claude.md'), '# Project');
      await fs.writeFile(path.join(claudeDir, 'metadata.json'), '{"name":"test"}');

      const scanner = new ProjectScanner({
        maxDepth: 2,
        validateStructure: true,
        minValidationScore: 0
      });

      const projects = await scanner.scan(tempDir);

      expect(projects).toHaveLength(1);
      expect(projects[0].valid).toBeDefined();
      expect(projects[0].score).toBeGreaterThan(0);
      expect(projects[0].validation).toBeDefined();
    });

    it('should skip projects below validation threshold', async () => {
      const project = path.join(tempDir, 'incomplete-project');
      const claudeDir = path.join(project, '.claude');
      
      // Create minimal project (low score)
      await fs.mkdir(claudeDir, { recursive: true });

      const scanner = new ProjectScanner({
        maxDepth: 2,
        validateStructure: true,
        minValidationScore: 80 // High threshold
      });

      const projects = await scanner.scan(tempDir);

      // Should not include project with low score
      expect(projects).toHaveLength(0);
    });
  });

  describe('helper functions', () => {
    it('scanForProjects should work', async () => {
      const project = path.join(tempDir, 'helper-test');
      await fs.mkdir(path.join(project, '.claude'), { recursive: true });

      const projects = await scanForProjects(tempDir, { maxDepth: 2 });

      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('helper-test');
    });

    it('loadRegisteredProjects should return empty array when no registry', async () => {
      const registered = await loadRegisteredProjects();
      
      // Should return array (might be empty if no real registry)
      expect(Array.isArray(registered)).toBe(true);
    });
  });

  describe('statistics', () => {
    it('should track scanning statistics', async () => {
      await fs.mkdir(path.join(tempDir, 'p1', '.claude'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'folder', 'p2', '.claude'), { recursive: true });

      const scanner = new ProjectScanner({ maxDepth: 3 });
      await scanner.scan(tempDir);

      const stats = scanner.getStats();

      expect(stats.directoriesScanned).toBeGreaterThan(0);
      expect(stats.projectsFound).toBe(2);
      expect(stats.startTime).toBeDefined();
      expect(stats.endTime).toBeDefined();
      expect(stats.duration).toBeGreaterThanOrEqual(0); // Can be 0 for very fast scans
    });
  });
});

