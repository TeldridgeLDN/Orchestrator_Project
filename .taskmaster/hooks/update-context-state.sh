#!/bin/bash
# Update Context State
# This script should be called with the current token usage
# Usage: ./update-context-state.sh <tokens_used> <max_tokens>

TOKENS_USED=${1:-0}
MAX_TOKENS=${2:-1000000}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_FILE="$SCRIPT_DIR/../../.context-state.json"

# Calculate percentage using awk instead of bc
PERCENTAGE=$(awk "BEGIN {printf \"%.4f\", $TOKENS_USED / $MAX_TOKENS}")

cat > "$STATE_FILE" << EOF
{
  "tokensUsed": $TOKENS_USED,
  "maxTokens": $MAX_TOKENS,
  "lastChecked": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "percentage": $PERCENTAGE
}
EOF

echo "✓ Context state updated: $TOKENS_USED/$MAX_TOKENS tokens"

# Check if we should warn
PERCENTAGE_DISPLAY=$(awk "BEGIN {printf \"%.1f\", ($TOKENS_USED / $MAX_TOKENS) * 100}")
PERCENTAGE_INT=$(awk "BEGIN {printf \"%d\", ($TOKENS_USED / $MAX_TOKENS) * 100}")

if [ "$PERCENTAGE_INT" -ge 95 ]; then
  echo "🚨 CRITICAL: Context at ${PERCENTAGE_DISPLAY}% - transition recommended!"
  node "$SCRIPT_DIR/context-monitor.js"
elif [ "$PERCENTAGE_INT" -ge 85 ]; then
  echo "⚠️  WARNING: Context at ${PERCENTAGE_DISPLAY}% - prepare for transition"
fi

