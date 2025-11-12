# Scenario Validation Guide

## Overview

The Scenario Validation System provides robust YAML schema validation for Claude scenario definition files. It ensures that scenario configurations are structurally sound, type-safe, and complete before they are used in production workflows.

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Validation CLI](#validation-cli)
- [Schema Reference](#schema-reference)
- [Programmatic Usage](#programmatic-usage)
- [Error Messages](#error-messages)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Validate a Single Scenario

```bash
node lib/commands/validate-scenario.js --file path/to/scenario.yaml
```

### Validate All Scenarios in a Directory

```bash
node lib/commands/validate-scenario.js --dir ~/.claude/scenarios
```

### Verbose Error Output

```bash
node lib/commands/validate-scenario.js --file path/to/scenario.yaml --verbose
```

## Installation

### Prerequisites

- Node.js 18+ (ES Modules support required)
- npm or pnpm

### Dependencies

```bash
npm install js-yaml ajv ajv-formats
```

### Directory Structure

```
project/
├── lib/
│   ├── schemas/
│   │   └── scenario-schema.json        # JSON Schema definition
│   ├── validators/
│   │   └── scenario-validator.js       # Validation logic
│   └── commands/
│       └── validate-scenario.js        # CLI interface
├── ~/.claude/scenarios/                 # Scenario storage directory
└── tests/
    └── fixtures/scenarios/              # Sample scenarios for testing
```

## Validation CLI

### Commands

#### Validate Single File

```bash
node lib/commands/validate-scenario.js --file <path>
```

**Options:**
- `--verbose` : Show detailed error breakdown
- `--json` : Output machine-readable JSON format

**Example:**
```bash
node lib/commands/validate-scenario.js --file ~/.claude/scenarios/client-onboarding.yaml --verbose
```

#### Validate Directory

```bash
node lib/commands/validate-scenario.js --dir <path>
```

**Options:**
- `--verbose` : Show detailed errors for each file
- `--json` : Output batch results as JSON

**Example:**
```bash
node lib/commands/validate-scenario.js --dir ~/.claude/scenarios
```

### CLI Output

#### Success Output

```
======================================================================
  Scenario Validation Report
======================================================================

File: ~/.claude/scenarios/client-onboarding.yaml
Scenario: E-Commerce Client Onboarding
Version: 1.0.0
Timestamp: 11/10/2025, 9:00:00 AM

✅ Validation PASSED - Scenario is valid!

Summary:
  - All required fields present
  - All field types correct
  - All nested structures valid

======================================================================
```

#### Error Output

```
======================================================================
  Scenario Validation Report
======================================================================

File: ~/.claude/scenarios/invalid-scenario.yaml
Scenario: Test Scenario
Version: undefined
Timestamp: 11/10/2025, 9:00:00 AM

❌ Validation FAILED - 5 error(s) found

🔴 Missing Required Fields:

1. scenario_flow
   ❌ Field is required but missing
   💡 Add the 'scenario_flow' field with required sub-fields

⚠️  Type Errors:

2. domain
   ❌ Invalid enum value: 'InvalidDomain'
   💡 Allowed values: E-commerce, SaaS, Agency, Consulting, Internal Tools, Other

3. version
   ❌ Does not match pattern ^\d+\.\d+(\.\d+)?$
   💡 Use semver format (e.g., 1.0.0)

💡 Quick Fixes:
  1. Check for required fields marked with ❌
  2. Verify data types (string, array, object)
  3. Ensure enum values match allowed options
  4. Review suggestions (💡) for each error

  Use --verbose for detailed error breakdown
  Use --json for machine-readable output

======================================================================
```

## Schema Reference

### Required Top-Level Fields

```yaml
name: string                    # Scenario name (3-100 characters)
domain: enum                    # Business domain
complexity: enum                # Beginner | Intermediate | Advanced | Expert
version: string                 # Semver format (e.g., 1.0.0)
status: enum                    # Draft | In Review | Active | Deprecated
executive_summary: object       # Business context and metrics
scenario_overview: object       # Problem and solution description
workflow_composition: object    # Workflows and dependencies
scenario_flow: object           # Phase-based execution flow
```

### Optional Top-Level Fields

```yaml
business_model: string          # Business context description
date: string                    # ISO date (YYYY-MM-DD)
key_stakeholders: array         # Stakeholder information
success_metrics: array          # KPIs and measurement criteria
roi_analysis: object            # ROI calculations and projections
decision_tree: object           # Decision logic and branching
complete_example_execution: object  # Example walkthroughs
data_structures: object         # Data models and schemas
customization_points: object    # Extension points
dependencies: object            # External dependencies
monitoring_analytics: object    # Observability configuration
troubleshooting: object         # Common issues and solutions
testing: object                 # Test strategy
extensions: object              # Future enhancements
performance_scalability: object # Performance requirements
related_scenarios: array        # Links to related scenarios
changelog: array                # Version history
support_feedback: object        # Support information
```

### Scenario Flow Structure

```yaml
scenario_flow:
  phases:
    - id: string | number               # Phase identifier
      name: string                      # Phase name
      trigger: string                   # What initiates this phase
      duration: string                  # Expected duration
      workflows_used: array<string>     # Workflows executed
      
      inputs: array<object>             # Phase inputs
        - name: string
          source: string
          format: string
          required: boolean
      
      outputs: array<object>            # Phase outputs
        - name: string
          destination: string
          format: string
          used_in: string
      
      decision_points: array<object>    # Conditional logic
        - condition: string
          action: string
          reasoning: string
      
      error_handling: array<object>     # Error recovery
        - error: string
          recovery_action: string
          fallback: string
      
      success_criteria: array<string>   # Completion criteria
```

### Enum Values

#### Domain
- E-commerce
- SaaS
- Agency
- Consulting
- Internal Tools
- Other

#### Complexity
- Beginner
- Intermediate
- Advanced
- Expert

#### Status
- Draft
- In Review
- Active
- Deprecated

## Programmatic Usage

### Basic Validation

```javascript
import scenarioValidator from './lib/validators/scenario-validator.js';

// Validate a YAML file
const result = scenarioValidator.validateScenario('path/to/scenario.yaml');

if (result.valid) {
  console.log('Scenario is valid!');
} else {
  console.error(`Validation failed with ${result.errorCount} errors`);
  result.errors.forEach(error => {
    console.error(`- ${error.field}: ${error.message}`);
  });
}
```

### In-Memory Validation

```javascript
import scenarioValidator from './lib/validators/scenario-validator.js';

// Validate a JavaScript object directly
const scenarioData = {
  name: 'My Scenario',
  domain: 'E-commerce',
  complexity: 'Intermediate',
  version: '1.0.0',
  status: 'Active',
  // ... rest of scenario structure
};

const result = scenarioValidator.validateScenario(scenarioData);
console.log('Valid:', result.valid);
```

### Batch Validation

```javascript
import scenarioValidator from './lib/validators/scenario-validator.js';
import fs from 'fs/promises';
import path from 'path';

const scenariosDir = '~/.claude/scenarios';
const files = await fs.readdir(scenariosDir);

const results = await scenarioValidator.validateBatch(
  files
    .filter(f => f.endsWith('.yaml'))
    .map(f => path.join(scenariosDir, f))
);

console.log(`Validated ${results.length} scenarios`);
console.log(`Valid: ${results.filter(r => r.valid).length}`);
console.log(`Invalid: ${results.filter(r => !r.valid).length}`);
```

### Custom Validation Rules

```javascript
import scenarioValidator from './lib/validators/scenario-validator.js';

// Add a custom validation rule
const customRule = scenarioValidator.createCustomRule(
  'businessHoursOnly',
  (data) => {
    // Custom logic
    if (data.execution_window && data.execution_window.includes('24/7')) {
      return {
        valid: false,
        errors: [{
          field: 'execution_window',
          message: 'Business hours only scenarios cannot run 24/7'
        }]
      };
    }
    return { valid: true, errors: [] };
  }
);

// Validate with custom rule
const result = scenarioValidator.validateScenario(data, {
  customRules: [customRule]
});
```

### Error Formatting

```javascript
import scenarioValidator from './lib/validators/scenario-validator.js';

const result = scenarioValidator.validateScenario('scenario.yaml');

if (!result.valid) {
  // Group errors by field
  const grouped = scenarioValidator.groupErrorsByField(result.errors);
  
  for (const [field, errors] of Object.entries(grouped)) {
    console.log(`\n${field}:`);
    errors.forEach(error => {
      console.log(`  - ${error.message}`);
      if (error.suggestion) {
        console.log(`    💡 ${error.suggestion}`);
      }
    });
  }
  
  // Get validation summary
  const summary = scenarioValidator.createValidationSummary(
    result.valid,
    result.errors,
    result.data
  );
  
  console.log(`\nCritical errors: ${summary.criticalErrorCount}`);
  console.log(`Warnings: ${summary.warningCount}`);
}
```

## Error Messages

### Common Validation Errors

#### Missing Required Fields

```
❌ Field is required but missing
💡 Add the 'scenario_flow' field with required sub-fields
```

**Fix:** Ensure all required top-level fields are present.

#### Invalid Enum Value

```
❌ Invalid enum value: 'InvalidDomain'
💡 Allowed values: E-commerce, SaaS, Agency, Consulting, Internal Tools, Other
```

**Fix:** Use one of the allowed enum values.

#### String Length Violations

```
❌ String too short (minimum 50 characters)
💡 Provide a more detailed description
```

**Fix:** Expand the string to meet minimum length requirements.

#### Invalid Version Format

```
❌ Does not match pattern ^\d+\.\d+(\.\d+)?$
💡 Use semver format (e.g., 1.0.0)
```

**Fix:** Use semantic versioning format (major.minor.patch).

#### Empty Arrays

```
❌ Array must contain at least 1 item(s)
💡 Add at least one item to the array
```

**Fix:** Add required array items or remove the empty array if it's optional.

#### Type Mismatches

```
❌ Expected type 'string' but got 'number'
💡 Ensure the field is of type string
```

**Fix:** Correct the data type to match schema expectations.

## Best Practices

### 1. Validate Early and Often

- Validate scenarios during development before committing
- Run validation as part of CI/CD pipelines
- Use pre-commit hooks for automatic validation

```bash
# .git/hooks/pre-commit
#!/bin/bash
node lib/commands/validate-scenario.js --dir ~/.claude/scenarios
```

### 2. Use Descriptive Names

```yaml
# Good
name: "E-Commerce Client Onboarding with Payment Processing"

# Bad
name: "Test"
```

### 3. Provide Detailed Success Criteria

```yaml
# Good
success_criteria:
  - "Client record created in database with all required fields"
  - "Payment confirmation email sent to client"
  - "30% deposit received and recorded in accounting system"

# Bad
success_criteria:
  - "Done"  # Too short! Minimum 5 characters required
```

### 4. Document Decision Points

```yaml
decision_points:
  - condition: "Package is 'enterprise'"
    action: "Assign senior PM and schedule kickoff call"
    reasoning: "Enterprise clients require white-glove service and dedicated support"
```

### 5. Include Error Handling

```yaml
error_handling:
  - error: "Payment gateway timeout"
    recovery_action: "Retry payment processing with exponential backoff"
    fallback: "Send manual payment link to client via email"
```

### 6. Version Your Scenarios

- Use semantic versioning
- Document changes in the `changelog` field
- Mark deprecated scenarios with status: "Deprecated"

```yaml
version: "2.1.0"
changelog:
  - version: "2.1.0"
    date: "2025-01-15"
    changes:
      - "Added automated email notifications"
      - "Improved error handling for payment failures"
```

## Troubleshooting

### Issue: Schema File Not Found

**Error:**
```
Failed to load or parse schema from lib/schemas/scenario-schema.json
```

**Solution:**
- Verify the schema file exists at `lib/schemas/scenario-schema.json`
- Check file permissions
- Ensure the path is correct relative to your working directory

### Issue: YAML Parsing Error

**Error:**
```
YAML parsing error: bad indentation of a mapping entry
```

**Solution:**
- Check YAML indentation (use spaces, not tabs)
- Validate YAML syntax using an online validator
- Ensure proper quoting of strings with special characters

### Issue: Ajv Strict Mode Errors

**Error:**
```
strict mode: use allowUnionTypes to allow union type keyword
```

**Solution:**
This is handled automatically by the validator. If you see this error:
- Update to the latest version of the validator
- Ensure `allowUnionTypes: true` is set in Ajv options

### Issue: Validation Takes Too Long

**Symptom:** Validation hangs or takes excessive time

**Solution:**
- Check for circular references in the scenario data
- Validate smaller batches of files
- Increase Node.js memory limit: `node --max-old-space-size=4096 ...`

### Issue: False Positive Errors

**Symptom:** Validator reports errors for valid scenarios

**Solution:**
1. Verify you're using the latest schema version
2. Check if the schema has `additionalProperties: false` - this has been changed to `true` for flexibility
3. Review custom validation rules for conflicts
4. Report the issue with a minimal reproduction case

## Advanced Topics

### Extending the Schema

To add custom fields to the schema:

1. Edit `lib/schemas/scenario-schema.json`
2. Add your custom properties under the appropriate section
3. Update documentation
4. Increment the schema version

```json
{
  "properties": {
    "myCustomField": {
      "type": "string",
      "description": "My custom field description",
      "minLength": 10
    }
  }
}
```

### Integration with Build Tools

#### GitHub Actions

```yaml
name: Validate Scenarios
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: node lib/commands/validate-scenario.js --dir ~/.claude/scenarios
```

#### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Validating scenarios..."
node lib/commands/validate-scenario.js --dir ~/.claude/scenarios

if [ $? -ne 0 ]; then
  echo "❌ Scenario validation failed. Please fix errors before committing."
  exit 1
fi

echo "✅ All scenarios valid"
exit 0
```

## Support and Resources

- **Schema Location**: `lib/schemas/scenario-schema.json`
- **Validator Source**: `lib/validators/scenario-validator.js`
- **CLI Source**: `lib/commands/validate-scenario.js`
- **Sample Scenarios**: `tests/fixtures/scenarios/`
- **Test Suite**: `tests/scenario-validator.test.js`

For issues or questions, refer to the project's main documentation or open an issue in the project repository.

