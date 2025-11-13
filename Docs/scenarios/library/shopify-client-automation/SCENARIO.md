# Scenario: Shopify Client Automation - E-commerce Agency Workflow

**Domain:** E-commerce | Agency Services

**Complexity Level:** Intermediate

**Business Model:** B2B agency providing Shopify site development services with tiered packages (Small, Medium, Large)

**Version:** 1.0
**Date:** 2025-11-08
**Status:** Production Ready

---

## Executive Summary

### Business Context

E-commerce agency provides Shopify site development services to clients. Current manual process involves extensive back-and-forth communication, manual form distribution, review coordination, and payment tracking. This scenario automates the entire client journey from initial sign-up through final delivery.

### Key Stakeholders

| Role | Responsibilities | Interaction Points |
|------|------------------|-------------------|
| Client | Provides requirements, reviews work, approves deliverables | Sign-up, form completion, review approval, final sign-off |
| Agency Developer | Implements site customizations, generates review builds | After form completion, during development, at handover |
| Project Manager | Monitors progress, sends reminders, handles escalations | Throughout entire process |
| Payment System | Processes milestone payments (30/40/30 split) | Sign-up, review approval, completion |

### Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Onboarding Speed | < 5 min | Time from signup to form sent |
| Form Completion Rate | > 80% | Completed forms / Total sent |
| Review Turnaround | < 48 hours | Review sent → Client approval |
| Payment Success Rate | > 95% | Successful charges / Attempts |
| Client Satisfaction | > 4.5/5 | Post-delivery survey |

### ROI Analysis

**Time Savings:**
- Manual process: 8-12 hours per client (communication, tracking, coordination)
- Automated scenario: 2-3 hours per client (actual development work only)
- Savings: 75% reduction in non-development time

**Quality Improvements:**
- Consistent onboarding experience
- No missed follow-ups (automated reminders)
- Complete requirements capture (structured forms)
- Payment milestone enforcement

**Cost Reduction:**
- Reduced project manager overhead: 6 hours per client
- Fewer payment collection issues: 95%+ first-attempt success
- Less context switching: Developers focus on development

---

## Scenario Overview

### The Problem

**Current State:**
1. Client signs up via website form
2. PM manually emails intake questionnaire
3. PM manually follows up if no response (often forgotten)
4. PM manually compiles requirements from scattered emails
5. Developer builds site from incomplete specs
6. PM manually coordinates review with client
7. PM manually sends payment links at milestones
8. PM manually handles handover documentation

**Pain Points:**
- Manual follow-ups frequently missed (30% of clients)
- Scattered communication leads to missed requirements
- Payment milestones not enforced (cash flow issues)
- Handover documentation inconsistent
- High context-switching overhead for PM
- No visibility into pipeline status

**Impact:**
- Business impact: Delayed payments, inconsistent cash flow
- User impact: Confused clients, unclear expectations
- Team impact: PM burnout, developer waiting on requirements

### The Solution

**Target State:**
Fully automated client workflow with:
- Instant onboarding with welcome email + intake form
- Automatic reminders for incomplete forms (48-hour intervals)
- Structured requirements collection (no missed details)
- Automated review site generation + client notification
- Payment milestone automation (30% upfront, 40% review, 30% completion)
- Standardized handover with documentation package

**Key Improvements:**
1. **Zero manual follow-ups:** Automated reminder system
2. **Complete requirements:** Structured form with validation
3. **Payment enforcement:** Cannot proceed without payment
4. **Consistent handover:** Templated documentation
5. **Pipeline visibility:** Real-time status tracking

### Expected Outcomes

**Business Outcomes:**
- 95%+ on-time payment collection
- 30% reduction in project manager workload
- 50% faster client onboarding (5 min vs 2+ hours)
- Predictable revenue from milestone payments

**User Outcomes:**
- Clear expectations at every phase
- Timely communication (no waiting for responses)
- Professional, consistent experience
- Self-service status tracking

**Technical Outcomes:**
- Automated workflow reduces errors
- Structured data enables reporting
- Integration with existing tools (Stripe, Google Forms, Shopify)
- Scalable process (handles 10x clients without 10x staff)

---

## Workflow Composition

This scenario composes the following workflows:

