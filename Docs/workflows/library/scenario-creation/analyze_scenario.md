# Workflow: Scenario Analysis and Optimization

**Purpose:** Analyze scenarios for feasibility, optimization opportunities, and potential improvements

**Category:** Scenario Management | Analysis Workflow

**Complexity:** Medium

**Estimated Setup Time:** 10-15 minutes

**Version:** 1.0
**Date:** 2025-11-10
**Status:** Production Ready

---

## Overview

### What This Workflow Does

This workflow provides a systematic approach to analyzing scenarios after creation or modification. It validates configuration, identifies optimization opportunities, suggests improvements, and explores alternative implementation approaches. The analysis helps ensure scenarios are well-designed, efficient, and aligned with best practices before deployment.

### When to Use This Workflow

- After creating a new scenario
- Before deploying to production
- When modifying existing scenarios
- Periodically reviewing deployed scenarios
- When experiencing performance issues
- Before scaling to higher volumes

### When NOT to Use This Workflow

- For simple, well-tested scenarios that are working fine
- When under time pressure (do basic validation at minimum)
- For temporary or experimental scenarios
- When the process is still being defined (analyze after stabilization)

### Prerequisites

- [x] Scenario already created (see [create_scenario.md](./create_scenario.md))
- [x] diet103 CLI installed and configured
- [x] Basic understanding of scenario structure
- [x] Clear performance/quality objectives

---

## Architecture

### Components Used

| Component Type | Name | Purpose |
|----------------|------|---------|
| CLI Command | `diet103 scenario validate` | Configuration validation |
| CLI Command | `diet103 scenario optimize` | Identify improvements |
| CLI Command | `diet103 scenario explore` | Alternative approaches |
| CLI Command | `diet103 scenario show` | View details |
| Validation Engine | JSON Schema, AJV | Schema validation |
| Analysis Engine | Built-in heuristics | Optimization suggestions |

### Component Interaction Flow

```
Existing Scenario
    ↓
[Validation] → Check syntax, schema, dependencies
    ↓
[Optimization Analysis] → Identify improvements
    ↓
[Feasibility Check] → Verify resources available
    ↓
[Alternative Exploration] → Consider other approaches
    ↓
[Recommendations] → Actionable improvements
    ↓
Updated Scenario (if changes applied)
```

### Decision Justification

**Why Multi-Stage Analysis:**
- Each stage catches different types of issues
- Progressive refinement approach
- Allows fixing critical issues first
- Provides comprehensive feedback

**Why Automation:**
- Consistent analysis across scenarios
- Catches common mistakes
- Saves time vs manual review
- Provides objective recommendations

---

## Implementation

### Phase 1: Basic Validation

**Objective:** Ensure scenario is syntactically and structurally correct

**Steps:**

1. **Run validation**
   ```bash
   diet103 scenario validate my-scenario
   ```

2. **Review validation results**
   
   **Checks Performed:**
   - ✅ YAML syntax validation
   - ✅ JSON schema compliance
   - ✅ Dependency resolution
   - ✅ Step ID uniqueness
   - ✅ Circular dependency detection

**Expected Output (Success):**
```
🔍 Validation Results

✅ YAML Syntax: Valid
✅ Schema: Valid
✅ Dependencies: Valid
✅ Step IDs: Unique

✅ All validations passed!
```

**Expected Output (Issues Found):**
```
🔍 Validation Results

✅ YAML Syntax: Valid
❌ Schema: Invalid
   /scenario/trigger/type: must be equal to one of the allowed values
❌ Dependencies: Invalid
   Step "analyze_data" depends on non-existent step "collect_data"
✅ Step IDs: Unique

❌ Validation failed. Please fix the errors above.
```

3. **Fix identified issues**
   ```bash
   # Edit to fix issues
   diet103 scenario edit my-scenario
   
   # Re-validate
   diet103 scenario validate my-scenario
   ```

**Validation Checklist:**
- [ ] All syntax errors fixed
- [ ] Schema validation passes
- [ ] No circular dependencies
- [ ] All step IDs unique
- [ ] All referenced steps exist

### Phase 2: Optimization Analysis

**Objective:** Identify opportunities to improve scenario configuration

**Steps:**

1. **Run optimization analysis**
   ```bash
   diet103 scenario optimize my-scenario
   ```

2. **Review suggestions by priority**

   **High Priority Issues:**
   - Missing required configuration
   - Incomplete trigger setup
   - Critical performance problems

   **Medium Priority Issues:**
   - Missing best practices
   - Suboptimal patterns
   - Missing documentation

   **Low Priority Issues:**
   - Nice-to-have improvements
   - Additional documentation
   - Enhanced features

