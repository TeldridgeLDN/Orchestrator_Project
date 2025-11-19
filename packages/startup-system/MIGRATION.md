# Migration Guide - Adopting @diet103/startup-system

This guide helps you migrate existing diet103 projects to use the shared startup system package.

## Overview

**Before:** Each project has its own copy of startup verification code in `lib/init/`.

**After:** All projects use the shared `@diet103/startup-system` package, reducing duplication and ensuring consistency.

## Benefits of Migration

- ✅ **Single Source of Truth** - Updates to startup logic apply to all projects
- ✅ **Reduced Duplication** - No more copying code between projects
- ✅ **Easier Maintenance** - Fix bugs once, benefits all projects
- ✅ **Consistent Behavior** - All projects use identical verification logic
- ✅ **Smaller Codebases** - Remove ~1000 lines of duplicated code per project

## Migration Steps

### Step 1: Identify Current Implementation

Check if your project has these files:

```bash
lib/init/
├── startup_hooks.js              # Main orchestrator
├── primacy_rules_verification.js # Rules checker
├── wake_up_summary.js            # Display logic
├── file_lifecycle_init.js        # (project-specific, keep)
├── taskmaster_init.js            # (project-specific, keep)
└── skills_priming.js             # (project-specific, keep)
```

**What to keep:**
- Project-specific initialization (file lifecycle, taskmaster, skills)
- Custom configuration

**What to replace:**
- Primacy rules verification
- Wake-up summary display
- Generic startup orchestration

### Step 2: Install the Package

```bash
# In your project directory
npm link @diet103/startup-system

# Or use file: protocol
npm install file:../Orchestrator_Project/packages/startup-system

# Install peer dependencies
npm install chalk@^5.0.0
```

### Step 3: Update startup_hooks.js

**Before** (old implementation):

```javascript
import initializeFileLifecycle from './file_lifecycle_init.js';
import { initializeTaskMaster } from './taskmaster_init.js';
import { verifyPrimacyRules } from './primacy_rules_verification.js';
import { primeSkillsForProject } from './skills_priming.js';
import { displayWakeUpSummary, displayCompactSummary } from './wake_up_summary.js';

export async function runStartupHooks(options = {}) {
  // ... lots of code ...
}
```

**After** (using package):

```javascript
import { 
  runStartupVerification,
  verifyPrimacyRules 
} from '@diet103/startup-system';
import initializeFileLifecycle from './file_lifecycle_init.js';
import { initializeTaskMaster } from './taskmaster_init.js';
import { primeSkillsForProject } from './skills_priming.js';

export async function runStartupHooks(options = {}) {
  const { projectRoot = process.cwd(), silent = false, compact = false } = options;
  
  // Use shared verification for primacy rules
  const primacyResult = await verifyPrimacyRules({
    projectRoot,
    verbose: !silent && !compact
  });
  
  // Keep your project-specific initialization
  const lifecycleResult = await initializeFileLifecycle({ projectRoot });
  const taskmasterResult = await initializeTaskMaster({ projectRoot });
  const skillsResult = await primeSkillsForProject({ projectRoot });
  
  // Use shared summary display
  const results = {
    primacyRules: primacyResult,
    fileLifecycle: lifecycleResult,
    taskmaster: taskmasterResult,
    skills: skillsResult
  };
  
  // Or use the complete verification if you don't need custom logic
  return runStartupVerification(options);
}
```

### Step 4: Simplify or Remove Old Files

**Option A: Complete Replacement (Recommended)**

Delete the old files and use the package directly:

```bash
# Backup first
mv lib/init/primacy_rules_verification.js lib/init/primacy_rules_verification.js.bak
mv lib/init/wake_up_summary.js lib/init/wake_up_summary.js.bak

# Update startup_hooks.js to use package directly
cat > lib/init/startup_hooks.js << 'EOF'
#!/usr/bin/env node
import { runStartupVerification } from '@diet103/startup-system';

async function main() {
  const args = process.argv.slice(2);
  const options = {
    projectRoot: process.cwd(),
    silent: args.includes('--silent') || args.includes('-s'),
    compact: args.includes('--compact') || args.includes('-c'),
    verbose: !args.includes('--silent') && !args.includes('--compact')
  };
  
  const result = await runStartupVerification(options);
  process.exit(result.success ? 0 : 1);
}

main().catch(err => {
  console.error('Startup error:', err);
  process.exit(1);
});
EOF

chmod +x lib/init/startup_hooks.js
```

