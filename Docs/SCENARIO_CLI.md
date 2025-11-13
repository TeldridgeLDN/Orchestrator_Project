# Scenario CLI Documentation

Complete guide to the `diet103 scenario` command suite for managing scenario lifecycle.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
  - [create](#create)
  - [list](#list)
  - [show](#show)
  - [edit](#edit)
  - [validate](#validate)
  - [scaffold](#scaffold)
  - [deploy](#deploy)
  - [remove](#remove)
  - [optimize](#optimize)
  - [explore](#explore)
  - [decisions](#decisions)
  - [improvements](#improvements)
- [Workflow Examples](#workflow-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The scenario CLI provides a complete toolkit for defining, managing, and deploying scenarios in the Partnership-Enabled Scenario System. Scenarios are declarative YAML configurations that define recurring business processes and workflows.

> **💡 AI Assistance:** The `scenario_manager` skill provides intelligent, context-aware assistance when working with scenarios. It activates automatically when you mention scenarios in conversation, providing guidance, validation, and metadata tracking. See [Scenario Manager Skill](#scenario-manager-skill) for details.

### What is a Scenario?

A scenario represents a recurring business process or workflow that can be automated. It includes:

- **Trigger**: How the scenario is initiated (manual, scheduled, webhook, hybrid)
- **Steps**: Sequential or parallel operations to perform
- **Dependencies**: Required MCPs, skills, and other resources
- **Generates**: Artifacts created (skills, slash commands, webhooks)

## Installation

The scenario commands are part of the `diet103` CLI:

```bash
npm install -g diet103
```

Or use locally:

```bash
npx diet103 scenario <command>
```

## Quick Start

### Create Your First Scenario

```bash
# Interactive creation
diet103 scenario create

# From template
diet103 scenario create --template basic --name my-first-scenario --no-interactive
```

### List All Scenarios

```bash
diet103 scenario list
```

### View Details

```bash
diet103 scenario show my-first-scenario
```

### Validate Before Deployment

```bash
diet103 scenario validate my-first-scenario
```

### Deploy

```bash
diet103 scenario deploy my-first-scenario
```

---

## Commands

### create

Create a new scenario interactively or from a template.

#### Usage

```bash
diet103 scenario create [options]
```

#### Options

- `-t, --template <name>` - Template to use: `basic`, `advanced`, or `custom`
- `-n, --name <name>` - Scenario name (kebab-case)
- `--no-interactive` - Disable interactive prompts

#### Interactive Mode

When run without options, presents an interactive wizard:

1. **Name**: Scenario name (validated as kebab-case)
2. **Description**: Brief description of the scenario
3. **Category**: Choose from business_process, data_pipeline, automation, integration, other
4. **Template**: Select basic, advanced, or custom template
5. **Trigger Type**: Choose manual, scheduled, webhook, or hybrid

#### Templates

**Basic Template**
- Simple manual trigger
- 2 basic steps
- Minimal configuration
- Good for: Simple workflows, learning

**Advanced Template**
- Hybrid trigger (command + webhook + schedule)
- 4 steps with dependencies
- AI analysis integration
- Multiple MCPs
- Design decisions tracking
- Good for: Complex workflows, production use

**Custom Template**
- Empty starting point
- Define everything from scratch
- Good for: Unique requirements

#### Examples

```bash
# Interactive mode - full wizard
diet103 scenario create

# Quick creation from basic template
diet103 scenario create --template basic --name client-intake --no-interactive

# Advanced scenario
diet103 scenario create --template advanced --name order-processing
```

#### Output

Creates a YAML file at `~/.claude/scenarios/<name>.yaml` with the scenario configuration.

---

### list

List all available scenarios with metadata.

#### Usage

```bash
diet103 scenario list [options]
```

#### Options

- `-s, --status <status>` - Filter by status (future feature)
- `--json` - Output as JSON instead of table

#### Output Format

**Table Format (Default)**
```
📋 Available Scenarios

NAME                DESCRIPTION                             CATEGORY       STEPS
─────────────────────────────────────────────────────────────────────────────
client-intake       Capture client requirements             business_proce 3
order-processing    Process customer orders                 automation     5

Total: 2 scenarios
```

**JSON Format**
```json
[
  {
    "name": "client-intake",
    "description": "Capture client requirements",
    "category": "business_process",
    "version": "1.0.0",
    "trigger": "/client-intake",
    "steps": 3,
    "dependencies": {
      "mcps": 2,
      "skills": 1
    },
    "created": "2025-11-10T10:00:00.000Z",
    "modified": "2025-11-10T10:00:00.000Z",
    "filePath": "/Users/you/.claude/scenarios/client-intake.yaml"
  }
]
```

#### Examples

```bash
# List all scenarios
diet103 scenario list

# JSON output for scripting
diet103 scenario list --json

# Pipe to jq for filtering
diet103 scenario list --json | jq '.[] | select(.category == "automation")'
```

---

### show

Display detailed information about a specific scenario.

#### Usage

```bash
diet103 scenario show <name> [options]
```

#### Arguments

- `<name>` - Scenario name (required)

#### Options

- `-v, --verbose` - Show verbose output with all details
- `--json` - Output as JSON

#### Standard Output

Shows:
- Basic info (name, description, category, version, trigger)
- Steps with IDs and actions
- Dependencies (MCPs and skills)
- Generated artifacts

#### Verbose Output

Additionally shows:
- Detailed trigger configuration
- Step types, dependencies, and MCPs
- Design decisions with rationale
- Potential improvements
- File metadata (path, dates, size)

#### Examples

```bash
# Basic details
diet103 scenario show client-intake

# Full details
diet103 scenario show client-intake -v

# JSON for programmatic access
diet103 scenario show client-intake --json
```

---

### edit

Edit an existing scenario configuration.

#### Usage

```bash
diet103 scenario edit <name> [options]
```

#### Arguments

- `<name>` - Scenario name (required)

#### Options

- `-i, --interactive` - Use interactive prompt-based editing
- `-e, --editor <editor>` - Specify editor (overrides $EDITOR)

#### Editor Mode (Default)

Opens scenario file in your default editor:
1. Respects `$EDITOR` or `$VISUAL` environment variables
2. Falls back to `vi` if not set
3. Can be overridden with `--editor` flag
4. Validates YAML syntax after editing

#### Interactive Mode

Prompts for basic fields:
- Description
- Category
- Trigger type
- Option to edit steps in external editor

#### Examples

```bash
# Open in default editor
diet103 scenario edit client-intake

# Use specific editor
diet103 scenario edit client-intake --editor nano

# Interactive prompts
diet103 scenario edit client-intake -i
```

#### Validation

After editing, YAML syntax is automatically validated. If errors are found:
```
❌ YAML syntax error: mapping values are not allowed here
Please fix the syntax errors and try again.
```

---

### validate

Validate scenario configuration and dependencies.

#### Usage

```bash
diet103 scenario validate <name> [options]
```

#### Arguments

- `<name>` - Scenario name (required)

#### Options

- `--strict` - Use strict validation rules
- `-v, --verbose` - Show detailed error messages

#### Validation Checks

1. **YAML Syntax**: Valid YAML structure
2. **Schema**: Validates against JSON Schema
   - Required fields present
   - Correct data types
   - Valid enum values
   - Pattern matching (names, versions)
3. **Dependencies**: 
   - Step dependencies reference existing steps
   - No circular dependencies
4. **Uniqueness**: No duplicate step IDs

#### Output

```
🔍 Validation Results

✅ YAML Syntax: Valid
✅ Schema: Valid
✅ Dependencies: Valid
✅ Step IDs: Unique

✅ All validations passed!
```

Or with errors:

```
🔍 Validation Results

✅ YAML Syntax: Valid
❌ Schema: Invalid
   /scenario/trigger/type: must be equal to one of the allowed values
❌ Dependencies: Invalid
   Step "step_3" depends on non-existent step "step_2a"
   Circular dependency detected: step_1 -> step_2 -> step_1
✅ Step IDs: Unique

❌ Validation failed. Please fix the errors above.
```

#### Examples

```bash
# Basic validation
diet103 scenario validate client-intake

# Verbose errors
diet103 scenario validate client-intake -v

# Strict mode
diet103 scenario validate client-intake --strict
```

---

### scaffold

Generate orchestrator components (skills, commands, hooks, MCP configs) from a scenario definition.

#### Usage

```bash
diet103 scenario scaffold <name> [options]
```

#### Arguments

- `<name>` - Scenario name (required, without .yaml extension)

#### Options

- `-f, --force` - Overwrite existing files without prompting
- `-n, --dry-run` - Preview what would be generated without writing files
- `-y, --yes` - Skip confirmation prompt
- `--no-backup` - Do not create backups when overwriting files
- `--skip-mcp` - Skip MCP configuration generation
- `--claude-home <path>` - Override Claude home directory (default: ~/.claude/)
- `-v, --verbose` - Show detailed output including all file paths

#### Scaffolding Process

The scaffold command performs a comprehensive 5-phase workflow:

**Phase 1: Parse & Validate**
- Parses scenario YAML file
- Validates against JSON Schema
- Checks business logic (dependencies, circular refs, duplicates)
- Extracts metadata and identifies generation targets

**Phase 2: Generate Content**
- Creates skill documentation (SKILL.md) and metadata (metadata.json)
- Generates slash command documentation
- Creates hook scripts with proper execution permissions
- Applies templates with scenario-specific data

**Phase 3: Determine File Paths**
- Maps content to ~/.claude/ directory structure
- Handles custom Claude home if specified
- Sets appropriate file permissions for hooks

**Phase 4: Write Files with Rollback**
- Safely writes files with automatic rollback on errors
- Tracks all operations (create, update, skip)
- Uses content hashing for idempotency
- Creates backups before overwriting (unless --no-backup)

**Phase 5: Generate MCP Config**
- Creates MCP server configuration entries
- Generates setup documentation
- Outputs for manual merge into .mcp.json

#### Generated Components

**Skills** (`.claude/skills/<skill-name>/`)
- `SKILL.md` - Complete skill documentation with workflows
- `metadata.json` - Skill metadata for registration

**Slash Commands** (`.claude/commands/`)
- `<command-name>.md` - Command documentation with usage examples

**Hooks** (`.claude/hooks/`)
- `<hook-name>.js` - Executable hook script with keyword/command detection

**MCP Configuration**
- JSON configuration snippets for .mcp.json
- Setup documentation with API key placeholders

#### Standard Output

```
🔍 Validating scenario...
✓ Scenario validated

Scenario Details:
  Name: client-intake
  Description: Client requirement gathering workflow
  Category: business_process
  Steps: 3

Will Generate:
  ✓ 1 skill(s)
    - client_intake
  ✓ 1 command(s)
    - /client-intake
  ⚙  MCP configuration (manual merge required)
    - google-forms-mcp

? Proceed with scaffolding? (Y/n) y

🚀 Starting scaffold...

✓ Scaffolding completed successfully!

Summary:
  Created: 3 file(s)
  Updated: 0 file(s)
  Skipped: 0 file(s)

⚙  MCP Configuration Required
The following MCP servers need to be configured:
  - google-forms-mcp

Add the generated configuration to your .mcp.json file.

Next Steps:
  1. Review generated files in ~/.claude/
  2. Merge MCP configuration into .mcp.json
  3. Restart Claude Code to load new components
```

#### Dry Run Mode

Preview what would be generated without making changes:

```bash
diet103 scenario scaffold client-intake --dry-run
```

Output shows validation and planned operations but doesn't write files:

```
🔍 Dry run mode - no files will be written
✓ Dry run completed successfully
  Session ID: scaffold-1699...-a7b8
```

#### Force Mode

Overwrite existing files without confirmation:

```bash
diet103 scenario scaffold client-intake --force
```

**Warning**: This will replace existing files. Backups are created by default unless `--no-backup` is used.

#### Idempotency

The scaffold command is idempotent using content hashing:
- **Identical content**: File is skipped
- **Different content**: File is updated (with backup)
- **Missing file**: File is created

This allows safe re-running of scaffold commands without unnecessary changes.

#### Rollback Protection

If any error occurs during scaffolding, all changes are automatically rolled back:

1. Created files are deleted
2. Modified files are restored from backup
3. Empty directories are removed
4. Session is marked as rolled back

#### Examples

```bash
# Basic scaffolding
diet103 scenario scaffold client-intake

# Preview without changes
diet103 scenario scaffold client-intake --dry-run

# Force overwrite with no prompts
diet103 scenario scaffold client-intake --force --yes

# Scaffold to custom location
diet103 scenario scaffold client-intake --claude-home /custom/path

# Skip MCP generation
diet103 scenario scaffold client-intake --skip-mcp

# Verbose output showing all file operations
diet103 scenario scaffold client-intake --verbose
```

#### Error Handling

**Scenario Not Found**
```
✗ Scenario "client-intake" not found
Looking for: ~/.claude/scenarios/client-intake.yaml
```
**Solution**: Verify scenario file exists and name is correct.

**Validation Failed**
```
✗ Scenario validation failed
  1. /scenario/trigger/type: must be equal to one of the allowed values
     Path: scenario.trigger.type
```
**Solution**: Fix validation errors in YAML file and retry.

**File Write Failed**
```
✗ Scaffolding failed
Permission denied: ~/.claude/skills/
```
**Solution**: Check directory permissions, ensure ~/.claude/ exists and is writable.

#### Integration with Other Commands

Typical workflow:

```bash
# 1. Create scenario
diet103 scenario create --template advanced --name client-intake

# 2. Edit as needed
diet103 scenario edit client-intake

# 3. Validate before scaffolding
diet103 scenario validate client-intake

# 4. Preview scaffold output
diet103 scenario scaffold client-intake --dry-run

# 5. Scaffold components
diet103 scenario scaffold client-intake

# 6. Restart Claude Code to load components
```

#### Safety Features

1. **Validation First**: Always validates scenario before generating
2. **Confirmation Prompts**: Asks before overwriting (unless --yes)
3. **Automatic Backups**: Creates .bak files when overwriting
4. **Rollback on Error**: Restores original state if anything fails
5. **Idempotent Operations**: Safe to run multiple times
6. **Dry Run Mode**: Test without making changes

#### File Structure

After scaffolding, your Claude directory looks like:

```
~/.claude/
├── skills/
│   └── client_intake/
│       ├── SKILL.md
│       └── metadata.json
├── commands/
│   └── client-intake.md
├── hooks/
│   └── client_intake_hook.js  (executable)
└── [manual] .mcp.json updates required
```

#### MCP Configuration

MCP configurations must be manually merged into `.mcp.json`. The scaffold command generates the configuration but doesn't modify your existing `.mcp.json` file to prevent accidental overwrites.

Example generated MCP config:

```json
{
  "mcpServers": {
    "google-forms-mcp": {
      "command": "npx",
      "args": ["-y", "google-forms-mcp"],
      "env": {
        "GOOGLE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

#### Best Practices

1. **Always validate first**: Run `validate` before `scaffold`
2. **Use dry-run mode**: Test with `--dry-run` for new scenarios
3. **Review generated files**: Check output before using in production
4. **Version control**: Commit scenario YAMLs to git
5. **Backup important files**: Use backups when overwriting custom code
6. **Test in isolation**: Restart Claude Code after scaffolding
7. **Document customizations**: Note any manual changes to generated files

---

### deploy

Deploy a scenario to a target environment.

#### Usage

```bash
diet103 scenario deploy <name> [options]
```

#### Arguments

- `<name>` - Scenario name (required)

#### Options

- `-e, --environment <env>` - Target environment: `dev`, `staging`, `production` (default: dev)
- `--dry-run` - Show deployment plan without executing
- `-f, --force` - Skip confirmation for production deploys

#### Deployment Process

1. Validates scenario configuration
2. Checks dependencies
3. Creates skill definitions
4. Registers slash commands
5. Sets up triggers
6. Deploys to environment

#### Dry Run Mode

Shows what would be deployed without making changes:

```
🔍 Dry Run Mode

Scenario: client-intake
Environment: production
Steps to deploy: 3

📋 Deployment Plan:

  • Would create: global_skill: client_intake
  • Would create: slash_command: /client-intake

🔗 Required Dependencies:

  • MCP: google-forms-mcp
  • MCP: airtable-mcp
  • Skill: notification_handler

⚠️  No actual changes were made (dry run)
```

#### Production Safeguards

Deploying to production requires explicit confirmation:

```
⚠️  Warning: Deploying to PRODUCTION

? Are you sure you want to deploy to production? (y/N)
```

Use `--force` to skip confirmation (use with caution).

#### Examples

```bash
# Deploy to dev (default)
diet103 scenario deploy client-intake

# Test deployment
diet103 scenario deploy client-intake --dry-run

# Deploy to production
diet103 scenario deploy client-intake -e production

# Force production deploy (CI/CD)
diet103 scenario deploy client-intake -e production -f
```

---

### remove

Remove a scenario and its associated files.

#### Usage

```bash
diet103 scenario remove <name> [options]
diet103 scenario rm <name> [options]  # Alias
```

#### Arguments

- `<name>` - Scenario name (required)

#### Options

- `-f, --force` - Skip confirmation prompt
- `--keep-data` - Preserve scenario data files (future feature)

#### Confirmation

By default, prompts for confirmation:

```
⚠️  Warning: This will permanently delete scenario "client-intake"

? Are you sure you want to remove this scenario? (y/N)
```

#### Examples

```bash
# Remove with confirmation
diet103 scenario remove client-intake

# Force remove (no prompt)
diet103 scenario rm client-intake -f

# Using alias
diet103 scenario rm old-scenario -f
```

#### Warning

This operation is permanent. Consider using version control for scenario files.

---

### optimize

Analyze and optimize scenario configuration.

#### Usage

```bash
diet103 scenario optimize <name> [options]
```

#### Arguments

- `<name>` - Scenario name (required)

#### Options

- `-a, --apply` - Apply optimizations automatically (limited support)
- `-i, --interactive` - Review and apply suggestions interactively

#### Analysis Checks

The optimize command analyzes scenarios for:

1. **Missing Fields**: version, testStrategy, etc.
2. **Performance**: Duplicate step types that could be batched
3. **Best Practices**: Test strategies, documentation
4. **Architecture**: Complex dependency chains
5. **Documentation**: Design decisions, rationale
6. **Configuration**: Incomplete or invalid settings

#### Priority Levels

- **🔴 HIGH**: Critical issues (missing required config)
- **🟡 MEDIUM**: Important improvements (missing best practices)
- **🔵 LOW**: Nice-to-have enhancements (additional documentation)

#### Output Example

```
🔧 Optimization Suggestions

1. Add trigger command
   Priority: HIGH
   Type: configuration
   Manual triggers should specify a command
   → Add command field to trigger configuration
   ✨ Can be auto-fixed

2. Add test strategy
   Priority: MEDIUM
   Type: best_practice
   Define how to test this scenario
   → Add testStrategy field with test plan

3. Document design decisions
   Priority: LOW
   Type: documentation
   Design decisions help future maintainers understand choices
   → Add design_decisions array with rationale for key choices

Found 3 optimizations
```

#### Interactive Mode

Apply fixes one by one:

```bash
diet103 scenario optimize client-intake -i

🔧 Interactive Optimization

? Apply: Add trigger command? (Y/n) y
  ✓ Applied: Add trigger command
? Apply: Add version field? (Y/n) n

✅ Optimizations applied!
```

#### Examples

```bash
# Show suggestions
diet103 scenario optimize client-intake

# Interactive mode
diet103 scenario optimize client-intake -i

# Auto-apply (limited)
diet103 scenario optimize client-intake -a
```

---

### explore

Explore alternative implementations and configurations.

#### Usage

```bash
diet103 scenario explore <name> [options]
```

#### Arguments

- `<name>` - Scenario name (required)

#### Options

- `-a, --alternatives <count>` - Number of alternatives (1-5, default: 3)
- `-c, --compare` - Show detailed comparison with pros/cons

#### Alternative Approaches

Generates architectural alternatives:

1. **Simplified Approach** (Low complexity, 2-3 days)
2. **Event-Driven Architecture** (High complexity, 1-2 weeks)
3. **Microservices Approach** (Very High complexity, 3-4 weeks)
4. **Serverless Functions** (Medium complexity, 1 week)
5. **Batch Processing** (Medium complexity, 1 week)

#### Standard Output

```
🔍 Alternative Implementations

1. Simplified Approach
   Reduce complexity by combining steps and removing optional features
   
   Complexity: Low | Time: 2-3 days

2. Event-Driven Architecture
   Use event bus for loose coupling and better scalability
   
   Complexity: High | Time: 1-2 weeks

3. Microservices Approach
   Split scenario into independent microservices
   
   Complexity: Very High | Time: 3-4 weeks

Use --compare to see detailed pros/cons
```

#### Comparison Mode

Shows detailed analysis:

```
1. Simplified Approach
   Reduce complexity by combining steps and removing optional features

   Key Changes:
   • Combine similar steps into single operations
   • Remove optional validation steps
   • Use synchronous processing where possible

   Pros:
   ✓ Faster implementation time
   ✓ Easier to maintain
   ✓ Lower resource usage

   Cons:
   ✗ Less flexible
   ✗ May require manual intervention
   ✗ Limited error handling

   Estimates:
   Complexity: Low
   Time: 2-3 days
```

#### Examples

```bash
# Show 3 alternatives
diet103 scenario explore client-intake

# Generate 5 alternatives
diet103 scenario explore client-intake -a 5

# Detailed comparison
diet103 scenario explore client-intake --compare
```

---

### decisions

View and manage design decisions in scenarios.

#### Usage

```bash
diet103 scenario decisions <name> [options]
```

#### Arguments

- `<name>` - Scenario name (required)

#### Options

- `-a, --add` - Add a new design decision
- `-v, --verbose` - Show verbose output including all details
- `--no-interactive` - Disable interactive prompts (requires --decision and --reasoning)
- `-d, --decision <text>` - Decision made (non-interactive mode)
- `-r, --reasoning <text>` - Reasoning for the decision (non-interactive mode)
- `--alternatives <list>` - Comma-separated list of alternatives considered
- `--trade-offs <text>` - Trade-offs of this decision
- `--date <date>` - Date of decision (YYYY-MM-DD, defaults to today)
- `--json` - Output in JSON format

#### View Mode

Display all design decisions for a scenario:

```bash
# View all decisions
diet103 scenario decisions client-intake

# View with full details (alternatives and trade-offs)
diet103 scenario decisions client-intake -v
```

**Output includes:**
- Decision text
- Reasoning
- Alternatives considered (verbose mode)
- Trade-offs (verbose mode)
- Date

#### Add Mode (Interactive)

Add design decisions through guided prompts:

```bash
diet103 scenario decisions client-intake --add
```

**Interactive prompts for:**
1. Decision made (required, min 10 chars)
2. Reasoning (required, min 10 chars)
3. Alternatives considered (optional, comma-separated)
4. Trade-offs (optional)
5. Date (auto-generated as YYYY-MM-DD)

#### Add Mode (Non-Interactive)

Add design decisions via command-line flags:

```bash
diet103 scenario decisions client-intake --add --no-interactive \
    --decision "Use REST instead of GraphQL" \
    --reasoning "Simpler to implement and maintain" \
    --alternatives "GraphQL,gRPC" \
    --trade-offs "Less flexible querying"
```

#### Examples

```bash
# View all design decisions
diet103 scenario decisions order-processing

# View with full details
diet103 scenario decisions order-processing -v

# Add interactively
diet103 scenario decisions order-processing --add

# Add with flags
diet103 scenario decisions order-processing --add --no-interactive \
    --decision "Use PostgreSQL for primary database" \
    --reasoning "Strong ACID compliance and JSON support" \
    --alternatives "MySQL,MongoDB" \
    --trade-offs "Slightly more complex setup than MySQL"

# Get JSON output
diet103 scenario decisions order-processing --json
```

#### Use Cases

- Document architectural decisions
- Track technology choices
- Record alternatives considered
- Explain trade-offs made
- Provide context for future maintainers

---

### improvements

View and manage potential improvements in scenarios.

#### Usage

```bash
diet103 scenario improvements <name> [options]
```

#### Arguments

- `<name>` - Scenario name (required)

#### Options

- `-a, --add` - Add a new potential improvement
- `-v, --verbose` - Show verbose output including summary statistics
- `-p, --priority <level>` - Filter by priority (high, medium, low)
- `--sort-by-priority` - Sort improvements by priority
- `--no-interactive` - Disable interactive prompts (requires --suggestion)
- `-s, --suggestion <text>` - Improvement suggestion (non-interactive mode)
- `-i, --impact <level>` - Impact level: low, medium, high (default: medium)
- `-c, --complexity <level>` - Complexity level: low, medium, high (default: medium)
- `--priority-level <level>` - Priority level: low, medium, high (default: medium)
- `--json` - Output in JSON format

#### View Mode

Display all potential improvements for a scenario:

```bash
# View all improvements
diet103 scenario improvements client-intake

# View with summary statistics
diet103 scenario improvements client-intake -v

# Filter by priority
diet103 scenario improvements client-intake -p high

# Sort by priority
diet103 scenario improvements client-intake --sort-by-priority
```

**Output includes:**
- 🔴🟡🟢 Priority emoji indicators
- Impact level (high/medium/low)
- Complexity badges (●/●●/●●●)
  - Low: ● (green)
  - Medium: ●● (yellow)
  - High: ●●● (red)
- Priority level
- Summary statistics (in verbose mode)

#### Add Mode (Interactive)

Add improvements through guided prompts:

```bash
diet103 scenario improvements client-intake --add
```

**Interactive prompts for:**
1. Improvement suggestion (required, min 10 chars)
2. Impact if implemented (high/medium/low)
3. Implementation complexity (low/medium/high)
4. Priority (high/medium/low)

#### Add Mode (Non-Interactive)

Add improvements via command-line flags:

```bash
diet103 scenario improvements client-intake --add --no-interactive \
    --suggestion "Add caching layer for API responses" \
    --impact high \
    --complexity medium \
    --priority-level high
```

#### Examples

```bash
# View all improvements
diet103 scenario improvements order-processing

# View high-priority items only
diet103 scenario improvements order-processing -p high

# View with statistics
diet103 scenario improvements order-processing -v

# Add interactively
diet103 scenario improvements order-processing --add

# Add with flags
diet103 scenario improvements order-processing --add --no-interactive \
    --suggestion "Implement retry logic for failed API calls" \
    --impact high \
    --complexity low \
    --priority-level high

# Sort by priority and get JSON
diet103 scenario improvements order-processing --sort-by-priority --json
```

#### Use Cases

- Track future enhancements
- Prioritize technical debt
- Document optimization opportunities
- Plan iterative improvements
- Maintain backlog of ideas

#### Priority System

**High Priority** 🔴
- Critical improvements
- High impact, reasonable effort
- Should be addressed soon

**Medium Priority** 🟡
- Important but not urgent
- Good balance of impact/effort
- Plan for next iteration

**Low Priority** 🟢
- Nice-to-have features
- Low impact or high complexity
- Consider when time permits

---

## Workflow Examples

### Complete Scenario Lifecycle

```bash
# 1. Create scenario
diet103 scenario create --template advanced --name order-processing

# 2. Validate configuration
diet103 scenario validate order-processing

# 3. Check for optimizations
diet103 scenario optimize order-processing

# 4. Preview scaffold output
diet103 scenario scaffold order-processing --dry-run

# 5. Scaffold components
diet103 scenario scaffold order-processing

# 6. Restart Claude Code to load new components
# ... restart ...

# 7. Test scaffolded components
# ... test skills, commands, hooks ...

# 8. Test deployment (if using deploy command)
diet103 scenario deploy order-processing --dry-run

# 9. Deploy to dev
diet103 scenario deploy order-processing

# 10. Test in dev environment
# ... manual testing ...

# 11. Deploy to production
diet103 scenario deploy order-processing -e production
```

### Iterative Development

```bash
# Create initial scenario
diet103 scenario create -t basic -n my-scenario --no-interactive

# Edit and refine
diet103 scenario edit my-scenario

# Validate after each change
diet103 scenario validate my-scenario

# Optimize when ready
diet103 scenario optimize my-scenario -i
```

### Exploring Options

```bash
# Create prototype
diet103 scenario create -t custom -n prototype

# Explore alternatives
diet103 scenario explore prototype --compare

# Choose approach and implement
diet103 scenario edit prototype

# Validate and deploy
diet103 scenario validate prototype
diet103 scenario deploy prototype
```

### Managing Multiple Scenarios

```bash
# List all scenarios
diet103 scenario list --json > scenarios.json

# Validate all
for scenario in $(jq -r '.[].name' scenarios.json); do
  diet103 scenario validate "$scenario"
done

# Deploy all to staging
for scenario in $(jq -r '.[].name' scenarios.json); do
  diet103 scenario deploy "$scenario" -e staging
done
```

---

## Best Practices

### Naming Conventions

- **Scenario names**: Use kebab-case (e.g., `client-intake`, `order-processing`)
- **Step IDs**: Use snake_case (e.g., `validate_input`, `send_notification`)
- **MCP references**: Match actual MCP names exactly

### Version Control

Store scenario files in git:

```bash
# Add scenarios to git
git add ~/.claude/scenarios/

# Or create project-specific scenarios
mkdir -p .claude/scenarios/
diet103 scenario create  # Edit to save to project dir
git add .claude/scenarios/
```

### Testing Strategy

1. **Validate** before every deployment
2. **Dry run** before production deploys
3. **Test in dev** environment first
4. **Document** test strategy in scenario YAML

### Documentation

- Add `description` field to all steps
- Include `design_decisions` for complex scenarios
- Document `potential_improvements` for future work
- Use `testStrategy` field to describe testing approach

### Dependencies

- Verify all MCPs are available before deployment
- Document required skills and their versions
- Test with all dependencies in dev environment first

### Optimization

- Run `optimize` command periodically
- Review suggestions even if not applying them
- Use `explore` to consider alternatives before major changes

---

## Troubleshooting

### Common Issues

#### Scenario Not Found

```
❌ Scenario "my-scenario" not found
List available scenarios with: diet103 scenario list
```

**Solution**: Check spelling, verify file exists at `~/.claude/scenarios/my-scenario.yaml`

#### YAML Syntax Errors

```
❌ YAML syntax error: mapping values are not allowed here
```

**Solution**: 
- Check YAML indentation (use spaces, not tabs)
- Validate syntax online at yamllint.com
- Use `diet103 scenario edit` which validates automatically

#### Validation Failures

```
❌ Dependencies: Invalid
   Step "step_3" depends on non-existent step "step_2a"
```

**Solution**: 
- Check step dependencies match actual step IDs
- Use `diet103 scenario show <name> -v` to see all step IDs
- Fix in editor and re-validate

#### Circular Dependencies

```
❌ Dependencies: Invalid
   Circular dependency detected: step_1 -> step_2 -> step_1
```

**Solution**: Review dependency graph, remove circular references

#### Deployment Failures

**Solution**:
- Run `diet103 scenario validate <name>` first
- Check all MCPs are available
- Verify required skills exist
- Use `--dry-run` to test deployment plan

### Getting Help

```bash
# Command-specific help
diet103 scenario <command> --help

# General help
diet103 scenario --help

# Version info
diet103 --version
```

### Debug Mode

For detailed error information, check the terminal output. Most commands provide helpful error messages with suggestions for fixes.

---

## Scenario Manager Skill

The `scenario_manager` skill provides intelligent assistance when working with scenarios through natural language interaction with Claude.

### How It Works

The skill automatically activates when you mention scenarios in conversation, providing:

- **Scenario Discovery**: Shows available and scaffolded scenarios with metadata
- **Creation Guidance**: Helps structure new scenarios with templates
- **Validation**: Pre-flight checks before scaffolding
- **Metadata Tracking**: Maintains scenario status in `~/.claude/config.json`

### Activation Triggers

The skill activates on these phrases:

**Creation/Scaffolding:**
- "create scenario"
- "new scenario"
- "scaffold scenario"

**Discovery:**
- "list scenarios"
- "what scenarios"
- "show scenarios"

**Validation:**
- "validate scenario"
- "check scenario"

**Status:**
- "scenario status"
- "scenario info"

### Example Interactions

#### Discovering Scenarios

```
You: "What scenarios do I have?"

[scenario_manager activates]

Claude: "Available Scenarios (Not Scaffolded):
• client-intake (created 2 days ago)
  Description: Client requirement gathering workflow
  Components: 3 skills, 2 commands, 1 hook
  
Scaffolded Scenarios (Active):
• my-scenario (scaffolded 5 days ago)
  Generated: my_scenario skill, /my-scenario command
  Location: ~/.claude/skills/my_scenario/
  Last used: 2 days ago

To scaffold an available scenario:
  diet103 scenario scaffold client-intake"
```

#### Creating a Scenario

```
You: "I want to create a new scenario for client intake"

[scenario_manager activates]

Claude: "I'll help you create a client intake scenario.

Options:
1. Start from template (recommended for common patterns)
2. Build from scratch (full control)
3. Convert existing workflow

For client intake, I recommend the 'business_process' template.

Would you like me to guide you through:
- Defining the steps (form → notification → processing)
- Mapping to components (skills, commands, hooks)
- Creating the YAML structure"
```

#### Validating Before Scaffolding

```
You: "Is client-intake ready to scaffold?"

[scenario_manager activates]

Claude: "Checking client-intake scenario readiness...

✓ YAML syntax valid
✓ All required fields present
✓ No circular dependencies
✓ Step IDs are unique
⚠ Warning: MCP dependency 'google-forms-mcp' not installed

Pre-flight Status: READY (with warnings)

You can scaffold this scenario, but note:
- The google-forms-mcp will need manual configuration
- Generated hook will have placeholder for MCP calls

Ready to proceed?
  diet103 scenario scaffold client-intake --dry-run  (preview)
  diet103 scenario scaffold client-intake            (scaffold)"
```

### Metadata Tracking

The skill maintains scenario metadata in `~/.claude/config.json`:

```json
{
  "scenarios": {
    "available": {
      "client-intake": {
        "path": "~/.claude/scenarios/client-intake.yaml",
        "created": "2025-11-10T10:30:00Z",
        "description": "Client requirement gathering",
        "components": {
          "skills": ["client_intake"],
          "commands": ["/client-intake"],
          "hooks": []
        },
        "status": "not_scaffolded"
      }
    },
    "scaffolded": {
      "my-scenario": {
        "scaffolded_at": "2025-11-08T14:22:00Z",
        "generated_files": [...],
        "last_used": "2025-11-08T16:45:00Z"
      }
    }
  }
}
```

### Token Efficiency

Following PAI principles, the skill uses progressive disclosure:

- **Metadata Only**: ~300 tokens (always loaded)
- **Full Scenario**: ~500 tokens (on demand)
- **Scaffolding System**: 0 tokens (never auto-loaded)

The skill guides you to CLI commands but never auto-scaffolds. You always have explicit control.

### Safety Features

1. **No Auto-Scaffolding**: Never generates files without explicit command
2. **Validation First**: Always checks validity before suggesting scaffolding
3. **Metadata Consistency**: Tracks generated files and validates integrity
4. **Audit Trail**: Records timestamps and session IDs

### Configuration

The skill is configured in:

- **`.claude/skills/scenario_manager/`** - Skill documentation
- **`.claude/skill-rules.json`** - Auto-activation triggers
- **`.claude/config.json`** - Metadata storage

### Benefits Over CLI Alone

| Feature | CLI Only | With scenario_manager |
|---------|----------|----------------------|
| Discovery | Manual commands | Natural language queries |
| Status Tracking | File inspection | Rich metadata display |
| Validation | Explicit command | Proactive suggestions |
| Guidance | Help text | Interactive assistance |
| Context | None | Project-aware recommendations |

For full details, see: [`.claude/skills/scenario_manager/README.md`](../.claude/skills/scenario_manager/README.md)

---

## Related Documentation

- [Scenario Manager Skill](../.claude/skills/scenario_manager/README.md) - AI assistance for scenarios
- [Scenario YAML Schema](./SCENARIO_SCHEMA.md) - Complete YAML specification
- [diet103 CLI Guide](./CLI_GUIDE.md) - Main CLI documentation
- [MCP Integration](./MCP_INTEGRATION.md) - Working with MCPs
- [Partnership System](./PARTNERSHIP_SYSTEM.md) - AI partnership features

---

**Version**: 1.0.0  
**Last Updated**: November 10, 2025  
**Maintainers**: Orchestrator Project Team

