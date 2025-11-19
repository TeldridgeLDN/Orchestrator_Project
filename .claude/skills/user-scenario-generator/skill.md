# User Scenario Generator Skill

**Version:** 1.0.0  
**Scope:** Product design, UX research, frontend planning  
**Auto-Activation:** Design analysis, user research, scenario creation  
**Priority:** High  
**Token Footprint:** ~400 tokens (overview only)

---

## Purpose

Transform design inspiration (images, articles, videos, transcripts) into **actionable user scenarios** from the user's perspective. Each scenario dives deep into user intent using the **3 Whys approach** and provides sufficient context for the **Frontend Design System skill** to generate React components, layouts, and design patterns.

**Key Benefits:**
- Convert inspiration into implementable scenarios
- Understand the **why** behind user actions (3 Whys technique)
- Create detailed interaction flows with emotional context
- Generate frontend-ready specifications for handoff
- Bridge the gap between concept and implementation

**Handoff Target:**
- `frontend-design-system` skill for component/layout generation
- `react-component-analyzer` skill for design extraction
- `taskmaster` for implementation planning

---

## When This Skill Activates

### Trigger Phrases
- "generate user scenarios"
- "analyze from user perspective"
- "create scenarios from"
- "user journey for"
- "3 whys analysis"
- "user intent analysis"
- "scenario generation"
- "convert to user scenarios"

### Input Types Supported
1. **URLs/Articles** - Blog posts, design articles, case studies
2. **Images** - Design mockups, sketches, screenshots
3. **Text** - Product descriptions, feature specs, PRDs
4. **Video Transcripts** - User interviews, product demos
5. **Existing Designs** - Competitor analysis, inspiration

### Context Requirements
- Clear source material provided
- Target platform specified (web, mobile, desktop)
- Basic user context (who is the user?)

---

## Core Methodology: The 3 Whys Approach

For each user action, we drill down three levels to understand the **real user need**:

### Example: Calendar Scenario

**Level 1: Surface Action**
> "As a user I want to look at a calendar to see what I did yesterday"

**Why #1?** → "Because I'm feeling tired today"

**Why #2?** → "Because I can see in my calendar an event where I went on a long run"

**Why #3?** → "Because I want to plan my day today to account for being tired"

**Deep User Need:** 
> User needs to **correlate past activities with current physical/mental state** to make informed decisions about today's schedule.

---

## Scenario Output Format

Each generated scenario includes:

### 1. User Goal Statement
```markdown
**User Goal:** [Outcome the user wants to achieve]
**Context:** [Where, when, what device, emotional state]
**Deep Need:** [The "Why #3" - fundamental motivation]
```

### 2. The 3 Whys Analysis
```markdown
**Surface Action:** [What the user says they want]
├─ Why #1: [First layer - immediate reason]
│  └─ Why #2: [Second layer - underlying reason]
│     └─ Why #3: [Core need - fundamental motivation]

**Insight:** [What this tells us about the user's true need]
```

### 3. User Journey Flow
```markdown
**Starting Point:** [User's initial state and location]
**Steps:**
1. [Action] → [UI Response] → [User Feeling/Thought]
2. [Action] → [UI Response] → [User Feeling/Thought]
3. [Continue...]

**Success State:** [What success looks like for the user]
**Friction Points:** [Potential obstacles or confusion]
```

### 4. Interaction Details
```markdown
**Device:** [Phone/Tablet/Desktop]
**Time/Context:** [Morning at home / Commuting / At work / etc.]
**Emotional State:** [Curious / Frustrated / Rushed / Relaxed / etc.]
**User Expectations:** [What the user expects to happen]
```

### 5. UI Requirements (Frontend Handoff)
```markdown
**Visual Elements Needed:**
- [Component/Pattern from design system]
- [Data to display and format]
- [Interactive elements]

**Layout Pattern:** [Reference to frontend-design-system pattern]
**Navigation:** [How user moves between views]
**Feedback:** [Visual/haptic responses needed]
**States:** [Loading, empty, error, success states]
```

---

## Usage Examples

### Example 1: Analyzing Multi-Layer Calendar Article

**Input:**
```
"Generate user scenarios from this article: 
https://julian.digital/2023/07/06/multi-layered-calendars/"
```

