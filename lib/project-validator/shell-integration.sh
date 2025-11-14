#!/bin/bash

#
# Project Identity Shell Integration
#
# Adds project name to terminal prompt and provides helper functions
# for quick project validation and context checking.
#
# Compatible with: bash, zsh
#

# ============================================================================
# CONFIGURATION
# ============================================================================

# Colors
TM_COLOR_GREEN="\[\033[32m\]"
TM_COLOR_YELLOW="\[\033[33m\]"
TM_COLOR_RED="\[\033[31m\]"
TM_COLOR_CYAN="\[\033[36m\]"
TM_COLOR_RESET="\[\033[0m\]"

# Zsh colors (different syntax)
if [ -n "$ZSH_VERSION" ]; then
  TM_COLOR_GREEN="%F{green}"
  TM_COLOR_YELLOW="%F{yellow}"
  TM_COLOR_RED="%F{red}"
  TM_COLOR_CYAN="%F{cyan}"
  TM_COLOR_RESET="%f"
fi

# ============================================================================
# CORE FUNCTIONS
# ============================================================================

# Get project name from config.json
_tm_get_project_name() {
  local config_file=".taskmaster/config.json"
  
  if [ ! -f "$config_file" ]; then
    return 1
  fi
  
  # Try jq first (fast and reliable)
  if command -v jq &> /dev/null; then
    jq -r '.global.projectName // empty' "$config_file" 2>/dev/null
    return $?
  fi
  
  # Fallback: grep + sed (slower but no dependencies)
  grep -o '"projectName"[[:space:]]*:[[:space:]]*"[^"]*"' "$config_file" 2>/dev/null | \
    sed 's/.*"\([^"]*\)".*/\1/'
}

# Get short project name (truncate if too long)
_tm_get_project_name_short() {
  local full_name
  full_name=$(_tm_get_project_name)
  
  if [ -z "$full_name" ]; then
    return 1
  fi
  
  # Truncate if longer than 20 chars
  if [ ${#full_name} -gt 20 ]; then
    echo "${full_name:0:17}..."
  else
    echo "$full_name"
  fi
}

# Check project identity consistency
_tm_check_project_status() {
  local config_file=".taskmaster/config.json"
  
  if [ ! -f "$config_file" ]; then
    echo "none"  # No Taskmaster project
    return
  fi
  
  local project_name
  project_name=$(_tm_get_project_name)
  
  if [ -z "$project_name" ]; then
    echo "error"  # Config exists but no project name
    return
  fi
  
  local dir_name
  dir_name=$(basename "$PWD")
  
  # Normalize for comparison (lowercase, remove special chars)
  local norm_project=$(echo "$project_name" | tr '[:upper:]' '[:lower:]' | tr -cd '[:alnum:]')
  local norm_dir=$(echo "$dir_name" | tr '[:upper:]' '[:lower:]' | tr -cd '[:alnum:]')
  
  # Check if they match (fuzzy)
  if [[ "$norm_project" == "$norm_dir" ]] || \
     [[ "$norm_project" == *"$norm_dir"* ]] || \
     [[ "$norm_dir" == *"$norm_project"* ]]; then
    echo "match"
  else
    echo "mismatch"
  fi
}

# Build project prompt segment
_tm_build_prompt() {
  local status
  status=$(_tm_check_project_status)
  
  case "$status" in
    none)
      # No Taskmaster project - no prompt
      echo ""
      ;;
    match)
      # Project name matches directory - green
      local project
      project=$(_tm_get_project_name_short)
      echo "${TM_COLOR_GREEN}[$project]${TM_COLOR_RESET} "
      ;;
    mismatch)
      # Mismatch - yellow warning
      local project
      project=$(_tm_get_project_name_short)
      echo "${TM_COLOR_YELLOW}[$project⚠]${TM_COLOR_RESET} "
      ;;
    error)
      # Error - red
      echo "${TM_COLOR_RED}[TM-ERR]${TM_COLOR_RESET} "
      ;;
  esac
}

# ============================================================================
# USER COMMANDS
# ============================================================================

# Show current project information
tmproject() {
  local config_file=".taskmaster/config.json"
  
  if [ ! -f "$config_file" ]; then
    echo "❌ Not a Taskmaster project (no .taskmaster/config.json)"
    return 1
  fi
  
  echo ""
  echo "📍 Current Project Information"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  local project_name
  project_name=$(_tm_get_project_name)
  
  if [ -n "$project_name" ]; then
    echo "  Project Name:    $project_name"
  else
    echo "  Project Name:    (not set)"
  fi
  
  echo "  Directory:       $(basename "$PWD")"
  echo "  Full Path:       $PWD"
  
  if command -v git &> /dev/null && git rev-parse --git-dir &> /dev/null 2>&1; then
    local git_remote
    git_remote=$(git remote get-url origin 2>/dev/null | sed 's/.*\///' | sed 's/\.git$//')
    if [ -n "$git_remote" ]; then
      echo "  Git Remote:      $git_remote"
    fi
  fi
  
  echo ""
  
  local status
  status=$(_tm_check_project_status)
  
  case "$status" in
    match)
      echo "  ✅ Status:        Consistent"
      ;;
    mismatch)
      echo "  ⚠️  Status:        Mismatch (config vs directory)"
      echo ""
      echo "  💡 Recommendation: Run 'tmfix' to correct config.json"
      ;;
    error)
      echo "  ❌ Status:        Error (projectName not set)"
      echo ""
      echo "  💡 Recommendation: Run 'tmfix' to set project name"
      ;;
  esac
  
  echo ""
}

