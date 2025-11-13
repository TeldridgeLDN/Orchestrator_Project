# Workflow vs Scenario Validation Rules

**Purpose:** Clear criteria to determine whether something should be a Workflow or a Scenario

**Version:** 1.0
**Date:** 2025-11-08

---

## Decision Matrix

### A WORKFLOW if:

| Criterion | Description | Example |
|-----------|-------------|---------|
| **Single Purpose** | Solves one technical problem | "Integrate Task Master MCP" |
| **Technical Focus** | Centered on implementation details | MCP setup, hook configuration |
| **Component-Based** | Uses primitives (Commands, MCPs, Hooks, Agents, Skills) | Creates 2-3 components |
| **Reusable** | Can be used in multiple scenarios | Payment processing used in many scenarios |
| **No Business Logic** | Doesn't encode business rules or branching | No "if customer type A then..." |
| **Linear Flow** | Step 1 → Step 2 → Step 3 (no major branches) | Sequential implementation |
| **Standalone** | Can be implemented and tested independently | Works without other workflows |

### A SCENARIO if:

| Criterion | Description | Example |
|-----------|-------------|---------|
| **Multi-Purpose** | Solves complete business process | "Shopify client onboarding to delivery" |
| **Business Focus** | Centered on business outcomes | Client satisfaction, revenue milestones |
| **Workflow Composition** | Combines multiple workflows | Uses 3+ existing workflows |
| **Domain-Specific** | Tailored to specific business context | E-commerce agency operations |
| **Business Logic** | Contains decision trees and branching | Different paths for small/medium/large packages |
| **Non-Linear Flow** | Multiple branches, loops, decision points | Phase 2A vs 2B based on conditions |
| **Dependent** | Requires multiple workflows to function | Cannot run without constituent workflows |

---

## Validation Checks

### Automated Checks (Run Before Creation)

```javascript
/**
 * Validates whether content should be workflow or scenario
 * @param {Object} content - Parsed content from user description
 * @returns {Object} - { type: 'workflow' | 'scenario', confidence: 0-1, warnings: [] }
 */
function validateType(content) {
  const workflowScore = calculateWorkflowScore(content);
  const scenarioScore = calculateScenarioScore(content);

  const result = {
    type: workflowScore > scenarioScore ? 'workflow' : 'scenario',
    confidence: Math.abs(workflowScore - scenarioScore) / Math.max(workflowScore, scenarioScore),
    warnings: [],
    suggestions: []
  };

  // Check for cross-pollution
  if (result.type === 'workflow' && scenarioScore > 0.5) {
    result.warnings.push('This appears to have scenario characteristics (business logic, multiple workflows)');
    result.suggestions.push('Consider breaking into multiple workflows and creating a scenario to orchestrate them');
  }

  if (result.type === 'scenario' && workflowScore > 0.5) {
    result.warnings.push('This appears to have workflow characteristics (single purpose, technical focus)');
    result.suggestions.push('Consider simplifying to a single workflow instead of a scenario');
  }

  return result;
}

function calculateWorkflowScore(content) {
  let score = 0;

  // Single purpose indicators
  if (content.purposes?.length === 1) score += 0.2;

  // Technical keywords
  const techKeywords = ['MCP', 'hook', 'agent', 'command', 'API', 'integration', 'setup'];
  const techCount = countKeywords(content.description, techKeywords);
  score += Math.min(techCount * 0.1, 0.3);

  // Component count (2-5 is ideal for workflow)
  if (content.components?.length >= 2 && content.components?.length <= 5) score += 0.2;

  // Linear flow
  if (!content.hasBranching && !content.hasDecisionPoints) score += 0.2;

  // Reusability indicators
  if (content.reusable === true) score += 0.1;

  return Math.min(score, 1);
}

function calculateScenarioScore(content) {
  let score = 0;

  // Multiple purposes
  if (content.purposes?.length > 1) score += 0.2;

  // Business keywords
  const businessKeywords = ['client', 'customer', 'revenue', 'onboarding', 'delivery', 'payment', 'milestone'];
  const businessCount = countKeywords(content.description, businessKeywords);
  score += Math.min(businessCount * 0.1, 0.3);

  // Workflow composition (uses 3+ workflows)
  if (content.workflowsUsed?.length >= 3) score += 0.3;

  // Branching logic
  if (content.hasBranching || content.hasDecisionPoints) score += 0.2;

  // Domain specificity
  if (content.domain) score += 0.1;

  return Math.min(score, 1);
}
```

### Manual Validation Checklist

Before creating, check these questions:

#### "Should this be a WORKFLOW?"

