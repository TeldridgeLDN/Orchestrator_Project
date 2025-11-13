# Product Requirements Document: File Lifecycle Management System (Skill)

**Version:** 1.0
**Status:** Draft for Implementation
**Last Updated:** 2025-11-10
**Skill Name:** `file_lifecycle_manager`

---

## Executive Summary

This PRD defines a **File Lifecycle Management System** implemented as a PAI skill that automatically organizes, classifies, and maintains project documentation based on importance and lifecycle stage. The system addresses the current disorganization of generated files and lack of importance hierarchy by implementing a hybrid classification approach using directory structures (primary) and metadata tags (secondary).

**Core Value Proposition:**
- Automatic file organization via PostToolUse hooks
- Importance-based classification (CRITICAL, PERMANENT, EPHEMERAL, ARCHIVED)
- Self-documenting directory hierarchy aligned with PAI's UFC pattern
- Seamless integration with Orchestrator and diet103 validation systems
- Zero-friction developer experience (organize automatically or on-demand)

**Why a Skill?**

Following the Orchestrator PRD Section 3.6.2 Agentic Feature Decision Tree:
- ✅ Multi-step, recurring workflow (detect → classify → organize → verify)
- ✅ Automatic, agent-invoked process (triggered by hooks)
- ✅ Composes other features (hooks, workflows, validation)
- ❌ Not simple enough for Slash Command (multi-step complexity)
- ❌ Not external integration (internal filesystem management)
- ❌ Not isolated parallel execution (requires context awareness)

**Result:** `file_lifecycle_manager` skill is the appropriate primitive.

---

## 1. Problem Statement

### 1.1 Current State

**What Exists:**

The Orchestrator project (PAI global + diet103 local hybrid) successfully manages project infrastructure but lacks systematic file organization:

1. **Disorganized File Generation:**
   - Documentation files scattered across project root and subdirectories
   - No consistent location for .md files
   - Mix of temporary and permanent files in same directories
   - Example: `PHASE_1_COMPLETE_SUMMARY.md` at root instead of organized location

2. **No Importance Hierarchy:**
   - Critical files (CLAUDE.md, Orchestrator_PRD.md) treated same as ephemeral session reports
   - No protection against accidental deletion or overwriting of important files
   - Difficulty identifying which files are temporary vs permanent

3. **Manual Organization Burden:**
   - Developers must manually categorize and move files
   - No automation for cleanup of old session reports
   - Inconsistent organization across global and project layers

4. **Context Pollution:**
   - Temporary files accumulate over time
   - Increased cognitive load finding relevant documentation
   - Token waste loading outdated context

**Pain Points:**

| Pain Point | Impact | Frequency |
|-----------|--------|-----------|
| Can't find relevant documentation | High | Daily |
| Temporary files clutter workspace | Medium | Weekly |
| No clear importance indicators | High | Constant |
| Manual cleanup required | Medium | Monthly |
| Inconsistent organization | High | Constant |

### 1.2 Target State

A **self-organizing documentation system** that:

- **Automatically classifies** files by importance when created
- **Organizes files** into hierarchical directory structure
- **Archives ephemeral files** after lifecycle expiration
- **Protects critical files** from accidental modification
- **Maintains consistency** across global and project layers
- **Integrates seamlessly** with existing Orchestrator and diet103 systems

---

## 2. Objectives & Success Criteria

### 2.1 Primary Objectives

| Objective | Description | Success Metric |
|-----------|-------------|----------------|
| **Automatic Classification** | Files classified on creation without user intervention | >90% auto-classified correctly |
| **Organized Hierarchy** | Clear directory structure based on importance and type | 100% files in proper location |
| **Lifecycle Management** | Ephemeral files archived automatically after expiration | Zero ephemeral files >30 days old |
| **Protection** | Critical files protected from accidental deletion | 100% critical files preserved |
| **Integration** | Seamless integration with Orchestrator and diet103 | Zero breaking changes |

### 2.2 Non-Objectives (Out of Scope for v1.0)

- Versioning or git integration (handled by separate systems)
- Content search or indexing (use grep/ripgrep)
- Cross-project file synchronization
- File conflict resolution (handled by git)
- Binary file management

---

## 3. System Architecture

### 3.1 Architectural Overview

**Hybrid Classification System: Directory Structure (Primary) + Metadata Tags (Secondary)**

