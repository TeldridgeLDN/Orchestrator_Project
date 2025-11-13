/**
 * Tests for Scenario Scaffold Command
 * 
 * @group unit
 */

import { describe, it, expect } from 'vitest';
import { scaffoldCommand } from '../scaffold.js';

describe('Scenario Scaffold Command', () => {
  it('should have correct command name', () => {
    const command = scaffoldCommand();
    
    expect(command.name()).toBe('scaffold');
  });

  it('should have description', () => {
    const command = scaffoldCommand();
    
    expect(command.description()).toContain('orchestrator components');
  });

  it('should require scenario argument', () => {
    const command = scaffoldCommand();
    const args = command.registeredArguments;
    
    expect(args).toHaveLength(1);
    expect(args[0].name()).toBe('scenario');
    expect(args[0].required).toBe(true);
  });

  it('should have force option', () => {
    const command = scaffoldCommand();
    const option = command.options.find(opt => opt.long === '--force');
    
    expect(option).toBeDefined();
    expect(option.short).toBe('-f');
  });

  it('should have dry-run option', () => {
    const command = scaffoldCommand();
    const option = command.options.find(opt => opt.long === '--dry-run');
    
    expect(option).toBeDefined();
    expect(option.short).toBe('-n');
  });

  it('should have yes option', () => {
    const command = scaffoldCommand();
    const option = command.options.find(opt => opt.long === '--yes');
    
    expect(option).toBeDefined();
    expect(option.short).toBe('-y');
  });

  it('should have skip-mcp option', () => {
    const command = scaffoldCommand();
    const option = command.options.find(opt => opt.long === '--skip-mcp');
    
    expect(option).toBeDefined();
  });

  it('should have claude-home option', () => {
    const command = scaffoldCommand();
    const option = command.options.find(opt => opt.long === '--claude-home');
    
    expect(option).toBeDefined();
  });

  it('should have verbose option', () => {
    const command = scaffoldCommand();
    const option = command.options.find(opt => opt.long === '--verbose');
    
    expect(option).toBeDefined();
    expect(option.short).toBe('-v');
  });

  it('should have help examples', () => {
    const command = scaffoldCommand();
    
    expect(command._helpConfiguration).toBeDefined();
  });
});

