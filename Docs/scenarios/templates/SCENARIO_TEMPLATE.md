# Scenario: [Scenario Name]

**Domain:** [E-commerce | SaaS | Agency | Consulting | Internal Tools | Other]

**Complexity Level:** [Beginner | Intermediate | Advanced | Expert]

**Business Model:** [Description of business context - e.g., "B2B agency providing Shopify development services"]

**Version:** 1.0
**Date:** YYYY-MM-DD
**Status:** [Template | Draft | Production Ready]

---

## Executive Summary

### Business Context
[High-level description of the business scenario - what problem does this solve for the business?]

### Key Stakeholders

| Role | Responsibilities | Interaction Points |
|------|------------------|-------------------|
| [Role 1] | [What they do] | [When they engage with scenario] |
| [Role 2] | [What they do] | [When they engage] |
| [Role 3] | [What they do] | [When they engage] |

### Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| [Metric 1] | [Target value] | [How to measure] |
| [Metric 2] | [Target value] | [How to measure] |
| [Metric 3] | [Target value] | [How to measure] |

### ROI Analysis

**Time Savings:**
- Manual process: [X hours]
- Automated scenario: [Y hours]
- Savings: [Z%]

**Quality Improvements:**
- [Improvement 1]
- [Improvement 2]

**Cost Reduction:**
- [Cost area 1]: [Reduction]
- [Cost area 2]: [Reduction]

---

## Scenario Overview

### The Problem

**Current State:**
[Detailed description of the current manual/inefficient process]

**Pain Points:**
- [Pain point 1]
- [Pain point 2]
- [Pain point 3]

**Impact:**
- Business impact: [Description]
- User impact: [Description]
- Team impact: [Description]

### The Solution

**Target State:**
[How this scenario solves the problem using orchestrated workflows]

**Key Improvements:**
1. **[Improvement area]:** [Specific improvement]
2. **[Improvement area]:** [Specific improvement]
3. **[Improvement area]:** [Specific improvement]

### Expected Outcomes

**Business Outcomes:**
- [Outcome 1]
- [Outcome 2]

**User Outcomes:**
- [Outcome 1]
- [Outcome 2]

**Technical Outcomes:**
- [Outcome 1]
- [Outcome 2]

---

## Workflow Composition

This scenario composes the following workflows:

| Workflow | Purpose in Scenario | Phase Used | Critical Path |
|----------|---------------------|------------|---------------|
| [Workflow 1](../../workflows/library/workflow-1/WORKFLOW.md) | [Purpose] | Phase 1 | ✓ Critical |
| [Workflow 2](../../workflows/library/workflow-2/WORKFLOW.md) | [Purpose] | Phase 2-3 | Optional |
| [Workflow 3](../../workflows/library/workflow-3/WORKFLOW.md) | [Purpose] | Phase 4 | ✓ Critical |

**Workflow Dependencies:**
```
Workflow 1 (Foundation)
    │
    ├─→ Workflow 2 (Enhancement) [Optional]
    │
    └─→ Workflow 3 (Completion) [Required]
```

---

## Scenario Flow

### Phase 1: [Initial Phase Name]

**Trigger:** [What starts this phase - user action, schedule, event, etc.]

**Duration:** [Expected time to complete]

**Workflows Used:**
- [Workflow name] → [Specific steps/operations]

**Inputs:**
| Input | Source | Format | Required |
|-------|--------|--------|----------|
| [Input 1] | [Where it comes from] | [Data type] | Yes/No |
| [Input 2] | [Source] | [Format] | Yes/No |

**Outputs:**
| Output | Destination | Format | Used In |
|--------|-------------|--------|---------|
| [Output 1] | [Where it goes] | [Data type] | Phase 2 |
| [Output 2] | [Destination] | [Format] | Phase 3 |

**Decision Points:**
```
IF [condition]:
    → Branch to Phase 2A
ELSE IF [condition]:
    → Branch to Phase 2B
ELSE:
    → Default to Phase 2C
```

**Success Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

**Error Handling:**
| Error | Recovery Action | Fallback |
|-------|----------------|----------|
| [Error 1] | [How to recover] | [Fallback option] |

