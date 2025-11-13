# Module Structure & Dependencies

## Module Dependency Graph

```
config.js (No dependencies - Configuration only)
    ↓
input-handler.js (marked, validator)
    ↓
insight-extractor.js (@anthropic-ai/sdk)
    ↓
reference-parser.js (axios, validator)
    ↓
reference-categorizer.js (@anthropic-ai/sdk - optional)
    ↓
action-generator.js (@anthropic-ai/sdk)
    ↓
markdown-generator.js (fs/promises)
    ↓
process.js (All above modules)
    ↓
cli.js (commander, inquirer, chalk)
    ↓
index.js (Main exports)
```

## Module Details

### Core Modules (No Business Logic Dependencies)

#### `config.js`
- **Purpose**: Configuration management
- **Dependencies**: `dotenv`
- **Exports**: Configuration functions and defaults
- **Used By**: All modules
- **Can Run Standalone**: ✅ Yes

#### `input-handler.js`
- **Purpose**: Input validation and file reading
- **Dependencies**: `marked`, `validator`
- **Exports**: Validation and parsing functions
- **Used By**: `cli.js`, `process.js`
- **Can Run Standalone**: ✅ Yes

### Processing Modules (Independent)

#### `insight-extractor.js`
- **Purpose**: Extract insights using Claude API
- **Dependencies**: `@anthropic-ai/sdk`, `chalk`
- **Exports**: Extraction functions with DI pattern
- **Used By**: `process.js`
- **Can Run Standalone**: ✅ Yes (with API client)
- **Test Mode**: ✅ Supported

#### `reference-parser.js`
- **Purpose**: Validate URL reachability
- **Dependencies**: `axios`, `validator`
- **Exports**: URL validation functions
- **Used By**: `process.js`
- **Can Run Standalone**: ✅ Yes

#### `reference-categorizer.js`
- **Purpose**: Categorize references by type
- **Dependencies**: `@anthropic-ai/sdk` (optional), `chalk`
- **Exports**: Categorization functions
- **Used By**: `process.js`
- **Can Run Standalone**: ✅ Yes
- **AI Optional**: ✅ Works with rules only

#### `action-generator.js`
- **Purpose**: Generate context-specific actions
- **Dependencies**: `@anthropic-ai/sdk`, `chalk`
- **Exports**: Action generation functions with DI
- **Used By**: `process.js`
- **Can Run Standalone**: ✅ Yes (with API client)
- **Test Mode**: ✅ Supported

#### `markdown-generator.js`
- **Purpose**: Generate markdown reports
- **Dependencies**: `fs/promises`, `chalk`
- **Exports**: Markdown generation and validation
- **Used By**: `process.js`
- **Can Run Standalone**: ✅ Yes

### Orchestration Modules

#### `process.js`
- **Purpose**: Coordinate complete pipeline
- **Dependencies**: All processing modules above
- **Exports**: `processEpisode` function
- **Used By**: `cli.js`, `index.js`
- **Can Run Standalone**: ✅ Yes (with all inputs)

#### `cli.js`
- **Purpose**: Command-line interface
- **Dependencies**: `commander`, `inquirer`, `chalk`, `process.js`
- **Exports**: CLI commands
- **Used By**: End users via terminal
- **Can Run Standalone**: ✅ Yes (entry point)

#### `index.js`
- **Purpose**: Main module exports
- **Dependencies**: All modules
- **Exports**: Public API for programmatic use
- **Used By**: External code importing this package
- **Can Run Standalone**: ✅ Yes

## Dependency Injection Pattern

All modules that interact with external services use dependency injection:

```javascript
// Module receives dependencies as parameters
export async function extractInsights(client, inputData, options) {
  const response = await client.messages.create({ ... });
  return { success: true, insights: [...] };
}

// Usage - inject the client
const client = initializeClient(apiKey);
const result = await extractInsights(client, data);
```

**Benefits**:
- Easy to test with mock clients
- Flexible - can swap implementations
- No hidden global dependencies
- Clear what each function needs

## Module Independence Levels

### Level 1: Fully Independent
Can be used with zero dependencies on other modules:
- ✅ `config.js`
- ✅ `input-handler.js`
- ✅ `markdown-generator.js`

### Level 2: API Client Required
Need an injected API client but no other modules:
- ✅ `insight-extractor.js` (+ test mode)
- ✅ `action-generator.js` (+ test mode)

### Level 3: Data Dependencies
Need processed data from other modules:
- ✅ `reference-parser.js` (needs URLs from input-handler)
- ✅ `reference-categorizer.js` (needs reference objects)

### Level 4: Orchestration
Coordinate multiple modules:
- ✅ `process.js` (uses all processing modules)
- ✅ `cli.js` (uses process.js)
- ✅ `index.js` (exports all modules)

## Import Patterns

