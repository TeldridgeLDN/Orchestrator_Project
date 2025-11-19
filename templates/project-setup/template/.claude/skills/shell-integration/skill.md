# Shell Integration Skill

**Version:** 1.0.0  
**Auto-Activation:** Shell scripts, bin/ files, *.sh files  
**Priority:** High

---

## Purpose

Expert guidance for creating, maintaining, and debugging shell scripts with proper error handling, portability, and best practices.

---

## When This Skill Activates

### Trigger Phrases
- "shell script"
- "bash script"
- "write script"
- "shell integration"

### File Patterns
- `bin/` directory
- `scripts/` directory
- `*.sh`, `*.bash`, `*.zsh` files

---

## Shell Scripting Best Practices

### 1. Script Header

```bash
#!/bin/bash
# Script Name
# Description: What this script does
# Usage: script-name.sh [options] arguments

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failures
```

### 2. Error Handling

```bash
# Function for errors
error() {
    echo "ERROR: $1" >&2
    exit 1
}

# Usage
[[ -f "$FILE" ]] || error "File not found: $FILE"

# Trap for cleanup
cleanup() {
    rm -f /tmp/tempfile
}
trap cleanup EXIT
```

### 3. Argument Parsing

```bash
# Simple approach
if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <argument>"
    exit 1
fi

# Advanced with getopts
while getopts "hv:o:" opt; do
    case $opt in
        h) show_help; exit 0 ;;
        v) VERBOSE=true ;;
        o) OUTPUT="$OPTARG" ;;
        *) usage; exit 1 ;;
    esac
done
```

### 4. Portability

```bash
# ✅ DO: Use POSIX-compliant commands
if [ -f "$file" ]; then
    echo "File exists"
fi

# ❌ DON'T: Use bash-specific features in #!/bin/sh
if [[ -f "$file" ]]; then  # [[ ]] is bash-only
    echo "File exists"
fi

# ✅ DO: Specify bash if needed
#!/bin/bash
```

### 5. Color Output

```bash
# Define colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'  # No Color

# Usage
echo -e "${GREEN}✓${NC} Success"
echo -e "${RED}✗${NC} Error"
echo -e "${YELLOW}⚠${NC} Warning"
```

### 6. User Interaction

```bash
# Confirmation prompts
read -p "Continue? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # User confirmed
fi

# Non-interactive mode
if [[ "$YES_FLAG" == true ]]; then
    # Skip prompts
else
    # Prompt user
fi
```

### 7. Path Handling

```bash
# Get script directory (robust)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Resolve absolute path
ABSOLUTE_PATH="$(cd "$(dirname "$RELATIVE_PATH")" && pwd)/$(basename "$RELATIVE_PATH")"

# Check if path exists
[[ -d "$DIR" ]] || mkdir -p "$DIR"
```

### 8. Function Organization

```bash
# Helper functions at top
print_header() {
    echo "========================================"
    echo "  $1"
    echo "========================================"
}

# Main logic
main() {
    print_header "Starting..."
    # ... main logic ...
}

# Run main if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

---

## Common Patterns

### Installation Script

```bash
#!/bin/bash
set -e

# Check prerequisites
command -v node >/dev/null 2>&1 || {
    echo "Node.js required but not installed"
    exit 1
}

# Install
npm install -g .
echo "Installation complete"
```

### Configuration Script

```bash
#!/bin/bash
CONFIG_FILE="$HOME/.config/myapp/config.json"

# Ensure directory exists
mkdir -p "$(dirname "$CONFIG_FILE")"

# Write config
cat > "$CONFIG_FILE" << EOF
{
  "version": "1.0.0",
  "settings": {}
}
EOF
```

### Cleanup Script

```bash
#!/bin/bash
set -e

# Define what to clean
TEMP_DIRS=("tmp/" "temp/" ".cache/")
TEMP_FILES=("*.tmp" "*.log")

# Clean directories
for dir in "${TEMP_DIRS[@]}"; do
    [[ -d "$dir" ]] && rm -rf "$dir"
