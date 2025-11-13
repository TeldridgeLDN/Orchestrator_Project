# Skill Structure Specification: Formalized 500-Line Rule

**Version:** 1.0  
**Status:** Formal Specification  
**Last Updated:** 2025-11-11

---

## Executive Summary

This specification formalizes the diet103 "500-line rule" into a structured documentation pattern that enables progressive disclosure of information. By organizing skills into explicit detail levels, we achieve token efficiency, improved navigation, and predictable user experience—all while adhering to the core principle of **"orchestration > intelligence"**.

**Core Principle:** Keep files under 500 lines to avoid context window limits and enable lazy loading.

**Implementation:** Zero-code, documentation-driven pattern using filesystem organization.

---

## 1. Philosophy & Principles

### 1.1 The 500-Line Rule

**Origin:** diet103 architecture  
**Purpose:** Prevent context window overflow and enable progressive disclosure

**The Rule:**
> "Each documentation file should contain fewer than 500 lines to ensure it can be loaded into Claude's context without overwhelming the token budget."

**Rationale:**
- **Token Efficiency:** Smaller files = selective loading = lower token costs
- **Cognitive Load:** Humans and AI both benefit from bite-sized information chunks
- **Lazy Loading:** Load only what's needed, when it's needed
- **Navigation:** Clear boundaries make content discovery easier

### 1.2 Progressive Disclosure

**Definition:** Present information in layers, from high-level overview to deep technical details, allowing users to drill down only as needed.

**Benefits:**
- **Faster onboarding:** Quick-ref gets you started immediately
- **Scalable learning:** Progress from basics to advanced at your own pace
- **Reduced cognitive load:** Don't present everything at once
- **Token efficiency:** Load only the detail level required

### 1.3 Core Design Principles

1. **User-Controlled Detail Levels**
   - Users explicitly request the detail level they need
   - No AI guessing or implicit loading
   - Predictable, deterministic behavior

2. **File-Based Organization**
   - Pure orchestration (filesystem structure)
   - No AI inference required
   - Cross-platform compatible

3. **Backward Compatibility**
   - Existing skills continue to work
   - Gradual migration, not big-bang replacement
   - No breaking changes to hooks or tools

4. **Self-Documenting Structure**
   - File names indicate content and scope
   - Navigation is obvious from directory structure
   - Minimal external tooling required

---

## 2. Standard Structure Pattern

### 2.1 Directory Layout

```
<skill-name>/
├── SKILL.md                      # Main entry point (always loaded, ~300 lines)
├── metadata.json                 # Skill manifest
└── resources/                    # Detail-level resources (lazy-loaded)
    ├── quick-ref.md             # <100 lines - TL;DR cheat sheet
    ├── setup-guide.md           # <500 lines - Detailed setup instructions
    ├── api-reference.md         # <500 lines - API/technical documentation
    ├── troubleshooting.md       # <500 lines - Common issues and solutions
    └── examples/                # Optional: Extended examples
        ├── basic-usage.md
        └── advanced-patterns.md
```

### 2.2 File Purposes

#### SKILL.md (Main Entry Point)
**Size:** ~300 lines (target), max 500 lines  
**Always Loaded:** Yes  
**Purpose:** Overview + navigation hub

**Must Contain:**
- **Skill Overview** (50-100 lines)
  - What the skill does
  - When to use it
  - Key capabilities
  
- **Quick Start** (50-100 lines)
  - Most common 3-5 use cases
  - Minimal examples
  - "Get me productive in 2 minutes"
  
- **Available Resources** (50-100 lines)
  - Navigation to detail levels
  - Clear descriptions of what each resource contains
  - Estimated reading time for each resource
  
- **Metadata Section** (20-50 lines)
  - Version information
  - Dependencies
  - Prerequisites
  - Related skills

**Example Structure:**
```markdown
# Skill Name

## Overview
[What this skill does, when to use it]

## Quick Start
[3-5 most common tasks with minimal examples]

## Available Resources
When you need more detail, request:
- `quick-ref` - Command cheat sheet (2 min read)
- `setup-guide` - Complete setup (10 min read)
- `api-reference` - Technical API docs (15 min read)
- `troubleshooting` - Common issues (5 min read)

## Navigation
[Links to each resource file]

## Metadata
- Version: 1.0.0
- Dependencies: None
- Prerequisites: Basic CLI knowledge
```

#### resources/quick-ref.md
**Size:** <100 lines (hard limit)  
**Always Loaded:** No (on-demand)  
**Purpose:** Rapid reference for experienced users

**Must Contain:**
- **Command Cheat Sheet** (30-50 lines)
  - Most common commands/functions
  - One-line descriptions
  - Minimal syntax examples
  
- **Quick Lookup Tables** (30-50 lines)
  - Parameters and options
  - Return values
  - Common patterns

