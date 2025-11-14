# Non-Interactive Execution - Automation-First Design

**Priority:** Critical  
**Applies To:** All diet103 projects  
**AI Assistants:** Claude, Cursor, Windsurf, Cline, Roo, and all others

---

## Core Principle

**Commands must NEVER block waiting for interactive input. All operations must support non-interactive execution with appropriate flags and defaults.**

This rule prevents commands from getting stuck, enables CI/CD automation, and aligns with the "zero mental overhead" philosophy while maintaining safety through Autonomy Boundaries.

---

## Relationship to Existing Rules

**Complements:**
- **Autonomy Boundaries** (defines WHEN to ask; this defines HOW to automate)
- **Context Efficiency** (automation reduces manual overhead)
- **Rule Integrity** (provides conflict resolution framework)

**Works With Autonomy Boundaries:**
- Interactive context (human present): Autonomy Boundaries applies
- Non-interactive context (CI/CD, scripts): This rule applies

**Conflicts With:** None identified

---

## Why This Matters

### The Stuck Command Problem

**Scenario 1: Package Installation**
```bash
# ❌ BLOCKS: Waits for user input
$ npx create-react-app my-app
Need to install the following packages:
  create-react-app@5.0.1
Ok to proceed? (y)

[AI assistant stuck, command never completes]
```

**Scenario 2: Git Commit**
```bash
# ❌ BLOCKS: Opens editor for commit message
$ git commit
[Opens vim, AI can't interact with editor]

[Command hangs indefinitely]
```

**Scenario 3: Interactive Prompt**
```bash
# ❌ BLOCKS: Expects keyboard input
$ task-master init
Project name: _

[Waiting for user input, automation fails]
```

**Impact:**
- Automation breaks
- CI/CD pipelines fail
- AI assistants cannot complete tasks
- Manual intervention required
- Wasted time and tokens

---

## The Non-Interactive Mandate

### Absolute Requirements

