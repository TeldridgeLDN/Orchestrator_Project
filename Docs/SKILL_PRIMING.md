# Skill Priming System

**Version:** 1.0.0  
**Status:** Active  
**Philosophy:** PAI + Diet103 + Orchestrator

---

## Overview

The Skill Priming System automatically activates relevant skills during project initialization based on intelligent project type detection. This ensures new projects start with the optimal set of tools without manual configuration.

### Key Benefits

✅ **Zero Configuration** - Skills activate automatically based on project type  
✅ **Context-Aware** - Different recommendations for web apps, CLI tools, data pipelines, etc.  
✅ **User Control** - Three modes: Auto, Custom, Skip  
✅ **Progressive Disclosure** - Only activates what's needed (PAI principle)  
✅ **Non-Intrusive** - Failures don't block initialization

---

## How It Works

### 1. Project Type Detection

The system analyzes your project structure to identify its type:

```javascript
// Checks for patterns like:
'web-app':      package.json + src/ + public/ + index.html
'cli-tool':     bin/ + lib/ + package.json
'data-pipeline': *.ipynb + requirements.txt + data/
'api-service':  routes/ + controllers/ + models/
'library':      lib/ + src/ + tests/ + package.json
```

### 2. Skill Recommendations

Each project type gets curated skill recommendations:

| Project Type | Essential Skills | Recommended Skills |
|--------------|-----------------|-------------------|
| **Web App** | doc-generator, test-runner | link-checker, doc-validator |
| **CLI Tool** | shell-integration, doc-generator | test-runner, rule-management |
| **Data Pipeline** | scenario_manager, doc-generator | test-runner, pe-compression-analysis |
| **API Service** | test-runner, doc-generator | doc-validator, example-validator |
| **Library** | doc-generator, test-runner | example-validator, doc-validator |

### 3. Activation Modes

**Auto Mode (Recommended)**
```bash
? Skill activation: ✨ Auto (Recommended)
```
- Automatically activates essential + recommended skills
- Best for quick setup
- Based on detected project type

**Custom Mode**
```bash
? Skill activation: 🎯 Custom
? Select skills to activate: (Space to select)
  ◉ 📚 Doc Generator (Essential)
  ◉ 🧪 Test Runner (Recommended)
  ◯ 🔗 Link Checker
  ◯ 📦 Scenario Manager
```
- Choose specific skills manually
- Full control over activation
- Visual indicators: Essential, Recommended, Optional

**Skip Mode**
```bash
? Skill activation: ⏭️ Skip
```
- No skills activated
- Minimal setup
- Can activate later manually

---

## Usage

### During Init

```bash
$ diet103 init

🎯 Initialize Claude Project

? Project name: my-web-app
? Project description: A React dashboard
? Initialize TaskMaster? Yes
? Enable shell integration? Yes

🔍 Analyzing project structure...
   Detected project type: web-app

? Skill activation:
  ❯ ✨ Auto (Recommended) - Activate skills based on project type
    🎯 Custom - Choose specific skills to activate
    ⏭️  Skip - Don't activate any skills now

Step 5: Priming Skills
  Detected project type: web-app
  Using recommended skill recommendations
  ✓ Activated Doc Generator
  ✓ Activated Test Runner
  ✓ Activated Link Checker
  ✓ Updated project metadata
  ✓ Primed 3 skill(s)

✅ Claude Project Initialized Successfully!
─────────────────────────────────────────────────────────
Project: my-web-app
Location: /path/to/my-web-app
Context File: CLAUDE.md
Project Type: web-app
Primed Skills: doc-generator, test-runner, link-checker
─────────────────────────────────────────────────────────
```

### Programmatic Usage

```javascript
import { primeSkillsForProject } from './lib/init/skills_priming.js';

// Auto-detect and prime
const result = await primeSkillsForProject({
  projectRoot: '/path/to/project',
  projectType: 'auto-detect',  // or specific: 'web-app', 'cli-tool', etc.
  level: 'recommended',         // 'essential', 'recommended', 'all'
  verbose: true
});

// Custom skill selection
const result = await primeSkillsForProject({
  projectRoot: '/path/to/project',
  skills: ['doc-generator', 'test-runner', 'scenario_manager'],
  verbose: true
});
```

---

## Architecture

### File Structure

```
lib/init/
├── skills_priming.js          # Core priming module (500+ lines)
│   ├── detectProjectType()    # Structure analysis
│   ├── getRecommendedSkills() # Type-based recommendations
│   ├── getAvailableSkills()   # Scan .claude/skills/
│   ├── activateSkills()       # Update skill-rules.json
│   └── primeSkillsForProject() # Main entry point
│
lib/commands/
└── init.js                     # Integration with init command
    ├── interactiveSetup()     # Enhanced with skill selection
    └── initCommand()          # Skill priming step added
```

### Integration Points

1. **Project Detection** - Runs after basic project info collected
2. **Skill Selection** - Interactive prompt with visual indicators
3. **Activation** - Updates `.claude/skill-rules.json`
4. **Metadata** - Updates `.claude/metadata.json`
5. **Reporting** - Shows results in success summary

### Data Flow

