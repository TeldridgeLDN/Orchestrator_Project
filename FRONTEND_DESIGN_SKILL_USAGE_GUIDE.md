# Frontend Design System Skill - Usage Guide

**Status:** ✅ Ready for Use  
**Date:** 2025-11-13

---

## Quick Start

### Installation Verification

All files are now in place:

**Global Skill (~/.claude/skills/frontend_design_system/):**
- ✅ SKILL.md (8.2 KB)
- ✅ metadata.json (2.6 KB)
- ✅ resources/design-principles.md (7.9 KB)
- ✅ resources/shadcn-ui-patterns.md (9.3 KB)
- ✅ resources/icon-guidelines.md (8.4 KB)

**Project Config (dashboard/.claude/):**
- ✅ metadata.json (1.3 KB)
- ✅ skill-rules.json (2.4 KB)
- ✅ Claude.md (7.0 KB)

---

## Testing the Skill

### Test 1: Auto-Activation on File Open

**Steps:**
1. Open a frontend file in the dashboard project:
   ```bash
   cd dashboard
   open src/components/Hero.tsx  # or any .tsx file
   ```

2. Start working in the file or mention design-related keywords

3. The skill should auto-activate based on:
   - File pattern match: `*.tsx` ✓
   - Directory context: `dashboard/` ✓

**Expected Result:**
- SKILL.md overview loads (~300 tokens)
- Claude is aware of design principles and patterns
- Can reference global resources on demand

### Test 2: Keyword Trigger

**Steps:**
1. Open any file in dashboard/
2. Say to Claude:
   ```
   "I need to design a card component for the Build section"
   ```

**Expected Result:**
- Skill activates on keywords: "design", "card", "component"
- References skill-rules.json trigger phrases
- Provides relevant guidance

### Test 3: Resource Loading

**Steps:**
1. With skill active, request a specific resource:
   ```
   "Show me icon guidelines"
   ```

**Expected Result:**
- Loads `resources/icon-guidelines.md`
- Provides comprehensive icon guidance
- Total context: ~580 tokens (overview + resource)

### Test 4: Project Context

**Steps:**
1. Ask about landing page sections:
   ```
   "What icons should I use for the Build section?"
   ```

**Expected Result:**
- References `Claude.md` project context
- Suggests: Hammer, Code, Layers icons
- Provides size and color guidance
- Mentions shadcn/ui Card pattern

---

## Common Usage Patterns

### Pattern 1: Creating a New Component

**Scenario:** Building a feature card

**Prompt:**
```
"I'm creating a feature card for the Build section with an icon"
```

**Expected Response:**
1. Activates frontend_design_system skill
2. References shadcn-ui-patterns (Card component)
3. Checks Claude.md for Build section icon strategy
4. Suggests: Code, Hammer, or Layers icon
5. Provides implementation:

```tsx
<Card>
  <CardHeader>
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-lg">
        <Code className="h-8 w-8 text-primary" />
      </div>
      <CardTitle>Build with Precision</CardTitle>
    </div>
  </CardHeader>
  <CardContent>
    <CardDescription>
      Craft scalable solutions with modern tools
    </CardDescription>
  </CardContent>
</Card>
```

### Pattern 2: Design Review

**Scenario:** Reviewing a completed section

**Prompt:**
```
"Review the Design of the Hero section"
```

**Expected Checks:**
- ✓ Typography hierarchy (h1 for hero, proper sizing)
- ✓ Color contrast (WCAG AA compliance)
- ✓ Spacing consistency (using spacing scale)
- ✓ Icon sizing (h-12 w-12 for section icons)
- ✓ Responsive behavior (mobile-first approach)
- ✓ Accessibility (semantic HTML, aria-labels)

### Pattern 3: Resource Lookup

**Scenario:** Need spacing reference

**Prompts:**
```
"Show me design principles"
"What spacing should I use between sections?"
"Show me the color palette"
```

**Expected Response:**
- Loads design-principles.md
- Shows spacing scale (4px base unit)
- Recommends: py-12 (mobile), py-16 (tablet), py-24 (desktop)

### Pattern 4: Component Pattern Reference

**Scenario:** Need shadcn/ui implementation guidance

**Prompts:**
```
"Show me shadcn/ui patterns"
"How do I create a dialog?"
"What's the Button pattern?"
```

**Expected Response:**
- Loads shadcn-ui-patterns.md
- Shows complete component code
- Explains variants and best practices

---

## Verifying Auto-Activation

### Check Skill-Rules.json Triggers

The skill should activate when:

**File Patterns:**
- Working in `*.tsx`, `*.jsx`, `*.css`, `*.scss` files

**Trigger Phrases:**
- "design", "style", "styling", "UI"
- "component", "icon", "color", "layout"
- "typography", "spacing", "landing page"
- "hero", "section", "card", "button"
- "shadcn", "lucide", "tailwind"

**Context:**
- In `dashboard/` directory
- In `src/components/` directory

### Manual Activation

