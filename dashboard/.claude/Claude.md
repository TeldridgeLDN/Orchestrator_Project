# Portfolio Redesign - Landing Page

**Project Type:** Personal Portfolio + Prospecting Landing Page  
**Status:** Active Development  
**Tech Stack:** React + Vite, shadcn/ui, Tailwind CSS, TypeScript, Lucide React  
**Design System:** Global `frontend_design_system` skill + project-specific context

---

## Project Overview

This is a comprehensive redesign of a personal portfolio with a strong focus on **prospecting** - attracting potential clients, collaborators, and opportunities. The landing page is structured around four strategic sections that guide visitors through a journey.

**Primary Goal:** Convert visitors into engaged prospects through compelling design, clear messaging, and strategic calls-to-action.

---

## Landing Page Structure

### Section 1: Discovery
**Purpose:** Capture attention, establish credibility  
**Content:** Hero section, value proposition, key differentiators  
**Icons:** Search, Target, Compass (discovery metaphors)

### Section 2: Build
**Purpose:** Showcase capabilities, demonstrate process  
**Content:** Services, methodology, case studies preview  
**Icons:** Hammer, Code, Layers (building metaphors)

### Section 3: Launch
**Purpose:** Highlight results, social proof  
**Content:** Portfolio highlights, testimonials, success metrics  
**Icons:** Rocket, TrendingUp, Award (success metaphors)

### Section 4: Grow
**Purpose:** Drive action, establish ongoing relationship  
**Content:** Call-to-action, contact form, newsletter signup  
**Icons:** GrowthChart, Users, MessageCircle (growth metaphors)

---

## Design Principles (Project-Specific)

### Color Palette

**Brand Colors:**
- Primary: `#0ea5e9` (Sky Blue) - Innovation, trust
- Secondary: `#6366f1` (Indigo) - Creativity, depth
- Accent: `#10b981` (Green) - Growth, success

**Semantic:**
- Success: `#22c55e`
- Warning: `#f59e0b`
- Error: `#ef4444`
- Info: `#3b82f6`

**Neutrals:**
- Background: `#ffffff` (light) / `#1f1f1f` (dark)
- Foreground: `#0f172a` (light) / `#f8fafc` (dark)
- Muted: `#64748b`

### Typography

**Fonts:**
- **Headings:** Plus Jakarta Sans (700, 800)
- **Body:** Inter (400, 500, 600)
- **Mono:** JetBrains Mono (for code)

**Hierarchy:**
- H1: `text-6xl font-bold` - Page hero
- H2: `text-4xl font-bold` - Section headings
- H3: `text-2xl font-semibold` - Card titles
- Body: `text-base` - Default content
- Small: `text-sm text-muted-foreground` - Supporting text

### Spacing

**Section Spacing:**
- Mobile: `py-12` (48px)
- Tablet: `py-16` (64px)
- Desktop: `py-24` (96px)

**Component Spacing:**
- Card padding: `p-6` (24px)
- Gap between items: `gap-4` (16px)
- Margin between sections: `space-y-8` (32px)

---

## Icon Strategy

### Selection Criteria

For this portfolio/prospecting site, icons must:
1. **Support messaging** - Reinforce the section's purpose
2. **Guide journey** - Create visual flow through sections
3. **Build trust** - Professional, consistent, recognizable
4. **Enhance hierarchy** - Draw attention to key areas

### Section-Specific Icons

**Discovery (Section 1):**
- Primary: `Search`, `Target`, `Compass`
- Supporting: `Sparkles`, `Eye`, `Lightbulb`

**Build (Section 2):**
- Primary: `Hammer`, `Code`, `Layers`
- Supporting: `Settings`, `Puzzle`, `Workflow`

**Launch (Section 3):**
- Primary: `Rocket`, `TrendingUp`, `Award`
- Supporting: `CheckCircle`, `Star`, `Trophy`

