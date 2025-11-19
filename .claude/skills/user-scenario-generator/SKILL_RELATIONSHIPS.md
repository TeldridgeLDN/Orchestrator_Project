# Skill Relationship Map: User Scenario Generator

**Date:** November 16, 2025  
**Purpose:** Clarify separation and integration between related frontend skills

---

## Skill Separation Matrix

| Aspect | User Scenario Generator | Frontend Design System | React Component Analyzer |
|--------|------------------------|----------------------|-------------------------|
| **Primary Input** | Articles, concepts, inspiration, transcripts | None (provides specs) | Design mockups, Figma files |
| **Primary Output** | User stories with intent & context | Component/layout specifications | Design extraction & analysis |
| **Focus** | **WHY** users do things (3 Whys) | **HOW** to build consistently | **WHAT** is in the design |
| **Perspective** | User's mental model | Developer's implementation guide | Design system extraction |
| **Generates** | Scenarios, journeys, requirements | React code specs, design tokens | Component inventory, hierarchy |
| **Token Intensive** | Medium (400 tokens overview) | Low (300 tokens overview) | Medium (varies by design) |
| **Auto-Activation** | "user scenarios", "3 whys" | "design system", "button specs" | "analyze design", "mockup to code" |

---

## Clear Boundaries

### User Scenario Generator (NEW)

**Does:**
- ✅ Transforms inspiration (articles, concepts, videos) into user-centered scenarios
- ✅ Applies 3 Whys methodology to find deep user needs
- ✅ Creates detailed user journeys with emotional context
- ✅ Maps user intent to UI requirements (high-level)
- ✅ Generates multiple scenarios from single source material
- ✅ Provides context for **WHY** features exist

**Does NOT:**
- ❌ Extract visual specs from design images (→ React Component Analyzer does this)
- ❌ Provide spacing values, color codes, or typography specs (→ Frontend Design System does this)
- ❌ Generate actual React code (→ Frontend Design System does this)
- ❌ Analyze existing mockups for visual details (→ React Component Analyzer does this)

**Outputs:**
- User goal statements
- 3 Whys analysis
- User journey flows
- Emotional context notes
- High-level UI requirement descriptions (references components by name)

**Example Output:**
```markdown
**User Goal:** See yesterday's activities to understand today's fatigue

**3 Whys:**
Surface: "I want to see my calendar"
└─ Why #1: "I feel tired"
   └─ Why #2: "I did intense exercise yesterday"
      └─ Why #3: "I need to adjust today's schedule for recovery"

**UI Requirements:**
- Use Calendar Grid pattern (from frontend-design-system)
- Event blocks should show intensity indicator
- Past days need visual distinction from today
- Navigate backward easily (swipe or arrow)
```

---

### Frontend Design System (EXISTING)

**Does:**
- ✅ Provides exact spacing values (xs: 4px, md: 16px, etc.)
- ✅ Defines component specifications (Button variants, sizes, states)
- ✅ Offers layout patterns (Calendar Grid, Card Grid, Form Layout)
- ✅ Generates React component code following specs
- ✅ Exports design tokens (Tailwind config, CSS variables)
- ✅ Ensures consistency across projects

**Does NOT:**
- ❌ Explain **WHY** users need features (→ User Scenario Generator does this)
- ❌ Extract design from mockups (→ React Component Analyzer does this)
- ❌ Create user journeys or emotional context (→ User Scenario Generator does this)
- ❌ Analyze competitive inspiration (→ User Scenario Generator does this)

**Outputs:**
- Component specifications (exact measurements, colors, states)
- Layout pattern details (grid structures, spacing keys)
- React component code
- Design tokens (CSS variables, Tailwind config)
- Implementation guides

**Example Output:**
```typescript
// Button Component Specification
<Button 
  variant="primary"    // Background: #0066CC, Text: white
  size="md"           // Padding: 12px 24px, Font: 16px
  state="hover"       // Background: #0052A3
  borderRadius="6px"
/>

// Implementation
export const Button = ({ variant, size, children }) => {
  const variants = {
    primary: 'bg-primary hover:bg-primary-dark text-white',
    // ... exact Tailwind classes
  };
  // ... complete code
};
```

---

### React Component Analyzer (EXISTING)

