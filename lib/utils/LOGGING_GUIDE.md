# Logging System Guide

## Overview

The diet103 logging system provides structured, centralized logging with multiple log levels, context tracking, error aggregation, and automatic sensitive data redaction.

## Features

- **Multiple Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL
- **Structured Logging**: Consistent JSON format for machine-readable logs
- **Context Tracking**: Session IDs and custom context for related log entries
- **Error Aggregation**: Prevents log flooding from repeated errors
- **Sensitive Data Redaction**: Automatically redacts API keys, passwords, tokens, etc.
- **File & Console Output**: Configurable output destinations
- **Child Loggers**: Create scoped loggers with additional context

## Quick Start

### Using the Default Logger

```javascript
import { log } from '../utils/logger.js';

// Simple logging
log.info('Server started successfully');
log.warn('Resource usage is high', { cpu: 85, memory: 90 });
log.error('Failed to connect to database', error, { host: 'localhost', port: 5432 });
```

### Creating a Custom Logger

```javascript
import { createLogger, LogLevel } from '../utils/logger.js';

const logger = createLogger({
  level: LogLevel.DEBUG,
  logFile: '/var/log/diet103/app.log',
  enableFile: true,
  enableConsole: true,
  context: {
    module: 'auth',
    version: '1.0.0'
  }
});

logger.debug('Authentication flow started', { userId: 123 });
```

## Log Levels

### DEBUG (0)
- Detailed diagnostic information
- Use for development and troubleshooting
- Not shown in production by default

```javascript
logger.debug('Processing request', { 
  method: 'POST',
  path: '/api/users',
  payload: { username: 'john' }
});
```

### INFO (1)
- General informational messages
- Normal operation events
- User actions and system events

```javascript
logger.info('User registered successfully', { 
  userId: 123,
  email: 'user@example.com'
});
```

### WARN (2)
- Warning messages for potentially harmful situations
- System degradation
- Recoverable errors

```javascript
logger.warn('API rate limit approaching', {
  current: 95,
  limit: 100,
  window: '1m'
});
```

### ERROR (3)
- Error events that might still allow the application to continue
- Includes error aggregation to prevent log flooding
- Requires error object parameter

```javascript
logger.error('Database query failed', error, {
  query: 'SELECT * FROM users',
  duration: 5000
});
```

### FATAL (4)
- Very severe error events that will presumably lead the application to abort
- Always logged, bypasses aggregation
- Use sparingly for critical failures

```javascript
logger.fatal('Database connection pool exhausted', error, {
  poolSize: 10,
  activeConnections: 10,
  queuedRequests: 50
});
```

## Configuration

### Environment Variables

```bash
# Log level (DEBUG, INFO, WARN, ERROR, FATAL)
export LOG_LEVEL=INFO

# Log file path (enables file logging if set)
export LOG_FILE=/var/log/diet103/app.log

# Alternative: diet103-specific log level
export DIET103_LOG_LEVEL=DEBUG
```

### Programmatic Configuration

```javascript
const logger = createLogger({
  level: LogLevel.INFO,              // Minimum log level
  logFile: '/path/to/file.log',      // Log file path
  enableConsole: true,                // Console output
  enableFile: false,                  // File output
  prettyPrint: true,                  // Pretty-print JSON in console
  includeTimestamp: true,             // Include timestamps
  includeLevel: true,                 // Include log level
  sessionId: 'custom-session-id',     // Custom session ID
  context: {                          // Base context
    module: 'my-module',
    environment: 'production'
  }
});
```

## Context Tracking

### Session IDs

Every logger instance has a unique session ID that tracks related log entries:

```javascript
const logger = getLogger();
console.log(logger.sessionId); // e.g., "1699564123456-a7b3c2d"
```

### Adding Context

```javascript
// Set context on existing logger
logger.setContext({
  userId: 123,
  requestId: 'req-456'
});

// All subsequent logs will include this context
logger.info('Operation completed'); 
// Includes: { userId: 123, requestId: 'req-456' }
```

### Child Loggers

Create scoped loggers with additional context:

```javascript
const baseLogger = getLogger();
const userLogger = baseLogger.child({ userId: 123, module: 'user-service' });
const orderLogger = userLogger.child({ orderId: 456 });

orderLogger.info('Order processed');
// Context: { userId: 123, module: 'user-service', orderId: 456 }
```

## Error Aggregation

The logging system automatically aggregates repeated errors to prevent log flooding:

```javascript
// First occurrence: Logged immediately
logger.error('Connection timeout', error);

// Occurrences 2-9: Silently aggregated
logger.error('Connection timeout', error);

// 10th occurrence: Logged with aggregation summary
logger.error('Connection timeout', error);
// Output includes: "This error has occurred 10 times in the last 60s"
```

### Aggregation Settings

- **Window**: 60 seconds (configurable)
- **Threshold**: Log every 10th occurrence (configurable)
- **Cleanup**: Automatic cleanup every 60 seconds

## Sensitive Data Redaction

The logger automatically redacts sensitive fields:

```javascript
logger.info('User authenticated', {
  username: 'john',
  api_key: 'secret123',      // → [REDACTED]
  password: 'pass123',        // → [REDACTED]
  token: 'bearer abc',        // → [REDACTED]
  email: 'john@example.com'   // Not redacted
});
```

### Redacted Patterns

- `api_key`, `apiKey`, `API_KEY`
- `secret`, `Secret`, `SECRET`
- `password`, `Password`, `PASSWORD`
- `token`, `Token`, `TOKEN`
- `auth`, `Auth`, `AUTH`
- `credential`, `Credential`, `CREDENTIAL`
- `private_key`, `privateKey`, `PRIVATE_KEY`

## Log Format

### Console Output (Pretty)

