# Error Recovery System

Comprehensive error recovery mechanisms for handling transient and recoverable errors gracefully.

## Overview

The recovery system provides:
- **Automatic retry** with exponential backoff
- **Recovery strategies** for common error types
- **Graceful degradation** for non-critical features
- **Circuit breaker** pattern for preventing cascading failures
- **Timeout** handling for long-running operations

## Quick Start

### Basic Retry

```javascript
import { retryWithBackoff } from './utils/errors/index.js';

const result = await retryWithBackoff(async () => {
  return await fetchDataFromAPI();
}, {
  maxAttempts: 3,
  initialDelayMs: 200,
  onRetry: (error, attempt, delay) => {
    console.log(`Retrying attempt ${attempt} after ${delay}ms...`);
  }
});
```

### File System Operations

```javascript
import { retryFileOperation } from './utils/errors/index.js';

const data = await retryFileOperation(async () => {
  return await fs.readFile(path, 'utf-8');
});
```

### Network Operations

```javascript
import { retryNetworkOperation } from './utils/errors/index.js';

const response = await retryNetworkOperation(async () => {
  return await fetch(url);
});
```

### Automatic Recovery

```javascript
import { executeWithRecovery } from './utils/errors/index.js';

const { success, result, recovered } = await executeWithRecovery(
  async () => await riskyOperation(),
  {
    retry: true,
    fallback: async (error) => {
      // Custom fallback logic
      return defaultValue;
    },
    defaultValue: null
  }
);

if (success) {
  console.log(`Result: ${result}`);
  if (recovered) {
    console.log('Operation succeeded after recovery');
  }
}
```

### Graceful Degradation

```javascript
import { withGracefulDegradation } from './utils/errors/index.js';

const metrics = await withGracefulDegradation(
  async () => await loadMetrics(),
  {
    defaultValue: {},
    onError: (error) => {
      console.warn('Failed to load metrics, using defaults');
    }
  }
);
```

## API Reference

### `retryWithBackoff(operation, options)`

Retry an async operation with exponential backoff.

**Options:**
- `maxAttempts` (number): Maximum retry attempts (default: 3)
- `initialDelayMs` (number): Initial delay between retries (default: 100ms)
- `maxDelayMs` (number): Maximum delay between retries (default: 5000ms)
- `backoffMultiplier` (number): Backoff multiplier (default: 2)
- `jitter` (boolean): Add jitter to delays (default: true)
- `shouldRetry` (function): Custom retry condition
- `onRetry` (function): Callback before each retry

**Example:**
```javascript
const data = await retryWithBackoff(
  async () => await fetchData(),
  {
    maxAttempts: 5,
    initialDelayMs: 100,
    shouldRetry: (error) => error.code === 'ETIMEDOUT',
    onRetry: (error, attempt, delay) => {
      console.log(`Retry ${attempt}, waiting ${delay}ms`);
    }
  }
);
```

### `retryFileOperation(operation, options)`

Specialized retry for file system operations. Automatically retries on EAGAIN, EBUSY, EMFILE errors.

**Example:**
```javascript
const content = await retryFileOperation(
  async () => await fs.readFile(path, 'utf-8')
);
```

### `retryNetworkOperation(operation, options)`

Specialized retry for network operations. Automatically retries on connection errors and timeouts.

**Example:**
```javascript
const response = await retryNetworkOperation(
  async () => await fetch(apiUrl)
);
```

### `attemptRecovery(error, context)`

Attempt to recover from an error using available strategies.

**Context:**
- `operation` (string): Operation that failed
- `fallback` (function): Fallback function to execute
- `defaultValue` (any): Default value to return

**Returns:**
- `recovered` (boolean): Whether recovery succeeded
- `result` (any): Recovery result
- `strategy` (string): Strategy used ('fallback', 'default-value', 'graceful-degradation')
- `message` (string): Recovery message
- `error` (Error): Original error if recovery failed

**Example:**
```javascript
const recovery = await attemptRecovery(error, {
  operation: 'load-config',
  fallback: async () => await loadDefaultConfig(),
  defaultValue: {}
});

if (recovery.recovered) {
  return recovery.result;
}
```

### `executeWithRecovery(operation, recoveryContext)`

Execute operation with automatic recovery on failure.

**Recovery Context:**
- `retry` (boolean): Enable retry
- `retryConfig` (object): Retry configuration
- `fallback` (function): Fallback function
- `defaultValue` (any): Default value
- `operation` (string): Operation name

**Returns:**
- `success` (boolean): Whether operation succeeded
- `result` (any): Operation result
- `recovered` (boolean): Whether recovery was needed
- `recoveryStrategy` (string): Strategy used
- `originalError` (Error): Original error if recovered
- `error` (Error): Final error if failed

**Example:**
```javascript
const { success, result, recovered } = await executeWithRecovery(
  async () => await loadUserPreferences(),
  {
    retry: true,
    retryConfig: { maxAttempts: 3 },
    fallback: async () => await loadDefaultPreferences(),
    operation: 'load-preferences'
  }
);
```

### `createResilientOperation(operation, config)`

Create a resilient wrapper for an operation.

