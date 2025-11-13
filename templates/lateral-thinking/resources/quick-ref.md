# Lateral Thinking Quick Reference

## Technique Selection Matrix

| Situation | Best Technique | Fallback |
|-----------|---------------|----------|
| Have baseline solution | SCAMPER | Six Hats |
| Completely stuck | Provocations | Random Metaphors |
| Need comprehensive view | Six Thinking Hats | SCAMPER |
| Group being too safe | Bad Ideas | Provocations |
| Cross-domain inspiration needed | Random Metaphors | Provocations |
| Simple problem | **Skip lateral thinking** | — |

## One-Line Technique Descriptions

**SCAMPER**: Systematic variations (Substitute, Combine, Adapt, Modify, Put to use, Eliminate, Reverse)  
**Six Thinking Hats**: Multi-perspective analysis (Data, Emotion, Caution, Optimism, Creativity, Process)  
**Provocations**: Deliberately false statements to disrupt patterns  
**Random Metaphors**: Force connections between random items and problem  
**Bad Ideas**: Generate terrible ideas, extract hidden value  

## Common Invocations

```bash
# Post-research
"Research complete. Use lateral thinking before planning."

# Stuck state
"Apply provocations to challenge my database assumptions."

# Pre-research
"Use lateral thinking to reframe this problem before researching."

# Explicit technique
"Run SCAMPER on my authentication approach."

# Quick exploration
"Generate 3 wild alternatives to [current approach]."
```

## Parameter Quick Reference

| Parameter | Default | Range | Purpose |
|-----------|---------|-------|---------|
| `tokenBudget` | 3000 | 1000-5000 | Total session limit |
| `techniques` | 2 | 1-5 | How many to apply |
| `ideasPerTechnique` | 5 | 3-10 | Ideas per technique |
| `autoConverge` | true | true/false | Auto-curation |
| `presentTopN` | 3 | 1-5 | Final options shown |
| `minConfidence` | 0.6 | 0.3-0.9 | Present threshold |

## Trigger Patterns

**Auto-triggers:**
- `research.*complete` → Post-research exploration
- `stuck.*problem` → Circular reasoning detected
- `need.*creative.*solution` → Explicit creativity request
- `alternative.*approach` → Seeking alternatives
- `thinking.*outside.*box` → Lateral thinking keyword

**Manual triggers:**
- "Use lateral thinking on..."
- "Challenge assumptions about..."
- "Brainstorm alternatives for..."
- "Apply [technique] to..."

## Output Interpretation

```
💡 Option (Confidence: 0.85) ← High confidence, likely viable
💡 Option (Confidence: 0.72) ← Medium confidence, explore more
💡 Option (Confidence: 0.65) ← Lower confidence, higher risk
💡 Option (Confidence: 0.45) ← Below threshold, not shown
```

**Confidence Factors:**
- Feasibility: Can it be built?
- Impact: Will it solve the problem?
- Novelty: Does it offer new value?
- Context fit: Matches constraints?

## Escape Hatches

```bash
"Skip lateral thinking" → Use standard approach immediately
"Use baseline" → Proceed with research-suggested solution
"Just one technique" → Reduce scope if time-limited
"Quick version" → 1 technique, 3 ideas, top 1 result
```

## When NOT to Use

❌ **Skip if:**
- Problem has obvious, well-known solution
- Simple, well-defined task
- Time-critical fix needed immediately
- Already have diverse alternatives
- Problem is technical implementation detail

✅ **Use if:**
- Research suggests only linear approaches
- Stuck after multiple attempts
- Open-ended, wicked problem
- High-value decision worth exploring
- Need to challenge team/AI assumptions

## Quick Workflow

```
1. Context → Provide problem, research, constraints
2. Trigger → Explicit request or auto-detected
3. Diverge → 2 techniques × 5 ideas = ~10 options
4. Converge → Auto-cluster → Score → Top 3
5. Deliver → 3 options + baseline + action choice
6. Decide → Pick path or iterate
```

**Time estimate:** 2-5 minutes (depends on context richness)

## Common Combinations

**Comprehensive Exploration:**
- SCAMPER + Six Hats → Variations + Perspectives

**Breaking Stuck States:**
- Provocations + Bad Ideas → Disrupt + Unblock

**Cross-Domain Innovation:**
- Random Metaphors + SCAMPER → Inspiration + Systematic variation

**Quick Reframe:**
- Provocations only → Challenge assumptions fast

