# Natural Language Orchestration

## Overview

The Global skill-rules.json system enables natural language project management through pattern recognition. This feature allows you to interact with the orchestrator using intuitive, conversational commands instead of remembering specific CLI syntax.

## Location

```
~/.claude/skill-rules.json
```

This file lives in your global Claude configuration directory and applies across all projects.

## Architecture

The skill-rules.json follows the diet103 auto-activation pattern for global orchestration, defining trigger patterns that:

1. **Match** natural language commands using regex patterns
2. **Extract** parameters (project names, template names, file paths)
3. **Route** to appropriate actions in the orchestrator
4. **Execute** project management operations

## Pattern Structure

Each pattern consists of:

```json
{
  "name": "pattern_identifier",
  "description": "Human-readable description",
  "regex": "(?i)regex_pattern_with_groups",
  "examples": ["example command 1", "example command 2"],
  "extraction": {
    "param_name": "$N"  // Capture group reference
  },
  "action": "category.action",
  "priority": "high|medium|low",
  "requires_confirmation": true  // Optional safety flag
}
```

## Available Commands

### Project Orchestration

#### Switch Project
**Natural Language:**
- "switch to shopify project"
- "change to project blog"
- "switch project documentation"

**Action:** `project.switch`  
**Extracts:** `project_name`

---

#### Create Project
**Natural Language:**
- "create project blog"
- "make project ecommerce using shopify template"
- "new project docs"

**Action:** `project.create`  
**Extracts:** `project_name`, `template_name` (optional)

---

#### List Projects
**Natural Language:**
- "list projects"
- "show my projects"
- "display all projects"

**Action:** `project.list`

---

#### Remove Project
**Natural Language:**
- "remove project blog"
- "delete project test"
- "destroy project temp"

**Action:** `project.remove`  
**Extracts:** `project_name`  
**Safety:** Requires confirmation

---

#### Validate Project
**Natural Language:**
- "validate project blog"
- "check project ecommerce"
- "verify project"

**Action:** `project.validate`  
**Extracts:** `project_name` (optional - validates current if omitted)

---

#### Get Active Project
**Natural Language:**
- "what is the current project"
- "which is the active project"
- "what's the current project"

**Action:** `project.current`

---

#### Register Project
**Natural Language:**
- "register project at /Users/you/my-project"
- "register project ./my-project"

**Action:** `project.register`  
**Extracts:** `project_path`

---

### Skill Management

#### List Skills
**Natural Language:**
- "list skills"
- "show available skills"
- "what skills are available"

**Action:** `skill.list`

---

#### Activate Skill
**Natural Language:**
- "activate the shopify skill"
- "enable seo skill"
- "load web_dev skill"

**Action:** `skill.activate`  
**Extracts:** `skill_name`

---

### Context Management

#### Refresh Context
**Natural Language:**
- "refresh context"
- "reload project context"

**Action:** `context.refresh`

---

#### Clear Cache
**Natural Language:**
- "clear cache"
- "clear project cache"

**Action:** `context.clearCache`

---

## Pattern Design Principles

### 1. Case Insensitivity
All patterns use the `(?i)` flag for case-insensitive matching:
```
"list projects" === "LIST PROJECTS" === "List Projects"
```

### 2. Natural Variations
Patterns account for common language variations:
```regex
(switch|change)  // "switch to" OR "change to"
(list|show|display)  // Multiple ways to ask
```

### 3. Optional Elements
Use non-capturing groups `(?:...)` for optional parts:
```regex
(?:the\s+)?  // "the" is optional
(my\s+)?     // "my" is optional
```

### 4. Multi-Group Extraction
For complex syntaxes, use pipe-separated groups:
```json
"extraction": {
  "project_name": "$2|$3|$4"  // Try groups 2, 3, then 4
}
```

### 5. Priority Levels
- **high**: Destructive operations (create, remove, switch)
- **medium**: Read operations with parameters (validate, activate)
- **low**: Simple queries (list, current)

## Testing

### Automated Tests

Run the comprehensive test suite:

```bash
node tests/skill-rules-test.js
```

This validates:
- ✅ All 33 patterns match their example commands
- ✅ Parameter extraction works correctly
- ✅ Case insensitivity functions
- ✅ Natural language variations are supported

### Manual Testing

Test patterns interactively:

```bash
# Test in Node REPL
node
> const skillRules = require(os.homedir() + '/.claude/skill-rules.json')
> const pattern = skillRules.project_orchestrator.patterns[0]
> const regex = new RegExp(pattern.regex.substring(4), 'i')  // Remove (?i)
> 'switch to blog project'.match(regex)
```

### Validation

Verify JSON syntax:

```bash
cat ~/.claude/skill-rules.json | jq
```

## Integration with Orchestrator

The skill-rules.json integrates with the orchestrator through hooks:

### 1. UserPromptSubmit Hook
```bash
~/.claude/hooks/UserPromptSubmit.sh
```

This hook:
- Reads `~/.claude/skill-rules.json`
- Tests user input against all patterns
- Extracts parameters when matched
- Routes to the appropriate action handler

### 2. Action Handlers
Each action maps to an orchestrator function:

```
project.switch      → lib/commands/switch.js
project.create      → lib/commands/create-project.js
project.list        → lib/commands/list-projects.js
project.validate    → lib/commands/validate.js
skill.list          → lib/commands/list-skills.js
context.refresh     → lib/utils/context.js::refreshContext()
```

