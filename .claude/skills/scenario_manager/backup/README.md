# Scenario Manager Skill - README

## Quick Start

The `scenario_manager` skill provides intelligent, context-aware assistance for working with scenarios. It activates automatically when you mention scenarios and guides you through creation, validation, and scaffolding.

### Automatic Activation

The skill activates on these trigger phrases:

**Creation:**
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

### Example Usage

```
You: "What scenarios do I have?"

[scenario_manager activates]

Claude: "Available Scenarios:
• client-intake (not scaffolded)
  Description: Client requirement gathering
  Components: 3 skills, 2 commands, 1 hook
  
To scaffold: diet103 scenario scaffold client-intake"
```

## Features

### 1. **Scenario Discovery**
Automatically tracks and displays:
- Available scenarios (YAML files)
- Scaffolded scenarios (generated components)
- Status, timestamps, descriptions
- Component mappings

### 2. **Creation Guidance**
Helps you:
- Choose templates
- Define workflow steps
- Map to orchestrator primitives
- Validate before scaffolding

### 3. **Metadata Tracking**
Maintains in `~/.claude/config.json`:
- Available vs scaffolded status
- Generated file locations
- Creation/usage timestamps
- Session IDs for rollback

### 4. **Validation**
Pre-flight checks:
- YAML syntax
- Business logic (dependencies, circular refs)
- Component availability
- MCP server status

## Architecture

### Progressive Disclosure

The skill follows PAI principles:

1. **Metadata Always Loaded** (~300 tokens)
   - Scenario registry from config.json
   - Basic status and descriptions

2. **Details Loaded On-Demand** (~200+ tokens)
   - Full YAML content
   - Dependency graphs

3. **Scaffolding System Never Auto-Loaded** (0 tokens)
   - Full scaffold remains dormant
   - Only invoked via CLI command

### Token Overhead

- **Metadata-Only:** ~300 tokens
- **Full Scenario:** ~500 tokens
- **Scaffolding:** 0 tokens (never auto-loaded)

**Total Overhead:** ~300-500 tokens (acceptable for improved UX)

## Safety Features

### No Auto-Scaffolding
- Skill NEVER generates files automatically
- Always requires explicit `diet103 scenario scaffold` command
- User must confirm destructive operations

### Validation First
- Checks scenario validity before suggesting actions
- Warns about missing dependencies
- Flags potential issues

### Metadata Consistency
- Validates config.json on load
- Detects orphaned metadata
- Offers repair for inconsistencies

## File Structure

```
~/.claude/
├── config.json                    # Metadata storage
├── skill-rules.json              # Auto-activation triggers
├── skills/
│   └── scenario_manager/
│       ├── SKILL.md              # Full documentation
│       ├── metadata.json         # Skill metadata
│       └── README.md             # This file
├── scenarios/                    # YAML definitions
│   ├── client-intake.yaml
│   └── my-scenario.yaml
├── skills/                       # Generated skills
│   └── my_scenario/
├── commands/                     # Generated commands
│   └── my-scenario.md
└── hooks/                        # Generated hooks
    └── my_hook.js
```

## Metadata Structure

`~/.claude/config.json`:

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
        "status": "not_scaffolded",
        "validation": {
          "last_checked": "2025-11-10T15:00:00Z",
          "valid": true
        }
      }
    },
    "scaffolded": {
      "my-scenario": {
        "scaffolded_at": "2025-11-08T14:22:00Z",
        "generated_files": [
          "~/.claude/skills/my_scenario/SKILL.md",
          "~/.claude/commands/my-scenario.md"
        ],
        "last_used": "2025-11-08T16:45:00Z",
        "session_id": "session-123"
      }
    }
  },
  "statistics": {
    "total_scenarios": 2,
    "scaffolded_count": 1,
    "available_count": 1,
    "last_scaffolded": "2025-11-08T14:22:00Z"
  }
}
```

## CLI Integration

The skill guides you to these CLI commands:

### Create
```bash
diet103 scenario create                    # Interactive creation
diet103 scenario create --template basic   # From template
```

### Validate
```bash
diet103 scenario validate my-scenario      # Check validity
```

### Scaffold
```bash
diet103 scenario scaffold my-scenario      # Generate components
diet103 scenario scaffold my-scenario --dry-run  # Preview
```

### List
```bash
diet103 scenario list                      # Show all scenarios
diet103 scenario list --json              # JSON output
```

### Show
```bash
diet103 scenario show my-scenario          # Show details
diet103 scenario show my-scenario -v       # Verbose output
```

## Workflow Examples

### Creating a New Scenario

```
You: "I want to create a new scenario for client intake"