**Grow (Section 4):**
- Primary: `TrendingUp`, `Users`, `MessageCircle`
- Supporting: `Mail`, `Calendar`, `ArrowRight`

### Implementation Guidelines

**Size Standards:**
- Section icons (hero): `h-12 w-12` (48px)
- Card/feature icons: `h-8 w-8` (32px)
- Inline icons: `h-5 w-5` (20px)
- Button icons: `h-4 w-4` (16px)

**Color Usage:**
- Primary icons: `text-primary`
- Success states: `text-green-500`
- Muted/secondary: `text-muted-foreground`
- On colored backgrounds: `text-white` or `text-primary-foreground`

---

## Component Patterns

### Hero Section
```tsx
<section className="py-24 px-4">
  <div className="container mx-auto max-w-6xl">
    <div className="flex items-center gap-3 mb-6">
      <Target className="h-12 w-12 text-primary" />
      <h1 className="text-6xl font-bold">Discover</h1>
    </div>
    <p className="text-xl text-muted-foreground">
      Strategic copy that converts
    </p>
  </div>
</section>
```

### Feature Card
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-lg">
        <Code className="h-8 w-8 text-primary" />
      </div>
      <CardTitle>Feature Title</CardTitle>
    </div>
  </CardHeader>
  <CardContent>
    <CardDescription>
      Compelling description of the feature
    </CardDescription>
  </CardContent>
</Card>
```

### CTA Section
```tsx
<Card className="bg-gradient-to-r from-primary to-secondary text-white">
  <CardHeader>
    <CardTitle className="text-3xl">Ready to Get Started?</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="mb-6">Let's build something amazing together.</p>
    <Button size="lg" variant="secondary">
      Get in Touch
      <ArrowRight className="ml-2 h-5 w-5" />
    </Button>
  </CardContent>
</Card>
```

---

## Current Work Context

### Completed
- ✅ Basic project structure
- ✅ shadcn/ui setup
- ✅ Landing page sections scaffolding
- ✅ Initial component library

### In Progress
- 🔄 Icon implementation across sections
- 🔄 Design consistency validation
- 🔄 Responsive refinements

### Next Steps
- ⏱️ Finalize section icons
- ⏱️ Add micro-interactions
- ⏱️ Performance optimization
- ⏱️ Accessibility audit

---

## Key Design Decisions

### Why shadcn/ui?
- Full control over components (copy, not install)
- Built on Radix UI (accessibility-first)
- Tailwind integration (consistent styling)
- Easy customization

### Why Lucide React?
- Clean, consistent icon set
- Tree-shakeable (performance)
- Actively maintained
- Perfect for shadcn/ui projects

### Mobile-First Approach
- Primary audience likely on mobile
- Ensures core experience is solid
- Progressive enhancement for larger screens

---

## Resources

**Related Files:**
- `landing-page-sections.json` - Section structure data
- `landing-page-sections.md` - Section planning doc

**Global Skill:**
- `frontend_design_system` - Auto-loaded for design work
  - design-principles.md
  - shadcn-ui-patterns.md
  - icon-guidelines.md

**External:**
- [shadcn/ui docs](https://ui.shadcn.com)
- [Lucide icons](https://lucide.dev)
- [Tailwind CSS](https://tailwindcss.com)

---

## Working with This Project

### Start Work
1. Open any `.tsx` file in `dashboard/` or `src/`
2. Mention design-related keywords → `frontend_design_system` auto-activates
3. Reference global skill resources as needed

### Request Design Guidance
- "Show me design principles" → Loads design-principles.md
- "Show me shadcn/ui patterns" → Loads shadcn-ui-patterns.md
- "Show me icon guidelines" → Loads icon-guidelines.md

### Get Plugin Support
- Install Claude Code `frontend-design` plugin for aesthetic guidance
- Combines with technical patterns from the skill

---

**Last Updated:** 2025-11-13  
**Maintained By:** Tom Eldridge  
**diet103 Version:** 1.2.0