## Adding New Patterns

### 1. Define the Pattern

Add to the appropriate category in skill-rules.json:

```json
{
  "name": "my_new_command",
  "description": "What it does",
  "regex": "(?i)pattern_here",
  "examples": ["example 1", "example 2"],
  "extraction": {
    "param_name": "$N"
  },
  "action": "category.action",
  "priority": "medium"
}
```

### 2. Add Test Cases

Update `tests/skill-rules-test.js`:

```javascript
{
  category: 'your_category',
  pattern: 'my_new_command',
  tests: [
    { input: 'example command', expected: { param_name: 'value' } }
  ]
}
```

### 3. Implement Action Handler

Create or update the action handler in `lib/commands/` or `lib/utils/`.

### 4. Run Tests

```bash
node tests/skill-rules-test.js
```

### 5. Update Documentation

Add the new command to this document under the appropriate category.

## Regex Patterns Reference

### Common Elements

| Pattern | Matches | Example |
|---------|---------|---------|
| `(?i)` | Case-insensitive flag | - |
| `\s+` | One or more spaces | " " |
| `(?:...)` | Non-capturing group | - |
| `(...)?` | Optional group | - |
| `(a|b)` | a OR b | "switch" or "change" |
| `(\w+)` | Word characters (alphanumeric + _) | "shopify", "blog_site" |
| `([\w\-./]+)` | Word chars + path separators | "/path/to/project" |

### Multi-Group Extraction

For patterns with multiple possible syntaxes:

```json
"regex": "(?i)(switch|change)\\s+(?:to\\s+(?:(\\w+)\\s+project|project\\s+(\\w+))|project\\s+(\\w+))",
"extraction": {
  "project_name": "$2|$3|$4"
}
```

This matches all of:
- "switch to blog project" → Group 2
- "switch to project blog" → Group 3
- "switch project blog" → Group 4

## Troubleshooting

### Pattern Not Matching

1. **Test regex separately:**
   ```bash
   node -e "console.log('your input'.match(/your_pattern/i))"
   ```

2. **Check for escaped characters:**
   - Use `\\s` instead of `\s` in JSON
   - Use `\\w` instead of `\w` in JSON

3. **Verify case insensitivity:**
   - Ensure `(?i)` is at the start of the pattern
   - Test with mixed case input

### Extraction Not Working

1. **Verify group numbers:**
   ```bash
   node -e "const m = 'input'.match(/pattern/i); console.log(m)"
   ```
   Group 0 is full match, groups 1+ are captures.

2. **Check for non-capturing groups:**
   Non-capturing groups `(?:...)` don't affect group numbers.

3. **Test multi-group extraction:**
   Ensure at least one of the pipe-separated groups matches.

### JSON Syntax Errors

1. **Validate JSON:**
   ```bash
   cat ~/.claude/skill-rules.json | jq
   ```

2. **Common issues:**
   - Missing commas between objects
   - Unescaped backslashes (use `\\`)
   - Trailing commas (not allowed in JSON)

## Performance Considerations

### Pattern Ordering

Patterns are tested in order. Place:
- **High-priority** patterns first
- **More specific** patterns before general ones
- **Frequently used** patterns early

### Regex Optimization

- Use `(?:...)` for non-capturing groups (faster)
- Avoid backtracking with greedy quantifiers
- Keep patterns simple and specific

### Caching

The UserPromptSubmit hook can cache:
- Compiled regex patterns
- Parsed skill-rules.json
- Recent pattern matches

## Security Considerations

### Confirmation Requirements

Destructive operations should require confirmation:

```json
{
  "name": "remove_project",
  "requires_confirmation": true,
  "action": "project.remove"
}
```

### Input Validation

All extracted parameters should be validated before use:
- Project names: alphanumeric + underscores only
- Paths: check for directory traversal attempts
- Template names: whitelist allowed templates

### Access Control

The orchestrator should verify:
- User has permission to modify the project
- Project exists and is registered
- Operation is allowed in current context

## Future Enhancements

### Planned Features

1. **Context-Aware Patterns**
   - Different patterns based on active project
   - Skill-specific command patterns

2. **Learning System**
   - Track frequently used commands
   - Suggest pattern improvements
   - Auto-generate aliases

3. **Multi-Language Support**
   - Patterns in multiple languages
   - Locale-aware matching

4. **Advanced Extraction**
   - Named capture groups
   - Post-processing functions
   - Parameter validation rules

5. **Pattern Composition**
   - Reusable pattern fragments
   - Pattern inheritance
   - Macro expansion

## References

- [Orchestrator PRD](./Orchestrator_PRD.md) - Section 4.3: Project Orchestrator Meta-Skill
- [diet103 Implementation](./DIET103_IMPLEMENTATION.md) - Auto-Activation Patterns
- [Regular Expressions (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)
- [JSON Schema](https://json-schema.org/)

## Support

For issues or questions:
1. Run the test suite: `node tests/skill-rules-test.js`
2. Check regex patterns: `cat ~/.claude/skill-rules.json | jq`
3. Review hook logs in `~/.claude/debug/`
4. Consult [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

*Last Updated: 2024-11-11*  
*Version: 1.0.0*

