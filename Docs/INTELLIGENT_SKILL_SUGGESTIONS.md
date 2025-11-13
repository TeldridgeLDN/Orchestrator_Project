# Intelligent Skill Suggestions

## Overview

The Orchestrator system includes an intelligent skill suggestion feature that proactively recommends relevant skills based on your current context. Instead of manually searching for skills, the system analyzes your work and suggests skills that might help.

## How It Works

The suggestion system monitors several context signals:

### 1. **File Context**
When you have files open, the system checks if any skills are relevant to those file types:

```
You have: src/components/Button.tsx open
Suggestion: 💡 React Component Analyzer skill available - Deep analysis of React components
```

### 2. **Prompt Keywords**
The system analyzes your natural language prompts for keywords:

```
Your prompt: "I need to validate my API documentation"
Suggestion: 💡 Documentation Validator skill available - Check docs for quality issues
```

### 3. **Directory Patterns**
Your current working directory can trigger suggestions:

```
Current directory: ~/project/tests/
Suggestion: 💡 Test Runner skill available - Run tests with smart framework detection
```

### 4. **Project Type**
The type of project you're working on influences suggestions:

```
Project type: web
Suggestion: 💡 SEO Analyzer skill available - Check SEO best practices
```

## Features

### Smart Throttling
- Each skill is suggested at most once every 5 minutes
- Prevents "suggestion fatigue" from repeated notifications
- Resets when switching projects

### Ranked by Relevance
- Skills are ranked by match score
- File pattern matches = 3 points
- Keyword matches = 2 points
- Directory matches = 2 points
- Project type matches = 1 point

### Maximum 2 Suggestions
- Only the top 2 most relevant skills are shown at once
- Keeps the interface clean and focused
- Highest-scoring skills appear first

### Already-Active Skills Excluded
- Skills currently loaded in your context are not suggested
- Auto-activated skills are not suggested (they load automatically)

## Configuration

Skill suggestions can be configured globally in `~/.claude/config.json`:

