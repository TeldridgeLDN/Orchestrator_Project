"""
Workflow Progress Display

Provides real-time visual progress bars and updates using rich.
"""

from typing import Optional, Dict, Any
from rich.console import Console
from rich.progress import (
    Progress,
    SpinnerColumn,
    TextColumn,
    BarColumn,
    TaskProgressColumn,
    TimeRemainingColumn,
    TimeElapsedColumn,
    MofNCompleteColumn
)
from rich.table import Table
from rich.panel import Panel
from rich.layout import Layout
from rich.live import Live
from rich.text import Text
from rich import box

from .tracker import WorkflowTracker, WorkflowStep, WorkflowState, Milestone, MilestoneType


class WorkflowDisplay:
    """
    Terminal UI for workflow progress visualization.
    
    Features:
    - Real-time progress bars
    - Live updates
    - Multi-level progress display
    - Milestone notifications
    - Status indicators
    """
    
    def __init__(self, console: Optional[Console] = None):
        """
        Initialize display.
        
        Args:
            console: Rich console instance (creates new if not provided)
        """
        self.console = console or Console()
        self.progress = Progress(
            SpinnerColumn(),
            TextColumn("[bold blue]{task.description}", justify="right"),
            BarColumn(bar_width=None),
            TaskProgressColumn(),
            "•",
            TimeElapsedColumn(),
            "•",
            TimeRemainingColumn(),
            console=self.console
        )
        self.task_ids: Dict[str, Any] = {}  # step_id -> rich task_id
        self.live: Optional[Live] = None
    
    def start_live(self):
        """Start live display mode."""
        if not self.live:
            self.live = Live(
                self.progress,
                console=self.console,
                refresh_per_second=4
            )
            self.live.start()
    
    def stop_live(self):
        """Stop live display mode."""
        if self.live:
            self.live.stop()
            self.live = None
    
    def add_step(
        self,
        step_id: str,
        title: str,
        total: Optional[float] = None,
        visible: bool = True
    ):
        """
        Add a step to the display.
        
        Args:
            step_id: Unique step identifier
            title: Step description
            total: Total units (for determinate progress)
            visible: Whether to show immediately
        """
        rich_task_id = self.progress.add_task(
            title,
            total=total or 100.0,
            visible=visible
        )
        self.task_ids[step_id] = rich_task_id
    
    def update_step(
        self,
        step_id: str,
        completed: Optional[float] = None,
        advance: Optional[float] = None,
        description: Optional[str] = None,
        visible: Optional[bool] = None
    ):
        """
        Update step progress.
        
        Args:
            step_id: Step to update
            completed: Total completed units
            advance: Units to advance by
            description: New description
            visible: Show/hide step
        """
        if step_id not in self.task_ids:
            return
        
        kwargs = {}
        if completed is not None:
            kwargs['completed'] = completed
        if advance is not None:
            kwargs['advance'] = advance
        if description is not None:
            kwargs['description'] = description
        if visible is not None:
            kwargs['visible'] = visible
        
        self.progress.update(self.task_ids[step_id], **kwargs)
    
    def complete_step(self, step_id: str):
        """Mark step as complete."""
        if step_id in self.task_ids:
            self.progress.update(
                self.task_ids[step_id],
                completed=100.0,
                description=f"[green]✓[/green] {self.progress.tasks[self.task_ids[step_id]].description}"
            )
    
    def fail_step(self, step_id: str, error: Optional[str] = None):
        """Mark step as failed."""
        if step_id in self.task_ids:
            desc = self.progress.tasks[self.task_ids[step_id]].description
            if error:
                desc = f"[red]✗[/red] {desc}: {error}"
            else:
                desc = f"[red]✗[/red] {desc}"
            
            self.progress.update(
                self.task_ids[step_id],
                description=desc
            )
    
    def print_milestone(self, milestone: Milestone):
        """
        Display a milestone notification.
        
        Args:
            milestone: Milestone to display
        """
        icon_map = {
            MilestoneType.STARTED: "🚀",
            MilestoneType.STEP_COMPLETE: "✅",
            MilestoneType.HALFWAY: "⏱️",
            MilestoneType.ALMOST_DONE: "🎯",
            MilestoneType.COMPLETED: "🎉",
            MilestoneType.FAILED: "❌",
            MilestoneType.BOTTLENECK: "⚠️"
        }
        
        icon = icon_map.get(milestone.type, "📌")
        
        color_map = {
            MilestoneType.STARTED: "blue",
            MilestoneType.STEP_COMPLETE: "green",
            MilestoneType.HALFWAY: "yellow",
            MilestoneType.ALMOST_DONE: "cyan",
            MilestoneType.COMPLETED: "green bold",
            MilestoneType.FAILED: "red bold",
            MilestoneType.BOTTLENECK: "yellow"
        }
        
        color = color_map.get(milestone.type, "white")
        
        self.console.print(
            f"{icon} [{color}]{milestone.message}[/{color}]"
        )
    
    def show_summary(self, tracker: WorkflowTracker):
        """
        Display workflow summary.
        
        Args:
            tracker: Workflow tracker instance
        """
        # Create summary table
        table = Table(
            title=f"Workflow {tracker.workflow_id} Summary",
            box=box.ROUNDED,
            show_header=True,
            header_style="bold cyan"
        )
        
        table.add_column("Step", style="bold")
        table.add_column("Status", justify="center")
        table.add_column("Duration", justify="right")
        table.add_column("Progress", justify="right")
        
        # Add rows for each step
        for step_id in tracker.step_order:
            step = tracker.steps[step_id]
            
            # Skip substeps for top-level summary
            if step.parent_id:
                continue
            
            # Status icon
            status_icons = {
                WorkflowState.COMPLETED: "[green]✓[/green]",
                WorkflowState.FAILED: "[red]✗[/red]",
                WorkflowState.IN_PROGRESS: "[yellow]⋯[/yellow]",
                WorkflowState.PENDING: "[dim]○[/dim]",
                WorkflowState.PAUSED: "[yellow]⏸[/yellow]",
                WorkflowState.CANCELLED: "[dim]✗[/dim]"
            }
            
            status = status_icons.get(step.state, "?")
            
            # Duration
            if step.duration:
                duration = f"{step.duration:.2f}s"
            elif step.estimated_duration:
                duration = f"~{step.estimated_duration:.2f}s"
            else:
                duration = "-"
            
            # Progress
            progress = f"{step.progress * 100:.0f}%"
            
            table.add_row(step.title, status, duration, progress)
        
        # Overall stats
        overall_progress = tracker.get_overall_progress()
        state_colors = {
            WorkflowState.COMPLETED: "green",
            WorkflowState.FAILED: "red",
            WorkflowState.IN_PROGRESS: "yellow",
            WorkflowState.PENDING: "blue"
        }
        
        state_color = state_colors.get(tracker.state, "white")
        
        stats = Table.grid(padding=(0, 2))
        stats.add_column(style="bold")
        stats.add_column()
        
        stats.add_row("Status:", f"[{state_color}]{tracker.state.value}[/{state_color}]")
        stats.add_row("Progress:", f"{overall_progress * 100:.1f}%")
        
        if tracker.duration:
            stats.add_row("Duration:", f"{tracker.duration:.2f}s")
        
        stats.add_row("Steps:", f"{len(tracker.steps)}")
        stats.add_row(
            "Completed:",
            f"{sum(1 for s in tracker.steps.values() if s.is_complete())}/{len(tracker.steps)}"
        )
        
        # Create layout
        layout = Layout()
        layout.split_column(
            Layout(Panel(stats, title="📊 Overall Stats", border_style="cyan")),
            Layout(Panel(table, border_style="blue"))
        )
        
        self.console.print(layout)
    
    def show_detailed_progress(self, tracker: WorkflowTracker):
        """
        Show detailed progress with substeps.
        
        Args:
            tracker: Workflow tracker instance
        """
        for step_id in tracker.step_order:
            step = tracker.steps[step_id]
            
            # Skip substeps (shown under parent)
            if step.parent_id:
                continue
            
            # Show parent step
            self._print_step(step, level=0)
            
            # Show substeps
            substeps = tracker.get_substeps(step_id)
            for substep in substeps:
                self._print_step(substep, level=1)
    
    def _print_step(self, step: WorkflowStep, level: int = 0):
        """Print a single step with indentation."""
        indent = "  " * level
        
        # Status icon
        status_icons = {
            WorkflowState.COMPLETED: "[green]✓[/green]",
            WorkflowState.FAILED: "[red]✗[/red]",
            WorkflowState.IN_PROGRESS: "[yellow]⋯[/yellow]",
            WorkflowState.PENDING: "[dim]○[/dim]",
            WorkflowState.PAUSED: "[yellow]⏸[/yellow]"
        }
        
        icon = status_icons.get(step.state, "?")
        
        # Progress bar
        bar_width = 20
        filled = int(step.progress * bar_width)
        bar = "█" * filled + "░" * (bar_width - filled)
        
        # Duration
        duration_str = ""
        if step.duration:
            duration_str = f" ({step.duration:.2f}s)"
        
        self.console.print(
            f"{indent}{icon} {step.title} [{bar}] {step.progress * 100:.0f}%{duration_str}"
        )


