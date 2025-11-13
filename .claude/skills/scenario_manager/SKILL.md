# Scenario Manager Skill

**Version:** 2.0.0  
**Type:** Meta-Skill (Global Layer)  
**Token Footprint:** ~200-300 tokens (overview only)

---

## Overview

The Scenario Manager provides intelligent guidance and context-aware assistance for working with scenario definitions. It helps you discover, create, validate, and track scenarios without manually invoking CLI commands.

**What it does:**
- Discovers and lists available scenarios
- Guides scenario creation with templates
- Validates scenarios before scaffolding
- Tracks metadata in `config.json`
- Provides context-aware suggestions

**When to use it:**
- Creating new scenario workflows
- Checking scenario status
- Validating before scaffolding
- Managing scenario metadata

**Key Benefit:** Never auto-scaffolds—always guides you to explicit CLI commands for safety.

---

## Quick Start

### Most Common Tasks

#### 1. List Available Scenarios
```
"What scenarios do I have?"
"Show available scenarios"
```

#### 2. Create New Scenario
```
"Create a new scenario for [workflow name]"
"I want to create a scenario"
```

#### 3. Validate Before Scaffolding
```
"Can I scaffold the [scenario-name] scenario?"
"Validate [scenario-name]"
```

#### 4. Check Scenario Status
```
"Which scenarios are scaffolded?"
"Show scenario status"
```

### Auto-Activation Triggers

This skill automatically activates when you mention:
- **Creation:** "create scenario", "new scenario"
- **Discovery:** "list scenarios", "show scenarios", "what scenarios"
- **Validation:** "validate scenario", "check scenario"
- **Status:** "scenario status", "scaffolded scenarios"

---

## Available Resources

When you need more detail, request one of these resources:

### Quick Reference (`quick-ref`)
**Size:** < 100 lines | **Read Time:** 2 minutes

Command cheat sheet and trigger phrases. Perfect for quick syntax lookup.

**Contains:**
- Trigger phrase reference
- CLI command syntax
- Common workflows
- Metadata structure overview

**Request:** "Show me the scenario manager quick reference"

→ [View Quick Reference](resources/quick-ref.md)

---

### Architecture Guide (`architecture`)
**Size:** < 500 lines | **Read Time:** 10 minutes

Deep dive into progressive disclosure, integration points, and token efficiency.

**Contains:**
- Progressive disclosure strategy
- Config.json integration
- Scenario parser integration
- Scaffold workflow integration
- Token efficiency analysis

**Request:** "Show me the scenario manager architecture"

→ [View Architecture Guide](resources/architecture.md)

---

### Usage Examples (`examples`)
**Size:** < 500 lines | **Read Time:** 8 minutes

Real-world usage examples with expected responses.

**Contains:**
- Discovery workflows
- Creation guidance examples
- Validation scenarios
- Error handling examples
- Integration workflows

**Request:** "Show me scenario manager examples"

→ [View Usage Examples](resources/examples.md)

---

### Troubleshooting Guide (`troubleshooting`)
**Size:** < 500 lines | **Read Time:** 5 minutes

Common issues, error messages, and solutions.

**Contains:**
- Scenario not found errors
- Invalid YAML diagnostics
- Metadata sync issues
- Missing dependency warnings
- Repair procedures

**Request:** "Show me scenario manager troubleshooting"

→ [View Troubleshooting Guide](resources/troubleshooting.md)

---

## Navigation Quick Tips

**Loading Resources:**
- Natural language: "Show me the [resource name]"
- Specific: "Load scenario manager architecture"
- Direct: Click resource links above

**Progressive Detail:**
1. Start here (SKILL.md) for overview
2. Use Quick Reference for syntax lookup
3. Read Architecture for system design
4. Follow Examples for real-world usage
5. Check Troubleshooting when issues arise

---

## Core Capabilities

### 1. Scenario Discovery
- Lists all YAML files in `~/.claude/scenarios/`
- Shows scaffolded vs. available status
- Displays metadata and timestamps

### 2. Creation Guidance
- Walks through YAML structure
- Suggests templates for common patterns
- Provides real-time validation

### 3. Validation
- Pre-flight checks before scaffolding
- YAML syntax validation
- Dependency and logic validation

### 4. Metadata Tracking
- Tracks in `~/.claude/config.json`
- Records generated components
- Maintains audit trail

### 5. Context-Aware Suggestions
- Recommends next steps
- Warns about conflicts
- Guides through workflow

---

## Safety Features

**No Auto-Scaffolding:**
This skill NEVER generates files automatically. It always guides you to explicit CLI commands:

```bash
diet103 scenario scaffold [scenario-name]
```

**Validation First:**
Checks scenario validity before suggesting scaffolding to prevent errors.

**Audit Trail:**
Tracks all operations with timestamps and session IDs for reference.

---

## Metadata

**Version:** 2.0.0  
**Status:** Active  
**Last Updated:** 2025-11-11

**Structure Format:** diet103-progressive-disclosure v1.0

**Dependencies:**
- `~/.claude/config.json` - Metadata storage
- `~/.claude/scenarios/` - Scenario YAML directory
- `lib/utils/scenario-parser.js` - Validation logic

**Related Skills:**
- None (meta-skill, global layer)

**Maintainer:** Orchestrator Project

**Source:** `.claude/skills/scenario_manager/`

---

## Contributing

To contribute to this skill:
1. Follow the 500-line rule for all files
2. Maintain progressive disclosure structure
3. Update cross-references when adding content
4. Test auto-activation triggers
5. Validate with `tools/skill-migration/validate-structure.sh`

---

## License

Part of the Orchestrator Project. See project LICENSE.

---

**Navigation:** [Quick Ref](resources/quick-ref.md) | [Architecture](resources/architecture.md) | [Examples](resources/examples.md) | [Troubleshooting](resources/troubleshooting.md)