Claude: "I'll help you create a client intake scenario.

Options:
1. Start from template (recommended)
2. Build from scratch
3. Convert existing workflow

For client intake, I recommend the 'business_process' template.

Would you like me to guide you through defining the steps?"

You: "Yes, let's use the template"

Claude: "Great! Let's define your workflow steps...
[Interactive guidance through YAML creation]

Once complete:
  diet103 scenario validate client-intake   # Validate
  diet103 scenario scaffold client-intake   # Generate components"
```

### Checking Scenario Status

```
You: "Which scenarios are scaffolded?"

Claude: "Scaffolded Scenarios:

• my-scenario (scaffolded 5 days ago)
  Generated: my_scenario skill, /my-scenario command
  Last used: 2 days ago
  Location: ~/.claude/skills/my_scenario/

• test-scenario (scaffolded 10 days ago)
  Generated: test_scenario skill, /test command
  Last used: never
  Location: ~/.claude/skills/test_scenario/

Available (Not Scaffolded):
• client-intake (created 1 day ago)
  Ready to scaffold

To scaffold:
  diet103 scenario scaffold client-intake"
```

### Validating Before Scaffolding

```
You: "Is client-intake ready to scaffold?"

Claude: "Checking client-intake scenario...

✓ YAML syntax valid
✓ All required fields present
✓ No circular dependencies
✓ Step IDs unique
⚠ Warning: MCP 'google-forms-mcp' not installed

Status: READY (with warnings)

You can scaffold, but note:
- The MCP will need manual configuration
- Generated files will have placeholders

Ready to proceed?
  diet103 scenario scaffold client-intake --dry-run  # Preview
  diet103 scenario scaffold client-intake            # Scaffold"
```

## Troubleshooting

### Skill Not Activating

**Problem:** Skill doesn't activate when expected

**Solution:**
1. Check trigger phrases in `.claude/skill-rules.json`
2. Ensure phrase includes "scenario" keyword
3. Try more explicit phrases: "create a new scenario"

### Metadata Out of Sync

**Problem:** Metadata shows scaffolded but files missing

**Solution:**
```bash
# Re-sync filesystem
diet103 scenario list  # Triggers sync

# Or manually edit config.json to remove stale entries
```

### Config.json Missing

**Problem:** `~/.claude/config.json` doesn't exist

**Solution:**
```bash
# Create scenarios directory to initialize
mkdir -p ~/.claude/scenarios

# Trigger sync by listing scenarios
diet103 scenario list
```

## Performance

### Token Costs

| Operation | Tokens | Note |
|-----------|--------|------|
| List scenarios | ~300 | Metadata only |
| Show scenario | ~500 | Full YAML |
| Validate | ~500 | Full validation |
| Create guidance | ~500 | Interactive prompts |

### Optimization Tips

1. **Use CLI directly** if you know the command
2. **Metadata stays cached** across Claude sessions
3. **Validation results cached** until YAML changes
4. **Full scaffold system never loaded** unless explicitly invoked

## Integration Points

### With Other Skills

The `scenario_manager` can work alongside:

- **project_orchestrator** - For project-level coordination
- **skill_analyzer** - For analyzing generated skills
- **dependency_manager** - For checking MCP availability

### With CLI Commands

Seamlessly integrates with all `diet103 scenario` commands:
- Guides users to correct CLI syntax
- Shows available options
- Provides context-aware suggestions

### With Scaffold Workflow

After successful scaffolding:
- Automatically updates metadata
- Records generated files
- Tracks session ID for rollback

## Maintenance

### Adding New Trigger Phrases

Edit `.claude/skill-rules.json`:

```json
{
  "rules": [{
    "trigger_phrases": ["new phrase here"],
    "skill": "scenario_manager",
    "auto_activate": true
  }]
}
```

### Cleaning Stale Metadata

```bash
# Check for inconsistencies
node -e "import('./lib/utils/scenario-metadata.js').then(m => m.validateMetadataConsistency().then(console.log))"

# Remove scenario metadata
node -e "import('./lib/utils/scenario-metadata.js').then(m => m.removeScenarioMetadata('old-scenario').then(console.log))"
```

## Future Enhancements

Potential additions (not yet implemented):
- Scenario versioning (git integration)
- Dependency graph visualization
- Template marketplace
- Cross-scenario analysis
- Team collaboration features

---

**Version:** 1.0.0  
**Created:** 2025-11-10  
**Token Footprint:** ~300-500 tokens  
**Architecture:** PAI + diet103 auto-activation

