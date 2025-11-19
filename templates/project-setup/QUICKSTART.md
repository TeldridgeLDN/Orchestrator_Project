# Project Setup Template - Quick Start

**Time to setup:** 2 minutes  
**Time to first task:** 5 minutes

---

## Fastest Way to Start

```bash
# 1. Go to Orchestrator Project
cd ~/Orchestrator_Project

# 2. Run setup script
./templates/project-setup/setup-project.sh ~/projects/my-new-project

# 3. Start working
cd ~/projects/my-new-project
task-master next
```

That's it! 🎉

---

## What Just Happened?

The script:
1. ✅ Created project directory
2. ✅ Installed diet103 infrastructure (skills, hooks, agents)
3. ✅ Configured auto-activation
4. ✅ Initialized Git
5. ✅ Registered with Orchestrator
6. ✅ Initialized Taskmaster
7. ✅ Created initial commit

---

## Next Steps (Choose Your Path)

### Path A: "I have a PRD" (10 minutes)

```bash
# 1. Edit the PRD template
vim .taskmaster/docs/example-prd.txt

# 2. Generate tasks from PRD
task-master parse-prd .taskmaster/docs/example-prd.txt

# 3. Analyze complexity
task-master analyze-complexity --research

# 4. Expand tasks
task-master expand --all --research

# 5. Start working
task-master next
```

### Path B: "I know what to build" (5 minutes)

```bash
# 1. Add tasks manually
task-master add-task --prompt="Set up project structure" --research
task-master add-task --prompt="Implement core feature" --research
task-master add-task --prompt="Write tests" --research

# 2. Start working
task-master next
```

### Path C: "I'm just exploring" (1 minute)

```bash
# Just start coding
# Add tasks as you figure out what you need
task-master add-task --prompt="Explore and prototype"
```

---

## The 7 Commands You Need

```bash
# 1. Where am I?
orchestrator current

# 2. What's next?
task-master next

# 3. View task
task-master show <id>

# 4. Log progress
task-master update-subtask --id=X.Y --prompt="notes..."

# 5. Complete task
task-master set-status --id=X.Y --status=done

# 6. Switch projects
orchestrator switch <name>

# 7. Commit work
git add . && git commit -m "..."
```

**That's all you need to know.** Ignore everything else until you need it.

---

## Common Scenarios

### Scenario 1: Backend API

```bash
# Setup
./templates/project-setup/setup-project.sh \
  --type backend \
  --skills "backend-dev,testing" \
  ~/projects/my-api

cd ~/projects/my-api

# Add task
task-master add-task --prompt="Create REST API with Express" --research

# Work
task-master next
# ... implement in agent ...
task-master set-status --id=1 --status=done
```

### Scenario 2: React App

```bash
# Setup
./templates/project-setup/setup-project.sh \
  --type frontend \
  --skills "frontend-dev" \
  ~/projects/my-app

cd ~/projects/my-app

# Add task
task-master add-task --prompt="Build dashboard with React" --research

# Work
task-master next
# ... implement in agent ...
task-master set-status --id=1 --status=done
```

### Scenario 3: Quick Script

```bash
# Setup (use defaults)
./templates/project-setup/setup-project.sh -y ~/projects/my-script

cd ~/projects/my-script

# Skip Taskmaster, just code
# ... write code ...
git add . && git commit -m "Initial version"
```

---

## Customization (Optional)

### Change Skills

Edit `.claude/skill-rules.json`:

```json
{
  "rules": [
    {
      "id": "my_custom_trigger",
      "trigger_phrases": ["do the thing"],
      "skill": "my-skill",
      "auto_activate": true,
      "priority": "high"
    }
  ]
}
```

### Add Knowledge

Document your patterns:

```bash
# Recurring pattern
echo "# Auth Pattern" > .claude/knowledge/patterns/auth.md

# Decision log
echo "# ADR 001: Technology choice" > .claude/knowledge/decisions/001.md
```

---

## Testing It Works

```bash
# In agent chat, try:
"create a scenario"

# Expected: scenario_manager skill should be suggested
```

If skills aren't activating, check `.claude/settings.json` includes the hook.

---

## Help

### Skills not activating?
- Restart your IDE/agent
- Check `.claude/settings.json` has the hook registered
- Check `.claude/skill-rules.json` has trigger phrases

### Commands not found?
```bash
# Install globally
npm install -g orchestrator-project
npm install -g task-master-ai
```

### Want to learn more?
- Read `DAILY_WORKFLOW.md` in your project
- Read `README.md` in templates/project-setup/
- Read `HOW_TO_APPLY_INFRASTRUCTURE.md` in Orchestrator root

---

## Advanced (Month 2+)

Once you've mastered the basics, explore:

- Creating custom skills
- Building specialized agents
- Multi-agent workflows
- Cross-project knowledge sharing
- Session persistence across resets

But don't worry about these yet. Master the basics first.

---

**Remember:**
- Start simple
- Master the 7 commands
- Add complexity only when needed
- The goal is to reduce cognitive load, not add to it

---

**Questions?** Check the main README or ask in agent chat.

**Ready?** Run the setup script and start building! 🚀

