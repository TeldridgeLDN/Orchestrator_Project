# Context Isolation - Single Active Context Protocol

**Priority:** Critical  
**Applies To:** All Orchestrator-managed diet103 projects  
**AI Assistants:** Claude, Cursor, Windsurf, Cline, Roo, and all others

---

## Core Principle

**Only ONE project context may be active at any time. Inactive projects consume ZERO tokens.**

This is the foundational principle of the Orchestrator system, now formalized as a primacy rule to prevent context bleeding, token waste, and cross-project contamination.

---

## Relationship to Existing Rules

**Complements:**
- **Context Efficiency** (both minimize token usage)
- **Platform Primacy** (governs which rules apply to active context)
- **Rule Integrity** (provides conflict resolution)

**Extends:** Orchestrator PRD's "Single Active Context Rule" from principle to enforcement protocol

**Conflicts With:** None identified

---

## Why This Matters

### The Multi-Project Problem

**Without Context Isolation:**
```
Project A context: 5,000 tokens
Project B context: 4,500 tokens
Project C context: 6,000 tokens
Global layer: 500 tokens
----------------------
Total: 16,000 tokens (⚠️ approaching context limits)
```

**With Context Isolation:**
```
Active: Project B: 4,500 tokens
Inactive: Project A: 0 tokens (dormant on disk)
Inactive: Project C: 0 tokens (dormant on disk)
Global layer: 500 tokens
----------------------
Total: 5,000 tokens (✅ efficient, clear focus)
```

**Savings:** 11,000 tokens per session  
**Overhead:** Only ~10% (500 token global layer)

---

## The Single Active Context Rule

### Absolute Requirements

1. **ONE and ONLY ONE** project context loaded at any time
2. **ZERO tokens** consumed by inactive projects
3. **EXPLICIT switching** required (no automatic context loading)
4. **COMPLETE unloading** before loading new context

### What Constitutes "Project Context"

**Included in Active Context:**
- `.claude/Claude.md` (project-specific instructions)
- `.claude/skill-rules.json` (auto-activation rules)
- `.claude/metadata.json` (project manifest)
- Active skills (loaded via skill-rules.json triggers)
- Project-specific agents
- Project-specific commands

**NOT Included (Global, Always Loaded):**
- `~/.claude/config.json` (global registry)
- `~/.claude/Claude.md` (orchestrator instructions)
- Orchestrator meta-skills (project management)

---

## Context Switching Protocol

### The Five-Step Switch Sequence

#### Step 1: Validate Target Project

```python
# Pseudocode
def validate_target_project(project_name):
    # Check project exists
    if project_name not in config.projects:
        raise ProjectNotFoundError(project_name)
    
    # Check path exists
    project_path = config.projects[project_name].path
    if not exists(project_path):
        raise ProjectPathMissingError(project_path)
    
    # Check structure intact
    if not exists(f"{project_path}/.claude"):
        raise InvalidProjectStructureError(project_name)
    
    return project_path
```

**Performance Target:** < 100ms

#### Step 2: Unload Current Context

```python
def unload_current_context(current_project):
    # Critical: Must complete ALL steps
    
    # 1. Flush skill activation states
    skill_manager.flush_all()
    
    # 2. Clear skill cache
    skill_cache.clear(current_project)
    
    # 3. Unload project Claude.md
    context.unload("project_claude_md")
    
    # 4. Unload skill-rules.json
    context.unload("skill_rules")
    
    # 5. Unload project metadata
    context.unload("project_metadata")
    
    # 6. Clear active skill references
    active_skills.clear()
    
    # 7. Notify AI to drop context
    ai_context.clear_namespace("project")
    
    # VERIFY: Context cleared
    assert get_token_count("project") == 0, "Context not fully cleared"
```

**Performance Target:** < 200ms  
**Verification:** MUST assert 0 tokens before proceeding

#### Step 3: Update Registry

