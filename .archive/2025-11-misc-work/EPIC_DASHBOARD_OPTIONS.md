# Epic Dashboard Options for Portfolio-Redesign

**Date:** November 10, 2025  
**User Need:** Visual epic tracking while keeping TaskMaster for detailed task management  
**Status:** Options Research Complete

---

## User's 3 Epics

### Epic 1: Landing Page Launch
- **Goal:** Get validation subdomain live and converting
- **Current Tag:** `validation`
- **Tasks:** DNS, Astro setup, design system, analytics, hero, pricing, etc.
- **Progress:** ~50% (10/20 tasks done)

### Epic 2: Reddit Prospecting & Content Generation
- **Goal:** Organic and paid Reddit content based on sentiment analysis
- **Current Tag:** ❓ **No existing tag** (needs creation)
- **Related Files:** `scripts/reddit_content_generator.py`, `content-queue/`
- **Progress:** Script exists, needs task breakdown

### Epic 3: Consistent Tone of Voice (Monzo Principles)
- **Goal:** Apply Monzo UX principles across all touchpoints
- **Current Tag:** `monzo-enhancements`
- **Tasks:** Magic moments, thoughtful friction, A/B testing, etc.
- **Progress:** ~20% (3/15 tasks done)

---

## Option 1: TaskMaster CLI Dashboard (Simplest) ⭐ RECOMMENDED

**Concept:** Leverage TaskMaster's existing `tags` command with enhanced metadata

### Implementation:

```bash
# 1. Add epic metadata to existing tags
task-master rename-tag validation landing-page
task-master add-tag reddit-campaign --description="Organic/paid Reddit prospecting with sentiment analysis"

# 2. View epic dashboard
task-master tags --show-metadata

# Output Example:
┌──────────────────────────────────────────────────────────┐
│ EPIC DASHBOARD                                           │
├──────────────────────────────────────────────────────────┤
│ landing-page (validation subdomain)                      │
│ ▓▓▓▓▓░░░░░ 50% (10/20 tasks)                            │
│ Description: Get validation subdomain live and converting│
│ Created: 2025-11-09 | Updated: 2025-11-10               │
├──────────────────────────────────────────────────────────┤
│ reddit-campaign                                          │
│ ░░░░░░░░░░ 0% (0/15 tasks)                              │
│ Description: Organic/paid Reddit with sentiment analysis│
│ Created: 2025-11-10                                      │
├──────────────────────────────────────────────────────────┤
│ monzo-enhancements                                       │
│ ▓▓░░░░░░░░ 20% (3/15 tasks)                             │
│ Description: Consistent tone of voice across touchpoints │
│ Created: 2025-11-09 | Updated: 2025-11-10               │
└──────────────────────────────────────────────────────────┘
```

### Epic CRUD Workflow:

```bash
# Create Epic (= Create Tag with metadata)
task-master add-tag <epic-name> --description="<epic goal>"

# View Epics Dashboard
task-master tags --show-metadata

# Edit Epic (= Rename or update metadata)
task-master rename-tag <old-name> <new-name>
# (Metadata updates would require adding --update-description flag)

# Delete Epic
task-master delete-tag <epic-name>

# Switch to Epic
task-master use-tag <epic-name>
task-master next
```

### Pros:
- ✅ **Zero new tools** - Uses TaskMaster natively
- ✅ **Already integrated** - Tags ARE epics conceptually
- ✅ **Fast** - No UI overhead
- ✅ **Terminal-native** - Fits your workflow
- ✅ **Easy CRUD** - Existing commands work

### Cons:
- ⚠️ **Text-based** - Not visually rich (no colors/charts)
- ⚠️ **Limited visualization** - Progress bars are ASCII
- ⚠️ **Metadata update** - May need enhancement to TaskMaster

---

## Option 2: Simple HTML Dashboard (Local File)

**Concept:** Generate a single HTML file that visualizes TaskMaster data

### Implementation:

Create `/Users/tomeldridge/portfolio-redesign/epic-dashboard.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Epic Dashboard - Portfolio Redesign</title>
  <style>
    body { font-family: system-ui; background: #1e1e1e; color: #fff; padding: 20px; }
    .epic-card { background: #2d2d2d; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .progress-bar { height: 30px; background: #444; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #10b981, #3b82f6); transition: width 0.3s; }
    .task-count { font-size: 14px; color: #888; }
    h2 { margin: 0; }
  </style>
</head>
<body>
  <h1>🎯 Epic Dashboard</h1>
  
  <div class="epic-card">
    <h2>🚀 Landing Page Launch</h2>
    <p class="task-count">10 / 20 tasks complete (50%)</p>
    <div class="progress-bar">
      <div class="progress-fill" style="width: 50%"></div>
    </div>
    <p>Get validation subdomain live and converting</p>
    <button onclick="window.location='vscode://file/Users/tomeldridge/portfolio-redesign'">Open in VSCode</button>
  </div>

  <div class="epic-card">
    <h2>📢 Reddit Campaign</h2>
    <p class="task-count">0 / 15 tasks complete (0%)</p>
    <div class="progress-bar">
      <div class="progress-fill" style="width: 0%"></div>
    </div>
    <p>Organic/paid Reddit prospecting with sentiment analysis</p>
    <button onclick="window.location='vscode://file/Users/tomeldridge/portfolio-redesign'">Open in VSCode</button>
  </div>

  <div class="epic-card">
    <h2>🎨 Monzo Principles</h2>
    <p class="task-count">3 / 15 tasks complete (20%)</p>
    <div class="progress-bar">
      <div class="progress-fill" style="width: 20%"></div>
    </div>
    <p>Consistent tone of voice across touchpoints</p>
    <button onclick="window.location='vscode://file/Users/tomeldridge/portfolio-redesign'">Open in VSCode</button>
  </div>

  <script>
    // Auto-refresh data from tasks.json
    async function loadData() {
      const res = await fetch('/tasks/tasks.json');
      const data = await res.json();
      // Update progress bars...
    }
    setInterval(loadData, 5000); // Refresh every 5s
  </script>
</body>
</html>
```

### Usage:

```bash
# Open in browser
open epic-dashboard.html

# Or serve with Python
cd /Users/tomeldridge/portfolio-redesign
python3 -m http.server 8000
# Visit: http://localhost:8000/epic-dashboard.html
```

### Pros:
- ✅ **Visual** - Rich colors, progress bars
- ✅ **Browser-based** - Familiar interface
- ✅ **Auto-refresh** - Updates as tasks change
- ✅ **Clickable** - Deep links to VSCode
- ✅ **Simple** - Single HTML file

### Cons:
- ⚠️ **Manual updates** - HTML needs regeneration when structure changes
- ⚠️ **Separate tool** - Not integrated with TaskMaster CLI
- ⚠️ **Browser dependency** - Requires opening browser

---

## Option 3: Node.js CLI Dashboard (Interactive TUI)

**Concept:** Terminal User Interface with rich visualization

### Implementation:

Use `blessed` or `ink` (React for CLI) to create interactive dashboard:

```javascript
// epic-dashboard.js
import blessed from 'blessed';
import { readFileSync } from 'fs';

const screen = blessed.screen({ smartCSR: true });

// Load tasks.json
const tasks = JSON.parse(readFileSync('./tasks/tasks.json', 'utf8'));

// Calculate epic stats
const epics = Object.keys(tasks).map(tag => {
  const taskList = tasks[tag].tasks || [];
  const done = taskList.filter(t => t.status === 'done').length;
  const total = taskList.length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  
  return {
    name: tag,
    description: tasks[tag].metadata?.description || '',
    done,
    total,
    percent
  };
});

// Create boxes for each epic
epics.forEach((epic, index) => {
  const box = blessed.box({
    top: index * 7,
    left: 0,
    width: '100%',
    height: 6,
    content: `
      {bold}${epic.name}{/bold}
      ${epic.description}
      Progress: [${'='.repeat(epic.percent / 2)}${' '.repeat(50 - epic.percent / 2)}] ${epic.percent}%
      Tasks: ${epic.done} / ${epic.total}
    `,
    tags: true,
    border: { type: 'line' },
    style: {
      fg: 'white',
      border: { fg: '#3b82f6' }
    }
  });
  
  screen.append(box);
});

// Quit on Escape, q, or Control-C
screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

screen.render();
```

