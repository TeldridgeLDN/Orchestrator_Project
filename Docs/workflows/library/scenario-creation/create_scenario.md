# Workflow: Interactive Scenario Creation

**Purpose:** Guide users through creating well-structured scenarios using the scenario CLI with AI-assisted recommendations

**Category:** Scenario Management | Interactive Workflow

**Complexity:** Medium

**Estimated Setup Time:** 15-30 minutes

**Version:** 1.0
**Date:** 2025-11-10
**Status:** Production Ready

---

## Overview

### What This Workflow Does

This workflow provides a structured approach to creating new scenarios using the `diet103 scenario` CLI commands. It combines interactive prompts, template selection, and best practices to help users define complete, validated scenario configurations.

### When to Use This Workflow

- Starting a new recurring business process automation
- Defining a client intake or onboarding workflow
- Creating data pipeline scenarios
- Documenting integration workflows
- Building multi-step automation sequences

### When NOT to Use This Workflow

- For simple, single-command operations (use slash commands instead)
- For one-off tasks that won't be repeated
- When a suitable scenario already exists (use edit/customize instead)
- For workflows that change frequently (consider simpler approaches first)

### Prerequisites

- [x] diet103 CLI installed (`npm install -g diet103` or local install)
- [x] Scenarios directory initialized (`~/.claude/scenarios/`)
- [x] Basic understanding of YAML structure
- [x] Clear understanding of the process you want to automate

---

## Architecture

### Components Used

| Component Type | Name | Purpose |
|----------------|------|---------|
| CLI Command | `diet103 scenario create` | Interactive scenario creation |
| CLI Command | `diet103 scenario validate` | Configuration validation |
| CLI Command | `diet103 scenario optimize` | Configuration optimization |
| CLI Command | `diet103 scenario show` | View created scenario |
| Utility | `scenario-directory.js` | File system operations |
| Templates | `basic.yaml`, `advanced.yaml` | Starting points |

### Component Interaction Flow

```
User initiates creation
    ↓
[CLI: scenario create] → Prompts for input
    ↓
[Template Selection] → Loads template structure
    ↓
[Interactive Prompts] → Collects scenario details
    ↓
[YAML Generation] → Creates scenario file
    ↓
[Validation] → Checks configuration
    ↓
[Optimization Check] → Suggests improvements
    ↓
Scenario ready for deployment
```

### Decision Justification

**Why CLI-Based:**
- Provides structured, repeatable process
- Enables version control of scenarios
- Supports both interactive and scripted use
- Integrates with existing tooling

**Why Templates:**
- Accelerates scenario creation
- Ensures consistent structure
- Provides examples and best practices
- Reduces configuration errors

---

## Implementation

### Phase 1: Preparation

**Objective:** Understand requirements and choose approach

**Steps:**

1. **Define your business process**
   - What trigger starts the process?
   - What steps must happen in sequence?
   - What external systems are involved?
   - What's the expected outcome?

2. **Choose complexity level**
   - **Basic**: Simple manual workflows (2-3 steps)
   - **Advanced**: Complex workflows with multiple integrations
   - **Custom**: Unique requirements needing full customization

3. **Identify dependencies**
   ```bash
   # List available MCPs
   diet103 mcp list  # (if available)
   
   # Check existing skills
   ls ~/.claude/skills/
   ```

**Validation:**
- Clear understanding of process flow
- List of required external systems
- Approximate number of steps needed

### Phase 2: Interactive Creation

**Objective:** Create the scenario using the CLI

**Steps:**

1. **Launch interactive creation**
   ```bash
   diet103 scenario create
   ```

2. **Respond to prompts**
   
   **Scenario Name:**
   - Use kebab-case (e.g., `client-intake`, `order-processing`)
   - Make it descriptive and unique
   - Avoid special characters
   
   Example:
   ```
   ? What is the name of your scenario? client-intake-form
   ```

   **Description:**
   - One-line summary of what it does
   - Focus on business value
   
   Example:
   ```
   ? Provide a brief description: Capture and process client requirements before project kickoff
   ```

   **Category:**
   - `business_process`: Client-facing workflows
   - `data_pipeline`: Data processing and transformation
   - `automation`: Automated task sequences
   - `integration`: System-to-system connections
   - `other`: Unique use cases
   
   Example:
   ```
   ? Select a category: business_process
   ```

   **Template:**
   - `basic`: Start with simple structure
   - `advanced`: Use for complex workflows
   - `custom`: Build from scratch
   
   Example:
   ```
   ? Which template would you like to use? advanced
   ```

   **Trigger Type:**
   - `manual`: User-initiated via command
   - `scheduled`: Time-based execution
   - `webhook`: External system triggers
   - `hybrid`: Multiple trigger types
   
   Example:
   ```
   ? What type of trigger? hybrid
   ```

