# Scenario Workflows - Testing Guide

This guide provides comprehensive testing procedures for the scenario creation and analysis workflows, including unit tests, integration tests, and user acceptance tests.

## Table of Contents

- [Overview](#overview)
- [Test Environment Setup](#test-environment-setup)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [End-to-End Tests](#end-to-end-tests)
- [User Acceptance Tests](#user-acceptance-tests)
- [Performance Tests](#performance-tests)
- [Troubleshooting Tests](#troubleshooting-tests)

---

## Overview

### Testing Scope

The scenario workflows involve:
1. **CLI Commands** - Create, validate, optimize, explore, deploy
2. **Workflow Documentation** - Guides and references
3. **User Interactions** - Prompts, validation, feedback
4. **File Operations** - YAML generation, validation, updates

### Testing Objectives

- ✅ Verify all CLI commands work correctly
- ✅ Validate workflow guidance is accurate
- ✅ Ensure proper error handling
- ✅ Confirm user experience is smooth
- ✅ Test edge cases and failure scenarios
- ✅ Verify integration between components

---

## Test Environment Setup

### Prerequisites

```bash
# Install dependencies
npm install

# Verify installation
node bin/diet103.js --version
node bin/diet103.js scenario --help

# Create test scenarios directory
mkdir -p ~/.claude/scenarios-test
export SCENARIOS_DIR=~/.claude/scenarios-test
```

### Clean Test Environment

```bash
#!/bin/bash
# setup-test-env.sh

# Backup existing scenarios
if [ -d ~/.claude/scenarios ]; then
  mv ~/.claude/scenarios ~/.claude/scenarios-backup-$(date +%Y%m%d-%H%M%S)
fi

# Create clean scenarios directory
mkdir -p ~/.claude/scenarios

echo "Test environment ready"
```

### Teardown

```bash
#!/bin/bash
# teardown-test-env.sh

# Remove test scenarios
rm -rf ~/.claude/scenarios

# Restore backup if exists
BACKUP=$(ls -td ~/.claude/scenarios-backup-* 2>/dev/null | head -1)
if [ -n "$BACKUP" ]; then
  mv "$BACKUP" ~/.claude/scenarios
  echo "Restored scenarios from backup"
fi
```

---

## Unit Tests

### CLI Command Tests

**Already Implemented:** 41 unit tests in Task 69

```bash
# Run all scenario command tests
npm test -- lib/commands/scenario/__tests__/

# Results should show:
✓ Command group:    4 tests
✓ Create:           3 tests
✓ List:             3 tests
✓ Show:             4 tests
✓ Edit:             4 tests
✓ Validate:         4 tests
✓ Deploy:           5 tests
✓ Remove:           5 tests
✓ Optimize:         4 tests
✓ Explore:          5 tests
────────────────────────────
Total:             41 tests
```

### Additional Unit Test Coverage

Test specific workflow functions:

```javascript
// test/workflows/scenario-creation.test.js

import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

describe('Scenario Workflows', () => {
  describe('Create Workflow', () => {
    it('should have valid create_scenario.md', async () => {
      const content = await fs.readFile(
        'Docs/workflows/library/scenario-creation/create_scenario.md',
        'utf-8'
      );
      
      expect(content).toContain('# Workflow: Interactive Scenario Creation');
      expect(content).toContain('## Implementation');
      expect(content).toContain('diet103 scenario create');
    });
    
    it('should reference all CLI commands', async () => {
      const content = await fs.readFile(
        'Docs/workflows/library/scenario-creation/create_scenario.md',
        'utf-8'
      );
      
      const commands = ['create', 'validate', 'optimize', 'deploy', 'edit', 'show'];
      commands.forEach(cmd => {
        expect(content).toContain(`diet103 scenario ${cmd}`);
      });
    });
  });
  
  describe('Analyze Workflow', () => {
    it('should have valid analyze_scenario.md', async () => {
      const content = await fs.readFile(
        'Docs/workflows/library/scenario-creation/analyze_scenario.md',
        'utf-8'
      );
      
      expect(content).toContain('# Workflow: Scenario Analysis');
      expect(content).toContain('## Implementation');
      expect(content).toContain('diet103 scenario validate');
    });
    
    it('should cover all analysis phases', async () => {
      const content = await fs.readFile(
        'Docs/workflows/library/scenario-creation/analyze_scenario.md',
        'utf-8'
      );
      
      expect(content).toContain('Phase 1: Basic Validation');
      expect(content).toContain('Phase 2: Optimization Analysis');
      expect(content).toContain('Phase 3: Feasibility Assessment');
      expect(content).toContain('Phase 4: Alternative Exploration');
      expect(content).toContain('Phase 5: Performance Analysis');
    });
  });
  
  describe('Integration', () => {
    it('should have CLI help referencing workflows', async () => {
      // This would test the actual CLI output
      // Implementation depends on how you want to test CLI
    });
  });
});
```

---

## Integration Tests

### Test 1: Create to Deploy Flow

```bash
#!/bin/bash
# test-create-to-deploy.sh

set -e

echo "=== Test: Create to Deploy Flow ==="

# Step 1: Create scenario
echo "Creating test scenario..."
node bin/diet103.js scenario create \
  --template basic \
  --name integration-test \
  --no-interactive

# Step 2: Validate
echo "Validating scenario..."
node bin/diet103.js scenario validate integration-test

# Step 3: Show details
echo "Showing scenario..."
node bin/diet103.js scenario show integration-test

# Step 4: Optimize
echo "Checking for optimizations..."
node bin/diet103.js scenario optimize integration-test

# Step 5: Deploy dry-run
echo "Testing deployment..."
node bin/diet103.js scenario deploy integration-test --dry-run

# Cleanup
echo "Cleaning up..."
node bin/diet103.js scenario remove integration-test -f

echo "✅ Integration test passed!"
```

### Test 2: Edit and Validate Flow

```bash
#!/bin/bash
# test-edit-validate.sh

set -e

echo "=== Test: Edit and Validate Flow ==="

# Create scenario
node bin/diet103.js scenario create \
  --template basic \
  --name edit-test \
  --no-interactive

# Edit scenario (would need non-interactive edit or file manipulation)
echo "Editing scenario..."
# Modify the YAML file directly for testing
sed -i '' 's/version: "1.0.0"/version: "1.0.1"/' ~/.claude/scenarios/edit-test.yaml

# Validate after edit
echo "Validating after edit..."
node bin/diet103.js scenario validate edit-test

# Cleanup
node bin/diet103.js scenario remove edit-test -f

echo "✅ Edit-Validate test passed!"
```

### Test 3: Optimization Application

```bash
#!/bin/bash
# test-optimization.sh

set -e

echo "=== Test: Optimization Flow ==="

# Create scenario (basic template missing some fields)
node bin/diet103.js scenario create \
  --template basic \
  --name optimize-test \
  --no-interactive

# Check for optimizations
echo "Checking for optimizations..."
OUTPUT=$(node bin/diet103.js scenario optimize optimize-test)

if echo "$OUTPUT" | grep -q "optimization"; then
  echo "✅ Optimizations found (expected)"
else
  echo "⚠️  No optimizations found"
fi

# Cleanup
node bin/diet103.js scenario remove optimize-test -f

echo "✅ Optimization test passed!"
```

---

## End-to-End Tests

### E2E Test 1: Complete Scenario Lifecycle

```bash
#!/bin/bash
# e2e-test-complete-lifecycle.sh

set -e

echo "=== E2E Test: Complete Scenario Lifecycle ==="

SCENARIO_NAME="e2e-test-$(date +%s)"

# Phase 1: Creation
echo "Phase 1: Creating scenario..."
node bin/diet103.js scenario create \
  --template advanced \
  --name "$SCENARIO_NAME" \
  --no-interactive

# Verify file exists
if [ ! -f ~/.claude/scenarios/${SCENARIO_NAME}.yaml ]; then
  echo "❌ Scenario file not created"
  exit 1
fi
echo "✅ Scenario created"

# Phase 2: Validation
echo "Phase 2: Validating..."
if node bin/diet103.js scenario validate "$SCENARIO_NAME" | grep -q "All validations passed"; then
  echo "✅ Validation passed"
else
  echo "❌ Validation failed"
  exit 1
fi

# Phase 3: Optimization
echo "Phase 3: Optimizing..."
node bin/diet103.js scenario optimize "$SCENARIO_NAME" > /tmp/${SCENARIO_NAME}-optimize.txt
echo "✅ Optimization complete"

# Phase 4: Exploration
echo "Phase 4: Exploring alternatives..."
node bin/diet103.js scenario explore "$SCENARIO_NAME" > /tmp/${SCENARIO_NAME}-explore.txt
if [ -s /tmp/${SCENARIO_NAME}-explore.txt ]; then
  echo "✅ Alternatives generated"
else
  echo "❌ No alternatives generated"
  exit 1
fi

# Phase 5: Deployment (dry-run)
echo "Phase 5: Testing deployment..."
if node bin/diet103.js scenario deploy "$SCENARIO_NAME" --dry-run | grep -q "Dry Run"; then
  echo "✅ Dry-run successful"
else
  echo "❌ Dry-run failed"
  exit 1
fi

# Phase 6: List verification
echo "Phase 6: Verifying in list..."
if node bin/diet103.js scenario list | grep -q "$SCENARIO_NAME"; then
  echo "✅ Scenario appears in list"
else
  echo "❌ Scenario not in list"
  exit 1
fi

# Phase 7: Cleanup
echo "Phase 7: Removing scenario..."
node bin/diet103.js scenario remove "$SCENARIO_NAME" -f

if [ -f ~/.claude/scenarios/${SCENARIO_NAME}.yaml ]; then
  echo "❌ Scenario file not removed"
  exit 1
fi
echo "✅ Scenario removed"

# Cleanup temp files
rm -f /tmp/${SCENARIO_NAME}-*.txt

echo ""
echo "🎉 E2E Test Complete - All Phases Passed!"
```

### E2E Test 2: Error Handling

```bash
#!/bin/bash
# e2e-test-error-handling.sh

set -e

echo "=== E2E Test: Error Handling ==="

# Test 1: Invalid scenario name
echo "Test: Invalid scenario name..."
if node bin/diet103.js scenario show "NonExistentScenario" 2>&1 | grep -q "not found"; then
  echo "✅ Handles missing scenario correctly"
else
  echo "❌ Did not handle missing scenario"
  exit 1
fi

# Test 2: Create duplicate
echo "Test: Duplicate scenario creation..."
node bin/diet103.js scenario create --template basic --name "duplicate-test" --no-interactive
if node bin/diet103.js scenario create --template basic --name "duplicate-test" --no-interactive 2>&1 | grep -q "exists"; then
  echo "✅ Handles duplicate creation correctly"
else
  echo "❌ Did not handle duplicate"
fi
node bin/diet103.js scenario remove duplicate-test -f

# Test 3: Invalid YAML
echo "Test: Invalid YAML validation..."
node bin/diet103.js scenario create --template basic --name "invalid-test" --no-interactive

# Corrupt the YAML
echo "invalid: yaml: content:" >> ~/.claude/scenarios/invalid-test.yaml

if node bin/diet103.js scenario validate invalid-test 2>&1 | grep -q "YAML"; then
  echo "✅ Detects invalid YAML"
else
  echo "❌ Did not detect invalid YAML"
fi

node bin/diet103.js scenario remove invalid-test -f

echo ""
echo "✅ Error Handling Tests Passed!"
```

---

## User Acceptance Tests

### UAT 1: First-Time User Experience

**Test Scenario:** New user creates their first scenario

**Steps:**
1. User runs `diet103 scenario create`
2. User follows interactive prompts
3. User validates the scenario
4. User views the scenario
5. User deploys to dev

**Success Criteria:**
- [ ] Prompts are clear and easy to understand
- [ ] Validation messages are helpful
- [ ] Created scenario matches expectations
- [ ] Help text is accessible
- [ ] Error messages guide user to solution

**Test Script:**
```bash
# Manual test - run interactively
diet103 scenario create

# Follow prompts:
# Name: my-first-scenario
# Description: Test scenario for UAT
# Category: business_process
# Template: basic
# Trigger: manual

# Verify creation
diet103 scenario show my-first-scenario

# Validate
diet103 scenario validate my-first-scenario

# Deploy
diet103 scenario deploy my-first-scenario --dry-run

# Cleanup
diet103 scenario remove my-first-scenario -f
```

### UAT 2: Workflow Documentation Usage

**Test Scenario:** User follows create_scenario.md workflow

**Steps:**
1. User opens `Docs/workflows/library/scenario-creation/create_scenario.md`
2. User follows Phase 1 (Preparation)
3. User follows Phase 2 (Interactive Creation)
4. User follows Phase 3 (Configuration)
5. User follows Phase 4 (Optimization)
6. User follows Phase 5 (Deployment)

**Success Criteria:**
- [ ] All commands in documentation work
- [ ] Expected outputs match actual outputs
- [ ] Workflow phases are logical
- [ ] Examples are helpful
- [ ] Troubleshooting section addresses issues

### UAT 3: Analysis Workflow

**Test Scenario:** User analyzes existing scenario

**Steps:**
1. Create a scenario with some issues
2. User opens `Docs/workflows/library/scenario-creation/analyze_scenario.md`
3. User follows validation phase
4. User follows optimization phase
5. User reviews alternatives
6. User applies improvements

**Success Criteria:**
- [ ] Issues are detected correctly
- [ ] Optimization suggestions are helpful
- [ ] Alternatives are relevant
- [ ] Analysis report template is useful
- [ ] User can successfully improve scenario

---

## Performance Tests

### Test 1: Creation Performance

```bash
#!/bin/bash
# test-performance-create.sh

echo "=== Performance Test: Creation ==="

for i in {1..10}; do
  START=$(date +%s.%N)
  
  node bin/diet103.js scenario create \
    --template basic \
    --name "perf-test-$i" \
    --no-interactive > /dev/null 2>&1
  
  END=$(date +%s.%N)
  DURATION=$(echo "$END - $START" | bc)
  
  echo "Creation $i: ${DURATION}s"
  
  # Cleanup
  node bin/diet103.js scenario remove "perf-test-$i" -f > /dev/null 2>&1
done

echo "✅ Performance test complete"
```

### Test 2: Validation Performance

```bash
#!/bin/bash
# test-performance-validation.sh

echo "=== Performance Test: Validation ==="

# Create test scenario
node bin/diet103.js scenario create \
  --template advanced \
  --name "perf-validate" \
  --no-interactive

for i in {1..10}; do
  START=$(date +%s.%N)
  
  node bin/diet103.js scenario validate perf-validate > /dev/null 2>&1
  
  END=$(date +%s.%N)
  DURATION=$(echo "$END - $START" | bc)
  
  echo "Validation $i: ${DURATION}s"
done

# Cleanup
node bin/diet103.js scenario remove perf-validate -f

echo "✅ Validation performance test complete"
```

---

## Troubleshooting Tests

### Test Common Issues

```bash
#!/bin/bash
# test-troubleshooting.sh

set -e

echo "=== Troubleshooting Tests ==="

# Issue 1: Scenario not found
echo "Testing: Scenario not found error..."
if node bin/diet103.js scenario show nonexistent 2>&1 | grep -q "not found"; then
  echo "✅ Proper error for missing scenario"
fi

# Issue 2: Invalid name format
echo "Testing: Invalid name format..."
# This would test the interactive prompt validation
# Or non-interactive creation with invalid name

# Issue 3: Validation failures
echo "Testing: Validation failure handling..."
node bin/diet103.js scenario create --template basic --name "val-fail-test" --no-interactive

# Create invalid YAML
echo "invalid yaml content" >> ~/.claude/scenarios/val-fail-test.yaml

if node bin/diet103.js scenario validate val-fail-test 2>&1 | grep -q "YAML"; then
  echo "✅ Detects YAML errors"
fi

node bin/diet103.js scenario remove val-fail-test -f

echo "✅ Troubleshooting tests passed"
```

---

## Test Summary Template

Use this template to document test results:

```markdown
# Test Execution Report

**Date:** YYYY-MM-DD
**Tester:** [Name]
**Environment:** [dev/staging/production]

## Unit Tests
- [ ] All unit tests passing (41/41)
- [ ] No regressions

## Integration Tests
- [ ] Create to Deploy flow: PASS/FAIL
- [ ] Edit and Validate flow: PASS/FAIL
- [ ] Optimization application: PASS/FAIL

## End-to-End Tests
- [ ] Complete lifecycle: PASS/FAIL
- [ ] Error handling: PASS/FAIL

## User Acceptance Tests
- [ ] First-time user experience: PASS/FAIL
- [ ] Workflow documentation: PASS/FAIL
- [ ] Analysis workflow: PASS/FAIL

## Performance Tests
- [ ] Creation performance: < 2s average
- [ ] Validation performance: < 1s average

## Issues Found
1. [Description of issue]
   - Severity: High/Medium/Low
   - Status: Open/Fixed
   
2. [Description of issue]
   - Severity: High/Medium/Low
   - Status: Open/Fixed

## Recommendations
- [Recommendation 1]
- [Recommendation 2]

## Sign-off
- [ ] All critical tests passed
- [ ] Documentation is accurate
- [ ] Ready for release

**Tester Signature:** _______________
**Date:** _______________
```

---

## Continuous Testing

### Automated Test Suite

```bash
#!/bin/bash
# run-all-tests.sh

echo "Running Complete Test Suite..."
echo "=============================="

# 1. Unit tests
echo -e "\n1. Running unit tests..."
npm test -- lib/commands/scenario/__tests__/

# 2. Integration tests
echo -e "\n2. Running integration tests..."
./test-create-to-deploy.sh
./test-edit-validate.sh
./test-optimization.sh

# 3. E2E tests
echo -e "\n3. Running E2E tests..."
./e2e-test-complete-lifecycle.sh
./e2e-test-error-handling.sh

# 4. Performance tests
echo -e "\n4. Running performance tests..."
./test-performance-create.sh
./test-performance-validation.sh

echo -e "\n=============================="
echo "Test Suite Complete!"
```

### CI/CD Integration

```yaml
# .github/workflows/test-scenarios.yml
name: Scenario Workflows Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run unit tests
        run: npm test -- lib/commands/scenario/__tests__/
      
      - name: Run integration tests
        run: |
          chmod +x test-*.sh
          ./test-create-to-deploy.sh
          ./test-edit-validate.sh
      
      - name: Run E2E tests
        run: |
          chmod +x e2e-*.sh
          ./e2e-test-complete-lifecycle.sh
```

---

## Changelog

### v1.0 (2025-11-10)
- Initial testing guide
- Unit test documentation
- Integration test scripts
- E2E test procedures
- UAT templates
- Performance test scripts
- CI/CD integration examples

---

**Last Updated:** 2025-11-10
**Maintainer:** Orchestrator Project Team

