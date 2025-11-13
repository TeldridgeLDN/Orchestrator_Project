# Prospecting Landing Page - Section Mapping & Icon Strategy

**Project:** Portfolio Redesign - Prospecting Landing Page  
**Date:** November 13, 2025  
**Purpose:** Comprehensive mapping of landing page sections with appropriate shadcn/ui icons

---

## Section Overview

This document maps each section of the prospecting landing page to appropriate Lucide React icons (shadcn/ui's default icon library). The mapping ensures visual consistency, intuitive representation, and optimal user experience.

---

## 1. Hero Section

**Location:** Above the fold (first viewport)

**Content:**
- **Headline:** "Get Your Pre-Launch Landing Page Checklist"
- **Subheadline:** "The 5-step framework 500+ founders used to validate their ideas"
- **Email Form:** Single input field
- **CTA Button:** "Download Free Checklist →"

**Icon Recommendations:**
- **Primary Icon:** `FileText` or `ClipboardCheck`
  - Represents checklist/document
  - Size: Large (h-12 w-12 or h-16 w-16)
  - Placement: Above or beside headline
  - Color: Accent color matching brand
- **Arrow Icon:** `ArrowRight` or `Download`
  - For CTA button
  - Size: Small (h-4 w-4)
  - Placement: Inside button, after text

**Visual Purpose:** Immediately communicate "checklist" value proposition

---

## 2. Discovery/Process Section

**Location:** First content section below hero

**Content:**
- **Title:** "Discovery"
- **Description:** "We kick off with a focused session to understand your idea, target audience, and key assumptions to test"
- **Purpose:** Explain the validation consultation process

**Icon Recommendations:**
- **Primary Icon:** `Compass` (Top Choice)
  - Represents exploration, discovery, finding direction
  - Conveys: guidance, navigation, exploration
- **Alternative Icons:**
  - `Search` - Finding insights
  - `Lightbulb` - Ideation and understanding
  - `Target` - Focused approach
  - `Telescope` - Looking ahead, discovery
- **Size:** Medium to Large (h-8 w-8 to h-10 w-10)
- **Placement:** Above section title or inline with title
- **Style:** Primary brand color or gradient

**Visual Purpose:** Convey exploration, understanding, and guidance

---

## 3. Trust Indicators Section

**Location:** Just below hero or floating badges above fold

**Content:**
- "✓ Used by 100+ founders"
- "✓ No credit card required"
- "✓ Instant download"

**Icon Recommendations:**

### Trust Badge 1: "Used by 100+ founders"
- **Icon:** `Users` or `UserCheck`
- **Purpose:** Social proof, community

### Trust Badge 2: "No credit card required"
- **Icon:** `ShieldCheck` or `Lock` (with check overlay)
- **Purpose:** Security, no-risk

### Trust Badge 3: "Instant download"
- **Icon:** `Zap` or `Download`
- **Purpose:** Speed, immediate access

**Sizing:** Small to Medium (h-5 w-5 to h-6 w-6)  
**Color:** Success green or muted brand color  
**Layout:** Inline with text, left-aligned

**Visual Purpose:** Reduce friction, build trust, emphasize zero-risk

---

## 4. Benefits/Features Section

**Location:** Mid-page content section

**Content:**
- **Title:** "What's Inside the Checklist"
- **Feature 1:** 5 must-have elements
- **Feature 2:** 10 common mistakes to avoid
- **Feature 3:** Actionable implementation steps

**Icon Recommendations:**

### Feature 1: "5 must-have elements"
- **Icon:** `ListChecks` or `CheckSquare`
- **Purpose:** Essential checklist items

### Feature 2: "10 common mistakes to avoid"
- **Icon:** `AlertTriangle` or `XCircle`
- **Purpose:** Warning, prevention

### Feature 3: "Actionable implementation steps"
- **Icon:** `Rocket` or `TrendingUp`
- **Purpose:** Action, progress, growth

**Sizing:** Medium (h-8 w-8)  
**Style:** Outlined or duotone for visual interest  
**Color:** Varies by feature (success, warning, primary)

**Visual Purpose:** Differentiate value propositions, create scannable content

---

## 5. Social Proof/Testimonials Section

**Location:** Mid to lower page

**Content:**
- User testimonials
- Metrics: "Trusted by 200+ remote teams"
- Star ratings or success metrics

**Icon Recommendations:**
- **Primary Icon:** `Quote` or `MessageSquare`
  - For testimonial cards
  - Size: Medium (h-6 w-6)
- **Rating Icon:** `Star` (filled or half-filled)
  - For ratings display
  - Size: Small (h-4 w-4)
- **Metric Icon:** `TrendingUp` or `Award`
  - For success metrics
  - Size: Medium (h-6 w-6)

**Visual Purpose:** Third-party validation, credibility

---

## 6. About/Credibility Section

**Location:** Lower page, before final CTA

**Content:**
- **Stat:** "I've reviewed 500+ landing pages"
- **Expertise:** Case studies, before/after mentions
- **Authority:** Professional background

**Icon Recommendations:**
- **Primary Icon:** `Award` or `Badge`
  - Represents expertise, certification
- **Alternative Icons:**
  - `BarChart` - For metrics/analytics
  - `Eye` - For reviews/evaluation
  - `Briefcase` - For professional experience
- **Size:** Large (h-10 w-10 to h-12 w-12)
- **Style:** Prominent, accent color

**Visual Purpose:** Establish authority and credibility

---

## 7. Final CTA Section

**Location:** Bottom of page

**Content:**
- **Headline:** "Ready to Validate Your Idea?"
- **CTA Button:** "Get Your Free Checklist"
- **Supporting Text:** "Join 100+ founders who validated their ideas"

**Icon Recommendations:**
- **Primary Icon:** `ArrowRight` or `ChevronRight`
  - Inside CTA button
  - Size: Small (h-4 w-4)
- **Secondary Icon:** `Mail` or `Send`
  - Near email form
  - Size: Small to Medium (h-5 w-5)

**Visual Purpose:** Direct user action, create urgency

---

## Additional Utility Icons

### Navigation/UI Elements
- **Scroll Indicator:** `ChevronDown` (h-6 w-6)
- **Close Button:** `X` (h-5 w-5)
- **Menu:** `Menu` (h-6 w-6)
- **External Link:** `ExternalLink` (h-4 w-4)

### Interactive States
- **Loading:** `Loader2` with spin animation
- **Success:** `CheckCircle2`
- **Error:** `AlertCircle`

---

## Icon System Guidelines

### Sizing Scale
- **Extra Small:** `h-3 w-3` - Inline text icons
- **Small:** `h-4 w-4` or `h-5 w-5` - Button icons, small badges
- **Medium:** `h-6 w-6` or `h-8 w-8` - Section icons, feature icons
- **Large:** `h-10 w-10` or `h-12 w-12` - Hero icons, major section headers
- **Extra Large:** `h-16 w-16` - Rare, only for hero emphasis

### Color Palette
- **Primary:** Brand color (e.g., purple `#667eea`)
- **Success:** Green `#10b981`
- **Warning:** Yellow/Orange `#f59e0b`
- **Error:** Red `#ef4444`
- **Neutral:** Gray `#6b7280`
- **Accent:** Secondary brand color `#764ba2`

### Accessibility Requirements
- All icons must have `aria-label` attributes
- Add `role="img"` for decorative icons
- Use `aria-hidden="true"` for purely decorative elements
- Ensure sufficient color contrast (WCAG AA minimum)

### Animation Guidelines
- **Hover:** Subtle scale (`hover:scale-110`) or color change
- **Transition:** `transition-all duration-200 ease-in-out`
- **Loading:** Rotate animation for spinners
- **Entry:** Fade-in or slide-in on viewport entry (optional)

---

## Implementation Notes

### Technical Stack
- **Icon Library:** Lucide React (default for shadcn/ui)
- **Installation:** `npm install lucide-react@latest`
- **Framework:** React with TypeScript (assumed)
- **Styling:** Tailwind CSS

### Component Structure
```typescript
// Reusable Icon component (to be created in Task 3)
<Icon 
  icon={Compass} 
  size="lg" 
  label="Discovery process icon" 
  className="text-primary"
/>
```

### Responsive Considerations
- Scale icons down on mobile (e.g., `h-8 w-8` → `h-6 w-6`)
- Hide decorative icons on very small screens if needed
- Maintain aspect ratios across all breakpoints

---

## Summary Table

| Section | Primary Icon | Alternative Icons | Size | Purpose |
|---------|--------------|-------------------|------|---------|
| Hero | `FileText`, `ClipboardCheck` | `CheckSquare` | Large | Checklist representation |
| Discovery | `Compass` | `Search`, `Lightbulb`, `Target` | Medium-Large | Exploration, understanding |
| Trust Badge 1 | `Users` | `UserCheck` | Small-Medium | Social proof |
| Trust Badge 2 | `ShieldCheck` | `Lock` | Small-Medium | Security, no-risk |
| Trust Badge 3 | `Zap` | `Download` | Small-Medium | Speed, instant access |
| Feature 1 | `ListChecks` | `CheckSquare` | Medium | Essential items |
| Feature 2 | `AlertTriangle` | `XCircle` | Medium | Warning, mistakes |
| Feature 3 | `Rocket` | `TrendingUp` | Medium | Action, implementation |
| Testimonials | `Quote` | `MessageSquare` | Medium | Social proof |
| Ratings | `Star` | - | Small | Rating display |
| Credibility | `Award` | `Badge`, `BarChart` | Large | Expertise |
| Final CTA | `ArrowRight` | `ChevronRight`, `Send` | Small | Action direction |

---

## Design Principles Applied

### Monzo Design Principles
1. **Straightforward Kindness:** Icons are intuitive, not clever or obscure
2. **Simplicity:** Limited icon set, consistent sizing
3. **Clarity:** Icons support text, don't replace it
4. **Accessibility:** Proper ARIA labels, color contrast

### Conversion Optimization
- Icons draw eye to key conversion points (CTAs, trust badges)
- Visual hierarchy guides user through page flow
- Consistent style reduces cognitive load
- Icons reinforce messaging without distraction

---

## Next Steps

1. ✅ **Task 1.1:** Sections identified and documented *(Complete)*
2. 🔄 **Task 1.2:** Structured mapping created *(In Progress)*
3. ⏳ **Task 1.3:** Stakeholder validation needed
4. ⏳ **Task 2:** Install shadcn/ui icon library
5. ⏳ **Task 3:** Create reusable Icon component
6. ⏳ **Task 4:** Finalize icon selections with stakeholders
7. ⏳ **Task 5:** Implement icons on landing page

---

**Document Status:** Draft - Awaiting Stakeholder Review  
**Last Updated:** 2025-11-13  
**Author:** AI Assistant (Claude)  
**Related Files:** 
- `REDDIT_PROSPECTING_STRATEGY.md`
- `PORTFOLIO_REDESIGN_MARKETING_PLAN.md`

