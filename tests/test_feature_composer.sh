#!/bin/bash
# Test suite for Feature Composer
#
# Tests the feature composition framework including:
# - Slash command execution
# - Sub-agent invocation
# - MCP querying
# - Multi-step composition
# - Output parsing
# - Error handling

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test output directory
TEST_DIR=$(mktemp -d)
trap "rm -rf $TEST_DIR" EXIT

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Feature Composer Test Suite                 ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo ""

# Helper functions
pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((TESTS_PASSED++))
  ((TESTS_RUN++))
}

fail() {
  echo -e "${RED}✗${NC} $1"
  echo -e "  ${RED}Error: $2${NC}"
  ((TESTS_FAILED++))
  ((TESTS_RUN++))
}

info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

section() {
  echo ""
  echo -e "${YELLOW}━━━ $1 ━━━${NC}"
  echo ""
}

# Test setup
setup_test_environment() {
  section "Setting up test environment"

  # Create test project structure
  mkdir -p "$TEST_DIR/test-project/.claude"/{commands,agents,lib}

  # Copy feature-composer.js to test location
  if [ -f "$HOME/.claude/lib/feature-composer.js" ]; then
    cp "$HOME/.claude/lib/feature-composer.js" "$TEST_DIR/test-project/.claude/lib/"
    pass "Copied feature-composer.js to test directory"
  else
    fail "Setup" "feature-composer.js not found at ~/.claude/lib/"
    exit 1
  fi

  # Create test slash command
  cat > "$TEST_DIR/test-project/.claude/commands/test-command.md" << 'EOF'
Test command for feature composer testing.

This command takes a parameter: ${name}

Output: Hello, ${name}!
EOF
  pass "Created test slash command"

  # Create test agent structure
  mkdir -p "$TEST_DIR/test-project/.claude/agents/test_agent"

  cat > "$TEST_DIR/test-project/.claude/agents/test_agent/config.json" << 'EOF'
{
  "agent_id": "test_agent",
  "name": "Test Agent",
  "version": "1.0.0",
  "description": "Test agent for feature composer",
  "output": {
    "format": "structured",
    "prefix": "[AGENT_STATUS]",
    "status_codes": ["SUCCESS", "PARTIAL", "ERROR", "INFO"]
  }
}
EOF

  cat > "$TEST_DIR/test-project/.claude/agents/test_agent/AGENT.md" << 'EOF'
# Test Agent

This is a test agent for feature composer testing.

## Capabilities
- Process test inputs
- Return structured responses

## Output Format
[SUCCESS] Test agent processed the input successfully
EOF
  pass "Created test agent structure"

  # Create test MCP config
  cat > "$TEST_DIR/test-project/.mcp.json" << 'EOF'
{
  "mcpServers": {
    "test-mcp": {
      "command": "npx",
      "args": ["-y", "test-mcp-server"],
      "env": {
        "TEST_API_KEY": "test_key_123"
      }
    }
  }
}
EOF
  pass "Created test MCP configuration"

  cd "$TEST_DIR/test-project"
  info "Test environment ready at: $TEST_DIR/test-project"
}

# Test 1: Module Import
test_module_import() {
  section "Test 1: Module Import"

  # Create a simple Node.js script to test import
  cat > "$TEST_DIR/test-import.mjs" << EOF
import { FeatureComposer } from '$TEST_DIR/test-project/.claude/lib/feature-composer.js';

const composer = new FeatureComposer({ debug: false });

if (composer && typeof composer.executeSlashCommand === 'function') {
  console.log('IMPORT_SUCCESS');
} else {
  console.log('IMPORT_FAILED');
}
EOF

  if command -v node &> /dev/null; then
    RESULT=$(node "$TEST_DIR/test-import.mjs" 2>&1)
    if echo "$RESULT" | grep -q "IMPORT_SUCCESS"; then
      pass "FeatureComposer module imports successfully"
    else
      fail "Module import" "Failed to import FeatureComposer: $RESULT"
    fi
  else
    info "Node.js not available, skipping import test"
  fi
}

# Test 2: Slash Command Execution
test_slash_command_execution() {
  section "Test 2: Slash Command Execution"

  cat > "$TEST_DIR/test-command.mjs" << EOF
import { FeatureComposer } from '$TEST_DIR/test-project/.claude/lib/feature-composer.js';

const composer = new FeatureComposer({
  claudeHome: '$TEST_DIR/test-project/.claude',
  debug: false
});

try {
  const result = await composer.executeSlashCommand('test-command', { name: 'World' });

  if (result.status === 'SUCCESS' && result.expandedPrompt.includes('Hello, World!')) {
    console.log('COMMAND_SUCCESS');
  } else {
    console.log('COMMAND_FAILED: Unexpected result');
    console.log(JSON.stringify(result, null, 2));
  }
} catch (error) {
  console.log('COMMAND_ERROR: ' + error.message);
}
EOF

  if command -v node &> /dev/null; then
    RESULT=$(node "$TEST_DIR/test-command.mjs" 2>&1)
    if echo "$RESULT" | grep -q "COMMAND_SUCCESS"; then
      pass "Slash command execution with parameters works"
    else
      fail "Slash command execution" "$RESULT"
    fi
  else
    info "Node.js not available, skipping slash command test"
  fi
}

