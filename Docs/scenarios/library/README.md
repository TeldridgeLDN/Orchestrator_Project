# Scenarios Library

Complete business solutions that compose multiple workflows.

## Available Scenarios

### E-Commerce & Agency

#### [Shopify Client Automation](shopify-client-automation/)
**Domain:** E-commerce Agency  
**Complexity:** Intermediate  
**Business Model:** B2B agency with tiered packages (Small/Medium/Large)

Complete client workflow automation from sign-up through delivery with payment milestones.

**Key Features:**
- Automated onboarding with 30% upfront payment
- Form distribution with smart reminders
- Review workflow with 40% payment
- Production deployment with final 30% payment
- Complete handover documentation

**Workflows Used:**
- Payment Processing (Stripe MCP)
- Form Distribution (Google Forms MCP)
- Email Automation (SendGrid MCP)
- Site Deployment (Shopify MCP)
- Task Master Integration (optional)

**ROI:**
- 75% reduction in non-development time
- 95%+ payment success rate
- 80%+ form completion rate

---

## Using Scenarios

### Quick Start

1. Browse scenarios above
2. Review scenario overview
3. Check prerequisites (API keys, services)
4. Follow setup instructions in `SCENARIO.md`
5. Test with sample data

### Example: Setting Up Shopify Client Automation

```bash
cd Docs/scenarios/library/shopify-client-automation/

# 1. Copy components
cp components/hooks/* ~/.claude/hooks/
cp components/mcp-configs/.mcp.json .

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Test with sample data
./test-scenario.sh
```

---

## Creating New Scenarios

1. Copy `../templates/SCENARIO_TEMPLATE.md`
2. Define business context and stakeholders
3. Map workflow composition
4. Design decision tree with branches
5. Provide complete execution example
6. Add to this README

---

**Last Updated:** 2025-11-08
