# Scenarios Library

High-level business use cases that compose multiple workflows.

## What is a Scenario?

A **scenario** is a complete business solution that orchestrates multiple workflows to solve a real-world problem. Scenarios include branching logic, decision points, and end-to-end execution examples.

## Quick Start

1. Browse [library/](library/) for scenarios matching your domain
2. Review scenario overview and workflow composition
3. Check prerequisites (API keys, services)
4. Follow setup instructions
5. Execute scenario with sample data

## Available Scenarios

### E-Commerce & Agency
- [Shopify Client Automation](library/shopify-client-automation/) - End-to-end client workflow from onboarding to delivery

### SaaS Development
- Coming soon...

### Consulting & Services
- Coming soon...

## Scenario Structure

Each scenario contains:

```
scenario-name/
├── SCENARIO.md              # Main scenario documentation
├── workflows-used.md        # Workflow composition map
├── decision-tree.md         # Branching logic diagram
├── components/              # Implementation files
│   ├── hooks/
│   ├── agents/
│   ├── commands/
│   └── mcp-configs/
├── example-data/           # Sample data for testing
│   ├── client-records/
│   └── test-scenarios/
└── PRD.txt                 # Source requirements (Task Master)
```

## Creating New Scenarios

1. Copy [templates/SCENARIO_TEMPLATE.md](templates/SCENARIO_TEMPLATE.md)
2. Define business context and stakeholders
3. Map workflow composition using existing workflows
4. Design decision tree with branches
5. Provide complete execution example
6. Document data structures and schemas
7. Add monitoring metrics
8. Submit PR to add to library

## Scenarios vs Workflows

| Aspect | Workflow | Scenario |
|--------|----------|----------|
| **Purpose** | Technical pattern | Business solution |
| **Components** | Primitives (MCP/Hook/Agent) | Workflows |
| **Logic** | Linear steps | Branching decisions |
| **Scope** | Single concern | End-to-end process |
| **Customization** | Configuration | Workflow substitution |

## Using Scenarios

### Prerequisites
- Review [workflows library](../workflows/library/) for component understanding
- Ensure required external services are available
- Configure API keys in `.env`
- Initialize Task Master if scenario includes task tracking

### Execution
```bash
# 1. Initialize scenario
cd Docs/scenarios/library/scenario-name/
task-master parse-prd --input=PRD.txt

# 2. Setup components
cp -r components/* ~/.claude/  # or project/.claude/

# 3. Configure services
cp .env.example .env
# Edit .env with your API keys

# 4. Test with sample data
./test-scenario.sh

# 5. Execute with real data
# Follow SCENARIO.md instructions
```

## Contributing

### Sharing Your Scenario
1. Ensure scenario uses existing workflows where possible
2. Document any new workflows created
3. Provide sample data for testing
4. Include troubleshooting section
5. Add metrics for monitoring

### Quality Checklist
- [ ] Complete SCENARIO.md documentation
- [ ] Decision tree diagram included
- [ ] At least one complete example execution
- [ ] Sample data provided
- [ ] All workflows documented
- [ ] Prerequisites clearly stated
- [ ] Troubleshooting section complete

---

**Last Updated:** 2025-11-08
**Maintainer:** Orchestrator Project Team
