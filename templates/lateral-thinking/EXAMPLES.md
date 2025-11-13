# Lateral Thinking Integration Examples

## Complete Workflow Examples

### Example 1: Post-Research Workflow

**Scenario:** User has researched authentication approaches and is ready to choose an implementation.

#### Step-by-Step Flow

```javascript
// 1. Research Phase Completes
const researchFindings = {
  topic: 'Modern authentication strategies',
  findings: {
    jwt: { pros: ['Stateless', 'Scalable'], cons: ['Token size', 'Revocation'] },
    sessions: { pros: ['Easy revocation'], cons: ['Server memory', 'Sticky sessions'] },
    oauth: { pros: ['Delegated auth'], cons: ['Complexity', 'Dependency'] }
  },
  recommendation: 'JWT with refresh tokens'
};

// 2. Hook Detects Post-Research Trigger
const context = {
  lastCommand: 'research',
  researchComplete: true,
  researchFindings,
  task: {
    id: '5.2',
    description: 'Implement user authentication',
    status: 'in-progress'
  }
};

const detector = new LateralThinkingDetector();
const trigger = detector.detect(context);

console.log(trigger);
// {
//   shouldTrigger: true,
//   type: 'postResearch',
//   confidence: 0.7,
//   message: 'Research complete. Explore creative alternatives before planning?',
//   actions: [...]
// }

// 3. User Accepts Trigger
const userChoice = 'Yes, explore alternatives';

// 4. Lateral Thinking Session Runs
const lateralSession = new LateralThinkingSession({
  tokenBudget: 3000,
  techniques: 2,  // SCAMPER + Provocations
  ideasPerTechnique: 5,
  autoConverge: true,
  presentTopN: 3
});

const results = await lateralSession.run({
  problem: 'Implement user authentication for our API',
  research: researchFindings,
  baseline: researchFindings.recommendation,
  constraints: [
    'Must support mobile apps',
    'Need offline capability',
    'Team experienced with Node.js'
  ],
  goals: [
    'Minimize latency',
    'Easy user experience',
    'Secure against common attacks'
  ]
});

// 5. Results Presented to User
console.log(results.topOptions);
/*
[
  {
    rank: 1,
    title: 'Stateless Tokens with Client-Side Validation',
    confidence: 0.85,
    technique: 'scamper-eliminate',
    description: 'Eliminate backend validation entirely—clients validate tokens cryptographically',
    why: 'Zero backend auth latency, perfect for offline-first apps',
    caution: 'Requires robust client security, careful key management',
    nextSteps: [
      'Research client-side crypto libraries',
      'Design key rotation strategy',
      'Prototype with small user group'
    ]
  },
  {
    rank: 2,
    title: 'Biometric-Only Auth (No Passwords)',
    confidence: 0.72,
    technique: 'provocations-contradiction',
    description: 'Users never create passwords—only biometric authentication',
    why: 'Better UX, eliminates password attacks, mobile-native',
    caution: 'Platform-dependent, fallback needed for desktop',
    nextSteps: [...]
  },
  {
    rank: 3,
    title: 'Progressive Trust Model',
    confidence: 0.68,
    technique: 'six-hats-green',
    description: 'Start users anonymous, increase auth requirements only when needed',
    why: 'Minimal friction, optional heavy auth for sensitive actions',
    caution: 'Complex permission system, migration path for anonymous users',
    nextSteps: [...]
  }
]
*/

// 6. User Chooses Path
const chosenPath = results.topOptions[0];

// 7. Planning Phase with Chosen Approach
await createImplementationPlan({
  task: context.task,
  approach: chosenPath,
  baseline: results.baseline  // Still available as fallback
});
```

#### Output to User

