# ADR 002: diet103 Infrastructure Pattern Adoption

**Date:** November 15, 2025  
**Status:** Accepted ✅  
**Decision Makers:** Tom + AI Agent

---

## Context

Orchestrator had infrastructure pieces (hooks, skills, agents) but lacked the **activation layer** that makes them work automatically. Skills existed but never activated. Hooks were disconnected from skills.

## Decision

Adopt the [diet103 Claude Code Infrastructure](https://github.com/diet103/claude-code-infrastructure-showcase) pattern for skill auto-activation and hook-based context injection.

## Rationale

### Why diet103 Pattern?

**Core Concept:** Skills that activate themselves based on context (trigger phrases + file patterns).

**Key Components:**
1. **skill-rules.json** - Defines activation triggers
2. **UserPromptSubmit hook** - Analyzes prompts and context
3. **Progressive skill loading** - Avoids context limits
4. **File-based activation** - Context-aware assistance

**Why It Works:**
- ✅ Skills suggest themselves (no remembering)
- ✅ Context-aware (file patterns trigger activation)
- ✅ Low overhead (progressive loading)
- ✅ Proven pattern (used by multiple projects)

### Alternatives Considered

1. **Manual Skill Invocation**
   - Too much cognitive load
   - Easy to forget skills exist
   - No context awareness

2. **Always-Loaded Skills**
   - Context window bloat
   - Irrelevant suggestions
   - Poor performance

3. **Custom Automation System**
   - Reinventing the wheel
   - More maintenance
   - Unproven

## Implementation

### What We Built

1. **Skill Activation Hook** (`.claude/hooks/skill-activation.js`)
   - Checks trigger phrases in prompts
   - Checks file patterns for context
   - Suggests/injects relevant skills
   - Respects priority ordering

2. **Skill Rules** (`.claude/skill-rules.json`)
   - 11 activation rules
   - Phrase + file pattern triggers
   - Priority levels (high/medium/low)
   - Context-aware activation

3. **Skills Library** (`.claude/skills/`)
   - scenario_manager (existing)
   - Plans for: shell-integration, rule-management, git-workflow, project-orchestration

4. **Hook Registration** (`.claude/settings.json`)
   - UserPromptSubmit hook enabled
   - Skills auto-suggest on relevant prompts
   - File-based activation working

## Consequences

### Positive

- Skills activate automatically
- Context-aware assistance
- Reduced cognitive load
- Consistent pattern across projects
- Easy to add new skills

### Negative

- Learning curve for skill creation
- Requires discipline in trigger design
- Can over-suggest if triggers too broad

### Mitigations

- Start with 3-5 skills (not 50)
- Make triggers specific, not generic
- Test in isolation before deploying
- Document skill design patterns

## Integration with Other Patterns

### Combined with Miessler's PAI

diet103 (Local Layer) + Miessler (Global Layer) = Complete System

- **diet103:** Project-specific skills and hooks
- **Miessler:** Global knowledge and patterns
- **Orchestrator:** Brings both together

### Project Template

- Template includes diet103 infrastructure
- skill-rules.json pre-configured
- Hooks ready to use
- Just add project-specific skills

## Review Date

December 2025 - After 1 month of usage

## References

- **diet103 Repo:** https://github.com/diet103/claude-code-infrastructure-showcase
- **Implementation:** `.claude/hooks/skill-activation.js`
- **Rules:** `.claude/skill-rules.json`
- **Guide:** `HOW_TO_APPLY_INFRASTRUCTURE.md`