```
init command
    ↓
interactiveSetup()
    ↓
detectProjectType() ────→ Analyze file structure
    ↓                     Score indicators
Skill Selection Prompt    Return best match
    ↓
primeSkillsForProject()
    ↓
getAvailableSkills() ────→ Scan .claude/skills/
    ↓                     Read metadata
activateSkills() ────────→ Update skill-rules.json
    ↓                     Set auto_activate: true
updateMetadataSkills() ──→ Update metadata.json
    ↓                     Set skills array
Success Summary
```

---

## Project Type Indicators

### Detection Logic

Each project type has weighted indicators:

```javascript
{
  patterns: ['file1', 'dir/', 'file2'],  // Must ALL exist
  weight: 3                               // Confidence score
}
```

Higher total weight = more confident match.

### Current Detection Patterns

**Web App** (Score: 7+)
- `package.json` + `src/` + `public/` + `index.html` (weight: 3)
- `vite.config.js` or `webpack.config.js` (weight: 2)
- `next.config.js` + `app/` or `pages/` (weight: 3)

**CLI Tool** (Score: 5+)
- `bin/` + `lib/` + `package.json` (weight: 3)
- `bin/` + `index.js` + `package.json` (weight: 2)

**Data Pipeline** (Score: 5+)
- `*.ipynb` + `requirements.txt` + `data/` (weight: 3)
- `scripts/` + `data/` + `notebooks/` (weight: 2)

**API Service** (Score: 5+)
- `routes/` + `controllers/` + `models/` (weight: 3)
- `api/` + `server.js` + `app.js` (weight: 2)

**Library** (Score: 3+)
- `lib/` + `src/` + `tests/` + `package.json` (weight: 2)

---

## Extending the System

### Add New Project Type

Edit `lib/init/skills_priming.js`:

```javascript
// 1. Add type indicators
const PROJECT_TYPE_INDICATORS = {
  'mobile-app': [
    { patterns: ['android/', 'ios/', 'package.json'], weight: 3 },
    { patterns: ['react-native.config.js'], weight: 2 }
  ]
};

// 2. Add skill recommendations
const SKILL_RECOMMENDATIONS = {
  'mobile-app': {
    essential: ['test-runner', 'doc-generator'],
    recommended: ['example-validator'],
    optional: ['link-checker']
  }
};
```

### Add New Skill

1. Create skill directory: `.claude/skills/my-skill/`
2. Add `skill.json` or `skill.md` with metadata
3. Add to `SKILL_RECOMMENDATIONS` if should auto-activate
4. System will automatically detect and include it

---

## Philosophy Alignment

### PAI (Progressive Disclosure)
✅ Only activates skills relevant to project type  
✅ Essential skills prioritized over optional  
✅ User can customize or skip entirely

### Diet103 (Structured Workflow)
✅ Repeatable initialization process  
✅ Documented skill activation rules  
✅ Consistent file structure expectations

### Orchestrator (Zero Friction)
✅ Automatic detection and activation  
✅ No manual configuration required  
✅ Non-blocking failures

---

## Troubleshooting

### Skills Not Activating

**Check skill exists:**
```bash
ls -la .claude/skills/
```

**Verify skill-rules.json:**
```bash
cat .claude/skill-rules.json | grep -A 5 "my-skill"
```

**Re-run priming:**
```javascript
import { primeSkillsForProject } from './lib/init/skills_priming.js';

await primeSkillsForProject({
  projectRoot: process.cwd(),
  skills: ['doc-generator', 'test-runner'],
  verbose: true
});
```

### Wrong Project Type Detected

**Override detection:**
```bash
# During init, select "Custom" mode instead of "Auto"
# Choose skills manually
```

**Or set explicitly in code:**
```javascript
await primeSkillsForProject({
  projectRoot: '/path/to/project',
  projectType: 'cli-tool',  // Force specific type
  level: 'recommended'
});
```

### Add More Indicators

Edit detection patterns to improve accuracy:

```javascript
const PROJECT_TYPE_INDICATORS = {
  'web-app': [
    // Add your framework's config
    { patterns: ['your-framework.config.js', 'src/'], weight: 3 }
  ]
};
```

---

## API Reference

### `primeSkillsForProject(options)`

Main entry point for skill priming.

**Parameters:**
```javascript
{
  projectRoot: string,           // Required: Project directory
  projectType?: string,          // Optional: 'auto-detect' (default) or specific type
  skills?: string[],             // Optional: Specific skills to activate
  level?: string,                // Optional: 'essential', 'recommended', 'all'
  verbose?: boolean              // Optional: Show detailed output
}
```

**Returns:**
```javascript
{
  success: boolean,
  primedSkills: string[],
  projectType: string,
  skippedSkills?: string[],
  error?: string
}
```

### `detectProjectType(projectRoot)`

Analyzes project structure to determine type.

**Returns:** `Promise<string>` - Detected type or 'general'

### `getRecommendedSkills(projectType, level)`

Gets recommended skills for a project type.

**Returns:** `string[]` - Array of skill IDs

### `getSkillChoices(projectRoot, projectType)`

Generates interactive prompt choices with visual indicators.

**Returns:** `Promise<Object[]>` - Prompts choices array

---

## Future Enhancements

- [ ] Machine learning for detection accuracy improvement
- [ ] Per-user skill preference profiles
- [ ] Project template-based skill bundles
- [ ] Skill dependency resolution
- [ ] Conflict detection between skills
- [ ] Usage analytics for recommendation tuning

---

*Last Updated: November 15, 2025*  
*Part of Orchestrator Project (diet103)*

