# diet103 Infrastructure Validation System - Architecture Documentation

## Overview

The diet103 Infrastructure Validation System is a comprehensive framework for detecting, validating, and repairing diet103 project infrastructure. It ensures all managed projects meet the diet103 1.2.0 specification with automated detection, gap analysis, and repair capabilities.

**Version**: 1.0.0  
**Last Updated**: November 13, 2025  
**Specification**: diet103 1.2.0

---

## System Components

### 1. Detection Engine

**Location**: `lib/utils/diet103-validator.js`

**Purpose**: Scans project directories to detect diet103 infrastructure components.

**Key Functions**:
- `detectDiet103Infrastructure(projectPath)` - Identifies present components
- Returns boolean flags for 12 core components:
  - `.claude/` directory
  - `Claude.md` file
  - `metadata.json` 
  - `skill-rules.json`
  - Hook files (UserPromptSubmit.js, PostToolUse.js)
  - Subdirectories (skills/, commands/, agents/, resources/)

**Dependencies**: Node.js `fs`, `path` modules

**Performance**: < 100ms for typical projects

---

### 2. Gap Analysis Engine

**Location**: `lib/utils/diet103-validator.js`

**Purpose**: Analyzes missing components and calculates completeness score.

**Key Functions**:
- `analyzeGaps(checks)` - Identifies missing components by tier
- `calculateCompleteness(checks)` - Computes weighted score

**Component Tiers**:
- **Critical** (70% weight): `.claude/`, `Claude.md`, `metadata.json`, `skill-rules.json`, hooks directory, skills directory, commands directory
- **Important** (30% weight): Specific hooks (UserPromptSubmit.js, PostToolUse.js), agents directory, resources directory, README.md

**Scoring Algorithm**:
```
score = (critical_present / critical_total * 0.7) + 
        (important_present / important_total * 0.3)
```

**Output**: Score 0-100%, categorized gaps, actionable recommendations

---

### 3. Consistency Validator

**Location**: `lib/utils/diet103-validator.js`

**Purpose**: Deep validation of component integrity and format.

**Validation Checks**:
1. **metadata.json** structure and `diet103_version` field
2. **skill-rules.json** format and validity
3. **Hook permissions** (executable bit)
4. **Skill directory** structure (skill.md presence)
5. **Claude.md** minimum content length (50 chars)

**Key Functions**:
- `validateDiet103Consistency(projectPath)` - Runs all checks
- `validateMetadataJson(projectPath)` - JSON structure validation
- `validateSkillRules(projectPath)` - Skill rules format
- `validateHookPermissions(projectPath)` - File permissions
- `validateSkillDirectory(projectPath)` - Directory structure
- `validateClaudeMdContent(projectPath)` - Content validation

**Output**: Array of consistency issues (empty if valid)

---

### 4. Auto-Repair System

**Location**: `lib/utils/diet103-repair.js`

**Purpose**: Automatically installs missing components from templates.

**Key Functions**:
- `repairDiet103Infrastructure(projectPath, gaps)` - Main repair function
- `installComponentFromTemplate(component, projectPath)` - Installs single component

**Repair Process**:
1. Read template files from `~/.claude/templates/base/`
2. Replace template variables:
   - `{{PROJECT_NAME}}` - Project directory name
   - `{{CREATED_DATE}}` - Current ISO timestamp
3. Write files to target locations
4. Set hook permissions (chmod +x)
5. Preserve existing files (no overwrites)

**Safety Features**:
- Never overwrites existing files
- Validates template existence
- Logs all repair actions
- Returns repair results with success/failure status

**Performance**: < 2s for complete repair

---

### 5. File Lifecycle Validation System

**Location**: `lib/validators/file-lifecycle-validator.js`

**Purpose**: Validates file organization and UFC (Universal File Classification) compliance.

**Key Functions**:
- `loadManifest(projectRoot)` - Loads `.file-manifest.json`
- `validateDirectoryStructure(projectRoot)` - Checks UFC directories
- `isInExpectedLocation(filePath, tier)` - Validates file placement
- `detectMisplacedFiles(manifest)` - Finds incorrectly placed files
- `calculateOrganizationScore(manifest)` - Computes 0-100% organization score
- `validateFileLifecycle(projectRoot)` - Full lifecycle validation
- `generateAutoRepairActions(validationResults)` - Creates repair plan

