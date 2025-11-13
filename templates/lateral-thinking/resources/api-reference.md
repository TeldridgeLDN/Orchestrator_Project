# Lateral Thinking API Reference

## Core API

### `LateralThinkingSession`

Main session controller for lateral thinking operations.

```javascript
class LateralThinkingSession {
  constructor(config: SessionConfig)
  async run(context: ProblemContext): Promise<SessionResult>
  async diverge(techniques: Technique[]): Promise<Idea[]>
  async converge(ideas: Idea[]): Promise<CuratedIdea[]>
  async deliver(): Promise<Output>
}
```

#### SessionConfig

```typescript
interface SessionConfig {
  tokenBudget: number;           // Max tokens for session (default: 3000)
  techniques: number;            // Number of techniques to apply (default: 2)
  ideasPerTechnique: number;     // Ideas per technique (default: 5)
  autoConverge: boolean;         // Auto-curate results (default: true)
  presentTopN: number;           // Final options to show (default: 3)
  includeBaseline: boolean;      // Show standard approach (default: true)
  minConfidence: number;         // Min score to present (default: 0.6)
}
```

#### ProblemContext

```typescript
interface ProblemContext {
  problem: string;               // Problem description
  research?: ResearchFindings;   // Optional research findings
  baseline?: Solution;           // Optional baseline solution
  constraints?: Constraint[];    // Problem constraints
  goals?: string[];             // Desired outcomes
  history?: Attempt[];          // Previous attempts
  metadata?: Record<string, any>;
}
```

#### SessionResult

```typescript
interface SessionResult {
  topOptions: CuratedIdea[];    // Top N curated ideas
  baseline?: Solution;           // Baseline approach
  allIdeas: Idea[];             // All generated ideas
  metrics: SessionMetrics;       // Performance metrics
  recommendations: string[];     // Next step suggestions
}
```

---

## Techniques

### 1. SCAMPER

Systematic transformation through seven dimensions.

```javascript
class SCAMPERTechnique extends Technique {
  async generate(context: ProblemContext, config: TechniqueConfig): Promise<Idea[]>
}
```

#### Dimensions

**Substitute** - Replace components with alternatives
```typescript
{
  dimension: 'substitute',
  prompt: 'What can we replace or substitute in this solution?',
  focus: ['components', 'materials', 'processes', 'people', 'technology']
}
```

**Combine** - Merge elements or concepts
```typescript
{
  dimension: 'combine',
  prompt: 'What can we combine or merge?',
  focus: ['features', 'services', 'technologies', 'workflows']
}
```

**Adapt** - Adjust for different context
```typescript
{
  dimension: 'adapt',
  prompt: 'How can we adapt this for different contexts?',
  focus: ['scaling', 'different users', 'different environments']
}
```

**Modify** - Change attributes
```typescript
{
  dimension: 'modify',
  prompt: 'What can we change, magnify, or minimize?',
  focus: ['size', 'speed', 'complexity', 'scope']
}
```

**Put to other uses** - Repurpose
```typescript
{
  dimension: 'put-to-use',
  prompt: 'What else can this be used for?',
  focus: ['alternative applications', 'different problems', 'new markets']
}
```

**Eliminate** - Remove unnecessary elements
```typescript
{
  dimension: 'eliminate',
  prompt: 'What can we remove or simplify?',
  focus: ['features', 'steps', 'complexity', 'dependencies']
}
```

**Reverse** - Flip or invert
```typescript
{
  dimension: 'reverse',
  prompt: 'What if we reversed or inverted this?',
  focus: ['flow', 'responsibility', 'assumptions', 'order']
}
```

#### Example Output

```javascript
{
  technique: 'scamper',
  ideas: [
    {
      dimension: 'eliminate',
      title: 'Zero-State Architecture',
      description: 'Eliminate backend entirely—move all logic to edge/client',
      novelty: 0.9,
      feasibility: 0.6
    },
    {
      dimension: 'reverse',
      title: 'Push Instead of Pull',
      description: 'Invert data flow—server pushes updates instead of client polling',
      novelty: 0.7,
      feasibility: 0.8
    }
    // ... 5 more ideas
  ]
}
```

---

### 2. Six Thinking Hats

Multi-perspective analysis framework.

```javascript
class SixThinkingHats extends Technique {
  async generate(context: ProblemContext, config: TechniqueConfig): Promise<Idea[]>
}
```

#### Hat Perspectives

