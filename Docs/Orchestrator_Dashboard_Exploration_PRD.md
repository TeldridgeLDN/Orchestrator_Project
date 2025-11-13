# Product Requirements Document: Orchestrator Visual Dashboard Exploration

**Version:** 1.0  
**Status:** Exploration Phase  
**Last Updated:** 2025-11-11  
**Task Type:** Research & Design Exploration  
**Estimated Effort:** 8-12 hours (Phase 1)

---

## Executive Summary

This PRD defines an exploratory task to design and prototype a **Visual Dashboard for the Orchestrator system**, following the architectural principles established in the File Lifecycle Management PRD and DIET103 Implementation. The dashboard will provide real-time visibility into the Orchestrator's state, operations, and health metrics across both global (`~/.claude/`) and project-specific (`.claude/`) layers.

**Core Value Proposition:**
- **Real-time visibility** into Orchestrator operations and health
- **Multi-layer view** (Global + Project) with drill-down capabilities
- **Actionable insights** from file lifecycle, skill activation, and hook execution
- **Self-service diagnostics** reducing dependency on CLI commands
- **Progressive disclosure** aligned with PAI's UFC (Unified Filesystem Context) pattern

**Why This Exploration?**

Following the established principles:
- ✅ **Modularity** (DIET103): Dashboard as self-contained skill with progressive disclosure
- ✅ **Organization** (File Lifecycle): Visual representation of classification and organization state
- ✅ **Automation** (Hooks): Real-time monitoring of automated quality gates
- ✅ **Developer Experience**: Single-pane-of-glass view reducing cognitive load

---

## 1. Problem Statement

### 1.1 Current State

**What Exists:**

The Orchestrator system successfully manages infrastructure across global and project layers but lacks visual feedback:

1. **CLI-Only Interface:**
   - All information accessed via terminal commands
   - No at-a-glance status overview
   - Complex state requires multiple commands to understand
   - Example: Understanding file lifecycle state requires reading `.file-manifest.json`

2. **Limited Real-Time Feedback:**
   - Hook execution results buried in logs
   - Skill activation not visually confirmed
   - File classification happens silently
   - No trending or historical data visualization

3. **Multi-Layer Complexity:**
   - Global vs. Project state not immediately visible
   - Cross-layer dependencies unclear
   - Active project context ambiguous
   - Switching between layers requires mental tracking

4. **Diagnostic Overhead:**
   - Issues require running multiple validation commands
   - No proactive health monitoring
   - Performance metrics scattered
   - Troubleshooting requires deep CLI knowledge

**Pain Points:**

| Pain Point | Impact | Frequency |
|-----------|--------|-----------|
| Can't see Orchestrator state at-a-glance | High | Constant |
| Unclear which skills are active | Medium | Daily |
| File lifecycle status invisible until issues | High | Weekly |
| Hook execution results hidden | Medium | Per-edit |
| No visibility into performance metrics | Low | Monthly |

### 1.2 Target State

A **visual dashboard interface** that provides:

- **At-a-glance system health** across all Orchestrator components
- **Real-time monitoring** of hooks, skills, and file lifecycle operations
- **Interactive exploration** of global and project layers
- **Actionable insights** with one-click remediation
- **Historical trending** for performance and quality metrics
- **Progressive disclosure** from high-level overview to detailed diagnostics

---

## 2. Objectives & Success Criteria

### 2.1 Primary Objectives

| Objective | Description | Success Metric |
|-----------|-------------|----------------|
| **Visual System Health** | Dashboard shows real-time Orchestrator state | Single view shows all critical metrics |
| **Layer Visibility** | Clear distinction between global and project state | Users can identify active layer in <5 seconds |
| **File Lifecycle View** | Visual representation of classification and organization | Organization score visible, misplaced files actionable |
| **Hook Monitoring** | Real-time hook execution feedback | Hook results displayed within 1 second of execution |
| **Skill Status** | Visual confirmation of active skills | Active skills shown with activation triggers |
| **Performance Metrics** | Visual trending of system performance | Charts show 7-day trends for key metrics |

### 2.2 Non-Objectives (Out of Scope for Phase 1)

- Full CRUD operations via dashboard (CLI remains primary interface)
- Real-time collaboration features
- Mobile/responsive interface (desktop-first)
- Historical data beyond 30 days
- External integrations (GitHub, Slack, etc.)
- Multi-user/team features

---

