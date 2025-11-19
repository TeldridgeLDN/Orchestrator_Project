# React Component Analyzer

**Version:** 1.0.0  
**Status:** Production Ready (Analysis & Specification)  
**Scope:** React-based projects  
**Type:** Global Skill

---

## Overview

Transform UI design mockups into structured design specifications and React component implementation guides. This skill bridges the gap between design and development by extracting design system tokens, documenting component hierarchies, and providing detailed implementation recommendations.

**Current Capabilities (v1.0):**
- Component inventory and hierarchy mapping
- Design system extraction (colors, typography, spacing, effects)
- Interactive state documentation with confidence levels
- Implementation recommendations (architecture, state management, data structures)
- Responsive design considerations
- Accessibility requirements
- Developer checklists

**Future Capabilities (v1.1+):**
- React component code generation
- Integration with existing component libraries
- Design diff detection
- Multi-framework support

---

## Quick Start

### Installation

This skill is part of the Orchestrator project and is automatically available in all projects with Orchestrator configured.

### Basic Usage

```bash
# Paste a design image in chat and say:
"Analyze this design mockup"

# With project context:
"Analyze this dashboard design. We use TypeScript and Tailwind CSS."

# Focus on specific component:
"Extract specs for the button component in this image"

# Design system only:
"Get design tokens from this mockup"
```

### Prerequisites

Before using this skill:

1. **Project Context** (auto-detected or specify):
   - React version (16.8+ for hooks)
   - TypeScript or JavaScript
   - CSS framework (Tailwind, CSS Modules, Styled Components, etc.)
   - Component library (MUI, Chakra, custom, none)

2. **Design Quality**:
   - High-fidelity mockup preferred
   - Clear visual elements
   - Readable text and colors

3. **Optional Enhancements**:
   - Multiple states (hover, error, loading)
   - Responsive variants (mobile, tablet, desktop)
   - Design system documentation

---

## File Structure

```
.claude/skills/react-component-analyzer/
├── README.md                           # This file
├── skill.md                            # Full skill documentation
└── resources/
    ├── quick-ref.md                    # Quick reference guide
    └── design-spec-template.md         # Output template
```

---

## Usage Modes

### Mode 1: Quick Analysis (2-3 minutes)
**Use Case:** Fast component overview  
**Output:** Component inventory + basic design system

```
"Quick analysis of this design"
```

### Mode 2: Full Specification (5-8 minutes) ⭐ Recommended
**Use Case:** Complete implementation guide  
**Output:** All 4 workflow steps (inventory, design system, states, recommendations)

```
"Full specification for this dashboard mockup"
```

### Mode 3: Component Focus (3-5 minutes)
**Use Case:** Deep dive on specific component  
**Output:** Detailed analysis of one component

```
"Focus on the activity card component in this design"
```

### Mode 4: Design System Only (2-3 minutes)
**Use Case:** Extract design tokens  
**Output:** Colors, typography, spacing, effects

```
"Extract design system tokens from this mockup"
```

---

## Workflow Steps

The skill follows a 4-step process:

### Step 1: Component Inventory & Hierarchy
- Identify all UI components (structural, interactive, display, feedback)
- Map component nesting and relationships
- Document conditional and dynamic elements

### Step 2: Design System Extraction
- Extract color palette with confidence levels
- Estimate typography (fonts, sizes, weights)
- Measure spacing system (padding, margins, gaps)
- Document visual effects (shadows, borders, gradients)

### Step 3: Interactive State Mapping
- Document all observable states (default, hover, active, focus, disabled, error)
- Infer missing states based on design patterns
- Map state triggers and transitions

### Step 4: Design Specification Document
- Generate complete design spec using template
- Include implementation recommendations
- Provide developer checklists
- List open questions and confidence levels

---

## Output Example

```markdown
# Design Specification: User Dashboard

**Confidence:** HIGH (overall)

## Component Inventory
- PageContainer - Full-page wrapper
- ActivityCard - Repeating content card
- FilterBar - Interactive filter controls
- ...

## Design System
### Color Palette
- Primary: #3B82F6 (HIGH - visible in buttons)
- Success: #10B981 (HIGH - green badges)
- ...

### Typography
- Display: 32px, 700 weight (estimated)
- Body: 16px, 400 weight (measured)
- ...

## Interactive States
### Button States
- Default: Blue background, white text
- Hover: Darker blue (INFERRED - not shown)
- ...

## Implementation Recommendations
[Architecture, state management, data structures, responsive, a11y]
```

