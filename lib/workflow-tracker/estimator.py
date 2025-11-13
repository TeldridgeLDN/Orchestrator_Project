"""
Workflow Time Estimation

Calculates time remaining using historical data and provides accurate ETA.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass

from .tracker import WorkflowTracker, WorkflowStep, WorkflowState
from .history import WorkflowHistory


@dataclass
class TimeEstimate:
    """Time estimation result."""
    estimated_total: Optional[float]  # Total estimated duration (seconds)
    estimated_remaining: Optional[float]  # Remaining time (seconds)
    eta: Optional[datetime]  # Estimated completion time
    confidence: float  # Confidence level (0.0 to 1.0)
    based_on_samples: int  # Number of historical samples used
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'estimated_total': self.estimated_total,
            'estimated_remaining': self.estimated_remaining,
            'eta': self.eta.isoformat() if self.eta else None,
            'confidence': self.confidence,
            'based_on_samples': self.based_on_samples
        }


class TimeEstimator:
    """
    Workflow time estimation engine.
    
    Features:
    - Historical data analysis
    - Real-time ETA calculation
    - Confidence scoring
    - Adaptive estimation
    """
    
    def __init__(self, history: WorkflowHistory):
        """
        Initialize estimator.
        
        Args:
            history: Workflow history manager
        """
        self.history = history
        self.min_samples = 3  # Minimum samples for reliable estimates
    
    def estimate_workflow(
        self,
        tracker: WorkflowTracker,
        workflow_type: str = "generic"
    ) -> TimeEstimate:
        """
        Estimate workflow completion time.
        
        Args:
            tracker: Current workflow tracker
            workflow_type: Type of workflow
        
        Returns:
            Time estimation
        """
        # Get historical average
        avg_duration = self.history.get_average_duration(workflow_type)
        
        if avg_duration is None:
            # No historical data - use configured estimates
            return self._estimate_from_steps(tracker)
        
        # Calculate current progress
        progress = tracker.get_overall_progress()
        
        if progress == 0:
            # Just started - use historical average
            estimated_total = avg_duration
            estimated_remaining = avg_duration
            confidence = 0.5  # Medium confidence for new workflow
        
        elif tracker.start_time:
            # In progress - calculate based on actual vs expected
            elapsed = (datetime.now() - tracker.start_time).total_seconds()
            
            # Estimate total based on current velocity
            if progress > 0:
                estimated_total = elapsed / progress
                estimated_remaining = estimated_total - elapsed
            else:
                estimated_total = avg_duration
                estimated_remaining = avg_duration
            
            # Adjust confidence based on progress
            confidence = min(0.9, 0.5 + (progress * 0.4))
        
        else:
            estimated_total = avg_duration
            estimated_remaining = avg_duration
            confidence = 0.5
        
        # Calculate ETA
        eta = datetime.now() + timedelta(seconds=estimated_remaining) if estimated_remaining else None
        
        # Count historical samples
        samples = len(self.history.get_workflow_history(workflow_type, limit=20))
        
        # Reduce confidence if not enough samples
        if samples < self.min_samples:
            confidence *= (samples / self.min_samples)
        
        return TimeEstimate(
            estimated_total=estimated_total,
            estimated_remaining=max(0, estimated_remaining),
            eta=eta,
            confidence=confidence,
            based_on_samples=samples
        )
    
    def estimate_step(
        self,
        step: WorkflowStep,
        tracker: WorkflowTracker
    ) -> TimeEstimate:
        """
        Estimate step completion time.
        
        Args:
            step: Step to estimate
            tracker: Parent workflow tracker
        
        Returns:
            Time estimation
        """
        # Try historical average first
        avg_duration = self.history.get_average_step_duration(step.title)
        
        if avg_duration is None:
            # No history - use configured estimate
            estimated_total = step.estimated_duration or 60.0  # Default 60s
            confidence = 0.3  # Low confidence
            samples = 0
        else:
            estimated_total = avg_duration
            samples = len(self.history.get_step_history(step.title, limit=20))
            confidence = min(0.9, 0.5 + (samples / 10) * 0.4)
        
        # Calculate remaining time based on progress
        if step.state == WorkflowState.IN_PROGRESS and step.start_time:
            elapsed = (datetime.now() - step.start_time).total_seconds()
            
            if step.progress > 0:
                # Estimate based on current velocity
                estimated_total = elapsed / step.progress
                estimated_remaining = estimated_total - elapsed
                
                # Increase confidence as we progress
                confidence = min(0.95, confidence + (step.progress * 0.2))
            else:
                estimated_remaining = estimated_total
        
        elif step.state == WorkflowState.COMPLETED:
            estimated_remaining = 0.0
            confidence = 1.0
        
        else:
            estimated_remaining = estimated_total
        
        # Calculate ETA
        eta = datetime.now() + timedelta(seconds=estimated_remaining) if estimated_remaining else None
        
        return TimeEstimate(
            estimated_total=estimated_total,
            estimated_remaining=max(0, estimated_remaining),
            eta=eta,
            confidence=confidence,
            based_on_samples=samples
        )
    
    def _estimate_from_steps(self, tracker: WorkflowTracker) -> TimeEstimate:
        """
        Estimate workflow time from individual step estimates.
        
        Args:
            tracker: Workflow tracker
        
        Returns:
            Time estimation
        """
        total_estimated = 0.0
        remaining_estimated = 0.0
        confidence_sum = 0.0
        count = 0
        
        # Only consider top-level steps
        for step in tracker.steps.values():
            if step.parent_id:
                continue
            
            step_estimate = self.estimate_step(step, tracker)
            
            if step_estimate.estimated_total:
                total_estimated += step_estimate.estimated_total
            
            if step_estimate.estimated_remaining:
                remaining_estimated += step_estimate.estimated_remaining
            
            confidence_sum += step_estimate.confidence
            count += 1
        
        avg_confidence = confidence_sum / count if count > 0 else 0.3
        
        # Reduce confidence for step-based estimates
        avg_confidence *= 0.8
        
        eta = datetime.now() + timedelta(seconds=remaining_estimated) if remaining_estimated else None
        
        return TimeEstimate(
            estimated_total=total_estimated if total_estimated > 0 else None,
            estimated_remaining=remaining_estimated if remaining_estimated > 0 else None,
            eta=eta,
            confidence=avg_confidence,
            based_on_samples=0
        )
    
    def detect_deviation(
        self,
        step: WorkflowStep,
        threshold: float = 1.2
    ) -> Optional[Dict[str, Any]]:
        """
        Detect if step is taking significantly longer than expected.
        
        Args:
            step: Step to check
            threshold: Deviation threshold (e.g., 1.2 = 20% longer)
        
        Returns:
            Deviation info if detected, None otherwise
        """
        if step.state != WorkflowState.IN_PROGRESS or not step.start_time:
            return None
        
        # Get expected duration
        avg_duration = self.history.get_average_step_duration(step.title)
        
        if avg_duration is None:
            avg_duration = step.estimated_duration
        
        if avg_duration is None:
            return None
        
        # Check current duration
        current_duration = (datetime.now() - step.start_time).total_seconds()
        
        if current_duration > avg_duration * threshold:
            deviation_pct = ((current_duration / avg_duration) - 1) * 100
            
            return {
                'step_id': step.id,
                'step_title': step.title,
                'expected_duration': avg_duration,
                'current_duration': current_duration,
                'deviation_percent': deviation_pct,
                'threshold_percent': (threshold - 1) * 100
            }
        
        return None
    
    def get_bottlenecks(
        self,
        tracker: WorkflowTracker,
        threshold: float = 1.2
    ) -> List[Dict[str, Any]]:
        """
        Identify all current bottlenecks in workflow.
        
        Args:
            tracker: Workflow tracker
            threshold: Deviation threshold
        
        Returns:
            List of bottleneck info
        """
        bottlenecks = []
        
        for step in tracker.steps.values():
            deviation = self.detect_deviation(step, threshold)
            if deviation:
                bottlenecks.append(deviation)
        
        return bottlenecks

