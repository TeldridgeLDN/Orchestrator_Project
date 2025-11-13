# Scenario Manager: Option 1 vs Option 2 Comparison

**Decision:** ✅ **Implemented Option 2**  
**Date:** November 10, 2025

---

## Quick Visual Comparison

### 🔹 Option 1: Current Implementation (CLI Only)

```
┌─────────────────────────────────────────────┐
│  User                                       │
│  "What scenarios do I have?"                │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Claude (Generic Response)                  │
│  "Run: diet103 scenario list"               │
│  Token Cost: ~1100                          │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  User (Manual Command)                      │
│  $ diet103 scenario list                    │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Terminal Output                            │
│  NAME            CATEGORY         STATUS    │
│  client-intake   business_process  pending  │
│  my-scenario     automation        pending  │
└─────────────────────────────────────────────┘
```

**Characteristics:**
- ⚠️ User must remember CLI commands
- ⚠️ No metadata context (creation dates, usage)
- ⚠️ Manual file inspection needed
- ✅ Zero token overhead
- ✅ Simple architecture
- ✅ Fast responses

---

### 🔹 Option 2: With Scenario Manager Skill (IMPLEMENTED ✅)

```
┌─────────────────────────────────────────────┐
│  User                                       │
│  "What scenarios do I have?"                │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Trigger Detector                           │
│  Matches: "what scenarios"                  │
│  → Activates scenario_manager skill         │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  scenario_manager Skill                     │
│  1. Loads metadata from config.json         │
│  2. Queries available/scaffolded scenarios  │
│  3. Formats rich response                   │
│  Token Cost: ~1400 (+300 for metadata)      │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Claude (Intelligent Response)              │
│                                             │
│  Available Scenarios (Not Scaffolded):      │
│  • client-intake (created 2 days ago)       │
│    Description: Client requirement          │
│    Components: 3 skills, 2 commands, 1 hook │
│                                             │
│  Scaffolded Scenarios (Active):             │
│  • my-scenario (scaffolded 5 days ago)      │
│    Generated: my_scenario skill             │
│    Location: ~/.claude/skills/my_scenario/  │
│    Last used: 2 days ago                    │
│                                             │
│  To scaffold:                               │
│    diet103 scenario scaffold client-intake  │
└─────────────────────────────────────────────┘
```

**Characteristics:**
- ✅ Natural language queries
- ✅ Rich metadata display
- ✅ Context-aware suggestions
- ✅ Status tracking (available vs scaffolded)
- ✅ Guided workflows
- ⚠️ +300-500 token overhead
- ⚠️ More complex architecture

---

## Side-by-Side Feature Comparison

| Feature | Option 1 | Option 2 | Benefit |
|---------|----------|----------|---------|
| **Discovery** | `diet103 scenario list` | "What scenarios do I have?" | Natural language |
| **Creation** | Manual YAML + CLI | Guided interactive prompts | Easier for beginners |
| **Validation** | `diet103 scenario validate` | Auto-suggested before scaffold | Proactive |
| **Status Tracking** | File inspection | Rich metadata in config.json | Always available |
| **Timestamps** | File mtime only | Created, scaffolded, last_used | Audit trail |
| **Components** | Parse YAML manually | Shown automatically | Quick reference |
| **Next Steps** | User decides | Contextual suggestions | Guided workflow |
| **Token Cost** | 1100/query | 1400/query | Option 1 wins |
| **Learning Curve** | Steeper | Gentler | Option 2 wins |
| **Team Friendly** | No | Yes | Option 2 wins |
| **Maintenance** | Low | Medium | Option 1 wins |

---

## Real-World Workflow Examples

### Example 1: Creating a New Scenario

#### Option 1 (CLI Only)
```
Step 1: User remembers/looks up command
  User: "How do I create a scenario?"
  Claude: "Run: diet103 scenario create"

Step 2: User runs command
  $ diet103 scenario create

Step 3: Interactive CLI prompts
  Name: client-intake
  Description: Client requirement gathering
  Template: basic

Step 4: User manually edits YAML
  $ vim ~/.claude/scenarios/client-intake.yaml

Step 5: User validates
  $ diet103 scenario validate client-intake

Step 6: User scaffolds
  $ diet103 scenario scaffold client-intake
```

**Total Steps:** 6  
**CLI Commands:** 3  
**Manual Edits:** 1

---

