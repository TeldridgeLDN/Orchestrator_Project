# Claude Code Instructions

## 🌅 Wake-Up Protocol

**Starting a new session? Just say:**
- "wake up"
- "good morning" / "good afternoon" / "good evening"
- "let's start"
- "ready" / "begin"

**What happens automatically:**
1. ✅ Project identity verification (PWD, config, package.json)
2. ✅ AI model configuration loaded (Claude 3.7 Sonnet settings)
3. ✅ Taskmaster context loaded (pending/in-progress tasks, next task)
4. ✅ Git status checked (current branch, uncommitted changes)
5. ✅ Active memories reviewed (cross-session learnings)
6. ✅ Structured wake-up report presented

**Time:** < 2 minutes for complete context load  
**Result:** AI has full project awareness and is ready to work effectively

See `.cursor/rules/wake-up-protocol.mdc` for technical details.

---

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