### Usage:

```bash
# Run dashboard
node epic-dashboard.js

# Or add to package.json scripts
npm run epic:dashboard
```

### Pros:
- ✅ **Terminal-native** - No browser needed
- ✅ **Rich visualization** - Colors, boxes, progress bars
- ✅ **Interactive** - Keyboard navigation
- ✅ **Auto-refresh** - Can watch tasks.json for changes
- ✅ **Professional** - Looks polished

### Cons:
- ⚠️ **Dependencies** - Requires Node.js packages
- ⚠️ **Setup overhead** - Package installation
- ⚠️ **Not TaskMaster native** - Separate tool

---

## Option 4: VSCode Extension (Most Integrated)

**Concept:** VSCode sidebar panel showing epic dashboard

### Implementation:

Create a minimal VSCode extension:

```javascript
// extension.js
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function activate(context) {
  // Register tree view provider
  const treeDataProvider = new EpicTreeProvider();
  
  vscode.window.registerTreeDataProvider('epicDashboard', treeDataProvider);
  
  // Refresh on file changes
  const watcher = vscode.workspace.createFileSystemWatcher('**/tasks.json');
  watcher.onDidChange(() => treeDataProvider.refresh());
}

class EpicTreeProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }
  
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  
  getChildren(element) {
    if (!element) {
      // Root level - show epics
      const tasksPath = path.join(vscode.workspace.rootPath, 'tasks/tasks.json');
      const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
      
      return Object.keys(tasks).map(tag => ({
        label: tag,
        description: tasks[tag].metadata?.description,
        collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
        contextValue: 'epic',
        command: {
          command: 'epic.open',
          title: 'Open Epic',
          arguments: [tag]
        }
      }));
    }
  }
  
  getTreeItem(element) {
    return element;
  }
}

module.exports = { activate };
```

### Package Configuration:

```json
{
  "name": "epic-dashboard",
  "displayName": "Epic Dashboard",
  "version": "0.0.1",
  "engines": { "vscode": "^1.60.0" },
  "contributes": {
    "views": {
      "explorer": [
        {
          "id": "epicDashboard",
          "name": "Epics"
        }
      ]
    }
  }
}
```

### Pros:
- ✅ **Deeply integrated** - Lives in VSCode sidebar
- ✅ **Always visible** - No context switching
- ✅ **Native feel** - Matches VSCode UI
- ✅ **Auto-updates** - Watches tasks.json changes
- ✅ **Clickable** - Jump to tasks directly

### Cons:
- ⚠️ **Development overhead** - Requires extension development
- ⚠️ **Installation** - Users must install extension
- ⚠️ **Maintenance** - Must keep updated with TaskMaster

---

## Option 5: Enhanced TaskMaster (Contribute to Project)

**Concept:** Add epic visualization to TaskMaster itself

### Proposal:

Submit PR to TaskMaster AI to add:

```bash
# New command
task-master epic:list

# Output: Visual epic dashboard with rich metadata
┌──────────────────────────────────────────────────────────┐
│ 🚀 LANDING PAGE LAUNCH                                   │
│ ▓▓▓▓▓░░░░░ 50% (10/20 tasks)                            │
│ Get validation subdomain live and converting             │
│ Tag: validation | Priority: HIGH | Updated: 2 hours ago  │
│ Next: Task #11 - Implement social proof section         │
├──────────────────────────────────────────────────────────┤
│ 📢 REDDIT CAMPAIGN                                       │
│ ░░░░░░░░░░ 0% (0/15 tasks)                              │
│ Organic/paid Reddit with sentiment analysis              │
│ Tag: reddit-campaign | Priority: MEDIUM | Created today  │
│ Next: Task #1 - Set up sentiment analysis pipeline      │
├──────────────────────────────────────────────────────────┤
│ 🎨 MONZO PRINCIPLES                                      │
│ ▓▓░░░░░░░░ 20% (3/15 tasks)                             │
│ Consistent tone of voice across touchpoints              │
│ Tag: monzo-enhancements | Priority: MEDIUM              │
│ Next: Task #15 - A/B testing infrastructure             │
└──────────────────────────────────────────────────────────┘

# Epic CRUD commands
task-master epic:create <name> --description="..." --priority=<high|medium|low>
task-master epic:update <name> --description="..."
task-master epic:delete <name>
task-master epic:show <name>
```