- [ ] Does it solve ONE technical problem?
- [ ] Is it focused on HOW to implement something?
- [ ] Can it be used in multiple different scenarios?
- [ ] Does it have a linear, sequential flow?
- [ ] Is it component-based (uses primitives)?

**If 4+ YES → Create WORKFLOW**

#### "Should this be a SCENARIO?"

- [ ] Does it solve a complete business process?
- [ ] Is it focused on WHAT business outcomes to achieve?
- [ ] Does it combine 3+ existing workflows?
- [ ] Does it have branching logic or decision points?
- [ ] Is it specific to a business domain/context?

**If 4+ YES → Create SCENARIO**

---

## Common Misclassifications

### ❌ Misclassified as WORKFLOW (should be SCENARIO)

**Example:** "E-commerce order fulfillment"

**Why it's wrong:**
- Combines multiple workflows (payment, inventory, shipping)
- Has business logic (if expedited then ship today)
- Domain-specific (e-commerce)
- Not reusable across domains

**Correct approach:**
- Create scenario: "E-commerce Order Fulfillment"
- Uses workflows: payment-processing, inventory-check, shipping-integration

### ❌ Misclassified as SCENARIO (should be WORKFLOW)

**Example:** "Stripe payment integration with webhook handling"

**Why it's wrong:**
- Single technical purpose (integrate Stripe)
- No business branching (same for all scenarios)
- Reusable across many scenarios
- Linear implementation steps

**Correct approach:**
- Create workflow: "Stripe Payment Integration"
- Can be used in: order-fulfillment scenario, subscription-management scenario, etc.

---

## Edge Cases

### Case 1: Multi-Step Technical Process

**Description:** "Setup CI/CD pipeline with GitHub Actions, deploy to AWS, monitor with DataDog"

**Analysis:**
- Multiple steps (3 systems)
- But still technical focus
- Reusable across projects
- No business logic

**Decision:** WORKFLOW (complex workflow, but still workflow)
**Reasoning:** Technical purpose, reusable, no domain-specific business rules

### Case 2: Simple Business Process

**Description:** "Client signs up, we send welcome email"

**Analysis:**
- Business context (client)
- But only 2 steps
- Could be a simple command

**Decision:** START WITH WORKFLOW
**Reasoning:** Too simple for scenario. If it grows to include onboarding, payment, delivery → convert to scenario

**Rule:** Start small (workflow), scale to scenario when needed

### Case 3: Reusable Business Logic

**Description:** "Multi-tier pricing calculation used across all scenarios"

**Analysis:**
- Business logic (pricing)
- But reusable across scenarios
- Single purpose (calculate price)

**Decision:** WORKFLOW
**Reasoning:** Even though it's business logic, it's a reusable utility. Scenarios will CALL this workflow when they need pricing.

---

## Conversion Guidelines

### When to Convert Workflow → Scenario

**Indicators:**
1. Workflow is being copied and modified for different contexts
2. Workflow now has 3+ branching decision points
3. Workflow combines 3+ other workflows
4. Workflow encodes domain-specific business rules

**Conversion Process:**
1. Extract reusable technical parts as separate workflows
2. Create scenario that orchestrates these workflows
3. Move business logic to scenario decision tree
4. Update documentation and references

### When to Convert Scenario → Workflow

**Indicators:**
1. Scenario has no branching (completely linear)
2. Scenario uses only 1-2 workflows
3. Scenario is being reused without modification across domains
4. Scenario has no domain-specific context

**Conversion Process:**
1. Simplify to single workflow
2. Remove scenario wrapper
3. Make workflow more generic/parameterized
4. Update documentation

---

## Validation Hook

Create a hook that validates before creation:

**File:** `.claude/hooks/workflow-scenario-validator.js`

```javascript
#!/usr/bin/env node

const userPrompt = process.env.USER_PROMPT || '';

// Detect creation intent
const createWorkflowPattern = /create.*workflow|new workflow|workflow.*for/i;
const createScenarioPattern = /create.*scenario|new scenario|scenario.*for/i;

if (createWorkflowPattern.test(userPrompt)) {
  console.log('\n📋 Creating WORKFLOW - Validation Checklist:');
  console.log('   • Single technical purpose? (should be YES)');
  console.log('   • Reusable across scenarios? (should be YES)');
  console.log('   • Linear flow (no major branching)? (should be YES)');
  console.log('   • Uses 2-5 components? (should be YES)');
  console.log('   • Domain-specific business logic? (should be NO)\n');
  console.log('   If checklist fails → Consider SCENARIO instead\n');
  console.log('   See: Docs/workflows/templates/VALIDATION_RULES.md\n');
}

if (createScenarioPattern.test(userPrompt)) {
  console.log('\n📋 Creating SCENARIO - Validation Checklist:');
  console.log('   • Complete business process? (should be YES)');
  console.log('   • Uses 3+ workflows? (should be YES)');
  console.log('   • Has branching/decision points? (should be YES)');
  console.log('   • Domain-specific? (should be YES)');
  console.log('   • Single technical purpose? (should be NO)\n');
  console.log('   If checklist fails → Consider WORKFLOW instead\n');
  console.log('   See: Docs/scenarios/templates/VALIDATION_RULES.md\n');
}

process.exit(0);
```

