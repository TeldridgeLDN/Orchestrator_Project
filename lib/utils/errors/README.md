

# Error Management System

Comprehensive error handling framework with standardized error codes, custom error classes, user-friendly messaging, and recovery mechanisms.

## Overview

The error management system provides:

- **Standardized Error Codes** - Unique identifiers for each error type
- **Custom Error Classes** - Typed errors with metadata
- **User-Friendly Messages** - Clear, actionable error messages
- **Consistent Logging** - Structured error logging
- **Recovery Mechanisms** - Automatic recovery for recoverable errors
- **Error Wrapping** - Converts native errors to custom errors

## Quick Start

### Basic Usage

```javascript
import { FileNotFoundError, handleError } from './utils/errors/index.js';

// Throw a custom error
throw new FileNotFoundError('/path/to/file.txt');

// Handle errors with automatic display and logging
try {
  // ... operation
} catch (error) {
  await handleError(error, {
    operation: 'readConfig',
    displayToUser: true,
    attemptRecovery: true
  });
}
```

### Command Error Handling

```javascript
import { createCommandErrorHandler } from './utils/errors/index.js';

async function myCommand(options) {
  try {
    // Command logic
  } catch (error) {
    const handler = createCommandErrorHandler({
      commandName: 'my-command',
      verbose: options.verbose,
      exitCode: 1
    });
    await handler(error);
  }
}
```

### Hook Error Handling

```javascript
import { createHookErrorHandler } from './utils/errors/index.js';

async function myHook(context, next) {
  try {
    // Hook logic
    await next();
  } catch (error) {
    const handler = createHookErrorHandler('myHook');
    await handler(error);
    // Hook continues - doesn't block execution
  }
}
```

## Error Codes

Error codes follow the format: `COMPONENT-CATEGORY-NUMBER`

### Components
- `CMD` - Commands
- `UTIL` - Utilities
- `HOOK` - Hooks
- `INIT` - Initialization
- `VAL` - Validators

### Categories
- `VAL` - Validation
- `FS` - File System
- `NET` - Network
- `CFG` - Configuration
- `EXEC` - Execution
- `DEP` - Dependency

### Common Error Codes

| Code | Description |
|------|-------------|
| `UTIL-FS-001` | File not found |
| `UTIL-FS-002` | Permission denied |
| `UTIL-CFG-001` | Invalid configuration |
| `CMD-PROJ-001` | Project not found |
| `CMD-SCEN-001` | Scenario not found |
| `HOOK-EXEC-001` | Hook execution failed |

See `error-codes.js` for the complete list.

## Custom Error Classes

### Operational Errors (Recoverable)

**File System Errors:**
```javascript
import { FileNotFoundError, PermissionError, DiskFullError } from './utils/errors/index.js';

throw new FileNotFoundError('/path/to/file');
throw new PermissionError('/restricted/file');
throw new DiskFullError('/path/to/file');
```

**Network Errors:**
```javascript
import { ConnectionError, TimeoutError } from './utils/errors/index.js';

throw new ConnectionError('Failed to connect to API');
throw new TimeoutError('https://api.example.com/data');
```

**Validation Errors:**
```javascript
import { ValidationError, JSONParseError, YAMLParseError } from './utils/errors/index.js';

throw new JSONParseError('Unexpected token at position 42');
throw new YAMLParseError('Invalid indent at line 15');
```

### Business Logic Errors

```javascript
import { 
  ProjectNotFoundError, 
  ScenarioNotFoundError,
  InsufficientRequirementsError 
} from './utils/errors/index.js';

throw new ProjectNotFoundError('my-project');
throw new ScenarioNotFoundError('test-scenario');
throw new InsufficientRequirementsError(75, 85); // score, minimum
```

### System Errors

```javascript
import { 
  InitializationError, 
  ConfigurationError,
  DependencyError 
} from './utils/errors/index.js';

throw new InitializationError('database');
throw new DependencyError('required-package');
```

## Error Handling Functions

### `handleError(error, options)`

Comprehensive error handling with logging, display, and recovery.

```javascript
await handleError(error, {
  context: { userId: '123', operation: 'save' },  // Additional context
  operation: 'saveConfig',                         // Operation name
  displayToUser: true,                            // Show error to user
  attemptRecovery: true,                          // Try recovery if possible
  recoveryFn: async (err) => {                    // Custom recovery function
    // Attempt recovery
    return fallbackValue;
  },
  verbose: false                                  // Show detailed info
});
```

### `displayError(error, options)`

Display error to the user with consistent formatting.

```javascript
displayError(error, {
  prefix: 'Error',        // Custom prefix
  verbose: false,         // Show stack trace
  exitCode: null          // Exit code (null = don't exit)
});
```

### `withErrorHandling(fn, options)`

Wrap async function with automatic error handling.

```javascript
const safeFn = withErrorHandling(async () => {
  // Your async operation
}, {
  operation: 'myOperation',
  displayToUser: true
});

await safeFn();
```

### `safeExecute(operation, options)`

Execute operation and return result object instead of throwing.

```javascript
const { success, result, error } = await safeExecute(async () => {
  // Your operation
}, {
  operation: 'riskyOperation',
  verbose: true
});

if (success) {
  console.log(result);
} else {
  console.error(error);
}
```

## Error Wrapping

