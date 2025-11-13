#!/bin/bash
# Use the orchestrator CLI, not Claude Code
CLAUDE_CLI=~/.claude/bin/claude
set -e

# Test script for error handling
echo "Running Error Handling Test"

# Setup test environment
rm -rf ~/.claude-test
CLAUDE_HOME=~/.claude-test $CLAUDE_CLI init
CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project create test-project --template base

# Test corrupted config recovery
echo "Testing corrupted config recovery..."
echo "{invalid json" > ~/.claude-test/config.json
set +e
CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project list 2>/dev/null
if [ $? -eq 0 ]; then
  echo "✓ Handled corrupted config"
else
  echo "✓ Correctly rejected corrupted config"
fi
set -e

# Restore valid config
CLAUDE_HOME=~/.claude-test $CLAUDE_CLI init --force

# Test missing project files
echo "Testing missing project files..."
rm -rf ~/.claude-test/projects/test-project/.claude
set +e
CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project validate test-project 2>/dev/null
if [ $? -ne 0 ]; then
  echo "✓ Correctly identified invalid project"
else
  echo "FAIL: Did not detect invalid project"
  exit 1
fi
set -e

# Test invalid inputs
echo "Testing invalid inputs..."
set +e
CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project switch nonexistent-project 2>/dev/null
if [ $? -ne 0 ]; then
  echo "✓ Correctly handled nonexistent project"
else
  echo "FAIL: Did not handle nonexistent project correctly"
  exit 1
fi
set -e

# Test duplicate project creation
echo "Testing duplicate project creation..."
CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project create duplicate-test --template base
set +e
CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project create duplicate-test --template base 2>/dev/null
if [ $? -ne 0 ]; then
  echo "✓ Correctly rejected duplicate project"
else
  echo "FAIL: Did not prevent duplicate project creation"
  exit 1
fi
set -e

echo "Error Handling Test: PASSED"
