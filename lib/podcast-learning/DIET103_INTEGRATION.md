# DIET103 Scenario Integration Guide

This document explains how the Podcast Learning Extraction system integrates with the Orchestrator Project's DIET103 scenario framework.

## Overview

The Podcast Learning Extraction system is designed as a **DIET103-compliant scenario** that can be used within the Orchestrator Project's automation framework.

## DIET103 Compliance

### Scenario Structure

```
lib/podcast-learning/           # Scenario root
├── cli.js                      # Entry point (D - Driver)
├── input-handler.js            # Input validation (I - Input)
├── process.js                  # Orchestration (E - Executor)
├── [processing modules]        # Processing logic (T - Transform)
├── markdown-generator.js       # Output generation (O - Output)
└── config.js                   # Configuration (103 - Standards)
```

### DIET103 Mapping

#### D - Driver (`cli.js`)
**Role**: Entry point for scenario execution

**Responsibilities**:
- Parse command-line arguments
- Coordinate user interaction
- Trigger processing pipeline
- Handle errors and display results

**Interface**:
```javascript
// Commands
- input              # Interactive input mode
- input-from-files   # File-based input
- validate           # Validation only
- process            # Full pipeline
```

#### I - Input (`input-handler.js`)
**Role**: Input validation and preprocessing

**Responsibilities**:
- Validate episode metadata
- Validate transcript and show notes
- Extract links from markdown
- Prepare data structure

**Interface**:
```javascript
validateInput(input) → {
  valid: boolean,
  errors: string[],
  data: Object
}
```

#### E - Executor (`process.js`)
**Role**: Orchestrate the complete workflow

**Responsibilities**:
- Coordinate all processing modules
- Manage pipeline flow
- Handle errors across steps
- Collect and aggregate results

**Pipeline Steps**:
1. Input validation
2. Insight extraction
3. Reference validation
4. Reference categorization
5. Action generation
6. JSON output
7. Markdown generation

#### T - Transform (Processing Modules)
**Role**: Data transformation and enrichment

**Modules**:
- `insight-extractor.js` - Extract key insights
- `reference-parser.js` - Validate URLs
- `reference-categorizer.js` - Categorize references
- `action-generator.js` - Generate action items

**Pattern**: Each transformer is independent and composable

#### O - Output (`markdown-generator.js`)
**Role**: Generate final outputs

**Responsibilities**:
- Assemble processed data
- Generate markdown report
- Validate output structure
- Save to file system

**Output Formats**:
- JSON: Structured data
- Markdown: Human-readable report

#### 103 - Standards (`config.js`)
**Role**: Configuration and standards compliance

**Responsibilities**:
- Default configuration values
- Environment variable management
- Configuration validation
- Output path management

## Integration Points

### 1. File System Integration

#### Input Directory
```
[PROJECT_ROOT]/
├── transcripts/
│   └── episode-01.txt
└── show-notes/
    └── episode-01.md
```

#### Output Directory
```
outputs/
└── podcast-learning/
    ├── processed/              # JSON outputs
    │   └── episode-01-guest.json
    ├── episodes/               # Markdown reports
    │   └── episode-01-guest.md
    ├── logs/                   # API call logs
    │   ├── insight-extraction.log
    │   └── action-generation.log
    └── reports/                # Analysis reports
        └── processing-summary.json
```

### 2. Environment Configuration

**Required Variables**:
```bash
# .env file in project root
ANTHROPIC_API_KEY=sk-ant-...
```

**Optional Variables**:
```bash
PERPLEXITY_API_KEY=...  # For research features (future)
OPENAI_API_KEY=...      # Alternative AI provider (future)
```

### 3. Orchestrator Integration

#### As a Standalone Scenario

```javascript
// In orchestrator workflow
import { processEpisode } from './lib/podcast-learning/index.js';

const result = await processEpisode(episodeData, {
  saveOutput: true,
  testMode: false
});
```

#### As Part of Larger Pipeline

```javascript
// Multi-step orchestration
const episodes = await loadEpisodes();

for (const episode of episodes) {
  const result = await processEpisode(episode);
  await storeInKnowledgeBase(result);
  await notifyUser(result.markdownPath);
}
```

### 4. Error Handling

All modules follow consistent error patterns:

```javascript
try {
  const result = await processEpisode(data);
  if (!result.success) {
    // Handle processing failure
    console.error(result.error);
  }
} catch (error) {
  // Handle system failure
  console.error('System error:', error);
}
```

## Directory Structure Conventions

### Scenario Directory
```
lib/podcast-learning/
├── Core Modules (DIET103 components)
├── Support Modules (utilities)
├── Test Data (for development)
├── Tests (unit and integration)
└── Documentation
```

### Output Directory
```
outputs/podcast-learning/
├── processed/    # Structured data (JSON)
├── episodes/     # Human-readable reports (MD)
├── logs/         # Processing logs
└── reports/      # Analytics and summaries
```

