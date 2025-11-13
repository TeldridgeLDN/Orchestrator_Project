/**
 * Tests for Scenario Explore Command
 * 
 * @group unit
 */

import { describe, it, expect } from 'vitest';
import { exploreCommand } from '../explore.js';

describe('Scenario Explore Command', () => {
  it('should create a valid Commander.js command', () => {
    const command = exploreCommand();
    
    expect(command).toBeDefined();
    expect(command.name()).toBe('explore');
  });

  it('should have required argument', () => {
    const command = exploreCommand();
    
    expect(command.registeredArguments).toHaveLength(1);
    expect(command.registeredArguments[0].name()).toBe('name');
  });

  it('should have required options', () => {
    const command = exploreCommand();
    const options = command.options.map(opt => opt.long);
    
    expect(options).toContain('--alternatives');
    expect(options).toContain('--compare');
  });

  it('should have proper description', () => {
    const command = exploreCommand();
    
    expect(command.description()).toContain('alternative');
    expect(command.description()).toContain('implementations');
  });

  it('should default to 3 alternatives', () => {
    const command = exploreCommand();
    const altOption = command.options.find(opt => opt.long === '--alternatives');
    
    expect(altOption.defaultValue).toBe('3');
  });
});

