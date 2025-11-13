"""
Workflow Integration

Provides APIs and hooks for integrating progress tracking with external workflows.
"""

from typing import Optional, Callable, Any, Dict
from pathlib import Path
import functools

from .tracker import WorkflowTracker, WorkflowState
from .display import WorkflowDisplay
from .history import WorkflowHistory
from .estimator import TimeEstimator


class WorkflowContext:
    """
    Integrated workflow tracking context.
    
    Combines tracker, display, history, and estimator for seamless integration.
    """
    
    def __init__(
        self,
        workflow_id: str,
        workflow_type: str = "generic",
        enable_display: bool = True,
        enable_history: bool = True,
        history_file: Optional[Path] = None
    ):
        """
        Initialize workflow context.
        
        Args:
            workflow_id: Unique workflow identifier
            workflow_type: Workflow type for history/estimation
            enable_display: Enable visual progress display
            enable_history: Enable history logging
            history_file: Custom history file path
        """
        self.workflow_id = workflow_id
        self.workflow_type = workflow_type
        
        # Core components
        self.tracker = WorkflowTracker(workflow_id)
        
        self.display: Optional[WorkflowDisplay] = None
        if enable_display:
            try:
                self.display = WorkflowDisplay()
            except ImportError:
                print("Warning: rich not installed, display disabled")
        
        self.history: Optional[WorkflowHistory] = None
        self.estimator: Optional[TimeEstimator] = None
        if enable_history:
            self.history = WorkflowHistory(history_file)
            self.estimator = TimeEstimator(self.history)
        
        # Register callbacks
        self.tracker.add_callback(self._on_event)
    
    def __enter__(self):
        """Context manager entry."""
        self.start()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        if exc_type is not None:
            # Workflow failed
            error_msg = f"{exc_type.__name__}: {exc_val}"
            self.fail(error_msg)
        else:
            # Workflow completed
            self.complete()
        
        return False  # Don't suppress exceptions
    
    def start(self):
        """Start the workflow."""
        self.tracker.start_workflow()
        
        if self.display:
            self.display.start_live()
            
            # Add all steps to display
            for step_id in self.tracker.step_order:
                step = self.tracker.get_step(step_id)
                if not step.parent_id:  # Only top-level steps
                    self.display.add_step(step_id, step.title)
    
    def complete(self):
        """Complete the workflow."""
        self.tracker.complete_workflow()
        
        if self.display:
            self.display.stop_live()
            self.display.show_summary(self.tracker)
        
        if self.history:
            self.history.log_workflow(self.tracker, self.workflow_type)
    
    def fail(self, error: str):
        """
        Fail the workflow.
        
        Args:
            error: Error message
        """
        self.tracker.fail_workflow(error)
        
        if self.display:
            self.display.stop_live()
            self.display.show_summary(self.tracker)
        
        if self.history:
            self.history.log_workflow(self.tracker, self.workflow_type)
    
    def add_step(
        self,
        step_id: str,
        title: str,
        description: str = "",
        parent_id: Optional[str] = None
    ):
        """
        Add a workflow step.
        
        Args:
            step_id: Unique step identifier
            title: Step title
            description: Step description
            parent_id: Parent step for substeps
        """
        # Get estimated duration from history
        estimated_duration = None
        if self.estimator:
            avg_duration = self.history.get_average_step_duration(title)
            if avg_duration:
                estimated_duration = avg_duration
        
        step = self.tracker.add_step(
            step_id,
            title,
            description,
            parent_id,
            estimated_duration
        )
        
        # Add to display (only top-level)
        if self.display and not parent_id:
            self.display.add_step(step_id, title)
        
        return step
    
    def start_step(self, step_id: str):
        """Start a step."""
        self.tracker.start_step(step_id)
    
    def complete_step(self, step_id: str):
        """Complete a step."""
        self.tracker.complete_step(step_id)
    
    def fail_step(self, step_id: str, error: Optional[str] = None):
        """
        Fail a step.
        
        Args:
            step_id: Step ID
            error: Error message
        """
        self.tracker.fail_step(step_id, error)
    
    def update_progress(self, step_id: str, progress: float):
        """
        Update step progress.
        
        Args:
            step_id: Step ID
            progress: Progress value (0.0 to 1.0)
        """
        self.tracker.update_step_progress(step_id, progress)
    
    def get_estimate(self):
        """Get workflow time estimate."""
        if self.estimator:
            return self.estimator.estimate_workflow(self.tracker, self.workflow_type)
        return None
    
    def get_bottlenecks(self, threshold: float = 1.2):
        """
        Get current bottlenecks.
        
        Args:
            threshold: Deviation threshold (1.2 = 20% slower)
        
        Returns:
            List of bottleneck info
        """
        if self.estimator:
            return self.estimator.get_bottlenecks(self.tracker, threshold)
        return []
    
    def _on_event(self, event_type: str, data: Any):
        """Handle workflow events."""
        if not self.display:
            return
        
        if event_type == 'step_started':
            step = data
            if not step.parent_id:
                self.display.update_step(step.id, completed=0)
        
        elif event_type == 'step_completed':
            step = data
            if not step.parent_id:
                self.display.complete_step(step.id)
        
        elif event_type == 'step_failed':
            step = data
            if not step.parent_id:
                error = step.metadata.get('error')
                self.display.fail_step(step.id, error)
        
        elif event_type == 'progress_updated':
            step = data
            if not step.parent_id:
                self.display.update_step(step.id, completed=step.progress * 100)
        
        elif event_type == 'milestone':
            milestone = data
            self.display.print_milestone(milestone)


