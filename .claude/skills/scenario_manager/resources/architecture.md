# Scenario Manager - Architecture Guide

← [Back to Overview](../SKILL.md)

---

## Overview

The Scenario Manager follows PAI Skills-as-Containers architecture with diet103 auto-activation. This guide explains the technical design, integration points, and token efficiency strategy.

---

## Progressive Disclosure Strategy

Following PAI principles, this skill uses three disclosure levels:

### Level 1: Metadata Only (~200-300 tokens)
**Always Loaded:**
- Scenario registry from `config.json`
- Available vs. scaffolded status
- Basic descriptions
- Component counts

**When:** Skill auto-activates

**Token Cost:** ~200-300 tokens

---

### Level 2: Full Scenario Details (~500 tokens)
**Loaded On-Demand:**
- Complete YAML parsing
- Component specifications
- Dependency graphs
- Validation results

**When:** User requests specific scenario details

**Token Cost:** +200-300 tokens per scenario

---

### Level 3: Scaffolding System (0 tokens)
**Never Auto-Loaded:**
- Full scaffold implementation remains dormant
- Only invoked via explicit CLI command
- Skill guides *to* scaffold, never runs it

**When:** User explicitly runs `diet103 scenario scaffold`

**Token Cost:** 0 tokens (not loaded)

---

## Config.json Integration

### Metadata Schema

The skill reads/writes to `~/.claude/config.json`:

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

### Metadata Operations

**Read Operations:**
- Load scenario registry on activation
- Check scaffolding status
- Retrieve validation results

**Write Operations:**
- Update after scenario creation
- Record scaffolding completion
- Track last used timestamp

**Validation:**
- Detect orphaned metadata
- Check file existence
- Verify JSON schema

---

## Scenario Parser Integration

Uses `lib/utils/scenario-parser.js` for YAML operations:

### Core Functions

#### `parseScenarioFile(filepath)`
**Purpose:** Parse and validate YAML syntax

**Returns:**
```javascript
{
  success: boolean,
  scenario: object,  // Parsed YAML
  errors: string[]   // Validation errors
}
```

---

#### `extractScenarioMetadata(scenario)`
**Purpose:** Extract metadata from parsed scenario

**Returns:**
```javascript
{
  name: string,
  description: string,
  components: {
    skills: string[],
    commands: string[],
    hooks: string[]
  }
}
```

---

#### `getGenerationTargets(scenario)`
**Purpose:** Identify what will be generated

**Returns:**
```javascript
{
  skills: [{ name, path }],
  commands: [{ name, path }],
  hooks: [{ name, path }]
}
```

---

### Validation Pipeline

```
1. YAML Syntax Check
   ↓
2. Schema Validation
   ↓
3. Business Logic Validation
   ├─ Required fields present
   ├─ Step dependencies valid
   ├─ No circular references
   └─ Component availability
   ↓
4. Warning Detection
   ├─ Missing MCP dependencies
   ├─ Deprecated features
   └─ Performance concerns
   ↓
5. Result Summary
```

---

## Scaffold Workflow Integration

The skill integrates with the scaffolding system without loading it:

### Pre-Scaffolding

**Skill Actions:**
1. Validate scenario
2. Check dependencies
3. Preview generation targets
4. Guide user to CLI command

**Output:**
```bash
diet103 scenario scaffold <name> --dry-run  # Preview
diet103 scenario scaffold <name>             # Execute
```

---

### Post-Scaffolding

**Metadata Updates:**
1. Move scenario from `available` to `scaffolded`
2. Record generated files
3. Store session ID
4. Update last used timestamp

**File Tracking:**
```json
{
  "generated_files": [
    "~/.claude/skills/scenario_name/SKILL.md",
    "~/.claude/commands/scenario-command.md",
    "~/.claude/hooks/scenario_hook.js"
  ]
}
```

---

## CLI Command Integration

The skill provides guidance to these CLI commands:

| Command | Skill Guidance |
|---------|----------------|
| `diet103 scenario create` | Template suggestions, YAML structure |
| `diet103 scenario validate` | Pre-flight checks, error details |
| `diet103 scenario scaffold` | Readiness status, warnings |
| `diet103 scenario list` | Registry display, status indicators |

---

## Token Efficiency Analysis

### Typical Session Costs

**Scenario Discovery:**
```
User: "What scenarios do I have?"
Token Cost: ~250 tokens (metadata only)
```

**Scenario Validation:**
```
User: "Can I scaffold client-intake?"
Token Cost: ~400 tokens (metadata + validation)
```

