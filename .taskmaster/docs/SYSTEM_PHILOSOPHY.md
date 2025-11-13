# System Philosophy: Orchestrator Project

**Version:** 1.0.0  
**Last Updated:** 2025-11-11  
**Architecture:** PAI + diet103 Hybrid

---

## Executive Summary

This document defines the core philosophical principles that guide all development decisions in the Orchestrator project. These principles are used by the **Critical Task Evaluator** to assess and refine task proposals.

---

## Core Architecture Principles

### Hybrid Architecture: PAI + diet103

The Orchestrator combines two complementary architectures:

1. **PAI (Personal AI)**: Skills-as-Containers, UFC (Unified File Context), Progressive Disclosure
2. **diet103**: 500-line rule, Auto-activation, Token efficiency, Hooks over frameworks

---

## Foundational Values

### ✅ 1. Token Efficiency Above All

**Principle:** Every byte of context loaded should provide immediate value.

**Guidelines:**
- Lazy load everything
- Progressive disclosure: show only what's needed
- No "just in case" imports
- Clear cache aggressively

**Examples:**
```javascript
// ✅ GOOD: Load on demand
async function useSkill(name) {
  const skill = await import(`./skills/${name}.js`);
  return skill;
}

// ❌ BAD: Load everything upfront
import * as skills from './skills/index.js';
```

---

### ✅ 2. Simplicity First

**Principle:** Simple solutions that solve real problems beat complex frameworks.

**Guidelines:**
- Hooks over frameworks
- Files over databases
- Plain JavaScript over build systems
- Direct API calls over abstraction layers

**The Complexity Ladder (Use the lowest that works):**
1. **File** (Best)
2. **Function**
3. **Module**
4. **Library**
5. **Framework**
6. **Service** (Last resort)

**Examples:**
```javascript
// ✅ GOOD: Simple file-based storage
const data = JSON.parse(fs.readFileSync('data.json'));

// ❌ BAD: Database for simple needs
const db = await connectToMongoDB();
const data = await db.collection('data').find();
```

---

### ✅ 3. Skills-as-Containers

**Principle:** Each skill is self-contained, auto-activating, and independent.

**Guidelines:**
- One skill = one directory
- Auto-activation via metadata patterns
- No cross-skill dependencies
- Clear input/output contracts

**Structure:**
```
skills/
  shopify/
    metadata.json       # Auto-activation rules
    index.js           # Entry point
    hooks/             # Lifecycle hooks
    utils/             # Internal utilities
```

---

### ✅ 4. Progressive Disclosure

**Principle:** Load context progressively based on actual need.

**Guidelines:**
- Start with minimal context
- Expand on demand
- Clear what's no longer needed
- Track token usage

**Workflow:**
```
User asks question
  → Load minimal skill metadata
  → User narrows scope
  → Load relevant skill code
  → User needs specific function
  → Load function + dependencies
  → Clear after use
```

---

### ✅ 5. YAGNI (You Ain't Gonna Need It)

**Principle:** Build for today's needs, not hypothetical futures.

**Warning Signs:**
- "We might need this later"
- "Let's abstract for flexibility"
- "This could scale to..."
- "What if we add..."

**Guidelines:**
- Build for 1 user first
- Add features when requested, not before
- Measure actual usage before optimizing
- Delete unused code aggressively

**Examples:**
```javascript
// ✅ GOOD: Solve immediate problem
function getCurrentUser() {
  return fs.readFileSync('.current-user', 'utf8');
}

// ❌ BAD: Premature multi-user system
class UserManager {
  async getUserById(id) { /* Complex pooling */ }
  async getUserByEmail(email) { /* Caching layer */ }
  async getUsersByRole(role) { /* Query builder */ }
}
```

---

## Anti-Patterns to Avoid

### ❌ 1. Premature Abstraction

**Problem:** Creating abstraction layers before understanding the problem.

**Examples:**
- Provider abstraction for single API
- Config systems for 3 settings
- Plugin architecture for 1 plugin
- Generic frameworks for specific use case

**Rule:** Need 3+ similar implementations before abstracting.

---

### ❌ 2. Infrastructure Before Value

**Problem:** Building infrastructure before solving real user problems.

