#!/bin/bash

# Rule Sync Shell Integration
# diet103 compliant: Minimal, hook-based

# Path to CLI
RULE_SYNC_CLI="$HOME/Orchestrator_Project/lib/rule-sync/cli.js"

# Check if project has rules that need syncing
check_rules_on_cd() {
  # Only check if we're in a registered project
  if [ -f ".taskmaster/config.json" ] || [ -f ".claude/rules/.rule-manifest.json" ]; then
    # Silent check
    if command -v node >/dev/null 2>&1; then
      local status=$(node "$RULE_SYNC_CLI" status --quiet 2>/dev/null)
      
      if [ "$status" = "outdated" ] || [ "$status" = "missing" ] || [ "$status" = "modified" ]; then
        echo "⚠️  Rules outdated. Run: orchestrator rule-sync pull"
      fi
    fi
  fi
}

# Hook into cd command (zsh/bash compatible)
if [ -n "$ZSH_VERSION" ]; then
  # Zsh
  autoload -U add-zsh-hook
  add-zsh-hook chpwd check_rules_on_cd
elif [ -n "$BASH_VERSION" ]; then
  # Bash
  PROMPT_COMMAND="${PROMPT_COMMAND:+$PROMPT_COMMAND; }check_rules_on_cd"
fi

# Run check on shell startup if in project directory
check_rules_on_cd

# Alias for convenience
alias rule-sync="node $RULE_SYNC_CLI"
alias rs="node $RULE_SYNC_CLI"  # Short alias