```
┌─────────────────────────────────────────────────────────────────────┐
│                FILE LIFECYCLE MANAGEMENT SYSTEM                      │
│                    (file_lifecycle_manager skill)                    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  DETECTION LAYER (PostToolUse Hook)                          │  │
│  │  - Monitors file write/edit operations                       │  │
│  │  - Triggers classification on new files                      │  │
│  │  - Ignores .gitignored files                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                               ↓                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  CLASSIFICATION ENGINE                                        │  │
│  │  - Pattern-based classification (filename, path, extension)   │  │
│  │  - Content-based classification (keywords, frontmatter)       │  │
│  │  - Confidence scoring (0-100%)                                │  │
│  │  - User confirmation for ambiguous cases (<80% confidence)    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                               ↓                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  METADATA LAYER                                               │  │
│  │  - .file-manifest.json (centralized index)                    │  │
│  │  - Frontmatter tags (markdown files)                          │  │
│  │  - Sync mechanism (frontmatter ↔ manifest)                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                               ↓                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ORGANIZATION WORKFLOWS                                       │  │
│  │  - Move files to proper directories                           │  │
│  │  - Create directory structure if missing                      │  │
│  │  - Update internal references                                 │  │
│  │  - Preserve git history                                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                               ↓                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  LIFECYCLE MANAGEMENT                                         │  │
│  │  - Track file age and expiration                              │  │
│  │  - Auto-archive ephemeral files after 30 days                 │  │
│  │  - Cleanup workflow (manual or scheduled)                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│              FILESYSTEM (Directory Hierarchy)                        │
│                                                                     │
│  docs/                                                              │
│  ├── core/        [CRITICAL]   - Never auto-move                   │
│  ├── impl/        [PERMANENT]  - Implementation docs               │
│  ├── sessions/    [EPHEMERAL]  - Auto-archive after 30 days        │
│  └── archive/     [ARCHIVED]   - Historical documents              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Classification Tiers

The system uses four classification tiers, ordered by importance:

#### CRITICAL (Red Flag - Maximum Protection)

**Definition:** Essential files that define system behavior, must never be auto-moved or deleted.

**Characteristics:**
- Root-level configuration and context files
- Core PRDs and architectural documents
- System-wide rules and schemas

**Examples:**
```
✓ CLAUDE.md
✓ config.json
✓ *_PRD.md (any file ending in PRD.md)
✓ skill-rules.json
✓ metadata.json
✓ .file-manifest.json
```

**Protection Rules:**
- ❌ Never auto-move
- ❌ Never auto-delete
- ❌ Never auto-archive
- ✅ Warn on manual modification
- ✅ Require confirmation for deletion

#### PERMANENT (Green - Organize but Keep)

**Definition:** Stable documentation and implementation guides that should remain accessible indefinitely.

**Characteristics:**
- Implementation documentation
- Technical references
- Infrastructure code
- Skill definitions

**Examples:**
```
✓ DIET103_IMPLEMENTATION.md
✓ Quick_Implementation_Reference.md
✓ lib/ (all files)
✓ skills/ (all files)
✓ templates/ (all files)
✓ *_guidelines.md
✓ *_reference.md
```

**Organization Rules:**
- ✅ Auto-organize into proper directories
- ✅ Keep accessible in current location
- ❌ Never auto-archive
- ✅ Include in context loading

**Default Location:**
- Global: `~/.claude/docs/impl/`
- Project: `<project>/.claude/docs/impl/`

#### EPHEMERAL (Yellow - Temporary with Expiration)

**Definition:** Session-based or time-limited documents that expire after a defined period (default: 30 days).

**Characteristics:**
- Session reports and summaries
- Temporary analysis documents
- Phase completion reports
- Date-stamped documents

**Examples:**
```
✓ PHASE_1_COMPLETE_SUMMARY.md
✓ session_2025-11-09.md
✓ temp_analysis.md
✓ scratch_notes_*.md
✓ *_COMPLETE_SUMMARY.md
```

**Organization Rules:**
- ✅ Auto-organize into sessions directory
- ✅ Track creation date and expiration
- ✅ Auto-archive after 30 days (configurable)
- ⚠️ Warn before archival (7 days notice)

**Default Location:**
- Global: `~/.claude/docs/sessions/YYYY-MM/`
- Project: `<project>/.claude/docs/sessions/YYYY-MM/`

**Lifecycle:**
```
Created → Active (0-23 days) → Warning (24-30 days) → Archived (30+ days)
```

#### ARCHIVED (Gray - Historical Reference)

**Definition:** Expired ephemeral documents or deprecated permanent documents moved to long-term storage.

**Characteristics:**
- Historical session reports
- Deprecated documentation
- Superseded implementation guides

**Examples:**
```
✓ Expired ephemeral files (>30 days old)
✓ Deprecated versions of documents
✓ Historical PRD versions
```

**Organization Rules:**
- ✅ Moved automatically from sessions/ after expiration
- ✅ Organized by date (YYYY-MM directory structure)
- ❌ Not loaded into active context
- ✅ Available for historical reference

**Default Location:**
- Global: `~/.claude/docs/archive/YYYY-MM/`
- Project: `<project>/.claude/docs/archive/YYYY-MM/`

### 3.3 Directory Hierarchy Specification

#### Global Layer (`~/.claude/`)

```
~/.claude/
├── CLAUDE.md                        [CRITICAL] - Never move
├── config.json                      [CRITICAL] - Never move
├── .file-manifest.json              [CRITICAL] - File classification index
│
├── lib/                            [PERMANENT] - Infrastructure code
│   ├── utils/
│   ├── commands/
│   └── hooks/
│
├── skills/                         [PERMANENT] - Skill definitions
│   ├── file_lifecycle_manager/
│   ├── project_orchestrator/
│   └── ...
│
├── templates/                      [PERMANENT] - Project templates
│   ├── base/
│   ├── web-app/
│   └── shopify/
│
├── docs/                           [ORGANIZED] - Documentation root
│   ├── core/                       [CRITICAL] - Core architectural docs
│   │   ├── Orchestrator_PRD.md
│   │   ├── File_Lifecycle_Management_PRD.md
│   │   └── diet103_Validation_System.md
│   │
│   ├── impl/                       [PERMANENT] - Implementation guides
│   │   ├── DIET103_IMPLEMENTATION.md
│   │   ├── Quick_Implementation_Reference.md
│   │   └── IMPLEMENTATION_COMPLETE.md
│   │
│   ├── sessions/                   [EPHEMERAL] - Session reports
│   │   ├── 2025-11/
│   │   │   ├── PHASE_1_COMPLETE_SUMMARY.md
│   │   │   └── session_2025-11-09.md
│   │   └── 2025-12/
│   │
│   └── archive/                    [ARCHIVED] - Historical docs
│       ├── 2025-10/
│       └── 2025-09/
│
├── tests/                          [PERMANENT] - Test suites
└── logs/                           [EPHEMERAL] - System logs
```

#### Project Layer (`<project>/.claude/`)

```
<project>/.claude/
├── Claude.md                        [CRITICAL] - Project context
├── metadata.json                    [CRITICAL] - Project manifest
├── skill-rules.json                 [CRITICAL] - Auto-activation rules
├── .file-manifest.json              [CRITICAL] - File classification index
│
├── skills/                         [PERMANENT] - Project-specific skills
│   └── <skill-name>/
│
├── commands/                       [PERMANENT] - Slash commands
│   └── <command-name>.md
│
├── agents/                         [PERMANENT] - Specialized agents
│   └── <agent-name>/
│
├── hooks/                          [PERMANENT] - diet103 hooks
│   ├── UserPromptSubmit.js
│   └── PostToolUse.js
│
├── resources/                      [PERMANENT] - Shared resources
│   └── <shared-resources>/
│
├── docs/                           [ORGANIZED] - Project documentation
│   ├── core/                       [CRITICAL] - Core project docs
│   │   ├── PROJECT_PRD.md
│   │   └── architecture.md
│   │
│   ├── impl/                       [PERMANENT] - Implementation docs
│   │   ├── setup_guide.md
│   │   └── api_reference.md
│   │
│   ├── sessions/                   [EPHEMERAL] - Session notes
│   │   └── 2025-11/
│   │
│   └── archive/                    [ARCHIVED] - Historical docs
│       └── 2025-10/
│
└── README.md                       [PERMANENT] - Project overview
```

### 3.4 Classification Rules & Patterns

#### Pattern-Based Classification

**Location:** `~/.claude/skills/file_lifecycle_manager/resources/classification-rules.json`

```json
{
  "version": "1.0",
  "rules": [
    {
      "tier": "CRITICAL",
      "patterns": [
        {
          "type": "exact_match",
          "pattern": "CLAUDE.md",
          "confidence": 1.0
        },
        {
          "type": "exact_match",
          "pattern": "config.json",
          "confidence": 1.0
        },
        {
          "type": "regex",
          "pattern": ".*_PRD\\.md$",
          "confidence": 0.95,
          "description": "Any file ending in _PRD.md"
        },
        {
          "type": "exact_match",
          "pattern": "skill-rules.json",
          "confidence": 1.0
        },
        {
          "type": "exact_match",
          "pattern": "metadata.json",
          "confidence": 1.0
        },
        {
          "type": "exact_match",
          "pattern": ".file-manifest.json",
          "confidence": 1.0
        }
      ]
    },
    {
      "tier": "PERMANENT",
      "patterns": [
        {
          "type": "path_prefix",
          "pattern": "lib/",
          "confidence": 0.95
        },
        {
          "type": "path_prefix",
          "pattern": "skills/",
          "confidence": 0.95
        },
        {
          "type": "path_prefix",
          "pattern": "templates/",
          "confidence": 0.95
        },
        {
          "type": "regex",
          "pattern": ".*IMPLEMENTATION\\.md$",
          "confidence": 0.90
        },
        {
          "type": "regex",
          "pattern": ".*_guidelines\\.md$",
          "confidence": 0.85
        },
        {
          "type": "regex",
          "pattern": ".*_reference\\.md$",
          "confidence": 0.85
        },
        {
          "type": "exact_match",
          "pattern": "README.md",
          "confidence": 0.90
        }
      ]
    },
    {
      "tier": "EPHEMERAL",
      "patterns": [
        {
          "type": "regex",
          "pattern": ".*COMPLETE.*SUMMARY\\.md$",
          "confidence": 0.95,
          "description": "Phase completion summaries"
        },
        {
          "type": "regex",
          "pattern": "PHASE_\\d+.*\\.md$",
          "confidence": 0.95
        },
        {
          "type": "regex",
          "pattern": "session.*\\.md$",
          "confidence": 0.90
        },
        {
          "type": "regex",
          "pattern": "^temp_.*",
          "confidence": 0.95
        },
        {
          "type": "regex",
          "pattern": "^scratch_.*",
          "confidence": 0.95
        },
        {
          "type": "regex",
          "pattern": ".*_\\d{4}-\\d{2}-\\d{2}.*",
          "confidence": 0.85,
          "description": "Files with date stamps"
        }
      ]
    }
  ],
  "defaults": {
    "unknown_md_files": "PERMANENT",
    "unknown_code_files": "PERMANENT",
    "confidence_threshold": 0.80
  }
}
```

#### Content-Based Classification (Fallback)

When pattern-based classification confidence is low (<80%), scan file content:

**Markdown Frontmatter Detection:**
```markdown
---
file_class: ephemeral
created: 2025-11-09
expires: 2025-12-09
tags: [session-report, phase-1]
---
```

**Keyword Analysis (First 50 lines):**
```javascript
const KEYWORD_WEIGHTS = {
  CRITICAL: [
    { keyword: 'Product Requirements Document', weight: 0.3 },
    { keyword: 'System Architecture', weight: 0.25 },
    { keyword: 'CRITICAL:', weight: 0.2 }
  ],
  PERMANENT: [
    { keyword: 'Implementation Guide', weight: 0.3 },
    { keyword: 'Reference Documentation', weight: 0.25 },
    { keyword: 'Technical Specification', weight: 0.2 }
  ],
  EPHEMERAL: [
    { keyword: 'Session Report', weight: 0.3 },
    { keyword: 'Phase Complete', weight: 0.3 },
    { keyword: 'Temporary Analysis', weight: 0.25 },
    { keyword: 'Status:', weight: 0.1 }
  ]
};
```

**Size Heuristics:**
- Files > 1000 lines: Likely PERMANENT (comprehensive docs)
- Files < 200 lines: Likely EPHEMERAL (quick reports)
- Files with extensive code blocks: Likely PERMANENT

---

## 4. Integration with Orchestrator & diet103

### 4.1 Integration with Orchestrator PRD

**Alignment with PAI Architecture:**

The `file_lifecycle_manager` skill follows the Orchestrator PRD's architectural principles:

1. **Skills-as-Containers Pattern (Section 3.1):**
   - Skill contains workflows (classify, organize, archive)
   - Progressive disclosure via resources/
   - Follows 500-line rule (<500 lines per file)

2. **UFC (Unified Filesystem Context) Alignment (Section 3.4):**
   - Directory hierarchy mirrors PAI's context/ structure
   - Self-documenting paths (docs/core/ = critical)
   - Hierarchical organization enables targeted loading

3. **Agentic Feature Selection (Section 3.6):**
   - Correctly identified as Skill (not Slash Command, MCP, or Sub-Agent)
   - Multi-step, recurring workflow
   - Composes hooks + workflows + validation

4. **Global + Project Layer Support (Section 3.2):**
   - Works at both `~/.claude/` (global) and `<project>/.claude/` (project) levels
   - Same classification rules, consistent organization
   - No layer-specific exceptions

**Integration Points:**

| Orchestrator Component | Integration Method | Location |
|----------------------|-------------------|----------|
| PostToolUse Hook | Triggers classification on file write | `hooks/PostToolUse.js` |
| config.json | Stores lifecycle settings | `config.json` → `fileLifecycle` section |
| Project Registry | Validates organization per-project | `project_orchestrator` skill |
| Global Claude.md | Documents lifecycle rules | `CLAUDE.md` → File Management section |

### 4.2 Integration with diet103 Validation System

**Complementary Relationship:**

```
┌─────────────────────────────────────────────────────────────────┐
│         diet103 Validation System (Structure)                   │
│  "Does the required directory structure exist?"                 │
│                                                                 │
│  ✓ .claude/ directory exists                                   │
│  ✓ docs/ directory exists                                      │
│  ✓ hooks/ directory exists                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                          ↓ Passes to ↓
┌─────────────────────────────────────────────────────────────────┐
│      File Lifecycle Manager (Organization)                      │
│  "Are files properly organized within the structure?"           │
│                                                                 │
│  ✓ Files in correct directories (core/, impl/, sessions/)      │
│  ✓ Files classified by importance                              │
│  ✓ Ephemeral files tracked with expiration                     │
│  ✓ Expired files archived                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Enhanced Validation Scoring:**