**Scenario Creation Guidance:**
```
User: "Create scenario for client intake"
Token Cost: ~300 tokens (metadata + templates)
```

---

### Cost Comparison

| Approach | Token Cost | Notes |
|----------|------------|-------|
| Load everything | ~2000 tokens | All scenarios + scaffold system |
| Progressive (this) | ~300 tokens | Metadata only, on-demand details |
| Manual CLI only | 0 tokens | No guidance, poor UX |

**Savings:** 85% token reduction vs. loading everything

---

## Auto-Activation Mechanism

### Trigger Detection

The skill uses pattern matching in `UserPromptSubmit` hook:

```javascript
const triggers = [
  /create\s+scenario/i,
  /new\s+scenario/i,
  /list\s+scenarios?/i,
  /show\s+scenarios?/i,
  /what\s+scenarios?/i,
  /validate\s+scenario/i,
  /check\s+scenario/i,
  /scaffold\s+scenario/i,
  /scenario\s+status/i
];
```

**Match Logic:**
- Case-insensitive
- Partial phrase matching
- Context-aware (checks surrounding words)

---

### Activation Flow

```
User Message
    ↓
UserPromptSubmit Hook
    ↓
Pattern Matching
    ↓
[Match Found?]
    ↓ Yes
Load Metadata (~300 tokens)
    ↓
Execute Skill Logic
    ↓
Generate Response
```

---

## Safety Mechanisms

### 1. No Auto-Scaffolding

**Implementation:**
- Scaffold code never loaded
- No file generation logic in skill
- Always outputs CLI command string

**Verification:**
```bash
# Skill NEVER does this:
fs.writeFileSync(...)

# Skill ALWAYS does this:
console.log("Run: diet103 scenario scaffold <name>")
```

---

### 2. Validation Before Guidance

**Pre-Flight Checks:**
- ✓ YAML syntax valid
- ✓ Required fields present
- ✓ Dependencies resolvable
- ✓ No circular references
- ⚠ Warn on missing MCPs

**Only suggest scaffolding if:** validation passes or has warnings only (no errors)

---

### 3. Metadata Consistency

**On Load:**
- Validate config.json structure
- Check for orphaned entries
- Verify file existence

**Repair Options:**
- Re-scaffold missing files
- Update metadata status
- Remove invalid entries

---

### 4. Audit Trail

**Tracked Information:**
- Scaffolding timestamp
- Session ID
- Generated files list
- Last used timestamp

**Use Cases:**
- Rollback reference
- Usage analytics
- Cleanup detection

---

## Performance Considerations

### Lazy Loading Strategy

**What's Loaded:**
- Scenario names (always)
- Descriptions (always)
- Status flags (always)

**What's Deferred:**
- Full YAML content (on-demand)
- Validation results (cached)
- Dependency graphs (on-demand)

---

### Caching

**Metadata Cache:**
- Lifetime: Session duration
- Invalidation: On scaffold completion
- Size: ~2KB per scenario

**Validation Cache:**
- Lifetime: Until YAML modified
- Key: File path + mtime
- Reduces redundant parsing

---

## Error Handling Architecture

### Error Categories

**Syntax Errors:**
- Invalid YAML
- Missing required fields
- Type mismatches

**Logic Errors:**
- Circular dependencies
- Invalid references
- Component conflicts

**System Errors:**
- File not found
- Permission denied
- Config.json corrupt

---

### Recovery Strategies

| Error Type | Recovery |
|------------|----------|
| Syntax | Show line number, suggest fix |
| Logic | Explain issue, offer repair |
| System | Check permissions, verify paths |

---

## Extension Points

### Adding Trigger Phrases

Edit `.claude/skill-rules.json`:

```json
{
  "rules": [{
    "trigger_phrases": ["new trigger"],
    "skill": "scenario_manager",
    "auto_activate": true
  }]
}
```

---

### Custom Validators

Add to `scenario-parser.js`:

```javascript
function customValidator(scenario) {
  // Custom validation logic
  return { valid: true, warnings: [] };
}
```

---

## Testing & Maintenance

**Unit Tests:** Metadata parsing, trigger matching, validation  
**Integration Tests:** Config read/write, parser calls, CLI generation  
**E2E Tests:** Natural language activation, workflows, feedback  

**Schema Updates:** Update parsing → migration → validation → test  
**Metrics:** Token cost, cache hit rate, load time  

---

## Related Resources

- [Quick Reference](quick-ref.md) - Commands and syntax
- [Examples](examples.md) - Usage patterns
- [Troubleshooting](troubleshooting.md) - Common issues

