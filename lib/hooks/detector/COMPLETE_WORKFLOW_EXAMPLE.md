# Complete Hook Detection & Generation Workflow

This example demonstrates the end-to-end process of detecting hook requirements, generating checklists, and creating all necessary artifacts.

## Scenario: Documentation Template Lifecycle

**Problem**: We created a documentation template system, but there's no hook to track when templates are used or monitor the documentation lifecycle.

**Solution**: Use the automated hook assessment system to detect, plan, and generate the required hook.

## Step 1: Feature Analysis

First, analyze the feature to detect hook requirements:

```javascript
import { HookRequirementDetector } from './lib/hooks/detector/HookRequirementDetector.js';

// Create detector
const detector = new HookRequirementDetector();

// Define feature specification
const featureSpec = {
  name: 'Documentation Template System',
  metadata: {
    category: 'documentation',
    author: 'dev-team',
    version: '1.0.0'
  },
  workflowPatterns: [
    'file-monitoring',
    'lifecycle-tracking'
  ],
  fileOperations: {
    writes: ['Docs/**/*.md'],
    monitors: [
      'Docs/**/*.md',
      'templates/documentation/*.md',
      'templates/documentation/**/*.md'
    ]
  },
  externalIntegrations: {
    systems: ['PAI history.jsonl'],
    logsToExternal: true
  },
  statePersistence: {
    requiresTimestamps: true,
    requiresThrottling: true
  }
};

// Analyze feature
const analysis = await detector.analyzeFeature(featureSpec);

console.log('Required Hooks:', analysis.requiredHooks.length);
console.log('Optional Hooks:', analysis.optionalHooks.length);
console.log('Warnings:', analysis.warnings);
```

### Expected Output

```javascript
{
  requiredHooks: [
    {
      type: 'postToolUse',
      name: 'DocumentationLifecycle',
      priority: 45,
      confidence: 0.85,
      reason: 'Feature requires monitoring documentation files and tracking lifecycle'
    }
  ],
  optionalHooks: [],
  warnings: [],
  analysisDetails: {
    fileOperations: {
      writes: ['Docs/**/*.md'],
      monitors: [
        'Docs/**/*.md',
        'templates/documentation/*.md'
      ]
    },
    externalIntegrations: {
      systems: ['PAI history.jsonl'],
      logsToExternal: true
    },
    statePersistence: {
      requiresTimestamps: true,
      requiresThrottling: true
    }
  }
}
```

## Step 2: Generate Integration Checklist

Create a detailed checklist for implementing the hook:

```javascript
import { IntegrationChecklistGenerator } from './lib/hooks/detector/IntegrationChecklistGenerator.js';

// Create checklist generator
const checklistGen = new IntegrationChecklistGenerator();

// Get the first required hook
const hookRecommendation = analysis.requiredHooks[0];

// Generate checklist
const checklist = await checklistGen.generateChecklist(
  hookRecommendation,
  analysis.analysisDetails
);

// Output markdown checklist
console.log(checklist.markdown);

// Or save to file
import fs from 'fs/promises';
await fs.writeFile(
  '.taskmaster/hooks/checklists/documentation-lifecycle-checklist.md',
  checklist.markdown,
  'utf-8'
);
```

### Generated Checklist Preview

```markdown
# Hook Integration Checklist: DocumentationLifecycle

**Type:** POST_TOOL_USE  
**Priority:** 45  
**Confidence:** 85%

## Pre-Implementation

- [ ] Review existing POST_TOOL_USE hooks
- [ ] Verify hook execution context
- [ ] Check for priority conflicts

## Implementation

- [ ] Create hook file: lib/hooks/documentation-lifecycle.js
- [ ] Implement hook handler function
- [ ] Add file monitoring logic
- [ ] Configure timestamp tracking
- [ ] Implement throttling mechanism
- [ ] Set up external logging to PAI history.jsonl

## Registration

- [ ] Import hook in lib/hooks/index.js
- [ ] Register with priority 45
- [ ] Verify execution order

## Testing

- [ ] Create test file: tests/hooks/documentation-lifecycle.test.js
- [ ] Test file monitoring
- [ ] Test timestamp tracking
- [ ] Test external logging
- [ ] Test integration with existing hooks

## Validation

- [ ] Hook triggers after tool execution
- [ ] Files are monitored correctly
- [ ] Logs to PAI history.jsonl
- [ ] No performance degradation
```

