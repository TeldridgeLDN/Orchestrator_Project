# Scenario Manager Skill

**Version:** 1.0.0  
**Type:** Meta-Skill (Global Layer)  
**Auto-Generated:** No  
**Token Footprint:** ~300-500 tokens

---

## Purpose

The Scenario Manager provides intelligent guidance and context-aware assistance for working with scenario definitions. It helps users discover, create, validate, and track scenarios without manually invoking CLI commands.

**Key Distinction:** This skill provides *guidance and metadata*, not automatic scaffolding. It helps users understand and manage scenarios, but always requires explicit confirmation before generating files.

---

## Capabilities

### 1. **Scenario Discovery**
- List all available scenarios (YAML files in `~/.claude/scenarios/`)
- Show which scenarios are scaffolded vs. available
- Display scenario metadata (description, components, status)
- Track last usage and modification dates

### 2. **Scenario Creation Guidance**
- Guide users through YAML structure
- Suggest templates based on requirements
- Provide real-time validation feedback
- Help map workflows to orchestrator primitives

### 3. **Scenario Validation**
- Pre-flight checks before scaffolding
- YAML syntax validation
- Business logic validation (dependencies, circular refs)
- Component availability checks

### 4. **Metadata Tracking**
- Track scaffolding status in `~/.claude/config.json`
- Record generated components (skills, commands, hooks)
- Maintain timestamps (created, scaffolded, last used)
- Provide audit trail

### 5. **Context-Aware Suggestions**
- Recommend next steps based on current state
- Suggest related scenarios
- Warn about potential conflicts
- Guide through scaffolding process

---

## Architecture

### Progressive Disclosure

Following PAI principles, this skill uses progressive disclosure:

1. **Metadata Always Loaded** (~300 tokens)
   - Scenario registry from `config.json`
   - Available vs. scaffolded status
   - Basic descriptions

2. **Details Loaded On-Demand** (~200+ tokens per scenario)
   - Full YAML content
   - Component specifications
   - Dependency graphs

3. **Scaffolding System Never Auto-Loaded** (0 tokens)
   - Full scaffold system remains dormant
   - Only invoked via explicit CLI command
   - This skill *guides to* scaffold, never runs it

---

## Auto-Activation Triggers

This skill auto-activates on these trigger phrases:

### Creation/Scaffolding
- "create scenario"
- "new scenario"
- "scaffold scenario"
- "generate from scenario"

### Discovery/Listing
- "list scenarios"
- "show scenarios"
- "what scenarios"
- "available scenarios"

### Validation
- "validate scenario"
- "check scenario"
- "verify scenario"

### Status/Info
- "scenario status"
- "scaffolded scenarios"
- "scenario info"

---

## Usage Examples

### Example 1: Discovery

**User:** "What scenarios do I have?"

**Skill Activates:** Yes (matches "what scenarios")

**Response:**
```
Available Scenarios (Not Scaffolded):
• client-intake (created 2 days ago)
  Description: Client requirement gathering workflow
  Components: 3 skills, 2 commands, 1 hook
  
Scaffolded Scenarios (Active):
• my-scenario (scaffolded 5 days ago)
  Generated: my_scenario skill, /my-scenario command
  Location: ~/.claude/skills/my_scenario/
  Last used: 2 days ago

To scaffold an available scenario:
  diet103 scenario scaffold client-intake
```

### Example 2: Creation Guidance

**User:** "I want to create a new scenario for client intake"

**Skill Activates:** Yes (matches "create" + "scenario")

**Response:**
```
I'll help you create a client intake scenario.

Options:
1. Start from template (recommended for common patterns)
2. Build from scratch (full control)
3. Convert existing workflow (import from documentation)

For client intake, I recommend starting with the "business_process" template.

Would you like me to guide you through:
- Defining the steps (form → notification → processing)
- Mapping to components (skills, commands, hooks)
- Creating the YAML structure
```

### Example 3: Validation Before Scaffolding

**User:** "Can I scaffold the client-intake scenario?"

**Skill Activates:** Yes (matches "scaffold scenario")

**Response:**
```
Checking client-intake scenario readiness...

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
  diet103 scenario scaffold client-intake            (scaffold)
```

### Example 4: Informational Query (No Activation)

**User:** "Tell me about the scenario system"