The diet103 validator can integrate lifecycle organization scoring:

```javascript
// Enhanced diet103 validation
export async function validateProject(projectPath) {
  // Existing structure checks (85% score)
  const structureScore = await validateDiet103Structure(projectPath);
  
  // New organization checks (15% score)
  const organizationScore = await validateFileOrganization(projectPath);
  
  const totalScore = (structureScore * 0.85) + (organizationScore * 0.15);
  
  return {
    score: totalScore,
    structure: structureScore,
    organization: organizationScore
  };
}

async function validateFileOrganization(projectPath) {
  const manifest = await loadFileManifest(projectPath);
  
  let score = 0;
  let totalFiles = 0;
  
  for (const [filePath, metadata] of Object.entries(manifest.files)) {
    totalFiles++;
    
    // Check if file is in correct location
    const expectedPath = getExpectedPath(filePath, metadata.class);
    if (filePath === expectedPath) {
      score++;
    }
  }
  
  return totalFiles > 0 ? (score / totalFiles) * 100 : 100;
}
```

**Validation Report Integration:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
diet103 Infrastructure Validation Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project: my-orchestrator-project
Path: /Users/you/Projects/my-orchestrator-project

COMPLETENESS SCORE: 92%
├─ Structure Score: 100% ✅
└─ Organization Score: 75% ⚠️

✅ Critical Components (7/7)
  ✓ .claude/ directory
  ✓ Claude.md
  ✓ metadata.json
  ... (existing checks)

⚠️  File Organization (15/20 files properly organized)
  ✓ CLAUDE.md (CRITICAL, correct location)
  ✓ config.json (CRITICAL, correct location)
  ✓ Orchestrator_PRD.md (CRITICAL, should be in docs/core/)  ← MISPLACED
  ✓ PHASE_1_COMPLETE_SUMMARY.md (EPHEMERAL, should be in docs/sessions/2025-11/)  ← MISPLACED
  ... (5 more misplaced files)

RECOMMENDATIONS:
  1. Run: claude lifecycle organize --auto
  2. Review misplaced files before archival
  3. Configure expiration settings in config.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4.3 Hook Integration (PostToolUse)

**Enhanced PostToolUse Hook:**

**Location:** `~/.claude/hooks/PostToolUse.js` (both global and project)

```javascript
#!/usr/bin/env node

import { fileLifecycleManager } from '../skills/file_lifecycle_manager/index.js';

/**
 * PostToolUse Hook - Enhanced with File Lifecycle Management
 * 
 * Triggers after Claude uses any tool (write, edit, delete, etc.)
 * 
 * Responsibilities:
 * 1. Existing validation (linting, formatting, etc.)
 * 2. NEW: File classification and organization
 */
export async function onPostToolUse(toolUse, context) {
  // Existing hook logic (linting, etc.)
  await existingPostToolUseLogic(toolUse, context);
  
  // NEW: File Lifecycle Management
  if (shouldTriggerLifecycleManager(toolUse)) {
    try {
      await fileLifecycleManager.onFileChanged(toolUse, context);
    } catch (error) {
      console.warn('[File Lifecycle] Classification failed:', error.message);
      // Non-blocking: Don't fail entire hook if lifecycle management fails
    }
  }
}

function shouldTriggerLifecycleManager(toolUse) {
  // Only trigger on file write/edit operations
  if (toolUse.tool !== 'write' && toolUse.tool !== 'edit') {
    return false;
  }
  
  const filePath = toolUse.params.file_path || toolUse.params.path;
  
  // Ignore specific files/patterns
  const ignorePatterns = [
    /node_modules\//,
    /\.git\//,
    /package-lock\.json$/,
    /\.DS_Store$/
  ];
  
  return !ignorePatterns.some(pattern => pattern.test(filePath));
}
```

**File Lifecycle Manager Hook Handler:**

**Location:** `~/.claude/skills/file_lifecycle_manager/hooks/onFileChanged.js`

```javascript
/**
 * Handles file creation/modification events from PostToolUse hook
 */
export async function onFileChanged(toolUse, context) {
  const filePath = toolUse.params.file_path || toolUse.params.path;
  const projectRoot = context.projectRoot || process.cwd();
  
  console.log(`[File Lifecycle] Processing: ${filePath}`);
  
  // Step 1: Classify the file
  const classification = await classifyFile(filePath, projectRoot);
  
  console.log(`[File Lifecycle] Classification: ${classification.tier} (${Math.round(classification.confidence * 100)}% confidence)`);
  
  // Step 2: Store classification in manifest
  await updateFileManifest(projectRoot, filePath, classification);
  
  // Step 3: Add frontmatter to markdown files
  if (filePath.endsWith('.md')) {
    await addFrontmatterTags(filePath, classification);
  }
  
  // Step 4: Organize file (if confidence high enough)
  if (classification.confidence >= 0.80) {
    const expectedPath = getExpectedPath(filePath, classification.tier, projectRoot);
    
    if (filePath !== expectedPath && classification.tier !== 'CRITICAL') {
      // Suggest organization (non-blocking)
      console.log(`[File Lifecycle] Suggestion: Move to ${expectedPath}`);
      console.log(`[File Lifecycle] Run: claude lifecycle organize --file="${filePath}"`);
    }
  } else {
    // Low confidence - ask user
    console.log(`[File Lifecycle] ⚠️  Low confidence classification. Please confirm:`);
    console.log(`[File Lifecycle] Run: claude lifecycle classify --file="${filePath}" --tier=${classification.tier}`);
  }
  
  console.log(`[File Lifecycle] ✓ Complete\n`);
}
```

