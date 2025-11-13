# Hook Validation and Verification System

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Tests:** 45/45 Passing

## Overview

The Hook Validation System provides comprehensive automated validation for hook implementations, ensuring they meet project standards for registration, execution order, error handling, and integration.

## Features

### 🔍 Comprehensive Validation
- File existence checks (hook file, test file, documentation)
- Hook structure validation (exports, parameters, patterns)
- Test file validation (Vitest imports, test cases)
- Registration validation (import, hookManager registration)
- Priority and execution order verification
- Middleware pattern compliance
- Error handling verification
- Documentation completeness

### 📊 Multiple Report Formats
- Console output (colorized, human-readable)
- Markdown reports (GitHub-compatible)
- JSON reports (machine-readable)
- Batch validation reports

### ⚙️ Configurable Validation
- Strict mode for comprehensive checks
- Non-strict mode for lenient validation
- Custom project root configuration
- Batch processing for multiple hooks

## Components

### HookValidator
Main validation engine that performs all checks.

### ValidationReporter
Generates formatted reports in multiple formats.

## Usage

### Basic Validation

```javascript
import { HookValidator } from './lib/hooks/validator/HookValidator.js';

// Create validator
const validator = new HookValidator({
  projectRoot: process.cwd(),
  strict: true
});

// Validate a hook
const result = await validator.validate('documentationLifecycle');

console.log(`Status: ${result.valid ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Score: ${result.summary.passed}/${result.summary.total}`);
console.log(`Errors: ${result.errors.length}`);
console.log(`Warnings: ${result.warnings.length}`);
```

### Convenience Functions

```javascript
import { validateHook, validateAllHooks } from './lib/hooks/validator/HookValidator.js';

// Validate single hook
const result = await validateHook('myHook', {
  projectRoot: process.cwd()
});

// Validate all hooks in project
const batchResults = await validateAllHooks({
  projectRoot: process.cwd(),
  strict: true
});

console.log(`Total: ${batchResults.total}`);
console.log(`Passed: ${batchResults.passed}`);
console.log(`Failed: ${batchResults.failed}`);
```

### Batch Validation

```javascript
const validator = new HookValidator();

// Validate multiple specific hooks
const results = await validator.validateBatch([
  'documentationLifecycle',
  'configBackup',
  'directoryDetection'
]);

// Or validate all hooks
const allResults = await validator.validateAll();
```

### Generate Reports

```javascript
import { ValidationReporter } from './lib/hooks/validator/ValidationReporter.js';

const result = await validateHook('myHook');

// Console report
const consoleReport = ValidationReporter.generateConsoleReport(result);
console.log(consoleReport);

// Markdown report
const mdReport = ValidationReporter.generateMarkdownReport(result);
await fs.writeFile('validation-report.md', mdReport);

// JSON report
const jsonReport = ValidationReporter.generateJSONReport(result, true);
await fs.writeFile('validation-report.json', jsonReport);

// Or use convenience method
await ValidationReporter.saveReport(
  result,
  '.taskmaster/reports/validation.md',
  'markdown'
);
```

## Validation Checks

### File Existence
- ✅ Hook implementation file exists
- ✅ Test file exists
- ✅ Documentation exists (strict mode)

### Hook Structure
- ✅ Hook function properly exported
- ✅ Context parameter present
- ✅ Next parameter present
- ✅ Default export present (strict mode)

### Test File Structure
- ✅ Vitest imports present
- ✅ Hook imported in test
- ✅ Describe blocks used
- ✅ Test cases present

### Registration
- ✅ Hook imported in index.js
- ✅ Hook registered with hookManager

### Execution Order
- ✅ Priority specified
- ✅ Priority in valid range (0-100)

### Middleware Pattern
- ✅ await next() called
- ✅ Next called in proper location

### Error Handling
- ✅ Try-catch present
- ✅ Error logging present
- ✅ Non-blocking error handling

### Documentation
- ✅ Documentation file exists
- ✅ Purpose section present
- ✅ Usage section present

## Validation Result Structure

```typescript
interface ValidationResult {
  valid: boolean;                   // Overall pass/fail
  hookName: string;                 // Hook being validated
  summary: {
    passed: number;                 // Checks passed
    total: number;                  // Total checks
    percentage: number;             // Pass percentage
  };
  checks: Array<{
    name: string;                   // Check name
    passed: boolean;                // Check result
    details: string;                // Check details
  }>;
  errors: string[];                 // Critical errors
  warnings: string[];               // Non-critical warnings
  metadata: {
    strict: boolean;                // Strict mode status
    timestamp: string;              // Validation timestamp
    projectRoot: string;            // Project root path
  };
}
```

## Example Output

### Console Report

```
============================================================
Hook Validation Report: DocumentationLifecycle
============================================================

Status: ✅ PASSED
Score: 15/17 checks (88%)

------------------------------------------------------------
Checks:
------------------------------------------------------------
✓ File exists: Hook implementation file
✓ File exists: Test file
✓ Hook function exported
✓ Context parameter present
✓ Next parameter present
✓ Default export present
✓ Vitest imports present
✓ Hook imported in test
✓ Test describe block present
✓ Test cases present
✓ Hook imported in index
✓ Hook registered
✓ Priority specified
✓ Valid priority range
✓ Middleware pattern (await next)
✗ Next called properly
✗ Documentation exists

------------------------------------------------------------
⚠️  Warnings:
------------------------------------------------------------
  • Ensure next() is called appropriately in control flow
  • Hook should have documentation in lib/hooks/docs/

============================================================
```

### Markdown Report

```markdown
# Hook Validation Report: DocumentationLifecycle

![PASSED](https://img.shields.io/badge/status-PASSED-green)

## Summary

- **Status:** ✅ PASSED
- **Score:** 15/17 (88%)
- **Timestamp:** 2025-11-11T18:31:00.000Z
- **Strict Mode:** Yes

## Validation Checks

| Check | Status | Details |
|-------|--------|---------|
| File exists: Hook implementation file | ✓ | /path/to/documentation-lifecycle.js |
| Hook function exported | ✓ | Looking for: export function documentationLifecycle |
...
```

## Integration with Artifact Generator

Validate hooks immediately after generation:

```javascript
import { HookArtifactGenerator } from './lib/hooks/detector/HookArtifactGenerator.js';
import { validateHook } from './lib/hooks/validator/HookValidator.js';
import { ValidationReporter } from './lib/hooks/validator/ValidationReporter.js';

// Generate hook
const generator = new HookArtifactGenerator();
const generationResult = await generator.generate(hookRecommendation, context);

if (generationResult.success) {
  // Validate generated hook
  const validationResult = await validateHook(hookRecommendation.name);
  
  // Generate report
  const report = ValidationReporter.generateConsoleReport(validationResult);
  console.log(report);
  
  if (!validationResult.valid) {
    console.error('Generated hook has validation errors!');
    console.error('Please review and fix before committing.');
  }
}
```

## CLI Usage Example

Create a validation script:

```javascript
#!/usr/bin/env node

import { validateAllHooks } from './lib/hooks/validator/HookValidator.js';
import { ValidationReporter } from './lib/hooks/validator/ValidationReporter.js';

async function main() {
  const results = await validateAllHooks({ projectRoot: process.cwd() });
  
  const report = ValidationReporter.generateBatchConsoleReport(results);
  console.log(report);
  
  // Exit with error code if any failed
  process.exit(results.failed > 0 ? 1 : 0);
}

main();
```

Run in CI/CD:

```bash
node scripts/validate-hooks.js || exit 1
```

## Strict vs Non-Strict Mode

### Strict Mode (Default)
- All checks are enforced
- Warnings for optional best practices
- Documentation required
- Default exports required

```javascript
const validator = new HookValidator({ strict: true });
```

### Non-Strict Mode
- Only critical checks enforced
- Fewer warnings
- Documentation optional
- More lenient

```javascript
const validator = new HookValidator({ strict: false });
```

## Testing

Run the test suite:

```bash
npm test -- tests/hooks/HookValidator.test.js
```

Test coverage:
- ✅ Basic functionality (3 tests)
- ✅ Validation result structure (3 tests)
- ✅ File existence checks (3 tests)
- ✅ Hook structure validation (4 tests)
- ✅ Test file validation (4 tests)
- ✅ Registration validation (2 tests)
- ✅ Priority validation (2 tests)
- ✅ Middleware pattern validation (2 tests)
- ✅ Error handling validation (3 tests)
- ✅ Documentation validation (2 tests)
- ✅ Batch validation (2 tests)
- ✅ Convenience functions (2 tests)
- ✅ Strict vs non-strict mode (2 tests)
- ✅ Name conversion (1 test)
- ✅ ValidationReporter (10 tests)

**Total: 45/45 passing**

## Best Practices

1. **Validate After Generation**: Always validate hooks immediately after generating them
2. **Use Strict Mode in Development**: Catch issues early
3. **Integrate with CI/CD**: Prevent invalid hooks from being merged
4. **Save Reports**: Keep validation reports for audit trails
5. **Fix Errors First**: Address errors before warnings
6. **Review Warnings**: Even in non-strict mode, review warnings for potential issues

## Troubleshooting

### Hook Not Found
- Check hook name matches file name (kebab-case)
- Verify project root is correct
- Ensure hook file exists in `lib/hooks/`

### Registration Not Detected
- Check hook is imported in `lib/hooks/index.js`
- Verify `hookManager.register()` call exists
- Ensure function name matches expected pattern

### Test File Issues
- Verify test file in `tests/hooks/`
- Check Vitest imports are correct
- Ensure test cases use `it()` or `test()`

### False Positives
- Use non-strict mode for less critical validation
- Check validation logic for edge cases
- File issue if validator has bugs

## Related Documentation

- [Hook Artifact Generator](../detector/ARTIFACT_GENERATOR_README.md)
- [Hook Requirement Detector](../detector/README.md)
- [Integration Checklist Generator](../detector/CHECKLIST_EXAMPLE.md)
- [Hook System Documentation](../README.md)

## Version History

### 1.0.0 (Current)
- Initial release
- 9 validation categories
- 45 comprehensive tests
- Multiple report formats
- Batch validation support
- Strict/non-strict modes

---

**Generated by:** Task Master Hook Assessment System  
**Part of:** Subtask 97.4 - Automated Validation and Verification System  
**Status:** ✅ Complete and Production Ready