#### Option 2 (With scenario_manager)
```
Step 1: Natural language request
  User: "I want to create a new scenario for client intake"

Step 2: Skill activates and guides
  Claude: "I'll help you create a client intake scenario.
  
  Options:
  1. Start from template (recommended)
  2. Build from scratch
  
  For client intake, I recommend 'business_process' template.
  
  Would you like me to guide you through defining steps?"

Step 3: User confirms
  User: "Yes, use the template"

Step 4: Guided YAML creation
  Claude: "Great! Run: diet103 scenario create --template business_process
  
  I'll help you customize the steps..."

Step 5: Auto-validation suggestion
  Claude: "YAML looks good! Ready to validate?
  Run: diet103 scenario validate client-intake"

Step 6: Scaffolding guidance
  Claude: "Validation passed ✓
  Ready to scaffold?
  Run: diet103 scenario scaffold client-intake"
```

**Total Steps:** 6  
**CLI Commands:** 3 (same as Option 1)  
**Manual Edits:** 0 (guided prompts)  
**Cognitive Load:** Lower (AI guides each step)

---

### Example 2: Checking Scenario Status

#### Option 1
```
User: "I want to see scenario status"
Claude: "Run: diet103 scenario list"

User: $ diet103 scenario list

Output:
NAME            CATEGORY            STATUS
client-intake   business_process    pending
my-scenario     automation          pending

[No info about scaffolding status, timestamps, or generated files]
```

**Info Provided:** Name, category
**Missing:** Scaffolding status, timestamps, generated files, last used

---

#### Option 2
```
User: "What's the status of my scenarios?"

[scenario_manager activates]

Claude: "Available Scenarios (Not Scaffolded):
• client-intake (created 2 days ago)
  Description: Client requirement gathering workflow
  Components: 3 skills, 2 commands, 1 hook
  Status: Ready to scaffold
  
Scaffolded Scenarios (Active):
• my-scenario (scaffolded 5 days ago)
  Generated: 
    - ~/.claude/skills/my_scenario/SKILL.md
    - ~/.claude/commands/my-scenario.md
  Last used: 2 days ago
  Session ID: session-1762774404248

Statistics:
  Total scenarios: 2
  Scaffolded: 1
  Available: 1
  
Commands:
  Scaffold available: diet103 scenario scaffold client-intake
  Show details: diet103 scenario show my-scenario"
```

**Info Provided:** Everything (status, timestamps, files, usage, commands)  
**Missing:** Nothing

---

## Token Cost Breakdown

### Option 1: Per-Query Cost

```
┌─────────────────────────────────────┐
│  Global Context          │  ~100    │
│  Active Project          │  ~1000   │
├─────────────────────────────────────┤
│  Total                   │  1100    │
└─────────────────────────────────────┘
```

### Option 2: Per-Query Cost

```
┌─────────────────────────────────────┐
│  Global Context          │  ~100    │
│  Active Project          │  ~1000   │
│  scenario_manager Skill  │  ~300    │ ← Added
├─────────────────────────────────────┤
│  Total (Metadata Only)   │  1400    │
└─────────────────────────────────────┘

When Full Scenario Loaded:
┌─────────────────────────────────────┐
│  Global Context          │  ~100    │
│  Active Project          │  ~1000   │
│  scenario_manager Skill  │  ~300    │
│  Full YAML Content       │  ~200    │ ← Additional
├─────────────────────────────────────┤
│  Total (Full Scenario)   │  1600    │
└─────────────────────────────────────┘
```

**Cost Increase:**
- Metadata queries: +300 tokens (+27%)
- Full scenario queries: +500 tokens (+45%)

**Worth it when:**
- Working with scenarios 3+ times per day
- Team collaboration (multiple skill levels)
- Projects with 5+ scenarios
- Discovery/status queries frequent

**Not worth it when:**
- Infrequent scenario work (once a week)
- Token budget critical
- Expert users who prefer CLI
- Simple projects (1-3 scenarios)

---

## Architecture Comparison

### Option 1: Simple & Direct

```
User
  │
  ├─> Claude (generic AI)
  │     │
  │     └─> Suggests CLI command
  │
  └─> Terminal (diet103 scenario list)
        │
        └─> Reads ~/.claude/scenarios/*.yaml
              │
              └─> Displays table
```

**Pros:**
- Simple flow
- No additional components
- Fast responses
- Minimal token cost

**Cons:**
- No context retention
- No metadata tracking
- Manual command execution
- No guidance

---

### Option 2: Intelligent & Guided