**White Hat** - Data and facts
```typescript
{
  hat: 'white',
  focus: 'objective information',
  questions: [
    'What data do we have?',
    'What data is missing?',
    'What do the facts tell us?'
  ]
}
```

**Red Hat** - Emotions and intuition
```typescript
{
  hat: 'red',
  focus: 'feelings and hunches',
  questions: [
    'What does intuition suggest?',
    'How do we feel about this?',
    'What are the emotional reactions?'
  ]
}
```

**Black Hat** - Caution and risks
```typescript
{
  hat: 'black',
  focus: 'potential problems',
  questions: [
    'What could go wrong?',
    'What are the weaknesses?',
    'Why might this fail?'
  ]
}
```

**Yellow Hat** - Benefits and optimism
```typescript
{
  hat: 'yellow',
  focus: 'positive outcomes',
  questions: [
    'What are the benefits?',
    'Best case scenario?',
    'What value does this create?'
  ]
}
```

**Green Hat** - Creativity and alternatives
```typescript
{
  hat: 'green',
  focus: 'new ideas',
  questions: [
    'What are alternative approaches?',
    'How can we think differently?',
    'What if we broke the rules?'
  ]
}
```

**Blue Hat** - Process and control
```typescript
{
  hat: 'blue',
  focus: 'meta-thinking',
  questions: [
    'What thinking process should we use?',
    'How do we organize this analysis?',
    'What have we learned?'
  ]
}
```

#### Example Output

```javascript
{
  technique: 'six-hats',
  ideas: [
    {
      hat: 'green',
      title: 'Blockchain-Based Auth',
      description: 'Use decentralized identity instead of centralized auth',
      perspective: 'creative alternatives',
      novelty: 0.95
    },
    {
      hat: 'black',
      title: 'Identify Failure Modes',
      description: 'Current approach vulnerable to token theft—need rotation strategy',
      perspective: 'risk analysis',
      novelty: 0.3,
      utility: 0.9
    }
    // ... 4 more perspectives
  ]
}
```

---

### 3. Provocations

Deliberately false statements to disrupt thinking patterns.

```javascript
class ProvocationsTechnique extends Technique {
  async generate(context: ProblemContext, config: TechniqueConfig): Promise<Idea[]>
}
```

#### Provocation Types

**Contradiction**
```typescript
{
  type: 'contradiction',
  pattern: 'What if [opposite of assumption] were true?',
  example: 'What if users didn\'t need authentication at all?'
}
```

**Distortion**
```typescript
{
  type: 'distortion',
  pattern: 'What if [extreme version]?',
  example: 'What if tokens expired after 1 second?'
}
```

**Reversal**
```typescript
{
  type: 'reversal',
  pattern: 'What if we reversed [key aspect]?',
  example: 'What if the client authenticated the server instead?'
}
```

**Wishful Thinking**
```typescript
{
  type: 'wishful',
  pattern: 'What if [ideal impossible scenario]?',
  example: 'What if authentication happened instantly without any credentials?'
}
```

**Escapism**
```typescript
{
  type: 'escapism',
  pattern: 'What if [remove constraint]?',
  example: 'What if we didn\'t care about security at all?'
}
```

#### Example Output

```javascript
{
  technique: 'provocations',
  ideas: [
    {
      provocation: 'Users don\'t need passwords',
      type: 'contradiction',
      extraction: 'Passwordless auth via biometrics or magic links',
      novelty: 0.8,
      feasibility: 0.85
    },
    {
      provocation: 'Authentication takes 0 seconds',
      type: 'wishful',
      extraction: 'Pre-authenticate based on device fingerprint, confirm in background',
      novelty: 0.75,
      feasibility: 0.7
    }
  ]
}
```

---

### 4. Random Metaphors

Force connections between random items and the problem.

```javascript
class RandomMetaphorsTechnique extends Technique {
  async generate(context: ProblemContext, config: TechniqueConfig): Promise<Idea[]>
}
```

#### Metaphor Sources

```typescript
const metaphorSources = [
  'nature',      // Trees, rivers, ecosystems
  'everyday',    // Kitchen, vehicles, tools
  'games',       // Chess, poker, sports
  'biology',     // Immune system, evolution
  'architecture' // Buildings, cities, infrastructure
];
```

#### Generation Process

1. **Select random item**: "Museum exhibition"
2. **List attributes**: "Visitors walk around", "Curated displays", "Educational experience"
3. **Force connections**: "What if auth was like a museum tour?"
4. **Extract ideas**: "Progressive disclosure of permissions", "Tour guide (wizard) for setup"