def track_workflow(
    workflow_id: Optional[str] = None,
    workflow_type: str = "generic",
    enable_display: bool = True,
    enable_history: bool = True
):
    """
    Decorator for tracking workflow functions.
    
    Args:
        workflow_id: Unique workflow identifier (uses function name if not provided)
        workflow_type: Workflow type
        enable_display: Enable progress display
        enable_history: Enable history logging
    
    Returns:
        Decorated function
    
    Example:
        @track_workflow(workflow_type="data-processing")
        def process_data():
            # Workflow is automatically tracked
            pass
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            wf_id = workflow_id or f"{func.__name__}"
            
            with WorkflowContext(
                wf_id,
                workflow_type,
                enable_display,
                enable_history
            ) as ctx:
                # Pass context to function if it accepts it
                import inspect
                sig = inspect.signature(func)
                
                if 'workflow_context' in sig.parameters:
                    kwargs['workflow_context'] = ctx
                
                return func(*args, **kwargs)
        
        return wrapper
    return decorator


class WorkflowHooks:
    """
    Hook system for workflow integration.
    
    Allows external systems to register callbacks for workflow events.
    """
    
    def __init__(self):
        """Initialize hooks."""
        self.hooks: Dict[str, list] = {
            'before_workflow': [],
            'after_workflow': [],
            'before_step': [],
            'after_step': [],
            'on_error': [],
            'on_milestone': [],
            'on_bottleneck': []
        }
    
    def register(self, hook_name: str, callback: Callable):
        """
        Register a hook callback.
        
        Args:
            hook_name: Name of hook
            callback: Function to call
        """
        if hook_name not in self.hooks:
            raise ValueError(f"Unknown hook: {hook_name}")
        
        self.hooks[hook_name].append(callback)
    
    def trigger(self, hook_name: str, *args, **kwargs):
        """
        Trigger a hook.
        
        Args:
            hook_name: Hook to trigger
            *args, **kwargs: Arguments for callbacks
        """
        if hook_name not in self.hooks:
            return
        
        for callback in self.hooks[hook_name]:
            try:
                callback(*args, **kwargs)
            except Exception as e:
                print(f"Error in hook {hook_name}: {e}")
    
    def clear(self, hook_name: Optional[str] = None):
        """
        Clear hooks.
        
        Args:
            hook_name: Specific hook to clear, or all if None
        """
        if hook_name:
            self.hooks[hook_name] = []
        else:
            for key in self.hooks:
                self.hooks[key] = []


# Global hooks instance
_global_hooks = WorkflowHooks()


def get_global_hooks() -> WorkflowHooks:
    """Get global hooks instance."""
    return _global_hooks

