#!/bin/bash
# Test script for register-existing.sh migration helper

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REGISTER_SCRIPT="$PROJECT_ROOT/tools/register-existing.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
test_start() {
  echo ""
  echo -e "${YELLOW}Testing: $1${NC}"
}

test_pass() {
  echo -e "${GREEN}✓ PASS${NC}"
  ((TESTS_PASSED++))
}

test_fail() {
  echo -e "${RED}✗ FAIL: $1${NC}"
  ((TESTS_FAILED++))
}

cleanup() {
  # Clean up test directories
  if [ -d "$TEST_DIR" ]; then
    rm -rf "$TEST_DIR"
  fi

  # Restore original config if backed up
  if [ -f "$HOME/.claude/config.json.test_backup" ]; then
    mv "$HOME/.claude/config.json.test_backup" "$HOME/.claude/config.json"
  fi
}

# Set up test environment
TEST_DIR="/tmp/claude_test_$$"
mkdir -p "$TEST_DIR"

# Backup existing config
if [ -f "$HOME/.claude/config.json" ]; then
  cp "$HOME/.claude/config.json" "$HOME/.claude/config.json.test_backup"
fi

# Ensure cleanup on exit
trap cleanup EXIT

echo "=================================="
echo "Testing register-existing.sh"
echo "=================================="

# Test 1: Help message
test_start "Help message displays correctly"
if "$REGISTER_SCRIPT" --help 2>&1 | grep -q "Usage:"; then
  test_pass
else
  test_fail "Help message not displayed"
fi

# Test 2: Error on missing path
test_start "Error on missing project path"
if ! "$REGISTER_SCRIPT" 2>&1 | grep -q "Error: Project path is required"; then
  test_fail "Should error on missing path"
else
  test_pass
fi

# Test 3: Error on non-existent directory
test_start "Error on non-existent directory"
if ! "$REGISTER_SCRIPT" "/tmp/nonexistent_$$/project" 2>&1 | grep -q "does not exist"; then
  test_fail "Should error on non-existent directory"
else
  test_pass
fi

# Test 4: Create .claude directory structure
test_start "Create .claude directory when prompted"
TEST_PROJECT="$TEST_DIR/test_project_1"
mkdir -p "$TEST_PROJECT"

# Simulate 'y' input for creating .claude directory
echo "y" | "$REGISTER_SCRIPT" "$TEST_PROJECT" --name="test1" > /dev/null 2>&1

if [ -d "$TEST_PROJECT/.claude" ] && \
   [ -d "$TEST_PROJECT/.claude/skills" ] && \
   [ -d "$TEST_PROJECT/.claude/workflows" ]; then
  test_pass
else
  test_fail "Failed to create .claude directory structure"
fi

# Test 5: Create metadata.json
test_start "Create metadata.json if missing"
if [ -f "$TEST_PROJECT/.claude/metadata.json" ]; then
  if grep -q "test1" "$TEST_PROJECT/.claude/metadata.json"; then
    test_pass
  else
    test_fail "metadata.json doesn't contain project name"
  fi
else
  test_fail "metadata.json not created"
fi

# Test 6: Auto-detect project name
test_start "Auto-detect project name from path"
TEST_PROJECT_2="$TEST_DIR/my_cool_project"
mkdir -p "$TEST_PROJECT_2/.claude"

echo "y" | "$REGISTER_SCRIPT" "$TEST_PROJECT_2" 2>&1 | grep -q "my_cool_project"
if [ $? -eq 0 ]; then
  test_pass
else
  test_fail "Failed to auto-detect project name"
fi

# Test 7: Register in global config
test_start "Register project in global config"
if command -v jq &> /dev/null; then
  if jq -e '.projects.test1' "$HOME/.claude/config.json" > /dev/null 2>&1; then
    test_pass
  else
    test_fail "Project not registered in config.json"
  fi
else
  echo -e "${YELLOW}⚠ Skipped (jq not installed)${NC}"
fi

# Test 8: Prevent duplicate registration
test_start "Prevent duplicate registration without --force"
if ! echo "y" | "$REGISTER_SCRIPT" "$TEST_PROJECT" --name="test1" 2>&1 | grep -q "already registered"; then
  test_fail "Should prevent duplicate registration"
else
  test_pass
fi

# Test 9: Allow duplicate with --force
test_start "Allow duplicate registration with --force"
if echo "y" | "$REGISTER_SCRIPT" "$TEST_PROJECT" --name="test1" --force > /dev/null 2>&1; then
  test_pass
else
  test_fail "Should allow registration with --force"
fi

# Test 10: Handle existing project with .claude directory
test_start "Handle existing project with .claude directory"
TEST_PROJECT_3="$TEST_DIR/existing_project"
mkdir -p "$TEST_PROJECT_3/.claude"

if "$REGISTER_SCRIPT" "$TEST_PROJECT_3" --name="test3" > /dev/null 2>&1; then
  test_pass
else
  test_fail "Should handle existing .claude directory"
fi

# Summary
echo ""
echo "=================================="
echo "Test Summary"
echo "=================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
  echo -e "${RED}Failed: $TESTS_FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
fi
