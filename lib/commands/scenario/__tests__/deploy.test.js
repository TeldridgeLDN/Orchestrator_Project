/**
 * Tests for Scenario Deploy Command
 * 
 * @group unit
 */

import { describe, it, expect } from 'vitest';
import { deployCommand } from '../deploy.js';

describe('Scenario Deploy Command', () => {
  it('should create a valid Commander.js command', () => {
    const command = deployCommand();
    
    expect(command).toBeDefined();
    expect(command.name()).toBe('deploy');
  });

  it('should have required argument', () => {
    const command = deployCommand();
    
    expect(command.registeredArguments).toHaveLength(1);
    expect(command.registeredArguments[0].name()).toBe('name');
  });

  it('should have required options', () => {
    const command = deployCommand();
    const options = command.options.map(opt => opt.long);
    
    expect(options).toContain('--environment');
    expect(options).toContain('--dry-run');
    expect(options).toContain('--force');
  });

  it('should have proper description', () => {
    const command = deployCommand();
    
    expect(command.description()).toContain('Deploy');
    expect(command.description()).toContain('scenario');
  });

  it('should default to dev environment', () => {
    const command = deployCommand();
    const envOption = command.options.find(opt => opt.long === '--environment');
    
    expect(envOption.defaultValue).toBe('dev');
  });
});