```markdown
🔬 Research Complete: Modern authentication strategies

📚 Research Summary:
   - JWT: Stateless, scalable, but hard to revoke
   - Sessions: Easy revocation, but server-dependent
   - OAuth: Delegated auth, but complex
   Recommendation: JWT with refresh tokens

🎨 Lateral Thinking Exploration
━━━━━━━━━━━━━━━━━━━━━━━━━━

Applied Techniques: SCAMPER (Eliminate), Provocations
Ideas Generated: 10 → Clustered: 5 → Top: 3

💡 Alternative Approaches:

1. STATELESS TOKENS WITH CLIENT-SIDE VALIDATION (⭐ 0.85)
   Instead of validating tokens on the server, clients validate cryptographically
   
   ✅ Why interesting:
   - Zero backend auth latency
   - Perfect for offline-first mobile apps
   - Eliminates auth server as bottleneck
   
   ⚠️ Consider carefully:
   - Requires robust client security
   - Careful key management and rotation
   - Need fallback for compromised clients
   
   📋 Next Steps:
   - Research client-side crypto libraries (WebCrypto, native)
   - Design key rotation strategy
   - Prototype with small test group

2. BIOMETRIC-ONLY AUTH (⭐ 0.72)
   Users never create passwords—only biometric authentication
   
   [Details...]

3. PROGRESSIVE TRUST MODEL (⭐ 0.68)
   Start users anonymous, increase auth requirements per action sensitivity
   
   [Details...]

📊 Standard Approach (Baseline):
   JWT with refresh tokens (from research recommendation)
   Expected Complexity: Medium | Timeline: 2 weeks

⚡ Choose Your Path:
   → "Explore option #1 deeper" - Deep dive stateless approach
   → "Combine #1 + #3" - Hybrid stateless + progressive
   → "Use baseline approach" - Standard JWT implementation
   → "Generate more ideas" - Another lateral thinking round
```

---

### Example 2: Stuck State Detection

**Scenario:** Developer has tried implementing a caching strategy 3 times with similar failures.

```javascript
// Context after 3rd failed attempt
const context = {
  task: {
    id: '8.3',
    description: 'Implement Redis caching for API responses',
    status: 'in-progress'
  },
  history: [
    {
      taskId: '8.3',
      attempt: 1,
      approach: 'Cache all GET requests with 5-minute TTL',
      result: 'failed',
      issue: 'Stale data causing inconsistencies'
    },
    {
      taskId: '8.3',
      attempt: 2,
      approach: 'Cache with shorter TTL (30 seconds)',
      result: 'failed',
      issue: 'Still showing stale data, higher cache miss rate'
    },
    {
      taskId: '8.3',
      attempt: 3,
      approach: 'Implement cache invalidation on writes',
      result: 'failed',
      issue: 'Missed some invalidation paths, still inconsistent'
    }
  ]
};

// Detector identifies stuck state
const detector = new LateralThinkingDetector();
const trigger = detector.detect(context);

console.log(trigger);
// {
//   shouldTrigger: true,
//   type: 'stuckState',
//   confidence: 0.8,
//   message: 'Detected repeated attempts. Try creative reframing? (3 attempts, circular reasoning detected)',
//   context: {
//     failedAttempts: 3,
//     circularReasoning: true,
//     recentApproaches: [...]
//   }
// }

// Run lateral thinking with focus on reframing
const results = await lateralSession.run({
  problem: 'Achieve data consistency with caching',
  baseline: 'Redis cache with invalidation',
  history: context.history,
  constraints: ['Must reduce DB load', 'Need sub-100ms response'],
  goals: ['Data consistency', 'Performance improvement']
});

// Suggested alternative framings:
/*
1. INVERT: Don't cache responses, cache database queries only
   → Allows finer-grained invalidation, consistent at API layer
   
2. ELIMINATE: Remove cache entirely, optimize database instead
   → Add indexes, read replicas, query optimization
   
3. REVERSE: Instead of invalidating on writes, proactively refresh
   → Background worker updates cache before expiry
   
4. SUBSTITUTE: Replace Redis with event-sourced cache
   → Replay events to rebuild cache, always consistent
*/
```

#### Output to User

```markdown
⚠️  Stuck State Detected

After 3 attempts, you're still encountering cache consistency issues.
The approaches have been similar (TTL variations + invalidation).

🎨 Let's Reframe the Problem
━━━━━━━━━━━━━━━━━━━━━━━━━━

Applied: Provocations (Challenge assumptions) + Bad Ideas

💡 Alternative Problem Framings:

1. INVERT THE CACHING LAYER (⭐ 0.88)
   Provocation: "What if we cached the wrong thing?"
   
   New Framing: Cache database *queries*, not API *responses*
   
   ✅ Why this helps:
   - Invalidation granularity at query level
   - Multiple responses can share same query cache
   - Consistency maintained at presentation layer
   
   📋 Implementation:
   - Intercept ORM/query layer
   - Cache query results with query hash as key
   - Invalidate by table/row changes
   
   Estimated Complexity: Medium | Different from previous: High

2. ELIMINATE CACHING, OPTIMIZE SOURCE (⭐ 0.75)
   Bad Idea: "What if cache is the problem, not the solution?"
   
   New Framing: Your DB is slow because of missing indexes, not volume
   
   [Details...]

3. EVENT-SOURCED CACHE (⭐ 0.70)
   Provocation: "What if consistency was automatic?"
   
   [Details...]

📊 Your Previous Approaches:
   All focused on TTL + invalidation timing
   Core assumption: Cache must be write-behind with manual invalidation
   
   New options question this assumption entirely

⚡ Recommended:
   Option #1 (Query-level caching) addresses your specific invalidation challenges
   while maintaining the performance goal. Worth prototyping.
```

