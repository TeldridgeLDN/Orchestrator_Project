# Error Handling Test Suite Documentation

Comprehensive test suite for the error handling system.

## Overview

This test suite verifies:
- Error code registry and utilities
- Custom error classes
- Error handler functionality
- Recovery mechanisms
- Logger integration
- End-to-end error workflows

## Test Structure

```
lib/__tests__/
├── utils/
│   └── test-helpers.js          # Testing utilities
├── errors/
│   ├── error-codes.test.js      # Error code registry tests
│   ├── custom-errors.test.js    # Custom error class tests
│   ├── error-handler.test.js    # Error handler tests
│   └── recovery.test.js         # Recovery mechanism tests
├── logger/
│   └── logger.test.js           # Logger tests
└── integration/
    └── error-handling-integration.test.js  # Integration tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test error-codes.test.js

# Run tests matching pattern
npm test -- --grep "Error Codes"
```

## Test Categories

### 1. Unit Tests - Error Codes (`error-codes.test.js`)

**Coverage:**
- Error code registry structure
- Unique error codes
- Naming convention compliance
- Required properties
- Error code utilities (getErrorDefinition, isValidErrorCode, etc.)
- Component and category breakdown
- Recoverable vs non-recoverable errors
- Message interpolation support

**Key Tests:**
- ✅ All error codes follow `COMPONENT-CATEGORY-NUMBER` format
- ✅ All codes have required properties (message, userMessage, severity, etc.)
- ✅ `getErrorDefinition()` returns correct definitions
- ✅ `isRecoverable()` correctly identifies recoverable errors
- ✅ Statistics show proper distribution across components

### 2. Unit Tests - Custom Errors (`custom-errors.test.js`)

**Coverage:**
- BaseError class
- Error class hierarchy (FileSystemError, NetworkError, etc.)
- Specific error classes (FileNotFoundError, PermissionError, etc.)
- Error creation utilities (createError, wrapError)
- Error utility functions (isRecoverable, getErrorSeverity)

**Key Tests:**
- ✅ All error classes extend BaseError properly
- ✅ Error context is preserved
- ✅ Stack traces are maintained
- ✅ Display messages format correctly
- ✅ Native errors are wrapped correctly (ENOENT → FileNotFoundError)
- ✅ Inheritance chain is maintained
- ✅ Message interpolation works

### 3. Unit Tests - Error Handler (`error-handler.test.js`)

**Coverage:**
- `handleError()` function
- `displayError()` formatting
- Command error handlers
- Hook error handlers
- `safeExecute()` utility
- `executeWithRetry()` function

**Key Tests:**
- ✅ Handles custom errors properly
- ✅ Attempts recovery for recoverable errors
- ✅ Creates appropriate error handlers
- ✅ Safe execution returns success/error objects
- ✅ Retry executes with proper backoff

### 4. Unit Tests - Recovery Mechanisms (`recovery.test.js`)

**Coverage:**
- `retryWithBackoff()` with exponential backoff
- `retryFileOperation()` for file system errors
- `retryNetworkOperation()` for network errors
- `attemptRecovery()` with fallback strategies
- Circuit breaker pattern
- Graceful degradation

**Key Tests:**
- ✅ Retries until success with proper backoff
- ✅ Respects max attempts limit
- ✅ File operations retry transient errors
- ✅ Circuit breaker opens after threshold
- ✅ Graceful degradation returns defaults

### 5. Unit Tests - Logger (`logger.test.js`)

**Coverage:**
- Logger creation and configuration
- Log levels (DEBUG, INFO, WARN, ERROR, FATAL)
- Performance tracking
- Metrics collection
- Child loggers
- Session tracking
- Log rotation (tested via integration)

**Key Tests:**
- ✅ Creates logger with custom options
- ✅ Logs at appropriate levels
- ✅ Error aggregation works
- ✅ Performance metrics are tracked
- ✅ Metrics can be retrieved and reset
- ✅ Child loggers inherit context

### 6. Integration Tests (`error-handling-integration.test.js`)

**Coverage:**
- Complete error workflows (creation → handling → recovery → logging)
- Retry with error handling and logging
- Safe execution with graceful degradation
- Error wrapping with context preservation
- Multi-layer error handling

**Key Tests:**
- ✅ End-to-end error workflow with logging and recovery
- ✅ Retry logs attempts properly
- ✅ Safe execution handles errors gracefully
- ✅ Native errors are wrapped with context
- ✅ Errors propagate correctly through layers

