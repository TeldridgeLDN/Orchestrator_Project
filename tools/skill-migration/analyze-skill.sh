#!/bin/bash
###############################################################################
# analyze-skill.sh
#
# Analyzes a skill file and generates a content distribution report
#
# Usage: ./analyze-skill.sh <skill-file>
###############################################################################

set -euo pipefail

SKILL_FILE="${1:-}"

if [ -z "$SKILL_FILE" ] || [ ! -f "$SKILL_FILE" ]; then
    echo "Usage: $0 <skill-file>"
    echo "Example: $0 ~/.claude/skills/my-skill/skill.md"
    exit 1
fi

SKILL_NAME=$(basename "$(dirname "$SKILL_FILE")")
TOTAL_LINES=$(wc -l < "$SKILL_FILE")

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║             Skill Analysis Report                                 ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "Skill: $SKILL_NAME"
echo "File: $SKILL_FILE"
echo "Total Lines: $TOTAL_LINES"
echo ""

# Check against limits
if [ "$TOTAL_LINES" -lt 300 ]; then
    echo "Status: ✅ Under target (< 300 lines)"
    echo "Recommendation: No restructuring needed"
elif [ "$TOTAL_LINES" -lt 500 ]; then
    echo "Status: ⚠️  Approaching limit (300-500 lines)"
    echo "Recommendation: Consider restructuring if content grows"
else
    echo "Status: ❌ Exceeds limit (≥ 500 lines)"
    echo "Recommendation: Restructuring strongly recommended"
fi

echo ""
echo "──────────────────────────────────────────────────────────────────"
echo "Section Breakdown"
echo "──────────────────────────────────────────────────────────────────"

# Extract sections with line numbers
grep -n "^##" "$SKILL_FILE" | while IFS=: read -r line_num section; do
    section_name=$(echo "$section" | sed 's/^## *//')
    echo "Line $line_num: $section_name"
done

echo ""
echo "──────────────────────────────────────────────────────────────────"
echo "Content Statistics"
echo "──────────────────────────────────────────────────────────────────"

# Count various elements
CODE_BLOCKS=$(grep -c '```' "$SKILL_FILE" || echo "0")
CODE_BLOCKS=$((CODE_BLOCKS / 2))  # Divide by 2 (opening + closing)
LINKS=$(grep -o '\[.*\](.*\.md)' "$SKILL_FILE" | wc -l | tr -d ' ')
HEADERS=$(grep -c '^##' "$SKILL_FILE" || echo "0")
WORDS=$(wc -w < "$SKILL_FILE")

echo "Markdown Headers (##): $HEADERS"
echo "Code Blocks: $CODE_BLOCKS"
echo "Internal Links: $LINKS"
echo "Word Count: $WORDS"

echo ""
echo "──────────────────────────────────────────────────────────────────"
echo "Migration Analysis"
echo "──────────────────────────────────────────────────────────────────"

if [ "$TOTAL_LINES" -ge 300 ]; then
    echo ""
    echo "Suggested Structure:"
    echo "  SKILL.md:             ~250-300 lines (overview + navigation)"
    echo "  quick-ref.md:         <100 lines (commands)"
    
    if [ "$TOTAL_LINES" -ge 500 ]; then
        REMAINING=$((TOTAL_LINES - 350))
        NUM_RESOURCES=$((REMAINING / 400 + 1))
        echo "  Additional resources: $NUM_RESOURCES files (~400 lines each)"
        echo ""
        echo "Recommended resources:"
        echo "  - resources/quick-ref.md"
        echo "  - resources/setup-guide.md"
        if [ "$TOTAL_LINES" -ge 700 ]; then
            echo "  - resources/api-reference.md"
        fi
        if [ "$TOTAL_LINES" -ge 900 ]; then
            echo "  - resources/troubleshooting.md"
        fi
    else
        echo "  setup-guide.md:       ~250 lines"
    fi
    
    echo ""
    echo "Estimated Migration Effort: "
    if [ "$TOTAL_LINES" -lt 500 ]; then
        echo "  Low (2-3 hours)"
    elif [ "$TOTAL_LINES" -lt 800 ]; then
        echo "  Medium (3-4 hours)"
    else
        echo "  High (4-6 hours)"
    fi
fi

echo ""
echo "──────────────────────────────────────────────────────────────────"
echo "Next Steps"
echo "──────────────────────────────────────────────────────────────────"

if [ "$TOTAL_LINES" -ge 300 ]; then
    echo "1. Review SKILL_MIGRATION_GUIDE.md"
    echo "2. Create migration plan document"
    echo "3. Back up current file: cp $SKILL_FILE ${SKILL_FILE}.backup"
    echo "4. Create resources directory: mkdir -p $(dirname "$SKILL_FILE")/resources"
    echo "5. Begin content migration using templates"
else
    echo "No migration needed. Optional enhancements:"
    echo "1. Add metadata.json for consistency"
    echo "2. Ensure auto-activation triggers documented"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "Analysis complete!"
echo "════════════════════════════════════════════════════════════════"