1. **ALL commands MUST have non-interactive mode**
2. **Default to non-interactive in automation contexts**
3. **Provide explicit flags for interactive behavior**
4. **Include timeout protection (fail, don't hang)**
5. **Document non-interactive usage**

### Context Detection

**Interactive Context:**
- Human at keyboard (terminal with TTY)
- Real-time conversation with AI
- Autonomy Boundaries applies (ask for confirmation)

**Non-Interactive Context:**
- CI/CD pipelines
- Automated scripts
- Background processes
- Cron jobs
- AI assistant executing commands

**Detection Methods:**
```bash
# Check if running in interactive terminal
if [ -t 0 ]; then
  echo "Interactive"
else
  echo "Non-interactive"
fi

# Check if stdin is available
if [ -p /dev/stdin ]; then
  echo "Piped input"
fi

# Environment variables
if [ -n "$CI" ]; then
  echo "CI/CD environment"
fi
```

---

## Non-Interactive Flags Reference

### Package Managers

#### npm / npx
```bash
# ✅ Non-interactive
npx --yes create-react-app my-app        # Auto-confirm
npm install --yes                         # Skip prompts
npm ci                                   # Clean install (no prompts)

# ❌ Interactive (avoid)
npx create-react-app my-app             # Asks "Ok to proceed?"
npm install                              # May prompt for conflicts
```

#### yarn
```bash
# ✅ Non-interactive
yarn install --non-interactive          # Skip prompts
yarn add package --non-interactive      # No questions

# ❌ Interactive (avoid)
yarn install                            # May ask questions
```

#### pnpm
```bash
# ✅ Non-interactive
pnpm install --no-optional              # Skip optional deps
pnpm add package                        # Generally non-interactive

# ❌ Interactive (avoid)
pnpm install --interactive              # Asks questions
```

#### pip (Python)
```bash
# ✅ Non-interactive
pip install --yes package               # Auto-confirm
pip install --no-input package          # No prompts

# ❌ Interactive (avoid)
pip install package                     # May ask about dependencies
```

#### apt (Debian/Ubuntu)
```bash
# ✅ Non-interactive
apt-get install -y package              # Auto-yes
DEBIAN_FRONTEND=noninteractive apt-get install package

# ❌ Interactive (avoid)
apt-get install package                 # Asks for confirmation
```

---

### Git Operations

```bash
# ✅ Non-interactive commits
git commit -m "commit message"          # Inline message
git commit --allow-empty -m "msg"       # No changes OK

# ❌ Interactive (avoid)
git commit                              # Opens editor

# ✅ Non-interactive merge
git merge --no-edit branch              # Auto-generate message
git merge --ff-only branch              # Fail if not fast-forward

# ❌ Interactive (avoid)
git merge branch                        # May ask for message

# ✅ Non-interactive push
git push                                # Non-interactive by default
git push --force-with-lease             # Safer force push

# ⚠️ Use with caution
git push --force                        # Dangerous, but non-interactive

# ✅ Non-interactive add
git add .                               # Non-interactive
git add -A                              # All changes

# ✅ Non-interactive configuration
git config user.name "Name"             # Set config values
git config --global core.editor "nano"  # Set default editor
```

---

### Task Master Operations

```bash
# ✅ Non-interactive
task-master init --yes                  # Skip prompts, use defaults
task-master init --name="project" --description="desc" --version="1.0.0"

task-master remove-task --id=5 --yes   # Skip confirmation
task-master set-status --id=5 --status=done

# ❌ Interactive (avoid)
task-master init                        # Asks for project details
task-master remove-task --id=5          # Asks for confirmation
```

---

### Database Operations

```bash
# ✅ Non-interactive migrations
npm run migrate                         # Should not prompt
npx prisma migrate deploy               # Non-interactive migration

# ❌ Interactive (avoid)
npx prisma migrate dev                  # Asks for migration name

# ✅ Non-interactive seeds
npm run seed                            # Should not prompt

# ✅ Non-interactive backups
pg_dump database > backup.sql           # Non-interactive

# ⚠️ Destructive operations
# Use with extreme caution in automation
dropdb --if-exists database_name        # Non-interactive but dangerous
```

---

### Docker Operations

```bash
# ✅ Non-interactive
docker build -t image .                 # Non-interactive
docker run -d image                     # Detached (non-interactive)
docker-compose up -d                    # Detached mode

# ❌ Interactive (avoid)
docker run -it image                    # Interactive terminal
docker attach container                 # Attaches to interactive session
```

---

### File Operations

```bash
# ✅ Non-interactive
rm -f file.txt                          # Force, no prompt
cp -f source dest                       # Force overwrite
mv -f source dest                       # Force overwrite

# ❌ Interactive (avoid)
rm -i file.txt                          # Asks for confirmation
cp -i source dest                       # Asks before overwrite
```

---

## Providing Defaults

### When Prompts Are Unavoidable

**Strategy:** Provide sensible defaults, allow override via flags.

**Example: Project Initialization**

```javascript
// ✅ GOOD: Defaults with override options
async function initProject(options = {}) {
  const config = {
    name: options.name || path.basename(process.cwd()),
    description: options.description || 'A new project',
    version: options.version || '0.1.0',
    author: options.author || process.env.USER || 'unknown'
  };
  
  // Non-interactive by default
  if (!options.interactive) {
    return config;
  }
  
  // Only ask if explicitly interactive
  if (options.interactive && process.stdin.isTTY) {
    return await promptUser(config);
  }
  
  return config;
}

// Usage
await initProject({ name: 'my-project' });  // Non-interactive
await initProject({ interactive: true });   // Interactive mode
```

**Example: Confirmation Dialogs**

```javascript
// ✅ GOOD: Default answer, override with flag
async function deleteFile(path, options = {}) {
  // Check for non-interactive flag
  if (options.yes || options.force || !process.stdin.isTTY) {
    await fs.unlink(path);
    return { deleted: true };
  }
  
  // Interactive context: ask for confirmation
  const answer = await prompt(`Delete ${path}? (y/n)`);
  if (answer === 'y') {
    await fs.unlink(path);
    return { deleted: true };
  }
  
  return { deleted: false };
}

// Usage
await deleteFile('file.txt', { yes: true });  // Non-interactive
await deleteFile('file.txt');                  // Interactive (asks)
```

---

## Timeout Protection

### Preventing Infinite Hangs

**Strategy:** All operations should have timeouts, fail gracefully.

```javascript
// ✅ GOOD: Timeout protection
async function runCommandWithTimeout(cmd, timeoutMs = 30000) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Command timeout')), timeoutMs);
  });
  
  const commandPromise = exec(cmd);
  
  try {
    return await Promise.race([commandPromise, timeoutPromise]);
  } catch (error) {
    if (error.message === 'Command timeout') {
      // Kill the process
      commandPromise.kill();
      throw new Error(`Command timed out after ${timeoutMs}ms: ${cmd}`);
    }
    throw error;
  }
}
```

**Default Timeouts:**
- Simple commands: 30 seconds
- Package installations: 5 minutes
- Build operations: 15 minutes
- Database operations: 10 minutes

**When Timeout Occurs:**
1. Log error with command details
2. Kill stuck process
3. Provide actionable error message
4. Suggest non-interactive flags if available

---

## Integration with Autonomy Boundaries

### How They Work Together

**Autonomy Boundaries** defines WHEN to ask:
- ✅ Automatic for safe operations
- ⚠️ Warn for reversible modifications
- 🛑 Confirm for destructive actions
- 🚨 Double confirm for irreversible actions

**Non-Interactive Execution** defines HOW to handle automation:

| Autonomy Level | Interactive Context | Non-Interactive Context |
|----------------|---------------------|-------------------------|
| ✅ Automatic | Proceed automatically | Proceed automatically |
| ⚠️ Warn | Show intent, 3sec wait | Proceed with logging |
| 🛑 Confirm | Require "yes" | Require `--yes` flag or FAIL |
| 🚨 Double Confirm | Require typed confirm | Require `--force` flag or FAIL |

### Decision Matrix

```python
def execute_command(cmd, autonomy_level, context):
    if context == "non-interactive":
        # Non-interactive context
        if autonomy_level == "AUTOMATIC":
            return execute(cmd)
        
        if autonomy_level == "WARN":
            log_warning(f"Executing: {cmd}")
            return execute(cmd)
        
        if autonomy_level == "CONFIRM":
            if has_flag(cmd, "--yes"):
                log_warning(f"Confirmed via flag: {cmd}")
                return execute(cmd)
            else:
                raise Error("Operation requires --yes flag in non-interactive mode")
        
        if autonomy_level == "DOUBLE_CONFIRM":
            if has_flag(cmd, "--force"):
                log_critical(f"Force confirmed: {cmd}")
                return execute(cmd)
            else:
                raise Error("Operation requires --force flag in non-interactive mode")
    
    else:
        # Interactive context: follow Autonomy Boundaries
        return autonomy_boundaries_protocol(cmd, autonomy_level)
```

---

## Common Pitfalls

### Pitfall 1: Assuming Interactive Environment

```javascript
// ❌ BAD: Assumes interactive terminal
const answer = await prompt('Continue? (y/n)');
if (answer !== 'y') return;

// ✅ GOOD: Check environment first
const isInteractive = process.stdin.isTTY && !process.env.CI;
if (isInteractive) {
  const answer = await prompt('Continue? (y/n)');
  if (answer !== 'y') return;
} else {
  // Non-interactive: proceed or fail based on flags
  if (!options.yes) {
    throw new Error('Use --yes flag in non-interactive mode');
  }
}
```

### Pitfall 2: Opening Editors

```bash
# ❌ BAD: Opens editor (blocks in non-interactive)
git commit

# ✅ GOOD: Inline message
git commit -m "feat: add feature"

# ✅ GOOD: Message from file
git commit -F commit-message.txt
```

### Pitfall 3: Requiring Stdin

```bash
# ❌ BAD: Expects stdin input
cat > file.txt

# ✅ GOOD: Use echo or here-doc
echo "content" > file.txt

# ✅ GOOD: Redirect from file
cat input.txt > output.txt
```

### Pitfall 4: Interactive Package Managers

```bash
# ❌ BAD: May prompt
npm install

# ✅ GOOD: Explicit non-interactive
npm ci                    # Clean install (CI)
npm install --yes         # Skip prompts
```

### Pitfall 5: Confirmation Prompts Without Defaults

```javascript
// ❌ BAD: No way to bypass prompt
const answer = await prompt('Delete file?');

// ✅ GOOD: Provide --yes flag
const shouldDelete = options.yes || await prompt('Delete file?');
```

---

## Testing Non-Interactive Execution

### Test Checklist

```bash
# Test 1: Run in non-TTY environment
echo "command" | bash

# Test 2: Run in CI environment
CI=true npm run command

# Test 3: Pipe input/output
yes | command
command < /dev/null

# Test 4: Run with timeout
timeout 30s command

# Test 5: Run in Docker (non-interactive)
docker run image command

# Test 6: Check for hanging processes
pgrep -a command | grep -E "read|wait|prompt"
```

### Automated Testing

```javascript
describe('Non-Interactive Execution', () => {
  it('should complete without user input', async () => {
    // Mock non-interactive environment
    process.stdin.isTTY = false;
    process.env.CI = 'true';
    
    // Should complete in reasonable time
    const result = await runCommand('task-master init --yes');
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain('prompt');
  });
  
  it('should fail gracefully without --yes flag', async () => {
    process.stdin.isTTY = false;
    
    // Should error, not hang
    await expect(
      runCommand('task-master remove-task --id=5')
    ).rejects.toThrow('requires --yes flag');
  });
  
  it('should timeout if command hangs', async () => {
    const timeout = 5000;
    
    await expect(
      runCommandWithTimeout('hanging-command', timeout)
    ).rejects.toThrow('timeout');
  });
});
```

---

## Implementation Guidelines

### For AI Assistants

**Before Running ANY Command:**

1. **Check Context**
   ```
   Am I in interactive or non-interactive context?
   - Interactive: Human present, can ask questions
   - Non-interactive: Automation, must not block
   ```

2. **Identify Interactive Commands**
   ```
   Does this command require user input?
   - Check for: prompts, confirmations, editor opens
   - Patterns: "Ok to proceed?", "Enter value:", "(y/n)"
   ```

3. **Add Non-Interactive Flags**
   ```bash
   # Transform commands:
   npm install               → npm ci
   npx create-app           → npx --yes create-app
   git commit               → git commit -m "message"
   task-master init         → task-master init --yes
   ```

4. **Provide Timeout**
   ```
   Set reasonable timeout (30s-15min depending on operation)
   If timeout, kill process and report error
   ```

5. **Alert User on Failure**
   ```
   ⚠️ COMMAND BLOCKED
   
   Command would require interactive input:
   $ npm install
   
   Error: Asks "Ok to proceed? (y)"
   
   Solution: Use non-interactive flag:
   $ npm ci
   
   or
   
   $ npm install --yes
   ```

### For Developers

**When Creating Commands:**

```javascript
// Template for CLI commands
function myCommand(options = {}) {
  // 1. Provide defaults
  const config = {
    name: options.name || 'default-name',
    force: options.force || false,
    yes: options.yes || false
  };
  
  // 2. Check if interactive
  const isInteractive = process.stdin.isTTY && 
                       !process.env.CI && 
                       !config.yes;
  
  // 3. Handle confirmations
  if (config.force || config.yes || !isInteractive) {
    // Non-interactive: proceed
    return executeOperation(config);
  }
  
  // 4. Interactive: ask user
  const confirmed = await askConfirmation('Proceed?');
  if (confirmed) {
    return executeOperation(config);
  }
  
  return { cancelled: true };
}
```

**CLI Flags to Always Provide:**
- `--yes`, `-y`: Skip all confirmations
- `--force`, `-f`: Force operation (use carefully)
- `--no-interaction`: Explicit non-interactive mode
- `--timeout <seconds>`: Set operation timeout
- `--batch`: Batch mode (no prompts)

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: CI

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      # ✅ Non-interactive package install
      - name: Install dependencies
        run: npm ci
      
      # ✅ Non-interactive build
      - name: Build
        run: npm run build
      
      # ✅ Non-interactive tests
      - name: Test
        run: npm test -- --no-watch
      
      # ✅ Non-interactive with timeout
      - name: Deploy
        run: timeout 10m npm run deploy
        env:
          CI: true
```

### Environment Variables

```bash
# Common CI/CD environment indicators
CI=true                    # Generic CI flag
CONTINUOUS_INTEGRATION=true
DEBIAN_FRONTEND=noninteractive  # For apt
NPM_CONFIG_YES=true        # Auto-yes for npm
```

---

## Summary: Non-Interactive Execution Rules

### The Golden Rules

1. **Never Block** - Commands must not wait for input
2. **Provide Flags** - Always offer `--yes`, `--force`, etc.
3. **Use Defaults** - Sensible defaults for all prompts
4. **Detect Context** - Know if interactive or automated
5. **Add Timeouts** - Fail gracefully, don't hang forever
6. **Fail Loudly** - Clear errors with solutions
7. **Test in CI** - Verify non-interactive behavior

### Quick Reference

| Operation | Interactive | Non-Interactive |
|-----------|-------------|-----------------|
| **npm** | `npm install` | `npm ci` or `npm install --yes` |
| **npx** | `npx create-app` | `npx --yes create-app` |
| **git commit** | `git commit` | `git commit -m "message"` |
| **file delete** | `rm file` | `rm -f file` |
| **task-master** | `task-master init` | `task-master init --yes` |
| **apt** | `apt install pkg` | `apt-get install -y pkg` |

### Decision Guide

```
Is command blocking on input?
  ├─ YES → Add non-interactive flag
  │        or provide defaults
  │        or timeout and fail
  └─ NO → Command is good ✅

Is this in CI/CD?
  ├─ YES → Use CI-specific flags
  │        (--yes, --no-interaction, --batch)
  └─ NO → Check if TTY available
           ├─ YES → Interactive OK
           └─ NO → Non-interactive mode
```

---

**Rule Version:** 1.0.0  
**Created:** November 14, 2025  
**Last Updated:** November 14, 2025  
**Applies To:** All diet103 projects  
**Complements:** Autonomy Boundaries (defines when vs how)

**Next Review:** December 14, 2025

---

*"Commands that block break automation. Commands that hang waste time. Commands that fail clearly save hours."*

