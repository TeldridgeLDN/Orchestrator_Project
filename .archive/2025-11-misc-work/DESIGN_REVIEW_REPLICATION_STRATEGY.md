# Design Review System - Replication Strategy

**Purpose:** Distribute the design review system from Orchestrator_Project to sibling projects  
**Target:** portfolio-redesign and other frontend projects  
**Date:** 2025-11-19

---

## 🎯 Current Architecture

### Orchestrator_Project Structure

```
Orchestrator_Project/
├── .claude/                          # SHARED INFRASTRUCTURE
│   ├── hooks/
│   │   └── design-review.js         # Pre-commit hook
│   ├── workflows/design-review/
│   │   ├── workflow.json
│   │   ├── accessibility-audit.js
│   │   ├── capture-screenshots.js
│   │   ├── visual-diff.js
│   │   ├── design-consistency.js
│   │   └── generate-report.js
│   └── utils/
│       └── playwright-helper.js
│
├── dashboard/                        # SUB-PROJECT
│   └── .claude/
│       ├── design-review.json       # Project-specific config
│       └── reports/
│
└── test-*.js                        # Test scripts
```

---

## 📊 Distribution Models

### Model 1: Shared Infrastructure (Monorepo Pattern)
**Best for:** Projects in same repository

**Architecture:**
```
Orchestrator_Project/
├── .claude/                    # SHARED (all projects use)
│   ├── hooks/
│   ├── workflows/
│   └── utils/
│
├── dashboard/
│   └── .claude/design-review.json
│
├── portfolio-redesign/         # NEW PROJECT
│   └── .claude/design-review.json
│
└── multi-layer-cal/            # ANOTHER PROJECT
    └── .claude/design-review.json
```

**Pros:**
- ✅ Single source of truth
- ✅ Easy updates (update once, affects all)
- ✅ Consistent behavior across projects
- ✅ Shared test infrastructure

**Cons:**
- ⚠️ All projects must be in same repo
- ⚠️ Tight coupling

---

### Model 2: Package Distribution (npm Package)
**Best for:** Completely independent projects

**Architecture:**
```
@yourorg/design-review-system/
├── package.json
├── hooks/
├── workflows/
└── utils/

portfolio-redesign/
├── node_modules/
│   └── @yourorg/design-review-system/
├── .claude/
│   └── design-review.json
└── package.json
```

**Pros:**
- ✅ True independence
- ✅ Version control per project
- ✅ Can publish to npm registry
- ✅ Standard distribution model

**Cons:**
- ⚠️ More setup required
- ⚠️ Updates need version bumps
- ⚠️ Package maintenance overhead

---

### Model 3: Git Subtree/Submodule (Recommended for portfolio-redesign)
**Best for:** Related but separate repositories

**Architecture:**
```
portfolio-redesign/
├── .design-review/              # Git subtree from Orchestrator
│   ├── hooks/
│   ├── workflows/
│   └── utils/
├── .claude/
│   ├── design-review.json       # Project-specific
│   └── reports/
└── package.json
```

**Pros:**
- ✅ Projects can be separate repos
- ✅ Easy to sync updates
- ✅ Maintains history
- ✅ Can customize per project

**Cons:**
- ⚠️ Requires git subtree knowledge
- ⚠️ Slightly more complex workflow

---

### Model 4: Template Repository
**Best for:** Starting new projects

**Architecture:**
```
design-review-template/
├── .claude/
│   ├── hooks/
│   ├── workflows/
│   ├── utils/
│   └── design-review.json.example
└── README.md

# Use with:
gh repo create my-new-project --template design-review-template
```

**Pros:**
- ✅ Easy to start new projects
- ✅ Complete independence after creation
- ✅ GitHub template feature

**Cons:**
- ⚠️ No automatic updates
- ⚠️ Each project diverges over time

---

## 🎯 Recommended Approach: Hybrid Model

**For portfolio-redesign specifically:**

### Phase 1: Shared Infrastructure (Immediate)
Since portfolio-redesign might be a subdirectory or closely related:

```bash
# In portfolio-redesign
ln -s ../Orchestrator_Project/.claude .claude-shared

# Create project-specific config
mkdir -p .claude
cat > .claude/design-review.json << EOF
{
  "enabled": true,
  "mode": "warn",
  "sharedInfrastructure": "../Orchestrator_Project/.claude",
  "devServer": {
    "url": "http://localhost:3000",
    "port": 3000
  }
}
EOF
```

### Phase 2: Package Extraction (When Mature)
Extract to npm package when:
- 3+ projects using it
- System is stable
- Want independent versioning

---

## 🚀 Implementation Steps

### For portfolio-redesign Project

#### Step 1: Assess Project Structure

**Questions to Answer:**
1. Is portfolio-redesign in same repo as Orchestrator?
2. What dev server does it use? (Vite, Next.js, etc.)
3. What port does it run on?
4. What components need testing?

**Discovery Commands:**
```bash
# Find portfolio-redesign
find ~ -type d -name "portfolio-redesign" 2>/dev/null

# Check if it's a git repo
cd portfolio-redesign && git remote -v

# Check package.json
cat portfolio-redesign/package.json | jq '.scripts'
```

---

#### Step 2: Choose Distribution Model

**Decision Tree:**

```
Is portfolio-redesign in same repo as Orchestrator?
├─ YES → Use Model 1 (Shared Infrastructure)
│        Action: Create .claude/design-review.json only
│
└─ NO → Is it a separate git repo?
        ├─ YES → Use Model 3 (Git Subtree)
        │        Action: Add subtree + project config
        │
        └─ Is it completely independent?
                 └─ YES → Use Model 2 (npm Package)
                          Action: Extract to package
```

---

#### Step 3A: Shared Infrastructure Setup (Same Repo)

```bash
cd portfolio-redesign

# Create project-specific config
mkdir -p .claude/reports/design-review/{screenshots,baselines}

cat > .claude/design-review.json << 'EOF'
{
  "enabled": true,
  "mode": "warn",
  "checks": {
    "accessibility": true,
    "visualRegression": false,
    "designConsistency": true
  },
  "devServer": {
    "url": "http://localhost:3000",
    "port": 3000,
    "checkTimeout": 5000
  },
  "components": {
    "paths": [
      "src/components/**/*.tsx",
      "src/components/**/*.jsx"
    ]
  }
}
EOF

# Test it
cd .. # Back to Orchestrator root
node test-design-review.js --project portfolio-redesign
```

---

#### Step 3B: Git Subtree Setup (Separate Repo)

```bash
cd portfolio-redesign

# Add Orchestrator's .claude as subtree
git subtree add --prefix=.design-review-system \
  ../Orchestrator_Project/.claude main --squash

# Create symlinks
ln -s .design-review-system/hooks .claude/hooks
ln -s .design-review-system/workflows .claude/workflows
ln -s .design-review-system/utils .claude/utils

# Create project config
mkdir -p .claude/reports/design-review
cat > .claude/design-review.json << 'EOF'
{
  "enabled": true,
  "mode": "warn",
  "devServer": {
    "url": "http://localhost:3000",
    "port": 3000
  }
}
EOF

# Update from source
git subtree pull --prefix=.design-review-system \
  ../Orchestrator_Project/.claude main --squash
```

---

#### Step 3C: npm Package Setup (Independent Projects)

```bash
# In Orchestrator_Project
cd .claude
npm init --scope=@yourorg --name=design-review-system

cat > package.json << 'EOF'
{
  "name": "@yourorg/design-review-system",
  "version": "1.0.0",
  "description": "Automated design review with accessibility testing",
  "main": "index.js",
  "files": [
    "hooks/",
    "workflows/",
    "utils/"
  ],
  "dependencies": {
    "playwright": "^1.40.0"
  }
}
EOF

# Publish (if using npm registry)
npm publish --access public

# Install in portfolio-redesign
cd portfolio-redesign
npm install @yourorg/design-review-system
```

---

## 📋 Configuration Template

### Minimal Configuration
```json
{
  "enabled": true,
  "devServer": {
    "url": "http://localhost:3000"
  }
}
```

