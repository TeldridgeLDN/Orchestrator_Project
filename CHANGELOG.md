# Changelog

All notable changes to the Orchestrator Project (diet103) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added - TaskMaster Integration (Opt-in) ✅

**New Feature**: Opt-in TaskMaster installation during `diet103 init`.

#### What Changed
- **New CLI Flag**: `--taskmaster` enables TaskMaster during project initialization
- **Interactive Prompt**: Users can choose to include TaskMaster during setup
- **Non-Interactive Support**: `--no-interactive` flag properly bypasses prompts

#### Installation Process
When TaskMaster is enabled during `diet103 init`:

1. **Directory Structure** (`.taskmaster/`)
   - `tasks/` - Task storage directory
   - `docs/` - Documentation directory
   - `reports/` - Analysis reports directory
   - `templates/` - Template files directory

2. **Initial Files**
   - `tasks/tasks.json` - Empty task list with project metadata
   - Project name automatically populated from init

3. **MCP Configuration**
   - Adds TaskMaster AI server to `.mcp.json`
   - Configured with environment variable placeholders
   - Disabled by default until API keys are added

4. **Package Management**
   - Installs `task-master-ai` as dev dependency (if `package.json` exists)
   - Falls back to `npx` usage (no installation) if no package.json

5. **API Key Guidance**
   - Displays required API keys
   - Shows `.env` file location
   - References `.env.example` for format

#### Usage Examples

**Interactive Mode** (default):
```bash
diet103 init
# Prompts:
# - Project name
# - Description
# - Include TaskMaster? [y/N]
```

**Non-Interactive WITH TaskMaster**:
```bash
diet103 init --name="MyProject" --taskmaster --no-interactive
```

**Non-Interactive WITHOUT TaskMaster**:
```bash
diet103 init --name="MyProject" --no-interactive
```

#### Implementation Files
- **New**: `lib/init/taskmaster_init.js` - TaskMaster installation module (383 lines)
  - `initializeTaskMaster()` - Main installation function
  - `validateTaskMasterInstallation()` - Validation helper
  - Creates directories, tasks.json, updates .mcp.json
  - Handles npm package installation (or npx fallback)
  - Provides API key guidance

- **Modified**: `lib/commands/init.js`
  - Fixed Commander.js parameter handling (pathArg, cmdOptions)
  - Added `initializeTaskMasterWrapper()` function
  - Integrated TaskMaster installation step
  - Fixed `--no-interactive` flag handling
  - Fixed variable scope issue (`coreFilesCreated`)

#### Testing
✅ **Non-Interactive WITHOUT TaskMaster**:
- Created diet103 project structure
- Skipped TaskMaster installation
- No `.taskmaster/` directory created

✅ **Non-Interactive WITH TaskMaster**:
- Created diet103 project structure
- Created `.taskmaster/` directories
- Created `tasks.json` with project metadata
- Added TaskMaster to `.mcp.json` (disabled until keys added)
- Displayed API key requirements
- Used npx fallback (no package.json)

#### Benefits
- ✅ Optional TaskMaster adoption
- ✅ Single-step initialization
- ✅ Proper MCP integration
- ✅ Clear API key guidance
- ✅ Works with or without package.json

---

### Added - Health Monitoring with File Lifecycle Metrics ✅

**Enhanced Feature**: `diet103 health` command now includes File Lifecycle organization metrics.

#### What Changed
- **New Component**: File Organization (10% weight) added to health scoring
- **Weight Rebalancing**: 
  - Structure: 40% → 35%
  - Hooks: 30% → 25%
  - Skills: 20% (unchanged)
  - Config: 10% (unchanged)
  - Files: 0% → 10% (NEW)

#### File Organization Metrics
The new Files component tracks:
- **Classification Coverage (50%)**: Percentage of files classified into tiers
- **Pending Archive (30%)**: Files waiting to be archived (fewer = better)
- **Misplaced Files (20%)**: Files in wrong locations (fewer = better)

#### Scoring Details
- **100 points max**: Fully classified, no pending archives, no misplaced files
- **0 points**: File Lifecycle not initialized (shows warning, not critical)
- **Detailed breakdown**: Shows tier distribution (CRITICAL, PERMANENT, EPHEMERAL, ARCHIVED)

#### Example Output
```
Files        ████████████████████ 100% (10% weight)
  → Classified files: 150/150 (100%)
  → By tier: CRITICAL(12), PERMANENT(45), EPHEMERAL(8), ARCHIVED(85)
```

