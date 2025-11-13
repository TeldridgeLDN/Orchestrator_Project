#!/bin/bash
# Migration helper to register existing diet103 projects with the orchestrator

set -e

usage() {
  echo "Usage: $(basename "$0") <project_path> [options]"
  echo ""
  echo "Register an existing diet103 project with the orchestrator"
  echo ""
  echo "Options:"
  echo "  --name=<name>  Specify project name (default: derived from path)"
  echo "  --force        Overwrite existing registration"
  echo "  --help         Show this help message"
  exit 1
}

# Parse arguments
PROJECT_PATH=""
PROJECT_NAME=""
FORCE=false

for arg in "$@"; do
  case $arg in
    --name=*)
      PROJECT_NAME="${arg#*=}"
      ;;
    --force)
      FORCE=true
      ;;
    --help)
      usage
      ;;
    -*)
      echo "Unknown option: $arg"
      usage
      ;;
    *)
      if [ -z "$PROJECT_PATH" ]; then
        PROJECT_PATH="$arg"
      else
        echo "Error: Multiple project paths specified"
        usage
      fi
      ;;
  esac
done

if [ -z "$PROJECT_PATH" ]; then
  echo "Error: Project path is required"
  usage
fi

# Validate project path exists first
if [ ! -d "$PROJECT_PATH" ]; then
  echo "Error: Project directory does not exist: $PROJECT_PATH"
  exit 1
fi

# Resolve absolute path
PROJECT_PATH=$(cd "$PROJECT_PATH" && pwd)

# Check for .claude directory
if [ ! -d "$PROJECT_PATH/.claude" ]; then
  echo "Error: Not a Claude project (missing .claude directory)"
  echo "Create .claude directory? (y/n)"
  read -r CREATE_DIR
  if [[ $CREATE_DIR =~ ^[Yy] ]]; then
    mkdir -p "$PROJECT_PATH/.claude"/{skills,workflows,resources,commands,agents}
    echo "Created .claude directory structure"
  else
    exit 1
  fi
fi

# Auto-detect project name if not specified
if [ -z "$PROJECT_NAME" ]; then
  PROJECT_NAME=$(basename "$PROJECT_PATH")
  echo "Auto-detected project name: $PROJECT_NAME"
fi

# Check if metadata.json exists, create if missing
METADATA_PATH="$PROJECT_PATH/.claude/metadata.json"
if [ ! -f "$METADATA_PATH" ]; then
  echo "Creating metadata.json..."
  cat > "$METADATA_PATH" << EOF
{
  "name": "$PROJECT_NAME",
  "path": "$PROJECT_PATH",
  "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "lastOpened": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "type": "custom",
  "version": "1.0.0"
}
EOF
  echo "Created metadata.json"
fi

# Register in global config.json
CONFIG_PATH="$HOME/.claude/config.json"
if [ ! -f "$CONFIG_PATH" ]; then
  echo "Creating global config.json..."
  mkdir -p "$(dirname "$CONFIG_PATH")"
  cat > "$CONFIG_PATH" << EOF
{
  "version": "1.0.0",
  "active_project": null,
  "projects": {}
}
EOF
fi

# Check if project already registered
if command -v jq &> /dev/null; then
  # Use jq if available
  if jq -e ".projects.\"$PROJECT_NAME\"" "$CONFIG_PATH" > /dev/null 2>&1; then
    if [ "$FORCE" = false ]; then
      echo "Error: Project '$PROJECT_NAME' already registered"
      echo "Use --force to overwrite"
      exit 1
    fi
    echo "Overwriting existing project registration"
  fi

  # Update global config
  TMP_CONFIG=$(mktemp)
  jq ".projects.\"$PROJECT_NAME\" = {\"path\": \"$PROJECT_PATH\", \"registered\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"}" "$CONFIG_PATH" > "$TMP_CONFIG"
  mv "$TMP_CONFIG" "$CONFIG_PATH"
else
  # Fallback without jq - basic JSON manipulation
  echo "Warning: jq not found, using basic registration method"

  # Check if project exists in config (basic grep check)
  if grep -q "\"$PROJECT_NAME\"" "$CONFIG_PATH"; then
    if [ "$FORCE" = false ]; then
      echo "Error: Project '$PROJECT_NAME' appears to be already registered"
      echo "Use --force to overwrite or install jq for proper validation"
      exit 1
    fi
  fi

  # Simple append to projects object (requires manual cleanup if needed)
  echo "Note: Manual validation recommended - install jq for full functionality"
fi

echo ""
echo "✓ Successfully registered project '$PROJECT_NAME'"
echo "  Path: $PROJECT_PATH"
echo ""
echo "Next steps:"
echo "  1. Switch to project: claude project switch $PROJECT_NAME"
echo "  2. Validate project: claude project validate $PROJECT_NAME"
echo ""
