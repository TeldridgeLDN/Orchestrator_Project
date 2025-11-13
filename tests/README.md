# End-to-End Test Suite

This directory contains comprehensive end-to-end tests for the Claude Orchestrator system.

## Overview

The test suite validates the complete orchestrator functionality across different user scenarios and workflows.

## Test Scenarios

### 1. New User Setup (`scenarios/new-user.sh`)

Tests the initial user experience and project creation workflow.

**What it tests:**
- Fresh installation and initialization
- Creating first project from template
- Creating multiple projects
- Switching between projects
- Project directory structure validation

**Success criteria:**
- Claude home directory created successfully
- Projects created with correct structure
- Project switching works correctly
- Active project tracking is accurate

### 2. Migration Scenario (`scenarios/migration.sh`)

Tests the migration path for existing diet103 users.

**What it tests:**
- Registering existing diet103 projects
- Compatibility with legacy project structure
- Switching between legacy and new projects
- Coexistence of registered and created projects

**Success criteria:**
- Legacy projects register successfully
- Project metadata is preserved
- Switching works seamlessly between old and new
- No corruption of existing projects

### 3. Power User Workflow (`scenarios/power-user.sh`)

Tests performance and reliability with heavy usage patterns.

**What it tests:**
- Creating 12+ projects
- Rapid switching between many projects
- Performance metrics for context switching
- Natural language command support (if implemented)

**Success criteria:**
- All projects created successfully
- Context switching completes in <1 second
- No memory leaks or performance degradation
- Natural language commands work (if available)

### 4. Error Recovery (`scenarios/error-recovery.sh`)

Tests system resilience and error handling.

**What it tests:**
- Corrupted configuration file recovery
- Missing project file detection
- Invalid input handling
- Duplicate project prevention

**Success criteria:**
- Graceful handling of corrupted config
- Clear error messages for invalid operations
- System remains stable after errors
- No data loss during error conditions

## Running the Tests

### Run All Tests

```bash
./tests/run-all-tests.sh
```

This master script runs all test scenarios and provides a summary report.

### Run Individual Tests

```bash
# New user setup
./tests/scenarios/new-user.sh

# Migration scenario
./tests/scenarios/migration.sh

# Power user workflow
./tests/scenarios/power-user.sh

# Error recovery
./tests/scenarios/error-recovery.sh
```

## Test Environment

All tests use an isolated test environment:
- Test home directory: `~/.claude-test`
- Test projects directory: `~/diet103-test` (migration test only)
- No interference with actual user configuration

**Important:** Tests automatically clean up after themselves, but if interrupted, you may need to manually remove:
- `~/.claude-test`
- `~/diet103-test`

## Prerequisites

Before running tests, ensure:
1. Claude CLI is installed and in PATH
2. All orchestrator commands are available
3. Template files are properly configured
4. Required dependencies are installed

Check prerequisites:
```bash
# Verify Claude CLI
which claude

# Verify orchestrator commands
claude --help
```

## Test Output

### Success Output
```
✓ PASSED: New User Setup
✓ PASSED: Migration Scenario
✓ PASSED: Power User Workflow
✓ PASSED: Error Recovery

Test Summary
────────────
Total Tests:   4
Passed:        4
Failed:        0
Skipped:       0

✓ ALL TESTS PASSED
```

### Failure Output
```
✗ FAILED: New User Setup

Test Summary
────────────
Total Tests:   4
Passed:        3
Failed:        1
Skipped:       0

✗ TEST SUITE FAILED
```

## Interpreting Results

### Test Passed
All assertions completed successfully. The feature works as expected.

### Test Failed
One or more assertions failed. Review the error output to identify:
- Which specific check failed
- What was expected vs actual behavior
- Stack trace or error message

### Test Skipped
Test script not found or not executable. This indicates:
- Missing test file
- Incorrect permissions (run `chmod +x tests/scenarios/*.sh`)

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run End-to-End Tests
  run: ./tests/run-all-tests.sh
```

Exit codes:
- `0` - All tests passed
- `1` - One or more tests failed

## Adding New Tests

To add a new test scenario:

1. Create a new script in `tests/scenarios/`:
   ```bash
   touch tests/scenarios/my-new-test.sh
   chmod +x tests/scenarios/my-new-test.sh
   ```

2. Follow the existing test structure:
   ```bash
   #!/bin/bash
   set -e

   echo "Running My New Test"

   # Setup
   rm -rf ~/.claude-test
   CLAUDE_HOME=~/.claude-test claude init

   # Test assertions
   # ...

   # Cleanup (if needed)

   echo "My New Test: PASSED"
   ```

3. Add the test to `run-all-tests.sh`:
   ```bash
   run_test "My New Test" "$SCRIPT_DIR/scenarios/my-new-test.sh"
   ```

## Debugging Test Failures

### Enable Verbose Output
```bash
bash -x ./tests/scenarios/new-user.sh
```

### Check Test Environment
```bash
# Inspect test home directory
ls -la ~/.claude-test

# Check configuration
cat ~/.claude-test/config.json

# View project list
CLAUDE_HOME=~/.claude-test claude project list
```

### Manual Cleanup
```bash
# Remove test environments
rm -rf ~/.claude-test
rm -rf ~/diet103-test
```

## Test Coverage

Current test coverage:
- ✓ Project initialization
- ✓ Project creation from templates
- ✓ Project registration (legacy)
- ✓ Project switching
- ✓ Active project tracking
- ✓ Error handling
- ✓ Configuration validation
- ⚠ Natural language commands (partial - if implemented)
- ⚠ Context caching (not yet tested)
- ⚠ Skill auto-activation (not yet tested)

## Known Limitations

1. **Platform-specific:** Tests are optimized for macOS/Linux. Windows support may require modifications.
2. **Timing-dependent:** Power user tests measure performance and may be affected by system load.
3. **Network-independent:** Tests don't require network access but may not catch network-related issues.

## Contributing

When adding features, please:
1. Add corresponding test scenarios
2. Update this README with new test descriptions
3. Ensure all existing tests still pass
4. Document any new prerequisites or setup requirements

## Support

For test failures or issues:
1. Check the test output for specific error messages
2. Review the Prerequisites section
3. Try running tests individually to isolate issues
4. Check the project issue tracker for known problems