**Claude Response:**

#### Scenario 1: Understanding Yesterday's Fatigue

**User Goal:** Identify why I feel tired today by reviewing yesterday's activities  
**Context:** Morning at home, on phone, feeling physically drained  
**Deep Need:** Make informed decisions about today's energy allocation based on past activity patterns

**The 3 Whys:**
```
Surface Action: "I want to see what I did yesterday"
├─ Why #1: "I'm feeling tired today"
│  └─ Why #2: "I went on a long run yesterday (visible in calendar)"
│     └─ Why #3: "I want to adjust today's schedule to recover properly"

Insight: User needs activity→effect correlation to optimize future planning
```

**User Journey:**
```
1. Opens app (morning, home)
   → App shows TODAY by default
   → User sees today is empty, feels confused (expected to see yesterday)
   
2. Swipes/taps to navigate to YESTERDAY
   → Calendar transitions smoothly
   → User sees: "Long Run - 10am-12pm" with high intensity indicator
   
3. Notices duration and intensity
   → User thinks: "Ah, that explains the fatigue"
   → Feels relieved to have found the cause
   
4. Returns to TODAY view
   → User plans: "I'll schedule lighter activities today"
   → Success: User feels in control of their day

Success State: User correlates past activity with current state and adjusts plans
Friction Points: 
- Default "today" view may hide relevant past context
- Need easy backward navigation
- Intensity/duration should be visually prominent
```

**UI Requirements (Frontend Handoff):**
```
Visual Elements:
- Day view with time-blocked events (Calendar Grid pattern)
- Event blocks showing: title, time range, intensity indicator
- Smooth swipe/navigation between days
- "Today" vs "Past days" visual distinction
- Intensity visualization (color, thickness, or badge)

Layout Pattern: Calendar Grid (from frontend-design-system)
- Cells: 80px height minimum
- Padding: md (16px)
- Border: 1px Gray 200
- Current day: Primary background (#0066CC)
- Past days: Muted (Gray 100 background)
- Event blocks: Rounded (6px), with left border for intensity

Navigation:
- Swipe left/right for prev/next day
- Header shows current date with < > navigation
- Quick "Today" button to reset

Feedback:
- Smooth transition animation (200ms ease)
- Haptic feedback on date change (mobile)
- Loading skeleton for event data

States:
- Loading: Skeleton event blocks
- Empty: "No events this day" message
- Past day: Muted colors, intensity indicators visible
- Today: Highlighted, current time indicator
```

---

### Example 2: Dashboard from Image

**Input:**
```
[User uploads fitness dashboard mockup]
"Create user scenarios from this dashboard design"
```

**Output:** Multiple scenarios covering:
- Scenario 1: Quick morning check-in (3 Whys → stay motivated)
- Scenario 2: Post-workout logging (3 Whys → track progress)
- Scenario 3: Planning next workout (3 Whys → avoid overtraining)

Each with full journey, emotional context, and frontend specs.

---

### Example 3: Feature Description to Scenarios

**Input:**
```
"Generate scenarios for a habit tracking feature where users 
can mark daily habits as complete"
```

**Output:** 
- Scenario 1: Morning routine check-in
- Scenario 2: Viewing habit streaks for motivation
- Scenario 3: Breaking/resuming a habit
- Scenario 4: Sharing progress with accountability partner

---

## Integration with Frontend Design System

### Automatic Handoff Workflow

When a scenario is generated, it includes **direct references** to frontend design system components:

**Example Handoff:**
```markdown
## Frontend Implementation (Ready for frontend-design-system skill)

**Components Needed:**
- Button (variant: primary, size: md) - for "Log Habit" action
- Card Grid - for displaying multiple habits
- Badge (variant: success) - for streak indicator
- Calendar Grid Pattern - for habit history view

**Layout:** 
→ Use "Card Grid" pattern from layout-patterns.md
→ Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns
→ Gap: md (16px)

**Interactions:**
→ Tap habit card → Toggle complete state
→ Visual feedback: Card background changes (Gray 50 → Success 50)
→ Haptic feedback on mobile
→ Confetti animation on streak milestone

**Request for Frontend Skill:**
"Using the design system, create a HabitCard component following Card specs 
with an integrated Badge for streak count and Button for toggle action"
```

