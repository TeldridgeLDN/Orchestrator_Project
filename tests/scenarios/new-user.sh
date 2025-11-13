#!/bin/bash
set -e

# Test script for new user setup scenario
echo "Running New User Setup Test"

# Use the orchestrator CLI, not Claude Code
CLAUDE_CLI=~/.claude/bin/claude

# Clean test environment
rm -rf ~/.claude-test
CLAUDE_HOME=~/.claude-test $CLAUDE_CLI init

# Verify initial setup
if [ ! -d "$HOME/.claude-test" ]; then
  echo "FAIL: Claude home directory not created"
  exit 1
fi

# Create first project
CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project create first-project --template web-app
echo "✓ Created first project"

# Verify project creation
if [ ! -d "$HOME/.claude-test/projects/first-project" ]; then
  echo "FAIL: Project directory not created"
  exit 1
fi

# Create second project
CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project create second-project --template base
echo "✓ Created second project"

# Test switching between projects
CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project switch first-project
CURRENT=$(CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project current)
if [ "$CURRENT" != "first-project" ]; then
  echo "FAIL: Project switch failed"
  exit 1
fi
echo "✓ Switched to first project"

CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project switch second-project
CURRENT=$(CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project current)
if [ "$CURRENT" != "second-project" ]; then
  echo "FAIL: Project switch failed"
  exit 1
fi
echo "✓ Switched to second project"

echo "New User Setup Test: PASSED"
