# Core Infrastructure Standard

**Version**: 1.0.0  
**Applies to**: All diet103 projects  
**Platform**: Agnostic (Claude, Cursor, Windsurf, Cline, Roo Code, etc.)

## Overview

Every diet103 project includes three core infrastructure files that provide security, configuration, and integration readiness. These files are automatically created during project initialization and should be understood by all AI coding assistants.

## The Three Core Files

### 1. `.mcp.json` - MCP Server Configuration

**Location**: Project root  
**Purpose**: Configure Model Context Protocol (MCP) servers for Claude Code integration  
**Format**: JSON

**Standard Template**:
```json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "",
        "PERPLEXITY_API_KEY": "",
        "OPENAI_API_KEY": "",
        "GOOGLE_API_KEY": "",
        "XAI_API_KEY": "",
        "MISTRAL_API_KEY": ""
      },
      "disabled": true
    }
  }
}
```

**Agent Guidelines**:
- **Do NOT** read or display API keys from this file
- **Do NOT** enable servers without user permission
- **DO** suggest enabling TaskMaster AI if user wants task management
- **DO** explain that API keys need to be filled in from `.env.example`

**User Setup**:
1. Copy values from `.env` to `.mcp.json` `env` section
2. Change `"disabled": true` to `"disabled": false`
3. Restart Claude Code to activate MCP servers

### 2. `.env.example` - Environment Variable Template

**Location**: Project root  
**Purpose**: Document required environment variables without exposing secrets  
**Format**: Shell environment file (comments + KEY=value)

**Standard Template**:
```bash
# API Keys for AI Services
# Copy this file to .env and fill in your actual keys
# Never commit .env to version control!

# Required for TaskMaster AI
ANTHROPIC_API_KEY=your_anthropic_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here

# Optional AI Service Keys
OPENAI_API_KEY=your_openai_key_here
GOOGLE_API_KEY=your_google_key_here
XAI_API_KEY=your_xai_key_here
MISTRAL_API_KEY=your_mistral_key_here

# Project-Specific Keys
# Add your custom API keys below
```

**Agent Guidelines**:
- **Do NOT** read or display `.env` contents (contains actual secrets)
- **DO** suggest copying `.env.example` to `.env` if user needs to set up API keys
- **DO** explain that `.env` is gitignored and safe for secrets
- **DO** add new keys to `.env.example` when user adds project-specific services

**User Setup**:
```bash
cp .env.example .env
# Edit .env and fill in actual API keys
```

### 3. `.gitignore` - Git Ignore Configuration

**Location**: Project root  
**Purpose**: Prevent accidental commits of sensitive files and build artifacts  
**Format**: Git ignore patterns

**Standard Categories**:
1. **Environment & Secrets**: `.env*`, `*.key`, `*.pem`, certificates
2. **Dependencies**: `node_modules/`, `venv/`, `__pycache__/`
3. **IDE & Editors**: `.vscode/`, `.idea/`, `.DS_Store`
4. **Build Outputs**: `dist/`, `build/`, `*.log`
5. **Test Coverage**: `coverage/`, `htmlcov/`
6. **diet103 Specific**: File Lifecycle backups, optional TaskMaster exclusions

**Agent Guidelines**:
- **DO** add new patterns when user introduces new tools or frameworks
- **DO** maintain category organization (add comments when adding new sections)
- **DO** suggest uncommenting TaskMaster exclusion if user wants tasks in Git
- **DO NOT** remove existing patterns without user permission

**Common Additions**:
```gitignore
# When user adds Python:
*.egg-info/
.pytest_cache/

# When user adds Rust:
target/
Cargo.lock

# When user adds Docker:
.dockerignore
docker-compose.override.yml
```

## Automatic Installation

These files are automatically created when:
1. Running `diet103 init` for new projects
2. Running `diet103 project register` for existing projects (if gaps detected)

**Behavior**:
- Files are only created if they don't already exist
- Existing files are never overwritten
- Installation is non-blocking (warnings logged, not errors)

## Integration with Other diet103 Features

### File Lifecycle Management
- `.gitignore` includes File Lifecycle backup patterns
- Archive and backup directories are protected from Git

### TaskMaster AI
- `.mcp.json` pre-configures TaskMaster AI server
- `.env.example` documents required API keys
- `.gitignore` optionally excludes TaskMaster task files

### Project Registry
- Core infrastructure files checked during project registration
- Missing files trigger auto-repair (if infrastructure score < 100%)

## Platform-Specific Notes

### Claude Code
- Reads `.mcp.json` automatically on startup
- Restart required after enabling MCP servers
- MCP tools become available once enabled

### Cursor
- Can use `.mcp.json` via Cursor-specific MCP integration
- May require additional setup in Cursor settings

### Windsurf / Cline / Roo Code
- Follow diet103 conventions via `.claude/` directory
- MCP integration varies by platform

### Platform Agnostic Design
All three files use standard formats:
- JSON (`.mcp.json`)
- Shell environment (`.env.example`)
- Git ignore patterns (`.gitignore`)

This ensures compatibility across all AI coding assistants and development environments.

## Security Best Practices

### For AI Agents
1. **Never read `.env`**: Only read `.env.example`
2. **Never display API keys**: Even if visible in `.mcp.json`, don't echo them
3. **Suggest secure practices**: Remind users to never commit `.env`

### For Users
1. **Always use `.env` for secrets**: Never hardcode API keys
2. **Verify `.gitignore`**: Ensure `.env` is listed before first commit
3. **Keep `.env.example` updated**: Add placeholders for new keys

## Troubleshooting

### MCP Server Not Working
**Symptoms**: TaskMaster AI tools not available in Claude Code  
**Solutions**:
1. Check `.mcp.json` has API keys filled in
2. Ensure `"disabled": false`
3. Restart Claude Code
4. Verify API keys are valid

### Git Committing Secrets
**Symptoms**: Git warning about API keys in commits  
**Solutions**:
1. Verify `.gitignore` includes `.env`
2. Remove `.env` from Git history if already committed
3. Rotate exposed API keys immediately

### Environment Variables Not Loading
**Symptoms**: Application can't find API keys  
**Solutions**:
1. Ensure `.env` exists (copy from `.env.example`)
2. Check `.env` has actual values (not placeholders)
3. Restart application/terminal to reload environment

## Documentation

Full implementation details: `Docs/CORE_INFRASTRUCTURE_IMPLEMENTATION_COMPLETE.md`

## Version History

- **1.0.0** (2025-11-14): Initial core infrastructure standard

---

**Maintained by**: diet103 Orchestrator Project  
**Platform**: Agnostic (all AI coding assistants)  
**Rule Priority**: High (security-related)

