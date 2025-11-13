# Scenario Creation Workflows

This directory contains comprehensive workflows for creating, analyzing, and managing scenarios in the Partnership-Enabled Scenario System.

## Available Workflows

### 1. [Create Scenario Workflow](./create_scenario.md)

**Purpose:** Guide users through creating well-structured scenarios

**Use When:**
- Starting a new scenario
- Need step-by-step guidance
- Want to follow best practices
- First time creating scenarios

**Quick Start:**
```bash
# Interactive creation
diet103 scenario create

# Follow the workflow guide for detailed explanation
```

**Covers:**
- Interactive and non-interactive creation
- Template selection
- Configuration and refinement
- Optimization and testing
- Deployment process

---

### 2. [Analyze Scenario Workflow](./analyze_scenario.md)

**Purpose:** Systematically analyze scenarios for quality and optimization

**Use When:**
- After creating a scenario
- Before deploying to production
- Periodic scenario reviews
- Troubleshooting performance
- Considering alternatives

**Quick Start:**
```bash
# Run analysis
diet103 scenario validate my-scenario
diet103 scenario optimize my-scenario
diet103 scenario explore my-scenario

# Follow the workflow guide for comprehensive analysis
```

**Covers:**
- Validation (syntax, schema, dependencies)
- Optimization analysis
- Feasibility assessment
- Alternative exploration
- Performance analysis

---

## Complete Workflow Sequence

### End-to-End Scenario Development

```
1. Create Scenario
   ↓
   [create_scenario.md]
   ↓
   diet103 scenario create

2. Analyze & Validate
   ↓
   [analyze_scenario.md]
   ↓
   diet103 scenario validate
   diet103 scenario optimize
   diet103 scenario explore

3. Refine Configuration
   ↓
   diet103 scenario edit
   diet103 scenario validate

4. Deploy
   ↓
   diet103 scenario deploy --dry-run
   diet103 scenario deploy -e dev
   diet103 scenario deploy -e production
```

---

## Quick Reference

### Common Commands by Phase

**Creation Phase:**
```bash
diet103 scenario create                    # Interactive creation
diet103 scenario create -t basic -n name   # Quick creation
diet103 scenario list                      # View all scenarios
```

**Analysis Phase:**
```bash
diet103 scenario validate name             # Check validity
diet103 scenario optimize name             # Find improvements
diet103 scenario explore name              # See alternatives
diet103 scenario show name -v              # View details
```

**Refinement Phase:**
```bash
diet103 scenario edit name                 # Modify configuration
diet103 scenario optimize name -i          # Apply fixes
```

**Deployment Phase:**
```bash
diet103 scenario deploy name --dry-run     # Test deployment
diet103 scenario deploy name               # Deploy to dev
diet103 scenario deploy name -e production # Deploy to prod
```

---

## Workflow Selection Guide

### Choose Create Scenario Workflow When:
- ✅ Starting from scratch
- ✅ Need guidance on structure
- ✅ Want to understand best practices
- ✅ First-time scenario creator
- ✅ Complex multi-step workflow

### Choose Analyze Scenario Workflow When:
- ✅ Scenario already exists
- ✅ Ready for production deployment
- ✅ Performance issues detected
- ✅ Periodic quality review
- ✅ Considering alternatives

### Use Both Workflows When:
- ✅ Building production scenarios
- ✅ High-stakes deployments
- ✅ Team collaboration needed
- ✅ Long-term maintainability important

---

## Integration with CLI

These workflows complement the `diet103 scenario` CLI commands:

### CLI Commands Reference

