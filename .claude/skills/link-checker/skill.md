# Link Checker Skill

## Purpose
Validate all links in documentation to prevent broken references and ensure documentation quality.

## Capabilities
- Check internal document links
- Validate relative file paths
- Verify anchor links within documents
- Test external URL reachability (optional)
- Report broken or suspicious links

## Usage
Invoke this skill when:
- Updating documentation with new links
- Refactoring file structure
- Before committing documentation changes
- During pre-release validation

## Link Types Validated

### 1. Internal Document Links
```markdown
[Getting Started](GETTING_STARTED.md)
[CLI Reference](CLI_REFERENCE.md)
```
- Verify target file exists
- Check file path correctness
- Validate case sensitivity

### 2. Anchor Links
```markdown
[Installation](#installation)
[Prerequisites](GETTING_STARTED.md#prerequisites)
```
- Verify anchor exists in target document
- Check anchor format (lowercase, hyphens)
- Validate cross-document anchors

### 3. Relative Path Links
```markdown
[Config](../.claude/config.json)
[Template](~/.claude/templates/base/)
```
- Resolve relative paths
- Verify file/directory existence
- Check path traversal validity

### 4. External URLs (Optional)
```markdown
[GitHub](https://github.com/...)
[Docs](https://docs.claude.com/...)
```
- HTTP/HTTPS reachability
- Response status codes
- Redirect following

## Command Examples

```bash
# Find all markdown links
grep -roh '\[.*\](.*)' Docs/ | sort | uniq

# Extract link targets
grep -roh '](.*)'  Docs/ | sed 's/](\(.*\))/\1/' | grep -v '^http'

# Check for broken internal links
for f in Docs/*.md; do
  grep -oh '](.*\.md[^)]*)' "$f" | while read -r link; do
    target=$(echo "$link" | sed 's/](\(.*\))/\1/' | cut -d'#' -f1)
    if [ -n "$target" ] && [ ! -f "Docs/$target" ]; then
      echo "Broken link in $f: $target"
    fi
  done
done

# Validate anchor links
for f in Docs/*.md; do
  # Extract anchors defined in file
  anchors=$(grep -o '^#.*' "$f" | sed 's/# *//' | tr '[:upper:] ' '[:lower:]-')

  # Extract anchor references
  refs=$(grep -oh '#[a-z-]*' "$f")

  # Compare and report missing
  echo "Checking anchors in $f"
done
```

## Validation Process

1. **Discovery Phase**
   - Scan all .md files
   - Extract all link patterns
   - Categorize by link type

2. **Internal Link Validation**
   - Resolve relative paths from each file
   - Check file existence
   - Verify path correctness

3. **Anchor Validation**
   - Extract heading anchors from target files
   - Normalize anchor format (lowercase, hyphens)
   - Match references to definitions

4. **External Link Validation** (Optional)
   - HTTP HEAD requests to verify
   - Check response codes (200, 301, 302)
   - Report timeouts or errors

## Expected Output

```
🔗 Link Validation Results
────────────────────────────────

Docs/README.md
  ✓ Internal links: 5/5 valid
  ✓ Anchor links: 3/3 valid
  ⚠ External links: 1 not checked

Docs/GETTING_STARTED.md
  ✓ Internal links: 12/12 valid
  ✓ Anchor links: 8/8 valid
  ❌ Broken link: [CLI Reference](CLI_REF.md) -> File not found

────────────────────────────────
Total Links Checked: 47
✓ Valid: 45
⚠ Warnings: 1
❌ Broken: 1
```

## Integration Points
- Called by PostToolUse hook after doc edits
- Triggered by `/validate-docs` command
- Used in UserPromptSubmit hook for warnings
- Part of pre-commit validation

## Common Issues Detected
- Typos in filenames
- Case sensitivity mismatches
- Missing anchor definitions
- Incorrect relative paths
- Dead external links

## Error Handling
- Non-blocking warnings for external links
- Blocking errors for broken internal links
- Suggestions for fixing broken references
- Auto-detect similar valid targets

## Dependencies
- bash, grep, sed (text processing)
- curl (external URL checking, optional)

## Success Criteria
- All internal links resolve correctly
- All anchors exist in target documents
- No broken relative paths
- External links respond (if checked)
