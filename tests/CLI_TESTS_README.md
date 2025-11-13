# CLI Commands Test Suite

Comprehensive testing for the new CLI commands implemented in Task 11.

## Test Coverage

### Commands Tested

1. **`diet103 init`** - Project initialization
   - Directory structure creation
   - Configuration file generation
   - TaskMaster integration
   - Force reinitialization
   - Error handling

2. **`diet103 project current`** - Display active project
   - Basic information display
   - Health score display
   - Resource counting (scenarios, skills)
   - TaskMaster integration
   - JSON output
   - Verbose mode

3. **`diet103 project register`** - Enhanced registration
   - Basic registration
   - Custom metadata
   - Display names
   - Batch registration
   - Validation thresholds
   - Auto-repair
   - Error handling

4. **Integration Tests** - Complete workflows
   - Init → Register → Current workflow
   - Multiple project management
   - Project reinitialization
   - Error recovery
   - JSON output consistency

## Running Tests

### Run All CLI Tests

```bash
# Run all CLI command tests
npm test tests/commands/

# Or use the test runner script
./tests/run-cli-tests.sh
```

### Run Individual Test Suites

```bash
# Init command tests
npm test tests/commands/init.test.js

# Current command tests
npm test tests/commands/current.test.js

# Register command tests
npm test tests/commands/register.test.js

# Integration tests
npm test tests/commands/integration.test.js
```

### Run with Coverage

```bash
npm run test:coverage -- tests/commands/
```

### Watch Mode (Development)

```bash
npm run test:watch tests/commands/
```

## Test Structure

```
tests/
├── commands/
│   ├── init.test.js         # Tests for diet103 init
│   ├── current.test.js      # Tests for project current
│   ├── register.test.js     # Tests for project register
│   └── integration.test.js  # Integration workflows
├── fixtures/
│   ├── init-tests/          # Test fixtures for init
│   ├── current-tests/       # Test fixtures for current
│   ├── register-tests/      # Test fixtures for register
│   └── integration-tests/   # Test fixtures for integration
├── run-cli-tests.sh         # Test runner script
└── CLI_TESTS_README.md      # This file
```

## Test Framework

- **Testing Framework**: Vitest
- **Assertion Library**: Vitest (built-in)
- **Mocking**: Vitest vi utilities
- **Coverage**: Vitest coverage (via --coverage flag)

## Test Patterns

### Setup/Teardown

Each test suite uses:
- `beforeEach()` - Create temporary test directories
- `afterEach()` - Clean up temporary directories and mocks

### Mocking

- `process.exit()` - Mocked to prevent test termination
- `console.log/error()` - Spied on to verify output
- File system operations - Use real fs with temp directories
- Config module - Mocked for active project state

### Test Organization

Tests are organized by:
1. **Feature** - Each describe block tests a specific feature
2. **Scenario** - Each it block tests a specific scenario
3. **Assertions** - Multiple assertions per scenario to verify complete behavior

## Adding New Tests

### Template

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

describe('Feature Name', () => {
  let tempDir;
  
  beforeEach(async () => {
    // Setup
    tempDir = path.join(__dirname, '../fixtures', `test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });
  
  afterEach(async () => {
    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true });
  });
  
  it('should do something specific', async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Best Practices

1. **Use descriptive test names** - Test names should explain what they verify
2. **One assertion per concept** - Test a single behavior per test
3. **Isolate tests** - Each test should be independent
4. **Clean up resources** - Always clean up temp files/directories
5. **Mock external dependencies** - Don't rely on external state
6. **Test error cases** - Include negative test cases
7. **Verify outputs** - Check console output, file contents, return values

## Test Fixtures

Test fixtures are temporary directories created per test run. They include:
- Minimal project structures
- Mock configuration files
- Sample metadata
- Test scenarios and skills

Fixtures are automatically cleaned up after each test.

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
- No external dependencies required
- Self-contained with fixtures
- Deterministic results
- Fast execution (<5 seconds per suite)

## Troubleshooting

### Tests Failing Locally

1. **Check temp directory permissions**:
   ```bash
   ls -la tests/fixtures/
   ```

2. **Clear old test fixtures**:
   ```bash
   rm -rf tests/fixtures/*/test-*
   ```

3. **Verify Node version**:
   ```bash
   node --version  # Should be >= 18.0.0
   ```

### Mock Issues

If mocks aren't working:
1. Ensure `vi.clearAllMocks()` is called in `afterEach()`
2. Check mock import paths are correct
3. Verify mocks are set up before test execution

### File System Issues

If file operations fail:
1. Check temp directory creation succeeded
2. Verify cleanup isn't running too early
3. Ensure paths use `path.join()` for cross-platform compatibility

## Coverage Goals

Target coverage for CLI commands:
- **Statements**: >90%
- **Branches**: >85%
- **Functions**: >90%
- **Lines**: >90%

Current coverage can be viewed by running:
```bash
npm run test:coverage -- tests/commands/
```

## Future Enhancements

Potential additional tests:
1. Performance benchmarks
2. Load testing (multiple concurrent operations)
3. Cross-platform compatibility tests
4. Memory leak detection
5. Security testing (input validation)

## Contributing

When adding new CLI commands:
1. Create a new test file in `tests/commands/`
2. Follow the existing test patterns
3. Include unit tests and integration tests
4. Update this README with new test information
5. Ensure all tests pass before committing

## Support

For test-related issues:
- Check test output for specific error messages
- Review test logs in `tests/last-test-run.log`
- Refer to existing tests for examples
- Consult Vitest documentation: https://vitest.dev/