---

## Integration with Orchestrator

### Auto-Activation

This skill activates when:

**Trigger Phrases:**
- "analyze design"
- "convert mockup"
- "design to code"
- "extract design system"
- "component from design"
- "mockup analysis"
- "ui analysis"
- "figma to react"

**File Patterns:**
- Images in conversation (PNG, JPG, JPEG)
- Files in `design/`, `mockups/`, `figma/` directories
- Working with `src/components/` files

### Auto-Save Locations

```bash
# Design specifications
.claude/knowledge/design-specs/[feature-name].md

# Component implementation tasks
.taskmaster/tasks/tasks.json

# Design tokens (if requested)
src/styles/design-tokens.ts
```

### Task Creation

After generating a spec, create implementation tasks:

```bash
task-master add-task \
  --prompt="Implement ActivityCard component from design spec" \
  --dependencies="design-spec-review"
```

### Rule Integration

This skill respects existing rules:
- `.claude/rules/react.mdc` - React component conventions
- `.claude/rules/typescript.mdc` - TypeScript patterns
- `.claude/rules/ui-components.mdc` - UI component standards

---

## Best Practices

### ✅ DO:

- **Provide high-quality images** - Clear, readable designs
- **Share project context** - TypeScript? Tailwind? Component library?
- **Specify focus areas** - "Focus on navigation" or "Extract full design system"
- **Review confidence levels** - Validate MEDIUM/LOW confidence items
- **Validate with design team** - Confirm colors, fonts, spacing
- **Ask clarifying questions** - "What should empty state look like?"

### ❌ DON'T:

- **Expect pixel-perfect accuracy** - This is a starting point, not final code
- **Use low-quality images** - Blurry designs = inaccurate extraction
- **Skip manual validation** - Always review and confirm extracted values
- **Assume it knows your conventions** - Tell it your project setup
- **Expect production-ready code** - v1.0 generates specs, not full code

---

## Confidence Levels

The skill provides confidence assessments for all extractions:

### HIGH (85-90% accurate)
- Colors extracted from design
- Component layout and hierarchy
- Basic interactive states (when shown)

**Action:** Safe to use with minor validation

### MEDIUM (60-80% accurate)
- Font families (estimated from visual characteristics)
- Exact spacing values (measured from image)
- Hover/active states (inferred from patterns)

**Action:** Review carefully, likely needs adjustment

### LOW (40-60% accurate)
- Responsive breakpoints (not shown in image)
- Animation timing (no motion in static image)
- Empty/loading states (not visible in design)

**Action:** Use as starting point, requires confirmation

---

## Limitations

### What v1.0 Cannot Do

❌ **Technical Limitations:**
- Read Figma files directly (export to PNG/JPG first)
- Generate pixel-perfect measurements (estimates only)
- Determine exact font families from images
- Show animations/transitions from static images
- Access design system documentation (unless provided)
- Generate full production-ready code (v1.0 limitation)

❌ **Context Limitations:**
- Detect business logic requirements
- Understand project-specific naming conventions (without context)
- Know existing component library details (unless shared)
- Determine data fetching strategies
- Understand authentication/permission requirements

### Accuracy Expectations

| Element | Accuracy | Notes |
|---------|----------|-------|
| Colors | 85-90% | Direct pixel sampling |
| Layout | 85-90% | Visual structure clear |
| Typography | 60-70% | Font sizes approximate, families estimated |
| Spacing | 70-80% | Measured from image, may need refinement |
| Interactions | 40-60% | Inferred from static images |

---

## Troubleshooting

### Issue: "Cannot extract design system"
**Cause:** Image quality too low or design too complex  
**Solution:**
- Use higher resolution image
- Break design into smaller sections
- Provide multiple views (zoomed in/out)
- Add annotations for clarity

### Issue: "Generated spec doesn't match design"
**Cause:** AI misinterpreted visual elements  
**Solution:**
- Provide annotations on image
- Describe ambiguous elements in prompt
- Reference similar components in project
- Review confidence levels

### Issue: "Missing interactive states"
**Cause:** Static image doesn't show all states  
**Solution:**
- Provide multiple images (default, hover, error, loading)
- Describe expected interactions in prompt
- Reference existing interaction patterns
- Ask designer for state specifications