| Workflow | Purpose in Scenario | Phase Used | Critical Path |
|----------|---------------------|------------|---------------|
| [Task Master Integration](../../workflows/library/task-master-integration/WORKFLOW.md) | Project task tracking | All phases | Optional |
| Payment Processing (Stripe MCP) | Handle milestone payments | Phases 1, 3, 5 | ✓ Critical |
| Form Distribution (Google Forms MCP) | Send + track intake forms | Phase 2 | ✓ Critical |
| Email Automation (SendGrid MCP) | Client communications | All phases | ✓ Critical |
| Site Deployment (Shopify MCP) | Create staging/production sites | Phase 4 | ✓ Critical |

**Workflow Dependencies:**
```
Phase 1: Client Onboarding
    ├─→ Email Automation (send welcome)
    └─→ Payment Processing (30% upfront)
        │
        ▼
Phase 2: Form Collection
    ├─→ Form Distribution (send form)
    └─→ Email Automation (reminders)
        │
        ▼
Phase 3: Development + Review
    ├─→ Site Deployment (create staging)
    ├─→ Email Automation (review notification)
    └─→ Payment Processing (40% at review)
        │
        ▼
Phase 4: Finalization
    ├─→ Site Deployment (create production)
    └─→ Email Automation (handover docs)
        │
        ▼
Phase 5: Completion
    ├─→ Payment Processing (final 30%)
    └─→ Email Automation (thank you + survey)
```

---

## Scenario Flow

### Phase 1: Client Onboarding

**Trigger:** Client completes sign-up form on agency website

**Duration:** < 5 minutes (automated)

**Workflows Used:**
- Email Automation → Send welcome email
- Payment Processing → Charge 30% upfront

**Inputs:**
| Input | Source | Format | Required |
|-------|--------|--------|----------|
| Client Name | Sign-up form | String | Yes |
| Client Email | Sign-up form | Email | Yes |
| Package Selected | Sign-up form | Enum (small/medium/large) | Yes |
| Payment Method | Sign-up form | Stripe token | Yes |

**Outputs:**
| Output | Destination | Format | Used In |
|--------|-------------|--------|---------|
| Client ID | Database | UUID | All phases |
| Client Record | `.clients/` directory | JSON | All phases |
| Payment Receipt | Client email | PDF | Client records |
| Intake Form URL | Client email | URL | Phase 2 |

**Decision Points:**
```
Package validation:
IF package NOT IN ['small', 'medium', 'large']:
    → Show error, request valid package
ELSE:
    → Continue to payment

Payment processing:
IF payment successful:
    → Create client record, send welcome email
ELSE IF payment failed:
    → Retry payment with error details
ELSE IF payment method invalid:
    → Request valid payment method
```

**Success Criteria:**
- [x] Client record created with unique ID
- [x] 30% upfront payment processed successfully
- [x] Welcome email sent within 1 minute
- [x] Intake form URL included in welcome email

**Error Handling:**
| Error | Recovery Action | Fallback |
|-------|----------------|----------|
| Payment failed | Retry with detailed error message | Manual payment link |
| Email delivery failed | Log error, retry after 5 min | Manual email notification |
| Form generation failed | Create manual form link | Google Forms default template |

### Phase 2: Form Collection & Requirements Gathering

**Trigger:** Client receives welcome email with form link

**Duration:** 1-7 days (client-dependent, automated reminders every 48 hours)

**Workflows Used:**
- Form Distribution → Track completion status
- Email Automation → Send reminders if incomplete

**Inputs:**
| Input | Source | Format | Required |
|-------|--------|--------|----------|
| Client ID | Phase 1 output | UUID | Yes |
| Form URL | Phase 1 output | URL | Yes |

**Outputs:**
| Output | Destination | Format | Used In |
|--------|-------------|--------|---------|
| Form Responses | `.clients/[id]/form-data.json` | JSON | Phase 3 |
| Requirements Summary | Claude context | Markdown | Phase 3 |

**Decision Points:**
```
Form completion check (runs daily via sub-agent):
IF form NOT completed AND (current_time - last_reminder) > 48 hours:
    → Send reminder email
    → Log reminder in client record
ELSE IF form completed:
    → Notify PM/Developer
    → Move to Phase 3
ELSE:
    → Wait (form pending, reminder sent recently)
```

**Success Criteria:**
- [x] Client receives form link in welcome email
- [x] Automated reminders sent every 48 hours until completion
- [x] Form completion detected within 1 hour
- [x] Requirements parsed and validated

