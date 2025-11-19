# Orchestrator Daily Workflow - Essential Commands

**Last Updated:** November 15, 2025  
**Version:** 1.0.0

---

## 🎯 The 7 Commands You Actually Need

Stop trying to remember 50+ commands. Use these 7 daily, everything else is optional.

---

## 📍 WHERE AM I? (Start Here Every Day)

```bash
# See which project you're working in
orchestrator current

# Expected output:
# Current Project: Orchestrator_Project
# Path: /Users/tomeldridge/Orchestrator_Project
# Rules Version: 2.1.0
```

**When to use:** Start of every session, after switching projects

---

## 🎯 WHAT SHOULD I WORK ON?

```bash
# Get the next available task (respects dependencies)
task-master next

# Get next task in a specific tag context
task-master next --tag=diet103-sprint3

# View specific task details
task-master show 2.1

# List all tasks
task-master list
```

**When to use:** 
- Start of work session
- After completing a task
- When unsure what to work on next

---

## 📝 LOG MY PROGRESS (During Development)

```bash
# Log implementation notes to a subtask
task-master update-subtask --id=2.1 --prompt="
- Implemented template loader with YAML parsing
- Added validation for required fields
- Next: Need to add error handling for malformed YAML
"

# Mark task as in-progress
task-master set-status --id=2.1 --status=in-progress

# Mark task as complete
task-master set-status --id=2.1 --status=done
```

**When to use:**
- After exploration/planning
- When you discover something important
- Before taking a break
- After completing work

**Pro tip:** Log findings BEFORE implementing, so you have a plan to follow.

---

## 🔄 SWITCH PROJECTS

```bash
# Switch to another project
orchestrator switch MyOtherProject

# List all registered projects
orchestrator list
```

**When to use:**
- Moving between client projects
- Switching from work to personal projects
- Need different rule sets/contexts

---

## ✅ COMMIT MY WORK

```bash
# Stage and commit (use terminal, not agent)
git add .
git commit -m "feat(sprint3): implement template loader

- Added YAML parsing with schema validation
- Supports variable substitution
- Includes comprehensive error handling
- Completed Task 2.1"

# Push to remote
git push
```

**When to use:**
- After completing a subtask
- At end of work session
- Before switching projects

---

## 📊 CHECK PROJECT HEALTH (Weekly)

```bash
# View project statistics
orchestrator stats

# Validate project structure
orchestrator validate
```

**When to use:**
- Monday morning (start of week)
- Before major changes
- When something feels "off"

---

## 💡 GET HELP

```bash
# Orchestrator help
orchestrator help
orchestrator <command> help

# Taskmaster help
task-master help
task-master <command> --help
```

**When to use:** When you forget command syntax

---

## 🎭 Terminal vs Agent Chat - Which to Use?

### Use TERMINAL for:
✅ Project switching (`orchestrator switch`)  
✅ Task management (`task-master next`, `task-master show`)  
✅ Git operations  
✅ Running tests  
✅ System commands

### Use AGENT CHAT (Claude/Cursor) for:
✅ Writing code  
✅ Refactoring  
✅ Generating documentation  
✅ Problem-solving discussions  
✅ Complex reasoning

### The Pattern:
```
Terminal  → Manage workflow, context, tasks
Agent     → Implement code, create docs, solve problems
```

---

## 📅 Daily Routine Template

### Morning (5 minutes)
```bash
# 1. Check where you are
orchestrator current

# 2. See weekly stats (Monday only)
orchestrator stats

# 3. Get next task
task-master next

# 4. View task details
task-master show <id>
```

### During Work (as needed)
```bash
# Log progress frequently
task-master update-subtask --id=X.Y --prompt="Progress notes..."

# Mark tasks complete as you go
task-master set-status --id=X.Y --status=done

# Commit atomic changes
git add . && git commit -m "..."
```

### End of Day (2 minutes)
```bash
# Ensure all work is committed
git status
git add . && git commit -m "..."
git push

# Quick sanity check
task-master list
```

---

## 🚫 Commands You DON'T Need Daily

These exist but are OPTIONAL/INFREQUENT:

- `orchestrator bulk-register` - Only when onboarding many projects
- `orchestrator health` - Stats covers this
- `orchestrator validate-mcp` - Only when debugging MCP issues
- `task-master expand` - Only when breaking down complex tasks
- `task-master analyze-complexity` - Only before expansion
- `task-master research` - Only for deep research needs

**Don't try to learn these until you need them.**

---

## 🎓 Learning Path

### Week 1: Master the Core 4
1. `orchestrator current`
2. `task-master next`
3. `task-master set-status`
4. `git add/commit`

### Week 2: Add Progress Logging
5. `task-master update-subtask`
6. `task-master show`

### Week 3: Add Context Switching
7. `orchestrator switch`

### Month 2+: Explore Advanced Features
- Skill auto-activation
- Specialized agents
- Command templates
- Custom hooks

---

## 🔗 Quick Reference Card (Print This)

```
┌─────────────────────────────────────────────┐
│        ORCHESTRATOR DAILY COMMANDS          │
├─────────────────────────────────────────────┤
│ WHERE AM I?                                 │
│   orchestrator current                      │
│                                             │
│ WHAT NEXT?                                  │
│   task-master next                          │
│   task-master show <id>                     │
│                                             │
│ LOG PROGRESS                                │
│   task-master update-subtask --id=X.Y \     │
│     --prompt="notes"                        │
│                                             │
│ COMPLETE TASK                               │
│   task-master set-status --id=X.Y \         │
│     --status=done                           │
│                                             │
│ SWITCH PROJECT                              │
│   orchestrator switch <name>                │
│                                             │
│ COMMIT WORK                                 │
│   git add . && git commit -m "..."          │
│                                             │
│ WEEKLY CHECK                                │
│   orchestrator stats                        │
└─────────────────────────────────────────────┘
```

---

## 🆘 Common Issues

### "I forgot which project I'm in"
```bash
orchestrator current
```

### "I don't know what to work on"
```bash
task-master next
```

### "I completed work but forgot to log it"
```bash
task-master update-subtask --id=X.Y --prompt="Completed X, Y, Z"
task-master set-status --id=X.Y --status=done
```

### "Skills aren't auto-activating"
Check that `.claude/settings.json` includes:
```json
"hooks": {
  "UserPromptSubmit": [
    ".claude/hooks/skill-activation.js"
  ]
}
```

### "I'm overwhelmed by too many commands"
**Only use the 7 core commands above.** Ignore everything else until you need it.

---

## 📚 Full Documentation (If You Need It)

- **Complete CLI Reference:** `Docs/CLI_REFERENCE.md`
- **Architecture:** `Docs/ARCHITECTURE.md`
- **Skills Guide:** `.claude/skills/README.md`
- **Hooks Guide:** `.claude/hooks/README.md`

**But start with this file.** Don't read those until you've mastered the 7 commands above.

---

**Remember:** You don't need to remember 50 commands. Master these 7, and you'll be 90% productive.

*The rest is optimization.*

---

**Last Updated:** November 15, 2025  
**Questions?** Create an issue or ask in agent chat.

