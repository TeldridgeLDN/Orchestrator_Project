# Podcast Learning Extraction System - Architecture

## Overview

This system transforms podcast episodes into actionable insights through a modular, extensible architecture. Each component follows the Single Responsibility Principle and can be used independently or as part of the complete pipeline.

## Core Principles

1. **Modularity**: Each module handles one specific concern
2. **Loose Coupling**: Modules communicate through well-defined interfaces
3. **Dependency Injection**: External dependencies (API clients, file systems) are injected
4. **Testability**: All modules are unit-testable in isolation
5. **Extensibility**: New processing steps can be added without modifying existing code

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI Layer                           │
│                         (cli.js)                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    Orchestration Layer                      │
│                      (process.js)                           │
└──────┬──────────────┬──────────────┬──────────────┬─────────┘
       │              │              │              │
       ↓              ↓              ↓              ↓
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Input   │  │ Insight  │  │Reference │  │  Action  │
│ Handler  │  │Extractor │  │  System  │  │Generator │
└──────────┘  └──────────┘  └─────┬────┘  └──────────┘
                                   │
                        ┌──────────┴──────────┐
                        ↓                     ↓
                  ┌──────────┐        ┌──────────┐
                  │ Parser   │        │Categorizer│
                  └──────────┘        └──────────┘
                        │                     │
                        └──────────┬──────────┘
                                   ↓
                            ┌──────────┐
                            │ Markdown │
                            │Generator │
                            └──────────┘
```

## Module Overview

### 1. Input Handler (`input-handler.js`)

**Responsibility**: Validates and prepares input data

**Key Functions**:
- `validateInput(input)` - Validates all input fields
- `readFromFile(path)` - Reads content from files
- `extractLinks(markdown)` - Extracts URLs from show notes
- `getDefaultContexts()` - Provides default user contexts

**Dependencies**: `marked`, `validator`

**Exports**: Pure validation functions, no external state

**Interface**:
```javascript
validateInput(input) → { valid: boolean, errors: string[], data: Object }
```

### 2. Insight Extractor (`insight-extractor.js`)

**Responsibility**: Extracts key insights using Claude API

**Key Functions**:
- `initializeClient(apiKey)` - Creates Anthropic client
- `extractInsights(client, inputData, options)` - Performs extraction
- `extractInsightsTestMode()` - Test mode without API calls

**Dependencies**: `@anthropic-ai/sdk`

**Exports**: Functions that accept injected API client

**Interface**:
```javascript
extractInsights(client, inputData, options) → {
  success: boolean,
  insights: string[],
  metadata: Object
}
```

### 3. Reference System

#### 3a. Reference Parser (`reference-parser.js`)

**Responsibility**: Validates URL reachability

**Key Functions**:
- `validateUrls(urls, options)` - Checks URL status
- `validateSingleUrl(url)` - Validates one URL
- `groupResultsByStatus(results)` - Groups results

**Dependencies**: `axios`, `validator`

**Interface**:
```javascript
validateUrls(urls, options) → Promise<Array<{
  url: string,
  valid: boolean,
  reachable: boolean,
  status?: number,
  ...
}>>
```

#### 3b. Reference Categorizer (`reference-categorizer.js`)

**Responsibility**: Categorizes references by type

**Key Functions**:
- `categorizeByRules(reference)` - Rule-based categorization
- `categorizeWithAI(client, reference)` - AI-assisted categorization
- `categorizeReferences(references, options)` - Batch categorization

**Dependencies**: Pattern matching, optional Claude API

**Interface**:
```javascript
categorizeReferences(references, options) → Promise<Array<{
  ...reference,
  category: string
}>>
```

### 4. Action Generator (`action-generator.js`)

**Responsibility**: Generates context-specific action items

**Key Functions**:
- `generateActions(client, insights, contexts, episode, options)` - Generates actions
- `validateActions(actions, contexts)` - Validates completeness
- `getActionStats(actions)` - Computes statistics

**Dependencies**: Claude API (injected)

**Interface**:
```javascript
generateActions(client, insights, contexts, episode, options) → {
  success: boolean,
  actions: Array<{
    name: string,
    actions: Array<Action>
  }>,
  metadata: Object
}
```

### 5. Markdown Generator (`markdown-generator.js`)

**Responsibility**: Assembles structured markdown reports

**Key Functions**:
- `generateMarkdown(data)` - Creates markdown string
- `generateReport(data, options)` - Generates and saves report
- `validateMarkdown(markdown)` - Validates structure

**Dependencies**: `fs/promises` for file operations

**Interface**:
```javascript
generateReport(data, options) → Promise<{
  success: boolean,
  markdown: string,
  filePath: string,
  stats: Object
}>
```

### 6. Orchestrator (`process.js`)

**Responsibility**: Coordinates the complete pipeline

**Key Functions**:
- `processEpisode(inputData, options)` - Main pipeline
- `saveResult(output, metadata)` - Saves JSON output

**Dependencies**: All above modules

**Pipeline Steps**:
1. Validate input
2. Extract insights (Claude API)
3. Validate references (HTTP checks)
4. Categorize references (rules + optional AI)
5. Generate actions (Claude API)
6. Save JSON output
7. Generate markdown report

**Interface**:
```javascript
processEpisode(inputData, options) → Promise<{
  success: boolean,
  output: Object,
  insights: string[],
  metadata: Object,
  markdownPath: string
}>
```

### 7. CLI Interface (`cli.js`)

**Responsibility**: Command-line interface for users

**Commands**:
- `input` - Interactive input mode
- `input-from-files` - File-based input
- `validate` - Validation only
- `process` - Full pipeline

**Dependencies**: `commander`, `inquirer`, `chalk`

## Data Flow

### Input Data Structure
```javascript
{
  metadata: {
    title: string,
    guest: string,
    episodeNumber: number,
    date?: string,
    duration?: string
  },
  transcript: string,
  showNotes: string,  // Markdown format
  contexts: Array<{
    name: string,
    description: string,
    goals?: string[]
  }>
}
```

### Output Data Structure
```javascript
{
  episode: { /* metadata */ },
  insights: string[],
  references: Array<{
    url: string,
    category: string,
    valid: boolean,
    reachable: boolean,
    title?: string,
    description?: string
  }>,
  actions: Array<{
    name: string,
    description: string,
    actions: Array<{
      title: string,
      description: string,
      effort: 'low' | 'medium' | 'high',
      impact: 'low' | 'medium' | 'high',
      timeframe: 'immediate' | 'short-term' | 'long-term',
      relatedInsights: number[]
    }>
  }>,
  metadata: {
    processedAt: string,
    model: string,
    duration: number,
    usage: { input_tokens, output_tokens }
  }
}
```

## Dependency Injection Pattern

All modules that depend on external services accept those dependencies as parameters:

```javascript
// Good: Dependency is injected
async function extractInsights(client, inputData, options) {
  // Use injected client
  const response = await client.messages.create({ ... });
}

