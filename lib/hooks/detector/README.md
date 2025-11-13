# Hook Requirement Detector

**Version:** 1.0.0  
**Status:** Implemented & Tested  
**Task:** 97.1 - Hook Detection Algorithm

---

## Overview

The Hook Requirement Detector is an automated system that analyzes feature specifications to detect required hook integrations. It uses pattern matching and rule-based analysis to identify lifecycle interactions, file operations, external integrations, and state persistence needs.

---

## Installation

The detector is located at `lib/hooks/detector/HookRequirementDetector.js` and can be imported as an ES6 module:

```javascript
import { HookRequirementDetector, detectHookRequirements, HookTypes } from './lib/hooks/detector/HookRequirementDetector.js';
```

---

## Quick Start

###Basic Usage

```javascript
import { detectHookRequirements } from './lib/hooks/detector/HookRequirementDetector.js';

const spec = {
  name: 'Documentation Template',
  description: 'Creates documentation from templates',
  filesCreated: ['Docs/*.md'],
  filesMonitored: ['Docs/**/*.md'],
  logsToExternal: true,
  externalSystems: ['PAI history.jsonl'],
  requiresTimestamps: true
};

const result = detectHookRequirements(spec);

console.log('Required Hooks:', result.requiredHooks);
console.log('Optional Hooks:', result.optionalHooks);
console.log('Warnings:', result.warnings);
```

### Advanced Usage with Report

```javascript
import { HookRequirementDetector } from './lib/hooks/detector/HookRequirementDetector.js';

const detector = new HookRequirementDetector();
const result = detector.detect(spec);
const report = detector.generateReport(result);

console.log(report); // Formatted markdown report
```

---

## Feature Specification Schema

The detector expects a feature specification object with the following fields:

### Required Fields
- **`name`** (string): Feature name

### Optional Fields

#### File Operations
- **`filesCreated`** (string[]): Files created by feature
- **`filesRead`** (string[]): Files read by feature
- **`filesModified`** (string[]): Files modified by feature
- **`filesMonitored`** (string[]): Files monitored for changes
- **`needsBackup`** (boolean): Requires backup before modification
- **`needsTransactionSafety`** (boolean): Requires atomic operations

#### Lifecycle Interactions
- **`analyzesPrompts`** (boolean): Analyzes user input
- **`detectsFilePatterns`** (boolean): Uses file pattern matching
- **`detectsContextChanges`** (boolean): Detects context switches
- **`providesContextualSuggestions`** (boolean): Provides suggestions
- **`monitorsProcessState`** (boolean): Monitors process state
- **`triggersProjectSwitch`** (boolean): Triggers project switching
- **`triggersContextReload`** (boolean): Triggers context reload

#### External Integrations
- **`logsToExternal`** (boolean): Logs to external systems
- **`externalSystems`** (string[]): External systems integrated (e.g., ['PAI', 'git'])

#### State Persistence
- **`requiresCaching`** (boolean): Needs in-memory caching
- **`requiresTimestamps`** (boolean): Tracks timestamps
- **`requiresHistory`** (boolean): Maintains history
- **`requiresThrottling`** (boolean): Needs rate limiting

#### Priority & Dependencies
- **`criticality`** ('low'|'medium'|'high'): Feature criticality
- **`hookDependencies`** (string[]): Other hooks it depends on

---

## Detection Result Schema

The detector returns a result object with:

### Fields

#### `requiredHooks` (HookRecommendation[])
Hooks that are required based on confidence score (>= 0.7) or high criticality.

#### `optionalHooks` (HookRecommendation[])
Hooks that are recommended but not strictly required.

#### `analysis` (Object)
Detailed breakdown of feature characteristics:
- `fileOperations`: File read/write/monitor analysis
- `lifecycleInteractions`: Lifecycle event analysis
- `externalIntegrations`: External system integration analysis
- `statePersistence`: State management needs analysis
- `criticality`: Overall feature criticality

#### `warnings` (string[])
Potential issues or conflicts detected.

### Hook Recommendation Schema

Each hook recommendation includes:

```javascript
{
  type: 'userPromptSubmit',           // Hook type from HookTypes
  reason: 'Why this hook is needed',  // Human-readable explanation
  priority: 25,                       // Suggested priority (1-100)
  name: 'SuggestedHookName',          // Suggested hook name
  confidence: 0.85,                   // Confidence score (0-1)
  required: true,                     // Whether required vs optional
  indicators: ['analyzesPrompts',     // Indicators that triggered this
               'detectsContextChanges']
}
```