### Phase 2A: [Branch Name - First Option]

**Trigger:** [Condition from Phase 1]

**Duration:** [Expected time]

**Workflows Used:**
- [Workflow name] → [Specific operations]

**Inputs:**
[Same structure as Phase 1]

**Outputs:**
[Same structure]

**Decision Points:**
```
IF [condition]:
    → Continue to Phase 3
ELSE:
    → Loop back to Phase 2A validation
```

**Success Criteria:**
- [ ] [Criterion]

### Phase 2B: [Branch Name - Alternate Option]

**Trigger:** [Different condition from Phase 1]

**Duration:** [Expected time]

[Similar structure to Phase 2A]

### Phase 3: [Convergence Phase]

**Trigger:** [Completion of Phase 2A OR Phase 2B]

**Duration:** [Expected time]

**Workflows Used:**
- [Workflow name]

**Note:** All branches converge here

[Continue with similar structure]

### Phase N: [Final Phase]

**Trigger:** [Completion of previous phase]

**Duration:** [Expected time]

**Completion Criteria:**
- [ ] [All tasks completed]
- [ ] [Quality gates passed]
- [ ] [Handoff documentation ready]

---

## Decision Tree

### Visual Representation

```
START: [Initial Trigger]
    │
    ├─→ [Option 1]: [Description]
    │   ├─→ Workflow: [Name]
    │   ├─→ Decision Point
    │   │   ├─→ Path A → Phase 3
    │   │   └─→ Path B → Phase 2 (loop)
    │   └─→ Continue to Phase 3
    │
    ├─→ [Option 2]: [Description]
    │   ├─→ Workflow: [Name]
    │   └─→ Skip to Phase 4
    │
    └─→ [Option 3]: [Description]
        ├─→ Workflow: [Name]
        ├─→ Additional Workflow: [Name]
        └─→ Continue to Phase 3
```

### Decision Logic

**Decision Point 1: [Name]**

| Condition | Action | Reasoning |
|-----------|--------|-----------|
| [Condition 1] | Go to Phase 2A | [Why] |
| [Condition 2] | Go to Phase 2B | [Why] |
| [Default] | Go to Phase 2C | [Why] |

**Decision Point 2: [Name]**

[Similar structure]

---

## Complete Example Execution

### Sample Case: "[Example Business Name]"

**Profile:**
- Industry: [Industry]
- Size: [Company size]
- Package/Tier: [Service level]
- Special Requirements: [Any special needs]

### Step-by-Step Execution

#### Phase 1: [Phase Name]

**Date/Time:** 2025-11-08 10:00:00

**Action:**
```bash
/command-name --option="value" --client="example-business"
```

**System Processing:**
```
→ Hook: Detected client onboarding trigger
→ MCP: Created client record in database
→ Agent: Generated customized intake form
→ Email: Sent welcome message with form link
```

**Output:**
```
✓ Client record created: client-example-business-001
✓ Welcome email sent to contact@example.com
✓ Intake form generated: https://forms.example.com/example-business
✓ Payment processed: $1,500 (30% upfront)

→ Next: Wait for form completion (Phase 2)
→ Reminder scheduled: 2025-11-10 10:00:00
```

**Data Created:**
```json
{
  "id": "client-example-business-001",
  "name": "Example Business",
  "email": "contact@example.com",
  "status": "form-pending",
  "createdAt": "2025-11-08T10:00:00Z",
  "currentPhase": 1,
  "nextAction": {
    "type": "wait-for-form",
    "reminderDate": "2025-11-10T10:00:00Z"
  }
}
```

#### Phase 2: [Phase Name]

**Date/Time:** 2025-11-09 14:30:00

**Trigger:** Form completed by client

**System Processing:**
```
→ Hook: Detected form submission
→ MCP: Retrieved form responses
→ Agent: Analyzed requirements
→ Auto-load: Client context loaded
```

**Action:** (Automatic - no user command needed)

**Output:**
```
✓ Form responses received
✓ Requirements analyzed: 15 custom features identified
✓ Client context updated
✓ Moving to Phase 3 (Review generation)
```

[Continue through all phases with detailed examples]

---

## Data Structures

### Client Record Schema