#### Example Output

```javascript
{
  technique: 'random-metaphors',
  ideas: [
    {
      metaphor: 'Restaurant reservations',
      attributes: ['booking ahead', 'time slots', 'confirmation', 'no-show handling'],
      connection: 'Pre-booking authentication sessions',
      idea: {
        title: 'Reservation-Based Auth',
        description: 'Users "book" authenticated sessions ahead of time, server prepares resources',
        novelty: 0.85,
        feasibility: 0.5
      }
    }
  ]
}
```

---

### 5. Bad Ideas

Generate intentionally terrible ideas to find hidden value.

```javascript
class BadIdeasTechnique extends Technique {
  async generate(context: ProblemContext, config: TechniqueConfig): Promise<Idea[]>
}
```

#### Bad Idea Patterns

**Intentionally Insecure**
```typescript
'Store passwords in plain text'
→ Extract: 'Passwords aren\'t the problem—eliminate them entirely'
```

**Intentionally Slow**
```typescript
'Add 10-second delay to every request'
→ Extract: 'Rate limiting as core security feature, not afterthought'
```

**Intentionally Complex**
```typescript
'Require 5-factor authentication for every action'
→ Extract: 'Context-aware security—higher security for sensitive actions only'
```

**Intentionally Expensive**
```typescript
'Run blockchain verification for every login'
→ Extract: 'Verification burden distributed across network, not single server'
```

#### Example Output

```javascript
{
  technique: 'bad-ideas',
  ideas: [
    {
      badIdea: 'Let users create accounts without any information',
      why_bad: 'No way to recover account or contact user',
      extraction: 'Optional progressive profile—start anonymous, upgrade when needed',
      value: {
        title: 'Anonymous-First Auth',
        description: 'Users start with zero-info accounts, add details only when features require',
        novelty: 0.8,
        feasibility: 0.75
      }
    }
  ]
}
```

---

## Convergence Algorithm

### Scoring Function

```javascript
function scoreIdea(idea: Idea, context: ProblemContext): Score {
  const feasibility = assessFeasibility(idea, context);
  const impact = assessImpact(idea, context);
  const novelty = assessNovelty(idea, context);
  const contextFit = assessContextFit(idea, context);
  
  return {
    total: (feasibility * 0.35) + (impact * 0.35) + (novelty * 0.20) + (contextFit * 0.10),
    breakdown: { feasibility, impact, novelty, contextFit },
    confidence: calculateConfidence([feasibility, impact, novelty, contextFit])
  };
}
```

### Feasibility Assessment

```typescript
function assessFeasibility(idea: Idea, context: ProblemContext): number {
  const factors = {
    technicalComplexity: evaluateComplexity(idea),
    resourceAvailability: checkResources(context),
    timeToImplement: estimateTime(idea),
    dependencyRisk: assessDependencies(idea),
    teamExpertise: evaluateExpertise(context, idea)
  };
  
  return weightedAverage(factors, {
    technicalComplexity: 0.3,
    resourceAvailability: 0.2,
    timeToImplement: 0.2,
    dependencyRisk: 0.15,
    teamExpertise: 0.15
  });
}
```

### Impact Assessment

```typescript
function assessImpact(idea: Idea, context: ProblemContext): number {
  const factors = {
    problemSolution: howWellDoesItSolve(idea, context.problem),
    benefitMagnitude: quantifyBenefits(idea),
    userValueCreated: assessUserValue(idea),
    strategicAlignment: checkAlignment(idea, context.goals)
  };
  
  return weightedAverage(factors, {
    problemSolution: 0.4,
    benefitMagnitude: 0.3,
    userValueCreated: 0.2,
    strategicAlignment: 0.1
  });
}
```

### Novelty Assessment

```typescript
function assessNovelty(idea: Idea, context: ProblemContext): number {
  return {
    uniqueness: compareToBaseline(idea, context.baseline),
    creativity: evaluateCreativity(idea),
    disruptiveness: measureDisruption(idea, context),
    learningPotential: assessLearning(idea)
  };
}
```

### Clustering Algorithm

```javascript
function clusterIdeas(ideas: Idea[]): Cluster[] {
  // 1. Extract feature vectors
  const vectors = ideas.map(idea => extractFeatures(idea));
  
  // 2. Calculate similarity matrix
  const similarities = calculateSimilarities(vectors);
  
  // 3. Hierarchical clustering
  const clusters = hierarchicalClustering(similarities, threshold: 0.7);
  
  // 4. Select representative from each cluster
  return clusters.map(cluster => ({
    representative: selectBest(cluster.ideas),
    alternatives: cluster.ideas.filter(i => i !== representative),
    theme: identifyTheme(cluster)
  }));
}
```

