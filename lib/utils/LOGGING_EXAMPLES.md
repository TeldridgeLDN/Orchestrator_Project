# Logging System Examples

## Basic Usage Examples

### Simple Logging

```javascript
import { log } from '../utils/logger.js';

// Info message
log.info('Application started successfully');

// Warning with context
log.warn('Cache miss rate high', { 
  missRate: 0.75,
  threshold: 0.5 
});

// Error with error object
try {
  await dangerousOperation();
} catch (error) {
  log.error('Operation failed', error, { 
    operation: 'dangerous-operation',
    attempts: 3 
  });
}
```

### Creating a Module Logger

```javascript
// my-module.js
import { getLogger } from '../utils/logger.js';

const logger = getLogger().child({ module: 'my-module' });

export function processData(data) {
  logger.debug('Processing data', { dataSize: data.length });
  
  try {
    const result = transform(data);
    logger.info('Data processed successfully', { 
      inputSize: data.length,
      outputSize: result.length 
    });
    return result;
  } catch (error) {
    logger.error('Data processing failed', error, {
      inputSize: data.length,
      operation: 'transform'
    });
    throw error;
  }
}
```

## Command Handler Example

```javascript
import { getLogger } from '../utils/logger.js';
import { createCommandErrorHandler } from '../utils/errors/index.js';

export async function deployCommand(name, options) {
  // Create command-specific logger
  const logger = getLogger().child({
    command: 'deploy',
    scenario: name
  });

  const handleError = createCommandErrorHandler({
    commandName: 'deploy',
    verbose: options.verbose || false,
    exitCode: 1
  });

  logger.info('Deployment started', {
    environment: options.environment,
    dryRun: options.dryRun
  });

  try {
    // Validate
    logger.debug('Validating scenario', { scenario: name });
    const scenario = await validateScenario(name);
    logger.debug('Scenario validated', { version: scenario.version });

    // Deploy
    logger.info('Deploying scenario');
    const result = await performDeployment(scenario, options.environment);
    
    logger.info('Deployment completed successfully', {
      duration: result.duration,
      stepsCompleted: result.steps
    });

    return result;

  } catch (error) {
    logger.error('Deployment failed', error, {
      environment: options.environment,
      phase: error.phase
    });
    await handleError(error);
  }
}
```

## Service Class Example

```javascript
import { createLogger, LogLevel } from '../utils/logger.js';

export class ScenarioManager {
  constructor(options = {}) {
    this.logger = createLogger({
      level: options.logLevel || LogLevel.INFO,
      context: {
        service: 'ScenarioManager',
        version: '1.0.0'
      }
    });
  }

  async createScenario(data) {
    const logger = this.logger.child({
      operation: 'createScenario',
      scenarioName: data.name
    });

    logger.info('Creating scenario');

    // Validation
    logger.debug('Validating scenario data', {
      fieldsCount: Object.keys(data).length
    });

    const validation = this.validate(data);
    if (!validation.valid) {
      logger.warn('Scenario validation failed', {
        errors: validation.errors
      });
      throw new ValidationError('Invalid scenario data', validation.errors);
    }

    logger.debug('Validation passed');

    // Create
    try {
      const scenario = await this.saveToDatabase(data);
      
      logger.info('Scenario created successfully', {
        scenarioId: scenario.id,
        version: scenario.version
      });

      return scenario;

    } catch (error) {
      logger.error('Failed to save scenario', error, {
        database: this.dbConfig.host,
        retries: 3
      });
      throw error;
    }
  }

  async listScenarios(filters = {}) {
    const logger = this.logger.child({
      operation: 'listScenarios',
      filters
    });

    logger.debug('Listing scenarios', { filterCount: Object.keys(filters).length });

    try {
      const scenarios = await this.queryDatabase(filters);
      
      logger.info('Scenarios retrieved', {
        count: scenarios.length,
        filters
      });

      return scenarios;

    } catch (error) {
      logger.error('Failed to list scenarios', error, {
        filters,
        database: this.dbConfig.host
      });
      throw error;
    }
  }
}
```

## Hook Example

```javascript
import { getLogger } from '../utils/logger.js';
import { safeExecute } from '../utils/errors/index.js';

export async function postToolUseHook(params) {
  const logger = getLogger().child({
    hook: 'postToolUse',
    tool: params.toolName
  });

  logger.debug('Hook triggered', {
    toolName: params.toolName,
    duration: params.duration
  });

  // Non-blocking operation with logging
  const { success, error, result } = await safeExecute(async () => {
    return await updateMetrics(params);
  }, {
    operation: 'update-metrics',
    displayToUser: false
  });

  if (!success) {
    logger.warn('Failed to update metrics', {
      error: error.message,
      tool: params.toolName
    });
  } else {
    logger.debug('Metrics updated', {
      metricsCount: result.count
    });
  }

  // Log hook completion
  logger.debug('Hook completed', {
    success,
    duration: Date.now() - params.startTime
  });
}
```

## Background Task Example

