# Logging System Documentation

Comprehensive centralized logging with structured data, sensitive data redaction, error aggregation, performance tracking, and log analysis.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Logger Configuration](#logger-configuration)
- [Log Levels](#log-levels)
- [Features](#features)
- [Log Query and Analysis](#log-query-and-analysis)
- [Integration](#integration)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

The logging system provides:
- **Structured JSON logging** for machine parsing
- **Multiple log levels** (DEBUG, INFO, WARN, ERROR, FATAL)
- **Sensitive data redaction** for security
- **Error aggregation** to prevent log flooding
- **Session tracking** for related logs
- **Performance metrics** tracking
- **Log rotation** for file size management
- **Query capabilities** for log analysis
- **Console and file output** with color coding

## Quick Start

### Basic Logging

```javascript
import { getLogger } from './utils/logger.js';

const logger = getLogger();

await logger.info('Application started', { version: '1.0.0' });
await logger.warn('Configuration missing', { key: 'apiUrl' });
await logger.error('Operation failed', error, { operation: 'fetchData' });
```

### Using Convenience Methods

```javascript
import { log } from './utils/logger.js';

await log.debug('Processing request', { userId: 123 });
await log.info('Request processed', { duration: '45ms' });
await log.error('Request failed', error, { statusCode: 500 });
```

## Logger Configuration

### Creating a Custom Logger

```javascript
import { createLogger, LogLevel } from './utils/logger.js';

const logger = createLogger({
  level: LogLevel.DEBUG,           // Minimum log level
  logFile: '/var/log/app.log',     // Log file path
  enableFile: true,                 // Enable file logging
  enableConsole: true,              // Enable console logging
  prettyPrint: true,                // Pretty print JSON in console
  includeTimestamp: true,           // Include timestamps
  maxFileSize: 10 * 1024 * 1024,   // 10MB max file size
  maxFiles: 5,                      // Keep 5 rotated files
  context: {                        // Default context
    app: 'orchestrator',
    environment: 'production'
  }
});
```

### Environment Variables

```bash
# Set log level
export LOG_LEVEL=DEBUG
export DIET103_LOG_LEVEL=INFO

# Set log file
export LOG_FILE=/var/log/app.log
```

## Log Levels

| Level | Value | Usage |
|-------|-------|-------|
| DEBUG | 0 | Detailed debugging information |
| INFO  | 1 | General informational messages |
| WARN  | 2 | Warning messages for potential issues |
| ERROR | 3 | Error conditions that need attention |
| FATAL | 4 | Critical errors requiring immediate action |

### Setting Log Level

```javascript
import { LogLevel } from './utils/logger.js';

logger.setLevel(LogLevel.DEBUG);  // Show all logs
logger.setLevel(LogLevel.ERROR);  // Only errors and fatal
```

## Features

### 1. Structured Logging

All logs are JSON structured:

```json
{
  "level": "ERROR",
  "message": "Failed to connect to database",
  "timestamp": "2025-11-12T20:00:00.000Z",
  "sessionId": "1699825200-a7b3c9",
  "errorCode": "NET-CONN-001",
  "errorMessage": "ECONNREFUSED",
  "context": {
    "host": "localhost",
    "port": 5432
  }
}
```

### 2. Sensitive Data Redaction

Automatically redacts sensitive fields:

```javascript
await logger.info('User authenticated', {
  username: 'john',
  password: 'secret123',  // Will be [REDACTED]
  apiKey: 'xyz789',       // Will be [REDACTED]
  token: 'abc123'         // Will be [REDACTED]
});
```

Redacted patterns:
- `password`, `secret`, `token`, `auth`, `credential`
- `api_key`, `api-key`, `apikey`
- `private_key`, `private-key`

### 3. Error Aggregation

Prevents log flooding by aggregating repeated errors:

```javascript
// First occurrence: logged
await logger.error('Connection failed', error);

// Occurrences 2-9: aggregated (not logged)
await logger.error('Connection failed', error);

// 10th occurrence: logged with aggregation info
// Output includes: "This error has occurred 10 times in the last 45s"
```

Configuration:
- **Window**: 60 seconds (errors outside this window start fresh)
- **Max Count**: Every 10th occurrence is logged

### 4. Session Tracking

All logs include a session ID for tracing related operations:

```javascript
const logger = getLogger();  // Auto-generates session ID

await logger.info('Request started');
await logger.info('Database query');
await logger.info('Response sent');
// All share the same session ID
```

### 5. Performance Tracking

Track operation timing:

```javascript
// Manual timing
await logger.performance('fetchData', 125, { recordCount: 50 });

// Automatic timing
const result = await logger.time('fetchData', async () => {
  return await fetchDataFromAPI();
});
// Automatically logs duration and success/error status
```

### 6. Log Rotation

Automatic rotation when file exceeds max size:

```
app.log         # Current log file
app.log.1       # Most recent rotation
app.log.2       # Older rotation
app.log.3       # Even older
app.log.4       # Oldest kept
app.log.5       # Gets deleted when new rotation happens
```

### 7. Child Loggers

Create loggers with additional context:

```javascript
const baseLogger = getLogger();
const requestLogger = baseLogger.child({
  requestId: 'req-12345',
  userId: 'user-789'
});

// All logs from requestLogger include the additional context
await requestLogger.info('Processing request');
```

### 8. Logger Metrics

Track logging activity:

```javascript
const metrics = logger.getMetrics();
console.log(metrics);
// {
//   logCount: 1523,
//   errorCount: 45,
//   warningCount: 102,
//   duration: 3600000,
//   ratePerSecond: 0.42,
//   errorRate: 0.0295
// }

// Log current metrics
await logger.logMetrics();

// Reset metrics
logger.resetMetrics();
```

## Log Query and Analysis

### Basic Queries

```javascript
import { createLogQuery } from './utils/log-query.js';

const query = createLogQuery('/var/log/app.log');

// Find all errors
const errors = await query.filter({ level: 'ERROR' });

// Find logs in time range
const recentLogs = await query.filter({
  after: new Date('2025-11-12T00:00:00Z'),
  before: new Date('2025-11-12T23:59:59Z')
});

// Search by message content
const authLogs = await query.filter({
  messageContains: 'authentication'
});

// Find specific error code
const networkErrors = await query.filter({
  errorCode: 'NET-CONN-001'
});
```

### Advanced Analysis

```javascript
// Get error rate
const errorRate = await query.getErrorRate(
  new Date('2025-11-12T00:00:00Z'),
  new Date('2025-11-12T23:59:59Z')
);
// {
//   totalLogs: 5000,
//   errorLogs: 150,
//   warningLogs: 300,
//   errorRate: 0.03,
//   warningRate: 0.06
// }

// Find most common errors
const topErrors = await query.topErrors(10);
// Returns top 10 errors with counts and examples

// Performance statistics
const perfStats = await query.getPerformanceStats('fetchData');
// {
//   operation: 'fetchData',
//   count: 1000,
//   avgDuration: 125.5,
//   minDuration: 45,
//   maxDuration: 850,
//   p50: 110,
//   p95: 250,
//   p99: 500
// }

// Find problem sessions
const problemSessions = await query.findProblemSessions();
// Returns sessions with errors, sorted by error count

// Generate comprehensive report
const report = await query.generateReport(
  new Date('2025-11-12T00:00:00Z'),
  new Date('2025-11-12T23:59:59Z')
);
```

### Grouping

```javascript
// Group by error code
const byErrorCode = await query.groupBy('errorCode', {
  level: 'ERROR'
});

// Group by session ID
const bySess = await query.groupBy('sessionId');
```

## Integration

### With Error Handler

The logger is fully integrated with the error handling system:

```javascript
import { handleError } from './utils/errors/index.js';

try {
  await riskyOperation();
} catch (error) {
  await handleError(error, {
    operation: 'riskyOperation',
    displayToUser: true
  });
  // Error is automatically logged with appropriate level
}
```

### With Recovery System

```javascript
import { executeWithRetry } from './utils/errors/index.js';

const { success, result } = await executeWithRetry(
  async () => await fetchData(),
  {
    maxAttempts: 3,
    verbose: true,  // Logs retry attempts
    onRetry: (error, attempt, delay) => {
      logger.warn('Retrying operation', {
        attempt,
        delay,
        error: error.message
      });
    }
  }
);
```

### In Commands

```javascript
import { createLogger } from './utils/logger.js';

export async function myCommand(options) {
  const logger = createLogger({
    context: {
      command: 'my-command',
      ...options
    }
  });

  await logger.info('Command started');
  
  try {
    // Command logic
    await logger.info('Command completed');
  } catch (error) {
    await logger.error('Command failed', error);
    throw error;
  } finally {
    logger.destroy(); // Clean up
  }
}
```

### In Hooks

```javascript
import { getLogger } from './utils/logger.js';

export async function myHook(context) {
  const logger = getLogger().child({
    hook: 'my-hook',
    context
  });

  try {
    await logger.debug('Hook executing');
    // Hook logic
    await logger.debug('Hook completed');
  } catch (error) {
    await logger.warn('Hook failed (non-blocking)', error);
    // Don't throw - hooks shouldn't block
  }
}
```

## Best Practices

### 1. Use Appropriate Log Levels

```javascript
// DEBUG: Detailed trace information
await logger.debug('Processing item', { itemId: 123, step: 3 });

// INFO: General progress and state changes
await logger.info('User logged in', { userId: 'user-123' });

// WARN: Unexpected but handled situations
await logger.warn('Deprecated API used', { endpoint: '/old/api' });

// ERROR: Error conditions that need attention
await logger.error('Failed to save', error, { id: 123 });

// FATAL: Critical failures requiring immediate action
await logger.fatal('Database unavailable', error);
```

### 2. Include Relevant Context

```javascript
// Good: Rich context
await logger.error('Payment failed', error, {
  userId: 'user-123',
  orderId: 'order-456',
  amount: 99.99,
  currency: 'USD',
  paymentMethod: 'credit_card'
});

// Bad: Minimal context
await logger.error('Payment failed', error);
```

### 3. Use Child Loggers

```javascript
// Create request-scoped logger
export async function handleRequest(req, res) {
  const logger = getLogger().child({
    requestId: req.id,
    method: req.method,
    path: req.path
  });

  // All logs automatically include request context
  await logger.info('Request started');
  await logger.info('Processing...');
  await logger.info('Request completed');
}
```

### 4. Performance Tracking

```javascript
// Use logger.time() for automatic timing
const data = await logger.time('database-query', async () => {
  return await db.query('SELECT * FROM users');
});

// Or manual if needed
const start = Date.now();
const result = await complexOperation();
await logger.performance('complex-operation', Date.now() - start, {
  resultCount: result.length
});
```

### 5. Don't Log Sensitive Data

```javascript
// Bad: Sensitive data exposed
await logger.info('User authenticated', {
  username: 'john',
  password: 'secret123'  // EXPOSED!
});

// Good: Use fields that trigger redaction
await logger.info('User authenticated', {
  username: 'john',
  passwordHash: 'abc...'  // Safe
});
```

### 6. Clean Up Resources

```javascript
const logger = createLogger({ ... });

try {
  // Use logger
} finally {
  logger.destroy(); // Stop intervals, clean up
}
```

### 7. Query Logs Efficiently

```javascript
// Good: Specific time window
const errors = await query.filter({
  level: 'ERROR',
  after: new Date(Date.now() - 3600000), // Last hour
  before: new Date()
});

// Bad: Reading entire log file
const allLogs = await query.filter({});
```

### 8. Monitor Metrics

```javascript
// Periodically log metrics
setInterval(async () => {
  await logger.logMetrics();
}, 3600000); // Every hour
```

## Examples

See [`lib/utils/LOGGING-EXAMPLES.md`](./LOGGING-EXAMPLES.md) for comprehensive examples including:
- Command logging patterns
- Hook logging patterns
- Error logging with recovery
- Performance tracking
- Log analysis workflows
- Testing with logs
- Production monitoring

## Configuration Reference

### Logger Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `level` | LogLevel | INFO | Minimum log level |
| `logFile` | string | null | Log file path |
| `enableConsole` | boolean | true | Enable console output |
| `enableFile` | boolean | false | Enable file output |
| `prettyPrint` | boolean | true | Pretty print in console |
| `includeTimestamp` | boolean | true | Include timestamps |
| `includeLevel` | boolean | true | Include log level |
| `maxFileSize` | number | 10MB | Max file size before rotation |
| `maxFiles` | number | 5 | Number of rotated files to keep |
| `context` | object | {} | Default context |
| `sessionId` | string | auto | Session identifier |

### Query Options

| Method | Purpose |
|--------|---------|
| `filter(filters)` | Filter logs by criteria |
| `findErrors(start, end)` | Find errors in time range |
| `groupBy(field, filters)` | Group logs by field |
| `count(filters)` | Count matching logs |
| `getErrorRate(start, end)` | Calculate error rate |
| `topErrors(limit, start, end)` | Most common errors |
| `getPerformanceStats(operation)` | Performance statistics |
| `findProblemSessions()` | Sessions with errors |
| `generateReport(start, end)` | Comprehensive report |

## Troubleshooting

### Logs Not Appearing

Check log level:
```javascript
logger.setLevel(LogLevel.DEBUG);
```

### File Logging Not Working

Ensure file logging is enabled:
```javascript
const logger = createLogger({
  logFile: '/var/log/app.log',
  enableFile: true  // Must be true
});
```

Check file permissions:
```bash
touch /var/log/app.log
chmod 644 /var/log/app.log
```

### Log File Growing Too Large

Adjust rotation settings:
```javascript
const logger = createLogger({
  maxFileSize: 5 * 1024 * 1024,  // 5MB
  maxFiles: 3  // Keep fewer rotations
});
```

### Performance Impact

Reduce logging overhead:
```javascript
// Use appropriate log level in production
const logger = createLogger({
  level: LogLevel.WARN,  // Only warnings and errors
  enableConsole: false,  // File only
  prettyPrint: false     // Faster output
});
```

### Memory Leaks

Always clean up:
```javascript
logger.destroy(); // Clear intervals and cleanup
```

## See Also

- [Error Handling System](./README.md)
- [Error Recovery](./RECOVERY.md)
- [Logging Examples](./LOGGING-EXAMPLES.md)