```python
def update_registry(old_project, new_project):
    # Update active project
    config.active_project = new_project
    
    # Update timestamps
    if old_project:
        config.projects[old_project].last_active = now()
    config.projects[new_project].last_active = now()
    
    # Save atomically
    save_config_atomic(config)
```

**Performance Target:** < 50ms

#### Step 4: Load New Context

```python
def load_new_context(project_name, project_path):
    # Load in specific order (lightweight → heavy)
    
    # 1. Load metadata (lightweight)
    metadata = read_json(f"{project_path}/.claude/metadata.json")
    context.load("project_metadata", metadata)
    
    # 2. Load Claude.md (medium weight)
    claude_md = read_file(f"{project_path}/.claude/Claude.md")
    context.load("project_claude_md", claude_md)
    
    # 3. Load skill-rules.json (lightweight)
    skill_rules = read_json(f"{project_path}/.claude/skill-rules.json")
    context.load("skill_rules", skill_rules)
    
    # 4. Initialize skill activation listeners (don't load skills yet)
    skill_manager.initialize(skill_rules)
    
    # VERIFY: Only essential context loaded
    token_count = get_token_count("project")
    assert token_count < 2000, f"Too much context loaded: {token_count} tokens"
```

**Performance Target:** < 300ms  
**Token Budget:** < 2000 tokens (before lazy skill loading)

#### Step 5: Verify Isolation

```python
def verify_isolation(old_project, new_project):
    # Critical: Ensure clean switch
    
    # 1. Verify old project has 0 tokens
    old_tokens = get_token_count(f"project:{old_project}")
    assert old_tokens == 0, f"Old context leaked: {old_tokens} tokens"
    
    # 2. Verify new project loaded correctly
    new_tokens = get_token_count(f"project:{new_project}")
    assert new_tokens > 0, "New context failed to load"
    
    # 3. Verify active project updated
    assert config.active_project == new_project
    
    # 4. Log successful switch
    log_context_switch(old_project, new_project, new_tokens)
```

**Performance Target:** < 50ms

### Total Switch Performance

**Target:** < 700ms total (< 1 second)  
**Breakdown:**
- Validate: 100ms
- Unload: 200ms
- Registry: 50ms
- Load: 300ms
- Verify: 50ms

---

## Context Contamination Prevention

### What is Context Contamination?

**Definition:** When information from Project A incorrectly influences work in Project B.

**Example:**
```
User working in Project B (E-commerce site)
AI mistakenly references Project A (Healthcare app)

AI: "I'll use the PatientRecord model..."
User: "What? This is an e-commerce site!"
```

### Detection Protocol

**Before Every Task:**

```python
def verify_correct_context():
    # 1. Get active project from config
    expected_project = config.active_project
    
    # 2. Check current working directory (if applicable)
    if cwd_indicates_different_project():
        alert_context_mismatch()
    
    # 3. Check loaded context matches expected
    loaded_context = get_active_context_name()
    if loaded_context != expected_project:
        raise ContextContaminationError(expected_project, loaded_context)
    
    # 4. Verify task description matches project
    if task_mentions_wrong_project(task_description, expected_project):
        alert_possible_contamination()
```

**AI Assistant Behavior:**
```
Before implementing any code change:
1. Verify active project name
2. Check if request makes sense for this project
3. If mismatch suspected, STOP and alert user
```

### Contamination Alert

```
🚨 CONTEXT CONTAMINATION ALERT

Active Project: orchestrator-project
Task Mentions: "Shopify store", "product catalog"

This suggests you may want to work on a different project.

Options:
1. Switch to correct project: `claude project switch shopify-store`
2. Confirm current project is correct (may be cross-project discussion)
3. Cancel task

Which option? [1/2/3]
```

---

## Token Leakage Prevention

### Zero Token Guarantee

**Inactive projects MUST consume exactly 0 tokens.**

### Verification Methods

#### Method 1: Token Counting

