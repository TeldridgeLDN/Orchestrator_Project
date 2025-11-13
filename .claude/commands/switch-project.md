# Switch Project

Quickly switch between registered Claude projects using a slash command shortcut.

## Usage

```
/switch-project <project-name>
```

## Examples

```
/switch-project portfolio-site
/switch-project api-backend
/switch-project my-shopify-store
```

## What This Command Does

1. Validates that the specified project exists in the registry
2. Checks project infrastructure health
3. Switches the active project context
4. Updates the global configuration
5. Displays confirmation with project details

## Steps

This command wraps the existing `claude project switch` CLI functionality for convenience within the Claude Code IDE:

```bash
# 1. Parse and validate the project name argument
PROJECT_NAME="$1"

if [ -z "$PROJECT_NAME" ]; then
  echo "❌ Error: Project name is required"
  echo "Usage: /switch-project <project-name>"
  exit 1
fi

# 2. Execute the switch command
claude project switch "$PROJECT_NAME"

# 3. The CLI handles:
#    - Project existence validation
#    - Infrastructure health check
#    - Context switching
#    - Configuration updates
#    - Success/error reporting

# 4. Display results
if [ $? -eq 0 ]; then
  echo "✅ Successfully switched to project: $PROJECT_NAME"
  echo ""
  echo "To see project details:"
  echo "  claude project show $PROJECT_NAME"
else
  echo "❌ Failed to switch project"
  echo ""
  echo "Troubleshooting:"
  echo "  • Check if project exists: claude project list"
  echo "  • Register project: claude project register <path>"
  echo "  • Validate project: claude project validate $PROJECT_NAME"
fi
```

## Error Handling

### Project Not Found
```
❌ Error: Project 'my-project' not found in registry

Available projects:
  • portfolio-site
  • api-backend
  • shopify-store

To register a new project:
  claude project register /path/to/project
```

### Invalid Project Name
```
❌ Error: Project name cannot be empty

Usage: /switch-project <project-name>

Examples:
  /switch-project portfolio-site
  /switch-project api-backend
```

### Project Infrastructure Issues
```
⚠️ Warning: Project 'my-project' has infrastructure issues (score: 65%)

Missing components:
  • .claude/metadata.json
  • .claude/hooks/

Switched successfully, but you may want to run:
  claude project validate my-project --fix
```

## See Also

- `/list-projects` - List all registered projects
- `claude project list` - Full CLI project listing
- `claude project show <name>` - View project details
- `claude project validate <name>` - Check project health

## Notes

- This is a convenience wrapper for the existing CLI functionality
- All validation and switching logic is handled by the underlying CLI command
- Project context is automatically updated in `~/.claude/config.json`
- The command respects project dependencies and health checks