```json
{
  "id": "string (UUID)",
  "name": "string",
  "email": "string (email format)",
  "package": "small | medium | large",
  "status": "pending | in-progress | in-review | completed | cancelled",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp",
  "currentPhase": "integer (1-N)",
  "metadata": {
    "industry": "string",
    "companySize": "string",
    "specialRequirements": ["string"],
    "assignedTeam": ["string"]
  },
  "formData": {
    "formUrl": "string (URL)",
    "submittedAt": "ISO 8601 timestamp",
    "responses": {
      "question1": "answer1",
      "question2": "answer2"
    }
  },
  "paymentStatus": {
    "upfront": {
      "amount": "number",
      "paid": "boolean",
      "paidAt": "ISO 8601 timestamp",
      "transactionId": "string"
    },
    "review": {
      "amount": "number",
      "paid": "boolean",
      "paidAt": "ISO 8601 timestamp | null",
      "transactionId": "string | null"
    },
    "completion": {
      "amount": "number",
      "paid": "boolean",
      "paidAt": "ISO 8601 timestamp | null",
      "transactionId": "string | null"
    }
  },
  "deliverables": {
    "stagingUrl": "string | null",
    "productionUrl": "string | null",
    "documentationUrl": "string | null"
  },
  "communications": [
    {
      "type": "email | phone | meeting",
      "timestamp": "ISO 8601",
      "subject": "string",
      "summary": "string"
    }
  ]
}
```

### Workflow State Schema

```json
{
  "scenarioId": "string",
  "clientId": "string",
  "currentPhase": "integer",
  "currentWorkflow": "string",
  "startedAt": "ISO 8601",
  "estimatedCompletion": "ISO 8601",
  "phaseHistory": [
    {
      "phase": "integer",
      "startedAt": "ISO 8601",
      "completedAt": "ISO 8601",
      "duration": "number (milliseconds)",
      "outcome": "success | failure | skipped"
    }
  ],
  "decisions": [
    {
      "decisionPoint": "string",
      "timestamp": "ISO 8601",
      "condition": "string",
      "action": "string",
      "reasoning": "string"
    }
  ]
}
```

---

## Customization Points

### Branching Logic Customization

**Location:** `components/decision-logic.js`

```javascript
/**
 * Determine which phase to execute next
 * @param {Object} client - Client record
 * @param {Object} context - Current scenario context
 * @returns {string} - Next phase identifier
 */
function determineNextPhase(client, context) {
  // Customize this logic for your needs

  if (client.package === 'small') {
    return 'basic-flow';
  }

  if (client.package === 'medium' && client.metadata.customFeatures > 10) {
    return 'medium-custom-flow';
  }

  if (client.package === 'large') {
    return 'enterprise-flow';
  }

  return 'standard-flow';
}

module.exports = { determineNextPhase };
```

### Workflow Substitution

Replace default workflows with alternatives based on your needs:

| Phase | Default Workflow | Alternative Options | When to Use Alternative |
|-------|-----------------|---------------------|------------------------|
| Onboarding | Standard Onboarding | [Custom Onboarding](../../workflows/library/custom-onboarding/) | High-touch clients |
| Payment | Stripe Integration | [PayPal](../../workflows/library/paypal-integration/), Manual Invoice | Different payment processor |
| Review | Automated Review | Manual Review Process | Complex requirements |

**How to Substitute:**
1. Review alternative workflow documentation
2. Update `workflows-used.md` to reference new workflow
3. Modify phase definitions to use new workflow steps
4. Test substitution with sample data

### Custom Fields

Add custom fields to data structures:

```json
{
  "customFields": {
    "field1": "value1",
    "field2": "value2"
  }
}
```

**Update schema validation:**
```javascript
// validation.js
const customFieldSchema = {
  field1: { type: 'string', required: false },
  field2: { type: 'number', required: false }
};
```

---

## Dependencies

### External Services Required

- [ ] **[Service 1]** - [Purpose]
  - Pricing: [Free tier / Paid]
  - Setup guide: [Link]
  - API documentation: [Link]

- [ ] **[Service 2]** - [Purpose]
  - Pricing: [Free tier / Paid]
  - Setup guide: [Link]
  - API documentation: [Link]

