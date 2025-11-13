# Lateral Thinking Setup Guide

## Installation

### 1. Copy Skill to Claude Skills Directory

```bash
# For Orchestrator Project users
cp -r templates/lateral-thinking ~/.claude/skills/

# For standalone installation
git clone https://github.com/orchestrator-project/lateral-thinking
cp -r lateral-thinking ~/.claude/skills/
```

### 2. Verify Installation

```bash
# Check structure
ls -la ~/.claude/skills/lateral-thinking/

# Expected output:
# - SKILL.md
# - metadata.json
# - resources/
#   ├── quick-ref.md
#   ├── setup-guide.md
#   ├── api-reference.md
#   └── troubleshooting.md
```

### 3. Verify Line Counts (Optional)

```bash
cd ~/.claude/skills/lateral-thinking
wc -l SKILL.md resources/*.md

# Expected:
# SKILL.md: ~350 lines
# quick-ref.md: <100 lines
# Others: <500 lines each
```

---

## Integration with Orchestrator

### Hook Integration

The lateral thinking skill integrates with Orchestrator's hook system for automatic triggering.

#### Option A: Auto-Detection (Recommended)

Enable automatic detection in your Orchestrator config:

```json
// ~/.claude/config.json or project config
{
  "skills": {
    "lateral-thinking": {
      "enabled": true,
      "autoActivate": true,
      "triggers": {
        "postResearch": true,
        "prePlanning": true,
        "stuckState": true,
        "wickedProblem": true
      }
    }
  }
}
```

#### Option B: Manual Triggering Only

Disable auto-activation for explicit control:

```json
{
  "skills": {
    "lateral-thinking": {
      "enabled": true,
      "autoActivate": false
    }
  }
}
```

### Trigger Condition Configuration

Configure when the skill should suggest activation:

```json
{
  "skills": {
    "lateral-thinking": {
      "triggers": {
        // After research completes, before planning
        "postResearch": {
          "enabled": true,
          "confidence": 0.7,
          "message": "Explore alternatives before planning?"
        },
        
        // Before research to frame better questions
        "preResearch": {
          "enabled": false,  // Disabled by default
          "confidence": 0.6,
          "message": "Challenge problem framing before researching?"
        },
        
        // When stuck state detected (3+ similar attempts)
        "stuckState": {
          "enabled": true,
          "threshold": 3,
          "confidence": 0.8,
          "message": "Try creative reframing?"
        },
        
        // Complex, open-ended problems
        "wickedProblem": {
          "enabled": true,
          "indicators": ["multiple solutions", "unclear requirements", "no obvious path"],
          "confidence": 0.75,
          "message": "Use lateral thinking for this complex problem?"
        }
      }
    }
  }
}
```

---

## Workflow Insertion Points

### 1. Task Master Integration

The skill integrates at key Task Master workflow points:

```javascript
// Example hook in lib/hooks/postToolUse.js

export function checkLateralThinkingTrigger(context) {
  const { task, command, history } = context;
  
  // Post-research trigger
  if (command === 'research' && task.status === 'in-progress') {
    return {
      trigger: true,
      type: 'postResearch',
      message: 'Research complete. Explore alternatives with lateral thinking?',
      actions: ['Yes, explore alternatives', 'No, proceed to planning', 'Quick version (1 technique)']
    };
  }
  
  // Stuck state trigger
  const failedAttempts = history.filter(h => 
    h.task === task.id && 
    h.result === 'failed'
  ).length;
  
  if (failedAttempts >= 3) {
    return {
      trigger: true,
      type: 'stuckState',
      message: `Detected ${failedAttempts} attempts on this task. Try lateral thinking?`,
      actions: ['Yes, reframe problem', 'No, continue current approach']
    };
  }
  
  return { trigger: false };
}
```

### 2. Research FOB Integration

Chain lateral thinking after research completion:

```javascript
// In research FOB completion handler

async function completeResearch(findings) {
  // Store research findings
  await storeResearchFindings(findings);
  
  // Check if lateral thinking should trigger
  if (config.lateralThinking.postResearch) {
    const trigger = await checkLateralThinkingConditions({
      hasResearch: true,
      researchFindings: findings,
      complexity: assessComplexity(findings)
    });
    
    if (trigger.shouldActivate) {
      return {
        findings,
        nextStep: 'lateral-thinking',
        message: 'Research complete. Explore creative alternatives?',
        context: {
          research: findings,
          baseline: extractBaselineApproach(findings)
        }
      };
    }
  }
  
  return { findings, nextStep: 'planning' };
}
```