**Example Output:**
```
🔧 Optimization Suggestions

1. Add trigger command
   Priority: HIGH
   Type: configuration
   Manual triggers should specify a command
   → Add command field to trigger configuration
   ✨ Can be auto-fixed

2. Add test strategy
   Priority: MEDIUM
   Type: best_practice
   Define how to test this scenario
   → Add testStrategy field with test plan

3. Simplify dependency chain
   Priority: MEDIUM
   Type: architecture
   Some steps have many dependencies which could increase fragility
   → Consider grouping related steps or using parallel execution

4. Document design decisions
   Priority: LOW
   Type: documentation
   Design decisions help future maintainers understand choices
   → Add design_decisions array with rationale for key choices

Found 4 optimizations
```

3. **Apply optimizations interactively**
   ```bash
   diet103 scenario optimize my-scenario -i
   ```

4. **Review and apply suggestions**
   ```
   🔧 Interactive Optimization
   
   ? Apply: Add trigger command? (Y/n) y
     ✓ Applied: Add trigger command
   ? Apply: Add version field? (Y/n) y
     ✓ Applied: Add version field
   
   ✅ Optimizations applied!
   ```

5. **Re-validate after changes**
   ```bash
   diet103 scenario validate my-scenario
   ```

### Phase 3: Feasibility Assessment

**Objective:** Verify all required resources are available

**Steps:**

1. **Review scenario dependencies**
   ```bash
   diet103 scenario show my-scenario -v
   ```

2. **Check MCP availability**
   ```yaml
   # From scenario YAML
   dependencies:
     mcps:
       - google-forms-mcp
       - airtable-mcp
       - notification-mcp
   ```

   **Verify each MCP:**
   ```bash
   # Check if MCPs are configured
   cat .mcp.json
   
   # Test MCP availability
   # (commands depend on specific MCP)
   ```

3. **Check skill availability**
   ```yaml
   # From scenario YAML
   dependencies:
     skills:
       - project_manager
       - requirement_analyzer
   ```

   **Verify skills exist:**
   ```bash
   ls ~/.claude/skills/project_manager/
   ls ~/.claude/skills/requirement_analyzer/
   ```

4. **Assess resource requirements**
   - API rate limits
   - External system capacity
   - Execution timeouts
   - Storage requirements

**Feasibility Checklist:**
- [ ] All MCPs installed and configured
- [ ] All required skills available
- [ ] API keys configured
- [ ] External systems accessible
- [ ] Rate limits understood
- [ ] Timeout values appropriate

### Phase 4: Alternative Exploration

**Objective:** Consider different implementation approaches

**Steps:**

1. **Generate alternatives**
   ```bash
   diet103 scenario explore my-scenario
   ```

**Expected Output:**
```
🔍 Alternative Implementations

1. Simplified Approach
   Reduce complexity by combining steps and removing optional features
   Complexity: Low | Time: 2-3 days

2. Event-Driven Architecture
   Use event bus for loose coupling and better scalability
   Complexity: High | Time: 1-2 weeks

3. Microservices Approach
   Split scenario into independent microservices
   Complexity: Very High | Time: 3-4 weeks

Use --compare to see detailed pros/cons
```

2. **Compare alternatives in detail**
   ```bash
   diet103 scenario explore my-scenario --compare
   ```

**Detailed Comparison:**
```
1. Simplified Approach
   Reduce complexity by combining steps and removing optional features

   Key Changes:
   • Combine similar steps into single operations
   • Remove optional validation steps
   • Use synchronous processing where possible

   Pros:
   ✓ Faster implementation time
   ✓ Easier to maintain
   ✓ Lower resource usage

   Cons:
   ✗ Less flexible
   ✗ May require manual intervention
   ✗ Limited error handling

   Estimates:
   Complexity: Low
   Time: 2-3 days

2. Event-Driven Architecture
   [Full details for each alternative...]
```

3. **Evaluate alternatives against requirements**
   
   **Decision Matrix:**
   
   | Approach | Time | Complexity | Scalability | Maintainability | Cost |
   |----------|------|------------|-------------|-----------------|------|
   | Current | Baseline | Baseline | Medium | Medium | $ |
   | Simplified | -50% | -40% | Low | High | $ |
   | Event-Driven | +100% | +60% | Very High | Medium | $$$ |
   | Microservices | +200% | +100% | Very High | Low | $$$$ |

4. **Document chosen approach**
   ```bash
   # If changing approach, update design decisions
   diet103 scenario edit my-scenario
   ```

### Phase 5: Performance Analysis

**Objective:** Assess and optimize scenario performance

**Steps:**

