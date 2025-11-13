"""
Workflow Progress Tracker - Core Engine

Manages workflow states, multi-level progress tracking, and milestone notifications.
"""

from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Callable, Any
from pathlib import Path
import json
import uuid


class WorkflowState(Enum):
    """Workflow execution states."""
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class MilestoneType(Enum):
    """Types of workflow milestones."""
    STARTED = "started"
    STEP_COMPLETE = "step_complete"
    HALFWAY = "halfway"
    ALMOST_DONE = "almost_done"
    COMPLETED = "completed"
    FAILED = "failed"
    BOTTLENECK = "bottleneck"


@dataclass
class WorkflowStep:
    """Individual step within a workflow."""
    id: str
    title: str
    description: str = ""
    state: WorkflowState = WorkflowState.PENDING
    progress: float = 0.0  # 0.0 to 1.0
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration: Optional[float] = None  # seconds
    estimated_duration: Optional[float] = None  # seconds
    parent_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def start(self):
        """Mark step as started."""
        self.state = WorkflowState.IN_PROGRESS
        self.start_time = datetime.now()
        self.progress = 0.0
    
    def complete(self):
        """Mark step as completed."""
        self.state = WorkflowState.COMPLETED
        self.end_time = datetime.now()
        self.progress = 1.0
        if self.start_time:
            self.duration = (self.end_time - self.start_time).total_seconds()
    
    def fail(self, error: Optional[str] = None):
        """Mark step as failed."""
        self.state = WorkflowState.FAILED
        self.end_time = datetime.now()
        if error:
            self.metadata['error'] = error
        if self.start_time:
            self.duration = (self.end_time - self.start_time).total_seconds()
    
    def pause(self):
        """Pause step execution."""
        self.state = WorkflowState.PAUSED
    
    def resume(self):
        """Resume paused step."""
        if self.state == WorkflowState.PAUSED:
            self.state = WorkflowState.IN_PROGRESS
    
    def update_progress(self, progress: float):
        """Update step progress (0.0 to 1.0)."""
        self.progress = max(0.0, min(1.0, progress))
    
    def is_complete(self) -> bool:
        """Check if step is complete."""
        return self.state == WorkflowState.COMPLETED
    
    def is_running(self) -> bool:
        """Check if step is currently running."""
        return self.state == WorkflowState.IN_PROGRESS


