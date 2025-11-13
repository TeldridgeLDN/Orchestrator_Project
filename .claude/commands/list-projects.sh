#!/bin/bash

##
# List Projects Slash Command
# 
# Wrapper for 'claude project list' command
# Provides convenient IDE slash command access
#
# Usage: /list-projects [--active-only]
##

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse options
ACTIVE_ONLY=false

if [ "$1" = "--active-only" ]; then
  ACTIVE_ONLY=true
fi

# Check if claude CLI is available
if ! command -v claude &> /dev/null; then
  echo -e "${RED}❌ Error: 'claude' command not found${NC}"
  echo ""
  echo "The claude CLI must be installed and in your PATH."
  echo ""
  echo "Installation:"
  echo "  npm install -g orchestrator-cli"
  echo ""
  echo "Or add to PATH:"
  echo "  export PATH=\"\$PATH:/path/to/claude/bin\""
  exit 1
fi

# Execute based on mode
if [ "$ACTIVE_ONLY" = true ]; then
  # Show only active project
  echo "📋 Active Project"
  echo ""
  
  if claude project current 2>&1; then
    echo ""
    echo "To see all projects:"
    echo "  /list-projects"
    exit 0
  else
    echo -e "${YELLOW}⚠ No active project set${NC}"
    echo ""
    echo "To switch to a project:"
    echo "  /switch-project <name>"
    exit 1
  fi
else
  # Show all projects
  echo "📋 Registered Projects"
  echo ""
  
  if claude project list 2>&1; then
    echo ""
    echo "Commands:"
    echo "  /switch-project <name>  - Switch to a project"
    echo "  /list-projects --active-only - Show only active project"
    exit 0
  else
    EXIT_CODE=$?
    echo ""
    echo -e "${YELLOW}⚠ No projects registered yet${NC}"
    echo ""
    echo "Get started by creating or registering a project:"
    echo ""
    echo "Create new:"
    echo "  claude project create my-new-project"
    echo ""
    echo "Register existing:"
    echo "  claude project register /path/to/existing/project"
    exit $EXIT_CODE
  fi
fi

