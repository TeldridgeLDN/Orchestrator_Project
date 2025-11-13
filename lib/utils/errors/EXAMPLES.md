# Error Handling Examples

Practical examples of how to use the error management system in different scenarios.

## Table of Contents

1. [Command Error Handling](#command-error-handling)
2. [Utility Function Errors](#utility-function-errors)
3. [Hook Error Handling](#hook-error-handling)
4. [File System Operations](#file-system-operations)
5. [Configuration Management](#configuration-management)
6. [Validation Errors](#validation-errors)
7. [Recovery Mechanisms](#recovery-mechanisms)
8. [Testing](#testing)

---

## Command Error Handling

### Scenario Command with Complete Error Handling

```javascript
import { 
  createCommandErrorHandler,
  ScenarioNotFoundError,
  ValidationError,
  wrapError
} from '../utils/errors/index.js';

export async function createScenario(name, options) {
  const handleError = createCommandErrorHandler({
    commandName: 'scenario-create',
    verbose: options.verbose,
    exitCode: 1
  });

  try {
    // Validation
    if (!name || name.trim() === '') {
      throw createError('CMD-VAL-002', { argument: 'name' });
    }

    // Check if scenario exists
    const scenarioPath = path.join(SCENARIOS_DIR, `${name}.yaml`);
    if (await fileExists(scenarioPath)) {
      throw createError('CMD-SCEN-002', { name });
    }

    // Create scenario
    await createScenarioFile(scenarioPath, options);
    
    console.log(chalk.green(`✓ Scenario "${name}" created successfully`));

  } catch (error) {
    await handleError(error);
  }
}
```

### Switch Command with Recovery

```javascript
import { 
  handleError,
  ProjectNotFoundError,
  InsufficientRequirementsError,
  configureErrorHandler
} from '../utils/errors/index.js';

export async function switchProject(projectPath, options) {
  // Configure for this command
  configureErrorHandler({
    verbose: options.verbose,
    exitOnError: false
  });

  try {
    // Validate project exists
    if (!await projectExists(projectPath)) {
      throw new ProjectNotFoundError(path.basename(projectPath));
    }

    // Check infrastructure
    const validation = await validateProject(projectPath);
    if (validation.score < 85) {
      throw new InsufficientRequirementsError(validation.score, 85);
    }

    // Switch project
    await performSwitch(projectPath);
    console.log(chalk.green('✓ Switched successfully'));

  } catch (error) {
    await handleError(error, {
      operation: 'project-switch',
      displayToUser: true,
      attemptRecovery: false
    });
    
    process.exit(1);
  }
}
```

---

## Utility Function Errors

### Config Reader with Fallback

```javascript
import { 
  wrapError,
  FileNotFoundError,
  ConfigurationError
} from '../utils/errors/index.js';

export async function readConfig(configPath) {
  try {
    // Check if file exists
    if (!await fileExists(configPath)) {
      throw new FileNotFoundError(configPath);
    }

    // Read file
    const content = await fs.readFile(configPath, 'utf-8');
    
    // Parse JSON
    let config;
    try {
      config = JSON.parse(content);
    } catch (parseError) {
      throw wrapError(parseError, 'UTIL-DATA-001', { path: configPath });
    }

    // Validate
    validateConfig(config);
    
    return config;

  } catch (error) {
    // Log error
    console.error(`Failed to read config: ${error.userMessage || error.message}`);
    
    // Return defaults for non-critical errors
    if (error instanceof FileNotFoundError) {
      return { ...DEFAULT_CONFIG };
    }
    
    // Re-throw critical errors
    throw error;
  }
}
```

### Config Writer with Backup

```javascript
import { 
  createError,
  handleError,
  RollbackSession
} from '../utils/errors/index.js';

export async function writeConfig(config, configPath) {
  const rollback = new RollbackSession();

  try {
    // Validate config
    validateConfig(config);

    // Backup existing config
    if (await fileExists(configPath)) {
      const backupPath = `${configPath}.backup`;
      await fs.copyFile(configPath, backupPath);
      rollback.recordUpdate(configPath, backupPath);
    }

    // Write new config atomically
    const tempPath = `${configPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(config, null, 2));
    rollback.recordCreate(tempPath);
    
    await fs.rename(tempPath, configPath);
    await rollback.commit();

    console.log('✅ Config saved successfully');

  } catch (error) {
    // Rollback on failure
    await rollback.rollback();
    
    throw wrapError(error, 'UTIL-CFG-004', { path: configPath });
  }
}
```

---

## Hook Error Handling

### Documentation Lifecycle Hook

```javascript
import { 
  createHookErrorHandler,
  HookExecutionError,
  safeExecute
} from '../utils/errors/index.js';

export async function documentationLifecycle(context, next) {
  const handleError = createHookErrorHandler('documentationLifecycle', {
    verbose: context.verbose || false
  });

  try {
    // Scan for new files
    const { success, result, error } = await safeExecute(async () => {
      return await scanForNewFiles(context.projectRoot);
    }, {
      operation: 'scan-files'
    });

    if (!success) {
      console.warn('⚠️  File scan failed, continuing anyway');
      // Don't block - hooks should be resilient
    } else {
      context.newFiles = result;
    }

    // Call next hook
    await next();

  } catch (error) {
    await handleError(error);
    // Don't throw - hooks shouldn't block execution
  }
}
```

### Post Tool Use Hook with Silent Failures Fixed

```javascript
import { 
  wrapError,
  displayError,
  safeExecute
} from '../utils/errors/index.js';

export async function postToolUse(context, next) {
  try {
    // Check for file changes
    const { success, result } = await safeExecute(async () => {
      return await checkForChanges(context.projectRoot);
    }, {
      operation: 'check-changes',
      verbose: context.verbose
    });

    if (success && result.changed) {
      console.log(chalk.yellow('⟳ Reloading context...'));
      await reloadContext();
    }

    await next();

  } catch (error) {
    // Log but don't block
    const wrappedError = wrapError(error, 'HOOK-EXEC-001', { 
      hookName: 'postToolUse' 
    });
    
    console.error(`⚠️  Hook error: ${wrappedError.userMessage}`);
    
    if (context.verbose) {
      console.error(wrappedError.stack);
    }
    
    // Don't throw - continue execution
  }
}
```

---

## File System Operations

### Safe File Read with Error Handling

```javascript
import { 
  FileNotFoundError,
  PermissionError,
  wrapError,
  handleError
} from '../utils/errors/index.js';

export async function safeReadFile(filePath, options = {}) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };

  } catch (error) {
    // Wrap native errors to custom errors
    let wrappedError;
    
    if (error.code === 'ENOENT') {
      wrappedError = new FileNotFoundError(filePath, error);
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      wrappedError = new PermissionError(filePath, error);
    } else {
      wrappedError = wrapError(error, 'UTIL-FS-006', { path: filePath });
    }

    if (options.fallback) {
      console.warn(`⚠️  ${wrappedError.userMessage}, using fallback`);
      return { success: false, content: options.fallback, error: wrappedError };
    }

    throw wrappedError;
  }
}
```

### Directory Operations with Recovery

```javascript
import { 
  createError,
  handleError,
  withErrorHandling
} from '../utils/errors/index.js';

export const ensureDirectory = withErrorHandling(async (dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw wrapError(error, 'UTIL-FS-005', { path: dirPath });
  }
}, {
  operation: 'ensure-directory',
  attemptRecovery: true,
  recoveryFn: async (error) => {
    // Try to fix permissions
    if (error instanceof PermissionError) {
      console.log('⟳ Attempting to fix permissions...');
      try {
        await fs.chmod(path.dirname(error.filePath), 0o755);
        await fs.mkdir(error.filePath, { recursive: true });
        return true;
      } catch (recoveryError) {
        return null;
      }
    }
    return null;
  }
});
```

---

## Configuration Management

### Validation with Detailed Errors

```javascript
import { 
  ConfigValidationError,
  createError
} from '../utils/errors/index.js';

export function validateConfig(config) {
  const errors = [];

  // Check required fields
  if (!config.version) {
    errors.push('Missing required field: version');
  }

  if (typeof config.projects !== 'object') {
    errors.push('Field "projects" must be an object');
  }

  // Validate projects
  for (const [name, project] of Object.entries(config.projects || {})) {
    if (!project.path) {
      errors.push(`Project "${name}" missing required field: path`);
    }
    
    if (project.path && !path.isAbsolute(project.path)) {
      errors.push(`Project "${name}" path must be absolute`);
    }
  }

  if (errors.length > 0) {
    throw new ConfigValidationError(errors.join('; '));
  }

  return true;
}
```

---

## Validation Errors

### Scenario Validator with Structured Errors

```javascript
import { 
  YAMLParseError,
  createError,
  safeExecute
} from '../utils/errors/index.js';

export async function validateScenario(scenarioPath) {
  // Read file
  const { success, result: content, error } = await safeExecute(async () => {
    return await fs.readFile(scenarioPath, 'utf-8');
  });

  if (!success) {
    return {
      valid: false,
      errors: [{
        code: error.code,
        message: error.userMessage,
        path: scenarioPath
      }]
    };
  }

  // Parse YAML
  let scenario;
  try {
    scenario = yaml.load(content);
  } catch (error) {
    return {
      valid: false,
      errors: [{
        code: 'UTIL-DATA-002',
        message: error.message,
        line: error.mark?.line,
        column: error.mark?.column,
        path: scenarioPath
      }]
    };
  }

  // Validate structure
  const validationErrors = [];
  
  if (!scenario.name) {
    validationErrors.push({
      code: 'VAL-SCEN-001',
      message: 'Missing required field: name',
      field: 'name'
    });
  }

  if (!scenario.steps || !Array.isArray(scenario.steps)) {
    validationErrors.push({
      code: 'VAL-SCEN-001',
      message: 'Missing or invalid field: steps (must be array)',
      field: 'steps'
    });
  }

  if (validationErrors.length > 0) {
    return {
      valid: false,
      errors: validationErrors
    };
  }

  return { valid: true };
}
```

---

## Recovery Mechanisms

### Retry with Exponential Backoff

```javascript
import { 
  TimeoutError,
  handleError,
  isRecoverable
} from '../utils/errors/index.js';

export async function retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Only retry recoverable errors
      if (!isRecoverable(error)) {
        throw error;
      }

      // Don't wait after last attempt
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⟳ Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  throw lastError;
}

// Usage
try {
  const result = await retryWithBackoff(async () => {
    return await fetchFromAPI('/data');
  }, 3, 1000);
} catch (error) {
  await handleError(error, {
    operation: 'fetch-data',
    displayToUser: true
  });
}
```

### Fallback Chain

```javascript
import { 
  FileNotFoundError,
  safeExecute
} from '../utils/errors/index.js';

export async function readConfigWithFallback(configPath) {
  // Try primary location
  const { success: success1, result: config1 } = await safeExecute(async () => {
    return await readConfig(configPath);
  });

  if (success1) return config1;

  // Try alternate location
  const alternatePath = path.join(os.homedir(), '.config', path.basename(configPath));
  const { success: success2, result: config2 } = await safeExecute(async () => {
    return await readConfig(alternatePath);
  });

  if (success2) {
    console.warn(`⚠️  Using config from alternate location: ${alternatePath}`);
    return config2;
  }

  // Use defaults
  console.warn('⚠️  Config not found in any location, using defaults');
  return DEFAULT_CONFIG;
}
```

---

## Testing

### Unit Tests for Error Handling

```javascript
import { describe, it, expect } from 'vitest';
import { 
  FileNotFoundError,
  ValidationError,
  wrapError,
  isRecoverable
} from '../utils/errors/index.js';

describe('Error Handling', () => {
  it('should create FileNotFoundError with correct properties', () => {
    const error = new FileNotFoundError('/test/file.txt');
    
    expect(error).toBeInstanceOf(FileNotFoundError);
    expect(error.code).toBe('UTIL-FS-001');
    expect(error.filePath).toBe('/test/file.txt');
    expect(error.recoverable).toBe(false);
    expect(error.userMessage).toContain('/test/file.txt');
  });

  it('should wrap native ENOENT error', () => {
    const nativeError = new Error('ENOENT: no such file');
    nativeError.code = 'ENOENT';
    nativeError.path = '/test/file.txt';

    const wrapped = wrapError(nativeError);
    
    expect(wrapped).toBeInstanceOf(FileNotFoundError);
    expect(wrapped.code).toBe('UTIL-FS-001');
    expect(wrapped.originalError).toBe(nativeError);
  });

  it('should identify recoverable errors', () => {
    const recoverable = createError('NET-TIMEOUT-001', { url: 'http://api.test' });
    const nonRecoverable = new FileNotFoundError('/test');

    expect(isRecoverable(recoverable)).toBe(true);
    expect(isRecoverable(nonRecoverable)).toBe(false);
  });

  it('should include error code in display message', () => {
    const error = new ValidationError('VAL-SCEN-001', { 
      details: 'Missing field: name' 
    });

    const message = error.getDisplayMessage(true);
    expect(message).toContain('[VAL-SCEN-001]');
    expect(message).toContain('Missing field: name');
  });
});
```

### Integration Tests

```javascript
import { describe, it, expect } from 'vitest';
import { 
  handleError,
  safeExecute,
  createCommandErrorHandler
} from '../utils/errors/index.js';

describe('Error Handler Integration', () => {
  it('should handle errors without throwing', async () => {
    const testError = new FileNotFoundError('/test/file');
    
    await expect(handleError(testError, {
      displayToUser: false,
      attemptRecovery: false
    })).resolves.toBeNull();
  });

  it('should execute safely and return result', async () => {
    const { success, result } = await safeExecute(async () => {
      return 'success';
    });

    expect(success).toBe(true);
    expect(result).toBe('success');
  });

  it('should execute safely and catch error', async () => {
    const { success, error } = await safeExecute(async () => {
      throw new Error('test error');
    }, {
      displayToUser: false
    });

    expect(success).toBe(false);
    expect(error).toBeDefined();
  });
});
```

---

## Summary

These examples demonstrate:

✅ **Consistent error handling** across commands, utils, and hooks  
✅ **Proper error wrapping** from native to custom errors  
✅ **User-friendly messaging** with technical details in verbose mode  
✅ **Recovery mechanisms** for transient failures  
✅ **Graceful degradation** with fallback values  
✅ **Silent failure fixes** with proper logging  
✅ **Structured validation** errors with details  
✅ **Comprehensive testing** of error scenarios

See `README.md` for API documentation and best practices.