1. **Analyze step complexity**
   ```yaml
   # Count steps
   steps:
     - id: step_1  # Simple, fast
     - id: step_2  # AI call, slower
     - id: step_3  # API call, varies
   ```

2. **Identify bottlenecks**
   - Long-running API calls
   - AI processing steps
   - External system dependencies
   - Sequential vs parallel execution

3. **Estimate execution time**
   ```
   Typical scenario:
   - Step 1 (send_form): ~2s
   - Step 2 (wait_completion): up to 7 days
   - Step 3 (analyze): ~30s (AI)
   - Step 4 (create_project): ~5s
   
   Total: 7 days + 37s
   Critical path: Step 2 (waiting)
   ```

4. **Optimization opportunities**
   - Parallel execution where possible
   - Caching repeated operations
   - Batching similar requests
   - Async processing for long operations

**Performance Checklist:**
- [ ] Execution time estimated
- [ ] Bottlenecks identified
- [ ] Parallel execution considered
- [ ] Timeout values appropriate
- [ ] Resource usage reasonable

---

## Analysis Report Template

After completing analysis, document findings:

### Scenario Analysis Report

**Scenario:** [name]
**Date:** [date]
**Analyst:** [name]

#### 1. Validation Status
- Syntax: ✅/❌
- Schema: ✅/❌
- Dependencies: ✅/❌
- Overall: ✅/❌

#### 2. Optimization Opportunities
**High Priority:**
- [Issue 1]
- [Issue 2]

**Medium Priority:**
- [Issue 1]
- [Issue 2]

**Low Priority:**
- [Issue 1]

#### 3. Feasibility Assessment
**MCPs Required:**
- [x] mcp-1 (available)
- [x] mcp-2 (available)
- [ ] mcp-3 (needs installation)

**Skills Required:**
- [x] skill-1 (available)
- [ ] skill-2 (needs creation)

**Resources:**
- API calls/day: ~100
- Storage: ~10MB
- Execution time: ~2 min avg

#### 4. Alternative Approaches Considered
1. **Simplified**: Lower complexity, faster
2. **Event-Driven**: Better scalability
3. **Microservices**: Maximum flexibility

**Recommendation:** [Chosen approach with rationale]

#### 5. Performance Analysis
- **Estimated execution time:** [time]
- **Bottlenecks:** [list]
- **Optimization applied:** [list]
- **Expected improvement:** [percentage]

#### 6. Recommendations
**Immediate:**
1. [Action 1]
2. [Action 2]

**Short-term:**
1. [Action 1]
2. [Action 2]

**Long-term:**
1. [Action 1]

#### 7. Deployment Readiness
- [ ] All validations pass
- [ ] Optimization applied
- [ ] Resources available
- [ ] Performance acceptable
- [ ] Documentation complete

**Status:** Ready / Needs Work / Blocked

---

## Usage Examples

### Example 1: Full Analysis Workflow

**Context:** Just created a new scenario, want to ensure it's ready for production

**Commands:**
```bash
# 1. Validate
diet103 scenario validate order-processing

# 2. Optimize
diet103 scenario optimize order-processing -i

# 3. Review details
diet103 scenario show order-processing -v

# 4. Explore alternatives
diet103 scenario explore order-processing --compare

# 5. Final validation
diet103 scenario validate order-processing
```

**Outcome:** Confidence in scenario quality and readiness

### Example 2: Quick Health Check

**Context:** Periodic review of deployed scenario

**Commands:**
```bash
# Quick validation
diet103 scenario validate production-sync

# Check for new optimization opportunities
diet103 scenario optimize production-sync
```

**Outcome:** Identify any drift or new improvement opportunities

### Example 3: Troubleshooting Performance

**Context:** Scenario running slow in production

**Commands:**
```bash
# Review configuration
diet103 scenario show slow-scenario -v

# Check optimization suggestions
diet103 scenario optimize slow-scenario

# Explore lighter-weight alternatives
diet103 scenario explore slow-scenario
```

**Outcome:** Identify performance bottlenecks and solutions

---

## Troubleshooting

### Issue: Validation Passes But Scenario Fails

**Symptoms:**
- Validation shows all green
- Scenario fails during execution

**Diagnosis:**
```bash
# Check verbose output
diet103 scenario show problematic-scenario -v

# Verify external dependencies
# Check MCP configurations
# Review API credentials
```

**Solution:**
- Validation checks structure, not runtime behavior
- Test in dev environment first
- Verify all external systems are accessible
- Check API keys and permissions

### Issue: Too Many Optimization Suggestions

**Symptoms:**
- Overwhelming number of suggestions
- Unclear which to prioritize

**Strategy:**
1. Address HIGH priority first
2. Focus on auto-fixable items
3. Apply MEDIUM priority if time permits
4. LOW priority are nice-to-have

