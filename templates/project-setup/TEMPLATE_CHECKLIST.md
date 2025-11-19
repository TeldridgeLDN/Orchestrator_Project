# Project Setup Template - Checklist

Use this checklist to ensure your template setup is working correctly.

---

## Pre-Setup Checklist

Before running the setup script:

- [ ] Orchestrator is installed (`orchestrator --version`)
- [ ] Taskmaster is installed (`task-master --version`)
- [ ] Git is installed (`git --version`)
- [ ] You have a target project path in mind
- [ ] You know your project type (backend/frontend/fullstack/library)

**Missing tools?** See installation instructions in main README.

---

## Setup Process Checklist

After running `setup-project.sh`:

### Directory Structure
- [ ] `.claude/` directory exists
- [ ] `.claude/hooks/skill-activation.js` exists and is executable
- [ ] `.claude/settings.json` exists
- [ ] `.claude/skill-rules.json` exists
- [ ] `.claude/skills/scenario_manager/` exists
- [ ] `.claude/agents/test-selector.md` exists
- [ ] `.claude/knowledge/` directories exist (patterns, decisions, prompts)
- [ ] `.taskmaster/` directory exists
- [ ] `.taskmaster/tasks/tasks.json` exists
- [ ] `DAILY_WORKFLOW.md` exists
- [ ] `README.md` exists
- [ ] `.gitignore` exists

### Git Setup
- [ ] Git repository initialized (`.git/` exists)
- [ ] Initial commit made
- [ ] `.gitignore` includes Taskmaster temp files

### Orchestrator Registration
- [ ] Project appears in `orchestrator list`
- [ ] `orchestrator current` shows correct project name
- [ ] Project path is correct

### Taskmaster Setup
- [ ] `.taskmaster/config.json` exists
- [ ] Example PRD copied to `.taskmaster/docs/`
- [ ] Can run `task-master list` without errors

---

## Verification Tests

Run these commands to verify everything works:

### Test 1: Project Recognition
```bash
orchestrator current
```
**Expected:** Shows your project name and path

### Test 2: Taskmaster Works
```bash
task-master list
```
**Expected:** Shows empty task list or example tasks

### Test 3: Git Works
```bash
git status
git log --oneline
```
**Expected:** Shows initial commit, clean working tree

### Test 4: Skills Activate (Manual)
In agent chat, type:
```
"create a new scenario"
```
**Expected:** scenario_manager skill is suggested or auto-loaded

### Test 5: Workflow Guide Readable
```bash
cat DAILY_WORKFLOW.md | head -20
```
**Expected:** Shows workflow guide header

---

## Post-Setup Checklist

After verification:

### Immediate (Today)
- [ ] Read `DAILY_WORKFLOW.md`
- [ ] Test the 7 core commands
- [ ] Create first task (`task-master add-task`)
- [ ] Complete first task cycle
- [ ] Make first code commit

### This Week
- [ ] Add 3+ tasks
- [ ] Complete 2+ tasks
- [ ] Use `task-master update-subtask` for logging
- [ ] Test skill auto-activation 5+ times
- [ ] Document one pattern in `.claude/knowledge/patterns/`

### This Month
- [ ] Apply template to second project
- [ ] Create custom skill (optional)
- [ ] Build knowledge base (5+ patterns/decisions)
- [ ] Customize `skill-rules.json` for your workflow
- [ ] Share feedback or improvements

---

## Troubleshooting Checklist

If something doesn't work:

### Skills Don't Auto-Activate
- [ ] `.claude/settings.json` includes hook registration
- [ ] Hook file `.claude/hooks/skill-activation.js` is executable
- [ ] Skill files exist in `.claude/skills/`
- [ ] Trigger phrases match what you're saying
- [ ] IDE/agent has been restarted

### Orchestrator Commands Fail
- [ ] Orchestrator is installed globally
- [ ] `~/.orchestrator/` directory exists
- [ ] `~/.orchestrator/projects.json` is valid JSON
- [ ] Project path is absolute, not relative

### Taskmaster Commands Fail
- [ ] Taskmaster is installed globally
- [ ] `.taskmaster/config.json` exists
- [ ] `.taskmaster/tasks/tasks.json` is valid JSON
- [ ] API keys configured (if using AI features)

### Git Issues
- [ ] `.git/` directory exists
- [ ] User name/email configured (`git config user.name`)
- [ ] Remote configured if pushing to GitHub

---

## Success Indicators

You'll know the setup is working when:

### Week 1
- ✅ You use `orchestrator current` without thinking
- ✅ You use `task-master next` to start work sessions
- ✅ Skills activate 50%+ of the time
- ✅ You've completed 3+ task cycles

### Month 1
- ✅ You've set up 2+ projects with template
- ✅ Skills activate 80%+ of the time
- ✅ You rarely reference documentation
- ✅ You have custom patterns documented

### Month 3
- ✅ Template setup takes < 5 minutes
- ✅ You've customized skills/agents
- ✅ Your workflow feels natural
- ✅ You're teaching others the pattern

---

## Cleanup Checklist

If setup failed and you want to start over:

```bash
# Navigate to project
cd ~/projects/failed-project

# Remove infrastructure
rm -rf .claude .cursor .taskmaster

# Remove docs
rm DAILY_WORKFLOW.md README.md

# Unregister from Orchestrator
orchestrator unregister "ProjectName"

# Optionally remove entire directory
cd ..
rm -rf failed-project
```

Then run setup script again.

---

## Template Maintenance Checklist

For maintaining the template itself:

### When to Update Template
- [ ] After improving Orchestrator infrastructure
- [ ] After creating useful new skills
- [ ] After creating useful new agents
- [ ] After workflow improvements
- [ ] When bugs are found

### What to Update
- [ ] Copy updated files from Orchestrator to `template/`
- [ ] Update documentation (README, QUICKSTART)
- [ ] Test setup script with updates
- [ ] Version bump if major changes
- [ ] Document changes in CHANGELOG (if exists)

### Testing Template Updates
- [ ] Create test project with updated template
- [ ] Verify all checklist items above
- [ ] Test in different scenarios (backend, frontend, etc.)
- [ ] Get feedback from team
- [ ] Apply to real project

---

## Feedback Checklist

Help improve the template:

### What Worked
- [ ] Document what went smoothly
- [ ] Note helpful parts of documentation
- [ ] Identify useful defaults

### What Didn't Work
- [ ] Document friction points
- [ ] Note confusing documentation
- [ ] Identify missing features

### Suggestions
- [ ] Additional skills needed?
- [ ] Better default agents?
- [ ] Documentation improvements?
- [ ] Script enhancements?

**Share feedback:** Create issue or update this checklist.

---

**Last Updated:** November 15, 2025  
**Template Version:** 1.0.0