Convert native errors to custom errors:

```javascript
import { wrapError, createError } from './utils/errors/index.js';

try {
  await fs.readFile('/nonexistent');
} catch (error) {
  // Automatically wraps ENOENT to FileNotFoundError
  const wrappedError = wrapError(error, 'UTIL-FS-001', { path: '/nonexistent' });
  throw wrappedError;
}

// Or create directly from code
const error = createError('CMD-PROJ-001', { name: 'my-project' });
throw error;
```

## Configuration

Configure the error handler globally:

```javascript
import { configureErrorHandler } from './utils/errors/index.js';

configureErrorHandler({
  verbose: true,              // Show detailed errors
  exitOnError: false,         // Don't exit on errors
  includeErrorCodes: true,    // Show error codes in messages
  includeStack: false,        // Show stack traces
  logToFile: false           // Log to file (future)
});
```

## Migration Guide

### From Old Pattern

```javascript
// OLD
try {
  await operation();
} catch (error) {
  console.error(chalk.red('\n❌ Error:'), error.message);
  if (verbose) {
    console.error(error.stack);
  }
  process.exit(1);
}
```

### To New Pattern

```javascript
// NEW
import { handleError, createCommandErrorHandler } from './utils/errors/index.js';

try {
  await operation();
} catch (error) {
  const handler = createCommandErrorHandler({
    commandName: 'my-command',
    verbose,
    exitCode: 1
  });
  await handler(error);
}
```

## Best Practices

### 1. Use Specific Error Classes

```javascript
// ❌ Bad
throw new Error('File not found');

// ✅ Good
throw new FileNotFoundError('/path/to/file');
```

### 2. Wrap Native Errors

```javascript
// ❌ Bad
} catch (error) {
  throw error;
}

// ✅ Good
} catch (error) {
  throw wrapError(error, 'UTIL-FS-006', { path: filePath });
}
```

### 3. Provide Context

```javascript
// ❌ Bad
throw new ValidationError('VAL-SCEN-001');

// ✅ Good
throw createError('VAL-SCEN-001', { 
  details: 'Missing required field: name',
  scenarioPath: '/path/to/scenario.yaml'
});
```

### 4. Use Appropriate Handlers

```javascript
// Commands - display and exit
const handler = createCommandErrorHandler({ commandName: 'deploy' });

// Hooks - log but don't block
const handler = createHookErrorHandler('myHook');

// Utils - propagate to caller
throw wrappedError;
```

### 5. Don't Call process.exit() Directly

```javascript
// ❌ Bad
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

// ✅ Good
} catch (error) {
  displayError(error, { exitCode: 1 });
}
```

## Error Recovery

Implement recovery functions for transient errors:

```javascript
await handleError(error, {
  attemptRecovery: true,
  recoveryFn: async (err) => {
    if (err.code === 'NET-TIMEOUT-001') {
      // Retry with exponential backoff
      return await retryWithBackoff(operation, 3);
    }
    
    if (err.code === 'UTIL-FS-001') {
      // Try alternate location
      return await tryAlternateLocation(filePath);
    }
    
    // No recovery possible
    return null;
  }
});
```

## Testing Error Handling

```javascript
import { FileNotFoundError } from './utils/errors/index.js';

describe('myFunction', () => {
  it('should throw FileNotFoundError', async () => {
    await expect(myFunction('/nonexistent'))
      .rejects
      .toThrow(FileNotFoundError);
  });

  it('should have correct error code', async () => {
    try {
      await myFunction('/nonexistent');
    } catch (error) {
      expect(error.code).toBe('UTIL-FS-001');
      expect(error.recoverable).toBe(false);
    }
  });
});
```

## Error Statistics

Get statistics about error codes:

```javascript
import { getErrorStatistics } from './utils/errors/index.js';

const stats = getErrorStatistics();
console.log(stats);
// {
//   total: 45,
//   byComponent: { commands: 12, utils: 20, hooks: 8, ... },
//   byCategory: { validation: 15, filesystem: 10, ... },
//   bySeverity: { error: 35, warning: 8, info: 2 },
//   recoverable: 18,
//   nonRecoverable: 27
// }
```

## Architecture

```
lib/utils/errors/
├── error-codes.js       # Error code registry
├── custom-errors.js     # Custom error classes
├── error-handler.js     # Error handling functions
├── index.js            # Main exports
└── README.md           # This file
```

### Error Flow

```
1. Error occurs
   ↓
2. Wrapped in custom error class (if needed)
   ↓
3. Passed to handleError()
   ↓
4. Logged with structured data
   ↓
5. Displayed to user (if configured)
   ↓
6. Recovery attempted (if recoverable)
   ↓
7. Process exit or throw (based on config)
```

## Future Enhancements

- [ ] File-based logging
- [ ] Error aggregation to prevent log flooding
- [ ] Integration with monitoring services (Sentry, etc.)
- [ ] Error analytics dashboard
- [ ] Internationalization of error messages
- [ ] Retry mechanisms with exponential backoff
- [ ] Circuit breaker patterns
- [ ] Error context enrichment (user ID, session ID)

## API Reference

See inline JSDoc comments in source files for complete API documentation.

---

**Version:** 1.0.0  
**Last Updated:** 2025-11-12  
**Subtask:** 10.2 - Implement standardized error codes and messaging system