---

## 5. Skill Structure & Implementation

### 5.1 Skill Directory Structure

**Location:** `~/.claude/skills/file_lifecycle_manager/`

```
file_lifecycle_manager/
├── SKILL.md                          # Main skill documentation (<500 lines)
├── metadata.json                     # Skill manifest
│
├── workflows/                        # PAI pattern: workflows within skill
│   ├── classify.md                  # File classification workflow
│   ├── organize.md                  # Organization workflow
│   ├── archive.md                   # Archival workflow
│   └── cleanup.md                   # Cleanup workflow
│
├── resources/                        # diet103 pattern: lazy-loaded resources
│   ├── classification-rules.json    # Classification patterns
│   ├── directory-schema.md          # Standard directory structure
│   ├── troubleshooting.md           # Common issues and solutions
│   └── examples.md                  # Usage examples
│
├── hooks/                           # Hook handlers
│   └── onFileChanged.js            # PostToolUse hook handler
│
├── lib/                             # Core implementation
│   ├── classifier.js               # Classification engine
│   ├── organizer.js                # File organization logic
│   ├── manifest.js                 # Manifest management
│   └── frontmatter.js              # Frontmatter parsing/writing
│
└── tests/                           # Test suite
    ├── classifier.test.js
    ├── organizer.test.js
    └── integration.test.js
```

### 5.2 Skill Metadata

**Location:** `~/.claude/skills/file_lifecycle_manager/metadata.json`

```json
{
  "id": "file_lifecycle_manager",
  "name": "File Lifecycle Manager",
  "type": "skill",
  "version": "1.0.0",
  "description": "Automatic file classification, organization, and lifecycle management for PAI projects",
  "architecture": {
    "pattern": "PAI Skills-as-Containers",
    "integration": "diet103 PostToolUse hook",
    "layers": ["global", "project"]
  },
  "workflows": [
    {
      "id": "classify",
      "name": "Classify File",
      "description": "Determine file importance tier and metadata"
    },
    {
      "id": "organize",
      "name": "Organize Files",
      "description": "Move files to proper directory structure"
    },
    {
      "id": "archive",
      "name": "Archive Ephemeral Files",
      "description": "Move expired ephemeral files to archive"
    },
    {
      "id": "cleanup",
      "name": "Cleanup Workspace",
      "description": "Remove old archived files and optimize structure"
    }
  ],
  "dependencies": [],
  "hooks": [
    {
      "type": "PostToolUse",
      "handler": "hooks/onFileChanged.js",
      "description": "Triggers classification on file write/edit"
    }
  ],
  "configuration": {
    "ephemeral_expiration_days": 30,
    "archive_retention_days": 365,
    "auto_organize": false,
    "confidence_threshold": 0.80
  },
  "token_footprint": "minimal (~200 tokens for manifest)",
  "progressive_disclosure": true
}
```

### 5.3 Main Skill Documentation

**Location:** `~/.claude/skills/file_lifecycle_manager/SKILL.md`

**Structure (< 500 lines):**

```markdown
# File Lifecycle Manager Skill

**Version:** 1.0.0
**Type:** PAI Skill
**Integration:** diet103 PostToolUse hook

---

## Overview

[Brief description of skill purpose and capabilities]

## Quick Start

[Common usage commands]

## Classification Tiers

[CRITICAL, PERMANENT, EPHEMERAL, ARCHIVED - brief summaries]

## Workflows

[List of workflows with links to resources/]

### Classify Workflow
→ See: [workflows/classify.md](workflows/classify.md)

### Organize Workflow
→ See: [workflows/organize.md](workflows/organize.md)

### Archive Workflow
→ See: [workflows/archive.md](workflows/archive.md)

### Cleanup Workflow
→ See: [workflows/cleanup.md](workflows/cleanup.md)

## Configuration

[How to configure in config.json]

## Integration

[How it works with Orchestrator and diet103]

## Troubleshooting

→ See: [resources/troubleshooting.md](resources/troubleshooting.md)

## Examples

→ See: [resources/examples.md](resources/examples.md)

---

**Total Lines:** ~450 (follows 500-line rule)
```

---

## 6. .file-manifest.json Schema

### 6.1 Manifest Structure

**Location:** `~/.claude/.file-manifest.json` (global) or `<project>/.claude/.file-manifest.json` (project)

**Schema Version:** 1.0

```json
{
  "$schema": "https://claude.ai/schemas/file-manifest-v1.json",
  "version": "1.0",
  "project": "orchestrator-project",
  "last_updated": "2025-11-10T14:30:00Z",
  "statistics": {
    "total_files": 42,
    "by_tier": {
      "CRITICAL": 5,
      "PERMANENT": 28,
      "EPHEMERAL": 7,
      "ARCHIVED": 2
    },
    "pending_archive": 3,
    "misplaced": 4
  },
  "files": {
    "CLAUDE.md": {
      "tier": "CRITICAL",
      "classification": {
        "method": "pattern",
        "confidence": 1.0,
        "rule": "exact_match"
      },
      "created": "2025-10-15T08:00:00Z",
      "last_modified": "2025-11-10T10:00:00Z",
      "size_bytes": 23456,
      "tags": ["global-context", "never-move"],
      "protected": true,
      "expected_path": "CLAUDE.md",
      "current_path": "CLAUDE.md",
      "status": "correct_location"
    },
    "Docs/PHASE_1_COMPLETE_SUMMARY.md": {
      "tier": "EPHEMERAL",
      "classification": {
        "method": "pattern",
        "confidence": 0.95,
        "rule": "regex:.*COMPLETE.*SUMMARY\\.md$"
      },
      "created": "2025-11-09T14:22:00Z",
      "last_modified": "2025-11-09T14:22:00Z",
      "expires": "2025-12-09T14:22:00Z",
      "days_until_expiration": 29,
      "size_bytes": 18432,
      "tags": ["session-report", "phase-1"],
      "protected": false,
      "expected_path": "docs/sessions/2025-11/PHASE_1_COMPLETE_SUMMARY.md",
      "current_path": "Docs/PHASE_1_COMPLETE_SUMMARY.md",
      "status": "misplaced",
      "suggestion": "Move to docs/sessions/2025-11/"
    },
    "Docs/Orchestrator_PRD.md": {
      "tier": "CRITICAL",
      "classification": {
        "method": "pattern",
        "confidence": 0.95,
        "rule": "regex:.*_PRD\\.md$"
      },
      "created": "2025-11-05T10:00:00Z",
      "last_modified": "2025-11-08T16:30:00Z",
      "size_bytes": 67890,
      "tags": ["prd", "architecture", "core-doc"],
      "protected": true,
      "expected_path": "docs/core/Orchestrator_PRD.md",
      "current_path": "Docs/Orchestrator_PRD.md",
      "status": "misplaced",
      "suggestion": "Move to docs/core/ (WARNING: CRITICAL file, confirm before moving)"
    },
    "docs/impl/DIET103_IMPLEMENTATION.md": {
      "tier": "PERMANENT",
      "classification": {
        "method": "pattern",
        "confidence": 0.90,
        "rule": "regex:.*IMPLEMENTATION\\.md$"
      },
      "created": "2025-11-06T09:15:00Z",
      "last_modified": "2025-11-07T11:45:00Z",
      "size_bytes": 45678,
      "tags": ["implementation", "diet103"],
      "protected": false,
      "expected_path": "docs/impl/DIET103_IMPLEMENTATION.md",
      "current_path": "docs/impl/DIET103_IMPLEMENTATION.md",
      "status": "correct_location"
    }
  },
  "settings": {
    "ephemeral_expiration_days": 30,
    "archive_retention_days": 365,
    "auto_organize": false,
    "confidence_threshold": 0.80
  }
}
```

### 6.2 Manifest Operations

**Core Operations:**

