#!/bin/bash

# Master test runner for Claude Orchestrator end-to-end tests
# Runs all test scenarios and reports results

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Function to run a test scenario
run_test() {
  local test_name=$1
  local test_script=$2

  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  Running: ${test_name}${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""

  TOTAL_TESTS=$((TOTAL_TESTS + 1))

  if [ ! -f "$test_script" ]; then
    echo -e "${YELLOW}⚠ SKIPPED: Test script not found${NC}"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    return
  fi

  if [ ! -x "$test_script" ]; then
    echo -e "${YELLOW}⚠ SKIPPED: Test script not executable${NC}"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    return
  fi

  # Run the test and capture output
  if "$test_script" 2>&1; then
    echo ""
    echo -e "${GREEN}✓ PASSED: ${test_name}${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo ""
    echo -e "${RED}✗ FAILED: ${test_name}${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
}

# Print header
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Claude Orchestrator - End-to-End Test Suite${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Starting test execution at $(date)"
echo ""

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"
if ! command -v claude &> /dev/null; then
  echo -e "${RED}✗ ERROR: 'claude' command not found${NC}"
  echo "Please ensure the Claude CLI is installed and in your PATH"
  exit 1
fi
echo -e "${GREEN}✓ Claude CLI found${NC}"
echo ""

# Run all test scenarios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

run_test "New User Setup" "$SCRIPT_DIR/scenarios/new-user.sh"
run_test "Migration Scenario" "$SCRIPT_DIR/scenarios/migration.sh"
run_test "Power User Workflow" "$SCRIPT_DIR/scenarios/power-user.sh"
run_test "Error Recovery" "$SCRIPT_DIR/scenarios/error-recovery.sh"

# Cleanup
echo ""
echo -e "${BLUE}Cleaning up test environment...${NC}"
rm -rf ~/.claude-test
echo -e "${GREEN}✓ Cleanup complete${NC}"

# Print summary
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Total Tests:   $TOTAL_TESTS"
echo -e "${GREEN}Passed:        $PASSED_TESTS${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
  echo -e "${RED}Failed:        $FAILED_TESTS${NC}"
else
  echo "Failed:        $FAILED_TESTS"
fi
if [ $SKIPPED_TESTS -gt 0 ]; then
  echo -e "${YELLOW}Skipped:       $SKIPPED_TESTS${NC}"
else
  echo "Skipped:       $SKIPPED_TESTS"
fi
echo ""
echo "Completed at $(date)"
echo ""

# Exit with appropriate code
if [ $FAILED_TESTS -gt 0 ]; then
  echo -e "${RED}✗ TEST SUITE FAILED${NC}"
  exit 1
else
  echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
  exit 0
fi