---

## Output Formatting

### Standard Output Template

```typescript
interface LateralThinkingOutput {
  summary: {
    context: string;
    baseline: string;
    techniquesApplied: string[];
  };
  
  topOptions: Array<{
    rank: number;
    title: string;
    description: string;
    confidence: number;
    why: string;                    // Why this is interesting
    caution: string;                // Potential issues
    nextSteps: string[];            // How to explore further
  }>;
  
  baseline: {
    approach: string;
    complexity: string;
    timeline: string;
  };
  
  actions: Array<{
    label: string;
    description: string;
    effect: string;
  }>;
  
  metrics: {
    ideasGenerated: number;
    ideasAfterClustering: number;
    topOptionsPresented: number;
    tokensUsed: number;
    timeElapsed: string;
  };
}
```

### Confidence Display

```typescript
function formatConfidence(score: number): string {
  if (score >= 0.8) return '🟢 High confidence';
  if (score >= 0.65) return '🟡 Medium confidence';
  if (score >= 0.5) return '🟠 Lower confidence';
  return '🔴 Exploratory only';
}
```

---

## Error Handling

### Graceful Degradation

```javascript
class LateralThinkingSession {
  async run(context) {
    try {
      return await this.runFull(context);
    } catch (error) {
      // Attempt graceful degradation
      if (error.type === 'TOKEN_BUDGET_EXCEEDED') {
        return await this.runPartial(context);
      }
      
      if (error.type === 'TECHNIQUE_FAILURE') {
        return await this.runWithFallback(context, error.failedTechnique);
      }
      
      // Cannot recover—inform user
      return {
        error: true,
        message: 'Lateral thinking session failed',
        fallback: 'Proceed with baseline approach',
        details: error
      };
    }
  }
}
```

### Technique Fallbacks

```typescript
const techniqueFallbacks = {
  'scamper': ['six-hats', 'provocations'],
  'six-hats': ['scamper', 'bad-ideas'],
  'provocations': ['bad-ideas', 'random-metaphors'],
  'random-metaphors': ['provocations', 'scamper'],
  'bad-ideas': ['provocations', 'scamper']
};
```

---

## Performance Metrics

### Session Metrics

```typescript
interface SessionMetrics {
  tokensUsed: number;
  timeElapsed: number;               // milliseconds
  ideasGenerated: number;
  ideasAfterClustering: number;
  topOptionsPresented: number;
  techniqueSuccess: Record<string, boolean>;
  convergenceTime: number;
  userSatisfaction?: number;         // Optional feedback
}
```

### Tracking

```javascript
class MetricsCollector {
  trackSession(session: LateralThinkingSession) {
    return {
      sessionId: session.id,
      timestamp: Date.now(),
      config: session.config,
      metrics: session.metrics,
      outcome: session.result.chosenOption,
      feedback: session.userFeedback
    };
  }
  
  async analyzePatterns() {
    const sessions = await this.getAllSessions();
    
    return {
      avgTokensUsed: mean(sessions.map(s => s.metrics.tokensUsed)),
      mostEffectiveTechniques: rankTechniques(sessions),
      successRate: calculateSuccessRate(sessions),
      avgSatisfaction: mean(sessions.map(s => s.feedback?.rating))
    };
  }
}
```

---

## Extension API

### Custom Techniques

```javascript
class CustomTechnique extends Technique {
  constructor(config) {
    super(config);
    this.name = config.name;
  }
  
  async generate(context, config) {
    // Implement custom generation logic
    const ideas = await this.yourLogic(context);
    
    // Return standardized format
    return ideas.map(idea => ({
      title: idea.title,
      description: idea.description,
      novelty: this.calculateNovelty(idea),
      feasibility: this.estimateFeasibility(idea),
      metadata: idea.extraData
    }));
  }
}

// Register custom technique
LateralThinking.registerTechnique('my-technique', CustomTechnique);
```

### Custom Scoring

```javascript
class CustomScorer extends Scorer {
  score(idea, context) {
    // Custom scoring logic
    return {
      total: yourCalculation(idea, context),
      breakdown: yourBreakdown(idea),
      confidence: yourConfidence(idea)
    };
  }
}

// Use custom scorer
session.setScorer(new CustomScorer());
```