### API Keys Needed

**File:** `.env`

```bash
# Service 1
SERVICE1_API_KEY=your-key-here
SERVICE1_SECRET=your-secret-here

# Service 2
SERVICE2_API_KEY=your-key-here

# Optional Services
OPTIONAL_SERVICE_KEY=your-key-here
```

**Setup Instructions:**
1. Copy `.env.example` to `.env`
2. Register for each service
3. Generate API keys
4. Add keys to `.env`
5. Never commit `.env` to version control

### Software Dependencies

```bash
# Node.js packages
npm install package1 package2

# System dependencies
brew install dependency1  # macOS
apt-get install dependency1  # Linux
```

### Project Setup

```bash
# 1. Clone scenario
cd Docs/scenarios/library/scenario-name/

# 2. Initialize Task Master (if used)
task-master init
task-master parse-prd --input=PRD.txt

# 3. Install components
cp -r components/hooks/* .claude/hooks/
cp -r components/agents/* .claude/agents/
cp -r components/commands/* .claude/commands/

# 4. Configure MCP (if used)
cp components/mcp-configs/.mcp.json .

# 5. Setup environment
cp .env.example .env
# Edit .env with your API keys

# 6. Test setup
./test-scenario.sh
```

---

## Monitoring & Analytics

### Key Metrics to Track

| Metric | Measurement | Target | Alert Threshold |
|--------|-------------|--------|-----------------|
| [Metric 1] | [How measured] | [Target] | [When to alert] |
| [Metric 2] | [How measured] | [Target] | [When to alert] |
| [Metric 3] | [How measured] | [Target] | [When to alert] |

### Dashboard Setup

**Recommended Tool:** [Grafana / Custom / etc.]

**Metrics to Display:**
- Active clients by phase
- Average time per phase
- Completion rate
- Payment collection rate
- Error rate by workflow

### Logging

**Log Location:** `.logs/scenario-name/`

**Log Format:**
```
[TIMESTAMP] [LEVEL] [PHASE] [CLIENT_ID] Message
```

**Example:**
```
2025-11-08T10:00:00Z [INFO] [PHASE-1] [client-001] Client onboarded successfully
2025-11-08T10:00:05Z [INFO] [PHASE-1] [client-001] Form sent to contact@example.com
2025-11-10T14:30:00Z [INFO] [PHASE-2] [client-001] Form completed by client
2025-11-10T14:30:15Z [WARN] [PHASE-2] [client-001] Unusual number of custom features: 25
```

**Log Rotation:**
```bash
# Rotate logs daily, keep 30 days
logrotate scenario-name.conf
```

---

## Troubleshooting

### Scenario-Specific Issues

#### Issue: Client Stuck in Phase

**Symptoms:**
- Client has been in same phase > expected duration
- No progress updates
- Automated actions not triggering

**Diagnosis:**
```bash
# Check client status
mcp__database__query --table=clients --id=client-001

# Check workflow state
cat .state/client-001-workflow.json

# Review logs
grep "client-001" .logs/scenario-name/$(date +%Y-%m-%d).log
```

**Solutions:**

1. **Manual phase advancement:**
   ```bash
   /advance-phase --client-id=client-001 --to-phase=3 --reason="Manual intervention"
   ```

2. **Retry automated actions:**
   ```bash
   /retry-workflow --client-id=client-001 --workflow=form-sender
   ```

3. **Contact client manually:**
   - Review phase requirements
   - Send personalized follow-up
   - Update notes in client record

#### Issue: Payment Processing Failed

**Symptoms:**
- Payment marked as failed
- Client cannot proceed to next phase

**Diagnosis:**
```bash
# Check payment status
mcp__stripe__get_payment --transaction-id=txn_123

# Review error logs
grep "payment.*failed" .logs/scenario-name/*.log
```

**Solutions:**

1. **Retry payment:**
   ```bash
   /retry-payment --client-id=client-001 --phase=review
   ```

2. **Manual payment recording:**
   ```bash
   /record-manual-payment --client-id=client-001 --amount=2000 --phase=review
   ```

#### Issue: Data Sync Errors