```javascript
// Load manifest
async function loadManifest(projectRoot) {
  const manifestPath = path.join(projectRoot, '.claude', '.file-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return createEmptyManifest(projectRoot);
  }
  return JSON.parse(await fs.promises.readFile(manifestPath, 'utf8'));
}

// Update file entry
async function updateFileEntry(projectRoot, filePath, classification) {
  const manifest = await loadManifest(projectRoot);
  
  manifest.files[filePath] = {
    tier: classification.tier,
    classification: {
      method: classification.method,
      confidence: classification.confidence,
      rule: classification.rule
    },
    created: manifest.files[filePath]?.created || new Date().toISOString(),
    last_modified: new Date().toISOString(),
    expires: classification.tier === 'EPHEMERAL' 
      ? getExpirationDate(manifest.settings.ephemeral_expiration_days)
      : null,
    size_bytes: (await fs.promises.stat(filePath)).size,
    tags: classification.tags || [],
    protected: classification.tier === 'CRITICAL',
    expected_path: getExpectedPath(filePath, classification.tier, projectRoot),
    current_path: filePath,
    status: getLocationStatus(filePath, classification.tier, projectRoot)
  };
  
  // Update statistics
  updateManifestStatistics(manifest);
  
  await saveManifest(projectRoot, manifest);
}

// Get files by tier
function getFilesByTier(manifest, tier) {
  return Object.entries(manifest.files)
    .filter(([_, metadata]) => metadata.tier === tier)
    .map(([filePath, metadata]) => ({ filePath, ...metadata }));
}

// Get expired ephemeral files
function getExpiredFiles(manifest) {
  const now = new Date();
  return getFilesByTier(manifest, 'EPHEMERAL')
    .filter(file => file.expires && new Date(file.expires) < now);
}

// Get misplaced files
function getMisplacedFiles(manifest) {
  return Object.entries(manifest.files)
    .filter(([_, metadata]) => metadata.status === 'misplaced')
    .map(([filePath, metadata]) => ({ filePath, ...metadata }));
}
```

---

## 7. Workflows

### 7.1 Classify Workflow

**Location:** `~/.claude/skills/file_lifecycle_manager/workflows/classify.md`

**Purpose:** Determine file importance tier and metadata

**Command:** `claude lifecycle classify [options]`

**Options:**
- `--file <path>` - Classify specific file
- `--dir <path>` - Classify all files in directory
- `--tier <tier>` - Override automatic classification
- `--confidence <0-1>` - Show only files above confidence threshold
- `--update-manifest` - Update manifest with results

**Process:**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. FILE ANALYSIS                                            │
│    - Read file path and name                                │
│    - Check file extension                                   │
│    - Determine file size                                    │
│    - Read first 50 lines (if text file)                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. PATTERN MATCHING                                         │
│    - Check exact match rules (CLAUDE.md, config.json)       │
│    - Check regex patterns (.*_PRD\.md$, PHASE_\d+)          │
│    - Check path prefix rules (lib/, skills/)                │
│    - Assign confidence score (0-1)                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. CONTENT ANALYSIS (if confidence < 0.80)                  │
│    - Check for frontmatter tags                             │
│    - Analyze keyword frequency                              │
│    - Check file structure (headers, sections)               │
│    - Adjust confidence score                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. TIER DETERMINATION                                       │
│    - Assign tier: CRITICAL / PERMANENT / EPHEMERAL         │
│    - Calculate final confidence score                       │
│    - Determine expected location                            │
│    - Generate tags                                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. USER CONFIRMATION (if confidence < 0.80)                 │
│    - Display classification results                         │
│    - Ask user to confirm or override                        │
│    - Learn from user feedback                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. OUTPUT                                                   │
│    - Display classification result                          │
│    - Update manifest (if --update-manifest)                 │
│    - Add frontmatter (if markdown)                          │
└─────────────────────────────────────────────────────────────┘
```

**Example Output:**

```bash
$ claude lifecycle classify --file Docs/PHASE_1_COMPLETE_SUMMARY.md

Classifying: Docs/PHASE_1_COMPLETE_SUMMARY.md

Pattern Match: EPHEMERAL (95% confidence)
  Rule: regex:.*COMPLETE.*SUMMARY\.md$
  Reason: Session report pattern detected

Metadata:
  Tier: EPHEMERAL
  Tags: [session-report, phase-1]
  Expires: 2025-12-09 (30 days from creation)
  Expected Location: docs/sessions/2025-11/PHASE_1_COMPLETE_SUMMARY.md
  Current Location: Docs/PHASE_1_COMPLETE_SUMMARY.md
  Status: MISPLACED

Recommendation:
  Move to: docs/sessions/2025-11/PHASE_1_COMPLETE_SUMMARY.md
  Run: claude lifecycle organize --file Docs/PHASE_1_COMPLETE_SUMMARY.md

Classification saved to manifest.
```

### 7.2 Organize Workflow

**Location:** `~/.claude/skills/file_lifecycle_manager/workflows/organize.md`

**Purpose:** Move files to proper directory structure based on classification

**Command:** `claude lifecycle organize [options]`

**Options:**
- `--file <path>` - Organize specific file
- `--dir <path>` - Organize all files in directory
- `--auto` - Automatically organize all misplaced files (>80% confidence)
- `--dry-run` - Show what would be moved without moving
- `--force` - Skip confirmation prompts

**Process:**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. LOAD MANIFEST                                            │
│    - Read .file-manifest.json                               │
│    - Identify misplaced files                               │
│    - Filter by confidence threshold                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CREATE DIRECTORY STRUCTURE                               │
│    - Ensure docs/ exists                                    │
│    - Create docs/core/, docs/impl/, docs/sessions/          │
│    - Create date-based subdirectories (YYYY-MM)             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. MOVE FILES                                               │
│    For each misplaced file:                                 │
│    - Verify destination doesn't exist                       │
│    - Move file (preserve git history if in repo)            │
│    - Update internal references                             │
│    - Update manifest with new path                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. UPDATE REFERENCES                                        │
│    - Scan all markdown files for links                      │
│    - Update relative paths to moved files                   │
│    - Verify links still work                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. VERIFY                                                   │
│    - Check all files moved successfully                     │
│    - Verify manifest consistency                            │
│    - Run validation check                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. OUTPUT                                                   │
│    - Display organization summary                           │
│    - Show files moved and updated references                │
│    - Provide next steps                                     │
└─────────────────────────────────────────────────────────────┘
```

**Example Output:**

```bash
$ claude lifecycle organize --auto

Loading manifest...
Found 4 misplaced files (>80% confidence)

Creating directory structure...
  ✓ docs/core/
  ✓ docs/impl/
  ✓ docs/sessions/2025-11/
  ✓ docs/archive/

Moving files...
  ✓ Docs/Orchestrator_PRD.md → docs/core/Orchestrator_PRD.md
  ✓ Docs/PHASE_1_COMPLETE_SUMMARY.md → docs/sessions/2025-11/PHASE_1_COMPLETE_SUMMARY.md
  ✓ DIET103_IMPLEMENTATION.md → docs/impl/DIET103_IMPLEMENTATION.md
  ✓ Quick_Implementation_Reference.md → docs/impl/Quick_Implementation_Reference.md

Updating references...
  ✓ Updated 3 links in CLAUDE.md
  ✓ Updated 2 links in README.md

Verification...
  ✓ All files moved successfully
  ✓ Manifest updated
  ✓ No broken links detected

Organization complete! (4 files organized)

New organization score: 100%
```

### 7.3 Archive Workflow

**Location:** `~/.claude/skills/file_lifecycle_manager/workflows/archive.md`

**Purpose:** Move expired ephemeral files to archive

**Command:** `claude lifecycle archive [options]`

**Options:**
- `--dry-run` - Show what would be archived without archiving
- `--force` - Skip 7-day warning period
- `--age <days>` - Archive files older than specified days (default: 30)

**Process:**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. IDENTIFY EXPIRED FILES                                   │
│    - Load manifest                                          │
│    - Find EPHEMERAL files with expired dates                │
│    - Check last_modified date vs expiration                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. WARNING PERIOD CHECK                                     │
│    - For files 24-30 days old: WARN                         │
│    - For files 30+ days old: ARCHIVE                        │
│    - Skip warning if --force flag                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. CREATE ARCHIVE STRUCTURE                                 │
│    - Ensure docs/archive/ exists                            │
│    - Create date-based subdirectories (YYYY-MM)             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. MOVE TO ARCHIVE                                          │
│    - Move expired files to archive/YYYY-MM/                 │
│    - Preserve original directory structure in archive       │
│    - Update manifest tier to ARCHIVED                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. OUTPUT                                                   │
│    - Display archival summary                               │
│    - Show warning period files (not yet archived)           │
│    - Update statistics                                      │
└─────────────────────────────────────────────────────────────┘
```

**Example Output:**

```bash
$ claude lifecycle archive