**Examples:**
- Metrics dashboards with no users
- Admin panels before features
- Logging frameworks before errors
- Test harnesses before code

**Rule:** Build features first, infrastructure when needed.

---

### ❌ 3. Framework Overuse

**Problem:** Using heavyweight frameworks for simple problems.

**Examples:**
- React for static content
- Redux for local state
- Express for single endpoint
- Webpack for 3 files

**Rule:** Use the simplest solution that works.

---

### ❌ 4. Premature Optimization

**Problem:** Optimizing before measuring.

**Examples:**
- Caching without profiling
- Parallel execution without benchmarks
- Database indexes before queries
- CDN before traffic

**Rule:** Measure first, optimize second.

---

### ❌ 5. Sub-Agent Proliferation

**Problem:** Creating sub-agents when simple functions work.

**Examples:**
- "Feasibility checker" agent (just try it!)
- "Validator" agent (write a function)
- "Analyzer" agent (run analysis)
- "Optimizer" agent (optimize what?)

**Rule:** Prefer functions over agents, hooks over services.

---

## Evaluation Criteria

When evaluating tasks, assess against these criteria:

### 1. Complexity Score (Weight: 8/10)

**Questions:**
- Can this be simpler?
- Are we over-engineering?
- Could a 50-line function replace this 500-line module?
- Do we need a framework/service/agent?

**Targets:**
- ✅ Single file: <500 lines
- ✅ Functions: <100 lines
- ✅ Modules: <10 files
- ❌ Frameworks, services, databases for simple needs

---

### 2. User Value Score (Weight: 10/10)

**Questions:**
- Does this solve a real, current user problem?
- What happens if we skip this?
- Is this hypothetical or actual need?
- ROI: time invested vs. value delivered?

**Targets:**
- ✅ Solves immediate user pain
- ✅ Requested by actual users
- ✅ Clear success criteria
- ❌ "Nice to have" features
- ❌ Speculative requirements

---

### 3. Philosophy Alignment (Weight: 9/10)

**Questions:**
- Does this follow PAI+diet103 principles?
- Token efficient?
- Skills-as-Containers pattern?
- Progressive disclosure?
- Simple or complex?

**Checklist:**
- ✅ Minimal token overhead
- ✅ Self-contained if skill-related
- ✅ Auto-activating
- ✅ Clear boundaries
- ❌ Cross-skill dependencies
- ❌ Heavy frameworks

---

### 4. YAGNI Compliance (Weight: 9/10)

**Questions:**
- Are we building for hypothetical futures?
- Is this premature abstraction?
- Can we defer this?
- Do we have actual users needing this?

**Red Flags:**
- "We might need..."
- "For scalability..."
- "To be flexible..."
- "Future-proofing..."

**Green Flags:**
- "Users are asking for..."
- "This is blocking..."
- "We measured and found..."
- "This solves X problem"

---

### 5. Risk Assessment (Weight: 6/10)

**Questions:**
- What could go wrong?
- What are the dependencies?
- How hard to maintain?
- How hard to debug?
- Can we rollback easily?

**Targets:**
- ✅ Isolated changes
- ✅ No external services
- ✅ Easy to test
- ✅ Fast to implement
- ❌ Cascading dependencies
- ❌ Hard to reverse

---

### 6. Token Efficiency (Weight: 7/10)

**Questions:**
- How much context overhead?
- Can we lazy load?
- Do we load and never use?
- Clear after use?

**Targets:**
- ✅ Load on demand
- ✅ Clear when done
- ✅ Minimal persistent state
- ✅ Progressive disclosure
- ❌ "Just in case" loading
- ❌ Heavy persistent context

---

## Implementation Guidelines

### Code Quality Standards

**Lines of Code Targets:**
- Single file: <500 lines
- Function: <100 lines
- Module: <10 files
- Skill: <2000 lines total

**Maintenance Burden:**
- No external services to monitor
- No databases to maintain
- No build pipelines to debug
- No complex configs to manage

**Success Metrics:**
- Can implement in <1 day
- Can debug in <5 minutes
- Can explain in <2 minutes
- Can delete without side effects

---

### The "God Programmer" Test

Before implementing, ask:

> "Would a god-like programmer with decades of experience approve this approach?"

