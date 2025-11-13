# Lateral Thinking

## Overview

Lateral Thinking provides structured creative problem-solving through disruptive thinking patterns. Instead of approaching problems linearly, this skill helps you break free from conventional reasoning to discover innovative solutions that wouldn't emerge from traditional analysis.

**What it does:**
- Applies proven creativity techniques (SCAMPER, Six Thinking Hats, Provocations, Random Metaphors, Bad Ideas)
- Generates alternative framings of problems before committing to solutions
- Challenges assumptions systematically rather than hoping for creative insights
- Provides both divergent ideation AND convergent prioritization
- Integrates with Orchestrator workflows at optimal intervention points

**When to use it:**
- **Post-Research, Pre-Planning**: Counter "research-induced tunnel vision" by exploring alternatives
- **Before Research**: Frame better research questions by challenging initial assumptions
- **Stuck States**: When circular reasoning or repeated failed approaches are detected
- **Wicked Problems**: Complex, open-ended problems without clear linear solutions
- **Explicit Request**: When you want to explore wild ideas before committing

**Key Benefits:**
- **Systematic Creativity**: Applies structured techniques rather than hoping for random inspiration
- **Context-Aware**: Uses research findings, task context, and constraints as grounding (not random brainstorming)
- **Integrated Workflow**: Handles both idea generation AND curation—delivers actionable options, not raw dumps
- **Optional Enhancement**: Available when needed, skippable when not—never a mandatory bottleneck
- **Token Efficient**: ~2000-3000 token budget with clear escape hatches

---

## Quick Start

### Most Common Use Cases

#### 1. Post-Research Creative Exploration
```bash
# After completing research, before planning implementation
"I've researched authentication approaches. Let's use lateral thinking 
to explore unexpected alternatives before choosing a path."

# The FOB will:
# - Apply 2-3 techniques using your research as context
# - Generate 5-10 disruptive ideas
# - Converge to top 3 with rationale
# - Present alongside standard approach
```

#### 2. Breaking Out of Stuck States
```bash
# When you've tried the same approach multiple times
"I'm stuck on this database schema design. The obvious relational 
approach isn't working. Use lateral thinking to reframe the problem."

# The FOB will:
# - Detect repeated pattern
# - Apply provocations to challenge assumptions
# - Generate alternative framings
# - Suggest unexplored directions
```

#### 3. Pre-Research Question Framing
```bash
# Before diving into research
"Before I research caching strategies, use lateral thinking to 
challenge whether caching is the right approach at all."

# The FOB will:
# - Question the problem framing
# - Generate alternative questions to research
# - Expose hidden assumptions
# - Broaden the solution space
```

### Basic Usage Pattern

**Three-Phase Process:**

```markdown
1. DIVERGE (Idea Generation)
   - Technique 1: SCAMPER → 5 variations
   - Technique 2: Provocations → 5 disruptive ideas
   - Total: ~10 raw ideas

2. CONVERGE (Curation)
   - Cluster related concepts
   - Eliminate pure noise
   - Score by: feasibility × impact × novelty
   - Prioritize top 3

3. DELIVER (Actionable Options)
   - Present #1: [Most promising with rationale]
   - Present #2: [Alternative approach with rationale]
   - Present #3: [Wild card option with rationale]
   - Baseline: [Standard approach from research/context]
   - Action: "Which path interests you?" or "Skip to standard approach"
```

**Expected Output:**

```markdown
🎨 Lateral Thinking Results
━━━━━━━━━━━━━━━━━━━━━━━━━━

Research Context: JWT-based auth with sessions
Problem: Standard implementation feels overengineered for our use case

💡 Top 3 Alternative Approaches:

1. STATELESS TOKENS ONLY (Confidence: 0.85)
   Idea: Eliminate sessions entirely—JWT contains ALL state
   Why: Simplifies infrastructure, enables horizontal scaling
   Caution: Larger tokens, can't revoke without deny-list
   
2. EDGE AUTH WITH ZERO BACKEND (Confidence: 0.72)
   Idea: Push auth to CDN edge—no auth server at all
   Why: Ultra-low latency, leverage edge compute
   Caution: Vendor lock-in, limited to supported platforms
   
3. INVERT: USERS BRING THEIR OWN AUTH (Confidence: 0.68)
   Idea: Support external identity providers only (OAuth/OIDC)
   Why: Zero auth maintenance, better security
   Caution: Requires identity provider setup for users

📊 Standard Approach (Baseline):
   JWT access tokens + refresh tokens + session store
   Expected complexity: High | Time: 2-3 weeks

⚡ Next Steps:
   - "Deep dive on option #1" → Explore stateless approach details
   - "Combine #1 and #3" → Hybrid stateless + external providers
   - "Use standard approach" → Proceed with JWT + sessions
   - "Generate more ideas" → Another lateral thinking iteration
```

---

## Available Techniques

This skill provides 5 core lateral thinking techniques:

### 1. SCAMPER
**Substitute · Combine · Adapt · Modify · Put to other uses · Eliminate · Reverse**

Systematically transforms existing solutions by asking structured questions about each dimension.

**When to use:** When you have a baseline approach and want systematic variations

### 2. Six Thinking Hats
**White · Red · Black · Yellow · Green · Blue**

Examines problems from 6 distinct perspectives (data, emotion, caution, optimism, creativity, process).

**When to use:** When you need comprehensive multi-angle analysis

### 3. Provocations
**Deliberately false statements to disrupt thinking patterns**

Makes intentionally outrageous claims to break free from conventional reasoning.

**When to use:** When stuck in obvious solutions or when assumptions are limiting

### 4. Random Metaphors
**Uses random items/concepts to spark unexpected connections**

Picks random objects and forces connections to the problem domain.