| Command | Workflow Coverage | Documentation |
|---------|------------------|---------------|
| `create` | [create_scenario.md](./create_scenario.md) Phase 2 | Interactive creation |
| `list` | Both workflows | View scenarios |
| `show` | Both workflows | View details |
| `edit` | [create_scenario.md](./create_scenario.md) Phase 3 | Modify config |
| `validate` | [analyze_scenario.md](./analyze_scenario.md) Phase 1 | Validation |
| `optimize` | [analyze_scenario.md](./analyze_scenario.md) Phase 2 | Optimization |
| `explore` | [analyze_scenario.md](./analyze_scenario.md) Phase 4 | Alternatives |
| `deploy` | [create_scenario.md](./create_scenario.md) Phase 5 | Deployment |
| `remove` | Management | Cleanup |

### Full CLI Documentation

For complete CLI reference, see:
- [Scenario CLI Guide](../../../../docs/SCENARIO_CLI.md)
- [Scenario Quick Reference](../../../../docs/SCENARIO_QUICK_REFERENCE.md)

---

## Templates Available

### Basic Template
- **Complexity:** Low
- **Use Case:** Simple workflows (2-3 steps)
- **Setup Time:** 5-10 minutes
- **Best For:** Learning, simple automation

### Advanced Template
- **Complexity:** Medium-High
- **Use Case:** Complex workflows with integrations
- **Setup Time:** 15-30 minutes
- **Best For:** Production scenarios, multi-step processes

### Custom Template
- **Complexity:** Variable
- **Use Case:** Unique requirements
- **Setup Time:** 20-40 minutes
- **Best For:** Specialized needs, maximum control

---

## Best Practices

### During Creation
1. ✅ Start with a template
2. ✅ Use clear, descriptive names (kebab-case)
3. ✅ Document your design decisions
4. ✅ Define test strategy upfront
5. ✅ Validate early and often

### During Analysis
1. ✅ Run full validation before deployment
2. ✅ Address high-priority optimizations
3. ✅ Verify all dependencies are available
4. ✅ Consider alternatives for complex scenarios
5. ✅ Document analysis findings

### For Production
1. ✅ Test in dev environment first
2. ✅ Use dry-run mode before deployment
3. ✅ Require explicit confirmation for production
4. ✅ Monitor after deployment
5. ✅ Schedule periodic reviews

---

## Troubleshooting

### Common Issues

**Issue: "Scenario already exists"**
- **Solution:** Choose different name or remove existing
- **Command:** `diet103 scenario list` then `diet103 scenario remove old-name -f`

**Issue: "Validation failed"**
- **Solution:** Check YAML syntax and required fields
- **Workflow:** [analyze_scenario.md](./analyze_scenario.md) Phase 1
- **Command:** `diet103 scenario validate name -v`

**Issue: "Too many optimization suggestions"**
- **Solution:** Focus on high-priority items first
- **Workflow:** [analyze_scenario.md](./analyze_scenario.md) Phase 2
- **Command:** `diet103 scenario optimize name -i`

**Issue: "Deployment fails"**
- **Solution:** Verify dependencies and test with dry-run
- **Workflow:** [create_scenario.md](./create_scenario.md) Phase 5
- **Command:** `diet103 scenario deploy name --dry-run`

### Get Help

```bash
# Command-specific help
diet103 scenario create --help
diet103 scenario validate --help

# General help
diet103 scenario --help

# Workflow guidance
# Read create_scenario.md or analyze_scenario.md
```

---

## Examples

### Example 1: Creating Your First Scenario

```bash
# Step 1: Create scenario using interactive mode
diet103 scenario create

# Step 2: Review what was created
diet103 scenario show my-first-scenario

# Step 3: Validate configuration
diet103 scenario validate my-first-scenario

# Step 4: Check for improvements
diet103 scenario optimize my-first-scenario

# Step 5: Deploy to dev
diet103 scenario deploy my-first-scenario
```

**Workflow Reference:** [create_scenario.md](./create_scenario.md)

### Example 2: Analyzing Existing Scenario

```bash
# Step 1: Validate structure
diet103 scenario validate existing-scenario

# Step 2: Find optimization opportunities
diet103 scenario optimize existing-scenario -i

# Step 3: Explore alternatives
diet103 scenario explore existing-scenario --compare

# Step 4: Make improvements
diet103 scenario edit existing-scenario

# Step 5: Re-validate
diet103 scenario validate existing-scenario
```