# Test 3: Sub-Agent Invocation
test_sub_agent_invocation() {
  section "Test 3: Sub-Agent Invocation"

  cat > "$TEST_DIR/test-agent.mjs" << EOF
import { FeatureComposer } from '$TEST_DIR/test-project/.claude/lib/feature-composer.js';

const composer = new FeatureComposer({
  claudeHome: '$TEST_DIR/test-project/.claude',
  debug: false
});

try {
  const result = await composer.invokeSubAgent(
    'test_agent',
    'Test input for agent',
    { parseResponse: true }
  );

  if (result.status === 'SUCCESS') {
    console.log('AGENT_SUCCESS');
  } else {
    console.log('AGENT_FAILED: Status is ' + result.status);
  }
} catch (error) {
  console.log('AGENT_ERROR: ' + error.message);
}
EOF

  if command -v node &> /dev/null; then
    RESULT=$(node "$TEST_DIR/test-agent.mjs" 2>&1)
    if echo "$RESULT" | grep -q "AGENT_SUCCESS"; then
      pass "Sub-agent invocation works correctly"
    else
      fail "Sub-agent invocation" "$RESULT"
    fi
  else
    info "Node.js not available, skipping agent test"
  fi
}

# Test 4: MCP Query
test_mcp_query() {
  section "Test 4: MCP Query"

  cat > "$TEST_DIR/test-mcp.mjs" << EOF
import { FeatureComposer } from '$TEST_DIR/test-project/.claude/lib/feature-composer.js';

const composer = new FeatureComposer({
  claudeHome: '$TEST_DIR/test-project/.claude',
  debug: false
});

process.chdir('$TEST_DIR/test-project');

try {
  const result = await composer.queryMCP('test-mcp', 'test_endpoint', { test: 'data' });

  if (result.status === 'SUCCESS' && result.mcpName === 'test-mcp') {
    console.log('MCP_SUCCESS');
  } else {
    console.log('MCP_FAILED: Unexpected result');
  }
} catch (error) {
  console.log('MCP_ERROR: ' + error.message);
}
EOF

  if command -v node &> /dev/null; then
    RESULT=$(node "$TEST_DIR/test-mcp.mjs" 2>&1)
    if echo "$RESULT" | grep -q "MCP_SUCCESS"; then
      pass "MCP query returns correct configuration"
    else
      fail "MCP query" "$RESULT"
    fi
  else
    info "Node.js not available, skipping MCP test"
  fi
}

