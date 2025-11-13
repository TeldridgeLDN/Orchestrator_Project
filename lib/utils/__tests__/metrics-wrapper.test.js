/**
 * Unit tests for metrics wrapper utility
 * 
 * Tests hook wrapping, timing measurement, error tracking,
 * and integration with the metrics system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  wrapHook,
  wrapHooks,
  wrapTimedFunction,
  wrapSkill,
  wrapSkills,
  wrapCommandAction,
  isWrapped,
  safeWrapHook,
  initializeMetricsContext,
  addWarning,
  addErrorCaught,
  skipMetrics,
  shouldSkipMetrics
} from '../metrics-wrapper.js';
import {
  getHookMetrics,
  getSkillMetrics,
  clearMetrics,
  flushMetrics
} from '../metrics.js';

describe('Metrics Wrapper', () => {
  
  beforeEach(async () => {
    // Clear metrics before each test
    await clearMetrics();
  });

  afterEach(async () => {
    // Flush any pending metrics after each test
    await flushMetrics();
  });

  // ==================== Hook Wrapping Tests ====================

  describe('wrapHook', () => {
    it('should wrap a hook function and record execution', async () => {
      const mockHook = vi.fn(async (context, next) => {
        await next();
      });

      const wrapped = wrapHook('test-hook', mockHook);
      
      const context = {};
      const next = vi.fn(async () => {});

      await wrapped(context, next);

      // Verify original hook was called
      expect(mockHook).toHaveBeenCalledWith(context, next);
      
      // Flush and check metrics
      await flushMetrics();
      const metrics = await getHookMetrics('test-hook');
      
      expect(metrics).not.toBeNull();
      expect(metrics.executions).toBe(1);
      expect(metrics.avg_execution_ms).toBeGreaterThan(0);
    });

    it('should record execution timing accurately', async () => {
      const mockHook = async (context, next) => {
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 10));
        await next();
      };

      const wrapped = wrapHook('timing-hook', mockHook);
      
      await wrapped({}, async () => {});
      
      await flushMetrics();
      const metrics = await getHookMetrics('timing-hook');
      
      // Should be at least 10ms
      expect(metrics.avg_execution_ms).toBeGreaterThanOrEqual(10);
    });

    it('should track warnings issued by hook', async () => {
      const mockHook = async (context, next) => {
        context.warnings = context.warnings || [];
        context.warnings.push('Warning 1');
        context.warnings.push('Warning 2');
        await next();
      };

      const wrapped = wrapHook('warning-hook', mockHook);
      
      const context = { warnings: [] };
      await wrapped(context, async () => {});
      
      await flushMetrics();
      const metrics = await getHookMetrics('warning-hook');
      
      expect(metrics.warnings_issued).toBe(2);
    });

    it('should track errors caught by hook', async () => {
      const mockHook = async (context, next) => {
        context.errorsCaught = context.errorsCaught || [];
        context.errorsCaught.push({ message: 'Error 1' });
        context.errorsCaught.push({ message: 'Error 2' });
        await next();
      };

      const wrapped = wrapHook('error-catcher-hook', mockHook);
      
      const context = { errorsCaught: [] };
      await wrapped(context, async () => {});
      
      await flushMetrics();
      const metrics = await getHookMetrics('error-catcher-hook');
      
      expect(metrics.errors_caught).toBe(2);
    });

    it('should record hook execution errors', async () => {
      const mockHook = async (context, next) => {
        throw new Error('Hook failed');
      };

      const wrapped = wrapHook('failing-hook', mockHook);
      
      await expect(
        wrapped({}, async () => {})
      ).rejects.toThrow('Hook failed');
      
      await flushMetrics();
      const metrics = await getHookMetrics('failing-hook');
      
      expect(metrics.executions).toBe(1);
      expect(metrics.errors_encountered).toBe(1);
    });

    it('should have minimal overhead (<1ms for simple hook)', async () => {
      const mockHook = async (context, next) => {
        await next();
      };

      const wrapped = wrapHook('overhead-hook', mockHook);
      
      const start = performance.now();
      await wrapped({}, async () => {});
      const end = performance.now();
      
      const totalTime = end - start;
      
      // Total time should be <2ms for a no-op hook with wrapper overhead
      expect(totalTime).toBeLessThan(2);
    });

    it('should not track warnings if disabled', async () => {
      const mockHook = async (context, next) => {
        context.warnings = ['Warning'];
        await next();
      };

      const wrapped = wrapHook('no-warning-tracking', mockHook, {
        trackWarnings: false
      });
      
      await wrapped({ warnings: [] }, async () => {});
      
      await flushMetrics();
      const metrics = await getHookMetrics('no-warning-tracking');
      
      expect(metrics.warnings_issued).toBe(0);
    });

    it('should not track errors if disabled', async () => {
      const mockHook = async (context, next) => {
        context.errorsCaught = [{ message: 'Error' }];
        await next();
      };

      const wrapped = wrapHook('no-error-tracking', mockHook, {
        trackErrors: false
      });
      
      await wrapped({ errorsCaught: [] }, async () => {});
      
      await flushMetrics();
      const metrics = await getHookMetrics('no-error-tracking');
      
      expect(metrics.errors_caught).toBe(0);
    });
  });

  describe('wrapHooks', () => {
    it('should wrap multiple hooks at once', async () => {
      const hooks = {
        'hook1': async (context, next) => await next(),
        'hook2': async (context, next) => await next(),
        'hook3': async (context, next) => await next()
      };

      const wrapped = wrapHooks(hooks);

      expect(Object.keys(wrapped)).toHaveLength(3);
      expect(wrapped.hook1).toBeInstanceOf(Function);
      expect(wrapped.hook2).toBeInstanceOf(Function);
      expect(wrapped.hook3).toBeInstanceOf(Function);

      // Execute all wrapped hooks
      await wrapped.hook1({}, async () => {});
      await wrapped.hook2({}, async () => {});
      await wrapped.hook3({}, async () => {});

      await flushMetrics();

      // Verify all tracked
      const metrics1 = await getHookMetrics('hook1');
      const metrics2 = await getHookMetrics('hook2');
      const metrics3 = await getHookMetrics('hook3');

      expect(metrics1.executions).toBe(1);
      expect(metrics2.executions).toBe(1);
      expect(metrics3.executions).toBe(1);
    });

    it('should apply global options to all hooks', async () => {
      const hooks = {
        'hook-a': async (context, next) => {
          context.warnings = ['Warning'];
          await next();
        }
      };

      const wrapped = wrapHooks(hooks, { trackWarnings: false });

      await wrapped['hook-a']({ warnings: [] }, async () => {});
      
      await flushMetrics();
      const metrics = await getHookMetrics('hook-a');
      
      expect(metrics.warnings_issued).toBe(0);
    });
  });

  describe('wrapTimedFunction', () => {
    it('should wrap an async function with timing', async () => {
      const mockFn = async (arg) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return arg * 2;
      };

      const wrapped = wrapTimedFunction('test-function', mockFn);
      
      const result = await wrapped(21);
      
      expect(result).toBe(42);
      
      await flushMetrics();
      const metrics = await getHookMetrics('test-function');
      
      expect(metrics.executions).toBe(1);
      expect(metrics.avg_execution_ms).toBeGreaterThanOrEqual(8); // Allow for timing variance
    });

    it('should track function errors', async () => {
      const mockFn = async () => {
        throw new Error('Function failed');
      };

      const wrapped = wrapTimedFunction('failing-function', mockFn);
      
      await expect(wrapped()).rejects.toThrow('Function failed');
      
      await flushMetrics();
      const metrics = await getHookMetrics('failing-function');
      
      expect(metrics.errors_encountered).toBe(1);
    });
  });

  // ==================== Utility Functions Tests ====================

  describe('isWrapped', () => {
    it('should detect wrapped hooks', async () => {
      const mockHook = async (context, next) => await next();
      const wrapped = wrapHook('detection-hook', mockHook);
      
      expect(isWrapped(wrapped)).toBe(true);
      expect(isWrapped(mockHook)).toBe(false);
    });
  });

  describe('safeWrapHook', () => {
    it('should wrap unwrapped hooks', async () => {
      const mockHook = async (context, next) => await next();
      const wrapped = safeWrapHook('safe-hook', mockHook);
      
      expect(isWrapped(wrapped)).toBe(true);
    });

    it('should not double-wrap already wrapped hooks', async () => {
      const mockHook = async (context, next) => await next();
      const wrapped = wrapHook('already-wrapped', mockHook);
      const safeWrapped = safeWrapHook('already-wrapped', wrapped);
      
      // Should return the same function
      expect(safeWrapped).toBe(wrapped);
    });
  });

  describe('initializeMetricsContext', () => {
    it('should initialize empty context', () => {
      const context = initializeMetricsContext();
      
      expect(context.warnings).toEqual([]);
      expect(context.errorsCaught).toEqual([]);
      expect(context.metricsEnabled).toBe(true);
    });

    it('should preserve existing properties', () => {
      const context = { existingProp: 'value' };
      const initialized = initializeMetricsContext(context);
      
      expect(initialized.existingProp).toBe('value');
      expect(initialized.warnings).toEqual([]);
    });

    it('should not overwrite existing warnings/errors', () => {
      const context = {
        warnings: ['Existing warning'],
        errorsCaught: [{ message: 'Existing error' }]
      };
      
      const initialized = initializeMetricsContext(context);
      
      expect(initialized.warnings).toEqual(['Existing warning']);
      expect(initialized.errorsCaught).toEqual([{ message: 'Existing error' }]);
    });
  });

  describe('addWarning', () => {
    it('should add warning to context', () => {
      const context = {};
      addWarning(context, 'Test warning');
      
      expect(context.warnings).toEqual(['Test warning']);
    });

    it('should append to existing warnings', () => {
      const context = { warnings: ['Warning 1'] };
      addWarning(context, 'Warning 2');
      
      expect(context.warnings).toEqual(['Warning 1', 'Warning 2']);
    });
  });

  describe('addErrorCaught', () => {
    it('should add error to context', () => {
      const context = {};
      const error = new Error('Test error');
      
      addErrorCaught(context, error);
      
      expect(context.errorsCaught).toHaveLength(1);
      expect(context.errorsCaught[0].message).toBe('Test error');
      expect(context.errorsCaught[0].timestamp).toBeDefined();
    });

    it('should append to existing errors', () => {
      const context = { errorsCaught: [{ message: 'Error 1' }] };
      const error = new Error('Error 2');
      
      addErrorCaught(context, error);
      
      expect(context.errorsCaught).toHaveLength(2);
      expect(context.errorsCaught[1].message).toBe('Error 2');
    });
  });

  describe('skipMetrics', () => {
    it('should mark function to skip metrics', () => {
      const mockFn = async () => {};
      const marked = skipMetrics(mockFn);
      
      expect(shouldSkipMetrics(marked)).toBe(true);
    });

    it('should return false for unmarked functions', () => {
      const mockFn = async () => {};
      
      expect(shouldSkipMetrics(mockFn)).toBe(false);
    });
  });

  // ==================== Integration Tests ====================

  describe('Integration with Metrics System', () => {
    it('should correctly track multiple hook executions', async () => {
      const mockHook = async (context, next) => await next();
      const wrapped = wrapHook('multi-exec-hook', mockHook);
      
      // Execute 10 times
      for (let i = 0; i < 10; i++) {
        await wrapped({}, async () => {});
      }
      
      await flushMetrics();
      const metrics = await getHookMetrics('multi-exec-hook');
      
      expect(metrics.executions).toBe(10);
    });

    it('should accumulate warnings across executions', async () => {
      const mockHook = async (context, next) => {
        context.warnings = context.warnings || [];
        context.warnings.push('Warning');
        await next();
      };
      
      const wrapped = wrapHook('accumulate-warnings', mockHook);
      
      // Execute 5 times
      for (let i = 0; i < 5; i++) {
        await wrapped({ warnings: [] }, async () => {});
      }
      
      await flushMetrics();
      const metrics = await getHookMetrics('accumulate-warnings');
      
      expect(metrics.warnings_issued).toBe(5);
    });

    it('should track both successful and failed executions', async () => {
      let shouldFail = false;
      
      const mockHook = async (context, next) => {
        if (shouldFail) {
          throw new Error('Intentional failure');
        }
        await next();
      };
      
      const wrapped = wrapHook('mixed-results-hook', mockHook);
      
      // Successful execution
      await wrapped({}, async () => {});
      
      // Failed execution
      shouldFail = true;
      await expect(wrapped({}, async () => {})).rejects.toThrow();
      
      // Successful execution
      shouldFail = false;
      await wrapped({}, async () => {});
      
      await flushMetrics();
      const metrics = await getHookMetrics('mixed-results-hook');
      
      expect(metrics.executions).toBe(3);
      expect(metrics.errors_encountered).toBe(1);
    });
  });

  // ==================== Performance Tests ====================

  describe('Performance', () => {
    it('should handle high-frequency calls efficiently', async () => {
      const mockHook = async (context, next) => await next();
      const wrapped = wrapHook('high-freq-hook', mockHook);
      
      const start = performance.now();
      
      // Execute 100 times
      for (let i = 0; i < 100; i++) {
        await wrapped({}, async () => {});
      }
      
      const end = performance.now();
      const avgTime = (end - start) / 100;
      
      // Average time per call should be <1ms
      expect(avgTime).toBeLessThan(1);
    });
  });

  // ==================== Skill/Command Wrapper Tests ====================

  describe('Skill/Command Wrappers', () => {
    describe('wrapSkill', () => {
      it('should wrap a skill function and record activation', async () => {
        const mockSkill = vi.fn(async (arg) => {
          return { success: true, data: arg * 2 };
        });

        const wrapped = wrapSkill('test-skill', mockSkill);
        
        const result = await wrapped(21);

        expect(mockSkill).toHaveBeenCalledWith(21);
        expect(result).toEqual({ success: true, data: 42 });
        
        await flushMetrics();
        const metrics = await getSkillMetrics('test-skill');
        
        expect(metrics).not.toBeNull();
        expect(metrics.activations).toBe(1);
        expect(metrics.manual).toBe(1); // Default is manual
        expect(metrics.auto).toBe(0);
      });

      it('should record skill execution duration', async () => {
        const mockSkill = async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return { success: true };
        };

        const wrapped = wrapSkill('duration-skill', mockSkill);
        
        await wrapped();
        
        await flushMetrics();
        const metrics = await getSkillMetrics('duration-skill');
        
        expect(metrics.total_duration_seconds).toBeGreaterThanOrEqual(0.01);
        expect(metrics.avg_duration_seconds).toBeGreaterThanOrEqual(0.01);
      });

      it('should track errors found in result', async () => {
        const mockSkill = async () => {
          return { success: true, errorsFound: 5 };
        };

        const wrapped = wrapSkill('error-finder-skill', mockSkill);
        
        await wrapped();
        
        await flushMetrics();
        const metrics = await getSkillMetrics('error-finder-skill');
        
        expect(metrics.errors_found).toBe(5);
      });

      it('should track errors property in result', async () => {
        const mockSkill = async () => {
          return { success: false, errors: 3 };
        };

        const wrapped = wrapSkill('error-prop-skill', mockSkill);
        
        await wrapped();
        
        await flushMetrics();
        const metrics = await getSkillMetrics('error-prop-skill');
        
        expect(metrics.errors_found).toBe(3);
      });

      it('should record skill execution errors', async () => {
        const mockSkill = async () => {
          throw new Error('Skill failed');
        };

        const wrapped = wrapSkill('failing-skill', mockSkill);
        
        await expect(wrapped()).rejects.toThrow('Skill failed');
        
        await flushMetrics();
        const metrics = await getSkillMetrics('failing-skill');
        
        expect(metrics.activations).toBe(1);
        expect(metrics.errors_encountered).toBe(1);
      });

      it('should track automatic vs manual activation', async () => {
        const mockSkill = async () => ({ success: true });

        const manualWrapped = wrapSkill('manual-skill', mockSkill, { isAutomatic: false });
        const autoWrapped = wrapSkill('auto-skill', mockSkill, { isAutomatic: true });
        
        await manualWrapped();
        await autoWrapped();
        
        await flushMetrics();
        
        const manualMetrics = await getSkillMetrics('manual-skill');
        const autoMetrics = await getSkillMetrics('auto-skill');
        
        expect(manualMetrics.manual).toBe(1);
        expect(manualMetrics.auto).toBe(0);
        
        expect(autoMetrics.manual).toBe(0);
        expect(autoMetrics.auto).toBe(1);
      });

      it('should not track errors if disabled', async () => {
        const mockSkill = async () => {
          return { success: false, errorsFound: 10 };
        };

        const wrapped = wrapSkill('no-error-tracking-skill', mockSkill, {
          trackErrors: false
        });
        
        await wrapped();
        
        await flushMetrics();
        const metrics = await getSkillMetrics('no-error-tracking-skill');
        
        expect(metrics.errors_found).toBe(0);
      });
    });

    describe('wrapSkills', () => {
      it('should wrap multiple skills at once', async () => {
        const skills = {
          'skill1': async () => ({ success: true }),
          'skill2': async () => ({ success: true }),
          'skill3': async () => ({ success: true })
        };

        const wrapped = wrapSkills(skills);

        expect(Object.keys(wrapped)).toHaveLength(3);

        await wrapped.skill1();
        await wrapped.skill2();
        await wrapped.skill3();

        await flushMetrics();

        const metrics1 = await getSkillMetrics('skill1');
        const metrics2 = await getSkillMetrics('skill2');
        const metrics3 = await getSkillMetrics('skill3');

        expect(metrics1.activations).toBe(1);
        expect(metrics2.activations).toBe(1);
        expect(metrics3.activations).toBe(1);
      });

      it('should apply global options to all skills', async () => {
        const skills = {
          'skill-a': async () => ({ success: true })
        };

        const wrapped = wrapSkills(skills, { isAutomatic: true });

        await wrapped['skill-a']();
        
        await flushMetrics();
        const metrics = await getSkillMetrics('skill-a');
        
        expect(metrics.auto).toBe(1);
        expect(metrics.manual).toBe(0);
      });
    });

    describe('wrapCommandAction', () => {
      it('should wrap a Commander.js action handler', async () => {
        const actionHandler = async (options) => {
          return { created: true, name: options.name };
        };

        const wrapped = wrapCommandAction('scenario-create', actionHandler);
        
        const result = await wrapped({ name: 'test-scenario' });
        
        expect(result).toEqual({ created: true, name: 'test-scenario' });
        
        await flushMetrics();
        const metrics = await getSkillMetrics('scenario-create');
        
        expect(metrics.activations).toBe(1);
        expect(metrics.manual).toBe(1); // Commands are always manual
      });

      it('should preserve arguments for command handlers', async () => {
        const actionHandler = vi.fn(async (arg1, arg2, options) => {
          return { arg1, arg2, options };
        });

        const wrapped = wrapCommandAction('multi-arg-command', actionHandler);
        
        await wrapped('first', 'second', { flag: true });
        
        expect(actionHandler).toHaveBeenCalledWith('first', 'second', { flag: true });
      });
    });

    describe('Integration with Metrics System', () => {
      it('should track multiple skill executions', async () => {
        const mockSkill = async () => ({ success: true });
        const wrapped = wrapSkill('multi-exec-skill', mockSkill);
        
        for (let i = 0; i < 10; i++) {
          await wrapped();
        }
        
        await flushMetrics();
        const metrics = await getSkillMetrics('multi-exec-skill');
        
        expect(metrics.activations).toBe(10);
      });

      it('should accumulate duration across executions', async () => {
        const mockSkill = async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
          return { success: true };
        };
        
        const wrapped = wrapSkill('duration-accumulation', mockSkill);
        
        await wrapped();
        await wrapped();
        await wrapped();
        
        await flushMetrics();
        const metrics = await getSkillMetrics('duration-accumulation');
        
        expect(metrics.activations).toBe(3);
        expect(metrics.total_duration_seconds).toBeGreaterThanOrEqual(0.015);
      });

      it('should track both successful and failed skill executions', async () => {
        let shouldFail = false;
        
        const mockSkill = async () => {
          if (shouldFail) {
            throw new Error('Intentional failure');
          }
          return { success: true };
        };
        
        const wrapped = wrapSkill('mixed-results-skill', mockSkill);
        
        await wrapped();
        
        shouldFail = true;
        await expect(wrapped()).rejects.toThrow();
        
        shouldFail = false;
        await wrapped();
        
        await flushMetrics();
        const metrics = await getSkillMetrics('mixed-results-skill');
        
        expect(metrics.activations).toBe(3);
        expect(metrics.errors_encountered).toBe(1);
      });
    });
  });
});