Checking for expired ephemeral files...

⚠️  Warning Period (24-30 days old):
  - docs/sessions/2025-10/session_2025-10-15.md (27 days old, expires in 3 days)
  - docs/sessions/2025-10/analysis_temp.md (29 days old, expires in 1 day)

📦 Ready for Archive (30+ days old):
  - docs/sessions/2025-09/PHASE_0_SUMMARY.md (45 days old)
  - docs/sessions/2025-09/session_2025-09-28.md (42 days old)

Creating archive structure...
  ✓ docs/archive/2025-09/

Moving to archive...
  ✓ docs/sessions/2025-09/PHASE_0_SUMMARY.md → docs/archive/2025-09/sessions/PHASE_0_SUMMARY.md
  ✓ docs/sessions/2025-09/session_2025-09-28.md → docs/archive/2025-09/sessions/session_2025-09-28.md

Archive complete! (2 files archived)

Next archive check: 2025-11-13 (when warning period files expire)
```

### 7.4 Cleanup Workflow

**Location:** `~/.claude/skills/file_lifecycle_manager/workflows/cleanup.md`

**Purpose:** Remove old archived files and optimize structure

**Command:** `claude lifecycle cleanup [options]`

**Options:**
- `--age <days>` - Remove archived files older than specified days (default: 365)
- `--dry-run` - Show what would be removed without removing
- `--optimize` - Remove empty directories and optimize structure

**Process:**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. IDENTIFY OLD ARCHIVES                                    │
│    - Find ARCHIVED files older than retention period        │
│    - Calculate total size to be removed                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. USER CONFIRMATION                                        │
│    - Display list of files to be removed                    │
│    - Show total space to be freed                           │
│    - Require explicit confirmation                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. REMOVE FILES                                             │
│    - Delete old archived files                              │
│    - Remove from manifest                                   │
│    - Update statistics                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. OPTIMIZE STRUCTURE (if --optimize)                       │
│    - Remove empty directories                               │
│    - Consolidate sparse archives                            │
│    - Rebuild manifest index                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. OUTPUT                                                   │
│    - Display cleanup summary                                │
│    - Show space freed                                       │
│    - Update statistics                                      │
└─────────────────────────────────────────────────────────────┘
```

**Example Output:**

```bash
$ claude lifecycle cleanup --age 365 --optimize

Analyzing archive...

Old Archives (>365 days):
  - docs/archive/2024-01/ (12 files, 456 KB)
  - docs/archive/2024-02/ (8 files, 234 KB)
  Total: 20 files, 690 KB

⚠️  WARNING: This will permanently delete 20 files.
Do you want to continue? (yes/no): yes

Removing old archives...
  ✓ Removed docs/archive/2024-01/ (12 files)
  ✓ Removed docs/archive/2024-02/ (8 files)

Optimizing structure...
  ✓ Removed 3 empty directories
  ✓ Rebuilt manifest index

Cleanup complete!
  - 20 files removed
  - 690 KB freed
  - 3 empty directories removed

Archive now contains: 42 files (2.1 MB)
```

---

## 8. Frontmatter Integration

### 8.1 Frontmatter Schema

For markdown files, the system adds YAML frontmatter to store metadata:

```markdown
---
file_class: ephemeral
created: 2025-11-09T14:22:00Z
modified: 2025-11-09T14:22:00Z
expires: 2025-12-09T14:22:00Z
tags:
  - session-report
  - phase-1
  - implementation
classification:
  method: pattern
  confidence: 0.95
  rule: "regex:.*COMPLETE.*SUMMARY\\.md$"
protected: false
---

# PHASE 1 COMPLETE SUMMARY

[Content follows...]
```

### 8.2 Frontmatter Operations

**Add Frontmatter:**

```javascript
async function addFrontmatterTags(filePath, classification) {
  const content = await fs.promises.readFile(filePath, 'utf8');
  
  // Check if frontmatter already exists
  if (content.startsWith('---\n')) {
    return updateFrontmatter(filePath, classification);
  }
  
  // Create new frontmatter
  const frontmatter = {
    file_class: classification.tier.toLowerCase(),
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    expires: classification.tier === 'EPHEMERAL' ? getExpirationDate(30) : null,
    tags: classification.tags || [],
    classification: {
      method: classification.method,
      confidence: classification.confidence,
      rule: classification.rule
    },
    protected: classification.tier === 'CRITICAL'
  };
  
  const frontmatterYaml = yaml.stringify(frontmatter);
  const newContent = `---\n${frontmatterYaml}---\n\n${content}`;
  
  await fs.promises.writeFile(filePath, newContent, 'utf8');
}
```

**Parse Frontmatter:**

```javascript
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]+?)\n---\n/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: null, content };
  }
  
  const frontmatterYaml = match[1];
  const frontmatter = yaml.parse(frontmatterYaml);
  const mainContent = content.slice(match[0].length);
  
  return { frontmatter, content: mainContent };
}
```

**Sync Frontmatter to Manifest:**

```javascript
async function syncFrontmatterToManifest(filePath, projectRoot) {
  const content = await fs.promises.readFile(filePath, 'utf8');
  const { frontmatter } = parseFrontmatter(content);
  
  if (!frontmatter || !frontmatter.file_class) {
    return; // No frontmatter to sync
  }
  
  const manifest = await loadManifest(projectRoot);
  
  // Update manifest with frontmatter data
  if (!manifest.files[filePath]) {
    manifest.files[filePath] = {};
  }
  
  manifest.files[filePath].tier = frontmatter.file_class.toUpperCase();
  manifest.files[filePath].tags = frontmatter.tags || [];
  manifest.files[filePath].created = frontmatter.created;
  manifest.files[filePath].last_modified = frontmatter.modified;
  manifest.files[filePath].expires = frontmatter.expires;
  manifest.files[filePath].protected = frontmatter.protected || false;
  
  await saveManifest(projectRoot, manifest);
}
```

---

## 9. Command-Line Interface

### 9.1 Main Commands

**Location:** `~/.claude/lib/commands/lifecycle.js`

```bash
# Classify files
claude lifecycle classify [options]
  --file <path>          Classify specific file
  --dir <path>           Classify all files in directory
  --tier <tier>          Override automatic classification
  --confidence <0-1>     Show only files above confidence threshold
  --update-manifest      Update manifest with results

# Organize files
claude lifecycle organize [options]
  --file <path>          Organize specific file
  --dir <path>           Organize all files in directory
  --auto                 Automatically organize all misplaced files
  --dry-run              Show what would be moved without moving
  --force                Skip confirmation prompts

# Archive ephemeral files
claude lifecycle archive [options]
  --dry-run              Show what would be archived without archiving
  --force                Skip 7-day warning period
  --age <days>           Archive files older than specified days (default: 30)

# Cleanup old archives
claude lifecycle cleanup [options]
  --age <days>           Remove archived files older than specified days (default: 365)
  --dry-run              Show what would be removed without removing
  --optimize             Remove empty directories and optimize structure

# Show status
claude lifecycle status
  --verbose              Show detailed information
  --tier <tier>          Filter by tier

# Show statistics
claude lifecycle stats
  --json                 Output as JSON

# Validate organization
claude lifecycle validate
  --fix                  Automatically fix issues
```

### 9.2 Status Command Output

```bash
$ claude lifecycle status

File Lifecycle Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project: orchestrator-project
Manifest Last Updated: 2025-11-10 14:30:00

Organization Score: 92%

Files by Tier:
  CRITICAL:   5 files (all in correct location) ✅
  PERMANENT:  28 files (27 organized, 1 misplaced) ⚠️
  EPHEMERAL:  7 files (5 organized, 2 misplaced) ⚠️
  ARCHIVED:   2 files ✅

Pending Actions:
  ⚠️  4 misplaced files (run: claude lifecycle organize --auto)
  📦  3 files ready for archive (27-29 days old)
  🔔  2 files expiring soon (warning period)

Storage:
  Total: 2.3 MB
  Archive: 690 KB (30%)
  
Run 'claude lifecycle status --verbose' for detailed information.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 9.3 Statistics Command Output

```bash
$ claude lifecycle stats

