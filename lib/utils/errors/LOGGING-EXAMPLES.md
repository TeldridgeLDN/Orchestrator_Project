# Logging Examples

Comprehensive real-world examples for the centralized logging system.

## Table of Contents

- [Command Logging](#command-logging)
- [Hook Logging](#hook-logging)
- [Error Logging with Recovery](#error-logging-with-recovery)
- [Performance Tracking](#performance-tracking)
- [Log Analysis Workflows](#log-analysis-workflows)
- [Testing with Logs](#testing-with-logs)
- [Production Monitoring](#production-monitoring)

## Command Logging

### Basic Command with Logging

```javascript
import { createLogger } from './utils/logger.js';
import { createCommandErrorHandler } from './utils/errors/index.js';

export async function deployCommand(options) {
  const logger = createLogger({
    context: {
      command: 'deploy',
      environment: options.env,
      timestamp: Date.now()
    }
  });

  const handleError = createCommandErrorHandler({
    commandName: 'deploy',
    verbose: options.verbose
  });

  try {
    await logger.info('Deploy command started', {
      target: options.target,
      config: options.config
    });

    // Deploy logic
    const result = await performDeploy(options);

    await logger.info('Deploy completed successfully', {
      deployId: result.id,
      duration: result.duration
    });

    return result;
  } catch (error) {
    await logger.error('Deploy failed', error, {
      stage: error.stage,
      target: options.target
    });
    await handleError(error);
  } finally {
    logger.destroy();
  }
}
```

### Command with Performance Tracking

```javascript
export async function processCommand(files) {
  const logger = createLogger({ context: { command: 'process' } });

  try {
    await logger.info('Processing files', { count: files.length });

    // Time the entire operation
    const result = await logger.time('process-all-files', async () => {
      const processed = [];

      for (const file of files) {
        // Time each file individually
        const fileResult = await logger.time('process-file', async () => {
          return await processFile(file);
        });
        
        processed.push(fileResult);
        
        await logger.debug('File processed', {
          file,
          size: fileResult.size,
          duration: fileResult.duration
        });
      }

      return processed;
    });

    await logger.info('All files processed', {
      total: result.length,
      success: result.filter(r => r.success).length
    });

    return result;
  } finally {
    logger.destroy();
  }
}
```

## Hook Logging

### Non-Blocking Hook with Logging

```javascript
import { getLogger } from './utils/logger.js';
import { safeExecute } from './utils/errors/index.js';

export async function postToolUseHook(context) {
  const logger = getLogger().child({
    hook: 'post-tool-use',
    toolName: context.toolName
  });

  await logger.debug('Hook executing', { context });

  // Check scenario changes (non-critical)
  const { success, error } = await safeExecute(async () => {
    return await checkScenarioChanges(context.scenariosDir);
  });

  if (!success) {
    await logger.warn('Could not check scenario changes', {
      error: error.message,
      directory: context.scenariosDir
    });
    // Don't throw - hook continues
  }

  // Reload project context (non-critical)
  const reloadResult = await safeExecute(async () => {
    return await reloadProjectContext(context.projectPath);
  });

  if (!reloadResult.success) {
    await logger.warn('Could not reload project context', {
      error: reloadResult.error.message
    });
  }

  await logger.debug('Hook completed');
}
```

### Hook with Metrics

```javascript
export async function documentationLifecycleHook(context) {
  const logger = getLogger().child({
    hook: 'documentation-lifecycle'
  });

  const startTime = Date.now();
  let filesScanned = 0;
  let filesUpdated = 0;

  try {
    await logger.debug('Scanning project for documentation');

    const files = await scanProjectForDocumentation(context.projectPath);
    filesScanned = files.length;

    for (const file of files) {
      const updated = await processDocFile(file);
      if (updated) filesUpdated++;
    }

    const duration = Date.now() - startTime;
    await logger.performance('documentation-lifecycle', duration, {
      filesScanned,
      filesUpdated
    });

    await logger.debug('Hook completed', {
      filesScanned,
      filesUpdated,
      duration
    });
  } catch (error) {
    await logger.warn('Hook failed (non-blocking)', error, {
      filesScanned,
      filesUpdated
    });
  }
}
```

## Error Logging with Recovery

### With Automatic Retry

```javascript
import { executeWithRetry } from './utils/errors/index.js';
import { getLogger } from './utils/logger.js';

export async function fetchDataWithRetry(url) {
  const logger = getLogger();

  const { success, result, attempts } = await executeWithRetry(
    async () => {
      await logger.debug('Fetching data', { url });
      return await fetch(url);
    },
    {
      maxAttempts: 3,
      initialDelayMs: 200,
      verbose: true,
      onRetry: (error, attempt, delay) => {
        logger.warn('Retrying request', {
          url,
          attempt,
          delay,
          error: error.message
        });
      }
    }
  );

  if (success) {
    await logger.info('Data fetched successfully', {
      url,
      attempts: attempts || 1
    });
    return result;
  } else {
    await logger.error('Failed to fetch data after retries', result, {
      url,
      attempts
    });
    throw result;
  }
}
```

### With Fallback

```javascript
import { executeWithRecovery } from './utils/errors/index.js';
import { getLogger } from './utils/logger.js';

export async function loadConfiguration(path) {
  const logger = getLogger();

  const { success, result, recovered, recoveryStrategy } = await executeWithRecovery(
    async () => {
      return await readConfigFile(path);
    },
    {
      retry: true,
      fallback: async () => {
        await logger.warn('Using default configuration', { path });
        return getDefaultConfig();
      },
      operation: 'load-configuration'
    }
  );

  if (recovered) {
    await logger.warn('Configuration recovered', {
      strategy: recoveryStrategy,
      path
    });
  } else {
    await logger.info('Configuration loaded', { path });
  }

  return result;
}
```

## Performance Tracking

### Operation Timing

```javascript
import { getLogger } from './utils/logger.js';

export async function complexWorkflow(data) {
  const logger = getLogger();

  // Time overall workflow
  const result = await logger.time('complex-workflow', async () => {
    // Time each stage
    const validated = await logger.time('validation', async () => {
      return await validateData(data);
    });

    const transformed = await logger.time('transformation', async () => {
      return await transformData(validated);
    });

    const saved = await logger.time('persistence', async () => {
      return await saveData(transformed);
    });

    return saved;
  });

  // Log metrics periodically
  await logger.logMetrics();

  return result;
}
```

### Batch Processing with Metrics

```javascript
export async function batchProcess(items) {
  const logger = getLogger();
  const metrics = {
    total: items.length,
    processed: 0,
    failed: 0,
    totalDuration: 0
  };

  await logger.info('Batch processing started', {
    count: items.length
  });

  for (const item of items) {
    const start = Date.now();
    
    try {
      await processItem(item);
      metrics.processed++;
      
      const duration = Date.now() - start;
      metrics.totalDuration += duration;
      
      await logger.performance('process-item', duration, {
        itemId: item.id,
        success: true
      });
    } catch (error) {
      metrics.failed++;
      
      await logger.error('Item processing failed', error, {
        itemId: item.id
      });
    }
  }

  await logger.info('Batch processing completed', {
    ...metrics,
    avgDuration: metrics.totalDuration / metrics.processed
  });

  return metrics;
}
```

## Log Analysis Workflows

### Daily Error Report

```javascript
import { createLogQuery } from './utils/log-query.js';

export async function generateDailyErrorReport(logFile) {
  const query = createLogQuery(logFile);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Generate comprehensive report
  const report = await query.generateReport(today, tomorrow);

  console.log('\n=== Daily Error Report ===\n');
  console.log(`Period: ${today.toISOString()} to ${tomorrow.toISOString()}`);
  console.log(`Total Logs: ${report.totalLogs}`);
  console.log(`\nBy Level:`);
  Object.entries(report.byLevel).forEach(([level, count]) => {
    console.log(`  ${level}: ${count}`);
  });

  console.log(`\nError Rate: ${(report.errorRate.errorRate * 100).toFixed(2)}%`);
  console.log(`Warning Rate: ${(report.errorRate.warningRate * 100).toFixed(2)}%`);

  console.log(`\n=== Top 5 Errors ===`);
  report.topErrors.slice(0, 5).forEach((error, index) => {
    console.log(`\n${index + 1}. ${error.errorCode || 'Unknown'}`);
    console.log(`   Count: ${error.count}`);
    console.log(`   Message: ${error.message}`);
    console.log(`   First example: ${error.examples[0]?.timestamp}`);
  });

  console.log(`\n=== Problem Sessions (Top 5) ===`);
  report.problemSessions.slice(0, 5).forEach((session, index) => {
    console.log(`\n${index + 1}. Session ${session.sessionId.substring(0, 8)}`);
    console.log(`   Errors: ${session.errorCount}`);
    console.log(`   Duration: ${session.firstSeen} to ${session.lastSeen}`);
  });

  return report;
}
```

### Performance Analysis

```javascript
export async function analyzePerformance(logFile, operations = []) {
  const query = createLogQuery(logFile);

  console.log('\n=== Performance Analysis ===\n');

  for (const operation of operations) {
    const stats = await query.getPerformanceStats(operation);

    if (stats) {
      console.log(`\n${operation}:`);
      console.log(`  Count: ${stats.count}`);
      console.log(`  Avg: ${stats.avgDuration.toFixed(2)}ms`);
      console.log(`  Min: ${stats.minDuration}ms`);
      console.log(`  Max: ${stats.maxDuration}ms`);
      console.log(`  P50: ${stats.p50}ms`);
      console.log(`  P95: ${stats.p95}ms`);
      console.log(`  P99: ${stats.p99}ms`);
    } else {
      console.log(`\n${operation}: No data`);
    }
  }
}

// Usage
await analyzePerformance('/var/log/app.log', [
  'database-query',
  'api-request',
  'file-processing',
  'validation'
]);
```

### Find Slow Operations

```javascript
export async function findSlowOperations(logFile, thresholdMs = 1000) {
  const query = createLogQuery(logFile);

  const perfLogs = await query.filter({
    messageContains: 'Performance:'
  });

  const slowOps = perfLogs.filter(log => log.durationMs > thresholdMs);

  console.log(`\n=== Slow Operations (> ${thresholdMs}ms) ===\n`);
  console.log(`Found ${slowOps.length} slow operations\n`);

  // Group by operation
  const byOperation = {};
  for (const log of slowOps) {
    const op = log.operation || 'unknown';
    if (!byOperation[op]) {
      byOperation[op] = [];
    }
    byOperation[op].push(log);
  }

  // Display top 10 slowest
  const sorted = Object.entries(byOperation)
    .map(([operation, logs]) => ({
      operation,
      count: logs.length,
      maxDuration: Math.max(...logs.map(l => l.durationMs)),
      avgDuration: logs.reduce((sum, l) => sum + l.durationMs, 0) / logs.length
    }))
    .sort((a, b) => b.maxDuration - a.maxDuration)
    .slice(0, 10);

  sorted.forEach((item, index) => {
    console.log(`${index + 1}. ${item.operation}`);
    console.log(`   Count: ${item.count}`);
    console.log(`   Max: ${item.maxDuration.toFixed(2)}ms`);
    console.log(`   Avg: ${item.avgDuration.toFixed(2)}ms\n`);
  });
}
```

## Testing with Logs

### Capture Logs in Tests

```javascript
import { createLogger } from './utils/logger.js';
import { strict as assert } from 'assert';

describe('MyCommand', () => {
  let logEntries = [];
  let logger;

  beforeEach(() => {
    logEntries = [];
    logger = createLogger({
      enableConsole: false,
      enableFile: false
    });

    // Intercept logs
    const originalLog = logger._log.bind(logger);
    logger._log = async (level, message, data) => {
      logEntries.push({ level, message, data });
      return originalLog(level, message, data);
    };
  });

  afterEach(() => {
    logger.destroy();
  });

  it('should log command start and completion', async () => {
    await myCommand({ logger });

    assert(logEntries.some(e => e.message === 'Command started'));
    assert(logEntries.some(e => e.message === 'Command completed'));
  });

  it('should log errors on failure', async () => {
    await assert.rejects(
      async () => await failingCommand({ logger }),
      /Expected error/
    );

    const errorLogs = logEntries.filter(e => e.level === 3); // ERROR
    assert(errorLogs.length > 0);
  });
});
```

### Test Performance Logging

```javascript
it('should log performance metrics', async () => {
  const result = await logger.time('test-operation', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return 'done';
  });

  assert.strictEqual(result, 'done');
  
  const perfLogs = logEntries.filter(e => e.data?.performanceMetric);
  assert(perfLogs.length > 0);
  assert(perfLogs[0].data.durationMs >= 100);
});
```

## Production Monitoring

### Real-time Alerting

```javascript
import { createLogQuery } from './utils/log-query.js';

export async function monitorErrors(logFile, alertThreshold = 10) {
  const query = createLogQuery(logFile);
  
  // Check last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const now = new Date();

  const errorRate = await query.getErrorRate(fiveMinutesAgo, now);

  if (errorRate.errorLogs > alertThreshold) {
    // Alert!
    console.error(`\n⚠️  HIGH ERROR RATE DETECTED ⚠️`);
    console.error(`Errors in last 5 minutes: ${errorRate.errorLogs}`);
    console.error(`Error rate: ${(errorRate.errorRate * 100).toFixed(2)}%`);

    // Get top errors
    const topErrors = await query.topErrors(5, fiveMinutesAgo, now);
    console.error(`\nTop errors:`);
    topErrors.forEach((error, i) => {
      console.error(`${i + 1}. ${error.errorCode}: ${error.count} occurrences`);
    });

    // Send alert to monitoring system
    await sendAlert({
      severity: 'high',
      message: `High error rate: ${errorRate.errorLogs} errors in 5 minutes`,
      errors: topErrors
    });
  }
}

// Run every minute
setInterval(() => {
  monitorErrors('/var/log/app.log');
}, 60000);
```

### Health Check Dashboard

```javascript
export async function generateHealthDashboard(logFile) {
  const query = createLogQuery(logFile);
  
  const now = new Date();
  const oneHourAgo = new Date(now - 3600000);

  const [errorRate, topErrors, problemSessions] = await Promise.all([
    query.getErrorRate(oneHourAgo, now),
    query.topErrors(5, oneHourAgo, now),
    query.findProblemSessions()
  ]);

  // Calculate health score (0-100)
  const healthScore = Math.max(0, 100 - (errorRate.errorRate * 100 * 10));

  console.log('\n╔════════════════════════════════╗');
  console.log('║     SYSTEM HEALTH DASHBOARD    ║');
  console.log('╚════════════════════════════════╝\n');

  console.log(`Health Score: ${healthScore.toFixed(1)}/100`);
  console.log(`Status: ${healthScore > 90 ? '✅ Healthy' : healthScore > 70 ? '⚠️  Warning' : '❌ Critical'}\n`);

  console.log(`Total Logs (1h): ${errorRate.totalLogs}`);
  console.log(`Errors: ${errorRate.errorLogs} (${(errorRate.errorRate * 100).toFixed(2)}%)`);
  console.log(`Warnings: ${errorRate.warningLogs} (${(errorRate.warningRate * 100).toFixed(2)}%)\n`);

  console.log('Top Errors:');
  topErrors.forEach((error, i) => {
    console.log(`  ${i + 1}. [${error.errorCode}] ${error.count}x`);
  });

  console.log(`\nProblem Sessions: ${problemSessions.length}`);

  return { healthScore, errorRate, topErrors, problemSessions };
}

// Run every 5 minutes
setInterval(() => {
  generateHealthDashboard('/var/log/app.log');
}, 5 * 60 * 1000);
```

### Log-based Metrics Export

```javascript
export async function exportMetricsForMonitoring(logFile) {
  const query = createLogQuery(logFile);
  
  const now = new Date();
  const oneMinuteAgo = new Date(now - 60000);

  const errorRate = await query.getErrorRate(oneMinuteAgo, now);

  // Export to monitoring system (Prometheus, Datadog, etc.)
  const metrics = {
    'app.logs.total': errorRate.totalLogs,
    'app.logs.errors': errorRate.errorLogs,
    'app.logs.warnings': errorRate.warningLogs,
    'app.error_rate': errorRate.errorRate,
    'app.warning_rate': errorRate.warningRate,
    timestamp: now.toISOString()
  };

  // Send to monitoring service
  await sendMetrics(metrics);

  return metrics;
}
```

## See Also

- [Logging System Documentation](../LOGGING.md)
- [Error Handling System](./README.md)
- [Error Recovery](./RECOVERY.md)

