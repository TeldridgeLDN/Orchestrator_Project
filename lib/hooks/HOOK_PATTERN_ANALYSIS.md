# Hook Pattern Analysis

**Date:** 2025-11-11  
**Purpose:** Extract patterns from existing hooks to inform detection algorithm  
**Task:** 97.1 - Hook Detection Algorithm

---

## Existing Hook Patterns Analyzed

### 1. configBackup.js - PRE_CONFIG_MODIFICATION Hook

**Pattern Characteristics:**
- **Trigger:** Before any modification to config files
- **Hook Type:** PRE_CONFIG_MODIFICATION
- **Priority:** 1 (highest - runs first)
- **File Operations:** Reads/writes files (config.json, backups)
- **State Persistence:** Yes - maintains backup history
- **External Integration:** No
- **Lifecycle Interaction:** Yes - config modification events

**Detection Criteria:**
```javascript
{
  modifiesConfigFiles: true,
  needsPreModificationBackup: true,
  requiresStatePersistence: true,
  criticality: 'high',
  recommendedPriority: 1-10
}
```

---

### 2. directoryDetection.js - USER_PROMPT_SUBMIT Hook

**Pattern Characteristics:**
- **Trigger:** Before user prompt processing
- **Hook Type:** USER_PROMPT_SUBMIT  
- **Priority:** 10 (promptDirectoryDetectionHook), 20 (directoryDetectionHook)
- **File Operations:** Reads config.json, current-project.json
- **State Persistence:** Yes - caches project paths, tracks directory
- **External Integration:** Yes - process.cwd(), file system
- **Lifecycle Interaction:** Yes - project switching events

**Detection Criteria:**
```javascript
{
  analyzesUserInput: true,
  detectsContextChanges: true,
  requiresCaching: true,
  monitorsProcessState: true,
  triggersProjectSwitch: true,
  recommendedPriority: 10-20
}
```

---

### 3. skillSuggestions.js - USER_PROMPT_SUBMIT Hook

**Pattern Characteristics:**
- **Trigger:** Before user prompt processing
- **Hook Type:** USER_PROMPT_SUBMIT
- **Priority:** 30 (runs after directory detection)
- **File Operations:** Reads metadata.json from skills
- **State Persistence:** Yes - suggestion timestamps, metadata cache
- **External Integration:** Yes - minimatch pattern matching
- **Lifecycle Interaction:** Yes - skill activation events

**Detection Criteria:**
```javascript
{
  analyzesUserInput: true,
  providesContextualSuggestions: true,
  requiresCaching: true,
  usesPatternMatching: true,
  requiresThrottling: true,
  recommendedPriority: 30-40
}
```

---

### 4. postToolUse.js - POST_TOOL_USE Hook

**Pattern Characteristics:**
- **Trigger:** After tool execution
- **Hook Type:** POST_TOOL_USE
- **Priority:** 50 (default)
- **File Operations:** Monitors multiple config files, scenarios
- **State Persistence:** Yes - file timestamps, reload tracking
- **External Integration:** Yes - session logging, global caches
- **Lifecycle Interaction:** Yes - context reload events

**Detection Criteria:**
```javascript
{
  monitorsFileChanges: true,
  triggersContextReload: true,
  requiresTimestampTracking: true,
  logsToExternalSystem: true, // session files
  requiresThrottling: true,
  recommendedPriority: 40-60
}
```

---

## Hook Detection Algorithm Patterns

### Pattern 1: File Modification Hooks
**Indicators:**
- Feature modifies configuration files
- Feature needs transactional safety (backup/restore)
- Feature requires audit trail

**Hook Type:** PRE_CONFIG_MODIFICATION  
**Priority Range:** 1-10 (high priority)

### Pattern 2: User Input Analysis Hooks
**Indicators:**
- Feature analyzes user prompts/commands
- Feature provides contextual suggestions
- Feature detects context changes from input
- Feature triggers actions based on input patterns

**Hook Type:** USER_PROMPT_SUBMIT  
**Priority Range:** 10-40 (based on dependency order)

### Pattern 3: Post-Action Monitoring Hooks
**Indicators:**
- Feature monitors file system changes
- Feature needs to react to tool execution
- Feature maintains cache synchronization
- Feature logs to external systems

**Hook Type:** POST_TOOL_USE  
**Priority Range:** 40-60 (default execution)

### Pattern 4: Project Lifecycle Hooks
**Indicators:**
- Feature needs pre-switch validation
- Feature requires context cleanup
- Feature initializes project state
- Feature persists project settings

**Hook Types:** PRE_PROJECT_SWITCH, POST_PROJECT_SWITCH  
**Priority Range:** 10-50 (based on phase)

---

## Common Hook Characteristics

### All Hooks Share:
1. **Middleware Pattern**: `async (context, next) => { ... await next() }`
2. **Error Handling**: Try-catch with graceful degradation
3. **Non-blocking**: Errors logged but don't stop execution
4. **Context Aware**: Receive and can modify context object
5. **Performance Conscious**: Caching, throttling, minimal I/O