#### Implementation
- Modified `lib/utils/project-health.js`: Added `calculateFileOrganizationScore()`
- Modified `lib/commands/health.js`: Added Files component to display
- Reads `.file-manifest.json` for metrics
- Non-blocking: Returns 0 if File Lifecycle not initialized

#### Benefits
- ✅ Visibility into file organization health
- ✅ Encourages File Lifecycle adoption
- ✅ Proactive alerts for pending archives/misplaced files
- ✅ Integrated with existing health infrastructure

---

### Added - Documentation Templates ✅

**New Standard Component**: Five documentation templates added to `templates/documentation/`.

#### Template Files
- **`README.md`** (142 lines) - Project overview, quick start, features
  - Structured README with all standard sections
  - Installation, usage, configuration, troubleshooting
  - Follows Documentation Economy Tier 1 guidelines

- **`ARCHITECTURE.md`** (238 lines) - System architecture and design
  - System diagrams (Mermaid + ASCII art)
  - Core components breakdown
  - Data flow documentation
  - Security and deployment architecture

- **`ADR_TEMPLATE.md`** (203 lines) - Architectural Decision Record template
  - Context, Decision, Rationale, Consequences
  - Alternatives considered section
  - Immutable decision documentation pattern

- **`CONTRIBUTING.md`** (407 lines) - Contribution guidelines
  - Getting started, development workflow
  - Coding standards, commit guidelines
  - PR process, testing requirements

- **`API.md`** (496 lines) - API documentation template
  - Authentication methods (API key, JWT)
  - Rate limiting, error handling
  - Complete endpoint documentation with examples
  - Webhooks and SDK examples

#### Features
- All templates follow Documentation Economy rules (Tier 1)
- Concise, scannable, well-structured
- Include helpful comments for customization
- Ready-to-use examples and patterns

#### Benefits
- ✅ Consistent documentation across projects
- ✅ Reduces time to start documenting
- ✅ Best practices built-in
- ✅ Non-intrusive (users can modify or delete)

---

## [1.1.1] - 2025-11-14

### Added - Core Infrastructure Files ✅

**New Standard Components**: Three core infrastructure files now automatically installed in all diet103 projects.

#### Infrastructure Files
- **`.mcp.json`** - MCP Server Configuration
  - Pre-configured TaskMaster AI server
  - API key placeholders for all major AI providers (Anthropic, Perplexity, OpenAI, Google, XAI, Mistral)
  - Disabled by default for security
  - Standard JSON format for Claude Code integration

- **`.env.example`** - Environment Variable Template
  - Documents required and optional API keys
  - Clear instructions: "Copy to .env and never commit .env"
  - Extensible for project-specific keys
  - Security-first design with placeholder values

- **`.gitignore`** - Git Ignore Configuration
  - 6 comprehensive categories: Environment/Secrets, Dependencies, IDE/Editors, Build Outputs, Test Coverage, diet103-specific
  - Multi-language support (Node.js, Python)
  - File Lifecycle Management backup exclusions
  - Optional TaskMaster task file exclusions

#### Implementation
- **Modified**: `lib/utils/diet103-repair.js` - Added core infrastructure installation (~110 lines)
- **Modified**: `lib/commands/init.js` - Added core files to initialization (~40 lines)
- **Behavior**: Non-blocking installation, only creates if files don't exist
- **Triggers**: Automatically installed via `diet103 init` and `diet103 project register`

#### Documentation
- Created `CORE_INFRASTRUCTURE_IMPLEMENTATION_COMPLETE.md` (340 lines) - Complete technical details
- Created `.claude/rules/core-infrastructure-standard.md` (222 lines) - Platform-agnostic AI agent guidelines
- Created `PHASE1_CORE_INFRASTRUCTURE_COMPLETE.md` (244 lines) - Executive summary and quick reference
- Created `PHASE1_DEPLOYMENT_CHECKLIST.md` - Deployment procedures and monitoring plan
- Updated `CORE_INFRASTRUCTURE_ANALYSIS.md` - Added Phase 1 completion status

### Changed
- **Version Bump**: 1.1.0 → 1.1.1 (patch version for additive infrastructure)
- **Installation Count**: Now reports 18 components (was 15) when creating fresh projects

### Technical Details

