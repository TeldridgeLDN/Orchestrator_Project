/**
 * Tests for Scenario Validate Command
 * 
 * @group unit
 */

import { describe, it, expect } from 'vitest';
import { validateCommand } from '../validate.js';

describe('Scenario Validate Command', () => {
  it('should create a valid Commander.js command', () => {
    const command = validateCommand();
    
    expect(command).toBeDefined();
    expect(command.name()).toBe('validate');
  });

  it('should have required argument', () => {
    const command = validateCommand();
    
    expect(command.registeredArguments).toHaveLength(1);
    expect(command.registeredArguments[0].name()).toBe('name');
  });

  it('should have required options', () => {
    const command = validateCommand();
    const options = command.options.map(opt => opt.long);
    
    expect(options).toContain('--strict');
    expect(options).toContain('--verbose');
  });

  it('should have proper description', () => {
    const command = validateCommand();
    
    expect(command.description()).toContain('Validate');
    expect(command.description()).toContain('scenario');
  });
});

