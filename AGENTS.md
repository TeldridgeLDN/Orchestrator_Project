# AGENTS.md

This file provides guidance to AI coding assistants (Claude Code, Cursor, Copilot, etc.) when working with code in this repository. It follows the [AGENTS.md standard](https://agents.md/).

## Project Overview

**Orchestrator_Project** is a multi-project AI orchestration system that combines:
- **PAI Global Layer**: Cross-project orchestration and coordination
- **diet103 Local Layer**: Project-specific skills, hooks, and agents
- **Dashboard**: React-based epic management and monitoring interface

The system manages multiple development projects including:
- `portfolio-redesign` - Astro portfolio website
- `Momentum_Squared` - Investment analysis platform
- `telegram_bot` - Trading automation

## Essential Commands

### Development
```bash
npm run init              # Initialize orchestrator hooks
npm run dashboard         # Start epic dashboard server
npm run test              # Run vitest tests
npm run test:watch        # Watch mode testing
npm run test:coverage     # Coverage report
```

### Validation & Verification
```bash
npm run validate:ufc      # Validate UFC rules
npm run verify:analytics  # Verify Plausible analytics setup
npm run verify:seo        # Verify SEO implementation
npm run precommit:analytics  # Compact pre-commit check
```

### Rule Management
```bash
npm run sync-rules-global   # Sync rules across projects
npm run validate-rules      # Validate rule versions
```

### CLI Tools
```bash
orch                      # Main orchestrator CLI
diet103                   # diet103 enhancement CLI
orchestrator              # Legacy orchestrator command
```

## Wake-Up Protocol

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

## Task Master Integration

This project uses Task Master AI for task-driven development workflows.

### Configuration
- **Config location**: `.taskmaster/config.json`
- **Tasks file**: `.taskmaster/tasks/tasks.json`
- **PRD location**: `.taskmaster/docs/prd.txt`

### Common Task Master Commands
```bash
task-master list                    # View all tasks
task-master next                    # Get next task to work on
task-master show <id>               # View task details (e.g., task-master show 128.4)
task-master set-status --id=<id> --status=done  # Mark complete
task-master expand --id=<id> --research         # Break down complex task
task-master update-subtask --id=<id> --prompt="notes"  # Add notes
task-master analyze-complexity --research       # Analyze task complexity
```

### Task-Driven Development Pattern
1. Use `task-master next` to identify work
2. Review task with `task-master show <id>`
3. Document exploration with `task-master update-subtask --id=<id> --prompt="findings"`
4. Implement and iterate
5. Mark complete with `task-master set-status --id=<id> --status=done`

## Architecture

### Directory Structure
```
Orchestrator_Project/
├── bin/                    # CLI executables
│   ├── diet103.js         # diet103 CLI
│   ├── orch               # Orchestrator CLI
│   └── orchestrator.cjs   # Legacy CLI
├── dashboard/             # React epic dashboard
│   ├── src/              # Dashboard source
│   └── server.js         # Dashboard server
├── lib/                   # Core libraries
│   ├── commands/         # CLI command handlers
│   ├── hooks/            # Validation hooks
│   ├── init/             # Initialization scripts
│   ├── lateral-thinking/ # Lateral thinking engine
│   ├── rules/            # Rule management
│   ├── skills/           # Skill implementations
│   ├── templates/        # Template library
│   ├── utils/            # Shared utilities
│   └── validators/       # Validation logic
├── templates/            # Project templates
├── tests/                # Test suite
├── .claude/              # Claude Code config
│   ├── commands/         # Custom slash commands
│   └── settings.json     # Tool allowlist
├── .cursor/              # Cursor IDE config
│   └── rules/            # Cursor rules (.mdc)
├── .taskmaster/          # Task Master config
│   ├── tasks/            # Task files
│   ├── docs/             # PRDs
│   └── config.json       # AI model settings
└── .mcp.json             # MCP server config
```

### Key Components

**Epic Dashboard** (`dashboard/`)
- React + Vite application
- Real-time epic tracking
- WebSocket updates
- Icon system for status visualization

**Lateral Thinking Engine** (`lib/lateral-thinking/`)
- Creative problem-solving assistance
- Alternative solution generation
- Pattern recognition across projects

**Template Composer** (`lib/template-composer.js`)
- Dynamic template generation
- Cross-project template sharing
- Variable interpolation

**Validation Hooks** (`lib/hooks/`)
- Analytics verification
- SEO compliance checking
- Pre-commit validation

## Custom Slash Commands

Available in `.claude/commands/`:
- `/run-tests` - Execute test suite
- `/prepare-release` - Prepare release package
- `/wind-down` - End session protocol
- `/switch-project` - Change project context
- `/validate-docs` - Validate documentation
- `/list-projects` - Show managed projects
- `/dependency-update` - Update dependencies
- `/pre-merge-review` - Pre-merge validation

## Cursor Rules

Available in `.cursor/rules/`:
- `wake-up-protocol.mdc` - Session start protocol
- `wrap-up-protocol.mdc` - Session end protocol
- `project-identity.mdc` - Project identification
- `cursor_rules.mdc` - General Cursor rules
- `seo.mdc` - SEO implementation rules
- `analytics.mdc` - Analytics patterns
- `self_improve.mdc` - Self-improvement patterns

## diet103 Enhancements

### Skills (3)
- **Score Trend Monitoring** - Automated portfolio monitoring
- **P/E Compression Analysis** - Valuation comparison
- **Workflow 9 Executor** - Monthly underperformance analysis

### Hooks (4)
- **Pre-Command Validator** - Command validation
- **Database Query Validator** - SQL safety checks
- **Portfolio Sync Validator** - Master file drift prevention
- **DB Connection Guardian** - Context manager enforcement

### Agents (2)
- **Emergency Recovery** - Context restoration
- **Test Selector** - Intelligent test selection

## MCP Integration

Task Master provides an MCP server. Configure in `.mcp.json`:

```json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
        "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}"
      }
    }
  }
}
```

### Essential MCP Tools
```javascript
// Project setup
initialize_project   // = task-master init
parse_prd           // = task-master parse-prd

// Daily workflow
get_tasks           // = task-master list
next_task           // = task-master next
get_task            // = task-master show <id>
set_task_status     // = task-master set-status

// Task management
add_task            // = task-master add-task
expand_task         // = task-master expand
update_task         // = task-master update-task
update_subtask      // = task-master update-subtask
```

## Testing

### Test Framework
- **Vitest** for unit and integration tests
- **Playwright** for E2E testing

### Running Tests
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

### Test Files
- `tests/` - Main test directory
- `lib/__tests__/` - Library-specific tests

## Configuration Files

### API Keys Required
At least one of these must be configured:
- `ANTHROPIC_API_KEY` (Claude models) - **Recommended**
- `PERPLEXITY_API_KEY` (Research features) - **Highly recommended**
- `OPENAI_API_KEY` (GPT models)
- `GOOGLE_API_KEY` (Gemini models)

Set in `.env` file or environment variables.

### Model Configuration
```bash
task-master models --setup           # Interactive setup
task-master models --set-main claude-3-5-sonnet-20241022
task-master models --set-research perplexity-llama-3.1-sonar-large-128k-online
```

## Important Notes

### AI-Powered Operations
These commands make AI calls and may take up to a minute:
- `parse_prd` / `task-master parse-prd`
- `analyze_project_complexity` / `task-master analyze-complexity`
- `expand_task` / `task-master expand`
- `add_task` / `task-master add-task`
- `update_task` / `task-master update-task`
- `update_subtask` / `task-master update-subtask`

### File Management
- Never manually edit `tasks.json` - use commands instead
- Never manually edit `.taskmaster/config.json` - use `task-master models`
- Task markdown files are auto-generated

### Session Management
- Use `/clear` frequently to maintain focused context
- Create custom slash commands for repeated workflows
- Configure tool allowlist to streamline permissions

## References

- Task Master documentation: `.taskmaster/CLAUDE.md`
- Quick start guide: `QUICK_START_GUIDE.md`
- Dashboard: `dashboard/README.md`
- diet103 docs: `lib/skills/*/skill.md`

---

*This file is the primary instruction source for AI assistants working on this project.*
