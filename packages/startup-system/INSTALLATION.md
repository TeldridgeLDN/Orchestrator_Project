# Installation Guide - @diet103/startup-system

This guide shows how to install and configure the shared startup system package in your diet103 projects.

## Prerequisites

- Node.js >= 14.0.0
- npm or yarn
- chalk ^5.0.0 (will be installed as peer dependency)

## Installation Methods

### Method 1: npm link (Recommended for Development)

This is the best method when actively developing across multiple projects.

**Step 1: Link the package globally**

```bash
cd /Users/tomeldridge/Orchestrator_Project/packages/startup-system
npm link
```

**Step 2: Link in your project**

```bash
cd /Users/tomeldridge/your-project
npm link @diet103/startup-system
```

**Step 3: Install peer dependencies**

```bash
npm install chalk@^5.0.0
```

**Benefits:**
- Changes to the package are immediately available
- No need to reinstall after updates
- Easy to unlink when done

**To unlink:**
```bash
# In your project
npm unlink @diet103/startup-system

# In the package directory (optional, to unlink globally)
npm unlink
```

### Method 2: file: Protocol (Alternative)

Use this if you prefer a more permanent local installation.

```bash
cd /Users/tomeldridge/your-project
npm install file:../Orchestrator_Project/packages/startup-system
```

**Benefits:**
- Behaves like a normal npm package
- Installed in node_modules/
- Survives `npm install`

**Drawbacks:**
- Need to reinstall after package updates
- Takes up disk space (copy, not symlink)

### Method 3: git URL (Future - when published to repo)

```bash
npm install git+https://github.com/yourusername/Orchestrator_Project.git#packages/startup-system
```

### Method 4: npm Registry (Future - when published)

```bash
npm install @diet103/startup-system
```

## Configuration

### Basic Setup

**1. Update your `package.json`:**

```json
{
  "type": "module",
  "scripts": {
    "postinstall": "node lib/init/startup_hooks.js",
    "init": "node lib/init/startup_hooks.js",
    "init:compact": "node lib/init/startup_hooks.js --compact"
  },
  "dependencies": {
    "chalk": "^5.3.0"
  }
}
```

**2. Create `lib/init/startup_hooks.js`:**

```javascript
#!/usr/bin/env node

import { runStartupVerification } from '@diet103/startup-system';

async function main() {
  const args = process.argv.slice(2);
  const silent = args.includes('--silent') || args.includes('-s');
  const compact = args.includes('--compact') || args.includes('-c');
  
  const result = await runStartupVerification({
    projectRoot: process.cwd(),
    verbose: !silent && !compact,
    compact,
    silent
  });
  
  process.exit(result.success ? 0 : 1);
}

main().catch(error => {
  console.error('Startup error:', error);
  process.exit(1);
});
```

**3. Make it executable:**

```bash
chmod +x lib/init/startup_hooks.js
```

### Advanced Configuration

For projects that need custom hooks or additional initialization:

```javascript
#!/usr/bin/env node

import { 
  runStartupVerification,
  verifyPrimacyRules,
  displayCompactSummary 
} from '@diet103/startup-system';

async function customStartup() {
  const projectRoot = process.cwd();
  
  // Step 1: Verify primacy rules first
  const rulesResult = await verifyPrimacyRules({
    projectRoot,
    verbose: true
  });
  
  if (!rulesResult.success) {
    console.warn('⚠️  Primacy rules issues detected, but continuing...');
  }
  
  // Step 2: Your custom initialization
  // e.g., initialize file lifecycle, taskmaster, etc.
  
  // Step 3: Run full verification
  const results = await runStartupVerification({
    projectRoot,
    compact: true
  });
  
  // Step 4: Custom post-startup logic
  if (results.syncRecommended) {
    console.log('💡 Tip: Run "npm run sync-rules-global" to update global rules');
  }
  
  return results;
}

customStartup()
  .then(r => process.exit(r.success ? 0 : 1))
  .catch(err => {
    console.error('Startup failed:', err);
    process.exit(1);
  });
```