done

# Clean files
for pattern in "${TEMP_FILES[@]}"; do
    find . -name "$pattern" -delete
done
```

---

## Integration with Orchestrator

### Orchestrator CLI Scripts

When creating Orchestrator commands in `bin/`:

1. **Use Node.js for complex logic**
   ```bash
   #!/usr/bin/env node
   // Complex orchestration logic
   ```

2. **Use shell for simple wrappers**
   ```bash
   #!/bin/bash
   # Simple wrapper around Node script
   node "$(dirname "$0")/../lib/main.js" "$@"
   ```

3. **Make executable**
   ```bash
   chmod +x bin/script-name.sh
   ```

4. **Follow naming convention**
   - `setup-*.sh` for installation
   - `*.sh` for utilities
   - No extension for user commands (`orch`, not `orch.sh`)

---

## Shell Alias Integration

### Creating Aliases

```bash
# Add to ~/.zshrc or ~/.bashrc
alias mycommand="full-command --with-flags"
alias shortcut="cd ~/long/path && command"
```

### Orchestrator Aliases

Reference: `bin/setup-aliases.sh`

**Pattern:**
- Detect shell type
- Add to appropriate config file
- Provide reload instructions
- Handle existing aliases

---

## Testing Shell Scripts

### Manual Testing

```bash
# Test normal operation
./script.sh valid-input

# Test error handling
./script.sh invalid-input

# Test edge cases
./script.sh ""
./script.sh --help

# Test non-interactive mode
./script.sh -y
```

### Automated Testing

```bash
# Simple test harness
test_script() {
    if ./script.sh test-input > /dev/null 2>&1; then
        echo "✓ Test passed"
    else
        echo "✗ Test failed"
        exit 1
    fi
}
```

---

## Debugging

### Enable Debug Mode

```bash
#!/bin/bash
set -x  # Print commands as executed
set -v  # Print input lines as read
```

### Check Syntax

```bash
# Bash
bash -n script.sh

# Shellcheck (if installed)
shellcheck script.sh
```

### Common Issues

**Issue:** "Permission denied"
```bash
chmod +x script.sh
```

**Issue:** "Command not found"
```bash
# Check shebang
head -1 script.sh

# Verify interpreter exists
which bash
```

**Issue:** "Syntax error near unexpected token"
```bash
# Usually missing quotes or wrong brackets
# Run: bash -n script.sh
```

---

## Security Considerations

### Input Validation

```bash
# Validate required arguments
[[ -z "$1" ]] && error "Argument required"

# Sanitize user input
SAFE_INPUT="${USER_INPUT//[^a-zA-Z0-9_-]/}"

# Check file permissions before writing
[[ -w "$FILE" ]] || error "Cannot write to: $FILE"
```

### Avoid Injection

```bash
# ❌ DON'T: Direct variable expansion in commands
eval "$USER_COMMAND"

# ✅ DO: Use arrays and proper quoting
cmd_array=("git" "commit" "-m" "$USER_MESSAGE")
"${cmd_array[@]}"
```

---

## Related Resources

- **File Lifecycle:** `.claude/rules/file-lifecycle-standard.md`
- **Platform Primacy:** `.claude/rules/platform-primacy.md`
- **Non-Interactive:** `.claude/rules/non-interactive-execution.md`

---

## Quick Reference

### Essential Commands

| Task | Command |
|------|---------|
| Make executable | `chmod +x script.sh` |
| Check syntax | `bash -n script.sh` |
| Debug | `bash -x script.sh` |
| Lint | `shellcheck script.sh` |

### Essential Flags

| Flag | Meaning |
|------|---------|
| `set -e` | Exit on error |
| `set -u` | Exit on undefined variable |
| `set -o pipefail` | Exit on pipe failure |
| `set -x` | Debug mode (print commands) |

---

**Auto-Activation Priority:** High  
**Related Skills:** rule-management, git-workflow  
**Related Agents:** N/A