class SimpleProgressDisplay:
    """
    Simplified progress display without rich.
    
    Fallback for environments without rich support.
    """
    
    def __init__(self):
        """Initialize simple display."""
        self.steps: Dict[str, str] = {}
    
    def add_step(self, step_id: str, title: str, **kwargs):
        """Add a step."""
        self.steps[step_id] = title
        print(f"[ ] {title}")
    
    def update_step(self, step_id: str, **kwargs):
        """Update step (no-op for simple display)."""
        pass
    
    def complete_step(self, step_id: str):
        """Mark step complete."""
        if step_id in self.steps:
            print(f"[✓] {self.steps[step_id]}")
    
    def fail_step(self, step_id: str, error: Optional[str] = None):
        """Mark step failed."""
        if step_id in self.steps:
            msg = f"[✗] {self.steps[step_id]}"
            if error:
                msg += f": {error}"
            print(msg)
    
    def print_milestone(self, milestone: Milestone):
        """Print milestone."""
        print(f"→ {milestone.message}")
    
    def show_summary(self, tracker: WorkflowTracker):
        """Show summary."""
        print("\n" + "="*60)
        print(f"Workflow Summary: {tracker.workflow_id}")
        print("="*60)
        
        for step_id in tracker.step_order:
            step = tracker.steps[step_id]
            if step.parent_id:
                continue
            
            status = "✓" if step.is_complete() else "✗" if step.state == WorkflowState.FAILED else "..."
            print(f"[{status}] {step.title} - {step.progress * 100:.0f}%")
        
        print("="*60)
        print(f"Overall: {tracker.get_overall_progress() * 100:.1f}%")
        if tracker.duration:
            print(f"Duration: {tracker.duration:.2f}s")
        print("="*60 + "\n")