## Naming Conventions

### Files
- **Modules**: `kebab-case.js` (e.g., `input-handler.js`)
- **Tests**: `module-name.test.js` (e.g., `input-handler.test.js`)
- **Docs**: `UPPERCASE.md` (e.g., `README.md`, `ARCHITECTURE.md`)

### Functions
- **Public API**: `camelCase` (e.g., `processEpisode`, `validateInput`)
- **Internal**: `camelCase` with descriptive names
- **Async**: Always return Promises, use `async/await`

### Variables
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_CONFIG`)
- **Module exports**: `camelCase` or `PascalCase` for classes
- **Private**: Leading underscore `_privateFunction` (by convention)

## API Interfaces

### Standard Response Format

All processing functions return:

```javascript
{
  success: boolean,
  data?: Object,
  error?: string,
  metadata?: {
    duration: number,
    timestamp: string,
    ...
  }
}
```

### Standard Options Format

All processing functions accept:

```javascript
{
  verbose?: boolean,
  testMode?: boolean,
  saveOutput?: boolean,
  ...moduleSpecificOptions
}
```

## Testing Standards

### Unit Tests
- Located in `__tests__/` directory
- Named `module-name.test.js`
- Use `vitest` framework
- Test both success and error paths
- Mock external dependencies

### Test Data
- Located in `test-data/` directory
- Include realistic examples
- Document data sources
- Version control test data

### Test Mode
- All API-dependent modules support `testMode`
- Uses pre-generated data from JSON files
- No external API calls in test mode
- Enables CI/CD without API keys

## Deployment Considerations

### Environment Setup

1. **Development**:
```bash
cd lib/podcast-learning
npm install
cp env.example ../../.env
# Edit .env with API keys
npm test
```

2. **Production**:
```bash
# Set environment variables via system
export ANTHROPIC_API_KEY=sk-ant-...
npm install --production
```

### Logging

- Console output controlled by `verbose` option
- File logging to `outputs/podcast-learning/logs/`
- Structured log format for parsing
- Separate error and info logs

### Monitoring

Key metrics to track:
- Processing time per episode
- API token usage
- Success/failure rates
- Reference validation rates
- Output file sizes

## Future DIET103 Enhancements

### Planned Features

1. **Scenario Chaining**:
   - Output from one episode feeds next
   - Build knowledge graph over time
   - Cross-reference insights

2. **Parallel Processing**:
   - Process multiple episodes concurrently
   - Shared resource management
   - Progress tracking

3. **Event System**:
   - Emit events at each pipeline step
   - Enable monitoring and hooks
   - Support custom plugins

4. **Configuration Profiles**:
   - Pre-configured scenarios
   - User-specific templates
   - Organization standards

## Compliance Checklist

- [x] DIET103 structure implemented
- [x] Clear separation of concerns
- [x] Standardized input/output formats
- [x] Environment-based configuration
- [x] Comprehensive error handling
- [x] Logging and monitoring support
- [x] Test mode for development
- [x] Documentation complete
- [x] Integration points defined
- [x] Naming conventions followed

## Example Orchestrator Workflow

```javascript
/**
 * Orchestrator workflow for batch podcast processing
 */
import { processEpisode } from './lib/podcast-learning/index.js';
import { loadEpisodes, storeResults } from './lib/utils/storage.js';

async function orchestratePodcastLearning() {
  console.log('Starting podcast learning orchestration...');
  
  // Load episodes from storage
  const episodes = await loadEpisodes('./data/episodes/');
  
  const results = [];
  
  for (const episode of episodes) {
    console.log(`Processing episode ${episode.number}...`);
    
    try {
      // Process using DIET103 scenario
      const result = await processEpisode({
        transcript: episode.transcript,
        showNotes: episode.showNotes,
        metadata: episode.metadata,
        contexts: episode.contexts
      }, {
        saveOutput: true,
        verbose: false
      });
      
      if (result.success) {
        // Store results in knowledge base
        await storeResults(result);
        results.push({
          episode: episode.number,
          status: 'success',
          insights: result.insights.length,
          actions: result.output.actions.length
        });
      }
    } catch (error) {
      console.error(`Failed to process episode ${episode.number}:`, error);
      results.push({
        episode: episode.number,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  // Generate summary report
  console.log('Orchestration complete:');
  console.log(`  Processed: ${results.filter(r => r.status === 'success').length}`);
  console.log(`  Failed: ${results.filter(r => r.status === 'failed').length}`);
  
  return results;
}

// Execute orchestration
orchestratePodcastLearning().catch(console.error);
```

## Support

For DIET103 integration questions:
1. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
2. Review [MODULE_STRUCTURE.md](./MODULE_STRUCTURE.md) for module details
3. Check test files for integration examples
4. Refer to Orchestrator Project documentation

---

**This scenario is production-ready and fully compliant with DIET103 standards.**

