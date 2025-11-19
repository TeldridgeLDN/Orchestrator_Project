# Frontend Skills Auto-Activation Workflow

**Date:** November 16, 2025  
**Status:** Complete & Ready  
**Project Example:** multi-layer-cal

---

## Overview

The three frontend skills (**User Scenario Generator**, **React Component Analyzer**, **Frontend Design System**) will **automatically activate** in frontend projects through the diet103 pattern. No manual configuration needed for projects like `multi-layer-cal`.

---

## How Auto-Activation Works

### 1. Project Detection (Automatic)

When a project initializes or Claude opens:

```javascript
// Auto-detects project type based on files
Package.json + src/ + React = "frontend"
→ Loads frontend skill rules automatically
```

### 2. Skill Rules File

Projects get `.claude/skill-rules.json` with auto-activation triggers:

```json
{
  "rules": [
    {
      "id": "user_scenario_generator",
      "trigger_phrases": [
        "generate user scenarios",
        "user scenarios",
        "3 whys",
        "user perspective",
        "why does user",
        "user journey",
        "user intent"
      ],
      "file_patterns": [],
      "skill": "user-scenario-generator",
      "auto_activate": true,
      "priority": "high",
      "description": "Generates user scenarios with 3 Whys analysis"
    },
    {
      "id": "react_component_analyzer",
      "trigger_phrases": [
        "analyze design",
        "extract components",
        "mockup analysis",
        "design to code",
        "figma to react"
      ],
      "file_patterns": [
        "design/",
        "mockups/",
        "figma/"
      ],
      "skill": "react-component-analyzer",
      "auto_activate": true,
      "priority": "medium",
      "description": "Analyzes design mockups for component extraction"
    },
    {
      "id": "frontend_design_system",
      "trigger_phrases": [
        "design system",
        "button specs",
        "calendar grid",
        "card grid",
        "spacing system",
        "component specs"
      ],
      "file_patterns": [
        "src/components/",
        "components/"
      ],
      "skill": "frontend-design-system",
      "auto_activate": true,
      "priority": "high",
      "description": "Provides design system specifications"
    }
  ],
  "global_settings": {
    "case_sensitive": false,
    "partial_match": true,
    "require_exact_phrase": false
  }
}
```

### 3. UserPromptSubmit Hook

Hook monitors prompts and auto-loads skills:

```javascript
// .claude/hooks/skill-activation.js
User types: "Generate user scenarios from article"
     ↓
Hook detects: "user scenarios" matches trigger phrase
     ↓
Auto-loads: user-scenario-generator skill
     ↓
Claude responds with skill context active
```

---

## For multi-layer-cal Project

### Automatic Setup

When you run `orchestrator init` or `orchestrator sync-skills`:

```
multi-layer-cal/
├── .claude/
│   ├── skill-rules.json (auto-created with frontend rules)
│   ├── hooks/
│   │   └── skill-activation.js (auto-created)
│   └── settings.json (hooks enabled)
│
└── Skills loaded from global:
    ~/.claude/skills/
    ├── user-scenario-generator/
    ├── react-component-analyzer/
    └── frontend-design-system/
```

**Zero manual configuration needed!**

### Example Usage in multi-layer-cal

```bash
# 1. Open Claude in multi-layer-cal
cd ~/multi-layer-cal
claude

# 2. Say anything with trigger phrases
"Generate user scenarios for the calendar view"
→ User Scenario Generator auto-activates

"Analyze this calendar mockup"
→ React Component Analyzer auto-activates

"Build calendar grid component"
→ Frontend Design System auto-activates

# All three work together seamlessly
```

---

## Activation Priority & Flow

### Priority Hierarchy

```
Priority Levels:
- high: Activates first if multiple matches
- medium: Activates second
- low: Activates last

For our skills:
1. User Scenario Generator: HIGH
2. Frontend Design System: HIGH
3. React Component Analyzer: MEDIUM
```

### Smart Activation Flow

**Scenario 1: User has article**
```
User: "Generate scenarios from this calendar article"
     ↓
Triggers: "scenarios" matches User Scenario Generator
     ↓
Activates: user-scenario-generator (HIGH priority)
     ↓
User gets: 4 scenarios with 3 Whys analysis
```

