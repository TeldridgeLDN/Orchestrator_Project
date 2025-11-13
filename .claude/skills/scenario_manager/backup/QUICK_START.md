# Scenario Manager - Quick Start Guide

**Get started with intelligent scenario assistance in 5 minutes.**

---

## What Is This?

The `scenario_manager` skill makes working with scenarios feel natural. Instead of remembering CLI commands, just talk to Claude about scenarios and the skill automatically helps you.

---

## Installation

Already installed! The skill is part of your orchestrator setup. No additional steps needed.

---

## How to Use

### Just Ask Naturally

```
You: "What scenarios do I have?"
You: "Create a new scenario for client intake"
You: "Is my scenario ready to scaffold?"
```

That's it! The skill activates automatically when you mention scenarios.

---

## Common Phrases That Activate the Skill

### Discovery
- "What scenarios do I have?"
- "Show me my scenarios"
- "List available scenarios"
- "Which scenarios are scaffolded?"

### Creation
- "Create a new scenario"
- "I want to make a scenario for..."
- "Build a scenario"

### Validation
- "Is this scenario valid?"
- "Check my scenario"
- "Validate client-intake"

### Status
- "Scenario status"
- "Show scenario info"
- "What's scaffolded?"

---

## Example Workflows

### 1. Discovering Your Scenarios

```
You: "What scenarios do I have?"

Claude: "Available Scenarios (Not Scaffolded):
• client-intake (created 2 days ago)
  Components: 3 skills, 2 commands, 1 hook
  
Scaffolded Scenarios:
• my-scenario (scaffolded 5 days ago)
  Last used: 2 days ago
  
To scaffold: diet103 scenario scaffold client-intake"
```

**What Just Happened:**
- Skill activated automatically
- Loaded metadata from config.json
- Showed you available vs scaffolded status
- Suggested next steps

---

### 2. Creating a New Scenario

```
You: "I want to create a scenario for client intake"

Claude: "I'll help you create a client intake scenario.

Options:
1. Start from template (recommended)
2. Build from scratch

For client intake, I recommend 'business_process' template.

To create:
  diet103 scenario create --template business_process

Would you like me to help define the steps?"

You: "Yes, use the template"

Claude: [Guides you through customization]
```

**What Just Happened:**
- Skill activated on "create a scenario"
- Analyzed your intent (client intake)
- Suggested appropriate template
- Offered to guide through setup

---

### 3. Checking If Ready to Scaffold

```
You: "Can I scaffold client-intake?"

Claude: "Checking client-intake scenario...

✓ YAML syntax valid
✓ All required fields present
✓ No circular dependencies
⚠ Warning: MCP 'google-forms-mcp' not installed

Status: READY (with warnings)

You can scaffold, but note the MCP will need configuration.

Commands:
  diet103 scenario scaffold client-intake --dry-run  (preview)
  diet103 scenario scaffold client-intake            (scaffold)"
```

**What Just Happened:**
- Skill ran validation automatically
- Checked YAML syntax and structure
- Identified missing MCP
- Gave clear guidance on next steps

---

## What the Skill DOESN'T Do

### ❌ Auto-Scaffold
The skill **NEVER** generates files automatically. You always need to run the `diet103 scenario scaffold` command explicitly.

### ❌ Modify Files
The skill only reads and displays information. It never modifies your scenario YAML files.

### ❌ Make Decisions
You're always in control. The skill provides suggestions, not actions.

---

## What the Skill DOES Do

### ✅ Metadata Tracking
Maintains scenario status in `~/.claude/config.json`:
- Available vs scaffolded
- Creation timestamps
- Last used dates
- Generated files

### ✅ Context-Aware Suggestions
Provides relevant next steps based on:
- Current scenario state
- Validation results
- Your workflow

### ✅ Rich Information Display
Shows more than CLI alone:
- Descriptions
- Component counts
- Status indicators
- Timestamps
- File locations

---

## Behind the Scenes

### What Happens When You Ask About Scenarios

```
1. You: "What scenarios do I have?"
   
2. Trigger Detection
   - Phrase matches "what scenarios"
   - scenario_manager skill activates
   
3. Load Metadata (~300 tokens)
   - Reads ~/.claude/config.json
   - Gets available/scaffolded lists
   
4. Format Response
   - Presents rich metadata
   - Shows contextual commands
   
5. Claude Responds
   - Natural language output
   - Actionable next steps
```

**Token Cost:** ~300 for metadata, ~500 if loading full scenario

---

## Configuration Files

### Where Things Live

