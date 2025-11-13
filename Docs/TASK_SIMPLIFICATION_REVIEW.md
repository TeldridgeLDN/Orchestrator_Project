# Scenario Builder Tasks Critical Review & Simplification

**Date:** 2025-11-11  
**Reviewer:** God-Like Programmer Analysis  
**Result:** 9 tasks → 3 simplified tasks

---

## Executive Summary

The original scenario_builder task plan (Tasks 72-80) suffered from **over-engineering**, **premature abstraction**, and **complexity creep**. After critical review against system philosophy (PAI + diet103), we've:

- ✅ **Kept 3 high-value tasks** (simplified)
- ❌ **Cancelled 4 over-engineered tasks**
- ⚠️ **Deferred 2 premature tasks**

**Result:** Same value delivery with **~90% less code** and **minimal maintenance burden**.

---

## System Philosophy Principles

The critical review was based on these established principles:

### ✅ Core Values
1. **Token Efficiency**: Minimal overhead, lazy loading
2. **Progressive Disclosure**: Load only what's needed, when needed
3. **Simplicity First**: Hooks over frameworks, files over databases
4. **Clear Boundaries**: Skills-as-Containers pattern
5. **Immediate User Value**: Solve real problems, not hypothetical ones

### ❌ Anti-Patterns to Avoid
1. **YAGNI**: You Ain't Gonna Need It (building for hypothetical futures)
2. **Premature Optimization**: Infrastructure before proven need
3. **Over-Engineering**: Frameworks, sub-agents, parallel execution without justification
4. **Complexity Creep**: Each abstraction layer adds maintenance burden

---

## Task-by-Task Analysis

### ❌ CANCELLED TASKS (4)

#### Task #72: Partnership Level Configuration
**Status:** CANCELLED  
**Reason:** Premature abstraction

**Issues:**
- Building "partnership levels" before having any users/partners
- Configuration complexity for hypothetical future scenarios
- Violates YAGNI principle

**Verdict:** Wait until actual partnership requirements emerge from real usage.

---

#### Task #75: Feasibility Checker Sub-Agent
**Status:** CANCELLED  
**Reason:** Massive over-engineering

**Issues:**
- Python agent with asyncio for parallel execution
- "Feasibility scoring" is subjective and misleading
- Violates Skills-as-Containers simplicity
- Better to just TRY the integration and see if it works

**Verdict:** Replace with simple "test connection" workflow (see Task #76).

---

#### Task #77: Build Custom MCPs (Registry, Docs, Cost)
**Status:** CANCELLED  
**Reason:** Infrastructure overkill

**Issues:**
- THREE separate MCPs (FastAPI, SQLite, OpenAPI parsing)
- Need to run/maintain 3 services
- Premature infrastructure before proven need
- Token overhead for rare operations

**Better Approach:**
- MCP list in `docs/mcp-registry.md` (static file)
- Cost estimates in documentation
- Link to API docs (don't parse them)

**Verdict:** Static documentation is sufficient.

---

#### Task #80: Performance Metrics System
**Status:** CANCELLED  
**Reason:** Premature metrics

**Issues:**
- SQLite database, analytics backend
- GDPR compliance complexity
- Measuring before having users
- Who will look at these metrics?

**Verdict:** Defer until actual usage patterns emerge. Start with simple logging if needed.

---

### ⚠️ DEFERRED TASKS (2)

#### Task #74: Explore Alternatives Workflows
**Status:** DEFERRED  
**Reason:** Good idea, wrong execution

**Original Issues:**
- "Spawn feasibility_checker agents for each" - too complex
- Parallel execution adds significant complexity
- "At least 3 options" is an artificial constraint

**Future Simplification:**
When we implement this (post-MVP), it should be:
```markdown
1. Query Perplexity for "best practices for [integration]"
2. Present 2-3 options with pros/cons
3. Let USER decide
4. No agents, no parallel execution, 100 lines total
```

---

#### Task #78: Optimize Scenario & Research Best Practices
**Status:** DEFERRED  
**Reason:** Need production scenarios first

**Original Issues:**
- "Analyze usage logs, performance metrics" - what logs? what metrics?
- Ranking algorithm complexity
- Optimizing before having scenarios in production

**Future Simplification:**
When we implement this (after scenarios are mature):
```markdown
1. User asks: "What are best practices for X?"
2. Query Perplexity
3. Present findings
4. Done. No usage logs, no ranking, no complexity.
```

---

### ✅ KEPT & SIMPLIFIED (3)

#### Task #73: Research MCP Integration (Perplexity)
**Status:** PENDING → SIMPLIFIED  
**Complexity:** LOW (was MEDIUM)  
**Value:** HIGH  

**Original Plan:**
- Complex caching system
- Abstraction for swapping MCP providers
- Sophisticated fallback logic

**Simplified Approach:**
```javascript
// ~100 lines total
async function researchBestPractices(query) {
  // 1. Try Perplexity API
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${PERPLEXITY_API_KEY}` },
      body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: query }] })
    });
    const result = await response.json();
    
    // 2. Simple 5-minute cache
    cache.set(query, result, 300000); // 5 min TTL
    
    // 3. Return formatted results
    return formatResults(result);
  } catch (error) {
    // 4. Graceful fallback
    console.log('Perplexity unavailable, using local knowledge');
    return localKnowledge(query);
  }
}
```

**What We Removed:**
- ❌ Provider abstraction layer
- ❌ Complex caching strategy
- ❌ Retry logic, circuit breakers

**What We Kept:**
- ✅ Real-time research (high value)
- ✅ Basic caching (5 min TTL)
- ✅ Graceful fallback
- ✅ Simple error handling

**Success Criteria:**
- Can query: `claude research "best practices for Airtable integration"`
- Returns formatted results
- Handles errors without crashing
- ~100 lines of code

---

#### Task #76: Test Connection Workflow
**Status:** PENDING → DRAMATICALLY SIMPLIFIED  
**Complexity:** LOW (was MEDIUM)  
**Value:** HIGH  

**Original Plan:**
- Scaffold minimal scenario
- Validate data flow
- Use feasibility_checker agent
- Provide demo and blockers

**Simplified Approach:**
```markdown
# proof_of_concept.md workflow

