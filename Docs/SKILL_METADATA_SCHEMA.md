# Skill Metadata Schema

## Overview

This document defines the complete metadata schema for skills in the Orchestrator system. The metadata enables intelligent skill discovery, auto-activation, and context-aware suggestions.

## Schema Definition

```json
{
  "id": "string (required)",
  "name": "string (required)",
  "type": "string (required: 'skill' | 'meta-skill' | 'workflow')",
  "version": "string (required: semver format)",
  "description": "string (required: detailed description)",
  "one_liner": "string (optional: brief 1-line summary for suggestions)",
  
  "architecture": {
    "pattern": "string (e.g., 'PAI Skills-as-Containers')",
    "diet103_compatible": "boolean",
    "progressive_disclosure": "boolean"
  },
  
  "workflows": ["array of workflow names"],
  "features": ["array of feature descriptions"],
  
  "dependencies": {
    "node": "string (version requirement)",
    "npm": "string (version requirement)",
    "other": "object (other dependencies)"
  },
  
  "token_footprint": "string (description of token usage)",
  "progressive_disclosure": "boolean",
  
  "auto_activation": {
    "enabled": "boolean (default: false)",
    "triggers": ["array of keyword phrases that auto-activate this skill"],
    "file_patterns": ["array of glob patterns that match relevant files"],
    "directory_patterns": ["array of glob patterns that match relevant directories"],
    "project_types": ["array of project types this skill is relevant for"]
  },
  
  "suggestions": {
    "enabled": "boolean (default: true)",
    "keywords": ["array of keywords for prompt-based suggestions"],
    "file_patterns": ["array of glob patterns for file-based suggestions"],
    "directory_patterns": ["array of glob patterns for directory-based suggestions"],
    "project_types": ["array of project types for type-based suggestions"],
    "priority": "number (1-10, higher = more aggressively suggested)"
  },
  
  "created": "string (ISO date)",
  "updated": "string (ISO date)",
  "status": "string ('active' | 'deprecated' | 'experimental')",
  "ufc_compliant": "boolean"
}
```

## Field Descriptions

### Core Fields

- **id**: Unique identifier for the skill (matches directory name)
- **name**: Human-readable name
- **type**: Skill classification (skill, meta-skill, or workflow)
- **version**: Semantic version number
- **description**: Detailed description of what the skill does
- **one_liner**: Brief summary (max ~100 chars) for quick suggestions

### Architecture Fields

- **architecture.pattern**: Design pattern used (e.g., "PAI Skills-as-Containers")
- **architecture.diet103_compatible**: Whether skill follows diet103 principles
- **architecture.progressive_disclosure**: Whether skill uses progressive disclosure

### Auto-Activation

Controls when a skill automatically loads into context:

- **auto_activation.enabled**: Whether auto-activation is enabled
- **auto_activation.triggers**: Keyword phrases that trigger activation
- **auto_activation.file_patterns**: File patterns that trigger activation (e.g., `**/*.py` for Python-related skills)
- **auto_activation.directory_patterns**: Directory patterns that trigger activation (e.g., `**/tests/**` for test-related skills)
- **auto_activation.project_types**: Project types that trigger activation (e.g., `["web", "api"]`)

### Suggestions

Controls when a skill is suggested (but not auto-loaded):

- **suggestions.enabled**: Whether suggestions are enabled
- **suggestions.keywords**: Keywords in user prompts that trigger suggestions
- **suggestions.file_patterns**: File patterns that trigger suggestions
- **suggestions.directory_patterns**: Directory patterns that trigger suggestions
- **suggestions.project_types**: Project types that trigger suggestions
- **suggestions.priority**: Suggestion priority (1-10, higher = more aggressive)

## Auto-Activation vs. Suggestions

### Auto-Activation
- **Loads full skill context immediately**
- **Higher token cost**
- Use for: Skills that are essential for specific contexts

### Suggestions
- **Only shows suggestion message**
- **Zero token cost until accepted**
- Use for: Skills that might be helpful but not essential

## Example: Documentation Validator Skill

