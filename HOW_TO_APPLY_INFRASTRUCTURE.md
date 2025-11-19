# How to Apply diet103 & Miessler Infrastructure Patterns

**Project:** Orchestrator  
**Date:** November 15, 2025  
**Based on:**
- [diet103 Claude Code Infrastructure](https://github.com/diet103/claude-code-infrastructure-showcase)
- [Daniel Miessler Personal AI Infrastructure](https://github.com/danielmiessler/Personal_AI_Infrastructure)

---

## Executive Summary

This document explains how to apply the foundational infrastructure patterns from diet103 and Daniel Miessler to:

1. **The Orchestrator Project itself** (meta-development)
2. **Other projects you manage** (client work, personal projects)

**Key Insight:** The infrastructure exists, but lacks the **activation layer** that makes it work automatically.

---

## Part 1: Applying to Orchestrator Project (Meta)

### Current State Assessment

**✅ What You Have:**
- Complete hook system (`.claude/hooks/`)
- Skills library (`.claude/skills/`)
- Agents (`.claude/agents/`)
- Rules (`.claude/rules/`)
- Taskmaster integration
- CLI tools

**❌ What's Missing:**
- Skill auto-activation not working
- Hooks not connected to skills
- Too many CLI commands (overwhelming)
- No clear daily workflow
- Integration feels disjointed

### The diet103 Pattern - What It Actually Does

**Core Concept:** Skills that **activate themselves** based on context.

**How It Works:**

1. **skill-rules.json** defines trigger patterns:
```json
{
  "rules": [
    {
      "trigger_phrases": ["create scenario", "new scenario"],
      "skill": "scenario_manager",
      "auto_activate": true
    }
  ]
}
```

2. **UserPromptSubmit hook** analyzes every prompt:
   - Checks trigger phrases
   - Checks file context
   - Suggests relevant skills
   - Injects skill reference into prompt

3. **Skills load progressively:**
   - Main file <500 lines
   - Resource files loaded as needed
   - Avoids context limit issues

**What We Fixed Today:**
- ✅ Created `skill-activation.js` hook
- ✅ Updated `settings.json` to use it
- ✅ Created unified `orch` CLI helper
- ✅ Wrote `DAILY_WORKFLOW.md` guide

### Integration Roadmap for Orchestrator

#### Phase 1: Core Activation (DONE TODAY) ✅

```bash
# Files created/updated:
.claude/hooks/skill-activation.js      # Auto-activation logic
.claude/settings.json                   # Hook registration
bin/orch                                # Simplified CLI
DAILY_WORKFLOW.md                       # User guide
HOW_TO_APPLY_INFRASTRUCTURE.md         # This file
```

**Test it:**
```bash
# In agent chat, say:
"create a new scenario for user authentication"

# Expected: scenario_manager skill should be suggested
```

#### Phase 2: Add File-Based Triggers (Next Session)

Update `skill-rules.json` to include file patterns:

```json
{
  "id": "doc_generation",
  "trigger_phrases": ["generate docs", "create documentation"],
  "file_patterns": [
    ".claude/skills/*/",
    "src/",
    "lib/"
  ],
  "skill": "doc-generator",
  "auto_activate": true
}
```

**When complete:** Opening a skill file + asking about docs → auto-suggests doc-generator

#### Phase 3: Add More Skills (Ongoing)

**Skills to Add:**
1. **project-orchestration** - When managing multiple projects
2. **shell-integration** - When working on shell scripts
3. **rule-management** - When updating rules
4. **git-workflow** - When doing complex git operations

**Pattern:**
```
1. Identify recurring task
2. Create skill in .claude/skills/
3. Add trigger patterns to skill-rules.json
4. Test auto-activation
```

#### Phase 4: Specialized Agents (As Needed)

You already have `test-selector` agent. Add more as patterns emerge:

- **release-coordinator** - Prepares releases
- **documentation-syncer** - Keeps docs in sync
- **dependency-auditor** - Checks for updates
- **code-reviewer** - Reviews PRs

**When to create agent:** When you do the same complex task 3+ times.

---

## Part 2: Applying to Other Projects

### The Template: Copy This Structure

For every project you manage, replicate this pattern:

```
my-project/
├── .claude/
│   ├── settings.json           # Hook + skill registration
│   ├── skill-rules.json        # Auto-activation triggers
│   ├── hooks/
│   │   ├── skill-activation.js # Copy from Orchestrator
│   │   └── PostToolUse.js      # Optional tracking
│   ├── skills/                 # Project-specific skills
│   │   ├── backend-dev/        # If backend project
│   │   ├── frontend-dev/       # If frontend project
│   │   └── testing/            # If heavy testing
│   └── agents/                 # Specialized for this project
│       ├── code-reviewer.md
│       └── error-debugger.md
├── .taskmaster/
│   └── tasks/tasks.json        # Task management
└── DAILY_WORKFLOW.md           # Remind yourself what to do
```

### Example: Client Backend API Project

**Project:** `acme-corp-api` (Node.js/Express/PostgreSQL)

**Setup (5 minutes):**

1. **Initialize Orchestrator:**
```bash
cd ~/projects/acme-corp-api
orchestrator register acme-corp-api
```

2. **Copy infrastructure:**
```bash
# Copy from Orchestrator template
cp -r ~/Orchestrator_Project/.claude/hooks/skill-activation.js .claude/hooks/
cp ~/Orchestrator_Project/.claude/settings.json .claude/
cp ~/Orchestrator_Project/DAILY_WORKFLOW.md .
```

3. **Add relevant skills:**
```bash
# Copy diet103's backend-dev-guidelines skill
mkdir -p .claude/skills/backend-dev
# ... copy skill files ...
```

4. **Configure skill-rules.json:**
```json
{
  "rules": [
    {
      "id": "backend_development",
      "trigger_phrases": [
        "create endpoint",
        "add route",
        "database query",
        "API controller"
      ],
      "file_patterns": ["src/routes/", "src/controllers/", "src/services/"],
      "skill": "backend-dev",
      "auto_activate": true,
      "priority": "high"
    },
    {
      "id": "api_testing",
      "trigger_phrases": [
        "test endpoint",
        "test API",
        "integration test"
      ],
      "file_patterns": ["tests/integration/", "tests/api/"],
      "skill": "route-tester",
      "auto_activate": true
    }
  ]
}
```

5. **Set up Taskmaster:**
```bash
cd ~/projects/acme-corp-api
task-master init
# Create PRD or manually add tasks
```

**Daily Use:**
```bash
# Start work
orch where           # acme-corp-api
orch next            # Task 3.2: Add user authentication endpoint

# Agent chat: "create a POST /auth/login endpoint"
# → backend-dev skill auto-activates
# → Guides you through Express route, controller, service pattern

# Log progress
orch log 3.2 "Implemented login endpoint with JWT"

# Complete
orch done 3.2
```

### Example: Personal Blog (Frontend)

**Project:** `my-blog` (Next.js/React/TypeScript)

**Setup:**
```bash
orchestrator register my-blog
cd ~/projects/my-blog

# Copy infrastructure (same as above)
# Add frontend-specific skills
mkdir -p .claude/skills/frontend-dev
# Copy diet103's frontend-dev-guidelines
```

**skill-rules.json:**
```json
{
  "rules": [
    {
      "id": "react_component",
      "trigger_phrases": [
        "create component",
        "add component",
        "React component"
      ],
      "file_patterns": ["src/components/", "components/"],
      "skill": "frontend-dev",
      "auto_activate": true
    }
  ]
}
```

**Benefit:** Same workflow across all projects, context-aware assistance.

---

## Part 3: The Miessler Pattern - Knowledge Management

Daniel Miessler's infrastructure focuses on **systematic knowledge capture**.

### Apply to Orchestrator

**Create knowledge directories:**

```
.claude/knowledge/
├── patterns/              # Recurring solutions
│   ├── git-workflows.md
│   ├── testing-strategies.md
│   └── error-handling.md
├── decisions/             # Architectural decisions
│   ├── 001-taskmaster-integration.md
│   ├── 002-skill-structure.md
│   └── 003-hook-architecture.md
└── prompts/               # Reusable prompts
    ├── code-review.md
    ├── documentation.md
    └── refactoring.md
```

**Usage:**
When solving a problem, document the solution in `patterns/`.
When making architectural decisions, log them in `decisions/`.

**Benefit:** Future you (or agents) can reference these instead of re-discovering solutions.

### Apply to Other Projects

Each project gets its own knowledge base:

```
my-project/.claude/knowledge/
├── patterns/
│   └── auth-implementation.md      # How we do auth in THIS project
├── decisions/
│   └── 001-chose-postgres.md       # Why we chose Postgres
└── prompts/
    └── add-feature.md               # Template for adding features
```

**Integration with Skills:**

Skills can reference knowledge:
```markdown
# backend-dev skill

## Authentication Patterns

See: `.claude/knowledge/patterns/auth-implementation.md`

For this project, we use:
- JWT tokens (not sessions)
- bcrypt for password hashing
- Refresh token rotation
```

---

## Part 4: What You Should Actually Do

### Today (30 minutes)

1. **Test skill activation:**
```bash
# In Claude/Cursor, try:
"create a new scenario"
"generate documentation"
"validate a scenario"
```

Expected: Relevant skills should be suggested.

2. **Try the new CLI helper:**
```bash
orch help
orch where
orch next
```

3. **Read DAILY_WORKFLOW.md**
   - Pick 3 commands to memorize
   - Ignore the rest for now

### This Week (2 hours)

1. **Add 2 more skills to Orchestrator:**
   - Copy from diet103's showcase
   - Add trigger patterns
   - Test auto-activation

2. **Create knowledge base:**
   ```bash
   mkdir -p .claude/knowledge/{patterns,decisions,prompts}
   ```

3. **Document one pattern:**
   - Pick something you do often
   - Write it down in `patterns/`

### This Month (Ongoing)

1. **Apply to one other project:**
   - Pick your most active project
   - Copy infrastructure
   - Add project-specific skills
   - Use for 1 week
   - Refine based on experience

2. **Build your skill library:**
   - Identify recurring tasks
   - Create skills for them
   - Share across projects where relevant

3. **Evolve your workflow:**
   - Keep what works
   - Discard what doesn't
   - Document in knowledge base

---

## Part 5: Success Metrics

### How to Know It's Working

**Week 1:**
- ✅ Skills activate automatically 50% of the time
- ✅ You use `orch` commands without looking them up
- ✅ You've logged progress to 5+ subtasks

**Month 1:**
- ✅ Skills activate automatically 80% of the time
- ✅ You've created 1 custom skill
- ✅ You switch projects without friction
- ✅ You have 3+ patterns documented

**Month 3:**
- ✅ You've applied infrastructure to 2+ other projects
- ✅ Skills activate automatically 95% of the time
- ✅ You rarely reference documentation
- ✅ Your workflow feels natural

---

## Part 6: Common Pitfalls & Solutions

### Pitfall 1: "Too many skills, nothing activates"

**Symptom:** Skills suggest themselves constantly, or never.

**Solution:**
- Start with 3-5 skills max
- Make trigger phrases specific
- Use priority levels (high/medium/low)
- Test in isolation

### Pitfall 2: "I still forget commands"

**Symptom:** You keep looking up syntax.

**Solution:**
- **Use `orch` helper instead of full commands**
- Print the quick reference card from DAILY_WORKFLOW.md
- Only learn 7 commands (ignore the rest)
- Make aliases:
```bash
alias o='orch'
alias on='orch next'
alias ow='orch where'
```

### Pitfall 3: "Skills don't match my workflow"

**Symptom:** Auto-suggestions are wrong or unhelpful.

**Solution:**
- Customize trigger phrases in skill-rules.json
- Add file_patterns for context
- Fork diet103's skills and adapt them
- Create project-specific skills

### Pitfall 4: "Setup takes too long per project"

**Symptom:** You avoid applying infrastructure to new projects.

**Solution:**
✅ **SOLVED!** We've created a comprehensive setup template system.

**Quick Setup (2 minutes):**
```bash
# From Orchestrator_Project root
./templates/project-setup/setup-project.sh ~/projects/my-new-project
```

**Custom Setup:**
```bash
# Backend API with specific skills
./templates/project-setup/setup-project.sh \
  --type backend \
  --skills "backend-dev,testing" \
  --name "ACME API" \
  ~/projects/acme-api
```

**What it does:**
- Copies all infrastructure (hooks, skills, agents)
- Registers with Orchestrator
- Initializes Taskmaster
- Creates Git repo
- Makes initial commit
- Takes < 2 minutes

**Documentation:**
- Full guide: `templates/project-setup/README.md`
- Quick start: `templates/project-setup/QUICKSTART.md`
- Checklist: `templates/project-setup/TEMPLATE_CHECKLIST.md`

### Pitfall 5: "I work differently in different projects"

**Symptom:** One workflow doesn't fit all.

**Solution:**
- **This is expected and good**
- Core infrastructure is the same (hooks, activation)
- Skills differ by project type
- skill-rules.json is project-specific
- Document variations in knowledge base

---

## Part 7: Advanced Patterns (Month 2+)

### Multi-Agent Workflows

For complex tasks, chain specialized agents:

```
User request
  → Planner Agent (breaks down work)
  → Code Agent (implements)
  → Reviewer Agent (reviews)
  → Documenter Agent (documents)
```

Implement with slash commands:
```markdown
# /complex-feature
1. Invoke planner-agent.md
2. Create tasks from plan
3. For each task, invoke code-agent.md
4. Invoke reviewer-agent.md
5. Invoke documenter-agent.md
```

### Context Persistence Across Resets ✅ IMPLEMENTED

**Status:** ✅ Session persistence fully working

**Save before context reset:**
```bash
orch save-session auth-feature "Working on JWT implementation"
```

**What gets saved:**
- Modified files
- Current tasks (from Taskmaster)
- Recent commits
- Git branch
- Auto-generates: plan.md, context.md, tasks.md

**Restore after reset:**
```bash
orch restore-session auth-feature
```

**Manage sessions:**
```bash
orch list-sessions                    # View all sessions
orch delete-session auth-feature      # Clean up
```

**Files stored at:** `.claude/sessions/<session-name>/`

### Cross-Project Knowledge Sharing ✅ IMPLEMENTED

**Status:** ✅ Global knowledge system fully working

**Share knowledge globally:**
```bash
orchestrator knowledge push          # Push all categories
orchestrator knowledge push patterns # Push patterns only
```

**Use in other projects:**
```bash
orchestrator knowledge pull          # Pull from global
orchestrator knowledge list          # See what's available
```

**What gets shared:**
- `patterns/` - Technical solutions
- `skills/` - Project-agnostic skills
- `prompts/` - Reusable templates
- `decisions/` - Cross-project ADRs

**Global location:** `~/.orchestrator/global-knowledge/`

**Reference in project-specific skills:**
```markdown
# Project skill

See global pattern: ~/.orchestrator/global-knowledge/patterns/auth.md

Customize for this project:
- Use JWT (global pattern suggests sessions)
- 15 min expiry (global pattern suggests 1 hour)
```

**Current global knowledge:**
- 2 patterns (global-rules, etc.)
- 1 prompt (code review)
- Auto-synced from Orchestrator

---

## Part 8: Resources & Next Steps

### Essential Reading (In Order)

1. **DAILY_WORKFLOW.md** (this repo) - Start here
2. [diet103's README](https://github.com/diet103/claude-code-infrastructure-showcase) - Understand the patterns
3. [diet103's CLAUDE_INTEGRATION_GUIDE.md](https://github.com/diet103/claude-code-infrastructure-showcase/blob/main/CLAUDE_INTEGRATION_GUIDE.md) - Deep dive
4. **Docs/CLI_REFERENCE.md** (this repo) - When you need command details

### Community & Support

- **GitHub Issues:** Report problems, suggest improvements
- **Agent Chat:** Ask Claude/Cursor for help
- **diet103's Repo:** See examples, contribute

### Your Action Plan

**Today (15 min):**
```bash
# 1. Test skill activation
# In agent chat: "create a scenario"

# 2. Try new commands
orch where
orch next

# 3. Read DAILY_WORKFLOW.md
```

**Tomorrow (30 min):**
```bash
# Use Orchestrator normally
orch next
# Do the task
orch done <id>

# Notice when skills activate (or don't)
# Document any issues
```

**Next Week (2 hours):**
```bash
# Apply to one other project
cd ~/my-other-project
# Follow setup template from Part 2
```

---

## Conclusion

**Key Takeaways:**

1. **The infrastructure exists, you just needed the activation layer** ✅
2. **Start with 7 commands, ignore the rest**
3. **Skills auto-activate based on triggers + file context**
4. **Apply same pattern to all projects**
5. **Build knowledge base over time**
6. **Customize, don't just copy**

**Remember:**
- You don't need to use every feature
- Master the basics first
- Add complexity only when needed
- The goal is to **reduce cognitive load**, not add to it

**The diet103 pattern works because:**
- Skills suggest themselves (no remembering)
- Hooks automate context injection
- Progressive disclosure prevents overwhelm
- Knowledge persists across resets

**You now have:**
- ✅ Auto-activating skills
- ✅ Simplified CLI (`orch`)
- ✅ Clear daily workflow
- ✅ Template for other projects
- ✅ Path to mastery

**Start simple. Add complexity only when it solves a real problem you're having.**

---

**Questions?**
- Check DAILY_WORKFLOW.md
- Ask in agent chat
- Create an issue

**Ready to start?**
```bash
orch where
orch next
# Get to work!
```

---

*Last Updated: November 15, 2025*  
*Based on diet103 & Miessler infrastructure patterns*  
*Customized for Orchestrator Project*