```
~/.claude/
├── config.json              # Metadata storage (created automatically)
├── skill-rules.json         # Activation triggers
├── skills/
│   └── scenario_manager/    # This skill
├── scenarios/               # Your scenario YAML files
├── skills/                  # Generated skills (after scaffold)
├── commands/                # Generated commands (after scaffold)
└── hooks/                   # Generated hooks (after scaffold)
```

### Metadata Structure (config.json)

```json
{
  "scenarios": {
    "available": {
      "scenario-name": {
        "description": "...",
        "status": "not_scaffolded",
        "created": "2025-11-10T10:30:00Z"
      }
    },
    "scaffolded": {
      "scenario-name": {
        "scaffolded_at": "2025-11-08T14:22:00Z",
        "last_used": "2025-11-08T16:45:00Z",
        "generated_files": [...]
      }
    }
  }
}
```

---

## Troubleshooting

### Skill Not Activating

**Problem:** Claude responds generically without scenario context

**Solution:**
1. Use more explicit phrases: "create a new scenario" instead of "create something"
2. Include the word "scenario" in your query
3. Check `.claude/skill-rules.json` exists

### Metadata Out of Sync

**Problem:** Skill shows scenario as not scaffolded, but files exist

**Solution:**
```bash
# Re-sync filesystem to metadata
diet103 scenario list  # Triggers automatic sync
```

### Config.json Missing

**Problem:** Skill can't find config.json

**Solution:**
```bash
# Create scenarios directory
mkdir -p ~/.claude/scenarios

# Trigger initialization
diet103 scenario list
```

---

## Tips & Best Practices

### 1. Natural Language Works Best
```
✅ Good: "What scenarios do I have?"
✅ Good: "Create a scenario for client intake"
❌ Less Good: "scenarios"
❌ Less Good: "show"
```

### 2. Be Specific for Better Context
```
✅ Good: "Is client-intake ready to scaffold?"
✅ Good: "Show me the my-scenario status"
❌ Less Good: "Is it ready?"
❌ Less Good: "Show status"
```

### 3. Let the Skill Guide You
The skill provides next steps - follow them!

```
Claude: "To scaffold: diet103 scenario scaffold client-intake"
You: [Copy/paste the command]
```

### 4. Check Status Often
Before scaffolding, ask:
```
"Can I scaffold client-intake?"
"Is this scenario valid?"
"Check scenario status"
```

---

## Advanced Usage

### Query Multiple Scenarios

```
You: "Show me details for client-intake and my-scenario"

Claude: [Displays both scenarios with full metadata]
```

### Check Recent Activity

```
You: "Which scenarios have I used recently?"

Claude: "Recently Used:
• my-scenario (2 days ago)
• test-scenario (5 days ago)

Not Used Recently:
• old-scenario (30 days ago)"
```

### Validate Before Scaffolding

```
You: "Validate all my scenarios"

Claude: [Runs validation on all YAML files]
[Shows any issues found]
```

---

## Token Costs (For Reference)

| Query Type | Token Cost | Example |
|------------|-----------|---------|
| List scenarios | ~1400 | "What scenarios do I have?" |
| Show scenario | ~1600 | "Show client-intake details" |
| Validate | ~1600 | "Is this valid?" |
| Status check | ~1400 | "Scenario status" |

**For Comparison:**
- CLI-only queries: ~1100 tokens
- With scenario_manager: ~1400-1600 tokens
- **Overhead:** +300-500 tokens (+27-45%)

**Worth it for:**
- Frequent scenario work
- Team collaboration
- Projects with 5+ scenarios

---

## Next Steps

### Learn More
- [Full Documentation](./SKILL.md) - Complete skill reference
- [CLI Commands](../../../Docs/SCENARIO_CLI.md) - All scenario commands
- [Architecture](../../../Docs/Orchestrator_PRD.md) - System design

### Try These Commands
```bash
# List all scenarios
diet103 scenario list

# Create new scenario
diet103 scenario create

# Validate scenario
diet103 scenario validate <name>

# Scaffold scenario
diet103 scenario scaffold <name>
```

### Get Help
```bash
# Command help
diet103 scenario --help

# Specific command help
diet103 scenario <command> --help
```

---

## Summary

**What You Learned:**
- ✅ Skill activates automatically on trigger phrases
- ✅ Tracks metadata in config.json
- ✅ Provides context-aware guidance
- ✅ Never auto-scaffolds (you're in control)
- ✅ Adds ~300-500 tokens per query
- ✅ Makes scenario work feel natural

**Ready to Use!** Just start asking about scenarios in natural language.

---

**Version:** 1.0.0  
**Last Updated:** November 10, 2025  
**Need Help?** See [README.md](./README.md) or [SKILL.md](./SKILL.md)