**Skill Activates:** No (doesn't match trigger phrases)

**Response:**
```
The scenario system allows you to define reusable workflows...
[Standard explanation without skill activation]
```

---

## Integration Points

### 1. Config.json Metadata

Reads/writes to `~/.claude/config.json`:

```json
{
  "version": "1.0.0",
  "scenarios": {
    "available": {
      "client-intake": {
        "path": "~/.claude/scenarios/client-intake.yaml",
        "created": "2025-11-10T10:30:00Z",
        "modified": "2025-11-10T14:22:00Z",
        "description": "Client requirement gathering",
        "components": {
          "skills": ["client_intake"],
          "commands": ["/client-intake"],
          "hooks": ["client_intake_hook"]
        },
        "status": "not_scaffolded",
        "validation": {
          "last_checked": "2025-11-10T15:00:00Z",
          "valid": true,
          "warnings": ["google-forms-mcp not installed"]
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
        "session_id": "session-1762774404248"
      }
    }
  }
}
```

### 2. Scenario Parser Integration

Uses existing `lib/utils/scenario-parser.js` for validation:
- `parseScenarioFile()` - Parse and validate YAML
- `extractScenarioMetadata()` - Get metadata
- `getGenerationTargets()` - Identify components

### 3. Scaffold Workflow Integration

Updates metadata after successful scaffolding:
- Moves scenario from `available` to `scaffolded`
- Records generated files
- Stores session ID for rollback reference

### 4. CLI Command Integration

Provides guidance to CLI commands:
- `diet103 scenario create` - Create new scenario
- `diet103 scenario validate` - Validate scenario
- `diet103 scenario scaffold` - Scaffold scenario
- `diet103 scenario list` - List scenarios

---

## Token Efficiency

### Metadata-Only Mode (~300 tokens)
- Scenario registry (names, status, descriptions)
- Component counts
- Timestamps

### Full Scenario Mode (~500 tokens)
- Complete YAML parsing
- Dependency analysis
- Validation results

### Scaffolding System (0 tokens)
- Never auto-loaded
- Skill guides *to* scaffold command
- User must explicitly run CLI

**Total Overhead:** ~300-500 tokens (acceptable for improved UX)

---

## Safety Features

### 1. **No Auto-Scaffolding**
- Skill NEVER generates files automatically
- Always requires explicit `diet103 scenario scaffold` command
- User must confirm destructive operations

### 2. **Validation Before Guidance**
- Checks scenario validity before suggesting scaffolding
- Warns about missing dependencies
- Flags potential issues

### 3. **Metadata Consistency**
- Validates config.json on load
- Detects orphaned metadata
- Offers repair for inconsistencies

### 4. **Audit Trail**
- Tracks all scaffolding operations
- Records timestamps and session IDs
- Enables rollback reference

---

## Error Handling

### Scenario Not Found
```
Scenario 'unknown-scenario' not found.

Available scenarios:
- client-intake
- my-scenario
- test-scenario

To create a new scenario:
  diet103 scenario create unknown-scenario
```

### Invalid YAML
```
Scenario 'client-intake' has validation errors:

✗ Missing required field: scenario.name
✗ Invalid step dependency: step_3 depends on non-existent step_2
✗ Circular dependency detected: step_1 → step_2 → step_1

Fix these issues before scaffolding.
```

### Metadata Out of Sync
```
Warning: Metadata inconsistency detected

Scenario 'my-scenario' is marked as scaffolded, but generated files not found:
- Expected: ~/.claude/skills/my_scenario/SKILL.md (missing)
- Expected: ~/.claude/commands/my-scenario.md (missing)

Repair options:
1. Re-scaffold the scenario
2. Update metadata to mark as not_scaffolded
3. Remove from registry

Would you like me to repair this?
```

---

## Dependencies

### Required
- `~/.claude/config.json` - Metadata storage
- `~/.claude/scenarios/` - Scenario YAML directory
- `lib/utils/scenario-parser.js` - Validation

### Optional
- `lib/utils/scenario-directory.js` - Directory management
- `lib/utils/scaffold-workflow.js` - Integration point (not loaded)

---

## Maintenance

### Adding New Trigger Phrases

Edit `.claude/skill-rules.json`:

```json
{
  "rules": [
    {
      "trigger_phrases": ["new phrase", "another trigger"],
      "skill": "scenario_manager",
      "auto_activate": true
    }
  ]
}
```

### Updating Metadata Schema

If `config.json` schema changes:
1. Update integration logic in this skill
2. Add migration helper
3. Update validation checks
4. Test with existing scenarios

---

## Future Enhancements

### Potential Additions (Not Implemented)
- Scenario templates marketplace
- Scenario versioning (git integration)
- Scenario dependency graph visualization
- Cross-scenario analysis
- Team collaboration features
- Remote scenario registry

---

## Testing

### Unit Tests
- Metadata reading/writing
- Trigger phrase matching
- Validation logic
- Error handling

### Integration Tests
- End-to-end scenario creation flow
- Scaffolding integration
- Metadata consistency checks

### User Acceptance Tests
- Natural language activation
- Discovery workflows
- Creation guidance
- Validation feedback

---

**Generated:** 2025-11-10  
**Status:** Active  
**Architecture:** PAI Skills-as-Containers + diet103 auto-activation  
**Token Footprint:** ~300-500 tokens (metadata only)

