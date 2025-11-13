/**
 * Tests for Scenario Optimize Command
 * 
 * @group unit
 */

import { describe, it, expect } from 'vitest';
import { optimizeCommand } from '../optimize.js';

describe('Scenario Optimize Command', () => {
  it('should create a valid Commander.js command', () => {
    const command = optimizeCommand();
    
    expect(command).toBeDefined();
    expect(command.name()).toBe('optimize');
  });

  it('should have required argument', () => {
    const command = optimizeCommand();
    
    expect(command.registeredArguments).toHaveLength(1);
    expect(command.registeredArguments[0].name()).toBe('name');
  });

  it('should have required options', () => {
    const command = optimizeCommand();
    const options = command.options.map(opt => opt.long);
    
    expect(options).toContain('--apply');
    expect(options).toContain('--interactive');
  });

  it('should have proper description', () => {
    const command = optimizeCommand();
    
    expect(command.description()).toContain('optimize');
    expect(command.description()).toContain('scenario');
  });
});