---

## Hook Types

The detector recognizes five hook types:

### 1. PRE_CONFIG_MODIFICATION
**Trigger:** Before configuration file modifications  
**Priority Range:** 1-10 (highest priority)  
**Use Cases:**
- Config file backup
- Transaction safety
- Validation before modification

### 2. USER_PROMPT_SUBMIT
**Trigger:** Before user prompt processing  
**Priority Range:** 10-40  
**Use Cases:**
- Prompt analysis
- Context detection
- Contextual suggestions
- Directory change detection

### 3. POST_TOOL_USE
**Trigger:** After tool execution  
**Priority Range:** 40-60  
**Use Cases:**
- File change monitoring
- Context reload
- External logging
- State synchronization

### 4. PRE_PROJECT_SWITCH
**Trigger:** Before project context switch  
**Priority Range:** 10-30  
**Use Cases:**
- State cleanup
- Resource release
- Validation

### 5. POST_PROJECT_SWITCH
**Trigger:** After project context switch  
**Priority Range:** 10-50  
**Use Cases:**
- State initialization
- Cache refresh
- Context setup

---

## Detection Patterns

The detector uses pattern matching to identify hook requirements:

### Pattern 1: File Modification Hooks
**Indicators:**
- Modifies configuration files
- Needs transactional safety
- Requires audit trail

**Result:** PRE_CONFIG_MODIFICATION hook

### Pattern 2: User Input Analysis Hooks
**Indicators:**
- Analyzes user prompts/commands
- Provides contextual suggestions
- Detects context changes
- Triggers actions based on input

**Result:** USER_PROMPT_SUBMIT hook

### Pattern 3: Post-Action Monitoring Hooks
**Indicators:**
- Monitors file system changes
- Reacts to tool execution
- Maintains cache synchronization
- Logs to external systems

**Result:** POST_TOOL_USE hook

### Pattern 4: Project Lifecycle Hooks
**Indicators:**
- Needs pre-switch validation
- Requires context cleanup/init
- Persists project settings

**Result:** PRE/POST_PROJECT_SWITCH hooks

---

## Example Scenarios

### Example 1: Documentation Template (Original Issue)

```javascript
const spec = {
  name: 'Documentation Template',
  filesCreated: ['Docs/*.md'],
  filesMonitored: ['Docs/**/*.md'],
  logsToExternal: true,
  externalSystems: ['PAI history.jsonl'],
  requiresTimestamps: true
};

const result = detectHookRequirements(spec);

// Result:
// {
//   requiredHooks: [
//     {
//       type: 'postToolUse',
//       name: 'DocumentationTemplateMonitor',
//       priority: 45,
//       confidence: 0.75,
//       reason: 'Monitor file changes and maintain synchronization'
//     }
//   ],
//   warnings: []
// }
```

### Example 2: Config Editor

```javascript
const spec = {
  name: 'Config Editor',
  filesModified: ['~/.claude/config.json'],
  needsBackup: true,
  needsTransactionSafety: true,
  criticality: 'high'
};

const result = detectHookRequirements(spec);

// Result:
// {
//   requiredHooks: [
//     {
//       type: 'preConfigModification',
//       name: 'ConfigEditorBackup',
//       priority: 3,
//       confidence: 1.0,
//       reason: 'Backup configuration before modification'
//     }
//   ]
// }
```

### Example 3: Skill Auto-Activator

```javascript
const spec = {
  name: 'Skill Auto-Activator',
  analyzesPrompts: true,
  detectsFilePatterns: true,
  requiresCaching: true,
  providesContextualSuggestions: true
};

const result = detectHookRequirements(spec);

// Result:
// {
//   requiredHooks: [
//     {
//       type: 'userPromptSubmit',
//       name: 'SkillAutoActivatorAnalyzer',
//       priority: 25,
//       confidence: 0.8,
//       reason: 'Analyze user input and provide context'
//     }
//   ],
//   optionalHooks: [
//     {
//       type: 'postProjectSwitch',
//       name: 'SkillAutoActivatorInitialize',
//       priority: 20,
//       confidence: 0.5,
//       reason: 'Initialize project state after switch'
//     }
//   ]
// }
```

### Example 4: Complex Feature with Multiple Hooks

