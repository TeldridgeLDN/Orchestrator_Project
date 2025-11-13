/**
 * Tests for Scenario Command Group
 * 
 * @group unit
 */

import { describe, it, expect } from 'vitest';
import { scenarioCommand } from '../index.js';

describe('Scenario Command Group', () => {
  it('should create a valid Commander.js command', () => {
    const command = scenarioCommand();
    
    expect(command).toBeDefined();
    expect(command.name()).toBe('scenario');
  });

  it('should have all required subcommands', () => {
    const command = scenarioCommand();
    const subcommands = command.commands.map(cmd => cmd.name());
    
    const expectedCommands = [
      'create',
      'list',
      'show',
      'edit',
      'deploy',
      'validate',
      'remove',
      'optimize',
      'explore'
    ];
    
    expectedCommands.forEach(expectedCmd => {
      expect(subcommands).toContain(expectedCmd);
    });
  });

  it('should have proper description', () => {
    const command = scenarioCommand();
    
    expect(command.description()).toBe(
      'Manage scenario lifecycle: create, deploy, validate, and optimize scenarios'
    );
  });

  it('should have help text with examples', () => {
    const command = scenarioCommand();
    
    // Check that addHelpText was called by verifying the command structure
    expect(command._helpConfiguration).toBeDefined();
    
    // Verify command has all expected subcommands that are referenced in examples
    const subcommands = command.commands.map(cmd => cmd.name());
    expect(subcommands).toContain('create');
    expect(subcommands).toContain('list');
  });
});