**Format:** Dense, tabular, scannable

**Example:**
```markdown
# Quick Reference

## Common Commands
| Command | Purpose | Example |
|---------|---------|---------|
| `init` | Initialize | `skill init --config` |
| `run` | Execute | `skill run task` |

## Parameters
- `--config <file>` - Configuration file
- `--verbose` - Debug output
```

#### resources/setup-guide.md
**Size:** <500 lines  
**Always Loaded:** No (on-demand)  
**Purpose:** Comprehensive setup and configuration

**Must Contain:**
- **Prerequisites** (50-100 lines)
- **Installation Steps** (100-200 lines)
- **Configuration** (100-200 lines)
- **Verification** (50-100 lines)

**Format:** Step-by-step, tutorial-style

#### resources/api-reference.md
**Size:** <500 lines  
**Always Loaded:** No (on-demand)  
**Purpose:** Technical API/function documentation

**Must Contain:**
- **Function Signatures** (100-200 lines)
- **Parameters** (100-200 lines)
- **Return Values** (50-100 lines)
- **Error Handling** (50-100 lines)

**Format:** Technical reference, precise

#### resources/troubleshooting.md
**Size:** <500 lines  
**Always Loaded:** No (on-demand)  
**Purpose:** Common problems and solutions

**Must Contain:**
- **Common Issues** (200-300 lines)
  - Symptom
  - Cause
  - Solution
  
- **FAQ** (100-150 lines)
- **Debug Techniques** (50-100 lines)

**Format:** Problem-solution pairs, FAQ

---

## 3. Naming Conventions

### 3.1 File Names

**Rules:**
- Use kebab-case: `setup-guide.md`, `api-reference.md`
- Be descriptive: Name should indicate content
- Use standard names from this spec when applicable
- Keep names under 30 characters

**Standard Resource Names:**
- `quick-ref.md` - Quick reference/cheat sheet
- `setup-guide.md` - Setup and configuration
- `api-reference.md` - API/technical docs
- `troubleshooting.md` - Common issues
- `examples.md` or `examples/` - Extended examples

**Custom Resources:** Allowed, but should follow the pattern

### 3.2 Section Headers

**Rules:**
- Use markdown ATX headers (`#`, `##`, `###`)
- First level (`#`) for main title only
- Second level (`##`) for major sections
- Third level (`###`) for subsections
- Keep headers descriptive and scannable

---

## 4. Cross-Referencing Guidelines

### 4.1 Linking Between Detail Levels

**From SKILL.md to Resources:**
```markdown
For detailed setup instructions, see [Setup Guide](resources/setup-guide.md).

When you need technical details, request the [API Reference](resources/api-reference.md).
```

**From Resources Back to SKILL.md:**
```markdown
← [Back to Overview](../SKILL.md)
```

**Between Resources:**
```markdown
For troubleshooting configuration issues, see [Troubleshooting Guide](troubleshooting.md).
```

### 4.2 Natural Language Requests

Users can request resources using natural language:

**Examples:**
- "Show me the quick reference"
- "I need the setup guide"
- "What's in the troubleshooting doc?"
- "Load the API reference"

**Pattern:** hooks detect these patterns and load the appropriate resource

---

## 5. Content Organization Best Practices

### 5.1 Progressive Detail Principle

**Order information from least to most detailed:**

1. **SKILL.md:** "I need to accomplish X" → Quick Start
2. **quick-ref.md:** "What's the command syntax?" → Cheat Sheet
3. **setup-guide.md:** "How do I set this up?" → Step-by-step
4. **api-reference.md:** "What are all the parameters?" → Technical specs
5. **troubleshooting.md:** "It's not working" → Problem-solution

### 5.2 Don't Repeat Yourself (DRY)

**Instead of repeating content across files:**
```markdown
<!-- BAD: Repeating setup steps in multiple files -->

<!-- GOOD: Reference the canonical source -->
For setup instructions, see the [Setup Guide](resources/setup-guide.md).
```

**Exception:** Quick Start in SKILL.md can include *minimal* examples even if they're covered in detail elsewhere. The Quick Start is the "get productive fast" section.

### 5.3 Scannability

**Make content easy to skim:**
- Use tables for parameters/options
- Use bullet lists for steps
- Use code blocks for commands/examples
- Use bold for key terms
- Use section headers frequently

**Example:**
```markdown
## Installation

**Prerequisites:**
- Node.js 16+
- Git

**Steps:**
1. Clone the repository
2. Install dependencies: `npm install`
3. Run setup: `npm run setup`
```

---

## 6. Size Limits and Enforcement

### 6.1 Hard Limits

