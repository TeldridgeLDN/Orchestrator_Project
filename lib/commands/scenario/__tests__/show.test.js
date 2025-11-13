/**
 * Tests for Scenario Show Command
 * 
 * @group unit
 */

import { describe, it, expect } from 'vitest';
import { showCommand } from '../show.js';

describe('Scenario Show Command', () => {
  it('should create a valid Commander.js command', () => {
    const command = showCommand();
    
    expect(command).toBeDefined();
    expect(command.name()).toBe('show');
  });

  it('should have required argument', () => {
    const command = showCommand();
    
    expect(command.registeredArguments).toHaveLength(1);
    expect(command.registeredArguments[0].name()).toBe('name');
  });

  it('should have required options', () => {
    const command = showCommand();
    const options = command.options.map(opt => opt.long);
    
    expect(options).toContain('--json');
    expect(options).toContain('--verbose');
  });

  it('should have proper description', () => {
    const command = showCommand();
    
    expect(command.description()).toContain('detailed information');
  });
});

