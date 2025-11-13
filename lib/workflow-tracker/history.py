"""
Workflow History Logging

JSON-based logging of workflow durations and outcomes for future ETA calculations.
"""

from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
import json
from dataclasses import dataclass, field

from .tracker import WorkflowTracker, WorkflowStep, WorkflowState


@dataclass
class WorkflowHistoryEntry:
    """Single workflow execution history entry."""
    workflow_id: str
    workflow_type: str
    state: str
    start_time: str
    end_time: Optional[str]
    duration: Optional[float]
    step_count: int
    completed_steps: int
    failed_steps: int
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'workflow_id': self.workflow_id,
            'workflow_type': self.workflow_type,
            'state': self.state,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'duration': self.duration,
            'step_count': self.step_count,
            'completed_steps': self.completed_steps,
            'failed_steps': self.failed_steps,
            'metadata': self.metadata
        }


@dataclass
class StepHistoryEntry:
    """Single step execution history entry."""
    step_id: str
    step_title: str
    workflow_id: str
    state: str
    duration: Optional[float]
    parent_id: Optional[str]
    timestamp: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'step_id': self.step_id,
            'step_title': self.step_title,
            'workflow_id': self.workflow_id,
            'state': self.state,
            'duration': self.duration,
            'parent_id': self.parent_id,
            'timestamp': self.timestamp,
            'metadata': self.metadata
        }


