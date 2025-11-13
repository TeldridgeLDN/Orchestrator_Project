# Slash Commands Reference

Quick reference for Claude Code IDE slash commands available in the Project Orchestrator.

## Table of Contents

1. [Project Management](#project-management)
2. [Development Workflow](#development-workflow)
3. [Documentation & Testing](#documentation--testing)

---

## Project Management

### `/switch-project`

Quickly switch between registered Claude projects.

**Usage:**
```
/switch-project <project-name>
```

**Examples:**
```
/switch-project portfolio-site
/switch-project api-backend
/switch-project my-shopify-store
```

**What It Does:**
1. Validates that the specified project exists in the registry
2. Checks project infrastructure health
3. Switches the active project context
4. Updates the global configuration
5. Displays confirmation with project details

**Success Output:**
```
✅ Successfully switched to project: portfolio-site
📍 Path: /Users/you/Projects/portfolio-site
🏥 Health Score: 92/100 (Healthy)
📅 Last Active: Just now
```

**Error Handling:**
- **Project not found**: Displays list of available projects
- **Invalid project**: Shows validation errors
- **Path issues**: Provides troubleshooting steps
- **CLI not available**: Provides installation instructions

**Equivalent CLI Command:**
```bash
claude project switch <project-name>
```

---

### `/list-projects`

Display all registered projects with their status and health scores.

**Usage:**
```
/list-projects [--active-only]
```

**Examples:**
```
/list-projects
/list-projects --active-only
```

**What It Does:**
1. Retrieves all registered projects from global configuration
2. Displays project names, paths, and status
3. Shows health indicators for each project
4. Highlights the currently active project

**Sample Output:**
```
📋 REGISTERED PROJECTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ portfolio-site              🟢 Healthy (92/100)
  /Users/you/Projects/portfolio-site
  Last Active: Just now
  
  api-backend                 🟡 Needs Attention (78/100)
  /Users/you/Projects/api-backend
  Last Active: 2 hours ago
  
  shopify-store              🟢 Healthy (88/100)
  /Users/you/Projects/shopify-store
  Last Active: 1 day ago

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 3 projects | Active: portfolio-site
```

**With --active-only:**
```
Current Active Project: portfolio-site
Path: /Users/you/Projects/portfolio-site
Health: 92/100 🟢 Healthy
Last Active: Just now
```

**Health Indicators:**
- ✅ Valid structure
- ⚠️ Issues detected
- ✗ Critical problems

**Equivalent CLI Command:**
```bash
claude project list
claude project list --active-only
```

---

## Development Workflow

### `/prep-release`

Prepare project for a new release by running pre-release checks and updates.

**Usage:**
```
/prep-release
```

**What It Does:**
1. Runs all test suites
2. Validates documentation completeness
3. Checks for uncommitted changes
4. Verifies version numbers are updated
5. Generates release notes template

**Sample Output:**
```
🚀 RELEASE PREPARATION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ All tests passing (142/142)
✅ Documentation up to date
✅ No uncommitted changes
✅ Version numbers consistent
⚠️  Release notes need review

Next Steps:
1. Review and finalize CHANGELOG.md
2. Create git tag: v1.2.0
3. Push to repository
```

---

### `/run-tests`

Execute the project test suite with various options.

**Usage:**
```
/run-tests [--watch] [--coverage] [--unit] [--integration]
```

**Examples:**
```
/run-tests
/run-tests --watch
/run-tests --coverage
/run-tests --unit
/run-tests --integration
```

**Options:**
- `--watch` - Run tests in watch mode (auto-rerun on changes)
- `--coverage` - Generate code coverage report
- `--unit` - Run only unit tests
- `--integration` - Run only integration tests
- `--verbose` - Show detailed output

**Sample Output:**
```
🧪 RUNNING TEST SUITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Unit Tests         78/78 passed    (2.4s)
✅ Integration Tests  42/42 passed    (8.1s)
✅ E2E Tests         22/22 passed   (15.3s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 142/142 passed (25.8s)
Coverage: 87.3%
```

---

## Documentation & Testing

### `/validate-docs`

Validate that all documentation is complete and properly formatted.

**Usage:**
```
/validate-docs [--fix]
```

**Examples:**
```
/validate-docs
/validate-docs --fix
```

**What It Does:**
1. Checks for broken links in markdown files
2. Validates code examples are syntactically correct
3. Ensures all API endpoints are documented
4. Verifies table of contents is up to date
5. Checks for outdated examples

**Sample Output:**
```
📚 DOCUMENTATION VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ No broken links found
✅ All code examples valid
⚠️  2 API endpoints missing documentation
⚠️  Table of contents needs update in README.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Issues Found: 2 warnings
Auto-fixable: 1

Run with --fix to automatically correct issues
```

---

## Creating Custom Slash Commands

You can create your own slash commands by adding markdown files to the `.claude/commands/` directory.

### Command File Structure

```markdown
# Command Name

Brief description of what the command does.

## Usage

\```
/my-command [options]
\```

## Examples

\```
/my-command --option value
\```

## Steps

Describe the implementation steps or reference a shell script.
```

### Adding Executable Scripts

For more complex commands, create a corresponding `.sh` file:

```bash
#!/bin/bash
# .claude/commands/my-command.sh

# Your command logic here
echo "Running my custom command..."
```

Make it executable:
```bash
chmod +x .claude/commands/my-command.sh
```

### Best Practices

1. **Keep it simple**: Slash commands should wrap existing functionality
2. **Provide feedback**: Always show success/error messages
3. **Handle errors**: Validate inputs and provide helpful error messages
4. **Document options**: Clearly explain all available flags
5. **Show examples**: Include common use cases
6. **Test thoroughly**: Verify edge cases and error conditions

---

## Troubleshooting

### Command Not Found

If a slash command isn't recognized:

1. Verify the `.md` file exists in `.claude/commands/`
2. Check file naming matches command name (use hyphens, not underscores)
3. Restart Claude Code IDE to reload commands
4. Check for syntax errors in the markdown file

### Permission Denied

If a `.sh` script fails with permission errors:

```bash
chmod +x .claude/commands/your-command.sh
```

### CLI Not Available

If commands fail because the `claude` CLI isn't found:

1. **Check installation**:
   ```bash
   which claude
   ```

2. **Add to PATH** (in `~/.bashrc` or `~/.zshrc`):
   ```bash
   export PATH="$HOME/.claude/bin:$PATH"
   ```

3. **Or create alias**:
   ```bash
   alias claude="~/.claude/bin/claude"
   ```

4. **Verify setup**:
   ```bash
   claude --version
   ```

---

## Related Documentation

- [CLI Reference](CLI_REFERENCE.md) - Complete command-line documentation
- [Getting Started](GETTING_STARTED.md) - Project setup guide
- [Workflow Creation Guide](WORKFLOW_CREATION_GUIDE.md) - Creating custom workflows

---

**Last Updated:** 2025-11-12  
**Version:** 1.0.0

