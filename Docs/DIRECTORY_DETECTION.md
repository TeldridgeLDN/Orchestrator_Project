# Project-Aware Directory Detection

## Overview

The Directory Detection Hook provides **zero-effort project switching** by automatically detecting when you change directories to a registered project. This eliminates the need to manually run switch commands, creating a seamless development experience.

## How It Works

The system monitors directory changes through two mechanisms:

### 1. Process Working Directory Detection

Monitors `process.cwd()` and automatically switches context when:
- You navigate to a project directory in your terminal
- You enter a subdirectory within a project
- Your working directory changes for any reason

### 2. Prompt Command Detection

Analyzes user prompts for directory change commands:
```bash
# These patterns trigger auto-switching:
cd /path/to/project
cd ./relative/path
cd ../parent/project
```

## Architecture

### Hook Execution Flow

```
User Action (cd or prompt)
    ↓
directoryDetectionHook
    ↓
1. Check if directory changed
2. Check if auto-switch enabled
3. Lookup project for directory
4. Check if already in project
5. Switch project context
    ↓
Continue with normal execution
```

### Components

1. **directoryDetectionHook**
   - Priority: 20
   - Runs on: `UserPromptSubmit`
   - Function: Detects `process.cwd()` changes

2. **promptDirectoryDetectionHook**
   - Priority: 10
   - Runs on: `UserPromptSubmit`
   - Function: Parses prompts for `cd` commands

3. **Project Path Cache**
   - Maps project paths to project names
   - TTL: 60 seconds
   - Automatically rebuilds when expired

## Configuration

### Enable/Disable Auto-Switching

In your global `~/.claude/config.json`:

```json
{
  "settings": {
    "auto_switch_on_directory_change": true,
    "validate_on_switch": true
  }
}
```

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `auto_switch_on_directory_change` | `false` | Enable automatic project switching |
| `validate_on_switch` | `true` | Validate project infrastructure on switch |

## Usage

### Basic Usage

1. **Enable auto-switching**:
   ```bash
   # Edit ~/.claude/config.json
   {
     "settings": {
       "auto_switch_on_directory_change": true
     }
   }
   ```

2. **Navigate to a project**:
   ```bash
   cd ~/projects/my-blog
   # 🔄 Auto-detected project switch: my-blog
   #    Directory: /Users/you/projects/my-blog
   ```

3. **Continue working**:
   ```bash
   # Context is automatically switched
   # Skills are auto-activated
   # Ready to work!
   ```

### Example Workflow

```bash
# Start in project A
~/projects/ecommerce $ claude "add new payment method"
# ✓ Working in ecommerce project context

# Switch to project B
~/projects/ecommerce $ cd ~/projects/blog
# 🔄 Auto-detected project switch: blog
#    Directory: /Users/you/projects/blog

~/projects/blog $ claude "write new article"
# ✓ Working in blog project context

# Even works with relative paths
~/projects/blog $ cd ../ecommerce/api
# 🔄 Auto-detected project switch: ecommerce
#    Directory: /Users/you/projects/ecommerce/api
```

### Command Detection

The system recognizes `cd` commands in your prompts:

```bash
# This prompt will trigger auto-switching:
claude "Let me cd ~/projects/blog and check the posts"
# 🔄 Auto-detected project switch from prompt: blog
#    Target directory: /Users/you/projects/blog
```

## Performance

### Optimization Features

1. **Project Path Cache**
   - In-memory map of project paths
   - 60-second TTL
   - Fast O(1) lookup for exact matches
   - O(n) lookup for subdirectories

2. **Change Detection**
   - Tracks last known directory
   - Skips redundant checks
   - Only executes on actual changes

3. **Early Returns**
   - Immediate skip if directory unchanged
   - Immediate skip if not in registered project
   - Immediate skip if already in correct context

### Benchmarks

| Operation | Time | Notes |
|-----------|------|-------|
| Cache lookup | <1ms | Exact match |
| Subdirectory check | <5ms | Requires path traversal |
| Full switch | <150ms | Includes validation |

## Subdirectory Support

The system detects projects even when you're in a subdirectory:

```bash
# All of these work:
cd ~/projects/blog                    # Root
cd ~/projects/blog/src                # Subdirectory
cd ~/projects/blog/src/posts          # Nested subdirectory
cd ~/projects/blog/node_modules       # Even deep nesting
```

## Integration with Other Features

### Works With

- ✅ **Project Validation**: Respects `validate_on_switch` setting
- ✅ **Context Caching**: Uses fast resume for recent projects
- ✅ **Skill Auto-Activation**: Skills activate on context switch
- ✅ **Natural Language Commands**: Works alongside manual switching

### Conflict Resolution

The hook respects existing context:
- If already in target project → Skip switch
- If validation fails → Block switch (unless `--no-validate`)
- If project not registered → Skip silently

## Error Handling

The hook is designed to **never block execution**:

```javascript
try {
  // Attempt auto-switch
  await switchProject(...);
} catch (error) {
  // Log error but continue
  console.error('Directory detection hook error:', error.message);
  return next(); // Always call next()
}
```

### Error Scenarios

| Scenario | Behavior |
|----------|----------|
| Project not found | Skip silently, continue execution |
| Validation fails | Show validation error, block switch |
| Config read error | Log error, skip auto-switch |
| Switch command fails | Log error, continue execution |
| Cache build error | Log error, rebuild on next attempt |