**Automation:**
Sub-agent `form-completion-monitor` runs daily:
```javascript
// Pseudo-code for monitoring agent
for each client in status "form-pending":
  if form not completed:
    if time_since_last_reminder > 48h:
      send_reminder_email(client)
      log_reminder(client, timestamp)
  else:
    mark_form_complete(client)
    notify_team(client)
    trigger_phase_3(client)
```

### Phase 3: Development & Review

**Trigger:** Form completion detected by monitoring agent

**Duration:** 3-10 days (package-dependent)

**Workflows Used:**
- Site Deployment → Create staging site
- Email Automation → Notify client of review
- Payment Processing → Charge 40% review payment

**Inputs:**
| Input | Source | Format | Required |
|-------|--------|--------|----------|
| Form Responses | Phase 2 output | JSON | Yes |
| Package Level | Client record | Enum | Yes |

**Outputs:**
| Output | Destination | Format | Used In |
|--------|-------------|--------|---------|
| Staging Site URL | Client record | URL | Client review |
| Review Feedback | `.clients/[id]/review.json` | JSON | Phase 4 |

**Decision Points:**
```
Package-based complexity:
IF package == 'small':
    → Use basic template (1-2 days dev)
    → Skip custom features
ELSE IF package == 'medium':
    → Custom template (3-5 days dev)
    → Include form-specified features
ELSE IF package == 'large':
    → Fully custom (7-10 days dev)
    → Include advanced features + custom code

Review approval:
IF client approves staging site:
    → Process 40% payment
    → Move to Phase 4 (finalization)
ELSE IF client requests changes:
    → Log changes
    → Update staging site
    → Re-notify for review (loop)
ELSE IF no response after 5 days:
    → Send reminder
    → Escalate to PM if no response after 7 days
```

**Success Criteria:**
- [x] Staging site created with client requirements
- [x] Client notified within 1 hour of staging ready
- [x] Review feedback collected
- [x] 40% payment processed on approval

### Phase 4: Finalization & Production Deployment

**Trigger:** Client approves staging site and 40% payment processed

**Duration:** 1-2 days

**Workflows Used:**
- Site Deployment → Deploy to production
- Email Automation → Send handover documentation

**Inputs:**
| Input | Source | Format | Required |
|-------|--------|--------|----------|
| Approved Staging Site | Phase 3 | Shopify site ID | Yes |
| Review Feedback | Phase 3 | JSON | No |

**Outputs:**
| Output | Destination | Format | Used In |
|--------|-------------|--------|---------|
| Production Site URL | Client record | URL | Phase 5 |
| Admin Credentials | Client email (secure) | Encrypted JSON | Client handover |
| Documentation Package | Client email | PDF | Client reference |

**Success Criteria:**
- [x] Production site deployed successfully
- [x] Admin credentials generated and securely sent
- [x] Documentation package includes: user guide, admin guide, support contacts
- [x] Client can access and manage site

### Phase 5: Completion & Final Payment

**Trigger:** Client confirms production site is ready

**Duration:** < 1 hour (automated)

**Workflows Used:**
- Payment Processing → Charge final 30%
- Email Automation → Send thank you + survey

**Inputs:**
| Input | Source | Format | Required |
|-------|--------|--------|----------|
| Production Site URL | Phase 4 | URL | Yes |
| Client Confirmation | Manual or automated | Boolean | Yes |

**Outputs:**
| Output | Destination | Format | Used In |
|--------|-------------|--------|---------|
| Final Payment Receipt | Client email | PDF | Client records |
| Satisfaction Survey Link | Client email | URL | Analytics |
| Project Complete Status | Database | Boolean | Reporting |

**Completion Criteria:**
- [x] Final 30% payment processed
- [x] Site ownership transferred to client
- [x] All project files archived
- [x] Client marked as "completed" in system

---

## Decision Tree

### Visual Representation

