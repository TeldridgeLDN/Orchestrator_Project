/**
 * Tests for Scenario List Command
 * 
 * @group unit
 */

import { describe, it, expect } from 'vitest';
import { listCommand } from '../list.js';

describe('Scenario List Command', () => {
  it('should create a valid Commander.js command', () => {
    const command = listCommand();
    
    expect(command).toBeDefined();
    expect(command.name()).toBe('list');
  });

  it('should have required options', () => {
    const command = listCommand();
    const options = command.options.map(opt => opt.long);
    
    expect(options).toContain('--status');
    expect(options).toContain('--json');
  });

  it('should have proper description', () => {
    const command = listCommand();
    
    expect(command.description()).toContain('available scenarios');
  });
});

