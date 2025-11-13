# Scenario Manager - Usage Examples

← [Back to Overview](../SKILL.md)

---

## Example 1: Discovery Workflow

### User Query
```
"What scenarios do I have?"
```

### Skill Activates
✅ Yes (matches "what scenarios")

### Expected Response
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

### What Happens
1. Skill loads metadata from config.json
2. Parses available vs. scaffolded scenarios
3. Formats response with status and details
4. Provides guidance for next steps

---

## Example 2: Creation Guidance

### User Query
```
"I want to create a new scenario for client intake"
```

### Skill Activates
✅ Yes (matches "create" + "scenario")

### Expected Response
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

### What Happens
1. Skill analyzes intent (client intake workflow)
2. Suggests appropriate template
3. Outlines creation process
4. Offers step-by-step guidance

### Follow-Up Interaction

**User:** "Yes, guide me through the steps"

**Skill Response:**
```
Great! Let's break down your client intake workflow:

Step 1: Define the Trigger
What should start this workflow?
- User runs a command? (e.g., /client-intake)
- File is created? (hook-based)
- Schedule? (cron-based)

Step 2: Identify the Steps
What happens in order?
1. [User describes: Collect client info]
2. [User describes: Validate requirements]
3. [User describes: Send to processing]

Step 3: Map to Components
For each step, I'll suggest which component type to use...
```

---

## Example 3: Validation Before Scaffolding

### User Query
```
"Can I scaffold the client-intake scenario?"
```

### Skill Activates
✅ Yes (matches "scaffold scenario")

### Expected Response
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

### What Happens
1. Skill loads scenario YAML
2. Runs validation checks
3. Detects missing dependencies
4. Provides clear status and next steps
5. Never auto-scaffolds (safety)

---

## Example 4: Informational Query (No Activation)

### User Query
```
"Tell me about the scenario system"
```

### Skill Activates
❌ No (doesn't match trigger phrases)

### Expected Response
```
The scenario system allows you to define reusable workflows...
[Standard explanation without skill activation]
```

### What Happens
1. No trigger phrase match
2. Skill doesn't load
3. Standard response without scenario-specific guidance

**Note:** This demonstrates the precision of trigger-based activation

---

## Example 5: Status Check

### User Query
```
"Which scenarios are scaffolded?"
```

### Skill Activates
✅ Yes (matches "scaffolded scenarios")

### Expected Response
```
Scaffolded Scenarios:

1. my-scenario
   Scaffolded: 5 days ago
   Files: 3 (skill, command, hook)
   Location: ~/.claude/skills/my_scenario/
   Last used: 2 days ago
   Status: Active

2. test-workflow
   Scaffolded: 10 days ago
   Files: 2 (skill, command)
   Location: ~/.claude/skills/test_workflow/
   Last used: Never
   Status: Inactive (consider cleanup)

To view details:
  diet103 scenario list --verbose
```

---

## Example 6: Scenario Creation from Template

### User Query
```
"Create a scenario from the business_process template"
```

### Expected Interaction

**Skill Response:**
```
Creating scenario from business_process template.

I'll need a few details:

1. Scenario Name (lowercase, hyphen-separated):
   Example: client-intake, document-review
   
2. Description (one sentence):
   Example: "Client requirement gathering and processing"
   
3. Components to Generate:
   - [ ] Skill (recommended for most workflows)
   - [ ] Command (if user-triggered)
   - [ ] Hook (if event-triggered)
```

**User:** "Name: client-intake, Description: Client requirement gathering"

**Skill Response:**
```
Perfect! Here's what I'll help you create:

Scenario: client-intake
Template: business_process
Components: skill + command + hook

Next, let's define your workflow steps:
(I'll guide you through each step to create the YAML structure)
```

---

## Example 7: Validation Error Handling

### User Query
```
"Validate broken-scenario"
```

### Expected Response
```
Scenario 'broken-scenario' has validation errors:

✗ Missing required field: scenario.name
✗ Invalid step dependency: step_3 depends on non-existent step_2
✗ Circular dependency detected: step_1 → step_2 → step_1

Fix these issues before scaffolding:

1. Add scenario.name to YAML:
   scenario:
     name: "broken-scenario"

2. Fix step_3 dependency:
   - Either create step_2
   - Or remove dependency on step_2

3. Break circular reference:
   - Review step dependencies
   - Ensure linear or parallel flow

Edit: ~/.claude/scenarios/broken-scenario.yaml
```

### What Happens
1. Skill detects invalid YAML
2. Runs comprehensive validation
3. Lists all errors with details
4. Provides actionable fixes
5. Shows file path for editing

---

## Example 8: Metadata Repair

### User Query
```
"Check scenario metadata"
```

### Expected Response (if issue found)
```
Warning: Metadata inconsistency detected

Scenario 'my-scenario' is marked as scaffolded, but generated files not found:
- Expected: ~/.claude/skills/my_scenario/SKILL.md (missing)
- Expected: ~/.claude/commands/my-scenario.md (missing)

Possible causes:
- Files were deleted manually
- Scenario was unscaffolded without updating metadata
- Config.json out of sync

Repair options:
1. Re-scaffold the scenario
   diet103 scenario scaffold my-scenario
   
2. Update metadata to mark as not_scaffolded
   (I can do this for you)
   
3. Remove from registry
   (if scenario no longer needed)

Would you like me to repair this?
```

### What Happens
1. Skill checks metadata consistency
2. Detects orphaned entries
3. Verifies file existence
4. Offers repair options
5. Can execute repair with confirmation

---

## Example 9: Listing with Filters

### User Query
```
"Show me available scenarios"
```

### Expected Response
```
Available Scenarios (Not Yet Scaffolded):

1. client-intake
   Description: Client requirement gathering
   Components: 3 skills, 2 commands, 1 hook
   Created: 2 days ago
   Status: Valid
   
2. document-review
   Description: Automated document processing
   Components: 1 skill, 1 command
   Created: 5 days ago
   Status: Valid

3. error-scenario
   Description: Test scenario with errors
   Created: 1 week ago
   Status: ⚠ Invalid (3 errors)

To view errors:
  diet103 scenario validate error-scenario

To scaffold:
  diet103 scenario scaffold <name>
```

---

## Example 10: Integration Workflow

### Complete End-to-End Flow

**Step 1: Discovery**
```
User: "What scenarios do I have?"
Skill: [Lists available scenarios]
```

**Step 2: Validation**
```
User: "Validate client-intake"
Skill: [Runs checks, shows green light]
```

**Step 3: Scaffolding**
```
User: "Scaffold client-intake"
Skill: [Provides CLI command]
User: [Runs: diet103 scenario scaffold client-intake]
System: [Generates files]
```

**Step 4: Verification**
```
User: "Show scaffolded scenarios"
Skill: [Lists client-intake as scaffolded]
```

**Step 5: Usage**
```
User: [Invokes generated command or skill]
System: [Executes workflow]
Skill: [Updates last_used timestamp]
```

---

## Common Patterns

### Pattern 1: Quick Status Check
```
"What scenarios?" → See list → Decide next action
```

### Pattern 2: Pre-Scaffold Validation
```
"Validate X" → Check status → "Scaffold X"
```

### Pattern 3: Discovery → Creation
```
"What scenarios?" → "Create new one" → Guided creation
```

### Pattern 4: Troubleshooting
```
"Validate X" → See errors → Fix YAML → "Validate X" again
```

---

## Related Resources

- [Quick Reference](quick-ref.md) - Command syntax
- [Architecture](architecture.md) - Technical details
- [Troubleshooting](troubleshooting.md) - Error solutions