```
START: Client Sign-up
    │
    ├─→ Package: Small ($3,000)
    │   ├─→ Payment: $900 upfront (30%)
    │   ├─→ Form: Basic template (10 questions)
    │   ├─→ Development: 1-2 days
    │   ├─→ Review: $1,200 (40%)
    │   └─→ Complete: $900 (30%)
    │
    ├─→ Package: Medium ($7,000)
    │   ├─→ Payment: $2,100 upfront (30%)
    │   ├─→ Form: Standard template (25 questions)
    │   ├─→ Development: 3-5 days
    │   │   ├─→ IF custom features > 10:
    │   │   │   └─→ Add custom development workflow
    │   │   └─→ ELSE: Standard workflow
    │   ├─→ Review: $2,800 (40%)
    │   └─→ Complete: $2,100 (30%)
    │
    └─→ Package: Large ($15,000)
        ├─→ Payment: $4,500 upfront (30%)
        ├─→ Form: Comprehensive (50+ questions)
        ├─→ Development: 7-10 days
        │   ├─→ White-glove consultation (weekly calls)
        │   └─→ Custom code + integrations
        ├─→ Review: $6,000 (40%)
        │   ├─→ IF major changes requested:
        │   │   └─→ Schedule revision sprint
        │   └─→ ELSE: Standard review
        └─→ Complete: $4,500 (30%)

PHASE 2 BRANCH: Form Completion
    │
    ├─→ Form completed within 48 hours
    │   └─→ Skip reminders, proceed to development
    │
    ├─→ Form pending after 48 hours
    │   ├─→ Send reminder #1
    │   └─→ IF still pending after 96 hours:
    │       ├─→ Send reminder #2
    │       └─→ IF still pending after 7 days:
    │           └─→ Escalate to PM for manual outreach
    │
    └─→ Form abandoned (>14 days)
        └─→ Archive client, refund upfront payment (optional)

PHASE 3 BRANCH: Review Process
    │
    ├─→ Client approves immediately
    │   └─→ Proceed to Phase 4
    │
    ├─→ Client requests minor changes (< 3 items)
    │   ├─→ Implement changes (same day)
    │   └─→ Re-submit for review
    │
    ├─→ Client requests major changes (3+ items)
    │   ├─→ IF package == 'large': Include in scope
    │   └─→ ELSE: Discuss scope change (potential upsell)
    │
    └─→ No response after 5 days
        ├─→ Send review reminder
        └─→ IF no response after 7 days:
            └─→ PM manual outreach
```

---

## Complete Example Execution

### Sample Case: "Bella's Boutique"

**Profile:**
- Industry: Fashion retail
- Size: Small business (1-5 employees)
- Package: Medium ($7,000)
- Special Requirements: Instagram integration, email marketing

### Step-by-Step Execution

#### Phase 1: Client Onboarding
**Date/Time:** 2025-11-08 10:00:00

**Action:**
```bash
# Client submits sign-up form on agency website
# Triggers webhook → Claude Code automation

/onboard-client \
  --name="Bella's Boutique" \
  --email=owner@bellasboutique.com \
  --package=medium \
  --payment-method=tok_visa_4242
```

**System Processing:**
```
→ Hook: workflow-scenario-validator detects scenario execution
→ MCP: Stripe charges $2,100 (30% of $7,000)
→ Payment successful: txn_abc123
→ Client record created: client-bellas-boutique-001
→ MCP: Google Forms generates custom form (25 questions)
→ MCP: SendGrid sends welcome email with form link
```

**Output:**
```
✓ Client record created: client-bellas-boutique-001
✓ Payment processed: $2,100 (txn_abc123)
✓ Welcome email sent to owner@bellasboutique.com
✓ Intake form: https://forms.google.com/bellas-boutique

→ Next: Client completes form (Phase 2)
→ Automated reminder scheduled: 2025-11-10 10:00:00
```

**Data Created:**
```json
{
  "id": "client-bellas-boutique-001",
  "name": "Bella's Boutique",
  "email": "owner@bellasboutique.com",
  "package": "medium",
  "totalCost": 7000,
  "status": "form-pending",
  "createdAt": "2025-11-08T10:00:00Z",
  "currentPhase": 1,
  "paymentStatus": {
    "upfront": {
      "amount": 2100,
      "paid": true,
      "paidAt": "2025-11-08T10:00:05Z",
      "transactionId": "txn_abc123"
    },
    "review": { "amount": 2800, "paid": false, "paidAt": null },
    "completion": { "amount": 2100, "paid": false, "paidAt": null }
  },
  "formUrl": "https://forms.google.com/bellas-boutique",
  "nextAction": {
    "type": "wait-for-form",
    "reminderDate": "2025-11-10T10:00:00Z"
  }
}
```

#### Phase 2: Form Collection
**Date/Time:** 2025-11-09 14:30:00

**Trigger:** Client completes form (automated detection)

**System Processing:**
```
→ Sub-Agent: form-completion-monitor (runs every 6 hours)
→ Detected: Form submitted at 2025-11-09 14:30:00
→ MCP: Google Forms retrieves responses
→ Agent: Analyzes requirements
    • Product categories: Women's fashion, accessories
    • Custom features: Instagram feed integration
    • Email marketing: Klaviyo integration required
    • Design preferences: Minimalist, neutral colors
→ Auto-load: Client context updated
```