3. **Review created scenario**
   ```bash
   diet103 scenario show client-intake-form
   ```

**Expected Output:**
```
✅ Scenario created successfully!

📄 File: /Users/you/.claude/scenarios/client-intake-form.yaml
📝 Name: client-intake-form
📋 Category: business_process
🎯 Trigger: /client-intake-form

📚 Next steps:
  1. Edit the scenario: diet103 scenario edit client-intake-form
  2. Validate it: diet103 scenario validate client-intake-form
  3. Deploy it: diet103 scenario deploy client-intake-form
```

### Phase 3: Configuration and Refinement

**Objective:** Customize and validate the scenario

**Steps:**

1. **Edit scenario details**
   ```bash
   diet103 scenario edit client-intake-form
   ```
   
   This opens your default editor with the YAML configuration.

2. **Customize key sections**

   **Steps Section** - Define the workflow:
   ```yaml
   steps:
     - id: send_form
       action: "Send Google Form to client"
       type: api_call
       mcp: google-forms-mcp
       inputs: [client_email, project_type]
       outputs: [form_url]
       
     - id: wait_completion
       action: "Poll for form completion"
       type: webhook
       mcp: airtable-mcp
       dependencies: [send_form]
       timeout: 7_days
       
     - id: analyze_requirements
       action: "Extract and structure requirements using AI"
       type: ai_analysis
       dependencies: [wait_completion]
       outputs: [structured_requirements]
       
     - id: create_project
       action: "Initialize project structure"
       type: api_call
       calls: project_orchestrator.create
       dependencies: [analyze_requirements]
   ```

   **Dependencies Section** - List required resources:
   ```yaml
   dependencies:
     mcps:
       - google-forms-mcp
       - airtable-mcp
       - notification-mcp
     skills:
       - project_manager
       - requirement_analyzer
   ```

   **Design Decisions** - Document your choices:
   ```yaml
   design_decisions:
     - decision: "Use Google Forms instead of custom form"
       rationale: "Client familiarity and reduced development time"
       alternatives_considered:
         - "Custom web form"
         - "Airtable direct submission"
       trade_offs:
         pros:
           - "No hosting required"
           - "Mobile-friendly"
         cons:
           - "Limited customization"
           - "External dependency"
   ```

3. **Validate configuration**
   ```bash
   diet103 scenario validate client-intake-form
   ```

**Expected Output:**
```
🔍 Validation Results

✅ YAML Syntax: Valid
✅ Schema: Valid
✅ Dependencies: Valid
✅ Step IDs: Unique

✅ All validations passed!
```

### Phase 4: Optimization

**Objective:** Improve and refine the scenario

**Steps:**

1. **Check for optimization opportunities**
   ```bash
   diet103 scenario optimize client-intake-form
   ```

**Expected Output:**
```
🔧 Optimization Suggestions

1. Add test strategy
   Priority: MEDIUM
   Type: best_practice
   → Add testStrategy field with test plan

2. Document design decisions
   Priority: LOW
   Type: documentation
   → Add design_decisions array with rationale

Found 2 optimizations
```

2. **Apply optimizations interactively**
   ```bash
   diet103 scenario optimize client-intake-form -i
   ```

3. **Explore alternative approaches** (optional)
   ```bash
   diet103 scenario explore client-intake-form --compare
   ```

### Phase 5: Testing and Deployment

**Objective:** Verify and deploy the scenario

**Steps:**

1. **Final validation**
   ```bash
   diet103 scenario validate client-intake-form -v
   ```

2. **Test deployment**
   ```bash
   diet103 scenario deploy client-intake-form --dry-run
   ```

3. **Deploy to development**
   ```bash
   diet103 scenario deploy client-intake-form
   ```

4. **Test in development environment**
   - Trigger the scenario manually
   - Verify all steps execute correctly
   - Check integrations work as expected