### Good: Direct imports for used functions
```javascript
import { validateInput, readFromFile } from './input-handler.js';
```

### Good: Namespace imports for many functions
```javascript
import * as inputHandler from './input-handler.js';
```

### Good: Dynamic imports for conditional loading
```javascript
if (useAI) {
  const { categorizeWithAI } = await import('./reference-categorizer.js');
}
```

### Bad: Circular dependencies
```javascript
// Never do this - creates circular dependency
import { processEpisode } from './process.js'; // in input-handler.js
```

## Testing Strategy by Module

### Unit Tests (All Modules)
Each module has isolated unit tests in `__tests__/`:
- Input validation: `input-handler.test.js` (planned)
- Categorization: `reference-categorizer.test.js` ✅
- Actions: `action-generator.test.js` ✅
- Markdown: `markdown-generator.test.js` ✅

### Integration Tests
- Full pipeline test with Episode 1 data ✅
- Tests `process.js` with all modules

### Mock Strategy
- API clients mocked with test data
- File system mocked for deterministic tests
- HTTP requests mocked with predefined responses

## Extension Guidelines

### Adding a New Processing Module

1. **Create module file**: `new-module.js`
2. **Follow DI pattern**: Accept dependencies as parameters
3. **Export pure functions**: No global state
4. **Add test mode**: Support testing without external dependencies
5. **Write unit tests**: Create `__tests__/new-module.test.js`
6. **Update orchestrator**: Add to `process.js` pipeline
7. **Update exports**: Add to `index.js`
8. **Document**: Update this file and ARCHITECTURE.md

### Example New Module Template

```javascript
/**
 * New Module Description
 */

import chalk from 'chalk';

/**
 * Main processing function
 * @param {Object} client - Injected dependency
 * @param {Object} data - Input data
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Processing result
 */
export async function processData(client, data, options = {}) {
  const {
    verbose = true,
    testMode = false
  } = options;

  if (testMode) {
    return await processDataTestMode();
  }

  if (verbose) {
    console.log(chalk.blue('Processing...'));
  }

  try {
    // Processing logic here
    const result = { /* ... */ };
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test mode implementation
 */
async function processDataTestMode() {
  // Return test data
  return {
    success: true,
    data: { /* test data */ }
  };
}

export default {
  processData
};
```

## File Organization

```
podcast-learning/
├── Core Modules
│   ├── config.js              # Configuration management
│   ├── input-handler.js       # Input validation
│   ├── insight-extractor.js   # Insight extraction
│   ├── reference-parser.js    # URL validation
│   ├── reference-categorizer.js  # Reference categorization
│   ├── action-generator.js    # Action generation
│   └── markdown-generator.js  # Markdown reports
│
├── Orchestration
│   ├── process.js            # Pipeline orchestration
│   ├── cli.js                # CLI interface
│   └── index.js              # Main exports
│
├── Test Data
│   ├── test-insights.json    # Pre-generated insights
│   ├── test-actions.json     # Pre-generated actions
│   └── test-data/            # Sample episode data
│       ├── sample-transcript.txt
│       └── sample-show-notes.md
│
├── Tests
│   └── __tests__/
│       ├── reference-categorizer.test.js
│       ├── action-generator.test.js
│       └── markdown-generator.test.js
│
└── Documentation
    ├── ARCHITECTURE.md        # Architecture overview
    ├── MODULE_STRUCTURE.md    # This file
    ├── README.md             # Getting started
    └── env.example           # Environment template
```

## Best Practices

### ✅ Do:
- Use dependency injection for external dependencies
- Export pure functions when possible
- Support test mode in API-dependent modules
- Write unit tests for each module
- Document function interfaces with JSDoc
- Use descriptive function names
- Handle errors gracefully
- Log important steps when verbose=true

### ❌ Don't:
- Create circular dependencies
- Use global state or singletons
- Mix concerns in a single module
- Skip error handling
- Make API calls in test mode
- Import entire modules when you need one function
- Hardcode configuration values
- Leave console.log statements in production code

## Performance Considerations

### Lazy Loading
- Use dynamic imports for optional features
- Load heavy dependencies only when needed
- Example: AI categorization only loaded if enabled

### Concurrency
- Reference validation uses concurrent HTTP requests
- Action generation could batch multiple contexts
- Configurable via options

### Caching Opportunities
- Reference validation results (by URL)
- Categorization decisions (by URL pattern)
- API responses (by input hash)
- Currently not implemented - future enhancement

## Security Considerations

### API Keys
- Never commit API keys to repository
- Load from environment variables only
- Validate before use
- Clear error messages when missing

### Input Validation
- All user input validated before processing
- URLs sanitized before HTTP requests
- File paths validated to prevent directory traversal
- Markdown sanitized before parsing

### Output Safety
- File paths validated before writing
- Directories created with safe permissions
- No arbitrary code execution
- No eval() or similar dangerous functions

