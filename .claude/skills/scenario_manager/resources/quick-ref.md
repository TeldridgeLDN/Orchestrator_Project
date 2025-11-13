# Scenario Manager - Quick Reference

← [Back to Overview](../SKILL.md)

---

## Trigger Phrases

| Category | Phrases |
|----------|---------|
| **Creation** | "create scenario", "new scenario", "scaffold scenario" |
| **Discovery** | "list scenarios", "show scenarios", "what scenarios", "available scenarios" |
| **Validation** | "validate scenario", "check scenario", "verify scenario" |
| **Status** | "scenario status", "scaffolded scenarios", "scenario info" |

---

## CLI Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `diet103 scenario create <name>` | Create new scenario | `diet103 scenario create client-intake` |
| `diet103 scenario list` | List all scenarios | `diet103 scenario list` |
| `diet103 scenario validate <name>` | Validate scenario | `diet103 scenario validate client-intake` |
| `diet103 scenario scaffold <name>` | Scaffold scenario | `diet103 scenario scaffold client-intake` |
| `diet103 scenario scaffold <name> --dry-run` | Preview scaffold | `diet103 scenario scaffold client-intake --dry-run` |

---

## Common Workflows

### Discovery
```
User: "What scenarios do I have?"
→ Skill lists available + scaffolded scenarios
```

### Creation
```
User: "Create scenario for client intake"
→ Skill guides through template selection
→ User creates YAML manually or with guidance
→ Skill validates structure
```

### Scaffolding
```
User: "Can I scaffold client-intake?"
→ Skill runs validation
→ Shows pre-flight status
→ Guides to: diet103 scenario scaffold client-intake
```

---

## Metadata Structure

### Config.json Schema

```json
{
  "scenarios": {
    "available": {
      "<name>": {
        "path": "~/.claude/scenarios/<name>.yaml",
        "status": "not_scaffolded",
        "components": { "skills": [], "commands": [], "hooks": [] }
      }
    },
    "scaffolded": {
      "<name>": {
        "scaffolded_at": "ISO8601",
        "generated_files": ["path1", "path2"],
        "last_used": "ISO8601"
      }
    }
  }
}
```

---

## Status & Integration

| Status | Meaning | Component | Purpose |
|--------|---------|-----------|---------|
| `not_scaffolded` | YAML exists, not generated | `config.json` | Metadata storage |
| `scaffolded` | Files generated, active | `scenario-parser.js` | YAML validation |
| `invalid` | YAML has errors | `scenarios/` | YAML storage |

---

**See Also:** [Architecture](architecture.md) · [Examples](examples.md) · [Troubleshooting](troubleshooting.md)

