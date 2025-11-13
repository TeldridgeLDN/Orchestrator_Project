# Project Portability Checklist

**Purpose:** Ensure new and migrated projects leverage existing Claude Code infrastructure effectively.

**When to use:** Automatically run after `claude project create` and `claude project register` commands.

---

## About This Checklist

### Architecture Foundation

This portability checklist implements patterns from:
- **[diet103/claude-code-infrastructure-showcase](https://github.com/diet103/claude-code-infrastructure-showcase)** - Reference architecture
- **PAI (Skills-as-Containers)** - Component design principles
- **Token-efficient orchestration** - Context isolation patterns

### Learning Path

📚 **For deeper understanding of the architectural decisions:**

**1. Start Here (You are here)**
- Use this checklist for practical project optimization
- Follow step-by-step portability recommendations
- Apply patterns to your specific tech stack

**2. Understand Patterns (Optional - For Deeper Learning)**
- Review [diet103/claude-code-infrastructure-showcase](https://github.com/diet103/claude-code-infrastructure-showcase)
- Study workflow and scenario systems in `Docs/workflows/`
- Examine diet103 validation patterns in `Docs/diet103_Validation_System.md`
- Explore meta-orchestration architecture in `Docs/ARCHITECTURE.md`

**3. Contribute Back (Advanced)**
- Share successful portability patterns you discover
- Contribute project-specific templates
- Document novel integration approaches
- Submit improvements to the checklist

### Important: Not a Migration Target

⚠️ **The showcase is a reference implementation** demonstrating orchestration architecture. This checklist **distills those patterns** into actionable steps for your projects.

**You don't "migrate" from the showcase** - you **apply its principles** via this checklist and the orchestrator tooling.

**Relationship:**
```
showcase (reference) → Orchestrator (tools) → Your Project (instance)
     ↑                        ↑                        ↑
  Teaches              Implements               Applies
  patterns             patterns as             patterns to
                       reusable tools          specific needs
```

---

## Overview

When creating or migrating a project, certain elements from other projects or templates can be strategically ported to maximize productivity and maintain consistency across your Claude Code workspace.

This checklist guides you through evaluating what to port from existing projects to new ones.

---

## Checklist Sections

### 1. Settings & Permissions Analysis

**File:** `.claude/settings.local.json`

**What to check:**
- [ ] Review existing permissions in source project(s)
- [ ] Identify project-type specific permissions needed
- [ ] Merge relevant bash command allowlists
- [ ] Include development workflow commands (lint, format, test, build)
- [ ] Include version control commands (git add, git commit)
- [ ] Include package manager commands (npm, yarn, pnpm)

**Action items:**
```bash
# Compare current settings with template/source
diff .claude/settings.local.json <source-project>/.claude/settings.local.json

# Merge relevant permissions
# Focus on: Bash commands, MCP tools, file operations
```

**Recommendations by project type:**

**Web Development (Astro/React/Vue/etc.):**
```json
{
  "permissions": {
    "allow": [
      "Bash(npm install:*)",
      "Bash(npm run *)",
      "Bash(npm test:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(npx eslint:*)",
      "Bash(npx prettier:*)",
      "Bash(npx astro:*)",
      "Bash(chmod:*)"
    ]
  }
}
```

**CLI/Node.js Tools:**
```json
{
  "permissions": {
    "allow": [
      "Bash(node:*)",
      "Bash(npm install:*)",
      "Bash(npm link:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(chmod:*)"
    ]
  }
}
```

**Python Projects:**
```json
{
  "permissions": {
    "allow": [
      "Bash(pip install:*)",
      "Bash(python -m:*)",
      "Bash(pytest:*)",
      "Bash(black:*)",
      "Bash(flake8:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)"
    ]
  }
}
```

---

### 2. Hooks Evaluation

**Directory:** `.claude/hooks/`

**Available hooks:**
- `UserPromptSubmit.sh` - Pre-validation before Claude processes prompts
- `PostToolUse.sh` - Post-validation after tool execution
- Custom validation scripts

**What to check:**
- [ ] Review existing hooks from source project
- [ ] Identify validation patterns relevant to new project type
- [ ] Adapt file type patterns (e.g., `.md` → `.astro`, `.tsx`)
- [ ] Customize validation rules for new tech stack
- [ ] Test hooks in new project context

**Adaptation examples:**

**For Web Development Projects:**
```bash
# Adapt UserPromptSubmit.sh to check:
# - ESLint/Prettier formatting
# - TypeScript compilation errors
# - Broken imports in components
# - Missing alt text in images
# - Accessibility violations
```

**For Documentation Projects:**
```bash
# Keep existing checks:
# - Markdown syntax validation
# - Broken internal links
# - Unclosed code blocks
# - Missing images
```

**Action items:**
```bash
# Copy and customize hooks
cp <source-project>/.claude/hooks/UserPromptSubmit.sh .claude/hooks/
# Edit to match new project needs
vim .claude/hooks/UserPromptSubmit.sh
# Make executable
chmod +x .claude/hooks/UserPromptSubmit.sh
```

---

### 3. Skill Rules Configuration

**File:** `.claude/skill-rules.json`

**What to check:**
- [ ] Review available skills in global `~/.claude/skills/`
- [ ] Check project-specific skills in source project
- [ ] Identify skills relevant to new project type
- [ ] Configure auto-activation triggers
- [ ] Set appropriate priority levels

**Available skill types:**

**Documentation Projects:**
- `doc-validator` - Markdown validation
- `link-checker` - Broken link detection
- `test-runner` - Test suite execution
- `example-validator` - Example code validation

**Web Development Projects:**
- `astro-content-collections` - Astro content management
- `tailwind-css` - Tailwind utilities
- `web-asset-generator` - Favicon/icon generation
- `framer-motion` - Animation library docs
- `mdx-docs` - MDX integration

**Skill Rules Structure:**
```json
{
  "version": "1.0.0",
  "description": "Skill activation rules for automatic skill suggestion",
  "rules": [
    {
      "skill": "tailwind-css",
      "description": "Tailwind CSS utility framework",
      "triggers": [
        "tailwind",
        "styling",
        "css utilities",
        "responsive design"
      ],
      "file_patterns": [
        "**/*.astro",
        "**/*.tsx",
        "tailwind.config.*"
      ],
      "auto_activate": true,
      "priority": "high"
    }
  ],
  "global_settings": {
    "enable_auto_activation": true,
    "show_skill_suggestions": true,
    "suggestion_threshold": 0.7
  }
}
```

**Action items:**
- [ ] Create new `skill-rules.json` tailored to project type
- [ ] DON'T blindly copy from unrelated project types
- [ ] Use source project structure as template only
- [ ] Configure triggers based on actual workflow patterns

---

### 4. Slash Commands Customization

**Directory:** `.claude/commands/`

**What to check:**
- [ ] Review existing commands from source project
- [ ] Identify workflow patterns in new project
- [ ] Create project-specific commands
- [ ] Map commands to `package.json` scripts (if applicable)

**Common command patterns:**

**Quality Checks:**
```markdown
# /check-quality

Run all quality checks for this project.

Steps:
1. Run linter: npm run lint
2. Run formatter check: npm run format
3. Run type checker: npm run type-check
4. Report any failures
```

**Build & Preview:**
```markdown
# /build-preview

Build project and start preview server.

Steps:
1. Run build: npm run build
2. Start preview: npm run preview
3. Display preview URL
```

**Deploy Preview:**
```markdown
# /deploy-preview

Create deployment preview.

Steps:
1. Run quality checks first
2. Build project
3. Deploy to preview environment
4. Display preview URL
```

**Test Workflow:**
```markdown
# /run-tests

Execute test suite with coverage.

Steps:
1. Run unit tests: npm test
2. Generate coverage report
3. Display results summary
```

**Action items:**
```bash
# Create commands based on package.json scripts
ls -la .claude/commands/
# Review package.json for inspiration
cat package.json | grep scripts -A 20
```

---

### 5. Skills Directory Assessment

**Directory:** `.claude/skills/`

**What to check:**
- [ ] Review project-specific skills from source
- [ ] Determine if skills are transferable
- [ ] Identify need for new custom skills
- [ ] Follow PAI (Skills-as-Containers) principles

**Decision matrix:**

| Source Skill | Port? | Reason |
|--------------|-------|--------|
| `doc-validator` | ✅ If docs-heavy | Useful for markdown validation |
| `link-checker` | ✅ If docs-heavy | Prevents broken links |
| `test-runner` | ⚠️ Adapt | Customize for new test framework |
| `example-validator` | ❌ Rarely | Usually project-specific |

**Custom skill creation guidelines:**
- Keep skills under 500 lines (PAI principle)
- Use UFC pattern (Understand, Focus, Constrain)
- Make skills reusable across similar projects
- Document skill purpose and triggers clearly

**Action items:**
- [ ] DON'T blindly copy skills
- [ ] Use skill structure as template for custom needs
- [ ] Create skills only when repeated patterns emerge
- [ ] Consider if skill should be global vs project-specific

---

### 6. Metadata Validation

**File:** `.claude/metadata.json`

**What to check:**
- [ ] Verify project metadata is accurate
- [ ] Update description to match new project
- [ ] Set appropriate tags
- [ ] Configure project type correctly

**Metadata structure:**
```json
{
  "project_id": "portfolio-redesign",
  "name": "portfolio-redesign",
  "path": "/Users/username/portfolio-redesign",
  "created": "2025-11-08T11:05:40.875Z",
  "lastOpened": "2025-11-08T11:05:40.875Z",
  "type": "migrated",
  "version": "1.0.0",
  "description": "Modern portfolio website built with Astro and Tailwind",
  "tags": ["web", "astro", "portfolio", "tailwind"]
}
```

**Action items:**
- [ ] Keep auto-generated IDs and timestamps
- [ ] Update description to be meaningful
- [ ] Add relevant tags for filtering
- [ ] Set correct project type

---

### 7. Claude.md Context File

**File:** `.claude/Claude.md`

**What to check:**
- [ ] Review project-specific guidelines from source
- [ ] Identify universal patterns vs project-specific ones
- [ ] Document tech stack and conventions
- [ ] Add project-specific workflows

**Template structure:**
```markdown
# Project Name

## Tech Stack
- Framework: Astro 5.x
- Styling: Tailwind CSS
- Animations: Framer Motion
- Content: MDX

## Development Guidelines

### Code Style
- Use TypeScript for all components
- Follow Airbnb style guide
- Prettier for formatting

### Component Structure
- Components in `src/components/`
- Layouts in `src/layouts/`
- Pages in `src/pages/`

### Testing Strategy
- Unit tests for utilities
- Integration tests for components
- E2E tests for critical flows

## Common Tasks

### Development
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

### Quality
```bash
npm run lint       # Run ESLint
npm run format     # Run Prettier
npm run type-check # TypeScript validation
```

## Project-Specific Context
[Add unique considerations, gotchas, and patterns here]
```

**Action items:**
- [ ] Replace generic template with actual project context
- [ ] Document tech stack and key dependencies
- [ ] Add common commands and workflows
- [ ] Include project-specific patterns and conventions

---

## Execution Workflow

### For New Projects (`claude project create`)

```bash
# 1. Project is created from template
claude project create my-project --template web-app

# 2. AUTOMATED CHECKPOINT - Run portability analysis
# This checklist is automatically presented

# 3. Review checklist and select relevant items

# 4. Port selected elements
# - Merge settings permissions
# - Adapt hooks
# - Configure skill rules
# - Create custom commands

# 5. Validate project structure
claude project validate my-project

# 6. Start development
cd <project-path>
```

### For Migrated Projects (`claude project register`)

```bash
# 1. Register existing project
claude project register ~/my-existing-project

# 2. AUTOMATED CHECKPOINT - Run portability analysis
# This checklist is automatically presented

# 3. Ensure basic structure
# (Automatically created if missing)

# 4. Review checklist and identify gaps

# 5. Port elements from other projects
# - Settings/permissions
# - Hooks
# - Skill rules
# - Commands

# 6. Validate and customize
claude project validate my-existing-project
```

---

## Priority Matrix

**Immediate (High Value):**
1. ✅ Merge settings permissions
2. ✅ Adapt validation hooks (if applicable)
3. ✅ Update Claude.md with project context

**Secondary (Medium Value):**
4. ⚠️ Configure skill-rules.json
5. ⚠️ Create common slash commands

**Optional (Low Priority):**
6. 🔵 Custom project-specific skills
7. 🔵 Advanced hooks

---

## Implementation Notes

### Automated Integration Points

**In `create.js` (after project creation):**
```javascript
// After line 202 (after "Next steps" output)
console.log('');
console.log('🔍 Running portability analysis...');
console.log('   Review: Docs/PROJECT_PORTABILITY_CHECKLIST.md');
console.log('');
```

**In `register.js` (after project registration):**
```javascript
// After line 194 (after "Next steps" output)
console.log('');
console.log('🔍 Running portability analysis...');
console.log('   Review: Docs/PROJECT_PORTABILITY_CHECKLIST.md');
console.log('');
```

### Interactive Checklist (Future Enhancement)

```bash
# Future CLI enhancement
claude project analyze-portability

# Interactive prompts:
# - Which source project to compare?
# - Which elements to port?
# - Automatic merging with conflict resolution
```

---

## Examples

### Example 1: Web App from Documentation Project

**Source:** Documentation project (Orchestrator_Project)
**Target:** Web app (portfolio-redesign)

**Port:**
- ✅ Git permissions from settings
- ✅ UserPromptSubmit hook structure (adapted for linting)
- ❌ Doc-specific skills (not relevant)

**Create New:**
- ✅ Web-specific skill rules (Tailwind, Astro)
- ✅ Build/deploy commands
- ✅ Quality check commands

### Example 2: CLI Tool from Web Project

**Source:** Web project (portfolio-redesign)
**Target:** CLI tool project

**Port:**
- ✅ Git/npm permissions
- ✅ Test runner patterns
- ❌ Web-specific hooks

**Create New:**
- ✅ CLI-specific validation hooks
- ✅ Release preparation commands
- ✅ Link checking for docs

---

## Validation

After completing portability analysis:

```bash
# Validate project structure
claude project validate <project-name>

# Test hooks
.claude/hooks/UserPromptSubmit.sh

# Verify permissions
cat .claude/settings.local.json

# Check skill activation
cat .claude/skill-rules.json
```

---

## Troubleshooting

**Issue:** Hooks failing after porting
- **Fix:** Update file paths and project-specific variables
- **Check:** File permissions (`chmod +x`)

**Issue:** Skills not auto-activating
- **Fix:** Verify triggers in skill-rules.json match your workflow
- **Check:** Global settings `enable_auto_activation: true`

**Issue:** Permissions denied
- **Fix:** Add required bash commands to settings.local.json
- **Check:** Pattern matching is correct (e.g., `Bash(npm:*)` vs `Bash(npm *)`)

---

## Component Templates

To make creating custom skills, commands, and agents easier, use the professional templates available in `~/.claude/templates/component-templates/`.

### Available Templates

#### **Skill Templates**
**Location:** `~/.claude/templates/component-templates/skill-templates/`

**Simple Skill:** `simple-skill.md`
```bash
# Copy template to your project
cp ~/.claude/templates/component-templates/skill-templates/simple-skill.md \
   .claude/skills/my-skill/skill.md
```

**Structure includes:** Purpose, capabilities, usage triggers, validation checks, command examples, integration points, success criteria

**Complex Skill:** `complex-skill-template/` - Multi-file structure with patterns, resources, and examples

---

#### **Command Templates**
**Location:** `~/.claude/templates/component-templates/command-templates/`

**Template:** `command-template.md`
```bash
# Copy to commands directory
cp ~/.claude/templates/component-templates/command-templates/command-template.md \
   .claude/commands/my-command.md
```

**Structure includes:** Purpose, prerequisites, step-by-step execution, expected outputs, troubleshooting, success criteria, common issues, variants

---

#### **Agent Templates**
**Location:** `~/.claude/templates/component-templates/agent-templates/`

**Template:** `agent-template.md`
```bash
# Copy to agents directory
cp ~/.claude/templates/component-templates/agent-templates/agent-template.md \
   .claude/agents/my-agent/agent.md
```

**Structure includes:** Purpose & role, capabilities, multi-phase workflow, decision points, quality gates, outputs, error handling, performance metrics

---

### Template Usage in Portability Workflow

**When creating custom skills** (Section 5):
```bash
cp ~/.claude/templates/component-templates/skill-templates/simple-skill.md \
   .claude/skills/component-validator/skill.md
```

**When creating slash commands** (Section 4):
```bash
cp ~/.claude/templates/component-templates/command-templates/command-template.md \
   .claude/commands/validate-components.md
```

**When creating specialized agents**:
```bash
cp ~/.claude/templates/component-templates/agent-templates/agent-template.md \
   .claude/agents/performance-analyzer/agent.md
```

---

### Quick Customization Guide

1. **Replace Placeholders** - All templates use `[Placeholder Text]` format
2. **Remove Unused Sections** - Templates are comprehensive, remove what you don't need
3. **Add Project Context** - Incorporate tech stack, structure, commands
4. **Follow Diet103/PAI** - Keep skills <500 lines, use UFC pattern

---

### Example: Creating a Build Validation Skill

```bash
# 1. Copy template
cp ~/.claude/templates/component-templates/skill-templates/simple-skill.md \
   .claude/skills/build-validator/skill.md

# 2. Customize content
vim .claude/skills/build-validator/skill.md

# 3. Add to skill-rules.json
{
  "skill": "build-validator",
  "triggers": ["build", "bundle size", "deployment"],
  "auto_activate": true,
  "priority": "high"
}
```

---

### Template Benefits

✅ **Consistency** - Standard structure across components
✅ **Completeness** - Comprehensive sections prevent gaps
✅ **Best Practices** - Diet103/PAI principles built-in
✅ **Time Savings** - Start 80% done, customize 20%
✅ **Portability** - Works across all projects

---

## Related Documentation

### Orchestrator Documentation
- [CLI Reference](CLI_REFERENCE.md) - Command documentation
- [Getting Started](GETTING_STARTED.md) - Initial setup
- [Workflow Creation Guide](WORKFLOW_CREATION_GUIDE.md) - Custom workflows
- [Architecture](ARCHITECTURE.md) - System design

### Reference Architecture
- [diet103/claude-code-infrastructure-showcase](https://github.com/diet103/claude-code-infrastructure-showcase) - Architectural foundation and patterns
  - `Docs/workflows/` - Workflow patterns library
  - `Docs/diet103_Validation_System.md` - Validation patterns
  - `Docs/ARCHITECTURE.md` - Meta-orchestration design
  - `Docs/Agentic_Feature_Selection_Workflow.md` - Feature selection patterns

---

**Version:** 1.2.0
**Last Updated:** 2025-11-08
**Change Log:**
- v1.2.0: Added "About This Checklist" section with strategic reference to showcase
- v1.1.0: Added Component Templates section
- v1.0.0: Initial portability checklist

**Maintained By:** Project Orchestrator Team
