# diet103 Validation - Quick Reference Card

## 🚀 Common Commands

```bash
# Validate current project
node bin/diet103.js validate .

# Validate with details
node bin/diet103.js validate . --verbose

# Auto-repair missing components
node bin/diet103.js validate . --repair

# Require 90% score
node bin/diet103.js validate . --threshold 90

# Validate external project
node bin/diet103.js validate /path/to/project --repair --verbose
```

## 📊 Understanding the Score

- **0-69%**: ❌ Failed - Missing critical components
- **70-89%**: ⚠️ Passed - Missing some important components
- **90-99%**: ✅ Good - Minor issues only
- **100%**: 🎉 Perfect - Fully compliant

## 🔍 What Gets Checked

### Critical (70% weight)
- `.claude/` directory
- `Claude.md`
- `metadata.json`
- `skill-rules.json`
- `hooks/` directory
- `hooks/UserPromptSubmit.js`
- `hooks/PostToolUse.js`

### Important (30% weight)
- `skills/` directory
- `commands/` directory
- `agents/` directory
- `resources/` directory
- `README.md`

## 🔧 What Gets Fixed (--repair)

✅ Creates missing files  
✅ Creates missing directories  
✅ Sets proper permissions (hooks executable)  
❌ Never overwrites existing files  
❌ Never modifies existing content  

## 📝 Custom Variables

```javascript
// In your script:
await repairDiet103Infrastructure(projectPath, {
  variables: {
    PROJECT_NAME: 'My Project',
    PROJECT_DESCRIPTION: 'Custom description',
    ORGANIZATION: 'My Company',
    TEAM_NAME: 'Engineering Team'
  }
});
```

## 🤖 GitHub Actions

**File:** `.github/workflows/diet103-validation.yml`

**Triggers:**
- Push to main/master/develop
- Pull requests
- Weekly (Monday 9 AM UTC)
- Manual dispatch

## 📚 Documentation

- **Full Guide:** `Docs/diet103_Template_Customization.md`
- **Completion Report:** `Docs/DIET103_COMPLIANCE_COMPLETE.md`
- **Example:** `examples/custom-templates/corporate-example.js`

## 🆘 Troubleshooting

**"Score below threshold"**
→ Run with `--repair` flag

**"Consistency issues"**
→ Check metadata.json has required fields:
  - `project_id`
  - `skills`
  - `diet103_version: "1.2.0"`

**"Hooks not executable"**
→ Run: `chmod +x .claude/hooks/*.js`

## ✨ Pro Tips

1. Run validation before committing
2. Use `--verbose` for debugging
3. Customize templates for your org
4. Add to CI/CD pipeline
5. Set threshold to 90% for strict compliance