// Usage
const client = initializeClient(apiKey);
await extractInsights(client, data);
```

This enables:
- **Testing**: Mock clients can be injected
- **Flexibility**: Different API clients can be used
- **Reusability**: Functions work with any compatible client

## Extension Points

### Adding a New Processing Step

1. Create a new module file (e.g., `quote-extractor.js`)
2. Export functions following the interface pattern:
   ```javascript
   export async function extractQuotes(client, transcript, options) {
     // Implementation
     return { success: true, quotes: [...] };
   }
   ```
3. Add to `process.js` orchestration:
   ```javascript
   const quotesResult = await extractQuotes(client, inputData.transcript);
   ```
4. Update output structure to include new data
5. Update markdown generator to render new section

### Adding a New Reference Category

1. Add category to `CATEGORIES` in `reference-categorizer.js`
2. Add URL patterns to `URL_PATTERNS`
3. Add category config to markdown generator
4. Category will automatically appear in outputs

### Adding a New Context

1. Update `getDefaultContexts()` in `input-handler.js`
2. Add context-specific prompts in `action-generator.js`
3. Test with new context data

## Testing Strategy

### Unit Tests
- Each module has isolated tests in `__tests__/`
- Mock external dependencies (API clients, file system)
- Test both success and error paths

### Test Mode
- Most modules support `testMode` option
- Uses pre-generated test data (JSON files)
- Enables testing without API keys or network access

### Integration Tests
- Full pipeline test with sample Episode 1 data
- Validates end-to-end data flow
- Checks output file generation

## Configuration

### Environment Variables (`.env`)
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

### Options Objects
All processing functions accept options for:
- `verbose` - Logging verbosity
- `testMode` - Use test data instead of API calls
- `logToFile` - Write API logs to files
- Model parameters (`model`, `maxTokens`, `temperature`)

## Error Handling

### Input Validation
- All inputs validated before processing
- Clear error messages with field names
- Early exit on validation failure

### API Errors
- Caught and logged with full context
- Logged to `outputs/podcast-learning/logs/`
- User-friendly error messages in terminal

### File System Errors
- Graceful handling of missing files
- Directory creation as needed
- Clear error messages with file paths

## Performance Considerations

### Concurrency
- Reference validation uses concurrent HTTP requests (default: 3)
- Configurable via `concurrency` option
- Rate limiting via `delayMs` option

### Caching
- Not currently implemented
- Future: Cache reference validation results
- Future: Cache categorization decisions

### Token Usage
- Logged and displayed to user
- Test mode available to avoid API costs during development

## Future Enhancements

### Planned Features
1. **Quote Extraction**: Pull notable quotes from transcripts
2. **Theme Detection**: Identify recurring themes across episodes
3. **Related Episodes**: Link episodes by topic similarity
4. **Learning Progress**: Track action completion over time
5. **Export Formats**: PDF, Notion, Obsidian formats

### Architecture Improvements
1. **Plugin System**: Load processing steps as plugins
2. **Configuration Files**: YAML/JSON config for defaults
3. **Streaming**: Process long episodes in chunks
4. **Caching Layer**: Redis/file-based caching
5. **Web Interface**: REST API for remote processing

## Code Quality Standards

### Style
- ES modules (`.js` with `type: "module"`)
- Async/await for asynchronous operations
- Descriptive function and variable names
- JSDoc comments for public functions

### Organization
- One main responsibility per file
- Related functions grouped together
- Exports at end of file
- Clear separation of concerns

### Documentation
- README for getting started
- This ARCHITECTURE doc for understanding structure
- JSDoc for API documentation
- Inline comments for complex logic

## Maintenance

### Adding Dependencies
```bash
npm install <package>
```
Update imports and document in this file.

### Updating Test Data
- Edit `test-insights.json`, `test-actions.json`
- Run tests to verify: `npm test`
- Update if structure changes

### Versioning
- Follow semantic versioning
- Update `VERSION` in `index.js`
- Document breaking changes