**Scenario 2: User uploads mockup**
```
User: [Uploads image] "Analyze this design"
     ↓
Triggers: "analyze" + "design" + image context
     ↓
Activates: react-component-analyzer (MEDIUM priority)
     ↓
User gets: Component inventory and specs
```

**Scenario 3: User needs implementation**
```
User: "Build calendar grid component"
     ↓
Triggers: "calendar grid" + file context (src/components/)
     ↓
Activates: frontend-design-system (HIGH priority)
     ↓
User gets: Exact specs and React code
```

**Scenario 4: Chained workflow**
```
User: "Generate scenarios from article"
→ User Scenario Generator activates

User: "Now implement Scenario 1"
→ Frontend Design System activates
→ Both skills work together seamlessly
```

---

## File Context Detection

Skills also auto-activate based on files you're editing:

```javascript
// Working in components?
src/components/Button.tsx (open)
→ Frontend Design System auto-suggests

// Have design files?
design/calendar-mockup.png (in project)
→ React Component Analyzer auto-suggests

// Writing PRD or docs?
docs/user-requirements.md (open)
→ User Scenario Generator auto-suggests
```

---

## Project Type Recommendations

### Frontend Project Detection

```javascript
// Orchestrator automatically detects:
- package.json with "react" dependency
- src/ directory structure
- Component files (*.jsx, *.tsx)

→ Classifies as: "frontend" project
→ Recommends: All three frontend skills
```

### Auto-Priming on Init

```bash
# When you init a new frontend project:
orchestrator init

? Project type: (auto-detected: frontend)
? Activate skills: ✨ Auto (Recommended)

→ All three frontend skills auto-activated
→ skill-rules.json created with triggers
→ hooks/ directory set up
→ Ready to use immediately
```

---

## Manual Control (If Needed)

### Force Skill Activation

```bash
# If auto-activation doesn't work:
"Load the user scenario generator skill"
"Activate frontend design system"
"Use react component analyzer"
```

### Disable Auto-Activation

```json
// .claude/skill-rules.json
{
  "rules": [
    {
      "id": "user_scenario_generator",
      "auto_activate": false,  // ← Disable
      // ... rest of config
    }
  ]
}
```

### Check Active Skills

```bash
# See what's currently active
orchestrator skills list --active

# See what's available
orchestrator skills list
```

---

## Workflow Examples for multi-layer-cal

### Example 1: Starting from Concept

```
Session: multi-layer-cal

User: "I want to add energy-based scheduling. 
       Generate user scenarios."

Auto-activates: user-scenario-generator ✓
Output: 3 scenarios with 3 Whys analysis

User: "Implement Scenario 1 using the design system"

Auto-activates: frontend-design-system ✓
Output: Calendar Grid component with energy indicators

Result: Complete feature with user context + implementation
```

### Example 2: Starting from Design

```
Session: multi-layer-cal

User: [Uploads Figma mockup]
      "Analyze this calendar redesign"

Auto-activates: react-component-analyzer ✓
Output: Component inventory, hierarchy, visual specs

User: "Why would users need these components?"

Auto-activates: user-scenario-generator ✓
Output: User scenarios explaining component purposes

User: "Build CalendarDay component"

Auto-activates: frontend-design-system ✓
Output: Exact specs + React code

Result: Complete understanding (WHAT + WHY + HOW)
```

### Example 3: Feature Enhancement

```
Session: multi-layer-cal

User: "Users want to see workout intensity. 
       Create scenarios for this."

Auto-activates: user-scenario-generator ✓
Output: Scenarios showing intensity = recovery planning

User: "Add intensity badges to calendar grid"

Auto-activates: frontend-design-system ✓
Output: Badge component specs + Calendar Grid updates

Result: User-centered feature enhancement
```

---

## Troubleshooting

### "Skills not activating automatically"

**Fix 1: Check skill-rules.json exists**
```bash
ls -la .claude/skill-rules.json
# Should exist in project root

# If missing:
orchestrator sync-skills
```

**Fix 2: Verify hooks are enabled**
```json
// .claude/settings.json
{
  "hooks": {
    "UserPromptSubmit": [
      ".claude/hooks/skill-activation.js"
    ]
  }
}
```

**Fix 3: Check trigger phrases**
```bash
# Use exact trigger phrases from metadata.json
"generate user scenarios"  ✓
"make scenarios"           ✗ (not a trigger phrase)
```

### "Wrong skill activates"