### Chaining Skills

**Workflow:**
1. **user-scenario-generator** → Creates detailed scenarios
2. **frontend-design-system** → Generates components following specs
3. **react-component-analyzer** → (Optional) Validates against existing designs
4. **taskmaster** → Creates implementation tasks

**Example Command:**
```bash
# Generate scenarios
"Generate user scenarios from [source]"

# Automatically hands off to frontend skill
"Now implement Scenario 1 using the design system"

# Creates tasks
task-master add-task --prompt="Implement habit tracking scenarios 1-3"
```

---

## Scenario Generation Process

### Step 1: Input Analysis
```markdown
1. Examine source material (article, image, text, transcript)
2. Identify core features or interactions
3. Extract user goals (explicit and implicit)
4. Note contextual details (platform, use case, constraints)
```

### Step 2: User Perspective Shift
```markdown
1. Frame from user's POV: "As a user I want..."
2. Identify the OUTCOME the user seeks (not the feature)
3. Consider emotional state and context
4. Think about what happens BEFORE and AFTER the interaction
```

### Step 3: Apply 3 Whys
```markdown
For each user goal:
1. Surface action: What user says they want
2. Why #1: Immediate, surface-level reason
3. Why #2: Underlying motivation
4. Why #3: Core need/fundamental driver

Document insights from each level
```

### Step 4: Map Journey
```markdown
1. Define starting state (where, when, how user arrives)
2. Sequence of actions and UI responses
3. User thoughts/feelings at each step
4. Success criteria (what satisfies the need?)
5. Friction points (where might user struggle?)
```

### Step 5: Extract UI Requirements
```markdown
1. List visual elements needed
2. Reference design system components
3. Specify interactions and feedback
4. Define states (loading, error, success, empty)
5. Note responsive considerations
6. Call out accessibility requirements
```

### Step 6: Format for Handoff
```markdown
Ensure scenario includes:
✅ Clear user goal and context
✅ Complete 3 Whys analysis
✅ Detailed journey with emotional notes
✅ Frontend-ready component specifications
✅ References to design system patterns
✅ Implementation guidance for developers
```

---

## Output Templates

### Template 1: Basic Scenario

```markdown
## Scenario [N]: [Descriptive Title]

**User Goal:** [Outcome user wants]  
**Context:** [Device, location, time, emotional state]  
**Deep Need:** [Why #3 result]

### The 3 Whys
**Surface:** [What user says]
├─ Why #1: [Immediate reason]
│  └─ Why #2: [Underlying reason]
│     └─ Why #3: [Core need]

**Insight:** [Key learning]

### User Journey
**Starting Point:** [Where user begins]

1. [Action] → [UI Response] → [User Reaction]
2. [Action] → [UI Response] → [User Reaction]
3. [Continue...]

**Success State:** [What satisfies the user]  
**Friction Points:** [Potential obstacles]

### UI Requirements (Frontend Handoff)
**Components:**
- [Component] (variant/size) - [purpose]
- [Component] (variant/size) - [purpose]

**Layout:** [Design system pattern reference]  
**Interactions:** [User actions and feedback]  
**States:** [Loading, error, empty, success]

**Ready for:** `frontend-design-system` skill
```

### Template 2: Comparative Scenarios

```markdown
## Multi-Scenario Analysis: [Feature Name]

### Scenario Matrix

| Scenario | User Goal | Core Need (Why #3) | Primary UI Pattern |
|----------|-----------|-------------------|-------------------|
| 1. Morning Check | Quick status view | Stay motivated | Dashboard Card Grid |
| 2. Post-Activity | Log completion | Track progress | Form + Button |
| 3. Review History | See trends | Validate effort | Calendar Grid + Chart |

[Full details for each scenario follow...]
```

### Template 3: Mobile-First Scenario