# Test 5: Output Parsing
test_output_parsing() {
  section "Test 5: Output Parsing"

  cat > "$TEST_DIR/test-parsing.mjs" << EOF
import { FeatureComposer } from '$TEST_DIR/test-project/.claude/lib/feature-composer.js';

const composer = new FeatureComposer({ debug: false });

// Test parsing of different status codes
const tests = [
  { input: '[SUCCESS] Operation completed', expected: 'SUCCESS' },
  { input: '[ERROR] Operation failed', expected: 'ERROR' },
  { input: '[PARTIAL] Partially complete', expected: 'PARTIAL' },
  { input: '[INFO] Information message', expected: 'INFO' },
  { input: 'No status code here', expected: 'UNKNOWN' }
];

let allPassed = true;

for (const test of tests) {
  const result = composer._parseAgentResponse(test.input);
  if (result.status !== test.expected) {
    console.log(\`PARSE_FAILED: Expected \${test.expected}, got \${result.status}\`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('PARSE_SUCCESS');
}
EOF

  if command -v node &> /dev/null; then
    RESULT=$(node "$TEST_DIR/test-parsing.mjs" 2>&1)
    if echo "$RESULT" | grep -q "PARSE_SUCCESS"; then
      pass "Output parsing handles all status codes correctly"
    else
      fail "Output parsing" "$RESULT"
    fi
  else
    info "Node.js not available, skipping parsing test"
  fi
}

# Test 6: Multi-Step Composition
test_composition() {
  section "Test 6: Multi-Step Composition"

  cat > "$TEST_DIR/test-compose.mjs" << EOF
import { FeatureComposer } from '$TEST_DIR/test-project/.claude/lib/feature-composer.js';

const composer = new FeatureComposer({
  claudeHome: '$TEST_DIR/test-project/.claude',
  debug: false
});

process.chdir('$TEST_DIR/test-project');

try {
  const results = await composer.compose([
    {
      type: 'command',
      name: 'step1',
      command: 'test-command',
      params: { name: 'Compose' }
    },
    {
      type: 'agent',
      name: 'step2',
      agent: 'test_agent',
      input: 'Test composition'
    },
    {
      type: 'mcp',
      name: 'step3',
      mcp: 'test-mcp',
      endpoint: 'test_endpoint',
      data: {}
    }
  ]);

  if (results.length === 3) {
    console.log('COMPOSE_SUCCESS');
  } else {
    console.log('COMPOSE_FAILED: Expected 3 results, got ' + results.length);
  }
} catch (error) {
  console.log('COMPOSE_ERROR: ' + error.message);
}
EOF

  if command -v node &> /dev/null; then
    RESULT=$(node "$TEST_DIR/test-compose.mjs" 2>&1)
    if echo "$RESULT" | grep -q "COMPOSE_SUCCESS"; then
      pass "Multi-step composition executes all steps"
    else
      fail "Multi-step composition" "$RESULT"
    fi
  else
    info "Node.js not available, skipping composition test"
  fi
}

# Test 7: Error Handling
test_error_handling() {
  section "Test 7: Error Handling"

  cat > "$TEST_DIR/test-errors.mjs" << EOF
import { FeatureComposer } from '$TEST_DIR/test-project/.claude/lib/feature-composer.js';

const composer = new FeatureComposer({
  claudeHome: '$TEST_DIR/test-project/.claude',
  debug: false
});

let errorsHandled = 0;

// Test 1: Non-existent command
try {
  await composer.executeSlashCommand('nonexistent-command', {});
} catch (error) {
  if (error.message.includes('not found')) {
    errorsHandled++;
  }
}

// Test 2: Non-existent agent
try {
  await composer.invokeSubAgent('nonexistent-agent', 'test');
} catch (error) {
  if (error.message.includes('not found')) {
    errorsHandled++;
  }
}

// Test 3: Non-existent MCP
process.chdir('$TEST_DIR/test-project');
try {
  await composer.queryMCP('nonexistent-mcp', 'endpoint', {});
} catch (error) {
  if (error.message.includes('not found')) {
    errorsHandled++;
  }
}

if (errorsHandled === 3) {
  console.log('ERROR_HANDLING_SUCCESS');
} else {
  console.log('ERROR_HANDLING_FAILED: Only ' + errorsHandled + ' errors handled');
}
EOF

  if command -v node &> /dev/null; then
    RESULT=$(node "$TEST_DIR/test-errors.mjs" 2>&1)
    if echo "$RESULT" | grep -q "ERROR_HANDLING_SUCCESS"; then
      pass "Error handling works for missing resources"
    else
      fail "Error handling" "$RESULT"
    fi
  else
    info "Node.js not available, skipping error handling test"
  fi
}

# Test 8: Caching Behavior
test_caching() {
  section "Test 8: Caching Behavior"

  cat > "$TEST_DIR/test-cache.mjs" << EOF
import { FeatureComposer } from '$TEST_DIR/test-project/.claude/lib/feature-composer.js';

const composer = new FeatureComposer({
  claudeHome: '$TEST_DIR/test-project/.claude',
  debug: false
});

try {
  // Load agent config twice
  const config1 = await composer._loadAgentConfig('test_agent');
  const config2 = await composer._loadAgentConfig('test_agent');

  // Check if same object (cached)
  if (config1 === config2) {
    console.log('CACHE_SUCCESS');
  } else {
    console.log('CACHE_FAILED: Configs are different objects');
  }
} catch (error) {
  console.log('CACHE_ERROR: ' + error.message);
}
EOF

  if command -v node &> /dev/null; then
    RESULT=$(node "$TEST_DIR/test-cache.mjs" 2>&1)
    if echo "$RESULT" | grep -q "CACHE_SUCCESS"; then
      pass "Caching works correctly for agent configs"
    else
      fail "Caching" "$RESULT"
    fi
  else
    info "Node.js not available, skipping caching test"
  fi
}

# Main test execution
main() {
  setup_test_environment

  if ! command -v node &> /dev/null; then
    echo ""
    echo -e "${YELLOW}⚠ Warning: Node.js not found${NC}"
    echo -e "${YELLOW}  Most tests will be skipped${NC}"
    echo -e "${YELLOW}  Install Node.js 18+ to run full test suite${NC}"
    echo ""
  fi

  test_module_import
  test_slash_command_execution
  test_sub_agent_invocation
  test_mcp_query
  test_output_parsing
  test_composition
  test_error_handling
  test_caching

  # Summary
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║   Test Summary                                 ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  Total tests run:    ${BLUE}$TESTS_RUN${NC}"
  echo -e "  Tests passed:       ${GREEN}$TESTS_PASSED${NC}"
  echo -e "  Tests failed:       ${RED}$TESTS_FAILED${NC}"
  echo ""

  if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    exit 0
  else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    exit 1
  fi
}

# Run tests
main "$@"
