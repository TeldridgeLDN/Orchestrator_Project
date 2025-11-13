# Test Selector Agent - Quick Start

**⚡ Save 60-80% of test execution time**

## One-Line Commands

```bash
# Smart test selection (recommended)
python .claude/agents/test-selector/select-tests.py

# Conservative (before commits)
python .claude/agents/test-selector/select-tests.py --mode conservative

# Aggressive (fast feedback)
python .claude/agents/test-selector/select-tests.py --mode aggressive

# Preview without running
python .claude/agents/test-selector/select-tests.py --dry-run

# Test specific files
python .claude/agents/test-selector/select-tests.py --files src/utils.js
```

## Add to package.json

```json
{
  "scripts": {
    "test:smart": "python .claude/agents/test-selector/select-tests.py",
    "test:quick": "python .claude/agents/test-selector/select-tests.py --mode aggressive",
    "test:safe": "python .claude/agents/test-selector/select-tests.py --mode conservative"
  }
}
```

Then use:
```bash
npm run test:smart   # Balanced selection
npm run test:quick   # Fast feedback
npm run test:safe    # Before commits
```

## Natural Language (Claude Code)

Just say:
- "Run tests for my changes"
- "Smart test selection"
- "What tests should I run?"

## Modes Explained

| Mode | Tests Run | Time Saved | When to Use |
|------|-----------|------------|-------------|
| **aggressive** | High confidence only | 70-80% | Fast dev feedback |
| **smart** | Medium+ confidence | 60-70% | Normal workflow |
| **conservative** | Low+ confidence | 40-50% | Before commits |
| **full** | All tests | 0% | CI/CD, releases |

## Example Output

```
📋 Change Detection
  Files Changed: 3

🎯 Test Selection
  Tests Selected: 8 of 42 (19%)

⚙️  Execution
  Running with vitest...

🎉 Results
  Passed: 7
  Failed: 0
  Time: 8.2s

💰 Savings
  Time Saved: 33.8s (80%)
```

## Configuration

Edit `resources/test-mapping.json` to customize mappings:

```json
{
  "patterns": [
    {
      "source": "src/**/*.js",
      "tests": ["tests/**/*.test.js"],
      "confidence": "high"
    }
  ]
}
```

## Troubleshooting

**No changes detected?**
- Check `git status`
- Try `--strategy timestamp`
- Use `--files` for explicit list

**No tests selected?**
- Update `test-mapping.json`
- Try `--mode conservative`

**Need help?**
- See [README.md](./README.md) for full guide
- See [agent.md](./agent.md) for detailed docs

---

**Status**: Production Ready ✅  
**Version**: 1.0.0  
**Sprint**: 2 (Complete)