**Output:**
```
✓ Form responses received (25 questions answered)
✓ Requirements analyzed:
    • Instagram integration (custom feature)
    • Email marketing (Klaviyo)
    • 3 product categories
    • Minimalist design aesthetic
✓ Client status: form-pending → development
✓ Moving to Phase 3 (Development)

→ Next: Developer builds staging site
→ Estimated completion: 2025-11-13 (3-5 days for medium package)
```

#### Phase 3: Development & Review
**Date/Time:** 2025-11-12 16:00:00

**Action:** (Developer completes staging site)

```bash
/generate-review --client-id=client-bellas-boutique-001
```

**System Processing:**
```
→ MCP: Shopify creates staging site
    • Theme: Custom minimalist template
    • Products: Sample inventory added
    • Integrations: Instagram feed, Klaviyo email
→ MCP: SendGrid sends review notification email
→ Email includes:
    • Staging URL: https://bellas-staging.myshopify.com
    • Admin credentials (encrypted)
    • Review checklist
    • Approve/Request Changes buttons
```

**Output:**
```
✓ Staging site created: https://bellas-staging.myshopify.com
✓ Review email sent to owner@bellasboutique.com
✓ Client status: development → in-review

→ Next: Wait for client review
→ Reminder scheduled: 2025-11-17 (if no response in 5 days)
```

**Date/Time:** 2025-11-13 09:15:00

**Trigger:** Client approves staging site

**System Processing:**
```
→ Hook: Detects approval webhook from review link
→ MCP: Stripe charges $2,800 (40% payment)
→ Payment successful: txn_def456
→ Client status: in-review → approved
```

**Output:**
```
✓ Client approved staging site
✓ Payment processed: $2,800 (txn_def456)
✓ Total paid: $4,900 / $7,000 (70%)

→ Next: Deploy to production (Phase 4)
```

#### Phase 4: Production Deployment
**Date/Time:** 2025-11-13 10:00:00

**Action:**
```bash
/complete-handover --client-id=client-bellas-boutique-001
```

**System Processing:**
```
→ MCP: Shopify creates production site
    • Domain: bellasboutique.com (client-provided)
    • Theme: From approved staging
    • Products: Real inventory (client uploads)
→ Agent: Generates documentation package
    • User Guide: Managing products, processing orders
    • Admin Guide: Theme customization, app settings
    • Support contacts: Email, phone, knowledge base
→ MCP: SendGrid sends handover email
    • Production URL: https://bellasboutique.com
    • Admin credentials (secure)
    • Documentation PDF attached
```

**Output:**
```
✓ Production site deployed: https://bellasboutique.com
✓ Documentation package generated (23 pages)
✓ Handover email sent with secure credentials
✓ Client status: approved → completed

→ Next: Final payment (Phase 5)
```

#### Phase 5: Completion
**Date/Time:** 2025-11-13 10:30:00

**Trigger:** Client confirms site is ready

**System Processing:**
```
→ MCP: Stripe charges final $2,100 (30%)
→ Payment successful: txn_ghi789
→ MCP: SendGrid sends completion email
    • Thank you message
    • Satisfaction survey link
    • Referral discount code
→ Client status: completed → archived
```

**Output:**
```
✓ Final payment processed: $2,100 (txn_ghi789)
✓ Total paid: $7,000 / $7,000 (100%)
✓ Satisfaction survey sent
✓ Project marked as COMPLETE

🎉 Project Duration: 5 days (2025-11-08 to 2025-11-13)
📊 Client Lifecycle: Onboarding → Form (1 day) → Development (3 days) → Deploy (1 day) → Complete
```

---

## Data Structures

### Client Record Schema

See [example-data/clients/client-schema.json](example-data/clients/client-schema.json)