**Does:**
- ✅ Analyzes design mockups/screenshots to extract visual specs
- ✅ Creates component inventory from images
- ✅ Documents component hierarchy and nesting
- ✅ Identifies colors, typography, spacing from designs
- ✅ Generates structured design specification documents
- ✅ Provides implementation guidance for extracted designs

**Does NOT:**
- ❌ Create user scenarios or journeys (→ User Scenario Generator does this)
- ❌ Apply 3 Whys methodology (→ User Scenario Generator does this)
- ❌ Provide standard design system specs (→ Frontend Design System does this)
- ❌ Generate emotional or contextual user insights (→ User Scenario Generator does this)

**Outputs:**
- Component inventory from mockup
- Visual specifications extracted from images
- Color palette, typography scale, spacing values (from design)
- Component hierarchy map
- Implementation recommendations

**Example Output:**
```markdown
## Extracted from Mockup

**Component Inventory:**
- Header (84px height)
  - Logo (32px)
  - Navigation (inline, 16px gap)
  - User Menu (circle avatar, 40px)

**Colors Detected:**
- Primary: #0066CC (used in 3 buttons)
- Background: #F9FAFB
- Text: #1F2937

**Typography:**
- Heading: 28px, weight 600
- Body: 16px, weight 400

**Recommendation:** 
Align with frontend-design-system where possible.
Primary color matches. Heading size is close to H2 (28px).
```

---

## Integration Workflows

### Workflow 1: From Inspiration to Implementation

**User provides article about multi-layer calendars**

```
1. User Scenario Generator
   Input: Article URL
   Output: 4 detailed user scenarios with 3 Whys analysis
   
   Example Scenario: "User wants to understand yesterday's fatigue"
   → Deep need: Correlate activity with state for recovery planning
   → UI Requirements: "Use Calendar Grid pattern, show intensity"

2. Frontend Design System
   Input: Scenario UI requirements
   Output: Exact Calendar Grid specifications + React code
   
   Example: Calendar Grid pattern (80px cells, md padding, event blocks)
   → Generates complete CalendarDay component with proper spacing

3. Developer Implementation
   Uses scenario context + design specs to build feature
```

**Clear Handoff Points:**
- Scenario Generator → **UI requirement descriptions** → Design System
- Design System → **Exact specifications & code** → Developer

---

### Workflow 2: From Mockup to Scenarios to Implementation

**User uploads Figma screenshot**

```
1. React Component Analyzer
   Input: Design mockup image
   Output: Component inventory, extracted visual specs
   
   Example: Extracts button (primary #0066CC, 16px padding)
            Extracts card grid (3 columns, 24px gap)

2. User Scenario Generator
   Input: Extracted components + user prompts
   Output: User scenarios explaining WHY each component exists
   
   Example: "User needs quick status view (3 Whys → stay motivated)"
            → Card grid shows progress at a glance
            → Primary button for logging completion

3. Frontend Design System
   Input: Component specs + scenario requirements
   Output: Standardized implementation with design system
   
   Example: Aligns extracted button to Button (variant: primary, size: md)
            Aligns extracted grid to Card Grid pattern
            Generates consistent React code

4. Developer Implementation
   Has complete picture: WHAT (analyzer) + WHY (scenarios) + HOW (design system)
```

**Clear Handoff Points:**
- Analyzer → **Extracted specs** → Scenario Generator
- Scenario Generator → **User context & requirements** → Design System
- Design System → **Standardized code** → Developer

---

### Workflow 3: From Concept to Full Feature

**User describes feature: "Habit tracking with streak visualization"**

```
1. User Scenario Generator
   Input: Feature description
   Output: Multiple user scenarios with deep needs
   
   Example Scenarios:
   - Morning check-in (3 Whys → maintain momentum)
   - Viewing streak (3 Whys → feel accomplished)
   - Breaking streak (3 Whys → reduce guilt, restart easily)

2. Frontend Design System
   Input: Scenario UI requirements
   Output: Component specifications & layout patterns
   
   Example: 
   - Card component (for each habit)
   - Badge component (for streak count)
   - Button component (for "Mark Complete")
   - Card Grid layout (for habit list)

3. Developer Implementation
   Builds feature with full understanding of user needs + consistent UI
```

**Clear Handoff Points:**
- Scenario Generator → **Scenario requirements** → Design System
- Design System → **Implementation specs** → Developer