| File | Target | Maximum | Enforcement |
|------|--------|---------|-------------|
| SKILL.md | 300 lines | 500 lines | Manual review |
| quick-ref.md | 80 lines | 100 lines | Must enforce |
| setup-guide.md | 400 lines | 500 lines | Manual review |
| api-reference.md | 400 lines | 500 lines | Manual review |
| troubleshooting.md | 400 lines | 500 lines | Manual review |

### 6.2 Measuring Line Count

**Include:**
- All lines (including blank lines)
- Comments
- Code blocks
- Headers

**Command:**
```bash
wc -l SKILL.md
```

### 6.3 Handling Oversize Content

**If a file exceeds its limit:**

**Option 1: Split into sub-resources**
```
resources/
├── api-reference.md        # Core API (500 lines)
└── api-reference-ext.md   # Extended API (additional 300 lines)
```

**Option 2: Create subdirectory**
```
resources/
└── api/
    ├── core.md
    ├── advanced.md
    └── plugins.md
```

**Option 3: External linking**
```markdown
For complete API documentation, see [External Docs](https://example.com/full-api-docs).
```

---

## 7. Migration from Unstructured Skills

### 7.1 Assessment Criteria

**Determine if a skill needs restructuring:**

| Criterion | Needs Restructuring? |
|-----------|---------------------|
| Single file > 500 lines | YES |
| No clear detail levels | YES |
| Poor navigation | YES |
| User confusion about where to find info | YES |
| Content is well-organized already | NO (optional) |

### 7.2 Migration Process

**Step 1: Analyze Current Content**
- Identify main sections
- Determine natural detail level boundaries
- Note cross-references

**Step 2: Create Target Structure**
- Create directory structure
- Create empty files from templates
- Plan content distribution

**Step 3: Migrate Content**
- Copy overview → SKILL.md
- Extract commands → quick-ref.md
- Move setup → setup-guide.md
- Move API docs → api-reference.md
- Move troubleshooting → troubleshooting.md

**Step 4: Update Cross-References**
- Add navigation in SKILL.md
- Update internal links
- Test all links

**Step 5: Validate**
- Check line counts
- Test navigation
- Verify no content lost

### 7.3 Backward Compatibility

**Old skills continue to work:**
- Hooks don't require new structure
- Old SKILL.md files still load
- Migration is opt-in

---

## 8. Integration with diet103 Hooks

### 8.1 Hook Behavior

**UserPromptSubmit Hook:**
- Detects requests for specific detail levels
- Loads only the requested resource
- Falls back to SKILL.md if no detail level specified

**Example Patterns:**
- "Show me the API reference" → Load `resources/api-reference.md`
- "Quick reference for X" → Load `resources/quick-ref.md`
- "How do I troubleshoot Y?" → Load `resources/troubleshooting.md`

### 8.2 Lazy Loading

**Resources are loaded on-demand:**
- SKILL.md always loads (auto-activation)
- Resources load only when explicitly requested
- Reduces token footprint by ~60-80%

---

## 9. Examples

### 9.1 Complete Skill Example

See the reference implementation in `project_orchestrator` skill (Task 92.5).

### 9.2 Migration Example

**Before:** Single 800-line SKILL.md

**After:**
- SKILL.md: 280 lines (overview + navigation)
- quick-ref.md: 85 lines (commands)
- setup-guide.md: 320 lines (setup)
- api-reference.md: 115 lines (API docs)

**Result:** Same content, 50% better token efficiency

---

## 10. Validation Checklist

Use this checklist when creating or migrating skills:

### Structure
- [ ] Directory follows standard layout
- [ ] SKILL.md exists and is < 500 lines
- [ ] All resource files are < 500 lines (quick-ref < 100)
- [ ] File names follow naming conventions

### Content
- [ ] SKILL.md contains overview, quick start, navigation
- [ ] Quick reference is dense and scannable
- [ ] Setup guide is step-by-step
- [ ] API reference is technically precise
- [ ] Troubleshooting uses problem-solution format

### Navigation
- [ ] SKILL.md links to all resources
- [ ] Resources link back to SKILL.md
- [ ] Cross-references are correct
- [ ] All links are valid

### Quality
- [ ] No content duplication
- [ ] Progressive detail from general to specific
- [ ] Content is scannable (headers, lists, tables)
- [ ] Examples are clear and concise

---

## 11. Future Enhancements

**Potential additions (not in v1.0):**
- Automated validation scripts
- Line count enforcement in CI/CD
- Template generator CLI
- Migration assistance tools
- Analytics on resource access patterns

---

## 12. References

- **diet103 Architecture:** https://github.com/diet103/claude-code-infrastructure-showcase
- **PAI Progressive Disclosure:** https://danielmiessler.com/blog/personal-ai-infrastructure
- **Original 500-Line Rule Discussion:** See diet103 README

---

**END OF SPECIFICATION**