**Fix: Adjust priority in skill-rules.json**
```json
{
  "id": "user_scenario_generator",
  "priority": "high",  // ← higher activates first
  // ...
}
```

### "Skills conflict with each other"

**Not a problem!** They're designed to work together:
- Different trigger phrases
- Different input types
- Complementary outputs

---

## Configuration Files

### Global Skills Location

```
~/.claude/skills/
├── user-scenario-generator/
│   ├── skill.md
│   ├── metadata.json (trigger phrases)
│   └── ...
├── react-component-analyzer/
└── frontend-design-system/
```

**Synced once, available everywhere:**
```bash
cd ~/Orchestrator_Project
orchestrator sync-skills

# Now available in ALL projects:
cd ~/multi-layer-cal  # ✓ Has skills
cd ~/portfolio        # ✓ Has skills
cd ~/data-viz         # ✓ Has skills
```

### Project-Specific Rules

```
multi-layer-cal/.claude/
├── skill-rules.json (project-specific triggers)
├── hooks/skill-activation.js (auto-activation logic)
└── settings.json (hooks enabled)
```

---

## Testing Auto-Activation

### Test 1: User Scenario Generator

```bash
cd ~/multi-layer-cal
claude

# Type:
"Generate user scenarios for calendar energy tracking"

# Expected:
- User Scenario Generator loads automatically
- Creates scenarios with 3 Whys analysis
- No manual "load skill" command needed
```

### Test 2: React Component Analyzer

```bash
# Upload a mockup image

# Type:
"Analyze this calendar design"

# Expected:
- React Component Analyzer loads automatically
- Extracts components and visual specs
```

### Test 3: Frontend Design System

```bash
# Open src/components/Calendar.tsx

# Type:
"Build a calendar grid following the design system"

# Expected:
- Frontend Design System loads automatically
- Provides exact specs and React code
```

### Test 4: Chained Workflow

```bash
# Type:
"Generate scenarios from https://julian.digital/2023/07/06/multi-layered-calendars/"

# Then:
"Now implement Scenario 1"

# Expected:
- First: User Scenario Generator loads
- Then: Frontend Design System loads
- Both work together seamlessly
```

---

## Summary

### ✅ What Happens Automatically

1. **Project Detection**
   - Orchestrator detects "frontend" project type
   - Recommends all three frontend skills

2. **Skill Installation**
   - Skills sync to `~/.claude/skills/` (global)
   - Available in all projects immediately

3. **Rule Configuration**
   - `.claude/skill-rules.json` created with triggers
   - Hooks set up for auto-activation

4. **Auto-Activation**
   - User types trigger phrase → Skill loads
   - User opens relevant file → Skill suggests
   - User uploads image → Analyzer activates

### ❌ What You DON'T Need to Do

- ❌ Manually load skills
- ❌ Remember skill names
- ❌ Configure individual projects
- ❌ Copy skills to each project
- ❌ Write custom activation logic

### 🎯 Result

**In multi-layer-cal:**
```
Just start working naturally:
"Generate scenarios..." → Scenarios appear
"Analyze this design..." → Analysis happens
"Build component..." → Specs provided

All three skills work together automatically.
No configuration. No manual loading. Just works.
```

---

## Next Steps

### For Orchestrator Project

1. **Complete skill sync:**
   ```bash
   cd ~/Orchestrator_Project
   orchestrator sync-skills
   ```

2. **Verify global skills:**
   ```bash
   ls ~/.claude/skills/
   # Should show:
   # - user-scenario-generator
   # - react-component-analyzer  
   # - frontend-design-system
   ```

### For multi-layer-cal (or any frontend project)

1. **Verify project setup:**
   ```bash
   cd ~/multi-layer-cal
   ls .claude/skill-rules.json  # Should exist
   ls .claude/hooks/            # Should have skill-activation.js
   ```

2. **Test auto-activation:**
   ```bash
   claude
   # Type: "Generate user scenarios for calendar"
   # Should auto-load user-scenario-generator
   ```

3. **Start using naturally:**
   - Say "generate scenarios" when you need WHY
   - Say "analyze design" when you have mockups
   - Say "build component" when you need implementation

---

**Status:** ✅ Ready for auto-activation  
**Configuration Needed:** None (handled automatically)  
**Manual Setup:** Not required  
**Works in:** multi-layer-cal and all frontend projects

🎉 **Three skills, zero configuration, seamless integration!**