**Workflow Reference:** [analyze_scenario.md](./analyze_scenario.md)

### Example 3: Production Deployment

```bash
# Step 1: Final validation
diet103 scenario validate production-ready -v

# Step 2: Final optimization check
diet103 scenario optimize production-ready

# Step 3: Dry run deployment
diet103 scenario deploy production-ready --dry-run

# Step 4: Deploy to staging
diet103 scenario deploy production-ready -e staging

# Step 5: Deploy to production (with confirmation)
diet103 scenario deploy production-ready -e production
```

**Workflow References:** Both workflows, final phases

---

## Advanced Usage

### Automation Scripts

Create helper scripts for your workflow:

```bash
#!/bin/bash
# create-and-analyze.sh

SCENARIO_NAME=$1

# Create
diet103 scenario create --name "$SCENARIO_NAME" --template advanced --no-interactive

# Analyze
diet103 scenario validate "$SCENARIO_NAME"
diet103 scenario optimize "$SCENARIO_NAME" > "${SCENARIO_NAME}-analysis.txt"

# Report
echo "Scenario '$SCENARIO_NAME' created and analyzed."
echo "Review analysis in ${SCENARIO_NAME}-analysis.txt"
```

### CI/CD Integration

See [analyze_scenario.md](./analyze_scenario.md) Advanced Techniques section for:
- Automated analysis pipelines
- GitHub Actions integration
- Batch processing scripts
- Comparative analysis tools

---

## Learning Path

### Beginner
1. Read [create_scenario.md](./create_scenario.md) overview
2. Create your first scenario using interactive mode
3. Follow create workflow Phase 2
4. Deploy to dev environment

### Intermediate
1. Complete create workflow all phases
2. Read [analyze_scenario.md](./analyze_scenario.md) overview
3. Analyze your scenarios
4. Apply optimizations interactively
5. Deploy to production

### Advanced
1. Master both workflows
2. Create custom templates
3. Automate analysis pipelines
4. Integrate with CI/CD
5. Explore alternative architectures

---

## Related Documentation

### In This Directory
- [create_scenario.md](./create_scenario.md) - Complete creation guide
- [analyze_scenario.md](./analyze_scenario.md) - Complete analysis guide
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Comprehensive testing procedures

### CLI Reference
- [Scenario CLI Guide](../../../../docs/SCENARIO_CLI.md) - Full command reference
- [Scenario Quick Reference](../../../../docs/SCENARIO_QUICK_REFERENCE.md) - Command cheat sheet

### Project Documentation
- [Orchestrator PRD](../../../../Docs/Orchestrator_PRD.md) - System overview
- [Workflow Creation Guide](../../../WORKFLOW_CREATION_GUIDE.md) - Creating workflows
- [Agentic Feature Selection](../../../Agentic_Feature_Selection_Workflow.md) - Architecture decisions

---

## Contributing

### Adding New Workflows

To add new scenario workflows to this directory:

1. Follow the [workflow template](../../../templates/WORKFLOW_TEMPLATE.md)
2. Integrate with existing CLI commands
3. Provide clear examples and use cases
4. Include troubleshooting section
5. Update this README with references
6. Cross-reference related workflows

### Improving Existing Workflows

When updating workflows:

1. Test all commands and examples
2. Update version and changelog
3. Maintain backward compatibility
4. Update related documentation
5. Add migration notes if needed

---

## Changelog

### v1.0 (2025-11-10)
- Initial scenario-creation workflows directory
- Created create_scenario.md workflow
- Created analyze_scenario.md workflow
- Added README with integration guidance
- Provided examples and best practices

---

**Last Updated:** 2025-11-10
**Maintainers:** Orchestrator Project Team
**Feedback:** Create issue in project repository
**License:** Same as parent project