5. **Deploy to production** (when ready)
   ```bash
   diet103 scenario deploy client-intake-form -e production
   ```

**Validation:**
```bash
# Verify deployment
diet103 scenario show client-intake-form -v

# Check generated artifacts
ls ~/.claude/skills/
ls ~/.claude/commands/
```

---

## Configuration Files

### Scenario YAML Structure

**File:** `~/.claude/scenarios/client-intake-form.yaml`

```yaml
scenario:
  name: client-intake-form
  description: "Capture and process client requirements before project kickoff"
  category: business_process
  version: "1.0.0"
  
  trigger:
    type: hybrid
    command: "/client-intake"
    keywords: ["new client", "intake", "requirements"]
    webhook:
      path: "/webhook/client-intake"
      method: "POST"
  
  steps:
    - id: send_form
      action: "Send Google Form to client"
      type: api_call
      mcp: google-forms-mcp
      inputs: [client_email, project_type]
      outputs: [form_url]
    
    - id: wait_completion
      action: "Poll for form completion"
      type: webhook
      mcp: airtable-mcp
      dependencies: [send_form]
      timeout: 7_days
      outputs: [form_data]
    
    - id: analyze_requirements
      action: "AI-powered requirement analysis"
      type: ai_analysis
      dependencies: [wait_completion]
      inputs: [form_data]
      outputs: [structured_requirements]
    
    - id: create_project
      action: "Initialize project structure"
      type: api_call
      dependencies: [analyze_requirements]
      calls: project_orchestrator.create
      inputs: [structured_requirements]
  
  dependencies:
    mcps:
      - google-forms-mcp
      - airtable-mcp
    skills:
      - project_manager
      - requirement_analyzer
  
  generates:
    - "global_skill: client_intake_form"
    - "slash_command: /client-intake"
    - "webhook: /webhook/client-intake"
  
  design_decisions:
    - decision: "Use AI for requirement analysis"
      rationale: "Automated analysis provides faster turnaround and consistent structure"
      alternatives_considered:
        - "Manual review process"
        - "Template-based requirements"
      trade_offs:
        pros:
          - "Faster processing"
          - "Consistent output format"
          - "24/7 availability"
        cons:
          - "Requires AI API access"
          - "May need human review for edge cases"
  
  testStrategy: |
    1. Unit test each step independently
    2. Integration test with sandbox MCP servers
    3. End-to-end test with test client
    4. Load test with multiple concurrent scenarios
  
  potential_improvements:
    - "Add automated follow-up reminders for incomplete forms"
    - "Implement caching for repeated requirement patterns"
    - "Add multi-language support for international clients"
```

---

## Usage Examples

### Example 1: Quick Creation (Non-Interactive)

**Context:** You know exactly what you need and want fast creation

**User Action:**
```bash
diet103 scenario create \
  --template basic \
  --name simple-workflow \
  --no-interactive
```

**System Response:**
```
Loading basic template...
Saving scenario to ~/.claude/scenarios/...

✅ Scenario created successfully!

📄 File: /Users/you/.claude/scenarios/simple-workflow.yaml
📝 Name: simple-workflow
```

### Example 2: Step-by-Step Interactive Creation

**Context:** First-time user exploring scenario creation

**User Action:**
```bash
diet103 scenario create
```

**System Prompts:**
```
? What is the name of your scenario? order-fulfillment
? Provide a brief description: Process customer orders from receipt to shipment
? Select a category: automation
? Which template would you like to use? advanced
? What type of trigger? webhook
```

**System Response:**
```
✅ Scenario created successfully!
...
```

**Next Steps:**
```bash
# Customize the configuration
diet103 scenario edit order-fulfillment

# Validate
diet103 scenario validate order-fulfillment

# Deploy
diet103 scenario deploy order-fulfillment --dry-run
```

### Example 3: Error Handling

**Context:** Invalid scenario name provided

**User Action:**
```bash
diet103 scenario create
? What is the name of your scenario? My Scenario Name
```

**System Response:**
```
❌ Invalid scenario name
Scenario names must be in kebab-case (lowercase with hyphens)
Examples: client-intake, order-processing, data-sync

Please try again.
? What is the name of your scenario?
```

---

## Troubleshooting

### Issue: Scenario Already Exists

**Symptoms:**
- Error message: "Scenario 'name' already exists"

