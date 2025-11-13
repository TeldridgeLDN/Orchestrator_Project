# Orchestrator Dashboards

This directory contains visual dashboards for tracking and managing the Orchestrator project.

## Available Dashboards

### 1. Epic Dashboard (`epic-dashboard.html`)

Visual tracking of project progress organized by epics (functional groupings).

**Features:**
- Summary statistics (total, completed, in-progress tasks)
- Epic cards with progress visualization
- Responsive design
- Real-time data from TaskMaster

**Usage:**
```bash
# Open in browser
open epic-dashboard.html

# Or start a local server
python -m http.server 8000
# Then visit: http://localhost:8000/epic-dashboard.html
```

### 2. Original Dashboard (`index.html`)

React-based dashboard showing active skills, project metadata, and health metrics.

**Features:**
- **Health Metrics Panel** - Visual health score display with component breakdown
- Active skills panel
- Project statistics
- File manifest data
- Health recommendations (when score < 85)
- Built with React + Vite + Tailwind

**Usage:**
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

#### Health Metrics Display

The dashboard now includes a comprehensive health metrics panel that shows:

**Overall Health Score**
- Large, color-coded score display (0-100)
- Status indicator: 🟢 Healthy (85-100), 🟡 Needs Attention (70-84), 🔴 Critical (0-69)
- Last health check timestamp

**Component Breakdown**
- Structure Validity (40% weight)
- Hook Status (30% weight)
- Skill Activity (20% weight)
- Configuration Completeness (10% weight)
- Visual progress bars for each component
- Individual scores and percentages

**Recommendations Section**
- Displays when health score < 85
- Shows top 3 actionable recommendations
- Severity indicators (Critical, Medium, Low)
- Estimated impact on health score
- Quick-fix suggestions

**Sample Dashboard View:**
```
┌─────────────────────────────────────┐
│   PROJECT HEALTH                    │
│   87/100 🟢 Healthy                │
│   Last checked: 2 minutes ago       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   COMPONENT BREAKDOWN               │
│   ████████████████░░ Structure 90%  │
│   ████████████████████ Hooks 100%   │
│   ████████████░░░░░░ Skills 60%     │
│   ████████████████████ Config 100%  │
└─────────────────────────────────────┘
```

## Epic Dashboard Details

### Configuration

Epics are configured in `../.taskmaster/epics.json`:

```json
{
  "version": "1.0.0",
  "epics": [
    {
      "id": "orchestrator-core",
      "name": "Orchestrator Core",
      "description": "Core orchestration system",
      "color": "#3498db",
      "taskRange": [21, 44]
    }
  ]
}
```

### Data Source

The dashboard reads from:
- `../.taskmaster/epics.json` - Epic configuration
- `../.taskmaster/tasks/tasks.json` - Task data

### Browser Compatibility

- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported  
- Safari: ✅ Fully supported
- Mobile browsers: ✅ Responsive design

## Development

### Adding a New Epic

1. Edit `../.taskmaster/epics.json`
2. Add epic configuration with unique ID
3. Refresh the Epic Dashboard
4. Update `.../Docs/EPIC_WORKFLOW_GUIDE.md`

### Customizing Styles

Styles are embedded in `epic-dashboard.html` for portability. To customize:

1. Edit the `<style>` section in `epic-dashboard.html`
2. Modify colors, spacing, or layout
3. Refresh browser to see changes

### Extending Functionality

The Epic Dashboard uses vanilla JavaScript. To add features:

1. Edit the `<script>` section in `epic-dashboard.html`
2. Add functions or event listeners
3. Test in multiple browsers

## Troubleshooting

### Dashboard Shows "Loading..."

**Causes:**
- Invalid JSON in `epics.json` or `tasks.json`
- File permissions issue
- Browser security blocking local files

**Solutions:**
- Validate JSON syntax
- Use a local web server instead of `file://`
- Check browser console (F12) for errors

### Incorrect Task Counts

**Causes:**
- Stale browser cache
- Tasks outside epic ranges
- Duplicate task IDs

**Solutions:**
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Verify epic `taskRange` configuration
- Run `task-master validate-dependencies`

### Styling Issues

**Causes:**
- Browser compatibility
- Cached CSS

**Solutions:**
- Clear browser cache
- Test in different browser
- Check browser console for CSS errors

## Architecture

```
dashboard/
├── epic-dashboard.html    # Epic tracking dashboard (standalone)
├── index.html             # React dashboard entry point
├── src/                   # React components and logic
│   ├── Dashboard.tsx      # Main dashboard component
│   ├── components/        # UI components
│   ├── lib/               # Data loaders
│   └── types.ts           # TypeScript definitions
├── public/                # Static assets
└── package.json           # NPM dependencies
```

## Performance

### Epic Dashboard
- **Load Time**: <100ms
- **Data Size**: ~50KB (tasks.json)
- **Memory**: <5MB
- **No backend required**

### React Dashboard
- **Dev Server**: ~500ms startup
- **Build Time**: ~5-10s
- **Bundle Size**: ~150KB (gzipped)

## Future Plans

- [ ] Combined dashboard view
- [ ] Real-time task updates via WebSocket
- [ ] Export dashboard as PDF/PNG
- [ ] Task detail modals on click
- [ ] Burndown charts per epic
- [ ] Filterable task lists
- [ ] Epic dependencies graph

## Contributing

To improve the dashboards:

1. Test changes locally
2. Update this README
3. Document new features in `EPIC_WORKFLOW_GUIDE.md`
4. Ensure browser compatibility

## License

Part of the Orchestrator Project.

---

For detailed epic workflow information, see `../Docs/EPIC_WORKFLOW_GUIDE.md`.