### Issue: "Code suggestions don't match project style"
**Cause:** Skill lacks project context  
**Solution:**
- Share project config in prompt (TypeScript? Tailwind?)
- Reference existing component files
- Specify CSS framework and component library
- Point to coding conventions document

---

## Examples

### Example 1: Dashboard Analysis

**Input:**
```
"Analyze this dashboard mockup. We're using:
- React 18 with TypeScript
- Tailwind CSS
- Shadcn UI components
- Focus on the activity card component"
```

**Output:**
- Component inventory focusing on activity cards
- Design system extraction with Tailwind-compatible classes
- State documentation for interactive elements
- Implementation guide using Shadcn UI patterns

### Example 2: Design System Extraction

**Input:**
```
"Extract design tokens from this mockup.
Project uses CSS variables for theming."
```

**Output:**
- Complete color palette as CSS variables
- Typography scale with CSS variable names
- Spacing system as CSS variables
- Sample `design-tokens.css` file

### Example 3: Component Focus

**Input:**
```
"Deep dive on the button component in this design.
We use styled-components and have existing Button component."
```

**Output:**
- Detailed button state analysis
- Styled-components implementation suggestions
- Props interface for TypeScript
- Integration with existing Button component

---

## Advanced Usage

### Custom Context Sharing

```
"Analyze this design with context:

Project Setup:
- React 18.2 + TypeScript 5.0
- Vite build tool
- Tailwind CSS 3.3 with custom config
- React Query for data fetching
- Zustand for state management

Component Library:
- Custom UI library in src/components/ui/
- Uses compound component pattern
- All components have dark mode support

Design Notes:
- Designer: Sarah Chen
- Brand: Acme Corp
- Existing design system in Figma (colors confirmed)

Questions:
- What should empty state look like?
- Should activity cards be virtualized (1000+ items)?
- Do filters persist in URL query params?"
```

### Iterative Refinement

```
# Initial analysis
"Quick analysis of this design"

# Follow-up for specific area
"Elaborate on the responsive breakpoints for mobile"

# Request specific output
"Generate TypeScript interfaces for the data structures"

# Save to knowledge base
"Save this spec to .claude/knowledge/design-specs/dashboard.md"
```

### Multi-Image Analysis

```
"Analyze these designs together:
1. Desktop view (this image)
2. Mobile view (next image)
3. Error states (third image)

Create a unified specification covering all states and breakpoints."
```

---

## Roadmap

### v1.0 ✅ (Current)
- Component inventory and hierarchy
- Design system extraction
- Interactive state documentation
- Implementation recommendations

### v1.1 (Q1 2026)
- React component code generation
- Integration with existing component libraries
- Improved TypeScript interface generation
- Design token export (CSS variables, Tailwind config)

### v1.2 (Q2 2026)
- Design diff detection (compare v1 vs v2)
- Storybook story generation
- Automated test scaffolding
- Multi-state image analysis

### v2.0 (Q3 2026)
- Multi-framework support (Vue, Svelte, Angular)
- Figma plugin integration
- Real-time collaboration features
- Component library marketplace integration

---

## Contributing

To improve this skill:

1. **Report Issues**
   - File in `.claude/knowledge/skill-feedback/react-component-analyzer/`
   - Include: input, expected output, actual output

2. **Suggest Improvements**
   - What worked well?
   - What was confusing?
   - What's missing?

3. **Share Examples**
   - Successful analyses
   - Edge cases
   - Interesting patterns

---

## Related Skills

- **doc-generator** - Document components after implementation
- **shell-integration** - Run build/test commands
- **code-reviewer** - Review generated component code
- **test-runner** - Execute component tests

---

## Support

### Documentation
- Full skill guide: `skill.md`
- Quick reference: `resources/quick-ref.md`
- Output template: `resources/design-spec-template.md`

### Commands
```bash
# View skill documentation
cat .claude/skills/react-component-analyzer/skill.md

# Check activation rules
jq '.rules[] | select(.skill=="react-component-analyzer")' .claude/skill-rules.json

# View recent specs
ls -la .claude/knowledge/design-specs/
```

---

## License

Part of the Orchestrator project.

---

**Last Updated:** November 15, 2025  
**Maintainer:** Orchestrator Core Team  
**Status:** Production Ready (v1.0)

