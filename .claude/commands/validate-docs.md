# Validate Documentation

Run comprehensive documentation validation checks.

## Steps

1. **Markdown Syntax Validation**
   - Check all .md files in Docs/ for syntax errors
   - Verify code blocks are properly closed
   - Ensure proper heading hierarchy

2. **Link Validation**
   - Check all internal links resolve correctly
   - Verify anchor links exist
   - Validate relative paths

3. **Code Block Validation**
   - Ensure all code blocks have language tags
   - Check for proper formatting
   - Verify example code syntax

4. **JSON Validation**
   - Validate all .json files in .claude/
   - Check configuration files for syntax errors

5. **Report Results**
   - Summarize validation findings
   - Highlight any issues found
   - Provide fix suggestions

## Example Commands

```bash
# Validate markdown syntax
for f in Docs/*.md; do
  echo "Validating: $f"

  # Check unclosed code blocks
  blocks=$(grep -c '```' "$f" 2>/dev/null || echo "0")
  if [ $((blocks % 2)) -ne 0 ]; then
    echo "  ❌ Unclosed code block"
  else
    echo "  ✓ Code blocks OK"
  fi
done

# Validate JSON files
echo ""
echo "Validating JSON files..."
find .claude -name "*.json" -exec sh -c 'echo "  Checking: {}"; jq empty "{}" 2>&1 && echo "  ✓ Valid JSON" || echo "  ❌ Invalid JSON"' \;

# Check internal links
echo ""
echo "Validating internal links..."
grep -roh '\[.*\](.*\.md[^)]*)' Docs/ | sed 's/.*](\(.*\))/\1/' | cut -d'#' -f1 | sort -u | while read -r link; do
  if [ -n "$link" ]; then
    if [ -f "Docs/$link" ]; then
      echo "  ✓ $link"
    else
      echo "  ❌ Broken: $link"
    fi
  fi
done
```

## Success Criteria
- All markdown files have valid syntax
- All internal links resolve
- All JSON files parse correctly
- No broken references found
