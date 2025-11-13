#!/bin/bash

# PostToolUse Hook for Orchestrator Documentation Project
# Purpose: Validate changes after file edits/writes, check links, and ensure quality
# Runs after Claude uses Edit, Write, or other file modification tools

set -e

PROJECT_ROOT="/Users/tomeldridge/Orchestrator_Project"
DOCS_DIR="$PROJECT_ROOT/Docs"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track if we found any issues
ISSUES_FOUND=0

# Function to validate a markdown file after modification
validate_markdown_file() {
    local file="$1"

    if [[ ! -f "$file" ]]; then
        return 0
    fi

    # Check for unclosed code blocks
    local code_block_count=$(grep -c '```' "$file" 2>/dev/null || echo "0")
    if [ $((code_block_count % 2)) -ne 0 ]; then
        echo -e "${RED}❌ Error: Unclosed code block in $file${NC}" >&2
        ISSUES_FOUND=1
    fi

    # Check for broken internal links using grep
    grep -o '\](.*\.md[^)]*)' "$file" 2>/dev/null | sed 's/](\(.*\))/\1/' | while read -r link; do
        if [ -n "$link" ]; then
            local file_path="${link%%#*}"

            # Try different base paths
            if [ ! -f "$DOCS_DIR/$file_path" ] && [ ! -f "$PROJECT_ROOT/$file_path" ] && [ ! -f "$(dirname "$file")/$file_path" ]; then
                echo -e "${YELLOW}⚠️  Warning: Potentially broken link in $(basename "$file"): $link${NC}" >&2
                ISSUES_FOUND=1
            fi
        fi
    done
}

# Function to check file syntax after edits
check_file_syntax() {
    local file="$1"

    case "$file" in
        *.md)
            validate_markdown_file "$file"
            ;;
        *.sh)
            # Check if shell script has valid syntax
            if ! bash -n "$file" 2>/dev/null; then
                echo -e "${RED}❌ Error: Syntax error in shell script: $file${NC}" >&2
                ISSUES_FOUND=1
            fi

            # Check if executable
            if [[ ! -x "$file" ]] && [[ "$file" == */tests/*.sh ]]; then
                echo -e "${YELLOW}⚠️  Warning: Test script not executable: $file${NC}" >&2
                echo -e "${BLUE}   Run: chmod +x $file${NC}" >&2
                ISSUES_FOUND=1
            fi
            ;;
        *.json)
            # Check if JSON is valid
            if ! jq empty "$file" 2>/dev/null; then
                echo -e "${RED}❌ Error: Invalid JSON in: $file${NC}" >&2
                ISSUES_FOUND=1
            fi
            ;;
    esac
}

# Main validation logic
echo -e "${BLUE}🔍 Post-Edit Validation${NC}" >&2
echo "────────────────────────────────" >&2

# Get the most recently modified files (last 5 seconds)
recent_files=$(find "$PROJECT_ROOT" -type f \( -name "*.md" -o -name "*.sh" -o -name "*.json" \) -mtime -5s 2>/dev/null || true)

if [[ -n "$recent_files" ]]; then
    echo -e "${GREEN}✓ Checking recently modified files...${NC}" >&2

    while IFS= read -r file; do
        if [[ -n "$file" ]]; then
            echo -e "${BLUE}  Validating: $(basename "$file")${NC}" >&2
            check_file_syntax "$file"
        fi
    done <<< "$recent_files"
else
    echo -e "${GREEN}✓ No recent modifications detected${NC}" >&2
fi

# Summary
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ All post-edit checks passed${NC}" >&2
else
    echo -e "${YELLOW}⚠️  Found some issues - please review warnings above${NC}" >&2
fi

echo "" >&2

# Always exit 0 (non-blocking) - we warn but don't block
exit 0
