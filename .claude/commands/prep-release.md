# Prepare Release

Complete pre-release validation checklist to ensure quality.

## Steps

1. **Validate Documentation**
   - Run `/validate-docs` to check all documentation
   - Ensure all links are valid
   - Verify code examples are correct

2. **Run Test Suite**
   - Execute `/run-tests` to run all tests
   - Verify all tests pass
   - Check performance benchmarks

3. **Check Version Consistency**
   - Verify version numbers match across files
   - Check metadata.json version
   - Validate package.json versions (if applicable)

4. **Validate Examples**
   - Test all example scripts
   - Verify example code runs correctly
   - Check example documentation

5. **Review Git Status**
   - Check for uncommitted changes
   - Verify all files are tracked
   - Ensure clean working directory

6. **Generate Release Notes**
   - Summarize changes since last release
   - List new features
   - Document breaking changes

## Example Commands

```bash
echo "╔════════════════════════════════════════╗"
echo "║  Pre-Release Validation Checklist      ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Step 1: Documentation Validation
echo "1. Validating documentation..."
# (Run validate-docs commands here)

# Step 2: Test Suite
echo ""
echo "2. Running test suite..."
# (Run test commands here)

# Step 3: Version Check
echo ""
echo "3. Checking version consistency..."
VERSION=$(jq -r '.version' .claude/metadata.json)
echo "   Current version: $VERSION"

# Step 4: Example Validation
echo ""
echo "4. Validating examples..."
if [ -d examples/ ]; then
  for example in examples/*.mjs; do
    if [ -f "$example" ]; then
      echo "   Checking: $(basename "$example")"
      node "$example" > /dev/null 2>&1 && echo "   ✓ Valid" || echo "   ❌ Failed"
    fi
  done
fi

# Step 5: Git Status
echo ""
echo "5. Checking git status..."
git status --short
if [ -z "$(git status --porcelain)" ]; then
  echo "   ✓ Working directory clean"
else
  echo "   ⚠️  Uncommitted changes present"
fi

# Step 6: Release Summary
echo ""
echo "6. Release summary..."
echo "   Ready for release: $VERSION"
echo ""
echo "────────────────────────────────────────"
echo "✓ Pre-release validation complete"
```

## Checklist

- [ ] All documentation validated
- [ ] All tests passing
- [ ] Version numbers consistent
- [ ] Examples working
- [ ] Git working directory clean
- [ ] Release notes prepared

## Success Criteria
- All validation checks pass
- Test suite shows 100% pass rate
- No uncommitted changes
- Examples execute successfully
- Ready to tag and release
