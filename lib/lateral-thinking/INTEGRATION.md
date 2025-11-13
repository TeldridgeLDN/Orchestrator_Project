# Lateral Thinking Integration Guide

Complete guide for integrating the Lateral Thinking FOB into the Orchestrator project's hook system and workflows.

---

## Table of Contents

1. [Quick Integration](#quick-integration)
2. [Hook System Integration](#hook-system-integration)
3. [Task Master Integration](#task-master-integration)
4. [Orchestrator Workflow Integration](#orchestrator-workflow-integration)
5. [Configuration](#configuration)
6. [Advanced Usage](#advanced-usage)
7. [Troubleshooting](#troubleshooting)

---

## Quick Integration

### Prerequisites

```bash
# 1. Set API key (choose one)
export ANTHROPIC_API_KEY="sk-ant-..."
# OR
export OPENAI_API_KEY="sk-..."

# 2. Install dependencies (already in package.json)
npm install

# 3. Test it works
node lib/lateral-thinking/demo.js --provider=anthropic
```

### Basic Usage

```javascript
import { LateralThinkingSession } from './lib/lateral-thinking/index.js';

const session = new LateralThinkingSession();

const results = await session.run({
  problem: 'Your problem here',
  baseline: 'Current approach',
  constraints: ['Constraint 1', 'Constraint 2'],
  goals: ['Goal 1', 'Goal 2']
});

console.log(results.topOptions);
```

---

## Hook System Integration

The Lateral Thinking detector is already implemented: `lib/hooks/lateralThinkingDetector.js`

### How It Works

The detector analyzes the current workflow state and suggests lateral thinking when:

1. **Post-Research** - After research is complete, before planning
2. **Stuck State** - User has been blocked on same task for a while
3. **High Complexity** - Task complexity score > 7
4. **Circular Reasoning** - Same prompt appears multiple times
5. **Explicit Request** - User asks for "creative" or "alternative" ideas
6. **Context Switch** - When switching to a different problem domain

### Integrating the Detector

```javascript
// In lib/hooks/index.js or your hook orchestrator

import { lateralThinkingHook } from './lateralThinkingDetector.js';
import { LateralThinkingSession } from '../lateral-thinking/index.js';

/**
 * Post-tool-use hook - Runs after each AI tool call
 */
export async function postToolUse(toolCall, result, context) {
  // Check if lateral thinking should be suggested
  const trigger = lateralThinkingHook({
    lastCommand: toolCall.name,
    researchComplete: context.researchComplete,
    task: context.currentTask,
    stuckCount: context.stuckCount,
    complexity: context.taskComplexity
  });

  if (trigger.shouldTrigger) {
    // Present option to user
    return {
      suggestion: trigger.message,
      confidence: trigger.confidence,
      priority: trigger.priority,
      options: [
        {
          label: 'Yes - Explore alternatives',
          action: 'run-lateral-thinking',
          mode: 'standard'
        },
        {
          label: 'Quick mode (faster)',
          action: 'run-lateral-thinking',
          mode: 'quick'
        },
        {
          label: 'Skip for now',
          action: 'continue'
        }
      ]
    };
  }
}

/**
 * Handler for when user chooses lateral thinking
 */
export async function runLateralThinking(mode, context) {
  const session = new LateralThinkingSession({
    tokenBudget: mode === 'quick' ? 1000 : 3000,
    techniques: mode === 'quick' ? ['provocations'] : ['scamper', 'provocations'],
    ideasPerTechnique: mode === 'quick' ? 3 : 5,
    presentTopN: mode === 'quick' ? 1 : 3
  });

  const results = await session.run({
    problem: context.currentTask?.description,
    baseline: context.currentApproach,
    constraints: context.constraints,
    goals: context.goals,
    stuckCount: context.stuckCount,
    complexity: context.taskComplexity
  });

  return results;
}
```

### Hook Registration

Add to your hook registry:

```javascript
// In lib/hooks/index.js

export const HOOK_TYPES = {
  PRE_CONFIG_MODIFICATION: 'PRE_CONFIG_MODIFICATION',
  USER_PROMPT_SUBMIT: 'USER_PROMPT_SUBMIT',
  POST_TOOL_USE: 'POST_TOOL_USE',
  PRE_PROJECT_SWITCH: 'PRE_PROJECT_SWITCH',
  POST_PROJECT_SWITCH: 'POST_PROJECT_SWITCH',
  LATERAL_THINKING_TRIGGER: 'LATERAL_THINKING_TRIGGER', // NEW
  LATERAL_THINKING_COMPLETE: 'LATERAL_THINKING_COMPLETE' // NEW
};

// Register hooks
registerHook(HOOK_TYPES.POST_TOOL_USE, postToolUse);
registerHook(HOOK_TYPES.LATERAL_THINKING_TRIGGER, lateralThinkingTrigger);
registerHook(HOOK_TYPES.LATERAL_THINKING_COMPLETE, lateralThinkingComplete);
```

---

## Task Master Integration

Integrate with Task Master's workflow for task planning and refinement.

### During Task Expansion

```javascript
// In task-master expand command

import { LateralThinkingSession } from '../lateral-thinking/index.js';

export async function expandTask(taskId, options) {
  const task = await getTask(taskId);
  
  // Check if lateral thinking would help
  if (task.complexity >= 7 || options.creative) {
    console.log('🎨 Exploring creative alternatives...');
    
    const session = new LateralThinkingSession();
    const results = await session.run({
      problem: task.description,
      baseline: task.details,
      constraints: task.constraints || [],
      goals: task.goals || []
    });
    
    // Add alternatives to task notes
    task.alternatives = results.topOptions;
    
    // Optionally update task description with insights
    if (options.updateTask) {
      task.details += '\n\n## Creative Alternatives:\n';
      results.topOptions.forEach((opt, i) => {
        task.details += `\n${i + 1}. ${opt.title}: ${opt.description}`;
      });
    }
    
    await updateTask(taskId, task);
  }
  
  // Continue with normal expansion
  return await expandTaskNormally(taskId, options);
}
```

### Custom Task Master Command

```javascript
// In lib/commands/lateral-thinking.js (NEW)

import { Command } from 'commander';
import { LateralThinkingSession } from '../lateral-thinking/index.js';
import { getTask, updateTask } from '../utils/taskmaster.js';

export const lateralThinkingCommand = new Command('lateral-thinking')
  .alias('lt')
  .description('Generate creative alternatives for a task')
  .argument('<task-id>', 'Task ID to explore alternatives for')
  .option('-q, --quick', 'Quick mode (faster, fewer ideas)')
  .option('-d, --deep', 'Deep exploration mode (more techniques)')
  .option('-u, --update', 'Update task with alternatives')
  .action(async (taskId, options) => {
    const task = await getTask(taskId);
    
    console.log(`🎨 Generating creative alternatives for task ${taskId}...`);
    
    const session = new LateralThinkingSession({
      tokenBudget: options.quick ? 1000 : options.deep ? 5000 : 3000,
      techniques: options.quick 
        ? ['provocations'] 
        : options.deep 
          ? ['scamper', 'six-hats', 'provocations']
          : ['scamper', 'provocations'],
      ideasPerTechnique: options.quick ? 3 : options.deep ? 7 : 5,
      presentTopN: options.quick ? 1 : 3
    });
    
    const results = await session.run({
      problem: task.description,
      baseline: task.details,
      constraints: task.constraints || [],
      goals: task.goals || []
    });
    
    // Display results
    console.log('\n💡 Top Alternatives:\n');
    results.topOptions.forEach((opt, i) => {
      console.log(`${i + 1}. ${opt.title} (${opt.confidence})`);
      console.log(`   ${opt.description}`);
      console.log(`   Scores: F:${opt.scores.feasibility.toFixed(2)} I:${opt.scores.impact.toFixed(2)} N:${opt.scores.novelty.toFixed(2)}\n`);
    });
    
    if (options.update) {
      task.alternatives = results.topOptions;
      await updateTask(taskId, task);
      console.log('✅ Task updated with alternatives');
    }
  });
```

Usage:
```bash
task-master lateral-thinking 5.2           # Standard mode
task-master lt 5.2 --quick                # Quick mode
task-master lt 5.2 --deep --update        # Deep + update task
```

---

## Orchestrator Workflow Integration

### Diet103 Context Integration

```javascript
// In lib/utils/skill-loader.js or context builder

import { lateralThinkingHook } from '../hooks/lateralThinkingDetector.js';

/**
 * Build context for Claude, including lateral thinking suggestions
 */
export function buildClaudeContext(project, currentTask) {
  const context = {
    project,
    currentTask,
    // ... other context
  };

  // Check if lateral thinking should be suggested
  const trigger = lateralThinkingHook({
    task: currentTask,
    complexity: currentTask.complexity,
    stuckCount: project.stuckCount
  });

  if (trigger.shouldTrigger) {
    context.suggestions = context.suggestions || [];
    context.suggestions.push({
      type: 'lateral-thinking',
      priority: trigger.priority,
      message: trigger.message,
      confidence: trigger.confidence
    });
  }

  return context;
}
```

### Claude Code Skills Integration

Create a skill that Claude can invoke:

```javascript
// In .claude/skills/lateral-thinking.js (NEW)

export async function generateAlternatives(problem, baseline, constraints, goals) {
  const { LateralThinkingSession } = await import('../../lib/lateral-thinking/index.js');
  
  const session = new LateralThinkingSession();
  
  const results = await session.run({
    problem,
    baseline,
    constraints: constraints || [],
    goals: goals || []
  });
  
  return {
    alternatives: results.topOptions,
    metrics: results.metrics,
    actions: results.actions
  };
}

// Skill metadata
export const metadata = {
  name: 'lateral-thinking',
  description: 'Generate creative alternatives using lateral thinking techniques',
  parameters: [
    { name: 'problem', type: 'string', required: true },
    { name: 'baseline', type: 'string', required: false },
    { name: 'constraints', type: 'array', required: false },
    { name: 'goals', type: 'array', required: false }
  ]
};
```

---

## Configuration

### Environment Variables

```bash
# LLM Provider Configuration
LATERAL_THINKING_LLM_PROVIDER=anthropic  # 'anthropic', 'openai', or 'mock'
LATERAL_THINKING_LLM_MODEL=claude-3-5-sonnet-20241022
LATERAL_THINKING_LLM_TEMPERATURE=0.7
LATERAL_THINKING_LLM_MAX_TOKENS=500

# API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Hook Configuration
LATERAL_THINKING_COOLDOWN=15  # Minutes between auto-suggestions
LATERAL_THINKING_MIN_CONFIDENCE=0.7  # Minimum confidence to trigger
```

### Project Configuration

Add to `.orchestrator/config.json`:

```json
{
  "features": {
    "lateralThinking": {
      "enabled": true,
      "autoSuggest": true,
      "cooldownMinutes": 15,
      "minConfidence": 0.7,
      "defaultMode": "standard",
      "techniques": ["scamper", "provocations"],
      "ideasPerTechnique": 5,
      "presentTopN": 3
    }
  }
}
```

---

## Advanced Usage

### Custom Techniques

Create your own technique:

```javascript
// In lib/lateral-thinking/techniques/my-technique.js

import { BaseTechnique } from './base-technique.js';

export class MyTechnique extends BaseTechnique {
  constructor(llmClient) {
    super('my-technique', 'My custom creativity technique', llmClient);
  }

  async generate(context, config) {
    const { ideasToGenerate = 5 } = config;
    const ideas = [];

    for (let i = 0; i < ideasToGenerate; i++) {
      const prompt = this._buildPrompt(context, i);
      const response = await this._callLLM(prompt, context);
      
      ideas.push({
        technique: 'my-technique',
        title: response.title,
        description: response.description,
        novelty: 0.7,
        feasibility: this._estimateFeasibility(response, context)
      });
    }

    return ideas;
  }

  _buildPrompt(context, iteration) {
    return `Generate idea ${iteration} for: ${context.problem}`;
  }
}
```

Register it:

```javascript
// In lib/lateral-thinking/index.js

import { MyTechnique } from './techniques/my-technique.js';

const TECHNIQUES = {
  scamper: SCAMPER,
  'six-hats': SixThinkingHats,
  provocations: Provocations,
  'random-metaphors': RandomMetaphors,
  'bad-ideas': BadIdeas,
  'my-technique': MyTechnique  // NEW
};
```

### Custom Scoring

```javascript
import { LateralThinkingSession } from './lib/lateral-thinking/index.js';
import { Scorer } from './lib/lateral-thinking/scoring/scorer.js';

// Custom scoring weights
const customScorer = new Scorer({
  feasibility: 0.5,  // Emphasize feasibility
  impact: 0.3,
  novelty: 0.1,      // De-emphasize novelty
  contextFit: 0.1
});

const session = new LateralThinkingSession({
  scorer: customScorer
});
```

### Integration with Research FOB

Chain lateral thinking after research:

```javascript
import { researchTopic } from './lib/research/index.js';
import { LateralThinkingSession } from './lib/lateral-thinking/index.js';

// 1. Research the problem
const research = await researchTopic('user authentication best practices');

// 2. Use research as context for lateral thinking
const session = new LateralThinkingSession();
const results = await session.run({
  problem: 'Implement mobile authentication',
  baseline: research.currentApproach,
  constraints: research.constraints,
  goals: research.recommendations
});

// 3. You now have research-backed creative alternatives
console.log(results.topOptions);
```

---

## Troubleshooting

### Common Issues

#### 1. API Key Not Found

```bash
Error: Anthropic API key not found
```

**Solution:**
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
# Or add to .env file
echo 'ANTHROPIC_API_KEY=sk-ant-...' >> .env
```

#### 2. Mock Mode Always Running

**Problem:** Even with API key set, uses mock mode

**Solution:** Explicitly set provider:
```javascript
const llmClient = new LLMClient({
  provider: 'anthropic',  // Don't rely on default
  apiKey: process.env.ANTHROPIC_API_KEY
});
```

#### 3. Timeout Errors

```bash
Error: LLM request timed out
```

**Solution:** Increase timeout:
```javascript
const llmClient = new LLMClient({
  provider: 'anthropic',
  timeout: 60000  // 60 seconds
});
```

#### 4. JSON Parsing Errors

```bash
Error: Failed to parse LLM response
```

**Solution:** The system handles this automatically with fallbacks. If persistent:
- Check LLM temperature (lower = more structured)
- Verify prompt clarity
- Check logs for actual response

#### 5. Hook Not Triggering

**Problem:** Lateral thinking never suggested

**Solution:** Check detection conditions:
```javascript
import { lateralThinkingHook } from './lib/hooks/lateralThinkingDetector.js';

// Debug trigger conditions
const trigger = lateralThinkingHook({
  lastCommand: 'research',
  researchComplete: true,  // Must be true
  task: currentTask
});

console.log('Should trigger?', trigger.shouldTrigger);
console.log('Reason:', trigger.reason);
console.log('Confidence:', trigger.confidence);
```

---

## Testing Your Integration

### 1. Unit Test

```javascript
// test/lateral-thinking-integration.test.js

import { LateralThinkingSession } from '../lib/lateral-thinking/index.js';
import { lateralThinkingHook } from '../lib/hooks/lateralThinkingDetector.js';

describe('Lateral Thinking Integration', () => {
  it('should integrate with hooks', () => {
    const trigger = lateralThinkingHook({
      lastCommand: 'research',
      researchComplete: true,
      task: { complexity: 8 }
    });
    
    expect(trigger.shouldTrigger).toBe(true);
  });

  it('should run full workflow', async () => {
    const session = new LateralThinkingSession();
    const results = await session.run({
      problem: 'Test problem'
    });
    
    expect(results.topOptions).toBeDefined();
    expect(results.metrics).toBeDefined();
  });
});
```

### 2. Integration Test

```bash
# Run demo script
node lib/lateral-thinking/demo.js

# Should see:
# - 3 scenarios processed
# - Ideas generated for each
# - Scores and rationale displayed
# - No errors
```

### 3. Hook Test

```javascript
// In your hook test suite

import { postToolUse } from '../lib/hooks/index.js';

describe('Post Tool Use Hook', () => {
  it('should suggest lateral thinking after research', async () => {
    const result = await postToolUse(
      { name: 'research' },
      { complete: true },
      { 
        researchComplete: true,
        currentTask: { complexity: 8 }
      }
    );
    
    expect(result.suggestion).toContain('creative');
    expect(result.options).toHaveLength(3);
  });
});
```

---

## Performance Considerations

### Token Usage

Typical token usage per session:
- **Quick mode:** ~500-1000 tokens
- **Standard mode:** ~1500-3000 tokens
- **Deep mode:** ~3000-5000 tokens

### Response Times

With real LLM:
- **Quick mode:** 3-10 seconds
- **Standard mode:** 10-30 seconds
- **Deep mode:** 30-60 seconds

With mock LLM:
- All modes: <1 second

### Caching Strategy

```javascript
// Cache results for repeated contexts
const cache = new Map();

async function runWithCache(context) {
  const key = JSON.stringify(context);
  
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const session = new LateralThinkingSession();
  const results = await session.run(context);
  
  cache.set(key, results);
  return results;
}
```

---

## Next Steps

1. **Test the demo:** `node lib/lateral-thinking/demo.js`
2. **Add hook integration:** Follow Hook System Integration section
3. **Create Task Master command:** Follow Task Master Integration section
4. **Configure environment:** Set API keys and preferences
5. **Test in real workflow:** Use with actual tasks
6. **Monitor and tune:** Adjust parameters based on results

---

## Resources

- **Main Documentation:** `templates/lateral-thinking/SKILL.md`
- **API Reference:** `templates/lateral-thinking/resources/api-reference.md`
- **Examples:** `templates/lateral-thinking/EXAMPLES.md`
- **Demo Script:** `lib/lateral-thinking/demo.js`
- **Hook Detector:** `lib/hooks/lateralThinkingDetector.js`

---

**Questions?** Check the troubleshooting section or review the comprehensive documentation in `templates/lateral-thinking/`.

**Ready to integrate!** 🚀

