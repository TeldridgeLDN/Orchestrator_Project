# Skill User Guide: Progressive Disclosure System

**Audience:** End users working with structured skills  
**Prerequisites:** None - this is a user-friendly introduction

---

## What is Progressive Disclosure?

Progressive disclosure is a design pattern where information is revealed in layers, from simple to complex, letting you access only what you need when you need it.

**Think of it like a cookbook:**
- **Cover:** Quick overview (what's inside)
- **Recipe title:** What you'll make
- **Quick version:** Basic steps
- **Detailed version:** Full instructions with tips
- **Troubleshooting:** What if it goes wrong

You don't need to read everything to make a simple dish!

---

## How Skills are Organized

Skills following this pattern have a consistent structure:

### SKILL.md (Main Entry Point)
**What:** Overview, quick start, navigation  
**When to read:** Always - this is your starting point  
**Size:** Small (~300 lines)

**Contains:**
- What the skill does
- Quick start examples (3-5 most common tasks)
- Links to detailed resources
- Metadata (version, dependencies)

---

### resources/ (Detailed Information)
**What:** In-depth guides for specific needs  
**When to read:** When you need more detail  
**Size:** Focused (<500 lines per file)

**Typical Resources:**

#### quick-ref.md
- **Purpose:** Quick syntax lookup
- **Best for:** Experienced users who know what they want
- **Size:** Very small (<100 lines)
- **Format:** Tables, lists, dense information

#### setup-guide.md
- **Purpose:** Installation and configuration
- **Best for:** First-time setup
- **Format:** Step-by-step instructions

#### api-reference.md
- **Purpose:** Technical details
- **Best for:** Developers needing precise specs
- **Format:** Function signatures, parameters, returns

#### troubleshooting.md
- **Purpose:** Problem solving
- **Best for:** When something isn't working
- **Format:** Problem-solution pairs, FAQs

---

## How to Use Structured Skills

### Step 1: Always Start with SKILL.md

When you encounter a new skill, read SKILL.md first:

```bash
# If skill is in your system
cat ~/.claude/skills/my-skill/SKILL.md
```

**Look for:**
1. **Overview** - What does this skill do?
2. **Quick Start** - Can I accomplish my task with just this?
3. **Available Resources** - What detailed docs exist?

---

### Step 2: Try the Quick Start First

Most skills include 3-5 common tasks in the Quick Start section.

**Example:**
```markdown
## Quick Start

### Most Common Tasks

#### 1. List Items
\`\`\`bash
my-skill list
\`\`\`

#### 2. Create New Item
\`\`\`bash
my-skill create --name "my-item"
\`\`\`
```

**Try these examples first!** They solve 80% of use cases.

---

### Step 3: Request Specific Resources When Needed

If Quick Start doesn't cover your need, request a specific resource.

**Natural Language:**
```
"Show me the quick reference for my-skill"
"I need the setup guide for my-skill"
"Load the troubleshooting guide"
```

**Direct Access:**
```bash
cat ~/.claude/skills/my-skill/resources/quick-ref.md
cat ~/.claude/skills/my-skill/resources/setup-guide.md
```

---

## Benefits of This Approach

### For You (The User)

**1. Faster Learning**
- Start with overview (2 min read)
- Try quick examples immediately
- Dive deeper only when needed

**2. Less Overwhelming**
- No 1000-line documentation dumps
- Information in bite-sized pieces
- Progressive complexity

**3. Better Navigation**
- Clear structure
- Easy to find what you need
- Consistent across all skills

---

### For the AI Assistant

**1. Token Efficiency**
- Loads only what's needed
- 60-80% reduction in typical cases
- Faster responses

**2. Better Focus**
- Relevant information only
- Less context switching
- More accurate responses

---

## Common Usage Patterns

### Pattern 1: Quick Task
```
Goal: Accomplish a simple, common task

1. Read SKILL.md overview (know what skill does)
2. Check Quick Start section
3. Copy/paste example
4. Done!

Time: 2-3 minutes
```

---

### Pattern 2: New User Setup
```
Goal: Set up a skill for the first time

1. Read SKILL.md overview
2. Request setup-guide.md
3. Follow step-by-step instructions
4. Verify with Quick Start examples

Time: 10-15 minutes
```

---

### Pattern 3: Advanced Usage
```
Goal: Use advanced features or customize

1. Read SKILL.md overview (refresh memory)
2. Check Available Resources section
3. Request api-reference.md
4. Study technical details
5. Implement customization

Time: 30-60 minutes
```

---

### Pattern 4: Troubleshooting
```
Goal: Fix something that isn't working

1. Identify the problem
2. Request troubleshooting.md
3. Search for similar issue
4. Apply solution
5. If not solved, check setup-guide.md

Time: 5-10 minutes (usually)
```

---

## Requesting Resources

### Method 1: Natural Language (Recommended)

Simply ask for what you need:

```
"Show me the [resource name] for [skill name]"
"I need the quick reference for scenario manager"
"Load the troubleshooting guide"
"Get me the setup documentation"
```

**The AI will:**
1. Identify the skill
2. Load the requested resource
3. Present the relevant information

---

### Method 2: Direct File Access

If working in terminal:

```bash
# View main skill file
cat ~/.claude/skills/skill-name/SKILL.md

# View specific resource
cat ~/.claude/skills/skill-name/resources/quick-ref.md

# List all resources
ls ~/.claude/skills/skill-name/resources/
```

---

### Method 3: Links in SKILL.md

Click links in the "Available Resources" section:

```markdown
## Available Resources

### Quick Reference (`quick-ref`)
...
→ [View Quick Reference](resources/quick-ref.md)
```

---

## Tips for Efficient Usage

### Tip 1: Start Small
Don't try to learn everything at once. Read SKILL.md, try Quick Start, expand from there.

### Tip 2: Use Quick Reference Often
Once you know the basics, use quick-ref.md for fast syntax lookups. It's designed for speed.

### Tip 3: Bookmark Common Resources
If you frequently use a skill, keep links to your most-used resources handy.

### Tip 4: Read Troubleshooting Proactively
Skim troubleshooting.md even if nothing is broken. You'll learn common pitfalls.

### Tip 5: Explore Available Resources
Check the "Available Resources" section in SKILL.md to see what detailed docs exist. You might discover helpful guides you didn't know about.

---

## Example: Working with scenario_manager

Let's walk through using a real structured skill.

### Scenario: First Time Using scenario_manager

**Step 1: Read Overview**
```bash
cat ~/.claude/skills/scenario_manager/SKILL.md
```

**Learn:**
- It manages scenario definitions
- Helps discover, create, validate scenarios
- Never auto-scaffolds (safe)

**Time:** 2 minutes

---

**Step 2: Try Quick Start**

From SKILL.md Quick Start:
```
"What scenarios do I have?"
```

**Result:** You see available scenarios immediately

**Time:** 30 seconds

---

**Step 3: Need More Detail?**

Say you want to validate a scenario:
```
"Show me the scenario manager quick reference"
```

**Get:** Command cheat sheet with all syntax

**Time:** 1 minute

---

**Step 4: Still Need Help?**

If validation fails:
```
"Show me scenario manager troubleshooting"
```

**Get:** Common errors and solutions

**Time:** 3-5 minutes to find and fix issue

---

**Total Time:** Under 10 minutes to go from zero knowledge to solving a problem

**Compare to:**
- Reading a 1000-line doc: 30-45 minutes
- Trial and error without docs: Hours potentially

---

## Recognizing Structured Skills

Not all skills use this pattern yet. Here's how to identify structured ones:

### Signs of a Structured Skill

✅ **File Structure:**
```
skill-name/
├── SKILL.md
├── metadata.json
└── resources/
    ├── quick-ref.md
    ├── setup-guide.md
    ├── api-reference.md
    └── troubleshooting.md
```

✅ **SKILL.md has these sections:**
- Overview
- Quick Start
- Available Resources
- Navigation tips

✅ **Line counts reasonable:**
- SKILL.md: ~300 lines
- Resources: <500 lines each
- quick-ref: <100 lines

✅ **metadata.json includes:**
```json
{
  "structure": {
    "format": "diet103-progressive-disclosure",
    ...
  }
}
```

---

### Signs of an Unstructured Skill

❌ **File Structure:**
```
skill-name/
└── skill.md  (one large file, 500+ lines)
```

❌ **No clear sections or navigation**

❌ **Everything in one file** (no resources/)

**Note:** Unstructured skills still work! They just don't have the progressive disclosure benefits.

---

## FAQ

### Q: Do I need to read all resources?

**A:** No! That's the point. Read only what you need:
- Just getting started? SKILL.md + Quick Start
- Need syntax? quick-ref.md
- Setting up? setup-guide.md
- Troubleshooting? troubleshooting.md

---

### Q: Can I read resources in any order?

**A:** Yes, but we recommend:
1. SKILL.md (always first)
2. Then any resource you need

Each resource is self-contained.

---

### Q: What if I can't find what I need?

**A:** Try this progression:
1. SKILL.md Quick Start
2. quick-ref.md (if you know what you're looking for)
3. setup-guide.md or api-reference.md (depending on need)
4. troubleshooting.md (if something's wrong)
5. Ask the AI assistant for help

---

### Q: Are all skills structured this way?

**A:** Not yet. This is a new pattern being adopted gradually. Look for the file structure and metadata to identify structured skills.

---

### Q: Can I suggest improvements to a skill's structure?

**A:** Yes! If you notice:
- Missing information
- Confusing organization
- Broken links
- Outdated examples

Report it to the skill maintainer or project team.

---

## Advanced: Understanding Metadata

Each structured skill has a `metadata.json` file:

```json
{
  "structure": {
    "format": "diet103-progressive-disclosure",
    "version": "1.0",
    "mainFile": "SKILL.md",
    "resources": {
      "quick-ref": {
        "file": "resources/quick-ref.md",
        "description": "Command cheat sheet",
        "maxLines": 100
      }
    }
  }
}
```

**What this tells you:**
- Skill follows progressive disclosure pattern
- Main entry point is SKILL.md
- Available resources and what they contain
- Size limits (quality guarantee)

**You don't need to read metadata.json**, but it's there if you're curious about a skill's structure.

---

## Comparison: Before vs. After

### Before (Unstructured)
```
skill-name/
└── skill.md (800 lines)

User experience:
- Overwhelmed by wall of text
- Hard to find specific info
- Must read everything to understand
- AI loads full 800 lines every time
- Slow, expensive, confusing
```

### After (Structured)
```
skill-name/
├── SKILL.md (250 lines)
└── resources/
    ├── quick-ref.md (90 lines)
    ├── setup-guide.md (400 lines)
    ├── api-reference.md (350 lines)
    └── troubleshooting.md (300 lines)

User experience:
- Start with clear 250-line overview
- Load only what you need
- Easy navigation
- AI loads 250 lines by default
- Fast, efficient, clear
```

---

## Getting Help

### If You're Stuck

1. **Re-read SKILL.md** - You might have missed something
2. **Check troubleshooting.md** - Common problems are documented
3. **Ask the AI assistant** - It has access to all resources
4. **Check the project documentation** - Additional help may be available

### If You Find Issues

- Report unclear documentation
- Suggest missing examples
- Note broken links
- Recommend improvements

---

## Summary

**The Progressive Disclosure Pattern:**
1. ✅ Start with SKILL.md (overview + quick start)
2. ✅ Try quick examples first
3. ✅ Request detailed resources only when needed
4. ✅ Use quick-ref.md for fast lookups
5. ✅ Check troubleshooting when stuck

**Benefits:**
- ⚡ Faster learning
- 🎯 Focused information
- 🔍 Easy navigation
- 💰 Token efficient
- 🧠 Less overwhelming

**Remember:** You don't need to read everything. Start small, expand as needed.

---

**Happy Skill Using!**

For more information:
- [Skill Structure Specification](SKILL_STRUCTURE_SPECIFICATION.md) - Technical details
- [Skill Migration Guide](SKILL_MIGRATION_GUIDE.md) - For maintainers
- [Skill Audit Report](SKILL_AUDIT_REPORT.md) - Current status