**Solution:**
```bash
# List existing scenarios
diet103 scenario list

# Choose different name or remove existing
diet103 scenario remove old-name -f

# Or edit existing
diet103 scenario edit existing-name
```

### Issue: Validation Fails After Creation

**Symptoms:**
- YAML syntax errors
- Missing required fields

**Diagnosis:**
```bash
diet103 scenario validate my-scenario -v
```

**Solution:**
```bash
# Edit and fix issues
diet103 scenario edit my-scenario

# Common fixes:
# - Check indentation (use spaces, not tabs)
# - Ensure all required fields are present
# - Verify step dependencies reference existing steps
# - Check for duplicate step IDs
```

### Issue: Template Not Found

**Symptoms:**
- "Template 'name' not found"

**Root Cause:**
Template files missing from `lib/templates/scenario/`

**Solution:**
1. Check available templates:
   ```bash
   ls lib/templates/scenario/
   ```

2. Use valid template names:
   - `basic`
   - `advanced`
   - `custom`

3. Reinstall if templates missing:
   ```bash
   npm install -g diet103@latest
   ```

---

## Best Practices

### Naming Conventions

**Scenario Names:**
- Use kebab-case: `client-intake`, `order-processing`
- Be descriptive but concise
- Avoid version numbers (use version field instead)

**Step IDs:**
- Use snake_case: `send_form`, `analyze_data`
- Make them self-explanatory
- Keep them short but descriptive

### Documentation

**Always Include:**
- Clear description of purpose
- Design decisions with rationale
- Test strategy
- Dependencies

**Document:**
- Why you chose this approach
- Alternative approaches considered
- Known limitations
- Future improvement ideas

### Validation

**Before Deployment:**
1. Run `validate` command
2. Check all dependencies are available
3. Test in dev environment first
4. Run optimization check
5. Review with stakeholders if applicable

### Version Control

**Recommended:**
```bash
# Add scenarios to git
git add ~/.claude/scenarios/

# Or copy to project directory
mkdir -p .scenarios/
cp ~/.claude/scenarios/my-scenario.yaml .scenarios/
git add .scenarios/
```

---

## Advanced Techniques

### Parameterized Creation

Create scenarios programmatically:

```bash
#!/bin/bash
# create-standard-workflow.sh

SCENARIO_NAME=$1
DESCRIPTION=$2

cat > /tmp/scenario-config.yaml <<EOF
name: $SCENARIO_NAME
description: $DESCRIPTION
category: automation
template: basic
trigger_type: manual
EOF

# Create from config
diet103 scenario create --config /tmp/scenario-config.yaml
```

### Scenario Templates

Create your own reusable templates:

```bash
# Copy existing scenario as template
cp ~/.claude/scenarios/my-scenario.yaml ~/.claude/scenarios/templates/custom-template.yaml

# Edit to remove specific values
# Then use as starting point for new scenarios
```

### Batch Creation

Create multiple scenarios:

```bash
# scenarios.txt
project-intake|Capture project requirements|business_process
order-processing|Process customer orders|automation
data-sync|Sync data between systems|data_pipeline

# create-batch.sh
while IFS='|' read -r name desc category; do
  diet103 scenario create \
    --name "$name" \
    --description "$desc" \
    --category "$category" \
    --template basic \
    --no-interactive
done < scenarios.txt
```

---

## Related Resources

### CLI Documentation
- [Scenario CLI Guide](../../../docs/SCENARIO_CLI.md)
- [Scenario Quick Reference](../../../docs/SCENARIO_QUICK_REFERENCE.md)

### Related Workflows
- [Analyze Scenario Workflow](./analyze_scenario.md) - Next step after creation
- [Scenario Deployment Workflow](./deploy_scenario.md) - Production deployment guide

### Scenarios Using This Workflow
- All scenarios start with this creation workflow

### External Resources
- [YAML Syntax Guide](https://yaml.org/spec/1.2/spec.html)
- [Scenario Schema Reference](../../../docs/SCENARIO_SCHEMA.md)

---

## Changelog

### v1.0 (2025-11-10)
- Initial workflow creation
- Interactive creation flow documented
- Template system explained
- Validation and optimization steps included
- Best practices and troubleshooting added

---

**Last Updated:** 2025-11-10
**Maintainer:** Orchestrator Project Team
**Feedback:** Create issue in project repository
**License:** Same as parent project

