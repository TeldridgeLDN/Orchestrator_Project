# Lateral Thinking Troubleshooting Guide

## When NOT to Use Lateral Thinking

### Simple, Well-Defined Problems

**Symptoms:**
- Clear, linear path to solution
- Established best practices exist
- Problem has been solved many times before
- Requirements are explicit and unambiguous

**Example:**
```
Problem: "Implement standard CRUD endpoints for users"
Decision: SKIP lateral thinking
Reason: Well-understood problem with established patterns
```

**Action:** Use standard approach, don't add creative overhead.

---

### Time-Critical Situations

**Symptoms:**
- Production issue requiring immediate fix
- Hard deadline approaching
- Team is blocked waiting for decision

**Example:**
```
Problem: "Server is down, need to restore service"
Decision: SKIP lateral thinking
Reason: Need fast, proven solution—not time for exploration
```

**Action:** Apply known fixes first, innovate later.

---

### Low-Stakes Decisions

**Symptoms:**
- Decision is easily reversible
- Low impact if wrong choice made
- Cost of exploration exceeds value of improvement

**Example:**
```
Problem: "Should we use tabs or spaces?"
Decision: SKIP lateral thinking
Reason: Pick one, move on—not worth deep exploration
```

**Action:** Make reasonable choice quickly.

---

### Already Have Diverse Alternatives

**Symptoms:**
- Team has generated multiple good options
- Real challenge is choosing, not ideating more
- Analysis paralysis risk

**Example:**
```
Situation: "We have 5 viable authentication approaches already"
Decision: SKIP lateral thinking
Reason: Need convergence, not more divergence
```

**Action:** Use decision matrix to choose from existing options.

---

## Common Issues

### Issue 1: Too Many Ideas, No Clear Winner

**Symptoms:**
- Lateral thinking generates 10+ ideas
- All seem interesting but none stand out
- Team can't decide which to pursue

**Root Cause:** Convergence phase not working effectively

**Solutions:**

1. **Tighten Scoring Criteria**
```json
{
  "minConfidence": 0.7,  // Raise from 0.6
  "presentTopN": 2,      // Reduce from 3
  "requiresAll": {
    "feasibility": 0.7,  // Must meet minimum thresholds
    "impact": 0.6
  }
}
```

2. **Add Constraints to Context**
```javascript
context = {
  ...context,
  hardConstraints: [
    'Must complete in 2 weeks',
    'No new external dependencies',
    'Team has React expertise only'
  ]
}
```

3. **Use Two-Stage Exploration**
```
Stage 1: Lateral thinking → Generate 3 finalists
Stage 2: Deep dive each finalist → Pick winner
```

---

### Issue 2: Ideas Too Wild, Nothing Practical

**Symptoms:**
- All suggestions are extremely novel but infeasible
- Team dismisses everything as "too creative"
- No actionable outputs

**Root Cause:** Context not providing enough grounding

**Solutions:**

1. **Enrich Context with Constraints**
```javascript
{
  research: researchFindings,        // ✅ Good
  baseline: standardApproach,        // ✅ Good
  constraints: [                     // ✅ ADD THIS
    'Must integrate with existing auth',
    'Team familiar with PostgreSQL only',
    'Budget: $5k max for new tools'
  ],
  goals: [                           // ✅ ADD THIS
    'Reduce auth latency by 30%',
    'Improve developer experience'
  ]
}
```

2. **Adjust Scoring Weights**
```javascript
function scoreIdea(idea, context) {
  return {
    feasibility: 0.50,  // Increase weight (was 0.35)
    impact: 0.30,       // Decrease weight (was 0.35)
    novelty: 0.10,      // Decrease weight (was 0.20)
    contextFit: 0.10
  };
}
```

3. **Select Different Techniques**
```
Instead of: Provocations + Random Metaphors (very disruptive)
Try: SCAMPER + Six Hats (more systematic)
```

---

### Issue 3: Ideas Too Conservative, Not Creative Enough

**Symptoms:**
- Outputs are minor variations of baseline
- Nothing genuinely novel or surprising
- Team expected more "outside the box" thinking

**Root Cause:** Over-constrained or techniques not disruptive enough

**Solutions:**

1. **Use More Disruptive Techniques**
```javascript
{
  techniques: ['provocations', 'bad-ideas'],  // Most disruptive
  ideasPerTechnique: 7  // Generate more to increase variety
}
```

2. **Loosen Constraints Temporarily**
```javascript
// Separate "must have" from "nice to have"
context = {
  hardConstraints: ['Must be secure'],
  softConstraints: ['Prefer existing tech', 'Prefer low complexity']
}
```

3. **Increase Novelty Weight**
```javascript
function scoreIdea(idea, context) {
  return {
    feasibility: 0.25,
    impact: 0.30,
    novelty: 0.35,      // Increase (was 0.20)
    contextFit: 0.10
  };
}
```

---

### Issue 4: Token Budget Exceeded