### 3. Planning Phase Integration

Receive curated outputs before planning:

```javascript
// In planning phase initialization

async function initializePlanning(task) {
  // Check if lateral thinking was used
  const lateralResults = await getLateralThinkingResults(task.id);
  
  if (lateralResults) {
    return {
      task,
      planningOptions: {
        baseline: lateralResults.baseline,
        alternatives: lateralResults.topOptions,
        chosen: null  // User will select
      },
      nextAction: 'select-approach'
    };
  }
  
  // Standard planning without lateral thinking
  return {
    task,
    planningOptions: { baseline: await getStandardApproach(task) },
    nextAction: 'create-plan'
  };
}
```

---

## Token Budget Management

### Default Configuration

```json
{
  "lateralThinking": {
    "tokenBudget": 3000,
    "budgetAllocation": {
      "divergence": 0.60,    // 1800 tokens for idea generation
      "convergence": 0.30,   // 900 tokens for curation
      "delivery": 0.10       // 300 tokens for output formatting
    }
  }
}
```

### Budget Optimization

**For Quick Exploration (1000-1500 tokens):**
```json
{
  "techniques": 1,
  "ideasPerTechnique": 3,
  "presentTopN": 1
}
```

**For Standard Use (2000-3000 tokens):**
```json
{
  "techniques": 2,
  "ideasPerTechnique": 5,
  "presentTopN": 3
}
```

**For Deep Exploration (4000-5000 tokens):**
```json
{
  "techniques": 3,
  "ideasPerTechnique": 7,
  "presentTopN": 5
}
```

### Token Budget Enforcement

```javascript
class LateralThinkingSession {
  constructor(config) {
    this.budget = config.tokenBudget;
    this.used = 0;
    this.allocation = config.budgetAllocation;
  }
  
  checkBudget(phase) {
    const phaseLimit = this.budget * this.allocation[phase];
    const phaseUsed = this.getPhaseUsage(phase);
    
    if (phaseUsed >= phaseLimit) {
      return {
        exceeded: true,
        limit: phaseLimit,
        used: phaseUsed,
        action: 'truncate-or-skip'
      };
    }
    
    return { exceeded: false, remaining: phaseLimit - phaseUsed };
  }
}
```

---

## Escape Hatch Configuration

### Always-Available Escape Routes

```json
{
  "lateralThinking": {
    "escapeHatches": {
      "skipEnabled": true,
      "skipMessage": "Skip to standard approach",
      "quickModeEnabled": true,
      "quickMode": {
        "techniques": 1,
        "ideasPerTechnique": 3,
        "tokenBudget": 1000
      },
      "partialResults": {
        "enabled": true,
        "minIdeas": 3,
        "message": "Budget exhausted. Present partial results?"
      }
    }
  }
}
```

### User Control

Every lateral thinking session provides:

1. **Pre-session escape**: "Skip lateral thinking, use standard approach"
2. **Mid-session escape**: "Stop generating, converge with what we have"
3. **Post-session escape**: "Ignore alternatives, proceed with baseline"

Example implementation:

```javascript
async function runLateralThinkingSession(context) {
  // Pre-session escape
  const proceed = await askUser({
    message: 'Explore alternatives with lateral thinking?',
    options: [
      'Yes (standard: ~3min, 3000 tokens)',
      'Quick mode (1min, 1000 tokens)',
      'Skip to baseline approach'
    ]
  });
  
  if (proceed === 'Skip to baseline approach') {
    return { skipped: true, useBaseline: true };
  }
  
  // Run session with mid-session escape ability
  const session = new LateralThinkingSession({
    mode: proceed === 'Quick mode' ? 'quick' : 'standard',
    allowEarlyTermination: true
  });
  
  return await session.run(context);
}
```

---

## Performance Optimization

### Caching Strategies

```javascript
// Cache technique results for similar contexts
const cache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 60  // 1 hour
});

function getCacheKey(context) {
  return hash({
    problem: context.problemDescription,
    research: context.researchFindings?.summary,
    constraints: context.constraints
  });
}

async function applyTechnique(technique, context) {
  const key = `${technique}:${getCacheKey(context)}`;
  
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const results = await technique.generate(context);
  cache.set(key, results);
  return results;
}
```

