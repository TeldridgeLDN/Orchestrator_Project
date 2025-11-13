#!/bin/bash
###############################################################################
# validate-structure.sh
#
# Validates a migrated skill structure against the 500-line rule specification
#
# Usage: ./validate-structure.sh <skill-directory>
###############################################################################

set -euo pipefail

SKILL_DIR="${1:-}"

if [ -z "$SKILL_DIR" ] || [ ! -d "$SKILL_DIR" ]; then
    echo "Usage: $0 <skill-directory>"
    echo "Example: $0 ~/.claude/skills/my-skill"
    exit 1
fi

SKILL_NAME=$(basename "$SKILL_DIR")
ERRORS=0
WARNINGS=0

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║             Skill Structure Validation                            ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "Skill: $SKILL_NAME"
echo "Directory: $SKILL_DIR"
echo ""

# Check for SKILL.md
echo "──────────────────────────────────────────────────────────────────"
echo "Required Files Check"
echo "──────────────────────────────────────────────────────────────────"

if [ -f "$SKILL_DIR/SKILL.md" ]; then
    echo "✅ SKILL.md exists"
elif [ -f "$SKILL_DIR/skill.md" ]; then
    echo "⚠️  skill.md exists (should be SKILL.md)"
    WARNINGS=$((WARNINGS + 1))
else
    echo "❌ SKILL.md not found"
    ERRORS=$((ERRORS + 1))
fi

# Check for resources directory
if [ -d "$SKILL_DIR/resources" ]; then
    echo "✅ resources/ directory exists"
else
    echo "⚠️  resources/ directory not found (optional)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for metadata.json
if [ -f "$SKILL_DIR/metadata.json" ]; then
    echo "✅ metadata.json exists"
    # Validate JSON syntax
    if command -v jq &> /dev/null; then
        if jq empty "$SKILL_DIR/metadata.json" 2>/dev/null; then
            echo "  └─ Valid JSON syntax"
        else
            echo "  └─ ❌ Invalid JSON syntax"
            ERRORS=$((ERRORS + 1))
        fi
    fi
else
    echo "⚠️  metadata.json not found (recommended)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "──────────────────────────────────────────────────────────────────"
echo "Line Count Validation"
echo "──────────────────────────────────────────────────────────────────"

# Check SKILL.md line count
MAIN_FILE=""
if [ -f "$SKILL_DIR/SKILL.md" ]; then
    MAIN_FILE="$SKILL_DIR/SKILL.md"
elif [ -f "$SKILL_DIR/skill.md" ]; then
    MAIN_FILE="$SKILL_DIR/skill.md"
fi

if [ -n "$MAIN_FILE" ]; then
    LINES=$(wc -l < "$MAIN_FILE")
    if [ "$LINES" -le 300 ]; then
        echo "✅ $(basename "$MAIN_FILE"): $LINES lines (under target)"
    elif [ "$LINES" -le 500 ]; then
        echo "⚠️  $(basename "$MAIN_FILE"): $LINES lines (within limit, consider trimming)"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "❌ $(basename "$MAIN_FILE"): $LINES lines (exceeds 500-line limit)"
        ERRORS=$((ERRORS + 1))
    fi
fi

# Check resources directory files
if [ -d "$SKILL_DIR/resources" ]; then
    for file in "$SKILL_DIR/resources"/*.md; do
        if [ -f "$file" ]; then
            LINES=$(wc -l < "$file")
            FILENAME=$(basename "$file")
            
            # Special check for quick-ref
            if [[ "$FILENAME" == "quick-ref.md" ]]; then
                if [ "$LINES" -le 100 ]; then
                    echo "✅ resources/$FILENAME: $LINES lines"
                else
                    echo "❌ resources/$FILENAME: $LINES lines (exceeds 100-line limit)"
                    ERRORS=$((ERRORS + 1))
                fi
            else
                if [ "$LINES" -le 500 ]; then
                    echo "✅ resources/$FILENAME: $LINES lines"
                else
                    echo "❌ resources/$FILENAME: $LINES lines (exceeds 500-line limit)"
                    ERRORS=$((ERRORS + 1))
                fi
            fi
        fi
    done
fi

echo ""
echo "──────────────────────────────────────────────────────────────────"
echo "Content Validation"
echo "──────────────────────────────────────────────────────────────────"

# Check for required sections in SKILL.md
if [ -n "$MAIN_FILE" ]; then
    if grep -q "^## Overview" "$MAIN_FILE" || grep -q "^## Purpose" "$MAIN_FILE"; then
        echo "✅ Overview/Purpose section present"
    else
        echo "❌ Overview/Purpose section missing"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "^## Quick Start" "$MAIN_FILE" || grep -q "^## Usage" "$MAIN_FILE"; then
        echo "✅ Quick Start/Usage section present"
    else
        echo "⚠️  Quick Start/Usage section missing (recommended)"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if [ -d "$SKILL_DIR/resources" ]; then
        if grep -q "^## Available Resources" "$MAIN_FILE" || grep -q "^## Resources" "$MAIN_FILE"; then
            echo "✅ Available Resources section present"
        else
            echo "❌ Available Resources section missing (required with resources/)"
            ERRORS=$((ERRORS + 1))
        fi
    fi
fi

echo ""
echo "──────────────────────────────────────────────────────────────────"
echo "Link Validation"
echo "──────────────────────────────────────────────────────────────────"

# Check internal links
BROKEN_LINKS=0
for file in "$SKILL_DIR"/*.md "$SKILL_DIR"/resources/*.md; do
    [ -e "$file" ] || continue  # Skip if glob didn't match anything
    if [ -f "$file" ]; then
        while IFS= read -r link; do
            # Extract link target
            target=$(echo "$link" | sed 's/.*](\([^)]*\))/\1/')
            
            # Skip external URLs
            if [[ "$target" == http* ]]; then
                continue
            fi
            
            # Check if file exists relative to current file location
            link_dir=$(dirname "$file")
            if [ ! -f "$link_dir/$target" ]; then
                echo "❌ Broken link in $(basename "$file"): $target"
                BROKEN_LINKS=$((BROKEN_LINKS + 1))
            fi
        done < <(grep -o '\[.*\]([^)]*.md[^)]*)' "$file" 2>/dev/null || true)
    fi
done

if [ "$BROKEN_LINKS" -eq 0 ]; then
    echo "✅ No broken internal links found"
else
    echo "❌ Found $BROKEN_LINKS broken link(s)"
    ERRORS=$((ERRORS + BROKEN_LINKS))
fi

echo ""
echo "──────────────────────────────────────────────────────────────────"
echo "Validation Summary"
echo "──────────────────────────────────────────────────────────────────"

echo ""
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
    echo "═══════════════════════════════════════════════════════════════"
    echo "✅ VALIDATION PASSED - Structure meets all requirements!"
    echo "═══════════════════════════════════════════════════════════════"
    exit 0
elif [ "$ERRORS" -eq 0 ]; then
    echo "═══════════════════════════════════════════════════════════════"
    echo "⚠️  VALIDATION PASSED WITH WARNINGS"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "Consider addressing warnings for best practices compliance."
    exit 0
else
    echo "═══════════════════════════════════════════════════════════════"
    echo "❌ VALIDATION FAILED - Please fix errors before proceeding"
    echo "═══════════════════════════════════════════════════════════════"
    exit 1
fi