**Symptoms:**
- Session terminates before completion
- Missing expected number of ideas
- Convergence phase skipped

**Root Cause:** Configuration exceeds budget

**Solutions:**

1. **Use Quick Mode Preset**
```json
{
  "tokenBudget": 1500,
  "techniques": 1,
  "ideasPerTechnique": 3,
  "presentTopN": 1
}
```

2. **Optimize Context Size**
```javascript
// Before
context = {
  research: fullResearchDocument,  // 5000 tokens
  baseline: fullImplementation     // 2000 tokens
}

// After
context = {
  research: researchSummary,       // 500 tokens
  baseline: approachOutline        // 200 tokens
}
```

3. **Disable Auto-Convergence**
```json
{
  "autoConverge": false,  // Skip clustering/curation
  "rawOutput": true       // Return raw ideas
}
```

---

### Issue 5: Session Takes Too Long

**Symptoms:**
- Users waiting 5+ minutes for results
- Context switching while waiting
- Frustration with process

**Root Cause:** Too many techniques or ideas

**Solutions:**

1. **Reduce Scope**
```json
{
  "techniques": 1,           // Was 2
  "ideasPerTechnique": 3,    // Was 5
  "autoConverge": false      // Skip expensive clustering
}
```

2. **Parallel Execution**
```javascript
// If supported, run techniques in parallel
const results = await Promise.all([
  technique1.generate(context),
  technique2.generate(context)
]);
```

3. **Add Time Limit**
```json
{
  "maxDuration": 120000,  // 2 minutes max
  "gracefulTimeout": true // Return partial results if exceeded
}
```

---

### Issue 6: Technique Selection Unclear

**Symptoms:**
- Unsure which technique to use
- Trial and error with different techniques
- Inconsistent results

**Root Cause:** Lack of technique selection guidance

**Solutions:**

Use the **Technique Selection Decision Tree**:

```
START
├─ Do you have a baseline solution?
│  ├─ YES → Use SCAMPER (systematic variations)
│  └─ NO → Continue
│
├─ Are you completely stuck?
│  ├─ YES → Use Provocations or Bad Ideas (disruptive)
│  └─ NO → Continue
│
├─ Need comprehensive multi-angle view?
│  ├─ YES → Use Six Thinking Hats
│  └─ NO → Continue
│
├─ Looking for cross-domain inspiration?
│  ├─ YES → Use Random Metaphors
│  └─ NO → Default to SCAMPER + Provocations
```

---

### Issue 7: Auto-Triggers Firing Too Often

**Symptoms:**
- Lateral thinking suggestions appear constantly
- Disrupts workflow instead of enhancing it
- Users skip every time

**Root Cause:** Trigger conditions too broad

**Solutions:**

1. **Raise Confidence Thresholds**
```json
{
  "triggers": {
    "postResearch": {
      "confidence": 0.8  // Raise from 0.7
    },
    "stuckState": {
      "threshold": 5     // Raise from 3 attempts
    }
  }
}
```

2. **Disable Specific Triggers**
```json
{
  "triggers": {
    "postResearch": true,
    "prePlanning": true,
    "stuckState": false,      // Disable
    "wickedProblem": false    // Disable
  }
}
```

3. **Add Cooldown Period**
```json
{
  "triggerCooldown": 3600000  // 1 hour between suggestions
}
```

---

### Issue 8: Auto-Triggers Never Fire

**Symptoms:**
- Expected triggers don't activate
- Manual invocation works fine
- No automatic suggestions

**Root Cause:** Detection patterns not matching or disabled

**Solutions:**

1. **Check Detection Patterns**
```javascript
// Verify patterns in metadata.json
{
  "detectionPatterns": [
    "research.*complete",        // Does your workflow use this language?
    "stuck.*problem",
    "need.*creative.*solution"
  ]
}
```

2. **Enable Auto-Activation**
```json
{
  "hooks": {
    "autoActivate": true  // Must be true
  }
}
```

3. **Lower Confidence Thresholds**
```json
{
  "triggers": {
    "postResearch": {
      "confidence": 0.5  // Lower from 0.7
    }
  }
}
```

---

## Quality Issues

### Problem: Generated Ideas Are Duplicates

**Cause:** Insufficient diversity in generation

**Solution:**
```json
{
  "diversityEnforcement": true,
  "similarityThreshold": 0.8,  // Ideas >80% similar are merged
  "techniques": 3              // Use more techniques for variety
}
```

---

### Problem: Ideas Don't Match Problem Domain

**Cause:** Context not specific enough

**Solution:**
```javascript
// Vague context
context = {
  problem: "Improve authentication"
}

// Specific context
context = {
  problem: "Reduce authentication latency for mobile apps",
  currentApproach: "JWT with 15-minute expiry",
  metrics: { currentLatency: "450ms", target: "< 200ms" },
  constraints: ["Must work offline", "Native iOS/Android"]
}
```

---

### Problem: Scoring Seems Random

**Cause:** Insufficient information for accurate scoring