## Step 3: Generate All Artifacts

Automatically create the hook implementation, tests, and documentation:

```javascript
import { HookArtifactGenerator } from './lib/hooks/detector/HookArtifactGenerator.js';

// Create artifact generator
const artifactGen = new HookArtifactGenerator({
  outputDir: process.cwd(),
  overwrite: false,  // Safety: don't overwrite existing files
  dryRun: false      // Actually create files
});

// Generate all artifacts
const result = await artifactGen.generate(
  hookRecommendation,
  analysis.analysisDetails
);

// Check results
if (result.success) {
  console.log('✅ Successfully generated artifacts:');
  result.filesCreated.forEach(file => {
    console.log(`   - ${file}`);
  });
  
  console.log('\n📋 Registration Code:');
  console.log(result.registrationCode);
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
  }
} else {
  console.error('❌ Generation failed');
  result.warnings.forEach(warning => {
    console.error(`   - ${warning}`);
  });
}
```

### Expected Output

```
✅ Successfully generated artifacts:
   - /Users/you/project/lib/hooks/documentation-lifecycle.js
   - /Users/you/project/tests/hooks/documentation-lifecycle.test.js
   - /Users/you/project/lib/hooks/docs/documentation-lifecycle.md

📋 Registration Code:
// Import hook
import { documentationLifecycle } from './documentation-lifecycle.js';

// Register hook
hookManager.register(
  HookTypes.POST_TOOL_USE,
  documentationLifecycle,
  { priority: 45, name: 'DocumentationLifecycle' }
);
```

## Step 4: Review Generated Files

### Generated Hook File

`lib/hooks/documentation-lifecycle.js`:

```javascript
/**
 * DocumentationLifecycle Hook
 * 
 * Monitor documentation template usage and track lifecycle
 * 
 * @module hooks/documentation-lifecycle
 * @version 1.0.0
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';

// File tracking
const fileTimestamps = new Map();
let lastCheck = 0;

// Configuration
const CHECK_INTERVAL = 1000; // 1 second
const MONITORED_FILES = [
  "Docs/**/*.md",
  "templates/documentation/*.md",
  "templates/documentation/**/*.md"
];

/**
 * DocumentationLifecycle Hook Handler
 * 
 * Triggers after tool execution to monitor file changes.
 */
export async function documentationLifecycle(context, next) {
  try {
    // Throttle checks
    const now = Date.now();
    if (now - lastCheck < CHECK_INTERVAL) {
      await next();
      return;
    }
    lastCheck = now;
    
    // Initialize timestamps on first run
    if (fileTimestamps.size === 0) {
      await initializeTimestamps();
      await next();
      return;
    }
    
    // Check for file changes
    const changes = await detectChanges();
    
    if (changes.length > 0) {
      console.log(`📦 DocumentationLifecycle: Detected changes in ${changes.length} file(s)`);
      
      // Handle changes
      await handleChanges(changes, context);
    }
    
  } catch (error) {
    console.error(`⚠️  DocumentationLifecycle error: ${error.message}`);
  }
  
  await next();
}

// ... implementation details ...

export default documentationLifecycle;
```

### Generated Test File

`tests/hooks/documentation-lifecycle.test.js`:

