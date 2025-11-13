#!/bin/bash

##
# Switch Project Slash Command
# 
# Wrapper for 'claude project switch' command
# Provides convenient IDE slash command access
#
# Usage: /switch-project <project-name>
##

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
PROJECT_NAME="$1"

# Validate input
if [ -z "$PROJECT_NAME" ]; then
  echo -e "${RED}❌ Error: Project name is required${NC}"
  echo ""
  echo "Usage: /switch-project <project-name>"
  echo ""
  echo "Examples:"
  echo "  /switch-project portfolio-site"
  echo "  /switch-project api-backend"
  echo ""
  echo "To see available projects:"
  echo "  /list-projects"
  exit 1
fi

# Execute the switch command
echo "Switching to project: $PROJECT_NAME..."
echo ""

if command -v claude &> /dev/null; then
  # Use the claude CLI if available
  if claude project switch "$PROJECT_NAME" 2>&1; then
    echo ""
    echo -e "${GREEN}✅ Successfully switched to project: $PROJECT_NAME${NC}"
    echo ""
    echo "To see project details:"
    echo "  claude project show $PROJECT_NAME"
    exit 0
  else
    EXIT_CODE=$?
    echo ""
    echo -e "${RED}❌ Failed to switch project${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  • Check if project exists: claude project list"
    echo "  • Register project: claude project register <path>"
    echo "  • Validate project: claude project validate $PROJECT_NAME"
    exit $EXIT_CODE
  fi
else
  # Fallback if CLI not in PATH
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