## 3. Dashboard Architecture Options

### 3.1 Option 1: Web-Based Dashboard (Recommended)

**Technology Stack:**
- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Node.js Express API (or MCP integration)
- **Data:** File-based (read from Orchestrator JSON files)
- **Refresh:** WebSocket for real-time updates OR polling every 2-5 seconds
- **Hosting:** Local `http://localhost:3000` (no external hosting)

**Pros:**
- ✅ Rich interactive UI capabilities
- ✅ Real-time updates via WebSockets
- ✅ Extensive charting libraries available
- ✅ Familiar tech stack for most developers
- ✅ Easy to extend and customize

**Cons:**
- ❌ Requires Node.js server running
- ❌ Additional dependency to manage
- ❌ Complexity for simple status checks

**Best For:** Full-featured dashboard with real-time updates and interactive exploration.

---

### 3.2 Option 2: Terminal UI (TUI)

**Technology Stack:**
- **Framework:** blessed.js or ink (React for CLI)
- **Data:** Direct file system reads
- **Refresh:** Manual or auto-refresh every N seconds
- **Distribution:** npm package or bundled with Orchestrator

**Pros:**
- ✅ No browser required
- ✅ Lightweight and fast
- ✅ Integrates seamlessly with CLI workflow
- ✅ No server process needed
- ✅ Works over SSH

**Cons:**
- ❌ Limited UI capabilities (no mouse support in some terminals)
- ❌ Harder to display complex visualizations
- ❌ Text-based charts less intuitive
- ❌ Color support varies by terminal

**Best For:** Quick status checks and SSH-compatible monitoring.

---

### 3.3 Option 3: Static HTML Report

**Technology Stack:**
- **Generator:** Node.js script
- **Output:** Self-contained HTML file with embedded CSS/JS
- **Data:** Snapshot at generation time
- **Refresh:** Manual regeneration or file watcher

**Pros:**
- ✅ No server required
- ✅ Easy to share (single file)
- ✅ No runtime dependencies
- ✅ Works offline
- ✅ Simple implementation

**Cons:**
- ❌ No real-time updates
- ❌ Requires regeneration for fresh data
- ❌ Limited interactivity
- ❌ Manual refresh workflow

**Best For:** Snapshot reports and documentation purposes.

---

### 3.4 Option 4: VS Code Extension

**Technology Stack:**
- **Framework:** VS Code Extension API
- **UI:** WebView with React
- **Data:** Direct file system access via VS Code API
- **Distribution:** VS Code Marketplace or manual install

**Pros:**
- ✅ Native VS Code integration
- ✅ No separate window needed
- ✅ Access to VS Code APIs (file watching, etc.)
- ✅ Familiar UX for developers

**Cons:**
- ❌ VS Code-specific (not editor-agnostic)
- ❌ Requires extension installation
- ❌ More complex development/distribution
- ❌ Doesn't help users of other editors (Cursor, Zed, etc.)

**Best For:** Deep VS Code integration, but limits portability.

---

### 3.5 Recommended Approach: Hybrid Web + CLI

**Phase 1 (Exploration):**
1. Build **static HTML report** for quick prototyping and design validation
2. Validate information architecture and UI components
3. Gather feedback on layout and metrics

**Phase 2 (Production):**
1. Upgrade to **web-based dashboard** with real-time updates
2. Add **TUI alternative** for CLI-first users
3. Optional: VS Code extension if demand exists

**Rationale:**
- Static HTML allows rapid iteration on design
- Web-based provides full feature set for production
- TUI ensures CLI workflow compatibility
- Incremental development reduces risk

---

## 4. Dashboard Components & Features

