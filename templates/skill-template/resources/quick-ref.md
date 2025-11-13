# [Skill Name] - Quick Reference

<!-- 
TEMPLATE INSTRUCTIONS:
- Keep this file under 100 lines (hard limit)
- Dense, scannable format (tables, lists)
- No lengthy explanations - just facts
- Perfect for experienced users
- Delete these comment blocks when done
-->

← [Back to Overview](../SKILL.md)

---

## Common Commands

| Command | Purpose | Syntax | Example |
|---------|---------|--------|---------|
| `[command1]` | [Brief purpose] | `[command1] [args]` | `[command1] --flag value` |
| `[command2]` | [Brief purpose] | `[command2] [args]` | `[command2] input.txt` |
| `[command3]` | [Brief purpose] | `[command3] [args]` | `[command3] -v` |
| `[command4]` | [Brief purpose] | `[command4] [args]` | `[command4] target` |

---

## Parameters & Options

### Global Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--config` | string | `./config.json` | Configuration file path |
| `--verbose` | boolean | `false` | Enable debug output |
| `--output` | string | `stdout` | Output destination |
| `--format` | string | `text` | Output format (text/json/yaml) |

### Command-Specific Parameters
```
[command1] [options]
  --option1 <value>    [Description]
  --option2 <value>    [Description]
  
[command2] [options]
  --option1 <value>    [Description]
  --option2 <value>    [Description]
```

---

## Return Values

| Value | Type | Meaning |
|-------|------|---------|
| `0` | Exit Code | Success |
| `1` | Exit Code | General error |
| `2` | Exit Code | Invalid input |
| `127` | Exit Code | Command not found |

---

## Common Patterns

### Pattern 1: [Pattern Name]
```bash
[command] [typical-args]
```

### Pattern 2: [Pattern Name]
```bash
[command] [typical-args] | [command2]
```

### Pattern 3: [Pattern Name]
```bash
[command] --flag1 --flag2 [input]
```

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `[VAR1]` | `[value]` | [Purpose] |
| `[VAR2]` | `[value]` | [Purpose] |

---

## Quick Troubleshooting

| Symptom | Quick Fix |
|---------|-----------|
| [Error message] | [One-line solution] |
| [Problem] | [One-line solution] |

---

**See Also:** [Setup Guide](setup-guide.md) · [API Reference](api-reference.md) · [Troubleshooting](troubleshooting.md)