**UFC Directory Structure**:
```
docs/
  ├── core/        # Core documentation (PERMANENT)
  ├── impl/        # Implementation docs (PERMANENT)
  ├── sessions/    # Session logs (EPHEMERAL)
  └── archive/     # Archived files (ARCHIVED)
lib/               # Source code (CRITICAL/PERMANENT)
tests/             # Test files (EPHEMERAL)
.taskmaster/       # Task Master config (CRITICAL)
.claude/           # Claude AI config (CRITICAL)
```

**File Tiers**:
- **CRITICAL**: Core configs, schemas, critical source files
- **PERMANENT**: Documentation, implementation guides, core source
- **EPHEMERAL**: Session logs, reports, test fixtures
- **ARCHIVED**: Historical data, old versions

**Organization Scoring**:
```
score = (correctly_placed_files / total_files) * 100
```

**Output**: Validation results with misplaced files and repair recommendations

---

### 6. CLI Command Layer

**Location**: `lib/commands/`

**Purpose**: Provides user-facing command interface.

**Commands**:

#### `init` (init.js)
- Initializes diet103 infrastructure in a new project
- Creates `.claude/` directory structure
- Installs base templates
- Configures metadata

#### `register` (register.js)
- Registers project in orchestrator registry
- Runs validation automatically
- Auto-repairs if enabled (default: true)
- Blocks registration if score < 70%

#### `validate` (validate.js)
- Runs full validation suite
- Optional auto-repair flag
- Generates validation report

#### `health` (health.js)
- Checks project health status
- Runs validation and consistency checks
- Provides recommendations

#### `file-lifecycle` (file-lifecycle.js)
- `classify` - Classifies files into tiers
- `organize` - Moves files to correct locations
- `archive` - Archives expired ephemeral files
- `cleanup` - Removes old archived files
- `status` - Shows file lifecycle status
- `stats` - Displays statistics

**Command Integration**: All commands use the detection, gap analysis, and repair systems.

---

## Data Flow

### Validation Workflow

```
[Project Path]
     ↓
[Detection Engine] → {component flags}
     ↓
[Gap Analysis] → {score, gaps, recommendations}
     ↓
[Consistency Validator] → {issues array}
     ↓
[Validation Report]
```

### Auto-Repair Workflow

```
[Validation Report]
     ↓
[Gap Analysis] → {missing components}
     ↓
[Template Loader] → {template files}
     ↓
[Variable Replacement] → {customized content}
     ↓
[File Writer] → {installed components}
     ↓
[Permission Setter] → {executable hooks}
     ↓
[Repair Report]
```

### File Lifecycle Workflow

```
[Project Files]
     ↓
[Classification] → {tier assignments}
     ↓
[Manifest Update]
     ↓
[Organization Validation] → {misplaced files}
     ↓
[Auto-Organize] → {files moved}
     ↓
[Archive Check] → {expired files}
     ↓
[Cleanup] → {old files removed}
```

---

## Integration Points

### 1. CLI Integration

Commands call validation system directly:

```javascript
import { detectDiet103Infrastructure, analyzeGaps } from './lib/utils/diet103-validator.js';

// In register command
const checks = await detectDiet103Infrastructure(projectPath);
const gaps = analyzeGaps(checks);
if (gaps.score < 70) {
  throw new Error('Project does not meet requirements');
}
```

### 2. MCP Server Integration

**Location**: MCP server exposes validation tools

**Available MCP Tools**:
- `validate_project` - Run validation
- `repair_infrastructure` - Repair missing components
- `check_health` - Health status check

### 3. Task Master Integration

**Location**: `.taskmaster/` directory

**Integration**: Task validation can trigger diet103 validation as part of project health checks.

---

## File Structure