### 4.1 High-Level Layout (Wireframe)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ORCHESTRATOR DASHBOARD                    [Global] [Project]  v1.0  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────┐│
│  │   SYSTEM HEALTH     │  │   ACTIVE LAYER      │  │  QUICK STATS ││
│  │   🟢 Operational    │  │   Global: ✓         │  │  42 Files    ││
│  │   Last Update: 2s   │  │   Project: portfolio│  │  5 Skills    ││
│  └─────────────────────┘  └─────────────────────┘  │  3 Hooks     ││
│                                                     └──────────────┘│
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  FILE LIFECYCLE STATUS                                 [View]  │ │
│  │  Organization Score: 92%  ▓▓▓▓▓▓▓▓▓░                           │ │
│  │                                                                 │ │
│  │  CRITICAL:   5 files  ✅  All in correct location              │ │
│  │  PERMANENT:  28 files ⚠️  1 misplaced                          │ │
│  │  EPHEMERAL:  7 files  ⚠️  2 misplaced, 3 expiring soon         │ │
│  │  ARCHIVED:   2 files  ✅                                       │ │
│  │                                                                 │ │
│  │  [Organize Misplaced Files]  [View Details]                    │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  ACTIVE SKILLS (3)                                     [View]  │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │ │
│  │  │ doc-validator    │  │ test-runner      │  │ link-checker │ │ │
│  │  │ ✅ Active        │  │ ✅ Active        │  │ ✅ Active    │ │ │
│  │  │ Last Run: 5m ago │  │ Last Run: 12m    │  │ Last: 3m     │ │ │
│  │  └──────────────────┘  └──────────────────┘  └──────────────┘ │ │
│  │                                                                 │ │
│  │  [View All Skills]  [Skill Activation History]                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  HOOK EXECUTION LOG                                    [View]  │ │
│  │  ┌────────────────────────────────────────────────────────────┐│ │
│  │  │ 14:32:05  PostToolUse     ✅  PASSED  (123ms)              ││ │
│  │  │ 14:31:58  UserPromptSubmit ✅  PASSED  (45ms)              ││ │
│  │  │ 14:30:12  PostToolUse     ⚠️  WARNINGS (Broken link)       ││ │
│  │  └────────────────────────────────────────────────────────────┘│ │
│  │                                                                 │ │
│  │  [View Full Log]  [Filter by Status]                           │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  PERFORMANCE METRICS (7-day trend)                             │ │
│  │                                                                 │ │
│  │  Hook Execution Time:  [Line chart showing trend]              │ │
│  │  File Classifications: [Bar chart showing daily counts]        │ │
│  │  Validation Failures:  [Area chart showing error trend]        │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Component Specifications

#### 4.2.1 System Health Card

**Purpose:** At-a-glance system status

**Data Sources:**
- Last manifest update timestamp
- Hook execution status (last 5 runs)
- Validation errors/warnings count
- Active project detection

**States:**
- 🟢 **Operational:** All systems green, no errors
- 🟡 **Warning:** Non-critical issues detected (e.g., expiring files)
- 🔴 **Error:** Critical issues requiring attention
- ⚪ **Unknown:** Unable to read Orchestrator state

**Interactions:**
- Click to view detailed health report
- Hover to see last update details

---

#### 4.2.2 File Lifecycle Status Panel

**Purpose:** Visual representation of file classification and organization

**Data Source:** `.file-manifest.json` (global and project)

**Components:**
1. **Organization Score Progress Bar**
   - Visual bar showing percentage (0-100%)
   - Color-coded: Green (>90%), Yellow (70-90%), Red (<70%)

2. **Tier Breakdown**
   - Row per tier (CRITICAL, PERMANENT, EPHEMERAL, ARCHIVED)
   - File count per tier
   - Status indicator (✅ all correct, ⚠️ some misplaced, 🔴 many misplaced)
   - Hover to see specific misplaced files

3. **Action Items**
   - Quick access to "Organize Misplaced Files" workflow
   - "Archive Expired Files" if any pending
   - "View Details" to open full manifest view

**Real-Time Updates:**
- Refresh on manifest file changes (file watcher)
- Animate transitions when files are organized

---

#### 4.2.3 Active Skills Panel

**Purpose:** Show currently active skills and recent activation history

**Data Source:** `skill-rules.json` + hook execution logs

**Components:**
1. **Skill Cards** (3-4 visible, scroll for more)
   - Skill name and icon
   - Status: Active ✅ / Inactive ⚪ / Error 🔴
   - Last activation time
   - Activation count (today)

2. **Activation History Timeline**
   - Horizontal timeline showing skill activations over time
   - Click to see activation trigger (user prompt that matched)

**Interactions:**
- Click skill card to view full skill documentation
- Toggle skill activation rules
- View activation frequency trends

---

#### 4.2.4 Hook Execution Log

**Purpose:** Real-time feed of hook executions and results

**Data Source:** Hook execution logs (to be implemented)

**Components:**
1. **Log Entries** (last 10-20 visible)
   - Timestamp
   - Hook name (UserPromptSubmit, PostToolUse)
   - Status: ✅ PASSED / ⚠️ WARNINGS / 🔴 FAILED
   - Execution time (ms)
   - Summary message (e.g., "Broken link detected")

