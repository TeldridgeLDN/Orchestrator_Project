#!/bin/bash
# Use the orchestrator CLI, not Claude Code
CLAUDE_CLI=~/.claude/bin/claude
set -e

# Test script for migration scenario
echo "Running Migration Scenario Test"

# Setup test environment
rm -rf ~/.claude-test
rm -rf ~/diet103-test
CLAUDE_HOME=~/.claude-test $CLAUDE_CLI init

# Create mock diet103 project
mkdir -p ~/diet103-test/project1/.claude
touch ~/diet103-test/project1/.claude/Claude.md
echo '{"name":"legacy-project","version":"1.0.0"}' > ~/diet103-test/project1/.claude/metadata.json

# Register existing diet103 project
CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project register ~/diet103-test/project1 --name legacy-project
echo "✓ Registered legacy project"

# Verify project registration
CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project list | grep -q legacy-project
if [ $? -ne 0 ]; then
  echo "FAIL: Legacy project not registered"
  exit 1
fi

# Test switching to legacy project
CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project switch legacy-project
CURRENT=$(CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project current)
if [ "$CURRENT" != "legacy-project" ]; then
  echo "FAIL: Legacy project switch failed"
  exit 1
fi
echo "✓ Switched to legacy project"

# Create new project
CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project create new-project --template base
echo "✓ Created new project"

# Test switching between legacy and new
CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project switch new-project
CURRENT=$(CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project current)
if [ "$CURRENT" != "new-project" ]; then
  echo "FAIL: Switch to new project failed"
  exit 1
fi
echo "✓ Switched to new project"

CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project switch legacy-project
CURRENT=$(CLAUDE_HOME=~/.claude-test $CLAUDE_CLI project current)
if [ "$CURRENT" != "legacy-project" ]; then
  echo "FAIL: Switch back to legacy project failed"
  exit 1
fi
echo "✓ Switched back to legacy project"

# Cleanup
rm -rf ~/diet103-test

echo "Migration Scenario Test: PASSED"
