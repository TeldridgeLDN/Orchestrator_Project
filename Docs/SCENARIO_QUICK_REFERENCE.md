# Scenario Commands Quick Reference

One-page reference for the `diet103 scenario` command suite.

## Command Overview

| Command | Purpose | Key Options |
|---------|---------|-------------|
| `create` | Create new scenario | `-t, --template`, `--name`, `--no-interactive` |
| `list` | List all scenarios | `--json` |
| `show` | Show scenario details | `-v, --verbose`, `--json` |
| `edit` | Edit scenario | `-i, --interactive`, `-e, --editor` |
| `validate` | Validate configuration | `--strict`, `-v` |
| `deploy` | Deploy scenario | `-e, --environment`, `--dry-run`, `-f` |
| `remove` | Remove scenario | `-f, --force`, `--keep-data` |
| `optimize` | Optimize configuration | `-a, --apply`, `-i, --interactive` |
| `explore` | Explore alternatives | `-a, --alternatives`, `-c, --compare` |

## Quick Examples

### Create & Deploy Workflow

```bash
# Create from template
diet103 scenario create -t basic -n my-scenario --no-interactive

# Validate
diet103 scenario validate my-scenario

# Test deployment
diet103 scenario deploy my-scenario --dry-run

# Deploy to dev
diet103 scenario deploy my-scenario

# Deploy to production
diet103 scenario deploy my-scenario -e production
```

### Optimization Workflow

```bash
# Check for issues
diet103 scenario optimize my-scenario

# Apply fixes interactively
diet103 scenario optimize my-scenario -i

# Validate improvements
diet103 scenario validate my-scenario
```

### Exploration Workflow

```bash
# See alternatives
diet103 scenario explore my-scenario

# Compare approaches
diet103 scenario explore my-scenario -a 5 --compare

# Choose and implement best approach
diet103 scenario edit my-scenario
```

## Common Options

| Option | Short | Description |
|--------|-------|-------------|
| `--help` | `-h` | Show help |
| `--version` | `-V` | Show version |
| `--json` | | JSON output |
| `--verbose` | `-v` | Detailed output |
| `--force` | `-f` | Skip confirmations |
| `--interactive` | `-i` | Interactive mode |
| `--dry-run` | | Test without changes |

## Templates

| Template | Complexity | Use Case |
|----------|-----------|----------|
| `basic` | Low | Simple workflows, learning |
| `advanced` | Medium | Complex workflows, production |
| `custom` | Variable | Unique requirements |

## Environments

- `dev` - Development (default)
- `staging` - Pre-production testing
- `production` - Live deployment

## File Locations

- **Scenarios**: `~/.claude/scenarios/`
- **Documentation**: Project `docs/` directory
- **Templates**: `lib/templates/scenario/`

## Validation Checks

✅ YAML Syntax  
✅ Schema Compliance  
✅ Dependency Resolution  
✅ Unique Step IDs  
✅ Circular Dependency Detection

## Priority Levels

- 🔴 **HIGH** - Critical issues
- 🟡 **MEDIUM** - Important improvements
- 🔵 **LOW** - Nice-to-have enhancements

## Alternative Approaches

1. **Simplified** - Low complexity, 2-3 days
2. **Event-Driven** - High complexity, 1-2 weeks
3. **Microservices** - Very High complexity, 3-4 weeks
4. **Serverless** - Medium complexity, 1 week
5. **Batch Processing** - Medium complexity, 1 week

## Troubleshooting

```bash
# Scenario not found
diet103 scenario list

# Validation errors
diet103 scenario validate <name> -v

# Deployment issues
diet103 scenario deploy <name> --dry-run

# YAML syntax help
diet103 scenario edit <name>  # Auto-validates
```

## Getting Help

```bash
# Command help
diet103 scenario --help
diet103 scenario <command> --help

# Full documentation
open docs/SCENARIO_CLI.md
```

---

**Tip**: Use tab completion for command and option names (if shell completion is set up).

**Version**: 1.0.0