```markdown
## Scenario [N]: [Title] (Mobile-First)

**Device:** Mobile phone (iOS/Android)  
**User Goal:** [Goal]  
**Context:** [Specific mobile context - commuting, walking, one-handed, etc.]

### Mobile-Specific Considerations
- **Thumb Zone:** [Which UI elements must be easily reachable?]
- **One-Handed Use:** [Can user complete with one hand?]
- **Interruptions:** [How to handle app backgrounding?]
- **Connection:** [Offline support needed?]

[Standard scenario sections follow...]

### Mobile UI Requirements
**Touch Targets:** Minimum 44x44px  
**Gesture Support:** [Swipe, long-press, pull-to-refresh]  
**Haptic Feedback:** [When to vibrate]  
**Responsive:** Mobile-first, progressive enhancement

**Ready for:** `frontend-design-system` skill (mobile components)
```

---

## Best Practices

### DO:
✅ **Start with the user outcome, not the feature**
```
Good: "User wants to feel confident about their progress"
Bad: "User wants to see a chart"
```

✅ **Apply 3 Whys rigorously**
```
Don't stop at Why #1. The deepest insight is at Why #3.
```

✅ **Include emotional context**
```
"User feels anxious about missing workouts" → Informs UI tone
```

✅ **Reference design system explicitly**
```
"Use Button (variant: primary, size: md)" not just "Use a button"
```

✅ **Consider multiple user types**
```
New user vs Returning user scenarios may differ significantly
```

✅ **Document friction points**
```
Anticipate where users might get confused or frustrated
```

### DON'T:
❌ **Skip the 3 Whys**
```
Surface understanding leads to shallow features
```

❌ **Ignore user context**
```
"User checks calendar" - WHERE? WHEN? WHY? FEELING WHAT?
```

❌ **Create feature lists instead of scenarios**
```
Bad: "User clicks button, form appears, user submits"
Good: "User anxiously wants to log a win, taps quickly, sees immediate confirmation with encouraging message, feels validated"
```

❌ **Forget about edge cases**
```
What if data doesn't load? User has no history? Internet drops?
```

❌ **Use vague UI descriptions**
```
Bad: "Show a screen with the data"
Good: "Display Calendar Grid pattern (80px cells, md padding) with event blocks showing time and intensity indicator"
```

---

## Advanced Techniques

### Technique 1: Persona-Based Scenarios

Generate different scenarios for different user personas:

```markdown
**Persona A: Busy Professional**
- Context: Morning commute, quick check on phone
- Need: Fast, glanceable information
- UI Priority: Dashboard with key metrics, minimal interaction

**Persona B: Fitness Enthusiast**
- Context: Post-workout, wants to log details
- Need: Comprehensive tracking with satisfaction
- UI Priority: Detailed form, progress visualization, social sharing

[Full scenarios for each persona...]
```

### Technique 2: Error State Scenarios

Don't forget unhappy paths:

```markdown
**Scenario: Data Sync Failure**
User Goal: View today's schedule
└─ Why #1: Plan my morning
   └─ Why #2: Reduce decision fatigue
      └─ Why #3: Start day feeling organized

**Journey (with error):**
1. Opens app → Loading spinner → 3 seconds pass
2. Error message appears: "Can't load events"
3. User feels frustrated, worried calendar is broken
4. [Recovery path needed]

**UI Requirements:**
- Retry button (Button: secondary, md)
- Clear error message (not technical)
- Show cached/offline data if available
- Indicate data staleness with timestamp
```

### Technique 3: Cross-Device Scenarios

```markdown
**Scenario: Start on Mobile, Finish on Desktop**

**Part 1: Mobile (10am, commuting)**
User quickly logs workout → App saves draft

**Part 2: Desktop (8pm, at home)**  
User opens app → Sees "Continue draft" prompt → Adds detailed notes

**Sync Requirements:**
- Real-time sync between devices
- Draft state persistence
- Conflict resolution if edited on both
- "Last edited on [device]" indicator
```

---

## Troubleshooting

### "Scenarios feel generic, not user-focused"
**Solution:**
- Add more specific context (time, place, emotion)
- Push deeper on the 3 Whys
- Include user's internal monologue
- Think about what happens before/after the interaction

### "Frontend team says scenarios lack implementation detail"
**Solution:**
- Reference specific design system components
- Include exact measurements and spacing
- Specify states (loading, error, empty, success)
- Add responsive breakpoint requirements
- Link to layout patterns by name

### "Too many scenarios, team is overwhelmed"
**Solution:**
- Prioritize scenarios by user impact
- Start with "MVP scenario" - core happy path
- Group related scenarios (e.g., all "morning routine" scenarios)
- Use scenario matrix for high-level view