```javascript
const spec = {
  name: 'Project Manager',
  filesModified: ['config.json'],
  analyzesPrompts: true,
  filesMonitored: ['.claude/*'],
  detectsContextChanges: true,
  triggersProjectSwitch: true,
  needsBackup: true,
  requiresCaching: true,
  criticality: 'high'
};

const result = detectHookRequirements(spec);

// Result:
// {
//   requiredHooks: [
//     { type: 'preConfigModification', ... },
//     { type: 'userPromptSubmit', ... },
//     { type: 'postToolUse', ... }
//   ],
//   warnings: [
//     'Feature requires 3+ hooks - consider splitting feature'
//   ]
// }
```

---

## Batch Processing

Process multiple features at once:

```javascript
const detector = new HookRequirementDetector();

const specs = [
  { name: 'Feature A', analyzesPrompts: true },
  { name: 'Feature B', filesModified: ['config.json'] },
  { name: 'Feature C', filesMonitored: ['*.json'] }
];

const results = detector.detectBatch(specs);

results.forEach((result, i) => {
  console.log(`\n=== ${specs[i].name} ===`);
  console.log(`Required Hooks: ${result.requiredHooks.length}`);
  console.log(`Optional Hooks: ${result.optionalHooks.length}`);
});
```

---

## Report Generation

Generate a formatted markdown report:

```javascript
const detector = new HookRequirementDetector();
const result = detector.detect(spec);
const report = detector.generateReport(result);

// Write to file
import fs from 'fs/promises';
await fs.writeFile('hook-requirements.md', report);
```

---

## Testing

The detector includes a comprehensive test suite:

```bash
npm test -- tests/hooks/HookRequirementDetector-standalone.test.js
```

**Test Coverage:**
- 26 test cases
- All existing hook patterns validated
- Edge cases covered
- Batch processing tested
- Report generation verified

---

## API Reference

### Class: HookRequirementDetector

#### Constructor
```javascript
new HookRequirementDetector()
```

Creates a new detector instance with initialized detection rules.

#### Methods

##### `detect(spec)`
Analyzes a single feature specification.

**Parameters:**
- `spec` (FeatureSpecification): Feature to analyze

**Returns:** DetectionResult

**Throws:** Error if spec is invalid

##### `detectBatch(specs)`
Analyzes multiple feature specifications at once.

**Parameters:**
- `specs` (FeatureSpecification[]): Features to analyze

**Returns:** DetectionResult[]

##### `generateReport(result)`
Generates a formatted markdown report.

**Parameters:**
- `result` (DetectionResult): Detection result

**Returns:** string (Markdown formatted)

### Function: detectHookRequirements(spec)

Convenience function for quick detection.

**Parameters:**
- `spec` (FeatureSpecification): Feature to analyze

**Returns:** DetectionResult

---

## Implementation Notes

### Design Decisions
- **Rule-Based Detection**: Uses explicit rules rather than ML for predictability
- **Confidence Scoring**: Assigns confidence to each recommendation (0-1)
- **Human-in-Loop**: Always shows reasoning, allows override
- **Extensible**: Easy to add new patterns as hooks evolve

### Performance
- Pattern matching: O(n*m) where n=indicators, m=rules
- Batch processing: Processes specs independently (parallelizable)
- Memory: Minimal - no persistent state

### Limitations
- Requires well-formed feature specifications
- Pattern matching may miss novel hook needs
- Priority recommendations may need manual adjustment

---

## Future Enhancements

Potential improvements for future versions:

1. **Machine Learning Integration**: Learn from historical hook implementations
2. **Auto-Priority Optimization**: Analyze execution dependencies
3. **Hook Conflict Detection**: Identify potential priority conflicts
4. **Integration with Task Creation**: Auto-detect during task expansion
5. **Visual Hook Flow**: Generate diagrams showing hook execution order
6. **Template Library**: Pre-defined specs for common patterns

---

## Related Documentation

- [Hook Pattern Analysis](./HOOK_PATTERN_ANALYSIS.md) - Analysis of existing hooks
- [Hook Integration Guide](../../.taskmaster/hooks/HOOK_INTEGRATION_GUIDE.md) - Hook implementation guide
- [Task 97](../../.taskmaster/tasks/task-097.txt) - Parent task documentation

---

**Status:** Complete - All tests passing (26/26)  
**Next Steps:** Proceed to subtask 97.2 (Integration Checklist Generator)