1. User provides API endpoint + credentials
2. Make a test call
3. Show the response
4. Done.
```

**Implementation:**
```bash
# User runs:
claude test-api https://api.airtable.com/v0/bases --key=keyXXXXXXXXXXXXXX

# System does:
- Makes HTTP GET request
- Shows raw response or error
- That's it.
```

**What We Removed:**
- ❌ Scenario scaffolding
- ❌ Data flow validation
- ❌ Sub-agents
- ❌ Feasibility scoring

**What We Kept:**
- ✅ Quick API validation
- ✅ Raw response display
- ✅ Error messages

**Success Criteria:**
- Test if API works: Yes/No
- Show sample response
- ~50 lines of code

---

#### Task #79: Document Decisions in YAML
**Status:** PENDING → KEPT AS-IS  
**Complexity:** LOW  
**Value:** MEDIUM  

**Why This Was Already Good:**
This task was appropriately scoped from the start. No changes needed.

**Implementation:**
```yaml
# scenario.yaml
design_decisions:
  - decision: "Used Airtable instead of Google Sheets"
    reason: "Better API, more features"
    date: "2024-11-11"
    alternatives_considered:
      - "Google Sheets (rejected: limited API)"
      - "Notion (rejected: too expensive)"

potential_improvements:
  - idea: "Add webhook support for real-time updates"
    priority: "medium"
    complexity: "low"
```

**What's Needed:**
- Update YAML schema validator (~5 lines)
- Add CLI support for viewing/adding decisions (~10 lines)
- Update documentation with examples (~5 lines)
- **Total: ~20 lines of code**

**Success Criteria:**
- Can add decisions to YAML
- Can view decision history
- Validates against schema

---

## Impact Summary

### Before Simplification
| Metric | Value |
|--------|-------|
| Total Tasks | 9 |
| Estimated LOC | ~5,000+ |
| External Services | 3 (FastAPI, SQLite, analytics) |
| Sub-Agents | 1 (Python + asyncio) |
| Databases | 2 (SQLite registry + metrics) |
| API Integrations | Multiple (with abstraction layers) |
| Maintenance Burden | HIGH |

### After Simplification
| Metric | Value |
|--------|-------|
| Total Tasks | 3 (active) |
| Estimated LOC | ~170 |
| External Services | 0 |
| Sub-Agents | 0 |
| Databases | 0 |
| API Integrations | 1 (Perplexity, direct) |
| Maintenance Burden | LOW |

### Key Improvements
- ✅ **90% less code** (5000+ LOC → 170 LOC)
- ✅ **Zero infrastructure** (no services, no databases)
- ✅ **Zero sub-agents** (hooks and workflows only)
- ✅ **Same or better value** (focused on real user needs)
- ✅ **Minimal maintenance** (simple code, fewer dependencies)

---

## Lessons Learned

### 🚨 Warning Signs of Over-Engineering
1. **"We might need this later"** → YAGNI violation
2. **"Let's abstract for flexibility"** → Premature abstraction
3. **"This needs a sub-agent"** → Probably doesn't
4. **"We should measure everything"** → Metrics without purpose
5. **"Build infrastructure first"** → Solve real problems first

### ✅ Signs of Good Design
1. **"This solves a real user problem"** → User value
2. **"We can implement this in <100 LOC"** → Simplicity
3. **"If it breaks, we can fix it in 5 minutes"** → Maintainability
4. **"No external services required"** → Reliability
5. **"Users can understand this immediately"** → Usability

---

## Next Steps

### Immediate (Tasks 73, 76, 79)
1. Implement simplified Perplexity research integration
2. Implement test-api connection workflow
3. Add design_decisions YAML fields

**Estimated Time:** 2-3 days  
**Estimated LOC:** ~170 lines  
**Risk:** LOW  

### Future (When Proven Need Emerges)
- Consider Task #74 (explore alternatives) if users request it
- Consider Task #78 (optimize scenario) after scenarios mature
- Revisit cancelled tasks if requirements change

**Approach:** Build for 1 user first, scale later.

---

## Conclusion

**The "God Programmer" Verdict:**

> Build simple things that solve real problems.  
> Measure actual usage before building metrics.  
> Prefer files over databases, hooks over frameworks.  
> You Ain't Gonna Need most of It.

**Result:** Higher quality, lower complexity, faster delivery.

---

## References

- **PAI Architecture**: Skills-as-Containers, UFC, Progressive Disclosure
- **diet103 Architecture**: 500-line rule, Auto-activation, Token efficiency
- **YAGNI Principle**: https://martinfowler.com/bliki/Yagni.html
- **Unix Philosophy**: "Do one thing and do it well"

---

*This review ensures the Orchestrator project stays true to its hybrid PAI+diet103 philosophy: intelligent, efficient, and maintainable.*