**When to use:** When completely stuck or when cross-domain inspiration might help

### 5. Bad Ideas
**Generate intentionally terrible ideas to find hidden gems**

Brainstorms the worst possible solutions, then extracts useful aspects.

**When to use:** When group/AI is being too conservative or "safe"

---

## Available Resources

When you need more detail, request one of these resources:

### Quick Reference (`quick-ref`)
**Size:** < 100 lines | **Read Time:** 2 minutes

Ultra-concise technique cheat sheet. Perfect for quick lookups during active sessions.

**Contains:**
- Technique selection matrix
- One-line technique descriptions
- Parameter quick reference
- Common trigger patterns

**Request:** "Show me the quick reference" or "Load quick-ref"

→ [View Quick Reference](resources/quick-ref.md)

---

### Setup Guide (`setup-guide`)
**Size:** < 500 lines | **Read Time:** 10 minutes

Integration with Orchestrator workflows and trigger configuration.

**Contains:**
- Hook integration setup
- Trigger condition configuration
- Workflow insertion points
- Token budget management
- Escape hatch configuration

**Request:** "Show me the setup guide" or "Load setup-guide"

→ [View Setup Guide](resources/setup-guide.md)

---

### API Reference (`api-reference`)
**Size:** < 500 lines | **Read Time:** 15 minutes

Detailed technique documentation with parameters, scoring, and convergence algorithms.

**Contains:**
- Technique implementations
- Parameter specifications
- Scoring functions
- Convergence algorithms
- Context integration patterns

**Request:** "Show me the API reference" or "Load api-reference"

→ [View API Reference](resources/api-reference.md)

---

### Troubleshooting Guide (`troubleshooting`)
**Size:** < 500 lines | **Read Time:** 5 minutes

Common issues, technique selection guidance, and when NOT to use lateral thinking.

**Contains:**
- When to skip lateral thinking
- Technique selection guidance
- Output quality issues
- Integration problems
- Performance optimization

**Request:** "Show me the troubleshooting guide" or "Load troubleshooting"

→ [View Troubleshooting Guide](resources/troubleshooting.md)

---

## Trigger Conditions

The skill can be triggered automatically or explicitly:

### Automatic Triggers

**Post-Research Detection:**
- Pattern: Research phase marked complete
- Timing: Before planning begins
- Purpose: Counter linear thinking from research

**Stuck State Detection:**
- Pattern: 3+ similar failed attempts
- Timing: When circular reasoning detected
- Purpose: Break out of repeated patterns

**Wicked Problem Detection:**
- Pattern: Problem tagged as complex/open-ended
- Timing: During initial analysis
- Purpose: Prevent premature convergence

### Explicit Request

```bash
"Use lateral thinking on [problem]"
"Let's brainstorm alternatives for [topic]"
"Challenge my assumptions about [concept]"
"Think outside the box about [issue]"
```

---

## Integration Points

### With Task Master
```bash
# After research task completes
task-master show 5
# → Lateral thinking trigger: "Explore alternatives before planning?"

# During stuck subtask
task-master update-subtask --id=5.2 --prompt="Stuck on implementation"
# → Lateral thinking trigger: "Try creative reframing?"
```

### With Research FOB
```bash
# Post-research workflow
research "Best practices for caching" → 
  Lateral Thinking FOB → 
    "Here are 3 non-obvious caching alternatives..."
```

### Standalone Usage
```bash
# Direct invocation
"Apply SCAMPER technique to [my authentication approach]"
"Use Six Thinking Hats to analyze [this architecture decision]"
"Generate provocations about [our database design]"
```

---

## Configuration

Default settings (customizable):

```json
{
  "tokenBudget": 3000,        // Max tokens for entire session
  "techniques": 2,             // Number of techniques to apply
  "ideasPerTechnique": 5,      // Ideas generated per technique
  "autoConverge": true,        // Automatic curation
  "presentTopN": 3,            // Number of final options
  "includeBaseline": true,     // Show standard approach
  "minConfidence": 0.6         // Minimum confidence to present
}
```

---

## Best Practices

**DO:**
- ✅ Use post-research to counter tunnel vision
- ✅ Use pre-research to frame better questions
- ✅ Provide rich context (research findings, constraints, goals)
- ✅ Skip when obvious solution is correct
- ✅ Combine techniques for comprehensive exploration

**DON'T:**
- ❌ Use on every problem (adds unnecessary overhead)
- ❌ Use on well-defined problems with clear solutions
- ❌ Ignore the baseline approach—sometimes it's right
- ❌ Generate ideas without convergence (creates cognitive load)
- ❌ Pursue novelty for novelty's sake

---

## Metadata

**Version:** 1.0.0  
**Status:** Active  
**Last Updated:** 2025-11-13

**Dependencies:**
- None (standalone skill)

**Prerequisites:**
- Understanding of problem domain
- Ideally some initial research or analysis
- Willingness to explore unconventional solutions

**Related Skills:**
- **Research FOB**: Gathers current information before lateral thinking
- **Task Master**: Integrates with task workflow triggers
- **Planning Tools**: Receives curated outputs for implementation

**Maintainer:** Orchestrator Project

**Source:** templates/lateral-thinking

---

## Contributing

To improve this skill:
1. Propose new techniques via GitHub issues
2. Share technique parameter tuning insights
3. Document new integration patterns
4. Report bugs or unexpected outputs

**Guidelines:**
- Follow the 500-line rule for all files
- Maintain progressive disclosure structure
- Test techniques with diverse problem types
- Update cross-references when adding content

---

## License

MIT License - See LICENSE file for details

---

**Navigation:** [Quick Ref](resources/quick-ref.md) | [Setup](resources/setup-guide.md) | [API](resources/api-reference.md) | [Troubleshooting](resources/troubleshooting.md)