```json
{
  "skill_suggestions": {
    "enabled": true,
    "throttle_minutes": 5,
    "max_suggestions": 2
  }
}
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | `true` | Enable/disable suggestions globally |
| `throttle_minutes` | `5` | Minutes between suggestions for the same skill |
| `max_suggestions` | `2` | Maximum number of suggestions to show at once |

### Disabling Suggestions

To disable suggestions globally:

```json
{
  "skill_suggestions": {
    "enabled": false
  }
}
```

To disable suggestions for a specific skill, edit its `metadata.json`:

```json
{
  "suggestions": {
    "enabled": false
  }
}
```

## For Skill Authors

### Adding Suggestion Support

To make your skill discoverable via suggestions, add a `suggestions` section to your skill's `metadata.json`:

```json
{
  "id": "my-skill",
  "name": "My Awesome Skill",
  "one_liner": "Brief description for suggestions",
  
  "suggestions": {
    "enabled": true,
    "keywords": [
      "database",
      "sql",
      "query optimization"
    ],
    "file_patterns": [
      "**/*.sql",
      "**/migrations/**/*.js"
    ],
    "directory_patterns": [
      "**/database/**",
      "**/db/**"
    ],
    "project_types": ["web", "api"],
    "priority": 7
  }
}
```

### Field Descriptions

**keywords**: Array of terms that trigger suggestions when found in user prompts
- Use common terms users would naturally type
- Include variations and synonyms
- Keep them specific to avoid false positives

**file_patterns**: Glob patterns for file matching
- Use minimatch syntax
- Examples: `**/*.py`, `**/tests/**/*.js`
- Test patterns against real file structures

**directory_patterns**: Glob patterns for directory matching
- Matches against current working directory
- Examples: `**/src/**`, `**/docs/**`

**project_types**: Array of project types
- Examples: `"web"`, `"api"`, `"cli"`, `"library"`
- Set in project metadata

**priority**: Number from 1-10
- **1-3**: Low priority, niche use cases
- **4-6**: Medium priority, situational
- **7-9**: High priority, frequently useful
- **10**: Critical, almost always relevant

**one_liner**: Brief summary (in main metadata)
- Max ~100 characters
- Action-oriented and clear
- Shows in suggestion message

### Testing Your Suggestions

1. Add suggestion metadata to your skill
2. Open a relevant file or directory
3. Type a prompt with your keywords
4. Verify the suggestion appears

Example test:

```bash
# Open a Python file
code test.py

# Type a prompt in Claude
"I need to run my test suite"

# Expected: Test Runner skill suggested (if configured correctly)
```

## Auto-Activation vs. Suggestions

### Use Auto-Activation When:
- Skill is essential for the context
- Token cost is justified
- False positives are unlikely

Example: Test runner auto-activates when you have test files open

### Use Suggestions When:
- Skill might be helpful but not essential
- You want to minimize token usage
- User should decide whether to activate

Example: Documentation validator is suggested when working with docs

## Examples

### Example 1: Working with Documentation

```bash
# You're editing README.md
Current file: README.md

# You type: "Check if my links are valid"
💡 Documentation Validator skill available - Check docs for quality issues
💡 Link Checker skill available - Validate internal and external links

# To activate:
"Activate doc-validator skill"
```

### Example 2: Working with Tests

```bash
# You're in the tests/ directory
Current directory: ~/project/tests/

# You type: "Run all tests"
# Test Runner auto-activates (configured for auto-activation)
# No suggestion needed - skill loads immediately
```

### Example 3: API Development

```bash
# You have api.ts open
Current file: src/api.ts

# You type: "Validate my API endpoints"
💡 API Validator skill available - Check API design and security

# After activation, skill is loaded
# Won't be suggested again for 5 minutes
```

## Best Practices

### For Users

1. **Pay attention to suggestions** - They're contextually relevant
2. **Activate when useful** - Just say "activate {skill-name}"
3. **Disable if annoying** - Set `enabled: false` in config
4. **Report false positives** - Help improve the system

### For Skill Authors

1. **Test your patterns** - Ensure they match real use cases
2. **Keep keywords specific** - Avoid overly broad terms
3. **Use meaningful one-liners** - Make the value clear
4. **Set appropriate priority** - Don't over-prioritize
5. **Monitor false positives** - Adjust patterns as needed

## Performance

The suggestion system is designed for minimal impact:

- **Token cost**: Zero until skill is activated
- **Latency added**: <50ms per prompt
- **Memory footprint**: ~1MB for metadata cache
- **Cache TTL**: 1 minute (refreshes automatically)

## Troubleshooting

### Suggestions Not Appearing

1. Check if suggestions are enabled:
```bash
cat ~/.claude/config.json | grep "skill_suggestions" -A 5
```

2. Verify skill has suggestion metadata:
```bash
cat ~/.claude/skills/SKILL_NAME/metadata.json | grep "suggestions" -A 10
```

3. Check if skill was recently suggested (throttled):
- Wait 5 minutes and try again
- Or restart Claude to clear throttle cache

### Too Many Suggestions

1. Reduce `max_suggestions`:
```json
{
  "skill_suggestions": {
    "max_suggestions": 1
  }
}
```

2. Disable specific skills' suggestions in their `metadata.json`

### Wrong Skills Suggested

1. Review the skill's suggestion metadata
2. Update keywords to be more specific
3. Tighten file/directory patterns
4. Report issues to skill author

## Future Enhancements

Planned improvements:

- [ ] User feedback loop (thumbs up/down on suggestions)
- [ ] Machine learning-based ranking
- [ ] Conflict detection (don't suggest incompatible skills)
- [ ] Recommendation chains (skill A often used with skill B)
- [ ] Usage analytics dashboard

## Related Documentation

- [Skill Metadata Schema](./SKILL_METADATA_SCHEMA.md)
- [Hook System](./HOOK_SYSTEM.md)
- [Auto-Activation](./AUTO_ACTIVATION.md)