class WorkflowHistory:
    """
    Workflow execution history manager.
    
    Features:
    - JSON-based persistence
    - Workflow and step duration tracking
    - Historical statistics
    - Query and retrieval
    """
    
    def __init__(self, history_file: Optional[Path] = None):
        """
        Initialize history manager.
        
        Args:
            history_file: Path to history file (default: ~/.workflow-history.json)
        """
        if history_file is None:
            self.history_file = Path.home() / '.workflow-history.json'
        else:
            self.history_file = Path(history_file)
        
        self.workflows: List[WorkflowHistoryEntry] = []
        self.steps: List[StepHistoryEntry] = []
        
        self._load()
    
    def _load(self):
        """Load history from file."""
        if not self.history_file.exists():
            return
        
        try:
            with open(self.history_file, 'r') as f:
                data = json.load(f)
                
                # Load workflows
                for wf_data in data.get('workflows', []):
                    self.workflows.append(WorkflowHistoryEntry(**wf_data))
                
                # Load steps
                for step_data in data.get('steps', []):
                    self.steps.append(StepHistoryEntry(**step_data))
        
        except Exception as e:
            print(f"Error loading history: {e}")
            self.workflows = []
            self.steps = []
    
    def _save(self):
        """Save history to file."""
        # Ensure parent directory exists
        self.history_file.parent.mkdir(parents=True, exist_ok=True)
        
        data = {
            'version': '1.0',
            'last_updated': datetime.now().isoformat(),
            'workflows': [wf.to_dict() for wf in self.workflows],
            'steps': [step.to_dict() for step in self.steps]
        }
        
        with open(self.history_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def log_workflow(self, tracker: WorkflowTracker, workflow_type: str = "generic"):
        """
        Log a workflow execution.
        
        Args:
            tracker: Workflow tracker to log
            workflow_type: Type/category of workflow
        """
        entry = WorkflowHistoryEntry(
            workflow_id=tracker.workflow_id,
            workflow_type=workflow_type,
            state=tracker.state.value,
            start_time=tracker.start_time.isoformat() if tracker.start_time else datetime.now().isoformat(),
            end_time=tracker.end_time.isoformat() if tracker.end_time else None,
            duration=tracker.duration,
            step_count=len(tracker.steps),
            completed_steps=sum(1 for s in tracker.steps.values() if s.is_complete()),
            failed_steps=sum(1 for s in tracker.steps.values() if s.state == WorkflowState.FAILED),
            metadata=tracker.metadata
        )
        
        self.workflows.append(entry)
        
        # Log all steps
        for step in tracker.steps.values():
            self.log_step(step, tracker.workflow_id)
        
        self._save()
    
    def log_step(self, step: WorkflowStep, workflow_id: str):
        """
        Log a step execution.
        
        Args:
            step: Step to log
            workflow_id: Parent workflow ID
        """
        entry = StepHistoryEntry(
            step_id=step.id,
            step_title=step.title,
            workflow_id=workflow_id,
            state=step.state.value,
            duration=step.duration,
            parent_id=step.parent_id,
            timestamp=datetime.now().isoformat(),
            metadata=step.metadata
        )
        
        self.steps.append(entry)
    
    def get_workflow_history(
        self,
        workflow_type: Optional[str] = None,
        limit: int = 100
    ) -> List[WorkflowHistoryEntry]:
        """
        Get workflow history.
        
        Args:
            workflow_type: Filter by workflow type
            limit: Maximum number of entries
        
        Returns:
            List of workflow history entries
        """
        entries = self.workflows
        
        if workflow_type:
            entries = [e for e in entries if e.workflow_type == workflow_type]
        
        # Return most recent first
        return list(reversed(entries[-limit:]))
    
    def get_step_history(
        self,
        step_title: Optional[str] = None,
        workflow_id: Optional[str] = None,
        limit: int = 100
    ) -> List[StepHistoryEntry]:
        """
        Get step history.
        
        Args:
            step_title: Filter by step title
            workflow_id: Filter by workflow ID
            limit: Maximum number of entries
        
        Returns:
            List of step history entries
        """
        entries = self.steps
        
        if step_title:
            entries = [e for e in entries if e.step_title == step_title]
        
        if workflow_id:
            entries = [e for e in entries if e.workflow_id == workflow_id]
        
        return list(reversed(entries[-limit:]))
    
    def get_average_duration(
        self,
        workflow_type: Optional[str] = None,
        last_n: int = 10
    ) -> Optional[float]:
        """
        Calculate average workflow duration.
        
        Args:
            workflow_type: Filter by workflow type
            last_n: Number of recent workflows to average
        
        Returns:
            Average duration in seconds, or None if no data
        """
        entries = self.get_workflow_history(workflow_type, limit=last_n)
        
        # Filter to completed workflows with duration
        completed = [
            e for e in entries
            if e.state == WorkflowState.COMPLETED.value and e.duration is not None
        ]
        
        if not completed:
            return None
        
        return sum(e.duration for e in completed) / len(completed)
    
    def get_average_step_duration(
        self,
        step_title: str,
        last_n: int = 20
    ) -> Optional[float]:
        """
        Calculate average step duration.
        
        Args:
            step_title: Step title to analyze
            last_n: Number of recent steps to average
        
        Returns:
            Average duration in seconds, or None if no data
        """
        entries = self.get_step_history(step_title, limit=last_n)
        
        # Filter to completed steps with duration
        completed = [
            e for e in entries
            if e.state == WorkflowState.COMPLETED.value and e.duration is not None
        ]
        
        if not completed:
            return None
        
        return sum(e.duration for e in completed) / len(completed)
    
    def get_stats(self, workflow_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Get workflow statistics.
        
        Args:
            workflow_type: Filter by workflow type
        
        Returns:
            Dictionary of statistics
        """
        entries = self.get_workflow_history(workflow_type)
        
        if not entries:
            return {
                'total_workflows': 0,
                'completed': 0,
                'failed': 0,
                'average_duration': None,
                'success_rate': 0.0
            }
        
        completed = [e for e in entries if e.state == WorkflowState.COMPLETED.value]
        failed = [e for e in entries if e.state == WorkflowState.FAILED.value]
        
        durations = [e.duration for e in completed if e.duration is not None]
        avg_duration = sum(durations) / len(durations) if durations else None
        
        return {
            'total_workflows': len(entries),
            'completed': len(completed),
            'failed': len(failed),
            'average_duration': avg_duration,
            'success_rate': len(completed) / len(entries) if entries else 0.0
        }
    
    def clear(self):
        """Clear all history."""
        self.workflows = []
        self.steps = []
        self._save()