### Full Configuration
```json
{
  "enabled": true,
  "mode": "warn",
  "checks": {
    "accessibility": true,
    "visualRegression": true,
    "designConsistency": true
  },
  "devServer": {
    "url": "http://localhost:3000",
    "port": 3000,
    "checkTimeout": 5000
  },
  "components": {
    "paths": [
      "src/components/**/*.tsx",
      "app/components/**/*.tsx"
    ],
    "exclude": [
      "**/*.test.tsx",
      "**/*.spec.tsx"
    ]
  },
  "screenshots": {
    "viewport": {
      "width": 1280,
      "height": 720
    },
    "fullPage": false
  },
  "accessibility": {
    "wcagLevel": "AA",
    "includeWarnings": true
  },
  "designSystem": {
    "colors": {
      "primary": ["#0066cc"]
    }
  },
  "reporting": {
    "outputDir": ".claude/reports/design-review",
    "format": "markdown"
  }
}
```

---

## 🔧 Adaptation Requirements

### Per-Project Customization Needed

1. **Dev Server Configuration**
   - Port number
   - URL pattern
   - Startup command

2. **Component Paths**
   - File patterns
   - Directory structure
   - Naming conventions

3. **Design System Values**
   - Color palette
   - Typography scale
   - Spacing system

4. **Performance Targets**
   - Accessibility score thresholds
   - Execution time limits
   - Screenshot sizes

---

## 🧪 Testing New Projects

### Validation Checklist

```bash
# 1. Dev server accessible
curl -I http://localhost:3000

# 2. Configuration valid
cat .claude/design-review.json | jq .

# 3. Components detectable
# Check that React/Vue root exists

# 4. Run test
node test-design-review.js

# 5. Verify reports
ls -la .claude/reports/design-review/
```

---

## 📊 Comparison Matrix

| Feature | Shared Infra | Git Subtree | npm Package | Template |
|---------|--------------|-------------|-------------|----------|
| **Setup Time** | Fast ⚡ | Medium 🔨 | Slow 🐌 | Fast ⚡ |
| **Updates** | Automatic ✅ | Manual sync 🔄 | Version bump 📦 | None ❌ |
| **Independence** | Low 🔗 | Medium 🔗 | High 🆓 | High 🆓 |
| **Consistency** | High ✅ | High ✅ | Medium ⚠️ | Low ❌ |
| **Best For** | Monorepo | Related repos | Independent | New projects |

---

## 🎯 Recommendation for portfolio-redesign

### Scenario A: If portfolio-redesign is in Orchestrator repo
**Use:** Shared Infrastructure (Model 1)
**Reason:** Simplest, most maintainable
**Setup Time:** 5 minutes

### Scenario B: If portfolio-redesign is separate repo
**Use:** Git Subtree (Model 3)
**Reason:** Balance of independence and updates
**Setup Time:** 15 minutes

### Scenario C: If you have 3+ independent projects
**Use:** npm Package (Model 2)
**Reason:** Scales to many projects
**Setup Time:** 1 hour initial, 5 min per project

---

## 🚀 Quick Start Commands

### For Same Repo Projects
```bash
cd portfolio-redesign
mkdir -p .claude/reports/design-review/{screenshots,baselines}
cp ../dashboard/.claude/design-review.json .claude/
# Edit config for project specifics
vim .claude/design-review.json
```

### For Separate Repos
```bash
cd portfolio-redesign
git subtree add --prefix=.design-review \
  path/to/Orchestrator/.claude main --squash
ln -s .design-review/hooks .claude/hooks
ln -s .design-review/workflows .claude/workflows
ln -s .design-review/utils .claude/utils
```

### For New Projects
```bash
gh repo create my-project --template design-review-template
cd my-project
npm install
npm run dev
```

---

## 📚 Next Steps

1. **Identify portfolio-redesign location**
   - Same repo or separate?
   - Current structure?

2. **Choose distribution model**
   - Based on decision tree

3. **Implement chosen model**
   - Follow step-by-step guide

4. **Test integration**
   - Run validation checklist

5. **Document project-specific setup**
   - Add to project README

---

## 🔗 Related Documentation

- `DESIGN_REVIEW_COMPLETE_SUMMARY.md` - System overview
- `TASK_118_DASHBOARD_INTEGRATION_GUIDE.md` - Integration example
- `DESIGN_REVIEW_TROUBLESHOOTING.md` - Common issues

---

**Ready to proceed? Let me know the portfolio-redesign structure and I'll provide specific implementation steps!**