**Installation:**
```bash
cat > .claude/hooks/workflow-scenario-validator.js << 'EOF'
[paste code above]
EOF

chmod +x .claude/hooks/workflow-scenario-validator.js
```

---

## Examples with Classification

### Example 1: "GitHub PR Automation"

**User Request:** "Automate GitHub pull request creation with code review checklist and automatic labeling"

**Validation Analysis:**
```javascript
{
  purposes: ['Automate PR creation'],
  components: ['GitHub MCP', 'PR template', 'label automation'],
  hasBranching: false,
  hasDecisionPoints: false,
  reusable: true,
  domain: null,
  workflowsUsed: 0
}

workflowScore: 0.9
scenarioScore: 0.2

Decision: WORKFLOW
Confidence: HIGH (0.7)
```

**Classification:** ✅ WORKFLOW
**Reasoning:** Single technical purpose, reusable, linear, no business logic

---

### Example 2: "SaaS Customer Journey"

**User Request:** "Manage customer from trial signup through conversion to paid, including onboarding emails, feature access, payment processing, and support handoff"

**Validation Analysis:**
```javascript
{
  purposes: ['trial signup', 'onboarding', 'conversion', 'payment', 'support'],
  components: [],
  hasBranching: true,  // trial vs paid
  hasDecisionPoints: true,  // conversion decision
  reusable: false,
  domain: 'SaaS',
  workflowsUsed: 5  // email, auth, payment, support, analytics
}

workflowScore: 0.2
scenarioScore: 0.9

Decision: SCENARIO
Confidence: HIGH (0.7)
```

**Classification:** ✅ SCENARIO
**Reasoning:** Complete business process, multiple workflows, branching, domain-specific

---

### Example 3: "Stripe Subscription Management"

**User Request:** "Handle Stripe subscriptions including creation, updates, cancellations, and webhook processing"

**Validation Analysis:**
```javascript
{
  purposes: ['subscription management'],
  components: ['Stripe MCP', 'webhook handler', 'subscription commands'],
  hasBranching: false,
  hasDecisionPoints: false,
  reusable: true,  // reusable across any app using Stripe
  domain: null,  // not domain-specific
  workflowsUsed: 0
}

workflowScore: 0.8
scenarioScore: 0.3

Decision: WORKFLOW
Confidence: MEDIUM (0.5)
```

**Classification:** ✅ WORKFLOW
**Reasoning:** Single purpose (Stripe integration), reusable, technical focus

**Note:** Even though it has multiple operations (create, update, cancel), it's still ONE purpose: manage Stripe subscriptions

---

## Quick Reference Card

### WORKFLOW = "HOW to do something technical"
- Single technical purpose
- Reusable across domains
- Component-based (2-5 components)
- Linear flow
- No business branching

**Example:** "Task Master MCP Integration"

---

### SCENARIO = "WHAT business process to accomplish"
- Complete business solution
- Domain-specific
- Workflow composition (3+ workflows)
- Branching/decision logic
- Business outcomes

**Example:** "Shopify Client Onboarding & Delivery"

---

## Enforcement

### CLI Validation (Future Enhancement)

```bash
# Validate before creation
claude workflow validate "description of workflow"

# Output:
# ✓ Classification: WORKFLOW (confidence: 0.85)
# ✓ No warnings
# Ready to create

# OR

# ⚠ Classification: SCENARIO (confidence: 0.75)
# ⚠ This appears to be a scenario, not a workflow
# Suggestions:
#   - Create as scenario instead
#   - Break into multiple workflows
```

### Documentation Enforcement

**All workflow/scenario documentation must include:**

```markdown
## Classification Justification

**Type:** [Workflow | Scenario]

**Validation Checklist:**
- [ ] [Criterion 1] - [YES/NO] - [Reasoning]
- [ ] [Criterion 2] - [YES/NO] - [Reasoning]
...

**Decision:** [Type] based on [reasoning]
```

---

**Last Updated:** 2025-11-08
**Maintainer:** Orchestrator Project Team
