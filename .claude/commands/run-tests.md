# Run Tests

Execute the complete test suite and report results.

## Steps

1. **Pre-flight Checks**
   - Verify all test scripts are executable
   - Check test dependencies are available
   - Validate test environment

2. **Execute Test Suite**
   - Run all test scenarios
   - Execute feature tests
   - Run performance tests

3. **Parse Results**
   - Capture test output
   - Identify failures
   - Calculate pass/fail rates

4. **Report Summary**
   - Display test results
   - Show execution times
   - Highlight any failures

## Example Commands

```bash
# Check test script executability
echo "Checking test scripts..."
find tests/ -name "*.sh" -type f ! -executable | while read -r f; do
  echo "  ⚠️  Not executable: $f"
  echo "     Fix with: chmod +x $f"
done

# Run the complete test suite
echo ""
echo "Running test suite..."
if [ -x tests/run-all-tests.sh ]; then
  ./tests/run-all-tests.sh
else
  echo "❌ Test runner not found or not executable"
  exit 1
fi

# Run individual test scenarios
echo ""
echo "Running scenario tests..."
for scenario in tests/scenarios/*.sh; do
  if [ -x "$scenario" ]; then
    echo "Running: $(basename "$scenario")"
    "$scenario" && echo "  ✓ Passed" || echo "  ❌ Failed"
  fi
done

# Check test results
echo ""
if [ -f tests/test-results.log ]; then
  echo "Latest test results:"
  tail -20 tests/test-results.log
fi
```

## Expected Output

```
╔════════════════════════════════════════╗
║  Test Suite Results                     ║
╚════════════════════════════════════════╝

✓ PASSED: New User Scenario
✓ PASSED: Migration Scenario
✓ PASSED: Power User Scenario
✓ PASSED: Error Recovery
✓ PASSED: Feature Composer

────────────────────────────────────────
Total Tests: 5
Passed: 5
Failed: 0
Execution Time: 12.9s
```

## Success Criteria
- All tests pass
- No execution errors
- Performance within acceptable limits
- Test logs generated correctly
