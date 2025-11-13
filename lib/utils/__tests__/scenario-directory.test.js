/**
 * Tests for Scenario Directory Management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import os from 'os';
import path from 'path';
import {
  getClaudeDir,
  getScenariosDir,
  getScenarioSubdir,
  scenariosDirectoryExists,
  claudeDirectoryExists,
  createScenarioDirectory,
  verifyScenarioDirectory,
  getScenarioStats,
} from '../scenario-directory.js';

// Mock os.homedir for predictable test paths
const mockHomeDir = '/tmp/test-home';
vi.mock('os', () => ({
  default: {
    homedir: () => mockHomeDir,
  },
  homedir: () => mockHomeDir,
}));

describe('Scenario Directory - Path Functions', () => {
  it('should return correct Claude directory path', () => {
    const claudeDir = getClaudeDir();
    expect(claudeDir).toBe(path.join(mockHomeDir, '.claude'));
  });

  it('should return correct scenarios directory path', () => {
    const scenariosDir = getScenariosDir();
    expect(scenariosDir).toBe(path.join(mockHomeDir, '.claude', 'scenarios'));
  });

  it('should return correct subdirectory paths', () => {
    expect(getScenarioSubdir('examples')).toBe(
      path.join(mockHomeDir, '.claude', 'scenarios', 'examples')
    );
    expect(getScenarioSubdir('templates')).toBe(
      path.join(mockHomeDir, '.claude', 'scenarios', 'templates')
    );
    expect(getScenarioSubdir('user')).toBe(
      path.join(mockHomeDir, '.claude', 'scenarios', 'user')
    );
  });
});

describe('Scenario Directory - Existence Checks', () => {
  beforeEach(async () => {
    // Clean up test directories
    const claudeDir = getClaudeDir();
    if (existsSync(claudeDir)) {
      await fs.rm(claudeDir, { recursive: true, force: true });
    }
  });

  afterEach(async () => {
    // Clean up after tests
    const claudeDir = getClaudeDir();
    if (existsSync(claudeDir)) {
      await fs.rm(claudeDir, { recursive: true, force: true });
    }
  });

  it('should detect non-existent Claude directory', () => {
    expect(claudeDirectoryExists()).toBe(false);
  });

  it('should detect non-existent scenarios directory', () => {
    expect(scenariosDirectoryExists()).toBe(false);
  });

  it('should detect existing Claude directory', async () => {
    await fs.mkdir(getClaudeDir(), { recursive: true });
    expect(claudeDirectoryExists()).toBe(true);
  });

  it('should detect existing scenarios directory', async () => {
    await fs.mkdir(getScenariosDir(), { recursive: true });
    expect(scenariosDirectoryExists()).toBe(true);
  });
});

describe('Scenario Directory - Creation', () => {
  beforeEach(async () => {
    const claudeDir = getClaudeDir();
    if (existsSync(claudeDir)) {
      await fs.rm(claudeDir, { recursive: true, force: true });
    }
  });

  afterEach(async () => {
    const claudeDir = getClaudeDir();
    if (existsSync(claudeDir)) {
      await fs.rm(claudeDir, { recursive: true, force: true });
    }
  });

  it('should create complete directory structure', async () => {
    const result = await createScenarioDirectory();

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.created).toContain(getClaudeDir());
    expect(result.created).toContain(getScenariosDir());
    expect(result.created).toContain(getScenarioSubdir('examples'));
    expect(result.created).toContain(getScenarioSubdir('templates'));
    expect(result.created).toContain(getScenarioSubdir('user'));

    // Verify directories exist
    expect(existsSync(getClaudeDir())).toBe(true);
    expect(existsSync(getScenariosDir())).toBe(true);
    expect(existsSync(getScenarioSubdir('examples'))).toBe(true);
    expect(existsSync(getScenarioSubdir('templates'))).toBe(true);
    expect(existsSync(getScenarioSubdir('user'))).toBe(true);
  });

  it('should create README files in each directory', async () => {
    await createScenarioDirectory();

    // Check README files exist
    const readmePaths = [
      path.join(getScenariosDir(), 'README.md'),
      path.join(getScenarioSubdir('examples'), 'README.md'),
      path.join(getScenarioSubdir('templates'), 'README.md'),
      path.join(getScenarioSubdir('user'), 'README.md'),
    ];

    for (const readmePath of readmePaths) {
      expect(existsSync(readmePath)).toBe(true);
      const content = await fs.readFile(readmePath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    }
  });

  it('should not recreate existing directories', async () => {
    // First creation
    const result1 = await createScenarioDirectory();
    expect(result1.created).toContain(getScenariosDir());

    // Second creation
    const result2 = await createScenarioDirectory();
    expect(result2.existed).toContain(getScenariosDir());
    expect(result2.created).not.toContain(getScenariosDir());
  });

  it('should handle verbose option', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await createScenarioDirectory({ verbose: true });

    expect(consoleSpy).toHaveBeenCalled();
    const calls = consoleSpy.mock.calls.map(call => call[0]);
    expect(calls.some(msg => msg.includes('Created:'))).toBe(true);

    consoleSpy.mockRestore();
  });

  it('should update permissions with force option', async () => {
    // Create directory first
    await fs.mkdir(getScenariosDir(), { recursive: true });

    const result = await createScenarioDirectory({ force: true });

    expect(result.success).toBe(true);
    expect(result.existed).toContain(getScenariosDir());
  });
});

describe('Scenario Directory - Verification', () => {
  beforeEach(async () => {
    const claudeDir = getClaudeDir();
    if (existsSync(claudeDir)) {
      await fs.rm(claudeDir, { recursive: true, force: true });
    }
  });

  afterEach(async () => {
    const claudeDir = getClaudeDir();
    if (existsSync(claudeDir)) {
      await fs.rm(claudeDir, { recursive: true, force: true });
    }
  });

  it('should verify complete and valid directory structure', async () => {
    await createScenarioDirectory();

    const verification = await verifyScenarioDirectory();

    expect(verification.valid).toBe(true);
    expect(verification.missing).toHaveLength(0);
    expect(verification.permissionErrors).toHaveLength(0);
    expect(verification.details.claudeDir.exists).toBe(true);
    expect(verification.details.claudeDir.writable).toBe(true);
    expect(verification.details.scenariosDir.exists).toBe(true);
    expect(verification.details.scenariosDir.writable).toBe(true);
  });

  it('should detect missing directories', async () => {
    const verification = await verifyScenarioDirectory();

    expect(verification.valid).toBe(false);
    expect(verification.missing.length).toBeGreaterThan(0);
    expect(verification.missing).toContain(getClaudeDir());
  });

  it('should detect missing subdirectories', async () => {
    // Create main directory but not subdirectories
    await fs.mkdir(getScenariosDir(), { recursive: true });

    const verification = await verifyScenarioDirectory();

    expect(verification.valid).toBe(false);
    expect(verification.missing).toContain(getScenarioSubdir('examples'));
    expect(verification.missing).toContain(getScenarioSubdir('templates'));
    expect(verification.missing).toContain(getScenarioSubdir('user'));
  });
});

describe('Scenario Directory - Statistics', () => {
  beforeEach(async () => {
    const claudeDir = getClaudeDir();
    if (existsSync(claudeDir)) {
      await fs.rm(claudeDir, { recursive: true, force: true });
    }
  });

  afterEach(async () => {
    const claudeDir = getClaudeDir();
    if (existsSync(claudeDir)) {
      await fs.rm(claudeDir, { recursive: true, force: true });
    }
  });

  it('should return stats for non-existent directory', async () => {
    const stats = await getScenarioStats();

    expect(stats.exists).toBe(false);
    expect(stats.totalScenarios).toBe(0);
    expect(stats.userScenarios).toBe(0);
    expect(stats.exampleScenarios).toBe(0);
    expect(stats.templates).toBe(0);
  });

  it('should return stats for empty directory', async () => {
    await createScenarioDirectory();

    const stats = await getScenarioStats();

    expect(stats.exists).toBe(true);
    expect(stats.totalScenarios).toBe(0);
    expect(stats.userScenarios).toBe(0);
    expect(stats.exampleScenarios).toBe(0);
    expect(stats.templates).toBe(0);
  });

  it('should count user scenarios', async () => {
    await createScenarioDirectory();

    // Create test scenario files
    const userDir = getScenarioSubdir('user');
    await fs.writeFile(path.join(userDir, 'test1.yaml'), 'scenario: test1');
    await fs.writeFile(path.join(userDir, 'test2.yml'), 'scenario: test2');
    await fs.writeFile(path.join(userDir, 'readme.txt'), 'not a scenario');

    const stats = await getScenarioStats();

    expect(stats.userScenarios).toBe(2);
    expect(stats.totalScenarios).toBe(2);
  });

  it('should count examples and templates separately', async () => {
    await createScenarioDirectory();

    // Create test files
    await fs.writeFile(
      path.join(getScenarioSubdir('examples'), 'example1.yaml'),
      'scenario: example1'
    );
    await fs.writeFile(
      path.join(getScenarioSubdir('templates'), 'template1.yaml'),
      'scenario: template1'
    );

    const stats = await getScenarioStats();

    expect(stats.exampleScenarios).toBe(1);
    expect(stats.templates).toBe(1);
    expect(stats.totalScenarios).toBe(1); // Only user + examples
  });
});

describe('Scenario Directory - Edge Cases', () => {
  beforeEach(async () => {
    const claudeDir = getClaudeDir();
    if (existsSync(claudeDir)) {
      await fs.rm(claudeDir, { recursive: true, force: true });
    }
  });

  afterEach(async () => {
    const claudeDir = getClaudeDir();
    if (existsSync(claudeDir)) {
      await fs.rm(claudeDir, { recursive: true, force: true });
    }
  });

  it('should handle nested directory creation with recursive option', async () => {
    const result = await createScenarioDirectory();

    expect(result.success).toBe(true);
    expect(existsSync(getScenarioSubdir('user'))).toBe(true);
  });

  it('should not overwrite existing README files', async () => {
    await createScenarioDirectory();

    // Modify a README
    const readmePath = path.join(getScenariosDir(), 'README.md');
    const customContent = '# Custom Content';
    await fs.writeFile(readmePath, customContent);

    // Create again
    await createScenarioDirectory();

    // Verify custom content is preserved
    const content = await fs.readFile(readmePath, 'utf-8');
    expect(content).toBe(customContent);
  });

  it('should handle special characters in paths correctly', () => {
    const subdir = getScenarioSubdir('test-with-dashes');
    expect(subdir).toContain('test-with-dashes');
  });
});