## Test Utilities (`test-helpers.js`)

### Mock Objects

**MockFileSystem:**
- Simulates file system errors (ENOENT, EACCES, EAGAIN, ENOSPC)
- Tracks call count for retry verification
- Configurable failure modes

**MockNetwork:**
- Simulates network errors (ECONNREFUSED, ETIMEDOUT, ENOTFOUND)
- Supports transient failures
- Call count tracking

### Helper Functions

- `createTestLogger()` - In-memory logger for testing
- `createFlakeyOperation(failCount)` - Operation that fails N times
- `captureConsole()` - Capture console output
- `createMockError(code, message)` - Create test errors
- `assertError(error, expected)` - Assert error properties
- `waitFor(condition, timeout)` - Async condition waiting
- `sleep(ms)` - Async delay

## Coverage Goals

| Component | Target | Status |
|-----------|--------|--------|
| Error Codes | 100% | ✅ |
| Custom Errors | 95%+ | ✅ |
| Error Handler | 90%+ | ✅ |
| Recovery | 85%+ | ✅ |
| Logger | 85%+ | ✅ |
| Integration | 80%+ | ✅ |

## Testing Best Practices

### 1. Use Test Helpers

```javascript
import { createTestLogger, MockFileSystem } from '../utils/test-helpers.js';

const { logger, logs } = createTestLogger();
// Test logger operations
logger.destroy(); // Clean up
```

### 2. Test Error Properties

```javascript
import { assertError } from '../utils/test-helpers.js';

assertError(error, {
  code: 'UTIL-FS-006',
  message: 'file',
  severity: 'error',
  recoverable: true
});
```

### 3. Mock External Dependencies

```javascript
const mockFs = new MockFileSystem();
mockFs.setFailureMode('EAGAIN');

// Test retry logic
const result = await retryFileOperation(
  async () => await mockFs.readFile('/test')
);
```

### 4. Verify Recovery

```javascript
let recoveryCalled = false;

const result = await handleError(error, {
  attemptRecovery: true,
  context: {
    fallback: async () => {
      recoveryCalled = true;
      return 'default';
    }
  }
});

expect(recoveryCalled).toBe(true);
```

### 5. Test Integration

```javascript
// Multi-layer error handling
async function layer3() { throw new Error('DB failed'); }
async function layer2() { return wrapError(await layer3()); }
async function layer1() { return safeExecute(layer2); }

const result = await layer1();
expect(result.success).toBe(false);
```

## Adding New Tests

### For New Error Codes

1. Add test to `error-codes.test.js`
2. Verify code format and properties
3. Test recoverability if applicable

### For New Error Classes

1. Add test to `custom-errors.test.js`
2. Test inheritance chain
3. Test error creation and wrapping
4. Verify context preservation

### For New Recovery Strategies

1. Add test to `recovery.test.js`
2. Test success path
3. Test failure scenarios
4. Verify retry/fallback behavior

## Common Test Patterns

### Testing Async Errors

```javascript
await expect(
  failingOperation()
).rejects.toThrow('Expected error');
```

### Testing Retry Logic

```javascript
let attempts = 0;
const result = await retryWithBackoff(async () => {
  attempts++;
  if (attempts < 3) throw new Error('Fail');
  return 'success';
}, { maxAttempts: 5 });

expect(attempts).toBe(3);
```

### Testing Error Display

```javascript
const consoleCapture = captureConsole();
displayError(error);
expect(consoleCapture.output.error.length).toBeGreaterThan(0);
consoleCapture.restore();
```

## Troubleshooting Tests

### Tests Timing Out

- Check for missing `await` on async operations
- Verify mock operations complete
- Increase test timeout if needed

### Cleanup Issues

- Always call `logger.destroy()` in `afterEach`
- Restore console in `afterEach`
- Clean up temp files

### Flaky Tests

- Use `waitFor()` for async conditions
- Add small delays for timing-sensitive tests
- Mock time-dependent operations

## CI/CD Integration

Tests run automatically on:
- Every commit
- Pull requests
- Before deployment

Minimum requirements:
- All tests passing
- 85%+ overall coverage
- No linter errors

## See Also

- [Error Handling System](../utils/errors/README.md)
- [Recovery Mechanisms](../utils/errors/RECOVERY.md)
- [Logging System](../utils/LOGGING.md)
- [Examples](../utils/errors/EXAMPLES.md)

