#!/bin/bash

##
# CLI Commands Test Runner
#
# Runs all tests for the new CLI commands:
# - init
# - project current
# - project register (enhanced)
# - Integration tests
##

set -e

echo "================================="
echo "CLI Commands Test Suite"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
  local test_file=$1
  local test_name=$2
  
  echo -e "${YELLOW}Running: $test_name${NC}"
  
  TESTS_RUN=$((TESTS_RUN + 1))
  
  if npm test -- "$test_file" --reporter=verbose; then
    echo -e "${GREEN}✓ $test_name passed${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗ $test_name failed${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
  
  echo ""
}

# Run individual test suites
echo "Running CLI Command Tests..."
echo ""

run_test "tests/commands/init.test.js" "Init Command Tests"
run_test "tests/commands/current.test.js" "Current Command Tests"
run_test "tests/commands/register.test.js" "Register Command Tests"
run_test "tests/commands/integration.test.js" "Integration Tests"

# Summary
echo "================================="
echo "Test Summary"
echo "================================="
echo -e "Total Tests Run: $TESTS_RUN"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"

if [ $TESTS_FAILED -gt 0 ]; then
  echo -e "${RED}Failed: $TESTS_FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
fi