**Installation Behavior**:
- Files created during `repairDiet103Infrastructure()` execution
- Existence checks prevent overwrites of existing configurations
- Failures logged as warnings, not errors (non-blocking)
- Tracked separately in `result.installed.coreInfrastructure` array

**Philosophy Alignment**:
- ✅ PAI: Filesystem-based context management, progressive disclosure, skills-as-containers
- ✅ diet103: Auto-activation, easy project creation, 500-line context rule, self-contained `.claude/` directories

**Testing**:
- ✅ Fresh project initialization verified
- ✅ Existing project registration verified
- ✅ File content validation completed
- ✅ Edge cases handled (existing files, failures)

### Security Improvements
- **Git Safety**: `.env` files protected from accidental commits via `.gitignore`
- **Secret Management**: Clear documentation via `.env.example` template
- **Default Secure**: MCP servers disabled by default, user must explicitly enable
- **No Hardcoded Secrets**: All API keys externalized to environment variables

### Integration Readiness
- **MCP Ready**: Claude Code integration pre-configured
- **TaskMaster AI**: Pre-configured server, just add API keys
- **Multi-Platform**: Works with Claude Code, Cursor, Windsurf, Cline, Roo Code
- **Extensible**: Easy to add new MCP servers or environment variables

### Migration
**No Migration Required** - Changes are additive only:
- Existing projects unaffected until next registration
- Files only created if missing
- No breaking changes to existing functionality
- Safe to deploy immediately

---

## [1.1.0] - 2025-11-XX

### Added - File Lifecycle Management System

**New Standard Component**: Automatic document organization and classification system.

#### Infrastructure Files
- **`.file-manifest.json`** - Document classification and lifecycle tracking
- **`.claude/archive/`** - Long-term storage for completed/obsolete documents
- **`.claude/backups/`** - Automatic backups of important files

#### Implementation
- Added `lib/init/file_lifecycle_init.js` - Initialization logic
- Modified `lib/utils/diet103-repair.js` - Integrated into repair system
- Created platform-agnostic rule: `.claude/rules/file-lifecycle-standard.md`

#### Documentation
- Created `Docs/FILE_LIFECYCLE_STANDARD_INFRASTRUCTURE.md` - Complete technical guide
- Created `FILE_LIFECYCLE_NOW_STANDARD_COMPLETE.md` - Implementation summary

### Philosophy
- **PAI Alignment**: Filesystem-based context, progressive disclosure
- **diet103 Alignment**: Auto-activation, easy project creation, self-contained structure

---

## [1.0.0] - 2025-XX-XX

### Added - Initial Release

**Core Infrastructure**:
- `.claude/` directory structure
- `Claude.md` project context file
- `metadata.json` project manifest
- `skill-rules.json` auto-activation rules
- `hooks/` directory with UserPromptSubmit.js and PostToolUse.js
- `skills/`, `commands/`, `agents/`, `resources/` directories

**Commands**:
- `diet103 init` - Initialize new project
- `diet103 validate` - Validate infrastructure
- `diet103 health` - Check project health
- `diet103 project register` - Register project in global registry
- `diet103 project list` - List all registered projects

**Infrastructure Detection & Repair**:
- Automatic gap detection
- Auto-repair functionality
- Consistency validation
- Health scoring system

**Project Registry**:
- Global project tracking at `~/.claude/projects-registry.json`
- MCP validation and auto-fixing
- Bulk registration support

---

## Version History Summary

| Version | Date | Description |
|---------|------|-------------|
| **1.1.1** | **2025-11-14** | **Core Infrastructure Files** ✅ |
| 1.1.0 | 2025-11-XX | File Lifecycle Management |
| 1.0.0 | 2025-XX-XX | Initial Release |

---

## Semantic Versioning

- **MAJOR** (X.0.0): Breaking changes requiring migration
- **MINOR** (1.X.0): New features (backward compatible)
- **PATCH** (1.0.X): Bug fixes and minor enhancements (backward compatible)

---

## How to Use This Changelog

### For Users
- **Added**: New features and capabilities
- **Changed**: Modifications to existing functionality
- **Fixed**: Bug fixes and corrections
- **Deprecated**: Features being phased out
- **Security**: Security-related changes

### For Developers
- Review **Technical Details** for implementation specifics
- Check **Migration** sections when updating
- Follow **Philosophy Alignment** for new contributions

---

**Current Version**: 1.1.1 - Production ✅  
**Status**: Stable, actively maintained  
**Next Planned**: Phase 2 features (based on user feedback)