File Lifecycle Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Files: 42

By Tier:
┌─────────────┬───────┬──────────────┬────────────┐
│ Tier        │ Count │ % of Total   │ Size       │
├─────────────┼───────┼──────────────┼────────────┤
│ CRITICAL    │ 5     │ 12%          │ 234 KB     │
│ PERMANENT   │ 28    │ 67%          │ 1.4 MB     │
│ EPHEMERAL   │ 7     │ 17%          │ 156 KB     │
│ ARCHIVED    │ 2     │ 5%           │ 456 KB     │
└─────────────┴───────┴──────────────┴────────────┘

Organization:
  Correct Location: 38 files (90%)
  Misplaced: 4 files (10%)

Lifecycle:
  Pending Archive: 3 files (expires in 1-3 days)
  Warning Period: 2 files (24-29 days old)
  Archived: 2 files

Classification Confidence:
  High (>90%):    35 files (83%)
  Medium (80-90%): 5 files (12%)
  Low (<80%):      2 files (5%)

Recent Activity (last 7 days):
  Created: 8 files
  Modified: 12 files
  Organized: 4 files
  Archived: 0 files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 10. Configuration

### 10.1 Global Configuration

**Location:** `~/.claude/config.json`

Add new `fileLifecycle` section:

```json
{
  "version": "1.0.0",
  "active_project": "orchestrator-project",
  "projects": { ... },
  
  "fileLifecycle": {
    "enabled": true,
    "auto_organize": false,
    "auto_classify": true,
    "auto_archive": true,
    
    "ephemeral_expiration_days": 30,
    "archive_retention_days": 365,
    "confidence_threshold": 0.80,
    
    "warning_period_days": 7,
    "notify_expiring_files": true,
    
    "classification_rules_path": "~/.claude/skills/file_lifecycle_manager/resources/classification-rules.json",
    
    "protected_files": [
      "CLAUDE.md",
      "config.json",
      ".file-manifest.json"
    ],
    
    "ignore_patterns": [
      "node_modules/",
      ".git/",
      "*.log",
      "package-lock.json"
    ]
  }
}
```

### 10.2 Project-Level Configuration Override

**Location:** `<project>/.claude/metadata.json`

```json
{
  "project_id": "my-project",
  "version": "0.1.0",
  "diet103_version": "1.2.0",
  
  "fileLifecycle": {
    "ephemeral_expiration_days": 60,
    "auto_organize": true,
    
    "custom_rules": [
      {
        "tier": "PERMANENT",
        "pattern": ".*_spec\\.md$",
        "description": "All spec files are permanent"
      }
    ]
  }
}
```

---

## 11. Testing & Validation

### 11.1 Unit Tests

**Location:** `~/.claude/skills/file_lifecycle_manager/tests/`

**Test Coverage Requirements:**
- Classification engine: 100%
- Organizer logic: 95%+
- Manifest operations: 100%
- Frontmatter parsing: 100%

**Test Cases:**

```javascript
describe('Classification Engine', () => {
  it('should classify CRITICAL files correctly', () => {
    expect(classify('CLAUDE.md')).toEqual({
      tier: 'CRITICAL',
      confidence: 1.0,
      method: 'pattern'
    });
  });

  it('should classify PRD files as CRITICAL', () => {
    expect(classify('Orchestrator_PRD.md')).toEqual({
      tier: 'CRITICAL',
      confidence: 0.95,
      method: 'pattern'
    });
  });

  it('should classify phase summaries as EPHEMERAL', () => {
    expect(classify('PHASE_1_COMPLETE_SUMMARY.md')).toEqual({
      tier: 'EPHEMERAL',
      confidence: 0.95,
      method: 'pattern'
    });
  });

  it('should fall back to content analysis for unknown files', async () => {
    const result = await classify('unknown_document.md');
    expect(result.method).toBe('content');
    expect(result.confidence).toBeLessThan(0.80);
  });
});

describe('Organizer Logic', () => {
  it('should move misplaced files to correct location', async () => {
    await organize('Docs/PHASE_1_COMPLETE_SUMMARY.md');
    expect(fs.existsSync('docs/sessions/2025-11/PHASE_1_COMPLETE_SUMMARY.md')).toBe(true);
  });

  it('should update references when moving files', async () => {
    await organize('Docs/Orchestrator_PRD.md');
    const claudeMd = await fs.promises.readFile('CLAUDE.md', 'utf8');
    expect(claudeMd).toContain('docs/core/Orchestrator_PRD.md');
  });

  it('should not move CRITICAL files', async () => {
    await expect(organize('CLAUDE.md')).rejects.toThrow('CRITICAL files cannot be moved');
  });
});

describe('Manifest Operations', () => {
  it('should create empty manifest for new project', async () => {
    const manifest = await loadManifest('/new/project');
    expect(manifest.files).toEqual({});
    expect(manifest.version).toBe('1.0');
  });

  it('should update file entry correctly', async () => {
    await updateFileEntry('/project', 'test.md', {
      tier: 'EPHEMERAL',
      confidence: 0.95
    });
    
    const manifest = await loadManifest('/project');
    expect(manifest.files['test.md'].tier).toBe('EPHEMERAL');
  });

  it('should get expired files correctly', async () => {
    const expired = getExpiredFiles(mockManifest);
    expect(expired.length).toBe(2);
    expect(expired[0].days_until_expiration).toBeLessThan(0);
  });
});
```

### 11.2 Integration Tests

**Scenarios:**

1. **Full Lifecycle Test:**
   - Create new file
   - Trigger PostToolUse hook
   - Verify classification
   - Verify manifest update
   - Organize file
   - Wait for expiration
   - Archive file
   - Clean up

2. **Multi-File Organization Test:**
   - Create 10 misplaced files
   - Run `claude lifecycle organize --auto`
   - Verify all files moved correctly
   - Verify references updated
   - Verify manifest consistency

3. **Hook Integration Test:**
   - Create file via Claude write tool
   - Verify PostToolUse hook triggered
   - Verify classification happened automatically
   - Verify frontmatter added

4. **diet103 Validation Integration:**
   - Run diet103 validation
   - Check organization score included
   - Verify misplaced files detected
   - Run auto-repair
   - Re-validate

### 11.3 Performance Benchmarks

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Classify single file | <50ms | Pattern + content analysis |
| Organize single file | <200ms | Move + update references |
| Load manifest | <20ms | JSON parse + validation |
| Update manifest | <50ms | Write + atomic save |
| Full organization (100 files) | <10s | Batch processing |

---

## 12. Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

**Goal:** Establish classification engine and manifest system

**Tasks:**
1. Create skill directory structure
2. Implement classification engine (pattern-based)
3. Implement manifest operations (CRUD)
4. Write classification rules JSON
5. Create unit tests

**Deliverables:**
- [ ] `lib/classifier.js` implemented
- [ ] `lib/manifest.js` implemented
- [ ] `resources/classification-rules.json` defined
- [ ] Unit tests passing (>95% coverage)

### Phase 2: Organization Workflows (Week 2)

**Goal:** Implement file organization and movement logic

**Tasks:**
1. Implement organizer logic
2. Create directory structure builder
3. Add reference updating system
4. Implement content-based classification (fallback)
5. Create organize workflow documentation

**Deliverables:**
- [ ] `lib/organizer.js` implemented
- [ ] `workflows/organize.md` documented
- [ ] Reference updating works
- [ ] Integration tests passing

### Phase 3: Hook Integration (Week 3)

**Goal:** Integrate with PostToolUse hook for automatic classification

**Tasks:**
1. Enhance PostToolUse hook
2. Implement `hooks/onFileChanged.js`
3. Add frontmatter operations
4. Test automatic classification flow
5. Write hook documentation

**Deliverables:**
- [ ] PostToolUse hook enhanced
- [ ] Automatic classification works
- [ ] Frontmatter added to markdown files
- [ ] Hook tests passing