```json
{
  "id": "doc-validator",
  "name": "Documentation Validator",
  "type": "skill",
  "version": "1.0.0",
  "description": "Validates markdown documentation for quality, consistency, and completeness",
  "one_liner": "Check docs for quality issues and broken links",
  
  "architecture": {
    "pattern": "PAI Skills-as-Containers",
    "diet103_compatible": true,
    "progressive_disclosure": true
  },
  
  "workflows": ["validate", "fix", "report"],
  "features": [
    "Markdown linting",
    "Link checking",
    "Style consistency",
    "Frontmatter validation"
  ],
  
  "dependencies": {
    "node": ">=20.0.0"
  },
  
  "token_footprint": "minimal (~400 tokens)",
  
  "auto_activation": {
    "enabled": false,
    "triggers": [],
    "file_patterns": [],
    "directory_patterns": [],
    "project_types": []
  },
  
  "suggestions": {
    "enabled": true,
    "keywords": [
      "documentation",
      "validate docs",
      "check markdown",
      "broken links",
      "doc quality"
    ],
    "file_patterns": [
      "**/*.md",
      "**/docs/**/*.md",
      "**/README.md"
    ],
    "directory_patterns": [
      "**/docs/**",
      "**/documentation/**"
    ],
    "project_types": ["docs", "library", "framework"],
    "priority": 7
  },
  
  "created": "2025-01-01",
  "updated": "2025-01-15",
  "status": "active",
  "ufc_compliant": true
}
```

## Example: Test Runner Skill

```json
{
  "id": "test-runner",
  "name": "Test Runner",
  "type": "skill",
  "version": "1.0.0",
  "description": "Intelligent test execution and reporting for multiple test frameworks",
  "one_liner": "Run tests with smart framework detection",
  
  "auto_activation": {
    "enabled": true,
    "triggers": [
      "run tests",
      "test suite",
      "execute tests"
    ],
    "file_patterns": [
      "**/*.test.js",
      "**/*.spec.js",
      "**/*_test.py",
      "**/test_*.py"
    ],
    "directory_patterns": [
      "**/tests/**",
      "**/test/**",
      "**/__tests__/**"
    ],
    "project_types": ["nodejs", "python", "web"]
  },
  
  "suggestions": {
    "enabled": true,
    "keywords": [
      "testing",
      "unit test",
      "integration test",
      "test coverage"
    ],
    "file_patterns": [
      "**/*.test.js",
      "**/*.spec.js"
    ],
    "directory_patterns": [
      "**/tests/**"
    ],
    "project_types": ["nodejs", "python"],
    "priority": 8
  }
}
```

## Best Practices

### 1. Choose Auto-Activation Wisely
- Only enable for skills that are frequently needed in specific contexts
- Consider token cost (each auto-activated skill adds to context)
- Test that patterns aren't too broad (avoid false positives)

### 2. Make Suggestions Discoverable
- Use clear, specific keywords that users might type
- Include common variations and synonyms
- Keep `one_liner` concise and action-oriented

### 3. File and Directory Patterns
- Use glob patterns (supported via `minimatch`)
- Be specific enough to avoid false matches
- Test patterns against real project structures

### 4. Priority Guidelines
- **1-3**: Low priority, niche use cases
- **4-6**: Medium priority, situational use
- **7-9**: High priority, frequently useful
- **10**: Critical, almost always relevant

### 5. Token Efficiency
- Prefer suggestions over auto-activation when possible
- Use progressive disclosure in skill documentation
- Keep skill metadata minimal (only essential patterns)

## Validation

Skills should validate their metadata against this schema on load. Invalid metadata should log warnings but not prevent skill loading.

## Backward Compatibility

Skills without `suggestions` fields will:
- Fall back to `auto_activation` patterns for suggestions
- Default to `enabled: true` for suggestions
- Use `priority: 5` (medium)

Skills without `one_liner` will:
- Use first 100 characters of `description`
- Display as "{name} - {truncated description}"

## Future Extensions

Potential future additions to the schema:
- `cost_estimate`: Token usage estimation
- `conflicts_with`: List of incompatible skills
- `recommends`: List of complementary skills
- `telemetry`: Usage tracking configuration