2. **Filters**
   - By hook type
   - By status
   - By date/time range

3. **Details View**
   - Click entry to expand full hook output
   - Show file modifications that triggered PostToolUse
   - Display validation results

**Real-Time Updates:**
- New entries appear at top with animation
- Failed hooks highlighted prominently
- Desktop notification for failures (optional)

---

#### 4.2.5 Performance Metrics Panel

**Purpose:** Historical trending of key performance indicators

**Data Source:** Aggregated logs and metrics (to be collected)

**Charts:**
1. **Hook Execution Time (Line Chart)**
   - Average execution time per hook type
   - 7-day rolling average
   - Alerts if execution time spikes

2. **File Classifications per Day (Bar Chart)**
   - Stacked bars showing classifications by tier
   - Trend line showing total volume

3. **Validation Failures (Area Chart)**
   - Count of validation errors/warnings over time
   - Goal: downward trend over time

**Interactions:**
- Hover data points to see exact values
- Click chart to view detailed breakdown for that day
- Download chart as PNG/CSV

---

### 4.3 Navigation & Interactivity

#### 4.3.1 Global vs. Project Layer Switching

**Toggle Button (Top Right):**
```
[Global] [Project: portfolio-redesign ▼]
```

**Behavior:**
- Click to switch between global and active project view
- Dropdown to select different project if multiple exist
- All dashboard components update to show selected layer
- URL updates to reflect layer (for bookmarking)

**Visual Differentiation:**
- Global layer: Blue accent color
- Project layer: Green accent color
- Breadcrumb: `Global` or `Global > portfolio-redesign`

---

#### 4.3.2 Progressive Disclosure

**Principle:** Show summary first, drill down on demand

**Examples:**
1. **File Lifecycle Status:**
   - Summary: "4 misplaced files"
   - Click "View Details" → Opens modal with full list
   - Click specific file → Shows classification details + expected location

2. **Skills:**
   - Summary: "3 active skills"
   - Click "View All Skills" → Full skill directory
   - Click skill card → Skill documentation + activation history

3. **Hooks:**
   - Summary: Last 10 log entries
   - Click "View Full Log" → Paginated full history
   - Click entry → Expanded details with full output

**Benefits:**
- Reduces cognitive load (not overwhelming)
- Faster initial page load
- Aligns with PAI's UFC pattern (hierarchical, lazy-loaded)

---

## 5. Technical Implementation

### 5.1 Data Layer

**Primary Data Sources:**
1. **`.file-manifest.json`** (global + project)
   - File classification and organization state
   - Expiration dates and lifecycle metadata

2. **`metadata.json`** (project)
   - Project identity and configuration
   - Quality metrics

3. **`skill-rules.json`** (global + project)
   - Skill activation rules
   - Skill metadata

4. **Hook Execution Logs** (to be implemented)
   - Timestamped log entries
   - Hook name, status, execution time, output
   - Location: `.claude/logs/hooks/` (new)

5. **`config.json`** (global)
   - Orchestrator configuration
   - Active project

**Data Access Pattern:**
```javascript
// Centralized data loader
class OrchestratorDataLoader {
  constructor(layer = 'global') {
    this.layer = layer;
    this.basePath = layer === 'global' 
      ? path.join(os.homedir(), '.claude')
      : path.join(process.cwd(), '.claude');
  }

  async loadFileManifest() {
    const manifestPath = path.join(this.basePath, '.file-manifest.json');
    return JSON.parse(await fs.promises.readFile(manifestPath, 'utf8'));
  }

  async loadSkillRules() {
    const rulesPath = path.join(this.basePath, 'skill-rules.json');
    return JSON.parse(await fs.promises.readFile(rulesPath, 'utf8'));
  }

  async loadHookLogs(limit = 20) {
    const logDir = path.join(this.basePath, 'logs', 'hooks');
    // Read and parse log files
    // Return sorted by timestamp, limited to `limit`
  }

  async getSystemHealth() {
    // Aggregate health from all data sources
    const manifest = await this.loadFileManifest();
    const logs = await this.loadHookLogs(5);
    
    const hasErrors = logs.some(log => log.status === 'FAILED');
    const hasWarnings = manifest.statistics.misplaced > 0 || 
                        manifest.statistics.pending_archive > 0;
    
    return {
      status: hasErrors ? 'error' : hasWarnings ? 'warning' : 'operational',
      lastUpdate: manifest.last_updated,
      issues: {
        misplacedFiles: manifest.statistics.misplaced,
        expiringSoon: manifest.statistics.pending_archive,
        failedHooks: logs.filter(l => l.status === 'FAILED').length
      }
    };
  }
}
```