### Phase 4: Lifecycle Management (Week 4)

**Goal:** Implement archival and cleanup workflows

**Tasks:**
1. Implement archive workflow
2. Implement cleanup workflow
3. Add expiration tracking
4. Create warning notifications
5. Write workflow documentation

**Deliverables:**
- [ ] `workflows/archive.md` implemented
- [ ] `workflows/cleanup.md` implemented
- [ ] Expiration tracking works
- [ ] Warning system functional

### Phase 5: CLI & Integration (Week 5)

**Goal:** Complete CLI and integrate with Orchestrator/diet103

**Tasks:**
1. Implement CLI commands (`claude lifecycle`)
2. Integrate with diet103 validation
3. Add organization scoring
4. Create status/stats commands
5. Write integration documentation

**Deliverables:**
- [ ] All CLI commands working
- [ ] diet103 integration complete
- [ ] Organization scoring functional
- [ ] Integration tests passing

### Phase 6: Polish & Documentation (Week 6)

**Goal:** Production readiness

**Tasks:**
1. Write comprehensive SKILL.md
2. Create examples and troubleshooting docs
3. Optimize performance
4. Final testing across all scenarios
5. Update Orchestrator documentation

**Deliverables:**
- [ ] SKILL.md complete (<500 lines)
- [ ] All resources/ documentation complete
- [ ] Performance benchmarks met
- [ ] Zero known bugs

---

## 13. Success Metrics

### 13.1 Functional Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Auto-classification accuracy | >90% | Manual review of 100 files |
| Organization correctness | 100% | All files in expected locations |
| Reference update accuracy | >99% | No broken links after organization |
| Archival timing accuracy | 100% | Files archived exactly on expiration |
| Hook trigger reliability | >99.5% | Triggered on every file write/edit |

### 13.2 Performance Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Classification time | <50ms | Time per file |
| Organization time (single) | <200ms | Move + update references |
| Full organize (100 files) | <10s | Batch processing |
| Manifest load time | <20ms | JSON parse time |
| Hook overhead | <100ms | Total hook execution time |

### 13.3 User Experience Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Zero-friction classification | >95% auto-classified | No user confirmation needed |
| Organization transparency | 100% | Clear output, no surprises |
| Protection effectiveness | 100% | Zero accidental CRITICAL file moves |
| Archive notifications | 100% | All expiring files warned 7 days prior |

---

## 14. Risk Management

### 14.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Incorrect classification** | Medium | High | Conservative defaults, user confirmation for low confidence, learn from feedback |
| **Broken references** | Low | High | Comprehensive reference scanning, dry-run mode, rollback capability |
| **Manifest corruption** | Low | High | Atomic writes, backups before changes, validation on load |
| **Hook performance** | Medium | Medium | Async processing, confidence threshold to skip heavy analysis |
| **Git history loss** | Low | High | Use `git mv` for tracked files, preserve file metadata |

### 14.2 User Experience Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Unexpected file moves** | Medium | Medium | Dry-run by default for ambiguous cases, clear notifications |
| **Lost files** | Low | High | Never auto-delete, only move to archive, 7-day warning period |
| **Confusion about tiers** | High | Low | Clear documentation, examples, status command |
| **Overwhelming notifications** | Medium | Low | Batch notifications, configurable warning periods |

### 14.3 Integration Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Hook conflicts** | Low | Medium | Namespace hooks properly, fail gracefully if other hooks error |
| **diet103 incompatibility** | Low | High | Extensive compatibility testing, maintain separate concerns |
| **Orchestrator conflicts** | Low | Medium | Use separate manifest, don't modify core Orchestrator files |
| **Project-specific needs** | High | Low | Allow project-level config overrides, custom rules |

### 14.4 Rollback Strategy

**If lifecycle management causes issues:**

1. **Disable System:**
   ```bash
   # In config.json:
   "fileLifecycle": { "enabled": false }
   ```

2. **Revert Organization:**
   ```bash
   # Manifest stores original paths
   claude lifecycle revert --all
   ```

3. **Remove Hook Integration:**
   ```bash
   # Comment out lifecycle section in PostToolUse.js
   ```

4. **Restore from Backup:**
   ```bash
   # Manifest automatically backed up before changes
   cp .file-manifest.json.backup .file-manifest.json
   ```

---

## 15. Future Enhancements (Post v1.0)

### 15.1 Planned Features (v1.1)

- **AI-Powered Classification:** Use Claude API for content-based classification improvements
- **Custom Tiers:** Allow projects to define custom classification tiers beyond the 4 defaults
- **Tag Inheritance:** Automatically inherit tags from directory structure
- **Smart Archive Compression:** Compress old archives automatically to save space
- **Cross-Project Organization:** Organize files across multiple related projects

### 15.2 Considered Features (Future)

- **Version Control Integration:** Deeper git integration, track file renames in commits
- **Content Search:** Index archived files for fast content search
- **Lifecycle Policies:** Custom policies per file type or project
- **Team Collaboration:** Shared classification rules across team
- **Cloud Sync:** Sync manifests across machines
- **ML-Based Classification:** Train model on user corrections

---

## 16. Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| **File Tier** | Classification level: CRITICAL, PERMANENT, EPHEMERAL, ARCHIVED |
| **Manifest** | Centralized index (.file-manifest.json) tracking all files and metadata |
| **Frontmatter** | YAML metadata at the top of markdown files (---\n...yaml...\n---) |
| **Organization Score** | Percentage of files in correct locations (0-100%) |
| **Confidence Score** | Classification certainty (0-1 or 0-100%) |
| **Expected Path** | Correct location for file based on tier and type |
| **Misplaced File** | File not in its expected location |
| **Expiration Date** | Date when ephemeral file should be archived |
| **Warning Period** | 7 days before expiration, user notified |
| **Lifecycle** | Full journey: Created → Active → Warning → Archived → Cleaned Up |

### B. References

**Core Architectures:**
- Orchestrator PRD: `docs/core/Orchestrator_PRD.md` (Section 3.6: Agentic Feature Selection)
- diet103 Validation: `docs/core/diet103_Validation_System.md`
- PAI Skills-as-Containers: Global `~/.claude/` structure
- diet103 Hook System: `.claude/hooks/` integration

**Related Documentation:**
- PAI v1.2.0 Migration Notice: `~/.claude/CLAUDE.md` (Section: PAI v1.2.0)
- Orchestrator Global Layer: `~/.claude/CLAUDE.md` (Section: Global AI Orchestration Layer)
- diet103 Production Patterns: `.claude/README.md` in projects

### C. Example Classification Rules

**Critical Files (Never Move):**
```
CLAUDE.md
config.json
*_PRD.md
skill-rules.json
metadata.json
.file-manifest.json
```

**Permanent Files (Organize but Keep):**
```
lib/**/*
skills/**/*
templates/**/*
*IMPLEMENTATION.md
*_guidelines.md
*_reference.md
README.md
```

**Ephemeral Files (Auto-Archive After 30 Days):**
```
*COMPLETE*SUMMARY.md
PHASE_*.md
session*.md
temp_*
scratch_*
*_YYYY-MM-DD*
```

### D. Directory Mapping

**Global Layer:**
```
~/.claude/
├── [CRITICAL] CLAUDE.md, config.json, .file-manifest.json
├── [PERMANENT] lib/, skills/, templates/
└── [ORGANIZED] docs/
    ├── core/ [CRITICAL PRDs]
    ├── impl/ [PERMANENT implementation guides]
    ├── sessions/YYYY-MM/ [EPHEMERAL session reports]
    └── archive/YYYY-MM/ [ARCHIVED historical docs]
```

**Project Layer:**
```
<project>/.claude/
├── [CRITICAL] Claude.md, metadata.json, skill-rules.json, .file-manifest.json
├── [PERMANENT] skills/, commands/, agents/, hooks/, resources/
└── [ORGANIZED] docs/
    ├── core/ [CRITICAL project docs]
    ├── impl/ [PERMANENT implementation docs]
    ├── sessions/YYYY-MM/ [EPHEMERAL session notes]
    └── archive/YYYY-MM/ [ARCHIVED historical docs]
```

---

## Document Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-10 | Initial comprehensive PRD | Claude Code |

---

**END OF DOCUMENT**