### "3 Whys analysis feels forced or repetitive"
**Solution:**
- Ensure each "Why" reveals something new
- If stuck at Why #2, rethink the user goal
- Interview real users if possible
- Check if you're asking "Why this way?" vs "Why at all?"

---

## Integration Examples

### With Taskmaster

```bash
# After generating scenarios, create implementation tasks

task-master add-task \
  --prompt="Implement Calendar Grid for Scenario 1: Understanding Yesterday's Fatigue" \
  --dependencies="setup-design-system" \
  --priority="high"

# Or expand an existing task based on scenarios
task-master expand --id=15 --prompt="Use generated user scenarios 1-3 as subtasks"
```

### With Frontend Design System

```bash
# Direct handoff after scenario generation
User: "Generate scenarios from this calendar article"
Claude: [Generates 4 detailed scenarios]

User: "Now implement Scenario 1 using the design system"
Claude: [Loads frontend-design-system skill]
        [Generates Calendar Grid component following specs]
        [References scenario requirements throughout]
```

### With React Component Analyzer

```bash
# Analyze existing design, then fill gaps with scenarios
User: [Uploads Figma screenshot]
User: "Analyze this design and create user scenarios for missing interactions"

Claude: [Uses react-component-analyzer to extract visual specs]
        [Uses user-scenario-generator for interaction flows]
        [Combines both for complete implementation guide]
```

---

## Example: Complete Calendar Scenario Set

### Source Material
**Article:** [Multi-Layer Calendars by Julian Lehr](https://julian.digital/2023/07/06/multi-layered-calendars/)

### Generated Scenarios (Summary)

#### Scenario 1: Understanding Yesterday's Fatigue
- **Core Need:** Correlate past activities with current state
- **UI Pattern:** Day view with past/present distinction
- **Key Insight:** Default "today" view may hide relevant context

#### Scenario 2: Planning Tomorrow Around Energy Levels
- **Core Need:** Avoid overcommitment based on energy forecast
- **UI Pattern:** Multi-day view with intensity forecast
- **Key Insight:** Future planning requires past pattern analysis

#### Scenario 3: Finding Time for a New Commitment
- **Core Need:** See true availability considering energy, not just time
- **UI Pattern:** Calendar with "cognitive load" visualization
- **Key Insight:** Empty time ≠ available capacity

#### Scenario 4: Reviewing Weekly Patterns
- **Core Need:** Optimize recurring schedule based on outcomes
- **UI Pattern:** Week view with outcome indicators
- **Key Insight:** "What happened" matters more than "what was scheduled"

[Each scenario includes full 3 Whys, journey, and frontend handoff specs]

---

## Resources

### External Reading
- [Multi-Layer Calendars - Julian Lehr](https://julian.digital/2023/07/06/multi-layered-calendars/)
- Jobs To Be Done framework
- User Story Mapping (Jeff Patton)
- Hooked (Nir Eyal) - Trigger, Action, Reward

### Related Skills
- `frontend-design-system` - Implementation target for generated scenarios
- `react-component-analyzer` - Analyze existing designs
- `scenario_manager` - Scenario scaffolding and management

---

## Quick Commands

```bash
# Generate from URL
"Generate user scenarios from https://example.com/article"

# Generate from image
[Upload image] "Create user scenarios from this mockup"

# Generate for feature description
"Generate scenarios for [feature description]"

# Apply 3 Whys to existing feature
"Apply 3 Whys analysis to our habit tracking feature"

# Handoff to frontend
"Implement Scenario 2 using the design system"

# Create tasks from scenarios
"Create Taskmaster tasks for all generated scenarios"
```

---

**Auto-Activation Priority:** High  
**Progressive Disclosure:** Enabled  
**Token Footprint:** 400 tokens (overview)  
**Handoff Skills:** `frontend-design-system`, `react-component-analyzer`, `taskmaster`

---

**Last Updated:** November 16, 2025  
**Skill Maturity:** v1.0 (Initial Release)

**Navigation:** [Examples](resources/examples.md) | [Templates](resources/templates.md) | [3 Whys Guide](resources/3-whys-guide.md)









