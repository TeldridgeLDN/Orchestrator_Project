# React Component Analyzer - Quick Reference

## One-Line Summary
Transform UI design mockups into structured design specifications and React component scaffolding.

---

## Quick Start

```bash
# Paste image in chat and say:
"Analyze this design mockup"

# Or with context:
"Analyze this dashboard design. We use TypeScript and Tailwind."

# Focus on specific component:
"Extract specs for the button component in this image"

# Design system only:
"Get design tokens from this mockup"
```

---

## Output Modes

| Mode | Time | Output |
|------|------|--------|
| **Quick Analysis** | 2-3 min | Component inventory + basic design system |
| **Full Specification** (recommended) | 5-8 min | Complete design spec (all 4 steps) |
| **Component Focus** | 3-5 min | Deep dive on specific component |
| **Design System Only** | 2-3 min | Colors, typography, spacing, effects |

---

## What You Get (v1.0)

✅ **Included:**
- Component inventory and hierarchy
- Design system extraction (colors, typography, spacing)
- Interactive state documentation
- Implementation recommendations
- Developer checklists

⏳ **Not Included (Future):**
- Full React component code generation
- Automated testing strategies
- Multi-framework support

---

## Best Practices

### ✅ DO:
- Provide high-quality design images
- Share project context (TypeScript? Tailwind? MUI?)
- Specify focus areas
- Review confidence levels
- Validate with design team

### ❌ DON'T:
- Expect pixel-perfect accuracy without review
- Use low-quality/blurry images
- Skip manual validation
- Assume it knows your conventions (tell it!)

---

## Confidence Levels

| Level | Meaning | Action |
|-------|---------|--------|
| **HIGH** | 85-90% accurate | Safe to use, minor validation needed |
| **MEDIUM** | 60-80% accurate | Review carefully, likely needs adjustment |
| **LOW** | 40-60% accurate | Use as starting point, requires confirmation |

---

## Common Issues

### "Cannot extract design system"
→ Image too low quality or design too complex
→ **Fix:** Use higher res, break into sections, provide annotations

### "Generated spec doesn't match"
→ AI misinterpreted visual elements
→ **Fix:** Add descriptions, show multiple views, review confidence

### "Missing interactive states"
→ Static image doesn't show all states
→ **Fix:** Provide multiple images (hover, error, etc.) or describe

---

## Integration with Orchestrator

### Auto-Save Locations
```bash
# Design specs
.claude/knowledge/design-specs/[feature-name].md

# Component tasks
.taskmaster/tasks/tasks.json

# Design tokens (if requested)
src/styles/design-tokens.ts
```

### Task Creation
```bash
# After generating spec:
task-master add-task \
  --prompt="Implement [Component] from design spec" \
  --dependencies="design-spec-review"
```

---

## Key Phrases

| Say This | To Do This |
|----------|------------|
| "analyze design" | Full workflow |
| "extract colors" | Color palette only |
| "component breakdown" | Inventory + hierarchy |
| "design system" | Visual design extraction |
| "implementation guide" | Developer recommendations |
| "save to knowledge" | Save to .claude/knowledge/ |

---

## Prerequisites Check

Before using, verify:

```javascript
✅ React 16.8+ (hooks)
✅ TypeScript or JavaScript specified
✅ CSS framework known (Tailwind, CSS Modules, etc.)
✅ Component library (MUI, Chakra, custom, none)
✅ High-fidelity design image
```

---

## Workflow Overview

```
Step 1: Component Inventory (what's in the design?)
   ↓
Step 2: Design System Extraction (colors, fonts, spacing)
   ↓
Step 3: Interactive States (hover, focus, error, etc.)
   ↓
Step 4: Design Specification Document (complete guide)
```

---

## Example Request

**Good:**
```
"Analyze this dashboard mockup. We're using:
- React 18 with TypeScript
- Tailwind CSS
- Shadcn UI components
- Focus on the activity card component"
```

**Better:**
```
"Analyze this dashboard design (full specification).

Context:
- React 18 + TypeScript
- Tailwind CSS with custom theme
- Existing component library in src/components/ui/
- Need responsive breakpoints documented
- Designer: Sarah, Brand: Acme Corp

Questions:
- What should empty state look like?
- Should filters persist in localStorage?"
```

---

## v1.0 Limitations

❌ Cannot:
- Read Figma files directly (export to PNG/JPG first)
- Generate production-ready code (v1.0 = specs only)
- Determine exact fonts (estimates based on visual)
- Show animations from static images
- Know your project conventions (without context)

✅ Can:
- Extract colors, layouts, component types (85-90% accuracy)
- Document structure and hierarchy
- Provide implementation guidance
- Generate TypeScript interfaces for data
- Suggest component architecture

---

## After You Get Results

1. **Review Confidence Levels**
   - HIGH = mostly good
   - MEDIUM = needs validation
   - LOW = requires confirmation

2. **Validate Specs**
   - Check colors against brand guidelines
   - Verify spacing with design files
   - Confirm fonts with design team

3. **Save to Knowledge Base**
   ```bash
   # Specs auto-saved to:
   .claude/knowledge/design-specs/
   ```

4. **Create Implementation Tasks**
   ```bash
   task-master add-task --prompt="Implement [component]"
   ```

5. **Implement & Test**
   - Use specs as scaffolding
   - Apply project conventions
   - Test accessibility

---

## Related Skills

- **doc-generator**: Document components after implementation
- **shell-integration**: Run build/test commands
- **code-reviewer**: Review generated code

---

## Quick Help

```bash
# View full skill documentation
cat .claude/skills/react-component-analyzer/skill.md

# Check if skill is active
# Look for "react-component-analyzer" in skill status

# Manually activate
"Activate react-component-analyzer skill"
```

---

**Version:** 1.0.0  
**Scope:** React projects only  
**Status:** Analysis & specification (code generation in v1.1)