```javascript
/**
 * DocumentationLifecycle Hook Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { documentationLifecycle } from '../../lib/hooks/documentation-lifecycle.js';

describe('DocumentationLifecycle Hook', () => {
  let context;
  let nextFn;

  beforeEach(() => {
    context = {};
    nextFn = vi.fn();
  });

  describe('Basic Functionality', () => {
    it('should be defined', () => {
      expect(documentationLifecycle).toBeDefined();
      expect(typeof documentationLifecycle).toBe('function');
    });

    it('should call next() to continue chain', async () => {
      await documentationLifecycle(context, nextFn);
      expect(nextFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      nextFn.mockRejectedValue(new Error('Test error'));
      
      await expect(
        documentationLifecycle(context, nextFn)
      ).resolves.not.toThrow();
    });
  });

  // TODO: Add implementation-specific tests
});
```

## Step 5: Customize and Implement

Now customize the generated code for your specific needs:

### Add PAI Logging

Edit `lib/hooks/documentation-lifecycle.js`:

```javascript
/**
 * Handle detected changes
 */
async function handleChanges(changes, context) {
  // Log to PAI history
  for (const file of changes) {
    await logToPAI({
      event: 'documentation_file_changed',
      file: file,
      timestamp: Date.now(),
      context: context
    });
  }
}

/**
 * Log event to PAI history
 */
async function logToPAI(event) {
  const historyPath = path.join(os.homedir(), '.claude', 'history.jsonl');
  const entry = JSON.stringify(event) + '\n';
  
  try {
    await fs.appendFile(historyPath, entry, 'utf-8');
  } catch (error) {
    console.error(`Failed to log to PAI: ${error.message}`);
  }
}
```

### Add File Pattern Matching

```javascript
import { glob } from 'glob';

async function initializeTimestamps() {
  for (const pattern of MONITORED_FILES) {
    const files = await glob(pattern);
    for (const file of files) {
      if (existsSync(file)) {
        const stats = await fs.stat(file);
        fileTimestamps.set(file, stats.mtimeMs);
      }
    }
  }
}
```

## Step 6: Register the Hook

Add to `lib/hooks/index.js`:

```javascript
import { documentationLifecycle } from './documentation-lifecycle.js';

// In registerBuiltInHooks function
export function registerBuiltInHooks(hookManager) {
  // ... existing hooks ...

  // Documentation lifecycle tracking
  hookManager.register(
    HookTypes.POST_TOOL_USE,
    documentationLifecycle,
    { priority: 45, name: 'DocumentationLifecycle' }
  );
}
```

## Step 7: Test the Implementation

```bash
# Run the hook tests
npm test -- tests/hooks/documentation-lifecycle.test.js

# Run integration tests
npm test -- tests/hooks/

# Test in real scenario
# 1. Start Claude Code
# 2. Create a new markdown file in Docs/
# 3. Check PAI history.jsonl for log entry
```

## Step 8: Validate

Use the checklist from Step 2 to validate:

```markdown
## Validation Results

✅ Hook triggers after tool execution
✅ Files are monitored correctly (tested with Docs/test.md)
✅ Logs to PAI history.jsonl (verified entry)
✅ No performance degradation (< 5ms overhead)
✅ Throttling works (1 check per second)
✅ Timestamp tracking accurate
✅ Integration with existing hooks verified
```

## Complete Script

Here's a complete script that runs the entire workflow:

```javascript
#!/usr/bin/env node

/**
 * Complete Hook Assessment Workflow
 * 
 * Usage: node workflow-example.js
 */

import { HookRequirementDetector } from './lib/hooks/detector/HookRequirementDetector.js';
import { IntegrationChecklistGenerator } from './lib/hooks/detector/IntegrationChecklistGenerator.js';
import { HookArtifactGenerator } from './lib/hooks/detector/HookArtifactGenerator.js';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  console.log('🔍 Step 1: Analyzing feature requirements...\n');

  // 1. Detect requirements
  const detector = new HookRequirementDetector();
  const analysis = await detector.analyzeFeature({
    name: 'Documentation Template System',
    metadata: { category: 'documentation' },
    workflowPatterns: ['file-monitoring', 'lifecycle-tracking'],
    fileOperations: {
      writes: ['Docs/**/*.md'],
      monitors: ['Docs/**/*.md', 'templates/documentation/*.md']
    },
    externalIntegrations: {
      systems: ['PAI history.jsonl'],
      logsToExternal: true
    },
    statePersistence: {
      requiresTimestamps: true,
      requiresThrottling: true
    }
  });

  console.log(`   Required hooks: ${analysis.requiredHooks.length}`);
  console.log(`   Optional hooks: ${analysis.optionalHooks.length}`);
  console.log(`   Warnings: ${analysis.warnings.length}\n`);

  if (analysis.requiredHooks.length === 0) {
    console.log('✅ No hooks required for this feature');
    return;
  }

  const hookReq = analysis.requiredHooks[0];
  console.log(`📋 Detected Hook: ${hookReq.name}`);
  console.log(`   Type: ${hookReq.type}`);
  console.log(`   Priority: ${hookReq.priority}`);
  console.log(`   Confidence: ${(hookReq.confidence * 100).toFixed(0)}%\n`);

  console.log('📝 Step 2: Generating integration checklist...\n');

  // 2. Generate checklist
  const checklistGen = new IntegrationChecklistGenerator();
  const checklist = await checklistGen.generateChecklist(
    hookReq,
    analysis.analysisDetails
  );

  const checklistPath = path.join(
    process.cwd(),
    '.taskmaster/hooks/checklists',
    `${hookReq.name.toLowerCase()}-checklist.md`
  );
  
  await fs.mkdir(path.dirname(checklistPath), { recursive: true });
  await fs.writeFile(checklistPath, checklist.markdown, 'utf-8');
  
  console.log(`   ✅ Checklist saved: ${checklistPath}\n`);

  console.log('🔨 Step 3: Generating hook artifacts...\n');

  // 3. Generate artifacts
  const artifactGen = new HookArtifactGenerator({
    outputDir: process.cwd(),
    overwrite: false
  });

  const result = await artifactGen.generate(hookReq, analysis.analysisDetails);

  if (result.success) {
    console.log('   ✅ Generated files:');
    result.filesCreated.forEach(file => {
      console.log(`      - ${path.relative(process.cwd(), file)}`);
    });
    
    console.log('\n   📋 Registration code saved to clipboard (copy from output)\n');
    console.log('─'.repeat(60));
    console.log(result.registrationCode);
    console.log('─'.repeat(60));
    
    if (result.warnings.length > 0) {
      console.log('\n   ⚠️  Warnings:');
      result.warnings.forEach(w => console.log(`      - ${w}`));
    }

    console.log('\n✅ Workflow complete!');
    console.log('\nNext steps:');
    console.log('1. Review generated files');
    console.log('2. Customize hook implementation (see TODOs)');
    console.log('3. Add registration code to lib/hooks/index.js');
    console.log('4. Run tests: npm test -- tests/hooks/' + hookReq.name.toLowerCase());
    console.log('5. Validate using checklist: ' + checklistPath);

  } else {
    console.error('❌ Generation failed:');
    result.warnings.forEach(w => console.error(`   - ${w}`));
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

## Tips & Best Practices

### 1. Always Start with Detection
Don't assume you need a hook - let the detector analyze the feature first.

### 2. Use Checklists
Follow the generated checklist to ensure nothing is missed.

### 3. Review Generated Code
The generator creates scaffolding - always review and customize.

### 4. Test Thoroughly
Run both unit tests and integration tests before deploying.

### 5. Document Customizations
If you modify the generated code significantly, update the documentation.

### 6. Version Control
Commit the generated files with a clear message referencing the feature.

## Troubleshooting

**Q: Generator says files already exist**  
A: Use `overwrite: true` or remove existing files first

**Q: Hook not triggering**  
A: Verify registration in `lib/hooks/index.js` and check priority conflicts

**Q: Tests failing**  
A: Update test TODOs with implementation-specific tests

**Q: Low confidence detection**  
A: Provide more detailed feature specification or manually verify requirements

---

**Part of:** Task 97 - Automated Hook Requirement Assessment System  
**Status:** ✅ Production Ready