```python
def verify_zero_tokens(project_name):
    # Count tokens in all project namespaces
    namespaces = [
        f"project:{project_name}",
        f"skills:{project_name}",
        f"metadata:{project_name}"
    ]
    
    total_tokens = sum(get_token_count(ns) for ns in namespaces)
    
    if total_tokens > 0:
        raise TokenLeakageError(project_name, total_tokens)
    
    return True
```

#### Method 2: Context Namespace Inspection

```python
def inspect_active_namespaces():
    active = get_all_active_namespaces()
    
    # Should only have global + one project
    expected = ["global", f"project:{config.active_project}"]
    
    unexpected = set(active) - set(expected)
    if unexpected:
        alert_unexpected_namespaces(unexpected)
```

#### Method 3: Memory Profiling

```python
def profile_context_memory():
    # Before switch
    before_memory = measure_context_size()
    
    # Switch
    switch_project(old_project, new_project)
    
    # After switch
    after_memory = measure_context_size()
    
    # Should be similar (just swapped contexts)
    delta = abs(after_memory - before_memory)
    if delta > threshold:
        alert_memory_leak(delta)
```

---

## State Persistence Across Switches

### What Persists

**Persisted (Survives Context Switch):**
- Global config (`~/.claude/config.json`)
- Project registry
- Active project setting
- Project metadata on disk
- File system state

**NOT Persisted (Lost on Switch):**
- In-memory skill state
- Loaded skill content
- Cached responses
- Conversation context (project-specific)

### Caching Strategy (Optional)

```python
# Optional: Fast resume via caching
def cache_project_state(project_name):
    """Cache for fast resume (< 100ms load time)"""
    cache = {
        "metadata": load_metadata(project_name),
        "claude_md": load_claude_md(project_name),
        "skill_rules": load_skill_rules(project_name),
        "last_active_skills": get_active_skills()
    }
    
    save_cache(f".cache/{project_name}.json", cache)
    
    # Cache expiry: 24 hours
    set_expiry(f".cache/{project_name}.json", hours=24)
```

**Trade-off:**
- PRO: Faster switching (< 100ms vs 300ms)
- CON: Stale cache risk
- RECOMMENDATION: Only cache if switching frequency > 10/day

---

## Explicit Switching Requirements

### No Automatic Context Changes

**FORBIDDEN:**
- Automatic switching based on directory change
- Automatic switching based on file open
- Automatic switching based on conversation topic

**RATIONALE:**
- Explicit over implicit (Orchestrator principle)
- Prevents accidental switches
- Maintains predictable state

### Switching Methods

**Method 1: CLI Command**
```bash
claude project switch <project-name>
```

**Method 2: Natural Language (via Orchestrator Skill)**
```
User: "Switch to my Shopify project"
AI: [Triggers project_orchestrator skill]
    "Switching to 'shopify-store'..."
    [Executes switch protocol]
```

**Method 3: Programmatic (Skills/Agents)**
```python
# Only allowed from orchestrator-level skills
orchestrator.switch_project("shopify-store")
```

**NOT ALLOWED:**
```bash
# ❌ NO automatic switching
cd ~/Projects/shopify-store  # Does NOT switch context

# ❌ NO implicit switching  
code ~/Projects/shopify-store  # Does NOT switch context
```

---

## Multi-Session Behavior

### Starting New Session

**On AI Assistant Startup:**

```python
def on_startup():
    # 1. Load global config
    config = load_config()
    
    # 2. Get last active project
    last_active = config.active_project
    
    # 3. Validate project still exists
    if project_exists(last_active):
        # Resume last active project
        load_context(last_active)
        notify_user(f"Resumed: {last_active}")
    else:
        # Project missing, reset to null
        config.active_project = None
        notify_user("No active project (last project missing)")
```

### Cross-Session Isolation

**Sessions are isolated:**
- Session 1 (Terminal A): Project A active
- Session 2 (Terminal B): Project B active
- ✅ Both can be active simultaneously in DIFFERENT sessions
- ❌ ONE session cannot have multiple active contexts

---

## Error Handling

### Common Issues

#### Issue 1: Context Failed to Unload

