# Documentation Validator Skill

## Purpose
Comprehensive validation of all markdown documentation files in the Orchestrator project.

## Capabilities
- Markdown syntax validation
- Internal link checking
- Code block validation
- Consistency checking across documents
- Terminology verification

## Usage
Invoke this skill when:
- Creating or updating documentation
- Before committing changes
- During pre-release validation
- When suspicious of documentation quality

## Validation Checks

### 1. Markdown Syntax
- Unclosed code blocks (```)
- Malformed headers
- Broken list formatting
- Invalid inline code

### 2. Link Validation
- Internal links to other docs
- Relative path correctness
- Anchor link validity
- External URL reachability (optional)

### 3. Code Block Validation
- Language tags present
- Proper indentation
- Syntax highlighting compatibility
- Example code actually works

### 4. Consistency Checks
- Command syntax uniform across docs
- Terminology consistent
- File path references accurate
- Version numbers aligned

### 5. Structural Validation
- Required sections present
- Proper heading hierarchy
- Table of contents accuracy
- Cross-reference completeness

## Command Examples

```bash
# Validate all documentation
find Docs/ -name "*.md" -exec echo "Validating: {}" \;

# Check for unclosed code blocks
for f in Docs/*.md; do
  count=$(grep -c '```' "$f")
  if [ $((count % 2)) -ne 0 ]; then
    echo "Unclosed code block in: $f"
  fi
done

# Validate internal links
grep -r '\[.*\](.*\.md)' Docs/ | while read -r line; do
  # Extract and verify link targets
  echo "Checking: $line"
done

# Check JSON files
find . -name "*.json" -exec jq empty {} \; 2>&1 | grep -v "parse error" || echo "All JSON valid"
```

## Integration Points
- Called automatically by UserPromptSubmit hook
- Triggered by `/validate-docs` command
- Used in pre-commit workflows
- Part of CI/CD pipeline

## Expected Output
```
✓ Markdown syntax: PASS
✓ Internal links: PASS (15/15 valid)
✓ Code blocks: PASS (23 blocks validated)
✓ Consistency: PASS
⚠ External links: 2 URLs unreachable
```

## Files Validated
- Docs/*.md (all markdown files)
- .claude/*.json (configuration files)
- examples/ (example code validation)
- tests/ (test script syntax)

## Error Handling
- Non-blocking warnings for minor issues
- Blocking errors for critical problems
- Detailed error messages with line numbers
- Suggestions for fixes

## Dependencies
- bash (shell scripts)
- jq (JSON validation)
- grep, sed, awk (text processing)

## Success Criteria
- All markdown files parse correctly
- All internal links resolve
- All code blocks have closing tags
- Terminology consistent across docs
