/**
 * Tests for Scenario Create Command
 * 
 * @group unit
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createCommand } from '../create.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { getScenariosDir } from '../../../utils/scenario-directory.js';

describe('Scenario Create Command', () => {
  const testScenarioName = 'test-create-scenario';
  const scenariosDir = getScenariosDir();
  const testScenarioPath = path.join(scenariosDir, `${testScenarioName}.yaml`);
  
  // Clean up test files after each test
  afterEach(async () => {
    try {
      await fs.unlink(testScenarioPath);
    } catch (err) {
      // Ignore if file doesn't exist
    }
  });

  it('should create a valid Commander.js command', () => {
    const command = createCommand();
    
    expect(command).toBeDefined();
    expect(command.name()).toBe('create');
    expect(command.description()).toContain('scenario');
  });

  it('should have required options', () => {
    const command = createCommand();
    const options = command.options.map(opt => opt.long);
    
    expect(options).toContain('--template');
    expect(options).toContain('--name');
    expect(options).toContain('--no-interactive');
  });

  it('should have proper command structure', () => {
    const command = createCommand();
    
    // Verify command is properly configured
    expect(command.name()).toBe('create');
    expect(command.description()).toBeDefined();
    expect(command.options.length).toBeGreaterThan(0);
  });
});