**Commands:**
```bash
# Apply auto-fixes only
diet103 scenario optimize my-scenario -i
# Then manually select high-priority items
```

### Issue: Alternative Approaches Unclear

**Symptoms:**
- Multiple alternatives seem valid
- Unsure which to choose

**Decision Framework:**
1. **Time constraints:** Choose simpler approaches
2. **Scale requirements:** Choose more scalable approaches
3. **Team expertise:** Choose familiar technologies
4. **Budget:** Consider infrastructure costs

**Get more details:**
```bash
diet103 scenario explore my-scenario -a 5 --compare
```

---

## Best Practices

### Regular Analysis

**Schedule:**
- After creation: Immediate
- Before production: Required
- Quarterly: Recommended
- After incidents: As needed

### Documentation

**Always Document:**
- Analysis findings
- Decisions made
- Alternatives considered
- Rationale for choices

### Continuous Improvement

**Track Over Time:**
- Performance metrics
- Optimization opportunities
- Resource usage
- User feedback

### Team Collaboration

**Share Analysis:**
- Review with team
- Get stakeholder approval
- Document in version control
- Update runbooks

---

## Advanced Techniques

### Automated Analysis Pipeline

```bash
#!/bin/bash
# analyze-all.sh

for scenario in $(diet103 scenario list --json | jq -r '.[].name'); do
  echo "Analyzing $scenario..."
  
  # Validate
  diet103 scenario validate "$scenario" > "reports/${scenario}-validation.txt"
  
  # Optimize
  diet103 scenario optimize "$scenario" > "reports/${scenario}-optimization.txt"
  
  # Generate report
  echo "Report for $scenario" > "reports/${scenario}-summary.txt"
  echo "Validation: $(grep -c '✅' reports/${scenario}-validation.txt) passed" >> "reports/${scenario}-summary.txt"
  echo "Optimizations: $(grep -c 'Priority:' reports/${scenario}-optimization.txt) found" >> "reports/${scenario}-summary.txt"
done

echo "Analysis complete. Reports in reports/"
```

### Comparative Analysis

Compare multiple scenarios:

```bash
#!/bin/bash
# compare-scenarios.sh

echo "Comparing scenarios..."

for scenario in "$@"; do
  echo "=== $scenario ==="
  
  # Get step count
  steps=$(diet103 scenario show "$scenario" --json | jq '.scenario.steps | length')
  
  # Get dependencies
  mcps=$(diet103 scenario show "$scenario" --json | jq '.scenario.dependencies.mcps | length')
  
  # Get complexity (from optimize)
  complexity=$(diet103 scenario optimize "$scenario" | grep -c "Priority: HIGH")
  
  echo "Steps: $steps"
  echo "MCPs: $mcps"
  echo "High-priority issues: $complexity"
  echo ""
done
```

### Integration with CI/CD

```yaml
# .github/workflows/scenario-analysis.yml
name: Scenario Analysis

on:
  pull_request:
    paths:
      - '.claude/scenarios/**'

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install diet103
        run: npm install -g diet103
      
      - name: Validate scenarios
        run: |
          for file in .claude/scenarios/*.yaml; do
            scenario=$(basename "$file" .yaml)
            diet103 scenario validate "$scenario" || exit 1
          done
      
      - name: Check optimizations
        run: |
          for file in .claude/scenarios/*.yaml; do
            scenario=$(basename "$file" .yaml)
            diet103 scenario optimize "$scenario" >> optimization-report.txt
          done
      
      - name: Upload report
        uses: actions/upload-artifact@v2
        with:
          name: scenario-analysis
          path: optimization-report.txt
```

---

## Related Resources

### CLI Documentation
- [Scenario CLI Guide](../../../docs/SCENARIO_CLI.md)
- [Scenario Quick Reference](../../../docs/SCENARIO_QUICK_REFERENCE.md)

### Related Workflows
- [Create Scenario Workflow](./create_scenario.md) - Previous step
- [Deploy Scenario Workflow](./deploy_scenario.md) - Next step

### External Resources
- [YAML Best Practices](https://yaml.org/spec/1.2/spec.html)
- [Performance Optimization Guide](../../../docs/PERFORMANCE.md)

---

## Changelog

### v1.0 (2025-11-10)
- Initial workflow creation
- Multi-phase analysis process documented
- Optimization and exploration integrated
- Feasibility assessment included
- Performance analysis added
- Advanced techniques and CI/CD integration

---

**Last Updated:** 2025-11-10
**Maintainer:** Orchestrator Project Team
**Feedback:** Create issue in project repository
**License:** Same as parent project

