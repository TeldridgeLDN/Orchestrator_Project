#!/bin/bash

# UserPromptSubmit Hook for Orchestrator Documentation Project
# Purpose: Validate markdown files and check for common issues before processing
# Runs before Claude processes each user prompt

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

# Function to check if markdown files have valid syntax
check_markdown_syntax() {
    local file="$1"

    # Check for common markdown issues
    # 1. Unclosed code blocks
    if grep -q '```' "$file"; then
        local code_block_count=$(grep -c '```' "$file")
        if [ $((code_block_count % 2)) -ne 0 ]; then
            echo -e "${YELLOW}⚠️  Warning: Unclosed code block in $file${NC}" >&2
            ISSUES_FOUND=1
        fi
    fi

    # 2. Broken internal links (check for [text](file) where file doesn't exist)
    # Extract links and check them
    grep -o '\](.*\.md[^)]*)' "$file" 2>/dev/null | sed 's/](\(.*\))/\1/' | while read -r link; do
        if [ -n "$link" ]; then
            local file_path="${link%%#*}"
            local full_path="$DOCS_DIR/$file_path"

            if [ ! -f "$full_path" ] && [ ! -f "$PROJECT_ROOT/$file_path" ]; then
                echo -e "${YELLOW}⚠️  Warning: Potentially broken link in $(basename "$file"): $link${NC}" >&2
                ISSUES_FOUND=1
            fi
        fi
    done
}

# Function to check if test scripts are executable
check_test_executability() {
    local file="$1"

    if [[ "$file" == *.sh ]] && [[ ! -x "$file" ]]; then
        echo -e "${YELLOW}⚠️  Warning: Test script not executable: $file${NC}" >&2
        echo -e "${BLUE}   Fix with: chmod +x $file${NC}" >&2
        ISSUES_FOUND=1
    fi
}

# Main validation logic
echo -e "${BLUE}🔍 Documentation Validation Hook${NC}" >&2
echo "────────────────────────────────" >&2

# Check if we're working with markdown files
if ls $DOCS_DIR/*.md &> /dev/null; then
    echo -e "${GREEN}✓ Found markdown files, validating...${NC}" >&2

    for md_file in $DOCS_DIR/*.md; do
        if [ -f "$md_file" ]; then
            check_markdown_syntax "$md_file"
        fi
    done
fi

# Check test scripts
if [ -d "$PROJECT_ROOT/tests" ]; then
    echo -e "${GREEN}✓ Checking test scripts...${NC}" >&2

    for test_file in $PROJECT_ROOT/tests/*.sh; do
        if [ -f "$test_file" ]; then
            check_test_executability "$test_file"
        fi
    done
fi

# Summary
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ All validation checks passed${NC}" >&2
else
    echo -e "${YELLOW}⚠️  Found some issues - please review warnings above${NC}" >&2
fi

echo "" >&2

# Always exit 0 (non-blocking) - we only warn, don't block
exit 0