```javascript
import { createLogger, LogLevel } from '../utils/logger.js';

class BackgroundProcessor {
  constructor() {
    this.logger = createLogger({
      level: LogLevel.INFO,
      logFile: '/var/log/diet103/background.log',
      enableFile: true,
      context: {
        service: 'BackgroundProcessor',
        pid: process.pid
      }
    });

    this.processedCount = 0;
    this.errorCount = 0;
  }

  async start() {
    this.logger.info('Background processor started');

    setInterval(() => {
      this.reportStats();
    }, 60000); // Report every minute

    while (true) {
      try {
        await this.processNextJob();
      } catch (error) {
        this.logger.error('Job processing failed', error, {
          processedCount: this.processedCount,
          errorCount: this.errorCount
        });
      }
    }
  }

  async processNextJob() {
    const job = await this.getNextJob();
    
    if (!job) {
      this.logger.debug('No jobs available, sleeping');
      await this.sleep(5000);
      return;
    }

    const jobLogger = this.logger.child({
      jobId: job.id,
      jobType: job.type
    });

    jobLogger.info('Processing job');

    const startTime = Date.now();

    try {
      const result = await this.executeJob(job);
      
      this.processedCount++;
      const duration = Date.now() - startTime;

      jobLogger.info('Job completed', {
        duration,
        result: result.status
      });

    } catch (error) {
      this.errorCount++;
      
      jobLogger.error('Job failed', error, {
        duration: Date.now() - startTime,
        attempts: job.attempts
      });

      throw error;
    }
  }

  reportStats() {
    this.logger.info('Background processor stats', {
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      errorRate: this.errorCount / (this.processedCount + this.errorCount),
      uptime: process.uptime()
    });
  }
}
```

## API Integration Example

```javascript
import { getLogger } from '../utils/logger.js';

export class APIClient {
  constructor(baseURL, apiKey) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    
    this.logger = getLogger().child({
      client: 'APIClient',
      baseURL: baseURL
    });

    this.logger.info('API client initialized');
  }

  async request(method, endpoint, data = null) {
    const requestId = this.generateRequestId();
    const logger = this.logger.child({
      requestId,
      method,
      endpoint
    });

    logger.debug('API request starting', {
      hasData: !!data,
      dataSize: data ? JSON.stringify(data).length : 0
    });

    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Request-ID': requestId
        },
        body: data ? JSON.stringify(data) : null
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        logger.warn('API request failed', {
          status: response.status,
          statusText: response.statusText,
          duration
        });
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();

      logger.info('API request successful', {
        status: response.status,
        duration,
        resultSize: JSON.stringify(result).length
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('API request error', error, {
        duration,
        isNetworkError: error.name === 'FetchError'
      });

      throw error;
    }
  }

  generateRequestId() {
    return `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
```

## Database Operation Example

```javascript
import { getLogger } from '../utils/logger.js';

export class DatabaseManager {
  constructor(config) {
    this.config = config;
    this.logger = getLogger().child({
      service: 'DatabaseManager',
      database: config.database
    });
  }

  async query(sql, params = []) {
    const queryId = this.generateQueryId();
    const logger = this.logger.child({ queryId });

    logger.debug('Executing query', {
      sql: sql.substring(0, 100), // First 100 chars
      paramsCount: params.length
    });

    const startTime = Date.now();

    try {
      const result = await this.connection.query(sql, params);
      const duration = Date.now() - startTime;

      // Log slow queries
      if (duration > 1000) {
        logger.warn('Slow query detected', {
          duration,
          rowCount: result.rowCount,
          sql: sql.substring(0, 100)
        });
      } else {
        logger.debug('Query completed', {
          duration,
          rowCount: result.rowCount
        });
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Query failed', error, {
        duration,
        sql: sql.substring(0, 100),
        errorCode: error.code
      });

      throw error;
    }
  }

  async transaction(callback) {
    const txLogger = this.logger.child({
      operation: 'transaction',
      txId: this.generateTxId()
    });

    txLogger.debug('Transaction starting');

    try {
      await this.connection.query('BEGIN');
      txLogger.debug('Transaction begun');

      const result = await callback(this.connection);

      await this.connection.query('COMMIT');
      txLogger.info('Transaction committed successfully');

      return result;

    } catch (error) {
      txLogger.warn('Transaction rolling back', {
        reason: error.message
      });

      try {
        await this.connection.query('ROLLBACK');
        txLogger.debug('Transaction rolled back');
      } catch (rollbackError) {
        txLogger.error('Rollback failed', rollbackError);
      }

      throw error;
    }
  }

  generateQueryId() {
    return `q-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  generateTxId() {
    return `tx-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
```

## Testing with Logging

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { createLogger, LogLevel } from '../utils/logger.js';

describe('MyService', () => {
  let service;
  let logger;
  let logEntries;

  beforeEach(() => {
    // Capture log entries for testing
    logEntries = [];
    
    logger = createLogger({
      level: LogLevel.DEBUG,
      enableConsole: false, // Disable console in tests
      enableFile: false
    });

    // Override _log to capture entries
    const originalLog = logger._log.bind(logger);
    logger._log = async (level, message, data) => {
      logEntries.push({ level, message, data });
      return originalLog(level, message, data);
    };

    service = new MyService({ logger });
  });

  it('logs successful operations', async () => {
    await service.processData({ foo: 'bar' });

    expect(logEntries).toHaveLength(2);
    expect(logEntries[0].message).toContain('Processing data');
    expect(logEntries[1].message).toContain('completed successfully');
  });

  it('logs errors with context', async () => {
    await expect(service.processData(null)).rejects.toThrow();

    const errorLog = logEntries.find(e => e.level === LogLevel.ERROR);
    expect(errorLog).toBeDefined();
    expect(errorLog.data).toHaveProperty('operation');
  });

  it('redacts sensitive data', async () => {
    await service.authenticate({ 
      username: 'john',
      password: 'secret123'
    });

    const authLog = logEntries.find(e => e.message.includes('authenticate'));
    expect(authLog.data.password).toBe('[REDACTED]');
    expect(authLog.data.username).toBe('john');
  });
});
```

These examples demonstrate real-world usage patterns for the logging system across different types of components in the diet103 codebase.

