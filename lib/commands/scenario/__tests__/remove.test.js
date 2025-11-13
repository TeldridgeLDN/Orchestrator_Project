/**
 * Tests for Scenario Remove Command
 * 
 * @group unit
 */

import { describe, it, expect } from 'vitest';
import { removeCommand } from '../remove.js';

describe('Scenario Remove Command', () => {
  it('should create a valid Commander.js command', () => {
    const command = removeCommand();
    
    expect(command).toBeDefined();
    expect(command.name()).toBe('remove');
  });

  it('should have rm alias', () => {
    const command = removeCommand();
    
    expect(command.aliases()).toContain('rm');
  });

  it('should have required argument', () => {
    const command = removeCommand();
    
    expect(command.registeredArguments).toHaveLength(1);
    expect(command.registeredArguments[0].name()).toBe('name');
  });

  it('should have required options', () => {
    const command = removeCommand();
    const options = command.options.map(opt => opt.long);
    
    expect(options).toContain('--force');
    expect(options).toContain('--keep-data');
  });

  it('should have proper description', () => {
    const command = removeCommand();
    
    expect(command.description()).toContain('Remove');
    expect(command.description()).toContain('scenario');
  });
});