---

### Example 3: Pre-Research Question Framing

**Scenario:** User about to research solutions for "slow dashboard" problem.

```javascript
const context = {
  aboutToResearch: true,
  task: {
    description: 'Dashboard is slow, investigate solutions',
    complexity: 7
  },
  problemFraming: 'How to make dashboard load faster?'
};

const trigger = detector.detect(context);
// {
//   shouldTrigger: true,
//   type: 'preResearch',
//   message: 'Challenge problem framing with lateral thinking before researching?'
// }

// User accepts

const results = await lateralSession.run({
  problem: context.problemFraming,
  goal: 'Better research questions',
  technique: 'provocations'  // Focus on reframing
});

// Results suggest alternative questions to research:
/*
Original: "How to make dashboard load faster?"

Alternative Research Questions:

1. "Does the dashboard need to load at all?"
   → Research: Progressive web apps, skeleton screens, streaming updates
   
2. "What if users don't actually need real-time data?"
   → Research: Polling intervals, user expectations, acceptable delays
   
3. "Is 'slow' the real problem or is it 'feels slow'?"
   → Research: Perceived performance, loading indicators, optimistic UI
   
4. "What if we removed features instead of optimizing?"
   → Research: Feature usage analytics, dashboard minimalism
*/
```

#### Output to User

```markdown
🔍 About to Research: Dashboard performance solutions

Before diving into optimization techniques, let's challenge the problem framing:

🎨 Alternative Questions to Research:

1. **"Does the dashboard need to 'load' at all?"**
   
   Current frame: Dashboard is one big load event
   Reframe: Dashboard streams in progressively
   
   Research: Progressive loading, skeleton screens, streaming SSE
   Why better: Might discover solutions that feel faster without being faster
   
2. **"What if 'slow' is a perception problem, not a speed problem?"**
   
   [Details...]

3. **"Are we optimizing the wrong thing?"**
   
   [Details...]

📊 These reframings might lead you to research:
   - Perceived performance techniques (might be cheaper than actual optimization)
   - Feature removal (might be faster than adding code)
   - Async architectures (might be more elegant than caching)

⚡ Recommendation:
   Research question #1 ("progressive loading") first—it addresses the UX
   impact directly and may reveal that full optimization isn't needed.

   Original question still valid as fallback.
```

---

## Integration Patterns

### Pattern 1: Chain with Task Master

```javascript
// In task master workflow
import { lateralThinkingHook } from '../hooks/lateralThinkingDetector.js';

async function completeTask(taskId) {
  const task = await getTask(taskId);
  
  // Update status
  await updateTaskStatus(taskId, 'done');
  
  // Get next task
  const nextTask = await getNextTask();
  
  // Check if lateral thinking should trigger
  const trigger = lateralThinkingHook({
    lastTask: task,
    nextTask: nextTask,
    lastCommand: 'task-complete',
    aboutToPlan: nextTask.status === 'pending' && !nextTask.plan
  });
  
  if (trigger.shouldTrigger) {
    return {
      nextTask,
      suggestion: trigger,
      workflow: 'lateral-thinking-before-planning'
    };
  }
  
  return { nextTask, workflow: 'standard' };
}
```

### Pattern 2: Chain with Research FOB

```javascript
// In research FOB completion
async function completeResearch(query, findings) {
  // Store research
  await storeResearchFindings(findings);
  
  // Check for lateral thinking trigger
  const trigger = lateralThinkingHook({
    lastCommand: 'research',
    researchComplete: true,
    researchFindings: findings,
    task: getCurrentTask()
  });
  
  if (trigger.shouldTrigger && trigger.confidence > 0.7) {
    // Auto-suggest lateral thinking
    return {
      findings,
      nextStep: {
        type: 'lateral-thinking',
        message: trigger.message,
        actions: trigger.actions,
        config: trigger.config
      }
    };
  }
  
  return { findings, nextStep: { type: 'planning' } };
}
```

### Pattern 3: Explicit Invocation

```javascript
// Direct API usage
import { LateralThinkingSession } from './lateral-thinking.js';

async function applyLateralThinking(problem, context) {
  const session = new LateralThinkingSession({
    tokenBudget: 3000,
    techniques: ['scamper', 'provocations'],
    ideasPerTechnique: 5
  });
  
  const results = await session.run({
    problem,
    ...context
  });
  
  return results;
}

// CLI usage
// $ orchestrator lateral-thinking "Implement authentication" --research-file=./research.md
```