```python
def handle_unload_failure(project):
    # Critical: Must succeed
    
    try:
        # Retry unload
        unload_current_context(project)
    except Exception:
        # Force clear (nuclear option)
        force_clear_all_context()
        log_error("Forced context clear", project)
        alert_user("Context reset due to unload failure")
```

#### Issue 2: New Context Failed to Load

```python
def handle_load_failure(project):
    # Rollback to safe state
    
    # Clear any partial load
    force_clear_all_context()
    
    # Reset active project to None
    config.active_project = None
    save_config(config)
    
    # Alert user
    raise ContextLoadError(f"Failed to load {project}, reset to no active project")
```

#### Issue 3: Token Leakage Detected

```python
def handle_token_leakage(old_project, leaked_tokens):
    # Critical: Must fix
    
    log_error("Token leakage detected", old_project, leaked_tokens)
    
    # Force clear leaked context
    force_clear_context(old_project)
    
    # Verify cleared
    verify_zero_tokens(old_project)
    
    # Alert user (debug info)
    alert_user(f"⚠️ Cleared {leaked_tokens} leaked tokens from {old_project}")
```

---

## Monitoring & Debugging

### Context Health Checks

**Periodic Verification (every 5 minutes):**

```python
def health_check():
    # 1. Verify single active context
    active_contexts = count_active_contexts()
    assert active_contexts <= 1, f"Multiple contexts active: {active_contexts}"
    
    # 2. Verify token budget
    total_tokens = get_total_token_count()
    if total_tokens > 10000:
        alert_token_budget_exceeded(total_tokens)
    
    # 3. Verify inactive projects = 0 tokens
    for project in config.projects:
        if project != config.active_project:
            assert get_token_count(f"project:{project}") == 0
```

### Debug Commands

```bash
# Check current context
claude project status

# Show token breakdown
claude project tokens

# Verify isolation
claude project verify-isolation

# Force clear (emergency)
claude project clear-context --force
```

---

## Integration with Other Rules

### With Context Efficiency

**Scenario:** Loading new project context

**Context Isolation:** "Load only one project"  
**Context Efficiency:** "Load < 2000 tokens initially"

**Combined Result:**
- Load project metadata, Claude.md, skill-rules.json
- Don't load full skills (lazy load)
- Total: ~1500 tokens
- ✅ Both rules satisfied

### With Platform Primacy

**Scenario:** Which rules apply to active project?

**Platform Primacy:** ".claude/rules/ take precedence"  
**Context Isolation:** "Only active project loaded"

**Combined Result:**
- Load `.claude/rules/` from active project
- Ignore inactive project rules (not loaded)
- Global `.claude/rules/` always active
- ✅ Clear rule hierarchy

---

## Summary: Context Isolation Rules

### The Golden Rules

1. **One Active Context** - Never more than ONE project loaded
2. **Zero Inactive Tokens** - Inactive projects = 0 tokens
3. **Explicit Switching** - No automatic context changes
4. **Complete Unload** - Full unload before loading new
5. **Verify Isolation** - Check token counts after switch
6. **Prevent Contamination** - Alert on context mismatch
7. **Performance Target** - Switch in < 1 second

### Quick Decision Guide

| Situation | Action |
|-----------|--------|
| Want to work on different project? | Explicit switch required |
| Directory changed? | Context does NOT auto-switch |
| Multiple terminals? | Each terminal = separate session OK |
| Context switch failed? | Force clear, reset to null |
| Tokens > 10k? | Alert, investigate leak |
| Task mentions wrong project? | Alert contamination, confirm project |

---

**Rule Version:** 1.0.0  
**Created:** November 14, 2025  
**Last Updated:** November 14, 2025  
**Applies To:** All Orchestrator-managed diet103 projects  
**Formalizes:** Orchestrator PRD "Single Active Context Rule"

**Next Review:** December 14, 2025

---

*"Context is precious. Guard it jealously. Load one project, unload completely, switch explicitly."*