**They would ask:**
1. "Can this be simpler?"
2. "Do you actually need this?"
3. "What problem are you solving?"
4. "Why not just use a file/function/hook?"
5. "Who asked for this feature?"
6. "Have you measured the problem?"
7. "What's the maintenance burden?"
8. "Can you implement this in <100 lines?"

**They would say NO to:**
- Premature optimization
- Hypothetical requirements
- Framework overuse
- Premature abstraction
- Complexity without justification
- Infrastructure before features

**They would say YES to:**
- Simple solutions
- Real user problems
- Minimal maintenance
- Easy to understand
- Fast to implement
- Easy to delete

---

## Decision Framework

### When to Build

**Build immediately if:**
- ✅ Real user asks for it
- ✅ Blocking actual work
- ✅ Can implement in <100 lines
- ✅ Solves measured problem
- ✅ Clear success criteria

**Defer if:**
- ⚠️ Hypothetical need
- ⚠️ "Might be useful"
- ⚠️ Requires complex infrastructure
- ⚠️ No clear user value
- ⚠️ Premature optimization

**Never build:**
- ❌ "Just in case" features
- ❌ Infrastructure without features
- ❌ Abstraction before 3+ uses
- ❌ Optimization without profiling
- ❌ Complexity without justification

---

### When to Simplify

**Simplify immediately if:**
- Task requires >500 lines
- Task needs external services
- Task needs sub-agents
- Task needs database
- Task needs framework
- Task is "future-proofing"
- Task is "for scalability"

**Simplification Strategies:**
1. Replace service → file
2. Replace database → JSON file
3. Replace framework → plain JavaScript
4. Replace agent → function
5. Replace abstraction → direct implementation
6. Replace parallel → sequential
7. Replace complex → simple

---

### When to Cancel

**Cancel if:**
- ❌ No real user need
- ❌ Hypothetical requirement
- ❌ Premature optimization
- ❌ Infrastructure before features
- ❌ Over-engineering without justification
- ❌ Maintenance burden > value
- ❌ Violates core principles

---

## Real Examples

### ✅ Good Task: Perplexity Integration

**Original:** Complex provider abstraction, caching layers, fallback chains

**Simplified:**
```javascript
// ~100 lines total
async function researchBestPractices(query) {
  try {
    const response = await fetch('https://api.perplexity.ai/...', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
    const result = await response.json();
    cache.set(query, result, 300000); // 5 min
    return formatResults(result);
  } catch {
    return localKnowledge(query);
  }
}
```

**Why Good:**
- Solves real need (research)
- <100 lines
- Simple caching
- Graceful fallback
- High user value

---

### ❌ Bad Task: MCP Registry System

**Original:** 3 separate MCPs (FastAPI, SQLite, OpenAPI parser)

**Why Bad:**
- 3 services to run/maintain
- Premature infrastructure
- No users yet
- Violates simplicity principle
- Token overhead

**Better Approach:**
```markdown
# docs/mcp-registry.md
- Shopify MCP: https://...
- Airtable MCP: https://...
```

**Why Better:**
- Zero maintenance
- Instant to update
- No services
- Same user value

---

### ❌ Bad Task: Performance Metrics System

**Original:** SQLite database, analytics backend, GDPR compliance

**Why Bad:**
- No users to measure
- Complex infrastructure
- GDPR complexity
- Who will look at metrics?
- Measuring before having data

**Better Approach:**
Wait until actual usage, then add simple logging if needed.

---

## Conclusion

**The Philosophy in One Sentence:**

> Build simple things that solve real problems, using the minimum viable approach, and defer everything else.

**The God Programmer Verdict:**

> Every line of code is a liability. Make it count.

---

## References

- [PAI Architecture Docs](./Orchestrator_PRD.md)
- [diet103 Implementation](./DIET103_IMPLEMENTATION.md)
- [Task Simplification Review](./TASK_SIMPLIFICATION_REVIEW.md)
- [YAGNI Principle](https://martinfowler.com/bliki/Yagni.html)
- [Unix Philosophy](https://en.wikipedia.org/wiki/Unix_philosophy)

---

*This philosophy ensures the Orchestrator project stays true to its hybrid PAI+diet103 vision: intelligent, efficient, maintainable, and user-focused.*