### File Operation Patterns:
- Use `fs/promises` for async operations
- Check `existsSync()` before operations
- Handle missing files gracefully
- Use atomic operations where critical

### State Management Patterns:
- In-memory caches with TTL
- Timestamp tracking for change detection
- Map/Set for fast lookups
- Clear functions for testing

---

## Detection Algorithm Requirements

Based on this analysis, the detector must identify:

### A. File Operations
```javascript
{
  readsFiles: string[],           // Files read by feature
  writesFiles: string[],          // Files written by feature
  monitorsFiles: string[],        // Files monitored for changes
  needsBackup: boolean,           // Critical files requiring backup
  needsAtomic: boolean            // Requires atomic operations
}
```

### B. Lifecycle Interactions
```javascript
{
  projectLifecycle: boolean,      // Interacts with project events
  configModification: boolean,    // Modifies configuration
  contextSwitch: boolean,         // Triggers/responds to switches
  toolExecution: boolean,         // Needs post-tool awareness
  userInput: boolean              // Analyzes user prompts
}
```

### C. External Integrations
```javascript
{
  externalSystems: string[],      // PAI, git, session logs, etc.
  processState: boolean,          // Monitors process.cwd(), env, etc.
  networkCalls: boolean,          // Makes HTTP/API calls
  shellCommands: boolean          // Executes shell commands
}
```

### D. State Persistence
```javascript
{
  requiresCache: boolean,         // Needs in-memory caching
  requiresTimestamps: boolean,    // Tracks file/event timestamps
  requiresHistory: boolean,       // Maintains historical state
  requiresThrottling: boolean     // Needs rate limiting
}
```

### E. Priority Determination
```javascript
{
  criticality: 'low'|'medium'|'high',
  executionOrder: 'before'|'after'|'independent',
  dependencies: string[],         // Other hooks it depends on
  recommendedPriority: number     // 1-100
}
```

---

## Next Steps for Algorithm Implementation

1. **Create FeatureSpecification Interface** - Define schema for feature metadata
2. **Implement Pattern Matchers** - One for each hook type pattern
3. **Build Decision Tree** - Map indicators to hook requirements
4. **Create Scoring System** - Rank hook necessity and priority
5. **Generate Recommendations** - Output structured requirements

---

## Example Detection Scenarios

### Scenario 1: Documentation Template Feature
```javascript
Input: {
  name: "Documentation Template",
  description: "Creates documentation from templates",
  filesCreated: ["Docs/*.md", "templates/documentation/*.md"],
  filesRead: ["templates/documentation/*"],
  tracksUsage: true,
  logsToExternal: true // PAI history.jsonl
}

Output: {
  requiredHooks: [
    {
      type: "POST_TOOL_USE",
      reason: "Monitor documentation file creation",
      priority: 45,
      name: "DocumentationLifecycle"
    }
  ],
  optionalHooks: [
    {
      type: "USER_PROMPT_SUBMIT",
      reason: "Suggest templates based on context",
      priority: 35,
      name: "DocumentationSuggestions"
    }
  ]
}
```

### Scenario 2: Config Editor Feature
```javascript
Input: {
  name: "Config Editor",
  description: "Interactive config.json editor",
  filesModified: ["~/.claude/config.json"],
  needsTransactionSafety: true,
  requiresValidation: true
}

Output: {
  requiredHooks: [
    {
      type: "PRE_CONFIG_MODIFICATION",
      reason: "Backup config before modification",
      priority: 1,
      name: "ConfigBackup" // Already exists!
    }
  ],
  optionalHooks: []
}
```

### Scenario 3: Skill Auto-Activator
```javascript
Input: {
  name: "Skill Auto-Activator",
  description: "Automatically activates skills based on context",
  analyzesPrompts: true,
  detectsFilePatterns: true,
  requiresCaching: true,
  modifiesSkillState: true
}

Output: {
  requiredHooks: [
    {
      type: "USER_PROMPT_SUBMIT",
      reason: "Analyze prompts for skill activation",
      priority: 25,
      name: "SkillAutoActivation"
    }
  ],
  optionalHooks: [
    {
      type: "POST_PROJECT_SWITCH",
      reason: "Reset skill state on project change",
      priority: 20,
      name: "SkillStateReset"
    }
  ]
}
```

---

## Implementation Notes

### Key Design Decisions:
1. **Rule-Based Detection** - Use explicit rules rather than ML
2. **Confidence Scoring** - Assign confidence to each recommendation
3. **Human-in-Loop** - Always show reasoning, allow override
4. **Extensible** - Easy to add new patterns as hooks evolve

### Testing Strategy:
1. **Known Scenarios** - Test against 4 existing hooks
2. **Edge Cases** - Features that don't need hooks
3. **Multiple Hooks** - Features requiring 2+ hook types
4. **Priority Conflicts** - Features with overlapping priorities

---

**Status:** Analysis complete, ready for implementation  
**Next:** Implement HookRequirementDetector class