---

## Testing Workflows

### Unit Test: Trigger Detection

```javascript
import { describe, test, expect } from 'vitest';
import { LateralThinkingDetector, TriggerTypes } from './lateralThinkingDetector.js';

describe('Lateral Thinking Detector', () => {
  test('detects post-research trigger', () => {
    const detector = new LateralThinkingDetector();
    
    const context = {
      lastCommand: 'research',
      researchComplete: true,
      task: { status: 'in-progress' }
    };
    
    const result = detector.detect(context);
    
    expect(result.shouldTrigger).toBe(true);
    expect(result.type).toBe(TriggerTypes.POST_RESEARCH);
    expect(result.confidence).toBeGreaterThan(0.6);
  });
  
  test('detects stuck state after 3 failures', () => {
    const detector = new LateralThinkingDetector();
    
    const context = {
      task: { id: '5' },
      history: [
        { taskId: '5', result: 'failed' },
        { taskId: '5', result: 'failed' },
        { taskId: '5', result: 'failed' }
      ]
    };
    
    const result = detector.detect(context);
    
    expect(result.shouldTrigger).toBe(true);
    expect(result.type).toBe(TriggerTypes.STUCK_STATE);
  });
  
  test('respects cooldown period', () => {
    const detector = new LateralThinkingDetector({
      cooldownPeriod: 5000  // 5 seconds
    });
    
    // First trigger
    const result1 = detector.detect({ lastCommand: 'research', researchComplete: true });
    expect(result1.shouldTrigger).toBe(true);
    
    // Immediate second trigger - should be blocked
    const result2 = detector.detect({ lastCommand: 'research', researchComplete: true });
    expect(result2.shouldTrigger).toBe(false);
    expect(result2.reason).toContain('cooldown');
  });
});
```

### Integration Test: Full Workflow

```javascript
describe('Lateral Thinking Integration', () => {
  test('complete post-research workflow', async () => {
    // 1. Complete research
    const findings = await completeResearch('auth strategies');
    
    // 2. Trigger should activate
    expect(findings.nextStep.type).toBe('lateral-thinking');
    
    // 3. Run lateral thinking
    const lateralResults = await runLateralThinking({
      problem: 'Implement authentication',
      research: findings
    });
    
    // 4. Should return curated options
    expect(lateralResults.topOptions).toHaveLength(3);
    expect(lateralResults.baseline).toBeDefined();
    expect(lateralResults.topOptions[0].confidence).toBeGreaterThan(0.6);
    
    // 5. Should provide actions
    expect(lateralResults.recommendations).toContain('Deep dive');
  });
});
```

---

## Advanced Examples

### Custom Technique Pipeline

```javascript
const session = new LateralThinkingSession({
  customPipeline: {
    enabled: true,
    stages: [
      {
        name: 'disrupt',
        techniques: ['provocations', 'bad-ideas'],
        ideasPerTechnique: 7
      },
      {
        name: 'refine',
        techniques: ['scamper'],
        input: 'best-from-previous',  // Take top 3 from stage 1
        ideasPerTechnique: 3
      },
      {
        name: 'validate',
        techniques: ['six-hats'],
        input: 'best-from-previous',
        focus: ['black-hat', 'yellow-hat']  // Only caution + benefits
      }
    ]
  }
});
```

### Context-Aware Technique Selection

```javascript
function selectTechniquesForContext(context) {
  const { problemType, complexity, hasBaseline, stuckCount } = context;
  
  // Stuck state → most disruptive
  if (stuckCount >= 3) {
    return {
      techniques: ['provocations', 'bad-ideas'],
      rationale: 'Breaking out of circular reasoning with disruption'
    };
  }
  
  // Has baseline → systematic variation
  if (hasBaseline) {
    return {
      techniques: ['scamper', 'six-hats'],
      rationale: 'Exploring variations of known approach'
    };
  }
  
  // High complexity → comprehensive
  if (complexity >= 8) {
    return {
      techniques: ['six-hats', 'scamper', 'provocations'],
      rationale: 'Multi-angle exploration for wicked problem'
    };
  }
  
  // Default
  return {
    techniques: ['scamper', 'provocations'],
    rationale: 'Balanced systematic + disruptive'
  };
}
```

---

For more examples, see:
- [API Reference](resources/api-reference.md) - Technical implementation details
- [Troubleshooting](resources/troubleshooting.md) - Common issues and solutions
- [Setup Guide](resources/setup-guide.md) - Integration configuration