```
User
  │
  ├─> Claude
  │     │
  │     ├─> Trigger Detector (.claude/skill-rules.json)
  │     │     │
  │     │     └─> Matches "what scenarios"
  │     │           │
  │     │           └─> Activates scenario_manager
  │     │
  │     └─> scenario_manager Skill
  │           │
  │           ├─> Loads config.json (metadata)
  │           │     │
  │           │     └─> Available/scaffolded status
  │           │
  │           ├─> Queries filesystem (if needed)
  │           │     │
  │           │     └─> Syncs YAML files
  │           │
  │           └─> Formats rich response
  │                 │
  │                 ├─> Scenarios with metadata
  │                 ├─> Status indicators
  │                 ├─> Timestamps
  │                 ├─> Generated files
  │                 └─> Contextual commands
  │
  └─> Terminal (optional, guided by Claude)
```

**Pros:**
- Context-aware responses
- Rich metadata
- Natural language
- Guided workflows
- Status tracking

**Cons:**
- More complex flow
- Additional components
- +300-500 token overhead
- Metadata to maintain

---

## When to Use Each Option

### Use Option 1 (CLI Only) When:

1. **Token Budget Critical**
   - Every token counts
   - Cost optimization priority
   - Limited API budget

2. **Infrequent Use**
   - Scaffolding once a week or less
   - One-off projects
   - Prototyping

3. **Expert Users**
   - Comfortable with CLI
   - Prefer direct control
   - Don't need guidance

4. **Simple Projects**
   - 1-3 scenarios total
   - Straightforward workflows
   - Minimal complexity

---

### Use Option 2 (With scenario_manager) When:

1. **Frequent Scenario Work**
   - Creating/modifying scenarios daily
   - Active development
   - Rapid iteration

2. **Team Environment**
   - Multiple developers
   - Varying skill levels
   - Need consistency

3. **Complex Projects**
   - 5+ scenarios
   - Interdependent workflows
   - Need status tracking

4. **Discovery Important**
   - Frequently check status
   - Need to see what's scaffolded
   - Track usage patterns

5. **Guidance Valuable**
   - Learning the system
   - Want suggestions
   - Prefer interactive workflows

---

## Implementation Decision Rationale

### Why We Chose Option 2

1. **User Experience Wins**
   - Significantly better UX for common workflows
   - Natural language is more intuitive
   - Reduces cognitive load

2. **Acceptable Token Cost**
   - +300-500 tokens is manageable
   - Proportional to value provided
   - Only active when needed

3. **Team Scalability**
   - Enables collaboration
   - Lowers learning curve
   - Consistent experience

4. **Metadata Value**
   - Status tracking essential for complex projects
   - Audit trail valuable
   - Generated files need tracking

5. **Progressive Disclosure**
   - Still follows PAI principles
   - Scaffold system never auto-loaded
   - User maintains control

6. **Future-Proof**
   - Foundation for future enhancements
   - Enables versioning, collaboration features
   - Scales with project complexity

---

## Migration Path (If Switching)

### From Option 2 → Option 1 (Downgrade)

```bash
# 1. Remove scenario_manager skill
rm -rf ~/.claude/skills/scenario_manager

# 2. Remove skill-rules.json
rm ~/.claude/skill-rules.json

# 3. Keep or remove config.json (optional)
# Config doesn't hurt, but not used without skill
rm ~/.claude/config.json

# 4. Revert scaffold-workflow.js
git checkout lib/utils/scaffold-workflow.js

# 5. Remove scenario-metadata.js
rm lib/utils/scenario-metadata.js
rm lib/utils/__tests__/scenario-metadata.test.js
```

**Impact:**
- Lose natural language queries
- Lose metadata tracking
- Lose status display
- Save ~300-500 tokens/query

---

### From Option 1 → Option 2 (Upgrade)

```bash
# Already done! 
# Implementation complete as of November 10, 2025
```

**Impact:**
- Gain natural language queries
- Gain metadata tracking
- Gain rich status display
- Cost +300-500 tokens/query

---

## Conclusion

**Option 2 (scenario_manager skill) is the superior choice for:**
- Active development environments
- Team collaboration
- Complex projects with multiple scenarios
- Users who value guidance and discovery

**Option 1 (CLI only) is better for:**
- Token-constrained environments
- Infrequent scenario use
- Simple projects
- Expert users who prefer CLI

**We implemented Option 2** because the UX improvements significantly outweigh the token cost for most real-world usage patterns.

---

**Decision:** ✅ Option 2 Implemented  
**Date:** November 10, 2025  
**Status:** Production Ready