---

## Anti-Patterns (What NOT to Do)

### ❌ Bad: Asking User Scenario Generator for Visual Specs

**Wrong:**
```
"User Scenario Generator, what color should the button be?"
"What's the padding for the card component?"
```

**Why Wrong:** These are implementation details, not user needs

**Right:**
```
→ Ask Frontend Design System: "What are button color specs?"
→ Output: "Primary button: #0066CC, hover: #0052A3"
```

---

### ❌ Bad: Asking Frontend Design System for User Motivation

**Wrong:**
```
"Frontend Design System, why does the user need this button?"
"What's the user's emotional state when clicking this?"
```

**Why Wrong:** Design system provides HOW, not WHY

**Right:**
```
→ Ask User Scenario Generator: "Why does the user need this feature?"
→ Output: "User wants to log habit quickly to maintain momentum (3 Whys analysis)"
```

---

### ❌ Bad: Asking React Component Analyzer to Create Scenarios

**Wrong:**
```
"Component Analyzer, create user scenarios from this mockup"
```

**Why Wrong:** Analyzer extracts WHAT's in design, not WHY users need it

**Right:**
```
→ Component Analyzer: "Extract components from this mockup"
   Output: Component inventory, visual specs
   
→ User Scenario Generator: "Create scenarios explaining why users need these components"
   Output: User journeys with 3 Whys analysis
```

---

### ❌ Bad: Mixing Concerns in Single Request

**Wrong:**
```
"Create user scenarios AND generate React code AND extract design from this mockup"
```

**Why Wrong:** Each skill has distinct purpose and output

**Right (Sequential):**
```
1. "Analyze this mockup" → React Component Analyzer
2. "Create user scenarios for these components" → User Scenario Generator  
3. "Implement these scenarios with design system" → Frontend Design System
```

---

## Skill Activation Priority

When user request is ambiguous, skills activate in this order:

### Priority 1: React Component Analyzer
**Trigger:** Image/mockup provided
**Example:** User uploads Figma file → Analyzer activates first

### Priority 2: User Scenario Generator
**Trigger:** Keywords like "user scenarios", "3 whys", "user perspective", or conceptual input (article, transcript)
**Example:** "Generate scenarios from this article" → Scenario Generator activates

### Priority 3: Frontend Design System
**Trigger:** Implementation request or component specs needed
**Example:** "Build a button component" → Design System activates

---

## When to Use Which Skill

### Use User Scenario Generator When:
- ✅ You have inspiration (article, concept, competitor app)
- ✅ You need to understand **WHY** users need features
- ✅ You want to apply 3 Whys methodology
- ✅ You need user journey maps with emotional context
- ✅ You want multiple perspectives on a single feature
- ✅ You're in the **discovery/planning** phase

### Use Frontend Design System When:
- ✅ You're ready to **implement** UI components
- ✅ You need exact spacing, colors, typography values
- ✅ You want consistent component specifications
- ✅ You need React code following best practices
- ✅ You want to export design tokens (Tailwind, CSS vars)
- ✅ You're in the **implementation** phase

### Use React Component Analyzer When:
- ✅ You have a **visual design** (mockup, screenshot, Figma)
- ✅ You need to extract specs from existing designs
- ✅ You want component inventory and hierarchy
- ✅ You need to align existing design with design system
- ✅ You're working with designers who provide mockups
- ✅ You're in the **design-to-code** phase

---

## Summary: The Three Skills Together

```
INPUT TYPE           SKILL                      OUTPUT
─────────────────────────────────────────────────────────────────
Article/Concept  →  User Scenario Generator  →  User journeys with 3 Whys
                                              →  Emotional context
                                              →  High-level UI requirements

Mockup/Design    →  React Component Analyzer →  Component inventory
                                              →  Extracted visual specs
                                              →  Hierarchy map

Implementation   →  Frontend Design System   →  Exact specifications
Need                                         →  React component code
                                              →  Design tokens
```

**The Perfect Storm:**
1. **Scenario Generator** tells you **WHY**
2. **Component Analyzer** tells you **WHAT** (from designs)
3. **Design System** tells you **HOW** (standardized implementation)

**Together:** Complete understanding from concept → implementation

---

**Last Updated:** November 16, 2025  
**Maintained By:** Orchestrator Core Team