### Parallel Technique Execution

```javascript
// Run multiple techniques in parallel for speed
async function divergentPhase(context, techniques) {
  const techniquePromises = techniques.map(technique =>
    applyTechnique(technique, context)
      .catch(err => ({
        technique: technique.name,
        error: err,
        ideas: []  // Graceful degradation
      }))
  );
  
  const results = await Promise.all(techniquePromises);
  return results.flatMap(r => r.ideas || []);
}
```

---

## Testing Integration

### Unit Tests

```javascript
import { LateralThinkingSession } from './lateral-thinking';

describe('Lateral Thinking FOB', () => {
  test('respects token budget', async () => {
    const session = new LateralThinkingSession({
      tokenBudget: 1000,
      techniques: 2,
      ideasPerTechnique: 5
    });
    
    const results = await session.run(mockContext);
    
    expect(session.tokensUsed).toBeLessThanOrEqual(1000);
  });
  
  test('provides escape hatches', async () => {
    const session = new LateralThinkingSession(defaultConfig);
    
    expect(session.escapeHatchesAvailable()).toEqual([
      'skip-to-baseline',
      'quick-mode',
      'stop-and-converge'
    ]);
  });
});
```

### Integration Tests

```javascript
describe('Task Master Integration', () => {
  test('triggers after research completion', async () => {
    await completeTask('research-auth-approaches');
    
    const triggers = await getActiveTriggers();
    
    expect(triggers).toContainEqual({
      type: 'lateral-thinking',
      condition: 'postResearch',
      message: expect.stringContaining('Explore alternatives')
    });
  });
});
```

---

## Troubleshooting Setup

### Skill Not Loading

**Issue**: Lateral thinking skill not recognized

**Solutions**:
1. Verify file location: `~/.claude/skills/lateral-thinking/SKILL.md` exists
2. Check metadata.json is valid JSON: `cat metadata.json | jq .`
3. Restart Claude to reload skills
4. Check Claude logs for skill loading errors

### Auto-Trigger Not Working

**Issue**: Expected triggers not firing

**Solutions**:
1. Verify `autoActivate: true` in metadata.json
2. Check trigger conditions in config match your workflow
3. Review detection patterns in metadata.json
4. Enable debug logging: `LATERAL_THINKING_DEBUG=true`

### Token Budget Issues

**Issue**: Sessions exceeding budget or terminating early

**Solutions**:
1. Reduce `ideasPerTechnique` from 5 to 3
2. Decrease `techniques` from 2 to 1
3. Disable `autoConverge` to skip curation phase
4. Use `quickMode` preset for time-constrained situations

---

## Advanced Configuration

### Custom Technique Pipeline

```json
{
  "lateralThinking": {
    "customPipeline": {
      "enabled": true,
      "stages": [
        {
          "name": "initial-divergence",
          "techniques": ["provocations", "bad-ideas"],
          "ideasPerTechnique": 5
        },
        {
          "name": "refinement",
          "techniques": ["scamper"],
          "input": "best-from-previous",
          "ideasPerTechnique": 3
        }
      ]
    }
  }
}
```

### Context-Aware Technique Selection

```javascript
function selectTechniques(context) {
  const { problemType, hasResearch, complexity, stuckCount } = context;
  
  // Stuck state → disruptive techniques
  if (stuckCount >= 3) {
    return ['provocations', 'bad-ideas'];
  }
  
  // Has baseline → systematic variation
  if (hasResearch && context.baseline) {
    return ['scamper', 'six-hats'];
  }
  
  // High complexity → comprehensive
  if (complexity > 7) {
    return ['six-hats', 'scamper', 'provocations'];
  }
  
  // Default
  return ['scamper', 'provocations'];
}
```

---

## Next Steps

After installation:
1. ✅ Test basic invocation: "Use lateral thinking on [problem]"
2. ✅ Configure triggers for your workflow
3. ✅ Adjust token budget based on usage patterns
4. ✅ Review API Reference for technique deep-dive
5. ✅ Check Troubleshooting guide if issues arise

**Recommended**: Start with `autoActivate: false` and manual invocation, then enable auto-triggers once comfortable with the tool.