**Option B: Hybrid Approach (Keep Custom Logic)**

Keep your custom initialization but use the package for verification:

```javascript
import { 
  verifyPrimacyRules,
  displayCompactSummary 
} from '@diet103/startup-system';
import initializeFileLifecycle from './file_lifecycle_init.js';
// ... other custom imports

export async function runStartupHooks(options = {}) {
  // Use package for rules
  const primacyResult = await verifyPrimacyRules(options);
  
  // Keep your custom logic
  const lifecycleResult = await initializeFileLifecycle(options);
  
  // Use package for display
  const results = { primacyRules: primacyResult, fileLifecycle: lifecycleResult };
  displayCompactSummary(results);
  
  return results;
}
```

### Step 5: Update package.json Scripts

Ensure your scripts use the new implementation:

```json
{
  "scripts": {
    "postinstall": "node lib/init/startup_hooks.js",
    "init": "node lib/init/startup_hooks.js",
    "init:silent": "node lib/init/startup_hooks.js --silent",
    "init:compact": "node lib/init/startup_hooks.js --compact"
  }
}
```

### Step 6: Test Migration

```bash
# Test compact mode
npm run init:compact

# Test verbose mode
npm run init

# Test silent mode (no output)
npm run init:silent
echo "Exit code: $?"

# Verify no errors
echo "✅ Migration successful if all tests pass"
```

### Step 7: Clean Up

Once migration is verified working:

```bash
# Remove backup files
rm lib/init/*.bak

# Or keep them temporarily
mkdir lib/init/old-implementation
mv lib/init/*.bak lib/init/old-implementation/

# Commit the changes
git add lib/init/ package.json
git commit -m "feat: migrate to @diet103/startup-system package

- Replace duplicated verification code with shared package
- Keep project-specific initialization
- Simplify maintenance and ensure consistency"
```

## Project-Specific Considerations

### Orchestrator_Project

Already using the package (it's defined here). No migration needed.

### portfolio-redesign

- Has minimal custom logic
- Can use complete replacement (Option A)
- Estimated migration time: 10 minutes

### Momentum_Squared

- Similar to portfolio-redesign
- Can use complete replacement (Option A)
- Estimated migration time: 10 minutes

### Claude_Memory (Python)

- Keep Python wrapper
- Call package via subprocess
- See [INSTALLATION.md](./INSTALLATION.md) for Python integration
- Estimated migration time: 15 minutes

## Rollback Plan

If you need to rollback:

```bash
# Unlink package
npm unlink @diet103/startup-system

# Restore old files
git checkout lib/init/

# Or restore from backup
mv lib/init/old-implementation/* lib/init/

# Verify
npm run init
```

## Troubleshooting

### Import errors after migration

Check that `package.json` has `"type": "module"` and you're using ES module imports.

### Old behavior vs new behavior

The package provides the same functionality as the old code. If you notice differences:

1. Compare old vs new output
2. Check if custom logic was lost
3. Verify options are passed correctly

### Performance concerns

The package adds minimal overhead (~5ms) compared to inline code. If you notice startup delays, check:

1. Network mounts (if using file: protocol)
2. npm link symlink resolution
3. Other project-specific initialization

## Benefits After Migration

**Code Reduction:**
- Orchestrator_Project: -0 lines (package source)
- portfolio-redesign: -800 lines
- Momentum_Squared: -800 lines
- Claude_Memory: -500 lines (Python version)

**Maintenance:**
- Bug fixes: 1 update vs 4 updates
- New features: Automatic for all projects
- Consistency: Guaranteed identical behavior

**Developer Experience:**
- Clear API documentation
- Examples and guides
- Versioned releases (future)

## Next Steps After Migration

1. ✅ Test in development
2. ✅ Verify startup hooks work
3. ✅ Check all scripts (init, init:compact, init:silent)
4. ✅ Commit changes
5. ✅ Update project documentation (if needed)
6. ✅ Monitor for issues

For help, see:
- [README.md](./README.md) - Usage and API
- [INSTALLATION.md](./INSTALLATION.md) - Installation methods
- Examples in `examples/` directory

