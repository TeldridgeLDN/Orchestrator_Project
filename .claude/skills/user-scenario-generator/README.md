# User Scenario Generator Skill

**Transform inspiration into actionable user scenarios with deep insights**

---

## TL;DR

This skill takes **conceptual inputs** (articles, transcripts, ideas) and creates **detailed user scenarios** that explain **WHY** users need features. It complements:
- **Frontend Design System** (provides the HOW)
- **React Component Analyzer** (provides the WHAT from designs)

**Key Feature:** Applies **3 Whys methodology** to find root user needs.

---

## Quick Start

### Generate Scenarios from Article
```
"Generate user scenarios from https://julian.digital/2023/07/06/multi-layered-calendars/"
```

**Output:** 4-5 detailed scenarios with:
- User goal statements
- 3 Whys analysis (surface → deep need)
- Complete user journeys with emotional context
- Frontend-ready UI requirements

### Generate Scenarios from Feature Description
```
"Create user scenarios for a habit tracking feature where users mark daily habits complete"
```

**Output:** Multiple scenarios covering different user types and contexts

### Generate Scenarios from Image/Design
```
[Upload mockup] "Create user scenarios explaining why users need these features"
```

**Output:** Scenarios that provide context for design decisions

---

## What Makes This Different?

### vs Frontend Design System
| Aspect | User Scenario Generator | Frontend Design System |
|--------|------------------------|----------------------|
| **Question** | **WHY** do users need this? | **HOW** to build it consistently? |
| **Output** | User journeys, emotional context | Component specs, React code |
| **Phase** | Discovery & Planning | Implementation |

### vs React Component Analyzer
| Aspect | User Scenario Generator | React Component Analyzer |
|--------|------------------------|-------------------------|
| **Input** | Concepts, articles, ideas | Design mockups, Figma files |
| **Focus** | User motivation & context | Visual specification extraction |
| **Output** | Scenarios with WHY | Component inventory with WHAT |

---

## The 3 Whys Method

**Example:**

```
User Action: "I want to see my calendar from yesterday"

├─ Why #1: "I'm feeling tired today"
│  └─ Why #2: "I did intense exercise yesterday"
│     └─ Why #3: "I need to plan today accounting for recovery"

Deep Insight: User needs to correlate past activities 
             with current state for informed planning
```

**This tells developers:**
- Don't just show a calendar
- Show intensity indicators on past events
- Make past-day navigation prominent
- Consider energy-based planning features

---

## Typical Outputs

### User Goal Statement
```markdown
**User Goal:** Understand why I'm tired by reviewing yesterday
**Context:** Morning at home, on phone, feeling drained
**Deep Need:** Make recovery-aware decisions about today's schedule
```

### User Journey
```markdown
1. Opens app → Sees TODAY (default) → Feels confused
2. Swipes to YESTERDAY → Sees "Long Run 10-12pm" → Recognition
3. Notes intensity indicator → Thinks "That explains it" → Relief
4. Returns to TODAY → Plans lighter activities → Feels in control
```

### UI Requirements (Handoff to Frontend)
```markdown
**Components Needed:**
- Calendar Grid pattern (from frontend-design-system)
- Event blocks with intensity indicators
- Smooth day navigation (swipe or arrows)
- Visual distinction: past vs today

**Ready for:** frontend-design-system skill to implement
```

---

## Common Workflows

### Workflow 1: Article → Scenarios → Implementation
```
1. User: "Generate scenarios from [article]"
   → Skill creates 4 detailed scenarios

2. User: "Implement Scenario 1 using design system"
   → Frontend Design System generates components

3. Developer has: WHY (scenarios) + HOW (specs)
```

### Workflow 2: Mockup → Extract → Contextualize → Build
```
1. React Component Analyzer extracts WHAT's in design
2. User Scenario Generator explains WHY users need it
3. Frontend Design System standardizes HOW to build it
4. Developer implements with full context
```

### Workflow 3: Concept → Scenarios → Tasks → Sprint
```
1. User Scenario Generator creates scenarios from idea
2. Taskmaster converts scenarios to implementation tasks
3. Frontend Design System provides specs for each task
4. Team builds feature understanding user needs
```

---

## Real Example: Multi-Layer Calendar

### Input
```
"Generate user scenarios from this article: 
https://julian.digital/2023/07/06/multi-layered-calendars/"
```

### Generated Scenarios (Summary)

**Scenario 1:** Understanding Yesterday's Fatigue
- **Why #3:** Plan today accounting for physical state
- **UI Need:** Past event intensity visualization