---

### 5.2 Real-Time Updates

**Option A: File Watchers (Recommended for Phase 1)**

```javascript
import chokidar from 'chokidar';

class OrchestratorWatcher {
  constructor(dataLoader, onUpdate) {
    this.dataLoader = dataLoader;
    this.onUpdate = onUpdate;
    this.watchers = [];
  }

  start() {
    // Watch manifest
    const manifestPath = path.join(this.dataLoader.basePath, '.file-manifest.json');
    this.watchers.push(
      chokidar.watch(manifestPath).on('change', () => {
        this.onUpdate('manifest');
      })
    );

    // Watch skill rules
    const rulesPath = path.join(this.dataLoader.basePath, 'skill-rules.json');
    this.watchers.push(
      chokidar.watch(rulesPath).on('change', () => {
        this.onUpdate('skills');
      })
    );

    // Watch hook logs
    const logDir = path.join(this.dataLoader.basePath, 'logs', 'hooks');
    this.watchers.push(
      chokidar.watch(logDir).on('add', () => {
        this.onUpdate('hooks');
      })
    );
  }

  stop() {
    this.watchers.forEach(w => w.close());
  }
}
```

**Option B: WebSockets (For Production Dashboard)**

```javascript
// Server-side: Broadcast updates to connected clients
io.on('connection', (socket) => {
  const watcher = new OrchestratorWatcher(dataLoader, (eventType) => {
    socket.emit('orchestrator-update', { type: eventType });
  });
  watcher.start();

  socket.on('disconnect', () => {
    watcher.stop();
  });
});

// Client-side: React component
useEffect(() => {
  const socket = io('http://localhost:3000');
  
  socket.on('orchestrator-update', (event) => {
    // Refresh specific component based on event.type
    if (event.type === 'manifest') {
      refetchFileLifecycleData();
    }
  });

  return () => socket.disconnect();
}, []);
```

---

### 5.3 UI Component Library

**Recommended Stack:**
- **React 18** - Component framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling (consistent with modern UI trends)
- **Recharts** - Charting library (React-based, customizable)
- **Lucide React** - Icon library (clean, consistent icons)
- **date-fns** - Date formatting and manipulation

**Example Component:**

```typescript
// FileLifecyclePanel.tsx
import React from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface FileLifecycleData {
  organizationScore: number;
  tiers: {
    tier: 'CRITICAL' | 'PERMANENT' | 'EPHEMERAL' | 'ARCHIVED';
    count: number;
    misplaced: number;
  }[];
  pendingArchive: number;
}

export const FileLifecyclePanel: React.FC<{ data: FileLifecycleData }> = ({ data }) => {
  const getStatusIcon = (misplaced: number) => {
    if (misplaced === 0) return <CheckCircle className="text-green-500" />;
    if (misplaced < 3) return <AlertCircle className="text-yellow-500" />;
    return <AlertCircle className="text-red-500" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">File Lifecycle Status</h2>
      
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span>Organization Score:</span>
          <span className="font-bold">{data.organizationScore}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full ${
              data.organizationScore >= 90 ? 'bg-green-500' :
              data.organizationScore >= 70 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${data.organizationScore}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {data.tiers.map(tier => (
          <div key={tier.tier} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(tier.misplaced)}
              <span className="font-medium">{tier.tier}:</span>
              <span className="text-gray-600">{tier.count} files</span>
            </div>
            {tier.misplaced > 0 && (
              <span className="text-sm text-yellow-600">
                {tier.misplaced} misplaced
              </span>
            )}
          </div>
        ))}
      </div>

      {data.pendingArchive > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
          <div className="flex items-center gap-2">
            <Clock className="text-yellow-600" size={16} />
            <span className="text-sm">
              {data.pendingArchive} files ready for archive
            </span>
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button className="btn-primary">Organize Misplaced Files</button>
        <button className="btn-secondary">View Details</button>
      </div>
    </div>
  );
};
```

---

### 5.4 Project Structure

**Recommended Directory Structure:**