```
2025-11-12T20:30:45.123Z [INFO] [a7b3c2d] User registered successfully
{
  "userId": 123,
  "email": "user@example.com",
  "context": {
    "module": "auth",
    "version": "1.0.0"
  }
}
```

### File Output (JSON)

```json
{
  "level": "INFO",
  "message": "User registered successfully",
  "timestamp": "2025-11-12T20:30:45.123Z",
  "sessionId": "1699564123456-a7b3c2d",
  "userId": 123,
  "email": "user@example.com",
  "context": {
    "module": "auth",
    "version": "1.0.0"
  }
}
```

## Integration with Error Handling

The logging system is automatically integrated with the error handling system:

```javascript
import { handleError } from '../utils/errors/error-handler.js';

try {
  // ... operation
} catch (error) {
  // Automatically logs with appropriate level and context
  await handleError(error, {
    operation: 'user-registration',
    context: { userId: 123 }
  });
}
```

## Best Practices

### 1. Use Appropriate Log Levels

```javascript
// ✅ Good: Informational message
logger.info('User login successful', { userId: 123 });

// ❌ Bad: Using ERROR for non-error information
logger.error('User login successful', null, { userId: 123 });
```

### 2. Include Relevant Context

```javascript
// ✅ Good: Includes context for debugging
logger.error('Payment processing failed', error, {
  orderId: 456,
  amount: 99.99,
  currency: 'USD',
  gateway: 'stripe'
});

// ❌ Bad: Missing context
logger.error('Payment failed', error);
```

### 3. Avoid Logging Sensitive Data Directly

```javascript
// ✅ Good: Uses structured data (auto-redacted)
logger.info('API call made', {
  endpoint: '/api/users',
  api_key: 'secret123'  // Will be redacted
});

// ❌ Bad: Sensitive data in message
logger.info(`API call with key: secret123`);
```

### 4. Use Child Loggers for Modules

```javascript
// ✅ Good: Module-specific logger
const authLogger = getLogger().child({ module: 'auth' });
authLogger.info('User authenticated');

// ❌ Bad: Repeating context in every log
logger.info('User authenticated', { module: 'auth' });
logger.info('Session created', { module: 'auth' });
```

### 5. Log Errors with Error Objects

```javascript
// ✅ Good: Includes error object for stack trace
logger.error('Database connection failed', error, {
  host: 'localhost',
  port: 5432
});

// ❌ Bad: Only error message
logger.error(`Database connection failed: ${error.message}`);
```

## Performance Considerations

### Asynchronous Logging

Log methods are async but don't need to be awaited in most cases:

```javascript
// Fire-and-forget (recommended for most cases)
logger.info('Operation completed', { duration: 150 });

// Await if you need to ensure log is written
await logger.error('Critical error', error, { context });
```

### Log Level Filtering

Set appropriate log levels for production to reduce overhead:

```javascript
// Development: See everything
LOG_LEVEL=DEBUG

// Production: Only warnings and errors
LOG_LEVEL=WARN
```

### Cleanup

The logger automatically cleans up aggregated errors every 60 seconds. No manual cleanup required.

## Troubleshooting

### Logs Not Appearing

1. Check log level:
   ```javascript
   logger.setLevel(LogLevel.DEBUG);
   ```

2. Verify console output is enabled:
   ```javascript
   logger.enableConsole = true;
   ```

3. Check environment variables:
   ```bash
   echo $LOG_LEVEL
   ```

### File Logging Not Working

1. Verify file path is writable:
   ```bash
   mkdir -p /var/log/diet103
   chmod 755 /var/log/diet103
   ```

2. Enable file logging:
   ```javascript
   logger.enableFile = true;
   logger.logFile = '/var/log/diet103/app.log';
   ```

### Too Many Logs

1. Increase log level:
   ```javascript
   logger.setLevel(LogLevel.WARN);
   ```

2. Check for log loops:
   - Verify you're not logging inside loops
   - Use child loggers to track source

## Examples

### Command Handler with Logging

```javascript
import { getLogger } from '../utils/logger.js';
import { createCommandErrorHandler } from '../utils/errors/index.js';

export async function myCommand(args, options) {
  const logger = getLogger().child({ 
    command: 'my-command',
    args: args 
  });
  
  const handleError = createCommandErrorHandler({
    commandName: 'my-command',
    verbose: options.verbose
  });

  try {
    logger.info('Command started');
    
    // ... operation
    
    logger.info('Command completed successfully', {
      duration: 1500,
      filesProcessed: 42
    });
    
  } catch (error) {
    logger.error('Command failed', error, {
      operation: 'file-processing',
      filesProcessed: 10
    });
    await handleError(error);
  }
}
```

### Service with Context Tracking

```javascript
import { createLogger, LogLevel } from '../utils/logger.js';

class UserService {
  constructor() {
    this.logger = createLogger({
      level: LogLevel.INFO,
      context: { service: 'UserService' }
    });
  }

  async createUser(userData) {
    const logger = this.logger.child({ 
      operation: 'createUser',
      email: userData.email 
    });

    logger.info('Creating user');

    try {
      // ... create user logic
      logger.info('User created successfully', { userId: newUser.id });
      return newUser;
    } catch (error) {
      logger.error('User creation failed', error, {
        validationErrors: error.validationErrors
      });
      throw error;
    }
  }
}
```

## API Reference

See `lib/utils/logger.js` for complete API documentation.

### Key Classes

- `Logger` - Main logger class
- `ErrorAggregator` - Error aggregation tracking

### Key Functions

- `getLogger()` - Get/create default logger
- `createLogger(options)` - Create new logger instance
- `log.debug/info/warn/error/fatal()` - Convenience methods

### Key Constants

- `LogLevel.DEBUG/INFO/WARN/ERROR/FATAL` - Log level constants

