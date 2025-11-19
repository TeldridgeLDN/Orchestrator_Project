# @diet103/startup-system

Shared startup verification system for diet103 projects. Ensures critical infrastructure (primacy rules, file lifecycle, TaskMaster) is properly initialized and verified on project startup.

## Features

- ✅ **Primacy Rules Verification** - Validates all 9 critical rules are present and intact
- ✅ **File Lifecycle Detection** - Checks for file management system initialization
- ✅ **TaskMaster Integration** - Verifies task management configuration
- ✅ **Flexible Output** - Detailed, compact, or silent modes
- ✅ **Project-Agnostic** - Works with any diet103 project structure
- ✅ **Zero Config** - Works out of the box with sensible defaults

## Installation

### Using npm link (Development)

```bash
# In the startup-system package directory
cd path/to/Orchestrator_Project/packages/startup-system
npm link

# In your project directory
cd path/to/your-project
npm link @diet103/startup-system
```

### Using file: protocol

```bash
# In your project directory
npm install file:../Orchestrator_Project/packages/startup-system
```

### Using git (Future)

```bash
npm install git+https://github.com/yourusername/startup-system.git
```

## Usage

### Basic Usage

```javascript
import { runStartupVerification } from '@diet103/startup-system';

// Run with defaults
const results = await runStartupVerification();

// Run with options
const results = await runStartupVerification({
  projectRoot: '/path/to/project',
  verbose: true,
  compact: false,
  silent: false
});

console.log('Startup verification:', results.success ? 'PASSED' : 'FAILED');
```

### In package.json

Add to your `scripts` section:

```json
{
  "scripts": {
    "postinstall": "node -e \"import('@diet103/startup-system').then(m => m.runStartupVerification())\"",
    "init": "node -e \"import('@diet103/startup-system').then(m => m.runStartupVerification({ verbose: true }))\"",
    "init:compact": "node -e \"import('@diet103/startup-system').then(m => m.runStartupVerification({ compact: true }))\""
  }
}
```

### Verify Primacy Rules Only

```javascript
import { verifyPrimacyRules } from '@diet103/startup-system';

const result = await verifyPrimacyRules({
  projectRoot: process.cwd(),
  verbose: true
});

console.log(`Rules: ${result.stats.ok}/${result.stats.total} OK`);

if (!result.success) {
  console.log('Issues:', result.stats.missing, 'missing,', result.stats.errors, 'errors');
}
```

### Check Project Structure

```javascript
import { verifyProjectStructure } from '@diet103/startup-system';

const structure = verifyProjectStructure('/path/to/project');

if (!structure.valid) {
  console.log('Missing required files:', structure.required.missing);
}

console.log('Optional features available:', structure.optional);
```

### Find Project Root

```javascript
import { findProjectRoot } from '@diet103/startup-system';

// Searches upward from cwd for project indicators
const projectRoot = findProjectRoot();
console.log('Project root:', projectRoot);

// Or start from specific directory
const root = findProjectRoot('/path/to/subdirectory');
```

## API Reference

### `runStartupVerification(options)`

Main function to run complete startup verification.

**Options:**
- `projectRoot` (string): Project root directory (default: `process.cwd()`)
- `verbose` (boolean): Show detailed output (default: `false`)
- `compact` (boolean): Use compact output format (default: `false`)
- `silent` (boolean): Suppress all output (default: `false`)

**Returns:** `Promise<Object>` with:
- `success` (boolean): Overall verification result
- `projectRoot` (string): Project root path
- `projectName` (string): Project directory name
- `primacyRules` (Object): Primacy rules verification result
- `fileLifecycle` (Object): File lifecycle status
- `taskmaster` (Object): TaskMaster configuration status
- `syncRecommended` (boolean): Whether global rule sync is recommended

### `verifyPrimacyRules(options)`

Verify all 9 primacy rules are present and intact.

**Options:**
- `projectRoot` (string): Project root directory
- `verbose` (boolean): Show detailed output

**Returns:** `Promise<Object>` with:
- `success` (boolean): All rules verified
- `results` (Array): Individual rule verification results
- `stats` (Object): Summary statistics (ok, warnings, missing, errors)

### `verifyProjectStructure(projectRoot)`

Check if project has required and optional diet103 structure.

**Returns:** `Object` with:
- `valid` (boolean): All required files present
- `required` (Object): Present and missing required files
- `optional` (Array): Present optional files

### `findProjectRoot(startDir)`

Find project root by searching upward for indicators.

**Returns:** `string` - Project root directory path

### Display Functions

- `displayWakeUpSummary(results, options)` - Show detailed startup summary
- `displayCompactSummary(results)` - Show minimal summary
- `displayErrorSummary(error, projectRoot)` - Show error information

## Output Examples

### Detailed Mode

```
═══════════════════════════════════════════════════════
   🚀 diet103 Project Startup
═══════════════════════════════════════════════════════

📁 Project: MyProject
   /Users/username/MyProject

✨ Active Systems:
   ✓ Primacy Rules (9/9 verified)
   ✓ File Lifecycle Management
   ✓ TaskMaster Configured
   ✓ diet103 Skills (3 active)

⚡ Quick Actions:
   • task-master list          Show all tasks
   • task-master next          Get next task
   • npm run validate-rules    Check rule versions
   • npm run sync-rules-global Sync rules everywhere

═══════════════════════════════════════════════════════
   ✅ Ready to code!
═══════════════════════════════════════════════════════
```

### Compact Mode

```
🚀 diet103: ✓ Rules • ✓ Lifecycle • ✓ Tasks • ✓ Skills (3)
```

## Integration Examples

### Node.js Project

```javascript
// lib/init/startup.js
import { runStartupVerification } from '@diet103/startup-system';

async function initialize() {
  const results = await runStartupVerification({
    projectRoot: process.cwd(),
    verbose: true
  });
  
  if (!results.success) {
    console.warn('Startup verification failed, but continuing...');
  }
  
  // Your additional initialization logic
  // ...
}

initialize();
```

### Python Project (using subprocess)

```python
# scripts/startup_verification.py
import subprocess
import json

def run_startup_verification():
    """Run Node.js-based startup verification"""
    result = subprocess.run(
        ['node', '-e', """
        import('@diet103/startup-system')
          .then(m => m.runStartupVerification({ silent: false }))
          .then(r => console.log(JSON.stringify(r)))
        """],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        results = json.loads(result.stdout)
        return results['success']
    
    return False

if __name__ == '__main__':
    success = run_startup_verification()
    exit(0 if success else 1)
```

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Building (if using TypeScript in future)

```bash
npm run build
```

## Requirements

- Node.js >= 14.0.0
- chalk ^5.0.0 (peer dependency)

## License

MIT

## Contributing

This package is part of the diet103 ecosystem. See the main Orchestrator_Project repository for contribution guidelines.

## Changelog

### 1.0.0 (2025-11-18)

- Initial release
- Primacy rules verification
- File lifecycle detection
- TaskMaster integration
- Flexible output modes (detailed, compact, silent)
- Project structure verification
- Project root finder utility