### Pros:
- ✅ **Native to TaskMaster** - Official feature
- ✅ **Community benefit** - Helps other users
- ✅ **Professional** - Well-tested and maintained
- ✅ **Future-proof** - Updates automatically
- ✅ **Best integration** - Perfect fit

### Cons:
- ⚠️ **Dependency on maintainers** - PR approval needed
- ⚠️ **Timeline** - May take weeks/months
- ⚠️ **Not immediate** - Can't use today

---

## Recommendation Matrix

| Option | Visual Quality | Integration | Setup Time | Maintenance | Best For |
|--------|---------------|-------------|------------|-------------|----------|
| **1. TaskMaster CLI** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⏱️ 5 min | 🟢 Low | **You (immediate)** |
| **2. HTML Dashboard** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⏱️ 30 min | 🟡 Medium | Visual preference |
| **3. Node.js TUI** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⏱️ 1 hour | 🟡 Medium | Terminal enthusiasts |
| **4. VSCode Extension** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⏱️ 4 hours | 🟡 Medium | VSCode users |
| **5. TaskMaster PR** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⏱️ Days/weeks | 🟢 Low | Long-term |

---

## My Recommendation: **Hybrid Approach**

### Phase 1: Immediate (Use Today) - Option 1
```bash
# 1. Create reddit-campaign epic
task-master add-tag reddit-campaign --description="Organic/paid Reddit prospecting with sentiment analysis"

# 2. View epic dashboard
task-master tags --show-metadata

# 3. Work with epics
task-master use-tag reddit-campaign
task-master next
```

### Phase 2: Short-term (This Week) - Option 2 or 3
- If you prefer **visual/browser**: Create HTML dashboard
- If you prefer **terminal**: Create Node.js TUI
- **I can build either for you in ~30 minutes**

### Phase 3: Long-term (Next Month) - Option 5
- Contribute epic visualization to TaskMaster project
- Benefits entire community
- Becomes official feature

---

## Implementation Plan

### Step 1: Map Your Epics to Tags

```bash
# Epic 1: Landing Page (already exists as 'validation')
# Keep as-is or rename for clarity
task-master rename-tag validation landing-page

# Epic 2: Reddit Campaign (create new)
task-master add-tag reddit-campaign --description="Organic/paid Reddit prospecting with sentiment analysis"

# Epic 3: Monzo Principles (already exists)
# Keep as 'monzo-enhancements'
```

### Step 2: Populate Reddit Campaign Epic

```bash
# Switch to reddit-campaign
task-master use-tag reddit-campaign

# Parse PRD or add tasks manually
task-master add-task --prompt="Set up sentiment analysis pipeline for Reddit posts" --research
task-master add-task --prompt="Create Reddit account automation for posting schedule" --research
task-master add-task --prompt="Build engagement tracking dashboard" --research

# Expand complex tasks
task-master analyze-complexity --research
task-master expand --all --research
```

### Step 3: View Epic Dashboard

```bash
# Simple view
task-master tags --show-metadata

# Or run custom dashboard (if built)
npm run epic:dashboard
# OR
open epic-dashboard.html
```

---

## Next Steps - Choose Your Path:

**A)** Start with **Option 1** (TaskMaster CLI) immediately  
**B)** I build **Option 2** (HTML Dashboard) for you now (~30 min)  
**C)** I build **Option 3** (Node.js TUI) for you now (~1 hour)  
**D)** Mix: Start with Option 1, build Option 2/3 later

**What would you like to proceed with?**


