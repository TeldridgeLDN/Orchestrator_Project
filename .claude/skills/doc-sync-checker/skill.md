# Documentation Sync Checker Skill

## Purpose
Verify that documentation remains synchronized with actual implementation, catching drift between code and docs.

## Capabilities
- Compare documented commands against actual CLI help output
- Verify code examples match current API signatures
- Check that configuration examples reflect actual schema
- Detect outdated version references
- Validate that documented file paths exist

## Usage
Invoke this skill when:
- After updating code that affects documentation
- Before releases to catch documentation drift
- When documentation seems out of sync with reality
- During regular maintenance checks

## Validation Checks

### 1. CLI Command Accuracy
- Compare documented command syntax against `--help` output
- Verify all flags and options are documented
- Check that examples use current command structure
- Validate error messages match actual output

### 2. Code Example Validation
- Extract code examples from markdown
- Verify they match current API signatures
- Check imports and dependencies are correct
- Ensure examples actually execute successfully

### 3. Configuration Schema Sync
- Compare documented config against actual schema
- Verify all config options are documented
- Check that default values are accurate
- Validate that deprecated options are marked

### 4. File Path Verification
- Check that all documented file paths exist
- Verify directory structures are accurate
- Validate that examples reference real files
- Ensure templates and examples are current

### 5. Version Consistency
- Check that version numbers are consistent
- Verify deprecation notices are accurate
- Validate changelog entries
- Ensure migration guides are current

## Command Examples

```bash
# Extract and validate CLI commands from docs
grep -r '```bash' Docs/ | grep 'task-master' | while read -r line; do
  # Compare against actual CLI help
  task-master --help | grep -q "$cmd" || echo "Outdated: $cmd"
done

# Validate code examples execute successfully
for example in examples/*.mjs; do
  node "$example" > /dev/null 2>&1 || echo "Broken example: $example"
done

# Check configuration schema sync
jq '.properties | keys[]' .taskmaster/schema.json > /tmp/schema-keys
grep -o '"[^"]*":' .taskmaster/config.json | tr -d '":' | sort > /tmp/config-keys
diff /tmp/schema-keys /tmp/config-keys || echo "Schema mismatch"

# Verify documented file paths exist
grep -r '\[.*\](.*)' Docs/ | grep -o '([^)]*)' | tr -d '()' | while read -r path; do
  [ -e "$path" ] || echo "Missing file: $path"
done
```

## Integration Points
- Called by `/validate-docs` command after syntax checks
- Triggered when documentation or code changes
- Part of pre-release validation workflow
- Used in CI/CD to prevent documentation drift

## Expected Output
```
✓ CLI commands: PASS (12/12 synchronized)
✓ Code examples: PASS (5/5 execute successfully)
✓ Configuration: PASS (schema matches docs)
⚠ File paths: 1 outdated reference found
✓ Version numbers: PASS (consistent across files)
```

## Common Drift Patterns Detected
- CLI flags added but not documented
- Code examples using deprecated APIs
- Configuration options documented but not implemented
- File paths changed but docs not updated
- Version numbers inconsistent across files

## Remediation Guidance
When drift is detected:
1. Identify the source of truth (code vs docs)
2. Update the out-of-sync component
3. Verify fix with targeted validation
4. Document the change in changelog

## Dependencies
- bash (shell scripts)
- jq (JSON processing)
- node (for executing examples)
- grep, diff, awk (text processing)

## Success Criteria
- All documented commands match actual CLI
- All code examples execute successfully
- Configuration docs match actual schema
- All file path references are valid
- Version numbers are consistent