## Testing

### Unit Tests

Run the test suite:

```bash
npm test lib/hooks/__tests__/directoryDetection.test.js
```

Tests cover:
- ✅ Basic directory change detection
- ✅ Prompt `cd` command detection
- ✅ Subdirectory handling
- ✅ Auto-switch toggle (enabled/disabled)
- ✅ Cache management
- ✅ Error handling
- ✅ Relative path resolution

### Integration Tests

Test with real projects:

```bash
# 1. Create test projects
mkdir -p ~/test-projects/{proj1,proj2}
cd ~/test-projects/proj1
claude init
cd ~/test-projects/proj2
claude init

# 2. Register projects
claude register ~/test-projects/proj1
claude register ~/test-projects/proj2

# 3. Enable auto-switching
# Edit ~/.claude/config.json:
# "auto_switch_on_directory_change": true

# 4. Test switching
cd ~/test-projects/proj1
# Should auto-switch to proj1

cd ~/test-projects/proj2
# Should auto-switch to proj2

cd ~/test-projects/proj1/src
# Should still detect proj1
```

### Performance Testing

Measure overhead:

```bash
# Create benchmark script
time for i in {1..100}; do
  claude "echo test" > /dev/null
done

# With auto-switching enabled vs disabled
# Expected overhead: <50ms average
```

## Troubleshooting

### Auto-switching not working

1. **Check if enabled**:
   ```bash
   cat ~/.claude/config.json | grep auto_switch_on_directory_change
   # Should be: "auto_switch_on_directory_change": true
   ```

2. **Check if project is registered**:
   ```bash
   claude list-projects
   # Your project should appear in the list
   ```

3. **Check project path matches**:
   ```bash
   pwd
   # Compare with registered project path
   # Must match exactly or be a subdirectory
   ```

### Frequent unnecessary switches

1. **Check cache TTL**:
   - Default: 60 seconds
   - Increase if projects change rarely
   - Decrease if projects update frequently

2. **Review directory structure**:
   - Nested projects can cause conflicts
   - Use explicit paths in config

### Performance issues

1. **Clear cache manually**:
   ```javascript
   import { clearProjectCache } from './lib/hooks/directoryDetection.js';
   clearProjectCache();
   ```

2. **Reduce registered projects**:
   - Only register actively used projects
   - Unregister archived projects

3. **Disable validation on switch**:
   ```json
   {
     "settings": {
       "validate_on_switch": false
     }
   }
   ```

## API Reference

### Functions

#### `directoryDetectionHook(context, next)`

Main hook for detecting directory changes.

**Parameters:**
- `context` (Object): Hook context
- `next` (Function): Next middleware function

**Returns:** `Promise<void>`

---

#### `promptDirectoryDetectionHook(context, next)`

Hook for detecting `cd` commands in prompts.

**Parameters:**
- `context` (Object): Hook context with `prompt` property
- `next` (Function): Next middleware function

**Returns:** `Promise<void>`

---

#### `clearProjectCache()`

Manually clear the project path cache.

**Returns:** `void`

**Example:**
```javascript
import { clearProjectCache } from './lib/hooks/directoryDetection.js';
clearProjectCache();
```

---

#### `resetDirectoryTracking()`

Reset the directory tracking state. Useful for testing.

**Returns:** `void`

**Example:**
```javascript
import { resetDirectoryTracking } from './lib/hooks/directoryDetection.js';
resetDirectoryTracking();
```

## Security Considerations

### Path Validation

The system validates all paths before switching:
- ✅ Resolves relative paths
- ✅ Checks if directory exists
- ✅ Verifies project is registered
- ✅ Validates project infrastructure (if enabled)

### Permission Checks

- Reads `~/.claude/config.json` (user-owned)
- Reads `~/.claude/current-project.json` (user-owned)
- No elevated privileges required
- No external network calls

### Input Sanitization

The `cd` command parser:
- Uses regex for pattern matching
- Resolves paths through `path.resolve()`
- Checks existence with `fs.existsSync()`
- Does not execute shell commands

## Future Enhancements

### Planned Features

1. **Workspace Detection**
   - Detect VS Code workspaces
   - Multi-root workspace support
   - Editor-specific context

2. **Git Branch Awareness**
   - Switch based on git branch
   - Branch-specific project variants
   - Automatic branch detection

3. **Smart Caching**
   - Learning-based cache TTL
   - Predict likely switches
   - Preload project context

4. **Multi-Project Detection**
   - Detect monorepo subdirectories
   - Handle nested projects gracefully
   - Project hierarchy support

5. **Performance Metrics**
   - Track switch frequency
   - Measure overhead
   - Optimize hot paths

## References

- [Orchestrator PRD](./Orchestrator_PRD.md) - Section 3: Auto-Activation System
- [diet103 Implementation](./DIET103_IMPLEMENTATION.md) - Hooks Architecture
- [Switch Command](../lib/commands/switch.js) - Project switching logic
- [Config Management](../lib/utils/config.js) - Configuration utilities

## Support

For issues or questions:
1. Check this documentation
2. Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. Test with `npm test lib/hooks/__tests__/directoryDetection.test.js`
4. Check hook logs in `~/.claude/debug/`

---

*Last Updated: 2024-11-11*  
*Version: 1.0.0*