# Validate project identity
tmvalidate() {
  local validator_script="./lib/project-validator/cli.js"
  
  if [ ! -f "$validator_script" ]; then
    echo "❌ Validator not found at $validator_script"
    echo "💡 Make sure you're in the project root"
    return 1
  fi
  
  node "$validator_script" validate "$@"
}

# Validate PRD
tmvalidate-prd() {
  local prd_file="$1"
  
  if [ -z "$prd_file" ]; then
    echo "Usage: tmvalidate-prd <prd-file>"
    return 1
  fi
  
  local validator_script="./lib/project-validator/cli.js"
  
  if [ ! -f "$validator_script" ]; then
    echo "❌ Validator not found at $validator_script"
    return 1
  fi
  
  node "$validator_script" prd "$prd_file" --interactive
}

# Fix project identity
tmfix() {
  local validator_script="./lib/project-validator/cli.js"
  
  if [ ! -f "$validator_script" ]; then
    echo "❌ Validator not found at $validator_script"
    echo "💡 Make sure you're in the project root"
    return 1
  fi
  
  node "$validator_script" fix "$@"
}

# ============================================================================
# PROMPT INTEGRATION
# ============================================================================

# Bash prompt integration
if [ -n "$BASH_VERSION" ]; then
  _tm_prompt_command() {
    PS1="$(_tm_build_prompt)$_TM_ORIGINAL_PS1"
  }
  
  # Save original PS1 if not already saved
  if [ -z "$_TM_ORIGINAL_PS1" ]; then
    export _TM_ORIGINAL_PS1="$PS1"
  fi
  
  # Add to PROMPT_COMMAND
  if [[ ! "$PROMPT_COMMAND" =~ "_tm_prompt_command" ]]; then
    PROMPT_COMMAND="_tm_prompt_command${PROMPT_COMMAND:+;$PROMPT_COMMAND}"
  fi
fi

# Zsh prompt integration
if [ -n "$ZSH_VERSION" ]; then
  # Enable prompt substitution
  setopt PROMPT_SUBST
  
  # Save original PROMPT if not already saved
  if [ -z "$_TM_ORIGINAL_PROMPT" ]; then
    export _TM_ORIGINAL_PROMPT="$PROMPT"
  fi
  
  # Update PROMPT
  PROMPT='$(_tm_build_prompt)'"$_TM_ORIGINAL_PROMPT"
fi

# ============================================================================
# WELCOME MESSAGE
# ============================================================================

_tm_show_welcome() {
  local status
  status=$(_tm_check_project_status)
  
  if [ "$status" != "none" ]; then
    local project
    project=$(_tm_get_project_name)
    
    echo ""
    echo "🎯 Taskmaster Project: $project"
    
    case "$status" in
      match)
        echo "   ✅ Project identity: Consistent"
        ;;
      mismatch)
        echo "   ⚠️  Project identity: Mismatch detected"
        echo "   💡 Run 'tmfix' to correct"
        ;;
      error)
        echo "   ❌ Project identity: Error"
        echo "   💡 Run 'tmfix' to fix"
        ;;
    esac
    
    echo ""
    echo "   Commands: tmproject | tmvalidate | tmvalidate-prd | tmfix"
    echo ""
  fi
}

# Show welcome message on load (only if in Taskmaster project)
if [ -f ".taskmaster/config.json" ]; then
  _tm_show_welcome
fi

# ============================================================================
# AUTO-VALIDATION ON CD (Optional)
# ============================================================================

# Uncomment to enable automatic validation warnings when entering mismatched projects
# 
# _tm_check_on_cd() {
#   if [ -f ".taskmaster/config.json" ]; then
#     local status=$(_tm_check_project_status)
#     if [ "$status" = "mismatch" ]; then
#       echo ""
#       echo "⚠️  Project identity mismatch detected!"
#       echo "    Run 'tmproject' for details or 'tmfix' to correct"
#       echo ""
#     fi
#   fi
# }
# 
# # Hook into cd command
# if [ -n "$BASH_VERSION" ]; then
#   cd() {
#     builtin cd "$@" && _tm_check_on_cd
#   }
# elif [ -n "$ZSH_VERSION" ]; then
#   chpwd_functions+=(tm_check_on_cd)
# fi

# ============================================================================
# HELP
# ============================================================================

tmhelp() {
  cat << 'EOF'

📚 Taskmaster Shell Integration Help

COMMANDS:
  tmproject           Show current project information
  tmvalidate          Validate project identity
  tmvalidate-prd FILE Validate PRD against project
  tmfix               Auto-fix project identity issues
  tmhelp              Show this help message

PROMPT:
  [ProjectName]       Green = consistent
  [ProjectName⚠]      Yellow = mismatch detected
  [TM-ERR]           Red = error in configuration

USAGE EXAMPLES:
  tmproject                              # Show project info
  tmvalidate                            # Check project consistency
  tmvalidate-prd sprint3_prd.txt       # Validate PRD
  tmfix                                 # Fix config.json

CONFIGURATION:
  Edit ~/.bashrc or ~/.zshrc to customize colors and behavior
  See: lib/project-validator/shell-integration.sh

MORE INFO:
  README: lib/project-validator/README.md
  Docs:   PROJECT_IDENTITY_ISSUE.md

EOF
}

# ============================================================================
# END
# ============================================================================

echo "✅ Taskmaster shell integration loaded (type 'tmhelp' for commands)"