**Symptoms:**
- Client data inconsistent
- Workflows using outdated information

**Diagnosis:**
```bash
# Validate data integrity
./scripts/validate-client-data.sh client-001
```

**Solution:**
```bash
# Force data refresh
/sync-client-data --client-id=client-001 --force
```

---

## Testing

### Test Scenarios

#### Test 1: Happy Path - Small Package

```bash
# Initialize test
./tests/test-small-package.sh

# Expected: Complete all phases without errors
# Duration: ~5 minutes (automated)
```

#### Test 2: Branch Testing - Medium Package with Custom Features

```bash
./tests/test-medium-custom.sh

# Expected: Triggers custom workflow branch
# Duration: ~8 minutes
```

#### Test 3: Error Recovery

```bash
./tests/test-error-recovery.sh

# Expected: Gracefully handles payment failure, form timeout
# Duration: ~10 minutes
```

### Sample Data

**Location:** `example-data/`

```
example-data/
├── clients/
│   ├── client-small.json
│   ├── client-medium.json
│   └── client-large.json
├── form-responses/
│   ├── form-basic.json
│   └── form-custom.json
└── payment-records/
    └── sample-payments.json
```

---

## Extensions

### Adding New Phases

1. **Define phase in scenario flow**
   - Add to SCENARIO.md
   - Update decision tree

2. **Create phase workflow**
   ```bash
   cp ../../workflows/templates/WORKFLOW_TEMPLATE.md \
      components/workflows/phase-new.md
   ```

3. **Update decision logic**
   ```javascript
   // decision-logic.js
   function determineNextPhase(client, context) {
     // Add new phase logic
     if (needsNewPhase(client)) {
       return 'phase-new';
     }
   }
   ```

4. **Test phase integration**
   ```bash
   ./tests/test-new-phase.sh
   ```

### Integrating Additional Services

1. **Add to dependencies**
   - Update `.env.example`
   - Document in Dependencies section

2. **Create MCP configuration** (if external API)
   ```json
   {
     "mcpServers": {
       "new-service": { ... }
     }
   }
   ```

3. **Update workflows**
   - Modify existing workflows or create new ones
   - Update phase definitions

4. **Test integration**
   ```bash
   ./tests/test-new-service.sh
   ```

---

## Performance & Scalability

### Performance Targets

| Load Level | Concurrent Clients | Response Time | Success Rate |
|------------|-------------------|---------------|--------------|
| Low | 1-10 | < 2s | > 99% |
| Medium | 10-50 | < 5s | > 98% |
| High | 50-100 | < 10s | > 95% |

### Bottlenecks

**Identified Bottlenecks:**
1. **[Bottleneck 1]:** [Description]
   - Impact: [Performance impact]
   - Mitigation: [How to address]

2. **[Bottleneck 2]:** [Description]
   - Impact: [Impact]
   - Mitigation: [Solution]

### Scaling Recommendations

**For < 50 clients/month:**
- Current setup sufficient
- Single instance MCP servers
- Local database

**For 50-200 clients/month:**
- Implement connection pooling
- Add caching layer
- Consider database scaling

**For 200+ clients/month:**
- Distributed MCP servers
- Load balancer
- Database replication
- Queue-based processing

---

## Related Scenarios

### Similar Scenarios
- [Scenario X](../scenario-x/SCENARIO.md) - Similar domain, different scale
- [Scenario Y](../scenario-y/SCENARIO.md) - Related business model

### Prerequisites
- [Foundational Scenario](../foundation/SCENARIO.md) - Complete this first

### Next Steps
- [Advanced Scenario](../advanced/SCENARIO.md) - Building on this scenario

---

## Changelog

### v1.0 (YYYY-MM-DD)
- Initial scenario definition
- Core workflows integrated
- Decision tree established
- Sample data provided

### v1.1 (YYYY-MM-DD)
- Added [feature/workflow]
- Performance improvements
- Bug fixes

---

## Support & Feedback

**Maintainer:** [Name/Team]

**Issues:** [GitHub Issues link / Email]

**Documentation:** [Wiki link]

**Community:** [Slack/Discord link]

---

**License:** [License information if applicable]
