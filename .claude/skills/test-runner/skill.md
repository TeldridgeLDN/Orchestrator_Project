# Test Runner Skill

## Purpose
Execute and manage the test suite for the Orchestrator documentation project.

## Capabilities
- Run all test scenarios
- Execute individual test scripts
- Parse and report test results
- Track test execution time
- Validate test script integrity

## Usage
Invoke this skill when:
- Verifying changes don't break tests
- Running pre-commit checks
- Validating example code
- Checking test coverage

## Test Suite Components

### 1. Test Scenarios
Located in `tests/scenarios/`:
- new-user.sh - New user onboarding flow
- migration.sh - Existing project migration
- power-user.sh - Advanced usage patterns
- error-recovery.sh - Error handling validation

### 2. Feature Tests
Located in `tests/`:
- test_feature_composer.sh - Feature composition tests
- test_register_existing.sh - Project registration tests
- feature-composer-simple.test.mjs - Unit tests

### 3. Performance Tests
Located in `tests/performance/`:
- switch-time.sh - Context switching performance

## Command Examples

```bash
# Run complete test suite
./tests/run-all-tests.sh

# Run specific test
./tests/test_feature_composer.sh

# Run scenario tests
bash -x tests/scenarios/new-user.sh

# Check test executability
find tests/ -name "*.sh" ! -executable -type f
```

## Test Execution Flow

1. **Pre-flight Checks**
   - Verify all test scripts are executable
   - Check test dependencies installed
   - Validate test data present

2. **Test Execution**
   - Run tests in isolated environments
   - Capture stdout and stderr
   - Track execution time per test
   - Record exit codes

3. **Result Parsing**
   - Parse test output for failures
   - Extract error messages
   - Identify failed assertions
   - Calculate pass/fail rates

4. **Reporting**
   - Summarize results
   - Highlight failures with context
   - Show performance metrics
   - Generate test reports

## Expected Output

```
╔════════════════════════════════════════╗
║  Test Suite Results                     ║
╚════════════════════════════════════════╝

✓ PASSED: New User Scenario (2.3s)
✓ PASSED: Migration Scenario (3.1s)
✓ PASSED: Power User Scenario (1.8s)
✓ PASSED: Error Recovery (1.5s)
✓ PASSED: Feature Composer (4.2s)

────────────────────────────────────────
Total Tests: 5
Passed: 5
Failed: 0
Skipped: 0
Execution Time: 12.9s
```

## Integration Points
- Called by `/run-tests` command
- Triggered by hooks when test files modified
- Used in pre-release validation
- Part of CI/CD pipeline

## Test Validation
- Ensure all .sh files are executable
- Check for test file naming conventions
- Verify test documentation exists
- Validate test data consistency

## Error Handling
- Capture detailed failure information
- Provide context for failures
- Suggest fixes for common issues
- Log full test output for debugging

## Dependencies
- bash (test execution)
- node (for .mjs tests)
- git (for scenario tests)
- standard Unix tools (grep, awk, sed)

## Success Criteria
- All tests pass
- No execution errors
- Performance within acceptable range
- Test coverage adequate