@dataclass
class Milestone:
    """Workflow milestone event."""
    type: MilestoneType
    timestamp: datetime
    message: str
    workflow_id: str
    step_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class WorkflowTracker:
    """
    Core workflow progress tracking engine.
    
    Features:
    - Multi-level progress tracking (parent/substeps)
    - State management
    - Milestone notifications
    - Time tracking
    - Progress callbacks
    """
    
    def __init__(self, workflow_id: Optional[str] = None):
        """
        Initialize workflow tracker.
        
        Args:
            workflow_id: Unique workflow identifier (auto-generated if not provided)
        """
        self.workflow_id = workflow_id or str(uuid.uuid4())
        self.steps: Dict[str, WorkflowStep] = {}
        self.step_order: List[str] = []
        self.milestones: List[Milestone] = []
        self.callbacks: List[Callable] = []
        
        self.state = WorkflowState.PENDING
        self.start_time: Optional[datetime] = None
        self.end_time: Optional[datetime] = None
        self.duration: Optional[float] = None
        
        self.metadata: Dict[str, Any] = {}
    
    def add_step(
        self,
        step_id: str,
        title: str,
        description: str = "",
        parent_id: Optional[str] = None,
        estimated_duration: Optional[float] = None
    ) -> WorkflowStep:
        """
        Add a step to the workflow.
        
        Args:
            step_id: Unique step identifier
            title: Step title
            description: Step description
            parent_id: Parent step ID for nested steps
            estimated_duration: Estimated duration in seconds
        
        Returns:
            Created WorkflowStep
        """
        step = WorkflowStep(
            id=step_id,
            title=title,
            description=description,
            parent_id=parent_id,
            estimated_duration=estimated_duration
        )
        
        self.steps[step_id] = step
        self.step_order.append(step_id)
        
        return step
    
    def get_step(self, step_id: str) -> Optional[WorkflowStep]:
        """Get a step by ID."""
        return self.steps.get(step_id)
    
    def start_workflow(self):
        """Start the workflow."""
        self.state = WorkflowState.IN_PROGRESS
        self.start_time = datetime.now()
        
        self._emit_milestone(
            MilestoneType.STARTED,
            f"Workflow {self.workflow_id} started"
        )
    
    def start_step(self, step_id: str):
        """
        Start a workflow step.
        
        Args:
            step_id: Step to start
        """
        step = self.get_step(step_id)
        if not step:
            raise ValueError(f"Step {step_id} not found")
        
        step.start()
        self._trigger_callbacks('step_started', step)
    
    def complete_step(self, step_id: str):
        """
        Complete a workflow step.
        
        Args:
            step_id: Step to complete
        """
        step = self.get_step(step_id)
        if not step:
            raise ValueError(f"Step {step_id} not found")
        
        step.complete()
        
        self._emit_milestone(
            MilestoneType.STEP_COMPLETE,
            f"Step '{step.title}' completed",
            step_id=step_id
        )
        
        # Check overall progress
        self._check_milestones()
        
        self._trigger_callbacks('step_completed', step)
    
    def fail_step(self, step_id: str, error: Optional[str] = None):
        """
        Fail a workflow step.
        
        Args:
            step_id: Step that failed
            error: Error message
        """
        step = self.get_step(step_id)
        if not step:
            raise ValueError(f"Step {step_id} not found")
        
        step.fail(error)
        
        self._emit_milestone(
            MilestoneType.FAILED,
            f"Step '{step.title}' failed: {error or 'Unknown error'}",
            step_id=step_id
        )
        
        self._trigger_callbacks('step_failed', step)
    
    def update_step_progress(self, step_id: str, progress: float):
        """
        Update step progress.
        
        Args:
            step_id: Step to update
            progress: Progress value (0.0 to 1.0)
        """
        step = self.get_step(step_id)
        if not step:
            raise ValueError(f"Step {step_id} not found")
        
        step.update_progress(progress)
        self._trigger_callbacks('progress_updated', step)
    
    def complete_workflow(self):
        """Complete the workflow."""
        self.state = WorkflowState.COMPLETED
        self.end_time = datetime.now()
        
        if self.start_time:
            self.duration = (self.end_time - self.start_time).total_seconds()
        
        self._emit_milestone(
            MilestoneType.COMPLETED,
            f"Workflow {self.workflow_id} completed in {self.duration:.2f}s"
        )
        
        self._trigger_callbacks('workflow_completed', self)
    
    def fail_workflow(self, error: str):
        """
        Fail the workflow.
        
        Args:
            error: Error message
        """
        self.state = WorkflowState.FAILED
        self.end_time = datetime.now()
        self.metadata['error'] = error
        
        if self.start_time:
            self.duration = (self.end_time - self.start_time).total_seconds()
        
        self._emit_milestone(
            MilestoneType.FAILED,
            f"Workflow {self.workflow_id} failed: {error}"
        )
        
        self._trigger_callbacks('workflow_failed', self)
    
    def get_overall_progress(self) -> float:
        """
        Calculate overall workflow progress.
        
        Returns:
            Progress value (0.0 to 1.0)
        """
        if not self.steps:
            return 0.0
        
        # Calculate weighted progress (top-level steps only)
        top_level_steps = [s for s in self.steps.values() if not s.parent_id]
        
        if not top_level_steps:
            return 0.0
        
        total_progress = sum(step.progress for step in top_level_steps)
        return total_progress / len(top_level_steps)
    
    def get_substeps(self, parent_id: str) -> List[WorkflowStep]:
        """
        Get all substeps for a parent step.
        
        Args:
            parent_id: Parent step ID
        
        Returns:
            List of substeps
        """
        return [
            step for step in self.steps.values()
            if step.parent_id == parent_id
        ]
    
    def add_callback(self, callback: Callable):
        """
        Add a progress callback.
        
        Args:
            callback: Function to call on progress events
                      Signature: callback(event_type, data)
        """
        self.callbacks.append(callback)
    
    def _trigger_callbacks(self, event_type: str, data: Any):
        """Trigger all registered callbacks."""
        for callback in self.callbacks:
            try:
                callback(event_type, data)
            except Exception as e:
                print(f"Error in callback: {e}")
    
    def _emit_milestone(
        self,
        milestone_type: MilestoneType,
        message: str,
        step_id: Optional[str] = None
    ):
        """Emit a milestone event."""
        milestone = Milestone(
            type=milestone_type,
            timestamp=datetime.now(),
            message=message,
            workflow_id=self.workflow_id,
            step_id=step_id
        )
        
        self.milestones.append(milestone)
        self._trigger_callbacks('milestone', milestone)
    
    def _check_milestones(self):
        """Check and emit progress milestones."""
        progress = self.get_overall_progress()
        
        # Halfway milestone
        if 0.45 <= progress < 0.55 and not self._has_milestone(MilestoneType.HALFWAY):
            self._emit_milestone(
                MilestoneType.HALFWAY,
                f"Workflow {self.workflow_id} is halfway complete"
            )
        
        # Almost done milestone
        if 0.85 <= progress < 0.95 and not self._has_milestone(MilestoneType.ALMOST_DONE):
            self._emit_milestone(
                MilestoneType.ALMOST_DONE,
                f"Workflow {self.workflow_id} is almost done"
            )
    
    def _has_milestone(self, milestone_type: MilestoneType) -> bool:
        """Check if a milestone type has been emitted."""
        return any(m.type == milestone_type for m in self.milestones)
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Export workflow state to dictionary.
        
        Returns:
            Dictionary representation
        """
        return {
            'workflow_id': self.workflow_id,
            'state': self.state.value,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration': self.duration,
            'progress': self.get_overall_progress(),
            'steps': {
                step_id: {
                    'id': step.id,
                    'title': step.title,
                    'description': step.description,
                    'state': step.state.value,
                    'progress': step.progress,
                    'start_time': step.start_time.isoformat() if step.start_time else None,
                    'end_time': step.end_time.isoformat() if step.end_time else None,
                    'duration': step.duration,
                    'estimated_duration': step.estimated_duration,
                    'parent_id': step.parent_id,
                    'metadata': step.metadata
                }
                for step_id, step in self.steps.items()
            },
            'milestones': [
                {
                    'type': m.type.value,
                    'timestamp': m.timestamp.isoformat(),
                    'message': m.message,
                    'workflow_id': m.workflow_id,
                    'step_id': m.step_id,
                    'metadata': m.metadata
                }
                for m in self.milestones
            ],
            'metadata': self.metadata
        }
    
    def save(self, file_path: Path):
        """
        Save workflow state to JSON file.
        
        Args:
            file_path: Path to save file
        """
        with open(file_path, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)

