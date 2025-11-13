# Workflow Progress Tracker

A comprehensive Python library for tracking workflow progress with real-time visualization, time estimation, bottleneck detection, and history logging.

## Features

✅ **Real-time Progress Tracking**
- Multi-level progress (parent/substeps)
- State management (pending, in-progress, completed, failed, paused)
- Live progress bars and updates

✅ **Time Estimation**
- Historical data analysis
- Adaptive ETA calculation
- Confidence scoring
- Bottleneck detection (>20% deviation)

✅ **Visual Display**
- Rich terminal UI with progress bars
- Color-coded status indicators
- Summary tables and detailed views
- Milestone notifications

✅ **History & Analytics**
- JSON-based persistence
- Duration tracking
- Success rate analysis
- Query and statistics

✅ **Easy Integration**
- Callback system for events
- Workflow and step APIs
- JSON export/import

## Installation

```bash
pip install rich  # For terminal UI (optional)
```

## Quick Start

```python
from workflow_tracker import WorkflowTracker, WorkflowDisplay, WorkflowHistory

# Create tracker
tracker = WorkflowTracker(workflow_id="my-workflow")

# Add steps
tracker.add_step("step1", "Initialize", estimated_duration=10.0)
tracker.add_step("step2", "Process", estimated_duration=30.0)
tracker.add_step("step3", "Finalize", estimated_duration=5.0)

# Create display
display = WorkflowDisplay()
display.start_live()

# Add steps to display
for step_id in tracker.step_order:
    step = tracker.get_step(step_id)
    display.add_step(step_id, step.title)

# Start workflow
tracker.start_workflow()

# Execute steps
for step_id in tracker.step_order:
    tracker.start_step(step_id)
    display.update_step(step_id, completed=0)
    
    # Do work...
    import time
    time.sleep(2)
    
    tracker.complete_step(step_id)
    display.complete_step(step_id)

# Complete workflow
tracker.complete_workflow()
display.stop_live()

# Show summary
display.show_summary(tracker)

# Log to history
history = WorkflowHistory()
history.log_workflow(tracker, workflow_type="my-type")
```

## Core Components

### WorkflowTracker

Main engine for workflow management:

```python
tracker = WorkflowTracker(workflow_id="test")

# Add steps
tracker.add_step("init", "Initialize", estimated_duration=10.0)
tracker.add_step("init.1", "Setup DB", parent_id="init")  # Substep

# Control workflow
tracker.start_workflow()
tracker.start_step("init")
tracker.update_step_progress("init", 0.5)  # 50% complete
tracker.complete_step("init")
tracker.complete_workflow()

# Get progress
progress = tracker.get_overall_progress()  # 0.0 to 1.0
```

### WorkflowDisplay

Rich terminal UI:

```python
from workflow_tracker import WorkflowDisplay

display = WorkflowDisplay()
display.start_live()  # Start live updates

# Add and update steps
display.add_step("step1", "Processing...")
display.update_step("step1", advance=10)
display.complete_step("step1")

# Show summary
display.show_summary(tracker)
display.stop_live()
```

### WorkflowHistory

Persistent history storage:

```python
from workflow_tracker import WorkflowHistory

history = WorkflowHistory()

# Log workflow
history.log_workflow(tracker, workflow_type="data-processing")

# Query history
workflows = history.get_workflow_history(workflow_type="data-processing")
avg_duration = history.get_average_duration("data-processing")

# Get statistics
stats = history.get_stats("data-processing")
# {
#   'total_workflows': 10,
#   'completed': 8,
#   'failed': 2,
#   'average_duration': 45.2,
#   'success_rate': 0.8
# }
```

### TimeEstimator

Intelligent time estimation:

```python
from workflow_tracker import TimeEstimator, WorkflowHistory

history = WorkflowHistory()
estimator = TimeEstimator(history)

# Estimate workflow
estimate = estimator.estimate_workflow(tracker, "my-workflow-type")
print(f"ETA: {estimate.eta}")
print(f"Remaining: {estimate.estimated_remaining:.1f}s")
print(f"Confidence: {estimate.confidence:.0%}")

# Detect bottlenecks
bottlenecks = estimator.get_bottlenecks(tracker, threshold=1.2)
for bn in bottlenecks:
    print(f"⚠️ {bn['step_title']} is {bn['deviation_percent']:.0f}% slower than expected")
```

## Advanced Usage

### Callbacks

Register callbacks for workflow events:

```python
def on_progress(event_type, data):
    if event_type == 'step_completed':
        print(f"✓ {data.title} completed")
    elif event_type == 'milestone':
        print(f"🎯 {data.message}")

tracker.add_callback(on_progress)
```

### Substeps

Create hierarchical progress tracking:

```python
# Add parent
tracker.add_step("deploy", "Deploy Application")

# Add substeps
tracker.add_step("deploy.1", "Build", parent_id="deploy")
tracker.add_step("deploy.2", "Test", parent_id="deploy")
tracker.add_step("deploy.3", "Upload", parent_id="deploy")

# Get substeps
substeps = tracker.get_substeps("deploy")
```

### Export/Import

Save and load workflow state:

```python
# Export
data = tracker.to_dict()

# Save to file
from pathlib import Path
tracker.save(Path("workflow-state.json"))
```

## State Machine

Workflow and step states:

```
PENDING → IN_PROGRESS → COMPLETED
                     ↓
                   FAILED
                     ↓
                  PAUSED → (resume) → IN_PROGRESS
                     ↓
                CANCELLED
```

## Milestone Events

Automatic milestone notifications:

- 🚀 `STARTED` - Workflow begins
- ✅ `STEP_COMPLETE` - Step finishes
- ⏱️ `HALFWAY` - 50% progress
- 🎯 `ALMOST_DONE` - 85%+ progress
- 🎉 `COMPLETED` - Workflow complete
- ❌ `FAILED` - Workflow/step failed
- ⚠️ `BOTTLENECK` - Step taking too long

## Performance

- **Update Overhead:** <50ms per update
- **Display Refresh:** 4 FPS (live mode)
- **History Storage:** JSON (< 1MB for 1000 workflows)
- **Estimation Accuracy:** Within 20% (with sufficient history)

## Testing

Run the test suite:

```bash
cd lib/workflow-tracker
pytest tests/ -v
```

## Architecture

```
workflow-tracker/
├── tracker.py       # Core engine (470 lines)
├── display.py       # Terminal UI (380 lines)
├── history.py       # History storage (320 lines)
├── estimator.py     # Time estimation (280 lines)
├── __init__.py      # Package exports
├── README.md        # Documentation
└── tests/           # Test suite
    ├── test_tracker.py
    ├── test_display.py
    ├── test_history.py
    └── test_estimator.py
```

## Dependencies

- **Python 3.10+** - Required
- **rich 13.0+** - Optional (for terminal UI)

## License

MIT License - Part of diet103 Sprint 4

## Contributing

This is part of the Orchestrator Project's diet103 integration. See Sprint 4 documentation for details.

---

Built with ❤️ for the Orchestrator Project