**Solution:**
```javascript
// Provide more context for scoring
context = {
  ...context,
  teamCapabilities: ['React', 'Node.js', 'PostgreSQL'],
  timeline: '2 weeks',
  budget: '$10k',
  riskTolerance: 'low',
  strategicGoals: ['improve DX', 'reduce costs']
}
```

---

## Integration Issues

### Problem: Lateral Thinking Not Appearing in Workflow

**Cause:** Hook integration missing

**Solution:**

1. **Check Hook Registration**
```javascript
// In lib/hooks/index.js
import { lateralThinkingHook } from './lateralThinking.js';

export function registerHooks() {
  // ...
  registerHook('postToolUse', lateralThinkingHook);
}
```

2. **Verify Hook Priority**
```javascript
{
  "hooks": {
    "postToolUse": {
      "priority": 50,  // Higher = earlier execution
      "enabled": true
    }
  }
}
```

---

### Problem: Context Not Passed to Lateral Thinking

**Cause:** Integration not forwarding context

**Solution:**
```javascript
// Ensure context flows through
async function handleResearchComplete(findings) {
  const context = {
    research: findings,
    baseline: extractBaseline(findings),
    problem: getCurrentTask().description,
    constraints: getProjectConstraints()
  };
  
  if (shouldTriggerLateralThinking(context)) {
    return await runLateralThinking(context);  // ✅ Pass full context
  }
}
```

---

## Performance Optimization

### Slow Convergence Phase

**Solutions:**

1. **Simplify Clustering**
```javascript
{
  "convergence": {
    "algorithm": "simple",  // Instead of "hierarchical"
    "maxClusters": 3
  }
}
```

2. **Cache Similarity Calculations**
```javascript
const similarityCache = new Map();

function getSimilarity(idea1, idea2) {
  const key = `${idea1.id}:${idea2.id}`;
  if (similarityCache.has(key)) {
    return similarityCache.get(key);
  }
  const sim = calculateSimilarity(idea1, idea2);
  similarityCache.set(key, sim);
  return sim;
}
```

---

### High Memory Usage

**Solutions:**

1. **Stream Processing**
```javascript
// Instead of storing all ideas in memory
async function* generateIdeas(techniques, context) {
  for (const technique of techniques) {
    const ideas = await technique.generate(context);
    for (const idea of ideas) {
      yield idea;  // Process one at a time
    }
  }
}
```

2. **Limit Idea Storage**
```json
{
  "maxIdeasInMemory": 50,
  "persistOverflow": true
}
```

---

## FAQ

**Q: Can I use lateral thinking multiple times on the same problem?**

A: Yes! Iterate with different techniques or refined context:
```
Round 1: SCAMPER → 3 finalists
Round 2: Provocations on finalist #1 → Explore deeply
Round 3: Bad Ideas on finalist #2 → Find edge cases
```

**Q: How do I know if an idea is worth pursuing?**

A: Check confidence score and these signals:
- Confidence > 0.75 → Strong candidate
- Confidence 0.60-0.75 → Worth exploring
- Confidence < 0.60 → Risky, needs validation

**Q: Can I override the scoring?**

A: Yes, provide custom scorer:
```javascript
session.setScorer(new CustomScorer({
  weights: { feasibility: 0.6, impact: 0.4 }
}));
```

**Q: What if all ideas are rejected?**

A: Use baseline approach:
```
"All lateral thinking options scored < 0.6.
Recommending baseline: [Standard JWT approach]
Proceed? [Yes] [Try different techniques]"
```

**Q: How do I improve technique selection over time?**

A: Track which techniques work for which problems:
```javascript
{
  problem_type: 'authentication',
  effective_techniques: ['scamper', 'six-hats'],
  ineffective: ['random-metaphors']
}
```

---

## Getting Help

1. **Enable Debug Mode**
```json
{
  "debug": true,
  "verboseLogging": true
}
```

2. **Check Logs**
```bash
tail -f ~/.claude/logs/lateral-thinking.log
```

3. **Share Context (Sanitized)**
When reporting issues, include:
- Configuration used
- Context provided (sanitized)
- Expected vs actual output
- Error messages

4. **Common Log Locations**
```
~/.claude/logs/lateral-thinking.log
~/.claude/logs/hooks.log
project/.orchestrator/logs/
```

---

## Best Practices Summary

**DO:**
- ✅ Provide rich, specific context
- ✅ Use appropriate techniques for problem type
- ✅ Set realistic token budgets
- ✅ Skip when baseline is obviously correct
- ✅ Iterate if first round doesn't produce winners

**DON'T:**
- ❌ Use on every problem automatically
- ❌ Generate ideas without convergence
- ❌ Ignore token budget constraints
- ❌ Overlook baseline approaches
- ❌ Pursue novelty at expense of feasibility

---

**Still having issues?** Check the [API Reference](api-reference.md) for advanced configuration options or [Setup Guide](setup-guide.md) for integration troubleshooting.