**Example:**
```javascript
const resilientFetch = createResilientOperation(
  async (url) => await fetch(url),
  {
    retry: true,
    retryConfig: { maxAttempts: 3 },
    fallback: async () => cachedData,
    operation: 'fetch-data'
  }
);

const { success, result } = await resilientFetch('https://api.example.com/data');
```

### `withGracefulDegradation(operation, options)`

Execute operation but don't throw on failure.

**Options:**
- `defaultValue` (any): Value to return on failure (default: null)
- `onError` (function): Error callback

**Example:**
```javascript
const analytics = await withGracefulDegradation(
  async () => await fetchAnalytics(),
  {
    defaultValue: { visitors: 0, pageViews: 0 },
    onError: (error) => {
      console.warn('Analytics unavailable:', error.message);
    }
  }
);
```

### `CircuitBreaker`

Prevents repeated attempts to an operation that's likely to fail.

**Configuration:**
- `failureThreshold` (number): Failures before opening circuit (default: 5)
- `resetTimeout` (number): Time before attempting reset (default: 60000ms)

**States:**
- `closed`: Normal operation
- `open`: Circuit is open, operations fail fast
- `half-open`: Testing if service recovered

**Example:**
```javascript
import { CircuitBreaker } from './utils/errors/index.js';

const breaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000
});

try {
  const result = await breaker.execute(async () => {
    return await callExternalService();
  });
} catch (error) {
  if (error.message === 'Circuit breaker is open') {
    console.log('Service temporarily unavailable');
  }
}
```

### `withTimeout(operation, timeoutMs, operationName)`

Wrap operation with timeout.

**Example:**
```javascript
import { withTimeout } from './utils/errors/index.js';

try {
  const result = await withTimeout(
    async () => await longRunningOperation(),
    5000,
    'data-processing'
  );
} catch (error) {
  console.error('Operation timed out');
}
```

## Integration with Error Handler

The recovery mechanisms are automatically integrated with the error handler:

```javascript
import { handleError, executeWithRetry } from './utils/errors/index.js';

// Automatic recovery in error handler
await handleError(error, {
  attemptRecovery: true, // Enable automatic recovery
  context: {
    fallback: async () => await loadDefaults(),
    defaultValue: {}
  }
});

// Execute with retry and error handling
const { success, result } = await executeWithRetry(
  async () => await riskyOperation(),
  {
    maxAttempts: 3,
    verbose: true
  }
);
```

## Best Practices

### 1. Choose the Right Strategy

- **Retry**: For transient errors (network, file system)
- **Fallback**: For operations with known alternatives
- **Default Value**: For non-critical data
- **Graceful Degradation**: For optional features
- **Circuit Breaker**: For external service dependencies

### 2. Configure Appropriately

```javascript
// Fast operations - short delays
retryWithBackoff(quickOp, {
  maxAttempts: 3,
  initialDelayMs: 50,
  maxDelayMs: 500
});

// External APIs - longer delays
retryNetworkOperation(apiCall, {
  maxAttempts: 5,
  initialDelayMs: 1000,
  maxDelayMs: 10000
});
```

### 3. Provide Context

```javascript
const recovery = await attemptRecovery(error, {
  operation: 'load-user-profile', // Descriptive operation name
  fallback: async () => await loadCachedProfile(),
  defaultValue: { name: 'Guest', preferences: {} }
});
```

### 4. Log Recovery Attempts

```javascript
await retryWithBackoff(operation, {
  onRetry: (error, attempt, delay) => {
    logger.warn(`Retry ${attempt}: ${error.message}`, { delay });
  }
});
```

### 5. Combine Strategies

```javascript
const breaker = new CircuitBreaker();

const result = await breaker.execute(async () => {
  return await retryNetworkOperation(
    async () => await fetch(url),
    {
      maxAttempts: 3,
      onRetry: (error, attempt) => {
        logger.warn(`API retry attempt ${attempt}`);
      }
    }
  );
});
```

## Testing Recovery

```javascript
import { retryWithBackoff, CircuitBreaker } from './utils/errors/index.js';

// Test retry logic
let attempts = 0;
const result = await retryWithBackoff(async () => {
  attempts++;
  if (attempts < 3) {
    throw new Error('Transient failure');
  }
  return 'success';
}, { maxAttempts: 5 });

console.assert(result === 'success');
console.assert(attempts === 3);

// Test circuit breaker
const breaker = new CircuitBreaker({ failureThreshold: 2 });

for (let i = 0; i < 3; i++) {
  try {
    await breaker.execute(async () => {
      throw new Error('Service down');
    });
  } catch (e) {
    // Expected
  }
}

console.assert(breaker.getState().state === 'open');
```

## Error Codes and Recoverability

The system automatically detects recoverable errors based on error codes:

**Recoverable Error Categories:**
- `CMD-EXEC-002`: Command timeouts
- `UTIL-FS-006/007`: File read/write failures
- `UTIL-CFG-003/005`: Configuration errors
- `UTIL-MET-001`: Metrics recording
- `HOOK-EXEC-001/002`: Hook execution
- `HOOK-FS-001`: Hook file access
- `NET-CONN-001`: Network connections
- `NET-TIMEOUT-001`: Network timeouts

See `error-codes.js` for the complete list.