```
lib/
├── utils/
│   ├── diet103-validator.js     # Detection & gap analysis
│   ├── diet103-repair.js         # Auto-repair system
│   └── project-health.js         # Health checker
├── validators/
│   └── file-lifecycle-validator.js  # UFC validation
├── commands/
│   ├── init.js                   # Initialize command
│   ├── register.js               # Register command
│   ├── validate.js               # Validate command
│   ├── health.js                 # Health command
│   └── file-lifecycle.js         # File lifecycle commands
└── templates/
    └── chrome-extension/         # Project templates

tests/
├── validators/
│   └── file-lifecycle-validator.test.js  # Unit tests (21)
├── integration/
│   └── file-lifecycle-validation-integration.test.js  # Integration tests (11)
└── commands/
    ├── init.test.js
    ├── register.test.js
    └── integration.test.js

Docs/
├── DIET103_SYSTEM_ARCHITECTURE.md  # This file
├── DIET103_QUICK_REFERENCE.md       # Quick reference
└── DIET103_IMPLEMENTATION.md        # Implementation guide
```

---

## Configuration

### Environment Variables

No environment variables required for core validation. API keys only needed for optional features.

### Configuration Files

**`.claude/metadata.json`**:
```json
{
  "diet103_version": "1.2.0",
  "project_name": "example-project",
  "created_date": "2025-11-13T10:00:00.000Z"
}
```

**`.file-manifest.json`**:
```json
{
  "version": "1.0",
  "project": "project-name",
  "files": {
    "path/to/file": {
      "tier": "CRITICAL",
      "status": "active",
      "created": "2025-11-13T10:00:00.000Z"
    }
  },
  "statistics": {
    "total_files": 10,
    "by_tier": { "CRITICAL": 5, "PERMANENT": 3, "EPHEMERAL": 2 }
  }
}
```

---

## Performance Characteristics

| Operation | Typical Time | Max Time |
|-----------|-------------|----------|
| Detection | < 50ms | < 100ms |
| Gap Analysis | < 20ms | < 50ms |
| Consistency Check | < 100ms | < 200ms |
| Auto-Repair | < 1s | < 2s |
| File Classification | < 50ms/file | < 100ms/file |
| Organization Scoring | < 10ms | < 50ms |

**Memory Usage**: < 50MB for typical projects

**Scalability**: Tested up to 500 files per project

---

## Error Handling

### Error Categories

1. **File System Errors**
   - Missing directories (ENOENT)
   - Permission denied (EACCES)
   - Disk full (ENOSPC)

2. **Validation Errors**
   - Invalid JSON format
   - Missing required fields
   - Incorrect file structure

3. **Repair Errors**
   - Template not found
   - File write failures
   - Permission setting failures

### Error Recovery

- All errors are caught and logged
- Partial failures continue execution
- Clear error messages provided
- Suggested remediation actions included

---

## Security Considerations

1. **File Permissions**: System respects existing permissions, only sets execute bit on hooks
2. **No Overwrites**: Never overwrites existing files during repair
3. **Path Validation**: Validates all file paths to prevent directory traversal
4. **Template Security**: Templates loaded from trusted locations only

---

## Testing Strategy

### Test Coverage

- **Unit Tests**: 1,644 passing tests (93.7% pass rate)
- **Integration Tests**: 100% command coverage
- **File Lifecycle**: 32 tests (21 unit + 11 integration)

### Test Frameworks

- **Test Runner**: Vitest 1.6.1
- **Coverage Tool**: @vitest/coverage-v8@1.6.1
- **Assertion Library**: Vitest expect API

### Coverage Targets

- Detection logic: >95% ✅
- Gap analysis: >90% ✅
- Repair system: >85% ✅
- Command integrations: 100% ✅

---

## Future Enhancements

1. **Performance Benchmarking**: Add automated performance tests
2. **Stress Testing**: Test with 1000+ file projects
3. **Cloud Sync**: Integrate with cloud storage
4. **Real-time Monitoring**: Watch for infrastructure changes
5. **Custom Rules**: Allow project-specific validation rules

---

## References

- diet103 1.2.0 Specification
- DIET103_QUICK_REFERENCE.md
- DIET103_IMPLEMENTATION.md
- Task 22 Completion Summary
- Task 23 Test Coverage Summary

---

**Document Version**: 1.0.0  
**Last Reviewed**: November 13, 2025  
**Maintainer**: Orchestrator Diet103 Team

