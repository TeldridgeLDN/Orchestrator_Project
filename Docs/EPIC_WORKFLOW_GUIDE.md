# Epic Workflow Guide for Orchestrator Project

## Overview

This guide describes the epic-based workflow for the Orchestrator project. Epics provide a logical way to organize and track tasks grouped by functionality and project areas, enabling better project visibility and progress tracking.

## What Are Epics?

Epics are high-level organizational units that group related tasks together. Unlike TaskMaster tags (which represent separate contexts/branches), epics are defined by configuration and visualized through the Epic Dashboard while maintaining all tasks in a single unified context.

## Epic Structure

The Orchestrator project is organized into the following epics:

### 1. **Orchestrator Core** 
- **ID**: `orchestrator-core`
- **Tasks**: 21-44
- **Color**: Blue (#3498db)
- **Description**: Core orchestration system implementation including project management, skill systems, and foundational architecture
- **Priority**: High

### 2. **Scenario & Workflow**
- **ID**: `scenario-workflow`
- **Tasks**: 45-81
- **Color**: Green (#2ecc71)
- **Description**: Scenario and workflow management system including validation, execution, and context management
- **Priority**: High

### 3. **Orchestrator Improvements**
- **ID**: `orchestrator-improvements`
- **Tasks**: 82-90
- **Color**: Orange (#e67e22)
- **Description**: Enhancements and optimizations for the orchestrator including performance, caching, and feature improvements
- **Priority**: Medium

### 4. **Dashboard & UI**
- **ID**: `dashboard-ui`
- **Tasks**: 91-110
- **Color**: Purple (#9b59b6)
- **Description**: User interface and dashboard components for visual tracking and interaction
- **Priority**: Medium

### 5. **Documentation**
- **ID**: `documentation`
- **Tasks**: Various
- **Color**: Gray (#95a5a6)
- **Description**: Documentation, guides, and examples
- **Priority**: Low

### 6. **Testing & Validation**
- **ID**: `testing-validation`
- **Tasks**: Various
- **Color**: Red (#e74c3c)
- **Description**: Test suites, validation, and quality assurance
- **Priority**: High

## Using the Epic Dashboard

### Accessing the Dashboard

1. Navigate to the `dashboard/` directory in the project root
2. Open `epic-dashboard.html` in your web browser
3. The dashboard will automatically load and display epic progress

### Dashboard Features

#### Summary Statistics
- **Total Tasks**: Overall task count across all epics
- **Completed**: Number of tasks marked as 'done'
- **In Progress**: Number of tasks currently being worked on
- **Completion Rate**: Overall project completion percentage

#### Epic Cards
Each epic is displayed as a card showing:
- Epic name and description
- Total tasks in the epic
- Completed task count
- Progress bar with completion percentage
- Task range identifier (e.g., "Tasks 21-44")

#### Interactive Features
- **Refresh Button**: Click to reload the latest task data
- **Hover Effects**: Hover over epic cards for visual feedback
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Understanding Epic Progress

- **Green progress bar**: Epic is on track
- **High completion percentage**: Most tasks completed
- **Low completion percentage**: Epic needs attention

## Epic Configuration

Epics are defined in `.taskmaster/epics.json`:

```json
{
  "version": "1.0.0",
  "epics": [
    {
      "id": "orchestrator-core",
      "name": "Orchestrator Core",
      "description": "Core orchestration system implementation",
      "color": "#3498db",
      "taskRange": [21, 44],
      "tags": ["core", "orchestration"],
      "priority": "high"
    }
  ]
}
```

### Epic Properties

- **id**: Unique identifier (kebab-case)
- **name**: Display name
- **description**: Brief explanation of epic scope
- **color**: Hex color code for visual identification
- **taskRange**: [start, end] task ID range
- **taskIds**: Alternative to taskRange for specific tasks
- **tags**: Keywords for categorization
- **priority**: high | medium | low

## Workflow Guidelines

### 1. Task Creation

When creating new tasks:
- Assign task IDs within appropriate epic ranges
- Follow the epic's functional scope
- Tasks 21-44: Core orchestration features
- Tasks 45-81: Scenario/workflow features
- Tasks 82-90: Improvement initiatives
- Tasks 91+: Dashboard/UI features

### 2. Task Status Management

Use consistent status values:
- **pending**: Ready to be worked on
- **in-progress**: Currently being implemented
- **done**: Completed and verified
- **deferred**: Postponed to later
- **cancelled**: No longer needed

### 3. Epic Completion

An epic is considered complete when:
1. All tasks in the epic's range are marked 'done'
2. Associated tests are passing
3. Documentation is updated
4. Code is reviewed and merged

### 4. Progress Tracking

Monitor epic progress by:
- Checking the Epic Dashboard regularly
- Reviewing completion percentages
- Identifying blocked or delayed tasks
- Adjusting priorities as needed

## Best Practices

### Task Organization

1. **Keep epics focused**: Each epic should have a clear, specific purpose
2. **Avoid cross-epic dependencies**: Minimize dependencies between epic ranges
3. **Document epic decisions**: Update this guide when epic structure changes
4. **Regular reviews**: Review epic progress during project milestones

### Dashboard Usage

1. **Check daily**: View dashboard at start of each work session
2. **Identify bottlenecks**: Look for epics with low completion rates
3. **Celebrate progress**: Track completion milestones
4. **Share with team**: Use dashboard in standup meetings

### Adding New Epics

To add a new epic:

1. Edit `.taskmaster/epics.json`:
```json
{
  "id": "new-epic-id",
  "name": "New Epic Name",
  "description": "Epic description",
  "color": "#hexcolor",
  "taskRange": [start, end],
  "tags": ["tag1", "tag2"],
  "priority": "medium"
}
```

2. Reserve task ID range for the epic
3. Update this documentation
4. Refresh the Epic Dashboard

## FAQ

### Q: Can a task belong to multiple epics?
**A**: By default, tasks belong to one epic based on their ID range. For cross-cutting concerns, document the relationship in task details.

### Q: How do I change a task's epic?
**A**: Use TaskMaster's `move` command to change the task ID to fall within a different epic's range.

### Q: Why not use TaskMaster tags for epics?
**A**: TaskMaster tags represent separate contexts (like git branches). Epics are organizational units within a single context, allowing better project-wide visibility.

### Q: Can I create temporary epics?
**A**: Yes! Add an epic to `epics.json` with specific `taskIds` rather than a `taskRange`. Remove the epic configuration when no longer needed.

### Q: How do I exclude tasks from epic tracking?
**A**: Tasks outside all epic ranges are automatically excluded from epic-specific tracking but still appear in overall statistics.

## Technical Details

### Data Flow

1. Epic Dashboard loads `epics.json` for configuration
2. Dashboard fetches `.taskmaster/tasks/tasks.json`
3. Tasks are filtered by epic's `taskRange` or `taskIds`
4. Statistics are calculated per epic
5. Dashboard renders cards and progress bars

### Dashboard Architecture

- **HTML**: Structure and layout (`epic-dashboard.html`)
- **CSS**: Embedded styles with responsive design
- **JavaScript**: Data loading and rendering logic
- **Data Source**: TaskMaster's tasks.json file

### Performance

- Dashboard loads instantly (<100ms typically)
- No backend required (static HTML)
- Automatic caching by browser
- Manual refresh available

## Troubleshooting

### Dashboard Not Loading

1. Check that `.taskmaster/epics.json` exists
2. Verify `.taskmaster/tasks/tasks.json` is accessible
3. Open browser console (F12) for error messages
4. Ensure you're opening from a web server or `file://` works

### Incorrect Task Counts

1. Refresh the dashboard
2. Verify task IDs fall within epic ranges
3. Check for duplicate task IDs
4. Validate tasks.json format

### Styling Issues

1. Clear browser cache
2. Check browser compatibility (modern browsers recommended)
3. Test on different devices/screen sizes

## Future Enhancements

Planned improvements:
- Click epic cards to see task details
- Filter tasks by status within epics
- Export epic reports
- Epic burndown charts
- Task search functionality
- Epic dependencies visualization

## Conclusion

The Epic Dashboard provides a powerful way to visualize and track progress across the Orchestrator project. By organizing tasks into logical epics, the team can better understand project structure, identify priorities, and celebrate milestones.

For questions or suggestions, please update this guide or discuss in project meetings.

---

**Last Updated**: November 12, 2025  
**Version**: 1.0.0  
**Maintained By**: Orchestrator Project Team

