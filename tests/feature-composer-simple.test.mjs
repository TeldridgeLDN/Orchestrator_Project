/**
 * Simple Feature Composer Tests
 *
 * Direct Node.js tests for the FeatureComposer module
 */

import { FeatureComposer } from '../node_modules/.claude-lib/feature-composer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test utilities
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  process.stdout.write(`Testing: ${name}... `);
  testsRun++;

  try {
    fn();
    console.log('✓ PASS');
    testsPassed++;
  } catch (error) {
    console.log('✗ FAIL');
    console.log(`  Error: ${error.message}`);
    testsFailed++;
  }
}

async function asyncTest(name, fn) {
  process.stdout.write(`Testing: ${name}... `);
  testsRun++;

  try {
    await fn();
    console.log('✓ PASS');
    testsPassed++;
  } catch (error) {
    console.log('✗ FAIL');
    console.log(`  Error: ${error.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

// Setup test environment
const testDir = path.join(__dirname, '.feature-composer-test');
const claudeHome = path.join(testDir, '.claude');

function setupTestEnvironment() {
  // Clean up any existing test directory
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  // Create directory structure
  fs.mkdirSync(path.join(claudeHome, 'commands'), { recursive: true });
  fs.mkdirSync(path.join(claudeHome, 'agents', 'test_agent'), { recursive: true });

  // Create test slash command
  fs.writeFileSync(
    path.join(claudeHome, 'commands', 'greet.md'),
    'Hello, ${name}! Welcome to ${place}.'
  );

  // Create test agent config
  fs.writeFileSync(
    path.join(claudeHome, 'agents', 'test_agent', 'config.json'),
    JSON.stringify({
      agent_id: 'test_agent',
      name: 'Test Agent',
      version: '1.0.0',
      output: {
        format: 'structured',
        prefix: '[AGENT_STATUS]',
        status_codes: ['SUCCESS', 'PARTIAL', 'ERROR', 'INFO']
      }
    }, null, 2)
  );

  // Create test agent prompt
  fs.writeFileSync(
    path.join(claudeHome, 'agents', 'test_agent', 'AGENT.md'),
    '# Test Agent\n\nA simple test agent for feature composer testing.'
  );

  // Create test MCP config
  fs.writeFileSync(
    path.join(testDir, '.mcp.json'),
    JSON.stringify({
      mcpServers: {
        'test-server': {
          command: 'npx',
          args: ['-y', 'test-mcp'],
          env: { API_KEY: 'test123' }
        }
      }
    }, null, 2)
  );
}

function cleanupTestEnvironment() {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

// Run tests
console.log('\n╔════════════════════════════════════════╗');
console.log('║  Feature Composer Test Suite          ║');
console.log('╚════════════════════════════════════════╝\n');

setupTestEnvironment();

try {
  // Test 1: Constructor
  test('FeatureComposer constructor', () => {
    const composer = new FeatureComposer();
    assert(composer instanceof FeatureComposer, 'Should create instance');
    assert(typeof composer.executeSlashCommand === 'function', 'Should have executeSlashCommand method');
    assert(typeof composer.invokeSubAgent === 'function', 'Should have invokeSubAgent method');
    assert(typeof composer.queryMCP === 'function', 'Should have queryMCP method');
    assert(typeof composer.compose === 'function', 'Should have compose method');
  });

  // Test 2: Constructor with config
  test('FeatureComposer with custom config', () => {
    const customLogger = { log: () => {}, error: () => {}, debug: () => {} };
    const composer = new FeatureComposer({
      claudeHome,
      debug: true,
      logger: customLogger
    });

    assert(composer.config.debug === true, 'Should set debug mode');
    assert(composer.claudeHome === claudeHome, 'Should set claudeHome');
    assert(composer.logger === customLogger, 'Should use custom logger');
  });

  // Test 3: Execute slash command
  await asyncTest('Execute slash command with parameters', async () => {
    const composer = new FeatureComposer({ claudeHome });
    const result = await composer.executeSlashCommand('greet', {
      name: 'Alice',
      place: 'Wonderland'
    });

    assert(result.status === 'SUCCESS', 'Should return success status');
    assert(result.command === 'greet', 'Should include command name');
    assert(result.expandedPrompt.includes('Hello, Alice!'), 'Should substitute name parameter');
    assert(result.expandedPrompt.includes('Wonderland'), 'Should substitute place parameter');
  });

  // Test 4: Non-existent slash command
  await asyncTest('Error handling for non-existent command', async () => {
    const composer = new FeatureComposer({ claudeHome });

    try {
      await composer.executeSlashCommand('nonexistent', {});
      throw new Error('Should have thrown an error');
    } catch (error) {
      assert(error.message.includes('not found'), 'Should throw not found error');
    }
  });

  // Test 5: Invoke sub-agent
  await asyncTest('Invoke sub-agent', async () => {
    const composer = new FeatureComposer({ claudeHome });
    const result = await composer.invokeSubAgent(
      'test_agent',
      'Test input for agent',
      { parseResponse: true }
    );

    assert(result.agent === 'test_agent', 'Should include agent name');
    assert(result.config !== null, 'Should load agent config');
    assert(result.config.agent_id === 'test_agent', 'Should have correct agent ID');
  });

  // Test 6: Agent response parsing - SUCCESS
  test('Parse agent response - SUCCESS status', () => {
    const composer = new FeatureComposer();
    const result = composer._parseAgentResponse('[SUCCESS] Operation completed successfully');

    assertEqual(result.status, 'SUCCESS', 'Should parse SUCCESS status');
    assertEqual(result.message, 'Operation completed successfully', 'Should extract message');
    assert(result.parsed === true, 'Should mark as parsed');
  });

  // Test 7: Agent response parsing - ERROR
  test('Parse agent response - ERROR status', () => {
    const composer = new FeatureComposer();
    const result = composer._parseAgentResponse('[ERROR] Something went wrong');

    assertEqual(result.status, 'ERROR', 'Should parse ERROR status');
    assertEqual(result.message, 'Something went wrong', 'Should extract message');
  });

  // Test 8: Agent response parsing - UNKNOWN
  test('Parse agent response - no status code', () => {
    const composer = new FeatureComposer();
    const result = composer._parseAgentResponse('Just a regular message');

    assertEqual(result.status, 'UNKNOWN', 'Should default to UNKNOWN status');
    assertEqual(result.message, 'Just a regular message', 'Should use entire message');
    assert(result.parsed === false, 'Should mark as not parsed');
  });

  // Test 9: Query MCP
  await asyncTest('Query MCP server', async () => {
    const composer = new FeatureComposer({ claudeHome });

    // Change to test directory to find .mcp.json
    const originalCwd = process.cwd();
    process.chdir(testDir);

    try {
      const result = await composer.queryMCP('test-server', 'get_data', { id: 123 });

      assert(result.status === 'SUCCESS', 'Should return success status');
      assertEqual(result.mcpName, 'test-server', 'Should include MCP name');
      assertEqual(result.endpoint, 'get_data', 'Should include endpoint');
      assert(result.serverConfig !== null, 'Should include server config');
    } finally {
      process.chdir(originalCwd);
    }
  });

  // Test 10: Non-existent MCP
  await asyncTest('Error handling for non-existent MCP', async () => {
    const composer = new FeatureComposer({ claudeHome });

    const originalCwd = process.cwd();
    process.chdir(testDir);

    try {
      await composer.queryMCP('nonexistent-mcp', 'endpoint', {});
      throw new Error('Should have thrown an error');
    } catch (error) {
      assert(error.message.includes('not found'), 'Should throw not found error');
    } finally {
      process.chdir(originalCwd);
    }
  });

  // Test 11: Load agent config (caching)
  await asyncTest('Agent config caching', async () => {
    const composer = new FeatureComposer({ claudeHome });

    const config1 = await composer._loadAgentConfig('test_agent');
    const config2 = await composer._loadAgentConfig('test_agent');

    assert(config1 === config2, 'Should return cached config (same object reference)');
  });

  // Test 12: Compose multiple features
  await asyncTest('Compose multiple features', async () => {
    const composer = new FeatureComposer({ claudeHome });

    const originalCwd = process.cwd();
    process.chdir(testDir);

    try {
      const results = await composer.compose([
        {
          type: 'command',
          name: 'greet-step',
          command: 'greet',
          params: { name: 'Bob', place: 'Testing' }
        },
        {
          type: 'agent',
          name: 'agent-step',
          agent: 'test_agent',
          input: 'Test composition'
        }
      ]);

      assertEqual(results.length, 2, 'Should execute all steps');
      assertEqual(results[0].step, 'greet-step', 'Should include step name');
      assertEqual(results[0].type, 'command', 'Should include step type');
      assertEqual(results[1].step, 'agent-step', 'Should execute second step');
    } finally {
      process.chdir(originalCwd);
    }
  });

  // Test 13: Compose with onResult callback
  await asyncTest('Compose with onResult callbacks', async () => {
    const composer = new FeatureComposer({ claudeHome });
    let callbackExecuted = false;

    const results = await composer.compose([
      {
        type: 'command',
        name: 'test-step',
        command: 'greet',
        params: { name: 'Test', place: 'Callback' },
        onResult: async (result, previousResults) => {
          callbackExecuted = true;
          assert(result.status === 'SUCCESS', 'Callback should receive result');
          assertEqual(previousResults.length, 1, 'Should have access to previous results');
        }
      }
    ]);

    assert(callbackExecuted, 'onResult callback should be executed');
  });

} catch (error) {
  console.error('Unexpected test error:', error);
  testsFailed++;
} finally {
  cleanupTestEnvironment();
}

// Summary
console.log('\n╔════════════════════════════════════════╗');
console.log('║  Test Summary                          ║');
console.log('╚════════════════════════════════════════╝\n');
console.log(`  Total tests:  ${testsRun}`);
console.log(`  Passed:       ${testsPassed}`);
console.log(`  Failed:       ${testsFailed}\n`);

if (testsFailed === 0) {
  console.log('✓ All tests passed!\n');
  process.exit(0);
} else {
  console.log('✗ Some tests failed\n');
  process.exit(1);
}