```
orchestrator-dashboard/
├── package.json
├── tsconfig.json
├── vite.config.ts              # Build config (Vite for fast dev)
├── src/
│   ├── main.tsx               # Entry point
│   ├── App.tsx                # Main app component
│   ├── components/
│   │   ├── SystemHealthCard.tsx
│   │   ├── FileLifecyclePanel.tsx
│   │   ├── ActiveSkillsPanel.tsx
│   │   ├── HookExecutionLog.tsx
│   │   ├── PerformanceMetrics.tsx
│   │   └── LayerToggle.tsx
│   ├── lib/
│   │   ├── OrchestratorDataLoader.ts
│   │   ├── OrchestratorWatcher.ts
│   │   └── types.ts
│   ├── hooks/
│   │   ├── useFileManifest.ts
│   │   ├── useSkillRules.ts
│   │   ├── useHookLogs.ts
│   │   └── useSystemHealth.ts
│   └── styles/
│       └── globals.css
├── server/                    # Optional: For WebSocket server
│   └── index.ts
└── public/
    └── index.html
```

---

## 6. Implementation Plan

### Phase 1: Static Prototype (Week 1-2) - 8-12 hours

**Goal:** Validate design and information architecture

**Tasks:**
1. Create static HTML dashboard with sample data
2. Implement all UI components (no real data)
3. Design color scheme and visual hierarchy
4. Test progressive disclosure patterns
5. Gather feedback from key stakeholders

**Deliverables:**
- [ ] Static HTML prototype (`orchestrator-dashboard.html`)
- [ ] Design mockups (Figma or similar)
- [ ] Component specification document
- [ ] User feedback summary

**Tools:**
- Plain HTML/CSS/JavaScript (no build process)
- Inline sample data matching manifest schemas
- Tailwind CSS CDN for styling

---

### Phase 2: Data Integration (Week 3) - 6-8 hours

**Goal:** Connect dashboard to real Orchestrator data

**Tasks:**
1. Implement `OrchestratorDataLoader`
2. Read `.file-manifest.json`, `skill-rules.json`, etc.
3. Replace static data with live data in components
4. Add layer switching (global vs. project)
5. Test with real Orchestrator projects

**Deliverables:**
- [ ] `OrchestratorDataLoader.ts` implemented
- [ ] Dashboard reads live data from filesystem
- [ ] Layer switching functional
- [ ] Integration tests passing

---

### Phase 3: Real-Time Updates (Week 4) - 6-8 hours

**Goal:** Add file watchers for live updates

**Tasks:**
1. Implement `OrchestratorWatcher` with chokidar
2. Update dashboard components on file changes
3. Add smooth animations for state transitions
4. Optimize performance (debouncing, caching)
5. Test update latency

**Deliverables:**
- [ ] File watchers implemented
- [ ] Dashboard updates in <1 second
- [ ] Smooth animations
- [ ] Performance benchmarks met

---

### Phase 4: Hook Logging Enhancement (Week 5) - 8-10 hours

**Goal:** Implement structured hook logging

**Tasks:**
1. Enhance hooks to write structured logs
2. Create `.claude/logs/hooks/` directory
3. Implement log rotation (keep last 30 days)
4. Add hook execution time tracking
5. Update dashboard to read hook logs

**Deliverables:**
- [ ] Hooks write JSON logs
- [ ] Log directory structure created
- [ ] Dashboard displays hook execution history
- [ ] Log rotation functional

---

### Phase 5: Polish & Production (Week 6) - 6-8 hours

**Goal:** Production-ready dashboard

**Tasks:**
1. Error handling and edge cases
2. Loading states and skeleton screens
3. Accessibility improvements (WCAG AA)
4. Documentation and setup guide
5. Performance optimization

**Deliverables:**
- [ ] Comprehensive error handling
- [ ] WCAG AA compliant
- [ ] Setup documentation complete
- [ ] Ready for production use

---

**Total Estimated Effort:** 34-46 hours (5-6 weeks at ~8 hours/week)

---

## 7. Success Metrics

### 7.1 Functional Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Dashboard load time | <2 seconds | Performance.now() on initial load |
| Data refresh latency | <1 second | File change → UI update time |
| Component render time | <100ms | React DevTools Profiler |
| Real-time update accuracy | 100% | All file changes reflected in dashboard |