## Project-Specific Instructions

### Orchestrator_Project (Already Configured)

The package is already created within this project. No installation needed, but you can test with:

```bash
npm run init:compact
```

### portfolio-redesign

```bash
cd /Users/tomeldridge/portfolio-redesign

# Link the package
npm link @diet103/startup-system

# Install peer dependencies if needed
npm install chalk@^5.0.0

# Create startup hooks file (copy from Orchestrator or use package)
mkdir -p lib/init
# ... create startup_hooks.js as shown above

# Update package.json scripts
# ... add init, init:compact scripts

# Test
npm run init:compact
```

### Momentum_Squared

```bash
cd /Users/tomeldridge/Momentum_Squared

# Link the package
npm link @diet103/startup-system

# Follow same steps as portfolio-redesign
```

### Claude_Memory (Python Project)

For Python projects, use a subprocess approach:

**Create `scripts/startup_verification.py`:**

```python
#!/usr/bin/env python3

import subprocess
import sys
import json
import os

def run_node_startup():
    """Run Node.js-based startup verification"""
    # Ensure we're using the linked package
    result = subprocess.run(
        ['node', '-e', """
        import('@diet103/startup-system')
          .then(m => m.runStartupVerification({ 
            projectRoot: process.cwd(),
            compact: true 
          }))
          .then(r => {
            console.log(JSON.stringify(r));
            process.exit(r.success ? 0 : 1);
          })
        """],
        capture_output=True,
        text=True,
        cwd=os.getcwd()
    )
    
    if result.returncode == 0 and result.stdout:
        try:
            results = json.loads(result.stdout.split('\n')[-2])
            return results.get('success', False)
        except:
            pass
    
    return False

if __name__ == '__main__':
    success = run_node_startup()
    sys.exit(0 if success else 1)
```

**Make it executable:**

```bash
chmod +x scripts/startup_verification.py
```

## Verification

After installation, verify the package works:

```bash
# Test basic import
node -e "import('@diet103/startup-system').then(m => console.log('✅ Package imported successfully'))"

# Test full verification
npm run init:compact

# Test example
node node_modules/@diet103/startup-system/examples/basic-usage.js
```

## Troubleshooting

### "Cannot find package '@diet103/startup-system'"

**Solution 1: Check if linked**
```bash
ls -la node_modules/@diet103/
# Should show a symlink to the package
```

**Solution 2: Re-link**
```bash
npm unlink @diet103/startup-system
cd /Users/tomeldridge/Orchestrator_Project/packages/startup-system
npm link
cd -
npm link @diet103/startup-system
```

### "chalk is not installed"

```bash
npm install chalk@^5.0.0
```

### "Package does not provide an export named 'X'"

Check that you're using ES modules (`"type": "module"` in package.json) and importing correctly:

```javascript
// ✅ Correct
import { runStartupVerification } from '@diet103/startup-system';

// ❌ Wrong (CommonJS)
const { runStartupVerification } = require('@diet103/startup-system');
```

### Package updates not reflected

If using `npm link`, changes should be immediate. If not:

```bash
# In the package directory
cd /Users/tomeldridge/Orchestrator_Project/packages/startup-system

# Verify files are saved
ls -la src/

# No build step needed (pure JS, no TypeScript)
```

If using `file:` protocol:

```bash
# Reinstall to get updates
npm install file:../Orchestrator_Project/packages/startup-system
```

## Uninstallation

```bash
# If using npm link
npm unlink @diet103/startup-system

# If using file: or regular install
npm uninstall @diet103/startup-system
```

## Next Steps

1. ✅ Install package in your project
2. ✅ Create or update `lib/init/startup_hooks.js`
3. ✅ Update `package.json` scripts
4. ✅ Test with `npm run init:compact`
5. ✅ Commit changes to your project

For usage examples and API documentation, see [README.md](./README.md).