```json
{
  "id": "string (UUID)",
  "name": "string",
  "email": "string (email format)",
  "package": "small | medium | large",
  "totalCost": "number",
  "status": "form-pending | development | in-review | approved | completed | cancelled",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp",
  "currentPhase": "integer (1-5)",
  "paymentStatus": {
    "upfront": {
      "amount": "number",
      "percentage": 30,
      "paid": "boolean",
      "paidAt": "ISO 8601 | null",
      "transactionId": "string | null"
    },
    "review": {
      "amount": "number",
      "percentage": 40,
      "paid": "boolean",
      "paidAt": "ISO 8601 | null",
      "transactionId": "string | null"
    },
    "completion": {
      "amount": "number",
      "percentage": 30,
      "paid": "boolean",
      "paidAt": "ISO 8601 | null",
      "transactionId": "string | null"
    }
  },
  "formData": {
    "formUrl": "string (URL)",
    "submittedAt": "ISO 8601 | null",
    "responses": "object | null"
  },
  "sites": {
    "staging": {
      "url": "string (URL) | null",
      "shopifyId": "string | null",
      "createdAt": "ISO 8601 | null"
    },
    "production": {
      "url": "string (URL) | null",
      "shopifyId": "string | null",
      "deployedAt": "ISO 8601 | null"
    }
  },
  "communications": [
    {
      "type": "email | phone | meeting",
      "timestamp": "ISO 8601",
      "subject": "string",
      "summary": "string",
      "automated": "boolean"
    }
  ],
  "metadata": {
    "industry": "string",
    "referralSource": "string",
    "notes": "string"
  }
}
```

---

## Dependencies

### External Services Required

- [x] **Stripe** - Payment processing
  - Pricing: 2.9% + $0.30 per transaction
  - Setup: [https://stripe.com/docs/api](https://stripe.com/docs/api)

- [x] **Google Forms** - Intake form distribution
  - Pricing: Free (Google Workspace)
  - Setup: [https://developers.google.com/forms](https://developers.google.com/forms)

- [x] **SendGrid** - Email automation
  - Pricing: Free tier (100 emails/day) or $15/month
  - Setup: [https://sendgrid.com/docs/api-reference/](https://sendgrid.com/docs/api-reference/)

- [x] **Shopify** - E-commerce platform
  - Pricing: Partner account (free for development)
  - Setup: [https://shopify.dev/docs/api](https://shopify.dev/docs/api)

### API Keys Needed

**File:** `.env`

```bash
# Payment Processing
STRIPE_API_KEY=sk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Forms
GOOGLE_FORMS_API_KEY=your_key_here
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Email
SENDGRID_API_KEY=SG.your_key_here

# Shopify
SHOPIFY_API_KEY=your_key_here
SHOPIFY_API_SECRET=your_secret
SHOPIFY_ACCESS_TOKEN=shpat_your_token
```

### Project Setup

```bash
# 1. Clone scenario
cd Docs/scenarios/library/shopify-client-automation/

# 2. Install components
mkdir -p ~/.claude/hooks ~/.claude/agents ~/.claude/commands
cp components/hooks/* ~/.claude/hooks/
cp components/agents/* ~/.claude/agents/
cp components/commands/* ~/.claude/commands/
chmod +x ~/.claude/hooks/*.js

# 3. Configure MCP servers
cp components/mcp-configs/.mcp.json .

# 4. Setup environment
cp .env.example .env
# Edit .env with your API keys

# 5. Test with sample data
./test-scenario.sh
```

---

## Classification Justification

**Type:** SCENARIO

**Validation Checklist:**
- [x] Complete business process? - YES (Full client lifecycle from signup to delivery)
- [x] Uses 3+ workflows? - YES (Payment, Forms, Email, Deployment, Task tracking = 5 workflows)
- [x] Has branching/decision points? - YES (Package selection, form completion timing, review changes)
- [x] Domain-specific? - YES (E-commerce agency specific)
- [x] Single technical purpose? - NO (Multiple purposes: onboarding, payment, development, delivery)

**Decision:** SCENARIO based on:
- Complete business process: End-to-end client management
- Workflow composition: Combines 5 different workflows
- Branching logic: Package-based paths, review loops, reminder triggers
- Domain-specific: E-commerce agency operations
- Not reusable across domains without major modification

**Why NOT a Workflow:**
- Too complex (5+ phases with branching)
- Business logic heavy (pricing, milestones, client communication)
- Not reusable (specific to agency model)
- Composes multiple technical workflows rather than being one

---

## Changelog

### v1.0 (2025-11-08)
- Initial scenario definition
- Core workflows integrated (Stripe, Google Forms, SendGrid, Shopify)
- Decision tree with package-based branching
- Complete example execution (Bella's Boutique)
- Sample data structures provided

---

**Maintained By:** Orchestrator Project Team
**Feedback:** Create issue in project repository
**License:** MIT (same as Orchestrator Project)
