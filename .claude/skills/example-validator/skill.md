# Example Validator Skill

## Purpose
Validate that all example code, scripts, and demonstrations work correctly and follow best practices.

## Capabilities
- Execute example scripts and verify successful completion
- Validate example code syntax and structure
- Check that examples follow documented patterns
- Verify example outputs match expected results
- Test examples in isolation to prevent side effects

## Usage
Invoke this skill when:
- Adding new examples to the project
- Updating existing example code
- Before releases to ensure examples work
- When users report issues with examples

## Validation Checks

### 1. Script Execution
- Run all example scripts
- Capture stdout/stderr output
- Verify exit codes (0 = success)
- Check for runtime errors
- Validate execution time is reasonable

### 2. Code Syntax Validation
- JavaScript/Node.js syntax checking
- Shell script syntax validation (bash -n)
- JSON/YAML structure validation
- Import/require statement verification

### 3. Pattern Compliance
- Check examples follow project conventions
- Verify proper error handling
- Ensure consistent code style
- Validate API usage patterns
- Check that best practices are demonstrated

### 4. Output Verification
- Compare actual output against expected output
- Validate that examples produce meaningful results
- Check that error cases are handled gracefully
- Verify logging and console output

### 5. Isolation Testing
- Ensure examples don't interfere with each other
- Verify clean setup and teardown
- Check that examples use test data, not production
- Validate no persistent side effects

## Command Examples

```bash
# Execute all example scripts
for example in examples/*.mjs; do
  echo "Testing: $example"
  node "$example" > /tmp/output.txt 2>&1
  if [ $? -eq 0 ]; then
    echo "✓ PASS: $example"
  else
    echo "✗ FAIL: $example"
    cat /tmp/output.txt
  fi
done

# Validate JavaScript syntax
for js in examples/*.mjs examples/*.js; do
  node --check "$js" || echo "Syntax error in: $js"
done

# Check shell script syntax
for sh in examples/*.sh; do
  bash -n "$sh" || echo "Syntax error in: $sh"
done

# Verify examples follow patterns
grep -l 'try.*catch' examples/*.mjs | wc -l  # Should use error handling
grep -l 'console.log' examples/*.mjs | wc -l  # Should have output

# Run examples with timeout protection
for example in examples/*.mjs; do
  timeout 10s node "$example" || echo "Timeout or error: $example"
done
```

## Integration Points
- Triggered by changes to examples/ directory
- Called by `/validate-docs` command
- Part of `/prep-release` checklist
- Used in CI/CD testing pipeline

## Expected Output
```
Testing examples/
✓ PASS: feature-composer.mjs (0.8s)
✓ PASS: project-create.mjs (0.5s)
✓ PASS: task-management.mjs (1.2s)
✗ FAIL: advanced-workflow.mjs (timeout)

────────────────────────────────
Total Examples: 4
Passed: 3
Failed: 1
Average Execution Time: 0.8s
```

## Example Categories

### 1. Feature Demonstrations
- Show how to use core features
- Demonstrate common workflows
- Illustrate best practices
- Provide copy-paste ready code

### 2. Integration Examples
- Show how components work together
- Demonstrate real-world scenarios
- Illustrate error handling patterns
- Provide end-to-end workflows

### 3. Testing Examples
- Show how to write tests
- Demonstrate test patterns
- Illustrate mocking and stubbing
- Provide test data examples

### 4. Configuration Examples
- Show configuration options
- Demonstrate customization
- Illustrate advanced setups
- Provide template configurations

## Error Handling

### Common Issues Detected
- Missing dependencies in examples
- Hardcoded paths that don't exist
- Examples using outdated APIs
- Infinite loops or hangs
- Unhandled promise rejections

### Remediation Steps
1. Fix the broken example code
2. Add error handling if missing
3. Update dependencies if needed
4. Add timeout protection
5. Document expected behavior

## Validation Criteria

### Must Pass
- All examples execute without errors
- All examples complete within timeout
- All examples produce expected output
- No syntax errors in any example

### Should Pass
- Examples follow consistent style
- Examples demonstrate best practices
- Examples include error handling
- Examples are well-commented

### Nice to Have
- Examples cover edge cases
- Examples include performance tips
- Examples show multiple approaches
- Examples are beginner-friendly

## Dependencies
- node (JavaScript execution)
- bash (shell script execution)
- timeout command (execution limits)
- grep, awk (text processing)

## Success Criteria
- All examples execute successfully
- No syntax errors detected
- Examples follow project patterns
- Output matches expectations
- Examples complete within reasonable time
