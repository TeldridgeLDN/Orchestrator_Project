"""
Workflow Progress Tracker

A comprehensive system for tracking workflow progress with:
- Real-time visualization
- Time estimation
- Bottleneck detection
- History logging
"""

from .tracker import (
    WorkflowTracker,
    WorkflowStep,
    WorkflowState,
    Milestone,
    MilestoneType
)
from .display import WorkflowDisplay, SimpleProgressDisplay
from .history import WorkflowHistory, WorkflowHistoryEntry, StepHistoryEntry
from .estimator import TimeEstimator, TimeEstimate

__version__ = "1.0.0"

__all__ = [
    # Core
    'WorkflowTracker',
    'WorkflowStep',
    'WorkflowState',
    'Milestone',
    'MilestoneType',
    
    # Display
    'WorkflowDisplay',
    'SimpleProgressDisplay',
    
    # History
    'WorkflowHistory',
    'WorkflowHistoryEntry',
    'StepHistoryEntry',
    
    # Estimation
    'TimeEstimator',
    'TimeEstimate',
]