**Scenario 2:** Planning Tomorrow's Energy
- **Why #3:** Avoid overcommitment based on capacity
- **UI Need:** Multi-day view with intensity forecast

**Scenario 3:** Finding Available Capacity
- **Why #3:** True availability = time + energy
- **UI Need:** Cognitive load visualization on calendar

**Scenario 4:** Weekly Pattern Review
- **Why #3:** Optimize recurring schedule from outcomes
- **UI Need:** Week view with outcome indicators

### Handoff to Frontend
Each scenario includes:
- Specific component references (Calendar Grid, Badge, etc.)
- Layout pattern names from design system
- Interaction details (swipe, tap, visual feedback)
- State requirements (loading, error, empty, success)

---

## Installation

### Global Skills Directory
```bash
# From Orchestrator project
cd ~/Orchestrator_Project
orchestrator sync-skills

# Skill syncs to ~/.claude/skills/user-scenario-generator/
```

### Project-Specific Override
```bash
# Copy to specific project for customization
cp -r ~/.claude/skills/user-scenario-generator \
      ~/my-project/.claude/skills/
```

---

## Activation

### Auto-Activation Triggers
- "generate user scenarios"
- "create scenarios from"
- "3 whys"
- "user perspective"
- "why does user need"

### Manual Activation
```
"Use the user scenario generator skill to analyze [input]"
```

---

## Best Practices

### ✅ DO
- Start with user outcomes, not features
- Push to Why #3 (don't stop at surface reasons)
- Include emotional context in journeys
- Reference design system components explicitly
- Document friction points and edge cases

### ❌ DON'T
- Skip the 3 Whys analysis
- Create feature lists instead of scenarios
- Ignore user context (where, when, feeling what?)
- Use vague UI descriptions
- Forget error states and unhappy paths

---

## Resources

### Included Files
- `skill.md` - Complete skill documentation (main file)
- `SKILL_RELATIONSHIPS.md` - How this skill relates to others
- `metadata.json` - Skill configuration and capabilities
- `README.md` - This file

### External Resources
- [3 Whys Technique](https://en.wikipedia.org/wiki/Five_whys) (adapted from 5 Whys)
- [Multi-Layer Calendars - Julian Lehr](https://julian.digital/2023/07/06/multi-layered-calendars/)
- Jobs To Be Done framework
- User Story Mapping (Jeff Patton)

---

## Integration Points

### Produces Output For:
- ✅ `frontend-design-system` - UI requirements → component specs
- ✅ `taskmaster` - Scenarios → implementation tasks
- ✅ Developers - User context for informed building

### Consumes Input From:
- ✅ `react-component-analyzer` - Extracted components → scenario context
- ✅ Users - Articles, concepts, transcripts → scenarios
- ✅ Product Managers - Feature ideas → user-centered analysis

---

## FAQ

### Q: Should I use this for every feature?
**A:** Use it when you need to understand **WHY** users need something. Skip for obvious maintenance/refactor work.

### Q: Can it generate React code?
**A:** No. It creates scenarios that **inform** code generation. Use `frontend-design-system` for actual React code.

### Q: How is this different from user stories?
**A:** User stories state WHAT. This skill explains WHY (3 levels deep) and includes emotional context + detailed journeys.

### Q: What if I have a mockup, not an article?
**A:** Use `react-component-analyzer` first to extract WHAT's in the design, then use this skill to explain WHY users need it.

### Q: Can I customize the 3 Whys depth?
**A:** 3 is optimal (Toyota's 5 Whys adapted for UX). Less = surface understanding. More = diminishing returns.

---

## Changelog

### v1.0.0 (2025-11-16)
- ✨ Initial release
- ✅ 3 Whys methodology implementation
- ✅ User journey generation with emotional context
- ✅ Frontend handoff integration
- ✅ Multi-input support (articles, transcripts, concepts)
- ✅ Persona-based scenario variants
- ✅ Error state scenario generation

### Planned for v1.1
- Interactive scenario workshop mode
- User interview transcript parsing
- Automated persona generation
- Video transcript support

---

## Support

**Issues:** Create issue in Orchestrator_Project repo  
**Questions:** Tag `@user-scenario-generator` in project discussions  
**Updates:** Synced automatically via `orchestrator sync-skills`

---

**Skill Version:** 1.0.0  
**Last Updated:** November 16, 2025  
**Maintained By:** Orchestrator Core Team  
**License:** MIT









