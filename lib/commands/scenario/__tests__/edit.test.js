/**
 * Tests for Scenario Edit Command
 * 
 * @group unit
 */

import { describe, it, expect } from 'vitest';
import { editCommand } from '../edit.js';

describe('Scenario Edit Command', () => {
  it('should create a valid Commander.js command', () => {
    const command = editCommand();
    
    expect(command).toBeDefined();
    expect(command.name()).toBe('edit');
  });

  it('should have required argument', () => {
    const command = editCommand();
    
    expect(command.registeredArguments).toHaveLength(1);
    expect(command.registeredArguments[0].name()).toBe('name');
  });

  it('should have required options', () => {
    const command = editCommand();
    const options = command.options.map(opt => opt.long);
    
    expect(options).toContain('--interactive');
    expect(options).toContain('--editor');
  });

  it('should have proper description', () => {
    const command = editCommand();
    
    expect(command.description()).toContain('Edit');
    expect(command.description()).toContain('scenario');
  });
});