If auto-activation doesn't work, explicitly request:

```
"Load the frontend_design_system skill"
"I need design guidance"
"Show me the design principles"
```

---

## Integration with Claude Code Plugin

### Installing frontend-design Plugin

```bash
/plugin install frontend-design@anthropics/claude-code
```

### How They Work Together

**Workflow:**
1. **Skill provides technical framework:**
   - shadcn/ui patterns
   - Icon implementation
   - Accessibility requirements
   - Spacing and typography systems

2. **Plugin provides aesthetic judgment:**
   - Color palette suggestions
   - Typography refinements
   - Visual harmony evaluation
   - Motion and interaction guidance

3. **Combined result:**
   - Technically sound (skill)
   - Aesthetically excellent (plugin)
   - Accessible and performant (skill)

**Example:**

```
You: "Style this hero section"

Skill: 
- Use shadcn/ui Card pattern
- Icon size: h-12 w-12
- Spacing: py-24 (desktop)
- Typography: text-6xl for h1

Plugin:
- Suggests warmer color palette
- Recommends subtle gradient
- Proposes animation timing

Result: Technically sound + visually stunning
```

---

## Troubleshooting

### Skill Not Activating

**Problem:** Working in dashboard but skill doesn't load

**Solutions:**
1. Check you're in a `.tsx`, `.jsx`, or `.css` file
2. Mention a trigger phrase: "I need design guidance"
3. Explicitly request: "Load frontend_design_system skill"
4. Verify `dashboard/.claude/skill-rules.json` exists

### Resource Not Loading

**Problem:** Request "Show me icon guidelines" but nothing loads

**Solutions:**
1. Use explicit phrasing: "Show me the icon guidelines resource"
2. Check resource file exists: `~/.claude/skills/frontend_design_system/resources/icon-guidelines.md`
3. Verify file is readable: `ls -la ~/.claude/skills/frontend_design_system/resources/`

### Context Not Applying

**Problem:** Skill doesn't reference portfolio/landing page context

**Solutions:**
1. Verify `dashboard/.claude/Claude.md` exists
2. Explicitly mention: "Based on the portfolio redesign project..."
3. Reference specific sections: "For the Build section..."

---

## Next Steps

### 1. Test in Real Usage

Open a dashboard component and try:

```bash
cd dashboard
# Open a component file
# Start working on design
```

**Test Prompts:**
- "Help me design this card component"
- "What icon should I use here?"
- "Review this section's typography"
- "Show me the spacing scale"

### 2. Apply to Landing Page

Use the skill for each section:

**Discovery Section:**
- Icon selection (Search, Target, Compass)
- Hero typography
- Color scheme application

**Build Section:**
- Feature card design
- Icon integration (Hammer, Code, Layers)
- Layout patterns

**Launch Section:**
- Portfolio highlight cards
- Success metrics display
- Social proof elements

**Grow Section:**
- CTA design
- Form styling
- Newsletter signup component

### 3. Iterate and Refine

As you use the skill:
- Note which resources are most helpful
- Identify gaps in guidance
- Add project-specific patterns to Claude.md
- Refine trigger rules if needed

---

## Key Commands Reference

### Activating the Skill
```
"Load frontend_design_system skill"
"I need design guidance"
"Help me with this component's design"
```

### Loading Resources
```
"Show me design principles"
"Show me shadcn/ui patterns"
"Show me icon guidelines"
```

### Project Context
```
"What icons for the Build section?"
"Show me the project color palette"
"What's the landing page structure?"
```

### Review and Validation
```
"Review this component's design"
"Check accessibility"
"Validate spacing consistency"
```

---

## Success Metrics

You'll know the skill is working when:

✅ Auto-activates when opening frontend files  
✅ Provides shadcn/ui patterns on request  
✅ References project-specific context (Claude.md)  
✅ Loads resources progressively (on-demand)  
✅ Suggests appropriate icons for each section  
✅ Validates design against principles  
✅ Maintains token efficiency (<1500 tokens with all resources)  

---

## Files Reference

**Global Skill:**
- `~/.claude/skills/frontend_design_system/SKILL.md`
- `~/.claude/skills/frontend_design_system/metadata.json`
- `~/.claude/skills/frontend_design_system/resources/design-principles.md`
- `~/.claude/skills/frontend_design_system/resources/shadcn-ui-patterns.md`
- `~/.claude/skills/frontend_design_system/resources/icon-guidelines.md`

**Project Config:**
- `dashboard/.claude/metadata.json`
- `dashboard/.claude/skill-rules.json`
- `dashboard/.claude/Claude.md`

**Documentation:**
- `FRONTEND_DESIGN_SKILL_IMPLEMENTATION.md` (full implementation details)
- `FRONTEND_DESIGN_SKILL_USAGE_GUIDE.md` (this file)

---

**Status:** ✅ Ready for Production Use  
**Created:** 2025-11-13  
**Author:** Claude (Sonnet 4.5)  
**Orchestrator Version:** 1.2.0