### 7.2 User Experience Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Time to identify system health | <5 seconds | User testing (time from open to answer) |
| Actionable insights per view | ≥3 | Count of "quick action" buttons clicked |
| Cognitive load (SUS score) | ≥80 | System Usability Scale questionnaire |
| User preference vs. CLI | ≥70% prefer dashboard | Survey after 2 weeks usage |

---

## 8. Risk Management

### 8.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **File watcher performance** | Medium | Medium | Debounce updates, limit file watch scope |
| **Data schema changes** | Low | High | Validate schemas on load, graceful degradation |
| **Browser compatibility** | Low | Medium | Target modern browsers only (last 2 versions) |
| **Large project performance** | Medium | Medium | Implement pagination and lazy loading |

### 8.2 User Experience Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Information overload** | High | Medium | Progressive disclosure, collapsible panels |
| **Unclear metrics** | Medium | High | Tooltips, help text, contextual guidance |
| **Stale data confusion** | Low | High | Clear "last updated" timestamps, loading indicators |

---

## 9. Future Enhancements (Post v1.0)

### 9.1 Planned Features (v1.1)

- **Interactive Actions:** Organize files, archive, cleanup directly from dashboard
- **Notifications:** Desktop notifications for critical events (hook failures, etc.)
- **Filtering & Search:** Search files, filter skills, advanced hook log filtering
- **Custom Dashboards:** User-defined widgets and layout
- **Dark Mode:** Theme toggle for dark mode

### 9.2 Considered Features (Future)

- **Historical Deep Dive:** View Orchestrator state at any point in time
- **Comparison View:** Compare two projects side-by-side
- **Team Collaboration:** Share dashboard views with team
- **Mobile App:** Native mobile app for on-the-go monitoring
- **AI-Powered Insights:** Claude suggests optimizations based on trends

---

## 10. Appendices

### A. UI Design Principles

Following design principles from leading dashboard systems:

1. **Clarity over Cleverness:** Information should be immediately understandable
2. **Actionable over Informative:** Every metric should suggest an action
3. **Progressive over Comprehensive:** Show summary first, details on demand
4. **Consistent over Creative:** Use established patterns and conventions
5. **Fast over Fancy:** Performance trumps visual effects

**Color Palette (Recommended):**
- **Primary (Blue):** `#3B82F6` - Global layer, primary actions
- **Secondary (Green):** `#10B981` - Project layer, success states
- **Warning (Yellow):** `#F59E0B` - Warnings, pending actions
- **Error (Red):** `#EF4444` - Errors, critical issues
- **Neutral (Gray):** `#6B7280` - Text, borders, backgrounds

### B. Component Library Options

**Option 1: Custom Components (Recommended)**
- Pros: Full control, lightweight, tailored to needs
- Cons: More development time
- Verdict: Best for Phase 1 prototype

**Option 2: Material-UI / Ant Design**
- Pros: Rich component library, battle-tested
- Cons: Heavy bundle size, opinionated styling
- Verdict: Consider for Phase 2 if development velocity is priority

**Option 3: shadcn/ui**
- Pros: Copy-paste components, Tailwind-based, modern
- Cons: Manual component management
- Verdict: Good middle ground for Phase 2

### C. Sample Data Structures

**System Health:**
```json
{
  "status": "operational",
  "lastUpdate": "2025-11-11T14:32:05Z",
  "issues": {
    "misplacedFiles": 4,
    "expiringSoon": 3,
    "failedHooks": 0
  }
}
```

**File Lifecycle Summary:**
```json
{
  "organizationScore": 92,
  "tiers": [
    { "tier": "CRITICAL", "count": 5, "misplaced": 0 },
    { "tier": "PERMANENT", "count": 28, "misplaced": 1 },
    { "tier": "EPHEMERAL", "count": 7, "misplaced": 2 },
    { "tier": "ARCHIVED", "count": 2, "misplaced": 0 }
  ],
  "pendingArchive": 3
}
```

**Hook Log Entry:**
```json
{
  "timestamp": "2025-11-11T14:32:05Z",
  "hookName": "PostToolUse",
  "status": "PASSED",
  "executionTime": 123,
  "message": "All validations passed",
  "details": {
    "filesModified": ["CLAUDE.md"],
    "validations": [
      { "name": "Markdown Syntax", "status": "passed" },
      { "name": "Link Checker", "status": "passed" }
    ]
  }
}
```

---

## Document Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-11 | Initial exploration PRD | Claude Code |

---

**END OF DOCUMENT**

