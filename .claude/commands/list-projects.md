# List Projects

Display all registered Claude projects with status information.

## Usage

```
/list-projects
/list-projects --active-only
```

## Examples

```
/list-projects
```

Output:
```
📋 Registered Projects (4 total)

  → portfolio-site              ✓ 95%    /Users/tom/Projects/portfolio
    api-backend                 ✓ 88%    /Users/tom/Projects/api
    shopify-store              ⚠ 72%    /Users/tom/Projects/shopify
    docs-site                   ✓ 100%   /Users/tom/Projects/docs

Legend:
  → = Active project
  ✓ = Healthy (85%+)
  ⚠ = Needs attention (<85%)
  ✗ = Critical issues (<70%)
```

```
/list-projects --active-only
```

Output:
```
📋 Active Project

  → portfolio-site              ✓ 95%    /Users/tom/Projects/portfolio
```

## What This Command Does

1. Loads the project registry from `~/.claude/config.json`
2. Displays all registered projects with:
   - Active indicator (→)
   - Project name
   - Health score (if available)
   - Project path
3. Shows helpful legend and statistics

## Steps

This command wraps the existing `claude project list` CLI functionality:

```bash
# Execute the list command
claude project list

# The CLI handles:
#    - Loading project registry
#    - Calculating health scores
#    - Formatting output
#    - Showing active project indicator

# Optional: Filter to active only
if [ "$1" = "--active-only" ]; then
  claude project current
fi
```

## Options

### `--active-only`
Show only the currently active project instead of all registered projects.

```
/list-projects --active-only
```

## Output Format

### With Health Scores
```
📋 Registered Projects (3 total)

  → my-project-1                ✓ 95%    /path/to/project1
    my-project-2                ⚠ 75%    /path/to/project2
    my-project-3                ✗ 65%    /path/to/project3

Legend:
  → = Active project
  ✓ = Healthy (85%+)
  ⚠ = Needs attention (70-84%)
  ✗ = Critical issues (<70%)

To switch: /switch-project <name>
To validate: claude project validate <name>
```

### Empty Registry
```
📋 No projects registered yet

To get started:
  claude project create <name>

Or register an existing project:
  claude project register /path/to/project
```

### Active Only
```
📋 Active Project

  → portfolio-site              ✓ 95%    /Users/tom/Projects/portfolio

Project Details:
  Type: web-app
  Skills: 8 active
  Last accessed: 2 minutes ago

To see all projects:
  /list-projects
```

## Common Use Cases

### 1. Quick Overview
```
/list-projects
```
See all projects at a glance before switching

### 2. Check Current Project
```
/list-projects --active-only
```
Confirm which project you're working in

### 3. Find Projects Needing Attention
Look for ⚠ or ✗ indicators in the output, then:
```
claude project validate <name> --fix
```

## Error Handling

### No Projects Found
```
📋 No projects registered yet

Get started by creating or registering a project:

Create new:
  claude project create my-new-project

Register existing:
  claude project register /path/to/existing/project
```

### Config File Issues
```
❌ Error: Could not read project registry

The global config file may be corrupted or missing.

Location: ~/.claude/config.json

To fix:
  claude init --global
```

## See Also

- `/switch-project <name>` - Switch to a different project
- `claude project show <name>` - View detailed project information
- `claude project validate <name>` - Check project health
- `claude project register <path>` - Add existing project

## Tips

- Run `/list-projects` before `/switch-project` to see available options
- Projects with health scores < 70% may have missing components
- The active project indicator (→) shows your current working context
- Use `--active-only` for a quick status check

## Performance

- Fast: Lists projects directly from registry (no filesystem scanning)
- Typical response time: < 50ms for 20 projects
- No external network calls required

